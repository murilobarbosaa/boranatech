import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { registrarPreferenciaDeMovimento } from "./preferenciaDeMovimento";

/**
 * SUPER PROPERTY `reduced_motion` NO POSTHOG (lote Home 03, item E).
 *
 * Com o item C a home fica parada para quem pede menos movimento. A property vai
 * em todo evento, e e ela que permite separar essas pessoas nos funis. Sem
 * `matchMedia` a preferencia e desconhecida, e desconhecido nao e `false`: nada
 * e registrado, e a property fica ausente em vez de mentir "sem preferencia".
 */

const CONSULTA = "(prefers-reduced-motion: reduce)";

function dublarMatchMedia(implementacao: (q: string) => { matches: boolean }) {
  const espiao = vi.fn(implementacao);
  vi.stubGlobal("matchMedia", espiao);
  return espiao;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("registrarPreferenciaDeMovimento", () => {
  it.each([true, false])("registra reduced_motion=%s", (reduz) => {
    const consulta = dublarMatchMedia(() => ({ matches: reduz }));
    const register = vi.fn();
    registrarPreferenciaDeMovimento({ register });
    expect(consulta).toHaveBeenCalledWith(CONSULTA);
    expect(register).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledWith({ reduced_motion: reduz });
  });

  it("sem matchMedia nao registra nada", () => {
    vi.stubGlobal("matchMedia", undefined);
    const register = vi.fn();
    registrarPreferenciaDeMovimento({ register });
    expect(register).not.toHaveBeenCalled();
  });

  it("matchMedia que lanca nao derruba o boot e nao registra", () => {
    dublarMatchMedia(() => {
      throw new Error("SyntaxError");
    });
    const register = vi.fn();
    expect(() => registrarPreferenciaDeMovimento({ register })).not.toThrow();
    expect(register).not.toHaveBeenCalled();
  });
});

describe("ligacao no main.tsx", () => {
  it("registra logo depois do posthog.init", () => {
    const main = readFileSync(
      path.resolve(import.meta.dirname, "../main.tsx"),
      "utf8",
    );
    const init = main.indexOf("posthog.init(");
    const registro = main.indexOf("registrarPreferenciaDeMovimento(posthog)");
    expect(init).toBeGreaterThan(-1);
    expect(registro).toBeGreaterThan(init);
  });
});
