import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A RODADA DO LEMBRETE DE PIX PENDENTE: quem recebe, o que sai e o que fica
 * registrado.
 *
 * O duble do banco APLICA os filtros, no padrao de cronLembreteProvedor.test.ts:
 * um que so registrasse a query provaria a intencao, nao quais linhas ela pega.
 * O Asaas (`lerPagamento`) e a fila (`enqueueEmail`) sao dublados por inteiro, e
 * nenhum caso toca rede.
 *
 * O primeiro teste e o do primeiro deploy: com a flag desligada, a rodada decide
 * tudo e nao enfileira nem marca nada.
 */

type Pagamento = {
  status: string | null;
  valueCents: number | null;
  dueDate: string | null;
  invoiceUrl: string | null;
  refunds: unknown[];
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
  },
  rows: [] as Array<Record<string, unknown>>,
  plans: [] as Array<Record<string, unknown>>,
  updates: [] as Array<{ patch: Record<string, unknown>; id: unknown }>,
  falhaUpdate: null as
    | ((patch: Record<string, unknown>) => { message: string } | null)
    | null,
  consultasDeAssinantes: 0,
  pagamentos: {} as Record<string, unknown>,
  lidos: [] as string[],
  enfileirados: [] as Array<{
    job: Record<string, unknown>;
    opcoes: unknown;
  }>,
  sequencia: [] as string[],
  suprimidos: new Set<string>(),
  emailsDosUsuarios: {} as Record<string, string | null>,
  /** Quantas vezes a supressao foi lida. */
  leiturasDeSupressao: 0,
  /** Tamanho de cada lista de ids enviada na consulta de assinantes. */
  blocosDeAssinantes: [] as number[],
  /** Indice do bloco de assinantes cuja consulta devolve erro, se algum. */
  falhaAssinantesNoBloco: null as number | null,
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
  enqueueEmail: async (job: Record<string, unknown>, opcoes?: unknown) => {
    estado.enfileirados.push({ job, opcoes });
    estado.sequencia.push(`enqueue:${String(job.type)}`);
  },
}));
vi.mock("../lib/targetedNotifications", () => ({
  createTargetedNotification: vi.fn(),
}));
vi.mock("../lib/emailCampaignQueue", () => ({
  fetchSuppressedEmailSet: async () => {
    estado.leiturasDeSupressao++;
    return estado.suprimidos;
  },
  reconcileEmailCampaignBatches: vi.fn(),
}));
vi.mock("../providers/asaas", () => ({
  lerPagamento: async (id: string) => {
    estado.lidos.push(id);
    const p = estado.pagamentos[id];
    if (p instanceof Error) throw p;
    if (!p) throw new Error(`pagamento ${id} nao preparado no teste`);
    return p;
  },
}));
vi.mock("@sentry/node", () => ({
  captureMessage: () => {},
  captureException: () => {},
  withScope: (fn: (scope: unknown) => void) => fn({ setContext() {} }),
}));

