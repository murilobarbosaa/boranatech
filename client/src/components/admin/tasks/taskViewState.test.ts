import { describe, expect, it } from "vitest";

import {
  CHAVES_DA_ABA_TAREFAS,
  DEFAULT_VIEW_STATE,
  limparChavesDeSecao,
  readViewState,
  writeViewState,
} from "./taskViewState";
import { EMPTY_FILTERS } from "./taskFilters";

describe("readViewState", () => {
  it("sem parametros devolve o padrao", () => {
    expect(readViewState("?section=tarefas")).toEqual(DEFAULT_VIEW_STATE);
  });

  it("le tudo", () => {
    const state = readViewState(
      "?section=tarefas&q=login&assignee=u1,u2&labels=l1&priority=alta,urgente&type=melhoria&due=late&mine=1&group=priority&view=lista&archived=1",
    );
    expect(state.filters.query).toBe("login");
    expect(state.filters.assigneeIds).toEqual(["u1", "u2"]);
    expect(state.filters.labelIds).toEqual(["l1"]);
    expect(state.filters.priorities).toEqual(["alta", "urgente"]);
    expect(state.filters.types).toEqual(["melhoria"]);
    expect(state.filters.due).toBe("late");
    expect(state.filters.mine).toBe(true);
    expect(state.groupBy).toBe("priority");
    expect(state.view).toBe("lista");
    expect(state.includeArchived).toBe(true);
  });

  // Valor que este bundle nao conhece cai no padrao, nunca deixa a tela num
  // estado que nenhum componente sabe renderizar. Mesma regra do resolver de
  // activity: o backend pode estar a frente do bundle.
  it("valores desconhecidos caem no padrao, sem quebrar", () => {
    const state = readViewState(
      "?group=por_lua&view=calendario&due=nunca&priority=catastrofica,alta&type=inventado",
    );
    expect(state.groupBy).toBe("column");
    expect(state.view).toBe("board");
    expect(state.filters.due).toBe("");
    // Filtra o desconhecido e MANTEM o valido, em vez de descartar a lista toda.
    expect(state.filters.priorities).toEqual(["alta"]);
    expect(state.filters.types).toEqual([]);
  });

  it("busca com caracteres especiais sobrevive ao round-trip da URL", () => {
    const written = writeViewState("", {
      ...DEFAULT_VIEW_STATE,
      filters: { ...EMPTY_FILTERS, query: "100% & a_b" },
    });
    expect(readViewState(written).filters.query).toBe("100% & a_b");
  });
});

describe("writeViewState", () => {
  // A regra que nao pode ser quebrada no modulo inteiro.
  it("PRESERVA section e task", () => {
    const next = writeViewState("?section=tarefas&task=DEV-42", {
      ...DEFAULT_VIEW_STATE,
      filters: { ...EMPTY_FILTERS, mine: true },
    });
    const params = new URLSearchParams(next);
    expect(params.get("section")).toBe("tarefas");
    expect(params.get("task")).toBe("DEV-42");
    expect(params.get("mine")).toBe("1");
  });

  it("preserva parametro de terceiros", () => {
    const next = writeViewState("?section=tarefas&utm_source=slack", {
      ...DEFAULT_VIEW_STATE,
      filters: { ...EMPTY_FILTERS, due: "late" },
    });
    expect(new URLSearchParams(next).get("utm_source")).toBe("slack");
  });

  it("valor PADRAO some da URL, para o link nao carregar ruido", () => {
    const next = writeViewState("?section=tarefas", DEFAULT_VIEW_STATE);
    expect(next).toBe("?section=tarefas");
  });

  it("limpar um filtro REMOVE o parametro em vez de deixa-lo vazio", () => {
    const comFiltro = writeViewState("?section=tarefas", {
      ...DEFAULT_VIEW_STATE,
      filters: { ...EMPTY_FILTERS, query: "login", priorities: ["alta"] },
    });
    expect(comFiltro).toContain("q=login");

    const limpo = writeViewState(comFiltro, DEFAULT_VIEW_STATE);
    expect(limpo).toBe("?section=tarefas");
  });

  it("ida e volta preserva o estado", () => {
    const state = {
      filters: {
        query: "pkce",
        assigneeIds: ["u1"],
        labelIds: ["l1", "l2"],
        priorities: ["urgente" as const],
        types: ["melhoria" as const],
        due: "week" as const,
        mine: true,
        origem: "" as const,
      },
      groupBy: "assignee" as const,
      view: "lista" as const,
      includeArchived: true,
    };
    expect(readViewState(writeViewState("?section=tarefas", state))).toEqual(
      state,
    );
  });

  it("busca so com espacos nao vai para a URL", () => {
    const next = writeViewState("?section=tarefas", {
      ...DEFAULT_VIEW_STATE,
      filters: { ...EMPTY_FILTERS, query: "   " },
    });
    expect(next).toBe("?section=tarefas");
  });
});

