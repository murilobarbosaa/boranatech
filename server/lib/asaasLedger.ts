import { instanteAsaas } from "../../shared/asaasDatetime";
import { createError } from "../middleware/error";

/**
 * LEDGER DO ASAAS: a cobranca Pix e o estorno viram linha de
 * `finance_transactions`, a mesma tabela em que o sync da Stripe escreve.
 *
 * POR QUE FORA DE `stripeSync.ts`, e nao mais uma funcao la dentro. O
 * `syncBalanceTransactions` comeca por `assertKeyMatchesDatabase()`, que aborta
 * quando a `STRIPE_SECRET_KEY` nao e `sk_live_` com banco de producao, e tem uma
 * segunda guarda por linha contra `source.livemode === false`. As duas existem
 * por um incidente real de 2026-07 e devem continuar governando a Stripe. Se a
 * ingestao do Pix passasse por la, as guardas de ambiente de UM provedor
 * decidiriam se o dinheiro do OUTRO entra, o que erra nos dois sentidos: chave
 * de teste da Stripe bloquearia receita real de Pix, e ninguem entenderia por
 * que.
 *
 * FUNCOES PURAS SEPARADAS DA ESCRITA, de proposito, e a separacao virou de
 * ARQUIVO por uma razao concreta alem do teste. A escrita (`registrarNoLedger`,
 * em ./asaasLedgerWriter.ts) importa `supabaseAdmin`, que importa
 * `@supabase/supabase-js`, que NAO expoe `createClient` como named export em
 * ESM. Um script `.mts` que importasse este modulo so para montar a linha
 * carregaria o SDK junto e morreria no import, mesmo sem nunca escrever. O
 * backfill (scripts/asaasLedgerBackfill.mts) e exatamente esse script.
 *
 * Este arquivo NAO importa nada com efeito colateral: so o parser de data e o
 * `createError`, que so depende de tipos do express.
 */

/** Provedor desta linha, no CHECK de `finance_transactions_provider_check`. */
const PROVIDER = "asaas" as const;

/** O Asaas so opera em real. Nao ha caminho multimoeda nesta conta. */
const CURRENCY = "BRL";

/**
 * Valor do Asaas para centavos inteiros.
 *
 * O Asaas manda REAIS, as vezes como number e as vezes como string (`"12.9"` no
 * event real de 2026-09-01). `null` para o que nao e numero finito, e `null` NAO
 * e zero: zero e uma cobranca de valor zero, ausencia e nao saber quanto entrou.
 * Colapsar os dois grava no ledger uma venda indistinguivel de uma cortesia.
 * Mesmo criterio de `paidAmountCentsFromAsaas` em server/providers/asaas.ts.
 *
 * O arredondamento existe porque centavo fracionado nao existe e porque o float
 * do JSON traz `129.99999`. `Math.round` e nao `Math.trunc`: truncar perderia um
 * centavo por linha, sempre para o mesmo lado.
 */
