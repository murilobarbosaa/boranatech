import type { ReactNode } from "react";
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

// Cor de acento do item por pagina: SO muda hover (focus, /20) e selecionado
// (checked, /30). Borda, sombra e trigger sao identicos em todo o site (o ponto
// da consistencia). Strings literais completas: o JIT do Tailwind nao gera
// classes montadas em runtime. Hexes -500 dos tokens de pagina (getPageAccentUi),
// no mesmo brilho do amarelo. `yellow` = default #FFB800, inalterado.
export type BntSelectAccent =
  | "yellow"
  | "blue"
  | "green"
  | "violet"
  | "orange"
  | "teal"
  | "pink"
  | "gold";

const accentItemClasses: Record<BntSelectAccent, string> = {
  yellow: "focus:bg-[#FFB800]/20 data-[state=checked]:bg-[#FFB800]/30",
  blue: "focus:bg-[#3b82f6]/20 data-[state=checked]:bg-[#3b82f6]/30",
  green: "focus:bg-[#10b981]/20 data-[state=checked]:bg-[#10b981]/30",
  violet: "focus:bg-[#8b5cf6]/20 data-[state=checked]:bg-[#8b5cf6]/30",
  orange: "focus:bg-[#f97316]/20 data-[state=checked]:bg-[#f97316]/30",
  teal: "focus:bg-[#14b8a6]/20 data-[state=checked]:bg-[#14b8a6]/30",
  pink: "focus:bg-[#ec4899]/20 data-[state=checked]:bg-[#ec4899]/30",
  // Gold (goldenrod, saturado) usa opacidade maior (/25, /40) que as demais: e
  // mais escuro, precisa de mais presenca pra ler como "dourado" e nao lavar.
  gold: "focus:bg-[#DAA520]/25 data-[state=checked]:bg-[#DAA520]/40",
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
  // Cor do item selecionado/hover (default "yellow" = identico a hoje).
  accent?: BntSelectAccent;
  // Icone decorativo a esquerda do valor no trigger (ex.: <MapPin ... />). O
  // BntSelect embrulha em aria-hidden; o nome acessivel segue de label/id.
  leadingIcon?: ReactNode;
};

// Alturas alinhadas ao ui/input.tsx (h-9) para "sm"; "md" um pouco mais alto
// para os filtros de pagina, no espirito do p-3 do GenderSelect.
const sizeClasses: Record<NonNullable<BntSelectProps["size"]>, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-3 text-sm",
};

// Folga de colisao no topo para o header fixo do site (medido constante: 66px em
// todos os breakpoints, z-[1000]). Sem isso, o Radix mede o available-height ate
// a viewport (y=0), e o popup flipado para cima (data-side=top) invade a faixa do
// header e fica atras dele. O header nao e tocado.
const HEADER_OFFSET = 72; // 66px do header + 6px de margem

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
  accent = "yellow",
  leadingIcon,
}: BntSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-label={label}
        className={cn(
          "rounded-xl border-2 border-slate-900 bg-white font-medium text-slate-900 shadow-[2px_2px_0_#0f172a] transition-shadow",
          "data-[placeholder]:text-slate-400",
          "data-[state=open]:shadow-[3px_3px_0_#0f172a]",
          "focus-visible:border-slate-950 focus-visible:ring-slate-950/30 focus-visible:ring-[3px]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
          sizeClasses[size],
          fullWidth ? "w-full" : "w-fit",
          triggerClassName,
          className,
        )}
      >
        {leadingIcon ? (
          // Grupo icone+valor a esquerda; o chevron do primitivo fica a direita
          // (o justify-between do trigger separa este span do chevron). Icone
          // decorativo -> aria-hidden. So embrulhamos quando ha icone, pra nao
          // alterar os selects sem icone (mantem SelectValue como filho direto).
          <span className="flex min-w-0 items-center gap-2">
            <span className="shrink-0" aria-hidden="true">
              {leadingIcon}
            </span>
            <SelectValue placeholder={placeholder} />
          </span>
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent
        sideOffset={0}
        // Folga p/ o header fixo no flip-up: encolhe o available-height do Radix
        // para o popup caber abaixo do header (em vez de medir so ate a viewport).
        // Demais lados = margem padrao do primitivo (CONTENT_MARGIN).
        collisionPadding={{ top: HEADER_OFFSET, right: 8, bottom: 8, left: 8 }}
        className={cn(
          // Popup como card proprio: borda unica e sombra offset solida na mesma
          // linguagem do trigger (shadow-[2px_2px_0_#0f172a]), so que discreta.
          // Le como "mesma familia do trigger", nao como card generico.
          "rounded-xl border-2 border-slate-900 bg-white shadow-[2px_2px_0_#0f172a]",
          // z acima do header fixo (z-[1000]): o Radix propaga o z-index computado
          // do content para o wrapper do popper, entao isso sobe o popup inteiro.
          "z-[1100]",
        )}
      >
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
            className={cn(
              "cursor-pointer rounded-lg text-sm font-medium text-slate-900",
              "focus:text-slate-950 data-[state=checked]:font-bold",
              accentItemClasses[accent],
            )}
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
