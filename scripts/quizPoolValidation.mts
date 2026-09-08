// Validacao compartilhada dos pools de quiz de trilha
// (server/data/roadmapQuizzes/<slug>.ts). Usada em dois pontos do mesmo
// ciclo: pelo generateQuizPool.mts ANTES de salvar um pool e pelo
// generateRoadmapMeta.mts --check (pnpm check) pra manter os pools do disco
// sempre validos. Retorna lista de problemas (vazia = ok), nunca lanca.
import type {
  QuizNivel,
  QuizPool,
  QuizQuestion,
  QuizTipo,
} from "../shared/roadmapQuiz/types";
import {
  CODE_MAX_LINE_LENGTH,
  CODE_MAX_LINES,
  CODE_PLACEHOLDER,
  isCodeQuestion,
  POOL_MIN_PER_LEVEL,
} from "../shared/roadmapQuiz/types";
import type { RoadmapNode, RoadmapV2 } from "../shared/roadmapV2/types";

const NIVEIS: QuizNivel[] = ["iniciante", "intermediario", "avancado"];
const ALTERNATIVA_IDS = ["a", "b", "c", "d"] as const;
const TIPOS: QuizTipo[] = ["conceito", "completar", "erro", "saida"];
const DASH_RE = /\u2014|\u2013/;

// O slug entra num RegExp construido por string (idRe): sem escape, um
// metacaractere no slug muda o padrao em silencio. Protecao aqui dentro, nao
// no call site.
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const NIVEL_ABBR: Record<QuizNivel, string> = {
  iniciante: "ini",
  intermediario: "int",
  avancado: "av",
};

function collectLeafIds(nodes: RoadmapNode[], out: Set<string>) {
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      collectLeafIds(node.children, out);
    } else {
      out.add(node.id);
    }
  }
}

export function trailLeafIds(roadmap: RoadmapV2): Set<string> {
  const out = new Set<string>();
  for (const section of roadmap.sections) {
    collectLeafIds(section.children, out);
  }
  return out;
}

function textFields(question: QuizQuestion): Array<[string, string]> {
  return [
    ["pergunta", question.pergunta],
    ["explicacao", question.explicacao],
    ...ALTERNATIVA_IDS.map((alt): [string, string] => [
      `alternativa ${alt}`,
      question.alternativas?.[alt] ?? "",
    ]),
  ];
}

