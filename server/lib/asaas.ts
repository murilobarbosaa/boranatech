// LEGADO: cliente Asaas mantido para as assinaturas existentes (cancel/reconcile), sem novos checkouts. Provider ativo e a Stripe.
import { env } from "./env";
import { fetchWithTimeout } from "./http";

// URLs documentadas (docs.asaas.com): producao usa /v3; sandbox tem host proprio.
const ASAAS_BASE_URL =
  env.asaasEnv === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

// Teto por chamada. SEM retry de proposito: nem toda chamada de cobranca e
// idempotente; retry seguro exige idempotency key (fase futura). O checkout
// encadeia ate 4 chamadas (pior caso ~60s), coberto pelo budget global de
// rota em fase futura.
const ASAAS_TIMEOUT_MS = 15_000;

async function asaasRequest(
  method: string,
  path: string,
  body?: Record<string, unknown>,
) {
  const res = await fetchWithTimeout(
    `${ASAAS_BASE_URL}${path}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        access_token: env.asaasApiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    },
    { service: "asaas", timeoutMs: ASAAS_TIMEOUT_MS },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Asaas error ${res.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

export async function getOrCreateAsaasCustomer(params: {
  userId: string;
  name: string;
  email: string;
  cpfCnpj?: string;
}) {
  const search = await asaasRequest(
    "GET",
    `/customers?email=${encodeURIComponent(params.email)}&limit=1`,
  );

  if (search.data?.length > 0) {
    return search.data[0];
  }

  return asaasRequest("POST", "/customers", {
    name: params.name || params.email,
    email: params.email,
    externalReference: params.userId,
  });
}

export async function createAsaasCheckout(params: {
  customerId: string;
  userId: string;
  planCode: string;
  value: number;
  cycle?: "MONTHLY" | "SEMIANNUALLY" | "YEARLY";
  affiliateCode?: string;
  successUrl?: string;
}) {
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 1);

  const data = await asaasRequest("POST", "/subscriptions", {
    customer: params.customerId,
    billingType: "CREDIT_CARD",
    value: params.value,
    nextDueDate: nextDueDate.toISOString().split("T")[0],
    cycle: params.cycle || "MONTHLY",
    description: "Bora na Tech? - Plano Pro",
    externalReference: [params.userId, params.planCode, params.affiliateCode]
      .filter(Boolean)
      .join(":"),
    callback: params.successUrl ? { successUrl: params.successUrl } : undefined,
  });

  console.log(
    "[asaas] subscription created:",
    JSON.stringify({ id: data?.id, status: data?.status, value: data?.value }),
  );
  return data;
}

export async function getAsaasSubscriptionPayments(subscriptionId: string) {
  return asaasRequest(
    "GET",
    `/subscriptions/${encodeURIComponent(subscriptionId)}/payments`,
  );
}

export async function getAsaasSubscription(subscriptionId: string) {
  return asaasRequest(
    "GET",
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
  );
}

export async function cancelAsaasSubscription(subscriptionId: string) {
  return asaasRequest(
    "DELETE",
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
  );
}

type AsaasSubscriptionUpdate = {
  endDate?: string | null; // YYYY-MM-DD: ultimo vencimento a gerar; Asaas para de gerar cobrancas apos. null e tentativa de LIMPAR, leitura do schema (example: null); validar empiricamente antes de prod (ver billing-asaas.ts/reactivateSubscriptionAtAsaas).
  status?: "ACTIVE" | "INACTIVE";
  nextDueDate?: string;
  value?: number;
  cycle?: "MONTHLY" | "SEMIANNUALLY" | "YEARLY";
  updatePendingPayments?: boolean;
};

// PUT /v3/subscriptions/{id}. Envia apenas os campos definidos (omite undefined).
export async function updateAsaasSubscription(
  id: string,
  params: AsaasSubscriptionUpdate,
) {
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) body[key] = value;
  }
  return asaasRequest("PUT", `/subscriptions/${encodeURIComponent(id)}`, body);
}

// DELETE /v3/payments/{id}.
// Salvaguarda s1: o Asaas pode pre-gerar a cobranca do proximo ciclo como PENDING.
// Definir endDate (por doc) nao garante remover uma cobranca ja gerada, e
// updatePendingPayments so edita propriedades (valor/forma), nao apaga. Para
// neutralizar de fato uma cobranca futura usamos o DELETE da propria cobranca,
// operacao documentada para "remover uma cobranca que nao deve permanecer no fluxo".
export async function deleteAsaasPayment(paymentId: string) {
  return asaasRequest("DELETE", `/payments/${encodeURIComponent(paymentId)}`);
}

// PUT /v3/payments/{id}: edita uma cobranca ja existente. Usado pra descontar SO a
// primeira cobranca de uma assinatura, deixando a recorrencia no valor cheio.
// Diferente de updateAsaasSubscription (que so afeta cobrancas futuras), aqui
// editamos a cobranca especifica que ja existe.
export async function updateAsaasPaymentValue(paymentId: string, value: number) {
  return asaasRequest("PUT", `/payments/${encodeURIComponent(paymentId)}`, {
    value,
  });
}
