import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";

import type { TaskBoardSnapshot } from "./types";

// Mesma familia do contador compartilhado, num lugar diferente: `patchTaskProperty`
// (usado pelo desarquivar e pelo arrasto entre grupos quando o agrupamento nao e
// por etapa) guardava o objeto INTEIRO da tarefa para o rollback e nao tinha
// contador nenhum.
//
// Consequencia: se um `moveTaskTo` acontecer entre o inicio e a falha do patch,
// o rollback restaura o objeto antigo por completo -- inclusive `column_id` --
// e desfaz na tela um movimento que o servidor ja gravou. E o bug da Fase 2, na
// operacao que entrou na Fase 6.
//
// Duas operacoes que escrevem CAMPOS diferentes da mesma tarefa nao podem
// compartilhar contador (isso cancelaria uma pela outra), nem restaurar o objeto
// inteiro: cada uma guarda e devolve so o que ela mexeu.

const svc = vi.hoisted(() => ({
  listBoards: vi.fn(),
  getBoardSnapshot: vi.fn(),
  moveTask: vi.fn(),
  patchTask: vi.fn(),
  createTask: vi.fn(),
  patchColumn: vi.fn(),
  reorderColumns: vi.fn(),
  createColumn: vi.fn(),
  deleteColumn: vi.fn(),
  getTask: vi.fn(),
  deleteTask: vi.fn(),
  createLabel: vi.fn(),
  attachLabel: vi.fn(),
  detachLabel: vi.fn(),
  createChecklistItem: vi.fn(),
  patchChecklistItem: vi.fn(),
  deleteChecklistItem: vi.fn(),
  reorderChecklist: vi.fn(),
  createComment: vi.fn(),
  patchComment: vi.fn(),
  deleteComment: vi.fn(),
  getTaskActivity: vi.fn(),
  createBoard: vi.fn(),
  patchBoard: vi.fn(),
  deleteBoard: vi.fn(),
}));

const toastSpy = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
const locationSpy = vi.hoisted(() => ({ set: vi.fn(), search: "?section=tarefas&archived=1" }));

vi.mock("@/services/adminTasksService", () => {
  const wrap = (name: keyof typeof svc) => (...a: unknown[]) =>
    (svc[name] as (...args: unknown[]) => unknown)(...a);
  return Object.fromEntries(
    Object.keys(svc).map((k) => [k, wrap(k as keyof typeof svc)]),
  );
});
vi.mock("sonner", () => ({ toast: toastSpy }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));
vi.mock("wouter", () => ({
  useSearch: () => locationSpy.search,
  useLocation: () => ["/admin", locationSpy.set],
}));

import { TasksDashboard } from "./TasksDashboard";

const BOARD = {
  id: "b1", name: "Dev", key: "DEV", slug: "dev", description: null,
  color: "#FFB800", position: 1000, next_number: 2, archived_at: null,
  created_by: null, created_at: "2026-07-28T00:00:00Z", updated_at: "2026-07-28T00:00:00Z",
};

function column(id: string, name: string, position: number) {
  return {
    id, board_id: "b1", name, color: "#94A3B8", position,
    wip_limit: null, is_start: position === 1000, is_done: false,
    is_pinned: false, intake_source: null,
    created_at: "", updated_at: "",
  };
}

/** Card ARQUIVADO: e o que expoe o botao de desarquivar (patchTaskProperty). */
function task(columnId: string, archived: string | null) {
  return {
    id: "t1", board_id: "b1", column_id: columnId, number: 1, title: "tarefa 1",
    description: null, notes: null, position: 1000, priority: "media" as const,
    type: "tarefa" as const, assignee_id: null, created_by: "u1", updated_by: null,
    due_date: null, estimate: null, completed_at: null, archived_at: archived,
    created_at: "2026-07-28T00:00:00Z", updated_at: "2026-07-28T00:00:00Z",
    source: "human" as const, sentry_issue_id: null, sentry_issue_url: null,
    sentry_reopen_event_at: null,
    // Arquivado POR HUMANO: e o estado que a tela chama de silenciado quando o
    // card e da etapa fixada. Aqui o card e manual, entao e so arquivado mesmo.
    archived_source: archived ? ("human" as const) : null,
    sentry_detalhe_incompleto: false,
    label_ids: [], checklist_total: 0, checklist_done: 0, comment_count: 0,
  };
}

