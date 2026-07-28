import type { TaskAssignee, TaskCard, TaskColumn, TaskPriority, TaskType } from "./types";
import { priorityMetaOf } from "./taskBoardStyles";

// Filtro, busca e agrupamento do board. Tudo puro e testavel sem DOM.
//
// A filtragem acontece NO CLIENTE, sobre o snapshot ja carregado. E instantanea
// e elimina uma familia inteira de estados de carregamento (sem spinner por
// tecla digitada, sem requisicao competindo, sem resposta obsoleta chegando
// depois de a pessoa mudar o filtro).
//
// LIMITE DESSA ESCOLHA, para quem ler daqui a um ano: ela para de valer quando
// um quadro passar da ordem de alguns milhares de tarefas. Nesse ponto o gargalo
// deixa de ser o filtro e passa a ser o SNAPSHOT, que carrega o quadro inteiro
// numa requisicao; filtrar no servidor sem paginar o snapshot nao resolveria
// nada. A troca certa nessa hora e paginar o snapshot, e ai o filtro vai junto.
// A unica excecao hoje e o toggle de arquivadas, que muda o que o servidor
// devolve (includeArchived=1) e por isso nao e filtro de cliente.

export type DueFilter = "" | "late" | "week";

export type TaskFilters = {
  query: string;
  assigneeIds: string[];
  labelIds: string[];
  priorities: TaskPriority[];
  types: TaskType[];
  due: DueFilter;
  mine: boolean;
};

export const EMPTY_FILTERS: TaskFilters = {
  query: "",
  assigneeIds: [],
  labelIds: [],
  priorities: [],
  types: [],
  due: "",
  mine: false,
};

/**
 * Busca por SUBSTRING literal, nunca por padrao.
 *
 * Este e o mesmo risco do `50% pronto` que apareceu no LabelPicker: num `ilike`,
 * procurar por "100%" casaria "100" seguido de qualquer coisa, e procurar por
 * "a_b" casaria "axb". Aqui nao ha curinga porque nao ha padrao: `includes` trata
 * `%`, `_` e `\` como caracteres comuns, por construcao.
 *
 * SE um dia esta busca migrar para o servidor (ver o limite acima), o `%`, o `_`
 * e o `\` PRECISAM ser escapados no padrao do ilike, e a escolha de manter tudo
 * literal aqui deixa de ser automatica.
 */
export function matchesQuery(task: TaskCard, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;
  const haystack = `${task.title}\n${task.description ?? ""}`.toLowerCase();
  return haystack.includes(query);
}

/** Dia de hoje em AAAA-MM-DD, no fuso local, para comparar com due_date. */
function todayIso(nowMs: number): string {
  const now = new Date(nowMs);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export type FilterContext = {
  nowMs: number;
  currentUserId: string | null;
};

export function matchesFilters(
  task: TaskCard,
  filters: TaskFilters,
  context: FilterContext,
): boolean {
  if (!matchesQuery(task, filters.query)) return false;

  if (filters.assigneeIds.length > 0) {
    if (!task.assignee_id || !filters.assigneeIds.includes(task.assignee_id)) {
      return false;
    }
  }
  // Etiquetas em OU: marcar duas mostra o que tem qualquer uma delas. E o que a
  // pessoa espera de um filtro de etiqueta; E logico exigiria uma segunda opcao
  // na interface para pouco ganho.
  if (filters.labelIds.length > 0) {
    if (!task.label_ids.some((id) => filters.labelIds.includes(id))) return false;
  }
  if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
    return false;
  }
  if (filters.types.length > 0 && !filters.types.includes(task.type)) return false;

  if (filters.due) {
    if (!task.due_date) return false;
    const today = todayIso(context.nowMs);
    if (filters.due === "late" && !(task.due_date < today)) return false;
    if (filters.due === "week") {
      const limit = addDays(today, 6);
      if (task.due_date < today || task.due_date > limit) return false;
    }
  }

  if (filters.mine) {
    if (!context.currentUserId || task.created_by !== context.currentUserId) {
      return false;
    }
  }

  return true;
}

