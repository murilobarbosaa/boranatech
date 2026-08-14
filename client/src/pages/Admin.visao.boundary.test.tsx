import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

/**
 * CONTENCAO DE BLOCO na Visao de verdade.
 *
 * `BlocoBoundary.test.tsx` prova a contencao no componente isolado. Este prova
 * na PAGINA: com um bloco real lancando no render, os vizinhos continuam de pe e
 * a navegacao entre abas sobrevive. E a diferenca entre "o boundary funciona" e
 * "o boundary esta no lugar certo" — um wrapper esquecido em volta do bloco
 * errado passaria no primeiro teste e falharia aqui.
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

// O ResponsiveContainer do Recharts observa o tamanho do pai, e o jsdom não tem
// ResizeObserver. Só o teste de payload PARCIAL chega a montar um gráfico com
// pontos (os demais param no estado vazio), e sem este stub ele deixa dois erros
// não tratados no relatório da suíte, que viram ruído capaz de esconder falha de
// verdade depois.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver =
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ??
  ResizeObserverStub;

// O funil lanca no render, como lancaria com um payload de shape inesperado.
vi.mock("@/components/admin/overview/PaidFunnel", () => ({
  PaidFunnel: () => {
    throw new Error("campo ausente no payload do funil");
  },
}));

vi.mock("@sentry/react", () => ({
  captureException: () => "evt_abcdef123456",
}));

import Admin from "./Admin";

beforeEach(() => {
  window.history.replaceState({}, "", "/admin");
  fetchMock.mockReset();
  // Payloads minimos e VALIDOS: o unico erro deste arquivo tem de vir do bloco
  // que lanca de proposito, senao o teste mediria outra coisa.
  fetchMock.mockImplementation((rota: unknown) => {
    const r = String(rota);
    if (r.startsWith("/health-band")) {
      return Promise.resolve({ data: { ok: true, problemas: [] } });
    }
    if (r.startsWith("/overview")) {
      return Promise.reject(new Error("sem dados no teste"));
    }
    if (r.startsWith("/dashboard")) {
      return Promise.resolve({ data: { recent_audit: [] } });
    }
    return Promise.resolve({ data: {} });
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("um bloco quebrado não derruba a Visão", () => {
  it("o funil mostra que quebrou e os vizinhos continuam", async () => {
    render(<Admin />);

    const quebrado = await screen.findByTestId("bloco-quebrado");
    expect(quebrado.getAttribute("data-bloco")).toBe(
      "Funil até o assinante pago",
    );

    // Os vizinhos do mesmo lado da página seguem vivos. Sem o boundary, o
    // ErrorBoundary da App teria trocado tudo isto pela tela cheia de falha.
    expect(await screen.findByTestId("grafico-assinaturas")).toBeTruthy();
    expect(screen.getByTestId("grafico-cadastros")).toBeTruthy();
    expect(screen.getByTestId("overview-periodo")).toBeTruthy();
    expect(screen.getByText(/Aquisição de usuários/i)).toBeTruthy();
    expect(screen.getByText(/Atenção necessária/i)).toBeTruthy();
  });

  it("a navegação entre abas continua funcionando com o bloco quebrado", async () => {
    // O pior desfecho do erro sem contenção não era a tela feia: era o painel
    // ficar inalcançável, porque o F5 volta para a mesma aba e quebra de novo.
    render(<Admin />);
    await screen.findByTestId("bloco-quebrado");

    (await screen.findByTestId("link-paginas")).click();

    await waitFor(() =>
      expect(screen.getByText(/Qualidade real das páginas/i)).toBeTruthy(),
    );
  });
});
