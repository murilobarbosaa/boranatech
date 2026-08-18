import { z } from "zod";

import { AREA_SLUGS } from "../areas";
import {
  LinkedinLevelSchema,
  MercadoSchema,
  type LinkedinAnalysisResponse,
} from "./schema";
import { readDeterministic } from "./readDeterministic";

/**
 * Leitura tolerante do invólucro persistido em JSONB ou sessionStorage.
 *
 * O shape externo precisa ser reconhecível e o núcleo determinístico precisa
 * existir. Campos internos opcionais continuam sendo recuperados pelos readers
 * específicos. Assim, corrupção estrutural é descartada, enquanto resultado
 * legado degrada parcialmente sem depender de cast cego no consumidor.
 */
const ReadableAnalysisSchema = z.object({
  area: z.enum(AREA_SLUGS),
  level: LinkedinLevelSchema,
  mercado: MercadoSchema,
  qualitativeVersion: z.number().int().positive().optional().catch(undefined),
  deterministicVersion: z.number().int().positive().optional().catch(undefined),
  deterministic: z.unknown(),
  qualitative: z.unknown(),
});

export function readLinkedinAnalysisResponse(
  raw: unknown,
): LinkedinAnalysisResponse | null {
  const parsed = ReadableAnalysisSchema.safeParse(raw);
  if (!parsed.success) return null;

  const deterministic = readDeterministic(
    parsed.data.deterministic,
    parsed.data.deterministicVersion,
  );
  if (
    !deterministic.validCore ||
    deterministic.score === null ||
    deterministic.faixa === null
  ) {
    return null;
  }
  const deterministicResult = {
    ...deterministic,
    score: deterministic.score,
    faixa: deterministic.faixa,
  };

  return {
    area: parsed.data.area,
    level: parsed.data.level,
    mercado: parsed.data.mercado,
    qualitativeVersion: parsed.data.qualitativeVersion,
    deterministicVersion: parsed.data.deterministicVersion,
    deterministic: deterministicResult,
    // A forma interna é deliberadamente tolerante e será lida apenas por
    // `readQualitative`. O cast fica confinado depois da validação do envelope.
    qualitative: parsed.data
      .qualitative as LinkedinAnalysisResponse["qualitative"],
  };
}
