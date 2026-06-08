import type { LucideIcon } from "lucide-react";
import { Boxes, Compass, RefreshCw, Sprout } from "lucide-react";

export const creatorHandle = "@ana.natech";

/** Foto de perfil da curadora Ana Moura (@ana.natech · via Unavatar/LinkedIn, mesmo provider estável usado pelas demais criadoras). */
export const creatorPhotoUrl = "https://unavatar.io/linkedin/anajulia-moura";

export const tipCategories = [
  "Dicas gerais",
  "Dicas de rotina",
  "Dicas de carreira",
  "Dicas de mercado",
  "Dicas de portfólio",
];

export const tipsArticles = [
  {
    id: "gerais-primeiros-passos",
    category: "Dicas gerais",
    title: "Como começar em tecnologia sem se perder",
    author: "Ana Moura",
    credit: "Curadoria BORA NA TECH?",
    summary:
      "Um guia direto para escolher uma primeira área, organizar estudos e evitar excesso de abas abertas.",
    youtube: "Curso em Vídeo: primeiros passos em programação",
    url: "https://www.youtube.com/@CursoemVideo",
  },
  {
    id: "rotina-estudos",
    category: "Dicas de rotina",
    title: "Rotina realista para estudar trabalhando ou cuidando da casa",
    author: "Rafaella Ballerini",
    credit: "Inspirado em conteúdos públicos da comunidade dev",
    summary:
      "Blocos curtos, revisão semanal e projeto pequeno para transformar estudo em entrega visível.",
    youtube: "Rafaella Ballerini: rotina e carreira dev",
    url: "https://www.youtube.com/@rafaellaballerini",
  },
  {
    id: "carreira-linkedin",
    category: "Dicas de carreira",
    title: "LinkedIn para primeira oportunidade",
    author: "Gabriela Serpa",
    credit: "Referência de carreira e posicionamento profissional",
    summary:
      "Como escrever título, sobre e posts mesmo sem experiência formal em tecnologia.",
    youtube: "Dicas de LinkedIn para iniciantes",
    url: "https://www.youtube.com/results?search_query=linkedin+para+iniciantes+tecnologia",
  },
  {
    id: "mercado-vagas",
    category: "Dicas de mercado",
    title: "Como ler vagas sem se assustar com a lista de requisitos",
    author: "Loiane Groner",
    credit: "Referência brasileira em educação tech",
    summary:
      "Entenda requisitos essenciais, desejáveis e sinais de vagas boas para estágio, trainee ou júnior.",
    youtube: "Loiane Groner: carreira em tecnologia",
    url: "https://www.youtube.com/@loianegroner",
  },
  {
    id: "portfolio-readme",
    category: "Dicas de portfólio",
    title: "README que explica seu projeto sem entrevista",
    author: "Camila Cavalcante",
    credit: "Curadoria de boas práticas GitHub",
    summary:
      "Estrutura simples para mostrar objetivo, prints, tecnologias, aprendizados e próximos passos.",
    youtube: "Como fazer README no GitHub",
    url: "https://www.youtube.com/results?search_query=como+fazer+readme+github+portfolio",
  },
];

export const womenArea = {
  tips: [
    "Procure comunidades com moderação ativa e canais para iniciantes.",
    "Monte uma rede pequena de apoio: uma pessoa para tirar dúvidas, uma para revisar currículo e uma para compartilhar vagas.",
    "Guarde evidências do seu aprendizado: posts, commits, prints e pequenos projetos.",
    "Priorize ambientes que tenham código de conduta claro e pessoas moderadoras visíveis.",
    "Use grupos de mulheres para revisar currículo, simular entrevista e entender faixas salariais.",
    "Não espere se sentir 100% pronta: aplique para vagas quando cumprir parte dos requisitos principais.",
  ],
  communities: [
    {
      name: "{reprograma}",
      desc: "Cursos e comunidade para mulheres em tecnologia.",
      url: "https://reprograma.com.br",
    },
    {
      name: "WoMakersCode",
      desc: "Comunidade, eventos e capacitação para mulheres.",
      url: "https://womakerscode.org",
    },
    {
      name: "PyLadies Brasil",
      desc: "Comunidade para mulheres que estudam Python.",
      url: "https://brasil.pyladies.com",
    },
    {
      name: "MariaLab",
      desc: "Coletivo feminista de tecnologia, autonomia digital e segurança.",
      url: "https://marialab.org",
    },
    {
      name: "Minas Programam",
      desc: "Iniciativa para formação e inclusão de mulheres na programação.",
      url: "https://minasprogramam.com",
    },
    {
      name: "Women Techmakers",
      desc: "Programa global do Google com eventos, histórias e recursos para mulheres em tecnologia.",
      url: "https://www.womentechmakers.com",
    },
  ],
  creators: [
    {
      name: "Ana Moura",
      handle: creatorHandle,
      topic: "Curadoria tech, primeiro passos e referências sem enrolação.",
      url: "https://www.instagram.com/ana.natech/",
      avatarUrl: creatorPhotoUrl,
    },
    {
      name: "Rafaella Ballerini",
      handle: "@rafaballerini",
      topic: "Programação, carreira e comunidade",
      url: "https://www.youtube.com/@rafaellaballerini",
      avatarUrl: "https://unavatar.io/youtube/rafaellaballerini",
    },
    {
      name: "Loiane Groner",
      handle: "@loianegroner",
      topic: "Java, Angular e carreira",
      url: "https://www.youtube.com/@loianegroner",
      avatarUrl: "https://unavatar.io/youtube/loianegroner",
    },
    {
      name: "Glaucia Lemos",
      handle: "@glaucia_lemos86",
      topic: "Cloud, Microsoft e educação",
      url: "https://www.youtube.com/results?search_query=Glaucia+Lemos+cloud",
      avatarUrl: "https://unavatar.io/youtube/GlauciaLemos",
    },
    {
      name: "Gabriela Pinheiro",
      handle: "@gabrielapinheiro",
      topic: "Front-end, educação e transição de carreira",
      url: "https://www.youtube.com/results?search_query=Gabriela+Pinheiro+programa%C3%A7%C3%A3o",
      avatarUrl: "https://unavatar.io/youtube/gabrielapinheiro",
    },
    {
      name: "Camila Cavalcante",
      handle: "@cami-la",
      topic: "Comunidade, GitHub, carreira e diversidade",
      url: "https://www.linkedin.com/in/camila-cavalcante/",
      avatarUrl: "https://unavatar.io/linkedin/camila-cavalcante",
    },
    {
      name: "Letícia Caires",
      handle: "@leticiascaires",
      topic: "Produto, carreira e bastidores de tecnologia",
      url: "https://www.linkedin.com/search/results/content/?keywords=Leticia%20Caires%20produto%20tech",
      avatarUrl: "https://unavatar.io/linkedin/leticiascaires",
    },
  ],
  videos: [
    {
      title: "Mulheres em tecnologia: primeiros passos",
      url: "https://www.youtube.com/results?search_query=mulheres+em+tecnologia+primeiros+passos",
    },
    {
      title: "Como construir portfólio iniciante",
      url: "https://www.youtube.com/results?search_query=portfolio+iniciante+programacao+mulheres",
    },
    {
      title: "Síndrome da impostora na tecnologia",
      url: "https://www.youtube.com/results?search_query=sindrome+da+impostora+mulheres+tecnologia",
    },
    {
      title: "Como se posicionar em tecnologia",
      url: "https://www.youtube.com/results?search_query=mulheres+tecnologia+marca+pessoal+linkedin",
    },
  ],
  affirmativeJobs: [
    {
      name: "Programathor - vagas afirmativas",
      url: "https://programathor.com.br/jobs",
    },
    {
      name: "Gupy - vagas para mulheres em tecnologia",
      url: "https://portal.gupy.io",
    },
    {
      name: "LinkedIn - mulheres em tecnologia",
      url: "https://www.linkedin.com/jobs/",
    },
    {
      name: "Telegram e LinkedIn de comunidades femininas",
      url: "https://www.linkedin.com/search/results/groups/?keywords=mulheres%20tecnologia",
    },
    {
      name: "Programas de estágio afirmativos",
      url: "https://www.google.com/search?q=programa+est%C3%A1gio+mulheres+tecnologia",
    },
  ],
  supportTracks: [
    {
      title: "Rede e comunidade",
      desc: "Participe de grupos onde possa pedir revisão de currículo, tirar dúvidas pontuais e trocar indicações de vagas.",
    },
    {
      title: "Segurança e confiança",
      desc: "Busque comunidades com código de conduta, canais moderados e acolhimento para perguntas iniciantes.",
    },
    {
      title: "Visibilidade profissional",
      desc: "Publique aprendizados pequenos, registre projetos e mantenha LinkedIn/GitHub com contexto.",
    },
    {
      title: "Negociação e salário",
      desc: "Converse sobre faixas, benefícios e modelo de trabalho antes de aceitar propostas.",
    },
  ],
  scholarshipPrograms: [
    {
      name: "Bolsas e bootcamps para mulheres",
      desc: "Pesquise programas sazonais de empresas, comunidades e escolas com turmas afirmativas.",
      url: "https://www.google.com/search?q=bolsas+bootcamp+mulheres+tecnologia",
    },
    {
      name: "Editais de comunidades",
      desc: "Acompanhe posts de comunidades femininas, pois muitas oportunidades aparecem primeiro nelas.",
      url: "https://www.linkedin.com/search/results/content/?keywords=bolsa%20mulheres%20tecnologia",
    },
    {
      name: "Eventos e encontros de comunidade",
      desc: "Hackathons, meetups e eventos online costumam reunir vagas, bolsas e grupos de estudo.",
      url: "https://www.sympla.com.br/eventos?s=mulheres%20tecnologia",
    },
  ],
  safeSpaceChecklist: [
    "Existe código de conduta ou regras de convivência visíveis.",
    "Há moderação ativa e canal para reportar problemas.",
    "Iniciantes são acolhidas sem piadas ou respostas agressivas.",
    "A comunidade compartilha oportunidades, referências e apoio prático.",
  ],
};

