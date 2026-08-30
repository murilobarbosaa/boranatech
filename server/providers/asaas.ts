import * as Sentry from "@sentry/node";

import { asaasFetch } from "../lib/asaasClient";
import { env } from "../lib/env";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "../middleware/error";
import {
  applyActivationEffects,
  recordNonRenewalIntent,
  revertNonRenewalIntent,
} from "./shared";
import { getPlanChargeValue, PLAN_PRICING } from "../../shared/planPricing";
import type { PlanId } from "../../shared/planPricing";
import type {
  CancelInput,
  CancelResult,
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
  ReactivateInput,
  ReactivateResult,
  WebhookInput,
  WebhookResult,
} from "./types";

/**
 * Provedor Asaas: PIX AVULSO, e so isso.
 *
 * Pix Automatico (a assinatura recorrente por Pix) NAO esta habilitado na conta,
 * entao nao existe objeto de assinatura remota aqui. Cada compra e uma cobranca
 * unica que concede um periodo de acesso, exatamente como o boleto da Stripe: a
 * linha nasce `pending`, o webhook confirma, a RPC ativa, o periodo vence e a
 * pessoa compra de novo. Ler o fluxo do boleto em server/providers/stripe.ts
 * responde quase toda pergunta sobre este arquivo.
 */

/**
 * Planos que aceitam Pix, e quantos dias de acesso cada um concede.
 *
 * ESCRITO POR INCLUSAO, e isso e a defesa: o mapa lista quem PODE. Um `PlanId`
 * novo nasce fora dele e e recusado por omissao, em vez de liberado por omissao.
 * E o mesmo desenho de `BOLETO_ACCESS_DAYS` (server/providers/stripe.ts), e os
 * dias sao os MESMOS numeros de proposito: o acesso que a pessoa compra nao pode
 * depender do meio de pagamento que ela escolheu.
 */
const PIX_ACCESS_DAYS: Partial<Record<PlanId, number>> = {
  pro_semiannual: 182,
  pro_annual: 365,
};

/**
 * Prazo do Pix, em dias. Curto de proposito: um Pix e instantaneo, o prazo aqui
 * e so a validade do QR Code. Tres dias (o do boleto) manteria a linha `pending`
 * bloqueando o guard 409 por muito mais tempo do que a pessoa leva para pagar.
 */
const PIX_DUE_DAYS = 2;

/** `provider` como gravado em subscriptions e billing_events. */
const PROVIDER = "asaas" as const;

/**
 * PREFIXO DE NAMESPACE DO EVENTO. Ver a nota longa em `handleWebhook`.
 * `billing_events.id` e PRIMARY KEY GLOBAL, e os dois provedores emitem ids que
 * comecam com `evt_`.
 */
const EVENT_ID_PREFIX = "asaas:";

type AsaasCustomer = { id: string };
type AsaasCustomerBusca = { data?: AsaasCustomer[] };
type AsaasCobranca = {
  id: string;
  invoiceUrl?: string | null;
  status?: string | null;
};

/** Data de vencimento no formato que o Asaas espera (YYYY-MM-DD). */
function vencimentoEmDias(dias: number, agora: Date): string {
  const d = new Date(agora.getTime() + dias * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

/**
 * Customer do Asaas para este usuario, reusando o que existir.
 *
 * A BUSCA VEM ANTES DA CRIACAO porque o Asaas NAO deduplica por
 * `externalReference`: chamar POST /customers duas vezes cria dois customers
 * para a mesma pessoa, e a partir dai o historico de cobrancas dela fica
 * partido em dois, sem erro nenhum para acusar.
 */
async function resolverCustomer(input: {
  userId: string;
  email: string;
}): Promise<string> {
  const busca = await asaasFetch<AsaasCustomerBusca>(
    `/customers?externalReference=${encodeURIComponent(input.userId)}&limit=1`,
  );
  const existente = busca?.data?.[0]?.id;
  if (existente) return existente;

  const criado = await asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: {
      name: input.email || input.userId,
      email: input.email || undefined,
      externalReference: input.userId,
    },
  });
  if (!criado?.id) {
    throw createError(
      502,
      "asaas_customer_sem_id",
      "O provedor de pagamento não devolveu o cliente.",
    );
  }
  return criado.id;
}

