export const interviewSteps = [
  [
    "Triagem de currículo (ATS)",
    "Aderência, palavras-chave e clareza.",
    "Adapte o currículo para a vaga e destaque projetos.",
    "Currículo genérico sem links.",
    "Use termos da vaga sem inventar experiência.",
  ],
  [
    "Entrevista de RH / cultura fit",
    "Comunicação, motivação e contexto.",
    "Treine sua história e exemplos reais.",
    "Responder de forma vaga.",
    "Use situação, ação e resultado.",
  ],
  [
    "Teste técnico / desafio de código",
    "Raciocínio e entrega.",
    "Leia o enunciado, documente decisões e entregue algo funcional.",
    "Tentar fazer complexo demais.",
    "Explique trade-offs no README.",
  ],
  [
    "Entrevista técnica com dev",
    "Fundamentos e capacidade de explicar.",
    "Revise projetos e bases da sua stack.",
    "Chutar respostas.",
    "Diga como investigaria se não souber.",
  ],
  [
    "Entrevista com gestor",
    "Autonomia e encaixe no time.",
    "Pergunte sobre expectativas e rotina.",
    "Não fazer perguntas.",
    "Mostre vontade de aprender com clareza.",
  ],
  [
    "Proposta e negociação",
    "Alinhamento de salário e disponibilidade.",
    "Pesquise faixas e saiba seu mínimo.",
    "Aceitar sem entender benefícios.",
    "Negocie com dados e calma.",
  ],
].map(([title, evaluate, prepare, mistakes, tip]) => ({
  title,
  evaluate,
  prepare,
  mistakes,
  tip,
}));

export const interviewQuestions = [
  {
    area: "Front-end",
    type: "Técnica",
    level: "Júnior",
    question: "Explique a diferença entre props e state no React.",
    good: "Props vêm do componente pai; state pertence ao componente e muda com interação.",
    bad: "São a mesma coisa.",
  },
  {
    area: "Back-end",
    type: "Técnica",
    level: "Júnior",
    question: "O que é uma API REST?",
    good: "É uma forma de expor recursos via HTTP usando métodos como GET, POST, PUT e DELETE.",
    bad: "É qualquer backend.",
  },
  {
    area: "Dados",
    type: "Técnica",
    level: "Júnior",
    question: "Como você trataria dados faltantes?",
    good: "Depende do contexto: remover, preencher, sinalizar ou investigar a origem.",
    bad: "Sempre coloco zero.",
  },
  {
    area: "Geral",
    type: "Comportamental",
    level: "Estágio",
    question: "Conte sobre um desafio que você teve aprendendo tecnologia.",
    good: "Descreve contexto, ação, dificuldade e aprendizado.",
    bad: "Nunca tive dificuldade.",
  },
  {
    area: "Geral",
    type: "Lógica",
    level: "Júnior",
    question: "Como investigaria um bug que só acontece em produção?",
    good: "Reproduzir, olhar logs, comparar ambientes e isolar hipóteses.",
    bad: "Tentaria mudar coisas até funcionar.",
  },
  {
    area: "Front-end",
    type: "Técnica",
    level: "Estágio",
    question:
      "O que é responsividade e como você testa uma interface responsiva?",
    good: "Explica adaptação a diferentes telas, uso de media queries/flex/grid e testes no navegador ou dispositivo real.",
    bad: "É quando o site fica bonito no meu computador.",
  },
  {
    area: "Front-end",
    type: "Técnica",
    level: "Trainee",
    question:
      "Como você organizaria uma pequena entrega front-end do início ao fim?",
    good: "Quebraria a demanda em layout, estados, consumo de dados, acessibilidade, testes manuais e revisão com o time.",
    bad: "Faria a tela direto e esperaria alguém testar.",
  },
  {
    area: "Front-end",
    type: "Técnica",
    level: "Júnior",
    question: "Qual a diferença entre HTML semântico e HTML comum?",
    good: "HTML semântico usa tags com significado, como header, main, section e button, melhorando acessibilidade e SEO.",
    bad: "É só usar div com nomes diferentes.",
  },
  {
    area: "Front-end",
    type: "Técnica",
    level: "Júnior",
    question: "Como você consumiria uma API em uma tela React?",
    good: "Usaria estado para dados e loading, efeito para buscar, tratamento de erro e renderização condicional.",
    bad: "Colocaria o fetch direto no HTML.",
  },
  {
    area: "Front-end",
    type: "Técnica",
    level: "Pleno",
    question: "O que pode causar re-renderizações desnecessárias em React?",
    good: "Mudanças de estado amplas, props recriadas, funções inline em componentes grandes e falta de memoização quando há custo real.",
    bad: "React sempre renderiza tudo e não tem como melhorar.",
  },
  {
    area: "Back-end",
    type: "Técnica",
    level: "Estágio",
    question: "O que é autenticação e o que é autorização?",
    good: "Autenticação confirma quem é a pessoa; autorização define o que ela pode acessar ou fazer.",
    bad: "As duas significam login.",
  },
  {
    area: "Back-end",
    type: "Técnica",
    level: "Trainee",
    question: "Como você documentaria uma API para outra pessoa do time usar?",
    good: "Descreveria rotas, métodos, payloads, respostas, erros comuns, autenticação e exemplos de request.",
    bad: "Mandaria o código e deixaria a pessoa descobrir.",
  },
  {
    area: "Back-end",
    type: "Técnica",
    level: "Júnior",
    question: "Qual a diferença entre banco SQL e NoSQL?",
    good: "SQL usa tabelas e relações estruturadas; NoSQL é mais flexível e pode usar documentos, chave-valor ou grafos.",
    bad: "SQL é antigo e NoSQL é sempre melhor.",
  },
  {
    area: "Back-end",
    type: "Técnica",
    level: "Júnior",
    question: "Como você lidaria com erros em uma API?",
    good: "Validaria entrada, retornaria status HTTP adequado, mensagem clara, logs e evitaria expor detalhes sensíveis.",
    bad: "Retornaria erro 500 para tudo.",
  },
  {
    area: "Back-end",
    type: "Técnica",
    level: "Pleno",
    question: "Quando você usaria cache em uma aplicação?",
    good: "Usaria para dados lidos com frequência e pouco mutáveis, medindo impacto e definindo invalidação.",
    bad: "Usaria cache em tudo para ficar rápido.",
  },
  {
    area: "Dados",
    type: "Técnica",
    level: "Estágio",
    question: "Qual a diferença entre média e mediana?",
    good: "Média soma valores e divide pela quantidade; mediana é o valor central e sofre menos com extremos.",
    bad: "São duas formas iguais de calcular resultado.",
  },
  {
    area: "Dados",
    type: "Técnica",
    level: "Trainee",
    question:
      "Como você validaria se um dashboard está respondendo à pergunta certa?",
    good: "Confirmaria a pergunta de negócio, métricas, fonte dos dados, filtros, público e decisão esperada.",
    bad: "Colocaria muitos gráficos para parecer completo.",
  },
  {
    area: "Dados",
    type: "Técnica",
    level: "Júnior",
    question: "Como você explicaria um insight para uma pessoa não técnica?",
    good: "Começaria pela pergunta de negócio, mostraria o dado principal, impacto e recomendação prática.",
    bad: "Mostraria todos os gráficos e deixaria a pessoa interpretar.",
  },
  {
    area: "Dados",
    type: "Técnica",
    level: "Júnior",
    question: "O que é uma query SQL com JOIN?",
    good: "É uma consulta que combina dados de tabelas relacionadas usando uma chave em comum.",
    bad: "É uma consulta que junta qualquer arquivo.",
  },
  {
    area: "QA",
    type: "Técnica",
    level: "Estágio",
    question: "O que deve ter em um bom bug report?",
    good: "Título claro, ambiente, passos para reproduzir, resultado esperado, resultado atual, evidências e impacto.",
    bad: "Só escrever que está quebrado.",
  },
  {
    area: "QA",
    type: "Técnica",
    level: "Júnior",
    question: "Qual a diferença entre teste manual e teste automatizado?",
    good: "Manual é executado por uma pessoa; automatizado usa scripts para repetir cenários com rapidez e consistência.",
    bad: "Teste automatizado substitui todo teste manual.",
  },
  {
    area: "DevOps",
    type: "Técnica",
    level: "Júnior",
    question: "O que é CI/CD?",
    good: "Integração e entrega contínua para testar, construir e publicar mudanças com mais segurança.",
    bad: "É só uma ferramenta para subir projeto.",
  },
  {
    area: "UX/UI",
    type: "Técnica",
    level: "Júnior",
    question: "Como você validaria se uma tela está fácil de usar?",
    good: "Observaria usuários, faria teste de usabilidade, analisaria tarefas, dúvidas e pontos de fricção.",
    bad: "Se eu achei bonita, está fácil.",
  },
  {
    area: "Geral",
    type: "Comportamental",
    level: "Estágio",
    question: "Por que você quer trabalhar com tecnologia?",
    good: "Conecta interesse real, aprendizado, projetos e o tipo de problema que quer resolver.",
    bad: "Porque paga bem.",
  },
  {
    area: "Geral",
    type: "Comportamental",
    level: "Estágio",
    question: "Como você organiza seus estudos?",
    good: "Mostra rotina, metas pequenas, prática com projetos, revisão e ajuste quando algo não funciona.",
    bad: "Estudo quando dá vontade.",
  },
  {
    area: "Geral",
    type: "Comportamental",
    level: "Trainee",
    question:
      "Por que você se interessou por um programa de trainee em tecnologia?",
    good: "Conecta aprendizado acelerado, rotação por áreas, visão de negócio e vontade de crescer com feedback.",
    bad: "Porque parece mais fácil que uma vaga normal.",
  },
  {
    area: "Geral",
    type: "Comportamental",
    level: "Júnior",
    question: "Conte sobre uma vez em que recebeu feedback.",
    good: "Explica o feedback, como reagiu, o que mudou e qual foi o resultado.",
    bad: "Não gosto de feedback porque atrapalha.",
  },
  {
    area: "Geral",
    type: "Comportamental",
    level: "Júnior",
    question: "Como você age quando não sabe resolver uma tarefa?",
    good: "Pesquisa, testa hipóteses, documenta tentativas e pede ajuda com contexto claro.",
    bad: "Espero alguém me dizer o que fazer.",
  },
  {
    area: "Geral",
    type: "Comportamental",
    level: "Júnior",
    question: "Fale sobre um projeto do seu portfólio.",
    good: "Apresenta problema, tecnologias, decisões, dificuldades, resultado e aprendizados.",
    bad: "Só lista tecnologias usadas.",
  },
  {
    area: "Geral",
    type: "Comportamental",
    level: "Pleno",
    question: "Como você prioriza tarefas quando tudo parece urgente?",
    good: "Alinha impacto, prazo, risco, dependências e comunica trade-offs para o time.",
    bad: "Faço tudo ao mesmo tempo.",
  },
  {
    area: "Geral",
    type: "Lógica",
    level: "Estágio",
    question: "Como você descobriria por que uma página está lenta?",
    good: "Mediria carregamento, olharia rede, console, tamanho de assets e isolaria mudanças recentes.",
    bad: "Colocaria outro framework.",
  },
  {
    area: "Geral",
    type: "Lógica",
    level: "Júnior",
    question: "Como você explicaria a solução de um problema antes de codar?",
    good: "Quebraria em entradas, saídas, regras, casos de borda e passos principais.",
    bad: "Começaria codando para ver no que dá.",
  },
  {
    area: "Geral",
    type: "Lógica",
    level: "Júnior",
    question: "Como encontrar valores duplicados em uma lista?",
    good: "Percorreria a lista usando uma estrutura auxiliar como Set ou mapa de contagem.",
    bad: "Compararia manualmente olhando item por item.",
  },
  {
    area: "Geral",
    type: "Lógica",
    level: "Júnior",
    question: "Como você estimaria o tempo de uma tarefa desconhecida?",
    good: "Dividiria em partes, identificaria riscos, faria uma investigação curta e comunicaria margem de incerteza.",
    bad: "Chutaria um prazo para parecer confiante.",
  },
  {
    area: "Geral",
    type: "Lógica",
    level: "Pleno",
    question: "Como decidir entre duas soluções técnicas parecidas?",
    good: "Compararia simplicidade, manutenção, performance, risco, custo, prazo e alinhamento com o time.",
    bad: "Escolheria a tecnologia mais nova.",
  },
];

