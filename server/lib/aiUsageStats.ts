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

// A UNIDADE DO `cost` E DOLAR, e o nome do campo nao diz isso porque ele veio de
// antes de a unidade importar. `cost_estimate` e gravado por `logAiUsage` com o
// retorno de `estimateCostFromTokens`, que multiplica tokens pela tabela
// `MODEL_PRICING` de `server/lib/aiTools.ts` — declarada, no proprio arquivo,
// como "US$ por 1 milhao de tokens". Ate 2026-08-14 este modulo dizia na
// docstring "custo total em reais" e o admin formatava com `currency: "BRL"`:
// o painel exibia R$ 2,41 onde o valor era US$ 2,41.
export type AiUsageByTool = Record<
  string,
  {
    calls: number;
    success: number;
    /** Soma de `cost_estimate` em DOLAR. Ver o bloco acima. */
    cost: number;
    /**
     * Chamadas que EXECUTARAM (status success) e mesmo assim vieram sem custo.
     *
     * Nao e o mesmo que "custou zero": sao as ferramentas cujo call site nao
     * passa `costEstimate` para `logAiUsage`, que grava `costEstimate || 0`.
     * Medidas em 2026-08-14: 251 chamadas em 7 ferramentas (github-perfil,
     * career-plan, interview-turn, github-repo, interview-session,
     * study-plan-build, interview), das quais 233 com status success.
     *
     * Existe para a tela poder dizer "N chamadas sem custo medido" em vez de
     * somar zero e afirmar uma margem melhor que a real. Linhas de erro,
     * rate_limited e unauthorized NAO entram: elas nao chamaram o modelo, e
     * custo zero nelas e o valor certo.
     */
    semCustoMedido: number;
  }
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
    if (!stats[log.tool])
      stats[log.tool] = { calls: 0, success: 0, cost: 0, semCustoMedido: 0 };
    stats[log.tool].calls += 1;
    const sucesso = log.status === "success";
    if (sucesso) stats[log.tool].success += 1;
    const custo = parseFloat(log.cost_estimate || "0");
    // NaN de `cost_estimate` ilegivel nao pode contaminar a soma inteira: ele
    // conta como nao medido, que e o que de fato e.
    if (Number.isFinite(custo)) stats[log.tool].cost += custo;
    if (sucesso && (!Number.isFinite(custo) || custo === 0)) {
      stats[log.tool].semCustoMedido += 1;
    }
  }

  return stats;
}

/** Custo total do agregado, em DOLAR. Uma soma, num lugar so. */
export function custoTotalDeIa(stats: AiUsageByTool): number {
  return Object.values(stats).reduce((soma, item) => soma + item.cost, 0);
}

/**
 * Quantas chamadas bem-sucedidas do agregado nao tem custo medido.
 *
 * Vai ao lado do total, nunca somada nele: e o denominador que diz o quanto o
 * numero acima e um PISO. Sem isto, "US$ 2,41" parece completo.
 */
export function chamadasSemCustoMedido(stats: AiUsageByTool): number {
  return Object.values(stats).reduce(
    (soma, item) => soma + item.semCustoMedido,
    0,
  );
}
