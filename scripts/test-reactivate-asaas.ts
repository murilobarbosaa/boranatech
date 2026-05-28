// scripts/test-reactivate-asaas.ts
// Validacao sandbox do Passo 5a: prova empirica de que PUT { endDate: null }
// LIMPA um endDate previamente setado no Asaas (premissa do reactivate).
// Roda SOMENTE contra o sandbox do Asaas. NAO usar em producao.
// Executar (Node 22):
//   node --env-file=.env --import tsx scripts/test-reactivate-asaas.ts
//
// PENDENCIA: getOrCreateAsaasCustomer aceita cpfCnpj? mas nunca envia ao Asaas;
// e profiles nao coleta cpf_cnpj. Tratar quando oferecer PIX/Boleto.

import { cancelAsaasSubscription, getAsaasSubscriptionPayments, updateAsaasSubscription } from "../server/lib/asaas";
import { reactivateSubscriptionAtAsaas } from "../server/lib/billing-asaas";
import { env } from "../server/lib/env";

const BASE = env.asaasEnv === "production" ? "https://api.asaas.com" : "https://sandbox.asaas.com";

function ymd(date: Date) {
  return date.toISOString().split("T")[0];
}

// Helpers locais (duplicados de test-asaas-enddate.ts/test-cancel-flow.ts de
// proposito: mantem cada script auto-contido, independente para rodar/apagar,
// e sem acoplamento entre testes. Boilerplate estavel do sandbox.
async function createTestCustomer(stamp: number, cpfCnpj: string) {
  const res = await fetch(`${BASE}/api/v3/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: env.asaasApiKey },
    body: JSON.stringify({
      name: "Teste reactivate",
      email: `reactivate-test+${stamp}@boranatech.com.br`,
      externalReference: `reactivate-test-${stamp}`,
      cpfCnpj,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`create customer falhou ${res.status}: ${JSON.stringify(data)}`);
  return data as { id: string };
}

async function createBoletoTestSub(customerId: string, nextDueDate: string) {
  const res = await fetch(`${BASE}/api/v3/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: env.asaasApiKey },
    body: JSON.stringify({
      customer: customerId,
      billingType: "BOLETO",
      value: 24.9,
      nextDueDate,
      cycle: "MONTHLY",
      description: "Teste reactivate (Passo 5a) - pode apagar",
      externalReference: "reactivate-test",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`create sub falhou ${res.status}: ${JSON.stringify(data)}`);
  return data as { id: string; nextDueDate?: string };
}

// GET /v3/subscriptions/{id}: le o objeto completo para inspecionar endDate literal.
async function getAsaasSubscription(id: string) {
  const res = await fetch(`${BASE}/api/v3/subscriptions/${encodeURIComponent(id)}`, {
    headers: { access_token: env.asaasApiKey },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`get sub falhou ${res.status}: ${JSON.stringify(data)}`);
  return data as Record<string, unknown>;
}

function show(label: string, payments: unknown) {
  const list = Array.isArray((payments as { data?: unknown[] })?.data) ? (payments as { data: any[] }).data : [];
  console.log(`\n[${label}] ${list.length} cobranca(s):`);
  for (const p of list) console.log(`  - id=${p.id} status=${p.status} dueDate=${p.dueDate} value=${p.value}`);
  return list;
}

async function main() {
  if (env.asaasEnv !== "sandbox") throw new Error(`ABORTADO: ASAAS_ENV=${env.asaasEnv}. Rode so em sandbox.`);

  const stamp = Date.now();
  console.log("== Validacao do reactivate (Passo 5a) no sandbox Asaas ==");

  const customer = await createTestCustomer(stamp, "24971563792"); // CPF de teste valido (sandbox)
  const dueIn5 = ymd(new Date(Date.now() + 5 * 864e5));
  const sub = await createBoletoTestSub(customer.id, dueIn5);
  console.log(`customer.id=${customer.id} subscription.id=${sub.id} nextDueDate=${sub.nextDueDate}`);

  show("cobrancas iniciais", await getAsaasSubscriptionPayments(sub.id));

  // 1. Setar endDate (cancel parcial — so o PUT, sem DELETE; isolamos a variavel).
  const endDate = ymd(new Date(Date.now() + 1 * 864e5)); // amanha (antes do vencimento +5)
  console.log(`\n>> updateAsaasSubscription(endDate=${endDate})`);
  await updateAsaasSubscription(sub.id, { endDate });

  const afterCancel = await getAsaasSubscription(sub.id);
  console.log(`endDate apos cancel parcial (literal): ${JSON.stringify(afterCancel.endDate)} (esperado: "${endDate}")`);
  if (afterCancel.endDate !== endDate) {
    console.log("ATENCAO: endDate nao bate com o esperado — premissa do passo 4 nao se sustenta neste run.");
  }

  // 2. Chamar o helper de reativacao (a funcao real que o endpoint usaria).
  console.log(`\n>> reactivateSubscriptionAtAsaas(${sub.id})`);
  await reactivateSubscriptionAtAsaas(sub.id);

  // 3. Inspecionar o endDate literal que o Asaas devolve.
  const afterReactivate = await getAsaasSubscription(sub.id);
  const endDateAfter = afterReactivate.endDate;
  console.log(`endDate apos reactivate (literal): ${JSON.stringify(endDateAfter)}`);
  console.log(`tipo: ${endDateAfter === null ? "null" : typeof endDateAfter}`);
  console.log(`status apos reactivate: ${JSON.stringify(afterReactivate.status)}`);

  // VEREDITO: endDate: null limpa?
  const cleared = endDateAfter === null || endDateAfter === undefined || endDateAfter === "";
  console.log(
    `\nVEREDITO (endDate: null limpa o campo): ${
      cleared ? "OK" : `FALHOU — endDate ficou em ${JSON.stringify(endDateAfter)}`
    }`,
  );

  // limpeza
  console.log(`\n>> limpeza: cancelAsaasSubscription(${sub.id})`);
  await cancelAsaasSubscription(sub.id);
  console.log("Concluido.");
}

main().catch((err) => {
  console.error("ERRO no teste:", err);
  process.exit(1);
});
