import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

/**
 * REVOGACAO de influencer: onde o botao mora, o que ele diz e o que ele chama.
 *
 * A divida que este arquivo paga: a revogacao funcionava ponta a ponta e nao
 * tinha teste NENHUM. Os testes de influencer que ja existiam em
 * UserDetailModal.test.tsx cobrem so a CONCESSAO (sucesso e erro) e o aviso
 * cruzado no dialogo de Pro, entao nada segurava nem o endpoint chamado nem a
 * posicao do botao. Foi o bastante para ele viver ~400 linhas longe do estado
 * que apaga, com o rotulo generico "Revogar acesso", encostado nas destrutivas
 * da assinatura.
 *
 * As duas assercoes que importam aqui sao de LUGAR e de DESTINO: um teste que
 * so procurasse o texto na tela passaria com o botao de volta no rodape.
 */

const fetchMock = vi.hoisted(() => vi.fn());
const toastSpy = vi.hoisted(() => ({ acao: vi.fn(), erro: vi.fn() }));

vi.mock("@/lib/adminApi", () => ({
  adminFetch: (...args: unknown[]) => fetchMock(...args),
}));
vi.mock("@/lib/notify", () => ({
  showActionToast: (...a: unknown[]) => toastSpy.acao(...a),
  showErrorToast: (...a: unknown[]) => toastSpy.erro(...a),
}));

import { UserDetailModal } from "./UserDetailModal";

const INFLUENCER = {
  granted_at: "2026-05-02T12:00:00Z",
  granted_by_name: "Ana Moura",
  granted_by_email: "ana@exemplo.com",
  note: "Parceria de conteúdo.",
};

const ASSINATURA_ATIVA = {
  plan_code: "pro_annual",
  status: "active",
  payment_method: "card",
  renewal_type: "auto",
  created_at: "2026-01-10T12:00:00Z",
  current_period_end: "2027-01-10T12:00:00Z",
  cancel_at_period_end: false,
};

function detalhe(over: Record<string, unknown> = {}) {
  return {
    data: {
      name: "Rafa Lima",
      full_name: "Rafael Lima",
      email: "rafa@exemplo.com",
      gender: null,
      bio: null,
      area_interesse: null,
      nivel_atual: null,
      objetivo: null,
      onboarding_completed: true,
      onboarding_step: 3,
      marketing_opt_in: false,
      marketing_opt_in_at: null,
      welcome_email_sent: true,
      cpf_masked: "***.456.789-**",
      has_cpf: true,
      avatar: { url: null, mode: "icon", moderation_status: "clean" },
      subscription: null,
      cancellation_intent: null,
      influencer: null,
      paid_total_cents: 0,
      is_pro: false,
      pro_source: null,
      activity_status: "active",
      created_at: "2026-07-01T12:00:00Z",
      updated_at: "2026-07-02T12:00:00Z",
      ...over,
    },
  };
}

function rotear(resposta: unknown, extras: Record<string, unknown> = {}) {
  fetchMock.mockImplementation((path: string, init?: { method?: string }) => {
    for (const [chave, valor] of Object.entries(extras)) {
      if (path.includes(chave)) {
        return valor instanceof Error
          ? Promise.reject(valor)
          : Promise.resolve(valor);
      }
    }
    if (path.endsWith("/activity")) {
      return Promise.resolve({ data: { state: "ok", hasData: false } });
    }
    if (init?.method === "POST") return Promise.resolve({ data: {} });
    return Promise.resolve(resposta);
  });
}

async function pronto() {
  await waitFor(() =>
    expect(screen.queryByTestId("user-detail-skeleton")).toBeNull(),
  );
}

function secaoDeStatus() {
  return screen.getByTestId("influencer-status");
}

function rodape() {
  return document.querySelector("footer") as HTMLElement;
}

