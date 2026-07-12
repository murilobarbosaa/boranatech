import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

/**
 * Cliente Pro de vagas, no estilo do linkedinClient: Bearer da sessão
 * Supabase + apiUrl + erros-string tipados que a UI distingue. O gating real
 * é server-side; aqui os status viram códigos. Erro NUNCA vira lista vazia.
 *
 * Interfaces espelham o contrato de server/routes/vagas.ts (envelope
 * { data }): padrão do módulo de entrevistas, tipos duplicados por camada
 * (shared/ é intocável).
 */

export type VagaSeniority = "estagio" | "junior" | "pleno" | "senior";
export type VagaContract = "clt" | "pj";
export type VagaModality = "remote" | "hybrid" | "onsite";
export type VagaSource =
  | "jooble"
  | "adzuna"
  | "github"
  | "ats_boards"
  | "manual";
export type VagaRegion = "br" | "intl" | "all";

export interface VagaItem {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  remote: boolean;
  seniority: string | null;
  url: string;
  areaSlug: string | null;
  country: string | null;
  source: VagaSource;
  modality: string | null;
  contract: string | null;
  featured: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryIsPredicted: boolean | null;
  publishedAt: string | null;
}

export interface VagaDetail extends VagaItem {
  description: string | null;
  labels: string[] | null;
}

export interface VagasListResponse {
  items: VagaItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface VagasListParams {
  q?: string;
  region?: VagaRegion;
  country?: string;
  seniority?: VagaSeniority;
  contract?: VagaContract;
  modality?: VagaModality;
  source?: VagaSource;
  page?: number;
  limit?: number;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function vagasFetch(path: string): Promise<unknown> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl(path), { headers: authHeader });

  if (response.status === 401) throw new Error("LOGIN_REQUIRED");
  if (response.status === 403) throw new Error("PRO_REQUIRED");
  if (response.status === 404) throw new Error("NOT_FOUND");
  if (response.status === 429) throw new Error("RATE_LIMITED");
  if (!response.ok) throw new Error("SERVER_ERROR");

  const body = (await response.json()) as { data?: unknown };
  if (body.data === undefined) throw new Error("SERVER_ERROR");
  return body.data;
}

export async function fetchVagas(
  params: VagasListParams = {},
): Promise<VagasListResponse> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.region) qs.set("region", params.region);
  if (params.country) qs.set("country", params.country);
  if (params.seniority) qs.set("seniority", params.seniority);
  if (params.contract) qs.set("contract", params.contract);
  if (params.modality) qs.set("modality", params.modality);
  if (params.source) qs.set("source", params.source);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));

  const data = await vagasFetch(
    `/api/vagas${qs.toString() ? `?${qs}` : ""}`,
  );
  return data as VagasListResponse;
}

export async function fetchDestaques(): Promise<VagaItem[]> {
  const data = (await vagasFetch("/api/vagas/destaques")) as {
    items?: VagaItem[];
  };
  return Array.isArray(data.items) ? data.items : [];
}

export async function fetchVaga(id: string): Promise<VagaDetail> {
  const data = await vagasFetch(`/api/vagas/${id}`);
  return data as VagaDetail;
}
