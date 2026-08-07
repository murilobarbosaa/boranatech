import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Tecnologias,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_05_Tecnologias.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  blue: "#1D4ED8",
  indigo: "#1E1B4B",
  red: "#E5252F",
} as const;

const tecnologiasOnboarding: OnboardingDef = {
  screen: "tecnologias",
  ariaTitle: "Onboarding do Bora na Tech: Tecnologias",
  steps: [
    {
      key: "oque",
      bg: "#534AB7",
      hero: "icon",
      icon: "braces",
      heroSize: 88,
      eyebrow: "CATÁLOGO DE TECH",
      title: "Tudo sobre toda tecnologia",
      lead: "Linguagens, frameworks, bancos, cloud e ferramentas. Cada uma explicada por completo, do que ela faz a quem usa no mercado.",
      chips: [
        ["Linguagens"],
        ["Frameworks"],
        ["Bancos"],
        ["Ferramentas"],
        ["Cloud"],
        ["DevOps"],
        ["Dados e IA"],
        ["Segurança"],
        ["Testes"],
        ["Design"],
        ["Gestão"],
      ],
      punch: ["search", "Ouviu um nome e não entendeu? Está aqui."],
    },
    {
      key: "card",
      bg: BG.indigo,
      hero: "icon",
      icon: "news",
      heroSize: 82,
      eyebrow: "O QUE VEM EM CADA UMA",
      title: "Da origem ao uso no mercado",
      lead: "Você entende o que ela é, o quanto custa aprender e se ainda vale a pena investir o seu tempo nela.",
      points: [
        [
          "chart",
          "Nível de dificuldade",
          "Iniciante, intermediário ou avançado, pra medir o esforço.",
          null,
        ],
        [
          "case",
          "Empresas que usam",
          "Nomes reais que rodam aquela tecnologia hoje em produção.",
          null,
        ],
        [
          "bulb",
          "De onde ela veio",
          "Quem criou, em que ano e por que ela existe.",
          null,
        ],
        [
          "layers",
          "A qual área pertence",
          "Em que caminho profissional ela é realmente usada.",
          null,
        ],
      ],
    },
    {
      key: "saidas",
      bg: BG.red,
      hero: "icon",
      icon: "layers",
      heroSize: 82,
      eyebrow: "TRÊS SAÍDAS",
      title: "Três formas de olhar a lista",
      lead: "Do catálogo você pula pra outra tela, dependendo da pergunta que está na sua cabeça.",
      points: [
        [
          "chart",
          "Comparar",
          "Duas tecnologias lado a lado quando você está em dúvida.",
          null,
        ],
        [
          "layers",
          "Por área",
          "Quais techs pertencem a cada caminho profissional.",
          null,
        ],
        [
          "trophy",
          "Ranking",
          "O que o mercado mais usa, com fonte e percentual.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: BG.blue,
      hero: "logo",
      eyebrow: "BORA EXPLORAR",
      title: "Abra a que te deixou curioso",
      lead: "Toda tecnologia tem uma página de detalhe com tudo o que você precisa saber sobre ela.",
      cta: "Ver as tecnologias",
      finale: true,
    },
  ],
};

export default tecnologiasOnboarding;
