import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { adminFetch } from "@/lib/adminApi";

import {
  dominioDoEixoY,
  intervaloDeRotulos,
  rotuloDeDia,
  tendenciaDeNivel,
} from "./chartMath";
import { ChartFrame } from "./ChartFrame";
import type { OverviewWindow } from "./OverviewPeriod";

// MRR E ASSINANTES ATIVOS, dia a dia, de `subscription_snapshots`.
//
// A PERGUNTA: a receita recorrente está subindo, e ela sobe junto com o número
// de assinantes ou descolou? As duas linhas juntas respondem as duas: descolar
// significa que o ticket médio mudou, e é a única leitura que um número sozinho
// não dá.
//
// A LINHA QUEBRA NO BURACO. Dia sem snapshot volta com `missing: true` e
// métricas nulas, e `connectNulls={false}` faz o Recharts INTERROMPER o traço.
// Uma reta atravessando o buraco afirmaria um valor que ninguém mediu, e o
// gráfico não teria como se desmentir depois.

type Ponto = {
  date: string;
  missing: boolean;
  activeCount: number | null;
  mrrCents: number | null;
};

type Historico = {
  window: string;
  points: Ponto[];
  firstSnapshotDate: string | null;
  lastSnapshotDate: string | null;
  staleDays: number | null;
  gaps: string[];
  truncated: boolean;
  /**
   * Intervalo e fuso, do servidor. Este bloco tem janela PRÓPRIA: ela termina no
   * último snapshot, não em hoje (o cron grava às 05:10 UTC). Dizer só "últimos
   * 30 dias" o faria parecer o mesmo recorte dos cards, que é exatamente o
   * defeito que a Fase 2 fechou.
   */
  windowLabel?: string | null;
  tz?: string | null;
};

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function SubscriptionChart({
  window: janela,
}: {
  window: OverviewWindow;
}) {
  const [data, setData] = useState<Historico | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setData(null);
    setErro(null);
    adminFetch(`/subscription-history?window=${janela}`)
      .then((json) => {
        if (!cancelado) setData(json.data as Historico);
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        // ERRO É ESTADO NOMEADO. Gráfico vazio por falha de leitura desenharia
        // uma tela plana, que afirma "não houve receita".
        setErro(
          err instanceof Error ? err.message : "Erro ao carregar o histórico.",
        );
      });
    return () => {
      cancelado = true;
    };
  }, [janela]);

  const pontos = data?.points ?? [];
  const mrrBrl = pontos.map((p) =>
    p.mrrCents === null ? null : p.mrrCents / 100,
  );
  const dominio = dominioDoEixoY(mrrBrl.filter((v): v is number => v !== null));
  const tendencia = tendenciaDeNivel(mrrBrl, (v) => brl.format(v));

  const linhas = pontos.map((p, i) => ({
    date: p.date,
    rotulo: rotuloDeDia(p.date),
    mrr: mrrBrl[i],
    ativos: p.activeCount,
  }));

  return (
    <ChartFrame
      titulo="Receita recorrente e assinantes"
      pergunta="A receita está subindo, e junto com a base?"
      testId="grafico-assinaturas"
      erro={erro}
      vazio={data !== null && pontos.length === 0}
      carregando={data === null}
      rodape={rodapeDeSnapshots(data, dominio.truncado)}
      tendencia={tendencia}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={linhas}
          margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="rotulo"
            // RÓTULOS RAREIAM, os pontos não. Em 380px cabem ~5 datas; a curva
            // continua inteira. A alternativa (rolagem horizontal) esconderia
            // metade da série atrás de um gesto que ninguém faz num painel.
            interval={intervaloDeRotulos(linhas.length, 6)}
            tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            yAxisId="mrr"
            domain={[dominio.min, "auto"]}
            tickFormatter={(v: number) => brl.format(v)}
            tick={{ fontSize: 11, fontWeight: 700, fill: "var(--color-violet-600)" }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <YAxis
            yAxisId="ativos"
            orientation="right"
            domain={[0, "auto"]}
            allowDecimals={false}
            tick={{ fontSize: 11, fontWeight: 700, fill: "#0f766e" }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            formatter={(valor, nome) =>
              nome === "MRR"
                ? [brl.format(Number(valor)), "MRR"]
                : [String(valor), "Assinantes ativos"]
            }
            labelFormatter={(rotulo: string) => `Dia ${rotulo}`}
            contentStyle={{
              borderRadius: 12,
              border: "2px solid #0f172a",
              fontSize: 12,
              fontWeight: 700,
            }}
          />
          <Line
            yAxisId="mrr"
            type="monotone"
            dataKey="mrr"
            name="MRR"
            stroke="var(--color-violet-600)"
            strokeWidth={3}
            dot={false}
            // O ponto isolado (medição cercada de buracos dos dois lados) só é
            // visível como bolinha: sem `dot`, uma linha que não conecta nada
            // não desenha nada, e o dia medido sumiria.
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
          <Line
            yAxisId="ativos"
            type="monotone"
            dataKey="ativos"
            name="Assinantes ativos"
            stroke="#0f766e"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/**
 * O rodapé do gráfico: só o que é excepcional.
 *
 * SEM CONTRADIZER A FAIXA DE SAÚDE. Quando o cron para, a faixa já diz que
 * parou, com severidade. Aqui a frase é factual e sem alarme, sobre o efeito no
 * DESENHO: até onde a linha vai. Dois alarmes para o mesmo fato ensinariam a
 * ignorar os dois; nenhum aviso deixaria a pessoa lendo uma linha que termina em
 * 27/07 achando que é hoje.
 */
function rodapeDeSnapshots(
  data: Historico | null,
  eixoTruncado: boolean,
): string[] {
  // `points` ausente NAO pode virar TypeError: na janela de deploy o frontend
  // novo fala com o backend antigo, e este rodapé roda no corpo do componente,
  // então uma leitura solta aqui derruba o gráfico inteiro em vez de degradar.
  if (!data || !Array.isArray(data.points) || data.points.length === 0) {
    return [];
  }
  const avisos: string[] = [];

  if (data.windowLabel) {
    avisos.push(
      `Período: ${data.windowLabel}${data.tz ? ` (${data.tz})` : ""}, terminando no último snapshot.`,
    );
  }

  if (data.staleDays !== null && data.staleDays > 1 && data.lastSnapshotDate) {
    avisos.push(
      `A série termina em ${rotuloDeDia(data.lastSnapshotDate)}: é a última medição registrada.`,
    );
  }
  // `gaps` recebe o mesmo tratamento que `points`: o guard acima cobre um campo
  // só, e um payload com pontos e sem buracos passaria por ele e estouraria aqui.
  const gaps = Array.isArray(data.gaps) ? data.gaps : [];
  if (gaps.length > 0) {
    avisos.push(
      `${gaps.length} ${gaps.length === 1 ? "dia sem medição" : "dias sem medição"} (${gaps
        .slice(0, 3)
        .map(rotuloDeDia)
        .join(
          ", ",
        )}${gaps.length > 3 ? "..." : ""}): a linha interrompe, não atravessa.`,
    );
  }
  if (eixoTruncado) {
    // OBRIGATÓRIO quando o eixo não começa em zero: sem esta frase, o gráfico
    // exagera a inclinação e ninguém tem como saber.
    avisos.push("O eixo de MRR não começa em zero.");
  }
  if (data.truncated) {
    avisos.push("Série cortada no limite de pontos: exibindo o período final.");
  }
  return avisos;
}
