import type { PageHeroAccent } from "@/components/shared/PageHero";
import type { Technology, TechnologyCategory } from "@/lib/technologyData";

const CATEGORY_FALLBACK: Record<TechnologyCategory, PageHeroAccent> = {
  Linguagens: "sky",
  Frameworks: "violet",
  "Banco de Dados": "teal",
  Ferramentas: "emerald",
  Cloud: "orange",
  DevOps: "cyan",
  "Dados e IA": "blue",
  Segurança: "rose",
  Testes: "teal",
  Design: "fuchsia",
  Gestão: "emerald",
};

/** Cores próximas à identidade mais conhecida de cada stack */
const TECH_SLUG_ACCENT: Partial<Record<string, PageHeroAccent>> = {
  javascript: "amber",
  typescript: "blue",
  html: "orange",
  css: "sky",
  react: "cyan",
  vuejs: "emerald",
  angular: "rose",
  nextjs: "blue",
  nodejs: "emerald",
  python: "emerald",
  java: "orange",
  php: "fuchsia",
  csharp: "violet",
  go: "cyan",
  rust: "orange",
  sql: "sky",
  postgresql: "blue",
  mysql: "blue",
  mongodb: "emerald",
  redis: "rose",
  docker: "cyan",
  kubernetes: "blue",
  aws: "orange",
  terraform: "violet",
  ansible: "rose",
  "github-actions": "blue",
  jenkins: "blue",
  flutter: "sky",
  swift: "orange",
  kotlin: "violet",
  r: "blue",
  spark: "orange",
  graphql: "fuchsia",
  tailwindcss: "cyan",
  sass: "fuchsia",
  vite: "violet",
  expressjs: "emerald",
  fastapi: "emerald",
  django: "emerald",
  springboot: "emerald",
  redux: "violet",
  webpack: "sky",
  storybook: "fuchsia",
  cypress: "teal",
  playwright: "teal",
  prometheus: "orange",
  grafana: "orange",
  kafka: "violet",
  rabbitmq: "orange",
  elasticsearch: "amber",
  tensorflow: "orange",
  pytorch: "rose",
  numpy: "blue",
};

const AREA_SLUG_ACCENT: Record<string, PageHeroAccent> = {
  frontend: "cyan",
  backend: "orange",
  fullstack: "violet",
  dados: "blue",
  uxui: "fuchsia",
  ia: "violet",
  produto: "amber",
  ciberseguranca: "rose",
  cloud: "sky",
  gestao: "emerald",
  qa: "teal",
  mobile: "fuchsia",
  devops: "cyan",
  gamedev: "fuchsia",
  "analise-dados": "sky",
  "engenharia-dados": "cyan",
  "banco-de-dados": "teal",
  sre: "orange",
  infraestrutura: "blue",
  "analise-sistemas": "amber",
  blockchain: "emerald",
  iot: "rose",
  mainframe: "blue",
};

export function accentForTechnology(technology: Technology): PageHeroAccent {
  const bySlug = TECH_SLUG_ACCENT[technology.slug];
  if (bySlug) return bySlug;
  return CATEGORY_FALLBACK[technology.category] ?? "violet";
}

export function accentForAreaSlug(slug: string): PageHeroAccent {
  return AREA_SLUG_ACCENT[slug] ?? "violet";
}
