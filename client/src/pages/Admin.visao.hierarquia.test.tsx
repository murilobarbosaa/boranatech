import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import financeFixture from "../../../docs/investigacoes/2026-09-14-adm-004-p1-1-exemplo-sintetico.json";

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/adminApi", () => ({
  adminFetch: (...args: unknown[]) => fetchMock(...args),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    loading: false,
    signOut: vi.fn(),
    user: { id: "admin-fixture", email: "admin@exemplo.com" },
  }),
}));
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: async () => ({
        data: {
          session: {
            access_token: `x.${btoa('{"admin_role":"owner"}')}.y`,
          },
        },
      }),
    },
  },
}));
vi.mock("@/lib/api", () => ({ apiUrl: (path: string) => path }));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver =
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ??
  ResizeObserverStub;

import { clearHonestFinanceClientCacheForTests } from "@/components/admin/useHonestFinance";
import Admin from "./Admin";

const overview = {
  window: "30",
  windowStartIso: "2026-08-15T03:00:00.000Z",
  windowEndIso: "2026-09-14T12:00:00.000Z",
  windowFirstDay: "2026-08-16",
  windowLastDay: "2026-09-14",
  windowLabel: "16 ago a 14 set",
  previousLabel: "17 jul a 15 ago",
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
      byAfiliado: 0,
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
      change: { disponivel: false, atual: 254900, motivo: "sem_dados" },
    },
    receitaEmRisco: { count: 0, mrrCents: 0, percentOfMrr: null },
    custoIa: {
      valueUsd: 2.41,
      valueBrl: 2.41,
      chamadasSemCustoMedido: 233,
      valorEmBrl: null,
      cotacaoUsdBrl: null,
    },
  },
};

const series = {
  contractVersion: 3,
  series: [],
  pagamentos: {
    series: [
      {
        chave: "primeiroPagamentoObservado",
        rotulo: "Primeiro pagamento observado",
        pontos: [{ date: "2026-09-13", value: 8, partial: false }],
        total: 8,
      },
    ],
    pagamentosUtilizaveisNoPeriodo: 8,
    pessoasIdentificadas: 8,
    semPessoaNoPeriodo: 0,
    ordemHistoricaIncertaNoPeriodo: 0,
    identidadesConflitantesNoHistorico: 0,
    identidadesConflitantesComDataCandidataNoPeriodo: 0,
    porMeio: [],
    porProvider: [],
    cobertura: {
      calculadoAte: "2026-09-14T12:00:00Z",
      consultaIniciadaEm: "2026-09-14T12:00:01Z",
      consultaConcluidaEm: "2026-09-14T12:00:02Z",
      leituraLocal: "paginacao_verificada_sem_snapshot",
      consistenciaFotografia: "nao_garantida",
      historicoIntegral: "nao_verificavel",
      pagamentosSemUsuario: 0,
      pagamentosSemMeio: 0,
      excluidos: { identidadeAusente: 0, dataInvalida: 0 },
    },
    ressalvaHistorica: "Histórico integral não verificável.",
  },
  funil: {
    passos: [],
    destaque: null,
    anterior: null,
    motivoSemDelta: "janelas_de_observacao_nao_equivalentes",
    limiteTemporalDosInicios: "2026-09-14T12:00:00Z",
    consultaIniciadaEm: "2026-09-14T12:00:01Z",
    consultaConcluidaEm: "2026-09-14T12:00:02Z",
    semanticaUso: "inicio_apos_pagamento_status_success_na_consulta",
    cadastrosComMenosDe7Dias: 0,
  },
  ferramentas: [],
  windowLabel: "16 ago a 14 set",
  tz: "America/Sao_Paulo",
};

