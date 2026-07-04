import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { Curriculo } from "@shared/curriculo/schema";

// Cliente da persistencia de curriculos criados (/api/resumes). Persistencia
// pura: nenhuma chamada aqui consome quota de IA.

export interface ResumeSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ResumeRecord extends ResumeSummary {
  curriculo: Curriculo;
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
  // TODO(Ana): mensagem generica de erro do servico de curriculos.
  return "Nao foi possivel completar agora. Tente novamente.";
}

async function parseError(response: globalThis.Response): Promise<Error> {
  const body = (await response.json().catch(() => null)) as unknown;
  return new Error(readErrorMessage(body));
}

export async function saveResume(
  curriculo: Curriculo,
): Promise<{ id: string; title: string; created_at: string }> {
  const header = await authHeader();
  const response = await fetch(apiUrl("/api/resumes"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...header },
    body: JSON.stringify(curriculo),
  });
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as { id: string; title: string; created_at: string };
}

export async function listResumes(): Promise<ResumeSummary[]> {
  const header = await authHeader();
  const response = await fetch(apiUrl("/api/resumes"), { headers: header });
  if (!response.ok) throw await parseError(response);
  const payload = (await response.json()) as { resumes?: ResumeSummary[] };
  return payload.resumes ?? [];
}

// 404 (inexistente ou de outro usuario) vira null, nao excecao.
export async function getResume(id: string): Promise<ResumeRecord | null> {
  const header = await authHeader();
  const response = await fetch(apiUrl(`/api/resumes/${encodeURIComponent(id)}`), {
    headers: header,
  });
  if (response.status === 404) return null;
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as ResumeRecord;
}

export async function deleteResume(id: string): Promise<void> {
  const header = await authHeader();
  const response = await fetch(apiUrl(`/api/resumes/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers: header,
  });
  if (!response.ok) throw await parseError(response);
}
