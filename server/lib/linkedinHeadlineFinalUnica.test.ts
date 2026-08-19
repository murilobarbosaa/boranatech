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

  it("o arquivo INTEIRO tem exatamente um leitor de parsed.headline", () => {
    // Leitor novo em qualquer lugar do arquivo muda a contagem e falha aqui, e
    // nao so dentro de `evaluators`, que era o escopo antigo deste guard.
    // A fronteira `(?![A-Za-z0-9_$])` existe porque `parsed.headlineRegion` e
    // `parsed.headlineContexto` compartilham o prefixo e sao outros campos:
    // conta-los daria 3 e o numero deixaria de significar o que afirma.
    const leitores = CHECKS.match(/parsed\.headline(?![A-Za-z0-9_$])/g) ?? [];
    expect(leitores).toHaveLength(1);
    expect(CHECKS).toContain(
      "headlineFinalDe(parsed.headline, input.headlineManual)",
    );
  });

  it("nenhum avaliador volta a ler parsed.headline", () => {
    const inicio = CHECKS.indexOf("const evaluators");
    const fim = CHECKS.indexOf("\n  };", inicio);
    expect(inicio).toBeGreaterThan(-1);
    expect(fim).toBeGreaterThan(inicio);
    expect(CHECKS.slice(inicio, fim)).not.toContain("parsed.headline");
  });
});
