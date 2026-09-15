import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EmailJobData } from "./queue";

/**
 * O LEMBRETE DE PIX NAO SAI PARA COBRANCA MORTA.
 *
 * A corrida: o cron decide, enfileira e marca o estagio; o envio acontece
 * depois, e o BullMQ ainda reentrega um job falho horas mais tarde. Nesse meio
 * a pessoa pode ter cancelado a cobranca (checkout ou Perfil) e o cron de
 * expiracao pode ter encerrado a linha. Quem envia reconfere.
 *
 * O CAMINHO EXERCITADO E O `sendDirect`, alcancado aqui pelo fallback sem
 * Redis (`queueConnection` nulo, e o lembrete e critico). E a MESMA funcao que
 * o worker chama para cada job, entao os dois caminhos ficam cobertos.
 */

const estado = vi.hoisted(() => ({
  /** Consultas ao banco no envio, na ordem. */
  consultas: [] as Array<{ tabela: string; colunas: string; id: unknown }>,
  linha: { status: "pending" } as Record<string, unknown> | null,
  erroDaLeitura: null as { message: string } | null,
  lembretes: [] as Array<Record<string, unknown>>,
  upgrades: [] as string[],
}));

vi.mock("./env", () => ({
  env: {
    redisUrl: "",
    transactionalEmailRateMs: 1000,
    resendApiKey: "",
  },
}));
vi.mock("./redis", () => ({ queueConnection: null, cacheConnection: null }));
vi.mock("bullmq", () => ({
  Queue: class {},
  Worker: class {
    on() {}
  },
}));
vi.mock("@sentry/node", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: (fn: (scope: unknown) => void) => fn({ setTag() {} }),
}));

vi.mock("./email", () => ({
  sendPixPendingReminderEmail: async (
    to: string,
    name: string,
    dados: Record<string, unknown>,
  ) => {
    estado.lembretes.push({ to, name, ...dados });
  },
  sendProUpgradeEmail: async (to: string) => {
    estado.upgrades.push(to);
  },
  sendAccessEndedEmail: vi.fn(),
  sendCancellationEmail: vi.fn(),
  sendCancellationScheduledEmail: vi.fn(),
  sendFiscalInvoiceEmail: vi.fn(),
  sendNewsletterConfirmEmail: vi.fn(),
  sendNewsletterWelcomeEmail: vi.fn(),
  sendPaymentFailedEmail: vi.fn(),
  sendRenewalReminderEmail: vi.fn(),
  sendWaitlistConfirmationEmail: vi.fn(),
  sendWelcomeEmail: vi.fn(),
}));

vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (tabela: string) => {
      const q: Record<string, unknown> = {};
      let colunas = "";
      q.select = (c: string) => {
        colunas = c;
        return q;
      };
      q.eq = (_coluna: string, valor: unknown) => {
        estado.consultas.push({ tabela, colunas, id: valor });
        return q;
      };
      q.maybeSingle = async () => ({
        data: estado.linha,
        error: estado.erroDaLeitura,
      });
      return q;
    },
  },
}));

import { enqueueEmail } from "./queue";

const LEMBRETE: EmailJobData = {
  type: "pix_pending_reminder",
  to: "a@b.com",
  name: "Ana",
  subscriptionId: "row-1",
  variant: "aberto",
  planName: "Anual",
  amountCents: 1737,
  dueDate: "2026-09-10",
  payUrl: "https://boranatech.com.br/perfil?pix=abrir",
  invoiceUrl: null,
};

beforeEach(() => {
  estado.consultas = [];
  estado.linha = { status: "pending" };
  estado.erroDaLeitura = null;
  estado.lembretes = [];
  estado.upgrades = [];
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("lembrete de Pix reconfere a linha antes de enviar", () => {
  it("1. linha ainda pending: envia, com os dados do job", async () => {
    await enqueueEmail(LEMBRETE);

    expect(estado.lembretes).toEqual([
      {
        to: "a@b.com",
        name: "Ana",
        variant: "aberto",
        planName: "Anual",
        amountCents: 1737,
        dueDate: "2026-09-10",
        payUrl: "https://boranatech.com.br/perfil?pix=abrir",
        invoiceUrl: null,
      },
    ]);
    expect(estado.consultas).toEqual([
      { tabela: "subscriptions", colunas: "status", id: "row-1" },
    ]);
  });

  it("2. linha canceled: NAO envia, nao lanca, e loga o id e o status", async () => {
    estado.linha = { status: "canceled" };

    await expect(enqueueEmail(LEMBRETE)).resolves.toBeUndefined();

    expect(estado.lembretes).toEqual([]);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/row-1.*canceled/),
    );
    // Nao e falha: sai por `log`, nao por `warn` (o unico `warn` daqui e o do
    // fallback sem Redis, que nao fala da linha).
    expect(console.warn).not.toHaveBeenCalledWith(
      expect.stringContaining("row-1"),
    );
  });

  it("3. linha que sumiu: tratada como nao pendente, sem envio e sem excecao", async () => {
    estado.linha = null;

    await expect(enqueueEmail(LEMBRETE)).resolves.toBeUndefined();

    expect(estado.lembretes).toEqual([]);
  });

  it("4. leitura do banco falhando: ENVIA assim mesmo, e avisa", async () => {
    estado.erroDaLeitura = { message: "statement timeout" };
    estado.linha = null;

    await enqueueEmail(LEMBRETE);

    // A escolha esta no cabecalho de `lembretePixAindaValido`: entre um
    // lembrete a mais para quem cancelou e um a menos para quem ainda podia
    // pagar, o segundo custa a venda e o primeiro custa um e-mail ignorado.
    expect(estado.lembretes).toHaveLength(1);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("row-1"));
  });

  it("5. job anterior ao campo (sem subscriptionId): envia como antes", async () => {
    const { subscriptionId: _ignorado, ...antigo } =
      LEMBRETE as EmailJobData & {
        subscriptionId: string;
      };

    await enqueueEmail(antigo as unknown as EmailJobData);

    expect(estado.lembretes).toHaveLength(1);
    expect(estado.consultas).toEqual([]);
  });

  it("6. outro tipo de e-mail nao passa a ler o banco", async () => {
    await enqueueEmail({
      type: "pro_upgrade",
      to: "c@d.com",
      name: "Bea",
      planName: "Anual",
    });

    expect(estado.upgrades).toEqual(["c@d.com"]);
    expect(estado.consultas).toEqual([]);
  });
});
