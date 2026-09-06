import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * QUEM RECEBE LEMBRETE DE RENOVACAO, E QUAL.
 *
 * Ate 2026-09-06 o lembrete excluia o Asaas por provedor, porque
 * `POST /api/billing/renew` tinha Stripe e boleto fixos em duro. Com o
 * despacho por provedor (lote 2b, commit 3) a exclusao caiu: quem renova e
 * quem tem `renewal_type='manual'`, seja boleto ou Pix. Este arquivo tambem
 * trava a regua por plano (o mensal entrou) e o dia zero ("seu Pro terminou").
 *
 * O dube APLICA os filtros. Um que so registrasse a query provaria a intencao,
 * nao quais linhas ela pega, e "quais linhas" e a pergunta perigosa: larga
 * demais manda e-mail errado, estreita demais deixa assinante sem aviso.
 */

const estado = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  plans: [] as Array<Record<string, unknown>>,
  updates: [] as Array<{ patch: Record<string, unknown>; id: unknown }>,
  emails: [] as Array<Record<string, unknown>>,
  notificacoes: [] as Array<Record<string, unknown>>,
  notificacaoErro: null as Error | null,
  capturas: [] as Array<{ mensagem: string; opcoes: Record<string, unknown> }>,
}));

vi.mock("../lib/redis", () => ({
  queueConnection: null,
  cacheConnection: null,
}));
vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    supabaseServiceRoleKey: "service",
    appPublicUrl: "https://exemplo.com",
    isProd: false,
    devProUserIds: [],
    stripePriceIds: { pro_monthly: "p", pro_semiannual: "p", pro_annual: "p" },
    stripeSecretKey: "sk_test_x",
    stripeWebhookSecret: "whsec_x",
    billingEnabled: false,
    asaasEnabled: false,
    cronSecret: "s",
    posthogApiKey: "",
    posthogProjectId: "",
    posthogHost: "https://us.posthog.com",
    rateLimitMaxRequests: 1000,
    refundMaxPerMinute: 100,
  },
}));
vi.mock("../lib/openai", () => ({ getOpenAI: () => ({}), openai: {} }));
vi.mock("../lib/aiEnrich", () => ({ enrichNews: vi.fn() }));
vi.mock("../lib/stripeClient", () => ({
  getStripe: () => {
    throw new Error("este teste nao chama a Stripe");
  },
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));
vi.mock("../lib/renewalToken", () => ({
  issueRenewalToken: () => "tok",
  verifyRenewalToken: () => ({ status: "invalid" }),
}));
vi.mock("../lib/queue", () => ({
  emailQueue: null,
  createEmailWorker: vi.fn(),
  enqueueEmail: async (job: Record<string, unknown>) => {
    estado.emails.push(job);
  },
}));
vi.mock("../lib/targetedNotifications", () => ({
  createTargetedNotification: async (params: Record<string, unknown>) => {
    if (estado.notificacaoErro) throw estado.notificacaoErro;
    estado.notificacoes.push(params);
  },
}));
vi.mock("@sentry/node", () => ({
  captureMessage: (mensagem: string, opcoes: Record<string, unknown>) => {
    estado.capturas.push({ mensagem, opcoes });
  },
  captureException: () => {},
  withScope: (fn: (scope: unknown) => void) => fn({ setContext() {} }),
}));

vi.mock("../lib/supabaseAdmin", () => {
  function consulta(tabela: string) {
    const iguais: Record<string, unknown> = {};
    const diferentes: Record<string, unknown> = {};
    const dentro: Record<string, unknown[]> = {};
    let maiorQue: { coluna: string; valor: string } | null = null;
    let menorIgual: { coluna: string; valor: string } | null = null;
    let patch: Record<string, unknown> | null = null;

    const casa = (row: Record<string, unknown>) =>
      Object.entries(iguais).every(([c, v]) => row[c] === v) &&
      Object.entries(diferentes).every(([c, v]) => row[c] !== v) &&
      Object.entries(dentro).every(([c, vs]) => vs.includes(row[c])) &&
      (maiorQue === null ||
        (typeof row[maiorQue.coluna] === "string" &&
          String(row[maiorQue.coluna]) > maiorQue.valor)) &&
      (menorIgual === null ||
        (typeof row[menorIgual.coluna] === "string" &&
          String(row[menorIgual.coluna]) <= menorIgual.valor));

    const q: Record<string, unknown> = {};
    q.select = () => q;
    q.order = () => q;
    q.eq = (coluna: string, valor: unknown) => {
      iguais[coluna] = valor;
      return q;
    };
    q.neq = (coluna: string, valor: unknown) => {
      diferentes[coluna] = valor;
      return q;
    };
    q.in = (coluna: string, valores: unknown[]) => {
      dentro[coluna] = valores;
      return q;
    };
    q.gt = (coluna: string, valor: string) => {
      maiorQue = { coluna, valor };
      return q;
    };
    q.lte = (coluna: string, valor: string) => {
      menorIgual = { coluna, valor };
      return q;
    };
    q.update = (p: Record<string, unknown>) => {
      patch = p;
      return q;
    };
    // Fatia de verdade: o coletor pagina ate a primeira pagina VAZIA, e um
    // duble que devolvesse tudo em toda pagina nunca terminaria.
    q.range = async (from: number, to: number) => ({
      data: estado.rows.filter(casa).slice(from, to + 1),
      error: null,
    });
    q.then = (ok: (v: unknown) => unknown) =>
      Promise.resolve()
        .then(() => {
          if (tabela === "plans") return { data: estado.plans, error: null };
          if (patch) {
            for (const r of estado.rows.filter(casa)) Object.assign(r, patch);
            estado.updates.push({ patch: patch!, id: iguais.id });
            return { data: null, error: null };
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
          getUserById: async (id: string) => ({
            data: {
              user: {
                email: `${id}@exemplo.com`,
                user_metadata: { name: "Pessoa" },
              },
            },
            error: null,
          }),
        },
      },
    },
  };
});

import {
  decidirLembrete,
  RENEWAL_MILESTONES,
  rodarLembretesDeRenovacao,
  selecionarAssinaturasAVencer,
  selecionarAssinaturasRecemVencidas,
} from "./cron";

const AGORA = "2026-09-01T00:00:00.000Z";
const JANELA = "2026-10-02T00:00:00.000Z";
const ONTEM = "2026-08-31T00:00:00.000Z";
/** Dentro da janela de lembrete. */
const VENCE_EM_BREVE = "2026-09-20T00:00:00.000Z";
const DIA_MS = 24 * 60 * 60 * 1000;

function linha(over: Record<string, unknown> = {}) {
  return {
    id: "sub-1",
    user_id: "u1",
    provider: "stripe",
    payment_method: "boleto",
    renewal_type: "manual",
    status: "active",
    current_period_end: VENCE_EM_BREVE,
    renewal_reminders_sent: [],
    plan_id: "plan-semestral",
    ...over,
  };
}

async function selecionadas() {
  const r = (await selecionarAssinaturasAVencer(0, 99, AGORA, JANELA)) as {
    data: Array<Record<string, unknown>>;
  };
  return r.data;
}

beforeEach(() => {
  estado.rows = [];
  estado.plans = [
    { id: "plan-mensal", code: "pro_monthly" },
    { id: "plan-semestral", code: "pro_semiannual" },
    { id: "plan-anual", code: "pro_annual" },
    { id: "plan-free", code: "free" },
  ];
  estado.updates = [];
  estado.emails = [];
  estado.notificacoes = [];
  estado.notificacaoErro = null;
  estado.capturas = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("assinante Pix PASSA a receber lembrete: a exclusao por provedor caiu", () => {
  it("linha Pix ativa dentro da janela e selecionada", async () => {
    estado.rows = [
      linha({ id: "pix", provider: "asaas", payment_method: "pix" }),
    ];
    expect((await selecionadas()).map((r) => r.id)).toEqual(["pix"]);
  });

  it("boleto e Pix saem juntos", async () => {
    estado.rows = [
      linha({ id: "pix", provider: "asaas", payment_method: "pix" }),
      linha({ id: "boleto", provider: "stripe", payment_method: "boleto" }),
    ];
    expect((await selecionadas()).map((r) => r.id)).toEqual(["pix", "boleto"]);
  });
});

describe("os demais filtros continuam valendo", () => {
  it("cartao (renewal_type auto) nunca entrou e continua fora", async () => {
    estado.rows = [linha({ id: "cartao", renewal_type: "auto" })];
    expect(await selecionadas()).toEqual([]);
  });

  it("assinatura ja cancelada fica fora da janela de A VENCER", async () => {
    estado.rows = [linha({ id: "morta", status: "canceled" })];
    expect(await selecionadas()).toEqual([]);
  });

  it("vencimento fora da janela fica fora, dos dois lados", async () => {
    estado.rows = [
      linha({
        id: "ja-venceu",
        current_period_end: "2026-08-01T00:00:00.000Z",
      }),
      linha({ id: "longe", current_period_end: "2027-01-01T00:00:00.000Z" }),
    ];
    expect(await selecionadas()).toEqual([]);
  });
});

describe("dia zero: quem venceu nas ultimas 24 horas", () => {
  async function recemVencidas() {
    const r = (await selecionarAssinaturasRecemVencidas(
      0,
      99,
      ONTEM,
      AGORA,
    )) as {
      data: Array<Record<string, unknown>>;
    };
    return r.data;
  }

  it("vencida ha 6 horas e ja marcada canceled pelo cron de expiracao: entra", async () => {
    estado.rows = [
      linha({
        id: "venceu-hoje",
        status: "canceled",
        current_period_end: "2026-08-31T18:00:00.000Z",
      }),
    ];
    expect((await recemVencidas()).map((r) => r.id)).toEqual(["venceu-hoje"]);
  });

  it("vencida ha 6 horas ainda active (cron nao passou): entra tambem", async () => {
    estado.rows = [
      linha({
        id: "ativa-vencida",
        current_period_end: "2026-08-31T18:00:00.000Z",
      }),
    ];
    expect((await recemVencidas()).map((r) => r.id)).toEqual(["ativa-vencida"]);
  });

  it("vencida ha 3 dias fica fora: o dia zero nao e retroativo", async () => {
    estado.rows = [
      linha({
        id: "velha",
        status: "canceled",
        current_period_end: "2026-08-29T00:00:00.000Z",
      }),
    ];
    expect(await recemVencidas()).toEqual([]);
  });

  it("cartao e superseded ficam fora", async () => {
    estado.rows = [
      linha({
        id: "cartao",
        renewal_type: "auto",
        current_period_end: "2026-08-31T18:00:00.000Z",
      }),
      linha({
        id: "renovada",
        status: "superseded",
        current_period_end: "2026-08-31T18:00:00.000Z",
      }),
    ];
    expect(await recemVencidas()).toEqual([]);
  });
});

describe("a regua por plano", () => {
  it("o mensal tem marcos D-7, D-3 e D-1", () => {
    expect(RENEWAL_MILESTONES.pro_monthly).toEqual([7, 3, 1]);
  });

  it("semestral e anual continuam como eram", () => {
    expect(RENEWAL_MILESTONES.pro_semiannual).toEqual([15, 7, 1]);
    expect(RENEWAL_MILESTONES.pro_annual).toEqual([30, 7, 1]);
  });
});

describe("decidirLembrete: o marco de cada assinatura, hoje", () => {
  const agoraMs = Date.parse(AGORA);
  const vence = (dias: number) =>
    new Date(agoraMs + dias * DIA_MS).toISOString();

  it("mensal a 7 dias do fim: lembrete d7", () => {
    expect(
      decidirLembrete({
        planCode: "pro_monthly",
        currentPeriodEnd: vence(7),
        alreadySent: [],
        nowMs: agoraMs,
      }),
    ).toEqual({ tipo: "lembrete", codigo: "d7", daysRemaining: 7 });
  });

  it("mensal a 2 dias do fim: cai no marco d3", () => {
    expect(
      decidirLembrete({
        planCode: "pro_monthly",
        currentPeriodEnd: vence(2),
        alreadySent: [],
        nowMs: agoraMs,
      }),
    ).toMatchObject({ tipo: "lembrete", codigo: "d3", daysRemaining: 2 });
  });

  it("marco ja enviado: pula", () => {
    expect(
      decidirLembrete({
        planCode: "pro_monthly",
        currentPeriodEnd: vence(7),
        alreadySent: ["d7"],
        nowMs: agoraMs,
      }),
    ).toEqual({ tipo: "pular", motivo: "ja_enviado" });
  });

  it("venceu ha 6 horas: dia zero, uma vez", () => {
    expect(
      decidirLembrete({
        planCode: "pro_annual",
        currentPeriodEnd: vence(-0.25),
        alreadySent: [],
        nowMs: agoraMs,
      }),
    ).toEqual({ tipo: "termino", codigo: "d0" });
    expect(
      decidirLembrete({
        planCode: "pro_annual",
        currentPeriodEnd: vence(-0.25),
        alreadySent: ["d1", "d0"],
        nowMs: agoraMs,
      }),
    ).toEqual({ tipo: "pular", motivo: "ja_enviado" });
  });

  it("venceu ha 2 dias: nem lembrete nem dia zero", () => {
    expect(
      decidirLembrete({
        planCode: "pro_annual",
        currentPeriodEnd: vence(-2),
        alreadySent: [],
        nowMs: agoraMs,
      }),
    ).toEqual({ tipo: "pular", motivo: "fora_da_janela" });
  });

  it("plano sem regua: pula NOMEANDO a ausencia, para virar aviso", () => {
    expect(
      decidirLembrete({
        planCode: "free",
        currentPeriodEnd: vence(7),
        alreadySent: [],
        nowMs: agoraMs,
      }),
    ).toEqual({ tipo: "pular", motivo: "sem_marcos" });
  });

  it("longe do primeiro marco: fora da janela", () => {
    expect(
      decidirLembrete({
        planCode: "pro_monthly",
        currentPeriodEnd: vence(20),
        alreadySent: [],
        nowMs: agoraMs,
      }),
    ).toEqual({ tipo: "pular", motivo: "fora_da_janela" });
  });
});

describe("a rodada inteira: quem recebe o que", () => {
  const agora = new Date(AGORA);
  const vence = (dias: number) =>
    new Date(agora.getTime() + dias * DIA_MS).toISOString();

  it("mensal boleto em D-7 recebe o lembrete, marcado como d7, com o metodo da renovacao", async () => {
    estado.rows = [
      linha({ id: "m", plan_id: "plan-mensal", current_period_end: vence(7) }),
    ];

    const r = await rodarLembretesDeRenovacao(agora);

    expect(r).toMatchObject({ sent: 1, failed: 0 });
    expect(estado.emails).toHaveLength(1);
    expect(estado.emails[0]).toMatchObject({
      type: "renewal_reminder",
      to: "u1@exemplo.com",
      planName: "Mensal",
      daysRemaining: 7,
      renewUrl: "https://exemplo.com/renovar?t=tok",
      // Boleto nao e permitido no mensal: a renovacao vai ser por Pix, e o
      // e-mail tem de dizer isso em vez de mandar gerar boleto.
      paymentMethod: "pix",
    });
    expect(estado.updates).toEqual([
      { patch: { renewal_reminders_sent: ["d7"] }, id: "m" },
    ]);
  });

  it("asaas pix em D-1 recebe o lembrete", async () => {
    estado.rows = [
      linha({
        id: "p",
        provider: "asaas",
        payment_method: "pix",
        plan_id: "plan-semestral",
        current_period_end: vence(1),
      }),
    ];

    await rodarLembretesDeRenovacao(agora);

    expect(estado.emails).toHaveLength(1);
    expect(estado.emails[0]).toMatchObject({
      type: "renewal_reminder",
      daysRemaining: 1,
      paymentMethod: "pix",
    });
    expect(estado.updates[0].patch).toEqual({ renewal_reminders_sent: ["d1"] });
  });

  it("D0 recebe o e-mail de TERMINO, nao o de 'vence hoje'", async () => {
    estado.rows = [
      linha({
        id: "z",
        status: "canceled",
        plan_id: "plan-anual",
        current_period_end: vence(-0.25),
        renewal_reminders_sent: ["d30", "d7", "d1"],
      }),
    ];

    await rodarLembretesDeRenovacao(agora);

    expect(estado.emails).toHaveLength(1);
    expect(estado.emails[0]).toMatchObject({
      type: "access_ended",
      planName: "Anual",
      renewUrl: "https://exemplo.com/renovar?t=tok",
    });
    expect(estado.emails.some((e) => e.type === "renewal_reminder")).toBe(
      false,
    );
    expect(estado.updates[0].patch).toEqual({
      renewal_reminders_sent: ["d30", "d7", "d1", "d0"],
    });
  });

  it("cada marco enviado cria a notificacao no site, tipo system, com o link", async () => {
    estado.rows = [
      linha({ id: "m", plan_id: "plan-mensal", current_period_end: vence(3) }),
      linha({
        id: "z",
        user_id: "u2",
        status: "canceled",
        plan_id: "plan-anual",
        current_period_end: vence(-0.25),
      }),
    ];

    await rodarLembretesDeRenovacao(agora);

    expect(estado.notificacoes).toHaveLength(2);
    expect(estado.notificacoes[0]).toMatchObject({
      email: "u1@exemplo.com",
      type: "system",
      title: "Seu Pro vence em 3 dias",
      ctaUrl: "https://exemplo.com/renovar?t=tok",
    });
    expect(estado.notificacoes[1]).toMatchObject({
      email: "u2@exemplo.com",
      type: "system",
      title: "Seu Pro terminou",
    });
  });

  it("notificacao falhando NAO derruba a rodada: o e-mail ja saiu e o marco fica marcado", async () => {
    estado.rows = [
      linha({ id: "m", plan_id: "plan-mensal", current_period_end: vence(7) }),
    ];
    estado.notificacaoErro = new Error("banco fora");

    const r = await rodarLembretesDeRenovacao(agora);

    expect(estado.emails).toHaveLength(1);
    expect(estado.updates).toHaveLength(1);
    expect(r).toMatchObject({ sent: 1, failed: 0, notificationFailures: 1 });
  });

  it("plano sem regua gera UM aviso no Sentry por rodada, com os codigos", async () => {
    estado.rows = [
      linha({ id: "f1", plan_id: "plan-free", current_period_end: vence(7) }),
      linha({
        id: "f2",
        user_id: "u2",
        plan_id: "plan-free",
        current_period_end: vence(3),
      }),
    ];

    const r = await rodarLembretesDeRenovacao(agora);

    expect(estado.emails).toEqual([]);
    expect(r).toMatchObject({ skipped: 2 });
    const avisos = estado.capturas.filter(
      (c) => c.mensagem === "renewal_milestones_ausentes",
    );
    expect(avisos).toHaveLength(1);
    expect(avisos[0].opcoes).toMatchObject({
      level: "warning",
      extra: { plan_codes: ["free"] },
    });
  });

  it("marco ja enviado nao reenvia", async () => {
    estado.rows = [
      linha({
        id: "m",
        plan_id: "plan-mensal",
        current_period_end: vence(7),
        renewal_reminders_sent: ["d7"],
      }),
    ];

    const r = await rodarLembretesDeRenovacao(agora);

    expect(estado.emails).toEqual([]);
    expect(r).toMatchObject({ sent: 0, skipped: 1 });
  });
});
