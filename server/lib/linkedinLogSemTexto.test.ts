import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LinkedinAnalyzeRequest } from "../../shared/linkedin/schema";
import { TAG_DADOS } from "./linkedinBlocoDeDados";
import {
  contextoSeguroDoAnalisador,
  DESFECHO_INDISPONIVEL,
  MAX_TERMO_CHARS,
  SUFIXO_CORTE,
  TODOS_OS_TIPOS_CLASSIFICADOS,
  violacaoParaLog,
} from "./linkedinObservabilidade";

/**
 * ANTI-VAZAMENTO DE LOG E DE SENTRY (Fase 4, lote de privacidade).
 *
 * PERMANENTE, nao prova descartavel. A Fase 3 fez o equivalente para a
 * telemetria do cliente; este arquivo cobre o lado do servidor, onde o stdout
 * vai para o Railway e o `extra` do Sentry viaja para fora.
 *
 * COMO ELE FUNCIONA, e por que assim: o perfil da fixture carrega MARCADORES
 * improvaveis em headline, Sobre, experiencia e nome de arquivo. Os fluxos
 * rodam de ponta a ponta com a OpenAI dublada, e TODA chamada de `console` e
 * do Sentry e capturada e varrida RECURSIVAMENTE. Um marcador em qualquer
 * lugar (chave, valor, objeto aninhado, string serializada) reprova.
 *
 * Varrer recursivamente e nao so olhar o primeiro argumento e deliberado: o
 * vazamento original saia dentro de um `JSON.stringify` e dentro do `extra` do
 * Sentry, dois lugares que um assert ingenuo nao alcanca.
 */

vi.mock("./env", async (importActual) => {
  const real = await importActual<typeof import("./env")>();
  return {
    ...real,
    env: { ...real.env, openaiApiKey: "sk-de-teste-nao-usada" },
  };
});

/**
 * Espiao proprio do Sentry, e nao o `__mocks__/sentryEspiao` da casa, por um
 * motivo: aquele nao registra `captureException`, e aqui as DUAS portas
 * precisam ser varridas. Substituir o modulo inteiro e a unica forma sob ESM
 * (`vi.spyOn` nao redefine namespace de modulo).
 */
const sentrySpy = vi.hoisted(() => {
  const capturas: Array<{ onde: string; args: unknown[] }> = [];
  return {
    capturas,
    captureMessage: (...args: unknown[]) => {
      capturas.push({ onde: "sentry.captureMessage", args });
      return "id-de-teste";
    },
    captureException: (...args: unknown[]) => {
      capturas.push({ onde: "sentry.captureException", args });
      return "id-de-teste";
    },
  };
});

vi.mock("@sentry/node", () => ({
  captureMessage: sentrySpy.captureMessage,
  captureException: sentrySpy.captureException,
  withScope: (fn: (scope: unknown) => void) =>
    fn({ setTag: () => undefined, setContext: () => undefined }),
  init: () => undefined,
  setupExpressErrorHandler: () => undefined,
  expressIntegration: () => ({}),
}));

import * as http from "./http";
import { analyzeLinkedin } from "./linkedinAnalyze";

/** Improvaveis de propositio: se aparecerem num log, vieram do perfil. */
const MARCADOR_HEADLINE = "ZQXJHEADLINEZQXJ";
const MARCADOR_SOBRE = "ZQXJSOBREZQXJ";
const MARCADOR_EXPERIENCIA = "ZQXJEXPERIENCIAZQXJ";
const MARCADOR_EMPRESA = "ZQXJEMPRESAZQXJ";
const MARCADOR_ARQUIVO = "ZQXJcurriculo-de-fulanaZQXJ.pdf";
const MARCADORES = [
  MARCADOR_HEADLINE,
  MARCADOR_SOBRE,
  MARCADOR_EXPERIENCIA,
  MARCADOR_EMPRESA,
  MARCADOR_ARQUIVO,
];

