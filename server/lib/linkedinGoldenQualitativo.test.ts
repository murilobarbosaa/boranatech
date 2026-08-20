import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * GOLDEN QUALITATIVO da Fase 2.
 *
 * Congela, cenário a cenário, o que o pipeline qualitativo REAL entrega: campos
 * finais, violações registradas, fallback aplicado ou não, desfecho de cada
 * tentativa e totais de uso. Sete lotes de política vivem aqui em forma
 * executável, e qualquer mudança futura de comportamento quebra um arquivo JSON
 * em vez de sair em silêncio para o usuário.
 *
 * Estes valores descrevem o comportamento de HOJE. Assim como no golden
 * determinístico da Fase 1, o objetivo NÃO é declarar que tudo está certo, e sim
 * detectar mudança. Comportamento congelado que merece revisão humana está
 * marcado com `nota` dentro do próprio JSON.
 *
 * O protocolo de atualização está no cabeçalho de
 * `__fixtures__/linkedin/qualitativo/harness.ts` e é para ser seguido: golden
 * atualizado sem diff revisado é o mesmo que golden ausente.
 */

vi.mock("./env", async (importActual) => {
  const real = await importActual<typeof import("./env")>();
  return {
    ...real,
    env: { ...real.env, openaiApiKey: "sk-de-teste-nao-usada" },
  };
});

import {
  GOLDENS,
  ordenarChaves,
  rodarCenario,
  type Cenario,
} from "./__fixtures__/linkedin/qualitativo/harness";
import { readQualitative } from "../../shared/linkedin/readQualitative";
import { TAG_DADOS } from "./linkedinBlocoDeDados";

const ESCREVER = process.env.GOLDEN_QUALITATIVO_WRITE === "1";

/** Resposta base VÁLIDA no schema, em português, com lastro no perfil f. */
const BASE = {
  resumo:
    "O perfil mostra experiencia real em front-end e uma base boa de acessibilidade no time.",
  pontosFortes: [
    "Descricoes de experiencia com metrica e contexto.",
    "Stack coerente com a area escolhida.",
    "Design system citado como responsabilidade.",
  ],
  pontosFracos: [
    "A headline nao repete o cargo-alvo em ingles.",
    "As competencias cadastradas sao poucas.",
    "Falta um convite ao contato no Sobre.",
  ],
  melhorias: [
    {
      prioridade: "alta",
      titulo: "Reescreva a headline",
      comoFazer: "Comece hoje colocando o cargo-alvo no primeiro campo.",
    },
    {
      prioridade: "alta",
      titulo: "Complete as competencias",
      comoFazer: "Cadastre as tecnologias que voce ja usa no trabalho.",
    },
    {
      prioridade: "media",
      titulo: "Feche o Sobre com um convite",
      comoFazer: "Termine o texto dizendo como querem falar com voce.",
    },
    {
      prioridade: "baixa",
      titulo: "Revise a ordem das experiencias",
      comoFazer: "Confira se a mais recente aparece no topo do perfil.",
    },
  ],
  proximoPasso: "Comece hoje pela headline e pelo convite ao contato no Sobre.",
  headlines: [
    "Desenvolvedora Front-end | React | foco em produto",
    "Desenvolvedora Front-end | TypeScript | design system",
    "Front-end | React | acessibilidade e produto",
  ],
  sobreReescrito:
    "Atuo como desenvolvedora front-end e cuido da acessibilidade das entregas do time.",
  bulletsReescritos: [
    {
      experienciaNumero: 1,
      contexto: "Desenvolvedora Front-end (Estudio Alfa)",
      bullets: ["Desenvolvi telas em React para 12 squads internos."],
    },
  ],
  skillsParaEstudar: [],
  modeloMensagemRecrutador:
    "Ola, [nome]. Atuo como desenvolvedora front-end e gostaria de conhecer as oportunidades da empresa.",
};

const SOBRE_EN =
  "I work as a front-end developer and I care about the accessibility of the team deliveries.";

const ABERTURA = `<${TAG_DADOS}`;

