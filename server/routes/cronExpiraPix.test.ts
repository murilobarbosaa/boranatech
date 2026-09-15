import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A RODADA DE EXPIRACAO DO PIX VENCIDO: quem e candidata, o que e excluido no
 * Asaas, em que ordem, e o que fica vivo.
 *
 * O duble do banco APLICA os filtros (`eq`, `lt`, `is`), no padrao de
 * cronLembretePix.test.ts: um que so registrasse a query provaria a intencao,
 * nao quais linhas ela pega. O Asaas (`lerPagamento`, `cancelPayment`) e o
 * Sentry sao dublados por inteiro, e nenhum caso toca rede.
 *
 * A regra que governa tudo: a linha so fecha DEPOIS de o Asaas confirmar a
 * exclusao. Linha fechada com cobranca viva e pagamento tardio sem acesso.
 */

type Pagamento = {
  status: string | null;
  valueCents: number | null;
  dueDate: string | null;
  invoiceUrl: string | null;
  refunds: unknown[];
  deleted: boolean;
};

const estado = vi.hoisted(() => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    supabaseServiceRoleKey: "service",
    appPublicUrl: "https://exemplo.com",
    isProd: false,
    devProUserIds: [] as string[],
    stripePriceIds: { pro_monthly: "p", pro_semiannual: "p", pro_annual: "p" },
    stripeSecretKey: "sk_test_x",
    stripeWebhookSecret: "whsec_x",
    billingEnabled: false,
    asaasEnabled: true,
    cronSecret: "s",
    posthogApiKey: "",
    posthogProjectId: "",
    posthogHost: "https://us.posthog.com",
    rateLimitMaxRequests: 1000,
    refundMaxPerMinute: 100,
    pixRemindersEnabled: false,
    pixExpiryEnabled: false,
  },
  rows: [] as Array<Record<string, unknown>>,
  updates: [] as Array<{
    patch: Record<string, unknown>;
    filtros: Record<string, unknown>;
  }>,
  falhaUpdate: null as { message: string } | null,
  pagamentos: {} as Record<string, unknown>,
  cancelamentos: {} as Record<string, unknown>,
  lidos: [] as string[],
  cancelados: [] as string[],
  sequencia: [] as string[],
  sentry: [] as Array<{ mensagem: string; opcoes: Record<string, unknown> }>,
}));

