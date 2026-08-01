import { describe, expect, it } from "vitest";

import {
  calcularVariacao,
  parseOverviewWindow,
  resolverJanela,
  type Janela,
} from "./overviewWindow";

/**
 * A parte do card que decide se EXISTE Δ.
 *
 * É a decisão que não pode errar: card sem Δ é honesto, card com Δ falso não —
 * quem lê não tem como desconfiar de um número que parece calculado.
 */

const AGORA = new Date("2026-07-31T12:00:00Z");

describe("parseOverviewWindow", () => {
  it("aceita as três janelas oferecidas", () => {
    expect(parseOverviewWindow("7")).toBe("7");
    expect(parseOverviewWindow("30")).toBe("30");
    expect(parseOverviewWindow("all")).toBe("all");
  });

  it("90 dias NÃO é oferecida e cai no padrão", () => {
    // A série tem 16 dias; oferecer 90 seria preencher com mentira.
    expect(parseOverviewWindow("90")).toBe("30");
  });

  it("lixo e ausência caem no padrão, sem erro", () => {
    expect(parseOverviewWindow("")).toBe("30");
    expect(parseOverviewWindow(undefined)).toBe("30");
    expect(parseOverviewWindow(7)).toBe("30");
  });
});

describe("resolverJanela", () => {
  it("30 dias produz o período e o ANTERIOR do mesmo tamanho", () => {
    const j = resolverJanela("30", AGORA);
    expect(j.startIso).toBe("2026-07-01T12:00:00.000Z");
    expect(j.endIso).toBe("2026-07-31T12:00:00.000Z");
    expect(j.previousStartIso).toBe("2026-06-01T12:00:00.000Z");
    expect(j.previousEndIso).toBe(j.startIso);
    expect(j.days).toBe(30);
  });

  it("'tudo' não tem corte nem período anterior", () => {
    const j = resolverJanela("all", AGORA);
    expect(j.startIso).toBeNull();
    expect(j.previousStartIso).toBeNull();
    expect(j.days).toBeNull();
  });
});

describe("calcularVariacao: nunca inventa", () => {
  const j30 = resolverJanela("30", AGORA);

  it("com histórico suficiente, calcula", () => {
    const v = calcularVariacao({
      janela: j30,
      atual: 120,
      anterior: 100,
      historicoDesdeIso: "2026-01-01T00:00:00Z",
    });
    expect(v).toMatchObject({ disponivel: true, delta: 20 });
    expect(v.disponivel && v.percent).toBeCloseTo(20, 6);
  });

  it("histórico que começa DENTRO do período anterior é insuficiente", () => {
    // Comparar um período cheio contra um pedaço é o mesmo erro que comparar
    // contra zero. A série do snapshot (16/07) não sustenta "30 vs 30".
    const v = calcularVariacao({
      janela: j30,
      atual: 120,
      anterior: 3,
      historicoDesdeIso: "2026-07-16T00:00:00Z",
    });
    expect(v).toEqual({
      disponivel: false,
      atual: 120,
      motivo: "historico_insuficiente",
    });
  });

  it("base ZERO devolve percentual nulo, NUNCA infinito", () => {
    const v = calcularVariacao({
      janela: j30,
      atual: 50,
      anterior: 0,
      historicoDesdeIso: "2026-01-01T00:00:00Z",
    });
    expect(v).toMatchObject({ disponivel: true, delta: 50, percent: null });
    // A trava explícita: nada de Infinity escapando para a tela.
    expect(v.disponivel && Number.isFinite(v.percent ?? 0)).toBe(true);
  });

  it("'tudo' não tem período anterior, e diz isso", () => {
    const v = calcularVariacao({
      janela: resolverJanela("all", AGORA),
      atual: 10,
      anterior: null,
      historicoDesdeIso: "2026-01-01T00:00:00Z",
    });
    expect(v).toEqual({
      disponivel: false,
      atual: 10,
      motivo: "janela_sem_anterior",
    });
  });

  it("sem histórico nenhum, diz sem_dados", () => {
    const v = calcularVariacao({
      janela: j30,
      atual: 0,
      anterior: null,
      historicoDesdeIso: null,
    });
    expect(v).toMatchObject({ disponivel: false, motivo: "sem_dados" });
  });

  it("cada card decide pela SUA série, não por uma regra da página", () => {
    // Perfis desde 04/05 e receita desde 13/07, na MESMA janela de 30 dias:
    // um tem Δ, o outro não. Uma regra global erraria em um dos dois.
    const perfis = calcularVariacao({
      janela: j30,
      atual: 100,
      anterior: 80,
      historicoDesdeIso: "2026-05-04T00:00:00Z",
    });
    const receita = calcularVariacao({
      janela: j30,
      atual: 316229,
      anterior: 0,
      historicoDesdeIso: "2026-07-13T00:00:00Z",
    });
    expect(perfis.disponivel).toBe(true);
    expect(receita.disponivel).toBe(false);
  });

  it("janela de 7 dias JÁ é suportada pela série de snapshots", () => {
    const j7 = resolverJanela("7", AGORA);
    const v = calcularVariacao({
      janela: j7,
      atual: 62,
      anterior: 44,
      historicoDesdeIso: "2026-07-16T00:00:00Z",
    });
    expect(v.disponivel).toBe(true);
  });
});
