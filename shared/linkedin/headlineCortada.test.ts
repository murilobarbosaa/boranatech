import { describe, expect, it } from "vitest";

import { headlineParecCortada } from "./headlineCortada";

/**
 * As duas listas abaixo saem das analises persistidas reais (2026-07-31). Sao
 * headlines profissionais, sem nome nem localizacao, e a forma foi preservada
 * porque e ela que o detector le.
 *
 * O teste prova os DOIS lados. Provar so que dispara no caso ruim e o erro que
 * a serie inteira documenta: o detector que acusa tudo passa nesse teste e
 * inutiliza o aviso em producao.
 */

/** Assinatura INEQUIVOCA: dispara. */
const DEVE_DISPARAR = [
  // comeca em separador orfao (8 casos medidos)
  "| ETL | Data Architecture | Associate Platform Analyst at NTT DATA,",
  "| Construindo aplicações web modernas e escaláveis",
  "| SQL | Excel",
  "| MongoDB",
  // termina em separador orfao (14 casos medidos)
  "Software Developer | Full-Stack Engineer | AI Enthusiast |",
  "Data Analyst | Power BI |",
  // termina em virgula (1 caso medido)
  "Full Stack Developer | Web, APIs & Mobile | Laravel, React,",
  // comeca em minuscula (4 casos medidos)
  "software developer | game dev. | python | java",
  "que alguém vai usar de verdade. Aberto a oportunidades",
];

/** Headline legitima: NAO pode disparar. */
const NAO_PODE_DISPARAR = [
  // A familia F2b, deixada de fora de proposito: primeira secao com uma
  // palavra so. 39 casos medidos, e estes dois sao headlines boas.
  "Student | Open to Internships",
  "Estudante | Análise e Desenvolvimento de Sistemas",
  "Selenium | BDD",
  // Headlines completas normais
  "Analista de Dados | Power BI | SQL",
  "Desenvolvedor Full Stack | React | Node.js",
  "ISO 27001 | Compliance | Auditoria de TI",
  "AWS | NodeJs | PhP | Laravel | Python | Django",
  // Comecos que NAO sao minuscula: digito e pontuacao nao disparam
  ".NET Developer | C# | Azure",
  "4Linux | Infraestrutura | Redes",
  "10 anos em dados | SQL | Python",
];

describe("headlineParecCortada", () => {
  it("PROVA 1: dispara em todas as assinaturas inequivocas", () => {
    const naoDispararam = DEVE_DISPARAR.filter((h) => !headlineParecCortada(h));
    expect(naoDispararam).toEqual([]);
  });

  it("PROVA 2: NAO dispara em headline legitima, inclusive na familia F2b", () => {
    const dispararam = NAO_PODE_DISPARAR.filter((h) => headlineParecCortada(h));
    expect(dispararam).toEqual([]);
  });

  it("`Student | Open to Internships` NAO dispara, nominalmente", () => {
    // Nomeado porque foi o caso que decidiu deixar a familia F2b de fora. Se
    // alguem acrescentar a regra "primeira secao com uma palavra so" para
    // aumentar cobertura, este teste quebra e o motivo esta aqui.
    expect(headlineParecCortada("Student | Open to Internships")).toBe(false);
    expect(
      headlineParecCortada("Estudante | Análise e Desenvolvimento de Sistemas"),
    ).toBe(false);
  });

  it("tolera null, undefined, vazio e so espaço", () => {
    expect(headlineParecCortada(null)).toBe(false);
    expect(headlineParecCortada(undefined)).toBe(false);
    expect(headlineParecCortada("")).toBe(false);
    expect(headlineParecCortada("   ")).toBe(false);
  });

  it("ignora espaço em volta antes de decidir", () => {
    expect(headlineParecCortada("  | ETL | Data  ")).toBe(true);
    expect(headlineParecCortada("  Analista de Dados | SQL  ")).toBe(false);
  });
});
