import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Faculdades,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_04_Faculdades.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  blue: "#1D4ED8",
  indigo: "#1E1B4B",
  green: "#15803D",
} as const;

const faculdadesOnboarding: OnboardingDef = {
  screen: "faculdades",
  ariaTitle: "Onboarding do Bora na Tech: Faculdades",
  steps: [
    {
      key: "oque",
      bg: "#534AB7",
      hero: "icon",
      icon: "cap",
      heroSize: 88,
      eyebrow: "CURSOS DE TI",
      title: "Todo curso de TI num lugar só",
      lead: "São 39 cursos de instituições públicas e privadas. Aqui você entende o que cada um é e pra onde ele leva antes de escolher.",
      chips: [
        ["Bacharelado"],
        ["Tecnólogo"],
        ["Técnico"],
        ["Pública"],
        ["Privada"],
      ],
      punch: ["cap", "Os nomes parecem iguais. Não são."],
    },
    {
      key: "tipos",
      bg: BG.green,
      hero: "icon",
      icon: "layers",
      heroSize: 82,
      eyebrow: "OS TRÊS TIPOS",
      title: "A diferença que muda tudo",
      lead: "Antes de comparar nomes de curso, entenda o formato. É ele que define quanto tempo você leva e o que consegue fazer depois.",
      points: [
        [
          "rocket",
          "Técnico e Tecnólogo",
          "2 a 3 anos, bem prático, feito pra entrar rápido no mercado.",
          null,
        ],
        [
          "book",
          "Bacharelado",
          "4 a 5 anos, base teórica sólida e acesso à pós-graduação.",
          null,
        ],
        [
          "case",
          "Pública ou privada",
          "Filtro à parte, porque muda o custo e a forma de entrar.",
          null,
        ],
      ],
    },
    {
      key: "escolher",
      bg: BG.indigo,
      hero: "icon",
      icon: "bulb",
      heroSize: 82,
      eyebrow: "COMO ESCOLHER",
      title: "Comece pelo prazo, não pelo nome",
      lead: "A pergunta certa não é qual curso é melhor. É em quanto tempo você precisa estar trabalhando na área.",
      points: [
        [
          "flag",
          "Precisa entrar em 2 anos?",
          "Tecnólogo ou Técnico resolvem, e você estuda o resto depois.",
          null,
        ],
        [
          "trophy",
          "Quer pesquisa ou pós?",
          "O Bacharelado é o caminho que abre essa porta.",
          null,
        ],
        [
          "check",
          "Confira sempre o e-MEC",
          "A nota oficial do curso muda, vale checar antes de assinar.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: BG.blue,
      hero: "logo",
      eyebrow: "BORA COMPARAR",
      title: "Veja os cursos do seu estado",
      lead: "A lista começa vazia. Marque a sua UF e ela abre com os cursos de TI que existem na sua região.",
      cta: "Ver os cursos de TI",
      finale: true,
    },
  ],
};

export default faculdadesOnboarding;