export function centavosAsaas(valor: unknown): number | null {
  if (typeof valor !== "number" && typeof valor !== "string") return null;
  if (typeof valor === "string" && valor.trim() === "") return null;
  const n = Number(valor);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/** Recorte do event do Asaas que o ledger le. */
export type EventoParaLedger = {
  dateCreated?: unknown;
  payment?: {
    id?: unknown;
    value?: unknown;
    netValue?: unknown;
  } | null;
};

/** Linha pronta para `finance_transactions`, no shape das colunas. */
export type LinhaLedger = {
  provider: string;
  provider_transaction_id: string;
  stripe_balance_transaction_id: null;
  stripe_charge_id: null;
  stripe_invoice_id: null;
  type: "charge" | "refund";
  gross_cents: number;
  fee_cents: number;
  net_cents: number;
  currency: string;
  occurred_at: string;
  user_id: string | null;
  plan_code: string | null;
  raw_payload: unknown;
};

export type EntradaDeLedger = {
  event: EventoParaLedger;
  /** Id do event do webhook, SEM o prefixo `asaas:`. */
  eventId: string;
  /** Instante em que o request chegou, ISO. Fallback do `occurred_at`. */
  receivedAtIso: string;
  userId: string | null;
  planCode: string | null;
};

/**
 * `occurred_at` da linha.
 *
 * O CAMPO E `dateCreated` DO EVENT, e a escolha foi medida. Os candidatos
 * obvios (`paymentDate`, `clientPaymentDate`, `confirmedDate`, `creditDate`)
 * vieram TODOS como `"2026-09-01"`, so a data, no unico pagamento real: nenhum
 * deles diz se o dinheiro entrou as 00:05 ou as 23:55, e escolher uma hora
 * produziria um instante plausivel e falso. `dateCreated` do event veio
 * `"2026-09-01 10:11:33"`, com hora, e e o analogo mais proximo do `bt.created`
 * que o lado Stripe usa: o instante em que o provedor reconheceu o movimento.
 *
 * FALLBACK e `received_at`, nunca `new Date()` montado aqui. A diferenca importa
 * no reprocessamento: um backfill rodando em 2026-12 sobre um event de 2026-09
 * carimbaria a receita em dezembro se o fallback fosse o relogio da execucao, e
 * a receita mudaria de mes sem ninguem tocar em nada.
 */
function occurredAtDe(entrada: EntradaDeLedger): string {
  return instanteAsaas(entrada.event.dateCreated) ?? entrada.receivedAtIso;
}

function idDoPagamento(entrada: EntradaDeLedger): string {
  const id = entrada.event.payment?.id;
  if (typeof id !== "string" || id.trim() === "") {
    throw createError(
      500,
      "asaas_ledger_id_ausente",
      "Pagamento do Asaas sem id; a linha do ledger nao tem identidade.",
    );
  }
  return id;
}

/**
 * Cobranca confirmada do Asaas como linha `type='charge'`.
 *
 * LANCA quando falta `value` ou `netValue`. Nao ha valor padrao: uma linha de
 * receita com zero inventado entra no "Receita no periodo" e no "Valor pago" do
 * cliente como se fosse um fato, e ninguem consegue distingui-la depois de uma
 * venda real de valor zero.
 */
export function montarCobrancaAsaas(entrada: EntradaDeLedger): LinhaLedger {
  const providerTransactionId = idDoPagamento(entrada);
  const gross = centavosAsaas(entrada.event.payment?.value);
  const net = centavosAsaas(entrada.event.payment?.netValue);

  if (gross === null || net === null) {
    throw createError(
      500,
      "asaas_ledger_valor_ausente",
      "Pagamento do Asaas sem value ou netValue; nao da para gravar o ledger.",
    );
  }

  return {
    provider: PROVIDER,
    provider_transaction_id: providerTransactionId,
    stripe_balance_transaction_id: null,
    stripe_charge_id: null,
    stripe_invoice_id: null,
    type: "charge",
    gross_cents: gross,
    // A taxa e DERIVADA, nunca lida de um campo proprio: o Asaas manda bruto e
    // liquido, e a subtracao e a unica definicao que nao pode divergir deles.
    fee_cents: gross - net,
    net_cents: net,
    currency: CURRENCY,
    occurred_at: occurredAtDe(entrada),
    user_id: entrada.userId,
    plan_code: entrada.planCode,
    raw_payload: entrada.event.payment ?? null,
  };
}

/**
 * Estorno do Asaas como linha `type='refund'`, com valores NEGATIVOS.
 *
 * O SINAL E A CONVENCAO DA TABELA, declarada na migration 20260714130000 e
 * assumida por todo leitor: `gross_cents` e negativo em `refund` e `dispute`, e
 * e por isso que `totalPagoCents` pode somar tudo com sinal e chegar ao que
 * sobrou. O payload do Asaas traz `value` POSITIVO, entao a negacao acontece
 * aqui, uma vez, e nao em cada leitor.
 *
 * A IDENTIDADE E O ID DO EVENT, nao o do pagamento, e o motivo e estrutural: o
 * `provider_transaction_id` compoe um indice unico, e o id do pagamento JA foi
 * usado pela linha de charge. Reusa-lo faria o upsert do estorno colidir com a
 * propria cobranca e, com `ignoreDuplicates`, o estorno sumiria em silencio. O
 * objeto de refund do Asaas nao tem id estavel garantido no payload do webhook;
 * o event tem, e o event e unico por entrega.
 *
 * `fee_cents` ZERO, e nao a taxa da cobranca com sinal trocado: o Asaas nao
 * devolve a taxa quando o pagamento e estornado. Repetir a taxa aqui negativa
 * afirmaria uma devolucao de taxa que nao aconteceu, e o "taxas" do painel
 * cairia para um valor que a conta do provedor nao mostra.
 */
export function montarEstornoAsaas(entrada: EntradaDeLedger): LinhaLedger {
  // Chamado pelo efeito: um estorno de pagamento sem id e um payload que nao da
  // para conferir contra a cobranca, e nao queremos gravar o que nao amarra.
  idDoPagamento(entrada);
  const valor = centavosAsaas(entrada.event.payment?.value);

  if (valor === null) {
    throw createError(
      500,
      "asaas_ledger_valor_ausente",
      "Estorno do Asaas sem value; nao da para gravar o ledger.",
    );
  }

  return {
    provider: PROVIDER,
    provider_transaction_id: entrada.eventId,
    stripe_balance_transaction_id: null,
    stripe_charge_id: null,
    stripe_invoice_id: null,
    type: "refund",
    gross_cents: -valor,
    fee_cents: 0,
    net_cents: -valor,
    currency: CURRENCY,
    occurred_at: occurredAtDe(entrada),
    user_id: entrada.userId,
    plan_code: entrada.planCode,
    raw_payload: entrada.event.payment ?? null,
  };
}
