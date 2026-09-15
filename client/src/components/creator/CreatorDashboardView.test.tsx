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
 * CreatorDashboardView: o painel desenhado a partir do payload, sem busca.
 *
 * O payload e o do teste do montador no servidor
 * (server/lib/creatorDashboard.test.ts): dois codigos, 140 cliques, 3 vendas,
 * R$ 62,79, conversao 2,14%. Todo valor esperado e LITERAL escrito a mao.
 *
 * O relogio e fixo em 2026-09-20 12:00 de Brasilia (15:00 UTC), o mesmo AGORA
 * do teste do servidor, porque a regra do delta e o "desde hoje" dependem do dia
 * civil corrente. Só o `Date` e falsificado: os timers de verdade continuam, e
 * o "Copiado" de 2s nao depende deles para ser afirmado.
 */

// jsdom nao implementa ResizeObserver e o ResponsiveContainer do recharts o
// chama no mount (mesmo stub do ActiveUsersChart.test.tsx).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

// Reporter dublado como no BlocoBoundary.test.tsx: a chegada ao Sentry do
// bloco quebrado e afirmada, nao inferida da tela de erro.
const capturado = vi.hoisted(() => ({ escopos: [] as unknown[] }));
vi.mock("@sentry/react", () => ({
  captureException: (
    _erro: unknown,
    ctx?: { tags?: Record<string, unknown> },
  ) => {
    capturado.escopos.push(ctx?.tags?.escopo);
    return "evt_1234567890";
  },
}));

vi.mock("@/components/UserAvatar", () => ({
  default: () => <span data-testid="avatar" />,
}));

import type { CreatorDashboard } from "@shared/creatorDashboard";
import {
  CreatorDashboardView,
  deltaPermitido,
  serieParaGrafico,
} from "./CreatorDashboardView";

const ZERO = {
  clicks: 0,
  checkouts: 0,
  sales: 0,
  revenue_cents: 0,
  commission_cents: 0,
};

function painelBase(): CreatorDashboard {
  return {
    creator: {
      kind: "afiliado",
      granted_at: "2026-09-01T12:00:00Z",
      revoked_at: null,
    },
    perfil: { name: "Ana Creator", handle: "anacreator", avatar_url: null },
    janela: "7d",
    totais: {
      clicks: 140,
      sales: 3,
      revenue_cents: 6279,
      commission_due_cents: 1884,
      commission_paid_cents: 0,
      conversao_pct: 2.14,
    },
    codigos: [
      {
        id: "a1",
        code: "ANA30",
        status: "active",
        discount_percent: 10,
        commission_percent: 30,
        link: "https://boranatech.com.br/planos?ref=ANA30",
        clicks: 100,
        sales: 3,
        revenue_cents: 6279,
        commission_due_cents: 1884,
        commission_paid_cents: 0,
        created_at: "2026-09-01T12:00:00Z",
      },
      {
        id: "b1",
        code: "ANAYT",
        status: "paused",
        discount_percent: 10,
        commission_percent: 20,
        link: "https://boranatech.com.br/planos?ref=ANAYT",
        clicks: 40,
        sales: 0,
        revenue_cents: 0,
        commission_due_cents: 0,
        commission_paid_cents: 0,
        created_at: "2026-09-02T12:00:00Z",
      },
    ],
    eventos: {
      clicks_since: "2026-09-10T12:00:00Z",
      sales_since: "2026-09-15T18:00:00Z",
      events_since: "2026-09-10T12:00:00Z",
      serie: [
        { dia: "2026-09-14", ...ZERO },
        {
          dia: "2026-09-15",
          clicks: 5,
          checkouts: 0,
          sales: 1,
          revenue_cents: 2093,
          commission_cents: 628,
        },
        { dia: "2026-09-16", ...ZERO },
        { dia: "2026-09-17", ...ZERO, clicks: 2 },
        { dia: "2026-09-18", ...ZERO },
        { dia: "2026-09-19", ...ZERO },
        { dia: "2026-09-20", ...ZERO },
      ],
      periodo: {
        clicks: 7,
        checkouts: 0,
        sales: 1,
        revenue_cents: 2093,
        commission_cents: 628,
      },
      periodo_anterior: { ...ZERO, clicks: 4 },
      ultimo_click_at: "2026-09-18T01:30:00Z",
      ultima_venda_at: "2026-09-15T18:00:00Z",
    },
  };
}

