import { describe, expect, it } from "vitest";

import { parseLinkedinText } from "./parse";

/**
 * Headline que ocupa MAIS DE UMA LINHA (Fase 4, item 1).
 *
 * O caso que motivou saiu de producao, linha `134d325f` de linkedin_analyses:
 * a headline real do perfil e
 *   `Desenvolvedor Full Stack | React, Next.js, Node.js, NestJS, TypeScript , PostgreSQL | SaaS B2B & B2C`
 * e o que ficou persistido foi `PostgreSQL | SaaS B2B & B2C`, ou seja, o
 * cargo-alvo e metade da stack sumiram. A fixture abaixo reproduz o layout do
 * export (coluna lateral, nome, headline em duas linhas, localizacao) e a
 * reproducao batia byte a byte com a linha persistida antes da correcao,
 * inclusive o vazamento do NOME para `skillsPdf`.
 *
 * A metade de baixo do arquivo e o que protege a correcao: os quatro falsos
 * positivos que uma juncao mais frouxa causaria.
 */

const SOBRE_E_EXPERIENCIA = [
  "Summary",
  "Desenvolvedor full stack com foco em produtos SaaS. Trabalho com React e Node.js todos os dias, construindo APIs e interfaces para clientes B2B e B2C.",
  "Experience",
  "Empresa Exemplo",
  "Desenvolvedor Full Stack",
  "janeiro de 2024 - Present",
  "Construi APIs em NestJS e telas em Next.js para o produto principal.",
];

function perfil(preambulo: string[]): string {
  return [...preambulo, ...SOBRE_E_EXPERIENCIA].join("\n");
}

const LATERAL = [
  "Contato",
  "www.linkedin.com/in/exemplo",
  "Principais competências",
  "Ciência da computação",
  "Programação (computação)",
  "Linguagens de programação",
];

describe("headline quebrada em duas linhas", () => {
  const HEADLINE_L1 =
    "Desenvolvedor Full Stack | React, Next.js, Node.js, NestJS, TypeScript ,";
  const HEADLINE_L2 = "PostgreSQL | SaaS B2B & B2C";

  const parsed = parseLinkedinText(
    perfil([
      ...LATERAL,
      "Édiller Watzek",
      HEADLINE_L1,
      HEADLINE_L2,
      "Guarulhos, São Paulo, Brasil",
    ]),
  );

  it("entrega a headline INTEIRA, nao so a ultima linha", () => {
    expect(parsed.headline).toBe(
      "Desenvolvedor Full Stack | React, Next.js, Node.js, NestJS, TypeScript , PostgreSQL | SaaS B2B & B2C",
    );
  });

  it("preserva o cargo-alvo, que era exatamente o que se perdia", () => {
    expect(parsed.headline).toContain("Desenvolvedor Full Stack");
  });

  it("para de vazar o NOME e o inicio da headline para as competencias", () => {
    // Efeito de segunda ordem do indice da headline: com o indice na segunda
    // linha, `inicioDaIdentidade` cortava tarde e a secao lateral engolia o
    // nome. Producao mostrava `["...", "Édiller Watzek", "Desenvolvedor Full
    // Stack", "React", "Next.js", "Node.js", "NestJS"]`.
    expect(parsed.skillsPdf).not.toContain("Édiller Watzek");
    expect(parsed.skillsPdf).not.toContain("Desenvolvedor Full Stack");
    expect(parsed.skillsPdf).toEqual([
      "Ciência da computação",
      "Programação (computação)",
      "Linguagens de programação",
    ]);
  });
});

describe("falsos positivos: a juncao NAO pode disparar", () => {
  it("headline legitima seguida de linha de localizacao", () => {
    const parsed = parseLinkedinText(
      perfil([
        ...LATERAL,
        "Joana Teste",
        "Desenvolvedora Backend | Java | Spring Boot",
        "Belo Horizonte, Minas Gerais, Brasil",
      ]),
    );
    expect(parsed.headline).toBe("Desenvolvedora Backend | Java | Spring Boot");
  });

  it("headline legitima seguida do nome de uma empresa", () => {
    const parsed = parseLinkedinText(
      perfil([
        ...LATERAL,
        "Joana Teste",
        "Analista de Dados | Power BI | SQL",
        "Empresa Exemplo Tecnologia",
      ]),
    );
    expect(parsed.headline).toBe("Analista de Dados | Power BI | SQL");
  });

  it("duas headlines de perfis diferentes coladas no mesmo texto", () => {
    // As duas sao candidatas fortes e contiguas. A de cima esta FECHADA (nao
    // termina em virgula), entao continua valendo a regra antiga: vence a
    // ultima, e nada e fundido.
    const parsed = parseLinkedinText(
      perfil([
        ...LATERAL,
        "Joana Teste",
        "Desenvolvedora Backend | Java | Spring Boot",
        "Carlos Exemplo",
        "Designer de Produto | Figma | UX",
      ]),
    );
    expect(parsed.headline).toBe("Designer de Produto | Figma | UX");
    expect(parsed.headline).not.toContain("Java");
  });

  it("linha de cargo de experiencia logo abaixo da headline nao e fundida", () => {
    // `Desenvolvedor Backend Pleno` E candidata forte (casa `desenvolvedor`),
    // entao e o caso adversarial de verdade: duas fortes e contiguas. Quem
    // decide continua sendo a virgula, que nao existe aqui, entao NAO ha
    // juncao. Que a de baixo venca e comportamento ANTERIOR a esta correcao
    // (`strong[strong.length - 1]`), preservado de proposito: mexer nisso e
    // outro item.
    const parsed = parseLinkedinText(
      perfil([
        ...LATERAL,
        "Joana Teste",
        "Engenheira de Software | Go | Kubernetes",
        "Desenvolvedor Backend Pleno",
      ]),
    );
    expect(parsed.headline).toBe("Desenvolvedor Backend Pleno");
    expect(parsed.headline).not.toContain("Kubernetes");
  });

  it("cargo de experiencia FRACO abaixo da headline deixa a headline vencer", () => {
    // `Engenheira de Software Pleno` nao casa nenhum sinal (o catalogo tem
    // `engenheiro`, no masculino), entao nao e candidata e a headline vence.
    // Fica registrado porque o veredito depende do catalogo de sinais, nao da
    // regra de juncao: e a headline inteira, sem nada colado da linha de baixo.
    const parsed = parseLinkedinText(
      perfil([
        ...LATERAL,
        "Joana Teste",
        "Engenheira de Software | Go | Kubernetes",
        "Engenheira de Software Pleno",
      ]),
    );
    expect(parsed.headline).toBe("Engenheira de Software | Go | Kubernetes");
    expect(parsed.headline).not.toContain("Pleno");
  });

  it("headline que termina em virgula mas cuja linha de cima NAO e headline", () => {
    // Vizinha aberta em virgula porem fraca (sem separador nem palavra de
    // papel): nao junta, porque a juncao exige os DOIS sinais.
    const parsed = parseLinkedinText(
      perfil([
        ...LATERAL,
        "Joana Teste",
        "Belo Horizonte,",
        "Desenvolvedora Backend | Java | Spring Boot",
      ]),
    );
    expect(parsed.headline).toBe("Desenvolvedora Backend | Java | Spring Boot");
  });
});
