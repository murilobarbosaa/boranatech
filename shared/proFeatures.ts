export type ProFeatureColor =
  | "emerald"
  | "blue"
  | "violet"
  | "sky"
  | "orange"
  | "amber"
  | "fuchsia"
  | "pink"
  | "cyan";

export type ProFeatureGroup = "main" | "extra";

export interface ProFeature {
  id: string;
  number: string;
  iconName: string;
  title: string;
  label: string;
  description: string;
  color: ProFeatureColor;
  badge?: string;
  group: ProFeatureGroup;
}

export const PRO_FEATURES: ProFeature[] = [
  {
    id: "curriculo",
    number: "01",
    iconName: "FileText",
    title: "Currículo",
    label: "Analisador de currículo com IA",
    description:
      "Cola seu currículo, recebe feedback acionável em segundos. Cada bullet point reescrito.",
    color: "violet",
    group: "main",
  },
  {
    id: "roadmaps",
    number: "02",
    iconName: "Map",
    title: "Roadmaps",
    label: "Roadmaps completos com IA",
    description:
      "Pra cada área, o caminho exato do zero ao primeiro emprego. Gerados sob medida pra sua realidade.",
    color: "emerald",
    group: "main",
  },
  {
    id: "entrevistas",
    number: "03",
    iconName: "Mic",
    title: "Entrevistas",
    // TODO(Ana): validar label e description da feature unificada
    label: "Treino de entrevista com IA",
    description:
      "Entrevista simulada por chat, calibrada pela vaga ou pela sua área, com feedback a cada resposta e veredito de preparo.",
    color: "amber",
    group: "main",
  },
  {
    id: "plano-carreira",
    number: "04",
    iconName: "CalendarCheck",
    // TODO(Ana): validar title, label e description da feature nova
    title: "Plano de carreira",
    label: "Plano de carreira com IA",
    description:
      "A rota da sua carreira: degraus na ordem certa, certificações que valem o preço e cronograma no seu ritmo.",
    color: "blue",
    group: "extra",
  },
  {
    id: "linkedin",
    number: "05",
    iconName: "Linkedin",
    title: "LinkedIn",
    label: "Otimizador de LinkedIn com IA",
    description:
      "Headline, sobre, experiências. Sua presença profissional traduzida pra linguagem de recrutador.",
    color: "sky",
    group: "extra",
  },
  {
    id: "portfolio",
    number: "06",
    iconName: "Github",
    title: "Portfólio",
    label: "Analisador de portfólio (GitHub)",
    description:
      "Manda seu GitHub. IA aponta o que tá faltando, o que tá bom, o que rouba pontos.",
    color: "orange",
    group: "extra",
  },
  {
    id: "comunidade",
    number: "07",
    iconName: "Users",
    title: "Comunidade",
    label: "Comunidade exclusiva Pro",
    description:
      "Discord só pra assinantes. Networking, dúvidas, conexões reais.",
    color: "cyan",
    badge: "em breve",
    group: "extra",
  },
];

export function getProBenefitLabels(): string[] {
  return PRO_FEATURES.map((f) =>
    f.badge ? `${f.label} (${f.badge})` : f.label,
  );
}
