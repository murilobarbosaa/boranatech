import type { OnboardingDef } from "../types";

// Conteudo do onboarding de Ranking de Tecnologias,
// transcrito 1:1 do array STEPS de design/onboardings/Onboarding_07_RankingTecnologias.html.
// NAO "melhorar" texto aqui: o HTML de referencia e a fonte, e divergencia de
// copy entre os dois vira discussao sobre qual esta certo. A conferencia e
// automatizada: client/src/lib/onboarding/steps/fidelidade.test.ts avalia o
// STEPS do HTML e compara com este objeto, campo a campo.

/** Fundos de story, iguais aos tokens `--s-*` do CSS de referencia. */
const BG = {
  pink: "#F25CA2",
  indigo: "#1E1B4B",
  red: "#E5252F",
} as const;

const tecnologiasRankingOnboarding: OnboardingDef = {
  screen: "tecnologias-ranking",
  ariaTitle: "Onboarding do Bora na Tech: Ranking de Tecnologias",
  steps: [
    {
      key: "oque",
      bg: "#534AB7",
      hero: "icon",
      icon: "trophy",
      heroSize: 88,
      eyebrow: "RANKING DE USO",
      title: "O que o mercado mais usa",
      lead: "As 61 tecnologias mais usadas, da posição 1 à 61, cada uma com o percentual de quem declarou usar e a fonte do dado.",
      chips: [
        ["Geral"],
        ["Linguagens"],
        ["Frameworks"],
        ["Bancos"],
        ["Ferramentas"],
        ["Cloud"],
        ["DevOps"],
      ],
      punch: ["chart", "Dado de pesquisa, não de achismo."],
    },
    {
      key: "fonte",
      bg: BG.red,
      hero: "icon",
      icon: "search",
      heroSize: 82,
      eyebrow: "DE ONDE VEM O DADO",
      title: "Toda posição tem fonte",
      lead: "O percentual não é estimativa nossa. Vem de pesquisas públicas que você pode abrir e conferir.",
      points: [
        [
          "chart",
          "Stack Overflow 2025",
          "A pesquisa anual respondida por quem programa no mundo todo.",
          null,
        ],
        [
          "code",
          "GitHub Octoverse 2025",
          "Entra quando o dado da pesquisa não cobre a tecnologia.",
          null,
        ],
        [
          "cal",
          "Com o ano à mostra",
          "Ranking envelhece rápido, então a data fica sempre visível.",
          null,
        ],
      ],
    },
    {
      key: "ler",
      bg: BG.indigo,
      hero: "icon",
      icon: "bulb",
      heroSize: 82,
      eyebrow: "COMO LER",
      title: "A lista mistura categorias",
      lead: "Linguagem, marcação, framework, banco e ferramenta aparecem juntos no ranking geral. Compare com cuidado.",
      points: [
        [
          "braces",
          "HTML e CSS no topo",
          "Sobem porque quase todo mundo usa, não porque dão emprego.",
          null,
        ],
        [
          "target",
          "Filtre por categoria",
          "Aí você compara linguagem com linguagem, framework com framework.",
          null,
        ],
      ],
      punch: ["flag", "Popular não quer dizer certo pra você."],
    },
    {
      key: "fim",
      bg: BG.pink,
      hero: "logo",
      eyebrow: "BORA CONFERIR",
      title: "Veja onde a sua tech está",
      lead: "Confira a posição da tecnologia que você estuda e o que está subindo no mercado.",
      cta: "Ver o ranking",
      finale: true,
    },
  ],
};

export default tecnologiasRankingOnboarding;
