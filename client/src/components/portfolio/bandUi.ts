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
