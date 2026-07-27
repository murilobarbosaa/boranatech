import { describe, expect, it } from "vitest";

import { parseLinkedinText } from "./parse";

/**
 * Bloco de experiências: um teste por bug da rodada 2 (B.1 a B.5) e um bloco de
 * falsos positivos.
 *
 * Os cinco bugs eram sintomas de duas decisões erradas na mesma função, por
 * isso a correção foi uma reescrita e não cinco remendos:
 *
 *   1. A descrição ia "da data até a PRÓXIMA DATA". Entre duas datas mora o
 *      cabeçalho do bloco seguinte, então toda descrição terminava com o nome
 *      da empresa e o cargo do vizinho (B.1 na forma extrema, sem descrição
 *      nenhuma; B.4 na forma que reatribuía a empresa do grupo).
 *   2. O título eram "as até 2 linhas antes da data", sem perguntar o que elas
 *      eram. Se fossem empresa e cargo, saíam colados (B.2); se fossem duração
 *      do grupo e cargo, idem (B.4); se fosse o último bullet do cargo
 *      anterior, o bullet virava título (B.5).
 *
 * B.3 é o terceiro: a linha de localização era pulada por comprimento
 * (`< 18`), e cidade com estado e país por extenso não cabia.
 */

const exp = (texto: string) => parseLinkedinText(texto).experiencias;

const BLOCO_SIMPLES = `Experience
Empresa Alfa
Desenvolvedora Back-end
janeiro de 2022 - Present
3 anos
Campinas, São Paulo, Brazil
Construí a API de pagamentos em Node.js e reduzi a latência média pela metade.
`;

describe("B.1 descricao vazia existe, e nao vira o cabecalho do vizinho", () => {
  const texto = `Experience
Startup Alfa
CTO & Co-founder
July 2026 - Present   (1 month)
Brazil
NexoRH
Artificial Intelligence Engineer
March 2025 - June 2026   (1 year 4 months)
São Paulo, Brazil
Construí agentes de IA em produção para RH, com busca semântica de currículos.
`;

  it("a experiencia sem descricao vem com descricao vazia", () => {
    expect(exp(texto)[0].descricao).toBe("");
  });

  it("o cabecalho da experiencia seguinte NAO aparece na descricao anterior", () => {
    expect(exp(texto)[0].descricao).not.toContain("NexoRH");
    expect(exp(texto)[0].descricao).not.toContain("Artificial Intelligence");
  });

  it("a forma geral: nenhuma descricao termina no cabecalho do vizinho", () => {
    // Nao e so o caso extremo. Mesmo com descricao legitima, a janela antiga
    // levava a empresa e o cargo seguintes na cauda.
    const comDuas = `Experience
Empresa Alfa
Desenvolvedora Back-end
janeiro de 2022 - Present
3 anos
Construí a API de pagamentos em Node.js.
Empresa Beta
Desenvolvedora Front-end
março de 2019 - dezembro de 2021
2 anos 10 meses
Criei o design system em React.
`;
    expect(exp(comDuas)[0].descricao).toBe(
      "Construí a API de pagamentos em Node.js.",
    );
  });
});

describe("B.2 empresa nao vem colada no cargo", () => {
  it("cargo e empresa saem em campos separados", () => {
    expect(exp(BLOCO_SIMPLES)[0].titulo).toBe("Desenvolvedora Back-end");
    expect(exp(BLOCO_SIMPLES)[0].empresa).toBe("Empresa Alfa");
  });
});

describe("B.3 localizacao nao entra na descricao, qualquer que seja o tamanho", () => {
  const comLocal = (local: string) => `Experience
Empresa Alfa
Desenvolvedora Back-end
janeiro de 2022 - Present
3 anos
${local}
Construí a API de pagamentos em Node.js e reduzi a latência média pela metade.
`;

  it("cidade com estado e pais por extenso (o caso que passava)", () => {
    // 27 caracteres: o corte antigo era `< 18`, entao esta linha entrava.
    expect(exp(comLocal("Campinas, São Paulo, Brazil"))[0].descricao).toBe(
      "Construí a API de pagamentos em Node.js e reduzi a latência média pela metade.",
    );
  });

  it("as outras formas de localizacao do export", () => {
    for (const local of [
      "Brazil",
      "São Paulo, Brazil",
      "Brasília, DF",
      "Belo Horizonte",
      "Remote",
      "Híbrido",
      "Greater São Paulo Area",
    ]) {
      expect(exp(comLocal(local))[0].descricao.startsWith("Construí")).toBe(
        true,
      );
    }
  });

  it("duracao e localizacao em qualquer ordem", () => {
    const invertido = `Experience
Empresa Alfa
Desenvolvedora Back-end
janeiro de 2022 - Present
São Paulo, Brasil
3 anos
Construí a API de pagamentos em Node.js.
`;
    expect(exp(invertido)[0].descricao).toBe(
      "Construí a API de pagamentos em Node.js.",
    );
  });
});

