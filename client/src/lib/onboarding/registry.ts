import type { OnboardingDef } from "./types";

// Mapa ROTA -> onboarding. A chave e o PADRAO de rota do wouter, nao a URL:
// "escopo por rota" foi a decisao, entao /areas/:slug tem UM onboarding, o
// mesmo para qualquer slug.
//
// TODA rota declarada em client/src/App.tsx precisa aparecer aqui, em uma das
// tres formas. `registry.exaustivo.test.ts` le o App.tsx, compara os dois
// conjuntos nos DOIS sentidos e afirma o TOTAL: rota nova sem classificacao
// derruba o teste, e classificacao de rota que nao existe mais tambem.
//
// A ORDEM importa: `resolveRoutePattern` casa na ordem de declaracao, igual ao
// <Switch> do wouter (primeiro que casa vence). O teste afirma que a ordem
// daqui e a mesma do App.tsx, senao /roadmaps/ia cairia em /roadmaps/:slug.

export type RouteOnboarding =
  /** Tem onboarding. `load` e import dinamico: o conteudo fica fora do bundle inicial. */
  | {
      type: "onboarding";
      load: () => Promise<{ default: OnboardingDef }>;
      /**
       * Chave de persistencia, quando ela NAO e o proprio padrao de rota.
       *
       * Serve para duas rotas que sao a mesma pagina compartilharem o "ja vi".
       * Unico caso hoje: /projetos/:id abre o mesmo componente que /projetos,
       * entao quem viu numa viu na outra. Declarado, e nao duplicado em
       * silencio: sem isto seriam dois registros e o onboarding reapareceria
       * ao abrir um projeto.
       */
      storageKey?: string;
    }
  /** Decidido que NAO tera onboarding, com o motivo escrito. */
  | { type: "sem-onboarding"; motivo: string }
  /**
   * Ainda nao portado. Vira 'onboarding' ou 'sem-onboarding' quando alguem
   * decidir. A classificacao PROPOSTA para as 26 de hoje esta em
   * `docs/onboarding-rotas-pendentes.md`, amarrada a este arquivo por
   * `rotasPendentes.test.ts`: classificar uma de verdade obriga a tirar ela do
   * doc no mesmo commit.
   */
  | { type: "pendente" };

const REDIRECT = (para: string): RouteOnboarding => ({
  type: "sem-onboarding",
  // Rota de redirect: nunca renderiza pagina, o wouter troca a location no ato.
  motivo: `redirect para ${para}`,
});

const FLUXO = (detalhe: string): RouteOnboarding => ({
  type: "sem-onboarding",
  // Rota de fluxo: interromper com onboarding atrapalha a tarefa em curso.
  motivo: `rota de fluxo (${detalhe})`,
});

/**
 * Chaves que NAO vem do <Switch> do App.tsx. Hoje so uma: /acesso e servido
 * pelo LaunchGate, ANTES do Router, entao nao existe <Route> para ela. Fica
 * declarada aqui para o host tambem nunca abrir onboarding la.
 */
export const NON_ROUTE_KEYS = ["/acesso"] as const;

/**
 * Numero de <Route> declarados em App.tsx: 95 com `path` + 1 catch-all sem
 * `path` (a chave "*" aqui embaixo). Mesmo contrato de EXPECTED_TABLE_COUNT:
 * mudar este numero e ato deliberado, no commit que cria ou remove a rota.
 */
export const EXPECTED_APP_ROUTE_COUNT = 96;

