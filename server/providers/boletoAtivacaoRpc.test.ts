import { beforeEach, describe, expect, it, vi } from "vitest";

import { onBoletoAsyncPaymentSucceeded } from "./stripe";

/**
 * ATIVACAO DE BOLETO PAGO: uma chamada de RPC, nenhuma escrita direta de status.
 *
 * O que estes testes travam: a ativacao passava por DUAS escritas separadas
 * (flip para 'active' e, so depois, o supersede best-effort das antigas). Entre
 * as duas, o usuario tinha duas linhas ativas por construcao, no caminho feliz,
 * e era isso que impedia o indice unico parcial de 20260829120000. O supersede
 * ainda podia falhar em silencio e deixar linha ativa orfa.
 *
 * Agora as duas viraram `activate_subscription_exclusive` (migration
 * 20260829110000), atomica e idempotente. O teste afirma as tres coisas que
 * importam: exatamente uma RPC, com os parametros certos; nenhuma escrita
 * direta de status sobrando no caminho; e erro da RPC capturado no Sentry antes
 * de propagar.
 */

const estado = vi.hoisted(() => ({
  /** Toda chamada de rpc, na ordem. */
  rpcCalls: [] as Array<{ nome: string; args: Record<string, unknown> }>,
  /** Toda ESCRITA em tabela (update/upsert/insert), na ordem. */
  escritas: [] as Array<{ tabela: string; operacao: string; carga: unknown }>,
  capturas: [] as Array<{ mensagem: string; opcoes: Record<string, unknown> }>,
  /** Linha devolvida pela leitura de `subscriptions` por provider_subscription_id. */
  pendingRow: null as Record<string, unknown> | null,
  /** Resultado que a RPC devolve, ou o erro que ela levanta. */
  rpcResultado: null as unknown,
  rpcErro: null as { code?: string; message: string } | null,
  transicoes: [] as Array<Record<string, unknown>>,
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
  captureMessage: (mensagem: string, opcoes: Record<string, unknown>) => {
    estado.capturas.push({ mensagem, opcoes });
  },
  captureException: () => {},
  addBreadcrumb: () => {},
}));