/**
 * Checkout de Pix avulso.
 *
 * ORDEM DAS ESCRITAS: LINHA LOCAL PRIMEIRO, COBRANCA REMOTA DEPOIS.
 *
 * Esta ordem e DIFERENTE da do boleto, e a diferenca e deliberada. No boleto a
 * sessao da Stripe nasce primeiro e a linha `pending` so aparece quando o
 * `checkout.session.completed` chega; se aquele evento se perder, existe dinheiro
 * do lado da Stripe sem nenhuma linha local, e foi precisamente por isso que a
 * tabela `billing_orphan_payments` e o cron `detect-orphan-payments` tiveram de
 * ser inventados depois.
 *
 * Aqui a linha existe ANTES de a cobranca ser criada, entao o webhook nunca pode
 * chegar antes dela. O custo dessa escolha e o oposto e mais barato: se a
 * chamada ao Asaas falhar, sobra uma linha `pending` sem cobranca, que nao
 * concede acesso nenhum e e limpa pelo mesmo caminho que expira Pix vencido.
 * Linha orfa sem dinheiro e um registro a limpar; dinheiro orfo sem linha e uma
 * pessoa que pagou e nao recebeu.
 */
async function createCheckout(
  input: CreateCheckoutInput,
): Promise<CreateCheckoutResult> {
  if (!env.asaasEnabled) {
    throw createError(
      503,
      "asaas_disabled",
      "Pagamento por Pix indisponível no momento.",
    );
  }

  const accessDays = PIX_ACCESS_DAYS[input.planId];
  if (!accessDays) {
    // Mesmo contrato de erro do boleto: 400 com slug proprio, para a UI
    // distinguir "plano nao aceita este meio" de qualquer outra recusa.
    throw createError(
      400,
      "pix_not_allowed_on_monthly",
      "Pix não está disponível neste plano.",
    );
  }

  // Guard de assinatura ativa. O indice unico parcial
  // `subscriptions_one_active_per_user` e a rede de seguranca, nao a primeira
  // linha: sem este guard o usuario pagaria e SO ENTAO descobriria, por um 23505
  // no webhook, que ja era assinante. Fail-closed: erro de query BLOQUEIA.
  const { data: ativas, error: guardError } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", input.user.id)
    .in("status", ["active", "trialing"])
    .limit(1);
  if (guardError) {
    console.error(
      "[asaas/checkout] guard de assinatura ativa falhou; bloqueando:",
      guardError,
    );
    throw createError(
      500,
      "db_error",
      "Não foi possível verificar sua assinatura. Tente novamente.",
      { cause: guardError },
    );
  }
  if (ativas && ativas.length > 0) {
    throw createError(409, "conflict", "Usuário já possui assinatura ativa.");
  }

  // Guard de Pix pendente, espelhando o de boleto pendente: enquanto uma
  // cobranca aguarda pagamento, nao gera outra, para nao cobrar duas vezes.
  const { data: pendentes, error: pendenteError } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", input.user.id)
    .eq("payment_method", "pix")
    .eq("status", "pending")
    .limit(1);
  if (pendenteError) {
    console.error(
      "[asaas/checkout] guard de pix pendente falhou; bloqueando:",
      pendenteError,
    );
    throw createError(
      500,
      "db_error",
      "Não foi possível verificar seu Pix pendente. Tente novamente.",
      { cause: pendenteError },
    );
  }
  if (pendentes && pendentes.length > 0) {
    throw createError(
      409,
      "pix_pending",
      "Você tem um Pix aguardando pagamento.",
    );
  }

  const { data: plano } = await supabaseAdmin
    .from("plans")
    .select("id")
    .eq("code", input.planId)
    .maybeSingle();
  if (!plano) throw createError(500, "db_error", "Plano Pro não encontrado.");

  // (1) LINHA LOCAL. `provider_subscription_id` fica NULL ate a cobranca
  // existir: a coluna e UNIQUE, e no Postgres UNIQUE admite varios NULL, entao
  // linhas em voo nao colidem entre si.
  const { data: criada, error: insertError } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      user_id: input.user.id,
      plan_id: plano.id,
      provider: PROVIDER,
      provider_subscription_id: null,
      provider_customer_id: null,
      affiliate_code: input.affiliateCode || null,
      coupon_code: input.couponCode || null,
      status: "pending",
      payment_method: "pix",
      renewal_type: "manual",
      current_period_start: null,
      current_period_end: null,
    })
    .select("id")
    .single();
  if (insertError || !criada) {
    console.error(
      "[asaas/checkout] insert da linha pendente falhou:",
      insertError,
    );
    throw createError(500, "db_error", "Erro ao registrar a cobrança.", {
      cause: insertError,
    });
  }

  // (2) COBRANCA REMOTA. `externalReference` carrega o id da linha local, entao
  // o webhook sabe quem ativar mesmo se algo der errado com o id da cobranca.
  let cobranca: AsaasCobranca;
  try {
    const customerId = await resolverCustomer({
      userId: input.user.id,
      email: input.user.email,
    });

    cobranca = await asaasFetch<AsaasCobranca>("/payments", {
      method: "POST",
      body: {
        customer: customerId,
        billingType: "PIX",
        value: getPlanChargeValue(input.planId),
        dueDate: vencimentoEmDias(PIX_DUE_DAYS, new Date()),
        description: `Bora na Tech Pro ${PLAN_PRICING[input.planId].label}`,
        externalReference: criada.id,
      },
    });

    if (!cobranca?.id) {
      throw createError(
        502,
        "asaas_cobranca_sem_id",
        "O provedor de pagamento não devolveu a cobrança.",
      );
    }

    // (3) Amarra a linha ao objeto remoto. So aqui ela vira localizavel pelo
    // webhook por `provider_subscription_id`.
    const { error: linkError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        provider_subscription_id: cobranca.id,
        provider_customer_id: customerId,
      })
      .eq("id", criada.id);
    if (linkError) {
      // A cobranca EXISTE do lado do Asaas e a linha local nao aponta para ela.
      // Grita: o webhook ainda acha a linha pelo `externalReference`, mas isto e
      // um estado que ninguem deve descobrir por acaso.
      Sentry.captureMessage("asaas_link_cobranca_falhou", {
        level: "error",
        fingerprint: ["asaas-link-cobranca-falhou"],
        tags: { origem: "asaas-checkout" },
        extra: {
          user_id: input.user.id,
          subscription_row_id: criada.id,
          asaas_payment_id: cobranca.id,
          db_message: linkError.message,
        },
      });
      throw createError(500, "db_error", "Erro ao registrar a cobrança.", {
        cause: linkError,
      });
    }
  } catch (err) {
    // A linha local ficou sem cobranca. Marca como cancelada para nao travar o
    // guard 409 de Pix pendente da proxima tentativa. Best-effort de proposito:
    // o erro que importa e o de cima, e o cron de expiracao pega o residuo.
    const { error: limpezaError } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("id", criada.id)
      .eq("status", "pending");
    if (limpezaError) {
      console.error(
        `[asaas/checkout] linha ${criada.id} ficou pendente sem cobranca e a limpeza falhou:`,
        limpezaError,
      );
    }
    throw err;
  }

  return {
    checkoutUrl: cobranca.invoiceUrl ?? undefined,
    subscriptionId: cobranca.id,
  };
}

