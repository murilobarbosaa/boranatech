import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { readDeterministic } from "./readDeterministic";
import { DETERMINISTIC_VERSION } from "./schema";

// Mesma fixture legada real usada em readQualitative.test.ts: a linha
// `cf02e168-...` de linkedin_analyses, com PII trocada.
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
) as { deterministic: unknown; deterministicVersion?: number };

describe("readDeterministic: linha legada real", () => {
  it("a fixture nao tem carimbo de versao", () => {
    expect(LEGADO.deterministicVersion).toBeUndefined();
  });

  it("le as tres listas do conjunto minimo sem lancar", () => {
    const view = readDeterministic(
      LEGADO.deterministic,
      LEGADO.deterministicVersion,
    );
    expect(view.keywordsEncontradas.length).toBeGreaterThan(0);
    expect(view.keywordsFaltantes.length).toBeGreaterThan(0);
    expect(view.titulosIngles.length).toBeGreaterThan(0);
    expect(view.camposAusentes).toEqual([]);
    expect(view.version).toBe(DETERMINISTIC_VERSION);
  });

  it("titulosIngles mantem o shape que a UI mapeia", () => {
    const view = readDeterministic(LEGADO.deterministic);
    for (const t of view.titulosIngles) {
      expect(typeof t.titulo).toBe("string");
      expect(typeof t.encontrado).toBe("boolean");
    }
  });
});

describe("readDeterministic: entradas degradadas", () => {
  // Este e o cenario que motivou a funcao: o RecruiterFinder faz
  // keywordsEncontradas.length, keywordsFaltantes.map e titulosIngles.map.
  // Com o campo ausente, o acesso direto lanca e a pagina inteira do resultado
  // vira tela branca.
  it("campo ausente vira lista vazia e entra em camposAusentes", () => {
    const view = readDeterministic({ keywordsEncontradas: ["React"] });
    expect(view.keywordsEncontradas).toEqual(["React"]);
    expect(view.keywordsFaltantes).toEqual([]);
    expect(view.titulosIngles).toEqual([]);
    expect(view.camposAusentes).toEqual([
      "keywordsFaltantes",
      "titulosIngles",
    ]);
  });

  it("as tres listas sao sempre iteraveis, nunca undefined", () => {
    for (const lixo of [null, undefined, 42, "texto", [], { titulosIngles: "nao e array" }]) {
      const view = readDeterministic(lixo);
      expect(() => {
        view.keywordsEncontradas.length;
        view.keywordsFaltantes.map((x) => x);
        view.titulosIngles.map((x) => x.titulo);
      }).not.toThrow();
    }
  });

  it("NUNCA lanca", () => {
    for (const lixo of [null, undefined, 0, "", [], {}, { keywordsEncontradas: 7 }]) {
      expect(() => readDeterministic(lixo)).not.toThrow();
    }
  });
});
