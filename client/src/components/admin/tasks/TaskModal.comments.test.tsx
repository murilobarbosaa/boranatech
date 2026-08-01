import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";

import type { Task, TaskActivity, TaskColumn, TaskComment } from "./types";

// Comentarios e histórico dentro do modal.
//
// O relogio e injetado por `Date.now` fixado no vi.useFakeTimers: o modal captura
// `nowMs` uma vez na montagem, e sem fixar isso as asserções de data relativa
// passariam por acaso.

const svc = vi.hoisted(() => ({
  getTask: vi.fn(),
  patchTask: vi.fn(),
  createTask: vi.fn(),
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
}));

const toastSpy = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));

vi.mock("@/services/adminTasksService", () => ({
  getTask: (...a: unknown[]) => svc.getTask(...a),
  patchTask: (...a: unknown[]) => svc.patchTask(...a),
  createTask: (...a: unknown[]) => svc.createTask(...a),
  deleteTask: (...a: unknown[]) => svc.deleteTask(...a),
  createLabel: (...a: unknown[]) => svc.createLabel(...a),
  attachLabel: (...a: unknown[]) => svc.attachLabel(...a),
  detachLabel: (...a: unknown[]) => svc.detachLabel(...a),
  createChecklistItem: (...a: unknown[]) => svc.createChecklistItem(...a),
  patchChecklistItem: (...a: unknown[]) => svc.patchChecklistItem(...a),
  deleteChecklistItem: (...a: unknown[]) => svc.deleteChecklistItem(...a),
  reorderChecklist: (...a: unknown[]) => svc.reorderChecklist(...a),
  createComment: (...a: unknown[]) => svc.createComment(...a),
  patchComment: (...a: unknown[]) => svc.patchComment(...a),
  deleteComment: (...a: unknown[]) => svc.deleteComment(...a),
  getTaskActivity: (...a: unknown[]) => svc.getTaskActivity(...a),
}));

