import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Avaliador de GitHub,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_24_PortfolioAnalisar.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  pink: "#F25CA2",
  indigo: "#1E1B4B",
  green: "#15803D",
} as const;

const portfolioAnalisarOnboarding: OnboardingDef = {
  screen: "portfolio-analisar",
  ariaTitle: "Onboarding do Bora na Tech: Avaliador de GitHub",
  steps: [
    {
      key: "oque",
      bg: BG.indigo,
      hero: "icon",
      icon: "code",
      heroSize: 88,
      eyebrow: "AVALIADOR DE GITHUB",
      title: "Seu GitHub aguenta uma vaga?",
      lead: "Você passa o link do perfil ou de um repositório público e recebe uma nota com o que precisa melhorar.",
      punch: ["code", "Recrutador entra no seu GitHub."],
    },
    {
      key: "manda",
      bg: BG.green,
      hero: "icon",
      icon: "search",
      heroSize: 82,
      eyebrow: "O QUE VOCÊ MANDA",
      title: "Só o link, mais nada",
      lead: "Perfil inteiro ou um repositório específico. Não precisa dar acesso nem instalar coisa nenhuma.",
      points: [
        [
          "users",
          "O perfil",
          "Ela olha o conjunto: repositórios, README e organização.",
          null,
        ],
        [
          "code",
          "Ou um repositório",
          "Se quiser focar no projeto que vai no seu currículo.",
          null,
        ],
      ],
    },
    {
      key: "volta",
      bg: "#B45309",
      hero: "icon",
      icon: "chart",
      heroSize: 82,
      eyebrow: "O QUE VOLTA",
      title: "Nota e checklist do que falta",
      lead: "A análise é calibrada pelo nível que você está mirando, de estágio até pleno.",
      points: [
        [
          "chart",
          "A nota",
          "O quanto o seu GitHub está pronto pra ser avaliado.",
          null,
        ],
        [
          "check",
          "Checklist de lacunas",
          "O que está faltando, item por item.",
          null,
        ],
        [
          "flag",
          "Ordem de prioridade",
          "O que arrumar primeiro, pra render mais rápido.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: BG.pink,
      hero: "logo",
      eyebrow: "GRÁTIS × PRO",
      title: "Tem guia grátis com README",
      lead: "A análise com IA é Pro. O guia com checklist salvo e modelos de README fica aberto pra todo mundo.",
      proCta: ["Assinar o Pro", "https://www.boranatech.com.br/planos"],
      cta: "Analisar GitHub",
      finale: true,
    },
  ],
};

export default portfolioAnalisarOnboarding;