export const dictionaryTerms = [
  {
    term: "API",
    category: "Back-end",
    tags: ["Back-end", "Programação"],
    meaning: "Um caminho para sistemas conversarem entre si e trocarem dados.",
  },
  {
    term: "Deploy",
    category: "DevOps",
    tags: ["DevOps", "Carreira"],
    meaning:
      "Publicar um site, app ou API para que outras pessoas consigam acessar.",
  },
  {
    term: "Framework",
    category: "Programação",
    tags: ["Programação", "Front-end", "Back-end"],
    meaning:
      "Um conjunto de ferramentas e padrões que acelera a construção de software.",
  },
  {
    term: "Git",
    category: "Ferramentas",
    tags: ["Ferramentas", "Programação"],
    meaning:
      "Sistema que registra versões do código e ajuda a colaborar em projetos.",
  },
  {
    term: "GitHub",
    category: "Ferramentas",
    tags: ["Ferramentas", "Portfólio"],
    meaning:
      "Plataforma para hospedar código, colaborar em projetos e mostrar seu portfólio técnico.",
  },
  {
    term: "Responsividade",
    category: "Front-end",
    tags: ["Front-end", "Design"],
    meaning:
      "Capacidade de uma interface se adaptar bem a celular, tablet e computador.",
  },
  {
    term: "HTML",
    category: "Front-end",
    tags: ["Front-end", "Programação"],
    meaning:
      "Linguagem de marcação usada para estruturar páginas web com títulos, textos, imagens e links.",
  },
  {
    term: "CSS",
    category: "Front-end",
    tags: ["Front-end", "Design"],
    meaning:
      "Linguagem usada para definir cores, espaçamentos, fontes, layout e aparência de páginas web.",
  },
  {
    term: "JavaScript",
    category: "Front-end",
    tags: ["Front-end", "Programação"],
    meaning:
      "Linguagem que adiciona interatividade a sites e também pode ser usada no back-end com Node.js.",
  },
  {
    term: "React",
    category: "Front-end",
    tags: ["Front-end", "Framework"],
    meaning:
      "Biblioteca JavaScript para criar interfaces a partir de componentes reutilizáveis.",
  },
  {
    term: "DOM",
    category: "Front-end",
    tags: ["Front-end", "Programação"],
    meaning:
      "Representação da página no navegador que o JavaScript consegue ler e modificar.",
  },
  {
    term: "Endpoint",
    category: "Back-end",
    tags: ["Back-end", "API"],
    meaning:
      "Endereço específico de uma API usado para buscar, criar, atualizar ou remover informações.",
  },
  {
    term: "REST",
    category: "Back-end",
    tags: ["Back-end", "API"],
    meaning:
      "Estilo de arquitetura comum para APIs que usam métodos como GET, POST, PUT e DELETE.",
  },
  {
    term: "JSON",
    category: "Back-end",
    tags: ["Back-end", "Dados"],
    meaning:
      "Formato leve de texto usado para enviar dados entre sistemas, muito comum em APIs.",
  },
  {
    term: "Autenticação",
    category: "Segurança",
    tags: ["Segurança", "Back-end"],
    meaning:
      "Processo de confirmar quem é a pessoa usuária, geralmente com login, senha ou provedor externo.",
  },
  {
    term: "Autorização",
    category: "Segurança",
    tags: ["Segurança", "Back-end"],
    meaning:
      "Regra que define o que uma pessoa autenticada pode acessar ou fazer dentro de um sistema.",
  },
  {
    term: "Banco de dados",
    category: "Dados",
    tags: ["Dados", "Back-end"],
    meaning:
      "Sistema usado para armazenar, organizar e consultar informações de uma aplicação.",
  },
  {
    term: "SQL",
    category: "Dados",
    tags: ["Dados", "Back-end"],
    meaning:
      "Linguagem usada para consultar e manipular dados em bancos relacionais.",
  },
  {
    term: "Dataset",
    category: "Dados",
    tags: ["Dados", "IA"],
    meaning:
      "Conjunto de dados usado para análise, visualização ou treinamento de modelos.",
  },
  {
    term: "Dashboard",
    category: "Dados",
    tags: ["Dados", "Produto"],
    meaning:
      "Painel visual com métricas, gráficos e indicadores para acompanhar uma situação ou decisão.",
  },
  {
    term: "Machine Learning",
    category: "IA",
    tags: ["IA", "Dados"],
    meaning:
      "Área da IA em que sistemas aprendem padrões a partir de dados para fazer previsões ou classificações.",
  },
  {
    term: "Modelo",
    category: "IA",
    tags: ["IA", "Dados"],
    meaning:
      "Resultado de um treinamento de machine learning usado para responder, prever ou classificar algo.",
  },
  {
    term: "Prompt",
    category: "IA",
    tags: ["IA", "Produtividade"],
    meaning:
      "Instrução escrita para orientar uma ferramenta de IA a gerar uma resposta ou executar uma tarefa.",
  },
  {
    term: "UX",
    category: "Design",
    tags: ["Design", "Produto"],
    meaning:
      "Experiência do usuário: clareza, facilidade e sensação ao usar um produto.",
  },
  {
    term: "UI",
    category: "Design",
    tags: ["Design", "Front-end"],
    meaning:
      "Interface do usuário: telas, botões, cores, tipografia e componentes visuais de um produto.",
  },
  {
    term: "Wireframe",
    category: "Design",
    tags: ["Design", "Produto"],
    meaning:
      "Esboço simples de uma tela usado para pensar estrutura antes do visual final.",
  },
  {
    term: "Protótipo",
    category: "Design",
    tags: ["Design", "Produto"],
    meaning:
      "Simulação navegável de um produto para testar ideias antes do desenvolvimento.",
  },
  {
    term: "Persona",
    category: "Produto",
    tags: ["Produto", "Design"],
    meaning:
      "Perfil fictício baseado em usuários reais para orientar decisões de produto e design.",
  },
  {
    term: "Backlog",
    category: "Produto",
    tags: ["Produto", "Gestão"],
    meaning:
      "Lista priorizada de tarefas, melhorias e problemas que um time pretende trabalhar.",
  },
  {
    term: "Sprint",
    category: "Gestão",
    tags: ["Gestão", "Produto"],
    meaning:
      "Ciclo curto de trabalho em metodologias ágeis, geralmente com uma meta clara para o time.",
  },
  {
    term: "KPI",
    category: "Produto",
    tags: ["Produto", "Dados"],
    meaning:
      "Indicador usado para medir se uma ação ou produto está chegando no resultado esperado.",
  },
  {
    term: "Cloud",
    category: "Infra",
    tags: ["Infra", "Cloud"],
    meaning:
      "Servidores e serviços acessados pela internet, como AWS, Azure e Google Cloud.",
  },
  {
    term: "Container",
    category: "DevOps",
    tags: ["DevOps", "Cloud"],
    meaning:
      "Pacote que leva uma aplicação e suas dependências para rodar de forma consistente em ambientes diferentes.",
  },
  {
    term: "CI/CD",
    category: "DevOps",
    tags: ["DevOps", "Ferramentas"],
    meaning:
      "Práticas para testar, integrar e publicar código com mais frequência e menos trabalho manual.",
  },
  {
    term: "Firewall",
    category: "Segurança",
    tags: ["Segurança", "Infra"],
    meaning:
      "Barreira que controla o tráfego de rede permitido ou bloqueado para proteger sistemas.",
  },
  {
    term: "Phishing",
    category: "Segurança",
    tags: ["Segurança", "Carreira"],
    meaning:
      "Golpe que tenta enganar pessoas para roubar senhas, dados ou acesso a contas.",
  },
  {
    term: "Bug",
    category: "QA",
    tags: ["QA", "Programação"],
    meaning: "Erro ou comportamento inesperado em um software.",
  },
  {
    term: "Teste de regressão",
    category: "QA",
    tags: ["QA", "Programação"],
    meaning:
      "Teste feito para garantir que uma mudança nova não quebrou algo que já funcionava.",
  },
  {
    term: "MVP",
    category: "Produto",
    tags: ["Produto", "Carreira"],
    meaning:
      "Versão mínima de um produto criada para validar uma ideia com usuários reais.",
  },
  {
    term: "Portfólio",
    category: "Carreira",
    tags: ["Carreira", "Portfólio"],
    meaning:
      "Coleção de projetos e evidências que mostram o que você sabe fazer.",
  },
  {
    term: "Networking",
    category: "Carreira",
    tags: ["Carreira", "Comunidade"],
    meaning:
      "Construção de relações profissionais para trocar conhecimento, oportunidades e apoio.",
  },
  {
    term: "Algoritmo",
    category: "Programação",
    tags: ["Programação", "Lógica"],
    meaning:
      "Sequência de passos para resolver um problema ou executar uma tarefa.",
  },
  {
    term: "Variável",
    category: "Programação",
    tags: ["Programação", "Lógica"],
    meaning:
      "Espaço com nome usado para guardar um valor que pode ser usado pelo código.",
  },
  {
    term: "Função",
    category: "Programação",
    tags: ["Programação", "Lógica"],
    meaning:
      "Bloco de código reutilizável que executa uma ação ou devolve um resultado.",
  },
  {
    term: "Loop",
    category: "Programação",
    tags: ["Programação", "Lógica"],
    meaning:
      "Estrutura que repete uma instrução enquanto uma condição for verdadeira ou para cada item de uma lista.",
  },
  {
    term: "Condicional",
    category: "Programação",
    tags: ["Programação", "Lógica"],
    meaning:
      "Estrutura como if/else usada para tomar decisões dentro do código.",
  },
  {
    term: "Array",
    category: "Programação",
    tags: ["Programação", "Front-end"],
    meaning:
      "Lista ordenada de valores que pode guardar textos, números, objetos ou outros dados.",
  },
  {
    term: "Objeto",
    category: "Programação",
    tags: ["Programação", "Front-end"],
    meaning:
      "Estrutura que agrupa dados em pares de chave e valor, como nome, idade e email.",
  },
  {
    term: "TypeScript",
    category: "Programação",
    tags: ["Programação", "Front-end", "Back-end"],
    meaning:
      "Versão do JavaScript com tipos, ajudando a encontrar erros antes de rodar o código.",
  },
  {
    term: "Node.js",
    category: "Back-end",
    tags: ["Back-end", "Programação"],
    meaning:
      "Ambiente que permite executar JavaScript fora do navegador, muito usado para criar APIs.",
  },
  {
    term: "NPM",
    category: "Ferramentas",
    tags: ["Ferramentas", "Programação"],
    meaning:
      "Gerenciador de pacotes do ecossistema JavaScript para instalar bibliotecas e scripts.",
  },
  {
    term: "PNPM",
    category: "Ferramentas",
    tags: ["Ferramentas", "Programação"],
    meaning:
      "Gerenciador de pacotes JavaScript rápido e econômico no uso de espaço em disco.",
  },
  {
    term: "Vite",
    category: "Front-end",
    tags: ["Front-end", "Ferramentas"],
    meaning:
      "Ferramenta moderna para criar, desenvolver e empacotar aplicações front-end.",
  },
  {
    term: "SPA",
    category: "Front-end",
    tags: ["Front-end", "Programação"],
    meaning:
      "Aplicação de página única que troca telas sem recarregar o site inteiro.",
  },
  {
    term: "SSR",
    category: "Front-end",
    tags: ["Front-end", "Performance"],
    meaning:
      "Renderização no servidor, técnica em que a página chega pronta ou quase pronta ao navegador.",
  },
  {
    term: "SEO",
    category: "Marketing Tech",
    tags: ["Front-end", "Carreira"],
    meaning:
      "Conjunto de práticas para melhorar a visibilidade de páginas em buscadores como Google.",
  },
  {
    term: "Acessibilidade",
    category: "Design",
    tags: ["Design", "Front-end"],
    meaning:
      "Prática de criar produtos que também funcionem bem para pessoas com diferentes necessidades.",
  },
  {
    term: "Semântica",
    category: "Front-end",
    tags: ["Front-end", "Acessibilidade"],
    meaning:
      "Uso de elementos HTML com significado correto para melhorar leitura, SEO e acessibilidade.",
  },
  {
    term: "Flexbox",
    category: "Front-end",
    tags: ["Front-end", "Design"],
    meaning:
      "Modelo de layout CSS usado para alinhar e distribuir elementos em uma direção.",
  },
  {
    term: "Grid",
    category: "Front-end",
    tags: ["Front-end", "Design"],
    meaning: "Modelo de layout CSS para criar estruturas em linhas e colunas.",
  },
  {
    term: "Componente",
    category: "Front-end",
    tags: ["Front-end", "Design System"],
    meaning:
      "Parte reutilizável de uma interface, como botão, card, menu ou modal.",
  },
  {
    term: "Props",
    category: "Front-end",
    tags: ["Front-end", "React"],
    meaning:
      "Dados enviados para um componente React para personalizar o que ele mostra ou faz.",
  },
  {
    term: "State",
    category: "Front-end",
    tags: ["Front-end", "React"],
    meaning:
      "Dados internos de um componente que mudam com interação, carregamento ou lógica.",
  },
  {
    term: "Hook",
    category: "Front-end",
    tags: ["Front-end", "React"],
    meaning:
      "Função especial do React usada para estado, efeitos e outras capacidades em componentes.",
  },
  {
    term: "Roteamento",
    category: "Front-end",
    tags: ["Front-end", "Programação"],
    meaning:
      "Organização das URLs e telas de uma aplicação, como /perfil ou /cursos.",
  },
  {
    term: "Formulário",
    category: "Front-end",
    tags: ["Front-end", "UX"],
    meaning:
      "Interface para coletar informações da pessoa usuária, como cadastro, login ou busca.",
  },
  {
    term: "Validação",
    category: "Programação",
    tags: ["Front-end", "Back-end", "QA"],
    meaning:
      "Checagem para garantir que dados enviados estão corretos, completos e seguros.",
  },
  {
    term: "CRUD",
    category: "Back-end",
    tags: ["Back-end", "Dados"],
    meaning: "Operações básicas de criar, ler, atualizar e deletar dados.",
  },
  {
    term: "HTTP",
    category: "Back-end",
    tags: ["Back-end", "API"],
    meaning:
      "Protocolo usado pela web para comunicação entre navegador, apps, servidores e APIs.",
  },
  {
    term: "HTTPS",
    category: "Segurança",
    tags: ["Segurança", "Back-end"],
    meaning:
      "Versão segura do HTTP, com criptografia para proteger dados em trânsito.",
  },
  {
    term: "Request",
    category: "Back-end",
    tags: ["Back-end", "API"],
    meaning:
      "Pedido enviado por um cliente, como navegador ou app, para um servidor.",
  },
  {
    term: "Response",
    category: "Back-end",
    tags: ["Back-end", "API"],
    meaning: "Resposta que o servidor devolve depois de receber um request.",
  },
  {
    term: "Status code",
    category: "Back-end",
    tags: ["Back-end", "API"],
    meaning:
      "Código numérico que indica o resultado de uma requisição, como 200, 404 ou 500.",
  },
  {
    term: "Middleware",
    category: "Back-end",
    tags: ["Back-end", "Segurança"],
    meaning:
      "Camada de código que roda entre a requisição e a resposta para validar, registrar ou modificar algo.",
  },
  {
    term: "Servidor",
    category: "Infra",
    tags: ["Infra", "Back-end"],
    meaning:
      "Computador ou serviço que recebe pedidos e entrega respostas, arquivos, páginas ou dados.",
  },
  {
    term: "Cliente",
    category: "Programação",
    tags: ["Front-end", "Back-end"],
    meaning:
      "Parte que consome um serviço, como navegador, app mobile ou outro sistema.",
  },
  {
    term: "Cache",
    category: "Performance",
    tags: ["Performance", "Back-end", "Front-end"],
    meaning:
      "Armazenamento temporário usado para evitar trabalho repetido e deixar respostas mais rápidas.",
  },
  {
    term: "Cookie",
    category: "Web",
    tags: ["Front-end", "Segurança"],
    meaning:
      "Pequeno dado salvo no navegador, usado para sessão, preferências ou rastreamento.",
  },
  {
    term: "Token",
    category: "Segurança",
    tags: ["Segurança", "Back-end"],
    meaning:
      "Código usado para representar acesso, sessão ou permissão entre sistemas.",
  },
  {
    term: "JWT",
    category: "Segurança",
    tags: ["Segurança", "Back-end"],
    meaning:
      "Tipo de token que carrega informações assinadas para autenticação e autorização.",
  },
  {
    term: "OAuth",
    category: "Segurança",
    tags: ["Segurança", "Back-end"],
    meaning:
      "Padrão usado para login e autorização com provedores como Google, GitHub ou Microsoft.",
  },
  {
    term: "Hash",
    category: "Segurança",
    tags: ["Segurança", "Back-end"],
    meaning:
      "Resultado de transformar um dado em uma sequência fixa, muito usado para proteger senhas.",
  },
  {
    term: "Criptografia",
    category: "Segurança",
    tags: ["Segurança", "Infra"],
    meaning:
      "Técnica para proteger informações tornando os dados ilegíveis sem a chave correta.",
  },
  {
    term: "Vulnerabilidade",
    category: "Segurança",
    tags: ["Segurança", "QA"],
    meaning:
      "Falha que pode ser explorada para comprometer dados, sistemas ou contas.",
  },
  {
    term: "Pentest",
    category: "Segurança",
    tags: ["Segurança", "Carreira"],
    meaning:
      "Teste de invasão autorizado para encontrar vulnerabilidades antes de atacantes reais.",
  },
  {
    term: "SOC",
    category: "Segurança",
    tags: ["Segurança", "Carreira"],
    meaning:
      "Centro de operações de segurança que monitora alertas, ameaças e incidentes.",
  },
  {
    term: "Malware",
    category: "Segurança",
    tags: ["Segurança"],
    meaning:
      "Software malicioso criado para roubar dados, causar danos ou obter acesso indevido.",
  },
  {
    term: "Ransomware",
    category: "Segurança",
    tags: ["Segurança"],
    meaning:
      "Ataque que sequestra dados ou sistemas e cobra resgate para liberar o acesso.",
  },
  {
    term: "LGPD",
    category: "Segurança",
    tags: ["Segurança", "Produto"],
    meaning:
      "Lei brasileira que define regras para coleta, uso, proteção e descarte de dados pessoais.",
  },
  {
    term: "Tabela",
    category: "Dados",
    tags: ["Dados", "Back-end"],
    meaning: "Estrutura de banco relacional organizada em linhas e colunas.",
  },
  {
    term: "Registro",
    category: "Dados",
    tags: ["Dados", "Back-end"],
    meaning:
      "Linha de uma tabela que representa uma entidade ou evento específico.",
  },
  {
    term: "Chave primária",
    category: "Dados",
    tags: ["Dados", "Back-end"],
    meaning: "Campo que identifica de forma única um registro em uma tabela.",
  },
  {
    term: "Chave estrangeira",
    category: "Dados",
    tags: ["Dados", "Back-end"],
    meaning:
      "Campo que conecta uma tabela a outra dentro de um banco relacional.",
  },
  {
    term: "JOIN",
    category: "Dados",
    tags: ["Dados", "SQL"],
    meaning: "Operação SQL usada para combinar dados de duas ou mais tabelas.",
  },
  {
    term: "NoSQL",
    category: "Dados",
    tags: ["Dados", "Back-end"],
    meaning:
      "Família de bancos de dados que não seguem o modelo relacional tradicional.",
  },
  {
    term: "ETL",
    category: "Dados",
    tags: ["Dados", "Cloud"],
    meaning:
      "Processo de extrair, transformar e carregar dados entre sistemas.",
  },
  {
    term: "Data Lake",
    category: "Dados",
    tags: ["Dados", "Cloud"],
    meaning:
      "Repositório que guarda grandes volumes de dados em formatos variados para análises futuras.",
  },
  {
    term: "Data Warehouse",
    category: "Dados",
    tags: ["Dados", "BI"],
    meaning:
      "Banco organizado para relatórios, métricas e análises de negócio.",
  },
  {
    term: "BI",
    category: "Dados",
    tags: ["Dados", "Produto"],
    meaning:
      "Business Intelligence: uso de dados para criar relatórios, dashboards e apoiar decisões.",
  },
  {
    term: "Pandas",
    category: "Dados",
    tags: ["Dados", "Python"],
    meaning:
      "Biblioteca Python usada para manipular, limpar e analisar dados em tabelas.",
  },
  {
    term: "Notebook",
    category: "Dados",
    tags: ["Dados", "Ferramentas"],
    meaning:
      "Ambiente interativo para escrever código, textos, gráficos e análises no mesmo arquivo.",
  },
  {
    term: "Métrica",
    category: "Produto",
    tags: ["Produto", "Dados"],
    meaning:
      "Medida acompanhada para entender comportamento, resultado ou qualidade de algo.",
  },
  {
    term: "Correlação",
    category: "Dados",
    tags: ["Dados", "Estatística"],
    meaning:
      "Relação estatística entre duas variáveis, sem necessariamente indicar causa.",
  },
  {
    term: "Média",
    category: "Dados",
    tags: ["Dados", "Estatística"],
    meaning: "Soma dos valores dividida pela quantidade de valores.",
  },
  {
    term: "Mediana",
    category: "Dados",
    tags: ["Dados", "Estatística"],
    meaning:
      "Valor central de um conjunto ordenado, útil quando existem valores muito extremos.",
  },
  {
    term: "Overfitting",
    category: "IA",
    tags: ["IA", "Dados"],
    meaning:
      "Quando um modelo aprende demais os dados de treino e vai mal em dados novos.",
  },
  {
    term: "Treinamento",
    category: "IA",
    tags: ["IA", "Dados"],
    meaning: "Processo de ensinar um modelo usando dados e exemplos.",
  },
  {
    term: "Inferência",
    category: "IA",
    tags: ["IA", "Dados"],
    meaning:
      "Uso de um modelo já treinado para gerar previsão, resposta ou classificação.",
  },
  {
    term: "Rede neural",
    category: "IA",
    tags: ["IA", "Dados"],
    meaning:
      "Modelo inspirado em conexões de neurônios, usado em tarefas como imagem, texto e voz.",
  },
  {
    term: "Deep Learning",
    category: "IA",
    tags: ["IA", "Dados"],
    meaning:
      "Área de machine learning baseada em redes neurais com muitas camadas.",
  },
  {
    term: "LLM",
    category: "IA",
    tags: ["IA", "Produtividade"],
    meaning:
      "Modelo de linguagem grande treinado para entender e gerar texto, código e respostas.",
  },
  {
    term: "Fine-tuning",
    category: "IA",
    tags: ["IA", "Dados"],
    meaning:
      "Ajuste de um modelo já treinado com dados específicos para melhorar uma tarefa.",
  },
  {
    term: "Embedding",
    category: "IA",
    tags: ["IA", "Dados"],
    meaning:
      "Representação numérica de texto, imagem ou dado para comparação e busca semântica.",
  },
  {
    term: "RAG",
    category: "IA",
    tags: ["IA", "Dados"],
    meaning:
      "Técnica que combina busca em documentos com IA para gerar respostas mais contextualizadas.",
  },
  {
    term: "Alucinação",
    category: "IA",
    tags: ["IA", "Produtividade"],
    meaning:
      "Quando uma IA gera uma resposta convincente, mas incorreta ou inventada.",
  },
  {
    term: "Docker",
    category: "DevOps",
    tags: ["DevOps", "Cloud"],
    meaning: "Ferramenta para criar e executar containers de aplicações.",
  },
  {
    term: "Kubernetes",
    category: "DevOps",
    tags: ["DevOps", "Cloud"],
    meaning:
      "Plataforma para orquestrar containers em ambientes com muitas aplicações e servidores.",
  },
  {
    term: "Pipeline",
    category: "DevOps",
    tags: ["DevOps", "Ferramentas"],
    meaning:
      "Sequência automatizada de etapas, como instalar, testar, buildar e publicar um projeto.",
  },
  {
    term: "Build",
    category: "DevOps",
    tags: ["DevOps", "Front-end"],
    meaning:
      "Processo de preparar o código para produção, gerando arquivos otimizados.",
  },
  {
    term: "Ambiente de produção",
    category: "DevOps",
    tags: ["DevOps", "Cloud"],
    meaning: "Ambiente real usado por pessoas usuárias finais.",
  },
  {
    term: "Ambiente de homologação",
    category: "DevOps",
    tags: ["DevOps", "QA"],
    meaning:
      "Ambiente parecido com produção usado para testar antes de liberar mudanças.",
  },
  {
    term: "Log",
    category: "DevOps",
    tags: ["DevOps", "Back-end"],
    meaning:
      "Registro de eventos do sistema usado para investigar erros e comportamento.",
  },
  {
    term: "Monitoramento",
    category: "DevOps",
    tags: ["DevOps", "Cloud"],
    meaning:
      "Acompanhamento de métricas, erros e saúde de sistemas em tempo real.",
  },
  {
    term: "Observabilidade",
    category: "DevOps",
    tags: ["DevOps", "Performance"],
    meaning:
      "Capacidade de entender o que acontece dentro de um sistema por logs, métricas e traces.",
  },
  {
    term: "SRE",
    category: "DevOps",
    tags: ["DevOps", "Carreira"],
    meaning:
      "Site Reliability Engineering: área focada em confiabilidade, automação e operação de sistemas.",
  },
  {
    term: "IaC",
    category: "DevOps",
    tags: ["DevOps", "Cloud"],
    meaning:
      "Infraestrutura como código, prática de configurar recursos de nuvem usando arquivos versionados.",
  },
  {
    term: "Terraform",
    category: "DevOps",
    tags: ["DevOps", "Cloud"],
    meaning:
      "Ferramenta usada para criar e gerenciar infraestrutura como código.",
  },
  {
    term: "Serverless",
    category: "Cloud",
    tags: ["Cloud", "Back-end"],
    meaning:
      "Modelo em que a nuvem gerencia servidores e a equipe foca mais no código da função ou serviço.",
  },
  {
    term: "AWS",
    category: "Cloud",
    tags: ["Cloud", "Infra"],
    meaning:
      "Amazon Web Services, uma das maiores plataformas de computação em nuvem.",
  },
  {
    term: "Azure",
    category: "Cloud",
    tags: ["Cloud", "Infra"],
    meaning: "Plataforma de computação em nuvem da Microsoft.",
  },
  {
    term: "GCP",
    category: "Cloud",
    tags: ["Cloud", "Infra"],
    meaning:
      "Google Cloud Platform, plataforma de computação em nuvem do Google.",
  },
  {
    term: "DNS",
    category: "Infra",
    tags: ["Infra", "Web"],
    meaning:
      "Sistema que traduz nomes de domínio, como site.com, para endereços usados por servidores.",
  },
  {
    term: "Domínio",
    category: "Web",
    tags: ["Web", "Carreira"],
    meaning: "Nome usado para acessar um site, como exemplo.com.br.",
  },
  {
    term: "Hospedagem",
    category: "Web",
    tags: ["Web", "Cloud"],
    meaning: "Serviço que mantém um site ou aplicação disponível na internet.",
  },
  {
    term: "Latência",
    category: "Performance",
    tags: ["Performance", "Infra"],
    meaning: "Tempo de atraso entre uma ação e a resposta do sistema.",
  },
  {
    term: "Escalabilidade",
    category: "Arquitetura",
    tags: ["Arquitetura", "Cloud"],
    meaning:
      "Capacidade de um sistema crescer para atender mais acessos, dados ou usuários.",
  },
  {
    term: "Arquitetura",
    category: "Arquitetura",
    tags: ["Arquitetura", "Back-end"],
    meaning:
      "Forma como as partes de um sistema são organizadas e se comunicam.",
  },
  {
    term: "Monolito",
    category: "Arquitetura",
    tags: ["Arquitetura", "Back-end"],
    meaning:
      "Aplicação em que várias partes do sistema ficam em um único projeto ou deploy.",
  },
  {
    term: "Microsserviços",
    category: "Arquitetura",
    tags: ["Arquitetura", "Back-end"],
    meaning:
      "Abordagem em que o sistema é dividido em serviços menores e independentes.",
  },
  {
    term: "Fila",
    category: "Arquitetura",
    tags: ["Arquitetura", "Back-end"],
    meaning:
      "Mecanismo para organizar tarefas assíncronas, evitando sobrecarregar o sistema.",
  },
  {
    term: "WebSocket",
    category: "Back-end",
    tags: ["Back-end", "Front-end"],
    meaning:
      "Tecnologia para comunicação em tempo real entre cliente e servidor.",
  },
  {
    term: "Teste unitário",
    category: "QA",
    tags: ["QA", "Programação"],
    meaning:
      "Teste focado em uma função, componente ou pequena parte isolada do código.",
  },
  {
    term: "Teste de integração",
    category: "QA",
    tags: ["QA", "Back-end"],
    meaning:
      "Teste que verifica se diferentes partes do sistema funcionam bem juntas.",
  },
  {
    term: "Teste E2E",
    category: "QA",
    tags: ["QA", "Front-end"],
    meaning:
      "Teste que simula o caminho completo da pessoa usuária, do começo ao fim.",
  },
  {
    term: "Teste manual",
    category: "QA",
    tags: ["QA", "Carreira"],
    meaning:
      "Teste executado por uma pessoa seguindo cenários, critérios e observações.",
  },
  {
    term: "Automação de testes",
    category: "QA",
    tags: ["QA", "Programação"],
    meaning:
      "Uso de código ou ferramentas para repetir testes automaticamente.",
  },
  {
    term: "Caso de teste",
    category: "QA",
    tags: ["QA", "Produto"],
    meaning:
      "Descrição de passos, dados e resultado esperado para validar uma funcionalidade.",
  },
  {
    term: "Critério de aceite",
    category: "Produto",
    tags: ["Produto", "QA"],
    meaning:
      "Condição que precisa ser verdadeira para uma tarefa ser considerada concluída.",
  },
  {
    term: "Smoke test",
    category: "QA",
    tags: ["QA", "DevOps"],
    meaning:
      "Teste rápido para confirmar que as partes mais importantes do sistema ainda funcionam.",
  },
  {
    term: "Design System",
    category: "Design",
    tags: ["Design", "Front-end"],
    meaning:
      "Conjunto de padrões, componentes e regras visuais para manter consistência em produtos.",
  },
  {
    term: "Auto-layout",
    category: "Design",
    tags: ["Design", "Ferramentas"],
    meaning:
      "Recurso do Figma para criar layouts flexíveis com espaçamento e alinhamento automáticos.",
  },
  {
    term: "Jornada do usuário",
    category: "Design",
    tags: ["Design", "Produto"],
    meaning:
      "Sequência de passos que uma pessoa percorre para alcançar um objetivo no produto.",
  },
  {
    term: "Pesquisa com usuários",
    category: "Design",
    tags: ["Design", "Produto"],
    meaning:
      "Métodos para entender necessidades, dores e comportamentos de pessoas usuárias.",
  },
  {
    term: "Usabilidade",
    category: "Design",
    tags: ["Design", "UX"],
    meaning: "Qualidade de um produto ser fácil, claro e eficiente de usar.",
  },
  {
    term: "Heurísticas",
    category: "Design",
    tags: ["Design", "UX"],
    meaning:
      "Princípios usados para avaliar se uma interface é clara, consistente e fácil de usar.",
  },
  {
    term: "Benchmark",
    category: "Produto",
    tags: ["Produto", "Carreira"],
    meaning:
      "Comparação com produtos, empresas ou referências para aprender boas práticas e oportunidades.",
  },
  {
    term: "Discovery",
    category: "Produto",
    tags: ["Produto", "Design"],
    meaning:
      "Fase de investigação para entender problema, público, contexto e possíveis soluções.",
  },
  {
    term: "Delivery",
    category: "Produto",
    tags: ["Produto", "Gestão"],
    meaning: "Fase de construção e entrega da solução planejada.",
  },
  {
    term: "Stakeholder",
    category: "Produto",
    tags: ["Produto", "Gestão"],
    meaning:
      "Pessoa ou grupo interessado no resultado de um projeto ou produto.",
  },
  {
    term: "Roadmap",
    category: "Produto",
    tags: ["Produto", "Carreira"],
    meaning:
      "Plano visual ou lista priorizada que mostra a direção e próximas entregas.",
  },
  {
    term: "Kanban",
    category: "Gestão",
    tags: ["Gestão", "Produto"],
    meaning:
      "Método visual de organização do trabalho com colunas como a fazer, fazendo e feito.",
  },
  {
    term: "Scrum",
    category: "Gestão",
    tags: ["Gestão", "Produto"],
    meaning:
      "Framework ágil com papéis, eventos e ciclos curtos para organizar entregas.",
  },
  {
    term: "Daily",
    category: "Gestão",
    tags: ["Gestão", "Produto"],
    meaning: "Reunião rápida do time para alinhar andamento, foco e bloqueios.",
  },
  {
    term: "Retrospectiva",
    category: "Gestão",
    tags: ["Gestão", "Produto"],
    meaning:
      "Reunião para revisar o que funcionou, o que melhorar e quais ações tomar no próximo ciclo.",
  },
  {
    term: "Product Owner",
    category: "Produto",
    tags: ["Produto", "Carreira"],
    meaning:
      "Pessoa responsável por priorizar o backlog e maximizar valor entregue pelo time.",
  },
  {
    term: "Product Manager",
    category: "Produto",
    tags: ["Produto", "Carreira"],
    meaning:
      "Pessoa que conecta usuário, negócio e tecnologia para direcionar a evolução do produto.",
  },
  {
    term: "Issue",
    category: "Ferramentas",
    tags: ["Ferramentas", "Gestão"],
    meaning:
      "Tarefa, bug ou solicitação registrada em ferramentas como GitHub, Jira ou Linear.",
  },
  {
    term: "Pull Request",
    category: "Ferramentas",
    tags: ["Ferramentas", "Programação"],
    meaning:
      "Pedido de revisão para integrar mudanças de código a uma branch principal.",
  },
  {
    term: "Branch",
    category: "Ferramentas",
    tags: ["Ferramentas", "Programação"],
    meaning:
      "Linha paralela de desenvolvimento usada para trabalhar sem mexer diretamente na versão principal.",
  },
  {
    term: "Commit",
    category: "Ferramentas",
    tags: ["Ferramentas", "Programação"],
    meaning: "Registro de uma mudança no histórico do Git.",
  },
  {
    term: "Merge",
    category: "Ferramentas",
    tags: ["Ferramentas", "Programação"],
    meaning: "Ação de juntar mudanças de uma branch em outra.",
  },
  {
    term: "Conflito de merge",
    category: "Ferramentas",
    tags: ["Ferramentas", "Programação"],
    meaning:
      "Situação em que o Git precisa de ajuda para decidir entre mudanças diferentes no mesmo trecho.",
  },
  {
    term: "README",
    category: "Portfólio",
    tags: ["Portfólio", "Ferramentas"],
    meaning:
      "Arquivo que explica objetivo, instalação, uso, tecnologias e aprendizados de um projeto.",
  },
  {
    term: "Open Source",
    category: "Carreira",
    tags: ["Carreira", "Comunidade"],
    meaning:
      "Projeto com código aberto para estudo, uso e contribuição da comunidade.",
  },
  {
    term: "Freelancer",
    category: "Carreira",
    tags: ["Carreira"],
    meaning:
      "Profissional autônomo que trabalha por projeto, demanda ou contrato.",
  },
  {
    term: "Estágio",
    category: "Carreira",
    tags: ["Carreira"],
    meaning:
      "Oportunidade de aprendizado prático para estudantes entrarem no mercado.",
  },
  {
    term: "Júnior",
    category: "Carreira",
    tags: ["Carreira"],
    meaning:
      "Nível inicial de carreira, com autonomia em crescimento e necessidade de acompanhamento.",
  },
  {
    term: "Hard skills",
    category: "Carreira",
    tags: ["Carreira"],
    meaning:
      "Habilidades técnicas, como programar, testar, analisar dados ou usar ferramentas.",
  },
  {
    term: "Soft skills",
    category: "Carreira",
    tags: ["Carreira"],
    meaning:
      "Habilidades comportamentais, como comunicação, organização, colaboração e adaptabilidade.",
  },
  {
    term: "Mentoria",
    category: "Carreira",
    tags: ["Carreira", "Comunidade"],
    meaning:
      "Acompanhamento de alguém mais experiente para orientar próximos passos e decisões.",
  },
  {
    term: "Currículo",
    category: "Carreira",
    tags: ["Carreira"],
    meaning:
      "Documento que resume formação, experiências, projetos, habilidades e contatos profissionais.",
  },
  {
    term: "LinkedIn",
    category: "Carreira",
    tags: ["Carreira", "Portfólio"],
    meaning:
      "Rede profissional usada para networking, vagas, conteúdo e posicionamento de carreira.",
  },
  {
    term: "React Native",
    category: "Mobile",
    tags: ["Mobile", "Front-end"],
    meaning:
      "Framework para criar aplicativos mobile usando JavaScript e React.",
  },
  {
    term: "Flutter",
    category: "Mobile",
    tags: ["Mobile", "Front-end"],
    meaning:
      "Framework do Google para criar apps mobile e multiplataforma usando Dart.",
  },
  {
    term: "APK",
    category: "Mobile",
    tags: ["Mobile"],
    meaning: "Arquivo usado para instalar aplicativos Android.",
  },
  {
    term: "App Store",
    category: "Mobile",
    tags: ["Mobile", "Carreira"],
    meaning:
      "Loja oficial da Apple para publicar e baixar apps de iPhone e iPad.",
  },
  {
    term: "Play Store",
    category: "Mobile",
    tags: ["Mobile", "Carreira"],
    meaning: "Loja oficial do Google para publicar e baixar apps Android.",
  },
  {
    term: "Expo",
    category: "Mobile",
    tags: ["Mobile", "Ferramentas"],
    meaning:
      "Conjunto de ferramentas que facilita criar, testar e publicar apps React Native.",
  },
  {
    term: "Firebase",
    category: "Mobile",
    tags: ["Mobile", "Back-end", "Cloud"],
    meaning:
      "Plataforma do Google com autenticação, banco, hospedagem e recursos para apps.",
  },
  {
    term: "GraphQL",
    category: "Back-end",
    tags: ["Back-end", "API"],
    meaning:
      "Linguagem de consulta para APIs onde a cliente pede só os campos que precisa em uma única requisição.",
  },
  {
    term: "gRPC",
    category: "Back-end",
    tags: ["Back-end", "API"],
    meaning:
      "Framework RPC que usa protobuf e HTTP/2 para comunicação rápida e contratos fortes entre serviços.",
  },
  {
    term: "ORM",
    category: "Back-end",
    tags: ["Back-end", "Dados"],
    meaning:
      "Camada que mapeia tabelas do banco para objetos no código, reduzindo SQL manual.",
  },
  {
    term: "Migração",
    category: "Dados",
    tags: ["Dados", "Back-end"],
    meaning:
      "Script versionado que altera estrutura do banco de forma controlada e repetível.",
  },
  {
    term: "Índice (banco)",
    category: "Dados",
    tags: ["Dados", "Performance"],
    meaning:
      "Estrutura que acelera buscas em colunas, com trade-off de espaço e custo em escritas.",
  },
  {
    term: "Transação",
    category: "Dados",
    tags: ["Dados", "Back-end"],
    meaning:
      "Grupo de operações que ou todas confirmam ou todas desfazem, mantendo consistência.",
  },
  {
    term: "Deadlock",
    category: "Dados",
    tags: ["Dados", "Back-end"],
    meaning:
      "Situação em que transações ficam esperando uma pela outra indefinidamente.",
  },
  {
    term: "Normalização",
    category: "Dados",
    tags: ["Dados", "SQL"],
    meaning:
      "Organizar dados para reduzir redundância e inconsistência em bancos relacionais.",
  },
  {
    term: "Denormalização",
    category: "Dados",
    tags: ["Dados", "Performance"],
    meaning:
      "Duplicar ou juntar dados de propósito para acelerar leituras em certos casos.",
  },
  {
    term: "Mensageria",
    category: "Arquitetura",
    tags: ["Arquitetura", "Back-end"],
    meaning:
      "Uso de filas ou brokers para processar trabalhos fora do fluxo principal da requisição.",
  },
  {
    term: "Pub/Sub",
    category: "Arquitetura",
    tags: ["Arquitetura", "Cloud"],
    meaning:
      "Modelo em que publicadores enviam eventos e assinantes recebem sem acoplamento direto.",
  },
  {
    term: "Idempotência",
    category: "Back-end",
    tags: ["Back-end", "API"],
    meaning:
      "Propriedade em que repetir a mesma operação segura não muda o resultado além da primeira vez.",
  },
  {
    term: "Rate limit",
    category: "Segurança",
    tags: ["Segurança", "API"],
    meaning:
      "Limite de requisições por tempo para proteger serviços contra abuso ou sobrecarga.",
  },
  {
    term: "CORS",
    category: "Web",
    tags: ["Web", "Back-end", "Front-end"],
    meaning:
      "Mecanismo do navegador que controla se um site pode chamar API de outro domínio.",
  },
  {
    term: "CSRF",
    category: "Segurança",
    tags: ["Segurança", "Web"],
    meaning:
      "Ataque que engana o navegador a enviar ação autenticada sem intenção da pessoa usuária.",
  },
  {
    term: "XSS",
    category: "Segurança",
    tags: ["Segurança", "Web"],
    meaning:
      "Injeção de script em páginas para roubar sessão ou alterar o que outros veem.",
  },
  {
    term: "SQL injection",
    category: "Segurança",
    tags: ["Segurança", "Dados"],
    meaning:
      "Ataque que insere SQL malicioso em entradas para ler ou alterar dados indevidos.",
  },
  {
    term: "DDoS",
    category: "Segurança",
    tags: ["Segurança", "Infra"],
    meaning:
      "Volume massivo de tráfego para derrubar ou degradar um serviço online.",
  },
  {
    term: "VPN",
    category: "Infra",
    tags: ["Infra", "Segurança"],
    meaning:
      "Túnel criptografado que protege tráfego, comum em acesso remoto corporativo.",
  },
  {
    term: "CDN",
    category: "Infra",
    tags: ["Infra", "Performance"],
    meaning:
      "Rede que entrega arquivos estáticos de servidores próximos da pessoa usuária.",
  },
  {
    term: "Load balancer",
    category: "Infra",
    tags: ["Infra", "Cloud"],
    meaning:
      "Distribui requisições entre vários servidores para escala e resiliência.",
  },
  {
    term: "Reverse proxy",
    category: "Infra",
    tags: ["Infra", "Back-end"],
    meaning:
      "Servidor na frente dos apps que encamina tráfego, pode cachear, TLS e regras de rota.",
  },
  {
    term: "IP",
    category: "Redes",
    tags: ["Infra", "Web"],
    meaning: "Endereço numérico que identifica um dispositivo em uma rede.",
  },
  {
    term: "TCP/IP",
    category: "Redes",
    tags: ["Infra", "Back-end"],
    meaning:
      "Conjunto de protocolos que define como dados trafegam na internet de forma confiável.",
  },
  {
    term: "UDP",
    category: "Redes",
    tags: ["Infra", "Back-end"],
    meaning:
      "Protocolo mais simples e sem garantia de ordem, usado em streaming e jogos em tempo real.",
  },
  {
    term: "SSH",
    category: "Ferramentas",
    tags: ["Ferramentas", "DevOps"],
    meaning: "Protocolo seguro para acessar terminal de servidores remotos.",
  },
  {
    term: "YAML",
    category: "Ferramentas",
    tags: ["Ferramentas", "DevOps"],
    meaning:
      "Formato de arquivo legível por humanos para configs, pipelines e infraestrutura.",
  },
  {
    term: "Regex",
    category: "Programação",
    tags: ["Programação", "Dados"],
    meaning: "Padrão para buscar ou validar texto com regras compactas.",
  },
  {
    term: "Timezone",
    category: "Programação",
    tags: ["Programação", "Back-end"],
    meaning:
      "Fuso horário que afeta datas em agendamentos, logs e notificações.",
  },
  {
    term: "Unicode",
    category: "Programação",
    tags: ["Programação", "Web"],
    meaning:
      "Padrão que representa caracteres de praticamente todos os sistemas de escrita.",
  },
  {
    term: "UTF-8",
    category: "Programação",
    tags: ["Programação", "Web"],
    meaning:
      "Codificação comum que armazena Unicode de forma compacta e compatível com ASCII.",
  },
  {
    term: "Semáforo",
    category: "Programação",
    tags: ["Programação", "Back-end"],
    meaning:
      "Primitiva de concorrência que limita quantas tarefas acessam um recurso ao mesmo tempo.",
  },
  {
    term: "Dead letter queue",
    category: "Arquitetura",
    tags: ["Arquitetura", "Cloud"],
    meaning:
      "Fila para mensagens que falharam após tentativas, para análise e reprocessamento.",
  },
  {
    term: "Feature flag",
    category: "Produto",
    tags: ["Produto", "DevOps"],
    meaning:
      "Interruptor remoto que liga ou desliga funcionalidade sem novo deploy.",
  },
  {
    term: "A/B test",
    category: "Produto",
    tags: ["Produto", "Dados"],
    meaning:
      "Experimento que compara duas versões com tráfego dividido para medir resultado.",
  },
  {
    term: "OKR",
    category: "Gestão",
    tags: ["Gestão", "Produto"],
    meaning:
      "Metodologia de objetivos ambiciosos e resultados mensuráveis em ciclos.",
  },
  {
    term: "SLA",
    category: "Gestão",
    tags: ["Gestão", "DevOps"],
    meaning:
      "Acordo formal sobre disponibilidade, tempo de resposta ou suporte esperado.",
  },
  {
    term: "SLO",
    category: "DevOps",
    tags: ["DevOps", "Gestão"],
    meaning:
      "Meta interna de confiabilidade, como tempo disponível ou latência aceitável.",
  },
  {
    term: "Incidente",
    category: "DevOps",
    tags: ["DevOps", "Carreira"],
    meaning:
      "Evento que prejudica usuários ou serviço e exige resposta coordenada.",
  },
  {
    term: "Postmortem",
    category: "DevOps",
    tags: ["DevOps", "Gestão"],
    meaning:
      "Documento após incidente com causa, impacto e ações para não repetir.",
  },
  {
    term: "TDD",
    category: "QA",
    tags: ["QA", "Programação"],
    meaning: "Prática de escrever teste antes do código que o satisfaz.",
  },
  {
    term: "BDD",
    category: "QA",
    tags: ["QA", "Produto"],
    meaning:
      "Abordagem que descreve comportamento em linguagem próxima ao negócio antes de implementar.",
  },
  {
    term: "Mock",
    category: "QA",
    tags: ["QA", "Programação"],
    meaning: "Objeto ou serviço falso que simula dependências em testes.",
  },
  {
    term: "Stub",
    category: "QA",
    tags: ["QA", "Programação"],
    meaning:
      "Implementação mínima que devolve respostas fixas para isolar o código sob teste.",
  },
  {
    term: "Faker / dado sintético",
    category: "Dados",
    tags: ["Dados", "QA"],
    meaning:
      "Dados inventados mas realistas para testes sem vazar informação real.",
  },
  {
    term: "Golden file",
    category: "QA",
    tags: ["QA", "Programação"],
    meaning:
      "Arquivo de referência comparado com saída atual para detectar mudanças inesperadas.",
  },
  {
    term: "Flaky test",
    category: "QA",
    tags: ["QA", "Programação"],
    meaning:
      "Teste que às vezes passa e às vezes falha sem mudança clara no código.",
  },
  {
    term: "Snapshot",
    category: "QA",
    tags: ["QA", "Front-end"],
    meaning:
      "Arquivo serializado do output esperado de um componente para comparação automática.",
  },
  {
    term: "Lighthouse",
    category: "Performance",
    tags: ["Performance", "Front-end"],
    meaning:
      "Ferramenta do Chrome que audita performance, acessibilidade e SEO de páginas.",
  },
  {
    term: "Core Web Vitals",
    category: "Performance",
    tags: ["Performance", "SEO"],
    meaning:
      "Métricas do Google sobre carregamento, interatividade e estabilidade visual.",
  },
  {
    term: "Bundle",
    category: "Front-end",
    tags: ["Front-end", "DevOps"],
    meaning: "Arquivo empacotado com JavaScript/CSS para enviar ao navegador.",
  },
  {
    term: "Tree shaking",
    category: "Front-end",
    tags: ["Front-end", "Performance"],
    meaning: "Remoção de código não usado no build final.",
  },
  {
    term: "Code splitting",
    category: "Front-end",
    tags: ["Front-end", "Performance"],
    meaning:
      "Dividir o bundle em partes carregadas sob demanda para abrir a página mais rápido.",
  },
  {
    term: "Hydration",
    category: "Front-end",
    tags: ["Front-end", "Performance"],
    meaning:
      "No SSR, processo em que o JS do cliente 'ativa' interatividade no HTML já entregue.",
  },
  {
    term: "WebAssembly",
    category: "Programação",
    tags: ["Programação", "Performance"],
    meaning:
      "Formato binário executável no navegador com desempenho próximo ao nativo.",
  },
  {
    term: "Canvas",
    category: "Front-end",
    tags: ["Front-end", "Games"],
    meaning: "Elemento HTML para desenhar gráficos 2D via JavaScript.",
  },
  {
    term: "WebGL",
    category: "Front-end",
    tags: ["Front-end", "Games"],
    meaning: "API para gráficos 3D acelerados por GPU no navegador.",
  },
  {
    term: "Game loop",
    category: "Games",
    tags: ["Games", "Programação"],
    meaning:
      "Ciclo de atualizar estado e desenhar quadros em jogos e simulações.",
  },
  {
    term: "Shader",
    category: "Games",
    tags: ["Games", "Front-end"],
    meaning: "Programa que roda na GPU para efeitos visuais em 2D/3D.",
  },
  {
    term: "GDPR",
    category: "Segurança",
    tags: ["Segurança", "Produto"],
    meaning:
      "Regulamento europeu sobre dados pessoais e direitos dos titulares.",
  },
  {
    term: "Consentimento",
    category: "Produto",
    tags: ["Produto", "Segurança"],
    meaning:
      "Permissão explícita e informada para usar dados ou cookies, exigida em várias leis.",
  },
  {
    term: "PII",
    category: "Dados",
    tags: ["Dados", "Segurança"],
    meaning: "Informações que identificam uma pessoa direta ou indiretamente.",
  },
  {
    term: "Anonimização",
    category: "Dados",
    tags: ["Dados", "Segurança"],
    meaning: "Remover ou alterar dados para não permitir identificar a pessoa.",
  },
  {
    term: "Blockchain",
    category: "Web3",
    tags: ["Web3", "Dados"],
    meaning:
      "Cadeia de blocos imutável usada em registros distribuídos e criptomoedas.",
  },
  {
    term: "Smart contract",
    category: "Web3",
    tags: ["Web3", "Back-end"],
    meaning: "Programa que roda em blockchain quando condições são atendidas.",
  },
  {
    term: "NFT",
    category: "Web3",
    tags: ["Web3", "Design"],
    meaning:
      "Token não fungível que representa posse única de ativo digital em alguns blockchains.",
  },
  {
    term: "Ledger",
    category: "Dados",
    tags: ["Dados", "Finanças"],
    meaning: "Registro cronológico de transações ou eventos contábeis.",
  },
  {
    term: "IoT",
    category: "Hardware",
    tags: ["Hardware", "Cloud"],
    meaning:
      "Internet das Coisas: sensores e dispositivos conectados coletando dados.",
  },
  {
    term: "Firmware",
    category: "Hardware",
    tags: ["Hardware", "Programação"],
    meaning: "Software embarcado que controla hardware de baixo nível.",
  },
  {
    term: "RTOS",
    category: "Hardware",
    tags: ["Hardware", "Programação"],
    meaning:
      "Sistema operacional de tempo real com previsibilidade de resposta.",
  },
  {
    term: "CAD",
    category: "Hardware",
    tags: ["Hardware", "Design"],
    meaning:
      "Software de desenho técnico 3D usado em engenharia e prototipagem.",
  },
  {
    term: "Gerber",
    category: "Hardware",
    tags: ["Hardware"],
    meaning:
      "Formato de arquivos para fabricação de placas de circuito impresso.",
  },
  {
    term: "CMS",
    category: "Web",
    tags: ["Web", "Produto"],
    meaning:
      "Sistema para criar e editar conteúdo de sites sem programar tudo do zero.",
  },
  {
    term: "Headless CMS",
    category: "Web",
    tags: ["Web", "Back-end"],
    meaning: "CMS que só entrega conteúdo via API; o front é separado.",
  },
  {
    term: "Webhook",
    category: "Back-end",
    tags: ["Back-end", "API"],
    meaning:
      "URL que recebe notificação HTTP quando um sistema externo dispara um evento.",
  },
  {
    term: "Cron job",
    category: "DevOps",
    tags: ["DevOps", "Back-end"],
    meaning: "Tarefa agendada em intervalos fixos, como backups ou relatórios.",
  },
  {
    term: "GDScript",
    category: "Games",
    tags: ["Games", "Programação"],
    meaning: "Linguagem do motor Godot para criar jogos 2D e 3D.",
  },
  {
    term: "Unity",
    category: "Games",
    tags: ["Games", "Carreira"],
    meaning: "Motor popular para jogos multiplataforma com editor visual.",
  },
  {
    term: "Unreal Engine",
    category: "Games",
    tags: ["Games", "Carreira"],
    meaning: "Motor gráfico avançado comum em jogos AA/AAA e visualização 3D.",
  },
  {
    term: "Sprite",
    category: "Games",
    tags: ["Games", "Design"],
    meaning: "Imagem 2D usada como personagem, item ou parte da cena.",
  },
  {
    term: "Collider",
    category: "Games",
    tags: ["Games", "Programação"],
    meaning:
      "Volume invisível que detecta colisões entre objetos na física do jogo.",
  },
  {
    term: "Ray tracing",
    category: "Games",
    tags: ["Games", "Hardware"],
    meaning: "Técnica que simula luz realista traçando raios, exige GPU forte.",
  },
  {
    term: "Áudio sampling",
    category: "Áudio",
    tags: ["Áudio", "Dados"],
    meaning:
      "Medir amplitude do som em intervalos para digitalizar onda analógica.",
  },
  {
    term: "Codec",
    category: "Áudio",
    tags: ["Áudio", "Web"],
    meaning:
      "Algoritmo que comprime e descomprime áudio ou vídeo (ex.: Opus, H.264).",
  },
  {
    term: "FFT",
    category: "Áudio",
    tags: ["Áudio", "IA"],
    meaning:
      "Transformada que converte sinal no tempo em frequências, útil em análise e ML de áudio.",
  },
  {
    term: "Latência de áudio",
    category: "Áudio",
    tags: ["Áudio", "Games"],
    meaning:
      "Atraso entre captura/processamento e o som ouvido; crítica em música e jogos online.",
  },
  {
    term: "Compliance",
    category: "Carreira",
    tags: ["Carreira", "Segurança"],
    meaning:
      "Conjunto de regras e auditorias que a empresa precisa seguir em setores regulados.",
  },
  {
    term: "On-call",
    category: "DevOps",
    tags: ["DevOps", "Carreira"],
    meaning:
      "Plantão em que alguém do time responde a alertas fora do horário comercial.",
  },
  {
    term: "Runbook",
    category: "DevOps",
    tags: ["DevOps", "Gestão"],
    meaning:
      "Passo a passo documentado para resolver incidentes ou tarefas operacionais.",
  },
  {
    term: "RFC",
    category: "Arquitetura",
    tags: ["Arquitetura", "Carreira"],
    meaning:
      "Documento de proposta para mudanças grandes, com contexto, opções e decisão.",
  },
  {
    term: "ADR",
    category: "Arquitetura",
    tags: ["Arquitetura", "Carreira"],
    meaning:
      "Architecture Decision Record: registro curto de por que uma decisão técnica foi tomada.",
  },
  {
    term: "Diagrama C4",
    category: "Arquitetura",
    tags: ["Arquitetura", "Gestão"],
    meaning:
      "Modelo em camadas (contexto, containers, componentes, código) para explicar sistemas.",
  },
  {
    term: "GD&T",
    category: "Hardware",
    tags: ["Hardware"],
    meaning:
      "Sistema de símbolos para tolerâncias geométricas em desenhos técnicos.",
  },
  {
    term: "EPC",
    category: "IoT",
    tags: ["Hardware", "Redes"],
    meaning:
      "Identificador de produto eletrônico usado em RFID para rastrear itens.",
  },
];

