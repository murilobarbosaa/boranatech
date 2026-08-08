import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Gerar Currículo,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_21_CurriculoGerar.html.
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

const curriculoGerarOnboarding: OnboardingDef = {
  screen: "curriculo-gerar",
  ariaTitle: "Onboarding do Bora na Tech: Gerar Currículo",
  steps: [
    {
      key: "oque",
      bg: BG.pink,
      hero: "icon",
      icon: "news",
      heroSize: 88,
      eyebrow: "GERAR CURRÍCULO",
      title: "Um currículo por conversa",
      lead: "Sem formulário. Você conversa com o Natechinho e ele monta o currículo no formato certo pra vaga que você quer.",
      punch: ["chat", "Nada de campo em branco pra preencher."],
    },
    {
      key: "formatos",
      bg: BG.red,
      hero: "icon",
      icon: "layers",
      heroSize: 82,
      eyebrow: "TRÊS FORMATOS",
      title: "O formato muda a leitura",
      lead: "Não existe currículo universal. O modelo certo depende da vaga e do quanto de experiência você já tem.",
      points: [
        [
          "layers",
          "Híbrido",
          "Junta habilidades e experiência, bom pra quem tem pouca estrada.",
          null,
        ],
        [
          "cal",
          "Cronológico",
          "Do mais recente pro mais antigo, o que a maioria espera.",
          null,
        ],
        [
          "cap",
          "Harvard",
          "Enxuto e acadêmico, forte pra estágio e programas de trainee.",
          null,
        ],
      ],
    },
    {
      key: "como",
      bg: "#0E7490",
      hero: "icon",
      icon: "chat",
      heroSize: 82,
      eyebrow: "COMO FUNCIONA",
      title: "Você fala, ele escreve",
      lead: "A conversa puxa o que interessa pra vaga e transforma isso em texto de currículo, sem você travar na página em branco.",
      points: [
        [
          "chat",
          "Conversa rápida",
          "Ele pergunta, você responde do seu jeito.",
          null,
        ],
        [
          "check",
          "Sai pronto",
          "O texto já vem no tom que recrutador espera ler.",
          null,
        ],
      ],
    },
    {
      key: "fim",
      bg: BG.blue,
      hero: "logo",
      eyebrow: "BORA MONTAR",
      title: "Essa é uma ferramenta Pro",
      lead: "A geração assistida e os três formatos fazem parte do plano pago, a partir de R$ 18,50 por mês.",
      proCta: ["Assinar o Pro", "https://www.boranatech.com.br/planos"],
      cta: "Gerar currículo",
      finale: true,
    },
  ],
};

export default curriculoGerarOnboarding;
