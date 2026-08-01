import { describe, expect, it } from "vitest";

import { resolveBoardDrop, type DropContext } from "./resolveBoardDrop";
import type { BoardOrder } from "./resolveDropTarget";
import type { TaskGroup } from "./taskFilters";
import type { TaskCard } from "./types";

// O cuidado central da Fase 6: com filtro ligado, a lista visivel NAO e a
// ordenacao real, e calcular ponto medio entre dois vizinhos visiveis coloca o
// card em posicao arbitraria em relacao aos ocultos. A tela fica plausivel e o
// banco fica errado.

function card(id: string, overrides: Partial<TaskCard> = {}): TaskCard {
  return {
    id,
    board_id: "b1",
    column_id: "col-a",
    number: 1,
    title: id,
    description: null,
    notes: null,
    position: 1000,
    priority: "media",
    type: "tarefa",
    assignee_id: null,
    created_by: "u1",
    updated_by: null,
    due_date: null,
    estimate: null,
    completed_at: null,
    archived_at: null,
    source: "human" as const,
    sentry_issue_id: null,
    sentry_issue_url: null,
    sentry_reopen_event_at: null,
    archived_source: null,
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    sentry_detalhe_incompleto: false,
    label_ids: [],
    checklist_total: 0,
    checklist_done: 0,
    comment_count: 0,
    ...overrides,
  };
}

/** Ordem REAL, com o card oculto `a2` entre os dois visiveis. */
const ORDER: BoardOrder = {
  columns: [
    { id: "col-a", taskIds: ["a1", "a2", "a3"] },
    { id: "col-b", taskIds: ["b1"] },
  ],
};

function columnGroups(visible: string[][]): TaskGroup[] {
  return [
    {
      id: "col-a",
      value: "col-a",
      label: "A",
      color: null,
      tasks: visible[0].map((id) => card(id)),
      totalBeforeFilter: 3,
    },
    {
      id: "col-b",
      value: "col-b",
      label: "B",
      color: null,
      tasks: visible[1].map((id) => card(id, { column_id: "col-b" })),
      totalBeforeFilter: 1,
    },
  ];
}

function context(overrides: Partial<DropContext> = {}): DropContext {
  return {
    order: ORDER,
    groups: columnGroups([["a1", "a2", "a3"], ["b1"]]),
    groupBy: "column",
    filtersActive: false,
    pinnedColumnIds: [],
    task: { id: "a1", column_id: "col-a", priority: "media", assignee_id: null },
    ...overrides,
  };
}

describe("resolveBoardDrop: por etapa, SEM filtro", () => {
  it("reordena dentro da coluna, com vizinhos", () => {
    const action = resolveBoardDrop(context(), "a3");
    expect(action).toEqual({
      kind: "move",
      columnId: "col-a",
      beforeTaskId: "a3",
      afterTaskId: null,
    });
  });

  it("move entre colunas", () => {
    const action = resolveBoardDrop(context(), "b1");
    expect(action.kind).toBe("move");
    if (action.kind === "move") expect(action.columnId).toBe("col-b");
  });

  it("soltar onde ja estava nao faz nada", () => {
    expect(resolveBoardDrop(context(), "a1")).toEqual({ kind: "none" });
    expect(resolveBoardDrop(context(), null)).toEqual({ kind: "none" });
  });
});

// O bloco que justifica o arquivo.
describe("resolveBoardDrop: por etapa, COM filtro", () => {
  // Cenario: o filtro esconde `a2`, que na ordenacao real esta ENTRE a1 e a3.
  const filtrado = context({
    filtersActive: true,
    groups: columnGroups([["a1", "a3"], ["b1"]]),
  });

  it("reordenar DENTRO da etapa vira no-op, nao um ponto medio ambiguo", () => {
    expect(resolveBoardDrop(filtrado, "a3")).toEqual({ kind: "none" });
  });

  it("mover ENTRE etapas continua valendo, e entra no FIM (sem vizinho)", () => {
    const action = resolveBoardDrop(filtrado, "b1");
    expect(action).toEqual({
      kind: "move",
      columnId: "col-b",
      // Os dois nulos sao o ponto: fim da coluna nao depende de vizinho, entao
      // nao ha como cair em posicao ambigua em relacao ao que esta oculto.
      beforeTaskId: null,
      afterTaskId: null,
    });
  });

  it("soltar na area vazia de outra coluna tambem entra no fim", () => {
    const action = resolveBoardDrop(filtrado, "col-b");
    expect(action).toEqual({
      kind: "move",
      columnId: "col-b",
      beforeTaskId: null,
      afterTaskId: null,
    });
  });
});

