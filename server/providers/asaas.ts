import * as Sentry from "@sentry/node";

import { asaasFetch } from "../lib/asaasClient";
import {
  centavosAsaas,
  montarCobrancaAsaas,
  montarEstornoAsaas,
} from "../lib/asaasLedger";
import { registrarNoLedger } from "../lib/asaasLedgerWriter";
import {
  resolverAssinaturaDoAsaas,
  type AssinaturaDoAsaas,
  type LeituraDeAssinatura,
} from "../lib/asaasSubscriptionLookup";
import { env } from "../lib/env";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError, type AppError } from "../middleware/error";
import { instanteAsaas } from "../../shared/asaasDatetime";
import {
  applyActivationEffects,
  isFirstPurchase,
  recordNonRenewalIntent,
  revertNonRenewalIntent,
} from "./shared";
import { resolveCheckoutPriceCents } from "../lib/coupons";
import { recordCreatorEvent } from "../lib/creatorEvents";
import { isValidCpf } from "../../shared/certificates/types";
import { oneOffAccessDays } from "../../shared/paymentMethods";
import { PLAN_PRICING } from "../../shared/planPricing";
import type { PlanId } from "../../shared/planPricing";
import { montarDbError } from "../lib/dbError";
import { periodoDaRenovacao } from "../lib/renewalAnchor";
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

  const accessDays = oneOffAccessDays(input.planId, "pix");
  if (!accessDays) {
    // Mesmo contrato de err do boleto: 400 com slug proprio, para a UI
    // distinguir "plan nao aceita este meio" de qualquer outra recusa. O slug
    // deixou de nomear o mensal em 2026-09-06, quando o mensal passou a aceitar
    // Pix: a recusa vem do mapa, para o plano que ele nao listar.
    throw createError(
      400,
      "pix_not_allowed_on_plan",
      "Pix não está disponível neste plano.",
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
  //
  // PULADO NA RENOVACAO, e so nela: quem renova esta `active` de proposito.
  // `internalRenewal` e setado pelo servidor (rota de renovacao, a partir do
  // token), nunca lido do corpo HTTP; mesmo contrato do boleto na Stripe. A
  // linha nova nasce `pending` e a RPC de ativacao marca a antiga como
  // `superseded`, entao o indice unico nunca ve duas ativas.
  if (!input.internalRenewal) {
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
  if (!plan)
    throw montarDbError(
      "webhook/asaas",
      "asaas load pending plan",
      pendenteError,
      "Plano Pro não encontrado.",
    );

  // PRECO FINAL pela funcao unica (server/lib/coupons.ts), a mesma aritmetica
  // que o frontend usa na previa. Antes daqui a cobranca herdava o preco CHEIO
  // e a tela mostrava o descontado.
  const { finalCents, appliedCouponCode, validAffiliateCode } =
    await resolveCheckoutPriceCents({
      userId: input.user.id,
      planId: input.planId,
      // Renovacao e sempre preco cheio. O input interno da rota ja chega sem
      // codigos; estas guardas mantem a regra dentro do provider tambem.
      couponCode: input.internalRenewal ? "" : input.couponCode,
      affiliateCode: input.internalRenewal ? "" : input.affiliateCode,
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
      // Codigo canonico da linha ativa. O valor bruto do navegador nao vira
      // atribuicao nem comissao.
      affiliate_code: validAffiliateCode || null,
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

  // EVENTO de checkout do creator quando o codigo de afiliado foi APROVADO pelo
  // resolver (que so aprova em primeira compra). Diferente do cartao e do
  // boleto, o Pix NAO tem o contador `trials` ao lado: `trials` so e somado no
  // checkout da Stripe, entao a serie de checkouts Pix nao tem par no contador.
  if (validAffiliateCode) {
    await recordCreatorEvent({
      eventType: "checkout",
      affiliateCode: validAffiliateCode,
      userId: input.user.id,
      subscriptionId: created.id,
      planId: plan.id,
      paymentMethod: "pix",
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
        // "Renovacao" no extrato do Asaas, para a pessoa e para quem concilia
        // distinguirem a segunda cobranca da primeira.
        description: `${input.internalRenewal ? "Renovação " : ""}Bora na Tech Pro ${PLAN_PRICING[input.planId].label}`,
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

  // (4) VENCIMENTO E FATURA, best-effort e FORA do try acima. Uma coluna que
  // ainda nao existe (o codigo sobe antes da migration) nao pode cancelar uma
  // venda: no mesmo update da amarracao, o erro de coluna cairia no `catch`
  // que cancela a linha e deixaria a cobranca viva no Asaas sem linha no
  // banco. Sem Sentry de proposito: na janela de deploy isto falharia em todo
  // checkout Pix, e o ruido esperado afogaria o resto.
  try {
    const { error: pixMetaError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        pix_due_date: charge.dueDate ?? null,
        pix_invoice_url: charge.invoiceUrl ?? null,
      })
      .eq("id", created.id);
    if (pixMetaError) {
      console.warn(
        `[asaas/checkout] vencimento e fatura nao gravados na linha ${created.id} (cobranca ${charge.id}): ${pixMetaError.code} ${pixMetaError.message}`,
      );
    }
  } catch (err) {
    console.warn(
      `[asaas/checkout] vencimento e fatura nao gravados na linha ${created.id} (cobranca ${charge.id}): ${err instanceof Error ? err.message : String(err)}`,
    );
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
    /** Liquido do Asaas. A taxa e `value - netValue`; ver server/lib/asaasLedger.ts. */
    netValue?: unknown;
    externalReference?: unknown;
    status?: unknown;
  } | null;
};

export type WebhookOutcome = {
  received: true;
  deduped?: true;
  unhandled?: true;
  activated?: boolean;
  /**
   * Dinheiro confirmado sem row nossa: registrado no ledger SEM dono e
   * respondido com 200. Ver `registrarPagamentoSemAssinatura`.
   */
  orphan?: true;
  /**
   * Pagamento que caiu numa linha ja `active` (cobranca diferente da que a
   * ativou) ou ja encerrada: nao ativa nada, mas o dinheiro foi contado no
   * ledger (`true`) ou nao pode ser, por payload sem valor (`false`). Ver
   * `registrarPagamentoForaDoFluxo`.
   */
  ledgered?: boolean;
};

/** Eventos que confirmam dinheiro recebido. */
const PAYMENT_EVENTS = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);
/** Eventos que encerram a charge sem pagamento. */
const CLOSING_EVENTS = new Set(["PAYMENT_OVERDUE", "PAYMENT_DELETED"]);
/**
 * Eventos de dinheiro que VOLTOU, integralmente.
 *
 * O que este ramo faz e SO REGISTRAR no ledger, e isso espelha o webhook da
 * Stripe: la, `charge.refunded` cai no mesmo `case` de `charge.succeeded` e
 * chama apenas `syncBalanceTransactions` (server/providers/stripe.ts:2039-2049).
 * O webhook nao revoga acesso, nao mexe em `subscriptions` e nao invalida cache
 * de Pro. Quem revoga e o caminho ADMINISTRATIVO (`decidirERevogar`, chamado por
 * POST /users/:id/refunds), e so quando a devolucao zera o saldo.
 *
 * Fazer diferente aqui daria ao Pix uma regra de revogacao que o cartao nao tem,
 * e a assimetria apareceria como "estornei os dois e um perdeu o acesso".
 */
const REFUND_EVENTS = new Set(["PAYMENT_REFUNDED"]);
/**
 * Estorno PARCIAL: reconhecido para virar alarme, NUNCA tratado.
 *
 * Fica fora de `REFUND_EVENTS` de proposito. `montarEstornoAsaas` nega o `value`
 * inteiro do pagamento, e o payload do parcial traz o valor original no mesmo
 * campo em que o total traz o devolvido: tratar os dois pelo mesmo caminho
 * gravaria um estorno integral sobre uma devolucao de parte, e o "Valor pago" do
 * cliente iria a zero com dinheiro nosso ainda em caixa.
 */
const PARTIAL_REFUND_EVENTS = new Set(["PAYMENT_PARTIALLY_REFUNDED"]);
/**
 * Estorno ACEITO e ainda nao liquidado. So atualiza o `provider_status` da
 * linha de `admin_refunds` que a rota administrativa gravou; NAO toca o ledger,
 * porque dinheiro em transito ainda nao saiu, e a linha negativa e do
 * `PAYMENT_REFUNDED`.
 */
const REFUND_PROGRESS_EVENTS = new Set(["PAYMENT_REFUND_IN_PROGRESS"]);

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
  // Instante em que o request CHEGOU, capturado antes de qualquer await. E o
  // fallback do `occurred_at` do ledger quando o `dateCreated` do event nao for
  // legivel, e precisa ser o instante da entrega, nao o do fim do
  // processamento.
  const receivedAtIso = new Date().toISOString();
  const eventType = asText(event.event);
  const eventId = asText(event.id);

  if (!eventType || !eventId) {
    // Sem eventType ou sem id nao ha o que deduplicar nem o que rotear. 200 mesmo
    // assim: reentregar nao melhora um payload que nao tem os campos.
    console.warn("[webhook/asaas] event sem id ou sem eventType; ignorando.");
    return { received: true, unhandled: true };
  }

  const chargeId = asText(event.payment?.id);
  const rowId = asText(event.payment?.externalReference);
  // `dateCreated` do event vem "2026-09-01 10:11:33", horario de Brasilia SEM
  // offset. Ate 2026-09-02 ele era gravado CRU nesta coluna e o Postgres o lia
  // como UTC: tres horas de erro, numa linha de aparencia normal. `null` quando
  // ilegivel, nunca o texto cru.
  const eventCreatedAtIso = instanteAsaas(event.dateCreated);

  // DEDUPE. `ignoreDuplicates` faz o conflito virar DO NOTHING: so a primeira
  // gravacao volta row.
  //
  // O REGISTRO ACONTECE ANTES DO TESTE DE `handled`, e isso e uma INVERSAO
  // deliberada em relacao ao webhook da Stripe, que no ramo `default` APAGA o
  // proprio billing_event para que um resend futuro alcance um handler novo.
  //
  // Os dois desenhos trocam a mesma coisa por outra. La, o preco de poder
  // reprocessar por resend e nao guardar rastro nenhum. Aqui, o preco de
  // guardar rastro e que um resend do Asaas chega deduplicado, entao a
  // recuperacao de um tipo que passa a ser tratado NAO e resend: e backfill a
  // partir destas linhas (scripts/asaasLedgerBackfill.mts), que le `raw` e
  // reconstroi o efeito.
  //
  // A inversao paga porque foi ela que faltou: um `PAYMENT_REFUNDED` chegou ao
  // `if (!handled) return` e nao deixou linha, nem em billing_events nem em
  // lugar nenhum. Sem o raw guardado nao existe backfill possivel, e o resend
  // do Asaas nao e infinito. Guardar preserva as duas saidas; apagar so
  // preserva uma.
  const { data: recorded, error: dedupeError } = await supabaseAdmin
    .from("billing_events")
    .upsert(
      {
        id: eventKey(eventId),
        provider: PROVIDER,
        event_type: eventType,
        provider_subscription_id: chargeId,
        payment_id: chargeId,
        event_created_at: eventCreatedAtIso,
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

  const handled =
    PAYMENT_EVENTS.has(eventType) ||
    CLOSING_EVENTS.has(eventType) ||
    REFUND_EVENTS.has(eventType) ||
    REFUND_PROGRESS_EVENTS.has(eventType);
  if (!handled) {
    if (PARTIAL_REFUND_EVENTS.has(eventType)) {
      // ESTORNO PARCIAL NAO E TRATADO, e o silencio seria pior que o alarme: o
      // dinheiro voltou em parte e nem o ledger nem a assinatura sabem. Sobe
      // como warning para alguem conciliar a mao, com o id do event, que e por
      // onde o backfill futuro acha a linha.
      Sentry.captureMessage("asaas_partial_refund_nao_tratado", {
        level: "warning",
        fingerprint: ["asaas-partial-refund-nao-tratado"],
        tags: { origem: "asaas-webhook", event_type: eventType },
        extra: {
          event_id: eventId,
          event_type: eventType,
          asaas_payment_id: chargeId,
        },
      });
    }
    console.log(
      `[webhook/asaas] event nao handled: ${eventType} (${eventId}); raw guardado em billing_events.`,
    );
    return { received: true, unhandled: true };
  }

  try {
    if (PAYMENT_EVENTS.has(eventType)) {
      return await activateOnPayment({
        event,
        eventType,
        eventId,
        chargeId,
        rowId,
        receivedAtIso,
      });
    }
    if (REFUND_EVENTS.has(eventType)) {
      await registrarEstornoNoLedger({
        event,
        eventType,
        eventId,
        chargeId,
        rowId,
        receivedAtIso,
      });
      await marcarStatusDoEstorno(chargeId, "REFUNDED");
      return { received: true, activated: false };
    }
    if (REFUND_PROGRESS_EVENTS.has(eventType)) {
      await marcarStatusDoEstorno(chargeId, "REFUND_IN_PROGRESS");
      return { received: true, activated: false };
    }
    await closePendingCharge({ eventType, eventId, chargeId, rowId, event });
    return { received: true, activated: false };
  } catch (err) {
    // Compensacao: apaga o registro para a reentrega reprocessar. Mesmo desenho
    // do webhook da Stripe.
    //
    // SO PARA EXCECAO INESPERADA (banco fora, RPC que falhou, rede). Reentrega
    // serve para falha TRANSITORIA: a segunda tentativa encontra o mundo
    // diferente e pode dar certo. Condicao DETERMINISTICA (pagamento sem row
    // nossa, payload sem valor) NAO passa por aqui: ela responde 200 e
    // registra, porque reentregar nao muda o payload nem faz a row aparecer.
    // Medido em 2026-09-03: um Pix avulso mandado direto para a chave da conta
    // caiu em "sem row", o handler lancou 500, o Asaas reentregou 15 vezes ao
    // longo de 12 horas e INTERROMPEU a fila da conta inteira, com o
    // PAYMENT_RECEIVED de um pagamento real preso atras. Ver
    // `registrarPagamentoSemAssinatura`.
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

/**
 * Localiza a row pendente pelo id da charge, com o id local como reserva.
 *
 * A DECISAO (qual chave tentar, em que ordem) mora em
 * `server/lib/asaasSubscriptionLookup.ts`; aqui ficam so as leituras reais. O
 * backfill reusa a mesma decisao com leituras por REST, porque ele nao pode
 * carregar o SDK do Supabase. Ver o cabecalho daquele arquivo.
 */
const LEITURA_REAL: LeituraDeAssinatura = {
  async porCobranca(chargeId) {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "id, user_id, status, plan_id, affiliate_code, coupon_code, provider_subscription_id",
      )
      .eq("provider_subscription_id", chargeId)
      .maybeSingle();
    if (error) throw error;
    return (data as AssinaturaDoAsaas | null) ?? null;
  },
  async porId(rowId) {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "id, user_id, status, plan_id, affiliate_code, coupon_code, provider_subscription_id",
      )
      .eq("id", rowId)
      .maybeSingle();
    if (error) throw error;
    return (data as AssinaturaDoAsaas | null) ?? null;
  },
};

export async function findSubscriptionRow(
  chargeId: string | null,
  rowId: string | null,
): Promise<AssinaturaDoAsaas | null> {
  return resolverAssinaturaDoAsaas(chargeId, rowId, LEITURA_REAL);
}

/**
 * Pagamento confirmado: ativa a row pendente pela RPC atomica.
 *
 * O PERIODO E CALCULADO AQUI, como no boleto, porque nao existe assinatura
 * remota de onde puxar. A ancora e a mesma regra: renovacao SOMA ao periodo
 * current em vez de substituir, para quem paga adiantado nao perder os dias que
 * faltavam.
 *
 * Devolve `activated: true` quando esta chamada foi a que ativou, `activated:
 * false` na reentrega, `orphan: true` quando nao ha row nossa para ativar, e
 * `ledgered` quando o pagamento caiu numa linha ja ativa ou ja encerrada
 * (contado no ledger, nada ativado).
 */
async function activateOnPayment(args: {
  event: AsaasEvent;
  eventType: string;
  eventId: string;
  chargeId: string | null;
  rowId: string | null;
  receivedAtIso: string;
}): Promise<WebhookOutcome> {
  const { event, eventType, eventId, chargeId, rowId, receivedAtIso } = args;

  const row = await findSubscriptionRow(chargeId, rowId);
  if (!row) {
    await registrarPagamentoSemAssinatura(args);
    return { received: true, orphan: true };
  }

  if (row.status === "active") {
    // REENTREGA do pagamento que ativou: a cobranca e a mesma. Idempotente.
    if (chargeId && chargeId === row.provider_subscription_id) {
      return { received: true, activated: false };
    }
    // PAGAMENTO NOVO NUMA LINHA JA ATIVA. Com a renovacao por linha nova
    // (lote 2b) isto so acontece por fluxo estranho, e ate 2026-09-06 era
    // engolido em silencio: 200, sem ledger, dinheiro sem rastro. Agora conta
    // o dinheiro e grita; NAO toca periodo, porque estender a partir daqui
    // seria conceder acesso por um pagamento que ninguem amarrou a um plano.
    const ledgered = await registrarPagamentoForaDoFluxo({
      ...args,
      row,
      mensagem: "asaas_pagamento_em_assinatura_ativa",
      fingerprint: "asaas-pagamento-em-assinatura-ativa",
      log: `[webhook/asaas] PAGAMENTO EM LINHA ATIVA: charge ${chargeId ?? "?"} numa linha ativada por ${row.provider_subscription_id ?? "?"} (row ${row.id}); entra no ledger, periodo intocado.`,
    });
    return { received: true, activated: false, ledgered };
  }

  if (row.status !== "pending") {
    // LINHA ENCERRADA (`canceled`, `superseded`). Ate 2026-09-06 lancava 500,
    // e 500 aqui e deterministico: a linha nao volta a `pending` sozinha, o
    // Asaas reentrega ate desistir e INTERROMPE a fila da conta, como no
    // incidente de 2026-09-03. A compensacao e a reentrega sao para excecao
    // inesperada; isto e um fato do payload. Conta o dinheiro, grita, 200.
    const ledgered = await registrarPagamentoForaDoFluxo({
      ...args,
      row,
      mensagem: "asaas_pagamento_em_assinatura_encerrada",
      fingerprint: "asaas-pagamento-em-assinatura-encerrada",
      log: `[webhook/asaas] PAGAMENTO EM LINHA ENCERRADA: charge ${chargeId ?? "?"} (row ${row.id}, status ${row.status}); entra no ledger, nada ativado.`,
    });
    return { received: true, activated: false, ledgered };
  }

  const { data: plan } = await supabaseAdmin
    .from("plans")
    .select("code, name")
    .eq("id", row.plan_id)
    .maybeSingle();
  const planCode = plan?.code;
  const accessDays =
    planCode && isKnownPlanId(planCode)
      ? oneOffAccessDays(planCode, "pix")
      : undefined;
  if (!accessDays) {
    // Sem dias de acesso nao da para calcular o periodo, e ativar com periodo
    // chutado seria conceder acesso por um prazo que ninguem vendeu.
    console.error(
      `[webhook/asaas] row ${row.id} sem plan com dias de Pix (code ${planCode ?? "?"}).`,
    );
    throw createError(500, "config_error", "Plano sem prazo de acesso Pix.");
  }

  // QUANDO O DINHEIRO ENTROU, pelo carimbo do PROVEDOR e nao pelo relogio
  // deste processo. `new Date()` aqui datava a ativacao pelo instante em que o
  // nosso servidor processou o webhook, o que erra sempre que a entrega atrasa
  // ou que o event e reprocessado, e o erro entra em `current_period_start` e no
  // `p_last_event_at`, ou seja, no prazo que a pessoa comprou.
  //
  // `dateCreated` do event vem em Brasilia sem offset; `instanteAsaas` poe o
  // offset explicito. Fallback e a chegada do request, nunca o relogio do fim do
  // processamento.
  const paidAt = new Date(instanteAsaas(event.dateCreated) ?? receivedAtIso);
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

  // A REGRA e compartilhada com o boleto (server/lib/renewalAnchor.ts).
  const { periodStart, periodEnd } = periodoDaRenovacao({
    paidAtMs: paidAt.getTime(),
    fimVigenteMs: current?.current_period_end
      ? new Date(current.current_period_end).getTime()
      : null,
    accessDays,
  });

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
    throw montarDbError(
      "webhook/asaas",
      "asaas activate subscription",
      error,
      "Ativação de assinatura sem result.",
      // O `console.error` que este helper substituiu carregava o `row.id`, e
      // sem ele nao da para achar QUAL linha ficou sem ativar.
      { rowId: row.id },
    );
  }
  if (!result.out_activated) return { received: true, activated: false };

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
    subscriptionId: row.id,
    planId: result.out_plan_id,
    // Este provedor so cria linha de Pix (o checkout grava payment_method
    // 'pix'), a mesma premissa do `oneOffAccessDays(planCode, "pix")` acima.
    paymentMethod: "pix",
  });

  // LEDGER POR ULTIMO, e NAO LANCA. A ordem e a postura de erro sao deliberadas:
  //
  // Depois porque o efeito que importa para a pessoa e o acesso, e ele ja esta
  // persistido pela RPC. Um ledger lento ou fora do ar nao pode atrasar nem
  // impedir a ativacao de quem pagou. Mesma logica de `decidirERevogar` acontecer
  // antes do sync na rota de reembolso.
  //
  // Sem lancar porque lancar aqui seria PIOR que o buraco que ele fecha: a
  // excecao subiria para o `catch` de `processAsaasEvent`, que APAGA o
  // billing_event como compensacao e devolve 500 para a fila reentregar. So que
  // a ativacao ja aconteceu e nao e desfeita, entao a reentrega encontraria a row
  // `active`, sairia por `return false` no reprocesso idempotente, e o e-mail de
  // confirmacao nao seria reenviado. Trocariamos uma linha de receita ausente por
  // um dedupe apagado e um efeito meio desfeito.
  //
  // O buraco que sobra e recuperavel e tem dono: o backfill
  // (scripts/asaasLedgerBackfill.mts) le `billing_events.raw`, que ja foi
  // gravado, e o indice unico `(provider, provider_transaction_id)` torna a
  // reexecucao um no-op.
  try {
    await registrarNoLedger(
      montarCobrancaAsaas({
        event,
        eventId,
        receivedAtIso,
        userId: result.out_user_id,
        planCode: plan?.code ?? null,
      }),
    );
  } catch (err) {
    Sentry.captureMessage("asaas_ledger_falhou", {
      level: "error",
      fingerprint: ["asaas-ledger-falhou"],
      tags: { origem: "asaas-webhook", event_type: eventType },
      extra: {
        event_id: eventId,
        asaas_payment_id: chargeId,
        err: err instanceof Error ? err.message : String(err),
      },
    });
    console.error(
      `[webhook/asaas] ativacao OK mas o ledger falhou (event ${eventId}); rode o backfill:`,
      err,
    );
  }

  return { received: true, activated: true };
}

/**
 * Dinheiro confirmado SEM row nossa: cobranca sem dono, nao erro.
 *
 * O CASO E REAL E NAO E BUG DE ROW: o Asaas cria cobranca sozinho para Pix
 * mandado direto a chave da conta ("Cobranca gerada automaticamente a partir
 * de Pix recebido"), sem `externalReference`, e dispara PAYMENT_RECEIVED para
 * ela. Nenhuma row de `subscriptions` vai existir, nem na reentrega.
 *
 * ATE 2026-09-03 ISTO LANCAVA 500, e o 500 era o incidente: o Asaas reentregou
 * o mesmo evento 15 vezes e interrompeu a fila da conta inteira. Um pagamento
 * real ficou preso atras dele, pago no Asaas e `pending` aqui. Lancar para
 * "nunca ser silencioso" custou mais silencio do que evitou.
 *
 * O QUE ACONTECE AGORA: a cobranca entra no ledger com `user_id` nulo, que e
 * exatamente a definicao de cobranca sem dono que o detector
 * (server/lib/chargeSemDono.ts) e o painel de orfaos ja leem; a linha de
 * `billing_events` fica, carimbada como processada; e o Sentry recebe um
 * warning com o id da cobranca. O dinheiro aparece, alguem decide, e a fila
 * segue.
 *
 * VALOR AUSENTE NO PAYLOAD tambem responde 200: e condicao deterministica, e
 * reentregar nao faz o valor aparecer. A linha do ledger nao e montada (o
 * ledger recusa inventar zero) e o aviso carrega `gross_cents: null`, que e o
 * sinal para conciliar a mao a partir do `raw` guardado em `billing_events`.
 */
async function registrarPagamentoSemAssinatura(args: {
  event: AsaasEvent;
  eventType: string;
  eventId: string;
  chargeId: string | null;
  receivedAtIso: string;
}): Promise<void> {
  await registrarPagamentoForaDoFluxo({
    ...args,
    row: null,
    mensagem: "asaas_pagamento_sem_assinatura",
    fingerprint: "asaas-pagamento-sem-assinatura",
    log: `[webhook/asaas] PAGAMENTO SEM LINHA: charge ${args.chargeId ?? "?"} (event ${args.eventId}); entra no ledger sem dono.`,
  });
}

/**
 * Pagamento confirmado que NAO ativa nada: sem linha, em linha ja ativa, ou
 * em linha encerrada. O tratamento e um so, e a diferenca entre os tres casos
 * e quem e o dono (a linha, quando existe) e qual aviso sobe.
 *
 * O que sempre acontece: (1) a cobranca entra no ledger, com o `user_id` e o
 * `plan_code` da linha quando ha linha, sem dono quando nao ha; (2) a linha de
 * `billing_events` fica, carimbada como processada; (3) o Sentry recebe um
 * warning nomeado com os ids. Responder 200 e obrigacao do chamador.
 *
 * VALOR AUSENTE NO PAYLOAD tambem segue: e condicao deterministica, e
 * reentregar nao faz o valor aparecer. A linha do ledger nao e montada (o
 * ledger recusa inventar zero), o aviso carrega `gross_cents: null`, e o
 * retorno `false` diz ao chamador que o dinheiro NAO foi contado.
 */
async function registrarPagamentoForaDoFluxo(args: {
  event: AsaasEvent;
  eventType: string;
  eventId: string;
  chargeId: string | null;
  receivedAtIso: string;
  row: AssinaturaDoAsaas | null;
  mensagem: string;
  fingerprint: string;
  log: string;
}): Promise<boolean> {
  const {
    event,
    eventType,
    eventId,
    chargeId,
    receivedAtIso,
    row,
    mensagem,
    fingerprint,
    log,
  } = args;
  const grossCents = centavosAsaas(event.payment?.value);

  console.warn(log);

  let planCode: string | null = null;
  if (row?.plan_id) {
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("code")
      .eq("id", row.plan_id)
      .maybeSingle();
    planCode = plan?.code ?? null;
  }

  let linha: ReturnType<typeof montarCobrancaAsaas> | null = null;
  try {
    linha = montarCobrancaAsaas({
      event,
      eventId,
      receivedAtIso,
      userId: row?.user_id ?? null,
      planCode,
    });
  } catch (err) {
    // Sem id ou sem valor: a linha nao tem identidade ou nao tem numero. Os
    // dois sao do payload, nao do ambiente; seguem sem ledger e com aviso.
    console.warn(
      `[webhook/asaas] cobranca fora do fluxo nao montavel (event ${eventId}):`,
      err instanceof Error ? err.message : String(err),
    );
  }
  if (linha) await registrarNoLedger(linha);

  const { error: carimboError } = await supabaseAdmin
    .from("billing_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("id", eventKey(eventId));
  if (carimboError) {
    console.error(
      `[webhook/asaas] falha ao carimbar processed_at de ${eventId}:`,
      carimboError,
    );
  }

  Sentry.captureMessage(mensagem, {
    level: "warning",
    fingerprint: [fingerprint],
    tags: { origem: "asaas-webhook", event_type: eventType },
    extra: {
      event_id: eventId,
      asaas_payment_id: chargeId,
      gross_cents: grossCents,
      subscription_id: row?.id ?? null,
      subscription_status: row?.status ?? null,
    },
  });

  return linha !== null;
}

/**
 * Estorno confirmado: grava a linha negativa e para por ai.
 *
 * NAO revoga acesso e NAO mexe em `subscriptions`, porque e exatamente isso que
 * o webhook da Stripe faz em `charge.refunded` (ver o comentario de
 * `REFUND_EVENTS`). A revogacao continua sendo decisao administrativa.
 *
 * O DONO vem da row de `subscriptions`, pelo mesmo resolver do pagamento. Sem
 * row, a linha entra SEM dono em vez de nao entrar: dinheiro que saiu precisa
 * aparecer no caixa mesmo quando nao se sabe de quem era, e o detector de
 * cobranca sem dono existe para essa fila. Perder a linha seria pior.
 *
 * AQUI LANCA, ao contrario do ledger da ativacao, e a assimetria e o ponto: este
 * ramo NAO tem outro efeito ja persistido para proteger. Falhar, apagar o dedupe
 * e deixar a fila reentregar e a recuperacao certa, sem nada meio feito atras.
 */
async function registrarEstornoNoLedger(args: {
  event: AsaasEvent;
  eventType: string;
  eventId: string;
  chargeId: string | null;
  rowId: string | null;
  receivedAtIso: string;
}): Promise<void> {
  const { event, eventId, chargeId, rowId, receivedAtIso } = args;

  const row = await findSubscriptionRow(chargeId, rowId);
  if (!row) {
    console.warn(
      `[webhook/asaas] ESTORNO SEM LINHA: charge ${chargeId ?? "?"} (event ${eventId}); a linha entra sem dono.`,
    );
  }

  let planCode: string | null = null;
  if (row?.plan_id) {
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("code")
      .eq("id", row.plan_id)
      .maybeSingle();
    planCode = plan?.code ?? null;
  }

  await registrarNoLedger(
    montarEstornoAsaas({
      event,
      eventId,
      receivedAtIso,
      userId: row?.user_id ?? null,
      planCode,
    }),
  );
}

/**
 * Atualiza o `provider_status` da linha de `admin_refunds` deste estorno, se
 * ela existir.
 *
 * A LINHA E OPCIONAL: estorno feito direto no painel do Asaas nunca passou pela
 * rota administrativa e nao tem linha; o update filtra por
 * `(provider, provider_refund_id)` e simplesmente nao casa nada. O
 * `provider_refund_id` de um estorno do Asaas E o id do pagamento (ver o insert
 * em server/routes/admin.ts, `reembolsarNoAsaas`).
 *
 * NAO LANCA: o efeito principal (ledger, no `PAYMENT_REFUNDED`) ja aconteceu, e
 * um rotulo desatualizado na tela nao justifica apagar o dedupe e reprocessar.
 */
async function marcarStatusDoEstorno(
  chargeId: string | null,
  status: "REFUND_IN_PROGRESS" | "REFUNDED",
): Promise<void> {
  if (!chargeId) return;
  const { error } = await supabaseAdmin
    .from("admin_refunds")
    .update({ provider_status: status })
    .eq("provider", PROVIDER)
    .eq("provider_refund_id", chargeId);
  if (error) {
    console.error(
      `[webhook/asaas] falha ao marcar provider_status=${status} de ${chargeId}:`,
      error,
    );
  }
}

/**
 * Cobranca vencida ou removida: encerra a row pendente.
 *
 * Condicional em `pending` (idempotente) e SEM efeitos de transicao: a pessoa
 * nunca teve acesso, entao e-mail de cancelamento seria errado. Efeito colateral
 * desejado, igual ao do boleto: sair de `pending` libera o guard 409 e a pessoa
 * pode tentar de novo.
 *
 * EXPORTADA para o cancelamento pelo proprio cliente (POST
 * /api/billing/cancel-pending), que fecha a linha na mesma requisicao em que o
 * Asaas confirma a exclusao. O PAYMENT_DELETED que chega depois passa por aqui
 * de novo e cai no filtro `status = pending`: nao escreve nada.
 */
export async function closePendingCharge(args: {
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
    return (await lerPagamento(chargeId)).valueCents;
  } catch (err) {
    console.error(
      `[asaas] falha ao ler o valor da cobranca ${chargeId}; o card cai no preco do plano:`,
      err,
    );
    return null;
  }
}

/** O que a faixa de saude le de um webhook cadastrado no Asaas. */
export type WebhookDoAsaas = { enabled: boolean; interrupted: boolean };

/** Estado da fila de webhooks, como a faixa de saude o consome. */
export type EstadoDaFila = "ok" | "interrompido" | "desligado";

/**
 * Le os webhooks cadastrados na conta (GET /webhooks), so os dois bits que
 * decidem se evento chega.
 *
 * `interrupted` e o que o Asaas liga depois de uma sequencia de entregas com
 * falha: a fila da conta INTEIRA para, e nada nosso acusa, porque o sintoma e
 * silencio (medido em 2026-09-03: tres dias parada, um pagamento real preso).
 * PROPAGA o erro do cliente; quem chama decide o que "nao sei" vira.
 */
export async function listarWebhooks(): Promise<WebhookDoAsaas[]> {
  const corpo = await asaasFetch<{ data?: unknown }>("/webhooks");
  const lista = Array.isArray(corpo?.data) ? corpo.data : [];
  const saida: WebhookDoAsaas[] = [];
  for (const item of lista) {
    if (!item || typeof item !== "object") continue;
    const w = item as { enabled?: unknown; interrupted?: unknown };
    saida.push({
      enabled: w.enabled === true,
      interrupted: w.interrupted === true,
    });
  }
  return saida;
}

/**
 * Classifica a lista de webhooks num unico estado.
 *
 * `interrompido` prevalece: e o estado que segura evento ja enfileirado, e o
 * unico que exige alguem clicar em "reativar" no painel. `desligado` cobre o
 * webhook desativado E a conta sem webhook nenhum, porque os dois significam a
 * mesma coisa para nos, evento nenhum chega.
 */
export function estadoDaFilaDeWebhooks(
  webhooks: WebhookDoAsaas[],
): EstadoDaFila {
  if (webhooks.some((w) => w.interrupted)) return "interrompido";
  if (webhooks.length === 0 || webhooks.some((w) => !w.enabled))
    return "desligado";
  return "ok";
}

/** Um item de `refunds[]` do objeto de pagamento do Asaas, ja normalizado. */
export type EstornoDoAsaas = {
  /** `PENDING` | `AWAITING_CRITICAL_ACTION_AUTHORIZATION` | `DONE` | `CANCELLED`. */
  status: string;
  valueCents: number | null;
  /** `YYYY-MM-DD HH:MM:SS` em Brasilia, como o Asaas manda. Ordena por texto. */
  dateCreated: string | null;
};

export type PagamentoDoAsaas = {
  status: string | null;
  valueCents: number | null;
  /** Vencimento da cobranca, `YYYY-MM-DD`. O prazo que governa o QR. */
  dueDate: string | null;
  /** Fatura hospedada da cobranca; o lembrete de Pix a oferece como saida. */
  invoiceUrl: string | null;
  refunds: EstornoDoAsaas[];
  /** Cobranca removida no Asaas. So `true` literal conta; ausente vira `false`. */
  deleted: boolean;
};

/** Recorte do objeto de pagamento do Asaas que este modulo le. */
type AsaasPaymentBody = {
  status?: unknown;
  value?: unknown;
  dueDate?: unknown;
  invoiceUrl?: unknown;
  refunds?: unknown;
  deleted?: unknown;
};

/**
 * Normaliza um objeto de pagamento do Asaas (resposta de GET /payments/{id} e
 * tambem do POST /refund, que devolve o mesmo objeto).
 *
 * `refunds` vem `null` na cobranca sem estorno (medido em 2026-09-06) e array
 * nas demais; as duas viram lista, para o chamador nao ter dois casos.
 */
function pagamentoDoAsaas(corpo: AsaasPaymentBody | null): PagamentoDoAsaas {
  const lista = Array.isArray(corpo?.refunds) ? corpo.refunds : [];
  const refunds: EstornoDoAsaas[] = [];
  for (const item of lista) {
    if (!item || typeof item !== "object") continue;
    const r = item as {
      status?: unknown;
      value?: unknown;
      dateCreated?: unknown;
    };
    if (typeof r.status !== "string") continue;
    refunds.push({
      status: r.status,
      valueCents: centavosAsaas(r.value),
      dateCreated: typeof r.dateCreated === "string" ? r.dateCreated : null,
    });
  }
  return {
    status: typeof corpo?.status === "string" ? corpo.status : null,
    valueCents: centavosAsaas(corpo?.value),
    dueDate: typeof corpo?.dueDate === "string" ? corpo.dueDate : null,
    invoiceUrl:
      typeof corpo?.invoiceUrl === "string" && corpo.invoiceUrl
        ? corpo.invoiceUrl
        : null,
    refunds,
    deleted: corpo?.deleted === true,
  };
}

/**
 * Le uma cobranca do Asaas: status, valor e a lista de estornos.
 *
 * Existe porque o estorno do Asaas pode ficar parado ANTES de mudar o status da
 * cobranca (autorizacao critica, ver `estornarPagamento`), e a unica forma de
 * saber que ele existe e olhar `refunds[]`. PROPAGA o erro do cliente: quem
 * chama decide se falha fechada (a rota de estorno) ou degrada
 * (`fetchChargeAmountCents`).
 */
export async function lerPagamento(
  paymentId: string,
): Promise<PagamentoDoAsaas> {
  const corpo = await asaasFetch<AsaasPaymentBody>(
    `/payments/${encodeURIComponent(paymentId)}`,
  );
  return pagamentoDoAsaas(corpo);
}

/**
 * O estorno MAIS RECENTE de `refunds[]`, por `dateCreated`.
 *
 * O mais recente e o que descreve o estado atual: um `CANCELLED` de ontem
 * seguido de um `PENDING` de hoje e um estorno em curso, e o inverso e um
 * estorno cancelado. A ordem do array nao e garantida pela documentacao, e por
 * isso nao se le `refunds[0]`.
 */
export function estornoMaisRecente(
  refunds: EstornoDoAsaas[],
): EstornoDoAsaas | null {
  let melhor: EstornoDoAsaas | null = null;
  for (const r of refunds) {
    if (!melhor || (r.dateCreated ?? "") >= (melhor.dateCreated ?? "")) {
      melhor = r;
    }
  }
  return melhor;
}

/**
 * Status de item de `refunds[]` que significam "o pedido foi aceito".
 *
 * `AWAITING_CRITICAL_ACTION_AUTHORIZATION` e o caso medido em 2026-09-03: a
 * conta exige aprovacao (app ou painel) para estornar, o Asaas cria o estorno
 * e o deixa aguardando, e o status da COBRANCA continua `RECEIVED`. Ler so o
 * status da cobranca dizia "recusou" sobre um estorno que existia.
 */
const STATUS_DE_REFUND_ACEITO = new Set([
  "PENDING",
  "AWAITING_CRITICAL_ACTION_AUTHORIZATION",
  "DONE",
]);

/**
 * Status que o Asaas devolve depois de aceitar um pedido de estorno.
 *
 * OS TRES SAO SUCESSO, e reduzir a lista a `REFUNDED` seria o erro caro. A
 * documentacao do provedor lista `REFUND_REQUESTED` e `REFUND_IN_PROGRESS` ao
 * lado de `REFUNDED` no enum de status da cobranca, e o segundo e descrito como
 * "estorno em processamento, a liquidacao ja esta agendada". Tratar isso como
 * falha faria o admin ver "nao devolveu" sobre um estorno que o Asaas ja
 * aceitou, e a acao obvia dele seria pedir de novo.
 *
 * O ESTADO TERMINAL VEM PELO WEBHOOK, nao daqui: `PAYMENT_REFUNDED` e quem grava
 * a linha negativa no ledger. Esta resposta so diz "o pedido foi aceito".
 */
const STATUS_DE_ESTORNO_ACEITO = new Set([
  "REFUNDED",
  "REFUND_REQUESTED",
  "REFUND_IN_PROGRESS",
]);

export type EstornoAsaas = {
  /**
   * Status do ESTORNO quando `refunds[]` veio na resposta (o mais recente),
   * senao o status da cobranca. Em qualquer caso, um dos aceitos.
   */
  status: string;
  /** Corpo inteiro, para auditoria e diagnostico. */
  raw: unknown;
};

/**
 * Estorna uma cobranca do Asaas, SEMPRE integralmente.
 *
 * `value` NAO e enviado, e a ausencia e o que faz o estorno ser integral (a
 * documentacao do provedor: omitido, "o estorno sera integral"). Mandar o valor
 * calculado por nos seria pior de duas formas: um centavo de divergencia entre o
 * nosso `gross_cents` e o valor do lado deles viraria um estorno PARCIAL sem
 * ninguem pedir, e o parcial e justamente o que este lote nao trata (o webhook
 * so trata `PAYMENT_REFUNDED`, nao `PAYMENT_PARTIALLY_REFUNDED`). Omitir delega
 * o valor a quem tem a verdade sobre ele.
 *
 * O CAMINHO NAO LEVA `/v3`: ele ja esta em `ASAAS_API_URL`, como em todos os
 * outros call sites deste arquivo.
 *
 * `status` inesperado num 200 LANCA em vez de passar. Um `CONFIRMED` de volta
 * significa que a cobranca segue paga e o estorno nao aconteceu; gravar
 * `admin_refunds` sobre isso registraria uma devolucao que nao existe, e o
 * "Valor pago" do cliente iria a zero com o dinheiro ainda em caixa.
 */
export async function estornarPagamento(
  paymentId: string,
  args: { descricao: string },
): Promise<EstornoAsaas> {
  const resposta = await asaasFetch<AsaasPaymentBody>(
    `/payments/${encodeURIComponent(paymentId)}/refund`,
    { method: "POST", body: { description: args.descricao } },
  );

  const pagamento = pagamentoDoAsaas(resposta);
  const refund = estornoMaisRecente(pagamento.refunds);
  // O ITEM DE `refunds[]` DECIDE QUANDO EXISTE: e ele que sabe de um estorno
  // parado em autorizacao enquanto a cobranca ainda diz `RECEIVED`. Sem item,
  // vale o status da cobranca, como antes.
  const status = refund?.status ?? pagamento.status;
  const aceito = refund
    ? STATUS_DE_REFUND_ACEITO.has(refund.status)
    : Boolean(status && STATUS_DE_ESTORNO_ACEITO.has(status));
  if (!status || !aceito) {
    throw createError(
      502,
      "asaas_refund_rejected",
      "O Asaas nao confirmou o estorno. Nada foi devolvido.",
      {
        context: {
          asaas_status: pagamento.status ?? "ausente",
          asaas_refund_status: refund?.status ?? "ausente",
          payment_id: paymentId,
        },
      },
    );
  }

  return { status, raw: resposta };
}

/** Status de cobranca do Asaas que significam dinheiro recebido. */
const STATUS_DE_COBRANCA_PAGA = new Set([
  "RECEIVED",
  "CONFIRMED",
  "RECEIVED_IN_CASH",
]);

export type CancelamentoDaCobranca =
  | { resultado: "cancelada" }
  | { resultado: "already_paid"; status: string }
  | { resultado: "falha"; motivo: string };

/**
 * Exclui uma cobranca pendente no Asaas (DELETE /payments/{id}).
 *
 * NUNCA LANCA: todo desfecho volta tipado, porque quem chama decide se fecha a
 * linha local, e so pode fechar quando o Asaas confirmou.
 *
 * O ERRO DO DELETE NAO E LIDO PELO CORPO. A documentacao do provedor da o
 * sucesso (`{ deleted: true, id }`) e NAO documenta o erro de uma cobranca ja
 * recebida (conferido em 2026-09-11). Em vez de casar texto de erro, uma recusa
 * 4xx e seguida de um GET, e o STATUS da cobranca decide, em tres baldes:
 *   - paga (`STATUS_DE_COBRANCA_PAGA`): `already_paid`, o webhook ativa;
 *   - ja removida (`deleted` ou `CANCELLED`): `cancelada`, idempotente (duplo
 *     clique, corrida com exclusao pelo painel);
 *   - qualquer outra coisa, GET falho incluido: `falha`.
 * 5xx e falha de transporte nao passam pelo GET: o DELETE pode nem ter chegado,
 * e o estado do outro lado nao e o que a recusa diz. Fail-closed sempre.
 */
export async function cancelPayment(
  paymentId: string,
): Promise<CancelamentoDaCobranca> {
  try {
    const corpo = await asaasFetch<{ deleted?: unknown }>(
      `/payments/${encodeURIComponent(paymentId)}`,
      { method: "DELETE" },
    );
    if (corpo?.deleted === true) return { resultado: "cancelada" };
    // 2xx sem a confirmacao: nao da para afirmar que a cobranca morreu.
    console.warn(
      `[asaas/cancel] DELETE de ${paymentId} respondeu sem deleted=true.`,
    );
    return { resultado: "falha", motivo: "delete_sem_confirmacao" };
  } catch (err) {
    const status = (err as AppError | null)?.context?.asaas_status;
    if (typeof status !== "number" || status < 400 || status >= 500) {
      console.warn(
        `[asaas/cancel] DELETE de ${paymentId} falhou sem recusa 4xx (status ${String(status ?? "ausente")}).`,
      );
      return { resultado: "falha", motivo: "delete_sem_recusa_4xx" };
    }
  }

  let pagamento: PagamentoDoAsaas;
  try {
    pagamento = await lerPagamento(paymentId);
  } catch (err) {
    console.warn(
      `[asaas/cancel] DELETE de ${paymentId} recusado e a leitura falhou:`,
      err instanceof Error ? err.message : String(err),
    );
    return { resultado: "falha", motivo: "leitura_falhou" };
  }

  if (pagamento.status && STATUS_DE_COBRANCA_PAGA.has(pagamento.status)) {
    return { resultado: "already_paid", status: pagamento.status };
  }
  if (pagamento.deleted || pagamento.status === "CANCELLED") {
    return { resultado: "cancelada" };
  }
  console.warn(
    `[asaas/cancel] DELETE de ${paymentId} recusado com a cobranca em ${pagamento.status ?? "status ausente"}.`,
  );
  return {
    resultado: "falha",
    motivo: `status_${pagamento.status ?? "ausente"}`,
  };
}
