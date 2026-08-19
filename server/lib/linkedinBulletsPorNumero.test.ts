import { afterEach, describe, expect, it, vi } from "vitest";

import type { LinkedinAnalyzeRequest } from "../../shared/linkedin/schema";
import { parseLinkedinText } from "../../shared/linkedin/parse";

/**
 * ATRIBUICAO ESTRUTURAL DE BULLETS (Fase 2, lote 1).
 *
 * O que este arquivo trava: bullet so e devolvido depois de conferido contra a
 * experiencia identificada pelo NUMERO que o prompt mostrou. O casamento por
 * sobreposicao de tokens do `contexto` foi removido, e com ele os tres modos de
 * falha medidos na investigacao:
 *
 *   1. `contexto` sem casamento devolvia o bloco INTACTO (era o unico caminho
 *      em que conteudo inteiramente fabricado chegava ao usuario);
 *   2. empate entre duas experiencias escolhia a primeira em silencio;
 *   3. dois cargos iguais em empresas diferentes so se distinguiam se o modelo
 *      tivesse escrito a empresa no `contexto`.
 *
 * Toda prova aqui e com payload forjado e `fetch` mockado: nenhuma chamada sai.
 */

vi.mock("./env", async (importActual) => {
  const real = await importActual<typeof import("./env")>();
  return {
    ...real,
    env: { ...real.env, openaiApiKey: "sk-de-teste-nao-usada" },
  };
});

import {
  analyzeLinkedin,
  buildUserPrompt,
  listaDeExperiencias,
  SYSTEM_PROMPT,
} from "./linkedinAnalyze";
import { runLinkedinChecks } from "./linkedinChecks";

/**
 * Dois cargos IDENTICOS em empresas diferentes, cada um com uma tecnologia e um
 * numeral que so existem nele. E o perfil que separa atribuicao certa de
 * atribuicao por sorte: sob o casamento por token os dois empatavam.
 */
const PERFIL_DOIS_CARGOS_IGUAIS = `Contato
teste@email.com
Fulana Teste
Desenvolvedora Front-end | React, TypeScript
Resumo
${"Sou desenvolvedora front-end construindo interfaces de produto para times distribuidos. ".repeat(4)}
Experience
Empresa Alfa
Desenvolvedora Front-end
janeiro de 2022 - Present
2 anos
Desenvolvi telas em React para 12 squads internos e acompanhei metricas de qualidade durante os ciclos de entrega do produto.
Empresa Beta
Desenvolvedora Front-end
janeiro de 2020 - dezembro de 2021
2 anos
Mantive um design system em TypeScript e documentei componentes, cobrindo 30% das telas legadas do portal principal.`;

/** Uma experiencia com descricao e uma sem nenhuma, para a melhoria injetada. */
const PERFIL_COM_EXPERIENCIA_VAZIA = `Contato
teste@email.com
Fulana Teste
Desenvolvedora Front-end | React, TypeScript
Resumo
${"Sou desenvolvedora front-end construindo interfaces de produto para times distribuidos. ".repeat(4)}
Experience
Empresa Alfa
Desenvolvedora Front-end
janeiro de 2022 - Present
2 anos
Desenvolvi telas em React para 12 squads internos e acompanhei metricas de qualidade durante os ciclos de entrega do produto.
Empresa Gama
Consultora Tecnica
janeiro de 2019 - dezembro de 2019
1 ano`;

function pedido(profileText: string): LinkedinAnalyzeRequest {
  return {
    profileText,
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "React, TypeScript, JavaScript, HTML, CSS",
    foto: "sim",
    banner: "sim",
    openToWork: "sim",
    conexoes: "100-500",
    atividade: "semanal",
  };
}

interface BlocoForjado {
  experienciaNumero: number;
  contexto: string;
  bullets: string[];
}

const QUALITATIVE_BASE = {
  resumo: "Resumo de teste.",
  pontosFortes: ["Ponto um.", "Ponto dois.", "Ponto tres."],
  pontosFracos: ["Fraco um.", "Fraco dois.", "Fraco tres."],
  melhorias: [
    { prioridade: "alta", titulo: "Melhoria um", comoFazer: "Faca isso." },
    { prioridade: "alta", titulo: "Melhoria dois", comoFazer: "Faca aquilo." },
    { prioridade: "media", titulo: "Melhoria tres", comoFazer: "Faca mais." },
    { prioridade: "baixa", titulo: "Melhoria quatro", comoFazer: "E isso." },
  ],
  proximoPasso: "Proximo passo de teste.",
  headlines: [
    "Front-end | React | foco em produto",
    "Front-end | TypeScript | foco em produto",
    "Front-end | React | design system",
  ],
  sobreReescrito: "Sobre de teste.",
  skillsParaEstudar: [],
  modeloMensagemRecrutador: "Mensagem de teste.",
};

