import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Plataformas,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_13_Plataformas.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  blue: "#1D4ED8",
  pink: "#F25CA2",
  red: "#E5252F",
} as const;

const plataformasOnboarding: OnboardingDef = {
  screen: "plataformas",
  ariaTitle: "Onboarding do Bora na Tech: Plataformas",
  steps: [
    {
      key: "oque",
      bg: BG.pink,
      hero: "icon",
      icon: "globe",
      heroSize: 88,
      eyebrow: "TODAS AS PLATAFORMAS",
      title: "Todo lugar pra estudar tech",
      lead: "São 179 plataformas reunidas: curso, jogo, desafio, playground, documentação e roadmap. Todas comparadas uma a uma.",
      chips: [
        ["Cursos"],
        ["Jogos"],
        ["Desafios"],
        ["Playground"],
        ["Documentação"],
        ["Roadmap"],
      ],
      punch: ["globe", "Se dá pra estudar lá, está aqui."],
    },
    {
      key: "tipos",
      bg: BG.red,
      hero: "icon",
      icon: "layers",
      heroSize: 82,
      eyebrow: "DE TODOS OS TIPOS",
      title: "Nem tudo é curso em vídeo",
      lead: "Tem gente que aprende jogando e tem gente que aprende quebrando a cabeça em desafio. Os dois formatos estão aqui.",
      points: [
        [
          "target",
          "Jogos e desafios",
          "Pra quem cansa de assistir aula e quer praticar.",
          null,
        ],
        [
          "term",
          "Playground e docs",
          "Pra testar código no navegador e ler direto da fonte.",
          null,
        ],
        [
          "cap",
          "Cursos e roadmaps",
          "O formato tradicional, pra quem prefere caminho guiado.",
          null,
        ],
      ],
    },
    {
      key: "card",
      bg: "#0E7490",
      hero: "icon",
      icon: "news",
      heroSize: 82,
      eyebrow: "CADA CARD MOSTRA",
      title: "Os pontos fracos também",
      lead: "A parte mais útil é a que ninguém escreve: onde a plataforma deixa a desejar e pra quem ela não serve.",
      points: [
        [
          "trophy",
          "Pontos fortes",
          "No que ela é boa de verdade e em quais áreas.",
          null,
        ],
        [
          "flag",
          "Limitações",
          "Onde ela peca, escrito sem rodeio nenhum.",
          null,
        ],
        [
          "case",
          "Preço e certificado",
          "Gratuita, paga ou híbrida, e se dá certificado.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: BG.blue,
      hero: "logo",
      eyebrow: "BORA ESCOLHER",
      title: "Comece pelas 7 abertas",
      lead: "Sete plataformas ficam abertas pra todo mundo. Mais 173 liberam no Pro, a partir de R$ 18,50 por mês.",
      proCta: ["Assinar o Pro", "https://www.boranatech.com.br/planos"],
      cta: "Ver as plataformas",
      finale: true,
    },
  ],
};

export default plataformasOnboarding;
