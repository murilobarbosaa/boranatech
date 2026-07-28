// Decisao do drop, isolada do DOM e do dnd-kit.
//
// Simular drag em jsdom e caro e frag il, e o que quebra num board Kanban quase
// nunca e o sensor: e a aritmetica de "onde exatamente este card entrou". Entao
// a decisao inteira mora aqui, em funcao pura, e o componente vira casca fina.
// Mesmo movimento de adminTaskPosition.ts no server.
//
// A entrada e a ORDEM VISUAL do board (ids, nada de objeto de dominio) mais o
// par (activeId, overId) que o dnd-kit entrega. A saida e exatamente o corpo que
// o endpoint /crm/tasks/:id/move espera.

export type BoardOrder = {
  /** Colunas na ordem da esquerda para a direita, com os ids na ordem visual. */
  columns: Array<{ id: string; taskIds: string[] }>;
};

export type DropTarget = {
  columnId: string;
  /** Card que fica ACIMA do movido. null = topo da coluna. */
  beforeTaskId: string | null;
  /** Card que fica ABAIXO do movido. null = fim da coluna. */
  afterTaskId: string | null;
};

function arrayMove<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function sameOrder(a: string[], b: string[]) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

/**
 * Onde o card `activeId` deve entrar quando solto sobre `overId`.
 *
 * `overId` e um id de TAREFA (soltou em cima de outro card) ou um id de COLUNA
 * (soltou na area vazia da coluna). Devolve null quando nao ha nada a fazer, e
 * "nada a fazer" inclui o caso mais comum de todos: soltar o card praticamente
 * onde ele ja estava. Sem esse null, todo drag que nao muda nada dispararia uma
 * requisicao de move e uma linha de log de atividade.
 */
export function resolveDropTarget(
  order: BoardOrder,
  activeId: string,
  overId: string | null,
): DropTarget | null {
  if (!overId || overId === activeId) return null;

  const source = order.columns.find((column) => column.taskIds.includes(activeId));
  if (!source) return null;

  const overIsColumn = order.columns.some((column) => column.id === overId);
  const destination = overIsColumn
    ? order.columns.find((column) => column.id === overId)
    : order.columns.find((column) => column.taskIds.includes(overId));
  if (!destination) return null;

  let resulting: string[];

  if (destination.id === source.id) {
    const from = source.taskIds.indexOf(activeId);
    // Soltar na area vazia da propria coluna = mandar para o fim dela.
    const to = overIsColumn
      ? source.taskIds.length - 1
      : source.taskIds.indexOf(overId);
    if (to < 0) return null;
    resulting = arrayMove(source.taskIds, from, to);
    // Solto onde ja estava: nao ha movimento a persistir.
    if (sameOrder(resulting, source.taskIds)) return null;
  } else {
    const withoutActive = destination.taskIds.filter((id) => id !== activeId);
    // Sobre outro card, o movido entra NO LUGAR dele (empurrando-o para baixo);
    // sobre a area vazia da coluna, entra no fim.
    const insertAt = overIsColumn
      ? withoutActive.length
      : withoutActive.indexOf(overId);
    if (insertAt < 0) return null;
    resulting = [
      ...withoutActive.slice(0, insertAt),
      activeId,
      ...withoutActive.slice(insertAt),
    ];
  }

  // Os vizinhos saem da ordem FINAL, nao de indices calculados a mao. E a parte
  // que costuma sair invertida quando se tenta deduzir before/after direto do
  // evento, e ler do array resultante nao tem como se enganar.
  const index = resulting.indexOf(activeId);
  return {
    columnId: destination.id,
    beforeTaskId: index > 0 ? resulting[index - 1] : null,
    afterTaskId: index < resulting.length - 1 ? resulting[index + 1] : null,
  };
}

/**
 * Nova ordem COMPLETA das colunas ao arrastar uma coluna sobre outra.
 *
 * Devolve a lista inteira e nunca um recorte: o endpoint de reorder recusa lista
 * parcial com `incomplete_order`, e devolver "as que mudaram" seria uma armadilha
 * pronta. null quando nada muda.
 */
export function resolveColumnOrder(
  order: BoardOrder,
  activeColumnId: string,
  overColumnId: string | null,
): string[] | null {
  if (!overColumnId || overColumnId === activeColumnId) return null;
  const ids = order.columns.map((column) => column.id);
  const from = ids.indexOf(activeColumnId);
  const to = ids.indexOf(overColumnId);
  if (from < 0 || to < 0) return null;
  const resulting = arrayMove(ids, from, to);
  return sameOrder(resulting, ids) ? null : resulting;
}
