import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { SubmissionInput } from "@shared/projects/submission";

// Entrega de projeto (lote 04): os links enviados e o resultado das checagens
// automaticas. Camada separada da autodeclarada (project_progress) e da
// validada por IA (project_validations); a UI combina as tres.

export type StatusCheck = "ok" | "falhou" | "erro";

export interface ResultadoCheck {
  check: string;
  status: StatusCheck;
  mensagem: string;
}

export interface ProjectSubmission {
  projectId: string;
  tipoEntrega: string;
  deployUrl: string | null;
  repoUrl: string | null;
  artifactUrl: string | null;
  retro: { maisDificil?: string };
  isPublic: boolean;
  publicCode: string;
  status: "entregue" | "verificado";
  autoCheck: ResultadoCheck[] | null;
  autoCheckAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SubmissionErrorCode =
  | "feature_unavailable"
  | "rate_limited"
  | "invalid_request"
  | "not_found"
  | "generic";

export class ProjectSubmissionError extends Error {
  code: SubmissionErrorCode;
  retryAfter?: number;
  constructor(code: SubmissionErrorCode, message: string, retryAfter?: number) {
    super(message);
    this.name = "ProjectSubmissionError";
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function request(path: string, options?: RequestInit) {
  const header = await authHeader();
  return fetch(apiUrl(`/api/project-submissions${path}`), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...header,
      ...(options?.headers || {}),
    },
  });
}

async function erroDaResposta(res: Response): Promise<ProjectSubmissionError> {
  let mensagem = `HTTP ${res.status}`;
  let retryAfter: number | undefined;
  try {
    const json = (await res.json()) as {
      error?: {
        code?: string;
        message?: string;
        context?: { retryAfter?: number };
      };
    };
    if (json.error?.message) mensagem = json.error.message;
    retryAfter = json.error?.context?.retryAfter;
  } catch {
    // Resposta sem JSON: fica a mensagem generica.
  }
  const code: SubmissionErrorCode =
    res.status === 503
      ? "feature_unavailable"
      : res.status === 429
        ? "rate_limited"
        : res.status === 400
          ? "invalid_request"
          : res.status === 404
            ? "not_found"
            : "generic";
  return new ProjectSubmissionError(code, mensagem, retryAfter);
}

/** Todas as entregas do usuario. Lanca em erro: quem chama decide o fallback. */
export async function listSubmissions(): Promise<ProjectSubmission[]> {
  const res = await request("/");
  if (!res.ok) throw await erroDaResposta(res);
  const json = (await res.json()) as { data?: ProjectSubmission[] };
  return json.data ?? [];
}

/** A entrega de um projeto, ou null quando ainda nao existe (404). */
export async function getSubmission(
  projectId: string,
): Promise<ProjectSubmission | null> {
  const res = await request(`/${encodeURIComponent(projectId)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw await erroDaResposta(res);
  const json = (await res.json()) as { data?: ProjectSubmission };
  return json.data ?? null;
}

export async function upsertSubmission(
  projectId: string,
  input: SubmissionInput,
): Promise<ProjectSubmission> {
  const res = await request(`/${encodeURIComponent(projectId)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await erroDaResposta(res);
  const json = (await res.json()) as { data: ProjectSubmission };
  return json.data;
}

export async function verifySubmission(
  projectId: string,
): Promise<ProjectSubmission> {
  const res = await request(`/${encodeURIComponent(projectId)}/verify`, {
    method: "POST",
  });
  if (!res.ok) throw await erroDaResposta(res);
  const json = (await res.json()) as { data: ProjectSubmission };
  return json.data;
}
