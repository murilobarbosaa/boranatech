import { apiUrl } from "@/lib/api";
import { AFFILIATE_STORAGE_KEY } from "@/hooks/useAffiliate";
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

export async function createCheckout(planId = "pro_monthly") {
  const headers = await getAuthHeader();
  let affiliateCode: string | undefined;
  try {
    const storedAffiliate = window.localStorage.getItem(AFFILIATE_STORAGE_KEY);
    const affiliate = storedAffiliate ? JSON.parse(storedAffiliate) : null;
    affiliateCode =
      affiliate?.expires > Date.now() ? affiliate.code : undefined;
  } catch {
    affiliateCode = undefined;
  }
  const res = await fetch(`${API_BASE}/billing/checkout`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ affiliateCode, planId }),
  });

  if (!res.ok) throw new Error("Erro ao iniciar checkout");
  const json = await res.json();
  return json.data;
}

export async function startCheckout() {
  return createCheckout("pro_monthly");
}
