import {
  FAIXA_LABELS,
  type LinkedinFaixa,
} from "@shared/linkedin/schema";

// Mapa faixa->cor do analisador de LinkedIn, extraido do LinkedinScoreCard
// para modulo proprio (irmao do bandUi do portfolio): score card, nota-hero,
// vitrine e cenario do resultado consomem a MESMA fonte.
export interface LinkedinFaixaUi {
  cardBg: string;
  chipBg: string;
}

export const FAIXA_UI: Record<LinkedinFaixa, LinkedinFaixaUi> = {
  inicio: { cardBg: "bg-red-100", chipBg: "bg-red-300" },
  "em-construcao": { cardBg: "bg-amber-100", chipBg: "bg-amber-300" },
  forte: { cardBg: "bg-sky-100", chipBg: "bg-sky-300" },
  magnetico: { cardBg: "bg-emerald-100", chipBg: "bg-emerald-300" },
};

// Wash do cenario do estado de resultado, colorido pela FAIXA da nota: o
// mesmo eixo semantico de cor do FAIXA_UI, na familia de opacidade do cenario
// da entrada, sempre com fade antes das areas de leitura densa (unica fonte;
// nenhuma cor de wash hardcoded fora daqui). Espelho do BAND_WASH do GitHub.
export const FAIXA_WASH: Record<LinkedinFaixa, string> = {
  inicio: "from-rose-200/40",
  "em-construcao": "from-amber-200/40",
  forte: "from-sky-200/40",
  magnetico: "from-emerald-200/40",
};

// Fallbacks neutros: uma faixa que o bundle ainda nao conhece pinta cinza em
// vez de derrubar a pagina.
const FAIXA_UI_FALLBACK: LinkedinFaixaUi = {
  cardBg: "bg-slate-100",
  chipBg: "bg-slate-300",
};
const FAIXA_WASH_FALLBACK = "from-slate-200/40";

/**
 * Resolvers de faixa. A faixa chega do SERVIDOR e tambem do `result` jsonb
 * persistido, entao acesso direto ao mapa quebra a pagina inteira quando um
 * valor novo aparece antes do deploy do front (regra "Lookups por valor do
 * servidor" do CLAUDE.md; ja houve incidente real com STATUS_META no admin).
 * Molde de notificationTypeMetaOf.
 */
export function faixaUiOf(faixa: string): LinkedinFaixaUi {
  return FAIXA_UI[faixa as LinkedinFaixa] ?? FAIXA_UI_FALLBACK;
}

export function faixaWashOf(faixa: string): string {
  return FAIXA_WASH[faixa as LinkedinFaixa] ?? FAIXA_WASH_FALLBACK;
}

/**
 * Rotulo da faixa, com o mesmo contrato dos dois acima.
 *
 * Faltava, e a ausencia deixava `LinkedinScoreCard` e `LinkedinScoreHero`
 * lendo `FAIXA_LABELS[faixa]` direto. O dano nao e igual nos dois casos, e a
 * diferenca vale registrar: `{FAIXA_LABELS[faixa]}` cru dentro do JSX rende
 * NADA quando o valor e desconhecido (React ignora `undefined`), entao aquele
 * era um chip vazio. Ja `const ui = FAIXA_UI[faixa]` seguido de `ui.chipBg`
 * LANCA, e throw no render derruba a arvore inteira: e literalmente a forma do
 * incidente do `STATUS_META[item.status].label` no admin, latente aqui.
 *
 * Nao ha rotulo neutro bom para faixa desconhecida, entao a string vazia e
 * deliberada: melhor um chip sem texto (que e o comportamento atual do caso
 * degenerado) do que inventar um nome de faixa que a regua nao tem.
 */
const FAIXA_LABEL_FALLBACK = "";

export function faixaLabelOf(faixa: string): string {
  return FAIXA_LABELS[faixa as LinkedinFaixa] ?? FAIXA_LABEL_FALLBACK;
}
