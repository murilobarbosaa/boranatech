import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

/**
 * ABA CREATORS: resumo, quadro e painel.
 *
 * Os numeros do resumo sao os MESMOS do teste do servidor
 * (server/routes/adminCreators.test.ts, "GET /creators/resumo"): o que o
 * servidor devolve la e o que esta tela tem de escrever aqui.
 *
 * O CreatorDashboardView e trocado por um marcador: ele tem teste proprio, e o
 * que interessa aqui e QUAL rota a aba chama e com qual visao ela o monta.
 */

const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/adminApi", () => {
  class AdminApiError extends Error {
    readonly status: number;
    readonly code: string | null;
    constructor(message: string, status: number, code: string | null) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }
  return {
    adminFetch: (...args: unknown[]) => fetchMock(...args),
    AdminApiError,
  };
});
// O calendario tem teste proprio (modo admin em CreatorCalendario.test.tsx);
// aqui o que se afirma e ONDE a aba o poe e com qual modo.
vi.mock("@/components/creator/CreatorCalendario", () => ({
  CreatorCalendario: ({ modo }: { modo?: string }) => (
    <div data-testid="calendario-mock" data-modo={modo ?? ""} />
  ),
}));
vi.mock("@/components/creator/CreatorDashboardView", () => ({
  CreatorDashboardView: ({
    visao,
    painel,
    userId,
  }: {
    visao: string;
    painel: { perfil: { name: string | null } };
    userId?: string;
  }) => (
    <div data-testid="view-mock" data-visao={visao} data-user-id={userId ?? ""}>
      {painel.perfil.name}
    </div>
  ),
}));

import { AdminApiError } from "@/lib/adminApi";
import { limparChavesDeSecao } from "@/components/admin/tasks/taskViewState";
import { CreatorsSection } from "./CreatorsSection";
import { CHAVES_DA_ABA_CREATORS } from "./creatorsUrlKeys";

const UUID_A = "3f2b8c1e-7a4d-4e2b-9c1a-5d6e7f8a9b0c";
const UUID_B = "8d1e2f3a-4b5c-4d6e-8f7a-9b0c1d2e3f4a";

const RESUMO = {
  data: {
    creators_ativos: { influencer: 21, afiliado: 4 },
    codigos: { vinculados: 26, sem_dono: 15 },
    eventos_30d: {
      desde: "2026-08-22T03:00:00.000Z",
      clicks: 312,
      sales: 9,
    },
    commission_due_cents: 48210,
  },
};

function item(over: Record<string, unknown> = {}) {
  return {
    user_id: UUID_A,
    kind: "influencer",
    granted_at: "2026-05-02T12:00:00Z",
    revoked_at: null,
    name: "Rafa Lima",
    email: "rafa@exemplo.com",
    handle: "rafalima",
    avatar_url: null,
    codigos_count: 2,
    codigos: [
      { code: "RAFA10", status: "active" },
      { code: "RAFA20", status: "paused" },
    ],
    totais: {
      clicks: 120,
      sales: 3,
      revenue_cents: 6279,
      commission_due_cents: 2093,
      commission_paid_cents: 0,
    },
    ultimo_evento_at: null,
    ...over,
  };
}

const SEM_CODIGO = item({
  user_id: UUID_B,
  kind: "afiliado",
  name: "Bia Souza",
  handle: null,
  codigos_count: 0,
  codigos: [],
  totais: {
    clicks: 0,
    sales: 0,
    revenue_cents: 0,
    commission_due_cents: 0,
    commission_paid_cents: 0,
  },
});

const PAGINA = {
  data: { rows: [item(), SEM_CODIGO], total: 2, page: 1, pageSize: 25 },
};

const PAINEL = {
  data: {
    creator: {
      kind: "influencer",
      granted_at: "2026-05-02T12:00:00Z",
      revoked_at: null,
    },
    perfil: {
      name: "Rafa Lima",
      handle: "rafalima",
      avatar_url: null,
      email: "rafa@exemplo.com",
    },
    janela: "30d",
    totais: {},
    codigos: [],
    eventos: {},
  },
};

