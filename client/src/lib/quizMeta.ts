// Escalares do quiz consumidos pela home (PorOndeComecar, Numeros) sem
// arrastar o platformData inteiro (e o glossario, reexportado por ele) pro
// boot. Fonte unica: platformData importa e reexporta daqui.

export const QUIZ_ESTIMATED_MINUTES = 5;

/** Numero de perguntas da triagem de nivel (fase 1). */
export const TRIAGE_QUESTION_COUNT = 3;

/** Numero de perguntas do quiz de cada nivel (fase 2). */
export const LEVEL_QUESTION_COUNT = 15;
