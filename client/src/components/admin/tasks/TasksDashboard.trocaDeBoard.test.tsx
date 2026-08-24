import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";

import type { TaskBoardSnapshot } from "./types";

// TROCA DE QUADRO, do lado da tela: durante a espera a BARRA fica e as COLUNAS
// viram esqueleto.
//
// O bug relatado era o par disso: as colunas do quadro antigo continuavam
// renderizadas ate o quadro novo chegar, ou seja, conteudo de um quadro se
// passando por outro. A regra que estes testes travam tem dois lados, e os dois
// sao regressao se cairem sozinhos:
//   1. a barra NAO pode sumir (o clique da pessoa acabou de acontecer nela, e
//      sumir com ela vira flash de recarga, que e o motivo de nao reusar o
//      esqueleto de painel inteiro do primeiro carregamento);
//   2. nenhum card do quadro antigo pode estar no DOM durante a espera.
//
// A BoardToolbar entra DUBLADA aqui, e de proposito: o seletor de quadro real e
// um Radix Select, cuja abertura depende de APIs de ponteiro que o jsdom nao
// tem, e o alvo deste arquivo e o galho de render do dashboard, nao o desenho da
// barra. O duble tambem serve de sonda das props que a transicao manda para ela,
// que e onde mora a segunda metade da regra: contagem `null` e listas vazias em
// vez de numero e etiquetas do quadro ANTIGO.

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
const locationSpy = vi.hoisted(() => ({
  set: vi.fn(),
  search: "?section=tarefas",
}));
/** Props que a barra recebeu no ultimo render, para a sonda das props. */
const barra = vi.hoisted(() => ({
  props: null as null | {
    totalCount: number | null;
    visibleCount: number | null;
    labels: unknown[];
    admins: unknown[];
    activeBoardId: string | null;
  },
}));

