import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CreatorCalendario: o calendario compartilhado da aba Comunidade (lote 10).
 *
 * OS DIAS SAO CALCULADOS A PARTIR DE HOJE, e nao escritos como literais: a
 * janela de marcacao vai de hoje ate hoje mais 90 dias, e o mes desenhado e o
 * corrente, entao qualquer data fixa faria o teste falhar sozinho por decurso
 * de prazo. Os literais de data vivem em shared/creatorCalendar.test.ts, que e
 * onde a regra mora.
 *
 * A assercao que mais importa e a de identidade: a marcacao PROPRIA oferece
 * "Desmarcar" e a de outro oferece "Pedir collab", e enquanto a sessao nao
 * respondeu NENHUMA das duas aparece. "Nao sei de quem e" nao e "e de outro".
 */

type Chamada = { path: string; method: string; body: unknown };

const estado = vi.hoisted(() => ({
  chamadas: [] as Chamada[],
  responder: (async () => ({})) as (
    path: string,
    method: string,
    body: unknown,
  ) => Promise<unknown>,
  auth: { user: null as null | { id: string } },
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
// So `useAuth` e consumido por este componente; um dublê direto evita arrastar
// o cliente do Supabase para dentro do teste.
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => estado.auth,
}));

import { AdminApiError } from "@/lib/adminApi";
import { diaBrasilia, somarDiaCivil } from "@shared/brasiliaDay";
import { CreatorCalendario } from "./CreatorCalendario";

const MEU_ID = "22222222-2222-2222-2222-222222222222";
const OUTRO_ID = "33333333-3333-3333-3333-333333333333";

const HOJE = diaBrasilia(new Date().toISOString())!;
const MES = HOJE.slice(0, 7);

const MINHA = {
  id: "8f14e45f-ceea-467a-9f6b-2c1d0e2a9b77",
  user_id: MEU_ID,
  event_date: HOJE,
  network: "instagram",
  note: "bastidores do curso",
  created_at: "2026-09-16T12:00:00Z",
  autor: { user_id: MEU_ID, name: "Cria", handle: "cria" },
};

const DE_OUTRO = {
  id: "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
  user_id: OUTRO_ID,
  event_date: HOJE,
  network: "tiktok",
  note: null,
  created_at: "2026-09-16T13:00:00Z",
  autor: { user_id: OUTRO_ID, name: "Outra Cria", handle: "outracria" },
};

const PEDIDO = {
  id: "2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
  event_id: MINHA.id,
  requester_id: OUTRO_ID,
  owner_id: MEU_ID,
  message: "bora?",
  status: "pendente",
  event_date: HOJE,
  network: "instagram",
  outra_pessoa: { user_id: OUTRO_ID, name: "Outra Cria", handle: "outracria" },
};

function chamadasCom(method: string): Chamada[] {
  return estado.chamadas.filter((c) => c.method === method);
}

function responderCom(marcacoes: unknown[], recebidos: unknown[] = []) {
  estado.responder = async (path, method) => {
    if (method !== "GET") return {};
    return path.startsWith("/creator/collabs")
      ? { data: { recebidos, enviados: [] } }
      : { data: { marcacoes } };
  };
}

