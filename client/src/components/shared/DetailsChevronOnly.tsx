import { ChevronRight } from "lucide-react";
import { useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

type DetailsChevronOnlyProps = {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  summaryClassName?: string;
  defaultOpen?: boolean;
};

/** Details nativo: apenas o botão da seta expande ou recolhe o conteúdo. */
export function DetailsChevronOnly({
  title,
  children,
  className = "",
  summaryClassName = "",
  defaultOpen = false,
}: DetailsChevronOnlyProps) {
  const [open, setOpen] = useState(defaultOpen);

  const blockSummaryToggle = (e: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
    e.preventDefault();
  };

  return (
    <details className={className} open={open}>
      <summary
        className={`list-none [&::-webkit-details-marker]:hidden ${summaryClassName}`}
        onClick={blockSummaryToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            blockSummaryToggle(e);
          }
        }}
      >
        <span className="flex items-start gap-3">
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Recolher seção" : "Expandir seção"}
            className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 bg-white text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen((o) => !o);
            }}
          >
            <ChevronRight
              className={`h-5 w-5 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
              strokeWidth={2.5}
              aria-hidden
            />
          </button>
          <span className="min-w-0 flex-1 cursor-default select-text">{title}</span>
        </span>
      </summary>
      {children}
    </details>
  );
}
