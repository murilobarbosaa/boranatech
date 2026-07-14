import { env } from "./env";

// PostHog como maquina de estados explicita. O host NAO e hardcoded: vem de
// env.posthogHost (POSTHOG_HOST, default us.posthog.com), para nao consultar a
// regiao errada quando o projeto vive na UE.
//
// runPosthogQuery NUNCA retorna null-que-vira-zero: erro propaga como excecao e
// getPosthogStats o traduz para o estado 'error'. Assim o admin distingue "nao
// configurado" de "configurado mas falhando" de "ok sem dados".

// Ranking de gate Pro: por funcionalidade (properties.feature de pro_gate_hit),
// quantas batidas (hits), quantas pessoas distintas bateram (people) e quantas
// dessas assinaram (subscribers, overlap de person_id no periodo). taxa = subscribers/people.
export type ProGateRank = {
  feature: string;
  hits: number;
  people: number;
  subscribers: number;
};

export type PosthogStats = {
  totalPageviews: number;
  uniqueUsers: number;
  pages: Array<{ page: string; views: number }>;
  events: {
    user_signed_up: number;
    user_signed_in: number;
    checkout_started: number;
    checkout_abandoned: number;
    subscription_completed: number;
    quiz_completed: number;
  };
  proGates: ProGateRank[];
  acquisition: Array<{ channel: string; users: number }>;
};

export type PosthogStatsState =
  | { state: "not_configured"; missing: string[] }
  | { state: "error"; reason: string; httpStatus?: number }
  | { state: "ok"; hasData: boolean; stats: PosthogStats };

type PosthogEventName = keyof PosthogStats["events"];

type PosthogQueryResponse = {
  results: ReadonlyArray<ReadonlyArray<unknown>>;
  columns?: ReadonlyArray<string>;
};

class PosthogQueryError extends Error {
  readonly httpStatus?: number;
  constructor(message: string, httpStatus?: number) {
    super(message);
    this.name = "PosthogQueryError";
    this.httpStatus = httpStatus;
  }
}

function cellToNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value) || 0;
}