vi.mock("../lib/redis", () => ({
  queueConnection: null,
  cacheConnection: null,
}));
vi.mock("../lib/env", () => ({ env: estado.env }));
vi.mock("../lib/openai", () => ({ getOpenAI: () => ({}), openai: {} }));
vi.mock("../lib/aiEnrich", () => ({ enrichNews: vi.fn() }));
vi.mock("../lib/stripeClient", () => ({
  getStripe: () => {
    throw new Error("este teste nao chama a Stripe");
  },
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));
vi.mock("../lib/queue", () => ({
  emailQueue: null,
  createEmailWorker: vi.fn(),
  enqueueEmail: vi.fn(),
}));
vi.mock("../lib/targetedNotifications", () => ({
  createTargetedNotification: vi.fn(),
}));
vi.mock("../lib/emailCampaignQueue", () => ({
  fetchSuppressedEmailSet: async () => new Set<string>(),
  reconcileEmailCampaignBatches: vi.fn(),
}));
vi.mock("../providers/asaas", () => ({
  lerPagamento: async (id: string) => {
    estado.lidos.push(id);
    estado.sequencia.push(`ler:${id}`);
    const p = estado.pagamentos[id];
    if (p instanceof Error) throw p;
    if (!p) throw new Error(`pagamento ${id} nao preparado no teste`);
    return p;
  },
  cancelPayment: async (id: string) => {
    estado.cancelados.push(id);
    estado.sequencia.push(`cancel:${id}`);
    const c = estado.cancelamentos[id];
    if (c instanceof Error) throw c;
    return c ?? { resultado: "cancelada" };
  },
}));
vi.mock("@sentry/node", () => ({
  captureMessage: (mensagem: string, opcoes: Record<string, unknown>) => {
    estado.sentry.push({ mensagem, opcoes });
  },
  captureException: () => {},
  withScope: (fn: (scope: unknown) => void) => fn({ setContext() {} }),
}));

vi.mock("../lib/supabaseAdmin", () => {
  function consulta(tabela: string) {
    const iguais: Record<string, unknown> = {};
    const menores: Record<string, string> = {};
    const nulos: string[] = [];
    let patch: Record<string, unknown> | null = null;
    let colunas = "";

    const casa = (row: Record<string, unknown>) =>
      Object.entries(iguais).every(([c, v]) => row[c] === v) &&
      Object.entries(menores).every(
        ([c, v]) => typeof row[c] === "string" && (row[c] as string) < v,
      ) &&
      nulos.every((c) => row[c] === null);

    const q: Record<string, unknown> = {};
    q.select = (c: string) => {
      colunas = c;
      return q;
    };
    q.order = () => q;
    q.eq = (coluna: string, valor: unknown) => {
      iguais[coluna] = valor;
      return q;
    };
    q.lt = (coluna: string, valor: string) => {
      menores[coluna] = valor;
      return q;
    };
    q.is = (coluna: string, valor: unknown) => {
      if (valor !== null) throw new Error("duble so conhece is(null)");
      nulos.push(coluna);
      return q;
    };
    q.update = (p: Record<string, unknown>) => {
      patch = p;
      return q;
    };
    q.range = async (from: number, to: number) => {
      if (tabela !== "subscriptions") throw new Error(`tabela ${tabela}`);
      if (colunas.includes("*")) {
        throw new Error("select(*) proibido nesta rodada");
      }
      return {
        data: estado.rows.filter(casa).slice(from, to + 1),
        error: null,
      };
    };
    q.then = (ok: (v: unknown) => unknown) =>
      Promise.resolve()
        .then(() => {
          if (!patch) throw new Error("so update e aguardado sem range");
          estado.updates.push({ patch, filtros: { ...iguais } });
          estado.sequencia.push(`update:${Object.keys(patch).join(",")}`);
          if (estado.falhaUpdate)
            return { data: null, error: estado.falhaUpdate };
          for (const r of estado.rows.filter(casa)) Object.assign(r, patch);
          return { data: null, error: null };
        })
        .then(ok);
    return q;
  }
  return { supabaseAdmin: { from: (tabela: string) => consulta(tabela) } };
});

import { rodarExpiracaoPix } from "./cron";

/**
 * 03h50 de 15/09 em Brasilia, a hora do agendamento. "Ontem" e 14/09: vence em
 * 12/09 ou 13/09 e candidata, vence em 14/09 ainda nao.
 */
const AGORA = new Date(Date.parse("2026-09-15T03:50:00-03:00"));

function linha(over: Record<string, unknown> = {}) {
  return {
    id: "row-1",
    user_id: "u1",
    provider: "asaas",
    payment_method: "pix",
    status: "pending",
    created_at: "2026-09-10T15:00:00.000Z",
    provider_subscription_id: "pay_1",
    pix_due_date: "2026-09-12",
    ...over,
  };
}

function pagamento(over: Partial<Pagamento> = {}): Pagamento {
  return {
    status: "PENDING",
    valueCents: 1737,
    dueDate: "2026-09-12",
    invoiceUrl: "https://www.asaas.com/i/pay1",
    refunds: [],
    deleted: false,
    ...over,
  };
}

function statusDa(id: string) {
  return estado.rows.find((r) => r.id === id)?.status;
}

beforeEach(() => {
  estado.env.pixExpiryEnabled = false;
  estado.rows = [];
  estado.updates = [];
  estado.falhaUpdate = null;
  estado.pagamentos = { pay_1: pagamento(), pay_2: pagamento() };
  estado.cancelamentos = {};
  estado.lidos = [];
  estado.cancelados = [];
  estado.sequencia = [];
  estado.sentry = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("rodarExpiracaoPix", () => {
  it("1. flag desligada: le o Asaas, conta o que CANCELARIA, e nao exclui nem escreve nada", async () => {
    estado.rows = [
      linha(),
      linha({
        id: "row-2",
        provider_subscription_id: "pay_2",
        pix_due_date: "2026-09-13",
      }),
    ];
    estado.pagamentos.pay_2 = pagamento({ status: "OVERDUE" });

    const r = await rodarExpiracaoPix(AGORA);

    expect(estado.cancelados).toEqual([]);
    expect(estado.updates).toEqual([]);
    expect(estado.lidos).toEqual(["pay_1", "pay_2"]);
    expect(r).toMatchObject({
      ligado: false,
      candidatos: 2,
      canceladas: 0,
      cancelaria: 2,
      falhas: 0,
    });
    expect(statusDa("row-1")).toBe("pending");
    expect(statusDa("row-2")).toBe("pending");
  });

  it("2. flag ligada: exclui no Asaas ANTES do update, e o update e condicional em pending", async () => {
    estado.env.pixExpiryEnabled = true;
    estado.rows = [
      linha(),
      // Nenhuma destas e candidata: o duble aplica os filtros.
      linha({ id: "row-cancelada", status: "canceled" }),
      linha({ id: "row-boleto", provider: "stripe", payment_method: "boleto" }),
    ];

    const r = await rodarExpiracaoPix(AGORA);

    expect(r).toMatchObject({ candidatos: 1, canceladas: 1, falhas: 0 });
    expect(estado.sequencia).toEqual([
      "ler:pay_1",
      "cancel:pay_1",
      "update:status,canceled_at,last_event_at",
    ]);
    expect(estado.updates).toHaveLength(1);
    expect(estado.updates[0].patch.status).toBe("canceled");
    expect(estado.updates[0].filtros).toEqual({
      id: "row-1",
      status: "pending",
    });
    expect(statusDa("row-1")).toBe("canceled");
  });

  it("3. pagamento RECEIVED numa linha pendente: nao cancela nada, nem remoto nem local, e grita", async () => {
    estado.env.pixExpiryEnabled = true;
    estado.rows = [linha()];
    estado.pagamentos.pay_1 = pagamento({ status: "RECEIVED" });

    const r = await rodarExpiracaoPix(AGORA);

    expect(estado.cancelados).toEqual([]);
    expect(estado.updates).toEqual([]);
    expect(statusDa("row-1")).toBe("pending");
    expect(r).toMatchObject({ pagosMantidos: 1, canceladas: 0, falhas: 0 });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/PAGO.*pay_1.*row-1/),
    );
    expect(estado.sentry).toEqual([
      {
        mensagem: "pix_expiry_pago_em_linha_pendente",
        opcoes: expect.objectContaining({
          fingerprint: ["pix-expiry-pago-em-linha-pendente"],
          extra: expect.objectContaining({
            subscription_row_id: "row-1",
            asaas_payment_id: "pay_1",
            asaas_status: "RECEIVED",
          }),
        }),
      },
    ]);
  });

  it("3b. pago entre a leitura e a exclusao (already_paid): a linha fica viva e grita", async () => {
    estado.env.pixExpiryEnabled = true;
    estado.rows = [linha()];
    estado.cancelamentos.pay_1 = {
      resultado: "already_paid",
      status: "CONFIRMED",
    };

    const r = await rodarExpiracaoPix(AGORA);

    expect(estado.updates).toEqual([]);
    expect(statusDa("row-1")).toBe("pending");
    expect(r).toMatchObject({ pagosMantidos: 1, canceladas: 0 });
    expect(estado.sentry.map((s) => s.mensagem)).toEqual([
      "pix_expiry_pago_em_linha_pendente",
    ]);
  });

  it("4. exclusao no Asaas nao confirmada: a linha continua pending e conta falha", async () => {
    estado.env.pixExpiryEnabled = true;
    estado.rows = [linha()];
    estado.cancelamentos.pay_1 = {
      resultado: "falha",
      motivo: "delete_sem_recusa_4xx",
    };

    const r = await rodarExpiracaoPix(AGORA);

    expect(estado.cancelados).toEqual(["pay_1"]);
    expect(estado.updates).toEqual([]);
    expect(statusDa("row-1")).toBe("pending");
    expect(r).toMatchObject({ falhas: 1, canceladas: 0 });
  });

  it("4b. exclusao no Asaas lancando: a linha continua pending, conta falha e o laco segue", async () => {
    estado.env.pixExpiryEnabled = true;
    estado.rows = [
      linha(),
      linha({ id: "row-2", provider_subscription_id: "pay_2" }),
    ];
    estado.cancelamentos.pay_1 = new Error("socket hang up");

    const r = await rodarExpiracaoPix(AGORA);

    expect(statusDa("row-1")).toBe("pending");
    expect(statusDa("row-2")).toBe("canceled");
    expect(r).toMatchObject({ falhas: 1, canceladas: 1 });
  });

  it("5. lerPagamento lancando: nada acontece com a linha, conta falha e o laco segue", async () => {
    estado.env.pixExpiryEnabled = true;
    estado.rows = [
      linha(),
      linha({ id: "row-2", provider_subscription_id: "pay_2" }),
    ];
    estado.pagamentos.pay_1 = new Error("asaas fora do ar");

    const r = await rodarExpiracaoPix(AGORA);

    expect(estado.cancelados).toEqual(["pay_2"]);
    expect(estado.updates.map((u) => u.filtros.id)).toEqual(["row-2"]);
    expect(statusDa("row-1")).toBe("pending");
    expect(r).toMatchObject({ falhas: 1, canceladas: 1 });
  });

  it("6. linha dentro do prazo nao e candidata: vence ontem, hoje ou depois fica de fora", async () => {
    estado.env.pixExpiryEnabled = true;
    estado.rows = [
      linha({ id: "row-anteontem", pix_due_date: "2026-09-13" }),
      linha({ id: "row-ontem", pix_due_date: "2026-09-14" }),
      linha({ id: "row-hoje", pix_due_date: "2026-09-15" }),
      linha({ id: "row-amanha", pix_due_date: "2026-09-16" }),
    ];

    const r = await rodarExpiracaoPix(AGORA);

    expect(r.candidatos).toBe(1);
    expect(estado.updates.map((u) => u.filtros.id)).toEqual(["row-anteontem"]);
  });

  it("7. linha com pix_due_date nulo so entra depois de 4 dias de criada", async () => {
    estado.env.pixExpiryEnabled = true;
    estado.rows = [
      // 4 dias e 50 minutos antes de AGORA (06h50 UTC de 15/09).
      linha({
        id: "row-velha",
        pix_due_date: null,
        created_at: "2026-09-11T06:00:00.000Z",
      }),
      // 3 dias e 23h50 antes de AGORA.
      linha({
        id: "row-nova",
        pix_due_date: null,
        created_at: "2026-09-11T07:00:00.000Z",
      }),
    ];

    const r = await rodarExpiracaoPix(AGORA);

    expect(r.candidatos).toBe(1);
    expect(estado.updates.map((u) => u.filtros.id)).toEqual(["row-velha"]);
  });

  it("sem cobranca amarrada: pula sem ler nem excluir", async () => {
    estado.env.pixExpiryEnabled = true;
    estado.rows = [linha({ provider_subscription_id: null })];

    const r = await rodarExpiracaoPix(AGORA);

    expect(estado.lidos).toEqual([]);
    expect(estado.cancelados).toEqual([]);
    expect(r.pulados).toEqual({ sem_cobranca: 1 });
  });

  it("update da linha falhando depois da exclusao: conta falha e grita com os dois ids", async () => {
    estado.env.pixExpiryEnabled = true;
    estado.rows = [linha()];
    estado.falhaUpdate = { message: "statement timeout" };

    const r = await rodarExpiracaoPix(AGORA);

    expect(estado.cancelados).toEqual(["pay_1"]);
    expect(r).toMatchObject({ falhas: 1, canceladas: 0 });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/pay_1.*row-1.*NAO fechou/),
      expect.anything(),
    );
  });
});
