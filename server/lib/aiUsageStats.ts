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
// `MODEL_PRICING` de `server/lib/aiTools.ts`, declarada, no proprio arquivo,
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

/**
 * A JANELA DA ABA IA, em um lugar so.
 *
 * Trinta dias e o recorte que a aba inteira usa, e ate 2026-08-22 ele existia
 * como uma expressao literal dentro da rota /ai-stats. A tabela de custo por
 * usuario precisa do MESMO recorte para a soma dela bater com o card de custo
 * total ao lado; duas expressoes iguais em dois arquivos batem hoje e divergem
 * na primeira vez que alguem mexer em uma so, e a divergencia apareceria como
 * dois numeros plausiveis na mesma tela, que e o pior jeito de errar.
 *
 * A aba NAO tem seletor de janela (decisao de produto de 2026-08-22: dar um
 * seletor a aba inteira e frente propria). Enquanto nao tiver, este e o unico
 * lugar onde o recorte se decide.
 */
export const AI_STATS_JANELA_DIAS = 30;

/** Inicio da janela da aba IA, em ISO. Fonte unica: ver o bloco acima. */
export function inicioDaJanelaDeIa(agora: Date = new Date()): string {
  return new Date(
    agora.getTime() - AI_STATS_JANELA_DIAS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

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

/** Uma linha do ranking de custo por usuario. `cost` em DOLAR, como o resto. */
export type AiUsageByUserRow = {
  calls: number;
  success: number;
  cost: number;
  semCustoMedido: number;
};

export type AiUsageByUser = {
  /** Ranking por custo desc, ja cortado no topo pedido. */
  top: Array<{ userId: string } & AiUsageByUserRow>;
  /**
   * O balde de `user_id` NULL, ou null quando nao ha nenhuma linha assim.
   *
   * NAO entra no ranking e NAO e descartado. Descartar faria a soma das linhas
   * exibidas ficar menor que o custo total da aba sem nada explicando a
   * diferenca, que e a forma silenciosa de errar; misturar no ranking daria a
   * um balde o lugar de uma pessoa.
   */
  semUsuario: AiUsageByUserRow | null;
  /**
   * Quantos usuarios ficaram FORA do `top`. Zero quando o ranking inteiro coube.
   *
   * O resto e estado nomeado: "e mais N usuarios" e informacao, um corte mudo
   * em 20 linhas e um numero que parece o total e nao e.
   */
  maisUsuarios: number;
  /** Usuarios distintos com custo atribuido, o balde NULL de fora. */
  usuariosDistintos: number;
};

/**
 * Custo de IA agregado POR USUARIO, a partir de uma data.
 *
 * MESMA definicao de `agregarUsoDeIa`, de proposito: NaN de `cost_estimate`
 * conta como nao medido e nunca contamina a soma, e `semCustoMedido` e sucesso
 * com custo nao-finito ou zero. Se as duas divergirem, a tabela por usuario e o
 * card por ferramenta passam a somar custos diferentes sobre as MESMAS linhas.
 *
 * PAGINADO pelo mesmo motivo que a irma: o PostgREST corta em 1000 linhas e o
 * erro cresce com o volume sem acusar nada.
 */
export async function custoDeIaPorUsuario(
  desdeIso: string,
  topN: number,
): Promise<AiUsageByUser> {
  const porUsuario = new Map<string, AiUsageByUserRow>();
  let semUsuario: AiUsageByUserRow | null = null;

  const novaLinha = (): AiUsageByUserRow => ({
    calls: 0,
    success: 0,
    cost: 0,
    semCustoMedido: 0,
  });

  // A ORDENACAO NAO E ENFEITE: paginacao por OFFSET sem ORDER BY tem ordem
  // indefinida no Postgres, e duas paginas podem repetir ou pular linhas.
  const linhas = await coletarTudo<{
    user_id: string | null;
    status: string | null;
    cost_estimate: string | null;
  }>(
    (from, to) =>
      supabaseAdmin
        .from("ai_usage_logs")
        .select("user_id, status, cost_estimate")
        .gte("created_at", desdeIso)
        .order("id", { ascending: true })
        .range(from, to),
    "ai-cost-per-user",
  );

  for (const log of linhas) {
    let alvo: AiUsageByUserRow;
    if (log.user_id === null || log.user_id === undefined) {
      semUsuario = semUsuario ?? novaLinha();
      alvo = semUsuario;
    } else {
      alvo = porUsuario.get(log.user_id) ?? novaLinha();
      porUsuario.set(log.user_id, alvo);
    }
    alvo.calls += 1;
    const sucesso = log.status === "success";
    if (sucesso) alvo.success += 1;
    const custo = parseFloat(log.cost_estimate || "0");
    if (Number.isFinite(custo)) alvo.cost += custo;
    if (sucesso && (!Number.isFinite(custo) || custo === 0)) {
      alvo.semCustoMedido += 1;
    }
  }

  const ordenados: Array<{ userId: string } & AiUsageByUserRow> = [];
  porUsuario.forEach((row, userId) => ordenados.push({ userId, ...row }));
  ordenados
    // Desempate por `userId` depois do custo: sem ele, dois usuarios de mesmo
    // custo trocam de lugar entre requisicoes e o corte do topo fica instavel.
    .sort((a, b) => b.cost - a.cost || a.userId.localeCompare(b.userId));

  return {
    top: ordenados.slice(0, topN),
    semUsuario,
    maisUsuarios: Math.max(0, ordenados.length - topN),
    usuariosDistintos: ordenados.length,
  };
}
