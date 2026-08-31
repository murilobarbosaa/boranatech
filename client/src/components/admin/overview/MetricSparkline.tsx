import { Line, LineChart, ResponsiveContainer } from "recharts";

/**
 * Sparkline de card: a FORMA da série, sem eixos, sem grade, sem tooltip.
 *
 * Existe para responder "isto vinha subindo?" no mesmo olhar que lê o número.
 * Quem quiser valor por dia abre o gráfico grande logo abaixo — duplicar eixos e
 * rótulos aqui competiria com ele e roubaria a altura do card.
 *
 * MESMA LIB dos gráficos existentes (recharts), sem dependência nova.
 *
 * ONDE NÃO USAR: com uma SÉRIE cumulativa. Um acumulado só sobe por construção,
 * então a linha é sempre a mesma diagonal ascendente e não carrega informação
 * nenhuma, é ruído com aparência de dado.
 *
 * A regra é sobre a SÉRIE, não sobre o card. O card "Usuários totais" era o
 * exemplo citado aqui e hoje TEM sparkline: ele plota `cadastros`, a derivada,
 * depois que o card de "Novos usuários" foi absorvido por ele. O que continuaria
 * proibido é plotar o total acumulado.
 */

export type PontoSparkline = { date: string; value: number | null };

export function MetricSparkline({
  pontos,
  direcao = "up_bom",
  testId = "sparkline",
}: {
  pontos?: PontoSparkline[] | null;
  /** Governa a cor. Vem do servidor; o componente não infere pelo nome. */
  direcao?: "up_bom" | "up_ruim";
  testId?: string;
}) {
  // PAYLOAD DEGRADADO NÃO DERRUBA O CARD. Série ausente, não-array ou curta
  // demais viram ausência silenciosa: um sparkline de um ponto é uma reta que
  // afirma estabilidade que ninguém mediu.
  const serie = Array.isArray(pontos) ? pontos : [];
  const medidos = serie.filter(
    (p): p is { date: string; value: number } =>
      p != null && typeof p.value === "number" && Number.isFinite(p.value),
  );
  if (medidos.length < 2) return null;

  const primeiro = medidos[0].value;
  const ultimo = medidos[medidos.length - 1].value;
  const subiu = ultimo > primeiro;
  const bom = direcao === "up_bom" ? subiu : !subiu;
  // Empate é neutro: pintar de verde ou vermelho uma série que não se moveu
  // seria inventar direção.
  const cor =
    ultimo === primeiro
      ? "var(--muted-foreground)"
      : bom
        ? "var(--chart-3)"
        : "var(--chart-5)";

  return (
    <div
      data-testid={testId}
      data-direcao={direcao}
      aria-hidden="true"
      className="mt-3 h-8 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={medidos}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={cor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
