import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const API_BASE = apiUrl("/api/study");

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function apiFetch(path: string, options?: RequestInit) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || "Erro na requisição");
  }

  return res.json();
}

export interface StudyEntry {
  id: string;
  user_id: string;
  text: string;
  minutes: number;
  mode: "produtiva" | "ritmo" | "dispersa" | "revisar";
  studied_at: string; // ISO timestamp (timestamptz no banco)
  created_at: string; // ISO timestamp (timestamptz no banco)
}

export interface StudyStats {
  days_studied: number;
  total_minutes: number;
  current_streak: number;
  longest_streak: number;
}

export interface StudyHeatmapDay {
  date: string;
  minutes: number;
  entries: number;
}

export async function getStudyEntries(params?: {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): Promise<StudyEntry[]> {
  const query = new URLSearchParams();
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString();
  const json = await apiFetch(`/entries${qs ? `?${qs}` : ""}`);
  return json.data;
}

export async function createStudyEntry(entry: {
  text: string;
  minutes: number;
  mode: string;
  studied_at?: string;
}): Promise<StudyEntry> {
  const json = await apiFetch("/entries", {
    method: "POST",
    body: JSON.stringify(entry),
  });
  return json.data;
}

export async function updateStudyEntry(
  id: string,
  updates: Partial<Pick<StudyEntry, "text" | "minutes" | "mode">>,
): Promise<StudyEntry> {
  const json = await apiFetch(`/entries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return json.data;
}

export async function deleteStudyEntry(id: string): Promise<void> {
  await apiFetch(`/entries/${id}`, { method: "DELETE" });
}

export async function getStudyStats(range: "7d" | "30d" | "90d" = "7d"): Promise<StudyStats> {
  const json = await apiFetch(`/stats?range=${range}`);
  return json.data;
}

export async function getStudyHeatmap(days = 365): Promise<StudyHeatmapDay[]> {
  const json = await apiFetch(`/heatmap?days=${days}`);
  return json.data || [];
}
