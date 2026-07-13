export type ColorFamily =
  | "discovery"
  | "technical"
  | "market"
  | "application"
  | "information"
  | "reference"
  | "community"
  | "women"
  | "creative"
  | "institutional";

export interface ColorFamilyConfig {
  bg: string;
  fg: string;
  eyebrow: string;
  label: string;
}

export const COLOR_FAMILIES: Record<ColorFamily, ColorFamilyConfig> = {
  discovery: {
    bg: "bg-violet-100",
    fg: "text-violet-900",
    eyebrow: "bg-violet-300",
    label: "Descoberta",
  },
  technical: {
    bg: "bg-emerald-100",
    fg: "text-emerald-900",
    eyebrow: "bg-emerald-300",
    label: "Técnico",
  },
  market: {
    bg: "bg-amber-100",
    fg: "text-amber-900",
    eyebrow: "bg-amber-300",
    label: "Mercado",
  },
  application: {
    bg: "bg-blue-100",
    fg: "text-blue-900",
    eyebrow: "bg-blue-300",
    label: "Candidatura",
  },
  information: {
    bg: "bg-sky-100",
    fg: "text-sky-900",
    eyebrow: "bg-sky-300",
    label: "Informação",
  },
  reference: {
    bg: "bg-cyan-100",
    fg: "text-cyan-900",
    eyebrow: "bg-cyan-300",
    label: "Referência",
  },
  community: {
    bg: "bg-fuchsia-100",
    fg: "text-fuchsia-900",
    eyebrow: "bg-fuchsia-300",
    label: "Comunidade",
  },
  women: {
    bg: "bg-pink-100",
    fg: "text-pink-900",
    eyebrow: "bg-pink-300",
    label: "Mulheres em TI",
  },
  creative: {
    bg: "bg-orange-100",
    fg: "text-orange-900",
    eyebrow: "bg-orange-300",
    label: "Criativo",
  },
  institutional: {
    bg: "bg-[#faf8f4]",
    fg: "text-slate-900",
    eyebrow: "bg-slate-200",
    label: "Institucional",
  },
};

// FONTE CANONICA de accent por rota: toda pagina deriva o proprio accent da
// familia registrada aqui (via COLOR_FAMILIES). Divergencias intencionais de
// marca sao registradas com comentario na propria linha; rota fora do mapa cai
// no fallback institutional (bug de registro, nao decisao).
export const PAGE_FAMILY: Record<string, ColorFamily> = {
  // discovery
  areas: "discovery",
  "quiz-carreira": "discovery",
  tecnologias: "discovery",
  comunidades: "discovery",
  faculdades: "discovery",

  // technical
  roadmaps: "technical",
  portfolio: "technical",
  evolucao: "technical",
  "tecnologias/por-area": "technical",
  comparador: "technical",
  plataformas: "technical",
  "tecnologias/comparar": "technical",

  // market
  cursos: "market",
  vagas: "market",
  salarios: "market",
  "tecnologias/ranking": "market",
  mentorias: "market",
  dicas: "market",
  estudos: "market",
  "plano-carreira": "market",
  // Divergencia intencional: marca Natechinho (amber), nao a familia
  // application da rota-mae curriculo.
  "curriculo/gerar": "market",

  // application
  curriculo: "application",
  "curriculo/analisar": "application",
  empresas: "application",
  "empresas/ranking-junior": "application",
  entrevistas: "application",
  "entrevistas/sessao": "application",
  "entrevistas/perguntas": "application",
  "entrevistas/simulador": "application",
  "entrevistas/desafios": "application",
  // Divergencia intencional: violet consolidado da pagina (revisao com IA),
  // nao o blue da familia application nem o emerald do hub portfolio.
  "portfolio/analisar": "discovery",

  // information
  noticias: "information",
  ingles: "information",
  // Divergencia intencional: sky pela marca LinkedIn, nao o blue da familia
  // application das rotas de curriculo.
  "linkedin/analisar": "information",

  // reference
  dicionario: "reference",

  // community
  eventos: "community",
  "estudos/diario": "community",

  // women
  mulheres: "women",

  // creative
  projetos: "creative",
  freelance: "creative",
  ferramentas: "creative",

  // institutional
  "/": "institutional",
  sobre: "institutional",
  pro: "institutional",
  "pro/sucesso": "institutional",
  perfil: "institutional",
  licenca: "institutional",
  privacidade: "institutional",
  "termos-de-uso": "institutional",
};

export function getPageColors(slug: string): ColorFamilyConfig {
  const family = PAGE_FAMILY[slug] ?? "institutional";
  return COLOR_FAMILIES[family];
}
