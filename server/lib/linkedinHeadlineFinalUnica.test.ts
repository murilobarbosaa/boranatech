import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CHECKS = readFileSync(`${import.meta.dirname}/linkedinChecks.ts`, "utf8");

describe("headline efetiva tem uma única resolução", () => {
  it("linkedinChecks resolve uma vez e persiste o mesmo valor", () => {
    const resolucoes = CHECKS.match(/headlineFinalDe\(/g) ?? [];
    expect(resolucoes).toHaveLength(1);
    expect(CHECKS).toContain('const headline = headlineFinal ?? ""');
    expect(CHECKS).toContain("headlineParecCortada(");
    expect(CHECKS).toContain("headlineFinal,");
    expect(CHECKS).toContain('statusDaRegiao === "ambiguous"');
    expect(CHECKS).toContain("headline: headlineFinal,");
  });

  it("nenhum avaliador volta a ler parsed.headline", () => {
    const inicio = CHECKS.indexOf("const evaluators");
    const fim = CHECKS.indexOf("\n  };", inicio);
    expect(inicio).toBeGreaterThan(-1);
    expect(fim).toBeGreaterThan(inicio);
    expect(CHECKS.slice(inicio, fim)).not.toContain("parsed.headline");
  });
});
