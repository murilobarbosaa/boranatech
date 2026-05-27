import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { accentForAreaSlug } from "@/lib/detailPageAccents";
import { getPageAccentUi } from "@/lib/pageAccentUi";

interface AreaIconBoxProps {
  icon: LucideIcon;
  areaSlug: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  emoji?: string;
}

const SIZES = {
  xs: { box: "h-7 w-7 rounded-lg", icon: "h-4 w-4", shadow: "shadow-[1px_1px_0_currentColor]", badge: "h-4 w-4 text-[10px] -bottom-1 -right-1" },
  sm: { box: "h-10 w-10 rounded-xl", icon: "h-5 w-5", shadow: "shadow-[2px_2px_0_currentColor]", badge: "h-5 w-5 text-xs -bottom-1.5 -right-1.5" },
  md: { box: "h-14 w-14 rounded-2xl", icon: "h-7 w-7", shadow: "shadow-[3px_3px_0_currentColor]", badge: "h-7 w-7 text-base -bottom-2 -right-2" },
  lg: { box: "h-16 w-16 rounded-2xl", icon: "h-8 w-8", shadow: "shadow-[3px_3px_0_currentColor]", badge: "h-8 w-8 text-lg -bottom-2 -right-2" },
};

export function AreaIconBox({ icon: Icon, areaSlug, size = "lg", className, emoji }: AreaIconBoxProps) {
  const accent = accentForAreaSlug(areaSlug);
  const ac = getPageAccentUi(accent);
  const s = SIZES[size];

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center border-2",
        s.box,
        s.shadow,
        ac.panelBorder,
        ac.panelSoft,
        ac.iconMuted,
        className,
      )}
      aria-hidden
    >
      <Icon className={s.icon} strokeWidth={2.5} />
      {emoji ? (
        <span
          className={cn(
            "absolute inline-flex items-center justify-center rounded-full border-2 border-slate-900 bg-white leading-none shadow-[1px_1px_0_#0f172a]",
            s.badge,
          )}
        >
          {emoji}
        </span>
      ) : null}
    </span>
  );
}
