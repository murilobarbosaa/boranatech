import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Pill de status generalizada do StatusBadge do RoadmapIA: mapa fixo de kind
// para cor, pill rounded-full com borda fina preta. O label vem por children
// (a copy fica no call site).

export type StatusPillKind =
  | "ready"
  | "done"
  | "partial"
  | "failed"
  | "generating"
  | "stalled"
  | "active"
  | "completed"
  | "archived";

const KIND_STYLES: Record<StatusPillKind, string> = {
  ready: "bg-emerald-100 text-emerald-800",
  done: "bg-violet-100 text-violet-800",
  partial: "bg-amber-100 text-amber-800",
  failed: "bg-rose-100 text-rose-800",
  generating: "bg-sky-100 text-sky-800",
  stalled: "bg-slate-100 text-slate-600",
  active: "bg-blue-100 text-blue-900",
  completed: "bg-emerald-100 text-emerald-900",
  archived: "bg-slate-100 text-slate-600",
};

interface StatusPillProps {
  kind: StatusPillKind;
  className?: string;
  children: ReactNode;
}

export default function StatusPill({
  kind,
  className,
  children,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "rounded-full border-[1.5px] border-slate-900 px-2 py-0.5 text-[11px] font-black",
        KIND_STYLES[kind],
        className,
      )}
    >
      {children}
    </span>
  );
}
