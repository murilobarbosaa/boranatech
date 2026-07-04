import { apiUrl } from "./api";
import { supabase } from "./supabase";
import type { AreaSelection } from "@shared/areas";
import type { AnalysisMode, GithubAnalysisResponse } from "@shared/github/schema";

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

/**
 * Chama o analisador de GitHub (POST /api/github/analyze) e devolve o
 * GithubAnalysisResponse. Erros viram codigos tratados pela UI, no mesmo
 * estilo do callAiStructured do aiClient.
 */
export async function analyzeGithub(
  mode: AnalysisMode,
  input: string,
  area: AreaSelection,
): Promise<GithubAnalysisResponse> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl("/api/github/analyze"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify({ mode, input, area }),
  });

  if (response.status === 401) throw new Error("LOGIN_REQUIRED");
  if (response.status === 403) throw new Error("PRO_REQUIRED");
  if (response.status === 429) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`RATE_LIMITED: ${body.error?.message || "Limite atingido"}`);
  }
  if (response.status === 404) throw new Error("NOT_FOUND");
  if (response.status === 503) throw new Error("GITHUB_BUSY");
  if (response.status === 502) throw new Error("ANALYSIS_FAILED");
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error?.message || "Nao foi possivel concluir a analise agora.");
  }

  const body = (await response.json()) as Partial<{ data: GithubAnalysisResponse }>;
  if (!body.data) throw new Error("ANALYSIS_FAILED");
  return body.data;
}

// Historico de analises (GET /api/github/analyses), no padrao dos outros
// services. Sem gate Pro no server: dado do dono.

export interface GithubAnalysisSummary {
  id: string;
  score: number | null;
  faixa: string | null;
  area: string | null;
  created_at: string | null;
  mode: string | null;
  raw_input: string | null;
}

export interface GithubAnalysisRecord {
  id: string;
  score: number | null;
  faixa: string | null;
  area: string | null;
  input: { mode?: string; input?: string; area?: string } | null;
  // Result salvo. Analises antigas podem ter shape anterior (ex: qualitative
  // sem proximoPasso); a UI trata os campos novos como opcionais.
  result: GithubAnalysisResponse;
  created_at: string | null;
}

function readErrorMessage(body: unknown): string {
  if (body && typeof body === "object") {
    const rec = body as { error?: { message?: unknown } };
    if (typeof rec.error?.message === "string") return rec.error.message;
  }
  // TODO(Ana): mensagem generica de erro do historico.
  return "Nao foi possivel completar agora. Tente novamente.";
}

export async function listGithubAnalyses(): Promise<GithubAnalysisSummary[]> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl("/api/github/analyses"), {
    headers: authHeader,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    throw new Error(readErrorMessage(body));
  }
  const payload = (await response.json()) as { analyses?: GithubAnalysisSummary[] };
  return payload.analyses ?? [];
}

// 404 (inexistente ou de outro usuario) vira null, nao excecao.
export async function getGithubAnalysis(
  id: string,
): Promise<GithubAnalysisRecord | null> {
  const authHeader = await getAuthHeader();
  const response = await fetch(
    apiUrl(`/api/github/analyses/${encodeURIComponent(id)}`),
    { headers: authHeader },
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    throw new Error(readErrorMessage(body));
  }
  return (await response.json()) as GithubAnalysisRecord;
}

// Normalizacao de alvo para comparar analises do MESMO perfil/repo (delta de
// nota): minusculas, sem protocolo/www, sem @ inicial e sem barras nas pontas.
// Aproximacao suficiente: falso negativo so deixa de mostrar o delta.
export function normalizeGithubTarget(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "");
}
