import { describe, expect, it } from "vitest";

import { parseProjectProgressState } from "./progressState";

const ETAPAS = ["planejar", "html", "css"] as const;
const ISO = "2026-09-05T07:00:00.000Z";

describe("parseProjectProgressState", () => {
  it("aceita o state antigo { done: true } e devolve etapas vazias", () => {
    // Contrato de compatibilidade: as linhas que ja existem em producao tem
    // exatamente esta forma, e nenhuma pode virar invalida.
    const r = parseProjectProgressState({ done: true }, ETAPAS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ done: true, etapas: {} });
  });

  it("aceita objeto vazio como nao concluido", () => {
    const r = parseProjectProgressState({}, ETAPAS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ done: false, etapas: {} });
  });

  it("aceita etapas validas e normaliza a data", () => {
    const r = parseProjectProgressState(
      { done: false, etapas: { html: "2026-09-05T07:00:00Z" } },
      ETAPAS,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ done: false, etapas: { html: ISO } });
  });

  it("recusa etapa fora da lista, nomeando a chave", () => {
    const r = parseProjectProgressState({ etapas: { naoExiste: ISO } }, ETAPAS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("naoExiste");
  });

  it("recusa etapas em projeto sem detalhe v2", () => {
    const r = parseProjectProgressState({ etapas: { html: ISO } }, null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("sem detalhe v2");
  });

  it("aceita etapas vazias em projeto sem detalhe v2", () => {
    // O client manda o state completo sempre; `etapas: {}` num projeto v1 e o
    // caso normal, nao um erro.
    const r = parseProjectProgressState({ done: true, etapas: {} }, null);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ done: true, etapas: {} });
  });

  it("recusa valor de etapa que nao e data ISO", () => {
    for (const valor of ["ontem", "", 123, null, true]) {
      const r = parseProjectProgressState({ etapas: { html: valor } }, ETAPAS);
      expect(r.ok, `aceitou ${JSON.stringify(valor)}`).toBe(false);
      if (!r.ok) expect(r.reason).toContain("html");
    }
  });

  it("recusa array, null e primitivo no lugar do state", () => {
    for (const v of [[], null, 1, "x", true]) {
      const r = parseProjectProgressState(v, ETAPAS);
      expect(r.ok, `aceitou ${JSON.stringify(v)}`).toBe(false);
    }
  });

  it("recusa etapas que nao e objeto", () => {
    for (const v of [[], null, "x", 1]) {
      const r = parseProjectProgressState({ etapas: v }, ETAPAS);
      expect(r.ok, `aceitou etapas=${JSON.stringify(v)}`).toBe(false);
    }
  });

  it("recusa done nao booleano", () => {
    const r = parseProjectProgressState({ done: "sim" }, ETAPAS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("done");
  });

  it("state ausente vira o estado zerado", () => {
    const r = parseProjectProgressState(undefined, ETAPAS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ done: false, etapas: {} });
  });
});
