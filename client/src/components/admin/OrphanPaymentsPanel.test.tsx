import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O painel de pagamentos sem assinatura.
 *
 * As duas coisas que estes casos travam, e nenhuma e aparencia:
 *
 * 1. O GATE DA NOTA. Resolver e irreversivel na pratica (a linha sai da lista e
 *    a nota vira a unica memoria do motivo), entao o botao nao pode liberar com
 *    "ok". O servidor revalida, mas descobrir o minimo por 400 e um desenho
 *    ruim.
 * 2. FALHA NAO PODE PARECER LISTA VAZIA. Um erro de carga que renderizasse
 *    "nenhum pagamento orfao" afirmaria ausencia sobre uma leitura que nao
 *    aconteceu, que e a classe de defeito que o CLAUDE.md cataloga.
 */

const adminSpy = vi.hoisted(() => ({ adminFetch: vi.fn() }));
vi.mock("@/lib/adminApi", () => ({
  adminFetch: adminSpy.adminFetch,
}));

import {
  esperaDesde,
  formatarCentavos,
  linkDaSessao,
  notaSuficiente,
  NOTA_MIN_CHARS,
  OrphanPaymentsPanel,
} from "./OrphanPaymentsPanel";

const LINHA = {
  id: "11111111-2222-3333-4444-555555555555",
  stripe_session_id: "cs_live_abc",
  customer_email: "pessoa@exemplo.com",
  plan_id: "pro_monthly",
  amount_total_cents: 2990,
  currency: "brl",
  detected_at: "2026-08-14T05:52:27.955Z",
  last_seen_at: "2026-08-29T05:00:00.000Z",
  expected_provider_subscription_id: "sub_1",
};

const NOTA_OK = "Reembolso integral emitido na Stripe hoje.";

function comLista(linhas: unknown[] = [LINHA]) {
  adminSpy.adminFetch.mockResolvedValue({ data: linhas });
}

async function montar() {
  const utils = render(<OrphanPaymentsPanel />);
  await waitFor(() =>
    expect(adminSpy.adminFetch).toHaveBeenCalledWith(
      "/billing/orphan-payments",
    ),
  );
  return utils;
}

/**
 * ESPERA A LINHA, e so entao clica.
 *
 * `montar()` acima espera o `adminFetch` SER CHAMADO, nao a lista renderizar:
 * entre uma coisa e outra falta a resolucao da promise e o flush do estado do
 * React. Enquanto isto era `getByTestId` sincrono, o teste dependia de esse
 * flush ja ter acontecido, o que e verdade numa maquina ociosa e falso sob
 * carga. Custou uma reprovacao do job `qualidade` no CI (run 33595037198), num
 * commit que nao tocava `client/`: o que mudou foi so o escalonamento dos
 * arquivos de teste, o suficiente para perder a corrida.
 *
 * `findByTestId` espera a linha aparecer. Nenhuma assercao deste arquivo muda;
 * muda so o modo de esperar.
 */
async function abrirModal() {
  fireEvent.click(await screen.findByTestId("orfao-resolver"));
}

function digitarNota(texto: string) {
  fireEvent.change(screen.getByTestId("orfao-nota"), {
    target: { value: texto },
  });
}

function botaoConfirmar(): HTMLButtonElement {
  return screen.getByTestId("orfao-confirmar") as HTMLButtonElement;
}