const PERFIL = `Contato
teste@email.com
Fulana Teste
Desenvolvedora Front-end | React, TypeScript | ${MARCADOR_HEADLINE}
Resumo
Sou desenvolvedora front-end e cuido de acessibilidade. ${MARCADOR_SOBRE} Trabalho com React e TypeScript em times distribuidos e acompanho metricas de entrega junto com design e produto.
Experience
${MARCADOR_EMPRESA}
Desenvolvedora Front-end
janeiro de 2022 - Present
2 anos
Desenvolvi telas em React e TypeScript para 12 squads internos. ${MARCADOR_EXPERIENCIA}`;

const PERFIL_VAZIO = `Contato
lucas@email.com
${MARCADOR_EMPRESA}
Education
Instituto Tecnico Delta
Curso Tecnico em Informatica
2021 - 2023
Instituto Tecnico Delta
Curso livre de logica de programacao
2020 - 2020`;

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

const ABERTURA_DE_BLOCO = `<${TAG_DADOS}`;

const CAMINHO_LASTRO = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "shared",
  "linkedin",
  "lastro.ts",
);

const BASE = {
  resumo: "O perfil mostra experiencia real em front-end e acessibilidade.",
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
    "Front-end | TypeScript | design system",
    "Front-end | React | acessibilidade",
  ],
  sobreReescrito:
    "Atuo como desenvolvedora front-end e cuido da acessibilidade das entregas.",
  bulletsReescritos: [],
  skillsParaEstudar: [],
  modeloMensagemRecrutador:
    "Ola, [nome]. Atuo como desenvolvedora front-end e gostaria de conversar.",
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

/** Serializa qualquer argumento, inclusive objeto aninhado e Error. */
function achatar(valor: unknown): string {
  if (typeof valor === "string") return valor;
  if (valor instanceof Error) return `${valor.name} ${valor.message}`;
  try {
    return JSON.stringify(valor) ?? String(valor);
  } catch {
    return String(valor);
  }
}

interface Capturado {
  onde: string;
  texto: string;
}

/**
 * Roda um fluxo com a OpenAI dublada, capturando console e Sentry.
 *
 * Devolve TUDO o que sairia do processo, ja achatado em texto, para o assert
 * varrer de uma vez.
 */
async function rodar(
  respostas: Array<Record<string, unknown>>,
  extras: Partial<LinkedinAnalyzeRequest> = {},
): Promise<Capturado[]> {
  const saidas: Capturado[] = [];
  const anota =
    (onde: string) =>
    (...args: unknown[]) => {
      saidas.push({ onde, texto: args.map(achatar).join(" ") });
    };

  let n = 0;
  vi.spyOn(http, "fetchWithTimeout").mockImplementation(async () => {
    const patch = respostas[Math.min(n, respostas.length - 1)];
    n += 1;
    return resposta(patch);
  });
  vi.spyOn(console, "warn").mockImplementation(anota("console.warn"));
  vi.spyOn(console, "error").mockImplementation(anota("console.error"));
  vi.spyOn(console, "log").mockImplementation(anota("console.log"));
  sentrySpy.capturas.length = 0;

  try {
    await analyzeLinkedin(pedido(extras));
  } catch {
    // Fluxo de erro tambem e objeto deste teste: o que interessa e o que saiu.
  }
  for (const c of sentrySpy.capturas) {
    saidas.push({ onde: c.onde, texto: c.args.map(achatar).join(" ") });
  }
  return saidas;
}

