import { describe, expect, it } from "vitest";

import type { RoadmapV2 } from "../roadmapV2/types";

import {
  cargaDoRoadmap,
  FATOR_OCUPACAO,
  HORAS_POR_SEMANA,
  MINIMO_POR_SECAO,
  orcamentoDaSecao,
  RAZAO_MAXIMA,
  SEMANAS_POR_PRAZO,
} from "./carga";

/**
 * As asserçoes aqui sao sobre COMPORTAMENTO, nunca sobre a existencia do campo.
 * Em particular, os dois casos que este repositorio ja errou antes em outras
 * formas: (1) o roadmap antigo, cujo campo e string, nao pode ser contado como
 * zero e passar por "calibrado"; (2) "sem prazo" nao pode cair num default
 * silencioso que produz numero plausivel.
 */

const passo = (id: string, estimatedHours?: number, children?: unknown) =>
  ({ id, title: id, estimatedHours, children }) as never;

const roadmapCom = (children: unknown[]): RoadmapV2 =>
  ({ sections: [{ id: "s", title: "S", children }] }) as never;

describe("cargaDoRoadmap: a conta", () => {
  it("soma estimatedHours em qualquer profundidade", () => {
    const r = roadmapCom([
      passo("a", 10),
      passo("b", 5, [passo("b1", 3), passo("b2", 2)]),
    ]);
    const c = cargaDoRoadmap(r, { hoursPerWeek: "5-10", deadline: "6m" });
    expect(c.horasGeradas).toBe(20);
    expect(c.passosTotais).toBe(4);
  });

  it("horas disponiveis usam o ponto medio da faixa e 4,33 semanas por mes", () => {
    const c = cargaDoRoadmap(roadmapCom([passo("a", 1)]), {
      hoursPerWeek: "5-10",
      deadline: "6m",
    });
    expect(c.horasDisponiveis).toBe(
      SEMANAS_POR_PRAZO["6m"]! * HORAS_POR_SEMANA["5-10"],
    );
    expect(c.horasDisponiveis).toBe(195);
  });

  it("razao acima do teto reprova, e e o caso que motivou o instrumento", () => {
    // 400h geradas contra 195h disponiveis: o exemplo do briefing.
    const c = cargaDoRoadmap(roadmapCom([passo("a", 400)]), {
      hoursPerWeek: "5-10",
      deadline: "6m",
    });
    expect(c.razao).toBeCloseTo(400 / 195, 5);
    expect(c.razao!).toBeGreaterThan(RAZAO_MAXIMA);
    expect(c.calibrado).toBe(false);
  });
});

describe("cargaDoRoadmap: os casos que nao podem degradar em silencio", () => {
  it("roadmap ANTIGO (estimatedTime string) conta passos sem horas, e NAO vira calibrado", () => {
    const antigo = roadmapCom([
      { id: "a", title: "A", estimatedTime: "4h a 6h" },
      { id: "b", title: "B", estimatedTime: "2 semanas" },
    ]);
    const c = cargaDoRoadmap(antigo, {
      hoursPerWeek: "5-10",
      deadline: "6m",
    });
    expect(c.horasGeradas).toBe(0);
    expect(c.passosSemHoras).toBe(2);
    expect(c.passosTotais).toBe(2);
    // A razao e 0, que esta ABAIXO do minimo: o veredito e false, nunca true.
    // Se o piso nao existisse, um roadmap inteiro sem o campo passaria como
    // calibrado, que e exatamente "falhar passando".
    expect(c.calibrado).toBe(false);
  });

  it('"sem-prazo" devolve null em vez de um default plausivel', () => {
    const c = cargaDoRoadmap(roadmapCom([passo("a", 50)]), {
      hoursPerWeek: "5-10",
      deadline: "sem-prazo",
    });
    expect(c.horasDisponiveis).toBeNull();
    expect(c.razao).toBeNull();
    expect(c.calibrado).toBeNull();
  });

  it("passo misto (uns com horas, outros sem) soma o que tem e CONTA o que falta", () => {
    const c = cargaDoRoadmap(
      roadmapCom([
        passo("a", 10),
        { id: "b", title: "B", estimatedTime: "1 semana" },
      ]),
      { hoursPerWeek: "5-10", deadline: "6m" },
    );
    expect(c.horasGeradas).toBe(10);
    expect(c.passosSemHoras).toBe(1);
  });
});

describe("orcamentoDaSecao: o orcamento e conta nossa, nao estimativa do modelo", () => {
  const vazio = (n: number): RoadmapV2 =>
    ({
      sections: Array.from({ length: n }, (_, i) => ({
        id: `s${i}`,
        title: `S${i}`,
        children: [],
      })),
    }) as never;
  const intake = { hoursPerWeek: "5-10", deadline: "6m" } as const;

  it("na PRIMEIRA secao e o total ocupavel dividido pelas secoes", () => {
    // 5-10h/sem x 6m = 195h disponiveis; x0,7 = 136,5 ocupaveis; /7 = 19,5 -> 20
    const o = orcamentoDaSecao(vazio(7), intake, 0);
    expect(o).toBe(Math.round((195 * FATOR_OCUPACAO) / 7));
    expect(o).toBe(20);
  });

  it("ACOMPANHA a disponibilidade: quem tem 6x mais tempo recebe orcamento 6x maior", () => {
    // E o defeito exato que esta funcao existe para corrigir: antes dela o
    // volume gerado era constante enquanto a disponibilidade variava 6x.
    const pouco = orcamentoDaSecao(
      vazio(8),
      { hoursPerWeek: "ate-5", deadline: "12m" },
      0,
    )!;
    const muito = orcamentoDaSecao(
      vazio(8),
      { hoursPerWeek: "10-20", deadline: "12m" },
      0,
    )!;
    // 6,18 e nao 6,00 exatos por causa do Math.round do orcamento (68/11).
    // A tolerancia e sobre o ERRO RELATIVO e nao sobre casas decimais, para o
    // teste falhar se a proporcao se perder e nao quando o arredondamento mexe.
    expect(Math.abs(muito / pouco - 15 / 2.5) / (15 / 2.5)).toBeLessThan(0.05);
  });

  it("AUTOCORRIGE: secao que estourou encolhe o orcamento das seguintes", () => {
    const r = vazio(4);
    // 195h disponiveis, 136,5 ocupaveis, 34 por secao. A primeira gasta 100.
    (r.sections[0] as { children: unknown }).children = [
      { id: "a", title: "A", estimatedHours: 100 },
    ];
    const segunda = orcamentoDaSecao(r, intake, 1)!;
    // Sobram 36,5 para 3 secoes: 12, nao 34.
    expect(segunda).toBe(Math.round((195 * FATOR_OCUPACAO - 100) / 3));
    expect(segunda).toBeLessThan(34);
  });

  it("nunca desce abaixo do minimo viavel, mesmo com o orcamento estourado", () => {
    const r = vazio(3);
    (r.sections[0] as { children: unknown }).children = [
      { id: "a", title: "A", estimatedHours: 9999 },
    ];
    expect(orcamentoDaSecao(r, intake, 1)).toBe(MINIMO_POR_SECAO);
  });

  it('"sem-prazo" devolve null, e quem chama omite a instrucao', () => {
    expect(
      orcamentoDaSecao(
        vazio(7),
        { hoursPerWeek: "5-10", deadline: "sem-prazo" },
        0,
      ),
    ).toBeNull();
  });
});
