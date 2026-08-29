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
      // Antes do prefixo "/users/u1", que casaria esta rota tambem.
      "/users/u1/transactions": {
        data: { items: [], total_paid_cents: 0, truncated: false, limit: 200 },
      },
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

    fireEvent.click(screen.getAllByRole("button", { name: "Fechar" })[0]);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("nao renderiza o X padrao do Dialog, e os dois Fechar sao gatilhos do MESMO funil", async () => {
    const dialog = await abrirModal();

    // O DialogContent traz um X proprio por padrao, e ele fecharia por fora do
    // requestClose. Continua desligado.
    expect(within(dialog).queryByRole("button", { name: /close/i })).toBeNull();

    // Eram DOIS gatilhos complementares (cabecalho so no mobile, rodape so no
    // desktop). Agora e UM, visivel em toda largura. O que importa segue nao
    // sendo a contagem, e sim que todo gatilho passe por requestClose: o numero
    // de portas pode variar, o numero de FUNIS nao.
    const fechares = within(dialog).getAllByRole("button", { name: "Fechar" });
    expect(fechares.length).toBe(1);
    expect(within(dialog).getByTestId("header-fechar").className).not.toContain(
      "sm:hidden",
    );
    expect(within(dialog).queryByTestId("footer-fechar")).toBeNull();
  });

  // As duas assercoes que existiam aqui ate a Fatia 2 travavam o modal no
  // formato ANTERIOR a extracao (um .card-brutal dentro de um DialogContent
  // transparente). A Fatia 3 redesenhou o modal de proposito, entao elas foram
  // substituidas pelo contrato NOVO, nao removidas: o que nao pode acontecer em
  // silencio segue travado.
  it("o DialogContent neutraliza os defaults visuais do primitivo", async () => {
    const dialog = await abrirModal();
    const classes = dialog.className;

    // Sobrevivente do tailwind-merge = default do shadcn desenhando por cima do
    // desenho do admin.
    for (const indesejada of [
      "bg-background",
      "rounded-lg",
      "shadow-lg",
      "sm:max-w-lg",
      "max-w-[calc(100%-2rem)]",
      "p-6",
    ]) {
      expect(classes.includes(indesejada)).toBe(false);
    }
    expect(classes).toContain("z-[2000]");
  });

  it("o modal e uma coluna com corpo rolavel, nao um bloco que rola inteiro", async () => {
    const dialog = await abrirModal();

    // Cabecalho fixo + corpo rolavel + rodape depende de o container ser flex
    // coluna e NAO rolar ele mesmo: quem rola e so o corpo.
    expect(dialog.className).toContain("flex-col");
    expect(dialog.className).toContain("overflow-hidden");

    const roláveis = dialog.querySelectorAll(".overflow-y-auto");
    expect(roláveis.length).toBe(1);
  });

  it("tela cheia no mobile, caixa no desktop", async () => {
    const dialog = await abrirModal();

    expect(dialog.className).toContain("h-[100dvh]");
    // Era "w-screen" ate o polimento mobile. Trocado por "w-full" de propósito:
    // 100vw inclui a barra de rolagem e criava rolagem horizontal em janela
    // estreita com barra clássica. A propriedade travada continua a mesma
    // (largura cheia no mobile), só sem o overflow.
    expect(dialog.className).toContain("w-full");
    expect(dialog.className).toContain("sm:h-[88vh]");
    expect(dialog.className).toContain("sm:w-[min(56rem,94vw)]");
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
