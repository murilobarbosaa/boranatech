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

export async function persistQuizResult(payload: {
  answers: Array<{
    question_id: string;
    answer_id: string;
    answer_text: string;
    area: string;
  }>;
  result_area: string;
  result_area_slug?: string;
  confidence: number;
  result_json?: unknown;
}): Promise<{ id: string; completed_at: string } | null> {
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
