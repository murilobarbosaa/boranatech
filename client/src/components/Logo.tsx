import { Compass } from "lucide-react";

type LogoVariant = "light" | "dark";
type LogoSize = "sm" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  showTagline?: boolean;
}

const SIZE_CLASSES: Record<LogoSize, { circle: string; icon: string; text: string; tagline: string; gap: string }> = {
  sm: {
    circle: "h-9 w-9",
    icon: "h-5 w-5",
    text: "text-sm leading-tight",
    tagline: "text-xs",
    gap: "gap-2",
  },
  lg: {
    circle: "h-12 w-12 md:h-14 md:w-14",
    icon: "h-6 w-6 md:h-7 md:w-7",
    text: "text-3xl md:text-5xl",
    tagline: "text-xs md:text-sm",
    gap: "gap-3",
  },
};

const VARIANT_TEXT: Record<LogoVariant, { brand: string; bang: string; tagline: string }> = {
  light: {
    brand: "text-slate-900",
    bang: "text-slate-900",
    tagline: "text-slate-500",
  },
  dark: {
    brand: "text-white",
    bang: "text-amber-400",
    tagline: "text-slate-400",
  },
};

export default function Logo({ variant = "light", size = "sm", showTagline = false }: LogoProps) {
  const sizes = SIZE_CLASSES[size];
  const colors = VARIANT_TEXT[variant];

  return (
    <span className={`inline-flex items-center ${sizes.gap}`}>
      <span
        className={`flex items-center justify-center rounded-full border-2 border-slate-900 bg-yellow-400 shadow-[2px_2px_0_#0f172a] transition-all group-hover:shadow-[4px_4px_0_#0f172a] ${sizes.circle}`}
      >
        <Compass className={`text-slate-950 ${sizes.icon}`} />
      </span>
      <span className={`font-display font-black uppercase ${sizes.text} ${colors.brand}`}>
        BORA NA TECH<span className={colors.bang}>?</span>
        {showTagline ? (
          <span className={`block font-bold tracking-normal normal-case ${sizes.tagline} ${colors.tagline}`}>
            Sua Bússola na TI
          </span>
        ) : null}
      </span>
    </span>
  );
}
