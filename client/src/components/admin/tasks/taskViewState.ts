import { EMPTY_FILTERS, type GroupBy, type TaskFilters } from "./taskFilters";
import type { DueFilter, OrigemFilter } from "./taskFilters";
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
const ORIGENS = ["sentry", "manual"] as const;
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
  const origemRaw = params.get("origem");

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
      // Mesmo tratamento do `due`: valor fora do conjunto conhecido vira "sem
      // filtro", nunca um estado que nenhum componente sabe desenhar.
      origem: (ORIGENS as readonly string[]).includes(origemRaw ?? "")
        ? ((origemRaw ?? "") as OrigemFilter)
        : "",
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

  set("origem", state.filters.origem);
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

/**
 * Chaves da URL que pertencem A ABA DE TAREFAS, e so a ela.
 *
 * Existe porque `setActiveSection` (Admin.tsx) passou a PRESERVAR os demais
 * parametros ao trocar de aba. A preservacao esta certa e resolveu um problema
 * real (o `?window=` da Visao voltava ao padrao a cada troca de aba), mas ela
 * inverteu o risco: enquanto a query era reescrita do zero, chave de escopo de
 * secao nao vazava; agora vaza toda.
 *
 * O sintoma comeca cosmetico (`board=bugs` viajando para a aba de Financeiro) e
 * nao para ai: `task=BUG-12` num deep link de outra aba e um estado que nenhuma
 * delas sabe ler, e filtro de tarefa preservado fora de Tarefas e ruido que a
 * pessoa nao consegue limpar sem editar a URL a mao.
 *
 * A lista mora AQUI, e nao no Admin.tsx, porque este e o arquivo que LE e
 * ESCREVE essas chaves. Uma segunda copia do outro lado divergiria no primeiro
 * filtro novo, e o modo de falha seria silencioso: a chave nova simplesmente
 * vazaria, sem nada quebrar.
 *
 * `board` e `task` entram junto com as de filtro por serem do mesmo tipo:
 * identificam O QUE se olha DENTRO da aba, e nao fazem sentido fora dela.
 */
export const CHAVES_DA_ABA_TAREFAS = [
  "q",
  "assignee",
  "labels",
  "priority",
  "type",
  "due",
  "origem",
  "mine",
  "group",
  "view",
  "archived",
  "board",
  "task",
] as const;

/**
 * Remove as chaves de escopo de secao ao TROCAR de secao, preservando o resto.
 *
 * Recebe e devolve a search, no mesmo contrato de writeViewState e withTaskParam:
 * nenhuma funcao deste modulo monta a query do zero.
 */
export function limparChavesDeSecao(search: string): string {
  const params = new URLSearchParams(search);
  for (const chave of CHAVES_DA_ABA_TAREFAS) params.delete(chave);
  const query = params.toString();
  return query ? `?${query}` : "";
}
