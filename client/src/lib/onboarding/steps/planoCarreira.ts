import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Plano de Carreira,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_11_PlanoCarreira.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  blue: "#1D4ED8",
  indigo: "#1E1B4B",
  red: "#E5252F",
  purple: "#6D28D9",
} as const;

const planoCarreiraOnboarding: OnboardingDef = {
  screen: "plano-carreira",
  ariaTitle: "Onboarding do Bora na Tech: Plano de Carreira",
  steps: [
    {
      key: "oque",
      bg: BG.red,
      hero: "icon",
      icon: "target",
      heroSize: 88,
      eyebrow: "PLANO DE CARREIRA",
      title: "Do zero até a vaga, com data",
      lead: "Você diz onde quer chegar, quanto tempo tem por semana e quanto pode investir. Sai um plano com fases, prazos e certificações.",
      chips: [["Fases"], ["Prazos"], ["Certificações"], ["Checklist"]],
      punch: ["flag", "Estudar sem prazo vira estudar pra sempre."],
    },
    {
      key: "informa",
      bg: BG.purple,
      hero: "icon",
      icon: "chat",
      heroSize: 82,
      eyebrow: "SEIS PERGUNTAS",
      title: "Você responde, ele monta",
      lead: "É um formulário curto. Quanto mais honesto você for no tempo e no orçamento, mais realista o plano sai.",
      points: [
        [
          "target",
          "Objetivo e área",
          "Onde você quer chegar e em que parte da TI.",
          null,
        ],
        [
          "cal",
          "Tempo disponível",
          "Horas por semana e em quanto tempo quer chegar lá.",
          null,
        ],
        [
          "case",
          "Orçamento",
          "Quanto dá pra investir, pra sugerir só o que cabe.",
          null,
        ],
      ],
    },
    {
      key: "recebe",
      bg: BG.blue,
      hero: "icon",
      icon: "map",
      heroSize: 82,
      eyebrow: "O QUE VOCÊ RECEBE",
      title: "Uma rota com estações",
      lead: "O plano vem dividido em fases ordenadas, cada uma com duração estimada e exatamente o que fazer dentro dela.",
      points: [
        [
          "layers",
          "Fases ordenadas",
          "Os degraus na sequência certa, com duração estimada.",
          null,
        ],
        [
          "trophy",
          "Certificações que valem",
          "Quais fazem sentido pro seu bolso e quando tirar cada uma.",
          null,
        ],
        [
          "check",
          "Checklist de progresso",
          "Pra marcar o que já foi e enxergar o quanto falta.",
          null,
        ],
      ],
    },
    {
      key: "plano",
      bg: BG.indigo,
      hero: "icon",
      icon: "lock",
      heroSize: 82,
      eyebrow: "GRÁTIS × PRO",
      title: "Essa é uma ferramenta Pro",
      lead: "O plano personalizado faz parte do plano pago. O resto da plataforma continua aberto pra você usar à vontade.",
      price: [
        "A partir de R$ 18,50/mês",
        "no plano anual, cancela quando quiser",
      ],
      proCta: ["Assinar o Pro", "https://www.boranatech.com.br/planos"],
      punch: ["heart", "Sem plano, a gente estuda no escuro."],
    },
    {
      key: "fim",
      bg: "#0E7490",
      hero: "logo",
      eyebrow: "BORA PLANEJAR",
      title: "Monte o seu em minutos",
      lead: "Responda o formulário e receba a rota completa até a sua primeira vaga na área.",
      cta: "Montar meu plano",
      finale: true,
    },
  ],
};

export default planoCarreiraOnboarding;