beforeEach(() => {
  estado.chamadas = [];
  estado.auth = { user: { id: MEU_ID } };
  estado.toastOk = vi.fn();
  estado.toastErro = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe("CreatorCalendario: leitura", () => {
  it("busca o mes corrente e os pedidos, e desenha a grade", async () => {
    responderCom([MINHA]);
    render(<CreatorCalendario />);
    await screen.findByTestId("creator-calendario");
    expect(estado.chamadas).toEqual([
      { path: `/creator/calendar?mes=${MES}`, method: "GET", body: null },
      { path: "/creator/collabs", method: "GET", body: null },
    ]);
    // O dia de hoje traz a contagem de quem marcou.
    expect(screen.getByTestId(`creator-dia-contagem-${HOJE}`).textContent).toBe(
      "1",
    );
  });

  it("mostra as marcacoes de TODOS, com o nome de quem marcou", async () => {
    responderCom([MINHA, DE_OUTRO]);
    render(<CreatorCalendario />);
    await screen.findByTestId("creator-dia-painel");
    const minha = screen.getByTestId(`creator-marcacao-${MINHA.id}`);
    const outra = screen.getByTestId(`creator-marcacao-${DE_OUTRO.id}`);
    expect(minha.textContent).toContain("Você");
    expect(minha.textContent).toContain("bastidores do curso");
    expect(outra.textContent).toContain("Outra Cria");
    expect(outra.textContent).toContain("TikTok");
  });

  it("dia sem ninguem: a frase do estado vazio", async () => {
    responderCom([]);
    render(<CreatorCalendario />);
    await screen.findByTestId("creator-dia-vazio");
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("erro na busca: bloco de erro, e tentar de novo refaz as duas buscas", async () => {
    let vez = 0;
    estado.responder = async (path, method) => {
      vez += 1;
      if (vez <= 2) throw new AdminApiError("falhou", 500, "db_error");
      if (method !== "GET") return {};
      return path.startsWith("/creator/collabs")
        ? { data: { recebidos: [], enviados: [] } }
        : { data: { marcacoes: [] } };
    };
    render(<CreatorCalendario />);
    const erro = await screen.findByTestId("creator-calendario-erro");
    fireEvent.click(
      within(erro).getByRole("button", { name: "Tentar de novo" }),
    );
    await screen.findByTestId("creator-calendario");
    expect(chamadasCom("GET")).toHaveLength(4);
  });

  it("resposta fora do formato vira erro, nunca calendario vazio", async () => {
    estado.responder = async () => ({ data: { ok: true } });
    render(<CreatorCalendario />);
    await screen.findByTestId("creator-calendario-erro");
    expect(screen.queryByTestId("creator-dia-painel")).toBeNull();
  });
});

describe("CreatorCalendario: de quem e a marcacao", () => {
  it("a minha oferece Desmarcar; a de outro oferece Pedir collab", async () => {
    responderCom([MINHA, DE_OUTRO]);
    render(<CreatorCalendario />);
    await screen.findByTestId("creator-dia-painel");
    expect(
      screen.getByTestId(`creator-marcacao-remover-${MINHA.id}`),
    ).toBeTruthy();
    expect(screen.queryByTestId(`creator-collab-pedir-${MINHA.id}`)).toBeNull();
    expect(
      screen.getByTestId(`creator-collab-pedir-${DE_OUTRO.id}`),
    ).toBeTruthy();
    expect(
      screen.queryByTestId(`creator-marcacao-remover-${DE_OUTRO.id}`),
    ).toBeNull();
  });

  it("sessao ainda sem resposta: NENHUMA das duas acoes aparece", async () => {
    // "Nao sei de quem e" nao e "e de outro": oferecer collab aqui produziria
    // um 400 `own_event` se a marcacao fosse a propria.
    estado.auth = { user: null };
    responderCom([MINHA, DE_OUTRO]);
    render(<CreatorCalendario />);
    await screen.findByTestId("creator-dia-painel");
    expect(
      screen.queryByTestId(`creator-marcacao-remover-${MINHA.id}`),
    ).toBeNull();
    expect(
      screen.queryByTestId(`creator-collab-pedir-${DE_OUTRO.id}`),
    ).toBeNull();
  });
});

describe("CreatorCalendario: marcar e desmarcar", () => {
  it("marca o dia com a rede escolhida e limpa o campo", async () => {
    responderCom([]);
    render(<CreatorCalendario />);
    await screen.findByTestId("creator-dia-vazio");

    estado.responder = async (_path, method) =>
      method === "POST"
        ? { data: { marcacao: { ...MINHA, network: "tiktok" } } }
        : { data: { marcacoes: [] } };
    fireEvent.click(screen.getByTestId("creator-marcar-rede-tiktok"));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "  bastidores  " },
    });
    fireEvent.click(screen.getByTestId("creator-marcar-dia"));

    await waitFor(() => expect(chamadasCom("POST")).toHaveLength(1));
    expect(chamadasCom("POST")[0]).toEqual({
      path: "/creator/calendar",
      method: "POST",
      body: { event_date: HOJE, network: "tiktok", note: "  bastidores  " },
    });
    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(""),
    );
    expect(estado.toastOk).toHaveBeenCalledTimes(1);
  });

  it("nota acima do teto: erro no campo e NENHUMA requisicao", async () => {
    responderCom([]);
    render(<CreatorCalendario />);
    await screen.findByTestId("creator-dia-vazio");
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "a".repeat(141) },
    });
    fireEvent.click(screen.getByTestId("creator-marcar-dia"));
    expect(
      screen.getByTestId("creator-calendario-erro-campo").textContent,
    ).toContain("140 caracteres");
    expect(chamadasCom("POST")).toHaveLength(0);
  });

  it("409 do servidor: a mensagem DELE aparece no campo", async () => {
    responderCom([]);
    render(<CreatorCalendario />);
    await screen.findByTestId("creator-dia-vazio");

    estado.responder = async (_path, method) => {
      if (method === "POST") {
        throw new AdminApiError(
          "Você já marcou esse dia nessa rede.",
          409,
          "event_already_marked",
        );
      }
      return { data: { marcacoes: [] } };
    };
    fireEvent.click(screen.getByTestId("creator-marcar-dia"));
    await waitFor(() =>
      expect(
        screen.getByTestId("creator-calendario-erro-campo").textContent,
      ).toBe("Você já marcou esse dia nessa rede."),
    );
  });

  it("desmarcar chama o DELETE e tira a marcacao da lista", async () => {
    responderCom([MINHA]);
    render(<CreatorCalendario />);
    await screen.findByTestId(`creator-marcacao-${MINHA.id}`);

    estado.responder = async () => ({ data: { id: MINHA.id } });
    fireEvent.click(screen.getByTestId(`creator-marcacao-remover-${MINHA.id}`));
    await waitFor(() =>
      expect(chamadasCom("DELETE")).toEqual([
        { path: `/creator/calendar/${MINHA.id}`, method: "DELETE", body: null },
      ]),
    );
    await screen.findByTestId("creator-dia-vazio");
  });
});