export const interviewStudySites = [
  {
    title: "Pramp",
    type: "Simulação",
    desc: "Plataforma para praticar entrevistas técnicas com outras pessoas.",
    url: "https://www.pramp.com/",
  },
  {
    title: "HackerRank Interview Preparation Kit",
    type: "Prática técnica",
    desc: "Exercícios de lógica, algoritmos e preparação para entrevistas.",
    url: "https://www.hackerrank.com/interview/interview-preparation-kit",
  },
  {
    title: "LeetCode Explore",
    type: "Algoritmos",
    desc: "Trilhas guiadas para praticar problemas comuns em entrevistas técnicas.",
    url: "https://leetcode.com/explore/",
  },
  {
    title: "Glassdoor - Entrevistas",
    type: "Relatos reais",
    desc: "Perguntas e experiências compartilhadas por candidatos em empresas.",
    url: "https://www.glassdoor.com.br/Entrevista/index.htm",
  },
  {
    title: "The STAR Method",
    type: "Comportamental",
    desc: "Guia para estruturar respostas comportamentais com situação, tarefa, ação e resultado.",
    url: "https://www.themuse.com/advice/star-interview-method",
  },
  {
    title: "roadmap.sh Questions",
    type: "Revisão por área",
    desc: "Perguntas e conceitos para revisar fundamentos de diferentes trilhas tech.",
    url: "https://roadmap.sh/questions",
  },
];

export const interviewVideoResources = [
  {
    title:
      "Como se preparar para entrevista técnica em programação? (Mayk Brito)",
    url: "https://www.youtube.com/watch?v=pD7NXkjLEa8",
  },
  {
    title:
      "Entrevista de júnior: as perguntas mais comuns e como responder (O Novo Programador)",
    url: "https://www.youtube.com/watch?v=YgTE08MaSqg",
  },
  {
    title: "Entrevista comportamental: método STAR (Agilidade+)",
    url: "https://www.youtube.com/watch?v=gXycGglSyvM",
  },
  {
    title: "Se prepare para entrevistas de Front-End (Hipsters, Alura)",
    url: "https://www.youtube.com/watch?v=GEljZeWTVec",
  },
  {
    title: "Entrevista técnica de back-end: dicas (Programador a Bordo)",
    url: "https://www.youtube.com/watch?v=ogqtSovsLYw",
  },
  {
    title: "3 dicas para mandar bem em entrevistas como dev (Full Cycle)",
    url: "https://www.youtube.com/watch?v=nlbPOC0aQmU",
  },
];

export const technicalChallenges = [
  [
    "Landing page responsiva",
    "Front-end",
    "Iniciante",
    "3h",
    "agências digitais",
  ],
  [
    "API de tarefas com autenticação",
    "Back-end",
    "Intermediário",
    "6h",
    "SaaS",
  ],
  ["Dashboard de vendas", "Dados", "Intermediário", "5h", "varejo"],
  ["Plano de testes de login", "QA", "Iniciante", "2h", "consultorias"],
  ["Pipeline CI básico", "DevOps", "Avançado", "5h", "empresas cloud"],
].map(([name, area, difficulty, time, usedBy]) => ({
  name,
  area,
  difficulty,
  time,
  usedBy,
  statement: `Construa uma solução para ${name.toLowerCase()} com README, decisões técnicas e instruções de execução.`,
  tips: [
    "Comece pelo mínimo funcional",
    "Documente decisões",
    "Inclua próximos passos",
  ],
  solutionUrl: "https://github.com/topics/challenge",
}));

