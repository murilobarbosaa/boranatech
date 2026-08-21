import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LinkedinAnalyzeRequest } from "../../shared/linkedin/schema";
import { LinkedinQualitativeSchema } from "../../shared/linkedin/schema";
import {
  CONTAGEM_INDISPONIVEL,
  PROCEDENCIA_DESCONHECIDA,
  readQualitative,
} from "../../shared/linkedin/readQualitative";
import { readLinkedinAnalysisResponse } from "../../shared/linkedin/readAnalysis";
import { toOpenAIStrictSchema } from "./openaiStrictSchema";
import { TAG_DADOS } from "./linkedinBlocoDeDados";

/**
 * PROCEDENCIA DA ENTREGA (Fase 3, lote 1).
 *
 * O servidor da Fase 2 ja tomava tres decisoes de entrega que o payload nao
 * comunicava, e a interface nao tinha como ser honesta sobre nenhuma delas:
 * substituicao do texto para colar pelo fallback deterministico (lastro de
 * classe 2 ou gate persistente), encolhimento da lista de sugestoes de headline
 * e limpeza de tag vazada na prosa.
 *
 * Estes casos travam DUAS propriedades, e a segunda e a que da valor a primeira:
 *
 *   1. o valor entregue esta certo em cada cenario;
 *   2. o valor NASCE no ponto da decisao. Por isso os casos de gate rodam o
 *      fluxo REAL de duas tentativas com respostas congeladas, em vez de chamar
 *      a funcao interna: um valor inferido depois, comparando o texto entregue
 *      com o texto do fallback, passaria no item 1 e falharia aqui, porque
 *      texto igual por coincidencia produziria o mesmo veredito que uma
 *      substituicao de verdade.
 *
 * Nenhuma requisicao sai: `fetchWithTimeout` e dublado em todos os casos.
 */

vi.mock("./env", async (importActual) => {
  const real = await importActual<typeof import("./env")>();
  return {
    ...real,
    env: { ...real.env, openaiApiKey: "sk-de-teste-nao-usada" },
  };
});

import * as http from "./http";
import { analyzeLinkedin } from "./linkedinAnalyze";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(AQUI, "__fixtures__", "linkedin");

const PERFIL = `Contato
teste@email.com
Fulana Teste
Desenvolvedora Front-end | React, TypeScript
Resumo
Sou desenvolvedora front-end construindo interfaces de produto com React e TypeScript para times distribuidos e cuido de acessibilidade nas entregas do time.
Experience
Empresa Alfa
Desenvolvedora Front-end
janeiro de 2022 - Present
2 anos
Desenvolvi telas em React e TypeScript para 12 squads internos e acompanhei metricas.`;

const SOBRE_PT =
  "Atuo como desenvolvedora front-end e cuido da acessibilidade das entregas do time.";
const SOBRE_EN =
  "I work as a front-end developer and I care about the accessibility of the team deliveries.";
const MENSAGEM_PT =
  "Ola, [nome]. Atuo como desenvolvedora front-end e gostaria de conhecer as oportunidades da empresa.";

const ABERTURA_DE_BLOCO = `<${TAG_DADOS}`;

const BASE = {
  resumo:
    "O perfil mostra experiencia em front-end e uma base boa de acessibilidade no time.",
  pontosFortes: ["Ponto um.", "Ponto dois.", "Ponto tres."],
  pontosFracos: ["Fraco um.", "Fraco dois.", "Fraco tres."],
  melhorias: [
    { prioridade: "alta", titulo: "Melhoria um", comoFazer: "Faca isso." },
    { prioridade: "alta", titulo: "Melhoria dois", comoFazer: "Faca aquilo." },
    { prioridade: "media", titulo: "Melhoria tres", comoFazer: "Faca mais." },
    { prioridade: "baixa", titulo: "Melhoria quatro", comoFazer: "E isso." },
  ],
  proximoPasso: "Comece hoje pela headline do seu perfil.",
  headlines: [
    "Front-end | React | foco em produto",
    "Front-end | TypeScript | foco em produto",
    "Front-end | React | design system",
  ],
  sobreReescrito: SOBRE_PT,
  bulletsReescritos: [],
  skillsParaEstudar: [],
  modeloMensagemRecrutador: MENSAGEM_PT,
};

function pedido(
  extras: Partial<LinkedinAnalyzeRequest> = {},
): LinkedinAnalyzeRequest {
  return {
    profileText: PERFIL,
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "React, TypeScript",
    foto: "sim",
    banner: "sim",
    openToWork: "sim",
    conexoes: "100-500",
    atividade: "semanal",
    ...extras,
  } as LinkedinAnalyzeRequest;
}

