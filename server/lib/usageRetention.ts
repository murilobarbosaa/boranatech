import { getPosthogPersonActivity } from "./posthog";
import { supabaseAdmin } from "./supabaseAdmin";

// Metricas de retencao de USO da aba Retencao do admin. Duas leituras sobre a
// base inteira (todos os profiles):
//
// 1. ULTIMO ACESSO = o mais recente entre o login (auth.users.last_sign_in_at) e
//    o ultimo $pageview do PostHog, por pessoa. O cruzamento e de proposito: o
//    login cobre 100% da base mas nao muda enquanto a pessoa usa logada; o
//    pageview mede uso real mas so cobre quem o identify pegou. Tomando o mais
//    recente dos dois, ninguem some da conta E quem usa logado ha semanas sem
//    relogar aparece como ativo.
//
// 2. FREQUENCIA = em quantos dias distintos a pessoa navegou (so o PostHog sabe).
//    Quem o PostHog NAO conhece vai para uma faixa propria de ausencia de dado,
//    NUNCA "0 dias": "0 dias" afirmaria que a pessoa nao usou, e nao sabemos
//    disso (o identify pode nao ter pego). "nao usou" != "nao sei".
//
// Maquina de estados identica aos demais leitores (not_configured/error/ok):
// erro propaga e vira estado, nunca zero-por-falha. Se o PostHog cair, a tela
// mostra erro, nao "todo mundo sumiu".

const DAY_MS = 24 * 60 * 60 * 1000;

// Faixas de ULTIMO ACESSO, em dias desde o acesso mais recente. minDays e o piso
// da faixa; a tela usa minDays contra a idade da plataforma (historyDays) para
// marcar as faixas que ainda nao tem como existir (ex: 30+ numa plataforma de 3
// dias), em vez de mostrar zero e parecer que ninguem sumiu.
export type LastAccessBand = {
  key: string;
  count: number;
  minDays: number;
  maxDays: number | null;
};

// Faixas de FREQUENCIA. A faixa "nodata" e a ausencia de dado de navegacao (o
// PostHog nao conhece a pessoa), mantida separada de qualquer contagem de dias.
export type FrequencyBand = {
  key: string;
  count: number;
};

export type UsageRetentionData = {
  baseTotal: number;
  posthogKnown: number;
  posthogUnknown: number;
  historyDays: number;
  lastAccess: LastAccessBand[];
  frequency: FrequencyBand[];
};

export type UsageRetentionState =
  | { state: "not_configured"; missing: string[] }
  | { state: "error"; reason: string; httpStatus?: number }
  | { state: "ok"; data: UsageRetentionData };

type AuthTimes = { lastSignInAt: string | null; createdAt: string | null };

// Varredura unica de auth.users -> mapa user_id -> {last_sign_in_at, created_at}.
// last_sign_in_at e created_at so existem em auth.users (nao em profiles), por
// isso a varredura do Auth. Erro propaga (o chamador transforma em estado error).
async function fetchAuthTimes(): Promise<Map<string, AuthTimes>> {
  const map = new Map<string, AuthTimes>();
  const perPage = 1000;
  let page = 1;
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    for (const user of data.users) {
      map.set(user.id, {
        lastSignInAt: user.last_sign_in_at ?? null,
        createdAt: user.created_at ?? null,
      });
    }
    if (data.users.length < perPage) break;
    page += 1;
  }
  return map;
}

function lastAccessKey(daysAgo: number): string {
  if (daysAgo <= 0) return "today";
  if (daysAgo <= 3) return "d1_3";
  if (daysAgo <= 7) return "d4_7";
  if (daysAgo <= 14) return "d8_14";
  if (daysAgo <= 30) return "d15_30";
  return "d30plus";
}

// Faixas pequenas de proposito: a plataforma tem poucos dias de vida, entao
// count(distinct dias) fica em 1..3 hoje. Faixas grandes (10+ dias) nasceriam
// vazias e passariam a falsa impressao de metrica. Expandir quando houver
// historico.
function frequencyKey(activeDays: number): string {
  if (activeDays <= 1) return "d1";
  if (activeDays === 2) return "d2";
  return "d3plus";
}

function parseMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export async function getUsageRetention(): Promise<UsageRetentionState> {
  const activity = await getPosthogPersonActivity();
  if (activity.state === "not_configured") return activity;
  if (activity.state === "error") {
    // Loga o original antes de o estado subir traduzido para o client.
    console.error("[usageRetention] posthog error:", activity.reason);
    return activity;
  }

  try {
    // Base canonica: todos os profiles (a base inteira). last_sign_in_at vem do
    // auth scan; profiles nao tem esse campo.
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id");
    if (error) throw error;

    const userIds = (profiles || [])
      .map((profile) => profile.user_id)
      .filter((id): id is string => Boolean(id));

    const authTimes = await fetchAuthTimes();
    const activityByUserId = new Map(
      activity.persons.map((person) => [person.distinctId, person]),
    );

    const now = Date.now();
    let oldestMs = now;

    const lastAccessCounts: Record<string, number> = {
      today: 0,
      d1_3: 0,
      d4_7: 0,
      d8_14: 0,
      d15_30: 0,
      d30plus: 0,
    };
    const frequencyCounts: Record<string, number> = {
      d1: 0,
      d2: 0,
      d3plus: 0,
      nodata: 0,
    };
    let posthogKnown = 0;

    for (const userId of userIds) {
      const auth = authTimes.get(userId);
      const person = activityByUserId.get(userId);

      // Login: last_sign_in_at, com fallback defensivo para created_at (mesmo
      // padrao do /churn-risk). Garante um sinal para 100% da base.
      const loginMs = parseMs(auth?.lastSignInAt) ?? parseMs(auth?.createdAt);
      const pageviewMs = parseMs(person?.lastPageview);
      const createdMs = parseMs(auth?.createdAt);
      if (createdMs !== null && createdMs < oldestMs) oldestMs = createdMs;

      // ULTIMO ACESSO = o mais recente dos dois sinais.
      const candidates = [loginMs, pageviewMs].filter(
        (ms): ms is number => ms !== null,
      );
      if (candidates.length > 0) {
        const lastMs = Math.max(...candidates);
        const daysAgo = Math.floor((now - lastMs) / DAY_MS);
        lastAccessCounts[lastAccessKey(daysAgo)] += 1;
      } else {
        // Sem nenhum sinal de acesso (nem login nem pageview): mantem na base na
        // faixa mais fria, nao some da conta.
        lastAccessCounts.d30plus += 1;
      }

      // FREQUENCIA: so o PostHog conta dias distintos. Uma pessoa que ele conhece
      // tem sempre >= 1 dia (a query so retorna quem teve pageview). Quem ele nao
      // conhece vai para 'nodata' (ausencia de dado), nunca uma contagem de dias.
      if (person) {
        posthogKnown += 1;
        frequencyCounts[frequencyKey(person.activeDays)] += 1;
      } else {
        frequencyCounts.nodata += 1;
      }
    }

    const baseTotal = userIds.length;
    const historyDays = Math.max(0, Math.floor((now - oldestMs) / DAY_MS));

    const lastAccess: LastAccessBand[] = [
      { key: "today", count: lastAccessCounts.today, minDays: 0, maxDays: 0 },
      { key: "d1_3", count: lastAccessCounts.d1_3, minDays: 1, maxDays: 3 },
      { key: "d4_7", count: lastAccessCounts.d4_7, minDays: 4, maxDays: 7 },
      { key: "d8_14", count: lastAccessCounts.d8_14, minDays: 8, maxDays: 14 },
      {
        key: "d15_30",
        count: lastAccessCounts.d15_30,
        minDays: 15,
        maxDays: 30,
      },
      {
        key: "d30plus",
        count: lastAccessCounts.d30plus,
        minDays: 31,
        maxDays: null,
      },
    ];

    const frequency: FrequencyBand[] = [
      { key: "d1", count: frequencyCounts.d1 },
      { key: "d2", count: frequencyCounts.d2 },
      { key: "d3plus", count: frequencyCounts.d3plus },
      { key: "nodata", count: frequencyCounts.nodata },
    ];

    return {
      state: "ok",
      data: {
        baseTotal,
        posthogKnown,
        posthogUnknown: baseTotal - posthogKnown,
        historyDays,
        lastAccess,
        frequency,
      },
    };
  } catch (err) {
    // Loga o original antes de traduzir para o estado que sobe ao client.
    console.error("[usageRetention] db error:", err);
    const reason = err instanceof Error ? err.message : String(err);
    return { state: "error", reason };
  }
}
