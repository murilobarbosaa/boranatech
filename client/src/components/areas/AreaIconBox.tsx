import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { accentForAreaSlug } from "@/lib/detailPageAccents";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import type { AreaGridPalette } from "@/lib/areaGridPalette";

// Duas formas de dizer a cor, e exatamente uma por chamada:
//
//   `areaSlug`  caminho original, intacto. A cor sai de accentForAreaSlug e das
//               10 familias de pageAccentUi. E o que AreaDetalhe, SubAreaDetalhe
//               e TecnologiaMapa usam.
//   `palette`   trio de classes explicito. Existe porque a grade de /areas
//               precisa de uma cor POR CARD, em 17 familias, e 18 dos 44 cards
//               (areasComplementares e areasPoucoConhecidas) nao tem slug
//               nenhum para chavear.
//
// A uniao e o que faz o `tsc` recusar as duas juntas e recusar nenhuma das
// duas. Deixar os dois campos opcionais no mesmo objeto compilaria uma chamada
// sem cor, que cairia em silencio no violeta do fallback de accentForAreaSlug.
type AreaIconBoxProps = {
  icon: LucideIcon;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
} & (
  | { areaSlug: string; palette?: undefined }
  | { areaSlug?: undefined; palette: AreaGridPalette }
);

const SIZES = {
  xs: {
    box: "h-7 w-7 rounded-lg",
    icon: "h-4 w-4",
    shadow: "shadow-[1px_1px_0_currentColor]",
  },
  sm: {
    box: "h-10 w-10 rounded-xl",
    icon: "h-5 w-5",
    shadow: "shadow-[2px_2px_0_currentColor]",
  },
  md: {
    box: "h-14 w-14 rounded-2xl",
    icon: "h-7 w-7",
    shadow: "shadow-[3px_3px_0_currentColor]",
  },
  lg: {
    box: "h-16 w-16 rounded-2xl",
    icon: "h-8 w-8",
    shadow: "shadow-[3px_3px_0_currentColor]",
  },
};

function coresDoSlug(areaSlug: string): AreaGridPalette {
  const ac = getPageAccentUi(accentForAreaSlug(areaSlug));
  return { bg: ac.panelSoft, text: ac.iconMuted, border: ac.panelBorder };
}

export function AreaIconBox(props: AreaIconBoxProps) {
  const { icon: Icon, size = "lg", className } = props;
  const cores = props.palette ?? coresDoSlug(props.areaSlug);
  const s = SIZES[size];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border-2",
        s.box,
        s.shadow,
        cores.border,
        cores.bg,
        cores.text,
        className,
      )}
      aria-hidden
    >
      <Icon className={s.icon} strokeWidth={2.5} />
    </span>
  );
}
