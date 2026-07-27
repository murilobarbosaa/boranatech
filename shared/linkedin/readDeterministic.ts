import { z } from "zod";

import { DETERMINISTIC_VERSION, type TituloInglesMatch } from "./schema";

/**
 * Leitura VERSIONADA e tolerante do `deterministic` persistido, irmã de
 * `readQualitative`.
 *
 * Escopo deliberado: cobre o CONJUNTO MÍNIMO levantado em
 * `docs/divida-leitura-persistida.md`, que são as três leituras capazes de
 * derrubar a página (as únicas que chamam método em array vindo do jsonb):
 * `keywordsEncontradas`, `keywordsFaltantes` e `titulosIngles`, consumidas por
 * `RecruiterFinder`. Os outros 17 acessos diretos do LinkedIn são números e
 * strings que degradam feio mas não lançam, e seguem documentados e intocados.
 *
 * Por que o tipo não basta: `LinkedinDeterministicResult` descreve o que o
 * servidor ESCREVE hoje. As 107 linhas já gravadas foram escritas por outras
 * versões do código e voltam do banco sem nenhuma validação em runtime
 * (`getLinkedinAnalysis` faz só um cast). O tipo mente sobre o passado; esta
 * função não.
 */

const TituloInglesSchema = z.object({
  titulo: z.string(),
  encontrado: z.boolean(),
});

// Só os campos do conjunto mínimo. Tudo opcional de propósito: este schema não
// valida a escrita (isso é papel de runLinkedinChecks), ele resgata a leitura.
const LenientDeterministicSchema = z.object({
  keywordsEncontradas: z.array(z.string()).optional(),
  keywordsFaltantes: z.array(z.string()).optional(),
  titulosIngles: z.array(TituloInglesSchema).optional(),
});

export interface DeterministicView {
  /** Versão detectada do formato lido. */
  version: number;
  keywordsEncontradas: string[];
  keywordsFaltantes: string[];
  titulosIngles: TituloInglesMatch[];
  /** Nomes dos campos do conjunto mínimo que não vieram. */
  camposAusentes: string[];
}

const CAMPOS_MINIMOS = [
  "keywordsEncontradas",
  "keywordsFaltantes",
  "titulosIngles",
] as const;

export function readDeterministic(
  raw: unknown,
  declaredVersion?: number,
): DeterministicView {
  const parsed = LenientDeterministicSchema.safeParse(raw);
  const d = parsed.success ? parsed.data : {};

  return {
    version: declaredVersion ?? DETERMINISTIC_VERSION,
    keywordsEncontradas: d.keywordsEncontradas ?? [],
    keywordsFaltantes: d.keywordsFaltantes ?? [],
    titulosIngles: d.titulosIngles ?? [],
    camposAusentes: CAMPOS_MINIMOS.filter(
      (campo) => (d as Record<string, unknown>)[campo] === undefined,
    ),
  };
}