describe("CreatorCalendario: collab", () => {
  it("pedir collab manda o recado para a marcacao do outro", async () => {
    responderCom([DE_OUTRO]);
    render(<CreatorCalendario />);
    await screen.findByTestId(`creator-marcacao-${DE_OUTRO.id}`);

    fireEvent.click(screen.getByTestId(`creator-collab-pedir-${DE_OUTRO.id}`));
    estado.responder = async () => ({ data: { pedido: PEDIDO } });
    // Pelo placeholder, e nao por `getByRole("textbox")`: com o formulario de
    // collab aberto ha DOIS campos na tela (o recado e a nota do "marcar este
    // dia"), e o papel generico casaria com os dois.
    fireEvent.change(
      screen.getByPlaceholderText("Um recado curto (opcional)"),
      { target: { value: "bora?" } },
    );
    fireEvent.click(screen.getByTestId(`creator-collab-enviar-${DE_OUTRO.id}`));

    await waitFor(() =>
      expect(chamadasCom("POST")).toEqual([
        {
          path: `/creator/calendar/${DE_OUTRO.id}/collab`,
          method: "POST",
          body: { message: "bora?" },
        },
      ]),
    );
    expect(estado.toastOk).toHaveBeenCalledTimes(1);
  });

  it("429 do servidor: a mensagem do teto aparece", async () => {
    responderCom([DE_OUTRO]);
    render(<CreatorCalendario />);
    await screen.findByTestId(`creator-marcacao-${DE_OUTRO.id}`);

    fireEvent.click(screen.getByTestId(`creator-collab-pedir-${DE_OUTRO.id}`));
    estado.responder = async () => {
      throw new AdminApiError(
        "Você já pediu 5 collabs hoje. Tente de novo amanhã.",
        429,
        "collab_daily_limit",
      );
    };
    fireEvent.click(screen.getByTestId(`creator-collab-enviar-${DE_OUTRO.id}`));
    await waitFor(() =>
      expect(
        screen.getByTestId("creator-calendario-erro-campo").textContent,
      ).toContain("5 collabs hoje"),
    );
  });

  it("a faixa mostra o pedido recebido, e aceitar manda aceita true", async () => {
    responderCom([MINHA], [PEDIDO]);
    render(<CreatorCalendario />);
    const faixa = await screen.findByTestId("creator-collabs-pendentes");
    expect(faixa.textContent).toContain("Outra Cria");
    expect(faixa.textContent).toContain("bora?");

    estado.responder = async () => ({
      data: { pedido: { ...PEDIDO, status: "aceita" } },
    });
    fireEvent.click(screen.getByTestId(`creator-collab-aceitar-${PEDIDO.id}`));
    await waitFor(() =>
      expect(chamadasCom("POST")).toEqual([
        {
          path: `/creator/collabs/${PEDIDO.id}/responder`,
          method: "POST",
          body: { aceita: true },
        },
      ]),
    );
    // Respondido some da faixa: ela e a lista do que AINDA espera resposta.
    await waitFor(() =>
      expect(screen.queryByTestId("creator-collabs-pendentes")).toBeNull(),
    );
  });

  it("recusar manda aceita false", async () => {
    responderCom([MINHA], [PEDIDO]);
    render(<CreatorCalendario />);
    await screen.findByTestId("creator-collabs-pendentes");

    estado.responder = async () => ({
      data: { pedido: { ...PEDIDO, status: "recusada" } },
    });
    fireEvent.click(screen.getByTestId(`creator-collab-recusar-${PEDIDO.id}`));
    await waitFor(() =>
      expect(chamadasCom("POST")[0].body).toEqual({ aceita: false }),
    );
  });

  it("sem pedido pendente a faixa nao existe", async () => {
    responderCom([MINHA], []);
    render(<CreatorCalendario />);
    await screen.findByTestId("creator-calendario");
    expect(screen.queryByTestId("creator-collabs-pendentes")).toBeNull();
  });
});

