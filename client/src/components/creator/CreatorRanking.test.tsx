import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

/**
 * CreatorRanking: a aba Ranking (lote 11).
 *
 * O mes e o relogio sao CONTROLADOS: o componente recebe `agora` e o teste
 * fixa 2026-09-20, entao os literais de mes abaixo nao apodrecem. O que se
 * afirma: o podio com tres, um e zero pontuados; o viewer dentro e fora do
 * podio; a ordem da lista e o "ver mais"; o seletor de mes escrevendo a URL;
 * a tabela de pontos igual a constante; e a janela de deploy (404 vira o
 * cartao "em breve").
 */

type Chamada = { path: string };

const estado = vi.hoisted(() => ({
  chamadas: [] as Chamada[],
  responder: (async () => ({})) as (path: string) => Promise<unknown>,
}));

vi.mock("@/lib/adminApi", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/adminApi")>();
  return {
    ...real,
    contentFetch: async (path: string) => {
      estado.chamadas.push({ path });
      return estado.responder(path);
    },
  };
});

import { AdminApiError } from "@/lib/adminApi";
import {
  tabelaDePontos,
  type PosicaoDoRanking,
  type RankingDoMes,
} from "@shared/creatorRanking";
import { CreatorRanking } from "./CreatorRanking";

// 2026-09-20 12:00 em Brasilia.
const AGORA = () => new Date("2026-09-20T15:00:00Z");
const FECHA_EM = "2026-10-01T03:00:00.000Z";

function posicao(
  posicao: number,
  user_id: string,
  pontos: number,
  extra: Partial<PosicaoDoRanking> = {},
): PosicaoDoRanking {
  return {
    posicao,
    user_id,
    name: `Nome ${user_id}`,
    handle: `h${user_id}`,
    rede_do_handle: "instagram",
    avatar_url: null,
    calendar_color: "violet",
    pontos,
    contagens: { publicacoes: pontos > 0 ? 1 : 0, vendas: 0, cliques: 0 },
    eu: false,
    ...extra,
  };
}

function ranking(
  posicoes: PosicaoDoRanking[],
  extra: Partial<RankingDoMes> = {},
): RankingDoMes {
  return {
    mes: "2026-09",
    fechado: false,
    fecha_em: FECHA_EM,
    posicoes,
    minha_posicao: posicoes.find((p) => p.eu) ?? null,
    ...extra,
  };
}

function responderCom(r: RankingDoMes | ((path: string) => RankingDoMes)) {
  estado.responder = async (path) => ({
    data: typeof r === "function" ? r(path) : r,
  });
}

function montar(path = "/creator?aba=ranking") {
  const { hook, searchHook, history } = memoryLocation({ path, record: true });
  render(
    <Router hook={hook} searchHook={searchHook}>
      <CreatorRanking agora={AGORA} />
    </Router>,
  );
  return history;
}

beforeEach(() => {
  estado.chamadas = [];
  estado.responder = async () => ({});
});

afterEach(() => {
  cleanup();
});

