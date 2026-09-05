// Catalogo canonico de projetos da plataforma (fonte unica: consumido pela
// pagina /projetos, pelos cards de projeto das trilhas e, a partir da fase
// 5b, tambem pelo server via caminho relativo). Movido de client/src/lib/
// data.ts na Fase 5b; data.ts re-exporta pra compatibilidade.
//
// INVARIANTE: `areaSlug` e SEMPRE uma area-mae, ou seja, um slug de `areasTI`
// (client/src/lib/data.ts) ou o especial `carreira`. Nunca um slug de subarea.
// Subarea vai em `subareaSlug`. O motivo nao e estetico: NextStepsByArea,
// recomendarProjetos e o roadmap com IA filtram por `p.areaSlug === area`, e
// projeto marcado com slug de subarea nunca era recomendado pra quem escolheu
// a area-mae. A garantia esta em client/src/lib/projectAreaGroup.test.ts, que
// afirma o conjunto nos DOIS sentidos (todo areaSlug e area-mae, e nenhum
// areaSlug e slug de subarea de ninguem).
//
// ONDE MORA O QUE: este arquivo e o catalogo LEVE, e entra no chunk
// compartilhado do client (data.ts o reexporta e dezenas de arquivos o
// importam). O detalhe v2 de cada projeto (briefing, etapas, kit, ajuda) vive
// em shared/projects/v2/<id>.ts e carrega sob demanda por loadProjetoV2;
// shared/projects/v2/all.ts importa todos de uma vez e e so para testes e
// server. Bloco v2 dentro deste arquivo custaria mais de 2 MB no bundle de
// todo mundo quando as 266 entradas migrarem.
//
// REGRA DO VIDEO: `ajuda.video` (em shared/projects/v2) e SEMPRE um video real
// (youtube.com/watch ou youtu.be). Busca do YouTube (results?search_query)
// NUNCA entra: a pagina ja gera uma busca sozinha quando nao ha video curado,
// e um link de busca gravado aqui e indistinguivel de curadoria de verdade. O
// guard de shared/projects/v2/v2.test.ts recusa.

// Tier do catalogo de projetos: sem `pro` = gratuito (todos os projetos
// vinculados a trilhas sao gratuitos por design); `pro: true` = desafio
// premium, navegavel por assinantes em /projetos e consumido pelo roadmap
// com IA (fase 5c). Trilha estatica nunca aponta pra projeto pro.
// Requisito estruturado e verificavel num repositorio publico. Por ora
// exclusivo de projetos pro: e o contrato que a validacao via leitor de
// GitHub (fase 5c) confere requisito a requisito.
//
// REGRA PERMANENTE: todo requisito precisa ser verificavel pelas fontes do
// modo validacao (README, arvore de caminhos do repositorio, package.json,
// workflows de .github/workflows e as checagens automaticas). Nada de
// requisito que exija ler codigo ou julgar logica: a prova e sempre um
// artefato observavel (arquivo ou pasta na arvore, dependencia ou script no
// package.json, passo declarado no workflow, secao, print ou link no README).
export type ProjetoRequisito = {
  id: string;
  descricao: string;
  verificacao: string;
};

export type ProjetoCatalogo = {
  id: string;
  nome: string;
  areaSlug: string | null;
  // Subarea de areasTI (client/src/lib/data.ts) a que o projeto pertence,
  // quando pertence a uma. Sempre filha do areaSlug. O areaSlug e SEMPRE a
  // area-mae: consumidores filtram por p.areaSlug === area, e um slug de
  // subarea aqui fazia o projeto sumir das recomendacoes da area.
  subareaSlug?: string;
  nivel: string;
  objetivo: string;
  ferramentas: string[];
  passosSimplificados: string[];
  entregavel: string;
  comoPublicar: string;
  sugestaoLinkedIn: string;
  proximoProjeto: string;
  // Id real do proximo projeto sugerido. `proximoProjeto` (texto livre)
  // segue como fallback de exibicao enquanto nem todo projeto tem id aqui.
  proximoProjetoId?: string;
  pro?: true;
  requisitos?: ProjetoRequisito[];
};

