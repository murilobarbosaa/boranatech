import type { PageHeroAccent } from "@/components/shared/PageHero";
import { pageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

interface FilterPillsProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  /** Se definido, o estado ativo/inativo segue a paleta da página. */
  accent?: PageHeroAccent;
  /** Mapa opcional de rotulo visivel por valor. */
  labels?: Record<string, string>;
}

export default function FilterPills({
  options,
  value,
  onChange,
  accent,
  labels,
}: FilterPillsProps) {
  const ui = accent ? pageAccentUi[accent] : null;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all",
            value === option
              ? (ui?.filterActive ??
                  "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0_#0f172a]")
              : (ui?.filterInactive ??
                  "border-slate-300 bg-white text-slate-700 hover:border-slate-500"),
          )}
        >
          {labels?.[option] ?? option}
        </button>
      ))}
    </div>
  );
}