export const portfolioGuides = [
  [
    "Front-end",
    "3 a 5 projetos",
    "Interfaces responsivas, consumo de API e deploy",
    "Projetos sem deploy ou sem README",
  ],
  [
    "Back-end",
    "2 a 4 APIs",
    "APIs documentadas, autenticação e banco",
    "Endpoints sem instrução de execução",
  ],
  [
    "Dados",
    "3 análises",
    "Notebooks com contexto, gráficos e conclusão",
    "Gráfico sem insight",
  ],
  [
    "Mobile",
    "2 apps",
    "App publicado ou demo em vídeo",
    "Prints soltos sem explicação",
  ],
  [
    "UX/UI",
    "3 cases",
    "Processo, pesquisa, wireframes e protótipo",
    "Só telas bonitas sem problema",
  ],
];

// IDs são CONTRATO PERMANENTE, usados como chave de persistência por usuário
// (tabela user_progress, context = 'portfolio_checklist'). Se o label mudar,
// o id NUNCA muda; caso contrário, o progresso salvo do usuário se perde.
export const portfolioChecklist: { id: string; label: string }[] = [
  { id: "readme-todos-repos", label: "Tem README em todos os repositórios" },
  { id: "github-perfil-completo", label: "GitHub com foto e bio preenchidos" },
  { id: "projetos-deploy", label: "Projetos com deploy acessível" },
  { id: "commits-descritivos", label: "Commits com mensagens descritivas" },
  { id: "links-rede-portfolio", label: "Links para LinkedIn e portfólio" },
  { id: "readme-problema-solucao", label: "README explica problema e solução" },
  { id: "prints-projetos", label: "Prints ou GIFs dos projetos" },
  { id: "tecnologias-honestas", label: "Tecnologias listadas com honestidade" },
  { id: "projetos-fixados", label: "Projetos fixados no GitHub" },
  { id: "sem-segredos-expostos", label: "Sem chaves ou dados sensíveis" },
  { id: "codigo-formatado", label: "Código formatado" },
  { id: "instrucoes-instalacao", label: "Instruções de instalação" },
  { id: "descricao-aprendizado", label: "Descrição do que você aprendeu" },
  { id: "contato-visivel", label: "Contato fácil de encontrar" },
  { id: "projeto-autoral", label: "Pelo menos um projeto autoral" },
];

export const readmeTemplates = [
  {
    title: "Landing page",
    purpose:
      "Modelo para apresentar uma página web simples, visual e publicada.",
    bestFor:
      "Front-end, UX/UI e primeiros projetos de HTML, CSS, JavaScript ou React.",
    whyItMatters:
      "Mostra que você sabe criar uma interface, organizar seções, cuidar de responsividade e publicar um projeto acessível.",
    body: "# Nome do Projeto\n\nLanding page responsiva criada para praticar HTML, CSS e JavaScript.\n\n## Tecnologias\n- HTML\n- CSS\n- JavaScript\n\n## Como acessar\nLink do deploy aqui.\n",
  },
  {
    title: "API REST",
    purpose:
      "Modelo para explicar um projeto de back-end que expõe rotas para outros sistemas consumirem.",
    bestFor: "Back-end, Full Stack, QA de API e projetos com banco de dados.",
    whyItMatters:
      "Ajuda recrutadores a entenderem quais rotas existem, como rodar o servidor e quais decisões técnicas você tomou.",
    body: "# API REST\n\nAPI para gerenciar recursos com autenticação e banco de dados.\n\n## Rotas\n- GET /items\n- POST /items\n\n## Como rodar\nInstale dependências e execute o servidor.\n",
  },
  {
    title: "App mobile",
    purpose:
      "Modelo para documentar um aplicativo de celular, protótipo funcional ou demo em vídeo.",
    bestFor: "Mobile, Front-end e projetos com React Native, Flutter ou Expo.",
    whyItMatters:
      "Mostra fluxo de telas, funcionalidades principais, decisões de experiência e como a pessoa pode testar o app.",
    body: "# App Mobile\n\nAplicativo mobile com fluxo principal, consumo de API e navegação.\n\n## Funcionalidades\n- Login\n- Listagem\n- Detalhes\n",
  },
  {
    title: "Projeto de dados",
    purpose:
      "Modelo para apresentar uma análise, notebook, dashboard ou estudo com dataset.",
    bestFor:
      "Dados, BI, IA e projetos com Python, SQL, Pandas ou visualização.",
    whyItMatters:
      "Mostra a pergunta respondida, os dados usados, os gráficos criados e principalmente os insights que você tirou.",
    body: "# Análise de Dados\n\nNotebook com limpeza, exploração e insights.\n\n## Perguntas respondidas\n- O que cresceu?\n- Onde estão os gargalos?\n",
  },
];

export const resumeTemplates = [
  "Front-end",
  "Back-end",
  "Dados",
  "Mobile",
  "DevOps",
  "UX/UI",
].map((area) => ({
  area,
  body: `Nome Sobrenome\n${area} Trainee/Júnior\n\nResumo\nProfissional em formação com projetos práticos em ${area}.\n\nProjetos\n- Projeto 1: problema, tecnologias e resultado.\n\nHabilidades\n- Git\n- Comunicação\n- Fundamentos da área`,
}));

export const linkedinGuide = [
  "Como escrever o headline",
  "O que colocar no Sobre",
  "Como listar projetos e habilidades",
  "Como pedir recomendações",
  "Como aparecer nas buscas de recrutadores",
  "Criadores de conteúdo tech recomendados por área",
];

export const studyTechniques = [
  {
    title: "Tutorial Hell e como sair",
    description:
      "Pare de só assistir aula atrás de aula. Veja um trecho curto, pause e recrie sozinho antes de seguir: é a prática que fixa, não o play.",
  },
  {
    title: "Pomodoro aplicado ao código",
    description:
      "Blocos de 25 minutos focados em uma única tarefa, com pausa de 5. Vence a inércia e mantém o foco em bugs e features longas.",
  },
  {
    title: "Prática deliberada vs passiva",
    description:
      "Reler e assistir é passivo. Deliberado é resolver problemas no seu limite, com feedback rápido. Priorize exercícios que te desafiam.",
  },
  {
    title: "Spaced Repetition para conceitos técnicos",
    description:
      "Revise em intervalos crescentes (1, 3 e 7 dias) pra fixar na memória de longo prazo. Ótimo pra sintaxe, comandos e fundamentos.",
  },
  {
    title: "Como fazer projetos reais desde cedo",
    description:
      "Aprenda construindo: comece um projeto pequeno e real já nas primeiras semanas. Projeto publicado vale mais no portfólio que curso assistido.",
  },
];

export const networkingGuide = [
  "Como abordar devs sênior sem ser invasivo",
  "O que postar no LinkedIn para aparecer",
  "Como participar de comunidades online",
  "Como se comportar em eventos tech",
  "Como manter contato após uma conversa",
];

export const communityMap = [
  "Front-end",
  "Back-end",
  "Dados",
  "Mobile",
  "UX",
  "DevOps",
  "Geral",
].map((area) => ({
  area,
  links: [
    "Discord da comunidade",
    "Telegram de vagas",
    "Grupo LinkedIn",
    "WhatsApp local",
  ],
}));

export const freelancePlatforms = [
  "99Freelas",
  "Workana",
  "Upwork",
  "Freelancer.com",
  "PeoplePerHour",
  "Contra",
  "Toptal",
].map((name, index) => ({
  name,
  focus: index < 2 ? "Brasil e pequenos negócios" : "Mercado internacional",
  difficulty: index > 4 ? "Alta" : "Média",
  fee: index > 2 ? "10% a 20%" : "5% a 15%",
  beginner: index < 5,
}));

export interface FreelaProjectHelpArticle {
  title: string;
  href: string;
}

/** Vídeo: use `youtubeId` para assistir dentro do site; sempre defina `href` para “abrir no YouTube” ou buscas. */
export interface FreelaProjectHelpVideo {
  title: string;
  youtubeId?: string;
  href: string;
}

export interface FreelaFirstProject {
  name: string;
  difficulty: string;
  time: string;
  value: string;
  clients: string;
  technologies: string[];
  help: {
    video: FreelaProjectHelpVideo;
    articles: FreelaProjectHelpArticle[];
  };
}

