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

// Wash quase imperceptivel da coluna do alvo do nota-hero: mesmo eixo
// semantico por faixa, na familia *-50/60 (bem abaixo do BAND_WASH) para o
// texto slate-950 seguir com contraste folgado. Classe pronta por faixa, sem
// cor calculada em runtime.
export const BAND_WASH_SOFT: Record<ScoreBand, string> = {
  comecando: "bg-red-50/60",
  evoluindo: "bg-amber-50/60",
  bom: "bg-sky-50/60",
  destaque: "bg-emerald-50/60",
};

// ---------------------------------------------------------------------------
// Resolvers. A band chega do SERVIDOR e tambem do `result` jsonb persistido
// (`GithubHistory` le `analysis.faixa` de linha gravada), entao acesso direto
// ao mapa quebra a pagina quando um valor novo aparece antes do deploy do
// front. Regra "Lookups por valor do servidor" do CLAUDE.md; molde de
// `faixaUiOf` do LinkedIn e de `notificationTypeMetaOf`.
//
// O dano NAO e uniforme, e a diferenca decide a prioridade: `BAND_UI[b].label`
// LANCA (throw no render derruba a arvore inteira), enquanto `BAND_WASH[b]`
// devolve `undefined` e vira uma classe a menos. O primeiro e a forma exata do
// incidente do `STATUS_META[item.status].label` no admin.
// ---------------------------------------------------------------------------

const BAND_UI_FALLBACK: ScoreBandUi = {
  label: "",
  cardBg: "bg-slate-100",
  chipBg: "bg-slate-300",
};
const BAND_WASH_FALLBACK = "from-slate-200/40";
const BAND_WASH_SOFT_FALLBACK = "bg-slate-50/60";

export function bandUiOf(band: string): ScoreBandUi {
  return BAND_UI[band as ScoreBand] ?? BAND_UI_FALLBACK;
}

export function bandWashOf(band: string): string {
  return BAND_WASH[band as ScoreBand] ?? BAND_WASH_FALLBACK;
}

export function bandWashSoftOf(band: string): string {
  return BAND_WASH_SOFT[band as ScoreBand] ?? BAND_WASH_SOFT_FALLBACK;
}
