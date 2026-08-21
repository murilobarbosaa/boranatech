import { describe, expect, it } from "vitest";
import { horasDe, metricasComputadas } from "./avaliarRoadmapIA.mts";

/**
 * A METADE COMPUTADA do instrumento de medicao. So esta parte tem teste: a
 * outra metade e um juiz LLM, e o que valida um juiz e a matriz de calibracao
 * (ver docs/medicoes/), nao asserção unitaria.
 *
 * O que estes testes travam e a distincao que o instrumento inteiro depende:
 * "4h a 6h" e CARGA e entra na soma; "2 semanas" e DURACAO DE CALENDARIO e nao
 * entra. Somar os dois produz um numero que parece horas e nao e. 21 dos 27
 * roadmaps em producao misturam as duas unidades.
 */

describe("horasDe: carga em horas, nunca calendario", () => {
  it("faixa vira o ponto medio", () => {
    expect(horasDe("4h a 6h")).toBe(5);
    expect(horasDe("8h a 10h")).toBe(9);
  });

  it("valor unico vira ele mesmo", () => {
    expect(horasDe("3 horas")).toBe(3);
    expect(horasDe("10 horas")).toBe(10);
  });

  it("semanas e meses NAO sao carga: devolve null", () => {
    // O defeito que isto impede: "2 semanas" viraria 2 na soma, e um roadmap
    // com 20 passos de "2 semanas" apareceria como 40 horas quando sao meses.
    expect(horasDe("2 semanas")).toBeNull();
    expect(horasDe("1 semana")).toBeNull();
    expect(horasDe("3 meses")).toBeNull();
  });

  it("vazio, indefinido e texto sem numero nao explodem", () => {
    expect(horasDe(undefined)).toBeNull();
    expect(horasDe("")).toBeNull();
    expect(horasDe("depende do seu ritmo")).toBeNull();
  });

  it("virgula decimal e aceita", () => {
    expect(horasDe("1,5 hora")).toBe(1.5);
  });
});

describe("metricasComputadas", () => {
  const roadmap = {
    sections: [
      {
        title: "A",
        children: [
          {
            title: "1",
            content: "x",
            estimatedTime: "4h a 6h",
            project: "pro-saas-dashboard",
          },
          { title: "2", content: "y", estimatedTime: "2 semanas" },
        ],
      },
      {
        title: "B",
        children: [{ title: "3", content: "z", estimatedTime: "10 horas" }],
      },
    ],
  };

  it("conta passos, secoes e separa as unidades", () => {
    const m = metricasComputadas(roadmap, {});
    expect(m.passos).toBe(3);
    expect(m.secoes).toBe(2);
    expect(m.passos_em_horas).toBe(2);
    expect(m.passos_em_semanas).toBe(1);
    expect(m.unidade_mista).toBe(true);
  });

  it("soma SO as horas, ignorando o passo em semanas", () => {
    // 5 (media de 4-6) + 10 = 15. O passo de "2 semanas" fica de fora.
    expect(metricasComputadas(roadmap, {}).carga_declarada_h).toBe(15);
  });

  it("razao de carga compara com o tempo real da pessoa", () => {
    // 5-10h/semana -> 7,5; 3 meses -> 13 semanas; disponivel = 97,5h.
    const m = metricasComputadas(roadmap, {
      hoursPerWeek: "5-10",
      deadline: "3m",
    });
    expect(m.carga_disponivel_h).toBe(97.5);
    expect(m.razao_carga).toBeCloseTo(15 / 97.5, 2);
  });

  it("sem hoursPerWeek ou sem deadline, a razao e null e nao um numero inventado", () => {
    expect(
      metricasComputadas(roadmap, { deadline: "3m" }).razao_carga,
    ).toBeNull();
    expect(
      metricasComputadas(roadmap, { hoursPerWeek: "5-10" }).razao_carga,
    ).toBeNull();
  });

  it("unidade NAO mista quando todos os passos usam a mesma", () => {
    const so = {
      sections: [{ children: [{ estimatedTime: "4 horas", content: "a" }] }],
    };
    expect(metricasComputadas(so, {}).unidade_mista).toBe(false);
  });

  it("conta project e sub-passos", () => {
    const m = metricasComputadas(roadmap, {});
    expect(m.com_project).toBe(1);
    expect(m.com_subpassos).toBe(0);
  });
});
