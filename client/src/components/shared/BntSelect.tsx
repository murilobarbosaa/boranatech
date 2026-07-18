import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type BntSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type BntSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: BntSelectOption[];
  placeholder?: string;
  // Rotulo acessivel (vira aria-label do trigger). Se a pagina ja tem um
  // <label htmlFor>, passe `id` em vez disso.
  label?: string;
  id?: string;
  disabled?: boolean;
  // Merge via cn(): estas classes vencem as base sem sobrescrever tudo.
  className?: string;
  triggerClassName?: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
};

// Alturas alinhadas ao ui/input.tsx (h-9) para "sm"; "md" um pouco mais alto
// para os filtros de pagina, no espirito do p-3 do GenderSelect.
const sizeClasses: Record<NonNullable<BntSelectProps["size"]>, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-3 text-sm",
};

// Wrapper de select do design system: encapsula o primitivo Radix (ui/select.tsx,
// intocado) e aplica a assinatura visual do site (borda 2px slate-950, cantos
// arredondados, sombra offset solida). NAO aceita option.value vazio: o Radix
// Select proibe value="" em SelectItem; a pagina deve mapear "" <-> sentinela na
// borda antes de passar as options.
export function BntSelect({
  value,
  onValueChange,
  options,
  placeholder,
  label,
  id,
  disabled,
  className,
  triggerClassName,
  size = "md",
  fullWidth = true,
}: BntSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-label={label}
        className={cn(
          "rounded-xl border-2 border-slate-950 bg-white font-medium text-slate-900 shadow-[4px_4px_0_#0f172a]",
          "data-[placeholder]:text-slate-400",
          "focus-visible:border-slate-950 focus-visible:ring-slate-950/30 focus-visible:ring-[3px]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
          sizeClasses[size],
          fullWidth ? "w-full" : "w-fit",
          triggerClassName,
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className={cn(
          "rounded-xl border-2 border-slate-950 bg-white shadow-[4px_4px_0_#0f172a]",
        )}
      >
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
            className={cn(
              "cursor-pointer rounded-lg text-sm font-medium text-slate-900",
              "focus:bg-[#FFB800]/20 focus:text-slate-950",
              "data-[state=checked]:bg-[#FFB800]/30 data-[state=checked]:font-bold",
            )}
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