describe("CreatorCalendario: navegacao de mes", () => {
  it("o mes seguinte busca de novo, com a chave do mes novo", async () => {
    responderCom([]);
    render(<CreatorCalendario />);
    await screen.findByTestId("creator-calendario");

    fireEvent.click(screen.getByTestId("creator-calendario-proximo"));
    const seguinte = somarDiaCivil(`${MES}-01`, 32).slice(0, 7);
    await waitFor(() =>
      expect(
        chamadasCom("GET").some(
          (c) => c.path === `/creator/calendar?mes=${seguinte}`,
        ),
      ).toBe(true),
    );
    // Trocar de mes fecha o painel do dia: o dia selecionado era do mes velho.
    expect(screen.queryByTestId("creator-dia-painel")).toBeNull();
  });
});

describe("CreatorCalendario: glifos das redes (lote 10b)", () => {
  it("os botoes de rede e os chips das marcacoes usam o glifo oficial, com folga do texto", async () => {
    responderCom([MINHA, DE_OUTRO]);
    estado.auth.user = { id: MEU_ID };
    render(<CreatorCalendario />);
    await screen.findByTestId(`creator-marcacao-${MINHA.id}`);

    for (const rede of ["instagram", "tiktok"]) {
      const botao = screen.getByTestId(`creator-marcar-rede-${rede}`);
      expect(within(botao).getByTestId(`icone-da-rede-${rede}`)).toBeTruthy();
      // Sem `gap-2` o glifo encostava no nome da rede.
      expect(botao.className).toContain("gap-2");
      expect(botao.className).toContain("px-4");
      // Os icones do lucide sairam: nem o Instagram aproximado, nem o Video
      // que fazia as vezes do TikTok.
      expect(botao.querySelector("svg.lucide-instagram")).toBeNull();
      expect(botao.querySelector("svg.lucide-video")).toBeNull();
    }

    expect(
      within(screen.getByTestId(`creator-marcacao-${MINHA.id}`)).getByTestId(
        "icone-da-rede-instagram",
      ),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId(`creator-marcacao-${DE_OUTRO.id}`)).getByTestId(
        "icone-da-rede-tiktok",
      ),
    ).toBeTruthy();
  });
});

