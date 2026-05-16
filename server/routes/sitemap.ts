import { Router } from "express";

import { supabaseAdmin } from "../lib/supabaseAdmin";

const router = Router();
const SITE_URL = "https://www.boranatech.com.br";
const CACHE_SECONDS = 60 * 60;

type SitemapEntry = {
  loc: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: string;
  lastmod?: string | null;
};

const staticEntries: SitemapEntry[] = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/areas", changefreq: "weekly", priority: "0.9" },
  { loc: "/roadmaps", changefreq: "weekly", priority: "0.9" },
  { loc: "/cursos", changefreq: "weekly", priority: "0.9" },
  { loc: "/plataformas", changefreq: "weekly", priority: "0.8" },
  { loc: "/faculdades", changefreq: "monthly", priority: "0.7" },
  { loc: "/dicionario", changefreq: "weekly", priority: "0.7" },
  { loc: "/quiz-carreira", changefreq: "monthly", priority: "0.9" },
  { loc: "/comparador", changefreq: "monthly", priority: "0.7" },
  { loc: "/eventos", changefreq: "daily", priority: "0.8" },
  { loc: "/projetos", changefreq: "weekly", priority: "0.7" },
  { loc: "/estagio", changefreq: "daily", priority: "0.8" },
  { loc: "/noticias", changefreq: "daily", priority: "0.8" },
  { loc: "/comunidades", changefreq: "monthly", priority: "0.6" },
  { loc: "/mulheres", changefreq: "weekly", priority: "0.7" },
  { loc: "/dicas", changefreq: "weekly", priority: "0.7" },
  { loc: "/sobre", changefreq: "monthly", priority: "0.6" },
  { loc: "/planos", changefreq: "monthly", priority: "0.7" },
  { loc: "/cadastro", changefreq: "yearly", priority: "0.5" },
  { loc: "/licenca", changefreq: "yearly", priority: "0.4" },
  { loc: "/termos-de-uso", changefreq: "yearly", priority: "0.4" },
  { loc: "/privacidade", changefreq: "yearly", priority: "0.4" },
];

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function absoluteLoc(pathname: string) {
  return pathname.startsWith("http") ? pathname : `${SITE_URL}${pathname}`;
}

function toXml(entries: SitemapEntry[]) {
  const seen = new Set<string>();
  const urls = entries
    .filter((entry) => {
      const loc = absoluteLoc(entry.loc);
      if (seen.has(loc)) return false;
      seen.add(loc);
      return true;
    })
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${escapeXml(new Date(entry.lastmod).toISOString())}</lastmod>` : "";
      return `<url><loc>${escapeXml(absoluteLoc(entry.loc))}</loc>${lastmod}<changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

async function fetchDynamicEntries() {
  const entries: SitemapEntry[] = [];

  const [areas, roadmaps, courses, news, jobs] = await Promise.allSettled([supabaseAdmin.from("areas").select("slug, updated_at").eq("is_published", true), supabaseAdmin.from("roadmaps").select("slug, updated_at").eq("is_published", true), supabaseAdmin.from("courses").select("slug, updated_at").eq("is_published", true), supabaseAdmin.from("news").select("slug, published_at").eq("is_published", true), supabaseAdmin.from("external_jobs").select("id, published_at").eq("is_published", true)]);

  if (areas.status === "fulfilled" && !areas.value.error) {
    entries.push(...(areas.value.data || []).map((row) => ({ loc: `/areas/${row.slug}`, changefreq: "monthly" as const, priority: "0.7", lastmod: row.updated_at })));
  }
  if (roadmaps.status === "fulfilled" && !roadmaps.value.error) {
    const lastmod = latestDate((roadmaps.value.data || []).map((row) => row.updated_at));
    if (lastmod) entries.push({ loc: "/roadmaps", changefreq: "weekly", priority: "0.9", lastmod });
  }
  if (courses.status === "fulfilled" && !courses.value.error) {
    const lastmod = latestDate((courses.value.data || []).map((row) => row.updated_at));
    if (lastmod) entries.push({ loc: "/cursos", changefreq: "weekly", priority: "0.9", lastmod });
  }
  if (news.status === "fulfilled" && !news.value.error) {
    const lastmod = latestDate((news.value.data || []).map((row) => row.published_at));
    if (lastmod) entries.push({ loc: "/noticias", changefreq: "daily", priority: "0.8", lastmod });
  }
  if (jobs.status === "fulfilled" && !jobs.value.error) {
    const lastmod = latestDate((jobs.value.data || []).map((row) => row.published_at));
    if (lastmod) entries.push({ loc: "/estagio", changefreq: "daily", priority: "0.8", lastmod });
  }

  return entries;
}

function latestDate(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value)).sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];
}

router.get("/sitemap.xml", async (_req, res, next) => {
  try {
    const dynamicEntries = await fetchDynamicEntries();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`);
    res.send(toXml([...dynamicEntries, ...staticEntries]));
  } catch (err) {
    next(err);
  }
});

export default router;
