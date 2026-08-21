import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Inglês,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_15_Ingles.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  pink: "#F25CA2",
  green: "#15803D",
} as const;

const inglesOnboarding: OnboardingDef = {
  screen: "ingles",
  ariaTitle: "Onboarding do Bora na Tech: Inglês",
  steps: [
    {
      key: "oque",
      bg: "#B45309",
      hero: "icon",
      icon: "globe",
      heroSize: 88,
      eyebrow: "INGLÊS PRA TECH",
      title: "Um guia pra parar de se perder",
      lead: "Documentação em inglês, erro em inglês, reunião em inglês. Aqui tem o guia básico do inglês que a tech usa de verdade.",
      punch: ["flag", "Inglês trava mais carreira que código."],
    },
    {
      key: "teste",
      bg: BG.pink,
      hero: "icon",
      icon: "target",
      heroSize: 82,
      eyebrow: "COMECE PELO TESTE",
      title: "Descubra seu nível de graça",
      lead: "Tem um teste grátis que te coloca em básico, intermediário ou avançado. Cada nível já vem com uma rotina diária pronta.",
      points: [
        [
          "sprout",
          "Básico",
          "Trocar o idioma do celular, apps e documentação simples.",
          null,
        ],
        [
          "book",
          "Intermediário",
          "Ler documentação oficial e escrever em inglês nos PRs.",
          null,
        ],
        [
          "rocket",
          "Avançado",
          "Comunidades internacionais e code review em inglês.",
          null,
        ],
      ],
    },
    {
      key: "secoes",
      bg: BG.green,
      hero: "icon",
      icon: "layers",
      heroSize: 82,
      eyebrow: "QUATRO SEÇÕES",
      title: "Cada uma pra um aperto",
      lead: "Depois do teste você escolhe por onde entrar, dependendo do que está te travando agora.",
      points: [
        [
          "cap",
          "Onde estudar",
          "Plataformas, canais e podcasts separados por nível.",
          null,
        ],
        [
          "case",
          "No trabalho",
          "O inglês mínimo da sua área e as expressões do dia a dia.",
          null,
        ],
        [
          "chat",
          "Entrevista",
          "Método STAR e as perguntas técnicas mais comuns.",
          null,
        ],
        [
          "az",
          "Vocabulário",
          "Termos essenciais e as pegadinhas de pronúncia.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: "#0E7490",
      hero: "logo",
      eyebrow: "BORA DESTRAVAR",
      title: "Não precisa ser fluente",
      lead: "Você precisa do inglês suficiente pra ler documentação e acompanhar uma reunião. Só isso já muda a sua carreira.",
      cta: "Abrir o guia",
      finale: true,
    },
  ],
};

export default inglesOnboarding;
