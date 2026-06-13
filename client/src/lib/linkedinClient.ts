import { apiUrl } from "./api";
import { supabase } from "./supabase";
import type {
  LinkedinAnalysisRecord,
  LinkedinAnalysisResponse,
  LinkedinAnalysisSummary,
  LinkedinAnalyzeRequest,
} from "@shared/linkedin/schema";

/**
 * Cliente do analisador de LinkedIn, no mesmo estilo de githubClient.ts.
 * Erros viram códigos tratados pela UI.
 */

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function analyzeLinkedin(
  payload: LinkedinAnalyzeRequest,
): Promise<LinkedinAnalysisResponse> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl("/api/linkedin/analyze"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) throw new Error("LOGIN_REQUIRED");
  if (response.status === 403) throw new Error("PRO_REQUIRED");
  if (response.status === 429) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      `RATE_LIMITED: ${body.error?.message || "Limite atingido"}`,
    );
  }
  if (response.status === 422) throw new Error("UNREADABLE");
  if (response.status === 400) throw new Error("INVALID_REQUEST");
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error?.message || "ANALYSIS_FAILED");
  }

  const body = (await response.json()) as Partial<{
    data: LinkedinAnalysisResponse;
  }>;
  if (!body.data) throw new Error("ANALYSIS_FAILED");
  return body.data;
}

export async function listLinkedinAnalyses(): Promise<
  LinkedinAnalysisSummary[]
> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl("/api/linkedin/analyses"), {
    headers: { ...authHeader },
  });
  if (!response.ok) return [];
  const body = (await response.json()) as Partial<{
    data: LinkedinAnalysisSummary[];
  }>;
  return body.data ?? [];
}

export async function getLinkedinAnalysis(
  id: string,
): Promise<LinkedinAnalysisRecord | null> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl(`/api/linkedin/analyses/${id}`), {
    headers: { ...authHeader },
  });
  if (!response.ok) return null;
  const body = (await response.json()) as Partial<{
    data: LinkedinAnalysisRecord;
  }>;
  return body.data ?? null;
}
