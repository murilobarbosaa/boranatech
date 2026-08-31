import { motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type Variant = "desktop" | "mobile";

const TRACK: Record<Variant, string> = {
  desktop: "h-10 w-[4.5rem] px-1",
  mobile: "h-9 w-16 px-1",
};

const KNOB: Record<Variant, string> = {
  desktop: "h-7 w-7",
  mobile: "h-6 w-6",
};

const ICON: Record<Variant, string> = {
  desktop: "h-4 w-4",
  mobile: "h-3.5 w-3.5",
};

export default function ThemeToggle({
  variant = "desktop",
}: {
  variant?: Variant;
}) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const isDark = resolvedTheme === "dark";
  // TODO(Ana): validar textos do aria-label e title do botao de tema
  const label = isDark ? "Ativar modo claro" : "Ativar modo escuro";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      className={`relative inline-flex items-center rounded-full border-2 border-ink bg-white shadow-[2px_2px_0_var(--bnt-shadow)] transition-shadow hover:shadow-[3px_3px_0_var(--bnt-shadow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${TRACK[variant]} ${isDark ? "justify-end" : "justify-start"}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-between px-2.5 text-slate-400"
      >
        <Sun className={ICON[variant]} />
        <Moon className={ICON[variant]} />
      </span>
      <motion.span
        layout
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 520, damping: 32 }
        }
        className={`relative z-10 flex items-center justify-center rounded-full border-2 border-ink bg-accent text-ink-on-accent ${KNOB[variant]}`}
      >
        {isDark ? (
          <Moon className={ICON[variant]} aria-hidden="true" />
        ) : (
          <Sun className={ICON[variant]} aria-hidden="true" />
        )}
      </motion.span>
    </button>
  );
}
