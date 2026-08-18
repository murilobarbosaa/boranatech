import {
  LinkedinFaixaSchema,
  faixaFromScore,
  type LinkedinFaixa,
} from "./schema";

export interface LinkedinScoreState {
  valid: boolean;
  score: number | null;
  faixa: LinkedinFaixa | null;
  /** null significa legado/ausente ou carimbo inválido; nunca versão atual. */
  deterministicVersion: number | null;
  notaIncompleta: boolean;
}

function readVersion(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

/** Fonte única para interpretar nota, faixa, versão e estado pendente. */
export function readLinkedinScoreState(raw: {
  score?: unknown;
  faixa?: unknown;
  deterministicVersion?: unknown;
  notaIncompleta?: unknown;
}): LinkedinScoreState {
  const deterministicVersion = readVersion(raw.deterministicVersion);
  const notaIncompleta = raw.notaIncompleta === true;
  const score = raw.score;
  const faixa = LinkedinFaixaSchema.safeParse(raw.faixa);
  const pairValid =
    typeof score === "number" &&
    Number.isFinite(score) &&
    Number.isInteger(score) &&
    score >= 0 &&
    score <= 100 &&
    faixa.success &&
    faixa.data === faixaFromScore(score);

  return pairValid
    ? {
        valid: true,
        score,
        faixa: faixa.data,
        deterministicVersion,
        notaIncompleta,
      }
    : {
        valid: false,
        score: null,
        faixa: null,
        deterministicVersion,
        notaIncompleta,
      };
}
