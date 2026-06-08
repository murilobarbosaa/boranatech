import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmbaixadoraBadge({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a]",
        className,
      )}
    >
      <Award className="h-3.5 w-3.5" aria-hidden />
      Embaixadora IBM Z Xplore
    </span>
  );
}