const SNAPSHOT: TaskBoardSnapshot = {
  board: BOARD,
  columns: [column("col-a", "Backlog", 1000), column("col-b", "A Fazer", 2000)],
  tasks: [task("col-a", "2026-07-28T00:00:00Z")],
  labels: [],
  admins: [],
};

/** Coluna em que o card esta AGORA, lida do DOM. */
function colunaDoCard(): string | null {
  const card = screen.queryByLabelText("DEV-1: tarefa 1");
  return card?.closest("section[aria-label]")?.getAttribute("aria-label") ?? null;
}

const serverState = { columnId: "col-a", archived: "2026-07-28T00:00:00Z" as string | null };

beforeEach(() => {
  vi.clearAllMocks();
  locationSpy.search = "?section=tarefas&archived=1";
  serverState.columnId = "col-a";
  serverState.archived = "2026-07-28T00:00:00Z";
  svc.listBoards.mockResolvedValue({ boards: [BOARD] });
  svc.getBoardSnapshot.mockImplementation(() =>
    Promise.resolve({
      ...structuredClone(SNAPSHOT),
      tasks: [task(serverState.columnId, serverState.archived)],
    }),
  );
});

afterEach(cleanup);

describe("patchTaskProperty nao pode desfazer um move alheio", () => {
  it("falha do desarquivar NAO devolve o card para a coluna antiga", async () => {
    // O patch de desarquivar fica preso; o move acontece e conclui no meio.
    let falharPatch: ((e: unknown) => void) | null = null;
    svc.patchTask.mockImplementation(
      () => new Promise((_r, reject) => (falharPatch = reject)),
    );
    svc.moveTask.mockImplementation(async () => {
      serverState.columnId = "col-b";
      return { ...task("col-b", serverState.archived), position: 1000 };
    });

    render(<TasksDashboard />);
    await screen.findByLabelText("DEV-1: tarefa 1");
    expect(colunaDoCard()).toBe("Etapa Backlog");

    // 1. desarquivar (patchTaskProperty) -- fica no ar
    await act(async () => {
      screen.getByLabelText("Desarquivar tarefa").click();
    });
    expect(svc.patchTask).toHaveBeenCalledTimes(1);

    // 2. mover para a proxima etapa -- conclui
    await act(async () => {
      screen.getAllByLabelText("Mover para a próxima etapa")[0].click();
    });
    await waitFor(() => expect(colunaDoCard()).toBe("Etapa A Fazer"));

    // 3. so agora o desarquivar falha
    await act(async () => {
      falharPatch?.(new Error("500 no servidor"));
    });

    // O servidor tem o card em col-b. Um rollback do objeto INTEIRO o traria de
    // volta para col-a, e a tela passaria a mentir sobre onde ele esta.
    await waitFor(() => expect(toastSpy.error).toHaveBeenCalled());
    expect(colunaDoCard()).toBe("Etapa A Fazer");
  });

  it("resposta do patch nao sobrescreve a coluna de um move mais novo", async () => {
    let concluirPatch: ((v: unknown) => void) | null = null;
    svc.patchTask.mockImplementation(
      () => new Promise((resolve) => (concluirPatch = resolve)),
    );
    svc.moveTask.mockImplementation(async () => {
      serverState.columnId = "col-b";
      return { ...task("col-b", null), position: 1000 };
    });

    render(<TasksDashboard />);
    await screen.findByLabelText("DEV-1: tarefa 1");

    await act(async () => {
      screen.getByLabelText("Desarquivar tarefa").click();
    });
    await act(async () => {
      screen.getAllByLabelText("Mover para a próxima etapa")[0].click();
    });
    await waitFor(() => expect(colunaDoCard()).toBe("Etapa A Fazer"));

    // A resposta do patch carrega a coluna ANTIGA, porque foi montada antes do
    // move. Aplicar o objeto inteiro puxaria o card de volta.
    await act(async () => {
      concluirPatch?.(task("col-a", null));
    });

    expect(colunaDoCard()).toBe("Etapa A Fazer");
  });
});
