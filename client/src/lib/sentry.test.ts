import { describe, expect, it } from "vitest";

import { amostrarPorOrigem } from "./sentry";

/**
 * O corte de amostragem por tipo de evento.
 *
 * Existe porque `sampleRate: 0.25` no init é cego ao conteúdo: ele decide antes
 * de haver tag para ler, e o efeito era que 3 de cada 4 telas quebradas ficavam
 * invisíveis. Ruído de extensão de browser pode ser amostrado; tela quebrada
 * não, porque é raro e cada ocorrência é o dado.
 *
 * `sortear` é injetado para o teste não depender de `Math.random`: um teste que
 * passa 3 de cada 4 vezes é pior que teste nenhum.
 */

describe("amostrarPorOrigem", () => {
  it("evento do boundary passa SEMPRE, mesmo no pior sorteio", () => {
    const evento = { tags: { origem: "error-boundary" } };
    expect(amostrarPorOrigem(evento, undefined, () => 0.99)).toBe(evento);
    expect(amostrarPorOrigem(evento, undefined, () => 1)).toBe(evento);
  });

  it("evento comum continua amostrado a 0.25", () => {
    const evento = { tags: { origem: "outra-coisa" } };
    // Abaixo do corte passa.
    expect(amostrarPorOrigem(evento, undefined, () => 0.1)).toBe(evento);
    // Acima do corte é descartado.
    expect(amostrarPorOrigem(evento, undefined, () => 0.3)).toBeNull();
  });

  it("evento sem tag nenhuma é tratado como comum, não como boundary", () => {
    // Importa: se a ausência de tag caísse no caminho "sempre envia", qualquer
    // ruído de extensão passaria a ir 100% e estouraria a cota.
    const evento = {};
    expect(amostrarPorOrigem(evento, undefined, () => 0.3)).toBeNull();
    expect(amostrarPorOrigem(evento, undefined, () => 0.1)).toBe(evento);
  });

  it("a fronteira do corte é estrita", () => {
    const evento = { tags: { origem: "x" } };
    expect(amostrarPorOrigem(evento, undefined, () => 0.25)).toBeNull();
    expect(amostrarPorOrigem(evento, undefined, () => 0.2499)).toBe(evento);
  });
});
