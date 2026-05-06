import { supabase } from "@/lib/supabase";
import type { Profile, ProfileSnapshot } from "./contracts";

const API_BASE = "/api";

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function getProfileSnapshot(): Promise<ProfileSnapshot> {
  const profile = await getMyProfile();

  return {
    trails: profile.area_interesse ? [profile.area_interesse] : [],
    roadmaps: [],
    savedCourses: [],
    savedProjects: [],
    favoriteJobs: [],
    communities: [],
  };
}

export async function getMyProfile(): Promise<Profile> {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}/me`, { headers });
  if (!res.ok) throw new Error("Erro ao buscar perfil");
  const json = (await res.json()) as { data: Profile };
  return json.data;
}

export async function updateMyProfile(updates: Record<string, unknown>): Promise<Profile> {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}/me`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!res.ok) throw new Error("Erro ao atualizar perfil");
  const json = (await res.json()) as { data: Profile };
  return json.data;
}
