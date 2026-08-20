import { afterEach, describe, expect, it, vi } from "vitest";

import type { LinkedinAnalyzeRequest } from "../../shared/linkedin/schema";
import { TAG_DADOS } from "./linkedinBlocoDeDados";

/** Mesma derivacao do gate: a tag tem um dono so. */
const ABERTURA_DE_BLOCO = `<${TAG_DADOS}`;

/**
 * GATES DE SAIDA COM RETRY CONTEXTUAL (Fase 2, lote 6).
 *
 * O prompt exige idioma por campo e por mercado desde sempre, e nada validava a
 * saida: um Sobre em ingles para quem busca emprego no Brasil atravessava
 * schema e lastro e chegava como texto para colar. A superficie nova do lote 3
 * acrescentou outro risco: a saida pode ecoar a tag dos blocos delimitados.
 *
 * A politica tem tres degraus, e estes casos travam os tres:
 *   1. havendo tentativa no orcamento, UM retry contextual;
 *   2. gasto o orcamento, texto para colar cai no fallback deterministico do
 *      lote 5 e headline reprovada SAI da lista;
 *   3. o orcamento NAO muda: duas chamadas, no maximo, sempre.
 */

vi.mock("./env", async (importActual) => {
  const real = await importActual<typeof import("./env")>();
  return {
    ...real,
    env: { ...real.env, openaiApiKey: "sk-de-teste-nao-usada" },
  };
});

import * as http from "./http";
import { analyzeLinkedin, type AnalyzeAiIo } from "./linkedinAnalyze";

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

const SOBRE_PT =
  "Atuo como desenvolvedora front-end e cuido da acessibilidade das entregas do time.";
const SOBRE_EN =
  "I work as a front-end developer and I care about the accessibility of the team deliveries.";

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
  modeloMensagemRecrutador:
    "Ola, [nome]. Atuo como desenvolvedora front-end e gostaria de conhecer as oportunidades da empresa.",
};

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

interface Evento {
  tipo: string;
  campo: string;
}

interface QualitativeLido {
  headlines: string[];
  sobreReescrito: string;
  modeloMensagemRecrutador: string;
  resumo: string;
}

