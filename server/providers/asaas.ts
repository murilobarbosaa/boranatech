import * as Sentry from "@sentry/node";

import { asaasFetch } from "../lib/asaasClient";
import { env } from "../lib/env";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "../middleware/error";
import {
  applyActivationEffects,
  isFirstPurchase,
  recordNonRenewalIntent,
  revertNonRenewalIntent,
} from "./shared";
import { resolveCheckoutPriceCents } from "../lib/coupons";
import { isValidCpf } from "../../shared/certificates/types";
import { oneOffAccessDays } from "../../shared/paymentMethods";
import { PLAN_PRICING } from "../../shared/planPricing";
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
 * entao nao existe objeto de assinatura remota aqui. Cada compra e uma charge
 * unica que concede um periodo de acesso, exatamente como o boleto da Stripe: a
 * row nasce `pending`, o webhook confirma, a RPC ativa, o periodo vence e a
 * pessoa compra de novo. Ler o fluxo do boleto em server/providers/stripe.ts
 * responde quase toda pergunta sobre este arquivo.
 */

/**
 * Prazo do Pix, em dias. Curto de proposito: um Pix e instantaneo, o prazo aqui
 * e so a validade do QR Code. Tres dias (o do boleto) manteria a row `pending`
 * bloqueando o guard 409 por muito mais tempo do que a pessoa leva para pagar.
 */
const PIX_DUE_DAYS = 2;

/**
 * Valor minimo que o Asaas aceita numa cobranca, em centavos.
 *
 * Nao e regra nossa: e limite da plataforma. Fica aqui porque e o provedor que o
 * impoe, e um cupom agressivo o bastante derruba o semestral abaixo dele.
 */
const ASAAS_MIN_CHARGE_CENTS = 500;

/** `provider` como gravado em subscriptions e billing_events. */
const PROVIDER = "asaas" as const;

/**
 * PREFIXO DE NAMESPACE DO EVENTO. Ver a nota longa em `handleWebhook`.
 * `billing_events.id` e PRIMARY KEY GLOBAL, e os dois provedores emitem ids que
 * comecam com `evt_`.
 */
const EVENT_ID_PREFIX = "asaas:";

type AsaasCustomer = { id: string; cpfCnpj?: string | null };

/**
 * CPF mascarado, para log e contexto de Sentry.
 *
 * Tres primeiros e dois ultimos digitos, que e o bastante para casar com uma
 * linha do banco numa investigacao e insuficiente para reconstruir o documento.
 * O CPF NAO entra em mensagem de erro nem em log cru em lugar nenhum deste
 * arquivo; esta funcao e o unico caminho pelo qual ele aparece.
 */
export function maskCpf(digits: string): string {
  if (digits.length !== 11) return "invalido";
  return `${digits.slice(0, 3)}.***.**${digits.slice(9)}`;
}
type AsaasCustomerSearch = { data?: AsaasCustomer[] };
type AsaasCharge = {
  id: string;
  invoiceUrl?: string | null;
  status?: string | null;
  /** Valor em REAIS, como o Asaas trafega. Convertido a centavos na fronteira. */
  value?: number | null;
  /** Vencimento da COBRANCA, `YYYY-MM-DD`. Nao confundir com o prazo do QR. */
  dueDate?: string | null;
};