vi.mock("../lib/supabaseAdmin", () => {
  function consulta(tabela: string) {
    const iguais: Record<string, unknown> = {};
    const dentro: Record<string, unknown[]> = {};
    let patch: Record<string, unknown> | null = null;
    let colunas = "";

    const casa = (row: Record<string, unknown>) =>
      Object.entries(iguais).every(([c, v]) => row[c] === v) &&
      Object.entries(dentro).every(([c, vs]) => vs.includes(row[c]));

    const q: Record<string, unknown> = {};
    q.select = (c: string) => {
      colunas = c;
      if (tabela === "subscriptions" && c === "user_id") {
        estado.consultasDeAssinantes++;
      }
      return q;
    };
    q.order = () => q;
    q.eq = (coluna: string, valor: unknown) => {
      iguais[coluna] = valor;
      return q;
    };
    q.in = (coluna: string, valores: unknown[]) => {
      if (tabela === "subscriptions" && coluna === "user_id") {
        estado.blocosDeAssinantes.push(valores.length);
      }
      dentro[coluna] = valores;
      return q;
    };
    q.update = (p: Record<string, unknown>) => {
      patch = p;
      return q;
    };
    q.range = async (from: number, to: number) => {
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
          if (tabela === "plans") return { data: estado.plans, error: null };
          if (patch) {
            const erro = estado.falhaUpdate ? estado.falhaUpdate(patch) : null;
            estado.updates.push({ patch, id: iguais.id });
            estado.sequencia.push(`update:${Object.keys(patch).join(",")}`);
            if (erro) return { data: null, error: erro };
            for (const r of estado.rows.filter(casa)) Object.assign(r, patch);
            return { data: null, error: null };
          }
          if (
            tabela === "subscriptions" &&
            colunas === "user_id" &&
            estado.falhaAssinantesNoBloco !== null &&
            estado.blocosDeAssinantes.length - 1 ===
              estado.falhaAssinantesNoBloco
          ) {
            return { data: null, error: { message: "timeout no bloco" } };
          }
          return { data: estado.rows.filter(casa), error: null };
        })
        .then(ok);
    return q;
  }
  return {
    supabaseAdmin: {
      from: (tabela: string) => consulta(tabela),
      auth: {
        admin: {
          getUserById: async (id: string) => {
            const email =
              id in estado.emailsDosUsuarios
                ? estado.emailsDosUsuarios[id]
                : `${id}@exemplo.com`;
            return {
              data: {
                user: email ? { email, user_metadata: { name: "Pessoa" } } : null,
              },
              error: null,
            };
          },
        },
      },
    },
  };
});

import { rodarLembretesPix } from "./cron";

/** 15h de 09/09 em Brasilia: dentro da janela, um dia antes do vencimento. */
const AGORA = new Date(Date.parse("2026-09-09T15:00:00-03:00"));

function linha(over: Record<string, unknown> = {}) {
  return {
    id: "row-1",
    user_id: "u1",
    provider: "asaas",
    payment_method: "pix",
    status: "pending",
    plan_id: "plan-anual",
    created_at: "2026-09-08T16:00:00.000Z",
    provider_subscription_id: "pay_1",
    pix_due_date: "2026-09-10",
    pix_invoice_url: "https://www.asaas.com/i/pay1",
    pix_reminders_sent: [] as string[],
    ...over,
  };
}

function pagamento(over: Partial<Pagamento> = {}): Pagamento {
  return {
    status: "PENDING",
    // R$ 17,37 nao e preco de tabela de plano nenhum, de proposito.
    valueCents: 1737,
    dueDate: "2026-09-10",
    invoiceUrl: "https://www.asaas.com/i/pay1",
    refunds: [],
    ...over,
  };
}

function marcacoes() {
  return estado.updates.filter((u) => "pix_reminders_sent" in u.patch);
}

function backfillsGravados() {
  return estado.updates.filter((u) => "pix_due_date" in u.patch);
}

