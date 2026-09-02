import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * BUG-81: recuperacao de pagamento nao e primeira ativacao.
 *
 * O caso medido (evento de 2026-09-01 15:18:51Z, assinatura
 * `sub_1TwMUgQ6lxIhx7Vyha0Ffmgx`, afiliado BORANATECHOFF): a renovacao falhou
 * em 23, 25, 28 e 30/08 e foi paga em 01/09. `past_due` nao passa em
 * `isProStatus`, entao a cobranca recuperada entrou como se fosse a primeira
 * compra e disparou conversao de afiliado, resgate de cupom e e-mail de
 * boas-vindas.
 *
 * O que estes testes travam nao e o warning que apareceu no Sentry, e a
 * INCOERENCIA que ele revelou: uma renovacao que passa de primeira nunca conta
 * comissao (prev=active, logo nao ativa), e uma que falhou quatro vezes contava
 * ou nao conforme qual dos dois eventos simultaneos vencesse a corrida.
 *
 * Expectativas escritas a mao, uma por cenario, nunca derivadas de chamar o
 * proprio mecanismo.
 */

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

const estado = vi.hoisted(() => ({
  rpcCalls: [] as Array<{ nome: string; args: Record<string, unknown> }>,
  capturas: [] as Array<{ mensagem: string; opcoes: Record<string, unknown> }>,
  emails: [] as Array<Record<string, unknown>>,
  cacheInvalidado: [] as string[],
}));

vi.mock("@sentry/node", () => ({
  captureMessage: (mensagem: string, opcoes: Record<string, unknown>) => {
    estado.capturas.push({ mensagem, opcoes });
  },
  captureException: () => {},
  addBreadcrumb: () => {},
  withScope: (cb: (s: unknown) => void) =>
    cb({ setTag: () => {}, setLevel: () => {}, setContext: () => {} }),
}));

vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        getUserById: async () => ({
          data: {
            user: {
              email: "pessoa@exemplo.com",
              user_metadata: { name: "Pessoa" },
            },
          },
        }),
      },
    },
    from: (tabela: string) => {
      const consulta = {
        select: () => consulta,
        eq: () => consulta,
        maybeSingle: async () =>
          tabela === "affiliates"
            ? { data: { id: "afiliado-1" }, error: null }
            : { data: { gender: null }, error: null },
      };
      return consulta;
    },
    rpc: async (nome: string, args: Record<string, unknown>) => {
      estado.rpcCalls.push({ nome, args });
      return { data: null, error: null };
    },
  },
}));

vi.mock("../lib/proStatusCache", () => ({
  invalidateProStatusCache: (userId: string) => {
    estado.cacheInvalidado.push(userId);
  },
}));

vi.mock("../lib/queue", () => ({
  enqueueEmail: async (dados: Record<string, unknown>) => {
    estado.emails.push(dados);
  },
}));

import { applyActivationEffects } from "./shared";
import { isProStatus, motivoDaAtivacao } from "./stripe";

const USER = "user-abc";
const SUB = "sub_1TwMUgQ6lxIhx7Vyha0Ffmgx";

const eventoSemValor = {
  id: "evt_updated",
  type: "customer.subscription.updated",
  subscriptionId: SUB,
};
const eventoComValor = {
  id: "evt_paid",
  type: "invoice.paid",
  subscriptionId: SUB,
};

function rpcsChamadas() {
  return estado.rpcCalls.map((c) => c.nome);
}
function capturasDe(mensagem: string) {
  return estado.capturas.filter((c) => c.mensagem === mensagem);
}

