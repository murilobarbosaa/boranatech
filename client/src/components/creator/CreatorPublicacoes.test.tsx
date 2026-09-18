import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

/**
 * CreatorPublicacoes: o registro de publicacoes na aba Comunidade (lote 09).
 *
 * O `contentFetch` e dublado e registra cada chamada com metodo e corpo. As
 * duas asserções que se repetem:
 *
 * 1. link invalido NAO vira requisicao (a regra de shared roda antes do envio);
 * 2. o que o servidor responde em 409 e 429 aparece na tela COM A MENSAGEM DELE,
 *    porque so o servidor sabe se ja existe ou se o teto do dia estourou.
 */

type Chamada = { path: string; method: string; body: unknown };

const estado = vi.hoisted(() => ({
  chamadas: [] as Chamada[],
  responder: (async () => ({})) as (
    path: string,
    method: string,
    body: unknown,
  ) => Promise<unknown>,
  toastOk: vi.fn(),
  toastErro: vi.fn(),
}));

vi.mock("@/lib/adminApi", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/adminApi")>();
  return {
    ...real,
    contentFetch: async (path: string, options?: RequestInit) => {
      const method = options?.method ?? "GET";
      const body =
        typeof options?.body === "string" ? JSON.parse(options.body) : null;
      estado.chamadas.push({ path, method, body });
      return estado.responder(path, method, body);
    },
  };
});
vi.mock("sonner", () => ({
  toast: {
    success: (...a: unknown[]) => estado.toastOk(...a),
    error: (...a: unknown[]) => estado.toastErro(...a),
  },
}));

import { AdminApiError } from "@/lib/adminApi";
import { CreatorPublicacoes } from "./CreatorPublicacoes";

const POST_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const OUTRO_ID = "1b4e28ba-2fa1-11d2-883f-0016d3cca427";

// REEL ainda aguarda conferencia; VIDEO ja foi conferido (lote 10b).
const REEL = {
  id: POST_ID,
  network: "instagram",
  kind: "reel",
  url: "https://www.instagram.com/reel/Cx1AbCdEf_-/",
  status: "pendente",
  confirmed_at: null,
  created_at: "2026-09-15T12:00:00Z",
};

const VIDEO = {
  id: OUTRO_ID,
  network: "tiktok",
  kind: "video",
  url: "https://www.tiktok.com/@ana.cria/video/7311122233344455566",
  status: "confirmado",
  confirmed_at: "2026-09-10T13:00:00Z",
  created_at: "2026-09-10T12:00:00Z",
};

const STORY = {
  id: "5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d",
  network: "instagram",
  kind: "story",
  url: "https://www.instagram.com/stories/ana.cria/3456789012345678901/",
  // Story nasce confirmado: o servidor grava assim e a lista mostra assim.
  status: "confirmado",
  confirmed_at: "2026-09-16T12:00:00Z",
  created_at: "2026-09-16T12:00:00Z",
};

function chamadasCom(method: string): Chamada[] {
  return estado.chamadas.filter((c) => c.method === method);
}

