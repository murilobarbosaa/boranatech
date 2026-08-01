import { env } from "./env";

// Leitura de issues via API REST do Sentry pra aba Bugs & Erros do admin.
// Mesmo contrato de estados do posthog.ts: not_configured (falta env, o
// endpoint vira 503), rate_limited (429 do Sentry, repassado como 429),
// error (HTTP nao-2xx, timeout ou payload inesperado) e ok. Nunca lanca.

export type SentryIssue = {
  id: string;
  shortId: string;
  /** Slug do projeto de origem. Vazio quando a API nao mandou. */
  projectSlug: string;
  title: string;
  culprit: string;
  level: string;
  status: string;
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
};

export type SentryIssuesResult =
  | { state: "not_configured"; missing: string[] }
  | { state: "rate_limited"; retryAfterSeconds: number | null }
  | { state: "error"; reason: string; httpStatus?: number }
  | {
      state: "ok";
      issues: SentryIssue[];
      nextCursor: string | null;
      prevCursor: string | null;
    };

const SENTRY_API_BASE = "https://sentry.io/api/0";

/**
 * `-1` e a forma da API do Sentry de dizer TODOS os projetos da organizacao.
 *
 * Por que o painel passou a consultar a organizacao em vez de um projeto:
 * `SENTRY_PROJECT_SLUG` era singular, e no dia em que nasceu o projeto de
 * browser (`boranatech-front`, 2026-07-28) a tela "Erros capturados pelo
 * Sentry" passaria a listar METADE dos erros, sem dar erro e sem avisar. Um
 * instrumento que existe para enxergar falha escondida, escondendo falha. Com
 * `-1` o conjunto e descoberto pelo servidor a cada chamada: projeto novo entra
 * sozinho, e nao ha lista, contagem nem slug para alguem lembrar de atualizar.
 *
 * A origem continua legivel porque o `shortId` ja tras o prefixo por projeto
 * (`NODE-EXPRESS-B`, `BORANATECH-FRONT-A`), e agora tambem em `projectSlug`.
 */
const TODOS_OS_PROJETOS = "-1";
const REQUEST_TIMEOUT_MS = 10_000;
// Lote da busca por id numerico: uma request por lote, nunca uma por card.
const SENTRY_ID_QUERY_CHUNK = 25;

// O Sentry pagina por cursor no header Link, no formato:
//   <url>; rel="previous"; results="false"; cursor="0:0:1",
//   <url>; rel="next"; results="true"; cursor="0:100:0"
// So existe pagina naquela direcao quando results="true"; cursor com
// results="false" e devolvido mesmo assim e NAO deve ser repassado.
export function parseLinkCursor(
  linkHeader: string | null,
  rel: "next" | "previous",
): string | null {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(",")) {
    if (!part.includes(`rel="${rel}"`)) continue;
    if (!part.includes('results="true"')) return null;
    const match = part.match(/cursor="([^"]+)"/);
    return match ? match[1] : null;
  }
  return null;
}

function toIssue(raw: Record<string, unknown>): SentryIssue {
  // count vem como string na API do Sentry; o resto ja vem no tipo esperado.
  // Campo ausente ou de tipo errado vira default neutro, nunca crash.
  const str = (value: unknown) => (typeof value === "string" ? value : "");
  const num = (value: unknown) => {
    const parsed = typeof value === "string" ? Number(value) : value;
    return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 0;
  };
  return {
    id: str(raw.id),
    shortId: str(raw.shortId),
    projectSlug: str(
      (raw.project as Record<string, unknown> | undefined)?.slug,
    ),
    title: str(raw.title),
    culprit: str(raw.culprit),
    level: str(raw.level),
    status: str(raw.status),
    count: num(raw.count),
    userCount: num(raw.userCount),
    firstSeen: str(raw.firstSeen),
    lastSeen: str(raw.lastSeen),
    permalink: str(raw.permalink),
  };
}