beforeEach(() => {
  adminSpy.adminFetch.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("regras puras", () => {
  it("a nota so vale a partir do minimo, e o trim conta", () => {
    expect(notaSuficiente("")).toBe(false);
    expect(notaSuficiente("ok")).toBe(false);
    expect(notaSuficiente(" ".repeat(NOTA_MIN_CHARS + 5))).toBe(false);
    expect(notaSuficiente("a".repeat(NOTA_MIN_CHARS))).toBe(true);
    expect(notaSuficiente(`  ${"a".repeat(NOTA_MIN_CHARS)}  `)).toBe(true);
  });

  it("valor ausente NAO vira zero", () => {
    // Zero seria um numero plausivel e indistinguivel de um pagamento de R$ 0.
    expect(formatarCentavos(null)).toBe("valor não registrado");
    expect(formatarCentavos(2990)).toContain("29,90");
  });

  it("o link so aceita id de sessao, e so aponta para a Stripe", () => {
    expect(linkDaSessao("cs_live_abc")).toContain(
      "https://dashboard.stripe.com/",
    );
    expect(linkDaSessao(null)).toBeNull();
    expect(linkDaSessao("")).toBeNull();
    expect(linkDaSessao("javascript:alert(1)")).toBeNull();
    expect(linkDaSessao("sub_1")).toBeNull();
  });

  it("a espera e legivel em horas e em dias", () => {
    const base = new Date("2026-08-30T12:00:00Z");
    expect(esperaDesde("2026-08-30T11:59:00Z", base)).toBe("menos de 1 hora");
    expect(esperaDesde("2026-08-30T11:00:00Z", base)).toBe("1 hora");
    expect(esperaDesde("2026-08-29T12:00:00Z", base)).toBe("1 dia");
    expect(esperaDesde("2026-08-14T12:00:00Z", base)).toBe("16 dias");
    expect(esperaDesde("nao-e-data", base)).toBe("data desconhecida");
  });
});

describe("gate do botao de confirmar", () => {
  beforeEach(() => {
    comLista();
  });

  it("nota vazia deixa o botao bloqueado", async () => {
    await montar();
    await abrirModal();
    expect(botaoConfirmar().disabled).toBe(true);
    expect(botaoConfirmar().getAttribute("aria-disabled")).toBe("true");
  });

  it("nota curta continua bloqueando, e o apoio diz quanto falta", async () => {
    await montar();
    await abrirModal();
    digitarNota("ok");
    expect(botaoConfirmar().disabled).toBe(true);
    const apoio = document.getElementById(
      botaoConfirmar().getAttribute("aria-describedby") ?? "",
    );
    expect(apoio?.textContent ?? "").toMatch(/faltam \d+ caracteres/i);
  });

  it("nota no minimo libera", async () => {
    await montar();
    await abrirModal();
    digitarNota(NOTA_OK);
    expect(botaoConfirmar().disabled).toBe(false);
    expect(botaoConfirmar().getAttribute("aria-disabled")).toBe("false");
  });

  it("clicar bloqueado nao chama a rota de resolucao", async () => {
    await montar();
    await abrirModal();
    fireEvent.click(botaoConfirmar());
    expect(
      adminSpy.adminFetch.mock.calls.filter((c) =>
        String(c[0]).includes("/resolve"),
      ),
    ).toHaveLength(0);
  });

  it("fechar e reabrir ZERA o campo", async () => {
    // O modal nao desmonta ao fechar (devolve null), entao sem o reset a
    // segunda abertura nasceria liberada, sobre outra linha.
    await montar();
    await abrirModal();
    digitarNota(NOTA_OK);
    expect(botaoConfirmar().disabled).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    await abrirModal();

    expect(
      (screen.getByTestId("orfao-nota") as HTMLTextAreaElement).value,
    ).toBe("");
    expect(botaoConfirmar().disabled).toBe(true);
  });
});

describe("estados da lista", () => {
  it("lista vazia diz que nao ha nada em aberto", async () => {
    comLista([]);
    await montar();
    expect(await screen.findByTestId("orfaos-vazio")).toBeTruthy();
  });

  it("FALHA NAO vira lista vazia", async () => {
    // A assercao central deste grupo.
    adminSpy.adminFetch.mockRejectedValue(new Error("500 no servidor"));
    render(<OrphanPaymentsPanel />);

    expect(await screen.findByTestId("orfaos-erro")).toBeTruthy();
    expect(screen.queryByTestId("orfaos-vazio")).toBeNull();
  });

  it("linha sem session_id nao ganha botao de abrir", async () => {
    comLista([{ ...LINHA, stripe_session_id: null }]);
    await montar();
    expect(await screen.findByTestId("orfao-linha")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /abrir/i })).toBeNull();
  });
});

describe("CONTROLE NEGATIVO: o caminho feliz resolve e recarrega", () => {
  it("envia confirmed e a nota, e busca a lista de novo", async () => {
    comLista();
    await montar();
    await abrirModal();
    digitarNota(NOTA_OK);
    fireEvent.click(botaoConfirmar());

    await waitFor(() => {
      const resolve = adminSpy.adminFetch.mock.calls.find((c) =>
        String(c[0]).includes("/resolve"),
      );
      expect(resolve).toBeTruthy();
      expect(String(resolve![0])).toContain(LINHA.id);
      const opts = resolve![1] as { method: string; body: string };
      expect(opts.method).toBe("POST");
      expect(JSON.parse(opts.body)).toEqual({
        confirmed: true,
        note: NOTA_OK,
      });
    });

    // Recarga: a listagem foi chamada de novo depois do POST.
    await waitFor(() => {
      const listagens = adminSpy.adminFetch.mock.calls.filter(
        (c) => c[0] === "/billing/orphan-payments",
      );
      expect(listagens.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("erro na resolucao aparece NO MODAL, e a linha continua la", async () => {
    comLista();
    await montar();
    await abrirModal();
    digitarNota(NOTA_OK);
    adminSpy.adminFetch.mockRejectedValueOnce(
      new Error("Este pagamento já foi resolvido por alguém."),
    );
    fireEvent.click(botaoConfirmar());

    expect(await screen.findByTestId("orfao-modal-erro")).toBeTruthy();
    expect(screen.getByTestId("orfao-nota")).toBeTruthy();
  });
});
