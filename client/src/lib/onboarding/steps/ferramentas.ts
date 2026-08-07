import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Ferramentas,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_16_Ferramentas.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.
//
// DESVIO APROVADO, o unico do Lote A. O HTML de referencia usa o icone 'star'
// no passo 'etiqueta', e 'star' NAO existe no objeto I dele: a estrela de 4
// pontas mora numa funcao `star()` separada, que `svg()` nao consulta. Como
// `svg()` faz `I[n] || ''`, o card renderiza um <svg> VAZIO no navegador, sem
// erro nenhum. E defeito do material, nao intencao de design.
//
// Aqui a estrela virou entrada de ONBOARDING_ICONS (mesmo path da funcao
// `star()`, com fill currentColor), entao este passo mostra o icone que o
// conteudo pede. Efeito colateral: no HTML original a linha "Importante"
// aparece sem icone; aqui aparece com.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  pink: "#F25CA2",
  indigo: "#1E1B4B",
  green: "#15803D",
} as const;

const ferramentasOnboarding: OnboardingDef = {
  screen: "ferramentas",
  ariaTitle: "Onboarding do Bora na Tech: Ferramentas",
  steps: [
    {
      key: "oque",
      bg: BG.indigo,
      hero: "icon",
      icon: "tools",
      heroSize: 88,
      eyebrow: "FERRAMENTAS",
      title: "O mínimo que todo dev usa",
      lead: "São 34 ferramentas que quem trabalha com tecnologia mexe todo dia. Se você não conhece alguma, é aqui que você descobre.",
      chips: [
        ["IA"],
        ["Desenvolvimento"],
        ["Design"],
        ["Produtividade"],
        ["Banco de dados"],
        ["DevOps"],
      ],
      punch: ["check", "O básico que ninguém te ensina."],
    },
    {
      key: "etiqueta",
      bg: BG.green,
      hero: "icon",
      icon: "flag",
      heroSize: 82,
      eyebrow: "CADA FERRAMENTA TEM",
      title: "Quanto ela é obrigatória",
      lead: "A etiqueta é o que mais importa. Ela evita você perder um sábado instalando coisa que ainda não vai usar.",
      points: [
        [
          "flag",
          "Obrigatório",
          "Sem isso você não trabalha na área. Instale primeiro.",
          null,
        ],
        [
          "star",
          "Importante",
          "Facilita muito, mas dá pra começar sem ela.",
          null,
        ],
        [
          "bulb",
          "Opcional",
          "Quando já estiver rodando, aí você olha essas.",
          null,
        ],
      ],
    },
    {
      key: "alem",
      bg: "#B45309",
      hero: "icon",
      icon: "term",
      heroSize: 82,
      eyebrow: "ALÉM DA LISTA",
      title: "Setup pronto e cheatsheet",
      lead: "Tem duas coisas que quase ninguém acha na primeira visita e que economizam bastante tempo de configuração.",
      points: [
        [
          "check",
          "Guia de setup por área",
          "Checklist e comandos pra montar seu ambiente do zero.",
          null,
        ],
        [
          "term",
          "Cheatsheet de atalhos",
          "Editor, Git e terminal, no Windows, Linux ou Mac.",
          null,
        ],
      ],
      punch: ["spark", "Várias têm tutorial em vídeo junto."],
    },
    {
      key: "fim",
      bg: BG.pink,
      hero: "logo",
      eyebrow: "BORA MONTAR",
      title: "Monte seu ambiente hoje",
      lead: "Abra o guia de setup da sua área e siga o checklist até o ambiente estar rodando na sua máquina.",
      cta: "Ver as ferramentas",
      finale: true,
    },
  ],
};

export default ferramentasOnboarding;
