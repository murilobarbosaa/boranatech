import { afterEach, describe, expect, it, vi } from "vitest";

import type { LinkedinAnalyzeRequest } from "../../shared/linkedin/schema";

/**
 * LASTRO DE PROSA (Fase 2, lote 5).
 *
 * A prova c2 da investigacao mediu campos de prosa passando sem verificacao
 * nenhuma. Os payloads deste arquivo sao os dela, literais.
 *
 * O que cada classe faz, e por que sao diferentes:
 *   - CLASSE 1 (resumo, pontosFortes, pontosFracos, melhorias, proximoPasso):
 *     detecta e REGISTRA, e o texto chega INTEGRO ao usuario. Editar prosa
 *     corrida quebraria a frase e poderia inverter o sentido;
 *   - CLASSE 2 (sobreReescrito, modeloMensagemRecrutador): e texto que o
 *     usuario COLA no perfil dele, entao invento vira mentira publicada. O
 *     campo inteiro da lugar a um texto conservador, nunca editado palavra a
 *     palavra.
 *
 * Zero rede: `fetchWithTimeout` dublado em todos os casos.
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

/** O perfil comprova React, TypeScript e "12 squads". Nada de Kubernetes. */
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
Desenvolvi telas em React e TypeScript para 12 squads internos e acompanhei metricas de qualidade.`;

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

const BASE = {
  resumo: "Resumo neutro de teste.",
  pontosFortes: ["Ponto um.", "Ponto dois.", "Ponto tres."],
  pontosFracos: ["Fraco um.", "Fraco dois.", "Fraco tres."],
  melhorias: [
    { prioridade: "alta", titulo: "Melhoria um", comoFazer: "Faca isso." },
    { prioridade: "alta", titulo: "Melhoria dois", comoFazer: "Faca aquilo." },
    { prioridade: "media", titulo: "Melhoria tres", comoFazer: "Faca mais." },
    { prioridade: "baixa", titulo: "Melhoria quatro", comoFazer: "E isso." },
  ],
  proximoPasso: "Proximo passo neutro.",
  headlines: [
    "Front-end | React | foco em produto",
    "Front-end | TypeScript | foco em produto",
    "Front-end | React | design system",
  ],
  sobreReescrito: "Atuo como desenvolvedora front-end com React e TypeScript.",
  bulletsReescritos: [],
  skillsParaEstudar: [],
  modeloMensagemRecrutador: "Ola, [nome]. Atuo com React e TypeScript.",
};

function resposta(qualitative: Record<string, unknown>): Response {
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

interface Evento {
  tipo: string;
  campo: string;
  termo: string;
}

/** So o que este arquivo le da resposta. */
interface QualitativeLido {
  resumo: string;
  pontosFortes: string[];
  pontosFracos: string[];
  proximoPasso: string;
  melhorias: Array<{ titulo: string; comoFazer: string }>;
  sobreReescrito: string;
  modeloMensagemRecrutador: string;
}

async function analisar(
  patch: Record<string, unknown>,
  extras: Partial<LinkedinAnalyzeRequest> = {},
) {
  vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(
    resposta({ ...BASE, ...patch }),
  );
  const eventos: Evento[] = [];
  vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
    const linha = args.map(String).join(" ");
    if (!linha.includes("ai_lastro_violado")) return;
    const lido = JSON.parse(linha) as Evento;
    eventos.push({ tipo: lido.tipo, campo: lido.campo, termo: lido.termo });
  });
  const { response } = await analyzeLinkedin(pedido(extras));
  return {
    qual: response.qualitative as unknown as QualitativeLido,
    eventos,
    deterministic: response.deterministic,
  };
}

const tipos = (eventos: Evento[], tipo: string) =>
  eventos.filter((e) => e.tipo === tipo);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("classe 1: detecta e sinaliza, JAMAIS edita", () => {
  it("a prova c2 inteira chega integra ao usuario, com as violacoes contadas", async () => {
    const resumo =
      "Seu perfil comprova Kubernetes e uma reducao de custos de 40%.";
    const pontosFortes = [
      "Dominio de Kubernetes",
      "Reduziu custos em 40%",
      "Lideranca de squad de 12 pessoas",
    ];
    const proximoPasso = "Destaque a reducao de custos de 40% na headline.";
    const melhorias = [
      {
        prioridade: "alta",
        titulo: "Cite a reducao de 40%",
        comoFazer: "Escreva no Sobre que voce reduziu custos em 40%.",
      },
      ...BASE.melhorias.slice(1),
    ];
    const { qual, eventos } = await analisar({
      resumo,
      pontosFortes,
      proximoPasso,
      melhorias,
    });

    // INTEGRIDADE: byte a byte, nada foi editado.
    expect(qual.resumo).toBe(resumo);
    expect(qual.pontosFortes).toEqual(pontosFortes);
    expect(qual.proximoPasso).toBe(proximoPasso);
    expect(qual.melhorias[0].comoFazer).toBe(melhorias[0].comoFazer);

    // TECNOLOGIA: so onde a deteccao esta ligada nesta rodada.
    const tech = tipos(eventos, "prosa_tecnologia_sem_lastro");
    expect(tech.map((e) => e.campo).sort()).toEqual(["pontosFortes", "resumo"]);
    expect(tech.every((e) => e.termo === "Kubernetes")).toBe(true);

    // NUMERAL: em todos os campos de prosa.
    const num = tipos(eventos, "prosa_numeral_sem_lastro");
    const campos = new Set(num.map((e) => e.campo));
    expect(campos.has("resumo")).toBe(true);
    expect(campos.has("pontosFortes")).toBe(true);
    expect(campos.has("proximoPasso")).toBe(true);
    expect(campos.has("melhorias")).toBe(true);
    expect(num.some((e) => e.termo === "40%")).toBe(true);
  });

  it("recomendar o que falta NAO e violacao de tecnologia", async () => {
    // O falso positivo que motivou o recorte: melhorias existem para
    // recomendar, e "estude Kubernetes" e o acerto, nao o erro.
    const { eventos, qual } = await analisar({
      melhorias: [
        {
          prioridade: "alta",
          titulo: "Estude Kubernetes",
          comoFazer: "Estude Kubernetes e considere Docker nos proximos meses.",
        },
        ...BASE.melhorias.slice(1),
      ],
      pontosFracos: [
        "Nao ha sinal de Kubernetes no perfil.",
        "Fraco dois.",
        "Fraco tres.",
      ],
    });
    expect(tipos(eventos, "prosa_tecnologia_sem_lastro")).toEqual([]);
    expect(qual.melhorias[0].titulo).toBe("Estude Kubernetes");
  });

  it("numeral estrutural em prosa nao vira violacao", async () => {
    const { eventos } = await analisar({
      resumo:
        "Em 2024 o perfil ganhou tracao. Migrou para React 18 e trabalhou 6 meses no time.",
    });
    expect(tipos(eventos, "prosa_numeral_sem_lastro")).toEqual([]);
  });

  it("numeral lastreado no perfil passa; o mesmo numeral sem lastro viola", async () => {
    const comLastro = await analisar({
      resumo: "O perfil mostra entregas para 12 squads internos.",
    });
    expect(tipos(comLastro.eventos, "prosa_numeral_sem_lastro")).toEqual([]);

    const semLastro = await analisar({
      resumo: "O perfil mostra entregas para 37 squads internos.",
    });
    const num = tipos(semLastro.eventos, "prosa_numeral_sem_lastro");
    expect(num).toHaveLength(1);
    expect(num[0].termo).toBe("37");
  });

  it("LIMITE CONHECIDO: negacao e lida como afirmacao", async () => {
    // `enquadramentoDeTermo` documenta este limite em
    // shared/linkedin/molduraAspiracional.ts:84-89 (negacao le como moldura, e
    // frase sem marcador le como afirmacao). Aqui o texto e verdadeiro e mesmo
    // assim conta violacao. O custo e um evento a mais no painel, NUNCA texto
    // perdido: classe 1 nao edita. E o lado certo para errar.
    const resumo = "Seu perfil nao menciona Kubernetes em lugar nenhum.";
    const { qual, eventos } = await analisar({ resumo });
    expect(qual.resumo).toBe(resumo);
    expect(tipos(eventos, "prosa_tecnologia_sem_lastro")).toHaveLength(1);
  });
});

describe("classe 2: campo inteiro rejeitado, nunca editado", () => {
  it("sobreReescrito com dominio de tech inexistente vai para o conservador", async () => {
    const sujo =
      "Atuo como desenvolvedora front-end e opero clusters em Kubernetes e Docker todos os dias.";
    const { qual, eventos } = await analisar({ sobreReescrito: sujo });

    expect(qual.sobreReescrito).not.toBe(sujo);
    expect(qual.sobreReescrito).not.toContain("Kubernetes");
    expect(qual.sobreReescrito).not.toContain("Docker");
    // O conservador so cita o que o perfil comprova.
    expect(qual.sobreReescrito).toContain("React");
    const violacoes = tipos(eventos, "colar_tecnologia_sem_lastro");
    expect(violacoes.map((e) => e.termo).sort()).toEqual([
      "Docker",
      "Kubernetes",
    ]);
    expect(violacoes[0].campo).toBe("sobreReescrito");
  });

  it("mensagem ao recrutador com invento vai para a conservadora", async () => {
    const sujo =
      "Ola, [nome]. Tenho 5 anos de experiencia com Kubernetes e Go em producao.";
    const { qual, eventos } = await analisar({
      modeloMensagemRecrutador: sujo,
    });

    expect(qual.modeloMensagemRecrutador).not.toBe(sujo);
    expect(qual.modeloMensagemRecrutador).not.toContain("Kubernetes");
    expect(qual.modeloMensagemRecrutador).toContain("[nome]");
    expect(
      tipos(eventos, "colar_tecnologia_sem_lastro").map((e) => e.campo),
    ).toContain("modeloMensagemRecrutador");
  });

  it("moldura aspiracional legitima passa INTEGRA, sem violacao", async () => {
    const aspiracional =
      "Atuo como desenvolvedora front-end com React e estou estudando Kubernetes para migrar para infraestrutura.";
    const { qual, eventos } = await analisar({
      sobreReescrito: aspiracional,
    });
    expect(qual.sobreReescrito).toBe(aspiracional);
    expect(tipos(eventos, "colar_tecnologia_sem_lastro")).toEqual([]);
    expect(tipos(eventos, "colar_numeral_sem_lastro")).toEqual([]);
  });

  it("numeral de resultado sem lastro tambem rejeita o campo inteiro", async () => {
    const { qual, eventos } = await analisar({
      sobreReescrito:
        "Atuo com React e TypeScript e reduzi custos de infraestrutura em 40%.",
    });
    expect(qual.sobreReescrito).not.toContain("40%");
    expect(tipos(eventos, "colar_numeral_sem_lastro")).toHaveLength(1);
  });

  it("texto para colar sem invento nenhum passa igual", async () => {
    const { qual, eventos } = await analisar({});
    expect(qual.sobreReescrito).toBe(BASE.sobreReescrito);
    expect(qual.modeloMensagemRecrutador).toBe(BASE.modeloMensagemRecrutador);
    expect(eventos).toEqual([]);
  });
});

describe("fallback conservador por mercado", () => {
  const sujo = "Opero clusters em Kubernetes todos os dias.";

  it("brasil sai em portugues", async () => {
    const { qual } = await analisar(
      { sobreReescrito: sujo },
      { mercado: "brasil" },
    );
    expect(qual.sobreReescrito).toContain("Atuo como");
    expect(qual.sobreReescrito).not.toContain("I work as");
  });

  it("exterior sai em ingles", async () => {
    const { qual } = await analisar(
      { sobreReescrito: sujo, modeloMensagemRecrutador: sujo },
      { mercado: "exterior" },
    );
    expect(qual.sobreReescrito).toContain("I work as");
    expect(qual.sobreReescrito).not.toContain("Atuo como");
    expect(qual.modeloMensagemRecrutador).toContain("Hello, [name]");
  });

  it("ambos traz os dois textos, na convencao ja adotada", async () => {
    const { qual } = await analisar(
      { sobreReescrito: sujo },
      { mercado: "ambos" },
    );
    expect(qual.sobreReescrito).toContain("Atuo como");
    expect(qual.sobreReescrito).toContain("I work as");
  });

  it("o conservador nao afirma tecnologia que o perfil nao comprova", async () => {
    const { qual, deterministic } = await analisar({ sobreReescrito: sujo });
    for (const termo of deterministic.keywordsFaltantes) {
      expect(qual.sobreReescrito).not.toContain(termo);
    }
  });
});

/**
 * O texto exato do fallback, nos tres mercados. Serve de registro do que o
 * usuario recebe quando a sugestao da IA e rejeitada, e quebra se alguem mudar
 * a copy sem perceber que ela e visivel.
 */
describe("o texto do fallback, por inteiro", () => {
  const sujo = "Opero clusters em Kubernetes todos os dias.";

  it("brasil", async () => {
    const { qual } = await analisar(
      { sobreReescrito: sujo, modeloMensagemRecrutador: sujo },
      { mercado: "brasil" },
    );
    expect(qual.sobreReescrito).toBe(
      "Atuo como Desenvolvedor Front-end Júnior na área de Front-end." +
        " Trabalho com TypeScript, React." +
        " Descrevo aqui os projetos em que trabalhei e os resultados que consigo comprovar." +
        " Se você recruta para essa área, pode me chamar aqui no LinkedIn.",
    );
    expect(qual.modeloMensagemRecrutador).toBe(
      "Olá, [nome]. Atuo como Desenvolvedor Front-end Júnior e gostaria de conhecer melhor as oportunidades dessa área na [empresa]. Obrigado pela conexão.",
    );
  });

  it("exterior", async () => {
    const { qual } = await analisar(
      { sobreReescrito: sujo, modeloMensagemRecrutador: sujo },
      { mercado: "exterior" },
    );
    expect(qual.sobreReescrito).toBe(
      "I work as a Frontend Developer in Front-end." +
        " I work with TypeScript, React." +
        " I describe here the projects I have worked on and the results I can support with evidence." +
        " If you recruit for this area, feel free to contact me here on LinkedIn.",
    );
    expect(qual.modeloMensagemRecrutador).toBe(
      "Hello, [name]. I work as a Frontend Developer and would like to learn more about opportunities in this area at [company]. Thank you for connecting.",
    );
  });

  it("ambos: os dois textos, e a mensagem em portugues", async () => {
    const { qual } = await analisar(
      { sobreReescrito: sujo, modeloMensagemRecrutador: sujo },
      { mercado: "ambos" },
    );
    expect(qual.sobreReescrito.split("\n\n")).toHaveLength(2);
    expect(qual.sobreReescrito).toContain("Atuo como");
    expect(qual.sobreReescrito).toContain("I work as a");
    expect(qual.modeloMensagemRecrutador).toContain("Olá, [nome]");
  });
});