/** Roda a analise com uma resposta por tentativa, na ordem. */
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
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const violacoes: Evento[] = [];
  vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
    const linha = args.map(String).join(" ");
    if (!linha.includes("ai_lastro_violado")) return;
    violacoes.push(JSON.parse(linha) as Evento);
  });
  const tentativas: AnalyzeAiIo[] = [];
  const { response } = await analyzeLinkedin(pedido(extras), (io) =>
    tentativas.push(io),
  );
  return {
    qual: response.qualitative as unknown as QualitativeLido,
    chamadas: fetchDublado.mock.calls.length,
    tentativas,
    violacoes,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("G1: idioma por mercado", () => {
  it("brasil com Sobre em EN: retry contextual, e a segunda resposta passa", async () => {
    const { qual, chamadas, tentativas } = await analisar([
      { sobreReescrito: SOBRE_EN },
      { sobreReescrito: SOBRE_PT },
    ]);

    expect(chamadas).toBe(2);
    expect(qual.sobreReescrito).toBe(SOBRE_PT);
    // CONTABILIZACAO do lote 2: a tentativa perdida tem desfecho proprio e os
    // tokens dela continuam somando na linha de uso.
    expect(tentativas.map((t) => t.desfecho)).toEqual([
      "gate_reprovado",
      "sucesso",
    ]);
    expect(
      tentativas.every((t) => t.uso.medido && t.uso.inputTokens === 100),
    ).toBe(true);
  });

  it("o diagnostico da segunda chamada nomeia o campo e o idioma exigido", async () => {
    let n = 0;
    const corpos: string[] = [];
    const fetchDublado = vi.fn(async (_url: string, init: RequestInit) => {
      corpos.push(String(init.body));
      n += 1;
      return n === 1
        ? resposta({ sobreReescrito: SOBRE_EN })
        : resposta({ sobreReescrito: SOBRE_PT });
    });
    vi.spyOn(http, "fetchWithTimeout").mockImplementation(fetchDublado);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await analyzeLinkedin(pedido());

    expect(corpos).toHaveLength(2);
    const segunda = JSON.parse(corpos[1]) as {
      messages: Array<{ role: string; content: string }>;
    };
    const texto = segunda.messages.filter((m) => m.role === "user")[0].content;
    expect(texto).toContain("Campos reprovados nas checagens de saída:");
    expect(texto).toContain("sobreReescrito:");
    expect(texto).toContain("português");
    // NUNCA o texto reprovado.
    expect(texto).not.toContain(SOBRE_EN);
  });

  it("persistente: fallback do lote 5, violacao, e NENHUMA terceira chamada", async () => {
    const { qual, chamadas, violacoes } = await analisar([
      { sobreReescrito: SOBRE_EN },
      { sobreReescrito: SOBRE_EN },
    ]);

    expect(chamadas).toBe(2);
    expect(qual.sobreReescrito).not.toBe(SOBRE_EN);
    expect(qual.sobreReescrito).toContain("Atuo como");
    expect(violacoes.some((v) => v.tipo === "idioma_incorreto")).toBe(true);
    expect(
      violacoes.some(
        (v) => v.tipo === "idioma_incorreto" && v.campo === "sobreReescrito",
      ),
    ).toBe(true);
  });

  it("sem orcamento restante: schema falha na 1, gate falha na 2, ZERO extra", async () => {
    let n = 0;
    const fetchDublado = vi.fn(async () => {
      n += 1;
      // Tentativa 1 reprova no SCHEMA, tentativa 2 passa schema e reprova gate.
      return n === 1
        ? resposta({ proximoPasso: 42 })
        : resposta({ sobreReescrito: SOBRE_EN });
    });
    vi.spyOn(http, "fetchWithTimeout").mockImplementation(fetchDublado);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { response } = await analyzeLinkedin(pedido());
    const qual = response.qualitative as unknown as QualitativeLido;

    expect(fetchDublado).toHaveBeenCalledTimes(2);
    expect(qual.sobreReescrito).toContain("Atuo como");
    expect(qual.sobreReescrito).not.toBe(SOBRE_EN);
  });

  it("headline reprovada SAI da lista, e a lista pode encolher", async () => {
    const emIngles =
      "Front-end developer working with the team on the product and the design system";
    const { qual, violacoes } = await analisar(
      [
        {
          headlines: [
            "Front-end developer with the team and the product mindset for you",
            emIngles,
            "Front-end engineer building the product with the team and the design",
          ],
        },
      ],
      { mercado: "brasil" },
    );
    // Mercado brasil NAO gateia headline (o prompt abre excecao para o cargo em
    // ingles), entao as tres continuam.
    expect(qual.headlines).toHaveLength(3);
    expect(violacoes.filter((v) => v.campo === "headlines")).toEqual([]);
  });

  it("exterior: headline em PT sai da lista, as outras ficam", async () => {
    const ptLonga =
      "Desenvolvedora front-end com foco em produto e em acessibilidade para o time";
    const { qual, violacoes, chamadas } = await analisar(
      [
        {
          headlines: [
            "Front-end developer working with the team on the product and the design",
            ptLonga,
            "Front-end engineer building the product with the team and the design",
          ],
          sobreReescrito: SOBRE_EN,
          modeloMensagemRecrutador:
            "Hello, [name]. I work as a front-end developer and would like to know more about the company.",
        },
      ],
      { mercado: "exterior" },
    );
    expect(chamadas).toBe(2);
    expect(qual.headlines).toHaveLength(2);
    expect(qual.headlines).not.toContain(ptLonga);
    expect(
      violacoes.some(
        (v) => v.tipo === "idioma_incorreto" && v.campo === "headlines",
      ),
    ).toBe(true);
  });

  it("todas as headlines reprovadas: lista VAZIA, sem completamento", async () => {
    const pt1 =
      "Desenvolvedora front-end com foco em produto e em acessibilidade para o time";
    const pt2 =
      "Engenheira de front-end com foco no produto e na acessibilidade do time";
    const pt3 =
      "Desenvolvedora de interfaces com foco em produto e na experiencia do time";
    const { qual } = await analisar(
      [
        {
          headlines: [pt1, pt2, pt3],
          sobreReescrito: SOBRE_EN,
          modeloMensagemRecrutador:
            "Hello, [name]. I work as a front-end developer and would like to know more about the company.",
        },
      ],
      { mercado: "exterior" },
    );
    expect(qual.headlines).toEqual([]);
  });

  it("indeterminado NAO reprova: campo curto segue integro, zero retry", async () => {
    const curto = "React e produto.";
    const { qual, chamadas, violacoes } = await analisar([
      { sobreReescrito: curto },
    ]);
    expect(chamadas).toBe(1);
    expect(qual.sobreReescrito).toBe(curto);
    expect(violacoes).toEqual([]);
  });
});

describe("G2: vazamento de delimitador", () => {
  it("campo que ecoa a tag reprova, retenta e cai no fallback se insistir", async () => {
    const vazado = `${ABERTURA_DE_BLOCO} campo="sobre"> Atuo como desenvolvedora front-end no time.`;
    const { qual, chamadas, violacoes, tentativas } = await analisar([
      { sobreReescrito: vazado },
      { sobreReescrito: vazado },
    ]);

    expect(chamadas).toBe(2);
    expect(tentativas.map((t) => t.desfecho)).toEqual([
      "gate_reprovado",
      "gate_reprovado",
    ]);
    expect(qual.sobreReescrito).not.toContain(ABERTURA_DE_BLOCO);
    expect(qual.sobreReescrito).toContain("Atuo como");
    expect(violacoes.some((v) => v.tipo === "vazamento_delimitador")).toBe(
      true,
    );
  });

  it("vazamento em campo de conversa: a TAG sai, o resto do texto fica", async () => {
    const resumoVazado = `${ABERTURA_DE_BLOCO} campo="sobre"> O perfil mostra base boa de front-end no time.`;
    const { qual, violacoes } = await analisar([
      { resumo: resumoVazado },
      { resumo: resumoVazado },
    ]);
    // EXPECTATIVA ATUALIZADA no mini-lote de fechamento da Fase 2. Antes este
    // caso afirmava `toBe(resumoVazado)`, ou seja, a tag chegando literalmente
    // a tela da pessoa. A regra da classe 1 protege conteudo SEMANTICO; a tag e
    // artefato do nosso proprio prompt ecoado pelo modelo, e tira-la nao muda
    // nada do que ele disse. O que continua valendo, e esta afirmado abaixo: o
    // texto do modelo permanece palavra por palavra, e a violacao e registrada.
    expect(qual.resumo).toBe("O perfil mostra base boa de front-end no time.");
    expect(qual.resumo).not.toContain(ABERTURA_DE_BLOCO);
    expect(
      violacoes.some(
        (v) => v.tipo === "vazamento_delimitador" && v.campo === "resumo",
      ),
    ).toBe(true);
  });
});

describe("o fallback nunca e re-gateado", () => {
  it("mercado exterior com Sobre reprovado entrega o fallback EN, sem novo ciclo", async () => {
    const { qual, chamadas } = await analisar(
      [{ sobreReescrito: SOBRE_PT }, { sobreReescrito: SOBRE_PT }],
      { mercado: "exterior" },
    );
    // O fallback do lote 5 sai em ingles para este mercado, e nao passa por
    // gate nenhum: se passasse, um detector infeliz poderia reprova-lo e nao
    // haveria mais nada para entregar.
    expect(chamadas).toBe(2);
    expect(qual.sobreReescrito).toContain("I work as");
  });
});
