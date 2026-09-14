import {
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartFrame } from "./ChartFrame";
import { intervaloDeRotulos, rotuloDeDia, tendenciaDeFluxo } from "./chartMath";

/**
 * Gráficos novos da Fase 4, no MESMO frame dos dois que já existiam
 * (`ChartFrame`): título, pergunta na tela, tendência em uma frase, rodapé de
 * ressalvas, e os quatro estados (carregando / erro / vazio / ok) declarados.
 *
 * TODOS toleram payload degradado. Série ausente, não-array ou com pontos sem
 * `value` vira estado "vazio", nunca TypeError, no render da Visão um throw
 * troca a ABA INTEIRA pela tela de falha, não só o bloco.
 */

export type PontoSerie = {
  date: string;
  value: number | null;
  partial?: boolean;
};
export type SerieNomeada = {
  chave: string;
  rotulo: string;
  tipo?: string;
  direcao?: string;
  pontos: PontoSerie[];
  total: number | null;
};

/** Extrai uma série pela chave, tolerando payload ausente ou de outra forma. */
export function serieDe(
  series: SerieNomeada[] | null | undefined,
  chave: string,
): PontoSerie[] {
  if (!Array.isArray(series)) return [];
  const s = series.find((x) => x && x.chave === chave);
  return Array.isArray(s?.pontos) ? s.pontos : [];
}

function comoFluxo(pontos: PontoSerie[]) {
  return pontos.map((p) => ({
    date: p.date,
    count: typeof p.value === "number" ? p.value : 0,
    partial: Boolean(p.partial),
  }));
}

/**
 * A partir de quantos pontos o gráfico ganha navegação. 30 é a maior janela do
 * seletor, então só "tudo" (hoje ~102 dias) passa disso.
 */
export const DIAS_PARA_NAVEGACAO = 30;

function eixoX(pontos: Array<{ date: string }>) {
  return {
    dataKey: "date" as const,
    tickFormatter: rotuloDeDia,
    interval: intervaloDeRotulos(pontos.length, 6),
    tick: { fontSize: 11, fontWeight: 700 },
  };
}

// ---------------------------------------------------------------------------

export type RegisteredPaymentsData = {
  series: SerieNomeada[];
  pagamentosUtilizaveisNoPeriodo: number;
  pessoasIdentificadas: number;
  semPessoaNoPeriodo: number;
  ordemHistoricaIncertaNoPeriodo: number;
  identidadesConflitantesNoHistorico: number;
  identidadesConflitantesComDataCandidataNoPeriodo: number;
  porMeio: Array<{ rotulo: string; pagamentos: number }>;
  porProvider: Array<{ provider: string; pagamentos: number }>;
  cobertura: {
    calculadoAte: string;
    consultaIniciadaEm: string;
    consultaConcluidaEm: string;
    leituraLocal: "paginacao_verificada_sem_snapshot";
    consistenciaFotografia: "nao_garantida";
    historicoIntegral: "nao_verificavel";
    pagamentosSemUsuario: number;
    pagamentosSemMeio: number;
    excluidos: {
      identidadeAusente: number;
      dataInvalida: number;
      [key: string]: number;
    };
  };
  ressalvaHistorica: string;
};

