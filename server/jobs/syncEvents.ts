import { env } from "../lib/env";

const FETCH_TIMEOUT_MS = 10_000;

type SyncEventsResult = {
  found: number;
  created: number;
  updated: number;
  failed: number;
};

export async function syncEvents(): Promise<SyncEventsResult> {
  const result = { found: 0, created: 0, updated: 0, failed: 0 };

  if (!env.symplaApiKey) {
    console.log("[sync-events] SYMPLA_API_KEY não configurada, pulando");
    return result;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.sympla.com.br/public/v3/events?size=20&page=1&sort=startDate", {
      headers: { s_token: env.symplaApiKey },
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error("[sync-events] Sympla API error:", res.status);
      return result;
    }

    const data = (await res.json()) as { data?: unknown[] };
    result.found = Array.isArray(data.data) ? data.data.length : 0;
    console.log(`[sync-events] ${result.found} eventos encontrados`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(err instanceof Error && err.name === "AbortError" ? "[sync-events] Timeout ao buscar eventos" : "[sync-events] Erro:", message);
  } finally {
    clearTimeout(timeout);
  }

  return result;
}
