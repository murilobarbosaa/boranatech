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
  CODE_QUESTION_TIPOS,
  isCodeQuestion,
  POOL_MIN_PER_LEVEL,
} from "../shared/roadmapQuiz/types";
import type { RoadmapNode, RoadmapV2 } from "../shared/roadmapV2/types";
import { saidaEsperadaAplicavelEm } from "./languageCapabilities.mts";

const NIVEIS: QuizNivel[] = ["iniciante", "intermediario", "avancado"];
const ALTERNATIVA_IDS = ["a", "b", "c", "d"] as const;
const TIPOS: QuizTipo[] = ["conceito", "completar", "erro", "saida"];
const DASH_RE = /\u2014|\u2013/;

// Referencia a POSICAO de alternativa. Desde que o sorteio embaralha as
// alternativas e o servidor passou a mandar o id por posicao (Lote Q1), a
// letra e a ordem que quem faz a prova ve NAO sao as do arquivo: "a opcao b"
// ou "as duas primeiras alternativas" apontam para outra coisa na tela, e a
// explicacao passa a mentir. Escreva citando o CONTEUDO da alternativa.
//
// As fronteiras sao explicitas ((?![\p{L}\d])) e nao \b, porque \b em
// JavaScript nao entende letra acentuada: em "ultimas", o \b depois de
// "ultima" casaria no meio da palavra.
const POSICAO_RES: RegExp[] = [
  /(?<![\p{L}])(alternativa|op[çc][ãa]o|letra)\s+[a-d](?![\p{L}\d])/giu,
  /(?<![\p{L}])(primeira|segunda|terceira|quarta|[úu]ltima)s?\s+(alternativas?|op[çc][õo]es|op[çc][ãa]o)(?![\p{L}\d])/giu,
  /(?<![\p{L}])(duas|tr[êe]s)\s+(primeiras|[úu]ltimas)\s+(alternativas|op[çc][õo]es)(?![\p{L}\d])/giu,
];

