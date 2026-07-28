import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { ErrorBlock } from "@/components/admin/StateBlocks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BntSelect } from "@/components/shared/BntSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminApiError } from "@/lib/adminApi";
import {
  createColumn as apiCreateColumn,
  createTask as apiCreateTask,
  deleteColumn as apiDeleteColumn,
  moveTask as apiMoveTask,
  patchColumn as apiPatchColumn,
  reorderColumns as apiReorderColumns,
} from "@/services/adminTasksService";

import { BoardColumn } from "./BoardColumn";
import { BoardToolbar } from "./BoardToolbar";
import { emptyBlockClass, primaryButtonClass, secondaryButtonClass } from "./taskBoardStyles";
import { parseShortId, readTaskParam, shortIdOf, withTaskParam } from "./taskDeepLink";
import type { TaskBoardSnapshot, TaskCard as TaskCardData, TaskColumn } from "./types";
import { useBoardSnapshot } from "./useBoardSnapshot";

// Aba Tarefas: board Kanban interno. Este componente e o DONO do estado e de
// toda mutacao; os filhos (BoardColumn, TaskCard, ColumnHeader, NewTaskComposer)
// sao memo e so recebem dados e handlers estaveis.
//
// Update otimista no formato do moveBug (BugsDashboard.tsx): snapshot do estado
// anterior, muta local, await, rollback + toast no erro, refresh como fonte de
// verdade no sucesso. Duas diferencas obrigatorias aqui:
//
//   1. o rollback e POR TAREFA, nao do board inteiro. Restaurar o snapshot
//      completo desfaria movimentos posteriores que ja gravaram;
//   2. cada tarefa tem um contador de movimento. Se um segundo move partiu, o
//      erro do primeiro NAO reverte nada: o estado da tela ja e o do segundo, e
//      ressuscitar o anterior mostraria o card numa coluna onde ele nao esta
//      mais nem no servidor nem na intencao de quem clicou.

const TEMP_ID_PREFIX = "temp-";

/** Substitui uma tarefa no snapshot, preservando tudo o mais. */
function withTask(
  snapshot: TaskBoardSnapshot,
  taskId: string,
  mutate: (task: TaskCardData) => TaskCardData,
): TaskBoardSnapshot {
  return {
    ...snapshot,
    tasks: snapshot.tasks.map((task) =>
      task.id === taskId ? mutate(task) : task,
    ),
  };
}

