import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O aviso de rate limiter SEM Redis.
 *
 * O defeito coberto aqui nao era um erro: era um SILENCIO. A guarda de
 * `server/app.ts` exigia `cacheConnection` para avisar, entao o unico caso em
 * que o aviso importava de verdade (a variavel faltando em producao) era
 * exatamente o unico em que ele nunca saia. Estes casos travam que os dois
 * ambientes se comportam de forma diferente, e que producao fala uma vez so.
 */

const sentrySpy = vi.hoisted(() => ({ captureMessage: vi.fn() }));
vi.mock("@sentry/node", () => ({
  captureMessage: sentrySpy.captureMessage,
}));

import {
  __resetAvisoSemRedisParaTeste,
  avisarRateLimitSemRedis,
} from "./rateLimitSemRedis";

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  __resetAvisoSemRedisParaTeste();
  sentrySpy.captureMessage.mockReset();
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe("em producao, sem Redis", () => {
  it("avisa UMA vez, no console e no Sentry", () => {
    expect(avisarRateLimitSemRedis(true)).toBe(true);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const linha = String(warnSpy.mock.calls[0][0]);
    expect(linha).toContain("[ratelimit]");
    expect(linha).toContain("REDIS_URL");
    // A consequencia precisa estar na linha: quem le "180" na configuracao e ve
    // 360 passarem nao descobre o porque sem isto.
    expect(linha).toMatch(/replicas?/i);

    expect(sentrySpy.captureMessage).toHaveBeenCalledTimes(1);
    const [mensagem, opcoes] = sentrySpy.captureMessage.mock.calls[0] as [
      string,
      { level: string; fingerprint: string[]; tags: Record<string, string> },
    ];
    expect(mensagem).toBe("ratelimit_sem_redis");
    expect(opcoes.level).toBe("warning");
    expect(opcoes.fingerprint).toEqual(["ratelimit-sem-redis"]);
    expect(opcoes.tags).toMatchObject({ area: "ratelimit", redis: "ausente" });
  });

  it("e SO uma vez: a rota roda a cada request, repetir seria ruido", () => {
    expect(avisarRateLimitSemRedis(true)).toBe(true);
    expect(avisarRateLimitSemRedis(true)).toBe(false);
    expect(avisarRateLimitSemRedis(true)).toBe(false);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(sentrySpy.captureMessage).toHaveBeenCalledTimes(1);
  });

  it("Sentry que lanca nao derruba o caminho de request", () => {
    sentrySpy.captureMessage.mockImplementation(() => {
      throw new Error("sem DSN");
    });
    expect(() => avisarRateLimitSemRedis(true)).not.toThrow();
    // E o console ja tinha saido antes da telemetria.
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

describe("CONTROLE NEGATIVO: fora de producao", () => {
  it("nao avisa nada, como antes", () => {
    // Em dev e no CI a ausencia de Redis e o normal, e um aviso por `pnpm dev`
    // ensina a ignorar a linha.
    expect(avisarRateLimitSemRedis(false)).toBe(false);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(sentrySpy.captureMessage).not.toHaveBeenCalled();
  });

  it("o silencio do dev nao consome o aviso de producao", () => {
    // Se o `jaAvisou` fosse marcado tambem em dev, um processo que rodasse os
    // dois caminhos ficaria mudo para sempre.
    avisarRateLimitSemRedis(false);
    avisarRateLimitSemRedis(false);
    expect(avisarRateLimitSemRedis(true)).toBe(true);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
