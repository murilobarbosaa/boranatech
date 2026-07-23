import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// send controlavel do Resend. vi.hoisted pra ser referenciado dentro da factory
// do vi.mock (que sobe antes dos imports). Cada teste troca resendState.send.
const resendState = vi.hoisted(() => ({
  send: (..._args: unknown[]): Promise<unknown> =>
    Promise.resolve({ data: { id: "email_test" }, error: null }),
}));

// Resend mockado: new Resend(key).emails.send delega pro send controlavel.
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: (...args: unknown[]) => resendState.send(...args) };
  },
}));

// env com a chave presente: sem isto, sendCampaignEmail lanca cedo
// ("RESEND_API_KEY ausente") e nunca chega no caminho do timeout. email.ts so le
// env.resendApiKey no import; os demais campos nao sao tocados neste caminho.
vi.mock("./env", () => ({ env: { resendApiKey: "test-key" } }));

import { sendCampaignEmail } from "./email";

const PARAMS = {
  to: "destinatario@exemplo.com",
  subject: "Assunto de teste",
  body: "Olá {nome}, isto é um teste.",
  imageUrl: null,
  unsubscribeUrl: "https://boranatech.com.br/descadastrar?token=abc",
  footerReason: "Você recebeu este e-mail porque é um teste.",
  firstName: "Ana",
};

describe("sendCampaignEmail — timeout do envio", () => {
  beforeEach(() => {
    // Default: envio bem-sucedido. Testes que precisam de outro comportamento
    // sobrescrevem resendState.send.
    resendState.send = () =>
      Promise.resolve({ data: { id: "email_test" }, error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejeita com a mensagem de timeout quando o envio do Resend pendura", async () => {
    vi.useFakeTimers();
    // Envio que nunca resolve: simula o request pendurado que travaria o worker.
    resendState.send = () => new Promise<never>(() => {});

    const promise = sendCampaignEmail(PARAMS);
    // Prende a asserção antes de avançar o relógio pra não vazar rejeição.
    const assertion = expect(promise).rejects.toThrow(/Timeout de 20000ms/);
    await vi.advanceTimersByTimeAsync(20_000);
    await assertion;
  });

  it("resolve com o id do Resend quando o envio responde antes do timeout", async () => {
    // Sem fake timers: o send resolve na hora; o clearTimeout no finally limpa o
    // timer de 20s. Sucesso retorna o data.id (correlacao com o webhook), sem lançar.
    resendState.send = () =>
      Promise.resolve({ data: { id: "email_test" }, error: null });

    await expect(sendCampaignEmail(PARAMS)).resolves.toBe("email_test");
  });

  it("retorna null quando o envio e aceito mas sem id (ausente ou vazio)", async () => {
    // id vazio: envio aceito pelo Resend, mas sem correlacao possivel. Nao e
    // falha (nao lança): retorna null e o fluxo de envio segue.
    resendState.send = () =>
      Promise.resolve({ data: { id: "" }, error: null });

    await expect(sendCampaignEmail(PARAMS)).resolves.toBeNull();
  });
});