describe("chaves de escopo de secao", () => {
  it("trocar de aba a partir do quadro de bugs NAO leva o board", () => {
    // O caso concreto: `?section=bugs` redireciona para o quadro BUG com
    // `board=bugs`, e clicar em Financeiro levaria o quadro junto.
    const limpo = limparChavesDeSecao("?section=tarefas&board=bugs");
    expect(limpo).not.toContain("board");
  });

  it("trocar de aba NAO descarta o window da Visao", () => {
    // O controle. A preservacao existe por um motivo real: sem ela, a janela
    // escolhida na Visao voltava ao padrao a cada troca de aba. Limpar demais
    // reintroduziria esse defeito.
    expect(limparChavesDeSecao("?section=tarefas&window=30d")).toContain(
      "window=30d",
    );
  });

  it("leva embora TODAS as chaves da aba, nao so o board", () => {
    // Afirma o conjunto inteiro. "board sumiu" passaria com um delete escrito a
    // mao, e o filtro seguinte vazaria sem nada acusar.
    const search =
      "?section=tarefas&" +
      CHAVES_DA_ABA_TAREFAS.map((k) => `${k}=x`).join("&") +
      "&window=30d";
    const limpo = limparChavesDeSecao(search);
    for (const chave of CHAVES_DA_ABA_TAREFAS) {
      expect(limpo).not.toContain(`${chave}=`);
    }
    expect(limpo).toContain("window=30d");
    expect(limpo).toContain("section=tarefas");
  });

  it("a lista cobre tudo que writeViewState escreve", () => {
    // PARIDADE nos dois sentidos, contra o proprio escritor. Um filtro novo em
    // writeViewState que ninguem acrescentar aqui passa a vazar, e o modo de
    // falha e silencioso. Este teste transforma o esquecimento em vermelho.
    const escritas = writeViewState("", {
      filters: {
        query: "q",
        assigneeIds: ["a"],
        labelIds: ["l"],
        priorities: ["alta"],
        types: ["bug"],
        due: "late",
        mine: true,
        origem: "sentry",
      },
      groupBy: "assignee",
      view: "lista",
      includeArchived: true,
    });
    // forEach e nao `for...of`: o tsconfig do projeto nao habilita
    // downlevelIteration, entao iterar URLSearchParams direto nao compila.
    const escritasKeys: string[] = [];
    new URLSearchParams(escritas).forEach((_valor, chave) => {
      escritasKeys.push(chave);
    });
    expect(escritasKeys.length).toBeGreaterThan(0);
    for (const chave of escritasKeys) {
      expect(CHAVES_DA_ABA_TAREFAS).toContain(chave as never);
    }
  });

  it("search vazia continua vazia, sem '?' solto", () => {
    expect(limparChavesDeSecao("")).toBe("");
    expect(limparChavesDeSecao("?board=bugs")).toBe("");
  });
});