export const comparisonOptions = {
  faculdades: ["ADS", "Ciência da Computação", "Sistemas de Informação"],
  areas: ["Front-end", "Back-end", "Dados", "UX/UI Design"],
  cursos: ["Curso em Vídeo", "freeCodeCamp", "DIO", "Microsoft Learn"],
  plataformas: ["YouTube", "Coursera", "Alura", "DIO"],
};

export const comparisonMatrix = [
  {
    label: "Tempo para começar",
    faculdades: "Médio",
    areas: "Rápido",
    cursos: "Rápido",
    plataformas: "Rápido",
  },
  {
    label: "Custo inicial",
    faculdades: "Médio/alto",
    areas: "Baixo",
    cursos: "Baixo",
    plataformas: "Variável",
  },
  {
    label: "Melhor uso",
    faculdades: "Base e diploma",
    areas: "Escolha de direção",
    cursos: "Aprender prática",
    plataformas: "Catálogo contínuo",
  },
  {
    label: "Risco para iniciantes",
    faculdades: "Escolher sem comparar",
    areas: "Ficar só pesquisando",
    cursos: "Não praticar",
    plataformas: "Excesso de opções",
  },
];

export const QUIZ_ESTIMATED_MINUTES = 5;

/** Numero de perguntas da triagem de nivel (fase 1). */
export const TRIAGE_QUESTION_COUNT = 3;

