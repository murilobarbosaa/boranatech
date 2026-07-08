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
  // Rotas reais do App.tsx que faltavam no mapa (auditoria do agente free).
  // Excluidos de proposito: /admin (administrativo), /404, /dev/* (dev-only) e
  // os redirects (/tecnologias/mapa, /roadmaps-novo, /pro, /pro/sucesso), cujos
  // destinos canonicos ja estao aqui.
  // TODO(Ana): revisar os labels deste bloco de rotas adicionadas.
  { route: "/quiz-carreira/resultado", tier: "free", label: "Resultado do quiz de carreira." },
  { route: "/tecnologias/por-area", tier: "free", label: "Mapa de tecnologias por area." },
  { route: "/tecnologias/ranking", tier: "free", label: "Ranking de tecnologias." },
  { route: "/tecnologias/comparar", tier: "free", label: "Comparador de tecnologias." },
  { route: "/tecnologias/jogos", tier: "free", label: "Jogos para aprender tecnologias." },
  { route: "/empresas/ranking-junior", tier: "free", label: "Ranking de empresas para junior." },
  { route: "/roadmaps/comecar-do-zero", tier: "free", label: "Trilha para comecar do zero." },
  { route: "/roadmaps/linkedin", tier: "free", label: "Trilha de LinkedIn." },
  { route: "/carreiras", tier: "free", label: "Vagas de carreira (aba da pagina de vagas)." },
  { route: "/portifolio", tier: "free", label: "Aba de portfolio da pagina de vagas." },
  { route: "/planos/sucesso", tier: "free", label: "Confirmacao de assinatura concluida." },
  { route: "/checkout", tier: "free", label: "Checkout da assinatura do Plano Pro." },
  { route: "/login", tier: "free", label: "Pagina de login." },
  { route: "/cadastro", tier: "free", label: "Pagina de criacao de conta." },
  { route: "/bem-vindo", tier: "free", label: "Boas-vindas apos criar a conta." },
  { route: "/recuperar-senha", tier: "free", label: "Recuperacao de senha por email." },
  { route: "/trocar-senha", tier: "free", label: "Troca de senha do usuario logado." },
  { route: "/redefinir-senha", tier: "free", label: "Redefinicao de senha via link de email." },
  { route: "/licenca", tier: "free", label: "Licenca do BoraNaTech." },
  { route: "/privacidade", tier: "free", label: "Politica de privacidade." },
  { route: "/termos-de-uso", tier: "free", label: "Termos de uso." },
  // Rotas Pro: analise personalizada por IA (server/lib/aiTools.ts requiresPro).
  { route: "/curriculo/analisar", tier: "pro", label: "Analise de curriculo por IA." },
  { route: "/curriculo/gerar", tier: "pro", label: "Geracao de curriculo por IA." },
  { route: "/curriculo/linkedin", tier: "pro", label: "Otimizacao de LinkedIn por IA." },
  { route: "/linkedin/analisar", tier: "pro", label: "Analise de perfil de LinkedIn por IA." },
  { route: "/portfolio/analisar", tier: "pro", label: "Analise de portfolio por IA com base no GitHub (a analise de GitHub)." },
  { route: "/entrevistas/simulador", tier: "pro", label: "Simulador de entrevista por IA." },
  // TODO(Ana): revisar o label do Roadmap com IA.
  { route: "/roadmaps/ia", tier: "pro", label: "Roadmap com IA: gera uma trilha de estudos sob medida." },
];

// Rotas dinamicas reais do App.tsx (detalhe por slug). O parametro nomeado no
// pattern vira um segmento de slug estrito ([a-z0-9-]{1,64}) na validacao; a
// existencia do CONTEUDO daquele slug nao e garantida pelo casamento (quem
// confirma conteudo e a busca; na duvida, a pagina indice e o caminho seguro).
// TODO(Ana): revisar os labels deste bloco de padroes dinamicos.
export interface PlatformRoutePattern {
  pattern: string;
  tier: AgentTier;
  label: string;
}

export const PLATFORM_ROUTE_PATTERNS: PlatformRoutePattern[] = [
  { pattern: "/areas/:slug", tier: "free", label: "Detalhe de uma area de tecnologia." },
  { pattern: "/areas/:parent/:subarea", tier: "free", label: "Detalhe de uma subarea de tecnologia." },
  { pattern: "/tecnologias/:slug", tier: "free", label: "Detalhe de uma tecnologia." },
  { pattern: "/empresas/:slug", tier: "free", label: "Detalhe de uma empresa de tecnologia." },
  // ANTES de /roadmaps/:slug por clareza; na pratica nao colidem: o slug
  // estrito nao aceita barra, entao /roadmaps/ia/<slug> nunca casa com
  // /roadmaps/:slug (e /roadmaps/ia casa a rota ESTATICA, que tem precedencia).
  // TODO(Ana): revisar o label do detalhe do Roadmap com IA.
  { pattern: "/roadmaps/ia/:slug", tier: "pro", label: "Um roadmap gerado por IA do proprio usuario." },
  { pattern: "/roadmaps/:slug", tier: "free", label: "Trilha de aprendizado especifica." },
  { pattern: "/faculdades/:slug", tier: "free", label: "Detalhe de uma faculdade." },
];

// Segmento de slug estrito: minusculas, digitos e hifen, ate 64 chars. Mantem a
// validacao fail-closed: nada de barra extra, espaco, ponto ou maiuscula.
const SLUG_SEGMENT_SOURCE = "[a-z0-9-]{1,64}";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Deriva a regex segura do pattern: segmentos ":param" viram slug estrito,
// segmentos literais sao escapados. Ancorada em inicio e fim.
function patternToRegex(pattern: string): RegExp {
  const source = pattern
    .split("/")
    .map((segment) =>
      segment.startsWith(":") ? SLUG_SEGMENT_SOURCE : escapeRegex(segment),
    )
    .join("/");
  return new RegExp(`^${source}$`);
}

const COMPILED_PATTERNS = PLATFORM_ROUTE_PATTERNS.map((p) => ({
  ...p,
  regex: patternToRegex(p.pattern),
}));

export interface RouteMatch {
  route: string;
  tier: AgentTier;
  label: string;
  // "static": rota exata do mapa. "pattern": caminho concreto que casou com um
  // padrao dinamico; a base existe, mas o slug nao foi verificado.
  kind: "static" | "pattern";
}

export function findRoute(route: string): PlatformRoute | undefined {
  const normalized = route.trim();
  return PLATFORM_ROUTES.find((r) => r.route === normalized);
}

// Valida um caminho concreto contra as rotas estaticas e depois os padroes
// dinamicos. Estatica tem precedencia (ex.: /tecnologias/ranking casa com a
// rota estatica antes de cair em /tecnologias/:slug). Caminho que nao casa com
// nada retorna undefined (a tool recusa).
export function matchRoute(route: string): RouteMatch | undefined {
  const normalized = route.trim();
  const exact = findRoute(normalized);
  if (exact) {
    return { route: exact.route, tier: exact.tier, label: exact.label, kind: "static" };
  }
  const pattern = COMPILED_PATTERNS.find((p) => p.regex.test(normalized));
  if (pattern) {
    return {
      route: normalized,
      tier: pattern.tier,
      label: pattern.label,
      kind: "pattern",
    };
  }
  return undefined;
}
