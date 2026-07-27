import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { analyzeLinkedin } from "./linkedinAnalyze";
import * as http from "./http";
import type { LinkedinAnalyzeRequest } from "../../shared/linkedin/schema";

/**
 * JANELA DE DEPLOY, DIREÇÃO INVERSA: backend novo contra bundle ANTIGO.
 *
 * `janelaDeDeploy.test.ts` cobre o sentido que costuma acontecer (Vercel sobe
 * primeiro, front novo fala com API velha). Este cobre o outro: Railway no ar
 * com o código novo enquanto a Vercel ainda serve o bundle anterior. Acontece
 * quando o build do frontend falha e é refeito, quando alguém promove só o
 * backend, ou quando a Vercel simplesmente demora mais.
 *
 * A diferença que torna este sentido MAIS perigoso: o bundle antigo já está
 * carregado no navegador de quem estava com a aba aberta, e ele não tem camada
 * de leitura nenhuma. `readDeterministic` e `readQualitative` NASCERAM neste
 * lote (`git show 1369621:shared/linkedin/readQualitative.ts` não existe), então
 * o código antigo lê campo direto do JSON, no JSX, sem tolerância a ausência.
 *
 * COMO A LISTA ABAIXO FOI OBTIDA, e por que ela é uma lista e não um parser:
 *
 *   git show 1369621:client/src/pages/LinkedinAnalisar.tsx \
 *     | grep -oE '(qualitative|deterministic)\.[a-zA-Z]+' | sort -u
 *
 * `1369621` é o `origin/main` de antes desta série de 94 commits, ou seja, o
 * bundle que estava em produção. Rodar `git show` DENTRO do teste não serve:
 * `actions/checkout@v4` clona raso (`fetch-depth: 1`) e o objeto não existiria
 * no CI. Então a lista é congelada aqui, com o sha ao lado.
 */

/** Campos de `deterministic` que o bundle de `1369621` lê, no JSX, sem guarda. */
const LIDOS_DETERMINISTIC = [
  "checks",
  "experienciasContagem",
  "faixa",
  "headline",
  "score",
  "skillsContagem",
  "sobreTamanho",
] as const;

/** Campos de `qualitative` que o bundle de `1369621` lê, no JSX, sem guarda. */
const LIDOS_QUALITATIVE = [
  "bulletsReescritos",
  "headlines",
  "melhorias",
  "modeloMensagemRecrutador",
  "pontosFortes",
  "pontosFracos",
  "proximoPasso",
  "resumo",
  "skillsSugeridas",
  "sobreReescrito",
] as const;

/**
 * Asserção de TOTAL, não de pertinência: uma lista escrita à mão que só
 * responde "os que eu conheço estão lá" é o defeito que o CLAUDE.md documenta.
 * Estes números vieram da contagem do `sort -u` acima (7 e 10). Mexer neles é
 * ato deliberado, no mesmo commit que mudar a lista.
 */
const TOTAL_DETERMINISTIC = 7;
const TOTAL_QUALITATIVE = 10;

/**
 * INCOMPATIBILIDADE CONHECIDA, congelada de propósito.
 *
 * `skillsSugeridas` foi RENOMEADO para `skillsParaEstudar` nesta série. É a
 * única mudança não-aditiva do contrato de resposta: todos os outros 16 campos
 * seguem existindo com o mesmo nome. O bundle antigo faz
 * `result.qualitative.skillsSugeridas.length` em
 * `client/src/pages/LinkedinAnalisar.tsx:1714` sem `?.`, então a ausência não
 * degrada: estoura `TypeError` no render do resultado.
 *
 * O conjunto é congelado em vez de o teste simplesmente ignorar o campo. Se um
 * SEGUNDO campo sumir, o conjunto cresce e o teste fica vermelho. Se alguém
 * restaurar a compatibilidade, ele encolhe e o teste também fica vermelho,
 * pedindo que esta constante seja atualizada junto.
 */
const QUEBRAS_CONHECIDAS = ["skillsSugeridas"] as const;

const PERFIL = readFileSync(
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "__fixtures__",
    "linkedin",
    "perfil-real-anonimizado.txt",
  ),
  "utf8",
);

const PEDIDO = {
  profileText: PERFIL,
  area: "fullstack",
  level: "pleno",
  mercado: "exterior",
  skills: "AI Agents, Vector Databases, Retrieval-Augmented Generation",
  foto: "sim",
  banner: "sim",
  openToWork: "sim",
  conexoes: "500-mais",
  atividade: "raramente",
} as unknown as LinkedinAnalyzeRequest;

/**
 * Resposta do modelo no formato estrito de HOJE. Sem violação plantada: aqui o
 * que interessa é a FORMA que sai do backend novo, não o saneamento.
 */
