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

export async function getMySubscription() {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}/billing/subscription`, { headers });
  if (!res.ok) throw new Error("Erro ao buscar assinatura");
  const json = await res.json();
  return json.data;
}

export async function startCheckout() {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}/billing/checkout`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Erro ao iniciar checkout");
  const json = await res.json();
  return json.data;
}
