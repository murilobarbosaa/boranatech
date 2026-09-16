import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CreatorPublicacoesAdmin: a lista de publicacoes de um creator na aba
 * Creators do admin (lote 09).
 *
 * Duas diferencas em relacao a lista do proprio creator, e as duas sao
 * afirmadas aqui: NAO ha formulario (ninguem registra pelo outro), e a remocao
 * chama a rota do admin, que audita antes de apagar.
 */

type Chamada = { path: string; method: string };

const estado = vi.hoisted(() => ({
  chamadas: [] as Chamada[],
  responder: (async () => ({})) as (
    path: string,
    method: string,
  ) => Promise<unknown>,
  toastOk: vi.fn(),
  toastErro: vi.fn(),
}));

vi.mock("@/lib/adminApi", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/adminApi")>();
  return {
    ...real,
    adminFetch: async (path: string, options?: RequestInit) => {
      const method = options?.method ?? "GET";
      estado.chamadas.push({ path, method });
      return estado.responder(path, method);
    },
  };
});
vi.mock("sonner", () => ({
  toast: {
    success: (...a: unknown[]) => estado.toastOk(...a),
    error: (...a: unknown[]) => estado.toastErro(...a),
  },
}));

import { AdminApiError } from "@/lib/adminApi";
import { CreatorPublicacoesAdmin } from "./CreatorPublicacoesAdmin";

const UID = "33333333-3333-3333-3333-333333333333";
const POST_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

const REEL = {
  id: POST_ID,
  network: "instagram",
  kind: "reel",
  url: "https://www.instagram.com/reel/Cx1AbCdEf_-/",
  created_at: "2026-09-15T12:00:00Z",
};

function responderLista(posts: unknown[], no_mes: number) {
  estado.responder = async (_path, method) =>
    method === "GET" ? { data: { posts, total: posts.length, no_mes } } : {};
}

beforeEach(() => {
  estado.chamadas = [];
  estado.toastOk = vi.fn();
  estado.toastErro = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe("CreatorPublicacoesAdmin", () => {
  it("busca pela rota do admin e lista sem formulario", async () => {
    responderLista([REEL], 1);
    render(<CreatorPublicacoesAdmin userId={UID} />);
    const linha = await screen.findByTestId(
      `creator-publicacao-admin-${POST_ID}`,
    );
    expect(estado.chamadas).toEqual([
      { path: `/creators/${UID}/posts`, method: "GET" },
    ]);
    expect(within(linha).getByRole("link").getAttribute("href")).toBe(REEL.url);
    expect(linha.textContent).toContain("15/09");
    expect(
      screen.getByTestId("creator-publicacoes-admin-no-mes").textContent,
    ).toBe("1 este mês");
    // Ninguem registra publicacao pelo outro.
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("sem publicacao: a frase propria, e nenhuma linha", async () => {
    responderLista([], 0);
    render(<CreatorPublicacoesAdmin userId={UID} />);
    await screen.findByTestId("creator-publicacoes-admin-vazio");
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("remover pede confirmacao e chama a rota do admin", async () => {
    responderLista([REEL], 1);
    render(<CreatorPublicacoesAdmin userId={UID} />);
    await screen.findByTestId(`creator-publicacao-admin-${POST_ID}`);

    fireEvent.click(
      screen.getByTestId(`creator-publicacao-admin-remover-${POST_ID}`),
    );
    expect(estado.chamadas.filter((c) => c.method === "DELETE")).toHaveLength(
      0,
    );

    estado.responder = async () => ({ data: { id: POST_ID } });
    fireEvent.click(
      screen.getByTestId(`creator-publicacao-admin-confirmar-${POST_ID}`),
    );
    await waitFor(() =>
      expect(estado.chamadas.filter((c) => c.method === "DELETE")).toEqual([
        { path: `/creators/${UID}/posts/${POST_ID}`, method: "DELETE" },
      ]),
    );
    await screen.findByTestId("creator-publicacoes-admin-vazio");
    expect(
      screen.getByTestId("creator-publicacoes-admin-no-mes").textContent,
    ).toBe("0 este mês");
  });

  it("falha na remocao: avisa e a linha continua", async () => {
    responderLista([REEL], 1);
    render(<CreatorPublicacoesAdmin userId={UID} />);
    await screen.findByTestId(`creator-publicacao-admin-${POST_ID}`);

    estado.responder = async () => {
      throw new AdminApiError(
        "Não foi possível registrar a auditoria da remoção.",
        500,
        "audit_failed",
      );
    };
    fireEvent.click(
      screen.getByTestId(`creator-publicacao-admin-remover-${POST_ID}`),
    );
    fireEvent.click(
      screen.getByTestId(`creator-publicacao-admin-confirmar-${POST_ID}`),
    );
    await waitFor(() => expect(estado.toastErro).toHaveBeenCalledTimes(1));
    expect(
      screen.getByTestId(`creator-publicacao-admin-${POST_ID}`),
    ).toBeTruthy();
  });

  it("erro na busca: bloco de erro, e tentar de novo refaz a busca", async () => {
    let vez = 0;
    estado.responder = async () => {
      vez += 1;
      if (vez === 1) throw new AdminApiError("falhou", 500, "db_error");
      return { data: { posts: [], total: 0, no_mes: 0 } };
    };
    render(<CreatorPublicacoesAdmin userId={UID} />);
    const erro = await screen.findByTestId("creator-publicacoes-admin-erro");
    fireEvent.click(
      within(erro).getByRole("button", { name: "Tentar de novo" }),
    );
    await screen.findByTestId("creator-publicacoes-admin-vazio");
    expect(estado.chamadas.filter((c) => c.method === "GET")).toHaveLength(2);
  });
});
