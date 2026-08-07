import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Salários,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_26_Salarios.html.
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

const salariosOnboarding: OnboardingDef = {
  screen: "salarios",
  ariaTitle: "Onboarding do Bora na Tech: Salários",
  steps: [
    {
      key: "oque",
      bg: BG.blue,
      hero: "icon",
      icon: "chart",
      heroSize: 88,
      eyebrow: "SALÁRIOS",
      title: "Quanto se ganha em cada cargo",
      lead: "São 104 faixas salariais cobrindo mais de 30 cargos da TI, de estágio a arquiteto, tanto em CLT quanto em PJ.",
      chips: [
        ["Estágio"],
        ["Trainee"],
        ["Júnior"],
        ["Pleno"],
        ["Sênior"],
        ["Especialista"],
        ["Arquiteto"],
      ],
      punch: ["case", "Saber a faixa muda a negociação."],
    },
    {
      key: "fonte",
      bg: BG.indigo,
      hero: "icon",
      icon: "search",
      heroSize: 82,
      eyebrow: "DE ONDE VEM O DADO",
      title: "Quatro fontes de mercado",
      lead: "Não é chute nem média de grupo de WhatsApp. Cada faixa vem de pesquisa salarial publicada e citada na página.",
      points: [
        [
          "news",
          "Robert Half 2025",
          "Pesquisa salarial de consultoria de recrutamento.",
          null,
        ],
        [
          "chart",
          "Glassdoor e Coodesh",
          "Dados declarados por quem trabalha na área.",
          null,
        ],
        [
          "cpu",
          "State of Data 2024",
          "A referência específica da área de dados.",
          null,
        ],
      ],
    },
    {
      key: "ler",
      bg: BG.purple,
      hero: "icon",
      icon: "bulb",
      heroSize: 82,
      eyebrow: "COMO LER",
      title: "É faixa, não é promessa",
      lead: "O valor real muda por empresa, região, senioridade e momento do mercado. Use como ponto de partida, não como garantia.",
      points: [
        [
          "map",
          "Filtre pela sua cidade",
          "A diferença entre capital e interior é grande.",
          null,
        ],
        [
          "case",
          "CLT e PJ são diferentes",
          "PJ parece maior, mas não tem os encargos embutidos.",
          null,
        ],
      ],
      punch: ["flag", "Ponto de partida, não teto."],
    },
    {
      key: "fim",
      bg: "#B45309",
      hero: "logo",
      eyebrow: "BORA CONSULTAR",
      title: "Veja a faixa do seu cargo",
      lead: "Filtre por área, nível e cidade e veja quanto o mercado tem pagado na posição que você quer.",
      cta: "Ver os salários",
      finale: true,
    },
  ],
};

export default salariosOnboarding;
