import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { Profile, ProfileSnapshot } from "./contracts";

const API_BASE = apiUrl("/api");

// Flag de "opt-in de marketing pendente", gravada no signup (form de e-mail ou
// OAuth) e consumida quando a sessao aparece (SIGNED_IN em AuthContext), mesmo
// padrao do PENDING_CONSENT_KEY. sessionStorage sobrevive ao redirect do OAuth na
// mesma aba. Setada SO quando a pessoa marca o opt-in: o default do banco ja e
// false, entao so precisamos persistir o "true".
export const PENDING_MARKETING_OPTIN_KEY = "bnt_pending_marketing_optin";

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

// Erro de leitura de perfil com o status HTTP ANEXADO, mesmo padrao do
// `consentError` em consentService.ts. O status ja aparecia dentro do texto da
// mensagem, mas texto de mensagem nao e campo: recuperar o numero de volta exigiria
// casar `/HTTP (\d+)/` na string, ou seja, um parser sobre a saida de outro trecho
// nosso, que e a classe de instrumento que falha PASSANDO (casa menos do que
// deveria e ninguem percebe). Como campo, quem loga le `err.status` direto.
function profileError(status: number | null, message: string): Error {
  const err = new Error(message) as Error & { status?: number | null };
  err.status = status;
  return err;
}

export async function getMyProfile(): Promise<Profile> {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}/me`, { headers });
  if (!res.ok) {
    throw profileError(res.status, `Erro ao buscar perfil (HTTP ${res.status}).`);
  }
  const json = (await res.json().catch(() => null)) as {
    data?: Profile | null;
  } | null;
  if (!json?.data?.id) {
    // 200 com corpo invalido: status null distingue do caso de falha HTTP.
    throw profileError(null, "Erro ao buscar perfil (resposta vazia ou inválida).");
  }
  return json.data;
}

export async function updateMyProfile(
  updates: Record<string, unknown>,
): Promise<Profile> {
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

// Consome a flag de opt-in pendente: grava marketing_opt_in=true via PATCH /api/me
// (o server carimba marketing_opt_in_at). Precisa de sessao, por isso o consumo e no
// SIGNED_IN do AuthContext, igual ao recordConsent.
export async function recordPendingMarketingOptIn(): Promise<void> {
  await updateMyProfile({ marketing_opt_in: true });
}
