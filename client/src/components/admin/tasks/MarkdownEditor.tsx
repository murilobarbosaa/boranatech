import { useRef, useState } from "react";
import { Bold, Code, Italic, Link2, List, ListChecks } from "lucide-react";

import { MarkdownView } from "./MarkdownView";

// Editor de markdown do modal: textarea com abas Escrever / Visualizar, barra que
// insere sintaxe na SELECAO e atalhos Cmd/Ctrl+B, I e K.
//
// Nao e WYSIWYG e nao pretende ser. O conteudo fica em markdown puro no banco,
// que e o que mantem a busca por descricao trivial na Fase 6 e o que faz o texto
// continuar legivel se um dia a renderizacao mudar.

type Wrap = { before: string; after: string; placeholder: string };
type LinePrefix = { prefix: string; placeholder: string };

const WRAPS: Record<"bold" | "italic" | "code" | "link", Wrap> = {
  bold: { before: "**", after: "**", placeholder: "negrito" },
  italic: { before: "_", after: "_", placeholder: "itálico" },
  code: { before: "`", after: "`", placeholder: "código" },
  link: { before: "[", after: "](https://)", placeholder: "texto do link" },
};

const PREFIXES: Record<"list" | "checklist", LinePrefix> = {
  list: { prefix: "- ", placeholder: "item" },
  checklist: { prefix: "- [ ] ", placeholder: "tarefa" },
};

export type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minRows?: number;
  ariaLabel: string;
};

export function MarkdownEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  minRows = 6,
  ariaLabel,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<"escrever" | "visualizar">("escrever");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Aplica a transformacao mantendo a selecao coerente com o resultado.
   *
   * Reposicionar o cursor nao e detalhe cosmetico: sem isso, clicar em "negrito"
   * com texto selecionado deixaria o cursor no fim do documento e o proximo
   * caractere digitado sairia no lugar errado.
   */
  function applyWrap(kind: keyof typeof WRAPS) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { before, after, placeholder: fallback } = WRAPS[kind];
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      // Seleciona o CONTEUDO, nao os delimitadores: continuar digitando substitui
      // o texto de exemplo, que e o comportamento esperado.
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    });
  }

  function applyPrefix(kind: keyof typeof PREFIXES) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { prefix, placeholder: fallback } = PREFIXES[kind];
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    // Expande a selecao para linhas inteiras: prefixo de lista so faz sentido no
    // comeco da linha, entao selecionar meia linha nao pode inserir no meio dela.
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEndIndex = value.indexOf("\n", end);
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
    const block = value.slice(lineStart, lineEnd) || fallback;
    const prefixed = block
      .split("\n")
      .map((line) => (line.startsWith(prefix) ? line : `${prefix}${line}`))
      .join("\n");
    const next = `${value.slice(0, lineStart)}${prefixed}${value.slice(lineEnd)}`;
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + prefixed.length);
    });
  }

  const toolbarButton =
    "rounded-lg border-2 border-slate-900 bg-white p-1.5 text-slate-900 shadow-[1px_1px_0_var(--bnt-shadow)] transition-all hover:bg-slate-100 disabled:opacity-40";

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Negrito"
            title="Negrito (Ctrl+B)"
            disabled={tab !== "escrever"}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyWrap("bold")}
            className={toolbarButton}
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Itálico"
            title="Itálico (Ctrl+I)"
            disabled={tab !== "escrever"}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyWrap("italic")}
            className={toolbarButton}
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Lista"
            title="Lista"
            disabled={tab !== "escrever"}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyPrefix("list")}
            className={toolbarButton}
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Checklist"
            title="Checklist"
            disabled={tab !== "escrever"}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyPrefix("checklist")}
            className={toolbarButton}
          >
            <ListChecks className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Código"
            title="Código"
            disabled={tab !== "escrever"}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyWrap("code")}
            className={toolbarButton}
          >
            <Code className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Link"
            title="Link (Ctrl+K)"
            disabled={tab !== "escrever"}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyWrap("link")}
            className={toolbarButton}
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex gap-1 rounded-full border-2 border-slate-900 bg-white p-0.5 shadow-[1px_1px_0_var(--bnt-shadow)]">
          {(["escrever", "visualizar"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTab(option)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase transition-colors ${
                tab === option
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {option === "escrever" ? "Escrever" : "Visualizar"}
            </button>
          ))}
        </div>
      </div>

      {tab === "escrever" ? (
        <textarea
          ref={textareaRef}
          value={value}
          rows={minRows}
          placeholder={placeholder}
          aria-label={ariaLabel}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          onKeyDown={(event) => {
            const meta = event.metaKey || event.ctrlKey;
            if (!meta) return;
            const key = event.key.toLowerCase();
            if (key === "b") {
              event.preventDefault();
              applyWrap("bold");
            } else if (key === "i") {
              event.preventDefault();
              applyWrap("italic");
            } else if (key === "k") {
              event.preventDefault();
              applyWrap("link");
            }
          }}
          className="w-full resize-y rounded-xl border-2 border-slate-900 bg-white px-3 py-2 font-mono text-[0.86rem] leading-relaxed text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        />
      ) : (
        <div className="min-h-[8rem] rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2">
          <MarkdownView content={value} />
        </div>
      )}
    </div>
  );
}
