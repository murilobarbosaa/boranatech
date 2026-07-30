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
 * Comportamento do modal depois do redesign (Fatia 3): cabecalho fixo, corpo
 * rolavel, rodape de acoes, toasts para resultado de ACAO e ErrorBlock para
 * erro de CARREGAMENTO.
 *
 * A trava de "nenhum campo sumiu" vive em UserDetailModal.campos.test.tsx.
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

function detalhe(over: Record<string, unknown> = {}) {
  return {
    data: {
      name: "Ana Moura",
      full_name: "Ana Ferreira Moura",
      email: "ana@exemplo.com",
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

// Espera o fim do esqueleto em vez de esperar um texto: o nome do usuario
// aparece DUAS vezes (cabecalho e campo "Nome" da secao Identificacao), entao
// findByText nele e ambiguo por construcao.
async function pronto() {
  await waitFor(() =>
    expect(screen.queryByTestId("user-detail-skeleton")).toBeNull(),
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  toastSpy.acao.mockReset();
  toastSpy.erro.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("cabecalho fixo", () => {
  it("mostra nome, e-mail e o selo de acesso, fora do corpo rolavel", async () => {
    rotear(detalhe({ is_pro: true, pro_source: "influencer" }));

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    const cabecalho = document.querySelector("header");
    expect(cabecalho).not.toBeNull();
    const dentro = within(cabecalho as HTMLElement);
    expect(dentro.getByText("Ana Moura")).toBeTruthy();
    expect(dentro.getByText("ana@exemplo.com")).toBeTruthy();
    // Mesmo resolver da lista: influencer nao pode aparecer como "Pro" nem
    // como "Grátis".
    expect(dentro.getByText("Influencer")).toBeTruthy();

    // Fora do corpo rolavel: o cabecalho nao pode estar dentro do que rola.
    const rolavel = document.querySelector(".overflow-y-auto");
    expect(rolavel?.contains(cabecalho as Node)).toBe(false);
  });

  it("selo do cabecalho acompanha a origem do Pro", async () => {
    rotear(detalhe({ is_pro: true, pro_source: "subscription" }));
    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    const cabecalho = within(document.querySelector("header") as HTMLElement);
    expect(cabecalho.getByText("Pro")).toBeTruthy();
  });
});

describe("fechamento", () => {
  it("Esc fecha", async () => {
    rotear(detalhe());
    const onClose = vi.fn();
    render(<UserDetailModal userId="u1" onClose={onClose} />);
    await pronto();

    fireEvent.keyDown(document.activeElement || document.body, {
      key: "Escape",
      code: "Escape",
    });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("clique FORA nao fecha", async () => {
    // Depois do redesign o DialogContent e uma caixa centralizada, entao existe
    // area de overlay clicavel de verdade: o onInteractOutside deixou de ser
    // redundante e passou a ser o que segura o modal aberto.
    rotear(detalhe());
    const onClose = vi.fn();
    render(<UserDetailModal userId="u1" onClose={onClose} />);
    await pronto();

    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).not.toBeNull();
    fireEvent.pointerDown(overlay as Element);
    fireEvent.mouseDown(overlay as Element);
    fireEvent.click(overlay as Element);

    await new Promise((r) => setTimeout(r, 20));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeNull();
  });

  it("o botao Fechar do rodape fecha", async () => {
    rotear(detalhe());
    const onClose = vi.fn();
    render(<UserDetailModal userId="u1" onClose={onClose} />);
    await pronto();

    const rodape = within(document.querySelector("footer") as HTMLElement);
    fireEvent.click(rodape.getByRole("button", { name: "Fechar" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe("toast para ACAO, inline para CARREGAMENTO", () => {
  it("erro ao CARREGAR o detalhe fica inline, sem toast", async () => {
    fetchMock.mockRejectedValue(new Error("Erro ao buscar usuário."));

    render(<UserDetailModal userId="u1" onClose={() => {}} />);

    expect(await screen.findByText("Erro ao buscar usuário.")).toBeTruthy();
    // O erro pertence a regiao que ficou vazia; um toast sumiria e deixaria o
    // corpo em branco sem explicacao.
    expect(toastSpy.erro).not.toHaveBeenCalled();
  });

  it("erro ao REVELAR CPF vira toast, nao <p> perdido no corpo", async () => {
    rotear(detalhe(), { "reveal-cpf": new Error("Erro ao revelar CPF.") });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: "Revelar CPF" }));

    await waitFor(() =>
      expect(toastSpy.erro).toHaveBeenCalledWith("Erro ao revelar CPF."),
    );
    expect(screen.queryByText("Erro ao revelar CPF.")).toBeNull();
  });

  it("conceder influencer com sucesso confirma por toast", async () => {
    rotear(detalhe());

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: "Tornar influencer" }));
    fireEvent.click(screen.getByRole("button", { name: "Conceder" }));

    await waitFor(() => expect(toastSpy.acao).toHaveBeenCalled());
  });

  it("erro ao conceder influencer vira toast de erro", async () => {
    rotear(detalhe(), {
      "/influencer": new Error("Erro ao conceder acesso de influencer."),
    });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: "Tornar influencer" }));
    fireEvent.click(screen.getByRole("button", { name: "Conceder" }));

    await waitFor(() =>
      expect(toastSpy.erro).toHaveBeenCalledWith(
        "Erro ao conceder acesso de influencer.",
      ),
    );
  });

  it("erro ao consultar o PostHog continua inline, dentro da secao Atividade", async () => {
    rotear(detalhe(), {
      "/activity": new Error("Erro ao consultar o PostHog."),
    });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));

    expect(
      await screen.findByText("Erro ao consultar o PostHog."),
    ).toBeTruthy();
    expect(toastSpy.erro).not.toHaveBeenCalled();
  });
});

describe("rodape de acoes", () => {
  it("as acoes de influencer moram no rodape, nao no corpo", async () => {
    rotear(detalhe());

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    const rodape = document.querySelector("footer") as HTMLElement;
    expect(
      within(rodape).getByRole("button", { name: "Tornar influencer" }),
    ).toBeTruthy();
  });

  it("nao ha botao desabilitado de reserva para as fatias futuras", async () => {
    rotear(detalhe());

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    const rodape = document.querySelector("footer") as HTMLElement;
    const desabilitados = within(rodape)
      .getAllByRole("button")
      .filter((b) => (b as HTMLButtonElement).disabled);
    expect(desabilitados).toEqual([]);
  });
});

describe("carregamento", () => {
  it("mostra esqueleto enquanto busca, nao a caixa generica", async () => {
    // Resolve POR ROTA: o modal dispara duas requisicoes (detalhe e extrato) e
    // um unico `resolver` compartilhado seria sobrescrito pela segunda,
    // deixando o detalhe pendente para sempre.
    let resolverDetalhe!: (v: unknown) => void;
    fetchMock.mockImplementation((path: string) => {
      if (path.includes("/transactions")) {
        return Promise.resolve({
          data: {
            items: [],
            total_paid_cents: 0,
            truncated: false,
            limit: 200,
          },
        });
      }
      return new Promise((r) => {
        resolverDetalhe = r;
      });
    });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);

    expect(screen.getByTestId("user-detail-skeleton")).toBeTruthy();
    expect(screen.queryByText("Carregando dados...")).toBeNull();

    resolverDetalhe(detalhe());
    await pronto();
    expect(screen.queryByTestId("user-detail-skeleton")).toBeNull();
  });
});

describe("dropdown Mais informacoes", () => {
  // BUG PRE-EXISTENTE (desde antes da Fatia 0, commit 78c62da): o efeito do
  // fetch preguicoso tinha `activityRequested` nas PROPRIAS dependencias e o
  // setava no corpo. Setar re-rodava o efeito, a limpeza da primeira execucao
  // marcava cancelled = true, e .then/.catch/.finally eram todos descartados.
  // Resultado: a secao Atividade ficava em "Carregando dados..." para sempre,
  // com sucesso ou com erro. Nenhum teste pegava porque so se verificava que o
  // TITULO da secao existia.
  it("aplica o resultado do PostHog em vez de ficar carregando para sempre", async () => {
    rotear(detalhe(), {
      "/activity": {
        data: {
          state: "ok",
          hasData: true,
          activity: {
            features: [{ event: "quiz_completed", count: 3 }],
            navigation: [],
          },
        },
      },
    });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));

    expect(await screen.findByText("quiz_completed")).toBeTruthy();
    expect(screen.queryByText("Carregando dados...")).toBeNull();
  });

  it("busca o PostHog uma unica vez, na primeira abertura", async () => {
    rotear(detalhe());

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    const contar = () =>
      fetchMock.mock.calls.filter((c) => String(c[0]).includes("/activity"))
        .length;
    expect(contar()).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
    await waitFor(() => expect(contar()).toBe(1));

    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
    expect(contar()).toBe(1);
  });
});

