/**
 * Slugs e rotulos canonicos de area.
 *
 * Espelha as areas de topo de client/src/lib/data.ts (baseAreasTI) e da
 * tabela "areas" no Supabase. Mantido manualmente por enquanto; unificar a
 * fonte de vez (gerar daqui ou do banco) fica pra um refactor futuro.
 * Serve pra validacao no servidor e pra rotular a area no prompt da IA.
 */

export const AREA_SLUGS = [
  "frontend",
  "backend",
  "fullstack",
  "dados",
  "uxui",
  "ia",
  "produto",
  "ciberseguranca",
  "cloud",
  "gestao",
  "qa",
  "mobile",
  "devops",
  "gamedev",
  "analise-dados",
  "engenharia-dados",
  "banco-de-dados",
  "sre",
  "infraestrutura",
  "analise-sistemas",
  "blockchain",
  "iot",
] as const;

export type AreaSlug = (typeof AREA_SLUGS)[number];

// Opcao neutra: analise sem enquadramento de area.
export const GENERAL_AREA = "geral" as const;

export type AreaSelection = AreaSlug | typeof GENERAL_AREA;

export const AREA_LABELS: Record<AreaSlug, string> = {
  frontend: "Front-end",
  backend: "Back-end",
  fullstack: "Full-stack",
  dados: "Ciência de Dados",
  uxui: "UX/UI Design",
  ia: "Inteligência Artificial",
  produto: "Produto Digital",
  ciberseguranca: "Cibersegurança",
  cloud: "Cloud Computing",
  gestao: "Gestão de Projetos Tech",
  qa: "QA / Testes de Software",
  mobile: "Desenvolvimento Mobile",
  devops: "DevOps",
  gamedev: "Game Dev",
  "analise-dados": "Análise de Dados / BI",
  "engenharia-dados": "Engenharia de Dados",
  "banco-de-dados": "Banco de Dados / DBA",
  sre: "SRE (Site Reliability Engineering)",
  infraestrutura: "Suporte e Infraestrutura / Redes",
  "analise-sistemas": "Análise de Sistemas",
  blockchain: "Blockchain / Web3",
  iot: "IoT / Sistemas Embarcados",
};

export function isAreaSlug(value: unknown): value is AreaSlug {
  return typeof value === "string" && (AREA_SLUGS as readonly string[]).includes(value);
}

/** Resolve qualquer entrada para um slug valido ou "geral". */
export function resolveAreaSelection(value: unknown): AreaSelection {
  return isAreaSlug(value) ? value : GENERAL_AREA;
}

/** Rotulo legivel de uma area, ou null quando for "geral". */
export function areaLabel(area: AreaSelection): string | null {
  return area === GENERAL_AREA ? null : AREA_LABELS[area];
}