/** Cada entrada existe para congelar UMA política. Sem produto cartesiano. */
const CENARIOS: Cenario[] = [
  {
    nome: "limpo-junior-brasil",
    politica:
      "Resposta limpa atravessa inteira: nada removido, nenhuma violacao, uma tentativa so, uso contabilizado.",
    fixture: "perfil-f-front-junior.txt",
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "React, TypeScript",
    respostas: [{ conteudo: BASE, promptTokens: 3120, completionTokens: 640 }],
  },
  {
    nome: "prosa-tech-inventada",
    politica:
      "Lote 5, classe 1: tecnologia sem lastro em resumo e pontosFortes vira violacao e o texto vai INTEGRO ao usuario.",
    nota: "COMPORTAMENTO CONGELADO QUE MERECE REVISAO: o campo `acao` das violacoes de prosa sai como `termo_removido`, mas a classe 1 NAO remove nada, o texto vai inteiro. O rotulo vem de `TIPOS_DE_BLOCO`, que e anterior aos tipos de prosa e so distingue bloco de termo. Nao corrigido nesta sessao de proposito: o lote 7 nao muda comportamento de producao. Decisao pendente para a Fase 3.",
    fixture: "perfil-f-front-junior.txt",
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "React, TypeScript",
    respostas: [
      {
        conteudo: {
          ...BASE,
          resumo:
            "O perfil comprova dominio de Kubernetes na operacao do time de produto.",
          pontosFortes: [
            "Dominio de Kubernetes na operacao diaria.",
            "Stack coerente com a area escolhida.",
            "Design system citado como responsabilidade.",
          ],
        },
        promptTokens: 3120,
        completionTokens: 655,
      },
    ],
  },
  {
    nome: "prosa-numeral-inventado",
    politica:
      "Lote 5, classe 1: numeral de resultado sem lastro vira violacao em qualquer campo de prosa, e o texto segue integro.",
    fixture: "perfil-f-front-junior.txt",
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "React, TypeScript",
    respostas: [
      {
        conteudo: {
          ...BASE,
          resumo:
            "O perfil mostra uma reducao de custos de 40% no ultimo ciclo de entrega.",
          proximoPasso: "Destaque hoje a reducao de 40% na sua headline.",
        },
        promptTokens: 3120,
        completionTokens: 648,
      },
    ],
  },
  {
    nome: "colar-dominio-inventado",
    politica:
      "Lote 5, classe 2: afirmacao de dominio sem lastro troca o CAMPO INTEIRO pelo fallback deterministico em PT, nunca edita palavra a palavra.",
    fixture: "perfil-f-front-junior.txt",
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "React, TypeScript",
    respostas: [
      {
        conteudo: {
          ...BASE,
          sobreReescrito:
            "Atuo como desenvolvedora front-end e opero clusters em Kubernetes e Docker todos os dias.",
          modeloMensagemRecrutador:
            "Ola, [nome]. Tenho experiencia com Kubernetes e Go em producao e busco novos desafios.",
        },
        promptTokens: 3120,
        completionTokens: 662,
      },
    ],
  },
  {
    nome: "colar-moldura-aspiracional",
    politica:
      "Lote 5: enquadramento aspiracional sobre tecnologia faltante e legitimo, passa integro e NAO gera violacao.",
    fixture: "perfil-f-front-junior.txt",
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "React, TypeScript",
    respostas: [
      {
        conteudo: {
          ...BASE,
          sobreReescrito:
            "Atuo como desenvolvedora front-end com React e estou estudando Kubernetes para migrar para infraestrutura.",
        },
        promptTokens: 3120,
        completionTokens: 651,
      },
    ],
  },
  {
    nome: "idioma-recuperado-com-retry",
    politica:
      "Lote 6: gate de idioma reprova, a tentativa seguinte recebe o diagnostico contextual e o texto corrigido e entregue. As duas tentativas somam no uso.",
    fixture: "perfil-f-front-junior.txt",
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "React, TypeScript",
    respostas: [
      {
        conteudo: { ...BASE, sobreReescrito: SOBRE_EN },
        promptTokens: 3120,
        completionTokens: 640,
      },
      { conteudo: BASE, promptTokens: 3400, completionTokens: 648 },
    ],
  },
  {
    nome: "idioma-persistente-fallback",
    politica:
      "Lote 6: gasto o orcamento de duas chamadas, o texto para colar cai no fallback do lote 5 e a violacao idioma_incorreto e registrada. NUNCA uma terceira chamada.",
    fixture: "perfil-f-front-junior.txt",
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "React, TypeScript",
    respostas: [
      {
        conteudo: { ...BASE, sobreReescrito: SOBRE_EN },
        promptTokens: 3120,
        completionTokens: 640,
      },
      {
        conteudo: { ...BASE, sobreReescrito: SOBRE_EN },
        promptTokens: 3400,
        completionTokens: 644,
      },
    ],
  },
  {
    nome: "bullet-orfao-descartado",
    politica:
      "Lote 1: bloco com experienciaNumero fora do intervalo e descartado inteiro. A lista de bullets termina vazia, sem completamento.",
    nota: "COMPORTAMENTO CONGELADO QUE MERECE REVISAO: descartar TODOS os blocos nao injeta a melhoria de experiencia sem bullets. A injecao (passo 3 do lastro) depende de existir experiencia SEM DESCRICAO no perfil, e nao de a lista de bullets ter ficado vazia. Neste perfil as duas experiencias tem descricao, entao o usuario fica sem bullets e sem o conselho que explicaria a ausencia. Nao corrigido nesta sessao: o lote 7 nao muda producao. Decisao pendente para a Fase 3.",
    fixture: "perfil-f-front-junior.txt",
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "React, TypeScript",
    respostas: [
      {
        conteudo: {
          ...BASE,
          bulletsReescritos: [
            {
              experienciaNumero: 9,
              contexto: "Projeto pessoal de robotica",
              bullets: ["Reduzi custos em 99% usando Kubernetes."],
            },
          ],
        },
        promptTokens: 3120,
        completionTokens: 658,
      },
    ],
  },
  {
    nome: "vazamento-delimitador",
    politica:
      "Lote 6, G2: campo que ecoa a tag dos blocos de dados reprova, retenta uma vez e cai no fallback se insistir.",
    fixture: "perfil-f-front-junior.txt",
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "React, TypeScript",
    respostas: [
      {
        conteudo: {
          ...BASE,
          sobreReescrito: `${ABERTURA} campo="sobre"> Atuo como desenvolvedora front-end no time.`,
        },
        promptTokens: 3120,
        completionTokens: 640,
      },
      {
        conteudo: {
          ...BASE,
          sobreReescrito: `${ABERTURA} campo="sobre"> Atuo como desenvolvedora front-end no time.`,
        },
        promptTokens: 3400,
        completionTokens: 644,
      },
    ],
  },
  {
    nome: "skills-estudo-filtradas",
    politica:
      "Lote 4: skillsParaEstudar so aceita item da lista de faltantes, na grafia canonica; ja evidenciado e inventado saem com violacao.",
    fixture: "perfil-f-front-junior.txt",
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "React, TypeScript",
    respostas: [
      {
        conteudo: {
          ...BASE,
          skillsParaEstudar: [
            "React",
            "  node.js ",
            "COBOL inventado",
            "Vue.js",
          ],
        },
        promptTokens: 3120,
        completionTokens: 660,
      },
    ],
  },
  {
    nome: "perfil-vazio-sem-ia",
    politica:
      "Perfil quase vazio nao chama a IA: o fallback caloroso responde, sem tentativa e sem custo.",
    fixture: "perfil-g-vazio.txt",
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "",
    respostas: [{ conteudo: BASE, promptTokens: 0, completionTokens: 0 }],
  },
  {
    nome: "mercado-exterior-limpo",
    politica:
      "Lote 6: mercado exterior com resposta em ingles e com lastro no perfil passa nos dois gates, sem retry.",
    fixture: "perfil-d-ingles.txt",
    area: "backend",
    level: "pleno",
    mercado: "exterior",
    skills: "Go, Kubernetes, Python",
    respostas: [
      {
        conteudo: {
          resumo:
            "O perfil mostra experiencia real em sistemas distribuidos e boa base de plataforma.",
          pontosFortes: [
            "Experiencia com sistemas distribuidos bem descrita.",
            "Stack coerente com a area escolhida.",
            "Escala do negocio aparece no texto.",
          ],
          pontosFracos: [
            "A headline nao traz um diferencial claro.",
            "As competencias cadastradas sao poucas.",
            "Falta convite ao contato no Sobre.",
          ],
          melhorias: BASE.melhorias,
          proximoPasso:
            "Comece hoje pela headline e pelo convite ao contato no Sobre.",
          headlines: [
            "Backend Engineer | Go | Distributed Systems at scale",
            "Backend Engineer | Python | Platform reliability",
            "Backend Engineer | Go | Payments platforms",
          ],
          sobreReescrito:
            "I work as a backend engineer and I design and operate payment services written in Go and Python for the platform team.",
          bulletsReescritos: [],
          skillsParaEstudar: [],
          modeloMensagemRecrutador:
            "Hello, [name]. I work as a backend engineer with Go and I would like to know more about the opportunities at your company.",
          // Kubernetes NAO entra em nenhum campo para colar: ele aparece no
          // perfil, mas nao e tecnologia-chave da area backend, entao nao esta
          // em keywordsEncontradas e o lastro do lote 5 o removeria. A fixture
          // respeita a regra em vez de exercita-la: quem exercita a remocao e
          // o cenario costura-headline-limpa.
        },
        promptTokens: 3800,
        completionTokens: 700,
      },
    ],
  },
  {
    nome: "mercado-ambos-convencao",
    politica:
      "Lote 6: no mercado ambos o Sobre e misto por convencao do prompt e NAO e gateado; a mensagem ao recrutador continua exigida em portugues.",
    fixture: "perfil-f-front-junior.txt",
    area: "frontend",
    level: "junior",
    mercado: "ambos",
    skills: "React, TypeScript",
    respostas: [
      {
        conteudo: {
          ...BASE,
          sobreReescrito:
            "Atuo como desenvolvedora front-end e cuido da acessibilidade das entregas do time. I am open to remote roles and I work with React and TypeScript every day.",
        },
        promptTokens: 3120,
        completionTokens: 690,
      },
    ],
  },
  {
    nome: "costura-headline-limpa",
    politica:
      "Lote 4: removido o termo sem lastro, a headline e o bullet saem costurados, sem separador orfao nem conectivo solto.",
    fixture: "perfil-f-front-junior.txt",
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "React, TypeScript",
    respostas: [
      {
        conteudo: {
          ...BASE,
          headlines: [
            "Desenvolvedora Front-end | Kubernetes, React | foco em produto",
            "Desenvolvedora Front-end | Angular | design system",
            "Front-end | React | acessibilidade e produto",
          ],
          bulletsReescritos: [
            {
              experienciaNumero: 1,
              contexto: "Desenvolvedora Front-end (Estudio Alfa)",
              bullets: [
                "Desenvolvi telas em React com Kubernetes no pipeline de deploy.",
              ],
            },
          ],
        },
        promptTokens: 3120,
        completionTokens: 665,
      },
    ],
  },
  {
    nome: "retry-schema-com-diagnostico",
    politica:
      "Lote 6: falha de schema gera diagnostico nomeando os campos reprovados na chamada seguinte, e a contabilizacao soma as duas tentativas.",
    fixture: "perfil-f-front-junior.txt",
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "React, TypeScript",
    respostas: [
      {
        conteudo: { ...BASE, proximoPasso: 42, pontosFortes: ["so um"] },
        promptTokens: 3120,
        completionTokens: 300,
      },
      { conteudo: BASE, promptTokens: 3500, completionTokens: 648 },
    ],
  },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("golden qualitativo: o pipeline inteiro, congelado", () => {
  for (const cenario of CENARIOS) {
    it(cenario.nome, async () => {
      const obtido = await rodarCenario(cenario);
      const arquivo = path.join(GOLDENS, `${cenario.nome}.json`);
      if (ESCREVER) {
        writeFileSync(arquivo, `${JSON.stringify(obtido, null, 2)}\n`, "utf8");
      }
      expect(
        existsSync(arquivo),
        `golden ausente: ${cenario.nome}.json. Ver o protocolo no harness.`,
      ).toBe(true);
      const esperado = JSON.parse(readFileSync(arquivo, "utf8")) as unknown;
      expect(obtido).toEqual(esperado);
    });
  }

  it("o mesmo cenario rodado duas vezes da o MESMO retrato", async () => {
    // Prova de determinismo: se algum ponto do fluxo dependesse de relogio,
    // sorteio ou ordem instavel, seria aqui que apareceria.
    const cenario = CENARIOS.find((c) => c.nome === "colar-dominio-inventado");
    const primeira = await rodarCenario(cenario!);
    vi.restoreAllMocks();
    const segunda = await rodarCenario(cenario!);
    expect(JSON.stringify(primeira)).toBe(JSON.stringify(segunda));
  });
});

describe("roundtrip de leitura sobre o que os goldens congelam", () => {
  it("o qualitative de um golden novo atravessa readQualitative inteiro", () => {
    const golden = JSON.parse(
      readFileSync(path.join(GOLDENS, "limpo-junior-brasil.json"), "utf8"),
    ) as { qualitative: unknown };
    const view = readQualitative(golden.qualitative);
    expect(view.camposAusentes).toEqual([]);
    expect(view.bulletsReescritos[0].experienciaNumero).toBe(1);
    expect(view.headlines).toHaveLength(3);
  });

  it("payload em shape ANTIGO, sem experienciaNumero, continua legivel", () => {
    // Analise gravada antes do lote 1. O bloco nao tem o campo novo, e o leitor
    // nao pode derrubar a lista inteira por causa disso.
    const golden = JSON.parse(
      readFileSync(path.join(GOLDENS, "limpo-junior-brasil.json"), "utf8"),
    ) as { qualitative: Record<string, unknown> };
    const antigo = {
      ...golden.qualitative,
      bulletsReescritos: [
        { contexto: "Desenvolvedora Front-end (Estudio Alfa)", bullets: ["x"] },
      ],
    };
    const view = readQualitative(antigo);
    expect(view.bulletsReescritos).toHaveLength(1);
    expect(view.bulletsReescritos[0].experienciaNumero).toBeUndefined();
    expect(view.camposAusentes).not.toContain("bulletsReescritos");
  });

  it("ordenarChaves e estavel: mesma entrada, mesmo JSON", () => {
    const a = ordenarChaves({ b: 1, a: { d: 2, c: [3, { f: 4, e: 5 }] } });
    const b = ordenarChaves({ a: { c: [3, { e: 5, f: 4 }], d: 2 }, b: 1 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
