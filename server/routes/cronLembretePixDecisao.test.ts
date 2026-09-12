import { afterAll, describe, expect, it, vi } from "vitest";

/**
 * QUAL LEMBRETE DE PIX PENDENTE SAI AGORA, se algum.
 *
 * A decisao e pura e depende de relogio, entao cada caso roda nos dois fusos
 * (UTC, o do container em producao, e America/Sao_Paulo, o global do
 * vitest.config.ts) e a troca e conferida pelo `getTimezoneOffset`. A regra e
 * sempre em Brasilia, nunca no fuso do processo.
 *
 * Os instantes sao escritos a mao com offset explicito `-03:00`: o `Date.parse`
 * de uma string com offset nao depende do fuso de quem roda.
 */

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
vi.mock("../lib/queue", () => ({
  emailQueue: null,
  createEmailWorker: vi.fn(),
  enqueueEmail: vi.fn(),
}));
vi.mock("@sentry/node", () => ({
  captureMessage: () => {},
  captureException: () => {},
  withScope: (fn: (scope: unknown) => void) => fn({ setContext() {} }),
}));
vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => {
      throw new Error("a decisao e pura e nao le o banco");
    },
  },
}));

import { relogioDeBrasilia } from "../lib/pixVencimento";
import { decidirLembretePix } from "./cron";

const TZ_ORIGINAL = process.env.TZ;

afterAll(() => {
  process.env.TZ = TZ_ORIGINAL;
});

const FUSOS: Array<[string, number]> = [
  ["UTC", 0],
  ["America/Sao_Paulo", 180],
];

/** Roda o bloco nos dois fusos, conferindo que a troca pegou. */
function nosDoisFusos(bloco: () => void) {
  for (const [tz, offset] of FUSOS) {
    process.env.TZ = tz;
    expect(new Date("2026-09-10T12:00:00Z").getTimezoneOffset()).toBe(offset);
    bloco();
  }
}

/** Instante de Brasilia escrito a mao, `YYYY-MM-DDTHH:MM:SS`. */
function brt(local: string): number {
  return Date.parse(`${local}-03:00`);
}

const BASE = {
  criadaEmIso: "2026-09-08T13:00:00-03:00",
  pixDueDate: "2026-09-10" as string | null,
  jaEnviados: [] as string[],
};

function decide(over: Partial<typeof BASE> & { agora: string }) {
  const { agora, ...resto } = over;
  return decidirLembretePix({ ...BASE, ...resto, agoraMs: brt(agora) });
}

