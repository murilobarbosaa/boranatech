// BACKFILL DO LEDGER DO ASAAS, como SQL IMPRESSO. Este script NUNCA escreve.
//
// O QUE ELE FECHA. `finance_transactions` so passou a receber linha do Asaas em
// 2026-09-02; o Pix entrou em producao em 01/09. Os pagamentos entre as duas
// datas existem em `billing_events` (o webhook sempre gravou o event inteiro em
// `raw`) e nao existem no ledger, entao a receita deles nao aparece em lugar
// nenhum do painel. O mesmo vale, para sempre, para o pagamento cujo
// `registrarNoLedger` falhou depois de a ativacao ter dado certo: aquele caminho
// captura no Sentry e SEGUE, de proposito, e e este script que o recupera.
//
// POR QUE IMPRIMIR SQL EM VEZ DE ESCREVER. Escrever daqui exigiria confiar num
// script de uso unico com a service role numa operacao que cria linhas de
// RECEITA. Imprimir permite ler cada INSERT antes, colar no SQL Editor e ver o
// numero de linhas afetadas, que e a mesma disciplina das migrations deste
// projeto. Nao existe flag `--apply`, e a ausencia dela e a garantia.
//
// A REEXECUCAO E SEGURA por construcao, nao por cuidado: todo INSERT sai com
// `on conflict (provider, provider_transaction_id) do nothing`, sobre o indice
// unico da migration 20260902120000. Rodar o SQL duas vezes afeta zero linhas na
// segunda.
//
// AS REGRAS SAO AS MESMAS DO WEBHOOK, importadas, nunca copiadas:
// `montarCobrancaAsaas`, `montarEstornoAsaas` e `resolverAssinaturaDoAsaas`. Uma
// segunda montagem da conversao de valor, do fuso ou da resolucao de dono
// divergiria da producao no primeiro caso real, e o resultado seria dinheiro
// atribuido a pessoa errada com aparencia de conferido. O que este script tem de
// proprio e so a LEITURA (por REST, ver abaixo), nunca a decisao.
//
// Uso:
//   pnpm tsx scripts/asaasLedgerBackfill.mts
// Saida: SQL em stdout, diagnostico em stderr. exit 1 so em falha de leitura.

import {
  montarCobrancaAsaas,
  montarEstornoAsaas,
  type LinhaLedger,
} from "../server/lib/asaasLedger";
import {
  resolverAssinaturaDoAsaas,
  type AssinaturaDoAsaas,
} from "../server/lib/asaasSubscriptionLookup";

/**
 * PostgREST direto por fetch, no mesmo padrao de scripts/aiUsageReport.mts,
 * scripts/checkMigrationsApplied.mts e scripts/smokeRoadmapIA.mts: o
 * supabase-js NAO importa limpo em `.mts` (o pacote nao expoe `createClient`
 * como named export em ESM).
 *
 * E por isso que este script importa `montarCobrancaAsaas` de `asaasLedger.ts`
 * (puro) e nao de `asaasLedgerWriter.ts`, e a decisao de dono de
 * `asaasSubscriptionLookup.ts` (pura) em vez de `findSubscriptionRow`: os tres
 * arquivos foram separados exatamente para isto, sem duplicar regra nenhuma.
 */
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "[backfill] ABORTADO SEM LER NADA: faltam VITE_SUPABASE_URL e/ou " +
      "SUPABASE_SERVICE_ROLE_KEY. Zero INSERTs aqui NAO significa que o " +
      "backfill e desnecessario.",
  );
  process.exit(78);
}

