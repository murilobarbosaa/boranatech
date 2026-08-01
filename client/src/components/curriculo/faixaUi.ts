import {
  RESUME_FAIXA_LABELS,
  type ResumeFaixa,
} from "@shared/resumeAnalysis/schema";

/**
 * Mapa faixa->cor e rotulo do Analisador de Curriculo, com resolvers.
 *
 * Extraido de dentro do `ResumeScoreCard`, onde era um `const` local lido
 * direto (`const ui = FAIXA_UI[faixa]` seguido de `ui.chipBg`). A faixa chega
 * do SERVIDOR e do `result` persistido, entao um valor novo antes do deploy do
 * front LANCA e derruba a arvore inteira. E a forma exata do incidente do
 * `STATUS_META[item.status].label` no admin, e o irmao deste modulo no LinkedIn
 * (`components/linkedin/faixaUi.ts`) ja existia com a protecao.
 *
 * O rotulo degrada diferente do fundo: `{RESUME_FAIXA_LABELS[faixa]}` cru
 * dentro do JSX rende NADA (React ignora `undefined`), entao aquele caso era
 * chip vazio, nao tela branca. Os dois passam a resolver pelo mesmo caminho.
 */
export interface ResumeFaixaUi {
  cardBg: string;
  chipBg: string;
}

export const RESUME_FAIXA_UI: Record<ResumeFaixa, ResumeFaixaUi> = {
  inicio: { cardBg: "bg-red-100", chipBg: "bg-red-300" },
  "em-construcao": { cardBg: "bg-amber-100", chipBg: "bg-amber-300" },
  forte: { cardBg: "bg-sky-100", chipBg: "bg-sky-300" },
  magnetico: { cardBg: "bg-emerald-100", chipBg: "bg-emerald-300" },
};

const RESUME_FAIXA_UI_FALLBACK: ResumeFaixaUi = {
  cardBg: "bg-slate-100",
  chipBg: "bg-slate-300",
};

/** Sem rotulo neutro bom para faixa desconhecida: string vazia e deliberada. */
const RESUME_FAIXA_LABEL_FALLBACK = "";

export function resumeFaixaUiOf(faixa: string): ResumeFaixaUi {
  return RESUME_FAIXA_UI[faixa as ResumeFaixa] ?? RESUME_FAIXA_UI_FALLBACK;
}

export function resumeFaixaLabelOf(faixa: string): string {
  return (
    RESUME_FAIXA_LABELS[faixa as ResumeFaixa] ?? RESUME_FAIXA_LABEL_FALLBACK
  );
}
