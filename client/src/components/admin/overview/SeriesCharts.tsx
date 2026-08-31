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
            formatter={(v: number) => [
              `${v} ${v === 1 ? "conversão" : "conversões"}`,
              "",
            ]}
          />
          <Bar dataKey="count" fill="var(--color-violet-600)" isAnimationActive={false} />
          {/* NAVEGACAO so quando ha o que navegar. O `Brush` ja vem no recharts
              que o projeto usa (nenhuma dependencia nova); abaixo de 31 dias ele
              seria um controle a mais sem funcao, ocupando altura do grafico. */}
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
