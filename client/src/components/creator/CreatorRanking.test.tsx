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
    // O modo admin (lote 11d) busca por aqui; registrado com o prefixo para o
    // teste distinguir as duas rotas.
    adminFetch: async (path: string) => {
      estado.chamadas.push({ path: `/admin${path}` });
      return estado.responder(`/admin${path}`);
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
    contagens: {
      publicacoes: pontos > 0 ? 1 : 0,
      vendas: 0,
      cliques: 0,
      cadastros: 0,
    },
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
          contagens: { publicacoes: 3, vendas: 1, cliques: 30, cadastros: 2 },
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
    // Detalhamento em PONTOS: conteudo (o resto: 155-25-16=114), vendas e
    // cadastros. Clique NAO aparece no ranking publico, nem o numero nem a palavra.
    expect(primeiro.textContent).toContain("Conteúdo 114");
    expect(primeiro.textContent).toContain("Vendas 25");
    expect(primeiro.textContent).toContain("Cadastros 16");
    expect(primeiro.textContent).not.toContain("clique");
    expect(primeiro.textContent).not.toContain("Clique");
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

  it("medalha no topo do cartao, metal por lugar, e nenhuma bolinha de cor (lote 11b)", async () => {
    responderCom(
      ranking([
        posicao(1, "a", 30, { calendar_color: "rose" }),
        posicao(2, "b", 20, { calendar_color: "cyan" }),
        posicao(3, "c", 10),
        posicao(4, "d", 5, { calendar_color: "emerald" }),
      ]),
    );
    montar();
    const podio = await screen.findByTestId("creator-ranking-podio");
    // Metal por TOKEN fixo (lote 11c): medalha, chip, anel e marca d'agua na
    // mesma cor nos dois temas; a tinta sobre o metal e a escura fixa.
    const metais: Array<[1 | 2 | 3, string, string, string, string]> = [
      [1, "Ouro", "bg-amber-100", "bg-[var(--metal-ouro)]", "pt-10"],
      [2, "Prata", "bg-slate-200", "bg-[var(--metal-prata)]", "pt-8"],
      [3, "Bronze", "bg-orange-100", "bg-[var(--metal-bronze)]", "pt-8"],
    ];
    for (const [lugar, rotulo, fundo, corDaMedalha, topo] of metais) {
      const cartao = within(podio).getByTestId(
        `creator-ranking-podio-${lugar}`,
      );
      const classes = cartao.getAttribute("class") ?? "";
      expect(classes, `fundo do ${lugar}`).toContain(fundo);
      expect(classes).toContain("relative");
      expect(classes).toContain("overflow-visible");
      // O espaco de cima acompanha o tamanho da medalha.
      expect(classes, `topo do ${lugar}`).toContain(topo);
      // Chip: fundo do metal, tinta fixa, borda preta.
      const chip = within(cartao).getByTestId(`creator-ranking-metal-${lugar}`);
      const cc = chip.getAttribute("class") ?? "";
      expect(cc).toContain(corDaMedalha);
      expect(cc).toContain("text-[var(--avatar-ink-amarelo)]");
      expect(cc).toContain("border-slate-900");
      expect(cc).not.toContain("bnt-accent-solid");
      // Marca d'agua na cor do metal, a 25%.
      const marca = within(cartao).getByTestId(
        `creator-ranking-marca-${lugar}`,
      );
      const cmk = marca.getAttribute("class") ?? "";
      expect(cmk).toContain(corDaMedalha.replace("bg-", "text-"));
      expect(cmk).toContain("opacity-25");
      // A medalha e o PRIMEIRO filho, montada na borda de cima e centralizada.
      const medalha = cartao.firstElementChild as HTMLElement;
      expect(medalha.getAttribute("data-testid")).toBe(
        `creator-ranking-medalha-${lugar}`,
      );
      expect(medalha.textContent).toBe(String(lugar));
      const cm = medalha.getAttribute("class") ?? "";
      for (const c of [
        "absolute",
        "-top-4",
        "left-1/2",
        "-translate-x-1/2",
        corDaMedalha,
        "text-[var(--avatar-ink-amarelo)]",
      ]) {
        expect(cm, c).toContain(c);
      }
      expect(
        within(cartao).getByTestId(`creator-ranking-metal-${lugar}`)
          .textContent,
      ).toBe(rotulo);
    }
    // Sem anel de metal em volta do avatar (lote 11d): a borda e a da pessoa.
    expect(podio.innerHTML).not.toContain("ring-[var(--metal-");
    expect(podio.innerHTML).not.toContain("ring-offset-slate-900");
    expect(screen.getByTestId("creator-ranking-lista").innerHTML).not.toContain(
      "ring-2 ring-slate-900",
    );
    // A do primeiro e um pouco maior.
    expect(
      screen.getByTestId("creator-ranking-medalha-1").getAttribute("class"),
    ).toContain("h-12");
    expect(
      screen.getByTestId("creator-ranking-medalha-2").getAttribute("class"),
    ).toContain("h-10");
    // Sem `dark:` e sem hex no podio.
    expect(podio.innerHTML).not.toContain("dark:");
    expect(podio.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    // Nenhuma bolinha de cor, nem no podio nem na lista: a foto identifica.
    expect(podio.querySelector("[data-cor]")).toBeNull();
    expect(
      screen.getByTestId("creator-ranking-lista").querySelector("[data-cor]"),
    ).toBeNull();
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

describe("CreatorRanking: quem saiu do programa (lote 11j)", () => {
  it("num mes fechado, a marca aparece no podio e na lista para quem saiu, e so para eles", async () => {
    responderCom(
      ranking(
        [
          posicao(1, "a", 500, { saiu_do_programa: true }),
          posicao(2, "b", 100, { saiu_do_programa: false }),
          posicao(3, "c", 25),
          posicao(4, "d", 5, { saiu_do_programa: true }),
          posicao(5, "e", 1),
        ],
        { mes: "2026-08", fechado: true, fecha_em: null },
      ),
    );
    montar("/creator?aba=ranking&mes=2026-08");
    const podio = await screen.findByTestId("creator-ranking-podio");
    expect(
      within(podio).getByTestId("creator-ranking-saiu-podio-1").textContent,
    ).toBe("saiu do programa");
    expect(
      within(podio).queryByTestId("creator-ranking-saiu-podio-2"),
    ).toBeNull();
    expect(
      within(podio).queryByTestId("creator-ranking-saiu-podio-3"),
    ).toBeNull();
    const lista = screen.getByTestId("creator-ranking-lista");
    expect(
      within(lista).getByTestId("creator-ranking-saiu-d").textContent,
    ).toBe("saiu do programa");
    expect(within(lista).queryByTestId("creator-ranking-saiu-e")).toBeNull();
    // Continua na ordem do servidor: sair do programa nao mexe na posicao.
    expect(
      within(lista)
        .getAllByTestId(/creator-ranking-linha-/)
        .map((el) => el.getAttribute("data-testid")),
    ).toEqual(["creator-ranking-linha-d", "creator-ranking-linha-e"]);
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
      "Só publicação confirmada vale",
    );
    // Clique nao e mencionado na regra publica.
    expect(
      screen.getByTestId("creator-ranking-regra").textContent,
    ).not.toContain("clique");
  });

  it("carregando mostra o esqueleto dentro do cartao, e erro oferece tentar de novo", async () => {
    let resolver: (v: unknown) => void = () => {};
    estado.responder = () => new Promise((r) => (resolver = r));
    montar();
    const esqueleto = screen.getByTestId("creator-ranking-carregando");
    expect(esqueleto.getAttribute("aria-busy")).toBe("true");
    // Podio de tres e cinco linhas (lote 11c).
    expect(esqueleto.querySelectorAll("li")).toHaveLength(3);
    expect(esqueleto.querySelectorAll(".h-14")).toHaveLength(5);
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

describe("CreatorRanking: modo admin (lote 11d)", () => {
  function montarAdmin() {
    const { hook, searchHook, history } = memoryLocation({
      path: "/admin?section=creators",
      record: true,
    });
    render(
      <Router hook={hook} searchHook={searchHook}>
        <CreatorRanking modo="admin" agora={AGORA} />
      </Router>,
    );
    return history;
  }

  it("busca pela rota do admin e nao desenha nada pessoal, nem o Como pontuar, nem a casca do cartao", async () => {
    responderCom(
      ranking([
        posicao(1, "a", 50, { eu: true }),
        posicao(2, "b", 40),
        posicao(3, "c", 30),
        posicao(4, "d", 5),
      ]),
    );
    montarAdmin();
    const raiz = await screen.findByTestId("creator-ranking");
    expect(estado.chamadas.map((c) => c.path)).toEqual([
      "/admin/creators/ranking?mes=2026-09",
    ]);
    expect(raiz.getAttribute("data-modo")).toBe("admin");
    expect(raiz.getAttribute("class") ?? "").not.toContain("card-brutal");
    await screen.findByTestId("creator-ranking-podio");
    // Mesmo com `eu`/`minha_posicao` na resposta (defesa em profundidade),
    // nada pessoal aparece.
    expect(screen.queryByTestId("creator-ranking-minha-posicao")).toBeNull();
    expect(screen.queryByTestId(/creator-ranking-voce/)).toBeNull();
    expect(screen.queryByTestId("creator-ranking-regra")).toBeNull();
    // O podio e a lista continuam.
    expect(screen.getByTestId("creator-ranking-podio-1").textContent).toContain(
      "@ha",
    );
    expect(screen.getByTestId("creator-ranking-linha-d")).toBeTruthy();
  });

  it("o seletor de mes chama a rota do admin com o mes novo e NAO escreve na URL", async () => {
    responderCom((path) => ranking([], { mes: path.slice(-7) }));
    const history = montarAdmin();
    await screen.findByTestId("creator-ranking-podio");
    fireEvent.click(screen.getByTestId("creator-ranking-anterior"));
    await waitFor(() =>
      expect(estado.chamadas.map((c) => c.path)).toContain(
        "/admin/creators/ranking?mes=2026-08",
      ),
    );
    expect(screen.getByTestId("creator-ranking-mes").textContent).toBe(
      "agosto de 2026",
    );
    expect(history).toEqual(["/admin?section=creators"]);
  });

  it("no admin, 404 e erro comum, nao o cartao 'em breve'", async () => {
    estado.responder = async () => {
      throw new AdminApiError("Not found", 404, null);
    };
    montarAdmin();
    expect(await screen.findByTestId("creator-ranking-erro")).toBeTruthy();
    expect(screen.queryByTestId("creator-ranking-em-breve")).toBeNull();
  });
});
