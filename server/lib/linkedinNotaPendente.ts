import { readLinkedinScoreState } from "../../shared/linkedin/readScore";
import type { LinkedinFaixa } from "../../shared/linkedin/schema";

export interface NotaLinkedinContexto {
  score: number | null;
  faixa: LinkedinFaixa | null;
  deterministicVersion: number | null;
  notaIncompleta: boolean;
  statusNota: "definitiva" | "provisoria_a_confirmar" | "indisponivel";
}

/** Contrato único para consumidores textuais da nota do LinkedIn. */
export function notaLinkedinParaContexto(
  score: unknown,
  faixa: unknown,
  notaIncompleta: unknown,
  deterministicVersion?: unknown,
): NotaLinkedinContexto {
  const state = readLinkedinScoreState({
    score,
    faixa,
    notaIncompleta,
    deterministicVersion,
  });
  if (!state.valid) {
    return {
      score: null,
      faixa: null,
      deterministicVersion: state.deterministicVersion,
      notaIncompleta: state.notaIncompleta,
      statusNota: "indisponivel",
    };
  }
  return {
    score: state.score,
    faixa: state.faixa,
    deterministicVersion: state.deterministicVersion,
    notaIncompleta: state.notaIncompleta,
    statusNota: state.notaIncompleta
      ? "provisoria_a_confirmar"
      : "definitiva",
  };
}

export function textoDaNotaLinkedin(
  score: unknown,
  faixa: unknown,
  notaIncompleta: unknown,
  deterministicVersion?: unknown,
): string {
  const state = notaLinkedinParaContexto(
    score,
    faixa,
    notaIncompleta,
    deterministicVersion,
  );
  if (state.statusNota === "indisponivel") {
    return "nota indisponivel (dados persistidos inconsistentes)";
  }
  return state.notaIncompleta
    ? `nota provisoria ${state.score} (faixa provisoria ${state.faixa}, a confirmar)`
    : `nota ${state.score} (faixa ${state.faixa})`;
}
