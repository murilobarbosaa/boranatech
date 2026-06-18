import { Award, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmbaixadoraBadge({
  program = "IBM Z Xplore",
  href,
  className,
}: {
  program?: string;
  href?: string;
  className?: string;
}) {
  const label = `Ana é Embaixadora ${program}`;
  const base =
    "inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a]";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          base,
          "transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2",
          className,
        )}
      >
        <Award className="h-3.5 w-3.5" aria-hidden />
        {label}
        <ExternalLink className="h-3 w-3" aria-hidden />
      </a>
    );
  }

  return (
    <span className={cn(base, className)}>
      <Award className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}