export const firstFreelaProjects: FreelaFirstProject[] = [
  {
    name: "Landing page institucional",
    difficulty: "Iniciante",
    time: "8h",
    value: "R$ 600 a R$ 1200",
    clients: "Comércios locais, profissionais liberais e pequenas empresas",
    technologies: ["HTML", "CSS"],
    help: {
      video: {
        title: "Montar uma landing page com HTML e CSS",
        youtubeId: "ZiXkYiI7LoI",
        href: "https://www.youtube.com/watch?v=ZiXkYiI7LoI",
      },
      articles: [
        {
          title: "MDN: Design responsivo (português)",
          href: "https://developer.mozilla.org/pt-BR/docs/Learn/CSS/CSS_layout/Responsive_Design",
        },
        {
          title: "web.dev: Fundamentos de design na web",
          href: "https://web.dev/learn/design/",
        },
        {
          title: "Buscar tutoriais no YouTube (PT)",
          href: "https://www.youtube.com/results?search_query=landing+page+html+css+curso+portugu%C3%AAs",
        },
      ],
    },
  },
  {
    name: "Automação simples",
    difficulty: "Iniciante",
    time: "12h",
    value: "R$ 950 a R$ 1700",
    clients: "Comércios locais, profissionais liberais e pequenas empresas",
    technologies: ["HTML", "CSS", "JavaScript"],
    help: {
      video: {
        title: "Base em Python antes de automatizar fluxos",
        youtubeId: "rfscVS0vtbw",
        href: "https://www.youtube.com/watch?v=rfscVS0vtbw",
      },
      articles: [
        {
          title: "Microsoft: Introdução ao Power Automate (PT-BR)",
          href: "https://learn.microsoft.com/pt-br/power-platform/power-automate/getting-started",
        },
        {
          title: "Documentação oficial do Python: Tutorial",
          href: "https://docs.python.org/pt-br/3/tutorial/index.html",
        },
        {
          title: "YouTube: automação iniciante português",
          href: "https://www.youtube.com/results?search_query=automa%C3%A7%C3%A3o+python+excel+para+iniciantes+portugu%C3%AAs",
        },
      ],
    },
  },
  {
    name: "Bot de atendimento",
    difficulty: "Intermediário",
    time: "16h",
    value: "R$ 1300 a R$ 2200",
    clients: "Comércios locais, profissionais liberais e pequenas empresas",
    technologies: ["HTML", "CSS", "JavaScript", "Git"],
    help: {
      video: {
        title: "Bots de atendimento (Telegram, WhatsApp, etc.)",
        href: "https://www.youtube.com/results?search_query=bot+telegram+python+tutorial+portugu%C3%AAs",
      },
      articles: [
        {
          title: "Telegram: Introdução a bots",
          href: "https://core.telegram.org/bots",
        },
        {
          title: "Meta: WhatsApp Cloud API overview",
          href: "https://developers.facebook.com/docs/whatsapp/cloud-api/overview",
        },
        {
          title: "freeCodeCamp (PT-BR): Bot no Telegram com Python",
          href: "https://www.freecodecamp.org/portuguese/news/como-criar-um-bot-do-telegram-usando-o-python/",
        },
        {
          title: "YouTube: filtrar só tutoriais em português",
          href: "https://www.youtube.com/results?search_query=bot+whatsapp+telegram+python+portugu%C3%AAs",
        },
      ],
    },
  },
  {
    name: "Dashboard no Looker Studio",
    difficulty: "Intermediário",
    time: "20h",
    value: "R$ 1650 a R$ 2700",
    clients: "Comércios locais, profissionais liberais e pequenas empresas",
    technologies: ["HTML", "CSS"],
    help: {
      video: {
        title: "Looker Studio para iniciantes",
        youtubeId: "Coe_f79Xc2o",
        href: "https://www.youtube.com/watch?v=Coe_f79Xc2o",
      },
      articles: [
        {
          title: "Google: Centro de ajuda Looker Studio",
          href: "https://support.google.com/looker-studio/",
        },
        {
          title: "Google: Conectar dados e relatórios",
          href: "https://support.google.com/looker-studio/answer/6299724",
        },
        {
          title: "YouTube: Looker Studio em português",
          href: "https://www.youtube.com/results?search_query=looker+studio+google+data+studio+tutorial+portugu%C3%AAs",
        },
      ],
    },
  },
  {
    name: "Site para profissional autônomo",
    difficulty: "Intermediário",
    time: "24h",
    value: "R$ 2000 a R$ 3200",
    clients: "Comércios locais, profissionais liberais e pequenas empresas",
    technologies: ["HTML", "CSS", "JavaScript", "Git"],
    help: {
      video: {
        title: "De landing a site institucional",
        youtubeId: "ZiXkYiI7LoI",
        href: "https://www.youtube.com/watch?v=ZiXkYiI7LoI",
      },
      articles: [
        {
          title: "MDN: HTML: boas práticas",
          href: "https://developer.mozilla.org/pt-BR/docs/Learn/HTML/Introduction_to_HTML/Document_and_website_structure",
        },
        {
          title: "web.dev: SEO e performance básicos",
          href: "https://web.dev/learn/seo/",
        },
        {
          title: "YouTube: site profissional portfolio português",
          href: "https://www.youtube.com/results?search_query=site+one+page+portfolio+freelancer+html+css+portugu%C3%AAs",
        },
      ],
    },
  },
  {
    name: "Correções em WordPress",
    difficulty: "Intermediário",
    time: "28h",
    value: "R$ 2350 a R$ 3700",
    clients: "Comércios locais, profissionais liberais e pequenas empresas",
    technologies: ["HTML", "CSS", "JavaScript", "Git"],
    help: {
      video: {
        title: "Temas e manutenção no WordPress",
        href: "https://www.youtube.com/results?search_query=wordpress+child+theme+debug+tutorial",
      },
      articles: [
        {
          title: "WordPress: Primeiros passos com temas",
          href: "https://developer.wordpress.org/themes/getting-started/",
        },
        {
          title: "WordPress.org (PT-BR): primeiro site com o editor em blocos",
          href: "https://wordpress.org/documentation/article/new-to-wordpress-where-to-start/",
        },
        {
          title: "YouTube: manutenção e temas WordPress PT",
          href: "https://www.youtube.com/results?search_query=wordpress+temas+e+child+theme+curso+portugu%C3%AAs",
        },
      ],
    },
  },
];

export const evolutionTracks = [
  {
    title: "Estudante → Estagiário",
    technical: [
      "Fundamentos da área escolhida",
      "Git e GitHub",
      "1 a 3 projetos simples",
      "README bem explicado",
    ],
    soft: [
      "Curiosidade",
      "Comunicação clara",
      "Organização de estudos",
      "Vontade de aprender",
    ],
    time: "3 a 12 meses",
    ready:
      "Você consegue explicar o que está estudando, mostrar projetos e aprender com orientação.",
    accelerate:
      "Monte um portfólio simples, publique aprendizados no LinkedIn e aplique mesmo sem cumprir 100% da vaga.",
  },
  {
    title: "Estagiário → Trainee",
    technical: [
      "Fundamentos sólidos",
      "Projetos entregues",
      "Debug básico",
      "Documentação do que fez",
    ],
    soft: [
      "Comunicação",
      "Responsabilidade",
      "Perguntas bem formuladas",
      "Feedback constante",
    ],
    time: "6 a 18 meses",
    ready:
      "Você entrega tarefas pequenas com acompanhamento e consegue aprender em programas estruturados de desenvolvimento.",
    accelerate:
      "Peça feedback frequente, documente resultados e aplique para programas com trilhas, rotação e mentoria.",
  },
  {
    title: "Trainee → Júnior",
    technical: [
      "Base prática da stack",
      "Entendimento de produto",
      "Entrega acompanhada",
      "Testes e documentação",
    ],
    soft: [
      "Aprendizado acelerado",
      "Adaptação",
      "Comunicação com áreas",
      "Abertura a feedback",
    ],
    time: "6 a 12 meses",
    ready:
      "Você transforma aprendizado guiado em entregas reais e começa a atuar com menos dependência.",
    accelerate:
      "Registre aprendizados, peça contexto de negócio e conecte suas entregas aos objetivos do time.",
  },
  {
    title: "Júnior → Pleno",
    technical: [
      "Autonomia em tarefas médias",
      "Testes",
      "Code review",
      "Boas práticas da stack",
    ],
    soft: [
      "Autonomia",
      "Priorização",
      "Comunicação com produto",
      "Gestão de contexto",
    ],
    time: "1 a 3 anos",
    ready:
      "Você resolve problemas menos definidos, identifica riscos e ajuda outras pessoas iniciantes.",
    accelerate:
      "Entenda o porquê das decisões, participe de refinamentos e aprenda a estimar impacto e esforço.",
  },
  {
    title: "Pleno → Sênior",
    technical: [
      "Arquitetura",
      "Qualidade",
      "Performance",
      "Observabilidade",
      "Decisões de longo prazo",
    ],
    soft: [
      "Influência",
      "Mentoria",
      "Comunicação com áreas",
      "Tomada de decisão",
    ],
    time: "2 a 4 anos",
    ready:
      "Você antecipa problemas, orienta soluções e melhora a qualidade do time, não só do próprio código.",
    accelerate:
      "Lidere iniciativas, escreva propostas técnicas e desenvolva repertório de trade-offs.",
  },
  {
    title: "Sênior → Tech Lead / Especialista / Gestor",
    technical: [
      "Estratégia técnica",
      "Sistemas complexos",
      "Padrões de time",
      "Escala e confiabilidade",
    ],
    soft: [
      "Mentoria",
      "Alinhamento estratégico",
      "Negociação",
      "Desenvolvimento de pessoas",
    ],
    time: "Contínuo",
    ready:
      "Você amplia o impacto por meio de decisões, direção técnica, pessoas e resultados do negócio.",
    accelerate:
      "Escolha uma trilha de crescimento: liderança técnica, especialização profunda ou gestão de pessoas.",
  },
];

