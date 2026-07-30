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
 * Extracao do modulo de Usuarios (Fatia 1).
 *
 * Estes testes existem para provar o que a fatia PROMETEU: nada muda para quem
 * usa, exceto o modal virar dialogo de verdade. Por isso eles travam coisas que
 * normalmente nao se testaria, como a string exata de className do cartao: e
 * justamente o que uma extracao quebra sem avisar.
 */

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/adminApi", () => ({
  adminFetch: (...args: unknown[]) => fetchMock(...args),
}));

import { UsersDashboard } from "./UsersDashboard";

// Classe do cartao do modal, copiada do componente ANTERIOR a extracao
// (commit c15e29e). Se a extracao mexeu no visual, esta string diverge.
const CARD_CLASSNAME_ANTES_DA_EXTRACAO =
  "card-brutal my-8 w-full max-w-3xl rounded-3xl bg-white p-6";

function listPayload(
  items: Array<Record<string, unknown>>,
  total = items.length,
) {
  return { data: { items, total, page: 1, pageSize: 50 } };
}

const DETALHE = {
  data: {
    user_id: "u1",
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
    cpf_masked: null,
    has_cpf: false,
    avatar: { url: null, mode: "icon", moderation_status: "clean" },
    subscription: null,
    cancellation_intent: null,
    influencer: null,
    paid_total_cents: 0,
    activity_status: "active",
    created_at: "2026-07-01T12:00:00Z",
    updated_at: "2026-07-02T12:00:00Z",
  },
};

function rotearFetch(handlers: Record<string, unknown>) {
  fetchMock.mockImplementation((path: string) => {
    for (const [prefixo, resposta] of Object.entries(handlers)) {
      if (path.startsWith(prefixo)) return Promise.resolve(resposta);
    }
    return Promise.reject(new Error(`rota nao mockada: ${path}`));
  });
}

