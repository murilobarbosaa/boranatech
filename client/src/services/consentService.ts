import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const API_BASE = apiUrl("/api");

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

// Ha sessao autenticada agora? Usado logo apos o signUp: se a confirmacao de
// email estiver ligada nao ha token e o registro duravel espera o primeiro
// login (via ConsentGate).
export async function hasActiveSession(): Promise<boolean> {
  if (!supabase) return false;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return Boolean(session?.access_token);
}

// Identidade e prova vem do JWT no servidor. O client so envia os flags.
export async function recordConsent(): Promise<void> {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}/consent`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ acceptedTerms: true, acceptedPrivacy: true }),
  });
  if (!res.ok) {
    throw new Error(`Erro ao registrar consentimento (HTTP ${res.status}).`);
  }
}

export async function getConsentStatus(): Promise<boolean> {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}/consent/status`, { headers });
  if (!res.ok) {
    throw new Error(`Erro ao consultar consentimento (HTTP ${res.status}).`);
  }
  const json = (await res.json().catch(() => null)) as {
    hasConsented?: boolean;
  } | null;
  return json?.hasConsented === true;
}
