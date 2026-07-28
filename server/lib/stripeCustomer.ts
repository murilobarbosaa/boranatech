// Resolucao do Stripe Customer de um usuario, com reuso.
//
// Antes: `createCheckout` passava `customer_email` e nunca `customer`, e o
// Checkout criava um Customer NOVO em cada sessao submetida. Ver a migration
// 20260728200000_create_stripe_customers.sql para a medicao e o porque.
//
// TODA a resolucao vive AQUI, e o call site apenas pede o id. E a regra de guarda
// dentro da funcao: `createCheckout` tem dois ramos (cartao e boleto) e ambos
// precisam do mesmo tratamento, incluindo a assercao de metadata. Guarda escrita
// no chamador teria que ser repetida nos dois e sumiria no primeiro que alguem
// esquecesse.

import * as Sentry from "@sentry/node";
import type Stripe from "stripe";

import { env } from "./env";
import { getStripe } from "./stripeClient";
import { supabaseAdmin } from "./supabaseAdmin";
import { createError } from "../middleware/error";

/**
 * Modo esperado, derivado do PREFIXO da chave.
 *
 * Usado apenas para LER a linha certa do mapeamento (a chave e (user_id,
 * livemode) e nao ha objeto da Stripe em maos ainda). Quem CONFIRMA o modo e a
 * API: todo Customer criado ou lido passa por `conferirModo`, que compara
 * `customer.livemode` com este valor e aborta na divergencia. Assim o prefixo
 * nunca e a ultima palavra, so o palpite inicial.
 */
export function livemodeEsperado(): boolean {
  return env.stripeSecretKey.startsWith("sk_live_");
}

function conferirModo(customer: Stripe.Customer, esperado: boolean): void {
  if (customer.livemode !== esperado) {
    // Nao ha caminho seguro daqui: a chave e de um modo e o objeto e de outro.
    // Falha fechada, porque seguir gravaria um cus_ do modo errado no mapeamento.
    throw createError(
      500,
      "config_error",
      "Modo do Stripe Customer divergente da chave configurada.",
    );
  }
}

/**
 * ASSERCAO OBRIGATORIA antes de usar um Customer existente.
 *
 * Sem ela, um mapeamento errado (bug, backfill torto, edicao manual) faria o
 * checkout do usuario A rodar sobre o Customer de B. Enquanto nenhum
 * PaymentMethod for salvo isso nao cobra o cartao de outra pessoa, e por isso
 * `payment_method_save` PERMANECE DESLIGADO nesta fase, como invariante de
 * desenho e nao como preferencia, mas ainda misturaria historico e
 * pre-preenchimento. Divergencia ABORTA o checkout.
 */
function conferirDono(customer: Stripe.Customer, userId: string): void {
  const dono = customer.metadata?.supabase_user_id;
  if (dono && dono !== userId) {
    console.error(
      `[stripeCustomer] DONO DIVERGENTE: customer ${customer.id} tem supabase_user_id=${dono}, ` +
        `esperado ${userId}. Checkout abortado.`,
    );
    throw createError(
      500,
      "customer_owner_mismatch",
      "Não foi possível confirmar seu cadastro de pagamento. Fale com o suporte.",
    );
  }
  // metadata AUSENTE nao aborta: os Customers criados antes desta mudanca (e os
  // eleitos no backfill) nao tem o campo. O UNIQUE em stripe_customer_id ja
  // garante que aquele cus_ nao esta mapeado para outro usuario, que e a
  // propriedade que importa. `garantirMetadata` preenche na primeira vez.
}

async function garantirMetadata(
  customer: Stripe.Customer,
  userId: string,
): Promise<void> {
  if (customer.metadata?.supabase_user_id === userId) return;
  try {
    await getStripe().customers.update(customer.id, {
      metadata: { ...customer.metadata, supabase_user_id: userId },
    });
  } catch (err) {
    // Best-effort: a ausencia de metadata nao impede o checkout (conferirDono
    // tolera ausente), entao falhar aqui seria pior que seguir.
    console.warn(
      `[stripeCustomer] nao foi possivel carimbar supabase_user_id em ${customer.id}:`,
      err,
    );
  }
}

async function criarCustomer(
  userId: string,
  email: string | undefined,
  livemode: boolean,
): Promise<Stripe.Customer> {
  const customer = await getStripe().customers.create({
    email: email || undefined,
    metadata: { supabase_user_id: userId },
  });
  conferirModo(customer, livemode);
  return customer;
}

