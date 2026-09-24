import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O CONFETE NAO PODE USAR WORKER.
 *
 * A CSP de producao nao declara `worker-src`, entao o worker em `blob:` que o
 * `confetti` padrao cria e bloqueado sem excecao, e nenhuma particula aparece.
 * Estes testes prendem a instancia sem worker e as duas defesas de cada burst.
 */

const lib = vi.hoisted(() => {
  const disparar = vi.fn();
  return { disparar, create: vi.fn(() => disparar) };
});

vi.mock("canvas-confetti", () => ({ default: { create: lib.create } }));

import { fireProCelebration } from "@/lib/proConfetti";

beforeEach(() => {
  vi.useFakeTimers();
  lib.disparar.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("fireProCelebration", () => {
  it("desenha numa instancia criada sem worker", () => {
    const parar = fireProCelebration({ x: 0.5, y: 0.5 });
    parar();

    expect(lib.create).toHaveBeenCalledWith(undefined, {
      resize: true,
      useWorker: false,
    });
  });

  it("sem zIndex, usa o 100 da biblioteca", () => {
    fireProCelebration({ x: 0.5, y: 0.5 })();

    expect(lib.disparar).toHaveBeenCalledWith(
      expect.objectContaining({ zIndex: 100, disableForReducedMotion: true }),
    );
  });

  it("todo burst do ciclo leva o zIndex pedido e o disableForReducedMotion", () => {
    const parar = fireProCelebration({ x: 0.5, y: 0.35 }, { zIndex: 2000 });
    vi.advanceTimersByTime(2500);
    parar();

    expect(lib.disparar.mock.calls.length).toBeGreaterThan(1);
    for (const [opcoes] of lib.disparar.mock.calls as unknown as Array<
      [{ zIndex?: number; disableForReducedMotion?: boolean }]
    >) {
      expect(opcoes.zIndex).toBe(2000);
      expect(opcoes.disableForReducedMotion).toBe(true);
    }
  });
});