const PAYMENT_SERIES_KEYS = [
  "primeiroPagamentoObservado",
  "pagamentosPosteriores",
  "pagamentosSemClassificacao",
  "pagamentosOrdemIncerta",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function validInstant(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validCivilDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const instant = Date.parse(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(instant) &&
    new Date(instant).toISOString().slice(0, 10) === value
  );
}

function validPaymentSeries(value: unknown): value is SerieNomeada[] {
  if (!Array.isArray(value) || value.length !== PAYMENT_SERIES_KEYS.length)
    return false;
  const byKey = new Map<string, SerieNomeada>();
  for (const raw of value) {
    if (!isRecord(raw) || typeof raw.chave !== "string") return false;
    if (byKey.has(raw.chave)) return false;
    const serie = raw as unknown as SerieNomeada;
    if (!Array.isArray(serie.pontos) || !nonNegativeInteger(serie.total))
      return false;
    let sum = 0;
    let previous = "";
    for (const point of serie.pontos) {
      if (
        !isRecord(point) ||
        !validCivilDay(point.date) ||
        !nonNegativeInteger(point.value) ||
        point.date <= previous
      )
        return false;
      previous = point.date;
      sum += point.value;
    }
    if (sum !== serie.total) return false;
    byKey.set(serie.chave, serie);
  }
  if (!PAYMENT_SERIES_KEYS.every((key) => byKey.has(key))) return false;
  const reference = byKey
    .get(PAYMENT_SERIES_KEYS[0])!
    .pontos.map((p) => p.date);
  return PAYMENT_SERIES_KEYS.every((key) => {
    const dates = byKey.get(key)!.pontos.map((p) => p.date);
    return (
      dates.length === reference.length &&
      dates.every((date, index) => date === reference[index])
    );
  });
}

function validGeneralSeries(value: unknown): value is SerieNomeada[] {
  if (!Array.isArray(value)) return false;
  const rules: Record<string, { kind: "flow" | "stock"; integer: boolean }> = {
    cadastros: { kind: "flow", integer: true },
    receitaBrutaCents: { kind: "flow", integer: true },
    custoIaUsd: { kind: "flow", integer: false },
    chamadasSemCustoMedido: { kind: "flow", integer: true },
    mrrCents: { kind: "stock", integer: true },
    assinantesAtivos: { kind: "stock", integer: true },
  };
  const seen = new Set<string>();
  for (const raw of value) {
    if (
      !isRecord(raw) ||
      typeof raw.chave !== "string" ||
      seen.has(raw.chave) ||
      !Array.isArray(raw.pontos)
    )
      return false;
    const rule = rules[raw.chave];
    const validNumber = (item: unknown) =>
      typeof item === "number" &&
      Number.isFinite(item) &&
      item >= 0 &&
      (!rule?.integer || Number.isSafeInteger(item));
    if (
      rule?.kind === "flow"
        ? !validNumber(raw.total)
        : rule?.kind === "stock"
          ? !(raw.total === null || validNumber(raw.total))
          : !(raw.total === null || validNumber(raw.total))
    )
      return false;
    seen.add(raw.chave);
    let previous = "";
    let flowTotal = 0;
    let lastMeasured: number | null = null;
    for (const point of raw.pontos) {
      if (
        !isRecord(point) ||
        !validCivilDay(point.date) ||
        (rule?.kind === "flow"
          ? !validNumber(point.value)
          : !(point.value === null || validNumber(point.value))) ||
        point.date <= previous
      )
        return false;
      previous = point.date;
      if (typeof point.value === "number") {
        flowTotal += point.value;
        lastMeasured = point.value;
      }
    }
    if (rule?.kind === "flow" && flowTotal !== raw.total) return false;
    if (rule?.kind === "stock" && lastMeasured !== raw.total) return false;
  }
  return Object.keys(rules).every((key) => seen.has(key));
}

function validBreakdown(
  value: unknown,
  labelKey: "rotulo" | "provider",
  expected: number,
): boolean {
  if (!Array.isArray(value)) return false;
  let total = 0;
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item[labelKey] !== "string" ||
      !nonNegativeInteger(item.pagamentos)
    )
      return false;
    total += item.pagamentos;
  }
  return total === expected;
}

