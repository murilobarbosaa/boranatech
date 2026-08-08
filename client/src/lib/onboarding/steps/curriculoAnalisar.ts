import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Avaliador de Currículo,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_22_CurriculoAnalisar.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  pink: "#F25CA2",
  red: "#E5252F",
  green: "#15803D",
} as const;

const curriculoAnalisarOnboarding: OnboardingDef = {
  screen: "curriculo-analisar",
  ariaTitle: "Onboarding do Bora na Tech: Avaliador de Currículo",
  steps: [
    {
      key: "oque",
      bg: BG.green,
      hero: "icon",
      icon: "search",
      heroSize: 88,
      eyebrow: "AVALIADOR DE CV",
      title: "Nota no currículo que você tem",
      lead: "Você manda o PDF ou cola o texto e recebe uma nota, o diagnóstico e sugestões prontas pra copiar, seção por seção.",
      punch: ["flag", "Diagnóstico honesto, não elogio."],
    },
    {
      key: "manda",
      bg: "#0E7490",
      hero: "icon",
      icon: "news",
      heroSize: 82,
      eyebrow: "O QUE VOCÊ MANDA",
      title: "PDF ou texto colado",
      lead: "Não precisa formatar nada antes. Se quiser, dá pra colar junto o anúncio da vaga que você está mirando.",
      points: [
        [
          "news",
          "O currículo",
          "Em PDF ou colado como texto, do jeito que estiver.",
          null,
        ],
        [
          "target",
          "A vaga, se quiser",
          "Aí a análise mede a aderência do seu CV àquela vaga.",
          null,
        ],
      ],
    },
    {
      key: "volta",
      bg: BG.pink,
      hero: "icon",
      icon: "chart",
      heroSize: 82,
      eyebrow: "O QUE VOLTA",
      title: "Nota, problemas e reescrita",
      lead: "O retorno não para na nota. Ele aponta onde está fraco e já entrega o texto substituto pra você colar.",
      points: [
        [
          "chart",
          "A nota e os critérios",
          "Os critérios ficam abertos, você vê como chegou nela.",
          null,
        ],
        [
          "flag",
          "Fortes e fracos",
          "O que está bom e o que derruba o seu currículo.",
          null,
        ],
        [
          "check",
          "Sugestão pronta",
          "Reescrita seção por seção, pra copiar e colar.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: BG.red,
      hero: "logo",
      eyebrow: "GRÁTIS × PRO",
      title: "Tem dica grátis na página",
      lead: "A análise completa é Pro, a partir de R$ 18,50 por mês. As dicas básicas ficam abertas pra todo mundo.",
      proCta: ["Assinar o Pro", "https://www.boranatech.com.br/planos"],
      cta: "Analisar currículo",
      finale: true,
    },
  ],
};

export default curriculoAnalisarOnboarding;
