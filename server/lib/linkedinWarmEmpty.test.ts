import { describe, expect, it, vi } from "vitest";

import {
  LinkedinQualitativeSchema,
  type LinkedinDeterministicResult,
  type Mercado,
} from "../../shared/linkedin/schema";

vi.mock("./env", () => ({
  env: { openaiApiKey: "test", billingEnabled: false },
}));

import { warmEmptyQualitative } from "./linkedinAnalyze";

const DETERMINISTIC: LinkedinDeterministicResult = {
  score: 0,
  faixa: "inicio",
  notaIncompleta: false,
  checks: [],
  keywordsEncontradas: [],
  keywordsFaltantes: ["React", "TypeScript"],
  titulosIngles: [],
  headline: null,
  sobreTamanho: 0,
  experienciasContagem: 0,
  skillsContagem: 0,
};

describe("warmEmptyQualitative", () => {
  it.each(["brasil", "exterior", "ambos"] as Mercado[])(
    "cumpre o contrato honesto para mercado %s",
    (mercado) => {
      const value = warmEmptyQualitative(
        { area: "frontend", level: "pleno", mercado, skills: "React" },
        { formacao: ["Engenharia"], certificacoes: [], experiencias: [] },
        DETERMINISTIC,
      );
      expect(LinkedinQualitativeSchema.safeParse(value).success).toBe(true);
      expect(value.pontosFortes).toEqual([]);
      expect(value.pontosFracos).toHaveLength(3);
      expect(value.melhorias).toHaveLength(4);
      expect(value.headlines).toHaveLength(3);
      expect(value.bulletsReescritos).toEqual([]);
      expect(value.skillsParaEstudar).toEqual(["React", "TypeScript"]);

      const allText = JSON.stringify(value).toLowerCase();
      expect(allText).not.toContain("apaixonado por tecnologia");
      expect(allText).not.toContain("em busca de oportunidades");
      expect(allText).not.toContain("pratico todos os dias");
      expect(allText).not.toContain("todo mundo começa");
      expect(allText).not.toContain("praticamente em branco");
      expect(value.resumo).toContain("nível Pleno informado no formulário");
      expect(value.resumo).toContain("não basta para inferir senioridade");
    },
  );

  it("usa inglês nos campos para colar no mercado exterior", () => {
    const value = warmEmptyQualitative(
      { area: "frontend", level: "pleno", mercado: "exterior", skills: "" },
      { formacao: [], certificacoes: [], experiencias: [] },
      DETERMINISTIC,
    );
    expect(
      value.headlines.every(
        (headline) =>
          headline.includes("Target role") ||
          headline.includes("Profile in progress") ||
          headline.includes("Focused on"),
      ),
    ).toBe(true);
    expect(value.sobreReescrito).toContain("I am structuring my profile");
    expect(value.modeloMensagemRecrutador).toContain("Hello, [name]");
    expect(value.resumo).toContain("Não encontrei informações suficientes");
  });
});
