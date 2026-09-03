// Ids de projeto que deixaram de existir no catalogo e o id que os
// substitui. Nascem da fusao de duplicatas (lote 01b) e existem pra que
// user_progress.item_key, user_bookmarks.resource_id,
// project_validations.project_id e links /projetos/:id antigos continuem
// resolvendo. Alias nunca e removido sem migrar as linhas do banco antes.
//
// O mapa e RASO de proposito: nenhuma chave aparece como valor, entao
// resolveProjectId nunca precisa iterar. aliases.test.ts afirma isso, mais o
// tamanho do conjunto (54) e os dois sentidos contra o catalogo vivo.
export const PROJECT_ID_ALIASES: Record<string, string> = {
  "portfolio-pessoal-html-css": "landing-page-pessoal",
  "calculadora-javascript": "calculadora-js",
  "todo-list-javascript": "todo-list",
  "timer-pomodoro-javascript": "cronometro-pomodoro",
  "jogo-da-memoria": "jogo-memoria-cartas",
  "jogo-da-memoria-javascript": "jogo-memoria-cartas",
  "buscador-cep-javascript": "buscador-cep",
  "dashboard-de-clima": "app-clima-open-meteo",
  "app-de-clima-javascript": "app-clima-open-meteo",
  "blog-estatico-nextjs": "blog-estatico-markdown",
  "design-system-storybook": "storybook-componentes",
  "api-tarefas-nodejs": "api-rest-tarefas",
  "api-autenticacao-jwt": "autenticacao-jwt",
  "encurtador-de-links": "url-shortener-api",
  "encurtador-url-php": "url-shortener-api",
  "chat-realtime-socketio": "chat-sala-websocket",
  "e-commerce-completo-fullstack": "e-commerce-minimo-pagamento-mock",
  "analise-exploratoria-pandas": "analise-dados-publicos",
  "analise-exploratoria-ecommerce": "analise-dados-vendas",
  "dashboard-vendas-executivo": "dashboard-power-bi",
  "previsao-churn-tabular": "modelo-previsao-churn",
  "analise-churn-python": "modelo-previsao-churn",
  "analise-sentimento-tweets": "modelo-ml-sentimentos",
  "pipeline-csv-banco": "pipeline-etl-python",
  "etl-pipeline-python": "pipeline-etl-python",
  "modelagem-dbt-vendas": "modelagem-dimensional-dbt",
  "chatbot-faq-rag": "rag-chat-documentos",
  "assistente-pdf-rag": "assistente-estudos-rag",
  "chatbot-langchain": "chatbot-com-ia",
  "reconhecimento-objetos-yolo": "detector-objetos-yolo",
  "analise-sentimento-avaliacoes": "analise-reviews-produtos",
  "design-system-basico": "design-system-mini",
  "design-system-tokens-multiplos-temas": "design-system-multiplataforma",
  "mapeamento-jornada-usuario": "persona-journey-mapa",
  "mapa-jornada-cliente": "persona-journey-mapa",
  "landing-page-responsiva-figma": "guia-estilo-e-interface-landing-page",
  "redesenho-fluxo-checkout": "fluxo-checkout-otimizado",
  "prd-feature-ia": "prd-feature-nova",
  "roadmap-estrategico-produto": "roadmap-produto-trimestral",
  "framework-priorizacao-escala-global": "priorizacao-rice",
  "analise-metricas-retencao": "metricas-retencao-produto",
  "hipoteses-teste-ab": "experimento-teste-ab-conversao",
  "plano-lancamento-feature": "plano-go-to-market-funcionalidade",
  "pesquisa-discovery": "descoberta-produto-product-discovery",
  "plano-testes-formulario": "plano-testes",
  "plano-testes-e-cenarios": "plano-testes",
  "testes-e2e-cypress": "automacao-login-cypress",
  "testes-e2e-playwright": "playwright-e2e-criticos",
  "automacao-api-postman-newman": "testes-api-postman",
  "performance-jmeter": "teste-carga-k6-api",
  "pipeline-testes-github-actions": "pipeline-ci-cd",
  "terraform-vm-hello": "infraestrutura-como-codigo-terraform",
  "arquitetura-multi-region-aws": "arquitetura-alta-disponibilidade",
  "centralizacao-logs-siem": "siem-domestico-logs",
};

// Id canonico de um id que pode ser alias. Id vivo (ou desconhecido) volta
// igual: a funcao nunca inventa, so traduz o que esta no mapa.
export function resolveProjectId(id: string): string {
  return PROJECT_ID_ALIASES[id] ?? id;
}

// Indice reverso, construido uma vez no load. Sem ele, aliasesOf varreria o
// mapa inteiro a cada chamada, e ele e chamado dentro de rota.
const REVERSO: Record<string, string[]> = {};
for (const [antigo, canonico] of Object.entries(PROJECT_ID_ALIASES)) {
  (REVERSO[canonico] ??= []).push(antigo);
}

// Ids antigos que apontam para este canonico (lista vazia se nenhum).
export function aliasesOf(canonicalId: string): string[] {
  return REVERSO[canonicalId] ?? [];
}

// Colapsa linhas cujo id pode ser alias: reescreve o id para o canonico e
// descarta repeticoes, mantendo a PRIMEIRA ocorrencia de cada canonico na
// ordem recebida. As rotas ordenam por data desc, entao a que fica e a mais
// recente, e a antiga (do id fundido) e a que cai.
export function dedupeByCanonicalId<T>(
  rows: T[],
  getId: (row: T) => string,
  withId: (row: T, canonicalId: string) => T,
): T[] {
  const vistos = new Set<string>();
  const saida: T[] = [];
  for (const row of rows) {
    const canonico = resolveProjectId(getId(row));
    if (vistos.has(canonico)) continue;
    vistos.add(canonico);
    saida.push(canonico === getId(row) ? row : withId(row, canonico));
  }
  return saida;
}
