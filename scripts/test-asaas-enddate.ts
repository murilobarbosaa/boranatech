// scripts/test-asaas-enddate.ts
// Validacao sandbox do Passo 1 (abordagem C + salvaguarda s1).
// Roda SOMENTE contra o sandbox do Asaas. NAO usar em producao.
// Executar (Node 22):
//   node --env-file=.env --import tsx scripts/test-asaas-enddate.ts
//
// PENDENCIA: getOrCreateAsaasCustomer aceita cpfCnpj? mas nunca envia ao Asaas;
// e profiles nao coleta cpf_cnpj. Tratar quando oferecer PIX/Boleto.

import {
  getAsaasSubscriptionPayments,
  updateAsaasSubscription,
  deleteAsaasPayment,
  cancelAsaasSubscription,
} from "../server/lib/asaas";
import { env } from "../server/lib/env";

const BASE = env.asaasEnv === "production" ? "https://api.asaas.com" : "https://sandbox.asaas.com";

function ymd(date: Date) {
  return date.toISOString().split("T")[0];
}

// Cria o customer direto via fetch, incluindo cpfCnpj. NAO reusamos
// getOrCreateAsaasCustomer de proposito: hoje aquela funcao aceita cpfCnpj? na
// assinatura mas NUNCA envia o campo ao Asaas (comportamento documentado como
// PENDENCIA no topo). Como BOLETO exige CPF/CNPJ ja na criacao da cobranca, o
// teste precisa de um customer com CPF. Religar o parametro seria mexer no fluxo
// de producao em codigo compartilhado — decisao de produto, fora do escopo
// deste teste de endDate.
async function createTestCustomer(stamp: number, cpfCnpj: string) {
  const res = await fetch(`${BASE}/api/v3/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: env.asaasApiKey },
    body: JSON.stringify({
      name: "Teste endDate",
      email: `enddate-test+${stamp}@boranatech.com.br`,
      externalReference: `test-${stamp}`,
      cpfCnpj,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`create customer falhou ${res.status}: ${JSON.stringify(data)}`);
  return data as { id: string };
}

// Cria sub de teste com BOLETO (cobranca PENDING garantida, sem cartao).
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
      description: "Teste endDate (s1) - pode apagar",
      externalReference: "enddate-test",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`create sub falhou ${res.status}: ${JSON.stringify(data)}`);
  return data as { id: string; nextDueDate?: string; cycle?: string };
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
  console.log("== Validacao endDate + s1 no sandbox Asaas ==");

  const customer = await createTestCustomer(stamp, "24971563792"); // CPF de teste valido (sandbox)
  console.log(`customer.id=${customer.id}`);

  const dueIn5 = ymd(new Date(Date.now() + 5 * 864e5));
  const sub = await createBoletoTestSub(customer.id, dueIn5);
  console.log(`subscription.id=${sub.id} nextDueDate=${sub.nextDueDate}`);

  show("antes do endDate", await getAsaasSubscriptionPayments(sub.id));

  const endDate = ymd(new Date(Date.now() + 1 * 864e5)); // amanha: antes do vencimento (+5)
  console.log(`\n>> updateAsaasSubscription(endDate=${endDate})`);
  await updateAsaasSubscription(sub.id, { endDate });

  const afterEndDate = show("apos endDate", await getAsaasSubscriptionPayments(sub.id));
  const survivors = afterEndDate.filter(
    (p: any) => p.dueDate > endDate && ["PENDING", "AWAITING_RISK_ANALYSIS", "OVERDUE"].includes(p.status),
  );
  console.log(`\nPendentes com vencimento > endDate (alvo da s1): ${survivors.length}`);
  console.log(
    survivors.length === 0
      ? ">> endDate JA limpou a cobranca futura: s1 talvez desnecessaria."
      : ">> cobranca futura sobreviveu: s1 (DELETE) e necessaria.",
  );

  for (const p of survivors) {
    console.log(`>> deleteAsaasPayment(${p.id})`);
    console.log(`   resposta: ${JSON.stringify(await deleteAsaasPayment(p.id))}`);
  }

  const afterDelete = show("apos neutralizar", await getAsaasSubscriptionPayments(sub.id));
  const stillThere = afterDelete.filter((p: any) => survivors.some((s: any) => s.id === p.id));
  console.log(`\nVEREDITO s1: ${stillThere.length === 0 ? "OK, cobranca futura neutralizada" : "FALHOU, ainda presente"}`);

  console.log(`\n>> limpeza: cancelAsaasSubscription(${sub.id})`);
  await cancelAsaasSubscription(sub.id);
  console.log("Concluido.");
}

main().catch((err) => {
  console.error("ERRO no teste:", err);
  process.exit(1);
});
