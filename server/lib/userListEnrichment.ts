// Enriquecimento da LISTA de usuarios do admin: is_pro, pro_source, plan_code e
// subscription_status por linha da pagina.
//
// Por que nao chamar a RPC is_user_pro por linha: a pagina tem 50 linhas, e
// seriam 50 idas ao banco por request. Por que nao passar pelo
// resolveProStatus/cache Redis: aquele caminho existe para o request DE UM
// usuario decidindo o proprio acesso, com TTL de 60s; usar cache de acesso para
// alimentar listagem administrativa mistura duas coisas e faz o admin ver
// estado velho de ate um minuto.
//
// A contrapartida de nao chamar a RPC e que a regra do Pro passa a existir em
// DOIS lugares (SQL e TypeScript) e pode divergir em silencio. Contramedida:
// subscriptionGrantsPro abaixo enumera as condicoes uma a uma, cada uma com
// teste proprio, e este comentario aponta a fonte. Se a RPC mudar,
// server/lib/userListEnrichment.test.ts e o lugar que quebra.
//
// Fonte espelhada: supabase/migrations/20260716130100_add_influencer_to_is_user_pro.sql
//   ramo 1: subscriptions JOIN plans, plans.code <> 'free',
//           status in ('active','trialing'),
//           (current_period_end is null or current_period_end > now())
//   ramo 2: influencers com revoked_at is null

/** Status de assinatura que concedem acesso, conforme a RPC. */
const STATUS_QUE_DAO_PRO = new Set(["active", "trialing"]);

/** Codigo de plano que NAO concede acesso, conforme a RPC. */
const PLANO_SEM_PRO = "free";

export type SubscriptionRow = {
  user_id: string;
  status: string | null;
  current_period_end: string | null;
  created_at: string | null;
  // O PostgREST devolve o relacionamento ora como objeto, ora como array.
  plans: { code: string | null } | { code: string | null }[] | null;
};

export type ProSource = "subscription" | "influencer" | "both";

export type UserListEnrichment = {
  is_pro: boolean;
  // Discriminador para a UI. "both" existe porque assinatura e concessao de
  // influencer sao ORTOGONAIS: cancelar a assinatura de quem tambem e
  // influencer nao tira o Pro. Sem este valor a lista esconderia justamente o
  // caso em que uma acao administrativa nao produz o efeito esperado.
  pro_source: ProSource | null;
  plan_code: string | null;
  subscription_status: string | null;
};

export function planCodeOf(row: SubscriptionRow): string | null {
  const plan = Array.isArray(row.plans) ? row.plans[0] : row.plans;
  return plan?.code ?? null;
}

/**
 * Uma assinatura concede Pro? Espelha, condicao a condicao, o ramo de
 * assinatura da RPC is_user_pro. Fail-closed: status desconhecido nao concede.
 */
export function subscriptionGrantsPro(
  row: SubscriptionRow,
  now: Date,
): boolean {
  const planCode = planCodeOf(row);
  // INNER JOIN em plans na RPC: sem plano, sem linha, sem Pro.
  if (!planCode || planCode === PLANO_SEM_PRO) return false;
  if (!row.status || !STATUS_QUE_DAO_PRO.has(row.status)) return false;
  if (row.current_period_end === null) return true;
  const fim = new Date(row.current_period_end).getTime();
  // Data ilegivel nao vira "vitalicia": fail-closed.
  if (Number.isNaN(fim)) return false;
  return fim > now.getTime();
}