function responder(valor: unknown) {
  return valor instanceof Error
    ? Promise.reject(valor)
    : Promise.resolve(valor);
}

// Publicacoes para conferir (lote 10b): vazias por padrao, para os testes do
// quadro e do painel nao dependerem do bloco novo.
const SEM_PENDENTES = {
  data: { rows: [], total: 0, page: 1, pageSize: 50 },
};

function rotear(
  over: {
    resumo?: unknown;
    pagina?: unknown;
    painel?: unknown;
    pendentes?: unknown;
    acao?: unknown;
    calendario?: unknown;
  } = {},
) {
  fetchMock.mockImplementation((path: string, options?: RequestInit) => {
    if (path === "/creators/resumo") return responder(over.resumo ?? RESUMO);
    if (path.startsWith("/creators?")) return responder(over.pagina ?? PAGINA);
    // ANTES do painel: `/creators/posts?` tambem comeca com `/creators/`.
    if (path.startsWith("/creators/posts?")) {
      return responder(over.pendentes ?? SEM_PENDENTES);
    }
    // O calendario so leitura (lote 10d): vazio por padrao.
    if (path.startsWith("/creators/calendar?")) {
      return responder(over.calendario ?? { data: { marcacoes: [] } });
    }
    if (options?.method === "POST" || options?.method === "DELETE") {
      return responder(over.acao ?? { data: {} });
    }
    if (path.startsWith("/creators/")) return responder(over.painel ?? PAINEL);
    return Promise.reject(new Error(`rota nao mockada: ${path}`));
  });
}

function chamadas(): string[] {
  return fetchMock.mock.calls.map((c) => String(c[0]));
}

function montar(path = "/admin?section=creators") {
  const { hook } = memoryLocation({ path });
  render(
    <Router hook={hook}>
      <CreatorsSection />
    </Router>,
  );
}

function valorDoTile(testId: string): string {
  return screen.getByTestId(`${testId}-valor`).textContent ?? "";
}

beforeEach(() => {
  fetchMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("resumo", () => {
  it("escreve os numeros que o servidor devolve, cada um com a sua fonte", async () => {
    rotear();
    montar();
    await screen.findByTestId("creators-resumo");

    expect(valorDoTile("creators-resumo-influencers")).toBe("21");
    expect(valorDoTile("creators-resumo-afiliados")).toBe("4");
    expect(valorDoTile("creators-resumo-vinculados")).toBe("26");
    expect(valorDoTile("creators-resumo-sem-dono")).toBe("15");
    expect(valorDoTile("creators-resumo-cliques")).toBe("312");
    expect(valorDoTile("creators-resumo-vendas")).toBe("9");
    expect(valorDoTile("creators-resumo-comissao")).toBe("R$\u00a0482,10");

    const eventos = "pelos eventos, últimos 30 dias (desde 22/08/2026)";
    expect(
      within(screen.getByTestId("creators-resumo-cliques")).getByText(eventos),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("creators-resumo-vendas")).getByText(eventos),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("creators-resumo-comissao")).getByText(
        "pelos contadores",
      ),
    ).toBeTruthy();
  });

  it("resumo fora do formato vira erro, e tentar de novo busca outra vez", async () => {
    rotear({ resumo: { data: { creators_ativos: {} } } });
    montar();
    expect(await screen.findByTestId("creators-resumo-erro")).toBeTruthy();

    rotear();
    fireEvent.click(
      within(screen.getByTestId("creators-resumo-erro")).getByRole("button", {
        name: "Tentar de novo",
      }),
    );
    expect(await screen.findByTestId("creators-resumo")).toBeTruthy();
    expect(chamadas().filter((p) => p === "/creators/resumo")).toHaveLength(2);
  });
});