/**
 * Assinatura Pix do usuario sobre a qual `cancel` e `reactivate` operam.
 *
 * Filtra por `provider = 'asaas'` pelo mesmo motivo que o caminho da Stripe
 * filtra por `'stripe'`: quem tem as duas coisas na vida da conta nao pode ter
 * uma acao de um provedor atingindo a linha do outro.
 */
async function acharAssinaturaPix(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id, provider_subscription_id, current_period_end, status")
    .eq("user_id", userId)
    .eq("provider", PROVIDER)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw createError(500, "db_error", "Erro ao buscar assinatura.", {
      cause: error,
    });
  }
  return data;
}

/** Data por extenso, no formato que as mensagens de billing ja usam. */
function formatarData(iso: string | null): string {
  return iso
    ? new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "o fim do período pago";
}

/**
 * "Cancelar" uma compra por Pix e registrar a intencao de nao renovar.
 *
 * MESMO CONTRATO DO BOLETO, pelo caminho compartilhado: nao ha assinatura remota
 * no Asaas (a compra e avulsa), entao NADA e chamado la; o acesso termina
 * sozinho em `current_period_end`, que e o que `is_user_pro` ja avalia; e
 * `cancel_at_period_end` NAO e setado, porque isso acordaria o bug latente do
 * cron `process-cancellations`.
 *
 * O Lote 2a devolvia `400 pix_sem_recorrencia` aqui. Aquilo era verdade sobre a
 * Asaas e mentira sobre o produto: a pessoa PODE dizer que nao quer renovar, e a
 * intencao dela tem onde ser guardada.
 */
