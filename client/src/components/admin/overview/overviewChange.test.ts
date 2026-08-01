import { describe, expect, it } from "vitest";

import { rotuloDeVariacao, type ChangePayload } from "./overviewChange";

/**
 * O que a tela DIZ quando há Δ e quando não há.
 *
 * Regra: card sem Δ é honesto, card com Δ falso não. E espaço vazio no lugar do
 * Δ parece defeito, então a ausência tem de vir com o motivo.
 */

describe("rotuloDeVariacao", () => {
  it("sem o campo (backend antigo) não inventa nada", () => {
    // Janela de deploy: a Vercel sobe antes do Railway.
    expect(rotuloDeVariacao(undefined)).toBeNull();
    expect(rotuloDeVariacao(null)).toBeNull();
  });

  it("alta e baixa saem com tom e percentual", () => {
    const alta = rotuloDeVariacao({
      disponivel: true,
      atual: 120,
      anterior: 100,
      delta: 20,
      percent: 20,
    })!;
    expect(alta).toEqual({ texto: "+20,0% vs. período anterior", tom: "alta" });

    const baixa = rotuloDeVariacao({
      disponivel: true,
      atual: 80,
      anterior: 100,
      delta: -20,
      percent: -20,
    })!;
    expect(baixa.tom).toBe("baixa");
    expect(baixa.texto).toContain("-20,0%");
  });

  it("base ZERO nunca vira infinito nem NaN", () => {
    // É o número que destruiria a confiança na página inteira.
    const r = rotuloDeVariacao({
      disponivel: true,
      atual: 50,
      anterior: 0,
      delta: 50,
      percent: null,
    })!;
    expect(r.texto).toBe("Novo no período (não havia antes)");
    expect(r.texto).not.toContain("Infinity");
    expect(r.texto).not.toContain("NaN");
    expect(r.texto).not.toContain("%");
  });

  it("queda a partir de base zero também não inventa percentual", () => {
    const r = rotuloDeVariacao({
      disponivel: true,
      atual: 0,
      anterior: 0,
      delta: -5,
      percent: null,
    })!;
    expect(r.texto).toBe("Zerou no período");
  });

  it("sem variação, diz o MOTIVO e cita a data do histórico", () => {
    // "Sem comparação" sozinho não explica; a data explica.
    const r = rotuloDeVariacao(
      { disponivel: false, atual: 10, motivo: "historico_insuficiente" },
      "2026-07-16T00:00:00Z",
    )!;
    expect(r.texto).toContain("16/07/2026");
    expect(r.tom).toBe("neutro");
  });

  it("a data do histórico é lida em UTC, não no fuso do navegador", () => {
    // `2026-07-16T00:00:00Z` vira 15/07 em qualquer fuso a oeste de Greenwich,
    // inclusive o de Brasília: o rótulo diria um dia a menos do que a série
    // realmente começou. Foi assim que este teste pegou o defeito.
    expect(
      rotuloDeVariacao(
        { disponivel: false, atual: 0, motivo: "historico_insuficiente" },
        "2026-07-16T00:00:00Z",
      )!.texto,
    ).toContain("16/07/2026");
  });

  it("motivo DESCONHECIDO não derruba: cai no genérico", () => {
    // Regra do projeto: mapa indexado por valor do servidor nunca é acesso
    // direto. Um motivo novo no backend não pode quebrar o bundle em execução.
    const r = rotuloDeVariacao({
      disponivel: false,
      atual: 1,
      motivo: "motivo_que_ainda_nao_existe",
    })!;
    expect(r.texto).toBe("Sem comparação disponível");
  });

  it("delta zero é dito, não escondido", () => {
    const r = rotuloDeVariacao({
      disponivel: true,
      atual: 10,
      anterior: 10,
      delta: 0,
      percent: 0,
    })!;
    expect(r.texto).toBe("Igual ao período anterior");
  });

  it("NENHUM caminho produz Infinity ou NaN no texto", () => {
    // Varredura: qualquer combinação que a rota possa mandar.
    const casos: ChangePayload[] = [
      { disponivel: true, atual: 1, anterior: 0, delta: 1, percent: null },
      { disponivel: true, atual: 0, anterior: 0, delta: 0, percent: null },
      { disponivel: true, atual: 5, anterior: 2, delta: 3, percent: 150 },
      { disponivel: false, atual: 0, motivo: "sem_dados" },
      { disponivel: false, atual: 0, motivo: "janela_sem_anterior" },
    ];
    for (const caso of casos) {
      const t = rotuloDeVariacao(caso)?.texto ?? "";
      expect(t, JSON.stringify(caso)).not.toMatch(/Infinity|NaN|undefined/);
      expect(t.length, JSON.stringify(caso)).toBeGreaterThan(0);
    }
  });
});
