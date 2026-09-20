import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

/**
 * CartaoDoRanking: o cartao pequeno da aba Numeros (lote 11).
 *
 * Tres respostas, tres telas: com posicao (posicao, total e pontos), sem
 * pontos (a frase e o link), e sem resposta (nada, nem esqueleto), que e o
 * caso do erro e do backend anterior.
 */

const estado = vi.hoisted(() => ({
  chamadas: [] as string[],
  responder: (async () => ({})) as (path: string) => Promise<unknown>,
}));

vi.mock("@/lib/adminApi", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/adminApi")>();
  return {
    ...real,
    contentFetch: async (path: string) => {
      estado.chamadas.push(path);
      return estado.responder(path);
    },
  };
});

import { AdminApiError } from "@/lib/adminApi";
import type { PosicaoDoRanking } from "@shared/creatorRanking";
import { CartaoDoRanking } from "./CartaoDoRanking";

function posicao(n: number, pontos: number, eu = false): PosicaoDoRanking {
  return {
    posicao: n,
    user_id: `u${n}`,
    name: null,
    handle: `h${n}`,
    rede_do_handle: null,
    avatar_url: null,
    calendar_color: "violet",
    pontos,
    contagens: { publicacoes: 0, vendas: 0, cliques: 0 },
    eu,
  };
}

function montar() {
  const { hook, searchHook } = memoryLocation({ path: "/creator" });
  render(
    <Router hook={hook} searchHook={searchHook}>
      <CartaoDoRanking />
    </Router>,
  );
}

beforeEach(() => {
  estado.chamadas = [];
});

afterEach(() => {
  cleanup();
});

describe("CartaoDoRanking", () => {
  it("busca o mes atual (sem ?mes) e mostra posicao, total e pontos, com o link", async () => {
    const posicoes = [posicao(1, 50), posicao(2, 40, true), posicao(3, 0)];
    estado.responder = async () => ({
      data: { mes: "2026-09", posicoes, minha_posicao: posicoes[1] },
    });
    montar();
    const cartao = await screen.findByTestId("creator-card-ranking");
    expect(estado.chamadas).toEqual(["/creator/ranking"]);
    expect(screen.getByTestId("creator-card-ranking-posicao").textContent).toBe(
      "2º",
    );
    expect(cartao.textContent).toContain("de 3");
    expect(screen.getByTestId("creator-card-ranking-pontos").textContent).toBe(
      "40 pontos",
    );
    expect(
      screen.getByTestId("creator-card-ranking-link").getAttribute("href"),
    ).toBe("/creator?aba=ranking");
  });

  it("sem pontos: a frase e o mesmo link", async () => {
    const posicoes = [posicao(1, 50), posicao(2, 0, true)];
    estado.responder = async () => ({
      data: { mes: "2026-09", posicoes, minha_posicao: posicoes[1] },
    });
    montar();
    expect(
      (await screen.findByTestId("creator-card-ranking-vazio")).textContent,
    ).toBe("Você ainda não pontuou este mês");
    expect(screen.queryByTestId("creator-card-ranking-posicao")).toBeNull();
    expect(screen.getByTestId("creator-card-ranking-link")).toBeTruthy();
  });

  it("um ponto no singular", async () => {
    const posicoes = [posicao(1, 1, true)];
    estado.responder = async () => ({
      data: { mes: "2026-09", posicoes, minha_posicao: posicoes[0] },
    });
    montar();
    expect(
      (await screen.findByTestId("creator-card-ranking-pontos")).textContent,
    ).toBe("1 ponto");
  });

  it("erro, 404 do backend anterior ou resposta fora do formato: nenhum cartao", async () => {
    for (const responder of [
      async () => {
        throw new AdminApiError("Not found", 404, null);
      },
      async () => {
        throw new Error("rede");
      },
      async () => ({ data: null }),
    ]) {
      cleanup();
      estado.chamadas = [];
      estado.responder = responder;
      montar();
      await waitFor(() => expect(estado.chamadas).toHaveLength(1));
      // Da tempo de um render depois da resposta.
      await new Promise((r) => setTimeout(r, 0));
      expect(screen.queryByTestId("creator-card-ranking")).toBeNull();
    }
  });
});
