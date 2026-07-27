import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  LINKEDIN_CATEGORIES,
  TIER_WEIGHTS,
  type LinkedinCheckResult,
} from "@shared/linkedin/schema";

/**
 * A decomposicao do hero le `deterministic.checks` DIRETO, sem passar por
 * `readDeterministic`. E aceitavel porque `checks` esta presente nas 107 linhas
 * gravadas, mas "esta presente hoje" nao e garantia: este teste prende o
 * comportamento contra a fixture LEGADA real, a mesma linha v1 que existe no
 * banco.
 *
 * O que ele impede: alguem mexer no shape do check (tirar `category` ou `tier`)
 * e a decomposicao virar seis barras vazias numa analise antiga, sem quebrar
 * nada mais.
 */

const LEGADO = JSON.parse(
  readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
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
) as { deterministic: { checks: LinkedinCheckResult[]; score: number } };

/** Replica exata do calculo do LinkedinScoreHero. */
function decompor(checks: LinkedinCheckResult[]) {
  return LINKEDIN_CATEGORIES.map((categoria) => {
    const doGrupo = checks.filter((c) => c.category === categoria);
    const possivel = doGrupo.reduce((s, c) => s + TIER_WEIGHTS[c.tier], 0);
    const ganho = doGrupo
      .filter((c) => c.aprovado)
      .reduce((s, c) => s + TIER_WEIGHTS[c.tier], 0);
    return { categoria, ganho, possivel };
  }).filter((d) => d.possivel > 0);
}

describe("decomposicao da nota numa analise LEGADA v1", () => {
  const checks = LEGADO.deterministic.checks;

  it("a fixture legada e mesmo v1: sem deterministicVersion", () => {
    expect("deterministicVersion" in (LEGADO as object)).toBe(false);
    expect(checks).toHaveLength(28);
  });

  it("todo check legado tem category e tier: a decomposicao nao fica vazia", () => {
    for (const c of checks) {
      expect(c.category, `check ${c.id} sem category`).toBeTruthy();
      expect(c.tier, `check ${c.id} sem tier`).toBeTruthy();
    }
  });

  it("renderiza as SEIS categorias, nenhuma vazia por acidente", () => {
    const d = decompor(checks);
    expect(d).toHaveLength(6);
    expect(d.map((x) => x.categoria)).toEqual([...LINKEDIN_CATEGORIES]);
  });

  it("a soma da decomposicao reproduz a nota GRAVADA", () => {
    // Se isto quebrar, a decomposicao esta contando diferente do que a nota
    // afirma, e o usuario ve duas verdades na mesma tela.
    const d = decompor(checks);
    const possivel = d.reduce((s, x) => s + x.possivel, 0);
    const ganho = d.reduce((s, x) => s + x.ganho, 0);
    expect(possivel).toBe(194);
    expect(Math.round((100 * ganho) / possivel)).toBe(
      LEGADO.deterministic.score,
    );
  });

  it("a parcela autodeclarada aparece e vale 28 de 194", () => {
    const sinais = decompor(checks).find((x) => x.categoria === "sinais");
    expect(sinais).toBeDefined();
    expect(sinais!.possivel).toBe(28);
  });
});