function painelAdmin(): CreatorDashboard {
  const p = painelBase();
  p.creator.revoked_at = "2026-09-19T12:00:00Z";
  p.creator.granted_by = "admin-1";
  p.perfil.email = "ana@exemplo.com";
  p.codigos[0].notes = "contrato assinado";
  p.codigos[1].notes = null;
  return p;
}

const onJanelaChange = vi.fn();

function desenhar(
  painel: CreatorDashboard,
  visao: "creator" | "admin" = "creator",
) {
  render(
    <CreatorDashboardView
      painel={painel}
      janela="7d"
      onJanelaChange={onJanelaChange}
      visao={visao}
    />,
  );
}

function valorDoTile(testId: string): string | null {
  return screen.getByTestId(`${testId}-valor`).textContent;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-20T15:00:00Z"));
  onJanelaChange.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CreatorDashboardView: totais", () => {
  it("os seis tiles mostram os contadores do payload", () => {
    desenhar(painelBase());
    expect(valorDoTile("creator-tile-cliques")).toBe("140");
    expect(valorDoTile("creator-tile-vendas")).toBe("3");
    expect(valorDoTile("creator-tile-conversao")).toBe("2,14%");
    expect(valorDoTile("creator-tile-receita")).toBe("R$\u00a062,79");
    expect(valorDoTile("creator-tile-a-receber")).toBe("R$\u00a018,84");
    expect(valorDoTile("creator-tile-paga")).toBe("R$\u00a00,00");
  });

  it("conversao null mostra um traco e 'sem cliques ainda', nunca 0%", () => {
    const p = painelBase();
    p.totais = { ...p.totais, clicks: 0, sales: 0, conversao_pct: null };
    desenhar(p);
    expect(valorDoTile("creator-tile-conversao")).toBe("-");
    expect(screen.getByTestId("creator-tile-conversao").textContent).toContain(
      "sem cliques ainda",
    );
  });

  it("cabecalho: kind rotulado e data de concessao em dia de Brasilia", () => {
    desenhar(painelBase());
    expect(screen.getByTestId("creator-kind").textContent).toBe("Afiliado");
    expect(screen.getByText("Creator desde 01/09/2026")).toBeTruthy();
    expect(screen.getByText("@anacreator")).toBeTruthy();
  });
});

describe("CreatorDashboardView: links", () => {
  it("copiar chama o clipboard com o link exato e mostra Copiado", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    desenhar(painelBase());
    const cartao = screen.getByTestId("creator-codigo-ANA30");
    fireEvent.click(within(cartao).getByRole("button", { name: "Copiar" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "https://boranatech.com.br/planos?ref=ANA30",
      ),
    );
    await within(cartao).findByRole("button", { name: "Copiado" });
  });

  it("codigo pausado ganha o selo; desconto e comissao do proprio codigo", () => {
    desenhar(painelBase());
    const pausado = screen.getByTestId("creator-codigo-ANAYT");
    expect(pausado.textContent).toContain("Pausado");
    expect(pausado.textContent).toContain("Comissão de 20%");
    const ativo = screen.getByTestId("creator-codigo-ANA30");
    expect(ativo.textContent).not.toContain("Pausado");
    expect(ativo.textContent).toContain("10% de desconto para quem usar");
    expect(ativo.textContent).toContain("Comissão de 30%");
  });
});

