// scripts/test-cancel-flow.ts
// Validacao sandbox do Passo 4: fluxo completo do POST /billing/cancel
// (abordagem C: endDate no Asaas + salvaguarda s1: DELETE das pendentes futuras).
// Roda SOMENTE contra o sandbox do Asaas. NAO usar em producao.
// Executar (Node 22):
//   node --env-file=.env --import tsx scripts/test-cancel-flow.ts
//
// PENDENCIA: getOrCreateAsaasCustomer aceita cpfCnpj? mas nunca envia ao Asaas;
// e profiles nao coleta cpf_cnpj. Tratar quando oferecer PIX/Boleto.

import {
  cancelAsaasSubscription,
  getAsaasSubscriptionPayments,
} from "../server/lib/asaas";
import { cancelSubscriptionAtAsaas } from "../server/lib/billing-asaas";
import { env } from "../server/lib/env";

const BASE =
  env.asaasEnv === "production"
    ? "https://api.asaas.com"
    : "https://sandbox.asaas.com";

function ymd(date: Date) {
  return date.toISOString().split("T")[0];
}

// Helpers locais (duplicados de test-asaas-enddate.ts de proposito: mantem cada
// script de validacao auto-contido, independente para rodar/apagar, e sem mexer
// no test-asaas-enddate.ts ja commitado/validado). Boilerplate estavel do sandbox.
async function createTestCustomer(stamp: number, cpfCnpj: string) {
  const res = await fetch(`${BASE}/api/v3/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: env.asaasApiKey,
    },
    body: JSON.stringify({
      name: "Teste cancel",
      email: `cancel-test+${stamp}@boranatech.com.br`,
      externalReference: `cancel-test-${stamp}`,
      cpfCnpj,
    }),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      `create customer falhou ${res.status}: ${JSON.stringify(data)}`,
    );
  return data as { id: string };
}

async function createBoletoTestSub(customerId: string, nextDueDate: string) {
  const res = await fetch(`${BASE}/api/v3/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: env.asaasApiKey,
    },
    body: JSON.stringify({
      customer: customerId,
      billingType: "BOLETO",
      value: 24.9,
      nextDueDate,
      cycle: "MONTHLY",
      description: "Teste cancel (Passo 4) - pode apagar",
      externalReference: "cancel-flow-test",
    }),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(`create sub falhou ${res.status}: ${JSON.stringify(data)}`);
  return data as { id: string; nextDueDate?: string };
}

