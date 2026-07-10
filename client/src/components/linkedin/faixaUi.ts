import type { LinkedinFaixa } from "@shared/linkedin/schema";

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
