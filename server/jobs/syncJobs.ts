import { env } from "../lib/env";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const FETCH_TIMEOUT_MS = 15_000;
const TECH_KEYWORDS = ["desenvolvedor", "programador", "engenheiro de software", "data scientist", "UX designer", "devops", "backend", "frontend", "fullstack"];

type SyncJobsResult = {
  found: number;
  created: number;
  updated: number;
  failed: number;
};

type JoobleJob = {
  id?: unknown;
  title?: unknown;
  company?: unknown;
  location?: unknown;
  link?: unknown;
  snippet?: unknown;
  updated?: unknown;
};

export async function syncJobs(): Promise<SyncJobsResult> {
  const result = { found: 0, created: 0, updated: 0, failed: 0 };

  if (!env.joobleApiKey) {
    console.log("[sync-jobs] JOOBLE_API_KEY não configurada, pulando");
    return result;
  }

  for (const keyword of TECH_KEYWORDS.slice(0, 3)) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(`https://jooble.org/api/${env.joobleApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: keyword, location: "Brasil", resultonpage: 20 }),
        signal: controller.signal,
      });

      if (!res.ok) {
        console.error(`[sync-jobs] Jooble API error para "${keyword}":`, res.status);
        continue;
      }

      const data = (await res.json()) as { jobs?: JoobleJob[] };
      const jobs = Array.isArray(data.jobs) ? data.jobs : [];
      result.found += jobs.length;

      for (const job of jobs) {
        const url = typeof job.link === "string" ? job.link : "";
        const title = typeof job.title === "string" ? job.title : "";
        if (!url || !title) continue;

        const location = typeof job.location === "string" ? job.location : "Brasil";
        const { error } = await supabaseAdmin.from("external_jobs").upsert(
          {
            external_id: typeof job.id === "string" ? job.id : null,
            source: "jooble",
            title,
            company: typeof job.company === "string" ? job.company : null,
            location,
            remote: location.toLowerCase().includes("remoto"),
            seniority: detectSeniority(title),
            url,
            description: typeof job.snippet === "string" ? job.snippet : null,
            area_slug: detectArea(title),
            published_at: typeof job.updated === "string" ? job.updated : new Date().toISOString(),
            is_published: true,
          },
          { onConflict: "url" },
        );

        if (error) result.failed += 1;
        else result.created += 1;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[sync-jobs] Erro para keyword "${keyword}":`, message);
    } finally {
      clearTimeout(timeout);
    }
  }

  console.log(`[sync-jobs] Resultado: ${result.created} salvas, ${result.failed} falhas`);
  return result;
}

function detectSeniority(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("sênior") || t.includes("senior") || t.includes("sr.")) return "senior";
  if (t.includes("pleno") || t.includes("mid")) return "pleno";
  if (t.includes("estágio") || t.includes("estagiário") || t.includes("intern")) return "estagio";
  return "junior";
}

function detectArea(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("front") || t.includes("react") || t.includes("vue") || t.includes("angular")) return "frontend";
  if (t.includes("back") || t.includes("node") || t.includes("python") || t.includes("java")) return "backend";
  if (t.includes("dados") || t.includes("data") || t.includes("analytics")) return "dados";
  if (t.includes("ux") || t.includes("design") || t.includes("ui")) return "uxui";
  if (t.includes("devops") || t.includes("cloud") || t.includes("infra")) return "devops";
  if (t.includes("mobile") || t.includes("ios") || t.includes("android")) return "mobile";
  if (t.includes("segurança") || t.includes("security") || t.includes("cyber")) return "ciberseguranca";
  return "backend";
}
