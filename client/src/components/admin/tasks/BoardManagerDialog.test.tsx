import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";

import { formatIsoDay } from "./relativeTime";
import type { TaskBoard } from "./types";

// Duas superficies novas desta rodada:
//   1. a criacao de quadro, cuja regra mais facil de errar e a SIGLA (formato,
//      unicidade e imutabilidade avisada ANTES, nao depois);
//   2. a exclusao, que leva tudo por cascade e por isso exige digitar a sigla.

const svc = vi.hoisted(() => ({
  createBoard: vi.fn(),
  patchBoard: vi.fn(),
  deleteBoard: vi.fn(),
}));
const toastSpy = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));

vi.mock("@/services/adminTasksService", () => ({
  createBoard: (...a: unknown[]) => svc.createBoard(...a),
  patchBoard: (...a: unknown[]) => svc.patchBoard(...a),
  deleteBoard: (...a: unknown[]) => svc.deleteBoard(...a),
}));
vi.mock("sonner", () => ({ toast: toastSpy }));

import { BoardManagerDialog } from "./BoardManagerDialog";

function board(key: string, name: string, archived = false): TaskBoard {
  return {
    id: `board-${key}`,
    name,
    key,
    slug: name.toLowerCase(),
    description: null,
    color: "#FFB800",
    position: 1000,
    next_number: 1,
    archived_at: archived ? "2026-07-28T00:00:00Z" : null,
    created_by: null,
    created_at: "2026-07-27T00:00:00Z",
    updated_at: "2026-07-27T00:00:00Z",
  };
}

const onChanged = vi.fn();
const onCreated = vi.fn();
const onDeleted = vi.fn();

function renderDialog(boards: TaskBoard[] = [board("DEV", "Desenvolvimento")]) {
  return render(
    <BoardManagerDialog
      open
      boards={boards}
      onOpenChange={vi.fn()}
      onChanged={onChanged}
      onCreated={onCreated}
      onDeleted={onDeleted}
    />,
  );
}

