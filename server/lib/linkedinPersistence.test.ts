import { describe, expect, it } from "vitest";

import {
  LINKEDIN_SKILLS_MAX,
  LinkedinAnalyzeRequestSchema,
} from "../../shared/linkedin/schema";
import {
  montarLinkedinInputPersistido,
  skillsParaPersistir,
} from "./linkedinPersistence";

const REQUEST = {
  profileText: "x".repeat(300),
  area: "backend",
  level: "pleno",
  mercado: "brasil",
  skills: "TypeScript",
  foto: "sim",
  banner: "sim",
  openToWork: "nao",
  conexoes: "500-mais",
  atividade: "semanal",
  entryPath: "pdf",
  headlineManual: "Backend Engineer | TypeScript | Node.js",
} as const;

describe("persistência de skills respeita o contrato", () => {
  it("preserva todos os 3000 caracteres aceitos", () => {
    const skills = "s".repeat(LINKEDIN_SKILLS_MAX);
    expect(skillsParaPersistir(skills)).toBe(skills);
  });

  it("o schema e a persistência compartilham o mesmo teto", () => {
    const base = {
      profileText: "x".repeat(300),
      area: "backend",
      level: "pleno",
      mercado: "brasil",
      foto: "sim",
      banner: "sim",
      openToWork: "nao",
      conexoes: "500-mais",
      atividade: "semanal",
    };
    expect(
      LinkedinAnalyzeRequestSchema.safeParse({
        ...base,
        skills: "s".repeat(LINKEDIN_SKILLS_MAX),
      }).success,
    ).toBe(true);
    expect(
      LinkedinAnalyzeRequestSchema.safeParse({
        ...base,
        skills: "s".repeat(LINKEDIN_SKILLS_MAX + 1),
      }).success,
    ).toBe(false);
  });

  it("persiste entryPath, hash e headline efetiva sem texto bruto", () => {
    const input = montarLinkedinInputPersistido(
      REQUEST,
      {
        deterministic: {
          headline: REQUEST.headlineManual,
          sobreTamanho: 500,
          experienciasContagem: 2,
        },
      },
      { headlineContexto: null, skillsPdf: ["TypeScript"] },
      "a".repeat(64),
    );
    expect(input.entryPath).toBe("pdf");
    expect(input.textoHash).toBe("a".repeat(64));
    expect(input.parseResumo.headline).toBe(REQUEST.headlineManual);
    expect(input.parseResumo.headlineOrigem).toBe("manual");
    expect(input).not.toHaveProperty("profileText");
  });

  it("request antigo persiste entryPath nulo e origem parser", () => {
    const {
      entryPath: _entryPath,
      headlineManual: _headline,
      ...oldRequest
    } = REQUEST;
    const input = montarLinkedinInputPersistido(
      oldRequest,
      {
        deterministic: {
          headline: "Backend Engineer",
          sobreTamanho: 0,
          experienciasContagem: 0,
        },
      },
      { headlineContexto: undefined, skillsPdf: [] },
      "b".repeat(64),
    );
    expect(input.entryPath).toBeNull();
    expect(input.parseResumo.headlineOrigem).toBe("parser");
  });

  it("headline manual só com espaços mantém origem parser", () => {
    const input = montarLinkedinInputPersistido(
      { ...REQUEST, headlineManual: "     " },
      {
        deterministic: {
          headline: "Backend Engineer",
          sobreTamanho: 0,
          experienciasContagem: 0,
        },
      },
      { headlineContexto: null, skillsPdf: [] },
      "c".repeat(64),
    );
    expect(input.parseResumo.headlineOrigem).toBe("parser");
  });

  it("não persiste identidade como skills quando a fronteira é inconclusiva", () => {
    const input = montarLinkedinInputPersistido(
      REQUEST,
      {
        deterministic: {
          headline: REQUEST.headlineManual,
          sobreTamanho: 0,
          experienciasContagem: 0,
        },
      },
      {
        headlineContexto: null,
        skillsPdf: ["React", "Joana Teste", "São Paulo"],
        skillsPdfConfiaveis: false,
      },
      "d".repeat(64),
    );
    expect(input.parseResumo.skillsPdf).toEqual([]);
    expect(input.parseResumo.skillsPdfRevisaoNecessaria).toBe(true);
  });
});