// O jsdom nao tem estas APIs, e o Radix Select (o BntSelect do tipo) as chama
// ao abrir o popup. Mesmos stubs de CreatorPixForm.test.tsx.
beforeAll(() => {
  if (!("ResizeObserver" in globalThis)) {
    class ResizeObserverDeTeste {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver =
      ResizeObserverDeTeste;
  }
  Element.prototype.scrollIntoView ||= () => {};
  Element.prototype.hasPointerCapture ||= () => false;
  Element.prototype.releasePointerCapture ||= () => {};
});

/**
 * Escolhe o tipo pelo teclado, como a pessoa faria: abre com a seta, confirma
 * com Enter e ESPERA o popup fechar. Enquanto ele esta aberto o resto do
 * formulario fica fora de alcance.
 */
async function escolherTipo(nome: string): Promise<void> {
  fireEvent.keyDown(
    screen.getByRole("combobox", { name: "Tipo da publicação" }),
    { key: "ArrowDown" },
  );
  const opcao = await screen.findByRole("option", { name: nome });
  fireEvent.keyDown(opcao, { key: "Enter" });
  await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
}

function responderLista(posts: unknown[], no_mes: number, aguardando = 0) {
  estado.responder = async (_path, method) =>
    method === "GET"
      ? { data: { posts, total: posts.length, no_mes, aguardando } }
      : {};
}

beforeEach(() => {
  estado.chamadas = [];
  estado.toastOk = vi.fn();
  estado.toastErro = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe("CreatorPublicacoes: leitura", () => {
  it("lista as publicacoes com o link, o tipo e o dia", async () => {
    responderLista([REEL, VIDEO], 2);
    render(<CreatorPublicacoes />);
    const linha = await screen.findByTestId(`creator-publicacao-${POST_ID}`);
    expect(estado.chamadas).toEqual([
      { path: "/creator/posts", method: "GET", body: null },
    ]);
    const link = within(linha).getByRole("link");
    expect(link.getAttribute("href")).toBe(REEL.url);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
    // O `https://www.` sai da tela; o que identifica a publicacao fica.
    expect(link.textContent).toBe("instagram.com/reel/Cx1AbCdEf_-");
    expect(linha.textContent).toContain("reel");
    expect(linha.textContent).toContain("15/09");
    expect(screen.getByTestId("creator-publicacoes-no-mes").textContent).toBe(
      "2 confirmadas este mês",
    );
  });

  it("dois lados no desktop: cabecalho e formulario de um, lista do outro", async () => {
    // Lote 10: o cabecalho passou a morar DENTRO do componente, porque ele e a
    // primeira coisa da coluna da esquerda. A lista rola por dentro, entao a
    // coluna da esquerda continua a vista quando houver muita publicacao.
    responderLista([REEL], 1);
    render(<CreatorPublicacoes />);
    const raiz = await screen.findByTestId("creator-publicacoes");
    expect(raiz.className).toContain(
      "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]",
    );
    expect(
      screen.getByRole("heading", { name: "Suas publicações" }),
    ).toBeTruthy();
    const lista = screen.getByRole("list");
    expect(lista.parentElement?.className).toContain("max-h-80");
    expect(lista.parentElement?.className).toContain("overflow-y-auto");
  });

  it("sem nenhuma: a frase do estado vazio, e nenhuma linha", async () => {
    responderLista([], 0);
    render(<CreatorPublicacoes />);
    await screen.findByTestId("creator-publicacoes-vazio");
    expect(screen.queryByRole("listitem")).toBeNull();
    expect(screen.getByTestId("creator-publicacoes-no-mes").textContent).toBe(
      "0 confirmadas este mês",
    );
    expect(screen.queryByTestId("creator-publicacoes-aguardando")).toBeNull();
  });

  it("erro na busca: bloco de erro, e tentar de novo refaz a mesma busca", async () => {
    let vez = 0;
    estado.responder = async () => {
      vez += 1;
      if (vez === 1) throw new AdminApiError("falhou", 500, "db_error");
      return { data: { posts: [], total: 0, no_mes: 0 } };
    };
    render(<CreatorPublicacoes />);
    const erro = await screen.findByTestId("creator-publicacoes-erro");
    fireEvent.click(
      within(erro).getByRole("button", { name: "Tentar de novo" }),
    );
    await screen.findByTestId("creator-publicacoes-vazio");
    expect(chamadasCom("GET")).toHaveLength(2);
  });

  it("resposta fora do formato vira erro, nunca lista vazia", async () => {
    estado.responder = async () => ({ data: { ok: true } });
    render(<CreatorPublicacoes />);
    await screen.findByTestId("creator-publicacoes-erro");
    expect(screen.queryByTestId("creator-publicacoes-vazio")).toBeNull();
  });
});

describe("CreatorPublicacoes: registro", () => {
  it("link valido: manda o que foi colado e poe a publicacao no topo", async () => {
    responderLista([VIDEO], 1);
    render(<CreatorPublicacoes />);
    await screen.findByTestId(`creator-publicacao-${OUTRO_ID}`);

    estado.responder = async (_path, method) =>
      method === "POST"
        ? { data: { post: REEL } }
        : { data: { posts: [VIDEO], total: 1, no_mes: 1 } };
    // Sem tipo escolhido o botao nem responde: o tipo decide o status inicial
    // e nao pode ser deduzido em silencio.
    const registrar = screen.getByTestId(
      "creator-publicacoes-registrar",
    ) as HTMLButtonElement;
    expect(registrar.disabled).toBe(true);
    await escolherTipo("Reel");
    expect(registrar.disabled).toBe(false);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "instagram.com/reel/Cx1AbCdEf_-?igshid=abc" },
    });
    fireEvent.click(registrar);

    await waitFor(() => expect(chamadasCom("POST")).toHaveLength(1));
    expect(chamadasCom("POST")[0]).toEqual({
      path: "/creator/posts",
      method: "POST",
      body: { url: "instagram.com/reel/Cx1AbCdEf_-?igshid=abc", tipo: "reel" },
    });
    await screen.findByTestId(`creator-publicacao-${POST_ID}`);
    // O reel nasce pendente: nao entra nas confirmadas, entra no aguardando.
    expect(screen.getByTestId("creator-publicacoes-no-mes").textContent).toBe(
      "1 confirmadas este mês",
    );
    expect(
      screen.getByTestId("creator-publicacoes-aguardando").textContent,
    ).toBe("1 aguardando");
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
    expect(estado.toastOk).toHaveBeenCalledTimes(1);
  });

  it("link invalido: erro no campo e NENHUMA requisicao", async () => {
    responderLista([], 0);
    render(<CreatorPublicacoes />);
    await screen.findByTestId("creator-publicacoes-vazio");
    await escolherTipo("Post");
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "https://www.instagram.com/ana.cria/" },
    });
    fireEvent.click(screen.getByTestId("creator-publicacoes-registrar"));
    expect(
      screen.getByTestId("creator-publicacoes-erro-campo").textContent,
    ).toContain("Link inválido");
    expect(chamadasCom("POST")).toHaveLength(0);
  });

  it("link curto: mensagem propria, e tambem nenhuma requisicao", async () => {
    responderLista([], 0);
    render(<CreatorPublicacoes />);
    await screen.findByTestId("creator-publicacoes-vazio");
    await escolherTipo("Vídeo do TikTok");
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "https://vm.tiktok.com/ZMabc1234/" },
    });
    fireEvent.click(screen.getByTestId("creator-publicacoes-registrar"));
    expect(
      screen.getByTestId("creator-publicacoes-erro-campo").textContent,
    ).toContain("Link curto");
    expect(chamadasCom("POST")).toHaveLength(0);
  });

  it("409 e 429: a mensagem do SERVIDOR aparece, e nada entra na lista", async () => {
    responderLista([], 0);
    render(<CreatorPublicacoes />);
    await screen.findByTestId("creator-publicacoes-vazio");
    await escolherTipo("Reel");

    estado.responder = async (_path, method) => {
      if (method === "POST") {
        throw new AdminApiError(
          "Você já registrou esta publicação.",
          409,
          "post_already_registered",
        );
      }
      return { data: { posts: [], total: 0, no_mes: 0 } };
    };
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: REEL.url },
    });
    fireEvent.click(screen.getByTestId("creator-publicacoes-registrar"));
    await waitFor(() =>
      expect(
        screen.getByTestId("creator-publicacoes-erro-campo").textContent,
      ).toBe("Você já registrou esta publicação."),
    );
    expect(screen.getByTestId("creator-publicacoes-vazio")).toBeTruthy();

    estado.responder = async (_path, method) => {
      if (method === "POST") {
        throw new AdminApiError(
          "Você já registrou 10 publicações hoje. Tente de novo amanhã.",
          429,
          "post_daily_limit",
        );
      }
      return { data: { posts: [], total: 0, no_mes: 0 } };
    };
    fireEvent.click(screen.getByTestId("creator-publicacoes-registrar"));
    await waitFor(() =>
      expect(
        screen.getByTestId("creator-publicacoes-erro-campo").textContent,
      ).toContain("10 publicações hoje"),
    );
  });
});