describe("decidirLembretePix: os sete ramos, na ordem", () => {
  it("1. sem vencimento, ou vencimento ilegivel: pula", () => {
    nosDoisFusos(() => {
      for (const pixDueDate of [null, "10/09/2026", "2026-02-30", ""]) {
        expect(decide({ pixDueDate, agora: "2026-09-09T15:00:00" })).toEqual(
          { tipo: "pular", motivo: "sem_vencimento" },
        );
      }
    });
  });

  it("2. fora da janela de 09h a 21h de Brasilia: pula", () => {
    nosDoisFusos(() => {
      for (const agora of [
        "2026-09-09T08:59:00",
        "2026-09-09T21:00:00",
        "2026-09-09T03:00:00",
      ]) {
        expect(decide({ agora })).toEqual({
          tipo: "pular",
          motivo: "fora_do_horario",
        });
      }
    });
  });

  it("3. hoje em Brasilia depois do vencimento: pula", () => {
    nosDoisFusos(() => {
      expect(decide({ agora: "2026-09-11T10:00:00" })).toEqual({
        tipo: "pular",
        motivo: "vencida",
      });
    });
  });

  it("4. hoje e o dia do vencimento: p0, e p0 ja enviado pula", () => {
    nosDoisFusos(() => {
      expect(decide({ agora: "2026-09-10T10:00:00" })).toEqual({
        tipo: "enviar",
        estagio: "p0",
        variant: "vence_hoje",
      });
      // Ter recebido o p1 nao impede o p0.
      expect(
        decide({ agora: "2026-09-10T10:00:00", jaEnviados: ["p1"] }),
      ).toEqual({ tipo: "enviar", estagio: "p0", variant: "vence_hoje" });
      expect(
        decide({ agora: "2026-09-10T10:00:00", jaEnviados: ["p0"] }),
      ).toEqual({ tipo: "pular", motivo: "ja_enviado" });
    });
  });

  it("5. menos de 2 horas de vida: pula, e com 2 horas passa", () => {
    nosDoisFusos(() => {
      const criadaEmIso = "2026-09-09T09:30:00-03:00";
      expect(decide({ criadaEmIso, agora: "2026-09-09T11:29:00" })).toEqual({
        tipo: "pular",
        motivo: "muito_recente",
      });
      expect(decide({ criadaEmIso, agora: "2026-09-09T11:31:00" })).toEqual({
        tipo: "enviar",
        estagio: "p1",
        variant: "aberto",
      });
    });
  });

  it("6. p1 ja enviado: pula", () => {
    nosDoisFusos(() => {
      expect(
        decide({ agora: "2026-09-09T15:00:00", jaEnviados: ["p1"] }),
      ).toEqual({ tipo: "pular", motivo: "ja_enviado" });
    });
  });

  it("7. caso contrario: p1, variante aberto", () => {
    nosDoisFusos(() => {
      expect(decide({ agora: "2026-09-09T15:00:00" })).toEqual({
        tipo: "enviar",
        estagio: "p1",
        variant: "aberto",
      });
    });
  });
});

describe("decidirLembretePix: as bordas", () => {
  it("virada de dia: 00h30 de 09/09 em Brasilia e dia 09, e nao dispara p0 do dia 10", () => {
    nosDoisFusos(() => {
      const agora = brt("2026-09-09T00:30:00");
      expect(relogioDeBrasilia(agora).dia).toBe("2026-09-09");
      const d = decidirLembretePix({
        criadaEmIso: "2026-09-08T23:00:00-03:00",
        pixDueDate: "2026-09-10",
        jaEnviados: [],
        agoraMs: agora,
      });
      expect(d).not.toMatchObject({ estagio: "p0" });
      expect(d).toEqual({ tipo: "pular", motivo: "fora_do_horario" });
    });
  });

  it("o caso das 21h: 20h59 envia, 21h01 pula por horario", () => {
    nosDoisFusos(() => {
      expect(decide({ agora: "2026-09-09T20:59:00" })).toEqual({
        tipo: "enviar",
        estagio: "p1",
        variant: "aberto",
      });
      expect(decide({ agora: "2026-09-09T21:01:00" })).toEqual({
        tipo: "pular",
        motivo: "fora_do_horario",
      });
      expect(decide({ agora: "2026-09-09T09:00:00" })).toEqual({
        tipo: "enviar",
        estagio: "p1",
        variant: "aberto",
      });
    });
  });

  it("linha criada no proprio dia do vencimento recebe p0 e nunca p1", () => {
    nosDoisFusos(() => {
      const criadaEmIso = "2026-09-10T09:10:00-03:00";
      // Dez minutos de vida: o p0 tem prioridade sobre a idade minima.
      expect(decide({ criadaEmIso, agora: "2026-09-10T09:20:00" })).toEqual({
        tipo: "enviar",
        estagio: "p0",
        variant: "vence_hoje",
      });
      expect(
        decide({
          criadaEmIso,
          agora: "2026-09-10T15:00:00",
          jaEnviados: ["p0"],
        }),
      ).toEqual({ tipo: "pular", motivo: "ja_enviado" });
    });
  });

  it("data de criacao ilegivel nao vira envio", () => {
    nosDoisFusos(() => {
      expect(
        decide({ criadaEmIso: "ontem", agora: "2026-09-09T15:00:00" }),
      ).toEqual({ tipo: "pular", motivo: "criacao_ilegivel" });
    });
  });
});
