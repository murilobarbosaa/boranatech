import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * BOLETO PRECISA DE CUSTOMER, E A STRIPE NAO CRIA UM SOZINHA.
 *
 * Medido em 31/08/2026: `provider_customer_id` nulo em 16 de 16 boletos. A
 * causa NAO estava no handler (ele sempre gravou o campo), e sim na criacao da
 * sessao: em `mode: "payment"` o default da Stripe e
 * `customer_creation: "if_required"`, e para boleto ela decide que nao e
 * requerido. O handler recebia `session.customer` nulo e gravava nulo.
 *
 * O efeito nao e cosmetico: `provider_customer_id` e a chave por onde
 * `resolveByCustomer` (server/lib/stripeSync.ts) acha o dono de uma cobranca no
 * sync financeiro. Sem ela a cobranca entra no ledger sem dono, e foi assim que
 * uma assinante com Pro ativo apareceu na fila de pagamentos orfaos sem ter
 * problema nenhum.
 *
 * As duas pontas sao afirmadas aqui de proposito. Uma sozinha nao prova nada:
 * pedir o Customer sem grava-lo, ou gravar sem pedir, deixa o campo nulo do
 * mesmo jeito, e o defeito volta inteiro.
 */

const estado = vi.hoisted(() => ({
  /** Argumentos de cada `checkout.sessions.create`, na ordem. */
  sessoesCriadas: [] as Array<Record<string, unknown>>,
  /** Toda escrita em tabela (update/upsert/insert/delete), na ordem. */
  escritas: [] as Array<{ tabela: string; operacao: string; carga: unknown }>,
  /** Linhas devolvidas pelos SELECT em `subscriptions` (guards do checkout). */
  assinaturasExistentes: [] as unknown[],
  /** Evento que `constructEvent` devolve no caminho do webhook. */
  evento: null as unknown,
}));

vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    stripeSecretKey: "sk_test_x",
    stripeWebhookSecret: "whsec_x",
    stripePriceIds: {
      pro_monthly: "price_monthly",
      pro_semiannual: "price_semiannual",
      pro_annual: "price_annual",
    },
    appPublicUrl: "https://exemplo.com.br",
    billingEnabled: true,
    isProd: false,
  },
}));

vi.mock("@sentry/node", () => ({
  captureMessage: () => {},
  captureException: () => {},
  addBreadcrumb: () => {},
}));

vi.mock("../lib/stripeClient", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: async (args: Record<string, unknown>) => {
          estado.sessoesCriadas.push(args);
          return { id: "cs_test_boleto", url: "https://stripe.test/pagar" };
        },
      },
    },
    webhooks: {
      constructEvent: () => estado.evento,
    },
  }),
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));

// Efeitos fora do que esta sob teste.
vi.mock("../lib/proStatusCache", () => ({
  invalidateProStatusCache: async () => {},
}));
vi.mock("../lib/queue", () => ({ enqueueEmail: async () => {} }));
vi.mock("../lib/stripeSync", () => ({
  syncBalanceTransactions: async () => {},
}));
vi.mock("../lib/coupons", () => ({ findValidCoupon: async () => null }));

/**
 * Duble de `supabaseAdmin` que GRAVA toda escrita, para o caso do handler poder
 * afirmar o conteudo da linha, e nao so que nada explodiu.
 *
 * A resposta depende da TABELA e da OPERACAO porque o caminho do webhook lê e
 * escreve em tres tabelas com contratos diferentes: `billing_events` precisa
 * devolver a linha recem-inserida (senao o dedupe acha que ja processou),
 * `plans` precisa devolver o plano, e `subscriptions` responde lista nos guards
 * e `{ error: null }` no upsert.
 */
vi.mock("../lib/supabaseAdmin", () => {
  function resposta(tabela: string, operacao: string) {
    if (tabela === "billing_events") {
      // upsert(...).select("id"): linha NOVA, ou seja, evento inedito.
      if (operacao === "upsert")
        return { data: [{ id: "evt_1" }], error: null };
      return { data: null, error: null };
    }
    if (tabela === "plans") return { data: { id: "plan-1" }, error: null };
    if (tabela === "subscriptions" && operacao === "select") {
      return { data: estado.assinaturasExistentes, error: null };
    }
    return { data: null, error: null };
  }

  function consulta(tabela: string) {
    const q: Record<string, unknown> = {};
    let operacao = "select";
    const encadeia = () => q;
    for (const metodo of [
      "select",
      "eq",
      "neq",
      "in",
      "gt",
      "order",
      "limit",
      "is",
      "not",
    ]) {
      q[metodo] = encadeia;
    }
    for (const op of ["update", "upsert", "insert", "delete"]) {
      q[op] = (carga: unknown) => {
        estado.escritas.push({ tabela, operacao: op, carga });
        operacao = op;
        return q;
      };
    }
    q.maybeSingle = async () => resposta(tabela, operacao);
    q.single = async () => resposta(tabela, operacao);
    q.then = (resolve: (valor: unknown) => unknown) =>
      Promise.resolve(resposta(tabela, operacao)).then(resolve);
    return q;
  }

  return {
    supabaseAdmin: {
      from: (tabela: string) => consulta(tabela),
      rpc: async () => ({ data: null, error: null }),
      auth: {
        admin: {
          getUserById: async () => ({
            data: { user: { email: "", user_metadata: {} } },
            error: null,
          }),
        },
      },
    },
  };
});

import { stripeProvider } from "./stripe";

const USER = "11111111-1111-1111-1111-111111111111";
const SESSION = "cs_test_boleto";

