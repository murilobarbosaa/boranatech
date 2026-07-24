import { supabaseAdmin } from "./supabaseAdmin";

// Segmentos de usuarios por status Pro, derivados de subscriptions + plans.
// Modulo compartilhado entre campanhas de email (dispatch em massa, via
// fetchProStatusSets) e notificacoes in-app (avaliacao por usuario na
// leitura, via fetchProStatusFlagsForUser). A semantica e UMA so:
// active_pro segue a definicao de is_user_pro (plano pago, status
// active/trialing e periodo vigente).
export const USER_SEGMENTS = [
  "all",
  "never_pro",
  "active_pro",
  "paying_pro",
  "ex_pro",
] as const;
export type UserSegment = (typeof USER_SEGMENTS)[number];

const DB_PAGE = 1000;

// payingActive: subconjunto de active com assinatura paga vigente, SEM os
// influencers de cortesia. Existe pra o segmento paying_pro (campanhas de
// cobranca/renovacao), que nao deve alcancar quem tem Pro sem pagar. active
// continua sendo payingActive OU influencer (definicao do is_user_pro).
export type ProStatusSets = {
  active: Set<string>;
  payingActive: Set<string>;
  pastDue: Set<string>;
  everPaid: Set<string>;
};

// Influencers ATIVOS (revoked_at null): Pro vitalicio sem assinatura, mesmo
// ramo que a migration 20260716130100 adicionou ao is_user_pro. Entram no
// conjunto active; como nunca pagaram, NAO entram em everPaid (a exclusao de
// never_pro acontece na tabela-verdade, que exige !active).
async function fetchActiveInfluencerUserIds(): Promise<string[]> {
  const ids: string[] = [];
  for (let from = 0; ; from += DB_PAGE) {
    const { data, error } = await supabaseAdmin
      .from("influencers")
      .select("user_id")
      .is("revoked_at", null)
      .range(from, from + DB_PAGE - 1);
    if (error) {
      throw new Error(`Falha ao buscar influencers: ${error.message}`);
    }
    const rows = data ?? [];
    ids.push(...rows.map((row) => row.user_id as string));
    if (rows.length < DB_PAGE) break;
  }
  return ids;
}

// Deriva o status Pro por user_id a partir de subscriptions + plans (linhas
// nunca sao deletadas, so atualizadas pelo webhook/reconcile do Asaas).
// active = mesma condicao do is_user_pro: plano pago, status active/trialing
// e periodo vigente, OU influencer ativo (Pro vitalicio sem assinatura,
// decisao de 2026-07-16 espelhando a nova definicao do is_user_pro).
export async function fetchProStatusSets(): Promise<ProStatusSets> {
  const { data: plans, error: plansError } = await supabaseAdmin
    .from("plans")
    .select("id, code");
  if (plansError) {
    throw new Error(`Falha ao buscar planos: ${plansError.message}`);
  }
  const paidPlanIds = new Set(
    (plans ?? [])
      .filter((plan) => plan.code !== "free")
      .map((plan) => plan.id),
  );

  const active = new Set<string>();
  const payingActive = new Set<string>();
  const pastDue = new Set<string>();
  const everPaid = new Set<string>();
  for (let from = 0; ; from += DB_PAGE) {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, plan_id, status, current_period_end")
      .range(from, from + DB_PAGE - 1);
    if (error) {
      throw new Error(`Falha ao buscar assinaturas: ${error.message}`);
    }
    const rows = data ?? [];
    for (const row of rows) {
      if (!row.plan_id || !paidPlanIds.has(row.plan_id)) continue;
      everPaid.add(row.user_id);
      const periodOk =
        !row.current_period_end ||
        new Date(row.current_period_end).getTime() > Date.now();
      if ((row.status === "active" || row.status === "trialing") && periodOk) {
        active.add(row.user_id);
        payingActive.add(row.user_id);
      } else if (row.status === "past_due") {
        pastDue.add(row.user_id);
      }
    }
    if (rows.length < DB_PAGE) break;
  }

  // Influencer ativo entra so em active (Pro vitalicio sem pagamento); NUNCA em
  // payingActive, que e o conjunto do paying_pro.
  const influencerIds = await fetchActiveInfluencerUserIds();
  influencerIds.forEach((id) => active.add(id));

  return { active, payingActive, pastDue, everPaid };
}