// Leitura via HogQL no endpoint /query/ (POST), autorizado pela Personal API Key
// (phx_). Em qualquer nao-2xx, lanca com status HTTP e uma dica util (401/403 =
// key sem escopo para /query/), em vez de engolir e retornar zero.
async function runPosthogQuery(hogql: string): Promise<PosthogQueryResponse> {
  const response = await fetch(
    `${env.posthogHost}/api/projects/${env.posthogProjectId}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.posthogApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query: hogql } }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const hint =
      response.status === 401 || response.status === 403
        ? "personal api key sem escopo para /query/ (ou invalida)"
        : "resposta nao-2xx do PostHog";
    const detail = body ? `: ${body.slice(0, 200)}` : "";
    throw new PosthogQueryError(
      `${hint} (status ${response.status})${detail}`,
      response.status,
    );
  }

  return (await response.json()) as PosthogQueryResponse;
}

function emptyStats(): PosthogStats {
  return {
    totalPageviews: 0,
    uniqueUsers: 0,
    pages: [],
    events: {
      user_signed_up: 0,
      user_signed_in: 0,
      checkout_started: 0,
      checkout_abandoned: 0,
      subscription_completed: 0,
      quiz_completed: 0,
    },
    proGates: [],
    acquisition: [],
  };
}

// Formato de data aceito por toDateTime() do HogQL: 'YYYY-MM-DD HH:MM:SS' em UTC.
// A data vem re-serializada de um Date (canonica), entao nao ha injecao possivel.
function hogTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

// Estado de leitura do PostHog para o admin. Nunca retorna zeros por falha:
// - falta de env -> not_configured (lista o que falta).
// - falha de rede/HTTP -> error (com reason e httpStatus).
// - resposta valida -> ok, com hasData=false legitimo quando nao ha trafego.
export async function getPosthogStats(
  params: { from?: Date; to?: Date } = {},
): Promise<PosthogStatsState> {
  const missing: string[] = [];
  if (!env.posthogApiKey) missing.push("POSTHOG_API_KEY");
  if (!env.posthogProjectId) missing.push("POSTHOG_PROJECT_ID");
  if (missing.length > 0) return { state: "not_configured", missing };

  // Default: ultimos 30 dias (nao quebra chamadas existentes, ex.: integrations/health).
  const to = params.to ?? new Date();
  const from = params.from ?? new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  // Janela [from, to] em toDateTime; reusada em todas as queries e nas subqueries.
  const win = `timestamp >= toDateTime('${hogTime(from)}') and timestamp <= toDateTime('${hogTime(to)}')`;

  const eventNames: PosthogEventName[] = [
    "user_signed_up",
    "user_signed_in",
    "checkout_started",
    "checkout_abandoned",
    "subscription_completed",
    "quiz_completed",
  ];
  const eventList = eventNames.map((e) => `'${e}'`).join(",");

  try {
    const [pageviews, uniqueUsers, pages, customEvents, proGates, acquisition] =
      await Promise.all([
        runPosthogQuery(
          `select count() from events where event = '$pageview' and ${win}`,
        ),
        runPosthogQuery(
          `select count(distinct person_id) from events where event = '$pageview' and ${win}`,
        ),
        runPosthogQuery(
          `select if(trimRight(path(properties.$current_url), '/') = '', '/', trimRight(path(properties.$current_url), '/')) as page, count() as views from events where event = '$pageview' and ${win} group by page order by views desc limit 10`,
        ),
        runPosthogQuery(
          `select event, count() as total from events where event in (${eventList}) and ${win} group by event`,
        ),
        // Ranking de gate Pro com taxa de conversao. subscribers = pessoas que
        // bateram no gate E aparecem em subscription_completed no MESMO periodo
        // (overlap de person_id; aproximacao documentada, nao "estritamente
        // depois"). Query unica via subquery IN.
        runPosthogQuery(
          `select properties.feature as feature, count() as hits, count(distinct person_id) as people, count(distinct if(person_id in (select distinct person_id from events where event = 'subscription_completed' and ${win}), person_id, null)) as subscribers from events where event = 'pro_gate_hit' and ${win} and properties.feature is not null group by feature order by people desc limit 20`,
        ),
        runPosthogQuery(
          `select trimRight(properties.$referring_domain, '/') as domain, count(distinct person_id) as users from events where event = '$pageview' and ${win} and properties.$referring_domain is not null group by domain order by users desc limit 6`,
        ),
      ]);

    const stats = emptyStats();
    stats.totalPageviews = cellToNumber(pageviews.results?.[0]?.[0]);
    stats.uniqueUsers = cellToNumber(uniqueUsers.results?.[0]?.[0]);
    stats.pages = (pages.results || [])
      .map((row) => ({ page: String(row[0] ?? "/"), views: cellToNumber(row[1]) }))
      .filter((item) => item.views > 0)
      .slice(0, 10);

    for (const row of customEvents.results || []) {
      const eventName = eventNames.find((event) => event === String(row[0]));
      if (eventName) stats.events[eventName] = cellToNumber(row[1]);
    }

    stats.proGates = (proGates.results || [])
      .map((row) => ({
        feature: String(row[0] ?? ""),
        hits: cellToNumber(row[1]),
        people: cellToNumber(row[2]),
        subscribers: cellToNumber(row[3]),
      }))
      .filter((item) => item.feature && item.people > 0);

    stats.acquisition = (acquisition.results || [])
      .map((row) => ({
        channel: String(row[0] ?? "Direto"),
        users: cellToNumber(row[1]),
      }))
      .filter((item) => item.users > 0)
      .slice(0, 6);

    const hasData =
      stats.totalPageviews > 0 ||
      stats.uniqueUsers > 0 ||
      stats.pages.length > 0 ||
      Object.values(stats.events).some((value) => value > 0) ||
      stats.proGates.length > 0 ||
      stats.acquisition.length > 0;

    return { state: "ok", hasData, stats };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    const httpStatus =
      err instanceof PosthogQueryError ? err.httpStatus : undefined;
    return { state: "error", reason, httpStatus };
  }
}
