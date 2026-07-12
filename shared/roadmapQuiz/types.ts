// Tipos e constantes do quiz de trilha (Fase 4). Este arquivo descreve so o
// SHAPE das perguntas, sem nenhum dado: pode viver em shared. O pool COM
// gabarito vive em server/data/roadmapQuizzes/ e NUNCA pode ser importado
// (direta ou indiretamente) por codigo de client/src; o client so recebe
// PublicQuizQuestion (sem correta e sem explicacao) via API.

export type QuizNivel = "iniciante" | "intermediario" | "avancado";

export type QuizAlternativaId = "a" | "b" | "c" | "d";

export interface QuizQuestion {
  // Id estavel no formato <slug>-<ini|int|av>-<NN>, gerado pelo script (nunca
  // pela IA). Tentativas de quiz referenciam esses ids: renomear ou reordenar
  // ids invalida tentativas registradas.
  id: string;
  nivel: QuizNivel;
  pergunta: string;
  alternativas: Record<QuizAlternativaId, string>;
  correta: QuizAlternativaId;
  explicacao: string;
  // Id da folha da trilha v2 que originou a pergunta.
  fonte: string;
}

export interface QuizPool {
  slug: string;
  questions: QuizQuestion[];
}

// Shape publico: o unico que a API pode expor ao client (sem gabarito). As
// alternativas viram array na ordem de exibicao embaralhada do snapshot da
// tentativa; o Record a-d do pool e convertido na borda pelo server.
export type PublicQuizQuestion = Omit<
  QuizQuestion,
  "correta" | "explicacao" | "alternativas"
> & {
  alternativas: Array<{ id: QuizAlternativaId; texto: string }>;
};

// Uma tentativa sorteia 10 perguntas (3 iniciante, 4 intermediario,
// 3 avancado) e aprova com 6 acertos ou mais.
export const QUESTIONS_PER_ATTEMPT = 10;
export const DRAW_BY_LEVEL: Record<QuizNivel, number> = {
  iniciante: 3,
  intermediario: 4,
  avancado: 3,
};
export const PASS_SCORE = 6;

// Tamanho do pool por nivel: o gerador mira 15 e a validacao exige pelo
// menos 10 (o sorteio precisa de folga pra variar entre tentativas).
export const POOL_TARGET_PER_LEVEL = 15;
export const POOL_MIN_PER_LEVEL = 10;
