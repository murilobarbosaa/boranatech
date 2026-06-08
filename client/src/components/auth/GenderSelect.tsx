import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GENDER_OPTIONS } from "@/lib/authSchemas";
import { cn } from "@/lib/utils";

interface GenderSelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
  id?: string;
  ariaLabel?: string;
  hasError?: boolean;
}

export function GenderSelect({
  value,
  onChange,
  id,
  ariaLabel,
  hasError,
}: GenderSelectProps) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        aria-label={ariaLabel ?? "Como você se identifica?"}
        className={cn(
          "h-auto w-full cursor-pointer rounded-xl border-2 border-slate-300 bg-white p-3 text-sm font-medium text-slate-700 data-[placeholder]:text-slate-400",
          hasError && "border-red-500",
        )}
      >
        <SelectValue placeholder="Selecione..." />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-2 border-slate-300">
        {GENDER_OPTIONS.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="cursor-pointer text-sm font-medium"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
