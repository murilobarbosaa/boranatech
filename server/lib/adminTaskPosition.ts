// Posicao fracionaria do board de Tarefas (admin_tasks.position,
// admin_task_columns.position, admin_task_checklist_items.position).
//
// Motivo de existir separado da rota: e a unica logica NUMERICA do modulo, e o
// modo de falha dela e silencioso. Ponto medio repetido esgota a precisao do
// double em ~50 insercoes no MESMO intervalo, e a partir dai
// (before + after) / 2 devolve exatamente `before`, dois cards passam a empatar
// e a ordem do board vira a ordem que o banco devolver. Nada acusa: a tela
// continua renderizando, so que errado.
//
// Por isso positionBetween NAO devolve number. Devolve um resultado que o
// chamador e OBRIGADO a destrinchar, e o caso "acabou a precisao" e um dos dois
// ramos. Guarda dentro da funcao, nao no call site: um chamador novo nao tem
// como esquecer de rebalancear, porque nao existe caminho que devolva numero
// direto.

/** Espacamento padrao entre vizinhos, e passo do rebalanceamento. */
export const POSITION_STEP = 1000;

/**
 * Menor distancia aceitavel entre dois vizinhos antes de rebalancear.
 *
 * 1e-4 e folgado de proposito: o double aguenta muito mais, mas rebalancear uma
 * coluna e barato (um update por card, so na coluna afetada) e chegar perto do
 * limite da precisao nao tem beneficio nenhum. Larga aqui e barata; apertada la
 * na frente e uma ordem silenciosamente errada.
 */
export const MIN_POSITION_GAP = 1e-4;

export type PositionResult =
  /** Ha espaco: grave `position` no card e nada mais precisa mudar. */
  | { kind: "ok"; position: number }
  /**
   * Nao ha espaco entre os vizinhos. O chamador precisa reescrever as posicoes
   * da coluna inteira (rebalancePositions) e so entao recalcular.
   */
  | { kind: "rebalance" };

/**
 * Posicao para um item inserido ENTRE dois vizinhos, cada um podendo ser null.
 *
 * `before` e a posicao do item imediatamente ACIMA do ponto de solta, `after` a
 * do item imediatamente ABAIXO. Null nos dois = coluna vazia.
 *
 * Vizinhos fora de ordem (before >= after) tambem caem em "rebalance": e o
 * sintoma de posicoes ja empatadas ou corrompidas, e inventar um numero no meio
 * de um intervalo invertido so espalharia o problema.
 */
export function positionBetween(
  before: number | null,
  after: number | null,
): PositionResult {
  if (before === null && after === null) {
    return { kind: "ok", position: POSITION_STEP };
  }
  if (before === null) {
    return { kind: "ok", position: after! - POSITION_STEP };
  }
  if (after === null) {
    return { kind: "ok", position: before + POSITION_STEP };
  }
  if (!Number.isFinite(before) || !Number.isFinite(after)) {
    return { kind: "rebalance" };
  }
  if (after - before < MIN_POSITION_GAP) {
    return { kind: "rebalance" };
  }
  return { kind: "ok", position: (before + after) / 2 };
}

/**
 * Posicoes em espacamento inteiro para uma lista JA na ordem desejada.
 * `rebalancePositions(3)` -> [1000, 2000, 3000].
 */
export function rebalancePositions(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * POSITION_STEP);
}
