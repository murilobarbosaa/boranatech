import type { AgentTier } from "./types";

// Mapa de navegacao e catalogo de tier do BoraNaTech, semeado a partir das rotas
// declaradas em client/src/App.tsx. Serve ao agente para (a) responder "onde
// encontro X" e (b) identificar corretamente o que e Pro nos CTAs.
//
// SOBRE O TIER: App.tsx separa publico vs RequireAuth (login), NAO free vs Pro.
// A fonte factual do que e Pro e server/lib/aiTools.ts (todas as AI tools tem
// requiresPro: true) combinada com a regra de produto (descoberta e gratis,
// analise personalizada por IA e Pro). Por isso so marcamos como "pro" as rotas
// de analise por IA personalizada; todo o resto e "free" (descoberta).
//
// Os rotulos abaixo sao FACTUAIS (proposito da rota), nao copy de marketing.
// TODO(Ana): descricoes mais ricas por rota (uma frase de valor por pagina).

export interface PlatformRoute {
  route: string;
  tier: AgentTier;
  label: string;
}

export const PLATFORM_ROUTES: PlatformRoute[] = [
  { route: "/", tier: "free", label: "Pagina inicial do BoraNaTech." },
  { route: "/areas", tier: "free", label: "Lista de areas de tecnologia." },
  { route: "/tecnologias", tier: "free", label: "Lista de tecnologias." },
  { route: "/empresas", tier: "free", label: "Empresas de tecnologia." },
  { route: "/salarios", tier: "free", label: "Dados de salarios em tecnologia." },
  { route: "/entrevistas", tier: "free", label: "Hub de preparacao para entrevistas." },
  { route: "/entrevistas/perguntas", tier: "free", label: "Banco de perguntas de entrevista." },
  { route: "/entrevistas/desafios", tier: "free", label: "Desafios de entrevista." },
  { route: "/portfolio", tier: "free", label: "Guia de portfolio." },
  { route: "/curriculo", tier: "free", label: "Guia de curriculo." },
  { route: "/estudos", tier: "free", label: "Hub de recursos de estudo." },
  { route: "/empregabilidade", tier: "free", label: "Conteudo de empregabilidade." },
  { route: "/networking", tier: "free", label: "Guia de networking." },
  { route: "/freelance", tier: "free", label: "Guia de freelance." },
  { route: "/evolucao", tier: "free", label: "Trilhas de evolucao de carreira." },
  { route: "/simulador", tier: "free", label: "Simulador de carreira." },
  { route: "/ingles", tier: "free", label: "Recursos de ingles para tecnologia." },
  { route: "/ingles/onde-estudar", tier: "free", label: "Onde estudar ingles." },
  { route: "/ingles/no-trabalho", tier: "free", label: "Ingles no trabalho." },
  { route: "/ingles/entrevista", tier: "free", label: "Ingles para entrevista." },
  { route: "/ingles/vocabulario", tier: "free", label: "Vocabulario de ingles." },
  { route: "/ferramentas", tier: "free", label: "Diretorio de ferramentas." },
  { route: "/ia", tier: "free", label: "Guia de IA." },
  { route: "/mentorias", tier: "free", label: "Mentorias." },
  { route: "/roadmaps", tier: "free", label: "Indice de roadmaps de aprendizado." },
  { route: "/cursos", tier: "free", label: "Diretorio de cursos." },
  { route: "/plataformas", tier: "free", label: "Diretorio de plataformas de estudo." },
  { route: "/faculdades", tier: "free", label: "Diretorio de faculdades." },
  { route: "/eventos", tier: "free", label: "Eventos de tecnologia." },
  { route: "/projetos", tier: "free", label: "Projetos para praticar e portfolio." },
  { route: "/estagio", tier: "free", label: "Vagas de estagio." },
  { route: "/noticias", tier: "free", label: "Noticias de tecnologia." },
  { route: "/comunidades", tier: "free", label: "Comunidades de tecnologia." },
  { route: "/sobre", tier: "free", label: "Sobre o BoraNaTech." },
  { route: "/dicas", tier: "free", label: "Dicas de carreira." },
  { route: "/mulheres", tier: "free", label: "Mulheres na tecnologia." },
  { route: "/dicionario", tier: "free", label: "Dicionario de termos de tecnologia." },
  { route: "/comparador", tier: "free", label: "Comparador de carreiras." },
  { route: "/quiz-carreira", tier: "free", label: "Quiz de carreira." },
  { route: "/perfil", tier: "free", label: "Perfil do usuario." },
  { route: "/perfil/favoritos", tier: "free", label: "Favoritos salvos do usuario." },
  { route: "/perfil/conquistas", tier: "free", label: "Conquistas do usuario." },
  { route: "/estudos/diario", tier: "free", label: "Diario de estudos." },
  // Pagina de assinatura. Publica (qualquer um ve), e o destino dos CTAs do Pro.
  { route: "/planos", tier: "free", label: "Pagina de assinatura do Plano Pro." },
  // Rotas Pro: analise personalizada por IA (server/lib/aiTools.ts requiresPro).
  { route: "/curriculo/analisar", tier: "pro", label: "Analise de curriculo por IA." },
  { route: "/curriculo/gerar", tier: "pro", label: "Geracao de curriculo por IA." },
  { route: "/curriculo/linkedin", tier: "pro", label: "Otimizacao de LinkedIn por IA." },
  { route: "/linkedin/analisar", tier: "pro", label: "Analise de perfil de LinkedIn por IA." },
  { route: "/portfolio/analisar", tier: "pro", label: "Analise de portfolio por IA." },
  { route: "/entrevistas/simulador", tier: "pro", label: "Simulador de entrevista por IA." },
];

export function findRoute(route: string): PlatformRoute | undefined {
  const normalized = route.trim();
  return PLATFORM_ROUTES.find((r) => r.route === normalized);
}