/**
 * Janelas que a listagem do Sentry aceita. Lista FECHADA, nao formato.
 *
 * A validacao morava no schema de querystring da rota de bugs, que saiu na Fase
 * 5 junto com a aba. Ela desceu para ca porque o dono da regra sempre foi este
 * modulo: quem impoe o conjunto e a API do Sentry, e todo chamador desta funcao
 * esta sujeito a ela. Guarda dentro da funcao cobre os chamadores que ainda nao
 * existem, que e a regra do CLAUDE.md.
 *
 * Medido contra a API viva: `''`, `24h` e `14d` respondem 200; qualquer outro
 * valor (`7d`, `30d`, `90d`, `1h`) responde 400. Sao sintaticamente impecaveis e
 * mesmo assim invalidos, e e por isso que validar FORMATO aqui deixaria passar.
 */
export const PERIODOS_DE_LISTAGEM = ["", "24h", "14d"] as const;

export async function listSentryIssues(params?: {
  query?: string;
  cursor?: string;
  statsPeriod?: string;
}): Promise<SentryIssuesResult> {
  const periodo = params?.statsPeriod ?? "14d";
  if (!(PERIODOS_DE_LISTAGEM as readonly string[]).includes(periodo)) {
    // Estado de erro, e nao excecao: o contrato deste modulo e "nunca lanca". E
    // nao chama a API: mandar um valor que sabemos invalido gastaria uma
    // requisicao para receber um 400 previsivel.
    return {
      state: "error",
      reason: `statsPeriod inválido: ${periodo}. Aceitos: ${PERIODOS_DE_LISTAGEM.map((p) => p || "(vazio)").join(", ")}.`,
    };
  }

  const missing: string[] = [];
  if (!env.sentryAuthToken) missing.push("SENTRY_AUTH_TOKEN");
  if (!env.sentryOrgSlug) missing.push("SENTRY_ORG_SLUG");
  if (missing.length > 0) return { state: "not_configured", missing };

  // ORGANIZACAO, nao projeto. Ver TODOS_OS_PROJETOS.
  const url = new URL(`${SENTRY_API_BASE}/organizations/${env.sentryOrgSlug}/issues/`);
  url.searchParams.set("project", TODOS_OS_PROJETOS);
  url.searchParams.set("query", params?.query ?? "is:unresolved");
  url.searchParams.set("statsPeriod", periodo);
  if (params?.cursor) url.searchParams.set("cursor", params.cursor);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${env.sentryAuthToken}` },
      signal: controller.signal,
    });

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      return {
        state: "rate_limited",
        retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : null,
      };
    }

    if (!response.ok) {
      return {
        state: "error",
        reason: `Sentry respondeu ${response.status}.`,
        httpStatus: response.status,
      };
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      return { state: "error", reason: "Resposta do Sentry fora do formato esperado." };
    }

    const link = response.headers.get("Link");
    return {
      state: "ok",
      issues: payload.map((raw) => toIssue(raw as Record<string, unknown>)),
      nextCursor: parseLinkCursor(link, "next"),
      prevCursor: parseLinkCursor(link, "previous"),
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      state: "error",
      reason: aborted
        ? `Timeout de ${REQUEST_TIMEOUT_MS / 1000}s na API do Sentry.`
        : error instanceof Error
          ? error.message
          : "Falha desconhecida na API do Sentry.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

// --- Escrita e leitura pontual para a sincronizacao do bug tracker ---------
// Mesmo contrato de estados das leituras acima. Nenhuma funcao lanca: erro e
// sempre um estado discriminado, para o job/rota decidirem retry vs seguir.

export type SentryShortIdResult =
  | { state: "not_configured"; missing: string[] }
  | { state: "rate_limited"; retryAfterSeconds: number | null }
  | { state: "not_found" }
  | { state: "error"; reason: string; httpStatus?: number }
  | { state: "ok"; groupId: string };

export type SentryWriteResult =
  | { state: "not_configured"; missing: string[] }
  | { state: "rate_limited"; retryAfterSeconds: number | null }
  | { state: "error"; reason: string; httpStatus?: number }
  | { state: "ok" };

export type SentryIssuesByIdResult =
  | { state: "not_configured"; missing: string[] }
  | { state: "rate_limited"; retryAfterSeconds: number | null }
  | { state: "error"; reason: string; httpStatus?: number }
  | { state: "ok"; issues: SentryIssue[] };

type SentryConfig = { token: string; org: string };

function resolveSentryConfig():
  | { ok: true; config: SentryConfig }
  | { ok: false; missing: string[] } {
  const missing: string[] = [];
  if (!env.sentryAuthToken) missing.push("SENTRY_AUTH_TOKEN");
  if (!env.sentryOrgSlug) missing.push("SENTRY_ORG_SLUG");
  if (missing.length > 0) return { ok: false, missing };
  return {
    ok: true,
    config: { token: env.sentryAuthToken, org: env.sentryOrgSlug },
  };
}

// Fetch com timeout + mapeamento de 429/abort para estados. O caller trata o
// status HTTP do Response. Nunca lanca.
async function sentryFetch(
  url: URL | string,
  init: RequestInit & { token: string },
): Promise<
  | { kind: "response"; response: Response }
  | { kind: "rate_limited"; retryAfterSeconds: number | null }
  | { kind: "error"; reason: string }
> {
  const { token, headers, ...rest } = init;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...rest,
      headers: { Authorization: `Bearer ${token}`, ...(headers ?? {}) },
      signal: controller.signal,
    });
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      return {
        kind: "rate_limited",
        retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : null,
      };
    }
    return { kind: "response", response };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      kind: "error",
      reason: aborted
        ? `Timeout de ${REQUEST_TIMEOUT_MS / 1000}s na API do Sentry.`
        : error instanceof Error
          ? error.message
          : "Falha desconhecida na API do Sentry.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

// GET /organizations/{org}/shortids/{short_id}/ -> groupId numerico. not_found
// (404) sinaliza issue deletada (o caller marca o card como orfao).
export async function resolveShortId(
  shortId: string,
): Promise<SentryShortIdResult> {
  const cfg = resolveSentryConfig();
  if (!cfg.ok) return { state: "not_configured", missing: cfg.missing };

  const url = `${SENTRY_API_BASE}/organizations/${cfg.config.org}/shortids/${encodeURIComponent(shortId)}/`;
  const r = await sentryFetch(url, { token: cfg.config.token });
  if (r.kind === "rate_limited")
    return { state: "rate_limited", retryAfterSeconds: r.retryAfterSeconds };
  if (r.kind === "error") return { state: "error", reason: r.reason };

  const { response } = r;
  if (response.status === 404) return { state: "not_found" };
  if (!response.ok)
    return {
      state: "error",
      reason: `Sentry respondeu ${response.status}.`,
      httpStatus: response.status,
    };

  const payload = (await response.json().catch(() => null)) as {
    groupId?: unknown;
  } | null;
  const groupId =
    typeof payload?.groupId === "string"
      ? payload.groupId
      : typeof payload?.groupId === "number"
        ? String(payload.groupId)
        : "";
  if (!groupId) return { state: "error", reason: "shortid sem groupId." };
  return { state: "ok", groupId };
}

// PUT /issues/{numeric_id}/ { status }. Achado do teste manual: reverter para
// unresolved seta substatus 'regressed' no Sentry sem evento novo; NAO usamos
// status/substatus como sinal de recorrencia (o job usa lastSeen > resolved_at).
export async function updateIssueStatus(
  numericId: string,
  status: "resolved" | "unresolved",
): Promise<SentryWriteResult> {
  const cfg = resolveSentryConfig();
  if (!cfg.ok) return { state: "not_configured", missing: cfg.missing };

  const url = `${SENTRY_API_BASE}/issues/${encodeURIComponent(numericId)}/`;
  const r = await sentryFetch(url, {
    token: cfg.config.token,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (r.kind === "rate_limited")
    return { state: "rate_limited", retryAfterSeconds: r.retryAfterSeconds };
  if (r.kind === "error") return { state: "error", reason: r.reason };
  if (!r.response.ok)
    return {
      state: "error",
      reason: `Sentry respondeu ${r.response.status}.`,
      httpStatus: r.response.status,
    };
  return { state: "ok" };
}

// Estado atual de varias issues por id numerico, em lote (chunks de
// SENTRY_ID_QUERY_CHUNK), para a reconciliacao. Uma request por lote, nunca uma
// por card. Filtro por id: query `issue.id:[a, b, ...]`. VALIDAR EMPIRICAMENTE
// (sintaxe de busca do Sentry, como as notas de PostgREST no projeto): uma issue
// nao retornada no lote e tratada pelo job como "sem evento novo" (fail-safe:
// nunca reabre por ausencia).
export async function getIssuesByNumericIds(
  numericIds: string[],
): Promise<SentryIssuesByIdResult> {
  const cfg = resolveSentryConfig();
  if (!cfg.ok) return { state: "not_configured", missing: cfg.missing };

  const ids = Array.from(
    new Set(numericIds.filter((id) => id.trim().length > 0)),
  );
  if (ids.length === 0) return { state: "ok", issues: [] };

  const collected: SentryIssue[] = [];
  for (let i = 0; i < ids.length; i += SENTRY_ID_QUERY_CHUNK) {
    const chunk = ids.slice(i, i + SENTRY_ID_QUERY_CHUNK);
    const url = new URL(
      `${SENTRY_API_BASE}/organizations/${cfg.config.org}/issues/`,
    );
    url.searchParams.set("project", TODOS_OS_PROJETOS);
    url.searchParams.set("query", `issue.id:[${chunk.join(", ")}]`);
    // statsPeriod OMITIDO, e nao enviado vazio.
    //
    // ATE 2026-07-30 esta linha era `set("statsPeriod", "")`, com o comentario
    // de que '' nao aplica corte por tempo. A premissa valia; o jeito de
    // expressa-la deixou de valer. `searchParams.set(k, "")` MANDA `statsPeriod=`
    // na URL, e em algum ponto de 2026-07-30 a API passou a recusar isso:
    //
    //   HTTP 400 {"detail":"Invalid statsPeriod: ''"}
    //
    // Medido nos dois sentidos contra a API viva em 2026-07-31:
    //   statsPeriod=      -> 400
    //   (parametro ausente) -> 200
    //   statsPeriod=24h   -> 200, e RECORTA (issue de 9 dias nao volta)
    //   statsPeriod=14d   -> 200
    //
    // Consequencia em producao: reconcileDoneCards, que depende desta funcao,
    // vinha respondendo `reconcileSkipped: error 400` em TODA run desde
    // 2026-07-30 13:15 (78 runs seguidas quando isto foi descoberto). A fase de
    // reabertura automatica de bug estava morta, e o fail-safe "falha de leitura
    // nao toca em card nenhum" e o que impediu isso de virar dano.
    //
    // Omitir preserva a intencao original (sem corte por tempo) sem depender de
    // como a API trata string vazia. NAO trocar por 14d: a poda por silencio
    // precisa enxergar issue quieta ha mais de 21 dias, e 14d a esconderia.

    const r = await sentryFetch(url, { token: cfg.config.token });
    if (r.kind === "rate_limited")
      return { state: "rate_limited", retryAfterSeconds: r.retryAfterSeconds };
    if (r.kind === "error") return { state: "error", reason: r.reason };
    if (!r.response.ok) {
      // Corpo da resposta no reason: o Sentry devolve a causa em texto (ex.:
      // {"detail":"Invalid stats_period..."}). Sem isso o log so via "400" e a
      // causa real so aparecia testando a API na mao.
      const body = (await r.response.text().catch(() => "")).slice(0, 500);
      return {
        state: "error",
        reason: `Sentry respondeu ${r.response.status}${body ? `: ${body}` : "."}`,
        httpStatus: r.response.status,
      };
    }

    const payload: unknown = await r.response.json().catch(() => null);
    if (!Array.isArray(payload))
      return {
        state: "error",
        reason: "Resposta do Sentry fora do formato esperado.",
      };
    for (const raw of payload)
      collected.push(toIssue(raw as Record<string, unknown>));
  }

  return { state: "ok", issues: collected };
}

// --- Detalhe do ultimo evento, para o bloco sentry_data do card ------------
//
// POR QUE `/events/latest/` E NAO O DETALHE DA ISSUE. Medido contra a API em
// 2026-07-31, e o resultado corrige a estimativa do plano (que previa ate 3
// requisicoes por issue nova):
//
//   GET /issues/{id}/           -> traz firstRelease/lastRelease, mas as `tags`
//                                  vem so com {key, name, totalValues}, SEM os
//                                  valores. Nao da o environment.
//   GET /issues/{id}/events/latest/ -> traz `tags` com VALOR (environment,
//                                  release, url), `release` e `entries`, onde
//                                  mora o stack. Tudo numa requisicao.
//
// Entao o custo real e UMA requisicao extra por issue NOVA, nunca por issue ja
// vista. Quem ja tem card so e atualizado pelos campos que o lote da listagem
// ja devolve de graca (lastSeen, count, userCount, status).

export type SentryEventDetail = {
  environment: string | null;
  release: string | null;
  url: string | null;
  /** Resumo textual das frames do topo. Null quando o evento nao tem stack. */
  stack: string | null;
};

export type SentryEventResult =
  | { state: "not_configured"; missing: string[] }
  | { state: "rate_limited"; retryAfterSeconds: number | null }
  | { state: "not_found" }
  | { state: "error"; reason: string; httpStatus?: number }
  | { state: "ok"; detail: SentryEventDetail };

/** Teto de frames no resumo do stack: o bloco vai para jsonb e e lido por gente. */
const STACK_MAX_FRAMES = 12;

function extrairStack(entries: unknown): string | null {
  if (!Array.isArray(entries)) return null;
  const excecao = entries.find(
    (e) => (e as Record<string, unknown> | null)?.type === "exception",
  ) as Record<string, unknown> | undefined;
  if (!excecao) return null;
  const values = (excecao.data as Record<string, unknown> | undefined)?.values;
  if (!Array.isArray(values) || values.length === 0) return null;
  const frames = (
    (values[0] as Record<string, unknown>)?.stacktrace as
      | Record<string, unknown>
      | undefined
  )?.frames;
  if (!Array.isArray(frames) || frames.length === 0) return null;
  // Sentry devolve da mais antiga para a mais recente; o topo interessa mais.
  const linhas = frames
    .slice(-STACK_MAX_FRAMES)
    .reverse()
    .map((f) => {
      const frame = f as Record<string, unknown>;
      const fn = typeof frame.function === "string" ? frame.function : "?";
      const arquivo =
        typeof frame.filename === "string"
          ? frame.filename
          : typeof frame.module === "string"
            ? frame.module
            : "?";
      const linha = typeof frame.lineNo === "number" ? `:${frame.lineNo}` : "";
      return `${fn} (${arquivo}${linha})`;
    });
  return linhas.length > 0 ? linhas.join("\n") : null;
}

export async function getIssueLatestEvent(
  numericId: string,
): Promise<SentryEventResult> {
  const cfg = resolveSentryConfig();
  if (!cfg.ok) return { state: "not_configured", missing: cfg.missing };

  const url = `${SENTRY_API_BASE}/issues/${encodeURIComponent(numericId)}/events/latest/`;
  const r = await sentryFetch(url, { token: cfg.config.token });
  if (r.kind === "rate_limited")
    return { state: "rate_limited", retryAfterSeconds: r.retryAfterSeconds };
  if (r.kind === "error") return { state: "error", reason: r.reason };

  const { response } = r;
  // 404 aqui NAO e issue inexistente: e issue sem evento retido (retencao
  // vencida). O card continua valido; so o detalhe nao existe mais.
  if (response.status === 404) return { state: "not_found" };
  if (!response.ok)
    return {
      state: "error",
      reason: `Sentry respondeu ${response.status}.`,
      httpStatus: response.status,
    };

  const payload = (await response.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!payload) return { state: "error", reason: "Evento fora do formato esperado." };

  const tags = Array.isArray(payload.tags)
    ? (payload.tags as Array<Record<string, unknown>>)
    : [];
  const tag = (chave: string): string | null => {
    const achada = tags.find((t) => t.key === chave);
    return typeof achada?.value === "string" ? achada.value : null;
  };

  return {
    state: "ok",
    detail: {
      environment: tag("environment"),
      release:
        typeof payload.release === "object" && payload.release !== null
          ? ((payload.release as Record<string, unknown>).version as string) ??
            tag("release")
          : tag("release"),
      url: tag("url"),
      stack: extrairStack(payload.entries),
    },
  };
}