describe("campo vazio usa a prop explicita, nao o texto", () => {
  it("valor ausente fica esmaecido e valor presente nao", async () => {
    rotear(detalhe({ full_name: null, name: "Ana Moura" }));

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    const vazio = screen.getAllByText("Não informado")[0];
    expect(vazio.className).toContain("text-slate-400");

    const preenchido = screen.getAllByText("Ana Moura").pop() as HTMLElement;
    expect(preenchido.className).toContain("text-slate-950");
  });

  it("um opt-in recusado (false) NAO e tratado como campo vazio", async () => {
    // A armadilha do `empty={!valor}`: "Não" e resposta, nao ausencia.
    rotear(detalhe({ marketing_opt_in: false }));

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
    await screen.findByText("Opt-in de marketing");

    const nao = screen.getAllByText("Não")[0];
    expect(nao.className).toContain("text-slate-950");
    expect(nao.className).not.toContain("text-slate-400");
  });
});

describe("perfil publico (os 6 campos recem-descobertos)", () => {
  it("a secao NAO aparece quando os seis estao vazios, que e 100% dos casos hoje", async () => {
    rotear(detalhe());

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
    await screen.findByText("Perfil e carreira");

    expect(screen.queryByText("Perfil público")).toBeNull();
  });

  it("basta UM campo preenchido para a secao aparecer", async () => {
    rotear(detalhe({ headline: "Dev em transição" }));

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));

    expect(await screen.findByText("Perfil público")).toBeTruthy();
    expect(screen.getByText("Dev em transição")).toBeTruthy();
  });

  it("URL valida vira link com rel de seguranca", async () => {
    rotear(detalhe({ github_url: "https://github.com/ana" }));

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
    await screen.findByText("Perfil público");

    const link = screen.getByRole("link", { name: "https://github.com/ana" });
    expect(link.getAttribute("href")).toBe("https://github.com/ana");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("URL com esquema perigoso NAO vira link: fica texto cru", async () => {
    rotear(detalhe({ website_url: "javascript:alert(1)" }));

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
    await screen.findByText("Perfil público");

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("javascript:alert(1)")).toBeTruthy();
  });

  it("URL sem esquema fica texto cru, sem inventar https", async () => {
    rotear(detalhe({ linkedin_url: "linkedin.com/in/ana" }));

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
    await screen.findByText("Perfil público");

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("linkedin.com/in/ana")).toBeTruthy();
  });

  it("cidade e UF aparecem juntas", async () => {
    rotear(detalhe({ city: "Brasília", uf: "DF" }));

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
    await screen.findByText("Perfil público");

    expect(screen.getByText("Brasília / DF")).toBeTruthy();
  });
});

