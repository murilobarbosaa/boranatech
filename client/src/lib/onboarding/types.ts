import type { OnboardingIconName } from "./icons";

// Tipos do conteudo de onboarding, espelhando FIELMENTE os campos do array
// STEPS de design/onboardings/Onboarding_*.html. As tuplas nao sao um estilo
// escolhido aqui: sao a forma que o conteudo ja tem no HTML de referencia, e
// transcrever 1:1 e o requisito. Converter para objetos nomeados obrigaria a
// reescrever cada passo na importacao, que e exatamente onde erro de
// transcricao entra sem ninguem ver.

/** `chips:[['Sem enrolação',null], ...]` ou `chips:[['Áreas'], ...]`.
 *  O renderizador do HTML le somente `c[0]`; o segundo elemento existe em
 *  alguns passos e e ignorado. Mantido no tipo para a transcricao ser literal. */
export type OnboardingChip = readonly [label: string, extra?: unknown];

/** `points:[['sprout','Não sei nada','Descubra...', 0], ...]`
 *  O 4o item e o indice do perfil que essa linha atende (`applyProfile`);
 *  `null` = vale para todo perfil. */
export type OnboardingPoint = readonly [
  icon: OnboardingIconName,
  title: string,
  description: string,
  perfil: number | null,
];

/** `choices:[['sprout','Não sei nada','quero descobrir...'], ...]` */
export type OnboardingChoice = readonly [
  icon: OnboardingIconName,
  label: string,
  description: string,
];

/** `tools:[['case','Vagas',true], ...]` — o 3o item liga a etiqueta PRO. */
export type OnboardingTool = readonly [
  icon: OnboardingIconName,
  label: string,
  pro?: boolean,
];

/** `stats:[['+450','cursos catalogados'], ...]` */
export type OnboardingStat = readonly [value: string, label: string];

/** `price:['R$ ...','...']` */
export type OnboardingPrice = readonly [title: string, description: string];

/**
 * `proCta:['Assinar o Pro','https://www.boranatech.com.br/planos']`
 *
 * O href vem do CONTEUDO como esta no HTML de referencia, absoluto. Decidir que
 * uma URL do proprio site e rota interna e do RENDERIZADOR, nao daqui: o
 * conteudo e transcricao 1:1 e nao pode carregar decisao de navegacao.
 */
export type OnboardingProCta = readonly [label: string, href: string];

/** `punch:['flag','A gente existe pra resolver isso.']` */
export type OnboardingPunch = readonly [icon: OnboardingIconName, text: string];

export interface OnboardingStepDef {
  /** Identificador do passo. Vai nos eventos `bnt:onboarding`. */
  key: string;
  /** Cor de fundo do card (`--bg`). */
  bg: string;
  hero?: "logo" | "icon";
  /** Obrigatorio quando `hero === 'icon'`. */
  icon?: OnboardingIconName;
  /** Diametro do anel tracejado em px. Default do HTML: 96 (104 para o logo). */
  heroSize?: number;
  eyebrow: string;
  title: string;
  lead: string;
  chips?: readonly OnboardingChip[];
  points?: readonly OnboardingPoint[];
  choices?: readonly OnboardingChoice[];
  tools?: readonly OnboardingTool[];
  stats?: readonly OnboardingStat[];
  price?: OnboardingPrice;
  /** Botao de assinatura do Pro. Renderiza entre `price` e `punch`. */
  proCta?: OnboardingProCta;
  punch?: OnboardingPunch;
  /** Rotulo do botao principal no ultimo passo. Default: "Começar". */
  cta?: string;
  /** Ultimo card: dispara o confete. */
  finale?: boolean;
}

export interface OnboardingDef {
  /** Vai no campo `screen` de todo evento `bnt:onboarding`. */
  screen: string;
  /** Titulo acessivel (visualmente oculto) do dialogo. */
  ariaTitle: string;
  steps: readonly OnboardingStepDef[];
}

/** Perfis do passo interativo `profile`, na ordem das opcoes. */
export const ONBOARDING_PERFIS = [
  "nao-sei-nada",
  "sei-mas-e-agora",
  "ja-estou-na-area",
] as const;
export type OnboardingPerfil = (typeof ONBOARDING_PERFIS)[number];

/** Escolhas do passo interativo `tour`, na ordem das opcoes. */
export const ONBOARDING_TOURS = ["guiado", "livre"] as const;
export type OnboardingTour = (typeof ONBOARDING_TOURS)[number];

/** Como o onboarding terminou. */
export type OnboardingHow = "concluido" | "pulado";

/** Payload do CustomEvent `bnt:onboarding`. */
export interface OnboardingEventDetail {
  source: "bnt-onboarding";
  screen: string;
  type: "step" | "choice" | "finish";
  [extra: string]: unknown;
}