export function TasksDashboard() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const [boardId, setBoardId] = useState<string | null>(null);
  const {
    boards,
    snapshot,
    loading,
    error,
    refresh,
    applyLocal,
  } = useBoardSnapshot(boardId);

  const [pendingTaskIds, setPendingTaskIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState<string | null>(
    null,
  );
  const [deleteMoveTo, setDeleteMoveTo] = useState<string>("");

  // Refs para handlers ESTAVEIS: sem isto, todo useCallback dependeria de
  // `snapshot`/`search` e mudaria de identidade a cada render, o que anularia o
  // memo dos filhos exatamente na hora em que ele importa.
  const snapshotRef = useRef<TaskBoardSnapshot | null>(null);
  snapshotRef.current = snapshot;
  const searchRef = useRef(search);
  searchRef.current = search;
  const moveSeqRef = useRef(new Map<string, number>());
  const tempCounter = useRef(0);

  // Primeiro board vira o ativo. Nao reescreve a URL: quadro nao esta no deep
  // link nesta fase.
  useEffect(() => {
    if (!boardId && boards.length > 0) setBoardId(boards[0].id);
  }, [boardId, boards]);

  const markPending = useCallback((taskId: string, pending: boolean) => {
    setPendingTaskIds((current) => {
      const next = new Set(current);
      if (pending) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  }, []);

  // -------------------------------------------------------------------------
  // Deep link
  // -------------------------------------------------------------------------
  // `?task=` e derivado da URL, sem estado espelhado, igual ao `?section=` da
  // pagina. Voltar/avancar no navegador funciona de graca porque nao existe
  // estado a ressincronizar; e escrever preserva os outros parametros
  // (withTaskParam), entao abrir uma tarefa nao joga a pessoa para a visao geral.
  const selectedShortId = readTaskParam(search);
  const selectedTaskId = useMemo(() => {
    if (!selectedShortId || !snapshot) return null;
    const parsed = parseShortId(selectedShortId);
    if (!parsed || parsed.boardKey !== snapshot.board.key) return null;
    return snapshot.tasks.find((task) => task.number === parsed.number)?.id ?? null;
  }, [selectedShortId, snapshot]);

  const openTask = useCallback(
    (taskId: string) => {
      const current = snapshotRef.current;
      const task = current?.tasks.find((item) => item.id === taskId);
      // Tarefa otimista ainda sem numero real nao entra na URL: o link seria
      // invalido e quebraria ao recarregar.
      if (!current || !task || task.id.startsWith(TEMP_ID_PREFIX)) return;
      setLocation(
        `/admin${withTaskParam(searchRef.current, shortIdOf(current.board.key, task.number))}`,
      );
    },
    [setLocation],
  );

  const closeTask = useCallback(() => {
    setLocation(`/admin${withTaskParam(searchRef.current, null)}`);
  }, [setLocation]);

  // TODO(Fase 4): o modal da tarefa consome selectedTaskId e chama closeTask no
  // Esc e no clique fora. Nesta fase o deep link so destaca o card no board,
  // para a mecanica de URL entrar isolada da complexidade do modal.
  void closeTask;

  // -------------------------------------------------------------------------
  // Derivados
  // -------------------------------------------------------------------------

  const columns = useMemo(
    () => (snapshot ? [...snapshot.columns].sort((a, b) => a.position - b.position) : []),
    [snapshot],
  );

  const tasksByColumn = useMemo(() => {
    const grouped = new Map<string, TaskCardData[]>();
    for (const column of columns) grouped.set(column.id, []);
    for (const task of snapshot?.tasks ?? []) {
      const bucket = grouped.get(task.column_id);
      if (bucket) bucket.push(task);
    }
    // forEach e nao for..of: o tsconfig do projeto nao habilita
    // downlevelIteration, entao iterar Map.values() diretamente nao compila.
    grouped.forEach((bucket: TaskCardData[]) => {
      bucket.sort(
        (a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at),
      );
    });
    return grouped;
  }, [columns, snapshot]);

  const labelsById = useMemo(
    () => new Map((snapshot?.labels ?? []).map((label) => [label.id, label])),
    [snapshot?.labels],
  );
  const assigneesById = useMemo(
    () => new Map((snapshot?.admins ?? []).map((admin) => [admin.user_id, admin])),
    [snapshot?.admins],
  );

  // -------------------------------------------------------------------------
  // Mover tarefa (setas de avanco rapido)
  // -------------------------------------------------------------------------

  const quickMove = useCallback(
    async (taskId: string, direction: -1 | 1) => {
      const current = snapshotRef.current;
      if (!current) return;
      const task = current.tasks.find((item) => item.id === taskId);
      if (!task || task.id.startsWith(TEMP_ID_PREFIX)) return;

      const ordered = [...current.columns].sort((a, b) => a.position - b.position);
      const index = ordered.findIndex((column) => column.id === task.column_id);
      const target = ordered[index + direction];
      if (!target) return;

      const previousColumnId = task.column_id;
      const previousPosition = task.position;
      const seq = (moveSeqRef.current.get(taskId) ?? 0) + 1;
      moveSeqRef.current.set(taskId, seq);

      // Otimista: entra no FIM da coluna de destino, que e o mesmo lugar onde o
      // server vai coloca-lo (a chamada nao manda vizinho).
      const endPosition =
        Math.max(
          0,
          ...current.tasks
            .filter((item) => item.column_id === target.id)
            .map((item) => item.position),
        ) + 1000;
      applyLocal((snap) =>
        withTask(snap, taskId, (item) => ({
          ...item,
          column_id: target.id,
          position: endPosition,
        })),
      );
      markPending(taskId, true);

      try {
        const moved = await apiMoveTask(taskId, { column_id: target.id });
        // A guarda de sequencia vale no SUCESSO tambem, nao so no erro: se um
        // segundo move ja partiu, aplicar a resposta do primeiro puxaria o card
        // de volta para a coluna intermediaria. O erro e mais obvio de imaginar,
        // mas os dois caminhos escrevem no mesmo lugar.
        if (moveSeqRef.current.get(taskId) !== seq) return;
        // Resposta autoritativa (position e completed_at vem do server).
        applyLocal((snap) =>
          withTask(snap, taskId, (item) => ({ ...item, ...moved })),
        );
        await refresh();
      } catch (mutationError) {
        // Um move mais novo ja partiu: o estado atual e o dele, e desfazer aqui
        // mostraria o card num lugar que ninguem pediu.
        if (moveSeqRef.current.get(taskId) === seq) {
          applyLocal((snap) =>
            withTask(snap, taskId, (item) => ({
              ...item,
              column_id: previousColumnId,
              position: previousPosition,
            })),
          );
          toast.error(
            mutationError instanceof Error
              ? mutationError.message
              : "Erro ao mover a tarefa.",
          );
        }
      } finally {
        // So o ultimo movimento limpa o sinal: senao o primeiro a terminar
        // apagaria o "em andamento" de um segundo que ainda esta no ar.
        if (moveSeqRef.current.get(taskId) === seq) markPending(taskId, false);
      }
    },
    [applyLocal, markPending, refresh],
  );

  const handleQuickMove = useCallback(
    (taskId: string, direction: -1 | 1) => {
      void quickMove(taskId, direction);
    },
    [quickMove],
  );

  // -------------------------------------------------------------------------
  // Criar tarefa
  // -------------------------------------------------------------------------

  const createTask = useCallback(
    async (columnId: string, title: string, placement: "top" | "bottom") => {
      const current = snapshotRef.current;
      if (!current) return;

      const tempId = `${TEMP_ID_PREFIX}${(tempCounter.current += 1)}`;
      const columnTasks = current.tasks
        .filter((task) => task.column_id === columnId)
        .sort((a, b) => a.position - b.position);
      const optimisticPosition =
        placement === "top"
          ? (columnTasks[0]?.position ?? 1000) - 1000
          : (columnTasks[columnTasks.length - 1]?.position ?? 0) + 1000;

      const now = new Date().toISOString();
      const optimistic: TaskCardData = {
        id: tempId,
        board_id: current.board.id,
        column_id: columnId,
        // number 0 marca "ainda sem numero do banco". O card mostra o placeholder
        // e openTask recusa entrar na URL enquanto for temporario.
        number: 0,
        title,
        description: null,
        notes: null,
        position: optimisticPosition,
        priority: "media",
        type: "tarefa",
        assignee_id: null,
        created_by: "",
        updated_by: null,
        due_date: null,
        estimate: null,
        completed_at: null,
        archived_at: null,
        created_at: now,
        updated_at: now,
        label_ids: [],
        checklist_total: 0,
        checklist_done: 0,
        comment_count: 0,
      };

      applyLocal((snap) => ({ ...snap, tasks: [...snap.tasks, optimistic] }));

      try {
        const created = await apiCreateTask({
          board_id: current.board.id,
          column_id: columnId,
          title,
          // "top" entra ANTES do primeiro card da coluna: o vizinho de baixo e
          // ele. "bottom" nao manda vizinho e o server poe no fim.
          after_task_id: placement === "top" ? (columnTasks[0]?.id ?? null) : null,
        });
        // Troca no LUGAR, sem remover e reinserir: assim o card nao pisca nem
        // aparece duplicado entre a resposta e o refresh.
        applyLocal((snap) => ({
          ...snap,
          tasks: snap.tasks.map((task) =>
            task.id === tempId
              ? {
                  ...task,
                  ...created,
                  label_ids: [],
                  checklist_total: 0,
                  checklist_done: 0,
                  comment_count: 0,
                }
              : task,
          ),
        }));
        await refresh();
      } catch (mutationError) {
        applyLocal((snap) => ({
          ...snap,
          tasks: snap.tasks.filter((task) => task.id !== tempId),
        }));
        toast.error(
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao criar a tarefa.",
        );
      }
    },
    [applyLocal, refresh],
  );

  const handleCreateTask = useCallback(
    (columnId: string, title: string, placement: "top" | "bottom") => {
      void createTask(columnId, title, placement);
    },
    [createTask],
  );

  // -------------------------------------------------------------------------
  // Etapas
  // -------------------------------------------------------------------------

  const patchColumnOptimistic = useCallback(
    async (columnId: string, patch: Partial<TaskColumn>, errorLabel: string) => {
      const current = snapshotRef.current;
      const previous = current?.columns.find((column) => column.id === columnId);
      if (!previous) return;

      applyLocal((snap) => ({
        ...snap,
        columns: snap.columns.map((column) =>
          column.id === columnId ? { ...column, ...patch } : column,
        ),
      }));

      try {
        await apiPatchColumn(columnId, patch);
        await refresh();
      } catch (mutationError) {
        applyLocal((snap) => ({
          ...snap,
          columns: snap.columns.map((column) =>
            column.id === columnId ? previous : column,
          ),
        }));
        toast.error(
          mutationError instanceof Error ? mutationError.message : errorLabel,
        );
      }
    },
    [applyLocal, refresh],
  );

  const handleRenameColumn = useCallback(
    (columnId: string, name: string) => {
      void patchColumnOptimistic(columnId, { name }, "Erro ao renomear a etapa.");
    },
    [patchColumnOptimistic],
  );

  const handleRecolorColumn = useCallback(
    (columnId: string, color: string) => {
      void patchColumnOptimistic(columnId, { color }, "Erro ao mudar a cor.");
    },
    [patchColumnOptimistic],
  );

  const handleSetWipLimit = useCallback(
    (columnId: string, wipLimit: number | null) => {
      void patchColumnOptimistic(
        columnId,
        { wip_limit: wipLimit },
        "Erro ao definir o limite.",
      );
    },
    [patchColumnOptimistic],
  );

  const handleMoveColumn = useCallback(
    (columnId: string, direction: -1 | 1) => {
      const current = snapshotRef.current;
      if (!current) return;
      const ordered = [...current.columns].sort((a, b) => a.position - b.position);
      const index = ordered.findIndex((column) => column.id === columnId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ordered.length) return;

      const reordered = [...ordered];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      const previousColumns = current.columns;

      // A rota de reorder exige o conjunto COMPLETO de ids e recusa lista
      // parcial com incomplete_order. Mandar a lista inteira nao e detalhe: e o
      // contrato.
      const ids = reordered.map((column) => column.id);
      applyLocal((snap) => ({
        ...snap,
        columns: reordered.map((column, position) => ({
          ...column,
          position: (position + 1) * 1000,
        })),
      }));

      void (async () => {
        try {
          await apiReorderColumns(current.board.id, ids);
          await refresh();
        } catch (mutationError) {
          applyLocal((snap) => ({ ...snap, columns: previousColumns }));
          toast.error(
            mutationError instanceof Error
              ? mutationError.message
              : "Erro ao reordenar as etapas.",
          );
        }
      })();
    },
    [applyLocal, refresh],
  );

  const handleCreateColumn = useCallback(() => {
    const current = snapshotRef.current;
    if (!current) return;
    const name = window.prompt("Nome da nova etapa:");
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    void (async () => {
      try {
        await apiCreateColumn({ board_id: current.board.id, name: trimmed });
        await refresh();
        toast.success("Etapa criada.");
      } catch (mutationError) {
        toast.error(
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao criar a etapa.",
        );
      }
    })();
  }, [refresh]);

  const handleRequestDeleteColumn = useCallback((columnId: string) => {
    setDeleteColumnId(columnId);
    setDeleteBlockedMessage(null);
    setDeleteMoveTo("");
  }, []);

  const confirmDeleteColumn = useCallback(async () => {
    if (!deleteColumnId) return;
    try {
      await apiDeleteColumn(deleteColumnId, {
        moveTo: deleteMoveTo || undefined,
      });
      setDeleteColumnId(null);
      setDeleteBlockedMessage(null);
      setDeleteMoveTo("");
      await refresh();
      toast.success("Etapa excluída.");
    } catch (mutationError) {
      // 409 column_not_empty nao e falha: e o server pedindo o destino das
      // tarefas. O dialogo troca de modo e reenvia com moveTo.
      if (
        mutationError instanceof AdminApiError &&
        mutationError.code === "column_not_empty"
      ) {
        setDeleteBlockedMessage(mutationError.message);
        return;
      }
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Erro ao excluir a etapa.",
      );
    }
  }, [deleteColumnId, deleteMoveTo, refresh]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="w-[19rem] shrink-0 rounded-3xl border-2 border-slate-900 bg-slate-50 p-3 shadow-[3px_3px_0_#0f172a]"
          >
            <Skeleton className="mb-3 h-5 w-32 bg-slate-200" />
            <div className="space-y-2.5">
              <Skeleton className="h-24 w-full rounded-2xl bg-slate-200" />
              <Skeleton className="h-24 w-full rounded-2xl bg-slate-200" />
              <Skeleton className="h-16 w-full rounded-2xl bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <ErrorBlock message={error} />
        <button
          type="button"
          onClick={() => void refresh()}
          className={secondaryButtonClass}
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className={emptyBlockClass}>
        Nenhum quadro cadastrado ainda.
      </div>
    );
  }

  const deleteTargetColumn = deleteColumnId
    ? columns.find((column) => column.id === deleteColumnId)
    : undefined;

  return (
    <div className="space-y-4">
      <BoardToolbar
        boards={boards}
        activeBoardId={boardId}
        taskCount={snapshot.tasks.length}
        onSelectBoard={setBoardId}
      />

      {columns.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-black text-slate-600">
            Este quadro ainda não tem etapas.
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Crie a primeira para começar a registrar tarefas.
          </p>
          <button
            type="button"
            onClick={handleCreateColumn}
            className={`${primaryButtonClass} mt-4`}
          >
            Criar primeira etapa
          </button>
        </div>
      ) : (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 sm:snap-none">
          {columns.map((column, index) => (
            <BoardColumn
              key={column.id}
              column={column}
              tasks={tasksByColumn.get(column.id) ?? []}
              boardKey={snapshot.board.key}
              labelsById={labelsById}
              assigneesById={assigneesById}
              canMoveLeft={index > 0}
              canMoveRight={index < columns.length - 1}
              selectedTaskId={selectedTaskId}
              pendingTaskIds={pendingTaskIds}
              onOpenTask={openTask}
              onQuickMove={handleQuickMove}
              onCreateTask={handleCreateTask}
              onRenameColumn={handleRenameColumn}
              onRecolorColumn={handleRecolorColumn}
              onSetWipLimit={handleSetWipLimit}
              onMoveColumn={handleMoveColumn}
              onRequestDeleteColumn={handleRequestDeleteColumn}
            />
          ))}

          <div className="flex w-[85vw] shrink-0 snap-start items-start sm:w-[13rem]">
            <button
              type="button"
              onClick={handleCreateColumn}
              className="flex w-full items-center justify-center gap-1.5 rounded-3xl border-2 border-dashed border-slate-400 bg-white/60 px-4 py-6 text-sm font-black text-slate-600 transition-colors hover:border-slate-900 hover:bg-white hover:text-slate-900"
            >
              <Plus className="h-4 w-4" />
              Nova etapa
            </button>
          </div>
        </div>
      )}

      <AlertDialog
        open={deleteColumnId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteColumnId(null);
            setDeleteBlockedMessage(null);
            setDeleteMoveTo("");
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a]">
          <AlertDialogTitle className="font-display text-2xl font-black text-slate-950">
            Excluir etapa
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-semibold text-slate-600">
            {deleteBlockedMessage
              ? deleteBlockedMessage
              : `A etapa “${deleteTargetColumn?.name ?? ""}” será removida. Esta ação não pode ser desfeita.`}
          </AlertDialogDescription>

          {deleteBlockedMessage ? (
            <div className="mt-2">
              <label
                htmlFor="tasks-move-to"
                className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600"
              >
                Mover as tarefas para
              </label>
              <BntSelect
                id="tasks-move-to"
                size="sm"
                accent="gold"
                value={deleteMoveTo}
                onValueChange={setDeleteMoveTo}
                placeholder="Escolha a etapa de destino"
                options={columns
                  .filter((column) => column.id !== deleteColumnId)
                  .map((column) => ({ value: column.id, label: column.name }))}
              />
            </div>
          ) : null}

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className={secondaryButtonClass}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteBlockedMessage !== null && !deleteMoveTo}
              onClick={(event) => {
                // Impede o Radix de fechar antes da resposta: o 409 precisa
                // reabrir o dialogo em modo "escolha o destino".
                event.preventDefault();
                void confirmDeleteColumn();
              }}
              className="rounded-full border-2 border-slate-900 bg-rose-600 px-4 py-2 text-sm font-black text-white shadow-[2px_2px_0_#0f172a] disabled:opacity-50"
            >
              {deleteBlockedMessage ? "Mover e excluir" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
