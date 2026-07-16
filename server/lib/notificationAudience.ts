import { supabaseAdmin } from "./supabaseAdmin";
import {
  USER_SEGMENTS,
  fetchProStatusFlagsForUser,
  flagsMatchSegment,
  type UserSegment,
} from "./userSegments";

// Visibilidade de notificacoes por usuario, avaliada na LEITURA (decisao de
// arquitetura: broadcast sem fan-out, nenhuma tabela de recipients). Regras:
// - audience usa a MESMA semantica dos USER_SEGMENTS das campanhas de email:
//   'active_pro' segue a definicao de is_user_pro (plano pago, active/trialing,
//   periodo vigente); past_due fica fora de active_pro/ex_pro e so enxerga
//   audience 'all'. Consequencia da avaliacao na leitura: quem vira Pro depois
//   passa a ver notificacoes Pro antigas ainda publicadas (desejavel pra cupom).
// - o flag active recebe OR do isPro do middleware (checkProStatus, cache
//   Redis + is_user_pro/is_user_admin): admin enxerga como Pro por design da
//   plataforma, igual ao resto do produto.
// - category 'promotional' so aparece com profiles.marketing_opt_in = true,
//   espelhando a regra das campanhas de email. Vale INCLUSIVE para audience
//   'custom': ser destinatario nomeado nao dispensa o consentimento LGPD de
//   comunicacao promocional.
// - audience 'custom': lista materializada em notification_recipients na
//   criacao; visivel apenas para quem tem linha la (alem das regras acima).
// - status = 'published' sempre; expirada NAO e filtrada (historico honesto),
//   apenas anotada com is_expired.

// Colunas expostas ao usuario final. Sem status/created_by/created_at:
// published_at e a referencia temporal publica e o cursor da paginacao.
export const NOTIFICATION_PUBLIC_COLUMNS =
  "id, title, body, type, category, audience, coupon_code, discount_percent, cta_url, cta_label, expires_at, published_at";

export type PublicNotificationRow = {
  id: string;
  title: string;
  body: string;
  type: string;
  category: string;
  audience: string;
  coupon_code: string | null;
  discount_percent: number | null;
  cta_url: string | null;
  cta_label: string | null;
  expires_at: string | null;
  published_at: string | null;
};

export type VisibleNotification = PublicNotificationRow & {
  is_expired: boolean;
};

export type NotificationAudienceContext = {
  // Audiences que este usuario enxerga ('all' sempre presente). Um usuario
  // pode casar mais de uma (ex: admin sem assinatura = all + active_pro via
  // isPro + never_pro), o que so amplia o que ele ve; nunca vaza segmento de
  // outro perfil de pagamento.
  allowedAudiences: UserSegment[];
  includePromotional: boolean;
  // Ids das notificacoes audience='custom' das quais este usuario e
  // destinatario (notification_recipients). Resolvido junto com o contexto
  // pra lista e checagem pontual usarem a mesma fonte.
  recipientNotificationIds: string[];
};

export function annotateExpiration(
  row: PublicNotificationRow,
): VisibleNotification {
  return {
    ...row,
    is_expired:
      row.expires_at !== null &&
      new Date(row.expires_at).getTime() < Date.now(),
  };
}

// Resolve o contexto de audience do usuario: flags de assinatura (uma query
// indexada por user_id) + marketing_opt_in do profile. isPro vem do middleware
// checkProStatus (que ja usa o cache Redis de proStatusCache), evitando
// recalcular Pro aqui.
export async function resolveAudienceContext(
  userId: string,
  isPro: boolean,
): Promise<NotificationAudienceContext> {
  const [flags, profileResult, recipientResult] = await Promise.all([
    fetchProStatusFlagsForUser(userId),
    // profiles.user_id e a FK para auth.users; profiles.id e um uuid LOCAL
    // (padrao de todo o server: .eq("user_id", ...)).
    supabaseAdmin
      .from("profiles")
      .select("marketing_opt_in")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("notification_recipients")
      .select("notification_id")
      .eq("user_id", userId),
  ]);

  const effectiveFlags = { ...flags, active: flags.active || isPro };
  const allowedAudiences = USER_SEGMENTS.filter((segment) =>
    flagsMatchSegment(segment, effectiveFlags),
  );

  // Perfil ausente ou erro na leitura: opt-in tratado como false (fail-closed,
  // promotional nao aparece), mesmo default do banco.
  const includePromotional =
    profileResult.error === null &&
    profileResult.data?.marketing_opt_in === true;

  // Erro aqui nao derruba o feed inteiro: as custom apenas somem ate a
  // proxima resolucao (fail-closed, nunca mostra custom alheia).
  if (recipientResult.error) {
    console.warn(
      "[notificationAudience] falha ao resolver recipients",
      recipientResult.error.message,
    );
  }
  const recipientNotificationIds = (recipientResult.data ?? []).map(
    (row) => row.notification_id as string,
  );

  return { allowedAudiences, includePromotional, recipientNotificationIds };
}

