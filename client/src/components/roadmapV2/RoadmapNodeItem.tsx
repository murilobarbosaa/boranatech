import { useState } from "react";
import { Link } from "wouter";
import { Check, ChevronRight, Minus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import type {
  RoadmapLanguage,
  RoadmapNode,
  RoadmapResource,
} from "@/lib/roadmapV2/types";
import { displayProgress } from "@/lib/roadmapV2/progress";
import { projetos } from "@/lib/data";

type RoadmapNodeItemProps = {
  node: RoadmapNode;
  done: Set<string>;
  language?: RoadmapLanguage;
  onToggle: (id: string) => void;
};

const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => (
    <p className="text-[0.92rem] leading-relaxed text-slate-700 [&:not(:first-child)]:mt-3">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-slate-900">{children}</strong>
  ),
  code: ({ children }) => (
    <code className="rounded-[5px] border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[0.8em] text-slate-800">
      {children}
    </code>
  ),
  // Bloco cercado. No react-markdown 10 nao existe prop `inline`: o code de
  // bloco vem embrulhado em <pre>, entao o container escuro vive aqui e as
  // variantes [&_code] neutralizam o estilo inline do <code> interno (vencem
  // por especificidade, com ou sem linguagem anotada no fence, que por ora e
  // ignorada; sem syntax highlighting de proposito).
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

function NodeContent({ content }: { content: string }) {
  return (
    <div className="pb-3">
      <ReactMarkdown components={MARKDOWN_COMPONENTS}>{content}</ReactMarkdown>
    </div>
  );
}

type Projeto = (typeof projetos)[number];

function ProjectCard({
  project,
  checked,
  onToggleDone,
}: {
  project: Projeto;
  checked: boolean;
  onToggleDone: () => void;
}) {
  const href = `/projetos/${project.id}`;
  return (
    <div className="mb-3 rounded-[14px] border-[2.5px] border-slate-900 bg-amber-50 p-4 shadow-[4px_4px_0_#0f172a]">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-md border-2 border-slate-900 bg-[#FFB800] px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide text-slate-950">
          Projeto
        </span>
        <span className="rounded-md border-2 border-slate-900 bg-white px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide text-slate-700">
          {project.nivel}
        </span>
      </div>
      <h4 className="text-[1.05rem] font-black leading-tight text-slate-900">
        {project.nome}
      </h4>
      <p className="mt-1 text-[0.86rem] font-medium leading-snug text-slate-600">
        {project.objetivo}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={checked}
          onClick={onToggleDone}
          className={`inline-flex items-center gap-1.5 rounded-[9px] border-[2.5px] border-slate-900 px-3 py-1.5 text-[0.8rem] font-extrabold shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#0f172a] ${
            checked
              ? "bg-emerald-500 text-white shadow-[2px_2px_0_#047857]"
              : "bg-white text-slate-900"
          }`}
        >
          {checked && <Check className="h-3.5 w-3.5" strokeWidth={4} />}
          {checked ? "Concluído" : "Marcar como concluído"}
        </button>
        <Link
          href={href}
          className="rounded-[9px] border-[2.5px] border-slate-900 bg-violet-100 px-3 py-1.5 text-[0.8rem] font-extrabold text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#0f172a]"
        >
          Ver projeto
        </Link>
      </div>
    </div>
  );
}

const RESOURCE_CHIP_CLASS =
  "rounded-[7px] border-2 border-slate-900 bg-violet-100 px-3 py-1.5 text-[0.78rem] font-extrabold text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#0f172a]";

function ResourceChips({ resources }: { resources: RoadmapResource[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {resources.map((resource) =>
        resource.url.startsWith("/") ? (
          <Link
            key={`${resource.label}-${resource.url}`}
            href={resource.url}
            className={RESOURCE_CHIP_CLASS}
          >
            {resource.label}
          </Link>
        ) : (
          <a
            key={`${resource.label}-${resource.url}`}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className={RESOURCE_CHIP_CLASS}
          >
            {resource.label}
          </a>
        ),
      )}
    </div>
  );
}

function OptionalBadge() {
  return (
    <span className="rounded-md border-2 border-sky-700 bg-sky-100 px-1.5 py-0.5 text-[0.62rem] font-black uppercase tracking-wide text-sky-800">
      Opcional
    </span>
  );
}

function GroupItem({ node, done, language, onToggle }: RoadmapNodeItemProps) {
  const [open, setOpen] = useState(false);
  const progress = displayProgress(node, done);
  const complete = progress.total > 0 && progress.done === progress.total;
  const partial = progress.done > 0 && progress.done < progress.total;
  const optional = node.optional === true;
  const showCount = progress.total > 0;

  return (
    <div className="my-0.5">
      <div
        className="-mx-2 flex cursor-pointer select-none items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50"
        onClick={() => setOpen((prev) => !prev)}
      >
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
        <span
          className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[7px] border-[2.5px] border-slate-900 shadow-[2px_2px_0_#0f172a] ${
            complete
              ? "bg-emerald-500 shadow-[2px_2px_0_#047857]"
              : partial
                ? "bg-[#FFB800]"
                : "bg-white"
          }`}
        >
          {complete && (
            <Check
              className="h-3.5 w-3.5 text-white motion-safe:animate-in motion-safe:zoom-in-50"
              strokeWidth={4}
            />
          )}
          {partial && (
            <Minus className="h-3 w-3 text-slate-900" strokeWidth={4} />
          )}
        </span>
        <span className="text-[1.05rem] font-extrabold text-slate-900">
          {node.title}
        </span>
        <span className="ml-auto flex items-center gap-2">
          {optional && <OptionalBadge />}
          {showCount && (
            <span
              className={`rounded-[7px] border-2 border-slate-900 px-2 py-0.5 text-[0.72rem] font-extrabold ${
                complete
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {progress.done}/{progress.total}
            </span>
          )}
        </span>
      </div>
      {node.description && (
        <p className="mb-1 ml-[3.6rem] text-[0.85rem] font-medium leading-snug text-slate-500">
          {node.description}
        </p>
      )}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden py-1">
          <div className="ml-[12px] border-l-[2.5px] border-dashed border-slate-300 pl-4">
            {node.children?.map((child) => (
              <RoadmapNodeItem
                key={child.id}
                node={child}
                done={done}
                language={language}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeafItem({ node, done, language, onToggle }: RoadmapNodeItemProps) {
  const [bodyOpen, setBodyOpen] = useState(false);
  const checked = done.has(node.id);
  const optional = node.optional === true;
  const langContent = language ? node.byLanguage?.[language.id] : undefined;
  const project = node.project
    ? projetos.find((p) => p.id === node.project)
    : undefined;
  // node.project que nao resolve no catalogo (id removido/renomeado, ou texto
  // livre de roadmap de IA antigo): card minimo em vez de sumir em silencio.
  const projectUnresolved = Boolean(node.project && !project);
  if (projectUnresolved && import.meta.env.DEV) {
    console.warn(
      `[roadmapV2] node.project "${node.project}" (no ${node.id}) nao resolve no catalogo de projetos`,
    );
  }
  const hasResources = Boolean(node.resources && node.resources.length > 0);
  const hasLangResources = Boolean(
    langContent?.resources && langContent.resources.length > 0,
  );
  const hasBody =
    Boolean(node.content) ||
    Boolean(langContent?.content) ||
    Boolean(project) ||
    projectUnresolved ||
    hasResources ||
    hasLangResources;

  return (
    <div
      className={`-mx-2 flex items-start gap-3 rounded-xl px-2 transition-colors ${
        checked ? "bg-emerald-50/70" : "hover:bg-slate-50"
      }`}
    >
      <button
        type="button"
        aria-pressed={checked}
        aria-label={
          checked ? `Desmarcar ${node.title}` : `Marcar ${node.title}`
        }
        onClick={() => onToggle(node.id)}
        className={`mt-[9px] grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[7px] border-[2.5px] border-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#0f172a] active:scale-90 ${
          checked ? "bg-emerald-500 shadow-[2px_2px_0_#047857]" : "bg-white"
        }`}
      >
        {checked && (
          <Check
            className="h-3.5 w-3.5 text-white motion-safe:animate-in motion-safe:zoom-in-50"
            strokeWidth={4}
          />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div
          className={`flex items-center gap-2 py-2 ${hasBody ? "cursor-pointer" : ""}`}
          onClick={() => hasBody && setBodyOpen((prev) => !prev)}
        >
          <span
            className={`text-[1rem] font-semibold ${
              checked
                ? "text-slate-400 line-through decoration-emerald-300 decoration-2"
                : "text-slate-700"
            }`}
          >
            {node.title}
          </span>
          {optional && <OptionalBadge />}
          {hasBody && (
            <ChevronRight
              className={`h-3.5 w-3.5 shrink-0 text-violet-400 transition-transform duration-200 ${bodyOpen ? "rotate-90" : ""}`}
            />
          )}
        </div>
        {node.description && (
          <p
            className={`-mt-1 mb-1.5 text-[0.85rem] font-medium leading-snug ${
              checked ? "text-slate-300" : "text-slate-500"
            }`}
          >
            {node.description}
          </p>
        )}
        {hasBody && (
          <div
            className="grid transition-[grid-template-rows] duration-200 ease-out"
            style={{ gridTemplateRows: bodyOpen ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden px-1 pt-1">
              {node.content && <NodeContent content={node.content} />}
              {langContent?.content && (
                <NodeContent content={langContent.content} />
              )}
              {project && (
                <ProjectCard
                  project={project}
                  checked={checked}
                  onToggleDone={() => onToggle(node.id)}
                />
              )}
              {projectUnresolved && (
                <div className="mb-3 rounded-[14px] border-[2.5px] border-dashed border-slate-400 bg-slate-50 p-4">
                  <span className="rounded-md border-2 border-slate-400 bg-white px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide text-slate-500">
                    Projeto
                  </span>
                  <p className="mt-2 text-[0.86rem] font-medium leading-snug text-slate-600">
                    {/* TODO(Ana): copy do card de projeto indisponivel */}
                    Este projeto está indisponível no momento. Explore outros na
                    página de projetos.
                  </p>
                  <Link
                    href="/projetos"
                    className="mt-3 inline-flex rounded-[9px] border-[2.5px] border-slate-900 bg-white px-3 py-1.5 text-[0.8rem] font-extrabold text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#0f172a]"
                  >
                    Ver projetos
                  </Link>
                </div>
              )}
              {hasResources && (
                <div className="pb-2.5">
                  <ResourceChips resources={node.resources ?? []} />
                </div>
              )}
              {language && hasLangResources && (
                <div className="pb-2.5">
                  <p className="mb-1.5 text-[0.7rem] font-black uppercase tracking-[0.16em] text-slate-400">
                    Recursos para {language.label}
                  </p>
                  <ResourceChips resources={langContent?.resources ?? []} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoadmapNodeItem({
  node,
  done,
  language,
  onToggle,
}: RoadmapNodeItemProps) {
  const isGroup = Boolean(node.children && node.children.length > 0);
  return isGroup ? (
    <GroupItem
      node={node}
      done={done}
      language={language}
      onToggle={onToggle}
    />
  ) : (
    <LeafItem node={node} done={done} language={language} onToggle={onToggle} />
  );
}
