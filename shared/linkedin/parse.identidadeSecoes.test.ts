import { describe, expect, it } from "vitest";

import { parseLinkedinText, textoComHeadlineManual } from "./parse";

/**
 * Identidade falsa construída com conteúdo de uma seção já delimitada.
 *
 * O bug: `detectHeadline` trabalha sobre o preâmbulo, que termina ANTES da
 * primeira seção principal. O heading que FECHA a coluna lateral é justamente
 * essa primeira principal (`Summary`), então ele ficava fora da janela e
 * `dentroDeSecaoLateralFechada` não achava fronteira posterior nenhuma. Com
 * `Top Skills / React / Frontend Developer / Summary`, `React` passava como
 * nome estrutural, `Frontend Developer` como headline, a região saía
 * `confirmed`, `skillsPdf` ficava VAZIO (a seção inteira era cortada pelo
 * bloco de identidade falso) e a correção manual de headline conseguia dar
 * splice numa linha que nunca foi headline.
 *
 * A regra é estrutural, derivada dos intervalos entre headings do catálogo
 * compartilhado, e NÃO uma lista de nomes de tecnologia: `React` e `Docker`
 * não são conhecidos aqui, o que os salva é a posição deles dentro do
 * intervalo de `Top Skills`.
 *
 * A metade de baixo do arquivo é o que impede a correção de virar um "nunca
 * confirma dentro de seção": o export real do LinkedIn põe nome, headline e
 * localização exatamente entre a última seção lateral e `Summary`.
 */

const CORPO = [
  "Summary",
  "Desenvolvo produtos digitais e documento decisões técnicas com o time.",
];

describe("identidade não pode ser feita de conteúdo de seção", () => {
  it("caso A: cargo dentro de Top Skills não vira headline confirmada", () => {
    const parsed = parseLinkedinText(
      ["Top Skills", "React", "Frontend Developer", "Summary"].join("\n"),
    );

    expect(parsed.headlineRegion?.status).not.toBe("confirmed");
    expect(parsed.headlineRegion?.status).toBe("ambiguous");
  });

  it("caso A: as duas linhas continuam sendo conteúdo da seção", () => {
    const parsed = parseLinkedinText(
      ["Top Skills", "React", "Frontend Developer", "Summary"].join("\n"),
    );

    expect(parsed.skillsPdf).toEqual(["React", "Frontend Developer"]);
  });

  it("caso B: skills legítimas não somem por promoção a headline", () => {
    const parsed = parseLinkedinText(
      ["Top Skills", "Machine Learning", "Vector Databases", "Summary"].join(
        "\n",
      ),
    );

    expect(parsed.headlineRegion?.status).not.toBe("confirmed");
    // Era o dano medido: `Vector Databases` virava headline e a seção esvaziava.
    expect(parsed.skillsPdf).toEqual(["Machine Learning", "Vector Databases"]);
  });

  it("caso C: mesma estrutura em português", () => {
    const parsed = parseLinkedinText(
      ["Competencias", "React", "Engenheiro de Software", "Resumo"].join("\n"),
    );

    expect(parsed.headlineRegion?.status).not.toBe("confirmed");
    expect(parsed.skillsPdf).toEqual(["React", "Engenheiro de Software"]);
  });

  it("caso D: bloco maior, nenhuma linha vira headline confirmada", () => {
    const parsed = parseLinkedinText(
      [
        "Top Skills",
        "React",
        "TypeScript",
        "Frontend Developer",
        "Docker",
        "Summary",
      ].join("\n"),
    );

    expect(parsed.headlineRegion?.status).not.toBe("confirmed");
    // Antes da correção sobrava só `React`: o corte falso comia TypeScript,
    // Frontend Developer e Docker de uma vez.
    expect(parsed.skillsPdf).toEqual([
      "React",
      "TypeScript",
      "Frontend Developer",
      "Docker",
    ]);
  });

  it("caso E: o veredito não depende da quebra de linha do arquivo", () => {
    const parsed = parseLinkedinText(
      ["Top Skills", "React", "Frontend Developer", "Summary"].join("\r\n"),
    );

    expect(parsed.headlineRegion?.status).not.toBe("confirmed");
    expect(parsed.skillsPdf).toEqual(["React", "Frontend Developer"]);
  });

  it("caso F: headline manual não faz splice no texto do caso A", () => {
    const text = ["Top Skills", "React", "Frontend Developer", "Summary"].join(
      "\n",
    );

    // Caminho conservador: região não confirmada preserva o bruto byte a byte.
    expect(textoComHeadlineManual(text, "Outro Cargo | Vue")).toBe(text);
  });

  it("a nota fica marcada como incompleta em vez de afirmar a leitura", () => {
    // `notaIncompleta` sai de `statusDaRegiao === "ambiguous"` em
    // `server/lib/linkedinChecks.ts`. O que este teste trava é a entrada dessa
    // conta: a região precisa chegar lá como ambígua, não como confirmada.
    const parsed = parseLinkedinText(
      ["Top Skills", "React", "Frontend Developer", "Summary"].join("\n"),
    );

    expect(parsed.headlineRegion?.status).toBe("ambiguous");
  });
});

