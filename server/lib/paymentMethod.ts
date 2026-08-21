/**
 * Meio de pagamento de uma assinatura.
 *
 * CANONICIDADE, decidida aqui e registrada de propósito:
 *
 *   `payment_method` e o campo SEMANTICO, o que responde "por qual meio esta
 *   pessoa pagou". `renewal_type` e DERIVADO dele: boleto nao renova sozinho,
 *   logo e 'manual'; cartao renova, logo e 'auto'.
 *
 * Hoje os dois concordam em 100% da base (medido em 2026-07-30: 0 divergencias
 * em 59 linhas), mas concordam por CONSTRUCAO, nao por garantia: o mesmo insert
 * de boleto grava os dois juntos (server/providers/stripe.ts). E a concordancia
 * e assimetrica, o que e o motivo de `payment_method` ser o canonico e nao o
 * contrario: `renewal_type` e `NOT NULL DEFAULT 'auto'` (migration
 * 20260714160000), entao toda linha nova AFIRMA cartao mesmo que ninguem tenha
 * verificado nada. `payment_method` e nullable, entao ele consegue dizer "nao
 * sei", que era a verdade das 54 linhas antigas.
 *
 * O codigo ainda decide "isto e boleto?" nos DOIS campos, em 10 sitios:
 * `payment_method='boleto'` em billing.ts, cron.ts (expire-pending-boletos) e
 * stripe.ts (guard 409); `renewal_type='manual'` em admin.ts (cancelamento),
 * billing.ts, cron.ts (lembrete e reconciliacao) e stripe.ts (cancel/reactivate).
 * Unificar isso e fatia propria, FORA do escopo desta. Ela comecaria pelos
 * sitios de LEITURA que decidem comportamento de cobranca, que sao os de
 * stripe.ts e billing.ts, porque sao os que movem dinheiro; os de cron e admin
 * podem seguir depois.
 *
 * NADA AQUI DEDUZ. "Nao e boleto, logo e cartao" seria uma inferencia sobre
 * dado que nao temos, e um valor inferido fica indistinguivel de um medido no
 * dia seguinte. Ou a Stripe declara o meio, ou o campo fica nulo.
 */

/**
 * Os tres valores que o CHECK de `subscriptions.payment_method` aceita
 * (migration 20260714160000). A guarda mora AQUI DENTRO, nao no chamador: a
 * Stripe tem dezenas de tipos de meio de pagamento (link, customer_balance,
 * us_bank_account, konbini...), e gravar um deles derrubaria a escrita da
 * assinatura INTEIRA, por causa de um campo que e informativo. Guarda no
 * chamador precisaria ser repetida em cada chamador e sumiria no primeiro que
 * alguem esquecesse.
 */
export const MEIOS_DE_PAGAMENTO_PERMITIDOS: ReadonlySet<string> = new Set([
  "card",
  "pix",
  "boleto",
]);

type FonteDeMeio = {
  /** `payment_method_types` de uma Checkout Session. */
  payment_method_types?: unknown;
  /** `payment_settings.payment_method_types` de uma Subscription. */
  payment_settings?: { payment_method_types?: unknown } | null;
} | null | undefined;

function meioDeLista(lista: unknown): string | null {
  if (!Array.isArray(lista)) return null;
  // MAIS DE UM meio e ambiguo de propósito: a lista diz o que foi OFERECIDO, e
  // nao o que foi USADO. Pegar o primeiro seria a deducao que este arquivo
  // existe para evitar.
  if (lista.length !== 1) return null;
  const meio = lista[0];
  if (typeof meio !== "string") return null;
  return MEIOS_DE_PAGAMENTO_PERMITIDOS.has(meio) ? meio : null;
}

/**
 * Le o meio declarado, ou null.
 *
 * Aceita tanto uma Checkout Session quanto uma Subscription: a sessao vem
 * primeiro porque descreve a cobranca do evento que estamos gravando, enquanto
 * payment_settings descreve a configuracao da assinatura.
 */
export function resolvePaymentMethod(fonte: FonteDeMeio): string | null {
  if (!fonte || typeof fonte !== "object") return null;
  return (
    meioDeLista(fonte.payment_method_types) ??
    meioDeLista(fonte.payment_settings?.payment_method_types)
  );
}

/**
 * Fragmento de patch para o upsert de `subscriptions`.
 *
 * Devolve `{}` quando o meio nao foi resolvido, e nao `{ payment_method: null }`.
 * A diferenca importa: um UPDATE com a chave presente e nula APAGARIA o valor
 * que um evento anterior tinha resolvido. `invoice.paid` e
 * `customer.subscription.updated` nem sempre carregam a declaracao do meio, e
 * eles chegam DEPOIS do `checkout.session.completed`, que carrega. Atualizacao
 * nao pode desfazer o que a criacao sabia.
 */
export function patchDeMeioDePagamento(
  fonte: Parameters<typeof resolvePaymentMethod>[0],
): { payment_method?: string } {
  const meio = resolvePaymentMethod(fonte);
  return meio ? { payment_method: meio } : {};
}
