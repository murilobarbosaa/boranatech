import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";

import type { TaskBoardSnapshot } from "./types";

// Testes dos dois casos que o board tem de acertar e que so aparecem sob
// concorrencia, quando ja e tarde:
//
//   1. dois moves rapidos no MESMO card. O erro do primeiro nao pode ressuscitar
//      o estado anterior ao segundo. Se ressuscitar, o card volta sozinho para
//      uma coluna onde ele nao esta nem no servidor nem na intencao de ninguem,
//      e nada acusa: a tela fica plausivel e errada.
//   2. criar tarefa com a rede falhando. O card otimista tem que sumir, sem
//      piscar e sem duplicar quando o refresh chegar.
//
// A UI e exercitada de fora (clique no botao real), nao chamando o handler: e a
// fiacao entre card, coluna e dashboard que quebra na pratica.

const svc = vi.hoisted(() => ({
  listBoards: vi.fn(),
  getBoardSnapshot: vi.fn(),
  moveTask: vi.fn(),
  createTask: vi.fn(),
  patchColumn: vi.fn(),
  reorderColumns: vi.fn(),
  createColumn: vi.fn(),
  deleteColumn: vi.fn(),
  // O TaskModal monta junto quando ha ?task= na URL. Sem estes mocks as funcoes
  // chegam como undefined, o modal estoura dentro do proprio catch e o teste de
  // deep link passaria com o modal quebrado, sem ninguem perceber.
  getTask: vi.fn(),
  patchTask: vi.fn(),
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
const locationSpy = vi.hoisted(() => ({
  set: vi.fn(),
  search: "?section=tarefas",
}));

vi.mock("@/services/adminTasksService", () => ({
  listBoards: (...a: unknown[]) => svc.listBoards(...a),
  getBoardSnapshot: (...a: unknown[]) => svc.getBoardSnapshot(...a),
  moveTask: (...a: unknown[]) => svc.moveTask(...a),
  createTask: (...a: unknown[]) => svc.createTask(...a),
  patchColumn: (...a: unknown[]) => svc.patchColumn(...a),
  reorderColumns: (...a: unknown[]) => svc.reorderColumns(...a),
  createColumn: (...a: unknown[]) => svc.createColumn(...a),
  deleteColumn: (...a: unknown[]) => svc.deleteColumn(...a),
  getTask: (...a: unknown[]) => svc.getTask(...a),
  patchTask: (...a: unknown[]) => svc.patchTask(...a),
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

// O TaskModal, montado quando ha ?task= na URL, le o usuario logado.
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
  name: "Desenvolvimento",
  key: "DEV",
  slug: "desenvolvimento",
  description: null,
  color: "#FFB800",
  position: 1000,
  next_number: 3,
  archived_at: null,
  source: "human" as const,
  sentry_issue_id: null,
  sentry_issue_url: null,
  sentry_reopen_event_at: null,
  archived_source: null,
  created_by: null,
  created_at: "2026-07-27T00:00:00Z",
  updated_at: "2026-07-27T00:00:00Z",
};

function column(id: string, name: string, position: number) {
  return {
    id,
    board_id: "board-1",
    name,
    color: "#94A3B8",
    position,
    wip_limit: null,
    is_start: position === 1000,
    is_done: false,
    is_pinned: false,
    intake_source: null,
    created_at: "2026-07-27T00:00:00Z",
    updated_at: "2026-07-27T00:00:00Z",
  };
}

function task(id: string, number: number, columnId: string) {
  return {
    id,
    board_id: "board-1",
    column_id: columnId,
    number,
    title: `tarefa ${number}`,
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
    source: "human" as const,
    sentry_issue_id: null,
    sentry_issue_url: null,
    sentry_reopen_event_at: null,
    archived_source: null,
    created_at: "2026-07-27T00:00:00Z",
    updated_at: "2026-07-27T00:00:00Z",
    sentry_detalhe_incompleto: false,
    label_ids: [],
    checklist_total: 0,
    checklist_done: 0,
    comment_count: 0,
  };
}

const SNAPSHOT: TaskBoardSnapshot = {
  board: BOARD,
  columns: [
    column("col-a", "Backlog", 1000),
    column("col-b", "A Fazer", 2000),
    column("col-c", "Em Progresso", 3000),
  ],
  tasks: [task("task-1", 1, "col-a")],
  labels: [],
  admins: [],
};

/** Coluna em que o card esta AGORA, lida do DOM. */
function columnOfCard(cardLabel: string): string | null {
  const card = screen.queryByLabelText(cardLabel);
  const section = card?.closest("section[aria-label]");
  return section?.getAttribute("aria-label") ?? null;
}

// Estado do "servidor" que o snapshot le. Um mock que devolvesse SEMPRE o
// snapshot inicial faria o refresh pos-sucesso desfazer o movimento na tela, e o
// teste acusaria um bug que so existe no mock. Aqui o teste move este estado
// quando decide que a requisicao foi aplicada, e o refresh le daqui.
const serverState = { tasks: [task("task-1", 1, "col-a")] };

function serverMoved(columnId: string) {
  serverState.tasks = [task("task-1", 1, columnId)];
}

beforeEach(() => {
  vi.clearAllMocks();
  locationSpy.search = "?section=tarefas";
  serverState.tasks = [task("task-1", 1, "col-a")];
  svc.listBoards.mockResolvedValue({ boards: [BOARD] });
  svc.getTask.mockResolvedValue({
    task: task("task-1", 1, "col-a"),
    sentry_detalhe_incompleto: false,
    label_ids: [],
    comments: [],
    checklist: [],
    activity: [],
    activity_has_more: false,
  });
  svc.getBoardSnapshot.mockImplementation(() =>
    Promise.resolve({
      ...structuredClone(SNAPSHOT),
      tasks: structuredClone(serverState.tasks),
    }),
  );
});

afterEach(cleanup);

describe("board: a fileira centrada e o botao de nova etapa", () => {
  it("o miolo carrega a centragem, e o contêiner que rola NAO", () => {
    // A armadilha do desenho: `justify-center` no elemento que rola torna a
    // primeira coluna inalcancavel quando o quadro enche. A centragem vive no
    // miolo, que colapsa as margens quando nao cabe.
    //
    // O par (miolo E contêiner) na mesma asercao: so a primeira metade
    // aceitaria as duas centragens convivendo.
    render(<TasksDashboard />);
    return screen.findByLabelText("DEV-1: tarefa 1").then(() => {
      const scroll = screen.getByTestId("board-scroll");
      const row = screen.getByTestId("board-row");

      expect(row.className).toContain("mx-auto");
      expect(row.className).toContain("w-max");
      expect(scroll.className).toContain("overflow-x-auto");
      expect(scroll.className).not.toContain("justify-center");
      expect(scroll.contains(row)).toBe(true);
    });
  });

  it("o '+' centra na VERTICAL com as colunas, nao encosta no topo", async () => {
    // Numa fileira de colunas altas, um alvo de 48px grudado na borda de cima
    // le como sobra de layout e nao como acao. `self-center` e o que resolve, e
    // ele mora no contêiner do botao, nao no botao: trocar por `self-start`
    // numa limpeza futura pareceria inocuo.
    render(<TasksDashboard />);
    await screen.findByLabelText("DEV-1: tarefa 1");

    const caixa = screen.getByTestId("board-nova-etapa");
    expect(caixa.className).toContain("self-center");
    expect(caixa.className).not.toContain("self-start");
    expect(caixa.className).not.toContain("items-start");
  });

  it("o '+' de nova etapa tem nome acessivel, porque icone nao fala", async () => {
    // O texto "Nova etapa" saiu do botao; sem `aria-label` ele viraria um alvo
    // anonimo na fileira. Mesmo cuidado do avatar do header do admin.
    render(<TasksDashboard />);
    await screen.findByLabelText("DEV-1: tarefa 1");

    const botao = screen.getByRole("button", { name: "Nova etapa" });
    expect(botao.getAttribute("title")).toBe("Nova etapa");
    // COMPACTO: ele nao ocupa mais uma coluna inteira. Sem esta asercao, um
    // botao largo com aria-label passaria e o centro do quadro seguiria
    // deslocado. `h-12` e a familia grande, escolhida pela Ana em 30/08.
    expect(botao.className).toContain("h-12");
    expect(botao.className).toContain("w-12");
    expect(botao.className).not.toContain("w-full");
    // E o texto morreu de verdade: se voltar, o botao volta a ser largo.
    expect(botao.textContent?.trim()).toBe("");
  });
});

describe("TasksDashboard: update otimista", () => {
  it("move o card na hora, antes da resposta da rede", async () => {
    let resolveMove: ((value: unknown) => void) | null = null;
    svc.moveTask.mockImplementation(
      () => new Promise((resolve) => (resolveMove = resolve)),
    );

    render(<TasksDashboard />);
    await screen.findByLabelText("DEV-1: tarefa 1");
    expect(columnOfCard("DEV-1: tarefa 1")).toBe("Etapa Backlog");

    const forward = screen.getAllByLabelText("Mover para a próxima etapa")[0];
    await act(async () => {
      forward.click();
    });

    // A rede ainda nao respondeu e o card JA esta na coluna nova.
    expect(svc.moveTask).toHaveBeenCalledTimes(1);
    expect(columnOfCard("DEV-1: tarefa 1")).toBe("Etapa A Fazer");

    await act(async () => {
      resolveMove?.({ ...task("task-1", 1, "col-b"), position: 2000 });
    });
  });

  it("erro devolve o card para a coluna de origem e avisa", async () => {
    svc.moveTask.mockRejectedValue(new Error("500 no servidor"));

    render(<TasksDashboard />);
    await screen.findByLabelText("DEV-1: tarefa 1");

    const forward = screen.getAllByLabelText("Mover para a próxima etapa")[0];
    await act(async () => {
      forward.click();
    });

    await waitFor(() =>
      expect(columnOfCard("DEV-1: tarefa 1")).toBe("Etapa Backlog"),
    );
    expect(toastSpy.error).toHaveBeenCalledWith("500 no servidor");
  });

  // O caso que motivou o contador de sequencia por tarefa.
  it("dois moves rapidos: o erro do PRIMEIRO nao desfaz o segundo", async () => {
    const pending: Array<{
      reject: (reason: unknown) => void;
      resolve: (value: unknown) => void;
    }> = [];
    svc.moveTask.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          pending.push({ resolve, reject });
        }),
    );

    render(<TasksDashboard />);
    await screen.findByLabelText("DEV-1: tarefa 1");

    // Backlog -> A Fazer
    await act(async () => {
      screen.getAllByLabelText("Mover para a próxima etapa")[0].click();
    });
    expect(columnOfCard("DEV-1: tarefa 1")).toBe("Etapa A Fazer");

    // A Fazer -> Em Progresso, antes de a primeira resposta chegar
    await act(async () => {
      screen.getAllByLabelText("Mover para a próxima etapa")[0].click();
    });
    expect(columnOfCard("DEV-1: tarefa 1")).toBe("Etapa Em Progresso");
    expect(pending).toHaveLength(2);

    // A PRIMEIRA requisicao falha, com a segunda ainda no ar.
    await act(async () => {
      pending[0].reject(new Error("primeira falhou"));
    });

    // O card NAO pode ter voltado para Backlog: o estado da tela e o do segundo
    // movimento, que ainda esta valendo.
    expect(columnOfCard("DEV-1: tarefa 1")).toBe("Etapa Em Progresso");
    expect(toastSpy.error).not.toHaveBeenCalled();

    // O segundo movimento foi o que o servidor aplicou de fato.
    serverMoved("col-c");
    await act(async () => {
      pending[1].resolve({ ...task("task-1", 1, "col-c"), position: 1000 });
    });
    await waitFor(() =>
      expect(columnOfCard("DEV-1: tarefa 1")).toBe("Etapa Em Progresso"),
    );
  });

  // Irmao do teste acima, no caminho de SUCESSO: a resposta atrasada do primeiro
  // move carrega a coluna intermediaria e puxaria o card de volta se fosse
  // aplicada sem a guarda de sequencia.
  it("dois moves rapidos: a resposta ATRASADA do primeiro nao puxa o card de volta", async () => {
    const pending: Array<(value: unknown) => void> = [];
    svc.moveTask.mockImplementation(
      () => new Promise((resolve) => pending.push(resolve)),
    );

    render(<TasksDashboard />);
    await screen.findByLabelText("DEV-1: tarefa 1");

    await act(async () => {
      screen.getAllByLabelText("Mover para a próxima etapa")[0].click();
    });
    await act(async () => {
      screen.getAllByLabelText("Mover para a próxima etapa")[0].click();
    });
    expect(columnOfCard("DEV-1: tarefa 1")).toBe("Etapa Em Progresso");

    // Segundo responde primeiro, primeiro responde depois (fora de ordem). O
    // servidor esta em col-c: os dois moves foram aplicados la, e a resposta
    // atrasada do primeiro carrega col-b so porque foi montada antes.
    serverMoved("col-c");
    await act(async () => {
      pending[1]({ ...task("task-1", 1, "col-c"), position: 1000 });
    });
    await act(async () => {
      pending[0]({ ...task("task-1", 1, "col-b"), position: 1000 });
    });

    await waitFor(() =>
      expect(columnOfCard("DEV-1: tarefa 1")).toBe("Etapa Em Progresso"),
    );
  });
});

describe("TasksDashboard: criacao inline", () => {
  it("cria otimista e reconcilia com o id real, sem duplicar", async () => {
    svc.createTask.mockResolvedValue(task("task-99", 7, "col-a"));
    // O refresh posterior ja traz a tarefa criada, que e o cenario onde a
    // duplicata apareceria se a reconciliacao removesse e reinserisse.
    svc.getBoardSnapshot
      .mockResolvedValueOnce(structuredClone(SNAPSHOT))
      .mockResolvedValue({
        ...structuredClone(SNAPSHOT),
        tasks: [task("task-1", 1, "col-a"), task("task-99", 7, "col-a")],
      });

    render(<TasksDashboard />);
    await screen.findByLabelText("DEV-1: tarefa 1");

    await act(async () => {
      screen.getAllByText("Nova tarefa")[0].click();
    });
    const textarea = screen.getAllByLabelText("Título da nova tarefa")[0];
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      setter?.call(textarea, "tarefa nova");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      textarea.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });

    await waitFor(() => expect(svc.createTask).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getAllByLabelText(/^DEV-7:/)).toHaveLength(1),
    );
    // Nenhum card com numero placeholder sobrou na tela.
    expect(screen.queryByLabelText(/^DEV-0:/)).toBeNull();
  });

  it("rede falhando remove o card otimista e avisa", async () => {
    svc.createTask.mockRejectedValue(new Error("sem rede"));

    render(<TasksDashboard />);
    await screen.findByLabelText("DEV-1: tarefa 1");

    await act(async () => {
      screen.getAllByText("Nova tarefa")[0].click();
    });
    const textarea = screen.getAllByLabelText("Título da nova tarefa")[0];
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      setter?.call(textarea, "vai falhar");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      textarea.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });

    await waitFor(() =>
      expect(toastSpy.error).toHaveBeenCalledWith("sem rede"),
    );
    // So o card original permanece.
    expect(screen.getAllByLabelText(/^DEV-/)).toHaveLength(1);
    expect(screen.queryByLabelText(/^DEV-0:/)).toBeNull();
  });
});

describe("TasksDashboard: deep link", () => {
  it("escrever ?task= preserva o ?section=", async () => {
    render(<TasksDashboard />);
    const card = await screen.findByLabelText("DEV-1: tarefa 1");

    await act(async () => {
      card.click();
    });

    expect(locationSpy.set).toHaveBeenCalledWith(
      "/admin?section=tarefas&task=DEV-1",
    );
  });

  it("?task= de um card existente destaca o card", async () => {
    locationSpy.search = "?section=tarefas&task=DEV-1";
    render(<TasksDashboard />);
    const card = await screen.findByLabelText("DEV-1: tarefa 1");
    expect(card.className).toContain("ring-violet-300");
  });

  it("?task= invalido nao quebra a tela", async () => {
    locationSpy.search = "?section=tarefas&task=lixo";
    render(<TasksDashboard />);
    const card = await screen.findByLabelText("DEV-1: tarefa 1");
    expect(card.className).not.toContain("ring-violet-300");
  });
});