function typeInto(element: HTMLElement, value: string) {
  Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

async function preencher(nome: string, sigla: string) {
  await act(async () => {
    typeInto(screen.getByLabelText("Nome"), nome);
  });
  await act(async () => {
    typeInto(screen.getByLabelText("Sigla"), sigla);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  svc.createBoard.mockResolvedValue(board("MKT", "Marketing"));
  svc.deleteBoard.mockResolvedValue({ ok: true });
  svc.patchBoard.mockResolvedValue(board("DEV", "Desenvolvimento"));
});

afterEach(cleanup);

describe("BoardManagerDialog: criar", () => {
  // A imutabilidade da sigla precisa aparecer ANTES, nao virar descoberta.
  it("avisa que a sigla nao pode ser alterada, no momento da criacao", () => {
    renderDialog();
    expect(screen.getByText(/não pode ser alterada depois/)).toBeTruthy();
  });

  it("mostra o identificador que a sigla vai gerar", async () => {
    renderDialog();
    await preencher("Marketing", "MKT");
    expect(screen.getAllByText("MKT-1").length).toBeGreaterThan(0);
  });

  it("forca maiuscula na digitacao", async () => {
    renderDialog();
    await preencher("Marketing", "mkt");
    expect((screen.getByLabelText("Sigla") as HTMLInputElement).value).toBe("MKT");
  });

  it("recusa formato invalido com mensagem, nao com erro cru", async () => {
    renderDialog();
    await preencher("Marketing", "1AB");
    expect(screen.getByText(/começando por letra/)).toBeTruthy();
    expect(screen.getByText("Criar quadro").closest("button")).toHaveProperty(
      "disabled",
      true,
    );
  });

  // Colisao tratada no CLIENTE: descobrir por 409 depois de preencher o
  // formulario e pior do que ver na hora.
  it("recusa sigla ja em uso, antes de chamar a API", async () => {
    renderDialog([board("DEV", "Desenvolvimento"), board("MKT", "Marketing")]);
    await preencher("Outro", "MKT");
    expect(screen.getByText(/já está em uso/)).toBeTruthy();

    await act(async () => {
      screen.getByText("Criar quadro").closest("button")!.click();
    });
    expect(svc.createBoard).not.toHaveBeenCalled();
  });

  it("cria com nome, sigla, cor e slug derivado", async () => {
    renderDialog();
    await preencher("Marketing e Vendas", "MKT");
    await act(async () => {
      screen.getByText("Criar quadro").closest("button")!.click();
    });
    await waitFor(() => expect(svc.createBoard).toHaveBeenCalledTimes(1));
    expect(svc.createBoard).toHaveBeenCalledWith({
      name: "Marketing e Vendas",
      key: "MKT",
      slug: "marketing-e-vendas",
      color: "#FFB800",
    });
    expect(onCreated).toHaveBeenCalledWith("board-MKT");
  });

  it("colisao de slug vinda do servidor vira mensagem legivel", async () => {
    const { AdminApiError } = await import("@/lib/adminApi");
    svc.createBoard.mockRejectedValue(
      new AdminApiError("Já existe um quadro com essa chave ou slug.", 409, "duplicate_board"),
    );
    renderDialog();
    await preencher("Marketing", "MK2");
    await act(async () => {
      screen.getByText("Criar quadro").closest("button")!.click();
    });
    await waitFor(() =>
      expect(toastSpy.error).toHaveBeenCalledWith(
        "Já existe um quadro com essa sigla ou com um nome muito parecido.",
      ),
    );
  });
});

describe("BoardManagerDialog: excluir", () => {
  it("exige DIGITAR a sigla; um clique nao basta", async () => {
    renderDialog();
    await act(async () => {
      screen.getByLabelText("Excluir DEV").click();
    });

    const botao = screen.getByText("Excluir para sempre").closest("button")!;
    expect(botao).toHaveProperty("disabled", true);

    await act(async () => {
      typeInto(screen.getByLabelText("Digite DEV para confirmar a exclusão"), "DE");
    });
    expect(botao).toHaveProperty("disabled", true);
    await act(async () => {
      botao.click();
    });
    expect(svc.deleteBoard).not.toHaveBeenCalled();

    await act(async () => {
      typeInto(screen.getByLabelText("Digite DEV para confirmar a exclusão"), "DEV");
    });
    await act(async () => {
      botao.click();
    });
    await waitFor(() => expect(svc.deleteBoard).toHaveBeenCalledWith("board-DEV"));
    expect(onDeleted).toHaveBeenCalledWith("board-DEV");
  });

  it("avisa o que o cascade leva junto", async () => {
    renderDialog();
    await act(async () => {
      screen.getByLabelText("Excluir DEV").click();
    });
    expect(screen.getByText(/comentários e o histórico/)).toBeTruthy();
  });
});

describe("BoardManagerDialog: arquivar", () => {
  // Sem listar o arquivado, ele sumiria do seletor sem caminho de volta.
  it("quadro arquivado continua na lista, com acao de restaurar", async () => {
    renderDialog([board("DEV", "Desenvolvimento"), board("OLD", "Antigo", true)]);
    expect(screen.getByLabelText("Restaurar OLD")).toBeTruthy();

    await act(async () => {
      screen.getByLabelText("Restaurar OLD").click();
    });
    await waitFor(() =>
      expect(svc.patchBoard).toHaveBeenCalledWith("board-OLD", { archived: false }),
    );
  });

  it("quadro ativo mostra a acao de arquivar", async () => {
    renderDialog();
    await act(async () => {
      screen.getByLabelText("Arquivar DEV").click();
    });
    await waitFor(() =>
      expect(svc.patchBoard).toHaveBeenCalledWith("board-DEV", { archived: true }),
    );
  });
});

describe("formatIsoDay", () => {
  it("formata em pt-BR", () => {
    expect(formatIsoDay("2026-07-28")).toBe("28/07/2026");
    expect(formatIsoDay("2026-12-01")).toBe("01/12/2026");
  });

  // O motivo de nao usar `new Date()`: em fuso negativo ele devolveria o dia
  // anterior, e o eco na tela mentiria justamente sobre o que ele existe para
  // conferir.
  it("nao desloca o dia por fuso", () => {
    expect(formatIsoDay("2026-01-01")).toBe("01/01/2026");
    expect(formatIsoDay("2026-03-01")).toBe("01/03/2026");
  });

  it("valor ausente ou fora do formato devolve vazio", () => {
    expect(formatIsoDay(null)).toBe("");
    expect(formatIsoDay("")).toBe("");
    expect(formatIsoDay("28/07/2026")).toBe("");
    expect(formatIsoDay("2026-07-28T10:00:00Z")).toBe("");
  });
});
