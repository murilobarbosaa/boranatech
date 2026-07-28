import { describe, expect, it } from "vitest";

import {
  EMPTY_FILTERS,
  activeFilterCount,
  buildGroups,
  groupValueOf,
  hasActiveFilters,
  isGroupContainer,
  matchesFilters,
  matchesQuery,
  type TaskFilters,
} from "./taskFilters";
import type { TaskCard, TaskColumn } from "./types";

/** 2026-07-28 12:00 em Brasilia. */
const NOW = Date.parse("2026-07-28T15:00:00.000Z");
const CTX = { nowMs: NOW, currentUserId: "user-1" };

function task(overrides: Partial<TaskCard> = {}): TaskCard {
  return {
    id: "t1",
    board_id: "b1",
    column_id: "col-a",
    number: 1,
    title: "tarefa",
    description: null,
    notes: null,
    position: 1000,
    priority: "media",
    type: "tarefa",
    assignee_id: null,
    created_by: "user-2",
    updated_by: null,
    due_date: null,
    estimate: null,
    completed_at: null,
    archived_at: null,
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    label_ids: [],
    checklist_total: 0,
    checklist_done: 0,
    comment_count: 0,
    ...overrides,
  };
}

function withFilters(patch: Partial<TaskFilters>): TaskFilters {
  return { ...EMPTY_FILTERS, ...patch };
}

describe("matchesQuery", () => {
  it("casa titulo e descricao, sem diferenciar caixa", () => {
    const t = task({ title: "Corrigir Login", description: "o Fluxo PKCE" });
    expect(matchesQuery(t, "login")).toBe(true);
    expect(matchesQuery(t, "pkce")).toBe(true);
    expect(matchesQuery(t, "cadastro")).toBe(false);
  });

  it("busca vazia casa tudo", () => {
    expect(matchesQuery(task(), "")).toBe(true);
    expect(matchesQuery(task(), "   ")).toBe(true);
  });

  // O caso do `50% pronto`, na outra ponta do modulo. Num ilike sem escape,
  // "100%" casaria "100" seguido de qualquer coisa.
  it("`%` e literal, NAO curinga", () => {
    const cem = task({ title: "entregar 100% do escopo" });
    const cemZero = task({ title: "entregar 100 coisas" });
    expect(matchesQuery(cem, "100%")).toBe(true);
    expect(matchesQuery(cemZero, "100%")).toBe(false);
  });

  it("`_` e literal, NAO casa caractere qualquer", () => {
    const comUnderscore = task({ title: "renomear a_b" });
    const semUnderscore = task({ title: "renomear axb" });
    expect(matchesQuery(comUnderscore, "a_b")).toBe(true);
    expect(matchesQuery(semUnderscore, "a_b")).toBe(false);
  });

  it("barra invertida e literal", () => {
    expect(matchesQuery(task({ title: "caminho c:\\temp" }), "c:\\temp")).toBe(true);
    expect(matchesQuery(task({ title: "caminho c:temp" }), "c:\\temp")).toBe(false);
  });
});

describe("matchesFilters", () => {
  it("responsavel", () => {
    const f = withFilters({ assigneeIds: ["user-9"] });
    expect(matchesFilters(task({ assignee_id: "user-9" }), f, CTX)).toBe(true);
    expect(matchesFilters(task({ assignee_id: "user-8" }), f, CTX)).toBe(false);
    expect(matchesFilters(task({ assignee_id: null }), f, CTX)).toBe(false);
  });

  it("etiquetas combinam em OU", () => {
    const f = withFilters({ labelIds: ["l1", "l2"] });
    expect(matchesFilters(task({ label_ids: ["l2"] }), f, CTX)).toBe(true);
    expect(matchesFilters(task({ label_ids: ["l3"] }), f, CTX)).toBe(false);
  });

  it("prioridade e tipo", () => {
    expect(
      matchesFilters(task({ priority: "alta" }), withFilters({ priorities: ["alta"] }), CTX),
    ).toBe(true);
    expect(
      matchesFilters(task({ type: "melhoria" }), withFilters({ types: ["feature"] }), CTX),
    ).toBe(false);
  });

  it("atrasadas: so o que venceu ANTES de hoje", () => {
    const f = withFilters({ due: "late" });
    expect(matchesFilters(task({ due_date: "2026-07-27" }), f, CTX)).toBe(true);
    // Vence hoje NAO esta atrasada.
    expect(matchesFilters(task({ due_date: "2026-07-28" }), f, CTX)).toBe(false);
    expect(matchesFilters(task({ due_date: "2026-08-01" }), f, CTX)).toBe(false);
    // Sem data nao entra em filtro de data.
    expect(matchesFilters(task({ due_date: null }), f, CTX)).toBe(false);
  });

  it("esta semana: de hoje ate seis dias a frente, sem incluir atrasadas", () => {
    const f = withFilters({ due: "week" });
    expect(matchesFilters(task({ due_date: "2026-07-28" }), f, CTX)).toBe(true);
    expect(matchesFilters(task({ due_date: "2026-08-03" }), f, CTX)).toBe(true);
    expect(matchesFilters(task({ due_date: "2026-08-04" }), f, CTX)).toBe(false);
    expect(matchesFilters(task({ due_date: "2026-07-27" }), f, CTX)).toBe(false);
  });

  it("criadas por mim", () => {
    const f = withFilters({ mine: true });
    expect(matchesFilters(task({ created_by: "user-1" }), f, CTX)).toBe(true);
    expect(matchesFilters(task({ created_by: "user-2" }), f, CTX)).toBe(false);
  });

  it("filtros combinam em E entre si", () => {
    const f = withFilters({ priorities: ["alta"], types: ["melhoria"] });
    expect(matchesFilters(task({ priority: "alta", type: "melhoria" }), f, CTX)).toBe(true);
    expect(matchesFilters(task({ priority: "alta", type: "feature" }), f, CTX)).toBe(false);
  });

  it("sem filtro nenhum, tudo passa", () => {
    expect(matchesFilters(task(), EMPTY_FILTERS, CTX)).toBe(true);
  });
});

