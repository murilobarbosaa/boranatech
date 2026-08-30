import { describe, expect, it } from "vitest";

import { isRateLimitExempt } from "./rateLimitExempt";

describe("isRateLimitExempt", () => {
  it("[stats-exempt] isenta o contador publico da home", () => {
    // Correcao #1: em IP compartilhado o rate limit geral devolvia 429 e o
    // contador sumia. GET read-only e barato, isento por prefixo.
    expect(isRateLimitExempt("/api/stats/users-count")).toBe(true);
  });

  it("[stats-prefix-any] isenta qualquer subrota de /api/stats/", () => {
    expect(isRateLimitExempt("/api/stats/anything")).toBe(true);
  });

  it("[health-and-webhooks-still-exempt] mantem as isencoes pre-existentes", () => {
    expect(isRateLimitExempt("/api/health")).toBe(true);
    expect(isRateLimitExempt("/api/health/live")).toBe(true);
    expect(isRateLimitExempt("/api/billing/webhook")).toBe(true);
    expect(isRateLimitExempt("/api/resend/webhook")).toBe(true);
  });

  it("[asaas-webhook-exempt] isenta o webhook do Asaas", () => {
    // A fila do Asaas PAUSA a conta depois de uma sequencia de falhas, e o
    // balde dele seria por IP (ele nao manda Authorization), entao a frota
    // inteira dividiria um unico balde. Um 429 aqui nao perde uma entrega:
    // para de confirmar pagamento de todo mundo.
    expect(isRateLimitExempt("/api/webhooks/asaas")).toBe(true);
  });

  it("[asaas-exempt-is-specific] a isencao e do prefixo do provedor, nao de /api/webhooks/", () => {
    // Isencao e privilegio: uma rota de webhook NOVA nasce sujeita ao limiter
    // ate alguem decidir o contrario, em vez de herdar a isencao por morar sob
    // o mesmo prefixo.
    expect(isRateLimitExempt("/api/webhooks/outro-provedor")).toBe(false);
    expect(isRateLimitExempt("/api/webhooks")).toBe(false);
  });

  it("[non-exempt-stays-limited] rotas normais seguem sujeitas ao rate limit", () => {
    expect(isRateLimitExempt("/api/me")).toBe(false);
    expect(isRateLimitExempt("/api/ai/stream")).toBe(false);
    expect(isRateLimitExempt("/api/billing/checkout")).toBe(false);
    // Guarda contra match acidental: "/api/stats" sem barra final nao existe
    // como rota, mas garantimos que a isencao e por prefixo "/api/stats/".
    expect(isRateLimitExempt("/api/statsers")).toBe(false);
  });
});
