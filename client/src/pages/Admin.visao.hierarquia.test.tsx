import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

/**
 * HIERARQUIA 3 + 4 dos cards da Visao.
 *
 * O teste nasce de uma quebra real: a rodada 8 (D19) renomeou o card "Acesso
 * Pro" para "Assinantes Pro" nos dois pontos que definem o label, e a lista
 * `PRINCIPAIS` casava por ROTULO VISIVEL. Ela deixou de achar o card, ele caiu
 * para a linha de detalhe e a tela virou 2+5. Nada acusou: a Visao continuou
 * renderizando sete cards, so que na hierarquia errada.
 *
 * A correcao foi trocar o criterio de casamento por uma `key` estavel, e este
 * arquivo trava as tres coisas que a mudanca precisa manter verdadeiras:
 *
 *   1. com payload cheio, a tela e 3 + 4, e o card de pagantes esta em cima;
 *   2. com payload degradado, ela CONTINUA 3 + 4, e nao aparece card de outro
 *      assunto (o slot 4 da base descrevia "Chamadas de IA" enquanto o card
 *      carregado dizia "Receita no periodo");
 *   3. `PRINCIPAIS` referencia chaves que EXISTEM na base. A versao anterior
 *      falhava exatamente por referenciar um rotulo que ninguem mais emitia, e
 *      um teste de tela sozinho nao diz QUAL das tres o quebrou.
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

// O ResponsiveContainer do Recharts observa o tamanho do pai, e o jsdom nao tem
// ResizeObserver. Sem o stub os graficos deixam erros nao tratados no relatorio
// da suite, que viram ruido capaz de esconder falha de verdade depois.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver =
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ??
  ResizeObserverStub;

import Admin, { PRINCIPAIS, metricCards } from "./Admin";

/** Payload COMPLETO de /overview, no shape real de `OverviewData`. */
const OVERVIEW_CHEIO = {
  window: "30",
  windowStartIso: "2026-07-16T03:00:00.000Z",
  windowEndIso: "2026-08-15T02:59:59.999Z",
  windowFirstDay: "2026-07-16",
  windowLastDay: "2026-08-14",
  windowLabel: "16 jul a 14 ago",
  previousLabel: "16 jun a 15 jul",
  tz: "America/Sao_Paulo",
  cards: {
    usuariosTotais: { value: 5456 },
    novosUsuarios: {
      value: 182,
      historicoDesde: "2026-01-10",
      change: {
        disponivel: true,
        atual: 182,
        anterior: 150,
        delta: 32,
        percent: 21.3,
      },
    },
    acessoPro: {
      bySubscription: 99,
      byInfluencer: 28,
      both: 3,
      total: 124,
    },
    mrr: {
      value: 170680,
      activeCount: 62,
      trialingCount: 2,
      arpuCents: 2753,
    },
    receita: {
      value: 254900,
      reembolsosCents: 4900,
      taxasCents: 9800,
      liquidaCents: 240200,
      historicoDesde: "2026-01-10",
      change: {
        disponivel: true,
        atual: 254900,
        anterior: 210000,
        delta: 44900,
        percent: 21.4,
      },
    },
    receitaEmRisco: {
      count: 5,
      mrrCents: 59670,
      saindo: { count: 3, mrrCents: 35000 },
      emAtraso: { count: 2, mrrCents: 24670 },
      percentOfMrr: 34.9,
    },
    custoIa: {
      valueUsd: 2.41,
      valueBrl: 2.41,
      chamadasSemCustoMedido: 233,
      valorEmBrl: null,
      cotacaoUsdBrl: null,
    },
  },
};

/**
 * Mock base: so /overview e interessante aqui, e as demais rotas devolvem o
 * SHAPE REAL vazio para nenhum outro bloco estourar e roubar a falha.
 */
function mockDeRotas(overview: () => Promise<unknown>) {
  fetchMock.mockImplementation((rota: unknown) => {
    const r = String(rota);
    if (r.startsWith("/overview?")) return overview();
    if (r.startsWith("/health-band")) {
      return Promise.resolve({ data: { ok: true, problemas: [] } });
    }
    return Promise.resolve({ data: {} });
  });
}

/** Rotulos dos cards de uma das duas linhas, na ordem da tela. */
function rotulosDaLinha(testId: string): string[] {
  const grade = screen.getByTestId(testId);
  return Array.from(grade.children).map((filho) =>
    (filho.textContent || "").trim(),
  );
}

