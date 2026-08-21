import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * EXPIRAÇÃO DE BOLETO PAGO E VENCIDO.
 *
 * O buraco que ela fecha: para `renewal_type='manual'` nenhum dos quatro
 * caminhos que escrevem `canceled_at` funciona (não há subscription na Stripe,
 * `process-cancellations` filtra uma flag que o boleto não seta, e o reconcile
 * exclui boleto de propósito). O `expire-pending-boletos` cobre o NÃO pago; o
 * pago que venceu ficava `active` com período expirado para sempre, contaminando
 * toda contagem que filtra `status='active'` — MRR incluído.
 *
 * O dublê aqui APLICA `eq` e `lt`. Um que só registrasse os filtros provaria a
 * intenção da query, não quais linhas ela pega — e "quais linhas" é exatamente a
 * pergunta perigosa, porque uma condição larga demais derrubaria assinatura viva.
 */

const estado = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  updates: [] as Array<{
    patch: Record<string, unknown>;
    filtros: Record<string, unknown>;
  }>,
  updateError: null as { message: string } | null,
  maxRows: null as number | null,
}));

vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from(table: string) {
      if (table !== "subscriptions") {
        throw new Error(`tabela inesperada no teste: ${table}`);
      }
      const filtros: Record<string, unknown> = {};
      const menores: Array<{ coluna: string; valor: string }> = [];
      let patch: Record<string, unknown> | null = null;
      let rangeFrom: number | null = null;
      let rangeTo: number | null = null;

      const casa = (row: Record<string, unknown>) =>
        Object.entries(filtros).every(([c, v]) => row[c] === v) &&
        menores.every(({ coluna, valor }) => {
          const atual = row[coluna];
          // NULL nunca casa `lt` — é o que o Postgres faz, e é o que protege
          // assinatura sem data de fim.
          return typeof atual === "string" && atual < valor;
        });

      const q: Record<string, unknown> = {};
      q.select = () => q;
      q.update = (p: Record<string, unknown>) => {
        patch = p;
        return q;
      };
      q.eq = (coluna: string, valor: unknown) => {
        filtros[coluna] = valor;
        return q;
      };
      q.lt = (coluna: string, valor: string) => {
        menores.push({ coluna, valor });
        return q;
      };
      q.order = () => q;
      q.range = (from: number, to: number) => {
        rangeFrom = from;
        rangeTo = to;
        return q;
      };
      q.then = (ok: (v: unknown) => unknown, ko: (e: unknown) => unknown) =>
        Promise.resolve()
          .then(() => {
            if (patch) {
              if (estado.updateError) {
                return { data: null, error: estado.updateError };
              }
              const alvos = estado.rows.filter(casa);
              estado.updates.push({ patch: patch!, filtros: { ...filtros } });
              for (const r of alvos) Object.assign(r, patch);
              return { data: null, error: null };
            }
            let out = estado.rows.filter(casa);
            if (rangeFrom !== null && rangeTo !== null) {
              out = out.slice(rangeFrom, rangeTo + 1);
            }
            if (estado.maxRows !== null && out.length > estado.maxRows) {
              out = out.slice(0, estado.maxRows);
            }
            return { data: out, error: null };
          })
          .then(ok, ko);
      return q;
    },
  },
}));
vi.mock("../lib/queue", () => ({
  emailQueue: null,
  enqueueEmail: vi.fn(),
  createEmailWorker: vi.fn(),
}));
vi.mock("../lib/redis", () => ({
  queueConnection: null,
  cacheConnection: null,
}));
vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    supabaseAnonKey: "anon",
    supabaseServiceRoleKey: "service",
    isProd: false,
    devProUserIds: [],
    stripePriceIds: { pro_monthly: "p", pro_semiannual: "p", pro_annual: "p" },
    stripeWebhookSecret: "whsec_x",
    appUrl: "https://exemplo.com",
    stripeSecretKey: "sk_test_x",
    billingEnabled: false,
    cronSecret: "s",
    posthogApiKey: "",
    posthogProjectId: "",
    posthogHost: "https://us.posthog.com",
    rateLimitMaxRequests: 1000,
    refundMaxPerMinute: 100,
  },
}));
// cron.ts arrasta o modulo de IA no import; mocado so para o arquivo carregar.
vi.mock("../lib/openai", () => ({ getOpenAI: () => ({}), openai: {} }));
vi.mock("../lib/aiEnrich", () => ({ enrichNews: vi.fn() }));
vi.mock("../lib/stripeClient", () => ({
  getStripe: () => {
    throw new Error("a expiração de boleto NÃO pode chamar a Stripe");
  },
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));

import { expirarBoletosVencidos } from "./cron";

const ONTEM = new Date(Date.now() - 24 * 3600_000).toISOString();
const DAQUI_A_UM_ANO = new Date(Date.now() + 365 * 24 * 3600_000).toISOString();

function linha(over: Record<string, unknown> = {}) {
  return {
    id: "sub-row-1",
    user_id: "u1",
    status: "active",
    renewal_type: "manual",
    current_period_end: ONTEM,
    ...over,
  };
}

beforeEach(() => {
  estado.rows = [];
  estado.updates = [];
  estado.updateError = null;
  estado.maxRows = null;
});

describe("quais linhas a condição pega", () => {
  it("boleto PAGO e VENCIDO expira", async () => {
    estado.rows = [linha()];

    const r = await expirarBoletosVencidos();

    expect(r.processed).toBe(1);
    expect(r.expired).toBe(1);
    expect(estado.rows[0].status).toBe("canceled");
    expect(estado.rows[0].canceled_at).toBeTruthy();
  });

  it("boleto PAGO e VIGENTE não é tocado", async () => {
    // A trava da condição: período no futuro é cliente ativo de verdade.
    estado.rows = [linha({ current_period_end: DAQUI_A_UM_ANO })];

    const r = await expirarBoletosVencidos();

    expect(r.processed).toBe(0);
    expect(estado.rows[0].status).toBe("active");
  });

  it("boleto PENDENTE segue com o caminho antigo, intocado", async () => {
    // `expire-pending-boletos` é quem trata o não pago. Pegar `pending` aqui
    // duplicaria a decisão em dois jobs.
    estado.rows = [linha({ status: "pending", current_period_end: ONTEM })];

    const r = await expirarBoletosVencidos();

    expect(r.processed).toBe(0);
    expect(estado.rows[0].status).toBe("pending");
  });

  it("CARTÃO vencido não é tocado: quem cuida dele é o reconcile", async () => {
    estado.rows = [linha({ renewal_type: "auto" })];

    const r = await expirarBoletosVencidos();

    expect(r.processed).toBe(0);
    expect(estado.rows[0].status).toBe("active");
  });

  it("assinatura SEM data de fim nunca entra", async () => {
    // `current_period_end` nulo dá Pro indefinidamente por is_user_pro, e `lt`
    // não casa NULL. Se casasse, este job cortaria acesso legítimo.
    estado.rows = [linha({ current_period_end: null })];

    const r = await expirarBoletosVencidos();

    expect(r.processed).toBe(0);
    expect(estado.rows[0].status).toBe("active");
  });

  it("mistura realista: só o alvo muda", async () => {
    estado.rows = [
      linha({ id: "alvo" }),
      linha({ id: "vigente", current_period_end: DAQUI_A_UM_ANO }),
      linha({ id: "pendente", status: "pending" }),
      linha({ id: "cartao", renewal_type: "auto" }),
      linha({ id: "sem-fim", current_period_end: null }),
    ];

    const r = await expirarBoletosVencidos();

    expect(r.expired).toBe(1);
    const porId = Object.fromEntries(estado.rows.map((x) => [x.id, x.status]));
    expect(porId).toEqual({
      alvo: "canceled",
      vigente: "active",
      pendente: "pending",
      cartao: "active",
      "sem-fim": "active",
    });
  });
});

describe("o que ela escreve", () => {
  it("grava canceled_at e NÃO cria linha de cancelamento", async () => {
    // A ausência do registro é a informação: cancelamento voluntário tem motivo,
    // vencimento não tem. Inventar um `reason_code` poluiria a aba Retenção.
    // O dublê lança em qualquer tabela que não seja `subscriptions`, então uma
    // escrita em subscription_cancellations derrubaria este teste.
    estado.rows = [linha()];

    await expirarBoletosVencidos();

    expect(estado.rows[0].canceled_at).toBeTruthy();
    expect(estado.rows[0].status).toBe("canceled");
  });

  it("o UPDATE é condicional em status='active' (idempotência)", async () => {
    estado.rows = [linha()];

    await expirarBoletosVencidos();

    expect(estado.updates).toHaveLength(1);
    expect(estado.updates[0].filtros).toMatchObject({ status: "active" });
  });

  it("NÃO chama a Stripe", async () => {
    // O mock de getStripe lança; se algum caminho a chamasse, o teste quebraria.
    estado.rows = [linha()];
    await expect(expirarBoletosVencidos()).resolves.toBeTruthy();
  });

  it("falha de UPDATE conta como failed, sem derrubar a rodada", async () => {
    estado.rows = [linha()];
    estado.updateError = { message: "timeout" };
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await expirarBoletosVencidos();

    expect(r.failed).toBe(1);
    expect(r.expired).toBe(0);
    expect(r.failures[0]).toMatchObject({ reason: "timeout" });
  });
});

describe("o lote tem teto e AVISA quando cortou", () => {
  it("processa no máximo o teto e sinaliza capAtingido", async () => {
    // 250 alvos contra um teto de 200. Corte silencioso reportaria sucesso sobre
    // uma superfície menor; `capAtingido` é o que impede isso.
    estado.rows = Array.from({ length: 250 }, (_, i) =>
      linha({ id: `s${String(i).padStart(4, "0")}` }),
    );

    const r = await expirarBoletosVencidos();

    expect(r.processed).toBe(200);
    expect(r.expired).toBe(200);
    expect(r.capAtingido).toBe(true);
  });

  it("abaixo do teto não sinaliza corte", async () => {
    estado.rows = Array.from({ length: 5 }, (_, i) => linha({ id: `s${i}` }));

    const r = await expirarBoletosVencidos();

    expect(r.processed).toBe(5);
    expect(r.capAtingido).toBe(false);
  });

  it("a leitura é PAGINADA: teto do servidor não encurta o lote", async () => {
    // Sem paginar, o servidor devolveria 100 por página e o job expiraria 100
    // achando que acabou.
    estado.rows = Array.from({ length: 150 }, (_, i) =>
      linha({ id: `s${String(i).padStart(4, "0")}` }),
    );
    estado.maxRows = 100;

    const r = await expirarBoletosVencidos();

    expect(r.processed).toBe(150);
    expect(r.capAtingido).toBe(false);
  });
});