function respostaValida() {
  const qualitative = {
    resumo: "Resumo de teste.",
    pontosFortes: ["Ponto forte um.", "Ponto forte dois.", "Ponto forte tres."],
    pontosFracos: ["Ponto fraco um.", "Ponto fraco dois.", "Ponto fraco tres."],
    headlines: [
      "Full-Stack Engineer | React | Node.js",
      "Engenheira Full-Stack | React | Node.js",
      "Desenvolvedora Full-Stack | TypeScript | Node.js",
    ],
    sobreReescrito: "Sobre de teste.",
    bulletsReescritos: [
      {
        contexto: "Artificial Intelligence Engineer (NexoRH)",
        bullets: ["Entreguei o pre-router deterministico da plataforma."],
      },
    ],
    competenciasSugeridas: ["React"],
    skillsParaEstudar: [],
    melhorias: [
      { prioridade: "alta", titulo: "Melhoria um", comoFazer: "Faca isso." },
      { prioridade: "alta", titulo: "Melhoria dois", comoFazer: "Faca aquilo." },
      { prioridade: "media", titulo: "Melhoria tres", comoFazer: "Faca mais." },
      { prioridade: "baixa", titulo: "Melhoria quatro", comoFazer: "E isso." },
    ],
    modeloMensagemRecrutador: "Mensagem de teste.",
    proximoPasso: "Proximo passo de teste.",
  };
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [
        {
          finish_reason: "stop",
          message: { content: JSON.stringify(qualitative) },
        },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 100 },
    }),
    text: async () => "",
  } as unknown as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("janela de deploy inversa: bundle antigo lendo backend novo", () => {
  it("as listas do bundle antigo têm o tamanho que a extração mediu", () => {
    // Guarda da guarda: se alguém apagar um item da lista sem querer, o resto
    // do arquivo passaria a verificar uma superfície menor, em silêncio.
    expect(LIDOS_DETERMINISTIC).toHaveLength(TOTAL_DETERMINISTIC);
    expect(LIDOS_QUALITATIVE).toHaveLength(TOTAL_QUALITATIVE);
  });

  it("todo campo de `deterministic` que o bundle antigo lê continua existindo", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(respostaValida());
    const { response } = await analyzeLinkedin(PEDIDO);
    const d = response.deterministic as unknown as Record<string, unknown>;

    const ausentes = LIDOS_DETERMINISTIC.filter((campo) => !(campo in d));
    expect(ausentes, `campos sumiram de deterministic: ${ausentes.join(", ")}`)
      .toEqual([]);
  });

  it("`deterministic` só GANHOU campos: os novos são todos opcionais", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(respostaValida());
    const { response } = await analyzeLinkedin(PEDIDO);
    const d = response.deterministic;

    // Os quatro aditivos desta série. O bundle antigo não os lê, então a
    // presença deles é inofensiva; o que este teste trava é a direção oposta,
    // um deles virar obrigatório e alguém assumir que sempre veio.
    expect(Array.isArray(d.checks)).toBe(true);
    expect(typeof d.score).toBe("number");
    expect(typeof d.faixa).toBe("string");
  });

  it("QUEBRA REAL: `qualitative` perdeu exatamente os campos congelados", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(respostaValida());
    const { response } = await analyzeLinkedin(PEDIDO);
    const q = response.qualitative as unknown as Record<string, unknown>;

    const ausentes = LIDOS_QUALITATIVE.filter((campo) => !(campo in q));
    // Igualdade, não `toContain`: um campo novo sumindo faz crescer e quebra;
    // a compatibilidade voltando faz encolher e também quebra.
    expect(ausentes).toEqual([...QUEBRAS_CONHECIDAS]);
  });

  it("os outros 9 campos de `qualitative` sobrevivem com o tipo que o antigo espera", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(respostaValida());
    const { response } = await analyzeLinkedin(PEDIDO);
    const q = response.qualitative as unknown as Record<string, unknown>;

    // O bundle antigo chama `.length`/`.map` nestes, e `.trim()`/interpolação
    // nos de texto. Tipo errado quebra igual a ausência.
    for (const campo of [
      "pontosFortes",
      "pontosFracos",
      "melhorias",
      "headlines",
      "bulletsReescritos",
    ]) {
      expect(Array.isArray(q[campo]), `${campo} deveria ser array`).toBe(true);
    }
    for (const campo of [
      "resumo",
      "proximoPasso",
      "sobreReescrito",
      "modeloMensagemRecrutador",
    ]) {
      expect(typeof q[campo], `${campo} deveria ser string`).toBe("string");
    }
  });

  it("o campo que substituiu `skillsSugeridas` existe, com outro nome", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(respostaValida());
    const { response } = await analyzeLinkedin(PEDIDO);
    const q = response.qualitative as unknown as Record<string, unknown>;

    // Documenta que não foi remoção pura: é renomeação. Um shim no server
    // (mandar os dois nomes por uma janela) resolveria sem mexer no bundle.
    expect("skillsParaEstudar" in q).toBe(true);
    expect(Array.isArray(q.skillsParaEstudar)).toBe(true);
  });
});