export const careerEvolutionByArea = [
  {
    area: "Front-end",
    focus:
      "Interfaces, acessibilidade, responsividade, consumo de API e experiência do usuário.",
    firstProject: "Landing page responsiva + projeto com API pública.",
    tips: [
      "Priorize HTML, CSS e JavaScript antes de frameworks.",
      "Tenha projetos publicados com deploy.",
      "Explique decisões visuais e de acessibilidade no README.",
    ],
    videos: [
      {
        title: "Front-end para iniciantes",
        url: "https://www.youtube.com/results?search_query=front-end+para+iniciantes+html+css+javascript+portugu%C3%AAs",
      },
      {
        title: "React para iniciantes",
        url: "https://www.youtube.com/results?search_query=react+para+iniciantes+portugu%C3%AAs",
      },
    ],
    nextSteps: [
      "Criar portfólio visual",
      "Aprender GitHub Pages/Vercel",
      "Estudar React e TypeScript",
    ],
  },
  {
    area: "Back-end",
    focus:
      "APIs, banco de dados, autenticação, regras de negócio e integração entre sistemas.",
    firstProject: "API REST com CRUD, banco de dados e documentação de rotas.",
    tips: [
      "Documente como rodar a API localmente.",
      "Mostre exemplos de request e response.",
      "Inclua tratamento de erros e validação.",
    ],
    videos: [
      {
        title: "Back-end para iniciantes",
        url: "https://www.youtube.com/results?search_query=back-end+para+iniciantes+api+rest+portugu%C3%AAs",
      },
      {
        title: "API REST Node.js",
        url: "https://www.youtube.com/results?search_query=api+rest+node.js+para+iniciantes+portugu%C3%AAs",
      },
    ],
    nextSteps: [
      "Aprender SQL",
      "Criar API com autenticação",
      "Estudar testes e Docker básico",
    ],
  },
  {
    area: "Dados",
    focus:
      "Python, SQL, estatística, análise exploratória, visualização e comunicação de insights.",
    firstProject:
      "Notebook com dataset público, gráficos e 3 conclusões bem explicadas.",
    tips: [
      "Não mostre só gráfico: explique o insight.",
      "Use datasets reais e cite a fonte.",
      "Inclua perguntas de negócio no início do projeto.",
    ],
    videos: [
      {
        title: "Dados para iniciantes",
        url: "https://www.youtube.com/results?search_query=an%C3%A1lise+de+dados+para+iniciantes+python+portugu%C3%AAs",
      },
      {
        title: "SQL para dados",
        url: "https://www.youtube.com/results?search_query=sql+para+an%C3%A1lise+de+dados+iniciantes+portugu%C3%AAs",
      },
    ],
    nextSteps: [
      "Praticar SQL",
      "Publicar notebook no GitHub/Kaggle",
      "Criar dashboard simples",
    ],
  },
  {
    area: "UX/UI",
    focus:
      "Pesquisa, fluxo, wireframe, protótipo, usabilidade e construção de case.",
    firstProject:
      "Redesign de app conhecido com problema, processo e protótipo no Figma.",
    tips: [
      "Mostre o processo, não só telas bonitas.",
      "Explique problema, público e decisões.",
      "Inclua testes ou feedback de usuários quando possível.",
    ],
    videos: [
      {
        title: "UX/UI para iniciantes",
        url: "https://www.youtube.com/results?search_query=ux+ui+design+para+iniciantes+portugu%C3%AAs",
      },
      {
        title: "Figma para iniciantes",
        url: "https://www.youtube.com/results?search_query=figma+para+iniciantes+portugu%C3%AAs",
      },
    ],
    nextSteps: [
      "Criar 2 cases completos",
      "Estudar heurísticas",
      "Publicar no Behance ou portfólio",
    ],
  },
  {
    area: "QA",
    focus:
      "Casos de teste, bug report, teste manual, automação inicial e qualidade de produto.",
    firstProject:
      "Plano de testes para app real + relatório de bugs + automação simples.",
    tips: [
      "Escreva evidências com prints e passos claros.",
      "Aprenda Postman para testar APIs.",
      "Mostre pensamento crítico sobre risco e prioridade.",
    ],
    videos: [
      {
        title: "QA para iniciantes",
        url: "https://www.youtube.com/results?search_query=qa+testes+de+software+para+iniciantes+portugu%C3%AAs",
      },
      {
        title: "Cypress para iniciantes",
        url: "https://www.youtube.com/results?search_query=cypress+para+iniciantes+portugu%C3%AAs",
      },
    ],
    nextSteps: [
      "Criar plano de testes",
      "Aprender Postman",
      "Automatizar fluxo de login",
    ],
  },
  {
    area: "DevOps / Cloud",
    focus: "Linux, redes, deploy, CI/CD, cloud, containers e observabilidade.",
    firstProject:
      "Deploy de aplicação simples com pipeline de build e documentação.",
    tips: [
      "Comece com Linux e Git antes de Kubernetes.",
      "Documente arquitetura e custos.",
      "Mostre logs, monitoramento ou pipeline funcionando.",
    ],
    videos: [
      {
        title: "DevOps para iniciantes",
        url: "https://www.youtube.com/results?search_query=devops+para+iniciantes+portugu%C3%AAs",
      },
      {
        title: "AWS/Azure fundamentos",
        url: "https://www.youtube.com/results?search_query=cloud+computing+fundamentos+aws+azure+portugu%C3%AAs",
      },
    ],
    nextSteps: [
      "Aprender Linux",
      "Fazer deploy simples",
      "Estudar Docker e GitHub Actions",
    ],
  },
];

export const certifications = [
  "AWS Solutions Architect",
  "Google Cloud Associate",
  "Azure Fundamentals",
  "Scrum Master",
  "ISTQB",
  "Google Analytics",
  "Kubernetes CKA",
  "Docker",
  "Salesforce",
].map((name, index) => ({
  name,
  area: [
    "Cloud",
    "Cloud",
    "Cloud",
    "Gestão",
    "QA",
    "Dados",
    "DevOps",
    "DevOps",
    "CRM",
  ][index],
  difficulty: index < 4 ? "Média" : "Alta",
  cost: index < 3 ? "US$ 99 a US$ 150" : "Varia",
  impact: index < 3 || index === 6 ? "Alto" : "Médio",
  worth: index !== 7,
}));