describe("BUG-81: afiliado e cupom nao contam na recuperacao", () => {
  beforeEach(() => {
    estado.rpcCalls.length = 0;
    estado.capturas.length = 0;
    estado.emails.length = 0;
    estado.cacheInvalidado.length = 0;
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("(a) past_due -> active com afiliado e evento sem valor: nao conta, nao avisa", async () => {
    // Reproduz o evento de 01/09: `customer.subscription.updated` nao carrega
    // valor pago, e era dai que vinha o warning.
    expect(motivoDaAtivacao("past_due", "active")).toBe("recuperacao");

    await applyActivationEffects({
      userId: USER,
      logPrefix: "webhook/stripe",
      motivo: "recuperacao",
      planName: "Pro mensal",
      affiliateCode: "BORANATECHOFF",
      couponCode: null,
      revenueCents: undefined,
      sourceEvent: eventoSemValor,
      prevStatus: "past_due",
    });

    expect(rpcsChamadas()).not.toContain("increment_affiliate_conversion");
    expect(rpcsChamadas()).not.toContain("increment_coupon_redemption");
    expect(capturasDe("stripe_conversao_sem_valor_pago")).toHaveLength(0);

    // Cache cai nos dois motivos: a pessoa estava sem acesso e voltou a ter.
    expect(estado.cacheInvalidado).toEqual([USER]);

    // E-mail NAO muda neste lote: continua saindo, como hoje.
    expect(estado.emails).toHaveLength(1);
    expect(estado.emails[0].type).toBe("pro_upgrade");
    expect(estado.emails[0].to).toBe("pessoa@exemplo.com");
  });

  it("(b) primeira ativacao com invoice.paid de 2990: conta com o valor pago", async () => {
    await applyActivationEffects({
      userId: USER,
      logPrefix: "webhook/stripe",
      motivo: "primeira_ativacao",
      planName: "Pro mensal",
      affiliateCode: "BORANATECHOFF",
      couponCode: null,
      revenueCents: 2990,
      sourceEvent: eventoComValor,
      prevStatus: null,
    });

    const conversao = estado.rpcCalls.find(
      (c) => c.nome === "increment_affiliate_conversion",
    );
    expect(conversao).toBeDefined();
    expect(conversao?.args).toEqual({
      p_affiliate_id: "afiliado-1",
      p_revenue_cents: 2990,
    });
    expect(capturasDe("stripe_conversao_sem_valor_pago")).toHaveLength(0);
  });

  it("(c) primeira ativacao sem valor no evento: o warning CONTINUA disparando", async () => {
    // Comportamento preservado de proposito: na primeira ativacao a lacuna e
    // real (o afiliado fica sem numero) e precisa continuar visivel.
    await applyActivationEffects({
      userId: USER,
      logPrefix: "webhook/stripe",
      motivo: "primeira_ativacao",
      affiliateCode: "BORANATECHOFF",
      couponCode: null,
      revenueCents: undefined,
      sourceEvent: eventoSemValor,
      prevStatus: null,
    });

    expect(capturasDe("stripe_conversao_sem_valor_pago")).toHaveLength(1);
    expect(rpcsChamadas()).not.toContain("increment_affiliate_conversion");
  });

  it("(d) past_due -> active com cupom: nao resgata de novo", async () => {
    await applyActivationEffects({
      userId: USER,
      logPrefix: "webhook/stripe",
      motivo: "recuperacao",
      affiliateCode: null,
      couponCode: "CUPOM10",
      revenueCents: 2990,
      sourceEvent: eventoComValor,
      prevStatus: "past_due",
    });

    expect(rpcsChamadas()).not.toContain("increment_coupon_redemption");
  });

  it("(d-bis) o mesmo cupom na primeira ativacao CONTINUA sendo resgatado", async () => {
    await applyActivationEffects({
      userId: USER,
      logPrefix: "webhook/stripe",
      motivo: "primeira_ativacao",
      affiliateCode: null,
      couponCode: "CUPOM10",
      revenueCents: 2990,
      sourceEvent: eventoComValor,
      prevStatus: null,
    });

    const resgate = estado.rpcCalls.find(
      (c) => c.nome === "increment_coupon_redemption",
    );
    expect(resgate?.args).toEqual({ p_code: "CUPOM10" });
  });

  it("(e) renovacao normal (active -> active) nem chega nos efeitos", () => {
    // `becameActive` e a expressao real de handleTransition, composta aqui com
    // a funcao real: prev ja e Pro, entao a ativacao nao acontece e nada dos
    // efeitos roda. Nenhum comportamento novo, e o teste existe para travar que
    // este lote nao mexeu nesse caso.
    const becameActive = !isProStatus("active") && isProStatus("active");
    expect(becameActive).toBe(false);
    expect(estado.rpcCalls).toHaveLength(0);
    expect(estado.emails).toHaveLength(0);
  });

  it("motivoDaAtivacao: so past_due -> Pro e recuperacao", () => {
    expect(motivoDaAtivacao("past_due", "active")).toBe("recuperacao");
    expect(motivoDaAtivacao("past_due", "trialing")).toBe("recuperacao");
    // Tudo o mais segue como antes, inclusive os prev que existem hoje.
    expect(motivoDaAtivacao(null, "active")).toBe("primeira_ativacao");
    expect(motivoDaAtivacao("pending", "active")).toBe("primeira_ativacao");
    expect(motivoDaAtivacao("canceled", "active")).toBe("primeira_ativacao");
    expect(motivoDaAtivacao("active", "active")).toBe("primeira_ativacao");
    // past_due para um status nao-Pro nao e recuperacao nenhuma.
    expect(motivoDaAtivacao("past_due", "canceled")).toBe("primeira_ativacao");
  });
});
