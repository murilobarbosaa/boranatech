import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { adminFetch } from "@/lib/adminApi";

import { intervaloDeRotulos, rotuloDeDia, tendenciaDeFluxo } from "./chartMath";
import { ChartFrame } from "./ChartFrame";
import type { OverviewWindow } from "./OverviewPeriod";

// CADASTROS POR DIA.
//
// A PERGUNTA: o topo do funil está enchendo ou secando?
//
// BARRA, não linha, e a escolha é semântica. Linha liga um ponto ao seguinte e
// sugere que existe valor entre eles; cadastro por dia é uma CONTAGEM fechada,
// não uma grandeza contínua. Barra também deixa o zero legível como zero.
//
// DIÁRIO, e foi medido: ver o cabeçalho de `server/lib/signupSeries.ts`. A
// decisão original era semanal, tomada quando a série era serrilhada; hoje são
// 19 dias consecutivos com cadastro e agrupar por semana esconderia o formato.
//
// ZERO É MEDIÇÃO. Aqui, ao contrário do gráfico de snapshots, dia sem linha é um
// zero de verdade: ninguém se cadastrou. A barra é desenhada com altura zero e
// não há buraco a declarar.

type Ponto = { date: string; count: number; partial: boolean };

type Serie = {
  window: string;
  points: Ponto[];
  firstSignupDate: string | null;
  lastDate: string | null;
  /**
   * Rótulo do intervalo e fuso, CALCULADOS NO SERVIDOR pela mesma função que os
   * cards usam (`rotuloDeIntervalo`). É o par que provava divergir: card e
   * gráfico diziam "últimos 30 dias" e mediam populações diferentes, 4.788
   * contra 4.606 em 2026-08-14. Vindo pronto, os dois dizem o mesmo texto ou
   * nenhum diz.
   */
  windowLabel?: string | null;
  tz?: string | null;
};

export function SignupChart({ window: janela }: { window: OverviewWindow }) {
  const [data, setData] = useState<Serie | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setData(null);
    setErro(null);
    adminFetch(`/signup-history?window=${janela}`)
      .then((json) => {
        if (!cancelado) setData(json.data as Serie);
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        setErro(
          err instanceof Error ? err.message : "Erro ao carregar os cadastros.",
        );
      });
    return () => {
      cancelado = true;
    };
  }, [janela]);

  const pontos = data?.points ?? [];
  const tendencia = tendenciaDeFluxo(pontos);
  const barras = pontos.map((p) => ({
    rotulo: rotuloDeDia(p.date),
    cadastros: p.count,
    partial: p.partial,
  }));

  return (
    <ChartFrame
      titulo="Cadastros por dia"
      pergunta="O topo do funil está enchendo ou secando?"
      testId="grafico-cadastros"
      erro={erro}
      vazio={data !== null && pontos.length === 0}
      carregando={data === null}
      rodape={rodapeDeCadastros(data, janela)}
      tendencia={tendencia}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={barras}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="rotulo"
            interval={intervaloDeRotulos(barras.length, 6)}
            tick={{ fontSize: 11, fontWeight: 700, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            // Contagem por dia SEMPRE começa em zero: a altura da barra é a
            // única coisa que ela comunica, e truncar o eixo aqui multiplicaria
            // visualmente uma diferença de dez cadastros.
            domain={[0, "auto"]}
            allowDecimals={false}
            tick={{ fontSize: 11, fontWeight: 700, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            formatter={(valor: unknown, _nome: unknown, item: unknown) => [
              `${valor}${
                (item as { payload?: { partial?: boolean } })?.payload?.partial
                  ? " (dia em andamento)"
                  : ""
              }`,
              "Cadastros",
            ]}
            labelFormatter={(rotulo: string) => `Dia ${rotulo}`}
            contentStyle={{
              borderRadius: 12,
              border: "2px solid var(--bnt-ink)",
              background: "var(--card)",
              color: "var(--foreground)",
              fontSize: 12,
              fontWeight: 700,
            }}
          />
          <Bar dataKey="cadastros" name="Cadastros" radius={[4, 4, 0, 0]}>
            {barras.map((b) => (
              // O DIA DE HOJE SAI HACHURADO, com cor mais fraca. Ele é parcial
              // por construção, e uma barra cheia no último lugar leria como
              // queda todo dia de manhã. Marca visual mais frase no rodapé: a
              // cor sozinha não é acessível.
              <Cell
                key={b.rotulo}
                fill={b.partial ? "var(--color-violet-300)" : "var(--color-violet-600)"}
                stroke={b.partial ? "var(--color-violet-600)" : undefined}
                strokeWidth={b.partial ? 2 : 0}
                strokeDasharray={b.partial ? "3 2" : undefined}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function rodapeDeCadastros(
  data: Serie | null,
  janela: OverviewWindow,
): string[] {
  // `points` ausente NAO pode virar TypeError: na janela de deploy o frontend
  // novo fala com o backend antigo, e este rodapé roda no corpo do componente,
  // então uma leitura solta aqui derruba o gráfico inteiro em vez de degradar.
  if (!data || !Array.isArray(data.points) || data.points.length === 0) {
    return [];
  }
  const avisos: string[] = [];

  // INTERVALO EXPLICITO, primeiro aviso: "últimos N dias" é o rótulo que
  // permitia dois blocos com janelas diferentes parecerem o mesmo recorte.
  if (data.windowLabel) {
    avisos.push(
      `Período: ${data.windowLabel}${data.tz ? ` (${data.tz})` : ""}.`,
    );
  }
  if (data.points.some((p) => p.partial)) {
    avisos.push(
      "A última barra é o dia de hoje, ainda em andamento: o número vai subir.",
    );
  }

  // JANELA MAIOR QUE A BASE: dizer desde quando, em vez de desenhar zeros
  // anteriores ao primeiro cadastro como se fossem dias medidos e vazios.
  const diasPedidos = janela === "all" ? null : Number(janela);
  if (
    diasPedidos !== null &&
    data.points.length < diasPedidos &&
    data.firstSignupDate
  ) {
    avisos.push(
      `A base começa em ${rotuloDeDia(data.firstSignupDate)}: o período exibido tem ${data.points.length} dia(s), não ${diasPedidos}.`,
    );
  }
  if (janela === "all" && data.firstSignupDate) {
    avisos.push(
      `Desde o primeiro cadastro, em ${rotuloDeDia(data.firstSignupDate)}.`,
    );
  }
  return avisos;
}
