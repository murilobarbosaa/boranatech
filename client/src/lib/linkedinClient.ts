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

/**
 * Resultado do analyze: a resposta completa mais o id da analise persistida
 * (null quando a persistencia best-effort falhou no server; o checklist de
 * melhorias aplicadas fica indisponivel nesse caso), como no githubClient.
 */
export interface AnalyzeLinkedinResult {
  data: LinkedinAnalysisResponse;
  analysisId: string | null;
}

export async function analyzeLinkedin(
  payload: LinkedinAnalyzeRequest,
): Promise<AnalyzeLinkedinResult> {
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
  if (response.status === 503) throw new Error("LINKEDIN_BUSY");
  if (response.status === 422) throw new Error("UNREADABLE");
  if (response.status === 400) throw new Error("INVALID_REQUEST");
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error?.message || "ANALYSIS_FAILED");
  }

  const body = (await response.json()) as Partial<{
    data: LinkedinAnalysisResponse;
    analysisId: string | null;
  }>;
  if (!body.data) throw new Error("ANALYSIS_FAILED");
  return {
    data: body.data,
    analysisId: typeof body.analysisId === "string" ? body.analysisId : null,
  };
}

// Progresso das melhorias aplicadas (checklist vivo do resultado), espelho do
// githubClient. Sem custo de IA: e so estado do proprio dado.

function readErrorMessage(body: unknown): string {
  if (body && typeof body === "object") {
    const rec = body as { error?: { message?: unknown } };
    if (typeof rec.error?.message === "string") return rec.error.message;
  }
  // TODO(Ana): mensagem generica de erro do progresso.
  return "Não foi possível completar agora. Tente novamente.";
}

export async function getLinkedinImprovements(
  analysisId: string,
): Promise<number[]> {
  const authHeader = await getAuthHeader();
  const response = await fetch(
    apiUrl(
      `/api/linkedin/analyses/${encodeURIComponent(analysisId)}/improvements`,
    ),
    { headers: authHeader },
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    throw new Error(readErrorMessage(body));
  }
  const payload = (await response.json()) as { applied?: number[] };
  return Array.isArray(payload.applied) ? payload.applied : [];
}

export async function setLinkedinImprovement(
  analysisId: string,
  index: number,
  done: boolean,
): Promise<void> {
  const authHeader = await getAuthHeader();
  const response = await fetch(
    apiUrl(
      `/api/linkedin/analyses/${encodeURIComponent(analysisId)}/improvements/${index}`,
    ),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ done }),
    },
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    throw new Error(readErrorMessage(body));
  }
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
