import { supabaseAdmin } from "./supabaseAdmin";
import type {
  PlanoItemTipo,
  StudyPlanResponse,
} from "../../shared/estudos/schema";

/**
 * Catálogo curado e validação de referências do plano de estudos.
 *
 * Anti-alucinação em duas pontas:
 * 1. buildStudyCatalogMessage: quando a área já é conhecida na conversa, injeta
 *    no prompt um catálogo compacto (UUID + título + tag) de courses,
 *    technologies, platforms e projects daquela área, para a IA referenciar
 *    SÓ ids reais.
 * 2. validateStudyPlanRefs: antes de devolver, valida cada item do plano contra
 *    o banco (existe? bate com o tipo? pertence à área?), sobrescreve o título
 *    pelo canônico e descarta silenciosamente o que for inválido.
 *
 * Roadmaps ficam de fora do MVP: a tabela `roadmaps` e o estático v2 não batem
 * 1:1 (ex.: slug 'zero-ti' existe no banco e não no estático), então não há
 * referência estável e confiável por id para usar agora.
 */

const MAX_ITEMS_PER_TYPE = 15;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function firstTag(value: unknown): string {
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0];
  }
  return "";
}

/**
 * Detecta a área da conversa casando slug e nome (e tokens longos do nome) das
 * áreas publicadas contra o texto, sempre por palavra inteira para evitar falso
 * positivo (ex.: slug "ia" dentro de "Maria"). Vence o casamento mais longo.
 */
export async function detectArea(
  text: string,
): Promise<{ slug: string; name: string } | null> {
  const { data, error } = await supabaseAdmin
    .from("areas")
    .select("slug, name")
    .eq("is_published", true);

  if (error || !data) return null;

  const lower = text.toLowerCase();
  let best: { slug: string; name: string; score: number } | null = null;

  for (const area of data) {
    const slug = (area.slug || "").toLowerCase();
    const name = (area.name || "").toLowerCase();
    const terms = new Set<string>();
    if (slug) terms.add(slug);
    if (name) {
      terms.add(name);
      for (const token of name.split(/[^a-z0-9]+/)) {
        if (token.length >= 4) terms.add(token);
      }
    }

    let score = 0;
    for (const term of Array.from(terms)) {
      const re = new RegExp(`\\b${escapeRegex(term)}\\b`);
      if (re.test(lower)) score = Math.max(score, term.length);
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { slug: area.slug, name: area.name, score };
    }
  }

  return best ? { slug: best.slug, name: best.name } : null;
}

/**
 * Monta a mensagem de catálogo para injeção no prompt. Retorna null quando a
 * área ainda não é conhecida ou quando não há conteúdo curado para ela.
 */
export async function buildStudyCatalogMessage(
  text: string,
): Promise<string | null> {
  const area = await detectArea(text);
  if (!area) return null;

  const [courses, technologies, platforms, projects] = await Promise.all([
    supabaseAdmin
      .from("courses")
      .select("id, title, tags")
      .eq("is_published", true)
      .eq("area_slug", area.slug)
      .limit(MAX_ITEMS_PER_TYPE),
    supabaseAdmin
      .from("technologies")
      .select("id, name, category")
      .eq("is_published", true)
      .contains("related_area_slugs", [area.slug])
      .limit(MAX_ITEMS_PER_TYPE),
    supabaseAdmin
      .from("platforms")
      .select("id, name, tags")
      .eq("is_published", true)
      .limit(MAX_ITEMS_PER_TYPE),
    supabaseAdmin
      .from("projects")
      .select("id, title, tags")
      .eq("is_published", true)
      .eq("area_slug", area.slug)
      .limit(MAX_ITEMS_PER_TYPE),
  ]);

  const blocks: string[] = [];
  const line = (id: string, title: string, tag: string) =>
    `- ${id} | ${title}${tag ? ` | ${tag}` : ""}`;

  if (courses.data?.length) {
    blocks.push("CURSOS (tipo: curso):");
    for (const c of courses.data) blocks.push(line(c.id, c.title, firstTag(c.tags)));
  }
  if (technologies.data?.length) {
    blocks.push("TECNOLOGIAS (tipo: tecnologia):");
    for (const t of technologies.data)
      blocks.push(line(t.id, t.name, t.category || ""));
  }
  if (platforms.data?.length) {
    blocks.push("PLATAFORMAS (tipo: plataforma):");
    for (const p of platforms.data) blocks.push(line(p.id, p.name, firstTag(p.tags)));
  }
  if (projects.data?.length) {
    blocks.push("PROJETOS (tipo: projeto):");
    for (const p of projects.data) blocks.push(line(p.id, p.title, firstTag(p.tags)));
  }

  if (blocks.length === 0) return null;

  return [
    `CATÁLOGO CURADO da área "${area.name}" (slug: ${area.slug}). Formato de cada linha: id | título | tag.`,
    "Ao preencher itens do plano, use SOMENTE estes ids reais e o tipo indicado. NUNCA invente curso, tecnologia, plataforma, projeto, link, id ou título fora desta lista.",
    ...blocks,
  ].join("\n");
}