describe("extrato de compras", () => {
  function extrato(items: Array<Record<string, unknown>>, extra = {}) {
    return {
      data: {
        items,
        total_paid_cents: items.reduce(
          (s, i) => s + Number(i.gross_cents ?? 0),
          0,
        ),
        truncated: false,
        limit: 200,
        ...extra,
      },
    };
  }

  function compra(over: Record<string, unknown> = {}) {
    return {
      id: "ft1",
      type: "charge",
      gross_cents: 22200,
      fee_cents: 500,
      net_cents: 21700,
      currency: "BRL",
      occurred_at: "2026-07-01T12:00:00Z",
      stripe_charge_id: "ch_1",
      stripe_invoice_id: null,
      plan_code: "pro_annual",
      refunded_cents: 0,
      disputed_cents: 0,
      disputed: false,
      refund_state: "none",
      refundable_cents: 22200,
      ...over,
    };
  }

  it("quem nunca pagou ve o vazio, nao um erro nem uma tabela em branco", async () => {
    rotear(detalhe(), { "/transactions": extrato([]) });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    expect(await screen.findByText("Nenhuma compra registrada.")).toBeTruthy();
  });

  it("mostra cobranca, reembolso e disputa com o SINAL, nao o modulo", async () => {
    rotear(detalhe(), {
      "/transactions": extrato([
        compra(),
        compra({
          id: "ft2",
          type: "refund",
          gross_cents: -5000,
          occurred_at: "2026-07-02T12:00:00Z",
        }),
        compra({
          id: "ft3",
          type: "dispute",
          gross_cents: -2990,
          occurred_at: "2026-07-03T12:00:00Z",
        }),
      ]),
    });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    const secao = within(await screen.findByTestId("user-transactions"));

    expect(secao.getByText("R$ 222,00")).toBeTruthy();
    // O menos precisa aparecer: reembolso e saida de dinheiro.
    expect(secao.getByText("-R$ 50,00")).toBeTruthy();
    expect(secao.getByText("-R$ 29,90")).toBeTruthy();
    expect(secao.getByText("Cobrança")).toBeTruthy();
    expect(secao.getByText("Reembolso")).toBeTruthy();
    expect(secao.getByText("Chargeback")).toBeTruthy();
  });

  it("cobranca com reembolso parcial mostra quanto ja voltou", async () => {
    rotear(detalhe(), {
      "/transactions": extrato([
        compra({
          refunded_cents: 5000,
          refund_state: "partial",
          refundable_cents: 17200,
        }),
      ]),
    });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    const secao = within(await screen.findByTestId("user-transactions"));

    expect(secao.getByText(/R\$ 50,00 reembolsados/)).toBeTruthy();
  });

  it("tipo desconhecido do backend nao derruba a secao", async () => {
    rotear(detalhe(), {
      "/transactions": extrato([compra({ type: "transfer_reversal" })]),
    });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    const secao = within(await screen.findByTestId("user-transactions"));

    expect(secao.getByText("transfer_reversal")).toBeTruthy();
  });

  it("truncamento e AVISADO, nunca silencioso", async () => {
    rotear(detalhe(), {
      "/transactions": extrato([compra()], { truncated: true, limit: 200 }),
    });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    expect(await screen.findByText(/primeiras 200/)).toBeTruthy();
  });

  it("erro ao carregar o extrato fica inline, sem toast", async () => {
    rotear(detalhe(), {
      "/transactions": new Error("Erro ao buscar as compras."),
    });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    expect(await screen.findByText("Erro ao buscar as compras.")).toBeTruthy();
    expect(toastSpy.erro).not.toHaveBeenCalled();
  });

  it("nao ha nenhum botao de acao na secao", async () => {
    rotear(detalhe(), { "/transactions": extrato([compra()]) });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    const secao = await screen.findByTestId("user-transactions");

    expect(within(secao).queryAllByRole("button")).toEqual([]);
  });

  it("busca o extrato UMA vez so, junto do detalhe", async () => {
    rotear(detalhe(), { "/transactions": extrato([compra()]) });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await screen.findByTestId("user-transactions");

    const n = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes("/transactions"),
    ).length;
    expect(n).toBe(1);
  });
});

describe("modo de avatar", () => {
  it("modo desconhecido mostra o valor cru em vez de afirmar Ícone", async () => {
    rotear(
      detalhe({
        avatar: { url: null, mode: "gravatar", moderation_status: "clean" },
      }),
    );

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    expect(screen.getByText(/Modo do avatar: gravatar/)).toBeTruthy();
  });
});
