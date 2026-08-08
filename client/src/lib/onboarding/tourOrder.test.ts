import { describe, expect, it } from "vitest";

import { ONBOARDING_REGISTRY } from "./registry";
import {
  EXPECTED_TOUR_LENGTH,
  TOUR_ORDER,
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

describe("estaNaOrdemDoTour", () => {
  it("distingue rota da sequencia de rota qualquer", () => {
    expect(estaNaOrdemDoTour("/cursos")).toBe(true);
    expect(estaNaOrdemDoTour("/perfil")).toBe(false);
  });
});
