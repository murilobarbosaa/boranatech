import type { ContentSourceStatus } from "./contracts";
import { apiUrl } from "@/lib/api";

// Funcoes puras de API do conteudo, sem nenhum import de data files
// estaticos (data.ts, technologyData, platformData, dicasData, glossary).
// Consumidas pela home (UltimaNoticia) sem arrastar o catalogo pro boot.
// O contentService reexporta tudo daqui para os consumidores lazy.

const API_BASE = apiUrl("/api/content");

export async function apiFetch(path: string) {
  const res = await fetch(`${API_BASE}${path}`);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || "Erro ao buscar conteúdo");
  }

  return res.json();
}

export type NewsLevel = "iniciante" | "intermediario" | "avancado";

export type NewsKeyword =
  | "artificial intelligence"
  | "software engineering"
  | "cybersecurity"
  | "tech startup";

export interface NewsItem {
  id: string;
  titulo: string;
  resumo: string;
  fonte: string;
  data: string;
  link: string;
  imagem: string | null;
  nivel: NewsLevel | null;
  porQueImporta: string | null;
  categoria: string;
  sourceKeyword: NewsKeyword | null;
}

export interface NewsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface NewsResponse {
  items: NewsItem[];
  pagination: NewsPagination;
}

export interface GetNewsParams {
  page?: number;
  limit?: number;
  level?: NewsLevel;
  q?: string;
}

const VALID_LEVELS: NewsLevel[] = ["iniciante", "intermediario", "avancado"];

const KEYWORD_PATTERNS: Array<{ keyword: NewsKeyword; pattern: RegExp }> = [
  {
    keyword: "cybersecurity",
    pattern:
      /\b(cybersecurity|cyber[\s-]?security|cyberattack|hack(?:er|ers|ing|ed)?|breach(?:es|ed)?|ransomware|malware|phishing|cve-\d|zero[\s-]?day|exploit(?:s|ed|ing)?|vulnerab(?:le|ility|ilities))\b/i,
  },
  {
    keyword: "artificial intelligence",
    pattern:
      /\b(ai|a\.i\.|artificial intelligence|machine learning|deep learning|neural network|llm|llms|gpt-?\d?|chatgpt|openai|anthropic|claude|gemini|mistral|generative ai|copilot|nvidia)\b/i,
  },
  {
    keyword: "tech startup",
    pattern:
      /\b(startup|series\s+[a-f]|ipo|funding|venture|vc\b|raised|valuation|founders?|seed round|pre-?seed|unicorn)\b/i,
  },
  {
    keyword: "software engineering",
    pattern:
      /\b(developer|programming|software|framework|open[\s-]?source|github|api|sdk|kubernetes|docker|javascript|typescript|python|node\.?js|react|coding|backend|frontend|devops)\b/i,
  },
];

export function inferKeyword(
  title: string,
  summary: string,
): NewsKeyword | null {
  if (!title) return null;
  const text = `${title} ${summary || ""}`;
  for (const { keyword, pattern } of KEYWORD_PATTERNS) {
    if (pattern.test(text)) return keyword;
  }
  return null;
}

function sanitizeImageUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (!/^https?:\/\//.test(raw)) return null;
  return raw;
}

function newsFromApi(row: any): NewsItem {
  const tags = Array.isArray(row.tags)
    ? row.tags.filter((tag: unknown) => typeof tag === "string")
    : [];
  const publishedAt = row.published_at ? new Date(row.published_at) : null;
  const categoria = tags[0] || "Tecnologia";
  const nivel = VALID_LEVELS.includes(row.level)
    ? (row.level as NewsLevel)
    : null;
  const title = typeof row.title === "string" ? row.title : "";
  const summary = typeof row.summary === "string" ? row.summary : "";

  return {
    id: row.slug || row.id,
    titulo: row.title_pt_br || title,
    resumo: row.summary_pt_br || summary,
    fonte: row.source || "Fonte externa",
    data:
      publishedAt && !Number.isNaN(publishedAt.getTime())
        ? publishedAt.toLocaleDateString("pt-BR")
        : "",
    link: row.url,
    imagem: sanitizeImageUrl(row.image_url),
    nivel,
    porQueImporta: row.why_it_matters || null,
    categoria,
    sourceKeyword: inferKeyword(title, summary),
  };
}

function jobFromApi(row: any) {
  return {
    id: row.id,
    title: row.title,
    company: row.company || "Empresa não informada",
    location: row.remote ? "Remoto" : row.location || "Brasil",
    remote: row.remote === true,
    seniority: row.seniority || "junior",
    url: row.url,
    areaSlug: row.area_slug || "",
    publishedAt: row.published_at || null,
  };
}

export async function getContentSourceStatus(): Promise<ContentSourceStatus[]> {
  try {
    const json = await apiFetch("/sources/status");
    return json.data.map((source: any) => ({
      source: source.code || source.type || source.name,
      status: source.status || "inactive",
      lastSyncLabel: source.last_sync_at
        ? new Date(source.last_sync_at).toLocaleString("pt-BR")
        : "Ainda não sincronizado",
    }));
  } catch {
    return [
      {
        source: "cms",
        status: "ready",
        lastSyncLabel: "API local indisponível",
      },
      {
        source: "rss",
        status: "inactive",
        lastSyncLabel: "Usando curadoria local",
      },
      {
        source: "jobs-api",
        status: "inactive",
        lastSyncLabel: "Aguardando sincronização externa",
      },
      {
        source: "events-api",
        status: "inactive",
        lastSyncLabel: "Aguardando sincronização externa",
      },
    ];
  }
}

export async function getNews(
  params: GetNewsParams = {},
): Promise<NewsResponse | null> {
  try {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.level) qs.set("level", params.level);
    if (params.q) qs.set("q", params.q);
    const json = await apiFetch(`/news${qs.toString() ? `?${qs}` : ""}`);
    const items = Array.isArray(json.data) ? json.data.map(newsFromApi) : [];
    const p = json.pagination ?? {};
    return {
      items,
      pagination: {
        page: p.page ?? 1,
        limit: p.limit ?? items.length,
        total: p.total ?? items.length,
        totalPages: p.total_pages ?? 1,
        hasNext: p.has_next ?? false,
        hasPrev: p.has_prev ?? false,
      },
    };
  } catch {
    return null;
  }
}

export async function getJobs(params?: {
  area?: string;
  seniority?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const qs = new URLSearchParams();
    if (params?.area) qs.set("area", params.area);
    if (params?.seniority) qs.set("seniority", params.seniority);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const json = await apiFetch(`/jobs${qs.toString() ? `?${qs}` : ""}`);
    return json.data.map(jobFromApi);
  } catch {
    return [];
  }
}