/** Data de vencimento no formato que o Asaas espera (YYYY-MM-DD). */
function dueDateInDays(dias: number, agora: Date): string {
  const d = new Date(agora.getTime() + dias * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

/**
 * Customer do Asaas para este usuario, reusando o que existir.
 *
 * A BUSCA VEM ANTES DA CRIACAO porque o Asaas NAO deduplica por
 * `externalReference`: chamar POST /customers duas vezes cria dois customers
 * para a mesma pessoa, e a partir dai o historico de cobrancas dela fica
 * partido em dois, sem err nenhum para acusar.
 */
async function resolveCustomer(input: {
  userId: string;
  email: string;
  /** Somente digitos, ja validado pelo chamador. */
  cpf: string;
}): Promise<string> {
  const search = await asaasFetch<AsaasCustomerSearch>(
    `/customers?externalReference=${encodeURIComponent(input.userId)}&limit=1`,
  );
  const existing = search?.data?.[0];
  if (existing?.id) {
    // O cliente ja existe, mas pode ter sido criado ANTES de o documento passar
    // a ser exigido, ou a pessoa pode ter corrigido o CPF no perfil depois. Nos
    // dois casos a cobranca seria recusada com o mesmo `invalid_object`, e o
    // sintoma apareceria como falha do pagamento em vez de dado desatualizado.
    // Comparar por digitos: o Asaas devolve o documento formatado as vezes.
    const atual = String(existing.cpfCnpj ?? "").replace(/\D/g, "");
    if (atual !== input.cpf) {
      await asaasFetch<AsaasCustomer>(`/customers/${existing.id}`, {
        method: "POST",
        body: { cpfCnpj: input.cpf },
      });
      // Registra a MUTACAO de um objeto remoto, que e o tipo de efeito que nao
      // pode acontecer em silencio. MASCARADO: o suficiente para casar com a
      // linha do banco numa investigacao, insuficiente para reconstruir o
      // documento.
      console.log(
        `[asaas/checkout] documento do cliente ${existing.id} atualizado para ${maskCpf(input.cpf)}.`,
      );
    }
    return existing.id;
  }

  const createdCustomer = await asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: {
      name: input.email || input.userId,
      email: input.email || undefined,
      cpfCnpj: input.cpf,
      externalReference: input.userId,
    },
  });
  if (!createdCustomer?.id) {
    throw createError(
      502,
      "asaas_customer_sem_id",
      "O provedor de pagamento não devolveu o cliente.",
    );
  }
  return createdCustomer.id;
}