vi.mock("../lib/stripeClient", () => ({
  getStripe: () => {
    throw new Error("a ativacao de boleto nao chama a Stripe");
  },
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));

// Efeitos de `handleTransition`, fora do que esta sob teste.
vi.mock("../lib/proStatusCache", () => ({
  invalidateProStatusCache: async () => {},
}));
vi.mock("../lib/queue", () => ({ enqueueEmail: async () => {} }));
vi.mock("../lib/stripeSync", () => ({
  syncBalanceTransactions: async () => {},
}));
vi.mock("../lib/coupons", () => ({ findValidCoupon: async () => null }));

/**
 * Duble de `supabaseAdmin` que GRAVA toda escrita. E o unico jeito de afirmar
 * "nenhuma escrita direta de status acontece mais": um duble que so nao explode
 * passaria igual se o UPDATE antigo continuasse la.
 */
vi.mock("../lib/supabaseAdmin", () => {
  function consultaDeTabela(tabela: string) {
    const consulta: Record<string, unknown> = {};
    const encadeia = () => consulta;
    for (const metodo of [
      "select",
      "eq",
      "neq",
      "in",
      "gt",
      "order",
      "limit",
      "is",
    ]) {
      consulta[metodo] = encadeia;
    }
    consulta.maybeSingle = async () => {
      if (tabela === "subscriptions") {
        return { data: estado.pendingRow, error: null };
      }
      if (tabela === "plans") {
        return { data: { code: "pro_annual", name: "Pro Anual" }, error: null };
      }
      if (tabela === "affiliates") {
        return { data: null, error: null };
      }
      return { data: null, error: null };
    };
    for (const operacao of ["update", "upsert", "insert", "delete"]) {
      consulta[operacao] = (carga: unknown) => {
        estado.escritas.push({ tabela, operacao, carga });
        return consulta;
      };
    }
    return consulta;
  }

  return {
    supabaseAdmin: {
      from: (tabela: string) => consultaDeTabela(tabela),
      rpc: async (nome: string, args: Record<string, unknown>) => {
        estado.rpcCalls.push({ nome, args });
        if (estado.rpcErro) return { data: null, error: estado.rpcErro };
        return { data: estado.rpcResultado, error: null };
      },
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

const USER = "11111111-1111-1111-1111-111111111111";
const SUB_ROW = "22222222-2222-2222-2222-222222222222";
const SESSION = "cs_test_boleto";
const EVENT = "evt_boleto_pago";
/** Anual em centavos, ja com o desconto que a pessoa pagou. */
const PAGO_CENTS = 15540;

function eventoDeBoletoPago() {
  return {
    id: EVENT,
    type: "checkout.session.async_payment_succeeded",
    created: 1756400000,
    data: {
      object: {
        id: SESSION,
        payment_status: "paid",
        amount_total: PAGO_CENTS,
        metadata: {
          payment_method: "boleto",
          access_days: "365",
          supabase_user_id: USER,
          plan_id: "pro_annual",
        },
      },
    },
  } as unknown as Parameters<typeof onBoletoAsyncPaymentSucceeded>[0];
}

function resultadoDaRpc(over: Record<string, unknown> = {}) {
  return [
    {
      out_activated: true,
      out_superseded_count: 1,
      out_user_id: USER,
      out_plan_id: "33333333-3333-3333-3333-333333333333",
      out_affiliate_code: null,
      out_coupon_code: null,
      ...over,
    },
  ];
}

describe("ativacao de boleto passa pela RPC atomica", () => {
  beforeEach(() => {
    estado.rpcCalls = [];
    estado.escritas = [];
    estado.capturas = [];
    estado.transicoes = [];
    estado.pendingRow = { id: SUB_ROW, user_id: USER, status: "pending" };
    estado.rpcResultado = resultadoDaRpc();
    estado.rpcErro = null;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("faz EXATAMENTE UMA chamada de RPC, e e a de ativacao", async () => {
    await onBoletoAsyncPaymentSucceeded(
      eventoDeBoletoPago(),
      new Date("2026-08-29T12:00:00.000Z"),
    );

    const ativacoes = estado.rpcCalls.filter(
      (c) => c.nome === "activate_subscription_exclusive",
    );
    expect(ativacoes).toHaveLength(1);
  });

  it("manda os seis parametros da assinatura real, com os nomes do banco", async () => {
    const pagoEm = new Date("2026-08-29T12:00:00.000Z");
    await onBoletoAsyncPaymentSucceeded(eventoDeBoletoPago(), pagoEm);

    const args = estado.rpcCalls[0].args;
    expect(Object.keys(args).sort()).toEqual([
      "p_last_event_at",
      "p_period_end",
      "p_period_start",
      "p_raw_payload",
      "p_subscription_id",
      "p_user_id",
    ]);
    expect(args.p_subscription_id).toBe(SUB_ROW);
    expect(args.p_user_id).toBe(USER);
    expect(args.p_last_event_at).toBe(pagoEm.toISOString());
  });

  it("o periodo enviado e ancora mais access_days, nao um valor qualquer", async () => {
    const pagoEm = new Date("2026-08-29T12:00:00.000Z");
    await onBoletoAsyncPaymentSucceeded(eventoDeBoletoPago(), pagoEm);

    const args = estado.rpcCalls[0].args;
    // Primeira compra: sem periodo vigente, a ancora e o proprio pagamento.
    expect(args.p_period_start).toBe(pagoEm.toISOString());
    const fim = new Date(String(args.p_period_end)).getTime();
    expect(fim - pagoEm.getTime()).toBe(365 * 24 * 60 * 60 * 1000);
  });

  it("NENHUMA escrita direta em subscriptions sobra no caminho", async () => {
    await onBoletoAsyncPaymentSucceeded(
      eventoDeBoletoPago(),
      new Date("2026-08-29T12:00:00.000Z"),
    );

    const escritasEmSubs = estado.escritas.filter(
      (e) => e.tabela === "subscriptions",
    );
    expect(escritasEmSubs).toEqual([]);
  });

  it("nem o flip para active nem o supersede sobraram em lugar nenhum", async () => {
    await onBoletoAsyncPaymentSucceeded(
      eventoDeBoletoPago(),
      new Date("2026-08-29T12:00:00.000Z"),
    );

    const serializado = JSON.stringify(estado.escritas);
    expect(serializado).not.toContain("superseded");
    expect(serializado).not.toContain('"status"');
  });
});

describe("erro da RPC: captura no Sentry e propaga", () => {
  beforeEach(() => {
    estado.rpcCalls = [];
    estado.escritas = [];
    estado.capturas = [];
    estado.pendingRow = { id: SUB_ROW, user_id: USER, status: "pending" };
    estado.rpcResultado = null;
    estado.rpcErro = null;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("propaga o erro, para a compensacao agir e a Stripe reentregar", async () => {
    estado.rpcErro = { code: "40001", message: "serialization failure" };

    await expect(
      onBoletoAsyncPaymentSucceeded(
        eventoDeBoletoPago(),
        new Date("2026-08-29T12:00:00.000Z"),
      ),
    ).rejects.toThrow();
  });

  it("captura no Sentry ANTES de propagar, com o contexto da investigacao", async () => {
    estado.rpcErro = { code: "40001", message: "serialization failure" };

    await expect(
      onBoletoAsyncPaymentSucceeded(
        eventoDeBoletoPago(),
        new Date("2026-08-29T12:00:00.000Z"),
      ),
    ).rejects.toThrow();

    expect(estado.capturas).toHaveLength(1);
    const captura = estado.capturas[0];
    expect(captura.mensagem).toBe("stripe_boleto_ativacao_falhou");
    expect(captura.opcoes.level).toBe("error");
    expect(captura.opcoes.extra).toMatchObject({
      user_id: USER,
      subscription_row_id: SUB_ROW,
      event_id: EVENT,
    });
  });

  it("serialization_failure (40001) NAO tem tratamento especial: mesmo caminho", async () => {
    // A emenda 1 da RPC levanta 40001 quando a linha muda de estado durante a
    // ativacao. A reentrega da Stripe converge sobre o estado novo, entao nao
    // existe retry proprio aqui: o contrato e o mesmo de qualquer outro erro.
    estado.rpcErro = { code: "40001", message: "serialization failure" };
    await expect(
      onBoletoAsyncPaymentSucceeded(
        eventoDeBoletoPago(),
        new Date("2026-08-29T12:00:00.000Z"),
      ),
    ).rejects.toThrow();
    const capturasSerializacao = estado.capturas.length;

    estado.capturas = [];
    estado.rpcErro = { code: "23505", message: "unique violation" };
    await expect(
      onBoletoAsyncPaymentSucceeded(
        eventoDeBoletoPago(),
        new Date("2026-08-29T12:00:00.000Z"),
      ),
    ).rejects.toThrow();

    expect(estado.capturas).toHaveLength(capturasSerializacao);
    expect(estado.capturas[0].mensagem).toBe("stripe_boleto_ativacao_falhou");
  });
});

describe("reentrega: a RPC diz que nao ativou, e os efeitos nao redisparam", () => {
  beforeEach(() => {
    estado.rpcCalls = [];
    estado.escritas = [];
    estado.capturas = [];
    estado.pendingRow = { id: SUB_ROW, user_id: USER, status: "pending" };
    estado.rpcErro = null;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("out_activated=false encerra sem tocar em affiliates nem em plans", async () => {
    estado.rpcResultado = resultadoDaRpc({
      out_activated: false,
      out_superseded_count: 0,
    });

    await onBoletoAsyncPaymentSucceeded(
      eventoDeBoletoPago(),
      new Date("2026-08-29T12:00:00.000Z"),
    );

    // A RPC foi chamada (ela e quem decide), mas nenhuma outra rpc de efeito.
    expect(estado.rpcCalls).toHaveLength(1);
    expect(estado.escritas).toEqual([]);
  });

  it("retorno VAZIO lanca em vez de virar return mudo: seria pagamento perdido", async () => {
    estado.rpcResultado = [];

    await expect(
      onBoletoAsyncPaymentSucceeded(
        eventoDeBoletoPago(),
        new Date("2026-08-29T12:00:00.000Z"),
      ),
    ).rejects.toThrow();
  });
});

/**
 * O INSTRUMENTO PRECISA ACUSAR.
 *
 * Os casos acima afirmam `estado.escritas` VAZIO. Uma afirmacao de vazio passa
 * igualmente bem quando o duble nao esta gravando nada, e ai o teste inteiro
 * viraria um daqueles que reportam sucesso sobre uma superficie menor. Este
 * caso exercita o gravador diretamente: se ele parar de registrar escrita, o
 * teste quebra AQUI, e nao em silencio la em cima.
 */
describe("o gravador de escritas do duble funciona", () => {
  beforeEach(() => {
    estado.escritas = [];
  });

  it("um UPDATE direto em subscriptions APARECE em estado.escritas", async () => {
    const { supabaseAdmin } = await import("../lib/supabaseAdmin");
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "active" })
      .eq("id", SUB_ROW);

    expect(estado.escritas).toHaveLength(1);
    expect(estado.escritas[0]).toMatchObject({
      tabela: "subscriptions",
      operacao: "update",
      carga: { status: "active" },
    });
  });
});
