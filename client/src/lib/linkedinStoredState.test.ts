import { describe, expect, it } from "vitest";

import {
  decodeLinkedinStoredState,
  encodeLinkedinStoredState,
  LINKEDIN_STORAGE_SHAPE_VERSION,
} from "./linkedinStoredState";

const HASH = "a".repeat(64);
const RESULT = {
  area: "frontend",
  level: "junior",
  mercado: "brasil",
  deterministic: { score: 42, faixa: "em-construcao", checks: [] },
  qualitative: {},
};

describe("restauração do sessionStorage do LinkedIn", () => {
  it("JSON inválido, raiz inválida e versão incompatível são descartados", () => {
    expect(decodeLinkedinStoredState("{")).toBeNull();
    expect(decodeLinkedinStoredState("[]")).toBeNull();
    expect(
      decodeLinkedinStoredState(JSON.stringify({ version: 999, form: {} })),
    ).toBeNull();
  });

  it("restaura resultado atual validado, id e hash", () => {
    const decoded = decodeLinkedinStoredState(
      JSON.stringify({
        version: LINKEDIN_STORAGE_SHAPE_VERSION,
        form: { profileText: "perfil" },
        result: RESULT,
        analysisId: "analysis-1",
        textoHash: HASH,
        headlineManual: "  Frontend Developer | Vue.js  ",
      }),
    );
    expect(decoded?.result?.deterministic.score).toBe(42);
    expect(decoded?.analysisId).toBe("analysis-1");
    expect(decoded?.textoHash).toBe(HASH);
    expect(decoded?.headlineManual).toBe("Frontend Developer | Vue.js");
  });

  it("estrutura de resultado inválida não derruba nem restaura metadados órfãos", () => {
    const decoded = decodeLinkedinStoredState(
      JSON.stringify({
        version: LINKEDIN_STORAGE_SHAPE_VERSION,
        form: { profileText: "ainda recuperável" },
        result: { deterministic: "corrompido" },
        analysisId: "analysis-1",
        textoHash: HASH,
      }),
    );
    expect(decoded?.form).toEqual({ profileText: "ainda recuperável" });
    expect(decoded?.result).toBeNull();
    expect(decoded?.analysisId).toBeNull();
    expect(decoded?.textoHash).toBeNull();
  });

  it("versões 2, 3 e 4 continuam legíveis sem inventar headline manual", () => {
    for (const version of [2, 3, 4]) {
      const decoded = decodeLinkedinStoredState(
        JSON.stringify({
          version,
          form: {},
          result: RESULT,
          analysisId: "old",
        }),
      );
      expect(decoded?.result).not.toBeNull();
      expect(decoded?.textoHash).toBeNull();
      expect(decoded?.analysisId).toBe(version >= 3 ? "old" : null);
      expect(decoded?.headlineManual).toBeNull();
    }
  });

  it("editar, salvar e restaurar preserva a headline manual normalizada", () => {
    const raw = encodeLinkedinStoredState({
      form: { profileText: "perfil" },
      result: null,
      analysisId: null,
      textoHash: null,
      headlineManual: "  Frontend Developer | Vue.js  ",
    });

    expect(decodeLinkedinStoredState(raw)?.headlineManual).toBe(
      "Frontend Developer | Vue.js",
    );
  });

  it("espaços e valor acima do limite degradam para ausência", () => {
    for (const headlineManual of ["     ", "x".repeat(251), 42]) {
      const decoded = decodeLinkedinStoredState(
        JSON.stringify({
          version: LINKEDIN_STORAGE_SHAPE_VERSION,
          form: {},
          result: null,
          headlineManual,
        }),
      );
      expect(decoded?.headlineManual).toBeNull();
    }
  });
});