describe("quadro", () => {
  it("linha sem codigo ganha o destaque; linha com codigos lista os codigos", async () => {
    rotear();
    montar();

    const semCodigo = await screen.findByTestId(`creators-linha-${UUID_B}`);
    expect(
      within(semCodigo).getByTestId("creators-sem-codigo").textContent,
    ).toBe("sem código");

    const comCodigo = screen.getByTestId(`creators-linha-${UUID_A}`);
    expect(within(comCodigo).getByText("RAFA10, RAFA20")).toBeTruthy();
    expect(within(comCodigo).queryByTestId("creators-sem-codigo")).toBeNull();
    // textContent, e nao getByText: o matcher normaliza o espaco nao
    // separavel do "R$" para espaco comum, e o literal nunca bateria.
    expect(comCodigo.textContent).toContain("R$\u00a062,79");
    expect(comCodigo.textContent).toContain("R$\u00a020,93");
    expect(within(comCodigo).getByText("@rafalima")).toBeTruthy();
    expect(within(comCodigo).getByText("nenhum ainda")).toBeTruthy();
    expect(screen.getByText("2 creators")).toBeTruthy();
  });

  it("concessao revogada aparece marcada como Revogado", async () => {
    rotear({
      pagina: {
        data: {
          rows: [item({ revoked_at: "2026-08-01T12:00:00Z" })],
          total: 1,
          page: 1,
          pageSize: 25,
        },
      },
    });
    montar();
    const linha = await screen.findByTestId(`creators-linha-${UUID_A}`);
    expect(
      within(linha).getByTestId("creators-linha-revogado").textContent,
    ).toBe("Revogado");
  });

  it("a primeira busca e de ativos e todos os tipos", async () => {
    rotear();
    montar();
    await screen.findByTestId("creators-quadro");
    expect(chamadas()).toContain(
      "/creators?status=active&kind=all&page=1&pageSize=25",
    );
  });

  it("trocar o status refaz a busca com status=revoked", async () => {
    rotear();
    montar();
    await screen.findByTestId("creators-quadro");

    fireEvent.click(
      within(
        screen.getByRole("radiogroup", { name: "Status da concessão" }),
      ).getByRole("radio", { name: "Revogados" }),
    );

    await waitFor(() =>
      expect(chamadas()).toContain(
        "/creators?status=revoked&kind=all&page=1&pageSize=25",
      ),
    );
  });

  it("trocar o tipo refaz a busca com kind=afiliado", async () => {
    rotear();
    montar();
    await screen.findByTestId("creators-quadro");

    fireEvent.click(
      within(
        screen.getByRole("radiogroup", { name: "Tipo de creator" }),
      ).getByRole("radio", { name: "Afiliados" }),
    );

    await waitFor(() =>
      expect(chamadas()).toContain(
        "/creators?status=active&kind=afiliado&page=1&pageSize=25",
      ),
    );
  });

  it("filtro na URL e o que a primeira busca usa", async () => {
    rotear();
    montar("/admin?section=creators&status=all&kind=influencer");
    await screen.findByTestId("creators-quadro");
    expect(chamadas()).toContain(
      "/creators?status=all&kind=influencer&page=1&pageSize=25",
    );
  });

  it("filtro vazio diz que nao ha creator neste filtro", async () => {
    rotear({ pagina: { data: { rows: [], total: 0, page: 1, pageSize: 25 } } });
    montar();
    expect((await screen.findByTestId("creators-vazio")).textContent).toBe(
      "Nenhum creator neste filtro.",
    );
  });

  it("coluna Pix: sem Pix so quando o servidor diz false; vazia quando o campo nao vem", async () => {
    rotear({
      pagina: {
        data: {
          rows: [
            item({ tem_pix: false }),
            item({
              user_id: UUID_B,
              name: "Bia Souza",
              tem_pix: true,
              instagram_handle: "bia.souza",
            }),
            // Backend anterior ao lote 08: sem os dois campos. "Nao sei" nao
            // e "sem chave".
            item({ user_id: "c0a8e2f4-1b3d-4e5f-8a9b-0c1d2e3f4a5b" }),
          ],
          total: 3,
          page: 1,
          pageSize: 25,
        },
      },
    });
    montar();

    const semPix = await screen.findByTestId(`creators-linha-${UUID_A}`);
    expect(within(semPix).getByTestId("creators-sem-pix").textContent).toBe(
      "sem Pix",
    );
    expect(within(semPix).queryByTestId("creators-linha-instagram")).toBeNull();

    const comPix = screen.getByTestId(`creators-linha-${UUID_B}`);
    expect(within(comPix).queryByTestId("creators-sem-pix")).toBeNull();
    expect(within(comPix).getByTestId("creators-com-pix").textContent).toBe(
      "cadastrada",
    );
    expect(
      within(comPix).getByTestId("creators-linha-instagram").textContent,
    ).toBe("Instagram @bia.souza");

    const antigo = screen.getByTestId(
      "creators-linha-c0a8e2f4-1b3d-4e5f-8a9b-0c1d2e3f4a5b",
    );
    expect(within(antigo).queryByTestId("creators-sem-pix")).toBeNull();
    expect(within(antigo).queryByTestId("creators-com-pix")).toBeNull();
  });

  it("coluna Posts (mes): zero e zero; ausente deixa a celula vazia", async () => {
    rotear({
      pagina: {
        data: {
          rows: [
            item({ posts_no_mes: 2 }),
            item({ user_id: UUID_B, name: "Bia Souza", posts_no_mes: 0 }),
            // Backend anterior ao lote 09: o campo nao vem, e "nao sei" nao e
            // "nenhuma publicacao".
            item({ user_id: "c0a8e2f4-1b3d-4e5f-8a9b-0c1d2e3f4a5b" }),
          ],
          total: 3,
          page: 1,
          pageSize: 25,
        },
      },
    });
    montar();

    const comPosts = await screen.findByTestId(`creators-linha-${UUID_A}`);
    expect(
      within(comPosts).getByTestId("creators-posts-no-mes").textContent,
    ).toBe("2");

    const semPosts = screen.getByTestId(`creators-linha-${UUID_B}`);
    expect(
      within(semPosts).getByTestId("creators-posts-no-mes").textContent,
    ).toBe("0");

    const antigo = screen.getByTestId(
      "creators-linha-c0a8e2f4-1b3d-4e5f-8a9b-0c1d2e3f4a5b",
    );
    expect(within(antigo).queryByTestId("creators-posts-no-mes")).toBeNull();
  });

  it("falha do quadro vira erro com tentar de novo, nao lista vazia", async () => {
    rotear({ pagina: new Error("timeout") });
    montar();
    expect(await screen.findByTestId("creators-quadro-erro")).toBeTruthy();
    expect(screen.queryByTestId("creators-vazio")).toBeNull();
  });
});