function exigirSemMarcador(saidas: Capturado[]) {
  for (const { onde, texto } of saidas) {
    for (const marcador of MARCADORES) {
      expect(
        texto.includes(marcador),
        `vazou "${marcador}" em ${onde}: ${texto.slice(0, 200)}`,
      ).toBe(false);
    }
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("V1: nenhum fluxo do analisador escreve texto de usuario", () => {
  it("sucesso limpo", async () => {
    const saidas = await rodar([{}]);
    exigirSemMarcador(saidas);
  });

  it("falha de schema com retry", async () => {
    const saidas = await rodar([{ pontosFracos: [] }, {}]);
    exigirSemMarcador(saidas);
  });

  it("gate reprovado com fallback (idioma persistente)", async () => {
    const en =
      "I work as a front-end developer and I care about accessibility of the deliveries.";
    const saidas = await rodar([
      { sobreReescrito: en },
      { sobreReescrito: en },
    ]);
    exigirSemMarcador(saidas);
  });

  it("lastro de classe 2: o Sobre inteiro seria o vazamento original", async () => {
    // O caso ancora. Antes desta correcao, `contexto` levava este texto inteiro
    // para o stdout e para o `extra` do Sentry, em TODA ocorrencia.
    const saidas = await rodar([
      {
        sobreReescrito: `Atuo como desenvolvedora. ${MARCADOR_SOBRE} Trabalho com Kubernetes todos os dias.`,
      },
    ]);
    exigirSemMarcador(saidas);
    // E o log da violacao saiu mesmo, com a contagem no lugar do texto.
    const violacao = saidas.find((s) => s.texto.includes("ai_lastro_violado"));
    expect(violacao).toBeTruthy();
    expect(violacao?.texto).toContain("contextoChars");
  });

  it("vazamento de delimitador na prosa", async () => {
    const marca = `${ABERTURA_DE_BLOCO} campo="sobre">`;
    const saidas = await rodar([
      { resumo: `${BASE.resumo} ${marca}` },
      { resumo: `${BASE.resumo} ${marca}` },
    ]);
    exigirSemMarcador(saidas);
  });

  it("warm empty (perfil quase vazio, zero chamada)", async () => {
    const saidas = await rodar([{}], { profileText: PERFIL_VAZIO });
    exigirSemMarcador(saidas);
  });

  it("erro da OpenAI: a mensagem do upstream nao ecoa o prompt", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockImplementation(async () => {
      // Mensagem de erro que CITA o prompt, como a OpenAI faz em falha de
      // conteudo. Se o log usasse `err.message`, o marcador sairia daqui.
      throw new Error(`400 invalid content in prompt: ${MARCADOR_SOBRE}`);
    });
    const saidas: Capturado[] = [];
    const anota =
      (onde: string) =>
      (...args: unknown[]) => {
        saidas.push({ onde, texto: args.map(achatar).join(" ") });
      };
    vi.spyOn(console, "warn").mockImplementation(anota("console.warn"));
    vi.spyOn(console, "error").mockImplementation(anota("console.error"));
    try {
      await analyzeLinkedin(pedido());
    } catch {
      // esperado
    }
    exigirSemMarcador(saidas);
  });
});

describe("V2: violacaoParaLog e a fonte unica da redacao", () => {
  it("contexto nunca sai, e vira contagem", () => {
    const saida = violacaoParaLog({
      tipo: "colar_tecnologia_sem_lastro",
      campo: "sobreReescrito",
      contexto: MARCADOR_SOBRE,
      termo: "Kubernetes",
    });

    expect(JSON.stringify(saida)).not.toContain(MARCADOR_SOBRE);
    expect(saida.contextoChars).toBe(MARCADOR_SOBRE.length);
    // O termo curto do que foi fabricado FICA: e ele que calibra o prompt.
    expect(saida.termo).toBe("Kubernetes");
  });

  it("o contexto sai mesmo quando o campo inteiro e enorme", () => {
    const sobreInteiro = `Atuo como desenvolvedora. ${MARCADOR_SOBRE} `.repeat(
      20,
    );
    const saida = violacaoParaLog({
      tipo: "colar_tecnologia_sem_lastro",
      campo: "sobreReescrito",
      contexto: sobreInteiro,
      termo: "Kubernetes",
    });

    expect(JSON.stringify(saida)).not.toContain(MARCADOR_SOBRE);
    expect(saida.contextoChars).toBe(sobreInteiro.length);
  });

  it("termo longo demais e cortado e o corte se anuncia", () => {
    // `skill_estudo_sem_lastro` traz string escrita pelo MODELO, sem tamanho
    // garantido por catalogo: e o unico caminho por onde texto comprido
    // poderia entrar no termo.
    const longo = "X".repeat(MAX_TERMO_CHARS + 50);
    const saida = violacaoParaLog({
      tipo: "skill_estudo_sem_lastro",
      campo: "skillsParaEstudar",
      contexto: "skillsParaEstudar",
      termo: longo,
    });

    expect(saida.termo.endsWith(SUFIXO_CORTE)).toBe(true);
    expect(saida.termo.length).toBe(MAX_TERMO_CHARS + SUFIXO_CORTE.length);
  });

  it("o conjunto classificado e IGUAL a uniao real, nao um subconjunto", () => {
    // Contramedida da casa: afirmar o TOTAL. A primeira versao deste modulo
    // leu a uniao pela metade e o defeito passou. Tipo novo quebra aqui.
    const fonte = readFileSync(CAMINHO_LASTRO, "utf8");
    const bloco = fonte
      .slice(fonte.indexOf("export type TipoViolacao"))
      .split(";")[0];
    // So membros da uniao: linha que comeca com `|` e uma string. Casar
    // qualquer aspas do bloco pegaria tambem palavra citada em comentario.
    const daFonte = new Set(
      bloco
        .split("\n")
        .map((linha) => linha.trim().match(/^\|\s*"([a-z_]+)"$/)?.[1])
        .filter((t): t is string => t !== undefined),
    );

    expect(daFonte.size).toBeGreaterThan(0);
    // Array.from em vez de spread: o tsconfig da aplicacao nao declara target,
    // entao cai em ES5 e o spread de Set nao compila.
    expect(Array.from(daFonte).sort()).toEqual(
      Array.from(TODOS_OS_TIPOS_CLASSIFICADOS).sort(),
    );
  });
});

describe("V3: contexto seguro das capturas do Sentry", () => {
  it("monta somente enum, boolean e numero", () => {
    const ctx = contextoSeguroDoAnalisador({
      etapa: "persistencia",
      desfecho: "persistencia_falhou",
      tentativas: 2,
      notaIncompleta: true,
      violacoes: 3,
    });

    expect(ctx).toEqual({
      etapa: "persistencia",
      desfecho: "persistencia_falhou",
      tentativas: 2,
      notaIncompleta: true,
      violacoes: 3,
    });
    // A assinatura nao aceita string livre: nao ha por onde texto entrar.
    for (const valor of Object.values(ctx)) {
      expect(["string", "number", "boolean"]).toContain(typeof valor);
    }
  });

  it("desfecho ausente vira estado NOMEADO, nao string vazia", () => {
    const ctx = contextoSeguroDoAnalisador({ etapa: "persistencia" });

    expect(ctx.desfecho).toBe(DESFECHO_INDISPONIVEL);
    expect(ctx.desfecho).not.toBe("");
    expect(ctx.tentativas).toBe(0);
    expect(ctx.notaIncompleta).toBe(false);
  });

  it("contagem invalida nao vira numero plausivel", () => {
    const ctx = contextoSeguroDoAnalisador({
      etapa: "contabilizacao_de_tentativa",
      tentativas: -1,
      violacoes: 1.5,
    });

    expect(ctx.tentativas).toBe(0);
    expect(ctx.violacoes).toBe(0);
  });

  it("a captura da persistencia usa o contexto e nao leva texto", async () => {
    // Fluxo real ate a persistencia falhar: o que interessa e o que o Sentry
    // recebeu, com o perfil cheio de marcadores.
    sentrySpy.capturas.length = 0;
    const ctx = contextoSeguroDoAnalisador({
      etapa: "persistencia",
      desfecho: "persistencia_falhou",
    });
    const serializado = JSON.stringify(ctx);

    for (const marcador of MARCADORES) {
      expect(serializado).not.toContain(marcador);
    }
    expect(ctx.etapa).toBe("persistencia");
  });
});