type CanonicalMaps = Record<PlanoItemTipo, Map<string, string>>;

/**
 * Valida cada item referenciado no plano contra o banco. Para id válido (existe,
 * bate com o tipo e pertence à área quando aplicável), sobrescreve o título pelo
 * canônico. Descarta silenciosamente o resto e loga a quantidade.
 */
export async function validateStudyPlanRefs(
  response: StudyPlanResponse,
): Promise<StudyPlanResponse> {
  const plano = response.plano;
  if (!plano?.semanas?.length) return response;

  const idsByTipo: Record<PlanoItemTipo, Set<string>> = {
    curso: new Set(),
    tecnologia: new Set(),
    plataforma: new Set(),
    projeto: new Set(),
  };

  for (const semana of plano.semanas) {
    for (const item of semana.itens || []) {
      const bucket = idsByTipo[item.tipo];
      if (bucket && UUID_RE.test(item.id)) bucket.add(item.id);
    }
  }

  const areaSlug = plano.area?.slug ?? null;
  const canonical: CanonicalMaps = {
    curso: new Map(),
    tecnologia: new Map(),
    plataforma: new Map(),
    projeto: new Map(),
  };

  async function loadAreaScoped(
    tipo: "curso" | "projeto",
    table: "courses" | "projects",
  ) {
    const ids = Array.from(idsByTipo[tipo]);
    if (ids.length === 0) return;
    const { data } = await supabaseAdmin
      .from(table)
      .select("id, title, area_slug")
      .eq("is_published", true)
      .in("id", ids);
    for (const row of data ?? []) {
      if (areaSlug && row.area_slug && row.area_slug !== areaSlug) continue;
      canonical[tipo].set(row.id, row.title);
    }
  }

  async function loadTechnologies() {
    const ids = Array.from(idsByTipo.tecnologia);
    if (ids.length === 0) return;
    const { data } = await supabaseAdmin
      .from("technologies")
      .select("id, name, related_area_slugs")
      .eq("is_published", true)
      .in("id", ids);
    for (const row of data ?? []) {
      if (areaSlug) {
        const related = Array.isArray(row.related_area_slugs)
          ? (row.related_area_slugs as unknown[])
          : [];
        if (!related.includes(areaSlug)) continue;
      }
      canonical.tecnologia.set(row.id, row.name);
    }
  }

  async function loadPlatforms() {
    const ids = Array.from(idsByTipo.plataforma);
    if (ids.length === 0) return;
    const { data } = await supabaseAdmin
      .from("platforms")
      .select("id, name")
      .eq("is_published", true)
      .in("id", ids);
    for (const row of data ?? []) canonical.plataforma.set(row.id, row.name);
  }

  await Promise.all([
    loadAreaScoped("curso", "courses"),
    loadAreaScoped("projeto", "projects"),
    loadTechnologies(),
    loadPlatforms(),
  ]);

  let dropped = 0;
  for (const semana of plano.semanas) {
    const kept: typeof semana.itens = [];
    for (const item of semana.itens || []) {
      const title = canonical[item.tipo]?.get(item.id);
      if (title === undefined) {
        dropped++;
        continue;
      }
      kept.push({ ...item, titulo: title });
    }
    semana.itens = kept;
  }

  if (dropped > 0) {
    console.warn(
      `[study-plan] descartados ${dropped} item(ns) com id inválido, tipo errado ou área divergente.`,
    );
  }

  return response;
}