async function rest<T>(caminho: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${caminho}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} em ${caminho}`);
  }
  return (await res.json()) as T;
}

/** Recorte do event do Asaas que o backfill le. */
type AsaasEvent = {
  dateCreated?: unknown;
  payment?: {
    id?: unknown;
    value?: unknown;
    netValue?: unknown;
    externalReference?: unknown;
  } | null;
};

const LEITURA_REST = {
  async porCobranca(chargeId: string): Promise<AssinaturaDoAsaas | null> {
    const linhas = await rest<AssinaturaDoAsaas[]>(
      `subscriptions?provider_subscription_id=eq.${encodeURIComponent(chargeId)}` +
        "&select=id,user_id,status,plan_id,affiliate_code,coupon_code&limit=1",
    );
    return linhas[0] ?? null;
  },
  async porId(rowId: string): Promise<AssinaturaDoAsaas | null> {
    const linhas = await rest<AssinaturaDoAsaas[]>(
      `subscriptions?id=eq.${encodeURIComponent(rowId)}` +
        "&select=id,user_id,status,plan_id,affiliate_code,coupon_code&limit=1",
    );
    return linhas[0] ?? null;
  },
};

/**
 * Eventos que produzem linha de ledger.
 *
 * ESPELHA `PAYMENT_EVENTS` e `REFUND_EVENTS` de server/providers/asaas.ts, e o
 * espelho e a fraqueza conhecida deste script: se um tipo novo entrar la e nao
 * aqui, o backfill deixa de alcanca-lo em silencio. Nao importei os conjuntos
 * porque eles nao sao exportados e exporta-los so por causa disto ampliaria a
 * superficie publica do provider; a contramedida e o aborto por tipo nao
 * classificado logo abaixo.
 */
const COBRANCA = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);
const ESTORNO = new Set(["PAYMENT_REFUNDED"]);

/**
 * Tipos que sao lidos e DELIBERADAMENTE nao viram linha.
 *
 * A lista existe para o aborto abaixo poder distinguir "nao produz linha" de
 * "ninguem classificou". Sem ela, um tipo novo passaria como se fosse esperado.
 */
const SEM_LINHA = new Set([
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  // Estorno PARCIAL: o webhook tambem nao trata, e pelo mesmo motivo. O `value`
  // do payload e o valor original, nao o devolvido, entao gerar linha aqui
  // registraria um estorno integral sobre uma devolucao de parte.
  "PAYMENT_PARTIALLY_REFUNDED",
]);

type LinhaDeEvento = {
  id: string;
  event_type: string | null;
  received_at: string | null;
  raw: unknown;
};

/** Id do event SEM o prefixo `asaas:` que `eventKey` acrescenta. */
function idSemPrefixo(id: string): string {
  return id.startsWith("asaas:") ? id.slice("asaas:".length) : id;
}

/** Literal SQL de texto, com aspas simples escapadas. `null` vira NULL. */
function sqlTexto(v: string | null): string {
  if (v === null) return "NULL";
  return `'${v.replace(/'/g, "''")}'`;
}

/** Literal SQL de jsonb. */
function sqlJson(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  return `${sqlTexto(JSON.stringify(v))}::jsonb`;
}

const COLUNAS = [
  "provider",
  "provider_transaction_id",
  "stripe_balance_transaction_id",
  "stripe_charge_id",
  "stripe_invoice_id",
  "type",
  "gross_cents",
  "fee_cents",
  "net_cents",
  "currency",
  "occurred_at",
  "user_id",
  "plan_code",
  "raw_payload",
] as const;

function insertDe(linha: LinhaLedger): string {
  const valores = [
    sqlTexto(linha.provider),
    sqlTexto(linha.provider_transaction_id),
    "NULL",
    "NULL",
    "NULL",
    sqlTexto(linha.type),
    String(linha.gross_cents),
    String(linha.fee_cents),
    String(linha.net_cents),
    sqlTexto(linha.currency),
    `${sqlTexto(linha.occurred_at)}::timestamptz`,
    linha.user_id === null ? "NULL" : `${sqlTexto(linha.user_id)}::uuid`,
    sqlTexto(linha.plan_code),
    sqlJson(linha.raw_payload),
  ];
  return (
    `insert into public.finance_transactions (${COLUNAS.join(", ")})\n` +
    `values (${valores.join(", ")})\n` +
    `on conflict (provider, provider_transaction_id) do nothing;`
  );
}

const planCodeCache = new Map<string, string | null>();

async function planCodeDe(planId: string | null): Promise<string | null> {
  if (!planId) return null;
  const emCache = planCodeCache.get(planId);
  if (emCache !== undefined) return emCache;
  const linhas = await rest<Array<{ code: string | null }>>(
    `plans?id=eq.${encodeURIComponent(planId)}&select=code&limit=1`,
  );
  const code = linhas[0]?.code ?? null;
  planCodeCache.set(planId, code);
  return code;
}

