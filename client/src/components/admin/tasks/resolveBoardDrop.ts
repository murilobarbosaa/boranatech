import { resolveDropTarget, type BoardOrder } from "./resolveDropTarget";
import { groupValueOf, isGroupContainer, type GroupBy, type TaskGroup } from "./taskFilters";

// O que um drop SIGNIFICA, dado o agrupamento e o estado do filtro.
//
// Existe separado do resolveDropTarget porque este e o ponto mais perigoso da
// tela, e o perigo e silencioso:
//
//   O resolveDropTarget calcula vizinhos a partir da lista VISIVEL. Com filtro
//   ligado, soltar entre dois cards visiveis A e B, havendo cards OCULTOS entre
//   eles na ordenacao real, produz um ponto medio em posicao arbitraria em
//   relacao aos ocultos. A tela fica certa, a ordenacao real fica indefinida, e
//   ninguem descobre ate limpar o filtro.
//
// A resolucao adotada: com filtro ativo, reordenar dentro da coluna vira no-op;
// mover ENTRE colunas continua valendo, entrando no fim da coluna de destino
// (que nao depende de vizinho nenhum, entao nao tem a ambiguidade).
//
// Com agrupamento fora de etapa, a posicao nao tem significado no grupo ("Alta"
// nao tem ordem propria), entao soltar altera a PROPRIEDADE e nunca a ordem.

export type BoardDropAction =
  | { kind: "none" }
  | {
      kind: "move";
      columnId: string;
      beforeTaskId: string | null;
      afterTaskId: string | null;
    }
  | { kind: "priority"; value: string }
  | { kind: "assignee"; value: string | null };

export type DropContext = {
  order: BoardOrder;
  groups: TaskGroup[];
  groupBy: GroupBy;
  filtersActive: boolean;
  /**
   * Ids das etapas fixadas do quadro. Card NAO entra nelas: elas significam
   * "criado pelo Sentry, ninguem triou", e e essa semantica que autoriza o job a
   * arquivar e ressuscitar sozinho. SAIR delas e o fluxo principal e continua
   * liberado.
   *
   * O servidor tambem recusa (rota /tasks/:id/move). Aqui e para a tela nao
   * CONVIDAR para o erro: soltar e ver um 409 e pior que nao poder soltar.
   */
  pinnedColumnIds: readonly string[];
  /** Estado atual da tarefa arrastada, para nao emitir acao que nao muda nada. */
  task: {
    id: string;
    column_id: string;
    priority: string;
    assignee_id: string | null;
  };
};

/** Container (coluna ou grupo) que contem o id, seja ele card ou o proprio container. */
function containerOf(groups: TaskGroup[], overId: string): string | null {
  if (groups.some((group) => group.id === overId)) return overId;
  return (
    groups.find((group) => group.tasks.some((task) => task.id === overId))?.id ??
    null
  );
}

export function resolveBoardDrop(
  context: DropContext,
  overId: string | null,
): BoardDropAction {
  const { order, groups, groupBy, filtersActive, task } = context;
  if (!overId || overId === task.id) return { kind: "none" };

  if (groupBy !== "column") {
    const container = containerOf(groups, overId);
    if (!container || !isGroupContainer(container)) return { kind: "none" };
    const value = groupValueOf(container);

    if (groupBy === "priority") {
      // Prioridade nao tem grupo "sem": um container sem valor aqui e estado
      // impossivel, e emitir acao nele gravaria lixo.
      if (value === null || value === task.priority) return { kind: "none" };
      return { kind: "priority", value };
    }
    if (value === task.assignee_id) return { kind: "none" };
    return { kind: "assignee", value };
  }

  const target = resolveDropTarget(order, task.id, overId);
  if (!target) return { kind: "none" };

  // Entrada na etapa fixada recusada, inclusive vinda dela mesma (reordenar
  // dentro). Sair continua valendo: e a triagem.
  if (
    target.columnId !== task.column_id &&
    context.pinnedColumnIds.includes(target.columnId)
  ) {
    return { kind: "none" };
  }
  if (
    target.columnId === task.column_id &&
    context.pinnedColumnIds.includes(target.columnId)
  ) {
    // Reordenar DENTRO da etapa fixada nao tem significado: a ordem ali e a de
    // chegada do feed, e mexer nela seria estado que o proximo sync ignora.
    return { kind: "none" };
  }

  if (filtersActive) {
    // Reordenar dentro da mesma etapa e ambiguo: nao faz nada.
    if (target.columnId === task.column_id) return { kind: "none" };
    // Trocar de etapa entra no FIM, sem vizinho declarado.
    return {
      kind: "move",
      columnId: target.columnId,
      beforeTaskId: null,
      afterTaskId: null,
    };
  }

  return {
    kind: "move",
    columnId: target.columnId,
    beforeTaskId: target.beforeTaskId,
    afterTaskId: target.afterTaskId,
  };
}
