import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Empresas,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_19_Empresas.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  blue: "#1D4ED8",
  indigo: "#1E1B4B",
  red: "#E5252F",
  purple: "#6D28D9",
} as const;

const empresasOnboarding: OnboardingDef = {
  screen: "empresas",
  ariaTitle: "Onboarding do Bora na Tech: Empresas",
  steps: [
    {
      key: "oque",
      bg: BG.red,
      hero: "icon",
      icon: "trophy",
      heroSize: 88,
      eyebrow: "EMPRESAS",
      title: "Quem contrata júnior de verdade",
      lead: "Cada empresa mostra o segmento, as tecnologias que usa, os níveis que contrata e a faixa salarial de quem está começando.",
      punch: ["search", "Pesquise a empresa antes da entrevista."],
    },
    {
      key: "card",
      bg: BG.purple,
      hero: "icon",
      icon: "news",
      heroSize: 82,
      eyebrow: "CADA EMPRESA MOSTRA",
      title: "O que a vaga não conta",
      lead: "O anúncio raramente diz a stack e quase nunca diz o salário. Aqui os dois ficam visíveis antes de você se candidatar.",
      points: [
        [
          "braces",
          "As tecnologias",
          "O que ela usa de fato, pra ver se bate com o que você estuda.",
          null,
        ],
        [
          "chart",
          "Faixa salarial júnior",
          "Quanto ela costuma pagar em quem está começando.",
          null,
        ],
        [
          "layers",
          "Níveis que contrata",
          "De estágio a sênior, pra ver se tem porta de entrada.",
          null,
        ],
      ],
    },
    {
      key: "pulo",
      bg: BG.blue,
      hero: "icon",
      icon: "bulb",
      heroSize: 82,
      eyebrow: "O PULO DO GATO",
      title: "Ranking de carreira inicial",
      lead: "Tem uma lista separada só com as empresas que mais abrem porta pra quem está no começo. Vale abrir antes de sair aplicando.",
      points: [
        [
          "trophy",
          "O ranking",
          "As empresas que mais contratam quem está entrando agora.",
          null,
        ],
        [
          "search",
          "Filtre a lista",
          "Segmento, cidade e nível cortam pro que dá pra tentar.",
          null,
        ],
      ],
      punch: ["flag", "Aplicar pra todas não é estratégia."],
    },
    {
      key: "fim",
      bg: BG.indigo,
      hero: "logo",
      eyebrow: "BORA PESQUISAR",
      title: "Conheça antes de aplicar",
      lead: "Abra a empresa que te interessou e veja se a stack e a faixa salarial fazem sentido pra você.",
      cta: "Ver as empresas",
      finale: true,
    },
  ],
};

export default empresasOnboarding;
