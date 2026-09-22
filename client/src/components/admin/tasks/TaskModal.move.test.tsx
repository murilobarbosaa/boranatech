import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { Task, TaskColumn } from "./types";

const svc = vi.hoisted(() => ({ getTask: vi.fn() }));
vi.mock("@/services/adminTasksService", () => ({
  getTask: (...args: unknown[]) => svc.getTask(...args),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "admin-sintetico" } }),
}));
vi.mock("./TaskProperties", () => ({
  TaskProperties: ({
    task,
    onChangeColumn,
  }: {
    task: Task;
    onChangeColumn: (columnId: string) => void;
  }) => (
    <div>
      <output aria-label="Etapa atual">{task.column_id}</output>
      <button type="button" onClick={() => onChangeColumn("col-b")}>
        Mover para B
      </button>
    </div>
  ),
}));

import { TaskModal } from "./TaskModal";

const task: Task = {
  id: "task-1",
  board_id: "board-1",
  column_id: "col-a",
  number: 1,
  title: "Tarefa sintética",
  description: "",
  notes: null,
  position: 1000,
  priority: "media",
  type: "tarefa",
  assignee_id: null,
  created_by: "admin-sintetico",
  updated_by: null,
  due_date: null,
  estimate: null,
  completed_at: null,
  archived_at: null,
  source: "human",
  sentry_issue_id: null,
  sentry_issue_url: null,
  sentry_reopen_event_at: null,
  archived_source: null,
  created_at: "2026-09-22T00:00:00Z",
  updated_at: "2026-09-22T00:00:00Z",
};
const columns = ["col-a", "col-b"].map(
  (id, index): TaskColumn => ({
    id,
    board_id: "board-1",
    name: id,
    color: "#94A3B8",
    position: (index + 1) * 1000,
    wip_limit: null,
    is_start: index === 0,
    is_done: false,
    is_pinned: false,
    intake_source: null,
    created_at: "2026-09-22T00:00:00Z",
    updated_at: "2026-09-22T00:00:00Z",
  }),
);

afterEach(cleanup);

it.each([
  [false, "col-a"],
  [true, "col-b"],
] as const)(
  "modal só reflete mudança de etapa após gravação %s",
  async (saved, expected) => {
    svc.getTask.mockResolvedValue({
      task,
      label_ids: [],
      comments: [],
      checklist: [],
      activity: [],
      activity_has_more: false,
    });
    let finishMove: ((saved: boolean) => void) | undefined;
    const onMoveTask = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          finishMove = resolve;
        }),
    );
    render(
      <TaskModal
        taskId={task.id}
        boardKey="DEV"
        columns={columns}
        admins={[]}
        labels={[]}
        siblingsInColumn={[]}
        onClose={vi.fn()}
        onOpenTask={vi.fn()}
        onMoveTask={onMoveTask}
        onPatchCard={vi.fn()}
        onBoardChanged={vi.fn()}
        onRemoveCard={vi.fn()}
      />,
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Mover para B" })).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Mover para B" }));
    expect(screen.getByLabelText("Etapa atual").textContent).toBe("col-a");
    expect(onMoveTask).toHaveBeenCalledTimes(1);
    await act(async () => finishMove?.(saved));
    expect(screen.getByLabelText("Etapa atual").textContent).toBe(expected);
  },
);
