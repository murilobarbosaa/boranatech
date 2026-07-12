import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type {
  PublicQuizQuestion,
  QuizAlternativaId,
} from "@shared/roadmapQuiz/types";

// Service da prova final de roadmap (fase 4.3), consumindo os endpoints de
// /api/roadmap-quiz da 4.2. O client nunca ve gabarito fora da revisao da
// tentativa APROVADA (regra de revelacao aplicada no server).

export type QuizAnswerMap = Record<string, QuizAlternativaId>;

export interface QuizAttemptStart {
  attemptId: string;
  questions: PublicQuizQuestion[];
  // Respostas parciais ja salvas (retomada de tentativa ativa).
  answers: QuizAnswerMap;
}

export interface QuizQuestionGrade {
  id: string;
  acertou: boolean;
  // Pergunta que saiu do pool entre o sorteio e a correcao: anulada a favor.
  anulada?: boolean;
}

export interface QuizReviewItem {
  id: string;
  pergunta: string;
  alternativas: Array<{ id: QuizAlternativaId; texto: string }>;
  correta: QuizAlternativaId;
  explicacao: string;
  respostaDoUsuario: QuizAlternativaId | null;
}

export interface QuizSubmitResult {
  status: "aprovada" | "reprovada";
  score: number;
  passScore: number;
  porPergunta: QuizQuestionGrade[];
  // So vem quando aprovado (regra de revelacao).
  revisao?: QuizReviewItem[];
}

export interface QuizAttemptSummary {
  id: string;
  status: "ativa" | "aprovada" | "reprovada";
  score: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface QuizHistory {
  attempts: QuizAttemptSummary[];
  // Revisao completa da tentativa aprovada, se existir.
  revisaoAprovada?: QuizReviewItem[];
}

export type QuizErrorCode =
  | "quiz_unavailable"
  | "completion_required"
  | "already_passed"
  | "not_found"
  | "not_active"
  | "invalid_answers"
  | "network"
  | "unknown";

const KNOWN_CODES: ReadonlySet<string> = new Set([
  "quiz_unavailable",
  "completion_required",
  "already_passed",
  "not_found",
  "not_active",
  "invalid_answers",
]);

export class QuizServiceError extends Error {
  code: QuizErrorCode;

  constructor(code: QuizErrorCode, message: string) {
    super(message);
    this.name = "QuizServiceError";
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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const header = await authHeader();
  let res: Response;
  try {
    res = await fetch(apiUrl(`/api/roadmap-quiz${path}`), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...header,
        ...(options?.headers || {}),
      },
    });
  } catch {
    throw new QuizServiceError("network", "Falha de rede.");
  }

  const json = (await res.json().catch(() => null)) as {
    data?: T;
    error?: { code?: string; message?: string };
  } | null;

  if (!res.ok) {
    const code = json?.error?.code ?? "";
    throw new QuizServiceError(
      KNOWN_CODES.has(code) ? (code as QuizErrorCode) : "unknown",
      json?.error?.message ?? `HTTP ${res.status}`,
    );
  }
  if (json?.data === undefined) {
    throw new QuizServiceError("unknown", "Resposta vazia do servidor.");
  }
  return json.data;
}

// Inicia uma tentativa nova ou retoma a ativa (decisao do server).
export function startOrResume(slug: string): Promise<QuizAttemptStart> {
  return request<QuizAttemptStart>(
    `/${encodeURIComponent(slug)}/attempts`,
    { method: "POST" },
  );
}

// Autosave silencioso das respostas parciais da tentativa ativa.
export function saveAnswers(
  slug: string,
  attemptId: string,
  answers: QuizAnswerMap,
): Promise<{ saved: number }> {
  return request<{ saved: number }>(
    `/${encodeURIComponent(slug)}/attempts/${encodeURIComponent(attemptId)}/answers`,
    { method: "PUT", body: JSON.stringify({ answers }) },
  );
}

// Correcao server-side; a resposta segue a regra de revelacao.
export function submitAttempt(
  slug: string,
  attemptId: string,
  answers: QuizAnswerMap,
): Promise<QuizSubmitResult> {
  return request<QuizSubmitResult>(
    `/${encodeURIComponent(slug)}/attempts/${encodeURIComponent(attemptId)}/submit`,
    { method: "POST", body: JSON.stringify({ answers }) },
  );
}

// Historico do usuario na trilha (com revisao completa se ha aprovada).
export function getHistory(slug: string): Promise<QuizHistory> {
  return request<QuizHistory>(`/${encodeURIComponent(slug)}/attempts`);
}
