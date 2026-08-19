import { describe, expect, it } from "vitest";

import {
  analiseAnteriorComparavel,
  analisesSaoComparaveis,
  LINKEDIN_COMPARACAO_VERSION,
  type LinkedinAnaliseComparavel,
} from "./comparabilidade";
import type { LinkedinAnalysisSummary } from "./schema";

const HASH = "a".repeat(64);
const BASE: LinkedinAnaliseComparavel = {
  textoHash: HASH,
  area: "frontend",
  level: "pleno",
  mercado: "brasil",
  headlineComparacao: "Frontend Developer | Vue.js",
  headlineOrigem: "manual",
  skillsComparacao: "Vue.js, TypeScript",
  foto: "sim",
  banner: "sim",
  openToWork: "nao",
  conexoes: "100-500",
  atividade: "semanal",
  deterministicVersion: 8,
  qualitativeVersion: 3,
  comparacaoVersion: LINKEDIN_COMPARACAO_VERSION,
};

describe("comparabilidade conservadora do histórico", () => {
  it("mesmo hash e mesmos inputs/versões são comparáveis", () => {
    expect(analisesSaoComparaveis(BASE, { ...BASE })).toBe(true);
  });

  it.each([
    ["area", "backend"],
    ["level", "junior"],
    ["mercado", "exterior"],
    ["headlineComparacao", "Frontend Developer | React"],
    ["headlineOrigem", "parser"],
    ["skillsComparacao", "Vue.js"],
    ["foto", "nao"],
    ["banner", "nao"],
    ["openToWork", "sim"],
    ["conexoes", "500-mais"],
    ["atividade", "diaria"],
  ] as const)("hash igual não basta quando %s diverge", (campo, valor) => {
    expect(
      analisesSaoComparaveis(BASE, { ...BASE, [campo]: valor }),
    ).toBe(false);
  });

  it("v7 e v8 nunca produzem comparação automática", () => {
    expect(
      analisesSaoComparaveis(BASE, {
        ...BASE,
        deterministicVersion: 7,
      }),
    ).toBe(false);
  });

  it("versão qualitativa ou assinatura ausente também suprime", () => {
    expect(
      analisesSaoComparaveis(BASE, { ...BASE, qualitativeVersion: 2 }),
    ).toBe(false);
    expect(
      analisesSaoComparaveis(BASE, { ...BASE, comparacaoVersion: null }),
    ).toBe(false);
  });

  it("seleciona somente a anterior realmente comparável", () => {
    const analyses: LinkedinAnalysisSummary[] = [
      {
        id: "mesmo-hash-input-diferente",
        score: 50,
        faixa: "em-construcao",
        created_at: "2026-08-15T12:00:00Z",
        ...BASE,
        area: "dados",
        level: "pleno",
      },
      {
        id: "comparavel",
        score: 60,
        faixa: "em-construcao",
        created_at: "2026-08-14T12:00:00Z",
        ...BASE,
        area: "frontend",
        level: "pleno",
      },
    ];
    expect(analiseAnteriorComparavel(analyses, BASE)?.id).toBe("comparavel");
  });
});