beforeEach(() => {
  window.history.replaceState({}, "", "/admin");
  fetchMock.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("hierarquia 3 + 4 dos cards da Visao", () => {
  it("com payload cheio a tela e 3 grandes + 4 compactos, com os pagantes em cima", async () => {
    mockDeRotas(() => Promise.resolve({ data: OVERVIEW_CHEIO }));
    render(<Admin />);

    await waitFor(() =>
      expect(screen.getByTestId("cards-principais")).toBeTruthy(),
    );

    const principais = rotulosDaLinha("cards-principais");
    expect(principais).toHaveLength(3);
    expect(rotulosDaLinha("cards-secundarios")).toHaveLength(4);

    // O card de D19 esta na PRIMEIRA linha. Antes da correcao ele existia na
    // tela (por isso "sete cards" continuava verdadeiro), so que na segunda.
    expect(principais.some((t) => t.includes("Assinantes Pro"))).toBe(true);
    // Os outros dois principais, para "3 cards" nao ser compativel com "tres
    // cards quaisquer".
    expect(principais.some((t) => t.includes("Usuários totais"))).toBe(true);
    expect(principais.some((t) => t.includes("Receita no período"))).toBe(true);
  });

  it("payload sem `cards` mantem 3 + 4 e nao inventa um card de outro assunto", async () => {
    // CONTROLE NEGATIVO. O gatilho e o payload 200 SEM `cards` (o caminho de
    // degradacao que de fato desenha os cards da base), e nao a rejeicao do
    // /overview: com rejeicao a Visao troca o bloco inteiro pelo ErrorBlock e
    // nao ha card nenhum para contar. Ver o comentario do arquivo de teste
    // `Admin.visao.test.tsx`, que exercita o mesmo caminho.
    mockDeRotas(() => Promise.resolve({ data: {} }));
    render(<Admin />);

    await waitFor(() =>
      expect(screen.getByTestId("cards-principais")).toBeTruthy(),
    );

    expect(rotulosDaLinha("cards-principais")).toHaveLength(3);
    expect(rotulosDaLinha("cards-secundarios")).toHaveLength(4);
    // Ausencia e estado NOMEADO, e o fallback nao pode trocar o assunto do
    // card: "Chamadas de IA" era o label que o slot de "Receita no periodo"
    // carregava na base, e so aparecia neste caminho.
    expect(screen.queryByText(/Chamadas de IA/i)).toBeNull();
    expect(screen.queryByText(/Registros em ai_usage_logs/i)).toBeNull();
    expect(screen.getAllByText("indisponível").length).toBe(7);
  });

  it("o conjunto de rotulos e o MESMO nos dois caminhos", async () => {
    // A divergencia entre a base e o card carregado e a causa raiz, nao um
    // sintoma: enquanto os dois puderem discordar, o proximo rename recria o
    // card fantasma. Aqui o veredito e sobre o CONJUNTO INTEIRO, nao sobre o
    // rotulo que ja sabemos ter quebrado.
    mockDeRotas(() => Promise.resolve({ data: OVERVIEW_CHEIO }));
    render(<Admin />);
    await waitFor(() =>
      expect(screen.getByTestId("cards-principais")).toBeTruthy(),
    );
    const carregado = metricCards.map((c) => c.label).filter(Boolean);
    for (const rotulo of carregado) {
      expect(
        screen.queryByText(rotulo),
        `"${rotulo}" existe na base e sumiu da tela carregada`,
      ).toBeTruthy();
    }
  });

  it("PRINCIPAIS so cita chaves que existem na base", () => {
    // CONTROLE DA REGRA, e o unico que aponta a causa direto. A quebra da
    // rodada 8 foi exatamente esta: a lista citava um identificador que a base
    // nao emitia mais, e `find` devolvia `undefined` em silencio.
    const chavesDaBase = metricCards.map((c) => c.key);
    for (const chave of PRINCIPAIS) {
      expect(
        chavesDaBase,
        `PRINCIPAIS cita "${chave}", que nao existe em metricCards`,
      ).toContain(chave);
    }
    // Nos DOIS sentidos: a lista tem que ter tamanho 3, senao "3 + 4" vira
    // outra coisa sem ninguem decidir.
    expect(PRINCIPAIS).toHaveLength(3);
    expect(new Set(PRINCIPAIS).size).toBe(3);
    // E a base inteira: sete cards, chaves unicas. Um card novo sem chave
    // propria seria dois cards com a mesma identidade.
    expect(metricCards).toHaveLength(7);
    expect(new Set(chavesDaBase).size).toBe(7);
  });
});
