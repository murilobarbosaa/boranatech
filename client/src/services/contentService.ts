import { Layout as LayoutIcon } from "lucide-react";
import { apiFetch } from "./contentApi";
import {
  areasTI,
  cursosGratuitos,
  plataformas,
  projetos,
  roadmaps,
  type AreaTI,
} from "@/lib/data";
import {
  technologies,
  technologyRanking,
  combinesWithMap,
} from "@/lib/technologyData";
import { usageEvidence } from "@/lib/surveyData2025";

// Funcoes puras de API (news, jobs, status) vivem em contentApi.ts para a
// home nao arrastar os data files estaticos. Reexportadas aqui para manter
// a API publica dos consumidores lazy.
export {
  getContentSourceStatus,
  getJobs,
  getNews,
  inferKeyword,
} from "./contentApi";
export type {
  GetNewsParams,
  NewsItem,
  NewsKeyword,
  NewsLevel,
  NewsPagination,
  NewsResponse,
} from "./contentApi";

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
    certificate: "nao_informado",
  };
}

function platformFromApi(row: any) {
  return {
    id: row.slug || row.id,
    nome: row.name,
    logoUrl: row.url
      ? `https://www.google.com/s2/favicons?domain=${new URL(row.url).hostname}&sz=128`
      : "",
    descricao: row.description || "",
    tipo: row.price_label?.toLowerCase().includes("grat")
      ? "Gratuita"
      : row.price_label?.toLowerCase().includes("pago")
        ? "Paga"
        : "Híbrida",
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
    duracaoDias: row.estimated_duration_weeks
      ? `${row.estimated_duration_weeks} semanas`
      : "30 dias",
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
  // Enriquece a linha do Supabase (metadados) com os percentuais e fonte do
  // Survey, casados por slug. O Supabase é dono dos metadados; o arquivo de
  // survey é dono dos %/fonte. Se a tech não está no arquivo, segue sem
  // percentual (UI renderiza "Sem percentual comparável").
  const usage = usageEvidence[row.slug] || {};
  return {
    slug: row.slug,
    name: row.name,
    icon: row.icon || "Code",
    logoUrl: row.icon || "",
    category: row.category || "Ferramentas",
    description: row.description || "",
    difficulty: row.difficulty || "Iniciante",
    difficultyScore: row.beginner_friendly_score || 3,
    salaryRange: row.salary_context?.label || "",
    usagePercent: usage.usagePercent,
    usageLabel: usage.usageLabel,
    sourceName: usage.sourceName,
    sourceUrl: usage.sourceUrl,
    sourceNote: usage.sourceNote,
    areas: row.related_area_slugs || [],
    useCases: row.use_cases || [],
    learningPath: row.learning_path || [],
    dailyTip: row.long_description || row.description || "",
    combinesWith: combinesWithMap[row.slug] || [],
    tools: row.tools || [],
    courses: (row.resources || []).map(
      (resource: any) => resource.title || resource.name || String(resource),
    ),
    companies: row.companies_using || [],
  };
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

export async function getTechnologies(params?: {
  category?: string;
  search?: string;
}) {
  try {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.search) qs.set("search", params.search);
    const json = await apiFetch(
      `/technologies${qs.toString() ? `?${qs}` : ""}`,
    );
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
    return json.data
      .map(technologyFromApi)
      .sort((a: any, b: any) => (b.usagePercent || 0) - (a.usagePercent || 0))
      .map((technology: any, index: number) => ({
        ...technology,
        position: index + 1,
      }));
  } catch {
    return technologyRanking;
  }
}

export async function compareTechnologies(left: string, right: string) {
  try {
    const json = await apiFetch(
      `/technologies/compare?left=${left}&right=${right}`,
    );
    return json.data.map(technologyFromApi);
  } catch {
    return technologies.filter((technology) =>
      [left, right].includes(technology.slug),
    );
  }
}

export async function getCourses(params?: {
  area?: string;
  is_free?: boolean;
  level?: string;
}) {
  try {
    const qs = new URLSearchParams();
    if (params?.area) qs.set("area", params.area);
    if (params?.is_free !== undefined)
      qs.set("is_free", String(params.is_free));
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