async function cancel(input: CancelInput): Promise<CancelResult> {
  const sub = await acharAssinaturaPix(input.userId);
  if (!sub) {
    throw createError(404, "not_found", "Nenhuma assinatura ativa encontrada.");
  }

  await recordNonRenewalIntent({
    userId: input.userId,
    actorUserId: input.actorUserId,
    providerSubscriptionId: sub.provider_subscription_id,
    reasonCode: input.reasonCode,
    reasonText: input.reasonText,
    effectiveAt: sub.current_period_end,
  });

  return {
    cancel_at_period_end: false,
    effective_at: sub.current_period_end,
    non_renewal: true,
    // TODO(Ana): mensagem de sucesso do "nao renovar" do Pix.
    message: `Anotado: sua assinatura não vai renovar. Você mantém o acesso Pro até ${formatarData(sub.current_period_end)}.`,
  };
}

/**
 * Desfaz o "nao renovar", espelhando o boleto: marca a intencao como 'reverted'
 * e nao toca provedor nenhum. Idempotente (segundo clique nao acha 'scheduled').
 */
async function reactivate(input: ReactivateInput): Promise<ReactivateResult> {
  const sub = await acharAssinaturaPix(input.userId);
  if (!sub) {
    // Mesma saida do caminho de cartao quando nao ha o que reativar: manda para
    // o checkout em vez de erro, porque a acao que resolve e comprar de novo.
    return {
      redirect_to_checkout: true,
      checkout_path: "/planos",
      message:
        "Reativação não disponível para este plano. Vamos para um novo plano.",
    };
  }

  await revertNonRenewalIntent(sub.provider_subscription_id);

  return {
    cancel_at_period_end: false,
    // TODO(Ana): mensagem de sucesso do "voltar atras" do Pix.
    message: `Pronto: o aviso de não renovação foi removido. Seu acesso Pro segue até ${formatarData(sub.current_period_end)} e você pode renovar quando quiser.`,
  };
}

/**
 * `handleWebhook` do contrato `PaymentProvider` NAO e usado pelo Asaas.
 *
 * O contrato foi desenhado para a Stripe, onde a autenticacao e uma assinatura
 * HMAC sobre os BYTES CRUS do corpo, e por isso `WebhookInput` carrega
 * `rawBody`. O Asaas autentica por um token estatico no header
 * `asaas-access-token`, que nao toca o corpo.
 *
 * A rota do Asaas (server/routes/webhooksAsaas.ts) chama `processarEventoAsaas`
 * diretamente. Este metodo existe para satisfazer o tipo e lanca se alguem o
 * chamar por engano, em vez de devolver um sucesso vazio que esconderia a
 * chamada errada.
 */
async function handleWebhook(_input: WebhookInput): Promise<WebhookResult> {
  throw createError(
    500,
    "asaas_webhook_contrato",
    "Webhook do Asaas nao passa por handleWebhook.",
  );
}