describe("CreatorDashboardView: serie e delta", () => {
  it("serie com eventos: grafico, data de inicio e ultimo clique relativo", () => {
    desenhar(painelBase());
    expect(screen.getByTestId("creator-grafico")).toBeTruthy();
    // Um selo por marco desde o lote 06b: cliques e vendas valem desde datas
    // diferentes.
    expect(screen.getByTestId("creator-cliques-desde").textContent).toBe(
      "Cliques desde 10/09/2026",
    );
    expect(screen.getByTestId("creator-vendas-desde").textContent).toBe(
      "Vendas desde 15/09/2026",
    );
    // Ultimo clique e ultima venda sao dois selos desde o lote 05, e nao mais
    // uma frase unida por ponto.
    expect(screen.getByTestId("creator-ultimo-clique").textContent).toBe(
      "Último clique: há 3 dias",
    );
    expect(screen.getByTestId("creator-ultima-venda").textContent).toBe(
      "Última venda: há 5 dias",
    );
  });

  it("delta aparece quando os cliques ja eram medidos no inicio do periodo anterior", () => {
    const p = painelBase();
    p.eventos.clicks_since = "2026-09-01T12:00:00Z";
    desenhar(p);
    expect(screen.getByTestId("creator-delta-clicks").textContent).toBe(
      "+75,0% vs período anterior",
    );
  });

  it("sem delta quando os cliques comecaram depois do inicio do periodo anterior", () => {
    const p = painelBase();
    p.eventos.clicks_since = "2026-09-10T12:00:00Z";
    desenhar(p);
    expect(screen.queryByTestId("creator-delta-clicks")).toBeNull();
    expect(screen.getByTestId("creator-periodo").textContent).not.toContain(
      "0%",
    );
  });

  it("regra do delta: inicio do periodo anterior em 7d e 07/09 00h de Brasilia", () => {
    const agora = Date.parse("2026-09-20T15:00:00Z");
    const anterior = { ...ZERO, clicks: 4 };
    expect(deltaPermitido("2026-09-06T12:00:00Z", anterior, "7d", agora)).toBe(
      true,
    );
    expect(
      deltaPermitido("2026-09-07T03:00:00.000Z", anterior, "7d", agora),
    ).toBe(false);
    expect(deltaPermitido("2026-09-10T12:00:00Z", anterior, "7d", agora)).toBe(
      false,
    );
    expect(deltaPermitido("2026-01-01T12:00:00Z", anterior, "all", agora)).toBe(
      false,
    );
    expect(deltaPermitido("2026-01-01T12:00:00Z", null, "7d", agora)).toBe(
      false,
    );
  });

  it("trocar a janela chama onJanelaChange com o valor da API", () => {
    desenhar(painelBase());
    fireEvent.click(screen.getByRole("button", { name: "90 dias" }));
    expect(onJanelaChange).toHaveBeenCalledWith("90d");
  });
});

describe("CreatorDashboardView: estados sem dado", () => {
  it("sem codigo: aviso, sem tiles e sem grafico", () => {
    const p = painelBase();
    p.codigos = [];
    desenhar(p);
    expect(screen.getByTestId("creator-sem-codigo").textContent).toContain(
      "Seu código de creator ainda não foi vinculado.",
    );
    expect(screen.queryByTestId("creator-tile-cliques")).toBeNull();
    expect(screen.queryByTestId("creator-grafico")).toBeNull();
  });

  it("com codigo e sem evento: tiles normais e a mensagem no lugar do grafico", () => {
    const p = painelBase();
    p.eventos = {
      ...p.eventos,
      clicks_since: null,
      sales_since: null,
      events_since: null,
      serie: [],
      ultimo_click_at: null,
      ultima_venda_at: null,
    };
    desenhar(p);
    expect(screen.getByTestId("creator-sem-eventos").textContent).toBe(
      "Ainda não registramos cliques no seu link.",
    );
    expect(screen.queryByTestId("creator-grafico")).toBeNull();
    expect(valorDoTile("creator-tile-cliques")).toBe("140");
  });
});

describe("CreatorDashboardView: visao admin e visao creator", () => {
  it("visao admin mostra e-mail, notas e a revogacao", () => {
    desenhar(painelAdmin(), "admin");
    expect(screen.getByTestId("creator-email").textContent).toBe(
      "ana@exemplo.com",
    );
    expect(screen.getByTestId("creator-codigo-notas-ANA30").textContent).toBe(
      "contrato assinado",
    );
    expect(screen.getByTestId("creator-revogado").textContent).toBe(
      "Revogado em 19/09/2026",
    );
  });

  it("visao creator nao mostra e-mail, notas nem revogacao, mesmo se vierem", () => {
    desenhar(painelAdmin(), "creator");
    expect(screen.queryByTestId("creator-email")).toBeNull();
    expect(screen.queryByTestId("creator-codigo-notas-ANA30")).toBeNull();
    expect(screen.queryByTestId("creator-revogado")).toBeNull();
  });
});

