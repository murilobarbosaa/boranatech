import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Vagas,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_18_Vagas.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  blue: "#1D4ED8",
  indigo: "#1E1B4B",
  purple: "#6D28D9",
} as const;

const vagasOnboarding: OnboardingDef = {
  screen: "vagas",
  ariaTitle: "Onboarding do Bora na Tech: Vagas",
  steps: [
    {
      key: "oque",
      bg: BG.blue,
      hero: "icon",
      icon: "case",
      heroSize: 88,
      eyebrow: "VAGAS",
      title: "Vagas de quem está começando",
      lead: "Um feed só de estágio, trainee e júnior, montado a partir de repositórios da comunidade, sites de empresa e agregadores internacionais.",
      chips: [
        ["Estágio"],
        ["Trainee"],
        ["Júnior"],
        ["Remoto"],
        ["Híbrido"],
        ["Presencial"],
        ["CLT"],
      ],
      punch: ["cal", "Atualiza sozinho ao longo do dia."],
    },
    {
      key: "card",
      bg: BG.indigo,
      hero: "icon",
      icon: "news",
      heroSize: 82,
      eyebrow: "CADA VAGA MOSTRA",
      title: "Tudo antes de você clicar",
      lead: "Dá pra descartar o que não serve sem abrir o anúncio, o que economiza muito tempo numa busca longa.",
      points: [
        [
          "case",
          "Empresa e cargo",
          "Quem está contratando e pra qual posição.",
          null,
        ],
        [
          "map",
          "Local e modalidade",
          "Cidade, e se é remoto, híbrido ou presencial.",
          null,
        ],
        [
          "news",
          "Fonte da vaga",
          "De onde ela veio, pra você conferir na origem.",
          null,
        ],
      ],
    },
    {
      key: "filtrar",
      bg: BG.purple,
      hero: "icon",
      icon: "search",
      heroSize: 82,
      eyebrow: "COMO FILTRAR",
      title: "Três filtros que resolvem",
      lead: "Nível, modalidade e tipo de contrato. Marque o que você aceita e o feed vira só o que dá pra tentar.",
      points: [
        [
          "sprout",
          "Nível",
          "Estágio, trainee ou júnior, sem vaga de sênior no meio.",
          null,
        ],
        [
          "globe",
          "Modalidade",
          "Remoto, híbrido ou presencial na sua cidade.",
          null,
        ],
        [
          "case",
          "Contrato",
          "CLT, PJ ou estágio, do jeito que você precisa.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: "#B45309",
      hero: "logo",
      eyebrow: "BORA APLICAR",
      title: "O feed completo é Pro",
      lead: "A lista de vagas faz parte do plano pago, a partir de R$ 18,50 por mês no anual.",
      proCta: ["Assinar o Pro", "https://www.boranatech.com.br/planos"],
      cta: "Ver as vagas",
      finale: true,
    },
  ],
};

export default vagasOnboarding;
