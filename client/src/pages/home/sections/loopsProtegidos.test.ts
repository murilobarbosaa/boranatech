import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * TODO LOOP INFINITO DA HOME PASSA POR movimentoContinuo (lote Home 03, item C).
 *
 * Sob reduced motion nada se move, e quem garante isso nos loops do framer e o
 * helper `movimentoContinuo`, que para o loop no primeiro quadro. Um loop novo
 * escrito sem ele voltaria a se mexer para quem pediu o contrario, sem erro
 * nenhum. Este teste le a fonte (jsdom nao anima, entao o efeito nao da para
 * medir aqui) e afirma a premissa.
 *
 * Arquivo `.ts`, e nao dentro do teste de componente, pelo mesmo motivo do
 * overlayZIndex.test.ts: e onde `import.meta.dirname` aponta para o disco.
 */

const SECOES = path.resolve(import.meta.dirname);

function fontesDasSecoes(): string[] {
  return readdirSync(SECOES)
    .filter((f) => f.endsWith(".tsx") && !f.includes(".test."))
    .map((f) => readFileSync(path.join(SECOES, f), "utf8"));
}

function contar(fontes: string[], padrao: RegExp): number {
  return fontes.reduce((n, s) => n + (s.match(padrao) ?? []).length, 0);
}

describe("loops infinitos da home sob reduced motion", () => {
  it("cada `repeat: Infinity` tem o seu movimentoContinuo, e o total e afirmado", () => {
    const fontes = fontesDasSecoes();
    const loops = contar(fontes, /repeat:\s*Infinity/g);
    const protegidos = contar(fontes, /movimentoContinuo\(/g);

    // Total escrito a mao: um parser que encolhesse em silencio passaria a
    // igualdade com 0 = 0, e foi exatamente isso que aconteceu na primeira
    // versao deste teste. Loop novo muda este numero no mesmo commit.
    expect(fontes.length).toBeGreaterThan(10);
    expect(loops).toBe(14);
    expect(protegidos).toBe(loops);
  });
});