describe("CreatorDashboardView: contencao por bloco", () => {
  it("a serie quebrada vira cartao de erro e os outros dois blocos continuam", () => {
    // O React registra no console o erro que o boundary capturou; o que se
    // afirma e a tela e o reporte, nao o log.
    vi.spyOn(console, "error").mockImplementation(() => {});
    capturado.escopos.length = 0;
    const p = painelBase();
    // Payload degradado de verdade: a serie some do objeto (backend antigo ou
    // resposta truncada), e o bloco quebra ao ler o tamanho dela.
    const eventosSemSerie: Record<string, unknown> = { ...p.eventos };
    delete eventosSemSerie.serie;
    const quebrado = {
      ...p,
      eventos: eventosSemSerie,
    } as unknown as CreatorDashboard;

    desenhar(quebrado);

    const cartoes = screen.getAllByTestId("bloco-quebrado");
    expect(cartoes).toHaveLength(1);
    expect(cartoes[0].getAttribute("data-bloco")).toBe(
      "Cliques e vendas por dia",
    );
    expect(valorDoTile("creator-tile-cliques")).toBe("140");
    expect(screen.getByTestId("creator-codigo-ANA30")).toBeTruthy();
    expect(screen.getByTestId("creator-codigo-ANAYT")).toBeTruthy();
    expect(capturado.escopos).toEqual(["admin-bloco:Cliques e vendas por dia"]);
  });
});

describe("CreatorDashboardView: forma do grafico e blocos polidos", () => {
  // O recharts nao desenha nada no jsdom (o ResponsiveContainer mede zero), entao
  // a forma escolhida e lida nos atributos do contêiner, que a view escreve a
  // partir da mesma decisao que escolhe o grafico.
  it("serie de 1 dia vira barras, e barras nao tem eixo de vendas", () => {
    const p = painelBase();
    p.eventos.serie = [{ dia: "2026-09-20", ...ZERO, clicks: 4, sales: 1 }];
    desenhar(p);
    const grafico = screen.getByTestId("creator-grafico");
    expect(grafico.getAttribute("data-forma")).toBe("barras");
    expect(grafico.getAttribute("data-eixo-vendas")).toBe("nao");
  });

  it("serie de 2 dias ainda e barras", () => {
    const p = painelBase();
    p.eventos.serie = [
      { dia: "2026-09-19", ...ZERO, clicks: 2 },
      { dia: "2026-09-20", ...ZERO, clicks: 4 },
    ];
    desenhar(p);
    expect(screen.getByTestId("creator-grafico").getAttribute("data-forma")).toBe(
      "barras",
    );
  });

  it("a partir de 3 dias volta a linha, com eixo de vendas porque houve venda", () => {
    desenhar(painelBase());
    const grafico = screen.getByTestId("creator-grafico");
    expect(grafico.getAttribute("data-forma")).toBe("linha");
    expect(grafico.getAttribute("data-eixo-vendas")).toBe("sim");
  });

  it("linha sem venda nenhuma nao ganha o eixo da direita", () => {
    const p = painelBase();
    p.eventos.serie = [
      { dia: "2026-09-18", ...ZERO, clicks: 1 },
      { dia: "2026-09-19", ...ZERO },
      { dia: "2026-09-20", ...ZERO, clicks: 3 },
    ];
    desenhar(p);
    const grafico = screen.getByTestId("creator-grafico");
    expect(grafico.getAttribute("data-forma")).toBe("linha");
    expect(grafico.getAttribute("data-eixo-vendas")).toBe("nao");
  });

  it("conversao com valor ganha a linha de vendas por 100 cliques", () => {
    desenhar(painelBase());
    expect(screen.getByTestId("creator-tile-conversao").textContent).toContain(
      "2,14 vendas por 100 cliques",
    );
  });

  it("sem cliques, a conversao nao ganha a linha auxiliar", () => {
    const p = painelBase();
    p.totais = { ...p.totais, clicks: 0, sales: 0, conversao_pct: null };
    desenhar(p);
    expect(
      screen.getByTestId("creator-tile-conversao").textContent,
    ).not.toContain("por 100 cliques");
  });

  it("desde o inicio e o selo acima do titulo Seus numeros", () => {
    desenhar(painelBase());
    const titulo = screen.getByRole("heading", { name: "Seus números" });
    expect(titulo.previousElementSibling?.textContent).toBe("desde o início");
  });

  it("a frase do creator saiu da view para a faixa da pagina, nas duas visoes", () => {
    const frase =
      "Seu link, seus números e o que você já gerou para a Bora na Tech.";
    desenhar(painelBase(), "creator");
    expect(screen.queryByText(frase)).toBeNull();
    cleanup();
    desenhar(painelBase(), "admin");
    expect(screen.queryByText(frase)).toBeNull();
  });

  it("dois codigos empilham em uma coluna, um cupom embaixo do outro", () => {
    desenhar(painelBase());
    const lista = screen.getByTestId("creator-codigo-ANA30").parentElement;
    expect(lista?.contains(screen.getByTestId("creator-codigo-ANAYT"))).toBe(
      true,
    );
    expect(lista?.className).not.toContain("grid-cols-2");
  });

  it("identidade embutida: cartao card-brutal, sem faixa e sem etiqueta", () => {
    desenhar(painelBase());
    expect(screen.queryByTestId("creator-faixa")).toBeNull();
    expect(screen.queryByTestId("creator-etiqueta")).toBeNull();
    const identidade = screen.getByTestId("creator-identidade");
    expect(identidade.className).toContain("card-brutal");
    expect(identidade.textContent).toContain("Ana Creator");
  });

  it("os seis numeros sao cards card-brutal brancos", () => {
    desenhar(painelBase());
    for (const id of [
      "cliques",
      "vendas",
      "conversao",
      "receita",
      "a-receber",
      "paga",
    ]) {
      const classes = screen.getByTestId(`creator-tile-${id}`).className;
      expect(classes, id).toContain("card-brutal");
      expect(classes, id).toContain("bg-white");
    }
  });

  it("a visao admin abre com a identidade e usa os mesmos cards e cupom", () => {
    desenhar(painelAdmin(), "admin");
    expect(screen.getByTestId("creator-painel").firstElementChild).toBe(
      screen.getByTestId("creator-identidade"),
    );
    expect(screen.getByTestId("creator-tile-cliques").className).toContain(
      "card-brutal",
    );
    expect(screen.getByTestId("creator-codigo-ANA30")).toBeTruthy();
  });
});