/** Le o mapeamento. Erro de query NUNCA vira "nao existe". */
async function lerMapeamento(
  userId: string,
  livemode: boolean,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .eq("livemode", livemode)
    .limit(1);
  if (error) {
    // Fail-closed, igual aos guards de createCheckout: um erro de leitura que
    // virasse "nao tem mapeamento" criaria um Customer duplicado a cada falha do
    // banco, que e exatamente o defeito que esta tabela remove.
    console.error("[stripeCustomer] falha ao ler mapeamento; abortando:", error);
    throw createError(
      500,
      "db_error",
      "Não foi possível verificar seu cadastro de pagamento. Tente novamente.",
    );
  }
  return data?.[0]?.stripe_customer_id ?? null;
}

/**
 * Resultado da resolucao.
 *
 * DOIS desfechos, nao um id com excecao para tudo. A versao anterior lancava em
 * QUALQUER falha, o que colapsava dois casos muito diferentes:
 *
 *   DIVERGENCIA   o mapeamento aponta para o Customer de OUTRO usuario, ou o modo
 *                 (live/test) nao bate. Isso e defeito de dado e continua
 *                 ABORTANDO o checkout. Falha fechada.
 *
 *   INDISPONIBILIDADE  erro de rede, timeout, rate limit do Supabase, tabela
 *                 inacessivel. Nao ha nada de errado com o usuario, e derrubar o
 *                 checkout por isso troca uma venda perdida por um Customer
 *                 duplicado. Degrada para `customer_email`, que e LITERALMENTE o
 *                 comportamento de producao hoje em 100% das sessoes.
 */
export type ResolucaoCustomer =
  | { modo: "reuso"; customerId: string }
  | { modo: "degradado"; motivo: string };

/**
 * Reporta a degradacao num lugar CONTAVEL.
 *
 * console.error e greppavel, nao contavel. O Sentry conta evento por issue e
 * mostra a curva no tempo, que e a pergunta real ("isto esta acontecendo com que
 * frequencia?"). Mesmo idioma de server/routes/stats.ts:33
 * (`captureMessage("[stats] users-count degraded")`), para as duas degradacoes do
 * produto aparecerem com a mesma cara.
 */
function reportarDegradacao(motivo: string, userId: string, err?: unknown): void {
  console.error(
    `[stripeCustomer] DEGRADADO (${motivo}) para o user ${userId}; seguindo com customer_email. ` +
      "O pior resultado e um Customer duplicado.",
    err ?? "",
  );
  try {
    Sentry.captureMessage("[billing] stripe_customer_lookup degraded", {
      level: "warning",
      tags: { motivo },
      extra: { userId, erro: err instanceof Error ? err.message : String(err ?? "") },
    });
  } catch {
    // Sentry indisponivel nao pode derrubar o checkout que acabamos de salvar.
  }
}

/** Erro transitorio da Stripe: nao autoriza concluir nada, mas nao e divergencia. */
function ehTransitorioStripe(err: unknown): boolean {
  const e = err as Stripe.errors.StripeError;
  return !(e?.code === "resource_missing" || e?.statusCode === 404);
}

/**
 * Resolve (ou cria) o Customer do usuario.
 *
 * CORRIDA (dois checkouts simultaneos do mesmo usuario): ambos leem mapeamento
 * vazio e ambos criam um Customer na Stripe. O upsert com ignoreDuplicates decide
 * quem ganha; o PERDEDOR rele o mapeamento e passa a usar o Customer do vencedor.
 * O Customer que o perdedor criou fica ORFAO na Stripe.
 *
 * O orfao NAO PODE RECEBER COBRANCA: ele nunca entra em `stripe_customers` (o
 * conflito o rejeitou), nunca e devolvido por esta funcao, e portanto nunca chega
 * ao `customer:` de uma Checkout Session. Sem sessao, nao ha cobranca.
 */
