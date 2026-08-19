import { describe, expect, it } from "vitest";

import { parseLinkedinText } from "./parse";

/**
 * Linha de stack lida como LOCALIZACAO, engolindo metade da headline.
 *
 * O caso saiu do proprio doc de auditoria: headline quebrada em duas linhas,
 * a segunda sendo a stack. `ehLinhaDeLocalizacao` aceitava
 * `TypeScript, React, Node.js, PostgreSQL | Remote` porque a forma bate (partes
 * curtas por virgula, capitalizadas), e `ehContinuacaoDeHeadline` recusa o que
 * e localizacao. Sem continuacao, a juncao nao disparava e o parser ficava so
 * com `Desenvolvedora Full Stack`, com regiao `confirmed` e
 * `notaIncompleta: false`: a stack sumia em silencio, que e o modo de falha
 * caro (valor plausivel indistinguivel do certo).
 *
 * A fronteira era artefato puro: a MESMA linha com cinco partes por virgula, ou
 * sem virgula nenhuma, juntava corretamente. O teto de quatro partes era o que
 * tornava enumeracao de stack indistinguivel de endereco.
 *
 * Dois sinais estruturais fecham, nenhum deles lista de tecnologia: barra de
 * cargo nunca aparece em endereco, e endereco do export tem no maximo tres
 * partes (`Campinas, Sao Paulo, Brasil`).
 */

const CABECA = [
  "Contato",
  "www.linkedin.com/in/exemplo",
  "Principais competências",
  "Ciência da computação",
  "Joana Teste",
  "Desenvolvedora Full Stack |",
];
const CORPO = ["Summary", "Analista com foco em produto, trabalhando com SQL."];

const perfil = (segunda: string, extra: string[] = []) =>
  [...CABECA, segunda, ...extra, ...CORPO].join("\n");

describe("stack quebrada nao pode ser lida como localizacao", () => {
  it("o fixture do doc junta a headline inteira, em vez de perder a stack", () => {
    const parsed = parseLinkedinText(
      perfil("TypeScript, React, Node.js, PostgreSQL | Remote", [
        "São Paulo, Brasil",
      ]),
    );

    expect(parsed.headline).toBe(
      "Desenvolvedora Full Stack | TypeScript, React, Node.js, PostgreSQL | Remote",
    );
    // A localizacao REAL continua sendo a localizacao da regiao, e por isso a
    // regiao fecha confirmada em vez de cair para ambigua.
    expect(parsed.headlineRegion?.status).toBe("confirmed");
  });

  it("sem localizacao real a regiao degrada, e a headline continua inteira", () => {
    const parsed = parseLinkedinText(
      perfil("TypeScript, React, Node.js, PostgreSQL | Remote"),
    );

    expect(parsed.headline).toBe(
      "Desenvolvedora Full Stack | TypeScript, React, Node.js, PostgreSQL | Remote",
    );
    // Nada de `confirmed` com `notaIncompleta` falso sobre stack engolida.
    expect(parsed.headlineRegion?.status).toBe("ambiguous");
  });

  it.each([
    [
      "quatro partes com pipe",
      "TypeScript, React, Node.js, PostgreSQL | Remote",
    ],
    ["quatro partes sem pipe", "JavaScript, TypeScript, React, PostgreSQL"],
    ["tres partes com pipe", "TypeScript, React, Node.js | Remote"],
    ["cinco partes", "TypeScript, React, Node.js, PostgreSQL, Docker"],
    ["sem virgula", "TypeScript | React | Node.js | PostgreSQL"],
  ])("%s entra na headline, nao vira localizacao", (_rotulo, segunda) => {
    const parsed = parseLinkedinText(perfil(segunda, ["São Paulo, Brasil"]));

    expect(parsed.headline).toBe(`Desenvolvedora Full Stack | ${segunda}`);
    expect(parsed.headlineRegion?.status).toBe("confirmed");
  });

  it("a localizacao real depois da stack nao entra na headline", () => {
    const parsed = parseLinkedinText(
      perfil("TypeScript, React, Node.js, PostgreSQL | Remote", [
        "São Paulo, Brasil",
      ]),
    );

    expect(parsed.headline).not.toContain("São Paulo");
  });
});

describe("nao regressao: localizacao legitima continua localizacao", () => {
  const comLocalizacao = (local: string) =>
    parseLinkedinText(
      ["Ana Silva", "Frontend Developer | React", local, ...CORPO].join("\n"),
    );

  it.each([
    "Brasilia, DF",
    "São Paulo, Brasil",
    "Campinas, São Paulo, Brasil",
    "Guarulhos, São Paulo, Brasil",
    "Remote",
    "Greater São Paulo Area",
  ])("%s fecha a regiao e fica fora da headline", (local) => {
    const parsed = comLocalizacao(local);

    expect(parsed.headlineRegion?.status).toBe("confirmed");
    expect(parsed.headline).toBe("Frontend Developer | React");
  });
});
