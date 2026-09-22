/** Destinos de mudança de etapa; etapas fixadas só recebem tarefas do feed. */
export function isTaskMoveDestination(
  column: { id: string; is_pinned: boolean },
  currentColumnId: string,
): boolean {
  return column.id !== currentColumnId && !column.is_pinned;
}

export function taskMoveDestinations<
  T extends { id: string; is_pinned: boolean },
>(columns: readonly T[], currentColumnId: string): T[] {
  return columns.filter((column) =>
    isTaskMoveDestination(column, currentColumnId),
  );
}
