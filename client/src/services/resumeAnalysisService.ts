import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type {
  ResumeAnalysisModel,
  ResumeAnalyzeRequest,
  ResumeFaixa,
  ResumeScoreCriterion,
} from "@shared/resumeAnalysis/schema";

// Cliente do Analisador de Curriculo (/api/resume): analise, historico e
// detalhe. O PDF nunca passa por aqui: a extracao de texto e client-side
// (lib/pdfExtract.ts) e so o TEXTO vai ao servidor.

export interface ResumeAnalyzeResponse {
  // null quando a persistencia fail-soft falhou (a analise veio mesmo assim).
  id: string | null;
  score: number;
  faixa: ResumeFaixa;
  criterios: ResumeScoreCriterion[];
  qualitative: ResumeAnalysisModel;
  targetRole: string | null;
}

export interface ResumeAnalysisSummary {
  id: string;
  score: number;
  faixa: ResumeFaixa;
  target_role: string | null;
  created_at: string;
}

export interface ResumeAnalysisRecord extends ResumeAnalysisSummary {
  input: {
    resumeText: string;
    targetRole: string | null;
    jobPostingText: string | null;
  };
  result: {
    score: number;
    faixa: ResumeFaixa;
    criterios: ResumeScoreCriterion[];
    qualitative: ResumeAnalysisModel;
  };
}

// Espelha os demais services: o JWT vem da sessao do Supabase.
async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

function readErrorMessage(body: unknown): string {
  if (body && typeof body === "object") {
    const rec = body as { error?: { message?: unknown } };
    if (typeof rec.error?.message === "string") return rec.error.message;
  }
  // TODO(Ana): mensagem generica de erro do servico de analise.
  return "Nao foi possivel completar agora. Tente novamente.";
}

async function parseError(response: globalThis.Response): Promise<Error> {
  const body = (await response.json().catch(() => null)) as unknown;
  return new Error(readErrorMessage(body));
}

export async function analyzeResume(
  request: ResumeAnalyzeRequest,
): Promise<ResumeAnalyzeResponse> {
  const header = await authHeader();
  const response = await fetch(apiUrl("/api/resume/analyze"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...header },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as ResumeAnalyzeResponse;
}

export async function listResumeAnalyses(): Promise<ResumeAnalysisSummary[]> {
  const header = await authHeader();
  const response = await fetch(apiUrl("/api/resume/analyses"), {
    headers: header,
  });
  if (!response.ok) throw await parseError(response);
  const payload = (await response.json()) as { analyses?: ResumeAnalysisSummary[] };
  return payload.analyses ?? [];
}

// 404 (inexistente ou de outro usuario) vira null, nao excecao.
export async function getResumeAnalysis(
  id: string,
): Promise<ResumeAnalysisRecord | null> {
  const header = await authHeader();
  const response = await fetch(
    apiUrl(`/api/resume/analyses/${encodeURIComponent(id)}`),
    { headers: header },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as ResumeAnalysisRecord;
}
