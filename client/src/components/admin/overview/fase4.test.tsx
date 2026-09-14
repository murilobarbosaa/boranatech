import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * COMPONENTES DA FASE 4.
 *
 * O bloco que mais importa aqui é o de payload degradado. Na rodada 5 o
 * `AttentionPanel` fez `data.itens.length` sobre `{}` e isso derrubaria a ABA
 * INTEIRA (o throw no render sobe até o ErrorBoundary da App, não fica no
 * bloco). Todo componente novo nasce com o mesmo teste.
 */

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver =
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ??
  ResizeObserverStub;

// recharts mede o container; no jsdom a largura é 0 e nada renderiza. O
// ResponsiveContainer é substituído por uma caixa de tamanho fixo, que é o
// mesmo contorno usado pelos testes dos gráficos que já existiam.
vi.mock("recharts", async () => {
  const real = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...real,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 600, height: 300 }}>{children}</div>
    ),
  };
});

import { DeltaBadge } from "./DeltaBadge";
import { FunnelDigest, legendaDoPasso } from "./FunnelDigest";
import { MetricSparkline } from "./MetricSparkline";
import {
  CostVsRevenueChart,
  hasOverviewPaymentsContract,
  isRegisteredPaymentsData,
  RegisteredPaymentsChart,
  serieDe,
} from "./SeriesCharts";
import { ToolUsagePanel } from "./ToolUsagePanel";

afterEach(cleanup);

// ---------------------------------------------------------------------------