describe("CreatorDashboardView: forma do admin", () => {
  // As quatro cores de quadrado de icone que o admin ja usa, literais.
  const VIOLETA = "bg-violet-800 text-white";
  const CEU = "bg-sky-600 text-white";
  const ACENTO = "bg-[var(--bnt-accent-solid)] text-ink-on-accent";
  const ESMERALDA = "bg-emerald-600 text-white";
  const CORES = [VIOLETA, CEU, ACENTO, ESMERALDA];

  it("com identidade nenhuma a view nao desenha a identidade, nem na visao admin", () => {
    render(
      <CreatorDashboardView
        painel={painelAdmin()}
        janela="7d"
        onJanelaChange={onJanelaChange}
        visao="admin"
        identidade="nenhuma"
      />,
    );
    expect(screen.queryByTestId("creator-identidade")).toBeNull();
    expect(screen.queryByTestId("creator-kind")).toBeNull();
    expect(screen.queryByTestId("creator-email")).toBeNull();
    expect(screen.queryByTestId("creator-revogado")).toBeNull();
  });

  it("no padrao a view desenha a identidade; na visao admin, com e-mail e revogado", () => {
    desenhar(painelBase(), "creator");
    expect(screen.getByTestId("creator-kind")).toBeTruthy();
    cleanup();
    desenhar(painelAdmin(), "admin");
    expect(screen.getByTestId("creator-kind")).toBeTruthy();
    expect(screen.getByTestId("creator-email")).toBeTruthy();
    expect(screen.getByTestId("creator-revogado")).toBeTruthy();
  });

  it("os seis cards: card-brutal branco, com o quadrado de icone na cor da tabela", () => {
    desenhar(painelBase());
    const esperado: Array<[string, string]> = [
      ["cliques", VIOLETA],
      ["vendas", VIOLETA],
      ["conversao", CEU],
      ["receita", ACENTO],
      ["a-receber", ACENTO],
      ["paga", ESMERALDA],
    ];
    for (const [id, cor] of esperado) {
      const card = screen.getByTestId(`creator-tile-${id}`);
      expect(card.className, id).toContain("card-brutal");
      expect(card.className, id).toContain("bg-white");
      const quadrado = card.firstElementChild;
      expect(quadrado?.getAttribute("aria-hidden"), id).toBe("true");
      const classes = quadrado?.getAttribute("class") ?? "";
      expect(classes, id).toContain("border-2 border-slate-900");
      expect(
        CORES.filter((c) => classes.includes(c)),
        id,
      ).toEqual([cor]);
    }
  });

  it("nenhum elemento do painel tem fundo pastel bg-*-200", () => {
    desenhar(painelAdmin(), "admin");
    const painel = screen.getByTestId("creator-painel");
    const pasteis = [painel, ...Array.from(painel.querySelectorAll("*"))]
      .map((el) => el.getAttribute("class") ?? "")
      .filter((classes) => /\bbg-[a-z]+-200\b/.test(classes));
    expect(pasteis).toEqual([]);
  });

  it("pilulas na forma do OverviewPeriod: a ativa bg-slate-950 e nenhuma com sombra dura", () => {
    desenhar(painelBase());
    const grupo = screen.getByRole("group", { name: "Período da série" });
    const botoes = within(grupo).getAllByRole("button");
    expect(botoes.map((b) => b.textContent)).toEqual([
      "7 dias",
      "30 dias",
      "90 dias",
      "Tudo",
    ]);
    for (const botao of botoes) {
      expect(botao.className).not.toContain("shadow-[");
      const ativa = botao.getAttribute("aria-pressed") === "true";
      expect(botao.className).toContain(ativa ? "bg-slate-950" : "bg-white");
    }
    expect(
      botoes.filter((b) => b.getAttribute("aria-pressed") === "true"),
    ).toHaveLength(1);
  });

  it("a moldura da serie e a do ChartFrame: eyebrow violeta e o h3", () => {
    desenhar(painelBase());
    const h3 = screen.getByRole("heading", {
      level: 3,
      name: "Cliques e vendas por dia",
    });
    const eyebrow = h3.previousElementSibling;
    expect(eyebrow?.textContent).toBe("série diária");
    expect(eyebrow?.className).toContain("text-violet-700");
    expect(h3.closest("section")?.className).toContain("card-brutal");
  });

  it("os quatro blocos do periodo tem a forma do bloco interno do admin", () => {
    desenhar(painelBase());
    const blocos = Array.from(
      screen.getByTestId("creator-periodo").children,
    ).map((bloco) => bloco.className);
    expect(blocos).toEqual(
      Array(4).fill("rounded-2xl border-2 border-slate-300 bg-slate-50 p-4"),
    );
  });
});

