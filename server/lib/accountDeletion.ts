import * as Sentry from "@sentry/node";

import { precisaCancelarNaStripe } from "./proRevocation";
import { getStripe } from "./stripeClient";
import { supabaseAdmin } from "./supabaseAdmin";

// EXCLUSAO DE CONTA COM ASSINATURA VIVA (D8).
//
// O CASO REAL, medido em 2026-08-14 e documentado em
// docs/investigacoes/2026-08-14-admin-visao-metricas.md: uma pessoa assinou em
// 2026-07-19 (checkout autenticado, `metadata.supabase_user_id` preenchido),
// pediu cancelamento na Stripe em 08-08, e a conta sumiu do banco. O id
// `79022fea-...` nao esta em `auth.users` nem em nenhuma das 35 tabelas com
// coluna `user_id`.
//
// A causa e `DELETE /api/me`, que chamava `auth.admin.deleteUser` e NADA MAIS.
// Todos os FKs para `auth.users` sao ON DELETE CASCADE, entao `profiles`,
// `subscriptions` e `subscription_cancellations` sumiram junto; e
// `finance_transactions.user_id` e SET NULL, o que deixou a cobranca de
// R$ 29,90 sem dono. A assinatura na Stripe continuou viva.
//
// A ORDEM E O PONTO DELICADO. Depois do `deleteUser` nao ha como descobrir o
// customer: o mapeamento (`subscriptions.provider_customer_id`) foi apagado
// pelo proprio CASCADE. Entao tudo que depende de saber quem e a pessoa na
// Stripe precisa acontecer ANTES.

/** O que a preparacao fez, para log e para a resposta da rota. */
export type PreparacaoDeExclusao = {
  /** provider_subscription_id efetivamente cancelados na Stripe. */
  canceladas: string[];
  /**
   * Assinaturas locais que NAO tem contraparte recorrente na Stripe (boleto
   * avulso, chaveado por `cs_...`). Nao ha o que cancelar: o acesso era o
   * periodo pago, e ele morre com a conta.
   */
  semContraparteNaStripe: string[];
  /** customers que receberam o marcador `account_deleted_at`. */
  customersMarcados: string[];
  /** true quando o marcador falhou em ao menos um customer (nao aborta). */
  marcadorIncompleto: boolean;
};

type LinhaDeAssinatura = {
  id: string;
  status: string;
  renewal_type: string | null;
  provider_subscription_id: string | null;
  provider_customer_id: string | null;
};

/** Status que ainda cobram ou ainda dao acesso. Sao os que precisam morrer. */
const STATUS_VIVOS = ["active", "trialing", "past_due"];

function ehStripeError(err: unknown): err is { code?: string; type?: string } {
  return typeof err === "object" && err !== null;
}

/**
 * Cancela UMA assinatura, tolerando o caso "ja nao existe / ja cancelada".
 *
 * Idempotencia importa aqui porque o banco local pode estar atrasado em relacao
 * a Stripe (webhook perdido, reconcile ainda nao passou). Se a Stripe recusar,
 * a funcao CONFERE o estado real antes de decidir: so trata como resolvido se a
 * assinatura sumiu ou ja esta `canceled`. Qualquer outro erro sobe.
 */
async function cancelarUma(providerSubscriptionId: string): Promise<void> {
  const stripe = getStripe();
  try {
    await stripe.subscriptions.cancel(providerSubscriptionId);
    return;
  } catch (err) {
    if (ehStripeError(err) && err.code === "resource_missing") {
      // Nao existe na Stripe: nao ha o que cancelar, e prosseguir e seguro.
      return;
    }
    // Pode ser "ja cancelada". Conferir o estado REAL antes de desistir: e a
    // diferenca entre tolerar um no-op e engolir uma falha de verdade.
    try {
      const atual = await stripe.subscriptions.retrieve(providerSubscriptionId);
      if (atual.status === "canceled") return;
    } catch {
      // A leitura de confirmacao tambem falhou: nao da para afirmar que esta
      // cancelada, entao o erro original vale.
    }
    throw err;
  }
}

