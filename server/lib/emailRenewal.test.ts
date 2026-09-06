import { beforeEach, describe, expect, it, vi } from "vitest";

const resendState = vi.hoisted(() => ({
  enviados: [] as Array<Record<string, unknown>>,
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async (params: Record<string, unknown>) => {
        resendState.enviados.push(params);
        return { data: { id: "email_test" }, error: null };
      },
    };
  },
}));
vi.mock("./env", () => ({ env: { resendApiKey: "test-key" } }));

import { sendAccessEndedEmail, sendRenewalReminderEmail } from "./email";

const DADOS = {
  planName: "Mensal",
  priceLabel: "R$ 29,90",
  dueDateIso: "2026-09-21T00:00:00.000Z",
  renewUrl: "https://exemplo.com/renovar?t=tok",
  daysRemaining: 7,
};

beforeEach(() => {
  resendState.enviados = [];
});

describe("lembrete de renovacao: a frase do meio segue o meio da renovacao", () => {
  it("Pix: fala em Pix e NAO manda gerar boleto", async () => {
    await sendRenewalReminderEmail("a@b.com", "Ana", {
      ...DADOS,
      paymentMethod: "pix",
    });
    const html = String(resendState.enviados[0].html);
    expect(html).toContain("Pix");
    expect(html).not.toContain("boleto");
  });

  it("boleto (e o padrao, para o job antigo na fila): continua falando em boleto", async () => {
    await sendRenewalReminderEmail("a@b.com", "Ana", DADOS);
    const html = String(resendState.enviados[0].html);
    expect(html).toContain("boleto");
  });
});

describe("e-mail de termino (dia zero)", () => {
  it("assunto aprovado provisoriamente e link de renovacao no corpo", async () => {
    await sendAccessEndedEmail("a@b.com", "Ana", {
      planName: "Anual",
      priceLabel: "R$ 222,00",
      renewUrl: "https://exemplo.com/renovar?t=tok",
    });
    expect(resendState.enviados).toHaveLength(1);
    expect(resendState.enviados[0].subject).toBe(
      "Seu Pro terminou. Renove quando quiser",
    );
    expect(String(resendState.enviados[0].html)).toContain(
      "https://exemplo.com/renovar?t=tok",
    );
  });
});
