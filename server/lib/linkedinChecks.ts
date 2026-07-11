import type { AreaSlug } from "../../shared/areas";
import {
  LINKEDIN_CHECK_CATALOG,
  checkAppliesToMercado,
  computeLinkedinScore,
  resolveTier,
  type LinkedinCheckResult,
  type LinkedinDeterministicResult,
  type Mercado,
} from "../../shared/linkedin/schema";
import { ENGLISH_TITLES, PT_TITLES } from "../../shared/linkedin/titles";
import type { LinkedinParsed } from "../../shared/linkedin/parse";
import {
  countKnownTechnologies,
  isMostlyEnglish,
  keyTechnologiesForArea,
  matchTechnologies,
  matchesAnyTitle,
  normalize,
} from "./skillNormalize";

/**
 * Checagens determinísticas do analisador de LinkedIn.
 *
 * Função pura, sem IA, sem IO. Recebe o perfil já parseado (LinkedinParsed) e
 * os dados do formulário, e devolve o payload determinístico com a nota.
 */

export interface LinkedinChecksInput {
  parsed: LinkedinParsed;
  profileText: string;
  area: AreaSlug;
  mercado: Mercado;
  skills: string;
  foto: "sim" | "nao";
  banner: "sim" | "nao";
  openToWork: "sim" | "nao" | "nao-sei";
  conexoes: "ate-50" | "50-100" | "100-500" | "500-mais";
  atividade: "nunca" | "raramente" | "semanal" | "diaria";
}

/** Quebra a string de skills do formulário em itens limpos e únicos. */
export function parseSkillsInput(skills: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of skills.split(/[,;\n]/)) {
    const skill = part.trim();
    if (skill.length === 0) continue;
    const key = normalize(skill);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(skill);
  }
  return out;
}

const ACTION_VERBS_RE = new RegExp(
  "\\b(?:" +
    [
      "desenvolvi",
      "desenvolvido",
      "criei",
      "implementei",
      "construi",
      "automatizei",
      "liderei",
      "otimizei",
      "migrei",
      "publiquei",
      "integrei",
      "gerenciei",
      "lancei",
      "reduzi",
      "aumentei",
      "melhorei",
      "projetei",
      "configurei",
      "refatorei",
      "escrevi",
      "developed",
      "created",
      "implemented",
      "built",
      "automated",
      "led",
      "optimized",
      "migrated",
      "published",
      "integrated",
      "designed",
      "managed",
      "launched",
      "reduced",
      "increased",
      "improved",
      "maintained",
      "refactored",
      "deployed",
    ].join("|") +
    ")\\b",
  "g",
);

const CTA_RE =
  /(me chame|me chama|entre em contato|fale comigo|vamos conversar|bora conversar|aberto a|aberta a|disponivel para|disponivel a|conecte|conectar|open to|lets connect|let s connect|get in touch|reach out)/;

const EMAIL_RE = /\S+@\S+\.\S+/;

const RESULT_RE = /(\d+\s?%|\b\d{2,}\b|\+\d)/;

const ROLE_HINT_RE =
  /(desenvolvedor|developer|engenheiro|engineer|analista|analyst|designer|programador|programmer|qa|devops|cientista|scientist|dba|sre)/;

function clicheHeadline(headline: string): boolean {
  const h = normalize(headline);
  if (/apaixonad[oa]s? por tecnologia/.test(h)) return true;
  if (/em busca de (uma )?oportunidade/.test(h)) return true;
  if (/em busca de (uma )?(nova )?recoloca/.test(h)) return true;
  if (/buscando (uma )?(primeira )?(nova )?oportunidade/.test(h)) return true;
  if (/^estudante de/.test(h) && !ROLE_HINT_RE.test(h)) return true;
  return false;
}

function firstSentence(text: string): string {
  const match = text.split(/[.\n!?]/)[0] ?? text;
  return match.trim();
}

function titlesForMarket(area: AreaSlug, mercado: Mercado): string[] {
  if (mercado === "brasil") {
    return [...PT_TITLES[area], ...ENGLISH_TITLES[area]];
  }
  return ENGLISH_TITLES[area];
}