export const asaasProvider: PaymentProvider = {
  name: PROVIDER,
  createCheckout,
  cancel,
  reactivate,
  handleWebhook,
};

export { PIX_ACCESS_DAYS, PIX_DUE_DAYS, EVENT_ID_PREFIX, PROVIDER };

// ---------------------------------------------------------------------------
// WEBHOOK
// ---------------------------------------------------------------------------

/** Retorno de `activate_subscription_exclusive` (migration 20260829110000). */
type ExclusiveActivationRow = {
  out_activated: boolean;
  out_superseded_count: number;
  out_user_id: string;
  out_plan_id: string | null;
  out_affiliate_code: string | null;
  out_coupon_code: string | null;
};

/** Recorte do evento do Asaas que este handler usa. */
export type AsaasEvent = {
  id?: unknown;
  event?: unknown;
  dateCreated?: unknown;
  payment?: {
    id?: unknown;
    value?: unknown;
    externalReference?: unknown;
    status?: unknown;
  } | null;
};

export type ResultadoDeWebhook = {
  received: true;
  deduped?: true;
  unhandled?: true;
  activated?: boolean;
};

/** Eventos que confirmam dinheiro recebido. */
const EVENTOS_DE_PAGAMENTO = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);
/** Eventos que encerram a cobranca sem pagamento. */
const EVENTOS_DE_ENCERRAMENTO = new Set(["PAYMENT_OVERDUE", "PAYMENT_DELETED"]);