describe("painel de um creator", () => {
  it("clicar na linha busca o painel em 30 dias e o monta na visao admin", async () => {
    rotear();
    montar();

    fireEvent.click(await screen.findByTestId(`creators-linha-${UUID_A}`));

    const view = await screen.findByTestId("view-mock");
    expect(view.getAttribute("data-visao")).toBe("admin");
    // O Revelar da chave Pix (lote 08) precisa saber de quem e o painel.
    expect(view.getAttribute("data-user-id")).toBe(UUID_A);
    expect(view.textContent).toBe("Rafa Lima");
    expect(chamadas()).toContain(`/creators/${UUID_A}?janela=30d`);
    expect(
      screen
        .getByRole("link", { name: "Abrir na tela de usuários" })
        .getAttribute("href"),
    ).toBe(`/admin?section=usuarios&user=${UUID_A}`);
  });

  it("a visao admin nao ganhou abas nem faixa de pendencias (lote 08b)", async () => {
    // As abas sao da PAGINA /creator. Aqui quem olha e o admin, e o painel
    // aparece dentro da aba Creators, que ja tem a navegacao dela.
    rotear();
    montar();
    expect(await screen.findByTestId("creators-quadro")).toBeTruthy();
    expect(screen.queryByTestId("creator-abas")).toBeNull();
    expect(screen.queryByTestId("creator-pendencias")).toBeNull();

    fireEvent.click(screen.getByTestId(`creators-linha-${UUID_A}`));
    await screen.findByTestId("view-mock");
    expect(screen.queryByTestId("creator-abas")).toBeNull();
    expect(screen.queryByTestId("creator-pendencias")).toBeNull();
  });

  it("Voltar ao quadro nao busca o resumo de novo", async () => {
    rotear();
    montar();

    fireEvent.click(await screen.findByTestId(`creators-linha-${UUID_A}`));
    await screen.findByTestId("view-mock");

    fireEvent.click(screen.getByRole("button", { name: "Voltar ao quadro" }));

    expect(await screen.findByTestId("creators-quadro")).toBeTruthy();
    expect(screen.queryByTestId("view-mock")).toBeNull();
    expect(chamadas().filter((p) => p === "/creators/resumo")).toHaveLength(1);
  });

  it("404 de quem nunca foi creator tem frase propria", async () => {
    rotear({
      painel: new AdminApiError(
        "Este usuário nunca teve acesso de creator.",
        404,
        "creator_not_found",
      ),
    });
    montar(`/admin?section=creators&creator=${UUID_A}`);

    expect((await screen.findByTestId("creators-painel-404")).textContent).toBe(
      "Este usuário nunca teve acesso de creator.",
    );
    expect(screen.queryByTestId("creators-painel-erro")).toBeNull();
  });

  it("outra falha do painel e erro generico, nao o 404", async () => {
    rotear({ painel: new AdminApiError("Erro.", 500, "db_error") });
    montar(`/admin?section=creators&creator=${UUID_A}`);

    expect(await screen.findByTestId("creators-painel-erro")).toBeTruthy();
    expect(screen.queryByTestId("creators-painel-404")).toBeNull();
  });

  it("identificador invalido no link avisa e mostra o quadro", async () => {
    rotear();
    montar("/admin?section=creators&creator=lixo");

    expect(await screen.findByTestId("creators-link-invalido")).toBeTruthy();
    expect(await screen.findByTestId("creators-quadro")).toBeTruthy();
    expect(chamadas().some((p) => p.includes("/creators/lixo"))).toBe(false);
  });
});

