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

describe("resolverJanela: dias civis de Brasília", () => {
  it("30 dias são 30 dias CIVIS terminando hoje, e começam à meia-noite de Brasília", () => {
    // Semântica nova (Fase 2). A antiga era `agora - 30*24h`, que devolvia
    // 2026-07-01T12:00:00Z — um instante no MEIO do dia, incomparável com
    // qualquer gráfico agrupado por dia.
    const j = resolverJanela("30", AGORA);

    expect(j.ultimoDiaCivil).toBe("2026-07-31");
    // 30 dias terminando em 31/07 começam em 02/07: hoje conta como um deles.
    expect(j.primeiroDiaCivil).toBe("2026-07-02");
    // Meia-noite de Brasília = 03:00Z com o offset atual (UTC-3), e o valor sai
    // do `Intl`, não de aritmética de -3h escrita no código.
    expect(j.startIso).toBe("2026-07-02T03:00:00.000Z");
    expect(j.endIso).toBe("2026-07-31T12:00:00.000Z");
    expect(j.days).toBe(30);
  });

  it("o período anterior tem o MESMO número de dias civis e não sobrepõe", () => {
    const j = resolverJanela("30", AGORA);

    expect(j.previousPrimeiroDiaCivil).toBe("2026-06-02");
    expect(j.previousUltimoDiaCivil).toBe("2026-07-01");
    expect(j.previousStartIso).toBe("2026-06-02T03:00:00.000Z");
    // CONTROLE NEGATIVO da sobreposição: o anterior fecha 1 ms ANTES do início
    // do atual. Antes os dois compartilhavam o mesmo instante, e como as
    // queries usam `.gte`/`.lte`, uma linha criada exatamente ali contava nos
    // DOIS períodos.
    expect(j.previousEndIso).not.toBe(j.startIso);
    expect(Date.parse(j.previousEndIso!)).toBe(Date.parse(j.startIso!) - 1);
  });

  it("janela de 1 dia é só hoje", () => {
    // Não é oferecida na UI, mas a aritmética precisa fechar no limite: com
    // N=1, `hoje - (N-1)` é hoje.
    const j = resolverJanela("7", AGORA);
    expect(j.primeiroDiaCivil).toBe("2026-07-25");
    expect(j.ultimoDiaCivil).toBe("2026-07-31");
  });

  it("'tudo' não tem corte nem período anterior", () => {
    const j = resolverJanela("all", AGORA);
    expect(j.startIso).toBeNull();
    expect(j.primeiroDiaCivil).toBeNull();
    expect(j.previousStartIso).toBeNull();
    expect(j.days).toBeNull();
    // `ultimoDiaCivil` existe mesmo em 'tudo': é o dia de hoje, e é o que o
    // badge usa para dizer "até 31 jul".
    expect(j.ultimoDiaCivil).toBe("2026-07-31");
  });
});

describe("a fronteira do dia é a de BRASÍLIA, não a de UTC", () => {
  /**
   * A classe de defeito que a Fase 2 fecha, exercitada nos dois lados do
   * limite. O instante 03:00Z é a meia-noite de Brasília: 02:59:59Z ainda é
   * ontem em Brasília, e é isso que separa 4.788 de 4.606.
   */
  it("23:50 de Brasília do dia-limite ENTRA na janela", () => {
    // 23:50 BRT de 25/07 = 02:50Z de 26/07. A janela de 7 dias terminando em
    // 31/07 começa em 25/07, então este cadastro está DENTRO.
    const j = resolverJanela("7", AGORA);
    const cadastro = Date.parse("2026-07-26T02:50:00Z");
    expect(cadastro).toBeGreaterThanOrEqual(Date.parse(j.startIso!));
    expect(cadastro).toBeLessThanOrEqual(Date.parse(j.endIso));
  });

  it("23:50 de Brasília do dia ANTERIOR ao limite NÃO entra (controle negativo)", () => {
    // 23:50 BRT de 24/07 = 02:50Z de 25/07 — ainda dia 24 em Brasília, fora da
    // janela. Repare que em UTC este instante é "25/07", e um corte por dia UTC
    // o incluiria: é exatamente o erro que existia.
    const j = resolverJanela("7", AGORA);
    const cadastro = Date.parse("2026-07-25T02:50:00Z");
    expect(cadastro).toBeLessThan(Date.parse(j.startIso!));
  });

  it("00:10 de Brasília do primeiro dia da janela ENTRA", () => {
    // 00:10 BRT de 25/07 = 03:10Z de 25/07.
    const j = resolverJanela("7", AGORA);
    expect(Date.parse("2026-07-25T03:10:00Z")).toBeGreaterThan(
      Date.parse(j.startIso!),
    );
  });

  it("o limite é o instante EXATO da meia-noite de Brasília, não meia-noite UTC", () => {
    const j = resolverJanela("7", AGORA);
    expect(j.startIso).toBe("2026-07-25T03:00:00.000Z");
    expect(j.startIso).not.toBe("2026-07-25T00:00:00.000Z");
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
