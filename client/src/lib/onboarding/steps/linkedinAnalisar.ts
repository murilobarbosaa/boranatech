import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Avaliador de LinkedIn,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_23_LinkedinAnalisar.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  pink: "#F25CA2",
  green: "#15803D",
} as const;

const linkedinAnalisarOnboarding: OnboardingDef = {
  screen: "linkedin-analisar",
  ariaTitle: "Onboarding do Bora na Tech: Avaliador de LinkedIn",
  steps: [
    {
      key: "oque",
      bg: "#B45309",
      hero: "icon",
      icon: "users",
      heroSize: 88,
      eyebrow: "AVALIADOR DE LINKEDIN",
      title: "Recrutador te acha ou não?",
      lead: "A ferramenta olha o seu perfil pelos olhos de quem busca candidato, e mostra por que você não está aparecendo.",
      punch: ["search", "Perfil bonito e invisível não serve."],
    },
    {
      key: "manda",
      bg: BG.pink,
      hero: "icon",
      icon: "news",
      heroSize: 82,
      eyebrow: "O QUE VOCÊ MANDA",
      title: "O PDF do seu perfil",
      lead: "O próprio LinkedIn deixa você salvar o seu perfil em PDF. É esse arquivo que a ferramenta lê.",
      points: [
        [
          "news",
          "Baixe o PDF",
          "No seu perfil tem a opção de salvar como PDF.",
          null,
        ],
        [
          "check",
          "Confira antes",
          "Ela mostra o que detectou e você edita antes de confirmar.",
          null,
        ],
      ],
    },
    {
      key: "volta",
      bg: BG.green,
      hero: "icon",
      icon: "az",
      heroSize: 82,
      eyebrow: "O QUE VOLTA",
      title: "Nota e texto pronto pra colar",
      lead: "Além da nota, ela devolve o texto já escrito pras partes que mais pesam na busca do recrutador.",
      points: [
        [
          "chart",
          "A nota do perfil",
          "O quanto ele está preparado pra ser encontrado.",
          null,
        ],
        [
          "az",
          "Headline e Sobre",
          "Texto pronto pras duas seções que mais aparecem.",
          null,
        ],
        [
          "chat",
          "Experiência e mensagem",
          "Inclusive o texto da mensagem de primeiro contato.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: "#0E7490",
      hero: "logo",
      eyebrow: "BORA AJUSTAR",
      title: "Essa é uma ferramenta Pro",
      lead: "A análise do LinkedIn faz parte do plano pago, a partir de R$ 18,50 por mês no anual.",
      proCta: ["Assinar o Pro", "https://www.boranatech.com.br/planos"],
      cta: "Analisar LinkedIn",
      finale: true,
    },
  ],
};

export default linkedinAnalisarOnboarding;