// Exportada para o lote poder medir as pools antigas com o mesmo instrumento.
export function referenciasDePosicao(texto: string): string[] {
  const achados: string[] = [];
  for (const re of POSICAO_RES) {
    for (const m of texto.matchAll(re)) achados.push(m[0]);
  }
  return achados;
}

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
      for (const achado of referenciasDePosicao(value)) {
        problems.push(
          `${q}: ${field} cita posicao de alternativa ("${achado}"): a ordem na tela e embaralhada`,
        );
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
      // saidaEsperada: obrigatoria em erro nas linguagens com saida de
      // terminal (e o que o verificador por execucao compara), opcional em
      // html, css e dockerfile (capacidade em languageCapabilities.mts) e
      // proibida nos demais tipos. Opcional nao e vazia: presente e vazia e
      // defeito de forma.
      const { saidaEsperada } = question.codigo;
      if (
        question.tipo === "erro" &&
        !saidaEsperadaAplicavelEm(linguagem ?? "")
      ) {
        if (saidaEsperada !== undefined && saidaEsperada.trim().length === 0) {
          problems.push(
            `${q}: codigo.saidaEsperada vazia (em ${linguagem} o campo e opcional: omita em vez de deixar vazio)`,
          );
        } else if (saidaEsperada && DASH_RE.test(saidaEsperada)) {
          problems.push(
            `${q}: codigo.saidaEsperada contem travessao ou meia-risca`,
          );
        }
      } else if (question.tipo === "erro") {
        if (!saidaEsperada || saidaEsperada.trim().length === 0) {
          problems.push(`${q}: erro exige codigo.saidaEsperada`);
        } else if (DASH_RE.test(saidaEsperada)) {
          problems.push(
            `${q}: codigo.saidaEsperada contem travessao ou meia-risca`,
          );
        }
      } else if (saidaEsperada !== undefined) {
        problems.push(`${q}: saidaEsperada so em pergunta erro`);
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

    // A linguagem do trecho precisa ser uma das codeLanguages da trilha, e
    // trilha sem codeLanguages nao pode ter pergunta de codigo (o gerador so
    // as produz quando o campo existe).
    if (ehCodigo) {
      const codeLanguages = roadmap.codeLanguages;
      if (!codeLanguages || codeLanguages.length === 0) {
        problems.push(`${q}: pergunta de codigo em trilha sem codeLanguages`);
      } else if (
        question.codigo &&
        !codeLanguages.includes(question.codigo.linguagem)
      ) {
        problems.push(
          `${q}: codigo.linguagem "${question.codigo.linguagem}" fora das codeLanguages da trilha [${codeLanguages.join(", ")}]`,
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

// AVISOS, nao problemas: em trilha com codeLanguages, nivel sem pergunta de
// algum tipo de codigo. O sorteio garante 1 pergunta de codigo por nivel
// (DRAW_MIN_CODE_PER_LEVEL), nao 1 de cada tipo, entao a prova continua
// valida; e desequilibrio de pool, que vale saber (a pool de javascript saiu
// do piloto sem completar no intermediario). Canal separado de
// validateQuizPool de proposito: validateQuizPool.mts e generateRoadmapMeta
// --check imprimem com prefixo [aviso] e nao reprovam.
//
// Lote 10c. Portugues sem acento em string que o usuario le. A lista e
// DELIBERADAMENTE curta: so palavra comum cuja forma sem acento nao existe em
// portugues. Ela nao tenta ser corretor ortografico, e cresce quando um caso
// novo aparecer, no commit que o encontrar.
const SEM_ACENTO = [
  "nao",
  "voce",
  "sao",
  "codigo",
  "funcao",
  "numero",
  "parametro",
  "entao",
  "execucao",
  "padrao",
  "metodo",
  "tambem",
  "alem",
  "unico",
  "valido",
  "invalido",
  "opcao",
  "generico",
  "variavel",
  "possivel",
  "assercao",
  "incompativel",
];

// Duas exclusoes, sem as quais o guarda vira ruido. A primeira e o que esta
// entre crases, onde mora identificador e nome de tipo. A segunda sao as
// alternativas de pergunta com alternativasCodigo, que sao codigo e nao prosa:
// medido nas 29 pools, sem ela as quatro alternativas de javascript-ini-11
// (`numero % 2 === 0 ? 'par' : 'impar'`) viram quatro acusacoes sobre um
// identificador legitimo. codigo.trecho nunca entra porque textFields nao o
// devolve.
export function portuguesSemAcento(texto: string): string[] {
  const semCrases = texto.replace(/`[^`]*`/g, " ");
  return SEM_ACENTO.filter((palavra) =>
    new RegExp(`\\b${palavra}\\b`, "i").test(semCrases),
  );
}

export function quizPoolWarnings(
  pool: QuizPool,
  roadmap: RoadmapV2 | null,
): string[] {
  const out: string[] = [];
  // ANTES do corte por codeLanguages de proposito: ortografia vale para as 29
  // pools, e 27 delas nao tem codeLanguages nenhuma.
  //
  // Entra como AVISO, e nao como erro em validateQuizPool, porque pool
  // PUBLICADA ainda acusa: javascript-int-14 cita no enunciado a mensagem
  // literal `id invalido` que o proprio trecho imprime, e acentuar mudaria a
  // mensagem. Para virar erro falta essa pool sair limpa, o que e lote proprio.
  for (const question of pool.questions) {
    for (const [field, value] of textFields(question)) {
      if (question.alternativasCodigo && field.startsWith("alternativa ")) {
        continue;
      }
      for (const palavra of portuguesSemAcento(value)) {
        out.push(
          `pool ${pool.slug}: ${question.id} ${field} tem "${palavra}" sem acento`,
        );
      }
    }
  }
  if (!roadmap?.codeLanguages || roadmap.codeLanguages.length === 0) return out;
  for (const nivel of NIVEIS) {
    for (const tipo of CODE_QUESTION_TIPOS) {
      const tem = pool.questions.some(
        (question) => question.nivel === nivel && question.tipo === tipo,
      );
      if (!tem) {
        out.push(`pool ${pool.slug}: nivel ${nivel} sem pergunta ${tipo}`);
      }
    }
  }
  return out;
}
