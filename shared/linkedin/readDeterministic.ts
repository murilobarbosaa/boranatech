import { z } from "zod";

import {
  CHECK_TIERS,
  LINKEDIN_CAMPOS,
  LINKEDIN_CATEGORIES,
  type LinkedinDeterministicResult,
  type LinkedinKeywordCampos,
  type TituloInglesMatch,
} from "./schema";
import { readLinkedinScoreState } from "./readScore";

/**
 * Leitura VERSIONADA e tolerante do `deterministic` persistido, irmã de
 * `readQualitative`.
 *
 * Começou cobrindo apenas as listas iteradas pelo `RecruiterFinder`. Na Fase 1
 * passou a ser o ponto de leitura de todo o bloco consumido pela página, porque
 * score, faixa, checks e contagens também podem vir de JSONB legado ou
 * corrompido. Campos ilegíveis degradam individualmente; o envelope decide se
 * o núcleo ainda é suficiente para montar um resultado.
 *
 * `pendente` e `notaIncompleta` entraram no conjunto mínimo por um critério
 * DIFERENTE dos demais, e a diferença é a razão de estarem aqui: os outros
 * campos ausentes significam "não sabemos" e viram lista vazia; estes dois
 * significam "completo", e ausência com semântica invertida no mesmo payload é
 * como se erra. A normalização acontece NESTE ponto, uma vez, e quem consome
 * sempre recebe booleano. Comentário no ponto da conversão, e não no ponto do
 * consumo, de propósito: guarda no call site cobre só quem alguém lembrou.
 *
 * Por que ausência vira `false` e não `true`: uma análise gravada antes da v7
 * foi calculada por uma régua que não tinha o conceito, e a nota que a pessoa
 * viu era completa DENTRO daquela régua. Marcar retroativamente reescreveria a
 * história de uma medição honesta. O risco de misturar completa com incompleta
 * na comparação já é resolvido pelo bump: `deltaEhComparavel` não compara
 * versões diferentes, então a v7 nunca compara com nada anterior.
 *
 * `keywordsCampos` entrou no conjunto mínimo na Fase 2A pelo mesmo critério:
 * o `RecruiterFinder` itera sobre ele, e as 107 análises já gravadas não o têm.
 * Ausente vira lista vazia, e a UI cai nas duas listas antigas.
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

const CampoSchema = z.enum(LINKEDIN_CAMPOS);

const KeywordCamposSchema = z.object({
  termo: z.string(),
  presenteEm: z.array(CampoSchema),
  faltaEm: z.array(CampoSchema),
  comprovado: z.boolean(),
});

// Tudo opcional de propósito: este schema não valida a escrita (isso é papel de
// runLinkedinChecks), ele resgata a leitura persistida.
const CheckPendenteSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.enum(LINKEDIN_CATEGORIES),
  tier: z.enum(CHECK_TIERS),
  aprovado: z.boolean(),
  detail: z.string(),
  pendente: z.boolean().optional(),
});

const LenientDeterministicSchema = z.object({
  score: z.unknown().optional(),
  faixa: z.unknown().optional(),
  keywordsEncontradas: z.array(z.string()).optional().catch(undefined),
  keywordsFaltantes: z.array(z.string()).optional().catch(undefined),
  skillsParaAdicionarAgora: z.array(z.string()).optional().catch(undefined),
  titulosIngles: z.array(TituloInglesSchema).optional().catch(undefined),
  keywordsCampos: z.array(KeywordCamposSchema).optional().catch(undefined),
  notaIncompleta: z.boolean().optional().catch(undefined),
  checks: z.array(CheckPendenteSchema).optional().catch(undefined),
  perfilDedup: z.string().optional().catch(undefined),
  experienciasDescricaoTamanhos: z
    .array(z.number().int().nonnegative())
    .optional()
    .catch(undefined),
  headline: z.string().nullable().optional().catch(undefined),
  sobreTamanho: z.number().int().nonnegative().optional().catch(undefined),
  experienciasContagem: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .catch(undefined),
  skillsContagem: z.number().int().nonnegative().optional().catch(undefined),
});

export interface DeterministicView
  extends Omit<LinkedinDeterministicResult, "score" | "faixa"> {
  /** Versão detectada do formato lido. */
  version: number | null;
  score: number | null;
  faixa: LinkedinDeterministicResult["faixa"] | null;
  keywordsEncontradas: string[];
  keywordsFaltantes: string[];
  titulosIngles: TituloInglesMatch[];
  /** Vazio nas análises gravadas antes da Fase 2A. */
  keywordsCampos: LinkedinKeywordCampos[];
  /** SEMPRE booleano. `false` nas linhas anteriores à v7, nunca `undefined`. */
  notaIncompleta: boolean;
  /** Ids dos checks pendentes. Vazio nas linhas anteriores à v7. */
  checksPendentes: string[];
  /** Os campos centrais necessários para montar o resultado estavam legíveis. */
  validCore: boolean;
  /** Nomes dos campos do conjunto mínimo que não vieram. */
  camposAusentes: string[];
}

const CAMPOS_MINIMOS = [
  "keywordsEncontradas",
  "keywordsFaltantes",
  "titulosIngles",
  "keywordsCampos",
] as const;

export function readDeterministic(
  raw: unknown,
  declaredVersion?: number,
): DeterministicView {
  const parsed = LenientDeterministicSchema.safeParse(raw);
  const d = parsed.success ? parsed.data : {};
  const checks = d.checks ?? [];
  const scoreState = readLinkedinScoreState({
    score: d.score,
    faixa: d.faixa,
    deterministicVersion: declaredVersion,
    notaIncompleta: d.notaIncompleta,
  });

  return {
    version: scoreState.deterministicVersion,
    score: scoreState.score,
    faixa: scoreState.faixa,
    checks,
    keywordsEncontradas: d.keywordsEncontradas ?? [],
    keywordsFaltantes: d.keywordsFaltantes ?? [],
    skillsParaAdicionarAgora: d.skillsParaAdicionarAgora ?? [],
    titulosIngles: d.titulosIngles ?? [],
    keywordsCampos: d.keywordsCampos ?? [],
    perfilDedup: d.perfilDedup ?? "",
    experienciasDescricaoTamanhos: d.experienciasDescricaoTamanhos ?? [],
    headline: d.headline ?? null,
    sobreTamanho: d.sobreTamanho ?? 0,
    experienciasContagem: d.experienciasContagem ?? 0,
    skillsContagem: d.skillsContagem ?? 0,
    // As duas normalizações. Ausência vira `false`/vazio AQUI, e não no
    // consumidor: é o ponto único, e é o que garante que nenhum lugar da UI
    // precise saber que o campo pode não existir.
    notaIncompleta: scoreState.notaIncompleta,
    checksPendentes: checks.filter((c) => c.pendente === true).map((c) => c.id),
    validCore:
      scoreState.valid && d.checks !== undefined,
    camposAusentes: CAMPOS_MINIMOS.filter(
      (campo) => (d as Record<string, unknown>)[campo] === undefined,
    ),
  };
}