/** Quantos filtros estao ligados. A busca conta como um. */
export function activeFilterCount(filters: TaskFilters): number {
  let count = 0;
  if (filters.query.trim()) count += 1;
  if (filters.assigneeIds.length > 0) count += 1;
  if (filters.labelIds.length > 0) count += 1;
  if (filters.priorities.length > 0) count += 1;
  if (filters.types.length > 0) count += 1;
  if (filters.due) count += 1;
  if (filters.mine) count += 1;
  return count;
}

export function hasActiveFilters(filters: TaskFilters): boolean {
  return activeFilterCount(filters) > 0;
}

// ---------------------------------------------------------------------------
// Agrupamento
// ---------------------------------------------------------------------------

export type GroupBy = "column" | "assignee" | "priority";

export type TaskGroup = {
  /** Id do container para o dnd-kit. Coluna: o uuid. Demais: `group:<valor>`. */
  id: string;
  /** Valor cru do agrupamento (uuid da coluna, uuid do usuario, prioridade). */
  value: string | null;
  label: string;
  color: string | null;
  tasks: TaskCard[];
  /** Total ANTES do filtro, para o contador "3 de 12". */
  totalBeforeFilter: number;
};

export const GROUP_PREFIX = "group:";

/** Prioridades na ordem de urgencia, nao alfabetica. */
const PRIORITY_ORDER: TaskPriority[] = ["urgente", "alta", "media", "baixa"];

/**
 * Monta os grupos ja filtrados, preservando a ordem visual dentro de cada um.
 *
 * `allTasks` entra alem de `visibleTasks` porque o contador precisa dizer
 * "3 de 12": sem o total anterior ao filtro, a coluna filtrada e indistinguivel
 * de uma coluna que realmente so tem 3.
 */
export function buildGroups(
  visibleTasks: TaskCard[],
  allTasks: TaskCard[],
  groupBy: GroupBy,
  columns: TaskColumn[],
  admins: TaskAssignee[],
): TaskGroup[] {
  const sortByPosition = (list: TaskCard[]) =>
    [...list].sort(
      (a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at),
    );

  if (groupBy === "column") {
    return columns.map((column) => ({
      id: column.id,
      value: column.id,
      label: column.name,
      color: column.color,
      tasks: sortByPosition(visibleTasks.filter((t) => t.column_id === column.id)),
      totalBeforeFilter: allTasks.filter((t) => t.column_id === column.id).length,
    }));
  }

  if (groupBy === "priority") {
    return PRIORITY_ORDER.map((priority) => ({
      id: `${GROUP_PREFIX}${priority}`,
      value: priority,
      label: priorityMetaOf(priority).label,
      color: null,
      tasks: sortByPosition(visibleTasks.filter((t) => t.priority === priority)),
      totalBeforeFilter: allTasks.filter((t) => t.priority === priority).length,
    }));
  }

  // Responsavel: os admins na ordem em que vieram, e "Sem responsavel" por
  // ultimo. Nao omite grupo vazio: um responsavel sem tarefa nenhuma e
  // informacao, e o grupo tambem e alvo de arrasto.
  const groups: TaskGroup[] = admins.map((admin) => ({
    id: `${GROUP_PREFIX}${admin.user_id}`,
    value: admin.user_id,
    label: admin.name ?? admin.email ?? admin.user_id,
    color: null,
    tasks: sortByPosition(visibleTasks.filter((t) => t.assignee_id === admin.user_id)),
    totalBeforeFilter: allTasks.filter((t) => t.assignee_id === admin.user_id).length,
  }));
  groups.push({
    id: `${GROUP_PREFIX}none`,
    value: null,
    label: "Sem responsável",
    color: null,
    tasks: sortByPosition(visibleTasks.filter((t) => t.assignee_id === null)),
    totalBeforeFilter: allTasks.filter((t) => t.assignee_id === null).length,
  });
  return groups;
}

/** Extrai o valor de um id de grupo (`group:alta` -> `alta`). null = "sem". */
export function groupValueOf(containerId: string): string | null {
  if (!containerId.startsWith(GROUP_PREFIX)) return null;
  const value = containerId.slice(GROUP_PREFIX.length);
  return value === "none" ? null : value;
}

export function isGroupContainer(containerId: string): boolean {
  return containerId.startsWith(GROUP_PREFIX);
}
