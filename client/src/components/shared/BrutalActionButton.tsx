import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// O botao de acao primaria da casa (fundacao do redesign). Duas variantes de
// CONTRATO: "primary" e o amarelo oficial de acao (#FFB800) e "ai" e a acao de
// IA (violet-600). Anatomia unica: rounded-[11px] + border-[2.5px] preta +
// sombra flat #0f172a com hover-lift. Nenhuma outra cor entra aqui, exceto
// via accentClass: opt-in explicito da pagina que troca SO as cores do
// variant (bg/texto/ring) pelo acento local; sem a prop, nada muda.

interface BrutalActionButtonProps {
  variant?: "primary" | "ai";
  type?: "button" | "submit";
  disabled?: boolean;
  // Mostra Loader2 girando no lugar do icone e desabilita o clique.
  loading?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
  // Substitui as classes de cor do variant (bg/texto/ring) pelo acento da
  // pagina. Default: as cores do variant, render identico ao de sempre.
  accentClass?: string;
  className?: string;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<"primary" | "ai", string> = {
  primary: "bg-[#FFB800] text-slate-950 focus-visible:ring-amber-300",
  ai: "bg-violet-600 text-white focus-visible:ring-violet-300",
};

export default function BrutalActionButton({
  variant = "primary",
  type = "button",
  disabled = false,
  loading = false,
  icon,
  onClick,
  accentClass,
  className,
  children,
}: BrutalActionButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "bnt-pressable inline-flex items-center justify-center gap-2 rounded-[11px] border-[2.5px] border-slate-900 px-5 py-2.5 text-sm font-black shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_#0f172a]",
        accentClass ?? VARIANT_CLASSES[variant],
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