export function isRegisteredPaymentsData(
  value: unknown,
): value is RegisteredPaymentsData {
  if (!isRecord(value) || !validPaymentSeries(value.series)) return false;
  const numericFields = [
    value.pagamentosUtilizaveisNoPeriodo,
    value.pessoasIdentificadas,
    value.semPessoaNoPeriodo,
    value.ordemHistoricaIncertaNoPeriodo,
    value.identidadesConflitantesNoHistorico,
    value.identidadesConflitantesComDataCandidataNoPeriodo,
  ];
  if (!numericFields.every(nonNegativeInteger)) return false;
  const usable = value.pagamentosUtilizaveisNoPeriodo as number;
  if (
    (value.pessoasIdentificadas as number) > usable ||
    (value.semPessoaNoPeriodo as number) > usable ||
    (value.ordemHistoricaIncertaNoPeriodo as number) > usable ||
    (value.identidadesConflitantesComDataCandidataNoPeriodo as number) >
      (value.identidadesConflitantesNoHistorico as number)
  )
    return false;
  const seriesTotal = (value.series as SerieNomeada[]).reduce(
    (sum, serie) => sum + (serie.total ?? 0),
    0,
  );
  if (seriesTotal !== usable) return false;
  if (
    !validBreakdown(value.porMeio, "rotulo", usable) ||
    !validBreakdown(value.porProvider, "provider", usable)
  )
    return false;
  if (!isRecord(value.cobertura) || !isRecord(value.cobertura.excluidos))
    return false;
  const coverage = value.cobertura;
  const exclusions = coverage.excluidos as Record<string, unknown>;
  if (
    !nonNegativeInteger(exclusions.identidadeAusente) ||
    !nonNegativeInteger(exclusions.dataInvalida)
  )
    return false;
  if (
    coverage.leituraLocal !== "paginacao_verificada_sem_snapshot" ||
    coverage.consistenciaFotografia !== "nao_garantida" ||
    coverage.historicoIntegral !== "nao_verificavel" ||
    !validInstant(coverage.calculadoAte) ||
    !validInstant(coverage.consultaIniciadaEm) ||
    !validInstant(coverage.consultaConcluidaEm) ||
    Date.parse(coverage.consultaIniciadaEm) >
      Date.parse(coverage.consultaConcluidaEm) ||
    !nonNegativeInteger(coverage.pagamentosSemUsuario) ||
    !nonNegativeInteger(coverage.pagamentosSemMeio) ||
    !Object.values(exclusions).every(nonNegativeInteger)
  )
    return false;
  return (
    typeof value.ressalvaHistorica === "string" &&
    value.ressalvaHistorica.trim().length > 0
  );
}

function validFunnel(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.passos)) return false;
  const expected = ["cadastro", "pagamento", "uso_ia"];
  if (value.passos.length !== expected.length) return false;
  let previousValue: number | null = null;
  for (let index = 0; index < expected.length; index += 1) {
    const step = value.passos[index];
    if (
      !isRecord(step) ||
      step.chave !== expected[index] ||
      typeof step.rotulo !== "string" ||
      !nonNegativeInteger(step.valor) ||
      (previousValue !== null && step.valor > previousValue)
    )
      return false;
    if (index === 0) {
      if (step.taxaSobreAnterior !== null) return false;
    } else if (previousValue === 0) {
      if (step.taxaSobreAnterior !== null) return false;
    } else if (
      typeof step.taxaSobreAnterior !== "number" ||
      !Number.isFinite(step.taxaSobreAnterior) ||
      step.taxaSobreAnterior < 0 ||
      step.taxaSobreAnterior > 100 ||
      Math.abs(
        step.taxaSobreAnterior -
          ((step.valor as number) / (previousValue as number)) * 100,
      ) > 0.001
    ) {
      return false;
    }
    previousValue = step.valor;
  }
  return (
    value.anterior === null &&
    value.motivoSemDelta === "janelas_de_observacao_nao_equivalentes" &&
    value.semanticaUso === "inicio_apos_pagamento_status_success_na_consulta" &&
    validInstant(value.limiteTemporalDosInicios) &&
    validInstant(value.consultaIniciadaEm) &&
    validInstant(value.consultaConcluidaEm) &&
    Date.parse(value.consultaIniciadaEm) <=
      Date.parse(value.consultaConcluidaEm) &&
    nonNegativeInteger(value.cadastrosComMenosDe7Dias)
  );
}

export function hasOverviewPaymentsContract(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    value.contractVersion === 3 &&
    validGeneralSeries(value.series) &&
    isRegisteredPaymentsData(value.pagamentos) &&
    validFunnel(value.funil) &&
    Array.isArray(value.ferramentas) &&
    value.ferramentas.every(
      (tool) =>
        isRecord(tool) &&
        typeof tool.tool === "string" &&
        nonNegativeInteger(tool.chamadas) &&
        typeof tool.custoUsd === "number" &&
        Number.isFinite(tool.custoUsd) &&
        tool.custoUsd >= 0 &&
        nonNegativeInteger(tool.semCustoMedido),
    ) &&
    typeof value.windowLabel === "string" &&
    typeof value.tz === "string"
  );
}

