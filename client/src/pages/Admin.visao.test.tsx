import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

/**
 * INVENTARIO DE BLOCOS da aba Visao.
 *
 * Este teste nasceu junto com a poda, e a razao e a propria poda: a Visao chegou
 * a 11 blocos porque cada um entrou sem ninguem conferir o conjunto, e sairia do
 * mesmo jeito. Nao existia nenhum teste da Visao antes desta fatia (ha um
 * inventario de FRASES da aba Usuarios, `users/aba.frases.test.tsx`, e ele nao
 * cobre esta tela).
 *
 * A verificacao roda nos DOIS sentidos, como o da aba Usuarios:
 *
 *   1. o que declarei que FICA esta na tela?   (bloco nao some em silencio)
 *   2. o que declarei que SAIU sumiu mesmo?    (bloco nao volta em silencio)
 *
 * As duas listas juntas sao o conjunto INTEIRO de blocos que a Visao ja teve, e
 * e por isso que elas ficam neste arquivo e nao na cabeca de ninguem: um bloco
 * novo que apareca sem entrar em SAIRAM nem em FICARAM nao derruba este teste,
 * mas qualquer mexida nos que existem derruba, e o proximo a mexer le a lista.
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

import Admin from "./Admin";

/** Blocos que a fatia 9 REMOVEU, com o destino que ficou no lugar de cada um. */
const SAIRAM: Array<{ titulo: string | RegExp; substituto: string }> = [
  { titulo: /insight rápido/i, substituto: "nenhum (não entregava nada)" },
  { titulo: /Consumo de créditos de IA/i, substituto: "aba IA" },
  { titulo: /Assinaturas e planos/i, substituto: "aba Financeiro" },
  { titulo: /Páginas mais acessadas/i, substituto: "aba Páginas" },
  { titulo: /Fila de e-mails/i, substituto: "faixa de saúde" },
];

/** Blocos que FICARAM, na ordem em que aparecem na tela. */
const FICARAM = [
  /Do visitante ao assinante Pro/i,
  /Aquisição de usuários/i,
  /Eventos recentes/i,
];