vi.mock("@/services/adminTasksService", () => {
  const wrap =
    (name: keyof typeof svc) =>
    (...a: unknown[]) =>
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

vi.mock("./BoardToolbar", () => ({
  BoardToolbar: (props: Record<string, unknown>) => {
    barra.props = {
      totalCount: props.totalCount as number | null,
      visibleCount: props.visibleCount as number | null,
      labels: props.labels as unknown[],
      admins: props.admins as unknown[],
      activeBoardId: props.activeBoardId as string | null,
    };
    return (
      <div data-testid="barra">
        <button
          type="button"
          data-testid="ir-para-mkt"
          onClick={() =>
            (props.onSelectBoard as (id: string) => void)("board-MKT")
          }
        >
          MKT
        </button>
      </div>
    );
  },
}));

import { TasksDashboard } from "./TasksDashboard";

function board(key: string) {
  return {
    id: `board-${key}`,
    name: key,
    key,
    slug: key.toLowerCase(),
    description: null,
    color: "#FFB800",
    position: key === "DEV" ? 1000 : 2000,
    next_number: 2,
    archived_at: null,
    created_by: null,
    created_at: key === "DEV" ? "2026-07-28T02:00:00Z" : "2026-07-28T06:00:00Z",
    updated_at: "2026-07-28T06:00:00Z",
  };
}

function coluna(boardKey: string) {
  return {
    id: `col-${boardKey}`,
    board_id: `board-${boardKey}`,
    name: "Backlog",
    color: "#94A3B8",
    position: 1000,
    wip_limit: null,
    is_start: true,
    is_done: false,
    is_pinned: false,
    intake_source: null,
    created_at: "2026-07-28T00:00:00Z",
    updated_at: "2026-07-28T00:00:00Z",
  };
}

function tarefa(boardKey: string) {
  return {
    id: `task-${boardKey}`,
    board_id: `board-${boardKey}`,
    column_id: `col-${boardKey}`,
    number: 1,
    title: `Tarefa do ${boardKey}`,
    description: null,
    notes: null,
    position: 1000,
    priority: "media" as const,
    type: "tarefa" as const,
    assignee_id: null,
    created_by: "user-1",
    updated_by: null,
    due_date: null,
    estimate: null,
    completed_at: null,
    archived_at: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    source: "human" as const,
    sentry_issue_id: null,
    sentry_issue_url: null,
    sentry_reopen_event_at: null,
    sentry_detalhe_incompleto: false,
    archived_source: null,
    label_ids: [],
    checklist_total: 0,
    checklist_done: 0,
    comment_count: 0,
  };
}

function snapshotDe(boardKey: string): TaskBoardSnapshot {
  return {
    board: board(boardKey),
    columns: [coluna(boardKey)],
    tasks: [tarefa(boardKey)],
    labels: [],
    admins: [],
  };
}

/** Resolvers das buscas de snapshot do MKT, para segurar a troca no meio. */
let mktPendentes: Array<(s: TaskBoardSnapshot) => void> = [];

function esqueletos() {
  return document.querySelectorAll('[data-slot="skeleton"]');
}

beforeEach(() => {
  vi.clearAllMocks();
  locationSpy.search = "?section=tarefas";
  barra.props = null;
  mktPendentes = [];
  svc.listBoards.mockResolvedValue({ boards: [board("DEV"), board("MKT")] });
  svc.getBoardSnapshot.mockImplementation((id: unknown) =>
    id === "board-MKT"
      ? new Promise((resolve) => mktPendentes.push(resolve))
      : Promise.resolve(snapshotDe("DEV")),
  );
});

afterEach(cleanup);

/** Monta com o DEV carregado e clica para ir ao MKT, que fica pendente. */
async function trocarParaMkt() {
  render(<TasksDashboard />);
  expect(await screen.findByText("Tarefa do DEV")).toBeTruthy();

  await act(async () => {
    screen.getByTestId("ir-para-mkt").click();
  });
  await waitFor(() => expect(mktPendentes).toHaveLength(1));
}

describe("troca de quadro: barra fica, colunas viram esqueleto", () => {
  it("a barra segue no DOM e a area das colunas mostra esqueleto", async () => {
    await trocarParaMkt();

    expect(screen.getByTestId("barra")).toBeTruthy();
    expect(esqueletos().length).toBeGreaterThan(0);
    // E a barra ja aponta para o quadro NOVO: quem clicou tem que ver a escolha
    // registrada na hora, e nao depois que os dados chegam.
    expect(barra.props?.activeBoardId).toBe("board-MKT");
  });

  it("NENHUM card do quadro antigo continua no DOM durante a espera", async () => {
    await trocarParaMkt();

    expect(screen.queryByText("Tarefa do DEV")).toBeNull();

    // E o quadro novo entra quando a resposta dele chega, nao antes.
    await act(async () => {
      mktPendentes[0](snapshotDe("MKT"));
    });
    expect(await screen.findByText("Tarefa do MKT")).toBeTruthy();
    expect(screen.queryByText("Tarefa do DEV")).toBeNull();
  });

  it("a barra nao recebe contagem nem etiquetas do quadro antigo", async () => {
    // Contagem e opcoes de filtro sao POR QUADRO. Repassar as do quadro antigo
    // seria o mesmo bug em escala menor, e mandar `0` seria pior: um numero
    // plausivel e indistinguivel do certo (ver a regra do fallback no CLAUDE.md).
    await trocarParaMkt();

    expect(barra.props?.totalCount).toBeNull();
    expect(barra.props?.visibleCount).toBeNull();
    expect(barra.props?.labels).toEqual([]);
    expect(barra.props?.admins).toEqual([]);
  });

  it("quadro sem etapas continua sendo VAZIO, nao esqueleto", async () => {
    // Protege a distincao do quadroVazio.test: "carregando" e "nao tem nada" sao
    // estados diferentes, e o novo galho de transicao nao pode engolir o vazio.
    svc.getBoardSnapshot.mockImplementation(() =>
      Promise.resolve({
        board: board("DEV"),
        columns: [],
        tasks: [],
        labels: [],
        admins: [],
      } satisfies TaskBoardSnapshot),
    );

    render(<TasksDashboard />);

    expect(await screen.findByText(/ainda não tem etapas/)).toBeTruthy();
    expect(esqueletos().length).toBe(0);
  });
});
