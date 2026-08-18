import { describe, expect, it } from "vitest";

import {
  HEADLINE_MANUAL_MAX,
  LinkedinAnalyzeRequestSchema,
} from "../../shared/linkedin/schema";
import { headlineManualLonga } from "../lib/linkedinHeadlineManual";

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
};

describe("validação server-side da headline manual", () => {
  it("aceita exatamente o teto e recusa um caractere acima", () => {
    expect(headlineManualLonga("x".repeat(HEADLINE_MANUAL_MAX))).toBeNull();
    expect(headlineManualLonga("x".repeat(HEADLINE_MANUAL_MAX + 1))).toEqual({
      tamanho: HEADLINE_MANUAL_MAX + 1,
      limite: HEADLINE_MANUAL_MAX,
    });
  });

  it("o schema usa o mesmo teto e mantém o campo opcional", () => {
    expect(LinkedinAnalyzeRequestSchema.safeParse(REQUEST).success).toBe(true);
    expect(
      LinkedinAnalyzeRequestSchema.safeParse({
        ...REQUEST,
        headlineManual: "x".repeat(HEADLINE_MANUAL_MAX + 1),
      }).success,
    ).toBe(false);
  });
});
