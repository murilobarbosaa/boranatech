import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { MarkdownView } from "./MarkdownView";
import { relativeTime } from "./relativeTime";
import { emptyBlockClass, primaryButtonClass, rowActionClass } from "./taskBoardStyles";
import type { TaskAssignee, TaskComment } from "./types";

// Comentarios da tarefa.
//
// Editar e excluir aparecem so nos proprios comentarios, mas quem GARANTE isso e
// a rota: o server filtra por author_id no proprio WHERE do update e do delete,
// entao um id de outra pessoa simplesmente nao casa linha nenhuma. Esconder o
// botao e conforto de interface, nao controle de acesso.

type TaskCommentsProps = {
  comments: TaskComment[];
  admins: TaskAssignee[];
  currentUserId: string | null;
  /** Relogio injetado, para o teste nao depender de Date.now(). */
  nowMs: number;
  onCreate: (body: string) => Promise<boolean>;
  onEdit: (commentId: string, body: string) => void;
  onDelete: (commentId: string) => void;
};

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TaskComments({
  comments,
  admins,
  currentUserId,
  nowMs,
  onCreate,
  onEdit,
  onDelete,
}: TaskCommentsProps) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const authorOf = (authorId: string) => {
    const admin = admins.find((item) => item.user_id === authorId);
    return {
      name: admin?.name ?? admin?.email ?? "Alguém",
      avatar: admin?.avatar_url ?? null,
    };
  };

  async function submit() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    // Limpa o composer de forma OTIMISTA, mas devolve o texto se falhar: perder
    // um comentario escrito por causa de rede caida seria o mesmo defeito do
    // modal, em outra caixa.
    setDraft("");
    const ok = await onCreate(body);
    if (!ok) setDraft(body);
    setSending(false);
  }

  return (
    <div>
      {comments.length === 0 ? (
        <p className={emptyBlockClass}>
          Nenhum comentário ainda.
          <br />
          <span className="font-semibold text-slate-400">
            Comece a conversa abaixo.
          </span>
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const author = authorOf(comment.author_id);
            const isMine = comment.author_id === currentUserId;
            // Comparacao de timestamp: o server so mexe em updated_at via
            // trigger, entao qualquer diferenca significa edicao de verdade.
            const wasEdited =
              Date.parse(comment.updated_at) - Date.parse(comment.created_at) > 1000;
            const isEditing = editingId === comment.id;

            return (
              <li key={comment.id} className="group flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-slate-900 bg-[var(--brand-yellow)] text-[10px] font-black text-ink-on-accent">
                  {author.avatar ? (
                    <img src={author.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initialsOf(author.name)
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-xs font-black text-slate-900">
                      {author.name}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {relativeTime(comment.created_at, nowMs)}
                    </span>
                    {wasEdited ? (
                      <span className="text-[10px] font-black uppercase tracking-wide text-slate-300">
                        editado
                      </span>
                    ) : null}
                    {isMine && !isEditing ? (
                      <span className="ml-auto flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                        <button
                          type="button"
                          aria-label="Editar comentário"
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditDraft(comment.body);
                          }}
                          className="rounded p-0.5 text-slate-400 hover:text-slate-900"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          aria-label="Excluir comentário"
                          onClick={() => onDelete(comment.id)}
                          className="rounded p-0.5 text-slate-400 hover:text-rose-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ) : null}
                  </div>

                  {isEditing ? (
                    <div className="mt-1">
                      <textarea
                        autoFocus
                        rows={3}
                        value={editDraft}
                        aria-label="Editar comentário"
                        onChange={(event) => setEditDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") {
                            event.preventDefault();
                            setEditingId(null);
                          }
                          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                            event.preventDefault();
                            if (editDraft.trim()) onEdit(comment.id, editDraft.trim());
                            setEditingId(null);
                          }
                        }}
                        className="w-full resize-y rounded-xl border-2 border-slate-900 px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:outline-none"
                      />
                      <div className="mt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (editDraft.trim()) onEdit(comment.id, editDraft.trim());
                            setEditingId(null);
                          }}
                          className={rowActionClass}
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-xs font-black text-slate-500 hover:text-slate-900"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-0.5">
                      <MarkdownView content={comment.body} />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 border-t-2 border-slate-200 pt-3">
        <textarea
          rows={3}
          value={draft}
          placeholder="Escreva um comentário. Aceita markdown. Ctrl+Enter envia."
          aria-label="Novo comentário"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void submit();
            }
          }}
          className="w-full resize-y rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        />
        <div className="mt-1.5 flex justify-end">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!draft.trim() || sending}
            className={primaryButtonClass}
          >
            Comentar
          </button>
        </div>
      </div>
    </div>
  );
}
