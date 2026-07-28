import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";

import type { TaskBoard, TaskBoardSnapshot } from "./types";

// Reproducao do "criei um quadro, ele sumiu do seletor e voltou depois".
//
// `useBoardSnapshot` faz DUAS coisas: lista os quadros e carrega o snapshot do
// quadro ativo. Cada uma tem sua requisicao, e a guarda de resposta obsoleta
// (essencial para o board, ver Fase 2) usava UM contador para as duas.
//
// A sequencia real ao criar um quadro:
//   1. o dialogo chama reloadBoards()  -> contador = N+1
//   2. onCreated(id) troca o quadro ativo, o efeito dispara refresh() -> N+2
//   3. a resposta de listBoards chega com selo N+1, diferente do atual N+2,
//      e e DESCARTADA como obsoleta.
// Resultado: a lista de quadros nunca recebe o quadro novo, mesmo tendo sido
// buscada com sucesso. Ele so aparece quando algum outro evento refaz a lista.
//
// Duas requisicoes de recursos DIFERENTES nunca sao obsoletas uma em relacao a
// outra; cada uma precisa do proprio contador.

const svc = vi.hoisted(() => ({
  listBoards: vi.fn(),
  getBoardSnapshot: vi.fn(),
}));

vi.mock("@/services/adminTasksService", () => ({
  listBoards: (...a: unknown[]) => svc.listBoards(...a),
  getBoardSnapshot: (...a: unknown[]) => svc.getBoardSnapshot(...a),
}));

import { useBoardSnapshot } from "./useBoardSnapshot";

function board(key: string): TaskBoard {
  return {
    id: `board-${key}`,
    name: key,
    key,
    slug: key.toLowerCase(),
    description: null,
    color: "#FFB800",
    position: key === "DEV" ? 1000 : 2000,
    next_number: 1,
    archived_at: null,
    created_by: null,
    created_at: key === "DEV" ? "2026-07-28T02:00:00Z" : "2026-07-28T06:00:00Z",
    updated_at: "2026-07-28T06:00:00Z",
  };
}

function snapshotOf(b: TaskBoard): TaskBoardSnapshot {
  return { board: b, columns: [], tasks: [], labels: [], admins: [] };
}

type Api = ReturnType<typeof useBoardSnapshot>;
let api: Api;
let listaVisivel: TaskBoard[] = [];

function Sonda({ boardId }: { boardId: string | null }) {
  api = useBoardSnapshot(boardId);
  listaVisivel = api.boards;
  return null;
}

beforeEach(() => {
  vi.clearAllMocks();
  listaVisivel = [];
});

afterEach(cleanup);

describe("useBoardSnapshot: contadores independentes", () => {
  it("a lista de quadros NAO e invalidada por um refresh de snapshot", async () => {
    // listBoards demora mais que o snapshot: e a ordem que acontece de verdade,
    // porque o refresh parte depois mas responde antes.
    let entregarLista: ((v: unknown) => void) | null = null;
    svc.listBoards.mockImplementation(
      () => new Promise((resolve) => (entregarLista = resolve)),
    );
    svc.getBoardSnapshot.mockResolvedValue(snapshotOf(board("DEV")));

    const { rerender } = render(<Sonda boardId="board-DEV" />);

    // Troca de quadro ativo: dispara o refresh, que bumpa o contador.
    await act(async () => {
      rerender(<Sonda boardId="board-MKT" />);
    });

    // Só agora a lista responde, com os DOIS quadros.
    await act(async () => {
      entregarLista?.({ boards: [board("DEV"), board("MKT")] });
    });

    await waitFor(() => expect(listaVisivel).toHaveLength(2));
    expect(listaVisivel.map((b) => b.key)).toEqual(["DEV", "MKT"]);
  });

  it("resposta ANTIGA de lista ainda e descartada pela lista nova", async () => {
    // A guarda continua valendo dentro do proprio recurso: duas chamadas a
    // listBoards em sequencia, a primeira respondendo por ultimo.
    const pendentes: Array<(v: unknown) => void> = [];
    svc.listBoards.mockImplementation(
      () => new Promise((resolve) => pendentes.push(resolve)),
    );
    svc.getBoardSnapshot.mockResolvedValue(snapshotOf(board("DEV")));

    render(<Sonda boardId="board-DEV" />);
    await waitFor(() => expect(pendentes).toHaveLength(1));

    await act(async () => {
      void api.reloadBoards();
    });
    await waitFor(() => expect(pendentes).toHaveLength(2));

    // A segunda (mais nova) responde primeiro, a primeira depois.
    await act(async () => {
      pendentes[1]({ boards: [board("DEV"), board("MKT")] });
    });
    await act(async () => {
      pendentes[0]({ boards: [board("DEV")] });
    });

    expect(listaVisivel.map((b) => b.key)).toEqual(["DEV", "MKT"]);
  });
});