/**
 * Marca o customer como pertencente a uma conta excluida.
 *
 * BEST-EFFORT DE PROPOSITO, e a escolha e o contrario do resto desta funcao.
 * D8 diz "falha na Stripe aborta a exclusao", e para o CANCELAMENTO isso e
 * exatamente certo: deletar a conta com a cobranca viva e o pior resultado
 * possivel. Para o MARCADOR nao e, e o motivo esta na direcao do erro:
 *
 *   - se o marcador falhar e a exclusao seguir, o pagamento aparece depois no
 *     detector de orfaos como `sem_usuario_no_banco`, ou seja, PEDINDO atencao
 *     humana. Errar para o lado de gritar;
 *   - se a exclusao abortasse por causa do marcador, a assinatura ja teria sido
 *     cancelada (o cancelamento vem antes) e a pessoa ficaria com conta viva e
 *     assinatura morta, que e um estado meio-feito pior que os dois.
 *
 * A falha e RUIDOSA no Sentry, entao nao e silencio: e uma degradacao nomeada.
 */
async function marcarCustomer(
  customerId: string,
  userId: string,
  quando: string,
): Promise<boolean> {
  try {
    // A Stripe faz MERGE de metadata no update: as chaves existentes do
    // customer (nenhuma, nos casos observados) nao sao perdidas.
    await getStripe().customers.update(customerId, {
      metadata: { account_deleted_at: quando, deleted_user_id: userId },
    });
    return true;
  } catch (err) {
    const mensagem =
      `[account-deletion] marcador account_deleted_at NAO gravado no customer ` +
      `${customerId} (user ${userId}); o pagamento vai aparecer como orfao ` +
      `acionavel no detector. Causa: ${err instanceof Error ? err.message : String(err)}`;
    console.error(mensagem);
    try {
      Sentry.captureMessage(mensagem, {
        level: "error",
        tags: { area: "account-deletion", marcador: "falhou" },
        fingerprint: ["account-deletion-marcador"],
      });
    } catch {
      // Sentry desligado (DSN ausente) e no-op por desenho; o console.error
      // acima ja garante o rastro. Mesmo padrao de server/lib/aiUsage.ts.
    }
    return false;
  }
}

/**
 * Encerra a vida da pessoa na Stripe, ANTES de apagar a conta no banco.
 *
 * FAIL-CLOSED no cancelamento: qualquer erro que nao seja "ja nao existe / ja
 * cancelada" LANCA, e quem chama NAO deve prosseguir com o `deleteUser`. Uma
 * conta apagada com assinatura viva e o defeito que esta funcao existe para
 * impedir, e ele nao pode ser reintroduzido por um catch.
 *
 * SEM REEMBOLSO do periodo restante: e decisao de produto (D8), nao omissao.
 *
 * Pessoa sem assinatura na Stripe: nenhuma chamada de rede, resultado vazio, e
 * o fluxo de exclusao segue exatamente como antes.
 */
