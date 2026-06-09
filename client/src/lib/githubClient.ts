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
