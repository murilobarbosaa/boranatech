import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Dicionário,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_08_Dicionario.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  blue: "#1D4ED8",
  pink: "#F25CA2",
  indigo: "#1E1B4B",
} as const;

const dicionarioOnboarding: OnboardingDef = {
  screen: "dicionario",
  ariaTitle: "Onboarding do Bora na Tech: Dicionário",
  steps: [
    {
      key: "oque",
      bg: "#534AB7",
      hero: "icon",
      icon: "az",
      heroSize: 88,
      eyebrow: "DICIONÁRIO TECH",
      title: "A palavra que te travou",
      lead: "São 297 termos da tecnologia explicados em uma linha e em português, sem usar outro termo difícil dentro da explicação.",
      punch: ["bulb", "Ninguém nasce sabendo o que é deploy."],
    },
    {
      key: "termo",
      bg: BG.blue,
      hero: "icon",
      icon: "book",
      heroSize: 82,
      eyebrow: "CADA TERMO TEM",
      title: "Definição curta e exemplo real",
      lead: "A definição te tira do sufoco na hora. O exemplo mostra como a palavra aparece numa conversa de trabalho.",
      points: [
        [
          "az",
          "O que significa",
          "Uma linha, em português claro, sem outro jargão dentro.",
          null,
        ],
        [
          "chat",
          "Como aparece",
          "Uma frase de uso real, do jeito que se fala no time.",
          null,
        ],
        [
          "target",
          "Nível e área",
          "Se é termo de iniciante e de que parte da TI ele vem.",
          null,
        ],
      ],
    },
    {
      key: "filtrar",
      bg: BG.indigo,
      hero: "icon",
      icon: "search",
      heroSize: 82,
      eyebrow: "COMO FILTRAR",
      title: "Por nível ou por área",
      lead: "Dá pra ver só o que é de iniciante, ou só os termos que aparecem na área que você está estudando.",
      stats: [
        ["34", "termos de iniciante"],
        ["181", "termos básicos"],
        ["82", "termos avançados"],
        ["9", "áreas da TI"],
      ],
    },
    {
      key: "fim",
      bg: BG.pink,
      hero: "logo",
      eyebrow: "BORA ENTENDER",
      title: "Procure e volte pro que fazia",
      lead: "Digite o termo que travou sua leitura, entenda em dez segundos e continue de onde parou.",
      cta: "Abrir o dicionário",
      finale: true,
    },
  ],
};

export default dicionarioOnboarding;
