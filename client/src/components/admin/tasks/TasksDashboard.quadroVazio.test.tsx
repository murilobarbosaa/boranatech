import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";

import type { TaskBoardSnapshot } from "./types";

// Quadro com ZERO etapas.
//
// Estado raro por construcao: so acontece se o seed de um quadro novo falhar (o
// POST cria o quadro e depois insere etapas e etiquetas, sem transacao) ou se
// alguem excluir todas as etapas na mao. Ninguem exercita isso em uso normal, e
// e exatamente por isso que ele precisa de teste: e o unico caminho para fora do
// beco, e um caminho que ninguem percorre e um caminho que ninguem descobre que
// quebrou.
//
// O teste da VISAO EM LISTA nao e simetria: ali o estado vazio dizia "nenhuma
// tarefa neste quadro" e nao oferecia saida nenhuma. Quem estivesse com
// `?view=lista` ficava presa.

const svc = vi.hoisted(() => ({
  listBoards: vi.fn(),
  getBoardSnapshot: vi.fn(),
  createColumn: vi.fn(),
  moveTask: vi.fn(),
  createTask: vi.fn(),
  patchColumn: vi.fn(),
  patchTask: vi.fn(),
  reorderColumns: vi.fn(),
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
const locationSpy = vi.hoisted(() => ({ set: vi.fn(), search: "?section=tarefas" }));

vi.mock("@/services/adminTasksService", () => {
  const wrap = (name: keyof typeof svc) => (...a: unknown[]) =>
    (svc[name] as (...args: unknown[]) => unknown)(...a);
  return {
    listBoards: wrap("listBoards"),
    getBoardSnapshot: wrap("getBoardSnapshot"),
    createColumn: wrap("createColumn"),
    moveTask: wrap("moveTask"),
    createTask: wrap("createTask"),
    patchColumn: wrap("patchColumn"),
    patchTask: wrap("patchTask"),
    reorderColumns: wrap("reorderColumns"),
    deleteColumn: wrap("deleteColumn"),
    getTask: wrap("getTask"),
    deleteTask: wrap("deleteTask"),
    createLabel: wrap("createLabel"),
    attachLabel: wrap("attachLabel"),
    detachLabel: wrap("detachLabel"),
    createChecklistItem: wrap("createChecklistItem"),
    patchChecklistItem: wrap("patchChecklistItem"),
    deleteChecklistItem: wrap("deleteChecklistItem"),
    reorderChecklist: wrap("reorderChecklist"),
    createComment: wrap("createComment"),
    patchComment: wrap("patchComment"),
    deleteComment: wrap("deleteComment"),
    getTaskActivity: wrap("getTaskActivity"),
    createBoard: wrap("createBoard"),
    patchBoard: wrap("patchBoard"),
    deleteBoard: wrap("deleteBoard"),
  };
});

vi.mock("sonner", () => ({ toast: toastSpy }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));
vi.mock("wouter", () => ({
  useSearch: () => locationSpy.search,
  useLocation: () => ["/admin", locationSpy.set],
}));

import { TasksDashboard } from "./TasksDashboard";

const BOARD = {
  id: "board-1",
  name: "Marketing",
  key: "MKT",
  slug: "marketing",
  description: null,
  color: "#FFB800",
  position: 1000,
  next_number: 1,
  archived_at: null,
  created_by: null,
  created_at: "2026-07-28T00:00:00Z",
  updated_at: "2026-07-28T00:00:00Z",
};

/** O estado que o seed falho deixa: quadro de pe, sem etapa nenhuma. */
const VAZIO: TaskBoardSnapshot = {
  board: BOARD,
  columns: [],
  tasks: [],
  labels: [],
  admins: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  locationSpy.search = "?section=tarefas";
  svc.listBoards.mockResolvedValue({ boards: [BOARD] });
  svc.getBoardSnapshot.mockResolvedValue(structuredClone(VAZIO));
  svc.createColumn.mockResolvedValue({
    id: "col-nova",
    board_id: "board-1",
    name: "Backlog",
    color: "#94A3B8",
    position: 1000,
    wip_limit: null,
    is_start: false,
    is_done: false,
    created_at: "",
    updated_at: "",
  });
});

afterEach(cleanup);

describe("quadro sem etapas: existe saida", () => {
  it("no BOARD, oferece criar a primeira etapa", async () => {
    render(<TasksDashboard />);
    expect(await screen.findByText(/ainda não tem etapas/)).toBeTruthy();
    expect(screen.getByText("Criar primeira etapa")).toBeTruthy();
  });

  // Antes da correcao, a visao em lista caia no "nenhuma tarefa neste quadro"
  // SEM botao nenhum: quem estivesse com ?view=lista ficava presa.
  it("na LISTA, oferece o mesmo caminho em vez de um beco", async () => {
    locationSpy.search = "?section=tarefas&view=lista";
    render(<TasksDashboard />);
    expect(await screen.findByText(/ainda não tem etapas/)).toBeTruthy();
    expect(screen.getByText("Criar primeira etapa")).toBeTruthy();
  });

  it("o botao leva ao dialogo e cria a etapa de verdade", async () => {
    render(<TasksDashboard />);
    // Espera o botao FORA do act: buscar dentro dele corre contra o proprio
    // flush do act e o elemento ainda nao existe.
    const botao = await screen.findByText("Criar primeira etapa");
    await act(async () => {
      botao.click();
    });

    const input = await screen.findByLabelText("Nome da etapa");
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set?.call(input, "Backlog");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      screen.getByText("Criar etapa").closest("button")!.click();
    });

    await waitFor(() =>
      expect(svc.createColumn).toHaveBeenCalledWith({
        board_id: "board-1",
        name: "Backlog",
      }),
    );
  });

  it("com filtro ligado, o estado vazio continua sendo o de SEM ETAPAS", async () => {
    // Um filtro ativo nao pode transformar "este quadro nao tem etapas" em
    // "nada bate com os filtros": a acao necessaria e outra.
    locationSpy.search = "?section=tarefas&mine=1";
    render(<TasksDashboard />);
    expect(await screen.findByText(/ainda não tem etapas/)).toBeTruthy();
    expect(screen.queryByText(/bate com os filtros/)).toBeNull();
  });
});
