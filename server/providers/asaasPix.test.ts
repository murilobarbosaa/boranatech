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
  /** Linha de coupons devolvida por findValidCoupon. */
  cupom: null as Record<string, unknown> | null,
  /** CPF gravado em profiles. CPF valido de teste (digitos verificadores ok). */
  cpfDoPerfil: "52998224725" as string | null,
  /** Intencao de nao renovar ja existente, para o caso idempotente. */
  intencaoExistente: null as Record<string, unknown> | null,
  /** E-mails enfileirados, na ordem. */
  emails: [] as Array<Record<string, unknown>>,
  /** Linha de affiliates devolvida na busca por codigo. */
  afiliado: { id: "aff-1" } as Record<string, unknown> | null,
  /** Resultado da RPC de activation. */
  activation: null as unknown,
  activationError: null as { code?: string; message: string } | null,
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
      if (tabela === "coupons") return { data: estado.cupom, error: null };
      if (tabela === "profiles")
        return { data: { gender: null, cpf: estado.cpfDoPerfil }, error: null };
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
          if (estado.activationError)
            return { data: null, error: estado.activationError };
          return { data: estado.activation, error: null };
        }
        return { data: null, error: null };
      },
    },
  };
});

import { oneOffAccessDays } from "../../shared/paymentMethods";
import { discountedPriceCents, PLAN_PRICING } from "../../shared/planPricing";
import { fetchPixQrCode, maskCpf } from "./asaas";
import {
  eventKey,
  paidAmountCentsFromAsaas,
  processAsaasEvent,
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
  estado.cpfDoPerfil = "52998224725";
  estado.cupom = null;
  estado.eventosVistos = new Set();
  estado.activation = [
    {
      out_activated: true,
      out_superseded_count: 0,
      out_user_id: USER,
      out_plan_id: "plan-anual",
      out_affiliate_code: null,
      out_coupon_code: null,
    },
  ];
  estado.activationError = null;
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

  it("semestral e anual vem do ponto unico, com os MESMOS dias do boleto", () => {
    expect(oneOffAccessDays("pro_semiannual")).toBe(182);
    expect(oneOffAccessDays("pro_annual")).toBe(365);
    expect(oneOffAccessDays("pro_monthly")).toBeUndefined();
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

/**
 * FORMA REAL do `dateCreated` do event, medida em 2026-09-02 sobre a linha de
 * `billing_events` do unico pagamento Pix confirmado: 19 caracteres, espaco no
 * lugar do `T` e SEM offset nenhum, em horario de Brasilia.
 *
 * Ate 2026-09-02 esta fixture usava `"2026-08-29T12:00:00.000Z"`, uma forma que
 * o Asaas nao manda. O teste exercitava um payload mais facil que o real, e o
 * defeito que ele deveria ter pego (a string sem offset gravada como UTC, tres
 * horas de erro) passou para producao. O harness que nao reproduz a condicao nao
 * a testa.
 */
const DATE_CREATED_REAL = "2026-08-29 12:00:00";
/** O mesmo instante em UTC. Escrito a mao: 12:00 em -03:00 e 15:00Z. */
const DATE_CREATED_REAL_ISO = "2026-08-29T15:00:00.000Z";

function eventoDePagamento(over: Record<string, unknown> = {}) {
  // `payment` e extraido do resto de proposito: um `...over` depois da chave
  // `payment` substituiria o objeto INTEIRO, e um caso que so queria mexer em
  // `value` perderia `id` e `externalReference` sem dizer nada.
  const { payment: pagamentoParcial, ...resto } = over;
  return {
    id: EVENTO,
    event: "PAYMENT_RECEIVED",
    dateCreated: DATE_CREATED_REAL,
    ...resto,
    payment: {
      id: COBRANCA,
      value: 222,
      // `netValue` entra na fixture porque o ledger o EXIGE: sem ele a linha de
      // receita nao e montada. O par 222 / 217,72 e a taxa de 4,28 do Pix no
      // plano anual, na mesma proporcao do pagamento real (12,90 / 10,91).
      netValue: 217.72,
      externalReference: "row-1",
      ...(pagamentoParcial as Record<string, unknown> | undefined),
    },
  } as Parameters<typeof processAsaasEvent>[0];
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
    expect(eventKey("evt_x")).toBe("asaas:evt_x");
    // Um id da Stripe nunca contem ':', entao colisao e impossivel por
    // construcao, que e o ponto do prefixo.
    expect(eventKey("evt_x")).not.toBe("evt_x");
  });

  it("o MESMO evento duas vezes ativa UMA vez so", async () => {
    const primeira = await processAsaasEvent(eventoDePagamento());
    expect(primeira).toMatchObject({ received: true, activated: true });

    const segunda = await processAsaasEvent(eventoDePagamento());
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
    await processAsaasEvent(eventoDePagamento());

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
    await processAsaasEvent(eventoDePagamento());

    const args = estado.rpcCalls[0].args;
    const inicio = new Date(String(args.p_period_start)).getTime();
    const fim = new Date(String(args.p_period_end)).getTime();
    expect(fim - inicio).toBe(365 * 24 * 60 * 60 * 1000);
  });

  it("NENHUMA escrita direta de status em subscriptions no caminho de activation", async () => {
    await processAsaasEvent(eventoDePagamento());

    const escritasEmSubs = estado.escritas.filter(
      (e) => e.tabela === "subscriptions",
    );
    expect(escritasEmSubs).toEqual([]);
  });

  it("erro da RPC captura no Sentry e propaga", async () => {
    estado.activationError = {
      code: "40001",
      message: "serialization failure",
    };

    await expect(processAsaasEvent(eventoDePagamento())).rejects.toThrow();

    const activation = estado.capturas.filter(
      (c) => c.mensagem === "asaas_ativacao_falhou",
    );
    expect(activation).toHaveLength(1);
    expect(activation[0].opcoes.extra).toMatchObject({
      user_id: USER,
      subscription_row_id: "row-1",
      event_id: EVENTO,
    });
  });

  it("PAYMENT_CONFIRMED ativa igual a PAYMENT_RECEIVED", async () => {
    const r = await processAsaasEvent(
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
    estado.activation = [
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
    await processAsaasEvent(
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
    await processAsaasEvent(eventoDePagamento());

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
    await processAsaasEvent(eventoDePagamento({ event: "PAYMENT_OVERDUE" }));

    const update = estado.escritas.find(
      (e) => e.tabela === "subscriptions" && e.operacao === "update",
    );
    expect((update!.carga as Record<string, unknown>).status).toBe("canceled");
    expect(estado.rpcCalls).toEqual([]);
  });

  it("PAYMENT_DELETED encerra do mesmo jeito", async () => {
    await processAsaasEvent(eventoDePagamento({ event: "PAYMENT_DELETED" }));
    const update = estado.escritas.find(
      (e) => e.tabela === "subscriptions" && e.operacao === "update",
    );
    expect((update!.carga as Record<string, unknown>).status).toBe("canceled");
  });

  it("evento DESCONHECIDO devolve unhandled, mas GUARDA o raw", async () => {
    const r = await processAsaasEvent(
      eventoDePagamento({ event: "PAYMENT_AWAITING_RISK_ANALYSIS" }),
    );

    expect(r).toMatchObject({ received: true, unhandled: true });

    // DECISAO INVERTIDA EM 2026-09-02, e este teste afirmava o contrario.
    //
    // A versao anterior nao gravava nada, pelo motivo que estava escrito aqui: a
    // linha travaria um resend futuro se um handler surgisse. O argumento
    // continua valendo e mesmo assim perdeu, porque o caso real chegou: um
    // `PAYMENT_REFUNDED` caiu neste ramo e nao deixou rastro nenhum, nem em
    // billing_events nem em lugar nenhum. Sem o `raw` guardado nao existe
    // backfill possivel, e o resend do Asaas nao e eterno; a linha e.
    //
    // A recuperacao de um tipo que passa a ser tratado deixa de ser resend e
    // passa a ser backfill sobre estas linhas
    // (scripts/asaasLedgerBackfill.mts).
    expect(estado.escritas).toHaveLength(1);
    expect(estado.escritas[0].tabela).toBe("billing_events");
    expect(estado.escritas[0].operacao).toBe("upsert");

    // NADA mais foi tocado: o PROCESSAMENTO continua condicional, so o REGISTRO
    // deixou de ser.
    expect(estado.escritas.filter((e) => e.tabela === "subscriptions")).toEqual(
      [],
    );
    expect(estado.rpcCalls).toEqual([]);
  });

  it("evento sem id ou sem tipo nao explode: unhandled", async () => {
    const r = await processAsaasEvent({ event: "PAYMENT_RECEIVED" });
    expect(r).toMatchObject({ unhandled: true });
  });

  it("pagamento SEM linha correspondente grita e propaga", async () => {
    estado.linhaSubscription = null;
    await expect(processAsaasEvent(eventoDePagamento())).rejects.toThrow();
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
 * LOTE 2b: efeitos de activation pelo caminho compartilhado.
 *
 * O Lote 2a reimplementava cache e cupom aqui por fora e NAO tinha o e-mail. O
 * primeiro caso abaixo e o que teria acusado isso: ele afirma o conjunto
 * COMPLETO de efeitos, e o e-mail e o membro que faltava.
 *
 * O segundo grupo e a regra que impede o oposto: reentrega nao pode reenviar
 * e-mail nem recontar comissao.
 */
describe("activation Pix dispara o conjunto COMPLETO de efeitos", () => {
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
    estado.activation = [
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
    await processAsaasEvent(eventoDePagamento());

    expect(estado.emails).toHaveLength(1);
    expect(estado.emails[0]).toMatchObject({
      type: "pro_upgrade",
      to: "pessoa@exemplo.com",
      planName: "Pro Anual",
    });
  });

  it("comissao de afiliado conta UMA vez, com o valor pago", async () => {
    await processAsaasEvent(eventoDePagamento());

    const conversoes = estado.rpcCalls.filter(
      (c) => c.nome === "increment_affiliate_conversion",
    );
    expect(conversoes).toHaveLength(1);
    expect(conversoes[0].args.p_revenue_cents).toBe(22200);
  });

  it("resgate de cupom conta UMA vez", async () => {
    await processAsaasEvent(eventoDePagamento());

    const resgates = estado.rpcCalls.filter(
      (c) => c.nome === "increment_coupon_redemption",
    );
    expect(resgates).toHaveLength(1);
    expect(resgates[0].args.p_code).toBe("PROMO20");
  });

  it("os TRES efeitos saem na mesma activation, nao um subconjunto", async () => {
    await processAsaasEvent(eventoDePagamento());

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
    estado.activation = [
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
    await processAsaasEvent(eventoDePagamento());

    expect(estado.emails).toEqual([]);
    expect(
      estado.rpcCalls.filter(
        (c) => c.nome !== "activate_subscription_exclusive",
      ),
    ).toEqual([]);
  });

  it("o MESMO evento duas vezes envia UM e-mail so", async () => {
    estado.activation = [
      {
        out_activated: true,
        out_superseded_count: 0,
        out_user_id: USER,
        out_plan_id: "plan-anual",
        out_affiliate_code: null,
        out_coupon_code: null,
      },
    ];

    await processAsaasEvent(eventoDePagamento());
    await processAsaasEvent(eventoDePagamento());

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

/**
 * CPF NO FLUXO PIX (defeito achado no 2d-prod, com dinheiro real).
 *
 * O Asaas RECUSA criar a cobranca sem documento do cliente (`invalid_object`),
 * e o fluxo do Lote 2a nao coletava nem enviava. O sintoma chegava como 502
 * generico depois de ja existir uma row `pending` para compensar: a pessoa via
 * "falha no provedor" quando o que faltava era um dado dela.
 *
 * A Stripe nunca exibiu isso porque o checkout HOSPEDADO dela coleta o
 * documento quando o boleto exige. Aqui a cobranca nasce por API, entao a
 * coleta e nossa.
 */
describe("CPF e pre-requisito, e a checagem vem ANTES de tudo", () => {
  beforeEach(limpar);

  it("sem CPF: 422 NOMEADO, e o slug e o que a UI usa para abrir a coleta", async () => {
    estado.cpfDoPerfil = null;

    await expect(
      asaasProvider.createCheckout(checkoutInput("pro_annual")),
    ).rejects.toMatchObject({ statusCode: 422, code: "cpf_obrigatorio" });
  });

  it("sem CPF: ZERO chamada remota e ZERO row local", async () => {
    // E o ponto da ordem. Se a guarda viesse depois, sobraria row `pending`
    // para o cron limpar e o guard 409 travaria a proxima tentativa.
    estado.cpfDoPerfil = null;

    await expect(
      asaasProvider.createCheckout(checkoutInput("pro_annual")),
    ).rejects.toThrow();

    expect(estado.asaas).toEqual([]);
    expect(estado.escritas).toEqual([]);
  });

  it("CPF invalido conta como ausente: digito verificador errado nao passa", async () => {
    // MESMO validador do PATCH /api/me. Um CPF com 11 digitos mas invalido
    // seria aceito por uma checagem de comprimento e recusado pelo Asaas
    // adiante, que e o defeito com outro disfarce.
    estado.cpfDoPerfil = "11111111111";

    await expect(
      asaasProvider.createCheckout(checkoutInput("pro_annual")),
    ).rejects.toMatchObject({ code: "cpf_obrigatorio" });
    expect(estado.asaas).toEqual([]);
  });

  it("CPF com mascara no banco e aceito: comparamos digitos", async () => {
    estado.cpfDoPerfil = "529.982.247-25";

    await asaasProvider.createCheckout(checkoutInput("pro_annual"));

    expect(estado.asaas.length).toBeGreaterThan(0);
  });
});

describe("o documento viaja para o Asaas", () => {
  beforeEach(limpar);

  it("cliente NOVO nasce com cpfCnpj, so digitos", async () => {
    estado.asaasResposta = {
      "/customers?": { data: [] },
      "/customers": { id: "cus_novo" },
      "/payments": { id: COBRANCA, invoiceUrl: "https://asaas.test/i/1" },
    };

    await asaasProvider.createCheckout(checkoutInput("pro_annual"));

    const criacao = estado.asaas.find(
      (c) => c.caminho === "/customers" && c.method === "POST",
    );
    expect((criacao!.body as Record<string, unknown>).cpfCnpj).toBe(
      "52998224725",
    );
  });

  it("cliente EXISTENTE com documento divergente e atualizado ANTES da cobranca", async () => {
    // O cliente pode ter sido criado antes de o documento ser exigido, ou a
    // pessoa pode ter corrigido o CPF no perfil depois. Nos dois casos a
    // cobranca seria recusada e o sintoma pareceria falha de pagamento.
    estado.asaasResposta = {
      "/customers?": { data: [{ id: "cus_1", cpfCnpj: "00000000000" }] },
      "/customers/cus_1": { id: "cus_1" },
      "/payments": { id: COBRANCA, invoiceUrl: "https://asaas.test/i/1" },
    };

    await asaasProvider.createCheckout(checkoutInput("pro_annual"));

    const indiceUpdate = estado.asaas.findIndex(
      (c) => c.caminho === "/customers/cus_1",
    );
    const indiceCobranca = estado.asaas.findIndex(
      (c) => c.caminho === "/payments",
    );
    expect(indiceUpdate).toBeGreaterThanOrEqual(0);
    expect(indiceUpdate).toBeLessThan(indiceCobranca);
    expect(
      (estado.asaas[indiceUpdate].body as Record<string, unknown>).cpfCnpj,
    ).toBe("52998224725");
  });

  it("cliente EXISTENTE com o MESMO documento nao e atualizado a toa", async () => {
    estado.asaasResposta = {
      "/customers?": { data: [{ id: "cus_1", cpfCnpj: "529.982.247-25" }] },
      "/payments": { id: COBRANCA, invoiceUrl: "https://asaas.test/i/1" },
    };

    await asaasProvider.createCheckout(checkoutInput("pro_annual"));

    expect(
      estado.asaas.filter((c) => c.caminho === "/customers/cus_1"),
    ).toEqual([]);
  });
});

describe("o CPF nao vaza", () => {
  it("maskCpf mostra o bastante para casar, e nada para reconstruir", () => {
    expect(maskCpf("52998224725")).toBe("529.***.**25");
    expect(maskCpf("52998224725")).not.toContain("982");
    expect(maskCpf("123")).toBe("invalido");
  });

  it("nenhuma captura de Sentry do fluxo carrega o documento", async () => {
    limpar();
    estado.asaasErro = new Error("asaas fora do ar");

    await expect(
      asaasProvider.createCheckout(checkoutInput("pro_annual")),
    ).rejects.toThrow();

    const serializado = JSON.stringify(estado.capturas);
    expect(serializado).not.toContain("52998224725");
  });
});

/**
 * CUPOM NO PRECO DA COBRANCA (defeito achado no 2d-prod, com dinheiro real).
 *
 * Medido ao vivo: cupom de 90 por cento, tela mostrando o valor com desconto, e
 * a cobranca criada no Asaas com o valor CHEIO.
 *
 * A causa era estrutural, nao um esquecimento: no fluxo da Stripe a validacao e
 * nossa mas a ARITMETICA e deles (a sessao recebe `discounts` e o checkout
 * hospedado faz a conta), entao nosso codigo nunca precisou calcular valor com
 * desconto. O Asaas cria a cobranca por API, com o valor ja resolvido, e herdou
 * o preco base.
 *
 * O teste do Lote 2c passou com o defeito presente porque afirmava
 * `externalReference` e `billingType` da cobranca, **nunca o `value`**. Estes
 * casos afirmam o numero.
 */
function cupomDe(percent: number) {
  return {
    code: "PROMO",
    discount_percent: percent,
    valid_from: null,
    valid_until: null,
    max_redemptions: null,
    times_redeemed: 0,
    applicable_plans: null,
  };
}

function comCupom(planId: string, code: string) {
  return {
    user: { id: USER, email: "pessoa@exemplo.com" },
    planId,
    affiliateCode: "",
    couponCode: code,
    paymentMethod: "pix",
  } as unknown as Parameters<typeof asaasProvider.createCheckout>[0];
}

/** O valor que a cobranca levou ao Asaas, em centavos. */
function valorCobradoCents() {
  const pagamento = estado.asaas.find((c) => c.caminho === "/payments");
  return Math.round(
    Number((pagamento!.body as Record<string, unknown>).value) * 100,
  );
}

describe("o valor da cobranca respeita o cupom", () => {
  beforeEach(limpar);

  it("90 por cento no semestral: cobra 12,90, nao 129,00", async () => {
    estado.cupom = cupomDe(90);

    await asaasProvider.createCheckout(comCupom("pro_semiannual", "PROMO"));

    expect(valorCobradoCents()).toBe(1290);
  });

  it("o valor cobrado e IDENTICO a previa do frontend, pela MESMA funcao", async () => {
    // Nao e "dois calculos que dao o mesmo numero": e a mesma implementacao
    // (`discountedPriceCents`, shared/planPricing.ts) dos dois lados. Se ela
    // mudar, muda para tela e cobranca ao mesmo tempo.
    estado.cupom = cupomDe(30);
    const baseCents = Math.round(PLAN_PRICING.pro_annual.total * 100);
    const previa = discountedPriceCents(baseCents, 30);

    await asaasProvider.createCheckout(comCupom("pro_annual", "PROMO"));

    expect(valorCobradoCents()).toBe(previa);
  });

  it("SEM cupom o valor e o cheio: comportamento de hoje inalterado", async () => {
    await asaasProvider.createCheckout(checkoutInput("pro_annual"));

    expect(valorCobradoCents()).toBe(
      Math.round(PLAN_PRICING.pro_annual.total * 100),
    );
  });

  it("cupom INVALIDO nao derruba a compra: cobra cheio e nao grava o codigo", async () => {
    // Mesma regra do fluxo Stripe: cupom nunca impede a assinatura.
    estado.cupom = null;

    await asaasProvider.createCheckout(comCupom("pro_annual", "NAOEXISTE"));

    expect(valorCobradoCents()).toBe(
      Math.round(PLAN_PRICING.pro_annual.total * 100),
    );
    const insert = estado.escritas.find((e) => e.operacao === "insert");
    expect((insert!.carga as Record<string, unknown>).coupon_code).toBeNull();
  });

  it("NAO e primeira compra: cupom nao aplica, igual a Stripe", async () => {
    // `isFirstPurchase` acha uma sub ja ativada.
    estado.linhaSubscription = {
      id: "sub-velha",
      current_period_start: "2026-01-01",
    };
    estado.cupom = cupomDe(90);

    await asaasProvider.createCheckout(comCupom("pro_annual", "PROMO"));

    expect(valorCobradoCents()).toBe(
      Math.round(PLAN_PRICING.pro_annual.total * 100),
    );
  });
});

describe("rastro do cupom: so o APROVADO viaja", () => {
  beforeEach(limpar);

  it("cupom valido: a row leva o codigo canonico do banco", async () => {
    estado.cupom = cupomDe(50);

    // O cliente mandou minusculo; o que grava e o `code` da linha de coupons.
    await asaasProvider.createCheckout(comCupom("pro_annual", "PROMO"));

    const insert = estado.escritas.find((e) => e.operacao === "insert");
    expect((insert!.carga as Record<string, unknown>).coupon_code).toBe(
      "PROMO",
    );
  });

  it("activation com cupom conta resgate UMA vez, e a reentrega nao duplica", async () => {
    estado.linhaSubscription = {
      id: "row-1",
      user_id: USER,
      status: "pending",
      plan_id: "plan-anual",
      affiliate_code: null,
      coupon_code: "PROMO",
    };
    estado.activation = [
      {
        out_activated: true,
        out_superseded_count: 0,
        out_user_id: USER,
        out_plan_id: "plan-anual",
        out_affiliate_code: null,
        out_coupon_code: "PROMO",
      },
    ];

    await processAsaasEvent(eventoDePagamento());
    await processAsaasEvent(eventoDePagamento());

    const resgates = estado.rpcCalls.filter(
      (c) => c.nome === "increment_coupon_redemption",
    );
    expect(resgates).toHaveLength(1);
    expect(resgates[0].args.p_code).toBe("PROMO");
  });
});

describe("piso do Asaas", () => {
  beforeEach(limpar);

  it("desconto que derruba abaixo de R$ 5,00: 422 nomeado", async () => {
    // 97 por cento de R$ 129,00 da R$ 3,87, abaixo do minimo do provedor.
    estado.cupom = cupomDe(97);

    await expect(
      asaasProvider.createCheckout(comCupom("pro_semiannual", "PROMO")),
    ).rejects.toMatchObject({ statusCode: 422, code: "valor_minimo_pix" });
  });

  it("abaixo do piso: ZERO chamada remota e ZERO row local", async () => {
    estado.cupom = cupomDe(97);

    await expect(
      asaasProvider.createCheckout(comCupom("pro_semiannual", "PROMO")),
    ).rejects.toThrow();

    expect(estado.asaas).toEqual([]);
    expect(estado.escritas).toEqual([]);
  });

  it("exatamente no piso passa: a recusa e ABAIXO, nao no limite", async () => {
    // 12900 menos 96 por cento da 516, acima de 500.
    estado.cupom = cupomDe(96);

    await asaasProvider.createCheckout(comCupom("pro_semiannual", "PROMO"));

    expect(valorCobradoCents()).toBe(516);
  });
});

describe("arredondamento: centavos inteiros, mesma regra da previa", () => {
  it("percentual exato nao sofre drift", () => {
    expect(discountedPriceCents(12900, 90)).toBe(1290);
    expect(discountedPriceCents(22200, 30)).toBe(15540);
  });

  it("fracao de centavo arredonda, e a regra e a do desconto (nao a do resto)", () => {
    // 33 por cento de 2990 da 986,7 de desconto: arredonda para 987, e o final
    // fica 2003. A regra arredonda o DESCONTO, nao o preco final, e as duas
    // dariam numeros diferentes.
    expect(discountedPriceCents(2990, 33)).toBe(2003);
    expect(2990 - Math.round((2990 * 33) / 100)).toBe(2003);
  });

  it("os planos que aceitam Pix nunca caem no caso fracionario", () => {
    // 12900 e 22200 sao divisiveis por 100, entao `cents * percent / 100` e
    // sempre inteiro para percentual inteiro. O caso acima existe para travar a
    // REGRA, nao porque o Pix o alcance hoje.
    for (const cents of [12900, 22200]) {
      for (let p = 1; p <= 99; p++) {
        expect(Number.isInteger((cents * p) / 100)).toBe(true);
      }
    }
  });
});

/**
 * QR CODE PIX NATIVO.
 *
 * O QR passou a viver na nossa tela em vez da fatura hospedada do Asaas. O que
 * estes casos travam e a parte que nao aparece na tela: o `flow` aditivo (bundle
 * antigo continua redirecionando) e a traducao de uma resposta 200 INCOMPLETA do
 * provedor, que sem nome viraria "erro de rede" na investigacao.
 */
describe("QR Code Pix", () => {
  beforeEach(limpar);

  it("checkout de Pix marca flow=native_pix E mantem invoiceUrl", async () => {
    // EXPAND: o campo novo entra ao lado do antigo. Bundle ja em execucao le
    // `checkoutUrl` e nao recarrega sozinho; remover seria quebra seca.
    const r = await asaasProvider.createCheckout(checkoutInput("pro_annual"));

    expect(r.flow).toBe("native_pix");
    expect(r.checkoutUrl).toBe("https://asaas.test/i/123");
  });

  it("devolve encodedImage, payload e expirationDate da cobranca", async () => {
    estado.asaasResposta = {
      "/payments/pay_1/pixQrCode": {
        encodedImage: "iVBORw0KGgo=",
        payload: "00020126...5204",
        expirationDate: "2026-09-02 23:59:59",
      },
    };

    const qr = await fetchPixQrCode("pay_1");

    expect(qr).toEqual({
      encodedImage: "iVBORw0KGgo=",
      payload: "00020126...5204",
      expirationDate: "2026-09-02 23:59:59",
    });
  });

  it("expirationDate ausente vira null, nao some do contrato", async () => {
    estado.asaasResposta = {
      "/payments/pay_1/pixQrCode": {
        encodedImage: "iVBORw0KGgo=",
        payload: "00020126",
      },
    };

    const qr = await fetchPixQrCode("pay_1");
    expect(qr.expirationDate).toBeNull();
  });

  it("resposta 200 INCOMPLETA vira erro NOMEADO, nao 502 de rede", async () => {
    // Distinguir "a cobranca existe mas nao tem QR" de "o Asaas caiu" e a
    // diferenca entre investigar o pagamento e investigar a infraestrutura.
    estado.asaasResposta = { "/payments/pay_1/pixQrCode": { payload: "x" } };

    await expect(fetchPixQrCode("pay_1")).rejects.toMatchObject({
      code: "pix_qrcode_indisponivel",
    });
  });

  it("o id da cobranca vai ESCAPADO na URL", async () => {
    estado.asaasResposta = {
      "/payments/": { encodedImage: "a", payload: "b" },
    };

    await fetchPixQrCode("pay/../outro");

    expect(estado.asaas[0].caminho).toBe(
      "/payments/pay%2F..%2Foutro/pixQrCode",
    );
  });
});

describe("ledger: a cobranca Pix vira linha de finance_transactions", () => {
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

  const linhaDoLedger = () =>
    estado.escritas.find(
      (e) => e.tabela === "finance_transactions" && e.operacao === "upsert",
    )?.carga as Record<string, unknown> | undefined;

  it("grava UMA linha, com os valores em centavos e a taxa derivada", async () => {
    await processAsaasEvent(eventoDePagamento());

    const linha = linhaDoLedger();
    expect(linha).toBeDefined();
    // 222,00 e 217,72 em reais. A taxa e a subtracao, nunca um campo do payload.
    expect(linha!.gross_cents).toBe(22200);
    expect(linha!.net_cents).toBe(21772);
    expect(linha!.fee_cents).toBe(428);
    expect(linha!.type).toBe("charge");
    expect(linha!.currency).toBe("BRL");
  });

  it("occurred_at e o dateCreated do event lido como Brasilia, nao UTC", async () => {
    await processAsaasEvent(eventoDePagamento());

    // 12:00:00 em Brasilia e 15:00:00Z. Ler a string crua daria 12:00:00Z, que
    // e o defeito de tres horas que existiu em producao.
    expect(linhaDoLedger()!.occurred_at).toBe(DATE_CREATED_REAL_ISO);
    expect(linhaDoLedger()!.occurred_at).not.toBe("2026-08-29T12:00:00.000Z");
  });

  it("identidade e provedor, sem nenhuma coluna da Stripe", async () => {
    await processAsaasEvent(eventoDePagamento());

    const linha = linhaDoLedger()!;
    expect(linha.provider).toBe("asaas");
    expect(linha.provider_transaction_id).toBe(COBRANCA);
    expect(linha.stripe_balance_transaction_id).toBeNull();
    expect(linha.stripe_charge_id).toBeNull();
    expect(linha.stripe_invoice_id).toBeNull();
  });

  it("dono e plano vem da row de subscriptions, nao do payload", async () => {
    await processAsaasEvent(eventoDePagamento());

    const linha = linhaDoLedger()!;
    expect(linha.user_id).toBe(USER);
    expect(linha.plan_code).toBe("pro_annual");
  });

  it("o ledger vem DEPOIS da RPC de ativacao", async () => {
    await processAsaasEvent(eventoDePagamento());

    // O acesso e o efeito que importa: um ledger lento ou fora do ar nao pode
    // atrasar a ativacao de quem pagou.
    const posLedger = estado.escritas.findIndex(
      (e) => e.tabela === "finance_transactions",
    );
    expect(posLedger).toBeGreaterThanOrEqual(0);
    expect(estado.rpcCalls.map((c) => c.nome)).toContain(
      "activate_subscription_exclusive",
    );
  });

  it("falha do ledger NAO derruba a ativacao, e grita no Sentry", async () => {
    // Sem netValue a linha nao e montavel. A ativacao ja aconteceu e nao pode
    // ser desfeita por causa disso.
    const r = await processAsaasEvent(
      eventoDePagamento({ payment: { netValue: undefined } }),
    );

    expect(r).toMatchObject({ received: true, activated: true });
    expect(linhaDoLedger()).toBeUndefined();
    expect(estado.capturas.map((c) => c.mensagem)).toContain(
      "asaas_ledger_falhou",
    );
    // O billing_event CONTINUA gravado: e dele que o backfill reconstroi.
    expect(
      estado.escritas.some((e) => e.tabela === "billing_events"),
    ).toBe(true);
  });

  it("reentrega NAO grava o ledger de novo", async () => {
    await processAsaasEvent(eventoDePagamento());
    const antes = estado.escritas.filter(
      (e) => e.tabela === "finance_transactions",
    ).length;

    await processAsaasEvent(eventoDePagamento());

    expect(
      estado.escritas.filter((e) => e.tabela === "finance_transactions"),
    ).toHaveLength(antes);
  });
});

describe("ledger: estorno do Asaas", () => {
  beforeEach(() => {
    limpar();
    estado.linhaSubscription = {
      id: "row-1",
      user_id: USER,
      status: "active",
      plan_id: "plan-anual",
      affiliate_code: null,
      coupon_code: null,
    };
  });

  const linhaDoLedger = () =>
    estado.escritas.find(
      (e) => e.tabela === "finance_transactions" && e.operacao === "upsert",
    )?.carga as Record<string, unknown> | undefined;

  it("PAYMENT_REFUNDED grava linha refund com valores NEGATIVOS", async () => {
    const r = await processAsaasEvent(
      eventoDePagamento({ event: "PAYMENT_REFUNDED" }),
    );

    expect(r).toMatchObject({ received: true, activated: false });
    const linha = linhaDoLedger()!;
    expect(linha.type).toBe("refund");
    expect(linha.gross_cents).toBe(-22200);
    expect(linha.net_cents).toBe(-22200);
    // O Asaas nao devolve a taxa: repeti-la negativa afirmaria uma devolucao
    // que nao aconteceu.
    expect(linha.fee_cents).toBe(0);
  });

  it("a identidade do estorno e o id do EVENT, nao o da cobranca", async () => {
    // Reusar o id da cobranca faria o upsert colidir com a propria linha de
    // charge e, com ignoreDuplicates, o estorno sumiria em silencio.
    await processAsaasEvent(eventoDePagamento({ event: "PAYMENT_REFUNDED" }));

    expect(linhaDoLedger()!.provider_transaction_id).toBe(EVENTO);
    expect(linhaDoLedger()!.provider_transaction_id).not.toBe(COBRANCA);
  });

  it("NAO revoga acesso nem toca em subscriptions: espelha o charge.refunded da Stripe", async () => {
    await processAsaasEvent(eventoDePagamento({ event: "PAYMENT_REFUNDED" }));

    // server/providers/stripe.ts, case "charge.refunded": so chama
    // syncBalanceTransactions. A revogacao e decisao administrativa.
    expect(
      estado.escritas.filter((e) => e.tabela === "subscriptions"),
    ).toEqual([]);
    expect(estado.rpcCalls).toEqual([]);
  });

  it("estorno sem row de assinatura entra SEM dono, e nao se perde", async () => {
    estado.linhaSubscription = null;

    await processAsaasEvent(eventoDePagamento({ event: "PAYMENT_REFUNDED" }));

    const linha = linhaDoLedger()!;
    expect(linha.user_id).toBeNull();
    expect(linha.gross_cents).toBe(-22200);
  });

  it("estorno PARCIAL nao e tratado, mas vira alarme e fica gravado", async () => {
    const r = await processAsaasEvent(
      eventoDePagamento({ event: "PAYMENT_PARTIALLY_REFUNDED" }),
    );

    expect(r).toMatchObject({ received: true, unhandled: true });
    expect(linhaDoLedger()).toBeUndefined();
    expect(estado.capturas.map((c) => c.mensagem)).toContain(
      "asaas_partial_refund_nao_tratado",
    );
    expect(
      estado.escritas.some((e) => e.tabela === "billing_events"),
    ).toBe(true);
  });
});

describe("billing_events: o carimbo do provedor entra como INSTANTE", () => {
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

  const registro = () =>
    estado.escritas.find((e) => e.tabela === "billing_events")?.carga as
      | Record<string, unknown>
      | undefined;

  it("event_created_at vira ISO em UTC, nunca o texto cru do Asaas", async () => {
    await processAsaasEvent(eventoDePagamento());

    // O DEFEITO REAL: ate 2026-09-02 a string "2026-08-29 12:00:00" ia crua
    // para uma coluna timestamptz e o Postgres a lia como UTC. Tres horas de
    // erro numa linha de aparencia normal.
    expect(registro()!.event_created_at).toBe(DATE_CREATED_REAL_ISO);
    expect(registro()!.event_created_at).not.toBe(DATE_CREATED_REAL);
  });

  it("dateCreated ilegivel vira null, e nao um instante chutado", async () => {
    await processAsaasEvent(eventoDePagamento({ dateCreated: "ontem" }));

    expect(registro()!.event_created_at).toBeNull();
  });

  it("dateCreated ausente vira null", async () => {
    await processAsaasEvent(eventoDePagamento({ dateCreated: undefined }));

    expect(registro()!.event_created_at).toBeNull();
  });
});
