import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

// Cliente das rotas /api/interview (entrevista simulada). Transporte e POST
// JSON por turno (sem stream). O gating real e server-side; aqui os status
// viram erros tipados que a UI distingue, e o 422 de fetch de vaga vira
// retorno DISCRIMINADO (nao excecao) pro form cair no modo de colar texto.

export type InterviewKind = "job" | "general";
export type InterviewLanguage = "pt" | "en";
export type InterviewRating = "boa" | "mediana" | "fraca";
export type InterviewStatus = "active" | "completed";

export interface InterviewEvaluation {
  rating: InterviewRating;
  feedback: string;
  // Marcador estrutural do turno avaliado que FECHOU a sessao (content =
  // feedback, sem proxima pergunta). Ausente em turnos normais e em sessoes
  // anteriores ao marcador (o client mantem fallback legado).
  terminal?: boolean;
}

// Contadores pos-turno vindos DIRETO do server (dado real, nunca calculado
// no client): alimentam o indicador de preparo ao vivo.
export interface InterviewProgress {
  questionCount: number;
  goodCount: number;
  goodStreak: number;
}

export type InterviewTurnKind = "answer" | "hint" | "closing";

export interface InterviewVerdict {
  result: "prepared" | "question_cap" | "stopped_early";
  goodCount: number;
  questionCount: number;
  hintsUsed?: number;
  closing?: string;
}

export interface InterviewSessionSummary {
  id: string;
  kind: InterviewKind;
  area: string | null;
  level: string | null;
  // not null no banco (default 'pt' desde a migration da E1).
  language: InterviewLanguage;
  status: InterviewStatus;
  question_count: number;
  good_count: number;
  // null enquanto a sessao esta ativa. A UI e fail-closed: badge de Preparado
  // SO quando verdict.result === "prepared"; null/ausente = sem badge, nunca
  // inferido dos contadores.
  verdict: InterviewVerdict | null;
  created_at: string;
}

export interface InterviewTurn {
  id: string;
  role: "assistant" | "user";
  content: string;
  evaluation: InterviewEvaluation | null;
  kind: InterviewTurnKind;
  created_at: string;
}

export interface InterviewSessionDetail extends InterviewSessionSummary {
  verdict: InterviewVerdict | null;
  // Sequencia atual de respostas boas (o select do getSession ja a traz);
  // inicializa o indicador de preparo na retomada.
  good_streak: number;
  updated_at: string;
  turns: InterviewTurn[];
}

export interface CreateSessionInput {
  kind: InterviewKind;
  area: string;
  level: string;
  language: InterviewLanguage;
  jobUrl?: string;
  jobText?: string;
}

export type CreateSessionResult =
  | { kind: "created"; sessionId: string; question: string }
  | { kind: "job_fetch_failed"; reason: string };

export interface AnswerResult {
  evaluation: InterviewEvaluation | null;
  nextQuestion: string | null;
  done: boolean;
  verdict?: InterviewVerdict;
  progress?: InterviewProgress;
}

export type InterviewErrorCode =
  | "login_required"
  | "not_pro"
  | "not_found"
  | "session_completed"
  | "rate_limited"
  | "rate_check_failed"
  | "unavailable";

export class InterviewApiError extends Error {
  readonly code: InterviewErrorCode;

  constructor(code: InterviewErrorCode, message: string) {
    super(message);
    this.name = "InterviewApiError";
    this.code = code;
  }
}

interface ApiErrorBody {
  error?: { code?: string; reason?: string; message?: string };
}

async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function readBody(response: Response): Promise<ApiErrorBody> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return {};
  }
}

function toApiError(status: number, body: ApiErrorBody): InterviewApiError {
  const serverMessage = body.error?.message ?? "";
  if (status === 401) {
    return new InterviewApiError("login_required", "Faca login pra continuar.");
  }
  if (status === 403) {
    return new InterviewApiError(
      "not_pro",
      serverMessage || "Recurso do Plano Pro.",
    );
  }
  if (status === 404) {
    return new InterviewApiError(
      "not_found",
      serverMessage || "Sessao nao encontrada.",
    );
  }
  if (status === 409) {
    return new InterviewApiError(
      "session_completed",
      serverMessage || "Esta sessao ja foi encerrada.",
    );
  }
  if (status === 429) {
    return new InterviewApiError(
      "rate_limited",
      serverMessage || "Limite diario atingido. Tente novamente amanha.",
    );
  }
  if (status === 503) {
    return new InterviewApiError(
      "rate_check_failed",
      serverMessage ||
        "Nao foi possivel verificar seu limite agora. Tente de novo.",
    );
  }
  return new InterviewApiError(
    "unavailable",
    serverMessage || "Nao foi possivel completar agora. Tente de novo.",
  );
}