describe("CreatorPublicacoes: remocao", () => {
  it("pede confirmacao antes de apagar, e so entao chama o DELETE", async () => {
    responderLista([REEL], 0, 1);
    render(<CreatorPublicacoes />);
    await screen.findByTestId(`creator-publicacao-${POST_ID}`);

    fireEvent.click(
      screen.getByTestId(`creator-publicacao-remover-${POST_ID}`),
    );
    expect(chamadasCom("DELETE")).toHaveLength(0);

    estado.responder = async () => ({ data: { id: POST_ID } });
    fireEvent.click(
      screen.getByTestId(`creator-publicacao-confirmar-${POST_ID}`),
    );
    await waitFor(() =>
      expect(chamadasCom("DELETE")).toEqual([
        { path: `/creator/posts/${POST_ID}`, method: "DELETE", body: null },
      ]),
    );
    await screen.findByTestId("creator-publicacoes-vazio");
    // Era pendente: sai do aguardando, e as confirmadas nao mudam.
    expect(screen.getByTestId("creator-publicacoes-no-mes").textContent).toBe(
      "0 confirmadas este mês",
    );
    expect(screen.queryByTestId("creator-publicacoes-aguardando")).toBeNull();
  });

  it("Manter fecha a confirmacao sem chamar o servidor", async () => {
    responderLista([REEL], 1);
    render(<CreatorPublicacoes />);
    await screen.findByTestId(`creator-publicacao-${POST_ID}`);
    fireEvent.click(
      screen.getByTestId(`creator-publicacao-remover-${POST_ID}`),
    );
    fireEvent.click(screen.getByRole("button", { name: "Manter" }));
    expect(
      screen.getByTestId(`creator-publicacao-remover-${POST_ID}`),
    ).toBeTruthy();
    expect(chamadasCom("DELETE")).toHaveLength(0);
  });
});

