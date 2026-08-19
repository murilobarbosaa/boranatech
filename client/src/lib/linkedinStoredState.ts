import {
  HEADLINE_MANUAL_MAX,
  normalizarHeadlineManual,
  type LinkedinAnalysisResponse,
} from "@shared/linkedin/schema";
import { readLinkedinAnalysisResponse } from "@shared/linkedin/readAnalysis";
import { textoHashValido } from "@shared/linkedin/textoHash";

export const LINKEDIN_STORAGE_SHAPE_VERSION = 5;

export interface DecodedLinkedinStoredState {
  form: unknown;
  result: LinkedinAnalysisResponse | null;
  analysisId: string | null;
  textoHash: string | null;
  headlineManual: string | null;
}

interface LinkedinStoredStateInput extends DecodedLinkedinStoredState {
  form: unknown;
}

/** Escrita centralizada para o shape que o decoder realmente sabe restaurar. */
export function encodeLinkedinStoredState(
  state: LinkedinStoredStateInput,
): string {
  const manual = normalizarHeadlineManual(state.headlineManual);
  return JSON.stringify({
    version: LINKEDIN_STORAGE_SHAPE_VERSION,
    form: state.form,
    result: state.result,
    analysisId: state.analysisId,
    textoHash: state.textoHash,
    headlineManual:
      manual !== null && manual.length <= HEADLINE_MANUAL_MAX ? manual : null,
  });
}

/** Decodifica sessionStorage sem confiar em JSON.parse nem em cast TypeScript. */
export function decodeLinkedinStoredState(
  raw: string | null,
): DecodedLinkedinStoredState | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  const version = record.version;
  const versionOk =
    version === LINKEDIN_STORAGE_SHAPE_VERSION ||
    version === 4 ||
    version === 3 ||
    version === 2;
  if (!versionOk) return null;
  const result = readLinkedinAnalysisResponse(record.result);

  return {
    form: record.form,
    result,
    analysisId:
      (version === LINKEDIN_STORAGE_SHAPE_VERSION ||
        version === 4 ||
        version === 3) &&
      result !== null &&
      typeof record.analysisId === "string" &&
      record.analysisId.length > 0
        ? record.analysisId
        : null,
    textoHash:
      (version === LINKEDIN_STORAGE_SHAPE_VERSION || version === 4) &&
      result !== null &&
      textoHashValido(record.textoHash)
        ? record.textoHash
        : null,
    headlineManual: (() => {
      if (version !== LINKEDIN_STORAGE_SHAPE_VERSION) return null;
      const manual = normalizarHeadlineManual(record.headlineManual);
      return manual !== null && manual.length <= HEADLINE_MANUAL_MAX
        ? manual
        : null;
    })(),
  };
}
