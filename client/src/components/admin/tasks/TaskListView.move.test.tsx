import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TaskListView } from "./TaskListView";
import type { TaskGroup } from "./taskFilters";

const groups = [
  {
    id: "todo",
    value: "todo",
    label: "A fazer",
    color: null,
    totalBeforeFilter: 1,
    tasks: [
      {
        id: "task-1",
        column_id: "todo",
        number: 1,
        title: "Texto selecionável da lista",
        priority: "media",
        type: "tarefa",
        label_ids: [],
        assignee_id: null,
        archived_at: null,
        due_date: null,
        estimate: null,
      },
    ],
  },
] as unknown as TaskGroup[];
const columns = [
  { id: "intake", name: "Entrada fixa", is_pinned: true },
  { id: "todo", name: "A fazer", is_pinned: false },
  { id: "done", name: "Concluído", is_pinned: false },
];
afterEach(cleanup);

function renderList(pendingTaskIds = new Set<string>()) {
  const onMoveTask = vi.fn();
  const onOpenTask = vi.fn();
  render(
    <TaskListView
      groups={groups}
      boardKey="DEV"
      labelsById={new Map()}
      assigneesById={new Map()}
      columns={columns}
      pendingTaskIds={pendingTaskIds}
      selectedTaskId={null}
      filtersActive={false}
      onOpenTask={onOpenTask}
      onMoveTask={onMoveTask}
      onUnarchive={vi.fn()}
      onClearFilters={vi.fn()}
    />,
  );
  return { onMoveTask, onOpenTask };
}

it("lista preserva seleção e só oferece destino válido", () => {
  const { onMoveTask, onOpenTask } = renderList();
  const title = screen.getByText("Texto selecionável da lista");
  expect(title.closest("[data-task-id]")?.getAttribute("data-task-id")).toBe(
    "task-1",
  );
  fireEvent.click(title);
  window.getSelection()?.selectAllChildren(title);
  expect(window.getSelection()?.toString()).toContain("Texto selecionável");
  expect(onOpenTask).not.toHaveBeenCalled();
  expect(onMoveTask).not.toHaveBeenCalled();
  expect(screen.queryByRole("option", { name: "Entrada fixa" })).toBeNull();
  expect(screen.queryByRole("option", { name: "A fazer" })).toBeNull();
  fireEvent.change(screen.getByLabelText("Mover DEV-1 para"), {
    target: { value: "done" },
  });
  expect(onMoveTask).toHaveBeenCalledExactlyOnceWith("task-1", "done");
});

it("lista bloqueia o seletor enquanto a tarefa está pendente", () => {
  renderList(new Set(["task-1"]));
  expect(
    (screen.getByLabelText("Mover DEV-1 para") as HTMLSelectElement).disabled,
  ).toBe(true);
});
