import { describe, expect, it } from "vitest";

import { shouldFireCelebration } from "./celebration";

/**
 * As tres condicoes e as combinacoes que importam. O teste existe porque as
 * falhas aqui sao mudas: repetir, ignorar reduced-motion, ou nunca disparar.
 */

const base = { isSuccess: true, reducedMotion: false, alreadyFired: false };

describe("shouldFireCelebration", () => {
  it("sucesso, sem reduced-motion, primeira vez: dispara", () => {
    expect(shouldFireCelebration(base)).toBe(true);
  });

  it("ainda nao houve sucesso: nao dispara", () => {
    expect(shouldFireCelebration({ ...base, isSuccess: false })).toBe(false);
  });

  it("ja disparou: nao repete", () => {
    expect(shouldFireCelebration({ ...base, alreadyFired: true })).toBe(false);
  });

  it("reduced-motion: nao dispara, mesmo na primeira vez", () => {
    expect(shouldFireCelebration({ ...base, reducedMotion: true })).toBe(false);
  });

  it("reduced-motion vence, mesmo com tudo o mais a favor", () => {
    // A ordem das checagens importa: acessibilidade nao pode ser sobreposta por
    // nenhuma outra condicao.
    expect(
      shouldFireCelebration({
        isSuccess: true,
        reducedMotion: true,
        alreadyFired: false,
      }),
    ).toBe(false);
  });

  it("sem sucesso e com reduced-motion: nao dispara", () => {
    expect(
      shouldFireCelebration({
        isSuccess: false,
        reducedMotion: true,
        alreadyFired: false,
      }),
    ).toBe(false);
  });

  it("a funcao nao marca nada: chamar duas vezes com a mesma entrada devolve o mesmo", () => {
    // Se ela mutasse estado, a segunda chamada devolveria false e o efeito
    // dependeria de quantas vezes o React reavaliou.
    expect(shouldFireCelebration(base)).toBe(true);
    expect(shouldFireCelebration(base)).toBe(true);
  });
});
