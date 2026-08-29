import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type Variant = "desktop" | "mobile";

const BASE =
  "inline-flex items-center justify-center rounded-full border-2 border-slate-900 bg-white text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)] transition-all hover:shadow-[3px_3px_0_var(--bnt-shadow)]";

const SIZE: Record<Variant, string> = {
  desktop: "h-10 w-10",
  mobile: "h-9 w-9",
};

export default function ThemeToggle({
  variant = "desktop",
}: {
  variant?: Variant;
}) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  // TODO(Ana): validar textos do aria-label e title do botao de tema
  const label = isDark ? "Ativar modo claro" : "Ativar modo escuro";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      className={`${BASE} ${SIZE[variant]}`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
