import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

// Camada VALIDADA de conclusao de projeto Pro (fase 5c): submissao de um
// repositorio do GitHub e leitura dos resultados requisito a requisito.
// Separada da autodeclarada (project_progress).

export type RequisitoVeredito = "atende" | "parcial" | "nao_atende";

export interface RequisitoAvaliacaoItem {
  id: string;
  veredito: RequisitoVeredito;
  evidencia: string;
}

export interface ProjectValidationRecord {
  projectId: string;
  status: "aprovado" | "reprovado";
  createdAt: string | null;
  analysisId: string | null;
  resultado: RequisitoAvaliacaoItem[];
}

export interface SubmitValidationResult {
  status: "aprovado" | "reprovado";
  resultado: RequisitoAvaliacaoItem[];
  analysisId: string | null;
  pendentes: string[];
}

export type ValidationErrorCode =
  | "rate_limited"
  | "timeout"
  | "invalid_url"
  | "already_validated"
  | "generic";

export class ProjectValidationError extends Error {
  code: ValidationErrorCode;
  constructor(code: ValidationErrorCode, message: string) {
    super(message);
    this.name = "ProjectValidationError";
    this.code = code;
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
  return fetch(apiUrl(`/api/project-validations${path}`), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...header,
      ...(options?.headers || {}),
    },
  });
}

function codeForStatus(status: number): ValidationErrorCode {
  if (status === 429) return "rate_limited";
  if (status === 504) return "timeout";
  if (status === 400) return "invalid_url";
  if (status === 409) return "already_validated";
  return "generic";
}

// Lista as validacoes do usuario (todas). Erro degrada pra lista vazia: a UI
// trata como "sem validacoes" e o detalhe por projeto re-tenta ao expandir.
export async function listProjectValidations(): Promise<
  Array<{ projectId: string; status: string }>
> {
  try {
    const res = await request("/");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      data?: Array<{ projectId: string; status: string }>;
    };
    return json.data ?? [];
  } catch (err) {
    console.error("[projectValidation] list error:", err);
    return [];
  }
}

// Detalhe por projeto: { ultima, aprovada } ou null quando nunca houve
// submissao (404 do endpoint).
export async function getProjectValidation(projectId: string): Promise<{
  ultima: ProjectValidationRecord;
  aprovada: ProjectValidationRecord | null;
} | null> {
  const res = await request(`/${encodeURIComponent(projectId)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new ProjectValidationError(
      codeForStatus(res.status),
      `HTTP ${res.status}`,
    );
  }
  const json = (await res.json()) as {
    data?: {
      ultima: ProjectValidationRecord;
      aprovada: ProjectValidationRecord | null;
    };
  };
  return json.data ?? null;
}

export async function submitProjectValidation(
  projectId: string,
  url: string,
): Promise<SubmitValidationResult> {
  const res = await request(`/${encodeURIComponent(projectId)}/submit`, {
    method: "POST",
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      // corpo nao-JSON: mantem a mensagem generica
    }
    throw new ProjectValidationError(codeForStatus(res.status), message);
  }
  return (await res.json()) as SubmitValidationResult;
}
