import { describe, expect, it } from "vitest";

import {
  dominioDoEixoY,
  intervaloDeRotulos,
  rotuloDeDia,
  tendenciaDeFluxo,
  tendenciaDeNivel,
} from "./chartMath";

describe("dominioDoEixoY", () => {
  it("começa em zero quando a variação é grande: nada a esconder", () => {
    // A série real de MRR hoje: 467,40 a 1.706,80. Variação de 73% do máximo.
    const d = dominioDoEixoY([467.4, 900, 1706.8]);
    expect(d.min).toBe(0);
    expect(d.truncado).toBe(false);
  });

  it("trunca quando a variação é pequena, e DECLARA que truncou", () => {
    // 2% de variação: com eixo em zero a linha vira uma reta e o gráfico não
    // responde nada. Trunca, mas o `truncado` obriga a tela a avisar.
    const d = dominioDoEixoY([1000, 1010, 1020]);
    expect(d.truncado).toBe(true);
    expect(d.min).toBeGreaterThan(0);
    expect(d.min).toBeLessThan(1000);
  });

  it("nunca trunca sem sinalizar: min > 0 implica truncado", () => {
    for (const serie of [[1000, 1010], [50, 51, 52], [10, 100], [0, 5], [7]]) {
      const d = dominioDoEixoY(serie);
      if (d.min > 0) expect(d.truncado).toBe(true);
      if (!d.truncado) expect(d.min).toBe(0);
    }
  });

  it("não trunca quando há zero ou negativo na série", () => {
    // Truncar uma série que toca o zero esconderia justamente o zero.
    expect(dominioDoEixoY([0, 1000, 1010]).truncado).toBe(false);
    expect(dominioDoEixoY([-5, 1000]).truncado).toBe(false);
  });

  it("série vazia não inventa domínio", () => {
    expect(dominioDoEixoY([])).toEqual({ min: 0, max: 0, truncado: false });
  });

  it("série constante não trunca: não há variação a exagerar", () => {
    expect(dominioDoEixoY([1500])).toEqual({
      min: 0,
      max: 1500,
      truncado: false,
    });
    expect(dominioDoEixoY([1500, 1500, 1500]).truncado).toBe(false);
  });
});

describe("tendenciaDeNivel", () => {
  const fmt = (v: number) => `R$ ${v}`;

  it("compara o primeiro ponto MEDIDO com o último, ignorando buracos", () => {
    const t = tendenciaDeNivel([null, 100, 250, null], fmt);
    expect(t.texto).toBe("+R$ 150 no período");
    expect(t.tom).toBe("alta");
  });

  it("aponta queda", () => {
    expect(tendenciaDeNivel([300, 100], fmt).tom).toBe("baixa");
  });

  it("diz 'estável' quando não mudou, em vez de +R$ 0", () => {
    expect(tendenciaDeNivel([100, 100], fmt).texto).toBe("Estável no período");
  });

  it("recusa comparar com menos de dois pontos medidos", () => {
    expect(tendenciaDeNivel([null, 100, null], fmt).tom).toBe("neutro");
    expect(tendenciaDeNivel([], fmt).texto).toMatch(/Sem histórico/);
  });
});

describe("tendenciaDeFluxo", () => {
  const dia = (count: number, partial = false) => ({ count, partial });

  it("compara médias de metade contra metade, não ponta contra ponta", () => {
    // Ponta a ponta diria "caiu" (10 -> 8). A média diz o contrário, e é a
    // leitura certa: a metade recente entra mais gente por dia.
    const t = tendenciaDeFluxo([dia(10), dia(2), dia(30), dia(8)]);
    expect(t.tom).toBe("alta");
    expect(t.texto).toMatch(/Acelerando/);
  });

  it("exclui o dia parcial dos dois lados da conta", () => {
    const completos = [dia(100), dia(100), dia(100), dia(100)];
    const semParcial = tendenciaDeFluxo(completos);
    const comParcial = tendenciaDeFluxo([...completos, dia(3, true)]);
    // O dia em andamento tem 3 cadastros às 8h. Se entrasse na média recente,
    // a frase viraria "desacelerando" todo dia de manhã.
    expect(comParcial.texto).toBe(semParcial.texto);
    expect(comParcial.tom).toBe("neutro");
  });

  it("trata variação abaixo de 10% como ruído, não como tendência", () => {
    const t = tendenciaDeFluxo([dia(100), dia(100), dia(104), dia(105)]);
    expect(t.tom).toBe("neutro");
    expect(t.texto).toMatch(/Estável/);
  });

  it("chama de desaceleração quando a queda passa de 10%", () => {
    const t = tendenciaDeFluxo([dia(200), dia(200), dia(100), dia(100)]);
    expect(t.tom).toBe("baixa");
    expect(t.texto).toBe("Desacelerando: 200 → 100 por dia");
  });

  it("não divide por zero quando a metade anterior é toda zero", () => {
    const t = tendenciaDeFluxo([dia(0), dia(0), dia(50), dia(60)]);
    expect(t.tom).toBe("alta");
    expect(t.texto).not.toMatch(/Infinity|NaN/);
  });

  it("recusa comparar com menos de quatro dias completos", () => {
    expect(tendenciaDeFluxo([dia(10), dia(20), dia(30)]).tom).toBe("neutro");
    expect(tendenciaDeFluxo([]).texto).toMatch(/Sem histórico/);
  });

  it("nenhuma frase sai vazia, para nenhuma entrada", () => {
    for (const entrada of [
      [],
      [dia(0)],
      [dia(0), dia(0), dia(0), dia(0)],
      [dia(1, true)],
      [dia(5), dia(5), dia(5), dia(5), dia(9, true)],
    ]) {
      expect(tendenciaDeFluxo(entrada).texto.length).toBeGreaterThan(0);
    }
  });
});

describe("rotuloDeDia", () => {
  it("recorta a string, sem passar por Date", () => {
    // Um `new Date("2026-07-01").getDate()` em base -03 daria 30/06.
    expect(rotuloDeDia("2026-07-01")).toBe("01/07");
    expect(rotuloDeDia("2026-01-31")).toBe("31/01");
  });

  it("devolve a entrada intacta quando não é uma data civil", () => {
    expect(rotuloDeDia("")).toBe("");
    expect(rotuloDeDia("2026-07-01T10:00:00Z")).toBe("2026-07-01T10:00:00Z");
  });
});

describe("intervaloDeRotulos", () => {
  it("mostra todos quando cabem", () => {
    expect(intervaloDeRotulos(6, 6)).toBe(0);
    expect(intervaloDeRotulos(3, 6)).toBe(0);
  });

  it("rareia o suficiente para não passar do alvo", () => {
    for (const pontos of [7, 16, 30, 88, 400]) {
      const intervalo = intervaloDeRotulos(pontos, 6);
      const exibidos = Math.ceil(pontos / (intervalo + 1));
      expect(exibidos).toBeLessThanOrEqual(6);
    }
  });

  it("nunca devolve intervalo negativo", () => {
    expect(intervaloDeRotulos(0, 6)).toBe(0);
    expect(intervaloDeRotulos(1, 6)).toBe(0);
  });
});
