import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Archive, Copy, Link as LinkIcon, Loader2, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  attachLabel,
  createChecklistItem,
  createComment as createCommentRequest,
  createLabel,
  createTask,
  deleteChecklistItem,
  deleteComment,
  deleteTask,
  detachLabel,
  getTask,
  getTaskActivity,
  patchChecklistItem,
  patchComment,
  patchTask,
  reorderChecklist,
} from "@/services/adminTasksService";

import { MarkdownEditor } from "./MarkdownEditor";
import { TaskActivityList } from "./TaskActivityList";
import { TaskChecklist } from "./TaskChecklist";
import { TaskComments } from "./TaskComments";
import { TaskProperties } from "./TaskProperties";
import { rowActionClass, secondaryButtonClass } from "./taskBoardStyles";
import { shortIdOf } from "./taskDeepLink";
import { useAutoSave } from "./useAutoSave";
import type {
  Task,
  TaskActivity,
  TaskAssignee,
  TaskCard,
  TaskChecklistItem,
  TaskComment,
  TaskColumn,
  TaskLabel,
  TaskPriority,
  TaskType,
} from "./types";

// Modal da tarefa, estilo pagina do Notion. Largo no desktop, TELA CHEIA no
// mobile.
//
// Tres regras que o modal precisa respeitar e que sao faceis de quebrar:
//
//  1. abrir NAO espera a rede. O modal aparece na hora com skeleton e o
//     GET /crm/tasks/:id preenche depois.
//  2. nenhum caminho de saida perde texto digitado. Esc, clique fora, trocar de
//     tarefa com as setas e fechar pelo X passam TODOS pelo mesmo `requestClose`,
//     que aguarda o flush do autosave. F5 cai no aviso do beforeunload.
//  3. mudar de etapa aqui usa a MESMA moveTask do drag e das setas do card
//     (prop `onMoveTask`), com o mesmo contador de sequencia. Nao ha terceiro
//     caminho de movimentacao no modulo.

type TaskModalProps = {
  taskId: string;
  boardKey: string;
  columns: TaskColumn[];
  admins: TaskAssignee[];
  labels: TaskLabel[];
  /** Cards da coluna atual, na ordem visual, para a navegacao com as setas. */
  siblingsInColumn: TaskCard[];
  onClose: () => void;
  onOpenTask: (taskId: string) => void;
  /** Caminho unico de movimentacao, vindo do TasksDashboard. */
  onMoveTask: (taskId: string, columnId: string) => void;
  /** Aplica a mudanca no card do board sem refetch do snapshot inteiro. */
  onPatchCard: (taskId: string, patch: Partial<TaskCard>) => void;
  /** Recarrega o board (usado apos duplicar, arquivar e excluir). */
  onBoardChanged: () => void;
  /** Remove o card do board na hora (arquivar e excluir). */
  onRemoveCard: (taskId: string) => void;
};

type ModalData = {
  task: Task;
  labelIds: string[];
  checklist: TaskChecklistItem[];
  comments: TaskComment[];
  activity: TaskActivity[];
  activityHasMore: boolean;
};

const TEMP_COMMENT_PREFIX = "temp-comment-";