function respostaDaIa(blocos: BlocoForjado[]) {
  const qualitative = { ...QUALITATIVE_BASE, bulletsReescritos: blocos };
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

/** Roda a analise inteira com a resposta forjada, e colhe o que foi logado. */
async function analisar(profileText: string, blocos: BlocoForjado[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => respostaDaIa(blocos)),
  );
  const avisos: string[] = [];
  vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
    avisos.push(args.map(String).join(" "));
  });
  const { response } = await analyzeLinkedin(pedido(profileText));
  return {
    blocos: response.qualitative.bulletsReescritos,
    melhorias: response.qualitative.melhorias,
    violacoes: avisos.filter((l) => l.includes("ai_lastro_violado")),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("a lista numerada e a fonte unica da atribuicao", () => {
  it("numera de 1 a N e marca o estado de cada descricao", () => {
    const lista = listaDeExperiencias(
      parseLinkedinText(PERFIL_DOIS_CARGOS_IGUAIS),
    );
    expect(lista.map((i) => i.numero)).toEqual([1, 2]);
    expect(lista.map((i) => i.estado)).toEqual(["suficiente", "suficiente"]);
    expect(lista[0].experiencia.empresa).toBe("Empresa Alfa");
    expect(lista[1].experiencia.empresa).toBe("Empresa Beta");
    // Os dois cargos sao a mesma string: e exatamente por isso que o texto nao
    // pode ser o que atribui.
    expect(lista[0].experiencia.titulo).toBe(lista[1].experiencia.titulo);
  });

  it("a numeracao do prompt, a instrucao e o intervalo validado saem da mesma lista", () => {
    const request = pedido(PERFIL_DOIS_CARGOS_IGUAIS);
    const parsed = parseLinkedinText(request.profileText);
    const deterministic = runLinkedinChecks({
      parsed,
      profileText: request.profileText,
      area: request.area,
      level: request.level,
      mercado: request.mercado,
      skills: request.skills,
      foto: request.foto,
      banner: request.banner,
      openToWork: request.openToWork,
      conexoes: request.conexoes,
      atividade: request.atividade,
    });
    const prompt = buildUserPrompt(request, parsed, deterministic);
    const lista = listaDeExperiencias(parsed);

    // 1. A instrucao existe e nomeia o campo, nos dois prompts.
    expect(SYSTEM_PROMPT).toContain("experienciaNumero");
    expect(prompt).toContain("experienciaNumero");
    // 2. O intervalo anunciado ao modelo e o tamanho real da lista.
    expect(prompt).toContain(`numerada de 1 a ${lista.length}`);
    // 3. Os numeros RENDERIZADOS no bloco sao os da lista, na ordem.
    const renderizados = Array.from(prompt.matchAll(/^(\d+)\. /gm)).map((m) =>
      Number(m[1]),
    );
    expect(renderizados).toEqual(lista.map((i) => i.numero));
    // 4. E o intervalo que o lastro aceita e esse mesmo: se a numeracao mudar
    //    de base, este par de asseveracoes quebra junto com as de cima.
    expect(lista[0].numero).toBe(1);
    expect(lista[lista.length - 1].numero).toBe(lista.length);
  });
});

describe("bloco com numero valido", () => {
  it("mantem tecnologia e numeral da experiencia certa", async () => {
    const { blocos, violacoes } = await analisar(PERFIL_DOIS_CARGOS_IGUAIS, [
      {
        experienciaNumero: 1,
        contexto: "Desenvolvedora Front-end (Empresa Alfa)",
        bullets: ["Desenvolvi telas em React para 12 squads internos."],
      },
    ]);
    expect(blocos).toHaveLength(1);
    expect(blocos[0].bullets[0]).toContain("React");
    expect(blocos[0].bullets[0]).toContain("12");
    expect(violacoes).toEqual([]);
  });

  it("remove tecnologia e numeral que pertencem a OUTRA experiencia", async () => {
    const { blocos, violacoes } = await analisar(PERFIL_DOIS_CARGOS_IGUAIS, [
      {
        experienciaNumero: 1,
        contexto: "Desenvolvedora Front-end (Empresa Alfa)",
        bullets: ["Mantive o design system em TypeScript, cobrindo 30% dele."],
      },
    ]);
    expect(blocos).toHaveLength(1);
    // TypeScript e 30% existem no perfil, mas na experiencia 2.
    expect(blocos[0].bullets[0]).not.toContain("TypeScript");
    expect(blocos[0].bullets[0]).not.toContain("30%");
    expect(violacoes.join(" ")).toContain("tecnologia_sem_lastro");
    expect(violacoes.join(" ")).toContain("numeral_fabricado");
  });
});

describe("duas empresas com o mesmo cargo", () => {
  it("atribui pelo numero, mesmo com o contexto apontando para a errada", async () => {
    // Os `contexto` estao TROCADOS de proposito: se o texto ainda mandasse em
    // alguma coisa, o bloco 1 seria conferido contra a Beta e o 2 contra a
    // Alfa, e os dois bullets legitimos seriam apagados.
    const { blocos, violacoes } = await analisar(PERFIL_DOIS_CARGOS_IGUAIS, [
      {
        experienciaNumero: 1,
        contexto: "Desenvolvedora Front-end (Empresa Beta)",
        bullets: ["Desenvolvi telas em React para 12 squads internos."],
      },
      {
        experienciaNumero: 2,
        contexto: "Desenvolvedora Front-end (Empresa Alfa)",
        bullets: ["Mantive o design system em TypeScript, cobrindo 30% dele."],
      },
    ]);
    expect(blocos).toHaveLength(2);
    expect(blocos[0].bullets[0]).toContain("React");
    expect(blocos[0].bullets[0]).toContain("12");
    expect(blocos[1].bullets[0]).toContain("TypeScript");
    expect(blocos[1].bullets[0]).toContain("30%");
    expect(violacoes).toEqual([]);
  });

  it("o contexto vazio nao atrapalha: quem atribui e o numero", async () => {
    const { blocos, violacoes } = await analisar(PERFIL_DOIS_CARGOS_IGUAIS, [
      {
        experienciaNumero: 2,
        contexto: "",
        bullets: ["Mantive o design system em TypeScript, cobrindo 30% dele."],
      },
    ]);
    expect(blocos).toHaveLength(1);
    expect(blocos[0].bullets[0]).toContain("TypeScript");
    expect(violacoes).toEqual([]);
  });
});

describe("numero fora do intervalo: fail-closed", () => {
  it("descarta o bloco fabricado inteiro e registra a violacao", async () => {
    const { blocos, violacoes } = await analisar(PERFIL_DOIS_CARGOS_IGUAIS, [
      {
        // O perfil tem 2 experiencias. Este bloco e o caso que, sob o
        // casamento por token, voltava intacto para o usuario.
        experienciaNumero: 7,
        contexto: "Projeto pessoal de robotica",
        bullets: ["Reduzi custos em 99% usando Kubernetes."],
      },
    ]);
    expect(blocos).toEqual([]);
    expect(violacoes.join(" ")).toContain("bloco_experiencia_invalida");
    expect(violacoes.join(" ")).toContain("bloco_removido");
    // NADA do bloco sobrevive, nem sanitizado.
    expect(JSON.stringify(blocos)).not.toContain("99%");
    expect(JSON.stringify(blocos)).not.toContain("Kubernetes");
  });

  // Duas camadas, e a divisao entre elas e o que este par de casos trava.
  // O `min(1)` do schema pega o numero impossivel (zero, negativo, fracionario,
  // ausente) ANTES do lastro, e vira retry, como qualquer outra violacao de
  // schema. O lastro pega o que so o perfil daquela pessoa pode dizer: numero
  // positivo e inteiro que nao existe NAQUELA lista.
  it.each([0, -1, 1.5])(
    "numero impossivel (%s) e barrado pelo schema, antes do lastro, e vira retry",
    async (numero) => {
      const fetchMock = vi.fn(async () =>
        respostaDaIa([
          {
            experienciaNumero: numero,
            contexto: "Desenvolvedora Front-end",
            bullets: ["Reduzi custos em 99% usando Kubernetes."],
          },
        ]),
      );
      vi.stubGlobal("fetch", fetchMock);
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      await expect(
        analyzeLinkedin(pedido(PERFIL_DOIS_CARGOS_IGUAIS)),
      ).rejects.toThrow("não bateu com o schema esperado");
      // Retry normal: as duas tentativas, e nenhuma resposta parcial devolvida.
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );

  it("bloco sem o campo e barrado pelo schema", async () => {
    const semCampo = [
      { contexto: "Desenvolvedora Front-end", bullets: ["Fiz alguma coisa."] },
    ] as unknown as BlocoForjado[];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => respostaDaIa(semCampo)),
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(
      analyzeLinkedin(pedido(PERFIL_DOIS_CARGOS_IGUAIS)),
    ).rejects.toThrow("não bateu com o schema esperado");
  });
});

describe("todos os blocos invalidos", () => {
  it("devolve lista vazia e mantem a melhoria de experiencia sem bullets", async () => {
    const lista = listaDeExperiencias(
      parseLinkedinText(PERFIL_COM_EXPERIENCIA_VAZIA),
    );
    // A fixture precisa mesmo ter uma experiencia sem descricao, senao o teste
    // estaria afirmando a melhoria injetada sobre uma condicao que nao existe.
    expect(lista).toHaveLength(2);
    expect(lista[1].estado).toBe("vazia");

    const { blocos, melhorias, violacoes } = await analisar(
      PERFIL_COM_EXPERIENCIA_VAZIA,
      [
        {
          experienciaNumero: 2,
          contexto: "Consultora Tecnica (Empresa Gama)",
          bullets: ["Conduzi projetos de consultoria com resultados fortes."],
        },
        {
          experienciaNumero: 9,
          contexto: "Experiencia que nao existe",
          bullets: ["Reduzi custos em 99% usando Kubernetes."],
        },
      ],
    );
    expect(blocos).toEqual([]);
    expect(violacoes.join(" ")).toContain("bullet_sem_origem");
    expect(violacoes.join(" ")).toContain("bloco_experiencia_invalida");
    // A lacuna vira conselho nomeado, no topo, como antes da mudanca.
    expect(melhorias[0].titulo).toContain("Consultora Tecnica");
    expect(melhorias.length).toBeLessThanOrEqual(7);
  });
});

describe("dois blocos para a mesma experiencia", () => {
  it("mantem os dois, cada um conferido contra a mesma origem", async () => {
    // Decisao registrada: numero repetido nao e risco de lastro, porque os dois
    // blocos validam contra o MESMO texto, e nenhum consumidor assume unicidade
    // (a interface renderiza a lista com chave por indice). Descartar o segundo
    // jogaria fora bullet legitimo por uma regra que ninguem precisa.
    const { blocos, violacoes } = await analisar(PERFIL_DOIS_CARGOS_IGUAIS, [
      {
        experienciaNumero: 1,
        contexto: "Desenvolvedora Front-end (Empresa Alfa)",
        bullets: ["Desenvolvi telas em React para 12 squads internos."],
      },
      {
        experienciaNumero: 1,
        contexto: "Desenvolvedora Front-end (Empresa Alfa)",
        bullets: ["Acompanhei metricas de qualidade com TypeScript."],
      },
    ]);
    expect(blocos).toHaveLength(2);
    expect(blocos[0].experienciaNumero).toBe(1);
    expect(blocos[1].experienciaNumero).toBe(1);
    // O segundo bloco continua sendo conferido: TypeScript nao esta na
    // experiencia 1, entao sai, e a violacao e registrada.
    expect(blocos[0].bullets[0]).toContain("React");
    expect(blocos[1].bullets[0]).not.toContain("TypeScript");
    expect(violacoes.join(" ")).toContain("tecnologia_sem_lastro");
  });
});

describe("o numero sobrevive ate a resposta da rota", () => {
  it("o bloco devolvido carrega o experienciaNumero que veio do modelo", async () => {
    const { blocos } = await analisar(PERFIL_DOIS_CARGOS_IGUAIS, [
      {
        experienciaNumero: 2,
        contexto: "Desenvolvedora Front-end (Empresa Beta)",
        bullets: ["Mantive o design system em TypeScript."],
      },
    ]);
    expect(blocos[0].experienciaNumero).toBe(2);
    expect(blocos[0].contexto).toBe("Desenvolvedora Front-end (Empresa Beta)");
  });
});
