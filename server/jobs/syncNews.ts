import { env } from "../lib/env";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const FETCH_TIMEOUT_MS = 10_000;

type SyncNewsResult = {
  found: number;
  created: number;
  updated: number;
  failed: number;
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

export async function syncNews(): Promise<SyncNewsResult> {
  const result = { found: 0, created: 0, updated: 0, failed: 0 };

  if (!env.currentsApiKey) {
    console.log("[sync-news] CURRENTS_API_KEY não configurada, pulando");
    return result;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = new URL("https://api.currentsapi.services/v1/search");
    url.searchParams.set("language", "pt");
    url.searchParams.set("keywords", "tecnologia,programação,carreira tech");
    url.searchParams.set("apiKey", env.currentsApiKey);
    url.searchParams.set("limit", "20");

    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      console.error("[sync-news] Currents API error:", res.status);
      return result;
    }

    const data = (await res.json()) as { news?: CurrentsArticle[] };
    const articles = Array.isArray(data.news) ? data.news : [];
    result.found = articles.length;

    for (const article of articles) {
      const urlValue = typeof article.url === "string" ? article.url : "";
      const title = typeof article.title === "string" ? article.title : "";
      if (!urlValue || !title) continue;

      const slug = urlValue
        .replace(/https?:\/\//, "")
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase()
        .slice(0, 100);

      const { error } = await supabaseAdmin.from("news").upsert(
        {
          slug,
          title,
          summary: typeof article.description === "string" ? article.description : null,
          url: urlValue,
          image_url: typeof article.image === "string" ? article.image : null,
          source: typeof article.author === "string" && article.author.trim() ? article.author : "Currents API",
          published_at: typeof article.published === "string" ? article.published : new Date().toISOString(),
          tags: typeof article.category === "string" ? [article.category] : [],
          is_external: true,
          is_published: true,
        },
        { onConflict: "url" },
      );

      if (error) result.failed += 1;
      else result.created += 1;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(err instanceof Error && err.name === "AbortError" ? "[sync-news] Timeout ao buscar notícias" : "[sync-news] Erro:", message);
  } finally {
    clearTimeout(timeout);
  }

  console.log(`[sync-news] Resultado: ${result.created} salvas, ${result.failed} falhas`);
  return result;
}