export function validateQuizPool(
  pool: QuizPool,
  fileSlug: string,
  roadmap: RoadmapV2 | null,
): string[] {
  const problems: string[] = [];
  const scope = `pool ${fileSlug}`;

  if (!roadmap) {
    problems.push(`${scope}: slug nao existe no agregado roadmapsV2`);
    return problems;
  }
  if (pool.slug !== fileSlug) {
    problems.push(
      `${scope}: pool.slug "${pool.slug}" diverge do nome do arquivo`,
    );
  }

  const leafIds = trailLeafIds(roadmap);
  const seenIds = new Set<string>();
  const countByLevel: Record<QuizNivel, number> = {
    iniciante: 0,
    intermediario: 0,
    avancado: 0,
  };

  for (const question of pool.questions) {
    const q = `${scope}, pergunta ${question.id}`;

    if (seenIds.has(question.id)) {
      problems.push(`${q}: id duplicado`);
    }
    seenIds.add(question.id);

    if (!NIVEIS.includes(question.nivel)) {
      problems.push(`${q}: nivel invalido "${question.nivel}"`);
      continue;
    }
    countByLevel[question.nivel] += 1;

    const idRe = new RegExp(
      `^${escapeRegExp(fileSlug)}-${NIVEL_ABBR[question.nivel]}-\\d{2}$`,
    );
    if (!idRe.test(question.id)) {
      problems.push(
        `${q}: id fora do formato ${fileSlug}-${NIVEL_ABBR[question.nivel]}-NN`,
      );
    }

    const altKeys = Object.keys(question.alternativas ?? {}).sort();
    if (altKeys.join(",") !== "a,b,c,d") {
      problems.push(`${q}: alternativas devem ser exatamente a, b, c, d`);
    }
    if (!ALTERNATIVA_IDS.includes(question.correta)) {
      problems.push(`${q}: correta "${question.correta}" nao e a, b, c ou d`);
    }
    if (!leafIds.has(question.fonte)) {
      problems.push(
        `${q}: fonte "${question.fonte}" nao resolve numa folha da trilha`,
      );
    }
    for (const [field, value] of textFields(question)) {
      if (!value || value.trim().length === 0) {
        problems.push(`${q}: ${field} vazio`);
      }
      if (DASH_RE.test(value)) {
        problems.push(`${q}: ${field} contem travessao ou meia-risca`);
      }
    }

    // Perguntas de codigo: tipo conhecido, codigo presente exatamente nos
    // tipos de codigo, trecho dentro dos limites da tela e lacuna so (e
    // exatamente uma) no tipo completar.
    if (question.tipo !== undefined && !TIPOS.includes(question.tipo)) {
      problems.push(`${q}: tipo invalido "${question.tipo}"`);
    }
    const ehCodigo = isCodeQuestion(question);
    if (ehCodigo && !question.codigo) {
      problems.push(`${q}: pergunta de codigo sem campo codigo`);
    }
    if (question.codigo && !ehCodigo) {
      problems.push(
        `${q}: campo codigo so e permitido em pergunta de tipo completar, erro ou saida`,
      );
    }
    if (question.codigo) {
      const { linguagem, trecho } = question.codigo;
      if (!linguagem || linguagem.trim().length === 0) {
        problems.push(`${q}: codigo.linguagem vazio`);
      }
      if (!trecho || trecho.trim().length === 0) {
        problems.push(`${q}: codigo.trecho vazio`);
      }
      const linhas = (trecho ?? "").split("\n");
      if (linhas.length > CODE_MAX_LINES) {
        problems.push(
          `${q}: codigo.trecho com ${linhas.length} linhas (maximo ${CODE_MAX_LINES})`,
        );
      }
      const maisLonga = Math.max(...linhas.map((linha) => linha.length));
      if (maisLonga > CODE_MAX_LINE_LENGTH) {
        problems.push(
          `${q}: codigo.trecho com linha de ${maisLonga} caracteres (maximo ${CODE_MAX_LINE_LENGTH})`,
        );
      }
      if (DASH_RE.test(trecho ?? "")) {
        problems.push(`${q}: codigo.trecho com travessao ou meia-risca`);
      }
      const lacunas = (trecho ?? "").split(CODE_PLACEHOLDER).length - 1;
      if (question.tipo === "completar") {
        if (lacunas !== 1) {
          problems.push(
            `${q}: completar exige exatamente uma lacuna ${CODE_PLACEHOLDER} no trecho (encontradas ${lacunas})`,
          );
        }
      } else if (lacunas > 0) {
        problems.push(
          `${q}: lacuna ${CODE_PLACEHOLDER} so e permitida em pergunta completar`,
        );
      }
    }
  }

  for (const nivel of NIVEIS) {
    if (countByLevel[nivel] < POOL_MIN_PER_LEVEL) {
      problems.push(
        `${scope}: nivel ${nivel} tem ${countByLevel[nivel]} perguntas (minimo ${POOL_MIN_PER_LEVEL})`,
      );
    }
  }

  // Cobertura por secao: toda secao da trilha origina pelo menos 1 pergunta
  // (a fonte de alguma pergunta pertence as folhas da secao). Impede a prova
  // de ignorar assuntos inteiros da trilha.
  for (const section of roadmap.sections) {
    const sectionLeafIds = new Set<string>();
    collectLeafIds(section.children, sectionLeafIds);
    const covered = pool.questions.some((question) =>
      sectionLeafIds.has(question.fonte),
    );
    if (!covered) {
      problems.push(
        `${scope}: secao "${section.title}" (${section.level}) nao origina nenhuma pergunta`,
      );
    }
  }

  return problems;
}
