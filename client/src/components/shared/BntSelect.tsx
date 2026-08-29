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
  /**
   * Classes do POPUP (SelectContent). Existe porque `className` cai no trigger,
   * e quem abre um select dentro de um modal precisa subir o popup acima dele:
   * o default `z-[1100]` foi pensado para select na pagina (acima do header
   * `z-[1000]`), e fica ATRAS de um modal em `z-[2000]`. Opcional; sem ela nada
   * muda.
   */
  contentClassName?: string;
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

/**
 * Descarta option com value vazio ANTES de chegar ao Radix.
 *
 * O Radix lanca `A <Select.Item /> must have a value prop that is not an empty
 * string` de dentro do render, e um throw no render derruba a arvore inteira:
 * um filtro com uma opcao torta apagava a pagina do admin, nao o filtro.
 *
 * Por que aqui e nao na pagina: a regra "mapeie '' <-> sentinela antes de passar
 * as options" ja estava escrita neste arquivo, mas escrita como instrucao para o
 * CHAMADOR, e guarda no call site cobre so os chamadores que alguem lembrou de
 * proteger. Sao 20+ call sites hoje e os proximos ainda nao existem. E a regra do
 * CLAUDE.md: protecao DENTRO da funcao, nunca no call site. Os chamadores que ja
 * mapeiam sentinela continuam funcionando iguais; este filtro so age no caso que
 * hoje quebra.
 *
 * Descarta em vez de substituir por sentinela: inventar um value aqui criaria uma
 * opcao selecionavel que a pagina nao sabe interpretar, e o `onValueChange`
 * devolveria um valor que ninguem trata. Sumir com a opcao invalida degrada; um
 * value inventado propaga o defeito para dentro do estado da pagina.
 *
 * NAO e silencioso: avisa no console nomeando o rotulo, para o descarte ser
 * rastreavel ate a origem em vez de virar "a opcao sumiu e ninguem sabe por que".
 */
export function opcoesRenderizaveis(
  options: readonly BntSelectOption[],
): BntSelectOption[] {
  const validas: BntSelectOption[] = [];
  for (const opt of options) {
    if (typeof opt.value === "string" && opt.value.length > 0) {
      validas.push(opt);
      continue;
    }
    console.warn(
      `[BntSelect] opcao descartada por value vazio (label: ${String(opt.label)}). ` +
        `Mapeie "" para uma sentinela na pagina antes de passar as options.`,
    );
  }
  return validas;
}

// Wrapper de select do design system: encapsula o primitivo Radix (ui/select.tsx,
// intocado) e aplica a assinatura visual do site (borda 2px slate-950, cantos
// arredondados, sombra offset solida). Option com value vazio e DESCARTADA por
// `opcoesRenderizaveis` (o Radix proibe, e o throw dele derruba a pagina); a
// pagina continua devendo mapear "" <-> sentinela para a opcao aparecer.
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
  contentClassName,
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
          "rounded-xl border-2 border-slate-900 bg-white font-medium text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)] transition-shadow",
          "data-[placeholder]:text-slate-400",
          "data-[state=open]:shadow-[3px_3px_0_var(--bnt-shadow)]",
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
          // linguagem do trigger (shadow-[2px_2px_0_var(--bnt-shadow)]), so que discreta.
          // Le como "mesma familia do trigger", nao como card generico.
          "rounded-xl border-2 border-slate-900 bg-white shadow-[2px_2px_0_var(--bnt-shadow)]",
          // z acima do header fixo (z-[1000]): o Radix propaga o z-index computado
          // do content para o wrapper do popper, entao isso sobe o popup inteiro.
          "z-[1100]",
          // Sobe mais quando o select vive dentro de um modal.
          contentClassName,
        )}
      >
        {opcoesRenderizaveis(options).map((opt) => (
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
