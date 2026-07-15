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
}

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

export async function getRenewalPreview(token: string): Promise<RenewalPreview> {
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

// Gera o boleto de renovacao. Sucesso -> checkoutUrl da Stripe (a pagina
// redireciona). Erros aqui podem trazer slugs DIFERENTES do preview (ex.:
// boleto_pending, already_renewed) porque o estado pode ter mudado entre o GET e
// o clique; a pagina trata os 6 slugs nas duas chamadas.
export async function createRenewalCheckout(token: string): Promise<string> {
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
    data?: { checkoutUrl?: string };
  } | null;
  if (!json?.data?.checkoutUrl) throw new RenewalError("unknown");
  return json.data.checkoutUrl;
}