describe("CreatorDashboardView: vendas reconstruidas antes do marco de cliques", () => {
  // O backfill de 2026-09 reconstruiu vendas anteriores a creator_events. A
  // serie passa a comecar nelas, e os dias sem medicao de clique precisam
  // aparecer como AUSENCIA (null), nao como zero clique.
  it("serieParaGrafico: cliques antes do marco viram null; vendas ficam", () => {
    const serie = [
      {
        dia: "2026-09-14",
        ...ZERO,
        sales: 1,
        revenue_cents: 2242,
        commission_cents: 224,
      },
      { dia: "2026-09-15", ...ZERO },
      { dia: "2026-09-16", ...ZERO, clicks: 3 },
    ];
    expect(serieParaGrafico(serie, "2026-09-16T12:00:00Z")).toEqual([
      {
        dia: "2026-09-14",
        ...ZERO,
        clicks: null,
        sales: 1,
        revenue_cents: 2242,
        commission_cents: 224,
      },
      { dia: "2026-09-15", ...ZERO, clicks: null },
      { dia: "2026-09-16", ...ZERO, clicks: 3 },
    ]);
  });

  it("serieParaGrafico: o marco conta pelo dia de Brasilia, nao pelo de UTC", () => {
    // 2026-09-16 02:30 UTC ainda e 15/09 23:30 em Brasilia: o dia 15 ja e
    // medido, e o zero dele e zero de verdade.
    const serie = [
      { dia: "2026-09-14", ...ZERO },
      { dia: "2026-09-15", ...ZERO },
    ];
    expect(
      serieParaGrafico(serie, "2026-09-16T02:30:00Z").map((d) => d.clicks),
    ).toEqual([null, 0]);
  });

  it("serieParaGrafico: sem marco de cliques, todo dia fica null", () => {
    const serie = [
      { dia: "2026-09-19", ...ZERO, sales: 1 },
      { dia: "2026-09-20", ...ZERO },
    ];
    expect(serieParaGrafico(serie, null).map((d) => d.clicks)).toEqual([
      null,
      null,
    ]);
  });

  it("dois selos com as datas de cada marco, e cliques ausentes antes do marco", () => {
    const p = painelBase();
    p.eventos.sales_since = "2026-07-10T15:00:00Z";
    p.eventos.clicks_since = "2026-09-16T12:00:00Z";
    p.eventos.events_since = "2026-09-16T12:00:00Z";
    desenhar(p);
    expect(screen.getByTestId("creator-cliques-desde").textContent).toBe(
      "Cliques desde 16/09/2026",
    );
    expect(screen.getByTestId("creator-vendas-desde").textContent).toBe(
      "Vendas desde 10/07/2026",
    );
    // A serie da fixture vai de 14/09 a 20/09: 14 e 15 sao antes do marco.
    expect(
      screen.getByTestId("creator-grafico").getAttribute("data-cliques-ausentes"),
    ).toBe("2");
  });

  it("so vendas: cliques ausentes so ANTES do inicio da medicao", () => {
    // O marco de cliques e o inicio global da medicao (deploy do lote 01,
    // 14/09 02:10 em Brasilia). Os dias 12 e 13 nao eram medidos; 14 e 15 ja
    // eram, e o zero deles e zero de verdade, mesmo sem clique nenhum.
    const p = painelBase();
    p.eventos.clicks_since = "2026-09-14T05:10:00Z";
    p.eventos.events_since = "2026-09-14T05:10:00Z";
    p.eventos.sales_since = "2026-07-10T15:00:00Z";
    p.eventos.serie = [
      { dia: "2026-09-12", ...ZERO, sales: 1 },
      { dia: "2026-09-13", ...ZERO },
      { dia: "2026-09-14", ...ZERO },
      { dia: "2026-09-15", ...ZERO },
    ];
    desenhar(p);
    expect(screen.queryByTestId("creator-sem-eventos")).toBeNull();
    expect(screen.getByTestId("creator-cliques-desde").textContent).toBe(
      "Cliques desde 14/09/2026",
    );
    expect(screen.getByTestId("creator-vendas-desde").textContent).toBe(
      "Vendas desde 10/07/2026",
    );
    expect(
      screen.getByTestId("creator-grafico").getAttribute("data-cliques-ausentes"),
    ).toBe("2");
  });

  it("JANELA DE DEPLOY: o backend anterior, sem os marcos novos, ainda desenha a serie", () => {
    // A Vercel sobe antes do Railway. Por 1 a 3 minutos o front novo recebe o
    // payload antigo, que so tem `events_since`: o marco de cliques cai para
    // ele e o selo de vendas simplesmente nao aparece.
    const p = painelBase();
    const eventosAntigos: Record<string, unknown> = { ...p.eventos };
    delete eventosAntigos.clicks_since;
    delete eventosAntigos.sales_since;
    const antigo = { ...p, eventos: eventosAntigos } as unknown as CreatorDashboard;
    desenhar(antigo);
    expect(screen.getByTestId("creator-cliques-desde").textContent).toBe(
      "Cliques desde 10/09/2026",
    );
    expect(screen.queryByTestId("creator-vendas-desde")).toBeNull();
    expect(
      screen.getByTestId("creator-grafico").getAttribute("data-cliques-ausentes"),
    ).toBe("0");
  });
});
