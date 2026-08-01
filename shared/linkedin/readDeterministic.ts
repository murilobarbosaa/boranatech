import { z } from "zod";

import {
  DETERMINISTIC_VERSION,
  LINKEDIN_CAMPOS,
  type LinkedinKeywordCampos,
  type TituloInglesMatch,
} from "./schema";

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

// Só os campos do conjunto mínimo. Tudo opcional de propósito: este schema não
// valida a escrita (isso é papel de runLinkedinChecks), ele resgata a leitura.
const CheckPendenteSchema = z.object({
  id: z.string(),
  tier: z.string(),
  aprovado: z.boolean(),
  pendente: z.boolean().optional(),
});

const LenientDeterministicSchema = z.object({
  keywordsEncontradas: z.array(z.string()).optional(),
  keywordsFaltantes: z.array(z.string()).optional(),
  titulosIngles: z.array(TituloInglesSchema).optional(),
  keywordsCampos: z.array(KeywordCamposSchema).optional(),
  notaIncompleta: z.boolean().optional(),
  checks: z.array(CheckPendenteSchema).optional(),
});

export interface DeterministicView {
  /** Versão detectada do formato lido. */
  version: number;
  keywordsEncontradas: string[];
  keywordsFaltantes: string[];
  titulosIngles: TituloInglesMatch[];
  /** Vazio nas análises gravadas antes da Fase 2A. */
  keywordsCampos: LinkedinKeywordCampos[];
  /** SEMPRE booleano. `false` nas linhas anteriores à v7, nunca `undefined`. */
  notaIncompleta: boolean;
  /** Ids dos checks pendentes. Vazio nas linhas anteriores à v7. */
  checksPendentes: string[];
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

  return {
    version: declaredVersion ?? DETERMINISTIC_VERSION,
    keywordsEncontradas: d.keywordsEncontradas ?? [],
    keywordsFaltantes: d.keywordsFaltantes ?? [],
    titulosIngles: d.titulosIngles ?? [],
    keywordsCampos: d.keywordsCampos ?? [],
    // As duas normalizações. Ausência vira `false`/vazio AQUI, e não no
    // consumidor: é o ponto único, e é o que garante que nenhum lugar da UI
    // precise saber que o campo pode não existir.
    notaIncompleta: d.notaIncompleta === true,
    checksPendentes: (d.checks ?? [])
      .filter((c) => c.pendente === true)
      .map((c) => c.id),
    camposAusentes: CAMPOS_MINIMOS.filter(
      (campo) => (d as Record<string, unknown>)[campo] === undefined,
    ),
  };
}
