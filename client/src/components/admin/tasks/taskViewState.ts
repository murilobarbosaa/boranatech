import { EMPTY_FILTERS, type GroupBy, type TaskFilters } from "./taskFilters";
import type { DueFilter } from "./taskFilters";
import type { TaskPriority, TaskType } from "./types";

// Estado da tela (busca, filtros, agrupamento, visao, arquivadas) na query
// string, convivendo com `?section=` e `?task=`.
//
// Motivo de valer o trabalho: torna "todas as atrasadas do fulano" um link
// compartilhavel, e faz F5 e voltar/avancar do navegador funcionarem sem estado
// espelhado. E o mesmo mecanismo do `?task=` da Fase 2, pelo mesmo motivo.
//
// A regra que nao pode ser quebrada e a de sempre: escrever qualquer parametro
// PRESERVA os outros. Nenhuma funcao aqui monta a query do zero.

export type ViewMode = "board" | "lista";

export type TaskViewState = {
  filters: TaskFilters;
  groupBy: GroupBy;
  view: ViewMode;
  includeArchived: boolean;
};

export const DEFAULT_VIEW_STATE: TaskViewState = {
  filters: EMPTY_FILTERS,
  groupBy: "column",
  view: "board",
  includeArchived: false,
};

const PRIORITIES: TaskPriority[] = ["baixa", "media", "alta", "urgente"];
const TYPES: TaskType[] = ["feature", "melhoria", "debito_tecnico", "tarefa"];
const GROUPS: GroupBy[] = ["column", "assignee", "priority"];
const DUES: DueFilter[] = ["", "late", "week"];

/** Lista separada por virgula, filtrada contra os valores conhecidos. */
function csv<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is T => (allowed as readonly string[]).includes(item));
}

/** Lista de ids livres (uuid): sem allowlist, mas com limite e sem vazio. */
function idList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= 64)
    .slice(0, 40);
}

export function readViewState(search: string): TaskViewState {
  const params = new URLSearchParams(search);
  const groupRaw = params.get("group");
  const viewRaw = params.get("view");
  const dueRaw = params.get("due");

  return {
    filters: {
      // Valor cru: a busca e literal (ver matchesQuery), entao nao ha o que
      // sanear aqui alem do tamanho.
      query: (params.get("q") ?? "").slice(0, 200),
      assigneeIds: idList(params.get("assignee")),
      labelIds: idList(params.get("labels")),
      priorities: csv(params.get("priority"), PRIORITIES),
      types: csv(params.get("type"), TYPES),
      due: (DUES as readonly string[]).includes(dueRaw ?? "")
        ? ((dueRaw ?? "") as DueFilter)
        : "",
      mine: params.get("mine") === "1",
    },
    // Valor desconhecido cai no padrao em vez de deixar a tela num estado que
    // nenhum componente sabe renderizar.
    groupBy: (GROUPS as readonly string[]).includes(groupRaw ?? "")
      ? (groupRaw as GroupBy)
      : "column",
    view: viewRaw === "lista" ? "lista" : "board",
    includeArchived: params.get("archived") === "1",
  };
}

/**
 * Devolve a query string com o estado aplicado, PRESERVANDO `section`, `task` e
 * qualquer parametro de terceiros. Parametro em valor padrao e REMOVIDO, para a
 * URL de uso normal continuar curta e o link compartilhado nao carregar ruido.
 */
export function writeViewState(search: string, state: TaskViewState): string {
  const params = new URLSearchParams(search);

  const set = (key: string, value: string) => {
    if (value) params.set(key, value);
    else params.delete(key);
  };

  set("q", state.filters.query.trim());
  set("assignee", state.filters.assigneeIds.join(","));
  set("labels", state.filters.labelIds.join(","));
  set("priority", state.filters.priorities.join(","));
  set("type", state.filters.types.join(","));
  set("due", state.filters.due);
  set("mine", state.filters.mine ? "1" : "");
  set("group", state.groupBy === "column" ? "" : state.groupBy);
  set("view", state.view === "board" ? "" : state.view);
  set("archived", state.includeArchived ? "1" : "");

  const query = params.toString();
  return query ? `?${query}` : "";
}