export const englishVocabulary = [
  "Front-end",
  "Back-end",
  "Dados",
  "DevOps",
  "UX/UI",
].map((area) => ({
  area,
  terms: [
    "deploy",
    "branch",
    "issue",
    "release",
    "debug",
    "layout",
    "query",
    "pipeline",
    "feedback",
    "deadline",
    "feature",
    "bug",
    "endpoint",
    "repository",
    "commit",
    "review",
    "accessibility",
    "metric",
    "cache",
    "scalable",
  ],
}));

export type EnglishLevel = "Básico" | "Intermediário" | "Avançado";
export type PlatformCost = "Grátis" | "Pago" | "Freemium";

export const ENGLISH_LEVELS: EnglishLevel[] = [
  "Básico",
  "Intermediário",
  "Avançado",
];

export const learnEnglishPlatforms: {
  name: string;
  url: string;
  desc: string;
  cost: PlatformCost;
  level: EnglishLevel;
}[] = [
  {
    name: "Duolingo",
    url: "https://www.duolingo.com/",
    desc: "Lições curtas e gamificadas para criar hábito e vocabulário base.",
    cost: "Freemium",
    level: "Básico",
  },
  {
    name: "ELSA Speak",
    url: "https://elsaspeak.com/",
    desc: "Treino de pronúncia com IA que ouve e corrige a sua fala.",
    cost: "Freemium",
    level: "Básico",
  },
  {
    name: "British Council LearnEnglish",
    url: "https://learnenglish.britishcouncil.org/",
    desc: "Exercícios e listening organizados por nível, do iniciante ao avançado.",
    cost: "Grátis",
    level: "Básico",
  },
  {
    name: "Anki",
    url: "https://apps.ankiweb.net/",
    desc: "Flashcards com repetição espaçada para montar o seu baralho técnico.",
    cost: "Grátis",
    level: "Intermediário",
  },
  {
    name: "Voscreen",
    url: "https://www.voscreen.com/",
    desc: "Pratique listening com clipes curtos e perguntas rápidas.",
    cost: "Freemium",
    level: "Intermediário",
  },
  {
    name: "Coursera: English for Career Development",
    url: "https://www.coursera.org/learn/careerdevelopment",
    desc: "Inglês de currículo, entrevista e ambiente de trabalho, grátis para assistir.",
    cost: "Grátis",
    level: "Intermediário",
  },
  {
    name: "Cambly",
    url: "https://www.cambly.com/",
    desc: "Conversação ao vivo com falantes nativos sob demanda.",
    cost: "Pago",
    level: "Avançado",
  },
  {
    name: "italki",
    url: "https://www.italki.com/",
    desc: "Aulas 1 a 1 com professores do mundo todo, você escolhe o foco.",
    cost: "Pago",
    level: "Avançado",
  },
  {
    name: "Speak",
    url: "https://www.speak.com/",
    desc: "Tutor de conversação com IA para treinar fala sem pressão.",
    cost: "Pago",
    level: "Avançado",
  },
  {
    name: "Conversation Exchange",
    url: "https://www.conversationexchange.com/",
    desc: "Encontre parceiros nativos para trocar idiomas por texto, áudio ou chamada.",
    cost: "Grátis",
    level: "Avançado",
  },
  {
    name: "Tandem",
    url: "https://www.tandem.net/",
    desc: "App de intercâmbio de idiomas, converse com nativos de graça, recursos extras são pagos.",
    cost: "Freemium",
    level: "Avançado",
  },
  {
    name: "YouGlish",
    url: "https://youglish.com/",
    desc: "Busque uma palavra e ouça como nativos pronunciam em vídeos reais.",
    cost: "Grátis",
    level: "Avançado",
  },
];

export const englishPodcasts: {
  name: string;
  url: string;
  desc: string;
  level: EnglishLevel;
}[] = [
  {
    name: "Espresso English Podcast",
    url: "https://www.espressoenglish.net/",
    desc: "Episódios curtos de vocabulário e frases do dia a dia.",
    level: "Básico",
  },
  {
    name: "Luke's English Podcast",
    url: "https://teacherluke.co.uk/",
    desc: "Inglês natural com explicação clara e ritmo tranquilo.",
    level: "Básico",
  },
  {
    name: "CodeNewbie",
    url: "https://www.codenewbie.org/podcast",
    desc: "Histórias de quem entrou na área tech, ótimo para listening.",
    level: "Intermediário",
  },
  {
    name: "Syntax",
    url: "https://syntax.fm/",
    desc: "Web dev com dois hosts e linguagem acessível.",
    level: "Intermediário",
  },
  {
    name: "Software Engineering Daily",
    url: "https://softwareengineeringdaily.com/",
    desc: "Entrevistas técnicas densas para quem já tem base.",
    level: "Avançado",
  },
  {
    name: "The Changelog",
    url: "https://changelog.com/podcast",
    desc: "Conversas sobre open source e engenharia de software.",
    level: "Avançado",
  },
];

export const englishWorkPhrases: {
  situation: string;
  phrases: { en: string; pt: string }[];
}[] = [
  {
    situation: "Code review e pull request",
    phrases: [
      {
        en: "Could you take a look at this PR when you have time?",
        pt: "Pode revisar este PR quando puder?",
      },
      {
        en: "I left a few comments, nothing blocking.",
        pt: "Deixei alguns comentários, nada que trave o merge.",
      },
      {
        en: "Good catch, I will fix that.",
        pt: "Boa observação, vou corrigir.",
      },
      {
        en: "Nit: this is minor, feel free to ignore.",
        pt: "Detalhe pequeno, pode ignorar (nit = nitpick).",
      },
      {
        en: "LGTM, approving now.",
        pt: "Está bom pra mim, aprovando (LGTM = looks good to me).",
      },
    ],
  },
  {
    situation: "Daily standup",
    phrases: [
      {
        en: "Yesterday I worked on the login flow.",
        pt: "Ontem trabalhei no fluxo de login.",
      },
      {
        en: "Today I will focus on the API bug.",
        pt: "Hoje vou focar no bug da API.",
      },
      {
        en: "I am blocked by the missing credentials.",
        pt: "Estou travado pelas credenciais que faltam.",
      },
      { en: "No blockers on my side.", pt: "Sem impedimentos do meu lado." },
    ],
  },
  {
    situation: "Pedir ajuda",
    phrases: [
      {
        en: "I am stuck on this error, could you help me?",
        pt: "Travei neste erro, pode me ajudar?",
      },
      {
        en: "Do you have a few minutes to pair on this?",
        pt: "Tem alguns minutos pra programar junto nisso?",
      },
      {
        en: "Just to confirm, you mean X, right?",
        pt: "Só pra confirmar, você quer dizer X, certo?",
      },
      { en: "Could you explain it again?", pt: "Pode explicar de novo?" },
    ],
  },
  {
    situation: "Comunicação async e Slack",
    phrases: [
      {
        en: "Heads up: the deploy is scheduled for 3 PM.",
        pt: "Aviso: o deploy está marcado pras 15h.",
      },
      {
        en: "Following up on my last message.",
        pt: "Retomando a minha última mensagem.",
      },
      {
        en: "No rush, whenever you get a chance.",
        pt: "Sem pressa, quando você puder.",
      },
      {
        en: "Sorry for the late reply.",
        pt: "Desculpe a demora pra responder.",
      },
    ],
  },
  {
    situation: "Discordar com educação",
    phrases: [
      {
        en: "I see your point, but I would suggest a different approach.",
        pt: "Entendo seu ponto, mas sugeriria outra abordagem.",
      },
      {
        en: "That makes sense. One concern I have is...",
        pt: "Faz sentido. Uma preocupação que tenho é...",
      },
      {
        en: "Could we consider another option here?",
        pt: "Podemos considerar outra opção aqui?",
      },
      {
        en: "Can we discuss the trade-offs?",
        pt: "Podemos discutir os prós e contras?",
      },
    ],
  },
];

