import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Mentorias e Ebooks,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_32_Mentorias.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  indigo: "#1E1B4B",
  green: "#15803D",
} as const;

const mentoriasOnboarding: OnboardingDef = {
  screen: "mentorias",
  ariaTitle: "Onboarding do Bora na Tech: Mentorias e Ebooks",
  steps: [
    {
      key: "oque",
      bg: BG.indigo,
      hero: "icon",
      icon: "cal",
      heroSize: 88,
      eyebrow: "EM BREVE",
      title: "Mentorias e ebooks a caminho",
      lead: "Essa página ainda não está no ar. A gente está fechando parcerias pra trazer as duas coisas do jeito certo.",
      punch: ["flag", "Ainda não dá pra usar. É honesto."],
    },
    {
      key: "vem",
      bg: BG.green,
      hero: "icon",
      icon: "layers",
      heroSize: 82,
      eyebrow: "O QUE VEM AÍ",
      title: "Conversa e material de estudo",
      lead: "São duas frentes diferentes: uma pra quem quer falar com gente, outra pra quem quer estudar no próprio tempo.",
      points: [
        [
          "chat",
          "Mentorias",
          "Conversas com quem já trabalha na área, sobre carreira e portfólio.",
          null,
        ],
        [
          "book",
          "Ebooks",
          "Materiais de parceiros, do começo até processo seletivo.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: "#B45309",
      hero: "logo",
      eyebrow: "ENQUANTO ISSO",
      title: "Você vê aqui primeiro",
      lead: "Quando estiver no ar, aparece nessa página. Até lá, as comunidades já resolvem parte da conversa.",
      cta: "Ver comunidades",
      finale: true,
    },
  ],
};

export default mentoriasOnboarding;
