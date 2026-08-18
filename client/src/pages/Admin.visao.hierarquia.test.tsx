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
 *
 * A rodada seguinte acrescentou aqui os outros dois contratos da MESMA grade,
 * porque compartilham o payload e as duas linhas: o ALINHAMENTO dos cards (por
 * classe, ver o bloco proprio) e a troca do card de "Novos usuarios" pelo de
 * presenca, cuja fonte e independente do /overview.
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

/** Serie de cadastros com pontos MEDIDOS: o sparkline exige dois ou mais. */
const SERIES_COM_CADASTROS = {
  series: [
    {
      chave: "cadastros",
      rotulo: "Cadastros por dia",
      tipo: "fluxo",
      direcao: "up_bom",
      pontos: [
        { date: "2026-08-12", value: 4, partial: false },
        { date: "2026-08-13", value: 9, partial: false },
        { date: "2026-08-14", value: 7, partial: false },
      ],
      total: 20,
    },
  ],
  funil: {
    passos: [],
    destaque: null,
    anterior: null,
    motivoSemDelta: "",
  },
  ferramentas: [],
  windowLabel: "16 jul a 14 ago",
  tz: "America/Sao_Paulo",
};

const ONLINE_NOW_OK = {
  state: "ok",
  atividade: { online: 12, hojePessoas: 340 },
};

/**
 * Mock base: so /overview e /online-now sao interessantes aqui, e as demais
 * rotas devolvem o SHAPE REAL vazio para nenhum outro bloco estourar e roubar a
 * falha.
 */
