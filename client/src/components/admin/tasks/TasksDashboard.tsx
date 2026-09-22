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
import { TaskModal } from "./TaskModal";
import { isTaskMoveDestination } from "./taskMoveDestinations";
import { BoardColumnsSkeleton, TasksPanelSkeleton } from "./TasksPanelSkeleton";
import {
  boardRowClass,
  boardScrollClass,
  emptyBlockClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./taskBoardStyles";
import {
  parseShortId,
  readTaskParam,
  shortIdOf,
  withTaskParam,
} from "./taskDeepLink";
import type {
  TaskBoardSnapshot,
  TaskCard as TaskCardData,
  TaskColumn,
} from "./types";
import { useBoardSnapshot } from "./useBoardSnapshot";

// Aba Tarefas: board Kanban interno. Este componente e o DONO do estado e de
// toda mutacao; os filhos (BoardColumn, TaskCard, ColumnHeader, NewTaskComposer)
// sao memo e so recebem dados e handlers estaveis.
//
// Update otimista no formato do antigo moveBug (BugsDashboard, removido na Fase 5): snapshot do estado
// anterior, muta local, await, rollback + toast no erro, refresh como fonte de
// verdade no sucesso. Duas diferencas obrigatorias aqui:
//
//   1. o rollback e POR TAREFA, nao do board inteiro. Restaurar o snapshot
//      completo desfaria movimentos posteriores que ja gravaram;
//   2. cada tarefa fica bloqueada enquanto a gravação está pendente. Um duplo
//      toque não pode criar duas transições para a mesma tarefa.

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
    trocandoDeBoard,
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
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState<
    string | null
  >(null);
  const [deleteMoveTo, setDeleteMoveTo] = useState<string>("");
  const [newColumnOpen, setNewColumnOpen] = useState(false);
  const [wipDialogColumnId, setWipDialogColumnId] = useState<string | null>(
    null,
  );
  const [boardManagerOpen, setBoardManagerOpen] = useState(false);

  // Refs para handlers ESTAVEIS: sem isto, todo useCallback dependeria de
  // `snapshot`/`search` e mudaria de identidade a cada render, o que anularia o
  // memo dos filhos exatamente na hora em que ele importa.
  const snapshotRef = useRef<TaskBoardSnapshot | null>(null);
  snapshotRef.current = snapshot;
  const searchRef = useRef(search);
  searchRef.current = search;
  const moveSeqRef = useRef(new Map<string, number>());
  const pendingMoveRef = useRef(new Set<string>());
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  // Contador SEPARADO do de movimentacao: ver patchTaskProperty.
  const patchSeqRef = useRef(new Map<string, number>());
  const tempCounter = useRef(0);

  // Quadro ativo: `?board=<slug>` quando existir, senao o primeiro.
  //
  // O parametro nasceu para o redirect de `?section=bugs` ter um DESTINO REAL:
  // sem ele o link dos e-mails ja enviados cairia no primeiro quadro por
  // posicao, que nao e o de bugs. De quebra, torna qualquer quadro linkavel.
  //
  // FALLBACK EXPLICITO: slug que nao resolve (quadro renomeado, arquivado ou
  // excluido) cai no primeiro em vez de deixar a tela sem quadro. O redirect
  // nao pode presumir que o quadro BUG existe, e este e o tratamento.
  useEffect(() => {
    if (boardId || boards.length === 0) return;
    const slug = new URLSearchParams(window.location.search).get("board");
    const alvo = slug ? boards.find((b) => b.slug === slug) : undefined;
    setBoardId((alvo ?? boards[0]).id);
  }, [boardId, boards]);

  const markPending = useCallback((taskId: string, pending: boolean) => {
    setPendingTaskIds((current) => {
      const next = new Set(current);
      if (pending) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  }, []);

  const guardedRefresh = refresh;

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
    return (
      snapshot.tasks.find((task) => task.number === parsed.number)?.id ?? null
    );
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
      applyLocal((snap) =>
        withTask(snap, id, (item) => ({ ...item, ...patch })),
      );
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
    () =>
      snapshot
        ? [...snapshot.columns].sort((a, b) => a.position - b.position)
        : [],
    [snapshot],
  );

  const allTasks = useMemo(() => snapshot?.tasks ?? [], [snapshot]);

  // Relogio capturado uma vez: filtro de data estavel enquanto a tela vive, e
  // testavel.
  const [nowMs] = useState(() => Date.now());

  const filtersActive = hasActiveFilters(filters);

  // Etapas alimentadas pelo feed, usadas no quadro e na lista de destinos.

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
        (a, b) =>
          a.position - b.position || a.created_at.localeCompare(b.created_at),
      );
    });
    return grouped;
  }, [allTasks, columns]);

  const labelsById = useMemo(
    () => new Map((snapshot?.labels ?? []).map((label) => [label.id, label])),
    [snapshot?.labels],
  );
  const assigneesById = useMemo(
    () =>
      new Map((snapshot?.admins ?? []).map((admin) => [admin.user_id, admin])),
    [snapshot?.admins],
  );

  const columnById = useMemo(
    () => new Map(columns.map((column) => [column.id, column])),
    [columns],
  );
  // -------------------------------------------------------------------------
  // Mover tarefa: CAMINHO UNICO
  // -------------------------------------------------------------------------
  // O seletor no card, a lista e o modal usam a mesma mutação.
  // (null, null) significa fim da coluna de destino.

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

  const focusTaskAction = useCallback((taskId: string) => {
    if (typeof requestAnimationFrame !== "function") return;
    requestAnimationFrame(() => {
      // A movimentação tira o card da coluna antiga e pode recriar seu DOM.
      // Esperar o commit seguinte evita focar o seletor que logo será removido.
      requestAnimationFrame(() => {
        if (!mountedRef.current || document.querySelector('[role="dialog"]'))
          return;
        const card = Array.from(
          document.querySelectorAll<HTMLElement>("[data-task-id]"),
        ).find((item) => item.dataset.taskId === taskId);
        // A ação que iniciou a mudança é o seletor. `querySelector("select,
        // button")` escolheria o primeiro elemento no DOM, que é "Abrir".
        (
          card?.querySelector<HTMLElement>("select") ??
          card?.querySelector<HTMLElement>("button")
        )?.focus();
      });
    });
  }, []);

  const moveTaskTo = useCallback(
    async (
      taskId: string,
      columnId: string,
      beforeTaskId: string | null,
      afterTaskId: string | null,
    ) => {
      const current = snapshotRef.current;
      if (!current) return false;
      const task = current.tasks.find((item) => item.id === taskId);
      if (
        !task ||
        task.id.startsWith(TEMP_ID_PREFIX) ||
        task.column_id === columnId ||
        !current.columns.some(
          (column) =>
            column.id === columnId &&
            isTaskMoveDestination(column, task.column_id),
        ) ||
        pendingMoveRef.current.has(taskId)
      )
        return false;
      pendingMoveRef.current.add(taskId);

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
          : optimisticPosition(
              positionOf(beforeTaskId),
              positionOf(afterTaskId),
            );

      applyLocal((snap) =>
        withTask(snap, taskId, (item) => ({
          ...item,
          column_id: columnId,
          position: targetPosition,
        })),
      );
      markPending(taskId, true);
      focusTaskAction(taskId);

      try {
        const moved = await apiMoveTask(taskId, {
          column_id: columnId,
          before_task_id: beforeTaskId,
          after_task_id: afterTaskId,
        });
        if (!mountedRef.current) return false;
        // A guarda de sequencia vale no SUCESSO tambem, nao so no erro: se um
        // segundo move ja partiu, aplicar a resposta do primeiro puxaria o card
        // de volta para a coluna intermediaria. O erro e mais obvio de imaginar,
        // mas os dois caminhos escrevem no mesmo lugar.
        if (moveSeqRef.current.get(taskId) !== seq) return false;
        // Resposta autoritativa (position e completed_at vem do server).
        applyLocal((snap) =>
          withTask(snap, taskId, (item) => ({ ...item, ...moved })),
        );
        try {
          await guardedRefresh();
        } catch {
          if (!mountedRef.current) return false;
          // A gravação já foi confirmada; uma falha na releitura não desfaz a
          // transição persistida.
          toast.warning("Tarefa movida, mas a atualização do quadro falhou.");
        }
        if (!mountedRef.current) return false;
        toast.success(
          `Tarefa movida para ${current.columns.find((column) => column.id === columnId)?.name ?? "a etapa selecionada"}.`,
        );
        focusTaskAction(taskId);
        return true;
      } catch (mutationError) {
        if (!mountedRef.current) return false;
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
          focusTaskAction(taskId);
        }
        return false;
      } finally {
        // So o ultimo movimento limpa o sinal: senao o primeiro a terminar
        // apagaria o "em andamento" de um segundo que ainda esta no ar.
        pendingMoveRef.current.delete(taskId);
        if (mountedRef.current && moveSeqRef.current.get(taskId) === seq)
          markPending(taskId, false);
      }
    },
    [applyLocal, focusTaskAction, guardedRefresh, markPending],
  );

  const handleMoveTask = useCallback(
    (taskId: string, columnId: string) => {
      void moveTaskTo(taskId, columnId, null, null);
    },
    [moveTaskTo],
  );

  /**
   * Movimentacao disparada pelo select de Etapa do modal. Passa pela MESMA
   * moveTaskTo do card e da lista, com a mesma trava de gravação.
   */
  const moveFromModal = useCallback(
    (id: string, columnId: string) => moveTaskTo(id, columnId, null, null),
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
        // Card criado pela tela e sempre humano e sem vinculo com o Sentry. O
        // otimista precisa dizer isso desde o primeiro render, senao o selo de
        // origem pisca "Sentry" ate a resposta chegar.
        source: "human",
        sentry_issue_id: null,
        sentry_issue_url: null,
        sentry_reopen_event_at: null,
        archived_source: null,
        sentry_detalhe_incompleto: false,
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
          after_task_id:
            placement === "top" ? (columnTasks[0]?.id ?? null) : null,
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
    async (
      columnId: string,
      patch: Partial<TaskColumn>,
      errorLabel: string,
    ) => {
      const current = snapshotRef.current;
      const previous = current?.columns.find(
        (column) => column.id === columnId,
      );
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
      void patchColumnOptimistic(
        columnId,
        { name },
        "Erro ao renomear a etapa.",
      );
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
      const ordered = [...current.columns].sort(
        (a, b) => a.position - b.position,
      );
      const index = ordered.findIndex((column) => column.id === columnId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ordered.length) return;

      const reordered = [...ordered];
      [reordered[index], reordered[target]] = [
        reordered[target],
        reordered[index],
      ];
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

  const handleCreateColumn = useCallback(
    (name: string) => {
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
    },
    [guardedRefresh],
  );

  /**
   * Patch otimista de UMA propriedade da tarefa, usado na edicao quando o
   * agrupamento nao e por etapa. Reaproveita o mesmo rollback por tarefa do
   * moveTaskTo em vez de inventar outro caminho.
   */
  const patchTaskProperty = useCallback(
    async (taskId: string, patch: Partial<TaskCardData>) => {
      const current = snapshotRef.current;
      const previous = current?.tasks.find((item) => item.id === taskId);
      if (!previous) return;

      // Guarda SO os campos que esta operacao mexe. Guardar o objeto inteiro
      // fazia o rollback devolver tambem `column_id`, desfazendo na tela um move
      // que o servidor ja tinha gravado.
      const camposAnteriores = Object.fromEntries(
        Object.keys(patch).map((campo) => [
          campo,
          previous[campo as keyof TaskCardData],
        ]),
      ) as Partial<TaskCardData>;

      // Contador PROPRIO desta operacao, separado do de movimentacao: move e
      // patch escrevem campos diferentes da mesma tarefa e nao sao obsoletos um
      // em relacao ao outro. Um contador so cancelaria um pelo outro, que e o
      // mesmo defeito, de cabeca para baixo.
      const seq = (patchSeqRef.current.get(taskId) ?? 0) + 1;
      patchSeqRef.current.set(taskId, seq);

      applyLocal((snap) =>
        withTask(snap, taskId, (item) => ({ ...item, ...patch })),
      );
      markPending(taskId, true);
      try {
        const updated = await apiPatchTask(taskId, patch);
        if (patchSeqRef.current.get(taskId) !== seq) return;
        // Aplica SO os campos desta operacao. A resposta traz a tarefa inteira
        // como ela estava quando o patch partiu, e a coluna dali pode ja estar
        // velha se um move aconteceu no meio.
        const aplicados = Object.fromEntries(
          Object.keys(patch).map((campo) => [
            campo,
            updated[campo as keyof typeof updated],
          ]),
        ) as Partial<TaskCardData>;
        applyLocal((snap) =>
          withTask(snap, taskId, (item) => ({ ...item, ...aplicados })),
        );
        await guardedRefresh();
      } catch (mutationError) {
        if (patchSeqRef.current.get(taskId) !== seq) return;
        applyLocal((snap) =>
          withTask(snap, taskId, (item) => ({ ...item, ...camposAnteriores })),
        );
        toast.error(
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao atualizar a tarefa.",
        );
      } finally {
        if (patchSeqRef.current.get(taskId) === seq) markPending(taskId, false);
      }
    },
    [applyLocal, guardedRefresh, markPending],
  );

  const handleUnarchive = useCallback(
    (taskId: string) => {
      void patchTaskProperty(taskId, {
        archived_at: null,
      } as Partial<TaskCardData>);
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

  // PRIMEIRO CARREGAMENTO: nao ha barra de quadros a preservar, porque nem a
  // lista de quadros chegou. Painel inteiro de esqueleto, como sempre foi.
  if (loading && !trocandoDeBoard) {
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

  // TROCA DE QUADRO: a barra FICA, porque o clique da pessoa acabou de
  // acontecer nela e sumir com ela vira flash de recarga; a area das colunas
  // vira esqueleto. O snapshot que existe aqui e o do quadro ANTIGO, e nada
  // dele pode ser renderizado, nem por um frame: o dado velho e o bug, nao a
  // decoracao. Por isso `admins`/`labels` vao VAZIOS (as opcoes de filtro sao
  // por quadro) e as contagens vao `null`, que a barra desenha como esqueleto
  // em vez de afirmar um numero que ainda nao se sabe.
  if (trocandoDeBoard) {
    return (
      <div className="space-y-4">
        <BoardToolbar
          ref={searchInputRef}
          boards={boards}
          activeBoardId={boardId}
          admins={[]}
          labels={[]}
          filters={filters}
          groupBy={groupBy}
          view={view}
          includeArchived={includeArchived}
          visibleCount={null}
          totalCount={null}
          onSelectBoard={setBoardId}
          onFiltersChange={setFilters}
          onGroupByChange={setGroupBy}
          onViewChange={(next) => setViewState({ view: next })}
          onIncludeArchivedChange={(next) =>
            setViewState({ includeArchived: next })
          }
          onClearFilters={clearFilters}
          onManageBoards={() => setBoardManagerOpen(true)}
        />
        <BoardColumnsSkeleton />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className={emptyBlockClass}>Nenhum quadro cadastrado ainda.</div>
    );
  }

  const deleteTargetColumn = deleteColumnId
    ? columns.find((column) => column.id === deleteColumnId)
    : undefined;
  const wipDialogColumn = wipDialogColumnId
    ? columns.find((column) => column.id === wipDialogColumnId)
    : undefined;

  return (
    // RESPIRO (30/08, pedido da Ana): `space-y-6` no lugar de `space-y-4`. Ele
    // governa TODOS os intervalos desta pilha, e o que se via na tela era o de
    // baixo da contagem ("44 TAREFAS") colado no quadro. Subir o degrau aqui, e
    // nao acrescentar uma margem so naquele ponto, mantem os espacos da pagina
    // numa escala unica em vez de criar uma excecao para o vizinho seguinte
    // reclamar depois.
    <div className="space-y-6">
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
        onIncludeArchivedChange={(next) =>
          setViewState({ includeArchived: next })
        }
        onClearFilters={clearFilters}
        onManageBoards={() => setBoardManagerOpen(true)}
      />

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
          columns={columns}
          pendingTaskIds={pendingTaskIds}
          selectedTaskId={selectedTaskId}
          filtersActive={filtersActive}
          onOpenTask={openTask}
          onMoveTask={handleMoveTask}
          onUnarchive={handleUnarchive}
          onClearFilters={clearFilters}
        />
      ) : (
        <div data-testid="board-scroll" className={boardScrollClass}>
          <div data-testid="board-row" className={boardRowClass}>
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
                columns={columns}
                filtersActive={filtersActive}
                onOpenTask={openTask}
                onMoveTask={handleMoveTask}
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
              // COMPACTO. O botao ocupava uma coluna inteira de 13rem para
              // dizer duas palavras, e numa fileira centrada esse bloco
              // desloca o centro visual do quadro. Vira o disco de "+" na
              // anatomia dos compactos da casa (o X do modal de usuario),
              // tracejado por ser acao de CRIAR.
              //
              // O texto que saiu vira `aria-label` e `title`: icone nao
              // fala, e sem os dois o botao fica sem nome acessivel. Mesmo
              // cuidado do avatar do header do admin.
              // MAIOR e CENTRADO NA VERTICAL (decisao da Ana, 30/08). O
              // `self-center` alinha o disco ao meio da altura das colunas
              // em vez de encostar no topo: numa fileira de colunas altas,
              // um alvo de 48px grudado na borda de cima le como sobra de
              // layout, e nao como acao.
              //
              // `h-12 w-12` com icone `h-5 w-5`: a familia grande dos
              // compactos da casa. O nome acessivel continua no
              // `aria-label` mais `title`, porque icone nao fala.
              <div
                data-testid="board-nova-etapa"
                className="flex shrink-0 items-center self-center"
              >
                <button
                  type="button"
                  onClick={() => setNewColumnOpen(true)}
                  aria-label="Nova etapa"
                  title="Nova etapa"
                  className="grid h-12 w-12 place-items-center rounded-full border-2 border-dashed border-slate-400 bg-white/60 text-slate-600 transition-colors hover:border-slate-900 hover:bg-white hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
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
              snapshot.tasks.find((task) => task.id === selectedTaskId)
                ?.column_id ?? "",
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
        <AlertDialogContent
          overlayClassName={LAYER_DIALOG}
          className={`${LAYER_DIALOG} rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_var(--bnt-shadow)]`}
        >
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
              className="rounded-full border-2 border-slate-900 bg-rose-600 px-4 py-2 text-sm font-black text-white shadow-[2px_2px_0_var(--bnt-shadow)] disabled:opacity-50"
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
