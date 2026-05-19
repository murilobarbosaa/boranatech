import { enrichArticle } from "../lib/aiEnrich";
import { env } from "../lib/env";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const FETCH_TIMEOUT_MS = 10_000;
const ENRICH_SLEEP_MS = 200;
const KEYWORDS = [
  "artificial intelligence",
  "software engineering",
  "cybersecurity",
  "startup funding",
];
const PER_KEYWORD_LIMIT = 10;

type SyncNewsResult = {
  found: number;
  created: number;
  updated: number;
  failed: number;
  enriched: number;
};

type CurrentsArticle = {
  title?: unknown;
  description?: unknown;
  url?: unknown;
  image?: unknown;
  author?: unknown;
  published?: unknown;
  category?: unknown;
};

async function fetchKeyword(keyword: string, apiKey: string): Promise<CurrentsArticle[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = new URL("https://api.currentsapi.services/v1/search");
    url.searchParams.set("language", "en");
    url.searchParams.set("keywords", keyword);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("limit", String(PER_KEYWORD_LIMIT));

    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      console.error(`[sync-news] Currents ${res.status} for keyword "${keyword}"`);
      return [];
    }

    const data = (await res.json()) as { news?: CurrentsArticle[] };
    return Array.isArray(data.news) ? data.news : [];
  } finally {
    clearTimeout(timeout);
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function syncNews(): Promise<SyncNewsResult> {
  const result = { found: 0, created: 0, updated: 0, failed: 0, enriched: 0 };

  if (!env.currentsApiKey) {
    console.log("[sync-news] CURRENTS_API_KEY não configurada, pulando");
    return result;
  }

  const byUrl = new Map<string, CurrentsArticle>();

  for (const keyword of KEYWORDS) {
    try {
      const news = await fetchKeyword(keyword, env.currentsApiKey);
      let added = 0;
      for (const article of news) {
        const urlValue = typeof article.url === "string" ? article.url : "";
        if (urlValue && !byUrl.has(urlValue)) {
          byUrl.set(urlValue, article);
          added += 1;
        }
      }
      console.log(`[sync-news] keyword "${keyword}": ${news.length} fetched, ${added} new`);
    } catch (err) {
      result.failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      const isAbort = err instanceof Error && err.name === "AbortError";
      console.error(`[sync-news] keyword "${keyword}" failed${isAbort ? " (timeout)" : ""}:`, message);
    }
  }

  const articles = Array.from(byUrl.values());
  result.found = articles.length;

  const enrichStart = Date.now();
  let enrichFailures = 0;

  for (const article of articles) {
    const urlValue = typeof article.url === "string" ? article.url : "";
    const title = typeof article.title === "string" ? article.title : "";
    if (!urlValue || !title) continue;

    const summary = typeof article.description === "string" ? article.description : "";

    const enrichment = await enrichArticle(title, summary);
    if (enrichment) {
      result.enriched += 1;
    } else {
      enrichFailures += 1;
    }

    const slug = urlValue
      .replace(/https?:\/\//, "")
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()
      .slice(0, 100);

    const { error } = await supabaseAdmin.from("news").upsert(
      {
        slug,
        title,
        summary: summary || null,
        url: urlValue,
        image_url: typeof article.image === "string" ? article.image : null,
        source: typeof article.author === "string" && article.author.trim() ? article.author : "Currents API",
        published_at: typeof article.published === "string" ? article.published : new Date().toISOString(),
        tags: typeof article.category === "string" ? [article.category] : [],
        is_external: true,
        is_published: true,
        title_pt_br: enrichment?.title_pt_br ?? null,
        summary_pt_br: enrichment?.summary_pt_br ?? null,
        level: enrichment?.level ?? null,
        why_it_matters: enrichment?.why_it_matters ?? null,
        enriched_at: enrichment ? new Date().toISOString() : null,
      },
      { onConflict: "url" },
    );

    if (error) result.failed += 1;
    else result.created += 1;

    await sleep(ENRICH_SLEEP_MS);
  }

  const enrichDuration = Date.now() - enrichStart;
  console.log(
    `[sync-news] Resultado: ${result.found} únicos, ${result.created} salvas, ${result.enriched} enriquecidas, ${enrichFailures} sem enrichment, ${result.failed} falhas (enrichment+upsert em ${enrichDuration}ms)`,
  );
  return result;
}
