import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type ScreenReaderInstructions,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

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
import { AdminApiError } from "@/lib/adminApi";
import { useAuth } from "@/contexts/AuthContext";
import {
  createColumn as apiCreateColumn,
  createTask as apiCreateTask,
  deleteColumn as apiDeleteColumn,
  moveTask as apiMoveTask,
  patchColumn as apiPatchColumn,
  patchTask as apiPatchTask,
  reorderColumns as apiReorderColumns,
} from "@/services/adminTasksService";

import { BoardColumn } from "./BoardColumn";
import { BoardManagerDialog } from "./BoardManagerDialog";
import { BoardToolbar } from "./BoardToolbar";
import { TaskListView } from "./TaskListView";
import { PromptDialog } from "./PromptDialog";
import { LAYER_DIALOG, LAYER_IN_DIALOG } from "./taskLayers";
import { resolveBoardDrop } from "./resolveBoardDrop";
import {
  resolveColumnOrder,
  resolveDropTarget,
  type BoardOrder,
} from "./resolveDropTarget";
import {
  EMPTY_FILTERS,
  buildGroups,
  hasActiveFilters,
  matchesFilters,
  type GroupBy,
  type TaskFilters,
} from "./taskFilters";
import {
  DEFAULT_VIEW_STATE,
  readViewState,
  writeViewState,
  type TaskViewState,
} from "./taskViewState";
import { DRAG_ACTIVATION_DISTANCE, TaskCardBody } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { TasksPanelSkeleton } from "./TasksPanelSkeleton";
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
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  // Busca, filtros, agrupamento, visao e arquivadas vivem na URL, sem estado
  // espelhado, exatamente como o `?section=` da pagina e o `?task=` da Fase 2.
  // Isso da F5, voltar/avancar e link compartilhavel de graca.
  const viewState = useMemo(() => readViewState(search), [search]);
  const { filters, groupBy, view, includeArchived } = viewState;

  const {
    boards,
    snapshot,
    loading,
    error,
    refresh,
    reloadBoards,
    addBoard,
    applyLocal,
  } = useBoardSnapshot(boardId, includeArchived);

  const [pendingTaskIds, setPendingTaskIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState<string | null>(
    null,
  );
  const [deleteMoveTo, setDeleteMoveTo] = useState<string>("");
  const [newColumnOpen, setNewColumnOpen] = useState(false);
  const [wipDialogColumnId, setWipDialogColumnId] = useState<string | null>(null);
  const [boardManagerOpen, setBoardManagerOpen] = useState(false);

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

  // Estado do arrasto em curso. `draggingRef` existe alem do state porque o
  // guardedRefresh e chamado de dentro de callbacks assincronos, onde ler o
  // state daria o valor congelado do render em que a promessa comecou.
  const [activeDrag, setActiveDrag] = useState<
    { id: string; type: "task" | "column" } | null
  >(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const draggingRef = useRef(false);
  const missedRefreshRef = useRef(false);

  /**
   * Refresh que NAO reordena o board debaixo do dedo.
   *
   * Uma resposta de move que chega durante um arrasto reescreveria as posicoes
   * de todos os cards, e o card que esta sendo arrastado saltaria de lugar no
   * meio do gesto. Aqui o refresh fica pendente e roda quando o arrasto termina.
   */
  const guardedRefresh = useCallback(async () => {
    if (draggingRef.current) {
      missedRefreshRef.current = true;
      return;
    }
    await refresh();
  }, [refresh]);

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

  const setViewState = useCallback(
    (patch: Partial<TaskViewState>) => {
      const next = { ...readViewState(searchRef.current), ...patch };
      setLocation(`/admin${writeViewState(searchRef.current, next)}`);
    },
    [setLocation],
  );

  const setFilters = useCallback(
    (next: TaskFilters) => setViewState({ filters: next }),
    [setViewState],
  );
  const clearFilters = useCallback(
    () => setViewState({ filters: EMPTY_FILTERS }),
    [setViewState],
  );
  const setGroupBy = useCallback(
    (next: GroupBy) => setViewState({ groupBy: next }),
    [setViewState],
  );

  /** Aplica um patch no card do board sem refetch do snapshot inteiro. */
  const patchCard = useCallback(
    (id: string, patch: Partial<TaskCardData>) => {
      applyLocal((snap) => withTask(snap, id, (item) => ({ ...item, ...patch })));
    },
    [applyLocal],
  );

  const removeCard = useCallback(
    (id: string) => {
      applyLocal((snap) => ({
        ...snap,
        tasks: snap.tasks.filter((task) => task.id !== id),
      }));
    },
    [applyLocal],
  );


  // -------------------------------------------------------------------------
  // Derivados
  // -------------------------------------------------------------------------

  const columns = useMemo(
    () => (snapshot ? [...snapshot.columns].sort((a, b) => a.position - b.position) : []),
    [snapshot],
  );

  const allTasks = useMemo(() => snapshot?.tasks ?? [], [snapshot]);

  // Relogio capturado uma vez: filtro de data estavel enquanto a tela vive, e
  // testavel.
  const [nowMs] = useState(() => Date.now());

  const filtersActive = hasActiveFilters(filters);

  const visibleTasks = useMemo(
    () =>
      filtersActive
        ? allTasks.filter((task) =>
            matchesFilters(task, filters, { nowMs, currentUserId }),
          )
        : allTasks,
    [allTasks, currentUserId, filters, filtersActive, nowMs],
  );

  const groups = useMemo(
    () =>
      buildGroups(
        visibleTasks,
        allTasks,
        groupBy,
        columns,
        snapshot?.admins ?? [],
      ),
    [allTasks, columns, groupBy, snapshot?.admins, visibleTasks],
  );

  const tasksByColumn = useMemo(() => {
    const grouped = new Map<string, TaskCardData[]>();
    for (const column of columns) grouped.set(column.id, []);
    for (const task of allTasks) {
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
  }, [allTasks, columns]);

  const labelsById = useMemo(
    () => new Map((snapshot?.labels ?? []).map((label) => [label.id, label])),
    [snapshot?.labels],
  );
  const assigneesById = useMemo(
    () => new Map((snapshot?.admins ?? []).map((admin) => [admin.user_id, admin])),
    [snapshot?.admins],
  );

  /**
   * Ordem visual COMPLETA (sem filtro) no formato do resolveDropTarget.
   *
   * De propósito nao e a lista visivel: com filtro ligado, calcular vizinhos
   * sobre o que esta na tela produz um ponto medio arbitrario em relacao aos
   * cards OCULTOS entre eles. Visualmente correto, ordenacao real indefinida, e
   * ninguem percebe ate limpar o filtro. Por isso a reordenacao dentro da coluna
   * fica DESABILITADA com filtro ativo (ver canReorder e handleDragEnd), e esta
   * ordem segue completa para o caso sem filtro.
   */
  const boardOrder = useMemo<BoardOrder>(
    () => ({
      columns: columns.map((column) => ({
        id: column.id,
        taskIds: (tasksByColumn.get(column.id) ?? []).map((task) => task.id),
      })),
    }),
    [columns, tasksByColumn],
  );
  // Ref espelhando a ordem: os handlers de drag precisam do valor ATUAL sem
  // entrar na lista de dependencias deles, que e o que os mantem estaveis.
  const boardOrderRef = useRef<BoardOrder>(boardOrder);
  boardOrderRef.current = boardOrder;
  // Mesmo motivo: os handlers de drag precisam do valor atual sem virar
  // dependencia e perder a identidade estavel.
  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  const groupByRef = useRef(groupBy);
  groupByRef.current = groupBy;
  const filtersActiveRef = useRef(filtersActive);
  filtersActiveRef.current = filtersActive;

  /** Ids dos containers para o SortableContext horizontal. Referencia estavel. */
  const columnIds = useMemo(() => groups.map((group) => group.id), [groups]);

  /**
   * Reordenar DENTRO de um container so tem significado quando a lista mostrada
   * e a ordenacao real: agrupada por etapa E sem filtro. Fora disso, `position`
   * nao descreve o que esta na tela, e um ponto medio calculado entre dois
   * vizinhos visiveis cai em lugar arbitrario em relacao ao que esta escondido.
   */
  const canReorder = groupBy === "column" && !filtersActive;

  const columnById = useMemo(
    () => new Map(columns.map((column) => [column.id, column])),
    [columns],
  );
  const columnIndexOf = useCallback(
    (columnId: string) => columns.findIndex((column) => column.id === columnId),
    [columns],
  );

  const activeDragTask = useMemo(
    () =>
      activeDrag?.type === "task"
        ? (snapshot?.tasks.find((task) => task.id === activeDrag.id) ?? null)
        : null,
    [activeDrag, snapshot],
  );

  // -------------------------------------------------------------------------
  // Mover tarefa: CAMINHO UNICO
  // -------------------------------------------------------------------------
  // Setas de avanco rapido e drag and drop entram os dois aqui. Nao existe rota
  // paralela para o arrasto de proposito: dois caminhos com a mesma
  // responsabilidade divergem no primeiro conserto que so um dos dois recebe.
  // As setas passam (null, null), que significa "fim da coluna de destino"; o
  // arrasto passa os vizinhos que resolveDropTarget apurou.

  /**
   * Posicao provisoria so para a tela, entre os vizinhos. O numero definitivo
   * vem do server (server/lib/adminTaskPosition.ts) na resposta; esta conta
   * existe para o card nao piscar entre o solte e a resposta.
   */
  function optimisticPosition(
    before: number | null,
    after: number | null,
  ): number {
    if (before === null && after === null) return 1000;
    if (before === null) return after! - 1000;
    if (after === null) return before + 1000;
    return (before + after) / 2;
  }

  const moveTaskTo = useCallback(
    async (
      taskId: string,
      columnId: string,
      beforeTaskId: string | null,
      afterTaskId: string | null,
    ) => {
      const current = snapshotRef.current;
      if (!current) return;
      const task = current.tasks.find((item) => item.id === taskId);
      if (!task || task.id.startsWith(TEMP_ID_PREFIX)) return;

      const previousColumnId = task.column_id;
      const previousPosition = task.position;
      const seq = (moveSeqRef.current.get(taskId) ?? 0) + 1;
      moveSeqRef.current.set(taskId, seq);

      const positionOf = (id: string | null) =>
        id === null
          ? null
          : (current.tasks.find((item) => item.id === id)?.position ?? null);
      const targetPosition =
        beforeTaskId === null && afterTaskId === null
          ? // Sem vizinho declarado = fim da coluna, que e o que o server faz.
            Math.max(
              0,
              ...current.tasks
                .filter((item) => item.column_id === columnId)
                .map((item) => item.position),
            ) + 1000
          : optimisticPosition(positionOf(beforeTaskId), positionOf(afterTaskId));

      applyLocal((snap) =>
        withTask(snap, taskId, (item) => ({
          ...item,
          column_id: columnId,
          position: targetPosition,
        })),
      );
      markPending(taskId, true);

      try {
        const moved = await apiMoveTask(taskId, {
          column_id: columnId,
          before_task_id: beforeTaskId,
          after_task_id: afterTaskId,
        });
        // A guarda de sequencia vale no SUCESSO tambem, nao so no erro: se um
        // segundo move ja partiu, aplicar a resposta do primeiro puxaria o card
        // de volta para a coluna intermediaria. O erro e mais obvio de imaginar,
        // mas os dois caminhos escrevem no mesmo lugar.
        if (moveSeqRef.current.get(taskId) !== seq) return;
        // Resposta autoritativa (position e completed_at vem do server).
        applyLocal((snap) =>
          withTask(snap, taskId, (item) => ({ ...item, ...moved })),
        );
        await guardedRefresh();
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
    [applyLocal, guardedRefresh, markPending],
  );

  const handleQuickMove = useCallback(
    (taskId: string, direction: -1 | 1) => {
      const current = snapshotRef.current;
      if (!current) return;
      const task = current.tasks.find((item) => item.id === taskId);
      if (!task) return;
      const ordered = [...current.columns].sort((a, b) => a.position - b.position);
      const index = ordered.findIndex((column) => column.id === task.column_id);
      const target = ordered[index + direction];
      if (!target) return;
      // (null, null) = fim da coluna de destino.
      void moveTaskTo(taskId, target.id, null, null);
    },
    [moveTaskTo],
  );

  /**
   * Movimentacao disparada pelo select de Etapa do modal. Passa pela MESMA
   * moveTaskTo do drag e das setas, com o mesmo contador de sequencia: nao ha
   * terceiro caminho de movimentacao no modulo.
   */
  const moveFromModal = useCallback(
    (id: string, columnId: string) => {
      void moveTaskTo(id, columnId, null, null);
    },
    [moveTaskTo],
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
        await guardedRefresh();
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
    [applyLocal, guardedRefresh],
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
        await guardedRefresh();
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
    [applyLocal, guardedRefresh],
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

  const handleRequestWipLimit = useCallback((columnId: string) => {
    setWipDialogColumnId(columnId);
  }, []);

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
          await guardedRefresh();
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
    [applyLocal, guardedRefresh],
  );

  const handleCreateColumn = useCallback((name: string) => {
    const current = snapshotRef.current;
    if (!current) return;
    void (async () => {
      try {
        await apiCreateColumn({ board_id: current.board.id, name });
        await guardedRefresh();
        toast.success("Etapa criada.");
      } catch (mutationError) {
        toast.error(
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao criar a etapa.",
        );
      }
    })();
  }, [guardedRefresh]);

  /**
   * Patch otimista de UMA propriedade da tarefa, usado pelo arrasto quando o
   * agrupamento nao e por etapa. Reaproveita o mesmo rollback por tarefa do
   * moveTaskTo em vez de inventar outro caminho.
   */
  const patchTaskProperty = useCallback(
    async (taskId: string, patch: Partial<TaskCardData>) => {
      const current = snapshotRef.current;
      const previous = current?.tasks.find((item) => item.id === taskId);
      if (!previous) return;

      applyLocal((snap) => withTask(snap, taskId, (item) => ({ ...item, ...patch })));
      markPending(taskId, true);
      try {
        const updated = await apiPatchTask(taskId, patch);
        applyLocal((snap) => withTask(snap, taskId, (item) => ({ ...item, ...updated })));
        await guardedRefresh();
      } catch (mutationError) {
        applyLocal((snap) => withTask(snap, taskId, () => previous));
        toast.error(
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao atualizar a tarefa.",
        );
      } finally {
        markPending(taskId, false);
      }
    },
    [applyLocal, guardedRefresh, markPending],
  );

  const handleUnarchive = useCallback(
    (taskId: string) => {
      void patchTaskProperty(taskId, { archived_at: null } as Partial<TaskCardData>);
    },
    [patchTaskProperty],
  );

  // -------------------------------------------------------------------------
  // Atalhos de teclado
  // -------------------------------------------------------------------------
  // `N` cria tarefa, `/` foca a busca. Nenhum dispara com o foco dentro de campo
  // de texto: digitar "novo" na busca nao pode abrir um composer a cada `n`.

  const searchInputRef = useRef<HTMLInputElement>(null);
  const composerTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      // Com o modal aberto os atalhos do board ficam fora de cena: quem manda no
      // teclado ali e o modal (Esc, setas).
      if (readTaskParam(searchRef.current)) return;

      if (event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        composerTriggerRef.current?.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // -------------------------------------------------------------------------
  // Drag and drop
  // -------------------------------------------------------------------------

  const sensors = useSensors(
    // Distancia de ativacao: sem ela TODO clique vira arrasto e o card nunca
    // abre. O mesmo numero e usado no TaskCard para separar clique de arrasto no
    // pointerup, e os dois precisam continuar iguais.
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE },
    }),
    // No toque a ativacao e por TEMPO, nao por distancia: com distancia, deslizar
    // o dedo para rolar a coluna arrancaria o card. Com 220ms de pressao e 6px de
    // tolerancia, rolar na vertical, rolar o board na horizontal e arrastar um
    // card convivem no mesmo dedo. Foi o ajuste mais sensivel da fase.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    draggingRef.current = true;
    setActiveDrag({
      id: String(event.active.id),
      type: event.active.data.current?.type === "column" ? "column" : "task",
    });
  }, []);

  const finishDrag = useCallback(() => {
    draggingRef.current = false;
    setActiveDrag(null);
    setOverColumnId(null);
    // Refresh que foi adiado porque chegou no meio do gesto.
    if (missedRefreshRef.current) {
      missedRefreshRef.current = false;
      void refresh();
    }
  }, [refresh]);

  const handleDragOver = useCallback((event: DragEndEvent) => {
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) {
      setOverColumnId(null);
      return;
    }
    const order = boardOrderRef.current;
    const asColumn = order.columns.find((column) => column.id === overId);
    const owning = order.columns.find((column) => column.taskIds.includes(overId));
    setOverColumnId(asColumn?.id ?? owning?.id ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeId = String(event.active.id);
      const overId = event.over ? String(event.over.id) : null;
      const isColumn = event.active.data.current?.type === "column";
      const order = boardOrderRef.current;
      const board = snapshotRef.current;

      // Encerra o gesto ANTES de disparar a mutacao: a partir daqui o refresh
      // volta a ser imediato, e nao ha mais nada debaixo do dedo.
      finishDrag();
      if (!board) return;

      if (isColumn) {
        // O alvo pode ser um card; nesse caso vale a coluna dona dele.
        const overColumn = overId
          ? (order.columns.find((column) => column.id === overId)?.id ??
            order.columns.find((column) => column.taskIds.includes(overId))?.id ??
            null)
          : null;
        const ids = resolveColumnOrder(order, activeId, overColumn);
        if (!ids) return;

        const previousColumns = board.columns;
        const byId = new Map(board.columns.map((column) => [column.id, column]));
        applyLocal((snap) => ({
          ...snap,
          columns: ids.map((id, index) => ({
            ...byId.get(id)!,
            position: (index + 1) * 1000,
          })),
        }));
        void (async () => {
          try {
            // Lista COMPLETA: o endpoint recusa parcial com incomplete_order.
            await apiReorderColumns(board.board.id, ids);
            await guardedRefresh();
          } catch (mutationError) {
            applyLocal((snap) => ({ ...snap, columns: previousColumns }));
            toast.error(
              mutationError instanceof Error
                ? mutationError.message
                : "Erro ao reordenar as etapas.",
            );
          }
        })();
        return;
      }

      if (!overId) return;
      const task = board.tasks.find((item) => item.id === activeId);
      if (!task) return;

      // Toda a semantica do drop (agrupamento, filtro, reordenacao ambigua) mora
      // em resolveBoardDrop, funcao pura e testada. Este handler so despacha.
      const action = resolveBoardDrop(
        {
          order,
          groups: groupsRef.current,
          groupBy: groupByRef.current,
          filtersActive: filtersActiveRef.current,
          task,
        },
        overId,
      );

      if (action.kind === "none") return;
      if (action.kind === "priority") {
        void patchTaskProperty(activeId, {
          priority: action.value as TaskCardData["priority"],
        });
        return;
      }
      if (action.kind === "assignee") {
        void patchTaskProperty(activeId, { assignee_id: action.value });
        return;
      }
      void moveTaskTo(
        activeId,
        action.columnId,
        action.beforeTaskId,
        action.afterTaskId,
      );
    },
    [applyLocal, finishDrag, guardedRefresh, moveTaskTo, patchTaskProperty],
  );

  // Leitores de tela em portugues. O dnd-kit traz os textos em ingles por
  // padrao, e um board inteiro anunciado em outro idioma e pior que silencio.
  const screenReaderInstructions = useMemo<ScreenReaderInstructions>(
    () => ({
      draggable:
        "Para mover, pressione espaço ou Enter. Use as setas para escolher o destino, espaço ou Enter para soltar, e Escape para cancelar.",
    }),
    [],
  );

  const announcements = useMemo<Announcements>(() => {
    const describe = (id: string) => {
      const board = snapshotRef.current;
      if (!board) return id;
      const column = board.columns.find((item) => item.id === id);
      if (column) return `Etapa ${column.name}`;
      const task = board.tasks.find((item) => item.id === id);
      return task
        ? `Tarefa ${shortIdOf(board.board.key, task.number)}, ${task.title}`
        : id;
    };
    const placement = (activeId: string, overId: string | null) => {
      const order = boardOrderRef.current;
      const target = resolveDropTarget(order, activeId, overId);
      if (!target) return null;
      const board = snapshotRef.current;
      const column = board?.columns.find((item) => item.id === target.columnId);
      const list = order.columns.find((item) => item.id === target.columnId);
      const total = (list?.taskIds.filter((id) => id !== activeId).length ?? 0) + 1;
      const index =
        target.beforeTaskId === null
          ? 1
          : (list?.taskIds.filter((id) => id !== activeId).indexOf(target.beforeTaskId) ?? 0) + 2;
      return { columnName: column?.name ?? "", index, total };
    };

    return {
      onDragStart: ({ active }) => `${describe(String(active.id))} levantada.`,
      onDragOver: ({ active, over }) => {
        if (!over) return "Fora de qualquer etapa.";
        const spot = placement(String(active.id), String(over.id));
        return spot
          ? `${describe(String(active.id))} sobre ${spot.columnName}, posição ${spot.index} de ${spot.total}.`
          : `${describe(String(active.id))} sobre ${describe(String(over.id))}.`;
      },
      onDragEnd: ({ active, over }) => {
        if (!over) return `${describe(String(active.id))} devolvida ao lugar de origem.`;
        const spot = placement(String(active.id), String(over.id));
        return spot
          ? `${describe(String(active.id))} movida para ${spot.columnName}, posição ${spot.index} de ${spot.total}.`
          : `${describe(String(active.id))} solta em ${describe(String(over.id))}.`;
      },
      onDragCancel: ({ active }) =>
        `Movimentação de ${describe(String(active.id))} cancelada.`,
    };
  }, []);

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
      await guardedRefresh();
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
  }, [deleteColumnId, deleteMoveTo, guardedRefresh]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loading) {
    return <TasksPanelSkeleton />;
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
  const wipDialogColumn = wipDialogColumnId
    ? columns.find((column) => column.id === wipDialogColumnId)
    : undefined;

  return (
    <div className="space-y-4">
      <BoardToolbar
        ref={searchInputRef}
        boards={boards}
        activeBoardId={boardId}
        admins={snapshot.admins}
        labels={snapshot.labels}
        filters={filters}
        groupBy={groupBy}
        view={view}
        includeArchived={includeArchived}
        visibleCount={visibleTasks.length}
        totalCount={allTasks.length}
        onSelectBoard={setBoardId}
        onFiltersChange={setFilters}
        onGroupByChange={setGroupBy}
        onViewChange={(next) => setViewState({ view: next })}
        onIncludeArchivedChange={(next) => setViewState({ includeArchived: next })}
        onClearFilters={clearFilters}
        onManageBoards={() => setBoardManagerOpen(true)}
      />

      {!canReorder && groups.some((group) => group.tasks.length > 1) ? (
        <p className="text-[11px] font-semibold text-slate-500">
          {groupBy === "column"
            ? "Reordenar dentro da etapa está indisponível com filtro ativo: a lista visível não é a ordenação real. Mover entre etapas continua funcionando."
            : "Agrupado por " +
              (groupBy === "priority" ? "prioridade" : "responsável") +
              ": arrastar entre grupos altera a propriedade, e não há ordem para reordenar."}
        </p>
      ) : null}

      {/* Zero etapas e verificado ANTES da visao: um quadro sem etapa nao tem o
          que listar, e na visao em lista nao havia saida nenhuma (a pessoa via
          "nenhuma tarefa" e nao tinha como criar a primeira etapa). Este e o
          unico caminho para fora do estado vazio, incluindo o caso raro do seed
          de um quadro novo ter falhado. */}
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
            onClick={() => setNewColumnOpen(true)}
            className={`${primaryButtonClass} mt-4`}
          >
            Criar primeira etapa
          </button>
        </div>
      ) : view === "lista" ? (
        <TaskListView
          groups={groups}
          boardKey={snapshot.board.key}
          labelsById={labelsById}
          assigneesById={assigneesById}
          columnCount={columns.length}
          columnIndexOf={columnIndexOf}
          selectedTaskId={selectedTaskId}
          filtersActive={filtersActive}
          onOpenTask={openTask}
          onQuickMove={handleQuickMove}
          onUnarchive={handleUnarchive}
          onClearFilters={clearFilters}
        />
      ) : (
        <DndContext
          sensors={sensors}
          // closestCorners lida melhor que closestCenter com listas verticais de
          // alturas diferentes, que e exatamente o caso de cards de tamanhos
          // variados dentro da coluna.
          collisionDetection={closestCorners}
          accessibility={{ announcements, screenReaderInstructions }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={finishDrag}
        >
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 sm:snap-none">
              {groups.map((group, index) => (
                <BoardColumn
                  key={group.id}
                  group={group}
                  column={columnById.get(group.id) ?? null}
                  boardKey={snapshot.board.key}
                  labelsById={labelsById}
                  assigneesById={assigneesById}
                  canMoveLeft={index > 0}
                  canMoveRight={index < groups.length - 1}
                  selectedTaskId={selectedTaskId}
                  pendingTaskIds={pendingTaskIds}
                  isDropTarget={
                    activeDrag?.type === "task" && overColumnId === group.id
                  }
                  canReorder={canReorder}
                  filtersActive={filtersActive}
                  onOpenTask={openTask}
                  onQuickMove={handleQuickMove}
                  onUnarchive={handleUnarchive}
                  onCreateTask={handleCreateTask}
                  onRenameColumn={handleRenameColumn}
                  onRecolorColumn={handleRecolorColumn}
                  onRequestWipLimit={handleRequestWipLimit}
                  onMoveColumn={handleMoveColumn}
                  onRequestDeleteColumn={handleRequestDeleteColumn}
                  onClearFilters={clearFilters}
                />
              ))}

              {groupBy === "column" ? (
                <div className="flex w-[85vw] shrink-0 snap-start items-start sm:w-[13rem]">
                  <button
                    type="button"
                    onClick={() => setNewColumnOpen(true)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-3xl border-2 border-dashed border-slate-400 bg-white/60 px-4 py-6 text-sm font-black text-slate-600 transition-colors hover:border-slate-900 hover:bg-white hover:text-slate-900"
                  >
                    <Plus className="h-4 w-4" />
                    Nova etapa
                  </button>
                </div>
              ) : null}
            </div>
          </SortableContext>

          {/* Card levantado: mesma borda e sombra do board, com rotacao leve e
              sombra mais funda para ler como "fora do plano". */}
          <DragOverlay dropAnimation={null}>
            {activeDragTask ? (
              <article className="w-[19rem] rotate-3 cursor-grabbing rounded-2xl border-2 border-slate-900 bg-white p-3 shadow-[8px_8px_0_#0f172a]">
                <span className="font-mono text-[11px] font-bold text-slate-500">
                  {shortIdOf(snapshot.board.key, activeDragTask.number)}
                </span>
                <TaskCardBody
                  task={activeDragTask}
                  boardKey={snapshot.board.key}
                  labelsById={labelsById}
                  assigneesById={assigneesById}
                />
              </article>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Alvo do atalho `N`. Invisivel: o composer de verdade vive em cada
          coluna, e este botao so encaminha para o da primeira etapa. */}
      <button
        ref={composerTriggerRef}
        type="button"
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onClick={() => {
          const first = columns[0];
          if (!first) return;
          const composer = document.querySelector<HTMLButtonElement>(
            `[data-composer-for="${first.id}"]`,
          );
          composer?.click();
        }}
      />

      {selectedTaskId ? (
        <TaskModal
          // key por tarefa: trocar de card com as setas remonta o modal com
          // estado limpo, em vez de carregar rascunho da tarefa anterior.
          key={selectedTaskId}
          taskId={selectedTaskId}
          boardKey={snapshot.board.key}
          columns={columns}
          admins={snapshot.admins}
          labels={snapshot.labels}
          siblingsInColumn={
            tasksByColumn.get(
              snapshot.tasks.find((task) => task.id === selectedTaskId)?.column_id ??
                "",
            ) ?? []
          }
          onClose={closeTask}
          onOpenTask={openTask}
          onMoveTask={moveFromModal}
          onPatchCard={patchCard}
          onRemoveCard={removeCard}
          onBoardChanged={() => void refresh()}
        />
      ) : null}

      <BoardManagerDialog
        open={boardManagerOpen}
        boards={boards}
        onOpenChange={setBoardManagerOpen}
        onChanged={() => void reloadBoards()}
        onCreated={(board) => {
          addBoard(board);
          setBoardId(board.id);
        }}
        onDeleted={(id) => {
          // Se o quadro excluido era o ativo, sai dele: continuar apontando para
          // um id que nao existe mais deixaria a tela em erro permanente.
          if (boardId === id) setBoardId(null);
        }}
      />

      <PromptDialog
        open={newColumnOpen}
        title="Nova etapa"
        description="A etapa entra no fim do quadro e pode ser reordenada depois."
        label="Nome da etapa"
        placeholder="Ex: Em Revisão"
        confirmLabel="Criar etapa"
        validate={(value) =>
          value.length === 0
            ? "Informe um nome."
            : value.length > 60
              ? "Nome muito longo (máx. 60)."
              : null
        }
        onConfirm={handleCreateColumn}
        onOpenChange={setNewColumnOpen}
      />

      <PromptDialog
        open={wipDialogColumnId !== null}
        title="Limite de trabalho em progresso"
        description="Deixe vazio para remover o limite. O limite é um aviso visual: mover uma tarefa para uma etapa cheia continua permitido."
        label={`Limite da etapa ${wipDialogColumn?.name ?? ""}`}
        placeholder="Sem limite"
        initialValue={
          wipDialogColumn?.wip_limit === null ||
          wipDialogColumn?.wip_limit === undefined
            ? ""
            : String(wipDialogColumn.wip_limit)
        }
        validate={(value) => {
          if (value === "") return null;
          const parsed = Number(value);
          return Number.isInteger(parsed) && parsed > 0
            ? null
            : "Informe um número inteiro maior que zero.";
        }}
        onConfirm={(value) => {
          if (wipDialogColumnId) {
            handleSetWipLimit(
              wipDialogColumnId,
              value === "" ? null : Number(value),
            );
          }
        }}
        onOpenChange={(open) => {
          if (!open) setWipDialogColumnId(null);
        }}
      />

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
        <AlertDialogContent overlayClassName={LAYER_DIALOG} className={`${LAYER_DIALOG} rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a]`}>
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
                // Select DENTRO do AlertDialog: precisa subir acima dele.
                contentClassName={LAYER_IN_DIALOG}
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

// Default export para o lazyWithRetry do Admin.tsx (ele espera { default }).
// A named export continua, porque os testes importam por nome.
export default TasksDashboard;