function mockDeRotas(
  overview: () => Promise<unknown>,
  onlineNow: () => Promise<unknown> = () =>
    Promise.resolve({ data: ONLINE_NOW_OK }),
) {
  fetchMock.mockImplementation((rota: unknown) => {
    const r = String(rota);
    if (r.startsWith("/overview?")) return overview();
    if (r.startsWith("/overview-series")) {
      return Promise.resolve({ data: SERIES_COM_CADASTROS });
    }
    if (r.startsWith("/online-now")) return onlineNow();
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
    // SEIS, nao sete: o card de presenca NAO se degrada junto com o /overview,
    // porque nao vem dele. Aqui o /online-now respondeu, e o card mostra o
    // numero. E o controle de que a independencia das duas fontes e real.
    expect(screen.getAllByText("indisponível").length).toBe(6);
    expect(screen.getByText("12")).toBeTruthy();
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

/**
 * ALINHAMENTO dos cards.
 *
 * O jsdom NAO faz layout: `getBoundingClientRect` devolve zeros, entao nao ha
 * como perguntar "os icones estao na mesma altura?" aqui. O que este bloco trava
 * e a REGRA que produz o alinhamento, nas classes, no mesmo espirito do teste de
 * overflow do kanban. A altura de verdade se confere no navegador, e e por isso
 * que a frente tem rodada de OK visual.
 *
 * A regra: wrapper com `flex h-full flex-col` (substitui a centralizacao que o
 * navegador aplica ao conteudo de um `<button>` mais alto que ele) e rodape com
 * `mt-auto` (ancora sparkline e Δ na base). O controle negativo importa tanto
 * quanto: card sem sparkline e sem Δ nao pode ganhar um rodape vazio.
 */
function wrappersDeCard(): HTMLElement[] {
  return [
    ...Array.from(screen.getByTestId("cards-principais").children),
    ...Array.from(screen.getByTestId("cards-secundarios").children),
  ] as HTMLElement[];
}

describe("alinhamento dos cards da Visao", () => {
  it("todo card e uma coluna flex de altura cheia", async () => {
    mockDeRotas(() => Promise.resolve({ data: OVERVIEW_CHEIO }));
    render(<Admin />);
    await waitFor(() =>
      expect(screen.getByTestId("cards-principais")).toBeTruthy(),
    );

    const wrappers = wrappersDeCard();
    // Os SETE, nao "algum": a regra so alinha se valer para a linha inteira.
    expect(wrappers).toHaveLength(7);
    for (const card of wrappers) {
      const classes = card.className.split(/\s+/);
      expect(classes, `card sem h-full: ${card.textContent}`).toContain(
        "h-full",
      );
      expect(classes, `card sem flex: ${card.textContent}`).toContain("flex");
      expect(classes, `card sem flex-col: ${card.textContent}`).toContain(
        "flex-col",
      );
    }
  });

  it("card COM sparkline ancora o rodape na base", async () => {
    mockDeRotas(() => Promise.resolve({ data: OVERVIEW_CHEIO }));
    render(<Admin />);
    const spark = await screen.findByTestId("sparkline-cadastros");

    const rodape = spark.parentElement;
    expect(rodape).toBeTruthy();
    expect(rodape?.className.split(/\s+/)).toContain("mt-auto");
  });

  it("card SEM sparkline e SEM variacao nao ganha rodape vazio", async () => {
    // CONTROLE NEGATIVO. Sem ele, "todo card tem um `mt-auto`" seria uma regra
    // que passa criando uma div vazia em cada card, o que nao alinha nada e
    // ainda acrescenta um no de layout sem conteudo.
    mockDeRotas(() => Promise.resolve({ data: OVERVIEW_CHEIO }));
    render(<Admin />);
    await waitFor(() =>
      expect(screen.getByTestId("cards-principais")).toBeTruthy(),
    );

    const semRodape = wrappersDeCard().filter((card) =>
      /Assinantes Pro|Receita em risco/.test(card.textContent || ""),
    );
    expect(semRodape).toHaveLength(2);
    for (const card of semRodape) {
      expect(
        card.querySelector(".mt-auto"),
        `rodape vazio criado em: ${card.textContent}`,
      ).toBeNull();
    }
  });
});

describe("presenca e cadastros na linha secundaria", () => {
  it('"Novos usuarios" saiu e "Atividade agora" ocupou o slot', async () => {
    mockDeRotas(() => Promise.resolve({ data: OVERVIEW_CHEIO }));
    render(<Admin />);
    await waitFor(() =>
      expect(screen.getByTestId("cards-secundarios")).toBeTruthy(),
    );

    const secundarios = rotulosDaLinha("cards-secundarios");
    expect(secundarios).toHaveLength(4);
    const atividade = secundarios.find((t) => t.includes("Atividade agora"));
    expect(atividade).toBeTruthy();
    expect(atividade).toContain("12");
    expect(atividade).toContain("340 pessoas ativas hoje");
    // O SEGUNDO SENTIDO: o card antigo nao pode ter sobrado em lugar nenhum.
    expect(screen.queryByText(/Novos usuários/i)).toBeNull();
  });

  it('"Usuarios totais" absorveu a linha de cadastros e a serie', async () => {
    mockDeRotas(() => Promise.resolve({ data: OVERVIEW_CHEIO }));
    render(<Admin />);
    await waitFor(() =>
      expect(screen.getByTestId("cards-principais")).toBeTruthy(),
    );

    const total = rotulosDaLinha("cards-principais").find((t) =>
      t.includes("Usuários totais"),
    );
    expect(total).toBeTruthy();
    // O HEADLINE nao se moveu: continua o total sem recorte de periodo.
    expect(total).toContain("5.456");
    expect(total).toContain("Desde o início, sem recorte de período");
    // A secundaria DECLARA a janela no proprio texto, porque so ela a obedece.
    expect(total).toContain("182 cadastros de 16 jul a 14 ago");
    // Variacao como TEXTO da secundaria, nunca como badge do card: um Δ neste
    // card seria lido como variacao do TOTAL, que nao tem periodo anterior.
    expect(total).toContain("+21,3% vs. período anterior");
    expect(screen.queryByTestId("card-variacao-Usuários totais")).toBeNull();
    expect(await screen.findByTestId("sparkline-cadastros")).toBeTruthy();
  });

  it("com /online-now fora, o card diz indisponivel e NUNCA zero", async () => {
    // CONTROLE NEGATIVO da regra que mais importa neste card: "0 online" e
    // indistinguivel de "PostHog fora do ar", e as duas leituras levam a acoes
    // diferentes. A grade continua 3 + 4: o slot existe mesmo sem a fonte.
    mockDeRotas(
      () => Promise.resolve({ data: OVERVIEW_CHEIO }),
      () => Promise.reject(new Error("posthog fora")),
    );
    render(<Admin />);
    await waitFor(() =>
      expect(screen.getByTestId("cards-secundarios")).toBeTruthy(),
    );

    const atividade = await waitFor(() => {
      const achado = rotulosDaLinha("cards-secundarios").find((t) =>
        t.includes("Atividade agora"),
      );
      expect(achado).toContain("indisponível");
      return achado as string;
    });
    expect(atividade).toContain("PostHog indisponível");
    expect(atividade).not.toMatch(/(^|[^0-9])0([^0-9]|$)/);
    expect(rotulosDaLinha("cards-principais")).toHaveLength(3);
    expect(rotulosDaLinha("cards-secundarios")).toHaveLength(4);
  });

  it("PostHog sem env vira `nao configurado`, que nao e a mesma coisa que fora do ar", async () => {
    mockDeRotas(
      () => Promise.resolve({ data: OVERVIEW_CHEIO }),
      () =>
        Promise.resolve({
          data: { state: "not_configured", missing: ["POSTHOG_API_KEY"] },
        }),
    );
    render(<Admin />);
    await waitFor(() =>
      expect(screen.getByTestId("cards-secundarios")).toBeTruthy(),
    );

    await waitFor(() => {
      const atividade = rotulosDaLinha("cards-secundarios").find((t) =>
        t.includes("Atividade agora"),
      );
      expect(atividade).toContain("PostHog não configurado");
    });
  });
});
