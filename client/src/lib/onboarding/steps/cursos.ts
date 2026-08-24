import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Cursos,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_12_Cursos.html.
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

const cursosOnboarding: OnboardingDef = {
  screen: "cursos",
  ariaTitle: "Onboarding do Bora na Tech: Cursos",
  steps: [
    {
      key: "oque",
      bg: "#0E7490",
      hero: "icon",
      icon: "cap",
      heroSize: 88,
      eyebrow: "CURSOS CURADOS",
      title: "Os cursos da internet, curados",
      lead: "Grátis e pagos, de todas as plataformas, pra qualquer área da TI. São 522 cursos, cada um com o motivo da indicação.",
      chips: [
        ["Curso em Vídeo"],
        ["DIO"],
        ["freeCodeCamp"],
        ["Rocketseat"],
        ["Figma"],
        ["AceleraDev"],
      ],
      punch: ["search", "Pra tudo que você precisar aprender."],
    },
    {
      key: "card",
      bg: BG.blue,
      hero: "icon",
      icon: "news",
      heroSize: 82,
      eyebrow: "CADA CURSO MOSTRA",
      title: "Por que esse e não outro",
      lead: "Não é uma lista de links jogada. Cada curso vem com a justificativa da escolha e o que você sai sabendo no fim.",
      points: [
        [
          "bulb",
          "Por que indicamos",
          "A razão da curadoria, em vez de só o nome do curso.",
          null,
        ],
        [
          "check",
          "O que você aprende",
          "Os tópicos que aquele curso cobre de verdade.",
          null,
        ],
        [
          "cal",
          "Duração e idioma",
          "Quantas horas leva e se é em português ou inglês.",
          null,
        ],
      ],
    },
    {
      key: "filtrar",
      bg: BG.red,
      hero: "icon",
      icon: "search",
      heroSize: 82,
      eyebrow: "GRÁTIS E PAGO",
      title: "Filtre pelo seu bolso",
      lead: "Área, nível, idioma e preço. Se o orçamento está curto, marque só os gratuitos e ainda sobra muita coisa boa.",
      points: [
        [
          "layers",
          "Área e nível",
          "Só o que é da sua área e do seu momento atual.",
          null,
        ],
        ["globe", "Idioma", "Dá pra ver só o que está em português.", null],
        [
          "case",
          "Preço",
          "Filtre os gratuitos e monte um estudo sem gastar nada.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: BG.purple,
      hero: "logo",
      eyebrow: "BORA ESTUDAR",
      title: "Comece pela amostra grátis",
      lead: "Sete cursos ficam abertos pra todo mundo. Mais 515 liberam no Pro, a partir de R$ 18,50 por mês.",
      proCta: ["Assinar o Pro", "https://www.boranatech.com.br/planos"],
      cta: "Ver os cursos",
      finale: true,
    },
  ],
};

export default cursosOnboarding;
