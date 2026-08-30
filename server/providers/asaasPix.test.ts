import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * FUNDACOES DO PIX AVULSO PELO ASAAS.
 *
 * O que estes testes travam e o que o fluxo tem de diferente do boleto, mais o
 * que ele tem de OBRIGATORIAMENTE igual:
 *
 *   diferente: a linha local nasce ANTES da cobranca remota, para o webhook
 *              nunca poder chegar antes dela (o boleto faz o contrario, e foi
 *              por isso que billing_orphan_payments precisou existir);
 *   igual:     a ativacao passa pela RPC atomica, a comissao usa o caminho
 *              unico, e ausencia de valor pago NAO vira zero.
 *
 * Nenhum caso toca rede: o cliente do Asaas e dublado por inteiro.
 */

const estado = vi.hoisted(() => ({
  /** Chamadas ao Asaas, na ordem, com caminho e corpo. */
  asaas: [] as Array<{ caminho: string; method: string; body?: unknown }>,
  /** Respostas que o duble do Asaas devolve, por caminho. */
  asaasResposta: {} as Record<string, unknown>,
  /** Erro que o duble do Asaas lanca, se houver. */
  asaasErro: null as Error | null,

  /** Escritas em tabela, na ordem. */
  escritas: [] as Array<{ tabela: string; operacao: string; carga: unknown }>,
  /** Chamadas de rpc, na ordem. */
  rpcCalls: [] as Array<{ nome: string; args: Record<string, unknown> }>,
  capturas: [] as Array<{ mensagem: string; opcoes: Record<string, unknown> }>,

  /** Linhas devolvidas por leitura, por tabela. */
  linhaSubscription: null as Record<string, unknown> | null,
  ativas: [] as unknown[],
  pixPendentes: [] as unknown[],
  plano: { id: "plan-anual", code: "pro_annual", name: "Pro Anual" } as Record<
    string,
    unknown
  > | null,
  /** id devolvido pelo insert da linha pendente. */
  novaLinhaId: "row-1",
  /** Chaves ja gravadas em billing_events (dedupe). */
  eventosVistos: new Set<string>(),
  /** Intencao de nao renovar ja existente, para o caso idempotente. */
  intencaoExistente: null as Record<string, unknown> | null,
  /** E-mails enfileirados, na ordem. */
  emails: [] as Array<Record<string, unknown>>,
  /** Linha de affiliates devolvida na busca por codigo. */
  afiliado: { id: "aff-1" } as Record<string, unknown> | null,
  /** Resultado da RPC de ativacao. */
  ativacao: null as unknown,
  ativacaoErro: null as { code?: string; message: string } | null,
}));

vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    asaasApiUrl: "https://api-sandbox.asaas.com/v3",
    asaasApiKey: "chave-de-teste",
    asaasWebhookToken: "token-de-teste",
    asaasEnabled: true,
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

vi.mock("../lib/proStatusCache", () => ({
  invalidateProStatusCache: async () => {},
}));

vi.mock("../lib/queue", () => ({
  enqueueEmail: async (job: Record<string, unknown>) => {
    estado.emails.push(job);
  },
}));

vi.mock("../lib/asaasClient", () => ({
  asaasFetch: async (
    caminho: string,
    init: { method: string; body?: unknown } = { method: "GET" },
  ) => {
    estado.asaas.push({ caminho, method: init.method, body: init.body });
    if (estado.asaasErro) throw estado.asaasErro;
    for (const [chave, valor] of Object.entries(estado.asaasResposta)) {
      if (caminho.startsWith(chave)) return valor;
    }
    return {};
  },
}));

