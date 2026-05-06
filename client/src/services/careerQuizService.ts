import type { CareerQuizAnswer, CareerQuizResult } from "./contracts";
import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

async function getAuthHeader(): Promise<Record<string, string> | null> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return null;
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function getCareerQuizResult(answers: CareerQuizAnswer[]): Promise<CareerQuizResult> {
  const scores = answers.reduce<Record<string, number>>((acc, answer) => {
    acc[answer.area] = (acc[answer.area] || 0) + 1;
    return acc;
  }, {});
  const [area = "Front-end", score = 0] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0] || [];

  return {
    area,
    confidence: Math.round((score / Math.max(answers.length, 1)) * 100),
    reason: "Resultado calculado localmente. O contrato já permite trocar por uma resposta de IA externa.",
    nextSteps: ["Abrir roadmap da área", "Escolher um curso curto", "Criar um projeto publicável"],
  };
}

export async function persistQuizResult(params: {
  answers: Array<{ question_id: string; answer_id?: string; answer_text?: string; area?: string }>;
  result_area: string;
  result_area_slug?: string;
  confidence?: number;
  result_json?: Record<string, unknown>;
}) {
  const headers = await getAuthHeader();
  if (!headers) return null;

  try {
    const attemptRes = await fetch(apiUrl("/api/quiz/attempts"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
    });
    if (!attemptRes.ok) return null;
    const { data: attempt } = await attemptRes.json();

    await fetch(apiUrl(`/api/quiz/attempts/${attempt.id}/answers`), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ answers: params.answers }),
    });

    const completeRes = await fetch(apiUrl(`/api/quiz/attempts/${attempt.id}/complete`), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        result_area: params.result_area,
        result_area_slug: params.result_area_slug,
        confidence: params.confidence,
        result_json: params.result_json,
      }),
    });
    if (!completeRes.ok) return null;

    return attempt.id as string;
  } catch {
    return null;
  }
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