export async function resolveStripeCustomerId(
  userId: string,
  email: string | undefined,
): Promise<ResolucaoCustomer> {
  const livemode = livemodeEsperado();
  const stripe = getStripe();

  let mapeado: string | null;
  try {
    mapeado = await lerMapeamento(userId, livemode);
  } catch (err) {
    // Tabela inacessivel / rate limit / rede. Nao e divergencia.
    reportarDegradacao("leitura_do_mapeamento", userId, err);
    return { modo: "degradado", motivo: "leitura_do_mapeamento" };
  }

  if (mapeado) {
    // SO a chamada de rede fica dentro do try. As assercoes de divergencia ficam
    // FORA, e isso nao e estilo: com elas dentro, o `catch` abaixo capturava o
    // proprio throw de `conferirModo`/`conferirDono`, `ehTransitorioStripe` nao
    // reconhecia o createError, e a DIVERGENCIA virava DEGRADACAO -- exatamente o
    // colapso dos dois casos que este bloco existe para desfazer. Pego por
    // stripeCustomer.test.ts na primeira execucao.
    let existente: Stripe.Customer | Stripe.DeletedCustomer | null = null;
    try {
      existente = await stripe.customers.retrieve(mapeado);
    } catch (err) {
      if (ehTransitorioStripe(err)) {
        reportarDegradacao("stripe_indisponivel", userId, err);
        return { modo: "degradado", motivo: "stripe_indisponivel" };
      }
      console.warn(
        `[stripeCustomer] customer ${mapeado} nao existe mais na Stripe; recriando para o user ${userId}.`,
      );
    }

    if (existente && !(existente as Stripe.DeletedCustomer).deleted) {
      const customer = existente as Stripe.Customer;
      conferirModo(customer, livemode);
      conferirDono(customer, userId);
      await garantirMetadata(customer, userId);
      return { modo: "reuso", customerId: customer.id };
    }
    if (existente) {
      console.warn(
        `[stripeCustomer] customer ${mapeado} esta deletado na Stripe; recriando para o user ${userId}.`,
      );
    }

    let novo: Stripe.Customer;
    try {
      novo = await criarCustomer(userId, email, livemode);
    } catch (err) {
      reportarDegradacao("criacao_do_customer", userId, err);
      return { modo: "degradado", motivo: "criacao_do_customer" };
    }
    const { error } = await supabaseAdmin
      .from("stripe_customers")
      .update({ stripe_customer_id: novo.id })
      .eq("user_id", userId)
      .eq("livemode", livemode);
    if (error) {
      // O Customer E do usuario (metadata carimbado na criacao), entao USAR e
      // correto e melhor que degradar: a cobranca vai para o lugar certo. O que
      // falhou foi so a PERSISTENCIA, e o custo disso e um duplicado na proxima
      // tentativa, que e o estado de hoje.
      reportarDegradacao("persistencia_do_mapeamento", userId, error);
      return { modo: "reuso", customerId: novo.id };
    }
    return { modo: "reuso", customerId: novo.id };
  }

  let criado: Stripe.Customer;
  try {
    criado = await criarCustomer(userId, email, livemode);
  } catch (err) {
    reportarDegradacao("criacao_do_customer", userId, err);
    return { modo: "degradado", motivo: "criacao_do_customer" };
  }

  const { data, error } = await supabaseAdmin
    .from("stripe_customers")
    .upsert(
      { user_id: userId, stripe_customer_id: criado.id, livemode },
      { onConflict: "user_id,livemode", ignoreDuplicates: true },
    )
    .select("stripe_customer_id");
  if (error) {
    reportarDegradacao("persistencia_do_mapeamento", userId, error);
    return { modo: "reuso", customerId: criado.id };
  }

  // Vazio = perdeu a corrida. O vencedor ja gravou; rele e usa o dele.
  if ((data?.length ?? 0) === 0) {
    let vencedor: string | null = null;
    try {
      vencedor = await lerMapeamento(userId, livemode);
    } catch (err) {
      reportarDegradacao("releitura_pos_corrida", userId, err);
    }
    if (!vencedor) {
      // Nao conseguiu descobrir o vencedor. O Customer recem-criado E do usuario
      // (metadata carimbado), entao usar e seguro; so nao ficou mapeado.
      reportarDegradacao("corrida_sem_vencedor", userId);
      return { modo: "reuso", customerId: criado.id };
    }
    console.warn(
      `[stripeCustomer] corrida na criacao (user ${userId}): customer ${criado.id} ficou ORFAO, ` +
        `usando ${vencedor}. O orfao nunca entra em stripe_customers, entao nao pode ser cobrado.`,
    );
    return { modo: "reuso", customerId: vencedor };
  }

  return { modo: "reuso", customerId: criado.id };
}