describe("B.4 formato agrupado: uma empresa, varios cargos", () => {
  const agrupado = `Experience
OGF - Orgao Governamental Federal
Intern
June 2024 - June 2026   (2 years 1 month)
Brasília, DF
Implementei praticas de ITIL v4 e melhorei o tempo de resposta do suporte.
Beta Edtech
1 year 1 month
Software Engineer/QA Engineer
August 2024 - November 2024   (4 months)
São Paulo, Brasil
Escrevi a suite de testes ponta a ponta com Cypress e Jest.
Software Engineer/Full-Stack Developer
November 2023 - November 2024   (1 year 1 month)
São Paulo, Brasil
Desenvolvi interfaces em React e APIs em TypeScript.
`;

  it("a duracao total do grupo nao vira titulo nem descricao", () => {
    expect(exp(agrupado).map((e) => e.titulo)).toEqual([
      "Intern",
      "Software Engineer/QA Engineer",
      "Software Engineer/Full-Stack Developer",
    ]);
    for (const e of exp(agrupado)) {
      expect(e.descricao).not.toContain("1 year 1 month");
    }
  });

  it("a empresa fica no cargo a que pertence, nao na experiencia anterior", () => {
    expect(exp(agrupado)[0].descricao).not.toContain("Beta Edtech");
    expect(exp(agrupado)[1].empresa).toBe("Beta Edtech");
  });

  it("o 2o cargo do grupo tem empresa null, e isso e o certo", () => {
    // O export escreve a empresa uma vez so, no topo do grupo. Repetir
    // "Beta Edtech" aqui seria o parser inventando o que o PDF nao diz.
    expect(exp(agrupado)[2].empresa).toBeNull();
    expect(exp(agrupado)[2].titulo).toBe(
      "Software Engineer/Full-Stack Developer",
    );
  });
});

describe("B.5 bullet da experiencia anterior nao entra no titulo seguinte", () => {
  const texto = `Experience
Beta Edtech
Software Engineer/QA Engineer
August 2024 - November 2024   (4 months)
São Paulo, Brasil
Responsibilities:
• Developed an end-to-end testing suite using Cypress.
• Demonstrated high team collaboration for effective QA.
Software Engineer/Full-Stack Developer
November 2023 - November 2024   (1 year 1 month)
São Paulo, Brasil
Desenvolvi interfaces em React.
`;

  it("o titulo e so o cargo", () => {
    expect(exp(texto)[1].titulo).toBe("Software Engineer/Full-Stack Developer");
  });

  it("o bullet continua na descricao a que pertence", () => {
    expect(exp(texto)[0].descricao).toContain(
      "• Demonstrated high team collaboration for effective QA.",
    );
  });

  it("bullet com hifen e com travessao tambem sao reconhecidos", () => {
    for (const marca of ["-", "–", "•"]) {
      const t = texto.replace(
        "• Demonstrated high team collaboration for effective QA.",
        `${marca} Demonstrated high team collaboration for effective QA.`,
      );
      expect(exp(t)[1].titulo).toBe("Software Engineer/Full-Stack Developer");
    }
  });
});

