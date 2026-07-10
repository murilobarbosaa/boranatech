import type { ScoreBandUi } from "@/components/shared/ScoreCard";
import type { ScoreBand } from "@shared/github/schema";

// Mapa faixa->cor do analisador de GitHub, preservado byte a byte do antigo
// ScoreCard do portfolio. Modulo proprio para a pagina (nota-hero) e o
// historico (chip de faixa) consumirem a MESMA fonte.
export const BAND_UI: Record<ScoreBand, ScoreBandUi> = {
  comecando: { label: "Começando", cardBg: "bg-red-100", chipBg: "bg-red-300" },
  evoluindo: {
    label: "Evoluindo",
    cardBg: "bg-amber-100",
    chipBg: "bg-amber-300",
  },
  bom: { label: "Bom", cardBg: "bg-sky-100", chipBg: "bg-sky-300" },
  destaque: {
    label: "Destaque",
    cardBg: "bg-emerald-100",
    chipBg: "bg-emerald-300",
  },
};

export function isScoreBand(value: unknown): value is ScoreBand {
  return typeof value === "string" && value in BAND_UI;
}

// Wash do cenario do estado de resultado, colorido pela FAIXA da nota: o
// mesmo eixo semantico de cor do BAND_UI, na familia de opacidade do cenario
// da entrada (30-45), sempre com fade antes das areas densas (unica fonte;
// nenhuma cor de wash hardcoded fora daqui).
export const BAND_WASH: Record<ScoreBand, string> = {
  comecando: "from-rose-200/40",
  evoluindo: "from-amber-200/40",
  bom: "from-sky-200/40",
  destaque: "from-emerald-200/40",
};
