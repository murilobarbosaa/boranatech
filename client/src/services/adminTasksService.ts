import { adminFetch } from "@/lib/adminApi";
import type {
  Task,
  TaskBoard,
  TaskBoardSnapshot,
  TaskChecklistItem,
  TaskColumn,
  TaskComment,
  TaskDetail,
  TaskLabel,
  TaskPlacement,
  TaskPriority,
  TaskType,
} from "@/components/admin/tasks/types";

// Service da aba Tarefas. Usa adminFetch (Bearer + prefixo /api/admin + parse do
// padrao { error: { code, message } } em AdminApiError), igual ao
// adminBugsService.
//
// Nenhuma funcao daqui aceita `position`: posicao e calculada no server a partir
// dos vizinhos (TaskPlacement). Se um dia aparecer um `position` num payload
// deste arquivo, e sinal de que a regra vazou para o cliente.

export type { TaskBoardSnapshot, TaskDetail };

// ---------------------------------------------------------------------------
// Boards
// ---------------------------------------------------------------------------

export async function listBoards(options?: {
  includeArchived?: boolean;
}): Promise<{ boards: TaskBoard[] }> {
  const query = options?.includeArchived ? "?includeArchived=1" : "";
  return adminFetch(`/crm/boards${query}`);
}

export async function getBoardSnapshot(
  boardId: string,
  options?: { includeArchived?: boolean },
): Promise<TaskBoardSnapshot> {
  const query = options?.includeArchived ? "?includeArchived=1" : "";
  return adminFetch(`/crm/boards/${boardId}/snapshot${query}`);
}

export async function createBoard(input: {
  name: string;
  key: string;
  slug: string;
  description?: string | null;
  color?: string;
}): Promise<TaskBoard> {
  return adminFetch("/crm/boards", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// `key` e `slug` ausentes de proposito: sao imutaveis no server, porque o ID
// curto (DEV-42) ja circula em deep link.
export async function patchBoard(
  id: string,
  patch: {
    name?: string;
    description?: string | null;
    color?: string;
    archived?: boolean;
  },
): Promise<TaskBoard> {
  return adminFetch(`/crm/boards/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteBoard(id: string): Promise<{ ok: true }> {
  return adminFetch(`/crm/boards/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Colunas (etapas)
// ---------------------------------------------------------------------------

export async function createColumn(input: {
  board_id: string;
  name: string;
  color?: string;
  wip_limit?: number | null;
  is_start?: boolean;
  is_done?: boolean;
}): Promise<TaskColumn> {
  return adminFetch("/crm/columns", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function patchColumn(
  id: string,
  patch: {
    name?: string;
    color?: string;
    wip_limit?: number | null;
    is_start?: boolean;
    is_done?: boolean;
  },
): Promise<TaskColumn> {
  return adminFetch(`/crm/columns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

/** `ids` precisa conter TODAS as etapas do quadro, na ordem desejada. */
export async function reorderColumns(
  boardId: string,
  ids: string[],
): Promise<{ columns: TaskColumn[] }> {
  return adminFetch("/crm/columns/reorder", {
    method: "PATCH",
    body: JSON.stringify({ board_id: boardId, ids }),
  });
}

/**
 * Etapa com tarefas exige `moveTo`; sem ele o server responde 409
 * column_not_empty com a contagem na mensagem.
 */
export async function deleteColumn(
  id: string,
  options?: { moveTo?: string },
): Promise<{ ok: true }> {
  const query = options?.moveTo
    ? `?moveTo=${encodeURIComponent(options.moveTo)}`
    : "";
  return adminFetch(`/crm/columns/${id}${query}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Tarefas
// ---------------------------------------------------------------------------

export async function createTask(
  input: {
    board_id: string;
    column_id?: string;
    title: string;
    description?: string | null;
    notes?: string | null;
    priority?: TaskPriority;
    type?: TaskType;
    assignee_id?: string | null;
    due_date?: string | null;
    estimate?: number | null;
  } & TaskPlacement,
): Promise<Task> {
  return adminFetch("/crm/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getTask(id: string): Promise<TaskDetail> {
  return adminFetch(`/crm/tasks/${id}`);
}

export async function patchTask(
  id: string,
  patch: {
    title?: string;
    description?: string | null;
    notes?: string | null;
    priority?: TaskPriority;
    type?: TaskType;
    assignee_id?: string | null;
    due_date?: string | null;
    estimate?: number | null;
    archived?: boolean;
  },
): Promise<Task> {
  return adminFetch(`/crm/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

/**
 * Move o card. `column_id` e obrigatorio mesmo quando a etapa nao muda (o caso
 * de reordenar dentro da coluna). completed_at e derivado da etapa de destino
 * pelo server, nunca enviado daqui.
 */
export async function moveTask(
  id: string,
  input: { column_id: string } & TaskPlacement,
): Promise<Task> {
  return adminFetch(`/crm/tasks/${id}/move`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteTask(id: string): Promise<{ ok: true }> {
  return adminFetch(`/crm/tasks/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Etiquetas
// ---------------------------------------------------------------------------

/**
 * Criacao inline do modal. Nome que ja existe no quadro NAO e erro: o server
 * devolve a etiqueta existente com 200, entao o cliente so usa o resultado.
 */
export async function createLabel(input: {
  board_id: string;
  name: string;
  color?: string;
}): Promise<TaskLabel> {
  return adminFetch("/crm/labels", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function patchLabel(
  id: string,
  patch: { name?: string; color?: string },
): Promise<TaskLabel> {
  return adminFetch(`/crm/labels/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteLabel(id: string): Promise<{ ok: true }> {
  return adminFetch(`/crm/labels/${id}`, { method: "DELETE" });
}

/** Idempotente: aplicar uma etiqueta ja aplicada responde ok. */
export async function attachLabel(
  taskId: string,
  labelId: string,
): Promise<{ ok: true }> {
  return adminFetch(`/crm/tasks/${taskId}/labels`, {
    method: "POST",
    body: JSON.stringify({ label_id: labelId }),
  });
}

export async function detachLabel(
  taskId: string,
  labelId: string,
): Promise<{ ok: true }> {
  return adminFetch(`/crm/tasks/${taskId}/labels/${labelId}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Comentarios
// ---------------------------------------------------------------------------

export async function createComment(
  taskId: string,
  body: string,
): Promise<TaskComment> {
  return adminFetch(`/crm/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

/** Só o autor edita ou remove; para os demais o server responde 404. */
export async function patchComment(
  id: string,
  body: string,
): Promise<TaskComment> {
  return adminFetch(`/crm/comments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ body }),
  });
}

export async function deleteComment(id: string): Promise<{ ok: true }> {
  return adminFetch(`/crm/comments/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------

export async function createChecklistItem(
  taskId: string,
  content: string,
): Promise<TaskChecklistItem> {
  return adminFetch(`/crm/tasks/${taskId}/checklist`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function patchChecklistItem(
  id: string,
  patch: { content?: string; is_done?: boolean },
): Promise<TaskChecklistItem> {
  return adminFetch(`/crm/checklist/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteChecklistItem(id: string): Promise<{ ok: true }> {
  return adminFetch(`/crm/checklist/${id}`, { method: "DELETE" });
}

/** `ids` precisa conter TODOS os itens do checklist, na ordem desejada. */
export async function reorderChecklist(
  taskId: string,
  ids: string[],
): Promise<{ checklist: TaskChecklistItem[] }> {
  return adminFetch(`/crm/tasks/${taskId}/checklist/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ ids }),
  });
}
