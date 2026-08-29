import { memo, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

// Criacao inline no espirito do Notion/Trello: Enter cria e MANTEM o campo
// aberto para a proxima, Shift+Enter quebra linha, Esc fecha, blur com campo
// vazio fecha. Digitar tres tarefas seguidas nao pode exigir tres cliques em
// "+ Nova tarefa".
//
// O componente nao espera a resposta da rede para liberar o campo: quem cria e
// otimista no TasksDashboard, entao a pessoa continua digitando enquanto a
// requisicao anterior esta no ar.

type NewTaskComposerProps = {
  columnId: string;
  /** "top" e "bottom" so mudam onde a tarefa entra na coluna. */
  placement: "top" | "bottom";
  onCreate: (columnId: string, title: string, placement: "top" | "bottom") => void;
};

function NewTaskComposerBase({
  columnId,
  placement,
  onCreate,
}: NewTaskComposerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  function submit() {
    const title = draft.trim();
    if (!title) return;
    onCreate(columnId, title, placement);
    setDraft("");
    // Continua aberto e focado: e o ponto do composer.
    textareaRef.current?.focus();
  }

  if (!open) {
    return (
      <button
        type="button"
        // Marcador para o atalho `N` do board encontrar o composer do topo.
        data-composer-for={placement === "top" ? columnId : undefined}
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-400 bg-white/60 px-3 py-2 text-xs font-black text-slate-600 transition-colors hover:border-slate-900 hover:bg-white hover:text-slate-900"
      >
        <Plus className="h-3.5 w-3.5" />
        Nova tarefa
      </button>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-slate-900 bg-white p-2 shadow-[3px_3px_0_var(--bnt-shadow)]">
      <textarea
        ref={textareaRef}
        rows={2}
        value={draft}
        placeholder="Título da tarefa. Enter cria, Shift+Enter quebra linha."
        aria-label="Título da nova tarefa"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setDraft("");
            setOpen(false);
          }
        }}
        onBlur={() => {
          // Fecha SO se estiver vazio. Fechar com texto digitado perderia o que
          // a pessoa escreveu por causa de um clique fora sem querer.
          if (!draft.trim()) setOpen(false);
        }}
        className="w-full resize-none rounded-lg border-2 border-slate-300 px-2 py-1.5 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
      />
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={submit}
          disabled={!draft.trim()}
          className="rounded-full border-2 border-slate-900 bg-[#FFB800] px-3 py-1 text-xs font-black text-slate-950 shadow-[2px_2px_0_var(--bnt-shadow)] disabled:opacity-40 disabled:shadow-none"
        >
          Adicionar
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setDraft("");
            setOpen(false);
          }}
          className="text-xs font-black text-slate-500 hover:text-slate-900"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export const NewTaskComposer = memo(NewTaskComposerBase);