function tempo(value: string | null): number {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/**
 * Qual linha representa o usuario quando ha mais de uma assinatura.
 *
 * Ordem de desempate, deliberada:
 *   1. a que CONCEDE Pro vence a que nao concede (o que importa e o acesso);
 *   2. entre as que concedem, a de periodo mais distante (null = sem fim, vence
 *      qualquer data), porque e ela que determina ate quando o acesso dura;
 *   3. empate remanescente: a mais recente por created_at.
 * Se nenhuma concede, devolve a mais recente, para a coluna de status mostrar o
 * ultimo estado conhecido em vez de vazio.
 *
 * Em producao (2026-07-29) NENHUM usuario tem mais de uma linha em
 * subscriptions; isto existe para o dia em que tiver, nao para hoje.
 */
export function pickSubscription(
  rows: SubscriptionRow[],
  now: Date,
): SubscriptionRow | null {
  if (rows.length === 0) return null;

  const comPro = rows.filter((r) => subscriptionGrantsPro(r, now));
  const candidatas = comPro.length > 0 ? comPro : rows;

  return candidatas.reduce((melhor, atual) => {
    if (comPro.length > 0) {
      // null = sem fim: Infinity para vencer qualquer data.
      const fimMelhor =
        melhor.current_period_end === null
          ? Infinity
          : tempo(melhor.current_period_end);
      const fimAtual =
        atual.current_period_end === null
          ? Infinity
          : tempo(atual.current_period_end);
      if (fimAtual !== fimMelhor) return fimAtual > fimMelhor ? atual : melhor;
    }
    return tempo(atual.created_at) > tempo(melhor.created_at) ? atual : melhor;
  });
}

/**
 * Junta assinaturas e concessoes de influencer num indice por user_id. Usuario
 * sem nenhum dos dois nao entra: quem consome trata a ausencia como "sem
 * assinatura, sem Pro".
 */
export function buildEnrichmentIndex(
  subscriptions: SubscriptionRow[],
  activeInfluencerIds: Set<string>,
  now: Date,
): Map<string, UserListEnrichment> {
  const porUsuario = new Map<string, SubscriptionRow[]>();
  for (const row of subscriptions) {
    const lista = porUsuario.get(row.user_id);
    if (lista) lista.push(row);
    else porUsuario.set(row.user_id, [row]);
  }

  const index = new Map<string, UserListEnrichment>();

  // forEach em vez de for..of sobre Map/Set: o target do tsconfig nao habilita
  // downlevelIteration. Mesmo padrao de server/lib/authUsers.ts.
  porUsuario.forEach((rows, userId) => {
    const escolhida = pickSubscription(rows, now);
    const proPorAssinatura = escolhida
      ? subscriptionGrantsPro(escolhida, now)
      : false;
    const proPorInfluencer = activeInfluencerIds.has(userId);
    index.set(userId, {
      is_pro: proPorAssinatura || proPorInfluencer,
      pro_source: resolveProSource(proPorAssinatura, proPorInfluencer),
      plan_code: escolhida ? planCodeOf(escolhida) : null,
      subscription_status: escolhida?.status ?? null,
    });
  });

  // Influencers sem nenhuma assinatura ainda nao entraram no laco acima.
  activeInfluencerIds.forEach((userId) => {
    if (index.has(userId)) return;
    index.set(userId, {
      is_pro: true,
      pro_source: "influencer",
      plan_code: null,
      subscription_status: null,
    });
  });

  return index;
}

/**
 * Monta o discriminador de origem do Pro. EXPORTADO e usado tambem pela rota de
 * detalhe (GET /users/:id): sem isto, a lista e o modal montavam "both" cada um
 * do seu jeito, e duas montagens da mesma regra divergem na primeira mudanca.
 */
export function resolveProSource(
  porAssinatura: boolean,
  porInfluencer: boolean,
): ProSource | null {
  if (porAssinatura && porInfluencer) return "both";
  if (porAssinatura) return "subscription";
  if (porInfluencer) return "influencer";
  return null;
}

export type EnrichmentLookups = {
  /** Assinaturas de TODOS os ids da pagina, numa consulta so. */
  bySubscription: (userIds: string[]) => Promise<SubscriptionRow[]>;
  /** user_ids com concessao de influencer ativa, numa consulta so. */
  byInfluencer: (userIds: string[]) => Promise<string[]>;
};

/**
 * Custo FIXO de duas consultas por request, independente do tamanho da pagina.
 * Os lookups entram por parametro para o teste poder contar as chamadas: e a
 * ausencia de N+1 que se verifica, nao a intencao de nao ter N+1.
 */
export async function fetchUserListEnrichment(
  userIds: string[],
  lookups: EnrichmentLookups,
  now: Date,
): Promise<Map<string, UserListEnrichment>> {
  if (userIds.length === 0) return new Map();

  const [subscriptions, influencerIds] = await Promise.all([
    lookups.bySubscription(userIds),
    lookups.byInfluencer(userIds),
  ]);

  return buildEnrichmentIndex(subscriptions, new Set(influencerIds), now);
}