describe("CreatorPublicacoes: glifos e estado vazio (lote 10b)", () => {
  it("cada linha leva o glifo oficial da rede, e nao o icone do lucide", async () => {
    responderLista([REEL, VIDEO], 2);
    render(<CreatorPublicacoes />);
    const reel = await screen.findByTestId(`creator-publicacao-${POST_ID}`);
    expect(within(reel).getByTestId("icone-da-rede-instagram")).toBeTruthy();
    // O lixo da remocao continua sendo do lucide; o que saiu foi a marca.
    expect(reel.querySelector("svg.lucide-instagram")).toBeNull();
    expect(reel.querySelector("svg.lucide-video")).toBeNull();
    const video = screen.getByTestId(`creator-publicacao-${OUTRO_ID}`);
    expect(within(video).getByTestId("icone-da-rede-tiktok")).toBeTruthy();
  });

  it("sem publicacao, a coluna da direita centraliza a frase nas duas direcoes", async () => {
    responderLista([], 0);
    render(<CreatorPublicacoes />);
    await screen.findByTestId("creator-publicacoes-vazio");
    const coluna = screen.getByTestId("creator-publicacoes-lista");
    for (const classe of [
      "flex",
      "min-h-40",
      "items-center",
      "justify-center",
      "text-center",
    ]) {
      expect(coluna.className).toContain(classe);
    }
    // A rolagem interna e da lista com itens; vazia, nao ha o que rolar.
    expect(coluna.className).not.toContain("overflow-y-auto");
  });
});