/** Numero de perguntas do quiz de cada nivel (fase 2). */
export const LEVEL_QUESTION_COUNT = 15;

export type QuizLevel = "iniciante" | "intermediario" | "avancado";

export interface QuizOption {
  label: string;
  area: string;
  scores: Record<string, number>;
}

export interface QuizQuestion {
  id: string;
  category: string;
  question: string;
  options: QuizOption[];
}

export interface TriageOption {
  label: string;
  level: QuizLevel;
}

export interface TriageQuestion {
  id: string;
  category: string;
  question: string;
  options: TriageOption[];
}

/**
 * Triagem de nivel (3 perguntas). Cada opcao aponta para um nivel.
 * A distribuicao e balanceada: cada nivel aparece em 4 das 12 opcoes.
 */
export const triageQuestions: TriageQuestion[] = [
  {
    id: "tri-1",
    category: "Experiência",
    question: "Como é hoje a sua experiência prática com tecnologia?",
    options: [
      {
        label: "Nunca programei nem usei ferramentas técnicas de verdade",
        level: "iniciante",
      },
      {
        label: "Já fiz tutoriais ou cursos introdutórios, mas nada além disso",
        level: "iniciante",
      },
      {
        label:
          "Já montei alguns projetos pequenos ou uso tecnologia perto do meu trabalho",
        level: "intermediario",
      },
      {
        label:
          "Já desenvolvo, mantenho sistemas ou trabalho diretamente na área",
        level: "avancado",
      },
    ],
  },
  {
    id: "tri-2",
    category: "Vocabulário",
    question: "Quando aparecem termos como API, deploy ou framework, você...",
    options: [
      { label: "Não sei o que significam", level: "iniciante" },
      {
        label: "Já ouvi, mas preciso de uma explicação simples",
        level: "intermediario",
      },
      {
        label: "Entendo a maioria e uso alguns no dia a dia",
        level: "intermediario",
      },
      {
        label: "Discuto detalhes, trade-offs e ferramentas com naturalidade",
        level: "avancado",
      },
    ],
  },
  {
    id: "tri-3",
    category: "Momento",
    question: "O que melhor descreve o seu momento agora?",
    options: [
      {
        label: "Quero descobrir se a área de tecnologia combina comigo",
        level: "iniciante",
      },
      {
        label: "Já decidi entrar e quero escolher um caminho pra seguir",
        level: "intermediario",
      },
      {
        label: "Já estudo ou atuo e quero me especializar ou trocar de foco",
        level: "avancado",
      },
      {
        label:
          "Já tenho base técnica e quero validar qual área aproveita melhor meu perfil",
        level: "avancado",
      },
    ],
  },
];

