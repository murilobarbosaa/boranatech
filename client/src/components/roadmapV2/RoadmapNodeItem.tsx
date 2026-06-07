import { useState } from "react";
import { Check, ChevronRight, Minus } from "lucide-react";
import type { RoadmapNode } from "@/lib/roadmapV2/types";
import { displayProgress } from "@/lib/roadmapV2/progress";

type RoadmapNodeItemProps = {
  node: RoadmapNode;
  done: Set<string>;
  onToggle: (id: string) => void;
};

function OptionalBadge() {
  return (
    <span className="rounded-md border-2 border-sky-700 bg-sky-100 px-1.5 py-0.5 text-[0.62rem] font-black uppercase tracking-wide text-sky-800">
      Opcional
    </span>
  );
}

function GroupItem({ node, done, onToggle }: RoadmapNodeItemProps) {
  const [open, setOpen] = useState(false);
  const progress = displayProgress(node, done);
  const complete = progress.total > 0 && progress.done === progress.total;
  const partial = progress.done > 0 && progress.done < progress.total;
  const optional = node.optional === true;
  const showCount = progress.total > 0;

  return (
    <div className="my-0.5">
      <div
        className="flex cursor-pointer select-none items-center gap-3 py-2.5"
        onClick={() => setOpen((prev) => !prev)}
      >
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
        <span
          className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[7px] border-[2.5px] border-slate-900 shadow-[2px_2px_0_#0f172a] ${
            complete ? "bg-emerald-500 shadow-[2px_2px_0_#047857]" : partial ? "bg-[#FFB800]" : "bg-white"
          }`}
        >
          {complete && <Check className="h-3.5 w-3.5 text-white" strokeWidth={4} />}
          {partial && <Minus className="h-3 w-3 text-slate-900" strokeWidth={4} />}
        </span>
        <span className="text-[1.05rem] font-extrabold text-slate-900">{node.title}</span>
        <span className="ml-auto flex items-center gap-2">
          {optional && <OptionalBadge />}
          {showCount && (
            <span
              className={`rounded-[7px] border-2 border-slate-900 px-2 py-0.5 text-[0.72rem] font-extrabold ${
                complete ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
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
        <div className="overflow-hidden">
          <div className="ml-[12px] border-l-[2.5px] border-dashed border-slate-300 pl-4">
            {node.children?.map((child) => (
              <RoadmapNodeItem key={child.id} node={child} done={done} onToggle={onToggle} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeafItem({ node, done, onToggle }: RoadmapNodeItemProps) {
  const [resOpen, setResOpen] = useState(false);
  const checked = done.has(node.id);
  const optional = node.optional === true;
  const hasResources = Boolean(node.resources && node.resources.length > 0);

  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        aria-pressed={checked}
        aria-label={checked ? `Desmarcar ${node.title}` : `Marcar ${node.title}`}
        onClick={() => onToggle(node.id)}
        className={`mt-[9px] grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[7px] border-[2.5px] border-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#0f172a] ${
          checked ? "bg-emerald-500 shadow-[2px_2px_0_#047857]" : "bg-white"
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={4} />}
      </button>
      <div className="min-w-0 flex-1">
        <div
          className={`flex items-center gap-2 py-2 ${hasResources ? "cursor-pointer" : ""}`}
          onClick={() => hasResources && setResOpen((prev) => !prev)}
        >
          <span
            className={`text-[1rem] font-semibold ${
              checked ? "text-slate-400 line-through decoration-emerald-300 decoration-2" : "text-slate-700"
            }`}
          >
            {node.title}
          </span>
          {optional && <OptionalBadge />}
          {hasResources && (
            <ChevronRight
              className={`h-3.5 w-3.5 shrink-0 text-violet-400 transition-transform duration-200 ${resOpen ? "rotate-90" : ""}`}
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
        {hasResources && (
          <div
            className="grid transition-[grid-template-rows] duration-200 ease-out"
            style={{ gridTemplateRows: resOpen ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div className="flex flex-wrap gap-2 pb-2.5">
                {node.resources?.map((resource) => (
                  <a
                    key={`${resource.label}-${resource.url}`}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-[7px] border-2 border-slate-900 bg-violet-100 px-3 py-1.5 text-[0.78rem] font-extrabold text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#0f172a]"
                  >
                    {resource.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoadmapNodeItem({ node, done, onToggle }: RoadmapNodeItemProps) {
  const isGroup = Boolean(node.children && node.children.length > 0);
  return isGroup ? (
    <GroupItem node={node} done={done} onToggle={onToggle} />
  ) : (
    <LeafItem node={node} done={done} onToggle={onToggle} />
  );
}
