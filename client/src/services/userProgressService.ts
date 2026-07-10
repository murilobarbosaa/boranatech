import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export type ProgressContext =
  | "portfolio_checklist"
  | "favorites"
  | "course_progress"
  | "quiz_history"
  | "career_plan";

export interface ProgressEntry {
  itemKey: string;
  state: Record<string, unknown>;
  updatedAt: string;
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

  return fetch(apiUrl(`/api/progress${path}`), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...header,
      ...(options?.headers || {}),
    },
  });
}

export async function listProgress(
  context: ProgressContext,
): Promise<ProgressEntry[]> {
  try {
    const res = await request(`/${encodeURIComponent(context)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { data?: ProgressEntry[] };
    return json.data ?? [];
  } catch (err) {
    console.error("[userProgress] listProgress error:", err);
    return [];
  }
}

export async function upsertProgress(
  context: ProgressContext,
  itemKey: string,
  state: Record<string, unknown>,
): Promise<void> {
  const res = await request(
    `/${encodeURIComponent(context)}/${encodeURIComponent(itemKey)}`,
    {
      method: "PUT",
      body: JSON.stringify({ state }),
    },
  );

  if (!res.ok) {
    console.error("[userProgress] upsertProgress error:", res.status);
    throw new Error(`Erro ao salvar progresso (HTTP ${res.status}).`);
  }
}

export async function deleteProgress(
  context: ProgressContext,
  itemKey: string,
): Promise<void> {
  const res = await request(
    `/${encodeURIComponent(context)}/${encodeURIComponent(itemKey)}`,
    { method: "DELETE" },
  );

  if (!res.ok) {
    console.error("[userProgress] deleteProgress error:", res.status);
    throw new Error(`Erro ao remover progresso (HTTP ${res.status}).`);
  }
}