export const englishFalseFriends: {
  wrong: string;
  right: string;
  note: string;
}[] = [
  {
    wrong: "I have a doubt.",
    right: "I have a question.",
    note: "Doubt é desconfiança; para perguntar, use question.",
  },
  {
    wrong: "Explain me this.",
    right: "Explain this to me.",
    note: "Explain sempre pede 'to me'.",
  },
  {
    wrong: "Make a question.",
    right: "Ask a question.",
    note: "Pergunta se faz com ask, não com make.",
  },
  {
    wrong: "I am agree.",
    right: "I agree.",
    note: "Agree já é o verbo, não use 'am'.",
  },
  {
    wrong: "Actually (como 'atualmente')",
    right: "Actually = na verdade; currently = atualmente.",
    note: "Actually corrige uma informação, não indica tempo.",
  },
  {
    wrong: "Eventually (como 'talvez')",
    right: "Eventually = no fim; occasionally = de vez em quando.",
    note: "Eventually é algo que acaba acontecendo.",
  },
  {
    wrong: "I pretend to learn.",
    right: "I intend to learn.",
    note: "Pretend = fingir; intend ou plan = pretender.",
  },
  {
    wrong: "I realize a task.",
    right: "I carry out a task.",
    note: "Realize = perceber; para executar, use carry out.",
  },
];

export const englishTechPronunciation: {
  term: string;
  say: string;
  note: string;
}[] = [
  {
    term: "cache",
    say: "kash",
    note: "Uma sílaba só, igual a 'cash'. Evite 'ca·xê'.",
  },
  {
    term: "queue",
    say: "kiu",
    note: "Só o som da letra Q; o resto é mudo.",
  },
  { term: "query", say: "kuí·ri", note: "Primeira sílaba mais forte." },
  {
    term: "schema",
    say: "skí·ma",
    note: "Começa com 'sk', não com 'xema'.",
  },
  {
    term: "tuple",
    say: "tâ·pol",
    note: "Em inglês americano também se ouve 'tchú·pol'.",
  },
  { term: "nginx", say: "én·gin·ex", note: "Lê-se 'engine-x'." },
  {
    term: "Kubernetes",
    say: "ku·ber·né·tis",
    note: "A forma curta k8s lê-se 'keits'.",
  },
  {
    term: "SQL",
    say: "és·kiu·él",
    note: "A forma 'síquel' também é aceita.",
  },
  { term: "GUI", say: "gú·i", note: "Soa como 'gooey'." },
  { term: "OAuth", say: "ô·óth", note: "Soa como 'oh-auth'." },
];

export const devTools = [
  {
    name: "VS Code",
    description:
      "Editor de código leve e popular, com extensões para quase todas as stacks.",
    areas: ["Front-end", "Back-end", "Dados", "DevOps"],
    category: ["Desenvolvimento"],
    need: "Obrigatório",
    url: "https://code.visualstudio.com/",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=code.visualstudio.com&sz=128",
  },
  {
    name: "Cursor",
    description:
      "Editor com IA para explicar código, refatorar, criar arquivos e acelerar estudos.",
    areas: ["Front-end", "Back-end", "Dados", "DevOps", "UX/UI"],
    category: ["IA", "Desenvolvimento"],
    need: "Importante",
    url: "https://cursor.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=cursor.com&sz=128",
  },
  {
    name: "Git",
    description:
      "Sistema de versionamento usado para registrar mudanças e trabalhar com branches.",
    areas: ["Front-end", "Back-end", "Dados", "DevOps"],
    category: ["Desenvolvimento"],
    need: "Obrigatório",
    url: "https://git-scm.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=git-scm.com&sz=128",
  },
  {
    name: "GitHub",
    description:
      "Plataforma para hospedar código, colaborar, abrir issues e mostrar portfólio.",
    areas: ["Front-end", "Back-end", "Dados", "DevOps", "UX/UI"],
    category: ["Desenvolvimento"],
    need: "Obrigatório",
    url: "https://github.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=github.com&sz=128",
  },
  {
    name: "Docker",
    description:
      "Ferramenta para empacotar aplicações e dependências em containers.",
    areas: ["Back-end", "DevOps", "Dados"],
    category: ["DevOps", "Desenvolvimento"],
    need: "Obrigatório",
    url: "https://www.docker.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=docker.com&sz=128",
  },
  {
    name: "Postman",
    description:
      "Cliente para testar APIs, organizar requisições e documentar endpoints.",
    areas: ["Back-end", "QA", "Front-end"],
    category: ["Desenvolvimento"],
    need: "Importante",
    url: "https://www.postman.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=postman.com&sz=128",
  },
  {
    name: "Figma",
    description:
      "Ferramenta de design para criar, consultar e comentar interfaces.",
    areas: ["UX/UI", "Front-end", "Produto"],
    category: ["Design"],
    need: "Importante",
    url: "https://www.figma.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=figma.com&sz=128",
  },
  {
    name: "Jira",
    description:
      "Ferramenta de gestão de tarefas, sprints, backlog e acompanhamento de entregas.",
    areas: ["Produto", "DevOps", "QA"],
    category: ["Produtividade"],
    need: "Importante",
    url: "https://www.atlassian.com/software/jira",
    logoUrl: "https://www.google.com/s2/favicons?domain=atlassian.com&sz=128",
  },
  {
    name: "Slack",
    description:
      "Comunicação de times, comunidades, canais de projeto e alertas de sistemas.",
    areas: ["Front-end", "Back-end", "Dados", "DevOps", "UX/UI"],
    category: ["Produtividade"],
    need: "Importante",
    url: "https://slack.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=slack.com&sz=128",
  },
  {
    name: "Notion",
    description:
      "Organização de estudos, documentação, planejamento, notas e portfólio.",
    areas: ["Produto", "UX/UI", "Carreira", "Estudos"],
    category: ["Produtividade"],
    need: "Importante",
    url: "https://www.notion.so/",
    logoUrl: "https://www.google.com/s2/favicons?domain=notion.so&sz=128",
  },
  {
    name: "Terminal",
    description:
      "Interface de linha de comando para navegar por pastas, rodar scripts e usar Git.",
    areas: ["Front-end", "Back-end", "Dados", "DevOps"],
    category: ["Desenvolvimento"],
    need: "Obrigatório",
    url: "https://ubuntu.com/tutorials/command-line-for-beginners",
    logoUrl: "https://www.google.com/s2/favicons?domain=ubuntu.com&sz=128",
  },
  {
    name: "npm",
    description:
      "Gerenciador de pacotes do ecossistema JavaScript, usado para instalar bibliotecas.",
    areas: ["Front-end", "Back-end", "Full Stack"],
    category: ["Desenvolvimento"],
    need: "Obrigatório",
    url: "https://www.npmjs.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=npmjs.com&sz=128",
  },
  {
    name: "Yarn",
    description:
      "Gerenciador de pacotes JavaScript usado como alternativa ao npm.",
    areas: ["Front-end", "Back-end", "Full Stack"],
    category: ["Desenvolvimento"],
    need: "Opcional",
    url: "https://yarnpkg.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=yarnpkg.com&sz=128",
  },
  {
    name: "pnpm",
    description:
      "Gerenciador de pacotes rápido e econômico em disco para projetos JavaScript.",
    areas: ["Front-end", "Back-end", "Full Stack"],
    category: ["Desenvolvimento"],
    need: "Opcional",
    url: "https://pnpm.io/",
    logoUrl: "https://www.google.com/s2/favicons?domain=pnpm.io&sz=128",
  },
  {
    name: "Chrome DevTools",
    description:
      "Ferramentas do navegador para inspecionar HTML, CSS, rede, performance e console.",
    areas: ["Front-end", "QA", "Performance"],
    category: ["Desenvolvimento"],
    need: "Obrigatório",
    url: "https://developer.chrome.com/docs/devtools",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=developer.chrome.com&sz=128",
  },
  {
    name: "ChatGPT",
    description:
      "Assistente de IA para tirar dúvidas, explicar erros e revisar código.",
    areas: ["Front-end", "Back-end", "Dados", "Estudos"],
    category: ["IA"],
    need: "Importante",
    url: "https://chatgpt.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=chatgpt.com&sz=128",
  },
  {
    name: "GitHub Copilot",
    description: "Autocompletar de código com IA direto dentro do editor.",
    areas: ["Front-end", "Back-end", "DevOps"],
    category: ["IA", "Desenvolvimento"],
    need: "Opcional",
    url: "https://github.com/features/copilot",
    logoUrl: "https://www.google.com/s2/favicons?domain=github.com&sz=128",
  },
  {
    name: "Claude",
    description: "Assistente de IA forte em leitura de código e textos longos.",
    areas: ["Front-end", "Back-end", "Dados", "Estudos"],
    category: ["IA"],
    need: "Opcional",
    url: "https://claude.ai/",
    logoUrl: "https://www.google.com/s2/favicons?domain=claude.ai&sz=128",
  },
  {
    name: "Node.js",
    description:
      "Runtime JavaScript para rodar projetos e ferramentas fora do navegador.",
    areas: ["Back-end", "Front-end", "Full Stack"],
    category: ["Desenvolvimento"],
    need: "Obrigatório",
    url: "https://nodejs.org/",
    logoUrl: "https://www.google.com/s2/favicons?domain=nodejs.org&sz=128",
  },
  {
    name: "Vite",
    description:
      "Bundler e servidor de desenvolvimento rápido para apps front-end modernos.",
    areas: ["Front-end", "Full Stack"],
    category: ["Desenvolvimento"],
    need: "Importante",
    url: "https://vite.dev/",
    logoUrl: "https://www.google.com/s2/favicons?domain=vite.dev&sz=128",
  },
  {
    name: "Insomnia",
    description:
      "Cliente de API para testar requisições, alternativa ao Postman.",
    areas: ["Back-end", "QA"],
    category: ["Desenvolvimento"],
    need: "Opcional",
    url: "https://insomnia.rest/",
    logoUrl: "https://www.google.com/s2/favicons?domain=insomnia.rest&sz=128",
  },
  {
    name: "Warp",
    description: "Terminal moderno com blocos, histórico e recursos de IA.",
    areas: ["Front-end", "Back-end", "DevOps"],
    category: ["Desenvolvimento"],
    need: "Opcional",
    url: "https://www.warp.dev/",
    logoUrl: "https://www.google.com/s2/favicons?domain=warp.dev&sz=128",
  },
  {
    name: "Canva",
    description: "Criação de artes, posts e apresentações com modelos prontos.",
    areas: ["Design", "UX/UI", "Produto"],
    category: ["Design"],
    need: "Opcional",
    url: "https://www.canva.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=canva.com&sz=128",
  },
  {
    name: "Excalidraw",
    description: "Quadro branco para diagramas e wireframes com traço à mão.",
    areas: ["UX/UI", "Produto", "Front-end"],
    category: ["Design", "Produtividade"],
    need: "Opcional",
    url: "https://excalidraw.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=excalidraw.com&sz=128",
  },
  {
    name: "Trello",
    description: "Quadros kanban para organizar tarefas e estudos.",
    areas: ["Produto", "Carreira", "Estudos"],
    category: ["Produtividade"],
    need: "Opcional",
    url: "https://trello.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=trello.com&sz=128",
  },
  {
    name: "Linear",
    description:
      "Gestão de issues e sprints enxuta usada por times de produto.",
    areas: ["Produto", "DevOps"],
    category: ["Produtividade"],
    need: "Opcional",
    url: "https://linear.app/",
    logoUrl: "https://www.google.com/s2/favicons?domain=linear.app&sz=128",
  },
  {
    name: "Obsidian",
    description: "Notas em markdown com links entre ideias, ótimo para estudo.",
    areas: ["Estudos", "Carreira"],
    category: ["Produtividade"],
    need: "Opcional",
    url: "https://obsidian.md/",
    logoUrl: "https://www.google.com/s2/favicons?domain=obsidian.md&sz=128",
  },
  {
    name: "Discord",
    description: "Comunidades de tecnologia, mentorias e canais de projeto.",
    areas: ["Carreira", "Estudos"],
    category: ["Produtividade"],
    need: "Opcional",
    url: "https://discord.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=discord.com&sz=128",
  },
  {
    name: "DBeaver",
    description: "Cliente visual para conectar e consultar vários bancos SQL.",
    areas: ["Dados", "Back-end"],
    category: ["Banco de dados"],
    need: "Importante",
    url: "https://dbeaver.io/",
    logoUrl: "https://www.google.com/s2/favicons?domain=dbeaver.io&sz=128",
  },
  {
    name: "PostgreSQL",
    description:
      "Banco de dados relacional open source muito usado no mercado.",
    areas: ["Back-end", "Dados"],
    category: ["Banco de dados"],
    need: "Importante",
    url: "https://www.postgresql.org/",
    logoUrl: "https://www.google.com/s2/favicons?domain=postgresql.org&sz=128",
  },
  {
    name: "MongoDB",
    description: "Banco de dados NoSQL orientado a documentos.",
    areas: ["Back-end", "Dados"],
    category: ["Banco de dados"],
    need: "Importante",
    url: "https://www.mongodb.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=mongodb.com&sz=128",
  },
  {
    name: "Supabase",
    description:
      "Backend com Postgres, autenticação e APIs prontos (open source).",
    areas: ["Back-end", "Full Stack"],
    category: ["Banco de dados", "Desenvolvimento"],
    need: "Opcional",
    url: "https://supabase.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=supabase.com&sz=128",
  },
  {
    name: "Vercel",
    description: "Deploy de apps front-end e serverless com integração ao Git.",
    areas: ["Front-end", "DevOps", "Full Stack"],
    category: ["DevOps", "Desenvolvimento"],
    need: "Importante",
    url: "https://vercel.com/",
    logoUrl: "https://www.google.com/s2/favicons?domain=vercel.com&sz=128",
  },
  {
    name: "Kubernetes",
    description: "Orquestração de containers em produção e em escala.",
    areas: ["DevOps", "Back-end"],
    category: ["DevOps"],
    need: "Opcional",
    url: "https://kubernetes.io/",
    logoUrl: "https://www.google.com/s2/favicons?domain=kubernetes.io&sz=128",
  },
];

