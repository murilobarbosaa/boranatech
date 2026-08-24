import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Notícias,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_27_Noticias.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  blue: "#1D4ED8",
  red: "#E5252F",
  purple: "#6D28D9",
} as const;

const noticiasOnboarding: OnboardingDef = {
  screen: "noticias",
  ariaTitle: "Onboarding do Bora na Tech: Notícias",
  steps: [
    {
      key: "oque",
      bg: BG.red,
      hero: "icon",
      icon: "news",
      heroSize: 88,
      eyebrow: "NOTÍCIAS",
      title: "O que mudou na tech",
      lead: "Um resumo do que aconteceu no mercado de tecnologia, escrito em português e sem o hype que não te ajuda em nada.",
      punch: ["news", "Notícia curta, sem termo difícil."],
    },
    {
      key: "praque",
      bg: BG.purple,
      hero: "icon",
      icon: "target",
      heroSize: 82,
      eyebrow: "PRA QUE SERVE",
      title: "Assunto pra entrevista",
      lead: "Acompanhar o mercado é uma das coisas que separa candidato preparado de candidato genérico.",
      points: [
        [
          "chat",
          "Papo de entrevista",
          "Comentar uma notícia recente mostra que você acompanha.",
          null,
        ],
        [
          "compass",
          "Decisão de estudo",
          "O que está crescendo ajuda a escolher o que aprender.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: BG.blue,
      hero: "logo",
      eyebrow: "BORA LER",
      title: "Dá uma passada por semana",
      lead: "Cinco minutos por semana já bastam pra você não ficar por fora do que o mercado está discutindo.",
      cta: "Ver as notícias",
      finale: true,
    },
  ],
};

export default noticiasOnboarding;
