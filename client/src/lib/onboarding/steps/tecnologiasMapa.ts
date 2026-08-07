import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Mapa de Tecnologias,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_06_MapaTecnologias.html.
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

const tecnologiasMapaOnboarding: OnboardingDef = {
  screen: "tecnologias-mapa",
  ariaTitle: "Onboarding do Bora na Tech: Mapa de Tecnologias",
  steps: [
    {
      key: "oque",
      bg: "#534AB7",
      hero: "icon",
      icon: "map",
      heroSize: 88,
      eyebrow: "MAPA POR ÁREA",
      title: "Que tecnologia cada área usa",
      lead: "Quem trabalha com back-end usa o quê? E quem é de dados? Aqui você vê a lista de tecnologias de cada uma das 25 áreas.",
      punch: ["compass", "Estude só o que a sua área usa."],
    },
    {
      key: "como",
      bg: BG.blue,
      hero: "icon",
      icon: "layers",
      heroSize: 82,
      eyebrow: "COMO FUNCIONA",
      title: "Escolha a área e veja a lista",
      lead: "É simples: você clica numa área e aparece tudo que se usa pra trabalhar nela.",
      points: [
        [
          "case",
          "O que se faz na área",
          "Uma linha explicando o trabalho, pra você não se perder.",
          null,
        ],
        [
          "braces",
          "As tecnologias dela",
          "A lista do que se usa naquele tipo de trabalho.",
          null,
        ],
        [
          "chart",
          "Quantas são",
          "O número aparece do lado, pra você saber o tamanho.",
          null,
        ],
      ],
    },
    {
      key: "calma",
      bg: BG.green,
      hero: "icon",
      icon: "bulb",
      heroSize: 82,
      eyebrow: "NÃO SE ASSUSTE",
      title: "Ninguém aprende tudo da lista",
      lead: "Front-end tem 77 tecnologias, mas ninguém sabe as 77. A lista mostra o que existe, não o que você precisa estudar.",
      stats: [
        ["77", "usadas em Front-end"],
        ["65", "usadas em Back-end"],
        ["36", "em Ciência de Dados"],
        ["30", "usadas em DevOps"],
      ],
      punch: ["bulb", "Comece por três. O resto vem depois."],
    },
    {
      key: "fim",
      bg: BG.indigo,
      hero: "logo",
      eyebrow: "BORA MAPEAR",
      title: "Veja a lista da sua área",
      lead: "Escolha a área que te interessa e descubra o que as pessoas usam de verdade pra trabalhar nela.",
      cta: "Ver o mapa",
      finale: true,
    },
  ],
};

export default tecnologiasMapaOnboarding;