beforeEach(() => {
  fetchMock.mockReset();
  toastSpy.acao.mockReset();
  toastSpy.erro.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("revogar influencer mora na secao de status", () => {
  it("o botao esta DENTRO da secao de status, nao no rodape", async () => {
    rotear(detalhe({ influencer: INFLUENCER, is_pro: true }));

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    // ANCESTRALIDADE, nao presenca: o botao tem de estar contido no mesmo
    // elemento que mostra "Desde ...", que e o estado que ele apaga.
    const secao = secaoDeStatus();
    expect(
      within(secao).getByRole("button", {
        name: "Revogar acesso de influencer",
      }),
    ).toBeTruthy();
    expect(within(secao).getByText(/Desde /)).toBeTruthy();

    // E o CONTROLE NEGATIVO: nada de influencer sobrou no rodape.
    expect(
      within(rodape()).queryByRole("button", {
        name: /influencer/i,
      }),
    ).toBeNull();
  });

  it("confirmar dispara POST no endpoint de influencer", async () => {
    rotear(detalhe({ influencer: INFLUENCER, is_pro: true }));

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    fireEvent.click(
      within(secaoDeStatus()).getByRole("button", {
        name: "Revogar acesso de influencer",
      }),
    );

    // Duas etapas: o primeiro clique so revela a confirmacao.
    const confirmar = within(secaoDeStatus()).getByRole("button", {
      name: "Confirmar revogação de influencer",
    });
    expect(
      within(secaoDeStatus()).getByRole("button", { name: "Manter acesso" }),
    ).toBeTruthy();
    expect(
      fetchMock.mock.calls.filter(
        (c) => typeof c[0] === "string" && c[0].includes("/revoke"),
      ),
    ).toEqual([]);

    fireEvent.click(confirmar);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/users/u1/influencer/revoke", {
        method: "POST",
      }),
    );
    await waitFor(() => expect(toastSpy.acao).toHaveBeenCalled());
  });

  it("desistir mantem o acesso e nao chama nada", async () => {
    rotear(detalhe({ influencer: INFLUENCER, is_pro: true }));

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    fireEvent.click(
      within(secaoDeStatus()).getByRole("button", {
        name: "Revogar acesso de influencer",
      }),
    );
    fireEvent.click(
      within(secaoDeStatus()).getByRole("button", { name: "Manter acesso" }),
    );

    expect(
      within(secaoDeStatus()).getByRole("button", {
        name: "Revogar acesso de influencer",
      }),
    ).toBeTruthy();
    expect(
      fetchMock.mock.calls.filter(
        (c) => typeof c[0] === "string" && c[0].includes("/revoke"),
      ),
    ).toEqual([]);
  });

  it("NAO CONFUNDE com o encerramento de Pro quando a pessoa tem os dois", async () => {
    // O caso que motivou a frente: influencer E assinante. As duas destrutivas
    // aparecem na mesma tela e cada uma tem de dizer o que derruba.
    rotear(
      detalhe({
        influencer: INFLUENCER,
        subscription: ASSINATURA_ATIVA,
        is_pro: true,
        pro_source: "both",
      }),
    );

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    const doInfluencer = within(secaoDeStatus()).getByRole("button", {
      name: "Revogar acesso de influencer",
    });
    const doPro = within(rodape()).getByRole("button", {
      name: "Encerrar Pro agora",
    });

    // Rotulos distintos, elementos distintos, e cada um na sua casa.
    expect(doInfluencer).not.toBe(doPro);
    expect(secaoDeStatus().contains(doPro)).toBe(false);
    expect(rodape().contains(doInfluencer)).toBe(false);

    // E o rotulo generico que nao dizia o que caia nao existe mais em lugar
    // nenhum do modal.
    expect(screen.queryByRole("button", { name: "Revogar acesso" })).toBeNull();
  });

  it("usuario SEM influencer: rodape oferece conceder e nao ha o que revogar", async () => {
    rotear(detalhe());

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    expect(
      within(rodape()).getByRole("button", { name: "Tornar influencer" }),
    ).toBeTruthy();
    expect(screen.queryByTestId("influencer-status")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Revogar acesso de influencer/i }),
    ).toBeNull();
  });

  it("durante a revogacao o botao fica desabilitado e diz Revogando...", async () => {
    let liberar: (v: unknown) => void = () => {};
    const pendente = new Promise((res) => {
      liberar = res;
    });
    rotear(detalhe({ influencer: INFLUENCER, is_pro: true }), {
      "/influencer/revoke": pendente,
    });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    fireEvent.click(
      within(secaoDeStatus()).getByRole("button", {
        name: "Revogar acesso de influencer",
      }),
    );
    fireEvent.click(
      within(secaoDeStatus()).getByRole("button", {
        name: "Confirmar revogação de influencer",
      }),
    );

    const ocupado = await within(secaoDeStatus()).findByRole("button", {
      name: "Revogando...",
    });
    expect((ocupado as HTMLButtonElement).disabled).toBe(true);
    expect(
      (
        within(secaoDeStatus()).getByRole("button", {
          name: "Manter acesso",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    liberar({ data: {} });
    await waitFor(() => expect(toastSpy.acao).toHaveBeenCalled());
  });
});