export const setupGuides = [
  {
    area: "Front-end",
    stack: [
      "Navegador + Chrome DevTools",
      "VS Code ou Cursor",
      "Node.js (LTS) + npm ou pnpm",
      "Git + GitHub",
    ],
    steps: [
      "Instale o Node.js LTS e confirme com node -v.",
      "Crie um projeto com Vite e rode npm run dev.",
      "Instale no editor as extensões de HTML, CSS e do framework.",
      "Versione com Git e suba o repositório pro GitHub.",
    ],
  },
  {
    area: "Back-end",
    stack: [
      "VS Code ou Cursor",
      "Node.js (ou a linguagem da sua stack)",
      "Git + GitHub",
      "Postman ou Insomnia",
      "Docker",
    ],
    steps: [
      "Instale a linguagem da stack e o gerenciador de pacotes.",
      "Crie uma API mínima com uma rota que responde um JSON.",
      "Teste as rotas no Postman ou Insomnia.",
      "Conecte um banco (ex: PostgreSQL) e leia ou escreva um registro.",
    ],
  },
  {
    area: "Dados",
    stack: [
      "Python (versão recente)",
      "VS Code ou Jupyter",
      "Git + GitHub",
      "Banco SQL + DBeaver",
    ],
    steps: [
      "Instale o Python e confirme com python --version.",
      "Crie um ambiente virtual e instale pandas e jupyter.",
      "Conecte ao banco no DBeaver e rode uma query SQL simples.",
      "Versione notebooks e scripts no GitHub.",
    ],
  },
  {
    area: "DevOps",
    stack: [
      "Terminal (Linux ou WSL)",
      "Git + GitHub",
      "Docker",
      "Plataforma de deploy (ex: Vercel)",
      "Kubernetes",
    ],
    steps: [
      "Domine o terminal e os comandos básicos de Git.",
      "Empacote uma aplicação simples com Docker e rode o container local.",
      "Configure deploy automático a partir do GitHub (ex: Vercel).",
      "Estude pipelines de CI/CD para testar e publicar com segurança.",
    ],
  },
  {
    area: "UX/UI",
    stack: ["Figma", "Canva", "Excalidraw", "Notion"],
    steps: [
      "Crie conta no Figma e explore componentes e auto layout.",
      "Refaça uma tela existente para treinar hierarquia e espaçamento.",
      "Monte um fluxo no Excalidraw antes de desenhar telas.",
      "Organize referências e decisões de design no Notion.",
    ],
  },
];
