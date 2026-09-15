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
// Fonte espelhada: supabase/migrations/20260913120000_creators_and_creator_events.sql
//   ramo 1: subscriptions JOIN plans, plans.code <> 'free',
//           status in ('active','trialing'),
//           (current_period_end is null or current_period_end > now())
//   ramo 2: creators com revoked_at is null (qualquer kind)

import type { CreatorKind } from "./creatorKind";

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
  /** Opcional: a rota antiga nao o seleciona. */
  renewal_type?: string | null;
};

// "both" continua sendo assinatura + concessao de INFLUENCER, com o mesmo nome
// de antes: o valor sai na resposta da API, e o bundle em execucao le "both".
// Assinatura + concessao de AFILIADO e "both_afiliado", valor novo.
export type ProSource =
  | "subscription"
  | "influencer"
  | "afiliado"
  | "both"
  | "both_afiliado";

export type UserListEnrichment = {
  is_pro: boolean;
  // Discriminador para a UI. "both" existe porque assinatura e concessao de
  // influencer sao ORTOGONAIS: cancelar a assinatura de quem tambem e
  // influencer nao tira o Pro. Sem este valor a lista esconderia justamente o
  // caso em que uma acao administrativa nao produz o efeito esperado.
  pro_source: ProSource | null;
  plan_code: string | null;
  subscription_status: string | null;
  /** Da assinatura escolhida, para o selo "vence em N dias" da lista. */
  renewal_type: string | null;
  current_period_end: string | null;
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
 * Junta assinaturas e concessoes de creator num indice por user_id. Usuario
 * sem nenhum dos dois nao entra: quem consome trata a ausencia como "sem
 * assinatura, sem Pro".
 *
 * `activeCreators` mapeia user_id para o kind da concessao ATIVA (o indice
 * unico parcial garante no maximo uma por usuario).
 */
export function buildEnrichmentIndex(
  subscriptions: SubscriptionRow[],
  activeCreators: Map<string, CreatorKind>,
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
    const creatorKind = activeCreators.get(userId) ?? null;
    index.set(userId, {
      is_pro: proPorAssinatura || creatorKind !== null,
      pro_source: resolveProSource(proPorAssinatura, creatorKind),
      plan_code: escolhida ? planCodeOf(escolhida) : null,
      subscription_status: escolhida?.status ?? null,
      renewal_type: escolhida?.renewal_type ?? null,
      current_period_end: escolhida?.current_period_end ?? null,
    });
  });

  // Creators sem nenhuma assinatura ainda nao entraram no laco acima.
  activeCreators.forEach((kind, userId) => {
    if (index.has(userId)) return;
    index.set(userId, {
      is_pro: true,
      pro_source: kind,
      plan_code: null,
      subscription_status: null,
      renewal_type: null,
      current_period_end: null,
    });
  });

  return index;
}

/**
 * Quantas pessoas tem Pro, POR ORIGEM, a partir do indice ja construido.
 *
 * NAO e uma contagem nova: e um tally sobre o MESMO indice que a lista de
 * usuarios e o detalhe usam, entao os tres nunca podem divergir. Este projeto ja
 * carrega duas montagens da regra de Pro (a RPC `is_user_pro` e esta lib), e a
 * divida esta registrada; uma terceira, escrita direto numa rota de dashboard,
 * seria a que diverge primeiro porque ninguem olharia para ela.
 *
 * Os dois ramos sao ORTOGONAIS e o total NAO e a soma: quem tem os dois entra em
 * `both` e apareceria duas vezes. `total` e a uniao, e existe justamente para
 * ninguem precisar somar por conta propria.
 *
 * A concessao se divide por kind (`byInfluencer`, `byAfiliado`), e `both` e a
 * intersecao da assinatura com QUALQUER concessao: e ela que se subtrai uma vez
 * para fechar a uniao, `bySubscription + byInfluencer + byAfiliado - both`.
 */
export type ProSourceTally = {
  bySubscription: number;
  byInfluencer: number;
  byAfiliado: number;
  both: number;
  total: number;
};

export function tallyProSources(
  index: Map<string, UserListEnrichment>,
): ProSourceTally {
  let soAssinatura = 0;
  let soInfluencer = 0;
  let soAfiliado = 0;
  let assinaturaEInfluencer = 0;
  let assinaturaEAfiliado = 0;
  index.forEach((item) => {
    if (item.pro_source === "subscription") soAssinatura += 1;
    else if (item.pro_source === "influencer") soInfluencer += 1;
    else if (item.pro_source === "afiliado") soAfiliado += 1;
    else if (item.pro_source === "both") assinaturaEInfluencer += 1;
    else if (item.pro_source === "both_afiliado") assinaturaEAfiliado += 1;
  });
  const both = assinaturaEInfluencer + assinaturaEAfiliado;
  return {
    // Quem tem os dois conta nos DOIS ramos: "assinantes pagantes" inclui quem
    // tambem tem concessao.
    bySubscription: soAssinatura + both,
    byInfluencer: soInfluencer + assinaturaEInfluencer,
    byAfiliado: soAfiliado + assinaturaEAfiliado,
    both,
    total: soAssinatura + soInfluencer + soAfiliado + both,
  };
}

/**
 * Monta o discriminador de origem do Pro. EXPORTADO e usado tambem pela rota de
 * detalhe (GET /users/:id): sem isto, a lista e o modal montavam "both" cada um
 * do seu jeito, e duas montagens da mesma regra divergem na primeira mudanca.
 */
export function resolveProSource(
  porAssinatura: boolean,
  creatorKind: CreatorKind | null,
): ProSource | null {
  if (porAssinatura && creatorKind === "influencer") return "both";
  if (porAssinatura && creatorKind === "afiliado") return "both_afiliado";
  if (porAssinatura) return "subscription";
  return creatorKind;
}

export type EnrichmentLookups = {
  /** Assinaturas de TODOS os ids da pagina, numa consulta so. */
  bySubscription: (userIds: string[]) => Promise<SubscriptionRow[]>;
  /** Concessoes de creator ATIVAS dos ids da pagina, numa consulta so. */
  byCreator: (
    userIds: string[],
  ) => Promise<Array<{ user_id: string; kind: CreatorKind }>>;
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

  const [subscriptions, creators] = await Promise.all([
    lookups.bySubscription(userIds),
    lookups.byCreator(userIds),
  ]);

  const porUsuario = new Map<string, CreatorKind>();
  for (const creator of creators) porUsuario.set(creator.user_id, creator.kind);
  return buildEnrichmentIndex(subscriptions, porUsuario, now);
}
