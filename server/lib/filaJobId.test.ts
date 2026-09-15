import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `jobId` OPCIONAL no enqueue de e-mail transacional.
 *
 * Com `jobId`, ele chega ao `add` do BullMQ, que ignora um segundo job com o
 * mesmo id enquanto o primeiro existir: e o que impede um estagio do lembrete
 * de Pix de virar dois e-mails se a marcacao no banco falhar entre duas
 * execucoes do cron.
 *
 * Sem `jobId`, a chamada tem de ser EXATAMENTE a de antes, com dois argumentos.
 * E isso que prova que nenhum chamador existente mudou de comportamento: um
 * terceiro argumento `undefined` ja seria uma chamada diferente.
 */

vi.mock("./env", () => ({
  env: {
    redisUrl: "redis://localhost:6379",
    transactionalEmailRateMs: 1000,
    resendApiKey: "",
  },
}));

const fila = vi.hoisted(() => ({
  adds: [] as unknown[][],
}));

vi.mock("bullmq", () => ({
  Queue: class {
    add(...args: unknown[]) {
      fila.adds.push(args);
      return Promise.resolve();
    }
  },
  Worker: class {
    on() {}
  },
}));

vi.mock("./redis", () => ({
  queueConnection: {},
  cacheConnection: {},
}));

import { enqueueEmail } from "./queue";

const LEMBRETE = {
  type: "pix_pending_reminder" as const,
  to: "a@b.com",
  name: "Ana",
  subscriptionId: "row-1",
  variant: "aberto" as const,
  planName: "Anual",
  amountCents: 1737,
  dueDate: "2026-09-10",
  payUrl: "https://boranatech.com.br/perfil?pix=abrir",
  invoiceUrl: null,
};

beforeEach(() => {
  fila.adds = [];
});

describe("enqueueEmail e o jobId", () => {
  it("com jobId, o valor chega ao add", async () => {
    await enqueueEmail(LEMBRETE, { jobId: "pix-lembrete:row-1:p1" });
    expect(fila.adds).toHaveLength(1);
    const [nome, dados, opcoes] = fila.adds[0];
    expect(nome).toBe("pix_pending_reminder");
    expect(dados).toEqual(LEMBRETE);
    expect(opcoes).toEqual({ jobId: "pix-lembrete:row-1:p1" });
  });

  it("sem jobId, o add recebe exatamente os dois argumentos de antes", async () => {
    await enqueueEmail({ type: "welcome", to: "a@b.com", name: "Ana" });
    expect(fila.adds).toHaveLength(1);
    expect(fila.adds[0]).toEqual([
      "welcome",
      { type: "welcome", to: "a@b.com", name: "Ana" },
    ]);
  });
});
