import { dictionaryTerms } from "../../shared/glossaryData";
import { roadmapsV2 } from "../../shared/roadmapV2/content";
import { supabaseAdmin } from "./supabaseAdmin";

// Reindexacao completa e IDEMPOTENTE de search_documents, o indice que alimenta
// a tool search_platform_content do agente.
//
// Contrato:
//  - Upsert pela unique EXISTENTE (resource_type, resource_id); resource_id e o
//    id/slug natural e estavel da fonte. Rodar duas vezes seguidas nao muda nada.
//  - So conteudo publico entra (is_published das fontes; eventos passados ficam
//    fora). Conteudo despublicado sai na remocao de orfaos.
//  - Orfaos sao removidos POR resource_type processado com SUCESSO, nunca por
//    truncate global: falha em uma fonte preserva o indice daquela fonte.
//  - Cada fonte e independente e fail-soft: falha vira entrada em `falhas` e um
//    console.warn, sem abortar as demais.
//  - URLs apontam SEMPRE para rotas reais do App.tsx (as mesmas validadas pelo
//    platformKnowledge); fonte sem pagina propria aponta a pagina indice.
//
// TODO: fontes estaticas de client/src/lib/data.ts (cursos gratuitos, eventos
// estaticos, comunidades, faculdades) ficam FORA desta fase: o modulo importa
// icones React e nao pode ir para shared/ inteiro. Extrair em fase propria.

interface SearchDocumentRow {
  resource_type: string;
  resource_id: string;
  title: string;
  description: string | null;
  url: string | null;
  is_published: boolean;
  updated_at: string;
}

export interface ReindexTypeSummary {
  upserts: number;
  removidos: number;
}

export interface ReindexSummary {
  porTipo: Record<string, ReindexTypeSummary>;
  falhas: string[];
}

// Tetos. Ajustaveis. // TODO: calibrar.
const UPSERT_BATCH_SIZE = 500;
const DELETE_BATCH_SIZE = 200;
const FETCH_PAGE_SIZE = 1000;
const DESCRIPTION_MAX_CHARS = 400;

function compactText(parts: Array<string | null | undefined>): string | null {
  const text = parts
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter((p) => p.length > 0)
    .join(" | ");
  if (!text) return null;
  return text.length > DESCRIPTION_MAX_CHARS
    ? text.slice(0, DESCRIPTION_MAX_CHARS)
    : text;
}

function doc(
  type: string,
  id: string,
  title: string,
  description: string | null,
  url: string,
): SearchDocumentRow {
  return {
    resource_type: type,
    resource_id: id,
    title,
    description,
    url,
    is_published: true,
    updated_at: new Date().toISOString(),
  };
}

// Busca paginada (o PostgREST corta em ~1000 linhas por request). Filtra
// is_published = true na origem: despublicado nao entra e depois cai como orfao.
async function fetchPublishedRows<T>(
  table: string,
  columns: string,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += FETCH_PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(columns)
      .eq("is_published", true)
      .range(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = (data ?? []) as unknown as T[];
    rows.push(...batch);
    if (batch.length < FETCH_PAGE_SIZE) break;
  }
  return rows;
}

interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  provider: string | null;
  level: string | null;
  area_slug: string | null;
}

async function buildCourses(): Promise<SearchDocumentRow[]> {
  const rows = await fetchPublishedRows<CourseRow>(
    "courses",
    "id, title, description, provider, level, area_slug",
  );
  // Sem rota /cursos/:slug no App.tsx: aponta a pagina indice.
  return rows.map((r) =>
    doc(
      "course",
      r.id,
      r.title,
      compactText([r.description, r.provider, r.level, r.area_slug]),
      "/cursos",
    ),
  );
}

interface DbRoadmapRow {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  area_slug: string | null;
}

