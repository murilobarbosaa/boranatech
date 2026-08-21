import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Evolução de Carreira,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_25_Evolucao.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  indigo: "#1E1B4B",
  green: "#15803D",
  purple: "#6D28D9",
} as const;

const evolucaoOnboarding: OnboardingDef = {
  screen: "evolucao",
  ariaTitle: "Onboarding do Bora na Tech: Evolução de Carreira",
  steps: [
    {
      key: "oque",
      bg: BG.purple,
      hero: "icon",
      icon: "trophy",
      heroSize: 88,
      eyebrow: "EVOLUÇÃO DE CARREIRA",
      title: "De estudante a tech lead",
      lead: "A régua completa da carreira em TI, degrau por degrau, com o tempo médio que cada salto costuma levar.",
      punch: ["chart", "Promoção não é sorte. É sinal."],
    },
    {
      key: "saltos",
      bg: "#B45309",
      hero: "icon",
      icon: "layers",
      heroSize: 82,
      eyebrow: "SEIS SALTOS",
      title: "Cada degrau tem um prazo",
      lead: "De estudante a estagiário leva de 3 a 12 meses. De júnior a pleno, de 1 a 3 anos. Serve pra calibrar a ansiedade.",
      points: [
        [
          "sprout",
          "Estudante a júnior",
          "Os três primeiros saltos, o trecho mais incerto de todos.",
          null,
        ],
        [
          "rocket",
          "Júnior a sênior",
          "Onde autonomia, code review e arquitetura entram.",
          null,
        ],
        [
          "trophy",
          "Sênior em diante",
          "Tech lead, especialista ou gestão, e o que muda em cada.",
          null,
        ],
      ],
    },
    {
      key: "dentro",
      bg: BG.indigo,
      hero: "icon",
      icon: "check",
      heroSize: 82,
      eyebrow: "O QUE TEM EM CADA",
      title: "Como saber que está na hora",
      lead: "Cada nível lista o que você precisa dominar, as soft skills exigidas e os sinais de que já dá pra pedir o próximo passo.",
      points: [
        [
          "code",
          "O técnico",
          "O que você precisa saber fazer naquele degrau.",
          null,
        ],
        [
          "users",
          "As soft skills",
          "A parte que costuma travar mais que o código.",
          null,
        ],
        [
          "flag",
          "Sinais de prontidão",
          "Como perceber que já está pronto pra subir.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: BG.green,
      hero: "logo",
      eyebrow: "BORA SUBIR",
      title: "Veja o seu próximo degrau",
      lead: "Tem também dicas por área, tabela de certificações e orientação pra quem quer trabalhar no exterior.",
      cta: "Ver a evolução",
      finale: true,
    },
  ],
};

export default evolucaoOnboarding;
