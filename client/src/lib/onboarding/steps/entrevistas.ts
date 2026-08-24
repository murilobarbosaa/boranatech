import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Entrevista,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_20_Entrevistas.html.
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

const entrevistasOnboarding: OnboardingDef = {
  screen: "entrevistas",
  ariaTitle: "Onboarding do Bora na Tech: Entrevista",
  steps: [
    {
      key: "oque",
      bg: "#0E7490",
      hero: "icon",
      icon: "chat",
      heroSize: 88,
      eyebrow: "TREINO DE ENTREVISTA",
      title: "Erre aqui, não na entrevista",
      lead: "Um treino com IA que faz perguntas calibradas pela vaga ou pela sua área, e comenta cada resposta sua na hora.",
      punch: ["spark", "Dá pra treinar em português ou inglês."],
    },
    {
      key: "sessao",
      bg: BG.blue,
      hero: "icon",
      icon: "target",
      heroSize: 82,
      eyebrow: "COMO É A SESSÃO",
      title: "Você escolhe o contexto",
      lead: "Antes de começar você decide se quer treinar pra uma vaga específica ou de forma geral, pela sua área e nível.",
      points: [
        [
          "case",
          "Pra uma vaga",
          "Cole o anúncio e as perguntas saem em cima dele.",
          null,
        ],
        [
          "layers",
          "Ou treino geral",
          "Escolha a área e o nível e ele monta as perguntas.",
          null,
        ],
        [
          "globe",
          "Em dois idiomas",
          "Dá pra treinar em português ou em inglês.",
          null,
        ],
      ],
    },
    {
      key: "retorno",
      bg: BG.red,
      hero: "icon",
      icon: "chart",
      heroSize: 82,
      eyebrow: "O RETORNO",
      title: "Nota por resposta e veredito",
      lead: "Cada resposta volta como boa, mediana ou fraca, com o que faltou. No fim sai o placar e o veredito de preparo.",
      points: [
        [
          "check",
          "Feedback na hora",
          "Boa, mediana ou fraca, com o motivo da nota.",
          null,
        ],
        [
          "chart",
          "Placar da sessão",
          "Tipo 4 boas de 6, pra medir onde você está.",
          null,
        ],
        [
          "flag",
          "Veredito de preparo",
          "O que treinar antes de encarar a entrevista real.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: BG.purple,
      hero: "logo",
      eyebrow: "BORA TREINAR",
      title: "Essa é uma ferramenta Pro",
      lead: "O treino de entrevista faz parte do plano pago, a partir de R$ 18,50 por mês no anual.",
      proCta: ["Assinar o Pro", "https://www.boranatech.com.br/planos"],
      cta: "Treinar entrevista",
      finale: true,
    },
  ],
};

export default entrevistasOnboarding;
