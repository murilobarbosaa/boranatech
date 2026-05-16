export type BadgeCategory = "estudo" | "trilhas" | "pro" | "comunidade";

export type BadgeCheckType =
  | "study_entries_count"
  | "study_minutes_total"
  | "study_streak_current"
  | "study_streak_longest"
  | "roadmap_started"
  | "roadmap_completed"
  | "roadmaps_concurrent"
  | "pro_active"
  | "pro_duration_days";

export interface BadgeDefinition {
  id: string;
  category: BadgeCategory;
  name: string;
  description: string;
  iconName: string;
  unlockCriteria: string;
  checkType: BadgeCheckType;
  checkThreshold: number;
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: "first-step",
    category: "estudo",
    name: "Primeiro passo",
    description: "Você começou sua jornada criando a primeira entrada no diário.",
    iconName: "Footprints",
    unlockCriteria: "Crie 1 entrada no diário de estudos",
    checkType: "study_entries_count",
    checkThreshold: 1,
  },
  {
    id: "marathon",
    category: "estudo",
    name: "Maratonista",
    description: "Dedicação que rende: 10 horas totais de estudo registradas.",
    iconName: "BookOpen",
    unlockCriteria: "Estude por 10h totais (600 minutos)",
    checkType: "study_minutes_total",
    checkThreshold: 600,
  },
  {
    id: "dedication",
    category: "estudo",
    name: "Dedicação",
    description: "50 horas de estudo é compromisso real com sua trajetória.",
    iconName: "Trophy",
    unlockCriteria: "Estude por 50h totais (3000 minutos)",
    checkType: "study_minutes_total",
    checkThreshold: 3000,
  },
  {
    id: "streak-7",
    category: "estudo",
    name: "Streak 7",
    description: "7 dias seguidos estudando. Consistência é o segredo.",
    iconName: "Flame",
    unlockCriteria: "Estude por 7 dias consecutivos",
    checkType: "study_streak_longest",
    checkThreshold: 7,
  },
  {
    id: "streak-30",
    category: "estudo",
    name: "Streak 30",
    description: "Um mês inteiro sem parar. Você é imparável.",
    iconName: "Zap",
    unlockCriteria: "Estude por 30 dias consecutivos",
    checkType: "study_streak_longest",
    checkThreshold: 30,
  },

  {
    id: "explorer",
    category: "trilhas",
    name: "Explorador",
    description: "Toda jornada começa com um primeiro mapa.",
    iconName: "Map",
    unlockCriteria: "Inicie sua primeira trilha",
    checkType: "roadmap_started",
    checkThreshold: 1,
  },
  {
    id: "completed",
    category: "trilhas",
    name: "Concluiu",
    description: "Sua primeira trilha concluída. Você chegou ao fim de algo.",
    iconName: "CheckCheck",
    unlockCriteria: "Complete 1 trilha do início ao fim",
    checkType: "roadmap_completed",
    checkThreshold: 1,
  },
  {
    id: "multifocus",
    category: "trilhas",
    name: "Multifocus",
    description: "3 caminhos em paralelo. Curiosidade é um superpoder.",
    iconName: "Compass",
    unlockCriteria: "Tenha 3 trilhas em progresso ao mesmo tempo",
    checkType: "roadmaps_concurrent",
    checkThreshold: 3,
  },

  {
    id: "supporter",
    category: "pro",
    name: "Apoiador",
    description: "Você acreditou no projeto desde cedo. Obrigada!",
    iconName: "Heart",
    unlockCriteria: "Vire Pro pela primeira vez",
    checkType: "pro_active",
    checkThreshold: 1,
  },
  {
    id: "veteran",
    category: "pro",
    name: "Veterano",
    description: "6 meses como Pro é compromisso de verdade.",
    iconName: "Crown",
    unlockCriteria: "Seja Pro por 6 meses (180 dias)",
    checkType: "pro_duration_days",
    checkThreshold: 180,
  },
  {
    id: "legendary",
    category: "pro",
    name: "Lendário",
    description: "1 ano de Pro. Você faz parte da história do Bora.",
    iconName: "Sparkles",
    unlockCriteria: "Seja Pro por 1 ano (365 dias)",
    checkType: "pro_duration_days",
    checkThreshold: 365,
  },
];

export const BADGE_CATEGORIES: Record<
  BadgeCategory,
  { label: string; color: string; hexBg: string; hexFg: string }
> = {
  estudo: {
    label: "Estudo",
    color: "amber",
    hexBg: "#fef3c7",
    hexFg: "#d97706",
  },
  trilhas: {
    label: "Trilhas",
    color: "violet",
    hexBg: "#ede9fe",
    hexFg: "#7c3aed",
  },
  pro: {
    label: "Pro",
    color: "fuchsia",
    hexBg: "#fae8ff",
    hexFg: "#c026d3",
  },
  comunidade: {
    label: "Comunidade",
    color: "emerald",
    hexBg: "#d1fae5",
    hexFg: "#059669",
  },
};