// DOIS BUGS DO LOTE 10, reproduzidos antes da correcao (lote 10c). O primeiro
// e de layout: "Pedir collab" colado no nome quando a marcacao nao tem nota e
// encostado na direita quando tem. O segundo e de estado: depois de "Enviar
// pedido" o botao continuava la, porque o servidor nao dizia que a pessoa ja
// tinha pedido (nao existia `meu_pedido`) e o client nao recarregava.
describe("CreatorCalendario: acao alinhada e estado do pedido (lote 10c)", () => {
  const SEM_NOTA = {
    ...DE_OUTRO,
    id: "3c9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
    note: null,
  };

  it("bug 1: o botao carrega ml-auto na linha com nota e na linha sem nota", async () => {
    responderCom([MINHA, DE_OUTRO, { ...SEM_NOTA, meu_pedido: null }]);
    render(<CreatorCalendario />);
    await screen.findByTestId(`creator-marcacao-${DE_OUTRO.id}`);
    for (const id of [DE_OUTRO.id, SEM_NOTA.id]) {
      const botao = screen.getByTestId(`creator-collab-pedir-${id}`);
      expect(botao.className, id).toContain("ml-auto");
      expect(botao.className, id).toContain("shrink-0");
      // A nota (ou o espaco dela) esta la nas duas linhas, ocupando o meio.
      const nota = screen.getByTestId(`creator-marcacao-nota-${id}`);
      expect(nota.className).toContain("flex-1");
      expect(nota.className).toContain("min-w-0");
      expect(nota.className).toContain("truncate");
    }
    // A minha tem o Desmarcar na mesma coluna.
    expect(
      screen.getByTestId(`creator-marcacao-remover-${MINHA.id}`).className,
    ).toContain("ml-auto");
  });

  it("bug 2: depois de Enviar pedido, o mes e recarregado e o botao vira o chip 'pedido enviado'", async () => {
    responderCom([{ ...DE_OUTRO, meu_pedido: null }]);
    render(<CreatorCalendario />);
    await screen.findByTestId(`creator-marcacao-${DE_OUTRO.id}`);
    expect(chamadasCom("GET")).toHaveLength(2);

    fireEvent.click(screen.getByTestId(`creator-collab-pedir-${DE_OUTRO.id}`));
    // Depois do POST o servidor passa a dizer que EU pedi nesta marcacao.
    estado.responder = async (path, method) => {
      if (method === "POST") return { data: { pedido: PEDIDO } };
      return path.startsWith("/creator/collabs")
        ? { data: { recebidos: [], enviados: [] } }
        : {
            data: {
              marcacoes: [
                {
                  ...DE_OUTRO,
                  meu_pedido: { id: PEDIDO.id, status: "pendente" },
                },
              ],
            },
          };
    };
    fireEvent.click(screen.getByTestId(`creator-collab-enviar-${DE_OUTRO.id}`));

    const chip = await screen.findByTestId(
      `creator-collab-status-${DE_OUTRO.id}`,
    );
    expect(chip.textContent).toBe("pedido enviado");
    expect(chip.className).toContain("ml-auto");
    expect(
      screen.queryByTestId(`creator-collab-pedir-${DE_OUTRO.id}`),
    ).toBeNull();
    // As duas buscas foram refeitas (2 da carga, 2 da revalidacao), e o
    // calendario nao passou pelo bloco de carregando: o dia continua aberto.
    expect(chamadasCom("GET")).toHaveLength(4);
    expect(screen.getByTestId("creator-dia-painel")).toBeTruthy();
  });

  it("pedido recusado: chip rose, e o botao NAO volta", async () => {
    responderCom([
      { ...DE_OUTRO, meu_pedido: { id: PEDIDO.id, status: "recusada" } },
    ]);
    render(<CreatorCalendario />);
    const chip = await screen.findByTestId(
      `creator-collab-status-${DE_OUTRO.id}`,
    );
    expect(chip.textContent).toBe("pedido recusado");
    expect(chip.className).toContain("rose");
    expect(
      screen.queryByTestId(`creator-collab-pedir-${DE_OUTRO.id}`),
    ).toBeNull();
  });

  it("backend anterior (sem meu_pedido): o botao continua, porque ausente nao e 'nao pedi'", async () => {
    responderCom([DE_OUTRO]);
    render(<CreatorCalendario />);
    await screen.findByTestId(`creator-marcacao-${DE_OUTRO.id}`);
    expect(
      screen.getByTestId(`creator-collab-pedir-${DE_OUTRO.id}`),
    ).toBeTruthy();
  });

  it("responder um pedido tambem recarrega o mes e os pedidos", async () => {
    responderCom([MINHA], [PEDIDO]);
    render(<CreatorCalendario />);
    await screen.findByTestId("creator-collabs-pendentes");
    expect(chamadasCom("GET")).toHaveLength(2);
    estado.responder = async (path, method) => {
      if (method === "POST")
        return { data: { pedido: { ...PEDIDO, status: "aceita" } } };
      return path.startsWith("/creator/collabs")
        ? { data: { recebidos: [], enviados: [] } }
        : { data: { marcacoes: [MINHA] } };
    };
    fireEvent.click(screen.getByTestId(`creator-collab-aceitar-${PEDIDO.id}`));
    await waitFor(() => expect(chamadasCom("GET")).toHaveLength(4));
    expect(screen.queryByTestId("creator-collabs-pendentes")).toBeNull();
  });
});