describe("resolveBoardDrop: agrupado por prioridade", () => {
  const groups: TaskGroup[] = [
    { id: "group:urgente", value: "urgente", label: "Urgente", color: null, tasks: [], totalBeforeFilter: 0 },
    { id: "group:alta", value: "alta", label: "Alta", color: null, tasks: [], totalBeforeFilter: 0 },
    { id: "group:media", value: "media", label: "Média", color: null, tasks: [card("a1")], totalBeforeFilter: 1 },
  ];
  const ctx = context({ groupBy: "priority", groups });

  it("soltar num grupo ALTERA a prioridade, nunca a ordem", () => {
    expect(resolveBoardDrop(ctx, "group:alta")).toEqual({
      kind: "priority",
      value: "alta",
    });
  });

  it("soltar sobre um card usa o grupo dono dele", () => {
    const comCard: TaskGroup[] = [
      ...groups.slice(0, 2),
      { ...groups[2], tasks: [card("a1")] },
    ];
    comCard[1] = { ...comCard[1], tasks: [card("outro", { priority: "alta" })] };
    const action = resolveBoardDrop(context({ groupBy: "priority", groups: comCard }), "outro");
    expect(action).toEqual({ kind: "priority", value: "alta" });
  });

  it("soltar no proprio grupo nao faz nada", () => {
    expect(resolveBoardDrop(ctx, "group:media")).toEqual({ kind: "none" });
  });

  it("NUNCA devolve move quando agrupado por prioridade", () => {
    for (const overId of ["group:urgente", "group:alta", "group:media", "a1"]) {
      expect(resolveBoardDrop(ctx, overId).kind).not.toBe("move");
    }
  });
});

describe("resolveBoardDrop: agrupado por responsavel", () => {
  const groups: TaskGroup[] = [
    { id: "group:u1", value: "u1", label: "Ana", color: null, tasks: [], totalBeforeFilter: 0 },
    { id: "group:none", value: null, label: "Sem responsável", color: null, tasks: [card("a1")], totalBeforeFilter: 1 },
  ];
  const ctx = context({ groupBy: "assignee", groups });

  it("soltar num responsavel atribui", () => {
    expect(resolveBoardDrop(ctx, "group:u1")).toEqual({
      kind: "assignee",
      value: "u1",
    });
  });

  it("soltar em “Sem responsável” DESATRIBUI, com null e nao com a string none", () => {
    const comDono = context({
      groupBy: "assignee",
      groups,
      task: { id: "a1", column_id: "col-a", priority: "media", assignee_id: "u1" },
    });
    expect(resolveBoardDrop(comDono, "group:none")).toEqual({
      kind: "assignee",
      value: null,
    });
  });

  it("soltar no grupo em que ja esta nao faz nada", () => {
    expect(resolveBoardDrop(ctx, "group:none")).toEqual({ kind: "none" });
  });
});

describe("etapa fixada: nao aceita card", () => {
  // A tela nao pode CONVIDAR para um erro que o servidor recusa: soltar e ver um
  // 409 e pior que nao poder soltar.
  it("mover PARA a etapa fixada nao emite acao", () => {
    const acao = resolveBoardDrop(
      context({ pinnedColumnIds: ["col-b"] }),
      "col-b",
    );
    expect(acao.kind).toBe("none");
  });

  it("reordenar DENTRO da etapa fixada tambem nao", () => {
    // A ordem ali e a de chegada do feed; mexer nela seria estado que o proximo
    // sync ignora.
    const acao = resolveBoardDrop(
      context({
        pinnedColumnIds: ["col-a"],
        task: { id: "a1", column_id: "col-a", priority: "media", assignee_id: null },
      }),
      "a3",
    );
    expect(acao.kind).toBe("none");
  });

  it("CONTROLE: SAIR da etapa fixada continua valendo, e e o fluxo principal", () => {
    // Sem esta, "nenhuma acao" seria compativel com "bloqueei o card inteiro".
    const acao = resolveBoardDrop(
      context({
        pinnedColumnIds: ["col-a"],
        task: { id: "a1", column_id: "col-a", priority: "media", assignee_id: null },
      }),
      "col-b",
    );
    expect(acao.kind).toBe("move");
  });

  it("CONTROLE: sem etapa fixada, o mesmo drop emite move", () => {
    const acao = resolveBoardDrop(context({ pinnedColumnIds: [] }), "col-b");
    expect(acao.kind).toBe("move");
  });
});
