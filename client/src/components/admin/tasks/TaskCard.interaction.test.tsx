import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TaskCard } from "./TaskCard";
import type { TaskCard as TaskCardData } from "./types";

const task = {
  id: "synthetic-task",
  column_id: "column-a",
  number: 1,
  title: "Texto copiável da tarefa",
  priority: "media",
  type: "tarefa",
  source: "human",
  archived_at: null,
  label_ids: [],
  assignee_id: null,
  due_date: null,
  checklist_total: 0,
  checklist_done: 0,
  comment_count: 0,
  estimate: null,
} as unknown as TaskCardData;
const columns = [
  { id: "column-a", name: "A fazer", is_pinned: false },
  { id: "column-b", name: "Em andamento", is_pinned: false },
  { id: "intake", name: "Entrada Sentry", is_pinned: true },
];
afterEach(cleanup);

describe("card sem drag-and-drop", () => {
  it("rolar, tocar, pressionar e selecionar texto não movem nem abrem a tarefa", () => {
    const onMove = vi.fn();
    const onOpen = vi.fn();
    const { container } = render(
      <TaskCard
        task={task}
        boardKey="DEV"
        labelsById={new Map()}
        assigneesById={new Map()}
        columns={columns}
        isSelected={false}
        isPending={false}
        onOpen={onOpen}
        onMove={onMove}
        onUnarchive={vi.fn()}
      />,
    );
    const card = container.querySelector("article")!;
    fireEvent.dragStart(card);
    fireEvent.dragOver(card);
    fireEvent.drop(card);
    fireEvent.scroll(card);
    fireEvent.touchStart(card);
    fireEvent.touchMove(card);
    fireEvent.touchEnd(card);
    fireEvent.pointerDown(card);
    fireEvent.pointerUp(card);
    fireEvent.click(screen.getByText("Texto copiável da tarefa"));
    const selection = window.getSelection();
    selection?.selectAllChildren(screen.getByText("Texto copiável da tarefa"));
    expect(selection?.toString()).toContain("Texto copiável");
    expect(onMove).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
    expect(card.hasAttribute("draggable")).toBe(false);
    expect(card.className).not.toContain("touch-none");
    expect(screen.queryByRole("option", { name: "Entrada Sentry" })).toBeNull();
    expect(screen.queryByRole("option", { name: "A fazer" })).toBeNull();
  });
  it("só o seletor explícito move; botão Abrir funciona por teclado", () => {
    const onMove = vi.fn();
    const onOpen = vi.fn();
    render(
      <TaskCard
        task={task}
        boardKey="DEV"
        labelsById={new Map()}
        assigneesById={new Map()}
        columns={columns}
        isSelected={false}
        isPending={false}
        onOpen={onOpen}
        onMove={onMove}
        onUnarchive={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Mover DEV-1 para"), {
      target: { value: "column-b" },
    });
    expect(onMove).toHaveBeenCalledExactlyOnceWith(
      "synthetic-task",
      "column-b",
    );
    const open = screen.getByRole("button", { name: "Abrir tarefa" });
    open.focus();
    fireEvent.keyDown(open, { key: "Enter" });
    fireEvent.click(open);
    expect(onOpen).toHaveBeenCalledExactlyOnceWith("synthetic-task");
  });
});