/**
 * Classifica o nivel a partir dos niveis escolhidos na triagem.
 *
 * Regra deterministica:
 * - Cada resposta soma 1 ponto ao nivel da opcao escolhida.
 * - Com as 3 respostas, os pontos somam exatamente 3.
 * - Vence o nivel com mais pontos.
 * - O unico empate possivel e 1/1/1 (um voto por nivel). Nesse caso
 *   resolvemos para o nivel mais baixo (ordem iniciante, intermediario,
 *   avancado), para nunca superestimar quem ainda esta comecando.
 *
 * O reduce so troca o melhor com ">" (estritamente maior), partindo de
 * "iniciante" e percorrendo a ordem crescente, entao o empate cai
 * naturalmente no nivel mais baixo. Sem aleatoriedade.
 */
export function classifyTriageLevel(levels: QuizLevel[]): QuizLevel {
  const points: Record<QuizLevel, number> = {
    iniciante: 0,
    intermediario: 0,
    avancado: 0,
  };
  levels.forEach((level) => {
    points[level] += 1;
  });
  const order: QuizLevel[] = ["iniciante", "intermediario", "avancado"];
  return order.reduce(
    (best, level) => (points[level] > points[best] ? level : best),
    "iniciante" as QuizLevel,
  );
}

/**
 * Conteudo da tela de nivel (mostrada entre a triagem e as 15 perguntas).
 * Revela o nivel classificado e explica o que a plataforma faz com ele.
 * Observacao: hoje o nivel so adapta a LINGUAGEM das perguntas; o motor de
 * scoring e a area recomendada sao os mesmos para todos os niveis.
 */
export interface LevelMeta {
  label: string;
  emoji: string;
  tagline: string;
  doing: string[];
}

export const LEVEL_META: Record<QuizLevel, LevelMeta> = {
  iniciante: {
    label: "Iniciante",
    emoji: "🌱",
    tagline: "Você está começando agora, e esse é o melhor lugar pra começar.",
    doing: [
      "As próximas 15 perguntas vêm em linguagem simples, sem jargão técnico.",
      "Cruzamos suas respostas com as áreas de tech pra achar a que mais combina com você.",
      "No fim, você sai com uma direção clara e trilhas pra dar os primeiros passos.",
    ],
  },
  intermediario: {
    label: "Intermediário",
    emoji: "🚀",
    tagline:
      "Você já tem uma base e quer escolher um caminho. Bora afinar isso.",
    doing: [
      "As 15 perguntas trazem alguns termos técnicos, sempre com contexto.",
      "Comparamos seu perfil com as áreas pra mostrar onde você se encaixa melhor.",
      "No fim, um ranking das áreas e trilhas que mais aproveitam o que você já sabe.",
    ],
  },
  avancado: {
    label: "Avançado",
    emoji: "⚡",
    tagline:
      "Você já está na área e quer validar ou trocar de foco. Vamos ao ponto.",
    doing: [
      "As 15 perguntas usam linguagem técnica direta, sem rodeios.",
      "Mapeamos seu perfil contra as áreas pra apontar onde seu repertório rende mais.",
      "No fim, as áreas e trilhas que melhor aproveitam sua experiência.",
    ],
  },
};

export interface IntakeOption {
  label: string;
  value: string;
}

export interface IntakeQuestion {
  id: string;
  category: string;
  question: string;
  options: IntakeOption[];
}

/**
 * Etapa inicial (intake): captura objetivo e motivo do usuario.
 * Sao apenas registrados (result_json + analytics); nao mudam a pontuacao
 * nem o nivel. O roteamento por objetivo fica para uma etapa futura.
 */
export const objetivoQuestion: IntakeQuestion = {
  id: "tri-objetivo",
  category: "Objetivo",
  question: "Pra começar: o que você quer com esse quiz?",
  options: [
    { label: "Descobrir uma área que combine comigo", value: "descobrir" },
    { label: "Mudar de área dentro da tecnologia", value: "mudar" },
    { label: "Começar do zero em tech", value: "comecar-do-zero" },
    {
      label: "Escolher uma tecnologia pra focar",
      value: "escolher-tecnologia",
    },
  ],
};

export const motivoQuestion: IntakeQuestion = {
  id: "tri-motivo",
  category: "Motivo",
  question: "E o que mais te descreve agora?",
  options: [
    { label: "Tô em dúvida sobre qual caminho seguir", value: "em-duvida" },
    {
      label: "Quero confirmar se a área que penso combina comigo",
      value: "confirmar",
    },
    {
      label: "Tô me sentindo perdida(o) e quero uma direção",
      value: "direcao",
    },
    { label: "Curiosidade, só explorando", value: "curiosidade" },
  ],
};

/**
 * Quiz por nivel. Cada nivel tem 15 perguntas com o mesmo conjunto de areas
 * e a mesma distribuicao de "principais" (cada area e principal 5 vezes),
 * mudando apenas o tom da linguagem:
 * - iniciante: linguagem de leigo, sem jargao, exemplos do cotidiano.
 * - intermediario: alguns termos tecnicos, sempre com contexto.
 * - avancado: linguagem nativa de TI, muito termo tecnico.
 * As respostas alimentam o mesmo motor de scoring por area.
 */
