import { useEffect, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

/**
 * Hold do ConsentGate sobre a escrita de consentimento (itens 3.4 e ajuste 3).
 *
 * O que estes testes travam, e por que cada um existe:
 *
 * 1. Enquanto a escrita esta em voo, o gate NAO consulta o /status. Consultar ali
 *    e ler antes da escrita, que e a corrida medida no Passo 2 (50 pessoas viram
 *    o modal com a linha ja gravada, todas com menos de 5s de distancia).
 * 2. A espera tem TETO. Depois do item 3.5, mostrar o modal para quem ja
 *    consentiu ficou inofensivo (ON CONFLICT DO NOTHING preserva o accepted_at),
 *    entao prender a tela passou a ser o pior dos dois males, e no pior momento,
 *    que e o segundo seguinte ao cadastro.
 * 3. A escrita NAO e cancelada quando o teto expira, e se ela concluir depois o
 *    modal fecha SOZINHO. Sem isso, o teto trocaria uma tela presa por um modal
 *    permanente pedindo algo que ja foi feito.
 */

const auth = vi.hoisted(() => ({
  value: {
    session: { user: { id: "u1" }, access_token: "tok" } as unknown,
    signOut: vi.fn(),
    consentWriteInFlight: false,
    consentWriteConfirmed: 0,
  },
}));

// Replicados aqui, nao importados do codigo de producao: teste que le a propria
// constante que testa nao percebe a constante mudando. `vi.hoisted` porque a
// fabrica do vi.mock sobe para o topo do arquivo e nao enxerga variavel comum.
const limiares = vi.hoisted(() => ({ perceivedStallMs: 6_000 }));
const PERCEIVED_STALL_MS = limiares.perceivedStallMs;
const CONSENT_WRITE_HOLD_MS = 10_000;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth.value,
  PERCEIVED_STALL_MS: limiares.perceivedStallMs,
}));

const servico = vi.hoisted(() => ({
  getConsentStatus: vi.fn(),
  recordConsent: vi.fn(),
}));

vi.mock("@/services/consentService", () => ({
  getConsentStatus: servico.getConsentStatus,
  recordConsent: servico.recordConsent,
}));

vi.mock("@/lib/authCallback", () => ({ hasOAuthCallbackInUrl: () => false }));

vi.mock("wouter", () => ({ useLocation: () => ["/perfil", vi.fn()] }));

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

import ConsentGate from "./ConsentGate";

function montar() {
  return render(
    <ConsentGate>
      <div data-testid="app">app liberado</div>
    </ConsentGate>,
  );
}