beforeEach(() => {
  fetchMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("UsersDashboard: lista", () => {
  it("mostra uma linha por usuario, com nome e e-mail", async () => {
    rotearFetch({
      "/users?": listPayload([
        { user_id: "u1", name: "Ana Moura", email: "ana@exemplo.com" },
        { user_id: "u2", name: null, email: "bruno@exemplo.com" },
      ]),
    });

    render(<UsersDashboard />);

    expect(await screen.findByText("Ana Moura")).toBeTruthy();
    // Sem nome, a lista cai na parte local do e-mail (displayName).
    expect(screen.getByText("bruno")).toBeTruthy();
    expect(screen.getByText("2 resultados")).toBeTruthy();
  });

  it("clicar num filtro refaz a busca com filter na query e volta para a pagina 1", async () => {
    rotearFetch({ "/users?": listPayload([]) });

    render(<UsersDashboard />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Assinantes" }));

    await waitFor(() => {
      const chamadas = fetchMock.mock.calls.map((c) => String(c[0]));
      expect(chamadas.some((p) => p.includes("filter=pro"))).toBe(true);
      expect(chamadas.some((p) => p.includes("page=1&"))).toBe(true);
    });
  });

  it("os 5 filtros continuam existindo, com os mesmos valores enviados a API", async () => {
    rotearFetch({ "/users?": listPayload([]) });

    render(<UsersDashboard />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    // O rotulo mudou ("Pro" -> "Assinantes"), o CONTRATO com a API nao.
    const esperado: Array<[string, string | null]> = [
      ["Todos", null],
      ["Assinantes", "filter=pro"],
      ["Sem assinatura", "filter=not_pro"],
      ["Influencers", "filter=influencers"],
      ["Ativo", "filter=ativo"],
    ];

    for (const [rotulo, queryEsperada] of esperado) {
      fireEvent.click(screen.getByRole("button", { name: rotulo }));
      if (!queryEsperada) continue;
      await waitFor(() => {
        const chamadas = fetchMock.mock.calls.map((c) => String(c[0]));
        expect(chamadas.some((p) => p.includes(queryEsperada))).toBe(true);
      });
    }
  });

  it("a paginacao pede a pagina seguinte e desabilita Anterior na primeira", async () => {
    rotearFetch({
      "/users?": listPayload(
        [{ user_id: "u1", name: "Ana", email: "ana@exemplo.com" }],
        120,
      ),
    });

    render(<UsersDashboard />);

    expect(await screen.findByText("Página 1 de 3")).toBeTruthy();
    const anterior = screen.getByRole("button", { name: "Anterior" });
    expect((anterior as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() => {
      const chamadas = fetchMock.mock.calls.map((c) => String(c[0]));
      expect(chamadas.some((p) => p.includes("page=2"))).toBe(true);
    });
  });

  it("erro na lista mostra a mensagem do servidor, nao lista vazia", async () => {
    fetchMock.mockRejectedValue(new Error("Erro ao buscar usuários."));

    render(<UsersDashboard />);

    expect(await screen.findByText("Erro ao buscar usuários.")).toBeTruthy();
  });
});

describe("UsersDashboard: colunas e selos", () => {
  it("mostra o cabecalho das colunas", async () => {
    rotearFetch({
      "/users?": listPayload([
        { user_id: "u1", name: "Ana Moura", email: "ana@exemplo.com" },
      ]),
    });

    render(<UsersDashboard />);

    await screen.findByText("Ana Moura");
    // Escopado ao cabecalho: "Acesso", "Assinatura" e "Cadastro" tambem
    // aparecem como rotulo dentro de cada linha, visivel so no mobile.
    const cabecalho = within(screen.getByTestId("users-header"));
    for (const coluna of ["Usuário", "Acesso", "Assinatura", "Cadastro"]) {
      expect(cabecalho.getByText(coluna)).toBeTruthy();
    }
  });

  it("distingue Pro por assinatura, por influencer, pelos dois, e gratis", async () => {
    rotearFetch({
      "/users?": listPayload([
        {
          user_id: "u1",
          name: "Assinante",
          email: "a@x.com",
          is_pro: true,
          pro_source: "subscription",
          plan_code: "pro_annual",
          subscription_status: "active",
        },
        {
          user_id: "u2",
          name: "Parceira",
          email: "b@x.com",
          is_pro: true,
          pro_source: "influencer",
        },
        {
          user_id: "u3",
          name: "Os Dois",
          email: "c@x.com",
          is_pro: true,
          pro_source: "both",
          subscription_status: "active",
        },
        { user_id: "u4", name: "Gratuita", email: "d@x.com", is_pro: false },
      ]),
    });

    render(<UsersDashboard />);

    await screen.findByText("Assinante");
    // Escopado a lista: "Pro" e "Influencers" tambem sao rotulos de filtro.
    const lista = within(screen.getByTestId("users-list"));
    expect(lista.getByText("Pro")).toBeTruthy();
    expect(lista.getByText("Influencer")).toBeTruthy();
    expect(lista.getByText("Pro + Influencer")).toBeTruthy();
    expect(lista.getByText("Grátis")).toBeTruthy();
  });

  it("status de assinatura desconhecido aparece cru, sem derrubar a lista", async () => {
    rotearFetch({
      "/users?": listPayload([
        {
          user_id: "u1",
          name: "Ana Moura",
          email: "ana@exemplo.com",
          is_pro: true,
          pro_source: "subscription",
          subscription_status: "paused_by_provider",
        },
      ]),
    });

    render(<UsersDashboard />);

    // A lista renderiza (o nome aparece) E mostra o status cru.
    expect(await screen.findByText("Ana Moura")).toBeTruthy();
    expect(screen.getByText("paused_by_provider")).toBeTruthy();
  });

  it("mostra a data de cadastro formatada em pt-BR", async () => {
    rotearFetch({
      "/users?": listPayload([
        {
          user_id: "u1",
          name: "Ana Moura",
          email: "ana@exemplo.com",
          created_at: "2026-03-14T12:00:00Z",
        },
      ]),
    });

    render(<UsersDashboard />);

    expect(await screen.findByText("14/03/2026")).toBeTruthy();
  });

  it("cada linha continua sendo um botao que abre o modal", async () => {
    rotearFetch({
      "/users?": listPayload([
        { user_id: "u1", name: "Ana Moura", email: "ana@exemplo.com" },
      ]),
      "/users/u1": DETALHE,
    });

    render(<UsersDashboard />);
    fireEvent.click(await screen.findByText("Ana Moura"));

    expect(await screen.findByRole("dialog")).toBeTruthy();
  });
});

describe("UsersDashboard: estado vazio", () => {
  it("busca sem resultado diz que nao achou, com texto diferente de erro", async () => {
    rotearFetch({ "/users?": listPayload([]) });

    render(<UsersDashboard />);

    expect(await screen.findByText("Nenhum usuário encontrado")).toBeTruthy();
    // O vazio nao pode se parecer com falha: sao diagnosticos diferentes.
    expect(screen.queryByText(/Erro ao buscar/)).toBeNull();
  });

  it("base vazia e busca sem resultado dao explicacoes diferentes", async () => {
    rotearFetch({ "/users?": listPayload([]) });
    const { unmount } = render(<UsersDashboard />);
    await screen.findByText("Nenhum usuário encontrado");
    const semBusca = screen.getByTestId("users-empty-hint").textContent;
    unmount();

    rotearFetch({ "/users?": listPayload([]) });
    render(<UsersDashboard />);
    fireEvent.change(screen.getByPlaceholderText(/Buscar por nome/), {
      target: { value: "zzzz" },
    });
    await waitFor(() => {
      expect(screen.getByTestId("users-empty-hint").textContent).not.toBe(
        semBusca,
      );
    });
  });
});

describe("UsersDashboard: modal de detalhe", () => {
  async function abrirModal() {
    rotearFetch({
      "/users?": listPayload([
        { user_id: "u1", name: "Ana Moura", email: "ana@exemplo.com" },
      ]),
      "/users/u1/activity": { data: { state: "ok", hasData: false } },
      "/users/u1": DETALHE,
    });

    render(<UsersDashboard />);
    fireEvent.click(await screen.findByText("Ana Moura"));
    return await screen.findByRole("dialog");
  }

  it("abre ao clicar num usuario e e um dialogo de verdade (role=dialog)", async () => {
    const dialog = await abrirModal();

    // A semantica ARIA e a UNICA mudanca autorizada desta fatia.
    expect(dialog.getAttribute("role")).toBe("dialog");

    // O Radix NAO usa aria-modal (que tem problemas conhecidos de leitor de
    // tela); ele esconde os IRMAOS do dialogo com aria-hidden. E o que se
    // verifica: fora do modal, nada e anunciado.
    const irmaos = Array.from(document.body.children).filter(
      (el) => !el.contains(dialog),
    );
    expect(irmaos.length).toBeGreaterThan(0);
    expect(
      irmaos.every((el) => el.getAttribute("aria-hidden") === "true"),
    ).toBe(true);

    // Nome e descricao acessiveis vem do h3 e do <p> do e-mail que ja
    // existiam: DialogTitle/DialogDescription usam asChild, entao a marcacao
    // nao mudou, so ganhou o vinculo ARIA.
    const rotuloId = dialog.getAttribute("aria-labelledby");
    const descricaoId = dialog.getAttribute("aria-describedby");
    expect(document.getElementById(rotuloId!)?.textContent).toBe("Ana Moura");
    expect(document.getElementById(descricaoId!)?.textContent).toBe(
      "ana@exemplo.com",
    );
    expect(document.getElementById(rotuloId!)?.tagName).toBe("H3");
  });

  it("Esc fecha o modal", async () => {
    await abrirModal();

    fireEvent.keyDown(document.activeElement || document.body, {
      key: "Escape",
      code: "Escape",
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("o botao Fechar continua fechando", async () => {
    await abrirModal();

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("nao renderiza o X padrao do Dialog: o unico fechamento visivel e o botao Fechar", async () => {
    const dialog = await abrirModal();

    // O DialogContent traz um X proprio por padrao. Ele apareceria ALEM do
    // botao "Fechar" que ja existe, o que seria mudanca visual.
    expect(within(dialog).queryByRole("button", { name: /close/i })).toBeNull();
    expect(
      within(dialog).getAllByRole("button", { name: "Fechar" }).length,
    ).toBe(1);
  });

  it("o cartao interno mantem exatamente as classes de antes da extracao", async () => {
    const dialog = await abrirModal();

    const cartao = dialog.querySelector(".card-brutal");
    expect(cartao).not.toBeNull();
    expect(cartao!.className).toBe(CARD_CLASSNAME_ANTES_DA_EXTRACAO);
  });

  it("o DialogContent neutraliza os defaults visuais do primitivo", async () => {
    const dialog = await abrirModal();
    const classes = dialog.className;

    // Se qualquer um destes sobreviver ao tailwind-merge, o container deixa de
    // ser transparente e passa a desenhar borda/fundo/centralizacao propria.
    for (const indesejada of [
      "bg-background",
      "rounded-lg",
      "shadow-lg",
      "translate-y-[-50%]",
      "sm:max-w-lg",
      "max-w-[calc(100%-2rem)]",
    ]) {
      expect(classes.includes(indesejada)).toBe(false);
    }
    // E mantem o container de rolagem que existia antes.
    expect(classes).toContain("overflow-y-auto");
    expect(classes).toContain("items-start");
    expect(classes).toContain("z-[2000]");
  });

  it("o dropdown Mais informacoes so busca o PostHog na primeira abertura", async () => {
    await abrirModal();
    const chamadasAntes = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes("/activity"),
    ).length;
    expect(chamadasAntes).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));

    await waitFor(() => {
      const n = fetchMock.mock.calls.filter((c) =>
        String(c[0]).includes("/activity"),
      ).length;
      expect(n).toBe(1);
    });

    // Fecha e abre de novo: nao pode buscar outra vez.
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
    fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));

    const depois = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes("/activity"),
    ).length;
    expect(depois).toBe(1);
  });
});