export const quizByLevel: Record<QuizLevel, QuizQuestion[]> = {
  iniciante: [
    {
      id: "ini-1",
      category: "Interesse",
      question:
        "Pensa num dia de trabalho que passaria voando. O que você estaria fazendo?",
      options: [
        {
          label:
            "Montando telas bonitas e fáceis de usar e vendo o resultado na hora",
          area: "Front-end",
          scores: {
            "Front-end": 5,
            "UX/UI Design": 2,
            "Desenvolvimento Mobile": 1,
          },
        },
        {
          label:
            "Fazendo as regras e as contas funcionarem por trás, longe da tela",
          area: "Back-end",
          scores: { "Back-end": 5, "Ciência de Dados": 1 },
        },
        {
          label: "Olhando um monte de números e descobrindo o que eles contam",
          area: "Ciência de Dados",
          scores: { "Ciência de Dados": 5, "Inteligência Artificial": 2 },
        },
        {
          label:
            "Conversando com as pessoas pra deixar tudo mais fácil pra elas",
          area: "UX/UI Design",
          scores: { "UX/UI Design": 5, "Produto Digital": 3 },
        },
      ],
    },
    {
      id: "ini-2",
      category: "Problema",
      question: "Qual desses problemas você teria mais vontade de resolver?",
      options: [
        {
          label: "Ensinar o computador a reconhecer coisas e responder sozinho",
          area: "Inteligência Artificial",
          scores: { "Inteligência Artificial": 5, "Ciência de Dados": 3 },
        },
        {
          label:
            "Descobrir o que as pessoas mais precisam e decidir o que fazer primeiro",
          area: "Produto Digital",
          scores: { "Produto Digital": 5, "UX/UI Design": 2 },
        },
        {
          label: "Proteger as pessoas de golpes, roubo de senha e invasores",
          area: "Cibersegurança",
          scores: { Cibersegurança: 5, "Cloud Computing": 1 },
        },
        {
          label:
            "Cuidar pra que os sites e apps não saiam do ar nem fiquem lentos",
          area: "Cloud Computing",
          scores: { "Cloud Computing": 5, DevOps: 3 },
        },
      ],
    },
    {
      id: "ini-3",
      category: "Rotina",
      question: "Como você gostaria que fosse a sua rotina?",
      options: [
        {
          label:
            "Organizando as tarefas do grupo, os prazos e o ritmo de todo mundo",
          area: "Gestão de Projetos Tech",
          scores: { "Gestão de Projetos Tech": 5, "Produto Digital": 3 },
        },
        {
          label: "Conferindo tudo com calma pra garantir que nada saia errado",
          area: "QA / Testes de Software",
          scores: { "QA / Testes de Software": 5, "Back-end": 1 },
        },
        {
          label: "Criando aplicativos de celular que ajudam no dia a dia",
          area: "Desenvolvimento Mobile",
          scores: { "Desenvolvimento Mobile": 5, "Front-end": 2 },
        },
        {
          label:
            "Automatizando tarefas chatas e mantendo tudo funcionando sem travar",
          area: "DevOps",
          scores: { DevOps: 5, "Cloud Computing": 3 },
        },
      ],
    },
    {
      id: "ini-4",
      category: "Aprendizado",
      question:
        "Quando você quer aprender algo novo, o que funciona melhor pra você?",
      options: [
        {
          label:
            "Resolver desafios de lógica passo a passo até tudo se encaixar",
          area: "Back-end",
          scores: { "Back-end": 5, "QA / Testes de Software": 1 },
        },
        {
          label: "Mexer em planilhas, gráficos e listas pra enxergar um padrão",
          area: "Ciência de Dados",
          scores: { "Ciência de Dados": 5, "Inteligência Artificial": 2 },
        },
        {
          label: "Perguntar pras pessoas e observar onde elas têm dificuldade",
          area: "UX/UI Design",
          scores: { "UX/UI Design": 5, "Produto Digital": 3 },
        },
        {
          label:
            "Ver exemplos de como a máquina aprende a partir de muitos casos",
          area: "Inteligência Artificial",
          scores: { "Inteligência Artificial": 5, "Ciência de Dados": 3 },
        },
      ],
    },
    {
      id: "ini-5",
      category: "Impacto",
      question: "Que diferença você gostaria que o seu trabalho fizesse?",
      options: [
        {
          label:
            "Deixar um aplicativo tão fácil que qualquer pessoa consegue usar",
          area: "Produto Digital",
          scores: { "Produto Digital": 5, "UX/UI Design": 3 },
        },
        {
          label: "Evitar que pessoas caiam em golpes ou tenham dados roubados",
          area: "Cibersegurança",
          scores: { Cibersegurança: 5, "Cloud Computing": 1 },
        },
        {
          label: "Fazer um serviço aguentar muita gente usando ao mesmo tempo",
          area: "Cloud Computing",
          scores: { "Cloud Computing": 5, DevOps: 3 },
        },
        {
          label: "Fazer um projeto chegar ao fim no prazo e sem bagunça",
          area: "Gestão de Projetos Tech",
          scores: { "Gestão de Projetos Tech": 5, "Produto Digital": 2 },
        },
      ],
    },
    {
      id: "ini-6",
      category: "Portfólio",
      question: "Qual desses primeiros projetos te empolga mais?",
      options: [
        {
          label:
            "Uma lista caprichada dos erros de um app, com sugestões de conserto",
          area: "QA / Testes de Software",
          scores: {
            "QA / Testes de Software": 5,
            "Back-end": 1,
            "Front-end": 1,
          },
        },
        {
          label: "Um app de celular simples pra organizar a sua rotina",
          area: "Desenvolvimento Mobile",
          scores: { "Desenvolvimento Mobile": 5, "Front-end": 2 },
        },
        {
          label:
            "Um programa que faz sozinho uma tarefa repetitiva no computador",
          area: "DevOps",
          scores: { DevOps: 5, "Back-end": 1 },
        },
        {
          label: "Uma página bonita na internet pra mostrar pra família",
          area: "Front-end",
          scores: { "Front-end": 5, "UX/UI Design": 1 },
        },
      ],
    },
    {
      id: "ini-7",
      category: "Afinidade",
      question: "Com qual desses assuntos você se imagina mexendo o dia todo?",
      options: [
        {
          label: "Números, gráficos e as histórias que os dados escondem",
          area: "Ciência de Dados",
          scores: { "Ciência de Dados": 5, "Produto Digital": 2 },
        },
        {
          label: "Pessoas, hábitos e o que deixa a vida delas mais simples",
          area: "UX/UI Design",
          scores: { "UX/UI Design": 5, "Produto Digital": 3 },
        },
        {
          label: "Computadores que aprendem e respondem quase como gente",
          area: "Inteligência Artificial",
          scores: { "Inteligência Artificial": 5, "Ciência de Dados": 3 },
        },
        {
          label: "Decidir, junto com o time, o que vale a pena construir",
          area: "Produto Digital",
          scores: { "Produto Digital": 5, "Gestão de Projetos Tech": 3 },
        },
      ],
    },
    {
      id: "ini-8",
      category: "Diagnóstico",
      question:
        "Um sistema importante começou a dar problema. O que você gostaria de fazer?",
      options: [
        {
          label:
            "Descobrir se alguém tentou invadir ou usar de um jeito errado",
          area: "Cibersegurança",
          scores: { Cibersegurança: 5, DevOps: 2 },
        },
        {
          label: "Ver se o servidor aguentou o tanto de gente acessando",
          area: "Cloud Computing",
          scores: { "Cloud Computing": 5, DevOps: 3 },
        },
        {
          label: "Avisar as pessoas certas e organizar quem resolve o quê",
          area: "Gestão de Projetos Tech",
          scores: { "Gestão de Projetos Tech": 5, "Produto Digital": 2 },
        },
        {
          label:
            "Repetir os passos com calma pra achar exatamente onde quebrou",
          area: "QA / Testes de Software",
          scores: { "QA / Testes de Software": 5, "Back-end": 1 },
        },
      ],
    },
    {
      id: "ini-9",
      category: "Construção",
      question: "Se pudesse construir qualquer coisa, o que você escolheria?",
      options: [
        {
          label: "Um app de celular que as pessoas usariam todo dia",
          area: "Desenvolvimento Mobile",
          scores: { "Desenvolvimento Mobile": 5, "Front-end": 2 },
        },
        {
          label:
            "Um sistema que se cuida sozinho e avisa quando tem algo errado",
          area: "DevOps",
          scores: { DevOps: 5, "Cloud Computing": 3 },
        },
        {
          label: "Um site cheio de detalhes bonitos e divertidos de usar",
          area: "Front-end",
          scores: { "Front-end": 5, "UX/UI Design": 2 },
        },
        {
          label:
            "Um programa que guarda informações e responde quando alguém pede",
          area: "Back-end",
          scores: { "Back-end": 5, "Cloud Computing": 1 },
        },
      ],
    },
    {
      id: "ini-10",
      category: "Motivação",
      question: "Que tipo de elogio te deixaria mais orgulhosa(o)?",
      options: [
        {
          label: "Ficou tão fácil de usar que nem precisei de ajuda",
          area: "UX/UI Design",
          scores: { "UX/UI Design": 5, "Produto Digital": 3, "Front-end": 1 },
        },
        {
          label: "Parece que o sistema adivinhou o que eu queria",
          area: "Inteligência Artificial",
          scores: { "Inteligência Artificial": 5, "Ciência de Dados": 2 },
        },
        {
          label: "Esse produto resolveu mesmo um problema da minha vida",
          area: "Produto Digital",
          scores: { "Produto Digital": 5, "UX/UI Design": 2 },
        },
        {
          label: "Que bom que os meus dados estão seguros com vocês",
          area: "Cibersegurança",
          scores: { Cibersegurança: 5, "Cloud Computing": 1 },
        },
      ],
    },
    {
      id: "ini-11",
      category: "Time",
      question: "Num time, qual tarefa você gostaria que fosse sua?",
      options: [
        {
          label:
            "Garantir que tudo continue no ar mesmo com muita gente usando",
          area: "Cloud Computing",
          scores: { "Cloud Computing": 5, DevOps: 3 },
        },
        {
          label: "Cuidar dos prazos, das prioridades e do combinado do grupo",
          area: "Gestão de Projetos Tech",
          scores: { "Gestão de Projetos Tech": 5, "Produto Digital": 3 },
        },
        {
          label: "Testar tudo antes pra o usuário não receber nada com defeito",
          area: "QA / Testes de Software",
          scores: { "QA / Testes de Software": 5, "Back-end": 1 },
        },
        {
          label: "Cuidar do aplicativo de celular do começo ao fim",
          area: "Desenvolvimento Mobile",
          scores: { "Desenvolvimento Mobile": 5, "Front-end": 2 },
        },
      ],
    },
    {
      id: "ini-12",
      category: "Investigação",
      question:
        "Um app que você usa travou. O que dá mais vontade de investigar?",
      options: [
        {
          label:
            "Ver os avisos do sistema pra descobrir quando começou a falhar",
          area: "DevOps",
          scores: { DevOps: 5, "Cloud Computing": 3 },
        },
        {
          label: "Repetir na tela o que aconteceu pra ver o que o usuário viu",
          area: "Front-end",
          scores: { "Front-end": 5, "QA / Testes de Software": 2 },
        },
        {
          label: "Procurar lá no fundo qual regra ou cálculo deu errado",
          area: "Back-end",
          scores: { "Back-end": 5, "Ciência de Dados": 1 },
        },
        {
          label: "Olhar os números pra ver se tem algo estranho nos dados",
          area: "Ciência de Dados",
          scores: { "Ciência de Dados": 5, "Inteligência Artificial": 2 },
        },
      ],
    },
    {
      id: "ini-13",
      category: "Futuro",
      question: "Daqui a alguns anos, em que você gostaria de ser referência?",
      options: [
        {
          label:
            "Em fazer computadores aprenderem e automatizarem coisas inteligentes",
          area: "Inteligência Artificial",
          scores: { "Inteligência Artificial": 5, "Ciência de Dados": 3 },
        },
        {
          label: "Em criar produtos digitais que muita gente ama usar",
          area: "Produto Digital",
          scores: { "Produto Digital": 5, "UX/UI Design": 2 },
        },
        {
          label: "Em proteger empresas e pessoas de ataques na internet",
          area: "Cibersegurança",
          scores: { Cibersegurança: 5, "Cloud Computing": 1 },
        },
        {
          label:
            "Em manter sistemas grandes funcionando pra milhões de pessoas",
          area: "Cloud Computing",
          scores: { "Cloud Computing": 5, DevOps: 3 },
        },
      ],
    },
    {
      id: "ini-14",
      category: "Colaboração",
      question: "Com qual tipo de trabalho em equipe você se identifica mais?",
      options: [
        {
          label: "Conversar com todo mundo pra alinhar o que vem primeiro",
          area: "Gestão de Projetos Tech",
          scores: { "Gestão de Projetos Tech": 5, "Produto Digital": 3 },
        },
        {
          label: "Ser a pessoa cuidadosa que percebe os detalhes que faltaram",
          area: "QA / Testes de Software",
          scores: { "QA / Testes de Software": 5, "Back-end": 1 },
        },
        {
          label: "Cuidar da parte do celular junto com quem desenha as telas",
          area: "Desenvolvimento Mobile",
          scores: { "Desenvolvimento Mobile": 5, "Front-end": 2 },
        },
        {
          label: "Deixar as ferramentas do time mais rápidas e automáticas",
          area: "DevOps",
          scores: { DevOps: 5, "Cloud Computing": 2 },
        },
      ],
    },
    {
      id: "ini-15",
      category: "Estilo",
      question: "Qual frase combina mais com o seu jeito?",
      options: [
        {
          label: "Gosto de ver resultado rápido e bonito na tela",
          area: "Front-end",
          scores: { "Front-end": 5, "UX/UI Design": 2 },
        },
        {
          label: "Gosto de montar algo bem feito por baixo, mesmo que demore",
          area: "Back-end",
          scores: { "Back-end": 5, "Cloud Computing": 1 },
        },
        {
          label: "Gosto de investigar com calma antes de dar uma resposta",
          area: "Ciência de Dados",
          scores: { "Ciência de Dados": 5, "Inteligência Artificial": 2 },
        },
        {
          label: "Gosto de entender as pessoas antes de sair fazendo",
          area: "UX/UI Design",
          scores: { "UX/UI Design": 5, "Produto Digital": 3 },
        },
      ],
    },
  ],
  intermediario: [
    {
      id: "int-1",
      category: "Interesse",
      question: "Que tipo de tarefa te daria energia por várias horas?",
      options: [
        {
          label:
            "Construir interfaces responsivas e ver as mudanças na tela na hora",
          area: "Front-end",
          scores: {
            "Front-end": 5,
            "UX/UI Design": 2,
            "Desenvolvimento Mobile": 1,
          },
        },
        {
          label:
            "Modelar regras de negócio e estruturar os dados por trás do sistema",
          area: "Back-end",
          scores: { "Back-end": 5, "Ciência de Dados": 1 },
        },
        {
          label: "Explorar uma base de dados atrás de padrões e tendências",
          area: "Ciência de Dados",
          scores: { "Ciência de Dados": 5, "Inteligência Artificial": 2 },
        },
        {
          label: "Mapear a jornada do usuário e melhorar a experiência dele",
          area: "UX/UI Design",
          scores: { "UX/UI Design": 5, "Produto Digital": 3 },
        },
      ],
    },
    {
      id: "int-2",
      category: "Problema",
      question: "Qual problema você gostaria de resolver no dia a dia?",
      options: [
        {
          label: "Treinar um modelo que classifica ou prevê com base em dados",
          area: "Inteligência Artificial",
          scores: { "Inteligência Artificial": 5, "Ciência de Dados": 3 },
        },
        {
          label: "Entender o usuário e priorizar o que entrega mais valor",
          area: "Produto Digital",
          scores: { "Produto Digital": 5, "UX/UI Design": 2 },
        },
        {
          label: "Encontrar vulnerabilidades e proteger sistemas de ataques",
          area: "Cibersegurança",
          scores: { Cibersegurança: 5, "Cloud Computing": 1 },
        },
        {
          label: "Manter aplicações no ar, rápidas e prontas pra escalar",
          area: "Cloud Computing",
          scores: { "Cloud Computing": 5, DevOps: 3 },
        },
      ],
    },
    {
      id: "int-3",
      category: "Rotina",
      question: "Como seria a sua rotina ideal de trabalho?",
      options: [
        {
          label: "Coordenar entregas, prazos e o alinhamento entre as pessoas",
          area: "Gestão de Projetos Tech",
          scores: { "Gestão de Projetos Tech": 5, "Produto Digital": 3 },
        },
        {
          label:
            "Validar funcionalidades e garantir qualidade antes do release",
          area: "QA / Testes de Software",
          scores: { "QA / Testes de Software": 5, "Back-end": 1 },
        },
        {
          label:
            "Desenvolver apps mobile com recursos como câmera e notificações",
          area: "Desenvolvimento Mobile",
          scores: { "Desenvolvimento Mobile": 5, "Front-end": 2 },
        },
        {
          label: "Automatizar deploys e monitorar a saúde das aplicações",
          area: "DevOps",
          scores: { DevOps: 5, "Cloud Computing": 3 },
        },
      ],
    },
    {
      id: "int-4",
      category: "Aprendizado",
      question: "Como você prefere aprender algo técnico novo?",
      options: [
        {
          label: "Com exercícios de lógica, APIs e problemas bem definidos",
          area: "Back-end",
          scores: { "Back-end": 5, "QA / Testes de Software": 1 },
        },
        {
          label: "Com datasets, gráficos e perguntas investigativas",
          area: "Ciência de Dados",
          scores: { "Ciência de Dados": 5, "Inteligência Artificial": 2 },
        },
        {
          label: "Com pesquisa, protótipos e feedback de usuários reais",
          area: "UX/UI Design",
          scores: { "UX/UI Design": 5, "Produto Digital": 3 },
        },
        {
          label: "Estudando como um modelo aprende a partir de exemplos",
          area: "Inteligência Artificial",
          scores: { "Inteligência Artificial": 5, "Ciência de Dados": 3 },
        },
      ],
    },
    {
      id: "int-5",
      category: "Impacto",
      question: "Que impacto você gostaria que o seu trabalho tivesse?",
      options: [
        {
          label: "Tornar um produto mais útil e fácil pro usuário final",
          area: "Produto Digital",
          scores: { "Produto Digital": 5, "UX/UI Design": 3 },
        },
        {
          label: "Evitar fraudes, vazamentos e acessos indevidos",
          area: "Cibersegurança",
          scores: { Cibersegurança: 5, "Cloud Computing": 1 },
        },
        {
          label: "Garantir que o sistema fique disponível e escale sob demanda",
          area: "Cloud Computing",
          scores: { "Cloud Computing": 5, DevOps: 3 },
        },
        {
          label: "Entregar o projeto no prazo, com os riscos sob controle",
          area: "Gestão de Projetos Tech",
          scores: { "Gestão de Projetos Tech": 5, "Produto Digital": 2 },
        },
      ],
    },
    {
      id: "int-6",
      category: "Portfólio",
      question: "Qual desses projetos de portfólio você toparia fazer?",
      options: [
        {
          label: "Um plano de testes com casos e uma coleção de smoke tests",
          area: "QA / Testes de Software",
          scores: {
            "QA / Testes de Software": 5,
            "Back-end": 1,
            "Front-end": 1,
          },
        },
        {
          label: "Um app mobile que funciona offline e sincroniza depois",
          area: "Desenvolvimento Mobile",
          scores: { "Desenvolvimento Mobile": 5, "Front-end": 2 },
        },
        {
          label: "Um pipeline que builda, testa e publica o projeto sozinho",
          area: "DevOps",
          scores: { DevOps: 5, "Back-end": 1 },
        },
        {
          label: "Uma landing page responsiva com componentes reutilizáveis",
          area: "Front-end",
          scores: { "Front-end": 5, "UX/UI Design": 1 },
        },
      ],
    },
    {
      id: "int-7",
      category: "Afinidade",
      question: "Com qual matéria-prima você curte mais trabalhar?",
      options: [
        {
          label: "Dados, métricas e o que eles revelam sobre o negócio",
          area: "Ciência de Dados",
          scores: { "Ciência de Dados": 5, "Produto Digital": 2 },
        },
        {
          label: "Pessoas, fluxos e a usabilidade dos produtos",
          area: "UX/UI Design",
          scores: { "UX/UI Design": 5, "Produto Digital": 3 },
        },
        {
          label: "Modelos, previsões e automações inteligentes",
          area: "Inteligência Artificial",
          scores: { "Inteligência Artificial": 5, "Ciência de Dados": 3 },
        },
        {
          label: "Hipóteses, prioridades e decisões de produto",
          area: "Produto Digital",
          scores: { "Produto Digital": 5, "Gestão de Projetos Tech": 3 },
        },
      ],
    },
    {
      id: "int-8",
      category: "Diagnóstico",
      question:
        "Um sistema em produção apresentou falha. O que você quer fazer?",
      options: [
        {
          label: "Verificar se foi tentativa de invasão ou uso indevido",
          area: "Cibersegurança",
          scores: { Cibersegurança: 5, DevOps: 2 },
        },
        {
          label: "Checar se a infraestrutura aguentou o pico de acessos",
          area: "Cloud Computing",
          scores: { "Cloud Computing": 5, DevOps: 3 },
        },
        {
          label: "Comunicar os envolvidos e organizar a resposta do time",
          area: "Gestão de Projetos Tech",
          scores: { "Gestão de Projetos Tech": 5, "Produto Digital": 2 },
        },
        {
          label: "Reproduzir o bug e isolar onde a mudança quebrou",
          area: "QA / Testes de Software",
          scores: { "QA / Testes de Software": 5, "Back-end": 1 },
        },
      ],
    },
    {
      id: "int-9",
      category: "Construção",
      question: "O que você gostaria de construir num projeto mais sério?",
      options: [
        {
          label: "Um app mobile com login, notificações e dados sincronizados",
          area: "Desenvolvimento Mobile",
          scores: { "Desenvolvimento Mobile": 5, "Front-end": 2 },
        },
        {
          label: "Uma esteira de deploy com monitoramento e alertas",
          area: "DevOps",
          scores: { DevOps: 5, "Cloud Computing": 3 },
        },
        {
          label: "Uma interface rica, acessível e com boas microinterações",
          area: "Front-end",
          scores: { "Front-end": 5, "UX/UI Design": 2 },
        },
        {
          label: "Uma API que guarda dados num banco e serve outros sistemas",
          area: "Back-end",
          scores: { "Back-end": 5, "Cloud Computing": 1 },
        },
      ],
    },
    {
      id: "int-10",
      category: "Motivação",
      question: "Que resultado te daria mais satisfação?",
      options: [
        {
          label: "Ver a taxa de erro cair porque a tela ficou mais clara",
          area: "UX/UI Design",
          scores: { "UX/UI Design": 5, "Produto Digital": 3, "Front-end": 1 },
        },
        {
          label: "Ver o modelo acertar a previsão em casos novos",
          area: "Inteligência Artificial",
          scores: { "Inteligência Artificial": 5, "Ciência de Dados": 2 },
        },
        {
          label: "Ver uma métrica de produto subir depois da sua decisão",
          area: "Produto Digital",
          scores: { "Produto Digital": 5, "UX/UI Design": 2 },
        },
        {
          label: "Ver uma brecha fechada antes de virar incidente",
          area: "Cibersegurança",
          scores: { Cibersegurança: 5, "Cloud Computing": 1 },
        },
      ],
    },
    {
      id: "int-11",
      category: "Time",
      question: "Qual responsabilidade você gostaria de assumir no time?",
      options: [
        {
          label: "Cuidar da infraestrutura na nuvem e da escalabilidade",
          area: "Cloud Computing",
          scores: { "Cloud Computing": 5, DevOps: 3 },
        },
        {
          label: "Gerir backlog, prazos e a comunicação entre áreas",
          area: "Gestão de Projetos Tech",
          scores: { "Gestão de Projetos Tech": 5, "Produto Digital": 3 },
        },
        {
          label: "Definir os testes que garantem que nada regrida",
          area: "QA / Testes de Software",
          scores: { "QA / Testes de Software": 5, "Back-end": 1 },
        },
        {
          label: "Ser dono da experiência mobile de ponta a ponta",
          area: "Desenvolvimento Mobile",
          scores: { "Desenvolvimento Mobile": 5, "Front-end": 2 },
        },
      ],
    },
    {
      id: "int-12",
      category: "Investigação",
      question: "Diante de uma falha, o que você prefere investigar primeiro?",
      options: [
        {
          label: "Os logs e métricas do sistema pra achar quando começou",
          area: "DevOps",
          scores: { DevOps: 5, "Cloud Computing": 3 },
        },
        {
          label: "Reproduzir o erro na interface e ver o que o usuário viu",
          area: "Front-end",
          scores: { "Front-end": 5, "QA / Testes de Software": 2 },
        },
        {
          label: "Onde os dados ficam guardados pra achar a regra que quebrou",
          area: "Back-end",
          scores: { "Back-end": 5, "Ciência de Dados": 1 },
        },
        {
          label:
            "Os dados em si, atrás de algo inconsistente ou fora do padrão",
          area: "Ciência de Dados",
          scores: { "Ciência de Dados": 5, "Inteligência Artificial": 2 },
        },
      ],
    },
    {
      id: "int-13",
      category: "Futuro",
      question: "Em que você gostaria de se especializar nos próximos anos?",
      options: [
        {
          label: "IA, modelos e automações inteligentes",
          area: "Inteligência Artificial",
          scores: { "Inteligência Artificial": 5, "Ciência de Dados": 3 },
        },
        {
          label: "Produtos digitais usados por muita gente",
          area: "Produto Digital",
          scores: { "Produto Digital": 5, "UX/UI Design": 2 },
        },
        {
          label: "Segurança ofensiva ou defensiva de sistemas",
          area: "Cibersegurança",
          scores: { Cibersegurança: 5, "Cloud Computing": 1 },
        },
        {
          label: "Arquitetura em nuvem e sistemas escaláveis",
          area: "Cloud Computing",
          scores: { "Cloud Computing": 5, DevOps: 3 },
        },
      ],
    },
    {
      id: "int-14",
      category: "Colaboração",
      question: "Com qual tipo de colaboração você se identifica mais?",
      options: [
        {
          label: "Alinhar lideranças, clientes e times diferentes",
          area: "Gestão de Projetos Tech",
          scores: { "Gestão de Projetos Tech": 5, "Produto Digital": 3 },
        },
        {
          label: "Trabalhar junto do dev garantindo a qualidade do que sai",
          area: "QA / Testes de Software",
          scores: { "QA / Testes de Software": 5, "Back-end": 1 },
        },
        {
          label:
            "Fazer dupla com design pra entregar a melhor experiência mobile",
          area: "Desenvolvimento Mobile",
          scores: { "Desenvolvimento Mobile": 5, "Front-end": 2 },
        },
        {
          label: "Dar autonomia ao time automatizando a infraestrutura",
          area: "DevOps",
          scores: { DevOps: 5, "Cloud Computing": 2 },
        },
      ],
    },
    {
      id: "int-15",
      category: "Estilo",
      question: "Qual frase combina mais com o seu jeito de trabalhar?",
      options: [
        {
          label: "Prefiro ciclos curtos, feedback rápido e resultado visível",
          area: "Front-end",
          scores: { "Front-end": 5, "UX/UI Design": 2 },
        },
        {
          label: "Prefiro construir algo robusto, mesmo que leve mais tempo",
          area: "Back-end",
          scores: { "Back-end": 5, "Cloud Computing": 1 },
        },
        {
          label: "Prefiro investigar com calma antes de afirmar uma resposta",
          area: "Ciência de Dados",
          scores: { "Ciência de Dados": 5, "Inteligência Artificial": 2 },
        },
        {
          label: "Prefiro entender as pessoas antes de propor a solução",
          area: "UX/UI Design",
          scores: { "UX/UI Design": 5, "Produto Digital": 3 },
        },
      ],
    },
  ],
  avancado: [
    {
      id: "adv-1",
      category: "Interesse",
      question: "Qual tipo de desafio técnico te dá mais energia?",
      options: [
        {
          label: "Otimizar renderização e gerenciar state numa SPA complexa",
          area: "Front-end",
          scores: {
            "Front-end": 5,
            "UX/UI Design": 1,
            "Desenvolvimento Mobile": 1,
          },
        },
        {
          label: "Modelar domínio, desenhar APIs e lidar com concorrência",
          area: "Back-end",
          scores: { "Back-end": 5, "Ciência de Dados": 1 },
        },
        {
          label:
            "Fazer feature engineering e análise estatística numa base grande",
          area: "Ciência de Dados",
          scores: { "Ciência de Dados": 5, "Inteligência Artificial": 3 },
        },
        {
          label: "Rodar testes de usabilidade e evoluir o design system",
          area: "UX/UI Design",
          scores: { "UX/UI Design": 5, "Produto Digital": 3 },
        },
      ],
    },
    {
      id: "adv-2",
      category: "Problema",
      question: "Qual problema você atacaria com mais gosto?",
      options: [
        {
          label: "Lidar com overfitting e tunar hiperparâmetros de um modelo",
          area: "Inteligência Artificial",
          scores: { "Inteligência Artificial": 5, "Ciência de Dados": 3 },
        },
        {
          label: "Definir métricas, hipóteses e rodar discovery de produto",
          area: "Produto Digital",
          scores: { "Produto Digital": 5, "UX/UI Design": 2 },
        },
        {
          label: "Fazer threat modeling e hardening da superfície de ataque",
          area: "Cibersegurança",
          scores: { Cibersegurança: 5, "Cloud Computing": 1 },
        },
        {
          label: "Desenhar arquitetura escalável e resiliente na nuvem",
          area: "Cloud Computing",
          scores: { "Cloud Computing": 5, DevOps: 3 },
        },
      ],
    },
    {
      id: "adv-3",
      category: "Rotina",
      question: "Como seria a rotina técnica que você prefere?",
      options: [
        {
          label: "Gerir dependências, roadmap e métricas de entrega do time",
          area: "Gestão de Projetos Tech",
          scores: { "Gestão de Projetos Tech": 5, "Produto Digital": 3 },
        },
        {
          label: "Desenhar estratégia de testes e automação no pipeline",
          area: "QA / Testes de Software",
          scores: { "QA / Testes de Software": 5, "Back-end": 1 },
        },
        {
          label: "Otimizar performance mobile e o ciclo de release nas lojas",
          area: "Desenvolvimento Mobile",
          scores: { "Desenvolvimento Mobile": 5, "Front-end": 2 },
        },
        {
          label: "Manter CI/CD, IaC e observabilidade da plataforma",
          area: "DevOps",
          scores: { DevOps: 5, "Cloud Computing": 3 },
        },
      ],
    },
    {
      id: "adv-4",
      category: "Aprendizado",
      question: "Como você prefere aprofundar um tema técnico?",
      options: [
        {
          label: "Lendo specs, RFCs e implementando provas de conceito",
          area: "Back-end",
          scores: { "Back-end": 5, "QA / Testes de Software": 1 },
        },
        {
          label: "Explorando datasets, notebooks e validação estatística",
          area: "Ciência de Dados",
          scores: { "Ciência de Dados": 5, "Inteligência Artificial": 2 },
        },
        {
          label: "Conduzindo pesquisa, heurísticas e testes com usuários",
          area: "UX/UI Design",
          scores: { "UX/UI Design": 5, "Produto Digital": 3 },
        },
        {
          label: "Estudando papers, arquiteturas de modelo e fine-tuning",
          area: "Inteligência Artificial",
          scores: { "Inteligência Artificial": 5, "Ciência de Dados": 3 },
        },
      ],
    },
    {
      id: "adv-5",
      category: "Impacto",
      question: "Que impacto técnico você quer ter?",
      options: [
        {
          label: "Mover métricas de produto com experimentos bem desenhados",
          area: "Produto Digital",
          scores: {
            "Produto Digital": 5,
            "UX/UI Design": 3,
            "Ciência de Dados": 1,
          },
        },
        {
          label: "Reduzir risco com defesa em profundidade e zero trust",
          area: "Cibersegurança",
          scores: { Cibersegurança: 5, "Cloud Computing": 1 },
        },
        {
          label: "Garantir alta disponibilidade e otimizar custo (FinOps)",
          area: "Cloud Computing",
          scores: { "Cloud Computing": 5, DevOps: 3 },
        },
        {
          label: "Destravar entregas gerindo riscos e dependências críticas",
          area: "Gestão de Projetos Tech",
          scores: { "Gestão de Projetos Tech": 5, "Produto Digital": 2 },
        },
      ],
    },
    {
      id: "adv-6",
      category: "Portfólio",
      question: "Qual desses projetos técnicos você curtiria liderar?",
      options: [
        {
          label: "Suite de testes E2E com Playwright rodando no pipeline",
          area: "QA / Testes de Software",
          scores: {
            "QA / Testes de Software": 5,
            "Back-end": 1,
            "Front-end": 1,
          },
        },
        {
          label: "App nativo com build automatizado e feature flags",
          area: "Desenvolvimento Mobile",
          scores: { "Desenvolvimento Mobile": 5, "Front-end": 2 },
        },
        {
          label: "Pipeline de CI/CD com IaC, rollback e observabilidade",
          area: "DevOps",
          scores: { DevOps: 5, "Back-end": 1 },
        },
        {
          label: "Design system com componentes acessíveis e tree-shaking",
          area: "Front-end",
          scores: { "Front-end": 5, "UX/UI Design": 2 },
        },
      ],
    },
    {
      id: "adv-7",
      category: "Afinidade",
      question: "Com qual camada você prefere trabalhar?",
      options: [
        {
          label: "Pipelines de dados, modelagem e análise estatística",
          area: "Ciência de Dados",
          scores: { "Ciência de Dados": 5, "Produto Digital": 2 },
        },
        {
          label: "Arquitetura de informação, heurísticas e usabilidade",
          area: "UX/UI Design",
          scores: { "UX/UI Design": 5, "Produto Digital": 3 },
        },
        {
          label: "Modelos, embeddings e MLOps em produção",
          area: "Inteligência Artificial",
          scores: { "Inteligência Artificial": 5, "Ciência de Dados": 3 },
        },
        {
          label:
            "Estratégia de produto, métricas e priorização baseada em dados",
          area: "Produto Digital",
          scores: {
            "Produto Digital": 5,
            "Gestão de Projetos Tech": 2,
            "Ciência de Dados": 1,
          },
        },
      ],
    },
    {
      id: "adv-8",
      category: "Diagnóstico",
      question: "Incidente em produção. Qual frente você assume?",
      options: [
        {
          label: "Resposta a incidente, análise de logs e contenção da ameaça",
          area: "Cibersegurança",
          scores: { Cibersegurança: 5, DevOps: 2 },
        },
        {
          label: "Avaliar capacidade, auto scaling e tolerância a falhas",
          area: "Cloud Computing",
          scores: { "Cloud Computing": 5, DevOps: 3 },
        },
        {
          label: "Coordenar o war room e a comunicação com stakeholders",
          area: "Gestão de Projetos Tech",
          scores: { "Gestão de Projetos Tech": 5, "Produto Digital": 2 },
        },
        {
          label: "Reproduzir, isolar a regressão e cobrir com teste",
          area: "QA / Testes de Software",
          scores: { "QA / Testes de Software": 5, "Back-end": 1 },
        },
      ],
    },
    {
      id: "adv-9",
      category: "Construção",
      question: "O que você gostaria de arquitetar?",
      options: [
        {
          label: "App mobile com offline-first e sincronização de estado",
          area: "Desenvolvimento Mobile",
          scores: { "Desenvolvimento Mobile": 5, "Front-end": 2 },
        },
        {
          label: "Plataforma interna com self-service e deploy contínuo",
          area: "DevOps",
          scores: { DevOps: 5, "Cloud Computing": 3 },
        },
        {
          label: "Front-end com SSR, code splitting e métricas de web vitals",
          area: "Front-end",
          scores: { "Front-end": 5, "UX/UI Design": 2 },
        },
        {
          label: "Serviços com mensageria, idempotência e cache distribuído",
          area: "Back-end",
          scores: { "Back-end": 5, "Cloud Computing": 1 },
        },
      ],
    },
    {
      id: "adv-10",
      category: "Motivação",
      question: "Que tipo de resultado técnico te satisfaz mais?",
      options: [
        {
          label: "Subir a usabilidade comprovada por teste com usuários",
          area: "UX/UI Design",
          scores: { "UX/UI Design": 5, "Produto Digital": 3, "Front-end": 1 },
        },
        {
          label: "Boas métricas de precisão e recall em dados de validação",
          area: "Inteligência Artificial",
          scores: { "Inteligência Artificial": 5, "Ciência de Dados": 2 },
        },
        {
          label: "Um experimento A/B com significância estatística clara",
          area: "Produto Digital",
          scores: { "Produto Digital": 5, "Ciência de Dados": 2 },
        },
        {
          label: "Fechar um vetor de ataque antes da exploração",
          area: "Cibersegurança",
          scores: { Cibersegurança: 5, "Cloud Computing": 1 },
        },
      ],
    },
    {
      id: "adv-11",
      category: "Time",
      question: "Qual responsabilidade técnica você assumiria?",
      options: [
        {
          label: "Arquitetura multi-região, IaC e estratégia de custos",
          area: "Cloud Computing",
          scores: { "Cloud Computing": 5, DevOps: 3 },
        },
        {
          label: "Roadmap técnico, gestão de riscos e de dependências",
          area: "Gestão de Projetos Tech",
          scores: { "Gestão de Projetos Tech": 5, "Produto Digital": 3 },
        },
        {
          label: "Estratégia de qualidade, cobertura e quality gates",
          area: "QA / Testes de Software",
          scores: { "QA / Testes de Software": 5, "Back-end": 1 },
        },
        {
          label: "Performance, observabilidade e release do app mobile",
          area: "Desenvolvimento Mobile",
          scores: { "Desenvolvimento Mobile": 5, "Front-end": 2 },
        },
      ],
    },
    {
      id: "adv-12",
      category: "Investigação",
      question: "Onde você mergulha primeiro num problema difícil?",
      options: [
        {
          label: "Traces, métricas e logs pra correlacionar a causa raiz",
          area: "DevOps",
          scores: { DevOps: 5, "Cloud Computing": 3 },
        },
        {
          label: "Reproduzir no client e inspecionar render, rede e state",
          area: "Front-end",
          scores: { "Front-end": 5, "QA / Testes de Software": 2 },
        },
        {
          label: "Camada de dados e regras pra achar a invariante quebrada",
          area: "Back-end",
          scores: { "Back-end": 5, "Ciência de Dados": 1 },
        },
        {
          label: "Distribuição dos dados, atrás de drift ou anomalia",
          area: "Ciência de Dados",
          scores: { "Ciência de Dados": 5, "Inteligência Artificial": 2 },
        },
      ],
    },
    {
      id: "adv-13",
      category: "Futuro",
      question: "Em qual especialização você quer chegar na ponta?",
      options: [
        {
          label: "Engenharia de IA, MLOps e modelos em produção",
          area: "Inteligência Artificial",
          scores: { "Inteligência Artificial": 5, "Ciência de Dados": 3 },
        },
        {
          label: "Liderança de produto orientada a dados",
          area: "Produto Digital",
          scores: {
            "Produto Digital": 5,
            "UX/UI Design": 2,
            "Ciência de Dados": 1,
          },
        },
        {
          label: "Red team, blue team ou arquitetura de segurança",
          area: "Cibersegurança",
          scores: { Cibersegurança: 5, "Cloud Computing": 1 },
        },
        {
          label: "Arquitetura cloud-native e plataformas escaláveis",
          area: "Cloud Computing",
          scores: { "Cloud Computing": 5, DevOps: 3 },
        },
      ],
    },
    {
      id: "adv-14",
      category: "Colaboração",
      question: "Que papel de articulação técnica combina com você?",
      options: [
        {
          label:
            "Alinhar stakeholders técnicos e de negócio em torno do roadmap",
          area: "Gestão de Projetos Tech",
          scores: { "Gestão de Projetos Tech": 5, "Produto Digital": 3 },
        },
        {
          label: "Definir critérios de qualidade junto de dev e produto",
          area: "QA / Testes de Software",
          scores: { "QA / Testes de Software": 5, "Back-end": 1 },
        },
        {
          label: "Fazer a ponte entre design e engenharia mobile",
          area: "Desenvolvimento Mobile",
          scores: { "Desenvolvimento Mobile": 5, "Front-end": 2 },
        },
        {
          label: "Promover cultura DevOps e plataformas self-service",
          area: "DevOps",
          scores: { DevOps: 5, "Cloud Computing": 2 },
        },
      ],
    },
    {
      id: "adv-15",
      category: "Estilo",
      question: "Qual abordagem reflete melhor o seu jeito?",
      options: [
        {
          label: "Iterar rápido com feedback visível e métricas de front",
          area: "Front-end",
          scores: { "Front-end": 5, "UX/UI Design": 2 },
        },
        {
          label: "Priorizar robustez, consistência e contratos bem definidos",
          area: "Back-end",
          scores: { "Back-end": 5, "Cloud Computing": 1 },
        },
        {
          label: "Decidir com base em evidência e validação estatística",
          area: "Ciência de Dados",
          scores: { "Ciência de Dados": 5, "Inteligência Artificial": 2 },
        },
        {
          label: "Partir do problema do usuário antes de qualquer solução",
          area: "UX/UI Design",
          scores: { "UX/UI Design": 5, "Produto Digital": 3 },
        },
      ],
    },
  ],
};

