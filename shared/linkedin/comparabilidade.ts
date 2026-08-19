import {
  headlineManualAtiva,
  type LinkedinAnalysisSummary,
  type LinkedinAnalyzeRequest,
  type LinkedinHeadlineOrigem,
} from "./schema";
import { mesmoTextoHash } from "./textoHash";

export const LINKEDIN_COMPARACAO_VERSION = 1;

export interface LinkedinAnaliseComparavel {
  textoHash?: string | null;
  area?: string | null;
  level?: string | null;
  mercado?: string | null;
  headlineComparacao?: string | null;
  headlineOrigem?: LinkedinHeadlineOrigem | null;
  skillsComparacao?: string | null;
  foto?: string | null;
  banner?: string | null;
  openToWork?: string | null;
  conexoes?: string | null;
  atividade?: string | null;
  deterministicVersion?: number | null;
  qualitativeVersion?: number | null;
  comparacaoVersion?: number | null;
}

function normalizarTextoComparavel(value: string): string {
  return value.trim();
}

export function montarAnaliseComparavel(
  request: Pick<
    LinkedinAnalyzeRequest,
    | "area"
    | "level"
    | "mercado"
    | "skills"
    | "foto"
    | "banner"
    | "openToWork"
    | "conexoes"
    | "atividade"
    | "headlineManual"
  >,
  result: {
    headline: string | null;
    deterministicVersion?: number | null;
    qualitativeVersion?: number | null;
  },
  textoHash: string | null,
): LinkedinAnaliseComparavel {
  return {
    textoHash,
    area: request.area,
    level: request.level,
    mercado: request.mercado,
    headlineComparacao: result.headline,
    headlineOrigem: headlineManualAtiva(request.headlineManual)
      ? "manual"
      : "parser",
    skillsComparacao: normalizarTextoComparavel(request.skills),
    foto: request.foto,
    banner: request.banner,
    openToWork: request.openToWork,
    conexoes: request.conexoes,
    atividade: request.atividade,
    deterministicVersion: result.deterministicVersion,
    qualitativeVersion: result.qualitativeVersion,
    comparacaoVersion: LINKEDIN_COMPARACAO_VERSION,
  };
}

const CAMPOS_DE_INPUT = [
  "area",
  "level",
  "mercado",
  "headlineComparacao",
  "headlineOrigem",
  "skillsComparacao",
  "foto",
  "banner",
  "openToWork",
  "conexoes",
  "atividade",
] as const;

/**
 * Decisão pura e conservadora: hash igual é necessário, nunca suficiente.
 * Campos ausentes, versões diferentes ou qualquer input divergente suprimem
 * comparação automática.
 */
export function analisesSaoComparaveis(
  atual: LinkedinAnaliseComparavel,
  anterior: LinkedinAnaliseComparavel,
): boolean {
  if (
    atual.comparacaoVersion !== LINKEDIN_COMPARACAO_VERSION ||
    anterior.comparacaoVersion !== LINKEDIN_COMPARACAO_VERSION ||
    !mesmoTextoHash(atual.textoHash, anterior.textoHash)
  ) {
    return false;
  }
  for (const campo of CAMPOS_DE_INPUT) {
    const atualValor = atual[campo];
    const anteriorValor = anterior[campo];
    const valido =
      campo === "headlineComparacao"
        ? (typeof atualValor === "string" || atualValor === null) &&
          (typeof anteriorValor === "string" || anteriorValor === null)
        : typeof atualValor === "string" && typeof anteriorValor === "string";
    if (!valido) return false;
    if (atualValor !== anteriorValor) return false;
  }
  return (
    typeof atual.deterministicVersion === "number" &&
    atual.deterministicVersion === anterior.deterministicVersion &&
    typeof atual.qualitativeVersion === "number" &&
    atual.qualitativeVersion === anterior.qualitativeVersion
  );
}

export function analiseAnteriorComparavel(
  analyses: readonly LinkedinAnalysisSummary[],
  atual: LinkedinAnaliseComparavel,
  inicio = 0,
): LinkedinAnalysisSummary | undefined {
  return analyses
    .slice(inicio)
    .find((analysis) => analisesSaoComparaveis(atual, analysis));
}