export function RegisteredPaymentsChart({
  pagamentos,
  erro,
  carregando,
}: {
  pagamentos?: RegisteredPaymentsData | null;
  erro?: string | null;
  carregando?: boolean;
}) {
  const entradaInvalida =
    pagamentos != null && !isRegisteredPaymentsData(pagamentos);
  const dados = isRegisteredPaymentsData(pagamentos) ? pagamentos : null;
  const erroEfetivo =
    erro ??
    (entradaInvalida
      ? "Dados de pagamentos incompatíveis ou incompletos. Atualize a página."
      : null);
  const primeiros = serieDe(dados?.series, "primeiroPagamentoObservado");
  const posteriores = new Map(
    serieDe(dados?.series, "pagamentosPosteriores").map((p) => [p.date, p]),
  );
  const semClassificacao = serieDe(dados?.series, "pagamentosSemClassificacao");
  const semClassificacaoPorDia = new Map(
    semClassificacao.map((p) => [p.date, p]),
  );
  const ordemIncerta = new Map(
    serieDe(dados?.series, "pagamentosOrdemIncerta").map((p) => [p.date, p]),
  );
  const valorNoDia = (mapa: Map<string, PontoSerie>, date: string) => {
    const value = mapa.get(date)?.value;
    return typeof value === "number" ? value : 0;
  };
  const pontos = primeiros.map((p) => ({
    date: p.date,
    primeiro: typeof p.value === "number" ? p.value : 0,
    posterior: valorNoDia(posteriores, p.date),
    semClassificacao: valorNoDia(semClassificacaoPorDia, p.date),
    ordemIncerta: valorNoDia(ordemIncerta, p.date),
    partial: Boolean(p.partial),
  }));
  const totalPorPonto = pontos.map((p) => ({
    date: p.date,
    count: p.primeiro + p.posterior + p.semClassificacao + p.ordemIncerta,
    partial: p.partial,
  }));
  const breakdown = [
    ...(dados?.porMeio ?? []).map(
      (item) => `${item.rotulo}: ${item.pagamentos.toLocaleString("pt-BR")}`,
    ),
    ...(dados?.porProvider ?? []).map(
      (item) =>
        `${item.provider}: ${item.pagamentos.toLocaleString("pt-BR")} (provedor)`,
    ),
  ];

  return (
    <ChartFrame
      titulo="Pagamentos registrados por dia"
      pergunta="Quantos pagamentos foram registrados, e de quantas pessoas?"
      testId="grafico-pagamentos-registrados"
      erro={erroEfetivo}
      vazio={!erroEfetivo && pontos.length === 0}
      carregando={Boolean(carregando)}
      tendencia={tendenciaDeFluxo(totalPorPonto)}
      rodape={[
        dados?.ressalvaHistorica ?? null,
        dados
          ? `No período: ${dados.pagamentosUtilizaveisNoPeriodo.toLocaleString("pt-BR")} pagamentos utilizáveis; ${dados.pessoasIdentificadas.toLocaleString("pt-BR")} pessoas identificadas (deduplicadas no período).`
          : null,
        dados?.semPessoaNoPeriodo
          ? `${dados.semPessoaNoPeriodo.toLocaleString("pt-BR")} pagamento(s) com identidade canônica, mas sem pessoa, incluído(s) separadamente.`
          : null,
        dados?.ordemHistoricaIncertaNoPeriodo
          ? `${dados.ordemHistoricaIncertaNoPeriodo.toLocaleString("pt-BR")} pagamento(s) de pessoa conhecida com ordem histórica incerta.`
          : null,
        dados?.identidadesConflitantesNoHistorico
          ? `${dados.identidadesConflitantesNoHistorico.toLocaleString("pt-BR")} identidade(s) excluída(s) por conflito de valor ou instante no histórico; ${dados.identidadesConflitantesComDataCandidataNoPeriodo.toLocaleString("pt-BR")} têm alguma data candidata neste período.`
          : null,
        breakdown.length > 0
          ? `Meios e provedores: ${breakdown.join(" · ")}.`
          : null,
        dados
          ? `Ocorrências consideradas até ${new Date(dados.cobertura.calculadoAte).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}. Consulta entre ${new Date(dados.cobertura.consultaIniciadaEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} e ${new Date(dados.cobertura.consultaConcluidaEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}; sem fotografia transacional e sem cobertura histórica integral comprovada.`
          : null,
        dados &&
        (dados.cobertura.excluidos.identidadeAusente > 0 ||
          dados.cobertura.excluidos.dataInvalida > 0)
          ? `Exclusões no histórico lido: ${dados.cobertura.excluidos.identidadeAusente.toLocaleString("pt-BR")} sem identidade canônica e ${dados.cobertura.excluidos.dataInvalida.toLocaleString("pt-BR")} com data inválida.`
          : null,
      ].filter((item): item is string => Boolean(item))}
      extra={
        dados ? (
          <div className="mt-2 space-y-2 text-xs font-bold text-slate-600">
            <ul
              aria-label="Legenda dos pagamentos registrados"
              data-testid="legenda-pagamentos"
              className="flex flex-wrap gap-x-4 gap-y-1"
            >
              {[
                ["var(--color-violet-600)", "Primeiro pagamento observado"],
                ["var(--chart-3)", "Pagamentos posteriores"],
                ["var(--color-slate-400)", "Sem pessoa identificada"],
                ["var(--chart-4)", "Ordem histórica incerta"],
              ].map(([color, label]) => (
                <li key={label} className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </li>
              ))}
            </ul>
            <p>
              Primeiro pagamento observado é o menor recebimento utilizável por
              pessoa no histórico local. Pagamentos posteriores não são chamados
              de renovação ou reativação sem evidência de contrato e acesso.
            </p>
          </div>
        ) : null
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={pontos}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis {...eixoX(pontos)} />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fontWeight: 700 }}
          />
          <Tooltip labelFormatter={rotuloDeDia} />
          <Bar
            dataKey="primeiro"
            name="Primeiro pagamento observado"
            stackId="pagamentos"
            fill="var(--color-violet-600)"
            isAnimationActive={false}
          />
          <Bar
            dataKey="ordemIncerta"
            name="Ordem histórica incerta"
            stackId="pagamentos"
            fill="var(--chart-4)"
            isAnimationActive={false}
          />
          <Bar
            dataKey="posterior"
            name="Pagamentos posteriores"
            stackId="pagamentos"
            fill="var(--chart-3)"
            isAnimationActive={false}
          />
          <Bar
            dataKey="semClassificacao"
            name="Sem pessoa identificada"
            stackId="pagamentos"
            fill="var(--color-slate-400)"
            isAnimationActive={false}
          />
          {pontos.length > DIAS_PARA_NAVEGACAO ? (
            <Brush
              dataKey="date"
              height={18}
              travellerWidth={8}
              stroke="var(--color-violet-600)"
              tickFormatter={rotuloDeDia}
              startIndex={Math.max(0, pontos.length - DIAS_PARA_NAVEGACAO)}
            />
          ) : null}
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

// ---------------------------------------------------------------------------

/**
 * Custo de IA contra receita (D12).
 *
 * UMA ESCALA SÓ quando há cotação (`cotacaoUsdBrl`): as duas séries viram BRL e
 * dividem o eixo, que é a única forma de a comparação ser visual.
 *
 * SEM cotação, DOIS PAINÉIS ALINHADOS pelo eixo X, nunca um eixo duplo. Eixo
 * duplo com unidades diferentes deixa a proporção entre as curvas depender da
 * escala escolhida, e quem lê enxerga uma relação que o dado não sustenta.
 *
 * SELO "custo parcial" enquanto a Fase 5 não fechar a instrumentação: o custo
 * exibido é um piso (7 ferramentas gravam custo 0), e um gráfico de margem sobre
 * um piso afirma uma margem melhor que a real.
 */
export function CostVsRevenueChart({
  series,
  cotacaoUsdBrl,
  chamadasSemCustoMedido,
  erro,
  carregando,
}: {
  series?: SerieNomeada[] | null;
  cotacaoUsdBrl?: number | null;
  chamadasSemCustoMedido?: number | null;
  erro?: string | null;
  carregando?: boolean;
}) {
  const receita = serieDe(series, "receitaBrutaCents");
  const custo = serieDe(series, "custoIaUsd");
  const temCotacao = typeof cotacaoUsdBrl === "number" && cotacaoUsdBrl > 0;
  const vazio = receita.length === 0 && custo.length === 0;

  const parcial =
    typeof chamadasSemCustoMedido === "number" && chamadasSemCustoMedido > 0;

  // BADGE POR SERIE, cada uma na SUA unidade. A v1 mandava as duas séries para
  // um `tendenciaDeFluxo` só e imprimia centavos crus ("39333 -> 14846"), que
  // não é receita nem custo: é o número interno vazando na tela.
  //
  // REGRA DA COMPARACAO, escrita aqui e enunciada no rodapé: metade final do
  // período contra metade inicial, dias completos apenas (o dia de hoje é
  // parcial e puxaria a segunda metade para baixo todo dia de manhã).
  const metades = (pontos: PontoSerie[]) => {
    const completos = pontos.filter((p) => !p.partial);
    if (completos.length < 4) return null;
    const meio = Math.floor(completos.length / 2);
    const soma = (xs: PontoSerie[]) =>
      xs.reduce((a, p) => a + (typeof p.value === "number" ? p.value : 0), 0);
    return {
      antes: soma(completos.slice(0, meio)),
      depois: soma(completos.slice(meio)),
    };
  };
  const badgeReceita = metades(receita);
  const badgeCusto = metades(custo);
  const rodape = [
    "Comparação: soma da segunda metade do período contra a primeira, só dias completos.",
    parcial
      ? `Custo parcial: ${chamadasSemCustoMedido.toLocaleString("pt-BR")} chamadas sem custo medido no período.`
      : null,
    temCotacao
      ? `Custo convertido a ${cotacaoUsdBrl!.toLocaleString("pt-BR")} BRL/USD.`
      : "Sem cotação configurada: receita em BRL e custo em US$, em painéis separados e alinhados pelo mesmo eixo de dias.",
  ].filter((x): x is string => Boolean(x));

  const dadosUnificados = receita.map((p, i) => ({
    date: p.date,
    receita: (typeof p.value === "number" ? p.value : 0) / 100,
    custo: temCotacao
      ? (typeof custo[i]?.value === "number" ? custo[i].value! : 0) *
        cotacaoUsdBrl!
      : 0,
  }));

  return (
    <ChartFrame
      titulo="Custo de IA e receita"
      pergunta="O custo de IA acompanha a receita?"
      testId="grafico-custo-receita"
      erro={erro ?? null}
      vazio={vazio}
      carregando={Boolean(carregando)}
      tendencia={tendenciaDeFluxo(comoFluxo(receita))}
      rodape={rodape}
      extra={
        <div
          data-testid="custo-receita-badges"
          className="mt-2 flex flex-wrap gap-3 text-xs font-black uppercase"
        >
          {badgeReceita ? (
            <span data-testid="badge-receita" className="text-emerald-700">
              receita{" "}
              {(badgeReceita.antes / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}{" "}
              →{" "}
              {(badgeReceita.depois / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          ) : null}
          {badgeCusto ? (
            <span
              data-testid="badge-custo"
              className={
                badgeCusto.depois > badgeCusto.antes
                  ? "text-rose-700"
                  : "text-emerald-700"
              }
            >
              custo US$ {badgeCusto.antes.toFixed(2)} → US${" "}
              {badgeCusto.depois.toFixed(2)}
            </span>
          ) : null}
        </div>
      }
    >
      {temCotacao ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dadosUnificados}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis {...eixoX(dadosUnificados)} />
            <YAxis tick={{ fontSize: 11, fontWeight: 700 }} />
            <Tooltip labelFormatter={rotuloDeDia} />
            <Line
              type="monotone"
              dataKey="receita"
              name="Receita (R$)"
              stroke="var(--chart-3)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="custo"
              name="Custo de IA (R$)"
              stroke="var(--chart-5)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div
          data-testid="custo-receita-paineis-separados"
          className="flex h-full flex-col gap-1"
        >
          <ResponsiveContainer width="100%" height="50%">
            <LineChart data={comoFluxo(receita)}>
              <XAxis {...eixoX(receita)} hide />
              <YAxis hide />
              <Tooltip
                labelFormatter={rotuloDeDia}
                formatter={(v: number) => [
                  (v / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
                  "receita",
                ]}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height="50%">
            <LineChart data={comoFluxo(custo)}>
              <XAxis {...eixoX(custo)} />
              <YAxis hide />
              <Tooltip
                labelFormatter={rotuloDeDia}
                formatter={(v: number) => [
                  `US$ ${v.toFixed(2)}`,
                  "custo de IA",
                ]}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--chart-5)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartFrame>
  );
}