// COLLAB VISIVEL NO CALENDARIO (lote 10c): a aceita aparece na celula do dia
// e na marcacao, dita de tres jeitos conforme quem olha.
describe("CreatorCalendario: collab aceita visivel", () => {
  const PARCEIRO = { user_id: OUTRO_ID, name: "Outra Cria", avatar_url: null };

  it("dono: 'Collab aceita com X', o aperto de mao na celula do dia, e o Desmarcar continua", async () => {
    responderCom([{ ...MINHA, collabs: [PARCEIRO], minha_collab: false }]);
    render(<CreatorCalendario />);
    const linha = await screen.findByTestId(`creator-marcacao-${MINHA.id}`);
    expect(
      within(linha).getByTestId(`creator-collab-fechada-${MINHA.id}`)
        .textContent,
    ).toBe("Collab aceita com Outra Cria");
    expect(screen.getByTestId(`creator-dia-collab-${HOJE}`)).toBeTruthy();
    expect(
      within(linha).getByTestId(`creator-marcacao-remover-${MINHA.id}`),
    ).toBeTruthy();
  });

  it("parceiro: 'Sua collab com <dono>', sem botao e sem chip de pedido", async () => {
    responderCom([
      {
        ...DE_OUTRO,
        collabs: [{ user_id: MEU_ID, name: "Cria", avatar_url: null }],
        minha_collab: true,
        meu_pedido: { id: PEDIDO.id, status: "aceita" },
      },
    ]);
    render(<CreatorCalendario />);
    const linha = await screen.findByTestId(`creator-marcacao-${DE_OUTRO.id}`);
    expect(
      within(linha).getByTestId(`creator-collab-fechada-${DE_OUTRO.id}`)
        .textContent,
    ).toBe("Sua collab com Outra Cria");
    expect(
      screen.queryByTestId(`creator-collab-pedir-${DE_OUTRO.id}`),
    ).toBeNull();
    expect(
      screen.queryByTestId(`creator-collab-status-${DE_OUTRO.id}`),
    ).toBeNull();
  });

  it("terceiro: 'Collab com X', e o Pedir collab continua disponivel", async () => {
    const TERCEIRO = {
      ...DE_OUTRO,
      user_id: "44444444-4444-4444-4444-444444444444",
      autor: {
        user_id: "44444444-4444-4444-4444-444444444444",
        name: "Terceira",
        handle: "t",
      },
      collabs: [PARCEIRO],
      minha_collab: false,
      meu_pedido: null,
    };
    responderCom([TERCEIRO]);
    render(<CreatorCalendario />);
    const linha = await screen.findByTestId(`creator-marcacao-${TERCEIRO.id}`);
    expect(
      within(linha).getByTestId(`creator-collab-fechada-${TERCEIRO.id}`)
        .textContent,
    ).toBe("Collab com Outra Cria");
    expect(
      screen.getByTestId(`creator-collab-pedir-${TERCEIRO.id}`),
    ).toBeTruthy();
  });

  it("sem collab (ou backend anterior): nem chip nem aperto de mao", async () => {
    responderCom([DE_OUTRO]);
    render(<CreatorCalendario />);
    await screen.findByTestId(`creator-marcacao-${DE_OUTRO.id}`);
    expect(
      screen.queryByTestId(`creator-collab-fechada-${DE_OUTRO.id}`),
    ).toBeNull();
    expect(screen.queryByTestId(`creator-dia-collab-${HOJE}`)).toBeNull();
  });
});
