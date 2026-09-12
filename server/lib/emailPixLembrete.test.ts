import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PLAN_PRICING } from "../../shared/planPricing";

/**
 * LEMBRETE DE PIX PENDENTE: copy por variante, valor da COBRANCA, data sem
 * deslocamento de fuso e, principalmente, falha do Resend virando excecao.
 *
 * O ultimo ponto e o que distingue este sender dos vizinhos: os transacionais
 * ignoram o retorno do Resend, entao um 4xx completa o job como sucesso. Aqui o
 * estagio e marcado no banco depois do enqueue, e um envio mudo seria um
 * lembrete que nunca sai e nunca mais e tentado.
 */

type RespostaResend = {
  data: { id: string } | null;
  error: { message: string } | null;
};

const resendState = vi.hoisted(() => ({
  enviados: [] as Array<Record<string, unknown>>,
  resposta: { data: { id: "email_test" }, error: null } as {
    data: { id: string } | null;
    error: { message: string } | null;
  },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async (params: Record<string, unknown>) => {
        resendState.enviados.push(params);
        return resendState.resposta;
      },
    };
  },
}));
vi.mock("./env", () => ({ env: { resendApiKey: "test-key" } }));

import { sendPixPendingReminderEmail } from "./email";

const TZ_ORIGINAL = process.env.TZ;
process.env.TZ = "UTC";

afterAll(() => {
  process.env.TZ = TZ_ORIGINAL;
});

function usarFuso(tz: string, offsetEsperadoMin: number) {
  process.env.TZ = tz;
  expect(new Date("2026-09-10T12:00:00Z").getTimezoneOffset()).toBe(
    offsetEsperadoMin,
  );
}

const OK: RespostaResend = { data: { id: "email_test" }, error: null };

const BASE = {
  variant: "aberto" as const,
  planName: "Anual",
  // R$ 17,37 nao e preco de tabela de plano nenhum, de proposito.
  amountCents: 1737,
  dueDate: "2026-09-10",
  payUrl: "https://boranatech.com.br/perfil?pix=abrir",
  invoiceUrl: "https://www.asaas.com/i/abc123" as string | null,
};

function enviado(i = 0) {
  const e = resendState.enviados[i];
  return { subject: String(e.subject), html: String(e.html) };
}

beforeEach(() => {
  resendState.enviados = [];
  resendState.resposta = OK;
  usarFuso("UTC", 0);
});

describe("lembrete de Pix pendente", () => {
  it("aberto e vence_hoje tem assuntos diferentes, e so o segundo fala em vencer hoje", async () => {
    await sendPixPendingReminderEmail("a@b.com", "Ana", BASE);
    await sendPixPendingReminderEmail("a@b.com", "Ana", {
      ...BASE,
      variant: "vence_hoje",
    });
    const aberto = enviado(0);
    const venceHoje = enviado(1);
    expect(aberto.subject).not.toBe(venceHoje.subject);
    expect(venceHoje.subject).toBe("Seu Pix vence hoje");
    expect(venceHoje.html).toContain("vence hoje");
    expect(aberto.subject.toLowerCase()).not.toContain("vence hoje");
    expect(aberto.html.toLowerCase()).not.toContain("vence hoje");
  });

  it("o valor no html e o da cobranca, nao o de tabela de nenhum plano", async () => {
    await sendPixPendingReminderEmail("a@b.com", "Ana", BASE);
    const { html } = enviado();
    expect(html).toContain("17,37");
    for (const plano of Object.values(PLAN_PRICING)) {
      const numero = plano.totalLabel.replace("R$ ", "");
      expect(html).not.toContain(numero);
    }
  });

  it("o html contem o payUrl", async () => {
    await sendPixPendingReminderEmail("a@b.com", "Ana", BASE);
    expect(enviado().html).toContain(BASE.payUrl);
  });

  it("com invoiceUrl o link aparece; com null nao sobra link do Asaas", async () => {
    await sendPixPendingReminderEmail("a@b.com", "Ana", BASE);
    await sendPixPendingReminderEmail("a@b.com", "Ana", {
      ...BASE,
      invoiceUrl: null,
    });
    expect(enviado(0).html).toContain("https://www.asaas.com/i/abc123");
    expect(enviado(1).html).not.toContain("asaas.com");
  });

  it("2026-09-10 aparece como dia 10 com TZ=UTC e tambem com TZ=America/Sao_Paulo", async () => {
    await sendPixPendingReminderEmail("a@b.com", "Ana", BASE);
    usarFuso("America/Sao_Paulo", 180);
    await sendPixPendingReminderEmail("a@b.com", "Ana", BASE);
    expect(enviado(0).html).toContain("10 de setembro de 2026");
    expect(enviado(1).html).toContain("10 de setembro de 2026");
    expect(enviado(1).html).not.toContain("9 de setembro");
  });

  it("Resend devolvendo error faz a funcao lancar", async () => {
    resendState.resposta = {
      data: null,
      error: { message: "domain is not verified" },
    };
    await expect(
      sendPixPendingReminderEmail("a@b.com", "Ana", BASE),
    ).rejects.toThrow("domain is not verified");
  });

  it("nenhuma das variantes tem travessao ou meia-risca no assunto ou no html", async () => {
    await sendPixPendingReminderEmail("a@b.com", "Ana", BASE);
    await sendPixPendingReminderEmail("a@b.com", "Ana", {
      ...BASE,
      variant: "vence_hoje",
    });
    for (const i of [0, 1]) {
      const { subject, html } = enviado(i);
      for (const texto of [subject, html]) {
        // Por codigo, e nao literal: o proprio fonte tambem nao pode ter os dois.
        expect(texto).not.toContain(String.fromCharCode(0x2013));
        expect(texto).not.toContain(String.fromCharCode(0x2014));
      }
    }
  });

  it("dueDate ilegivel: o e-mail sai sem a data, nunca com Invalid Date", async () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    await sendPixPendingReminderEmail("a@b.com", "Ana", {
      ...BASE,
      dueDate: "10/09/2026",
    });
    await sendPixPendingReminderEmail("a@b.com", "Ana", {
      ...BASE,
      variant: "vence_hoje",
      dueDate: "",
    });
    for (const i of [0, 1]) {
      expect(enviado(i).html).not.toContain("Invalid Date");
      expect(enviado(i).html).toContain("17,37");
    }
    expect(erro).toHaveBeenCalledTimes(2);
    erro.mockRestore();
  });

  it("nome e plano vindos de fora sao escapados", async () => {
    await sendPixPendingReminderEmail("a@b.com", "<b>Ana</b>", {
      ...BASE,
      planName: "Anual<script>",
    });
    const { html } = enviado();
    expect(html).toContain("&lt;b&gt;Ana&lt;/b&gt;");
    expect(html).not.toContain("<script>");
  });
});
