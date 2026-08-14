import { describe, expect, it } from "vitest";

import { ONBOARDING_REGISTRY } from "./registry";
import {
  EXPECTED_TOUR_LENGTH,
  TOUR_LABELS,
  TOUR_LABELS_EXCECOES,
  TOUR_ORDER,
  ctaFinalDoTour,
  estaNaOrdemDoTour,
  proximaRotaDoTour,
} from "./tourOrder";

// A ordem do tour e uma lista literal e a sequencia so funciona se toda entrada
// dela tiver conteudo portado. Sem este teste, uma rota escrita errado (ou uma
// que perca o onboarding num refactor) viraria um buraco silencioso: o tour
// navegaria para la, nao acharia o que abrir e passaria adiante.

describe("ordem do tour guiado", () => {
  it("afirma o total", () => {
    expect(TOUR_ORDER).toHaveLength(EXPECTED_TOUR_LENGTH);
  });

  it("nao repete rota", () => {
    expect(new Set(TOUR_ORDER).size).toBe(TOUR_ORDER.length);
  });

  it("toda rota da ordem tem onboarding portado no registry", () => {
    const semOnboarding = TOUR_ORDER.filter(
      (rota) => ONBOARDING_REGISTRY[rota]?.type !== "onboarding",
    );
    expect(semOnboarding).toEqual([]);
  });

  it("cobre todo onboarding portado, sem sobra dos dois lados", () => {
    // Sentido inverso: onboarding portado que ficou de fora da sequencia seria
    // uma tela que o tour nunca mostra, e ninguem perceberia.
    //
    // `/projetos/:id` e a unica excecao legitima: compartilha a chave de
    // persistencia com `/projetos`, ja presente na ordem, e uma rota so na
    // pratica.
    const portados = Object.entries(ONBOARDING_REGISTRY)
      .filter(([, entry]) => entry.type === "onboarding")
      .map(([rota, entry]) =>
        entry.type === "onboarding" && entry.storageKey
          ? entry.storageKey
          : rota,
      );
    expect(new Set(portados)).toEqual(new Set(TOUR_ORDER));
  });

  it("comeca na home", () => {
    expect(TOUR_ORDER[0]).toBe("/");
  });
});

describe("proximaRotaDoTour", () => {
  const nadaVisto = () => false;

  it("do inicio, devolve a primeira", () => {
    expect(proximaRotaDoTour(null, nadaVisto)).toBe("/");
  });

  it("segue a ordem dos arquivos de design", () => {
    expect(proximaRotaDoTour("/", nadaVisto)).toBe("/areas");
    expect(proximaRotaDoTour("/areas", nadaVisto)).toBe("/quiz-carreira");
    expect(proximaRotaDoTour("/dicionario", nadaVisto)).toBe("/roadmaps");
  });

  it("pula o que ja foi visto", () => {
    const vistos = new Set(["/areas", "/quiz-carreira", "/faculdades"]);
    expect(proximaRotaDoTour("/", (r) => vistos.has(r))).toBe("/tecnologias");
  });

  it("devolve null no fim da sequencia", () => {
    expect(proximaRotaDoTour("/mulheres", nadaVisto)).toBeNull();
  });

  it("devolve null quando tudo ja foi visto", () => {
    expect(proximaRotaDoTour(null, () => true)).toBeNull();
  });

  it("devolve null a partir de rota fora da ordem", () => {
    // Retomar de um ponto que a sequencia nao conhece seria adivinhar.
    expect(proximaRotaDoTour("/perfil", nadaVisto)).toBeNull();
  });
});

describe("rotulos das paginas do tour", () => {
  // O rotulo NAO e texto novo: e o nome que o proprio onboarding da rota ja usa
  // no `ariaTitle`. Escrito a mao aqui e conferido contra a fonte, em vez de
  // derivado em tempo de execucao, porque derivar exigiria importar o modulo da
  // proxima rota so para pintar um botao.
  const PREFIXO = "Onboarding do Bora na Tech: ";

  it("todo item da ordem tem rotulo, e nada sobra", () => {
    expect(new Set(Object.keys(TOUR_LABELS))).toEqual(new Set(TOUR_ORDER));
  });

  it("o rotulo e o nome que o onboarding da rota declara, salvo excecao declarada", async () => {
    const divergentes: string[] = [];
    // Excecao que nao e mais necessaria e lixo que ninguem percebe: se o
    // conteudo passar a bater com o rotulo, o teste manda remover a entrada.
    const obsoletas: string[] = [];

    for (const rota of TOUR_ORDER) {
      const entry = ONBOARDING_REGISTRY[rota];
      if (entry?.type !== "onboarding") continue;
      const def = (await entry.load()).default;
      const nome = def.ariaTitle.startsWith(PREFIXO)
        ? def.ariaTitle.slice(PREFIXO.length)
        : def.ariaTitle;

      const excecao = TOUR_LABELS_EXCECOES[rota];
      if (excecao !== undefined) {
        // O valor do qual a excecao diverge ainda e este?
        if (excecao !== nome) {
          divergentes.push(
            `${rota}: excecao aponta para "${excecao}", mas o conteudo diz "${nome}"`,
          );
        }
        if (TOUR_LABELS[rota] === nome) obsoletas.push(rota);
        continue;
      }

      if (TOUR_LABELS[rota] !== nome) {
        divergentes.push(
          `${rota}: "${TOUR_LABELS[rota]}" != "${nome}" (declare em TOUR_LABELS_EXCECOES se for de proposito)`,
        );
      }
    }

    expect(divergentes).toEqual([]);
    expect(obsoletas).toEqual([]);
  });

  it("toda excecao declarada e de uma rota da ordem", () => {
    const fora = Object.keys(TOUR_LABELS_EXCECOES).filter(
      (rota) => !(TOUR_ORDER as readonly string[]).includes(rota),
    );
    expect(fora).toEqual([]);
  });
});

describe("ctaFinalDoTour", () => {
  const nadaVisto = () => false;

  it("anuncia a proxima pagina da sequencia", () => {
    expect(ctaFinalDoTour("/areas", nadaVisto)).toBe(
      "Próximo: Quiz de Carreira →",
    );
    expect(ctaFinalDoTour("/tecnologias", nadaVisto)).toBe(
      "Próximo: Mapa de Tecnologias →",
    );
  });

  it("pula o que ja foi visto, como a navegacao pula", () => {
    const vistos = new Set(["/quiz-carreira"]);
    expect(ctaFinalDoTour("/areas", (r) => vistos.has(r))).toBe(
      "Próximo: Faculdades →",
    );
  });

  it("no ultimo item, encerra em vez de anunciar", () => {
    expect(ctaFinalDoTour("/mulheres", nadaVisto)).toBe("Concluir tour");
    // Rota fora da ordem tambem encerra: e o que `avancarTour` faz com ela.
    expect(ctaFinalDoTour("/perfil", nadaVisto)).toBe("Concluir tour");
  });
});

describe("estaNaOrdemDoTour", () => {
  it("distingue rota da sequencia de rota qualquer", () => {
    expect(estaNaOrdemDoTour("/cursos")).toBe(true);
    expect(estaNaOrdemDoTour("/perfil")).toBe(false);
  });
});