/**
 * Sondas da auditoria: a âncora de nome com DUAS palavras furava (a) e (b).
 *
 * R5 é o caso B com uma linha a mais, e é a forma mais realista dos dois: um
 * perfil real lista cinco competências, não duas, então sobrava conteúdo na
 * seção e a condição (a) não disparava. `Machine Learning` tem duas palavras e
 * nenhum sinal de cargo, então passava como nome e (b) não disparava. Quem
 * separa os dois sem saber o que as linhas significam é a LOCALIZAÇÃO: lista de
 * competências não tem cidade no meio, preâmbulo de perfil tem.
 */
describe("identidade dentro de seção exige linha de localização", () => {
  const SONDAS: Array<[string, string[], string[]]> = [
    [
      "R4",
      ["Top Skills", "Python", "Amazon Web Services", "Frontend Developer"],
      ["Python", "Amazon Web Services", "Frontend Developer"],
    ],
    [
      "R5",
      ["Top Skills", "Python", "Machine Learning", "Vector Databases"],
      ["Python", "Machine Learning", "Vector Databases"],
    ],
    [
      "R6",
      ["Top Skills", "Java", "Spring Boot", "Backend Developer"],
      ["Java", "Spring Boot", "Backend Developer"],
    ],
    [
      "R7",
      ["Principais competencias", "SQL", "Power BI", "Analista de Dados"],
      ["SQL", "Power BI", "Analista de Dados"],
    ],
    [
      "R8",
      [
        "Top Skills",
        "Python",
        "Amazon Web Services",
        "Frontend Developer",
        "Docker",
      ],
      ["Python", "Amazon Web Services", "Frontend Developer", "Docker"],
    ],
  ];

  it.each(SONDAS)(
    "%s: sem localização no bloco, nada vira headline confirmada",
    (_nome, preambulo, skillsEsperadas) => {
      const fecha =
        preambulo[0] === "Principais competencias" ? "Resumo" : "Summary";
      const text = [...preambulo, fecha].join("\n");
      const parsed = parseLinkedinText(text);

      expect(parsed.headlineRegion?.status).not.toBe("confirmed");
      // Nenhuma linha some da seção por ter sido promovida a identidade.
      expect(parsed.skillsPdf).toEqual(skillsEsperadas);
      expect(textoComHeadlineManual(text, "Outro Cargo | Vue")).toBe(text);
    },
  );

  it("controle: o MESMO bloco com localização continua confirmado", () => {
    // Difere de R4 por uma linha só, e é a linha que decide. Sem este par o
    // teste acima passaria também com a identidade proibida em bloco.
    const text = [
      "Top Skills",
      "Python",
      "Amazon Web Services",
      "Joana Teste",
      "Frontend Developer | React",
      "São Paulo, Brasil",
      ...CORPO,
    ].join("\n");
    const parsed = parseLinkedinText(text);

    expect(parsed.headlineRegion?.status).toBe("confirmed");
    expect(parsed.headline).toBe("Frontend Developer | React");
    expect(parsed.skillsPdf).toEqual(["Python", "Amazon Web Services"]);
  });

  it("localização presente NÃO dispensa a âncora de nome de duas palavras", () => {
    // Isola a condição (b). Com a localização no bloco, (a) e (c) passam, então
    // quem recusa aqui é só a âncora de UMA palavra (`React`). Sem este caso a
    // condição (b) ficaria sem teste de fronteira: a (c) cobre o caso D por
    // outro caminho, e o mutante de (b) sobreviveria em silêncio.
    const text = [
      "Top Skills",
      "Python",
      "React",
      "Frontend Developer | Vue",
      "São Paulo, Brasil",
      ...CORPO,
    ].join("\n");
    const parsed = parseLinkedinText(text);

    expect(parsed.headlineRegion?.status).not.toBe("confirmed");
    expect(textoComHeadlineManual(text, "Outro Cargo | Vue")).toBe(text);
  });
});