/**
 * Checkout de Pix avulso.
 *
 * ORDEM DAS ESCRITAS: LINHA LOCAL PRIMEIRO, COBRANCA REMOTA DEPOIS.
 *
 * Esta ordem e DIFERENTE da do boleto, e a diferenca e deliberada. No boleto a
 * sessao da Stripe nasce primeiro e a row `pending` so aparece quando o
 * `checkout.session.completed` chega; se aquele event se perder, existe dinheiro
 * do lado da Stripe sem nenhuma row local, e foi precisamente por isso que a
 * tabela `billing_orphan_payments` e o cron `detect-orphan-payments` tiveram de
 * ser inventados depois.
 *
 * Aqui a row existe ANTES de a charge ser created, entao o webhook nunca pode
 * chegar antes dela. O custo dessa escolha e o oposto e mais barato: se a
 * chamada ao Asaas falhar, sobra uma row `pending` sem charge, que nao
 * concede acesso nenhum e e limpa pelo mesmo caminho que expira Pix vencido.
 * Linha orfa sem dinheiro e um registro a limpar; dinheiro orfo sem row e uma
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

  const accessDays = oneOffAccessDays(input.planId);
  if (!accessDays) {
    // Mesmo contrato de err do boleto: 400 com slug proprio, para a UI
    // distinguir "plan nao aceita este meio" de qualquer outra recusa.
    throw createError(
      400,
      "pix_not_allowed_on_monthly",
      "Pix não está disponível neste plan.",
    );
  }

  // CPF OBRIGATORIO, e a checagem vem ANTES de tudo: antes dos guards de
  // duplicidade, antes da row local e antes de qualquer chamada remota.
  //
  // O Asaas RECUSA a criacao da cobranca sem documento do cliente
  // (`invalid_object`, "Para criar esta cobranca e necessario preencher o CPF ou
  // CNPJ do cliente"). Sem esta guarda o sintoma chega como 502 generico, depois
  // de ja existir uma row `pending` para compensar, e a pessoa ve "falha no
  // provedor" quando o que falta e um dado dela.
  //
  // A Stripe nunca exibiu isso porque o checkout HOSPEDADO dela coleta o
  // documento quando o boleto exige. Aqui a cobranca e criada por API, entao a
  // coleta e nossa.
  //
  // 422 e nao 400: o corpo da requisicao esta correto, o que falta e um
  // pre-requisito do usuario. O slug e o que a UI usa para abrir a coleta.
  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from("profiles")
    .select("cpf")
    .eq("user_id", input.user.id)
    .maybeSingle();
  if (perfilError) {
    console.error(
      "[asaas/checkout] leitura de perfil falhou; bloqueando:",
      perfilError,
    );
    throw createError(
      500,
      "db_error",
      "Não foi possível verificar seu cadastro. Tente novamente.",
      { cause: perfilError },
    );
  }
  const cpf = String(perfil?.cpf ?? "").replace(/\D/g, "");
  if (!isValidCpf(cpf)) {
    // MESMO validador do PATCH /api/me (shared/certificates/types.ts), nao uma
    // segunda regra: duas validacoes do mesmo documento divergem, e a que ficar
    // para tras aceita o que a outra recusa.
    throw createError(
      422,
      "cpf_obrigatorio",
      "Informe seu CPF para pagar com Pix.",
    );
  }

  // Guard de assinatura ativa. O indice unico parcial
  // `subscriptions_one_active_per_user` e a rede de seguranca, nao a primeira
  // row: sem este guard o usuario pagaria e SO ENTAO descobriria, por um 23505
  // no webhook, que ja era assinante. Fail-closed: err de query BLOQUEIA.
  const { data: activeRows, error: guardError } = await supabaseAdmin
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
  if (activeRows && activeRows.length > 0) {
    throw createError(409, "conflict", "Usuário já possui assinatura ativa.");
  }

  // Guard de Pix pendente, espelhando o de boleto pendente: enquanto uma
  // charge aguarda pagamento, nao gera outra, para nao cobrar duas vezes.
  const { data: pendingRows, error: pendenteError } = await supabaseAdmin
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
  if (pendingRows && pendingRows.length > 0) {
    throw createError(
      409,
      "pix_pending",
      "Você tem um Pix aguardando pagamento.",
    );
  }

  const { data: plan } = await supabaseAdmin
    .from("plans")
    .select("id")
    .eq("code", input.planId)
    .maybeSingle();
  if (!plan) throw createError(500, "db_error", "Plano Pro não encontrado.");

  // PRECO FINAL pela funcao unica (server/lib/coupons.ts), a mesma aritmetica
  // que o frontend usa na previa. Antes daqui a cobranca herdava o preco CHEIO
  // e a tela mostrava o descontado.
  const { finalCents, appliedCouponCode } = await resolveCheckoutPriceCents({
    userId: input.user.id,
    planId: input.planId,
    couponCode: input.couponCode,
    isFirstPurchase,
  });

  // PISO DO ASAAS. Cobranca abaixo de R$ 5,00 e recusada por eles, e um cupom
  // agressivo o bastante derruba o semestral abaixo disso. Recusar aqui, ANTES
  // da row local e da chamada remota, evita a row orfa e o 502 generico.
  if (finalCents < ASAAS_MIN_CHARGE_CENTS) {
    throw createError(
      422,
      "valor_minimo_pix",
      // TODO(Ana): copy do valor abaixo do minimo do Pix.
      "O valor com desconto ficou abaixo do mínimo do Pix. Tente cartão.",
    );
  }

  // (1) LINHA LOCAL. `provider_subscription_id` fica NULL ate a charge
  // existir: a coluna e UNIQUE, e no Postgres UNIQUE admite varios NULL, entao
  // rows em voo nao colidem entre si.
  const { data: created, error: insertError } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      user_id: input.user.id,
      plan_id: plan.id,
      provider: PROVIDER,
      provider_subscription_id: null,
      provider_customer_id: null,
      affiliate_code: input.affiliateCode || null,
      // O cupom APROVADO, nao o bruto do cliente: a ativacao conta resgate a
      // partir deste campo, e contar resgate de cupom que nao descontou nada
      // corromperia `times_redeemed`.
      coupon_code: appliedCouponCode || null,
      status: "pending",
      payment_method: "pix",
      renewal_type: "manual",
      current_period_start: null,
      current_period_end: null,
    })
    .select("id")
    .single();
  if (insertError || !created) {
    console.error(
      "[asaas/checkout] insert da row pendente falhou:",
      insertError,
    );
    throw createError(500, "db_error", "Erro ao registrar a cobrança.", {
      cause: insertError,
    });
  }

  // (2) COBRANCA REMOTA. `externalReference` carrega o id da row local, entao
  // o webhook sabe quem ativar mesmo se algo der errado com o id da charge.
  let charge: AsaasCharge;
  try {
    const customerId = await resolveCustomer({
      userId: input.user.id,
      email: input.user.email,
      cpf,
    });

    charge = await asaasFetch<AsaasCharge>("/payments", {
      method: "POST",
      body: {
        customer: customerId,
        billingType: "PIX",
        // Centavos inteiros dos dois lados; o Asaas recebe reais.
        value: finalCents / 100,
        dueDate: dueDateInDays(PIX_DUE_DAYS, new Date()),
        description: `Bora na Tech Pro ${PLAN_PRICING[input.planId].label}`,
        externalReference: created.id,
      },
    });

    if (!charge?.id) {
      throw createError(
        502,
        "asaas_cobranca_sem_id",
        "O provedor de pagamento não devolveu a cobrança.",
      );
    }

    // (3) Amarra a row ao objeto remoto. So aqui ela vira localizavel pelo
    // webhook por `provider_subscription_id`.
    const { error: linkError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        provider_subscription_id: charge.id,
        provider_customer_id: customerId,
      })
      .eq("id", created.id);
    if (linkError) {
      // A charge EXISTE do lado do Asaas e a row local nao aponta para ela.
      // Grita: o webhook ainda acha a row pelo `externalReference`, mas isto e
      // um estado que ninguem deve descobrir por acaso.
      Sentry.captureMessage("asaas_link_cobranca_falhou", {
        level: "error",
        fingerprint: ["asaas-link-charge-falhou"],
        tags: { origem: "asaas-checkout" },
        extra: {
          user_id: input.user.id,
          subscription_row_id: created.id,
          asaas_payment_id: charge.id,
          db_message: linkError.message,
        },
      });
      throw createError(500, "db_error", "Erro ao registrar a cobrança.", {
        cause: linkError,
      });
    }
  } catch (err) {
    // A row local ficou sem charge. Marca como cancelada para nao travar o
    // guard 409 de Pix pendente da proxima tentativa. Best-effort de proposito:
    // o err que importa e o de cima, e o cron de expiracao pega o residuo.
    const { error: cleanupError } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("id", created.id)
      .eq("status", "pending");
    if (cleanupError) {
      console.error(
        `[asaas/checkout] row ${created.id} ficou pendente sem charge e a limpeza falhou:`,
        cleanupError,
      );
    }
    throw err;
  }

  return {
    checkoutUrl: charge.invoiceUrl ?? undefined,
    subscriptionId: charge.id,
    // O QR vem por `GET /api/billing/pix-qrcode`, nao aqui: o id da cobranca
    // NAO viaja para o cliente, e a tela pede o QR pelo dono da linha.
    flow: "native_pix",
    // VALOR QUE O ASAAS REGISTROU, nao o que pedimos. Os dois coincidem hoje
    // (mandamos `finalCents / 100` logo acima) e mesmo assim a fonte e a
    // resposta: se o provedor arredondar ou ajustar, a tela mostra o que sera
    // cobrado, nao o que tentamos cobrar. `finalCents` so entra se o corpo vier
    // sem o campo, para o contrato nao ficar com buraco.
    amountCents:
      typeof charge.value === "number"
        ? Math.round(charge.value * 100)
        : finalCents,
    // VENCIMENTO DA COBRANCA, e nao o prazo do QR. Os dois existem e sao
    // diferentes: medido em 2026-09-01, uma cobranca com `dueDate` 2026-09-03
    // trazia `expirationDate` 2027-09-03, um ano a mais. Quem manda e este:
    // passado ele o Asaas emite PAYMENT_OVERDUE, que esta em `CLOSING_EVENTS` e
    // fecha a linha pendente, e a partir dai o pagamento nao ativa mais nada.
    dueDate: charge.dueDate ?? null,
  };
}

/**
 * Assinatura Pix do usuario sobre a qual `cancel` e `reactivate` operam.
 *
 * Filtra por `provider = 'asaas'` pelo mesmo motivo que o caminho da Stripe
 * filtra por `'stripe'`: quem tem as duas coisas na vida da conta nao pode ter
 * uma acao de um provedor atingindo a row do outro.
 */