function resposta(patch: Record<string, unknown>): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [
        {
          finish_reason: "stop",
          message: { content: JSON.stringify({ ...BASE, ...patch }) },
        },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 100 },
    }),
    text: async () => "",
  } as unknown as Response;
}

/** Roda o fluxo REAL com uma resposta congelada por tentativa, na ordem. */
async function analisar(
  respostas: Array<Record<string, unknown>>,
  extras: Partial<LinkedinAnalyzeRequest> = {},
) {
  let n = 0;
  const fetchDublado = vi.fn(async () => {
    const patch = respostas[Math.min(n, respostas.length - 1)];
    n += 1;
    return resposta(patch);
  });
  vi.spyOn(http, "fetchWithTimeout").mockImplementation(fetchDublado);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const { response } = await analyzeLinkedin(pedido(extras));
  return {
    response,
    procedencia: response.qualitative.procedencia,
    qualitative: response.qualitative,
    chamadas: fetchDublado.mock.calls.length,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("P1: resposta limpa", () => {
  it("origem modelo nos dois campos e nenhuma sugestao removida", async () => {
    const { procedencia, chamadas } = await analisar([{}]);

    expect(chamadas).toBe(1);
    expect(procedencia.sobreReescrito).toBe("modelo");
    expect(procedencia.modeloMensagemRecrutador).toBe("modelo");
    expect(procedencia.sugestoesHeadline).toEqual({
      entregues: 3,
      removidasPorGate: 0,
    });
    expect(procedencia.camposProsaLimpos).toBe(0);
  });
});

describe("P2: lastro de classe 2 substitui o texto para colar", () => {
  it("tecnologia sem lastro no Sobre: fallback ali, modelo na mensagem", async () => {
    // Kubernetes nao aparece no perfil, entao o Sobre inteiro e recusado. A
    // mensagem ao recrutador segue limpa, e e isso que separa os dois campos:
    // a procedencia e um fato POR CAMPO, nao um veredito por analise.
    const { procedencia, qualitative } = await analisar([
      {
        sobreReescrito: `${SOBRE_PT} Trabalho com Kubernetes todos os dias.`,
      },
    ]);

    expect(procedencia.sobreReescrito).toBe("fallback");
    expect(procedencia.modeloMensagemRecrutador).toBe("modelo");
    // O texto entregue e mesmo o determinístico, nao o do modelo.
    expect(qualitative.sobreReescrito).not.toContain("Kubernetes");
    expect(qualitative.modeloMensagemRecrutador).toBe(MENSAGEM_PT);
  });

  it("os dois campos recusados: fallback nos dois", async () => {
    const { procedencia } = await analisar([
      {
        sobreReescrito: `${SOBRE_PT} Trabalho com Kubernetes todos os dias.`,
        modeloMensagemRecrutador: `${MENSAGEM_PT} Uso Kubernetes.`,
      },
    ]);

    expect(procedencia.sobreReescrito).toBe("fallback");
    expect(procedencia.modeloMensagemRecrutador).toBe("fallback");
  });
});

describe("P3: gate persistente, no fluxo real de duas tentativas", () => {
  it("Sobre em EN nas duas tentativas: fallback, e o valor nasce no gate", async () => {
    // O gate de idioma reprova na primeira, o laco gasta o retry contextual, a
    // segunda reprova de novo e so entao o fallback entra. Duas chamadas de
    // verdade, respostas congeladas, zero rede.
    const { procedencia, qualitative, chamadas } = await analisar([
      { sobreReescrito: SOBRE_EN },
      { sobreReescrito: SOBRE_EN },
    ]);

    expect(chamadas).toBe(2);
    expect(procedencia.sobreReescrito).toBe("fallback");
    expect(procedencia.modeloMensagemRecrutador).toBe("modelo");
    expect(qualitative.sobreReescrito).not.toBe(SOBRE_EN);
  });

  it("Sobre recuperado na segunda tentativa: origem modelo, sem fallback", async () => {
    // O contraste que prova que o valor segue a DECISAO e nao a existencia de
    // uma reprova: houve reprova de gate na primeira chamada, e mesmo assim o
    // campo entregue e do modelo, porque o retry passou.
    const { procedencia, qualitative, chamadas } = await analisar([
      { sobreReescrito: SOBRE_EN },
      { sobreReescrito: SOBRE_PT },
    ]);

    expect(chamadas).toBe(2);
    expect(procedencia.sobreReescrito).toBe("modelo");
    expect(qualitative.sobreReescrito).toBe(SOBRE_PT);
  });
});

describe("P4: sugestoes de headline removidas por gate", () => {
  it("uma reprovada: entregues 2, removidas 1", async () => {
    const vazada = `Front-end | React | ${ABERTURA_DE_BLOCO} campo="sobre">`;
    const { procedencia, qualitative } = await analisar([
      { headlines: [BASE.headlines[0], BASE.headlines[1], vazada] },
    ]);

    expect(procedencia.sugestoesHeadline).toEqual({
      entregues: 2,
      removidasPorGate: 1,
    });
    expect(qualitative.headlines).toHaveLength(2);
  });

  it("todas reprovadas: entregues 0, removidas 3, e a lista vazia e honesta", async () => {
    const vazada = (n: number) =>
      `Front-end | React | opcao ${n} ${ABERTURA_DE_BLOCO} campo="sobre">`;
    const { procedencia, qualitative } = await analisar([
      { headlines: [vazada(1), vazada(2), vazada(3)] },
    ]);

    expect(procedencia.sugestoesHeadline).toEqual({
      entregues: 0,
      removidasPorGate: 3,
    });
    expect(qualitative.headlines).toEqual([]);
  });
});

describe("P5: limpeza de tag na prosa de classe 1", () => {
  it("tag persistente no resumo: um campo limpo, e o texto segue integro", async () => {
    const vazado = `${BASE.resumo} ${ABERTURA_DE_BLOCO} campo="sobre">`;
    const { procedencia, qualitative, chamadas } = await analisar([
      { resumo: vazado },
      { resumo: vazado },
    ]);

    expect(chamadas).toBe(2);
    expect(procedencia.camposProsaLimpos).toBe(1);
    // Classe 1 nao substitui: o texto do modelo continua ali, so sem a tag. Por
    // isso a origem dos campos para colar NAO muda, e este e o fato que separa
    // "a plataforma tocou no texto" de "a plataforma trocou o texto".
    expect(qualitative.resumo).not.toContain(ABERTURA_DE_BLOCO);
    expect(qualitative.resumo).toContain("O perfil mostra experiencia");
    expect(procedencia.sobreReescrito).toBe("modelo");
    expect(procedencia.modeloMensagemRecrutador).toBe("modelo");
  });

  it("dois campos de prosa vazados: contagem 2", async () => {
    const marca = `${ABERTURA_DE_BLOCO} campo="sobre">`;
    const vazado = {
      resumo: `${BASE.resumo} ${marca}`,
      proximoPasso: `${BASE.proximoPasso} ${marca}`,
    };
    const { procedencia } = await analisar([vazado, vazado]);

    expect(procedencia.camposProsaLimpos).toBe(2);
  });
});

describe("P6: atalho de perfil quase vazio", () => {
  it("origem sem_modelo nos dois campos, com zero chamadas", async () => {
    // TERCEIRO estado, e ele existe porque a realidade tem tres caminhos.
    // `fallback` afirmaria uma tentativa do modelo que foi recusada, e aqui
    // nenhuma tentativa aconteceu; `modelo` atribuiria a IA um texto que ela
    // nunca escreveu. A prova de que nao houve chamada e o contador do dublê.
    const fetchDublado = vi.fn(async () => resposta({}));
    vi.spyOn(http, "fetchWithTimeout").mockImplementation(fetchDublado);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const profileText = readFileSync(
      path.join(FIXTURES, "perfil-g-vazio.txt"),
      "utf8",
    );
    const { response } = await analyzeLinkedin(pedido({ profileText }));
    const { procedencia } = response.qualitative;

    expect(fetchDublado.mock.calls.length).toBe(0);
    expect(procedencia.sobreReescrito).toBe("sem_modelo");
    expect(procedencia.modeloMensagemRecrutador).toBe("sem_modelo");
    // O atalho entrega as tres sugestoes proprias e nao passa por gate nenhum.
    expect(procedencia.sugestoesHeadline).toEqual({
      entregues: 3,
      removidasPorGate: 0,
    });
    expect(procedencia.camposProsaLimpos).toBe(0);
  });
});

describe("P7: roundtrip pelo persistido", () => {
  it("o objeto atravessa readLinkedinAnalysisResponse e readQualitative intacto", async () => {
    const { response } = await analisar([
      { sobreReescrito: `${SOBRE_PT} Trabalho com Kubernetes todos os dias.` },
    ]);

    // O caminho real do jsonb: serializa, volta, passa pelos dois readers.
    const persistido: unknown = JSON.parse(JSON.stringify(response));
    const lido = readLinkedinAnalysisResponse(persistido);
    expect(lido).not.toBeNull();

    const view = readQualitative(lido?.qualitative, lido?.qualitativeVersion);
    expect(view.procedencia).toEqual({
      sobreReescrito: "fallback",
      modeloMensagemRecrutador: "modelo",
      sugestoesHeadline: { entregues: 3, removidasPorGate: 0 },
      camposProsaLimpos: 0,
    });
  });
});

describe("P8: payload antigo, sem o objeto", () => {
  const ANTIGO = {
    resumo: "Analise gravada antes do lote da procedencia.",
    pontosFortes: ["Ponto um."],
    pontosFracos: ["Fraco um."],
    melhorias: [],
    proximoPasso: "Comece pela headline.",
    headlines: ["Front-end | React"],
    sobreReescrito: SOBRE_PT,
    bulletsReescritos: [],
    skillsParaEstudar: [],
    modeloMensagemRecrutador: MENSAGEM_PT,
  };

  it("origem desconhecida e contagens indisponiveis, sem lancar", () => {
    const view = readQualitative(ANTIGO, 3);

    expect(view.procedencia.sobreReescrito).toBe(PROCEDENCIA_DESCONHECIDA);
    expect(view.procedencia.modeloMensagemRecrutador).toBe(
      PROCEDENCIA_DESCONHECIDA,
    );
    expect(view.procedencia.sugestoesHeadline.entregues).toBe(
      CONTAGEM_INDISPONIVEL,
    );
    expect(view.procedencia.sugestoesHeadline.removidasPorGate).toBe(
      CONTAGEM_INDISPONIVEL,
    );
    expect(view.procedencia.camposProsaLimpos).toBe(CONTAGEM_INDISPONIVEL);
  });

  it("indisponivel NAO e zero, e desconhecida NAO e modelo", () => {
    const view = readQualitative(ANTIGO, 3);

    // O ponto inteiro deste lote: ausencia de medicao nunca vira medicao. Uma
    // lista de uma headline com contagem "0 entregues" seria mentira, e
    // "origem modelo" atribuiria autoria que ninguem registrou.
    expect(view.procedencia.sugestoesHeadline.entregues).not.toBe(0);
    expect(view.procedencia.camposProsaLimpos).not.toBe(0);
    expect(view.procedencia.sobreReescrito).not.toBe("modelo");
    // E o resto da leitura segue funcionando: degradar a procedencia nao pode
    // custar o conteudo que a analise antiga de fato tem.
    expect(view.headlines).toEqual(["Front-end | React"]);
    expect(view.sobreReescrito).toBe(SOBRE_PT);
  });

  it("objeto presente mas corrompido cai nos mesmos estados nomeados", () => {
    const view = readQualitative(
      {
        ...ANTIGO,
        procedencia: {
          sobreReescrito: "origem_que_nao_existe",
          modeloMensagemRecrutador: 42,
          sugestoesHeadline: { entregues: -1, removidasPorGate: "tres" },
          camposProsaLimpos: 1.5,
        },
      },
      3,
    );

    expect(view.procedencia.sobreReescrito).toBe(PROCEDENCIA_DESCONHECIDA);
    expect(view.procedencia.modeloMensagemRecrutador).toBe(
      PROCEDENCIA_DESCONHECIDA,
    );
    expect(view.procedencia.sugestoesHeadline.entregues).toBe(
      CONTAGEM_INDISPONIVEL,
    );
    expect(view.procedencia.sugestoesHeadline.removidasPorGate).toBe(
      CONTAGEM_INDISPONIVEL,
    );
    expect(view.procedencia.camposProsaLimpos).toBe(CONTAGEM_INDISPONIVEL);
  });
});

describe("P9: o schema do modelo nao muda", () => {
  const CHAVES_NOVAS = [
    "procedencia",
    "sugestoesHeadline",
    "removidasPorGate",
    "camposProsaLimpos",
    "sem_modelo",
    // Fase 3, lote 4: o resumo de lastro e METADADO DE ENTREGA, decidido pelo
    // servidor DEPOIS da resposta do modelo. Se vazasse para o schema estrito,
    // a OpenAI passaria a ser cobrada por gerar um campo que ela nao tem como
    // saber, e pior, poderia preenche-lo com um numero inventado que o painel
    // do admin somaria como se fosse medicao.
    "lastroResumo",
    "porTipo",
  ];

  it("toOpenAIStrictSchema nao carrega nenhuma chave da procedencia", () => {
    const json = JSON.stringify(
      toOpenAIStrictSchema(LinkedinQualitativeSchema),
    );

    for (const chave of CHAVES_NOVAS) {
      expect(json).not.toContain(chave);
    }
  });

  it("o schema enviado continua com exatamente os campos do modelo", () => {
    const schema = toOpenAIStrictSchema(LinkedinQualitativeSchema) as {
      properties: Record<string, unknown>;
      required?: string[];
    };

    // Lista escrita por extenso de proposito: chave nova que escape para o
    // contrato do modelo quebra AQUI, e nao numa fatura da OpenAI.
    expect(Object.keys(schema.properties).sort()).toEqual([
      "bulletsReescritos",
      "headlines",
      "melhorias",
      "modeloMensagemRecrutador",
      "pontosFortes",
      "pontosFracos",
      "proximoPasso",
      "resumo",
      "skillsParaEstudar",
      "sobreReescrito",
    ]);
  });
});
