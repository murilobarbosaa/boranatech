import type { CareerQuizAnswer, CareerQuizResult } from "./contracts";
import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

// Chave unica do resultado do quiz no sessionStorage, compartilhada entre o
// quiz, a pagina de resultado e a reconciliacao pos-login (evita drift entre
// literais duplicados).
export const QUIZ_RESULT_SESSION_KEY = "quiz-carreira.last-result";

// Payload aceito pelo POST /api/quiz/attempts/batch. Fica guardado junto do
// resultado no sessionStorage quando a persistencia ainda nao foi confirmada,
// para a reconciliacao pos-login reenviar exatamente o mesmo conteudo.
export interface PersistQuizPayload {
  answers: Array<{
    question_id: string;
    answer_id: string;
    answer_text: string;
    area: string;
  }>;
  result_area: string;
  result_area_slug?: string;
  confidence: number;
  level?: string;
  result_json?: unknown;
}

async function getAuthHeader(): Promise<Record<string, string> | null> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return null;
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function getCareerQuizResult(
  answers: CareerQuizAnswer[],
): Promise<CareerQuizResult> {
  const scores = answers.reduce<Record<string, number>>((acc, answer) => {
    acc[answer.area] = (acc[answer.area] || 0) + 1;
    return acc;
  }, {});
  const [area = "Front-end", score = 0] =
    Object.entries(scores).sort((a, b) => b[1] - a[1])[0] || [];

  return {
    area,
    confidence: Math.round((score / Math.max(answers.length, 1)) * 100),
    reason:
      "Resultado calculado localmente. O contrato já permite trocar por uma resposta de IA externa.",
    nextSteps: [
      "Abrir roadmap da área",
      "Escolher um curso curto",
      "Criar um projeto publicável",
    ],
  };
}

export async function persistQuizResult(
  payload: PersistQuizPayload,
): Promise<{ id: string; completed_at: string } | null> {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  try {
    const response = await fetch(apiUrl("/api/quiz/attempts/batch"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Quiz persist falhou: ${response.status}`);
    }

    const json = await response.json();
    return json.data as { id: string; completed_at: string };
  } catch (err) {
    console.error("Erro ao persistir resultado do quiz:", err);
    return null;
  }
}

// Marca o resultado guardado no sessionStorage como persistido (gravado em
// career_quiz_attempts). Silenciosa: sessionStorage indisponivel ou payload
// corrompido nao lanca.
export function markStoredQuizResultPersisted(): void {
  try {
    const raw = sessionStorage.getItem(QUIZ_RESULT_SESSION_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    sessionStorage.setItem(
      QUIZ_RESULT_SESSION_KEY,
      JSON.stringify({ ...parsed, persisted: true }),
    );
  } catch {
    // silencioso
  }
}

// Reconciliacao pos-login do quiz feito deslogado: se o sessionStorage tem um
// resultado com persisted false e o payload de persistencia guardado, reenvia
// ao backend. Idempotente (sucesso marca persisted true e as proximas chamadas
// nao fazem nada) e silenciosa em falha (warn, nunca throw): sem sessao ou com
// falha de rede o persisted continua false e a proxima sessao tenta de novo.
export async function reconcilePendingQuizResult(): Promise<void> {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(QUIZ_RESULT_SESSION_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  let stored: { persisted?: unknown; persistPayload?: PersistQuizPayload };
  try {
    stored = JSON.parse(raw) as {
      persisted?: unknown;
      persistPayload?: PersistQuizPayload;
    };
  } catch {
    return;
  }
  if (stored.persisted !== false || !stored.persistPayload) return;

  const saved = await persistQuizResult(stored.persistPayload);
  if (!saved) {
    console.warn(
      "[quiz] reconciliacao adiada: resultado segue nao persistido na conta.",
    );
    return;
  }
  markStoredQuizResultPersisted();
}

export async function getQuizHistory() {
  const headers = await getAuthHeader();
  if (!headers) return [];

  try {
    const res = await fetch(apiUrl("/api/quiz/history"), { headers });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}
