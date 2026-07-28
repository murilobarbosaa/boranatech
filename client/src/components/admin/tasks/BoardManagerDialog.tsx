import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Loader2, Plus, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminApiError } from "@/lib/adminApi";
import {
  createBoard,
  deleteBoard,
  patchBoard,
} from "@/services/adminTasksService";

import {
  COLUMN_COLOR_CHOICES,
  inputClass,
  labelClass,
  primaryButtonClass,
  rowActionClass,
  safeHexColor,
  secondaryButtonClass,
} from "./taskBoardStyles";
import { LAYER_DIALOG } from "./taskLayers";
import type { TaskBoard } from "./types";

// Gerencia quadros: criar, renomear, mudar cor, arquivar e excluir.
//
// A API de boards existe desde a Fase 1 e ficou sem porta na interface ate aqui.
// Este dialogo e a porta.
//
// Lista TODOS os quadros, inclusive os arquivados: sem isso, arquivar um quadro
// o faria sumir do seletor sem nenhum caminho de volta, e ele ficaria encalhado
// no banco. Aqui o arquivado aparece esmaecido, com acao de desarquivar.

/** Mesma regra do CHECK do banco e do zod da rota. */
const KEY_RE = /^[A-Z][A-Z0-9]{1,9}$/;

/** Slug derivado do nome; o usuario nao precisa saber que ele existe. */
function slugify(name: string, fallback: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback.toLowerCase();
}

type BoardManagerDialogProps = {
  open: boolean;
  boards: TaskBoard[];
  onOpenChange: (open: boolean) => void;
  /** Recarrega a lista de quadros no dashboard. */
  onChanged: () => void;
  /** Chamado ao criar, para o board novo virar o ativo. */
  onCreated: (boardId: string) => void;
  /** Quadro excluido: o dashboard precisa sair dele se era o ativo. */
  onDeleted: (boardId: string) => void;
};

