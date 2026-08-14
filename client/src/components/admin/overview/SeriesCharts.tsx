import {
  Bar,
  BarChart,
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
 * `value` vira estado "vazio", nunca TypeError — no render da Visão um throw
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

function eixoX(pontos: Array<{ date: string }>) {
  return {
    dataKey: "date" as const,
    tickFormatter: rotuloDeDia,
    interval: intervaloDeRotulos(pontos.length, 6),
    tick: { fontSize: 11, fontWeight: 700 },
  };
}

// ---------------------------------------------------------------------------

export function ProConversionsChart({
  series,
  erro,
  carregando,
}: {
  series?: SerieNomeada[] | null;
  erro?: string | null;
  carregando?: boolean;
}) {
  const pontos = comoFluxo(serieDe(series, "conversoesPro"));
  const total = pontos.reduce((a, p) => a + p.count, 0);

  return (
    <ChartFrame
      titulo="Conversões Pro por dia"
      pergunta="Quantas pessoas passaram a pagar, por dia?"
      testId="grafico-conversoes-pro"
      erro={erro ?? null}
      vazio={pontos.length === 0}
      carregando={Boolean(carregando)}
      tendencia={tendenciaDeFluxo(pontos)}
      rodape={[
        // A definição vai na tela: sem ela, "conversão" é uma palavra que cada
        // pessoa preenche de um jeito.
        "Conversão = primeira assinatura da pessoa, pelo dia em que ela nasceu.",
        `Total no período: ${total.toLocaleString("pt-BR")}.`,
      ]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={pontos}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis {...eixoX(pontos)} />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fontWeight: 700 }}
          />
          <Tooltip
            labelFormatter={rotuloDeDia}
            formatter={(v: number) => [v, "conversões"]}
          />
          <Bar dataKey="count" fill="#7c3aed" isAnimationActive={false} />
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
  const rodape = [
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
              stroke="#059669"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="custo"
              name="Custo de IA (R$)"
              stroke="#e11d48"
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
                stroke="#059669"
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
                stroke="#e11d48"
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
