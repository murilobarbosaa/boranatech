import { describe, expect, it, vi } from "vitest";

/**
 * Supressao de REALERTA do watchdog de campanha travada.
 *
 * O cron roda de 5 em 5 minutos e alertava a cada tick enquanto a campanha
 * continuasse travada: o NODE-EXPRESS-G nasceu com 2 eventos em 5 minutos para
 * a MESMA campanha (dde0e763), e teria seguido assim ate alguem destravar.
 *
 * A regra que nao pode ser quebrada e que a dedup NAO PODE ESCONDER campanha que
 * continua travada. Dai as tres propriedades que os testes abaixo afirmam, nesta
 * ordem de importancia:
 *
 *   1. FAIL-OPEN. Qualquer defeito na propria supressao ALERTA. Alerta repetido
 *      incomoda; alerta suprimido por bug desaparece, e um watchdog silencioso e
 *      pior que watchdog nenhum, porque parece que esta tudo bem.
 *   2. Campanha NOVA alerta na hora, mesmo com outra suprimida.
 *   3. Passada a janela, a MESMA campanha volta a alertar.
 *
 * Estado em memoria de proposito: restart do Railway zera o mapa e realerta, o
 * que e fail-open por construcao. Tabela ou Redis para isto seria estado duravel
 * novo para economizar um evento por hora.
 */

/**
 * Mocks so para o MODULO CARREGAR. Nada aqui e exercitado: a funcao sob teste e
 * pura. `cron.ts` arrasta o modulo de IA no import (`enrichBacklog` ->
 * `aiEnrich` -> `new OpenAI()`), que lanca sem chave, e o job `qualidade` do CI
 * roda sem `.env` nenhum. Mesmo conjunto de dubles de cronBoletoExpiry.test.ts.
 */
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
vi.mock("../lib/supabaseAdmin", () => ({ supabaseAdmin: { from: vi.fn() } }));
vi.mock("../lib/queue", () => ({
  emailQueue: null,
  enqueueEmail: vi.fn(),
  createEmailWorker: vi.fn(),
}));
vi.mock("../lib/redis", () => ({
  queueConnection: null,
  cacheConnection: null,
}));
vi.mock("../lib/openai", () => ({ getOpenAI: () => ({}), openai: {} }));
vi.mock("../lib/aiEnrich", () => ({ enrichNews: vi.fn() }));
vi.mock("../lib/stripeClient", () => ({ getStripe: () => ({}) }));

import { deveAlertarCampanhaTravada, JANELA_REALERTA_MS } from "./cron";

const CAMPANHA = "dde0e763-716d-423a-a840-d2c23055ff8b";
const OUTRA = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const T0 = 1_760_000_000_000;

describe("deveAlertarCampanhaTravada", () => {
  it("alerta na primeira vez que ve a campanha", () => {
    const memoria = new Map<string, number>();
    expect(deveAlertarCampanhaTravada(CAMPANHA, T0, memoria)).toBe(true);
  });

  it("suprime o realerta do tick seguinte, dentro da janela", () => {
    const memoria = new Map<string, number>();
    deveAlertarCampanhaTravada(CAMPANHA, T0, memoria);

    // Proximo tick do cron: 5 minutos depois.
    expect(deveAlertarCampanhaTravada(CAMPANHA, T0 + 5 * 60_000, memoria)).toBe(
      false,
    );
  });

  it("volta a alertar depois da janela vencida", () => {
    const memoria = new Map<string, number>();
    deveAlertarCampanhaTravada(CAMPANHA, T0, memoria);

    expect(
      deveAlertarCampanhaTravada(CAMPANHA, T0 + JANELA_REALERTA_MS, memoria),
    ).toBe(true);
  });

  it("campanha NOVA alerta no mesmo tick em que outra esta suprimida", () => {
    const memoria = new Map<string, number>();
    deveAlertarCampanhaTravada(CAMPANHA, T0, memoria);

    const mesmoTick = T0 + 5 * 60_000;
    expect(deveAlertarCampanhaTravada(CAMPANHA, mesmoTick, memoria)).toBe(
      false,
    );
    expect(deveAlertarCampanhaTravada(OUTRA, mesmoTick, memoria)).toBe(true);
  });

  /**
   * CONTROLE NEGATIVO, e o mais importante do arquivo. Sem ele, uma supressao
   * que lancasse (ou que devolvesse false por engano num caminho de erro)
   * passaria em todos os testes acima e mataria o alerta em silencio.
   */
  it("CONTROLE NEGATIVO: falha da propria supressao ALERTA (fail-open)", () => {
    const memoriaQuebrada = {
      get() {
        throw new Error("estado indisponivel");
      },
      set() {
        throw new Error("estado indisponivel");
      },
    } as unknown as Map<string, number>;

    expect(deveAlertarCampanhaTravada(CAMPANHA, T0, memoriaQuebrada)).toBe(
      true,
    );
  });

  it("CONTROLE NEGATIVO: a janela e de 60 minutos, nao do tamanho do tick", () => {
    // Se alguem trocar a janela pelo intervalo do cron (5 min), a supressao
    // deixa de suprimir e o realerta volta.
    expect(JANELA_REALERTA_MS).toBe(60 * 60 * 1000);
  });
});