export const ONBOARDING_REGISTRY: Record<string, RouteOnboarding> = {
  "/": {
    type: "onboarding",
    load: () => import("./steps/home"),
  },
  "/creators": { type: "pendente" },
  "/areas": {
    type: "onboarding",
    load: () => import("./steps/areas"),
  },
  "/areas/:parent/:subarea": { type: "pendente" },
  "/areas/:slug": { type: "pendente" },
  "/tecnologias": {
    type: "onboarding",
    load: () => import("./steps/tecnologias"),
  },
  "/tecnologias/comparar": { type: "pendente" },
  "/tecnologias/por-area": {
    type: "onboarding",
    load: () => import("./steps/tecnologiasMapa"),
  },
  "/tecnologias/mapa": REDIRECT("/tecnologias/por-area"),
  "/tecnologias/ranking": {
    type: "onboarding",
    load: () => import("./steps/tecnologiasRanking"),
  },
  "/tecnologias/jogos": { type: "pendente" },
  "/tecnologias/:slug": { type: "pendente" },
  "/empresas": {
    type: "onboarding",
    load: () => import("./steps/empresas"),
  },
  "/empresas/ranking-junior": { type: "pendente" },
  "/empresas/:slug": { type: "pendente" },
  "/salarios": {
    type: "onboarding",
    load: () => import("./steps/salarios"),
  },
  "/entrevistas": {
    type: "onboarding",
    load: () => import("./steps/entrevistas"),
  },
  "/entrevistas/perguntas": REDIRECT("/entrevistas"),
  "/entrevistas/simulador": REDIRECT("/entrevistas"),
  "/entrevistas/sessao/:id": { type: "pendente" },
  "/entrevistas/desafios": REDIRECT("/entrevistas"),
  "/portfolio": REDIRECT("/portfolio/analisar"),
  "/portfolio/analisar": {
    type: "onboarding",
    load: () => import("./steps/portfolioAnalisar"),
  },
  "/curriculo": REDIRECT("/curriculo/analisar"),
  "/curriculo/analisar": {
    type: "onboarding",
    load: () => import("./steps/curriculoAnalisar"),
  },
  "/curriculo/gerar": {
    type: "onboarding",
    load: () => import("./steps/curriculoGerar"),
  },
  "/curriculo/linkedin": REDIRECT("/linkedin/analisar"),
  "/linkedin/analisar": {
    type: "onboarding",
    load: () => import("./steps/linkedinAnalisar"),
  },
  "/plano-carreira": {
    type: "onboarding",
    load: () => import("./steps/planoCarreira"),
  },
  "/estudos": REDIRECT("/plano-carreira"),
  "/estudos/diario": { type: "pendente" },
  "/empregabilidade": REDIRECT("/entrevistas"),
  "/networking": REDIRECT("/comunidades"),
  "/freelance": REDIRECT("/vagas"),
  "/evolucao": {
    type: "onboarding",
    load: () => import("./steps/evolucao"),
  },
  "/simulador": REDIRECT("/"),
  "/ingles": {
    type: "onboarding",
    load: () => import("./steps/ingles"),
  },
  "/ingles/onde-estudar": { type: "pendente" },
  "/ingles/no-trabalho": { type: "pendente" },
  "/ingles/entrevista": { type: "pendente" },
  "/ingles/vocabulario": { type: "pendente" },
  "/ferramentas": {
    type: "onboarding",
    load: () => import("./steps/ferramentas"),
  },
  "/ia": {
    type: "onboarding",
    load: () => import("./steps/guiaIa"),
  },
  "/mentorias": {
    type: "onboarding",
    load: () => import("./steps/mentorias"),
  },
  "/admin": FLUXO("painel administrativo"),
  "/roadmaps": {
    type: "onboarding",
    load: () => import("./steps/roadmaps"),
  },
  "/roadmaps/ia": {
    type: "onboarding",
    load: () => import("./steps/roadmapIa"),
  },
  "/roadmaps/ia/:slug": { type: "pendente" },
  "/roadmaps/:slug/prova": { type: "pendente" },
  "/roadmaps/:slug": { type: "pendente" },
  "/roadmaps-novo": REDIRECT("/roadmaps"),
  "/roadmaps-novo/:slug": REDIRECT("/roadmaps/:slug"),
  "/cursos": {
    type: "onboarding",
    load: () => import("./steps/cursos"),
  },
  "/plataformas": {
    type: "onboarding",
    load: () => import("./steps/plataformas"),
  },
  "/faculdades/:slug": { type: "pendente" },
  "/faculdades": {
    type: "onboarding",
    load: () => import("./steps/faculdades"),
  },
  "/eventos": {
    type: "onboarding",
    load: () => import("./steps/eventos"),
  },
  "/projetos": {
    type: "onboarding",
    load: () => import("./steps/projetos"),
  },
  "/projetos/:id": {
    type: "onboarding",
    load: () => import("./steps/projetos"),
    // Mesma pagina que /projetos: viu numa, viu na outra.
    storageKey: "/projetos",
  },
  "/vagas": {
    type: "onboarding",
    load: () => import("./steps/vagas"),
  },
  "/estagio/freelance": REDIRECT("/vagas"),
  "/estagio": REDIRECT("/vagas"),
  "/carreiras": REDIRECT("/linkedin/analisar"),
  "/portifolio": REDIRECT("/portfolio"),
  "/noticias": {
    type: "onboarding",
    load: () => import("./steps/noticias"),
  },
  "/comunidades": {
    type: "onboarding",
    load: () => import("./steps/comunidades"),
  },
  "/sobre": {
    type: "onboarding",
    load: () => import("./steps/sobre"),
  },
  "/dicas": {
    type: "onboarding",
    load: () => import("./steps/dicas"),
  },
  "/mulheres": {
    type: "onboarding",
    load: () => import("./steps/mulheres"),
  },
  "/dicionario": {
    type: "onboarding",
    load: () => import("./steps/dicionario"),
  },
  "/comparador": { type: "pendente" },
  "/quiz-carreira/resultado": { type: "pendente" },
  "/quiz-carreira": {
    type: "onboarding",
    load: () => import("./steps/quizCarreira"),
  },
  "/perfil/conquistas": { type: "pendente" },
  "/perfil/favoritos": { type: "pendente" },
  "/perfil": { type: "pendente" },
  "/perguntas-frequentes": { type: "pendente" },
  "/planos/sucesso": FLUXO("pos-pagamento"),
  "/planos": FLUXO("checkout"),
  "/renovar": FLUXO("renovacao por token de e-mail"),
  "/pro/sucesso": REDIRECT("/planos/sucesso"),
  "/pro": REDIRECT("/planos"),
  "/checkout": FLUXO("checkout"),
  "/login": FLUXO("autenticacao"),
  "/cadastro": FLUXO("autenticacao"),
  "/bem-vindo": FLUXO("onboarding proprio da conta, em /bem-vindo"),
  "/recuperar-senha": FLUXO("autenticacao"),
  "/trocar-senha": FLUXO("autenticacao"),
  "/redefinir-senha": FLUXO("autenticacao"),
  "/licenca": FLUXO("documento legal"),
  "/privacidade": FLUXO("documento legal"),
  "/termos-de-uso": FLUXO("documento legal"),
  "/certificados": { type: "pendente" },
  "/certificados/:code": { type: "pendente" },
  "/404": FLUXO("pagina de erro"),
  // Catch-all do App.tsx (<Route component={NotFound} /> sem `path`). Ultimo
  // de proposito: casa qualquer coisa que as anteriores nao pegaram.
  "*": FLUXO("pagina de erro (catch-all)"),

  // --- fora do <Switch>, ver NON_ROUTE_KEYS ---
  "/acesso": FLUXO("portao de lancamento, renderizado pelo LaunchGate"),
};

