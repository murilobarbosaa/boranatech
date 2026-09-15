import { describe, expect, it } from "vitest";
import { roadmapsV2 } from "../shared/roadmapV2/content";
import {
  capabilityOf,
  LANGUAGE_CAPABILITIES,
} from "./languageCapabilities.mts";
import { IMPORT_FREE_LANGUAGES } from "./quizPoolGeneration.mts";
import { runnerFor } from "./verifyQuizPoolByExecution.mts";

describe("LANGUAGE_CAPABILITIES: capacidade por linguagem num lugar so", () => {
  it("cobre toda linguagem que alguma trilha declara em codeLanguages", () => {
    const declaradas = Array.from(
      new Set(roadmapsV2.flatMap((roadmap) => roadmap.codeLanguages ?? [])),
    );
    expect(declaradas.length).toBeGreaterThan(0);
    declaradas.forEach((lang) =>
      expect(Object.keys(LANGUAGE_CAPABILITIES)).toContain(lang),
    );
  });

  it("linguagem fora do mapa e erro de configuracao com mensagem clara", () => {
    expect(() => capabilityOf("cobol")).toThrow(/cobol.*LANGUAGE_CAPABILITIES/);
    expect(() => runnerFor("cobol")).toThrow(/cobol/);
  });

  it("runner: js no node, python no python3, ts no wrapper; marcacao e ferramenta sem runner", () => {
    expect(runnerFor("js")).toEqual({ command: "node", ext: ".mjs" });
    expect(runnerFor("python")).toEqual({ command: "python3", ext: ".py" });
    // Lote 10a: ts saiu da lista dos sem runner. O wrapper confere os tipos
    // antes de executar, e e por isso que o runner nao e o tsx direto.
    const ts = runnerFor("ts");
    expect(ts?.command).toBe("node");
    expect(ts?.ext).toBe(".ts");
    expect(ts?.args?.[0]).toMatch(/runTsSnippet\.mjs$/);
    ["bash", "html", "css", "dockerfile"].forEach((lang) =>
      expect(runnerFor(lang)).toBeNull(),
    );
  });

  it("regra de import vem do mapa", () => {
    expect([...IMPORT_FREE_LANGUAGES].sort()).toEqual(["js", "python", "ts"]);
    expect(capabilityOf("python").importRule).toBe("stdlib-allowlist");
    expect(capabilityOf("js").importRule).toBe("forbidden");
    ["bash", "html", "css", "dockerfile"].forEach((lang) =>
      expect(capabilityOf(lang).importRule).toBe("nao-se-aplica"),
    );
  });
});

describe("saidaEsperadaAplicavel por linguagem", () => {
  it("so nao se aplica onde nao ha saida de terminal; bash mantem", () => {
    ["js", "ts", "python", "bash"].forEach((lang) =>
      expect(capabilityOf(lang).saidaEsperadaAplicavel).toBe(true),
    );
    ["html", "css", "dockerfile"].forEach((lang) =>
      expect(capabilityOf(lang).saidaEsperadaAplicavel).toBe(false),
    );
  });
});

describe("saidaDeFerramenta por linguagem", () => {
  it("so bash e dockerfile tem saida de ferramenta", () => {
    ["bash", "dockerfile"].forEach((lang) =>
      expect(capabilityOf(lang).saidaDeFerramenta).toBe(true),
    );
    ["js", "ts", "python", "html", "css"].forEach((lang) =>
      expect(capabilityOf(lang).saidaDeFerramenta).toBe(false),
    );
  });
});
