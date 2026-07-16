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
//   espelhando a regra das campanhas de email.
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
  const [flags, profileResult] = await Promise.all([
    fetchProStatusFlagsForUser(userId),
    supabaseAdmin
      .from("profiles")
      .select("marketing_opt_in")
      .eq("id", userId)
      .maybeSingle(),
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

  return { allowedAudiences, includePromotional };
}

// Query base das notificacoes visiveis ao contexto: published + audience do
// usuario + regra de opt-in. Reutilizada pelo feed, pelo unread_count e pela
// validacao de leitura.
function visibleQuery(ctx: NotificationAudienceContext, columns: string) {
  let query = supabaseAdmin
    .from("notifications")
    .select(columns)
    .eq("status", "published")
    .in("audience", ctx.allowedAudiences);
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
// leitura: nunca registramos read de algo que o usuario nao pode ver.
export async function isNotificationVisibleToUser(
  notificationId: string,
  ctx: NotificationAudienceContext,
): Promise<boolean> {
  const { data, error } = await visibleQuery(ctx, "id")
    .eq("id", notificationId)
    .maybeSingle();
  return error === null && data !== null;
}
