import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Volume do reporte de falha de campanha (BUG-51).
 *
 * O timeout de 20s NAO e o defeito: sem ele um request pendurado no Resend
 * segurava o worker de concorrencia 1 e travava a campanha inteira ate um
 * restart. O defeito era o `worker.on("failed")` capturar no Sentry em TODA
 * tentativa: com `attempts: 3`, um destinatario problematico virava 3 eventos, e
 * numa janela ruim do Resend isso multiplica pelo tamanho do lote.
 *
 * O que este teste trava e a ATRIBUICAO do numero: um evento por destinatario
 * que de fato ficou sem e-mail. E ele tem os dois lados, porque so o primeiro
 * ("a final reporta") passaria de novo se alguem devolvesse a captura para todas
 * as tentativas.
 */

const sentrySpy = vi.hoisted(() => ({
  captureException: vi.fn(),
  setTag: vi.fn(),
}));

vi.mock("@sentry/node", () => ({
  captureException: sentrySpy.captureException,
  withScope: (
    fn: (scope: { setTag: (k: string, v: string) => void }) => void,
  ) => fn({ setTag: sentrySpy.setTag }),
}));

// Captura os handlers registrados com `worker.on(...)` sem subir BullMQ nem
// Redis. `Queue` tambem e dublado porque o modulo o instancia na avaliacao.
const bullSpy = vi.hoisted(() => ({
  handlers: new Map<string, (...args: unknown[]) => void>(),
}));

vi.mock("bullmq", () => ({
  Queue: class {
    add = vi.fn();
    on = vi.fn();
  },
  Worker: class {
    on(evento: string, handler: (...args: unknown[]) => void) {
      bullSpy.handlers.set(evento, handler);
      return this;
    }
  },
}));

vi.mock("./redis", () => ({
  queueConnection: {},
  cacheConnection: null,
}));

vi.mock("./env", () => ({
  env: { emailCampaignRateMs: 1000, resendApiKey: "re_x", appUrl: "https://x" },
}));

// A assinatura vai explicita para o `mock.calls[0][0]` la embaixo ter tipo: com
// `vi.fn(async () => ...)` o tsc infere tupla vazia e o `pnpm check` reprova.
const rpcSpy = vi.hoisted(() => ({
  rpc: vi.fn(async (_funcao: string, _args: Record<string, unknown>) => ({
    error: null,
  })),
}));
vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: { rpc: rpcSpy.rpc, from: vi.fn() },
}));

vi.mock("./email", () => ({
  campaignFooterReason: () => "",
  sendCampaignEmail: vi.fn(),
}));

import { createEmailCampaignWorker } from "./emailCampaignQueue";

/** Job de destinatario, com o numero de tentativas ja feitas. */
function jobDe(attemptsMade: number, attempts = 3) {
  return {
    id: "j1",
    attemptsMade,
    opts: { attempts },
    data: { campaignId: "c1", recipientId: "r1" },
  };
}

function dispararFalha(job: unknown, err: Error) {
  const handler = bullSpy.handlers.get("failed");
  if (!handler) throw new Error("handler de 'failed' nao foi registrado");
  handler(job, err);
}

const TIMEOUT = new Error("Timeout de 20000ms ao enviar e-mail de campanha.");

describe("worker.on('failed') da campanha", () => {
  beforeEach(() => {
    sentrySpy.captureException.mockReset();
    sentrySpy.setTag.mockReset();
    rpcSpy.rpc.mockClear();
    bullSpy.handlers.clear();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    createEmailCampaignWorker();
  });

  it("tentativa INTERMEDIARIA nao vai ao Sentry", () => {
    dispararFalha(jobDe(1), TIMEOUT);
    dispararFalha(jobDe(2), TIMEOUT);

    expect(sentrySpy.captureException).not.toHaveBeenCalled();
    // E tambem NAO marca o destinatario como failed: o BullMQ ainda vai
    // reagendar, e marcar aqui colapsaria retry em desistencia.
    expect(rpcSpy.rpc).not.toHaveBeenCalled();
  });

  it("tentativa FINAL vai ao Sentry uma vez, com as tags do caso", () => {
    dispararFalha(jobDe(3), TIMEOUT);

    expect(sentrySpy.captureException).toHaveBeenCalledTimes(1);
    expect(sentrySpy.captureException.mock.calls[0][0]).toBe(TIMEOUT);
    const tags = Object.fromEntries(sentrySpy.setTag.mock.calls);
    expect(tags.jobName).toBe("email-campaign");
    expect(tags.jobId).toBe("j1");
    expect(tags.attemptsMade).toBe("3");
    expect(tags.errorName).toBe("Error");
  });

  it("a sequencia inteira de um destinatario da UM evento, nao tres", () => {
    // A conta que o painel precisa: eventos igual a destinatarios perdidos.
    for (const tentativa of [1, 2, 3]) dispararFalha(jobDe(tentativa), TIMEOUT);

    expect(sentrySpy.captureException).toHaveBeenCalledTimes(1);
  });

  it("respeita o attempts do JOB quando ele difere da constante", () => {
    // Job com teto de 5: a terceira tentativa ainda e intermediaria.
    dispararFalha(jobDe(3, 5), TIMEOUT);
    expect(sentrySpy.captureException).not.toHaveBeenCalled();

    dispararFalha(jobDe(5, 5), TIMEOUT);
    expect(sentrySpy.captureException).toHaveBeenCalledTimes(1);
  });

  it("falha SEM job e de nivel do worker e vai ao Sentry sempre", () => {
    // Nao ha destinatario nem tentativa a contar, entao a regra de volume nao
    // se aplica e silenciar aqui esconderia falha de infraestrutura.
    dispararFalha(undefined, new Error("connection lost"));

    expect(sentrySpy.captureException).toHaveBeenCalledTimes(1);
    const tags = Object.fromEntries(sentrySpy.setTag.mock.calls);
    expect(tags.jobId).toBe("unknown");
  });

  it("job de LOTE na tentativa final reporta, mas nao marca recipient", () => {
    dispararFalha(
      {
        id: "b1",
        attemptsMade: 3,
        opts: { attempts: 3 },
        data: { batchId: "b" },
      },
      TIMEOUT,
    );

    expect(sentrySpy.captureException).toHaveBeenCalledTimes(1);
    expect(rpcSpy.rpc).not.toHaveBeenCalled();
  });

  it("na final o destinatario E marcado como failed", () => {
    dispararFalha(jobDe(3), TIMEOUT);

    expect(rpcSpy.rpc).toHaveBeenCalledTimes(1);
    expect(rpcSpy.rpc.mock.calls[0][0]).toBe("email_campaign_record_result");
  });
});