describe("DeltaBadge", () => {
  it("colore pela DIREÇÃO que o servidor mandou, não pelo sinal", () => {
    // Mesma variação (+100%), leituras opostas: receita subindo é bom, custo
    // subindo é ruim. Sem `direcao`, o componente teria de adivinhar pelo nome.
    const { unmount } = render(
      <DeltaBadge atual={200} anterior={100} direcao="up_bom" />,
    );
    expect(screen.getByTestId("delta-badge").getAttribute("data-tom")).toBe(
      "alta",
    );
    unmount();

    render(<DeltaBadge atual={200} anterior={100} direcao="up_ruim" />);
    expect(screen.getByTestId("delta-badge").getAttribute("data-tom")).toBe(
      "baixa",
    );
  });

  it("CONTROLE NEGATIVO: base zero NÃO vira Infinity, o badge some", () => {
    const { container } = render(<DeltaBadge atual={10} anterior={0} />);
    expect(container.innerHTML).toBe("");
  });

  it("CONTROLE NEGATIVO: sem período anterior, o badge some", () => {
    const { container } = render(<DeltaBadge atual={10} anterior={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("variação desprezível é neutra, não 'alta'", () => {
    render(<DeltaBadge atual={1000} anterior={1000} />);
    expect(screen.getByTestId("delta-badge").getAttribute("data-tom")).toBe(
      "neutro",
    );
  });
});

// ---------------------------------------------------------------------------

describe("MetricSparkline", () => {
  it("desenha quando há pelo menos dois pontos medidos", () => {
    render(
      <MetricSparkline
        pontos={[
          { date: "2026-08-13", value: 1 },
          { date: "2026-08-14", value: 5 },
        ]}
      />,
    );
    expect(screen.getByTestId("sparkline")).toBeTruthy();
  });

  it("CONTROLE NEGATIVO: um ponto só NÃO vira uma reta que afirma estabilidade", () => {
    const { container } = render(
      <MetricSparkline pontos={[{ date: "2026-08-14", value: 5 }]} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("payload degradado (undefined, nulos) não derruba nada", () => {
    const a = render(<MetricSparkline pontos={undefined} />);
    expect(a.container.innerHTML).toBe("");
    a.unmount();
    const b = render(
      <MetricSparkline
        pontos={[
          { date: "d1", value: null },
          { date: "d2", value: null },
        ]}
      />,
    );
    expect(b.container.innerHTML).toBe("");
  });
});

// ---------------------------------------------------------------------------

describe("FunnelDigest", () => {
  const funil = {
    passos: [
      {
        chave: "cadastro",
        rotulo: "Cadastros no período",
        valor: 4807,
        taxaSobreAnterior: null,
      },
      {
        chave: "pagamento",
        rotulo: "Com pagamento registrado após o cadastro",
        valor: 91,
        taxaSobreAnterior: 1.893,
      },
      {
        chave: "uso_ia",
        rotulo: "Com IA iniciada após o pagamento e status success na consulta",
        valor: 81,
        taxaSobreAnterior: 89.011,
      },
    ],
    destaque: "pagamento",
    anterior: null,
    motivoSemDelta: "janelas_de_observacao_nao_equivalentes",
    limiteTemporalDosInicios: "2026-08-14T23:59:59.999Z",
    consultaIniciadaEm: "2026-08-15T12:00:00.000Z",
    consultaConcluidaEm: "2026-08-15T12:00:01.000Z",
    semanticaUso: "inicio_apos_pagamento_status_success_na_consulta",
    cadastrosComMenosDe7Dias: 12,
  };

  it("mostra taxas adjacentes e destaca o passo que o servidor apontou", () => {
    render(<FunnelDigest data={funil} />);
    const passos = screen.getAllByTestId("funil-passo");
    expect(passos).toHaveLength(3);
    expect(
      passos
        .find((p) => p.getAttribute("data-chave") === "pagamento")
        ?.getAttribute("data-destaque"),
    ).toBe("sim");
    expect(screen.getByText("1,9%")).toBeTruthy();
  });

  it("renderiza a ORDEM do servidor, sem reordenar (D20)", () => {
    render(<FunnelDigest data={funil} />);
    expect(
      screen
        .getAllByTestId("funil-passo")
        .map((p) => p.getAttribute("data-chave")),
    ).toEqual(["cadastro", "pagamento", "uso_ia"]);
  });

  it("a 3ª etapa identifica IA pós-pagamento, não uso genérico", () => {
    render(<FunnelDigest data={funil} />);
    const passo = screen
      .getAllByTestId("funil-passo")
      .find((p) => p.getAttribute("data-chave") === "uso_ia")!;
    expect(passo.textContent).toContain("status na consulta");
    expect(passo.textContent).not.toContain("alguma ferramenta");
    expect(
      screen.getByText(/momento em que uma execução virou success/i),
    ).toBeTruthy();
  });

  it("CONTROLE NEGATIVO: chave desconhecida não derruba o bloco, só fica sem legenda", () => {
    // A chave vem do servidor. Um passo novo que este bundle não conhece tem de
    // renderizar sem legenda, nunca lançar (regra dos lookups por valor do
    // servidor: foi assim que `STATUS_META[status].label` quebrou o admin).
    expect(legendaDoPasso("passo_que_ainda_nao_existe")).toBeNull();
    render(
      <FunnelDigest
        data={{
          ...funil,
          passos: [
            {
              chave: "inedito",
              rotulo: "Novo",
              valor: 3,
              taxaSobreAnterior: 5,
            },
          ],
        }}
      />,
    );
    expect(screen.getAllByTestId("funil-passo")).toHaveLength(1);
    expect(screen.queryByTestId("funil-passo-legenda")).toBeNull();
  });

  it("o topo do funil NÃO inventa taxa", () => {
    render(<FunnelDigest data={funil} />);
    const topo = screen
      .getAllByTestId("funil-passo")
      .find((p) => p.getAttribute("data-chave") === "cadastro")!;
    expect(topo.textContent).toContain("topo do funil");
  });

  it("declara por que não há comparação com o período anterior", () => {
    render(<FunnelDigest data={funil} />);
    const nota = screen.getByTestId("funil-sem-delta");
    expect(nota.textContent).toContain("coortes");
    expect(nota.textContent).toContain("janelas");
    expect(nota.textContent).not.toContain("%");
  });

  it("payload degradado renderiza estado vazio, não TypeError", () => {
    render(<FunnelDigest data={{} as never} />);
    expect(screen.getByTestId("funil-vazio")).toBeTruthy();
  });

  it("loading e erro são estados próprios", () => {
    const a = render(<FunnelDigest data={null} loading />);
    expect(screen.getByTestId("funil-loading")).toBeTruthy();
    a.unmount();
    render(<FunnelDigest data={null} error="falhou" />);
    expect(screen.getByTestId("funil-erro")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------

describe("serieDe", () => {
  it("devolve array vazio para payload ausente ou de outra forma", () => {
    expect(serieDe(undefined, "cadastros")).toEqual([]);
    expect(serieDe(null, "cadastros")).toEqual([]);
    expect(serieDe([] as never, "cadastros")).toEqual([]);
    expect(serieDe([{ chave: "outra" }] as never, "cadastros")).toEqual([]);
  });
});

describe("gráficos novos", () => {
  const dias = [
    { date: "2026-08-13", partial: false },
    { date: "2026-08-14", partial: true },
  ];
  const serie = (chave: string, rotulo: string, values: number[]) => ({
    chave,
    rotulo,
    pontos: dias.map((dia, index) => ({ ...dia, value: values[index] })),
    total: values.reduce((sum, value) => sum + value, 0),
  });
  const series = [
    serie("cadastros", "Cadastros", [1, 2]),
    serie("receitaBrutaCents", "Receita bruta", [29900, 59800]),
    serie("custoIaUsd", "Custo de IA", [0.1, 0.2]),
    serie("chamadasSemCustoMedido", "Sem custo", [0, 1]),
    {
      ...serie("mrrCents", "MRR", [1000, 1000]),
      tipo: "estoque",
      total: 1000,
    },
    {
      ...serie("assinantesAtivos", "Assinantes", [2, 2]),
      tipo: "estoque",
      total: 2,
    },
  ];
  const paymentSeries = [
    serie("primeiroPagamentoObservado", "Primeiro pagamento observado", [2, 1]),
    serie("pagamentosPosteriores", "Pagamentos posteriores", [1, 0]),
    serie("pagamentosSemClassificacao", "Sem pessoa identificada", [0, 1]),
    serie("pagamentosOrdemIncerta", "Ordem histórica incerta", [0, 0]),
  ];

  const pagamentos = {
    series: paymentSeries,
    pagamentosUtilizaveisNoPeriodo: 5,
    pessoasIdentificadas: 4,
    semPessoaNoPeriodo: 1,
    ordemHistoricaIncertaNoPeriodo: 0,
    identidadesConflitantesNoHistorico: 1,
    identidadesConflitantesComDataCandidataNoPeriodo: 1,
    porMeio: [{ rotulo: "Não identificado", pagamentos: 5 }],
    porProvider: [{ provider: "stripe", pagamentos: 5 }],
    cobertura: {
      calculadoAte: "2026-08-14T15:00:00Z",
      consultaIniciadaEm: "2026-08-14T15:01:00Z",
      consultaConcluidaEm: "2026-08-14T15:01:01Z",
      leituraLocal: "paginacao_verificada_sem_snapshot" as const,
      consistenciaFotografia: "nao_garantida" as const,
      historicoIntegral: "nao_verificavel" as const,
      pagamentosSemUsuario: 0,
      pagamentosSemMeio: 5,
      excluidos: { identidadeAusente: 0, dataInvalida: 0 },
    },
    ressalvaHistorica:
      "Primeiro observado no histórico local não comprova o primeiro da vida.",
  };

  const funil = {
    passos: [
      {
        chave: "cadastro",
        rotulo: "Cadastros",
        valor: 4,
        taxaSobreAnterior: null,
      },
      {
        chave: "pagamento",
        rotulo: "Pagamentos",
        valor: 2,
        taxaSobreAnterior: 50,
      },
      { chave: "uso_ia", rotulo: "IA", valor: 1, taxaSobreAnterior: 50 },
    ],
    destaque: "pagamento",
    anterior: null,
    motivoSemDelta: "janelas_de_observacao_nao_equivalentes",
    limiteTemporalDosInicios: "2026-08-14T15:00:00Z",
    consultaIniciadaEm: "2026-08-14T15:01:00Z",
    consultaConcluidaEm: "2026-08-14T15:01:01Z",
    semanticaUso: "inicio_apos_pagamento_status_success_na_consulta",
    cadastrosComMenosDe7Dias: 1,
  };
  const payloadValido = {
    contractVersion: 3,
    series,
    pagamentos,
    funil,
    ferramentas: [],
    windowLabel: "13 a 14 ago",
    tz: "America/Sao_Paulo",
  };

  it("recusa backend antigo ou payload v2/v3 incompleto", () => {
    expect(hasOverviewPaymentsContract({ series: [], funil: {} })).toBe(false);
    expect(
      hasOverviewPaymentsContract({
        contractVersion: 2,
        series: [],
        pagamentos: { series: [] },
        funil: { passos: [] },
      }),
    ).toBe(false);
    expect(
      hasOverviewPaymentsContract({
        contractVersion: 3,
        series: [],
        pagamentos: { series: [] },
        funil: { passos: [] },
      }),
    ).toBe(false);
    expect(hasOverviewPaymentsContract(payloadValido)).toBe(true);
  });

  it("recusa séries desalinhadas, datas e números inválidos", () => {
    const desalinhado = structuredClone(payloadValido);
    desalinhado.pagamentos.series[1].pontos[1].date = "2026-08-15";
    expect(hasOverviewPaymentsContract(desalinhado)).toBe(false);
    const negativo = structuredClone(payloadValido);
    negativo.pagamentos.pagamentosUtilizaveisNoPeriodo = -1;
    expect(hasOverviewPaymentsContract(negativo)).toBe(false);
    const invalido = structuredClone(payloadValido);
    invalido.pagamentos.series[0].pontos[0].date = "2026-13-99";
    expect(() => hasOverviewPaymentsContract(invalido)).not.toThrow();
    expect(hasOverviewPaymentsContract(invalido)).toBe(false);
  });

  it.each(["identidadeAusente", "dataInvalida"] as const)(
    "recusa exclusão obrigatória ausente: %s",
    (field) => {
      const incompleto = structuredClone(payloadValido);
      delete (
        incompleto.pagamentos.cobertura.excluidos as Record<string, number>
      )[field];
      const other =
        field === "identidadeAusente" ? "dataInvalida" : "identidadeAusente";
      incompleto.pagamentos.cobertura.excluidos[other] = 1;

      expect(isRegisteredPaymentsData(incompleto.pagamentos)).toBe(false);
      expect(hasOverviewPaymentsContract(incompleto)).toBe(false);
      expect(() =>
        render(
          <RegisteredPaymentsChart
            pagamentos={incompleto.pagamentos as never}
          />,
        ),
      ).not.toThrow();
      expect(
        screen
          .getByTestId("grafico-pagamentos-registrados")
          .getAttribute("data-estado"),
      ).toBe("erro");
    },
  );

  it("recusa objeto de exclusões vazio sem convertê-lo em zeros", () => {
    const incompleto = structuredClone(payloadValido);
    incompleto.pagamentos.cobertura.excluidos = {} as never;
    expect(isRegisteredPaymentsData(incompleto.pagamentos)).toBe(false);
    expect(hasOverviewPaymentsContract(incompleto)).toBe(false);
  });

  it("recusa null em fluxo e preserva null legítimo em estoque", () => {
    const receitaNula = structuredClone(payloadValido);
    const receita = receitaNula.series.find(
      (item) => item.chave === "receitaBrutaCents",
    )!;
    (receita as { total: number | null }).total = null;
    (receita.pontos[0] as { value: number | null }).value = null;
    expect(hasOverviewPaymentsContract(receitaNula)).toBe(false);

    const estoqueNulo = structuredClone(payloadValido);
    const mrr = estoqueNulo.series.find((item) => item.chave === "mrrCents")!;
    (mrr as { total: number | null }).total = null;
    for (const point of mrr.pontos) {
      (point as { value: number | null }).value = null;
    }
    expect(hasOverviewPaymentsContract(estoqueNulo)).toBe(true);
    expect(hasOverviewPaymentsContract(payloadValido)).toBe(true);
    expect(
      payloadValido.series.find((item) => item.chave === "custoIaUsd")
        ?.pontos[0].value,
    ).toBe(0.1);
  });

  it("pagamentos registrados expõem unidades e ressalva histórica", () => {
    render(<RegisteredPaymentsChart pagamentos={pagamentos} />);
    const bloco = screen.getByTestId("grafico-pagamentos-registrados");
    expect(bloco.getAttribute("data-estado")).toBe("ok");
    expect(bloco.textContent).toContain("5 pagamentos");
    expect(bloco.textContent).toContain("4 pessoas identificadas");
    expect(bloco.textContent).toContain("não comprova");
    expect(bloco.textContent).toContain("sem fotografia transacional");
    expect(screen.getByTestId("legenda-pagamentos").children).toHaveLength(4);
    expect(bloco.textContent).not.toContain("Conversões Pro");
  });

  it("entrada presente mas incompatível produz erro controlado", () => {
    expect(() =>
      render(<RegisteredPaymentsChart pagamentos={{ series: [] } as never} />),
    ).not.toThrow();
    expect(
      screen
        .getByTestId("grafico-pagamentos-registrados")
        .getAttribute("data-estado"),
    ).toBe("erro");
  });

  it("sem série, o gráfico fica VAZIO declarado (não quebra)", () => {
    render(<RegisteredPaymentsChart pagamentos={undefined} />);
    expect(
      screen
        .getByTestId("grafico-pagamentos-registrados")
        .getAttribute("data-estado"),
    ).toBe("vazio");
  });

  it("custo x receita SEM cotação usa dois painéis, nunca eixo duplo", () => {
    // Eixo duplo com unidades diferentes faz a proporção entre as curvas
    // depender da escala escolhida, e quem lê enxerga uma relação inventada.
    render(<CostVsRevenueChart series={series} cotacaoUsdBrl={null} />);
    expect(screen.getByTestId("custo-receita-paineis-separados")).toBeTruthy();
    expect(screen.getByTestId("grafico-custo-receita").textContent).toContain(
      "Sem cotação configurada",
    );
  });

  it("custo x receita COM cotação unifica em BRL", () => {
    render(<CostVsRevenueChart series={series} cotacaoUsdBrl={5.4} />);
    expect(screen.queryByTestId("custo-receita-paineis-separados")).toBeNull();
    expect(screen.getByTestId("grafico-custo-receita").textContent).toContain(
      "Custo convertido",
    );
  });

  it("selo 'custo parcial' aparece enquanto houver chamada sem custo medido", () => {
    render(
      <CostVsRevenueChart
        series={series}
        cotacaoUsdBrl={null}
        chamadasSemCustoMedido={251}
      />,
    );
    expect(screen.getByTestId("grafico-custo-receita").textContent).toContain(
      "Custo parcial",
    );
  });

  it("CONTROLE NEGATIVO: sem chamadas não medidas, o selo NÃO aparece", () => {
    render(
      <CostVsRevenueChart
        series={series}
        cotacaoUsdBrl={null}
        chamadasSemCustoMedido={0}
      />,
    );
    expect(
      screen.getByTestId("grafico-custo-receita").textContent,
    ).not.toContain("Custo parcial");
  });
});

// ---------------------------------------------------------------------------

describe("ToolUsagePanel", () => {
  const ferramentas = [
    {
      tool: "linkedin-analyzer",
      chamadas: 276,
      custoUsd: 0.2036,
      semCustoMedido: 0,
    },
    { tool: "github-perfil", chamadas: 79, custoUsd: 0, semCustoMedido: 79 },
  ];

  it("separa custo medido de NÃO medido, por ferramenta", () => {
    render(<ToolUsagePanel ferramentas={ferramentas} />);
    const linhas = screen.getAllByTestId("ferramenta-linha");
    expect(linhas).toHaveLength(2);
    const github = linhas.find(
      (l) => l.getAttribute("data-tool") === "github-perfil",
    )!;
    expect(github.textContent).toContain("79");
    expect(github.textContent).toContain("US$ 0.00");
  });

  it("declara que o custo é um PISO quando há chamadas sem custo", () => {
    render(<ToolUsagePanel ferramentas={ferramentas} />);
    expect(screen.getByTestId("ferramentas-piso").textContent).toContain(
      "piso",
    );
  });

  it("CONTROLE NEGATIVO: tudo medido, sem aviso de piso", () => {
    render(
      <ToolUsagePanel
        ferramentas={[
          { tool: "x", chamadas: 10, custoUsd: 1, semCustoMedido: 0 },
        ]}
      />,
    );
    expect(screen.queryByTestId("ferramentas-piso")).toBeNull();
  });

  it("payload degradado vira estado vazio, não TypeError", () => {
    render(<ToolUsagePanel ferramentas={undefined} />);
    expect(screen.getByTestId("ferramentas-vazio")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// RODADA 7, legibilidade
// ---------------------------------------------------------------------------

describe("ToolUsagePanel compacto (v2)", () => {
  const muitas = Array.from({ length: 12 }, (_, i) => ({
    tool: `tool-${i}`,
    chamadas: 100 - i,
    custoUsd: 0.5,
    semCustoMedido: i === 0 ? 5 : 0,
  }));

  it("mostra o top 8 e agrega o resto numa linha só", () => {
    render(<ToolUsagePanel ferramentas={muitas} />);
    expect(screen.getAllByTestId("ferramenta-linha")).toHaveLength(8);
    const outras = screen.getByTestId("ferramentas-outras");
    expect(outras.textContent).toContain("outras 4 ferramentas");
  });

  it("a linha TOTAL é sobre TUDO, não sobre o top 8", () => {
    // Total sobre o recorte seria um número menor com cara de total, a classe
    // de erro que este projeto persegue.
    render(<ToolUsagePanel ferramentas={muitas} />);
    const total = screen.getByTestId("ferramentas-total");
    const soma = muitas.reduce((a, f) => a + f.chamadas, 0);
    expect(total.textContent).toContain(soma.toLocaleString("pt-BR"));
    expect(total.textContent).toContain("US$ 6.00");
  });

  it("expandir revela todas as ferramentas", () => {
    render(<ToolUsagePanel ferramentas={muitas} />);
    fireEvent.click(screen.getByTestId("ferramentas-expandir"));
    expect(screen.getAllByTestId("ferramenta-linha")).toHaveLength(12);
    expect(screen.queryByTestId("ferramentas-outras")).toBeNull();
  });

  it("com cotação, o TOTAL ganha o equivalente em BRL", () => {
    render(<ToolUsagePanel ferramentas={muitas} cotacaoUsdBrl={5} />);
    expect(
      screen.getByTestId("ferramentas-total").textContent?.replace(/ /g, " "),
    ).toContain("R$ 30,00");
  });

  it("CONTROLE NEGATIVO: sem cotação, nenhuma linha em BRL", () => {
    render(<ToolUsagePanel ferramentas={muitas} />);
    expect(screen.getByTestId("ferramentas-total").textContent).not.toContain(
      "R$",
    );
  });

  it("poucas ferramentas não geram linha de 'outras'", () => {
    render(<ToolUsagePanel ferramentas={muitas.slice(0, 3)} />);
    expect(screen.queryByTestId("ferramentas-outras")).toBeNull();
    expect(screen.getByTestId("ferramentas-total")).toBeTruthy();
  });
});

describe("badges do custo × receita (v2)", () => {
  /** 8 dias completos, receita em centavos e custo em dólar. */
  const series = [
    {
      chave: "receitaBrutaCents",
      rotulo: "Receita",
      pontos: Array.from({ length: 8 }, (_, i) => ({
        date: `2026-08-0${i + 1}`,
        value: i < 4 ? 10000 : 20000,
        partial: false,
      })),
      total: 120000,
    },
    {
      chave: "custoIaUsd",
      rotulo: "Custo",
      pontos: Array.from({ length: 8 }, (_, i) => ({
        date: `2026-08-0${i + 1}`,
        value: i < 4 ? 0.1 : 0.5,
        partial: false,
      })),
      total: 2.4,
    },
  ];

  it("formata CADA série na sua unidade, nunca centavos crus", () => {
    // O defeito da v1: "39333 → 14846 por dia", que não é receita nem custo.
    render(<CostVsRevenueChart series={series} cotacaoUsdBrl={null} />);
    const receita = screen
      .getByTestId("badge-receita")
      .textContent?.replace(/ /g, " ");
    expect(receita).toContain("R$ 400,00");
    expect(receita).toContain("R$ 800,00");
    expect(receita).not.toContain("40000");

    const custo = screen.getByTestId("badge-custo").textContent;
    expect(custo).toContain("US$ 0.40");
    expect(custo).toContain("US$ 2.00");
  });

  it("custo subindo é VERMELHO (goodDirection do custo é para baixo)", () => {
    render(<CostVsRevenueChart series={series} cotacaoUsdBrl={null} />);
    expect(screen.getByTestId("badge-custo").className).toContain("rose");
  });

  it("a regra da comparação é enunciada no rodapé", () => {
    render(<CostVsRevenueChart series={series} cotacaoUsdBrl={null} />);
    expect(screen.getByTestId("grafico-custo-receita").textContent).toContain(
      "segunda metade",
    );
  });

  it("série curta demais não gera badge (não compara 2 pontos)", () => {
    render(
      <CostVsRevenueChart
        series={[{ ...series[0], pontos: series[0].pontos.slice(0, 2) }]}
        cotacaoUsdBrl={null}
      />,
    );
    expect(screen.queryByTestId("badge-receita")).toBeNull();
  });
});

describe("FunnelDigest: como ler", () => {
  it("traz a explicação estática, sem texto gerado", () => {
    render(
      <FunnelDigest
        data={{
          passos: [
            {
              chave: "cadastro",
              rotulo: "Cadastros",
              valor: 10,
              taxaSobreAnterior: null,
            },
          ],
          destaque: null,
          anterior: null,
        }}
      />,
    );
    // A frase explica a REGRA (taxa sobre a etapa acima, marcação na menor
    // delas). O que este teste protege é a copy ser estática: nada de texto
    // gerado por heurística ou por modelo neste painel.
    const texto = screen.getByTestId("funil-como-ler").textContent ?? "";
    expect(texto).toContain("sobre a etapa acima");
    expect(texto).toContain("execução de IA");
    expect(texto).toContain("status success durante a consulta");
  });
});
