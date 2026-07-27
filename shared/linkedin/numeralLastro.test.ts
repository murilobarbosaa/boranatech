import { describe, expect, it } from "vitest";

import {
  extrairNumerais,
  numeraisSemLastro,
  removerNumeralSemLastro,
} from "./numeralLastro";

const canon = (t: string) => extrairNumerais(t).map((n) => n.canonico).sort();

describe("extrairNumerais: variacao de forma", () => {
  it("percentual com e sem aproximacao", () => {
    expect(canon("cortou 86%")).toContain("86");
    expect(canon("cortou ~86%")).toContain("86");
    expect(canon("cortou cerca de 86%")).toContain("86");
    expect(canon("cut by about 86%")).toContain("86");
  });

  it("separador de milhar em ponto, virgula e espaco", () => {
    expect(canon("3.000 perfis")).toContain("3000");
    expect(canon("3,000 profiles")).toContain("3000");
    expect(canon("3 000 perfis")).toContain("3000");
  });

  it("sufixo de escala", () => {
    expect(canon("3M+ candidate profiles")).toContain("3000000");
    expect(canon("20k usuarios")).toContain("20000");
  });

  it("over N e N+", () => {
    expect(canon("over 20 agents")).toContain("20");
    expect(canon("20+ agents")).toContain("20");
    expect(canon("mais de 20 agentes")).toContain("20");
  });

  it("numero por extenso, PT e EN", () => {
    expect(canon("tres agentes")).toContain("3");
    expect(canon("três agentes")).toContain("3");
    expect(canon("three agents")).toContain("3");
    expect(canon("vinte escolas")).toContain("20");
  });
});

