import { describe, expect, it } from "vitest";

import { COMPETENCIAS_NO_EXPORT, competenciasDoPdf } from "./competenciasDoPdf";

describe("competenciasDoPdf", () => {
  it("deixa intacta a lista normal do export", () => {
    const normal = ["TypeScript", "Git", "GitLab", "Docker", "PostgreSQL"];
    const r = competenciasDoPdf(normal);
    expect(r.aceitas).toEqual(normal);
    expect(r.descartadas).toEqual([]);
  });

  it("competência legítima com nome próprio não é descartada por heurística lexical", () => {
    // O criterio lexical descartado errava exatamente aqui. Nenhum destes tem
    // como ser cortado, porque o filtro nao le o texto.
    const comCaraDeNome = ["Kanban", "Bootstrap", "Ruby on Rails"];
    const r = competenciasDoPdf(comCaraDeNome);
    expect(r.aceitas).toEqual(comCaraDeNome);
    expect(r.descartadas).toEqual([]);
  });

  it("lista legítima com seis ou mais oferece as cinco primeiras", () => {
    const r = competenciasDoPdf([
      "AI Agents",
      "Vector Databases",
      "Retrieval-Augmented Generation",
      "(RAG)",
      "Python",
      "FastAPI",
    ]);
    expect(r.aceitas).toEqual([
      "AI Agents",
      "Vector Databases",
      "Retrieval-Augmented Generation",
      "(RAG)",
      "Python",
    ]);
    expect(r.descartadas.map((d) => d.valor)).toEqual(["FastAPI"]);
  });

  it("o descarte é rastreável: diz o valor e o motivo", () => {
    const r = competenciasDoPdf(["a", "b", "c", "d", "e", "f"]);
    expect(r.descartadas).toHaveLength(1);
    expect(r.descartadas[0].valor).toBe("f");
    expect(r.descartadas[0].motivo).toContain("posição 6");
  });

  it("o limite do prefill e cinco", () => {
    expect(COMPETENCIAS_NO_EXPORT).toBe(5);
  });

  it("tolera null, undefined, vazio e entrada só com espaço", () => {
    expect(competenciasDoPdf(null).aceitas).toEqual([]);
    expect(competenciasDoPdf(undefined).aceitas).toEqual([]);
    expect(competenciasDoPdf([]).aceitas).toEqual([]);
    expect(competenciasDoPdf(["  ", "Git"]).aceitas).toEqual(["Git"]);
  });
});
