import { supabaseAdmin } from "./supabaseAdmin";

// Metricas financeiras reais para o admin. SO calculo, sem UI. Todas as funcoes
// leem via supabaseAdmin (admin legitimo, sem filtro por user_id).
//
// REGRA DE OURO deste modulo: nenhuma funcao retorna 0, [] ou default ao
// encontrar erro. Erro propaga como erro. Ausencia de dado e um estado NOMEADO
// (ex.: arpuCents null, churn status 'insufficient_data'), nunca um numero.

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.floor(value), min), max);
}

// Meses por ciclo, derivado da coluna plans.interval (fonte: seed em
// 20260528120000; valores reais 'month' / 'semiannual' / 'year'). Aliases
// defensivos incluidos. Interval fora deste mapa e ERRO (nao da para normalizar
// MRR sem saber o ciclo), nunca um default silencioso.
const INTERVAL_MONTHS: Record<string, number> = {
  month: 1,
  monthly: 1,
  semiannual: 6,
  semiannually: 6,
  year: 12,
  annual: 12,
  yearly: 12,
};

function monthlyEquivalentCents(priceCents: number, interval: string): number {
  const months = INTERVAL_MONTHS[interval];
  if (!months) {
    throw new Error(
      `Plano com interval desconhecido ("${interval}"); nao da para normalizar MRR.`,
    );
  }
  return Math.round(priceCents / months);
}

type EmbeddedPlan = {
  code: string | null;
  name: string | null;
  price_cents?: number | null;
  interval?: string | null;
};

function unwrapPlan(
  plans: EmbeddedPlan | EmbeddedPlan[] | null | undefined,
): EmbeddedPlan {
  if (Array.isArray(plans)) return plans[0] ?? { code: null, name: null };
  return plans ?? { code: null, name: null };
}

// ---------------------------------------------------------------------------
// Lista paginada de assinantes
// ---------------------------------------------------------------------------

export type SubscriberListParams = {
  page: number;
  pageSize: number;
  status?: string;
  provider?: string;
  planCode?: string;
  search?: string;
};

export type SubscriberRow = {
  userId: string | null;
  email: string | null;
  planCode: string | null;
  planName: string | null;
  provider: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean | null;
  affiliateCode: string | null;
  createdAt: string | null;
};

export type SubscriberListResult = {
  rows: SubscriberRow[];
  total: number;
  page: number;
  pageSize: number;
};

type RawSubscriberRow = {
  user_id: string | null;
  provider: string | null;
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  affiliate_code: string | null;
  created_at: string | null;
  plans: EmbeddedPlan | EmbeddedPlan[] | null;
};

