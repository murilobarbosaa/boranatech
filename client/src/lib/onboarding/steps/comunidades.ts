import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Comunidades,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_30_Comunidades.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  pink: "#F25CA2",
  red: "#E5252F",
  green: "#15803D",
} as const;

const comunidadesOnboarding: OnboardingDef = {
  screen: "comunidades",
  ariaTitle: "Onboarding do Bora na Tech: Comunidades",
  steps: [
    {
      key: "oque",
      bg: BG.green,
      hero: "icon",
      icon: "users",
      heroSize: 88,
      eyebrow: "COMUNIDADES",
      title: "Onde tirar dúvida sem medo",
      lead: "São 24 comunidades de tecnologia no Discord, Slack, Telegram e outras, cada uma com o público que ela atende.",
      chips: [
        ["Discord"],
        ["Slack"],
        ["Telegram"],
        ["GitHub"],
        ["Instagram"],
        ["Meetup"],
      ],
      punch: ["users", "Estudar sozinho cansa mais rápido."],
    },
    {
      key: "card",
      bg: "#0E7490",
      hero: "icon",
      icon: "news",
      heroSize: 82,
      eyebrow: "CADA UMA MOSTRA",
      title: "Pra quem ela é feita",
      lead: 'A parte mais útil do card é o "para quem", que evita você entrar num grupo que não é do seu momento.',
      points: [
        [
          "target",
          "Para quem é",
          "Se é pra iniciante, pra uma área ou pra um grupo.",
          null,
        ],
        [
          "layers",
          "Área de atuação",
          "Programação, dados, design, carreira e por aí vai.",
          null,
        ],
        [
          "globe",
          "Onde ela vive",
          "Discord, Slack, Telegram, GitHub ou site próprio.",
          null,
        ],
      ],
    },
    {
      key: "filtrar",
      bg: BG.pink,
      hero: "icon",
      icon: "search",
      heroSize: 82,
      eyebrow: "COMO FILTRAR",
      title: "Online, presencial ou perto",
      lead: "Dá pra cortar por modalidade, pelo seu estado e pelo idioma, pra achar gente que combina com você.",
      points: [
        [
          "map",
          "Pelo seu estado",
          "Pra encontrar quem se encontra perto de você.",
          null,
        ],
        [
          "globe",
          "Pelo idioma",
          "Português ou inglês, se quiser treinar o idioma junto.",
          null,
        ],
      ],
      punch: ["heart", "Entre em uma. Só uma já ajuda."],
    },
    {
      key: "fim",
      bg: BG.red,
      hero: "logo",
      eyebrow: "BORA PARTICIPAR",
      title: "Entre em uma hoje",
      lead: "Escolha uma comunidade da sua área e entre. Ninguém precisa aprender tudo sozinho.",
      cta: "Ver as comunidades",
      finale: true,
    },
  ],
};

export default comunidadesOnboarding;