export const projectHelpVideos: Record<string, { title: string; url: string }> =
  {
    "landing-page-pessoal": {
      title: "Como criar uma landing page do zero",
      url: "https://www.youtube.com/results?search_query=criar+landing+page+html+css+iniciante",
    },
    "todo-list": {
      title: "To-do list com JavaScript para iniciantes",
      url: "https://www.youtube.com/results?search_query=todo+list+javascript+iniciante",
    },
    default: {
      title: "Como planejar projeto iniciante para portfólio",
      url: "https://www.youtube.com/results?search_query=projeto+iniciante+portfolio+programacao",
    },
  };

export const careerInstitutes = [
  {
    name: "PMI",
    desc: "Comunidade para gestão de projetos e certificações.",
    url: "https://www.pmi.org",
  },
  {
    name: "SBC",
    desc: "Sociedade Brasileira de Computação, eventos e capítulos.",
    url: "https://www.sbc.org.br",
  },
  {
    name: "Interaction Design Foundation",
    desc: "Comunidade e estudos para UX/Product Design.",
    url: "https://www.interaction-design.org",
  },
];

export const roadmapPlans = [
  {
    days: "10 dias",
    depth: "Essencial",
    focus: "Entender a área, fazer um curso curto e publicar uma anotação.",
  },
  {
    days: "20 dias",
    depth: "Prático",
    focus: "Criar um mini projeto guiado e registrar aprendizados no GitHub.",
  },
  {
    days: "30 dias",
    depth: "Portfólio",
    focus: "Publicar projeto explicável com README, prints e post no LinkedIn.",
  },
  {
    days: "60 dias",
    depth: "Profundidade",
    focus: "Repetir o ciclo, comparar ferramentas e entrar em comunidade.",
  },
];