vi.mock("sonner", () => ({ toast: toastSpy }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

import { TaskModal } from "./TaskModal";

/** 2026-07-28 12:00 em Brasilia. */
const NOW = Date.parse("2026-07-28T15:00:00.000Z");

const COLUMNS: TaskColumn[] = [
  {
    id: "col-a",
    board_id: "board-1",
    name: "Backlog",
    color: "#94A3B8",
    position: 1000,
    wip_limit: null,
    is_start: true,
    is_done: false,
    is_pinned: false,
    intake_source: null,
    created_at: "2026-07-27T00:00:00Z",
    updated_at: "2026-07-27T00:00:00Z",
  },
];

const TASK: Task = {
  id: "task-1",
  board_id: "board-1",
  column_id: "col-a",
  number: 1,
  title: "tarefa",
  description: "",
  notes: null,
  position: 1000,
  priority: "media",
  type: "tarefa",
  assignee_id: null,
  created_by: "user-1",
  updated_by: null,
  due_date: null,
  estimate: null,
  completed_at: null,
  archived_at: null,
  source: "human" as const,
  sentry_issue_id: null,
  sentry_issue_url: null,
  sentry_reopen_event_at: null,
  archived_source: null,
  created_at: "2026-07-27T00:00:00Z",
  updated_at: "2026-07-27T00:00:00Z",
};

const ADMINS = [
  { user_id: "user-1", name: "Eu Mesma", email: "eu@x.com", avatar_url: null },
  { user_id: "user-2", name: "Outra Pessoa", email: "outra@x.com", avatar_url: null },
];

function comment(id: string, authorId: string, body: string, minutesAgo: number): TaskComment {
  const iso = new Date(NOW - minutesAgo * 60_000).toISOString();
  return {
    id,
    task_id: "task-1",
    author_id: authorId,
    body,
    created_at: iso,
    updated_at: iso,
  };
}

function activity(id: string, action: string, payload: Record<string, unknown>): TaskActivity {
  return {
    id,
    task_id: "task-1",
    actor_id: "user-1",
    action: action as TaskActivity["action"],
    payload,
    created_at: new Date(NOW - 10 * 60_000).toISOString(),
  };
}

const onPatchCard = vi.fn();

function renderModal() {
  return render(
    <TaskModal
      taskId="task-1"
      boardKey="DEV"
      columns={COLUMNS}
      admins={ADMINS}
      labels={[]}
      siblingsInColumn={[]}
      onClose={vi.fn()}
      onOpenTask={vi.fn()}
      onMoveTask={vi.fn()}
      onPatchCard={onPatchCard}
      onBoardChanged={vi.fn()}
      onRemoveCard={vi.fn()}
    />,
  );
}

function typeInto(element: HTMLElement, value: string) {
  const proto =
    element.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

async function openHistorico() {
  await act(async () => {
    screen.getByText("Histórico").click();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Relogio fixo: o modal le Date.now() uma vez na montagem.
  vi.setSystemTime(NOW);
  svc.getTask.mockResolvedValue({
    task: TASK,
    sentry_detalhe_incompleto: false,
    label_ids: [],
    comments: [],
    checklist: [],
    activity: [],
    activity_has_more: false,
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("TaskModal: comentarios", () => {
  it("estado vazio desenhado, nao tela em branco", async () => {
    renderModal();
    expect(await screen.findByText(/Nenhum comentário ainda/)).toBeTruthy();
  });

  it("lista com autor e data relativa", async () => {
    svc.getTask.mockResolvedValue({
      task: TASK,
      sentry_detalhe_incompleto: false,
      label_ids: [],
      comments: [comment("c1", "user-2", "olha esse caso", 5)],
      checklist: [],
      activity: [],
      activity_has_more: false,
    });
    renderModal();
    expect(await screen.findByText("Outra Pessoa")).toBeTruthy();
    expect(screen.getByText("olha esse caso")).toBeTruthy();
    expect(screen.getByText("há 5 min")).toBeTruthy();
  });

  it("adiciona otimista e reconcilia com o id real, sem duplicar", async () => {
    let resolveCreate: ((value: unknown) => void) | null = null;
    svc.createComment.mockImplementation(
      () => new Promise((resolve) => (resolveCreate = resolve)),
    );

    renderModal();
    const composer = await screen.findByLabelText("Novo comentário");
    await act(async () => {
      typeInto(composer, "primeiro comentario");
    });
    await act(async () => {
      screen.getByText("Comentar").click();
    });

    // Aparece antes de a rede responder, e o composer ja esta limpo.
    expect(screen.getByText("primeiro comentario")).toBeTruthy();
    expect((composer as HTMLTextAreaElement).value).toBe("");

    await act(async () => {
      resolveCreate?.(comment("c-real", "user-1", "primeiro comentario", 0));
    });
    expect(screen.getAllByText("primeiro comentario")).toHaveLength(1);
  });

  it("falha ao comentar DEVOLVE o texto ao composer", async () => {
    svc.createComment.mockRejectedValue(new Error("sem rede"));
    renderModal();
    const composer = await screen.findByLabelText("Novo comentário");
    await act(async () => {
      typeInto(composer, "nao pode sumir");
    });
    await act(async () => {
      screen.getByText("Comentar").click();
    });

    await waitFor(() => expect(toastSpy.error).toHaveBeenCalledWith("sem rede"));
    // O texto voltou: escrever um comentario e perder por rede caida seria o
    // mesmo defeito do autosave, em outra caixa.
    expect((composer as HTMLTextAreaElement).value).toBe("nao pode sumir");
    expect(screen.queryByText("nao pode sumir")).toBe(composer);
  });

  it("comentar atualiza o contador do card sem refetch do snapshot", async () => {
    svc.createComment.mockResolvedValue(comment("c-real", "user-1", "oi", 0));
    renderModal();
    const composer = await screen.findByLabelText("Novo comentário");
    await act(async () => {
      typeInto(composer, "oi");
    });
    await act(async () => {
      screen.getByText("Comentar").click();
    });
    expect(onPatchCard).toHaveBeenCalledWith("task-1", { comment_count: 1 });
  });

  it("editar e excluir aparecem SO nos proprios comentarios", async () => {
    svc.getTask.mockResolvedValue({
      task: TASK,
      sentry_detalhe_incompleto: false,
      label_ids: [],
      comments: [
        comment("meu", "user-1", "meu comentario", 5),
        comment("alheio", "user-2", "comentario de outra", 5),
      ],
      checklist: [],
      activity: [],
      activity_has_more: false,
    });
    renderModal();
    await screen.findByText("meu comentario");
    // Um par de botoes, nao dois: o comentario alheio nao tem.
    expect(screen.getAllByLabelText("Editar comentário")).toHaveLength(1);
    expect(screen.getAllByLabelText("Excluir comentário")).toHaveLength(1);
  });

  it("comentario editado mostra a marca", async () => {
    const editado = comment("c1", "user-1", "texto", 60);
    editado.updated_at = new Date(NOW - 30 * 60_000).toISOString();
    svc.getTask.mockResolvedValue({
      task: TASK,
      sentry_detalhe_incompleto: false,
      label_ids: [],
      comments: [editado],
      checklist: [],
      activity: [],
      activity_has_more: false,
    });
    renderModal();
    expect(await screen.findByText("editado")).toBeTruthy();
  });
});

describe("TaskModal: histórico", () => {
  it("renderiza a frase a partir do payload denormalizado", async () => {
    svc.getTask.mockResolvedValue({
      task: TASK,
      sentry_detalhe_incompleto: false,
      label_ids: [],
      comments: [],
      checklist: [],
      activity: [
        activity("a1", "moved", {
          from_column_name: "Backlog",
          to_column_name: "Em Progresso",
        }),
      ],
      activity_has_more: false,
    });
    renderModal();
    await screen.findByLabelText("Título da tarefa");
    await openHistorico();
    expect(
      screen.getByText(/moveu de Backlog para Em Progresso/),
    ).toBeTruthy();
  });

  // O caso que o resolver existe para cobrir.
  it("action DESCONHECIDO nao derruba a aba, cai na frase generica", async () => {
    svc.getTask.mockResolvedValue({
      task: TASK,
      sentry_detalhe_incompleto: false,
      label_ids: [],
      comments: [],
      checklist: [],
      activity: [activity("a1", "acao_do_futuro", { qualquer: "coisa" })],
      activity_has_more: false,
    });
    renderModal();
    await screen.findByLabelText("Título da tarefa");
    await openHistorico();
    expect(screen.getByText(/registrou uma alteração/)).toBeTruthy();
  });

  it("ator que nao e mais admin renderiza sem quebrar", async () => {
    svc.getTask.mockResolvedValue({
      task: TASK,
      sentry_detalhe_incompleto: false,
      label_ids: [],
      comments: [],
      checklist: [],
      activity: [
        { ...activity("a1", "archived", {}), actor_id: "fantasma-sem-perfil" },
      ],
      activity_has_more: false,
    });
    renderModal();
    await screen.findByLabelText("Título da tarefa");
    await openHistorico();
    expect(screen.getByText("Alguém")).toBeTruthy();
    expect(screen.getByText(/arquivou a tarefa/)).toBeTruthy();
  });

  it("carregar mais so aparece quando ha mais, e emenda a pagina", async () => {
    svc.getTask.mockResolvedValue({
      task: TASK,
      sentry_detalhe_incompleto: false,
      label_ids: [],
      comments: [],
      checklist: [],
      activity: [activity("a1", "completed", {})],
      activity_has_more: true,
    });
    svc.getTaskActivity.mockResolvedValue({
      activity: [activity("a2", "reopened", {})],
      activity_has_more: false,
    });

    renderModal();
    await screen.findByLabelText("Título da tarefa");
    await openHistorico();

    const button = screen.getByText("Carregar mais");
    await act(async () => {
      button.click();
    });

    await waitFor(() => expect(screen.getByText(/reabriu a tarefa/)).toBeTruthy());
    expect(screen.getByText(/concluiu a tarefa/)).toBeTruthy();
    // Sumiu quando o servidor disse que acabou.
    expect(screen.queryByText("Carregar mais")).toBeNull();
  });

  it("sem histórico mostra estado vazio", async () => {
    renderModal();
    await screen.findByLabelText("Título da tarefa");
    await openHistorico();
    expect(screen.getByText(/Nenhuma alteração registrada ainda/)).toBeTruthy();
  });
});
