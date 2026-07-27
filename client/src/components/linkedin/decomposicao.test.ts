import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  LINKEDIN_CATEGORIES,
  TIER_WEIGHTS,
  type LinkedinCheckResult,
} from "@shared/linkedin/schema";
import {
  decomporNota,
  parcelaAutodeclarada,
} from "@shared/linkedin/reguaV2";

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

/**
 * A MESMA funcao que o hero chama, nao uma copia dela.
 *
 * A primeira versao deste teste replicava a conta, e por isso so pegava mudanca
 * de shape: mexer na matematica mudaria as duas copias juntas e o teste
 * continuaria verde. Mesma classe de defeito do resto da auditoria.
 */
const decompor = (checks: LinkedinCheckResult[]) =>
  decomporNota(checks, TIER_WEIGHTS, LINKEDIN_CATEGORIES);

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
    expect(parcelaAutodeclarada(decompor(checks))).toBe(28);
  });

  it("a conta e a MESMA que o hero usa, nao uma copia", () => {
    // Guard contra o teste voltar a replicar a matematica: se o hero deixar de
    // chamar `decomporNota`, este teste passa a cobrir codigo que ninguem roda.
    const hero = readFileSync(
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "LinkedinScoreHero.tsx",
      ),
      "utf8",
    );
    expect(hero).toContain("decomporNota(");
    expect(hero).toContain("parcelaAutodeclarada(");
    // E o hero NAO pode ter a conta de novo dentro dele.
    expect(hero).not.toContain("LINKEDIN_CATEGORIES.map(");
  });
});