// Paginacao real (count exato + range), sem o cap fixo de 100 do endpoint legado.
// Email resolvido em UM batch: uma unica query em profiles (que tem a coluna
// email) para os user_ids da PAGINA, e merge em memoria. Evita o anti-padrao
// atual do /churn-risk (loop Promise.all de auth.admin.getUserById por linha),
// que faz uma ida a Auth por assinante.
export async function getSubscriberList(
  params: SubscriberListParams,
): Promise<SubscriberListResult> {
  const page = Math.max(1, Math.floor(params.page) || 1);
  const pageSize = clampInt(params.pageSize, 1, 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from("subscriptions")
    .select(
      "user_id, provider, status, current_period_end, cancel_at_period_end, affiliate_code, created_at, plans!inner(code, name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.status) query = query.eq("status", params.status);
  if (params.provider) query = query.eq("provider", params.provider);
  if (params.planCode) query = query.eq("plans.code", params.planCode);

  // Busca por email vive em profiles, nao em subscriptions (sem FK direta). Um
  // batch em profiles resolve os user_ids que casam; restringe a query por eles.
  // Zero correspondencia e um vazio LEGITIMO (busca sem resultado), nao um erro.
  if (params.search && params.search.trim()) {
    const term = params.search.trim();
    const { data: matched, error: matchError } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .ilike("email", `%${term}%`)
      .limit(1000);
    if (matchError) throw matchError;
    const matchedIds = ((matched ?? []) as Array<{ user_id: string | null }>)
      .map((m) => m.user_id)
      .filter((v): v is string => Boolean(v));
    if (matchedIds.length === 0) {
      return { rows: [], total: 0, page, pageSize };
    }
    query = query.in("user_id", matchedIds);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const subs = (data ?? []) as RawSubscriberRow[];
  const userIds = subs
    .map((s) => s.user_id)
    .filter((v): v is string => Boolean(v));

  const emailByUser = new Map<string, string | null>();
  if (userIds.length) {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email")
      .in("user_id", userIds);
    if (profilesError) throw profilesError;
    for (const profile of (profiles ?? []) as Array<{
      user_id: string;
      email: string | null;
    }>) {
      emailByUser.set(profile.user_id, profile.email ?? null);
    }
  }

  const rows: SubscriberRow[] = subs.map((s) => {
    const plan = unwrapPlan(s.plans);
    return {
      userId: s.user_id,
      email: s.user_id ? (emailByUser.get(s.user_id) ?? null) : null,
      planCode: plan.code,
      planName: plan.name,
      provider: s.provider,
      status: s.status,
      currentPeriodEnd: s.current_period_end,
      cancelAtPeriodEnd: s.cancel_at_period_end,
      affiliateCode: s.affiliate_code,
      createdAt: s.created_at,
    };
  });

  return { rows, total: count ?? rows.length, page, pageSize };
}

// ---------------------------------------------------------------------------
// MRR
// ---------------------------------------------------------------------------

export type PlanMrr = {
  code: string;
  name: string | null;
  count: number;
  mrrCents: number;
};

export type MrrSnapshot = {
  mrrCents: number;
  // null quando activeCount === 0: ausencia, nao zero.
  arpuCents: number | null;
  activeCount: number;
  trialingCount: number;
  byPlan: PlanMrr[];
};

type RawMrrRow = {
  status: string | null;
  plans: EmbeddedPlan | EmbeddedPlan[] | null;
};

// MRR normalizado em centavos: SOMENTE assinaturas status='active' nao expiradas
// (mesma condicao de periodo do is_user_pro: period null ou > now), com o preco
// do plano convertido para equivalente mensal via plans.interval.
//
// DECISAO: trialing NAO paga, entao fica FORA do MRR, do ARPU e da distribuicao
// por plano; entra so como contador separado (trialingCount). ARPU = mrrCents /
// activeCount, null quando activeCount === 0 (nunca 0).
export async function getMrrSnapshot(): Promise<MrrSnapshot> {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("status, plans!inner(code, name, price_cents, interval)")
    .in("status", ["active", "trialing"])
    .or(`current_period_end.is.null,current_period_end.gt.${nowIso}`);
  if (error) throw error;

  const rows = (data ?? []) as RawMrrRow[];

  let mrrCents = 0;
  let activeCount = 0;
  let trialingCount = 0;
  const byPlan = new Map<string, PlanMrr>();

  for (const row of rows) {
    const plan = unwrapPlan(row.plans);
    if (!plan.code) {
      throw new Error(
        "Assinatura ativa sem code de plano; dados de plano inconsistentes.",
      );
    }

    // Trial nao paga: fora do MRR, do ARPU e da distribuicao por plano.
    if (row.status === "trialing") {
      trialingCount += 1;
      continue;
    }

    const priceCents = Number(plan.price_cents ?? 0);
    const interval = String(plan.interval ?? "");
    const perMonth = monthlyEquivalentCents(priceCents, interval);

    mrrCents += perMonth;
    activeCount += 1;

    const entry = byPlan.get(plan.code) ?? {
      code: plan.code,
      name: plan.name,
      count: 0,
      mrrCents: 0,
    };
    entry.count += 1;
    entry.mrrCents += perMonth;
    byPlan.set(plan.code, entry);
  }

  const arpuCents = activeCount > 0 ? Math.round(mrrCents / activeCount) : null;

  return {
    mrrCents,
    arpuCents,
    activeCount,
    trialingCount,
    byPlan: Array.from(byPlan.values()),
  };
}

// ---------------------------------------------------------------------------
// Churn
// ---------------------------------------------------------------------------

export type ChurnSnapshot =
  | {
      status: "insufficient_data";
      reason: string;
      windowDays: number;
      canceledInWindow?: number;
      activeAtStart?: number;
    }
  | {
      status: "ok";
      windowDays: number;
      churnRate: number;
      canceledInWindow: number;
      activeAtStart: number;
      // null quando churnRate = 0 (LTV nao definido): ausencia, nao zero.
      ltvCents: number | null;
    };

// churnRate = cancelamentos na janela / assinantes ativos no inicio da janela.
// activeAtStart e uma APROXIMACAO (o banco nao guarda snapshot historico):
// assinaturas criadas antes do inicio da janela e nao canceladas antes dele.
// Cancelamentos derivam de canceled_at (subscriptions).
//
// Estados nomeados de ausencia (nunca um numero inventado):
// - base com menos de windowDays de vida -> insufficient_data.
// - denominador 0 -> insufficient_data.
// LTV (ARPU / churnRate) so e retornado quando churnRate > 0.
export async function getChurnSnapshot(
  params: { windowDays?: number } = {},
): Promise<ChurnSnapshot> {
  const windowDays = params.windowDays ?? 30;
  const windowStartIso = new Date(
    Date.now() - windowDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: earliestData, error: earliestError } = await supabaseAdmin
    .from("subscriptions")
    .select("created_at")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (earliestError) throw earliestError;

  const earliest = earliestData as { created_at: string | null } | null;
  if (!earliest?.created_at || earliest.created_at > windowStartIso) {
    return {
      status: "insufficient_data",
      reason: "subscription_base_younger_than_window",
      windowDays,
    };
  }

  const { count: activeAtStartCount, error: activeError } = await supabaseAdmin
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .lt("created_at", windowStartIso)
    .or(`canceled_at.is.null,canceled_at.gte.${windowStartIso}`);
  if (activeError) throw activeError;

  const { count: canceledCount, error: canceledError } = await supabaseAdmin
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .gte("canceled_at", windowStartIso);
  if (canceledError) throw canceledError;

  const activeAtStart = activeAtStartCount ?? 0;
  const canceledInWindow = canceledCount ?? 0;

  if (activeAtStart === 0) {
    return {
      status: "insufficient_data",
      reason: "no_active_subscribers_at_window_start",
      windowDays,
      canceledInWindow,
      activeAtStart: 0,
    };
  }

  const churnRate = canceledInWindow / activeAtStart;

  let ltvCents: number | null = null;
  if (churnRate > 0) {
    const mrr = await getMrrSnapshot();
    ltvCents =
      mrr.arpuCents !== null ? Math.round(mrr.arpuCents / churnRate) : null;
  }

  return {
    status: "ok",
    windowDays,
    churnRate,
    canceledInWindow,
    activeAtStart,
    ltvCents,
  };
}