// Tipo "roadmap" reune as trilhas v2 (canonicas, com pagina /roadmaps/:slug) e
// os roadmaps legados do banco (sem pagina propria: apontam /roadmaps). Os
// resource_ids nao colidem (slug vs uuid).
async function buildRoadmaps(): Promise<SearchDocumentRow[]> {
  const v2Docs = roadmapsV2.map((trail) => {
    const sectionTitles = trail.sections.map((s) => s.title).join(", ");
    return doc(
      "roadmap",
      trail.slug,
      trail.title,
      compactText([trail.description, trail.level, `Etapas: ${sectionTitles}`]),
      `/roadmaps/${trail.slug}`,
    );
  });

  const dbRows = await fetchPublishedRows<DbRoadmapRow>(
    "roadmaps",
    "id, title, description, level, area_slug",
  );
  const dbDocs = dbRows.map((r) =>
    doc(
      "roadmap",
      r.id,
      r.title,
      compactText([r.description, r.level, r.area_slug]),
      "/roadmaps",
    ),
  );

  return [...v2Docs, ...dbDocs];
}

function buildGlossary(): SearchDocumentRow[] {
  // Pagina unica: todos os termos apontam /dicionario.
  return dictionaryTerms.map((t) =>
    doc(
      "term",
      t.term.toLowerCase(),
      t.term,
      compactText([t.meaning, t.category, t.tags.join(", ")]),
      "/dicionario",
    ),
  );
}

interface NewsRow {
  id: string;
  title: string;
  summary: string | null;
  source: string | null;
}

async function buildNews(): Promise<SearchDocumentRow[]> {
  const rows = await fetchPublishedRows<NewsRow>(
    "news",
    "id, title, summary, source",
  );
  return rows.map((r) =>
    doc("news", r.id, r.title, compactText([r.summary, r.source]), "/noticias"),
  );
}

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  location_label: string | null;
  city: string | null;
  state: string | null;
  online: boolean | null;
}

async function buildEvents(): Promise<SearchDocumentRow[]> {
  const rows = await fetchPublishedRows<EventRow>(
    "events",
    "id, title, description, starts_at, ends_at, location_label, city, state, online",
  );
  const now = Date.now();
  return rows
    .filter((r) => {
      // Evento passado nao entra. Sem data nenhuma, mantem (nao da pra saber).
      const reference = r.ends_at ?? r.starts_at;
      return !reference || new Date(reference).getTime() >= now;
    })
    .map((r) =>
      doc(
        "event",
        r.id,
        r.title,
        compactText([
          r.description,
          r.online ? "online" : null,
          r.location_label,
          r.city && r.state ? `${r.city}/${r.state}` : (r.city ?? r.state),
          r.starts_at ? r.starts_at.slice(0, 10) : null,
        ]),
        "/eventos",
      ),
    );
}

interface JobRow {
  id: string;
  title: string;
  description: string | null;
  company: string | null;
  location: string | null;
  seniority: string | null;
  remote: boolean | null;
}

async function buildJobs(): Promise<SearchDocumentRow[]> {
  // external_jobs nao tem coluna de expiracao: is_published (semantica do sync)
  // governa o que e vaga ativa.
  const rows = await fetchPublishedRows<JobRow>(
    "external_jobs",
    "id, title, description, company, location, seniority, remote",
  );
  return rows.map((r) =>
    doc(
      "job",
      r.id,
      r.title,
      compactText([
        r.company,
        r.location,
        r.remote ? "remoto" : null,
        r.seniority,
        r.description,
      ]),
      "/vagas",
    ),
  );
}

interface AreaRow {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  full_description: string | null;
}

async function buildAreas(): Promise<SearchDocumentRow[]> {
  const rows = await fetchPublishedRows<AreaRow>(
    "areas",
    "id, slug, name, short_description, full_description",
  );
  return rows.map((r) =>
    doc(
      "area",
      r.id,
      r.name,
      compactText([r.short_description ?? r.full_description]),
      `/areas/${r.slug}`,
    ),
  );
}

interface TechnologyRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
}

async function buildTechnologies(): Promise<SearchDocumentRow[]> {
  const rows = await fetchPublishedRows<TechnologyRow>(
    "technologies",
    "id, slug, name, description, category",
  );
  return rows.map((r) =>
    doc(
      "technology",
      r.id,
      r.name,
      compactText([r.description, r.category]),
      `/tecnologias/${r.slug}`,
    ),
  );
}

interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  objective: string | null;
  level: string | null;
}

async function buildProjects(): Promise<SearchDocumentRow[]> {
  const rows = await fetchPublishedRows<ProjectRow>(
    "projects",
    "id, title, description, objective, level",
  );
  // Sem rota /projetos/:slug no App.tsx: aponta a pagina indice.
  return rows.map((r) =>
    doc(
      "project",
      r.id,
      r.title,
      compactText([r.description, r.objective, r.level]),
      "/projetos",
    ),
  );
}

interface PlatformRow {
  id: string;
  name: string;
  description: string | null;
  price_label: string | null;
}

async function buildPlatforms(): Promise<SearchDocumentRow[]> {
  const rows = await fetchPublishedRows<PlatformRow>(
    "platforms",
    "id, name, description, price_label",
  );
  return rows.map((r) =>
    doc(
      "platform",
      r.id,
      r.name,
      compactText([r.description, r.price_label]),
      "/plataformas",
    ),
  );
}

interface SourceBuilder {
  type: string;
  build: () => Promise<SearchDocumentRow[]>;
}

const SOURCES: SourceBuilder[] = [
  { type: "course", build: buildCourses },
  { type: "roadmap", build: buildRoadmaps },
  { type: "term", build: async () => buildGlossary() },
  { type: "news", build: buildNews },
  { type: "event", build: buildEvents },
  { type: "job", build: buildJobs },
  { type: "area", build: buildAreas },
  { type: "technology", build: buildTechnologies },
  { type: "project", build: buildProjects },
  { type: "platform", build: buildPlatforms },
];

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function upsertDocs(docs: SearchDocumentRow[]): Promise<void> {
  for (const batch of chunk(docs, UPSERT_BATCH_SIZE)) {
    const { error } = await supabaseAdmin
      .from("search_documents")
      .upsert(batch, { onConflict: "resource_type,resource_id" });
    if (error) throw new Error(`upsert: ${error.message}`);
  }
}

// Remove do indice os documentos do tipo que nao estao mais na fonte. So roda
// quando o upsert do tipo inteiro deu certo (o caller garante), entao um erro
// de leitura da fonte nunca apaga indice bom.
async function removeOrphans(
  type: string,
  expectedIds: Set<string>,
): Promise<number> {
  const existing: Array<{ resource_id: string }> = [];
  for (let from = 0; ; from += FETCH_PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from("search_documents")
      .select("resource_id")
      .eq("resource_type", type)
      .range(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw new Error(`orphans select: ${error.message}`);
    const batch = (data ?? []) as Array<{ resource_id: string }>;
    existing.push(...batch);
    if (batch.length < FETCH_PAGE_SIZE) break;
  }

  const orphanIds = existing
    .map((r) => r.resource_id)
    .filter((id) => !expectedIds.has(id));

  for (const batch of chunk(orphanIds, DELETE_BATCH_SIZE)) {
    const { error } = await supabaseAdmin
      .from("search_documents")
      .delete()
      .eq("resource_type", type)
      .in("resource_id", batch);
    if (error) throw new Error(`orphans delete: ${error.message}`);
  }

  return orphanIds.length;
}

// Reindexa todas as fontes (ou so os resource_types pedidos). Fail-soft por
// fonte: falha vira warn + entrada em falhas, nunca aborta as demais.
export async function reindexSearchDocuments(
  types?: string[],
): Promise<ReindexSummary> {
  const summary: ReindexSummary = { porTipo: {}, falhas: [] };
  const selected = types
    ? SOURCES.filter((s) => types.includes(s.type))
    : SOURCES;

  for (const source of selected) {
    try {
      const docs = await source.build();
      await upsertDocs(docs);
      const removidos = await removeOrphans(
        source.type,
        new Set(docs.map((d) => d.resource_id)),
      );
      summary.porTipo[source.type] = { upserts: docs.length, removidos };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[searchIndex] fonte ${source.type} falhou:`, message);
      summary.falhas.push(`${source.type}: ${message}`);
    }
  }

  return summary;
}
