/**
 * Variação contra o período anterior, com a cor decidida pelo SERVIDOR.
 *
 * `direcao` ("up_bom" / "up_ruim") vem no payload junto da série. O componente
 * NÃO infere pelo nome da métrica, e o motivo é que a inferência erra em metade
 * dos casos desta tela: receita subindo é bom, custo de IA subindo é ruim,
 * "chamadas sem custo medido" subindo é ruim, e nada disso está no nome.
 *
 * AUSÊNCIA É AUSÊNCIA. Sem período anterior, ou com base zero, não há
 * percentual: o componente some em vez de exibir "0%" ou "+∞%". Um Δ falso é
 * pior que nenhum Δ, porque quem lê não tem como desconfiar de um número que
 * parece calculado.
 */

export function DeltaBadge({
  atual,
  anterior,
  direcao = "up_bom",
  testId = "delta-badge",
}: {
  atual?: number | null;
  anterior?: number | null;
  direcao?: "up_bom" | "up_ruim";
  testId?: string;
}) {
  if (
    typeof atual !== "number" ||
    typeof anterior !== "number" ||
    !Number.isFinite(atual) ||
    !Number.isFinite(anterior)
  ) {
    return null;
  }
  // Base zero: a variação seria infinita. O delta absoluto continua verdadeiro,
  // mas percentual sobre nada não é medida.
  if (anterior === 0) return null;

  const pct = ((atual - anterior) / Math.abs(anterior)) * 100;
  const subiu = pct > 0;
  const parado = Math.abs(pct) < 0.05;
  const bom = direcao === "up_bom" ? subiu : !subiu;

  const tom = parado
    ? "text-slate-500"
    : bom
      ? "text-emerald-700"
      : "text-rose-700";
  const sinal = parado ? "" : subiu ? "+" : "";

  return (
    <span
      data-testid={testId}
      data-tom={parado ? "neutro" : bom ? "alta" : "baixa"}
      className={`text-xs font-black uppercase tracking-wide ${tom}`}
    >
      {parado
        ? "estável vs período anterior"
        : `${sinal}${pct.toFixed(1).replace(".", ",")}% vs período anterior`}
    </span>
  );
}
