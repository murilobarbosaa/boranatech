import { coletarTudo } from "./paginate";
import { supabaseAdmin } from "./supabaseAdmin";

// Agregado de uso de IA por ferramenta, a partir de uma data.
//
// EXTRAIDO da rota /ai-stats para ser consumido tambem pela Visao, que precisa
// do MESMO custo para um periodo escolhido pelo seletor. Duas somas do mesmo
// dado divergiriam na primeira mudanca de criterio (o que conta como sucesso, o
// que entra no custo), e a Visao passaria a mostrar um custo de IA diferente do
// que a aba IA mostra.
//
// PAGINADO: ate 2026-07-31 a rota lia sem paginar e o PostgREST cortava em 1000
// linhas, entao o painel exibia R$ 1,45 onde o custo era R$ 1,58 sobre 1167
// chamadas. O erro cresce com o volume e nao acusa nada.

export type AiUsageByTool = Record<
  string,
  { calls: number; success: number; cost: number }
>;

export async function agregarUsoDeIa(desdeIso: string): Promise<AiUsageByTool> {
  const stats: AiUsageByTool = {};

  // A ORDENACAO NAO E ENFEITE: paginacao por OFFSET sem ORDER BY tem ordem
  // indefinida no Postgres, e duas paginas podem repetir ou pular linhas.
  const linhas = await coletarTudo<{
    tool: string;
    status: string | null;
    cost_estimate: string | null;
  }>(
    (from, to) =>
      supabaseAdmin
        .from("ai_usage_logs")
        .select("tool, status, cost_estimate")
        .gte("created_at", desdeIso)
        .order("id", { ascending: true })
        .range(from, to),
    "ai-stats",
  );

  for (const log of linhas) {
    if (!stats[log.tool]) stats[log.tool] = { calls: 0, success: 0, cost: 0 };
    stats[log.tool].calls += 1;
    if (log.status === "success") stats[log.tool].success += 1;
    stats[log.tool].cost += parseFloat(log.cost_estimate || "0");
  }

  return stats;
}

/** Custo total em reais do agregado. Uma soma, num lugar so. */
export function custoTotalDeIa(stats: AiUsageByTool): number {
  return Object.values(stats).reduce((soma, item) => soma + item.cost, 0);
}
