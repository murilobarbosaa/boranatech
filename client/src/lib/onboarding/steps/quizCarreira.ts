import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Quiz de Carreira,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_03_QuizCarreira.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  pink: "#F25CA2",
  red: "#E5252F",
} as const;

const quizCarreiraOnboarding: OnboardingDef = {
  screen: "quiz-carreira",
  ariaTitle: "Onboarding do Bora na Tech: Quiz de Carreira",
  steps: [
    {
      key: "oque",
      bg: "#534AB7",
      hero: "icon",
      icon: "compass",
      heroSize: 88,
      eyebrow: "QUIZ DE CARREIRA",
      title: "Um quiz grátis que acha sua área",
      lead: "Você responde o que curte e como pensa, e ele aponta a área da TI que mais combina com você.",
      punch: ["spark", "Não tem resposta certa nem errada."],
    },
    {
      key: "recebe",
      bg: BG.pink,
      hero: "icon",
      icon: "trophy",
      heroSize: 82,
      eyebrow: "O QUE VOCÊ RECEBE",
      title: "A sua área explicada por inteiro",
      lead: "No fim você não recebe só um nome. Recebe a área toda destrinchada, e também as outras que combinaram com você.",
      points: [
        [
          "target",
          "A área que mais combina",
          "Com tudo sobre ela: rotina, perfil, salário e tecnologias.",
          null,
        ],
        [
          "layers",
          "As outras que combinam",
          "Nem sempre é uma só. As próximas colocadas vêm junto.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: BG.red,
      hero: "logo",
      eyebrow: "BORA DESCOBRIR",
      title: "É grátis e leva poucos minutos",
      lead: "Responda com sinceridade. Quem tenta acertar o que o mercado quer costuma cair na área errada.",
      cta: "Fazer o quiz",
      finale: true,
    },
  ],
};

export default quizCarreiraOnboarding;