function texto(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

/**
 * Valor PAGO declarado pelo evento, em centavos, ou `null` quando o evento nao
 * declara valor.
 *
 * `null` NAO e zero, pela mesma razao escrita em `paidAmountCentsFromEvent`
 * (server/providers/stripe.ts): zero e uma cobranca de valor zero; `null` e
 * ausencia de informacao. Colapsar os dois grava no ledger de comissao uma venda
 * indistinguivel de uma venda gratuita legitima.
 *
 * O Asaas manda `value` em REAIS, com centavos decimais. A conversao arredonda
 * porque centavo fracionado nao existe, e o float do JSON pode trazer 129.99999.
 */
export function paidAmountCentsFromAsaas(evento: AsaasEvent): number | null {
  const valor = evento.payment?.value;
  if (typeof valor !== "number" || !Number.isFinite(valor)) return null;
  return Math.round(valor * 100);
}

/**
 * IDEMPOTENCIA, e o motivo do prefixo.
 *
 * `billing_events.id` e `text PRIMARY KEY`: a unicidade e GLOBAL, nao por
 * provedor. A coluna `provider` existe (migration 20260713180000) mas NAO compoe
 * a chave. E os dois provedores emitem ids que comecam por `evt_`.
 *
 * Uma colisao entre um id do Asaas e um id da Stripe ja gravado nao daria erro:
 * o upsert com `ignoreDuplicates` trataria o evento novo como ja visto e o
 * pagamento sumiria em silencio, que e a pior classe de falha desta base. A
 * probabilidade e minuscula e a consequencia e um pagamento perdido, entao o
 * namespace entra.
 *
 * ELE VIVE NO VALOR, NAO NO SCHEMA, e isso foi escolha. A alternativa era chave
 * composta `(provider, id)`, que e mais robusta (nao depende de ninguem lembrar
 * do prefixo) mas exige DROP e recriacao de PRIMARY KEY numa tabela viva, ou
 * seja, migration destrutiva com janela, para eliminar uma colisao teorica. O
 * prefixo custa zero, e impossivel de colidir por construcao (id da Stripe nunca
 * contem `:`) e nao toca as linhas existentes. A funcao abaixo e o unico lugar
 * que o escreve.
 */
export function chaveDeEvento(idDoAsaas: string): string {
  return `${EVENT_ID_PREFIX}${idDoAsaas}`;
}

/**
 * Processa um evento do Asaas.
 *
 * NAO passa por `PaymentProvider.handleWebhook`: ver a nota naquele metodo.
 *
 * CONTRATO DE RESPOSTA, desenhado para a FILA do Asaas. A entrega e at least
 * once e uma sequencia de falhas PAUSA a fila da conta inteira, entao:
 *   - evento repetido devolve 200 na hora, sem reprocessar;
 *   - tipo desconhecido devolve 200 com log, NUNCA 4xx (um 400 por payload que
 *     nao sabemos ler pausaria a fila por um evento que nao nos interessa);
 *   - falha de PROCESSAMENTO propaga e vira 500, para a reentrega acontecer, e
 *     grita no Sentry, porque falha repetida para a fila e isso precisa ser
 *     visivel no dia 1, nao no dia em que alguem reclamar.
 */
export async function processarEventoAsaas(
  evento: AsaasEvent,
): Promise<ResultadoDeWebhook> {
  const tipo = texto(evento.event);
  const idDoEvento = texto(evento.id);

  if (!tipo || !idDoEvento) {
    // Sem tipo ou sem id nao ha o que deduplicar nem o que rotear. 200 mesmo
    // assim: reentregar nao melhora um payload que nao tem os campos.
    console.warn("[webhook/asaas] evento sem id ou sem tipo; ignorando.");
    return { received: true, unhandled: true };
  }

  const tratado =
    EVENTOS_DE_PAGAMENTO.has(tipo) || EVENTOS_DE_ENCERRAMENTO.has(tipo);
  if (!tratado) {
    console.log(`[webhook/asaas] evento nao tratado: ${tipo} (${idDoEvento}).`);
    return { received: true, unhandled: true };
  }

  const cobrancaId = texto(evento.payment?.id);
  const linhaId = texto(evento.payment?.externalReference);
  const recebidoEm = texto(evento.dateCreated);

  // DEDUPE. `ignoreDuplicates` faz o conflito virar DO NOTHING: so a primeira
  // gravacao volta linha.
  const { data: registrado, error: dedupeError } = await supabaseAdmin
    .from("billing_events")
    .upsert(
      {
        id: chaveDeEvento(idDoEvento),
        provider: PROVIDER,
        event_type: tipo,
        provider_subscription_id: cobrancaId,
        payment_id: cobrancaId,
        event_created_at: recebidoEm,
        raw: evento,
      },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .select("id");

  if (dedupeError) {
    console.error(
      "[webhook/asaas] falha ao registrar billing_event:",
      dedupeError,
    );
    throw createError(500, "db_error", "Erro ao registrar evento.", {
      cause: dedupeError,
    });
  }
  if (!registrado || registrado.length === 0) {
    return { received: true, deduped: true };
  }

  try {
    if (EVENTOS_DE_PAGAMENTO.has(tipo)) {
      const ativou = await ativarPorPagamento({
        evento,
        tipo,
        idDoEvento,
        cobrancaId,
        linhaId,
      });
      return { received: true, activated: ativou };
    }
    await encerrarPendente({ tipo, idDoEvento, cobrancaId, linhaId, evento });
    return { received: true, activated: false };
  } catch (err) {
    // Compensacao: apaga o registro para a reentrega reprocessar. Mesmo desenho
    // do webhook da Stripe.
    const { error: limpezaError } = await supabaseAdmin
      .from("billing_events")
      .delete()
      .eq("id", chaveDeEvento(idDoEvento));
    if (limpezaError) {
      console.error(
        `[webhook/asaas] compensacao falhou para ${idDoEvento}:`,
        limpezaError,
      );
    }
    Sentry.captureMessage("asaas_webhook_falhou", {
      level: "error",
      fingerprint: ["asaas-webhook-falhou"],
      tags: { origem: "asaas-webhook", event_type: tipo },
      extra: {
        event_id: idDoEvento,
        event_type: tipo,
        asaas_payment_id: cobrancaId,
        subscription_row_id: linhaId,
        erro: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}

/** Localiza a linha pendente pelo id da cobranca, com o id local como reserva. */
async function acharLinha(cobrancaId: string | null, linhaId: string | null) {
  if (cobrancaId) {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, status, plan_id, affiliate_code, coupon_code")
      .eq("provider_subscription_id", cobrancaId)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }
  // Reserva: a linha existe desde ANTES da cobranca, e o `externalReference` a
  // nomeia. Isto cobre a janela em que a cobranca foi criada e o UPDATE que
  // grava `provider_subscription_id` nao concluiu.
  if (linhaId) {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, status, plan_id, affiliate_code, coupon_code")
      .eq("id", linhaId)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }
  return null;
}

/**
 * Pagamento confirmado: ativa a linha pendente pela RPC atomica.
 *
 * O PERIODO E CALCULADO AQUI, como no boleto, porque nao existe assinatura
 * remota de onde puxar. A ancora e a mesma regra: renovacao SOMA ao periodo
 * vigente em vez de substituir, para quem paga adiantado nao perder os dias que
 * faltavam.
 *
 * Devolve `true` quando esta chamada foi a que ativou, `false` na reentrega.
 */
async function ativarPorPagamento(args: {
  evento: AsaasEvent;
  tipo: string;
  idDoEvento: string;
  cobrancaId: string | null;
  linhaId: string | null;
}): Promise<boolean> {
  const { evento, tipo, idDoEvento, cobrancaId, linhaId } = args;

  const linha = await acharLinha(cobrancaId, linhaId);
  if (!linha) {
    // Dinheiro confirmado sem linha para ativar. NUNCA silencioso: lanca, a
    // compensacao apaga o dedupe e a reentrega tenta de novo.
    console.error(
      `[webhook/asaas] PAGAMENTO SEM LINHA: cobranca ${cobrancaId ?? "?"} (evento ${idDoEvento}).`,
    );
    throw createError(500, "db_error", "Pagamento sem assinatura para ativar.");
  }

  if (linha.status === "active") return false; // reprocesso idempotente

  if (linha.status !== "pending") {
    console.error(
      `[webhook/asaas] pagamento nao ativou (linha ${linha.id}, status ${linha.status}).`,
    );
    throw createError(500, "db_error", "Pagamento não ativou a assinatura.");
  }

  const { data: plano } = await supabaseAdmin
    .from("plans")
    .select("code, name")
    .eq("id", linha.plan_id)
    .maybeSingle();
  const planCode = plano?.code;
  const accessDays =
    planCode && isPlanIdConhecido(planCode)
      ? PIX_ACCESS_DAYS[planCode]
      : undefined;
  if (!accessDays) {
    // Sem dias de acesso nao da para calcular o periodo, e ativar com periodo
    // chutado seria conceder acesso por um prazo que ninguem vendeu.
    console.error(
      `[webhook/asaas] linha ${linha.id} sem plano com dias de Pix (code ${planCode ?? "?"}).`,
    );
    throw createError(500, "config_error", "Plano sem prazo de acesso Pix.");
  }

  const pagoEm = new Date();
  const pagoEmIso = pagoEm.toISOString();

  // Ancora: maior fim de periodo ainda vigente entre as ativas do usuario,
  // EXCETO esta linha. Sem vigente, a ancora e o proprio pagamento.
  const { data: vigente } = await supabaseAdmin
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", linha.user_id)
    .in("status", ["active", "trialing"])
    .gt("current_period_end", pagoEmIso)
    .neq("id", linha.id)
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ancoraMs = vigente?.current_period_end
    ? new Date(vigente.current_period_end).getTime()
    : pagoEm.getTime();
  const periodStart = new Date(ancoraMs).toISOString();
  const periodEnd = new Date(
    ancoraMs + accessDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: ativacao, error } = await supabaseAdmin.rpc(
    "activate_subscription_exclusive",
    {
      p_subscription_id: linha.id,
      p_user_id: linha.user_id,
      p_period_start: periodStart,
      p_period_end: periodEnd,
      p_last_event_at: pagoEmIso,
      p_raw_payload: evento,
    },
  );

  if (error) {
    // Mesmo contrato do boleto pos-Lote 1a: captura com contexto e propaga. A
    // RPC e idempotente, entao a reentrega converge em vez de duplicar efeito, e
    // NAO existe retry proprio aqui.
    Sentry.captureMessage("asaas_ativacao_falhou", {
      level: "error",
      fingerprint: ["asaas-ativacao-falhou"],
      tags: { origem: "asaas-webhook", event_type: tipo },
      extra: {
        user_id: linha.user_id,
        subscription_row_id: linha.id,
        event_id: idDoEvento,
        asaas_payment_id: cobrancaId,
        db_code: error.code ?? null,
        db_message: error.message,
      },
    });
    console.error("[webhook/asaas] activation rpc failed:", error);
    throw createError(500, "db_error", "Erro ao ativar assinatura.", {
      cause: error,
    });
  }

  const linhas = (ativacao ?? []) as ExclusiveActivationRow[];
  const resultado = linhas[0];
  if (!resultado) {
    console.error(
      `[webhook/asaas] activate_subscription_exclusive devolveu vazio (linha ${linha.id}).`,
    );
    throw createError(500, "db_error", "Ativação de assinatura sem resultado.");
  }
  if (!resultado.out_activated) return false;

  if (resultado.out_superseded_count > 0) {
    console.log(
      `[webhook/asaas] ${resultado.out_superseded_count} assinatura(s) superseded (user ${resultado.out_user_id}).`,
    );
  }

  // EFEITOS DA ATIVACAO pelo caminho compartilhado, o MESMO que o cartao e o
  // boleto usam (server/providers/shared.ts). O Lote 2a reimplementava cache e
  // cupom aqui por fora, e nao tinha o e-mail: quem pagava por Pix ganhava
  // acesso e nao recebia confirmacao nenhuma.
  //
  // Chamado SOMENTE com `out_activated === true`: uma reentrega que nao ativou
  // nada nao pode reenviar e-mail nem recontar comissao.
  await applyActivationEffects({
    userId: resultado.out_user_id,
    logPrefix: "webhook/asaas",
    planName: plano?.name || plano?.code || "Pro",
    affiliateCode: resultado.out_affiliate_code,
    couponCode: resultado.out_coupon_code,
    revenueCents: paidAmountCentsFromAsaas(evento) ?? undefined,
    sourceEvent: { id: idDoEvento, type: tipo, subscriptionId: cobrancaId },
    prevStatus: "pending",
  });

  return true;
}

/**
 * Cobranca vencida ou removida: encerra a linha pendente.
 *
 * Condicional em `pending` (idempotente) e SEM efeitos de transicao: a pessoa
 * nunca teve acesso, entao e-mail de cancelamento seria errado. Efeito colateral
 * desejado, igual ao do boleto: sair de `pending` libera o guard 409 e a pessoa
 * pode tentar de novo.
 */
async function encerrarPendente(args: {
  tipo: string;
  idDoEvento: string;
  cobrancaId: string | null;
  linhaId: string | null;
  evento: AsaasEvent;
}): Promise<void> {
  const { tipo, cobrancaId, linhaId, evento } = args;
  const linha = await acharLinha(cobrancaId, linhaId);
  if (!linha) {
    // Nao ha dinheiro envolvido: uma cobranca vencida sem linha local e ruido,
    // nao perda. Loga e segue.
    console.warn(
      `[webhook/asaas] ${tipo} sem linha correspondente (cobranca ${cobrancaId ?? "?"}).`,
    );
    return;
  }

  const agora = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: agora,
      last_event_at: agora,
      raw_provider_payload: evento,
    })
    .eq("id", linha.id)
    .eq("status", "pending");
  if (error) {
    console.error("[webhook/asaas] falha ao encerrar linha pendente:", error);
    throw createError(500, "db_error", "Erro ao encerrar a cobrança.", {
      cause: error,
    });
  }
}

/** `plans.code` vem do banco; so entra no mapa se for um PlanId conhecido. */
function isPlanIdConhecido(code: string): code is PlanId {
  return code in PLAN_PRICING;
}
