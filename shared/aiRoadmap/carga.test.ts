import { describe, expect, it } from "vitest";

import type { RoadmapV2 } from "../roadmapV2/types";

import {
  cargaDoRoadmap,
  HORAS_POR_SEMANA,
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