describe("paridade com limparChavesDeSecao", () => {
  it("toda chave que a aba escreve na URL sai ao trocar de aba, e so ela", async () => {
    // Dirige a aba de verdade (pilulas e clique na linha) e le a URL que ela
    // produziu, em vez de confiar na lista: uma chave nova escrita pela aba e
    // esquecida na lista deixa este teste vermelho.
    rotear();
    const { hook, history } = memoryLocation({
      path: "/admin?section=creators&window=30d",
      record: true,
    });
    render(
      <Router hook={hook}>
        <CreatorsSection />
      </Router>,
    );
    await screen.findByTestId("creators-quadro");

    fireEvent.click(
      within(
        screen.getByRole("radiogroup", { name: "Status da concessão" }),
      ).getByRole("radio", { name: "Revogados" }),
    );
    await screen.findByTestId("creators-quadro");
    fireEvent.click(
      within(
        screen.getByRole("radiogroup", { name: "Tipo de creator" }),
      ).getByRole("radio", { name: "Afiliados" }),
    );
    fireEvent.click(await screen.findByTestId(`creators-linha-${UUID_A}`));
    await screen.findByTestId("view-mock");

    const caminhos = history ?? [];
    const ultimo = caminhos[caminhos.length - 1] ?? "";
    const search = ultimo.slice(ultimo.indexOf("?"));

    const escritas: string[] = [];
    new URLSearchParams(search).forEach((_valor, chave) => {
      if (chave !== "section" && chave !== "window") escritas.push(chave);
    });
    expect(escritas.sort()).toEqual([...CHAVES_DA_ABA_CREATORS].sort());
    expect(limparChavesDeSecao(search)).toBe("?section=creators&window=30d");
  });
});

