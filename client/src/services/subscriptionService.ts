import type { PaymentMethodId } from "@shared/paymentMethods";
import { apiUrl } from "@/lib/api";
import { AFFILIATE_STORAGE_KEY } from "@/hooks/useAffiliate";
import { COUPON_STORAGE_KEY } from "@/hooks/useCoupon";
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

// ALIAS do ponto unico (shared/paymentMethods.ts), nao uma terceira uniao. Ela
// existia aqui em duro e ficou desatualizada no instante em que o Pix entrou:
// duas unioes do mesmo conceito divergem no primeiro meio novo.
export type CheckoutPaymentMethod = PaymentMethodId;

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
  // Cupom de marketing, mesmo padrao do afiliado. O server revalida tudo e
  // decide a precedencia (cupom ganha do desconto de afiliado).
  let couponCode: string | undefined;
  try {
    const storedCoupon = window.localStorage.getItem(COUPON_STORAGE_KEY);
    const coupon = storedCoupon ? JSON.parse(storedCoupon) : null;
    couponCode = coupon?.expires > Date.now() ? coupon.code : undefined;
  } catch {
    couponCode = undefined;
  }
  const res = await fetch(`${API_BASE}/billing/checkout`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    // payment_method ausente => o server usa 'card' (retrocompativel).
    body: JSON.stringify({
      affiliateCode,
      couponCode,
      planId,
      payment_method: paymentMethod,
    }),
  });

  if (!res.ok) throw new CheckoutError(await checkoutErrorCode(res));
  const json = await res.json();
  return json.data as {
    checkoutUrl?: string;
    subscriptionId?: string;
    /** Ausente = redirecionar, que e o comportamento de sempre. */
    flow?: "redirect" | "native_pix";
    /**
     * Valor que o provedor registrou, em centavos. Ausente no backend antigo; a
     * tela entao omite o valor em vez de recalcular o desconto por conta propria.
     */
    amountCents?: number;
  };
}

export async function startCheckout() {
  return createCheckout("pro_monthly");
}

/** Retorno de GET /api/billing/pix-qrcode. */
export type PixQrCode = {
  /** PNG em base64, SEM o prefixo `data:`. */
  encodedImage: string;
  /** Copia e cola. */
  payload: string;
  /** Validade do CODIGO, nao do acesso. */
  expirationDate: string | null;
};

/**
 * QR da cobranca pendente do proprio usuario.
 *
 * Sem parametro de proposito: o servidor resolve a cobranca pelo dono. Um id de
 * pagamento numa URL do cliente seria enumeravel e precisaria ser defendido.
 */
export async function getPixQrCode(): Promise<PixQrCode> {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}/billing/pix-qrcode`, { headers });
  if (!res.ok) throw new CheckoutError(await checkoutErrorCode(res));
  const json = await res.json();
  return json.data as PixQrCode;
}
