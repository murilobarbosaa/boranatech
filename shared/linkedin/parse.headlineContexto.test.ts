import { describe, expect, it } from "vitest";

import { parseLinkedinText } from "./parse";

/**
 * `headlineContexto`: o campo que separa "o parser cortou" de "a pessoa
 * escreveu assim".
 *
 * Por que existe: as familias de quebra medidas em producao (virgula, pipe
 * orfao, termo composto partido, prosa cortada) produzem headlines
 * indistinguiveis, no que fica persistido, de uma headline legitima com aquela
 * forma. `profileText` nao e guardado de proposito, entao o diagnostico
 * dependia de ter o PDF em maos, e nao se tem.
 *
 * O que NAO faz: nao muda deteccao nenhuma. Todos os testes de
 * `parse.headlineMultilinha.test.ts` continuam valendo sem alteracao, e este
 * arquivo afirma isso comparando `headline` com o valor esperado em cada caso.
 *
 * PRIVACIDADE: `acima` guarda so a CLASSE da terminacao, nunca o conteudo. A
 * linha acima da headline costuma ser o NOME da pessoa, e o produto nao
 * persiste nome. Para baixo vai conteudo; para cima, so classificacao.
 */

const LATERAL = [
  "Contato",
  "www.linkedin.com/in/exemplo",
  "Principais competências",
  "Ciência da computação",
  "Programação (computação)",
  "Linguagens de programação",
];

const SOBRE_E_EXPERIENCIA = [
  "Summary",
  "Analista com foco em dados. Trabalho com SQL e BI todos os dias, construindo paineis para as areas de negocio.",
  "Experience",
  "Empresa Exemplo",
  "Analista de Dados",
  "janeiro de 2024 - Present",
  "Construi paineis e modelos para o time de operacoes.",
];

function perfil(preambulo: string[]): string {
  return [...preambulo, ...SOBRE_E_EXPERIENCIA].join("\n");
}

describe("headlineContexto", () => {
  it("marca juntou=false e classifica a linha de cima quando NAO houve juncao", () => {
    const parsed = parseLinkedinText(
      perfil([
        ...LATERAL,
        "Joana Teste",
        "Analista de Dados | Power BI | SQL",
        "São Paulo, São Paulo, Brasil",
      ]),
    );

    expect(parsed.headline).toBe("Analista de Dados | Power BI | SQL");
    expect(parsed.headlineContexto).not.toBeNull();
    expect(parsed.headlineContexto?.juntou).toBe(false);
    // A linha de cima e o NOME: termina em palavra e nao e candidata forte.
    expect(parsed.headlineContexto?.acima).toEqual({
      terminaEm: "palavra",
      forte: false,
    });
    expect(parsed.headlineContexto?.linhasAbaixo).toEqual([
      "São Paulo, São Paulo, Brasil",
    ]);
  });

  it("marca juntou=true quando a juncao para tras disparou", () => {
    const parsed = parseLinkedinText(
      perfil([
        ...LATERAL,
        "Joana Teste",
        "Analista de Dados | SQL, Power BI ,",
        "Python | Databricks",
        "São Paulo, Brasil",
      ]),
    );

    expect(parsed.headline).toBe(
      "Analista de Dados | SQL, Power BI , Python | Databricks",
    );
    expect(parsed.headlineContexto?.juntou).toBe(true);
    expect(parsed.headlineContexto?.acima).toEqual({
      terminaEm: "palavra",
      forte: false,
    });
  });

  it("usa o PIPE removido para confirmar e unir a região completa", () => {
    const parsed = parseLinkedinText(
      perfil([
        ...LATERAL,
        "Joana Teste",
        "Engenheiro de Dados |",
        "ETL | Data Architecture | Analista de Dados",
        "São Paulo, Brasil",
      ]),
    );

    expect(parsed.headline).toBe(
      "Engenheiro de Dados | ETL | Data Architecture | Analista de Dados",
    );
    expect(parsed.headlineContexto?.juntou).toBe(true);
    expect(parsed.headlineContexto?.acima).toEqual({
      terminaEm: "palavra",
      forte: false,
    });
  });

  it("preserva pipe com espaços e não o confunde com vírgula", () => {
    const parsed = parseLinkedinText(
      perfil([
        ...LATERAL,
        "Joana Teste",
        "Engenheiro de Dados,   |   ",
        "ETL | Data Architecture | Analista de Dados",
        "São Paulo, Brasil",
      ]),
    );

    expect(parsed.headline).toContain("Engenheiro de Dados, | ETL");
    expect(parsed.headlineContexto?.juntou).toBe(true);
    expect(parsed.headlineContexto?.acima).toEqual({
      terminaEm: "palavra",
      forte: false,
    });
  });

  it("linha sem separador removido continua classificada pelo texto", () => {
    const parsed = parseLinkedinText(
      perfil([
        ...LATERAL,
        "Joana Teste",
        "Analista de Dados | Power BI | SQL",
        "São Paulo, Brasil",
      ]),
    );

    expect(parsed.headlineContexto?.acima).toEqual({
      terminaEm: "palavra",
      forte: false,
    });
  });

  it("nao guarda o CONTEUDO da linha de cima em lugar nenhum", () => {
    const NOME = "Joana Sobrenome Teste";
    const parsed = parseLinkedinText(
      perfil([
        ...LATERAL,
        NOME,
        "Analista de Dados | Power BI | SQL",
        "São Paulo, Brasil",
      ]),
    );

    expect(JSON.stringify(parsed.headlineContexto)).not.toContain(NOME);
    expect(JSON.stringify(parsed.headlineContexto)).not.toContain("Sobrenome");
  });

  it("e null quando nao ha headline detectada", () => {
    const parsed = parseLinkedinText(
      [
        "Contato",
        "www.linkedin.com/in/exemplo",
        "Summary",
        "Texto curto.",
      ].join("\n"),
    );
    expect(parsed.headline).toBeNull();
    expect(parsed.headlineContexto).toBeNull();
  });

  it("tolera leitura de linha ANTIGA, sem a chave", () => {
    // As 163 linhas ja gravadas tem `parseResumo` sem `headlineContexto`. O
    // formato persistido e jsonb, entao a ausencia chega como `undefined`, e
    // quem le precisa aguentar sem quebrar. Mesmo padrao de `entryPath`.
    const antigo: { headline: string | null; headlineContexto?: unknown } = {
      headline: "Analista de Dados | Power BI | SQL",
    };
    expect(antigo.headlineContexto).toBeUndefined();
    expect(antigo.headline).toBe("Analista de Dados | Power BI | SQL");
  });
});
