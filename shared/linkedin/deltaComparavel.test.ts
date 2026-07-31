import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { DETERMINISTIC_VERSION } from "./schema";

// A linha legada REAL: as 107 analises nao tem `deterministicVersion` nenhum.
// O campo e AUSENTE, nao e 1. Testar 1 contra 2 nao cobre esse caso.
const LEGADO = JSON.parse(
  readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "server",
      "lib",
      "__fixtures__",
      "linkedin",
      "result-legado-v1.json",
    ),
    "utf8",
  ),
) as { deterministicVersion?: number };

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
    // Fase 1A (v2) contra Fase 1B (v3) tambem nao compara.
    expect(deltaEhComparavel(2, 3)).toBe(false);
    // E a regua v2 (v4) nao compara com nenhuma anterior.
    expect(deltaEhComparavel(3, 4)).toBe(false);
    expect(deltaEhComparavel(4, 3)).toBe(false);
    // Fase 4 (v5): a regua nao mudou, a LEITURA do perfil mudou. A headline
    // que vinha cortada chega inteira aos checks, entao a nota do mesmo perfil
    // se move sem a pessoa ter mexido em nada. Mesma consequencia, mesma
    // supressao.
    expect(deltaEhComparavel(4, 5)).toBe(false);
    expect(deltaEhComparavel(5, 4)).toBe(false);
  });

  it("linha antiga sem carimbo conta como v1", () => {
    // As 107 analises gravadas antes do carimbo nao tem o campo. Comparar uma
    // delas com uma analise nova (v2) tem que ser barrado.
    expect(deltaEhComparavel(null, 1)).toBe(true);
    expect(deltaEhComparavel(undefined, 1)).toBe(true);
    expect(deltaEhComparavel(null, DETERMINISTIC_VERSION)).toBe(false);
    expect(deltaEhComparavel(undefined, DETERMINISTIC_VERSION)).toBe(false);
  });

  it("fixture legada real: o campo e AUSENTE e mesmo assim suprime o delta", () => {
    // Nao e um 1 escrito: a chave nao existe no jsonb gravado.
    expect("deterministicVersion" in LEGADO).toBe(false);
    expect(LEGADO.deterministicVersion).toBeUndefined();
    // Reanalisar hoje (v2) em cima dessa linha NAO pode mostrar delta.
    expect(
      deltaEhComparavel(LEGADO.deterministicVersion, DETERMINISTIC_VERSION),
    ).toBe(false);
    // E abrir duas linhas legadas seguidas continua comparavel entre si.
    expect(
      deltaEhComparavel(LEGADO.deterministicVersion, LEGADO.deterministicVersion),
    ).toBe(true);
  });

  it("a versao atual e 6: reanalise de qualquer historico existente nao compara", () => {
    // Guard contra esquecer de bumpar: se DETERMINISTIC_VERSION voltar a 1,
    // este teste quebra e avisa que o historico voltaria a ser comparado.
    // Alterar este numero e ATO DELIBERADO, no mesmo commit da mudanca que
    // move nota, com o motivo no bloco de doc da constante.
    //
    // 5 -> 6: o pre-preenchimento de competencias parou de escrever o bloco de
    // identidade (nome, cidade, estado, pais) no campo `skills`. Move
    // `skills-quantidade` em 7 das 162 analises persistidas, sempre para baixo.
    expect(DETERMINISTIC_VERSION).toBe(6);
    expect(deltaEhComparavel(null, DETERMINISTIC_VERSION)).toBe(false);
    // As linhas persistidas sao v1 (sem carimbo), v4 ou v5. Nenhuma das tres
    // compara com a v6, que e o ponto do bump.
    expect(deltaEhComparavel(4, DETERMINISTIC_VERSION)).toBe(false);
    expect(deltaEhComparavel(5, DETERMINISTIC_VERSION)).toBe(false);
  });
});
