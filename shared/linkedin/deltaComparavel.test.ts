import { describe, expect, it } from "vitest";

import { DETERMINISTIC_VERSION } from "./schema";

/**
 * Regra do delta de nota, extraída da página para poder ser testada.
 *
 * A Fase 1A muda o CONTEÚDO do determinístico para o mesmo perfil (headline
 * completa, competências sem fragmento, descrições sem rodapé). Uma análise
 * feita depois vale mais pontos que a mesma análise feita antes, sem a pessoa
 * ter mexido em nada. Sem esta regra, o `ScoreDeltaBanner` comemoraria com
 * confete uma melhoria que o usuário não fez.
 */
function versaoDe(v: number | null | undefined): number {
  return v ?? 1;
}

export function deltaEhComparavel(
  versaoAnterior: number | null | undefined,
  versaoAtual: number | null | undefined,
): boolean {
  return versaoDe(versaoAnterior) === versaoDe(versaoAtual);
}

describe("delta de nota entre versoes da regua", () => {
  it("MESMA versao: delta e comparavel, banner e celebracao liberados", () => {
    expect(deltaEhComparavel(2, 2)).toBe(true);
    expect(deltaEhComparavel(1, 1)).toBe(true);
    expect(deltaEhComparavel(DETERMINISTIC_VERSION, DETERMINISTIC_VERSION)).toBe(
      true,
    );
  });

  it("VERSAO DIFERENTE: nao comparavel, sem delta e sem celebracao", () => {
    expect(deltaEhComparavel(1, 2)).toBe(false);
    expect(deltaEhComparavel(2, 1)).toBe(false);
  });

  it("linha antiga sem carimbo conta como v1", () => {
    // As 107 analises gravadas antes do carimbo nao tem o campo. Comparar uma
    // delas com uma analise nova (v2) tem que ser barrado.
    expect(deltaEhComparavel(null, 1)).toBe(true);
    expect(deltaEhComparavel(undefined, 1)).toBe(true);
    expect(deltaEhComparavel(null, DETERMINISTIC_VERSION)).toBe(false);
    expect(deltaEhComparavel(undefined, DETERMINISTIC_VERSION)).toBe(false);
  });

  it("a versao atual e 2: reanalise de qualquer historico existente nao compara", () => {
    // Guard contra esquecer de bumpar: se DETERMINISTIC_VERSION voltar a 1,
    // este teste quebra e avisa que o historico voltaria a ser comparado.
    expect(DETERMINISTIC_VERSION).toBe(2);
    expect(deltaEhComparavel(null, DETERMINISTIC_VERSION)).toBe(false);
  });
});
