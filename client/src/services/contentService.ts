import type { ContentSourceStatus } from "./contracts";
import { Layout as LayoutIcon } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { areasTI, cursosGratuitos, noticias, plataformas, projetos, roadmaps, type AreaTI } from "@/lib/data";
import { technologies, technologyRanking } from "@/lib/technologyData";

const API_BASE = apiUrl("/api/content");

async function apiFetch(path: string) {
  const res = await fetch(`${API_BASE}${path}`);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || "Erro ao buscar conteúdo");
  }

  return res.json();
}

function areaFromApi(row: any): AreaTI {
  const local = areasTI.find((a) => a.slug === row.slug);
  return {
    id: row.slug,
    nome: row.name,
    slug: row.slug,
    icon: local?.icon ?? LayoutIcon,
    tagClass: row.tag_class || "tag-frontend",
    descricaoCurta: row.short_description || "",
    descricaoCompleta: row.full_description || row.short_description || "",
    oQueFaz: row.full_description || row.short_description || "",
    tarefasDiarias: row.daily_tasks || [],
    perfilIndicado: row.profile_indicated || "",
    habilidades: row.skills || [],
    ferramentas: row.tools || [],
    dificuldade: row.average_salary?.difficulty || 3,
    cargos: row.roles || [],
    faixaSalarial: row.average_salary?.label || "",
    cursosGratuitos: row.free_courses || [],
    roadmapInicial: row.initial_roadmap || [],
    projetos: row.projects || [],
    termosEssenciais: row.essential_terms || [],
    dicasIniciais: row.initial_tips || "",
  };
}

function courseFromApi(row: any) {
  return {
    id: row.slug || row.id,
    titulo: row.title,
    canal: row.provider || "",
    plataforma: row.provider || "",
    link: row.url || "#",
    areaSlug: row.area_slug || null,
    nivel: row.level || "Iniciante",
    duracao: row.workload_hours ? `${row.workload_hours} horas` : "",
    idioma: row.language || "pt-BR",
    descricao: row.description || "",
    motivoIndicacao: row.description || "",
    oQueAprende: row.tags || [],
    proximoConteudo: "",
    tipo: row.is_free ? "Gratuito" : "Pago",
    preco: row.price_label,
  };
}

function platformFromApi(row: any) {
  return {
    id: row.slug || row.id,
    nome: row.name,
    logoUrl: row.url ? `https://www.google.com/s2/favicons?domain=${new URL(row.url).hostname}&sz=128` : "",
    descricao: row.description || "",
    tipo: row.price_label?.toLowerCase().includes("grat") ? "Gratuita" : row.price_label?.toLowerCase().includes("pago") ? "Paga" : "Híbrida",
    idioma: "Português",
    areasFortes: row.best_for || ["Todas as áreas de TI"],
    pontosFortes: row.strengths || [],
    limitacoes: row.limitations || [],
    melhorPerfil: (row.best_for || []).join(", "),
    nivelIdeal: "Todos os níveis",
    certificado: false,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: row.price_label || "",
    link: row.url || "#",
  };
}

function projectFromApi(row: any) {
  return {
    id: row.slug || row.id,
    nome: row.title,
    areaSlug: row.area_slug || null,
    nivel: row.level || "Iniciante",
    objetivo: row.objective || row.description || "",
    ferramentas: row.tools || [],
    passosSimplificados: row.simplified_steps || [],
    entregavel: row.portfolio_tips || "",
    comoPublicar: "GitHub, Notion ou LinkedIn",
    sugestaoLinkedIn: row.linkedin_suggestion || "",
    proximoProjeto: "",
  };
}

function roadmapFromApi(row: any) {
  return {
    id: row.slug,
    nome: row.title,
    areaSlug: row.area_slug || null,
    nivel: row.level || "Iniciante",
    duracaoDias: row.estimated_duration_weeks ? `${row.estimated_duration_weeks} semanas` : "30 dias",
    descricao: row.description || "",
    paraQuem: row.description || "",
    preRequisitos: "",
    etapas: (row.roadmap_steps || []).map((step: any, index: number) => ({
      numero: step.order_index || index + 1,
      titulo: step.title,
      descricao: step.description || "",
      tempo: step.estimated_hours ? `${step.estimated_hours} horas` : "",
    })),
    errosComuns: [],
    oQueEvitar: "",
    proximoPasso: "",
  };
}

function technologyFromApi(row: any) {
  return {
    slug: row.slug,
    name: row.name,
    icon: row.icon || "Code",
    logoUrl: row.icon || "",
    category: row.category || "Ferramentas",
    description: row.description || "",
    difficulty: row.difficulty || "Iniciante",
    difficultyScore: row.beginner_friendly_score || 3,
    demand: row.market_demand || "Média",
    salaryRange: row.salary_context?.label || "",
    areas: row.related_area_slugs || [],
    useCases: row.use_cases || [],
    learningPath: row.learning_path || [],
    dailyTip: row.long_description || row.description || "",
    combinesWith: [],
    tools: row.tools || [],
    courses: (row.resources || []).map((resource: any) => resource.title || resource.name || String(resource)),
    companies: row.companies_using || [],
    jobs: 0,
    weeklyChange: 0,
  };
}

