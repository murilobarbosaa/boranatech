import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Renderizacao de markdown do modal de tarefas.
//
// O dialeto de componentes e o mesmo de client/src/components/roadmapV2/RoadmapNodeItem.tsx
// (o unico lugar do projeto que ja renderizava markdown), com dois acrescimos que
// aquele nao precisa: remark-gfm, para checklist `- [ ]`, tabela e strikethrough,
// e os elementos que o gfm habilita (input de checkbox, table, del).
//
// SEM rehype-raw e SEM dangerouslySetInnerHTML, de propósito. O react-markdown
// ignora HTML cru por padrao e e assim que fica: o texto e escrito por uma pessoa
// e lido por outra, e "so admin ve" nao muda o fato de que sao contas diferentes.

const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => (
    <p className="text-[0.92rem] leading-relaxed text-slate-700 [&:not(:first-child)]:mt-3">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-slate-900">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
  del: ({ children }) => (
    <del className="text-slate-400 line-through">{children}</del>
  ),
  code: ({ children }) => (
    <code className="rounded-[5px] border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[0.8em] text-slate-800">
      {children}
    </code>
  ),
  // Bloco cercado. No react-markdown 10 nao existe prop `inline`: o code de
  // bloco vem embrulhado em <pre>, entao o container escuro vive aqui e as
  // variantes [&_code] neutralizam o estilo inline do <code> interno.
  pre: ({ children }) => (
    <pre className="mt-3 overflow-x-auto rounded-[10px] border-[2.5px] border-slate-900 bg-slate-900 p-4 leading-relaxed [&_code]:block [&_code]:rounded-none [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:font-mono [&_code]:text-[0.82rem] [&_code]:text-slate-100">
      {children}
    </pre>
  ),
  ul: ({ children }) => (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.92rem] leading-relaxed text-slate-700 marker:text-slate-400">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[0.92rem] leading-relaxed text-slate-700 marker:text-slate-400">
      {children}
    </ol>
  ),
  // Item de checklist do gfm vem como <li> com um <input type=checkbox>. A
  // marcacao some da lista com bolinha para nao ficar marcador junto da caixa.
  li: ({ children, ...props }) => {
    const isTask = "className" in props && String(props.className).includes("task-list-item");
    return (
      <li className={isTask ? "list-none" : undefined}>{children}</li>
    );
  },
  input: ({ ...props }) =>
    props.type === "checkbox" ? (
      // Somente leitura de propósito: marcar aqui editaria o texto do markdown,
      // e o checklist DE VERDADE da tarefa e outro (admin_task_checklist_items).
      <input
        type="checkbox"
        checked={Boolean(props.checked)}
        readOnly
        disabled
        className="mr-2 h-3.5 w-3.5 rounded border-2 border-slate-900 align-middle accent-[var(--brand-yellow)]"
      />
    ) : null,
  blockquote: ({ children }) => (
    <blockquote className="mt-3 border-l-4 border-slate-300 pl-3 text-[0.92rem] italic text-slate-600">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse text-[0.86rem]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-2 border-slate-900 bg-slate-100 px-2 py-1 text-left font-black text-slate-900">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-2 border-slate-200 px-2 py-1 text-slate-700">{children}</td>
  ),
  h1: ({ children }) => (
    <h1 className="font-display mt-4 text-xl font-black text-slate-950">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display mt-4 text-lg font-black text-slate-950">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 text-base font-black text-slate-950">{children}</h3>
  ),
  hr: () => <hr className="mt-3 border-t-2 border-slate-200" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-violet-700 underline"
    >
      {children}
    </a>
  ),
};

export function MarkdownView({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <p className="text-sm font-semibold italic text-slate-400">
        Nada escrito ainda.
      </p>
    );
  }
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
      {content}
    </ReactMarkdown>
  );
}
