import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./env", () => ({
  env: {
    asaasApiUrl: "https://api-sandbox.asaas.com/v3",
    asaasApiKey: "chave-de-teste",
    asaasWebhookToken: "token-de-teste",
    asaasEnabled: true,
  },
}));

import { asaasFetch } from "./asaasClient";

/**
 * O 4xx do Asaas vem como `{ errors: [{ code, description }] }`. O `code` ja
 * chegava ao contexto do erro; a `description` nao, e era ela que dizia POR QUE
 * o estorno foi recusado (medido em 2026-09-03: dois 502 no Sentry, nenhum com
 * o motivo).
 */
describe("asaasFetch: contexto do 4xx", () => {
  const fetchOriginal = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            errors: [
              {
                code: "invalid_action",
                description: "Saldo insuficiente para realizar o estorno.",
              },
            ],
          }),
          { status: 400 },
        ),
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
  });

  it("leva code E description do primeiro erro para o contexto", async () => {
    await expect(
      asaasFetch("/payments/pay_x/refund", { method: "POST", body: {} }),
    ).rejects.toMatchObject({
      code: "asaas_error",
      statusCode: 502,
      context: {
        asaas_status: 400,
        asaas_code: "invalid_action",
        asaas_description: "Saldo insuficiente para realizar o estorno.",
      },
    });
  });

  it("corpo sem errors: description e null, nunca texto inventado", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response("nope", { status: 500 }),
    ) as unknown as typeof fetch;

    await expect(asaasFetch("/payments/pay_x")).rejects.toMatchObject({
      context: { asaas_status: 500, asaas_code: null, asaas_description: null },
    });
  });
});
