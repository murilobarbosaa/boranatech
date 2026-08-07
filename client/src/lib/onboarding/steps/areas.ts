import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Áreas de TI,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_02_Areas.html.
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

const areasOnboarding: OnboardingDef = {
  screen: "areas",
  ariaTitle: "Onboarding do Bora na Tech: Áreas de TI",
  steps: [
    {
      key: "oque",
      bg: "#534AB7",
      hero: "icon",
      icon: "layers",
      heroSize: 88,
      eyebrow: "ÁREAS DA TI",
      title: "Tudo sobre cada área da TI",
      lead: "Aqui não tem resumo de duas linhas. Cada área vem explicada por completo, do trabalho do dia a dia até a faixa salarial.",
      chips: [
        ["Front-end"],
        ["Back-end"],
        ["Dados"],
        ["DevOps"],
        ["Cloud"],
        ["Segurança"],
        ["Mobile"],
        ["QA"],
        ["UX"],
        ["Produto"],
      ],
      punch: ["compass", "TI não é uma profissão. São dezenas."],
    },
    {
      key: "dentro",
      bg: BG.blue,
      hero: "icon",
      icon: "search",
      heroSize: 82,
      eyebrow: "O QUE VEM EM CADA UMA",
      title: "A área inteira, sem faltar nada",
      lead: "Você sai sabendo se aquele trabalho combina com você e quanto ele paga, antes de gastar um mês estudando.",
      points: [
        [
          "case",
          "O que se faz",
          "A rotina real de quem trabalha nela, não a descrição de vaga.",
          null,
        ],
        [
          "users",
          "O perfil",
          "Que tipo de pessoa costuma se dar bem e se encaixar ali.",
          null,
        ],
        [
          "chart",
          "Quanto se ganha",
          "A faixa salarial praticada, de júnior aos níveis acima.",
          null,
        ],
        [
          "braces",
          "As tecnologias",
          "O que você vai usar de verdade no dia a dia da área.",
          null,
        ],
      ],
    },
    {
      key: "pulo",
      bg: BG.indigo,
      hero: "icon",
      icon: "bulb",
      heroSize: 82,
      eyebrow: "O PULO DO GATO",
      title: "Cada área abre em subáreas",
      lead: "Dados não é uma coisa só. Dentro dela tem Engenharia, Análise e Ciência, cada uma com rotina e salário diferentes.",
      points: [
        [
          "target",
          "Desça um nível",
          "A subárea mostra o recorte específico dentro da área grande.",
          null,
        ],
        [
          "compass",
          "Sem ideia nenhuma?",
          "O Quiz cruza o que você curte com as áreas e sugere um começo.",
          null,
        ],
      ],
      punch: ["heart", "Trocar de área depois é normal."],
    },
    {
      key: "fim",
      bg: BG.green,
      hero: "logo",
      eyebrow: "BORA EXPLORAR",
      title: "Abra a que mais te chamou",
      lead: "Escolha uma área e leia tudo sobre ela antes de investir meses de estudo no caminho errado.",
      cta: "Ver as áreas da TI",
      finale: true,
    },
  ],
};

export default areasOnboarding;
