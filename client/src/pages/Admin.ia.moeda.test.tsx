import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

/**
 * MOEDA do custo de IA na aba IA.
 *
 * `/ai-stats` devolve `agregarUsoDeIa` cru, e a soma de `cost_estimate` esta em
 * DOLAR: `MODEL_PRICING` (server/lib/aiTools.ts) e cotada em US$ por 1M de
 * tokens. O card "Custo de IA" da Visao ja foi corrigido em 2026-08-14; a aba IA
 * continuou formatando o MESMO numero com `formatCurrency`, que e BRL. Duas
 * telas do mesmo admin exibiam a mesma metrica em moedas diferentes, e a que
 * estava errada e a que tem o detalhamento por ferramenta.
 *
 * O formato fixado aqui e o da Visao (`US$ 2.41`, com `toFixed(2)`), de
 * proposito: duas grafias para o mesmo numero na mesma pagina e o comeco da
 * mesma classe de divergencia.
 */

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/adminApi", () => ({
  adminFetch: (...args: unknown[]) => fetchMock(...args),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    loading: false,
    signOut: vi.fn(),
    user: { id: "admin-1", email: "admin@exemplo.com" },
  }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      // Sessao COM a claim de admin: o gate libera sem passar pelo /me.
      getSession: async () => ({
        data: {
          session: {
            // {"admin_role":"owner"} em base64url, no lugar do payload do JWT.
            access_token: `x.${btoa('{"admin_role":"owner"}')}.y`,
          },
        },
      }),
    },
  },
}));

vi.mock("@/lib/api", () => ({ apiUrl: (p: string) => p }));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver =
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ??
  ResizeObserverStub;

import Admin from "./Admin";

function mockDeRotas(aiStats: unknown) {
  fetchMock.mockImplementation((rota: unknown) => {
    const r = String(rota);
    if (r.startsWith("/ai-stats")) return Promise.resolve({ data: aiStats });
    if (r.startsWith("/health-band")) {
      return Promise.resolve({ data: { ok: true, problemas: [] } });
    }
    return Promise.resolve({ data: {} });
  });
}

/** Renderiza o admin ja na aba IA (a aba vem da URL). */
async function abrirAbaIa() {
  window.history.replaceState({}, "", "/admin?section=ia");
  render(<Admin />);
  await waitFor(() =>
    expect(screen.getByText(/Custo por ferramenta/i)).toBeTruthy(),
  );
}

beforeEach(() => {
  fetchMock.mockReset();
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/admin");
  vi.restoreAllMocks();
});

describe("custo de IA na aba IA", () => {
  it("exibe o custo em US$, nunca em R$", async () => {
    mockDeRotas({
      "linkedin-analyze": {
        calls: 120,
        success: 118,
        cost: 2.41,
        semCustoMedido: 0,
      },
    });
    await abrirAbaIa();

    expect(screen.getByText("US$ 2.41")).toBeTruthy();
    // O SEGUNDO SENTIDO: sem isto, "exibe US$" seria compativel com exibir os
    // dois, e a tela ficaria pior que antes.
    expect(screen.queryByText(/R\$\s*2,41/)).toBeNull();
  });

  it("custo zero exibe US$ 0.00, nao string vazia", async () => {
    // CONTROLE NEGATIVO: zero e um valor medido, e a ferramenta precisa
    // aparecer com ele. Sumir com a linha esconderia uma ferramenta que roda.
    mockDeRotas({
      "career-plan": { calls: 40, success: 38, cost: 0, semCustoMedido: 38 },
    });
    await abrirAbaIa();

    expect(screen.getByText("US$ 0.00")).toBeTruthy();
  });

  it("declara o piso: N chamadas sem custo medido", async () => {
    mockDeRotas({
      "linkedin-analyze": {
        calls: 120,
        success: 118,
        cost: 2.41,
        semCustoMedido: 0,
      },
      "career-plan": { calls: 40, success: 38, cost: 0, semCustoMedido: 38 },
      "interview-turn": { calls: 12, success: 10, cost: 0, semCustoMedido: 10 },
    });
    await abrirAbaIa();

    // A MESMA frase do card da Visao, com o total do agregado.
    expect(screen.getByTestId("ia-piso-custo").textContent).toContain(
      "48 chamadas sem custo medido",
    );
  });

  it("resposta sem `semCustoMedido` nao afirma que esta tudo medido", async () => {
    // JANELA DE DEPLOY: a Vercel sobe antes do Railway, e o campo pode nao vir.
    // Ausencia e ausencia: a nota some, e nao vira "0 chamadas sem custo
    // medido", que seria uma afirmacao que ninguem mediu.
    mockDeRotas({
      "linkedin-analyze": { calls: 120, success: 118, cost: 2.41 },
    });
    await abrirAbaIa();

    expect(screen.getByText("US$ 2.41")).toBeTruthy();
    expect(screen.queryByTestId("ia-piso-custo")).toBeNull();
  });
});