// Semantica de visibilidade de UMA notificacao published no contexto. E o
// predicado canonico: visibleQuery (listas, em SQL) implementa EXATAMENTE
// esta tabela e os testes cobrem este predicado; mudou aqui, mudar la.
export function rowVisibleInContext(
  row: { id: string; audience: string; category: string },
  ctx: NotificationAudienceContext,
): boolean {
  if (row.category === "promotional" && !ctx.includePromotional) {
    return false;
  }
  if (row.audience === "custom") {
    return ctx.recipientNotificationIds.includes(row.id);
  }
  return (ctx.allowedAudiences as string[]).includes(row.audience);
}

// Query base das notificacoes visiveis ao contexto: published + (audience do
// usuario OU custom da qual e destinatario) + regra de opt-in. Reutilizada
// pelo feed, pelo unread_count e pelo read-all. O filtro de custom entra na
// PROPRIA query (or por ids resolvidos do contexto), nunca "busca tudo e
// filtra em JS".
function visibleQuery(ctx: NotificationAudienceContext, columns: string) {
  let query = supabaseAdmin
    .from("notifications")
    .select(columns)
    .eq("status", "published");
  if (ctx.recipientNotificationIds.length > 0) {
    query = query.or(
      `audience.in.(${ctx.allowedAudiences.join(",")}),id.in.(${ctx.recipientNotificationIds.join(",")})`,
    );
  } else {
    query = query.in("audience", ctx.allowedAudiences);
  }
  if (!ctx.includePromotional) {
    query = query.eq("category", "product");
  }
  return query;
}

// Pagina do feed do usuario, ordenada por published_at desc. cursor = o
// published_at do ultimo item da pagina anterior (paginacao por cursor, nao
// offset). Retorna limit + 1 pra sinalizar next_cursor sem query extra.
export async function getVisibleNotificationsForUser(
  ctx: NotificationAudienceContext,
  options: { limit: number; cursor?: string },
): Promise<{ items: VisibleNotification[]; nextCursor: string | null }> {
  let query = visibleQuery(ctx, NOTIFICATION_PUBLIC_COLUMNS)
    .order("published_at", { ascending: false })
    .limit(options.limit + 1);
  if (options.cursor) {
    query = query.lt("published_at", options.cursor);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(`Falha ao buscar notificações: ${error.message}`);
  }
  const rows = (data ?? []) as unknown as PublicNotificationRow[];
  const hasMore = rows.length > options.limit;
  const page = hasMore ? rows.slice(0, options.limit) : rows;
  const items = page.map(annotateExpiration);
  const nextCursor = hasMore
    ? (page[page.length - 1]?.published_at ?? null)
    : null;
  return { items, nextCursor };
}

// Ids das notificacoes visiveis mais recentes, limitado a cap. Base do
// unread_count (cap evita varrer historico inteiro a cada poll) e do read-all.
export async function listVisibleNotificationIds(
  ctx: NotificationAudienceContext,
  cap: number,
): Promise<string[]> {
  const { data, error } = await visibleQuery(ctx, "id")
    .order("published_at", { ascending: false })
    .limit(cap);
  if (error) {
    throw new Error(`Falha ao buscar notificações: ${error.message}`);
  }
  return ((data ?? []) as unknown as Array<{ id: string }>).map(
    (row) => row.id,
  );
}

// Uma notificacao especifica e visivel a este usuario? Usada antes de gravar
// leitura: nunca registramos read de algo que o usuario nao pode ver. Busca a
// linha published e decide pelo predicado canonico (rowVisibleInContext).
export async function isNotificationVisibleToUser(
  notificationId: string,
  ctx: NotificationAudienceContext,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("id, audience, category")
    .eq("status", "published")
    .eq("id", notificationId)
    .maybeSingle();
  if (error || !data) return false;
  return rowVisibleInContext(
    data as { id: string; audience: string; category: string },
    ctx,
  );
}
