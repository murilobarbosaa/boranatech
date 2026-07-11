// Catalogo canonico de projetos da plataforma (fonte unica: consumido pela
// pagina /projetos, pelos cards de projeto das trilhas e, a partir da fase
// 5b, tambem pelo server via caminho relativo). Movido de client/src/lib/
// data.ts na Fase 5b; data.ts re-exporta pra compatibilidade.

// Tier do catalogo de projetos: sem `pro` = gratuito (todos os projetos
// vinculados a trilhas sao gratuitos por design); `pro: true` = desafio
// premium, navegavel por assinantes em /projetos e consumido pelo roadmap
// com IA (fase 5c). Trilha estatica nunca aponta pra projeto pro.
export type ProjetoCatalogo = {
  id: string;
  nome: string;
  areaSlug: string | null;
  nivel: string;
  objetivo: string;
  ferramentas: string[];
  passosSimplificados: string[];
  entregavel: string;
  comoPublicar: string;
  sugestaoLinkedIn: string;
  proximoProjeto: string;
  pro?: true;
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
  },
  {
    id: "buscador-cep",
    nome: "Buscador de CEP com API",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
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
    nivel: "Avançado",
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
    nivel: "Intermediário",
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
    id: "previsao-churn-tabular",
    nome: "Previsão de churn (dados tabulares)",
    areaSlug: "dados" as string | null,
    nivel: "Avançado",
    objetivo:
      "Classificar clientes com risco de cancelar usando dados sintéticos ou públicos.",
    ferramentas: ["Python", "Scikit-learn", "Pandas"],
    passosSimplificados: [
      "Obtenha dataset com rótulo",
      "Feature engineering básico",
      "Treine baseline e modelo comparável",
      "Métricas: precision/recall/AUC",
      "Explique trade-offs ao negócio",
    ],
    entregavel: "Notebook reprodutível com conclusões.",
    comoPublicar: "Kaggle ou GitHub",
    sugestaoLinkedIn:
      "Modelo de churn com validação cruzada e discussão de métricas que importam pro negócio.",
    proximoProjeto: "Serializar modelo e endpoint de inferência",
  },
  {
    id: "automacao-api-postman-newman",
    nome: "Coleção Postman + smoke tests",
    areaSlug: "qa" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Documentar API com testes automatizados na coleção e rodar em CI.",
    ferramentas: ["Postman", "Newman", "GitHub Actions"],
    passosSimplificados: [
      "Importe ou crie requests",
      "Scripts de teste em cada response",
      "Variáveis de ambiente",
      "Pipeline com newman run",
      "Badge ou log no repositório",
    ],
    entregavel: "Repositório com workflow e coleção exportada.",
    comoPublicar: "GitHub Actions",
    sugestaoLinkedIn:
      "Automatizei testes de contrato de API com Postman/Newman no CI, feedback rápido a cada push.",
    proximoProjeto: "Testes E2E no front consumindo a mesma API",
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
    id: "terraform-vm-hello",
    nome: "Infra mínima com Terraform",
    areaSlug: "devops" as string | null,
    nivel: "Intermediário",
    objetivo: "Provisionar um recurso simples na nuvem com código versionado.",
    ferramentas: ["Terraform", "AWS, GCP ou Azure (free tier)"],
    passosSimplificados: [
      "Provider e backend local",
      "Recurso mínimo (bucket, VM ou network)",
      "Outputs úteis",
      "terraform plan/apply documentado",
      "Desmonte com destroy",
    ],
    entregavel: "Repositório com módulos e README de custo/alertas.",
    comoPublicar: "GitHub + execução local",
    sugestaoLinkedIn:
      "Primeiro módulo Terraform: plan documentado, outputs e lições sobre custo no free tier.",
    proximoProjeto: "Pipeline que valida fmt e plan no PR",
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
    comoPublicar: "GitHub privado ou portfolio redigido",
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
    areaSlug: "dados" as string | null,
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
    id: "etl-pipeline-python",
    nome: "Pipeline ETL com Python (arquivo → limpeza → destino)",
    areaSlug: "dados" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Simular engenharia de dados: extrair, validar, transformar e carregar, base para vagas de analista/engineer de dados júnior.",
    ferramentas: ["Python", "Pandas", "SQLite ou DuckDB", "cron ou Makefile"],
    passosSimplificados: [
      "Fonte CSV ou API pública",
      "Regras de qualidade (nulos, duplicados)",
      "Tabelas agregadas ou star schema simples",
      "Script idempotente (reprocessável)",
      "Log ou relatório de linhas processadas",
    ],
    entregavel: "Repositório com dados de exemplo e instrução para reexecutar.",
    comoPublicar: "GitHub",
    sugestaoLinkedIn:
      "Montei um ETL reprodutível em Python com validação e carga em banco local, linguagem direta de quem quer entrar em dados.",
    proximoProjeto: "Orquestrar com Airflow ou Dagster (cloud free tier)",
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
    id: "prd-feature-ia",
    nome: "PRD de feature com uso responsável de IA",
    areaSlug: "gestao" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Escrever documento que engenheiros e design consigam executar, formato padrão em PM para iniciativas com LLM ou recomendação.",
    ferramentas: ["Notion, Google Docs ou template ADR+PRD"],
    passosSimplificados: [
      "Problema, público e métrica de sucesso",
      "Escopo in/out e riscos (privacidade, viés, custo de API)",
      "Fluxo da usuária e edge cases",
      "Requisitos funcionais e não funcionais",
      "Critérios de aceite testáveis",
    ],
    entregavel: "PRD de 3 a 5 páginas com anexo de riscos de IA.",
    comoPublicar: "Notion público ou PDF no portfólio",
    sugestaoLinkedIn:
      "Redigi um PRD para feature com IA incluindo riscos, métricas e critérios de aceite. Mostra maturidade de produto em 2025.",
    proximoProjeto: "Discovery com entrevistas sintéticas e síntese",
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
    entregavel: "README com diagrama do fluxo e print/video.",
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
  },
  {
    id: "dashboard-de-clima",
    nome: "Dashboard de Clima",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Mostrar a previsão do tempo de uma cidade buscando os dados de uma API de clima.",
    ferramentas: ["HTML", "CSS", "JavaScript", "fetch", "API de clima"],
    passosSimplificados: [
      "Crie um campo de busca por cidade",
      "Consulte uma API de clima com o nome da cidade",
      "Exiba temperatura, condição e ícone do tempo",
      "Adicione estados de carregando e de erro",
      "Deixe o layout responsivo e publique",
    ],
    entregavel: "Página que mostra o clima atual de qualquer cidade buscada.",
    comoPublicar: "GitHub Pages ou Netlify",
    sugestaoLinkedIn:
      "Fiz um dashboard de clima que consome uma API e mostra a previsão de qualquer cidade! Aprendi a lidar com estados de carregamento e erro. Dá uma olhada!",
    proximoProjeto: "Galeria de Fotos com Busca",
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
  },
  {
    id: "api-rest-tarefas",
    nome: "API REST de Tarefas",
    areaSlug: "backend" as string | null,
    nivel: "Intermediário",
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
  },
  {
    id: "encurtador-de-links",
    nome: "Encurtador de Links",
    areaSlug: "fullstack" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Receber um link longo e gerar um link curto que redireciona para o original.",
    ferramentas: ["Node.js", "Express", "Banco de dados", "HTML", "CSS"],
    passosSimplificados: [
      "Crie a tela para colar o link e ver o link curto",
      "No backend, gere um código único para cada link",
      "Salve o par (código e link original) no banco",
      "Crie a rota que redireciona o código para o link original",
      "Publique o front e o back",
    ],
    entregavel: "Encurtador funcionando: gera link curto e redireciona.",
    comoPublicar: "Front no Vercel e back no Render ou Railway",
    sugestaoLinkedIn:
      "Desenvolvi um encurtador de links fullstack! Treinei geração de códigos únicos, redirecionamento e integração front com back. Link nos comentários!",
    proximoProjeto: "Autenticação com JWT",
  },
  {
    id: "autenticacao-jwt",
    nome: "Autenticação com JWT",
    areaSlug: "backend" as string | null,
    nivel: "Avançado",
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
  },
  {
    id: "chatbot-com-ia",
    nome: "Chatbot com IA",
    areaSlug: "ia" as string | null,
    nivel: "Avançado",
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
  },
  {
    id: "jogo-da-memoria",
    nome: "Jogo da Memória",
    areaSlug: "gamedev" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Criar um jogo da memória onde a pessoa vira cartas e tenta achar os pares.",
    ferramentas: ["HTML", "CSS", "JavaScript"],
    passosSimplificados: [
      "Monte o tabuleiro com as cartas embaralhadas",
      "Faça a carta virar ao clicar",
      "Compare duas cartas viradas e verifique se são par",
      "Conte tentativas e mostre quando o jogador vencer",
      "Adicione um botão de reiniciar e publique",
    ],
    entregavel: "Jogo da memória jogável e publicado.",
    comoPublicar: "GitHub Pages ou Netlify",
    sugestaoLinkedIn:
      "Desenvolvi um jogo da memória do zero em JavaScript! Treinei manipulação de DOM, lógica de comparação e controle de estado. Joga aí!",
    proximoProjeto: "App de Notas com Markdown",
  },
  {
    id: "design-system-storybook",
    nome: "Design System com Storybook",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    objetivo:
      "Criar um pequeno conjunto de componentes reutilizáveis e documentá-los no Storybook.",
    ferramentas: ["React", "Storybook", "CSS", "TypeScript"],
    passosSimplificados: [
      "Crie componentes base: botão, input e card",
      "Padronize cores, espaçamentos e tipografia",
      "Documente cada componente no Storybook",
      "Mostre as variações (estados, tamanhos)",
      "Publique o Storybook",
    ],
    entregavel: "Storybook publicado com os componentes e suas variações.",
    comoPublicar: "Chromatic ou GitHub Pages",
    sugestaoLinkedIn:
      "Montei um mini design system com componentes reutilizáveis documentados no Storybook! Treinei padronização visual e documentação de UI. Dá uma olhada!",
    proximoProjeto: "Galeria de Fotos com Busca",
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
    nivel: "Iniciante",
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
    id: "pipeline-csv-banco",
    nome: "Pipeline de CSV para Banco de Dados",
    areaSlug: "engenharia-dados" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Criar um fluxo que lê arquivos CSV, limpa os dados e carrega em um banco de dados.",
    ferramentas: ["Python", "Pandas", "SQLite"],
    passosSimplificados: [
      "Escolher uma base pública em CSV",
      "Ler e inspecionar os dados com Python",
      "Limpar e padronizar colunas e valores",
      "Carregar os dados tratados em um banco local",
      "Criar uma consulta de validação dos dados carregados",
    ],
    entregavel: "Script que transforma CSV em dados organizados em um banco",
    comoPublicar:
      "Publicar o script no GitHub com a base de exemplo e instruções de execução",
    sugestaoLinkedIn:
      "Criei meu primeiro pipeline de dados, lendo CSV, limpando e carregando em um banco. Foi uma introdução prática a extração, transformação e carga de dados.",
    proximoProjeto: "Pipeline Agendado com Atualização Automática",
  },
  {
    id: "lista-tarefas-fullstack",
    nome: "Lista de Tarefas Fullstack",
    areaSlug: "fullstack" as string | null,
    nivel: "Iniciante",
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
    id: "plano-testes-formulario",
    nome: "Plano de Testes para um Formulário",
    areaSlug: "qa" as string | null,
    nivel: "Iniciante",
    objetivo:
      "Criar e executar um plano de testes manual para um formulário de cadastro.",
    ferramentas: ["Google Sheets", "Markdown"],
    passosSimplificados: [
      "Mapear os campos e regras do formulário",
      "Escrever cenários positivos e negativos",
      "Definir o resultado esperado de cada caso",
      "Executar os testes e registrar o que aconteceu",
      "Reportar os problemas encontrados com evidências",
    ],
    entregavel: "Plano de testes com casos, execução e bugs documentados",
    comoPublicar:
      "Publicar o plano no GitHub como documentação ou planilha exportada",
    sugestaoLinkedIn:
      "Criei meu primeiro plano de testes manual para um formulário, cobrindo cenários positivos e negativos. Foi uma boa introdução à mentalidade de qualidade.",
    proximoProjeto: "Plano de Testes para um Fluxo de Login",
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
  // verificaveis num repositorio GitHub, pra validacao futura pelo leitor
  // de GitHub (fase 5c).
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
  },
];