async function findPixSubscription(userId: string) {
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
function formatDate(iso: string | null): string {
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
  const sub = await findPixSubscription(input.userId);
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
    message: `Anotado: sua assinatura não vai renovar. Você mantém o acesso Pro até ${formatDate(sub.current_period_end)}.`,
  };
}

/**
 * Desfaz o "nao renovar", espelhando o boleto: marca a intencao como 'reverted'
 * e nao toca provedor nenhum. Idempotente (segundo clique nao acha 'scheduled').
 */
async function reactivate(input: ReactivateInput): Promise<ReactivateResult> {
  const sub = await findPixSubscription(input.userId);
  if (!sub) {
    // Mesma saida do caminho de cartao quando nao ha o que reativar: manda para
    // o checkout em vez de err, porque a acao que resolve e comprar de novo.
    return {
      redirect_to_checkout: true,
      checkout_path: "/planos",
      message:
        "Reativação não disponível para este plan. Vamos para um novo plan.",
    };
  }

  await revertNonRenewalIntent(sub.provider_subscription_id);

  return {
    cancel_at_period_end: false,
    // TODO(Ana): mensagem de sucesso do "voltar atras" do Pix.
    message: `Pronto: o aviso de não renovação foi removido. Seu acesso Pro segue até ${formatDate(sub.current_period_end)} e você pode renovar quando quiser.`,
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
 * A rota do Asaas (server/routes/webhooksAsaas.ts) chama `processAsaasEvent`
 * diretamente. Este metodo existe para satisfazer o eventType e lanca se alguem o
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

export { PIX_DUE_DAYS, EVENT_ID_PREFIX, PROVIDER };

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

/** Recorte do event do Asaas que este handler usa. */
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

export type WebhookOutcome = {
  received: true;
  deduped?: true;
  unhandled?: true;
  activated?: boolean;
};

/** Eventos que confirmam dinheiro recebido. */
const PAYMENT_EVENTS = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);
/** Eventos que encerram a charge sem pagamento. */
const CLOSING_EVENTS = new Set(["PAYMENT_OVERDUE", "PAYMENT_DELETED"]);

function asText(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

/**
 * Valor PAGO declarado pelo event, em centavos, ou `null` quando o event nao
 * declara amount.
 *
 * `null` NAO e zero, pela mesma razao escrita em `paidAmountCentsFromEvent`
 * (server/providers/stripe.ts): zero e uma charge de amount zero; `null` e
 * ausencia de informacao. Colapsar os dois grava no ledger de comissao uma venda
 * indistinguivel de uma venda gratuita legitima.
 *
 * O Asaas manda `value` em REAIS, com centavos decimais. A conversao arredonda
 * porque centavo fracionado nao existe, e o float do JSON pode trazer 129.99999.
 */
export function paidAmountCentsFromAsaas(event: AsaasEvent): number | null {
  const amount = event.payment?.value;
  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
}

/**
 * IDEMPOTENCIA, e o motivo do prefixo.
 *
 * `billing_events.id` e `text PRIMARY KEY`: a unicidade e GLOBAL, nao por
 * provedor. A coluna `provider` existe (migration 20260713180000) mas NAO compoe
 * a chave. E os dois provedores emitem ids que comecam por `evt_`.
 *
 * Uma colisao entre um id do Asaas e um id da Stripe ja gravado nao daria err:
 * o upsert com `ignoreDuplicates` trataria o event novo como ja visto e o
 * pagamento sumiria em silencio, que e a pior classe de falha desta base. A
 * probabilidade e minuscula e a consequencia e um pagamento perdido, entao o
 * namespace entra.
 *
 * ELE VIVE NO VALOR, NAO NO SCHEMA, e isso foi escolha. A alternativa era chave
 * composta `(provider, id)`, que e mais robusta (nao depende de ninguem lembrar
 * do prefixo) mas exige DROP e recriacao de PRIMARY KEY numa tabela viva, ou
 * seja, migration destrutiva com janela, para eliminar uma colisao teorica. O
 * prefixo custa zero, e impossivel de colidir por construcao (id da Stripe nunca
 * contem `:`) e nao toca as rows existentes. A funcao abaixo e o unico lugar
 * que o escreve.
 */
export function eventKey(idDoAsaas: string): string {
  return `${EVENT_ID_PREFIX}${idDoAsaas}`;
}

/**
 * Processa um event do Asaas.
 *
 * NAO passa por `PaymentProvider.handleWebhook`: ver a nota naquele metodo.
 *
 * CONTRATO DE RESPOSTA, desenhado para a FILA do Asaas. A entrega e at least
 * once e uma sequencia de falhas PAUSA a fila da conta inteira, entao:
 *   - event repetido devolve 200 na hora, sem reprocessar;
 *   - eventType desconhecido devolve 200 com log, NUNCA 4xx (um 400 por payload que
 *     nao sabemos ler pausaria a fila por um event que nao nos interessa);
 *   - falha de PROCESSAMENTO propaga e vira 500, para a reentrega acontecer, e
 *     grita no Sentry, porque falha repetida para a fila e isso precisa ser
 *     visivel no dia 1, nao no dia em que alguem reclamar.
 */
export async function processAsaasEvent(
  event: AsaasEvent,
): Promise<WebhookOutcome> {
  const eventType = asText(event.event);
  const eventId = asText(event.id);

  if (!eventType || !eventId) {
    // Sem eventType ou sem id nao ha o que deduplicar nem o que rotear. 200 mesmo
    // assim: reentregar nao melhora um payload que nao tem os campos.
    console.warn("[webhook/asaas] event sem id ou sem eventType; ignorando.");
    return { received: true, unhandled: true };
  }

  const handled =
    PAYMENT_EVENTS.has(eventType) || CLOSING_EVENTS.has(eventType);
  if (!handled) {
    console.log(
      `[webhook/asaas] event nao handled: ${eventType} (${eventId}).`,
    );
    return { received: true, unhandled: true };
  }

  const chargeId = asText(event.payment?.id);
  const rowId = asText(event.payment?.externalReference);
  const receivedAt = asText(event.dateCreated);

  // DEDUPE. `ignoreDuplicates` faz o conflito virar DO NOTHING: so a primeira
  // gravacao volta row.
  const { data: recorded, error: dedupeError } = await supabaseAdmin
    .from("billing_events")
    .upsert(
      {
        id: eventKey(eventId),
        provider: PROVIDER,
        event_type: eventType,
        provider_subscription_id: chargeId,
        payment_id: chargeId,
        event_created_at: receivedAt,
        raw: event,
      },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .select("id");

  if (dedupeError) {
    console.error(
      "[webhook/asaas] falha ao registrar billing_event:",
      dedupeError,
    );
    throw createError(500, "db_error", "Erro ao registrar event.", {
      cause: dedupeError,
    });
  }
  if (!recorded || recorded.length === 0) {
    return { received: true, deduped: true };
  }

  try {
    if (PAYMENT_EVENTS.has(eventType)) {
      const ativou = await activateOnPayment({
        event,
        eventType,
        eventId,
        chargeId,
        rowId,
      });
      return { received: true, activated: ativou };
    }
    await closePendingCharge({ eventType, eventId, chargeId, rowId, event });
    return { received: true, activated: false };
  } catch (err) {
    // Compensacao: apaga o registro para a reentrega reprocessar. Mesmo desenho
    // do webhook da Stripe.
    const { error: cleanupError } = await supabaseAdmin
      .from("billing_events")
      .delete()
      .eq("id", eventKey(eventId));
    if (cleanupError) {
      console.error(
        `[webhook/asaas] compensacao falhou para ${eventId}:`,
        cleanupError,
      );
    }
    Sentry.captureMessage("asaas_webhook_falhou", {
      level: "error",
      fingerprint: ["asaas-webhook-falhou"],
      tags: { origem: "asaas-webhook", event_type: eventType },
      extra: {
        event_id: eventId,
        event_type: eventType,
        asaas_payment_id: chargeId,
        subscription_row_id: rowId,
        err: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}

/** Localiza a row pendente pelo id da charge, com o id local como reserva. */
async function findSubscriptionRow(
  chargeId: string | null,
  rowId: string | null,
) {
  if (chargeId) {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, status, plan_id, affiliate_code, coupon_code")
      .eq("provider_subscription_id", chargeId)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }
  // Reserva: a row existe desde ANTES da charge, e o `externalReference` a
  // nomeia. Isto cobre a janela em que a charge foi created e o UPDATE que
  // grava `provider_subscription_id` nao concluiu.
  if (rowId) {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, status, plan_id, affiliate_code, coupon_code")
      .eq("id", rowId)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }
  return null;
}

/**
 * Pagamento confirmado: ativa a row pendente pela RPC atomica.
 *
 * O PERIODO E CALCULADO AQUI, como no boleto, porque nao existe assinatura
 * remota de onde puxar. A ancora e a mesma regra: renovacao SOMA ao periodo
 * current em vez de substituir, para quem paga adiantado nao perder os dias que
 * faltavam.
 *
 * Devolve `true` quando esta chamada foi a que ativou, `false` na reentrega.
 */
async function activateOnPayment(args: {
  event: AsaasEvent;
  eventType: string;
  eventId: string;
  chargeId: string | null;
  rowId: string | null;
}): Promise<boolean> {
  const { event, eventType, eventId, chargeId, rowId } = args;

  const row = await findSubscriptionRow(chargeId, rowId);
  if (!row) {
    // Dinheiro confirmado sem row para ativar. NUNCA silencioso: lanca, a
    // compensacao apaga o dedupe e a reentrega tenta de novo.
    console.error(
      `[webhook/asaas] PAGAMENTO SEM LINHA: charge ${chargeId ?? "?"} (event ${eventId}).`,
    );
    throw createError(500, "db_error", "Pagamento sem assinatura para ativar.");
  }

  if (row.status === "active") return false; // reprocesso idempotente

  if (row.status !== "pending") {
    console.error(
      `[webhook/asaas] pagamento nao ativou (row ${row.id}, status ${row.status}).`,
    );
    throw createError(500, "db_error", "Pagamento não ativou a assinatura.");
  }

  const { data: plan } = await supabaseAdmin
    .from("plans")
    .select("code, name")
    .eq("id", row.plan_id)
    .maybeSingle();
  const planCode = plan?.code;
  const accessDays =
    planCode && isKnownPlanId(planCode)
      ? oneOffAccessDays(planCode)
      : undefined;
  if (!accessDays) {
    // Sem dias de acesso nao da para calcular o periodo, e ativar com periodo
    // chutado seria conceder acesso por um prazo que ninguem vendeu.
    console.error(
      `[webhook/asaas] row ${row.id} sem plan com dias de Pix (code ${planCode ?? "?"}).`,
    );
    throw createError(500, "config_error", "Plano sem prazo de acesso Pix.");
  }

  const paidAt = new Date();
  const paidAtIso = paidAt.toISOString();

  // Ancora: maior fim de periodo ainda current entre as activeRows do usuario,
  // EXCETO esta row. Sem current, a ancora e o proprio pagamento.
  const { data: current } = await supabaseAdmin
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", row.user_id)
    .in("status", ["active", "trialing"])
    .gt("current_period_end", paidAtIso)
    .neq("id", row.id)
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  const anchorMs = current?.current_period_end
    ? new Date(current.current_period_end).getTime()
    : paidAt.getTime();
  const periodStart = new Date(anchorMs).toISOString();
  const periodEnd = new Date(
    anchorMs + accessDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: activation, error } = await supabaseAdmin.rpc(
    "activate_subscription_exclusive",
    {
      p_subscription_id: row.id,
      p_user_id: row.user_id,
      p_period_start: periodStart,
      p_period_end: periodEnd,
      p_last_event_at: paidAtIso,
      p_raw_payload: event,
    },
  );

  if (error) {
    // Mesmo contrato do boleto pos-Lote 1a: captura com contexto e propaga. A
    // RPC e idempotente, entao a reentrega converge em vez de duplicar efeito, e
    // NAO existe retry proprio aqui.
    Sentry.captureMessage("asaas_ativacao_falhou", {
      level: "error",
      fingerprint: ["asaas-activation-falhou"],
      tags: { origem: "asaas-webhook", event_type: eventType },
      extra: {
        user_id: row.user_id,
        subscription_row_id: row.id,
        event_id: eventId,
        asaas_payment_id: chargeId,
        db_code: error.code ?? null,
        db_message: error.message,
      },
    });
    console.error("[webhook/asaas] activation rpc failed:", error);
    throw createError(500, "db_error", "Erro ao ativar assinatura.", {
      cause: error,
    });
  }

  const rows = (activation ?? []) as ExclusiveActivationRow[];
  const result = rows[0];
  if (!result) {
    console.error(
      `[webhook/asaas] activate_subscription_exclusive devolveu vazio (row ${row.id}).`,
    );
    throw createError(500, "db_error", "Ativação de assinatura sem result.");
  }
  if (!result.out_activated) return false;

  if (result.out_superseded_count > 0) {
    console.log(
      `[webhook/asaas] ${result.out_superseded_count} assinatura(s) superseded (user ${result.out_user_id}).`,
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
    userId: result.out_user_id,
    logPrefix: "webhook/asaas",
    // Pix avulso e sempre compra nova: a RPC so ativa a partir de `pending`, e
    // nao existe caminho de `past_due` para ca (nao ha renovacao automatica em
    // cobranca avulsa). Explicito porque o parametro nao tem default.
    motivo: "primeira_ativacao",
    planName: plan?.name || plan?.code || "Pro",
    affiliateCode: result.out_affiliate_code,
    couponCode: result.out_coupon_code,
    revenueCents: paidAmountCentsFromAsaas(event) ?? undefined,
    sourceEvent: { id: eventId, type: eventType, subscriptionId: chargeId },
    prevStatus: "pending",
  });

  return true;
}

/**
 * Cobranca vencida ou removida: encerra a row pendente.
 *
 * Condicional em `pending` (idempotente) e SEM efeitos de transicao: a pessoa
 * nunca teve acesso, entao e-mail de cancelamento seria errado. Efeito colateral
 * desejado, igual ao do boleto: sair de `pending` libera o guard 409 e a pessoa
 * pode tentar de novo.
 */
async function closePendingCharge(args: {
  eventType: string;
  eventId: string;
  chargeId: string | null;
  rowId: string | null;
  event: AsaasEvent;
}): Promise<void> {
  const { eventType, chargeId, rowId, event } = args;
  const row = await findSubscriptionRow(chargeId, rowId);
  if (!row) {
    // Nao ha dinheiro envolvido: uma charge vencida sem row local e ruido,
    // nao perda. Loga e segue.
    console.warn(
      `[webhook/asaas] ${eventType} sem row correspondente (charge ${chargeId ?? "?"}).`,
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
      raw_provider_payload: event,
    })
    .eq("id", row.id)
    .eq("status", "pending");
  if (error) {
    console.error("[webhook/asaas] falha ao encerrar row pendente:", error);
    throw createError(500, "db_error", "Erro ao encerrar a cobrança.", {
      cause: error,
    });
  }
}

/** `plans.code` vem do banco; so entra no mapa se for um PlanId conhecido. */
function isKnownPlanId(code: string): code is PlanId {
  return code in PLAN_PRICING;
}

/**
 * QR Code Pix de uma cobranca, vindo do Asaas.
 *
 * `encodedImage` e PNG em base64 (sem o prefixo `data:`), `payload` e o
 * copia-e-cola, e `expirationDate` e a validade do CODIGO, nao do acesso.
 */
export type PixQrCode = {
  encodedImage: string;
  payload: string;
  expirationDate: string | null;
};

/**
 * Busca o QR de uma cobranca. O id vem SEMPRE do banco, resolvido a partir do
 * dono; nunca de parametro de rota.
 *
 * O corpo bruto do Asaas nao escapa daqui: `asaasFetch` ja traduz falha em
 * `asaas_error` / `asaas_unreachable`, e o que falta e distinguir "a cobranca
 * existe mas nao tem QR" (resposta ok e incompleta) de erro de transporte.
 */
export async function fetchPixQrCode(chargeId: string): Promise<PixQrCode> {
  const qr = await asaasFetch<Partial<PixQrCode>>(
    `/payments/${encodeURIComponent(chargeId)}/pixQrCode`,
  );
  if (!qr?.encodedImage || !qr?.payload) {
    // Resposta 200 sem o que interessa. Nomear e o que separa isto de um 502 de
    // rede na hora de investigar.
    throw createError(
      502,
      "pix_qrcode_indisponivel",
      "Não foi possível gerar o código Pix agora.",
    );
  }
  return {
    encodedImage: qr.encodedImage,
    payload: qr.payload,
    expirationDate: qr.expirationDate ?? null,
  };
}

/**
 * Valor em centavos de uma cobranca existente, para o CAMINHO FRIO.
 *
 * A criacao ja devolve o valor no proprio corpo (`amountCents` de
 * `CreateCheckoutResult`), e e de la que o modal do checkout tira o numero. Esta
 * funcao existe para a outra ponta: a pagina de assinatura, aberta horas depois,
 * numa sessao que nao viu a criacao. Nao ha onde ler isso localmente porque a
 * linha pendente de `subscriptions` guarda `plan_id` e `coupon_code` e NAO o
 * valor cobrado (por isso o card anunciava o preco do plano).
 *
 * DEVOLVE `null` EM VEZ DE LANCAR, e a escolha e deliberada: quem chama e um
 * endpoint que responde a assinatura inteira, e derrubar a pagina de perfil
 * porque um provedor externo esta lento seria trocar um rotulo errado por uma
 * tela em branco. `null` faz o card cair no comportamento de hoje.
 *
 * O caso oposto (valor ausente virando zero) NAO acontece aqui: sem numero o
 * retorno e `null`, nunca `0`, porque "R$ 0,00" e um preco plausivel e errado.
 */
export async function fetchChargeAmountCents(
  chargeId: string,
): Promise<number | null> {
  try {
    const charge = await asaasFetch<AsaasCharge>(
      `/payments/${encodeURIComponent(chargeId)}`,
    );
    return typeof charge?.value === "number"
      ? Math.round(charge.value * 100)
      : null;
  } catch (err) {
    console.error(
      `[asaas] falha ao ler o valor da cobranca ${chargeId}; o card cai no preco do plano:`,
      err,
    );
    return null;
  }
}
