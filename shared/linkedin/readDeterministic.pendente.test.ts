import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { readDeterministic } from "./readDeterministic";

/**
 * Ausência NUNCA chega a ser interpretada como valor.
 *
 * `pendente` e `notaIncompleta` são os únicos campos deste payload cuja
 * ausência significaria "completo"; os outros três opcionais (`entryPath`,
 * `textoHash`, `headlineContexto`) significam "não sabemos". Quatro opcionais
 * no mesmo objeto com semântica invertida em dois deles é como se erra: quem
 * consome lê `undefined` e escolhe a interpretação errada metade das vezes.
 *
 * A contramedida não é comentário no consumidor: é normalizar em UM ponto, e
 * fazer o tipo da view devolver booleano. Este arquivo prova que a linha real
 * mais antiga que existe sai `false`, e não `undefined`.
 */

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
);

describe("readDeterministic: linha legada real", () => {
  it("a fixture NAO tem os campos novos (nao e um false escrito)", () => {
    const bruto = LEGADO.deterministic ?? LEGADO;
    expect("notaIncompleta" in bruto).toBe(false);
    expect(bruto.notaIncompleta).toBeUndefined();
    const checks = bruto.checks ?? [];
    expect(checks.length).toBeGreaterThan(0);
    expect(
      checks.every((c: { pendente?: boolean }) => !("pendente" in c)),
    ).toBe(true);
  });

  it("sai FALSE e vazio, nunca undefined", () => {
    const view = readDeterministic(LEGADO.deterministic ?? LEGADO, 1);
    expect(view.notaIncompleta).toBe(false);
    expect(view.notaIncompleta).not.toBeUndefined();
    expect(view.checksPendentes).toEqual([]);
  });

  it("o tipo da view e booleano, entao o consumidor nao ve opcional", () => {
    const view = readDeterministic(LEGADO.deterministic ?? LEGADO, 1);
    expect(typeof view.notaIncompleta).toBe("boolean");
    expect(Array.isArray(view.checksPendentes)).toBe(true);
  });
});

describe("readDeterministic: linha nova, com os campos", () => {
  const check = (
    id: string,
    tier: "essencial" | "importante" | "opcional",
    aprovado: boolean,
    pendente?: boolean,
  ) => ({
    id,
    label: id,
    category: id.startsWith("headline")
      ? ("headline" as const)
      : ("sobre" as const),
    tier,
    aprovado,
    detail: "Detalhe persistido.",
    pendente,
  });
  const novo = {
    notaIncompleta: true,
    checks: [
      check("headline-existe", "essencial", true, true),
      check("headline-stack", "importante", false, true),
      check("sobre-tamanho", "essencial", true, false),
      {
        ...check("foto-profissional", "opcional", true),
        category: "sinais" as const,
      },
    ],
  };

  it("preserva true e lista so os pendentes", () => {
    const view = readDeterministic(novo, 7);
    expect(view.notaIncompleta).toBe(true);
    expect(view.checksPendentes).toEqual(["headline-existe", "headline-stack"]);
  });

  it("`pendente: false` e `pendente` ausente sao a mesma coisa na leitura", () => {
    const view = readDeterministic(novo, 7);
    expect(view.checksPendentes).not.toContain("sobre-tamanho");
    expect(view.checksPendentes).not.toContain("foto-profissional");
  });
});

describe("readDeterministic: entrada corrompida", () => {
  it("lixo total nao lanca e sai com os defaults seguros", () => {
    for (const entrada of [null, undefined, 42, "texto", [], {}]) {
      const view = readDeterministic(entrada, 7);
      expect(view.notaIncompleta).toBe(false);
      expect(view.checksPendentes).toEqual([]);
    }
  });

  it("notaIncompleta com tipo errado nao vira true por coercao", () => {
    // `"true"` (string) e `1` sao truthy em JS. O schema recusa, e o `=== true`
    // fecha a porta: so booleano verdadeiro conta.
    expect(
      readDeterministic({ notaIncompleta: "true" }, 7).notaIncompleta,
    ).toBe(false);
    expect(readDeterministic({ notaIncompleta: 1 }, 7).notaIncompleta).toBe(
      false,
    );
  });
});
