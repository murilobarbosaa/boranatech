// Logica pura do quiz de trilha (fase 4.2): sorteio, correcao e projecao
// publica das perguntas. Nenhuma funcao toca banco ou rede; o roteador
// (routes/roadmapQuiz.ts) injeta o pool server-only e o snapshot persistido
// em roadmap_quiz_attempts. O gabarito (correta/explicacao) entra aqui pelo
// pool e so sai no retorno de gradeAttempt como boolean por pergunta; a
// projecao pro client (toPublicQuestions) nunca o inclui.
import {
  COOLDOWN_HOURS,
  DRAW_BY_LEVEL,
  DRAW_MIN_CODE_PER_LEVEL,
  isCodeQuestion,
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
//
// `exibicao` marca a tentativa em que o id que sai pro client e a POSICAO de
// exibicao, nao a letra do arquivo da pool. Ele existe porque a letra vazava o
// gabarito: as pools sao desbalanceadas por letra (em gamedev, 35 das 45
// corretas eram "b"), entao marcar sempre a letra mais frequente aprovava em
// 86% das tentativas simuladas, contra 0,35% no chute. Com a posicao, que sai
// de um embaralhamento uniforme, a correta fica uniforme sobre as quatro
// posicoes qualquer que seja a letra dela no arquivo.
//
// O campo e OPCIONAL de proposito: tentativa criada antes do deploy nao o tem
// e segue com o comportamento antigo (id igual a letra original) ate terminar,
// para nao corrigir errado quem estava com a prova aberta. Nao ha migration:
// questions e jsonb e o campo e aditivo. O ARMAZENAMENTO (answers) continua
// sempre em letra original, nos dois casos.
export interface AttemptQuestionSnapshot {
  id: string;
  alternativas: QuizAlternativaId[];
  exibicao?: "posicao";
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
// Em cada nivel com pergunta de codigo entre as candidatas, pelo menos
// DRAW_MIN_CODE_PER_LEVEL entra na tentativa, para a prova de trilha de
// linguagem sempre ter codigo em cada nivel. Pool sem pergunta de codigo nao
// muda em nada. A ordem das perguntas e a das alternativas de cada uma saem
// embaralhadas; rng e injetavel pra teste deterministico.
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
    const codigo = candidatas.filter(isCodeQuestion);
    const demais = candidatas.filter((question) => !isCodeQuestion(question));
    const garantidas = shuffle(codigo, rng).slice(0, DRAW_MIN_CODE_PER_LEVEL);
    const restantes = shuffle(
      [
        ...codigo.filter((question) => !garantidas.includes(question)),
        ...demais,
      ],
      rng,
    ).slice(0, DRAW_BY_LEVEL[nivel] - garantidas.length);
    selecionadas.push(
      ...[...garantidas, ...restantes].map((question) => question.id),
    );
  }
  return shuffle(selecionadas, rng).map((id) => ({
    id,
    alternativas: shuffle(ALTERNATIVA_IDS, rng),
    exibicao: "posicao" as const,
  }));
}

// Letra original -> id de exibicao (a posicao da alternativa no snapshot).
// Entrada sem `exibicao` e identidade: e a tentativa legada, cujo client ja
// recebeu os ids originais. Devolve null quando a letra nao esta no snapshot.
export function idDeExibicao(
  entry: AttemptQuestionSnapshot,
  original: QuizAlternativaId,
): QuizAlternativaId | null {
  if (entry.exibicao !== "posicao") return original;
  const posicao = entry.alternativas.indexOf(original);
  if (posicao < 0) return null;
  return ALTERNATIVA_IDS[posicao] ?? null;
}

// Id de exibicao -> letra original, o caminho que TODA resposta vinda do
// client percorre antes de ser gravada ou corrigida. Devolve null para id fora
// de a-d e para posicao que o snapshot nao tem; a rota traduz null em 400.
export function idOriginal(
  entry: AttemptQuestionSnapshot,
  exibido: string,
): QuizAlternativaId | null {
  const posicao = ALTERNATIVA_IDS.indexOf(exibido as QuizAlternativaId);
  if (posicao < 0) return null;
  if (entry.exibicao !== "posicao") return exibido as QuizAlternativaId;
  return entry.alternativas[posicao] ?? null;
}

// Mapa inteiro de respostas, exibicao -> original. Devolve null se QUALQUER
// pergunta ou valor nao converter: resposta que chega errada e recusada, nunca
// gravada por aproximacao (o valor E a informacao, nao apresentacao).
export function respostasParaOriginal(
  snapshot: AttemptQuestionSnapshot[],
  answers: Record<string, string>,
): Record<string, QuizAlternativaId> | null {
  const out: Record<string, QuizAlternativaId> = {};
  for (const [questionId, valor] of Object.entries(answers)) {
    const entry = snapshot.find((item) => item.id === questionId);
    if (!entry) return null;
    const original = idOriginal(entry, valor);
    if (!original) return null;
    out[questionId] = original;
  }
  return out;
}