interface Evaluation {
  aprovado: boolean;
  detail: string;
}

export function runLinkedinChecks(
  input: LinkedinChecksInput,
): LinkedinDeterministicResult {
  const { parsed, profileText, area, mercado } = input;

  const headline = parsed.headline ?? "";
  const sobre = parsed.sobre ?? "";
  const skillsForm = parseSkillsInput(input.skills);
  const skillsText = skillsForm.join(", ");
  const fullText = `${profileText} ${skillsText}`;
  const expDescricoes = parsed.experiencias
    .map((exp) => exp.descricao)
    .join(" ")
    .trim();
  const expTitulos = parsed.experiencias
    .map((exp) => exp.titulo)
    .join(" ")
    .trim();

  const keyTechs = keyTechnologiesForArea(area);
  const fullCoverage = matchTechnologies(fullText, keyTechs);
  const skillsCoverage = matchTechnologies(skillsText, keyTechs);
  const coverageRatio =
    keyTechs.length === 0
      ? 0
      : fullCoverage.encontradas.length / keyTechs.length;
  const skillsRatio =
    keyTechs.length === 0
      ? 0
      : skillsCoverage.encontradas.length / keyTechs.length;

  const marketTitles = titlesForMarket(area, mercado);
  const headlineTechs = countKnownTechnologies(headline);
  const sobreTechs = countKnownTechnologies(sobre);
  const expTechs = countKnownTechnologies(expDescricoes);
  const verbCount = (normalize(expDescricoes).match(ACTION_VERBS_RE) ?? [])
    .length;

  const pct = (ratio: number) => `${Math.round(ratio * 100)}%`;

  const evaluators: Record<string, () => Evaluation> = {
    "headline-existe": () => ({
      aprovado: headline.trim().length > 0,
      detail:
        headline.trim().length > 0
          ? "Headline detectada no perfil."
          : "Não detectamos uma headline. Pode ser que ela não tenha sido lida, vale conferir.",
    }),
    "headline-cargo-alvo": () => {
      const ok = matchesAnyTitle(headline, marketTitles);
      return {
        aprovado: ok,
        detail: ok
          ? "A headline traz um cargo que recrutadores buscam."
          : "A headline não traz o cargo-alvo da área de forma buscável.",
      };
    },
    "headline-stack": () => ({
      aprovado: headlineTechs >= 2,
      detail:
        headlineTechs >= 2
          ? `A headline cita ${headlineTechs} tecnologias reconhecidas.`
          : "A headline cita menos de 2 tecnologias reconhecidas.",
    }),
    "headline-tamanho": () => {
      const len = headline.trim().length;
      const ok = len >= 40 && len <= 220;
      return {
        aprovado: ok,
        detail: ok
          ? `A headline tem ${len} caracteres, um bom tamanho.`
          : len === 0
            ? "Sem headline para medir o tamanho."
            : `A headline tem ${len} caracteres (o ideal fica entre 40 e 220).`,
      };
    },
    "headline-sem-cliche": () => {
      const ok = headline.trim().length > 0 && !clicheHeadline(headline);
      return {
        aprovado: ok,
        detail: ok
          ? "A headline foge dos clichês mais comuns."
          : "A headline usa um clichê que não ajuda nas buscas (ou está vazia).",
      };
    },
    "sobre-existe": () => {
      const ok = sobre.trim().length >= 200;
      return {
        aprovado: ok,
        detail: ok
          ? `A seção Sobre tem ${sobre.trim().length} caracteres de conteúdo.`
          : "A seção Sobre está ausente ou muito curta (menos de 200 caracteres).",
      };
    },
    "sobre-gancho": () => {
      const first = firstSentence(sobre);
      const fn = normalize(first);
      const ok =
        sobre.trim().length > 0 &&
        first.length > 0 &&
        first.length <= 140 &&
        !/^meu nome e/.test(fn) &&
        !/^ola/.test(fn) &&
        !/^sou estudante/.test(fn);
      return {
        aprovado: ok,
        detail: ok
          ? "A primeira frase do Sobre funciona como gancho."
          : "A primeira frase do Sobre não prende (longa demais ou começa de forma genérica).",
      };
    },
    "sobre-stack": () => ({
      aprovado: sobreTechs >= 3,
      detail:
        sobreTechs >= 3
          ? `O Sobre menciona ${sobreTechs} tecnologias reconhecidas.`
          : "O Sobre menciona menos de 3 tecnologias reconhecidas.",
    }),
    "sobre-cta": () => {
      const ok = CTA_RE.test(normalize(sobre)) || EMAIL_RE.test(sobre);
      return {
        aprovado: ok,
        detail: ok
          ? "O Sobre convida ao contato."
          : "O Sobre não traz um convite claro ao contato.",
      };
    },
    "sobre-tamanho": () => {
      const len = sobre.trim().length;
      const ok = len >= 500 && len <= 2200;
      return {
        aprovado: ok,
        detail: ok
          ? `O Sobre tem ${len} caracteres, um tamanho equilibrado.`
          : len === 0
            ? "Sem Sobre para medir o tamanho."
            : `O Sobre tem ${len} caracteres (o ideal fica entre 500 e 2200).`,
      };
    },
    "exp-existe": () => ({
      aprovado: parsed.experiencias.length >= 1,
      detail:
        parsed.experiencias.length >= 1
          ? `${parsed.experiencias.length} experiência(s) detectada(s).`
          : "Nenhuma experiência detectada (projetos próprios contam, vale cadastrar).",
    }),
    "exp-descricoes": () => {
      const len = expDescricoes.length;
      const ok = len >= 100;
      return {
        aprovado: ok,
        detail: ok
          ? "As experiências têm descrições com substância."
          : "As experiências têm pouca ou nenhuma descrição (menos de 100 caracteres no total).",
      };
    },
    "exp-verbos-acao": () => ({
      aprovado: verbCount >= 2,
      detail:
        verbCount >= 2
          ? `As descrições usam ${verbCount} verbos de ação.`
          : "As descrições usam menos de 2 verbos de ação no começo das frases.",
    }),
    "exp-tecnologias": () => ({
      aprovado: expTechs >= 2,
      detail:
        expTechs >= 2
          ? `As descrições citam ${expTechs} tecnologias reconhecidas.`
          : "As descrições das experiências citam menos de 2 tecnologias.",
    }),
    "exp-resultados": () => {
      const ok = RESULT_RE.test(expDescricoes);
      return {
        aprovado: ok,
        detail: ok
          ? "As descrições trazem números ou métricas."
          : "As descrições não trazem números, percentuais ou métricas.",
      };
    },
    "cargo-em-experiencia": () => {
      const ok = matchesAnyTitle(expTitulos, marketTitles);
      return {
        aprovado: ok,
        detail: ok
          ? "O cargo-alvo aparece no título de alguma experiência."
          : "O cargo-alvo não aparece no título de nenhuma experiência.",
      };
    },
    "cobertura-keywords-area": () => ({
      aprovado: coverageRatio >= 0.5,
      detail: `O perfil cobre ${pct(coverageRatio)} das tecnologias-chave da área.`,
    }),
    "cobertura-keywords-otima": () => ({
      aprovado: coverageRatio >= 0.75,
      detail:
        coverageRatio >= 0.75
          ? `Cobertura ótima: ${pct(coverageRatio)} das tecnologias-chave da área.`
          : `Cobertura de ${pct(coverageRatio)} das tecnologias-chave (o ideal é 75% ou mais).`,
    }),
    "termos-bilingues": () => {
      const pt = matchesAnyTitle(profileText, PT_TITLES[area]);
      const en = matchesAnyTitle(profileText, ENGLISH_TITLES[area]);
      const ok = pt && en;
      return {
        aprovado: ok,
        detail: ok
          ? "O perfil traz o cargo-alvo em português e em inglês."
          : "O perfil não traz o cargo-alvo nos dois idiomas (português e inglês).",
      };
    },
    "skills-quantidade": () => ({
      aprovado: skillsForm.length >= 10,
      detail: `${skillsForm.length} competência(s) informada(s) (o ideal é 10 ou mais).`,
    }),
    "skills-cobertura": () => ({
      aprovado: skillsRatio >= 0.5,
      detail: `As competências cobrem ${pct(skillsRatio)} das tecnologias-chave da área.`,
    }),
    "skills-quantidade-otima": () => ({
      aprovado: skillsForm.length >= 25,
      detail:
        skillsForm.length >= 25
          ? `${skillsForm.length} competências, um perfil bem completo.`
          : `${skillsForm.length} competências (25 ou mais deixa o perfil mais forte).`,
    }),
    "foto-profissional": () => ({
      aprovado: input.foto === "sim",
      detail:
        input.foto === "sim"
          ? "Você marcou que tem foto de perfil profissional."
          : "Sem foto de perfil profissional, um item que pesa muito.",
    }),
    "banner-personalizado": () => ({
      aprovado: input.banner === "sim",
      detail:
        input.banner === "sim"
          ? "Você marcou que tem um banner personalizado."
          : "Sem banner personalizado (um detalhe que valoriza o perfil).",
    }),
    // Fail-closed: "nao-sei" continua reprovando, mas o detail diz que nao
    // deu para confirmar em vez de afirmar que nao esta configurado.
    "open-to-work": () => ({
      aprovado: input.openToWork === "sim",
      detail:
        input.openToWork === "sim"
          ? "Open to Work configurado para recrutadores."
          : input.openToWork === "nao-sei"
            ? // TODO(Ana): revisar o detail do Open to Work sem confirmacao.
              "Não foi possível confirmar o Open to Work para recrutadores, vale conferir nas configurações do seu perfil."
            : "Open to Work não configurado para recrutadores.",
    }),
    conexoes: () => {
      const ok = input.conexoes === "100-500" || input.conexoes === "500-mais";
      return {
        aprovado: ok,
        detail: ok
          ? "Sua rede já tem alcance (100 ou mais conexões)."
          : "Rede com menos de 100 conexões, vale expandir aos poucos.",
      };
    },
    atividade: () => {
      const ok = input.atividade === "semanal" || input.atividade === "diaria";
      return {
        aprovado: ok,
        detail: ok
          ? "Você interage no LinkedIn com frequência."
          : "Pouca atividade no LinkedIn, postar ou comentar ajuda a aparecer.",
      };
    },
    "headline-em-ingles": () => {
      const ok = isMostlyEnglish(headline);
      return {
        aprovado: ok,
        detail: ok
          ? "A headline está majoritariamente em inglês."
          : "A headline não está em inglês (recrutadores internacionais buscam em inglês).",
      };
    },
    "sobre-em-ingles": () => {
      const ok = sobre.trim().length > 0 && isMostlyEnglish(sobre);
      return {
        aprovado: ok,
        detail: ok
          ? "O Sobre está majoritariamente em inglês."
          : "O Sobre não está em inglês (essencial para vagas internacionais).",
      };
    },
  };

  const checks: LinkedinCheckResult[] = [];
  for (const entry of LINKEDIN_CHECK_CATALOG) {
    if (!checkAppliesToMercado(entry, mercado)) continue;
    const evaluate = evaluators[entry.id];
    if (!evaluate) {
      throw new Error(`Check sem avaliador: ${entry.id}`);
    }
    const { aprovado, detail } = evaluate();
    checks.push({
      id: entry.id,
      label: entry.label,
      category: entry.category,
      tier: resolveTier(entry, mercado),
      aprovado,
      detail,
    });
  }

  const { score, faixa } = computeLinkedinScore(checks);

  const titulosIngles = ENGLISH_TITLES[area].map((titulo) => ({
    titulo,
    encontrado: matchesAnyTitle(profileText, [titulo]),
  }));

  return {
    score,
    faixa,
    checks,
    keywordsEncontradas: fullCoverage.encontradas,
    keywordsFaltantes: fullCoverage.faltantes,
    titulosIngles,
    headline: parsed.headline,
    sobreTamanho: sobre.trim().length,
    experienciasContagem: parsed.experiencias.length,
    skillsContagem: skillsForm.length,
  };
}
