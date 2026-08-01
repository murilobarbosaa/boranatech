import { describe, expect, it } from "vitest";

import { montarSerieDeCadastros, somarDia } from "./signupSeries";

// O fuso importa aqui: `vitest.config.ts` fixa TZ=America/Sao_Paulo porque o CI
// roda em UTC e o dev em -03. Sem a fixação, um teste de agrupamento por dia
// passaria numa máquina e falharia na outra por motivo que não é o código.

describe("montarSerieDeCadastros", () => {
  it("agrupa pelo dia de Brasília, não pelo dia UTC", () => {
    // 2026-07-20T02:30:00Z é 23:30 do dia 19 em Brasília. `slice(0,10)` diria 20.
    const pontos = montarSerieDeCadastros({
      criadosEm: ["2026-07-20T02:30:00Z", "2026-07-20T12:00:00Z"],
      inicio: "2026-07-19",
      fim: "2026-07-20",
      hoje: "2026-07-21",
    });

    expect(pontos).toEqual([
      { date: "2026-07-19", count: 1, partial: false },
      { date: "2026-07-20", count: 1, partial: false },
    ]);
  });

  it("desenha zero para o dia sem cadastro: ausência de linha É medição", () => {
    const pontos = montarSerieDeCadastros({
      criadosEm: ["2026-07-19T15:00:00Z"],
      inicio: "2026-07-18",
      fim: "2026-07-20",
      hoje: "2026-07-20",
    });

    expect(pontos.map((p) => p.count)).toEqual([0, 1, 0]);
    // Nenhum ponto some e nenhum vira nulo: a série é contígua por construção.
    expect(pontos.map((p) => p.date)).toEqual([
      "2026-07-18",
      "2026-07-19",
      "2026-07-20",
    ]);
  });

  it("marca SÓ o dia de hoje como parcial", () => {
    const pontos = montarSerieDeCadastros({
      criadosEm: [],
      inicio: "2026-07-18",
      fim: "2026-07-20",
      hoje: "2026-07-20",
    });

    expect(pontos.map((p) => p.partial)).toEqual([false, false, true]);
  });

  it("não marca nada como parcial quando hoje está fora da janela", () => {
    const pontos = montarSerieDeCadastros({
      criadosEm: [],
      inicio: "2026-07-18",
      fim: "2026-07-19",
      hoje: "2026-07-25",
    });

    expect(pontos.every((p) => !p.partial)).toBe(true);
  });

  it("ignora carimbo inválido em vez de derrubar a série inteira", () => {
    const pontos = montarSerieDeCadastros({
      criadosEm: ["lixo", "2026-07-19T15:00:00Z"],
      inicio: "2026-07-19",
      fim: "2026-07-19",
      hoje: "2026-07-19",
    });

    expect(pontos).toEqual([{ date: "2026-07-19", count: 1, partial: true }]);
  });

  it("devolve um único ponto quando início e fim são o mesmo dia", () => {
    const pontos = montarSerieDeCadastros({
      criadosEm: ["2026-07-19T15:00:00Z", "2026-07-19T16:00:00Z"],
      inicio: "2026-07-19",
      fim: "2026-07-19",
      hoje: "2026-07-19",
    });

    expect(pontos).toHaveLength(1);
    expect(pontos[0].count).toBe(2);
  });

  it("devolve série vazia quando o fim é anterior ao início", () => {
    expect(
      montarSerieDeCadastros({
        criadosEm: ["2026-07-19T15:00:00Z"],
        inicio: "2026-07-20",
        fim: "2026-07-19",
        hoje: "2026-07-20",
      }),
    ).toEqual([]);
  });

  it("atravessa virada de mês e de ano sem buraco nem repetição", () => {
    const pontos = montarSerieDeCadastros({
      criadosEm: [],
      inicio: "2026-12-30",
      fim: "2027-01-02",
      hoje: "2027-01-02",
    });

    expect(pontos.map((p) => p.date)).toEqual([
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
  });
});

describe("somarDia", () => {
  it("anda para frente e para trás", () => {
    expect(somarDia("2026-07-31")).toBe("2026-08-01");
    expect(somarDia("2026-08-01", -1)).toBe("2026-07-31");
    expect(somarDia("2026-08-01", -29)).toBe("2026-07-03");
  });

  it("não escorrega no horário de verão: a conta é em UTC puro", () => {
    // A data civil não tem hora, então nenhuma transição de fuso pode movê-la.
    // Um `new Date("2026-10-18")` local em base -03 daria o dia anterior.
    expect(somarDia("2026-10-17")).toBe("2026-10-18");
    expect(somarDia("2026-02-14")).toBe("2026-02-15");
  });
});