export const projetos: ProjetoCatalogo[] = [
  {
    id: "landing-page-pessoal",
    nome: "Página Pessoal / Portfólio",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Criar uma página pessoal para apresentar quem você é e seus projetos.",
    ferramentas: ["HTML", "CSS", "JavaScript (opcional)"],
    passosSimplificados: [
      "Planeje as seções: header, sobre, projetos, contato",
      "Crie a estrutura HTML",
      "Estilize com CSS (cores, fontes, layout)",
      "Adicione suas informações reais",
      "Publique no GitHub Pages",
    ],
    entregavel: "Site publicado no GitHub Pages com seu nome e projetos.",
    comoPublicar: "GitHub Pages (gratuito) ou Netlify",
    sugestaoLinkedIn:
      "Acabei de criar minha primeira página pessoal com HTML e CSS! Aprendi sobre estrutura semântica, flexbox e como publicar um site gratuitamente. Link nos comentários!",
    proximoProjeto: "Clone de landing page de empresa famosa",
    proximoProjetoId: "clone-landing-one-page",
  },
  {
    id: "todo-list",
    nome: "To-Do List com JavaScript",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    objetivo: "Criar uma lista de tarefas funcional com JavaScript puro.",
    ferramentas: ["HTML", "CSS", "JavaScript"],
    passosSimplificados: [
      "Crie a interface HTML com input e lista",
      "Estilize com CSS",
      "Adicione JavaScript para: adicionar tarefa, marcar como concluída, deletar",
      "Salve as tarefas no localStorage",
      "Publique no GitHub Pages",
    ],
    entregavel: "App de to-do list funcional e publicado.",
    comoPublicar: "GitHub Pages",
    sugestaoLinkedIn:
      "Criei meu primeiro app com JavaScript! Uma lista de tarefas com localStorage. Aprendi manipulação do DOM, eventos e persistência de dados.",
    proximoProjeto: "Calculadora ou buscador de CEP",
    proximoProjetoId: "buscador-cep",
  },
  {
    id: "dashboard-figma",
    nome: "Dashboard no Figma",
    areaSlug: "uxui" as string | null,
    nivel: "Iniciante",
    objetivo: "Criar um dashboard de dados fictícios no Figma.",
    ferramentas: ["Figma"],
    passosSimplificados: [
      "Escolha um tema (vendas, saúde, finanças)",
      "Pesquise referências no Dribbble",
      "Crie o layout com grid",
      "Adicione gráficos, cards e tabelas",
      "Use componentes e auto-layout",
      "Exporte e publique no Behance",
    ],
    entregavel: "Dashboard completo no Figma com protótipo interativo.",
    comoPublicar: "Behance ou LinkedIn com link do Figma",
    sugestaoLinkedIn:
      "Criei meu primeiro dashboard no Figma! Aprendi sobre sistemas de grid, componentes e hierarquia visual. Veja o projeto completo:",
    proximoProjeto: "Redesign de app existente",
  },
  {
    id: "analise-dados-publicos",
    nome: "Análise de Dados Públicos",
    areaSlug: "dados" as string | null,
    nivel: "Intermediário",
    objetivo: "Analisar um dataset público e extrair insights interessantes.",
    ferramentas: ["Python", "Pandas", "Matplotlib", "Jupyter Notebook"],
    passosSimplificados: [
      "Escolha um dataset no Kaggle ou dados.gov.br",
      "Faça análise exploratória (shape, tipos, nulos)",
      "Crie visualizações relevantes",
      "Extraia 3-5 insights principais",
      "Documente no Jupyter Notebook",
      "Publique no GitHub ou Kaggle",
    ],
    entregavel:
      "Notebook Jupyter com análise completa e insights documentados.",
    comoPublicar: "GitHub ou Kaggle Notebooks",
    sugestaoLinkedIn:
      "Fiz minha primeira análise de dados com Python e Pandas! Analisei [tema do dataset] e descobri insights interessantes sobre [insight principal].",
    proximoProjeto: "Dashboard interativo com Streamlit",
  },
  {
    id: "plano-testes",
    nome: "Plano de Testes para App",
    areaSlug: "qa" as string | null,
    subareaSlug: "qa-manual",
    nivel: "Iniciante",
    objetivo: "Criar um plano de testes completo para um aplicativo existente.",
    ferramentas: ["Google Docs ou Notion", "Postman (para APIs)"],
    passosSimplificados: [
      "Escolha um app para testar (ex: app de banco)",
      "Mapeie as funcionalidades principais",
      "Escreva casos de teste para cada funcionalidade",
      "Execute os testes e documente os resultados",
      "Reporte os bugs encontrados",
      "Publique a documentação no GitHub",
    ],
    entregavel: "Documento de plano de testes com casos e relatório de bugs.",
    comoPublicar: "GitHub ou Notion público",
    sugestaoLinkedIn:
      "Criei meu primeiro plano de testes de software! Documentei casos de teste para o app [nome] e encontrei [X] bugs. Aprendi sobre casos de teste, critérios de aceite e relatório de bugs.",
    proximoProjeto: "Automação de testes com Cypress",
  },
  {
    id: "documento-requisitos",
    nome: "Documento de Requisitos",
    areaSlug: "gestao" as string | null,
    nivel: "Intermediário",
    objetivo: "Criar um documento de requisitos para um sistema fictício.",
    ferramentas: ["Notion", "Google Docs", "Figma (para wireframes)"],
    passosSimplificados: [
      "Escolha um sistema para documentar (ex: app de academia)",
      "Defina o público-alvo e personas",
      "Liste os requisitos funcionais e não funcionais",
      "Crie wireframes básicos no Figma",
      "Escreva histórias de usuário",
      "Publique no Notion ou GitHub",
    ],
    entregavel: "Documento de requisitos completo com wireframes.",
    comoPublicar: "Notion público ou GitHub",
    sugestaoLinkedIn:
      "Criei meu primeiro documento de requisitos de software! Documentei um sistema de [tema] com personas, requisitos funcionais e wireframes. Aprendi muito sobre product management.",
    proximoProjeto: "Roadmap de produto e métricas de sucesso",
  },
  {
    id: "primeira-pagina-html",
    nome: "Minha Primeira Página HTML",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Criar uma página simples com título, texto, imagem e link, sem precisar saber programar ainda.",
    ferramentas: ["HTML", "Navegador", "Editor de texto"],
    passosSimplificados: [
      "Crie um arquivo index.html",
      "Adicione título, parágrafo e imagem",
      "Crie um link para seu LinkedIn ou GitHub",
      "Abra no navegador",
      "Anote o que cada tag faz",
    ],
    entregavel: "Página HTML local com estrutura básica e conteúdo pessoal.",
    comoPublicar: "GitHub Pages quando estiver confortável",
    sugestaoLinkedIn:
      "Hoje criei minha primeira página HTML! Ainda é simples, mas entendi a estrutura básica de uma página web.",
    proximoProjeto: "Página pessoal com CSS",
    proximoProjetoId: "landing-page-pessoal",
  },
  {
    id: "glossario-tech",
    nome: "Glossário Tech Pessoal",
    areaSlug: "carreira" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Montar um glossário com termos que você está aprendendo para transformar confusão em repertório.",
    ferramentas: ["Notion", "Google Docs", "Dicionário da plataforma"],
    passosSimplificados: [
      "Escolha 15 termos",
      "Escreva cada definição com suas palavras",
      "Adicione um exemplo de uso",
      "Separe por tema",
      "Compartilhe como post de aprendizado",
    ],
    entregavel: "Documento organizado com termos técnicos explicados por você.",
    comoPublicar: "Notion público, LinkedIn ou README no GitHub",
    sugestaoLinkedIn:
      "Montei meu primeiro glossário tech com termos que estou aprendendo. Escrever com minhas palavras me ajudou muito a fixar.",
    proximoProjeto: "README de estudos",
  },
  {
    id: "calculadora-js",
    nome: "Calculadora com JavaScript",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Criar uma calculadora simples para praticar eventos, funções e manipulação do DOM.",
    ferramentas: ["HTML", "CSS", "JavaScript"],
    passosSimplificados: [
      "Desenhe os botões em HTML",
      "Estilize a interface",
      "Capture cliques com JavaScript",
      "Calcule operações básicas",
      "Trate erros simples",
    ],
    entregavel: "Calculadora funcional publicada.",
    comoPublicar: "GitHub Pages ou Netlify",
    sugestaoLinkedIn:
      "Criei uma calculadora com JavaScript e pratiquei eventos, funções e manipulação do DOM.",
    proximoProjeto: "Buscador de CEP",
    proximoProjetoId: "buscador-cep",
  },
  {
    id: "buscador-cep",
    nome: "Buscador de CEP com API",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Consumir uma API pública e mostrar dados de endereço a partir de um CEP.",
    ferramentas: ["HTML", "CSS", "JavaScript", "API ViaCEP"],
    passosSimplificados: [
      "Crie um formulário de busca",
      "Valide o CEP digitado",
      "Faça uma requisição para a API",
      "Mostre endereço na tela",
      "Crie estados de carregamento e erro",
    ],
    entregavel: "Aplicação que consulta e exibe dados reais de CEP.",
    comoPublicar: "Vercel, Netlify ou GitHub Pages",
    sugestaoLinkedIn:
      "Criei um buscador de CEP consumindo API pública. Aprendi sobre fetch, estados de erro e validação.",
    proximoProjeto: "Dashboard com dados externos",
  },
  {
    id: "api-habitos",
    nome: "API de Hábitos",
    areaSlug: "backend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar uma API simples para cadastrar hábitos, listar registros e marcar progresso diário.",
    ferramentas: ["Node.js", "Express", "SQLite ou PostgreSQL", "Postman"],
    passosSimplificados: [
      "Modele hábitos e registros",
      "Crie rotas CRUD",
      "Valide dados de entrada",
      "Teste no Postman",
      "Documente endpoints no README",
    ],
    entregavel: "API documentada com rotas funcionais.",
    comoPublicar: "Render, Railway ou repositório GitHub",
    sugestaoLinkedIn:
      "Desenvolvi uma API de hábitos para praticar rotas, banco de dados e documentação de endpoints.",
    proximoProjeto: "Autenticação e dashboard",
  },
  {
    id: "app-fullstack-estudos",
    nome: "App Full Stack de Estudos",
    areaSlug: "fullstack" as string | null,
    nivel: "Avançado",
    objetivo:
      "Construir um app completo com login, banco de dados, dashboard e deploy.",
    ferramentas: ["React", "Node.js", "PostgreSQL", "Autenticação", "Deploy"],
    passosSimplificados: [
      "Defina usuários, conteúdos e progresso",
      "Crie autenticação",
      "Construa API e banco",
      "Desenvolva dashboard no front-end",
      "Faça deploy e documente decisões",
    ],
    entregavel: "Aplicação full stack publicada com README completo.",
    comoPublicar: "Vercel + Render/Railway/Supabase",
    sugestaoLinkedIn:
      "Publiquei meu primeiro app full stack com autenticação, banco e dashboard. Documentei arquitetura, decisões e próximos passos.",
    proximoProjeto: "Testes automatizados e observabilidade",
  },
  {
    id: "pipeline-ci-cd",
    nome: "Pipeline CI/CD para Projeto",
    areaSlug: "devops" as string | null,
    nivel: "Avançado",
    objetivo:
      "Automatizar checagens, testes e build de um projeto usando pipeline de integração contínua.",
    ferramentas: ["GitHub Actions", "Node.js", "Testes", "Deploy"],
    passosSimplificados: [
      "Escolha um projeto existente",
      "Configure workflow de lint e testes",
      "Adicione build automático",
      "Proteja variáveis sensíveis",
      "Documente o fluxo de entrega",
    ],
    entregavel: "Repositório com pipeline CI/CD rodando a cada push.",
    comoPublicar: "GitHub Actions",
    sugestaoLinkedIn:
      "Configurei um pipeline CI/CD para automatizar testes e build. Aprendi sobre qualidade e entrega contínua.",
    proximoProjeto: "Deploy automatizado em produção",
  },
  {
    id: "modelo-ml-sentimentos",
    nome: "Modelo de Análise de Sentimentos",
    areaSlug: "dados" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Treinar ou usar um modelo para classificar sentimentos em textos curtos.",
    ferramentas: ["Python", "Pandas", "Scikit-learn", "Notebook"],
    passosSimplificados: [
      "Escolha um dataset de textos",
      "Limpe e prepare os dados",
      "Treine um modelo simples",
      "Avalie resultados",
      "Explique limitações e próximos passos",
    ],
    entregavel: "Notebook com modelo, métricas e explicação clara.",
    comoPublicar: "GitHub ou Kaggle",
    sugestaoLinkedIn:
      "Criei um modelo de análise de sentimentos e documentei dados, métricas e limitações. Foi meu primeiro projeto mais avançado em IA.",
    proximoProjeto: "API para servir o modelo",
  },
  {
    id: "readme-primeiro-repo",
    nome: "README que explica um projeto",
    areaSlug: "carreira" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Aprender a documentar um repositório para recrutadores e colegas entenderem seu trabalho.",
    ferramentas: ["Markdown", "GitHub", "Editor de texto"],
    passosSimplificados: [
      "Crie um repositório vazio",
      "Escreva o que o projeto faz",
      "Liste tecnologias e como rodar",
      "Adicione screenshots ou GIF",
      "Publique e peça feedback",
    ],
    entregavel: "Repositório com README claro em português ou inglês.",
    comoPublicar: "GitHub",
    sugestaoLinkedIn:
      "Escrevi meu primeiro README de projeto do zero: objetivo do app, como rodar e o que aprendi.",
    proximoProjeto: "Página pessoal com link para o repositório",
    proximoProjetoId: "landing-page-pessoal",
  },
  {
    id: "clone-landing-one-page",
    nome: "Clone de landing page famosa",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Reproduzir visual e layout de uma landing conhecida para treinar HTML, CSS e detalhamento.",
    ferramentas: ["HTML", "CSS", "Figma ou inspetor do navegador"],
    passosSimplificados: [
      "Escolha uma página simples",
      "Recorte seções (hero, cards, footer)",
      "Use flexbox/grid",
      "Ajuste tipografia e cores",
      "Compare pixel a pixel",
    ],
    entregavel: "Página estática responsiva publicada.",
    comoPublicar: "GitHub Pages ou Netlify",
    sugestaoLinkedIn:
      "Clonei uma landing de referência só com HTML/CSS para treinar layout e atenção a detalhe.",
    proximoProjeto: "Adicione animações leves com CSS ou JavaScript",
  },
  {
    id: "cronometro-pomodoro",
    nome: "Cronômetro Pomodoro",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Criar timer de foco com intervalos curtos para praticar estado, timers e UX simples.",
    ferramentas: ["HTML", "CSS", "JavaScript"],
    passosSimplificados: [
      "Defina 25 min foco e 5 min pausa",
      "Implemente play/pause/reset",
      "Mostre progresso visual",
      "Opcional: som ao terminar",
      "Publique",
    ],
    entregavel: "Timer funcional e acessível no teclado.",
    comoPublicar: "GitHub Pages",
    sugestaoLinkedIn:
      "Fiz um Pomodoro em JS para estudar timers, eventos e feedback visual na tela.",
    proximoProjeto: "To-do list integrada ao cronômetro",
  },
  {
    id: "jogo-memoria-cartas",
    nome: "Jogo da memória com cartas",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Implementar lógica de jogo, embaralhamento e comparação de pares.",
    ferramentas: ["HTML", "CSS", "JavaScript"],
    passosSimplificados: [
      "Crie grid de cartas viradas",
      "Embaralhe pares de símbolos",
      "Ao clicar, vire e compare",
      "Conte tentativas e vitória",
      "Estilize com tema livre",
    ],
    entregavel: "Jogo completo no navegador.",
    comoPublicar: "GitHub Pages",
    sugestaoLinkedIn:
      "Desenvolvi um jogo da memória: embaralhamento, estado das cartas e contagem de jogadas.",
    proximoProjeto: "Ranking local com localStorage",
  },
  {
    id: "app-clima-open-meteo",
    nome: "App de clima com API pública",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Consumir API de clima, geolocalização (opcional) e exibir previsão amigável.",
    ferramentas: ["JavaScript ou React", "Open-Meteo ou similar", "CSS"],
    passosSimplificados: [
      "Busque cidade ou use coords",
      "Chame API com fetch",
      "Trate erros e loading",
      "Mostre ícones ou emojis",
      "Responsivo",
    ],
    entregavel: "App de clima com UX de carregamento e erro.",
    comoPublicar: "Vercel ou Netlify",
    sugestaoLinkedIn:
      "Integrei API de clima com tratamento de rede, loading e estados de erro, ótimo treino de async.",
    proximoProjeto: "Salvar cidades favoritas",
  },
  {
    id: "blog-estatico-markdown",
    nome: "Blog estático com Markdown",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Publicar artigos em Markdown gerando HTML estático ou com framework leve.",
    ferramentas: ["Markdown", "Astro, Eleventy ou Vite + MD"],
    passosSimplificados: [
      "Defina estrutura de posts",
      "Crie um layout base",
      "Adicione 2-3 posts reais sobre o que estudou",
      "Configure deploy",
      "Open Graph básico",
    ],
    entregavel: "Site de blog ao vivo com pelo menos três posts.",
    comoPublicar: "GitHub Pages, Netlify ou Vercel",
    sugestaoLinkedIn:
      "Montei um blog estático em Markdown para documentar aprendizados e praticar deploy.",
    proximoProjeto: "RSS e página sobre",
  },
  {
    id: "cli-tarefas-terminal",
    nome: "CLI de tarefas no terminal",
    areaSlug: "backend" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Criar ferramenta de linha de comando para adicionar/listar tarefas sem interface gráfica.",
    ferramentas: ["Node.js ou Python", "Arquivo JSON local"],
    passosSimplificados: [
      "Parse argumentos (add, list, done)",
      "Persista em JSON",
      "Validações mínimas",
      "README com exemplos",
      "Publique no GitHub",
    ],
    entregavel: "Executável documentado via `node` ou `python`.",
    comoPublicar: "Repositório GitHub + releases opcional",
    sugestaoLinkedIn:
      "Primeira CLI: parse de args, persistência em arquivo e boa experiência no README.",
    proximoProjeto: "Migrar persistência para SQLite",
  },
  {
    id: "url-shortener-api",
    nome: "Encurtador de URLs (API)",
    areaSlug: "backend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Gerar slugs curtos, redirecionar e contar cliques com banco simples.",
    ferramentas: [
      "Node.js ou Go",
      "PostgreSQL ou Redis",
      "Express ou framework leve",
    ],
    passosSimplificados: [
      "POST cria URL + slug",
      "GET redireciona",
      "Evite colisão de slugs",
      "Métricas básicas",
      "Documente com OpenAPI ou README",
    ],
    entregavel: "API com exemplos curl e deploy.",
    comoPublicar: "Railway, Render ou Fly.io",
    sugestaoLinkedIn:
      "API de encurtador: geração de slug, redirect 302 e persistência, papo reto de back-end.",
    proximoProjeto: "Rate limit e autenticação admin",
  },
  {
    id: "e-commerce-minimo-pagamento-mock",
    nome: "Checkout fictício com carrinho",
    areaSlug: "fullstack" as string | null,
    nivel: "Avançado",
    objetivo:
      "Simular fluxo de carrinho, pedidos e pagamento mockado com regras de estoque.",
    ferramentas: ["React ou Next.js", "API própria", "Banco relacional"],
    passosSimplificados: [
      "Catálogo e carrinho no front",
      "Pedidos no back com transação",
      "Webhook ou status de pagamento simulado",
      "Painel admin simples",
      "Testes em rotas críticas",
    ],
    entregavel: "Demo gravada ou deploy com fluxo ponta a ponta.",
    comoPublicar: "Vercel + serviço de API",
    sugestaoLinkedIn:
      "Projeto full stack de checkout fictício: carrinho, pedido, estoque e caminho de pagamento simulado.",
    proximoProjeto: "Observabilidade e filas para pedidos",
  },
  {
    id: "persona-journey-mapa",
    nome: "Persona + mapa de jornada",
    areaSlug: "uxui" as string | null,
    subareaSlug: "ux-design",
    nivel: "Iniciante",
    objetivo:
      "Representar uma pessoa usuária fictícia e sua jornada em um serviço digital.",
    ferramentas: ["Figma", "Miro ou papel digital"],
    passosSimplificados: [
      "Defina contexto do produto",
      "Crie persona com dores e objetivos",
      "Desenhe jornada com etapas e emoções",
      "Liste oportunidades de melhoria",
      "Exporte PDF ou link",
    ],
    entregavel: "Board com persona e jornada visual.",
    comoPublicar: "Figma community ou Behance",
    sugestaoLinkedIn:
      "Documentei persona e jornada do usuário para treinar empatia e síntese em UX.",
    proximoProjeto: "Teste de usabilidade remoto simples",
  },
  {
    id: "design-system-mini",
    nome: "Mini design system no Figma",
    areaSlug: "uxui" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Definir tokens de cor, tipo, espaçamento e componentes reutilizáveis.",
    ferramentas: ["Figma", "Variáveis e componentes"],
    passosSimplificados: [
      "Paleta e tipografia",
      "Escala de espaçamento",
      "Botão, input, card como componentes",
      "Documentação em página",
      "Modo claro/escuro opcional",
    ],
    entregavel: "Biblioteca Figma exportável.",
    comoPublicar: "Link público Figma",
    sugestaoLinkedIn:
      "Criei um mini design system: tokens, componentes e doc para manter consistência.",
    proximoProjeto: "Handoff com specs para dev",
  },
  {
    id: "formulario-pesquisa-usuario",
    nome: "Formulário de pesquisa com análise",
    areaSlug: "dados" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Coletar respostas fictícias ou reais (amigos) e resumir em gráficos.",
    ferramentas: ["Google Forms ou Tally", "Python", "Pandas", "Matplotlib"],
    passosSimplificados: [
      "Monte 8-12 perguntas claras",
      "Exporte CSV",
      "Limpe e categorize texto curto",
      "Gráficos de barras e pizza",
      "Conclusões em 3 bullets",
    ],
    entregavel: "Notebook ou relatório com gráficos.",
    comoPublicar: "GitHub",
    sugestaoLinkedIn:
      "Do Google Forms ao gráfico: limpei CSV, explorei distribuições e escrevi insights.",
    proximoProjeto: "Dashboard Streamlit com os mesmos dados",
  },
  {
    id: "metricas-produto-north-star",
    nome: "Definir métricas e hipóteses de produto",
    areaSlug: "gestao" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Para um app fictício, escolher north star, métrias de entrada e experimentos.",
    ferramentas: ["Notion", "Planilha"],
    passosSimplificados: [
      "Descreva problema e público",
      "Escolha uma north star defensável",
      "Defina 3-5 métricas de acompanhamento",
      "Liste 3 hipóteses testáveis",
      "Mock de dashboard",
    ],
    entregavel: "Documento de 2-4 páginas com hipóteses claras.",
    comoPublicar: "Notion público",
    sugestaoLinkedIn:
      "Exercício de PM: north star, métricas e hipóteses para um produto imaginário, raciocínio explícito.",
    proximoProjeto: "Roadmap trimestral alinhado às métricas",
  },
  {
    id: "app-notas-react-native-expo",
    nome: "App de notas rápidas (mobile)",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Lista local de notas com criar/editar/apagar em React Native ou Expo.",
    ferramentas: ["Expo", "React Native", "AsyncStorage"],
    passosSimplificados: [
      "Tela de lista e formulário",
      "Persistência local",
      "Feedback ao salvar",
      "Ícones e tema simples",
      "Build de preview",
    ],
    entregavel: "APK ou link Expo Go com instruções.",
    comoPublicar: "Expo EAS ou APK debug",
    sugestaoLinkedIn:
      "Meu primeiro app mobile: notas com AsyncStorage, navegação e UI nativa básica.",
    proximoProjeto: "Sincronizar com API",
  },
  {
    id: "relatorio-seguranca-app",
    nome: "Checklist de segurança em app web",
    areaSlug: "qa" as string | null,
    nivel: "Avançado",
    objetivo:
      "Revisar headers, cookies, formulários e fluxo auth de um app público (responsável).",
    ferramentas: ["Navegador", "OWASP checklist resumido", "Documento"],
    passosSimplificados: [
      "Escopo somente em ambiente permitido",
      "Checagem de HTTPS e cookies",
      "Teste de validação em forms",
      "Notas sobre CSRF/XSS em alto nível",
      "Relatório priorizado",
    ],
    entregavel: "PDF ou markdown com severidade e recomendações.",
    comoPublicar: "GitHub privado ou portfólio redigido",
    sugestaoLinkedIn:
      "Relatório de revisão de segurança (escopo controlado): headers, sessão e validações com priorização.",
    proximoProjeto: "Automatizar scan leve no CI",
  },
  {
    id: "ranking-filmes-tmdb",
    nome: "Explorador de filmes com TMDB",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Listar filmes populares, buscar por título e mostrar detalhes usando API do The Movie Database.",
    ferramentas: ["JavaScript ou React", "API TMDB", "CSS"],
    passosSimplificados: [
      "Cadastro de chave TMDB",
      "Lista com paginação ou scroll",
      "Busca debounced",
      "Página de detalhe",
      "Tratamento de limite de API",
    ],
    entregavel: "App fluido com loading skeleton opcional.",
    comoPublicar: "Netlify/Vercel (chave em env)",
    sugestaoLinkedIn:
      "Consumi a API do TMDB com busca, lista e detalhes, prática real de chave e rate limit.",
    proximoProjeto: "Favoritos persistidos",
  },
  {
    id: "rag-chat-documentos",
    nome: "Assistente que responde com seus documentos (RAG)",
    areaSlug: "ia" as string | null,
    nivel: "Avançado",
    objetivo:
      "Montar busca semântica em PDFs ou artigos e gerar respostas baseadas só no que está nos arquivos, habilidade muito pedida em vagas de produto com IA.",
    ferramentas: [
      "Python ou TypeScript",
      "Embeddings (API ou modelo local)",
      "Vector store (ex.: Chroma, pgvector)",
      "LLM via API",
    ],
    passosSimplificados: [
      "Corte textos em chunks com sobreposição",
      "Gere embeddings e armazene",
      "Na pergunta, busque trechos parecidos",
      "Monte prompt só com trechos recuperados",
      "Cite trechos e trate 'não sei' quando faltar contexto",
    ],
    entregavel:
      "Repositório com demo em vídeo ou notebook reprodutível (API key em .env.example).",
    comoPublicar: "GitHub + Hugging Face Space ou Streamlit opcional",
    sugestaoLinkedIn:
      "Implementei RAG do zero: chunking, embeddings, vector store e respostas ancoradas em documentos, alinhado ao que empresas querem em IA aplicada.",
    proximoProjeto: "Painel para upload de arquivos e métricas de uso",
  },
  {
    id: "saas-next-stripe",
    nome: "Mini-SaaS com Next.js, auth e Stripe (modo teste)",
    areaSlug: "fullstack" as string | null,
    nivel: "Avançado",
    objetivo:
      "Reproduzir o núcleo de um produto digital: login, área logada, plano pago e webhook de pagamento, combinação recorrente em vagas full stack e startups.",
    ferramentas: [
      "Next.js (App Router)",
      "Auth (NextAuth, Clerk ou Supabase Auth)",
      "Stripe em modo teste",
      "PostgreSQL",
    ],
    passosSimplificados: [
      "Landing + CTA de cadastro",
      "Proteja rotas e perfil",
      "Checkout Stripe test + customer portal opcional",
      "Webhook marca assinatura ativa no banco",
      "README com diagrama simples do fluxo",
    ],
    entregavel:
      "Deploy com variáveis de ambiente documentadas e fluxo gravado em vídeo curto.",
    comoPublicar: "Vercel + Neon/Supabase/Railway",
    sugestaoLinkedIn:
      "Subi um mini-SaaS: auth, checkout Stripe em test e webhook. Mostrei que entendo produto, pagamentos e deploy moderno.",
    proximoProjeto: "Métricas de conversão e e-mail transacional",
  },
  {
    id: "crud-supabase-react",
    nome: "CRUD com Supabase + React",
    areaSlug: "fullstack" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Usar BaaS real (auth opcional, tabelas, políticas RLS) no front, stack muito comum nos últimos anos para MVPs e vagas júnior/pleno.",
    ferramentas: [
      "React ou Next.js",
      "Supabase (Postgres + API)",
      "Tailwind opcional",
    ],
    passosSimplificados: [
      "Modele 1 a 2 tabelas",
      "Configure Row Level Security básica",
      "Lista, cria, edita, apaga no client",
      "Trate loading/erro",
      "Explique no README o modelo de dados",
    ],
    entregavel: "App ao vivo com seed SQL no repositório.",
    comoPublicar: "Vercel + projeto Supabase",
    sugestaoLinkedIn:
      "CRUD completo com Supabase: modelo no Postgres, RLS e UI em React, stack que aparece o tempo todo em vagas.",
    proximoProjeto: "Upload de arquivo no Storage + metadados na tabela",
  },
  {
    id: "chat-sala-websocket",
    nome: "Sala de chat em tempo real (WebSocket)",
    areaSlug: "backend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Construir comunicação tempo real, conceito central em notificações, colaboração e jogos, ótimo para diferenciar o portfólio de back-end.",
    ferramentas: [
      "Node.js + ws ou Socket.io",
      "React ou HTML simples no cliente",
      "Redis opcional para escalar",
    ],
    passosSimplificados: [
      "Servidor mantém salas ou IDs",
      "Cliente conecta e envia mensagens",
      "Broadcast para participantes",
      "Reconexão e nickname simples",
      "Limite de taxa básico anti-spam",
    ],
    entregavel: "Repositório com instrução para rodar local e demo deployada.",
    comoPublicar: "Fly.io, Render ou Railway",
    sugestaoLinkedIn:
      "Implementei chat com WebSocket: salas, broadcast e tratamento de queda de conexão, projeto que costuma impressionar em entrevistas de back-end.",
    proximoProjeto: "Persistência de mensagens em Postgres",
  },
  {
    id: "api-prisma-postgres",
    nome: "API REST com Prisma e PostgreSQL",
    areaSlug: "backend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Dominar ORM moderno, migrações e tipagem, pedido explícito em muitas vagas Node/TypeScript.",
    ferramentas: [
      "Node.js",
      "TypeScript",
      "Prisma",
      "PostgreSQL",
      "Express ou Fastify",
    ],
    passosSimplificados: [
      "Schema e primeira migration",
      "CRUD com validação (Zod)",
      "Tratamento de erros HTTP consistente",
      "Seeds para dados de demo",
      "OpenAPI ou tabela de rotas no README",
    ],
    entregavel:
      "API containerizada ou com script `docker compose up` para o banco.",
    comoPublicar: "Railway, Render ou Fly.io",
    sugestaoLinkedIn:
      "API em TypeScript com Prisma: migrações, relacionamentos e validação. Espelha o dia a dia de times que usam Node corporativo.",
    proximoProjeto: "Adicionar filas ou cache Redis",
  },
  {
    id: "graphql-api-apollo",
    nome: "API GraphQL (consultas e mutações)",
    areaSlug: "backend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Expor um domínio via GraphQL com schema claro, skill valorizada em empresas de produto e ecossistemas móveis.",
    ferramentas: [
      "Node.js",
      "Apollo Server ou Mercurius",
      "TypeScript",
      "SQLite ou Postgres",
    ],
    passosSimplificados: [
      "Defina tipos, queries e mutations",
      "Resolvers com validação",
      "Trate N+1 com DataLoader ou estratégia simples",
      "Playground ou Apollo Sandbox documentado",
      "1 a 2 exemplos de query no README",
    ],
    entregavel: "Servidor publicado ou Docker com schema exportado.",
    comoPublicar: "Render/Railway",
    sugestaoLinkedIn:
      "Modelei um domínio em GraphQL com mutations, queries e cuidado com performance. Mostra versatilidade além de REST.",
    proximoProjeto: "Subscriptions em tempo real",
  },
  {
    id: "oauth-login-social",
    nome: "Login social (OAuth 2.0 / OpenID)",
    areaSlug: "backend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Implementar fluxo Authorization Code com provedor (GitHub ou Google) e sessão/JWT, requisito frequente em sistemas reais.",
    ferramentas: [
      "Node.js ou framework equivalente",
      "OAuth app no provedor",
      "Cookies seguros ou JWT",
    ],
    passosSimplificados: [
      "Registrar app e callback URL",
      "Rota de login redireciona ao provedor",
      "Troca code por token no servidor",
      "Crie sessão ou JWT",
      "Documente variáveis e fluxo no README",
    ],
    entregavel:
      "Demo com usuário de teste e checklist de segurança (HTTPS, state CSRF).",
    comoPublicar: "Servidor em cloud + front estático",
    sugestaoLinkedIn:
      "Implementei OAuth2 com GitHub/Google no servidor: fluxo seguro, tokens só no back e sessão para o cliente.",
    proximoProjeto: "Refresh token e logout em todos os dispositivos",
  },
  {
    id: "docker-compose-fullstack",
    nome: "Ambiente local com Docker Compose (API + banco + front)",
    areaSlug: "devops" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Empacotar stack completa para `docker compose up`, esperado em times que prezam onboarding e paridade com produção.",
    ferramentas: [
      "Docker",
      "Docker Compose",
      "Seu app full stack existente ou mínimo novo",
    ],
    passosSimplificados: [
      "Dockerfile multi-stage para API e front",
      "Serviço Postgres com volume",
      "Rede interna e variáveis",
      "Healthcheck e ordem de subida",
      "README com comandos e troubleshooting",
    ],
    entregavel: "Repo que sobe tudo com um comando documentado.",
    comoPublicar: "GitHub (execução local é o foco)",
    sugestaoLinkedIn:
      "Containerizei API, front e Postgres com Compose, onboarding de um comando só, padrão que devs sênior cobram em code review.",
    proximoProjeto: "GitHub Action que roda integração contra Compose",
  },
  {
    id: "playwright-e2e-criticos",
    nome: "Testes E2E críticos com Playwright",
    areaSlug: "qa" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Automatizar jornadas que não podem quebrar (login, checkout feliz, criação de registro). Playwright é referência atual em vagas de QA e eng com qualidade.",
    ferramentas: [
      "Playwright",
      "TypeScript",
      "Projeto web seu ou open source permitido",
    ],
    passosSimplificados: [
      "Escolha 3 fluxos de alto valor",
      "Dados de teste isolados",
      "Asserts estáveis (roles, testids)",
      "Rodada em CI",
      "Relatório de falhas anexado",
    ],
    entregavel: "Repositório com `npm run test:e2e` e workflow GitHub Actions.",
    comoPublicar: "GitHub Actions",
    sugestaoLinkedIn:
      "Cobrei fluxos críticos com Playwright em CI: menos regressão manual e linguagem alinhada ao mercado de QA automation.",
    proximoProjeto: "Testes visuais ou paralelização por shard",
  },
  {
    id: "storybook-componentes",
    nome: "Biblioteca de componentes com Storybook",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Documentar componentes isolados, estados e acessibilidade, comum em design systems e vagas front React.",
    ferramentas: [
      "React",
      "Storybook 8+",
      "Tailwind ou CSS modules",
      "addon a11y opcional",
    ],
    passosSimplificados: [
      "Extraia 3 a 6 componentes reutilizáveis",
      "Stories para variantes e estados de erro",
      "Controles e documentação MDX breve",
      "Verifique contraste e roles básicos",
      "Publique em Chromatic ou estático",
    ],
    entregavel: "Storybook buildado em pasta ou URL pública.",
    comoPublicar: "GitHub Pages ou Chromatic",
    sugestaoLinkedIn:
      "Publiquei Storybook com componentes documentados e checagens de acessibilidade. Mostra maturidade de front em time grande.",
    proximoProjeto: "Integrar tokens de design do Figma",
  },
  {
    id: "kanban-dnd-kit",
    nome: "Quadro Kanban com arrastar e soltar",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Treinar estado complexo, performance e UX de drag-and-drop, tipo de interação cobrada em ferramentas de produto e gestão.",
    ferramentas: ["React", "dnd-kit ou similar", "TypeScript"],
    passosSimplificados: [
      "Colunas e cartões",
      "Persistência em localStorage ou API",
      "Animações leves",
      "Teclado e foco acessível",
      "README com GIF do comportamento",
    ],
    entregavel: "App deployado com persistência mínima.",
    comoPublicar: "Vercel/Netlify",
    sugestaoLinkedIn:
      "Kanban com drag-and-drop acessível e estado persistente, projeto que mostra domínio de React além de CRUD simples.",
    proximoProjeto: "Colaboração em tempo real no mesmo quadro",
  },
  {
    id: "dashboard-streamlit-produto",
    nome: "Dashboard executivo de produto (Streamlit)",
    areaSlug: "dados" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Entregar painel interativo para ‘stakeholders’, formato pedido para cases de dados em negócios e produto.",
    ferramentas: ["Python", "Streamlit", "Pandas", "CSV ou API mock"],
    passosSimplificados: [
      "KPIs: retenção, conversão ou uso simulado",
      "Filtros por período e coorte simples",
      "Texto explicando o ‘so what’",
      "Deploy no Streamlit Community Cloud",
      "Código organizado em módulos",
    ],
    entregavel: "URL pública do app com dados fictícios bem explicados.",
    comoPublicar: "Streamlit Community Cloud",
    sugestaoLinkedIn:
      "Dashboard em Streamlit com narrativa de negócio. Pratiquei traduzir número em decisão, skill que diferencia analistas.",
    proximoProjeto: "Conectar a Postgres ou BigQuery de teste",
  },
  {
    id: "n8n-automacao-workflow",
    nome: "Automação de processo com n8n (ou Make)",
    areaSlug: "backend" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Integrar sistemas sem código pesado, competência crescente em operações, growth e squads enxutos.",
    ferramentas: [
      "n8n self-host ou cloud trial",
      "Webhooks",
      "Google Sheets ou Notion API",
    ],
    passosSimplificados: [
      "Defina gatilho (form, webhook, planilha)",
      "Transforme e valide payload",
      "Ação final (Slack, e-mail, DB)",
      "Trate erro com retry/notificação",
      "Export JSON do workflow no repo",
    ],
    entregavel: "README com diagrama do fluxo e print/vídeo.",
    comoPublicar: "GitHub com cópia do workflow",
    sugestaoLinkedIn:
      "Automatizei um processo ponta a ponta com n8n: webhooks, transformação e integração, habilidade pedida em ops e produto técnicos.",
    proximoProjeto: "Filas e idempotência no mesmo fluxo",
  },
  {
    id: "conversor-de-moedas",
    nome: "Conversor de Moedas",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Criar um conversor que mostra o valor de uma moeda em outra usando cotação real de uma API pública.",
    ferramentas: ["HTML", "CSS", "JavaScript", "fetch", "API de câmbio"],
    passosSimplificados: [
      "Monte o formulário: valor, moeda de origem e moeda de destino",
      "Busque as cotações em uma API pública de câmbio com fetch",
      "Calcule a conversão com a taxa retornada",
      "Mostre o resultado formatado em moeda",
      "Trate erros (sem internet, valor inválido) e publique",
    ],
    entregavel: "Página publicada que converte moedas com cotação real.",
    comoPublicar: "GitHub Pages (gratuito) ou Netlify",
    sugestaoLinkedIn:
      "Construí um conversor de moedas consumindo uma API de câmbio real! Pratiquei fetch, async/await e formatação de moeda em JavaScript. Link nos comentários!",
    proximoProjeto: "Dashboard de Clima",
    proximoProjetoId: "app-clima-open-meteo",
  },
  {
    id: "app-notas-markdown",
    nome: "App de Notas com Markdown",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar um app de anotações que aceita Markdown e salva as notas no navegador.",
    ferramentas: ["React", "JavaScript", "Markdown", "LocalStorage"],
    passosSimplificados: [
      "Crie a lista de notas e o editor de texto",
      "Renderize o Markdown digitado em tempo real",
      "Salve e carregue as notas do LocalStorage",
      "Permita criar, editar e excluir notas",
      "Estilize e publique",
    ],
    entregavel: "App de notas com Markdown que persiste no navegador.",
    comoPublicar: "Vercel ou Netlify",
    sugestaoLinkedIn:
      "Construí um app de notas com suporte a Markdown e persistência no navegador usando React! Pratiquei estado, efeitos e LocalStorage. Link nos comentários!",
    proximoProjeto: "API REST de Tarefas",
    proximoProjetoId: "api-rest-tarefas",
  },
  {
    id: "galeria-fotos-busca",
    nome: "Galeria de Fotos com Busca",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Buscar e exibir fotos de uma API pública de imagens conforme o termo pesquisado.",
    ferramentas: ["HTML", "CSS", "JavaScript", "fetch", "API de imagens"],
    passosSimplificados: [
      "Crie a barra de busca",
      "Consulte uma API pública de imagens com o termo",
      "Exiba as fotos em grade responsiva",
      "Adicione carregamento progressivo e estado vazio",
      "Trate erros e publique",
    ],
    entregavel: "Galeria que mostra fotos de acordo com a busca.",
    comoPublicar: "GitHub Pages ou Netlify",
    sugestaoLinkedIn:
      "Fiz uma galeria de fotos que consome uma API de imagens e responde à busca em tempo real! Treinei fetch, grid responsivo e tratamento de erros. Vem ver!",
    proximoProjeto: "Encurtador de Links",
    proximoProjetoId: "url-shortener-api",
  },
  {
    id: "api-rest-tarefas",
    nome: "API REST de Tarefas",
    areaSlug: "backend" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Criar uma API REST que cria, lista, atualiza e remove tarefas (CRUD completo).",
    ferramentas: [
      "Node.js",
      "Express",
      "Banco de dados",
      "Postman ou Insomnia",
    ],
    passosSimplificados: [
      "Configure o servidor Express",
      "Crie as rotas CRUD de tarefas",
      "Conecte a um banco de dados para persistir",
      "Valide os dados de entrada e trate erros",
      "Documente as rotas e publique",
    ],
    entregavel: "API REST publicada com CRUD de tarefas funcionando.",
    comoPublicar: "Render ou Railway",
    sugestaoLinkedIn:
      "Construí minha primeira API REST com Node e Express, com CRUD completo e banco de dados! Aprendi rotas, validação e tratamento de erros. Repositório nos comentários!",
    proximoProjeto: "Autenticação com JWT",
    proximoProjetoId: "autenticacao-jwt",
  },
  {
    id: "autenticacao-jwt",
    nome: "Autenticação com JWT",
    areaSlug: "backend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Implementar cadastro e login com senha protegida e rotas que só abrem com token válido.",
    ferramentas: ["Node.js", "Express", "JWT", "bcrypt", "Banco de dados"],
    passosSimplificados: [
      "Crie as rotas de cadastro e login",
      "Guarde a senha com hash (bcrypt)",
      "Gere um token JWT no login",
      "Proteja rotas exigindo o token válido",
      "Teste os fluxos e publique",
    ],
    entregavel: "API com cadastro, login e rotas protegidas por token.",
    comoPublicar: "Render ou Railway",
    sugestaoLinkedIn:
      "Implementei autenticação com JWT do zero: hash de senha, geração de token e proteção de rotas! Um passo importante pra segurança em APIs. Repositório nos comentários!",
    proximoProjeto: "API REST de Tarefas",
    proximoProjetoId: "api-rest-tarefas",
  },
  {
    id: "lista-compras-mobile",
    nome: "Lista de Compras (Mobile)",
    areaSlug: "mobile" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Criar um app de celular para montar a lista de compras e marcar o que já foi comprado.",
    ferramentas: ["React Native", "Expo", "JavaScript"],
    passosSimplificados: [
      "Crie a tela com campo para adicionar item",
      "Liste os itens adicionados",
      "Permita marcar item como comprado e remover",
      "Salve a lista no dispositivo",
      "Teste no celular com o Expo e publique o código",
    ],
    entregavel: "App mobile de lista de compras rodando no celular.",
    comoPublicar: "Código no GitHub e preview com Expo",
    sugestaoLinkedIn:
      "Fiz meu primeiro app mobile com React Native e Expo: uma lista de compras com itens e marcação de comprado! Rodei direto no celular. Vem ver!",
    proximoProjeto: "App de Notas com Markdown",
    proximoProjetoId: "app-notas-markdown",
  },
  {
    id: "analise-dados-vendas",
    nome: "Análise de Dados de Vendas",
    areaSlug: "analise-dados" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Ler uma planilha de vendas, calcular métricas e gerar gráficos com os principais insights.",
    ferramentas: ["Python", "pandas", "matplotlib", "Jupyter ou Google Colab"],
    passosSimplificados: [
      "Carregue o CSV de vendas com o pandas",
      "Limpe os dados (tipos, nulos, duplicados)",
      "Calcule métricas: total por mês, produto e região",
      "Gere gráficos dos principais resultados",
      "Escreva uma conclusão curta com os insights",
    ],
    entregavel: "Notebook com a análise, gráficos e conclusões das vendas.",
    comoPublicar: "Notebook no GitHub ou link do Google Colab",
    sugestaoLinkedIn:
      "Analisei uma base de vendas com pandas: limpei os dados, calculei métricas e gerei gráficos com os insights! Primeiro passo na análise de dados. Notebook nos comentários!",
    proximoProjeto: "Chatbot com IA",
    proximoProjetoId: "chatbot-com-ia",
  },
  {
    id: "chatbot-com-ia",
    nome: "Chatbot com IA",
    areaSlug: "ia" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar um chat que conversa com a pessoa usando uma API de modelo de linguagem.",
    ferramentas: ["JavaScript ou Python", "API de IA", "HTML", "CSS"],
    passosSimplificados: [
      "Monte a interface de chat (mensagens e campo de envio)",
      "Envie a mensagem da pessoa para uma API de IA",
      "Mostre a resposta do modelo na conversa",
      "Mantenha o histórico da conversa na tela",
      "Trate erros e limites, e publique",
    ],
    entregavel: "Chat publicado que responde usando uma API de IA.",
    comoPublicar: "Vercel ou Netlify",
    sugestaoLinkedIn:
      "Construí um chatbot que conversa usando uma API de IA! Pratiquei integração com API, controle de histórico e tratamento de erros. Link nos comentários!",
    proximoProjeto: "API REST de Tarefas",
    proximoProjetoId: "api-rest-tarefas",
  },
  {
    id: "api-auditoria-eventos",
    nome: "API de Auditoria de Eventos",
    areaSlug: "backend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar uma API que registre ações importantes de um sistema, como login, edição, exclusão e falhas de permissão.",
    ferramentas: ["Node.js", "Express", "PostgreSQL", "Swagger"],
    passosSimplificados: [
      "Definir os eventos que serão auditados",
      "Criar o modelo de dados no PostgreSQL",
      "Construir endpoints para registrar e consultar eventos",
      "Adicionar filtros por usuário, ação e período",
      "Documentar a API com Swagger",
    ],
    entregavel:
      "API funcional com banco de dados, filtros e documentação técnica",
    comoPublicar:
      "Publicar o código no GitHub e disponibilizar a documentação pelo Swagger ou README com exemplos de uso",
    sugestaoLinkedIn:
      "Concluí uma API de auditoria de eventos para praticar backend com foco em rastreabilidade e segurança. O projeto me ajudou a entender melhor logs, filtros e documentação de APIs.",
    proximoProjeto: "Sistema de Permissões com Controle de Acesso",
  },
  {
    id: "motor-regras-notificacao",
    nome: "Motor de Regras para Notificações",
    areaSlug: "backend" as string | null,
    nivel: "Avançado",
    objetivo:
      "Construir um serviço backend que decide quando enviar notificações com base em regras configuráveis.",
    ferramentas: ["Java", "Spring Boot", "Redis", "PostgreSQL", "Docker"],
    passosSimplificados: [
      "Modelar regras de notificação por evento",
      "Criar endpoints para cadastrar regras",
      "Implementar processamento assíncrono com fila ou cache",
      "Adicionar logs de execução das regras",
      "Criar testes para cenários de regra válida, inválida e expirada",
    ],
    entregavel:
      "Serviço backend com motor de regras, persistência e ambiente Docker",
    comoPublicar:
      "Publicar no GitHub com Docker Compose e exemplos de requisições no README",
    sugestaoLinkedIn:
      "Finalizei um motor de regras para notificações usando backend mais avançado. Foi um projeto importante para praticar arquitetura, processamento assíncrono e tomada de decisão no servidor.",
    proximoProjeto: "Plataforma de Notificações Multicanal",
  },
  {
    id: "plataforma-eventos-tech",
    nome: "Plataforma de Inscrição em Eventos Tech",
    areaSlug: "fullstack" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar uma aplicação para cadastrar eventos, receber inscrições e gerar lista de participantes.",
    ferramentas: ["React", "Node.js", "PostgreSQL", "Prisma"],
    passosSimplificados: [
      "Criar telas de listagem e detalhe de eventos",
      "Implementar cadastro de eventos no backend",
      "Criar fluxo de inscrição de participantes",
      "Adicionar painel administrativo simples",
      "Gerar relatório de inscritos por evento",
    ],
    entregavel:
      "Aplicação fullstack com frontend, backend e banco de dados integrados",
    comoPublicar:
      "Publicar o frontend na Vercel e o backend com instruções de execução no GitHub",
    sugestaoLinkedIn:
      "Construí uma plataforma fullstack de inscrição em eventos tech. O projeto me ajudou a conectar frontend, backend e banco de dados em um fluxo real de produto.",
    proximoProjeto: "Sistema de Check-in com QR Code",
  },
  {
    id: "marketplace-servicos-locais",
    nome: "Marketplace de Serviços Locais",
    areaSlug: "fullstack" as string | null,
    nivel: "Avançado",
    objetivo:
      "Criar um marketplace em que prestadores cadastram serviços e clientes fazem solicitações com status de atendimento.",
    ferramentas: ["Next.js", "NestJS", "PostgreSQL", "Prisma", "Docker"],
    passosSimplificados: [
      "Modelar usuários, serviços e solicitações",
      "Criar autenticação com perfis diferentes",
      "Implementar cadastro e busca de serviços",
      "Criar fluxo de solicitação e atualização de status",
      "Adicionar painel para prestador e cliente",
      "Preparar ambiente com Docker",
    ],
    entregavel:
      "Marketplace fullstack com autenticação, perfis e fluxo de serviço completo",
    comoPublicar:
      "Publicar o frontend na Vercel e manter o backend documentado no GitHub com Docker Compose",
    sugestaoLinkedIn:
      "Desenvolvi um marketplace de serviços locais para praticar arquitetura fullstack com múltiplos perfis de usuário. Foi um projeto desafiador para trabalhar regras de negócio reais.",
    proximoProjeto: "Sistema de Pagamentos Simulado",
  },
  {
    id: "modelo-controle-estoque",
    nome: "Modelo de Banco para Controle de Estoque",
    areaSlug: "banco-de-dados" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Modelar um banco relacional para controlar produtos, entradas, saídas, fornecedores e estoque mínimo.",
    ferramentas: ["PostgreSQL", "SQL", "DBeaver", "Draw.io"],
    passosSimplificados: [
      "Levantar entidades principais do estoque",
      "Criar modelo entidade relacionamento",
      "Implementar tabelas com chaves e restrições",
      "Criar consultas para saldo e movimentações",
      "Documentar decisões de modelagem",
    ],
    entregavel: "Modelo relacional com scripts SQL, diagrama e consultas úteis",
    comoPublicar:
      "Publicar os scripts, o diagrama e exemplos de consultas no GitHub",
    sugestaoLinkedIn:
      "Concluí um projeto de modelagem de banco para controle de estoque. Foi uma prática importante para reforçar SQL, relacionamentos e regras de integridade.",
    proximoProjeto: "API de Estoque com Relatórios",
  },
  {
    id: "data-mart-comercial",
    nome: "Data Mart Comercial",
    areaSlug: "banco-de-dados" as string | null,
    nivel: "Avançado",
    objetivo:
      "Criar um modelo dimensional para análise de vendas, clientes, produtos e metas comerciais.",
    ferramentas: ["PostgreSQL", "SQL", "dbdiagram.io", "Power BI"],
    passosSimplificados: [
      "Definir fatos e dimensões do domínio comercial",
      "Criar tabelas dimensionais e tabela fato",
      "Popular dados simulados",
      "Criar consultas analíticas com agregações",
      "Conectar o modelo a um dashboard simples",
    ],
    entregavel:
      "Data mart com modelo estrela, scripts SQL e consultas analíticas",
    comoPublicar:
      "Publicar scripts e diagrama no GitHub, com prints do dashboard no README",
    sugestaoLinkedIn:
      "Finalizei um data mart comercial para praticar modelagem dimensional. O projeto me ajudou a entender como bancos são estruturados para análise e tomada de decisão.",
    proximoProjeto: "Pipeline ETL para Data Warehouse",
  },
  {
    id: "catalogo-dados-publicos",
    nome: "Catálogo de Dados Públicos",
    areaSlug: "dados" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Criar um catálogo organizado com bases públicas brasileiras, explicando finalidade, colunas e possíveis análises.",
    ferramentas: ["Google Sheets", "Markdown", "GitHub"],
    passosSimplificados: [
      "Escolher 5 bases públicas",
      "Registrar origem e descrição de cada base",
      "Mapear principais colunas",
      "Sugerir perguntas de análise para cada base",
      "Publicar o catálogo com organização clara",
    ],
    entregavel: "Catálogo de dados documentado para consulta e estudo",
    comoPublicar:
      "Publicar no GitHub como README ou página simples no GitHub Pages",
    sugestaoLinkedIn:
      "Montei um catálogo de dados públicos brasileiros para praticar documentação e leitura de bases reais. Esse projeto me ajudou a transformar dados soltos em material útil para análise.",
    proximoProjeto: "Dashboard com Dados Públicos",
  },
  {
    id: "analise-churn-streaming",
    nome: "Análise de Churn em Serviço de Streaming",
    areaSlug: "analise-dados" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Analisar padrões de cancelamento em uma base simulada de clientes de streaming.",
    ferramentas: ["Python", "Pandas", "Matplotlib", "Jupyter Notebook"],
    passosSimplificados: [
      "Carregar e limpar a base de clientes",
      "Criar métricas de churn por perfil",
      "Comparar comportamento por plano e tempo de uso",
      "Gerar gráficos explicativos",
      "Escrever conclusões e recomendações",
    ],
    entregavel:
      "Notebook analítico com gráficos, insights e recomendações de negócio",
    comoPublicar:
      "Publicar o notebook no GitHub com README explicando o problema e os principais achados",
    sugestaoLinkedIn:
      "Concluí uma análise de churn em um serviço de streaming. O projeto me ajudou a praticar limpeza de dados, análise exploratória e comunicação de insights.",
    proximoProjeto: "Modelo de Previsão de Churn",
    proximoProjetoId: "modelo-previsao-churn",
  },
  {
    id: "painel-financeiro-executivo",
    nome: "Painel Financeiro Executivo",
    areaSlug: "analise-dados" as string | null,
    nivel: "Avançado",
    objetivo:
      "Criar um painel para acompanhar receita, custos, margem, ticket médio e variação mensal.",
    ferramentas: ["Power BI", "DAX", "Excel", "SQL"],
    passosSimplificados: [
      "Estruturar uma base financeira simulada",
      "Criar medidas DAX para indicadores principais",
      "Montar páginas de visão geral e detalhamento",
      "Adicionar filtros por período, categoria e centro de custo",
      "Escrever análise executiva dos resultados",
    ],
    entregavel:
      "Dashboard financeiro com KPIs, filtros e interpretação de negócio",
    comoPublicar:
      "Publicar prints e arquivo do projeto no GitHub, com explicação das medidas no README",
    sugestaoLinkedIn:
      "Desenvolvi um painel financeiro executivo com foco em indicadores de negócio. Foi uma ótima prática para transformar dados financeiros em visualizações úteis para decisão.",
    proximoProjeto: "Previsão de Receita com Séries Temporais",
  },
  {
    id: "pipeline-etl-dados-saude",
    nome: "Pipeline ETL de Dados de Saúde",
    areaSlug: "engenharia-dados" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar um pipeline que coleta, limpa e organiza dados de saúde em tabelas prontas para análise.",
    ferramentas: ["Python", "Pandas", "PostgreSQL", "Docker"],
    passosSimplificados: [
      "Escolher uma base pública ou simulada de saúde",
      "Criar etapa de extração dos arquivos",
      "Aplicar tratamento e padronização dos dados",
      "Carregar os dados tratados no PostgreSQL",
      "Documentar o fluxo de ponta a ponta",
    ],
    entregavel: "Pipeline ETL funcional com banco populado e documentação",
    comoPublicar:
      "Publicar no GitHub com Docker Compose e instruções para executar localmente",
    sugestaoLinkedIn:
      "Concluí um pipeline ETL de dados de saúde. Foi uma prática muito boa para entender extração, transformação e carga em um fluxo organizado.",
    proximoProjeto: "Data Warehouse de Indicadores de Saúde",
  },
  {
    id: "lakehouse-mini-vendas",
    nome: "Mini Lakehouse de Vendas",
    areaSlug: "engenharia-dados" as string | null,
    nivel: "Avançado",
    objetivo:
      "Simular uma arquitetura lakehouse com camadas de dados brutos, tratados e prontos para análise.",
    ferramentas: ["Python", "DuckDB", "Parquet", "Docker", "SQL"],
    passosSimplificados: [
      "Criar dados simulados de vendas em arquivos CSV",
      "Organizar camada bruta de dados",
      "Transformar arquivos para Parquet",
      "Criar camada analítica com DuckDB",
      "Escrever consultas de negócio",
      "Documentar a arquitetura em camadas",
    ],
    entregavel:
      "Mini lakehouse local com camadas de dados e consultas analíticas",
    comoPublicar:
      "Publicar no GitHub com estrutura de pastas, scripts e diagrama da arquitetura",
    sugestaoLinkedIn:
      "Desenvolvi um mini lakehouse de vendas para praticar engenharia de dados. O projeto me ajudou a entender melhor camadas de dados, Parquet e consultas analíticas.",
    proximoProjeto: "Orquestração de Pipeline com Airflow",
  },
  {
    id: "ci-cd-api-docker",
    nome: "CI/CD para API com Docker",
    areaSlug: "devops" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar uma esteira de integração contínua para testar, validar e empacotar uma API em Docker.",
    ferramentas: ["GitHub Actions", "Docker", "Node.js", "Jest"],
    passosSimplificados: [
      "Criar uma API simples com testes",
      "Escrever Dockerfile para a aplicação",
      "Configurar workflow no GitHub Actions",
      "Executar testes automaticamente a cada push",
      "Gerar imagem Docker como artefato",
    ],
    entregavel:
      "Pipeline CI/CD funcional com testes automatizados e build Docker",
    comoPublicar: "Publicar no GitHub com badge do workflow no README",
    sugestaoLinkedIn:
      "Configurei uma esteira CI/CD para uma API com Docker e GitHub Actions. Foi um projeto importante para praticar automação de testes e build em ambiente real.",
    proximoProjeto: "Deploy Automatizado em Ambiente Cloud",
  },
  {
    id: "observabilidade-microservicos",
    nome: "Observabilidade para Microserviços",
    areaSlug: "devops" as string | null,
    nivel: "Avançado",
    objetivo:
      "Montar um ambiente com métricas, logs e dashboards para acompanhar a saúde de serviços.",
    ferramentas: ["Docker", "Prometheus", "Grafana", "Node.js", "Loki"],
    passosSimplificados: [
      "Criar dois serviços simples em containers",
      "Expor métricas de aplicação",
      "Configurar Prometheus para coletar métricas",
      "Criar dashboards no Grafana",
      "Adicionar coleta de logs",
      "Documentar alertas e indicadores principais",
    ],
    entregavel:
      "Ambiente local de observabilidade com dashboards e logs centralizados",
    comoPublicar:
      "Publicar no GitHub com Docker Compose, prints dos dashboards e guia de execução",
    sugestaoLinkedIn:
      "Finalizei um laboratório de observabilidade para microserviços. Foi uma prática avançada para entender métricas, logs e monitoramento de aplicações.",
    proximoProjeto: "Kubernetes Local com Monitoramento",
  },
  {
    id: "upload-serverless-imagens",
    nome: "Upload Serverless de Imagens",
    areaSlug: "cloud" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar uma arquitetura serverless para upload, armazenamento e listagem de imagens.",
    ferramentas: ["AWS S3", "AWS Lambda", "API Gateway", "Node.js"],
    passosSimplificados: [
      "Desenhar a arquitetura da solução",
      "Criar endpoint para gerar URL de upload",
      "Armazenar imagens no bucket",
      "Criar função para listar arquivos enviados",
      "Documentar permissões e fluxo da aplicação",
    ],
    entregavel: "Arquitetura serverless documentada com código das funções",
    comoPublicar:
      "Publicar o código no GitHub com diagrama da arquitetura e instruções de configuração",
    sugestaoLinkedIn:
      "Criei uma solução serverless para upload de imagens. Esse projeto me ajudou a entender melhor serviços cloud, permissões e arquitetura sem servidor.",
    proximoProjeto: "Processamento Automático de Imagens na Cloud",
  },
  {
    id: "arquitetura-alta-disponibilidade",
    nome: "Arquitetura de Alta Disponibilidade para Aplicação Web",
    areaSlug: "cloud" as string | null,
    subareaSlug: "arquiteto-cloud",
    nivel: "Avançado",
    objetivo:
      "Projetar uma arquitetura cloud para uma aplicação web com escalabilidade, segurança e tolerância a falhas.",
    ferramentas: ["AWS", "Terraform", "Docker", "Nginx", "PostgreSQL"],
    passosSimplificados: [
      "Desenhar a arquitetura com camadas de rede e aplicação",
      "Definir recursos de infraestrutura como código",
      "Configurar balanceamento e banco gerenciado ou simulado",
      "Adicionar regras básicas de segurança",
      "Documentar decisões de custo, disponibilidade e escalabilidade",
    ],
    entregavel:
      "Projeto de arquitetura cloud com infraestrutura como código e documentação",
    comoPublicar:
      "Publicar no GitHub com Terraform, diagrama e explicação técnica no README",
    sugestaoLinkedIn:
      "Desenvolvi um projeto de arquitetura cloud com foco em alta disponibilidade. Foi uma prática avançada para pensar infraestrutura, segurança e escalabilidade de forma integrada.",
    proximoProjeto: "Deploy Multiambiente com Terraform",
  },
  {
    id: "lab-hardening-linux",
    nome: "Laboratório de Hardening Linux",
    areaSlug: "ciberseguranca" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar um checklist prático de endurecimento de segurança em um servidor Linux.",
    ferramentas: ["Linux", "UFW", "SSH", "Bash"],
    passosSimplificados: [
      "Criar uma máquina Linux local ou em VM",
      "Revisar usuários e permissões",
      "Configurar firewall básico",
      "Endurecer acesso SSH",
      "Criar script de verificação de configurações",
      "Documentar antes e depois das mudanças",
    ],
    entregavel:
      "Checklist técnico com scripts e evidências de configuração segura",
    comoPublicar:
      "Publicar scripts e documentação no GitHub, sem expor credenciais ou dados sensíveis",
    sugestaoLinkedIn:
      "Concluí um laboratório de hardening Linux para praticar segurança defensiva. O projeto me ajudou a entender configurações básicas que reduzem riscos em servidores.",
    proximoProjeto: "Monitoramento de Logs de Segurança",
  },
  {
    id: "siem-domestico-logs",
    nome: "SIEM Doméstico com Análise de Logs",
    areaSlug: "ciberseguranca" as string | null,
    subareaSlug: "blue-team",
    nivel: "Avançado",
    objetivo:
      "Montar um ambiente para coletar, centralizar e analisar logs de segurança de máquinas locais.",
    ferramentas: ["Wazuh", "Docker", "Linux", "Elastic Stack"],
    passosSimplificados: [
      "Subir ambiente de coleta de logs",
      "Adicionar uma máquina como agente",
      "Gerar eventos controlados de login e alteração de arquivos",
      "Criar regras ou filtros de análise",
      "Montar painel com eventos relevantes",
      "Documentar hipóteses de detecção",
    ],
    entregavel:
      "Laboratório SIEM com coleta de logs, alertas e painel documentado",
    comoPublicar:
      "Publicar documentação, prints e arquivos de configuração no GitHub, sem dados privados",
    sugestaoLinkedIn:
      "Montei um laboratório SIEM para estudar análise de logs e detecção de eventos. Foi um projeto avançado para entender melhor segurança defensiva na prática.",
    proximoProjeto: "Playbook de Resposta a Incidentes",
  },
  {
    id: "plano-testes-ecommerce",
    nome: "Plano de Testes para E-commerce",
    areaSlug: "qa" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar um plano de testes completo para os fluxos principais de um e-commerce.",
    ferramentas: ["Google Sheets", "Jira", "Markdown", "Miro"],
    passosSimplificados: [
      "Mapear fluxos críticos do e-commerce",
      "Definir cenários positivos e negativos",
      "Criar casos de teste por prioridade",
      "Registrar critérios de aceite",
      "Simular abertura de bugs com severidade e evidências",
    ],
    entregavel:
      "Plano de testes com casos, critérios e exemplos de bugs documentados",
    comoPublicar:
      "Publicar no GitHub como documentação em Markdown ou planilha exportada",
    sugestaoLinkedIn:
      "Criei um plano de testes para um e-commerce, cobrindo cenários críticos e critérios de aceite. Esse projeto reforçou minha visão de qualidade antes mesmo da automação.",
    proximoProjeto: "Automação de Testes para Checkout",
  },
  {
    id: "app-habitos-offline",
    nome: "App de Hábitos com Modo Offline",
    areaSlug: "mobile" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar um aplicativo para registrar hábitos diários mesmo sem conexão com a internet.",
    ferramentas: ["Kotlin", "Android Studio", "Room", "Material Design"],
    passosSimplificados: [
      "Criar tela de cadastro de hábitos",
      "Salvar registros localmente com Room",
      "Adicionar calendário ou histórico simples",
      "Criar resumo semanal",
      "Melhorar experiência visual com Material Design",
    ],
    entregavel: "Aplicativo Android funcional com persistência local",
    comoPublicar:
      "Publicar o código no GitHub com prints e APK de demonstração em release",
    sugestaoLinkedIn:
      "Desenvolvi um app mobile de hábitos com funcionamento offline. O projeto me ajudou a praticar persistência local, telas nativas e experiência de uso no Android.",
    proximoProjeto: "App de Hábitos com Sincronização em Nuvem",
  },
  {
    id: "jogo-logica-2d",
    nome: "Jogo 2D de Lógica e Fases",
    areaSlug: "gamedev" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar um jogo 2D com fases curtas, obstáculos e mecânica de resolução de lógica.",
    ferramentas: ["Godot", "GDScript", "Aseprite", "Git"],
    passosSimplificados: [
      "Definir mecânica principal do jogo",
      "Criar personagem e movimentação",
      "Construir 5 fases com dificuldade crescente",
      "Adicionar colisões, pontuação e reinício",
      "Criar tela inicial e tela de vitória",
    ],
    entregavel:
      "Jogo 2D jogável com fases, arte simples e lógica de progressão",
    comoPublicar: "Publicar no Itch.io e colocar o código ou devlog no GitHub",
    sugestaoLinkedIn:
      "Desenvolvi um jogo 2D de lógica com fases progressivas. Foi um projeto divertido para praticar programação, design de níveis e organização de mecânicas.",
    proximoProjeto: "Jogo 2D com Sistema de Inventário",
  },
  {
    id: "assistente-estudos-rag",
    nome: "Assistente de Estudos com Documentos",
    areaSlug: "ia" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar um assistente que responde perguntas com base em PDFs ou anotações fornecidas pelo usuário.",
    ferramentas: ["Python", "LangChain", "Streamlit", "OpenAI API"],
    passosSimplificados: [
      "Criar interface para upload de documentos",
      "Extrair texto dos arquivos",
      "Dividir o conteúdo em trechos",
      "Enviar perguntas para o modelo com contexto",
      "Exibir resposta com referência ao trecho usado",
    ],
    entregavel: "Assistente simples de perguntas e respostas sobre documentos",
    comoPublicar:
      "Publicar no GitHub e hospedar a interface no Streamlit Community Cloud",
    sugestaoLinkedIn:
      "Criei um assistente de estudos com IA que responde perguntas a partir de documentos. Foi meu primeiro passo prático para entender RAG e aplicações reais de IA.",
    proximoProjeto: "Chatbot com Memória e Histórico",
  },
  {
    id: "agente-triagem-suporte",
    nome: "Agente de Triagem de Suporte",
    areaSlug: "ia" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar um agente que classifica mensagens de suporte por prioridade, assunto e próximo passo recomendado.",
    ferramentas: ["Python", "FastAPI", "OpenAI API", "PostgreSQL"],
    passosSimplificados: [
      "Criar base simulada de tickets",
      "Definir categorias e prioridades",
      "Construir endpoint de classificação",
      "Salvar resultado e justificativa no banco",
      "Criar painel simples para revisar tickets classificados",
    ],
    entregavel: "Agente de triagem com API, banco e painel de revisão",
    comoPublicar:
      "Publicar no GitHub com exemplos de chamadas e prints do painel",
    sugestaoLinkedIn:
      "Finalizei um agente de triagem de suporte com IA. O projeto me ajudou a pensar além do chatbot, aplicando IA em classificação, priorização e apoio operacional.",
    proximoProjeto: "Agente de Suporte com Base de Conhecimento",
  },
  {
    id: "avaliador-curriculo-ia",
    nome: "Avaliador de Currículos com IA",
    areaSlug: "ia" as string | null,
    nivel: "Avançado",
    objetivo:
      "Criar uma aplicação que compara currículos com vagas e gera recomendações de melhoria.",
    ferramentas: ["Python", "FastAPI", "React", "OpenAI API", "PostgreSQL"],
    passosSimplificados: [
      "Criar upload de currículo e descrição da vaga",
      "Extrair informações relevantes dos textos",
      "Comparar requisitos com experiências",
      "Gerar pontuação e recomendações",
      "Salvar análises anteriores",
      "Criar tela de histórico para o usuário",
    ],
    entregavel:
      "Aplicação com análise de currículo, comparação com vaga e histórico",
    comoPublicar:
      "Publicar frontend na Vercel e backend no GitHub com instruções de execução local",
    sugestaoLinkedIn:
      "Desenvolvi um avaliador de currículos com IA que compara perfil e vaga. Foi um projeto avançado para praticar produto, backend, frontend e uso responsável de modelos generativos.",
    proximoProjeto: "Plataforma de Preparação para Entrevistas com IA",
  },
  {
    id: "editor-roadmap-interativo",
    nome: "Editor de Roadmap Interativo",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar uma interface em que o usuário monta um roadmap visual com etapas, status e prioridades.",
    ferramentas: ["React", "TypeScript", "Zustand", "Tailwind CSS"],
    passosSimplificados: [
      "Criar estrutura visual de etapas",
      "Permitir adicionar, editar e remover cards",
      "Adicionar status e prioridade",
      "Salvar dados no localStorage",
      "Criar exportação simples em JSON",
    ],
    entregavel: "Interface interativa de roadmap com persistência local",
    comoPublicar:
      "Publicar na Vercel ou Netlify e disponibilizar o código no GitHub",
    sugestaoLinkedIn:
      "Criei um editor de roadmap interativo para praticar frontend além de páginas estáticas. O projeto me ajudou a trabalhar estado, persistência local e experiência de uso.",
    proximoProjeto: "Roadmap Colaborativo Fullstack",
  },
  {
    id: "comparador-planos-tech",
    nome: "Comparador de Planos de Ferramentas Tech",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar uma página que compara ferramentas, preços, recursos e indica a melhor opção por perfil.",
    ferramentas: ["Vue.js", "TypeScript", "Pinia", "CSS"],
    passosSimplificados: [
      "Criar base local de ferramentas e planos",
      "Montar cards comparativos",
      "Adicionar filtros por preço e recurso",
      "Criar lógica de recomendação por perfil",
      "Adicionar visualização responsiva",
    ],
    entregavel:
      "Aplicação frontend com filtros, comparação e recomendação simples",
    comoPublicar: "Publicar no Netlify ou GitHub Pages com repositório aberto",
    sugestaoLinkedIn:
      "Desenvolvi um comparador de planos de ferramentas tech. Foi um projeto interessante para praticar estado, filtros e tomada de decisão na interface.",
    proximoProjeto: "Comparador com Backend e Login",
  },
  {
    id: "discovery-funcionalidade-ia",
    nome: "Discovery de Funcionalidade com IA",
    areaSlug: "produto" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Estruturar o discovery de uma funcionalidade que usa IA para recomendar trilhas de estudo personalizadas.",
    ferramentas: ["Notion", "Miro", "Figma", "Google Forms"],
    passosSimplificados: [
      "Definir problema e público alvo",
      "Levantar hipóteses de valor",
      "Criar matriz de priorização",
      "Desenhar fluxo da funcionalidade",
      "Definir critérios de sucesso e riscos",
    ],
    entregavel:
      "Documento de discovery com problema, hipóteses, fluxo e métricas",
    comoPublicar: "Publicar como case em Notion, PDF ou artigo no LinkedIn",
    sugestaoLinkedIn:
      "Estruturei um discovery de produto para uma funcionalidade com IA. O projeto me ajudou a pensar valor, riscos e métricas antes de partir para a solução.",
    proximoProjeto: "MVP de Recomendação de Trilhas",
  },
  {
    id: "metricas-retencao-produto",
    nome: "Estratégia de Métricas para Retenção",
    areaSlug: "produto" as string | null,
    nivel: "Avançado",
    objetivo:
      "Criar uma estratégia de métricas para acompanhar retenção, ativação e engajamento de um produto digital.",
    ferramentas: ["Amplitude", "Google Sheets", "Notion", "Figma"],
    passosSimplificados: [
      "Definir a jornada principal do usuário",
      "Mapear eventos relevantes do produto",
      "Criar funil de ativação",
      "Definir métricas de retenção por coorte",
      "Propor experimentos para melhorar engajamento",
      "Documentar decisões em formato de case",
    ],
    entregavel:
      "Plano de métricas de produto com eventos, funil, coortes e experimentos",
    comoPublicar: "Publicar como case em Notion, PDF ou carrossel no LinkedIn",
    sugestaoLinkedIn:
      "Concluí uma estratégia de métricas para retenção de produto digital. Foi um projeto avançado para conectar comportamento do usuário, dados e decisões de produto.",
    proximoProjeto: "Dashboard de Produto com Eventos Simulados",
  },
  {
    id: "editor-colaborativo-tempo-real",
    nome: "Editor de Texto Colaborativo em Tempo Real",
    areaSlug: "frontend" as string | null,
    nivel: "Avançado",
    objetivo:
      "Construir um editor onde várias pessoas editam o mesmo documento ao mesmo tempo, com cursores e sincronização sem conflito.",
    ferramentas: ["React", "TypeScript", "Yjs", "WebSocket", "Tailwind CSS"],
    passosSimplificados: [
      "Criar a interface do editor com área de texto e barra de ferramentas",
      "Integrar uma estrutura de dados colaborativa (CRDT) para o conteúdo",
      "Conectar os clientes por WebSocket",
      "Exibir cursores e seleções de outros usuários",
      "Tratar reconexão e estado offline temporário",
    ],
    entregavel:
      "Editor colaborativo publicado com várias sessões editando o mesmo documento",
    comoPublicar:
      "Publicar o frontend na Vercel e o servidor de sincronização no Railway, com código no GitHub",
    sugestaoLinkedIn:
      "Construí um editor de texto colaborativo em tempo real para praticar frontend avançado com CRDT e WebSocket. O maior aprendizado foi lidar com sincronização e estado compartilhado sem travar a interface.",
    proximoProjeto: "Whiteboard Colaborativo com Histórico",
  },
  {
    id: "roguelike-procedural",
    nome: "Roguelike com Geração Procedural",
    areaSlug: "gamedev" as string | null,
    nivel: "Avançado",
    objetivo:
      "Criar um jogo roguelike onde mapas, inimigos e itens são gerados proceduralmente a cada partida.",
    ferramentas: ["Godot", "GDScript", "Aseprite", "Git"],
    passosSimplificados: [
      "Definir as regras de geração de salas e corredores",
      "Implementar geração procedural de mapas conectados",
      "Criar sistema de inimigos com dificuldade escalável",
      "Adicionar itens, inventário e progressão",
      "Implementar salvamento de progresso e tela de fim de jogo",
    ],
    entregavel:
      "Jogo jogável com mapas diferentes a cada partida, inimigos e itens",
    comoPublicar: "Publicar no Itch.io e manter o código ou devlog no GitHub",
    sugestaoLinkedIn:
      "Finalizei um roguelike com geração procedural de mapas e inimigos. Foi um projeto avançado para praticar algoritmos de geração, balanceamento e arquitetura de jogo.",
    proximoProjeto: "Roguelike com Combate por Turnos",
  },
  {
    id: "app-offline-first-sync",
    nome: "App Offline-first com Sincronização",
    areaSlug: "mobile" as string | null,
    nivel: "Avançado",
    objetivo:
      "Criar um aplicativo que funciona totalmente offline e sincroniza com a nuvem quando há conexão, resolvendo conflitos.",
    ferramentas: [
      "Kotlin",
      "Android Studio",
      "Room",
      "WorkManager",
      "Firebase",
    ],
    passosSimplificados: [
      "Modelar dados locais com banco no dispositivo",
      "Permitir criar, editar e excluir registros offline",
      "Implementar fila de sincronização em segundo plano",
      "Resolver conflitos entre versão local e remota",
      "Mostrar status de sincronização ao usuário",
    ],
    entregavel:
      "Aplicativo Android que opera offline e sincroniza com a nuvem de forma confiável",
    comoPublicar:
      "Publicar o código no GitHub com prints, vídeo de demonstração e APK em release",
    sugestaoLinkedIn:
      "Desenvolvi um app mobile offline-first com sincronização e resolução de conflitos. O desafio foi garantir consistência de dados entre o dispositivo e a nuvem sem perder informação.",
    proximoProjeto: "App com Sincronização Multiusuário",
  },
  {
    id: "design-system-multiplataforma",
    nome: "Design System Multiplataforma",
    areaSlug: "uxui" as string | null,
    nivel: "Avançado",
    objetivo:
      "Criar um design system completo com tokens, componentes, acessibilidade e documentação para uso em web e mobile.",
    ferramentas: ["Figma", "FigJam", "Tokens Studio", "Material Design"],
    passosSimplificados: [
      "Definir fundamentos de cor, tipografia, espaçamento e grid",
      "Criar tokens reutilizáveis e temas claro e escuro",
      "Desenhar componentes com variantes e estados",
      "Documentar uso, acessibilidade e regras de cada componente",
      "Montar telas de exemplo aplicando o sistema",
    ],
    entregavel:
      "Design system documentado com tokens, componentes e exemplos de aplicação",
    comoPublicar:
      "Publicar o arquivo público do Figma e apresentar o processo em um case no Behance ou LinkedIn",
    sugestaoLinkedIn:
      "Concluí um design system multiplataforma com tokens, componentes e documentação de acessibilidade. Foi um projeto avançado para pensar consistência, escala e handoff para desenvolvimento.",
    proximoProjeto: "Contribuição em Design System de Código Aberto",
  },
  {
    id: "gestao-portfolio-indicadores",
    nome: "Gestão de Portfólio de Projetos com Indicadores",
    areaSlug: "gestao" as string | null,
    nivel: "Avançado",
    objetivo:
      "Estruturar a gestão de um portfólio de projetos com priorização, acompanhamento de status e indicadores de desempenho.",
    ferramentas: ["Notion", "Google Sheets", "Looker Studio", "Miro"],
    passosSimplificados: [
      "Definir critérios de priorização de projetos",
      "Criar um painel de portfólio com status e responsáveis",
      "Definir indicadores de prazo, escopo e entrega",
      "Montar visão executiva com gráficos de acompanhamento",
      "Documentar riscos e decisões por projeto",
    ],
    entregavel:
      "Painel de portfólio com priorização, status e indicadores de desempenho",
    comoPublicar:
      "Publicar como case em Notion ou PDF, com prints do painel e explicação do método no LinkedIn",
    sugestaoLinkedIn:
      "Estruturei a gestão de um portfólio de projetos com priorização e indicadores. Foi um projeto avançado para conectar estratégia, acompanhamento e tomada de decisão.",
    proximoProjeto: "Escritório de Projetos (PMO) Simplificado",
  },
  {
    id: "dashboard-gastos-pessoais",
    nome: "Dashboard de Gastos Pessoais",
    areaSlug: "analise-dados" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Organizar e visualizar gastos pessoais para entender para onde o dinheiro está indo.",
    ferramentas: ["Google Sheets", "Looker Studio"],
    passosSimplificados: [
      "Registrar gastos por categoria e data",
      "Limpar e padronizar os dados",
      "Criar gráficos de gasto por categoria e por mês",
      "Adicionar filtros por período",
      "Escrever conclusões sobre os hábitos de gasto",
    ],
    entregavel: "Dashboard com visão de gastos por categoria e período",
    comoPublicar:
      "Publicar o link do painel no Looker Studio e descrever o processo no LinkedIn ou GitHub",
    sugestaoLinkedIn:
      "Montei um dashboard de gastos pessoais para praticar análise de dados do início ao fim. Foi ótimo para treinar organização de dados, visualização e leitura de padrões.",
    proximoProjeto: "Análise de Orçamento com Metas",
  },
  {
    id: "modelo-banco-biblioteca",
    nome: "Modelo de Banco para Biblioteca",
    areaSlug: "banco-de-dados" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Modelar um banco de dados para controlar livros, autores, usuários e empréstimos de uma biblioteca.",
    ferramentas: ["PostgreSQL", "SQL", "dbdiagram.io"],
    passosSimplificados: [
      "Levantar as entidades principais da biblioteca",
      "Criar o modelo entidade relacionamento",
      "Implementar as tabelas com chaves e relacionamentos",
      "Inserir dados de exemplo",
      "Criar consultas para empréstimos e livros disponíveis",
    ],
    entregavel: "Modelo de banco com diagrama, tabelas e consultas de exemplo",
    comoPublicar:
      "Publicar o diagrama e os scripts SQL no GitHub com explicação do modelo",
    sugestaoLinkedIn:
      "Modelei um banco de dados para uma biblioteca para praticar do diagrama às consultas. Foi uma boa base para entender relacionamentos e integridade de dados.",
    proximoProjeto: "Banco para Sistema de Locadora",
  },
  {
    id: "higiene-seguranca-contas",
    nome: "Guia de Higiene de Segurança de Contas",
    areaSlug: "ciberseguranca" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Aprender e documentar boas práticas para proteger contas pessoais contra acessos indevidos.",
    ferramentas: [
      "Gerenciador de senhas",
      "Autenticação em duas etapas",
      "Markdown",
    ],
    passosSimplificados: [
      "Revisar senhas reutilizadas e fracas em contas próprias",
      "Ativar autenticação em duas etapas nos principais serviços",
      "Configurar um gerenciador de senhas",
      "Revisar permissões de aplicativos conectados",
      "Documentar um checklist de segurança pessoal",
    ],
    entregavel:
      "Checklist de segurança de contas com práticas aplicadas e explicadas",
    comoPublicar:
      "Publicar o checklist no GitHub ou como artigo, sem expor dados pessoais ou senhas",
    sugestaoLinkedIn:
      "Montei um guia de higiene de segurança de contas aplicando boas práticas na minha própria rotina digital. Foi um primeiro passo prático e responsável em segurança defensiva.",
    proximoProjeto: "Checklist de Hardening de um Computador Pessoal",
  },
  {
    id: "deploy-site-estatico-cloud",
    nome: "Deploy de Site Estático na Nuvem",
    areaSlug: "cloud" as string | null,
    nivel: "Iniciante",
    objetivo: "Publicar um site estático na nuvem com domínio e HTTPS.",
    ferramentas: ["HTML", "CSS", "Cloudflare Pages", "Git"],
    passosSimplificados: [
      "Criar um site estático simples",
      "Versionar o código no GitHub",
      "Conectar o repositório a um serviço de hospedagem na nuvem",
      "Configurar build e publicação automática",
      "Configurar um domínio e HTTPS",
    ],
    entregavel: "Site publicado na nuvem com domínio e atualização automática",
    comoPublicar:
      "Compartilhar o link do site publicado e o repositório no GitHub",
    sugestaoLinkedIn:
      "Publiquei meu primeiro site na nuvem com deploy automático e HTTPS. Foi uma introdução prática a hospedagem, domínios e integração com repositório.",
    proximoProjeto: "Deploy de Aplicação com Backend na Nuvem",
  },
  {
    id: "containerizar-app-docker",
    nome: "Containerizar uma Aplicação com Docker",
    areaSlug: "devops" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Empacotar uma aplicação simples em um container Docker para rodar em qualquer máquina.",
    ferramentas: ["Docker", "Node.js", "Git"],
    passosSimplificados: [
      "Escolher ou criar uma aplicação simples",
      "Escrever um Dockerfile para a aplicação",
      "Construir a imagem e rodar o container",
      "Expor a porta e testar o acesso",
      "Documentar os comandos no README",
    ],
    entregavel: "Aplicação rodando em container com instruções de uso",
    comoPublicar:
      "Publicar o código com Dockerfile no GitHub e explicar como executar",
    sugestaoLinkedIn:
      "Containerizei minha primeira aplicação com Docker. Aprendi na prática sobre imagens, containers e por que isso facilita rodar projetos em qualquer ambiente.",
    proximoProjeto: "Subir Aplicação e Banco com Docker Compose",
  },
  {
    id: "lista-tarefas-fullstack",
    nome: "Lista de Tarefas Fullstack",
    areaSlug: "fullstack" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar um aplicativo completo de lista de tarefas com interface, servidor e banco de dados.",
    ferramentas: ["React", "Node.js", "Express", "SQLite"],
    passosSimplificados: [
      "Criar a interface para adicionar e listar tarefas",
      "Criar a API para salvar e buscar tarefas",
      "Conectar o frontend ao backend",
      "Salvar as tarefas em um banco",
      "Permitir concluir e remover tarefas",
    ],
    entregavel:
      "Aplicação fullstack funcional com frontend, backend e banco integrados",
    comoPublicar:
      "Publicar o frontend na Vercel e o backend no GitHub com instruções de execução",
    sugestaoLinkedIn:
      "Construí minha primeira aplicação fullstack, uma lista de tarefas com front, back e banco. Foi ótimo para entender como as partes de uma aplicação se conectam.",
    proximoProjeto: "Lista de Tarefas com Login de Usuário",
  },
  {
    id: "canvas-produto-mvp",
    nome: "Canvas de Produto e Definição de MVP",
    areaSlug: "produto" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Estruturar uma ideia de produto definindo problema, público, proposta de valor e escopo do MVP.",
    ferramentas: ["Notion", "Miro", "Google Forms"],
    passosSimplificados: [
      "Escolher um problema real para resolver",
      "Descrever público, dores e proposta de valor",
      "Listar funcionalidades e separar o que entra no MVP",
      "Definir uma métrica inicial de sucesso",
      "Validar a ideia com algumas pessoas",
    ],
    entregavel:
      "Documento de produto com problema, proposta de valor e escopo do MVP",
    comoPublicar: "Publicar como case em Notion, PDF ou artigo no LinkedIn",
    sugestaoLinkedIn:
      "Estruturei uma ideia de produto do problema ao MVP. Foi um primeiro exercício prático de pensar valor, público e escopo antes de construir.",
    proximoProjeto: "Discovery com Entrevistas de Usuário",
  },
  {
    id: "kanban-projeto-pessoal",
    nome: "Quadro Kanban para um Projeto Pessoal",
    areaSlug: "gestao" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Organizar um projeto pessoal usando um quadro Kanban e acompanhamento simples de progresso.",
    ferramentas: ["Trello", "Notion"],
    passosSimplificados: [
      "Definir o objetivo e as entregas do projeto",
      "Quebrar o trabalho em tarefas",
      "Criar colunas de a fazer, fazendo e feito",
      "Definir prioridades e prazos",
      "Acompanhar o progresso e ajustar a cada semana",
    ],
    entregavel:
      "Quadro Kanban organizado com tarefas, prioridades e acompanhamento",
    comoPublicar:
      "Compartilhar o quadro público e descrever os aprendizados no LinkedIn",
    sugestaoLinkedIn:
      "Organizei um projeto pessoal com um quadro Kanban e acompanhamento semanal. Foi uma forma prática de aprender gestão de tarefas e priorização.",
    proximoProjeto: "Gestão de Projeto com Cerimônias Ágeis",
  },
  // TODO(Ana): revisao editorial dos 6 projetos abaixo (criados na Fase 5a
  // como projeto final das trilhas que nao tinham nenhum candidato de area:
  // analise-sistemas, blockchain, infraestrutura, iot, mainframe, sre).
  {
    id: "especificacao-sistema-real",
    nome: "Especificação Completa de um Sistema",
    areaSlug: "analise-sistemas" as string | null,
    nivel: "Avançado",
    objetivo:
      "Especificar de ponta a ponta um sistema real (ex: agendamento de consultas), do levantamento de requisitos ao protótipo navegável.",
    ferramentas: ["Google Docs ou Notion", "draw.io", "BPMN.io", "Figma"],
    passosSimplificados: [
      "Levantar requisitos entrevistando 2 ou 3 usuários reais do problema",
      "Escrever o documento de visão com escopo e o que fica de fora",
      "Detalhar casos de uso e histórias com critérios de aceite",
      "Modelar os diagramas UML de casos de uso e de classes no draw.io",
      "Mapear o processo atual e o proposto em BPMN",
      "Montar o protótipo navegável das telas principais no Figma",
      "Consolidar tudo num repositório com um README que serve de índice",
    ],
    entregavel:
      "Repositório com a especificação completa: documentos, diagramas exportados e link do protótipo navegável.",
    comoPublicar: "GitHub (documentos e diagramas) e Figma",
    sugestaoLinkedIn:
      "Especifiquei um sistema de ponta a ponta: requisitos, casos de uso, UML, BPMN e protótipo navegável. Análise de sistemas na prática, do problema à solução documentada.",
    proximoProjeto: "Especificação de uma melhoria em um produto que você usa",
  },
  {
    id: "dapp-registro-testnet",
    nome: "DApp de Registro Verificável em Testnet",
    areaSlug: "blockchain" as string | null,
    nivel: "Avançado",
    objetivo:
      "Construir um dapp simples que registra a prova de existência de um documento numa testnet, com verificação pública no explorer.",
    ferramentas: [
      "Solidity",
      "Remix IDE",
      "MetaMask",
      "Ethers.js",
      "Testnet Sepolia",
    ],
    passosSimplificados: [
      "Escrever o contrato que guarda hash e timestamp de documentos",
      "Testar as funções de registrar e consultar no Remix",
      "Fazer o deploy na testnet usando uma carteira com fundos de teste",
      "Verificar o código do contrato no explorer da testnet",
      "Criar uma página web que conecta a MetaMask e envia o hash",
      "Registrar um documento real e conferir a transação no explorer",
      "Documentar endereços, prints e o passo a passo no README",
    ],
    entregavel:
      "Contrato verificado em testnet e front simples no repositório, com o endereço público conferível no explorer.",
    comoPublicar: "GitHub e o endereço do contrato no explorer da testnet",
    sugestaoLinkedIn:
      "Publiquei meu primeiro dapp em testnet: um registro verificável de documentos com Solidity, MetaMask e Ethers.js. Contrato verificado e aberto no explorer.",
    proximoProjeto: "Token simples com casos de uso documentados",
  },
  {
    id: "homelab-documentado",
    nome: "Homelab Documentado",
    areaSlug: "infraestrutura" as string | null,
    nivel: "Avançado",
    objetivo:
      "Montar um laboratório doméstico virtualizado com rede, serviços e monitoramento, documentado como um ambiente profissional.",
    ferramentas: [
      "VirtualBox ou Proxmox",
      "Linux Server",
      "Docker",
      "Uptime Kuma",
      "draw.io",
    ],
    passosSimplificados: [
      "Desenhar o diagrama da rede e dos serviços planejados",
      "Criar 2 ou 3 máquinas virtuais Linux",
      "Configurar um servidor de arquivos e um DNS local",
      "Subir 2 serviços úteis em Docker (ex: wiki e gerenciador de senhas)",
      "Monitorar tudo com Uptime Kuma e alertas",
      "Escrever o runbook de 3 incidentes comuns (disco cheio, serviço fora, backup)",
      "Documentar decisões, configs e prints no repositório",
    ],
    entregavel:
      "Repositório com diagrama de rede, configurações, runbook de incidentes e prints do monitoramento funcionando.",
    comoPublicar: "GitHub",
    sugestaoLinkedIn:
      "Montei e documentei meu homelab: VMs Linux, serviços em Docker, DNS local, monitoramento e runbook de incidentes. Infraestrutura na prática, de ponta a ponta.",
    proximoProjeto: "Automatizar a criação do ambiente com scripts",
  },
  {
    id: "estacao-monitoramento-iot",
    nome: "Estação de Monitoramento com Sensor e Dashboard",
    areaSlug: "iot" as string | null,
    nivel: "Avançado",
    objetivo:
      "Construir uma estação que lê temperatura e umidade num microcontrolador e publica num dashboard em tempo real via MQTT.",
    ferramentas: [
      "ESP32 (ou simulador Wokwi)",
      "Sensor DHT22",
      "MQTT (HiveMQ Cloud)",
      "Node-RED ou Grafana",
    ],
    passosSimplificados: [
      "Montar o circuito com o sensor (ou simular tudo no Wokwi)",
      "Ler temperatura e umidade no firmware",
      "Publicar as leituras num broker MQTT gratuito",
      "Montar o dashboard que assina o tópico e exibe em tempo real",
      "Criar um alerta quando a leitura passar de um limite",
      "Guardar o histórico das últimas horas",
      "Documentar o circuito, o fluxo e um GIF do funcionamento",
    ],
    entregavel:
      "Firmware e fluxo do dashboard no repositório, com GIF ou vídeo curto da estação funcionando de ponta a ponta.",
    comoPublicar: "GitHub (e o projeto público no Wokwi, se simulado)",
    sugestaoLinkedIn:
      "Minha primeira estação IoT: sensor de temperatura e umidade publicando via MQTT num dashboard em tempo real, com alerta de limite. Do circuito ao gráfico.",
    proximoProjeto: "Acionar um atuador remoto a partir do dashboard",
  },
  {
    id: "rotina-batch-cobol",
    nome: "Rotina Batch COBOL com JCL",
    areaSlug: "mainframe" as string | null,
    nivel: "Avançado",
    objetivo:
      "Construir uma rotina batch completa de fechamento diário: crítica de entrada, totalização e relatório, orquestrada por JCL documentado.",
    ferramentas: [
      "COBOL (GnuCOBOL ou mainframe de treino)",
      "JCL",
      "Arquivos sequenciais ou VSAM",
    ],
    passosSimplificados: [
      "Definir o caso de negócio (ex: fechamento diário de vendas) e os layouts dos arquivos",
      "Escrever o programa de crítica que valida e separa registros com erro",
      "Escrever o programa de totalização que gera o relatório do dia",
      "Montar o JCL com os steps, dependências e códigos de retorno",
      "Testar com massas válidas e inválidas, conferindo cada saída",
      "Tratar reprocessamento (rodar de novo sem duplicar totais)",
      "Documentar o fluxo, os layouts e as massas no README",
    ],
    entregavel:
      "Fontes COBOL, JCL e massas de teste no repositório, com o relatório gerado e o fluxo do job documentado.",
    comoPublicar: "GitHub",
    sugestaoLinkedIn:
      "Construí uma rotina batch completa em COBOL: crítica de entrada, totalização com relatório e JCL orquestrando tudo, com massas de teste e reprocessamento documentados.",
    proximoProjeto:
      "Rotina de conciliação entre dois arquivos de origens diferentes",
  },
  {
    id: "stack-observabilidade-slo",
    nome: "Stack de Observabilidade com SLO e Postmortem",
    areaSlug: "sre" as string | null,
    nivel: "Avançado",
    objetivo:
      "Subir uma stack de observabilidade completa para uma API de exemplo, definir SLOs com error budget e conduzir um incidente simulado com postmortem.",
    ferramentas: [
      "Docker Compose",
      "Prometheus",
      "Grafana",
      "Uma API de exemplo",
    ],
    passosSimplificados: [
      "Subir uma API de exemplo expondo métricas de latência e erro",
      "Configurar o Prometheus coletando as métricas",
      "Montar o dashboard no Grafana com latência, tráfego e erros",
      "Definir SLI, SLO e o error budget do serviço, por escrito",
      "Criar o alerta de queima acelerada do error budget",
      "Injetar uma falha, conduzir o incidente e registrar a linha do tempo",
      "Escrever o postmortem sem culpados com ações de prevenção",
    ],
    entregavel:
      "Repositório com o docker-compose, dashboards exportados, o documento de SLOs e o postmortem simulado completo.",
    comoPublicar: "GitHub",
    sugestaoLinkedIn:
      "Montei uma stack de observabilidade com Prometheus e Grafana, defini SLOs com error budget e conduzi um incidente simulado até o postmortem. SRE na prática.",
    proximoProjeto: "Automatizar resposta a incidente com runbook executável",
  },
  // TODO(Ana): revisao editorial dos 8 projetos Pro abaixo (primeira leva do
  // tier premium, Fase 5a.2). Entregaveis escritos como criterios objetivos
  // verificaveis num repositorio GitHub, pra validacao pelo leitor de GitHub
  // (fase 5c). TODO(Ana): revisar tambem os arrays `requisitos` (5c.1), que
  // sao o contrato requisito a requisito dessa validacao.
  {
    id: "pro-saas-dashboard",
    nome: "Painel SaaS com Autenticação e Assinaturas Simuladas",
    areaSlug: "frontend" as string | null,
    nivel: "Avançado",
    objetivo:
      "Construir o front-end completo de um SaaS: autenticação real, painel com CRUD, gráficos, tema claro e escuro e testes, publicado em produção.",
    ferramentas: [
      "React",
      "TypeScript",
      "Supabase (auth e dados)",
      "TanStack Query",
      "Vitest",
      "Vercel",
    ],
    passosSimplificados: [
      "Modelar as telas: login, cadastro, painel, configurações e uma entidade central com CRUD",
      "Implementar autenticação com cadastro, login, logout e rota protegida",
      "Construir o CRUD completo da entidade central com estados de carregando, erro e vazio",
      "Adicionar um dashboard com pelo menos 2 gráficos alimentados pelos dados reais do usuário",
      "Implementar tema claro e escuro persistido entre visitas",
      "Escrever testes de unidade das regras principais e ligar num workflow de CI",
      "Publicar na Vercel com variáveis de ambiente e escrever o README profissional",
    ],
    entregavel:
      "Repositório público contendo: README com link do deploy funcionando no topo, print das telas e instruções de setup com .env.example; código com autenticação (telas de login e cadastro presentes); pelo menos 3 rotas protegidas; pasta de testes com Vitest e workflow de CI em .github/workflows rodando lint, testes e build.",
    comoPublicar: "Vercel (app) e GitHub (código)",
    sugestaoLinkedIn:
      "Publiquei um painel SaaS completo: autenticação, CRUD com estados de interface, gráficos, tema escuro, testes e CI. Front-end de produção, de ponta a ponta.",
    proximoProjeto: "Adicionar cobrança simulada com página de planos",
    pro: true,
    requisitos: [
      {
        id: "readme-deploy-link",
        descricao: "README com o link do deploy funcionando no topo",
        verificacao:
          "Abrir o README.md e conferir a URL de produção na seção inicial, acessível",
      },
      {
        id: "readme-setup-env",
        descricao: "Instruções de setup no README e um .env.example na raiz",
        verificacao:
          "README.md contém os passos de instalação e o arquivo .env.example existe no repositório",
      },
      {
        id: "auth-telas",
        descricao: "Telas de login e cadastro presentes e documentadas",
        verificacao:
          "A árvore de arquivos mostra páginas ou componentes de login e cadastro (nomes identificáveis), ou o README documenta as telas com prints",
      },
      {
        id: "rotas-protegidas",
        descricao: "Rotas protegidas documentadas (pelo menos 3)",
        verificacao:
          "O README lista as rotas protegidas com prints delas logadas, ou a árvore mostra a estrutura de páginas protegidas com nomes identificáveis",
      },
      {
        id: "crud-completo",
        descricao: "CRUD completo da entidade central, documentado",
        verificacao:
          "O README documenta as quatro operações com prints, ou a árvore mostra as telas ou rotas de criar, listar, editar e excluir com nomes identificáveis",
      },
      {
        id: "graficos-dashboard",
        descricao: "Dashboard com pelo menos 2 gráficos",
        verificacao:
          "Prints do dashboard no README mostram os gráficos, e o package.json tem a dependência de gráficos",
      },
      {
        id: "testes-vitest",
        descricao: "Testes de unidade com Vitest presentes",
        verificacao:
          "Arquivos .test. existem no repositório e o vitest aparece nas dependências do package.json",
      },
      {
        id: "ci-workflow",
        descricao: "Workflow de CI rodando lint, testes e build",
        verificacao:
          "Arquivo em .github/workflows com os três passos declarados",
      },
    ],
  },
  {
    id: "pro-api-ecommerce",
    nome: "API de E-commerce com Pedidos e Pagamentos Simulados",
    areaSlug: "backend" as string | null,
    nivel: "Avançado",
    objetivo:
      "Construir a API completa de um e-commerce: catálogo, carrinho, pedidos com transação, autenticação JWT, webhook de pagamento simulado e documentação OpenAPI.",
    ferramentas: [
      "Node.js ou linguagem da trilha",
      "PostgreSQL",
      "JWT",
      "OpenAPI/Swagger",
      "Docker",
      "Render ou Railway",
    ],
    passosSimplificados: [
      "Modelar o banco: usuários, produtos, carrinho, pedidos e itens de pedido",
      "Implementar autenticação JWT com cadastro, login e middleware de proteção",
      "Construir o catálogo com paginação, busca e filtro por categoria",
      "Implementar carrinho e fechamento de pedido com transação no banco",
      "Simular o pagamento com um webhook que muda o status do pedido",
      "Documentar todos os endpoints com OpenAPI servida pela própria API",
      "Escrever testes dos fluxos críticos e publicar com Docker",
    ],
    entregavel:
      "Repositório público contendo: README com URL da API no ar e da documentação OpenAPI acessível; arquivo de definição OpenAPI no repositório; migrações ou schema do banco versionados; pasta de testes cobrindo autenticação e fechamento de pedido; Dockerfile presente; workflow de CI rodando os testes.",
    comoPublicar: "Render ou Railway (API) e GitHub (código)",
    sugestaoLinkedIn:
      "Publiquei uma API de e-commerce completa: JWT, catálogo paginado, pedidos com transação, webhook de pagamento simulado e OpenAPI documentada. Back-end de verdade.",
    proximoProjeto:
      "Adicionar fila para processar os pedidos de forma assíncrona",
    pro: true,
    requisitos: [
      {
        id: "readme-api-url",
        descricao: "README com a URL da API no ar e da documentação",
        verificacao:
          "README.md traz o endereço da API publicada e o caminho da documentação OpenAPI acessível",
      },
      {
        id: "openapi-def",
        descricao: "Definição OpenAPI versionada no repositório",
        verificacao:
          "Arquivo de especificação OpenAPI (yaml ou json) presente no repositório",
      },
      {
        id: "migracoes-versionadas",
        descricao: "Migrações ou schema do banco versionados",
        verificacao:
          "Pasta de migrações ou arquivo de schema do banco presente no repositório",
      },
      {
        id: "auth-jwt",
        descricao: "Autenticação JWT presente e documentada",
        verificacao:
          "O package.json tem dependência de JWT, a árvore mostra arquivos de autenticação ou middleware, e o README indica quais endpoints exigem token",
      },
      {
        id: "pedidos-transacao",
        descricao: "Fluxo de pedido com transação, documentado",
        verificacao:
          "A árvore mostra o módulo de pedidos e o README documenta o fechamento de pedido explicando a transação",
      },
      {
        id: "testes-criticos",
        descricao: "Testes automatizados dos fluxos críticos",
        verificacao:
          "A árvore mostra arquivos de teste e o README cita que autenticação e fechamento de pedido estão cobertos",
      },
      {
        id: "dockerfile-ci",
        descricao: "Dockerfile presente e CI rodando os testes",
        verificacao:
          "Dockerfile na raiz e workflow em .github/workflows executando a suite",
      },
    ],
  },
  {
    id: "pro-kanban-colaborativo",
    nome: "Kanban Colaborativo em Tempo Real",
    areaSlug: "fullstack" as string | null,
    nivel: "Avançado",
    objetivo:
      "Construir um quadro kanban multiusuário com colaboração em tempo real: dois navegadores vendo o mesmo quadro se atualizarem ao vivo.",
    ferramentas: [
      "React",
      "Node.js",
      "Supabase Realtime ou WebSocket",
      "PostgreSQL",
      "Vercel e Render",
    ],
    passosSimplificados: [
      "Modelar quadros, colunas, cartões e membros no banco",
      "Implementar autenticação e o convite de membros pra um quadro",
      "Construir o arrastar e soltar de cartões entre colunas",
      "Sincronizar as mudanças em tempo real entre os clientes conectados",
      "Tratar conflito básico: a última escrita vence, com a interface reagindo",
      "Registrar um histórico de atividades por quadro",
      "Publicar front e back e documentar a arquitetura no README",
    ],
    entregavel:
      "Repositório público (ou monorepo) contendo: README com link do app no ar, GIF da colaboração em tempo real entre duas janelas e diagrama da arquitetura; código do front e do back no repositório; migrações ou schema versionados; autenticação presente; workflow de CI com build dos dois lados.",
    comoPublicar: "Vercel (front), Render (back) e GitHub (código)",
    sugestaoLinkedIn:
      "Construí um kanban colaborativo em tempo real: dois navegadores editando o mesmo quadro ao vivo, com histórico de atividades. Full-stack com sincronização de verdade.",
    proximoProjeto: "Adicionar comentários nos cartões com menções",
    pro: true,
    requisitos: [
      {
        id: "readme-demo",
        descricao:
          "README com link do app no ar e GIF da colaboração em tempo real",
        verificacao:
          "README.md contém a URL publicada e um GIF mostrando duas janelas sincronizando",
      },
      {
        id: "diagrama-arquitetura",
        descricao: "Diagrama da arquitetura no repositório",
        verificacao:
          "Imagem ou arquivo de diagrama presente e referenciado no README",
      },
      {
        id: "front-back-presentes",
        descricao: "Código do front e do back no repositório",
        verificacao:
          "Diretórios ou pacotes distintos de front e back identificáveis",
      },
      {
        id: "migracoes-schema",
        descricao: "Migrações ou schema versionados",
        verificacao: "Pasta de migrações ou schema do banco presente",
      },
      {
        id: "auth-membros",
        descricao: "Autenticação e convite de membros, documentados",
        verificacao:
          "A árvore mostra os módulos de autenticação e o README documenta o fluxo de convite ou associação de membros com prints",
      },
      {
        id: "historico-atividades",
        descricao: "Histórico de atividades por quadro, documentado",
        verificacao:
          "O README mostra o histórico de atividades em print ou GIF, ou a árvore mostra o módulo de atividades com nome identificavel",
      },
      {
        id: "ci-build",
        descricao: "CI com build dos dois lados",
        verificacao: "Workflow em .github/workflows buildando front e back",
      },
    ],
  },
  {
    id: "pro-pipeline-dados-abertos",
    nome: "Plataforma de Dados Abertos de Ponta a Ponta",
    areaSlug: "dados" as string | null,
    nivel: "Avançado",
    objetivo:
      "Construir o ciclo completo de dados: coleta automatizada de uma fonte pública, limpeza reprodutível, análise documentada e dashboard público atualizável.",
    ferramentas: [
      "Python",
      "pandas",
      "Jupyter",
      "GitHub Actions (agendamento)",
      "Streamlit",
    ],
    passosSimplificados: [
      "Escolher uma fonte de dados abertos com atualização recorrente",
      "Escrever o coletor que baixa e versiona os dados brutos",
      "Agendar a coleta com GitHub Actions",
      "Construir a limpeza reprodutível em scripts, não só no notebook",
      "Analisar num notebook com no mínimo 5 perguntas respondidas e visualizações",
      "Publicar um dashboard Streamlit com os principais indicadores",
      "Documentar o dicionário de dados e as decisões de limpeza no README",
    ],
    entregavel:
      "Repositório público contendo: README com link do dashboard no ar e dicionário de dados; workflow de agendamento em .github/workflows; scripts de coleta e limpeza separados do notebook; notebook de análise com visualizações renderizadas; pasta de dados (ou instrução de download) e requirements.txt reprodutível.",
    comoPublicar: "Streamlit Community Cloud (dashboard) e GitHub (código)",
    sugestaoLinkedIn:
      "Publiquei uma plataforma de dados de ponta a ponta: coleta agendada de dados abertos, limpeza reprodutível, análise documentada e dashboard público. Dados na prática, do bruto ao insight.",
    proximoProjeto: "Adicionar testes de qualidade de dados na pipeline",
    pro: true,
    requisitos: [
      {
        id: "readme-dashboard-link",
        descricao: "README com link do dashboard público no ar",
        verificacao: "README.md contém a URL do dashboard acessível",
      },
      {
        id: "dicionario-dados",
        descricao: "Dicionário de dados documentado",
        verificacao:
          "Seção ou arquivo de dicionário de dados presente e referenciado no README",
      },
      {
        id: "workflow-agendado",
        descricao: "Coleta agendada com GitHub Actions",
        verificacao:
          "Workflow em .github/workflows com gatilho de agendamento (schedule)",
      },
      {
        id: "scripts-separados",
        descricao: "Coleta e limpeza em scripts, fora do notebook",
        verificacao:
          "Arquivos de script de coleta e de limpeza existem separados do notebook",
      },
      {
        id: "notebook-analise",
        descricao: "Notebook de análise com as perguntas respondidas",
        verificacao:
          "A árvore tem o notebook (.ipynb) e o README resume as pelo menos 5 perguntas respondidas na análise",
      },
      {
        id: "dados-reproduziveis",
        descricao: "Dados versionados ou instrução clara de obtencao",
        verificacao:
          "Pasta de dados presente ou README com o passo a passo de download",
      },
      {
        id: "requirements",
        descricao: "Ambiente reproduzível",
        verificacao:
          "requirements.txt (ou equivalente) presente e suficiente pra rodar o projeto",
      },
    ],
  },
  {
    id: "pro-assistente-rag",
    nome: "Assistente de Perguntas sobre Documentos (RAG)",
    areaSlug: "ia" as string | null,
    nivel: "Avançado",
    objetivo:
      "Construir um assistente que responde perguntas sobre um conjunto de documentos seus, com busca vetorial, citação das fontes e avaliação de qualidade.",
    ferramentas: [
      "Python",
      "Modelo de embeddings",
      "Banco vetorial (pgvector ou similar)",
      "API de LLM com camada gratuita",
      "Streamlit ou FastAPI",
    ],
    passosSimplificados: [
      "Escolher um corpus real (apostilas, documentação, artigos) e fatiar em trechos",
      "Gerar embeddings dos trechos e indexar num banco vetorial",
      "Implementar a busca dos trechos mais relevantes pra cada pergunta",
      "Montar o prompt com contexto recuperado e gerar a resposta com citações",
      "Construir a interface de chat que exibe as fontes de cada resposta",
      "Criar um conjunto de 15 perguntas com respostas esperadas e medir acerto",
      "Documentar arquitetura, limitações e resultados da avaliação no README",
    ],
    entregavel:
      "Repositório público contendo: README com demonstração (link ou GIF), diagrama do fluxo RAG e a tabela de resultados da avaliação com as 15 perguntas; código de indexação e de consulta separados; as respostas exibindo citações das fontes (visível no GIF ou screenshots); requirements.txt e instruções de reprodução completas.",
    comoPublicar: "Streamlit Cloud ou Hugging Face Spaces e GitHub",
    sugestaoLinkedIn:
      "Construí um assistente RAG sobre meus próprios documentos: busca vetorial, respostas com citação de fontes e avaliação de qualidade com métricas. IA aplicada com engenharia de verdade.",
    proximoProjeto: "Comparar dois modelos de embeddings na mesma avaliação",
    pro: true,
    requisitos: [
      {
        id: "readme-demo",
        descricao: "README com demonstração (link ou GIF)",
        verificacao:
          "README.md contém link público ou GIF do assistente respondendo",
      },
      {
        id: "diagrama-rag",
        descricao: "Diagrama do fluxo RAG",
        verificacao:
          "Imagem do fluxo (ingestão, busca, geração) presente e referenciada no README",
      },
      {
        id: "avaliacao-perguntas",
        descricao: "Avaliação com 15 perguntas e resultados registrados",
        verificacao:
          "A árvore tem um arquivo de avaliação (ou o README traz a seção) com a tabela de perguntas e o acerto medido",
      },
      {
        id: "codigo-separado",
        descricao: "Indexação e consulta em módulos separados",
        verificacao:
          "A árvore mostra arquivos distintos pra gerar o índice e pra responder consultas, com nomes identificáveis",
      },
      {
        id: "citacoes-fontes",
        descricao: "Respostas exibem citações das fontes",
        verificacao:
          "GIF ou screenshots mostrando as fontes citadas em cada resposta",
      },
      {
        id: "requirements-repro",
        descricao: "Instruções completas de reprodução",
        verificacao:
          "requirements.txt presente e README com passos pra rodar do zero",
      },
    ],
  },
  {
    id: "pro-app-financas",
    nome: "App de Finanças Pessoais Completo",
    areaSlug: "mobile" as string | null,
    nivel: "Avançado",
    objetivo:
      "Construir um app de controle financeiro com autenticação, funcionamento offline, gráficos por categoria e lembretes locais, com build instalável.",
    ferramentas: [
      "React Native (Expo) ou Flutter",
      "SQLite ou armazenamento local",
      "Gráficos da stack escolhida",
      "Notificações locais",
      "EAS Build ou APK",
    ],
    passosSimplificados: [
      "Modelar transações, categorias e orçamento mensal",
      "Implementar o cadastro de receitas e despesas com categorias",
      "Garantir funcionamento offline com armazenamento local",
      "Construir o resumo mensal com gráficos por categoria",
      "Adicionar lembrete local configurável de lançamento diário",
      "Implementar exportação dos dados em CSV",
      "Gerar o build instalável e documentar a instalação no README",
    ],
    entregavel:
      "Repositório público contendo: README com GIF do fluxo principal, instruções de execução e o link ou arquivo do build instalável (APK ou build Expo); código com telas de cadastro, listagem, resumo com gráficos e configuração de lembrete identificáveis; funcionamento offline documentado com o mecanismo de armazenamento usado.",
    comoPublicar: "Build Expo ou APK anexado ao repositório e GitHub",
    sugestaoLinkedIn:
      "Publiquei um app de finanças pessoais completo: offline-first, gráficos por categoria, lembretes locais e build instalável. Mobile de ponta a ponta, do modelo de dados ao APK.",
    proximoProjeto: "Sincronizar os dados com um back-end quando online",
    pro: true,
    requisitos: [
      {
        id: "readme-gif-build",
        descricao: "README com GIF do fluxo principal e o build instalável",
        verificacao:
          "README.md contém GIF do app em uso e link ou arquivo do APK/build",
      },
      {
        id: "telas-nucleo",
        descricao:
          "Telas de cadastro, listagem, resumo e lembrete, demonstradas",
        verificacao:
          "O GIF ou os prints do README mostram as quatro telas, ou a árvore as evidencia com nomes identificáveis",
      },
      {
        id: "offline-documentado",
        descricao: "Funcionamento offline documentado com o mecanismo usado",
        verificacao:
          "O README explica o armazenamento local e o package.json (ou a árvore) evidencia a dependência usada (SQLite ou equivalente)",
      },
      {
        id: "graficos-categoria",
        descricao: "Resumo mensal com gráficos por categoria",
        verificacao:
          "O GIF ou os prints do README mostram os gráficos e o package.json tem a dependência de gráficos da stack",
      },
      {
        id: "lembrete-local",
        descricao: "Lembrete local configurável, documentado",
        verificacao:
          "O README documenta o lembrete com print da configuração e o package.json tem a dependência de notificações locais",
      },
      {
        id: "export-csv",
        descricao: "Exportação dos dados em CSV, documentada",
        verificacao:
          "O README documenta a exportação com print ou exemplo, ou a árvore tem um arquivo CSV de exemplo",
      },
    ],
  },
  {
    id: "pro-plataforma-deploy-iac",
    nome: "Infraestrutura como Código com Deploy Automatizado",
    areaSlug: "devops" as string | null,
    nivel: "Avançado",
    objetivo:
      "Provisionar a infraestrutura de uma aplicação com Terraform e construir o pipeline completo: build, testes, deploy automático e monitoramento com rollback documentado.",
    ferramentas: [
      "Terraform",
      "GitHub Actions",
      "Docker",
      "Um provedor com camada gratuita",
      "Prometheus ou o monitoramento do provedor",
    ],
    passosSimplificados: [
      "Containerizar uma aplicação de exemplo com Docker",
      "Descrever toda a infraestrutura em Terraform com estado versionado",
      "Construir o pipeline: lint, testes e build a cada push",
      "Automatizar o deploy pra um ambiente de produção a cada merge na main",
      "Adicionar monitoramento básico com alerta de indisponibilidade",
      "Executar e documentar um rollback real de uma versão quebrada",
      "Escrever o runbook de operação no repositório",
    ],
    entregavel:
      "Repositório público contendo: README com URL da aplicação no ar e diagrama da infraestrutura; diretório terraform com os módulos aplicáveis; workflows de CI e de deploy em .github/workflows; Dockerfile presente; runbook de operação e o registro do rollback executado (documento com passos e prints).",
    comoPublicar: "Provedor de nuvem (app) e GitHub (código e IaC)",
    sugestaoLinkedIn:
      "Provisionei infraestrutura com Terraform e montei o ciclo completo: CI, deploy automático, monitoramento e um rollback executado e documentado. DevOps de produção, não de tutorial.",
    proximoProjeto: "Adicionar ambiente de staging com promoção manual",
    pro: true,
    requisitos: [
      {
        id: "readme-url-diagrama",
        descricao:
          "README com URL da aplicação no ar e diagrama da infraestrutura",
        verificacao: "README.md contém a URL acessível e a imagem do diagrama",
      },
      {
        id: "terraform-dir",
        descricao: "Infraestrutura descrita em Terraform",
        verificacao:
          "Diretório terraform com os arquivos .tf do provisionamento",
      },
      {
        id: "ci-workflow",
        descricao: "Workflow de CI com lint, testes e build",
        verificacao:
          "Arquivo em .github/workflows executando as checagens a cada push",
      },
      {
        id: "deploy-workflow",
        descricao: "Deploy automático a cada merge na main",
        verificacao:
          "Workflow de deploy em .github/workflows com gatilho na main",
      },
      {
        id: "dockerfile",
        descricao: "Aplicação containerizada",
        verificacao: "Dockerfile presente na raiz ou no diretório do app",
      },
      {
        id: "runbook",
        descricao: "Runbook de operação no repositório",
        verificacao: "Documento de runbook presente e referenciado no README",
      },
      {
        id: "rollback-registrado",
        descricao: "Rollback executado e documentado",
        verificacao: "Documento com os passos e prints do rollback realizado",
      },
    ],
  },
  {
    id: "pro-redesign-design-system",
    nome: "Redesign Completo com Design System e Teste de Usabilidade",
    areaSlug: "uxui" as string | null,
    nivel: "Avançado",
    objetivo:
      "Conduzir um redesign de produto real de ponta a ponta: pesquisa, design system próprio, protótipo de alta fidelidade e teste de usabilidade com resultados documentados.",
    ferramentas: [
      "Figma",
      "Maze ou teste moderado por chamada",
      "Notion ou Google Docs",
    ],
    passosSimplificados: [
      "Escolher um produto real com problemas visíveis de usabilidade",
      "Conduzir pesquisa com pelo menos 3 usuários e mapear as dores",
      "Definir o design system: cores, tipografia, espaçamento e 10 componentes",
      "Redesenhar os 3 fluxos principais em alta fidelidade",
      "Montar o protótipo navegável dos fluxos",
      "Testar com 3 a 5 pessoas e registrar taxa de sucesso por tarefa",
      "Documentar o case completo, do problema aos resultados, no repositório",
    ],
    entregavel:
      "Repositório público contendo: README que apresenta o case com link público do protótipo Figma e do design system; documento de pesquisa com os achados; biblioteca de componentes visível no arquivo Figma público; relatório do teste de usabilidade com tarefas, taxa de sucesso e mudanças feitas a partir dos achados; antes e depois das telas em imagens no repositório.",
    comoPublicar: "Figma (protótipo público) e GitHub (case documentado)",
    sugestaoLinkedIn:
      "Concluí um redesign de ponta a ponta: pesquisa com usuários, design system próprio, protótipo de alta fidelidade e teste de usabilidade com métricas. UX com processo, não só tela bonita.",
    proximoProjeto: "Documentar o design system como site navegável",
    pro: true,
    requisitos: [
      {
        id: "readme-case",
        descricao: "README apresentando o case com links públicos do Figma",
        verificacao:
          "README.md contém os links do protótipo e do design system acessíveis",
      },
      {
        id: "pesquisa-achados",
        descricao: "Documento de pesquisa com os achados",
        verificacao:
          "Arquivo de pesquisa presente com método e descobertas das entrevistas",
      },
      {
        id: "design-system",
        descricao:
          "Design system com cores, tipografia e 10 componentes, documentado no repositório",
        verificacao:
          "O README traz o link público do Figma e o repositório contém imagens exportadas dos componentes (visíveis na árvore e no README)",
      },
      {
        id: "prototipo-navegavel",
        descricao:
          "Protótipo navegável dos 3 fluxos principais, documentado no repositório",
        verificacao:
          "O README traz o link público do protótipo e o repositório contém imagens dos fluxos (visíveis na árvore e no README)",
      },
      {
        id: "relatorio-usabilidade",
        descricao: "Relatório do teste de usabilidade com taxa de sucesso",
        verificacao:
          "Documento com tarefas, participantes, taxa de sucesso e mudanças feitas",
      },
      {
        id: "antes-depois",
        descricao: "Antes e depois das telas em imagens",
        verificacao:
          "Imagens comparativas presentes no repositório e exibidas no README",
      },
    ],
  },
  { id: "mapeamento-fluxo-valor", nome: "Mapeamento de Fluxo de Valor (VSM)", areaSlug: "gestao" as string | null, subareaSlug: "agile-coach", nivel: "Intermediário", objetivo: "Identificar desperdícios e gargalos em um fluxo de entrega real ou simulado, otimizando o time-to-market da engenharia.", ferramentas: ["Miro ou Mural", "Jira", "Excel ou Planilhas Google"], passosSimplificados: ["Mapeie todas as etapas do processo atual de desenvolvimento", "Meça o tempo de processamento e o tempo de espera de cada fase", "Calcule a eficiência total do ciclo de entrega", "Proponha um plano de ação para eliminar os três principais gargalos"], entregavel: "Quadro público com o VSM atual, o futuro e o plano de melhoria contínua.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Mapeei o fluxo de valor de um time técnico eliminando desperdícios operacionais. Melhorei a visibilidade de eficiência do processo.", proximoProjeto: "Métricas de Fluxo com Kanban Avançado" },
  { id: "app-financas-kotlin", nome: "Aplicativo de Finanças Pessoais", areaSlug: "mobile" as string | null, subareaSlug: "android-nativo", nivel: "Intermediário", objetivo: "Desenvolver uma aplicação fluida para controle financeiro aplicando a arquitetura moderna recomendada pelo Google.", ferramentas: ["Kotlin", "Jetpack Compose", "Room Database", "MVVM"], passosSimplificados: ["Crie a interface reativa com Jetpack Compose", "Configure o Room local para persistir receitas e despesas", "Implemente o fluxo de navegação entre telas de resumo e cadastro", "Adicione um gráfico simples de gastos por categoria"], entregavel: "Código-fonte no GitHub com APK gerado nas releases.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Criei um app nativo de finanças pessoais em Kotlin e Jetpack Compose. Apliquei arquitetura MVVM e banco de dados local com Room.", proximoProjeto: "Integração de API REST com Coroutines e Retrofit" },
  { id: "esteira-sast-seguranca", nome: "Esteira de Análise Estática de Segurança (SAST)", areaSlug: "ciberseguranca" as string | null, subareaSlug: "appsec", nivel: "Intermediário", objetivo: "Automatizar a varredura de vulnerabilidades no código-fonte durante o processo de build, antes do deploy.", ferramentas: ["GitHub Actions", "SonarQube", "Semgrep", "Node.js"], passosSimplificados: ["Configure uma pipeline base no GitHub Actions", "Integre o Semgrep para escanear um projeto propositalmente vulnerável", "Defina regras para bloquear o build caso falhas graves apareçam", "Gere relatórios automatizados de correção para o time de desenvolvimento"], entregavel: "Workflow do GitHub Actions funcional e relatório de falhas mitigadas.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Implementei uma esteira automatizada de SAST em uma pipeline de CI/CD. Agora vulnerabilidades são interceptadas antes de chegarem em produção.", proximoProjeto: "Análise Dinâmica de Segurança (DAST) em APIs" },
  { id: "modelo-previsao-churn", nome: "Modelo de Previsão de Churn", areaSlug: "dados" as string | null, subareaSlug: "cientista-dados", nivel: "Intermediário", objetivo: "Construir um modelo preditivo ponta a ponta para identificar clientes com risco de cancelar o serviço.", ferramentas: ["Python", "Scikit-Learn", "XGBoost", "Jupyter Notebook"], passosSimplificados: ["Prepare os dados históricos tratando o desbalanceamento de classes", "Faça engenharia de variáveis criando indicadores de engajamento", "Treine e compare modelos de regressão logística e XGBoost", "Avalie o desempenho com precisão, recall e curva ROC"], entregavel: "Notebook de modelagem estruturado e arquivo do modelo treinado exportado.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Desenvolvi um modelo de machine learning para prever cancelamento de clientes. Alcancei métricas sólidas de recall para guiar ações de retenção.", proximoProjeto: "Deploy de Modelo Preditivo via API com FastAPI" },
  { id: "auditoria-iam-least-privilege", nome: "Auditoria IAM de Menor Privilégio", areaSlug: "cloud" as string | null, subareaSlug: "cloud-security", nivel: "Avançado", objetivo: "Analisar e restringir permissões excessivas em contas de nuvem para reduzir a superfície de ataque.", ferramentas: ["AWS IAM", "CloudTrail", "IAM Access Analyzer", "Python"], passosSimplificados: ["Colete o relatório de credenciais e permissões atuais da conta", "Cruze as permissões concedidas com os logs reais de uso do CloudTrail", "Identifique usuários e serviços com acessos administrativos desnecessários", "Gere políticas JSON restritas seguindo o princípio de menor privilégio"], entregavel: "Relatório de riscos encontrados e as novas políticas remediadas em JSON.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Realizei uma auditoria de segurança IAM em ambiente cloud. Reduzi acessos excessivos aplicando políticas estritas de menor privilégio.", proximoProjeto: "Segurança de Redes em Nuvem e Configuração de WAF" },
  { id: "biblioteca-componentes-acessiveis", nome: "Design System Tokenizado", areaSlug: "uxui" as string | null, subareaSlug: "design-systems", nivel: "Intermediário", objetivo: "Criar uma biblioteca de componentes consistentes e acessíveis, base para escalar múltiplos produtos digitais.", ferramentas: ["Figma", "Design Tokens", "Style Dictionary", "Storybook"], passosSimplificados: ["Defina a estrutura de tokens para cores, tipografia e espaçamento", "Construa componentes básicos reutilizáveis como botões e inputs no Figma", "Exporte os tokens em JSON usando o Style Dictionary", "Documente o comportamento visual e os estados de cada componente"], entregavel: "Link do arquivo público do Figma e a documentação de tokens gerada.", comoPublicar: "Figma público", sugestaoLinkedIn: "Estruturei a fundação de um design system com tokens semânticos e componentes no Figma. Foco em consistência de marca e escala técnica.", proximoProjeto: "Componentização de UI com React e Storybook" },
  { id: "pipeline-ci-cd-vulnerabilidades", nome: "Pipeline de Integração Segura DevSecOps", areaSlug: "devsecops" as string | null, nivel: "Avançado", objetivo: "Integrar checagens automáticas de segurança em cada etapa do ciclo de vida do desenvolvimento.", ferramentas: ["GitHub Actions", "Trivy", "OWASP ZAP", "Docker"], passosSimplificados: ["Crie uma pipeline automatizada de build e empacotamento Docker", "Insira o Trivy para escanear vulnerabilidades na imagem gerada", "Execute testes dinâmicos básicos de segurança com OWASP ZAP", "Condicione o deploy em homologação ao sucesso dos testes"], entregavel: "Arquivo de configuração da pipeline operacional e histórico de execuções limpas.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Implementei uma esteira automatizada de DevSecOps. Imagens Docker e endpoints passaram a ser checados contra vulnerabilidades a cada commit.", proximoProjeto: "Monitoramento de Segurança em Tempo Real com Falco no Kubernetes" },
  { id: "dashboard-alocacao-custos-cloud", nome: "Otimização de Custos Cloud com FinOps", areaSlug: "cloud" as string | null, subareaSlug: "finops", nivel: "Avançado", objetivo: "Analisar dados de faturamento de nuvem para descobrir desperdícios de recursos ociosos e propor economia.", ferramentas: ["AWS Cost Explorer ou Azure Cost Management", "Python", "Looker Studio"], passosSimplificados: ["Extraia dados detalhados de faturamento mensal da nuvem", "Categorize os custos usando tags de ambiente e de equipe", "Identifique instâncias subutilizadas ou volumes de disco órfãos", "Crie um relatório de economia sugerindo redimensionamento de recursos"], entregavel: "Relatório analítico com plano de redução de custos e painel explicativo.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Desenvolvi um estudo prático de FinOps focado em contenção de gastos na nuvem. Identifiquei oportunidades de economia por rightsizing.", proximoProjeto: "Automação de Desligamento de Instâncias Fora do Horário Comercial" },
  { id: "app-clima-tempo", nome: "Aplicativo de Clima e Tempo", areaSlug: "mobile" as string | null, subareaSlug: "flutter", nivel: "Iniciante", objetivo: "Criar uma aplicação móvel multiplataforma que consome dados meteorológicos em tempo real.", ferramentas: ["Flutter", "Dart", "Pacote Http", "OpenWeatherMap API"], passosSimplificados: ["Monte o layout da tela principal exibindo os dados climáticos", "Implemente a requisição HTTP para a API de clima usando Dart", "Trate os estados de carregamento, sucesso e erro de conexão", "Adicione um campo de busca para consultar o clima de outras cidades"], entregavel: "Código-fonte no GitHub com README detalhando o funcionamento.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Desenvolvi meu primeiro aplicativo em Flutter para consulta de clima em tempo real. Pratiquei consumo de APIs REST e gerenciamento de estado.", proximoProjeto: "App de Clima com Cache Local e Geolocalização" },
  { id: "analise-artefatos-memoria-ram", nome: "Análise Forense de Memória RAM", areaSlug: "ciberseguranca" as string | null, subareaSlug: "forense-digital", nivel: "Intermediário", objetivo: "Extrair evidências digitais de um dump de memória RAM, simulando a resposta a um incidente de segurança.", ferramentas: ["Volatility Framework", "Linux", "FTK Imager"], passosSimplificados: ["Obtenha ou gere uma imagem de memória RAM de um sistema de teste", "Identifique o perfil correto do sistema operacional no Volatility", "Liste processos ativos ocultos ou suspeitos no momento da captura", "Extraia conexões de rede ativas e comandos executados no terminal"], entregavel: "Relatório forense com os artefatos encontrados e a linha do tempo do incidente.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Realizei uma investigação forense em um dump de memória RAM usando Volatility. Identifiquei processos ocultos de um malware simulado.", proximoProjeto: "Análise Forense de Sistemas de Arquivos NTFS e EXT4" },
  { id: "inventario-conformidade-lgpd", nome: "Inventário de Dados e Conformidade LGPD", areaSlug: "ciberseguranca" as string | null, subareaSlug: "grc", nivel: "Intermediário", objetivo: "Mapear o fluxo de dados pessoais dentro de um sistema fictício para garantir aderência à LGPD.", ferramentas: ["Excel ou Planilhas Google", "Miro", "Modelo de RIPD"], passosSimplificados: ["Identifique todos os pontos de coleta de dados pessoais no sistema", "Classifique os dados por nível de sensibilidade", "Mapeie as bases legais adequadas para cada atividade de tratamento", "Elabore um Relatório de Impacto à Proteção de Dados básico"], entregavel: "Planilha de mapeamento de dados e documento de governança estruturado.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Desenvolvi um inventário de dados para conformidade com a LGPD. Mapeei bases legais e avaliei riscos de privacidade.", proximoProjeto: "Criação de Políticas Corporativas de Segurança da Informação" },
  { id: "experimento-teste-ab-conversao", nome: "Planejamento e Análise de Teste A/B", areaSlug: "produto" as string | null, subareaSlug: "growth-product", nivel: "Intermediário", objetivo: "Estruturar e avaliar um teste estatístico de conversão para validar hipóteses de crescimento.", ferramentas: ["Python", "Statsmodels", "Planilhas Google"], passosSimplificados: ["Defina a hipótese de crescimento e a métrica primária de sucesso", "Calcule o tamanho de amostra mínimo para relevância estatística", "Simule e colete os resultados brutos das duas variantes", "Aplique teste de hipótese para declarar a versão vencedora"], entregavel: "Documento de especificação do experimento e análise estatística dos resultados.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Formulei e analisei um teste A/B focado em conversão. Garanti relevância estatística com Python antes de validar a mudança de produto.", proximoProjeto: "Mapeamento de Funil de Growth e Modelagem de Atribuição" },
  { id: "lista-tarefas-swiftui", nome: "Aplicativo de Notas e Tarefas Nativo", areaSlug: "mobile" as string | null, subareaSlug: "ios-nativo", nivel: "Intermediário", objetivo: "Construir um app iOS fluido usando práticas modernas da Apple e armazenamento nativo.", ferramentas: ["Swift", "SwiftUI", "SwiftData ou CoreData"], passosSimplificados: ["Desenvolva a interface com listas dinâmicas e formulários em SwiftUI", "Configure o modelo de dados local com SwiftData", "Implemente ordenação e filtro de tarefas concluídas", "Adicione suporte a tema claro e escuro do sistema"], entregavel: "Repositório com código limpo e visualizações configuradas no Canvas.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Desenvolvi um app nativo para iOS usando Swift e SwiftUI. Explorei persistência de dados com o ecossistema SwiftData.", proximoProjeto: "Integração do App com Widgets de Tela de Início" },
  { id: "classificador-fraude-cartao", nome: "Classificador de Fraude em Cartão de Crédito", areaSlug: "ia" as string | null, subareaSlug: "machine-learning", nivel: "Intermediário", objetivo: "Criar um pipeline de machine learning para detectar transações financeiras suspeitas de forma automatizada.", ferramentas: ["Python", "Scikit-Learn", "Imbalanced-Learn", "Pandas"], passosSimplificados: ["Trate os dados desbalanceados com técnicas como SMOTE", "Selecione as variáveis relevantes removendo ruído estatístico", "Treine algoritmos de Random Forest e analise a matriz de confusão", "Ajuste hiperparâmetros para minimizar falsos negativos críticos"], entregavel: "Notebook ponta a ponta com o classificador e as métricas de validação.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Construí um classificador de machine learning para detecção de fraude bancária. Tratei desbalanceamento severo de classes.", proximoProjeto: "Otimização de Hiperparâmetros em Escala com Optuna" },
  { id: "pipeline-treinamento-continuo-mlflow", nome: "Orquestração de Modelos com MLflow", areaSlug: "ia" as string | null, subareaSlug: "mlops", nivel: "Avançado", objetivo: "Gerenciar o ciclo de vida de modelos de machine learning garantindo reprodutibilidade e rastreamento de experimentos.", ferramentas: ["MLflow", "Python", "Docker", "DVC"], passosSimplificados: ["Configure o servidor MLflow para rastreamento central de parâmetros", "Versione os dados de treinamento usando DVC", "Registre diferentes iterações do modelo medindo a variação de performance", "Publique a melhor versão em um registro pronto para produção"], entregavel: "Código de orquestração do pipeline e histórico de execuções gravado no MLflow.", comoPublicar: "Hugging Face Spaces", sugestaoLinkedIn: "Montei um ambiente de MLOps com MLflow e DVC. Automatizei o rastreamento de métricas e o versionamento de dados.", proximoProjeto: "Deploy de Modelos de ML em Clusters Kubernetes" },
  { id: "portal-desenvolvedor-internal", nome: "Portal Interno do Desenvolvedor", areaSlug: "devops" as string | null, subareaSlug: "platform-engineer", nivel: "Avançado", objetivo: "Criar uma plataforma centralizada que permite ao time criar microsserviços padronizados com poucos cliques.", ferramentas: ["Backstage", "Docker", "Node.js", "GitHub API"], passosSimplificados: ["Instale e configure a base do Backstage localmente", "Crie um template de arquitetura Node.js padrão", "Integre a automação para criar repositórios no GitHub", "Configure o catálogo de software para exibir dependências técnicas"], entregavel: "Instância funcional do portal documentada e templates de arquitetura ativos.", comoPublicar: "Render ou Railway", sugestaoLinkedIn: "Implementei uma plataforma interna de desenvolvimento com Backstage. Reduzi o tempo de setup de novos projetos com templates automatizados.", proximoProjeto: "Monitoramento de Consumo de Recursos da Plataforma" },
  { id: "relatorio-status-portfolio-projetos", nome: "Relatório de Status de Portfólio Corporativo", areaSlug: "gestao" as string | null, subareaSlug: "pmo", nivel: "Intermediário", objetivo: "Consolidar cronogramas e orçamentos de vários projetos de TI em um relatório gerencial claro para stakeholders.", ferramentas: ["MS Project ou Smartsheet", "Excel", "PowerPoint"], passosSimplificados: ["Colete o status e o percentual de conclusão de três projetos fictícios", "Calcule a variação de custo e prazo com Análise de Valor Agregado", "Mapeie riscos ativos e defina planos de contingência", "Construa um relatório executivo com semáforos de saúde do portfólio"], entregavel: "Apresentação executiva ou painel de controle de portfólio estruturado.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Elaborei um relatório de governança de portfólio de TI aplicando Análise de Valor Agregado. Visibilidade clara de prazo e orçamento.", proximoProjeto: "Estruturação de um Escritório de Projetos Ágil" },
  { id: "plano-go-to-market-funcionalidade", nome: "Plano Go-to-Market de Nova Funcionalidade", areaSlug: "produto" as string | null, subareaSlug: "product-marketing", nivel: "Intermediário", objetivo: "Planejar a estratégia de lançamento e posicionamento de um novo recurso para garantir adoção dos usuários.", ferramentas: ["Notion", "Matriz de posicionamento", "Canais de distribuição"], passosSimplificados: ["Defina a persona-alvo e os diferenciais do novo recurso", "Crie mensagens-chave e proposta de valor por segmento", "Mapeie os canais de comunicação interna e externa do lançamento", "Estabeleça métricas de sucesso de ativação e uso inicial"], entregavel: "Documento completo de Go-to-Market detalhando o lançamento.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Estruturei um plano de Go-to-Market completo para o lançamento de um produto digital. Conectei marketing e engenharia para maximizar a adoção.", proximoProjeto: "Análise Competitiva de Mercado e Posicionamento de Preço" },
  { id: "central-documentacao-playbooks", nome: "Central de Operações e Playbooks de Produto", areaSlug: "produto" as string | null, subareaSlug: "product-ops", nivel: "Intermediário", objetivo: "Padronizar rituais, ferramentas e documentação para aumentar a eficiência operacional de times de produto.", ferramentas: ["Notion", "Miro", "Métricas de eficiência"], passosSimplificados: ["Mapeie as ferramentas usadas pelas squads de produto", "Crie templates padronizados de PRD e de relatório de experimentos", "Defina o fluxo unificado de coleta e triagem de feedback de clientes", "Estruture um repositório central de conhecimento navegável"], entregavel: "Espaço público organizado com guias de processo e templates práticos.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Desenvolvi um repositório central de Product Operations. Padronizei processos para eliminar fricção entre times de produto.", proximoProjeto: "Implementação de Ferramentas de Product Analytics" },
  { id: "backlog-priorizado-e-historias", nome: "Backlog e Histórias de Usuário", areaSlug: "produto" as string | null, subareaSlug: "product-owner", nivel: "Iniciante", objetivo: "Transformar requisitos abstratos em itens claros, refinados e acionáveis para a sprint de engenharia.", ferramentas: ["Jira ou Trello", "Notion", "Critérios de aceite"], passosSimplificados: ["Escreva histórias de usuário no padrão ágil", "Defina critérios de aceite no formato Dado, Quando, Então", "Aplique a técnica MoSCoW para priorizar as histórias", "Organize os itens visualmente em uma estrutura de épicos"], entregavel: "Quadro público de gestão ágil com histórias refinadas.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Estruturei um backlog de produto refinando histórias com critérios de aceite detalhados. Pronto para a engenharia executar sem bloqueios.", proximoProjeto: "Mapeamento de Requisitos com User Story Mapping" },
  { id: "otimizacao-prompts-suporte", nome: "Sistema de Prompts para Atendimento", areaSlug: "ia" as string | null, subareaSlug: "prompt-engineering", nivel: "Iniciante", objetivo: "Criar prompts otimizados e robustos para guiar modelos de IA na geração de respostas padronizadas de suporte.", ferramentas: ["API de LLM", "Markdown", "Técnicas de few-shot"], passosSimplificados: ["Desenvolva o prompt de sistema definindo persona, regras e restrições", "Insira exemplos práticos de interações corretas", "Adicione delimitação de contexto para reduzir alucinação", "Crie cenários de teste simulando clientes insatisfeitos"], entregavel: "Guia de engenharia de prompts documentado com versões estruturadas.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Desenvolvi um sistema de engenharia de prompts para automação de atendimento. Respostas padronizadas e com menos alucinação.", proximoProjeto: "Criação de Agentes Autônomos com LangChain" },
  { id: "teste-carga-k6-api", nome: "Testes de Carga e Performance com k6", areaSlug: "qa" as string | null, subareaSlug: "qa-performance", nivel: "Intermediário", objetivo: "Avaliar o comportamento e a estabilidade de uma API sob condições severas de acessos simultâneos.", ferramentas: ["k6", "JavaScript", "Grafana", "Docker"], passosSimplificados: ["Escreva um script k6 simulando requisições paralelas em uma API", "Configure cenários de rampa aumentando os usuários virtuais", "Monitore percentis de tempo de resposta e taxa de erro", "Identifique o ponto de quebra analisando os gargalos de recurso"], entregavel: "Scripts k6 configurados e relatório dos limites da API.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Realizei testes de estresse em uma API usando k6. Mapeei gargalos de resposta sob picos de requisições simultâneas.", proximoProjeto: "Monitoramento de APM e Diagnóstico de Performance" },
  { id: "app-delivery-comida", nome: "Interface Móvel de Delivery", areaSlug: "mobile" as string | null, subareaSlug: "react-native", nivel: "Intermediário", objetivo: "Construir um aplicativo móvel multiplataforma com layouts modernos e navegação fluida.", ferramentas: ["React Native", "TypeScript", "Expo", "React Navigation"], passosSimplificados: ["Configure a base do projeto usando Expo e TypeScript", "Crie a tela de feed listando restaurantes com paginação", "Implemente a navegação para a tela de detalhes de pratos", "Desenvolva o estado global do carrinho de compras"], entregavel: "Código-fonte no GitHub com instruções de execução no Expo Go.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Desenvolvi uma aplicação de delivery multiplataforma com React Native e Expo. Pratiquei componentização e navegação por abas.", proximoProjeto: "Animações Avançadas de Interface com Reanimated" },
  { id: "auditoria-seguranca-ambiente-isolado", nome: "Auditoria de Segurança em Laboratório Controlado", areaSlug: "ciberseguranca" as string | null, subareaSlug: "red-team", nivel: "Avançado", objetivo: "Simular ataques éticos em máquinas de teste próprias e autorizadas para identificar vulnerabilidades e propor correções.", ferramentas: ["Kali Linux", "Nmap", "Metasploit", "VirtualBox"], passosSimplificados: ["Suba uma máquina virtual propositalmente vulnerável em rede isolada", "Faça o escaneamento de portas descobrindo versões de serviços", "Identifique falhas conhecidas e execute exploits controlados", "Registre as ações e documente as correções exatas para cada falha"], entregavel: "Relatório de pentest ético e controlado com descobertas e remediações.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Executei uma auditoria ética em ambiente de laboratório isolado. Identifiquei brechas e produzi documentação técnica de correção.", proximoProjeto: "Técnicas Avançadas de Pós-exploração em Laboratório" },
  { id: "facilitacao-metricas-sprint", nome: "Facilitação e Métricas de Sprint", areaSlug: "gestao" as string | null, subareaSlug: "scrum-master", nivel: "Iniciante", objetivo: "Gerenciar um ciclo ágil garantindo visibilidade por meio do acompanhamento de métricas de entrega.", ferramentas: ["Jira ou Trello", "Excel", "Gráfico de burndown"], passosSimplificados: ["Simule o planejamento e a abertura de uma sprint com tarefas estimadas", "Atualize o quadro diariamente simulando impedimentos", "Gere e analise o gráfico de burndown ao final do ciclo", "Prepare uma dinâmica estruturada para a retrospectiva do time"], entregavel: "Quadro ágil montado e documento de retrospectiva com plano de melhoria.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Facilitei rituais ágeis simulando desafios reais de entrega. Analisei o burndown para extrair melhorias acionáveis de processo.", proximoProjeto: "Métricas de Fluxo e Eficiência de Time" },
  { id: "guia-estilo-e-interface-landing-page", nome: "Interface Visual de Landing Page", areaSlug: "uxui" as string | null, subareaSlug: "ui-design", nivel: "Iniciante", objetivo: "Desenhar um layout moderno com hierarquia visual clara e foco em conversão.", ferramentas: ["Figma", "Auto Layout", "Componentes"], passosSimplificados: ["Crie o moodboard definindo paleta e tipografia", "Construa o wireframe de baixa fidelidade da página", "Aplique estilos consistentes e componentes reutilizáveis", "Desenvolva as variações responsivas para desktop e mobile"], entregavel: "Link de um arquivo público do Figma com a interface finalizada.", comoPublicar: "Figma público", sugestaoLinkedIn: "Criei o design visual completo de uma landing page responsiva no Figma. Foquei em alinhamento, tipografia e fluxo de conversão.", proximoProjeto: "Design de Dashboards e Interfaces de Dados" },
  { id: "plano-pesquisa-e-entrevistas", nome: "Planejamento e Execução de Pesquisa UX", areaSlug: "uxui" as string | null, subareaSlug: "ux-research", nivel: "Iniciante", objetivo: "Estruturar métodos qualitativos e quantitativos para coletar dados reais sobre o comportamento de clientes.", ferramentas: ["Formulários Google", "Notion", "Roteiros de entrevista"], passosSimplificados: ["Defina os objetivos e as perguntas da pesquisa", "Elabore um questionário quantitativo e valide com uma amostra", "Escreva um roteiro estruturado para entrevistas qualitativas", "Sintetize os aprendizados agrupando-os por afinidade"], entregavel: "Relatório com metodologia, dados agregados e insights práticos.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Planejei e executei uma pesquisa de UX ponta a ponta. Traduzi dados de comportamento em recomendações de interface.", proximoProjeto: "Testes de Usabilidade Moderados com Métricas" },
  { id: "diagrama-casos-uso-e-requisitos", nome: "Modelagem de Requisitos de um Sistema", areaSlug: "analise-sistemas" as string | null, nivel: "Iniciante", objetivo: "Documentar requisitos funcionais e estruturar os diagramas que guiam a construção de um novo software.", ferramentas: ["draw.io ou Lucidchart", "Markdown", "UML"], passosSimplificados: ["Levante os requisitos funcionais e não funcionais do sistema", "Desenvolva o diagrama de casos de uso mapeando os atores", "Crie o diagrama entidade-relacionamento da persistência", "Escreva o dicionário de dados descrevendo os tipos de campo"], entregavel: "Documento de especificação de requisitos estruturado em Markdown.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Trabalhei na análise inicial de um sistema modelando requisitos e diagramas UML. Base arquitetural sólida antes de escrever código.", proximoProjeto: "Diagramas de Sequência e Atividades em UML" },
  { id: "especificacao-tecnica-microsservicos", nome: "Especificação Técnica de Microsserviços", areaSlug: "analise-sistemas" as string | null, nivel: "Intermediário", objetivo: "Desenhar a arquitetura de comunicação e os contratos de dados entre microsserviços desacoplados.", ferramentas: ["Swagger ou OpenAPI", "draw.io", "Markdown"], passosSimplificados: ["Defina as responsabilidades de negócio de cada microsserviço", "Escreva os contratos de API no padrão OpenAPI", "Mapeie fluxos de comunicação assíncrona com mensageria", "Desenvolva diagramas de componentes da infraestrutura"], entregavel: "Especificação arquitetural detalhada com arquivos YAML de API.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Desenhei a arquitetura de integração de um ecossistema de microsserviços. Defini contratos com OpenAPI garantindo padronização.", proximoProjeto: "Padrões de Resiliência como Circuit Breaker" },
  { id: "smart-contract-token-erc20", nome: "Token ERC20 Próprio", areaSlug: "blockchain" as string | null, nivel: "Intermediário", objetivo: "Criar e implantar um contrato inteligente padrão na blockchain para entender os fundamentos de Web3.", ferramentas: ["Solidity", "Remix IDE", "MetaMask", "Testnet Sepolia"], passosSimplificados: ["Escreva a lógica do token herdando o padrão da OpenZeppelin", "Compile o contrato usando o compilador integrado do Remix", "Faça testes locais simulando transferências e saldos", "Publique o contrato na rede de testes usando MetaMask"], entregavel: "Código em Solidity e endereço verificado na rede de testes.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Desenvolvi e implantei meu primeiro contrato inteligente em Solidity seguindo o padrão ERC20. Entrada prática no desenvolvimento Web3.", proximoProjeto: "Contratos de NFT no Padrão ERC721" },
  { id: "dapp-votacao-descentralizada", nome: "Aplicativo de Votação Descentralizada", areaSlug: "blockchain" as string | null, nivel: "Intermediário", objetivo: "Construir uma aplicação descentralizada completa integrando um contrato inteligente a uma interface web.", ferramentas: ["Solidity", "React", "Ethers.js", "Hardhat"], passosSimplificados: ["Escreva um contrato de votação impedindo voto duplicado por endereço", "Configure testes automatizados locais com Hardhat", "Desenvolva a interface React para listar opções e conectar carteiras", "Conecte a interface ao contrato usando Ethers.js"], entregavel: "Interface publicada conectada ao contrato ativo na rede de testes.", comoPublicar: "Vercel", sugestaoLinkedIn: "Desenvolvi um dApp completo de votação integrando React com contratos inteligentes em Solidity.", proximoProjeto: "Governança Descentralizada com DAOs" },
  { id: "servidor-web-linux-seguro", nome: "Servidor Linux Seguro", areaSlug: "infraestrutura" as string | null, nivel: "Iniciante", objetivo: "Configurar um servidor estável e protegido para hospedar sites com boas práticas de segurança.", ferramentas: ["Ubuntu Server", "Nginx", "Chaves SSH", "UFW"], passosSimplificados: ["Instale o Linux em uma máquina virtual ou VPS", "Desative o login por senha configurando chaves SSH", "Instale o Nginx e configure um bloco de servidor", "Habilite o firewall UFW liberando apenas as portas necessárias"], entregavel: "Servidor ativo ou documentação detalhada dos comandos executados.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Configurei manualmente um servidor Linux protegido com chaves SSH e regras estritas de firewall. Base sólida de infraestrutura.", proximoProjeto: "Automação de Servidores com Shell Script" },
  { id: "infraestrutura-como-codigo-terraform", nome: "Infraestrutura como Código com Terraform", areaSlug: "infraestrutura" as string | null, nivel: "Intermediário", objetivo: "Automatizar a criação de redes e servidores na nuvem usando código declarativo e replicável.", ferramentas: ["Terraform", "AWS ou Azure", "Git"], passosSimplificados: ["Instale a CLI do Terraform e configure as credenciais do provedor", "Escreva a configuração para criar uma VPC e sub-redes", "Configure um grupo de segurança abrindo só as portas necessárias", "Provisione uma instância virtual associando os recursos criados"], entregavel: "Arquivos de configuração Terraform funcionais no repositório.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Automatizei a criação de um ambiente completo de infraestrutura via Terraform. Código limpo eliminando tarefas manuais na nuvem.", proximoProjeto: "Módulos e Estado Remoto no Terraform" },
  { id: "sensor-temperatura-esp32", nome: "Monitor de Temperatura com ESP32", areaSlug: "iot" as string | null, nivel: "Iniciante", objetivo: "Construir um protótipo físico ou simulado que lê dados ambientais de sensores de forma contínua.", ferramentas: ["Arduino IDE ou Wokwi", "ESP32", "Sensor DHT11", "C++"], passosSimplificados: ["Monte o circuito conectando o sensor aos pinos do ESP32", "Escreva o firmware em C++ para ler o sensor periodicamente", "Configure a saída serial para exibir as leituras", "Adicione validações para tratar falha de leitura"], entregavel: "Código do firmware funcional e link do circuito simulado.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Desenvolvi um protótipo de IoT para leitura de temperatura com ESP32. Explorei firmware embarcado e manipulação de sensores em C++.", proximoProjeto: "Envio de Dados de Sensores para a Nuvem" },
  { id: "estacao-meteorologica-mqtt", nome: "Estação Meteorológica com MQTT", areaSlug: "iot" as string | null, nivel: "Intermediário", objetivo: "Conectar dispositivos físicos à internet transmitindo métricas de sensores pelo protocolo MQTT.", ferramentas: ["ESP32", "C++", "Broker MQTT", "Node-RED"], passosSimplificados: ["Configure a conexão Wi-Fi no firmware do ESP32", "Implemente o cliente MQTT publicando dados em tópicos", "Conecte um broker MQTT na nuvem para receber as mensagens", "Construa um painel no Node-RED para visualizar o histórico"], entregavel: "Código integrado e painel funcional exibindo telemetria na nuvem.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Construí uma estação de telemetria conectando hardware à nuvem via MQTT. Dados transmitidos em tempo real.", proximoProjeto: "Segurança e Criptografia em Dispositivos IoT" },
  { id: "programa-cobol-processamento-arquivos", nome: "Processamento de Arquivos em COBOL", areaSlug: "mainframe" as string | null, nivel: "Iniciante", objetivo: "Escrever rotinas estruturadas para leitura e manipulação de registros em lote, como nos sistemas legados.", ferramentas: ["GnuCOBOL", "VS Code", "Linux"], passosSimplificados: ["Defina a estrutura de divisões obrigatória do programa COBOL", "Configure o mapeamento do arquivo de entrada com dados de clientes", "Escreva a lógica de iteração lendo cada registro e calculando totais", "Gere um arquivo formatado de saída com o relatório final"], entregavel: "Código-fonte COBOL compilável e arquivos de teste de entrada e saída.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Escrevi meu primeiro programa estruturado em COBOL focado em processamento em lote. Entendendo a lógica dos sistemas transacionais.", proximoProjeto: "Manipulação de Arquivos Indexados VSAM" },
  { id: "rotina-jcl-atualizacao-cadastros", nome: "Automação de Rotinas em Lote com JCL", areaSlug: "mainframe" as string | null, nivel: "Intermediário", objetivo: "Desenvolver cartões de controle para orquestrar passos sequenciais de programas em ambientes mainframe.", ferramentas: ["JCL", "IBM Z Xplore ou simuladores", "VSAM"], passosSimplificados: ["Escreva o cabeçalho do JOB definindo limites de memória e execução", "Configure passos EXEC para executar utilitários do sistema", "Defina as alocações de arquivo de entrada e saída", "Implemente condicionais para tratar códigos de retorno de erro"], entregavel: "Scripts JCL estruturados e comentados prontos para orquestração.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Desenvolvi rotinas JCL para controle de jobs em lote. Orquestrei cargas sequenciais lidando com alocação de recursos.", proximoProjeto: "Integração com CICS para Transações Online" },
  { id: "configuracao-alertas-prometheus-grafana", nome: "Observabilidade com Prometheus e Grafana", areaSlug: "sre" as string | null, nivel: "Iniciante", objetivo: "Coletar métricas de desempenho de uma aplicação e montar painéis visuais para monitoramento.", ferramentas: ["Prometheus", "Grafana", "Node Exporter", "Docker"], passosSimplificados: ["Suba o Prometheus e o Grafana em containers locais", "Configure o Node Exporter para expor métricas do sistema", "Ajuste o Prometheus para coletar as métricas expostas", "Crie um painel no Grafana com CPU, memória e disco"], entregavel: "Configurações funcionais e capturas dos painéis criados.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Implementei uma stack de observabilidade com Prometheus e Grafana. Métricas de infraestrutura visualizadas em tempo real.", proximoProjeto: "Instrumentação com Métricas Customizadas de Negócio" },
  { id: "arquitetura-alta-disponibilidade-kubernetes", nome: "Arquitetura Resiliente no Kubernetes", areaSlug: "sre" as string | null, nivel: "Intermediário", objetivo: "Garantir disponibilidade contínua configurando auto-recuperação e escala automática de containers.", ferramentas: ["Kubernetes", "YAML", "kubectl"], passosSimplificados: ["Crie um manifesto de Deployment definindo réplicas da aplicação", "Configure liveness e readiness probes", "Implemente o autoscaler horizontal baseado em consumo de CPU", "Simule a queda de containers e documente a auto-recuperação"], entregavel: "Manifestos YAML do Kubernetes validados e operacionais.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Configurei políticas de alta disponibilidade e escala no Kubernetes. Garanti resiliência com probes automatizados de saúde.", proximoProjeto: "Estratégias de Deploy Canary e Blue-Green" },
  { id: "plano-desenvolvimento-individual", nome: "Plano de Desenvolvimento Individual", areaSlug: "carreira" as string | null, nivel: "Intermediário", objetivo: "Estruturar objetivos de carreira alinhando o aprendizado de competências com metas reais de crescimento.", ferramentas: ["Notion", "Matriz SWOT pessoal", "Metas SMART"], passosSimplificados: ["Faça uma autoanálise identificando forças e lacunas técnicas", "Defina três objetivos de médio prazo usando metas SMART", "Mapeie cursos, certificações e projetos necessários", "Estabeleça um cronograma de revisão trimestral do progresso"], entregavel: "Plano de carreira pessoal público e estruturado.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Estruturei meu Plano de Desenvolvimento Individual focado no mercado de tecnologia. Objetivos claros para acelerar minha evolução.", proximoProjeto: "Portfólio de Alta Conversão com Projetos Reais" },
  { id: "mapeamento-competencias-lideranca-tecnica", nome: "Trilha de Liderança Técnica", areaSlug: "carreira" as string | null, nivel: "Avançado", objetivo: "Estruturar as competências necessárias para assumir papéis de liderança técnica como Tech Lead ou Arquiteto.", ferramentas: ["Notion", "Matriz de competências", "ADRs"], passosSimplificados: ["Mapeie os pilares técnicos, de liderança e de comunicação do cargo", "Crie um framework de avaliação de maturidade do time", "Desenvolva guias de tomada de decisão arquitetural com ADRs", "Elabore uma estratégia de mentoria para engenheiros juniores"], entregavel: "Framework de competências de engenharia sênior estruturado.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Desenvolvi um plano de competências para posições de liderança técnica em TI. Preparação contínua para guiar times.", proximoProjeto: "Governança de Comunidades Técnicas Internas" },
  { id: "micro-frontends-federation", nome: "Micro-frontends com Module Federation", areaSlug: "frontend" as string | null, nivel: "Avançado", objetivo: "Dividir uma aplicação web grande em blocos independentes, isolando times e carregando módulos em tempo de execução.", ferramentas: ["React", "Webpack 5", "Module Federation", "TypeScript"], passosSimplificados: ["Configure uma aplicação hospedeira e duas aplicações remotas", "Implemente o compartilhamento dinâmico de dependências comuns", "Garanta o isolamento de escopo de estilos e rotas", "Crie uma pipeline para publicar uma das aplicações de forma independente"], entregavel: "Monorepo funcional demonstrando a integração dos módulos em tempo real.", comoPublicar: "Vercel", sugestaoLinkedIn: "Arquitetei uma estrutura de micro-frontends com Module Federation. Desenvolvimento escalável com deploys independentes.", proximoProjeto: "Compartilhamento Avançado de Estado Global" },
  { id: "dashboard-financeiro-tempo-real", nome: "Dashboard Financeiro com WebSockets", areaSlug: "frontend" as string | null, nivel: "Avançado", objetivo: "Renderizar fluxos contínuos de dados sem recarregar a interface, como em sistemas de alta frequência.", ferramentas: ["Next.js", "Tailwind CSS", "Socket.io", "Chart.js"], passosSimplificados: ["Monte uma interface performática com Tailwind CSS", "Conecte o cliente via WebSocket escutando dados simulados", "Implemente gráficos de linha que atualizam continuamente", "Otimize a re-renderização para evitar travamentos visuais"], entregavel: "Aplicação web interativa consumindo fluxos de alta frequência.", comoPublicar: "Vercel", sugestaoLinkedIn: "Construí um painel de alta performance atualizado em tempo real via WebSockets. Interface otimizada contra re-renderizações.", proximoProjeto: "Service Workers e Sincronização Offline" },
  { id: "otimizacao-core-web-vitals-legado", nome: "Otimização de Core Web Vitals", areaSlug: "frontend" as string | null, nivel: "Avançado", objetivo: "Diagnosticar e reestruturar uma aplicação pesada para alcançar notas altas de performance no Lighthouse.", ferramentas: ["JavaScript", "Lighthouse", "Web Vitals", "Code Splitting"], passosSimplificados: ["Analise a página identificando gargalos de LCP e CLS", "Implemente carregamento tardio de imagens e fontes", "Aplique divisão de pacotes reduzindo o script inicial", "Elimine bloqueios de renderização com estilos críticos inline"], entregavel: "Repositório demonstrando o antes e depois com dados de performance.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Realizei uma otimização de performance focada em Core Web Vitals. Reduzi o carregamento inicial e o peso da rede.", proximoProjeto: "Renderização no Servidor Otimizada com Next.js" },
  { id: "gerenciador-estado-complexo-offline", nome: "Sincronização Offline de Estado", areaSlug: "frontend" as string | null, nivel: "Avançado", objetivo: "Criar uma aplicação resiliente que guarda ações locais durante quedas de internet e sincroniza ao reconectar.", ferramentas: ["React", "Zustand", "IndexedDB", "Service Workers"], passosSimplificados: ["Configure uma arquitetura de estado global com Zustand", "Integre persistência local automática com IndexedDB", "Detecte mudanças no status de conexão do navegador", "Implemente uma fila de requisições pendentes disparada ao reconectar"], entregavel: "Aplicação funcionando sem rede e sincronizando os dados ao voltar.", comoPublicar: "Vercel", sugestaoLinkedIn: "Desenvolvi um motor de sincronização offline para aplicações web. Usei IndexedDB para criar filas resilientes a falhas de rede.", proximoProjeto: "Aplicações PWA Completas com Armazenamento Avançado" },
  { id: "estrategia-testes-arquitetura-microsservicos", nome: "Estratégia de Testes para Microsserviços", areaSlug: "qa" as string | null, nivel: "Avançado", objetivo: "Desenhar a pirâmide de testes que garante a integridade de um ecossistema distribuído complexo.", ferramentas: ["Notion", "Mapas de cobertura", "Métricas de qualidade"], passosSimplificados: ["Mapeie os pontos de integração críticos entre os microsserviços", "Defina os tipos de teste recomendados para cada camada", "Estabeleça métricas mínimas de cobertura e portões de qualidade", "Escreva cenários mitigando falhas em fluxos distribuídos"], entregavel: "Documentação de governança e estratégia de qualidade de software.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Arquitetei a estratégia de testes de um sistema de microsserviços. Modelos escaláveis focados em mitigar falhas distribuídas.", proximoProjeto: "Automação de Testes de Mutação" },
  { id: "automacao-testes-visuais-regressao", nome: "Testes Visuais de Regressão", areaSlug: "qa" as string | null, nivel: "Avançado", objetivo: "Interceptar alterações indesejadas de layout comparando imagens capturadas automaticamente.", ferramentas: ["Playwright", "TypeScript", "Snapshots visuais"], passosSimplificados: ["Configure o Playwright integrado a testes com TypeScript", "Escreva scripts para capturar telas em resoluções diferentes", "Configure margens de tolerância para a comparação de imagens", "Gere relatórios exibindo as diferenças visuais em caso de falha"], entregavel: "Repositório executando validações visuais com relatórios.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Implementei testes de regressão visual automatizados com Playwright. Desvios de layout passaram a ser pegos no build.", proximoProjeto: "Testes de Acessibilidade Automatizados na Pipeline" },
  { id: "esteira-testes-contrato-pact", nome: "Testes de Contrato com Pact", areaSlug: "qa" as string | null, nivel: "Avançado", objetivo: "Garantir a integridade da comunicação entre consumidores e provedores de API sem depender de testes lentos.", ferramentas: ["Pact", "JavaScript", "GitHub Actions"], passosSimplificados: ["Defina o contrato descrevendo as respostas esperadas da API", "Execute as validações do lado do consumidor gerando os stubs", "Configure a verificação automatizada dos contratos no provedor", "Bloqueie alterações que quebrem contratos antes do deploy"], entregavel: "Configuração completa de testes de contrato operacionais entre serviços.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Reduzi quebras de integração entre sistemas adotando testes de contrato com Pact. Validação desacoplada e rápida.", proximoProjeto: "Virtualização de Serviços e Ambientes de Mock" },
  { id: "planejamento-capacidade-alocacao-recursos", nome: "Planejamento de Capacidade de Times", areaSlug: "gestao" as string | null, nivel: "Avançado", objetivo: "Otimizar a alocação de engenheiros em múltiplos projetos evitando sobrecarga de trabalho.", ferramentas: ["Excel", "Métricas de velocidade", "Modelos de previsão"], passosSimplificados: ["Mapeie a velocidade histórica de entrega dos times", "Calcule o esforço estimado para as próximas iniciativas", "Desenvolva um modelo de previsão de capacidade", "Construa o plano de alocação equilibrando as habilidades do time"], entregavel: "Modelo analítico de planejamento de capacidade e relatório gerencial.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Desenvolvi um modelo de gestão de capacidade para engenharia. Garanti previsibilidade de entregas sem sobrecarregar o time.", proximoProjeto: "Modelos de Carreira e Incentivos Técnicos" },
  { id: "framework-governanca-ti-cobit", nome: "Framework de Governança de TI", areaSlug: "gestao" as string | null, nivel: "Avançado", objetivo: "Desenhar modelos de controle alinhando investimentos de TI aos objetivos comerciais da empresa.", ferramentas: ["Diretrizes COBIT", "Mapeamento de processos", "Matriz RACI"], passosSimplificados: ["Mapeie as metas corporativas com os objetivos de TI correspondentes", "Defina papéis e responsabilidades com uma matriz RACI", "Estabeleça processos de gestão de riscos e aquisições", "Crie indicadores de governança para auditoria contínua"], entregavel: "Manual de governança de TI adaptado ao contexto do negócio.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Estruturei um modelo de governança de TI baseado em boas práticas do COBIT. Conformidade, controle de risco e alinhamento de metas.", proximoProjeto: "Gestão Integrada de Riscos de TI" },
  { id: "gestao-crise-incidentes-criticos", nome: "Plano de Gestão de Crises de TI", areaSlug: "gestao" as string | null, nivel: "Avançado", objetivo: "Estruturar procedimentos para gerenciar incidentes sistêmicos graves minimizando o dano ao negócio.", ferramentas: ["Playbooks de incidente", "Matriz de escalonamento", "Post-mortem"], passosSimplificados: ["Defina os critérios de severidade de incidentes", "Desenhe a árvore de comunicação e o acionamento do plantão", "Crie os playbooks de contenção e isolamento de sistemas", "Estruture o modelo de post-mortem focado em correção estrutural"], entregavel: "Plano corporativo de gestão de incidentes críticos documentado.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Desenvolvi um plano de resposta a incidentes críticos de TI. Prontidão operacional para decisões rápidas sob pressão.", proximoProjeto: "Planos de Continuidade de Negócios em TI" },
  { id: "auditoria-acessibilidade-wcag-redesenho", nome: "Auditoria de Acessibilidade Digital", areaSlug: "uxui" as string | null, nivel: "Avançado", objetivo: "Inspecionar e reformular uma plataforma digital garantindo conformidade com as diretrizes WCAG.", ferramentas: ["Figma", "Leitores de tela", "Checklist WCAG", "Verificador de contraste"], passosSimplificados: ["Faça uma varredura visual e funcional buscando barreiras de acesso", "Avalie contraste de textos e navegação por teclado", "Documente as inconformidades mapeando os níveis de falha", "Redesenhe as telas problemáticas aplicando as correções"], entregavel: "Relatório de auditoria e layouts acessíveis corrigidos no Figma.", comoPublicar: "Figma público", sugestaoLinkedIn: "Conduzi uma auditoria de acessibilidade digital baseada na WCAG. Interfaces inclusivas removendo bloqueios de uso.", proximoProjeto: "Design de Experiências Inclusivas" },
  { id: "arquitetura-informacao-portal-complexo", nome: "Arquitetura de Informação de Portal", areaSlug: "uxui" as string | null, nivel: "Avançado", objetivo: "Organizar grandes volumes de conteúdo facilitando a encontrabilidade por meio de uma taxonomia rigorosa.", ferramentas: ["Miro", "Card sorting", "Mapas de site"], passosSimplificados: ["Mapeie o inventário completo de conteúdo do portal", "Realize dinâmicas de card sorting para entender os agrupamentos mentais", "Desenvolva o novo mapa do site com hierarquia e categorias claras", "Crie wireframes estruturais validando os fluxos de navegação"], entregavel: "Taxonomia estruturada, resultados dos testes e mapa do site organizados.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Reestruturei a arquitetura de informação de um portal complexo. Otimizei a navegação com foco em encontrabilidade.", proximoProjeto: "Sistemas de Busca e Filtros de Conteúdo" },
  { id: "design-speculative-futuro-interacao", nome: "Design Especulativo e Cenários Futuros", areaSlug: "uxui" as string | null, nivel: "Avançado", objetivo: "Prototipar interações em cenários futuros de tecnologia para provocar discussões estratégicas de produto.", ferramentas: ["Figma", "Cones de futuros", "Storyboard"], passosSimplificados: ["Identifique sinais e tendências de tecnologias emergentes", "Desenvolva um cenário futuro hipotético de impacto no comportamento", "Crie artefatos de design conceituais que fariam parte dessa rotina", "Documente o impacto ético e social do cenário proposto"], entregavel: "Dossiê visual ilustrando os cenários e as interfaces conceituais.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Desenvolvi um projeto de design especulativo investigando o impacto futuro de novas tecnologias no cotidiano.", proximoProjeto: "Interfaces Espaciais e Realidade Aumentada" },
  { id: "descoberta-produto-product-discovery", nome: "Product Discovery Ponta a Ponta", areaSlug: "produto" as string | null, nivel: "Intermediário", objetivo: "Reduzir incertezas e validar riscos de valor, usabilidade e viabilidade antes de iniciar o desenvolvimento.", ferramentas: ["Miro", "Notion", "Matriz de riscos"], passosSimplificados: ["Defina o problema de negócio a partir de dados de suporte e mercado", "Mapeie as suposições e os riscos críticos em uma matriz", "Conduza entrevistas de validação e protótipos de baixa fidelidade", "Formule testes de fumaça medindo a intenção real de uso"], entregavel: "Dossiê completo de discovery compilando aprendizados e validações.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Conduzi um processo de Product Discovery completo para mitigar riscos. Validei dores reais antes de investir em código.", proximoProjeto: "Estratégia de Lançamento de MVP e Métricas de Ativação" },
  { id: "estrategia-precificacao-monetizacao", nome: "Modelagem de Precificação e Monetização", areaSlug: "produto" as string | null, nivel: "Avançado", objetivo: "Desenhar estruturas de monetização sustentáveis para maximizar a receita de um produto SaaS.", ferramentas: ["Excel", "Análise de sensibilidade", "Notion"], passosSimplificados: ["Analise os modelos de precificação praticados pelos concorrentes", "Estruture planos de assinatura baseados em gatilhos de valor", "Calcule projeções financeiras medindo impacto na margem", "Desenvolva um plano de migração para a base atual de clientes"], entregavel: "Estudo financeiro e estratégico detalhando o novo modelo comercial.", comoPublicar: "Notion ou PDF no LinkedIn", sugestaoLinkedIn: "Desenvolvi um modelo de monetização para produto SaaS. Alinhei pacotes comerciais a métricas financeiras sustentáveis.", proximoProjeto: "Estratégia de Expansão de Contas e Upsell" },

  // FRONTEND (15)
  { id: "dark-mode-toggle-javascript", nome: "Seletor de Modo Escuro", areaSlug: "frontend" as string | null, nivel: "Iniciante", objetivo: "Implementar alternancia de tema visual claro/escuro com persistência no navegador.", ferramentas: ["HTML5", "CSS3", "JavaScript"], passosSimplificados: ["Defina esquemas de cores com classes de temas no CSS.", "Desenvolva o botão de alternancia.", "Escreva lógica para adicionar/remover a classe do tema no body.", "Salve a escolha no LocalStorage.", "Carregue o tema correto na inicialização da página."], entregavel: "Interface adaptável com suporte a temas claro e escuro.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Implementei Dark Mode com CSS e JavaScript salvando preferências no LocalStorage!", proximoProjeto: "Timer Pomodoro" },
  { id: "quiz-interativo-javascript", nome: "Quiz de Tecnologia Interativo", areaSlug: "frontend" as string | null, nivel: "Intermediário", objetivo: "Desenvolver um jogo de perguntas e respostas com feedback visual e contagem de pontos.", ferramentas: ["HTML5", "CSS3", "JavaScript"], passosSimplificados: ["Crie array de perguntas, opções e respostas corretas.", "Renderize uma pergunta por vez.", "Marque opções em verde ou vermelho conforme a seleção.", "Calcule pontuação acumulando acertos.", "Exiba tela de resultado com opção de reiniciar."], entregavel: "Quiz de multipla escolha que avalia o desempenho do usuário.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Desenvolvi um Quiz Interativo em JavaScript moderno com feedback visual!", proximoProjeto: "Jogo da Memória", proximoProjetoId: "jogo-memoria-cartas" },
  { id: "gerador-senhas-javascript", nome: "Gerador de Senhas Seguras", areaSlug: "frontend" as string | null, nivel: "Intermediário", objetivo: "Criar ferramenta que gera senhas fortes com parâmetros configuráveis de segurança.", ferramentas: ["HTML5", "CSS3", "JavaScript"], passosSimplificados: ["Adicione checkboxes para maiúsculas, minúsculas, números e símbolos.", "Implemente slider para comprimento da senha.", "Escreva lógica de seleção aleatória de caracteres.", "Exiba a senha gerada em destaque.", "Adicione botão de cópia para área de transferência."], entregavel: "Gerador e customizador de senhas seguras funcional.", comoPublicar: "GitHub Pages", sugestaoLinkedIn: "Construí um gerador de senhas com parâmetros customizaveis em JavaScript puro!", proximoProjeto: "Clone de Landing Page" },
  { id: "clone-landing-page-iphone", nome: "Clone Landing Page do iPhone", areaSlug: "frontend" as string | null, nivel: "Intermediário", objetivo: "Recriar a interface promocional da Apple com animações de scroll e design responsivo premium.", ferramentas: ["HTML5", "CSS3", "JavaScript", "Google Fonts"], passosSimplificados: ["Analise o site oficial mapeando proporções e elementos.", "Estilize com gradientes e tipografia moderna.", "Implemente layouts com CSS Grid avançado.", "Crie animações ativadas por scroll events.", "Otimize carregamento de imagens para mobile."], entregavel: "Landing page de produto com design premium e alta fidelidade.", comoPublicar: "Vercel", sugestaoLinkedIn: "Clonei a interface do iPhone com HTML5 e CSS avançado, animações de scroll incluidas!", proximoProjeto: "Dashboard com Chart.js" },
  { id: "dashboard-chartjs-javascript", nome: "Dashboard de Gráficos e Analytics", areaSlug: "frontend" as string | null, nivel: "Avançado", objetivo: "Construir painel administrativo com gráficos dinâmicos alimentados por dados simulados.", ferramentas: ["HTML5", "CSS3", "JavaScript", "Chart.js"], passosSimplificados: ["Integre Chart.js com tags canvas no layout.", "Crie gráficos de linhas, barras e rosca com dados simulados.", "Implemente filtros interativos para mensal/anual.", "Redesenhe os gráficos suavemente a cada filtro.", "Adicione cards com totais e taxas de conversão."], entregavel: "Painel de dados interativo com visualização avançada.", comoPublicar: "Netlify", sugestaoLinkedIn: "Desenvolvi um painel analítico dinâmico com Chart.js!", proximoProjeto: "Clone do Spotify" },
  { id: "clone-spotify-react", nome: "Clone Visual do Spotify", areaSlug: "frontend" as string | null, nivel: "Avançado", objetivo: "Recriar a interface do Spotify com painéis de navegação e player de músicas simulado.", ferramentas: ["React", "TypeScript", "Tailwind CSS", "Lucide Icons"], passosSimplificados: ["Monte o layout em três seções: menu lateral, área principal e player.", "Crie dados mockados de playlists e albuns.", "Desenvolva o player com play, pause e avançar faixas.", "Implemente barra de progresso do áudio com React.", "Adicione abas para navegar entre categorias."], entregavel: "Replica funcional e responsiva da experiência visual do Spotify.", comoPublicar: "Vercel", sugestaoLinkedIn: "Construí um clone do Spotify em React e TypeScript com Tailwind CSS!", proximoProjeto: "Extensão para Chrome" },
  { id: "extensao-chrome-javascript", nome: "Extensão de Produtividade para Chrome", areaSlug: "frontend" as string | null, nivel: "Avançado", objetivo: "Criar extensão para Chrome que bloqueia sites distradores para manter o foco.", ferramentas: ["JavaScript", "Chrome Extension API", "HTML5", "CSS3"], passosSimplificados: ["Escreva o manifest.json com permissões necessárias.", "Desenvolva o layout do popup da extensão.", "Implemente lógica para registrar domínios a bloquear.", "Conecte listeners em segundo plano para interceptar páginas.", "Crie tela de bloqueio com mensagem motivacional."], entregavel: "Extensão funcional empacotada pronta para Chrome.", comoPublicar: "Chrome Web Store ou instalação manual", sugestaoLinkedIn: "Criei uma extensão do Chrome para produtividade usando Chrome Extension API!", proximoProjeto: "Blog com Next.js" },

  // BACKEND (15)
  { id: "crud-banco-dados-java", nome: "CRUD com Java Spring Boot", areaSlug: "backend" as string | null, nivel: "Iniciante", objetivo: "Desenvolver API REST em Java para CRUD de dados persistentes.", ferramentas: ["Java", "Spring Boot", "Spring Data JPA", "PostgreSQL"], passosSimplificados: ["Inicie projeto Spring Boot com JPA, Web e PostgreSQL.", "Crie classes de entidade mapeando campos do banco.", "Implemente JPA Repository para operações SQL.", "Desenvolva controlador com rotas CRUD mapeando para JSON.", "Adicione tratamento global de erros."], entregavel: "API REST robusta em Java com persistência transacional.", comoPublicar: "Render", sugestaoLinkedIn: "Desenvolvi API REST em Java com Spring Boot e PostgreSQL!", proximoProjeto: "Web Scraper com Python" },
  { id: "web-scraper-python", nome: "Web Scraper de Preços", areaSlug: "backend" as string | null, nivel: "Iniciante", objetivo: "Construir script em Python que extrai preços de produtos de páginas web e salva em CSV.", ferramentas: ["Python", "BeautifulSoup4", "Requests", "Pandas"], passosSimplificados: ["Requisite o HTML da página com Requests.", "Carregue o conteúdo no BeautifulSoup.", "Extraia tags de títulos e preços.", "Consolide os dados em arrays.", "Exporte para arquivo CSV."], entregavel: "Script automatizado que captura e tabela preços da web.", comoPublicar: "GitHub Actions ou terminal local", sugestaoLinkedIn: "Desenvolvi Web Scraper em Python com BeautifulSoup!", proximoProjeto: "Bot de Telegram" },
  { id: "bot-telegram-python", nome: "Bot de Respostas para Telegram", areaSlug: "backend" as string | null, nivel: "Iniciante", objetivo: "Construir bot interativo que responde mensagens automaticamente no Telegram.", ferramentas: ["Python", "python-telegram-bot"], passosSimplificados: ["Crie bot no BotFather e obtenha o token.", "Instale a biblioteca python-telegram-bot.", "Crie handlers para comandos como /start e /ajuda.", "Desenvolva respostas automatizadas por texto.", "Mantenha o script rodando em modo de escuta."], entregavel: "Bot ativo respondendo usuários no Telegram.", comoPublicar: "Render ou servidor local", sugestaoLinkedIn: "Criei um bot de respostas para o Telegram com Python!", proximoProjeto: "API de Clima" },
  { id: "api-clima-tempo-backend", nome: "API de Previsão de Tempo", areaSlug: "backend" as string | null, nivel: "Intermediário", objetivo: "Desenvolver serviço backend que expõe dados de clima agregando informações da OpenWeather.", ferramentas: ["Node.js", "Express", "Axios", "OpenWeather API"], passosSimplificados: ["Configure servidor Express com Axios.", "Crie endpoint aceitando nome de cidade.", "Consuma a API OpenWeather no backend.", "Trate e traduza os dados para português.", "Adicione cache em memória para requisições repetidas."], entregavel: "API customizada de meteorologia com dados estruturados.", comoPublicar: "Railway", sugestaoLinkedIn: "Implementei microsserviço de clima com Node.js consumindo APIs globais!", proximoProjeto: "Sistema de Upload de Arquivos" },
  { id: "sistema-upload-multer", nome: "Serviço de Upload de Arquivos", areaSlug: "backend" as string | null, nivel: "Intermediário", objetivo: "Desenvolver serviço que recebe uploads de midias, renomeia e organiza arquivos com segurança.", ferramentas: ["Node.js", "Express", "Multer"], passosSimplificados: ["Configure servidor com limites de tamanho de upload.", "Integre Multer como middleware nas rotas.", "Escreva regras para renomear e organizar arquivos.", "Adicione validadores de extensões aceitas.", "Retorne dados do arquivo e status de sucesso."], entregavel: "API de upload com validações rigorosas.", comoPublicar: "Render", sugestaoLinkedIn: "Construí API de upload de arquivos com Node.js e Multer!", proximoProjeto: "Cron Jobs" },
  { id: "agendador-cron-jobs", nome: "Serviço de Tarefas Agendadas", areaSlug: "backend" as string | null, nivel: "Intermediário", objetivo: "Criar sistema em Node.js que executa tarefas automatizadas de forma recorrente.", ferramentas: ["Node.js", "Express", "node-cron"], passosSimplificados: ["Inicie o projeto e instale node-cron.", "Escreva expressões de agendamento cron.", "Desenvolva funções disparadas nos horários configurados.", "Registre o status de execução em logs.", "Configure rota de debug para testar sob demanda."], entregavel: "Microsserviço autônomo que automatiza execuções em background.", comoPublicar: "Railway", sugestaoLinkedIn: "Desenvolvi microsserviço com node-cron para automação de tarefas periódicas!", proximoProjeto: "Encurtador de URLs" },
  { id: "notificador-emails-nodemailer", nome: "Notificador de E-mails Automático", areaSlug: "backend" as string | null, nivel: "Intermediário", objetivo: "Criar serviço backend que envia e-mails formatados em HTML para confirmação de ações.", ferramentas: ["Node.js", "Nodemailer", "Express"], passosSimplificados: ["Instale Nodemailer e configure conta SMTP.", "Crie corpo do e-mail em HTML.", "Desenvolva rota POST que dispara e-mail automaticamente.", "Adicione validadores de endereço de destinatário.", "Trate erros de envio com respostas adequadas."], entregavel: "API que envia e-mails de aviso de forma segura.", comoPublicar: "Render", sugestaoLinkedIn: "Integrei microsserviço de e-mails automáticos com Nodemailer!", proximoProjeto: "Webhook Handler" },
  { id: "webhook-handler-nodejs", nome: "Webhook de Integração e Eventos", areaSlug: "backend" as string | null, nivel: "Avançado", objetivo: "Desenvolver receptor de dados em tempo real que escuta eventos de gateways e atualiza registros.", ferramentas: ["Node.js", "Express", "Crypto Library"], passosSimplificados: ["Crie rota POST para escuta de eventos externos.", "Valide assinaturas criptográficas das mensagens.", "Interprete o JSON identificando tipo de transação.", "Atualize tabelas conforme o evento recebido.", "Retorne código de sucesso rapidamente."], entregavel: "Endpoint público e seguro que gerencia integrações de terceiros.", comoPublicar: "Render com Ngrok para testes locais", sugestaoLinkedIn: "Construí Webhook Handler em Node.js com validações criptográficas!", proximoProjeto: "API de E-commerce" },
  { id: "api-ecommerce-nodejs", nome: "API REST de E-commerce", areaSlug: "backend" as string | null, nivel: "Avançado", objetivo: "Criar API de controle de loja virtual com gestão de produtos, pedidos e estoque.", ferramentas: ["Node.js", "Express", "PostgreSQL", "Prisma ORM"], passosSimplificados: ["Mapeie modelos de Categorias, Produtos, Clientes e Pedidos no Prisma.", "Desenvolva filtros de pesquisa por preço e estoque.", "Crie rotas de carrinho com verificação de estoque.", "Implemente cálculo de frete dinâmico.", "Crie endpoints de histórico de faturamento."], entregavel: "API de e-commerce capaz de gerenciar catálogos e transações.", comoPublicar: "Render", sugestaoLinkedIn: "Desenvolvi a infraestrutura backend de um E-commerce com Node.js e Prisma!", proximoProjeto: "Gerador de PDFs" },
  { id: "gerador-pdf-nodejs", nome: "Gerador de PDFs Automático", areaSlug: "backend" as string | null, nivel: "Avançado", objetivo: "Construir serviço que gera notas fiscais e faturas em PDF dinamicamente.", ferramentas: ["Node.js", "pdfkit", "Express"], passosSimplificados: ["Instale pdfkit no projeto.", "Crie endpoint que aceita parâmetros da nota fiscal.", "Estilize o layout com logo, linhas de totais e dados.", "Monte o arquivo em streams binários para economizar memória.", "Retorne o stream PDF diretamente no navegador."], entregavel: "API que gera e entrega relatórios em PDF sob demanda.", comoPublicar: "Railway", sugestaoLinkedIn: "Programei microsserviço de geração de PDFs com Node.js e pdfkit!", proximoProjeto: "Processador de Filas" },
  { id: "sistema-filas-redis", nome: "Processador de Filas Assíncronas", areaSlug: "backend" as string | null, nivel: "Avançado", objetivo: "Implementar sistema de filas para desacoplar e executar tarefas pesadas de forma escalável.", ferramentas: ["Node.js", "BullMQ", "Redis"], passosSimplificados: ["Conecte Redis para armazenamento de mensagens.", "Crie canais de fila produtora na API.", "Escreva Worker para processar as tarefas em ordem.", "Implemente limite de tentativas contra falhas.", "Monitore o progresso gerando logs amigáveis."], entregavel: "Arquitetura escalável para processamento assíncrono massivo.", comoPublicar: "Railway com Redis Cloud", sugestaoLinkedIn: "Construí processador de filas com BullMQ e Redis!", proximoProjeto: "Rate Limiter" },
  { id: "rate-limiter-nodejs", nome: "Filtro Limitador de Requisições", areaSlug: "backend" as string | null, nivel: "Avançado", objetivo: "Desenvolver middleware de segurança para bloquear abuso de requisições na API.", ferramentas: ["Node.js", "Express", "Redis"], passosSimplificados: ["Conecte Redis como banco ultrarapido temporário.", "Crie middlewares vinculados as requisições Express.", "Use o IP como chave de rastreamento no Redis.", "Acumule chamadas e bloqueie com HTTP 429 ao exceder.", "Configure regras flexíveis para usuários autenticados."], entregavel: "Barreira de segurança contra tráfego excessivo.", comoPublicar: "Render", sugestaoLinkedIn: "Implementei Rate Limiting dinâmico com Node.js e Redis!", proximoProjeto: "Chat em Tempo Real" },
  // FULLSTACK (15)
  { id: "blog-com-autenticacao", nome: "Blog com Autenticação de Usuários", areaSlug: "fullstack" as string | null, nivel: "Intermediário", objetivo: "Desenvolver portal de blogs com registro seguro de criadores e editor de posts.", ferramentas: ["Next.js", "TypeScript", "Prisma ORM", "NextAuth.js", "PostgreSQL"], passosSimplificados: ["Defina schemas para Usuários, Perfis e Posts.", "Configure NextAuth.js para controle de sessões.", "Crie páginas públicas de exibição de posts.", "Desenvolva painel de postagem com editor rico.", "Proteja a rota de criação exigindo autenticação."], entregavel: "Portal dinâmico de artigos com publicação restrita a editores.", comoPublicar: "Vercel com Neon DB", sugestaoLinkedIn: "Criei blog completo com Next.js, NextAuth e PostgreSQL!", proximoProjeto: "Chat em Tempo Real" },
  { id: "gerenciador-agendamentos-reservas", nome: "Sistema de Agendamentos e Calendário", areaSlug: "fullstack" as string | null, nivel: "Intermediário", objetivo: "Construir ferramenta de marcação de compromissos com calendarios virtuais.", ferramentas: ["Next.js", "TypeScript", "Prisma ORM", "Supabase", "Tailwind CSS"], passosSimplificados: ["Construa estrutura de banco para horários e reservas.", "Crie rotas na API para adicionar e buscar reservas.", "Implemente validações contra reservas duplicadas.", "Desenvolva grade visual de horários livres e ocupados.", "Adicione notificações de confirmação de reserva."], entregavel: "Portal de coordenação de agendas corporativas.", comoPublicar: "Vercel", sugestaoLinkedIn: "Publiquei sistema de marcação de horários com Next.js e Supabase!", proximoProjeto: "Gerenciador Financeiro" },
  { id: "gerenciador-financas-fullstack", nome: "Gerenciador de Finanças Pessoais", areaSlug: "fullstack" as string | null, nivel: "Intermediário", objetivo: "Desenvolver painel de controle financeiro para monitorar receitas, despesas e saldo.", ferramentas: ["React", "Node.js", "Express", "MongoDB", "Mongoose", "Tailwind CSS"], passosSimplificados: ["Defina schema com valor, categoria, descrição e data.", "Crie rotas CRUD para transações financeiras.", "Construa cards de resumo no React.", "Crie filtros por período.", "Adicione alertas ao ultrapassar orçamento."], entregavel: "Painel integrado de controle financeiro pessoal.", comoPublicar: "Vercel no frontend e Railway no backend", sugestaoLinkedIn: "Desenvolvi gerenciador de finanças com React, Node.js e MongoDB!", proximoProjeto: "Plataforma EAD" },
  { id: "plataforma-ead-cursos", nome: "Plataforma EAD Acadêmica", areaSlug: "fullstack" as string | null, nivel: "Intermediário", objetivo: "Criar portal de ensino com painel do estudante e progresso de vídeo aulas.", ferramentas: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "Supabase Storage"], passosSimplificados: ["Organize tabelas de aulas e midias no Supabase.", "Habilite autenticação de usuários no Supabase.", "Crie página do aluno com playlists de vídeo.", "Implemente player com atualização de progresso.", "Integre barras de conclusão do curso."], entregavel: "Portal EAD completo e interativo para estudantes.", comoPublicar: "Vercel", sugestaoLinkedIn: "Desenvolvi plataforma EAD com Next.js e Supabase!", proximoProjeto: "Sistema de Votação" },
  { id: "sistema-votacao-realtime", nome: "Sistema de Enquetes e Votação", areaSlug: "fullstack" as string | null, nivel: "Intermediário", objetivo: "Desenvolver portal de enquetes com votação em tempo real e gráficos de resultados.", ferramentas: ["React", "Node.js", "Express", "Socket.io", "PostgreSQL", "Prisma ORM"], passosSimplificados: ["Crie tabelas de Enquetes e Opções no Postgres.", "Desenvolva rotas de votação com atualização de contadores.", "Conecte Socket.io para emitir resultados ao vivo.", "Construa interface com opções de seleção.", "Exiba gráficos animados com percentuais."], entregavel: "Aplicação de votação dinâmica em tempo real.", comoPublicar: "Render no backend e Netlify no frontend", sugestaoLinkedIn: "Construí sistema de enquetes em tempo real com React e Socket.io!", proximoProjeto: "App de Receitas" },
  { id: "app-receitas-culinarias", nome: "Buscador e Livro de Receitas", areaSlug: "fullstack" as string | null, nivel: "Intermediário", objetivo: "Construir portal para buscar e publicar receitas com ingredientes e modo de preparo.", ferramentas: ["React", "Node.js", "Express", "MongoDB", "Mongoose", "Tailwind CSS"], passosSimplificados: ["Configure MongoDB para ingredientes, instruções e fotos.", "Escreva rotas de cadastro e busca textual.", "Exiba receitas em cards no React.", "Crie filtros por categoria e tags.", "Implemente exportação da lista de ingredientes."], entregavel: "Guia interativo de culinária integrado e responsivo.", comoPublicar: "Vercel no frontend e Render no backend", sugestaoLinkedIn: "Criei livro de receitas online com MERN Stack!", proximoProjeto: "Rede Social Mínima" },
  { id: "rede-social-minima", nome: "Rede Social de Feed Simples", areaSlug: "fullstack" as string | null, nivel: "Intermediário", objetivo: "Desenvolver microblog onde usuários publicam posts de texto e curtem publicações.", ferramentas: ["React", "Node.js", "Express", "PostgreSQL", "Prisma ORM", "Tailwind CSS"], passosSimplificados: ["Estruture tabelas de Usuários, Posts e Curtidas.", "Escreva rotas para cadastrar posts e curtidas.", "Crie o feed principal no React.", "Implemente botões de curtir com atualização imediata.", "Filtre posts exibindo os mais recentes no topo."], entregavel: "Rede social responsiva com feed interativo.", comoPublicar: "Railway no backend e Vercel no frontend", sugestaoLinkedIn: "Desenvolvi microblog fullstack com React, Node.js e PostgreSQL!", proximoProjeto: "Kanban estilo Trello" },
  { id: "clone-trello-kanban", nome: "Quadro Kanban estilo Trello", areaSlug: "fullstack" as string | null, nivel: "Intermediário", objetivo: "Construir ferramenta de gestão visual com colunas e cartões de tarefas arrastaveis.", ferramentas: ["React", "Node.js", "Express", "PostgreSQL", "Prisma ORM", "@hello-pangea/dnd"], passosSimplificados: ["Defina colunas de tarefas no Postgres via Prisma.", "Configure Hello Pangea DnD para arrastar cards.", "Persista nova ordenação dos cards no banco.", "Gerencie transferências de cards entre colunas.", "Crie modais para editar título e categoria de cada card."], entregavel: "Painel Kanban de alta fidelidade para gestão de tarefas.", comoPublicar: "Vercel", sugestaoLinkedIn: "Finalizei painel Kanban estilo Trello com React e Drag and Drop!", proximoProjeto: "Marketplace de Classicados" },
  { id: "marketplace-usados-fullstack", nome: "Portal de Classificados e Desapegos", areaSlug: "fullstack" as string | null, nivel: "Avançado", objetivo: "Desenvolver marketplace para anúncio e venda de produtos usados com busca integrada.", ferramentas: ["React", "Node.js", "Express", "MongoDB", "Mongoose", "Tailwind CSS"], passosSimplificados: ["Crie tabelas de Produtos, Usuários e Categorias.", "Desenvolva endpoints de anúncio com suporte a imagens.", "Implemente filtros por preço e categoria.", "Construa catálogo responsivo de ofertas no React.", "Adicione botão de contato via WhatsApp do vendedor."], entregavel: "Portal de desapegos integrado para comercio de usados.", comoPublicar: "Render", sugestaoLinkedIn: "Criei Marketplace completo com React, Node.js e MongoDB!", proximoProjeto: "Central de Chamados" },
  { id: "sistema-tickets-suporte", nome: "Central de Chamados e Helpdesk", areaSlug: "fullstack" as string | null, nivel: "Avançado", objetivo: "Desenvolver plataforma de atendimento de tickets com triagem por urgência e status.", ferramentas: ["Next.js", "TypeScript", "Prisma ORM", "PostgreSQL", "Tailwind CSS"], passosSimplificados: ["Mapeie tabelas de Clientes, Suporte e Tickets.", "Crie rotas para abertura e controle de chamados.", "Construa painel do analista com tickets por urgência.", "Implemente alternancia de status de atendimento.", "Adicione alertas por e-mail para novos chamados."], entregavel: "Central profissional de gerenciamento de helpdesk.", comoPublicar: "Vercel", sugestaoLinkedIn: "Construí plataforma de Helpdesk com Next.js e PostgreSQL!", proximoProjeto: "App de Delivery" },
  { id: "app-delivery-fullstack", nome: "App de Delivery Simplificado", areaSlug: "fullstack" as string | null, nivel: "Avançado", objetivo: "Criar aplicação de delivery com cardápio digital e acompanhamento de status do pedido.", ferramentas: ["React", "Node.js", "Express", "PostgreSQL", "Prisma ORM", "Socket.io"], passosSimplificados: ["Mapeie relações de Pratos, Clientes e Pedidos.", "Desenvolva rotas de pedidos com controle de estoque.", "Construa painel do restaurante para aceitar pedidos.", "Conecte Socket.io para atualizar status em tempo real.", "Desenvolva tela do cliente com atualização automática."], entregavel: "Solução integrada de delivery com acompanhamento ao vivo.", comoPublicar: "Vercel no frontend e Render no backend", sugestaoLinkedIn: "Desenvolvi sistema de Delivery com acompanhamento em tempo real!", proximoProjeto: "Gerenciador de Senhas" },
  { id: "gerenciador-senhas-fullstack", nome: "Cofre e Gerenciador de Senhas", areaSlug: "fullstack" as string | null, nivel: "Avançado", objetivo: "Desenvolver cofre de logins com armazenamento criptografado antes de salvar no banco.", ferramentas: ["React", "Node.js", "Express", "PostgreSQL", "Crypto API"], passosSimplificados: ["Crie tabelas de usuários e cofres no PostgreSQL.", "Implemente criptografia AES-256 no backend.", "Gere chaves derivadas da senha mestra do usuário.", "Crie telas que descriptografam senhas sob demanda.", "Adicione auditoria sinalizando senhas antigas ou fracas."], entregavel: "Cofre digital de senhas com alta segurança.", comoPublicar: "Render", sugestaoLinkedIn: "Desenvolvi cofre de senhas criptografado com React e Node.js!", proximoProjeto: "Editor de Documentos" },
  { id: "clone-notion-notificacoes", nome: "Editor de Documentos estilo Notion", areaSlug: "fullstack" as string | null, nivel: "Avançado", objetivo: "Criar editor de notas com blocos dinâmicos e salvamento automático de alterações.", ferramentas: ["Next.js", "TypeScript", "Prisma ORM", "PostgreSQL", "Tailwind CSS"], passosSimplificados: ["Crie estruturas no Postgres para notas e blocos.", "Configure editor rico integrado ao frontend.", "Salve edições automaticamente a cada pausa de digitação.", "Desenvolva menu lateral de navegação de pastas.", "Adicione compartilhamento de notas por link público."], entregavel: "Editor visual de anotações rico e responsivo.", comoPublicar: "Vercel", sugestaoLinkedIn: "Finalizei clone interativo do Notion com Next.js e PostgreSQL!", proximoProjeto: "Portfólio Pessoal" },
  // DADOS (15)
  { id: "dashboard-power-bi", nome: "Dashboard de Vendas no Power BI", areaSlug: "dados" as string | null, subareaSlug: "analista-bi", nivel: "Iniciante", objetivo: "Criar painel executivo de vendas no Power BI a partir de planilhas Excel.", ferramentas: ["Power BI Desktop", "Excel"], passosSimplificados: ["Importe dados de vendas do Excel no Power BI.", "Crie relacionamentos entre tabelas de produtos, clientes e pedidos.", "Desenvolva medidas DAX para faturamento e ticket médio.", "Construa gráficos de barras, linhas e mapa de regiões.", "Configure filtros de data e categoria no painel."], entregavel: "Dashboard interativo publicado no Power BI Service.", comoPublicar: "Power BI Service (conta gratuita)", sugestaoLinkedIn: "Criei meu primeiro dashboard de vendas no Power BI com DAX!", proximoProjeto: "Limpeza de Dados com Python" },
  { id: "limpeza-dados-python", nome: "Limpeza e Preparação de Dataset", areaSlug: "dados" as string | null, nivel: "Iniciante", objetivo: "Transformar um dataset bagunçado em dados limpos prontos para análise.", ferramentas: ["Python", "Pandas", "Jupyter Notebook"], passosSimplificados: ["Identifique valores nulos, duplicatas e inconsistências.", "Trate valores ausentes com preenchimento ou remoção.", "Padronize colunas de texto e datas.", "Remova outliers com critérios documentados.", "Exporte o dataset limpo em CSV."], entregavel: "Dataset limpo com relatório de transformações aplicadas.", comoPublicar: "GitHub", sugestaoLinkedIn: "Realizei limpeza de dados com Pandas e aumentei a qualidade do dataset em muito!", proximoProjeto: "Visualização com dados do IBGE" },
  { id: "visualizacao-dados-ibge", nome: "Visualização de Dados do IBGE", areaSlug: "dados" as string | null, nivel: "Iniciante", objetivo: "Criar gráficos informativos com dados populacionais do IBGE usando Python.", ferramentas: ["Python", "Pandas", "Matplotlib", "Seaborn", "Jupyter Notebook"], passosSimplificados: ["Baixe dados públicos do IBGE (ex.: populacao por estado).", "Carregue e filtre os dados com Pandas.", "Crie mapas de barras por região.", "Adicione comparações historicas entre anos.", "Documente os achados no notebook."], entregavel: "Notebook com gráficos e interpretações de dados públicos brasileiros.", comoPublicar: "GitHub ou Kaggle", sugestaoLinkedIn: "Analisei dados populacionais do IBGE com Python e Matplotlib!", proximoProjeto: "Análise de Sentimento" },
  { id: "analise-covid-python", nome: "Análise de Dados de COVID-19", areaSlug: "dados" as string | null, nivel: "Intermediário", objetivo: "Explorar a evolução da pandemia com dados públicos e criar visualizações temporais.", ferramentas: ["Python", "Pandas", "Plotly", "Jupyter Notebook"], passosSimplificados: ["Baixe dataset de COVID do Our World in Data.", "Filtre dados do Brasil e compare com outros paises.", "Crie gráficos de linha com evolução de casos e obitos.", "Calcule taxa de mortalidade e média móvel de 7 dias.", "Publique notebook com interpretações."], entregavel: "Análise temporal de COVID-19 com gráficos interativos.", comoPublicar: "GitHub ou Kaggle Notebooks", sugestaoLinkedIn: "Analisei dados da pandemia de COVID-19 com Python e Plotly!", proximoProjeto: "Mapa de Correlação" },
  { id: "correlacao-heatmap-seaborn", nome: "Mapa de Calor de Correlações", areaSlug: "dados" as string | null, nivel: "Intermediário", objetivo: "Identificar relações entre variáveis numéricas com heatmap de correlação.", ferramentas: ["Python", "Pandas", "Seaborn", "Matplotlib", "Jupyter Notebook"], passosSimplificados: ["Escolha dataset com múltiplas variáveis numéricas.", "Calcule a matriz de correlação com df.corr().", "Gere o heatmap com anotações de valores.", "Identifique as 3 correlações mais fortes e explique.", "Documente hipóteses sobre as relações encontradas."], entregavel: "Heatmap anotado com interpretação das correlações.", comoPublicar: "GitHub ou Kaggle", sugestaoLinkedIn: "Descobri correlações relevantes entre variáveis com Seaborn e Pandas!", proximoProjeto: "Previsão de Série Temporal", proximoProjetoId: "previsao-serie-temporal" },
  { id: "previsao-serie-temporal", nome: "Previsão de Série Temporal", areaSlug: "dados" as string | null, nivel: "Intermediário", objetivo: "Prever valores futuros de uma série temporal usando modelos estatísticos.", ferramentas: ["Python", "statsmodels", "Pandas", "Matplotlib", "Jupyter Notebook"], passosSimplificados: ["Escolha uma série temporal pública (vendas, ações, clima).", "Plote a série e identifique tendências e sazonalidade.", "Treine modelo ARIMA ou Prophet.", "Gere previsões para os próximos 30 dias.", "Compare previsão com valores reais e calcule o erro."], entregavel: "Modelo de previsão documentado com gráfico de projecao.", comoPublicar: "GitHub ou Kaggle", sugestaoLinkedIn: "Treinei modelo de previsão de série temporal com Python e statsmodels!", proximoProjeto: "Análise de Churn" },
  { id: "segmentacao-clientes-kmeans", nome: "Segmentação de Clientes com K-Means", areaSlug: "dados" as string | null, nivel: "Avançado", objetivo: "Agrupar clientes por comportamento de compra usando algoritmo de clustering.", ferramentas: ["Python", "scikit-learn", "Pandas", "Seaborn", "Jupyter Notebook"], passosSimplificados: ["Prepare dataset de transações de clientes.", "Normalize as variáveis para o algoritmo.", "Aplique K-Means com diferentes valores de K.", "Use o método do cotovelo para escolher o K ideal.", "Interprete e nomeie cada segmento encontrado."], entregavel: "Análise de segmentação com perfil de cada cluster.", comoPublicar: "GitHub ou Kaggle", sugestaoLinkedIn: "Segmentei clientes com K-Means e descobri perfis de comportamento distintos!", proximoProjeto: "Painel de Indicadores Economicos", proximoProjetoId: "painel-indicadores-economicos" },
  { id: "painel-indicadores-economicos", nome: "Painel de Indicadores Economicos", areaSlug: "dados" as string | null, nivel: "Avançado", objetivo: "Construir dashboard dinâmico com indicadores economicos do Brasil via API.", ferramentas: ["Python", "Streamlit", "Pandas", "Plotly", "Requests"], passosSimplificados: ["Consuma API do Banco Central (BCB) para IPCA, SELIC e câmbio.", "Transforme os dados com Pandas para séries temporais.", "Crie gráficos interativos com Plotly Express.", "Construa o painel com Streamlit.", "Adicione filtros de período e indicador."], entregavel: "Dashboard web ao vivo com indicadores economicos atualizados.", comoPublicar: "Streamlit Cloud", sugestaoLinkedIn: "Construí painel de indicadores economicos do Brasil com Streamlit e API do BCB!", proximoProjeto: "Análise de Dados do ENEM" },
  { id: "analise-dados-enem", nome: "Análise dos Microdados do ENEM", areaSlug: "dados" as string | null, nivel: "Avançado", objetivo: "Explorar desempenho dos estudantes no ENEM por região, escola e perfil socieconomico.", ferramentas: ["Python", "Pandas", "Matplotlib", "Seaborn", "Jupyter Notebook"], passosSimplificados: ["Baixe os microdados do ENEM no site do INEP.", "Filtre por estado e tipo de escola.", "Compare médias por região e perfil socioeconomico.", "Crie mapas de calor de desempenho por disciplina.", "Publique análise com conclusões fundamentadas."], entregavel: "Análise completa dos microdados do ENEM com insights educacionais.", comoPublicar: "GitHub ou Kaggle", sugestaoLinkedIn: "Analisei microdados do ENEM e descobri insights sobre desigualdade educacional!", proximoProjeto: "Storytelling com Dados" },
  { id: "storytelling-dados-clima", nome: "Storytelling com Dados Climáticos", areaSlug: "dados" as string | null, nivel: "Avançado", objetivo: "Criar narrativa visual com dados climáticos históricos mostrando tendências de temperatura.", ferramentas: ["Python", "Pandas", "Plotly", "Datawrapper", "Jupyter Notebook"], passosSimplificados: ["Baixe dados climáticos do INMET ou NOAA.", "Calcule médias anuais e decenais de temperatura.", "Crie gráficos que contem uma história de aquecimento.", "Adicione anotações nos pontos críticos da série.", "Publique o relatório com narrativa clara."], entregavel: "Relatório visual com narrativa de dados sobre mudanças climaticas.", comoPublicar: "GitHub ou Datawrapper", sugestaoLinkedIn: "Criei storytelling com dados climáticos históricos mostrando tendências reais!", proximoProjeto: "Análise de Redes Sociais" },
  { id: "analise-redes-sociais", nome: "Análise de Redes e Conexões", areaSlug: "dados" as string | null, nivel: "Avançado", objetivo: "Mapear e visualizar conexões entre nos em uma rede social usando teoria dos grafos.", ferramentas: ["Python", "NetworkX", "Pandas", "Matplotlib", "Jupyter Notebook"], passosSimplificados: ["Crie ou importe dataset de conexões entre nos.", "Construa o grafo com NetworkX.", "Calcule grau de centralidade e nos mais conectados.", "Visualize a rede com layout force-directed.", "Identifique comunidades e hubs principais."], entregavel: "Análise de rede com visualização e métricas de centralidade.", comoPublicar: "GitHub", sugestaoLinkedIn: "Analisei estrutura de redes sociais com NetworkX e teoria dos grafos!", proximoProjeto: "Relatório Automatizado com Python" },
  { id: "relatorio-automatizado-python", nome: "Relatório Automatizado em Python", areaSlug: "dados" as string | null, nivel: "Avançado", objetivo: "Criar script que gera relatório PDF automaticamente com dados e gráficos atualizados.", ferramentas: ["Python", "Pandas", "Matplotlib", "ReportLab", "schedule"], passosSimplificados: ["Prepare os dados com Pandas a partir de CSV ou banco.", "Gere gráficos com Matplotlib e salve como imagens.", "Monte o PDF com ReportLab inserindo textos e gráficos.", "Agende execução automática com schedule.", "Envie o relatório por e-mail com smtplib."], entregavel: "Script que gera e envia relatório PDF automaticamente.", comoPublicar: "GitHub com README de instruções", sugestaoLinkedIn: "Automatizei geração de relatórios em PDF com Python e ReportLab!", proximoProjeto: "Classificador com scikit-learn" },
  // IA/ML (15)
  { id: "classificador-spam-sklearn", nome: "Classificador de Spam com ML", areaSlug: "ia" as string | null, nivel: "Intermediário", objetivo: "Treinar modelo de machine learning para distinguir e-mails spam dos legitimos.", ferramentas: ["Python", "scikit-learn", "Pandas", "Jupyter Notebook"], passosSimplificados: ["Baixe dataset de SMS spam do Kaggle.", "Aplique TF-IDF para vetorizar o texto.", "Treine modelo Naive Bayes.", "Avalie com precisão, recall e matriz de confusão.", "Teste com exemplos próprios."], entregavel: "Modelo treinado com relatório de avaliação e exemplos de predição.", comoPublicar: "GitHub ou Kaggle", sugestaoLinkedIn: "Treinei classificador de spam com Naive Bayes e TF-IDF!", proximoProjeto: "Análise de Sentimento com NLP" },
  { id: "detector-sentimento-nlp", nome: "Detector de Sentimento com Hugging Face", areaSlug: "ia" as string | null, nivel: "Iniciante", objetivo: "Usar modelos pré-treinados do Hugging Face para classificar sentimento em textos.", ferramentas: ["Python", "Hugging Face Transformers", "Streamlit"], passosSimplificados: ["Instale a biblioteca transformers.", "Carregue modelo pré-treinado de análise de sentimento.", "Crie função que recebe texto e retorna sentimento.", "Construa interface simples com Streamlit.", "Teste com diferentes tipos de textos."], entregavel: "App web de análise de sentimento usando modelo pré-treinado.", comoPublicar: "Streamlit Cloud", sugestaoLinkedIn: "Criei detector de sentimento com Hugging Face Transformers e Streamlit!", proximoProjeto: "Chatbot com LangChain" },
  { id: "reconhecimento-digitos-mnist", nome: "Reconhecimento de Dígitos com Redes Neurais", areaSlug: "ia" as string | null, nivel: "Intermediário", objetivo: "Treinar rede neural para reconhecer dígitos manuscritos no dataset MNIST.", ferramentas: ["Python", "TensorFlow", "Keras", "Matplotlib", "Jupyter Notebook"], passosSimplificados: ["Carregue o dataset MNIST via Keras.", "Normalize os pixels entre 0 e 1.", "Construa rede neural com camadas Dense.", "Treine por 10 epochs e avalie a acurácia.", "Visualize predicoes erradas do modelo."], entregavel: "Modelo treinado com acurácia acima de 97% e exemplos de predição.", comoPublicar: "GitHub ou Kaggle", sugestaoLinkedIn: "Treinei rede neural para reconhecer dígitos manuscritos com TensorFlow!", proximoProjeto: "Sistema de Recomendação" },
  { id: "sistema-recomendacao-filmes", nome: "Sistema de Recomendação de Filmes", areaSlug: "ia" as string | null, nivel: "Intermediário", objetivo: "Construir sistema que recomenda filmes similares usando filtragem colaborativa.", ferramentas: ["Python", "Pandas", "scikit-learn", "Jupyter Notebook"], passosSimplificados: ["Baixe dataset MovieLens do Kaggle.", "Crie matriz usuário-filme com ratings.", "Aplique filtragem colaborativa com similaridade de cosseno.", "Gere lista de recomendações para um usuário.", "Avalie a qualidade das recomendações."], entregavel: "Sistema de recomendação com exemplos de top-5 filmes por usuário.", comoPublicar: "GitHub ou Kaggle", sugestaoLinkedIn: "Construí sistema de recomendação de filmes com filtragem colaborativa!", proximoProjeto: "Detector de Fake News" },
  { id: "detector-fake-news", nome: "Detector de Notícias Falsas", areaSlug: "ia" as string | null, nivel: "Intermediário", objetivo: "Classificar notícias como verdadeiras ou falsas usando processamento de linguagem natural.", ferramentas: ["Python", "scikit-learn", "NLTK", "Pandas", "Jupyter Notebook"], passosSimplificados: ["Baixe dataset de fake news do Kaggle.", "Pré-processe textos removendo stopwords e pontuação.", "Vetorize com TF-IDF.", "Treine classificador Logistic Regression.", "Avalie e exiba exemplos classificados."], entregavel: "Classificador de fake news com relatório de desempenho.", comoPublicar: "GitHub ou Kaggle", sugestaoLinkedIn: "Construí detector de fake news com Python, NLTK e Logistic Regression!", proximoProjeto: "Gerador de Texto com GPT" },
  { id: "gerador-texto-gpt", nome: "Gerador de Conteúdo com GPT", areaSlug: "ia" as string | null, nivel: "Intermediário", objetivo: "Criar ferramenta que gera textos personalizados usando a API da OpenAI.", ferramentas: ["Python", "OpenAI API", "Streamlit"], passosSimplificados: ["Configure a API key da OpenAI.", "Crie prompts estruturados para diferentes tipos de conteúdo.", "Implemente controles de temperatura e tokens maximos.", "Construa interface com Streamlit com campos de entrada.", "Adicione opção de copiar o texto gerado."], entregavel: "App web gerador de conteúdo com parâmetros customizaveis.", comoPublicar: "Streamlit Cloud", sugestaoLinkedIn: "Criei gerador de conteúdo com GPT e Streamlit!", proximoProjeto: "Classificador de Imagens" },
  { id: "classificador-imagens-keras", nome: "Classificador de Imagens com CNN", areaSlug: "ia" as string | null, nivel: "Intermediário", objetivo: "Treinar rede convolucional para classificar imagens em categorias distintas.", ferramentas: ["Python", "TensorFlow", "Keras", "Matplotlib", "Jupyter Notebook"], passosSimplificados: ["Baixe dataset de imagens (ex.: CIFAR-10 ou flowers).", "Construa CNN com camadas Conv2D, MaxPooling e Dense.", "Aplique data augmentation para melhorar a generalização.", "Treine o modelo e plote as curvas de aprendizado.", "Teste com imagens próprias."], entregavel: "CNN treinada com exemplos de predição em imagens novas.", comoPublicar: "GitHub ou Kaggle", sugestaoLinkedIn: "Treinei rede neural convolucional para classificar imagens com Keras!", proximoProjeto: "Tradução Automática" },
  { id: "traducao-automatica-transformers", nome: "Tradução Automática com Transformers", areaSlug: "ia" as string | null, nivel: "Intermediário", objetivo: "Usar modelos pré-treinados para traduzir textos entre idiomas.", ferramentas: ["Python", "Hugging Face Transformers", "Streamlit"], passosSimplificados: ["Instale a biblioteca transformers.", "Carregue modelo de tradução Helsinki-NLP.", "Crie função de tradução com tokenização adequada.", "Construa interface com seleção de idiomas.", "Teste com diferentes textos e idiomas."], entregavel: "App web de tradução usando modelo pré-treinado.", comoPublicar: "Streamlit Cloud", sugestaoLinkedIn: "Construí tradutor automático com Hugging Face Transformers!", proximoProjeto: "Sumarizador de Texto" },
  { id: "sumarizador-texto-nlp", nome: "Sumarizador de Textos Longos", areaSlug: "ia" as string | null, nivel: "Intermediário", objetivo: "Criar ferramenta que resume artigos e documentos longos automaticamente.", ferramentas: ["Python", "Hugging Face Transformers", "Streamlit"], passosSimplificados: ["Carregue modelo de sumarizacao BART ou T5.", "Implemente chunking para textos longos.", "Crie função de sumarizacao com controle de tamanho.", "Construa interface com área de texto e parâmetros.", "Compare o resumo com o original."], entregavel: "App de sumarizacao de textos com controles de tamanho.", comoPublicar: "Streamlit Cloud", sugestaoLinkedIn: "Criei sumarizador de textos com BART e Hugging Face!", proximoProjeto: "Assistente de PDF com RAG" },
  { id: "detector-objetos-yolo", nome: "Detector de Objetos com YOLO", areaSlug: "ia" as string | null, subareaSlug: "visao-computacional", nivel: "Avançado", objetivo: "Implementar detecção de objetos em imagens e vídeos usando YOLOv8.", ferramentas: ["Python", "Ultralytics YOLOv8", "OpenCV", "Streamlit"], passosSimplificados: ["Instale Ultralytics e importe o modelo YOLOv8.", "Carregue imagem ou vídeo para detecção.", "Execute a inferência e extraia bounding boxes.", "Desenhe os boxes com labels usando OpenCV.", "Construa interface para upload de imagens."], entregavel: "App de detecção de objetos em imagens com visualização dos resultados.", comoPublicar: "Streamlit Cloud", sugestaoLinkedIn: "Implementei detecção de objetos em tempo real com YOLOv8!", proximoProjeto: "Geração de Música com IA" },
  { id: "geracao-musica-ia", nome: "Gerador de Música com IA", areaSlug: "ia" as string | null, nivel: "Avançado", objetivo: "Gerar melodias musicais originais usando modelos de IA generativa.", ferramentas: ["Python", "MusicGen (Meta)", "Streamlit", "soundfile"], passosSimplificados: ["Instale a biblioteca audiocraft da Meta.", "Configure o modelo MusicGen small.", "Crie prompts descritivos de estilos musicais.", "Gere arquivos de áudio com diferentes duração.", "Construa interface com player de áudio."], entregavel: "App web que gera músicas originais a partir de descrições em texto.", comoPublicar: "Streamlit Cloud ou Hugging Face Spaces", sugestaoLinkedIn: "Criei gerador de música com IA usando MusicGen da Meta!", proximoProjeto: "Análise de Sentimento de Reviews" },
  { id: "analise-reviews-produtos", nome: "Análise de Reviews de Produtos", areaSlug: "ia" as string | null, subareaSlug: "nlp", nivel: "Intermediário", objetivo: "Extrair insights automaticamente de avaliações de clientes usando NLP avançado.", ferramentas: ["Python", "Hugging Face Transformers", "Pandas", "Streamlit", "Plotly"], passosSimplificados: ["Colete reviews de produtos do Amazon via dataset Kaggle.", "Aplique análise de sentimento com modelo pré-treinado.", "Extraia tópicos frequentes com LDA.", "Visualize tendências de satisfação ao longo do tempo.", "Construa dashboard interativo com Streamlit."], entregavel: "Dashboard de insights de reviews com análise de sentimento e tópicos.", comoPublicar: "Streamlit Cloud", sugestaoLinkedIn: "Analisei avaliações de clientes com NLP e transformers!", proximoProjeto: "Chatbot de FAQ com RAG", proximoProjetoId: "rag-chat-documentos" },

  // ENGENHARIA DE DADOS (15)
  { id: "pipeline-etl-python", nome: "Pipeline ETL com Python", areaSlug: "engenharia-dados" as string | null, nivel: "Iniciante", objetivo: "Construir pipeline de extração, transformação e carga de dados entre fontes distintas.", ferramentas: ["Python", "Pandas", "SQLAlchemy", "PostgreSQL"], passosSimplificados: ["Extraia dados de um CSV ou API pública.", "Aplique transformações de limpeza e padronização.", "Valide os dados antes de carregar.", "Carregue no PostgreSQL com SQLAlchemy.", "Documente o pipeline com logs de execução."], entregavel: "Pipeline ETL funcional com logs de execução.", comoPublicar: "GitHub", sugestaoLinkedIn: "Construí pipeline ETL em Python do zero!", proximoProjeto: "Orquestração com Airflow" },
  { id: "orquestracao-airflow", nome: "Orquestração de DAGs com Apache Airflow", areaSlug: "engenharia-dados" as string | null, nivel: "Intermediário", objetivo: "Criar e agendar fluxos de trabalho de dados com DAGs no Apache Airflow.", ferramentas: ["Python", "Apache Airflow", "Docker"], passosSimplificados: ["Instale Airflow com Docker Compose.", "Crie primeira DAG com tarefas sequenciais.", "Configure schedule de execução cron.", "Adicione logs e alertas de falha.", "Monitore execuções na interface web."], entregavel: "DAG funcional agendada e monitorada no Airflow.", comoPublicar: "GitHub com Docker Compose incluido", sugestaoLinkedIn: "Criei minha primeira DAG no Apache Airflow para orquestrar dados!", proximoProjeto: "Modelagem Dimensional com dbt", proximoProjetoId: "modelagem-dimensional-dbt" },
  { id: "modelagem-dimensional-dbt", nome: "Modelagem Dimensional com dbt", areaSlug: "engenharia-dados" as string | null, nivel: "Intermediário", objetivo: "Transformar dados brutos em modelos dimensionais com dbt para analytics.", ferramentas: ["dbt", "PostgreSQL", "SQL"], passosSimplificados: ["Configure projeto dbt conectado ao PostgreSQL.", "Crie modelos de staging para limpeza dos dados.", "Desenvolva dimensões (dim_) e fatos (fct_).", "Adicione testes de qualidade de dados.", "Gere documentação automática com dbt docs."], entregavel: "Projeto dbt com modelos dimensionais testados e documentados.", comoPublicar: "GitHub com README de instruções", sugestaoLinkedIn: "Implementei modelagem dimensional com dbt e PostgreSQL!", proximoProjeto: "Ingestão de API para Banco" },
  { id: "ingestao-api-banco", nome: "Ingestão de API para Banco de Dados", areaSlug: "engenharia-dados" as string | null, nivel: "Iniciante", objetivo: "Criar serviço que consome API pública e persiste os dados em banco relacional.", ferramentas: ["Python", "Requests", "PostgreSQL", "SQLAlchemy", "schedule"], passosSimplificados: ["Escolha API pública com dados interessantes.", "Implemente função de extração com tratamento de erros.", "Mapeie os dados para schema do banco.", "Crie rotina de ingestão com deduplicacao.", "Agende execução periodica com schedule."], entregavel: "Serviço automático de ingestão com dados históricos acumulados.", comoPublicar: "GitHub", sugestaoLinkedIn: "Construí pipeline de ingestão de API para PostgreSQL!", proximoProjeto: "Data Lake no S3" },
  { id: "data-lake-s3-python", nome: "Data Lake Simples no S3", areaSlug: "engenharia-dados" as string | null, nivel: "Intermediário", objetivo: "Implementar data lake com camadas bronze, prata e ouro no Amazon S3.", ferramentas: ["Python", "boto3", "Pandas", "AWS S3 Free Tier"], passosSimplificados: ["Configure credenciais AWS e crie buckets S3.", "Carregue dados brutos na camada bronze.", "Aplique transformações e salve na camada prata.", "Agregue e refine para a camada ouro.", "Documente a arquitetura em diagrama."], entregavel: "Data lake com três camadas funcionais no S3.", comoPublicar: "GitHub com diagrama de arquitetura", sugestaoLinkedIn: "Implementei data lake com arquitetura medallion no Amazon S3!", proximoProjeto: "Qualidade de Dados com Great Expectations" },
  { id: "qualidade-dados-great-expectations", nome: "Validação de Dados com Great Expectations", areaSlug: "engenharia-dados" as string | null, nivel: "Intermediário", objetivo: "Implementar testes automáticos de qualidade de dados com Great Expectations.", ferramentas: ["Python", "Great Expectations", "Pandas", "PostgreSQL"], passosSimplificados: ["Instale Great Expectations e inicialize projeto.", "Conecte ao datasource (CSV ou banco).", "Crie expectations de schema, nulos e ranges.", "Execute validação e gere relatório HTML.", "Integre validação no pipeline ETL."], entregavel: "Suite de testes de qualidade de dados com relatório de resultados.", comoPublicar: "GitHub", sugestaoLinkedIn: "Implementei validação de dados automática com Great Expectations!", proximoProjeto: "Streaming com Kafka" },
  { id: "streaming-kafka-python", nome: "Streaming de Eventos com Kafka", areaSlug: "engenharia-dados" as string | null, nivel: "Intermediário", objetivo: "Construir pipeline de dados em tempo real com producer e consumer no Kafka.", ferramentas: ["Python", "Apache Kafka", "Docker", "kafka-python"], passosSimplificados: ["Inicie Kafka com Docker Compose.", "Crie tópico de eventos.", "Implemente producer que gera eventos simulados.", "Desenvolva consumer que processa em tempo real.", "Monitore lag e throughput."], entregavel: "Pipeline de streaming bidirecional funcionando no Kafka local.", comoPublicar: "GitHub com Docker Compose", sugestaoLinkedIn: "Construí pipeline de streaming com Apache Kafka!", proximoProjeto: "Transformações com Spark" },
  { id: "transformacoes-spark", nome: "Transformações de Dados com PySpark", areaSlug: "engenharia-dados" as string | null, nivel: "Intermediário", objetivo: "Processar grandes volumes de dados usando PySpark no ambiente local.", ferramentas: ["Python", "PySpark", "Jupyter Notebook"], passosSimplificados: ["Configure SparkSession local.", "Carregue dataset grande em Spark DataFrame.", "Execute filtros, joins e agregações.", "Compare performance com Pandas no mesmo dataset.", "Documente as transformações e resultados."], entregavel: "Notebook com transformações PySpark em dataset real.", comoPublicar: "GitHub ou Databricks Community", sugestaoLinkedIn: "Processei dados em larga escala com PySpark!", proximoProjeto: "Dashboard de Pipeline" },
  { id: "dashboard-pipeline-dados", nome: "Dashboard de Monitoramento de Pipeline", areaSlug: "engenharia-dados" as string | null, nivel: "Intermediário", objetivo: "Criar painel para monitorar status, logs e métricas de pipelines de dados.", ferramentas: ["Python", "Streamlit", "Plotly", "PostgreSQL", "SQLAlchemy"], passosSimplificados: ["Crie tabela de logs de execução no banco.", "Instrumente o pipeline para registrar início, fim e erros.", "Calcule métricas de volume e tempo de execução.", "Construa dashboard com Streamlit e Plotly.", "Adicione alertas visuais para falhas."], entregavel: "Dashboard web de monitoramento de pipeline em tempo real.", comoPublicar: "Streamlit Cloud", sugestaoLinkedIn: "Criei dashboard de observabilidade de pipeline de dados com Streamlit!", proximoProjeto: "Replicação de Banco" },
  { id: "replicacao-banco-dados", nome: "Replicação de Banco de Dados", areaSlug: "engenharia-dados" as string | null, nivel: "Avançado", objetivo: "Configurar replicação master-replica entre dois bancos PostgreSQL.", ferramentas: ["PostgreSQL", "Docker", "pg_replication"], passosSimplificados: ["Configure container master com WAL habilitado.", "Inicie container replica apontando para o master.", "Insira dados no master e verifique replica.", "Monitore lag de replicação.", "Documente o setup com diagrama."], entregavel: "Ambiente de replicação PostgreSQL funcionando com lag monitorado.", comoPublicar: "GitHub com Docker Compose", sugestaoLinkedIn: "Configurei replicação master-replica no PostgreSQL com Docker!", proximoProjeto: "Particionamento de Tabelas" },
  { id: "particionamento-tabelas", nome: "Particionamento de Tabelas em PostgreSQL", areaSlug: "engenharia-dados" as string | null, nivel: "Avançado", objetivo: "Implementar particionamento de tabela para melhorar performance em consultas de grande volume.", ferramentas: ["PostgreSQL", "DBeaver", "Python"], passosSimplificados: ["Crie tabela particionada por range de data.", "Insira dados distribuídos entre as particoes.", "Execute queries e compare planos de execução.", "Adicione índice por partição.", "Documente os ganhos de performance."], entregavel: "Tabela particionada com benchmarks de performance documentados.", comoPublicar: "GitHub com scripts SQL", sugestaoLinkedIn: "Implementei particionamento de tabelas no PostgreSQL com ganhos de performance!", proximoProjeto: "Pipeline de Logs" },
  { id: "pipeline-logs-elk", nome: "Pipeline de Logs com ELK Stack", areaSlug: "engenharia-dados" as string | null, nivel: "Avançado", objetivo: "Coletar, processar e visualizar logs de aplicação com Elasticsearch, Logstash e Kibana.", ferramentas: ["Elasticsearch", "Logstash", "Kibana", "Docker"], passosSimplificados: ["Inicie ELK Stack com Docker Compose.", "Configure Logstash para parsear logs de aplicação.", "Indexe os logs no Elasticsearch.", "Crie dashboard no Kibana com métricas de erro.", "Configure alertas para anomalias."], entregavel: "Stack de observabilidade ELK funcionando com dashboard de logs.", comoPublicar: "GitHub com Docker Compose e README", sugestaoLinkedIn: "Implementei stack ELK para monitoramento de logs de aplicação!", proximoProjeto: "Versionamento de Dados" },
  { id: "versionamento-dados-dvc", nome: "Versionamento de Dados com DVC", areaSlug: "engenharia-dados" as string | null, nivel: "Avançado", objetivo: "Versionar datasets e modelos de ML com DVC integrado ao Git.", ferramentas: ["Python", "DVC", "Git", "AWS S3 ou Google Drive"], passosSimplificados: ["Instale DVC e configure storage remoto.", "Adicione dataset ao controle do DVC.", "Crie pipeline DVC com etapas reproduziveis.", "Versione diferentes experimentos.", "Compartilhe pipeline via GitHub."], entregavel: "Projeto com dados e modelos versionados e pipeline reproduzível.", comoPublicar: "GitHub com DVC remote configurado", sugestaoLinkedIn: "Versionei datasets e modelos de ML com DVC e Git!", proximoProjeto: "Monitoramento de Pipeline" },
  { id: "monitoramento-qualidade-dados", nome: "Monitoramento Contínuo de Qualidade", areaSlug: "engenharia-dados" as string | null, nivel: "Avançado", objetivo: "Implementar monitoramento automático de qualidade de dados com alertas em produção.", ferramentas: ["Python", "Great Expectations", "Apache Airflow", "Slack API"], passosSimplificados: ["Integre Great Expectations ao Airflow como task.", "Configure expectations críticas para cada fonte.", "Acione alerta no Slack ao falhar validação.", "Crie relatório diário de qualidade de dados.", "Implemente dashboard de histórico de validações."], entregavel: "Sistema de monitoramento de qualidade com alertas automáticos.", comoPublicar: "GitHub com diagrama de arquitetura", sugestaoLinkedIn: "Implementei monitoramento contínuo de qualidade de dados com Airflow e Slack!", proximoProjeto: "Data Mesh básico" },
  { id: "data-mesh-basico", nome: "Arquitetura Data Mesh Básica", areaSlug: "engenharia-dados" as string | null, nivel: "Avançado", objetivo: "Implementar conceitos de data mesh com domínios de dados independentes.", ferramentas: ["Python", "PostgreSQL", "dbt", "FastAPI", "Docker"], passosSimplificados: ["Defina dois domínios de dados independentes.", "Implemente API de dados para cada domínio.", "Crie contratos de dados entre os domínios.", "Documente o catálogo de dados de cada domínio.", "Configure pipeline dbt por domínio."], entregavel: "Prova de conceito de data mesh com dois domínios funcionais.", comoPublicar: "GitHub com diagrama de arquitetura", sugestaoLinkedIn: "Implementei prova de conceito de Data Mesh com domínios independentes!", proximoProjeto: "Lakehouse com Delta Lake" },
  // UX/UI (15)
  { id: "redesign-app-bancario", nome: "Redesign de App Bancário", areaSlug: "uxui" as string | null, nivel: "Iniciante", objetivo: "Reprojetar a experiência de um app bancário real melhorando usabilidade e clareza visual.", ferramentas: ["Figma"], passosSimplificados: ["Escolha um app bancário para redesenhar.", "Faça auditoria de usabilidade identificando problemas.", "Crie wireframes das telas principais.", "Desenvolva o design de alta fidelidade no Figma.", "Monte o protótipo interativo e documente as decisões."], entregavel: "Protótipo de alta fidelidade com justificativas de design.", comoPublicar: "Behance ou link do Figma", sugestaoLinkedIn: "Fiz o redesign de um app bancário no Figma focando em usabilidade!", proximoProjeto: "Design System Básico", proximoProjetoId: "design-system-mini" },
  { id: "teste-usabilidade-maze", nome: "Teste de Usabilidade com Maze", areaSlug: "uxui" as string | null, nivel: "Iniciante", objetivo: "Conduzir teste de usabilidade remoto em protótipo do Figma usando a plataforma Maze.", ferramentas: ["Figma", "Maze"], passosSimplificados: ["Crie protótipo de fluxo de compra no Figma.", "Importe o protótipo no Maze.", "Configure tarefas e missões para os participantes.", "Colete respostas de pelo menos 5 testadores.", "Analise taxas de conclusão e pontos de abandono."], entregavel: "Relatório de usabilidade com heatmaps e insights priorizados.", comoPublicar: "Notion ou PDF exportado", sugestaoLinkedIn: "Conduzi teste de usabilidade remoto com Maze e coletei insights valiosos!", proximoProjeto: "Wireframes de E-commerce", proximoProjetoId: "wireframes-ecommerce" },
  { id: "wireframes-ecommerce", nome: "Wireframes de E-commerce", areaSlug: "uxui" as string | null, nivel: "Iniciante", objetivo: "Criar wireframes de baixa fidelidade de uma loja virtual do zero até o checkout.", ferramentas: ["Figma", "FigJam"], passosSimplificados: ["Mapeie o fluxo do usuário em FigJam.", "Crie wireframes de home, listagem, produto e checkout.", "Valide o fluxo com pelo menos 2 colegas.", "Anote feedback e refine os wireframes.", "Documente as decisões de arquitetura de informação."], entregavel: "Wireframes completos do fluxo de compra com anotações.", comoPublicar: "Link do Figma ou Behance", sugestaoLinkedIn: "Criei wireframes de um e-commerce do mapa de fluxo até o checkout!", proximoProjeto: "Protótipo de Onboarding" },
  { id: "prototipo-onboarding", nome: "Protótipo de Fluxo de Onboarding", areaSlug: "uxui" as string | null, nivel: "Intermediário", objetivo: "Projetar experiência de primeiro uso de um app com telas de boas-vindas e configuração.", ferramentas: ["Figma"], passosSimplificados: ["Pesquise onboardings de referência (Duolingo, Notion, etc.).", "Defina as informações essenciais para coletar no primeiro acesso.", "Crie wireframes das telas de onboarding.", "Desenvolva o design de alta fidelidade.", "Prototipe as transições e teste com 3 usuários."], entregavel: "Protótipo interativo de onboarding com relatório de testes.", comoPublicar: "Figma ou Behance", sugestaoLinkedIn: "Desenhei um fluxo de onboarding completo com testes de usabilidade!", proximoProjeto: "Fluxo de Checkout" },
  { id: "fluxo-checkout-otimizado", nome: "Fluxo de Checkout Otimizado", areaSlug: "uxui" as string | null, subareaSlug: "product-design", nivel: "Intermediário", objetivo: "Redesenhar o fluxo de pagamento de um e-commerce para reduzir abandono de carrinho.", ferramentas: ["Figma", "Maze"], passosSimplificados: ["Analise o fluxo de checkout atual de um e-commerce.", "Identifique os pontos de fricao e abandono.", "Redesenhe o fluxo em no máximo 3 etapas.", "Adicione indicadores de progresso e microinterações.", "Valide com teste de usabilidade no Maze."], entregavel: "Novo fluxo de checkout com comparativo antes e depois.", comoPublicar: "Behance ou Figma", sugestaoLinkedIn: "Reduzi fricao no checkout redesenhando o fluxo com foco em conversão!", proximoProjeto: "App de Delivery no Figma", proximoProjetoId: "app-delivery-figma" },
  { id: "app-delivery-figma", nome: "App de Delivery no Figma", areaSlug: "uxui" as string | null, nivel: "Intermediário", objetivo: "Criar interface completa de app de entrega de comida do cardápio ao rastreamento.", ferramentas: ["Figma"], passosSimplificados: ["Analise referências como iFood e Rappi.", "Crie o sistema de cores e tipografia.", "Desenvolva telas: home, restaurante, pedido e rastreamento.", "Construa protótipo navegável.", "Documente o processo de design."], entregavel: "App de delivery com 8 telas e protótipo interativo.", comoPublicar: "Behance com link do Figma", sugestaoLinkedIn: "Desenhei app de delivery completo com 8 telas no Figma!", proximoProjeto: "Pesquisa com Usuários" },
  { id: "pesquisa-usuarios-formulario", nome: "Pesquisa de Usuários com Formulário", areaSlug: "uxui" as string | null, nivel: "Intermediário", objetivo: "Planejar e executar pesquisa qualitativa com usuários reais para validar uma hipótese.", ferramentas: ["Google Forms", "Notion", "Miro"], passosSimplificados: ["Defina a hipótese a ser validada.", "Crie roteiro de entrevista com 8 perguntas.", "Recrute e entreviste 5 participantes.", "Organize as respostas em mapa de afinidade no Miro.", "Extraia insights e recomendações de design."], entregavel: "Relatório de pesquisa com insights priorizados e recomendações.", comoPublicar: "Notion ou PDF", sugestaoLinkedIn: "Conduzi pesquisa com usuários reais e transformei insights em decisões de design!", proximoProjeto: "Mapa de Jornada do Cliente", proximoProjetoId: "persona-journey-mapa" },
  { id: "ui-kit-componentes", nome: "UI Kit com Auto Layout", areaSlug: "uxui" as string | null, nivel: "Avançado", objetivo: "Criar kit de interface responsivo usando Auto Layout avançado do Figma.", ferramentas: ["Figma"], passosSimplificados: ["Defina os fundamentos visuais do kit.", "Crie todos os estados dos componentes básicos.", "Use Auto Layout para comportamento responsivo.", "Monte composições de página usando apenas o kit.", "Documente as regras de uso de cada componente."], entregavel: "UI kit com 40 componentes usando Auto Layout avançado.", comoPublicar: "Figma Community", sugestaoLinkedIn: "Publiquei UI kit com Auto Layout avançado na comunidade do Figma!", proximoProjeto: "Dashboard Administrativo" },
  { id: "dashboard-administrativo-figma", nome: "Dashboard Administrativo no Figma", areaSlug: "uxui" as string | null, nivel: "Avançado", objetivo: "Projetar painel administrativo complexo com tabelas, gráficos e filtros avançados.", ferramentas: ["Figma"], passosSimplificados: ["Defina os KPIs e dados a serem exibidos.", "Crie o layout em grid com áreas bem definidas.", "Projete gráficos, tabelas e cards de métricas.", "Adicione estados de loading e vazio.", "Monte protótipo interativo dos filtros principais."], entregavel: "Dashboard de alta fidelidade com protótipo dos principais fluxos.", comoPublicar: "Behance ou Figma", sugestaoLinkedIn: "Desenhei dashboard administrativo complexo com foco em densidade de informação!", proximoProjeto: "App de Saúde" },
  { id: "app-saude-figma", nome: "App de Saúde e Bem-Estar", areaSlug: "uxui" as string | null, nivel: "Avançado", objetivo: "Criar app de acompanhamento de saúde com visualizações de dados pessoais.", ferramentas: ["Figma"], passosSimplificados: ["Pesquise apps de saúde como referência.", "Defina as métricas de saúde a acompanhar.", "Crie a identidade visual e sistema de cores.", "Desenvolva telas de dashboard, histórico e metas.", "Prototipe as interações principais e teste."], entregavel: "App de saúde com 10 telas e identidade visual própria.", comoPublicar: "Behance com link do Figma", sugestaoLinkedIn: "Desenhei app de saúde com visualização de dados pessoais!", proximoProjeto: "Landing Page Responsiva" },
  { id: "clone-tela-airbnb", nome: "Clone de Tela do Airbnb", areaSlug: "uxui" as string | null, nivel: "Avançado", objetivo: "Recriar fielmente a interface do Airbnb como exercício de precisão e atenção aos detalhes.", ferramentas: ["Figma"], passosSimplificados: ["Escolha uma página do Airbnb para recriar.", "Identifique a grade e o sistema de espaçamento.", "Recrie os componentes com precisão de pixels.", "Compare lado a lado com o original.", "Documente o que aprendeu sobre a arquitetura visual."], entregavel: "Clone fiel com anotações de aprendizado técnico.", comoPublicar: "Behance ou Figma", sugestaoLinkedIn: "Recriei fielmente uma tela do Airbnb para exercitar precisão de design!", proximoProjeto: "Sistema de Ícones" },
  { id: "sistema-icones-svg", nome: "Sistema de Ícones SVG Personalizados", areaSlug: "uxui" as string | null, nivel: "Avançado", objetivo: "Criar set de ícones originais e coerentes para um produto digital.", ferramentas: ["Figma", "Illustrator"], passosSimplificados: ["Defina o estilo visual: outline, filled ou duotone.", "Crie uma grade de 24x24px consistente.", "Desenhe 30 ícones originais no mesmo estilo.", "Exporte em SVG otimizado.", "Documente as regras de uso e tamanhos."], entregavel: "Set de 30 ícones SVG originais com documentação.", comoPublicar: "Figma Community ou GitHub", sugestaoLinkedIn: "Criei set de ícones SVG originais com estilo consistente!", proximoProjeto: "Design System Avançado" },
  // QA (15)
  { id: "automacao-login-cypress", nome: "Automação de Login com Cypress", areaSlug: "qa" as string | null, subareaSlug: "qa-automacao", nivel: "Iniciante", objetivo: "Automatizar o fluxo de login de uma aplicação web com Cypress.", ferramentas: ["Cypress", "JavaScript", "Node.js"], passosSimplificados: ["Instale Cypress no projeto.", "Crie spec de login com cy.visit e cy.get.", "Cubra cenários de sucesso e credenciais inválidas.", "Adicione verificação de redirecionamento após login.", "Execute os testes e verifique o relatório."], entregavel: "Suite de testes de login com 5 cenários automatizados.", comoPublicar: "GitHub", sugestaoLinkedIn: "Automatizei fluxo de login com Cypress cobrindo cenários de sucesso e erro!", proximoProjeto: "Testes de API com Postman", proximoProjetoId: "testes-api-postman" },
  { id: "testes-api-postman", nome: "Testes de API com Postman", areaSlug: "qa" as string | null, nivel: "Iniciante", objetivo: "Criar coleção de testes automatizados para uma API REST pública no Postman.", ferramentas: ["Postman"], passosSimplificados: ["Escolha uma API pública (JSONPlaceholder, ViaCEP).", "Crie coleção com requisições GET, POST, PUT, DELETE.", "Adicione assertions nos scripts de testes.", "Configure variáveis de ambiente.", "Execute a coleção e analise o relatório."], entregavel: "Coleção Postman com 15 testes automatizados exportada.", comoPublicar: "GitHub ou Postman Public Workspace", sugestaoLinkedIn: "Criei suite de testes de API REST automatizados no Postman!", proximoProjeto: "Testes E2E com Playwright" },
  { id: "bdd-cucumber-javascript", nome: "Testes BDD com Cucumber", areaSlug: "qa" as string | null, nivel: "Intermediário", objetivo: "Implementar testes em linguagem Gherkin com Cucumber integrado ao Cypress.", ferramentas: ["Cypress", "Cucumber", "JavaScript"], passosSimplificados: ["Instale o plugin Cypress-Cucumber-Preprocessor.", "Escreva cenários em Gherkin no arquivo .feature.", "Implemente os step definitions em JavaScript.", "Execute os cenários e verifique o resultado.", "Compartilhe os arquivos .feature com a equipe."], entregavel: "Suite BDD com cenários em Gherkin e steps implementados.", comoPublicar: "GitHub", sugestaoLinkedIn: "Implementei testes BDD com Cucumber e Cypress usando linguagem Gherkin!", proximoProjeto: "Relatório de Bugs" },
  { id: "relatorio-bugs-documentado", nome: "Relatório de Bugs Documentado", areaSlug: "qa" as string | null, nivel: "Intermediário", objetivo: "Executar sessão de testes exploratarios e documentar bugs de forma profissional.", ferramentas: ["Jira", "Notion", "Chrome DevTools"], passosSimplificados: ["Escolha uma aplicação web real para explorar.", "Execute sessão de 1 hora de testes exploratarios.", "Documente cada bug com título, passos, esperado e atual.", "Adicione evidências com screenshots e vídeos.", "Classifique por severidade e prioridade."], entregavel: "Relatório com 10 bugs documentados profissionalmente no Jira ou Notion.", comoPublicar: "Notion ou PDF", sugestaoLinkedIn: "Conduzi sessão de testes exploratarios e documentei 10 bugs profissionalmente!", proximoProjeto: "Testes Mobile com Appium", proximoProjetoId: "testes-mobile-appium" },
  { id: "testes-mobile-appium", nome: "Testes Mobile com Appium", areaSlug: "qa" as string | null, nivel: "Intermediário", objetivo: "Automatizar testes em aplicativo Android usando Appium.", ferramentas: ["Appium", "Python", "Android Studio", "Android Emulator"], passosSimplificados: ["Configure Appium Server e emulador Android.", "Instale o driver UiAutomator2.", "Crie script de teste para fluxo de login.", "Use locators adequados para elementos mobile.", "Execute no emulador e valide os resultados."], entregavel: "Suite de testes mobile automatizados para fluxo de login.", comoPublicar: "GitHub", sugestaoLinkedIn: "Automatizei testes mobile com Appium no Android!", proximoProjeto: "Testes Unitários em JavaScript" },
  { id: "testes-unitarios-jest", nome: "Testes Unitários com Jest", areaSlug: "qa" as string | null, nivel: "Intermediário", objetivo: "Criar suite de testes unitários para funções JavaScript com Jest.", ferramentas: ["Jest", "JavaScript", "Node.js"], passosSimplificados: ["Instale Jest no projeto.", "Escreva funções puras a serem testadas.", "Crie arquivos .test.js para cada módulo.", "Cubra casos felizes e casos de erro.", "Execute e verifique a cobertura de código."], entregavel: "Suite de testes unitários com 80% de cobertura de código.", comoPublicar: "GitHub", sugestaoLinkedIn: "Criei suite de testes unitários com Jest atingindo 80% de cobertura!", proximoProjeto: "Performance com JMeter" },
  { id: "automacao-formulario-selenium", nome: "Automação de Formulário com Selenium", areaSlug: "qa" as string | null, nivel: "Avançado", objetivo: "Automatizar preenchimento e validação de formulário complexo com Selenium.", ferramentas: ["Selenium WebDriver", "Python", "pytest"], passosSimplificados: ["Configure Selenium WebDriver com ChromeDriver.", "Implemente Page Object Model para o formulário.", "Automatize preenchimento de todos os campos.", "Valide mensagens de erro para cada campo.", "Integre com pytest para relatório estruturado."], entregavel: "Suite de automação de formulário com Page Object e relatório.", comoPublicar: "GitHub", sugestaoLinkedIn: "Automatizei formulário complexo com Selenium e Page Object Model!", proximoProjeto: "Testes de Regressão" },
  { id: "testes-regressao-suite", nome: "Suite de Testes de Regressão", areaSlug: "qa" as string | null, nivel: "Avançado", objetivo: "Criar suite de regressão completa para garantir que features existentes não quebram.", ferramentas: ["Cypress", "JavaScript", "GitHub Actions"], passosSimplificados: ["Mapeie as funcionalidades críticas da aplicação.", "Crie testes para cada funcionalidade principal.", "Organize em tags de smoke e regressão completa.", "Configure pipeline no GitHub Actions.", "Execute automaticamente a cada pull request."], entregavel: "Suite de regressão integrada ao CI/CD com execução automática.", comoPublicar: "GitHub com Actions configurado", sugestaoLinkedIn: "Implementei suite de regressão automática integrada ao CI/CD com Cypress!", proximoProjeto: "Testes de Acessibilidade" },
  { id: "testes-acessibilidade-axe", nome: "Testes de Acessibilidade com Axe", areaSlug: "qa" as string | null, nivel: "Avançado", objetivo: "Validar conformidade WCAG de uma aplicação web usando ferramentas de acessibilidade.", ferramentas: ["Cypress", "axe-core", "Lighthouse"], passosSimplificados: ["Instale o plugin cypress-axe.", "Execute scan de acessibilidade em cada página.", "Corrija violações críticas identificadas.", "Execute Lighthouse para validar contraste e semântica.", "Documente o relatório de conformidade WCAG."], entregavel: "Relatório de acessibilidade com violações e correções aplicadas.", comoPublicar: "GitHub ou PDF", sugestaoLinkedIn: "Auditei acessibilidade WCAG com Cypress e axe-core!", proximoProjeto: "Pipeline de Testes CI" },
  { id: "analise-cobertura-testes", nome: "Análise e Aumento de Cobertura de Testes", areaSlug: "qa" as string | null, nivel: "Avançado", objetivo: "Aumentar a cobertura de testes de um projeto de 40% para 80%.", ferramentas: ["Jest", "Istanbul", "JavaScript"], passosSimplificados: ["Execute relatório de cobertura atual com Istanbul.", "Identifique as funções com menos testes.", "Escreva testes para os casos não cobertos.", "Priorize logicas de negócio críticas.", "Documente a evolução da cobertura."], entregavel: "Projeto com cobertura aumentada de 40% para 80% documentada.", comoPublicar: "GitHub com badge de cobertura", sugestaoLinkedIn: "Aumentei a cobertura de testes de 40% para 80% com Jest e Istanbul!", proximoProjeto: "Testes de Contrato" },
  { id: "relatorio-qualidade-software", nome: "Relatório Completo de Qualidade", areaSlug: "qa" as string | null, nivel: "Avançado", objetivo: "Produzir relatório executivo de qualidade de software ao final de um ciclo de testes.", ferramentas: ["Jira", "Notion", "Excel", "TestRail"], passosSimplificados: ["Consolide os resultados de todos os testes executados.", "Calcule métricas de cobertura, defeitos e densidade.", "Crie gráficos de progresso e tendência.", "Avalie riscos residuais.", "Escreva sumário executivo com recomendação de go/no-go."], entregavel: "Relatório executivo de qualidade com métricas e recomendação.", comoPublicar: "Notion ou PDF", sugestaoLinkedIn: "Produzi relatório executivo de qualidade com métricas de cobertura e análise de risco!", proximoProjeto: "Automação Avançada" },
  // PRODUTO DIGITAL (15)
  { id: "prd-feature-nova", nome: "PRD de Feature Nova", areaSlug: "produto" as string | null, nivel: "Iniciante", objetivo: "Escrever documento de requisitos de produto para uma feature do zero.", ferramentas: ["Notion", "Google Docs"], passosSimplificados: ["Defina o problema que a feature resolve.", "Descreva a solução proposta e o escopo.", "Liste requisitos funcionais e não funcionais.", "Adicione critérios de aceite para cada requisito.", "Inclua métricas de sucesso e hipóteses."], entregavel: "PRD completo com problema, solução, requisitos e métricas.", comoPublicar: "Notion público ou PDF", sugestaoLinkedIn: "Escrevi meu primeiro PRD completo com problema, solução e critérios de aceite!", proximoProjeto: "Roadmap Trimestral" },
  { id: "roadmap-produto-trimestral", nome: "Roadmap de Produto Trimestral", areaSlug: "produto" as string | null, subareaSlug: "product-manager", nivel: "Iniciante", objetivo: "Criar roadmap visual de produto para um trimestre com temas e entregáveis.", ferramentas: ["Notion", "Miro", "Linear"], passosSimplificados: ["Defina os objetivos estratégicos do trimestre.", "Levante iniciativas e features planejadas.", "Priorize usando framework de impacto e esforço.", "Monte o roadmap visual por mês.", "Compartilhe com stakeholders e colete feedback."], entregavel: "Roadmap trimestral visual com iniciativas priorizadas.", comoPublicar: "Notion público ou Miro", sugestaoLinkedIn: "Criei roadmap de produto trimestral com prioridades alinhadas aos objetivos!", proximoProjeto: "OKRs de Produto" },
  { id: "okrs-produto", nome: "Framework de OKRs de Produto", areaSlug: "produto" as string | null, nivel: "Iniciante", objetivo: "Definir OKRs para um produto digital alinhados a estratégia da empresa.", ferramentas: ["Notion", "Google Sheets"], passosSimplificados: ["Defina o objetivo estratégico de negócio.", "Crie 3 a 5 Resultados-Chave mensuraveis.", "Defina as iniciativas que movem cada KR.", "Configure o tracker de progresso mensal.", "Documente o processo de revisão quinzenal."], entregavel: "Framework de OKRs com 3 objetivos e 9 KRs com tracker.", comoPublicar: "Notion ou Google Sheets", sugestaoLinkedIn: "Defini OKRs de produto mensuraveis alinhados a estratégia do negócio!", proximoProjeto: "Mapa de Jornada" },
  { id: "mapa-jornada-usuario-produto", nome: "Mapa de Jornada do Usuário", areaSlug: "produto" as string | null, nivel: "Iniciante", objetivo: "Mapear a experiência completa de um usuário no produto identificando pontos de dor.", ferramentas: ["Miro", "FigJam", "Notion"], passosSimplificados: ["Defina a persona e o objetivo principal.", "Mapeie todas as etapas da interação com o produto.", "Anote ações, pensamentos e emoções.", "Identifique os 3 maiores pontos de dor.", "Proponha melhorias para cada ponto de dor."], entregavel: "Mapa de jornada com 5 etapas, emoções e oportunidades de melhoria.", comoPublicar: "Miro ou Notion", sugestaoLinkedIn: "Mapeei jornada completa do usuário e identifiquei oportunidades de produto!", proximoProjeto: "Pesquisa de Discovery" },
  { id: "priorizacao-rice", nome: "Priorização com Framework RICE", areaSlug: "produto" as string | null, nivel: "Intermediário", objetivo: "Priorizar backlog de features usando o framework RICE de forma estruturada.", ferramentas: ["Notion", "Google Sheets"], passosSimplificados: ["Liste todas as features do backlog.", "Estime Reach, Impact, Confidence e Effort.", "Calcule o score RICE para cada item.", "Ordene o backlog pelo score.", "Documente as decisões de priorização."], entregavel: "Backlog priorizado com scores RICE e justificativas documentadas.", comoPublicar: "Notion ou Google Sheets", sugestaoLinkedIn: "Priorizei backlog de produto usando framework RICE de forma estruturada!", proximoProjeto: "Análise de Concorrentes" },
  { id: "analise-concorrentes-produto", nome: "Análise Competitiva de Produto", areaSlug: "produto" as string | null, nivel: "Intermediário", objetivo: "Conduzir análise estruturada de concorrentes para identificar gaps e oportunidades.", ferramentas: ["Notion", "Miro", "Google Sheets"], passosSimplificados: ["Identifique 5 concorrentes diretos e indiretos.", "Defina os critérios de comparação.", "Analise features, preços e posicionamento.", "Monte matriz de comparação visual.", "Identifique gaps e oportunidades de diferenciacao."], entregavel: "Matriz competitiva com gaps identificados e oportunidades de produto.", comoPublicar: "Notion ou PDF", sugestaoLinkedIn: "Conduzi análise competitiva estruturada e identifiquei oportunidades de diferenciacao!", proximoProjeto: "Especificação de Produto" },
  { id: "especificacao-produto", nome: "Documento de Especificação Técnica", areaSlug: "produto" as string | null, nivel: "Intermediário", objetivo: "Escrever especificação técnica de produto para alinhar times de produto e engenharia.", ferramentas: ["Notion", "Confluence", "Figma"], passosSimplificados: ["Defina o escopo e objetivos da feature.", "Descreva o comportamento esperado em cada cenário.", "Adicione wireframes ou referências de UI.", "Especifique as regras de negócio.", "Liste dependências e riscos técnicos."], entregavel: "Especificação técnica completa pronta para desenvolvimento.", comoPublicar: "Notion ou Confluence", sugestaoLinkedIn: "Escrevi especificação técnica que alinhou produto e engenharia!", proximoProjeto: "Plano de Lançamento" },
  { id: "analise-funil-conversao", nome: "Análise de Funil de Conversão", areaSlug: "produto" as string | null, nivel: "Avançado", objetivo: "Mapear e otimizar o funil de conversão identificando os maiores pontos de queda.", ferramentas: ["Google Analytics", "Amplitude", "Hotjar", "Excel"], passosSimplificados: ["Mapeie todas as etapas do funil de conversão.", "Extraia as taxas de conversão por etapa.", "Use heatmaps para entender comportamento.", "Identifique a etapa com maior queda.", "Proponha e priorize 3 experimentos de otimização."], entregavel: "Relatório de funil com análise de queda e experimentos propostos.", comoPublicar: "Notion ou PDF", sugestaoLinkedIn: "Analisei funil de conversão e identifiquei os principais pontos de queda!", proximoProjeto: "Teste AB" },
  { id: "personas-usuario", nome: "Personas de Usuário Baseadas em Dados", areaSlug: "produto" as string | null, nivel: "Avançado", objetivo: "Criar personas fundamentadas em pesquisa qualitativa e dados quantitativos.", ferramentas: ["Notion", "Miro", "Google Analytics", "Hotjar"], passosSimplificados: ["Combine dados de analytics com insights de entrevistas.", "Identifique segmentos de usuários com comportamentos distintos.", "Crie 3 personas com nome, objetivos e dores.", "Valide as personas com stakeholders.", "Use as personas para priorizar decisões de produto."], entregavel: "3 personas validadas com dados quantitativos e qualitativos.", comoPublicar: "Miro ou Notion", sugestaoLinkedIn: "Criei personas de usuário baseadas em dados quantitativos e entrevistas!", proximoProjeto: "Estratégia de Produto" },
  { id: "estrategia-produto", nome: "Estratégia de Produto de 12 Meses", areaSlug: "produto" as string | null, nivel: "Avançado", objetivo: "Elaborar estratégia de produto para os próximos 12 meses alinhada ao negócio.", ferramentas: ["Notion", "Miro", "Google Slides"], passosSimplificados: ["Defina a visão de longo prazo do produto.", "Analise o mercado e posicionamento competitivo.", "Defina as apostas estratégicas por semestre.", "Crie o roadmap temático de alto nível.", "Apresente para stakeholders e colete alinhamento."], entregavel: "Estratégia de produto com visão, apostas e roadmap temático.", comoPublicar: "Notion ou Google Slides", sugestaoLinkedIn: "Elaborei estratégia de produto para 12 meses com visão e apostas estratégicas!", proximoProjeto: "Retrospectiva de Produto" },
  { id: "retrospectiva-produto", nome: "Retrospectiva e Aprendizados de Produto", areaSlug: "produto" as string | null, nivel: "Avançado", objetivo: "Conduzir retrospectiva de ciclo de produto documentando aprendizados e próximos passos.", ferramentas: ["Notion", "Miro", "FigJam"], passosSimplificados: ["Colete métricas e resultados do ciclo.", "Identifique o que foi bem e o que pode melhorar.", "Conduza sessão colaborativa com o time.", "Documente os principais aprendizados.", "Defina as mudanças de processo para o próximo ciclo."], entregavel: "Documento de retrospectiva com aprendizados e ações de melhoria.", comoPublicar: "Notion ou PDF", sugestaoLinkedIn: "Conduzi retrospectiva de produto e transformei aprendizados em melhorias de processo!", proximoProjeto: "OKRs do Próximo Ciclo" },
];
