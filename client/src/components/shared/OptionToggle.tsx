import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Botao-opcao de intake extraido do RoadmapIA/RoadmapsV2 (Dialeto 2): toggle
// brutal com aria-pressed, ativo no amarelo oficial de acao.

interface OptionToggleProps {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export default function OptionToggle({
  active,
  onClick,
  disabled = false,
  className,
  children,
}: OptionToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-[11px] border-[2.5px] border-slate-900 px-4 py-2.5 text-sm font-extrabold shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-60",
        active ? "bg-[#FFB800] text-slate-950" : "bg-white text-slate-600",
        className,
      )}
    >
      {children}
    </button>
  );
}
