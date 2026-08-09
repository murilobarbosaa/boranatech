import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Dicas,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_29_Dicas.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  blue: "#1D4ED8",
  pink: "#F25CA2",
  red: "#E5252F",
} as const;

const dicasOnboarding: OnboardingDef = {
  screen: "dicas",
  ariaTitle: "Onboarding do Bora na Tech: Dicas",
  steps: [
    {
      key: "oque",
      bg: BG.pink,
      hero: "icon",
      icon: "bulb",
      heroSize: 88,
      eyebrow: "DICAS",
      title: "106 conselhos curtos",
      lead: "Divididos em sete temas, de currículo a soft skills. Cada um resolve uma dúvida específica em poucas linhas.",
      chips: [
        ["Estágio"],
        ["Currículo"],
        ["Entrevistas"],
        ["Portfólio"],
        ["Estudo"],
        ["Soft skills"],
        ["Mercado"],
      ],
      punch: ["bulb", "Conselho de quem já está dentro."],
    },
    {
      key: "temas",
      bg: BG.red,
      hero: "icon",
      icon: "layers",
      heroSize: 82,
      eyebrow: "SETE TEMAS",
      title: "Cada um pra uma dor",
      lead: "Você não precisa ler tudo. Abre o tema do problema que está te travando agora e resolve.",
      points: [
        [
          "case",
          "Estágio e currículo",
          "Como montar portfólio e adaptar o CV pra cada vaga.",
          null,
        ],
        [
          "chat",
          "Entrevista e soft skills",
          "Explicar raciocínio e a estrutura situação, ação, resultado.",
          null,
        ],
        [
          "book",
          "Como estudar",
          "Por que constância bate maratona de fim de semana.",
          null,
        ],
      ],
    },
    {
      key: "estrutura",
      bg: "#0E7490",
      hero: "icon",
      icon: "check",
      heroSize: 82,
      eyebrow: "CADA TEMA TEM",
      title: "Resumo e links pra ir fundo",
      lead: "Primeiro três pontos-chave pra resolver na hora. Depois links selecionados pra quem quiser se aprofundar.",
      points: [
        [
          "check",
          "Três pontos-chave",
          "O essencial do tema, em formato de resumo.",
          null,
        ],
        [
          "globe",
          "Pra ir fundo",
          "Links curados na DIO, no dev.to, na Alura e outros.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: BG.blue,
      hero: "logo",
      eyebrow: "BORA APRENDER",
      title: "Abra o tema que te trava",
      lead: "Escolha o assunto que está travando você agora e resolva em poucos minutos.",
      cta: "Ver as dicas",
      finale: true,
    },
  ],
};

export default dicasOnboarding;
