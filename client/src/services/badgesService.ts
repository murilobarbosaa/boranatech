import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { BadgeCategory } from "@shared/badges";

const API_BASE = apiUrl("/api/badges");

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

export interface BadgeInfo {
  id: string;
  category: BadgeCategory;
  name: string;
  description: string;
  iconName: string;
  unlockCriteria: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progress: { current: number; target: number } | null;
  isNew: boolean;
}

export interface BadgesListResponse {
  badges: BadgeInfo[];
  newlyUnlocked: string[];
  totalCount: number;
  unlockedCount: number;
}

export async function getBadgesList(): Promise<BadgesListResponse> {
  const json = await apiFetch("/list");
  return json.data;
}