vi.mock("../lib/supabaseAdmin", () => {
  function consulta(tabela: string) {
    const q: Record<string, unknown> = {};
    let filtroPagamento = false;
    const encadeia = () => q;
    for (const m of [
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
      q[m] = (coluna?: string, valor?: unknown) => {
        if (tabela === "subscriptions" && coluna === "payment_method") {
          filtroPagamento = valor === "pix";
        }
        return q;
      };
    }
    q.maybeSingle = async () => {
      if (tabela === "plans") return { data: estado.plano, error: null };
      if (tabela === "affiliates")
        return { data: estado.afiliado, error: null };
      if (tabela === "profiles") return { data: { gender: null }, error: null };
      if (tabela === "subscription_cancellations")
        return { data: estado.intencaoExistente, error: null };
      if (tabela === "subscriptions")
        return { data: estado.linhaSubscription, error: null };
      return { data: null, error: null };
    };
    q.single = async () => {
      if (tabela === "subscriptions")
        return { data: { id: estado.novaLinhaId }, error: null };
      return { data: null, error: null };
    };
    // `select(...).eq(...).limit(1)` sem maybeSingle: o guard le o array.
    q.then = (resolve: (v: unknown) => unknown) => {
      if (tabela === "subscriptions") {
        const linhas = filtroPagamento ? estado.pixPendentes : estado.ativas;
        return Promise.resolve({ data: linhas, error: null }).then(resolve);
      }
      return Promise.resolve({ data: [], error: null }).then(resolve);
    };
    for (const op of ["update", "insert", "upsert", "delete"]) {
      q[op] = (carga: unknown, opcoes?: unknown) => {
        estado.escritas.push({ tabela, operacao: op, carga });
        if (tabela === "billing_events" && op === "upsert") {
          const id = (carga as { id: string }).id;
          const novo = !estado.eventosVistos.has(id);
          estado.eventosVistos.add(id);
          const resultado = { data: novo ? [{ id }] : [], error: null };
          const encadeavel: Record<string, unknown> = {
            select: () => encadeavel,
            then: (r: (v: unknown) => unknown) =>
              Promise.resolve(resultado).then(r),
          };
          return encadeavel;
        }
        void opcoes;
        return q;
      };
    }
    return q;
  }

  return {
    supabaseAdmin: {
      from: (tabela: string) => consulta(tabela),
      auth: {
        admin: {
          getUserById: async () => ({
            data: {
              user: {
                email: "pessoa@exemplo.com",
                user_metadata: { name: "Pessoa" },
              },
            },
            error: null,
          }),
        },
      },
      rpc: async (nome: string, args: Record<string, unknown>) => {
        estado.rpcCalls.push({ nome, args });
        if (nome === "activate_subscription_exclusive") {
          if (estado.ativacaoErro)
            return { data: null, error: estado.ativacaoErro };
          return { data: estado.ativacao, error: null };
        }
        return { data: null, error: null };
      },
    },
  };
});

import {
  chaveDeEvento,
  paidAmountCentsFromAsaas,
  PIX_ACCESS_DAYS,
  processarEventoAsaas,
  asaasProvider,
} from "./asaas";

const USER = "11111111-1111-1111-1111-111111111111";
const COBRANCA = "pay_asaas_123";
const EVENTO = "evt_asaas_abc";

function limpar() {
  estado.asaas = [];
  estado.asaasResposta = {
    "/customers?": { data: [{ id: "cus_1" }] },
    "/payments": { id: COBRANCA, invoiceUrl: "https://asaas.test/i/123" },
  };
  estado.asaasErro = null;
  estado.escritas = [];
  estado.rpcCalls = [];
  estado.capturas = [];
  estado.linhaSubscription = null;
  estado.ativas = [];
  estado.pixPendentes = [];
  estado.plano = { id: "plan-anual", code: "pro_annual", name: "Pro Anual" };
  estado.novaLinhaId = "row-1";
  estado.afiliado = { id: "aff-1" };
  estado.emails = [];
  estado.intencaoExistente = null;
  estado.eventosVistos = new Set();
  estado.ativacao = [
    {
      out_activated: true,
      out_superseded_count: 0,
      out_user_id: USER,
      out_plan_id: "plan-anual",
      out_affiliate_code: null,
      out_coupon_code: null,
    },
  ];
  estado.ativacaoErro = null;
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
}

function checkoutInput(planId: string) {
  return {
    user: { id: USER, email: "pessoa@exemplo.com" },
    planId,
    affiliateCode: "",
    couponCode: "",
    paymentMethod: "pix",
  } as unknown as Parameters<typeof asaasProvider.createCheckout>[0];
}

describe("restricao de plano: o mapa lista quem PODE", () => {
  beforeEach(limpar);

  it("mensal e recusado, e NAO chega a tocar o Asaas", async () => {
    await expect(
      asaasProvider.createCheckout(checkoutInput("pro_monthly")),
    ).rejects.toMatchObject({ code: "pix_not_allowed_on_monthly" });

    expect(estado.asaas).toEqual([]);
    expect(estado.escritas).toEqual([]);
  });

  it("semestral e anual estao no mapa, com os MESMOS dias do boleto", () => {
    expect(PIX_ACCESS_DAYS.pro_semiannual).toBe(182);
    expect(PIX_ACCESS_DAYS.pro_annual).toBe(365);
    expect(PIX_ACCESS_DAYS.pro_monthly).toBeUndefined();
  });
});

describe("ordem das escritas: linha local ANTES da cobranca remota", () => {
  beforeEach(limpar);

  it("o insert em subscriptions acontece antes da primeira chamada ao Asaas", async () => {
    const escritasAntesDoAsaas: number[] = [];
    const asaasOriginal = estado.asaas;
    void asaasOriginal;

    await asaasProvider.createCheckout(checkoutInput("pro_annual"));

    // A primeira escrita e o insert da linha pendente.
    expect(estado.escritas[0]).toMatchObject({
      tabela: "subscriptions",
      operacao: "insert",
    });
    const carga = estado.escritas[0].carga as Record<string, unknown>;
    expect(carga.status).toBe("pending");
    expect(carga.payment_method).toBe("pix");
    expect(carga.provider).toBe("asaas");
    expect(carga.renewal_type).toBe("manual");
    // provider_subscription_id so existe depois da cobranca: nasce null.
    expect(carga.provider_subscription_id).toBeNull();
    void escritasAntesDoAsaas;
  });

  it("a cobranca leva o id da linha local em externalReference", async () => {
    await asaasProvider.createCheckout(checkoutInput("pro_annual"));

    const pagamento = estado.asaas.find((c) => c.caminho === "/payments");
    expect(pagamento).toBeDefined();
    const body = pagamento!.body as Record<string, unknown>;
    expect(body.externalReference).toBe("row-1");
    expect(body.billingType).toBe("PIX");
  });

  it("a linha e amarrada ao id da cobranca depois", async () => {
    const r = await asaasProvider.createCheckout(checkoutInput("pro_annual"));

    const update = estado.escritas.find(
      (e) => e.tabela === "subscriptions" && e.operacao === "update",
    );
    expect(
      (update!.carga as Record<string, unknown>).provider_subscription_id,
    ).toBe(COBRANCA);
    expect(r.subscriptionId).toBe(COBRANCA);
    expect(r.checkoutUrl).toBe("https://asaas.test/i/123");
  });

  it("customer e BUSCADO antes de criado: o Asaas nao deduplica sozinho", async () => {
    await asaasProvider.createCheckout(checkoutInput("pro_annual"));

    const primeira = estado.asaas[0];
    expect(primeira.method).toBe("GET");
    expect(primeira.caminho).toContain("/customers?externalReference=");
    // Encontrou um: nao cria outro.
    expect(
      estado.asaas.filter(
        (c) => c.method === "POST" && c.caminho === "/customers",
      ),
    ).toEqual([]);
  });

  it("falha no Asaas cancela a linha pendente, para nao travar o guard 409", async () => {
    estado.asaasErro = new Error("asaas fora do ar");

    await expect(
      asaasProvider.createCheckout(checkoutInput("pro_annual")),
    ).rejects.toThrow();

    const cancelamento = estado.escritas.find(
      (e) =>
        e.tabela === "subscriptions" &&
        e.operacao === "update" &&
        (e.carga as Record<string, unknown>).status === "canceled",
    );
    expect(cancelamento).toBeDefined();
  });
});

describe("guards de duplicidade", () => {
  beforeEach(limpar);

  it("usuario com assinatura ativa recebe 409 e nao toca o Asaas", async () => {
    estado.ativas = [{ id: "sub-viva" }];

    await expect(
      asaasProvider.createCheckout(checkoutInput("pro_annual")),
    ).rejects.toMatchObject({ code: "conflict" });
    expect(estado.asaas).toEqual([]);
  });

  it("usuario com Pix pendente recebe 409 de slug proprio", async () => {
    estado.pixPendentes = [{ id: "row-pendente" }];

    await expect(
      asaasProvider.createCheckout(checkoutInput("pro_annual")),
    ).rejects.toMatchObject({ code: "pix_pending" });
    expect(estado.asaas).toEqual([]);
  });
});

function eventoDePagamento(over: Record<string, unknown> = {}) {
  // `payment` e extraido do resto de proposito: um `...over` depois da chave
  // `payment` substituiria o objeto INTEIRO, e um caso que so queria mexer em
  // `value` perderia `id` e `externalReference` sem dizer nada.
  const { payment: pagamentoParcial, ...resto } = over;
  return {
    id: EVENTO,
    event: "PAYMENT_RECEIVED",
    dateCreated: "2026-08-29T12:00:00.000Z",
    ...resto,
    payment: {
      id: COBRANCA,
      value: 222,
      externalReference: "row-1",
      ...(pagamentoParcial as Record<string, unknown> | undefined),
    },
  } as Parameters<typeof processarEventoAsaas>[0];
}

describe("webhook: idempotencia", () => {
  beforeEach(() => {
    limpar();
    estado.linhaSubscription = {
      id: "row-1",
      user_id: USER,
      status: "pending",
      plan_id: "plan-anual",
      affiliate_code: null,
      coupon_code: null,
    };
  });

  it("a chave gravada tem o namespace do provedor", () => {
    expect(chaveDeEvento("evt_x")).toBe("asaas:evt_x");
    // Um id da Stripe nunca contem ':', entao colisao e impossivel por
    // construcao, que e o ponto do prefixo.
    expect(chaveDeEvento("evt_x")).not.toBe("evt_x");
  });

  it("o MESMO evento duas vezes ativa UMA vez so", async () => {
    const primeira = await processarEventoAsaas(eventoDePagamento());
    expect(primeira).toMatchObject({ received: true, activated: true });

    const segunda = await processarEventoAsaas(eventoDePagamento());
    expect(segunda).toMatchObject({ received: true, deduped: true });

    const ativacoes = estado.rpcCalls.filter(
      (c) => c.nome === "activate_subscription_exclusive",
    );
    expect(ativacoes).toHaveLength(1);
  });
});

describe("webhook: ativacao pela RPC", () => {
  beforeEach(() => {
    limpar();
    estado.linhaSubscription = {
      id: "row-1",
      user_id: USER,
      status: "pending",
      plan_id: "plan-anual",
      affiliate_code: null,
      coupon_code: null,
    };
  });

  it("chama a RPC uma vez, com os parametros da assinatura real", async () => {
    await processarEventoAsaas(eventoDePagamento());

    const ativacoes = estado.rpcCalls.filter(
      (c) => c.nome === "activate_subscription_exclusive",
    );
    expect(ativacoes).toHaveLength(1);
    expect(Object.keys(ativacoes[0].args).sort()).toEqual([
      "p_last_event_at",
      "p_period_end",
      "p_period_start",
      "p_raw_payload",
      "p_subscription_id",
      "p_user_id",
    ]);
    expect(ativacoes[0].args.p_subscription_id).toBe("row-1");
    expect(ativacoes[0].args.p_user_id).toBe(USER);
  });

  it("o periodo concedido e o do plano, nao um valor qualquer", async () => {
    await processarEventoAsaas(eventoDePagamento());

    const args = estado.rpcCalls[0].args;
    const inicio = new Date(String(args.p_period_start)).getTime();
    const fim = new Date(String(args.p_period_end)).getTime();
    expect(fim - inicio).toBe(365 * 24 * 60 * 60 * 1000);
  });

  it("NENHUMA escrita direta de status em subscriptions no caminho de ativacao", async () => {
    await processarEventoAsaas(eventoDePagamento());

    const escritasEmSubs = estado.escritas.filter(
      (e) => e.tabela === "subscriptions",
    );
    expect(escritasEmSubs).toEqual([]);
  });

  it("erro da RPC captura no Sentry e propaga", async () => {
    estado.ativacaoErro = { code: "40001", message: "serialization failure" };

    await expect(processarEventoAsaas(eventoDePagamento())).rejects.toThrow();

    const ativacao = estado.capturas.filter(
      (c) => c.mensagem === "asaas_ativacao_falhou",
    );
    expect(ativacao).toHaveLength(1);
    expect(ativacao[0].opcoes.extra).toMatchObject({
      user_id: USER,
      subscription_row_id: "row-1",
      event_id: EVENTO,
    });
  });

  it("PAYMENT_CONFIRMED ativa igual a PAYMENT_RECEIVED", async () => {
    const r = await processarEventoAsaas(
      eventoDePagamento({ event: "PAYMENT_CONFIRMED" }),
    );
    expect(r).toMatchObject({ activated: true });
  });
});

describe("webhook: comissao de afiliado", () => {
  beforeEach(() => {
    limpar();
    estado.linhaSubscription = {
      id: "row-1",
      user_id: USER,
      status: "pending",
      plan_id: "plan-anual",
      affiliate_code: "BORA10",
      coupon_code: null,
    };
    estado.ativacao = [
      {
        out_activated: true,
        out_superseded_count: 0,
        out_user_id: USER,
        out_plan_id: "plan-anual",
        out_affiliate_code: "BORA10",
        out_coupon_code: null,
      },
    ];
  });

  it("valor em reais vira centavos inteiros", () => {
    expect(paidAmountCentsFromAsaas(eventoDePagamento())).toBe(22200);
    expect(
      paidAmountCentsFromAsaas(
        eventoDePagamento({ payment: { value: 129.9 } }),
      ),
    ).toBe(12990);
  });

  it("ausencia de valor NAO vira zero: pula o incremento e captura", async () => {
    await processarEventoAsaas(
      eventoDePagamento({ payment: { value: undefined } }),
    );

    const incrementos = estado.rpcCalls.filter(
      (c) => c.nome === "increment_affiliate_conversion",
    );
    expect(incrementos).toEqual([]);

    const semValor = estado.capturas.filter(
      (c) => c.mensagem === "stripe_conversao_sem_valor_pago",
    );
    expect(semValor).toHaveLength(1);
    expect(semValor[0].opcoes.extra).toMatchObject({
      user_id: USER,
      affiliate_code: "BORA10",
      event_id: EVENTO,
    });
  });

  it("valor presente alimenta o incremento com o valor PAGO", async () => {
    await processarEventoAsaas(eventoDePagamento());

    const incrementos = estado.rpcCalls.filter(
      (c) => c.nome === "increment_affiliate_conversion",
    );
    expect(incrementos).toHaveLength(1);
    expect(incrementos[0].args.p_revenue_cents).toBe(22200);
  });
});

describe("webhook: encerramento e eventos desconhecidos", () => {
  beforeEach(() => {
    limpar();
    estado.linhaSubscription = {
      id: "row-1",
      user_id: USER,
      status: "pending",
      plan_id: "plan-anual",
      affiliate_code: null,
      coupon_code: null,
    };
  });

  it("PAYMENT_OVERDUE encerra a linha pendente, condicional em pending", async () => {
    await processarEventoAsaas(eventoDePagamento({ event: "PAYMENT_OVERDUE" }));

    const update = estado.escritas.find(
      (e) => e.tabela === "subscriptions" && e.operacao === "update",
    );
    expect((update!.carga as Record<string, unknown>).status).toBe("canceled");
    expect(estado.rpcCalls).toEqual([]);
  });

  it("PAYMENT_DELETED encerra do mesmo jeito", async () => {
    await processarEventoAsaas(eventoDePagamento({ event: "PAYMENT_DELETED" }));
    const update = estado.escritas.find(
      (e) => e.tabela === "subscriptions" && e.operacao === "update",
    );
    expect((update!.carga as Record<string, unknown>).status).toBe("canceled");
  });

  it("evento DESCONHECIDO devolve unhandled sem escrever nada", async () => {
    const r = await processarEventoAsaas(
      eventoDePagamento({ event: "PAYMENT_AWAITING_RISK_ANALYSIS" }),
    );

    expect(r).toMatchObject({ received: true, unhandled: true });
    // Nem sequer grava billing_events: o dedupe nao protege nada num evento que
    // nao muta, e a linha travaria um resend futuro se um handler surgir.
    expect(estado.escritas).toEqual([]);
  });

  it("evento sem id ou sem tipo nao explode: unhandled", async () => {
    const r = await processarEventoAsaas({ event: "PAYMENT_RECEIVED" });
    expect(r).toMatchObject({ unhandled: true });
  });

  it("pagamento SEM linha correspondente grita e propaga", async () => {
    estado.linhaSubscription = null;
    await expect(processarEventoAsaas(eventoDePagamento())).rejects.toThrow();
    expect(
      estado.capturas.filter((c) => c.mensagem === "asaas_webhook_falhou"),
    ).toHaveLength(1);
  });
});

describe("o gravador de escritas do duble funciona", () => {
  beforeEach(limpar);

  it("um UPDATE direto APARECE em estado.escritas", async () => {
    const { supabaseAdmin } = await import("../lib/supabaseAdmin");
    supabaseAdmin.from("subscriptions").update({ status: "active" });
    expect(estado.escritas).toHaveLength(1);
    expect(estado.escritas[0]).toMatchObject({
      tabela: "subscriptions",
      operacao: "update",
    });
  });
});

/**
 * LOTE 2b: efeitos de ativacao pelo caminho compartilhado.
 *
 * O Lote 2a reimplementava cache e cupom aqui por fora e NAO tinha o e-mail. O
 * primeiro caso abaixo e o que teria acusado isso: ele afirma o conjunto
 * COMPLETO de efeitos, e o e-mail e o membro que faltava.
 *
 * O segundo grupo e a regra que impede o oposto: reentrega nao pode reenviar
 * e-mail nem recontar comissao.
 */
describe("ativacao Pix dispara o conjunto COMPLETO de efeitos", () => {
  beforeEach(() => {
    limpar();
    estado.linhaSubscription = {
      id: "row-1",
      user_id: USER,
      status: "pending",
      plan_id: "plan-anual",
      affiliate_code: "BORA10",
      coupon_code: "PROMO20",
    };
    estado.ativacao = [
      {
        out_activated: true,
        out_superseded_count: 0,
        out_user_id: USER,
        out_plan_id: "plan-anual",
        out_affiliate_code: "BORA10",
        out_coupon_code: "PROMO20",
      },
    ];
  });

  it("e-mail de confirmacao sai UMA vez, com o plano", async () => {
    await processarEventoAsaas(eventoDePagamento());

    expect(estado.emails).toHaveLength(1);
    expect(estado.emails[0]).toMatchObject({
      type: "pro_upgrade",
      to: "pessoa@exemplo.com",
      planName: "Pro Anual",
    });
  });

  it("comissao de afiliado conta UMA vez, com o valor pago", async () => {
    await processarEventoAsaas(eventoDePagamento());

    const conversoes = estado.rpcCalls.filter(
      (c) => c.nome === "increment_affiliate_conversion",
    );
    expect(conversoes).toHaveLength(1);
    expect(conversoes[0].args.p_revenue_cents).toBe(22200);
  });

  it("resgate de cupom conta UMA vez", async () => {
    await processarEventoAsaas(eventoDePagamento());

    const resgates = estado.rpcCalls.filter(
      (c) => c.nome === "increment_coupon_redemption",
    );
    expect(resgates).toHaveLength(1);
    expect(resgates[0].args.p_code).toBe("PROMO20");
  });

  it("os TRES efeitos saem na mesma ativacao, nao um subconjunto", async () => {
    await processarEventoAsaas(eventoDePagamento());

    expect(estado.emails).toHaveLength(1);
    expect(
      estado.rpcCalls.filter(
        (c) => c.nome === "increment_affiliate_conversion",
      ),
    ).toHaveLength(1);
    expect(
      estado.rpcCalls.filter((c) => c.nome === "increment_coupon_redemption"),
    ).toHaveLength(1);
  });
});

describe("reentrega NAO redispara efeito nenhum", () => {
  beforeEach(() => {
    limpar();
    estado.linhaSubscription = {
      id: "row-1",
      user_id: USER,
      status: "pending",
      plan_id: "plan-anual",
      affiliate_code: "BORA10",
      coupon_code: "PROMO20",
    };
    estado.ativacao = [
      {
        out_activated: false,
        out_superseded_count: 0,
        out_user_id: USER,
        out_plan_id: "plan-anual",
        out_affiliate_code: "BORA10",
        out_coupon_code: "PROMO20",
      },
    ];
  });

  it("out_activated=false: zero e-mail, zero comissao, zero cupom", async () => {
    await processarEventoAsaas(eventoDePagamento());

    expect(estado.emails).toEqual([]);
    expect(
      estado.rpcCalls.filter(
        (c) => c.nome !== "activate_subscription_exclusive",
      ),
    ).toEqual([]);
  });

  it("o MESMO evento duas vezes envia UM e-mail so", async () => {
    estado.ativacao = [
      {
        out_activated: true,
        out_superseded_count: 0,
        out_user_id: USER,
        out_plan_id: "plan-anual",
        out_affiliate_code: null,
        out_coupon_code: null,
      },
    ];

    await processarEventoAsaas(eventoDePagamento());
    await processarEventoAsaas(eventoDePagamento());

    expect(estado.emails).toHaveLength(1);
  });
});

describe("cancel e reactivate do Pix: contrato do boleto", () => {
  beforeEach(() => {
    limpar();
    estado.linhaSubscription = {
      id: "row-1",
      provider_subscription_id: COBRANCA,
      current_period_end: "2027-08-29T00:00:00.000Z",
      status: "active",
    };
  });

  const entradaDeCancel = {
    userId: USER,
    actorUserId: USER,
    reasonCode: "expensive",
    reasonText: "",
  };

  it("cancel registra a intencao e NAO chama o Asaas", async () => {
    const r = await asaasProvider.cancel(entradaDeCancel);

    const insercoes = estado.escritas.filter(
      (e) =>
        e.tabela === "subscription_cancellations" && e.operacao === "insert",
    );
    expect(insercoes).toHaveLength(1);
    expect(insercoes[0].carga).toMatchObject({
      user_id: USER,
      status: "scheduled",
      effective_at: "2027-08-29T00:00:00.000Z",
    });
    expect(estado.asaas).toEqual([]);
    expect(r.non_renewal).toBe(true);
    // NAO seta cancel_at_period_end: isso acordaria o bug latente do cron.
    expect(r.cancel_at_period_end).toBe(false);
  });

  it("cancel NAO escreve em subscriptions: o acesso acaba pelo periodo", async () => {
    await asaasProvider.cancel(entradaDeCancel);

    expect(estado.escritas.filter((e) => e.tabela === "subscriptions")).toEqual(
      [],
    );
  });

  it("cancel e idempotente: intencao ja existente nao insere de novo", async () => {
    // A pre-checagem encontra uma intencao viva pelo mesmo maybeSingle.
    estado.intencaoExistente = { id: "intent-1" };

    const r = await asaasProvider.cancel(entradaDeCancel);

    expect(
      estado.escritas.filter((e) => e.tabela === "subscription_cancellations"),
    ).toEqual([]);
    expect(r.non_renewal).toBe(true);
  });

  it("cancel sem assinatura ativa: 404, e nada e escrito", async () => {
    estado.linhaSubscription = null;

    await expect(asaasProvider.cancel(entradaDeCancel)).rejects.toMatchObject({
      code: "not_found",
    });
    expect(estado.escritas).toEqual([]);
  });

  it("reactivate marca a intencao como reverted, sem tocar o Asaas", async () => {
    const r = await asaasProvider.reactivate({ userId: USER });

    const updates = estado.escritas.filter(
      (e) =>
        e.tabela === "subscription_cancellations" && e.operacao === "update",
    );
    expect(updates).toHaveLength(1);
    expect(updates[0].carga).toMatchObject({ status: "reverted" });
    expect(estado.asaas).toEqual([]);
    expect(r.cancel_at_period_end).toBe(false);
  });

  it("reactivate sem assinatura manda para o checkout, nao erro", async () => {
    estado.linhaSubscription = null;

    const r = await asaasProvider.reactivate({ userId: USER });

    expect(r.redirect_to_checkout).toBe(true);
    expect(r.checkout_path).toBe("/planos");
    expect(estado.escritas).toEqual([]);
  });
});
