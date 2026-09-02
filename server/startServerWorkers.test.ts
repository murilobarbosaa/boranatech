import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Fiacao entre a guarda e a criacao dos workers, em `server/index.ts`.
 *
 * `envWorkers.test.ts` prova a DECISAO; este arquivo prova que ela esta ligada
 * no lugar certo. Sao coisas diferentes: a guarda podia estar perfeita e o
 * `index.ts` continuar chamando `createEmailWorker()` do lado de fora do `if`,
 * que era exatamente o defeito de 02/09.
 *
 * `server/index.ts` chama `startServer()` na avaliacao do modulo, entao cada
 * cenario reimporta o modulo com `vi.resetModules()` e le os dubles depois.
 */

const dubles = vi.hoisted(() => ({
  createEmailWorker: vi.fn(() => ({ close: vi.fn() })),
  createEmailCampaignWorker: vi.fn(() => ({ close: vi.fn() })),
  reconcileEmailCampaignBatches: vi.fn(async () => {}),
  listen: vi.fn(),
  on: vi.fn(),
  env: {
    nodeEnv: "development",
    redisUrl: "",
    queueWorkersNonProd: false,
    port: 3100,
  },
}));

vi.mock("@sentry/node", () => ({
  captureException: vi.fn(),
  close: vi.fn(async () => true),
}));
vi.mock("./lib/sentry", () => ({}));
vi.mock("./app", () => ({ default: {} }));
vi.mock("http", () => ({
  createServer: () => ({
    listen: dubles.listen,
    on: dubles.on,
    close: vi.fn(),
    closeIdleConnections: vi.fn(),
  }),
}));
vi.mock("./lib/queue", () => ({ createEmailWorker: dubles.createEmailWorker }));
vi.mock("./lib/emailCampaignQueue", () => ({
  createEmailCampaignWorker: dubles.createEmailCampaignWorker,
  reconcileEmailCampaignBatches: dubles.reconcileEmailCampaignBatches,
}));
vi.mock("./lib/redis", () => ({
  queueConnection: null,
  cacheConnection: null,
}));
vi.mock("./lib/env", async () => {
  // A guarda REAL, com um `env` de mentira: o que se quer testar e a fiacao,
  // nao reimplementar a decisao aqui (expectativa derivada do mecanismo).
  const real = await vi.importActual<typeof import("./lib/env")>("./lib/env");
  return { env: dubles.env, deveSubirWorkers: real.deveSubirWorkers };
});

async function subir(cfg: {
  nodeEnv: string;
  redisUrl: string;
  queueWorkersNonProd: boolean;
}) {
  Object.assign(dubles.env, cfg);
  vi.resetModules();
  await import("./index");
  // startServer e async; deixa a microtask do import assentar.
  await new Promise((r) => setTimeout(r, 0));
}

describe("startServer: workers so quando a guarda deixa", () => {
  beforeEach(() => {
    dubles.createEmailWorker.mockClear();
    dubles.createEmailCampaignWorker.mockClear();
    dubles.listen.mockClear();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("development sem flag, COM redisUrl: nenhum worker e criado", async () => {
    await subir({
      nodeEnv: "development",
      redisUrl: "redis://prod-de-verdade:6379",
      queueWorkersNonProd: false,
    });
    expect(dubles.createEmailWorker).not.toHaveBeenCalled();
    expect(dubles.createEmailCampaignWorker).not.toHaveBeenCalled();
    // O servidor HTTP continua subindo: a guarda corta o consumo, nao o app.
    expect(dubles.listen).toHaveBeenCalledTimes(1);
  });

  it("production com redisUrl: os DOIS workers sao criados", async () => {
    await subir({
      nodeEnv: "production",
      redisUrl: "redis://prod-de-verdade:6379",
      queueWorkersNonProd: false,
    });
    expect(dubles.createEmailWorker).toHaveBeenCalledTimes(1);
    expect(dubles.createEmailCampaignWorker).toHaveBeenCalledTimes(1);
  });

  it("development COM o escape ligado: os dois sao criados", async () => {
    await subir({
      nodeEnv: "development",
      redisUrl: "redis://prod-de-verdade:6379",
      queueWorkersNonProd: true,
    });
    expect(dubles.createEmailWorker).toHaveBeenCalledTimes(1);
    expect(dubles.createEmailCampaignWorker).toHaveBeenCalledTimes(1);
  });

  it("production SEM redisUrl: nenhum worker (a condicao antiga segue valendo)", async () => {
    await subir({
      nodeEnv: "production",
      redisUrl: "",
      queueWorkersNonProd: false,
    });
    expect(dubles.createEmailWorker).not.toHaveBeenCalled();
    expect(dubles.createEmailCampaignWorker).not.toHaveBeenCalled();
  });

  it("registra um handler de 'error' no servidor HTTP", async () => {
    await subir({
      nodeEnv: "development",
      redisUrl: "",
      queueWorkersNonProd: false,
    });
    const eventos = dubles.on.mock.calls.map((c) => c[0]);
    expect(eventos).toContain("error");
  });
});