function newsFromApi(row: any) {
  const tags = Array.isArray(row.tags) ? row.tags.filter((tag: unknown) => typeof tag === "string") : [];
  const publishedAt = row.published_at ? new Date(row.published_at) : null;
  const categoria = tags[0] || "Tecnologia";

  return {
    id: row.slug || row.id,
    titulo: row.title,
    resumo: row.summary || "",
    fonte: row.source || "Fonte externa",
    data: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt.toLocaleDateString("pt-BR") : "",
    link: row.url,
    area: categoria,
    impacto: "Médio para iniciantes",
    porQueImporta: "Acompanhar notícias ajuda você a entender tendências, ferramentas e oportunidades do mercado tech.",
    categoria,
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
      lastSyncLabel: source.last_sync_at ? new Date(source.last_sync_at).toLocaleString("pt-BR") : "Ainda não sincronizado",
    }));
  } catch {
    return [
      { source: "cms", status: "ready", lastSyncLabel: "API local indisponível" },
      { source: "rss", status: "inactive", lastSyncLabel: "Usando curadoria local" },
      { source: "jobs-api", status: "inactive", lastSyncLabel: "Aguardando sincronização externa" },
      { source: "events-api", status: "inactive", lastSyncLabel: "Aguardando sincronização externa" },
    ];
  }
}

export async function getAreas(params?: { tag?: string; search?: string }) {
  try {
    const qs = new URLSearchParams();
    if (params?.tag) qs.set("tag", params.tag);
    if (params?.search) qs.set("search", params.search);
    const json = await apiFetch(`/areas${qs.toString() ? `?${qs}` : ""}`);
    return json.data.map(areaFromApi);
  } catch {
    return areasTI;
  }
}

export async function getArea(slug: string) {
  try {
    const json = await apiFetch(`/areas/${slug}`);
    return areaFromApi(json.data);
  } catch {
    return areasTI.find((area) => area.slug === slug) || null;
  }
}

export async function getTechnologies(params?: { category?: string; search?: string }) {
  try {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.search) qs.set("search", params.search);
    const json = await apiFetch(`/technologies${qs.toString() ? `?${qs}` : ""}`);
    return json.data.map(technologyFromApi);
  } catch {
    return technologies;
  }
}

export async function getTechnology(slug: string) {
  try {
    const json = await apiFetch(`/technologies/${slug}`);
    return technologyFromApi(json.data);
  } catch {
    return technologies.find((technology) => technology.slug === slug) || null;
  }
}

export async function getTechnologyRanking() {
  try {
    const json = await apiFetch("/technologies/ranking");
    return json.data.map(technologyFromApi).map((technology: any, index: number) => ({ ...technology, position: index + 1 }));
  } catch {
    return technologyRanking;
  }
}

export async function compareTechnologies(left: string, right: string) {
  try {
    const json = await apiFetch(`/technologies/compare?left=${left}&right=${right}`);
    return json.data.map(technologyFromApi);
  } catch {
    return technologies.filter((technology) => [left, right].includes(technology.slug));
  }
}

export async function getCourses(params?: { area?: string; is_free?: boolean; level?: string }) {
  try {
    const qs = new URLSearchParams();
    if (params?.area) qs.set("area", params.area);
    if (params?.is_free !== undefined) qs.set("is_free", String(params.is_free));
    if (params?.level) qs.set("level", params.level);
    const json = await apiFetch(`/courses${qs.toString() ? `?${qs}` : ""}`);
    return json.data.map(courseFromApi);
  } catch {
    return cursosGratuitos;
  }
}

export async function getPlatforms() {
  try {
    const json = await apiFetch("/platforms");
    return json.data.map(platformFromApi);
  } catch {
    return plataformas;
  }
}

export async function getProjects(params?: { area?: string; level?: string }) {
  try {
    const qs = new URLSearchParams();
    if (params?.area) qs.set("area", params.area);
    if (params?.level) qs.set("level", params.level);
    const json = await apiFetch(`/projects${qs.toString() ? `?${qs}` : ""}`);
    return json.data.map(projectFromApi);
  } catch {
    return projetos;
  }
}

export async function getRoadmaps(params?: { area?: string }) {
  try {
    const qs = new URLSearchParams();
    if (params?.area) qs.set("area", params.area);
    const json = await apiFetch(`/roadmaps${qs.toString() ? `?${qs}` : ""}`);
    return json.data.map(roadmapFromApi);
  } catch {
    return roadmaps;
  }
}

export async function getRoadmap(slug: string) {
  try {
    const json = await apiFetch(`/roadmaps/${slug}`);
    return roadmapFromApi(json.data);
  } catch {
    return roadmaps.find((roadmap) => roadmap.id === slug) || null;
  }
}

export async function getNews(params?: { limit?: number; offset?: number; tag?: string }) {
  try {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    if (params?.tag) qs.set("tag", params.tag);
    const json = await apiFetch(`/news${qs.toString() ? `?${qs}` : ""}`);
    const data = json.data.map(newsFromApi);
    return data.length > 0 ? data : noticias;
  } catch {
    return noticias;
  }
}

export async function getJobs(params?: { area?: string; seniority?: string; limit?: number; offset?: number }) {
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