function installRoutes(finance: unknown = financeFixture) {
  fetchMock.mockImplementation((path: unknown) => {
    const route = String(path);
    if (route.startsWith("/overview?"))
      return Promise.resolve({ data: overview });
    if (route.startsWith("/overview-series"))
      return Promise.resolve({ data: series });
    if (route.startsWith("/finance/summary"))
      return Promise.resolve({ data: finance });
    if (route.startsWith("/finance/transactions"))
      return Promise.resolve({ data: { rows: [], total: 0 } });
    if (route.startsWith("/online-now")) {
      return Promise.resolve({
        data: { state: "ok", atividade: { online: 12, hojePessoas: 340 } },
      });
    }
    if (route.startsWith("/health-band"))
      return Promise.resolve({ data: { ok: true, problemas: [] } });
    return Promise.resolve({ data: {} });
  });
}

beforeEach(() => {
  window.history.replaceState({}, "", "/admin?window=30");
  clearHonestFinanceClientCacheForTests();
  fetchMock.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Visão antiga com caixa financeiro honesto", () => {
  it("preserva a hierarquia 3+4 e troca somente o slot financeiro", async () => {
    installRoutes();
    render(<Admin />);

    const principais = await screen.findByTestId("cards-principais");
    const secundarios = screen.getByTestId("cards-secundarios");
    expect(principais.children).toHaveLength(3);
    expect(secundarios.children).toHaveLength(4);
    expect(principais.textContent).toContain("Usuários totais");
    expect(principais.textContent).toContain("Assinantes Pro");
    expect(screen.getByText("Caixa líquido registrado")).toBeTruthy();
    expect(secundarios.textContent).toContain("Atividade agora");
    expect(secundarios.textContent).toContain("Valor mensal de catálogo");
    expect(secundarios.textContent).toContain("Acessos em atenção");
    expect(secundarios.textContent).toContain("Custo de IA");
    expect(screen.queryByTestId("executive-kpis")).toBeNull();
    expect(screen.queryByText("Aquisição e receita")).toBeNull();
    expect(screen.queryByText("Produto e engajamento")).toBeNull();

    const caixa = screen.getByTestId("overview-finance-card");
    await waitFor(() => expect(caixa.textContent).toContain("entradas"));
    expect(caixa.textContent).toContain("R$");
    expect(caixa.textContent).toContain("reembolsos");
    expect(caixa.textContent).toContain("taxas");
    expect(caixa.textContent).toContain("Cobertura parcial");
    expect(caixa.textContent).toContain(
      "01/09/2026 a 01/09/2026 · America/Sao_Paulo",
    );
    expect(screen.getByRole("button", { name: "Ver financeiro" })).toBeTruthy();
  });

  it("expõe todas as seções diretamente e não renderiza Mais", async () => {
    installRoutes();
    render(<Admin />);

    await screen.findByText("Caixa líquido registrado");
    const nav = screen
      .getAllByRole("navigation")
      .find((item) => item.className.includes("lg:flex"))!;
    expect(nav.className).toContain("flex-nowrap");
    expect(nav.className).toContain("overflow-x-auto");
    for (const label of [
      "Visão",
      "Conversão",
      "Páginas",
      "Conteúdo",
      "Vagas",
      "Usuários",
      "Creators",
      "Retenção",
      "Financeiro",
      "Afiliados",
      "Emails",
      "Notificações",
      "IA",
      "Tarefas",
    ]) {
      expect(
        screen
          .getAllByRole("button", { name: label })
          .some((button) => nav.contains(button)),
      ).toBe(true);
    }
    expect(screen.queryByRole("button", { name: /mais seções/i })).toBeNull();
    expect(screen.queryByText("Mais")).toBeNull();
  });

  it("identifica diretamente uma seção antes escondida em Mais", async () => {
    window.history.replaceState({}, "", "/admin?section=tarefas&window=30");
    installRoutes();
    render(<Admin />);
    const tarefas = await screen.findAllByRole("button", { name: "Tarefas" });
    expect(
      tarefas.every((button) => button.className.includes("nav-pill-active")),
    ).toBe(true);
  });

  it("restaura o hero anterior só na Visão e mantém Financeiro compacto", async () => {
    installRoutes();
    render(<Admin />);
    expect(
      await screen.findByRole("heading", {
        name: "Centro de comando do BORA NA TECH?",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Dados separados por seção")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Financeiro" })[0]);
    expect(
      await screen.findByRole("heading", { name: "Centro de comando" }),
    ).toBeTruthy();
    expect(screen.queryByText("Dados separados por seção")).toBeNull();
    expect(screen.getByRole("tab", { name: "Resumo" })).toBeTruthy();
  });

  it("falha financeira fica isolada e não derruba os cards antigos", async () => {
    installRoutes({ contractVersion: 0 });
    render(<Admin />);

    await waitFor(() =>
      expect(screen.getAllByText("Indisponível").length).toBeGreaterThan(0),
    );
    expect(screen.getByText("Usuários totais")).toBeTruthy();
    expect(screen.getByText("Assinantes Pro")).toBeTruthy();
    expect(screen.getByText("Custo de IA")).toBeTruthy();
    expect(screen.queryByText("R$ 0,00")).toBeNull();
  });

  it("não soma moedas e avisa quando há movimentos fora de BRL", async () => {
    const mixed = structuredClone(financeFixture);
    const usd = structuredClone(mixed.cash.currencies[0]);
    usd.currency = "USD";
    usd.positiveEntries.currency = "USD";
    usd.refunds.currency = "USD";
    usd.fees.currency = "USD";
    usd.calculableNet.currency = "USD";
    mixed.cash.currencies.push(usd);
    installRoutes(mixed);
    render(<Admin />);

    expect(
      await screen.findByText("Há movimentos em outras moedas."),
    ).toBeTruthy();
    expect(
      screen.getByText("Caixa líquido registrado").closest("article")
        ?.textContent,
    ).not.toContain("US$");
  });

  it("não inventa zero quando BRL não está presente", async () => {
    const usdOnly = structuredClone(financeFixture);
    for (const metric of [
      usdOnly.cash.currencies[0].positiveEntries,
      usdOnly.cash.currencies[0].refunds,
      usdOnly.cash.currencies[0].fees,
      usdOnly.cash.currencies[0].calculableNet,
    ]) {
      metric.currency = "USD";
    }
    usdOnly.cash.currencies[0].currency = "USD";
    installRoutes(usdOnly);
    render(<Admin />);

    const title = await screen.findByText("Caixa líquido registrado");
    const cashCard = title.closest("article");
    await waitFor(() =>
      expect(cashCard?.textContent).toContain("Indisponível"),
    );
    expect(cashCard?.textContent).toContain("Há movimentos em outras moedas");
    expect(cashCard?.textContent).not.toContain("R$ 0,00");
  });

  it("distingue zero BRL legítimo de subtotal ausente", async () => {
    const zeroBrl = structuredClone(financeFixture);
    const bucket = zeroBrl.cash.currencies[0];
    bucket.positiveEntries.valueCents = 0;
    bucket.refunds.valueCents = 0;
    bucket.fees.valueCents = 0;
    bucket.calculableNet.valueCents = 0;
    bucket.series[0].positiveEntriesCents = 0;
    bucket.series[0].refundsCents = 0;
    bucket.series[0].feesCents = 0;
    bucket.series[0].calculableNetCents = 0;
    installRoutes(zeroBrl);
    render(<Admin />);

    const title = await screen.findByText("Caixa líquido registrado");
    const cashCard = title.closest("article");
    await waitFor(() => expect(cashCard?.textContent).toContain("R$ 0,00"));
    expect(cashCard?.textContent).not.toContain("Nenhum subtotal BRL");
  });

  it("reutiliza a leitura financeira válida ao abrir os detalhes", async () => {
    installRoutes();
    render(<Admin />);
    await screen.findByText("Caixa líquido registrado");
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([path]) =>
          String(path).startsWith(
            "/finance/summary?contract=honest-v1&preset=30d",
          ),
        ),
      ).toHaveLength(1),
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver financeiro" }));
    await screen.findByRole("tab", { name: "Resumo" });
    expect(
      fetchMock.mock.calls.filter(([path]) =>
        String(path).startsWith(
          "/finance/summary?contract=honest-v1&preset=30d",
        ),
      ),
    ).toHaveLength(1);
  });
});
