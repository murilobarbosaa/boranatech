import { apiUrl } from "@/lib/api";

// Renovacao de boleto por token assinado (pagina publica /renovar). SEM auth: o
// token e a autenticacao. Ao contrario de subscriptionService.createCheckout, que
// colapsa qualquer !ok num Error generico, aqui PRESERVAMOS o error.code do body
// (createError manda { error: { code, message } }) para a pagina renderizar copy
// diferente por slug (invalid_token, expired_token, boleto_pending, etc.).

export interface RenewalPreview {
  planId: string;
  planLabel: string;
  priceLabel: string;
  periodEnd: string | null;
  /**
   * Meio pelo qual a renovacao vai ser cobrada (`boleto` | `pix`). Opcional:
   * backend antigo na janela de deploy nao manda; ausente vale boleto, que era
   * o unico meio ate o lote 2b.
   */
  paymentMethod?: string;
}

/** QR do Pix, no mesmo shape de `PixQrCode` do subscriptionService. */
export interface RenewalPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string | null;
}

/**
 * Resposta do POST /api/billing/renew. Stripe manda `checkoutUrl` (a pagina
 * redireciona); Asaas manda `flow: "native_pix"` com o QR JUNTO, porque a
 * pagina nao tem sessao para buscar o QR por conta propria.
 */
export interface RenewalCheckoutResult {
  checkoutUrl?: string;
  subscriptionId?: string;
  flow?: "redirect" | "native_pix";
  amountCents?: number | null;
  dueDate?: string | null;
  /** O QR de uma cobranca pendente que ainda valia, em vez de um novo. */
  reused?: boolean;
  pixQrCode?: RenewalPixQrCode | null;
}

export type RenewalStatus =
  | { status: "pending" }
  | { status: "active"; periodEnd: string | null }
  | { status: "expired_qr" };

export class RenewalError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message ?? code);
    this.name = "RenewalError";
    this.code = code;
  }
}

// Falha de rede ou body sem code cai em "unknown"; a pagina mapeia unknown para a
// copy generica ("nao conseguimos processar"). Nunca silencia o code do server.
async function errorCodeFrom(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    error?: { code?: string; message?: string };
  } | null;
  return body?.error?.code ?? "unknown";
}

export async function getRenewalPreview(
  token: string,
): Promise<RenewalPreview> {
  let res: Response;
  try {
    res = await fetch(
      apiUrl(`/api/billing/renew?token=${encodeURIComponent(token)}`),
    );
  } catch {
    throw new RenewalError("unknown");
  }
  if (!res.ok) throw new RenewalError(await errorCodeFrom(res));
  const json = (await res.json().catch(() => null)) as {
    data?: RenewalPreview;
  } | null;
  if (!json?.data) throw new RenewalError("unknown");
  return json.data;
}

// Gera a cobranca de renovacao. Stripe -> `checkoutUrl` (a pagina
// redireciona); Asaas -> `flow: "native_pix"` com o QR. Erros aqui podem trazer
// slugs DIFERENTES do preview (ex.: boleto_pending, pix_pending,
// already_renewed) porque o estado pode ter mudado entre o GET e o clique.
export async function createRenewalCheckout(
  token: string,
): Promise<RenewalCheckoutResult> {
  let res: Response;
  try {
    res = await fetch(apiUrl("/api/billing/renew"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch {
    throw new RenewalError("unknown");
  }
  if (!res.ok) throw new RenewalError(await errorCodeFrom(res));
  const json = (await res.json().catch(() => null)) as {
    data?: RenewalCheckoutResult;
  } | null;
  if (!json?.data) throw new RenewalError("unknown");
  return json.data;
}

// Estado da renovacao, para o polling do QR sem sessao. 401 vira erro nomeado;
// falha de rede vira "unknown" e o chamador decide se tenta de novo.
export async function getRenewalStatus(token: string): Promise<RenewalStatus> {
  let res: Response;
  try {
    res = await fetch(
      apiUrl(`/api/billing/renew/status?token=${encodeURIComponent(token)}`),
    );
  } catch {
    throw new RenewalError("unknown");
  }
  if (!res.ok) throw new RenewalError(await errorCodeFrom(res));
  const json = (await res.json().catch(() => null)) as {
    data?: RenewalStatus;
  } | null;
  if (!json?.data) throw new RenewalError("unknown");
  return json.data;
}