/**
 * Casa uma URL contra os padroes do registry, na ordem de declaracao.
 *
 * Reimplementa a regra do wouter em vez de importar a dele porque o wouter 3
 * nao exporta matcher publico; a divergencia e travada por teste, que passa
 * por TODAS as rotas do App.tsx com uma URL representativa. Os padroes desta
 * base usam somente segmentos literais e `:param` (nenhum curinga, nenhum
 * opcional), entao a regra e: mesmo numero de segmentos, literal bate literal
 * e `:param` casa qualquer segmento nao vazio.
 *
 * Sempre devolve um padrao: o que nao casa cai no catch-all "*", igual ao
 * <Switch> do App.tsx, que termina com o NotFound sem `path`.
 */
export function resolveRoutePattern(pathname: string): string {
  const url = stripTrailingSlash(pathname).split("/");

  for (const pattern of Object.keys(ONBOARDING_REGISTRY)) {
    // O catch-all nao participa da varredura: ele e o fallback do fim, senao
    // engoliria tudo que vem depois dele na ordem de declaracao (/acesso).
    if (pattern === "*") continue;
    const parts = stripTrailingSlash(pattern).split("/");
    if (parts.length !== url.length) continue;
    const ok = parts.every((part, i) =>
      part.startsWith(":") ? url[i] !== "" : part === url[i],
    );
    if (ok) return pattern;
  }
  return "*";
}

/** Resolve a URL direto para a entrada do registry. */
export function resolveRouteOnboarding(pathname: string): {
  routeKey: string;
  entry: RouteOnboarding;
} | null {
  const pattern = resolveRoutePattern(pathname);
  const entry = ONBOARDING_REGISTRY[pattern];
  if (!entry) return null;
  // `storageKey` quando declarado: e ele que identifica o onboarding para a
  // persistencia, nao o padrao de rota que casou.
  const routeKey =
    entry.type === "onboarding" && entry.storageKey
      ? entry.storageKey
      : pattern;
  return { routeKey, entry };
}

function stripTrailingSlash(value: string): string {
  return value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
}