// Mesmos tres flags do fetchProStatusSets, mas para UM usuario (query
// indexada por user_id, barata o bastante pra rodar no GET de notificacoes
// que e polled pelo client). Mesmas regras: plano pago, active/trialing com
// periodo vigente = active; past_due separado; qualquer assinatura paga
// historica = everPaid.
export type ProStatusFlags = {
  active: boolean;
  payingActive: boolean;
  pastDue: boolean;
  everPaid: boolean;
};

export async function fetchProStatusFlagsForUser(
  userId: string,
): Promise<ProStatusFlags> {
  const [subsResult, influencerResult] = await Promise.all([
    supabaseAdmin
      .from("subscriptions")
      .select("status, current_period_end, plans!inner(code)")
      .eq("user_id", userId)
      .neq("plans.code", "free"),
    // Influencer ativo = active, mesma regra do fetchProStatusSets. O indice
    // unico parcial garante no maximo uma linha ativa por usuario.
    supabaseAdmin
      .from("influencers")
      .select("id")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .maybeSingle(),
  ]);
  if (subsResult.error) {
    throw new Error(
      `Falha ao buscar assinaturas do usuário: ${subsResult.error.message}`,
    );
  }
  if (influencerResult.error) {
    throw new Error(
      `Falha ao buscar influencer do usuário: ${influencerResult.error.message}`,
    );
  }
  const isInfluencer = influencerResult.data !== null;
  const flags: ProStatusFlags = {
    active: false,
    payingActive: false,
    pastDue: false,
    everPaid: false,
  };
  for (const row of subsResult.data ?? []) {
    flags.everPaid = true;
    const periodOk =
      !row.current_period_end ||
      new Date(row.current_period_end).getTime() > Date.now();
    if ((row.status === "active" || row.status === "trialing") && periodOk) {
      flags.payingActive = true;
    } else if (row.status === "past_due") {
      flags.pastDue = true;
    }
  }
  // active = pagante vigente OU influencer (is_user_pro); payingActive fica so
  // com o pagamento, sem o influencer.
  flags.active = flags.payingActive || isInfluencer;
  return flags;
}

// Tabela-verdade dos segmentos (decisao de 2026-07-16, alinhada ao
// is_user_pro com influencers):
// - all: todo mundo.
// - active_pro: active (assinatura paga vigente OU influencer ativo). INCLUI
//   influencers de cortesia (eles tem a experiencia Pro completa).
// - paying_pro: payingActive (assinatura paga vigente), EXCLUI influencers de
//   cortesia. Subconjunto de active_pro. Existe pra cobranca/renovacao, que
//   nao deve alcancar quem tem Pro sem pagar.
// - never_pro: nunca pagou E nao e active. O "!active" existe pelo
//   influencer que nunca assinou: ele tem Pro, entao nao e alvo de
//   comunicacao "assine o Pro".
// - ex_pro: pagou algum dia, nao esta active nem past_due. Ex-assinante que
//   hoje e influencer sai daqui pelo !active.
// - past_due fica FORA de active_pro/paying_pro e de ex_pro por decisao de
//   produto: e cliente em recuperacao de pagamento e nao deve receber campanha
//   de win-back no meio da cobranca. Entra apenas no segmento all.
export function userMatchesSegment(
  userId: string,
  segment: UserSegment,
  sets: ProStatusSets,
): boolean {
  if (segment === "all") return true;
  if (segment === "active_pro") return sets.active.has(userId);
  if (segment === "paying_pro") return sets.payingActive.has(userId);
  if (segment === "never_pro") {
    return !sets.everPaid.has(userId) && !sets.active.has(userId);
  }
  return (
    sets.everPaid.has(userId) &&
    !sets.active.has(userId) &&
    !sets.pastDue.has(userId)
  );
}

// Variante por flags (um usuario), mesma tabela-verdade do userMatchesSegment.
export function flagsMatchSegment(
  segment: UserSegment,
  flags: ProStatusFlags,
): boolean {
  if (segment === "all") return true;
  if (segment === "active_pro") return flags.active;
  if (segment === "paying_pro") return flags.payingActive;
  if (segment === "never_pro") return !flags.everPaid && !flags.active;
  return flags.everPaid && !flags.active && !flags.pastDue;
}