async function request(path: string, options?: RequestInit): Promise<Response> {
  const header = await authHeader();
  return fetch(apiUrl(`/api/interview${path}`), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...header,
      ...(options?.headers || {}),
    },
  });
}

export async function createSession(
  input: CreateSessionInput,
): Promise<CreateSessionResult> {
  const response = await request("/sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (response.status === 422) {
    const body = await readBody(response);
    if (body.error?.code === "job_fetch_failed") {
      return {
        kind: "job_fetch_failed",
        reason: body.error.reason ?? "unknown",
      };
    }
    throw toApiError(response.status, body);
  }

  if (!response.ok) {
    throw toApiError(response.status, await readBody(response));
  }

  const body = (await response.json()) as {
    data?: { sessionId?: string; question?: string };
  };
  if (!body.data?.sessionId || !body.data.question) {
    throw new InterviewApiError(
      "unavailable",
      "Resposta inesperada ao criar a sessao.",
    );
  }
  return {
    kind: "created",
    sessionId: body.data.sessionId,
    question: body.data.question,
  };
}

export async function sendAnswer(
  sessionId: string,
  answer: string,
): Promise<AnswerResult> {
  const response = await request(
    `/sessions/${encodeURIComponent(sessionId)}/answers`,
    {
      method: "POST",
      body: JSON.stringify({ answer }),
    },
  );

  if (!response.ok) {
    throw toApiError(response.status, await readBody(response));
  }

  const body = (await response.json()) as { data?: AnswerResult };
  if (!body.data || typeof body.data.done !== "boolean") {
    throw new InterviewApiError(
      "unavailable",
      "Resposta inesperada ao enviar a resposta.",
    );
  }
  return body.data;
}

export async function requestHint(sessionId: string): Promise<string> {
  const response = await request(
    `/sessions/${encodeURIComponent(sessionId)}/hint`,
    { method: "POST" },
  );

  if (!response.ok) {
    throw toApiError(response.status, await readBody(response));
  }

  const body = (await response.json()) as { data?: { hint?: string } };
  if (!body.data?.hint) {
    throw new InterviewApiError(
      "unavailable",
      "Resposta inesperada ao pedir a dica.",
    );
  }
  return body.data.hint;
}

export async function finishSession(
  sessionId: string,
): Promise<InterviewVerdict> {
  const response = await request(
    `/sessions/${encodeURIComponent(sessionId)}/finish`,
    { method: "POST" },
  );

  if (!response.ok) {
    throw toApiError(response.status, await readBody(response));
  }

  const body = (await response.json()) as { data?: { verdict?: InterviewVerdict } };
  if (!body.data?.verdict) {
    throw new InterviewApiError(
      "unavailable",
      "Resposta inesperada ao encerrar a sessao.",
    );
  }
  return body.data.verdict;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const response = await request(
    `/sessions/${encodeURIComponent(sessionId)}`,
    { method: "DELETE" },
  );
  // 404 vira not_found: a sessao ja nao existia; o caller remove da lista.
  if (!response.ok) {
    throw toApiError(response.status, await readBody(response));
  }
}

export async function listSessions(): Promise<InterviewSessionSummary[]> {
  const response = await request("/sessions");
  if (!response.ok) {
    throw toApiError(response.status, await readBody(response));
  }
  const body = (await response.json()) as { data?: unknown };
  return Array.isArray(body.data)
    ? (body.data as InterviewSessionSummary[])
    : [];
}

export async function getSession(
  sessionId: string,
): Promise<InterviewSessionDetail> {
  const response = await request(
    `/sessions/${encodeURIComponent(sessionId)}`,
  );
  if (!response.ok) {
    throw toApiError(response.status, await readBody(response));
  }
  const body = (await response.json()) as { data?: InterviewSessionDetail };
  if (!body.data || typeof body.data !== "object") {
    throw new InterviewApiError(
      "unavailable",
      "Resposta inesperada ao buscar a sessao.",
    );
  }
  return {
    ...body.data,
    turns: Array.isArray(body.data.turns) ? body.data.turns : [],
  };
}