beforeEach(() => {
  estado.env.pixRemindersEnabled = false;
  estado.rows = [];
  estado.plans = [
    { id: "plan-mensal", code: "pro_monthly" },
    { id: "plan-semestral", code: "pro_semiannual" },
    { id: "plan-anual", code: "pro_annual" },
  ];
  estado.updates = [];
  estado.falhaUpdate = null;
  estado.consultasDeAssinantes = 0;
  estado.pagamentos = { pay_1: pagamento() };
  estado.lidos = [];
  estado.enfileirados = [];
  estado.sequencia = [];
  estado.suprimidos = new Set();
  estado.emailsDosUsuarios = {};
  estado.leiturasDeSupressao = 0;
  estado.blocosDeAssinantes = [];
  estado.falhaAssinantesNoBloco = null;
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("rodarLembretesPix", () => {
  it("1. flag desligada: decide tudo, conta o que ENVIARIA e nao enfileira nem marca", async () => {
    estado.rows = [
      linha(),
      linha({
        id: "row-2",
        user_id: "u2",
        provider_subscription_id: "pay_2",
        pix_due_date: "2026-09-09",
      }),
    ];
    estado.pagamentos.pay_2 = pagamento({ dueDate: "2026-09-09" });

    const r = await rodarLembretesPix(AGORA);

    expect(estado.enfileirados).toEqual([]);
    expect(marcacoes()).toEqual([]);
    expect(r.ligado).toBe(false);
    expect(r.enviados).toBe(0);
    expect(r.enviaria).toEqual({ p1: 1, p0: 1 });
    expect(r.candidatos).toBe(2);
    expect(r.falhas).toBe(0);
  });

  it("2. flag ligada: um enqueue com tipo, variante e jobId certos, e so depois a marcacao", async () => {
    estado.env.pixRemindersEnabled = true;
    estado.rows = [
      linha(),
      // Nenhuma destas e candidata: o duble aplica os filtros.
      linha({ id: "row-cancelada", status: "canceled" }),
      linha({ id: "row-boleto", provider: "stripe", payment_method: "boleto" }),
    ];

    const r = await rodarLembretesPix(AGORA);

    expect(r.candidatos).toBe(1);
    expect(r.enviados).toBe(1);
    expect(estado.enfileirados).toHaveLength(1);
    const { job, opcoes } = estado.enfileirados[0];
    expect(job).toEqual({
      type: "pix_pending_reminder",
      to: "u1@exemplo.com",
      name: "Pessoa",
      variant: "aberto",
      planName: "Anual",
      amountCents: 1737,
      dueDate: "2026-09-10",
      payUrl: "https://exemplo.com/perfil?pix=abrir",
      invoiceUrl: "https://www.asaas.com/i/pay1",
    });
    expect(opcoes).toEqual({ jobId: "pix-lembrete:row-1:p1" });
    expect(marcacoes()).toEqual([
      { patch: { pix_reminders_sent: ["p1"] }, id: "row-1" },
    ]);
    expect(estado.sequencia).toEqual([
      "enqueue:pix_pending_reminder",
      "update:pix_reminders_sent",
    ]);
  });

  it("3. pago no Asaas com a linha ainda pending (webhook atrasado): nao envia", async () => {
    estado.env.pixRemindersEnabled = true;
    estado.rows = [linha()];
    estado.pagamentos.pay_1 = pagamento({ status: "RECEIVED" });

    const r = await rodarLembretesPix(AGORA);

    expect(estado.enfileirados).toEqual([]);
    expect(r.pulados).toMatchObject({ nao_esta_mais_pendente: 1 });
  });

  it("4. lerPagamento lancando: nao envia, conta falha e segue nas outras linhas", async () => {
    estado.env.pixRemindersEnabled = true;
    estado.rows = [
      linha(),
      linha({ id: "row-2", user_id: "u2", provider_subscription_id: "pay_2" }),
    ];
    estado.pagamentos.pay_1 = new Error("asaas fora do ar");
    estado.pagamentos.pay_2 = pagamento();

    const r = await rodarLembretesPix(AGORA);

    expect(r.falhas).toBe(1);
    expect(r.enviados).toBe(1);
    expect(estado.enfileirados.map((e) => e.opcoes)).toEqual([
      { jobId: "pix-lembrete:row-2:p1" },
    ]);
  });

  it("5. quem ja e assinante ativo nao recebe, e a checagem e UMA consulta so", async () => {
    estado.env.pixRemindersEnabled = true;
    estado.rows = [
      linha(),
      linha({ id: "row-2", user_id: "u2", provider_subscription_id: "pay_2" }),
      linha({
        id: "row-ativa",
        user_id: "u1",
        provider: "stripe",
        payment_method: "card",
        status: "active",
      }),
    ];
    estado.pagamentos.pay_2 = pagamento();

    const r = await rodarLembretesPix(AGORA);

    expect(r.pulados).toMatchObject({ ja_assinante: 1 });
    expect(estado.enfileirados.map((e) => e.job.to)).toEqual([
      "u2@exemplo.com",
    ]);
    expect(estado.consultasDeAssinantes).toBe(1);
    // Assinante nem chega a consultar o Asaas.
    expect(estado.lidos).toEqual(["pay_2"]);
  });

  it("6. e-mail suprimido nao recebe", async () => {
    estado.env.pixRemindersEnabled = true;
    estado.rows = [linha()];
    estado.suprimidos = new Set(["u1@exemplo.com"]);
    estado.emailsDosUsuarios = { u1: "U1@Exemplo.com" };

    const r = await rodarLembretesPix(AGORA);

    expect(estado.enfileirados).toEqual([]);
    expect(r.pulados).toMatchObject({ suprimido: 1 });
  });

  it("7. estagio ja em pix_reminders_sent nao reenvia", async () => {
    estado.env.pixRemindersEnabled = true;
    estado.rows = [linha({ pix_reminders_sent: ["p1"] })];

    const r = await rodarLembretesPix(AGORA);

    expect(estado.enfileirados).toEqual([]);
    expect(r.pulados).toMatchObject({ ja_enviado: 1 });
  });

  it("8. backfill grava as colunas quando nulas, decide com o valor lido, e nao grava quando ja preenchidas", async () => {
    estado.env.pixRemindersEnabled = true;
    estado.rows = [
      linha({ pix_due_date: null, pix_invoice_url: null }),
      linha({ id: "row-2", user_id: "u2", provider_subscription_id: "pay_2" }),
    ];
    estado.pagamentos.pay_2 = pagamento({
      invoiceUrl: "https://www.asaas.com/i/pay2",
    });

    const r = await rodarLembretesPix(AGORA);

    expect(backfillsGravados()).toEqual([
      {
        patch: {
          pix_due_date: "2026-09-10",
          pix_invoice_url: "https://www.asaas.com/i/pay1",
        },
        id: "row-1",
      },
    ]);
    expect(r.backfills).toBe(1);
    // A linha sem vencimento no banco foi decidida com o valor lido.
    expect(r.enviados).toBe(2);
  });

  it("8b. backfill falhando nao impede o envio, que usa o valor lido", async () => {
    estado.env.pixRemindersEnabled = true;
    estado.rows = [linha({ pix_due_date: null, pix_invoice_url: null })];
    estado.falhaUpdate = (patch) =>
      "pix_due_date" in patch ? { message: "coluna ausente" } : null;

    const r = await rodarLembretesPix(AGORA);

    expect(r.backfills).toBe(0);
    expect(r.enviados).toBe(1);
    expect(estado.enfileirados[0].job.dueDate).toBe("2026-09-10");
  });

  it("9. marcacao falhando grita duplicata_possivel e conta falha", async () => {
    estado.env.pixRemindersEnabled = true;
    estado.rows = [linha()];
    estado.falhaUpdate = (patch) =>
      "pix_reminders_sent" in patch ? { message: "statement timeout" } : null;

    const r = await rodarLembretesPix(AGORA);

    expect(estado.enfileirados).toHaveLength(1);
    expect(r.falhas).toBe(1);
    expect(r.enviados).toBe(0);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("duplicata_possivel"),
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("row-1"),
    );
  });

  it("10. o valor enfileirado e o do pagamento, nao o do plano", async () => {
    estado.env.pixRemindersEnabled = true;
    estado.rows = [linha({ plan_id: "plan-semestral" })];
    estado.pagamentos.pay_1 = pagamento({ valueCents: 1291 });

    await rodarLembretesPix(AGORA);

    expect(estado.enfileirados[0].job.amountCents).toBe(1291);
    expect(estado.enfileirados[0].job.planName).toBe("Semestral");
  });

  it("sem valor no pagamento nao envia: nao se inventa preco de cobranca", async () => {
    estado.env.pixRemindersEnabled = true;
    estado.rows = [linha()];
    estado.pagamentos.pay_1 = pagamento({ valueCents: null });

    const r = await rodarLembretesPix(AGORA);

    expect(estado.enfileirados).toEqual([]);
    expect(r.pulados).toMatchObject({ sem_valor: 1 });
  });

  it("sem cobranca amarrada nao consulta o Asaas", async () => {
    estado.env.pixRemindersEnabled = true;
    estado.rows = [linha({ provider_subscription_id: null })];

    const r = await rodarLembretesPix(AGORA);

    expect(estado.lidos).toEqual([]);
    expect(r.pulados).toMatchObject({ sem_cobranca: 1 });
  });

  it("assinantes consultados em blocos de 100: 250 ids viram 3 consultas, e o do terceiro bloco e reconhecido", async () => {
    estado.rows = [];
    for (let i = 0; i < 250; i++) {
      estado.rows.push(
        linha({
          id: `row-${i}`,
          user_id: `u${i}`,
          provider_subscription_id: `pay_${i}`,
        }),
      );
      estado.pagamentos[`pay_${i}`] = pagamento();
    }
    // Assinante ativo cujo id cai no TERCEIRO bloco (posicao 240 de 250).
    estado.rows.push(
      linha({
        id: "row-ativa",
        user_id: "u240",
        provider: "stripe",
        payment_method: "card",
        status: "active",
      }),
    );

    const r = await rodarLembretesPix(AGORA);

    expect(r.candidatos).toBe(250);
    expect(estado.consultasDeAssinantes).toBe(3);
    expect(estado.blocosDeAssinantes).toEqual([100, 100, 50]);
    expect(r.pulados).toMatchObject({ ja_assinante: 1 });
  });

  it("erro na consulta de QUALQUER bloco de assinantes derruba a rodada, antes de ler o Asaas", async () => {
    estado.env.pixRemindersEnabled = true;
    estado.rows = [];
    for (let i = 0; i < 250; i++) {
      estado.rows.push(
        linha({
          id: `row-${i}`,
          user_id: `u${i}`,
          provider_subscription_id: `pay_${i}`,
        }),
      );
      estado.pagamentos[`pay_${i}`] = pagamento();
    }
    // Os dois primeiros blocos respondem; o terceiro falha.
    estado.falhaAssinantesNoBloco = 2;

    await expect(rodarLembretesPix(AGORA)).rejects.toThrow(
      "leitura de assinantes falhou",
    );
    expect(estado.lidos).toEqual([]);
    expect(estado.enfileirados).toEqual([]);
  });

  it("fora da janela: conta candidatos, pula todos por horario e nao le Asaas, supressao nem assinantes", async () => {
    estado.env.pixRemindersEnabled = true;
    estado.rows = [
      linha(),
      linha({
        id: "row-2",
        user_id: "u2",
        provider_subscription_id: "pay_2",
        pix_due_date: null,
        pix_invoice_url: null,
      }),
    ];
    estado.pagamentos.pay_2 = pagamento();

    // 03h de 09/09 em Brasilia: fora da janela de 09h a 21h.
    const r = await rodarLembretesPix(
      new Date(Date.parse("2026-09-09T03:00:00-03:00")),
    );

    expect(r.candidatos).toBe(2);
    expect(r.pulados).toEqual({ fora_do_horario: 2 });
    expect(estado.lidos).toEqual([]);
    expect(estado.leiturasDeSupressao).toBe(0);
    expect(estado.consultasDeAssinantes).toBe(0);
    // Nem backfill: a linha sem vencimento continua sem ele.
    expect(estado.updates).toEqual([]);
    expect(estado.enfileirados).toEqual([]);
  });

  it("sem candidatos nao le supressao nem assinantes", async () => {
    const r = await rodarLembretesPix(AGORA);

    expect(r.candidatos).toBe(0);
    expect(estado.consultasDeAssinantes).toBe(0);
    // O nome promete as duas coisas; ate o lote 3b so a segunda era afirmada.
    expect(estado.leiturasDeSupressao).toBe(0);
  });
});
