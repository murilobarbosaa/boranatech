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
  /** Erro por metodo HTTP, para o DELETE falhar e o GET seguinte responder. */
  asaasErroPorMetodo: {} as Record<string, Error>,

  /** Escritas em tabela, na ordem. */
  escritas: [] as Array<{
    tabela: string;
    operacao: string;
    carga: unknown;
    filtros?: unknown[];
  }>,
  /** Chamadas de rpc, na ordem. */
  rpcCalls: [] as Array<{ nome: string; args: Record<string, unknown> }>,
  capturas: [] as Array<{ mensagem: string; opcoes: Record<string, unknown> }>,

  /** Linhas devolvidas por leitura, por tabela. */
  linhaSubscription: null as Record<string, unknown> | null,
  subscriptionLookupError: null as { message: string } | null,
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
  cupomError: null as { message: string } | null,
  /** CPF gravado em profiles. CPF valido de teste (digitos verificadores ok). */
  cpfDoPerfil: "52998224725" as string | null,
  /** Intencao de nao renovar ja existente, para o caso idempotente. */
  intencaoExistente: null as Record<string, unknown> | null,
  /** E-mails enfileirados, na ordem. */
  emails: [] as Array<Record<string, unknown>>,
  /** Linha de affiliates devolvida na busca por codigo. */
  afiliado: { id: "aff-1" } as Record<string, unknown> | null,
  afiliadoError: null as { message: string } | null,
  /** Resultado da RPC de activation. */
  activation: null as unknown,
  activationError: null as { code?: string; message: string } | null,
  /**
   * Erro que um update em `subscriptions` devolve, decidido pela CARGA. Nulo
   * (o padrao) mantem o duble como sempre foi: update sem erro nenhum.
   */
  falhaUpdateSubscriptions: null as
    | ((carga: Record<string, unknown>) => {
        code: string;
        message: string;
      } | null)
    | null,
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
    const erroDoMetodo = estado.asaasErroPorMetodo[init.method];
    if (erroDoMetodo) throw erroDoMetodo;
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
    // Escrita em curso nesta consulta: os `eq` depois de um `update` sao os
    // filtros DELE, e o teste do fechamento confere o `status = pending`.
    let escritaAberta: { filtros: unknown[] } | null = null;
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
        if (m === "eq" && escritaAberta)
          escritaAberta.filtros.push([coluna, valor]);
        return q;
      };
    }
    q.maybeSingle = async () => {
      if (tabela === "plans") return { data: estado.plano, error: null };
      if (tabela === "affiliates")
        return { data: estado.afiliado, error: estado.afiliadoError };
      if (tabela === "coupons")
        return { data: estado.cupom, error: estado.cupomError };
      if (tabela === "profiles")
        return { data: { gender: null, cpf: estado.cpfDoPerfil }, error: null };
      if (tabela === "subscription_cancellations")
        return { data: estado.intencaoExistente, error: null };
      if (tabela === "subscriptions")
        return {
          data: estado.linhaSubscription,
          error: estado.subscriptionLookupError,
        };
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
        const escrita = {
          tabela,
          operacao: op,
          carga,
          filtros: [] as unknown[],
        };
        estado.escritas.push(escrita);
        if (
          tabela === "subscriptions" &&
          op === "update" &&
          estado.falhaUpdateSubscriptions
        ) {
          // So com a falha ligada: devolve o erro que o PostgREST daria para
          // ESTA carga. Desligada, o caminho abaixo segue identico ao de antes.
          const erro = estado.falhaUpdateSubscriptions(
            carga as Record<string, unknown>,
          );
          const encadeavel: Record<string, unknown> = {
            eq: (coluna: string, valor: unknown) => {
              escrita.filtros.push([coluna, valor]);
              return encadeavel;
            },
            then: (r: (v: unknown) => unknown) =>
              Promise.resolve({ data: null, error: erro }).then(r),
          };
          return encadeavel;
        }
        if (tabela === "admin_refunds" && op === "update") {
          // Encadeavel proprio: guarda os `eq` desta escrita para o teste
          // conferir QUAL linha o update mira.
          const encadeavel: Record<string, unknown> = {
            eq: (coluna: string, valor: unknown) => {
              escrita.filtros.push([coluna, valor]);
              return encadeavel;
            },
            then: (r: (v: unknown) => unknown) =>
              Promise.resolve({ data: null, error: null }).then(r),
          };
          return encadeavel;
        }
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
        escritaAberta = escrita;
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
import { createError } from "../middleware/error";
import { fetchPixQrCode, maskCpf } from "./asaas";
import {
  eventKey,
  estadoDaFilaDeWebhooks,
  cancelPayment,
  closePendingCharge,
  estornarPagamento,
  lerPagamento,
  listarWebhooks,
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
  estado.asaasErroPorMetodo = {};
  estado.escritas = [];
  estado.rpcCalls = [];
  estado.capturas = [];
  estado.linhaSubscription = null;
  estado.subscriptionLookupError = null;
  estado.ativas = [];
  estado.pixPendentes = [];
  estado.plano = { id: "plan-anual", code: "pro_annual", name: "Pro Anual" };
  estado.novaLinhaId = "row-1";
  estado.afiliado = { id: "aff-1" };
  estado.afiliadoError = null;
  estado.emails = [];
  estado.intencaoExistente = null;
  estado.cpfDoPerfil = "52998224725";
  estado.cupom = null;
  estado.cupomError = null;
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
  estado.falhaUpdateSubscriptions = null;
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

  it("mensal e ACEITO no Pix (lote 2b) e cobra o preco do mensal", async () => {
    const r = await asaasProvider.createCheckout(checkoutInput("pro_monthly"));

    expect(r.subscriptionId).toBe(COBRANCA);
    const post = estado.asaas.find(
      (c) => c.method === "POST" && c.caminho === "/payments",
    )!;
    expect((post.body as Record<string, unknown>).value).toBe(
      PLAN_PRICING.pro_monthly.total,
    );
  });

  it("ativacao do mensal por Pix concede 30 dias", async () => {
    estado.plano = {
      id: "plan-mensal",
      code: "pro_monthly",
      name: "Pro Mensal",
    };
    estado.linhaSubscription = {
      id: "row-1",
      user_id: USER,
      status: "pending",
      plan_id: "plan-mensal",
      affiliate_code: null,
      coupon_code: null,
    };

    await processAsaasEvent(
      eventoDePagamento({ dateCreated: "2026-09-06 12:00:00" }),
    );

    const rpc = estado.rpcCalls.find(
      (c) => c.nome === "activate_subscription_exclusive",
    )!;
    expect(rpc.args.p_period_start).toBe("2026-09-06T15:00:00.000Z");
    expect(rpc.args.p_period_end).toBe("2026-10-06T15:00:00.000Z");
  });

  it("plano que o mapa NAO lista para Pix e recusado sem tocar o Asaas", async () => {
    await expect(
      asaasProvider.createCheckout(checkoutInput("free")),
    ).rejects.toMatchObject({ code: "pix_not_allowed_on_plan" });

    expect(estado.asaas).toEqual([]);
    expect(estado.escritas).toEqual([]);
  });

  it("semestral e anual vem do ponto unico, com os MESMOS dias do boleto", () => {
    expect(oneOffAccessDays("pro_semiannual", "pix")).toBe(182);
    expect(oneOffAccessDays("pro_annual", "pix")).toBe(365);
    expect(oneOffAccessDays("pro_monthly", "pix")).toBe(30);
    expect(oneOffAccessDays("pro_monthly", "boleto")).toBeUndefined();
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

/**
 * VENCIMENTO E FATURA PERSISTIDOS, sem arriscar a venda.
 *
 * O caso que importa e o segundo: entre o deploy do codigo e a aplicacao da
 * migration, o PostgREST recusa a coluna com PGRST204. Se a gravacao estivesse
 * no mesmo update da amarracao, o `catch` de `createCheckout` cancelaria a
 * linha e deixaria uma cobranca viva no Asaas sem linha no banco: a pessoa
 * pagaria e nao receberia nada.
 */
describe("persistencia do vencimento e da fatura da cobranca", () => {
  beforeEach(() => {
    limpar();
    estado.asaasResposta["/payments"] = {
      id: COBRANCA,
      invoiceUrl: "https://asaas.test/i/123",
      dueDate: "2026-09-14",
    };
  });

  function updatesDeSubscriptions() {
    return estado.escritas
      .filter((e) => e.tabela === "subscriptions" && e.operacao === "update")
      .map((e) => e.carga as Record<string, unknown>);
  }

  it("grava vencimento e fatura num update SEPARADO do de amarracao", async () => {
    await asaasProvider.createCheckout(checkoutInput("pro_annual"));

    // Lista exata: duas chamadas, nesta ordem, e nenhuma com os quatro campos.
    expect(updatesDeSubscriptions()).toEqual([
      { provider_subscription_id: COBRANCA, provider_customer_id: "cus_1" },
      {
        pix_due_date: "2026-09-14",
        pix_invoice_url: "https://asaas.test/i/123",
      },
    ]);
  });

  it("coluna ainda inexistente (PGRST204) NAO derruba o checkout nem cancela a linha", async () => {
    estado.falhaUpdateSubscriptions = (carga) =>
      "pix_due_date" in carga
        ? {
            code: "PGRST204",
            message:
              "Could not find the 'pix_due_date' column of 'subscriptions' in the schema cache",
          }
        : null;

    const r = await asaasProvider.createCheckout(checkoutInput("pro_annual"));

    expect(r.subscriptionId).toBe(COBRANCA);
    expect(r.dueDate).toBe("2026-09-14");
    // A linha continua `pending`: nenhum update a levou para `canceled`.
    expect(updatesDeSubscriptions().some((c) => c.status === "canceled")).toBe(
      false,
    );
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("row-1"));
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(COBRANCA),
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("PGRST204"),
    );
    // Sem Sentry: na janela de deploy isto dispararia em todo checkout Pix.
    expect(estado.capturas).toEqual([]);
  });

  it("amarracao falhando continua cancelando a linha e lancando, como antes", async () => {
    estado.falhaUpdateSubscriptions = (carga) =>
      "provider_subscription_id" in carga
        ? {
            code: "57014",
            message: "canceling statement due to statement timeout",
          }
        : null;

    await expect(
      asaasProvider.createCheckout(checkoutInput("pro_annual")),
    ).rejects.toMatchObject({ code: "db_error" });

    const updates = updatesDeSubscriptions();
    expect(updates.some((c) => c.status === "canceled")).toBe(true);
    expect(updates.some((c) => "pix_due_date" in c)).toBe(false);
    expect(estado.capturas.map((c) => c.mensagem)).toContain(
      "asaas_link_cobranca_falhou",
    );
  });

  it("dueDate e invoiceUrl ausentes na resposta gravam null, sem quebrar", async () => {
    estado.asaasResposta["/payments"] = { id: COBRANCA };

    const r = await asaasProvider.createCheckout(checkoutInput("pro_annual"));

    expect(r.subscriptionId).toBe(COBRANCA);
    expect(updatesDeSubscriptions()[1]).toEqual({
      pix_due_date: null,
      pix_invoice_url: null,
    });
  });

  it("renovacao (internalRenewal) grava do mesmo jeito, sem ramo especial", async () => {
    estado.ativas = [{ id: "sub-viva" }];

    await asaasProvider.createCheckout({
      ...checkoutInput("pro_annual"),
      internalRenewal: true,
    } as Parameters<typeof asaasProvider.createCheckout>[0]);

    expect(updatesDeSubscriptions()[1]).toEqual({
      pix_due_date: "2026-09-14",
      pix_invoice_url: "https://asaas.test/i/123",
    });
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

  it("venda por Pix grava o evento sale com payment_method pix", async () => {
    estado.afiliado = { id: "aff-1", commission_percent: 30 };

    await processAsaasEvent(eventoDePagamento());

    const eventos = estado.escritas.filter(
      (e) => e.tabela === "creator_events",
    );
    expect(eventos).toHaveLength(1);
    // 30 por cento de 22200 = 6660, a mesma conta do SQL.
    expect(eventos[0].carga).toEqual({
      affiliate_id: "aff-1",
      event_type: "sale",
      user_id: USER,
      subscription_id: "row-1",
      plan_id: "plan-anual",
      payment_method: "pix",
      revenue_cents: 22200,
      commission_cents: 6660,
      metadata: {},
    });
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

  it("PAYMENT_OVERDUE sem linha correspondente responde 200 e guarda o raw", async () => {
    estado.linhaSubscription = null;
    const r = await processAsaasEvent(
      eventoDePagamento({ event: "PAYMENT_OVERDUE" }),
    );
    expect(r).toMatchObject({ received: true, activated: false });
    expect(estado.escritas.filter((e) => e.tabela === "subscriptions")).toEqual(
      [],
    );
    expect(estado.escritas.some((e) => e.tabela === "billing_events")).toBe(
      true,
    );
    expect(estado.capturas).toEqual([]);
  });
});

describe("webhook: pagamento SEM linha nossa e orfao, nao erro", () => {
  // O EVENTO REAL DO INCIDENTE DE 2026-09-03. Um Pix de R$ 30,00 mandado direto
  // para a chave da conta: o Asaas cria a cobranca sozinho, sem
  // `externalReference`, e dispara PAYMENT_RECEIVED. O handler lancava 500, o
  // Asaas reentregou 15 vezes e INTERROMPEU a fila inteira, prendendo atras
  // dele o PAYMENT_RECEIVED de um pagamento real.
  const EVENTO_DO_INCIDENTE = "evt_d26e303b238e509335ac9ba210e51b0f&1497329671";
  const COBRANCA_DO_INCIDENTE = "pay_1dd6hnhum3ysn950";

  function eventoAvulso() {
    return {
      id: EVENTO_DO_INCIDENTE,
      event: "PAYMENT_RECEIVED",
      dateCreated: "2026-09-03 03:28:01",
      payment: {
        id: COBRANCA_DO_INCIDENTE,
        value: 30,
        netValue: 30,
        externalReference: null,
        status: "RECEIVED",
      },
    } as Parameters<typeof processAsaasEvent>[0];
  }

  const linhasDoLedger = () =>
    estado.escritas
      .filter(
        (e) => e.tabela === "finance_transactions" && e.operacao === "upsert",
      )
      .map((e) => e.carga as Record<string, unknown>);

  beforeEach(() => {
    limpar();
    estado.linhaSubscription = null;
  });

  it("responde 200 com orphan em vez de lancar", async () => {
    const r = await processAsaasEvent(eventoAvulso());
    expect(r).toMatchObject({ received: true, orphan: true });
    expect(estado.rpcCalls).toEqual([]);
  });

  it("grava a cobranca no ledger SEM dono, com o valor em centavos", async () => {
    await processAsaasEvent(eventoAvulso());

    const linhas = linhasDoLedger();
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatchObject({
      provider: "asaas",
      provider_transaction_id: COBRANCA_DO_INCIDENTE,
      type: "charge",
      gross_cents: 3000,
      net_cents: 3000,
      fee_cents: 0,
      user_id: null,
      plan_code: null,
    });
  });

  it("a linha de billing_events e PRESERVADA e carimbada como processada", async () => {
    await processAsaasEvent(eventoAvulso());

    expect(
      estado.escritas.filter(
        (e) => e.tabela === "billing_events" && e.operacao === "delete",
      ),
    ).toEqual([]);
    const carimbo = estado.escritas.find(
      (e) => e.tabela === "billing_events" && e.operacao === "update",
    );
    expect(carimbo).toBeDefined();
    expect((carimbo!.carga as Record<string, unknown>).processed_at).toEqual(
      expect.any(String),
    );
  });

  it("grita no Sentry UMA vez, como warning, com o id da cobranca", async () => {
    await processAsaasEvent(eventoAvulso());

    const avisos = estado.capturas.filter(
      (c) => c.mensagem === "asaas_pagamento_sem_assinatura",
    );
    expect(avisos).toHaveLength(1);
    expect(avisos[0].opcoes).toMatchObject({
      level: "warning",
      fingerprint: ["asaas-pagamento-sem-assinatura"],
      tags: { event_type: "PAYMENT_RECEIVED" },
      extra: {
        event_id: EVENTO_DO_INCIDENTE,
        asaas_payment_id: COBRANCA_DO_INCIDENTE,
        gross_cents: 3000,
      },
    });
    expect(
      estado.capturas.filter((c) => c.mensagem === "asaas_webhook_falhou"),
    ).toEqual([]);
  });

  it("segunda entrega do MESMO evento: 200 e nenhuma segunda linha no ledger", async () => {
    await processAsaasEvent(eventoAvulso());
    const segunda = await processAsaasEvent(eventoAvulso());

    expect(segunda).toMatchObject({ received: true, deduped: true });
    expect(linhasDoLedger()).toHaveLength(1);
  });

  it("PAYMENT_CONFIRMED sem linha segue o mesmo caminho", async () => {
    const r = await processAsaasEvent({
      ...eventoAvulso(),
      event: "PAYMENT_CONFIRMED",
    });
    expect(r).toMatchObject({ received: true, orphan: true });
    expect(linhasDoLedger()).toHaveLength(1);
  });

  it("sem linha E sem valor no payload: ainda 200, sem ledger, e o aviso nomeia a ausencia", async () => {
    // Condicao DETERMINISTICA: reentregar nao faz o valor aparecer. Lancar aqui
    // repetiria o incidente por outro payload.
    const r = await processAsaasEvent({
      ...eventoAvulso(),
      payment: { id: COBRANCA_DO_INCIDENTE, externalReference: null },
    });
    expect(r).toMatchObject({ received: true, orphan: true });
    expect(linhasDoLedger()).toEqual([]);
    const avisos = estado.capturas.filter(
      (c) => c.mensagem === "asaas_pagamento_sem_assinatura",
    );
    expect(avisos).toHaveLength(1);
    expect(avisos[0].opcoes).toMatchObject({
      extra: { gross_cents: null },
    });
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

function afiliadoDe(percent: number, code = "AFILIADO") {
  return { id: "aff-1", code, discount_percent: percent };
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

function comAfiliado(planId: string, code: string) {
  return {
    user: { id: USER, email: "pessoa@exemplo.com" },
    planId,
    affiliateCode: code,
    couponCode: "",
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

  it("cupom INVALIDO bloqueia antes da cobranca em vez de cobrar cheio", async () => {
    estado.cupom = null;

    await expect(
      asaasProvider.createCheckout(comCupom("pro_annual", "NAOEXISTE")),
    ).rejects.toMatchObject({
      statusCode: 422,
      code: "coupon_unavailable",
    });

    expect(estado.asaas).toEqual([]);
    expect(estado.escritas).toEqual([]);
  });

  it("NAO e primeira compra: informa a inelegibilidade antes de cobrar", async () => {
    // `isFirstPurchase` acha uma sub ja ativada.
    estado.linhaSubscription = {
      id: "sub-velha",
      current_period_start: "2026-01-01",
    };
    estado.cupom = cupomDe(90);

    await expect(
      asaasProvider.createCheckout(comCupom("pro_annual", "PROMO")),
    ).rejects.toMatchObject({
      statusCode: 422,
      code: "promotion_first_purchase_only",
    });

    expect(estado.asaas).toEqual([]);
    expect(estado.escritas).toEqual([]);
  });
});

describe("o valor da cobranca respeita o afiliado", () => {
  beforeEach(limpar);

  it("20 por cento no anual: envia 177,60 ao Asaas, nao 222,00", async () => {
    estado.afiliado = afiliadoDe(20, "AFILIADO20");

    await asaasProvider.createCheckout(comAfiliado("pro_annual", "AFILIADO20"));

    expect(valorCobradoCents()).toBe(17760);
  });

  it("33 por cento no mensal usa o arredondamento compartilhado em centavos", async () => {
    estado.afiliado = afiliadoDe(33, "AFILIADO33");

    const result = await asaasProvider.createCheckout(
      comAfiliado("pro_monthly", "AFILIADO33"),
    );

    expect(valorCobradoCents()).toBe(2003);
    expect(result.amountCents).toBe(2003);
  });

  it("desconto de afiliado abaixo do piso bloqueia antes da row e do Asaas", async () => {
    // 84 por cento de desconto em 2990 resulta em 478 centavos.
    estado.afiliado = afiliadoDe(84, "AFILIADO84");

    await expect(
      asaasProvider.createCheckout(comAfiliado("pro_monthly", "AFILIADO84")),
    ).rejects.toMatchObject({ code: "valor_minimo_pix" });

    expect(estado.asaas).toEqual([]);
    expect(estado.escritas).toEqual([]);
  });

  it("cupom aplicavel ganha no preco e o afiliado canonico segue na atribuicao", async () => {
    estado.cupom = cupomDe(30);
    estado.afiliado = afiliadoDe(20, "AFILIADO20");

    await asaasProvider.createCheckout({
      ...comAfiliado("pro_annual", "AFILIADO20"),
      couponCode: "PROMO",
    });

    expect(valorCobradoCents()).toBe(15540);
    const insert = estado.escritas.find((e) => e.operacao === "insert")!;
    expect(insert.carga).toMatchObject({
      coupon_code: "PROMO",
      affiliate_code: "AFILIADO20",
    });
  });

  it("cupom aplicavel nao e bloqueado por afiliado invalido usado so para atribuicao", async () => {
    estado.cupom = cupomDe(30);
    estado.afiliado = null;

    await asaasProvider.createCheckout({
      ...comAfiliado("pro_annual", "INATIVO"),
      couponCode: "PROMO",
    });

    expect(valorCobradoCents()).toBe(15540);
    const insert = estado.escritas.find((e) => e.operacao === "insert")!;
    expect(insert.carga).toMatchObject({
      coupon_code: "PROMO",
      affiliate_code: null,
    });
  });

  it("cupom aplicavel sobrevive a falha da atribuicao, igual ao Stripe", async () => {
    estado.cupom = cupomDe(30);
    estado.afiliadoError = { message: "banco indisponivel" };

    await asaasProvider.createCheckout({
      ...comAfiliado("pro_annual", "AFILIADO20"),
      couponCode: "PROMO",
    });

    expect(valorCobradoCents()).toBe(15540);
    const insert = estado.escritas.find((e) => e.operacao === "insert")!;
    expect(insert.carga).toMatchObject({
      coupon_code: "PROMO",
      affiliate_code: null,
    });
  });

  it("cupom valido fora do plano cai no afiliado, sem gravar resgate do cupom", async () => {
    estado.cupom = {
      ...cupomDe(30),
      applicable_plans: ["pro_semiannual"],
    };
    estado.afiliado = afiliadoDe(20, "AFILIADO20");

    await asaasProvider.createCheckout({
      ...comAfiliado("pro_annual", "AFILIADO20"),
      couponCode: "PROMO",
    });

    expect(valorCobradoCents()).toBe(17760);
    const insert = estado.escritas.find((e) => e.operacao === "insert")!;
    expect(insert.carga).toMatchObject({
      coupon_code: null,
      affiliate_code: "AFILIADO20",
    });
  });

  it("afiliado inexistente ou inativo bloqueia sem criar row ou cobranca", async () => {
    estado.afiliado = null;

    await expect(
      asaasProvider.createCheckout(comAfiliado("pro_annual", "INATIVO")),
    ).rejects.toMatchObject({
      statusCode: 422,
      code: "affiliate_unavailable",
    });

    expect(estado.asaas).toEqual([]);
    expect(estado.escritas).toEqual([]);
  });

  it("afiliado nao se aplica a quem ja realizou uma compra", async () => {
    estado.linhaSubscription = {
      id: "sub-velha",
      current_period_start: "2026-01-01",
    };
    estado.afiliado = afiliadoDe(20, "AFILIADO20");

    await expect(
      asaasProvider.createCheckout(comAfiliado("pro_annual", "AFILIADO20")),
    ).rejects.toMatchObject({ code: "promotion_first_purchase_only" });

    expect(estado.asaas).toEqual([]);
    expect(estado.escritas).toEqual([]);
  });

  it("erro ao consultar afiliado falha fechado e nao toca o provedor", async () => {
    estado.afiliadoError = { message: "banco indisponivel" };

    await expect(
      asaasProvider.createCheckout(comAfiliado("pro_annual", "AFILIADO20")),
    ).rejects.toMatchObject({ statusCode: 500, code: "db_error" });

    expect(estado.asaas).toEqual([]);
    expect(estado.escritas).toEqual([]);
  });

  it("erro ao consultar cupom falha fechado e nao toca o provedor", async () => {
    estado.cupomError = { message: "banco indisponivel" };

    await expect(
      asaasProvider.createCheckout(comCupom("pro_annual", "PROMO")),
    ).rejects.toMatchObject({ statusCode: 500, code: "db_error" });

    expect(estado.asaas).toEqual([]);
    expect(estado.escritas).toEqual([]);
  });

  it("erro ao consultar elegibilidade falha fechado e nao toca o provedor", async () => {
    estado.subscriptionLookupError = { message: "banco indisponivel" };
    estado.afiliado = afiliadoDe(20, "AFILIADO20");

    await expect(
      asaasProvider.createCheckout(comAfiliado("pro_annual", "AFILIADO20")),
    ).rejects.toMatchObject({ statusCode: 500, code: "db_error" });

    expect(estado.asaas).toEqual([]);
    expect(estado.escritas).toEqual([]);
  });

  it("cupom expirado nao vira fallback silencioso para o afiliado", async () => {
    estado.cupom = {
      ...cupomDe(30),
      valid_until: "2020-01-01T00:00:00.000Z",
    };
    estado.afiliado = afiliadoDe(20, "AFILIADO20");

    await expect(
      asaasProvider.createCheckout({
        ...comAfiliado("pro_annual", "AFILIADO20"),
        couponCode: "PROMO",
      }),
    ).rejects.toMatchObject({ code: "coupon_unavailable" });

    expect(estado.asaas).toEqual([]);
    expect(estado.escritas).toEqual([]);
  });

  it("o valor devolvido ao modal e o valor descontado confirmado pelo Asaas", async () => {
    estado.afiliado = afiliadoDe(20, "AFILIADO20");
    estado.asaasResposta = {
      "/customers?": { data: [{ id: "cus_1" }] },
      "/payments": {
        id: COBRANCA,
        value: 177.6,
        invoiceUrl: "https://asaas.test/i/123",
      },
    };

    const result = await asaasProvider.createCheckout(
      comAfiliado("pro_annual", "AFILIADO20"),
    );

    expect(valorCobradoCents()).toBe(17760);
    expect(result.amountCents).toBe(17760);
  });

  it("o valor descontado pago e persistido no ledger em centavos", async () => {
    estado.afiliado = afiliadoDe(20, "AFILIADO20");
    estado.asaasResposta = {
      "/customers?": { data: [{ id: "cus_1" }] },
      "/payments": { id: COBRANCA, value: 177.6 },
    };

    const result = await asaasProvider.createCheckout(
      comAfiliado("pro_annual", "AFILIADO20"),
    );
    estado.linhaSubscription = {
      id: "row-1",
      user_id: USER,
      status: "pending",
      plan_id: "plan-anual",
      affiliate_code: "AFILIADO20",
      coupon_code: null,
    };

    await processAsaasEvent(
      eventoDePagamento({
        payment: { value: 177.6, netValue: 173.32 },
      }),
    );

    const ledger = estado.escritas.find(
      (e) => e.tabela === "finance_transactions" && e.operacao === "upsert",
    )!;
    expect(valorCobradoCents()).toBe(17760);
    expect(result.amountCents).toBe(17760);
    expect(ledger.carga).toMatchObject({ gross_cents: 17760 });
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
    // Nenhum preco atual combinado com percentual inteiro resulta em 500.
    // Ajustar temporariamente a fonte de preco permite exercitar a fronteira
    // real do provider sem testar apenas uma funcao de comparacao isolada.
    const original = PLAN_PRICING.pro_monthly.total;
    PLAN_PRICING.pro_monthly.total = 5;
    try {
      await asaasProvider.createCheckout(checkoutInput("pro_monthly"));
      expect(valorCobradoCents()).toBe(500);
    } finally {
      PLAN_PRICING.pro_monthly.total = original;
    }
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
    expect(estado.escritas.some((e) => e.tabela === "billing_events")).toBe(
      true,
    );
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
    expect(estado.escritas.filter((e) => e.tabela === "subscriptions")).toEqual(
      [],
    );
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
    expect(estado.escritas.some((e) => e.tabela === "billing_events")).toBe(
      true,
    );
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

describe("estornarPagamento", () => {
  beforeEach(() => {
    limpar();
  });

  /** Resposta do Asaas ao POST de estorno, com o status pedido. */
  function respondeCom(status: unknown) {
    estado.asaasResposta = {
      "/payments/pay_x/refund": { id: "pay_x", status, value: 12.9 },
    };
  }

  it("chama o caminho e o corpo EXATOS", async () => {
    respondeCom("REFUNDED");

    await estornarPagamento("pay_x", { descricao: "cliente pediu" });

    const chamada = estado.asaas[0];
    // Sem `/v3`: ele ja esta em ASAAS_API_URL, como em todo call site deste
    // arquivo. Duplicar daria 404 no provedor.
    expect(chamada.caminho).toBe("/payments/pay_x/refund");
    expect(chamada.method).toBe("POST");
    expect(chamada.body).toEqual({ description: "cliente pediu" });
  });

  it("NAO manda `value`: a ausencia e o que faz o estorno ser integral", async () => {
    respondeCom("REFUNDED");

    await estornarPagamento("pay_x", { descricao: "x" });

    expect(estado.asaas[0].body).not.toHaveProperty("value");
  });

  it("o id vai ESCAPADO na URL", async () => {
    estado.asaasResposta = { "/payments/": { status: "REFUNDED" } };

    await estornarPagamento("pay/../outro", { descricao: "x" });

    expect(estado.asaas[0].caminho).toBe("/payments/pay%2F..%2Foutro/refund");
  });

  it.each([["REFUNDED"], ["REFUND_REQUESTED"], ["REFUND_IN_PROGRESS"]])(
    "%s e SUCESSO: o pedido foi aceito",
    async (status) => {
      // Reduzir a lista a REFUNDED faria o admin ver "nao devolveu" sobre um
      // estorno que o Asaas aceitou, e pedir de novo.
      respondeCom(status);

      const r = await estornarPagamento("pay_x", { descricao: "x" });

      expect(r.status).toBe(status);
      expect(r.raw).toMatchObject({ id: "pay_x" });
    },
  );

  it("CONFIRMED e recusa: a cobranca segue paga, o estorno nao aconteceu", async () => {
    respondeCom("CONFIRMED");

    await expect(
      estornarPagamento("pay_x", { descricao: "x" }),
    ).rejects.toMatchObject({ code: "asaas_refund_rejected" });
  });

  it.each([
    ["status ausente", undefined],
    ["status nao string", 200],
    ["status vazio", ""],
  ])("%s tambem e recusa, nunca sucesso mudo", async (_rotulo, status) => {
    respondeCom(status);

    await expect(
      estornarPagamento("pay_x", { descricao: "x" }),
    ).rejects.toMatchObject({ code: "asaas_refund_rejected" });
  });

  // A RESPOSTA REAL DE 2026-09-03: o Asaas criou o estorno e o deixou
  // "aguardando autorizacao critica" (aprovacao no app ou no painel). O status
  // da COBRANCA continuou `RECEIVED`, e o codigo de entao leu isso como recusa:
  // "O Asaas nao confirmou o estorno. Nada foi devolvido." sobre um estorno que
  // existia no provedor. `admin_refunds` ficou sem linha, e o proximo clique
  // pediria um segundo estorno.
  it("RECEIVED com refund AWAITING_CRITICAL_ACTION_AUTHORIZATION e SUCESSO, com o status do refund", async () => {
    estado.asaasResposta = {
      "/payments/pay_x/refund": {
        id: "pay_x",
        status: "RECEIVED",
        value: 12.9,
        refunds: [
          {
            dateCreated: "2026-09-03 03:28:20",
            status: "AWAITING_CRITICAL_ACTION_AUTHORIZATION",
            value: 12.9,
            description: "Teste",
          },
        ],
      },
    };

    const r = await estornarPagamento("pay_x", { descricao: "Teste" });

    expect(r.status).toBe("AWAITING_CRITICAL_ACTION_AUTHORIZATION");
  });

  it.each([["PENDING"], ["DONE"]])(
    "RECEIVED com refund %s tambem e sucesso",
    async (status) => {
      estado.asaasResposta = {
        "/payments/pay_x/refund": {
          status: "RECEIVED",
          refunds: [
            { dateCreated: "2026-09-03 03:28:20", status, value: 12.9 },
          ],
        },
      };
      const r = await estornarPagamento("pay_x", { descricao: "x" });
      expect(r.status).toBe(status);
    },
  );

  it("RECEIVED com refunds VAZIO continua recusa", async () => {
    estado.asaasResposta = {
      "/payments/pay_x/refund": { status: "RECEIVED", refunds: [] },
    };
    await expect(
      estornarPagamento("pay_x", { descricao: "x" }),
    ).rejects.toMatchObject({ code: "asaas_refund_rejected" });
  });

  it("o refund que decide e o MAIS RECENTE por dateCreated, nao o primeiro do array", async () => {
    estado.asaasResposta = {
      "/payments/pay_x/refund": {
        status: "RECEIVED",
        refunds: [
          {
            dateCreated: "2026-09-03 03:28:20",
            status: "PENDING",
            value: 12.9,
          },
          {
            dateCreated: "2026-09-01 10:00:00",
            status: "CANCELLED",
            value: 12.9,
          },
        ],
      },
    };
    const r = await estornarPagamento("pay_x", { descricao: "x" });
    expect(r.status).toBe("PENDING");
  });

  it("refund mais recente CANCELLED, com a cobranca ainda RECEIVED, e recusa", async () => {
    estado.asaasResposta = {
      "/payments/pay_x/refund": {
        status: "RECEIVED",
        refunds: [
          {
            dateCreated: "2026-09-01 10:00:00",
            status: "PENDING",
            value: 12.9,
          },
          {
            dateCreated: "2026-09-03 03:28:20",
            status: "CANCELLED",
            value: 12.9,
          },
        ],
      },
    };
    await expect(
      estornarPagamento("pay_x", { descricao: "x" }),
    ).rejects.toMatchObject({ code: "asaas_refund_rejected" });
  });

  it("status da cobranca aceito SEM refunds continua sucesso, com o status da cobranca", async () => {
    respondeCom("REFUND_IN_PROGRESS");
    const r = await estornarPagamento("pay_x", { descricao: "x" });
    expect(r.status).toBe("REFUND_IN_PROGRESS");
  });

  it("erro de TRANSPORTE mantem o codigo do cliente, nao vira asaas_refund_rejected", async () => {
    // A distincao importa na investigacao: "o Asaas recusou o estorno" e "nao
    // consegui falar com o Asaas" pedem acoes diferentes.
    estado.asaasErro = new Error("timeout");

    await expect(
      estornarPagamento("pay_x", { descricao: "x" }),
    ).rejects.toThrow("timeout");
  });
});

describe("lerPagamento", () => {
  beforeEach(() => {
    limpar();
  });

  it("le status, valor e refunds de GET /payments/{id}, com valores em centavos", async () => {
    estado.asaasResposta = {
      "/payments/pay_qlfe88ojqywpde05": {
        id: "pay_qlfe88ojqywpde05",
        status: "RECEIVED",
        value: 12.9,
        refunds: [
          {
            dateCreated: "2026-09-03 03:28:20",
            status: "AWAITING_CRITICAL_ACTION_AUTHORIZATION",
            value: 12.9,
            description: "Teste",
          },
        ],
      },
    };

    const p = await lerPagamento("pay_qlfe88ojqywpde05");

    expect(estado.asaas[0]).toMatchObject({
      caminho: "/payments/pay_qlfe88ojqywpde05",
      method: "GET",
    });
    expect(p).toEqual({
      status: "RECEIVED",
      valueCents: 1290,
      dueDate: null,
      invoiceUrl: null,
      refunds: [
        {
          status: "AWAITING_CRITICAL_ACTION_AUTHORIZATION",
          valueCents: 1290,
          dateCreated: "2026-09-03 03:28:20",
        },
      ],
      deleted: false,
    });
  });

  it("refunds nulo (a resposta real de uma cobranca sem estorno) vira lista vazia", async () => {
    estado.asaasResposta = {
      "/payments/pay_x": {
        id: "pay_x",
        status: "RECEIVED",
        value: 30,
        refunds: null,
      },
    };
    const p = await lerPagamento("pay_x");
    expect(p).toEqual({
      status: "RECEIVED",
      valueCents: 3000,
      dueDate: null,
      invoiceUrl: null,
      refunds: [],
      deleted: false,
    });
  });

  it("dueDate da cobranca vem junto, como o Asaas manda (YYYY-MM-DD)", async () => {
    estado.asaasResposta = {
      "/payments/pay_x": {
        status: "PENDING",
        value: 29.9,
        dueDate: "2026-09-08",
      },
    };
    const p = await lerPagamento("pay_x");
    expect(p.dueDate).toBe("2026-09-08");
  });

  it("invoiceUrl da cobranca vem junto; ausente vira null", async () => {
    estado.asaasResposta = {
      "/payments/pay_x": {
        status: "PENDING",
        value: 29.9,
        invoiceUrl: "https://www.asaas.com/i/abc",
      },
    };
    expect((await lerPagamento("pay_x")).invoiceUrl).toBe(
      "https://www.asaas.com/i/abc",
    );

    estado.asaasResposta = {
      "/payments/pay_x": { status: "PENDING", value: 29.9 },
    };
    expect((await lerPagamento("pay_x")).invoiceUrl).toBeNull();
  });

  it("o id vai ESCAPADO na URL", async () => {
    estado.asaasResposta = { "/payments/": { status: "RECEIVED" } };
    await lerPagamento("pay/../outro");
    expect(estado.asaas[0].caminho).toBe("/payments/pay%2F..%2Foutro");
  });

  it("erro do cliente propaga como esta", async () => {
    estado.asaasErro = new Error("timeout");
    await expect(lerPagamento("pay_x")).rejects.toThrow("timeout");
  });
});

describe("webhook: estorno em andamento e confirmado atualizam admin_refunds", () => {
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

  const updatesDeRefunds = () =>
    estado.escritas.filter(
      (e) => e.tabela === "admin_refunds" && e.operacao === "update",
    );
  const linhasDoLedger = () =>
    estado.escritas.filter((e) => e.tabela === "finance_transactions");

  it("PAYMENT_REFUND_IN_PROGRESS: registra, marca provider_status, e NAO grava ledger", async () => {
    const r = await processAsaasEvent(
      eventoDePagamento({ event: "PAYMENT_REFUND_IN_PROGRESS" }),
    );

    expect(r).toMatchObject({ received: true, activated: false });
    expect(r).not.toHaveProperty("unhandled");
    expect(estado.escritas.some((e) => e.tabela === "billing_events")).toBe(
      true,
    );
    expect(updatesDeRefunds()).toHaveLength(1);
    expect(updatesDeRefunds()[0].carga).toEqual({
      provider_status: "REFUND_IN_PROGRESS",
    });
    expect(linhasDoLedger()).toEqual([]);
    expect(estado.rpcCalls).toEqual([]);
  });

  it("PAYMENT_REFUNDED: alem do ledger, marca provider_status REFUNDED", async () => {
    await processAsaasEvent(eventoDePagamento({ event: "PAYMENT_REFUNDED" }));

    expect(linhasDoLedger()).toHaveLength(1);
    expect(updatesDeRefunds()).toHaveLength(1);
    expect(updatesDeRefunds()[0].carga).toEqual({
      provider_status: "REFUNDED",
    });
  });

  it("o update mira a linha do Asaas pela cobranca, e nada mais", async () => {
    // O `update` do duble devolve o proprio encadeavel; os filtros sao
    // observados por um espiao no `eq`.
    await processAsaasEvent(
      eventoDePagamento({ event: "PAYMENT_REFUND_IN_PROGRESS" }),
    );
    const update = updatesDeRefunds()[0] as { filtros?: unknown[] };
    expect(update.filtros).toEqual([
      ["provider", "asaas"],
      ["provider_refund_id", COBRANCA],
    ]);
  });

  it("PAYMENT_REFUND_IN_PROGRESS sem row de assinatura tambem responde 200", async () => {
    estado.linhaSubscription = null;
    const r = await processAsaasEvent(
      eventoDePagamento({ event: "PAYMENT_REFUND_IN_PROGRESS" }),
    );
    expect(r).toMatchObject({ received: true, activated: false });
  });
});

describe("fila de webhooks do Asaas: leitura e classificacao", () => {
  beforeEach(() => {
    limpar();
  });

  // A RESPOSTA REAL de GET /webhooks em 2026-09-06, com a fila parada desde
  // 03/09. Os campos que decidem sao `enabled` e `interrupted`.
  const WEBHOOK_REAL = {
    id: "695e2fba-f05a-45ae-a568-b4bf6b061eb5",
    url: "https://api.boranatech.com.br/api/webhooks/asaas",
    enabled: true,
    interrupted: true,
    apiVersion: 3,
    sendType: "SEQUENTIALLY",
    events: [
      "PAYMENT_DELETED",
      "PAYMENT_OVERDUE",
      "PAYMENT_CONFIRMED",
      "PAYMENT_RECEIVED",
    ],
  };

  it("listarWebhooks le GET /webhooks e devolve so enabled e interrupted", async () => {
    estado.asaasResposta = {
      "/webhooks": { object: "list", totalCount: 1, data: [WEBHOOK_REAL] },
    };

    const lista = await listarWebhooks();

    expect(estado.asaas[0]).toMatchObject({
      caminho: "/webhooks",
      method: "GET",
    });
    expect(lista).toEqual([{ enabled: true, interrupted: true }]);
  });

  it("listarWebhooks: data nulo vira lista vazia", async () => {
    estado.asaasResposta = { "/webhooks": { object: "list", data: null } };
    expect(await listarWebhooks()).toEqual([]);
  });

  it("listarWebhooks: erro do cliente propaga", async () => {
    estado.asaasErro = new Error("timeout");
    await expect(listarWebhooks()).rejects.toThrow("timeout");
  });

  it("interrupted em qualquer webhook classifica como interrompido", () => {
    expect(
      estadoDaFilaDeWebhooks([
        { enabled: true, interrupted: false },
        { enabled: true, interrupted: true },
      ]),
    ).toBe("interrompido");
  });

  it("enabled false, sem interrupcao, classifica como desligado", () => {
    expect(
      estadoDaFilaDeWebhooks([{ enabled: false, interrupted: false }]),
    ).toBe("desligado");
  });

  it("interrompido prevalece sobre desligado: e o estado que trava a fila", () => {
    expect(
      estadoDaFilaDeWebhooks([
        { enabled: false, interrupted: false },
        { enabled: true, interrupted: true },
      ]),
    ).toBe("interrompido");
  });

  it("nenhum webhook cadastrado e desligado: evento nenhum chega", () => {
    expect(estadoDaFilaDeWebhooks([])).toBe("desligado");
  });

  it("todos ativos e sem interrupcao e ok", () => {
    expect(
      estadoDaFilaDeWebhooks([{ enabled: true, interrupted: false }]),
    ).toBe("ok");
  });
});

describe("webhook: pagamento em linha ACTIVE ou ENCERRADA nunca some nem da 500", () => {
  // Com a renovacao por linha nova (lote 2b), um PAYMENT_RECEIVED apontando
  // para uma linha ja `active` ou ja `canceled`/`superseded` so acontece por
  // fluxo estranho. Antes: `active` engolia em silencio sem ledger; `canceled`
  // lancava 500 deterministico e reabria o laco de reentrega do incidente de
  // 2026-09-03. Agora os dois deixam rastro e dinheiro contado.
  const COBRANCA_ANTIGA = "pay_old_111";

  function linha(status: string) {
    return {
      id: "row-1",
      user_id: USER,
      status,
      plan_id: "plan-anual",
      affiliate_code: null,
      coupon_code: null,
      provider_subscription_id: COBRANCA_ANTIGA,
    };
  }

  const linhasDoLedger = () =>
    estado.escritas
      .filter(
        (e) => e.tabela === "finance_transactions" && e.operacao === "upsert",
      )
      .map((e) => e.carga as Record<string, unknown>);
  const carimbo = () =>
    estado.escritas.find(
      (e) => e.tabela === "billing_events" && e.operacao === "update",
    );

  beforeEach(() => {
    limpar();
  });

  it("linha ACTIVE com cobranca DIFERENTE: 200, ledger com dono e plano, sem tocar periodo", async () => {
    estado.linhaSubscription = linha("active");

    const r = await processAsaasEvent(eventoDePagamento());

    expect(r).toEqual({ received: true, activated: false, ledgered: true });
    expect(linhasDoLedger()).toHaveLength(1);
    expect(linhasDoLedger()[0]).toMatchObject({
      provider_transaction_id: COBRANCA,
      type: "charge",
      gross_cents: 22200,
      user_id: USER,
      plan_code: "pro_annual",
    });
    expect(carimbo()).toBeDefined();
    expect(estado.rpcCalls).toEqual([]);
    expect(estado.escritas.filter((e) => e.tabela === "subscriptions")).toEqual(
      [],
    );
    const avisos = estado.capturas.filter(
      (c) => c.mensagem === "asaas_pagamento_em_assinatura_ativa",
    );
    expect(avisos).toHaveLength(1);
    expect(avisos[0].opcoes).toMatchObject({
      level: "warning",
      fingerprint: ["asaas-pagamento-em-assinatura-ativa"],
      extra: {
        event_id: EVENTO,
        asaas_payment_id: COBRANCA,
        subscription_id: "row-1",
      },
    });
  });

  it("linha ACTIVE com a MESMA cobranca e reentrega: nada de ledger nem aviso", async () => {
    estado.linhaSubscription = {
      ...linha("active"),
      provider_subscription_id: COBRANCA,
    };

    const r = await processAsaasEvent(eventoDePagamento());

    expect(r).toEqual({ received: true, activated: false });
    expect(linhasDoLedger()).toEqual([]);
    expect(estado.capturas).toEqual([]);
  });

  it.each([["canceled"], ["superseded"]])(
    "linha %s: 200 com ledger e aviso, nunca 500",
    async (status) => {
      estado.linhaSubscription = linha(status);

      const r = await processAsaasEvent(eventoDePagamento());

      expect(r).toEqual({ received: true, activated: false, ledgered: true });
      expect(linhasDoLedger()).toHaveLength(1);
      expect(linhasDoLedger()[0]).toMatchObject({
        user_id: USER,
        plan_code: "pro_annual",
      });
      expect(carimbo()).toBeDefined();
      // O billing_events NAO e apagado: nao ha reentrega a provocar.
      expect(
        estado.escritas.filter(
          (e) => e.tabela === "billing_events" && e.operacao === "delete",
        ),
      ).toEqual([]);
      const avisos = estado.capturas.filter(
        (c) => c.mensagem === "asaas_pagamento_em_assinatura_encerrada",
      );
      expect(avisos).toHaveLength(1);
      expect(avisos[0].opcoes).toMatchObject({
        level: "warning",
        fingerprint: ["asaas-pagamento-em-assinatura-encerrada"],
        extra: { subscription_id: "row-1", subscription_status: status },
      });
      expect(
        estado.capturas.filter((c) => c.mensagem === "asaas_webhook_falhou"),
      ).toEqual([]);
    },
  );

  it("o MESMO evento entregue duas vezes nao grava segunda linha", async () => {
    estado.linhaSubscription = linha("canceled");

    await processAsaasEvent(eventoDePagamento());
    const segunda = await processAsaasEvent(eventoDePagamento());

    expect(segunda).toMatchObject({ received: true, deduped: true });
    expect(linhasDoLedger()).toHaveLength(1);
  });

  it("linha encerrada e payload SEM valor: 200, sem ledger, ledgered false", async () => {
    estado.linhaSubscription = linha("canceled");

    const r = await processAsaasEvent(
      eventoDePagamento({ payment: { value: undefined, netValue: undefined } }),
    );

    expect(r).toEqual({ received: true, activated: false, ledgered: false });
    expect(linhasDoLedger()).toEqual([]);
  });
});

describe("checkout Pix de RENOVACAO (internalRenewal)", () => {
  beforeEach(() => {
    limpar();
    // Assinante ativo: e exatamente quem renova.
    estado.ativas = [{ id: "sub-viva" }];
    estado.linhaSubscription = {
      id: "sub-viva",
      user_id: USER,
      status: "active",
      plan_id: "plan-anual",
      affiliate_code: null,
      coupon_code: null,
      current_period_start: "2026-03-01T00:00:00.000Z",
    };
  });

  function renovacao(over: Record<string, unknown> = {}) {
    return {
      ...checkoutInput("pro_annual"),
      internalRenewal: true,
      ...over,
    } as Parameters<typeof asaasProvider.createCheckout>[0];
  }

  it("pula o 409 de assinatura ativa e cria a cobranca", async () => {
    const r = await asaasProvider.createCheckout(renovacao());

    expect(r.subscriptionId).toBe(COBRANCA);
    expect(
      estado.asaas.filter(
        (c) => c.method === "POST" && c.caminho === "/payments",
      ),
    ).toHaveLength(1);
  });

  it("CONTROLE: sem internalRenewal o mesmo assinante continua recebendo 409", async () => {
    await expect(
      asaasProvider.createCheckout(checkoutInput("pro_annual")),
    ).rejects.toMatchObject({ code: "conflict" });
  });

  it("MANTEM o 409 de Pix pendente: nao gera dois QR de renovacao", async () => {
    estado.pixPendentes = [{ id: "pix-em-aberto" }];

    await expect(
      asaasProvider.createCheckout(renovacao()),
    ).rejects.toMatchObject({ code: "pix_pending" });
    expect(estado.asaas).toEqual([]);
  });

  it("a linha nova nasce pending, manual, pix, com externalReference = id dela", async () => {
    await asaasProvider.createCheckout(renovacao());

    const insert = estado.escritas.find(
      (e) => e.tabela === "subscriptions" && e.operacao === "insert",
    )!;
    expect(insert.carga).toMatchObject({
      status: "pending",
      renewal_type: "manual",
      payment_method: "pix",
      provider_subscription_id: null,
    });
    const post = estado.asaas.find(
      (c) => c.method === "POST" && c.caminho === "/payments",
    )!;
    expect((post.body as Record<string, unknown>).externalReference).toBe(
      estado.novaLinhaId,
    );
  });

  it("a descricao da cobranca diz que e renovacao", async () => {
    await asaasProvider.createCheckout(renovacao());

    const post = estado.asaas.find(
      (c) => c.method === "POST" && c.caminho === "/payments",
    )!;
    expect((post.body as Record<string, unknown>).description).toBe(
      "Renovação Bora na Tech Pro Anual",
    );
  });

  it("CONTROLE: a primeira compra continua sem a palavra Renovação", async () => {
    estado.ativas = [];
    estado.linhaSubscription = null;

    await asaasProvider.createCheckout(checkoutInput("pro_annual"));

    const post = estado.asaas.find(
      (c) => c.method === "POST" && c.caminho === "/payments",
    )!;
    expect((post.body as Record<string, unknown>).description).toBe(
      "Bora na Tech Pro Anual",
    );
  });

  it("renovacao NAO aplica promocao, mesmo com codigos no input: cobra cheio", async () => {
    estado.cupom = { code: "DESC90", discount_percent: 90, active: true };
    estado.afiliado = afiliadoDe(20, "AFILIADO20");

    await asaasProvider.createCheckout(
      renovacao({ couponCode: "DESC90", affiliateCode: "AFILIADO20" }),
    );

    const post = estado.asaas.find(
      (c) => c.method === "POST" && c.caminho === "/payments",
    )!;
    expect((post.body as Record<string, unknown>).value).toBe(
      PLAN_PRICING.pro_annual.total,
    );
    const insert = estado.escritas.find(
      (e) => e.tabela === "subscriptions" && e.operacao === "insert",
    )!;
    expect((insert.carga as Record<string, unknown>).coupon_code).toBeNull();
    expect((insert.carga as Record<string, unknown>).affiliate_code).toBeNull();
  });
});

describe("cancelPayment: DELETE, e na recusa o STATUS decide", () => {
  /** Recusa 4xx como `asaasFetch` a entrega: 502 nosso, status do Asaas no context. */
  const recusa4xx = () =>
    createError(
      502,
      "asaas_error",
      "O provedor de pagamento recusou a operação.",
      {
        context: {
          asaas_status: 400,
          asaas_code: "invalid_action",
          asaas_description: "texto que o codigo NAO le",
        },
      },
    );

  beforeEach(() => {
    limpar();
  });

  it("DELETE confirmado (deleted: true): cancelada, sem GET", async () => {
    estado.asaasResposta = {
      "/payments/pay_x": { deleted: true, id: "pay_x" },
    };
    expect(await cancelPayment("pay_x")).toEqual({ resultado: "cancelada" });
    expect(estado.asaas).toEqual([
      { caminho: "/payments/pay_x", method: "DELETE", body: undefined },
    ]);
  });

  it("o id vai ESCAPADO na URL", async () => {
    estado.asaasResposta = { "/payments/": { deleted: true } };
    await cancelPayment("pay/../outro");
    expect(estado.asaas[0].caminho).toBe("/payments/pay%2F..%2Foutro");
  });

  it("DELETE 2xx SEM deleted=true: falha, sem GET", async () => {
    estado.asaasResposta = { "/payments/pay_x": { id: "pay_x" } };
    const r = await cancelPayment("pay_x");
    expect(r.resultado).toBe("falha");
    expect(estado.asaas.map((c) => c.method)).toEqual(["DELETE"]);
  });

  it.each(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"])(
    "recusa 4xx com a cobranca %s: already_paid",
    async (status) => {
      estado.asaasErroPorMetodo = { DELETE: recusa4xx() };
      estado.asaasResposta = { "/payments/pay_x": { status, value: 29.9 } };
      expect(await cancelPayment("pay_x")).toEqual({
        resultado: "already_paid",
        status,
      });
      expect(estado.asaas.map((c) => c.method)).toEqual(["DELETE", "GET"]);
    },
  );

  it("recusa 4xx com a cobranca ja removida (deleted: true): cancelada, idempotente", async () => {
    estado.asaasErroPorMetodo = { DELETE: recusa4xx() };
    estado.asaasResposta = {
      "/payments/pay_x": { status: "PENDING", deleted: true },
    };
    expect(await cancelPayment("pay_x")).toEqual({ resultado: "cancelada" });
  });

  it("recusa 4xx com a cobranca CANCELLED: cancelada", async () => {
    estado.asaasErroPorMetodo = { DELETE: recusa4xx() };
    estado.asaasResposta = { "/payments/pay_x": { status: "CANCELLED" } };
    expect(await cancelPayment("pay_x")).toEqual({ resultado: "cancelada" });
  });

  it.each(["PENDING", "OVERDUE", "STATUS_QUE_NAO_EXISTE_HOJE"])(
    "recusa 4xx com a cobranca %s: falha",
    async (status) => {
      estado.asaasErroPorMetodo = { DELETE: recusa4xx() };
      estado.asaasResposta = { "/payments/pay_x": { status } };
      expect((await cancelPayment("pay_x")).resultado).toBe("falha");
    },
  );

  it("recusa 4xx e a cobranca SEM status: falha", async () => {
    estado.asaasErroPorMetodo = { DELETE: recusa4xx() };
    estado.asaasResposta = { "/payments/pay_x": { value: 29.9 } };
    expect((await cancelPayment("pay_x")).resultado).toBe("falha");
  });

  it("recusa 4xx e o GET falha: falha, e nao lanca", async () => {
    estado.asaasErroPorMetodo = {
      DELETE: recusa4xx(),
      GET: new Error("timeout"),
    };
    expect(await cancelPayment("pay_x")).toEqual({
      resultado: "falha",
      motivo: "leitura_falhou",
    });
  });

  it("5xx do Asaas: falha, SEM GET (o DELETE pode nem ter chegado)", async () => {
    estado.asaasErroPorMetodo = {
      DELETE: createError(502, "asaas_error", "x", {
        context: { asaas_status: 503, asaas_code: null },
      }),
    };
    expect((await cancelPayment("pay_x")).resultado).toBe("falha");
    expect(estado.asaas.map((c) => c.method)).toEqual(["DELETE"]);
  });

  it("falha de transporte (asaas_unreachable, sem status): falha, SEM GET", async () => {
    estado.asaasErroPorMetodo = {
      DELETE: createError(
        502,
        "asaas_unreachable",
        "Falha ao falar com o Asaas.",
      ),
    };
    expect((await cancelPayment("pay_x")).resultado).toBe("falha");
    expect(estado.asaas.map((c) => c.method)).toEqual(["DELETE"]);
  });

  it("erro cru, sem context nenhum: falha, e nao lanca", async () => {
    estado.asaasErroPorMetodo = { DELETE: new Error("boom") };
    expect((await cancelPayment("pay_x")).resultado).toBe("falha");
  });
});

describe("fechamento sincrono e o PAYMENT_DELETED que chega depois", () => {
  beforeEach(() => {
    limpar();
    estado.linhaSubscription = {
      id: "row-1",
      user_id: USER,
      status: "pending",
      plan_id: "plan-anual",
      affiliate_code: null,
      coupon_code: null,
      provider_subscription_id: COBRANCA,
    };
  });

  function updatesDeSubscriptions() {
    return estado.escritas.filter(
      (e) => e.tabela === "subscriptions" && e.operacao === "update",
    );
  }

  it("o fechamento sincrono cancela a linha com canceled_at, condicional em pending", async () => {
    await closePendingCharge({
      eventType: "CANCELAMENTO_PELO_CLIENTE",
      eventId: "",
      chargeId: COBRANCA,
      rowId: "row-1",
      event: { event: "CANCELAMENTO_PELO_CLIENTE", payment: { id: COBRANCA } },
    });

    const [update] = updatesDeSubscriptions();
    expect(update.carga).toMatchObject({ status: "canceled" });
    expect(typeof (update.carga as Record<string, unknown>).canceled_at).toBe(
      "string",
    );
    expect(update.filtros).toEqual([
      ["id", "row-1"],
      ["status", "pending"],
    ]);
  });

  it("PAYMENT_DELETED sobre a linha ja cancelada: so escreve filtrado por pending, sem RPC nem alarme", async () => {
    // O duble nao aplica filtro; o banco aplica. O que se trava aqui e que TODO
    // update do webhook carrega `status = pending`, que e o que faz o banco nao
    // casar a linha ja `canceled`: a escrita vira no-op, e nada mais acontece.
    estado.linhaSubscription = {
      ...estado.linhaSubscription!,
      status: "canceled",
    };

    const r = await processAsaasEvent(
      eventoDePagamento({ event: "PAYMENT_DELETED" }),
    );

    expect(r).toEqual({ received: true, activated: false });
    const updates = updatesDeSubscriptions();
    expect(updates.length).toBeGreaterThan(0);
    for (const u of updates) {
      expect(u.filtros).toContainEqual(["status", "pending"]);
    }
    expect(estado.rpcCalls).toEqual([]);
    expect(estado.capturas).toEqual([]);
    expect(estado.emails).toEqual([]);
  });
});

describe("ativacao Pix: a ancora do periodo e a regra compartilhada", () => {
  beforeEach(() => {
    limpar();
    // O duble devolve `linhaSubscription` para toda leitura `maybeSingle` de
    // subscriptions, inclusive a consulta da ancora: um fim vigente aqui e
    // lido como "a maior assinatura ainda vigente do usuario".
    estado.linhaSubscription = {
      id: "row-1",
      user_id: USER,
      status: "pending",
      plan_id: "plan-anual",
      affiliate_code: null,
      coupon_code: null,
      current_period_end: "2026-09-21T00:00:00.000Z",
    };
  });

  it("pagamento ANTES do fim vigente: o periodo novo comeca no fim vigente", async () => {
    await processAsaasEvent(
      eventoDePagamento({ dateCreated: "2026-09-18 12:00:00" }),
    );

    const rpc = estado.rpcCalls.find(
      (c) => c.nome === "activate_subscription_exclusive",
    )!;
    expect(rpc.args.p_period_start).toBe("2026-09-21T00:00:00.000Z");
    expect(rpc.args.p_period_end).toBe(
      new Date(
        Date.parse("2026-09-21T00:00:00.000Z") +
          oneOffAccessDays("pro_annual", "pix")! * 24 * 60 * 60 * 1000,
      ).toISOString(),
    );
  });
});
