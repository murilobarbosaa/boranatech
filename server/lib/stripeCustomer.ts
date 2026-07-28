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
 * Resolve (ou cria) o Customer do usuario e devolve o id.
 *
 * CORRIDA (dois checkouts simultaneos do mesmo usuario): ambos leem mapeamento
 * vazio e ambos criam um Customer na Stripe. O upsert com ignoreDuplicates decide
 * quem ganha; o PERDEDOR rele o mapeamento e passa a usar o Customer do vencedor.
 * O Customer que o perdedor criou fica ORFAO na Stripe.
 *
 * O orfao NAO PODE RECEBER COBRANCA: ele nunca entra em `stripe_customers` (o
 * conflito o rejeitou), nunca e devolvido por esta funcao, e portanto nunca chega
 * ao `customer:` de uma Checkout Session. Sem sessao, nao ha cobranca. Fica
 * registrado em log de aviso para uma varredura poder recolher depois.
 */
export async function resolveStripeCustomerId(
  userId: string,
  email: string | undefined,
): Promise<string> {
  const livemode = livemodeEsperado();
  const stripe = getStripe();

  const mapeado = await lerMapeamento(userId, livemode);

  if (mapeado) {
    let precisaRecriar = false;
    try {
      const existente = await stripe.customers.retrieve(mapeado);
      // Customer deletado no painel volta com deleted: true em vez de 404.
      if ((existente as Stripe.DeletedCustomer).deleted) {
        console.warn(
          `[stripeCustomer] customer ${mapeado} esta deletado na Stripe; recriando para o user ${userId}.`,
        );
        precisaRecriar = true;
      } else {
        const customer = existente as Stripe.Customer;
        conferirModo(customer, livemode);
        conferirDono(customer, userId);
        await garantirMetadata(customer, userId);
        return customer.id;
      }
    } catch (err) {
      const stripeErr = err as Stripe.errors.StripeError;
      // resource_missing: sumiu de verdade. Qualquer outro erro (rede, rate
      // limit, chave invalida) NAO autoriza criar outro Customer, porque criar
      // seria reintroduzir o duplicado por causa de uma falha transitoria.
      if (
        stripeErr?.code !== "resource_missing" &&
        stripeErr?.statusCode !== 404
      ) {
        throw err;
      }
      console.warn(
        `[stripeCustomer] customer ${mapeado} nao existe mais na Stripe; recriando para o user ${userId}.`,
      );
      precisaRecriar = true;
    }

    if (!precisaRecriar) {
      throw createError(500, "config_error", "Estado inesperado do Customer.");
    }

    // Recriar e ATUALIZAR a linha existente, nunca inserir outra: a linha ja
    // ocupa (user_id, livemode) e um INSERT bateria no UNIQUE.
    const novo = await criarCustomer(userId, email, livemode);
    const { error } = await supabaseAdmin
      .from("stripe_customers")
      .update({ stripe_customer_id: novo.id })
      .eq("user_id", userId)
      .eq("livemode", livemode);
    if (error) {
      // O Customer existe na Stripe mas o mapeamento nao aponta para ele. Abortar
      // e o certo: seguir usaria um Customer que a proxima tentativa nao acha,
      // recriando de novo e voltando ao problema dos duplicados.
      console.error(
        `[stripeCustomer] customer ${novo.id} criado mas mapeamento NAO atualizado (user ${userId}):`,
        error,
      );
      throw createError(
        500,
        "db_error",
        "Não foi possível atualizar seu cadastro de pagamento. Tente novamente.",
      );
    }
    return novo.id;
  }

  const criado = await criarCustomer(userId, email, livemode);
  const { data, error } = await supabaseAdmin
    .from("stripe_customers")
    .upsert(
      { user_id: userId, stripe_customer_id: criado.id, livemode },
      { onConflict: "user_id,livemode", ignoreDuplicates: true },
    )
    .select("stripe_customer_id");
  if (error) {
    console.error("[stripeCustomer] falha ao gravar mapeamento:", error);
    throw createError(
      500,
      "db_error",
      "Não foi possível registrar seu cadastro de pagamento. Tente novamente.",
    );
  }

  // Vazio = perdeu a corrida (ignoreDuplicates transformou o conflito em DO
  // NOTHING). O vencedor ja gravou; relê e usa o dele.
  if ((data?.length ?? 0) === 0) {
    const vencedor = await lerMapeamento(userId, livemode);
    if (!vencedor) {
      // Conflitou e agora nao acha: so acontece se a linha tiver sido removida no
      // meio. Aborta em vez de criar um terceiro Customer.
      throw createError(
        500,
        "db_error",
        "Não foi possível confirmar seu cadastro de pagamento. Tente novamente.",
      );
    }
    console.warn(
      `[stripeCustomer] corrida na criacao (user ${userId}): customer ${criado.id} ficou ORFAO, ` +
        `usando ${vencedor}. O orfao nunca entra em stripe_customers, entao nao pode ser cobrado.`,
    );
    return vencedor;
  }

  return criado.id;
}
