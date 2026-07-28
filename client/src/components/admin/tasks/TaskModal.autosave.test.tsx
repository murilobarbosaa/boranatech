import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";

import type { Task, TaskChecklistItem, TaskColumn } from "./types";

// O que este arquivo trava e o unico defeito do modal que custa DADO: perder
// texto digitado ao sair. Ele tem quatro portas (Esc, clique fora, trocar de
// tarefa, F5) e um debounce ingenuo nao cobre nenhuma. Aqui as tres que dao para
// exercitar em jsdom sao testadas afirmando a ORDEM: o patch tem que sair ANTES
// do fechamento, nao "em algum momento".
//
// O quarto caminho (F5) e coberto pelo aviso de beforeunload, que so o navegador
// de verdade exercita; esta no smoke manual.

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
}));

const toastSpy = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
/** Ordem global dos efeitos observaveis, para afirmar quem veio antes. */
const trace = vi.hoisted(() => ({ events: [] as string[] }));

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
}));

vi.mock("sonner", () => ({ toast: toastSpy }));

import { TaskModal } from "./TaskModal";

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
    created_at: "2026-07-27T00:00:00Z",
    updated_at: "2026-07-27T00:00:00Z",
  },
];

const TASK: Task = {
  id: "task-1",
  board_id: "board-1",
  column_id: "col-a",
  number: 1,
  title: "tarefa original",
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
  created_at: "2026-07-27T00:00:00Z",
  updated_at: "2026-07-27T00:00:00Z",
};

function card(id: string, number: number) {
  return {
    ...TASK,
    id,
    number,
    label_ids: [] as string[],
    checklist_total: 0,
    checklist_done: 0,
    comment_count: 0,
  };
}

const onClose = vi.fn(() => trace.events.push("close"));
const onOpenTask = vi.fn((id: string) => trace.events.push(`open:${id}`));

function renderModal(overrides: Partial<React.ComponentProps<typeof TaskModal>> = {}) {
  return render(
    <TaskModal
      taskId="task-1"
      boardKey="DEV"
      columns={COLUMNS}
      admins={[]}
      labels={[]}
      siblingsInColumn={[card("task-1", 1), card("task-2", 2)]}
      onClose={onClose}
      onOpenTask={onOpenTask}
      onMoveTask={vi.fn()}
      onPatchCard={vi.fn()}
      onBoardChanged={vi.fn()}
      onRemoveCard={vi.fn()}
      {...overrides}
    />,
  );
}

/** Escreve num campo de forma que o React registre a mudanca. */
function typeInto(element: HTMLElement, value: string) {
  const proto =
    element.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  vi.clearAllMocks();
  trace.events = [];
  svc.getTask.mockResolvedValue({
    task: TASK,
    label_ids: [],
    comments: [],
    checklist: [] as TaskChecklistItem[],
    activity: [],
  });
  svc.patchTask.mockImplementation(async (_id: string, patch: Partial<Task>) => {
    trace.events.push("patch");
    return { ...TASK, ...patch };
  });
});

afterEach(cleanup);

describe("TaskModal: abertura", () => {
  it("abre com skeleton e nao segura a tela esperando a rede", async () => {
    let resolveGet: ((value: unknown) => void) | null = null;
    svc.getTask.mockImplementation(
      () => new Promise((resolve) => (resolveGet = resolve)),
    );

    renderModal();

    // O dialogo ja esta no DOM antes de a requisicao responder.
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByLabelText("Título da tarefa")).toBeNull();

    await act(async () => {
      resolveGet?.({ task: TASK, label_ids: [], comments: [], checklist: [], activity: [] });
    });
    expect(screen.getByLabelText("Título da tarefa")).toBeTruthy();
  });

  it("id inexistente avisa e fecha, sem quebrar", async () => {
    svc.getTask.mockRejectedValue(new Error("Tarefa não encontrada."));
    renderModal();
    await waitFor(() =>
      expect(toastSpy.error).toHaveBeenCalledWith("Tarefa não encontrada."),
    );
    expect(onClose).toHaveBeenCalled();
  });
});

