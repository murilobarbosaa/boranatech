import { env } from "./env";

const ASAAS_BASE_URL = env.asaasEnv === "production" ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3";

async function asaasRequest(method: string, path: string, body?: Record<string, unknown>) {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      access_token: env.asaasApiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

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
  const search = await asaasRequest("GET", `/customers?email=${encodeURIComponent(params.email)}&limit=1`);

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
  value?: number;
  cycle?: "MONTHLY" | "SEMIANNUALLY" | "YEARLY";
  affiliateCode?: string;
}) {
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 1);

  return asaasRequest("POST", "/subscriptions", {
    customer: params.customerId,
    billingType: "CREDIT_CARD",
    value: params.value ?? 24.9,
    nextDueDate: nextDueDate.toISOString().split("T")[0],
    cycle: params.cycle || "MONTHLY",
    description: "Bora na Tech? - Plano Pro",
    externalReference: [params.userId, params.planCode, params.affiliateCode].filter(Boolean).join(":"),
  });
}