describe("numeraisSemLastro: o caso real medido", () => {
  // Experiencia SEM descricao no PDF: o parser entrega o cabecalho da seguinte.
  const origemCto = "Startup Alfa CTO & Co-founder NexoRH Artificial Intelligence Engineer";
  const origemNexo =
    "NexoRH Artificial Intelligence Engineer Built an LLM orchestrator backed by deterministic pre-routers that cut latency by ~86% on common queries. Architected and deployed a semantic search engine over 3M+ candidate profiles.";
  const origemBotvia =
    "Botvia Generative AI Consultant/Support Analyst Developed over 20 AI agents tailored for 15+ companies. Increased client engagement and value realization from AI.";

  it("pega os tres percentuais fabricados na medicao da Fase 1A", () => {
    expect(
      numeraisSemLastro(
        ["Liderou o desenvolvimento de sistemas de AI para otimização de processos de RH, melhorando a eficiência em 30%."],
        origemCto,
      ).map((x) => x.numeral),
    ).toEqual(["30%"]);

    expect(
      numeraisSemLastro(
        ["Arquitetou um mecanismo de busca semântico para mais de 3 milhões de perfis, melhorando a eficácia de busca em 40%."],
        origemNexo,
      ).map((x) => x.numeral),
    ).toEqual(["40%"]);

    expect(
      numeraisSemLastro(
        ["Aumentou o engajamento do cliente em 25% com soluções de AI adaptadas às necessidades específicas."],
        origemBotvia,
      ).map((x) => x.numeral),
    ).toEqual(["25%"]);
  });

  it("NAO acusa numeral que existe na origem, mesmo com forma diferente", () => {
    expect(
      numeraisSemLastro(
        ["Reduziu a latencia em 86% nas consultas comuns."],
        origemNexo,
      ),
    ).toEqual([]);
    expect(
      numeraisSemLastro(
        ["Motor de busca sobre 3.000.000 de perfis."],
        origemNexo,
      ),
    ).toEqual([]);
    expect(
      numeraisSemLastro(["Criou mais de 20 agentes."], origemBotvia),
    ).toEqual([]);
    expect(
      numeraisSemLastro(["Criou vinte agentes."], origemBotvia),
    ).toEqual([]);
  });

  it("numero de VERSAO colado a letra nao conta como metrica", () => {
    // "ITIL v4", "ES6", "Vue3": identificador, nao resultado.
    expect(numeraisSemLastro(["Implementei ITIL v4 no time."], origemBotvia)).toEqual([]);
    expect(numeraisSemLastro(["Migrei para ES6 e Vue3."], origemBotvia)).toEqual([]);
  });

  it("data e duracao nao contam como metrica", () => {
    expect(numeraisSemLastro(["Atuou em 2024 no projeto."], origemBotvia)).toEqual([]);
    expect(numeraisSemLastro(["Liderou por 4 meses o time."], origemBotvia)).toEqual([]);
    expect(numeraisSemLastro(["Led the team for 2 years."], origemBotvia)).toEqual([]);
  });

  it("TIPO TROCADO: contagem na origem usada como percentual no bullet", () => {
    // Caso real da medicao n=30: a origem diz "25+ IT professionals" e a saida
    // escreveu "satisfacao do usuario em 25%". O 25 existe, o significado nao.
    const origem =
      "OGF Intern Enhanced support systems for 25+ IT professionals. Improved IT service delivery.";
    const fora = numeraisSemLastro(
      ["Implementei frameworks ITIL v4, melhorando a satisfação do usuário em 25%."],
      origem,
    );
    expect(fora.map((x) => x.numeral)).toEqual(["25%"]);
    expect(fora[0].motivo).toBe("tipo_trocado");
  });

  it("percentual na origem sustenta percentual no bullet", () => {
    const origem = "pre-routers that cut latency by ~86% on common queries";
    expect(numeraisSemLastro(["Reduziu a latencia em 86%."], origem)).toEqual([]);
    // "86 percent" por extenso tambem conta como percentual na origem.
    expect(
      numeraisSemLastro(["Cut latency by 86%."], "cut latency by 86 percent"),
    ).toEqual([]);
  });

  it("LIMITACAO REMANESCENTE: reatribuicao de sujeito com o MESMO tipo passa", () => {
    // O perfil atribui os ~86% aos pre-routers em queries comuns. Aqui o
    // numero foi colado no agente. O 86 esta na origem E como percentual nos
    // dois, entao nem a comparacao de tipo pega. Reatribuicao de SUJEITO com o
    // mesmo tipo continua dependendo do prompt e de leitura humana; esta
    // registrado na rubrica, emenda 1.
    expect(
      numeraisSemLastro(
        ["O agente conversacional reduziu o tempo de resposta em 86%."],
        origemNexo,
      ),
    ).toEqual([]);
  });
});

describe("removerNumeralSemLastro: preserva a frase", () => {
  it("remove o numeral e a preposicao, mantendo o resto", () => {
    expect(
      removerNumeralSemLastro(
        "Liderou o desenvolvimento de sistemas de AI, melhorando a eficiência em 30%.",
        "30%",
      ),
    ).toBe("Liderou o desenvolvimento de sistemas de AI, melhorando a eficiência.");
  });

  it("funciona em ingles", () => {
    expect(
      removerNumeralSemLastro("Improved client engagement by 25%.", "25%"),
    ).toBe("Improved client engagement.");
  });

  it("NAO cola as palavras vizinhas quando o numeral esta no meio da frase", () => {
    // Regressao: a primeira versao trocava por vazio e produzia "clientecom".
    expect(
      removerNumeralSemLastro(
        "Aumentou o engajamento do cliente em 25% com soluções de AI adaptadas.",
        "25%",
      ),
    ).toBe("Aumentou o engajamento do cliente com soluções de AI adaptadas.");
  });

  it("o bullet continua sendo uma frase legivel e nao vazia", () => {
    const saida = removerNumeralSemLastro(
      "Arquitetou um mecanismo de busca semântico, melhorando a eficácia de busca em 40%.",
      "40%",
    );
    expect(saida.length).toBeGreaterThan(20);
    expect(saida).not.toContain("40");
    expect(saida.endsWith(".")).toBe(true);
  });
});