async function avancar(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

/** Deixa microtasks pendentes resolverem sem mexer no relogio. */
async function assentar() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  // Todo "sim" do servidor grava a marca de consentimento no localStorage. Sem
  // limpar aqui, ela vaza entre casos e o seguinte comeca otimista, sem camada,
  // passando ou falhando conforme a ordem de execucao.
  window.localStorage.clear();
  auth.value.consentWriteInFlight = false;
  auth.value.consentWriteConfirmed = 0;
  servico.getConsentStatus.mockResolvedValue(true);
  servico.recordConsent.mockResolvedValue(undefined);
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("hold enquanto a escrita esta em voo (item 3.4)", () => {
  it("nao consulta o /status enquanto ha escrita em voo", async () => {
    auth.value.consentWriteInFlight = true;
    montar();
    await avancar(1_000);

    expect(servico.getConsentStatus).not.toHaveBeenCalled();
    // Bloqueado continua bloqueado, mas agora por camada e `inert`, e nao pela
    // ausencia dos children (lote Home 02, ver o bloco no fim deste arquivo).
    expect(camada()).toBeTruthy();
    expect(inerte("app")).toBe(true);
  });

  it("consulta assim que a escrita termina, sem esperar o teto", async () => {
    auth.value.consentWriteInFlight = true;
    const { rerender } = montar();
    await avancar(1_000);
    expect(servico.getConsentStatus).not.toHaveBeenCalled();

    auth.value.consentWriteInFlight = false;
    rerender(
      <ConsentGate>
        <div data-testid="app">app liberado</div>
      </ConsentGate>,
    );
    await assentar();

    expect(servico.getConsentStatus).toHaveBeenCalledTimes(1);
  });

  it("sem escrita em voo, consulta na hora (caminho de quem so navega)", async () => {
    montar();
    await assentar();

    expect(servico.getConsentStatus).toHaveBeenCalledTimes(1);
  });
});

describe("o hold tem teto (ajuste 3)", () => {
  it("volta a decidir sozinho depois de CONSENT_WRITE_HOLD_MS", async () => {
    auth.value.consentWriteInFlight = true;
    servico.getConsentStatus.mockResolvedValue(false);
    montar();

    await avancar(CONSENT_WRITE_HOLD_MS - 500);
    expect(servico.getConsentStatus).not.toHaveBeenCalled();

    await avancar(1_000);
    // Passou do teto: consultou mesmo com a escrita ainda em voo, e como o
    // servidor respondeu que nao ha consentimento, pediu.
    expect(servico.getConsentStatus).toHaveBeenCalledTimes(1);
    await assentar();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("a mensagem de progresso aparece so depois de PERCEIVED_STALL_MS", async () => {
    auth.value.consentWriteInFlight = true;
    montar();

    await avancar(PERCEIVED_STALL_MS - 500);
    expect(screen.queryByText(/Registrando/)).toBeNull();

    await avancar(1_000);
    expect(screen.getByText(/Registrando/)).toBeTruthy();
  });

  it("login normal e rapido nunca ve a mensagem", async () => {
    auth.value.consentWriteInFlight = true;
    const { rerender } = montar();
    await avancar(800);

    auth.value.consentWriteInFlight = false;
    rerender(
      <ConsentGate>
        <div data-testid="app">app liberado</div>
      </ConsentGate>,
    );
    await avancar(PERCEIVED_STALL_MS + 1_000);

    expect(screen.queryByText(/Registrando/)).toBeNull();
    expect(screen.getByTestId("app")).toBeTruthy();
  });
});

describe("escrita que conclui DEPOIS do teto fecha o modal sozinha", () => {
  it("modal aberto pelo teto some quando a gravacao confirma", async () => {
    auth.value.consentWriteInFlight = true;
    servico.getConsentStatus.mockResolvedValue(false);
    const { rerender } = montar();

    await avancar(CONSENT_WRITE_HOLD_MS + 500);
    await assentar();
    expect(screen.getByRole("dialog")).toBeTruthy();

    // A escrita, que nunca foi cancelada, finalmente confirma.
    auth.value.consentWriteInFlight = false;
    auth.value.consentWriteConfirmed = 1;
    rerender(
      <ConsentGate>
        <div data-testid="app">app liberado</div>
      </ConsentGate>,
    );
    await assentar();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId("app")).toBeTruthy();
    // E fechou sem gastar outra consulta: o servidor ja tinha respondido.
    expect(servico.getConsentStatus).toHaveBeenCalledTimes(1);
  });

  it("quem realmente nao consentiu continua vendo o modal: sem retry sobre false", async () => {
    servico.getConsentStatus.mockResolvedValue(false);
    montar();

    await assentar();
    expect(screen.getByRole("dialog")).toBeTruthy();
    await avancar(60_000);

    // `false` com a escrita concluida e legitimo e TERMINAL. Uma unica consulta,
    // nenhum loop de reverificacao.
    expect(servico.getConsentStatus).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeTruthy();
  });
});

/**
 * BLOQUEIO SEM DESMONTAR (lote Home 02).
 *
 * Antes, a fase "checking" trocava os children por um spinner de tela cheia: a
 * arvore inteira desmontava quando a sessao resolvia e remontava do zero quando
 * o /status respondia. Era o "reload" percebido na home de quem esta logado.
 *
 * A chave da marca e escrita a mao aqui, e nao importada do codigo: teste que le
 * a propria constante que testa nao percebe a constante mudando.
 */
const MARCA_U1 = "bnt:consent-ok:u1";

const montagens = { total: 0 };

function Filho() {
  const [n, setN] = useState(0);
  useEffect(() => {
    montagens.total += 1;
  }, []);
  return (
    <button
      type="button"
      data-testid="contador"
      onClick={() => setN((v) => v + 1)}
    >
      {n}
    </button>
  );
}

function pendente() {
  let resolver: (valor: boolean) => void = () => {};
  const promessa = new Promise<boolean>((r) => {
    resolver = r;
  });
  return { promessa, resolver };
}

function camada() {
  return screen.queryByTestId("consent-gate-camada");
}

function inerte(testId: string) {
  return screen.getByTestId(testId).closest("[inert]") !== null;
}

describe("bloqueio sem desmontar os children", () => {
  beforeEach(() => {
    window.localStorage.clear();
    montagens.total = 0;
  });

  it("os children NAO desmontam entre a sessao chegar, checking e consented", async () => {
    const { promessa, resolver } = pendente();
    servico.getConsentStatus.mockReturnValue(promessa);
    const sessaoOriginal = auth.value.session;
    auth.value.session = null;

    const { rerender } = render(
      <ConsentGate>
        <Filho />
      </ConsentGate>,
    );
    fireEvent.click(screen.getByTestId("contador"));
    expect(screen.getByTestId("contador").textContent).toBe("1");

    try {
      auth.value.session = sessaoOriginal;
      rerender(
        <ConsentGate>
          <Filho />
        </ConsentGate>,
      );
      await assentar();

      await act(async () => {
        resolver(true);
        await Promise.resolve();
      });

      expect(screen.getByTestId("contador").textContent).toBe("1");
      expect(montagens.total).toBe(1);
    } finally {
      auth.value.session = sessaoOriginal;
    }
  });

  it("em checking o conteudo fica montado, inerte e coberto pela camada", async () => {
    servico.getConsentStatus.mockReturnValue(pendente().promessa);
    montar();
    await assentar();

    expect(camada()).toBeTruthy();
    expect(inerte("app")).toBe(true);
  });

  it("sem marca, nao libera antes da resposta e grava a marca no sim", async () => {
    const { promessa, resolver } = pendente();
    servico.getConsentStatus.mockReturnValue(promessa);
    montar();
    await avancar(3_000);

    expect(camada()).toBeTruthy();
    expect(inerte("app")).toBe(true);
    expect(window.localStorage.getItem(MARCA_U1)).toBeNull();

    await act(async () => {
      resolver(true);
      await Promise.resolve();
    });

    expect(camada()).toBeNull();
    expect(inerte("app")).toBe(false);
    expect(window.localStorage.getItem(MARCA_U1)).toBe("1");
  });

  it("com marca, comeca liberado e confirma em segundo plano", async () => {
    window.localStorage.setItem(MARCA_U1, "1");
    servico.getConsentStatus.mockReturnValue(pendente().promessa);
    montar();

    expect(camada()).toBeNull();
    expect(inerte("app")).toBe(false);
    await assentar();
    expect(servico.getConsentStatus).toHaveBeenCalledTimes(1);
    expect(camada()).toBeNull();
  });

  it("com marca, o primeiro nao do servidor bloqueia na hora e limpa a marca", async () => {
    window.localStorage.setItem(MARCA_U1, "1");
    servico.getConsentStatus.mockResolvedValue(false);
    montar();
    await assentar();

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(camada()).toBeTruthy();
    expect(inerte("app")).toBe(true);
    expect(window.localStorage.getItem(MARCA_U1)).toBeNull();
  });

  it("marca de OUTRO usuario nao acelera ninguem", async () => {
    window.localStorage.setItem("bnt:consent-ok:u2", "1");
    servico.getConsentStatus.mockReturnValue(pendente().promessa);
    montar();
    await assentar();

    expect(camada()).toBeTruthy();
    expect(inerte("app")).toBe(true);
  });
});
