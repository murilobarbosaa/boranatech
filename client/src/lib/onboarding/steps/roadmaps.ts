import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Roadmaps,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_09_Roadmaps.html.
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

const roadmapsOnboarding: OnboardingDef = {
  screen: "roadmaps",
  ariaTitle: "Onboarding do Bora na Tech: Roadmaps",
  steps: [
    {
      key: "oque",
      bg: BG.purple,
      hero: "icon",
      icon: "map",
      heroSize: 88,
      eyebrow: "ROADMAPS GRÁTIS",
      title: "O caminho pronto, de graça",
      lead: "São 29 roadmaps com a ordem exata do que estudar: 22 por área da TI e 7 trilhas de carreira. Todos abertos, sem pagar nada.",
      chips: [
        ["Front-end"],
        ["Back-end"],
        ["Dados"],
        ["DevOps"],
        ["Mobile"],
        ["QA"],
        ["Cloud"],
        ["IA"],
        ["UX/UI"],
        ["Game Dev"],
      ],
      punch: ["check", "Grátis de verdade, sem pegadinha."],
    },
    {
      key: "dentro",
      bg: "#B45309",
      hero: "icon",
      icon: "layers",
      heroSize: 82,
      eyebrow: "COMO É POR DENTRO",
      title: "Etapas, passos e um projeto",
      lead: "Cada roadmap quebra o conteúdo em etapas, e cada etapa em passos pequenos. O de Front-end tem 11 etapas e 63 passos.",
      points: [
        [
          "layers",
          "Etapas",
          "Os grandes blocos, na ordem de quem já fez o caminho.",
          null,
        ],
        [
          "check",
          "Passos",
          "Cada etapa vira uma lista de coisas pequenas e concretas.",
          null,
        ],
        [
          "code",
          "Projeto prático",
          "No fim você constrói algo, não só assiste conteúdo.",
          null,
        ],
      ],
    },
    {
      key: "certificado",
      bg: BG.indigo,
      hero: "icon",
      icon: "trophy",
      heroSize: 82,
      eyebrow: "PROVA E CERTIFICADO",
      title: "Termine e leve o certificado",
      lead: "No fim de cada roadmap tem uma prova. Passou, sai um certificado com link público, também sem custo nenhum.",
      points: [
        [
          "trophy",
          "Faça a prova",
          "Ela mostra se você entendeu ou só passou os olhos.",
          null,
        ],
        [
          "check",
          "Ganhe o certificado",
          "Sai quando você passa, e é gratuito como o resto.",
          null,
        ],
        [
          "globe",
          "Link público",
          "Dá pra colar no LinkedIn e no seu currículo.",
          null,
        ],
      ],
      punch: ["case", "Cola direto no seu LinkedIn."],
    },
    {
      key: "fim",
      bg: BG.green,
      hero: "logo",
      eyebrow: "BORA ESTUDAR",
      title: "Escolha a sua trilha",
      lead: "Abra o roadmap da área que você escolheu, siga os passos e busque o certificado no fim.",
      cta: "Ver os roadmaps",
      finale: true,
    },
  ],
};

export default roadmapsOnboarding;
