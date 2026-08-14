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

import Admin from "./Admin";

/** Blocos que a fatia 9 REMOVEU, com o destino que ficou no lugar de cada um. */
const SAIRAM: Array<{ titulo: string | RegExp; substituto: string }> = [
  { titulo: /insight rápido/i, substituto: "nenhum (não entregava nada)" },
  { titulo: /Consumo de créditos de IA/i, substituto: "aba IA" },
  { titulo: /Assinaturas e planos/i, substituto: "aba Financeiro" },
  { titulo: /Páginas mais acessadas/i, substituto: "aba Páginas" },
  { titulo: /Fila de e-mails/i, substituto: "faixa de saúde" },
  // Rodada 5 (2026-08-14): "Eventos recentes" listava as 10 últimas linhas de
  // `content_audit_logs`, ou seja, histórico de edição de conteúdo. O espaço
  // mais visível da Visão era o único sobre o qual não havia nada a fazer.
  { titulo: /Eventos recentes/i, substituto: "painel Atenção necessária" },
  // Rodada 6 (2026-08-14, D10): "Aquisição de usuários" rankeava
  // `$referring_domain` do PostHog, que NÃO é atribuição — não há coluna de UTM,
  // referrer ou canal em `profiles` nem em `subscriptions`, então o número não
  // se liga a receita nem sobrevive a bloqueador de script. Instrumentação de
  // canal virou frente futura.
  { titulo: /Aquisição de usuários/i, substituto: "nenhum (sem fonte real)" },
];

/** Blocos que FICARAM, na ordem em que aparecem na tela. */
const FICARAM = [
  // "Do visitante ao assinante Pro" virou "Onde as pessoas param?": o funil saiu
  // do PostHog para tabelas locais e passou a mostrar TAXAS entre etapas.
  /Onde as pessoas param\?/i,
  /Conversões Pro por dia/i,
  /Custo de IA e receita/i,
  /uso de IA por ferramenta/i,
  /Atenção necessária/i,
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
      expect(screen.getByText(/Onde as pessoas param\?/i)).toBeTruthy(),
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
      expect(screen.getByText(/Onde as pessoas param\?/i)).toBeTruthy(),
    );
    // A ordem é a hierarquia: saúde e seletor antes de tudo que decide.
    expect(await screen.findByTestId("health-band")).toBeTruthy();
    expect(screen.getByTestId("overview-periodo")).toBeTruthy();
  });

  it("payload sem os campos esperados NÃO derruba a Visão", async () => {
    // JANELA DE DEPLOY e mudança de contrato: a Vercel sobe antes do Railway, e
    // qualquer alteração futura no shape destas rotas chega ao bundle novo antes
    // de o backend acompanhar (ou depois de ele já ter mudado).
    //
    // Este teste é o CASO EXTREMO de propósito: TODAS as rotas da Visão
    // respondem 200 com `{}`. Nenhuma leitura pode estourar, porque um erro de
    // render aqui não derruba um bloco, derruba a página inteira: o
    // ErrorBoundary da App troca tudo pela tela de falha.
    //
    // Encontrou seis leituras soltas no PaidFunnel, duas no Admin.tsx e uma em
    // cada gráfico. A versão anterior deste teste passava um payload COMPLETO
    // para /paid-funnel e /overview, então não exercia nenhuma delas.
    fetchMock.mockImplementation(() => Promise.resolve({ data: {} }));

    render(<Admin />);

    // A Visão continua de pé: o funil, o bloco de aquisição e o painel de
    // atenção renderizam, e a faixa degrada para o estado silencioso. O painel
    // de atenção com `{}` é o caso que pegou um TypeError real na integração da
    // rodada 5: `data.itens.length` sobre payload degradado derrubaria a ABA
    // INTEIRA, não só o bloco.
    await waitFor(() =>
      expect(screen.getByText(/Onde as pessoas param\?/i)).toBeTruthy(),
    );
    expect(screen.getByText(/uso de IA por ferramenta/i)).toBeTruthy();
    expect(screen.getByText(/Atenção necessária/i)).toBeTruthy();
    const faixa = await screen.findByTestId("health-band");
    expect(faixa.getAttribute("data-estado")).toBe("ok");
    // Os cards caem no estado nomeado, não em R$ 0,00 falso.
    expect(screen.getAllByText("indisponível").length).toBeGreaterThan(0);
  });

  it("payload de ERRO no lugar do de sucesso também não derruba", async () => {
    // O outro sentido: a rota existe e responde, mas com o envelope de falha.
    fetchMock.mockImplementation(() =>
      Promise.resolve({ data: null, error: "boom" }),
    );

    render(<Admin />);

    await waitFor(() =>
      expect(screen.getByText(/Onde as pessoas param\?/i)).toBeTruthy(),
    );
  });

  it("payload PARCIAL (com os campos antigos, sem os novos) não derruba", async () => {
    // O caso que o payload vazio NÃO exercita, e o mais realista de todos: a
    // resposta traz o que sempre trouxe e falta só o campo acrescentado depois.
    // As guardas de primeiro nível passam e o estouro acontece adiante — foi
    // exatamente assim que `gaps` sobreviveu à primeira rodada desta varredura.
    fetchMock.mockImplementation((rota: unknown) => {
      const r = String(rota);
      if (r.startsWith("/subscription-history")) {
        return Promise.resolve({
          data: {
            window: "30",
            points: [
              {
                date: "2026-07-30",
                missing: false,
                activeCount: 62,
                mrrCents: 170680,
              },
            ],
            lastSnapshotDate: "2026-07-30",
            staleDays: 0,
            // `gaps` e `truncated` ausentes de propósito.
          },
        });
      }
      if (r.startsWith("/signup-history")) {
        return Promise.resolve({
          data: {
            window: "30",
            points: [{ date: "2026-07-30", count: 10, partial: false }],
            // `firstSignupDate` ausente.
          },
        });
      }
      if (r.startsWith("/paid-funnel")) {
        return Promise.resolve({
          data: {
            steps: [
              {
                id: "visitantes",
                label: "Visitantes únicos",
                people: 100,
                fonte: "posthog",
                conversionFromPrev: null,
                lostFromPrev: null,
                smallSample: false,
              },
            ],
            posthog: { state: "ok" },
            // `janela`, `boletosPendentes` e `retornos` ausentes.
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(<Admin />);

    await waitFor(() =>
      expect(screen.getByText(/Onde as pessoas param\?/i)).toBeTruthy(),
    );
    // O gráfico desenhou com o ponto que veio, sem estourar no campo ausente.
    expect(await screen.findByTestId("grafico-assinaturas")).toBeTruthy();
    expect(await screen.findByTestId("funil-digerido")).toBeTruthy();
  });
});
