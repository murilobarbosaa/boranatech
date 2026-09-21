import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

/**
 * CartaoDoRanking: o mini ranking da aba Numeros (lote 11d).
 *
 * Quatro respostas, quatro telas: o viewer no top 3 (a linha dele com o chip,
 * sem linha extra), fora do top 3 (as tres linhas e a dele abaixo), sem pontos
 * (as tres linhas e a frase), e sem resposta (nada, nem esqueleto), que e o
 * caso do erro e do backend anterior. O influencer nem monta o cartao: isso e
 * da pagina (Creator.test.tsx).
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

function posicao(
  n: number,
  pontos: number,
  eu = false,
  extra: Partial<PosicaoDoRanking> = {},
): PosicaoDoRanking {
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
    ...extra,
  };
}

function responderCom(posicoes: PosicaoDoRanking[]) {
  estado.responder = async () => ({
    data: {
      mes: "2026-09",
      fechado: false,
      fecha_em: null,
      posicoes,
      minha_posicao: posicoes.find((p) => p.eu) ?? null,
    },
  });
}

function montar() {
  const { hook, searchHook } = memoryLocation({ path: "/creator" });
  render(
    <Router hook={hook} searchHook={searchHook}>
      <CartaoDoRanking />
    </Router>,
  );
}

function idsDoTopo() {
  return within(screen.getByTestId("creator-card-ranking-topo"))
    .getAllByRole("listitem")
    .map((li) => li.getAttribute("data-testid"));
}

beforeEach(() => {
  estado.chamadas = [];
});

afterEach(() => {
  cleanup();
});

describe("CartaoDoRanking", () => {
  it("viewer no top 3: as tres linhas, a dele com o chip Voce, sem linha extra, e o link", async () => {
    responderCom([
      posicao(1, 50),
      posicao(2, 40, true, {
        avatar: {
          mode: "icon",
          avatar_url: null,
          icon: "crown",
          bg: "purple",
          border: "pro-holo",
        },
      }),
      posicao(3, 30),
      posicao(4, 5),
    ]);
    montar();
    await screen.findByTestId("creator-card-ranking");
    expect(estado.chamadas).toEqual(["/creator/ranking"]);
    expect(idsDoTopo()).toEqual([
      "creator-card-ranking-linha-u1",
      "creator-card-ranking-linha-u2",
      "creator-card-ranking-linha-u3",
    ]);
    const minha = screen.getByTestId("creator-card-ranking-linha-u2");
    expect(
      within(minha).getByTestId("creator-card-ranking-voce-u2"),
    ).toBeTruthy();
    expect(minha.textContent).toContain("40");
    expect(minha.getAttribute("class") ?? "").toContain(
      "border-[var(--bnt-accent-solid)]",
    );
    expect(screen.queryByTestId("creator-card-ranking-minha")).toBeNull();
    expect(screen.queryByTestId("creator-card-ranking-vazio")).toBeNull();
    expect(
      screen.getByTestId("creator-card-ranking-link").getAttribute("href"),
    ).toBe("/creator?aba=ranking");
    expect(
      screen.getByTestId("creator-card-ranking-link").textContent,
    ).toContain("Ver ranking completo");
  });

  it("viewer fora do top 3: as tres linhas e a dele abaixo, com o chip", async () => {
    responderCom([
      posicao(1, 50),
      posicao(2, 40),
      posicao(3, 30),
      posicao(4, 20),
      posicao(5, 7, true),
    ]);
    montar();
    await screen.findByTestId("creator-card-ranking");
    expect(idsDoTopo()).toEqual([
      "creator-card-ranking-linha-u1",
      "creator-card-ranking-linha-u2",
      "creator-card-ranking-linha-u3",
    ]);
    const minha = screen.getByTestId("creator-card-ranking-minha");
    expect(
      within(minha).getByTestId("creator-card-ranking-linha-u5"),
    ).toBeTruthy();
    expect(
      within(minha).getByTestId("creator-card-ranking-voce-u5"),
    ).toBeTruthy();
    expect(minha.textContent).toContain("5");
    expect(minha.textContent).toContain("7");
    expect(screen.queryByTestId("creator-card-ranking-vazio")).toBeNull();
  });

  it("sem pontos: as tres linhas do podio e a frase, sem a linha do viewer", async () => {
    responderCom([posicao(1, 50), posicao(2, 20), posicao(3, 0, true)]);
    montar();
    await screen.findByTestId("creator-card-ranking");
    // Zero ponto nao sobe no podio: so duas linhas pontuaram.
    expect(idsDoTopo()).toEqual([
      "creator-card-ranking-linha-u1",
      "creator-card-ranking-linha-u2",
    ]);
    expect(screen.getByTestId("creator-card-ranking-vazio").textContent).toBe(
      "Você ainda não pontuou este mês",
    );
    expect(screen.queryByTestId("creator-card-ranking-minha")).toBeNull();
    expect(screen.queryByTestId(/creator-card-ranking-voce/)).toBeNull();
  });

  it("ninguem pontuou: a linha 'Ninguém pontuou' e a frase", async () => {
    responderCom([posicao(1, 0, true), posicao(2, 0)]);
    montar();
    await screen.findByTestId("creator-card-ranking");
    expect(screen.getByTestId("creator-card-ranking-ninguem")).toBeTruthy();
    expect(screen.getByTestId("creator-card-ranking-vazio")).toBeTruthy();
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
      await new Promise((r) => setTimeout(r, 0));
      expect(screen.queryByTestId("creator-card-ranking")).toBeNull();
      expect(screen.queryByTestId("creator-card-ranking-esqueleto")).toBeNull();
    }
  });

  it("enquanto carrega, o esqueleto de tres linhas", async () => {
    let liberar: (v: unknown) => void = () => {};
    estado.responder = () =>
      new Promise((r) => {
        liberar = r;
      });
    montar();
    const esqueleto = screen.getByTestId("creator-card-ranking-esqueleto");
    expect(esqueleto.getAttribute("aria-busy")).toBe("true");
    expect(esqueleto.querySelectorAll(".h-12")).toHaveLength(3);
    expect(screen.queryByTestId("creator-card-ranking")).toBeNull();
    liberar({
      data: {
        mes: "2026-09",
        posicoes: [posicao(1, 50, true)],
        minha_posicao: posicao(1, 50, true),
      },
    });
    await screen.findByTestId("creator-card-ranking");
    expect(screen.queryByTestId("creator-card-ranking-esqueleto")).toBeNull();
  });
});
