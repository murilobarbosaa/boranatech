import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Mulheres,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_33_Mulheres.html.
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

const mulheresOnboarding: OnboardingDef = {
  screen: "mulheres",
  ariaTitle: "Onboarding do Bora na Tech: Mulheres",
  steps: [
    {
      key: "oque",
      bg: BG.purple,
      hero: "icon",
      icon: "heart",
      heroSize: 88,
      eyebrow: "MULHERES NA TECH",
      title: "Um espaço pra chegar e ficar",
      lead: "Comunidades, cursos gratuitos, mentorias, vagas afirmativas e bolsas, reunidos em um lugar só.",
      punch: ["heart", "Ninguém precisa entrar sozinha."],
    },
    {
      key: "numeros",
      bg: "#B45309",
      hero: "icon",
      icon: "chart",
      heroSize: 82,
      eyebrow: "POR QUE EXISTE",
      title: "Os números explicam",
      lead: "Mulheres ocupam cerca de 22% dos postos de TI no Brasil e ganham em média 31% a menos. A página trata disso de frente.",
      stats: [
        ["22%", "dos postos de TI"],
        ["-31%", "de diferença salarial"],
      ],
      punch: ["flag", "Dado não é desculpa. É contexto."],
    },
    {
      key: "dentro",
      bg: BG.indigo,
      hero: "icon",
      icon: "layers",
      heroSize: 82,
      eyebrow: "O QUE TEM DENTRO",
      title: "Da comunidade até a vaga",
      lead: "A página segue uma trilha: começa em comunidade e apoio, e termina em curso, mentoria e oportunidade.",
      points: [
        [
          "users",
          "Comunidades",
          "Mais de 20 grupos, de Tech Sisters a PyLadies.",
          null,
        ],
        [
          "cap",
          "Cursos e mentorias",
          "Laboratoria, Ada, PrograMaria e outros programas.",
          null,
        ],
        [
          "case",
          "Vagas afirmativas",
          "Bolsas e oportunidades que abrem periodicamente.",
          null,
        ],
        [
          "heart",
          "Apoio de verdade",
          "Síndrome da impostora, medo de começar e canal de denúncia.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: BG.green,
      hero: "logo",
      eyebrow: "BORA JUNTAS",
      title: "Comece pela trilha inicial",
      lead: "São cinco passos pensados pra quem está chegando agora, com checklist de segurança em comunidade.",
      cta: "Abrir a página",
      finale: true,
    },
  ],
};

export default mulheresOnboarding;
