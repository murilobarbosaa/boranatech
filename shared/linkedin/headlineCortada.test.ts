import { describe, expect, it } from "vitest";

import { headlineParecCortada } from "./headlineCortada";
import { parseLinkedinText } from "./parse";

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

  it("usa o contexto estrutural quando a normalização já removeu o pipe", () => {
    expect(
      headlineParecCortada("ETL | Data Architecture | Analista de Dados", {
        juntou: false,
        acima: { terminaEm: "pipe", forte: true },
      }),
    ).toBe(true);
  });

  it("não acusa linha anterior fraca nem headline que foi unida", () => {
    const headline = "Analista de Dados | SQL";
    expect(
      headlineParecCortada(headline, {
        juntou: false,
        acima: { terminaEm: "pipe", forte: false },
      }),
    ).toBe(false);
    expect(
      headlineParecCortada(headline, {
        juntou: true,
        acima: { terminaEm: "pipe", forte: true },
      }),
    ).toBe(false);
  });
});

/**
 * Direção de BAIXO: a headline escolhida é a PRIMEIRA metade.
 *
 * O parser passou a ancorar a escolha no nome, então a continuação órfã deixou
 * de cair acima e passou a cair abaixo. A regra que só olhava para cima ficava
 * muda, e o resultado era pior que o erro anterior: `Consultor de Dados` é
 * plausível e indistinguível de uma headline curta legítima, enquanto
 * `| ETL | ...` era visivelmente cortada. Detecção que emudece quando o valor
 * fica bonito é a mesma família do `contarLinhas` devolvendo -1.
 */
describe("headlineParecCortada: continuação órfã ABAIXO", () => {
  const CONTINUACAO = "| ETL | Data Architecture | Analista de Dados";

  it("acusa corte quando a linha de baixo começa em separador", () => {
    expect(
      headlineParecCortada("Consultor de Dados", {
        juntou: false,
        acima: null,
        linhasAbaixo: [CONTINUACAO, "São Paulo, Brasil"],
      }),
    ).toBe(true);
  });

  // Ponta a ponta a partir do TEXTO, nas duas quebras de linha. O caso do
  // fixture de telemetria: o parser escolhe `Consultor de Dados` e joga a
  // continuação para `linhasAbaixo[0]`. Passar pelo parser é o que prova que o
  // campo chega preenchido, em vez de afirmar isso sobre um objeto montado à
  // mão que sempre teria o formato que o teste quis.
  const PERFIL_CORTADO = [
    "Contato",
    "www.linkedin.com/in/exemplo",
    "Principais competências",
    "Ciência da computação",
    "Joana Teste",
    "Consultor de Dados",
    CONTINUACAO,
    "São Paulo, Brasil",
    "Summary",
    "Analista com foco em dados, trabalhando com SQL e BI todos os dias.",
  ];

  it.each([
    ["LF", "\n"],
    ["CRLF", "\r\n"],
  ])("acusa o corte real do perfil em %s", (_rotulo, quebra) => {
    const parsed = parseLinkedinText(PERFIL_CORTADO.join(quebra));

    expect(parsed.headline).toBe("Consultor de Dados");
    expect(parsed.headlineContexto?.linhasAbaixo[0]).toBe(CONTINUACAO);
    expect(headlineParecCortada(parsed.headline, parsed.headlineContexto)).toBe(
      true,
    );
  });

  it("não acusa quando a linha de baixo é conteúdo normal", () => {
    expect(
      headlineParecCortada("Analista de Dados | Power BI | SQL", {
        juntou: false,
        acima: null,
        linhasAbaixo: ["São Paulo, Brasil", "Summary"],
      }),
    ).toBe(false);
  });

  it("não acusa quando a headline já foi unida ou não há linhas abaixo", () => {
    expect(
      headlineParecCortada("Consultor de Dados", {
        juntou: true,
        acima: null,
        linhasAbaixo: [CONTINUACAO],
      }),
    ).toBe(false);
    expect(
      headlineParecCortada("Consultor de Dados", {
        juntou: false,
        acima: null,
        linhasAbaixo: [],
      }),
    ).toBe(false);
  });

  it("ausência de linhasAbaixo degrada para o comportamento anterior", () => {
    // Objetos historicos e o bundle da janela de deploy nao tem o campo.
    expect(
      headlineParecCortada("Consultor de Dados", {
        juntou: false,
        acima: null,
      }),
    ).toBe(false);
  });
});