describe("falsos positivos: o que a correcao NAO pode quebrar", () => {
  it("cargo que contem nome de empresa continua inteiro", () => {
    const texto = `Experience
Consultoria Delta
Engenheiro de Software na Consultoria Delta
janeiro de 2022 - Present
3 anos
Construí integrações com sistemas legados em Java.
`;
    expect(exp(texto)[0].titulo).toBe(
      "Engenheiro de Software na Consultoria Delta",
    );
    expect(exp(texto)[0].empresa).toBe("Consultoria Delta");
  });

  it("cargo longo e legitimo, com barra e parenteses, nao e cortado", () => {
    const texto = `Experience
Empresa Alfa
Senior Software Engineer / Tech Lead (Plataforma)
janeiro de 2022 - Present
3 anos
Liderei a plataforma de dados.
`;
    expect(exp(texto)[0].titulo).toBe(
      "Senior Software Engineer / Tech Lead (Plataforma)",
    );
  });

  it("descricao que COMECA com nome de cidade nao e confundida com localizacao", () => {
    const texto = `Experience
Empresa Alfa
Desenvolvedora Back-end
janeiro de 2022 - Present
3 anos
São Paulo foi onde montei o time de plataforma do zero, com cinco pessoas.
`;
    expect(exp(texto)[0].descricao).toBe(
      "São Paulo foi onde montei o time de plataforma do zero, com cinco pessoas.",
    );
  });

  it("experiencia SEM empresa: o cargo nao rouba a linha de cima", () => {
    const texto = `Experience
Desenvolvedora Back-end
janeiro de 2022 - Present
3 anos
Construí a API de pagamentos em Node.js.
`;
    expect(exp(texto)[0].titulo).toBe("Desenvolvedora Back-end");
    expect(exp(texto)[0].empresa).toBeNull();
  });

  it("descricao de uma linha so, curta e legitima, sobrevive inteira", () => {
    const texto = `Experience
Loja do Seu Zé
Atendente
janeiro de 2022 - dezembro de 2023
2 anos
Atendimento ao cliente e organização do estoque da loja.
`;
    expect(exp(texto)[0].descricao).toBe(
      "Atendimento ao cliente e organização do estoque da loja.",
    );
    expect(exp(texto)[0].titulo).toBe("Atendente");
    expect(exp(texto)[0].empresa).toBe("Loja do Seu Zé");
  });

  it("secao de experiencia sem nenhuma data continua virando uma experiencia", () => {
    const texto = `Experience
Empresa Alfa
Trabalhei com integrações e sustentação de sistemas.
`;
    expect(exp(texto)).toHaveLength(1);
    expect(exp(texto)[0].titulo).toBe("Empresa Alfa");
  });
});

describe("residuo conhecido, medido e nao resolvido", () => {
  // O export nao marca fronteira entre o fim de uma descricao e o inicio do
  // bloco seguinte: as duas coisas sao linhas de texto. Quando a descricao
  // termina num fragmento curto, sem pontuacao final e comecando em maiuscula,
  // ele tem a forma exata de uma linha de empresa, e nao ha sinal estrutural
  // para desempatar. Fica documentado aqui em vez de mascarado.

  const fragmento = "Stack: Node";

  it("no bloco SIMPLES o residuo nao aparece: as 2 vagas de cabecalho ja estao ocupadas", () => {
    const texto = `Experience
Empresa Alfa
Desenvolvedora Back-end
janeiro de 2022 - Present
3 anos
Construí a API de pagamentos em Node.js.
${fragmento}
Empresa Beta
Desenvolvedora Front-end
março de 2019 - dezembro de 2021
2 anos 10 meses
Criei o design system em React.
`;
    expect(exp(texto)[1].empresa).toBe("Empresa Beta");
    expect(exp(texto)[0].descricao).toBe(
      `Construí a API de pagamentos em Node.js. ${fragmento}`,
    );
  });

  it("no cargo AGRUPADO ele aparece: nao ha empresa propria, e a vaga fica livre", () => {
    // Dano: uma linha de descricao a menos e uma empresa errada no bloco
    // seguinte. Nunca um crash, e nunca conteudo inventado (o texto existe no
    // perfil, so esta atribuido ao campo errado).
    const texto = `Experience
Beta Edtech
1 year 1 month
Software Engineer/QA Engineer
August 2024 - November 2024   (4 months)
São Paulo, Brasil
Escrevi a suite de testes com Cypress.
${fragmento}
Software Engineer/Full-Stack Developer
November 2023 - November 2024   (1 year 1 month)
São Paulo, Brasil
Desenvolvi interfaces em React.
`;
    expect(exp(texto)[1].empresa).toBe(fragmento);
    expect(exp(texto)[0].descricao).toBe(
      "Escrevi a suite de testes com Cypress.",
    );
  });

  it("mas some assim que o fragmento tem pontuacao de fim de frase", () => {
    const texto = `Experience
Beta Edtech
1 year 1 month
Software Engineer/QA Engineer
August 2024 - November 2024   (4 months)
São Paulo, Brasil
Escrevi a suite de testes com Cypress.
Stack: Node, Jest, Cypress.
Software Engineer/Full-Stack Developer
November 2023 - November 2024   (1 year 1 month)
São Paulo, Brasil
Desenvolvi interfaces em React.
`;
    expect(exp(texto)[1].empresa).toBeNull();
    expect(exp(texto)[0].descricao).toContain("Stack: Node, Jest, Cypress.");
  });
});