async function main(): Promise<void> {
  let linhas: LinhaDeEvento[];
  try {
    linhas = await rest<LinhaDeEvento[]>(
      "billing_events?provider=eq.asaas" +
        "&select=id,event_type,received_at,raw&order=received_at.asc",
    );
  } catch (err) {
    // FAIL-LOUD: leitura que falha nao pode sair como "nada a fazer". Zero
    // INSERTs impressos por erro de rede seria indistinguivel de um backfill
    // desnecessario, e alguem concluiria que esta tudo em dia.
    console.error(
      `[backfill] leitura de billing_events falhou: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
    return;
  }
  console.error(`[backfill] ${linhas.length} event(s) do Asaas lidos.`);

  const inserts: string[] = [];
  let semLinha = 0;
  let semDono = 0;
  const falhas: string[] = [];

  for (const linha of linhas) {
    const tipo = linha.event_type ?? "";
    if (SEM_LINHA.has(tipo)) {
      semLinha += 1;
      continue;
    }
    if (!COBRANCA.has(tipo) && !ESTORNO.has(tipo)) {
      // ABORTO POR ITEM NAO CLASSIFICADO, no molde do
      // scripts/mutateLinkedinThresholds.mjs. Um tipo novo em producao que este
      // script nao conhece derruba a execucao em vez de sair da conta calado:
      // sair calado e como um backfill deixa dinheiro para tras.
      console.error(
        `[backfill] ABORTADO: event_type "${tipo}" (event ${linha.id}) nao esta ` +
          `em COBRANCA, ESTORNO nem SEM_LINHA. Classifique antes de rodar.`,
      );
      process.exit(1);
    }

    const evento = linha.raw as AsaasEvent | null;
    if (!evento) {
      falhas.push(`${linha.id}: raw vazio`);
      continue;
    }

    const chargeId =
      typeof evento.payment?.id === "string" ? evento.payment.id : null;
    const rowId =
      typeof evento.payment?.externalReference === "string"
        ? evento.payment.externalReference
        : null;

    // MESMO RESOLVER DO WEBHOOK. Sem row, a linha entra SEM dono em vez de nao
    // entrar: dinheiro que se movimentou precisa aparecer no caixa mesmo quando
    // nao se sabe de quem era, e o detector de cobranca sem dono existe para
    // essa fila.
    const row = await resolverAssinaturaDoAsaas(chargeId, rowId, LEITURA_REST);
    if (!row) semDono += 1;

    const entrada = {
      event: evento,
      eventId: idSemPrefixo(linha.id),
      // `received_at` do banco, nunca `new Date()`: um backfill rodando meses
      // depois carimbaria a receita no mes da execucao se o fallback fosse o
      // relogio, e o numero mudaria de mes sem ninguem tocar em nada.
      receivedAtIso: linha.received_at ?? new Date(0).toISOString(),
      userId: row?.user_id ?? null,
      planCode: await planCodeDe(row?.plan_id ?? null),
    };

    try {
      const ledger = COBRANCA.has(tipo)
        ? montarCobrancaAsaas(entrada)
        : montarEstornoAsaas(entrada);
      inserts.push(insertDe(ledger));
    } catch (err) {
      // Uma linha impossivel de montar (sem `value`, sem id) NAO derruba as
      // outras, e tambem nao some: entra no resumo de falhas do stderr.
      falhas.push(
        `${linha.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  console.error(
    `[backfill] ${inserts.length} INSERT(s); ${semLinha} event(s) sem linha por tipo; ` +
      `${semDono} sem row de assinatura; ${falhas.length} falha(s).`,
  );
  for (const f of falhas) console.error(`[backfill] FALHA ${f}`);

  if (inserts.length === 0) {
    console.error("[backfill] nada a inserir.");
    return;
  }

  console.log("-- Backfill do ledger do Asaas a partir de billing_events.");
  console.log("-- Reexecutavel: on conflict do nothing sobre o indice unico.");
  console.log("begin;");
  for (const i of inserts) console.log(`${i}\n`);
  console.log("commit;");
}

await main();
