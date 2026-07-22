// Logica pura do quiz de trilha (fase 4.2): sorteio, correcao e projecao
// publica das perguntas. Nenhuma funcao toca banco ou rede; o roteador
// (routes/roadmapQuiz.ts) injeta o pool server-only e o snapshot persistido
// em roadmap_quiz_attempts. O gabarito (correta/explicacao) entra aqui pelo
// pool e so sai no retorno de gradeAttempt como boolean por pergunta; a
// projecao pro client (toPublicQuestions) nunca o inclui.
import {
  COOLDOWN_HOURS,
  DRAW_BY_LEVEL,
  PASS_SCORE,
  RETAKE_LIMIT,
  type PublicQuizQuestion,
  type QuizAlternativaId,
  type QuizNivel,
  type QuizPool,
} from "../../shared/roadmapQuiz/types";

// Snapshot persistido em roadmap_quiz_attempts.questions: a ordem das
// perguntas do sorteio e, por pergunta, a ordem de exibicao embaralhada das
// alternativas. NUNCA contem gabarito.
export interface AttemptQuestionSnapshot {
  id: string;
  alternativas: QuizAlternativaId[];
}

export type QuizRng = () => number;

const NIVEIS: QuizNivel[] = ["iniciante", "intermediario", "avancado"];
const ALTERNATIVA_IDS: QuizAlternativaId[] = ["a", "b", "c", "d"];

function shuffle<T>(items: T[], rng: QuizRng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Sorteia DRAW_BY_LEVEL perguntas por nivel excluindo os ids de exclude (a
// tentativa anterior do usuario, anti-repeticao imediata). Nivel sem
// candidatos suficientes fora da exclusao relaxa a exclusao SO naquele nivel.
// A ordem das perguntas e a das alternativas de cada uma saem embaralhadas;
// rng e injetavel pra teste deterministico.
export function drawQuestions(
  pool: QuizPool,
  exclude: Set<string>,
  rng: QuizRng = Math.random,
): AttemptQuestionSnapshot[] {
  const selecionadas: string[] = [];
  for (const nivel of NIVEIS) {
    const doNivel = pool.questions.filter(
      (question) => question.nivel === nivel,
    );
    let candidatas = doNivel.filter((question) => !exclude.has(question.id));
    if (candidatas.length < DRAW_BY_LEVEL[nivel]) {
      console.warn(
        `[roadmapQuiz] pool ${pool.slug}: nivel ${nivel} com ${candidatas.length} candidatas fora da exclusao (precisa de ${DRAW_BY_LEVEL[nivel]}); relaxando a exclusao neste nivel.`,
      );
      candidatas = doNivel;
    }
    selecionadas.push(
      ...shuffle(candidatas, rng)
        .slice(0, DRAW_BY_LEVEL[nivel])
        .map((question) => question.id),
    );
  }
  return shuffle(selecionadas, rng).map((id) => ({
    id,
    alternativas: shuffle(ALTERNATIVA_IDS, rng),
  }));
}

export interface QuestionGrade {
  id: string;
  acertou: boolean;
  anulada?: boolean;
}

export interface AttemptGrade {
  score: number;
  aprovado: boolean;
  porPergunta: QuestionGrade[];
}

// Corrige as respostas contra o pool ATUAL do disco. Pergunta do snapshot que
// nao existe mais no pool (Ana editou ou o pool foi regenerado) e ANULADA A
// FAVOR do aluno: conta como acerto e sai com anulada: true. Pergunta sem
// resposta conta como errada.
export function gradeAttempt(
  pool: QuizPool,
  snapshot: AttemptQuestionSnapshot[],
  answers: Record<string, QuizAlternativaId | undefined>,
): AttemptGrade {
  const porPergunta: QuestionGrade[] = snapshot.map((entry) => {
    const question = pool.questions.find((q) => q.id === entry.id);
    if (!question) {
      return { id: entry.id, acertou: true, anulada: true };
    }
    return { id: entry.id, acertou: answers[entry.id] === question.correta };
  });
  const score = porPergunta.filter((grade) => grade.acertou).length;
  return { score, aprovado: score >= PASS_SCORE, porPergunta };
}

// UNICA funcao que produz payload de pergunta pro client: materializa o
// snapshot no shape PublicQuizQuestion, com as alternativas ja na ordem
// embaralhada do snapshot e ZERO campos de gabarito. Pergunta que sumiu do
// pool e omitida da exibicao (a correcao a anula a favor do aluno).
export function toPublicQuestions(
  pool: QuizPool,
  snapshot: AttemptQuestionSnapshot[],
): PublicQuizQuestion[] {
  const out: PublicQuizQuestion[] = [];
  for (const entry of snapshot) {
    const question = pool.questions.find((q) => q.id === entry.id);
    if (!question) continue;
    out.push({
      id: question.id,
      nivel: question.nivel,
      pergunta: question.pergunta,
      alternativas: entry.alternativas.map((alt) => ({
        id: alt,
        texto: question.alternativas[alt],
      })),
      fonte: question.fonte,
    });
  }
  return out;
}

const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

export interface RetakeGate {
  allowed: boolean;
  // ISO do momento em que o cooldown expira; presente so quando allowed=false.
  retryAt?: string;
}

// Regra de tentativas da barra unica, derivada SO dos timestamps de reprovacao
// (em ms, ASCENDENTES) sem coluna nova. Agrupa as reprovadas em ciclos de
// RETAKE_LIMIT: ao fechar o ciclo (RETAKE_LIMIT reprovadas), o cooldown vai ate
// COOLDOWN_MS depois da ultima reprovada do ciclo. Passado o cooldown o ciclo
// reseta (libera RETAKE_LIMIT de novo); em cooldown, bloqueia e devolve o
// retryAt. Os dados sao auto-consistentes: uma reprovada so existe se o gate a
// permitiu, entao contar em ordem cronologica reproduz os ciclos reais.
export function evaluateRetakeGate(
  failedAtMs: number[],
  nowMs: number,
): RetakeGate {
  let count = 0;
  let cooldownUntil: number | null = null;
  for (const ts of failedAtMs) {
    count += 1;
    if (count >= RETAKE_LIMIT) {
      const end = ts + COOLDOWN_MS;
      if (nowMs >= end) {
        count = 0;
        cooldownUntil = null;
      } else {
        cooldownUntil = end;
      }
    }
  }
  if (count >= RETAKE_LIMIT && cooldownUntil !== null) {
    return { allowed: false, retryAt: new Date(cooldownUntil).toISOString() };
  }
  return { allowed: true };
}
