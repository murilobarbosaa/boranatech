import type { LinkedinParsed } from "../../shared/linkedin/parse";
import {
  LINKEDIN_SKILLS_MAX,
  headlineManualAtiva,
  type LinkedinAnalyzeRequest,
  type LinkedinDeterministicResult,
  type LinkedinHeadlineOrigem,
} from "../../shared/linkedin/schema";
import { LINKEDIN_COMPARACAO_VERSION } from "../../shared/linkedin/comparabilidade";

/** Mesmo limite do contrato; nunca perde caracteres aceitos em silêncio. */
export function skillsParaPersistir(skills: string): string {
  return skills.slice(0, LINKEDIN_SKILLS_MAX);
}

/** Monta o jsonb sem o texto bruto e com os mesmos valores efetivos da análise. */
export function montarLinkedinInputPersistido(
  request: LinkedinAnalyzeRequest,
  response: {
    deterministic: Pick<
      LinkedinDeterministicResult,
      "headline" | "sobreTamanho" | "experienciasContagem"
    >;
  },
  parsed: Pick<
    LinkedinParsed,
    "headlineContexto" | "skillsPdf" | "skillsPdfConfiaveis"
  >,
  textoHash: string,
) {
  return {
    area: request.area,
    level: request.level,
    mercado: request.mercado,
    skills: skillsParaPersistir(request.skills),
    foto: request.foto,
    banner: request.banner,
    openToWork: request.openToWork,
    conexoes: request.conexoes,
    atividade: request.atividade,
    objetivo: request.objetivo ?? null,
    entryPath: request.entryPath ?? null,
    textoHash,
    comparacaoVersion: LINKEDIN_COMPARACAO_VERSION,
    parseResumo: {
      headline: response.deterministic.headline,
      headlineOrigem: (headlineManualAtiva(request.headlineManual)
        ? "manual"
        : "parser") satisfies LinkedinHeadlineOrigem,
      headlineContexto: parsed.headlineContexto,
      sobreTamanho: response.deterministic.sobreTamanho,
      experienciasContagem: response.deterministic.experienciasContagem,
      skillsPdf: parsed.skillsPdfConfiaveis === false ? [] : parsed.skillsPdf,
      skillsPdfRevisaoNecessaria: parsed.skillsPdfConfiaveis === false,
    },
  };
}
