import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Projetos,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_14_Projetos.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  pink: "#F25CA2",
  red: "#E5252F",
  green: "#15803D",
} as const;

const projetosOnboarding: OnboardingDef = {
  screen: "projetos",
  ariaTitle: "Onboarding do Bora na Tech: Projetos",
  steps: [
    {
      key: "oque",
      bg: BG.green,
      hero: "icon",
      icon: "code",
      heroSize: 88,
      eyebrow: "PROJETOS",
      title: "Portfólio é o que te contrata",
      // TODO(Ana): numero de projetos na copy do onboarding
      lead: "Sem experiência na carteira, o portfólio é a única prova de que você sabe fazer. São mais de 250 projetos pra você construir a sua.",
      chips: [
        ["Front-end"],
        ["Back-end"],
        ["Full-stack"],
        ["UX/UI"],
        ["Dados"],
        ["QA"],
      ],
      punch: ["flag", "Recrutador olha projeto, não certificado."],
    },
    {
      key: "dentro",
      bg: "#0E7490",
      hero: "icon",
      icon: "layers",
      heroSize: 82,
      eyebrow: "DENTRO DE CADA UM",
      title: "Não é só o nome do projeto",
      lead: "Cada projeto vem explicado por inteiro: o que você precisa entregar, o caminho pra chegar lá e até vídeo pra acompanhar.",
      points: [
        [
          "check",
          "O entregável",
          "Exatamente o que precisa estar pronto no fim.",
          null,
        ],
        [
          "news",
          "O passo a passo",
          "O caminho até lá, sem você ter que adivinhar.",
          null,
        ],
        [
          "chat",
          "Vídeo junto",
          "Dá pra assistir e construir ao mesmo tempo.",
          null,
        ],
      ],
    },
    {
      key: "porque",
      bg: BG.pink,
      hero: "icon",
      icon: "trophy",
      heroSize: 82,
      eyebrow: "POR QUE IMPORTA",
      title: "Ele responde o que o CV não",
      lead: "O currículo diz que você estudou. O projeto mostra o que você entregou, e é sobre isso que a entrevista técnica pergunta.",
      points: [
        [
          "case",
          "Prova que você faz",
          "Código rodando vale mais que curso concluído.",
          null,
        ],
        [
          "chat",
          "Assunto pra entrevista",
          "Metade das perguntas vira conversa sobre o seu projeto.",
          null,
        ],
        [
          "trophy",
          "Te separa da fila",
          "Muita gente tem o mesmo curso. Poucos têm projeto pronto.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: BG.red,
      hero: "logo",
      eyebrow: "BORA CONSTRUIR",
      title: "Um terminado vale por três",
      lead: "Filtre por nível, área ou tecnologia e escolha um. Os das trilhas são gratuitos, os com selo Pro são desafios mais puxados.",
      punch: ["check", "Termine um e suba pro GitHub."],
      proCta: ["Assinar o Pro", "https://www.boranatech.com.br/planos"],
      cta: "Ver os projetos",
      finale: true,
    },
  ],
};

export default projetosOnboarding;