beforeEach(() => {
  // A aba vem da URL (`?section=`), e o jsdom guarda a URL entre os testes do
  // arquivo: sem este reset, o teste que clica no link para Páginas deixaria os
  // seguintes começando naquela aba, e eles falhariam por não achar a Visão.
  window.history.replaceState({}, "", "/admin");
  fetchMock.mockReset();
  // Cada rota devolve o SHAPE REAL, mesmo que vazio. Um `{}` genérico faria os
  // componentes quebrarem por leitura de campo ausente, e o teste passaria a
  // medir a robustez do mock em vez da presença dos blocos.
  fetchMock.mockImplementation((rota: unknown) => {
    const r = String(rota);
    if (r.startsWith("/health-band")) {
      return Promise.resolve({ data: { ok: true, problemas: [] } });
    }
    if (r.startsWith("/overview")) {
      return Promise.reject(new Error("sem dados no teste"));
    }
    if (r.startsWith("/subscription-history")) {
      return Promise.resolve({
        data: {
          window: "30",
          points: [],
          firstSnapshotDate: null,
          lastSnapshotDate: null,
          staleDays: null,
          gaps: [],
          truncated: false,
        },
      });
    }
    if (r.startsWith("/signup-history")) {
      return Promise.resolve({
        data: {
          window: "30",
          points: [],
          firstSignupDate: null,
          lastDate: null,
        },
      });
    }
    if (r.startsWith("/paid-funnel")) {
      return Promise.resolve({
        data: {
          janela: { from: "", to: "", days: 30 },
          posthog: { state: "ok" },
          steps: [],
          biggestLeak: null,
          pagantesNaJanela: 0,
          assinantesSemRastro: 0,
          retornos: { pessoas: 0, converteramDepois: 0 },
          boletosPendentes: { count: 0, cents: 0 },
          truncated: false,
        },
      });
    }
    if (r.startsWith("/dashboard")) {
      return Promise.resolve({ data: { recent_audit: [] } });
    }
    if (r.startsWith("/posthog-stats")) {
      return Promise.resolve({
        data: {
          state: "ok",
          hasData: false,
          stats: {
            totalPageviews: 0,
            uniqueUsers: 0,
            pages: [],
            events: {},
            proGates: [],
            acquisition: [],
          },
        },
      });
    }
    if (r.startsWith("/churn-risk") || r.startsWith("/affiliates-stats")) {
      return Promise.resolve({ data: [] });
    }
    return Promise.resolve({ data: {} });
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("inventário de blocos da Visão", () => {
  it("todo bloco declarado como REMOVIDO sumiu da tela", async () => {
    render(<Admin />);
    await waitFor(() =>
      expect(screen.getByText(/Do visitante ao assinante Pro/i)).toBeTruthy(),
    );

    for (const { titulo, substituto } of SAIRAM) {
      expect(
        screen.queryByText(titulo),
        `"${titulo}" deveria ter saído da Visão (substituto: ${substituto})`,
      ).toBeNull();
    }
  });

  it("todo bloco declarado como MANTIDO continua na tela", async () => {
    render(<Admin />);

    for (const titulo of FICARAM) {
      await waitFor(() => expect(screen.getByText(titulo)).toBeTruthy());
    }
  });

  it("o link para a aba Páginas existe e leva ao destino", async () => {
    // Nenhum card aponta para `paginas`, então sem este botão o destino do
    // "Páginas mais acessadas" existiria e ninguém o encontraria.
    render(<Admin />);
    const link = await screen.findByTestId("link-paginas");
    link.click();

    await waitFor(() =>
      expect(screen.getByText(/Qualidade real das páginas/i)).toBeTruthy(),
    );
  });

  it("a faixa de saúde e o seletor de período seguem no topo", async () => {
    render(<Admin />);
    await waitFor(() =>
      expect(screen.getByText(/Do visitante ao assinante Pro/i)).toBeTruthy(),
    );
    // A ordem é a hierarquia: saúde e seletor antes de tudo que decide.
    expect(await screen.findByTestId("health-band")).toBeTruthy();
    expect(screen.getByTestId("overview-periodo")).toBeTruthy();
  });

  it("payload sem os campos esperados NÃO derruba a Visão", async () => {
    // JANELA DE DEPLOY: a Vercel sobe antes do Railway, então o frontend novo
    // fala com o backend antigo por 1 a 3 minutos. Este teste encontrou TRÊS
    // leituras soltas que viravam TypeError no corpo do componente e levavam a
    // Visão inteira junto: `problemas` na faixa e `points` nos dois gráficos.
    fetchMock.mockImplementation((rota: unknown) => {
      const r = String(rota);
      if (r.startsWith("/health-band")) return Promise.resolve({ data: {} });
      if (r.startsWith("/overview"))
        return Promise.reject(new Error("sem dados no teste"));
      if (r.startsWith("/dashboard"))
        return Promise.resolve({ data: { recent_audit: [] } });
      if (r.startsWith("/paid-funnel"))
        return Promise.resolve({
          data: {
            janela: { from: "", to: "", days: 30 },
            posthog: { state: "ok" },
            steps: [],
            biggestLeak: null,
            pagantesNaJanela: 0,
            assinantesSemRastro: 0,
            retornos: null,
            boletosPendentes: { count: 0, cents: 0 },
            truncated: false,
          },
        });
      return Promise.resolve({ data: {} });
    });

    render(<Admin />);
    // A Visão inteira continua de pé, e a faixa degrada para o estado
    // silencioso em vez de derrubar o render.
    await waitFor(() =>
      expect(screen.getByText(/Do visitante ao assinante Pro/i)).toBeTruthy(),
    );
    const faixa = await screen.findByTestId("health-band");
    expect(faixa.getAttribute("data-estado")).toBe("ok");
  });
});
