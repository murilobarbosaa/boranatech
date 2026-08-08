import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Roadmap com IA,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_10_RoadmapIA.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  blue: "#1D4ED8",
  indigo: "#1E1B4B",
  purple: "#6D28D9",
} as const;

const roadmapIaOnboarding: OnboardingDef = {
  screen: "roadmaps-ia",
  ariaTitle: "Onboarding do Bora na Tech: Roadmap com IA",
  steps: [
    {
      key: "oque",
      bg: BG.blue,
      hero: "icon",
      icon: "cpu",
      heroSize: 88,
      eyebrow: "ROADMAP COM IA",
      title: "Um roadmap feito pra você",
      lead: "Os 29 roadmaps prontos servem pra maioria das pessoas. Quando o seu caso foge do padrão, a IA monta um do zero.",
      punch: ["spark", "Quando o caminho pronto não serve."],
    },
    {
      key: "quando",
      bg: BG.indigo,
      hero: "icon",
      icon: "target",
      heroSize: 82,
      eyebrow: "QUANDO USAR",
      title: "Pra quem não cabe no padrão",
      lead: "Se o seu ponto de partida ou o seu objetivo são diferentes do comum, o roadmap pronto aperta em algum lugar.",
      points: [
        [
          "case",
          "Vem de outra carreira",
          "Seu ponto de partida não é o de quem começa do zero.",
          null,
        ],
        [
          "layers",
          "Quer misturar áreas",
          "Dados com produto, front com design, o que fizer sentido.",
          null,
        ],
        [
          "target",
          "Tem objetivo específico",
          "Uma vaga, uma stack ou um prazo que o pronto não cobre.",
          null,
        ],
      ],
    },
    {
      key: "plano",
      bg: BG.purple,
      hero: "icon",
      icon: "lock",
      heroSize: 82,
      eyebrow: "GRÁTIS × PRO",
      title: "Os 29 prontos são de graça",
      lead: "O Roadmap com IA faz parte do plano Pro. Os roadmaps prontos continuam abertos pra todo mundo, sem pegadinha.",
      points: [
        [
          "check",
          "Grátis",
          "Os 29 roadmaps prontos, com etapas, passos e prova.",
          null,
        ],
        ["lock", "Pro", "O roadmap gerado por IA a partir do seu caso.", null],
      ],
      price: [
        "A partir de R$ 18,50/mês",
        "no plano anual, cancela quando quiser",
      ],
      proCta: ["Assinar o Pro", "https://www.boranatech.com.br/planos"],
    },
    {
      key: "fim",
      bg: "#B45309",
      hero: "logo",
      eyebrow: "BORA MONTAR",
      title: "Seu caminho, do seu jeito",
      lead: "Conte a sua situação e receba um roadmap montado a partir dela, salvo na sua conta pra abrir quando quiser.",
      cta: "Montar com IA",
      finale: true,
    },
  ],
};

export default roadmapIaOnboarding;
