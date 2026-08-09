import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Sobre nós,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_31_Sobre.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  pink: "#F25CA2",
  green: "#15803D",
} as const;

const sobreOnboarding: OnboardingDef = {
  screen: "sobre",
  ariaTitle: "Onboarding do Bora na Tech: Sobre nós",
  steps: [
    {
      key: "oque",
      bg: "#B45309",
      hero: "logo",
      eyebrow: "SOBRE NÓS",
      title: "A bússola que faltou pra gente",
      lead: "Menos de 5% das pessoas terminam um curso de tecnologia no Brasil. O problema quase nunca é capacidade, é falta de direção.",
      punch: ["heart", "A gente também já esteve perdido."],
    },
    {
      key: "quem",
      bg: BG.pink,
      hero: "icon",
      icon: "users",
      heroSize: 82,
      eyebrow: "QUEM FEZ",
      title: "Duas pessoas, não uma empresa",
      lead: "O Bora na Tech foi construído por dois estudantes do UniCEUB que passaram pelo mesmo problema que você.",
      points: [
        [
          "compass",
          "Ana Julia Moura",
          "CEO e cofundadora, criadora de conteúdo sobre tecnologia.",
          null,
        ],
        [
          "code",
          "Murilo Cardoso",
          "CTO e cofundador, engenheiro de IA e estudante de Computação.",
          null,
        ],
      ],
    },
    {
      key: "porque",
      bg: BG.green,
      hero: "icon",
      icon: "compass",
      heroSize: 82,
      eyebrow: "POR QUE EXISTE",
      title: "Direção, não motivação",
      lead: "Nunca faltou conteúdo na internet. Faltava alguém dizendo em que ordem consumir e o que dá pra ignorar.",
      points: [
        [
          "search",
          "Curadoria",
          "Alguém já filtrou o que não vale o seu tempo.",
          null,
        ],
        [
          "layers",
          "Ordem",
          "O caminho vem montado, você só precisa seguir.",
          null,
        ],
        [
          "users",
          "Companhia",
          "Comunidade e referências pra você não travar sozinho.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: "#0E7490",
      hero: "logo",
      eyebrow: "BORA JUNTO",
      title: "Feito por quem se perdeu antes",
      lead: "Se essa plataforma te ajudou de alguma forma, conta pra alguém que está começando agora.",
      cta: "Conhecer a história",
      finale: true,
    },
  ],
};

export default sobreOnboarding;