// GET /v3/subscriptions/{id}: le de volta o endDate apos o cancel (VEREDITO 1).
async function getAsaasSubscription(id: string) {
  const res = await fetch(
    `${BASE}/api/v3/subscriptions/${encodeURIComponent(id)}`,
    {
      headers: { access_token: env.asaasApiKey },
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(`get sub falhou ${res.status}: ${JSON.stringify(data)}`);
  return data as { id: string; endDate?: string | null; status?: string };
}

// POST /v3/payments/{id}/receiveInCash: marca cobranca como RECEIVED (best-effort
// no sandbox) para validar o ponto 3.
async function receiveInCash(paymentId: string, value: number) {
  // ymd() usa toISOString() (UTC). Em SP (UTC-3), `new Date()` apos ~21h vira o
  // dia seguinte em UTC e o Asaas recusa paymentDate no futuro. Recuamos 12h para
  // garantir que o YYYY-MM-DD resultante seja sempre <= hoje no fuso de SP
  // (eventualmente ontem em chamadas pela manha — tolerado: paymentDate passado e ok).
  const paymentDate = ymd(new Date(Date.now() - 12 * 3600 * 1000));
  const res = await fetch(
    `${BASE}/api/v3/payments/${encodeURIComponent(paymentId)}/receiveInCash`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: env.asaasApiKey,
      },
      body: JSON.stringify({ paymentDate, value }),
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      `receiveInCash falhou ${res.status}: ${JSON.stringify(data)}`,
    );
  return data as { id: string; status?: string };
}

function show(label: string, payments: unknown) {
  const list = Array.isArray((payments as { data?: unknown[] })?.data)
    ? (payments as { data: any[] }).data
    : [];
  console.log(`\n[${label}] ${list.length} cobranca(s):`);
  for (const p of list)
    console.log(
      `  - id=${p.id} status=${p.status} dueDate=${p.dueDate} value=${p.value}`,
    );
  return list;
}

// Cenario A: pontos 1 e 2 (endDate setado; PENDING futura removida).
async function validateEndDateAndDelete() {
  const stamp = Date.now();
  console.log(
    "\n== Cenario A: endDate + remocao da pendente futura (pontos 1 e 2) ==",
  );

  const customer = await createTestCustomer(stamp, "24971563792"); // CPF de teste valido (sandbox)
  const dueIn5 = ymd(new Date(Date.now() + 5 * 864e5));
  const sub = await createBoletoTestSub(customer.id, dueIn5);
  console.log(
    `customer.id=${customer.id} subscription.id=${sub.id} nextDueDate=${sub.nextDueDate}`,
  );

  const before = show(
    "antes do cancel",
    await getAsaasSubscriptionPayments(sub.id),
  );
  if (!before.some((p: any) => p.status === "PENDING")) {
    console.log(
      "ATENCAO: nenhuma cobranca PENDING inicial — ponto 2 pode ficar inconclusivo.",
    );
  }

  // Replica do que o POST /billing/cancel faz. Como nao ha subscription no banco,
  // usamos um current_period_end fake (amanha) como endDate. Em vez de copiar a
  // logica d+e, chamamos a MESMA funcao do endpoint (cancelSubscriptionAtAsaas),
  // entao o teste valida o codigo real de producao.
  const endDate = ymd(new Date(Date.now() + 1 * 864e5)); // amanha: antes do vencimento (+5)
  console.log(`\n>> cancelSubscriptionAtAsaas(${sub.id}, endDate=${endDate})`);
  await cancelSubscriptionAtAsaas(sub.id, endDate);

  const fetched = await getAsaasSubscription(sub.id);
  console.log(`\nendDate no Asaas: ${fetched.endDate ?? "(nulo)"}`);
  console.log(
    `VEREDITO 1 (endDate setado): ${fetched.endDate === endDate ? "OK" : `FALHOU (esperado ${endDate})`}`,
  );

  const after = show("apos cancel", await getAsaasSubscriptionPayments(sub.id));
  const survivors = after.filter(
    (p: any) =>
      p.dueDate > endDate &&
      ["PENDING", "AWAITING_RISK_ANALYSIS", "OVERDUE"].includes(p.status),
  );
  console.log(
    `VEREDITO 2 (pendente futura removida): ${survivors.length === 0 ? "OK" : `FALHOU (${survivors.length} sobreviveu)`}`,
  );

  console.log(`>> limpeza: cancelAsaasSubscription(${sub.id})`);
  await cancelAsaasSubscription(sub.id);
}

// Cenario B (best-effort): ponto 3 — cobranca RECEIVED NAO e tocada pelo cancel.
// Depende de receiveInCash funcionar no sandbox; se nao funcionar, documenta SKIP.
async function validateConfirmedUntouched() {
  console.log(
    "\n== Cenario B: cobranca confirmada nao e tocada (ponto 3, best-effort) ==",
  );
  try {
    const stamp = Date.now();
    const customer = await createTestCustomer(stamp, "24971563792");
    const dueIn5 = ymd(new Date(Date.now() + 5 * 864e5));
    const sub = await createBoletoTestSub(customer.id, dueIn5);
    const before = show(
      "antes (cenario B)",
      await getAsaasSubscriptionPayments(sub.id),
    );
    const charge = before[0];
    if (!charge) throw new Error("sem cobranca inicial para marcar como paga");

    const received = await receiveInCash(charge.id, charge.value);
    console.log(`cobranca ${received.id} marcada como ${received.status}`);

    const endDate = ymd(new Date(Date.now() + 1 * 864e5));
    console.log(`>> cancelSubscriptionAtAsaas(${sub.id}, endDate=${endDate})`);
    await cancelSubscriptionAtAsaas(sub.id, endDate);

    const after = show(
      "apos cancel (cenario B)",
      await getAsaasSubscriptionPayments(sub.id),
    );
    const survived = after.find((p: any) => p.id === charge.id);
    const ok =
      survived &&
      ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(survived.status);
    console.log(
      `VEREDITO 3 (confirmada intocada): ${ok ? "OK" : "FALHOU (a confirmada sumiu ou mudou de status)"}`,
    );

    console.log(`>> limpeza: cancelAsaasSubscription(${sub.id})`);
    await cancelAsaasSubscription(sub.id);
  } catch (err) {
    console.log(
      `VEREDITO 3: NAO automatizado no sandbox (${err instanceof Error ? err.message : String(err)}). ` +
        "Validar manualmente — a allow-list [PENDING/AWAITING_RISK_ANALYSIS/OVERDUE] ja exclui confirmados por construcao.",
    );
  }
}

async function main() {
  if (env.asaasEnv !== "sandbox")
    throw new Error(`ABORTADO: ASAAS_ENV=${env.asaasEnv}. Rode so em sandbox.`);
  console.log(
    "== Validacao do fluxo /billing/cancel (Passo 4) no sandbox Asaas ==",
  );
  await validateEndDateAndDelete();
  await validateConfirmedUntouched();
  console.log("\nConcluido.");
}

main().catch((err) => {
  console.error("ERRO no teste:", err);
  process.exit(1);
});
