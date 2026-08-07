import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { ONBOARDING_REGISTRY } from "../registry";
import type { OnboardingDef } from "../types";

// Fidelidade dos steps portados contra o HTML de referencia.
//
// Os steps/*.ts nao foram digitados a mao: foram gerados a partir do proprio
// array STEPS de cada HTML. Este teste fecha o circuito no sentido contrario,
// AVALIANDO o STEPS do HTML em tempo de teste e comparando com o objeto
// portado, campo a campo. Serve para duas coisas:
//
//   1. provar a transcricao agora;
//   2. quebrar depois, se alguem "melhorar" um texto de um lado so. O HTML e a
//      fonte; divergir dele em silencio e o que este arquivo impede.
//
// A comparacao e EXATA, sem excecao nenhuma. O unico desvio aprovado do Lote A
// (o icone 'star' do 16_Ferramentas) esta na BIBLIOTECA de icones, nao no
// conteudo: os dois lados continuam dizendo 'star' no mesmo lugar.

const DESIGN = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "..",
  "design",
  "onboardings",
);

/** modulo portado -> arquivo HTML de origem. Lista fechada e afirmada abaixo. */
const ORIGEM: Record<
  string,
  { html: string; load: () => Promise<{ default: OnboardingDef }> }
> = {
  home: { html: "Onboarding_01_Home_1.html", load: () => import("./home") },
  areas: { html: "Onboarding_02_Areas.html", load: () => import("./areas") },
  quizCarreira: {
    html: "Onboarding_03_QuizCarreira.html",
    load: () => import("./quizCarreira"),
  },
  faculdades: {
    html: "Onboarding_04_Faculdades.html",
    load: () => import("./faculdades"),
  },
  tecnologias: {
    html: "Onboarding_05_Tecnologias.html",
    load: () => import("./tecnologias"),
  },
  tecnologiasMapa: {
    html: "Onboarding_06_MapaTecnologias.html",
    load: () => import("./tecnologiasMapa"),
  },
  tecnologiasRanking: {
    html: "Onboarding_07_RankingTecnologias.html",
    load: () => import("./tecnologiasRanking"),
  },
  dicionario: {
    html: "Onboarding_08_Dicionario.html",
    load: () => import("./dicionario"),
  },
  roadmaps: {
    html: "Onboarding_09_Roadmaps.html",
    load: () => import("./roadmaps"),
  },
  ingles: { html: "Onboarding_15_Ingles.html", load: () => import("./ingles") },
  ferramentas: {
    html: "Onboarding_16_Ferramentas.html",
    load: () => import("./ferramentas"),
  },
  guiaIa: { html: "Onboarding_17_GuiaIA.html", load: () => import("./guiaIa") },
  empresas: {
    html: "Onboarding_19_Empresas.html",
    load: () => import("./empresas"),
  },
  evolucao: {
    html: "Onboarding_25_Evolucao.html",
    load: () => import("./evolucao"),
  },
  salarios: {
    html: "Onboarding_26_Salarios.html",
    load: () => import("./salarios"),
  },
  noticias: {
    html: "Onboarding_27_Noticias.html",
    load: () => import("./noticias"),
  },
  eventos: {
    html: "Onboarding_28_Eventos.html",
    load: () => import("./eventos"),
  },
  dicas: { html: "Onboarding_29_Dicas.html", load: () => import("./dicas") },
  comunidades: {
    html: "Onboarding_30_Comunidades.html",
    load: () => import("./comunidades"),
  },
  sobre: { html: "Onboarding_31_Sobre.html", load: () => import("./sobre") },
  mentorias: {
    html: "Onboarding_32_Mentorias.html",
    load: () => import("./mentorias"),
  },
  mulheres: {
    html: "Onboarding_33_Mulheres.html",
    load: () => import("./mulheres"),
  },
};

/**
 * Le o STEPS do HTML AVALIANDO o literal, em vez de casar regex sobre ele.
 * Regex sobre literal de objeto e a classe de instrumento que casa de menos em
 * silencio; o avaliador ou devolve o mesmo objeto que o navegador monta, ou
 * lanca.
 */
function lerReferencia(html: string) {
  const src = readFileSync(path.join(DESIGN, html), "utf8");
  const js = src.slice(src.indexOf("<script>") + 8, src.indexOf("</script>"));
  const linhas = js.split("\n");

  const iC = linhas.findIndex((l) => l.startsWith("const C = {"));
  const iS = linhas.findIndex((l) => l.startsWith("const STEPS = ["));
  let jS = -1;
  for (let k = iS + 1; k < linhas.length; k += 1) {
    if (linhas[k] === "];") {
      jS = k;
      break;
    }
  }
  if (iC < 0 || iS < 0 || jS < 0)
    throw new Error(`${html}: STEPS nao delimitado`);

  const steps = new Function(
    `${linhas.slice(iC, jS + 1).join("\n")}\nreturn STEPS;`,
  )() as unknown[];

  const screen = js.match(/screen:\s*'([^']*)'/)?.[1];
  const ariaTitle = src.match(
    /<h1 class="sr" id="ttl-live">([^<]*)<\/h1>/,
  )?.[1];
  if (!screen) throw new Error(`${html}: screen do emit nao encontrado`);
  if (!ariaTitle) throw new Error(`${html}: h1 acessivel nao encontrado`);

  return { steps, screen, ariaTitle };
}

const modulos = Object.keys(ORIGEM);

describe("steps portados x HTML de referencia", () => {
  it("afirma o total de onboardings portados", () => {
    // Mesmo contrato de EXPECTED_TABLE_COUNT. Mudar este numero e ato
    // deliberado, no commit que porta o onboarding novo.
    expect(modulos).toHaveLength(22);
  });

  it("todo onboarding do registry tem entrada aqui, e vice-versa", () => {
    // Sentido 1: rota marcada como 'onboarding' sem conferencia de fidelidade
    // seria conteudo em producao que nenhum teste compara com a fonte.
    const noRegistry = Object.values(ONBOARDING_REGISTRY).filter(
      (entry) => entry.type === "onboarding",
    ).length;
    expect(noRegistry).toBe(modulos.length);
  });

  it("cada arquivo HTML e origem de um unico modulo", () => {
    const htmls = modulos.map((m) => ORIGEM[m].html);
    expect(new Set(htmls).size).toBe(htmls.length);
  });

  for (const modulo of modulos) {
    const { html, load } = ORIGEM[modulo];

    it(`${modulo}: conteudo identico a ${html}`, async () => {
      const referencia = lerReferencia(html);
      const portado = (await load()).default;

      expect(portado.screen).toBe(referencia.screen);
      expect(portado.ariaTitle).toBe(referencia.ariaTitle);
      expect(portado.steps).toHaveLength(referencia.steps.length);
      // Comparacao profunda do array inteiro: pega texto trocado, tupla com
      // item a mais, campo faltando e campo sobrando de uma vez so.
      expect(portado.steps).toEqual(referencia.steps);
    });
  }
});