describe("CreatorPublicacoes: tipo escolhido (lote 10b)", () => {
  it("as quatro opcoes, na ordem do shared, e a frase pede o tipo", async () => {
    responderLista([], 0);
    render(<CreatorPublicacoes />);
    await screen.findByTestId("creator-publicacoes-vazio");
    fireEvent.keyDown(
      screen.getByRole("combobox", { name: "Tipo da publicação" }),
      { key: "ArrowDown" },
    );
    const opcoes = await screen.findAllByRole("option");
    expect(opcoes.map((o) => o.textContent)).toEqual([
      "Post",
      "Reel",
      "Story",
      "Vídeo do TikTok",
    ]);
  });

  it("link de outro tipo: a mensagem diz qual tipo o link e, e NENHUMA requisicao", async () => {
    responderLista([], 0);
    render(<CreatorPublicacoes />);
    await screen.findByTestId("creator-publicacoes-vazio");
    await escolherTipo("Post");
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: REEL.url },
    });
    fireEvent.click(screen.getByTestId("creator-publicacoes-registrar"));
    expect(
      screen.getByTestId("creator-publicacoes-erro-campo").textContent,
    ).toBe("Esse link é de um reel. Troque o tipo ou o link.");
    expect(chamadasCom("POST")).toHaveLength(0);

    // TikTok com tipo do Instagram: o nome do tipo detectado e o do shared.
    await escolherTipo("Story");
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: VIDEO.url },
    });
    fireEvent.click(screen.getByTestId("creator-publicacoes-registrar"));
    expect(
      screen.getByTestId("creator-publicacoes-erro-campo").textContent,
    ).toBe("Esse link é de um vídeo do tiktok. Troque o tipo ou o link.");
    expect(chamadasCom("POST")).toHaveLength(0);
  });

  it("story: manda tipo story e entra na lista como as outras", async () => {
    responderLista([], 0);
    render(<CreatorPublicacoes />);
    await screen.findByTestId("creator-publicacoes-vazio");
    estado.responder = async (_path, method) =>
      method === "POST"
        ? { data: { post: STORY } }
        : { data: { posts: [], total: 0, no_mes: 0 } };
    await escolherTipo("Story");
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: STORY.url },
    });
    fireEvent.click(screen.getByTestId("creator-publicacoes-registrar"));
    await waitFor(() => expect(chamadasCom("POST")).toHaveLength(1));
    expect(chamadasCom("POST")[0].body).toEqual({
      url: STORY.url,
      tipo: "story",
    });
    const linha = await screen.findByTestId(`creator-publicacao-${STORY.id}`);
    expect(linha.textContent).toContain("story");
  });
});

describe("CreatorPublicacoes: status (lote 10b)", () => {
  it("pendente ganha o chip cinza e a linha apagada; confirmada ganha o chip verde", async () => {
    responderLista([REEL, VIDEO], 1, 1);
    render(<CreatorPublicacoes />);
    const pendente = await screen.findByTestId(`creator-publicacao-${POST_ID}`);
    expect(
      within(pendente).getByTestId("publicacao-status-pendente").textContent,
    ).toBe("aguardando conferência");
    expect(pendente.className).toContain("opacity-70");

    const confirmada = screen.getByTestId(`creator-publicacao-${OUTRO_ID}`);
    expect(
      within(confirmada).getByTestId("publicacao-status-confirmada")
        .textContent,
    ).toBe("confirmada");
    expect(confirmada.className).not.toContain("opacity-70");

    expect(screen.getByTestId("creator-publicacoes-no-mes").textContent).toBe(
      "1 confirmadas este mês",
    );
    expect(
      screen.getByTestId("creator-publicacoes-aguardando").textContent,
    ).toBe("1 aguardando");
  });

  it("backend anterior (sem status nem aguardando): nenhum chip, e a contagem como antes", async () => {
    const { status: _s, confirmed_at: _c, ...semStatus } = REEL;
    estado.responder = async (_path, method) =>
      method === "GET"
        ? { data: { posts: [semStatus], total: 1, no_mes: 1 } }
        : {};
    render(<CreatorPublicacoes />);
    const linha = await screen.findByTestId(`creator-publicacao-${POST_ID}`);
    expect(
      within(linha).queryByTestId("publicacao-status-pendente"),
    ).toBeNull();
    expect(
      within(linha).queryByTestId("publicacao-status-confirmada"),
    ).toBeNull();
    expect(linha.className).not.toContain("opacity-70");
    expect(screen.queryByTestId("creator-publicacoes-aguardando")).toBeNull();
  });

  it("story registrada entra como confirmada e soma nas confirmadas", async () => {
    responderLista([], 0);
    render(<CreatorPublicacoes />);
    await screen.findByTestId("creator-publicacoes-vazio");
    estado.responder = async (_path, method) =>
      method === "POST"
        ? { data: { post: STORY } }
        : { data: { posts: [], total: 0, no_mes: 0, aguardando: 0 } };
    await escolherTipo("Story");
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: STORY.url },
    });
    fireEvent.click(screen.getByTestId("creator-publicacoes-registrar"));
    const linha = await screen.findByTestId(`creator-publicacao-${STORY.id}`);
    expect(
      within(linha).getByTestId("publicacao-status-confirmada"),
    ).toBeTruthy();
    expect(screen.getByTestId("creator-publicacoes-no-mes").textContent).toBe(
      "1 confirmadas este mês",
    );
    expect(screen.queryByTestId("creator-publicacoes-aguardando")).toBeNull();
  });
});
