import express from "express";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const ids = {
  task: "00000000-0000-4000-8000-000000000001",
  board: "00000000-0000-4000-8000-000000000002",
  intake: "00000000-0000-4000-8000-000000000003",
  todo: "00000000-0000-4000-8000-000000000004",
  done: "00000000-0000-4000-8000-000000000005",
  actor: "00000000-0000-4000-8000-000000000006",
};
const fixture = vi.hoisted(() => ({
  task: null as Record<string, unknown> | null,
  columns: {} as Record<string, Record<string, unknown>>,
  updates: [] as Record<string, unknown>[],
  activity: [] as Record<string, unknown>[],
}));
vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from(table: string) {
      if (table === "admin_task_activity")
        return {
          insert: async (row: Record<string, unknown>) => {
            fixture.activity.push(row);
            return { error: null };
          },
        };
      if (table === "admin_tasks")
        return {
          select: () => ({
            eq() {
              return this;
            },
            maybeSingle: async () => ({ data: fixture.task, error: null }),
          }),
          update(patch: Record<string, unknown>) {
            fixture.updates.push(patch);
            return {
              eq() {
                return this;
              },
              select: () => ({
                maybeSingle: async () => {
                  fixture.task = { ...fixture.task, ...patch };
                  return { data: fixture.task, error: null };
                },
              }),
            };
          },
        };
      if (table === "admin_task_columns")
        return {
          select: () => ({
            id: "",
            eq(field: string, value: string) {
              if (field === "id") this.id = value;
              return this;
            },
            maybeSingle: async function () {
              return { data: fixture.columns[this.id] ?? null, error: null };
            },
          }),
        };
      throw new Error(`Tabela não simulada: ${table}`);
    },
  },
}));

import tasksRouter from "./adminTasks";

let server: Server;
let baseUrl: string;
const column = (
  id: string,
  name: string,
  isDone = false,
  isPinned = false,
) => ({
  id,
  name,
  board_id: ids.board,
  is_done: isDone,
  is_pinned: isPinned,
});

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = {
      id: ids.actor,
      email: "admin@example.test",
      role: "authenticated",
      userMetadata: {},
    };
    next();
  });
  app.use("/crm", tasksRouter);
  app.use(
    (
      error: { statusCode?: number; code?: string },
      _req: unknown,
      res: express.Response,
      _next: unknown,
    ) => {
      res.status(error.statusCode ?? 500).json({ error: { code: error.code } });
    },
  );
  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(
  async () => new Promise<void>((resolve) => server.close(() => resolve())),
);
beforeEach(() => {
  fixture.task = {
    id: ids.task,
    board_id: ids.board,
    column_id: ids.todo,
    position: 1000,
    completed_at: null,
    sentry_numeric_id: null,
    sentry_reopen_event_at: null,
  };
  fixture.columns = {
    [ids.intake]: column(ids.intake, "Entrada Sentry", false, true),
    [ids.todo]: column(ids.todo, "A fazer"),
    [ids.done]: column(ids.done, "Concluído", true),
  };
  fixture.updates = [];
  fixture.activity = [];
});

async function move(columnId: string) {
  const response = await fetch(`${baseUrl}/crm/tasks/${ids.task}/move`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ column_id: columnId }),
  });
  return { status: response.status, body: await response.json() };
}

describe("rota única de movimentação de tarefas com repositório sintético", () => {
  it("recusa entrada fixada sem gravar card ou histórico", async () => {
    const result = await move(ids.intake);
    expect(result.status).toBe(409);
    expect(result.body.error.code).toBe("column_pinned_intake");
    expect(fixture.updates).toEqual([]);
    expect(fixture.activity).toEqual([]);
  });

  it("permite sair da entrada fixada e registra origem, destino e ator", async () => {
    fixture.task!.column_id = ids.intake;
    expect((await move(ids.todo)).status).toBe(200);
    expect(fixture.task?.column_id).toBe(ids.todo);
    expect(fixture.updates[0]).toMatchObject({
      updated_by: ids.actor,
      column_id: ids.todo,
    });
    expect(fixture.activity).toEqual([
      expect.objectContaining({
        actor_id: ids.actor,
        action: "moved",
        payload: {
          from_column_id: ids.intake,
          from_column_name: "Entrada Sentry",
          to_column_id: ids.todo,
          to_column_name: "A fazer",
        },
      }),
    ]);
  });

  it("deriva conclusão e reabertura no servidor, com histórico próprio", async () => {
    expect((await move(ids.done)).status).toBe(200);
    expect(fixture.updates[0]?.completed_at).toEqual(expect.any(String));
    expect(fixture.activity.map((row) => row.action)).toEqual([
      "moved",
      "completed",
    ]);
    expect((await move(ids.todo)).status).toBe(200);
    expect(fixture.updates[1]?.completed_at).toBeNull();
    expect(fixture.activity.map((row) => row.action)).toEqual([
      "moved",
      "completed",
      "moved",
      "reopened",
    ]);
  });
});
