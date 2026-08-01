import { beforeEach, describe, expect, it, vi } from "vitest";

const supa = vi.hoisted(() => {
  const resposta: { data: Array<{ status: string }> } = { data: [] };
  const chain: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order", "limit"]) chain[m] = () => chain;
  chain.then = (r: (v: unknown) => unknown) =>
    Promise.resolve({ data: resposta.data, error: null }).then(r);
  return { from: () => chain, resposta };
});
vi.mock("./supabaseAdmin", () => ({ supabaseAdmin: { from: supa.from } }));
vi.mock("./env", () => ({ env: { bugNotifyNewEmail: "dev@exemplo.com" } }));

const notificar = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock("./targetedNotifications", () => ({
  createTargetedNotification: notificar,
}));

import { avisarSeCronMorreu, JOBS_COM_ALERTA } from "./cronAlert";

/** `runs` do mais RECENTE para o mais antigo, como o banco devolve. */
function historico(...runs: string[]) {
  supa.resposta.data = runs.map((status) => ({ status }));
}

beforeEach(() => {
  vi.clearAllMocks();
  supa.resposta.data = [];
});

describe("aviso de cron morto", () => {
  it("dispara EXATAMENTE na terceira nao-sadia seguida", async () => {
    historico("partial", "partial", "partial", "success");
    await avisarSeCronMorreu("sync-sentry-tasks");
    expect(notificar).toHaveBeenCalledTimes(1);
    expect(String(notificar.mock.calls[0][0].title)).toContain(
      "sync-sentry-tasks",
    );
  });

  it("NAO dispara de novo no meio de uma sequencia longa", async () => {
    // A asserção mais importante. Sem ela, a sequencia real de 372 runs
    // quebradas do reconcile-sentry-bugs teria gerado 370 notificacoes, e o
    // aviso viraria exatamente o ruido que ele existe para evitar.
    historico("partial", "partial", "partial", "partial");
    await avisarSeCronMorreu("reconcile-sentry-bugs");
    expect(notificar).not.toHaveBeenCalled();
  });

  it("duas nao-sadias ainda nao avisam", async () => {
    historico("partial", "partial", "success", "success");
    await avisarSeCronMorreu("sync-sentry-tasks");
    expect(notificar).not.toHaveBeenCalled();
  });

  it("uma run sadia no meio zera a contagem", async () => {
    historico("partial", "success", "partial", "partial");
    await avisarSeCronMorreu("sync-sentry-tasks");
    expect(notificar).not.toHaveBeenCalled();
  });

  it("avisa quando as tres sao o inicio do historico", async () => {
    // Sem run anterior, a sequencia comeca no primeiro registro. Exigir uma
    // sadia antes faria um job que ja nasce quebrado nunca avisar.
    historico("error", "partial", "error");
    await avisarSeCronMorreu("sync-sentry-tasks");
    expect(notificar).toHaveBeenCalledTimes(1);
  });

  it("job fora da lista nunca avisa, nem com dez falhas", async () => {
    // sync-news fica de fora por medicao: `partial` nele e rotina e teria
    // gerado 10 avisos historicos.
    historico(...Array(10).fill("partial"));
    await avisarSeCronMorreu("sync-news");
    expect(notificar).not.toHaveBeenCalled();
  });

  it("a lista de jobs com alerta e exatamente esta", async () => {
    // Afirma o TOTAL, nao a pertinencia: um job novo entrando aqui e ato
    // deliberado, e um saindo sem querer derruba este teste.
    expect(Array.from(JOBS_COM_ALERTA).sort()).toEqual([
      "reconcile-sentry-bugs",
      "sync-sentry-tasks",
    ]);
  });

  it("falha na leitura nao lanca nem avisa", async () => {
    supa.resposta.data = [];
    await expect(
      avisarSeCronMorreu("sync-sentry-tasks"),
    ).resolves.toBeUndefined();
    expect(notificar).not.toHaveBeenCalled();
  });
});