export function BoardManagerDialog({
  open,
  boards,
  onOpenChange,
  onChanged,
  onCreated,
  onDeleted,
}: BoardManagerDialogProps) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [color, setColor] = useState("#FFB800");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TaskBoard | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setKey("");
      setColor("#FFB800");
      setDeleteTarget(null);
      setDeleteConfirm("");
    }
  }, [open]);

  const usedKeys = useMemo(
    () => new Set(boards.map((board) => board.key.toUpperCase())),
    [boards],
  );

  // Validacao NO CLIENTE com a mesma regra do servidor: a colisao de sigla e o
  // erro mais provavel aqui, e descobri-la por 409 depois de preencher o
  // formulario e pior do que ver na hora.
  const trimmedName = name.trim();
  const normalizedKey = key.trim().toUpperCase();
  const keyError =
    normalizedKey.length === 0
      ? null
      : !KEY_RE.test(normalizedKey)
        ? "2 a 10 caracteres, começando por letra. Só letras e números."
        : usedKeys.has(normalizedKey)
          ? `A sigla ${normalizedKey} já está em uso.`
          : null;
  const canCreate =
    trimmedName.length > 0 && normalizedKey.length > 0 && keyError === null;

  async function submitCreate() {
    if (!canCreate || creating) return;
    setCreating(true);
    try {
      const board = await createBoard({
        name: trimmedName,
        key: normalizedKey,
        slug: slugify(trimmedName, normalizedKey),
        color,
      });
      toast.success(`Quadro ${board.key} criado com as etapas padrão.`);
      onCreated(board.id);
      onChanged();
      setName("");
      setKey("");
    } catch (error) {
      // A colisao de slug (nome parecido, sigla diferente) so aparece aqui.
      if (error instanceof AdminApiError && error.code === "duplicate_board") {
        toast.error(
          "Já existe um quadro com essa sigla ou com um nome muito parecido.",
        );
      } else {
        toast.error(
          error instanceof Error ? error.message : "Erro ao criar o quadro.",
        );
      }
    } finally {
      setCreating(false);
    }
  }

  function rename(board: TaskBoard, nextName: string) {
    const trimmed = nextName.trim();
    if (!trimmed || trimmed === board.name) return;
    void (async () => {
      try {
        await patchBoard(board.id, { name: trimmed });
        onChanged();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao renomear o quadro.",
        );
      }
    })();
  }

  function recolor(board: TaskBoard, nextColor: string) {
    void (async () => {
      try {
        await patchBoard(board.id, { color: nextColor });
        onChanged();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao mudar a cor.",
        );
      }
    })();
  }

  function toggleArchive(board: TaskBoard) {
    void (async () => {
      try {
        await patchBoard(board.id, { archived: !board.archived_at });
        toast.success(board.archived_at ? "Quadro restaurado." : "Quadro arquivado.");
        onChanged();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao arquivar o quadro.",
        );
      }
    })();
  }

  function confirmDelete() {
    if (!deleteTarget || deleteConfirm.trim().toUpperCase() !== deleteTarget.key) {
      return;
    }
    const target = deleteTarget;
    void (async () => {
      try {
        await deleteBoard(target.id);
        toast.success(`Quadro ${target.key} excluído.`);
        setDeleteTarget(null);
        setDeleteConfirm("");
        onDeleted(target.id);
        onChanged();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao excluir o quadro.",
        );
      }
    })();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${LAYER_DIALOG} max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a] sm:max-w-lg`}
      >
        <DialogTitle className="font-display text-2xl font-black text-slate-950">
          Quadros
        </DialogTitle>
        <DialogDescription className="text-sm font-semibold text-slate-600">
          Cada quadro tem as próprias etapas, etiquetas e numeração de cartão.
        </DialogDescription>

        {/* ------------------------------------------------------------- */}
        {/* Criar                                                          */}
        {/* ------------------------------------------------------------- */}
        <section className="mt-3 rounded-2xl border-2 border-slate-200 p-3">
          <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-600">
            Novo quadro
          </h3>

          <div className="grid gap-2 sm:grid-cols-[1fr_8rem]">
            <div>
              <label htmlFor="board-name" className={labelClass}>
                Nome
              </label>
              <input
                id="board-name"
                value={name}
                placeholder="Ex: Marketing"
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="board-key" className={labelClass}>
                Sigla
              </label>
              <input
                id="board-key"
                value={key}
                placeholder="MKT"
                aria-invalid={keyError !== null}
                aria-describedby="board-key-hint"
                // Maiuscula na digitacao: a regra do banco exige, e corrigir
                // depois com mensagem de erro seria atrito a toa.
                onChange={(event) => setKey(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void submitCreate();
                  }
                }}
                className={inputClass}
              />
            </div>
          </div>

          {/* O aviso vive AQUI, no momento da criacao, e nao numa mensagem de
              erro depois: a sigla e imutavel porque DEV-42 circula em deep link
              e renomear quebraria links ja compartilhados. */}
          <p id="board-key-hint" className="mt-1.5 text-xs font-semibold text-slate-500">
            A sigla forma o identificador dos cartões (<code className="font-mono">{normalizedKey || "MKT"}-1</code>,{" "}
            <code className="font-mono">{normalizedKey || "MKT"}-2</code>) e{" "}
            <strong className="font-black text-slate-700">não pode ser alterada depois</strong>, porque
            ela circula em links compartilhados.
          </p>
          {keyError ? (
            <p className="mt-1 text-xs font-black text-rose-700">{keyError}</p>
          ) : null}

          <div className="mt-2.5">
            <p className={labelClass}>Cor</p>
            <div className="flex gap-1.5">
              {COLUMN_COLOR_CHOICES.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  aria-label={choice.label}
                  title={choice.label}
                  onClick={() => setColor(choice.value)}
                  className={`h-6 w-6 rounded-full border-2 border-slate-900 ${
                    color === choice.value ? "ring-2 ring-violet-400 ring-offset-1" : ""
                  }`}
                  style={{ backgroundColor: choice.value }}
                />
              ))}
            </div>
          </div>

          <p className="mt-2.5 text-xs font-semibold text-slate-500">
            Nasce com as etapas Backlog, A Fazer, Em Progresso, Em Revisão e
            Concluído, e com as 6 etiquetas padrão.
          </p>

          <button
            type="button"
            onClick={() => void submitCreate()}
            disabled={!canCreate || creating}
            className={`${primaryButtonClass} mt-2.5 inline-flex items-center gap-1.5`}
          >
            {creating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Criar quadro
          </button>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* Lista                                                          */}
        {/* ------------------------------------------------------------- */}
        <section className="mt-4">
          <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-600">
            Existentes
          </h3>
          <ul className="space-y-2">
            {boards.map((board) => {
              const archived = Boolean(board.archived_at);
              return (
                <li
                  key={board.id}
                  className={`rounded-2xl border-2 p-2.5 ${
                    archived
                      ? "border-dashed border-slate-300 bg-slate-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 rounded-full border-2 border-slate-900"
                      style={{ backgroundColor: safeHexColor(board.color, "#FFB800") }}
                    />
                    <span className="shrink-0 rounded-md border-2 border-slate-900 bg-white px-1.5 py-0.5 font-mono text-[11px] font-black text-slate-900">
                      {board.key}
                    </span>
                    <input
                      defaultValue={board.name}
                      aria-label={`Nome do quadro ${board.key}`}
                      onBlur={(event) => rename(board, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                      }}
                      className="min-w-0 flex-1 rounded-lg border-2 border-transparent px-1.5 py-0.5 text-sm font-black text-slate-900 hover:border-slate-300 focus:border-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => toggleArchive(board)}
                      title={archived ? "Restaurar quadro" : "Arquivar quadro"}
                      aria-label={archived ? `Restaurar ${board.key}` : `Arquivar ${board.key}`}
                      className={rowActionClass}
                    >
                      {archived ? (
                        <ArchiveRestore className="h-3 w-3" />
                      ) : (
                        <Archive className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteTarget(board);
                        setDeleteConfirm("");
                      }}
                      aria-label={`Excluir ${board.key}`}
                      className={`${rowActionClass} text-rose-700`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="mt-1.5 flex gap-1.5 pl-5">
                    {COLUMN_COLOR_CHOICES.map((choice) => (
                      <button
                        key={choice.value}
                        type="button"
                        aria-label={`Cor ${choice.label} para ${board.key}`}
                        onClick={() => recolor(board, choice.value)}
                        className={`h-4 w-4 rounded-full border-2 border-slate-900 ${
                          safeHexColor(board.color, "#FFB800") === choice.value
                            ? "ring-2 ring-violet-400 ring-offset-1"
                            : ""
                        }`}
                        style={{ backgroundColor: choice.value }}
                      />
                    ))}
                  </div>

                  {/* Confirmacao por DIGITACAO da sigla, e nao um botao: apagar
                      um quadro leva colunas, tarefas, etiquetas, comentarios e
                      histórico por cascade. Um clique nao e proporcional. */}
                  {deleteTarget?.id === board.id ? (
                    <div className="mt-2 rounded-xl border-2 border-rose-300 bg-rose-50 p-2.5">
                      <p className="text-xs font-black text-rose-900">
                        Isto apaga o quadro, todas as tarefas, o checklist, os
                        comentários e o histórico. Não dá para desfazer.
                      </p>
                      <p className="mt-1 text-xs font-semibold text-rose-800">
                        Digite <code className="font-mono font-black">{board.key}</code> para confirmar:
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        <input
                          autoFocus
                          value={deleteConfirm}
                          aria-label={`Digite ${board.key} para confirmar a exclusão`}
                          onChange={(event) =>
                            setDeleteConfirm(event.target.value.toUpperCase())
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              confirmDelete();
                            }
                            if (event.key === "Escape") setDeleteTarget(null);
                          }}
                          className="w-28 rounded-lg border-2 border-slate-900 px-2 py-1 font-mono text-sm font-black text-slate-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={confirmDelete}
                          disabled={deleteConfirm.trim().toUpperCase() !== board.key}
                          className="rounded-full border-2 border-slate-900 bg-rose-600 px-3 py-1 text-xs font-black text-white shadow-[2px_2px_0_#0f172a] disabled:opacity-40 disabled:shadow-none"
                        >
                          Excluir para sempre
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(null)}
                          className="text-xs font-black text-slate-600 hover:text-slate-900"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={secondaryButtonClass}
          >
            Fechar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
