import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { NotaValidacao } from "@shared/projects/validationScore";

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
  nota: NotaValidacao | null;
}

export interface RequisitoDeclarado {
  id: string;
  descricao: string;
}

export interface SubmitValidationResult {
  status: "aprovado" | "reprovado";
  resultado: RequisitoAvaliacaoItem[];
  analysisId: string | null;
  pendentes: string[];
  nota: NotaValidacao;
  requisitos: RequisitoDeclarado[];
  /** false quando a tentativa foi PIOR que a melhor ja registrada. */
  gravado?: boolean;
  /** A melhor nota ja registrada, quando `gravado` e false. */
  melhor?: NotaValidacao;
}

export type ValidationErrorCode =
  | "rate_limited"
  | "timeout"
  | "invalid_url"
  | "already_validated"
  | "generic";

export class ProjectValidationError extends Error {
  code: ValidationErrorCode;
  /** Segundos ate poder tentar de novo, quando o servidor manda (429). */
  retryAfter?: number;
  constructor(code: ValidationErrorCode, message: string, retryAfter?: number) {
    super(message);
    this.name = "ProjectValidationError";
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
  Array<{
    projectId: string;
    status: string;
    nota?: NotaValidacao | null;
    perfeito?: boolean;
  }>
> {
  try {
    const res = await request("/");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      data?: Array<{
        projectId: string;
        status: string;
        nota?: NotaValidacao | null;
        perfeito?: boolean;
      }>;
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
  requisitos: RequisitoDeclarado[];
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
      requisitos: RequisitoDeclarado[];
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
    let retryAfter: number | undefined;
    try {
      const body = (await res.json()) as {
        error?: { message?: string; context?: { retryAfter?: number } };
      };
      if (body.error?.message) message = body.error.message;
      retryAfter = body.error?.context?.retryAfter;
    } catch {
      // corpo nao-JSON: mantem a mensagem generica
    }
    throw new ProjectValidationError(
      codeForStatus(res.status),
      message,
      retryAfter,
    );
  }
  return (await res.json()) as SubmitValidationResult;
}