describe("CreatorRanking: busca e mes", () => {
  it("busca o mes atual sem ?mes, e um mes valido da URL quando ha", async () => {
    responderCom(ranking([]));
    montar();
    await screen.findByTestId("creator-ranking-podio");
    expect(estado.chamadas.map((c) => c.path)).toEqual([
      "/creator/ranking?mes=2026-09",
    ]);

    cleanup();
    estado.chamadas = [];
    responderCom(
      ranking([], { mes: "2026-08", fechado: true, fecha_em: null }),
    );
    montar("/creator?aba=ranking&mes=2026-08");
    await screen.findByTestId("creator-ranking-podio");
    expect(estado.chamadas.map((c) => c.path)).toEqual([
      "/creator/ranking?mes=2026-08",
    ]);
    expect(screen.getByTestId("creator-ranking-mes").textContent).toBe(
      "agosto de 2026",
    );
    expect(screen.getByTestId("creator-ranking-fechado")).toBeTruthy();
    expect(screen.queryByTestId("creator-ranking-fecha-em")).toBeNull();
  });

  it("mes futuro, anterior ao programa ou mal escrito na URL cai no mes atual", async () => {
    responderCom(ranking([]));
    for (const mes of ["2026-10", "2026-06", "setembro"]) {
      cleanup();
      estado.chamadas = [];
      montar(`/creator?aba=ranking&mes=${mes}`);
      await screen.findByTestId("creator-ranking-podio");
      expect(estado.chamadas[0].path, mes).toBe("/creator/ranking?mes=2026-09");
    }
  });

  it("o seletor escreve ?aba=ranking&mes= na URL, e para nas duas pontas", async () => {
    responderCom((path) => {
      const mes = path.slice(-7);
      return ranking([], { mes });
    });
    const history = montar("/creator?aba=ranking&mes=2026-08");
    await screen.findByTestId("creator-ranking-podio");

    fireEvent.click(screen.getByTestId("creator-ranking-anterior"));
    expect(history[history.length - 1]).toBe(
      "/creator?aba=ranking&mes=2026-07",
    );
    await waitFor(() =>
      expect(screen.getByTestId("creator-ranking-mes").textContent).toBe(
        "julho de 2026",
      ),
    );
    // Julho e o primeiro mes do programa: nao ha anterior.
    expect(
      (screen.getByTestId("creator-ranking-anterior") as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    fireEvent.click(screen.getByTestId("creator-ranking-proximo"));
    fireEvent.click(screen.getByTestId("creator-ranking-proximo"));
    expect(history[history.length - 1]).toBe(
      "/creator?aba=ranking&mes=2026-09",
    );
    await waitFor(() =>
      expect(screen.getByTestId("creator-ranking-mes").textContent).toBe(
        "setembro de 2026",
      ),
    );
    // Setembro e o mes atual: nao ha seguinte.
    expect(
      (screen.getByTestId("creator-ranking-proximo") as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    // Titulo com o mes por extenso.
    expect(screen.getByText("Ranking de setembro")).toBeTruthy();
  });

  it("mes corrente diz quantos dias faltam para fechar", async () => {
    responderCom(ranking([]));
    montar();
    // 2026-09-20 12:00 ate 2026-10-01 00:00 de Brasilia: 11 dias.
    expect(
      (await screen.findByTestId("creator-ranking-fecha-em")).textContent,
    ).toBe("Fecha em 11 dias");
  });
});

describe("CreatorRanking: podio", () => {
  it("tres pontuados: o primeiro no centro, medalha, pontos e as contagens", async () => {
    responderCom(
      ranking([
        posicao(1, "a", 155, {
          contagens: { publicacoes: 3, vendas: 1, cliques: 30 },
          calendar_color: "rose",
        }),
        posicao(2, "b", 100),
        posicao(3, "c", 25, { handle: null, rede_do_handle: null }),
        posicao(4, "d", 5),
      ]),
    );
    montar();
    const podio = await screen.findByTestId("creator-ranking-podio");
    const primeiro = within(podio).getByTestId("creator-ranking-podio-1");
    expect(primeiro.getAttribute("class") ?? "").toContain("md:order-2");
    expect(
      within(primeiro).getByTestId("creator-ranking-pontos-podio-1")
        .textContent,
    ).toBe("155");
    expect(primeiro.textContent).toContain("@ha");
    expect(primeiro.textContent).toContain(
      "3 publicações, 1 venda, 30 cliques",
    );
    expect(
      within(podio)
        .getByTestId("creator-ranking-podio-2")
        .getAttribute("class") ?? "",
    ).toContain("md:order-1");
    // Sem @: o nome.
    expect(
      within(podio).getByTestId("creator-ranking-podio-3").textContent,
    ).toContain("Nome c");
    // Os tres do podio NAO repetem na lista; o quarto abre a lista.
    const lista = screen.getByTestId("creator-ranking-lista");
    expect(within(lista).queryByTestId("creator-ranking-linha-a")).toBeNull();
    expect(within(lista).getByTestId("creator-ranking-linha-d")).toBeTruthy();
  });

  it("um pontuado: os outros dois lugares ficam vazios, com 'ainda ninguém'", async () => {
    responderCom(ranking([posicao(1, "a", 10), posicao(2, "b", 0)]));
    montar();
    const podio = await screen.findByTestId("creator-ranking-podio");
    expect(
      within(podio).getByTestId("creator-ranking-podio-1").textContent,
    ).toContain("@ha");
    expect(
      within(podio).getByTestId("creator-ranking-podio-2").textContent,
    ).toContain("ainda ninguém");
    expect(
      within(podio).getByTestId("creator-ranking-podio-3").textContent,
    ).toContain("ainda ninguém");
    // Zero ponto nao sobe no podio: vai para a lista, dizendo isso.
    const linha = screen.getByTestId("creator-ranking-linha-b");
    expect(linha.textContent).toContain("sem pontos ainda");
  });

  it("ninguem pontuou: tres lugares vazios e a lista inteira zerada", async () => {
    responderCom(ranking([posicao(1, "a", 0), posicao(2, "b", 0)]));
    montar();
    const podio = await screen.findByTestId("creator-ranking-podio");
    expect(within(podio).getAllByText("ainda ninguém")).toHaveLength(3);
    expect(screen.getAllByText("sem pontos ainda")).toHaveLength(2);
  });
});

describe("CreatorRanking: quem olha", () => {
  it("no podio: chip Você no cartao e a linha 'Você está em' antes do podio", async () => {
    responderCom(
      ranking([
        posicao(1, "a", 50),
        posicao(2, "me", 40, { eu: true }),
        posicao(3, "c", 1),
      ]),
    );
    montar();
    const minha = await screen.findByTestId("creator-ranking-minha-posicao");
    expect(minha.textContent).toBe("Você está em 2º de 3, com 40 pontos");
    expect(screen.getByTestId("creator-ranking-voce-podio-2")).toBeTruthy();
    const podio = screen.getByTestId("creator-ranking-podio");
    expect(
      minha.compareDocumentPosition(podio) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("fora do podio: a linha dele com o chip Você e a borda de acento", async () => {
    responderCom(
      ranking([
        posicao(1, "a", 50),
        posicao(2, "b", 40),
        posicao(3, "c", 30),
        posicao(4, "me", 1, { eu: true }),
      ]),
    );
    montar();
    expect(
      (await screen.findByTestId("creator-ranking-minha-posicao")).textContent,
    ).toBe("Você está em 4º de 4, com 1 ponto");
    const linha = screen.getByTestId("creator-ranking-linha-me");
    expect(within(linha).getByTestId("creator-ranking-voce-me")).toBeTruthy();
    expect(linha.getAttribute("class") ?? "").toContain(
      "border-[var(--bnt-accent-solid)]",
    );
    expect(screen.queryByTestId(/creator-ranking-voce-podio/)).toBeNull();
  });

  it("quem nao e da lista (minha_posicao null) nao ve a linha", async () => {
    responderCom(ranking([posicao(1, "a", 50)]));
    montar();
    await screen.findByTestId("creator-ranking-podio");
    expect(screen.queryByTestId("creator-ranking-minha-posicao")).toBeNull();
  });
});

describe("CreatorRanking: lista", () => {
  it("segue a ordem do servidor, 20 por vez, com 'Ver mais'", async () => {
    const posicoes = Array.from({ length: 30 }, (_, i) =>
      posicao(i + 1, `u${i + 1}`, 30 - i),
    );
    responderCom(ranking(posicoes));
    montar();
    const lista = await screen.findByTestId("creator-ranking-lista");
    // 27 fora do podio; 20 na primeira pagina.
    const ids = () =>
      within(lista)
        .getAllByTestId(/creator-ranking-linha-/)
        .map((el) =>
          el.getAttribute("data-testid")!.replace("creator-ranking-linha-", ""),
        );
    expect(ids()).toHaveLength(20);
    expect(ids()[0]).toBe("u4");
    expect(ids()[19]).toBe("u23");
    const verMais = screen.getByTestId("creator-ranking-ver-mais");
    expect(verMais.textContent).toBe("Ver mais (7)");
    fireEvent.click(verMais);
    expect(ids()).toHaveLength(27);
    expect(ids()[26]).toBe("u30");
    expect(screen.queryByTestId("creator-ranking-ver-mais")).toBeNull();
  });
});

describe("CreatorRanking: regra, estados e janela de deploy", () => {
  it("a tabela 'Como pontuar' e a constante compartilhada, linha por linha", async () => {
    responderCom(ranking([]));
    montar();
    await screen.findByTestId("creator-ranking-regra");
    for (const linha of tabelaDePontos()) {
      const el = screen.getByTestId(`creator-ranking-regra-${linha.chave}`);
      expect(el.textContent).toContain(linha.acao);
      expect(el.textContent).toContain(`${linha.pontos} pt`);
    }
    expect(screen.getByTestId("creator-ranking-regra").textContent).toContain(
      "Cliques contam até 30 por dia",
    );
  });

  it("carregando mostra o esqueleto dentro do cartao, e erro oferece tentar de novo", async () => {
    let resolver: (v: unknown) => void = () => {};
    estado.responder = () => new Promise((r) => (resolver = r));
    montar();
    expect(screen.getByTestId("creator-ranking-carregando")).toBeTruthy();
    expect(screen.getByTestId("creator-ranking")).toBeTruthy();
    resolver({ data: null });
    expect(await screen.findByTestId("creator-ranking-erro")).toBeTruthy();

    responderCom(ranking([posicao(1, "a", 1)]));
    fireEvent.click(screen.getByText("Tentar de novo"));
    expect(await screen.findByTestId("creator-ranking-podio")).toBeTruthy();
  });

  it("404 (backend anterior, sem a rota) mostra o cartao 'em breve' de sempre", async () => {
    estado.responder = async () => {
      throw new AdminApiError("Not found", 404, null);
    };
    montar();
    expect(await screen.findByTestId("creator-ranking-em-breve")).toBeTruthy();
    expect(screen.getByText("em breve")).toBeTruthy();
    expect(screen.queryByTestId("creator-ranking-erro")).toBeNull();
  });
});