export async function prepararExclusaoDeConta(
  userId: string,
): Promise<PreparacaoDeExclusao> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, status, renewal_type, provider_subscription_id, provider_customer_id",
    )
    .eq("user_id", userId)
    .eq("provider", "stripe")
    .in("status", STATUS_VIVOS);

  // Fail-loud: sem saber quais assinaturas existem, nao da para afirmar que nao
  // ha nenhuma. Prosseguir aqui seria o defeito original de volta.
  if (error) throw error;

  const linhas = (data ?? []) as LinhaDeAssinatura[];
  const resultado: PreparacaoDeExclusao = {
    canceladas: [],
    semContraparteNaStripe: [],
    customersMarcados: [],
    marcadorIncompleto: false,
  };
  if (linhas.length === 0) return resultado;

  // 1) CANCELAR. Primeiro, porque e o unico passo que protege dinheiro.
  for (const linha of linhas) {
    if (!precisaCancelarNaStripe(linha)) {
      // Boleto avulso: `provider_subscription_id` e um `cs_...` e
      // subscriptions.cancel com ele falha sempre. Ver proRevocation.ts.
      if (linha.provider_subscription_id) {
        resultado.semContraparteNaStripe.push(linha.provider_subscription_id);
      }
      continue;
    }
    await cancelarUma(linha.provider_subscription_id);
    resultado.canceladas.push(linha.provider_subscription_id);
  }

  // 2) MARCAR o customer. Depois do cancelamento e best-effort (ver acima).
  const quando = new Date().toISOString();
  const customers = Array.from(
    new Set(
      linhas
        .map((l) => l.provider_customer_id)
        .filter((c): c is string => Boolean(c)),
    ),
  );
  for (const customerId of customers) {
    const ok = await marcarCustomer(customerId, userId, quando);
    if (ok) resultado.customersMarcados.push(customerId);
    else resultado.marcadorIncompleto = true;
  }

  // 3) RASTRO. Só ids: nem e-mail, nem nome, nem nada que identifique a pessoa
  // por fora dos identificadores que a Stripe ja carrega.
  //
  // SUCESSO PLENO NAO VAI PARA O SENTRY. Ate 2026-08-29 esta funcao capturava um
  // evento em TODA exclusao, inclusive nas que deram certo, e exclusao bem
  // sucedida e o comportamento esperado, nao um achado: o que se ganhava era uma
  // issue que crescia com o uso normal do produto e ensinava a ignorar a area
  // `account-deletion` inteira. O `!level:info` do intake (78ec95a0) ja mantinha
  // isso fora do CRM, mas mantinha por FILTRO, tapando na saida um evento que
  // nao devia ter sido emitido. Sucesso agora e log estruturado, e nada mais.
  console.log(
    `[account-deletion] user=${userId} ` +
      `canceladas=${resultado.canceladas.length} ` +
      `sem_contraparte=${resultado.semContraparteNaStripe.length} ` +
      `customers_marcados=${resultado.customersMarcados.length} ` +
      `marcador_incompleto=${resultado.marcadorIncompleto}`,
  );

  // O CAMINHO DEGRADADO, esse sim, e para humano ver. `marcadorIncompleto`
  // significa que o customer ficou na Stripe SEM `account_deleted_at`, e a
  // consequencia e concreta: o pagamento dessa pessoa vai aparecer como orfao
  // ACIONAVEL no `detect-orphan-payments`, porque e exatamente esse marcador que
  // classifica a linha como `conta_excluida` (ruido conhecido) em vez de
  // `sem_usuario_no_banco` (alguem pagou e nao recebeu). Sem este aviso, a
  // primeira noticia do defeito e uma varredura amarela dias depois.
  //
  // POR QUE NAO E O MESMO EVENTO de `marcarCustomer`, que ja captura em `error`
  // com fingerprint `account-deletion-marcador`: aquele responde "este customer
  // falhou, e por que", uma linha por customer; este responde "esta EXCLUSAO
  // terminou incompleta", uma vez por pessoa, com a lista do que ficou marcado e
  // do que nao ficou. Sao a causa e a consequencia, e junta-los no mesmo
  // fingerprint faria a segunda sumir dentro do volume da primeira.
  if (resultado.marcadorIncompleto) {
    try {
      Sentry.captureMessage("[account-deletion] exclusao incompleta", {
        // `warning` e nao `error`: a conta foi apagada e a assinatura foi
        // cancelada, entao ninguem esta pagando por nada. O que sobrou e uma
        // limpeza manual na Stripe, que alguem precisa ver, sem plantao.
        level: "warning",
        tags: { area: "account-deletion", marcador: "incompleto" },
        // Fingerprint fixo por TIPO: o interesse e a serie no tempo, e o id do
        // usuario no agrupamento daria uma issue por exclusao, que carrega a
        // mesma informacao que nenhuma.
        fingerprint: ["account-deletion-incompleto"],
        extra: {
          deleted_user_id: userId,
          canceladas: resultado.canceladas,
          sem_contraparte: resultado.semContraparteNaStripe,
          customers_marcados: resultado.customersMarcados,
        },
      });
    } catch {
      // Sentry desligado: no-op, como no resto da base.
    }
  }

  return resultado;
}
