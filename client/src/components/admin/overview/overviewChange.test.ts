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
    // "Sem comparação" sozinho não explica; a data explica. O instante é
    // realista de propósito: meia-noite UTC é um valor que o campo (timestamptz
    // de created_at) praticamente nunca tem, e testar com ele levou, na fatia 5,
    // a "consertar" a exibição para UTC, corrigindo o sintoma pelo lado errado.
    const r = rotuloDeVariacao(
      { disponivel: false, atual: 10, motivo: "historico_insuficiente" },
      "2026-07-16T08:10:01Z",
    )!;
    expect(r.texto).toContain("16/07/2026");
    expect(r.tom).toBe("neutro");
    // A FRASE DIZ O QUE ACONTECEU, não o nome do estado: a série começa dentro
    // do período escolhido, então não há período anterior com dado. Dito assim
    // ela se explica sozinha, e a data vira contexto em vez de charada.
    expect(r.texto).toBe(
      "Dados começam no meio do período (16/07/2026), sem comparação",
    );
  });

  it("sem a data, a frase continua completa e não vira reticência", () => {
    const r = rotuloDeVariacao({
      disponivel: false,
      atual: 10,
      motivo: "historico_insuficiente",
    })!;
    expect(r.texto).toBe("Dados começam no meio do período, sem comparação");
    expect(r.texto).not.toContain("undefined");
    expect(r.texto).not.toContain("null");
  });

  it("a data do histórico é o dia LOCAL do instante", () => {
    // `historicoDesde` vem de `timestamptz` (profiles.created_at): é um
    // instante, e para instante o dia local é o correto. 04/05 16:04 em Brasília
    // é 04/05, não 05/05.
    expect(
      rotuloDeVariacao(
        { disponivel: false, atual: 0, motivo: "historico_insuficiente" },
        "2026-05-04T19:04:20Z",
      )!.texto,
    ).toContain("04/05/2026");
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
