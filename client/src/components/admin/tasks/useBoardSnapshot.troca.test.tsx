import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";

import type { TaskBoard, TaskBoardSnapshot } from "./types";

// TROCA DE QUADRO: o quadro velho nao pode se passar pelo novo enquanto o novo
// carrega.
//
// Relato: ao trocar de DEV para BUGS, as colunas de DEV continuavam na tela ate
// os dados novos chegarem, e o BUGS aparecia de uma vez. A condicao antiga era
// `loading: current.snapshot === null`, desenhada para o refresh SILENCIOSO do
// mesmo quadro (mover, criar, renomear), que e comportamento bom e continua
// valendo. Na troca, porem, o snapshot antigo existe, entao carregando ficava
// falso: o estado nao guardava DE QUAL quadro era o snapshot e por isso nao
// tinha como separar os dois casos.
//
// Estes testes travam a separacao pelos dois lados: a troca liga o estado de
// transicao, e o refresh do mesmo quadro NAO liga.

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

function Sonda({
  boardId,
  includeArchived = false,
}: {
  boardId: string | null;
  includeArchived?: boolean;
}) {
  api = useBoardSnapshot(boardId, includeArchived);
  return null;
}

/** Fila de resolvers, uma entrada por chamada de getBoardSnapshot, em ordem. */
let entregas: Array<(snapshot: TaskBoardSnapshot) => void> = [];

beforeEach(() => {
  vi.clearAllMocks();
  entregas = [];
  svc.listBoards.mockResolvedValue({ boards: [board("DEV"), board("MKT")] });
  svc.getBoardSnapshot.mockImplementation(
    () => new Promise((resolve) => entregas.push(resolve)),
  );
});

afterEach(cleanup);

/** Monta ja com o quadro DEV carregado, que e o ponto de partida da troca. */
async function comDevCarregado() {
  const utils = render(<Sonda boardId="board-DEV" />);
  await waitFor(() => expect(entregas).toHaveLength(1));
  await act(async () => {
    entregas[0](snapshotOf(board("DEV")));
  });
  await waitFor(() => expect(api.snapshot?.board.key).toBe("DEV"));
  expect(api.trocandoDeBoard).toBe(false);
  return utils;
}

describe("useBoardSnapshot: troca de quadro e um estado nomeado", () => {
  it("trocar de quadro com snapshot antigo presente LIGA a transicao", async () => {
    const { rerender } = await comDevCarregado();

    await act(async () => {
      rerender(<Sonda boardId="board-MKT" />);
    });

    expect(api.trocandoDeBoard).toBe(true);
    expect(api.loading).toBe(true);
    // O snapshot antigo continua no estado (nao ha o que colocar no lugar); o
    // que muda e que agora ele esta MARCADO como de outro quadro, e quem
    // renderiza sabe que nao pode mostra-lo.
    expect(api.snapshot?.board.key).toBe("DEV");
  });

  it("a resposta do quadro novo DESLIGA a transicao", async () => {
    const { rerender } = await comDevCarregado();
    await act(async () => {
      rerender(<Sonda boardId="board-MKT" />);
    });
    await waitFor(() => expect(entregas).toHaveLength(2));

    await act(async () => {
      entregas[1](snapshotOf(board("MKT")));
    });

    expect(api.trocandoDeBoard).toBe(false);
    expect(api.loading).toBe(false);
    expect(api.snapshot?.board.key).toBe("MKT");
  });

  it("refresh do MESMO quadro continua SILENCIOSO", async () => {
    // O outro lado da separacao, e a razao de a condicao antiga existir: mover
    // uma tarefa, criar etapa ou ligar arquivadas dispara refresh com o snapshot
    // ja na tela. Piscar esqueleto a cada mutacao seria uma regressao pior que o
    // bug que esta frente corrige.
    const { rerender } = await comDevCarregado();

    await act(async () => {
      rerender(<Sonda boardId="board-DEV" includeArchived />);
    });

    expect(api.trocandoDeBoard).toBe(false);
    expect(api.loading).toBe(false);
    expect(api.snapshot?.board.key).toBe("DEV");
  });

  it("resposta ATRASADA do quadro antigo nao termina a transicao", async () => {
    // A guarda de sequencia do seq.test continua sendo quem descarta a resposta
    // obsoleta; o que este teste acrescenta e que ela protege TAMBEM a marca do
    // quadro dono do snapshot. Sem isso, a resposta velha carimbaria o estado
    // com `board-DEV`, a transicao terminaria cedo e a tela voltaria a mostrar o
    // quadro errado, que e exatamente o bug de origem.
    const { rerender } = await comDevCarregado();
    await act(async () => {
      rerender(<Sonda boardId="board-MKT" />);
    });
    await waitFor(() => expect(entregas).toHaveLength(2));

    // A requisicao 0 (DEV) responde de novo, atrasada, DEPOIS da troca.
    await act(async () => {
      entregas[0](snapshotOf(board("DEV")));
    });

    expect(api.trocandoDeBoard).toBe(true);
    expect(api.loading).toBe(true);

    // E o quadro novo, chegando depois, ainda termina a transicao normalmente.
    await act(async () => {
      entregas[1](snapshotOf(board("MKT")));
    });
    expect(api.trocandoDeBoard).toBe(false);
    expect(api.snapshot?.board.key).toBe("MKT");
  });
});
