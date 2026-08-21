import type { OnboardingDef } from "../types";

// Conteudo do onboarding da HOME, transcrito 1:1 do array STEPS de
// design/onboardings/Onboarding_01_Home_1.html (bloco "4. CONTEUDO").
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo.
//
// Import dinamico a partir de registry.ts: este modulo fica FORA do bundle
// inicial.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  blue: "#1D4ED8",
  pink: "#F25CA2",
  indigo: "#1E1B4B",
  red: "#E5252F",
  green: "#15803D",
  purple: "#6D28D9",
} as const;

const homeOnboarding: OnboardingDef = {
  screen: "home",
  ariaTitle: "Onboarding do Bora na Tech: Home",
  steps: [
    /* 1. boas-vindas ------------------------------------------------ */
    {
      key: "welcome",
      bg: BG.blue,
      hero: "logo",
      eyebrow: "BEM-VINDO(A)",
      title: "Essa é a sua bússola pra tech",
      lead: "Menos de 5% das pessoas terminam um curso de tecnologia no Brasil. O problema quase nunca é capacidade, é falta de direção.",
      chips: [
        ["Sem enrolação", null],
        ["No seu ritmo", null],
        ["Do zero ao mercado", null],
      ],
      punch: ["flag", "A gente existe pra resolver isso."],
    },

    /* 2. perfil (interativo) ---------------------------------------- */
    {
      key: "profile",
      bg: BG.pink,
      hero: "icon",
      icon: "compass",
      heroSize: 82,
      eyebrow: "QUAL É VOCÊ?",
      title: "Onde você está agora?",
      lead: "A home é dividida em 3 trilhas. Escolhe a sua que eu já te mostro o caminho certo.",
      choices: [
        ["sprout", "Não sei nada", "quero descobrir por onde começar"],
        ["compass", "Sei, mas e agora?", "já estudei um pouco e travei"],
        ["rocket", "Já estou na área!", "quero evoluir e dar o próximo passo"],
      ],
    },

    /* 3. o que é o Bora na Tech ------------------------------------- */
    {
      key: "tudo",
      bg: BG.indigo,
      hero: "icon",
      icon: "globe",
      heroSize: 88,
      eyebrow: "ÚNICO NO MUNDO",
      title: "O único site com tudo de tech",
      lead: "Nenhum outro lugar reúne a área de tecnologia inteira em um só mapa.",
      chips: [
        ["Áreas"],
        ["Roadmaps"],
        ["Cursos"],
        ["Faculdades"],
        ["Projetos"],
        ["Tecnologias"],
        ["Dicionário"],
        ["Inglês"],
        ["Vagas"],
        ["Empresas"],
        ["Salários"],
        ["Eventos"],
        ["Notícias"],
        ["Comunidades"],
        ["IA"],
      ],
      punch: ["spark", "Tudo num lugar só."],
    },

    /* 4. as 4 trilhas da home (personalizado) ----------------------- */
    {
      key: "trilhas",
      bg: BG.green,
      hero: "icon",
      icon: "layers",
      heroSize: 82,
      eyebrow: "A HOME EM 4 BLOCOS",
      title: "A home te leva pelo seu momento",
      lead: "Role a página e você encontra quatro portas de entrada. Não precisa ver tudo, só a sua.",
      points: [
        [
          "sprout",
          "Não sei nada",
          "Descubra as áreas e o que cada uma faz.",
          0,
        ],
        [
          "compass",
          "Sei, mas e agora?",
          "Um caminho claro do estudo até o portfólio.",
          1,
        ],
        [
          "rocket",
          "Já estou na área!",
          "Método pra evoluir e dar o próximo passo.",
          2,
        ],
        [
          "users",
          "Comunidade",
          "Conteúdo, conexões e referências do mercado.",
          null,
        ],
      ],
    },

    /* 5. tour (interativo) ------------------------------------------ */
    {
      key: "tour",
      bg: BG.red,
      hero: "icon",
      icon: "map",
      heroSize: 82,
      eyebrow: "COMO PREFERE?",
      title: "Quer que eu te acompanhe?",
      lead: "Cada página tem uma explicação rápida na primeira vez que você chega nela.",
      choices: [
        ["map", "Me mostra cada aba", "um tour rápido comigo"],
        ["rocket", "Prefiro explorar sozinho(a)", "vou direto pra plataforma"],
      ],
    },

    /* 6. final ------------------------------------------------------ */
    {
      key: "fim",
      bg: BG.purple,
      hero: "logo",
      eyebrow: "BORA COMEÇAR",
      title: "Sua carreira em TI começa aqui",
      lead: "Monte o seu caminho na tech agora mesmo, no seu ritmo e sem se perder.",
      punch: ["heart", "Feito por quem também já esteve perdido."],
      cta: "Explorar a plataforma",
      finale: true,
    },
  ],
};

export default homeOnboarding;
