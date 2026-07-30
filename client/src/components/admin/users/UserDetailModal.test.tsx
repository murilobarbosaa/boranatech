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
import { fmtBrl } from "./userFormat";

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

  // Ate a Fatia 6 o extrato era so leitura e este teste afirmava zero botoes. A
  // Fatia 7 acrescenta o reembolso de proposito, entao a assercao foi
  // SUBSTITUIDA pelo contrato novo, nao removida: botao aparece onde ha o que
  // reembolsar, e onde nao ha aparece o ESTADO, nunca um botao morto.
  it("cobranca sem saldo reembolsavel mostra o estado, nao um botao", async () => {
    rotear(detalhe(), {
      "/transactions": extrato([
        compra({
          refunded_cents: 22200,
          refund_state: "full",
          refundable_cents: 0,
        }),
      ]),
    });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    const secao = await screen.findByTestId("user-transactions");

    expect(
      within(secao).queryByRole("button", { name: "Reembolsar" }),
    ).toBeNull();
    expect(within(secao).getByTestId("sem-reembolso").textContent).toContain(
      "Reembolsada",
    );
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

describe("modo de edicao (Fatia 5a)", () => {
  async function entrarEmEdicao() {
    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
  }

  it("o rodape oferece Editar em leitura", async () => {
    rotear(detalhe());
    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    const rodape = within(document.querySelector("footer") as HTMLElement);
    expect(rodape.getByRole("button", { name: "Editar" })).toBeTruthy();
  });

  it("edita um campo e salva, com toast de confirmacao", async () => {
    rotear(detalhe());
    await entrarEmEdicao();

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana Paula" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(toastSpy.acao).toHaveBeenCalled());
    const patch = fetchMock.mock.calls.find(
      (c) => (c[1] as { method?: string })?.method === "PATCH",
    );
    expect(patch).toBeTruthy();
    expect(JSON.parse((patch![1] as { body: string }).body)).toMatchObject({
      name: "Ana Paula",
    });
  });

  it("manda expected_updated_at junto, para a trava otimista", async () => {
    rotear(detalhe());
    await entrarEmEdicao();

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana Paula" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(toastSpy.acao).toHaveBeenCalled());
    const patch = fetchMock.mock.calls.find(
      (c) => (c[1] as { method?: string })?.method === "PATCH",
    )!;
    expect(JSON.parse((patch[1] as { body: string }).body)).toMatchObject({
      expected_updated_at: "2026-07-02T12:00:00Z",
    });
  });

  it("erro de validacao aparece inline, junto do campo, e nao em toast", async () => {
    rotear(detalhe(), {
      PATCH_ERRO: null,
    });
    fetchMock.mockImplementation((path: string, init?: { method?: string }) => {
      if (init?.method === "PATCH") {
        const erro = new Error("O campo headline excede o tamanho máximo.");
        (erro as unknown as { code: string }).code = "invalid_request";
        (erro as unknown as { field: string }).field = "headline";
        return Promise.reject(erro);
      }
      if (path.includes("/transactions"))
        return Promise.resolve({
          data: {
            items: [],
            total_paid_cents: 0,
            truncated: false,
            limit: 200,
          },
        });
      if (path.endsWith("/activity"))
        return Promise.resolve({ data: { state: "ok", hasData: false } });
      return Promise.resolve(detalhe());
    });

    await entrarEmEdicao();
    // Headline vive dentro do dropdown "Mais informações".
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
    fireEvent.change(await screen.findByLabelText("Headline"), {
      target: { value: "x".repeat(200) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByText("Headline precisa ter no máximo 140 caracteres."),
    ).toBeTruthy();
    // Validacao local: nem chegou a chamar o servidor.
    expect(
      fetchMock.mock.calls.some(
        (c) => (c[1] as { method?: string })?.method === "PATCH",
      ),
    ).toBe(false);
  });

  it("Perfil público aparece em EDICAO mesmo com todos os campos nulos", async () => {
    // Em leitura a secao e condicional (100% dos perfis tem os campos nulos
    // hoje). Se continuasse condicional em edicao, nao haveria onde clicar
    // para preencher pela primeira vez.
    rotear(detalhe());
    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
    expect(screen.queryByText("Perfil público")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(await screen.findByText("Perfil público")).toBeTruthy();
  });

  it("botao trava durante o salvamento, contra duplo clique", async () => {
    let liberar!: () => void;
    fetchMock.mockImplementation((path: string, init?: { method?: string }) => {
      if (init?.method === "PATCH")
        return new Promise((r) => {
          liberar = () => r({ data: { updated: true, fields: ["name"] } });
        });
      if (path.includes("/transactions"))
        return Promise.resolve({
          data: {
            items: [],
            total_paid_cents: 0,
            truncated: false,
            limit: 200,
          },
        });
      if (path.endsWith("/activity"))
        return Promise.resolve({ data: { state: "ok", hasData: false } });
      return Promise.resolve(detalhe());
    });

    await entrarEmEdicao();
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana Paula" },
    });
    const salvar = screen.getByRole("button", { name: "Salvar" });
    fireEvent.click(salvar);

    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: "Salvando...",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true),
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvando..." }));

    const patches = fetchMock.mock.calls.filter(
      (c) => (c[1] as { method?: string })?.method === "PATCH",
    );
    expect(patches).toHaveLength(1);
    liberar();
  });
});

describe("guarda de alteracao nao salva no funil requestClose", () => {
  it("Esc SEM alteracao fecha direto", async () => {
    rotear(detalhe());
    const onClose = vi.fn();
    render(<UserDetailModal userId="u1" onClose={onClose} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    fireEvent.keyDown(document.activeElement || document.body, {
      key: "Escape",
      code: "Escape",
    });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("Esc COM alteracao nao salva pede confirmacao em vez de descartar", async () => {
    rotear(detalhe());
    const onClose = vi.fn();
    render(<UserDetailModal userId="u1" onClose={onClose} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana Paula" },
    });

    fireEvent.keyDown(document.activeElement || document.body, {
      key: "Escape",
      code: "Escape",
    });

    expect(await screen.findByText("Descartar alterações?")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("confirmar o descarte fecha; continuar editando nao", async () => {
    rotear(detalhe());
    const onClose = vi.fn();
    render(<UserDetailModal userId="u1" onClose={onClose} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana Paula" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    await screen.findByText("Descartar alterações?");
    fireEvent.click(screen.getByRole("button", { name: "Continuar editando" }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    await screen.findByText("Descartar alterações?");
    fireEvent.click(screen.getByRole("button", { name: "Descartar" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("a guarda vale para TODOS os caminhos de saida, nao so para o Esc", async () => {
    // Se a checagem morasse nos call sites em vez de dentro do requestClose,
    // bastaria alguem esquecer um caminho. Aqui os dois caminhos existentes
    // (Esc e botao Fechar) sao exercitados contra a MESMA guarda.
    rotear(detalhe());
    const onClose = vi.fn();
    render(<UserDetailModal userId="u1" onClose={onClose} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana Paula" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(await screen.findByText("Descartar alterações?")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("troca de e-mail (Fatia 5b)", () => {
  function rotearEmail(over: Record<string, unknown> = {}) {
    fetchMock.mockImplementation((path: string, init?: { method?: string }) => {
      if (path.includes("/email-usage")) {
        return Promise.resolve({
          data: {
            email: "ana@exemplo.com",
            usage: [
              {
                table: "newsletter_subscribers",
                label: "Newsletter",
                count: 1,
              },
              {
                table: "email_suppressions",
                label: "Supressões de envio",
                count: 0,
              },
              { table: "waitlist", label: "Lista de espera", count: 2 },
            ],
          },
        });
      }
      if (path.endsWith("/email") && init?.method === "POST") {
        const r = over.emailPost;
        if (r instanceof Error) return Promise.reject(r);
        return Promise.resolve(r ?? { data: { changed: true } });
      }
      if (path.includes("/transactions"))
        return Promise.resolve({
          data: {
            items: [],
            total_paid_cents: 0,
            truncated: false,
            limit: 200,
          },
        });
      if (path.endsWith("/activity"))
        return Promise.resolve({ data: { state: "ok", hasData: false } });
      return Promise.resolve(detalhe());
    });
  }

  async function abrirTrocaDeEmail() {
    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: "Trocar e-mail" }));
    return await screen.findByLabelText("Novo e-mail");
  }

  it("o rodape oferece a troca de e-mail", async () => {
    rotearEmail();
    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    const rodape = within(document.querySelector("footer") as HTMLElement);
    expect(rodape.getByRole("button", { name: "Trocar e-mail" })).toBeTruthy();
  });

  it("passo 1 exige confirmacao digitada: divergente NAO avanca", async () => {
    rotearEmail();
    await abrirTrocaDeEmail();

    fireEvent.change(screen.getByLabelText("Novo e-mail"), {
      target: { value: "novo@exemplo.com" },
    });
    fireEvent.change(screen.getByLabelText("Confirme o novo e-mail"), {
      target: { value: "nvoo@exemplo.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(
      await screen.findByText("Os dois e-mails não são iguais."),
    ).toBeTruthy();
    expect(screen.queryByText(/O login passa a ser/)).toBeNull();
  });

  it("formato invalido nao avanca e nem chama o servidor", async () => {
    rotearEmail();
    await abrirTrocaDeEmail();

    fireEvent.change(screen.getByLabelText("Novo e-mail"), {
      target: { value: "sem-arroba" },
    });
    fireEvent.change(screen.getByLabelText("Confirme o novo e-mail"), {
      target: { value: "sem-arroba" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByText("E-mail inválido.")).toBeTruthy();
    expect(
      fetchMock.mock.calls.some((c) => String(c[0]).endsWith("/email")),
    ).toBe(false);
  });

  it("passo 2 lista os efeitos concretos, com as contagens", async () => {
    rotearEmail();
    await abrirTrocaDeEmail();

    fireEvent.change(screen.getByLabelText("Novo e-mail"), {
      target: { value: "novo@exemplo.com" },
    });
    fireEvent.change(screen.getByLabelText("Confirme o novo e-mail"), {
      target: { value: "novo@exemplo.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByText(/O login passa a ser/)).toBeTruthy();
    expect(screen.getByText(/A senha não muda/)).toBeTruthy();
    expect(screen.getByText(/recibos da Stripe/i)).toBeTruthy();
    // Contagens das listas que NAO acompanham a troca.
    expect(screen.getByText(/Newsletter/)).toBeTruthy();
    expect(screen.getByText(/Lista de espera/)).toBeTruthy();
  });

  it("confirma e troca, com toast de sucesso", async () => {
    rotearEmail();
    await abrirTrocaDeEmail();

    fireEvent.change(screen.getByLabelText("Novo e-mail"), {
      target: { value: "novo@exemplo.com" },
    });
    fireEvent.change(screen.getByLabelText("Confirme o novo e-mail"), {
      target: { value: "novo@exemplo.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Trocar agora" }),
    );

    await waitFor(() => expect(toastSpy.acao).toHaveBeenCalled());
    const post = fetchMock.mock.calls.find(
      (c) =>
        String(c[0]).endsWith("/email") &&
        (c[1] as { method?: string })?.method === "POST",
    );
    expect(JSON.parse((post![1] as { body: string }).body)).toEqual({
      email: "novo@exemplo.com",
    });
  });

  it("colisao 409 vira mensagem legivel, nao code cru", async () => {
    const erro = new Error("Este e-mail já pertence a outra conta.");
    rotearEmail({ emailPost: erro });
    await abrirTrocaDeEmail();

    fireEvent.change(screen.getByLabelText("Novo e-mail"), {
      target: { value: "ocupado@exemplo.com" },
    });
    fireEvent.change(screen.getByLabelText("Confirme o novo e-mail"), {
      target: { value: "ocupado@exemplo.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Trocar agora" }),
    );

    await waitFor(() =>
      expect(toastSpy.erro).toHaveBeenCalledWith(
        "Este e-mail já pertence a outra conta.",
      ),
    );
  });

  it("botao trava durante a operacao, contra duplo clique", async () => {
    let liberar!: () => void;
    fetchMock.mockImplementation((path: string, init?: { method?: string }) => {
      if (path.endsWith("/email") && init?.method === "POST")
        return new Promise((r) => {
          liberar = () => r({ data: { changed: true } });
        });
      if (path.includes("/email-usage"))
        return Promise.resolve({
          data: { email: "ana@exemplo.com", usage: [] },
        });
      if (path.includes("/transactions"))
        return Promise.resolve({
          data: {
            items: [],
            total_paid_cents: 0,
            truncated: false,
            limit: 200,
          },
        });
      if (path.endsWith("/activity"))
        return Promise.resolve({ data: { state: "ok", hasData: false } });
      return Promise.resolve(detalhe());
    });

    await abrirTrocaDeEmail();
    fireEvent.change(screen.getByLabelText("Novo e-mail"), {
      target: { value: "novo@exemplo.com" },
    });
    fireEvent.change(screen.getByLabelText("Confirme o novo e-mail"), {
      target: { value: "novo@exemplo.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Trocar agora" }),
    );

    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: "Trocando...",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true),
    );
    fireEvent.click(screen.getByRole("button", { name: "Trocando..." }));

    const posts = fetchMock.mock.calls.filter(
      (c) =>
        String(c[0]).endsWith("/email") &&
        (c[1] as { method?: string })?.method === "POST",
    );
    expect(posts).toHaveLength(1);
    liberar();
  });

  it("sair no meio da troca nao deixa rascunho pendente", async () => {
    // Com o dialogo aberto, o "Fechar" do modal fica atras dele (o Radix marca
    // os irmaos como aria-hidden), entao o caminho real de saida e cancelar. O
    // que precisa ser verdade e que o rascunho NAO sobrevive: reabrir comeca do
    // zero, no passo 1 e com os campos vazios.
    rotearEmail();
    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    fireEvent.click(screen.getByRole("button", { name: "Trocar e-mail" }));
    fireEvent.change(await screen.findByLabelText("Novo e-mail"), {
      target: { value: "rascunho@exemplo.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() =>
      expect(screen.queryByLabelText("Novo e-mail")).toBeNull(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Trocar e-mail" }));
    const campo = (await screen.findByLabelText(
      "Novo e-mail",
    )) as HTMLInputElement;
    expect(campo.value).toBe("");
    expect(screen.queryByText(/O login passa a ser/)).toBeNull();
  });
});

describe("cancelamento de assinatura (Fatia 6)", () => {
  const ASSINATURA = {
    plan_code: "pro_annual",
    status: "active",
    payment_method: "card",
    renewal_type: "auto",
    created_at: "2026-01-10T12:00:00Z",
    current_period_end: "2027-01-10T12:00:00Z",
    cancel_at_period_end: false,
  };

  function rotearCancel(over: Record<string, unknown> = {}) {
    fetchMock.mockImplementation((path: string, init?: { method?: string }) => {
      if (path.includes("/subscription/cancel")) {
        const r = over.cancelPost;
        if (r instanceof Error) return Promise.reject(r);
        return Promise.resolve(r ?? { data: { canceled: true } });
      }
      if (path.includes("/transactions"))
        return Promise.resolve({
          data: {
            items: [],
            total_paid_cents: 0,
            truncated: false,
            limit: 200,
          },
        });
      if (path.includes("/email-usage"))
        return Promise.resolve({ data: { email: null, usage: [] } });
      if (path.endsWith("/activity"))
        return Promise.resolve({ data: { state: "ok", hasData: false } });
      return Promise.resolve(
        over.detalhe ?? detalhe({ subscription: ASSINATURA }),
      );
    });
  }

  async function abrirCancelamento() {
    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar Pro" }));
    return await screen.findByText("Cancelar assinatura?");
  }

  it("o diálogo mostra plano, valor e a data até quando o acesso vale", async () => {
    rotearCancel();
    const titulo = await abrirCancelamento();
    // Escopado ao diálogo: plano e data também aparecem na seção Assinatura do
    // modal por trás.
    const dialogo = within(
      titulo.closest('[role="alertdialog"]') as HTMLElement,
    );

    expect(dialogo.getByText("pro_annual")).toBeTruthy();
    expect(dialogo.getByText("10/01/2027")).toBeTruthy();
    expect(dialogo.getByText(/não é imediato/)).toBeTruthy();
  });

  it("aviso de influencer aparece para pro_source 'influencer'", async () => {
    rotearCancel({
      detalhe: detalhe({
        subscription: ASSINATURA,
        pro_source: "influencer",
        is_pro: true,
      }),
    });
    await abrirCancelamento();
    expect(screen.getByTestId("aviso-influencer")).toBeTruthy();
  });

  it("aviso de influencer aparece para pro_source 'both'", async () => {
    rotearCancel({
      detalhe: detalhe({
        subscription: ASSINATURA,
        pro_source: "both",
        is_pro: true,
      }),
    });
    await abrirCancelamento();
    expect(screen.getByTestId("aviso-influencer")).toBeTruthy();
  });

  it("aviso NÃO aparece para pro_source 'subscription'", async () => {
    rotearCancel({
      detalhe: detalhe({
        subscription: ASSINATURA,
        pro_source: "subscription",
        is_pro: true,
      }),
    });
    await abrirCancelamento();
    expect(screen.queryByTestId("aviso-influencer")).toBeNull();
  });

  it("motivo vazio bloqueia a confirmação e não chama a rota", async () => {
    rotearCancel();
    await abrirCancelamento();

    fireEvent.click(
      screen.getByRole("button", { name: "Cancelar assinatura" }),
    );

    expect(
      await screen.findByText("Informe o motivo do cancelamento."),
    ).toBeTruthy();
    expect(
      fetchMock.mock.calls.some((c) =>
        String(c[0]).includes("/subscription/cancel"),
      ),
    ).toBe(false);
  });

  it("com motivo, cancela e confirma por toast", async () => {
    rotearCancel();
    await abrirCancelamento();

    fireEvent.change(screen.getByLabelText(/Motivo/), {
      target: { value: "pedido por e-mail" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Cancelar assinatura" }),
    );

    await waitFor(() => expect(toastSpy.acao).toHaveBeenCalled());
    const post = fetchMock.mock.calls.find((c) =>
      String(c[0]).includes("/subscription/cancel"),
    )!;
    expect(JSON.parse((post[1] as { body: string }).body)).toEqual({
      reason: "pedido por e-mail",
    });
  });

  it("erro da rota vira toast legível", async () => {
    rotearCancel({
      cancelPost: new Error("Nenhuma assinatura ativa encontrada."),
    });
    await abrirCancelamento();

    fireEvent.change(screen.getByLabelText(/Motivo/), {
      target: { value: "x" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Cancelar assinatura" }),
    );

    await waitFor(() =>
      expect(toastSpy.erro).toHaveBeenCalledWith(
        "Nenhuma assinatura ativa encontrada.",
      ),
    );
  });

  it("botão trava durante a operação", async () => {
    let liberar!: () => void;
    fetchMock.mockImplementation((path: string) => {
      if (path.includes("/subscription/cancel"))
        return new Promise((r) => {
          liberar = () => r({ data: { canceled: true } });
        });
      if (path.includes("/transactions"))
        return Promise.resolve({
          data: {
            items: [],
            total_paid_cents: 0,
            truncated: false,
            limit: 200,
          },
        });
      if (path.includes("/email-usage"))
        return Promise.resolve({ data: { email: null, usage: [] } });
      if (path.endsWith("/activity"))
        return Promise.resolve({ data: { state: "ok", hasData: false } });
      return Promise.resolve(detalhe({ subscription: ASSINATURA }));
    });

    await abrirCancelamento();
    fireEvent.change(screen.getByLabelText(/Motivo/), {
      target: { value: "x" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Cancelar assinatura" }),
    );

    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: "Cancelando...",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true),
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancelando..." }));

    expect(
      fetchMock.mock.calls.filter((c) =>
        String(c[0]).includes("/subscription/cancel"),
      ),
    ).toHaveLength(1);
    liberar();
  });

  it("BOLETO não oferece o botão: mostra a explicação no lugar", async () => {
    rotearCancel({
      detalhe: detalhe({
        subscription: { ...ASSINATURA, renewal_type: "manual" },
      }),
    });
    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    expect(screen.queryByRole("button", { name: "Cancelar Pro" })).toBeNull();
    expect(screen.getByTestId("boleto-sem-cancelamento")).toBeTruthy();
  });

  it("assinatura já cancelada não oferece o botão de novo", async () => {
    rotearCancel({
      detalhe: detalhe({
        subscription: { ...ASSINATURA, cancel_at_period_end: true },
      }),
    });
    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    expect(screen.queryByRole("button", { name: "Cancelar Pro" })).toBeNull();
  });
});

describe("reembolso (Fatia 7)", () => {
  function compraRef(over: Record<string, unknown> = {}) {
    return {
      id: "ft1",
      type: "charge",
      gross_cents: 20000,
      fee_cents: 0,
      net_cents: 20000,
      currency: "BRL",
      occurred_at: "2026-07-01T12:00:00Z",
      stripe_charge_id: "ch_1",
      stripe_invoice_id: null,
      plan_code: "pro_annual",
      refunded_cents: 0,
      disputed_cents: 0,
      disputed: false,
      refund_state: "none",
      refundable_cents: 20000,
      ...over,
    };
  }

  function rotearRefund(
    item: Record<string, unknown>,
    over: Record<string, unknown> = {},
  ) {
    fetchMock.mockImplementation((path: string, init?: { method?: string }) => {
      if (path.includes("/refunds") && init?.method === "POST") {
        const r = over.post;
        if (r instanceof Error) return Promise.reject(r);
        return Promise.resolve(
          r ?? { data: { refunded: true, statement_synced: true } },
        );
      }
      if (path.includes("/transactions"))
        return Promise.resolve({
          data: {
            items: [item],
            total_paid_cents: 20000,
            truncated: false,
            limit: 200,
          },
        });
      if (path.includes("/email-usage"))
        return Promise.resolve({ data: { email: null, usage: [] } });
      if (path.endsWith("/activity"))
        return Promise.resolve({ data: { state: "ok", hasData: false } });
      return Promise.resolve(detalhe());
    });
  }

  async function abrirRefund(
    item: Record<string, unknown> = compraRef(),
    over = {},
  ) {
    rotearRefund(item, over);
    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(await screen.findByRole("button", { name: "Reembolsar" }));
    return await screen.findByText("Reembolsar cobrança");
  }

  it("o passo 1 mostra o teto disponível", async () => {
    await abrirRefund();
    // Compara contra o proprio formatador: o Intl usa espaco NAO separavel
    // depois do "R$", e um literal digitado a mao nunca bate.
    expect(screen.getByTestId("teto-reembolso").textContent).toContain(
      fmtBrl(20000),
    );
  });

  it("teto menor que o bruto por DISPUTA é explicado", async () => {
    await abrirRefund(
      compraRef({
        disputed_cents: 5000,
        disputed: true,
        refundable_cents: 15000,
      }),
    );
    expect(screen.getByTestId("explicacao-teto").textContent).toContain(
      "chargeback",
    );
  });

  it("teto menor por reembolso anterior é explicado", async () => {
    await abrirRefund(
      compraRef({
        refunded_cents: 5000,
        refund_state: "partial",
        refundable_cents: 15000,
      }),
    );
    expect(screen.getByTestId("explicacao-teto").textContent).toContain(
      "já foram reembolsados",
    );
  });

  it("motivo vazio bloqueia o avanço", async () => {
    await abrirRefund();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(
      await screen.findByText("Informe o motivo do reembolso."),
    ).toBeTruthy();
  });

  it("passo 2 diz que é irreversível e que a assinatura NÃO será cancelada", async () => {
    await abrirRefund();
    fireEvent.change(screen.getByLabelText(/Motivo/), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(
      (await screen.findByTestId("aviso-irreversivel")).textContent,
    ).toContain("irreversível");
    expect(screen.getByTestId("aviso-assinatura").textContent).toContain(
      "não será cancelada",
    );
  });

  it("o botão só libera quando o valor é DIGITADO corretamente", async () => {
    await abrirRefund();
    fireEvent.change(screen.getByLabelText(/Motivo/), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    const botao = (await screen.findByRole("button", {
      name: "Reembolsar agora",
    })) as HTMLButtonElement;
    // Campo nasce VAZIO: confirmar por clique seria só mais um clique.
    expect(botao.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText(/Digite o valor/), {
      target: { value: "199,00" },
    });
    expect(
      (
        screen.getByRole("button", {
          name: "Reembolsar agora",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    fireEvent.change(screen.getByLabelText(/Digite o valor/), {
      target: { value: "200,00" },
    });
    expect(
      (
        screen.getByRole("button", {
          name: "Reembolsar agora",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });

  it("emite e confirma por toast", async () => {
    await abrirRefund();
    fireEvent.change(screen.getByLabelText(/Motivo/), {
      target: { value: "pediu" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(await screen.findByLabelText(/Digite o valor/), {
      target: { value: "200,00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reembolsar agora" }));

    await waitFor(() => expect(toastSpy.acao).toHaveBeenCalled());
    const post = fetchMock.mock.calls.find(
      (c) =>
        String(c[0]).includes("/refunds") &&
        (c[1] as { method?: string })?.method === "POST",
    )!;
    expect(JSON.parse((post[1] as { body: string }).body)).toEqual({
      charge_id: "ch_1",
      amount_cents: 20000,
      reason: "pediu",
    });
  });

  it("sync falho NÃO vira mensagem de erro: o reembolso aconteceu", async () => {
    await abrirRefund(compraRef(), {
      post: { data: { refunded: true, statement_synced: false } },
    });
    fireEvent.change(screen.getByLabelText(/Motivo/), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(await screen.findByLabelText(/Digite o valor/), {
      target: { value: "200,00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reembolsar agora" }));

    await waitFor(() => expect(toastSpy.acao).toHaveBeenCalled());
    expect(toastSpy.erro).not.toHaveBeenCalled();
    expect(String(toastSpy.acao.mock.calls[0][0].message)).toContain(
      "Reembolso emitido",
    );
  });

  it("erro da rota vira toast legível", async () => {
    await abrirRefund(compraRef(), {
      post: new Error(
        "O valor pedido é maior do que o disponível para reembolso.",
      ),
    });
    fireEvent.change(screen.getByLabelText(/Motivo/), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(await screen.findByLabelText(/Digite o valor/), {
      target: { value: "200,00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reembolsar agora" }));

    await waitFor(() =>
      expect(toastSpy.erro).toHaveBeenCalledWith(
        "O valor pedido é maior do que o disponível para reembolso.",
      ),
    );
  });

  it("botão trava durante a emissão", async () => {
    let liberar!: () => void;
    const item = compraRef();
    fetchMock.mockImplementation((path: string, init?: { method?: string }) => {
      if (path.includes("/refunds") && init?.method === "POST")
        return new Promise((r) => {
          liberar = () =>
            r({ data: { refunded: true, statement_synced: true } });
        });
      if (path.includes("/transactions"))
        return Promise.resolve({
          data: {
            items: [item],
            total_paid_cents: 20000,
            truncated: false,
            limit: 200,
          },
        });
      if (path.includes("/email-usage"))
        return Promise.resolve({ data: { email: null, usage: [] } });
      if (path.endsWith("/activity"))
        return Promise.resolve({ data: { state: "ok", hasData: false } });
      return Promise.resolve(detalhe());
    });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(await screen.findByRole("button", { name: "Reembolsar" }));
    await screen.findByText("Reembolsar cobrança");
    fireEvent.change(screen.getByLabelText(/Motivo/), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(await screen.findByLabelText(/Digite o valor/), {
      target: { value: "200,00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reembolsar agora" }));

    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: "Reembolsando...",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true),
    );
    fireEvent.click(screen.getByRole("button", { name: "Reembolsando..." }));

    expect(
      fetchMock.mock.calls.filter(
        (c) =>
          String(c[0]).includes("/refunds") &&
          (c[1] as { method?: string })?.method === "POST",
      ),
    ).toHaveLength(1);
    liberar();
  });
});

describe("historico administrativo no modal (Fatia 8)", () => {
  it("busca o historico uma unica vez, na primeira abertura do dropdown", async () => {
    rotear(detalhe());

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();

    const contar = () =>
      fetchMock.mock.calls.filter((c) => String(c[0]).includes("/audit"))
        .length;
    expect(contar()).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
    await waitFor(() => expect(contar()).toBe(1));

    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
    expect(contar()).toBe(1);
  });

  it("o CPF NUNCA e renderizado no historico, nem se o backend mandar", async () => {
    // Defesa em profundidade. O servidor ja filtra por allowlist e a rota de
    // reveal grava os dois json nulos, mas a tela nao pode depender disso: se
    // alguem mudar a gravacao la, o numero apareceria aqui sem ninguem ver.
    rotear(detalhe(), {
      "/audit": {
        data: {
          entries: [
            {
              id: "a1",
              action: "reveal",
              resource_type: "profile_cpf",
              resource_slug: null,
              actor_user_id: "admin-1",
              actor_name: "Ana",
              created_at: "2026-07-30T12:00:00Z",
              before: { cpf: "39053344705" },
              after: { cpf: "39053344705" },
              campos_alterados: [],
              outcome: "not_verifiable",
              outcome_detail: null,
            },
          ],
          truncated: false,
          limit: 100,
          cross_reference_ok: true,
        },
      },
    });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));

    const secao = await screen.findByTestId("user-audit");
    expect(within(secao).getByText("CPF revelado")).toBeTruthy();
    expect(secao.textContent ?? "").not.toContain("39053344705");
  });

  it("action desconhecida aparece crua em vez de derrubar o modal", async () => {
    rotear(detalhe(), {
      "/audit": {
        data: {
          entries: [
            {
              id: "a1",
              action: "acao_do_futuro",
              resource_type: null,
              resource_slug: null,
              actor_user_id: null,
              actor_name: "Admin removido",
              created_at: "2026-07-30T12:00:00Z",
              before: {},
              after: {},
              campos_alterados: [],
              outcome: "not_verifiable",
              outcome_detail: null,
            },
          ],
          truncated: false,
          limit: 100,
          cross_reference_ok: true,
        },
      },
    });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await pronto();
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));

    const secao = await screen.findByTestId("user-audit");
    expect(within(secao).getByText("acao_do_futuro")).toBeTruthy();
  });
});
