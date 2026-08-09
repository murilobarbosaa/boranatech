import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Guia de IA,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_17_GuiaIA.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  indigo: "#1E1B4B",
  green: "#15803D",
  purple: "#6D28D9",
} as const;

const guiaIaOnboarding: OnboardingDef = {
  screen: "guia-ia",
  ariaTitle: "Onboarding do Bora na Tech: Guia de IA",
  steps: [
    {
      key: "oque",
      bg: BG.purple,
      hero: "icon",
      icon: "cpu",
      heroSize: 88,
      eyebrow: "GUIA DE IA",
      title: "Todas as IAs, e quando usar",
      lead: "São 42 ferramentas de IA mapeadas, 38 delas com plano gratuito. Cada uma com a explicação de quando ela é a certa.",
      chips: [
        ["Conversa"],
        ["Pesquisa"],
        ["Código"],
        ["Criar app"],
        ["Imagem"],
        ["Vídeo"],
        ["Áudio"],
        ["Estudo"],
      ],
      punch: ["search", "O mundo da IA não é só ChatGPT."],
    },
    {
      key: "quando",
      bg: "#B45309",
      hero: "icon",
      icon: "layers",
      heroSize: 82,
      eyebrow: "QUANDO USAR CADA UMA",
      title: "Cada tarefa pede uma IA",
      lead: "A que responde bem uma dúvida não é a mesma que escreve código, nem a que estuda o seu PDF. O guia separa isso pra você.",
      points: [
        [
          "chat",
          "Conversar e pesquisar",
          "Tirar dúvida, explicar conceito, buscar com fonte citada.",
          null,
        ],
        [
          "code",
          "Programar e criar",
          "Escrever código, revisar e montar um app ou site.",
          null,
        ],
        [
          "book",
          "Estudar seu material",
          "IA que trabalha em cima dos seus PDFs e anotações.",
          null,
        ],
        [
          "spark",
          "Imagem, vídeo e voz",
          "Pra quando o trabalho não é texto nem código.",
          null,
        ],
      ],
    },
    {
      key: "usarbem",
      bg: BG.indigo,
      hero: "icon",
      icon: "bulb",
      heroSize: 82,
      eyebrow: "USAR BEM",
      title: "Onde ela erra e como pedir",
      lead: "O guia também ensina onde a IA falha e como escrever o pedido pra tirar resposta útil dela.",
      points: [
        [
          "flag",
          "Os riscos",
          "O que ela inventa e por que você precisa conferir.",
          null,
        ],
        [
          "spark",
          "Como pedir",
          "Escrever bem o pedido muda mais que trocar de IA.",
          null,
        ],
      ],
      punch: ["check", "IA acelera. Ela não pensa por você."],
    },
    {
      key: "fim",
      bg: BG.green,
      hero: "logo",
      eyebrow: "BORA USAR",
      title: "Tem roadmap de IA grátis",
      lead: "Além do catálogo de ferramentas, tem um roadmap de IA aberto pra quem quer estudar a área a fundo.",
      cta: "Abrir o guia de IA",
      finale: true,
    },
  ],
};

export default guiaIaOnboarding;
