import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { PageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

// Eyebrow padrao de secao: uppercase font-black com tracking padronizado
// (default 0.18em, o meio-termo das referencias). Com ac, o texto e o icone
// ganham a cor de accent (ac.iconMuted), como nas zonas de AreaDetalhe.

interface SectionLabelProps {
  icon?: LucideIcon;
  ac?: PageAccentUi;
  className?: string;
  children: ReactNode;
}

export default function SectionLabel({
  icon: Icon,
  ac,
  className,
  children,
}: SectionLabelProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em]",
        ac?.iconMuted ?? "text-slate-600",
        className,
      )}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
      {children}
    </p>
  );
}