// Mapa inteiro de respostas, original -> exibicao, para devolver ao client na
// retomada. Pergunta que nao esta no snapshot, ou valor que nao converte, sai
// OMITIDA: o client a mostra como nao respondida, que e o unico jeito de
// degradar sem exibir uma alternativa marcada errada. O armazenamento nao e
// tocado, entao a correcao continua sobre a letra original gravada.
export function respostasParaExibicao(
  snapshot: AttemptQuestionSnapshot[],
  answers: Record<string, QuizAlternativaId>,
): Record<string, QuizAlternativaId> {
  const out: Record<string, QuizAlternativaId> = {};
  for (const [questionId, valor] of Object.entries(answers)) {
    const entry = snapshot.find((item) => item.id === questionId);
    if (!entry) continue;
    const exibido = idDeExibicao(entry, valor);
    if (!exibido) continue;
    out[questionId] = exibido;
  }
  return out;
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
      // O id sai em POSICAO de exibicao (ver AttemptQuestionSnapshot), entao
      // a letra do arquivo nunca chega ao client. Em tentativa legada
      // idDeExibicao e identidade e o payload fica igual ao de antes.
      alternativas: entry.alternativas.map((alt) => ({
        id: idDeExibicao(entry, alt) ?? alt,
        texto: question.alternativas[alt],
      })),
      fonte: question.fonte,
      // Campos de pergunta de codigo, so quando presentes: o JSON de pool sem
      // eles continua identico ao de antes.
      ...(question.tipo ? { tipo: question.tipo } : {}),
      ...(question.codigo ? { codigo: question.codigo } : {}),
      ...(question.alternativasCodigo
        ? { alternativasCodigo: question.alternativasCodigo }
        : {}),
    });
  }
  return out;
}

// Revisao completa da tentativa APROVADA: unico fluxo em que correta e
// explicacao saem do server (regra de revelacao da rota). Pergunta que sumiu
// do pool (anulada na correcao) e omitida. Vive na lib, e nao na rota, para o
// teste alcancar os ids sem passar por Express: `correta` e `respostaDoUsuario`
// tambem saem em id de exibicao, senao a revisao entregaria a letra original e
// desfaria a correcao deste lote.
export function buildApprovedReview(
  pool: QuizPool,
  snapshot: AttemptQuestionSnapshot[],
  answers: Record<string, QuizAlternativaId | undefined>,
) {
  const out = [];
  for (const entry of snapshot) {
    const question = pool.questions.find((q) => q.id === entry.id);
    if (!question) continue;
    const resposta = answers[question.id];
    out.push({
      id: question.id,
      pergunta: question.pergunta,
      alternativas: entry.alternativas.map((alt) => ({
        id: idDeExibicao(entry, alt) ?? alt,
        texto: question.alternativas[alt],
      })),
      correta: idDeExibicao(entry, question.correta) ?? question.correta,
      explicacao: question.explicacao,
      respostaDoUsuario: resposta
        ? (idDeExibicao(entry, resposta) ?? null)
        : null,
      // Campos de pergunta de codigo, so quando presentes (mesmo padrao de
      // toPublicQuestions); a revisao continua carregando o gabarito porque a
      // tentativa e aprovada.
      ...(question.tipo ? { tipo: question.tipo } : {}),
      ...(question.codigo ? { codigo: question.codigo } : {}),
      ...(question.alternativasCodigo
        ? { alternativasCodigo: question.alternativasCodigo }
        : {}),
    });
  }
  return out;
}

const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

export interface RetakeGate {
  allowed: boolean;
  // ISO do momento em que o cooldown expira; presente so quando allowed=false.
  retryAt?: string;
  // Tentativas restantes no ciclo atual (RETAKE_LIMIT - reprovacoes do ciclo).
  // RETAKE_LIMIT quando nunca reprovou nesta janela; 0 em cooldown.
  remaining: number;
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
    return {
      allowed: false,
      retryAt: new Date(cooldownUntil).toISOString(),
      remaining: 0,
    };
  }
  // Quando liberado, count e sempre < RETAKE_LIMIT (o ciclo cheio ou reseta ou
  // vira cooldown acima), entao remaining fica entre 1 e RETAKE_LIMIT; sem
  // nenhuma reprovada, count=0 -> remaining=RETAKE_LIMIT (primeira tentativa).
  return { allowed: true, remaining: RETAKE_LIMIT - count };
}
