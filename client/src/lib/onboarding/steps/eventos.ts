import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Eventos,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_28_Eventos.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  blue: "#1D4ED8",
  red: "#E5252F",
  purple: "#6D28D9",
} as const;

const eventosOnboarding: OnboardingDef = {
  screen: "eventos",
  ariaTitle: "Onboarding do Bora na Tech: Eventos",
  steps: [
    {
      key: "oque",
      bg: "#0E7490",
      hero: "icon",
      icon: "cal",
      heroSize: 88,
      eyebrow: "EVENTOS",
      title: "Onde a tech se encontra",
      // TODO(Ana)
      lead: "Conferências, hackathons, meetups e workshops, com link de inscrição. Alguns têm data marcada; outros são recorrentes ou ainda a confirmar.",
      chips: [
        ["Conferências"],
        ["Hackathons"],
        ["Meetups"],
        ["Workshops"],
        ["Feiras"],
      ],
      punch: ["users", "Muita vaga aparece em conversa."],
    },
    {
      key: "card",
      bg: BG.blue,
      hero: "icon",
      icon: "news",
      heroSize: 82,
      eyebrow: "CADA EVENTO MOSTRA",
      title: "Data, local e quanto custa",
      lead: "Dá pra saber se cabe na sua agenda e no seu bolso antes de clicar em qualquer coisa.",
      points: [
        [
          "cal",
          "Data e horário",
          "Quando acontece, com dia e hora quando tem.",
          null,
        ],
        [
          "map",
          "Local e modalidade",
          "Cidade e estado, ou se é online ou híbrido.",
          null,
        ],
        ["case", "Valor", "Gratuito, pago ou pago institucional.", null],
      ],
    },
    {
      key: "atalhos",
      bg: BG.red,
      hero: "icon",
      icon: "check",
      heroSize: 82,
      eyebrow: "DOIS ATALHOS",
      title: "Joga direto na sua agenda",
      lead: "Cada evento tem botão pro Google Calendar e link de inscrição, então você não perde a data por esquecimento.",
      points: [
        [
          "cal",
          "Google Calendar",
          "Um clique e o evento entra na sua agenda.",
          null,
        ],
        [
          "check",
          "Só os gratuitos",
          "Tem um filtro que esconde tudo que é pago.",
          null,
        ],
      ],
      punch: ["flag", "Evento online também conta."],
    },
    {
      key: "fim",
      bg: BG.purple,
      hero: "logo",
      eyebrow: "BORA PARTICIPAR",
      title: "Escolha um pro próximo mês",
      lead: "Filtre pelo seu estado ou marque só os online, e escolha um evento pra ir.",
      cta: "Ver os eventos",
      finale: true,
    },
  ],
};

export default eventosOnboarding;