describe("não regressão: identidade legítima continua confirmada", () => {
  it("identidade no preâmbulo real continua confirmada", () => {
    const text = [
      "Ana Silva",
      "Frontend Developer | React",
      "Brasilia, DF",
      ...CORPO,
    ].join("\n");

    expect(parseLinkedinText(text)).toMatchObject({
      headline: "Frontend Developer | React",
      headlineRegion: { status: "confirmed" },
    });
  });

  it("identidade DEPOIS da coluna lateral continua confirmada", () => {
    // O layout real do "Salvar como PDF": a coluna lateral sai primeiro e o
    // nome/headline/localização ficam DENTRO do intervalo de `Top Skills`,
    // fechado por `Summary`. É o padrão que proíbe a regra estrita.
    const text = [
      "Contato",
      "www.linkedin.com/in/exemplo",
      "Top Skills",
      "React",
      "TypeScript",
      "Joana Teste",
      "Frontend Developer | React | TypeScript",
      "São Paulo, Brasil",
      ...CORPO,
    ].join("\n");
    const parsed = parseLinkedinText(text);

    expect(parsed.headlineRegion?.status).toBe("confirmed");
    expect(parsed.headline).toBe("Frontend Developer | React | TypeScript");
    expect(parsed.skillsPdf).toEqual(["React", "TypeScript"]);
    expect(textoComHeadlineManual(text, "Frontend Developer | Vue")).toContain(
      "Frontend Developer | Vue",
    );
  });

  it("sobrar UMA linha de conteúdo já basta para o destaque valer", () => {
    // Fronteira exata da condição (a): a seção fica com exatamente uma linha.
    // Um a menos é o caso A (seção esvaziada, identidade recusada), então os
    // dois lados do limiar estão presos por teste.
    const text = [
      "Top Skills",
      "React",
      "Joana Teste",
      "Frontend Developer | Vue",
      "São Paulo, Brasil",
      ...CORPO,
    ].join("\n");
    const parsed = parseLinkedinText(text);

    expect(parsed.headlineRegion?.status).toBe("confirmed");
    expect(parsed.skillsPdf).toEqual(["React"]);
  });

  it("headline real multilinha continua funcionando", () => {
    const text = [
      "Contato",
      "www.linkedin.com/in/exemplo",
      "Principais competências",
      "Ciência da computação",
      "Joana Teste",
      "Desenvolvedor Full Stack | React, Next.js,",
      "PostgreSQL | SaaS B2B & B2C",
      "Guarulhos, São Paulo, Brasil",
      ...CORPO,
    ].join("\n");
    const parsed = parseLinkedinText(text);

    expect(parsed.headline).toBe(
      "Desenvolvedor Full Stack | React, Next.js, PostgreSQL | SaaS B2B & B2C",
    );
    expect(parsed.headlineRegion?.status).toBe("confirmed");
    expect(parsed.skillsPdf).toEqual(["Ciência da computação"]);
  });

  it("Projects continua excluído da identidade", () => {
    const text = [
      "Projects",
      "Frontend Developer | React",
      "Projeto acessível.",
      ...CORPO,
    ].join("\n");
    const parsed = parseLinkedinText(text);

    expect(parsed.headline).toBeNull();
    expect(parsed.headlineRegion?.status).toBe("not_found");
    expect(textoComHeadlineManual(text, "Frontend Developer | Vue")).toBe(text);
  });

  it("seção desconhecida continua fail-closed", () => {
    const text = [
      "Seção desconhecida",
      "Frontend Developer | React",
      "outra informação",
    ].join("\n");
    const parsed = parseLinkedinText(text);

    expect(parsed.headlineRegion?.status).toBe("ambiguous");
    expect(textoComHeadlineManual(text, "Frontend Developer | Vue")).toBe(text);
  });
});