describe("activeFilterCount", () => {
  it("conta cada dimensao uma vez, e a busca tambem conta", () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(activeFilterCount(withFilters({ query: "x" }))).toBe(1);
    // Duas prioridades sao UM filtro, nao dois.
    expect(activeFilterCount(withFilters({ priorities: ["alta", "baixa"] }))).toBe(1);
    expect(
      activeFilterCount(withFilters({ query: "x", mine: true, due: "late" })),
    ).toBe(3);
  });

  it("busca so com espacos nao conta como filtro", () => {
    expect(activeFilterCount(withFilters({ query: "   " }))).toBe(0);
  });
});

describe("buildGroups", () => {
  const columns: TaskColumn[] = [
    {
      id: "col-a",
      board_id: "b1",
      name: "Backlog",
      color: "#94A3B8",
      position: 1000,
      wip_limit: null,
      is_start: true,
      is_done: false,
      created_at: "",
      updated_at: "",
    },
    {
      id: "col-b",
      board_id: "b1",
      name: "Feito",
      color: "#34D399",
      position: 2000,
      wip_limit: null,
      is_start: false,
      is_done: true,
      created_at: "",
      updated_at: "",
    },
  ];
  const admins = [
    { user_id: "user-1", name: "Ana", email: null, avatar_url: null },
  ];

  const all = [
    task({ id: "t1", column_id: "col-a", priority: "alta", assignee_id: "user-1", position: 2000 }),
    task({ id: "t2", column_id: "col-a", priority: "baixa", assignee_id: null, position: 1000 }),
    task({ id: "t3", column_id: "col-b", priority: "alta", assignee_id: "user-1", position: 1000 }),
  ];

  it("por etapa, ordenado por posicao", () => {
    const groups = buildGroups(all, all, "column", columns, admins);
    expect(groups.map((g) => g.label)).toEqual(["Backlog", "Feito"]);
    expect(groups[0].tasks.map((t) => t.id)).toEqual(["t2", "t1"]);
  });

  it("por prioridade, na ordem de urgencia e nao alfabetica", () => {
    const groups = buildGroups(all, all, "priority", columns, admins);
    expect(groups.map((g) => g.value)).toEqual(["urgente", "alta", "media", "baixa"]);
    expect(groups[1].tasks.map((t) => t.id)).toEqual(["t3", "t1"]);
  });

  it("por responsavel, com “Sem responsável” por ultimo", () => {
    const groups = buildGroups(all, all, "assignee", columns, admins);
    expect(groups.map((g) => g.label)).toEqual(["Ana", "Sem responsável"]);
    expect(groups[1].tasks.map((t) => t.id)).toEqual(["t2"]);
  });

  // Sem isto, uma coluna filtrada e indistinguivel de uma coluna que so tem 1.
  it("guarda o total ANTES do filtro, para o contador “1 de 2”", () => {
    const visiveis = [all[0]];
    const groups = buildGroups(visiveis, all, "column", columns, admins);
    expect(groups[0].tasks).toHaveLength(1);
    expect(groups[0].totalBeforeFilter).toBe(2);
  });

  it("grupo vazio continua existindo, porque tambem e alvo de arrasto", () => {
    const groups = buildGroups([], all, "priority", columns, admins);
    expect(groups).toHaveLength(4);
    expect(groups.every((g) => g.tasks.length === 0)).toBe(true);
  });
});

describe("ids de grupo", () => {
  it("separa container de grupo de id de coluna", () => {
    expect(isGroupContainer("group:alta")).toBe(true);
    expect(isGroupContainer("col-a")).toBe(false);
  });

  it("extrai o valor, com `none` virando null", () => {
    expect(groupValueOf("group:alta")).toBe("alta");
    expect(groupValueOf("group:none")).toBeNull();
    expect(groupValueOf("col-a")).toBeNull();
  });
});
