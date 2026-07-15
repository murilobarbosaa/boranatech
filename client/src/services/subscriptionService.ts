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

export type CheckoutPaymentMethod = "card" | "boleto";

// Preserva o error.code que o server manda (createError -> { error: { code } }),
// para a UI mostrar mensagem por slug (conflict, boleto_pending, ...). Antes o
// createCheckout colapsava tudo num Error generico. Mesmo padrao do RenewalError.
export class CheckoutError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message ?? code);
    this.name = "CheckoutError";
    this.code = code;
  }
}

async function checkoutErrorCode(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    error?: { code?: string };
  } | null;
  return body?.error?.code ?? "unknown";
}

export async function createCheckout(
  planId = "pro_monthly",
  paymentMethod?: CheckoutPaymentMethod,
) {
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
    // payment_method ausente => o server usa 'card' (retrocompativel).
    body: JSON.stringify({ affiliateCode, planId, payment_method: paymentMethod }),
  });

  if (!res.ok) throw new CheckoutError(await checkoutErrorCode(res));
  const json = await res.json();
  return json.data;
}

export async function startCheckout() {
  return createCheckout("pro_monthly");
}