export interface CollegeSuggestion {
  city: string;
  name: string;
  advantages: string[];
  /** Sigla do estado (UF). `null` quando a sugestão vale para qualquer UF (ex.: EAD nacional). */
  uf: string | null;
  nacional?: boolean;
}

/** 26 estados + Distrito Federal, ordenados pelo nome do estado. */
export const brazilianStates = [
  { uf: "AC", name: "Acre" },
  { uf: "AL", name: "Alagoas" },
  { uf: "AP", name: "Amapá" },
  { uf: "AM", name: "Amazonas" },
  { uf: "BA", name: "Bahia" },
  { uf: "CE", name: "Ceará" },
  { uf: "DF", name: "Distrito Federal" },
  { uf: "ES", name: "Espírito Santo" },
  { uf: "GO", name: "Goiás" },
  { uf: "MA", name: "Maranhão" },
  { uf: "MT", name: "Mato Grosso" },
  { uf: "MS", name: "Mato Grosso do Sul" },
  { uf: "MG", name: "Minas Gerais" },
  { uf: "PA", name: "Pará" },
  { uf: "PB", name: "Paraíba" },
  { uf: "PR", name: "Paraná" },
  { uf: "PE", name: "Pernambuco" },
  { uf: "PI", name: "Piauí" },
  { uf: "RJ", name: "Rio de Janeiro" },
  { uf: "RN", name: "Rio Grande do Norte" },
  { uf: "RS", name: "Rio Grande do Sul" },
  { uf: "RO", name: "Rondônia" },
  { uf: "RR", name: "Roraima" },
  { uf: "SC", name: "Santa Catarina" },
  { uf: "SP", name: "São Paulo" },
  { uf: "SE", name: "Sergipe" },
  { uf: "TO", name: "Tocantins" },
] as const;

export const collegeSuggestions: CollegeSuggestion[] = [
  {
    city: "São Paulo",
    name: "FATEC",
    advantages: ["Opções públicas", "Foco prático", "Boa presença regional"],
    uf: "SP",
  },
  {
    city: "Rio de Janeiro",
    name: "CEFET/RJ",
    advantages: [
      "Tradição técnica",
      "Pesquisa aplicada",
      "Boa base de engenharia",
    ],
    uf: "RJ",
  },
  {
    city: "Belo Horizonte",
    name: "UFMG",
    advantages: [
      "Universidade pública",
      "Pesquisa forte",
      "Ecossistema tech local",
    ],
    uf: "MG",
  },
  {
    city: "Remoto",
    name: "Universidade Aberta do Brasil",
    advantages: [
      "Opções EAD",
      "Polos regionais",
      "Boa opção para começar pesquisando",
    ],
    uf: null,
    nacional: true,
  },
];

/* ===========================================================================
 * QUIZ: Objetivos, cores por área e quiz de tecnologia
 * ======================================================================== */

/**
 * Objetivo do usuário. Vira a tela de entrada do quiz e roteia o fluxo:
 * - kind "area": usa o motor de áreas (quizByLevel) e cai no resultado de área.
 * - kind "tech": usa o techQuiz dedicado e cai no resultado de tecnologia.
 */
export type QuizObjective =
  | "descobrir"
  | "mudar"
  | "comecar-do-zero"
  | "escolher-tecnologia";

export interface ObjectiveTrack {
  id: QuizObjective;
  kind: "area" | "tech";
  icon: LucideIcon;
  emoji: string;
  label: string;
  description: string;
  accent: string;
  introHeadline: string;
  introSub: string;
  /** Nível sugerido (ex: começar-do-zero parte de iniciante). */
  suggestedLevel?: QuizLevel;
}

export const objectiveTracks: ObjectiveTrack[] = [
  {
    id: "descobrir",
    kind: "area",
    icon: Compass,
    emoji: "🧭",
    label: "Descobrir minha área",
    description: "Quero achar a área da tecnologia que mais combina comigo.",
    accent: "#7c3aed",
    introHeadline: "Vamos achar a área de tech com a sua cara",
    introSub:
      "Você responde perguntas rápidas sobre o que curte e a gente cruza com as áreas da tecnologia pra mostrar onde você se encaixa melhor.",
  },
  {
    id: "comecar-do-zero",
    kind: "area",
    icon: Sprout,
    emoji: "🌱",
    label: "Começar do zero",
    description: "Nunca mexi com tecnologia e quero saber por onde começar.",
    accent: "#15803d",
    introHeadline: "Todo mundo começa em algum lugar. Bora achar o seu",
    introSub:
      "Sem termo técnico e sem pressão. A gente parte do zero e te mostra a área e os primeiros passos que mais fazem sentido pra você.",
    suggestedLevel: "iniciante",
  },
  {
    id: "mudar",
    kind: "area",
    icon: RefreshCw,
    emoji: "🔄",
    label: "Mudar de área",
    description: "Já trabalho (em tech ou fora) e quero migrar pra outra área.",
    accent: "#db2777",
    introHeadline: "Bora encontrar o seu próximo passo",
    introSub:
      "A gente leva em conta o que você já sabe e aponta as áreas pra onde a sua transição rende mais.",
  },
  {
    id: "escolher-tecnologia",
    kind: "tech",
    icon: Boxes,
    emoji: "🧰",
    label: "Escolher uma tecnologia",
    description:
      "Já sei mais ou menos a direção e quero focar numa linguagem ou stack.",
    accent: "#0e7490",
    introHeadline: "Vamos escolher a sua próxima tecnologia",
    introSub:
      "Responde algumas perguntas sobre o que você quer construir e a gente recomenda uma tecnologia pra focar agora.",
  },
];

export function getObjectiveTrack(id: QuizObjective | null): ObjectiveTrack {
  return objectiveTracks.find((t) => t.id === id) ?? objectiveTracks[0];
}

/**
 * Cor de acento por área (espelha as classes tag-* do index.css). Usada para
 * colorir cards, barras e o hero do resultado conforme a área.
 */
export const AREA_ACCENT: Record<string, string> = {
  "Front-end": "#7c3aed",
  "Back-end": "#15803d",
  "Full-stack": "#5b21b6",
  "Ciência de Dados": "#d97706",
  "UX/UI Design": "#db2777",
  "Inteligência Artificial": "#6d28d9",
  "Produto Digital": "#c026d3",
  Cibersegurança: "#166534",
  "Cloud Computing": "#0369a1",
  "Gestão de Projetos Tech": "#4338ca",
  "QA / Testes de Software": "#ca8a04",
  "Desenvolvimento Mobile": "#ea580c",
  DevOps: "#0e7490",
};

export function getAreaAccent(nome: string): string {
  return AREA_ACCENT[nome] ?? "#7c3aed";
}

/* ----------------------- Quiz de tecnologia (kind: tech) ------------------ */

export interface TechRecommendation {
  /** Chave usada também como `area` e nos `scores` das opções do techQuiz. */
  key: string;
  label: string;
  emoji: string;
  accent: string;
  tagline: string;
  why: string;
  startHere: string[];
  /** slug da área relacionada em areasTI, para o CTA do resultado. */
  areaSlug: string;
}

export const techRecommendations: TechRecommendation[] = [
  {
    key: "JavaScript e React",
    label: "JavaScript + React",
    emoji: "🎨",
    accent: "#7c3aed",
    tagline: "A porta de entrada mais rápida pro desenvolvimento web.",
    why: "Você curte ver o resultado na tela, na hora, e quer entrar logo no mercado web. JavaScript roda em todo navegador e o React é o framework mais pedido em vagas de front-end.",
    startHere: [
      "HTML e CSS pra estruturar e estilizar páginas",
      "JavaScript do zero (lógica, DOM, eventos)",
      "React pra montar interfaces com componentes",
    ],
    areaSlug: "frontend",
  },
  {
    key: "Python",
    label: "Python",
    emoji: "🐍",
    accent: "#15803d",
    tagline: "A linguagem mais versátil pra quem quer manter portas abertas.",
    why: "Você quer uma primeira linguagem fácil de ler e que sirva pra muita coisa. Python é ótimo pra back-end, automação, dados e IA, então te dá liberdade pra migrar de foco depois.",
    startHere: [
      "Lógica de programação com Python",
      "Manipular dados e arquivos",
      "Escolher um caminho: web (Django/FastAPI), dados ou IA",
    ],
    areaSlug: "backend",
  },
  {
    key: "SQL e Dados",
    label: "SQL + Dados",
    emoji: "📊",
    accent: "#d97706",
    tagline: "A base de quem trabalha perto de números e decisões.",
    why: "Você gosta de achar padrões e gerar insights. SQL é a habilidade número um pra trabalhar com dados, e com ela você já constrói relatórios e dashboards que apoiam decisões.",
    startHere: [
      "SQL (SELECT, JOIN, agregações)",
      "Planilhas e fundamentos de análise",
      "Uma ferramenta de BI (Power BI ou Looker Studio)",
    ],
    areaSlug: "dados",
  },
  {
    key: "Node.js",
    label: "Node.js",
    emoji: "⚙️",
    accent: "#166534",
    tagline: "Back-end em JavaScript, do mesmo idioma do front.",
    why: "Você curte construir a lógica e as regras por trás dos sistemas e quer aproveitar o JavaScript dos dois lados. Com Node você cria APIs e serviços usando a mesma linguagem do front-end.",
    startHere: [
      "JavaScript sólido (assíncrono, módulos)",
      "Node.js + Express pra criar APIs",
      "Banco de dados e autenticação",
    ],
    areaSlug: "backend",
  },
  {
    key: "Flutter / React Native",
    label: "Flutter / React Native",
    emoji: "📱",
    accent: "#ea580c",
    tagline: "Pra quem quer focar em apps de celular desde já.",
    why: "Seu foco é o celular. Com Flutter ou React Native você cria apps que rodam em Android e iOS a partir de uma base de código só, indo direto pro que te empolga.",
    startHere: [
      "Lógica de programação (Dart pra Flutter ou JS pra RN)",
      "Layout e navegação de telas",
      "Publicar um app pequeno nas lojas",
    ],
    areaSlug: "mobile",
  },
  {
    key: "Linux, Docker e Cloud",
    label: "Linux, Docker e Cloud",
    emoji: "☁️",
    accent: "#0e7490",
    tagline: "Pra quem curte automação, infraestrutura e escala.",
    why: "Você gosta de manter as coisas no ar, automatizar e mexer com servidores. Dominar Linux, Docker e uma nuvem abre as portas de Cloud e DevOps.",
    startHere: [
      "Linux e linha de comando",
      "Docker pra empacotar aplicações",
      "Uma nuvem (AWS, Azure ou GCP) e CI/CD",
    ],
    areaSlug: "devops",
  },
];

export function getTechRecommendation(key: string): TechRecommendation {
  return (
    techRecommendations.find((t) => t.key === key) ?? techRecommendations[0]
  );
}

/**
 * Quiz de tecnologia (objetivo "escolher-tecnologia"). Reaproveita o shape de
 * QuizOption: `area` guarda a chave da tecnologia e `scores` aponta para as
 * chaves de techRecommendations. Sem nível, fluxo direto e curto.
 */
export const TECH_QUESTION_COUNT = 7;

export const techQuiz: QuizQuestion[] = [
  {
    id: "tech-1",
    category: "Construção",
    question: "O que você mais quer aprender a construir?",
    options: [
      {
        label: "Sites e telas que as pessoas usam no navegador",
        area: "JavaScript e React",
        scores: { "JavaScript e React": 5, "Flutter / React Native": 1 },
      },
      {
        label: "Aplicativos de celular",
        area: "Flutter / React Native",
        scores: { "Flutter / React Native": 5, "JavaScript e React": 1 },
      },
      {
        label: "Sistemas, APIs e regras que rodam por trás",
        area: "Node.js",
        scores: { "Node.js": 5, Python: 2 },
      },
      {
        label: "Análises, relatórios e gráficos a partir de dados",
        area: "SQL e Dados",
        scores: { "SQL e Dados": 5, Python: 2 },
      },
    ],
  },
  {
    id: "tech-2",
    category: "Recompensa",
    question: "Como você prefere ver o resultado do que faz?",
    options: [
      {
        label: "Na tela, visual, na hora",
        area: "JavaScript e React",
        scores: { "JavaScript e React": 5, "Flutter / React Native": 2 },
      },
      {
        label: "Num número ou gráfico que revela algo novo",
        area: "SQL e Dados",
        scores: { "SQL e Dados": 5, Python: 2 },
      },
      {
        label: "Num sistema funcionando e respondendo pedidos",
        area: "Node.js",
        scores: { "Node.js": 5, Python: 1 },
      },
      {
        label: "Numa infra no ar, estável e automatizada",
        area: "Linux, Docker e Cloud",
        scores: { "Linux, Docker e Cloud": 5 },
      },
    ],
  },
  {
    id: "tech-3",
    category: "Estilo",
    question: "Qual frase mais combina com você agora?",
    options: [
      {
        label: "Quero uma linguagem fácil de ler pra aprender o básico",
        area: "Python",
        scores: { Python: 5, "SQL e Dados": 1 },
      },
      {
        label: "Quero algo que sirva pra web inteira, do front ao back",
        area: "JavaScript e React",
        scores: { "JavaScript e React": 4, "Node.js": 3 },
      },
      {
        label: "Curto mexer com terminal, automação e servidores",
        area: "Linux, Docker e Cloud",
        scores: { "Linux, Docker e Cloud": 5 },
      },
      {
        label: "Quero focar em celular desde já",
        area: "Flutter / React Native",
        scores: { "Flutter / React Native": 5 },
      },
    ],
  },
  {
    id: "tech-4",
    category: "Afinidade",
    question: "Quanto de matemática e estatística te anima?",
    options: [
      {
        label: "Bastante, curto números e padrões",
        area: "SQL e Dados",
        scores: { "SQL e Dados": 4, Python: 3 },
      },
      {
        label: "Um pouco, se for aplicado a algo prático",
        area: "Python",
        scores: { Python: 4, "Node.js": 1 },
      },
      {
        label: "Prefiro lógica e construção a estatística",
        area: "Node.js",
        scores: { "Node.js": 4, "JavaScript e React": 2 },
      },
      {
        label: "Prefiro a parte visual e de experiência",
        area: "JavaScript e React",
        scores: { "JavaScript e React": 5, "Flutter / React Native": 2 },
      },
    ],
  },
  {
    id: "tech-5",
    category: "Mercado",
    question: "Onde você se imagina trabalhando primeiro?",
    options: [
      {
        label: "Produtos web em startups e agências",
        area: "JavaScript e React",
        scores: { "JavaScript e React": 4, "Node.js": 2 },
      },
      {
        label: "Times de dados e BI dentro de empresas",
        area: "SQL e Dados",
        scores: { "SQL e Dados": 5 },
      },
      {
        label: "Criando apps de celular",
        area: "Flutter / React Native",
        scores: { "Flutter / React Native": 5 },
      },
      {
        label: "Infra, nuvem e operações (DevOps)",
        area: "Linux, Docker e Cloud",
        scores: { "Linux, Docker e Cloud": 5 },
      },
    ],
  },
  {
    id: "tech-6",
    category: "Projeto",
    question: "Qual primeiro projeto te empolga mais?",
    options: [
      {
        label: "Uma página ou app web bem interativo",
        area: "JavaScript e React",
        scores: { "JavaScript e React": 5 },
      },
      {
        label: "Um dashboard que cruza e mostra dados",
        area: "SQL e Dados",
        scores: { "SQL e Dados": 5, Python: 1 },
      },
      {
        label: "Uma API que outros apps consomem",
        area: "Node.js",
        scores: { "Node.js": 5, Python: 1 },
      },
      {
        label: "Um app de celular publicado na loja",
        area: "Flutter / React Native",
        scores: { "Flutter / React Native": 5 },
      },
    ],
  },
  {
    id: "tech-7",
    category: "Objetivo",
    question: "Qual é o seu maior objetivo agora?",
    options: [
      {
        label: "Entrar rápido no mercado de desenvolvimento web",
        area: "JavaScript e React",
        scores: { "JavaScript e React": 4, "Node.js": 2 },
      },
      {
        label: "Versatilidade pra migrar pra dados ou IA depois",
        area: "Python",
        scores: { Python: 5 },
      },
      {
        label: "Trabalhar perto do negócio e das decisões",
        area: "SQL e Dados",
        scores: { "SQL e Dados": 4 },
      },
      {
        label: "Mexer com escala, nuvem e automação",
        area: "Linux, Docker e Cloud",
        scores: { "Linux, Docker e Cloud": 5 },
      },
    ],
  },
];