export function TaskModal({
  taskId,
  boardKey,
  columns,
  admins,
  labels,
  siblingsInColumn,
  onClose,
  onOpenTask,
  onMoveTask,
  onPatchCard,
  onBoardChanged,
  onRemoveCard,
}: TaskModalProps) {
  // Quem esta logado, so para DECIDIR o que mostrar. Quem garante que ninguem
  // edita comentario alheio e a rota, que filtra por author_id no WHERE.
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  const [data, setData] = useState<ModalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [estimateDraft, setEstimateDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [closing, setClosing] = useState(false);
  const [sideTab, setSideTab] = useState<"comentarios" | "historico">(
    "comentarios",
  );
  const [loadingMoreActivity, setLoadingMoreActivity] = useState(false);
  // Relogio capturado UMA vez por montagem do modal, e passado adiante. As datas
  // relativas ficam estaveis enquanto o modal esta aberto (nada de "há 5 min"
  // virando "há 6 min" no meio de um render) e o teste consegue injetar o valor.
  const [nowMs] = useState(() => Date.now());

  const requestSeq = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Autosave dos campos de texto
  // -------------------------------------------------------------------------

  const persist = useCallback(
    async (patch: Partial<Task>) => {
      const updated = await patchTask(taskId, patch);
      if (!mounted.current) return;
      setData((current) => (current ? { ...current, task: updated } : current));
      // O card atras do modal reflete na hora, sem refetch do snapshot: o board
      // pode ter dezenas de cards e uma tecla nao pode custar uma varredura.
      onPatchCard(taskId, updated);
    },
    [onPatchCard, taskId],
  );

  const { queue, flush, reset, status, isDirty } = useAutoSave<Task>(persist);

  // -------------------------------------------------------------------------
  // Carregamento
  // -------------------------------------------------------------------------

  useEffect(() => {
    const seq = (requestSeq.current += 1);
    setLoading(true);
    setData(null);
    void (async () => {
      try {
        const detail = await getTask(taskId);
        if (!mounted.current || seq !== requestSeq.current) return;
        setData({
          task: detail.task,
          labelIds: detail.label_ids,
          checklist: detail.checklist,
          comments: detail.comments,
          activity: detail.activity,
          activityHasMore: detail.activity_has_more,
        });
        setTitle(detail.task.title);
        setDescription(detail.task.description ?? "");
        setNotes(detail.task.notes ?? "");
        setEstimateDraft(
          detail.task.estimate === null ? "" : String(detail.task.estimate),
        );
        setLoading(false);
      } catch (error) {
        if (!mounted.current || seq !== requestSeq.current) return;
        // Id inexistente, apagado por outra aba, ou lixo que passou pelo formato
        // do deep link. Avisa e limpa o ?task= sem derrubar o ?section=.
        toast.error(
          error instanceof Error ? error.message : "Tarefa não encontrada.",
        );
        onClose();
      }
    })();
  }, [taskId, onClose]);

  // -------------------------------------------------------------------------
  // Saida (o ponto que perde texto se sair errado)
  // -------------------------------------------------------------------------

  const requestClose = useCallback(
    async (then?: () => void) => {
      if (isDirty()) setClosing(true);
      await flush();
      reset();
      if (!mounted.current) return;
      setClosing(false);
      (then ?? onClose)();
    },
    [flush, isDirty, onClose, reset],
  );

  const goToSibling = useCallback(
    (direction: -1 | 1) => {
      const index = siblingsInColumn.findIndex((task) => task.id === taskId);
      const next = siblingsInColumn[index + direction];
      if (!next) return;
      // Troca de tarefa tambem e uma SAIDA: sem o flush aqui, o que estava
      // digitado nesta ficaria para tras.
      void requestClose(() => onOpenTask(next.id));
    },
    [onOpenTask, requestClose, siblingsInColumn, taskId],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      const target = event.target as HTMLElement | null;
      // Setas dentro de campo de texto pertencem ao campo.
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      goToSibling(event.key === "ArrowUp" ? -1 : 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goToSibling]);

  // -------------------------------------------------------------------------
  // Acoes
  // -------------------------------------------------------------------------

  const task = data?.task ?? null;

  async function withErrorToast(action: () => Promise<void>, fallback: string) {
    try {
      await action();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : fallback);
    }
  }

  function copyLink() {
    if (!task) return;
    const url = `${window.location.origin}/admin?section=tarefas&task=${shortIdOf(boardKey, task.number)}`;
    void navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copiado."))
      .catch(() => toast.error("Não foi possível copiar o link."));
  }

  function duplicate() {
    if (!task) return;
    void withErrorToast(async () => {
      await createTask({
        board_id: task.board_id,
        column_id: task.column_id,
        title: `${task.title} (cópia)`,
        description: task.description,
        notes: task.notes,
        priority: task.priority,
        type: task.type,
        assignee_id: task.assignee_id,
        due_date: task.due_date,
        estimate: task.estimate,
      });
      onBoardChanged();
      toast.success("Tarefa duplicada.");
    }, "Erro ao duplicar a tarefa.");
  }

  function archive() {
    if (!task) return;
    void withErrorToast(async () => {
      await flush();
      await patchTask(task.id, { archived: true });
      onRemoveCard(task.id);
      onClose();
      toast.success("Tarefa arquivada.");
    }, "Erro ao arquivar a tarefa.");
  }

  function remove() {
    if (!task) return;
    void withErrorToast(async () => {
      await deleteTask(task.id);
      reset();
      onRemoveCard(task.id);
      setConfirmDelete(false);
      onClose();
      toast.success("Tarefa excluída.");
    }, "Erro ao excluir a tarefa.");
  }

  // -------------------------------------------------------------------------
  // Checklist e etiquetas
  // -------------------------------------------------------------------------

  function refreshCounts(items: TaskChecklistItem[]) {
    onPatchCard(taskId, {
      checklist_total: items.length,
      checklist_done: items.filter((item) => item.is_done).length,
    });
  }

  function addChecklistItem(content: string) {
    void withErrorToast(async () => {
      const item = await createChecklistItem(taskId, content);
      setData((current) => {
        if (!current) return current;
        const checklist = [...current.checklist, item];
        refreshCounts(checklist);
        return { ...current, checklist };
      });
    }, "Erro ao adicionar o item.");
  }

  function toggleChecklistItem(itemId: string, isDone: boolean) {
    setData((current) => {
      if (!current) return current;
      const checklist = current.checklist.map((item) =>
        item.id === itemId ? { ...item, is_done: isDone } : item,
      );
      refreshCounts(checklist);
      return { ...current, checklist };
    });
    void withErrorToast(async () => {
      await patchChecklistItem(itemId, { is_done: isDone });
    }, "Erro ao atualizar o item.");
  }

  function removeChecklistItem(itemId: string) {
    setData((current) => {
      if (!current) return current;
      const checklist = current.checklist.filter((item) => item.id !== itemId);
      refreshCounts(checklist);
      return { ...current, checklist };
    });
    void withErrorToast(async () => {
      await deleteChecklistItem(itemId);
    }, "Erro ao remover o item.");
  }

  function reorderChecklistItems(orderedIds: string[]) {
    setData((current) => {
      if (!current) return current;
      const byId = new Map(current.checklist.map((item) => [item.id, item]));
      return {
        ...current,
        checklist: orderedIds
          .map((id) => byId.get(id))
          .filter((item): item is TaskChecklistItem => item !== undefined),
      };
    });
    // A rota exige o conjunto COMPLETO de ids, e e isso que o TaskChecklist
    // monta. Lista parcial voltaria 400 incomplete_order.
    void withErrorToast(async () => {
      await reorderChecklist(taskId, orderedIds);
    }, "Erro ao reordenar o checklist.");
  }

  // -------------------------------------------------------------------------
  // Comentarios e histórico
  // -------------------------------------------------------------------------

  /**
   * Devolve `false` quando falhou, para o composer recuperar o texto em vez de
   * perde-lo. Mesmo principio do autosave: rede caida nao apaga o que a pessoa
   * escreveu.
   */
  async function createComment(body: string): Promise<boolean> {
    const tempId = `${TEMP_COMMENT_PREFIX}${Date.now()}`;
    const optimistic: TaskComment = {
      id: tempId,
      task_id: taskId,
      author_id: currentUserId ?? "",
      body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setData((current) =>
      current ? { ...current, comments: [...current.comments, optimistic] } : current,
    );
    bumpCommentCount(1);

    try {
      const created = await createCommentRequest(taskId, body);
      // Troca NO LUGAR, sem remover e reinserir: o comentario nao pisca nem
      // duplica. Mesmo padrao da criacao de tarefa no board.
      setData((current) =>
        current
          ? {
              ...current,
              comments: current.comments.map((item) =>
                item.id === tempId ? created : item,
              ),
            }
          : current,
      );
      return true;
    } catch (error) {
      setData((current) =>
        current
          ? {
              ...current,
              comments: current.comments.filter((item) => item.id !== tempId),
            }
          : current,
      );
      bumpCommentCount(-1);
      toast.error(error instanceof Error ? error.message : "Erro ao comentar.");
      return false;
    }
  }

  function editComment(commentId: string, body: string) {
    const previous = data?.comments.find((item) => item.id === commentId);
    setData((current) =>
      current
        ? {
            ...current,
            comments: current.comments.map((item) =>
              item.id === commentId
                ? { ...item, body, updated_at: new Date().toISOString() }
                : item,
            ),
          }
        : current,
    );
    void (async () => {
      try {
        const updated = await patchComment(commentId, body);
        setData((current) =>
          current
            ? {
                ...current,
                comments: current.comments.map((item) =>
                  item.id === commentId ? updated : item,
                ),
              }
            : current,
        );
      } catch (error) {
        // Inclui o caso de editar comentario de outra pessoa: o server responde
        // 404 porque o author_id nao casa o WHERE.
        if (previous) {
          setData((current) =>
            current
              ? {
                  ...current,
                  comments: current.comments.map((item) =>
                    item.id === commentId ? previous : item,
                  ),
                }
              : current,
          );
        }
        toast.error(
          error instanceof Error ? error.message : "Erro ao editar o comentário.",
        );
      }
    })();
  }

  function removeComment(commentId: string) {
    const previous = data?.comments ?? [];
    setData((current) =>
      current
        ? {
            ...current,
            comments: current.comments.filter((item) => item.id !== commentId),
          }
        : current,
    );
    bumpCommentCount(-1);
    void (async () => {
      try {
        await deleteComment(commentId);
      } catch (error) {
        setData((current) => (current ? { ...current, comments: previous } : current));
        bumpCommentCount(1);
        toast.error(
          error instanceof Error ? error.message : "Erro ao excluir o comentário.",
        );
      }
    })();
  }

  function bumpCommentCount(delta: number) {
    const total = (data?.comments.length ?? 0) + delta;
    onPatchCard(taskId, { comment_count: Math.max(0, total) });
  }

  function loadMoreActivity() {
    const oldest = data?.activity[data.activity.length - 1];
    if (!oldest || loadingMoreActivity) return;
    setLoadingMoreActivity(true);
    void (async () => {
      try {
        const page = await getTaskActivity(taskId, oldest.created_at);
        setData((current) =>
          current
            ? {
                ...current,
                activity: [...current.activity, ...page.activity],
                activityHasMore: page.activity_has_more,
              }
            : current,
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao carregar o histórico.",
        );
      } finally {
        setLoadingMoreActivity(false);
      }
    })();
  }

  function toggleLabel(labelId: string, selected: boolean) {
    setData((current) => {
      if (!current) return current;
      const labelIds = selected
        ? [...current.labelIds, labelId]
        : current.labelIds.filter((id) => id !== labelId);
      onPatchCard(taskId, { label_ids: labelIds });
      return { ...current, labelIds };
    });
    void withErrorToast(async () => {
      if (selected) await attachLabel(taskId, labelId);
      else await detachLabel(taskId, labelId);
    }, "Erro ao aplicar a etiqueta.");
  }

  function createAndAttachLabel(name: string, color: string) {
    if (!task) return;
    void withErrorToast(async () => {
      // Nome que ja existe volta 200 com a etiqueta existente. Nao ha ramo de
      // erro aqui de propósito: os dois desfechos sao o mesmo sucesso.
      const label = await createLabel({
        board_id: task.board_id,
        name,
        color,
      });
      await attachLabel(taskId, label.id);
      setData((current) =>
        current && !current.labelIds.includes(label.id)
          ? { ...current, labelIds: [...current.labelIds, label.id] }
          : current,
      );
      onBoardChanged();
    }, "Erro ao criar a etiqueta.");
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const savingLabel =
    closing || status === "saving"
      ? "salvando…"
      : status === "saved"
        ? "salvo"
        : status === "error"
          ? "erro ao salvar"
          : "";

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          // Esc e clique fora passam por aqui. Nunca fecha direto.
          if (!open) void requestClose();
        }}
      >
        <DialogContent
          className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-white p-0 sm:h-[88vh] sm:w-[min(72rem,94vw)] sm:max-w-none sm:rounded-2xl sm:border-2 sm:border-slate-950 sm:shadow-[6px_6px_0_#0f172a]"
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-slate-200 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">
                {task ? shortIdOf(boardKey, task.number) : "—"}
              </span>
              {savingLabel ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide text-slate-400">
                  {closing || status === "saving" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : null}
                  {savingLabel}
                </span>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <button type="button" onClick={copyLink} className={rowActionClass}>
                <LinkIcon className="mr-1 inline h-3 w-3" />
                Link
              </button>
              <button type="button" onClick={duplicate} className={rowActionClass}>
                <Copy className="mr-1 inline h-3 w-3" />
                Duplicar
              </button>
              <button type="button" onClick={archive} className={rowActionClass}>
                <Archive className="mr-1 inline h-3 w-3" />
                Arquivar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className={`${rowActionClass} text-rose-700`}
              >
                <Trash2 className="mr-1 inline h-3 w-3" />
                Excluir
              </button>
            </div>
          </header>

          <DialogTitle className="sr-only">
            {task ? task.title : "Carregando tarefa"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes da tarefa. Use Escape para fechar e as setas para cima e para
            baixo para navegar entre as tarefas da etapa.
          </DialogDescription>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row">
            <div className="min-w-0 flex-1 space-y-5 px-4 py-4 sm:px-6">
              {loading || !data || !task ? (
                <>
                  <Skeleton className="h-9 w-2/3 bg-slate-200" />
                  <Skeleton className="h-32 w-full bg-slate-200" />
                  <Skeleton className="h-24 w-full bg-slate-200" />
                </>
              ) : (
                <>
                  <input
                    value={title}
                    aria-label="Título da tarefa"
                    onChange={(event) => {
                      setTitle(event.target.value);
                      const next = event.target.value.trim();
                      // Titulo vazio nao vai para o servidor (o CHECK exige 1+
                      // caractere). O campo aceita ficar vazio enquanto edita, e
                      // o valor anterior permanece gravado.
                      if (next) queue({ title: next });
                    }}
                    onBlur={() => {
                      if (!title.trim()) setTitle(task.title);
                      void flush();
                    }}
                    className="font-display w-full border-0 bg-transparent p-0 text-2xl font-black text-slate-950 focus:outline-none sm:text-3xl"
                  />

                  <section>
                    <h3 className="mb-1.5 text-xs font-black uppercase tracking-wide text-slate-600">
                      Descrição
                    </h3>
                    <MarkdownEditor
                      ariaLabel="Descrição da tarefa"
                      value={description}
                      placeholder="O que precisa ser feito. Aceita markdown."
                      onChange={(value) => {
                        setDescription(value);
                        queue({ description: value });
                      }}
                      onBlur={() => void flush()}
                    />
                  </section>

                  <section>
                    <h3 className="mb-1.5 text-xs font-black uppercase tracking-wide text-slate-600">
                      Notas
                    </h3>
                    <MarkdownEditor
                      ariaLabel="Notas da tarefa"
                      value={notes}
                      minRows={4}
                      placeholder="Contexto, links, rascunho. Separado da descrição."
                      onChange={(value) => {
                        setNotes(value);
                        queue({ notes: value });
                      }}
                      onBlur={() => void flush()}
                    />
                  </section>

                  <TaskChecklist
                    items={data.checklist}
                    onToggle={toggleChecklistItem}
                    onAdd={addChecklistItem}
                    onRemove={removeChecklistItem}
                    onReorder={reorderChecklistItems}
                  />

                  {/* Duas ABAS e nao uma timeline unica: o histórico gera uma
                      linha por campo alterado e afogaria a conversa em poucos
                      dias de uso. */}
                  <section>
                    <div className="mb-2.5 flex gap-1 rounded-full border-2 border-slate-900 bg-white p-0.5 shadow-[1px_1px_0_#0f172a] sm:w-fit">
                      <button
                        type="button"
                        onClick={() => setSideTab("comentarios")}
                        className={`rounded-full px-3 py-1 text-[11px] font-black uppercase transition-colors ${
                          sideTab === "comentarios"
                            ? "bg-slate-950 text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Comentários
                        {data.comments.length > 0 ? ` (${data.comments.length})` : ""}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSideTab("historico")}
                        className={`rounded-full px-3 py-1 text-[11px] font-black uppercase transition-colors ${
                          sideTab === "historico"
                            ? "bg-slate-950 text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Histórico
                      </button>
                    </div>

                    {sideTab === "comentarios" ? (
                      <TaskComments
                        comments={data.comments}
                        admins={admins}
                        currentUserId={currentUserId}
                        nowMs={nowMs}
                        onCreate={createComment}
                        onEdit={editComment}
                        onDelete={removeComment}
                      />
                    ) : (
                      <TaskActivityList
                        activity={data.activity}
                        admins={admins}
                        hasMore={data.activityHasMore}
                        loadingMore={loadingMoreActivity}
                        nowMs={nowMs}
                        onLoadMore={loadMoreActivity}
                      />
                    )}
                  </section>
                </>
              )}
            </div>

            <aside className="shrink-0 border-t-2 border-slate-200 bg-slate-50 px-4 py-4 sm:px-6 lg:w-[22rem] lg:border-l-2 lg:border-t-0">
              {loading || !data || !task ? (
                <div className="space-y-2">
                  <Skeleton className="h-7 w-full bg-slate-200" />
                  <Skeleton className="h-7 w-full bg-slate-200" />
                  <Skeleton className="h-7 w-full bg-slate-200" />
                </div>
              ) : (
                <TaskProperties
                  task={task}
                  columns={columns}
                  admins={admins}
                  labels={labels}
                  selectedLabelIds={data.labelIds}
                  estimateDraft={estimateDraft}
                  onChangeColumn={(columnId) => {
                    if (columnId === task.column_id) return;
                    // Mesmo caminho do drag e das setas do card.
                    onMoveTask(task.id, columnId);
                    setData((current) =>
                      current
                        ? { ...current, task: { ...current.task, column_id: columnId } }
                        : current,
                    );
                  }}
                  onChangeAssignee={(assigneeId) =>
                    void withErrorToast(
                      () => persist({ assignee_id: assigneeId }),
                      "Erro ao definir o responsável.",
                    )
                  }
                  onChangePriority={(priority: TaskPriority) =>
                    void withErrorToast(
                      () => persist({ priority }),
                      "Erro ao mudar a prioridade.",
                    )
                  }
                  onChangeType={(type: TaskType) =>
                    void withErrorToast(
                      () => persist({ type }),
                      "Erro ao mudar o tipo.",
                    )
                  }
                  onChangeDueDate={(dueDate) =>
                    void withErrorToast(
                      () => persist({ due_date: dueDate }),
                      "Erro ao definir o vencimento.",
                    )
                  }
                  onChangeEstimate={setEstimateDraft}
                  onCommitEstimate={() => {
                    const trimmed = estimateDraft.trim();
                    const parsed = trimmed === "" ? null : Number(trimmed);
                    if (parsed !== null && (!Number.isFinite(parsed) || parsed <= 0)) {
                      setEstimateDraft(
                        task.estimate === null ? "" : String(task.estimate),
                      );
                      toast.error("A estimativa precisa ser maior que zero.");
                      return;
                    }
                    if (parsed === task.estimate) return;
                    void withErrorToast(
                      () => persist({ estimate: parsed }),
                      "Erro ao definir a estimativa.",
                    );
                  }}
                  onToggleLabel={toggleLabel}
                  onCreateLabel={createAndAttachLabel}
                />
              )}
            </aside>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a]">
          <AlertDialogTitle className="font-display text-2xl font-black text-slate-950">
            Excluir tarefa
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-semibold text-slate-600">
            {task ? `“${task.title}” ` : ""}será removida junto com o checklist,
            os comentários e o histórico. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className={secondaryButtonClass}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                remove();
              }}
              className="rounded-full border-2 border-slate-900 bg-rose-600 px-4 py-2 text-sm font-black text-white shadow-[2px_2px_0_#0f172a]"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