beforeEach(() => {
  estado.sessoesCriadas = [];
  estado.escritas = [];
  estado.assinaturasExistentes = [];
  estado.evento = null;
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("checkout de boleto pede Customer a Stripe", () => {
  async function criarBoleto() {
    await stripeProvider.createCheckout({
      user: { id: USER, email: "pessoa@exemplo.com" },
      planId: "pro_annual",
      affiliateCode: "",
      couponCode: "",
      paymentMethod: "boleto",
    });
    return estado.sessoesCriadas[0];
  }

  it("a sessao leva `customer_creation: always`", async () => {
    const args = await criarBoleto();

    // Expectativa escrita a mao, nao derivada do codigo: o valor certo e este, e
    // qualquer outro (inclusive o default `if_required`) reabre o defeito.
    expect(args.customer_creation).toBe("always");
  });

  it("o resto da sessao de boleto nao mudou: payment + boleto + 3 dias", async () => {
    const args = await criarBoleto();

    expect(args.mode).toBe("payment");
    expect(args.payment_method_types).toEqual(["boleto"]);
    expect(args.payment_method_options).toEqual({
      boleto: { expires_after_days: 3 },
    });
    expect(args.client_reference_id).toBe(USER);
  });

  it("CONTRASTE: a sessao de CARTAO nao ganhou o campo", async () => {
    // `mode: "subscription"` cria Customer por construcao, entao `customer_creation`
    // nem e aceito la. Se alguem replicar a linha para o outro ramo, quebra aqui.
    await stripeProvider.createCheckout({
      user: { id: USER, email: "pessoa@exemplo.com" },
      planId: "pro_annual",
      affiliateCode: "",
      couponCode: "",
      paymentMethod: "card",
    });

    const args = estado.sessoesCriadas[0];
    expect(args.mode).toBe("subscription");
    expect(args.customer_creation).toBeUndefined();
  });
});

describe("o handler grava o Customer que a sessao devolver", () => {
  /** `checkout.session.completed` de boleto GERADO e ainda nao pago. */
  function eventoDeBoleto(customer: unknown) {
    return {
      id: "evt_1",
      type: "checkout.session.completed",
      created: 1756400000,
      livemode: true,
      data: {
        object: {
          id: SESSION,
          object: "checkout.session",
          mode: "payment",
          payment_status: "unpaid",
          client_reference_id: USER,
          customer,
          amount_total: 15540,
          metadata: {
            supabase_user_id: USER,
            plan_id: "pro_annual",
            payment_method: "boleto",
            renewal_type: "manual",
            access_days: "365",
          },
        },
      },
    };
  }

  async function processar(customer: unknown) {
    estado.evento = eventoDeBoleto(customer);
    await stripeProvider.handleWebhook({
      rawBody: Buffer.from("{}"),
      headers: { "stripe-signature": "assinatura-valida-para-o-duble" },
    });
    const upsert = estado.escritas.find(
      (e) => e.tabela === "subscriptions" && e.operacao === "upsert",
    );
    return upsert?.carga as Record<string, unknown> | undefined;
  }

  it("customer como STRING vira provider_customer_id", async () => {
    const linha = await processar("cus_boleto_1");

    expect(linha).toBeDefined();
    expect(linha?.provider_customer_id).toBe("cus_boleto_1");
    // E continua sendo a linha PENDENTE: gravar o Customer nao concede acesso.
    expect(linha?.status).toBe("pending");
    expect(linha?.payment_method).toBe("boleto");
    expect(linha?.provider_subscription_id).toBe(SESSION);
  });

  it("customer EXPANDIDO (objeto com id) tambem vira provider_customer_id", async () => {
    // A Stripe manda ora o id cru, ora o objeto expandido, conforme a chamada.
    // Ler so a string deixaria o campo nulo justamente quando ele existe.
    const linha = await processar({ id: "cus_boleto_2", object: "customer" });

    expect(linha?.provider_customer_id).toBe("cus_boleto_2");
  });

  it("CONTROLE NEGATIVO: sem customer o campo fica nulo, e nao inventado", async () => {
    // E o estado dos 16 boletos antigos, e o que eles continuam sendo: a Stripe
    // nunca criou Customer para aquelas sessoes, entao nao existe id para
    // preencher. Casar por e-mail seria atribuir dinheiro por inferencia.
    const linha = await processar(null);

    expect(linha?.provider_customer_id).toBeNull();
  });
});

/**
 * O INSTRUMENTO PRECISA ACUSAR.
 *
 * Os casos acima leem `estado.sessoesCriadas` e `estado.escritas`. Se qualquer
 * um dos dois gravadores parar de gravar, `find` devolve undefined e as
 * afirmacoes de `toBeUndefined`/`toBeNull` passariam por acidente. Este bloco
 * exercita os dois diretamente, para a quebra aparecer AQUI.
 */
describe("os gravadores do duble funcionam", () => {
  it("uma escrita direta em subscriptions APARECE em estado.escritas", async () => {
    const { supabaseAdmin } = await import("../lib/supabaseAdmin");
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "active" })
      .eq("id", "x");

    expect(estado.escritas).toEqual([
      {
        tabela: "subscriptions",
        operacao: "update",
        carga: { status: "active" },
      },
    ]);
  });

  it("uma sessao criada APARECE em estado.sessoesCriadas", async () => {
    const { getStripe } = await import("../lib/stripeClient");
    await getStripe().checkout.sessions.create({ mode: "payment" });

    expect(estado.sessoesCriadas).toEqual([{ mode: "payment" }]);
  });
});
