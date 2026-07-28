import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * `Content-Type` só quando há corpo, em TODOS os call sites do módulo.
 *
 * Por que um teste de fonte e não de comportamento: `apiFetch` é interna,
 * `FavoritesContext` só é montável com Auth, Supabase e rede em volta, e o que
 * precisa ser garantido é uma propriedade do FUNIL, não de uma chamada. A
 * guarda mora dentro de `apiFetch` (uma linha, `options?.body === undefined`),
 * então ela cobre os 7 call sites por construção, inclusive os que ainda não
 * existem. Este teste protege a guarda, não cada chamador.
 *
 * O bug: `GET /api/bookmarks/` com `Content-Type: application/json` fez o
 * `express.json()` tentar ler um corpo inexistente e devolver 500
 * (`stream is not readable`, Sentry NODE-EXPRESS-B).
 */

const FONTE = readFileSync(
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "FavoritesContext.tsx",
  ),
  "utf8",
);

describe("FavoritesContext.apiFetch", () => {
  it("condiciona o Content-Type à presença de corpo", () => {
    expect(FONTE).toContain('options?.body === undefined');
    expect(FONTE).toMatch(
      /options\?\.body === undefined\s*\?\s*\{\}\s*:\s*\{\s*"Content-Type": "application\/json"\s*\}/,
    );
  });

  it("NÃO existe Content-Type incondicional no módulo", () => {
    // Asserção do TOTAL, não da pertinência: conta as ocorrências do header no
    // arquivo inteiro. Se alguém acrescentar um `fetch` novo com o header solto,
    // o número muda e este teste cai, mesmo que o `apiFetch` continue correto.
    const ocorrencias = FONTE.match(/"Content-Type"/g) ?? [];
    expect(
      ocorrencias,
      `esperado exatamente 1 (a do funil condicional), achei ${ocorrencias.length}`,
    ).toHaveLength(1);
  });

  it("todos os call sites passam pelo funil, nenhum chama fetch direto", () => {
    // `fetch(` só pode aparecer uma vez: dentro de `apiFetch`.
    const chamadas = FONTE.match(/[^a-zA-Z.]fetch\(/g) ?? [];
    expect(
      chamadas,
      `esperado 1 fetch (o do funil), achei ${chamadas.length}`,
    ).toHaveLength(1);
  });
});