describe("TaskModal: nenhuma saida perde texto", () => {
  // ATENCAO ao formato destes dois testes. A primeira versao deles comparava
  // indices num vetor de eventos ("patch veio antes de close") e passava MESMO
  // com o `await flush()` trocado por `void flush()` -- porque `patchTask` e
  // invocado sincronamente de qualquer jeito, entao a ordem de INVOCACAO nao
  // distingue nada. Asserção que nunca fica vermelha nao prova nada.
  //
  // O formato abaixo discrimina: a resposta do patch fica presa na mao do teste,
  // e a afirmacao e que o fechamento NAO acontece enquanto ela nao chega.

  it("Esc espera a gravacao TERMINAR antes de fechar", async () => {
    let resolvePatch: ((value: unknown) => void) | null = null;
    svc.patchTask.mockImplementation(
      (_id: string, patch: Partial<Task>) =>
        new Promise((resolve) => {
          resolvePatch = () => resolve({ ...TASK, ...patch });
        }),
    );

    renderModal();
    const textarea = await screen.findByLabelText("Descrição da tarefa");

    await act(async () => {
      typeInto(textarea, "texto que nao pode sumir");
    });

    // Fecha com o debounce ainda pendente.
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    await waitFor(() => expect(svc.patchTask).toHaveBeenCalled());
    expect(svc.patchTask).toHaveBeenCalledWith("task-1", {
      description: "texto que nao pode sumir",
    });
    // A gravacao ainda esta no ar: o modal NAO pode ter fechado.
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => {
      resolvePatch?.(null);
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("trocar de tarefa com a seta espera a gravacao TERMINAR", async () => {
    let resolvePatch: ((value: unknown) => void) | null = null;
    svc.patchTask.mockImplementation(
      (_id: string, patch: Partial<Task>) =>
        new Promise((resolve) => {
          resolvePatch = () => resolve({ ...TASK, ...patch });
        }),
    );

    renderModal();
    const textarea = await screen.findByLabelText("Descrição da tarefa");

    await act(async () => {
      typeInto(textarea, "rascunho pendente");
    });
    // Tira o foco do campo: as setas so navegam fora de campo de texto.
    await act(async () => {
      (textarea as HTMLTextAreaElement).blur();
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    });

    await waitFor(() => expect(svc.patchTask).toHaveBeenCalled());
    expect(onOpenTask).not.toHaveBeenCalled();

    await act(async () => {
      resolvePatch?.(null);
    });
    await waitFor(() => expect(onOpenTask).toHaveBeenCalledWith("task-2"));
  });

  it("acumula os campos num patch so, sem requisicoes competindo", async () => {
    renderModal();
    const title = await screen.findByLabelText("Título da tarefa");
    const textarea = screen.getByLabelText("Descrição da tarefa");

    await act(async () => {
      typeInto(title, "titulo novo");
      typeInto(textarea, "descricao nova");
    });
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    await waitFor(() => expect(svc.patchTask).toHaveBeenCalledTimes(1));
    expect(svc.patchTask).toHaveBeenCalledWith("task-1", {
      title: "titulo novo",
      description: "descricao nova",
    });
  });

  it("falha ao salvar NAO descarta o que foi digitado", async () => {
    svc.patchTask.mockRejectedValueOnce(new Error("500"));
    renderModal();
    const textarea = await screen.findByLabelText("Descrição da tarefa");

    await act(async () => {
      typeInto(textarea, "primeira tentativa");
    });
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    await waitFor(() => expect(svc.patchTask).toHaveBeenCalledTimes(1));

    // O texto voltou para a fila: a proxima gravacao leva o mesmo conteudo, em
    // vez de o rascunho evaporar junto com o erro.
    await act(async () => {
      typeInto(textarea, "segunda tentativa");
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    await waitFor(() => expect(svc.patchTask).toHaveBeenCalledTimes(2));
    expect(svc.patchTask).toHaveBeenLastCalledWith("task-1", {
      description: "segunda tentativa",
    });
  });
});

describe("TaskModal: etiqueta com nome que ja existe", () => {
  it("é sucesso silencioso, sem erro na cara do usuário", async () => {
    // A API devolve 200 com a etiqueta EXISTENTE quando o nome colide.
    svc.createLabel.mockResolvedValue({
      id: "label-1",
      board_id: "board-1",
      name: "Frontend",
      color: "#38BDF8",
      created_at: "",
      updated_at: "",
    });
    svc.attachLabel.mockResolvedValue({ ok: true });

    renderModal();
    await screen.findByLabelText("Título da tarefa");

    await act(async () => {
      screen.getByLabelText("Adicionar etiqueta").click();
    });
    const input = await screen.findByLabelText("Buscar ou criar etiqueta");
    await act(async () => {
      typeInto(input, "Frontend");
    });
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });

    await waitFor(() => expect(svc.attachLabel).toHaveBeenCalledWith("task-1", "label-1"));
    expect(toastSpy.error).not.toHaveBeenCalled();
  });
});