describe("publicacoes para conferir (lote 10b)", () => {
  const PENDENTE_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
  const OUTRA_ID = "9d2c1b0a-8f7e-4d6c-b5a4-3f2e1d0c9b8a";
  const PENDENTES = {
    data: {
      rows: [
        {
          id: OUTRA_ID,
          user_id: UUID_B,
          network: "tiktok",
          kind: "video",
          url: "https://www.tiktok.com/@bia.souza/video/7311122233344455566",
          status: "pendente",
          confirmed_at: null,
          created_at: "2026-09-14T12:00:00Z",
          creator: { name: null, avatar_url: null, instagram_handle: "bia" },
        },
        {
          id: PENDENTE_ID,
          user_id: UUID_A,
          network: "instagram",
          kind: "reel",
          url: "https://www.instagram.com/reel/Cx1AbCdEf_-/",
          status: "pendente",
          confirmed_at: null,
          created_at: "2026-09-15T12:00:00Z",
          creator: {
            name: "Rafa Lima",
            avatar_url: null,
            instagram_handle: "rafalima",
          },
        },
      ],
      total: 2,
      page: 1,
      pageSize: 50,
    },
  };

  it("busca as pendentes com status, pagina e pageSize 50, e lista dono, rede, tipo, link e data", async () => {
    rotear({ pendentes: PENDENTES });
    montar();
    const bloco = await screen.findByTestId("creators-para-conferir");
    expect(chamadas()).toContain(
      "/creators/posts?status=pendente&page=1&pageSize=50",
    );
    expect(
      within(bloco).getByTestId("creators-para-conferir-total").textContent,
    ).toBe("2 aguardando");

    const linha = within(bloco).getByTestId(`creators-pendente-${PENDENTE_ID}`);
    expect(
      within(linha).getByTestId("creators-pendente-dono").textContent,
    ).toBe("Rafa Lima");
    expect(within(linha).getByTestId("icone-da-rede-instagram")).toBeTruthy();
    expect(linha.textContent).toContain("Instagram");
    expect(linha.textContent).toContain("Reel");
    const link = within(linha).getByRole("link");
    expect(link.getAttribute("href")).toBe(
      "https://www.instagram.com/reel/Cx1AbCdEf_-/",
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(linha.textContent).toContain("15/09/2026");

    // Sem nome: o @ do Instagram faz as vezes.
    const outra = within(bloco).getByTestId(`creators-pendente-${OUTRA_ID}`);
    expect(
      within(outra).getByTestId("creators-pendente-dono").textContent,
    ).toBe("@bia");
    expect(outra.textContent).toContain("Vídeo");
  });

  it("confirmar chama a rota do creator dono, tira a linha e desconta o total", async () => {
    rotear({ pendentes: PENDENTES, acao: { data: { post: {} } } });
    montar();
    await screen.findByTestId(`creators-pendente-${PENDENTE_ID}`);
    fireEvent.click(
      screen.getByTestId(`creators-pendente-confirmar-${PENDENTE_ID}`),
    );
    await waitFor(() =>
      expect(
        screen.queryByTestId(`creators-pendente-${PENDENTE_ID}`),
      ).toBeNull(),
    );
    const post = fetchMock.mock.calls.find(
      (c) => (c[1] as RequestInit | undefined)?.method === "POST",
    );
    expect(post?.[0]).toBe(
      `/creators/${UUID_A}/posts/${PENDENTE_ID}/confirmar`,
    );
    expect(screen.getByTestId("creators-para-conferir-total").textContent).toBe(
      "1 aguardando",
    );
    // A outra continua na lista.
    expect(screen.getByTestId(`creators-pendente-${OUTRA_ID}`)).toBeTruthy();
  });

  it("remover pede confirmacao e chama o DELETE do dono", async () => {
    rotear({ pendentes: PENDENTES, acao: { data: { id: OUTRA_ID } } });
    montar();
    await screen.findByTestId(`creators-pendente-${OUTRA_ID}`);
    fireEvent.click(
      screen.getByTestId(`creators-pendente-remover-${OUTRA_ID}`),
    );
    expect(
      fetchMock.mock.calls.some(
        (c) => (c[1] as RequestInit | undefined)?.method === "DELETE",
      ),
    ).toBe(false);
    fireEvent.click(
      screen.getByTestId(`creators-pendente-confirmar-remocao-${OUTRA_ID}`),
    );
    await waitFor(() =>
      expect(screen.queryByTestId(`creators-pendente-${OUTRA_ID}`)).toBeNull(),
    );
    const del = fetchMock.mock.calls.find(
      (c) => (c[1] as RequestInit | undefined)?.method === "DELETE",
    );
    expect(del?.[0]).toBe(`/creators/${UUID_B}/posts/${OUTRA_ID}`);
  });

  it("sem pendentes: a linha propria, e zero aguardando sem tom de alarme", async () => {
    rotear();
    montar();
    const bloco = await screen.findByTestId("creators-para-conferir");
    expect(
      within(bloco).getByTestId("creators-para-conferir-vazio").textContent,
    ).toBe("Nada para conferir.");
    const total = within(bloco).getByTestId("creators-para-conferir-total");
    expect(total.textContent).toBe("0 aguardando");
    expect(total.className).not.toContain("amber");
  });

  it("falha da lista vira erro com tentar de novo, sem derrubar o quadro", async () => {
    rotear({ pendentes: new Error("timeout") });
    montar();
    expect(
      await screen.findByTestId("creators-para-conferir-erro"),
    ).toBeTruthy();
    expect(await screen.findByTestId("creators-quadro")).toBeTruthy();
  });

  it("quadro: chip ambar de aguardando so quando ha pendencia", async () => {
    rotear({
      pagina: {
        data: {
          rows: [
            item({ posts_no_mes: 2, posts_aguardando: 3 }),
            item({
              user_id: UUID_B,
              name: "Bia Souza",
              posts_no_mes: 1,
              posts_aguardando: 0,
            }),
          ],
          total: 2,
          page: 1,
          pageSize: 25,
        },
      },
    });
    montar();
    const comPendencia = await screen.findByTestId(`creators-linha-${UUID_A}`);
    expect(
      within(comPendencia).getByTestId("creators-posts-no-mes").textContent,
    ).toBe("2");
    expect(
      within(comPendencia).getByTestId("creators-posts-aguardando").textContent,
    ).toBe("3 aguardando");
    const semPendencia = screen.getByTestId(`creators-linha-${UUID_B}`);
    expect(
      within(semPendencia).queryByTestId("creators-posts-aguardando"),
    ).toBeNull();
  });
});

describe("calendario dos creators no admin (lote 10d)", () => {
  it("fica entre as publicacoes para conferir e as pilulas do quadro, em modo admin", async () => {
    rotear();
    montar();
    const bloco = await screen.findByTestId("creators-calendario");
    expect(
      within(bloco).getByTestId("calendario-mock").getAttribute("data-modo"),
    ).toBe("admin");
    const conferir = screen.getByTestId("creators-para-conferir");
    const quadro = await screen.findByTestId("creators-quadro");
    expect(
      conferir.compareDocumentPosition(bloco) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      bloco.compareDocumentPosition(quadro) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
