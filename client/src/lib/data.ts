// BORA NA TECH? Central Data Store
// All static content for the platform

import type { LucideIcon } from "lucide-react";
import {
  Layout,
  Server,
  BarChart3,
  Palette,
  Brain,
  Target,
  Shield,
  Cloud,
  ClipboardList,
  BadgeCheck,
  Smartphone,
  GitBranch,
  Workflow,
  Database,
  Activity,
  Gamepad2,
  LineChart,
  Boxes,
  Network,
  FileSearch,
  Gauge,
  Blocks,
  Cpu,
  HardDrive,
  Headphones,
  Bot,
} from "lucide-react";

export interface SubArea {
  slug: string;
  nome: string;
  descricaoCurta?: string;
  descricaoCompleta?: string;
  oQueFaz?: string;
  diferencasDaAreaMae?: string;
  habilidadesEspecificas?: string[];
  ferramentasEspecificas?: string[];
  cargos?: string[];
  faixaSalarial?: string;
  dificuldade?: number;
  cursosGratuitos?: string[];
  projetosSugeridos?: string[];
  roadmapEspecifico?: string[];
  dicasIniciais?: string;
}

export interface Livro {
  titulo: string;
  autor: string;
  porque: string;
  nivel: "Iniciante" | "Intermediário" | "Avançado";
  ano?: number;
  gratuito?: boolean;
  link?: string;
}

export interface AreaTI {
  id: string;
  nome: string;
  slug: string;
  icon: LucideIcon;
  tagClass: string;
  descricaoCurta: string;
  descricaoCompleta: string;
  oQueFaz: string;
  tarefasDiarias: string[];
  perfilIndicado: string;
  habilidades: string[];
  ferramentas: string[];
  dificuldade: number;
  cargos: string[];
  faixaSalarial: string;
  salarios?: { nivel: string; faixa: string }[];
  cursosGratuitos: string[];
  roadmapInicial: string[];
  projetos: string[];
  termosEssenciais: string[];
  dicasIniciais: string;
  roadmapStatus?: "available" | "coming-soon";
  requiresGraduation?: "obrigatorio" | "recomendado" | "opcional";
  tempoMedioFormacao?: string;
  crescimentoMercado?: "alto" | "medio" | "estavel" | "baixo";
  subareas?: SubArea[];
  faculdadesRelacionadas?: string[];
  livros?: Livro[];
}

const baseAreasTI: AreaTI[] = [
  {
    id: "frontend",
    nome: "Front-end",
    slug: "frontend",
    icon: Layout,
    tagClass: "tag-frontend",
    descricaoCurta: "Cria tudo que você vê e interage em sites e aplicativos.",
    descricaoCompleta:
      "O desenvolvedor front-end é responsável por construir a interface visual dos produtos digitais, tudo que o usuário vê, clica, lê e interage. Trabalha com HTML, CSS e JavaScript para transformar designs em páginas funcionais e bonitas.",
    oQueFaz:
      "Transforma designs em código, cria botões, menus, formulários, animações e garante que o site funcione bem em celular, tablet e computador.",
    tarefasDiarias: [
      "Criar páginas HTML e estilizar com CSS",
      "Programar interações com JavaScript",
      "Adaptar o layout para diferentes telas (responsividade)",
      "Trabalhar com frameworks como React ou Vue",
      "Colaborar com designers e back-end",
    ],
    perfilIndicado:
      "Gosta de criatividade e de ver resultados visuais rápidos. Tem paciência para detalhes e curte estética.",
    habilidades: [
      "HTML e CSS",
      "JavaScript",
      "React ou Vue",
      "Design responsivo",
      "Git e GitHub",
    ],
    ferramentas: [
      "VS Code",
      "Figma (para entender designs)",
      "Chrome DevTools",
      "Git",
      "Node.js",
    ],
    dificuldade: 3,
    cargos: [
      "Desenvolvedor Front-end Júnior",
      "Desenvolvedor React",
      "Engenheiro de Interface",
      "UI Developer",
    ],
    faixaSalarial: "R$ 2.500 a R$ 5.000 (estágio/trainee/júnior)",
    cursosGratuitos: [
      "Curso em Vídeo: HTML, CSS e JavaScript",
      "freeCodeCamp: Responsive Web Design",
      "Rocketseat: Discover",
    ],
    roadmapInicial: [
      "Aprender HTML básico",
      "Aprender CSS (flexbox, grid)",
      "Aprender JavaScript básico",
      "Criar projeto simples (landing page)",
      "Aprender React",
      "Publicar no GitHub",
    ],
    projetos: [
      "Landing page pessoal",
      "Clone de site famoso",
      "To-do list com JavaScript",
    ],
    termosEssenciais: [
      "HTML",
      "CSS",
      "JavaScript",
      "Framework",
      "Responsividade",
      "DOM",
    ],
    dicasIniciais:
      "Comece pelo HTML e CSS antes de qualquer framework. Construa projetos pequenos desde o início.",
    requiresGraduation: "opcional",
    tempoMedioFormacao: "6-12 meses até primeira vaga",
    crescimentoMercado: "medio",
    faculdadesRelacionadas: [
      "Análise e Desenvolvimento de Sistemas (ADS)",
      "Ciência da Computação",
      "Engenharia de Software",
      "Sistemas de Informação",
    ],
  },
  {
    id: "backend",
    nome: "Back-end",
    slug: "backend",
    icon: Server,
    tagClass: "tag-backend",
    descricaoCurta: "Desenvolve a lógica e os dados por trás dos sistemas.",
    descricaoCompleta:
      "O desenvolvedor back-end cuida de tudo que acontece 'por baixo dos panos': servidores, bancos de dados, APIs e a lógica de negócio que faz os sistemas funcionarem. É quem garante que os dados sejam salvos, processados e entregues corretamente.",
    oQueFaz:
      "Cria APIs, gerencia bancos de dados, implementa regras de negócio, garante segurança e performance dos sistemas.",
    tarefasDiarias: [
      "Criar e manter APIs REST",
      "Trabalhar com bancos de dados SQL e NoSQL",
      "Implementar autenticação e autorização",
      "Otimizar consultas e performance",
      "Integrar sistemas externos",
    ],
    perfilIndicado:
      "Gosta de lógica, resolução de problemas e não precisa ver resultados visuais imediatos. Curte entender como as coisas funcionam por dentro.",
    habilidades: [
      "Lógica de programação",
      "Python, Node.js ou Java",
      "Banco de dados SQL",
      "APIs REST",
      "Git e GitHub",
    ],
    ferramentas: ["VS Code", "Postman", "MySQL ou PostgreSQL", "Docker", "Git"],
    dificuldade: 4,
    cargos: [
      "Desenvolvedor Back-end Júnior",
      "Engenheiro de Software",
      "Desenvolvedor Node.js",
      "Desenvolvedor Python",
    ],
    faixaSalarial: "R$ 3.000 a R$ 6.000 (estágio/trainee/júnior)",
    cursosGratuitos: [
      "Curso em Vídeo: Python",
      "Rocketseat: Node.js",
      "DIO: Java Básico",
    ],
    roadmapInicial: [
      "Aprender lógica de programação",
      "Escolher uma linguagem (Python ou Node.js)",
      "Aprender banco de dados SQL",
      "Criar uma API simples",
      "Aprender Git e GitHub",
    ],
    projetos: [
      "API de lista de tarefas",
      "Sistema de cadastro simples",
      "API de consulta de CEP",
    ],
    termosEssenciais: [
      "API",
      "REST",
      "Banco de dados",
      "Servidor",
      "Autenticação",
      "JSON",
    ],
    dicasIniciais:
      "Domine lógica de programação antes de escolher linguagem. Python é ótima opção para começar.",
    requiresGraduation: "opcional",
    tempoMedioFormacao: "9-18 meses até primeira vaga",
    crescimentoMercado: "medio",
    faculdadesRelacionadas: [
      "Análise e Desenvolvimento de Sistemas (ADS)",
      "Ciência da Computação",
      "Engenharia de Software",
      "Sistemas de Informação",
    ],
  },
  {
    id: "fullstack",
    nome: "Full-stack",
    slug: "fullstack",
    icon: Workflow,
    tagClass: "tag-fullstack",
    descricaoCurta:
      "Desenvolvedor versátil que atua no front-end E back-end. Constrói aplicações de ponta a ponta: interface, servidor, banco de dados.",
    descricaoCompleta:
      "Full-stack é o desenvolvedor que domina tanto o front-end (interface visível ao usuário) quanto o back-end (servidor, lógica, banco de dados). Em vez de focar em uma única camada, atua em todas. É o cargo mais buscado em equipes pequenas e startups, onde uma pessoa precisa entregar features completas: do design da tela até o deploy. Em empresas maiores, o full-stack é valorizado pela visão sistêmica e flexibilidade entre times.",
    oQueFaz:
      "O dev full-stack constrói aplicações completas. Hoje ele pode estar criando uma tela em React, amanhã ajustando uma API em Node.js, e depois otimizando uma query no PostgreSQL. Trabalha em features de ponta a ponta, garantindo que toda a stack funcione bem junta.",
    tarefasDiarias: [
      "Criar telas e componentes no front-end (HTML, CSS, JavaScript/TypeScript)",
      "Desenvolver APIs e lógica de negócio no back-end",
      "Modelar e consultar bancos de dados (SQL ou NoSQL)",
      "Integrar front-end com back-end via APIs REST ou GraphQL",
      "Fazer deploy de aplicações em ambientes cloud (AWS, Vercel, Railway)",
      "Participar de code reviews e cerimônias ágeis com o time",
    ],
    perfilIndicado:
      "Pessoa curiosa que gosta de variedade, não tem medo de mudar de contexto várias vezes ao dia e aprecia ver o produto funcionando completo. Tem boa visão sistêmica e prefere amplitude a profundidade. Ideal pra quem quer trabalhar em startups ou ter autonomia pra entregar features sozinho.",
    habilidades: [
      "HTML, CSS e JavaScript/TypeScript",
      "Pelo menos um framework front-end (React, Vue ou Angular)",
      "Pelo menos uma linguagem back-end (Node.js, Python ou Java)",
      "SQL e modelagem de banco de dados",
      "Git e versionamento",
      "Lógica de programação e pensamento sistêmico",
    ],
    ferramentas: [
      "React",
      "Node.js",
      "TypeScript",
      "PostgreSQL",
      "Git/GitHub",
      "Docker",
      "AWS",
      "VS Code",
    ],
    dificuldade: 4,
    cargos: [
      "Desenvolvedor Full-stack Júnior",
      "Desenvolvedor Full-stack Pleno",
      "Desenvolvedor Full-stack Sênior",
      "Tech Lead",
    ],
    faixaSalarial:
      "R$ 3.250 (júnior) a R$ 15.900 (pleno), fonte Robert Half/Glassdoor 2026",
    cursosGratuitos: [
      "Curso em Vídeo: Web Moderno (Gustavo Guanabara)",
      "The Odin Project (em inglês, gratuito, completo)",
      "freeCodeCamp: Responsive Web Design + APIs and Microservices",
      "Rocketseat Ignite (versão grátis das trilhas)",
    ],
    roadmapInicial: [
      "Aprender HTML, CSS e JavaScript básico",
      "Estudar um framework front-end (React é o mais procurado)",
      "Aprender Node.js + Express ou outra linguagem back-end",
      "Estudar bancos de dados (SQL, começar com PostgreSQL)",
      "Aprender Git e GitHub na prática",
      "Construir 3 projetos full-stack pessoais (com deploy)",
    ],
    projetos: [
      "App de lista de tarefas full-stack (React + Node + PostgreSQL)",
      "Clone de rede social simples (login, posts, comentários)",
      "Sistema de cadastro com autenticação JWT",
      "E-commerce básico com carrinho e checkout",
    ],
    termosEssenciais: [
      "API REST",
      "SPA (Single Page Application)",
      "CRUD",
      "Autenticação JWT",
      "Deploy",
      "Endpoint",
    ],
    dicasIniciais:
      "Comece pelo front-end (HTML/CSS/JS), depois aprenda back-end (Node.js ou Python). Construa pelo menos 3 projetos completos antes de procurar emprego. Domine Git desde o dia 1.",
    requiresGraduation: "opcional",
    tempoMedioFormacao: "12-18 meses até primeira vaga",
    crescimentoMercado: "alto",
    faculdadesRelacionadas: [
      "Análise e Desenvolvimento de Sistemas (ADS)",
      "Ciência da Computação",
      "Engenharia de Software",
      "Sistemas de Informação",
    ],
    subareas: [],
  },
  {
    id: "dados",
    nome: "Ciência de Dados",
    slug: "dados",
    icon: BarChart3,
    tagClass: "tag-dados",
    descricaoCurta: "Analisa dados para gerar insights e tomar decisões.",
    descricaoCompleta:
      "O cientista de dados coleta, limpa, analisa e interpreta grandes volumes de dados para ajudar empresas a tomar decisões mais inteligentes. Combina estatística, programação e conhecimento de negócio.",
    oQueFaz:
      "Analisa conjuntos de dados, cria visualizações, constrói modelos preditivos e apresenta insights para times de negócio.",
    tarefasDiarias: [
      "Coletar e limpar dados",
      "Criar gráficos e dashboards",
      "Aplicar modelos de machine learning",
      "Apresentar análises para stakeholders",
      "Trabalhar com Python e SQL",
    ],
    perfilIndicado:
      "Gosta de números, padrões e resolver problemas com base em evidências. Tem curiosidade analítica.",
    habilidades: [
      "Python",
      "SQL",
      "Estatística básica",
      "Pandas e NumPy",
      "Visualização de dados",
    ],
    ferramentas: [
      "Python (Pandas, NumPy)",
      "Jupyter Notebook",
      "Power BI ou Tableau",
      "SQL",
      "Google Colab",
    ],
    dificuldade: 4,
    cargos: [
      "Analista de Dados Júnior",
      "Cientista de Dados",
      "Engenheiro de Dados",
      "Analista de BI",
    ],
    faixaSalarial: "R$ 3.000 a R$ 6.500 (estágio/trainee/júnior)",
    cursosGratuitos: [
      "Kaggle: Python for Data Science",
      "DIO: Análise de Dados com Python",
      "Google: Data Analytics Certificate (parcial gratuito)",
    ],
    roadmapInicial: [
      "Aprender Python básico",
      "Aprender SQL",
      "Estudar estatística básica",
      "Praticar com Pandas",
      "Criar análise de dataset público",
    ],
    projetos: [
      "Análise de dados do IBGE",
      "Dashboard de vendas fictícias",
      "Análise exploratória de dataset do Kaggle",
    ],
    termosEssenciais: [
      "Dataset",
      "Machine Learning",
      "SQL",
      "Pandas",
      "Visualização",
      "Modelo preditivo",
    ],
    dicasIniciais:
      "Comece com Python e SQL. Kaggle tem datasets gratuitos ótimos para praticar.",
    requiresGraduation: "recomendado",
    tempoMedioFormacao: "1-2 anos com base em matemática",
    crescimentoMercado: "alto",
    faculdadesRelacionadas: [
      "Ciência da Computação",
      "Engenharia de Software",
      "Sistemas de Informação",
    ],
    subareas: [
      {
        slug: "analista-dados",
        nome: "Analista de Dados",
        descricaoCurta:
          "Coleta, limpa e analisa dados pra gerar relatórios e dashboards de suporte a decisão. Porta de entrada da área.",
        descricaoCompleta:
          "Analista de Dados é a porta de entrada mais comum na carreira de dados no Brasil. Transforma dados brutos em relatórios, dashboards e insights que apoiam decisões de negócio. Não precisa de matemática avançada nem machine learning. Domina SQL, Excel e ferramentas de visualização como Power BI ou Tableau. Mercado super aquecido em 2026: Glassdoor mostra média de R$ 5.800-6.192, com sêniores chegando a R$ 16-18k. É a melhor escolha pra quem quer entrar em dados rápido. Bootcamps formam analistas em 6-9 meses, e empresas de todos os portes (varejo, finanças, saúde, marketing) contratam.",
        oQueFaz:
          "No dia a dia: extrai dados de bancos via SQL, limpa e organiza informações de múltiplas fontes (Excel, CSV, APIs), constrói dashboards no Power BI ou Tableau pra acompanhar KPIs do negócio, faz análises ad-hoc respondendo perguntas específicas das áreas (vendas, marketing, financeiro), apresenta insights pra stakeholders não-técnicos. Trabalha como ponte entre os dados crus e decisões executivas.",
        diferencasDaAreaMae:
          "Dentro de Ciência de Dados, o Analista de Dados é o cargo mais acessível. Não precisa dominar estatística avançada nem programação Python pesada. Diferente do Cientista de Dados (que cria modelos preditivos), o analista trabalha com o que já aconteceu, relatórios descritivos e diagnósticos. Diferente do Analista de BI (que foca em dashboards executivos), o analista de dados cobre análises mais variadas, incluindo exploratórias. É a porta de entrada ideal pra migração de carreira de áreas como marketing, finanças ou administração.",
        habilidadesEspecificas: [
          "SQL avançado (consultas, joins, window functions)",
          "Excel avançado (tabelas dinâmicas, fórmulas, Power Query)",
          "Visualização de dados (Power BI, Tableau ou Looker)",
          "Estatística descritiva e raciocínio analítico",
          "Comunicação de insights pra audiências não-técnicas",
        ],
        ferramentasEspecificas: [
          "SQL (PostgreSQL, MySQL, BigQuery)",
          "Power BI ou Tableau",
          "Excel avançado",
          "Python básico (Pandas): diferencial",
          "Google Analytics 4 ou similares",
          "Notebooks (Jupyter ou Google Colab)",
        ],
        cargos: [
          "Analista de Dados Júnior (0-2 anos)",
          "Analista de Dados Pleno (2-5 anos)",
          "Analista de Dados Sênior (5+ anos)",
          "Lead Data Analyst / Coordenador de Analytics",
        ],
        faixaSalarial:
          "R$ 3.000 (júnior) a R$ 16.000+ (sênior). Média BR R$ 5.800-6.192, CAGED/Glassdoor 2026. Em fintechs e grandes empresas, pleno passa R$ 10k. Remoto pra fora paga em dólar.",
        dificuldade: 3,
        cursosGratuitos: [
          "Curso em Vídeo: SQL Completo (Gustavo Guanabara)",
          "Microsoft Learn: Power BI fundamentals (gratuito oficial)",
          "Google Analytics Academy + Google Data Analytics Certificate (Coursera, audit gratuito)",
        ],
        projetosSugeridos: [
          "Dashboard de vendas com dados públicos (CSV do Kaggle) usando Power BI ou Tableau",
          "Análise exploratória de dataset real publicada como artigo no Medium/LinkedIn",
          "Relatório SQL completo respondendo 5 perguntas de negócio em dataset público",
        ],
        roadmapEspecifico: [
          "Dominar SQL profundo (queries com joins, agregações, window functions)",
          "Aprender Excel avançado + Power Query",
          "Escolher uma ferramenta de BI e dominar (Power BI é o mais procurado no BR)",
          "Aprender Python básico com Pandas (diferencial salarial)",
          "Construir portfólio público com 3-4 análises completas no GitHub/LinkedIn",
        ],
        dicasIniciais:
          "Analista de Dados é a melhor porta de entrada em dados. Exige menos matemática que cientista e menos engenharia que engenheiro de dados. Foque em SQL primeiro: é universal e cobrado em 100% das vagas. Power BI vira diferencial real no BR (mais comum que Tableau aqui). Publique análises no LinkedIn. Recrutadores acham analistas por lá. Não precisa de diploma. Bootcamp + portfólio resolvem.",
      },
      {
        slug: "cientista-dados",
        nome: "Cientista de Dados",
        descricaoCurta:
          "Constrói modelos preditivos, aplica estatística avançada e machine learning pra resolver problemas de negócio.",
        descricaoCompleta:
          "Cientista de Dados é o profissional que vai além de relatórios: aplica estatística avançada e machine learning pra construir modelos que preveem o futuro. Detecta fraudes antes que aconteçam, prevê quais clientes vão cancelar serviço, recomenda produtos baseado em padrões invisíveis a olho nu. É um dos cargos mais técnicos e mais bem pagos do mercado de dados, com salário médio de R$ 10.825 e topo em R$ 24.000+ (Nubank, fintechs grandes). Combina três pilares (matemática/estatística, programação (Python/R) e visão de negócio) que poucos profissionais dominam ao mesmo tempo.",
        oQueFaz:
          "No dia a dia: coleta dados de múltiplas fontes, explora padrões com análise estatística (Python + Pandas + Matplotlib), formula hipóteses de negócio (ex: 'quais clientes têm maior risco de churn?'), treina modelos de machine learning pra responder essas perguntas, e apresenta resultados pra stakeholders não-técnicos em formato visual e narrativo. Em fintechs e bancos, trabalha em modelos de risco de crédito, prevenção de fraude e segmentação de clientes.",
        diferencasDaAreaMae:
          "Enquanto o Analista de Dados foca em relatórios e dashboards sobre o que já aconteceu, o Cientista de Dados constrói modelos preditivos sobre o que vai acontecer. Onde o analista usa Excel e Power BI, o cientista usa Python, scikit-learn e TensorFlow. A barreira de entrada é maior (exige base sólida de estatística inferencial e álgebra linear), mas o salário compensa: cientista júnior pode começar acima do pleno analista.",
        habilidadesEspecificas: [
          "Estatística inferencial e álgebra linear (base matemática forte)",
          "Python avançado com Pandas, NumPy e Matplotlib",
          "Machine Learning supervisionado e não-supervisionado (regressão, classificação, clustering)",
          "Deep Learning (redes neurais com TensorFlow ou PyTorch)",
          "Storytelling de dados: traduzir modelos complexos em insights pra liderança",
        ],
        ferramentasEspecificas: [
          "Python (Pandas, NumPy, scikit-learn)",
          "Jupyter Notebooks",
          "TensorFlow ou PyTorch (Deep Learning)",
          "R (estatística aplicada)",
          "SQL avançado",
          "Kaggle (treino e portfólio público)",
        ],
        cargos: [
          "Cientista de Dados Júnior (0-2 anos)",
          "Cientista de Dados Pleno (2-5 anos)",
          "Cientista de Dados Sênior (5+ anos)",
          "Staff/Principal Data Scientist (lidera projetos, mentora time)",
        ],
        faixaSalarial:
          "R$ 6.000 (júnior) a R$ 24.000 (sênior em grandes empresas). Média BR R$ 10.825, CAGED/Glassdoor 2026. Remoto pra EUA passa R$ 50.000.",
        dificuldade: 5,
        cursosGratuitos: [
          "Sigmoidal: Conteúdo gratuito de Data Science (artigos, tutoriais e cursos introdutórios)",
          "Kaggle Learn: Trilhas oficiais Kaggle (Python, ML, Deep Learning), todas gratuitas",
          "StatQuest with Josh Starmer (YouTube): estatística e ML em vídeo",
        ],
        projetosSugeridos: [
          "Modelo preditivo de churn (cancelamento) com dados públicos de telecom",
          "Sistema de classificação de imagens com CNN (deep learning, Kaggle datasets)",
          "Análise exploratória + dashboard de dados de e-commerce/varejo com insights de negócio",
        ],
        roadmapEspecifico: [
          "Estudar estatística inferencial (livro: 'An Introduction to Statistical Learning', gratuito)",
          "Aprender Python + Pandas + Matplotlib até dominar análise exploratória",
          "Estudar Machine Learning: começar pelo Kaggle Learn (regressão → classificação → clustering)",
          "Aprofundar em Deep Learning (TensorFlow ou PyTorch): área de maior crescimento salarial",
          "Construir portfólio público: 3 projetos no GitHub + 1 competição Kaggle com posição decente",
        ],
        dicasIniciais:
          "Não pula a estatística. É a base que separa cientista bom de cientista que só copia código. Use Kaggle como academia de treino: cada competição é uma oportunidade real de portfólio. Foque em comunicar resultados quanto em construir modelos. Quem traduz números pra negócio sobe rápido. Inglês é obrigatório aqui: papers, comunidade, doc, tudo em inglês.",
      },
      {
        slug: "analista-bi",
        nome: "Analista de BI",
        descricaoCurta:
          "Especialista em ferramentas de visualização (Power BI, Tableau, Looker) e SQL pra dashboards executivos.",
        descricaoCompleta:
          "Analista de BI (Business Intelligence) é o profissional especializado em transformar dados em dashboards executivos que apoiam decisões estratégicas. Domina ferramentas de visualização (Power BI, Tableau, Looker) e SQL pra construir relatórios que monitoram KPIs do negócio em tempo real. Cargo super comum em empresas tradicionais e médias no BR: varejo, financeiro, indústria, saúde. Salário típico: R$ 3-5.5k júnior, R$ 6-10k pleno, R$ 10-18k sênior. Diferente do Analista de Dados generalista, o de BI é especialista em construir dashboards corporativos consumidos por executivos.",
        oQueFaz:
          "No dia a dia: extrai dados via SQL de sistemas corporativos (ERP, CRM), modela os dados pra consumo em ferramentas de BI, constrói dashboards interativos no Power BI ou Tableau com KPIs do negócio (vendas, financeiro, operacional), apresenta relatórios pra lideranças, automatiza atualizações periódicas, e treina usuários de negócio a navegar pelos dashboards. Faz BI operacional (acompanhamento diário) e BI estratégico (decisões de médio-longo prazo).",
        diferencasDaAreaMae:
          "Dentro de Ciência de Dados, o Analista de BI é o mais especializado em visualização e dashboards executivos, diferente do Analista de Dados (que faz análises mais variadas) e do Analytics Engineer (que constrói modelos no warehouse). Cargo super comum em empresas tradicionais brasileiras que ainda estão maturando seu uso de dados. Porta de entrada relativamente acessível: pode-se começar dominando Power BI + SQL sem precisar de Python ou estatística.",
        habilidadesEspecificas: [
          "Power BI ou Tableau (essencial, escolher um e dominar)",
          "SQL intermediário-avançado (joins, agregações, CTEs)",
          "Modelagem para BI (star schema simplificado)",
          "DAX (linguagem Power BI) ou LookML (Looker)",
          "Storytelling com dados (transformar gráficos em insights)",
        ],
        ferramentasEspecificas: [
          "Power BI (mais procurado no BR)",
          "Tableau (segundo mais comum)",
          "SQL Server, PostgreSQL ou Oracle (bancos corporativos)",
          "Excel avançado (ainda essencial no BR)",
          "Looker ou Looker Studio (algumas empresas modernas)",
          "DAX Studio (otimização Power BI)",
        ],
        cargos: [
          "Analista de BI Júnior (0-2 anos)",
          "Analista de BI Pleno (2-5 anos)",
          "Analista de BI Sênior (5+ anos)",
          "Coordenador BI / Lead Analytics",
        ],
        faixaSalarial:
          "R$ 3.000 (júnior) a R$ 18.000 (sênior). Média BR R$ 4.614-6.192, Glassdoor/Indeed 2026. Pleno gira em R$ 6-10k. Em fintechs e empresas grandes, sênior chega a R$ 12-18k.",
        dificuldade: 3,
        cursosGratuitos: [
          "Microsoft Learn: Power BI fundamentals (oficial gratuito)",
          "Curso em Vídeo: SQL Completo (Gustavo Guanabara)",
          "Tableau Public: recursos gratuitos + galeria de exemplos",
        ],
        projetosSugeridos: [
          "Dashboard executivo de vendas com 4-5 visualizações conectadas (Power BI ou Tableau)",
          "Dashboard de RH/operacional com filtros interativos e drill-down",
          "Relatório financeiro completo com KPIs principais publicado no Tableau Public",
        ],
        roadmapEspecifico: [
          "Aprender SQL profundamente (joins, agregações, window functions)",
          "Escolher Power BI ou Tableau e dominar profundamente",
          "Estudar modelagem básica pra BI (star schema simplificado)",
          "Aprender DAX (Power BI) ou LookML (Looker): diferencial salarial real",
          "Construir portfólio com 3-4 dashboards publicados (Tableau Public é gratuito)",
        ],
        dicasIniciais:
          "Power BI é o mais procurado no BR. Comece por ele. Tableau vale pra quem mira empresas internacionais ou agências. Portfólio público no Tableau Public é grátis e impressiona recrutadores. Domine DAX se for Power BI. Separa juniores de plenos. Certificação Microsoft PL-300 (Power BI) custa US$ 165 e vale o investimento.",
      },
      {
        slug: "analytics-engineer",
        nome: "Analytics Engineer",
        descricaoCurta:
          "Atua entre engenharia e análise. Cria modelos de dados confiáveis com SQL + dbt pra times de analistas.",
        descricaoCompleta:
          "Analytics Engineer é o cargo híbrido mais quente da área de dados em 2026: profissional que vive entre o Engenheiro de Dados e o Analista. Surgiu com o movimento Modern Data Stack (dbt + Snowflake + BigQuery) e virou padrão em empresas data-driven. Constrói modelos de dados confiáveis e reutilizáveis em SQL, não pipelines de ingestão (engenheiro), nem dashboards finais (analista), mas a camada intermediária que alimenta tudo. Salário típico fica entre Analista e Engenheiro: R$ 8-18k pleno, sêniores R$ 18-25k. Mercado BR ainda em formação. Quem domina dbt + SQL avançado pega salários acima da média de Analista.",
        oQueFaz:
          "No dia a dia: modela dados brutos do warehouse em camadas confiáveis (staging → marts), escreve transformações SQL versionadas em dbt, documenta lineage e testes de qualidade, colabora com Engenheiros de Dados (consome pipelines) e Analistas (entrega modelos prontos), implementa testes automatizados de qualidade de dados, e gerencia o data warehouse pra que múltiplos times consumam dados consistentes. Conecta o mundo de eng. de dados com o mundo de análise.",
        diferencasDaAreaMae:
          "Dentro de Ciência de Dados, o Analytics Engineer separa-se claramente: enquanto o Analista usa dados prontos pra fazer relatórios, e o Engenheiro de Dados move dados de origem pro warehouse, o Analytics Engineer transforma dados brutos em modelos confiáveis dentro do warehouse. Diferente do Cientista (matemática + ML), o foco aqui é SQL e modelagem dimensional. É a evolução natural de Analistas que querem mais profundidade técnica sem virar engenheiro de dados puro.",
        habilidadesEspecificas: [
          "SQL avançado (window functions, CTEs, otimização)",
          "dbt (data build tool): referência absoluta da área",
          "Modelagem dimensional (Kimball, star schema)",
          "Versionamento e Git (modelos como código)",
          "Testes de qualidade de dados (dbt tests, data contracts)",
        ],
        ferramentasEspecificas: [
          "dbt (essencial)",
          "SQL (PostgreSQL, BigQuery, Snowflake)",
          "Git/GitHub (modelos versionados)",
          "Airflow ou Dagster (orquestração)",
          "Snowflake ou BigQuery (data warehouses modernos)",
          "Looker ou Lightdash (BI baseado em modelos)",
        ],
        cargos: [
          "Analytics Engineer Júnior (vindo de Analista, 1-2 anos)",
          "Analytics Engineer Pleno (2-5 anos)",
          "Analytics Engineer Sênior (5+ anos)",
          "Staff Analytics Engineer / Lead Data Modeling",
        ],
        faixaSalarial:
          "R$ 6.000 (júnior, vindo de Analista) a R$ 20.000+ (sênior). Pleno gira em R$ 10-15k. Especialistas dbt em empresas data-driven (iFood, Stone, Nubank) chegam a R$ 18-25k.",
        dificuldade: 4,
        cursosGratuitos: [
          "dbt Learn (cursos oficiais grátis em inglês)",
          "DataTalksClub: Analytics Engineering Zoomcamp (gratuito, completo)",
          "GitLab Data Team handbook (referência pública sobre data modeling)",
        ],
        projetosSugeridos: [
          "Projeto dbt público: ingestão CSV → staging → marts com testes (publicar no GitHub)",
          "Modelo dimensional completo de domínio fictício (e-commerce, SaaS) com documentação",
          "Pipeline analytics: dbt + Airflow + BigQuery com dashboards consumindo modelos",
        ],
        roadmapEspecifico: [
          "Dominar SQL profundo (window functions, CTEs, otimização de queries)",
          "Aprender dbt do zero (oficial dbt Learn é gratuito e completo)",
          "Estudar modelagem dimensional (Kimball é referência absoluta)",
          "Praticar com data warehouse moderno (BigQuery é gratuito até certo volume)",
          "Construir 1-2 projetos públicos no GitHub com dbt + docs + tests",
        ],
        dicasIniciais:
          "Analytics Engineer é o caminho mais inteligente pra Analistas que querem subir salário sem virar Engenheiro de Dados puro. dbt é A ferramenta da carreira. Invista 1-2 meses dominando. SQL é 80% do trabalho. Se não está fluente, foque aí antes. Inglês é importante (toda a community dbt está em inglês). Cargo ainda em formação no BR. Quem entra agora pega salários acima do normal.",
      },
    ],
  },
  {
    id: "uxui",
    nome: "UX/UI Design",
    slug: "uxui",
    icon: Palette,
    tagClass: "tag-uxui",
    descricaoCurta: "Projeta experiências digitais centradas no usuário.",
    descricaoCompleta:
      "O designer de UX/UI cria a experiência e a interface visual dos produtos digitais. UX (User Experience) foca em tornar o produto fácil e agradável de usar. UI (User Interface) foca na aparência visual: cores, tipografia, ícones e componentes.",
    oQueFaz:
      "Pesquisa usuários, cria wireframes, protótipos e designs de alta fidelidade, testa usabilidade e colabora com desenvolvedores.",
    tarefasDiarias: [
      "Criar wireframes e protótipos no Figma",
      "Realizar pesquisas com usuários",
      "Definir fluxos de navegação",
      "Criar sistemas de design",
      "Apresentar propostas para o time",
    ],
    perfilIndicado:
      "Gosta de criatividade, empatia e de entender como as pessoas pensam. Curte estética e organização.",
    habilidades: [
      "Figma",
      "Pesquisa com usuários",
      "Prototipação",
      "Design visual",
      "Comunicação",
    ],
    ferramentas: ["Figma", "Maze (testes)", "Miro", "Notion", "Adobe XD"],
    dificuldade: 3,
    cargos: [
      "Designer UX/UI Júnior",
      "Product Designer",
      "UI Designer",
      "UX Researcher",
    ],
    faixaSalarial: "R$ 2.500 a R$ 5.500 (estágio/trainee/júnior)",
    cursosGratuitos: [
      "Figma: Curso oficial gratuito",
      "Origamid: UX Design (parcial)",
      "YouTube: Canais de UX em português",
    ],
    roadmapInicial: [
      "Aprender conceitos de UX",
      "Aprender Figma",
      "Criar wireframes simples",
      "Estudar heurísticas de Nielsen",
      "Criar protótipo de app",
      "Publicar no Behance",
    ],
    projetos: [
      "Redesign de app existente",
      "Protótipo de app de delivery",
      "Pesquisa de usabilidade simples",
    ],
    termosEssenciais: [
      "Wireframe",
      "Protótipo",
      "Usabilidade",
      "Heurísticas",
      "Design System",
      "Persona",
    ],
    dicasIniciais:
      "Comece aprendendo Figma e fazendo redesigns de apps que você usa. Publique no Behance desde o início.",
    requiresGraduation: "opcional",
    tempoMedioFormacao: "6-12 meses com portfólio",
    crescimentoMercado: "medio",
    faculdadesRelacionadas: [],
    subareas: [
      {
        slug: "ux-design",
        nome: "UX Design",
        descricaoCurta:
          "Pesquisa com usuários, fluxos, wireframes e testes de usabilidade. Foco em como o produto funciona.",
        descricaoCompleta:
          "UX Design é o coração da experiência do usuário: o profissional que investiga, planeja e estrutura como pessoas interagem com produtos digitais antes de uma linha de código ser escrita. Trabalha com pesquisa, entrevistas, fluxos de navegação, wireframes e testes de usabilidade. O foco está em como o produto funciona, não em como ele parece (essa é a praia do UI Designer). É a porta de entrada mais comum em UX/UI no Brasil. Salários partem de R$ 4k pra júnior e chegam a R$ 12k+ pra sênior, com mercado aquecido em startups e produtos digitais.",
        oQueFaz:
          "No dia a dia: conduz entrevistas com usuários reais, mapeia jornadas (do primeiro contato até a conversão), monta wireframes de baixa fidelidade, prototipia fluxos no Figma, organiza testes de usabilidade pra validar hipóteses, e apresenta resultados de pesquisa pro time de produto. Trabalha lado a lado com PM, dev e UI Designer pra garantir que a solução resolva o problema real do usuário, não só uma intuição do time.",
        diferencasDaAreaMae:
          "Dentro de UX/UI, o UX Design separa-se do UI Design pelo foco: enquanto UI cuida da parte visual (cores, tipografia, componentes), UX cuida da estrutura e do comportamento (fluxos, decisões, hierarquia). Diferente do Product Designer (que mistura UX + UI + estratégia), o UX puro investe mais profundamente em pesquisa e validação. É a melhor porta de entrada pra quem gosta mais de raciocinar sobre problemas que de desenhar telas bonitas.",
        habilidadesEspecificas: [
          "Pesquisa com usuários (entrevistas, surveys, análise comportamental)",
          "Construção de wireframes e protótipos de baixa-média fidelidade",
          "Mapeamento de jornadas e fluxos de usuário",
          "Testes de usabilidade e análise heurística",
          "Princípios de acessibilidade digital (WCAG)",
        ],
        ferramentasEspecificas: [
          "Figma (padrão da indústria pra prototipagem)",
          "Miro ou FigJam (mapeamento de jornadas)",
          "Maze ou UserTesting (testes de usabilidade remoto)",
          "Notion (documentação de pesquisa)",
          "Hotjar ou Microsoft Clarity (análise comportamental real)",
          "Optimal Workshop (card sorting, tree testing)",
        ],
        cargos: [
          "UX Designer Júnior (0-2 anos)",
          "UX Designer Pleno (2-5 anos)",
          "UX Designer Sênior (5+ anos)",
          "Lead UX Designer / Head of UX",
        ],
        faixaSalarial:
          "R$ 4.000 (júnior) a R$ 12.000 (sênior). Especialistas em pesquisa ou design de interação chegam a R$ 10-12k. Remoto pra fora paga em dólar.",
        dificuldade: 3,
        cursosGratuitos: [
          "Google UX Design Professional Certificate (Coursera, audit gratuito)",
          "UX Collective (publicação Medium + tutoriais em PT-BR e EN)",
          "Interaction Design Foundation (IDF): artigos gratuitos sobre fundamentos",
        ],
        projetosSugeridos: [
          "Redesign de um app que você usa (com pesquisa + protótipo + justificativa)",
          "Estudo de caso completo: definir problema, fazer 3-5 entrevistas, propor solução",
          "Auditoria de usabilidade de um site público com análise heurística + recomendações",
        ],
        roadmapEspecifico: [
          "Aprender fundamentos de UX (Design Thinking, Double Diamond, heurísticas de Nielsen)",
          "Dominar Figma (prototipagem, auto-layout, componentes)",
          "Estudar pesquisa qualitativa (como conduzir entrevistas, análise temática)",
          "Fazer 2-3 estudos de caso reais ou hipotéticos pro portfólio",
          "Construir portfólio público (Behance ou site próprio) com processo, não só telas finais",
        ],
        dicasIniciais:
          "Portfólio vale mais que diploma. Recrutadores olham processo, não título. Mostre como você pensou, não só o que entregou. Faça pelo menos 1 estudo de caso completo (problema → pesquisa → protótipo → teste → solução). Domine Figma cedo: é o padrão da indústria e quase obrigatório em qualquer vaga. Inglês ajuda mas não é deal-breaker como em Cientista de Dados.",
      },
      {
        slug: "ui-design",
        nome: "UI Design",
        descricaoCurta:
          "Interface visual, paletas, tipografia, componentes. Foco em como o produto se parece.",
        descricaoCompleta:
          "UI Designer (User Interface) é o profissional especialista na camada visual da experiência: cores, tipografia, espaçamento, componentes, iconografia. Trabalha próximo ao UX Designer e ao desenvolvedor, traduzindo conceitos e fluxos em interfaces visualmente atraentes e funcionais. Diferente do UX (que pensa estrutura) e do Product Designer (que faz UX + UI + estratégia), o UI puro é cargo mais raro hoje. Empresas preferem Product Designers que cobrem ambos. Mas em design systems, agências e jogos digitais, UI puro segue valorizado. Salários: R$ 2.4-7k típico, abaixo do mercado de UX e Product Design.",
        oQueFaz:
          "No dia a dia: cria interfaces visuais detalhadas a partir de wireframes do UX, define paletas de cores, sistemas tipográficos, componentes reutilizáveis, micro-interações e estados visuais (hover, disabled, error). Trabalha próximo a desenvolvedores pra garantir aderência fiel ao design (handoff via Figma). Em produtos com design system maduro, contribui pra evolução do sistema. Em agências ou produtos novos, cria do zero o visual da marca.",
        diferencasDaAreaMae:
          "Dentro de UX/UI, o UI Designer separa-se do UX pela camada: UX cuida da estrutura e comportamento, UI cuida da estética e visual. Diferente do Product Designer (que faz tudo), o UI puro é mais especializado. Cargo menos procurado em startups (que preferem Product Designers híbridos), mas valorizado em agências, design systems e produtos com grande maturidade visual. Quem ama composição visual e tipografia mas não tem paciência pra pesquisa profunda se encaixa bem aqui.",
        habilidadesEspecificas: [
          "Composição visual (grid, hierarquia, proximidade)",
          "Tipografia aplicada (escolha, escala, espaçamento)",
          "Color systems e teoria de cores",
          "Design systems (tokens, componentes, variantes)",
          "Micro-interações e animações sutis (Lottie, Framer)",
        ],
        ferramentasEspecificas: [
          "Figma (padrão absoluto da indústria)",
          "Adobe Photoshop e Illustrator (ainda comum)",
          "Tokens Studio ou Figma Variables (design systems)",
          "Lottie (animações exportáveis)",
          "Iconify ou Lucide (bibliotecas de ícones)",
          "Coolors ou Adobe Color (paletas)",
        ],
        cargos: [
          "UI Designer Júnior (0-2 anos)",
          "UI Designer Pleno (2-5 anos)",
          "UI Designer Sênior (5+ anos)",
          "Lead UI / Design System Designer",
        ],
        faixaSalarial:
          "R$ 2.401 (piso CAGED) a R$ 7.018 (teto CAGED 2026). Média BR R$ 3.725. Em fintechs e empresas grandes, sênior chega a R$ 10-12k. Mercado em queda relativa (-8% contratações). UI puro está sendo absorvido por Product Design.",
        dificuldade: 3,
        cursosGratuitos: [
          "Figma Academy (cursos oficiais gratuitos)",
          "Refactoring UI (livro pago, mas amostras gratuitas valiosas)",
          "UI Movement (referência visual + tutoriais gratuitos)",
        ],
        projetosSugeridos: [
          "Redesign visual de app conhecido (Instagram, Spotify) mantendo o UX original",
          "Design system mínimo (cores, tipografia, 15 componentes) no Figma",
          "Landing page completa com 5+ seções, responsiva, com animações sutis",
        ],
        roadmapEspecifico: [
          "Estudar fundamentos visuais (composição, tipografia, cor, hierarquia)",
          "Dominar Figma absurdamente (auto-layout, variants, components, variables)",
          "Aprender design systems (tokens, escalas, padrões)",
          "Construir portfólio com 3-4 projetos visuais detalhados",
          "Considerar transição pra Product Designer (UI puro tem mercado mais limitado)",
        ],
        dicasIniciais:
          "UI puro tem mercado mais limitado em 2026. Considere ampliar pra Product Designer (UX + UI + estratégia). Se ficar em UI puro, mire agências, design systems ou produtos visualmente complexos (games, finanças premium). Domine Figma profundamente. Variants e auto-layout são essenciais. Portfólio visual forte vale mais que diploma. Estude tipografia. Separa UI bom de UI medíocre.",
      },
      {
        slug: "ux-research",
        nome: "UX Research",
        descricaoCurta:
          "Especialização em pesquisa qualitativa e quantitativa de usuários. Entrevistas, testes, análise comportamental.",
        descricaoCompleta:
          "UX Researcher é o especialista em descobrir verdades sobre usuários através de pesquisa rigorosa: entrevistas, observação, testes, análise comportamental. Diferente do UX Designer que faz pesquisa como parte do trabalho, o Researcher vive de pesquisa: planeja estudos, recruta participantes, conduz entrevistas, analisa transcrições, sintetiza insights e influencia decisões de produto e estratégia. Cargo mais sênior em UX, valorizado em empresas grandes (Nubank, iFood, big techs internacionais) onde a complexidade exige profundidade investigativa. Salários: R$ 6-22k, com sêniores em fintechs/big techs chegando a R$ 18-25k.",
        oQueFaz:
          "No dia a dia: planeja estudos de pesquisa (definir objetivos, métodos, métricas), recruta participantes (com perfis específicos), conduz entrevistas em profundidade (1 a 2 horas), facilita testes de usabilidade moderados e não-moderados, analisa transcrições e identifica padrões (análise temática, affinity mapping), sintetiza insights em narrativas pra times de produto, e treina outras pessoas a fazer research básico (democratização). Trabalha com PMs, designers e desenvolvedores.",
        diferencasDaAreaMae:
          "Dentro de UX/UI, o Researcher é o cargo mais especializado e mais sênior, diferente do UX Designer (que faz pesquisa como parte do trabalho), o Researcher vive de research. Diferente do Product Designer (que é generalista UX+UI+estratégia), o Researcher é hyper-especializado. Cargo raro em startups (não cabe no orçamento), comum em empresas grandes com 100+ designers. Carreira longa: pode-se ser Researcher Sênior por 10+ anos sem virar gestor.",
        habilidadesEspecificas: [
          "Métodos qualitativos (entrevistas em profundidade, observação contextual)",
          "Métodos quantitativos (surveys, análise estatística básica, A/B testing)",
          "Recrutamento e screening de participantes",
          "Análise temática e affinity mapping",
          "Storytelling de research (transformar dados em narrativas acionáveis)",
        ],
        ferramentasEspecificas: [
          "Dovetail ou Notion (organização de research repositório)",
          "Maze, UserTesting ou Lookback (testes remotos)",
          "Typeform ou Google Forms (surveys quantitativos)",
          "Otter.ai ou Fireflies (transcrição automática de entrevistas)",
          "Miro ou Mural (synthesis colaborativa)",
          "Hotjar ou FullStory (análise comportamental real)",
        ],
        cargos: [
          "UX Researcher Júnior (0-2 anos, raro)",
          "UX Researcher Pleno (2-5 anos)",
          "UX Researcher Sênior (5+ anos)",
          "Lead/Staff UX Researcher / Head of Research",
        ],
        faixaSalarial:
          "R$ 6.000 (pleno típico no BR) a R$ 25.000 (sênior em big techs). Médias BR R$ 8-15k. Vagas internacionais remotas pagam US$ 5-10k/mês. Cargo mais sênior em UX no geral.",
        dificuldade: 4,
        cursosGratuitos: [
          "NN/g (Nielsen Norman Group): artigos gratuitos sobre research (referência mundial)",
          "Interaction Design Foundation: artigos gratuitos sobre research methods",
          "Dovetail Academy: recursos gratuitos sobre research repositórios",
        ],
        projetosSugeridos: [
          "Estudo qualitativo completo: 5-8 entrevistas + análise temática + insights pra um produto",
          "Survey quantitativo com 100+ respondentes + análise estatística publicada",
          "Estudo misto (qual + quant): hipótese inicial → entrevistas → survey de validação",
        ],
        roadmapEspecifico: [
          "Estudar métodos qualitativos a fundo (entrevistas, observação contextual)",
          "Aprender métodos quantitativos básicos (surveys, estatística descritiva, A/B)",
          "Praticar entrevistas com pessoas reais (5-10 entrevistas antes de procurar vaga)",
          "Construir repositório público de estudos no Medium ou portfólio próprio",
          "Conseguir vaga como UX Researcher Júnior em empresa grande (raro mas existe)",
        ],
        dicasIniciais:
          "Researcher é cargo mais sênior em UX, raramente entry-level. Caminho comum: começa como UX Designer ou Product Designer, descobre paixão por research, especializa. Domine entrevistas em profundidade. É a habilidade-chave. Inglês é altamente diferencial (boa parte da literatura está em inglês). Background em psicologia, sociologia ou antropologia ajuda (mas não é obrigatório). Cargo perfeito pra perfis curiosos e investigativos.",
      },
      {
        slug: "design-systems",
        nome: "Design Systems",
        descricaoCurta:
          "Construção e manutenção de bibliotecas de componentes e tokens de design pra produtos grandes.",
        descricaoCompleta:
          "Design System Designer é o profissional sênior que constrói e mantém o sistema de design de uma empresa: biblioteca de componentes reutilizáveis, tokens de design (cores, espaçamento, tipografia), padrões de interação e documentação. Diferente do Product Designer (que usa o design system pra criar telas) ou UI puro (que faz interfaces visuais), o DS Designer constrói a fundação que todos os outros designers usam. Cargo super sênior, raramente entry-level. Salários: pleno gira R$ 8-15k, sêniores em empresas com produtos complexos (Nubank, iFood, Magalu) chegam a R$ 18-25k. Mercado em crescimento. Toda empresa madura precisa.",
        oQueFaz:
          "No dia a dia: define tokens de design (cores, tipografia, espaçamento, elevações) e versiona como código, constrói componentes reutilizáveis no Figma com variants e propriedades, documenta padrões de uso e boas práticas, trabalha próximo aos devs front-end pra garantir aderência (Storybook, Tailwind, MUI), faz workshops e treina outros designers a usar o sistema, e itera baseado em feedback de uso. Em times maduros, gerencia versão do design system como produto interno.",
        diferencasDaAreaMae:
          "Dentro de UX/UI, o Design System é a especialização mais técnica, diferente do Product Designer (que usa o sistema) e do UI Designer (que cria interfaces), o DS Designer constrói a base. Aproxima-se de Front-end Engineer: precisa entender tokens, componentes, lógica de propriedades. Diferente do UX Designer (foco em pesquisa), o DS Designer foca em sistematização visual. Cargo SÊNIOR. Não tente entrar sem 3+ anos de design de produto. Caminho típico: Product/UI Designer experiente → DS Designer.",
        habilidadesEspecificas: [
          "Figma avançado (variants, properties, variables, modes)",
          "Tokens de design (Tokens Studio, Style Dictionary)",
          "Conhecimento básico de front-end (HTML, CSS, React/Vue)",
          "Acessibilidade (WCAG AA/AAA) aplicada a componentes",
          "Documentação técnica clara (Storybook, Zeroheight, ZenHub)",
        ],
        ferramentasEspecificas: [
          "Figma + Tokens Studio (combinação padrão)",
          "Storybook (documentação de componentes pra devs)",
          "Style Dictionary (tokens como código)",
          "Zeroheight (documentação visual de design system)",
          "GitHub (versionamento de tokens e componentes)",
          "Chromatic ou Percy (visual regression testing)",
        ],
        cargos: [
          "Design Systems Designer Pleno (vindo de Product Designer)",
          "Design Systems Designer Sênior (5+ anos)",
          "Design Systems Lead / Staff Designer",
          "Head of Design Systems / Design Technology",
        ],
        faixaSalarial:
          "R$ 6.000 (entrada) a R$ 25.000+ (sênior em big techs). Pleno gira em R$ 8-15k. Sêniores em Nubank, iFood, Magalu, Stone chegam a R$ 18-25k. Remoto pra fora paga US$ 5-10k/mês.",
        dificuldade: 4,
        cursosGratuitos: [
          "Brad Frost: Atomic Design (livro online gratuito, referência mundial)",
          "Design Systems Repo (designsystemsrepo.com): coleção de sistemas reais",
          "Figma Academy: Design Systems track (cursos oficiais gratuitos)",
        ],
        projetosSugeridos: [
          "Construir design system completo (cores, tipografia, 20+ componentes) com docs",
          "Versionar tokens em GitHub + integrar com Style Dictionary",
          "Documentar 1 componente complexo (input com 8 estados) no Storybook + Figma",
        ],
        roadmapEspecifico: [
          "Ter 2-3 anos de Product Designer ou UI sênior antes de mirar DS",
          "Estudar Atomic Design (Brad Frost) e padrões de DS modernos",
          "Dominar Figma profundamente (variants, properties, variables, modes)",
          "Aprender fundamentos de front-end (HTML, CSS, React básico)",
          "Construir DS público no Figma + GitHub como portfólio",
        ],
        dicasIniciais:
          "DS é cargo SÊNIOR. Não tente entrar como júnior. Brad Frost (Atomic Design) é leitura obrigatória. Conhecimento básico de front-end é o diferencial real. Separa DS Designer de UI puro. Domine Figma absurdamente (variants, properties, modes). Acompanhe sistemas grandes: Material Design (Google), Polaris (Shopify), Lightning (Salesforce), todos públicos. Cargo perfeito pra perfis sistemáticos e organizados.",
      },
      {
        slug: "product-design",
        nome: "Product Designer",
        descricaoCurta:
          "Generalista que cobre UX + UI + estratégia de produto. Cargo mais comum em startups.",
        descricaoCompleta:
          "Product Designer é o cargo mais procurado em design de produtos digitais hoje. Combina pesquisa (UX), interface visual (UI) e estratégia de produto em uma única função. Surgiu como evolução do designer especializado: em vez de ter UX Designer + UI Designer + estrategista separados, startups querem alguém que faça tudo. É o cargo mais comum em startups e scale-ups no Brasil, com salários partindo de R$ 4-6k pra júnior e chegando a R$ 15-20k+ pra sênior em fintechs e big techs. Diferente de UX puro ou UI puro, o Product Designer precisa entender métricas de negócio e colaborar diretamente com PMs e devs.",
        oQueFaz:
          "No dia a dia: conduz pesquisa com usuários (entrevistas, testes), desenha fluxos e wireframes, constrói interfaces visuais detalhadas no Figma, valida hipóteses com protótipos, contribui pra estratégia do produto junto com PM e tech lead. Trabalha em ciclos curtos (sprints) entregando features completas, do problema definido até o design final pronto pra dev. Mede impacto das próprias decisões com métricas e itera baseado em dados.",
        diferencasDaAreaMae:
          "Dentro de UX/UI Design, o Product Designer é o generalista. Cobre UX + UI + um pouco de estratégia. Diferente do UX Designer (focado em pesquisa e estrutura) e do UI Designer (focado em visual), o Product Designer precisa fazer os dois bem e ainda pensar em métricas de produto. É o cargo mais procurado em startups e scale-ups, porque uma pessoa entrega o que normalmente exigiria duas ou três. Em empresas maiores, o cargo se divide em especialistas (UX puro, UI puro, Research separado).",
        habilidadesEspecificas: [
          "UX completo (pesquisa, fluxos, wireframes, testes)",
          "UI design e prototipagem detalhada (Figma, design systems)",
          "Pensamento de produto (métricas, hipóteses, A/B testing)",
          "Colaboração ágil com PMs e devs (entender restrições técnicas)",
          "Storytelling de design (apresentar decisões pra stakeholders)",
        ],
        ferramentasEspecificas: [
          "Figma (essencial, padrão da indústria)",
          "Miro ou FigJam (mapeamento, workshops)",
          "Maze ou UserTesting (testes remotos)",
          "Notion (documentação de design)",
          "Mixpanel ou Amplitude (analytics básico de produto)",
          "Tokens Studio ou Figma Variables (design systems)",
        ],
        cargos: [
          "Product Designer Júnior (0-2 anos)",
          "Product Designer Pleno (2-5 anos)",
          "Product Designer Sênior (5+ anos)",
          "Lead/Staff Product Designer (lidera múltiplos produtos)",
        ],
        faixaSalarial:
          "R$ 4.000 (júnior) a R$ 18.000 (sênior em fintechs/big techs). Média BR R$ 5.458-6.500. Especialistas em design systems ou IA design chegam a R$ 15k+. Vagas remotas pra fora pagam em dólar.",
        dificuldade: 4,
        cursosGratuitos: [
          "Google UX Design Professional Certificate (Coursera audit + práticas)",
          "Figma Academy (cursos oficiais gratuitos sobre Figma e design systems)",
          "UX Collective (publicações + tutoriais em PT-BR)",
        ],
        projetosSugeridos: [
          "Redesign completo de um produto que você usa: pesquisa + protótipo + métrica esperada",
          "Design system mínimo (10-15 componentes) no Figma com documentação",
          "Estudo de caso com hipótese de negócio: problema → research → solução → KPI",
        ],
        roadmapEspecifico: [
          "Aprender fundamentos de UX (Design Thinking, heurísticas, Jobs to be Done)",
          "Dominar Figma profundamente (auto-layout, variables, componentes)",
          "Aprender UI moderno: tipografia, color systems, espaçamento, hierarquia",
          "Estudar métricas básicas de produto e analytics (Mixpanel, GA4)",
          "Construir portfólio com 3 estudos de caso COMPLETOS (não só telas finais)",
        ],
        dicasIniciais:
          "Product Designer é o cargo com maior demanda hoje em design. Vale mais que se especializar em UX ou UI puros. Portfólio com PROCESSO vale muito mais que portfólio com telas bonitas. Recrutadores querem ver pesquisa, hipóteses, decisões e impacto. Domine Figma absurdamente (não basta saber usar, precisa fazer dele uma extensão da mão). Inglês é diferencial real. Conecte com PMs no LinkedIn. Eles abrem portas.",
      },
    ],
  },
  {
    id: "ia",
    nome: "Inteligência Artificial",
    slug: "ia",
    icon: Brain,
    tagClass: "tag-ia",
    descricaoCurta:
      "Cria sistemas que aprendem e tomam decisões automaticamente.",
    descricaoCompleta:
      "A área de IA desenvolve sistemas capazes de aprender com dados, reconhecer padrões e tomar decisões de forma autônoma. Inclui Machine Learning, Deep Learning, Processamento de Linguagem Natural e Visão Computacional.",
    oQueFaz:
      "Desenvolve modelos de machine learning, treina redes neurais, cria chatbots, sistemas de recomendação e automações inteligentes.",
    tarefasDiarias: [
      "Treinar e avaliar modelos de ML",
      "Processar e preparar dados",
      "Implementar algoritmos de IA",
      "Pesquisar novas técnicas",
      "Integrar modelos em produtos",
    ],
    perfilIndicado:
      "Gosta de matemática, estatística e tem curiosidade sobre como máquinas podem 'aprender'. Tem paciência para experimentação.",
    habilidades: [
      "Python",
      "Machine Learning",
      "Estatística e álgebra linear",
      "TensorFlow ou PyTorch",
      "SQL",
    ],
    ferramentas: [
      "Python",
      "TensorFlow",
      "PyTorch",
      "Scikit-learn",
      "Google Colab",
      "Hugging Face",
    ],
    dificuldade: 5,
    cargos: [
      "Engenheiro de ML Júnior",
      "Pesquisador de IA",
      "Desenvolvedor de IA",
      "Engenheiro de Dados",
    ],
    faixaSalarial: "R$ 4.000 a R$ 8.000 (trainee/júnior)",
    cursosGratuitos: [
      "fast.ai: Practical Deep Learning",
      "Coursera: Machine Learning (Andrew Ng, parcial gratuito)",
      "Google: Machine Learning Crash Course",
    ],
    roadmapInicial: [
      "Aprender Python",
      "Aprender estatística básica",
      "Estudar Machine Learning com Scikit-learn",
      "Praticar no Kaggle",
      "Aprender Deep Learning básico",
    ],
    projetos: [
      "Classificador de imagens simples",
      "Análise de sentimentos em textos",
      "Modelo de recomendação básico",
    ],
    termosEssenciais: [
      "Machine Learning",
      "Rede Neural",
      "Dataset",
      "Treinamento",
      "Modelo",
      "Overfitting",
    ],
    dicasIniciais:
      "Tenha base sólida em Python e estatística antes de entrar em Deep Learning. Kaggle é excelente para praticar.",
    requiresGraduation: "recomendado",
    tempoMedioFormacao: "2-3 anos com base em programação",
    crescimentoMercado: "alto",
    faculdadesRelacionadas: ["Ciência da Computação", "Engenharia de Software"],
    subareas: [
      {
        slug: "machine-learning",
        nome: "Machine Learning Engineer",
        descricaoCurta:
          "Constrói e implanta modelos de ML em produção. Foca na infraestrutura, MLOps e escala dos modelos.",
        descricaoCompleta:
          "Machine Learning Engineer é o profissional que transforma modelos de pesquisa em produtos reais. Enquanto o Cientista de Dados experimenta e treina modelos em notebooks, o ML Engineer pega esses modelos e os coloca em produção: cria APIs, monta pipelines de treino contínuo, monitora performance em tempo real, escala pra milhões de requisições. É a interseção entre engenharia de software e IA. Junta backend, cloud, MLOps e domínio de modelos. Cargo super aquecido em 2026 (BeBee registra 1.28M+ vagas relacionadas no Brasil) e um dos mais bem pagos da área de IA.",
        oQueFaz:
          "No dia a dia: pega modelos treinados pelos cientistas de dados e empacota pra produção (Docker, APIs REST), constrói pipelines automatizados de treino e re-treino, configura observabilidade pra modelos em produção (model drift, performance metrics), otimiza inferência pra reduzir latência e custo de cloud, e implementa testes automatizados pra garantir que mudanças não degradem qualidade. Trabalha com Cientistas de Dados (entrega input) e Engenheiros de Dados (consome dados via pipelines).",
        diferencasDaAreaMae:
          "Dentro de IA, o ML Engineer separa-se do Cientista de Dados pelo foco: cientista descobre soluções com matemática e estatística; ML Engineer entrega essas soluções em produção. Diferente do MLOps Engineer (que cuida só de infra de modelos), o ML Engineer ainda toca código de modelagem e tunning. É a porta de entrada ideal pra quem vem de backend ou DevOps e quer migrar pra IA, mais código, menos matemática pesada que o cientista puro.",
        habilidadesEspecificas: [
          "Python avançado e engenharia de software (testes, design patterns, APIs)",
          "Frameworks de ML em produção (scikit-learn, TensorFlow ou PyTorch)",
          "MLOps: pipelines, versionamento de modelos (MLflow, DVC), monitoramento",
          "Cloud (AWS SageMaker, GCP Vertex AI ou Azure ML)",
          "Otimização de inferência e arquitetura distribuída",
        ],
        ferramentasEspecificas: [
          "Python (com FastAPI ou Flask pra servir modelos)",
          "TensorFlow ou PyTorch",
          "MLflow (tracking + versionamento)",
          "Docker + Kubernetes (containerização e orquestração)",
          "AWS SageMaker / GCP Vertex AI",
          "Apache Airflow (orquestração de pipelines)",
        ],
        cargos: [
          "ML Engineer Júnior (0-2 anos)",
          "ML Engineer Pleno (2-5 anos)",
          "ML Engineer Sênior (5+ anos)",
          "Staff/Principal ML Engineer (lidera arquitetura ML da empresa)",
        ],
        faixaSalarial:
          "R$ 5.445 (júnior) a R$ 18.667 (sênior). Pleno gira em R$ 11.000-13.000. Especialistas em MLOps chegam a R$ 32.000+. Mercado super aquecido (BeBee: 1.28M+ vagas relacionadas).",
        dificuldade: 5,
        cursosGratuitos: [
          "Made With ML (madewithml.com): curso completo grátis de MLOps em inglês",
          "Google ML Crash Course: fundamentos práticos gratuitos",
          "Full Stack Deep Learning: bootcamp gratuito sobre como colocar ML em produção",
        ],
        projetosSugeridos: [
          "API REST que serve modelo de ML (FastAPI + Docker + deploy em cloud)",
          "Pipeline completo de re-treino: dados → treino → validação → deploy automático",
          "Sistema de monitoramento de modelo em produção com alertas de drift",
        ],
        roadmapEspecifico: [
          "Ter base sólida em Python + engenharia de software (testes, APIs, Git)",
          "Aprender ML básico (regressão, classificação, clustering com scikit-learn)",
          "Estudar MLOps: containerização (Docker), CI/CD pra modelos, versionamento",
          "Aprender uma cloud focada em ML (AWS SageMaker é o mais procurado)",
          "Construir portfólio: 2 projetos públicos com modelo em produção real",
        ],
        dicasIniciais:
          "Não tente entrar como ML Engineer sem experiência prévia em código de produção. Esse cargo cobra engenharia tanto quanto IA. Se você vem de backend, é o caminho mais rápido de entrar em IA (sua experiência de produção já vale). Se vem de ciência de dados, foque em DevOps e cloud (essa é sua lacuna). MLOps é o diferencial salarial: especialistas chegam a R$ 32k+.",
      },
      {
        slug: "nlp",
        nome: "NLP / LLMs",
        descricaoCurta:
          "Processamento de linguagem natural. Cria chatbots, sistemas de busca semântica, análise de sentimentos, integrações com LLMs.",
        descricaoCompleta:
          "Engenheiro de NLP (Natural Language Processing) é o especialista em fazer máquinas entenderem linguagem humana: texto, fala, comandos. Em 2026, a área se mistura cada vez mais com LLMs (Large Language Models como GPT, Claude, Gemini): NLP moderno é largamente sobre integrar e adaptar esses modelos pra problemas específicos. Aplicações: chatbots inteligentes, análise de sentimento em redes sociais, sistemas de busca semântica, classificação automática de documentos, tradução, geração de conteúdo. Salários sêniores chegam a R$ 25-35k em fintechs e big techs (cargo entre os melhor pagos em IA).",
        oQueFaz:
          "No dia a dia: constrói pipelines pra processar grandes volumes de texto (tokenização, limpeza, embeddings), treina ou fine-tuna modelos pra tarefas específicas (classificação de tickets, extração de entidades, análise de sentimento), integra LLMs em produtos via APIs (OpenAI, Anthropic, Google), implementa sistemas de busca semântica com vector databases (Pinecone, Weaviate), avalia qualidade de modelos (acurácia, latência, custo de tokens) e produtiza modelos com MLOps.",
        diferencasDaAreaMae:
          "Dentro de IA, o NLP separa-se do Machine Learning Engineer geral pela especialização: trabalha exclusivamente com dados de texto e fala, não imagens ou números. Diferente do Cientista de Dados (que pode usar NLP como uma ferramenta), o engenheiro de NLP vive disso. Em 2026, fronteira entre NLP clássico e Engenharia de Prompt está borrada. Quem é forte tecnicamente faz os dois. Cargo super valorizado em chatbots, search e qualquer produto que processe linguagem.",
        habilidadesEspecificas: [
          "Python avançado + bibliotecas (Hugging Face Transformers, spaCy, NLTK)",
          "Fine-tuning de LLMs (PEFT, LoRA, RLHF básico)",
          "Embeddings e vector search (sentence-transformers, cosine similarity)",
          "Conhecimento profundo de arquitetura Transformer",
          "MLOps específico pra NLP (model serving, monitoring de drift linguístico)",
        ],
        ferramentasEspecificas: [
          "Hugging Face Transformers + Hub (biblioteca padrão da área)",
          "spaCy (NLP tradicional e pipelines)",
          "PyTorch ou TensorFlow",
          "Vector databases (Pinecone, Weaviate, Qdrant)",
          "OpenAI/Anthropic/Google APIs (LLMs em produção)",
          "LangChain ou LlamaIndex (orquestração de LLMs)",
        ],
        cargos: [
          "NLP Engineer Júnior (0-2 anos, raro)",
          "NLP Engineer Pleno (2-5 anos)",
          "NLP Engineer Sênior (5+ anos)",
          "Staff NLP / Lead AI Engineer",
        ],
        faixaSalarial:
          "R$ 8.000 (júnior) a R$ 35.000+ (sênior). Pleno gira em R$ 13-20k. Sêniores em big techs e fintechs chegam a R$ 25-35k. Remoto pra fora paga US$ 8-15k/mês.",
        dificuldade: 5,
        cursosGratuitos: [
          "Hugging Face: NLP Course (curso oficial gratuito, completo, em inglês)",
          "Stanford CS224N (NLP with Deep Learning): playlists no YouTube gratuitas",
          "DeepLearning.AI: NLP Specialization (Coursera audit gratuito)",
        ],
        projetosSugeridos: [
          "Classificador de sentimento fine-tuned (BERT ou similar) com dataset público",
          "Sistema de busca semântica completo (embeddings + vector DB + interface)",
          "Chatbot especialista em domínio usando LLM + RAG (retrieval augmented generation)",
        ],
        roadmapEspecifico: [
          "Ter base sólida em Python e Machine Learning tradicional",
          "Aprender arquitetura Transformer profundamente (paper Attention Is All You Need)",
          "Dominar Hugging Face Transformers (fine-tuning, inference, deployment)",
          "Estudar RAG e vector search (essencial em 2026)",
          "Construir portfólio público: 2-3 projetos com modelos em produção",
        ],
        dicasIniciais:
          "NLP em 2026 é largamente sobre LLMs. Não fica preso só em NLP clássico (spaCy, NLTK). Domine Hugging Face: é a porta de entrada da área. Inglês é absolutamente obrigatório (toda doc, papers e community estão em inglês). Acompanhe papers de NLP no arxiv (busca por 'arxiv-sanity'). Subárea com salários top da IA. Vale o investimento técnico pesado.",
      },
      {
        slug: "visao-computacional",
        nome: "Visão Computacional",
        descricaoCurta:
          "Modelos pra entender imagens e vídeos. Detecção de objetos, reconhecimento facial, OCR, segmentação.",
        descricaoCompleta:
          "Engenheiro de Visão Computacional é o especialista em fazer máquinas interpretarem imagens e vídeos. Em 2026, é uma das áreas mais transversais e inovadoras de IA: carros autônomos (Tesla), drones agrícolas, robôs cirúrgicos, reconhecimento facial em segurança, detecção de defeitos em linhas de produção, leitura automática de documentos (OCR). Cargo super especializado e bem pago: nos EUA Computer Vision Engineer ganha US$ 162k/ano (Glassdoor 2026), 74% mais que Analista de Dados. No Brasil, mercado em crescimento. Sigmoidal aponta crescimento de 150% ao ano. Salários: pleno R$ 10-18k, sêniores em empresas industriais e fintechs chegam a R$ 20-30k+.",
        oQueFaz:
          "No dia a dia: treina modelos de detecção de objetos (YOLO, Faster R-CNN) pra aplicações reais, trabalha com OpenCV pra processamento clássico de imagens, faz fine-tuning de modelos pré-treinados (CNNs, Vision Transformers), prepara datasets anotados (CVAT, Roboflow) com data augmentation, otimiza inferência embarcada (NVIDIA Jetson, TensorRT) pra rodar em dispositivos edge, e produtiza modelos com MLOps (versionamento, monitoring). Em indústria, trabalha com calibração de câmeras e integração físico-digital.",
        diferencasDaAreaMae:
          "Dentro de IA, Visão Computacional separa-se de NLP pela modalidade. Uma trabalha com imagens/vídeos, outra com texto/fala. Diferente do Machine Learning Engineer genérico, especialização profunda em CNNs, Vision Transformers e processamento de imagens. Mais técnica que NLP em alguns aspectos. Exige álgebra linear, geometria 3D, calibração óptica. Cargo perfeito pra quem gosta de IA aplicada a problemas físicos (robótica, indústria 4.0, agronegócio, saúde).",
        habilidadesEspecificas: [
          "Python avançado + PyTorch ou TensorFlow",
          "OpenCV profundo (processamento clássico + integração com deep learning)",
          "Arquiteturas modernas (CNNs, Vision Transformers, YOLO, Segment Anything)",
          "Otimização de inferência (TensorRT, ONNX, CUDA, edge computing)",
          "Anotação e preparação de datasets (CVAT, Roboflow, data augmentation)",
        ],
        ferramentasEspecificas: [
          "Python + PyTorch (padrão moderno) ou TensorFlow",
          "OpenCV (processamento clássico de imagens)",
          "Ultralytics YOLO (detecção de objetos state-of-the-art)",
          "CVAT ou Roboflow (anotação de datasets)",
          "NVIDIA Jetson + TensorRT (inferência embarcada)",
          "MLflow ou Weights & Biases (tracking de experimentos)",
        ],
        cargos: [
          "Engenheiro de Visão Computacional Júnior (raro, 0-2 anos)",
          "Engenheiro de Visão Computacional Pleno (3-5 anos)",
          "Engenheiro de Visão Computacional Sênior (5+ anos)",
          "Staff Computer Vision Engineer / Lead AI",
        ],
        faixaSalarial:
          "R$ 5.621 (júnior raro) a R$ 30.000+ (sênior em indústria/big tech). Pleno gira em R$ 10-18k. Especialistas em empresas industriais (agro, manufatura) e remoto pra fora chegam a R$ 25-35k. Nos EUA, US$ 162k médio.",
        dificuldade: 5,
        cursosGratuitos: [
          "Sigmoidal (sigmoidal.ai): tutoriais gratuitos em PT-BR sobre Visão Computacional",
          "PyImageSearch (Adrian Rosebrock): tutoriais práticos OpenCV + Deep Learning",
          "Stanford CS231n: Convolutional Neural Networks for Visual Recognition (YouTube grátis)",
        ],
        projetosSugeridos: [
          "Sistema de detecção de objetos em tempo real (YOLO + webcam) com classificação customizada",
          "OCR completo: extração de texto de imagens de documentos (recibos, RG) com pós-processamento",
          "Segmentação de imagens médicas ou agrícolas com U-Net ou SAM (Segment Anything)",
        ],
        roadmapEspecifico: [
          "Ter base sólida em Python + Machine Learning + álgebra linear",
          "Aprender OpenCV (processamento clássico ainda muito usado)",
          "Estudar arquiteturas CNN (ResNet, EfficientNet) profundamente",
          "Aprofundar em modelos modernos: YOLO, Vision Transformers, Segment Anything",
          "Construir portfólio público com 2-3 projetos completos (GitHub + Kaggle)",
        ],
        dicasIniciais:
          "Subárea mais técnica de IA. Não tente entrar sem base sólida em ML. Sigmoidal é a referência BR. Siga blog e cursos. Para projetos: comece com YOLO (mais acessível) antes de modelos mais complexos. Inglês é obrigatório (papers em arxiv, doc em inglês). Especialização em agronegócio ou indústria 4.0 paga muito bem no BR. Cargo perfeito pra quem ama o lado físico/visual da IA.",
      },
      {
        slug: "prompt-engineering",
        nome: "Engenharia de Prompt",
        descricaoCurta:
          "Especialização em projetar prompts eficazes pra LLMs. Subárea emergente, crescimento explosivo.",
        descricaoCompleta:
          "Engenharia de Prompt (ou Prompt Engineering) é a subárea de IA mais emergente do mercado em 2026: profissional que projeta, testa e otimiza instruções pra modelos de linguagem como ChatGPT, Claude e Gemini. Não é só 'fazer perguntas'. É arquitetar interações que extraem resultados consistentes, escaláveis e alinhados a objetivos de negócio. Subárea em expansão rápida desde 2024, uma das áreas de crescimento mais acelerado dentro do mercado de IA. Salários no Brasil já variam de R$ 4-15k+ pra CLT, com pleno em R$ 12-18k e sênior ultrapassando R$ 20k. Freelancers internacionais cobram US$ 50-200/hora. Não exige diploma. Exige portfólio sólido.",
        oQueFaz:
          "No dia a dia: projeta prompts pra casos de uso específicos (atendimento ao cliente, geração de conteúdo, análise de documentos), testa variações e mede qualidade (acurácia, custo, latência), integra LLMs em sistemas via APIs (OpenAI, Anthropic, Google), otimiza custo de tokens em pipelines automatizados, treina equipes a usar IA generativa com eficiência, e desenvolve bibliotecas de prompts pra setores específicos (jurídico, saúde, marketing).",
        diferencasDaAreaMae:
          "Dentro de IA, o Prompt Engineer separa-se do Machine Learning Engineer pela abordagem: ML Engineer constrói modelos do zero; Prompt Engineer usa modelos prontos e otimiza interações com eles. Diferente do Cientista de Dados (matemática + modelagem), o Prompt Engineer trabalha com linguagem natural e raciocínio sobre como LLMs interpretam instruções. É a porta de entrada mais acessível pra IA em 2026. Não exige cálculo nem programação avançada, só pensamento estruturado e curiosidade pelos modelos.",
        habilidadesEspecificas: [
          "Domínio prático de LLMs principais (ChatGPT, Claude, Gemini)",
          "Técnicas avançadas (few-shot learning, chain-of-thought, role prompting)",
          "Compreensão de tokens, contexto, temperatura e alucinação",
          "Comunicação clara em linguagem natural (escrita estruturada)",
          "Python básico pra automação via APIs (diferencial)",
        ],
        ferramentasEspecificas: [
          "ChatGPT (Plus com GPT-4): generalista",
          "Claude (Opus/Sonnet): contexto longo e raciocínio complexo",
          "Gemini: busca atualizada e multimodal",
          "OpenAI Playground (testar parâmetros)",
          "Anthropic Workbench (testar Claude)",
          "Python + APIs (automatizar prompts em escala)",
        ],
        cargos: [
          "Prompt Engineer Júnior (0-1 ano)",
          "Prompt Engineer Pleno (1-3 anos)",
          "Senior Prompt Engineer / AI Strategist (3+ anos)",
          "Head of AI Implementation (líder técnico de IA generativa)",
        ],
        faixaSalarial:
          "R$ 4.000 (júnior) a R$ 20.000+ (sênior). Pleno gira em R$ 12-18k. Freelance internacional: US$ 50-200/hora. Sêniores nos EUA passam US$ 126k/ano. Mercado em fase inicial. Quem entra agora pega salários acima do normal pelo gap de profissionais.",
        dificuldade: 2,
        cursosGratuitos: [
          "Anthropic: Prompt Engineering Course (oficial gratuito)",
          "DeepLearning.AI: Prompt Engineering for Developers (curso grátis)",
          "OpenAI Cookbook + documentação oficial (gratuita)",
        ],
        projetosSugeridos: [
          "Biblioteca de 30+ prompts pra setor específico (jurídico, marketing, saúde) publicada no GitHub",
          "Sistema de atendimento automatizado usando LLM (chatbot com contexto da empresa)",
          "Comparação 'antes vs depois': prompt genérico vs prompt otimizado mostrando ganho mensurável",
        ],
        roadmapEspecifico: [
          "Ler documentações oficiais de OpenAI, Anthropic e Google sobre prompting",
          "Praticar técnicas avançadas (few-shot, chain-of-thought, role play, structured output)",
          "Aprender Python básico pra usar APIs (multiplica oportunidades)",
          "Construir biblioteca pessoal de prompts pra setores que te interessam",
          "Publicar portfólio online: casos antes/depois + bibliotecas + redução de custos demonstrada",
        ],
        dicasIniciais:
          "Subárea perfeita pra entrar em IA sem base técnica forte. Não exige diploma, exige portfólio. Documente TUDO: cada prompt otimizado vira evidência no portfólio. Use o framework 'antes vs depois' nas suas demonstrações. Mostre ganho real (qualidade, redução de tokens, tempo). Inglês é obrigatório (toda doc oficial está em inglês). Aprenda Python básico. Sem ele, você fica no nível 'usuário avançado'; com ele, você é Prompt Engineer de verdade. Mercado em fase explosiva. Quem entrar agora vai estar na primeira onda de seniores em 2-3 anos.",
      },
      {
        slug: "mlops",
        nome: "MLOps",
        descricaoCurta:
          "Engenharia de operações pra ML. Pipelines de treinamento, deploy contínuo de modelos, monitoramento.",
        descricaoCompleta:
          "MLOps Engineer é o profissional que aplica princípios de DevOps especificamente pra Machine Learning: automatiza pipelines de treino, faz deploy contínuo de modelos em produção, monitora drift e performance, e garante reprodutibilidade. Não é o mesmo que ML Engineer. MLOps é mais focado em infraestrutura e operação, menos em código de modelagem. Cargo crítico em empresas que rodam dezenas de modelos em produção (Nubank, iFood, Stone). Salário super competitivo: média BR R$ 18.667 (Glassdoor), sêniores em fintechs ultrapassam R$ 32k. Mercado em expansão acelerada, 379k+ vagas relacionadas no BeBee.",
        oQueFaz:
          "No dia a dia: constrói pipelines automatizados de treino de modelos (data → train → eval → deploy), implementa CI/CD específico pra ML (model testing, A/B testing em produção), monitora modelos em produção (drift detection, performance metrics, custo de cloud), versiona modelos e datasets (MLflow, DVC), gerencia feature stores, e otimiza infraestrutura (GPU usage, latência de inferência, custo). Trabalha próximo a Cientistas de Dados (entrega input) e ML Engineers (compartilha responsabilidades).",
        diferencasDaAreaMae:
          "Dentro de IA, o MLOps separa-se do ML Engineer pela ênfase: ML Engineer toca código de modelagem + produção; MLOps Engineer foca quase exclusivamente em operação, infraestrutura e governança de modelos. Diferente do DevOps tradicional, MLOps lida com complexidades específicas de ML (drift de dados, retreino contínuo, versionamento de datasets, custo de GPU). Cargo super especializado. Entrada exige base de DevOps ou ML Engineer.",
        habilidadesEspecificas: [
          "Kubernetes e Docker pra deploy de modelos",
          "Pipelines de ML (Kubeflow, Airflow, MLflow Pipelines)",
          "Versionamento de modelos e dados (MLflow, DVC, Weights & Biases)",
          "Monitoring de produção (Evidently, WhyLabs, Prometheus)",
          "Cloud específico pra ML (SageMaker, Vertex AI, Azure ML)",
        ],
        ferramentasEspecificas: [
          "MLflow (tracking + registry de modelos)",
          "Kubeflow ou Vertex AI Pipelines",
          "Docker + Kubernetes",
          "Weights & Biases ou Comet (experiment tracking)",
          "DVC (data version control)",
          "Evidently AI ou Arize (monitoring de drift)",
        ],
        cargos: [
          "MLOps Engineer Pleno (vindo de DevOps ou ML, 3+ anos)",
          "MLOps Engineer Sênior (5+ anos)",
          "Staff MLOps / Lead ML Platform",
          "Principal MLOps / Head of ML Engineering",
        ],
        faixaSalarial:
          "R$ 7.917 (júnior raro) a R$ 32.667 (sênior). Média BR R$ 18.667, Glassdoor 2026. Pleno gira em R$ 15-22k. Sêniores em fintechs e big techs chegam a R$ 30k+. Cargo mais bem pago da área de IA.",
        dificuldade: 5,
        cursosGratuitos: [
          "Made With ML (madewithml.com): curso completo grátis de MLOps em inglês",
          "Full Stack Deep Learning: bootcamp gratuito sobre ML em produção",
          "Google Cloud: MLOps Engineer Learning Path (parte gratuita)",
        ],
        projetosSugeridos: [
          "Pipeline MLOps completo: GitHub Actions + MLflow + deploy em K8s + monitoring",
          "Sistema de retreino automático: drift detected → trigger retrain → A/B deploy",
          "Feature store funcional + serving online + offline com Feast ou Tecton",
        ],
        roadmapEspecifico: [
          "Ter base sólida em DevOps (Docker, K8s, CI/CD, cloud), 2+ anos",
          "Aprender fundamentos de ML (não precisa ser cientista, mas entender pipeline)",
          "Estudar MLflow profundamente (referência absoluta da área)",
          "Dominar uma cloud focada em ML (SageMaker é o mais procurado)",
          "Construir portfólio: 1-2 sistemas MLOps completos em produção (open source)",
        ],
        dicasIniciais:
          "MLOps é o cargo mais bem pago de IA em 2026. Vale o investimento pesado. Não tente entrar sem base de DevOps OU ML Engineering. Esse cargo cobra os dois mundos. Vindo de DevOps, foque em ML (pipelines, model serving, monitoring). Vindo de ML, foque em DevOps (K8s, CI/CD, observabilidade). Inglês é obrigatório. Acompanhe MLOps Community (Slack ativo) e neptune.ai blog.",
      },
    ],
  },
  {
    id: "produto",
    nome: "Produto Digital",
    slug: "produto",
    icon: Target,
    tagClass: "tag-produto",
    descricaoCurta: "Lidera a estratégia e evolução de produtos digitais.",
    descricaoCompleta:
      "O gerente de produto (PM) é responsável por definir a visão, estratégia e roadmap de um produto digital. Conecta negócio, tecnologia e usuário para garantir que o produto certo seja construído da forma certa.",
    oQueFaz:
      "Define prioridades de produto, escreve especificações, analisa métricas, conduz pesquisas com usuários e alinha times de desenvolvimento e design.",
    tarefasDiarias: [
      "Escrever histórias de usuário",
      "Priorizar backlog",
      "Analisar métricas de produto",
      "Conduzir reuniões de discovery",
      "Alinhar stakeholders",
    ],
    perfilIndicado:
      "Gosta de estratégia, comunicação e de conectar diferentes áreas. Tem visão de negócio e empatia com usuários.",
    habilidades: [
      "Comunicação",
      "Análise de dados",
      "Metodologias ágeis",
      "Pensamento estratégico",
      "Pesquisa com usuários",
    ],
    ferramentas: ["Jira", "Notion", "Figma", "Mixpanel", "Miro", "Amplitude"],
    dificuldade: 3,
    cargos: [
      "Assistente de Produto",
      "Analista de Produto",
      "Product Manager Júnior",
      "Product Owner",
    ],
    faixaSalarial: "R$ 3.000 a R$ 6.000 (trainee/júnior/assistente)",
    cursosGratuitos: [
      "Product School: Cursos gratuitos",
      "DIO: Product Management",
      "YouTube: Canais de PM em português",
    ],
    roadmapInicial: [
      "Entender o que é produto digital",
      "Aprender metodologias ágeis (Scrum, Kanban)",
      "Estudar métricas de produto",
      "Fazer curso de Product Management",
      "Criar documento de produto fictício",
    ],
    projetos: [
      "Documento de requisitos de app fictício",
      "Análise de produto existente",
      "Roadmap de produto para startup imaginária",
    ],
    termosEssenciais: [
      "Roadmap",
      "Backlog",
      "Sprint",
      "KPI",
      "Discovery",
      "Stakeholder",
    ],
    dicasIniciais:
      "Comece entendendo metodologias ágeis e métricas. Analise produtos que você usa no dia a dia criticamente.",
    requiresGraduation: "opcional",
    tempoMedioFormacao: "1-2 anos via transição de carreira",
    crescimentoMercado: "medio",
    faculdadesRelacionadas: [],
    subareas: [
      {
        slug: "product-manager",
        nome: "Product Manager",
        descricaoCurta:
          "Define visão, estratégia e roadmap do produto. Conecta negócio, tecnologia e usuários.",
        descricaoCompleta:
          "Product Manager (ou PM) é o profissional que decide o que construir e por quê. Não é quem implementa o código nem desenha as telas, mas é quem orquestra tudo. Conecta visão de negócio com necessidade do usuário e capacidade técnica do time. É um dos cargos mais estratégicos em produtos digitais: define roadmap, prioriza features, mede sucesso, lidera (sem ter autoridade direta) times de dev, design e marketing. Mercado super aquecido no Brasil. Glassdoor registra 6.646 salários, com média de R$ 14.667. Em fintechs e big techs (Nubank, Shopee, iFood, XP), sêniores podem ultrapassar R$ 28k.",
        oQueFaz:
          "No dia a dia: conversa com usuários e stakeholders pra entender problemas reais, define hipóteses e métricas de sucesso (OKRs), prioriza backlog com frameworks (RICE, MoSCoW), escreve PRDs (Product Requirements Documents), faz discovery contínuo com pesquisa qualitativa e análise de dados, alinha visão com lideranças e comunica decisões pra todos os times. Toma centenas de pequenas decisões por semana: quem o produto deve servir, quais features adiar, quando lançar, como medir impacto.",
        diferencasDaAreaMae:
          "Dentro de Produto Digital, o PM separa-se do Product Owner pelo escopo: PO foca em execução tática (backlog, refinamento com devs); PM cobre estratégia e visão completa do produto. Diferente do Product Marketing Manager (que cuida do posicionamento e go-to-market), o PM trabalha mais cedo no ciclo, antes do produto existir. É o cargo mais procurado e mais bem pago de Produto, mas também o mais ambíguo: o que se espera de um PM varia muito entre startup early stage e big tech.",
        habilidadesEspecificas: [
          "Product discovery (entrevistas com usuário, pesquisa qualitativa)",
          "Análise de dados e métricas de produto (SQL básico, GA4, Mixpanel)",
          "Frameworks de priorização (RICE, ICE, MoSCoW, Kano)",
          "Storytelling e comunicação com stakeholders de diferentes níveis",
          "Visão estratégica de negócio (unit economics, modelos de receita, métricas de saúde)",
        ],
        ferramentasEspecificas: [
          "Jira ou Linear (gestão de backlog)",
          "Figma (revisar designs e prototipar fluxos básicos)",
          "Notion ou Confluence (documentação de produto e PRDs)",
          "Mixpanel, Amplitude ou Google Analytics (analytics de produto)",
          "Miro ou FigJam (mapeamento e workshops)",
          "Hotjar ou Microsoft Clarity (análise comportamental)",
        ],
        cargos: [
          "Product Manager Júnior / APM: Associate Product Manager (0-2 anos)",
          "Product Manager Pleno (2-5 anos)",
          "Product Manager Sênior (5+ anos)",
          "Group/Lead PM ou Head of Product (liderança de múltiplos times)",
        ],
        faixaSalarial:
          "R$ 7.000 (júnior) a R$ 28.000 (sênior em fintechs/big techs). Média BR R$ 12-15k, segundo pesquisa da PM3 e Glassdoor (6.646 salários). Especialistas em produto técnico ou growth chegam a R$ 32k+.",
        dificuldade: 4,
        cursosGratuitos: [
          "PM3: Blog e webinars gratuitos (referência BR em produto)",
          "Reforge (reforge.com): newsletter e conteúdos gratuitos sobre produto e growth",
          "Lenny's Newsletter: newsletter gratuita do Lenny Rachitsky (referência global em PM)",
        ],
        projetosSugeridos: [
          "Análise crítica de um produto existente: o que mudaria, por quê, qual métrica esperaria mover",
          "PRD completo de uma feature hipotética: contexto, problema, solução, métricas de sucesso",
          "Plano de discovery de 4 semanas pra um produto novo (entrevistas, hipóteses, validação)",
        ],
        roadmapEspecifico: [
          "Estudar fundamentos de produto (PM3 Blog, Lenny's Newsletter, livro 'Inspired' do Marty Cagan)",
          "Aprender frameworks de priorização e discovery (RICE, Jobs to be Done, Continuous Discovery)",
          "Construir base de dados: SQL básico + ferramentas de analytics (Mixpanel, GA4)",
          "Fazer um case real: escrever PRD detalhado de um produto que você usa",
          "Conectar com PMs no LinkedIn, fazer mentoria, e candidatar-se a APM em startups",
        ],
        dicasIniciais:
          "Não precisa de graduação específica. PMs vêm de engenharia, design, marketing, negócios. O que importa é portfólio + comunicação. Escreva análises públicas de produtos que você usa (Medium, LinkedIn). Isso é currículo. Foque em entender discovery profundo: a maioria dos PMs juniores erra ao pular pesquisa pra ir direto pra solução. SQL básico é cada vez mais cobrado. Invista 2 semanas pra dominar consultas básicas.",
      },
      {
        slug: "product-owner",
        nome: "Product Owner",
        descricaoCurta:
          "Foco em execução: backlog, priorização, refinamento com o time de devs. Mais tático que estratégico.",
        descricaoCompleta:
          "Product Owner (PO) é o profissional ágil responsável por priorizar e executar o backlog de produto junto ao time de desenvolvimento. Diferente do Product Manager (que pensa estratégia e visão), o PO atua mais próximo do dia a dia do time Scrum: refina histórias de usuário, conduz cerimônias, valida entregas, mantém o backlog priorizado. É um cargo essencial em times ágeis e o caminho mais comum de entrada pra área de produto no Brasil. Salários partem de R$ 4-6k pra júnior e chegam a R$ 12-15k pra sênior. Certificações Scrum (PSPO, CSPO) são valorizadas. Confusão constante com PM, mas papéis distintos no Scrum oficial.",
        oQueFaz:
          "No dia a dia: refina histórias de usuário com critérios de aceite claros pro time de dev, prioriza backlog conforme valor de negócio e capacidade do time, conduz cerimônias ágeis (planning, review, retrospectiva, refinement), atua como ponte entre stakeholders e time técnico, valida entregas garantindo aderência aos requisitos, e ajusta prioridades conforme feedback de usuário e métricas. Trabalha próximo do tech lead, do Scrum Master e dos stakeholders de negócio.",
        diferencasDaAreaMae:
          "Dentro de Produto Digital, o PO separa-se do Product Manager pelo foco: PM cuida de estratégia e visão (o quê e por quê construir); PO cuida de execução tática (como e quando entregar). Em startups pequenas, papéis se confundem. Uma pessoa faz tudo. Em empresas grandes, separam-se: PM define rumo, PO executa com o time. Diferente do Scrum Master (que facilita o processo ágil), o PO é dono do produto e responsável final pelo valor entregue. Cargo mais acessível pra iniciantes que PM. Exige menos visão estratégica e mais habilidade tática.",
        habilidadesEspecificas: [
          "Domínio do framework Scrum (cerimônias, papéis, artefatos)",
          "Escrita de histórias de usuário e critérios de aceite (formato Given-When-Then)",
          "Priorização tática (MoSCoW, ICE, WSJF, Kano)",
          "Comunicação com times técnicos (entender restrições e trade-offs)",
          "Gestão de stakeholders (alinhar expectativas, dizer 'não' bem)",
        ],
        ferramentasEspecificas: [
          "Jira ou Linear (gestão de backlog)",
          "Notion ou Confluence (documentação de histórias)",
          "Miro ou FigJam (mapeamento de jornadas e workshops)",
          "Figma (revisar protótipos com time de design)",
          "Google Analytics ou Mixpanel (validar entregas com dados)",
          "Slack ou Microsoft Teams (comunicação contínua com time)",
        ],
        cargos: [
          "Product Owner Júnior (0-2 anos)",
          "Product Owner Pleno (2-5 anos)",
          "Product Owner Sênior (5+ anos)",
          "Lead PO ou transição pra Product Manager",
        ],
        faixaSalarial:
          "R$ 4.000 (júnior) a R$ 15.000 (sênior). Média BR R$ 8.000-10.250, Glassdoor/Indeed 2026. PO em fintechs e empresas grandes chegam a R$ 12-15k. Certificações PSPO/CSPO aumentam empregabilidade.",
        dificuldade: 3,
        cursosGratuitos: [
          "Scrum.org: Scrum Guide oficial (gratuito, leitura essencial)",
          "Atlassian: Agile Coach (cursos gratuitos sobre Scrum e Jira)",
          "PM3: Blog e webinars gratuitos sobre POs e gestão ágil",
        ],
        projetosSugeridos: [
          "Backlog completo de um produto fictício com 20+ histórias priorizadas (publicar GitHub)",
          "Estudo de caso: refinar uma feature complexa de um produto que você usa",
          "Roadmap trimestral hipotético com critérios de priorização justificados",
        ],
        roadmapEspecifico: [
          "Estudar Scrum profundamente (Scrum Guide + framework completo)",
          "Aprender a escrever boas histórias de usuário (formato user story + critérios de aceite)",
          "Dominar ferramentas de backlog (Jira é o padrão no BR)",
          "Tirar certificação PSPO I (mais respeitada) ou CSPO",
          "Conseguir vaga como APO/PO Júnior em startup pra aprender na prática",
        ],
        dicasIniciais:
          "PO é mais acessível que PM pra quem está começando. Exige menos visão estratégica e mais domínio tático. Certificação PSPO I vale o investimento (custa US$ 200, dura pra sempre). Pratique escrever histórias de usuário (formato 'Como [usuário], quero [funcionalidade] pra [benefício]'). Não confunda PO com Scrum Master, papéis diferentes, complementares. Carreira natural: PO → Sênior → Product Manager (transição comum).",
      },
      {
        slug: "product-marketing",
        nome: "Product Marketing Manager",
        descricaoCurta:
          "Posicionamento, go-to-market, mensagem do produto. Ponte entre produto e marketing.",
        descricaoCompleta:
          "Product Marketing Manager (PMM) é a ponte entre produto e marketing: traduz capacidades técnicas em valor pro usuário, define posicionamento (como o produto é percebido), constrói narrativa de lançamento, e influencia decisões de produto baseado em pesquisa de mercado e concorrência. Cargo essencial em produtos SaaS, fintechs e empresas que vendem soluções complexas. Diferente do PM (que pensa o quê construir), o PMM pensa como comunicar e vender. Salários: pleno em fintechs gira R$ 12-18k, sêniores ultrapassam R$ 25k. Mercado BR em crescimento acelerado em 2026.",
        oQueFaz:
          "No dia a dia: define posicionamento e mensagem do produto (quem é o usuário, qual problema resolve, por que escolher), constrói materiais de go-to-market (landing pages, sales decks, FAQs), faz pesquisa de concorrência e benchmarking constante, treina times de vendas e suporte sobre o produto, lança features com narrativa coordenada (email + landing + redes), e mede impacto (ativação, conversão, retenção). Trabalha com PMs, marketing, vendas e customer success.",
        diferencasDaAreaMae:
          "Dentro de Produto Digital, o PMM separa-se claramente do Product Manager pelo foco: PM pensa o quê construir; PMM pensa como vender. Diferente do Marketing tradicional (focado em campanhas e brand), o PMM é mais técnico. Entende o produto profundamente. Cargo super comum em SaaS B2B (Hubspot, Salesforce, RD Station) onde a complexidade do produto exige tradução constante. Em B2C, é menos comum. Caminho natural pra quem vem de marketing e quer se especializar em produto.",
        habilidadesEspecificas: [
          "Posicionamento e mensagem (frameworks como April Dunford)",
          "Pesquisa de mercado e análise competitiva",
          "Go-to-market strategy (lançamento coordenado)",
          "Copywriting técnico (landing pages, materiais de venda)",
          "Métricas de produto e marketing (CAC, LTV, ativação, retenção)",
        ],
        ferramentasEspecificas: [
          "Notion ou Confluence (documentação de posicionamento)",
          "Figma (criar materiais visuais junto com design)",
          "Mixpanel ou Amplitude (analytics de produto)",
          "HubSpot ou similar (gestão de campanhas)",
          "Crayon ou Klue (competitive intelligence)",
          "Linear ou Jira (acompanhar lançamentos)",
        ],
        cargos: [
          "Product Marketing Manager Júnior (0-2 anos)",
          "Product Marketing Manager Pleno (2-5 anos)",
          "Senior Product Marketing Manager (5+ anos)",
          "Lead/Director of Product Marketing",
        ],
        faixaSalarial:
          "R$ 6.000 (júnior) a R$ 25.000+ (sênior em fintechs/big techs). Pleno gira em R$ 12-18k. Em SaaS B2B grandes (RD Station, Resultados Digitais, Tomtocom), sêniores chegam a R$ 20-30k.",
        dificuldade: 4,
        cursosGratuitos: [
          "April Dunford: Obviously Awesome (livro pago, mas resumos gratuitos disponíveis)",
          "Reforge: Product Marketing artigos gratuitos",
          "PMM Alliance: recursos gratuitos da maior comunidade global de PMMs",
        ],
        projetosSugeridos: [
          "Análise de posicionamento de produto existente + proposta de reposicionamento",
          "Plano de go-to-market completo pra um lançamento hipotético",
          "Battle card competitivo: produto X vs concorrente Y (formato comercial)",
        ],
        roadmapEspecifico: [
          "Estudar posicionamento (April Dunford é referência absoluta)",
          "Aprender frameworks de go-to-market e competitive analysis",
          "Dominar copywriting técnico (landing pages, narrativas de venda)",
          "Construir portfólio: 2-3 análises públicas de posicionamento de produtos conhecidos",
          "Network com PMMs em LinkedIn, comunidade BR ainda pequena, fácil de entrar",
        ],
        dicasIniciais:
          "Caminho ideal pra quem vem de marketing e quer entrar em produto. April Dunford é leitura obrigatória. 'Obviously Awesome' é a bíblia da área. Cargo super valorizado em SaaS B2B. Busque vagas nessas empresas. Inglês é importante (boa parte da literatura está em inglês). Comunidade BR ainda pequena. É fácil ser visto se você produz conteúdo público sobre posicionamento.",
      },
      {
        slug: "growth-product",
        nome: "Growth Product Manager",
        descricaoCurta:
          "Especialista em métricas de aquisição, ativação, retenção. Foco em experimentação e funil.",
        descricaoCompleta:
          "Growth Product Manager (Growth PM) é uma especialização de PM focada exclusivamente em crescimento, não no produto inteiro, mas em mover métricas específicas: aquisição, ativação, retenção, monetização (modelo AARRR). Trabalha com experimentação contínua (A/B tests semanais), análise profunda de funil, e otimização de conversão em pontos críticos. Cargo super valorizado em empresas em escala rápida (fintechs, e-commerces, SaaS). Salário top da família PM: média BR R$ 16.661 (Glassdoor), pleno R$ 15-22k, sênior em fintechs/big techs chega a R$ 28-35k+.",
        oQueFaz:
          "No dia a dia: identifica gargalos no funil de produto (onde usuários caem), formula hipóteses pra reduzir esses gargalos, projeta experimentos (A/B tests, holdouts), analisa resultados estatisticamente, escala o que funciona e mata o que não funciona, e itera continuamente. Trabalha próximo a engenheiros (implementar experimentos), data analysts (medir resultados) e marketing (alinhar canais de aquisição). Pensamento orientado a métricas é a base do trabalho.",
        diferencasDaAreaMae:
          "Dentro de Produto Digital, o Growth PM separa-se do Product Manager pelo foco: PM pensa visão de longo prazo (roadmap, problemas grandes); Growth PM pensa otimização de curto prazo (métricas movendo agora). Diferente do Product Marketing Manager (que cuida de posicionamento e go-to-market), Growth PM é mais técnico e analítico. Vive de A/B testing. Cargo perfeito pra quem vem de marketing performance ou data analytics e quer entrar em produto com viés quantitativo.",
        habilidadesEspecificas: [
          "Análise estatística básica (significância, intervalos de confiança, sample size)",
          "Domínio profundo de funil AARRR (Aquisição, Ativação, Retenção, Receita, Recomendação)",
          "Experimentação rigorosa (A/B testing, multivariado, holdouts)",
          "SQL avançado pra análise de dados (não pode depender só de analista)",
          "Storytelling com dados pra defender decisões pra liderança",
        ],
        ferramentasEspecificas: [
          "Mixpanel ou Amplitude (analytics de produto)",
          "Statsig, LaunchDarkly ou GrowthBook (feature flags + A/B testing)",
          "SQL (PostgreSQL, BigQuery, Snowflake)",
          "Hotjar ou FullStory (análise comportamental)",
          "Notion ou Coda (documentar hipóteses e experimentos)",
          "Looker ou Tableau (dashboards de growth)",
        ],
        cargos: [
          "Growth PM Júnior (0-2 anos, raro)",
          "Growth PM Pleno (2-5 anos)",
          "Senior Growth PM (5+ anos)",
          "Head of Growth / VP Growth",
        ],
        faixaSalarial:
          "R$ 8.000 (júnior) a R$ 35.000+ (sênior). Média BR R$ 16.661, Glassdoor 2026. Pleno gira em R$ 15-22k. Sêniores em fintechs e big techs (Nubank, iFood, Stone) ultrapassam R$ 28-35k.",
        dificuldade: 4,
        cursosGratuitos: [
          "Reforge: artigos gratuitos sobre growth (referência mundial)",
          "Lenny's Newsletter: gratuita, com 1-2 posts/mês sobre growth",
          "GrowthHackers Community + casos públicos de A/B tests (gratuito)",
        ],
        projetosSugeridos: [
          "Análise de funil de produto existente: identificar gargalos + propor 3 experimentos",
          "Documentar 5 A/B tests hipotéticos completos (hipótese, métrica, sample size, resultado esperado)",
          "Estudo de growth de produto conhecido: deconstruir estratégia de aquisição + retenção",
        ],
        roadmapEspecifico: [
          "Ter base de PM tradicional (discovery, priorização, métricas)",
          "Estudar funil AARRR a fundo (livro 'Lean Analytics' é referência)",
          "Aprender estatística aplicada a A/B tests (significância, poder estatístico)",
          "Dominar SQL pra análises sem depender de analista",
          "Conseguir transição interna: PM tradicional → Growth PM no mesmo time",
        ],
        dicasIniciais:
          "Growth PM é cargo mais técnico que PM tradicional. Invista em SQL e estatística. Mira fintechs e produtos em escala (eles precisam de growth). Inglês é importante (Reforge, Lenny's, melhores recursos em inglês). Comunidade brasileira de growth ainda pequena. Produzir conteúdo público sobre experimentos abre portas. Cargo perfeito pra perfis analíticos.",
      },
      {
        slug: "product-ops",
        nome: "Product Ops",
        descricaoCurta:
          "Padroniza processos de produto, ferramentas e métricas em times maiores. Cargo emergente.",
        descricaoCompleta:
          "Product Operations (Product Ops) é a especialização emergente que cuida da infraestrutura, processos e dados que permitem times de produto escalarem com qualidade. Diferente do PM (foco em estratégia) e PO (foco em execução), o Product Ops cuida do 'como' do trabalho de produto: documentação centralizada, métricas unificadas, ferramentas, onboarding de novos PMs. Cargo nasceu em big techs (Atlassian, HubSpot) e está chegando ao BR via fintechs e scale-ups. Salários: pleno gira R$ 10-18k, sêniores em fintechs e empresas com 30+ PMs chegam a R$ 20-28k. Mercado em formação. Quem entrar agora pega salários acima do normal.",
        oQueFaz:
          "No dia a dia: centraliza documentação de produto (PRDs, decisões, contextos) em ferramentas como Notion, define padrões e templates pra PRDs e roadmaps, gerencia ferramentas do time (Jira, Linear, Mixpanel, Productboard), constrói dashboards unificados de métricas de produto, faz onboarding de novos PMs, organiza rituais transversais (product review, sprint planning de produto), e atua como ponte entre Produto, Engenharia, Design e Negócio. Em times grandes, virou função essencial.",
        diferencasDaAreaMae:
          "Dentro de Produto Digital, o Product Ops é a evolução em escala, diferente do PM (que toma decisões sobre produto) e PO (que executa), o Product Ops cuida da 'engrenagem' que permite múltiplos PMs trabalharem bem. Não toma decisões sobre o produto em si. Toma decisões sobre como o time trabalha. Cargo super valorizado em empresas com 10+ PMs (escalabilidade), inútil em startups pequenas. Caminho típico: PM ou PO sênior que ama processos → Product Ops.",
        habilidadesEspecificas: [
          "Visão sistêmica de processos de produto (do discovery ao launch)",
          "Domínio profundo de ferramentas de produto (Jira, Linear, Productboard, Notion)",
          "Análise de dados e SQL básico (medir o trabalho do time)",
          "Documentação clara e versionada (criar templates e padrões)",
          "Comunicação executiva (apresentar métricas pra C-level)",
        ],
        ferramentasEspecificas: [
          "Notion ou Confluence (centralização de conhecimento)",
          "Productboard ou Aha! (gestão de roadmap em escala)",
          "Jira ou Linear (gestão de execução)",
          "Mixpanel ou Amplitude (analytics unificado)",
          "Looker ou Mode (dashboards de métricas de produto)",
          "Loom (comunicação assíncrona)",
        ],
        cargos: [
          "Product Ops Pleno (vindo de PM/PO, 3+ anos)",
          "Senior Product Ops (5+ anos)",
          "Lead Product Ops / Head of Product Operations",
          "VP Product Operations (empresas com 50+ PMs)",
        ],
        faixaSalarial:
          "R$ 8.000 (entrada) a R$ 28.000+ (sênior em fintechs). Pleno gira em R$ 10-18k. Sêniores em empresas com times grandes de produto chegam a R$ 20-28k. Cargo emergente no BR, salários acima do esperado por gap de profissionais.",
        dificuldade: 4,
        cursosGratuitos: [
          "Product Operations Council: recursos gratuitos sobre a disciplina",
          "Lenny's Newsletter: artigos gratuitos sobre Product Ops (Marin Smiljanic é referência)",
          "PM3: Blog com artigos sobre escalabilidade de produto",
        ],
        projetosSugeridos: [
          "Auditoria de processos de produto de empresa fictícia: mapear gaps + propor melhorias",
          "Construir template de PRD + processo de discovery padrão pra time hipotético de 5 PMs",
          "Dashboard unificado de métricas de produto: definir KPIs principais + visualização",
        ],
        roadmapEspecifico: [
          "Ter 3+ anos como PM ou PO em times com múltiplas pessoas de produto",
          "Estudar Product Operations Council e artigos do Lenny's Newsletter",
          "Dominar ferramentas modernas (Productboard, Linear, Mixpanel, Looker)",
          "Aprender SQL básico pra construir dashboards próprios",
          "Identificar gaps no seu time atual e propor melhorias como transição interna",
        ],
        dicasIniciais:
          "Cargo SÊNIOR e nicho. Não tente entrar sem experiência prévia em produto. Caminho ideal: PM sênior que ama processos → propor função internamente → migrar. Em startups pequenas (<10 PMs) não existe. Mire scale-ups e empresas estabelecidas. Comunidade BR ainda pequena. Produzir conteúdo público abre portas. Inglês é importante (a maior parte da literatura está em inglês). Mercado em formação. Quem entra agora vai estar na primeira onda.",
      },
    ],
  },
  {
    id: "ciberseguranca",
    nome: "Cibersegurança",
    slug: "ciberseguranca",
    icon: Shield,
    tagClass: "tag-seguranca",
    descricaoCurta: "Protege sistemas, dados e redes contra ameaças digitais.",
    descricaoCompleta:
      "O profissional de cibersegurança protege sistemas, redes e dados contra ataques, invasões e vulnerabilidades. Trabalha tanto na prevenção quanto na detecção e resposta a incidentes de segurança.",
    oQueFaz:
      "Analisa vulnerabilidades, realiza testes de invasão (pentest), monitora ameaças, implementa políticas de segurança e responde a incidentes.",
    tarefasDiarias: [
      "Monitorar logs e alertas de segurança",
      "Realizar análise de vulnerabilidades",
      "Implementar controles de segurança",
      "Responder a incidentes",
      "Documentar políticas de segurança",
    ],
    perfilIndicado:
      "Gosta de investigação, raciocínio analítico e tem curiosidade sobre como sistemas podem ser comprometidos.",
    habilidades: [
      "Redes de computadores",
      "Linux",
      "Criptografia básica",
      "Análise de vulnerabilidades",
      "Programação básica",
    ],
    ferramentas: [
      "Kali Linux",
      "Wireshark",
      "Metasploit",
      "Nmap",
      "Burp Suite",
    ],
    dificuldade: 5,
    cargos: [
      "Analista de Segurança Júnior",
      "Analista SOC",
      "Pentester",
      "Engenheiro de Segurança",
    ],
    faixaSalarial: "R$ 3.500 a R$ 7.000 (trainee/júnior)",
    cursosGratuitos: [
      "TryHackMe: Gratuito para iniciantes",
      "Cybrary: Cursos gratuitos",
      "DIO: Segurança da Informação",
    ],
    roadmapInicial: [
      "Aprender redes de computadores",
      "Aprender Linux básico",
      "Estudar conceitos de segurança",
      "Praticar no TryHackMe",
      "Obter certificação CompTIA Security+",
    ],
    projetos: [
      "Lab de segurança em máquina virtual",
      "CTF (Capture The Flag) para iniciantes",
      "Análise de vulnerabilidades em ambiente controlado",
    ],
    termosEssenciais: [
      "Pentest",
      "Firewall",
      "Criptografia",
      "Phishing",
      "Vulnerabilidade",
      "SOC",
    ],
    dicasIniciais:
      "Comece com redes e Linux. TryHackMe tem trilhas gratuitas excelentes para iniciantes absolutos.",
    requiresGraduation: "recomendado",
    tempoMedioFormacao: "1-2 anos com certificações",
    crescimentoMercado: "alto",
    faculdadesRelacionadas: [
      "Análise e Desenvolvimento de Sistemas (ADS)",
      "Ciência da Computação",
      "Engenharia de Software",
      "Sistemas de Informação",
    ],
    subareas: [
      {
        slug: "red-team",
        nome: "Red Team / Pentest",
        descricaoCurta:
          "Especialistas em simular ataques. Realizam pentests, exploram vulnerabilidades e testam defesas das empresas.",
        descricaoCompleta:
          "Red Team / Pentester é o hacker ético: profissional pago pra atacar sistemas e descobrir falhas antes dos criminosos. Simula ataques reais (phishing, exploração de vulnerabilidades web, escalação de privilégios, evasão de defesas) pra testar a resiliência da empresa. Diferente do hacker malicioso, atua com escopo definido, ética rigorosa e relatórios detalhados. Mercado super aquecido em 2026: cargo de Pentester paga de R$ 4.500 (júnior) a R$ 25.000 (sênior). Robert Half estima faixa pleno-sênior entre R$ 13.350 e R$ 18.300. Empresas multinacionais e fintechs pagam acima da média.",
        oQueFaz:
          "No dia a dia: planeja e executa testes de intrusão em escopos definidos (aplicações web, mobile, APIs, infraestrutura, cloud), explora vulnerabilidades (OWASP Top 10, falhas de autenticação, injeção), escreve scripts customizados em Python/Bash/PowerShell pra automatizar testes, simula campanhas de phishing pra avaliar conscientização, faz movimentação lateral em ambientes Windows/AD, e produz relatórios técnicos e executivos com achados, criticidade e recomendações. Em Red Team avançado, emula adversários reais (Kill Chain baseada em TTPs do MITRE ATT&CK).",
        diferencasDaAreaMae:
          "Dentro de Cibersegurança, o Red Team é o lado ofensivo. Ataca pra defender. Diferente do Blue Team (SOC, defesa em tempo real, monitora e responde a incidentes), o Red Team é proativo: encontra falhas antes que sejam exploradas. Diferente do AppSec (que integra segurança no ciclo de dev), o Red Team valida defesas existentes simulando atacantes reais. É o caminho mais visado por iniciantes (gosto pelo 'lado hacker'), mas exige base sólida de redes, sistemas e programação.",
        habilidadesEspecificas: [
          "Linux profundo (Kali, Parrot OS) + Windows / Active Directory Internals",
          "Programação e scripting (Python, Bash, PowerShell, JavaScript)",
          "OWASP Top 10 e exploração de aplicações web e APIs",
          "Redes, protocolos TCP/IP, criptografia, certificados SSL/TLS",
          "Engenharia social e técnicas de evasão de defesa (EDR/AV/WAF)",
        ],
        ferramentasEspecificas: [
          "Kali Linux (distribuição padrão pra pentest)",
          "Metasploit Framework",
          "Burp Suite (testes em aplicações web)",
          "Nmap (varredura de redes)",
          "Wireshark (análise de tráfego)",
          "Hashcat ou John the Ripper (quebra de hashes)",
        ],
        cargos: [
          "Pentester Júnior (0-2 anos)",
          "Pentester Pleno (2-5 anos)",
          "Pentester Sênior / Red Team Operator (5+ anos)",
          "Lead Red Team / Offensive Security Consultant",
        ],
        faixaSalarial:
          "R$ 4.500 (júnior) a R$ 25.000 (sênior). Pleno gira em R$ 8-14k. Consultores e freelas: R$ 150-400/hora. Certificações como OSCP, CRTO e CRTP aumentam significativamente a remuneração.",
        dificuldade: 5,
        cursosGratuitos: [
          "TryHackMe (paths gratuitos pra iniciantes, pré-OSCP)",
          "HackTheBox (CTFs práticos, free tier disponível)",
          "PortSwigger Web Security Academy: curso completo gratuito sobre vulnerabilidades web",
        ],
        projetosSugeridos: [
          "Home Lab: VM Kali + máquinas vulneráveis (Metasploitable, DVWA) pra prática diária",
          "Resolver 20+ máquinas no HackTheBox/TryHackMe + documentar no GitHub/blog",
          "Participar de programas de Bug Bounty (HackerOne, Bugcrowd) e reportar vulnerabilidade real",
        ],
        roadmapEspecifico: [
          "Aprender Linux profundamente + base de redes (TCP/IP, DNS, HTTP, AD)",
          "Estudar OWASP Top 10 + praticar em ambientes controlados (DVWA, Juice Shop)",
          "Aprender Python + Bash pra automação de testes",
          "Tirar certificação inicial (eJPT é boa porta de entrada) e mirar OSCP a médio prazo",
          "Construir portfólio: writeups de máquinas resolvidas + reports em programas de bug bounty",
        ],
        dicasIniciais:
          "OSCP é a certificação que abre portas. Mire ela como meta de 12-18 meses. Antes, TryHackMe e HackTheBox são as melhores plataformas de treino. Documente tudo: cada máquina resolvida vira writeup, cada CVE encontrada vira post. Recrutadores adoram. Mantenha sempre escopo e ética rigorosos: a diferença entre Red Team e hacker malicioso é a autorização. Inglês obrigatório.",
      },
      {
        slug: "blue-team",
        nome: "Blue Team / SOC",
        descricaoCurta:
          "Defesa em tempo real. Monitoram sistemas, analisam incidentes e atuam em Security Operations Centers.",
        descricaoCompleta:
          "Blue Team / Analista SOC é o profissional da defesa em tempo real: monitora sistemas continuamente, detecta ameaças, responde a incidentes. Diferente do Red Team (que ataca pra testar), o Blue Team protege e reage. Trabalha em Security Operations Centers (SOC), centros de monitoramento 24/7 de empresas com ativos digitais críticos (bancos, fintechs, e-commerce). Cargo super demandado em 2026: BeBee mostra centenas de vagas, com plenos em R$ 6-11k e sêniores em fintechs/bancos chegando a R$ 15-25k. Porta de entrada mais acessível em Cibersegurança. Empresas oferecem programas de formação pra estagiários e juniores.",
        oQueFaz:
          "No dia a dia: monitora alertas em SIEM (Security Information and Event Management) (QRadar, Splunk, Wazuh) identificando comportamentos anômalos, faz análise inicial de incidentes (triage) e escalonamento, conduz investigações de eventos suspeitos (logs, endpoints, redes), responde a incidentes seguindo playbooks (containment, eradication, recovery), atualiza regras de correlação no SIEM, mapeia ameaças usando MITRE ATT&CK, e produz relatórios técnicos e executivos pós-incidente. Trabalha em escalas (N1/N2/N3): N1 é triagem, N2 análise, N3 resposta avançada.",
        diferencasDaAreaMae:
          "Dentro de Cibersegurança, o Blue Team é o lado defensivo. Reage e detecta ameaças. Diferente do Red Team (que simula ataques), o Blue Team protege continuamente. Diferente do AppSec (foco em código), Blue Team foca em infra e detecção. Diferente do GRC (estratégia e compliance), Blue Team é operacional e técnico. Porta de entrada MAIS acessível em Cibersegurança. Empresas oferecem estágio e júnior, diferente de Red Team que exige base prévia mais sólida.",
        habilidadesEspecificas: [
          "Operação de SIEM (QRadar, Splunk, Wazuh, Sentinel)",
          "Análise de logs (sistemas, rede, aplicação) e correlação",
          "Resposta a incidentes (frameworks NIST, SANS)",
          "Conhecimento profundo de MITRE ATT&CK",
          "Fundamentos de rede, Linux, Windows e cloud (AWS, Azure)",
        ],
        ferramentasEspecificas: [
          "IBM QRadar ou Splunk (SIEMs corporativos mais comuns)",
          "Wazuh (SIEM open-source mais popular)",
          "EDR/XDR (CrowdStrike, SentinelOne, Microsoft Defender)",
          "SOAR (Palo Alto XSOAR, Splunk SOAR): automação de resposta",
          "Wireshark (análise de tráfego)",
          "MITRE ATT&CK Navigator",
        ],
        cargos: [
          "Analista SOC N1 (estagiário/júnior, 0-2 anos)",
          "Analista SOC N2 / Analista Blue Team Pleno (2-5 anos)",
          "Analista Blue Team Sênior / SOC N3 (5+ anos)",
          "Lead Blue Team / SOC Manager / CSIRT Lead",
        ],
        faixaSalarial:
          "R$ 3.000 (estagiário) a R$ 25.000+ (sênior em bancos/fintechs). Pleno gira em R$ 6-11k. Sêniores em PagSeguro, Stone, Itaú, fintechs chegam a R$ 15-20k. Especialistas em CSIRT financeiro ultrapassam R$ 25k.",
        dificuldade: 4,
        cursosGratuitos: [
          "TryHackMe: Blue Team Path (gratuito, prático)",
          "Letsdefend.io: labs gratuitos de análise de incidentes",
          "SANS Cyber Aces (cursos gratuitos sobre fundamentos)",
        ],
        projetosSugeridos: [
          "Home lab: SIEM Wazuh em VM + simulação de ataques + detecção documentada",
          "Resolver 20+ labs do Letsdefend.io ou Blue Team Labs Online",
          "Análise pública de incidente real (de relatórios públicos de empresas) com timeline + recomendações",
        ],
        roadmapEspecifico: [
          "Aprender fundamentos: redes (TCP/IP), Linux, Windows, sistemas operacionais",
          "Estudar OWASP Top 10 e MITRE ATT&CK profundamente",
          "Dominar pelo menos um SIEM (Wazuh é gratuito e popular)",
          "Tirar certificação inicial (Security+ ou CySA+ da CompTIA)",
          "Buscar vaga como Analista SOC N1 (estágio ou júnior) pra ganhar experiência prática",
        ],
        dicasIniciais:
          "Blue Team é a porta de entrada mais acessível em Cibersegurança. Empresas oferecem estágios e juniores com formação interna. SIEM é A skill da área. Comece com Wazuh (gratuito). Certificação Security+ da CompTIA vale o investimento (US$ 370, dura 3 anos). MITRE ATT&CK é leitura obrigatória. Domine. Inglês é obrigatório (toda doc, framework e community em inglês). Mercado super aquecido, fácil de conseguir estágio.",
      },
      {
        slug: "appsec",
        nome: "Application Security",
        descricaoCurta:
          "Segurança aplicada ao desenvolvimento. Code review seguro, SAST/DAST, DevSecOps, hardening de APIs.",
        descricaoCompleta:
          "AppSec (Application Security) Engineer é o profissional especializado em segurança de aplicações: código, APIs, microsserviços, mobile, web. Diferente do Red Team (que ataca pra testar) e Blue Team (que defende em tempo real), o AppSec foca em prevenção: integra segurança no ciclo de desenvolvimento (SDLC), faz threat modeling, secure code review, e treina devs em práticas seguras. Cargo super valorizado em fintechs, bancos e empresas que vivem de software. Salário top de Cibersegurança: Glassdoor mostra média R$ 21.838 (Application Security Specialist), com sêniores chegando a R$ 25-35k. Mercado super aquecido, 4.470+ vagas no BeBee.",
        oQueFaz:
          "No dia a dia: integra ferramentas de SAST (Semgrep, SonarQube), DAST (OWASP ZAP, Burp Suite) e SCA (Snyk, Dependabot) em pipelines CI/CD, faz threat modeling (STRIDE, PASTA) em arquiteturas novas, conduz secure code reviews em PRs críticos, treina devs em OWASP Top 10 e boas práticas, responde a vulnerabilidades reportadas (bug bounty, disclosures), e atua próximo ao DevSecOps na esteira de segurança. Em times maduros, foca em shift-left security.",
        diferencasDaAreaMae:
          "Dentro de Cibersegurança, o AppSec é o lado de prevenção em código, diferente do Red Team (ofensivo), Blue Team (defensivo reativo) ou GRC (compliance). Foco profundo em código e aplicações. Diferente do DevSecOps (que cuida do pipeline inteiro), o AppSec é mais especializado em código de aplicação e revisão de segurança. Cargo perfeito pra quem vem de desenvolvimento e quer migrar pra segurança. Sua experiência em código se traduz diretamente. Carreira de transição clássica.",
        habilidadesEspecificas: [
          "OWASP Top 10 + padrões secure coding (Web/API/Mobile)",
          "SAST, DAST, SCA (Semgrep, SonarQube, Burp, Snyk)",
          "Threat modeling (STRIDE, PASTA, OWASP Threat Dragon)",
          "Programação em uma ou mais linguagens (Python, Go, Java, JS)",
          "Knowledge de criptografia aplicada (TLS, hashing, JWT, OAuth)",
        ],
        ferramentasEspecificas: [
          "Semgrep ou SonarQube (SAST)",
          "Burp Suite ou OWASP ZAP (DAST)",
          "Snyk ou Dependabot (SCA + dependencies)",
          "GitHub Advanced Security (integrado a repos)",
          "Threat Dragon ou IriusRisk (threat modeling)",
          "JFrog Xray (security em registries)",
        ],
        cargos: [
          "AppSec Engineer Pleno (vindo de dev ou segurança, 3+ anos)",
          "Senior AppSec Engineer (5+ anos)",
          "Staff AppSec Engineer / Security Champion",
          "Head of Application Security",
        ],
        faixaSalarial:
          "R$ 8.000 (entrada) a R$ 35.000+ (sênior em fintechs/bancos). Média BR R$ 21.838, Glassdoor 2026 (Application Security Specialist). Pleno gira em R$ 12-20k. Sêniores em PagSeguro, Stone, Nubank, bancos chegam a R$ 25-32k.",
        dificuldade: 5,
        cursosGratuitos: [
          "OWASP Cheat Sheet Series (referência mundial gratuita)",
          "PortSwigger Web Security Academy (curso completo gratuito em inglês)",
          "Alura: Trilha AppSec (parte gratuita, com referências BR)",
        ],
        projetosSugeridos: [
          "Pipeline CI/CD completo com SAST + DAST + SCA em projeto público no GitHub",
          "Threat modeling de arquitetura real ou fictícia com diagrama + ações de mitigação",
          "Bug bounty: reportar 2-3 vulnerabilidades reais via HackerOne/Bugcrowd",
        ],
        roadmapEspecifico: [
          "Ter base de desenvolvimento (1-2 anos) OU base de segurança (Blue Team/Red Team)",
          "Estudar OWASP Top 10 + secure coding profundamente",
          "Aprender ferramentas SAST/DAST/SCA + integração CI/CD",
          "Praticar threat modeling em arquiteturas reais",
          "Tirar certificação CSSLP (ISC2) ou OSWE (Offensive Security)",
        ],
        dicasIniciais:
          "Caminho ideal: dev sênior que quer migrar pra segurança. Sua experiência em código vale ouro. PortSwigger Academy é OBRIGATÓRIO, curso gratuito mais completo da área. Comece com OWASP Top 10 + linguagem que você já domina. Inglês é absolutamente obrigatório. Bug bounty é portfólio real. Vulnerabilidades reportadas no HackerOne valem muito. Cargo super valorizado em fintechs e bancos.",
      },
      {
        slug: "grc",
        nome: "GRC (Governança, Risco e Compliance)",
        descricaoCurta:
          "Camada estratégica. Trabalha com LGPD, ISO 27001, NIST e auditoria. Equilibra tecnologia e regulamentação.",
        descricaoCompleta:
          "GRC (Governance, Risk and Compliance) é o pilar estratégico de Cibersegurança, profissional que define políticas, garante conformidade regulatória (LGPD, ISO 27001, SOC 2, PCI-DSS) e gerencia riscos da organização. Diferente das áreas técnicas (Red Team, Blue Team, AppSec), GRC é mais estratégico e jurídico. Atua próximo a executivos e jurídico. Cargo essencial em fintechs, bancos, healthtechs e empresas reguladas. Cresce muito com LGPD em vigor no BR (2020+) e exigências internacionais (SOC 2 pra clientes US). Salários: pleno gira R$ 8-15k, sêniores em bancos e fintechs chegam a R$ 18-30k+.",
        oQueFaz:
          "No dia a dia: define políticas e procedimentos de segurança da informação, gerencia processo de adequação a frameworks (ISO 27001, SOC 2, NIST, PCI-DSS), conduz análises de risco (matriz probabilidade x impacto), audita controles internos e responde a auditorias externas, treina colaboradores em segurança e LGPD, gerencia relacionamento com encarregado de dados (DPO), e produz relatórios pra alta gestão e órgãos reguladores. Em empresas grandes, lidera comitê de segurança.",
        diferencasDaAreaMae:
          "Dentro de Cibersegurança, o GRC é o lado estratégico, diferente das áreas técnicas (Red Team, Blue Team, AppSec, Forense), GRC trabalha com políticas, conformidade e gestão de riscos. Aproxima-se de auditoria interna e jurídico. Cargo perfeito pra perfis mais organizacionais e menos técnicos. Alguns GRCs vêm de auditoria, direito, administração. Não precisa programar. Precisa entender frameworks regulatórios profundamente.",
        habilidadesEspecificas: [
          "Frameworks de segurança (ISO 27001, NIST, CIS Controls, COBIT)",
          "Regulações brasileiras (LGPD) e internacionais (GDPR, HIPAA)",
          "Padrões setoriais (PCI-DSS para fintechs, SOX para empresas listadas)",
          "Gestão de riscos (matriz, KRIs, treatment plans)",
          "Comunicação executiva e jurídica (relatórios pra C-level e auditores)",
        ],
        ferramentasEspecificas: [
          "Excel avançado e Power BI (matrizes de risco, dashboards)",
          "Drata ou Vanta (automação de SOC 2, ISO 27001)",
          "GRC platforms (ServiceNow GRC, RSA Archer, OneTrust)",
          "Notion ou Confluence (documentação de políticas)",
          "Frameworks oficiais (ISO 27001 PDF, NIST CSF)",
          "Power BI (dashboards de compliance)",
        ],
        cargos: [
          "Analista de GRC Júnior (0-2 anos)",
          "Analista de GRC Pleno (2-5 anos)",
          "Especialista GRC / Auditor Interno Sênior (5+ anos)",
          "Gerente GRC / Chief Information Security Officer (CISO)",
        ],
        faixaSalarial:
          "R$ 5.000 (júnior) a R$ 30.000+ (sênior em bancos). Pleno gira em R$ 8-15k. Sêniores em fintechs (Stone, Nubank, PagBank), bancos e healthtechs chegam a R$ 18-28k. CISO ultrapassa R$ 40k em empresas grandes.",
        dificuldade: 3,
        cursosGratuitos: [
          "ANPD: Material gratuito sobre LGPD (autoridade nacional, referência oficial)",
          "ISACA: recursos gratuitos sobre governança (referência mundial)",
          "ISO 27001 Foundation: cursos introdutórios gratuitos no Coursera",
        ],
        projetosSugeridos: [
          "Política de Segurança da Informação completa pra empresa fictícia",
          "Matriz de risco de TI com 20+ riscos identificados + planos de mitigação",
          "Análise de gap pra ISO 27001 em organização real ou hipotética",
        ],
        roadmapEspecifico: [
          "Estudar LGPD profundamente (obrigatório no BR)",
          "Aprender frameworks principais (ISO 27001, NIST CSF, CIS Controls)",
          "Estudar gestão de riscos aplicada a TI",
          "Tirar certificação inicial (ISFS da EXIN ou Security+ da CompTIA)",
          "Avançar para CISA (auditoria) ou CISSP (gestão) após 3-5 anos",
        ],
        dicasIniciais:
          "Porta de entrada acessível em Cibersegurança pra quem NÃO quer ser técnico. Não precisa programar. Vindo de auditoria, direito ou administração? Caminho natural. LGPD é a porta de entrada essencial no BR. Domine. ISO 27001 é o framework mais respeitado mundialmente. CISA e CISSP são certificações de ouro pra carreira de longo prazo. Cargo perfeito pra perfis organizacionais e detalhistas.",
      },
      {
        slug: "forense-digital",
        nome: "Forense Digital e Resposta a Incidentes",
        descricaoCurta:
          "Investigação pós-ataque. Análise de evidências digitais, contenção de incidentes e recuperação de sistemas.",
        descricaoCompleta:
          "Forense Digital (ou Digital Forensics) é o especialista em investigar incidentes de segurança após o fato. Analisa evidências digitais (logs, dispositivos, redes) pra responder 'o que aconteceu, como, e quem fez'. Atua em CSIRT corporativo (response a incidentes) ou como perito (criminal ou civil). Cargo super específico e técnico. Exige conhecimento profundo de sistemas, redes, e direito digital. Salários variam muito: Glassdoor mostra média R$ 9.033 (Analista Forense Digital) com sêniores em R$ 10.800; peritos federais ganham R$ 14.000+; em CSIRTs de bancos chega a R$ 18-25k. Mercado pequeno mas valorizado.",
        oQueFaz:
          "No dia a dia: coleta e preserva evidências digitais (HD, RAM, logs) seguindo cadeia de custódia, analisa malwares (engenharia reversa básica), investiga incidentes (timeline, root cause analysis), recupera dados deletados, analisa tráfego de rede capturado, produz laudos técnicos detalhados (em formato pericial), e apoia juridicamente em processos. Em CSIRT corporativo, atua próximo ao Blue Team na resposta a incidentes complexos.",
        diferencasDaAreaMae:
          "Dentro de Cibersegurança, Forense Digital é o lado investigativo PÓS-incidente, diferente do Red Team (ataque), Blue Team (defesa em tempo real) e AppSec (prevenção), o Forense trabalha depois que o ataque ocorreu. Aproxima-se de investigação criminal e perícia judicial. Cargo super nicho. Empresas grandes têm 1-2 especialistas, mercado é pequeno mas estável. Caminho público (perito policial/federal via concurso) ou privado (CSIRT/consultoria).",
        habilidadesEspecificas: [
          "Análise forense de sistemas operacionais (Windows, Linux, macOS)",
          "Análise de memória (RAM dumps) com Volatility ou similares",
          "Engenharia reversa básica de malware",
          "Análise de tráfego de rede (Wireshark, NetworkMiner)",
          "Conhecimento de direito digital e cadeia de custódia",
        ],
        ferramentasEspecificas: [
          "Autopsy ou EnCase (análise forense de discos)",
          "Volatility (análise de memória RAM)",
          "Wireshark (análise de tráfego)",
          "IDA Pro ou Ghidra (engenharia reversa)",
          "FTK Imager (aquisição forense de dispositivos)",
          "X-Ways Forensics (análise avançada)",
        ],
        cargos: [
          "Analista Forense Júnior (0-2 anos, raro)",
          "Analista Forense Digital Pleno (3-5 anos)",
          "Perito Forense / Especialista CSIRT Sênior (5+ anos)",
          "Perito Federal / Lead Forensics",
        ],
        faixaSalarial:
          "R$ 3.367 (júnior) a R$ 25.000+ (sênior em bancos/CSIRT). Média BR R$ 9.033, Glassdoor 2026. Pleno gira em R$ 7-12k. Peritos federais (concursados) ganham R$ 14k+. Sêniores em fintechs grandes chegam a R$ 18-22k.",
        dificuldade: 5,
        cursosGratuitos: [
          "SANS DFIR: recursos gratuitos (cheat sheets, posters, blog)",
          "Cyber5w: labs gratuitos de forense digital",
          "DFIR.training: comunidade gratuita com recursos massivos",
        ],
        projetosSugeridos: [
          "Análise forense de máquina virtual comprometida intencionalmente (CTF de forense)",
          "Análise de malware em ambiente controlado (sandbox) com relatório técnico",
          "Resolver 10+ desafios em plataformas como CyberDefenders ou DFIR Madness",
        ],
        roadmapEspecifico: [
          "Aprender fundamentos profundos de sistemas (Windows, Linux, redes)",
          "Estudar análise forense (livro 'File System Forensic Analysis' é referência)",
          "Praticar com ferramentas reais (Autopsy é gratuito)",
          "Tirar certificação inicial: GCFA (SANS) ou EnCase Certified Examiner",
          "Decidir caminho: público (concurso PF/PCs) ou privado (CSIRT/consultoria)",
        ],
        dicasIniciais:
          "Cargo nicho e SÊNIOR. Não tente entrar sem base sólida de redes/sistemas. Decida cedo: caminho público (concurso de Perito Federal/Estadual, salários previsíveis) ou privado (CSIRT corporativo, salários mais altos mas voláteis). SANS DFIR é referência mundial. Siga. Cargo perfeito pra mentes investigativas e detalhistas. Inglês é obrigatório (toda doc em inglês). Mercado BR pequeno mas estável.",
      },
    ],
  },
  {
    id: "cloud",
    nome: "Cloud Computing",
    slug: "cloud",
    icon: Cloud,
    tagClass: "tag-cloud",
    descricaoCurta: "Gerencia infraestrutura e serviços na nuvem.",
    descricaoCompleta:
      "Cloud Computing envolve o uso de servidores, armazenamento, bancos de dados e outros recursos de TI pela internet, através de provedores como AWS, Azure e Google Cloud. O profissional de cloud projeta, implementa e gerencia essas infraestruturas.",
    oQueFaz:
      "Configura e gerencia servidores na nuvem, implementa arquiteturas escaláveis, monitora custos e performance, e garante disponibilidade dos serviços.",
    tarefasDiarias: [
      "Configurar instâncias e serviços na nuvem",
      "Monitorar custos e performance",
      "Implementar pipelines de CI/CD",
      "Gerenciar permissões e segurança",
      "Documentar arquiteturas",
    ],
    perfilIndicado:
      "Gosta de infraestrutura, sistemas e de entender como a internet funciona por baixo dos panos.",
    habilidades: [
      "Linux",
      "Redes",
      "AWS, Azure ou GCP",
      "Docker e Kubernetes",
      "Terraform",
    ],
    ferramentas: [
      "AWS Console",
      "Azure Portal",
      "Terraform",
      "Docker",
      "Kubernetes",
    ],
    dificuldade: 4,
    cargos: [
      "Analista de Cloud Júnior",
      "Cloud Engineer",
      "DevOps Engineer",
      "SRE",
    ],
    faixaSalarial: "R$ 3.500 a R$ 7.000 (trainee/júnior)",
    cursosGratuitos: [
      "AWS Skill Builder: Gratuito",
      "Microsoft Learn: Azure gratuito",
      "Google Cloud Skills Boost: trilhas gratuitas",
    ],
    roadmapInicial: [
      "Aprender Linux básico",
      "Entender redes de computadores",
      "Criar conta gratuita na AWS",
      "Completar trilha AWS Cloud Practitioner",
      "Obter certificação Cloud Practitioner",
    ],
    projetos: [
      "Hospedar site estático na AWS S3",
      "Criar servidor virtual na nuvem",
      "Configurar pipeline CI/CD básico",
    ],
    termosEssenciais: [
      "AWS",
      "Azure",
      "GCP",
      "Container",
      "Kubernetes",
      "Serverless",
    ],
    dicasIniciais:
      "Comece com a certificação AWS Cloud Practitioner. É acessível para iniciantes e muito valorizada no mercado.",
    requiresGraduation: "opcional",
    tempoMedioFormacao: "1-2 anos com certificações",
    crescimentoMercado: "alto",
    faculdadesRelacionadas: [
      "Análise e Desenvolvimento de Sistemas (ADS)",
      "Ciência da Computação",
      "Engenharia de Software",
      "Sistemas de Informação",
    ],
    subareas: [
      {
        slug: "arquiteto-cloud",
        nome: "Arquiteto Cloud",
        descricaoCurta:
          "Projeta soluções em AWS, Azure ou GCP. Define topologias, integrações e padrões pra grandes ambientes corporativos.",
        descricaoCompleta:
          "Arquiteto Cloud é o profissional sênior que projeta a infraestrutura de nuvem pra grandes empresas. Define quais serviços usar (compute, storage, networking, banco), como integrar com sistemas legados, como garantir alta disponibilidade, segurança e custo controlado. Não é cargo de entrada: chega-se como Arquiteto Cloud depois de 5+ anos como engenheiro de cloud, DevOps ou desenvolvedor. Cargo super valorizado em 2026, médias de R$ 6 mil a R$ 16 mil, com sêniores em ambientes financeiros ou multinacionais chegando a R$ 18-25k+. Certificações como AWS Solutions Architect Professional ou Azure Architect Expert são quase obrigatórias.",
        oQueFaz:
          "No dia a dia: levanta requisitos técnicos e de negócio com clientes ou times internos, desenha arquiteturas escaláveis e resilientes (multi-AZ, multi-região quando necessário), avalia trade-offs de custo vs performance vs disponibilidade, define padrões de segurança (IAM, criptografia, compliance), apresenta soluções pra stakeholders técnicos e executivos, orienta times de implementação, e revisa arquiteturas existentes pra modernização. Trabalha lado a lado com DevOps, SREs, engenheiros de dados e times de produto.",
        diferencasDaAreaMae:
          "Dentro de Cloud, o Arquiteto separa-se do Engenheiro Cloud pelo escopo: engenheiro implementa; arquiteto projeta. Diferente do Cloud Security (foco específico em segurança) ou FinOps (foco em custo), o Arquiteto Cloud tem visão completa do ambiente: segurança, custo, performance, resiliência. É cargo de evolução, não de entrada. Você chega aqui depois de anos como engenheiro de cloud, desenvolvedor ou DevOps com vivência em projetos grandes.",
        habilidadesEspecificas: [
          "Domínio profundo de pelo menos uma cloud (AWS, Azure ou GCP), preferencialmente 2",
          "Arquitetura de sistemas distribuídos, alta disponibilidade e tolerância a falhas",
          "Infrastructure as Code (Terraform, CloudFormation)",
          "Segurança em cloud (IAM, criptografia, compliance, LGPD)",
          "Visão de negócio e comunicação executiva (traduzir tech pra C-level)",
        ],
        ferramentasEspecificas: [
          "AWS (EC2, S3, RDS, Lambda, VPC, IAM)",
          "Azure ou GCP como segunda cloud (multi-cloud é tendência)",
          "Terraform (Infrastructure as Code padrão)",
          "Draw.io ou Lucidchart (diagramação de arquiteturas)",
          "AWS Well-Architected Framework (framework de referência)",
          "Datadog ou CloudWatch (observabilidade)",
        ],
        cargos: [
          "Arquiteto Cloud Júnior raro, geralmente vem de Cloud Engineer (3+ anos)",
          "Arquiteto Cloud Pleno (5+ anos de cloud)",
          "Arquiteto Cloud Sênior (7+ anos de cloud)",
          "Principal Cloud Architect / Chief Architect (líder técnico da empresa)",
        ],
        faixaSalarial:
          "R$ 7.600 (entrada) a R$ 18.000 (sênior). Em grandes empresas, fintechs ou setor financeiro, sêniores chegam a R$ 25.000+. Vagas remotas pra fora pagam em dólar (US$ 100-150k/ano).",
        dificuldade: 5,
        cursosGratuitos: [
          "AWS Skill Builder: Cloud Practitioner + Solutions Architect Associate (planos gratuitos)",
          "Google Cloud Skills Boost: fundamentos gratuitos e labs práticos",
          "Microsoft Learn: trilhas Azure Fundamentals e Azure Architect (gratuitas)",
        ],
        projetosSugeridos: [
          "Arquitetar e implementar aplicação 3-tier completa na AWS (VPC + EC2 + RDS + ELB + S3)",
          "Migração de aplicação on-premise pra cloud com plano de modernização documentado",
          "Multi-cloud setup: aplicação rodando em AWS + Azure com failover automático",
        ],
        roadmapEspecifico: [
          "Dominar uma cloud profundamente (AWS é o mais procurado no BR, comece por ela)",
          "Tirar certificação foundational (AWS Cloud Practitioner) e depois Associate (Solutions Architect)",
          "Aprender Terraform e arquitetura de sistemas distribuídos",
          "Conseguir vaga como Cloud Engineer ou DevOps pra ganhar experiência prática",
          "Após 3-5 anos, mirar certificação Professional (AWS SAP-C02 ou equivalente Azure/GCP)",
        ],
        dicasIniciais:
          "Não tente entrar direto como Arquiteto. Passe primeiro por Cloud Engineer ou DevOps. Certificação AWS Associate é o primeiro grande objetivo: estude 3-6 meses + tire o exame (custa US$ 150, mas vale cada centavo no currículo). Foque em entender padrões de arquitetura (microservices, serverless, event-driven). Não basta saber nomes de serviços. Inglês obrigatório.",
      },
      {
        slug: "cloud-security",
        nome: "Cloud Security",
        descricaoCurta:
          "Especialista em segurança em ambiente cloud. IAM, hardening de workloads, CSPM, conformidade.",
        descricaoCompleta:
          "Cloud Security Engineer é o especialista em segurança específica de ambientes em nuvem. Diferente da segurança tradicional, cloud tem desafios únicos: IAM complexo, shared responsibility model, escala dinâmica, multi-tenancy. Cargo crítico em qualquer empresa que rode em AWS, Azure ou GCP. Todas correm risco massivo de misconfiguração que vaza dados. Cresce explosivamente: empresas brasileiras migrando pra cloud precisam desse perfil urgentemente. Salários: pleno R$ 12-20k, sêniores em fintechs e empresas com workload massivo em cloud chegam a R$ 25-35k. Combina expertise em cloud + segurança, pool de profissionais pequeno = salários altos.",
        oQueFaz:
          "No dia a dia: configura e audita IAM em AWS/Azure/GCP (least privilege, MFA, role assumption), define network security (VPC, security groups, NACLs, WAF), implementa criptografia em repouso e trânsito, faz hardening de configurações cloud (CIS Benchmarks), monitora com ferramentas cloud-native (GuardDuty, Security Hub, Defender), responde a incidentes em cloud, e garante compliance (PCI-DSS, LGPD em ambiente cloud). Em empresas maduras, automatiza políticas como código (CSPM, Cloud Custodian).",
        diferencasDaAreaMae:
          "Dentro de Cloud, o Cloud Security é a especialização defensiva, diferente do Arquiteto Cloud (que projeta sistemas), FinOps (que cuida de custos) ou Cloud Engineer (que opera), o Security foca em proteger esse ambiente. Diferente do AppSec (foco em código) ou Blue Team (foco em SOC tradicional), o Cloud Security é hiper-especializado em infraestrutura cloud. Caminho típico: vem de DevOps ou Cloud Engineer e se especializa em segurança, ou vem de segurança tradicional e migra pra cloud.",
        habilidadesEspecificas: [
          "Domínio profundo de IAM em pelo menos uma cloud (AWS é o mais procurado no BR)",
          "Network security em cloud (VPC, security groups, WAF, DDoS protection)",
          "CIS Benchmarks e hardening de configurações cloud",
          "CSPM (Cloud Security Posture Management) e ferramentas (Wiz, Prisma, Lacework)",
          "Compliance em cloud (LGPD, PCI-DSS, SOC 2 aplicados a AWS/Azure/GCP)",
        ],
        ferramentasEspecificas: [
          "AWS Security Hub + GuardDuty + Inspector + Config",
          "Wiz, Prisma Cloud ou Lacework (CSPM)",
          "Terraform (Infrastructure as Code com security baseline)",
          "Vault (gestão de secrets em cloud)",
          "Cloud Custodian (políticas de segurança como código)",
          "Datadog ou Splunk (SIEM integrado a cloud)",
        ],
        cargos: [
          "Cloud Security Engineer Pleno (vindo de DevOps ou segurança, 3+ anos)",
          "Senior Cloud Security Engineer (5+ anos)",
          "Cloud Security Architect (7+ anos)",
          "Head of Cloud Security / Cloud CISO",
        ],
        faixaSalarial:
          "R$ 8.000 (entrada) a R$ 35.000+ (sênior em fintechs/big techs). Pleno gira em R$ 12-20k. Sêniores em Stone, Nubank, iFood, bancos chegam a R$ 22-30k. Remoto pra fora paga US$ 8-15k/mês.",
        dificuldade: 5,
        cursosGratuitos: [
          "AWS Skill Builder: Security Learning Path (parte gratuita)",
          "CIS Benchmarks (gratuitos via CIS Center for Internet Security)",
          "AWS re:Inforce: talks gratuitos sobre segurança em cloud (YouTube)",
        ],
        projetosSugeridos: [
          "AWS Landing Zone segura completa (Organizations + SCP + GuardDuty habilitado)",
          "Análise CSPM de conta AWS própria com 20+ findings + remediações documentadas",
          "Pipeline com security as code: Terraform + checkov + tfsec validando antes de aplicar",
        ],
        roadmapEspecifico: [
          "Ter base sólida em DevOps ou Cibersegurança tradicional",
          "Dominar uma cloud profundamente (AWS é o mais procurado)",
          "Tirar AWS Security Specialty (ou equivalente Azure/GCP)",
          "Aprender CIS Benchmarks e ferramentas CSPM",
          "Construir portfólio: 2 projetos públicos com Landing Zone segura documentada",
        ],
        dicasIniciais:
          "Cargo SÊNIOR. Não tente entrar sem base de cloud OU segurança. AWS Security Specialty (US$ 300) é a certificação mais respeitada. Combine com CIS Benchmarks (gratuitos), referência absoluta. Inglês é obrigatório. Mercado pequeno mas em explosão. Quem entra agora pega salários acima do normal. Em fintechs e bancos, cargo paga muito acima da média. Caminho ideal: vem de DevOps → migra pra Cloud Security.",
      },
      {
        slug: "finops",
        nome: "FinOps",
        descricaoCurta:
          "Otimização financeira de cloud. Reduz custos, monitora gastos, aplica práticas de billing e governança.",
        descricaoCompleta:
          "FinOps (Financial Operations) é a disciplina emergente que une finanças, tecnologia e operações pra gerenciar custos de cloud com responsabilidade. Em 2026, empresas brasileiras gastam milhões em AWS/Azure/GCP sem visibilidade clara. FinOps muda isso: aloca custos por time, identifica desperdícios, propõe Reserved Instances/Savings Plans, e cria cultura de accountability. Cargo nasceu em big techs e está chegando ao BR em fintechs, varejistas e empresas com workload massivo. Salários: pleno gira R$ 12-18k (Glassdoor R$ 17.006), sêniores em empresas com gasto de cloud massivo (Mercado Livre, iFood, Stone) chegam a R$ 20-30k.",
        oQueFaz:
          "No dia a dia: monitora custos de cloud em tempo real com ferramentas nativas (AWS Cost Explorer, Azure Cost Management), aloca gastos por time/produto via tagging, identifica oportunidades (compute idle, storage desnecessário, queries caras), propõe compras de Reserved Instances e Savings Plans baseado em uso histórico, treina engenheiros em cost-awareness, constrói dashboards de custo pra liderança, e participa de decisões arquiteturais avaliando trade-off performance vs custo.",
        diferencasDaAreaMae:
          "Dentro de Cloud, o FinOps é a especialização financeira, diferente do Arquiteto Cloud (que projeta), Cloud Security (que protege) ou Cloud Engineer (que opera), o FinOps cuida do dinheiro. Cargo híbrido entre tecnologia e finanças. Alguns FinOps vêm de finanças/controladoria e migram pra cloud; outros vêm de DevOps e aprendem finanças. Cargo emergente no BR. Empresas que gastam mais de R$ 1M/mês em cloud precisam.",
        habilidadesEspecificas: [
          "Conhecimento profundo de modelo de cobrança da cloud (AWS Pricing, Azure pricing)",
          "SQL avançado pra análise de billing data (CUR no AWS, Azure billing export)",
          "Power BI ou Tableau pra dashboards de custo",
          "Compreensão de finanças corporativas (budget, forecast, unit economics)",
          "Negociação com vendors (volume discounts, EDPs, commitments)",
        ],
        ferramentasEspecificas: [
          "AWS Cost Explorer + Cost and Usage Report (CUR)",
          "Azure Cost Management + Billing",
          "GCP Cloud Billing reports",
          "Cloudability, Apptio ou Vantage (FinOps platforms)",
          "Power BI ou Tableau (dashboards executivos)",
          "Kubecost (FinOps específico pra Kubernetes)",
        ],
        cargos: [
          "Analista FinOps Júnior (0-2 anos)",
          "Analista FinOps Pleno / Especialista (3-5 anos)",
          "Senior FinOps Specialist (5+ anos)",
          "Head of FinOps / Cloud Economics",
        ],
        faixaSalarial:
          "R$ 6.000 (júnior) a R$ 30.000+ (sênior). Média BR R$ 17.006, Glassdoor 2026 (FinOps Specialist). Pleno gira em R$ 12-18k. Sêniores em empresas com gasto massivo em cloud chegam a R$ 22-30k. FinOps Certified Practitioner (FOCP) é diferencial real.",
        dificuldade: 3,
        cursosGratuitos: [
          "FinOps Foundation: recursos gratuitos (referência mundial oficial)",
          "AWS Cost Optimization (parte gratuita do AWS Skill Builder)",
          "FinOps Open Cost & Usage Spec (OpenCost): referência open source",
        ],
        projetosSugeridos: [
          "Análise de gastos de uma conta AWS pública/teste: identificar 10 otimizações com impacto estimado",
          "Dashboard de custo com tagging strategy completa pra empresa fictícia",
          "Plano de otimização: Reserved Instances + Savings Plans com cálculo de ROI",
        ],
        roadmapEspecifico: [
          "Estudar modelo de cobrança da cloud principal (AWS é o mais procurado)",
          "Aprender SQL pra analisar billing data (CUR no AWS é complexo)",
          "Dominar uma ferramenta de visualização (Power BI ou Tableau)",
          "Tirar certificação FinOps Certified Practitioner (FOCP), US$ 250",
          "Construir portfólio: análise pública de gastos cloud + propostas de otimização",
        ],
        dicasIniciais:
          "Cargo emergente. Quem entrar agora pega salários acima do normal por 3-5 anos. FOCP (FinOps Certified Practitioner) é A certificação da área. Vale o investimento. Caminho ideal: vem de DevOps/Cloud → aprende finanças OU vem de finanças → aprende cloud. SQL é cobrado pra análise de billing data (CUR no AWS tem terabytes). Inglês é importante. Cargo perfeito pra perfis analíticos que gostam de números.",
      },
    ],
  },
  {
    id: "gestao",
    nome: "Gestão de Projetos Tech",
    slug: "gestao",
    icon: ClipboardList,
    tagClass: "tag-gestao",
    descricaoCurta: "Planeja, organiza e lidera projetos de tecnologia.",
    descricaoCompleta:
      "O gerente de projetos tech coordena equipes, recursos e prazos para entregar projetos de tecnologia com sucesso. Combina habilidades de liderança, comunicação e conhecimento técnico.",
    oQueFaz:
      "Planeja projetos, gerencia cronogramas, facilita reuniões, remove impedimentos da equipe e garante entrega dentro do prazo e orçamento.",
    tarefasDiarias: [
      "Facilitar cerimônias ágeis (daily, sprint planning)",
      "Atualizar cronogramas e backlogs",
      "Comunicar status para stakeholders",
      "Remover impedimentos da equipe",
      "Gerenciar riscos",
    ],
    perfilIndicado:
      "Gosta de organização, comunicação e de coordenar pessoas. Tem liderança natural e visão sistêmica.",
    habilidades: [
      "Metodologias ágeis",
      "Comunicação",
      "Gestão de riscos",
      "Ferramentas de gestão",
      "Liderança",
    ],
    ferramentas: ["Jira", "Trello", "Asana", "Microsoft Project", "Notion"],
    dificuldade: 3,
    cargos: [
      "Scrum Master Júnior",
      "Analista de PMO",
      "Coordenador de Projetos",
      "Agile Coach",
    ],
    faixaSalarial: "R$ 3.000 a R$ 6.000 (trainee/júnior)",
    cursosGratuitos: [
      "Scrum.org: Materiais gratuitos",
      "PMI: Recursos gratuitos",
      "DIO: Metodologias Ágeis",
    ],
    roadmapInicial: [
      "Aprender Scrum e Kanban",
      "Obter certificação PSM I ou PSPO I",
      "Aprender ferramentas como Jira e Trello",
      "Praticar facilitação de reuniões",
      "Buscar estágio em PMO",
    ],
    projetos: [
      "Plano de projeto fictício",
      "Documentação de sprint",
      "Roadmap de produto",
    ],
    termosEssenciais: [
      "Scrum",
      "Kanban",
      "Sprint",
      "Backlog",
      "Stakeholder",
      "PMO",
    ],
    dicasIniciais:
      "Obtenha a certificação PSM I (Scrum). É gratuita para estudar e muito reconhecida no mercado.",
    roadmapStatus: "coming-soon" as const,
    requiresGraduation: "recomendado",
    tempoMedioFormacao: "1-2 anos com certificação",
    crescimentoMercado: "medio",
    faculdadesRelacionadas: [
      "Sistemas de Informação",
      "Análise e Desenvolvimento de Sistemas (ADS)",
      "Ciência da Computação",
      "Engenharia de Software",
    ],
    subareas: [
      {
        slug: "scrum-master",
        nome: "Scrum Master",
        descricaoCurta:
          "Facilitador de times ágeis. Garante que o time siga Scrum, remove impedimentos e dissemina cultura ágil.",
        descricaoCompleta:
          "Scrum Master é o facilitador do framework Scrum: profissional que ajuda o time a aplicar Scrum corretamente, remove impedimentos e protege contra interferências externas. Não é gestor (não tem autoridade direta sobre o time) nem dono do produto (isso é PO). É um servant leader que serve o time pra que ele entregue valor. Cargo super comum em empresas que adotam ágil no Brasil (bancos, fintechs, indústrias). Mercado maduro mas saturado em níveis júnior. Diferencial está em sêniores e Agile Coaches. Salário médio: R$ 9.750 (Glassdoor 2.574 respostas), Robert Half estima R$ 10.900-17.600 pra pleno-sênior. Sêniores em fintechs chegam a R$ 20-25k.",
        oQueFaz:
          "No dia a dia: conduz cerimônias Scrum (daily, planning, review, retrospectiva), remove impedimentos identificados pelo time, protege o time de interrupções externas, ensina e treina o time em práticas ágeis, facilita conflitos e melhoria contínua, e atua como ponte entre o time e a organização. Em empresas grandes, trabalha próximo a outros Scrum Masters e Agile Coaches em um modelo de Comunidade de Prática. Não atribui tarefas nem cobra entregas. Facilita o auto-gerenciamento do time.",
        diferencasDaAreaMae:
          "Dentro de Gestão, o Scrum Master separa-se do Product Owner pelo papel: PO é dono do produto e prioriza o quê construir; Scrum Master é facilitador do processo e cuida de como o time trabalha. Diferente do Project Manager tradicional (que cobra prazo e escopo), Scrum Master não comanda. Facilita auto-organização. Diferente do Agile Coach (que atua em nível organizacional, transformação cultural), o Scrum Master é tático e foca em 1-2 times específicos. Porta de entrada da carreira ágil. Sêniores migram pra Agile Coach.",
        habilidadesEspecificas: [
          "Domínio profundo do framework Scrum (papéis, eventos, artefatos)",
          "Facilitação de cerimônias e workshops",
          "Coaching individual e de times (escuta ativa, perguntas poderosas)",
          "Resolução de conflitos e mediação",
          "Métricas ágeis (velocity, burndown, throughput, cycle time)",
        ],
        ferramentasEspecificas: [
          "Jira ou Linear (gestão de backlog e sprints)",
          "Miro ou FigJam (retrospectivas e workshops)",
          "Notion ou Confluence (documentação de processos)",
          "Slack ou Teams (comunicação assíncrona)",
          "Trello ou Azure DevOps (boards alternativos)",
          "Mural ou EasyRetro (retrospectivas remotas)",
        ],
        cargos: [
          "Scrum Master Júnior (0-2 anos)",
          "Scrum Master Pleno (2-5 anos)",
          "Scrum Master Sênior (5+ anos)",
          "Agile Coach / Lead Scrum Master (carreira evolutiva)",
        ],
        faixaSalarial:
          "R$ 5.200 (júnior) a R$ 25.000 (sênior em fintechs/big techs). Média BR R$ 9.750, Glassdoor 2026 (2.574 respondentes). Robert Half estima R$ 10.900-17.600 pra pleno-sênior. Certificação PSM I é essencial.",
        dificuldade: 3,
        cursosGratuitos: [
          "Scrum.org: Scrum Guide oficial (gratuito, leitura essencial antes de qualquer curso)",
          "Atlassian Agile Coach: cursos gratuitos sobre Scrum, Kanban e ferramentas",
          "Mountain Goat Software (Mike Cohn): artigos gratuitos, referência mundial em Scrum",
        ],
        projetosSugeridos: [
          "Aplicar Scrum em projeto pessoal ou voluntário com 2-3 amigos (real, não teórico)",
          "Facilitar 5 retrospectivas hipotéticas usando técnicas diferentes (Sailboat, 4Ls, Mad-Sad-Glad)",
          "Documentar 3 estudos de caso: situações de impedimento e como removeria",
        ],
        roadmapEspecifico: [
          "Ler o Scrum Guide oficial integralmente (pequeno, mas denso)",
          "Estudar facilitação de cerimônias e técnicas de retrospectiva",
          "Aprender métricas ágeis (velocity, burndown, predictability)",
          "Tirar certificação PSM I da Scrum.org (custa US$ 200, vale pra sempre)",
          "Conseguir vaga como Scrum Master Júnior ou facilitar time interno (transição)",
        ],
        dicasIniciais:
          "PSM I da Scrum.org é a certificação mais respeitada. Vale o investimento. Cuidado com a saturação em níveis júnior: muita gente migra pra Scrum Master sem base sólida e o mercado percebe. Pratique facilitação de verdade. Leitura não substitui experiência. Sêniores que viram Agile Coach saltam pra R$ 20-25k+. Inglês é diferencial em multinacionais. Não é cargo de comando. Quem busca poder se frustra.",
      },
      {
        slug: "agile-coach",
        nome: "Agile Coach",
        descricaoCurta:
          "Transformação ágil em larga escala. Atua com múltiplos times, treina lideranças e implanta cultura ágil na organização.",
        descricaoCompleta:
          "Agile Coach é o profissional sênior que atua em transformações ágeis organizacionais, não apenas com 1 time, mas com múltiplos times, lideranças e a cultura da empresa inteira. Diferente do Scrum Master (foco tático em um time), o Agile Coach trabalha em nível estratégico: ajuda empresas a adotar agilidade em escala, treina lideranças, redesenha estruturas organizacionais, e aplica frameworks como SAFe, LeSS ou Spotify Model. Cargo super sênior. Exige 5+ anos como Scrum Master + experiência em transformações reais. Salário top da carreira ágil: média BR R$ 25.006 (Glassdoor), sêniores em consultorias e bancos ultrapassam R$ 35k. Mercado aquecido em transformações digitais corporativas.",
        oQueFaz:
          "No dia a dia: trabalha com lideranças (C-level e gerentes) pra desenhar transformações ágeis, treina e mentora múltiplos Scrum Masters e POs, facilita workshops de melhoria contínua em níveis organizacionais, ajuda na implementação de frameworks em escala (SAFe, LeSS, Spotify Model), mede maturidade ágil e propõe roadmaps de evolução, e atua como consultor interno ou externo. Em consultorias (ThoughtWorks, Cesar, Aoop), trabalha em projetos de 6-18 meses com clientes corporativos.",
        diferencasDaAreaMae:
          "Dentro de Gestão, o Agile Coach é a evolução natural do Scrum Master sênior, mais estratégico, mais transversal. Diferente do Scrum Master (foco tático em 1-2 times), o Agile Coach atua em nível organizacional. Diferente do Consultor de Gestão tradicional (que prescreve soluções), o Agile Coach usa coaching e perguntas poderosas pra que a organização descubra suas próprias respostas. Cargo mais sênior da carreira ágil. Não existe Agile Coach Júnior. Caminho típico: 5-8 anos como Scrum Master → Agile Coach.",
        habilidadesEspecificas: [
          "Coaching profissional (técnicas ICF, perguntas poderosas)",
          "Frameworks de escala (SAFe, LeSS, Spotify Model, Nexus)",
          "Gestão de mudança organizacional (Kotter, ADKAR)",
          "Treinamento e facilitação de grupos grandes (50+ pessoas)",
          "Visão sistêmica e diagnóstico de cultura organizacional",
        ],
        ferramentasEspecificas: [
          "Miro ou Mural (workshops virtuais grandes)",
          "Frameworks visuais (SAFe Big Picture, Spotify Health Check)",
          "Jira Align ou Targetprocess (gestão ágil em escala)",
          "EasyRetro ou Parabol (retrospectivas em escala)",
          "PowerPoint ou Keynote (apresentações executivas)",
          "Notion ou Confluence (documentação de transformações)",
        ],
        cargos: [
          "Agile Coach Pleno (5-8 anos de Scrum Master)",
          "Senior Agile Coach (8+ anos)",
          "Enterprise Agile Coach (especialista em grandes transformações)",
          "Head of Agility / VP Transformation",
        ],
        faixaSalarial:
          "R$ 15.000 (entrada) a R$ 40.000+ (sênior). Média BR R$ 25.006, Glassdoor 2026. Em consultorias top (ThoughtWorks, Bertha, Aoop) sêniores ultrapassam R$ 35k. Internacional remoto paga US$ 8-15k/mês.",
        dificuldade: 4,
        cursosGratuitos: [
          "Scrum.org: Scaled Professional Scrum (artigos gratuitos)",
          "SAFe Framework: Big Picture e fundamentos (consulta gratuita)",
          "ICAgile: recursos gratuitos sobre Agile Coaching e Lean-Agile",
        ],
        projetosSugeridos: [
          "Estudo de caso completo: transformação ágil de empresa fictícia com baseline + ações + métricas",
          "Workshop de 4h sobre Agile Mindset pra lideranças (slides + dinâmicas)",
          "Diagnóstico de maturidade ágil de organização real ou hipotética com recomendações priorizadas",
        ],
        roadmapEspecifico: [
          "Ter base sólida como Scrum Master sênior (mínimo 5 anos de prática)",
          "Estudar frameworks de escala (SAFe é o mais procurado no BR)",
          "Tirar certificação ICAgile (ICP-ACC é a porta de entrada formal pra Agile Coach)",
          "Aprender coaching profissional (cursos ICF ou formação específica)",
          "Conseguir transição interna: Scrum Master Sênior → Agile Coach (caminho mais comum)",
        ],
        dicasIniciais:
          "Cargo SÊNIOR. Não tente entrar como júnior, vai dar errado. Acumule experiência real como Scrum Master primeiro (5+ anos). ICP-ACC é a certificação mais respeitada da área (custa US$ 1.500-2.500). SAFe SPC é diferencial em multinacionais. Coaching é A skill. Invista em formação real (não só leitura). Cargo perfeito pra quem ama transformações e gosta de trabalhar com lideranças. Inglês é altamente diferencial.",
      },
      {
        slug: "pmo",
        nome: "PMO: Project Management Office",
        descricaoCurta:
          "Estrutura escritórios de projetos. Padroniza processos, controla portfólio, reporta a alta gestão. Forte em empresas tradicionais.",
        descricaoCompleta:
          "PMO (Project Management Office) é a estrutura organizacional que cuida da governança de projetos em uma empresa. Não é cargo único, é uma função que abrange Gerente de Projetos, Analista de PMO e Coordenador de PMO. Em empresas tradicionais (bancos, indústrias, varejo grandes), PMO é o coração da entrega: cuida de prazos, orçamentos, riscos, status reports e governança de portfólio inteiro. Diferente do mundo ágil (Scrum Master, Agile Coach), PMO geralmente segue PMBOK e abordagem mais tradicional/híbrida. Salários: R$ 4-8k júnior, R$ 8-15k pleno, R$ 15-25k sênior. Cargo super estabelecido, mercado maduro em empresas tradicionais.",
        oQueFaz:
          "No dia a dia: monitora projetos do portfólio (prazos, orçamento, riscos), produz status reports semanais pra lideranças, garante aderência a metodologias e padrões internos, facilita comunicação entre projetos e patrocinadores, gerencia riscos e issues escalados, mantém histórico de projetos pra lições aprendidas, e treina gerentes de projeto da empresa em melhores práticas. Em empresas grandes, atua em PMO Estratégico (define padrões), PMO Tático (monitora portfólio) ou PMO Operacional (executa projetos).",
        diferencasDaAreaMae:
          "Dentro de Gestão, o PMO separa-se das funções ágeis pela abordagem: PMO é tradicional/híbrido (PMBOK, prazos fixos, escopo controlado); Scrum Master e Agile Coach são ágeis (iterativo, adaptável). Em muitas empresas brasileiras tradicionais (bancos, indústrias), PMO ainda é o padrão dominante. Agilidade complementa, não substitui. Caminho de carreira distinto: PMO costuma virar Gerente de Projetos → Gerente Sênior → Diretor de Projetos. Certificação PMP é a mais valorizada.",
        habilidadesEspecificas: [
          "PMBOK e ciclo de vida de projetos tradicionais (iniciação, planejamento, execução, controle, encerramento)",
          "Gestão de cronograma (MS Project, Smartsheet)",
          "Gestão de orçamento, EVA (Earned Value Analysis)",
          "Gestão de riscos (matriz de probabilidade x impacto)",
          "Comunicação executiva (status reports, dashboards)",
        ],
        ferramentasEspecificas: [
          "MS Project (padrão em empresas tradicionais)",
          "Smartsheet ou Monday.com (alternativas modernas)",
          "Power BI ou Tableau (dashboards executivos de portfólio)",
          "Excel avançado (ainda massivo no BR)",
          "PowerPoint (apresentações de status pra C-level)",
          "Jira ou Azure DevOps (em empresas híbridas)",
        ],
        cargos: [
          "Analista de PMO Júnior (0-2 anos)",
          "Analista de PMO Pleno / Gerente de Projetos Júnior (2-5 anos)",
          "Gerente de Projetos Sênior / Coordenador PMO (5+ anos)",
          "Gerente de PMO / Diretor de Projetos",
        ],
        faixaSalarial:
          "R$ 4.000 (analista júnior) a R$ 25.000+ (sênior em bancos/multinacionais). Pleno gira em R$ 8-15k. Em bancos grandes (Itaú, Bradesco, Santander), Gerente de Projetos Sênior chega a R$ 18-25k. PMP aumenta significativamente.",
        dificuldade: 3,
        cursosGratuitos: [
          "PMI Brasil: artigos e webinars gratuitos (referência nacional)",
          "Project Management Institute: Project Management Basics (curso gratuito)",
          "Google Project Management Certificate (Coursera audit gratuito)",
        ],
        projetosSugeridos: [
          "Plano de projeto completo (PMBOK) pra projeto fictício: charter, EAP, cronograma, orçamento, riscos",
          "Dashboard executivo de portfólio com 5 projetos hipotéticos no Power BI",
          "Análise pós-projeto: lições aprendidas + recomendações de melhoria",
        ],
        roadmapEspecifico: [
          "Estudar PMBOK 7ª edição (mais moderna, balanceando ágil e tradicional)",
          "Aprender MS Project profundamente (ainda padrão em empresas tradicionais)",
          "Dominar Excel avançado pra orçamentos e cronogramas complexos",
          "Tirar certificação CAPM (entrada) ou PMP (após 4.500h de experiência)",
          "Construir portfólio de projetos gerenciados (CV detalhado com métricas de sucesso)",
        ],
        dicasIniciais:
          "PMP é A certificação da área. Custa US$ 405 (membro PMI) e exige experiência prévia, mas vale o investimento. Em empresas tradicionais, PMO ainda domina sobre ágil, boa carreira se você prefere ambiente estruturado. Combine com conhecimento ágil: profissional híbrido (PMP + PSM I) é o mais procurado em 2026. Inglês é diferencial em multinacionais. Cargo perfeito pra perfis organizados e que gostam de governança.",
      },
    ],
  },
  {
    id: "qa",
    nome: "QA / Testes de Software",
    slug: "qa",
    icon: BadgeCheck,
    tagClass: "tag-qa",
    descricaoCurta:
      "Garante a qualidade e o funcionamento correto dos sistemas.",
    descricaoCompleta:
      "O profissional de QA (Quality Assurance) é responsável por garantir que os sistemas funcionem corretamente, sem bugs e com boa experiência para o usuário. Cria e executa testes manuais e automatizados.",
    oQueFaz:
      "Cria casos de teste, executa testes manuais, automatiza testes, reporta bugs e colabora com desenvolvedores para garantir qualidade.",
    tarefasDiarias: [
      "Criar e executar casos de teste",
      "Reportar e acompanhar bugs",
      "Automatizar testes com ferramentas",
      "Participar de revisões de código",
      "Validar requisitos",
    ],
    perfilIndicado:
      "Gosta de organização, atenção a detalhes e de 'tentar quebrar' as coisas para encontrar problemas.",
    habilidades: [
      "Testes manuais",
      "Selenium ou Cypress",
      "SQL básico",
      "Metodologias ágeis",
      "Documentação",
    ],
    ferramentas: ["Jira", "Selenium", "Cypress", "Postman", "TestRail"],
    dificuldade: 3,
    cargos: [
      "Analista de QA Júnior",
      "Testador de Software",
      "QA Engineer",
      "Analista de Testes",
    ],
    faixaSalarial: "R$ 2.500 a R$ 5.000 (estágio/trainee/júnior)",
    cursosGratuitos: [
      "DIO: Fundamentos de QA",
      "Udemy: QA gratuito (buscar cupons)",
      "YouTube: Canais de QA em português",
    ],
    roadmapInicial: [
      "Entender o que é QA",
      "Aprender testes manuais",
      "Aprender a escrever casos de teste",
      "Aprender Postman para APIs",
      "Aprender automação básica com Cypress",
    ],
    projetos: [
      "Plano de testes para app existente",
      "Automação de testes de login",
      "Relatório de bugs documentado",
    ],
    termosEssenciais: [
      "Caso de teste",
      "Bug",
      "Automação",
      "Regressão",
      "Smoke test",
      "Cobertura de testes",
    ],
    dicasIniciais:
      "Comece pelos testes manuais e documentação. QA é uma ótima porta de entrada para a tecnologia.",
    requiresGraduation: "recomendado",
    tempoMedioFormacao: "6-12 meses com certificação ISTQB",
    crescimentoMercado: "medio",
    faculdadesRelacionadas: [
      "Engenharia de Software",
      "Ciência da Computação",
      "Análise e Desenvolvimento de Sistemas (ADS)",
      "Sistemas de Informação",
    ],
    subareas: [
      {
        slug: "qa-automacao",
        nome: "QA Automação",
        descricaoCurta:
          "Especialista em automação de testes. Cria suites com Cypress, Selenium, Playwright e integra em pipelines CI/CD.",
        descricaoCompleta:
          "QA Automação (ou SDET, Software Development Engineer in Test) é o profissional que constrói e mantém suítes de testes automatizados pra garantir qualidade contínua. Em 2026, é a especialização mais procurada de QA. Empresas modernas exigem CI/CD com testes automatizados, e quem só faz teste manual fica pra trás. Domina ferramentas como Cypress, Playwright, Selenium ou Appium (mobile), integra testes em pipelines, e cobre tipos diversos (E2E, integração, API, contrato). Salário em alta: pleno gira R$ 6-12k, sêniores em fintechs e produtos digitais chegam a R$ 14-20k+. Mercado em transformação por IA (TestBooster, Mabl). Quem domina ferramentas modernas pega vaga rápido.",
        oQueFaz:
          "No dia a dia: escreve testes E2E em Cypress, Playwright ou Selenium pra cobrir jornadas críticas do usuário, automatiza testes de API (Postman, REST Assured, Karate), integra suítes em pipelines CI/CD (Jenkins, GitHub Actions, GitLab CI), trabalha em paralelo com devs pra TDD e BDD, mantém suítes existentes (reduz flaky tests, melhora performance), e participa de cerimônias ágeis garantindo definição de testes. Em times maduros, ajuda na arquitetura de qualidade do produto.",
        diferencasDaAreaMae:
          "Dentro de QA, a Automação separa-se claramente do QA Manual: enquanto o Manual executa testes humanamente (clica, valida, reporta), o Automação escreve código que faz isso por ele continuamente. Diferente do QA Performance (que mede carga e latência), o Automação foca em funcionalidade e regressão. Cargo mais técnico de QA. Exige programação real (JavaScript/TypeScript ou Java). Em 2026 é o caminho mais lucrativo dentro de QA. Empresas pagam mais por automação que por manual.",
        habilidadesEspecificas: [
          "JavaScript/TypeScript (mais comum em 2026 com Cypress/Playwright)",
          "Frameworks de automação (Cypress, Playwright, Selenium)",
          "Testes de API (Postman, REST Assured, Karate)",
          "Integração CI/CD (GitHub Actions, GitLab CI, Jenkins)",
          "BDD/TDD e padrões de teste (Page Object Model, fixtures)",
        ],
        ferramentasEspecificas: [
          "Cypress (mais popular pra frontend moderno)",
          "Playwright (Microsoft, multi-browser, em alta)",
          "Selenium (legado, ainda comum em corporações)",
          "Postman ou Insomnia (testes de API)",
          "Appium (testes mobile cross-platform)",
          "GitHub Actions ou Jenkins (pipelines)",
        ],
        cargos: [
          "QA Automação Júnior (0-2 anos)",
          "QA Automação Pleno / SDET (2-5 anos)",
          "QA Automação Sênior / Senior SDET (5+ anos)",
          "QA Tech Lead / Test Architect",
        ],
        faixaSalarial:
          "R$ 3.500 (júnior) a R$ 20.000+ (sênior). Pleno gira em R$ 6-12k. Sêniores em fintechs e produtos digitais (Stone, iFood, Magalu) chegam a R$ 14-18k. Remoto pra fora paga em dólar (US$ 4-8k/mês).",
        dificuldade: 4,
        cursosGratuitos: [
          "Cypress Real World App (tutorial oficial gratuito, completo)",
          "Playwright Documentação Oficial (excelente, com exemplos práticos)",
          "Test Automation University (Applitools): cursos gratuitos sobre todas as ferramentas",
        ],
        projetosSugeridos: [
          "Suíte de testes E2E completa pra site público (e-commerce, blog) usando Cypress",
          "Testes de API REST pra serviço público (PokeAPI, JSONPlaceholder) com Playwright",
          "Pipeline CI/CD funcional no GitHub Actions executando testes a cada PR",
        ],
        roadmapEspecifico: [
          "Aprender JavaScript/TypeScript profundamente (não basta usar, entender)",
          "Escolher ferramenta principal: Cypress (mais fácil) ou Playwright (mais moderno)",
          "Estudar padrões de teste (Page Object Model, fixtures, custom commands)",
          "Aprender CI/CD básico (GitHub Actions é o mais acessível)",
          "Construir portfólio público no GitHub com 2-3 projetos de automação",
        ],
        dicasIniciais:
          "Cypress é a porta de entrada mais fácil. Comece por ele. Playwright é mais moderno e pago melhor. Vale migrar depois. Não tente entrar em automação sem JavaScript/TypeScript decente. Vaga vai pedir código. Inglês é importante (toda doc em inglês). Mercado mudando rápido com IA. Acompanhe TestBooster, Mabl, mas domine as ferramentas open-source primeiro. Cargo super valorizado em 2026.",
      },
      {
        slug: "qa-manual",
        nome: "QA Manual",
        descricaoCurta:
          "Foco em testes exploratórios, planos de teste e validação funcional. Porta de entrada mais comum em QA.",
        descricaoCompleta:
          "QA Manual é o profissional que executa testes humanamente. Clica em botões, preenche formulários, valida fluxos, descobre bugs sutis que automação não pega. É a porta de entrada mais acessível em QA no Brasil, mas também a mais saturada. Em 2026, mercado prefere quem combina manual com noções de automação. Bom QA Manual é especialista em exploração: encontra bugs em edge cases, valida UX rigorosamente, e produz relatórios claros pra devs. Salário menor que automação: R$ 2.5-5k júnior, R$ 5-9k pleno, R$ 9-14k sênior. Pra escalar carreira: migrar pra automação após 1-2 anos.",
        oQueFaz:
          "No dia a dia: executa casos de teste planejados (manual scripted), faz testes exploratórios (descobre bugs sem roteiro), valida UX em diferentes dispositivos/navegadores, reporta bugs com clareza (steps to reproduce, evidências, severidade), participa de cerimônias ágeis (refinamento, sprint review), valida correções de bugs, e contribui pra base de conhecimento de qualidade do produto. Em times maduros, faz validação de acessibilidade e usabilidade.",
        diferencasDaAreaMae:
          "Dentro de QA, o Manual é o caminho mais acessível. Não precisa programar pra começar. Diferente do QA Automação (que escreve código), o Manual usa raciocínio analítico e atenção a detalhes. Diferente do QA Performance (que mede carga), o Manual valida funcionalidade humanamente. Mercado em transformação: empresas modernas exigem QA Manual com pelo menos noções de automação. Caminho ideal: começa como Manual, aprende automação em 1-2 anos, migra. Quem fica só manual longo prazo encontra teto salarial.",
        habilidadesEspecificas: [
          "Atenção a detalhes e raciocínio analítico (essencial)",
          "Técnicas de teste exploratório (heurísticas, charters)",
          "Documentação clara de bugs (steps to reproduce, evidências)",
          "Conhecimento de ferramentas de gestão (Jira, Azure DevOps)",
          "Comunicação efetiva com devs e stakeholders",
        ],
        ferramentasEspecificas: [
          "Jira ou Azure DevOps (gestão de bugs e casos de teste)",
          "Postman (testes de API básicos)",
          "TestRail ou Zephyr (gestão de casos de teste)",
          "Chrome DevTools (debugging em navegadores)",
          "BrowserStack ou LambdaTest (testes cross-browser)",
          "Charles Proxy ou Fiddler (inspeção de tráfego)",
        ],
        cargos: [
          "QA Júnior / Analista de Testes Júnior (0-2 anos)",
          "QA Pleno / Analista de Testes Pleno (2-5 anos)",
          "QA Sênior / Analista de Testes Sênior (5+ anos)",
          "QA Tech Lead (caminho evolutivo: migrar pra automação)",
        ],
        faixaSalarial:
          "R$ 2.500 (júnior) a R$ 14.000 (sênior). Pleno gira em R$ 5-9k. Sêniores especialistas em domínios complexos (finanças, saúde) chegam a R$ 12k+. Cuidado com teto: QA Manual puro raramente passa de R$ 14k.",
        dificuldade: 2,
        cursosGratuitos: [
          "Curso em Vídeo / Júlio de Lima: Trilha de QA gratuita no YouTube (referência BR)",
          "Test Automation University: cursos manuais e exploratórios gratuitos",
          "Ministry of Testing: comunidade global com recursos gratuitos",
        ],
        projetosSugeridos: [
          "Documentar 50+ casos de teste detalhados pra produto público (Magazine Luiza, iFood)",
          "Sessão de teste exploratório de 2h em site público + bugs documentados em formato real",
          "Bug report estruturado completo (steps, expected vs actual, severidade, screenshots)",
        ],
        roadmapEspecifico: [
          "Aprender fundamentos de testes (heurísticas, técnicas de design, ciclo de vida de bugs)",
          "Praticar documentação clara de bugs (formato STAR ou similar)",
          "Estudar ferramentas básicas (Jira, Postman para APIs)",
          "Conseguir vaga como QA Júnior (porta de entrada mais fácil em tech)",
          "Após 1-2 anos: aprender automação (Cypress/Playwright) pra escalar carreira",
        ],
        dicasIniciais:
          "QA Manual é a porta de entrada mais acessível em tech. Não precisa programar pra começar. MAS: cuidado com o teto salarial. Quem fica só manual longo prazo trava em R$ 10-14k. Use o cargo como trampolim: aprenda automação no 2º ano e migre. Júlio de Lima no YouTube é referência BR. Assista tudo. Inglês ajuda mas não é deal-breaker como em automação. Mercado saturado em júnior. Diferencial é exploração e comunicação clara.",
      },
      {
        slug: "qa-performance",
        nome: "QA Performance",
        descricaoCurta:
          "Testes de carga e estresse. Usa JMeter, k6, Gatling pra validar comportamento de sistemas sob alta demanda.",
        descricaoCompleta:
          "QA Performance é o especialista em testes de carga, stress e capacidade. Garante que o sistema aguenta picos de uso reais (Black Friday, eventos, lançamentos virais) sem cair. Diferente do QA funcional (que valida 'funciona certo?'), o Performance valida 'aguenta a carga?'. Cargo nicho mas super valorizado em e-commerces, fintechs, gateways de pagamento e qualquer produto com alta concorrência. Salário acima da média de QA: pleno R$ 8-15k, sêniores em fintechs e e-commerces grandes chegam a R$ 18-25k. Pouca gente no mercado. Quem domina JMeter, k6, Gatling pega vagas raramente competitivas.",
        oQueFaz:
          "No dia a dia: planeja testes de carga simulando cenários reais (picos de venda, eventos), constrói scripts em JMeter, k6 ou Gatling, executa testes em ambientes de homologação (ou produção controlada), analisa métricas (latência p95/p99, throughput, taxa de erro), identifica gargalos de performance (DB, código, infra), trabalha com devs e DevOps pra otimizar, e produz relatórios técnicos detalhados. Em e-commerces, prepara o sistema pra Black Friday meses antes.",
        diferencasDaAreaMae:
          "Dentro de QA, o Performance é o cargo mais técnico e especializado, diferente do QA Manual (foco em UX e funcionalidade) e Automação (foco em regressão), o Performance lida com capacidade e escala. Mais próximo de SRE/DevOps que de QA tradicional. Precisa entender infraestrutura, banco de dados, profiling. Cargo nicho. Empresas pequenas terceirizam; empresas grandes têm 1-2 especialistas. Caminho de carreira: pode virar SRE ou Performance Engineer (cargo internacional bem pago).",
        habilidadesEspecificas: [
          "Ferramentas de teste de carga (JMeter, k6, Gatling, Locust)",
          "Análise de métricas (latência, throughput, percentis, taxa de erro)",
          "Profiling de aplicações (identificar gargalos em código)",
          "Banco de dados (queries lentas, índices, locks)",
          "Infraestrutura básica (load balancers, cache, CDN, scaling)",
        ],
        ferramentasEspecificas: [
          "JMeter (clássico, ainda padrão em corporações)",
          "k6 (moderno, JavaScript, em alta)",
          "Gatling (Scala, performance superior pra cargas pesadas)",
          "Locust (Python, fácil pra quem já programa)",
          "Grafana + Prometheus (visualização de métricas)",
          "New Relic ou Datadog (APM em produção)",
        ],
        cargos: [
          "QA Performance Júnior (raro, geralmente vem de QA Automação)",
          "QA Performance Pleno (3+ anos)",
          "QA Performance Sênior (5+ anos)",
          "Performance Engineer / Site Reliability Engineer (transição comum)",
        ],
        faixaSalarial:
          "R$ 5.000 (júnior raro) a R$ 25.000+ (sênior em fintechs/e-commerces). Pleno gira em R$ 8-15k. Especialistas em e-commerce de grande porte (Magalu, Americanas, Mercado Livre) chegam a R$ 18-22k. Remoto pra fora paga em dólar.",
        dificuldade: 4,
        cursosGratuitos: [
          "k6 Documentation Oficial (excelente, com exemplos práticos completos)",
          "JMeter Tutorial: Apache (oficial, ainda referência)",
          "Test Automation University: Performance Testing tracks gratuitas",
        ],
        projetosSugeridos: [
          "Teste de carga em API pública: 100 → 1.000 → 10.000 usuários simultâneos",
          "Identificar gargalo em projeto open-source: rodar perfil + propor otimização",
          "Dashboard Grafana mostrando métricas de teste em tempo real",
        ],
        roadmapEspecifico: [
          "Ter base de QA (manual ou automação), 2+ anos",
          "Aprender fundamentos de redes, banco de dados e cloud",
          "Dominar uma ferramenta principal (k6 é o mais moderno e versátil)",
          "Estudar análise de métricas (latência, percentis, throughput)",
          "Construir portfólio: 2-3 testes públicos com análise técnica detalhada",
        ],
        dicasIniciais:
          "Nicho mais técnico de QA. Não tente entrar sem base sólida. k6 é o caminho mais inteligente em 2026 (JavaScript, moderno, fácil de aprender). JMeter ainda é importante pra corporações tradicionais. Vale muito a pena se você vem de DevOps ou Backend. Sua experiência se traduz bem. Inglês é obrigatório. Cargo raro = pouca competição = salário acima da média de QA.",
      },
    ],
  },
  {
    id: "mobile",
    nome: "Desenvolvimento Mobile",
    slug: "mobile",
    icon: Smartphone,
    tagClass: "tag-mobile",
    descricaoCurta: "Cria aplicativos para celulares e tablets.",
    descricaoCompleta:
      "O desenvolvedor mobile cria aplicativos para dispositivos móveis (iOS e Android). Pode trabalhar com desenvolvimento nativo (Swift para iOS, Kotlin para Android) ou multiplataforma (React Native, Flutter).",
    oQueFaz:
      "Desenvolve funcionalidades de apps, integra APIs, otimiza performance em dispositivos móveis e publica apps nas lojas.",
    tarefasDiarias: [
      "Desenvolver telas e funcionalidades do app",
      "Integrar APIs e serviços externos",
      "Testar em diferentes dispositivos",
      "Publicar atualizações nas lojas",
      "Corrigir bugs",
    ],
    perfilIndicado:
      "Gosta de criar produtos que as pessoas usam no dia a dia no celular. Curte ver resultados práticos.",
    habilidades: [
      "React Native ou Flutter",
      "JavaScript ou Dart",
      "APIs REST",
      "Git",
      "Publicação nas lojas",
    ],
    ferramentas: ["VS Code", "Android Studio", "Xcode", "Expo", "Firebase"],
    dificuldade: 4,
    cargos: [
      "Desenvolvedor Mobile Júnior",
      "Desenvolvedor React Native",
      "Desenvolvedor Flutter",
      "Engenheiro Mobile",
    ],
    faixaSalarial: "R$ 3.000 a R$ 6.000 (trainee/júnior)",
    cursosGratuitos: [
      "Rocketseat: React Native",
      "Flutter.dev: Documentação oficial gratuita",
      "DIO: Desenvolvimento Mobile",
    ],
    roadmapInicial: [
      "Aprender JavaScript (para React Native) ou Dart (para Flutter)",
      "Escolher entre React Native ou Flutter",
      "Criar app simples (lista de tarefas)",
      "Aprender integração com APIs",
      "Publicar app na Play Store",
    ],
    projetos: [
      "App de lista de tarefas",
      "App de clima simples",
      "Clone de tela de app famoso",
    ],
    termosEssenciais: [
      "React Native",
      "Flutter",
      "APK",
      "Play Store",
      "App Store",
      "Expo",
    ],
    dicasIniciais:
      "Se já sabe JavaScript, comece com React Native. Se está do zero, Flutter com Dart é excelente opção.",
    requiresGraduation: "opcional",
    tempoMedioFormacao: "9-15 meses até primeira vaga",
    crescimentoMercado: "alto",
    faculdadesRelacionadas: [
      "Análise e Desenvolvimento de Sistemas (ADS)",
      "Ciência da Computação",
      "Engenharia de Software",
      "Sistemas de Informação",
    ],
    subareas: [
      {
        slug: "ios-nativo",
        nome: "iOS Nativo",
        descricaoCurta:
          "Desenvolvimento exclusivo pra Apple com Swift e Xcode. Foco em apps que aproveitam ao máximo recursos do iOS.",
        descricaoCompleta:
          "Desenvolvedor iOS Nativo é o profissional que constrói apps especificamente pra ecossistema Apple (iPhone, iPad, Apple Watch, Vision Pro) usando Swift e SwiftUI. Diferente do React Native (cross-platform), iOS Nativo entrega performance máxima e acesso completo às APIs Apple (Face ID, ARKit, HealthKit, etc). Cargo mais raro que React Native no Brasil mas super valorizado. Glassdoor mostra média de R$ 6.042, mas faixa real é R$ 4-8k júnior, R$ 7-12k pleno, R$ 11-20k sênior (Melhores Empregos confirma R$ 11-20k pra sênior). Mercado BR menor que React Native (apps brasileiros priorizam cross-platform), mas internacional remoto super aquecido.",
        oQueFaz:
          "No dia a dia: desenvolve apps em Swift com UIKit (antigo) ou SwiftUI (moderno), integra com APIs REST/GraphQL, implementa recursos exclusivos iOS (Face ID, push notifications, deep links, widgets, Live Activities), otimiza performance (memory, battery, CPU), publica na App Store seguindo guidelines rigorosos da Apple, e atualiza apps conforme novas versões do iOS. Trabalha com Xcode (IDE da Apple, exige Mac obrigatoriamente).",
        diferencasDaAreaMae:
          "Dentro de Mobile, o iOS Nativo separa-se do React Native pelo modelo: nativo entrega performance máxima e acesso 100% às APIs Apple; React Native sacrifica algumas em troca de cross-platform. Diferente do Android Nativo (Kotlin/Java), iOS usa Swift + ecossistema Apple: Mac obrigatório, App Store rigorosa, padrões visuais específicos (Human Interface Guidelines). Mercado BR menor que React Native, mas internacional é forte. Cargo perfeito pra quem ama produtos premium e tem Mac (obrigatório).",
        habilidadesEspecificas: [
          "Swift profundo (linguagem oficial Apple)",
          "SwiftUI (moderno) + UIKit (legado, ainda comum)",
          "Combine ou async/await (programação reativa Apple)",
          "Integração com APIs Apple (Face ID, ARKit, HealthKit, MapKit)",
          "App Store submission e guidelines (HIG da Apple)",
        ],
        ferramentasEspecificas: [
          "Xcode (IDE obrigatória, só roda em Mac)",
          "Swift Package Manager (gestão de dependências)",
          "TestFlight (distribuição beta)",
          "Instruments (profiling de performance)",
          "Firebase ou OneSignal (push notifications)",
          "Sentry ou Bugsnag (crash reporting)",
        ],
        cargos: [
          "Desenvolvedor iOS Júnior (0-2 anos)",
          "Desenvolvedor iOS Pleno (2-5 anos)",
          "Desenvolvedor iOS Sênior (5+ anos)",
          "Tech Lead iOS / Staff Engineer Mobile",
        ],
        faixaSalarial:
          "R$ 4.000 (júnior) a R$ 20.000+ (sênior). Média BR R$ 6.042-6.877, Glassdoor/Indeed 2026. Pleno gira em R$ 7-12k. Sênior em fintechs e remoto pra fora chega a R$ 15-20k+. Internacional remoto paga US$ 5-10k/mês.",
        dificuldade: 3,
        cursosGratuitos: [
          "Apple Developer: Swift e SwiftUI Tutorials (oficial gratuito, excelente)",
          "Hacking with Swift (Paul Hudson): referência mundial, conteúdo gratuito massivo",
          "Stanford CS193p: Developing Apps for iOS (curso completo no YouTube)",
        ],
        projetosSugeridos: [
          "Clone funcional de app conhecido (Calculator, Weather, Notes) com SwiftUI",
          "App próprio resolvendo problema seu: publicar na App Store (US$ 99/ano)",
          "Contribuir pra biblioteca open-source iOS no GitHub (peso enorme no CV)",
        ],
        roadmapEspecifico: [
          "ATENÇÃO: precisa de Mac (Apple obrigatório pra desenvolver iOS)",
          "Aprender Swift profundamente (linguagem moderna, expressiva)",
          "Estudar SwiftUI (futuro) + UIKit (legado, ainda em projetos antigos)",
          "Construir 2-3 apps próprios completos com publicação na App Store",
          "Contribuir pra projetos open-source iOS (Alamofire, Kingfisher, etc)",
        ],
        dicasIniciais:
          "Mac é OBRIGATÓRIO. Sem ele, esquece iOS. Apple Developer Program custa US$ 99/ano pra publicar. Comece com SwiftUI (futuro) mas saiba UIKit (ainda em projetos legados). Inglês é altamente diferencial, comunidade quase 100% em inglês. Mercado BR menor que Android e React Native, MAS remoto internacional paga muito bem. Considere combinar com Kotlin Multiplatform (KMP). Empresas pagam mais por quem cobre os dois.",
      },
      {
        slug: "android-nativo",
        nome: "Android Nativo",
        descricaoCurta:
          "Desenvolvimento exclusivo pra Android com Kotlin e Android Studio. Performance e integração profunda com o sistema.",
        descricaoCompleta:
          "Desenvolvedor Android Nativo é o profissional que constrói apps especificamente pra ecossistema Android usando Kotlin (linguagem oficial Google desde 2017) e Jetpack Compose (UI moderna). Diferente do React Native (cross-platform), o Android Nativo entrega performance máxima e acesso completo às APIs Android. Mercado BR muito maior que iOS. BeBee registra 1.04M+ vagas relacionadas a Android, vs ~250k de iOS. Salários: média de Desenvolvedor Mobile R$ 5.626 (Trybe/Glassdoor), com sêniores chegando a R$ 10.963. Em fintechs (Nubank, PicPay, Stone), sêniores ultrapassam R$ 15-20k. Brasil é mercado-chave: 80%+ dos smartphones rodam Android.",
        oQueFaz:
          "No dia a dia: desenvolve apps em Kotlin com Jetpack Compose (moderno) ou XML/Views (legado), integra com APIs REST/GraphQL, implementa recursos Android (notifications, deep links, widgets, work manager), otimiza performance pra dispositivos variados (Android é fragmentado, de devices baratos a flagships), publica na Google Play seguindo guidelines, e atualiza apps conforme novas versões do Android. Trabalha com Android Studio (IDE do Google, gratuita, roda em qualquer OS).",
        diferencasDaAreaMae:
          "Dentro de Mobile, o Android Nativo separa-se do React Native pelo modelo: nativo entrega performance máxima e acesso 100% às APIs Android; React Native sacrifica em troca de cross-platform. Diferente do iOS Nativo (Swift, Mac obrigatório), Android usa Kotlin/Java e roda em Windows/Linux/Mac, barreira de entrada menor. Mercado BR MUITO maior que iOS (1M+ vagas Android vs 250k iOS). Brasileiro usa Android massivamente. Cargo perfeito pra quem quer profundidade em uma plataforma com mercado grande.",
        habilidadesEspecificas: [
          "Kotlin profundo (linguagem oficial Android desde 2017)",
          "Jetpack Compose (UI moderna) + XML/Views (legado, ainda comum)",
          "Arquitetura MVVM, MVI, Clean Architecture",
          "Coroutines e Flow (programação assíncrona Kotlin)",
          "Google Play submission e Material Design Guidelines",
        ],
        ferramentasEspecificas: [
          "Android Studio (IDE oficial Google, gratuita)",
          "Gradle (build system)",
          "Retrofit + OkHttp (clientes HTTP)",
          "Room (banco SQLite local)",
          "Firebase (push, analytics, crash)",
          "LeakCanary ou Sentry (debugging avançado)",
        ],
        cargos: [
          "Desenvolvedor Android Júnior (0-2 anos)",
          "Desenvolvedor Android Pleno (2-5 anos)",
          "Desenvolvedor Android Sênior (5+ anos)",
          "Tech Lead Android / Staff Engineer Mobile",
        ],
        faixaSalarial:
          "R$ 3.215 (júnior) a R$ 20.000+ (sênior). Média BR R$ 5.626, Trybe/Glassdoor 2026. Pleno gira em R$ 6-11k. Sênior em fintechs (Nubank, PicPay, Inter, Stone) chega a R$ 15-22k. Remoto pra fora paga US$ 5-10k/mês.",
        dificuldade: 3,
        cursosGratuitos: [
          "Android Developers: cursos oficiais do Google (gratuitos, completos)",
          "Kotlin Documentation Oficial + Kotlin Koans (gratuito, interativo)",
          "Philipp Lackner (YouTube): referência mundial em Android com Kotlin",
        ],
        projetosSugeridos: [
          "Clone funcional de app conhecido (Notes, Weather, Calculator) com Jetpack Compose",
          "App próprio resolvendo problema seu: publicar na Google Play (US$ 25 uma vez)",
          "Contribuir pra biblioteca open-source Android no GitHub",
        ],
        roadmapEspecifico: [
          "Aprender Kotlin profundamente (linguagem moderna, expressiva)",
          "Estudar Jetpack Compose (futuro) + Views/XML (legado, ainda em projetos antigos)",
          "Aprender arquitetura MVVM ou Clean Architecture",
          "Construir 2-3 apps próprios completos com publicação na Google Play",
          "Especializar em área específica (security, performance, ML on-device)",
        ],
        dicasIniciais:
          "Não precisa de Mac (vantagem sobre iOS). Android Studio roda em qualquer OS. Google Play custa US$ 25 uma vez (vs US$ 99/ano da Apple). Comece com Jetpack Compose (futuro) mas saiba Views/XML (legado). Brasil é gigante em Android. Vagas abundam. Inglês é diferencial. Considere combinar com Kotlin Multiplatform (KMP) pra também cobrir iOS. Empresas pagam mais por quem cobre os dois.",
      },
      {
        slug: "react-native",
        nome: "React Native",
        descricaoCurta:
          "Framework do Meta pra apps cross-platform com JavaScript. Mercado BR muito aquecido (40k+ vagas).",
        descricaoCompleta:
          "Desenvolvedor React Native é o profissional que constrói apps mobile pra iOS e Android usando uma única base de código JavaScript/TypeScript com React. Diferente do desenvolvimento nativo (Swift/Kotlin), entrega 80-90% da experiência nativa com metade do esforço. Por isso é o framework mais procurado no mercado BR em 2026: BeBee registra 48k+ vagas relacionadas, com salários partindo de R$ 3-4k pra júnior e chegando a R$ 11-20k pra sênior. Empresas brasileiras (Magazine Luiza, Vivo, fintechs, startups) preferem React Native pela velocidade de entrega e pelo pool gigante de devs React que podem migrar pra mobile.",
        oQueFaz:
          "No dia a dia: desenvolve telas e componentes em JavaScript/TypeScript com React, integra com APIs REST/GraphQL do backend, implementa navegação (React Navigation), gerencia estado (Redux, Zustand, Context API), trabalha com bibliotecas nativas (câmera, push notifications, deep links), otimiza performance pra rodar bem em dispositivos variados, e faz deploy pra App Store e Google Play (Expo ou bare workflow). Colabora com designers em handoff de Figma e com backend pra integração de dados.",
        diferencasDaAreaMae:
          "Dentro de Mobile, o React Native separa-se do iOS Nativo e Android Nativo pelo modelo: cross-platform vs nativo. Diferente do Flutter (framework do Google com Dart), React Native usa JavaScript, linguagem que dev web já conhece, facilitando migração de carreira. Não é só 'web pra mobile': renderiza componentes nativos reais, não webview. Cargo é o mais procurado em Mobile no BR (40k+ vagas vs ~10k iOS nativo), porque uma pessoa entrega pra duas plataformas. Ideal pra quem vem de Frontend React e quer expandir pra mobile.",
        habilidadesEspecificas: [
          "JavaScript/TypeScript profundo (com React)",
          "React Native API e ecossistema (Expo, React Navigation, Reanimated)",
          "Integração com APIs REST e GraphQL",
          "Gestão de estado em apps (Redux Toolkit, Zustand, Context)",
          "Conhecimento básico nativo (debugging em iOS/Android, builds, releases)",
        ],
        ferramentasEspecificas: [
          "React Native + TypeScript",
          "Expo (mais comum em projetos novos e empresas médias)",
          "VS Code + ESLint + Prettier",
          "Xcode (mac) ou Android Studio (builds)",
          "Firebase ou OneSignal (push notifications)",
          "Sentry ou Bugsnag (crash reporting)",
        ],
        cargos: [
          "Desenvolvedor React Native Júnior (0-2 anos)",
          "Desenvolvedor React Native Pleno (2-5 anos)",
          "Desenvolvedor React Native Sênior (5+ anos)",
          "Tech Lead Mobile / Staff Engineer",
        ],
        faixaSalarial:
          "R$ 3.100 (júnior) a R$ 20.000 (sênior em grandes empresas). Média BR R$ 7.458, Glassdoor 2026. Pleno gira em R$ 7-12k. Vagas internacionais remotas pagam US$ 4.000-7.000/mês (R$ 20k+).",
        dificuldade: 3,
        cursosGratuitos: [
          "React Native Express (reactnative.express): curso completo gratuito em inglês",
          "Rocketseat: Trilha React Native (parte gratuita das playlists do YouTube)",
          "Documentação oficial React Native + Expo (referência principal, gratuita)",
        ],
        projetosSugeridos: [
          "Clone de app conhecido (Instagram feed, Spotify mini, Trello) com publicação na loja",
          "App próprio resolvendo problema real seu: lista de tarefas, controle financeiro, hábitos",
          "Componente reutilizável publicado no npm (biblioteca pequena com docs)",
        ],
        roadmapEspecifico: [
          "Dominar JavaScript/TypeScript + React (web) profundamente primeiro",
          "Aprender React Native via Expo (caminho mais rápido em 2026)",
          "Estudar navegação, estado e integração com APIs no contexto mobile",
          "Construir 2-3 apps completos com publicação na Google Play (TestFlight no iOS exige mac)",
          "Contribuir pra biblioteca open-source React Native (peso enorme no currículo)",
        ],
        dicasIniciais:
          "Se você já sabe React (web), React Native é o caminho mais rápido pra mobile, 2-3 meses de transição. Comece com Expo (não bare): você publica apps sem precisar de mac no início. Mac vira necessário só pra build iOS final. TypeScript é obrigatório em 2026. Vagas que pedem JS puro são raras. Publique pelo menos 1 app na Google Play (de graça). Recrutadores adoram ver app real funcionando.",
      },
      {
        slug: "flutter",
        nome: "Flutter",
        descricaoCurta:
          "Framework do Google pra apps cross-platform com Dart. Ganhou força nos últimos anos, principalmente em startups.",
        descricaoCompleta:
          "Desenvolvedor Flutter é o profissional que constrói apps mobile cross-platform usando Flutter (framework do Google) e Dart (linguagem do Google). Diferente do React Native (JavaScript, framework do Meta), Flutter renderiza tudo via Skia/Impeller. Entrega performance superior próxima ao nativo. Mercado BR menor que React Native (Glassdoor mostra 158 salários vs 1.000+ de RN), mas em crescimento. Salários: júnior gira R$ 4.271, sêniores chegam a R$ 21k+ (90º percentil R$ 31k Glassdoor 2026). Empresas que escolhem Flutter geralmente valorizam performance e produtos premium. Comunidade BR ativa e crescente.",
        oQueFaz:
          "No dia a dia: desenvolve apps em Dart usando widgets Flutter (Stateless/Stateful), gerencia estado com Provider, Riverpod ou BLoC, integra com APIs REST/GraphQL, navega entre telas (GoRouter, AutoRoute), implementa recursos nativos via plugins (câmera, push, deep links), publica apps em App Store e Google Play (single codebase), e otimiza performance pra dispositivos variados. Trabalha com Android Studio ou VS Code.",
        diferencasDaAreaMae:
          "Dentro de Mobile, o Flutter compete diretamente com React Native. Ambos cross-platform, decisão entre eles é tecnológica. Flutter usa Dart (linguagem própria, curva de aprendizado maior) e renderiza widgets via Skia (performance superior, look idêntico em iOS/Android). React Native usa JavaScript (pool gigante de devs web) e componentes nativos (visual nativo por plataforma). Diferente de iOS/Android Nativos, Flutter sacrifica acesso completo a APIs em troca de cross-platform. No BR, mercado menor que RN mas crescente. Empresas Google-friendly preferem Flutter.",
        habilidadesEspecificas: [
          "Dart profundo (linguagem do Google, similar a Java/Kotlin)",
          "Flutter framework (widgets, ciclo de vida, animações)",
          "Gerenciamento de estado (Provider, Riverpod, BLoC, GetX)",
          "Integração com APIs (REST e GraphQL via http, Dio, graphql_flutter)",
          "Plugins nativos e configuração platform-specific",
        ],
        ferramentasEspecificas: [
          "Flutter SDK + Dart (oficial Google)",
          "Android Studio ou VS Code (IDE)",
          "Provider, Riverpod ou BLoC (gestão de estado)",
          "GoRouter ou AutoRoute (navegação)",
          "Firebase (backend mais comum com Flutter)",
          "Sentry ou Crashlytics (crash reporting)",
        ],
        cargos: [
          "Desenvolvedor Flutter Júnior (0-2 anos)",
          "Desenvolvedor Flutter Pleno (2-5 anos)",
          "Desenvolvedor Flutter Sênior (5+ anos)",
          "Tech Lead Mobile (Flutter)",
        ],
        faixaSalarial:
          "R$ 3.677 (júnior) a R$ 31.300 (90º percentil sênior). Média BR R$ 5.688, Glassdoor 2026 (158 respondentes). Pleno gira em R$ 6-12k. Sêniores em empresas que apostam no Flutter (Boticário, Drogaria Araujo, Turbi) chegam a R$ 15-21k. Remoto pra fora paga em dólar.",
        dificuldade: 3,
        cursosGratuitos: [
          "Flutter.dev: Documentação oficial e codelabs (Google, gratuitos, excelentes)",
          "Cod3r / Cleyton (YouTube): Flutter completo em PT-BR gratuito",
          "Flutter Brasil (comunidade Discord + Telegram): referência BR ativa",
        ],
        projetosSugeridos: [
          "Clone funcional de app conhecido (Spotify, Instagram feed) com Flutter + Firebase",
          "App próprio resolvendo problema seu: publicar nas DUAS lojas (Google Play + App Store)",
          "Contribuir pra pacote pub.dev (gerenciador de pacotes Flutter) com biblioteca útil",
        ],
        roadmapEspecifico: [
          "Aprender Dart (linguagem nova mas similar a Java/Kotlin/Swift)",
          "Dominar Flutter widgets básicos (Stateless, Stateful, layouts)",
          "Estudar gerenciamento de estado (Riverpod é o mais moderno em 2026)",
          "Construir 2-3 apps próprios completos com publicação nas lojas",
          "Especializar em área (animations, performance, multiplataforma desktop/web)",
        ],
        dicasIniciais:
          "Mercado BR menor que React Native. Pense bem antes de escolher. Vantagem do Flutter: performance superior, código único entre iOS/Android, apps visualmente idênticos. Desvantagem: comunidade BR menor, vagas mais restritas. Dart é linguagem nova mas fácil pra quem já programa em Java/Kotlin/Swift. Cod3r e Flutter Brasil são as melhores fontes em PT-BR. Inglês é importante (doc oficial em inglês). Cargo perfeito pra quem ama Google ecosystem.",
      },
    ],
  },
  {
    id: "devops",
    nome: "DevOps",
    slug: "devops",
    icon: GitBranch,
    tagClass: "tag-devops",
    descricaoCurta:
      "Une desenvolvimento e operações para entregas mais rápidas.",
    descricaoCompleta:
      "DevOps é uma cultura e conjunto de práticas que une desenvolvimento de software e operações de TI, com foco em automação, integração contínua e entrega contínua (CI/CD) para acelerar e melhorar as entregas.",
    oQueFaz:
      "Configura pipelines de CI/CD, gerencia infraestrutura como código, monitora sistemas em produção e automatiza processos de deploy.",
    tarefasDiarias: [
      "Configurar e manter pipelines CI/CD",
      "Gerenciar containers com Docker/Kubernetes",
      "Monitorar sistemas em produção",
      "Automatizar processos de infraestrutura",
      "Colaborar com times de dev e ops",
    ],
    perfilIndicado:
      "Gosta de automação, infraestrutura e de otimizar processos. Tem perfil técnico e gosta de resolver problemas complexos.",
    habilidades: [
      "Linux",
      "Docker e Kubernetes",
      "CI/CD (Jenkins, GitHub Actions)",
      "Cloud (AWS/Azure/GCP)",
      "Scripting (Bash, Python)",
    ],
    ferramentas: [
      "Docker",
      "Kubernetes",
      "Jenkins",
      "GitHub Actions",
      "Terraform",
      "Ansible",
    ],
    dificuldade: 5,
    cargos: [
      "Engenheiro DevOps Júnior",
      "SRE",
      "Engenheiro de Plataforma",
      "Cloud Engineer",
    ],
    faixaSalarial: "R$ 4.000 a R$ 8.000 (trainee/júnior)",
    cursosGratuitos: [
      "Linux Foundation: Cursos gratuitos",
      "Docker: Documentação oficial",
      "GitHub Actions: Documentação gratuita",
    ],
    roadmapInicial: [
      "Aprender Linux",
      "Aprender Git e GitHub",
      "Aprender Docker",
      "Estudar CI/CD com GitHub Actions",
      "Aprender Kubernetes básico",
    ],
    projetos: [
      "Pipeline CI/CD para projeto pessoal",
      "Containerizar aplicação com Docker",
      "Configurar monitoramento básico",
    ],
    termosEssenciais: [
      "CI/CD",
      "Container",
      "Docker",
      "Kubernetes",
      "Pipeline",
      "IaC",
    ],
    dicasIniciais:
      "Comece com Linux e Docker. São fundamentais para qualquer área de DevOps e Cloud.",
    roadmapStatus: "coming-soon" as const,
    requiresGraduation: "opcional",
    tempoMedioFormacao: "2-3 anos com base em backend/sysadmin",
    crescimentoMercado: "alto",
    faculdadesRelacionadas: [
      "Ciência da Computação",
      "Engenharia de Software",
      "Sistemas de Informação",
      "Análise e Desenvolvimento de Sistemas (ADS)",
    ],
    subareas: [
      {
        slug: "platform-engineer",
        nome: "Platform Engineer",
        descricaoCurta:
          "Constrói plataformas internas que outros times de dev consomem. Foco em developer experience e self-service.",
        descricaoCompleta:
          "Platform Engineer é a evolução do DevOps em 2026: profissional que constrói Internal Developer Platforms (IDPs), plataformas internas de self-service que abstraem complexidade de Kubernetes, Terraform e cloud, deixando devs focarem em produto. Diferente do DevOps tradicional (que opera infra), o Platform Engineer trata desenvolvedores internos como clientes e a plataforma como produto. Gartner prevê que 80% das empresas terão times de plataforma até 2027. No BR, Mercado Livre, iFood, Nubank já operam com times maduros. Salário top do DevOps: média SP R$ 15.583, pleno R$ 11k-22k, sêniores chegam a R$ 44.500 (90º percentil, Glassdoor 2026). Mercado super aquecido pelo gap de profissionais.",
        oQueFaz:
          "No dia a dia: constrói plataformas internas usando Backstage (Spotify, padrão global), Crossplane (provisionamento) e ArgoCD (GitOps), define 'Golden Paths', caminhos padronizados pra criar serviços novos, automatiza provisionamento de recursos (databases, caches, queues), reduz cognitive load dos devs, mede adoção da plataforma (devs como clientes), e itera baseado em feedback. Trabalha como product manager de uma plataforma técnica, produto-thinking aplicado a infra.",
        diferencasDaAreaMae:
          "Dentro de DevOps, o Platform Engineer é a evolução natural, diferente do DevOps tradicional (que opera infra reativamente, com tickets), o Platform Engineer constrói self-service proativo. Diferente do SRE (que foca em confiabilidade), o Platform Engineer foca em developer experience (DX). Diferente do DevSecOps (que adiciona segurança), o Platform Engineer adiciona produto-thinking. É o cargo mais sênior e bem pago de DevOps em 2026. Exige experiência sólida em DevOps + visão de produto.",
        habilidadesEspecificas: [
          "Kubernetes profundo (CKA é cobrada em ~40% das vagas)",
          "Infrastructure as Code (Terraform, Crossplane, Pulumi)",
          "Backstage (Spotify): padrão global pra developer portals",
          "GitOps (ArgoCD, Flux) e CI/CD avançado",
          "Product-thinking aplicado a plataforma (devs como clientes)",
        ],
        ferramentasEspecificas: [
          "Backstage (Spotify, padrão global pra IDPs)",
          "Crossplane (provisionamento declarativo)",
          "ArgoCD ou Flux (GitOps)",
          "Terraform ou OpenTofu (IaC)",
          "Kubernetes + Helm (orquestração)",
          "Datadog ou Grafana (observabilidade)",
        ],
        cargos: [
          "Platform Engineer Pleno (vindo de DevOps, 3+ anos)",
          "Senior Platform Engineer (5+ anos)",
          "Staff Platform Engineer (arquitetura de plataforma)",
          "Principal Platform Engineer / Head of Platform",
        ],
        faixaSalarial:
          "R$ 11.063 (pleno baixo) a R$ 44.500 (sênior top 10%). Média SP R$ 15.583, Glassdoor 2026. Sêniores em Mercado Livre, iFood, Nubank passam R$ 25-35k. Remoto pra fora paga US$ 8-15k/mês. Cargo mais bem pago de DevOps.",
        dificuldade: 5,
        cursosGratuitos: [
          "Backstage Documentação Oficial (excelente, com tutoriais completos)",
          "CNCF Platforms Working Group: recursos gratuitos sobre Platform Engineering",
          "PlatformCon (conferência gratuita anual, todas talks no YouTube)",
        ],
        projetosSugeridos: [
          "Setup completo do Backstage com 3-5 plugins em cluster K8s próprio",
          "Crossplane composition pra provisionar PostgreSQL + cache + monitoring automaticamente",
          "GitOps end-to-end: dev faz commit → ArgoCD detecta → deploy automático em produção",
        ],
        roadmapEspecifico: [
          "Ter base sólida de DevOps (Docker, K8s, CI/CD, cloud, Terraform), 3+ anos",
          "Estudar Platform Engineering como disciplina (Team Topologies, Platform as Product)",
          "Aprender Backstage profundamente (padrão da área)",
          "Aprender Crossplane + ArgoCD (Kubernetes-native)",
          "Construir IDP completo em ambiente próprio + documentar como produto",
        ],
        dicasIniciais:
          "Cargo mais sênior do DevOps. Não tente entrar sem 3+ anos de DevOps tradicional. Backstage é A ferramenta. Invista 2-3 meses dominando. Mindset de produto é o diferencial: tratar devs como clientes muda tudo. CKA é cobrada em quase metade das vagas. Vale tirar. Inglês é obrigatório (toda doc, talks e community em inglês). Brasil está atrasado nessa onda (~2 anos). Quem entrar agora pega salários acima do normal por 3-5 anos.",
      },
      {
        slug: "devsecops",
        nome: "DevSecOps",
        descricaoCurta:
          "Integra segurança no ciclo CI/CD. SAST/DAST, secrets management, hardening de pipelines. Subárea em forte crescimento (3.4k+ vagas BR).",
        descricaoCompleta:
          "DevSecOps é a evolução do DevOps com integração obrigatória de segurança em cada etapa do ciclo de desenvolvimento, desde o primeiro commit até o deploy em produção. Não é cargo opcional: virou requisito em fintechs, bancos e empresas que lidam com dados sensíveis (LGPD, PCI-DSS). Profissional integra ferramentas de scan de código (SAST, DAST, SCA), gerencia secrets, faz hardening de pipelines e containers. Mercado super aquecido em 2026: Glassdoor mostra 311+ vagas ativas, BeBee 3.4k+, com média salarial de R$ 9.030 e sêniores chegando a R$ 19.200. Em fintechs e bancos, ultrapassa R$ 25k facilmente.",
        oQueFaz:
          "No dia a dia: integra ferramentas de segurança em pipelines CI/CD (Semgrep, SonarQube, Snyk, Burp), automatiza varredura de vulnerabilidades em código e dependências, configura gestão de secrets (Vault, AWS Secrets Manager), faz hardening de containers e clusters Kubernetes, responde a incidentes de segurança em produção, audita ambientes cloud (IAM, redes, configurações), e trabalha com times de dev pra educar sobre práticas seguras (shift-left security). Garante compliance (LGPD, PCI-DSS, ISO 27001).",
        diferencasDaAreaMae:
          "Dentro de DevOps, o DevSecOps adiciona uma camada crítica: segurança em cada etapa do pipeline, não como auditoria pós-deploy. Diferente do AppSec (subárea de Cibersegurança focada em código de aplicação), o DevSecOps cobre todo o ciclo: código, build, deploy, runtime, infraestrutura. Diferente do Platform Engineer (que constrói plataformas internas), o DevSecOps protege essas plataformas. É a porta de entrada ideal pra quem vem de DevOps tradicional e quer subir salário. Segurança é o diferencial que mais paga em DevOps moderno.",
        habilidadesEspecificas: [
          "CI/CD avançado (Jenkins, GitLab CI, GitHub Actions)",
          "SAST, DAST e SCA (Semgrep, SonarQube, Snyk, OWASP ZAP)",
          "Segurança em containers e Kubernetes (image scanning, runtime security)",
          "Gestão de secrets (Vault, AWS Secrets Manager, sealed-secrets)",
          "OWASP Top 10 + compliance (LGPD, PCI-DSS, ISO 27001)",
        ],
        ferramentasEspecificas: [
          "Jenkins, GitLab CI ou GitHub Actions (CI/CD)",
          "SonarQube ou Semgrep (SAST)",
          "OWASP ZAP ou Burp Suite (DAST)",
          "Snyk ou Dependabot (SCA)",
          "HashiCorp Vault (gestão de secrets)",
          "Docker + Kubernetes + Trivy (segurança de containers)",
        ],
        cargos: [
          "DevSecOps Engineer Pleno (3+ anos de DevOps)",
          "DevSecOps Engineer Sênior (5+ anos)",
          "Staff DevSecOps / Tech Lead Security Engineering",
          "Principal DevSecOps / Head of Platform Security",
        ],
        faixaSalarial:
          "R$ 5.692 (júnior raro) a R$ 25.000+ (sênior em fintechs). Média BR R$ 9.030, Glassdoor 2026. Pleno gira em R$ 11.850. Especialistas em fintechs e bancos chegam a R$ 20-30k. Remoto pra fora paga em dólar (US$ 5-10k/mês).",
        dificuldade: 5,
        cursosGratuitos: [
          "OWASP Cheat Sheet Series (referência gratuita oficial de segurança em desenvolvimento)",
          "GitHub Security Lab (cursos gratuitos sobre SAST e segurança em pipelines)",
          "AWS Skill Builder: Security Learning Path (parte gratuita)",
        ],
        projetosSugeridos: [
          "Pipeline CI/CD completo com SAST + DAST + SCA integrados (GitHub Actions público)",
          "Cluster Kubernetes hardening: image scanning + network policies + RBAC documentado",
          "Sistema de secrets management end-to-end (Vault + integração com K8s + rotação automática)",
        ],
        roadmapEspecifico: [
          "Ter base sólida em DevOps (CI/CD, Docker, Kubernetes, cloud), 2+ anos",
          "Estudar OWASP Top 10 + fundamentos de segurança de aplicações",
          "Aprender ferramentas SAST/DAST/SCA e como integrá-las em pipelines",
          "Estudar compliance (LGPD obrigatório no BR, PCI-DSS pra fintechs)",
          "Construir portfolio: pipeline público com segurança integrada + writeup técnico",
        ],
        dicasIniciais:
          "Não tente entrar como DevSecOps sem base de DevOps. Esse cargo cobra os dois mundos. Vindo de DevOps, foque em OWASP + ferramentas de scan + compliance. Vindo de segurança, foque em CI/CD + containers + cloud. Cargo paga muito bem em fintechs e bancos. Invista em entender PCI-DSS e LGPD. Inglês é obrigatório (toda a doc e community estão em inglês). Subárea em crescimento explosivo. Quem entra agora pega salários acima do normal.",
      },
    ],
  },
  {
    id: "gamedev",
    nome: "Game Dev",
    slug: "gamedev",
    icon: Gamepad2,
    tagClass: "tag-gamedev",
    descricaoCurta:
      "Programação de jogos digitais. Mecânicas, IA, física, gráficos. Mercado BR pequeno mas crescente, principalmente em mobile e estúdios médios.",
    descricaoCompleta:
      "Game Dev é a programação por trás dos jogos digitais, desde mobile casual até console AAA. O desenvolvedor de jogos cria mecânicas, sistemas de IA pra inimigos, física, multiplayer, otimização de performance gráfica e integração com motores como Unity ou Unreal Engine. É uma área de mercado pequeno mas com paixão grande no Brasil. Estúdios como Wildlife, Aquiris, Tapps Games e Hoplon empregam centenas, principalmente em jogos mobile. Salário fica abaixo da média geral de TI no início, mas seniores em estúdios internacionais ou remoto pra fora ganham bem. Recomendado pra quem tem paixão real por games, não só pelo salário.",
    oQueFaz:
      "O dev de jogos programa tudo que faz um jogo funcionar: controles, IA, sistemas de combate, física, multiplayer, salvamento de progresso, otimização. Trabalha em motores como Unity (C#) ou Unreal Engine (C++). Colabora intensamente com designers de jogo, artistas 3D, animadores e sound designers. Faz muitos testes, ajustes finos de dificuldade e otimizações pra rodar bem em hardware variado.",
    tarefasDiarias: [
      "Programar mecânicas de jogo (movimentação, combate, sistemas de pontos)",
      "Implementar IA de inimigos, NPCs e comportamentos do mundo",
      "Trabalhar com física, animações e renderização",
      "Integrar arte (modelos 3D, sprites, sons) com a engine",
      "Otimizar performance pra rodar bem em diferentes plataformas",
      "Testar, debugar e ajustar dificuldade com base em feedback",
    ],
    perfilIndicado:
      "Pessoa apaixonada por jogos com paciência pra testes infinitos. Combina lógica de programação com sensibilidade pra experiência do jogador. Tolerante a ferramentas complexas, gosta de matemática (vetores, álgebra linear) e tem perfil colaborativo. Game dev é trabalho em equipe multidisciplinar. Importante: o salário inicial é menor que outras áreas de dev, então paixão pela área conta muito.",
    habilidades: [
      "Programação em C# (Unity) ou C++ (Unreal Engine)",
      "Lógica de programação e estrutura de dados",
      "Matemática aplicada (vetores, álgebra linear, trigonometria)",
      "Domínio de pelo menos uma game engine",
      "Conhecimento básico de design de jogos (game design)",
      "Otimização e profiling de performance",
    ],
    ferramentas: [
      "Unity",
      "Unreal Engine",
      "Godot",
      "Visual Studio",
      "Git (com Git LFS pra assets grandes)",
      "Blender (visualização básica de assets)",
      "Steam / Itch.io (publicação)",
      "Trello ou Jira",
    ],
    dificuldade: 4,
    cargos: [
      "Programador de Jogos Júnior",
      "Programador de Jogos Pleno",
      "Programador de Jogos Sênior",
      "Gameplay Programmer / Engine Programmer",
    ],
    faixaSalarial:
      "R$ 2.550 (júnior) a R$ 16.000 (sênior). Média BR R$ 8.200, Jobted/Glassdoor 2026",
    cursosGratuitos: [
      "Unity Learn (cursos oficiais grátis em inglês e PT-BR)",
      "Brackeys (canal YouTube, referência mundial Unity em inglês, biblioteca enorme)",
      "Curso em Vídeo: Lógica de Programação (Gustavo Guanabara, base sólida)",
      "Godot Engine Documentation + Tutoriais oficiais (gratuitos)",
    ],
    roadmapInicial: [
      "Aprender lógica de programação e C# (ou C++ se for direto pra Unreal)",
      "Escolher uma engine: Unity (mais empregos), Unreal (gráfico AAA) ou Godot (open-source)",
      "Construir 2 jogos simples completos (Pong, Breakout, Endless Runner)",
      "Estudar fundamentos de game design e UX em jogos",
      "Participar de pelo menos 1 game jam",
      "Publicar 1 jogo na Itch.io ou Google Play",
    ],
    projetos: [
      "Plataformer 2D com física, inimigos e fases (Unity ou Godot)",
      "Top-down shooter com IA de inimigos (Unity)",
      "Sistema de inventário e save/load completo",
      "Jogo mobile casual publicado na Google Play",
    ],
    termosEssenciais: [
      "Game Loop",
      "Engine",
      "Asset",
      "Prefab",
      "Sprite",
      "Game Jam",
    ],
    dicasIniciais:
      "Comece com Unity ou Godot (mais leves). Faça 3-5 jogos pequenos completos, não 1 grande pela metade. Participe de game jams (Global Game Jam, Ludum Dare). É a forma mais rápida de aprender e fazer networking. Inglês é mais importante aqui que em outras áreas. Quase toda doc e comunidade é em inglês.",
    requiresGraduation: "opcional",
    tempoMedioFormacao: "12-24 meses até primeira vaga",
    crescimentoMercado: "medio",
    faculdadesRelacionadas: [
      "Jogos Digitais",
      "Design de Games",
      "Ciência da Computação",
    ],
    subareas: [],
  },
  {
    id: "analise-dados",
    nome: "Análise de Dados / BI",
    slug: "analise-dados",
    icon: LineChart,
    tagClass: "tag-dados",
    descricaoCurta:
      "Transforma dados em relatórios, dashboards e insights para apoiar decisões de negócio.",
    descricaoCompleta:
      "O analista de dados (ou de BI) coleta, limpa e organiza dados de diferentes fontes para responder perguntas de negócio. Cria dashboards e relatórios que ajudam times e gestores a decidir com base em números, não em achismo. É uma das principais portas de entrada na área de dados: exige menos matemática avançada que ciência de dados, mas muito SQL, visualização e capacidade de contar histórias com os dados.",
    oQueFaz:
      "Extrai dados com SQL, organiza, cria dashboards e relatórios e traduz números em recomendações para o negócio.",
    tarefasDiarias: [
      "Escrever consultas SQL para extrair dados de bancos",
      "Limpar e organizar planilhas e tabelas",
      "Criar dashboards no Power BI, Looker Studio ou Tableau",
      "Traduzir perguntas de negócio em métricas e indicadores",
      "Apresentar resultados e insights para times e gestores",
    ],
    perfilIndicado:
      "Combina com quem gosta de números, tem curiosidade por entender o porquê das coisas e sabe se comunicar bem. Não precisa de matemática pesada, mas precisa de organização e atenção ao detalhe.",
    habilidades: [
      "SQL (consultas, joins e agregações)",
      "Excel ou Planilhas avançado",
      "Power BI, Looker Studio ou Tableau",
      "Estatística descritiva básica",
      "Storytelling com dados",
      "Inglês para leitura",
    ],
    ferramentas: [
      "SQL",
      "Power BI",
      "Looker Studio",
      "Tableau",
      "Excel / Google Sheets",
      "Python (pandas) básico",
    ],
    dificuldade: 3,
    cargos: [
      "Analista de Dados Júnior",
      "Analista de BI",
      "Analista de Dados Pleno",
      "Analista de Dados Sênior",
    ],
    faixaSalarial:
      "Júnior R$ 3.000 a R$ 5.000, Pleno R$ 5.500 a R$ 8.300, Sênior R$ 9.000 a R$ 13.000 (Glassdoor 2026)",
    cursosGratuitos: [
      "Microsoft Learn: trilha de Power BI (gratuita)",
      "Curso em Vídeo: MySQL (Gustavo Guanabara)",
      "Kaggle Learn: Pandas e Data Visualization (gratuito, em inglês)",
      "DIO: bootcamps gratuitos de Análise de Dados",
    ],
    roadmapInicial: [
      "Aprender SQL do básico ao intermediário",
      "Dominar Excel ou Google Sheets",
      "Aprender uma ferramenta de BI (Power BI é a mais pedida)",
      "Estudar estatística descritiva básica",
      "Construir 2 ou 3 dashboards com dados públicos",
      "Publicar os projetos no GitHub ou portfólio",
    ],
    projetos: [
      "Dashboard de vendas com dados públicos",
      "Análise de uma base do governo (dados.gov.br)",
      "Relatório de métricas de um e-commerce fictício",
    ],
    termosEssenciais: ["SQL", "Dashboard", "KPI", "ETL", "Data Viz", "Query"],
    dicasIniciais:
      "Foque em SQL e em uma ferramenta de BI antes de qualquer coisa. Use datasets reais e sempre explique o insight, não só mostre o gráfico. Saber contar a história por trás dos números vale mais que dominar dez ferramentas.",
    requiresGraduation: "opcional",
    tempoMedioFormacao: "6 a 12 meses até a primeira vaga",
    crescimentoMercado: "alto",
    faculdadesRelacionadas: [
      "Análise e Desenvolvimento de Sistemas (ADS)",
      "Ciência de Dados",
      "Estatística",
      "Sistemas de Informação",
    ],
  },
  {
    id: "engenharia-dados",
    nome: "Engenharia de Dados",
    slug: "engenharia-dados",
    icon: Boxes,
    tagClass: "tag-dados",
    descricaoCurta:
      "Constrói e mantém a infraestrutura e os pipelines que levam dados até quem analisa.",
    descricaoCompleta:
      "O engenheiro de dados é quem constrói os caminhos por onde os dados passam. Cria pipelines que coletam, transformam e armazenam grandes volumes de dados de forma confiável, para que analistas e cientistas tenham dados limpos e prontos para usar. É uma área mais técnica e próxima do back-end, com salários altos e demanda em alta, puxada por empresas que querem se tornar orientadas a dados.",
    oQueFaz:
      "Constrói pipelines de dados (ETL e ELT), modela data warehouses e garante que os dados cheguem limpos e disponíveis para análise.",
    tarefasDiarias: [
      "Construir e manter pipelines de dados (ETL e ELT)",
      "Modelar tabelas e data warehouses",
      "Trabalhar com bancos SQL e ferramentas como dbt e Spark",
      "Automatizar e monitorar a ingestão de dados",
      "Garantir qualidade, governança e disponibilidade dos dados",
    ],
    perfilIndicado:
      "Combina com quem gosta da parte de engenharia e de programação, tem paciência para resolver problemas de dados sujos e se importa com confiabilidade e organização. Mais código e infraestrutura, menos gráficos.",
    habilidades: [
      "SQL avançado",
      "Python",
      "Modelagem de dados e data warehouse",
      "Pipelines ETL e ELT (Airflow, dbt)",
      "Cloud (AWS, GCP ou Azure)",
      "Spark e processamento distribuído",
    ],
    ferramentas: [
      "Python",
      "SQL",
      "Apache Airflow",
      "dbt",
      "Apache Spark",
      "BigQuery / Snowflake",
      "Docker",
      "AWS / GCP",
    ],
    dificuldade: 4,
    cargos: [
      "Engenheiro de Dados Júnior",
      "Engenheiro de Dados Pleno",
      "Engenheiro de Dados Sênior",
      "Arquiteto de Dados",
    ],
    faixaSalarial:
      "Júnior R$ 5.000 a R$ 8.500, Pleno R$ 9.000 a R$ 15.000, Sênior acima de R$ 20.000 (Glassdoor 2026)",
    cursosGratuitos: [
      "Data Engineering Zoomcamp (DataTalks.Club, gratuito, coorte de janeiro)",
      "Databricks Customer Academy: cursos gratuitos em português",
      "Data Science Academy: Fundamentos de Engenharia de Dados (gratuito, com certificado)",
      "Curso em Vídeo: Python (base de programação)",
    ],
    roadmapInicial: [
      "Aprender Python e SQL com solidez",
      "Entender modelagem de dados e data warehouse",
      "Aprender a construir pipelines (ETL e ELT)",
      "Estudar uma cloud (BigQuery é um bom começo)",
      "Aprender Docker e orquestração com Airflow",
      "Construir um pipeline completo de ponta a ponta",
    ],
    projetos: [
      "Pipeline que coleta dados de uma API e salva num banco",
      "ETL de arquivos CSV para um data warehouse",
      "Pipeline agendado com Airflow e dbt",
    ],
    termosEssenciais: [
      "Pipeline",
      "ETL",
      "Data Warehouse",
      "Data Lake",
      "Orquestração",
      "Batch e Streaming",
    ],
    dicasIniciais:
      "Engenharia de dados não costuma ser a primeira porta de entrada: vale ter base de programação (Python) e SQL antes. Domine um banco de dados e aprenda a versionar e automatizar tudo. O Zoomcamp gratuito é um dos melhores caminhos práticos.",
    requiresGraduation: "opcional",
    tempoMedioFormacao: "12 a 24 meses (costuma exigir base anterior)",
    crescimentoMercado: "alto",
    faculdadesRelacionadas: [
      "Análise e Desenvolvimento de Sistemas (ADS)",
      "Ciência da Computação",
      "Engenharia de Software",
      "Ciência de Dados",
    ],
  },
  {
    id: "banco-de-dados",
    nome: "Banco de Dados / DBA",
    slug: "banco-de-dados",
    icon: Database,
    tagClass: "tag-dados",
    descricaoCurta:
      "Cuida do armazenamento, performance, segurança e integridade dos bancos de dados.",
    descricaoCompleta:
      "O administrador de banco de dados (DBA) é responsável por manter os bancos de dados de uma empresa funcionando bem: rápidos, seguros, disponíveis e sem perda de dados. Ajusta consultas lentas, faz backups, controla acessos e planeja a estrutura dos dados. É uma área estável e essencial, presente em praticamente toda empresa que guarda informação, do banco ao e-commerce.",
    oQueFaz:
      "Mantém bancos de dados rápidos, seguros e disponíveis: otimiza consultas, faz backups, controla acessos e modela a estrutura dos dados.",
    tarefasDiarias: [
      "Monitorar e otimizar a performance de consultas",
      "Planejar e testar rotinas de backup e recuperação",
      "Controlar acessos, usuários e permissões",
      "Modelar e ajustar a estrutura de tabelas e índices",
      "Garantir segurança, disponibilidade e integridade dos dados",
    ],
    perfilIndicado:
      "Combina com quem é organizado, metódico, gosta de lógica e se preocupa com segurança e confiabilidade. Tem paciência para investigar problemas e prefere estabilidade a novidade constante.",
    habilidades: [
      "SQL avançado",
      "Modelagem de dados (normalização)",
      "Administração de SGBD (PostgreSQL, MySQL, Oracle ou SQL Server)",
      "Tuning e otimização de consultas",
      "Backup, recuperação e segurança",
      "Noções de Linux",
    ],
    ferramentas: [
      "PostgreSQL",
      "MySQL",
      "SQL Server",
      "Oracle",
      "MongoDB",
      "Linux",
    ],
    dificuldade: 4,
    cargos: [
      "DBA Júnior",
      "Administrador de Banco de Dados",
      "DBA Pleno",
      "DBA Sênior",
    ],
    faixaSalarial:
      "Júnior R$ 4.500 a R$ 7.600, Pleno R$ 8.000 a R$ 11.700, Sênior R$ 12.000 a R$ 15.000 (Glassdoor 2026)",
    cursosGratuitos: [
      "Curso em Vídeo: MySQL (Gustavo Guanabara)",
      "W3Schools: SQL Tutorial (gratuito, em inglês)",
      "Microsoft Learn: trilhas de SQL Server e Azure SQL (gratuitas)",
      "Oracle Learning Explorer (gratuito)",
    ],
    roadmapInicial: [
      "Aprender SQL do básico ao avançado",
      "Entender modelagem e normalização de dados",
      "Escolher e aprofundar em um SGBD (PostgreSQL é ótimo começo)",
      "Estudar índices, tuning e planos de execução",
      "Aprender backup, recuperação e controle de acesso",
      "Praticar em um banco real com volume de dados",
    ],
    projetos: [
      "Modelar o banco de um sistema de e-commerce",
      "Otimizar consultas lentas em uma base grande",
      "Configurar rotina de backup e restauração",
    ],
    termosEssenciais: [
      "SGBD",
      "Índice",
      "Normalização",
      "Backup",
      "Tuning",
      "Transação",
    ],
    dicasIniciais:
      "Comece dominando SQL de verdade, depois aprofunde em um banco específico. PostgreSQL é gratuito, robusto e muito pedido. Entender índices e planos de execução é o que separa um DBA bom de um iniciante.",
    requiresGraduation: "opcional",
    tempoMedioFormacao: "9 a 18 meses até a primeira vaga",
    crescimentoMercado: "estavel",
    faculdadesRelacionadas: [
      "Análise e Desenvolvimento de Sistemas (ADS)",
      "Ciência da Computação",
      "Banco de Dados (tecnólogo)",
      "Sistemas de Informação",
    ],
  },
  {
    id: "sre",
    nome: "SRE (Site Reliability Engineering)",
    slug: "sre",
    icon: Gauge,
    tagClass: "tag-devops",
    descricaoCurta:
      "Mantém sistemas no ar com confiabilidade, automação e monitoramento em escala.",
    descricaoCompleta:
      "Site Reliability Engineering (SRE) é a junção de software com operações: o profissional usa programação para automatizar a operação e garantir que sistemas grandes fiquem estáveis, rápidos e disponíveis. Cuida de monitoramento, resposta a incidentes, capacidade e automação de infraestrutura. Surgiu no Google e é muito valorizado, costuma exigir experiência prévia em desenvolvimento ou infraestrutura, com salários altos.",
    oQueFaz:
      "Automatiza a operação de sistemas grandes, monitora disponibilidade e responde a incidentes para manter tudo estável e rápido.",
    tarefasDiarias: [
      "Monitorar disponibilidade, latência e erros dos sistemas",
      "Automatizar tarefas de operação e infraestrutura",
      "Responder a incidentes e fazer post-mortems",
      "Definir e acompanhar SLOs, SLIs e error budgets",
      "Melhorar escalabilidade e resiliência das aplicações",
    ],
    perfilIndicado:
      "Combina com quem gosta de programar e de infraestrutura ao mesmo tempo, mantém a calma sob pressão e se importa com automação e confiabilidade. Costuma ser um passo depois de dev ou DevOps, não a primeira vaga.",
    habilidades: [
      "Linux e redes",
      "Uma linguagem de programação (Python ou Go)",
      "Containers e Kubernetes",
      "Observabilidade (logs, métricas e tracing)",
      "CI/CD e infraestrutura como código",
      "Resposta a incidentes",
    ],
    ferramentas: [
      "Kubernetes",
      "Docker",
      "Prometheus",
      "Grafana",
      "Terraform",
      "AWS / GCP",
      "Git",
    ],
    dificuldade: 5,
    cargos: [
      "Site Reliability Engineer Júnior",
      "Site Reliability Engineer Pleno",
      "Site Reliability Engineer Sênior",
      "Platform Engineer",
    ],
    faixaSalarial:
      "Júnior R$ 5.000 a R$ 8.000, Pleno R$ 8.400 a R$ 17.000, Sênior R$ 14.000 a R$ 21.000 (Glassdoor 2026)",
    cursosGratuitos: [
      "Google SRE Books (sre.google/books, gratuitos online em inglês)",
      "Google Cloud: SRE e DevOps Engineer (Coursera, modo audit gratuito)",
      "LinuxTips: Descomplicando Docker e Kubernetes (YouTube, gratuito)",
      "KodeKloud: labs gratuitos de Linux e Kubernetes",
    ],
    roadmapInicial: [
      "Dominar Linux e fundamentos de redes",
      "Aprender uma linguagem (Python ou Go)",
      "Entender containers e Kubernetes",
      "Estudar observabilidade (Prometheus e Grafana)",
      "Aprender infraestrutura como código (Terraform)",
      "Estudar SLOs, SLIs e cultura de confiabilidade",
    ],
    projetos: [
      "Subir uma aplicação em Kubernetes com monitoramento",
      "Criar dashboards de métricas com Prometheus e Grafana",
      "Automatizar deploy com pipeline CI/CD e infraestrutura como código",
    ],
    termosEssenciais: [
      "SLO",
      "SLI",
      "Error Budget",
      "Observabilidade",
      "Incidente",
      "Toil",
    ],
    dicasIniciais:
      "SRE raramente é a primeira vaga: tenha base de programação ou infraestrutura antes. Os livros de SRE do Google são gratuitos e a melhor referência. Foque em automação, pois o objetivo é eliminar trabalho manual repetitivo.",
    requiresGraduation: "opcional",
    tempoMedioFormacao: "Costuma exigir experiência prévia em dev ou infra",
    crescimentoMercado: "alto",
    faculdadesRelacionadas: [
      "Análise e Desenvolvimento de Sistemas (ADS)",
      "Ciência da Computação",
      "Engenharia de Software",
      "Redes de Computadores",
    ],
  },
  {
    id: "infraestrutura",
    nome: "Suporte e Infraestrutura / Redes",
    slug: "infraestrutura",
    icon: Network,
    tagClass: "tag-devops",
    descricaoCurta:
      "Mantém computadores, servidores e redes funcionando no dia a dia da empresa.",
    descricaoCompleta:
      "A área de suporte e infraestrutura cuida de tudo que faz a TI da empresa funcionar: computadores, servidores, redes, impressoras e acessos. É uma das portas de entrada mais acessíveis em tecnologia, ótima para quem está começando, pois dá visão ampla de como tudo se conecta e abre caminho para áreas como redes, cloud, DevOps e cibersegurança. O salário inicial é mais baixo que o de dev, mas a barreira de entrada também é menor.",
    oQueFaz:
      "Atende chamados, instala e configura equipamentos, administra redes e servidores e mantém a TI da empresa funcionando.",
    tarefasDiarias: [
      "Atender chamados e resolver problemas de usuários",
      "Instalar e configurar computadores, sistemas e impressoras",
      "Administrar redes, Wi-Fi e acessos",
      "Monitorar servidores e serviços",
      "Documentar procedimentos e gerenciar ativos de TI",
    ],
    perfilIndicado:
      "Combina com quem gosta de resolver problemas práticos, tem paciência para atender pessoas e curiosidade para entender como máquinas e redes funcionam. Ótima primeira porta para quem quer entrar logo no mercado.",
    habilidades: [
      "Hardware e sistemas operacionais (Windows e Linux)",
      "Redes (TCP/IP, DNS, DHCP e Wi-Fi)",
      "Atendimento e comunicação",
      "Noções de servidores e cloud",
      "Active Directory e gestão de usuários",
      "Resolução de problemas",
    ],
    ferramentas: [
      "Windows",
      "Linux",
      "Ferramentas de chamados (GLPI, Jira)",
      "Switches e roteadores",
      "Active Directory",
      "VMware / VirtualBox",
    ],
    dificuldade: 2,
    cargos: [
      "Analista de Suporte Técnico",
      "Analista de Infraestrutura Júnior",
      "Analista de Redes",
      "Administrador de Sistemas",
    ],
    faixaSalarial:
      "Júnior R$ 2.300 a R$ 4.000, Pleno R$ 4.500 a R$ 6.000, Sênior R$ 6.500 a R$ 9.000 (Glassdoor 2026)",
    cursosGratuitos: [
      "Cisco Networking Academy: Skills for All (cursos gratuitos de redes)",
      "Fundação Bradesco: Montagem e Manutenção de Computadores (gratuito)",
      "Google IT Support (Coursera, modo audit gratuito)",
      "Curso em Vídeo: Linux para iniciantes (gratuito)",
    ],
    roadmapInicial: [
      "Aprender hardware e montagem de computadores",
      "Dominar Windows e o básico de Linux",
      "Estudar fundamentos de redes (TCP/IP, DNS e DHCP)",
      "Tirar uma certificação inicial (Cisco CCNA introdutório)",
      "Aprender administração de usuários e servidores",
      "Evoluir para redes, cloud ou cibersegurança",
    ],
    projetos: [
      "Montar uma pequena rede doméstica ou de laboratório",
      "Configurar um servidor de arquivos em Linux",
      "Documentar o inventário e os procedimentos de um setor",
    ],
    termosEssenciais: [
      "TCP/IP",
      "DNS",
      "DHCP",
      "Active Directory",
      "Chamado",
      "Servidor",
    ],
    dicasIniciais:
      "É a porta de entrada mais acessível da TI. Aproveite para ver tudo de perto e descobrir o que mais gosta. Os cursos gratuitos da Cisco e da Fundação Bradesco são um ótimo começo. Use o suporte como trampolim para redes, cloud ou segurança.",
    requiresGraduation: "opcional",
    tempoMedioFormacao: "3 a 9 meses até a primeira vaga",
    crescimentoMercado: "estavel",
    faculdadesRelacionadas: [
      "Redes de Computadores",
      "Análise e Desenvolvimento de Sistemas (ADS)",
      "Gestão de TI",
      "Sistemas de Informação",
    ],
  },
  {
    id: "analise-sistemas",
    nome: "Análise de Sistemas",
    slug: "analise-sistemas",
    icon: FileSearch,
    tagClass: "tag-gestao",
    descricaoCurta:
      "Faz a ponte entre as necessidades do negócio e a solução técnica que será construída.",
    descricaoCompleta:
      "O analista de sistemas entende o problema do negócio e o traduz em requisitos claros para o time de desenvolvimento. Levanta necessidades com usuários, documenta processos, modela soluções e acompanha a entrega para garantir que o que foi construído resolve o problema certo. É uma área que mistura tecnologia, comunicação e visão de processos, ótima para quem gosta de organizar e conversar com pessoas.",
    oQueFaz:
      "Levanta requisitos com o negócio, documenta processos e modela soluções, fazendo a ponte entre usuários e o time de desenvolvimento.",
    tarefasDiarias: [
      "Levantar requisitos com usuários e áreas de negócio",
      "Documentar processos, regras e fluxos",
      "Modelar soluções (diagramas, UML e casos de uso)",
      "Alinhar expectativas entre negócio e desenvolvimento",
      "Acompanhar testes e validar entregas",
    ],
    perfilIndicado:
      "Combina com quem gosta de organizar ideias, conversar com pessoas e entender processos. Une raciocínio lógico com boa comunicação. Ideal para quem curte tecnologia mas não quer passar o dia inteiro programando.",
    habilidades: [
      "Levantamento e análise de requisitos",
      "Modelagem de processos e UML",
      "Lógica de programação e SQL básico",
      "Comunicação e escrita clara",
      "Metodologias ágeis (Scrum e Kanban)",
      "Visão de negócio",
    ],
    ferramentas: [
      "Jira",
      "Confluence",
      "Figma / Miro",
      "Diagramas (UML e BPMN)",
      "SQL",
      "Trello",
    ],
    dificuldade: 3,
    cargos: [
      "Analista de Sistemas Júnior",
      "Analista de Requisitos",
      "Analista de Negócios",
      "Analista de Sistemas Sênior",
    ],
    faixaSalarial:
      "Júnior R$ 3.200 a R$ 6.000, Pleno R$ 5.600 a R$ 9.600, Sênior R$ 11.000 a R$ 18.000 (Glassdoor 2026)",
    cursosGratuitos: [
      "Fundação Bradesco: Análise de Sistemas e UML (gratuito)",
      "Curso em Vídeo: Algoritmos e Lógica de Programação (gratuito)",
      "DIO: bootcamps gratuitos de fundamentos",
      "Coursera: Engenharia de Requisitos (modo audit gratuito)",
    ],
    roadmapInicial: [
      "Entender lógica de programação e SQL básico",
      "Aprender levantamento e documentação de requisitos",
      "Estudar modelagem de processos e UML",
      "Conhecer metodologias ágeis (Scrum e Kanban)",
      "Praticar escrevendo requisitos e casos de uso",
      "Construir um portfólio de documentação de projetos",
    ],
    projetos: [
      "Documentar os requisitos de um app real",
      "Modelar o fluxo de um processo em BPMN",
      "Escrever casos de uso e histórias de usuário de um sistema",
    ],
    termosEssenciais: [
      "Requisito",
      "UML",
      "Caso de Uso",
      "Stakeholder",
      "Backlog",
      "Processo",
    ],
    dicasIniciais:
      "Comunicação é tão importante quanto a parte técnica aqui. Aprenda a fazer boas perguntas e a documentar com clareza. Saber um pouco de programação e SQL ajuda muito a conversar com o time de desenvolvimento.",
    requiresGraduation: "recomendado",
    tempoMedioFormacao: "12 a 24 meses até a primeira vaga",
    crescimentoMercado: "estavel",
    faculdadesRelacionadas: [
      "Análise e Desenvolvimento de Sistemas (ADS)",
      "Sistemas de Informação",
      "Engenharia de Software",
      "Ciência da Computação",
    ],
  },
  {
    id: "blockchain",
    nome: "Blockchain / Web3",
    slug: "blockchain",
    icon: Blocks,
    tagClass: "tag-backend",
    descricaoCurta:
      "Desenvolve contratos inteligentes e aplicações descentralizadas sobre blockchain.",
    descricaoCompleta:
      "O desenvolvedor blockchain cria aplicações que rodam em redes descentralizadas, como a Ethereum. Escreve contratos inteligentes (smart contracts) que executam regras automaticamente e sem intermediários, usados em finanças (DeFi), tokens, NFTs e identidade digital. É uma área de nicho, mais volátil, mas com salários competitivos e demanda puxada por projetos cripto e iniciativas como o Drex do Banco Central.",
    oQueFaz:
      "Escreve e audita contratos inteligentes em Solidity e integra aplicações web a redes blockchain descentralizadas.",
    tarefasDiarias: [
      "Escrever e testar contratos inteligentes (Solidity)",
      "Integrar aplicações web com a blockchain",
      "Auditar e cuidar da segurança dos contratos",
      "Trabalhar com carteiras, tokens e padrões (ERC-20 e ERC-721)",
      "Acompanhar gás, custos e otimização on-chain",
    ],
    perfilIndicado:
      "Combina com quem tem base de programação, curiosidade por finanças e tecnologia descentralizada e tolerância a um mercado volátil. Segurança é levada a sério, pois um erro em contrato pode custar caro.",
    habilidades: [
      "Solidity",
      "Lógica de programação e JavaScript/TypeScript",
      "Conceitos de blockchain e criptografia",
      "Smart contracts e padrões ERC",
      "Web3 (ethers.js, wagmi)",
      "Segurança e auditoria de contratos",
    ],
    ferramentas: [
      "Solidity",
      "Hardhat / Foundry",
      "ethers.js",
      "MetaMask",
      "Remix IDE",
      "Node.js",
    ],
    dificuldade: 4,
    cargos: [
      "Desenvolvedor Blockchain Júnior",
      "Desenvolvedor Solidity",
      "Engenheiro Web3",
      "Desenvolvedor Blockchain Sênior",
    ],
    faixaSalarial:
      "Júnior R$ 4.000 a R$ 8.000, Pleno R$ 8.000 a R$ 12.000, Sênior acima de R$ 15.000 (Glassdoor 2026)",
    cursosGratuitos: [
      "CryptoZombies (gratuito, Solidity interativo no navegador)",
      "Alchemy University: Solidity e Ethereum Developer Bootcamp (gratuito)",
      "freeCodeCamp: curso de Solidity e smart contracts (YouTube, Patrick Collins)",
      "Ethereum.org: documentação para desenvolvedores (gratuita)",
    ],
    roadmapInicial: [
      "Aprender lógica de programação e JavaScript",
      "Entender como funciona uma blockchain",
      "Aprender Solidity com o CryptoZombies",
      "Criar e fazer deploy de contratos de teste (Remix)",
      "Integrar um contrato com uma aplicação web (Web3)",
      "Estudar segurança e auditoria de smart contracts",
    ],
    projetos: [
      "Token ERC-20 próprio em rede de teste",
      "Aplicação de votação on-chain",
      "Marketplace simples de NFT (ERC-721)",
    ],
    termosEssenciais: [
      "Smart Contract",
      "Solidity",
      "Gas",
      "Token",
      "DApp",
      "Wallet",
    ],
    dicasIniciais:
      "Tenha base sólida de programação antes de partir para blockchain. Comece pelo CryptoZombies e pela Alchemy University, ambos gratuitos. Segurança é prioridade absoluta, pois um bug pode causar prejuízo irreversível, então estude auditoria desde cedo.",
    requiresGraduation: "opcional",
    tempoMedioFormacao: "12 a 24 meses (costuma exigir base de dev)",
    crescimentoMercado: "medio",
    faculdadesRelacionadas: [
      "Ciência da Computação",
      "Engenharia de Software",
      "Análise e Desenvolvimento de Sistemas (ADS)",
      "Sistemas de Informação",
    ],
  },
  {
    id: "iot",
    nome: "IoT / Sistemas Embarcados",
    slug: "iot",
    icon: Cpu,
    tagClass: "tag-backend",
    descricaoCurta:
      "Programa o software que roda dentro de dispositivos físicos e objetos conectados.",
    descricaoCompleta:
      "Sistemas embarcados e IoT (Internet das Coisas) são o software que roda dentro de dispositivos físicos: de uma máquina de café e um carro até sensores industriais e dispositivos vestíveis. O profissional programa microcontroladores, integra sensores, cuida de comunicação e de consumo de energia, e conecta os dispositivos à internet. Combina programação com eletrônica e tem demanda crescente com a expansão da IoT e da indústria 4.0.",
    oQueFaz:
      "Programa firmware para microcontroladores, integra sensores e conecta dispositivos físicos à internet.",
    tarefasDiarias: [
      "Programar microcontroladores (firmware em C e C++)",
      "Integrar sensores, atuadores e periféricos",
      "Implementar comunicação (Wi-Fi, Bluetooth e MQTT)",
      "Otimizar consumo de memória e energia",
      "Testar e depurar hardware e software juntos",
    ],
    perfilIndicado:
      "Combina com quem gosta de programação e também de eletrônica e do mundo físico, tem paciência para depurar problemas de hardware e curte ver o código controlando algo real. Matemática e lógica ajudam bastante.",
    habilidades: [
      "Linguagem C e C++",
      "Eletrônica básica",
      "Microcontroladores (Arduino, ESP32 e STM32)",
      "Protocolos de comunicação (I2C, SPI e MQTT)",
      "RTOS e gerenciamento de memória",
      "Depuração de hardware",
    ],
    ferramentas: [
      "Arduino IDE",
      "ESP32",
      "Raspberry Pi",
      "C / C++",
      "PlatformIO",
      "Osciloscópio e multímetro",
    ],
    dificuldade: 4,
    cargos: [
      "Desenvolvedor de Firmware Júnior",
      "Engenheiro de Sistemas Embarcados",
      "Desenvolvedor IoT",
      "Engenheiro de Firmware Sênior",
    ],
    faixaSalarial:
      "Júnior R$ 4.000 a R$ 7.000, Pleno R$ 7.000 a R$ 13.000, Sênior R$ 12.000 a R$ 18.000 (Glassdoor 2026)",
    cursosGratuitos: [
      "Arduino: tutoriais e documentação oficiais (gratuitos)",
      "Cisco Networking Academy: Introduction to IoT (gratuito)",
      "Curso em Vídeo: Linguagem C (Gustavo Guanabara, base de firmware)",
      "Portal Embarcados: artigos e tutoriais gratuitos (embarcados.com.br)",
    ],
    roadmapInicial: [
      "Aprender lógica de programação e linguagem C",
      "Estudar eletrônica básica",
      "Começar com Arduino e projetos simples",
      "Evoluir para ESP32 e conectividade (Wi-Fi e MQTT)",
      "Aprender protocolos de comunicação (I2C e SPI)",
      "Construir um projeto de IoT completo conectado à nuvem",
    ],
    projetos: [
      "Estação meteorológica com sensores e Wi-Fi",
      "Automação de luz ou irrigação com ESP32",
      "Dispositivo que envia dados para um dashboard na nuvem",
    ],
    termosEssenciais: [
      "Microcontrolador",
      "Firmware",
      "Sensor",
      "GPIO",
      "MQTT",
      "RTOS",
    ],
    dicasIniciais:
      "Comece com Arduino, que é barato e tem comunidade enorme, depois migre para o ESP32 (Wi-Fi embutido). Aprenda C de verdade, pois é a linguagem do firmware. Ter o hardware na mão e construir projetos físicos é o que mais acelera o aprendizado.",
    requiresGraduation: "recomendado",
    tempoMedioFormacao: "12 a 24 meses até a primeira vaga",
    crescimentoMercado: "alto",
    faculdadesRelacionadas: [
      "Engenharia da Computação",
      "Engenharia Eletrônica",
      "Ciência da Computação",
      "Sistemas Embarcados (tecnólogo)",
    ],
  },
  {
    id: "mainframe",
    nome: "Mainframe",
    slug: "mainframe",
    icon: HardDrive,
    tagClass: "tag-backend",
    descricaoCurta:
      "Mantém e moderniza os sistemas de altíssimo volume que rodam em bancos, governo e grandes empresas.",
    descricaoCompleta:
      "Mainframe é o computador de grande porte que processa milhões de transações por dia com confiabilidade altíssima. Está no coração de bancos, governo, seguradoras e companhias aéreas, rodando sistemas críticos escritos em COBOL ao longo de décadas. Esses sistemas continuam no ar porque são estáveis e caros de substituir, então a demanda por quem sabe mantê-los segue alta enquanto poucos profissionais novos entram na área. É um nicho: menos vagas que web, mas com concorrência baixa e boa estabilidade.",
    oQueFaz:
      "Desenvolve e dá manutenção em programas COBOL, escreve JCL para rodar jobs em lote, acessa dados em DB2, VSAM e IMS, e cuida de sistemas transacionais no ambiente z/OS.",
    tarefasDiarias: [
      "Ler e dar manutenção em programas COBOL existentes",
      "Escrever e ajustar JCL para executar jobs em lote",
      "Consultar e atualizar dados em DB2, VSAM ou IMS",
      "Investigar abends analisando logs e dumps",
      "Editar e testar programas no TSO/ISPF",
    ],
    perfilIndicado:
      "Gosta de lógica, atenção a detalhe e de entender sistemas grandes e antigos. Tem paciência para ler código legado e valoriza estabilidade mais do que novidade constante.",
    habilidades: [
      "Lógica de programação",
      "COBOL",
      "JCL (linguagem de controle de jobs)",
      "SQL e DB2",
      "Noções de z/OS e processamento em lote",
    ],
    ferramentas: [
      "COBOL",
      "JCL",
      "z/OS",
      "CICS",
      "DB2",
      "IMS",
      "TSO/ISPF",
      "VSAM",
    ],
    dificuldade: 4,
    cargos: [
      "Desenvolvedor COBOL/Mainframe Júnior",
      "Analista de Mainframe",
      "Programador COBOL",
      "Analista de Sistemas Legados",
    ],
    faixaSalarial: "R$ 3.500 a R$ 6.500 (júnior)",
    cursosGratuitos: [
      "IBM Z Xplore (ambiente e desafios gratuitos da IBM, sucessor do Master the Mainframe)",
      "freeCodeCamp: COBOL Programming Course (vídeo)",
      "Open Mainframe Project: cursos abertos de COBOL e mainframe",
    ],
    roadmapInicial: [
      "Aprender lógica de programação",
      "Estudar COBOL (sintaxe, estruturas e arquivos)",
      "Criar conta no IBM Z Xplore e praticar no ambiente real",
      "Aprender JCL para rodar programas em lote",
      "Entender SQL e DB2 para acessar dados",
      "Conhecer o básico de z/OS, TSO/ISPF e CICS",
    ],
    projetos: [
      "Resolver os desafios do IBM Z Xplore (ambiente gratuito)",
      "Programa COBOL que lê um arquivo e gera um relatório",
      "Job em lote com JCL processando um arquivo de entrada",
    ],
    termosEssenciais: [
      "COBOL",
      "JCL",
      "z/OS",
      "Batch",
      "CICS",
      "DB2",
      "Abend",
      "Dataset",
    ],
    dicasIniciais:
      "Comece pela lógica e por COBOL, depois use o IBM Z Xplore para praticar em um ambiente real e gratuito. É um nicho: menos vagas, mas pouca concorrência e boa estabilidade.",
    requiresGraduation: "opcional",
    tempoMedioFormacao: "9-18 meses até primeira vaga",
    crescimentoMercado: "estavel",
    faculdadesRelacionadas: [
      "Análise e Desenvolvimento de Sistemas (ADS)",
      "Ciência da Computação",
      "Sistemas de Informação",
    ],
  },
];

const NIVEIS_SALARIO = ["Estágio", "Júnior", "Pleno", "Sênior"] as const;

// Faixas mensais BR por nível [estágio, júnior, pleno, sênior]. Áreas com
// júnior/pleno/sênior já vetados (Glassdoor/CAGED 2026) mantêm os valores e
// recebem o estágio; as demais foram reconstruídas com base no mercado.
const areaSalarios: Record<string, [string, string, string, string]> = {
  frontend: [
    "R$ 1.800 a R$ 3.200",
    "R$ 4.000 a R$ 6.500",
    "R$ 7.000 a R$ 11.000",
    "R$ 12.000 a R$ 18.000",
  ],
  backend: [
    "R$ 2.000 a R$ 3.500",
    "R$ 4.500 a R$ 7.500",
    "R$ 8.000 a R$ 13.000",
    "R$ 14.000 a R$ 22.000",
  ],
  fullstack: [
    "R$ 2.000 a R$ 3.500",
    "R$ 4.500 a R$ 7.500",
    "R$ 8.000 a R$ 14.000",
    "R$ 14.000 a R$ 22.000",
  ],
  dados: [
    "R$ 2.000 a R$ 3.500",
    "R$ 4.500 a R$ 7.500",
    "R$ 8.000 a R$ 13.000",
    "R$ 13.000 a R$ 20.000",
  ],
  uxui: [
    "R$ 1.800 a R$ 3.000",
    "R$ 3.800 a R$ 6.000",
    "R$ 6.500 a R$ 10.000",
    "R$ 11.000 a R$ 18.000",
  ],
  ia: [
    "R$ 2.500 a R$ 4.000",
    "R$ 5.000 a R$ 8.500",
    "R$ 10.000 a R$ 16.000",
    "R$ 18.000 a R$ 30.000",
  ],
  produto: [
    "R$ 2.500 a R$ 4.000",
    "R$ 5.000 a R$ 8.000",
    "R$ 9.000 a R$ 15.000",
    "R$ 16.000 a R$ 28.000",
  ],
  ciberseguranca: [
    "R$ 2.000 a R$ 3.500",
    "R$ 4.500 a R$ 7.500",
    "R$ 8.000 a R$ 14.000",
    "R$ 15.000 a R$ 28.000",
  ],
  cloud: [
    "R$ 2.200 a R$ 3.800",
    "R$ 5.000 a R$ 8.000",
    "R$ 9.000 a R$ 16.000",
    "R$ 16.000 a R$ 28.000",
  ],
  gestao: [
    "R$ 2.500 a R$ 4.000",
    "R$ 5.000 a R$ 8.500",
    "R$ 9.000 a R$ 16.000",
    "R$ 16.000 a R$ 30.000",
  ],
  qa: [
    "R$ 1.800 a R$ 3.000",
    "R$ 3.500 a R$ 6.000",
    "R$ 6.000 a R$ 10.000",
    "R$ 11.000 a R$ 20.000",
  ],
  mobile: [
    "R$ 2.000 a R$ 3.500",
    "R$ 4.000 a R$ 7.000",
    "R$ 7.500 a R$ 12.000",
    "R$ 13.000 a R$ 21.000",
  ],
  devops: [
    "R$ 2.500 a R$ 4.000",
    "R$ 5.500 a R$ 8.500",
    "R$ 9.000 a R$ 16.000",
    "R$ 16.000 a R$ 30.000",
  ],
  gamedev: [
    "R$ 1.500 a R$ 2.800",
    "R$ 2.500 a R$ 5.000",
    "R$ 5.000 a R$ 9.000",
    "R$ 9.000 a R$ 16.000",
  ],
  "analise-dados": [
    "R$ 1.800 a R$ 3.000",
    "R$ 3.000 a R$ 5.000",
    "R$ 5.500 a R$ 8.300",
    "R$ 9.000 a R$ 13.000",
  ],
  "engenharia-dados": [
    "R$ 2.500 a R$ 4.000",
    "R$ 5.000 a R$ 8.500",
    "R$ 9.000 a R$ 15.000",
    "R$ 16.000 a R$ 24.000",
  ],
  "banco-de-dados": [
    "R$ 2.000 a R$ 3.500",
    "R$ 4.500 a R$ 7.600",
    "R$ 8.000 a R$ 11.700",
    "R$ 12.000 a R$ 18.000",
  ],
  sre: [
    "R$ 2.500 a R$ 4.000",
    "R$ 5.000 a R$ 8.000",
    "R$ 8.400 a R$ 17.000",
    "R$ 16.000 a R$ 26.000",
  ],
  infraestrutura: [
    "R$ 1.500 a R$ 2.800",
    "R$ 2.300 a R$ 4.000",
    "R$ 4.500 a R$ 6.000",
    "R$ 6.500 a R$ 11.000",
  ],
  "analise-sistemas": [
    "R$ 1.800 a R$ 3.200",
    "R$ 3.200 a R$ 6.000",
    "R$ 5.600 a R$ 9.600",
    "R$ 11.000 a R$ 18.000",
  ],
  blockchain: [
    "R$ 2.500 a R$ 4.000",
    "R$ 4.000 a R$ 8.000",
    "R$ 8.000 a R$ 12.000",
    "R$ 15.000 a R$ 28.000",
  ],
  iot: [
    "R$ 2.000 a R$ 3.500",
    "R$ 4.000 a R$ 7.000",
    "R$ 7.000 a R$ 13.000",
    "R$ 12.000 a R$ 18.000",
  ],
  mainframe: [
    "R$ 1.800 a R$ 3.000",
    "R$ 3.500 a R$ 6.500",
    "R$ 7.000 a R$ 11.000",
    "R$ 12.000 a R$ 18.000",
  ],
};

function buildSalarios(faixas?: [string, string, string, string]) {
  if (!faixas) return undefined;
  return faixas.map((faixa, i) => ({ nivel: NIVEIS_SALARIO[i], faixa }));
}

export const livrosPorArea: Record<string, Livro[]> = {
  frontend: [
    {
      titulo: "Eloquent JavaScript",
      autor: "Marijn Haverbeke",
      nivel: "Iniciante",
      porque: "Introdução gratuita e prática ao JavaScript, com exercícios.",
      gratuito: true,
      link: "https://eloquentjavascript.net",
    },
    {
      titulo: "HTML and CSS: Design and Build Websites",
      autor: "Jon Duckett",
      nivel: "Iniciante",
      porque: "Introdução visual e muito acessível a HTML e CSS.",
    },
    {
      titulo: "You Don't Know JS Yet",
      autor: "Kyle Simpson",
      nivel: "Intermediário",
      porque: "Série que destrincha o JavaScript a fundo, de graça no GitHub.",
      gratuito: true,
      link: "https://github.com/getify/You-Dont-Know-JS",
    },
    {
      titulo: "JavaScript: The Good Parts",
      autor: "Douglas Crockford",
      nivel: "Intermediário",
      porque: "Clássico curto sobre as partes boas da linguagem.",
    },
    {
      titulo: "Refactoring UI",
      autor: "Adam Wathan e Steve Schoger",
      nivel: "Intermediário",
      porque: "Design prático para devs deixarem interfaces bem acabadas.",
    },
    {
      titulo: "CSS: The Definitive Guide",
      autor: "Eric Meyer e Estelle Weyl",
      nivel: "Avançado",
      porque: "Referência completa e densa de CSS.",
    },
  ],
  backend: [
    {
      titulo: "Código Limpo",
      autor: "Robert C. Martin",
      nivel: "Intermediário",
      porque: "Clássico sobre escrever código legível e de fácil manutenção.",
    },
    {
      titulo: "O Programador Pragmático",
      autor: "Andrew Hunt e David Thomas",
      nivel: "Intermediário",
      porque: "Boas práticas atemporais de quem programa.",
    },
    {
      titulo: "Refatoração",
      autor: "Martin Fowler",
      nivel: "Intermediário",
      porque: "Como melhorar a estrutura do código sem mudar o comportamento.",
    },
    {
      titulo: "Use a Cabeça! Padrões de Projetos",
      autor: "Eric Freeman e Elisabeth Robson",
      nivel: "Intermediário",
      porque: "Padrões de projeto explicados de forma visual e didática.",
    },
    {
      titulo: "Arquitetura Limpa",
      autor: "Robert C. Martin",
      nivel: "Avançado",
      porque: "Princípios de arquitetura para sistemas sustentáveis.",
    },
    {
      titulo: "Designing Data-Intensive Applications",
      autor: "Martin Kleppmann",
      nivel: "Avançado",
      porque: "Referência densa sobre dados e sistemas de back-end.",
    },
  ],
  fullstack: [
    {
      titulo: "Entendendo Algoritmos",
      autor: "Aditya Bhargava",
      nivel: "Iniciante",
      porque: "Algoritmos explicados com desenhos, leve e didático.",
    },
    {
      titulo: "O Programador Pragmático",
      autor: "Andrew Hunt e David Thomas",
      nivel: "Intermediário",
      porque: "Boas práticas que servem do front ao back.",
    },
    {
      titulo: "Código Limpo",
      autor: "Robert C. Martin",
      nivel: "Intermediário",
      porque: "Como escrever código que outras pessoas conseguem manter.",
    },
    {
      titulo: "Refatoração",
      autor: "Martin Fowler",
      nivel: "Intermediário",
      porque: "Técnicas para melhorar código existente com segurança.",
    },
    {
      titulo: "Designing Data-Intensive Applications",
      autor: "Martin Kleppmann",
      nivel: "Avançado",
      porque: "Para entender o lado pesado de dados e escala.",
    },
  ],
  dados: [
    {
      titulo: "Data Science do Zero",
      autor: "Joel Grus",
      nivel: "Iniciante",
      porque: "Constrói os conceitos de ciência de dados do zero com Python.",
    },
    {
      titulo: "A Arte da Estatística",
      autor: "David Spiegelhalter",
      nivel: "Iniciante",
      porque:
        "Raciocínio estatístico de forma acessível, sem fórmulas pesadas.",
    },
    {
      titulo: "Storytelling com Dados",
      autor: "Cole Nussbaumer Knaflic",
      nivel: "Iniciante",
      porque: "Como comunicar resultados com visualizações claras.",
    },
    {
      titulo: "Python para Análise de Dados",
      autor: "Wes McKinney",
      nivel: "Intermediário",
      porque: "Pandas e manipulação de dados pelo criador da biblioteca.",
    },
    {
      titulo:
        "Mãos à Obra: Aprendizado de Máquina com Scikit-Learn, Keras e TensorFlow",
      autor: "Aurélien Géron",
      nivel: "Intermediário",
      porque: "Guia prático e muito usado de machine learning.",
    },
    {
      titulo: "The Elements of Statistical Learning",
      autor: "Trevor Hastie, Robert Tibshirani e Jerome Friedman",
      nivel: "Avançado",
      porque: "Referência teórica densa de aprendizado estatístico.",
      ano: 2009,
      gratuito: true,
      link: "https://hastie.su.domains/ElemStatLearn/",
    },
  ],
  uxui: [
    {
      titulo: "O Design do Dia a Dia",
      autor: "Don Norman",
      nivel: "Iniciante",
      porque:
        "Clássico sobre por que objetos e telas são fáceis ou difíceis de usar.",
    },
    {
      titulo: "Não Me Faça Pensar",
      autor: "Steve Krug",
      nivel: "Iniciante",
      porque: "Usabilidade web explicada de forma curta e direta.",
    },
    {
      titulo: "Lean UX",
      autor: "Jeff Gothelf e Josh Seiden",
      nivel: "Intermediário",
      porque: "UX aplicado a times ágeis e produtos reais.",
    },
    {
      titulo: "Refactoring UI",
      autor: "Adam Wathan e Steve Schoger",
      nivel: "Intermediário",
      porque: "Decisões visuais práticas para interfaces.",
    },
    {
      titulo: "Sprint",
      autor: "Jake Knapp, John Zeratsky e Braden Kowitz",
      nivel: "Intermediário",
      porque: "Processo de 5 dias para validar ideias com protótipos.",
    },
    {
      titulo: "100 Things Every Designer Needs to Know About People",
      autor: "Susan Weinschenk",
      nivel: "Intermediário",
      porque: "Psicologia aplicada ao design de produtos.",
    },
  ],
  ia: [
    {
      titulo: "Data Science do Zero",
      autor: "Joel Grus",
      nivel: "Iniciante",
      porque: "Boa porta de entrada para os fundamentos antes da IA.",
    },
    {
      titulo: "Inteligência Artificial: Um Guia para Pessoas Pensantes",
      autor: "Melanie Mitchell",
      nivel: "Iniciante",
      porque: "Panorama honesto e acessível sobre o que a IA faz e não faz.",
    },
    {
      titulo:
        "Mãos à Obra: Aprendizado de Máquina com Scikit-Learn, Keras e TensorFlow",
      autor: "Aurélien Géron",
      nivel: "Intermediário",
      porque: "Guia prático para sair do papel.",
    },
    {
      titulo: "Inteligência Artificial: Uma Abordagem Moderna",
      autor: "Stuart Russell e Peter Norvig",
      nivel: "Avançado",
      porque: "A referência clássica e abrangente da área.",
    },
    {
      titulo: "Deep Learning",
      autor: "Ian Goodfellow, Yoshua Bengio e Aaron Courville",
      nivel: "Avançado",
      porque: "Referência teórica de redes neurais profundas.",
      ano: 2016,
      gratuito: true,
      link: "https://www.deeplearningbook.org",
    },
  ],
  produto: [
    {
      titulo: "A Startup Enxuta",
      autor: "Eric Ries",
      nivel: "Iniciante",
      porque: "Base de validação e experimentação para produtos digitais.",
    },
    {
      titulo: "Inspirado",
      autor: "Marty Cagan",
      nivel: "Intermediário",
      porque:
        "Como times de produto de tecnologia criam produtos que as pessoas amam.",
    },
    {
      titulo:
        "Hooked: Como Construir Produtos e Serviços Formadores de Hábitos",
      autor: "Nir Eyal",
      nivel: "Intermediário",
      porque: "Como produtos criam hábito e engajamento.",
    },
    {
      titulo: "Continuous Discovery Habits",
      autor: "Teresa Torres",
      nivel: "Intermediário",
      porque: "Rotina prática de descoberta contínua com usuários.",
    },
    {
      titulo: "Escaping the Build Trap",
      autor: "Melissa Perri",
      nivel: "Intermediário",
      porque:
        "Como focar em valor e resultados em vez de só entregar features.",
    },
    {
      titulo: "User Story Mapping",
      autor: "Jeff Patton",
      nivel: "Intermediário",
      porque: "Mapear o produto pela jornada do usuário.",
    },
  ],
  ciberseguranca: [
    {
      titulo: "Metasploit: The Penetration Tester's Guide",
      autor: "David Kennedy, Jim O'Gorman, Devon Kearns e Mati Aharoni",
      nivel: "Intermediário",
      porque: "Introdução prática a testes de invasão com Metasploit.",
    },
    {
      titulo: "CISSP All-in-One Exam Guide",
      autor: "Shon Harris e Fernando Maymí",
      nivel: "Intermediário",
      porque: "Visão ampla de segurança, boa para certificação.",
    },
    {
      titulo: "The Hacker Playbook 3",
      autor: "Peter Kim",
      nivel: "Intermediário",
      porque: "Guia prático de testes ofensivos no estilo passo a passo.",
    },
    {
      titulo: "The Web Application Hacker's Handbook",
      autor: "Dafydd Stuttard e Marcus Pinto",
      nivel: "Avançado",
      porque: "Referência clássica de segurança em aplicações web.",
    },
    {
      titulo: "Hacking: The Art of Exploitation",
      autor: "Jon Erickson",
      nivel: "Avançado",
      porque: "Entende exploração a fundo, com bastante mão na massa.",
    },
    {
      titulo: "Practical Malware Analysis",
      autor: "Michael Sikorski e Andrew Honig",
      nivel: "Avançado",
      porque: "Guia prático de análise de malware.",
    },
  ],
  cloud: [
    {
      titulo: "Projeto Fênix",
      autor: "Gene Kim, Kevin Behr e George Spafford",
      nivel: "Iniciante",
      porque: "Romance sobre TI e operação, leve e envolvente.",
    },
    {
      titulo: "AWS Certified Solutions Architect Study Guide",
      autor: "Ben Piper e David Clinton",
      nivel: "Intermediário",
      porque: "Prepara para a certificação base de arquitetura AWS.",
    },
    {
      titulo: "Kubernetes: Up and Running",
      autor: "Brendan Burns, Joe Beda e Kelsey Hightower",
      nivel: "Intermediário",
      porque: "Introdução prática a Kubernetes pelos criadores.",
    },
    {
      titulo: "Cloud Native Patterns",
      autor: "Cornelia Davis",
      nivel: "Avançado",
      porque: "Padrões para construir aplicações nativas de nuvem.",
    },
    {
      titulo: "Designing Data-Intensive Applications",
      autor: "Martin Kleppmann",
      nivel: "Avançado",
      porque: "Fundamentos de sistemas distribuídos que sustentam a nuvem.",
    },
  ],
  gestao: [
    {
      titulo: "Scrum: A Arte de Fazer o Dobro do Trabalho na Metade do Tempo",
      autor: "Jeff Sutherland",
      nivel: "Iniciante",
      porque: "Introdução ao Scrum pelo seu co-criador.",
    },
    {
      titulo: "Projeto Fênix",
      autor: "Gene Kim, Kevin Behr e George Spafford",
      nivel: "Iniciante",
      porque: "Narrativa sobre gestão de TI e fluxo de trabalho.",
    },
    {
      titulo: "A Startup Enxuta",
      autor: "Eric Ries",
      nivel: "Intermediário",
      porque: "Gestão de produto e projeto sob incerteza.",
    },
    {
      titulo: "Making Things Happen",
      autor: "Scott Berkun",
      nivel: "Intermediário",
      porque: "Gestão de projetos de software de forma realista.",
    },
    {
      titulo: "Peopleware",
      autor: "Tom DeMarco e Timothy Lister",
      nivel: "Intermediário",
      porque: "Sobre o lado humano de gerenciar times de software.",
    },
  ],
  qa: [
    {
      titulo: "Agile Testing",
      autor: "Lisa Crispin e Janet Gregory",
      nivel: "Intermediário",
      porque: "Referência de testes em times ágeis.",
    },
    {
      titulo: "Explore It!",
      autor: "Elisabeth Hendrickson",
      nivel: "Intermediário",
      porque: "Testes exploratórios na prática.",
    },
    {
      titulo: "Lessons Learned in Software Testing",
      autor: "Cem Kaner, James Bach e Bret Pettichord",
      nivel: "Intermediário",
      porque: "Lições práticas e provocativas sobre testar software.",
    },
    {
      titulo: "Specification by Example",
      autor: "Gojko Adzic",
      nivel: "Intermediário",
      porque: "Usar exemplos para alinhar requisitos e testes.",
    },
    {
      titulo: "The Art of Software Testing",
      autor: "Glenford Myers",
      nivel: "Avançado",
      porque: "Clássico sobre os fundamentos de teste.",
    },
  ],
  mobile: [
    {
      titulo: "Head First Android Development",
      autor: "Dawn Griffiths e David Griffiths",
      nivel: "Iniciante",
      porque: "Android de forma visual e amigável.",
    },
    {
      titulo: "Android Programming: The Big Nerd Ranch Guide",
      autor: "Bill Phillips, Chris Stewart e Kristin Marsicano",
      nivel: "Intermediário",
      porque: "Referência sólida e prática de Android.",
    },
    {
      titulo: "iOS Programming: The Big Nerd Ranch Guide",
      autor: "Christian Keur e Aaron Hillegass",
      nivel: "Intermediário",
      porque: "Guia respeitado de desenvolvimento iOS.",
    },
    {
      titulo: "Kotlin in Action",
      autor: "Dmitry Jemerov e Svetlana Isakova",
      nivel: "Intermediário",
      porque: "Kotlin pelos engenheiros da JetBrains.",
    },
  ],
  devops: [
    {
      titulo: "Projeto Fênix",
      autor: "Gene Kim, Kevin Behr e George Spafford",
      nivel: "Iniciante",
      porque: "Apresenta a cultura DevOps de forma envolvente.",
    },
    {
      titulo: "O Manual de DevOps",
      autor: "Gene Kim, Jez Humble, Patrick Debois e John Willis",
      nivel: "Intermediário",
      porque: "Guia central de práticas DevOps.",
    },
    {
      titulo: "Accelerate",
      autor: "Nicole Forsgren, Jez Humble e Gene Kim",
      nivel: "Intermediário",
      porque:
        "O que a pesquisa diz sobre times de software de alta performance.",
    },
    {
      titulo: "Entrega Contínua",
      autor: "Jez Humble e David Farley",
      nivel: "Avançado",
      porque: "Pipeline de entrega de software confiável.",
    },
    {
      titulo: "Site Reliability Engineering",
      autor: "Betsy Beyer, Chris Jones, Jennifer Petoff e Niall Murphy",
      nivel: "Avançado",
      porque: "Como o Google opera sistemas em escala.",
      ano: 2016,
      gratuito: true,
      link: "https://sre.google/sre-book/table-of-contents/",
    },
  ],
  gamedev: [
    {
      titulo: "Level Up! The Guide to Great Video Game Design",
      autor: "Scott Rogers",
      nivel: "Iniciante",
      porque: "Introdução divertida e acessível ao design de jogos.",
    },
    {
      titulo: "Game Programming Patterns",
      autor: "Robert Nystrom",
      nivel: "Intermediário",
      porque: "Padrões de código aplicados a jogos, gratuito online.",
      gratuito: true,
      link: "https://gameprogrammingpatterns.com",
    },
    {
      titulo: "The Art of Game Design: A Book of Lenses",
      autor: "Jesse Schell",
      nivel: "Intermediário",
      porque: "Referência ampla de design de jogos.",
    },
    {
      titulo: "Game Engine Architecture",
      autor: "Jason Gregory",
      nivel: "Avançado",
      porque: "Como motores de jogos funcionam por dentro.",
    },
  ],
  "analise-dados": [
    {
      titulo: "Storytelling com Dados",
      autor: "Cole Nussbaumer Knaflic",
      nivel: "Iniciante",
      porque: "Como comunicar dados com visualizações claras.",
    },
    {
      titulo: "A Arte da Estatística",
      autor: "David Spiegelhalter",
      nivel: "Iniciante",
      porque: "Raciocínio estatístico sem fórmulas pesadas.",
    },
    {
      titulo: "Python para Análise de Dados",
      autor: "Wes McKinney",
      nivel: "Intermediário",
      porque: "Pandas e limpeza de dados na prática.",
    },
    {
      titulo: "The Big Book of Dashboards",
      autor: "Steve Wexler, Jeffrey Shaffer e Andy Cotgreave",
      nivel: "Intermediário",
      porque: "Exemplos reais de dashboards que funcionam.",
    },
    {
      titulo: "Show Me the Numbers",
      autor: "Stephen Few",
      nivel: "Intermediário",
      porque: "Fundamentos de tabelas e gráficos bem feitos.",
    },
  ],
  "engenharia-dados": [
    {
      titulo: "Python para Análise de Dados",
      autor: "Wes McKinney",
      nivel: "Intermediário",
      porque: "Boa base para manipular dados com Python.",
    },
    {
      titulo: "Fundamentals of Data Engineering",
      autor: "Joe Reis e Matt Housley",
      nivel: "Intermediário",
      porque: "Visão moderna e completa do ciclo de engenharia de dados.",
    },
    {
      titulo: "The Data Warehouse Toolkit",
      autor: "Ralph Kimball e Margy Ross",
      nivel: "Avançado",
      porque: "Clássico de modelagem dimensional e data warehouse.",
    },
    {
      titulo: "Spark: The Definitive Guide",
      autor: "Bill Chambers e Matei Zaharia",
      nivel: "Avançado",
      porque: "Guia abrangente de processamento de dados com Apache Spark.",
    },
    {
      titulo: "Designing Data-Intensive Applications",
      autor: "Martin Kleppmann",
      nivel: "Avançado",
      porque: "Base essencial sobre sistemas de dados e escala.",
    },
  ],
  "banco-de-dados": [
    {
      titulo: "Use a Cabeça! SQL",
      autor: "Lynn Beighley",
      nivel: "Iniciante",
      porque: "SQL de forma visual e prática para começar.",
    },
    {
      titulo: "SQL Performance Explained",
      autor: "Markus Winand",
      nivel: "Intermediário",
      porque: "Como índices e consultas realmente performam.",
    },
    {
      titulo: "SQL Antipatterns",
      autor: "Bill Karwin",
      nivel: "Intermediário",
      porque: "Erros comuns de SQL e como evitá-los.",
    },
    {
      titulo: "Database System Concepts",
      autor: "Abraham Silberschatz, Henry F. Korth e S. Sudarshan",
      nivel: "Avançado",
      porque: "Livro-texto clássico de bancos de dados.",
    },
    {
      titulo: "Designing Data-Intensive Applications",
      autor: "Martin Kleppmann",
      nivel: "Avançado",
      porque: "Armazenamento, replicação e consistência a fundo.",
    },
  ],
  sre: [
    {
      titulo: "Projeto Fênix",
      autor: "Gene Kim, Kevin Behr e George Spafford",
      nivel: "Iniciante",
      porque: "Cultura de operação e confiabilidade em formato de história.",
    },
    {
      titulo: "Site Reliability Engineering",
      autor: "Betsy Beyer, Chris Jones, Jennifer Petoff e Niall Murphy",
      nivel: "Intermediário",
      porque: "O livro que define a prática de SRE no Google.",
      ano: 2016,
      gratuito: true,
      link: "https://sre.google/sre-book/table-of-contents/",
    },
    {
      titulo: "The Site Reliability Workbook",
      autor:
        "Betsy Beyer, Niall Murphy, David Rensin, Kent Kawahara e Stephen Thorne",
      nivel: "Intermediário",
      porque: "Aplicação prática dos conceitos de SRE.",
      ano: 2018,
      gratuito: true,
      link: "https://sre.google/workbook/table-of-contents/",
    },
    {
      titulo: "Designing Data-Intensive Applications",
      autor: "Martin Kleppmann",
      nivel: "Avançado",
      porque: "Fundamentos de confiabilidade e sistemas distribuídos.",
    },
  ],
  infraestrutura: [
    {
      titulo: "CompTIA Network+ Study Guide",
      autor: "Todd Lammle",
      nivel: "Iniciante",
      porque: "Base de redes orientada à certificação.",
    },
    {
      titulo: "Redes de Computadores: Uma Abordagem Top-Down",
      autor: "James Kurose e Keith Ross",
      nivel: "Intermediário",
      porque: "Clássico muito usado em cursos de redes.",
    },
    {
      titulo: "Redes de Computadores",
      autor: "Andrew S. Tanenbaum e David Wetherall",
      nivel: "Intermediário",
      porque: "Outro clássico didático da área.",
    },
    {
      titulo: "The Practice of System and Network Administration",
      autor: "Thomas Limoncelli, Christina Hogan e Strata Chalup",
      nivel: "Intermediário",
      porque: "Referência de operação de sistemas e redes.",
    },
    {
      titulo: "TCP/IP Illustrated, Volume 1",
      autor: "W. Richard Stevens",
      nivel: "Avançado",
      porque: "Referência detalhada do funcionamento do TCP/IP.",
    },
  ],
  "analise-sistemas": [
    {
      titulo: "UML Essencial",
      autor: "Martin Fowler",
      nivel: "Iniciante",
      porque: "Guia curto e direto de UML.",
    },
    {
      titulo: "Engenharia de Software",
      autor: "Ian Sommerville",
      nivel: "Intermediário",
      porque: "Livro-texto abrangente da disciplina.",
    },
    {
      titulo: "User Stories Applied",
      autor: "Mike Cohn",
      nivel: "Intermediário",
      porque: "Levantamento de requisitos com histórias de usuário.",
    },
    {
      titulo: "Domain-Driven Design",
      autor: "Eric Evans",
      nivel: "Avançado",
      porque: "Como modelar software a partir do domínio do negócio.",
    },
  ],
  blockchain: [
    {
      titulo: "Blockchain Basics",
      autor: "Daniel Drescher",
      nivel: "Iniciante",
      porque: "Conceitos de blockchain sem código, passo a passo.",
    },
    {
      titulo: "The Basics of Bitcoins and Blockchains",
      autor: "Antony Lewis",
      nivel: "Iniciante",
      porque: "Introdução acessível a cripto e blockchain.",
    },
    {
      titulo: "Mastering Bitcoin",
      autor: "Andreas M. Antonopoulos",
      nivel: "Intermediário",
      porque: "Referência técnica para entender o Bitcoin a fundo.",
    },
    {
      titulo: "Mastering Ethereum",
      autor: "Andreas M. Antonopoulos e Gavin Wood",
      nivel: "Intermediário",
      porque: "Como o Ethereum e os contratos inteligentes funcionam.",
    },
  ],
  iot: [
    {
      titulo: "Programming Arduino: Getting Started with Sketches",
      autor: "Simon Monk",
      nivel: "Iniciante",
      porque: "Porta de entrada prática com Arduino.",
    },
    {
      titulo: "Designing the Internet of Things",
      autor: "Adrian McEwen e Hakim Cassimally",
      nivel: "Iniciante",
      porque: "Visão geral de como projetar produtos de IoT.",
    },
    {
      titulo: "Making Embedded Systems",
      autor: "Elecia White",
      nivel: "Intermediário",
      porque: "Boas práticas de software para sistemas embarcados.",
    },
    {
      titulo: "The Art of Electronics",
      autor: "Paul Horowitz e Winfield Hill",
      nivel: "Avançado",
      porque: "Referência completa e densa de eletrônica.",
    },
  ],
  mainframe: [
    {
      titulo: "Beginning COBOL for Programmers",
      autor: "Michael Coughlin",
      nivel: "Iniciante",
      porque: "Introdução prática ao COBOL para quem já programa.",
    },
    {
      titulo: "Murach's Mainframe COBOL",
      autor: "Mike Murach e Anne Prince",
      nivel: "Intermediário",
      porque: "Referência didática de COBOL no ambiente mainframe.",
    },
  ],
};

export const livrosFundamentos: Livro[] = [
  {
    titulo: "Código Limpo",
    autor: "Robert C. Martin",
    nivel: "Intermediário",
    porque: "Escrever código legível e de fácil manutenção, em qualquer stack.",
  },
  {
    titulo: "O Programador Pragmático",
    autor: "Andrew Hunt e David Thomas",
    nivel: "Intermediário",
    porque: "Boas práticas atemporais da carreira de quem programa.",
  },
  {
    titulo: "Entendendo Algoritmos",
    autor: "Aditya Bhargava",
    nivel: "Iniciante",
    porque: "Algoritmos e estruturas de dados explicados com desenhos.",
  },
  {
    titulo: "Refatoração",
    autor: "Martin Fowler",
    nivel: "Intermediário",
    porque: "Melhorar a estrutura do código com segurança, passo a passo.",
  },
  {
    titulo: "A Mítica do Homem-Mês",
    autor: "Frederick P. Brooks Jr.",
    nivel: "Intermediário",
    porque: "Clássico sobre por que projetos de software atrasam.",
  },
];

export const areasTI: AreaTI[] = baseAreasTI.map((area) => ({
  ...area,
  salarios: area.salarios ?? buildSalarios(areaSalarios[area.slug]),
  livros: area.livros ?? livrosPorArea[area.slug],
}));

export const areasComplementares: {
  nome: string;
  descricao: string;
  icon: LucideIcon;
  grupo: string;
}[] = [
  {
    nome: "Suporte e Helpdesk",
    descricao:
      "Atendimento e resolução de problemas de usuários e equipamentos. Porta de entrada comum na TI.",
    icon: Headphones,
    grupo: "qa",
  },
  {
    nome: "Arquitetura de Software e Tech Lead",
    descricao:
      "Desenho técnico dos sistemas e liderança de um time de desenvolvimento.",
    icon: Network,
    grupo: "dev",
  },
  {
    nome: "Agilidade e Scrum Master",
    descricao: "Facilita times ágeis e cuida dos processos de entrega.",
    icon: Workflow,
    grupo: "gestao",
  },
  {
    nome: "Automação e RPA",
    descricao:
      "Automatiza tarefas e processos repetitivos com scripts e bots.",
    icon: Bot,
    grupo: "gestao",
  },
];

export const areasPoucoConhecidas: {
  nome: string;
  oQueE: string;
  porQue: string;
  relatedAreaSlug?: string;
}[] = [
  {
    nome: "DevRel / Developer Advocate",
    oQueE:
      "Faz a ponte entre a empresa e a comunidade de desenvolvedores, com conteúdo, palestras e exemplos de uso.",
    porQue:
      "Para quem gosta de programar e também de comunicar, ensinar e estar perto da comunidade.",
  },
  {
    nome: "Technical Writer",
    oQueE:
      "Escreve documentação técnica, tutoriais e referências de API para outras pessoas usarem um produto ou código.",
    porQue:
      "Para quem curte escrever com clareza e organizar informação técnica.",
  },
  {
    nome: "Especialista em Acessibilidade (a11y)",
    oQueE:
      "Garante que sites e apps possam ser usados por pessoas com deficiência, seguindo padrões como o WCAG.",
    porQue:
      "Para quem quer unir tecnologia e impacto social, deixando produtos utilizáveis por todo mundo.",
    relatedAreaSlug: "uxui",
  },
  {
    nome: "Visão Computacional",
    oQueE:
      "Ensina computadores a interpretar imagens e vídeos, de reconhecer objetos a ler documentos.",
    porQue:
      "Para quem gosta de matemática, imagens e problemas visuais dentro de IA.",
    relatedAreaSlug: "ia",
  },
  {
    nome: "Processamento de Linguagem Natural (PLN)",
    oQueE:
      "Faz máquinas entenderem e gerarem linguagem humana, base de tradutores, chatbots e assistentes.",
    porQue:
      "Para quem curte idiomas, texto e o lado linguístico da inteligência artificial.",
    relatedAreaSlug: "ia",
  },
  {
    nome: "MLOps",
    oQueE:
      "Leva modelos de IA do experimento para produção, com versionamento, deploy e monitoramento.",
    porQue: "Para quem gosta de IA mas também de infraestrutura e automação.",
    relatedAreaSlug: "devops",
  },
  {
    nome: "Engenharia de Plataforma",
    oQueE:
      "Constrói ferramentas e ambientes internos que facilitam o trabalho dos outros times de desenvolvimento.",
    porQue:
      "Para quem gosta de resolver problemas de produtividade e infraestrutura para outros devs.",
    relatedAreaSlug: "devops",
  },
  {
    nome: "FinOps",
    oQueE:
      "Otimiza e controla os custos de nuvem, equilibrando gasto, desempenho e necessidade do negócio.",
    porQue:
      "Para quem une tecnologia com visão financeira e gosta de eficiência.",
    relatedAreaSlug: "cloud",
  },
  {
    nome: "Perícia Digital / Forense",
    oQueE:
      "Investiga incidentes e crimes digitais, coletando e analisando evidências em sistemas e dispositivos.",
    porQue:
      "Para quem gosta de investigação, detalhes e segurança da informação.",
    relatedAreaSlug: "ciberseguranca",
  },
  {
    nome: "Sistemas Embarcados / Robótica",
    oQueE:
      "Programa o software que roda dentro de dispositivos físicos, de eletrodomésticos a robôs.",
    porQue:
      "Para quem gosta de hardware, eletrônica e de ver o código mexer no mundo real.",
    relatedAreaSlug: "iot",
  },
  {
    nome: "Localização / i18n",
    oQueE:
      "Adapta software para outros idiomas e culturas, cuidando de textos, formatos e contexto.",
    porQue:
      "Para quem curte idiomas e quer aproximar produtos de pessoas no mundo todo.",
  },
  {
    nome: "Bioinformática",
    oQueE:
      "Usa programação e dados para resolver problemas de biologia, como analisar DNA e proteínas.",
    porQue:
      "Para quem gosta de biologia ou saúde e quer aplicar computação na ciência.",
  },
  {
    nome: "Computação Quântica",
    oQueE:
      "Explora computadores que usam princípios da física quântica para resolver problemas além do alcance dos atuais.",
    porQue: "Para quem gosta de física, matemática e pesquisa de fronteira.",
  },
];

export const roadmaps = [
  {
    id: "zero-ti",
    nome: "Começar do Zero em TI",
    areaSlug: null as string | null,
    nivel: "Iniciante Absoluto",
    duracaoDias: "10 dias",
    descricao:
      "Para quem nunca teve contato com tecnologia e quer entender por onde começar.",
    paraQuem:
      "Pessoas sem nenhuma experiência em TI que querem entender o universo tech.",
    preRequisitos: "Nenhum! Apenas vontade de aprender.",
    etapas: [
      {
        numero: 1,
        titulo: "Entenda o universo tech",
        descricao:
          "Pesquise as áreas de TI, assista vídeos introdutórios e entenda o que cada profissional faz.",
        tempo: "1 semana",
      },
      {
        numero: 2,
        titulo: "Escolha uma área para explorar",
        descricao:
          "Com base no seu perfil, escolha uma área para começar: Front-end, UX/UI, Dados ou QA são ótimas opções para iniciantes.",
        tempo: "1 semana",
      },
      {
        numero: 3,
        titulo: "Aprenda lógica de programação",
        descricao:
          "Independente da área, entender lógica de programação ajuda muito. Curso em Vídeo tem um ótimo curso gratuito.",
        tempo: "2-4 semanas",
      },
      {
        numero: 4,
        titulo: "Faça um curso introdutório gratuito",
        descricao:
          "Escolha um curso gratuito da sua área no YouTube, DIO ou freeCodeCamp e complete do início ao fim.",
        tempo: "4-8 semanas",
      },
      {
        numero: 5,
        titulo: "Crie seu primeiro projeto",
        descricao:
          "Aplique o que aprendeu em um projeto pequeno. Não precisa ser perfeito. O importante é criar!",
        tempo: "1-2 semanas",
      },
      {
        numero: 6,
        titulo: "Crie seu GitHub ou Behance",
        descricao:
          "Publique seu projeto. GitHub para código, Behance para design. Este é o início do seu portfólio.",
        tempo: "1 semana",
      },
      {
        numero: 7,
        titulo: "Monte seu LinkedIn",
        descricao:
          "Crie ou atualize seu LinkedIn com o que aprendeu. Conecte-se com pessoas da área.",
        tempo: "1 semana",
      },
      {
        numero: 8,
        titulo: "Entre em uma comunidade",
        descricao:
          "Participe de grupos no Discord, Slack ou LinkedIn. Networking é fundamental desde o início.",
        tempo: "Contínuo",
      },
    ],
    errosComuns: [
      "Tentar aprender tudo ao mesmo tempo",
      "Ficar preso no 'tutorial hell' sem criar projetos",
      "Não publicar projetos por medo de julgamento",
    ],
    oQueEvitar:
      "Não tente aprender 3 linguagens ao mesmo tempo. Foque em uma área e vá fundo.",
    proximoPasso:
      "Após completar este roadmap, aprofunde-se no roadmap específico da sua área escolhida.",
  },
  {
    id: "frontend",
    nome: "Front-end do Zero",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    duracaoDias: "30 dias",
    descricao:
      "Trilha completa para se tornar desenvolvedor front-end, do HTML básico ao React.",
    paraQuem: "Quem quer criar sites e interfaces web.",
    preRequisitos:
      "Lógica de programação básica é recomendada, mas não obrigatória.",
    etapas: [
      {
        numero: 1,
        titulo: "HTML: A estrutura",
        descricao:
          "Aprenda a criar a estrutura de páginas web com HTML semântico.",
        tempo: "1-2 semanas",
      },
      {
        numero: 2,
        titulo: "CSS: O estilo",
        descricao:
          "Aprenda a estilizar páginas com CSS: cores, fontes, layout com Flexbox e Grid.",
        tempo: "2-3 semanas",
      },
      {
        numero: 3,
        titulo: "Primeiro projeto: Landing Page",
        descricao:
          "Crie uma landing page simples aplicando HTML e CSS. Publique no GitHub Pages.",
        tempo: "1 semana",
      },
      {
        numero: 4,
        titulo: "JavaScript: A interatividade",
        descricao:
          "Aprenda JavaScript: variáveis, funções, eventos, DOM manipulation.",
        tempo: "4-6 semanas",
      },
      {
        numero: 5,
        titulo: "Projeto: To-do List",
        descricao:
          "Crie uma lista de tarefas com JavaScript puro. Adicionar, remover e marcar como concluído.",
        tempo: "1-2 semanas",
      },
      {
        numero: 6,
        titulo: "Git e GitHub",
        descricao:
          "Aprenda controle de versão com Git e publique seus projetos no GitHub.",
        tempo: "1 semana",
      },
      {
        numero: 7,
        titulo: "React: O framework",
        descricao: "Aprenda React: componentes, props, state, hooks básicos.",
        tempo: "4-6 semanas",
      },
      {
        numero: 8,
        titulo: "Projeto final: Portfólio",
        descricao:
          "Crie seu portfólio pessoal em React com seus projetos anteriores.",
        tempo: "2 semanas",
      },
    ],
    errosComuns: [
      "Pular direto para React sem aprender JavaScript",
      "Não criar projetos práticos",
      "Copiar código sem entender o que faz",
    ],
    oQueEvitar: "Não pule etapas. Cada fundamento é importante para o próximo.",
    proximoPasso:
      "Aprenda TypeScript, Next.js e comece a buscar estágios ou freelas.",
  },
  {
    id: "uxui",
    nome: "UX/UI Design do Zero",
    areaSlug: "uxui" as string | null,
    nivel: "Iniciante",
    duracaoDias: "30 dias",
    descricao:
      "Trilha para se tornar designer UX/UI, do conceito ao portfólio no Behance.",
    paraQuem: "Quem quer criar experiências digitais e interfaces bonitas.",
    preRequisitos: "Nenhum! Criatividade e empatia são seus maiores ativos.",
    etapas: [
      {
        numero: 1,
        titulo: "Fundamentos de UX",
        descricao:
          "Entenda o que é UX, pesquisa com usuários, personas e jornadas.",
        tempo: "1-2 semanas",
      },
      {
        numero: 2,
        titulo: "Aprender Figma",
        descricao:
          "Domine a ferramenta principal do mercado: frames, componentes, auto-layout.",
        tempo: "2-3 semanas",
      },
      {
        numero: 3,
        titulo: "Princípios de UI Design",
        descricao: "Tipografia, cores, hierarquia visual, espaçamento e grids.",
        tempo: "1-2 semanas",
      },
      {
        numero: 4,
        titulo: "Primeiro projeto: Redesign",
        descricao:
          "Faça o redesign de um app ou site que você usa. Documente o processo.",
        tempo: "2 semanas",
      },
      {
        numero: 5,
        titulo: "Heurísticas de Nielsen",
        descricao: "Aprenda os 10 princípios de usabilidade e como aplicá-los.",
        tempo: "1 semana",
      },
      {
        numero: 6,
        titulo: "Prototipação e testes",
        descricao:
          "Crie protótipos interativos no Figma e aprenda a testar com usuários.",
        tempo: "2 semanas",
      },
      {
        numero: 7,
        titulo: "Projeto completo",
        descricao:
          "Crie um projeto do zero: pesquisa, wireframe, design e protótipo.",
        tempo: "3-4 semanas",
      },
      {
        numero: 8,
        titulo: "Publicar no Behance",
        descricao:
          "Documente e publique seus projetos no Behance com processo detalhado.",
        tempo: "1 semana",
      },
    ],
    errosComuns: [
      "Focar só na estética sem pensar na usabilidade",
      "Não documentar o processo de design",
      "Não testar com usuários reais",
    ],
    oQueEvitar: "Não copie designs sem entender as decisões por trás deles.",
    proximoPasso:
      "Aprofunde-se em Design Systems, acessibilidade e busque estágios.",
  },
  {
    id: "dados",
    nome: "Ciência de Dados do Zero",
    areaSlug: "dados" as string | null,
    nivel: "Iniciante",
    duracaoDias: "60 dias",
    descricao:
      "Trilha para entrar na área de dados, de Python básico a análises reais.",
    paraQuem:
      "Quem gosta de números, padrões e quer tomar decisões baseadas em dados.",
    preRequisitos: "Matemática básica do ensino médio.",
    etapas: [
      {
        numero: 1,
        titulo: "Python básico",
        descricao:
          "Aprenda variáveis, listas, funções, loops e condicionais em Python.",
        tempo: "3-4 semanas",
      },
      {
        numero: 2,
        titulo: "SQL para dados",
        descricao:
          "Aprenda a consultar bancos de dados com SELECT, WHERE, JOIN e GROUP BY.",
        tempo: "2-3 semanas",
      },
      {
        numero: 3,
        titulo: "Pandas e NumPy",
        descricao:
          "Aprenda a manipular dados com as principais bibliotecas Python.",
        tempo: "2-3 semanas",
      },
      {
        numero: 4,
        titulo: "Visualização de dados",
        descricao: "Crie gráficos com Matplotlib, Seaborn e explore Power BI.",
        tempo: "2 semanas",
      },
      {
        numero: 5,
        titulo: "Primeiro projeto de análise",
        descricao: "Analise um dataset público do Kaggle e publique no GitHub.",
        tempo: "2 semanas",
      },
      {
        numero: 6,
        titulo: "Estatística básica",
        descricao: "Média, mediana, desvio padrão, correlação e distribuições.",
        tempo: "2-3 semanas",
      },
      {
        numero: 7,
        titulo: "Machine Learning introdutório",
        descricao: "Aprenda os conceitos básicos com Scikit-learn.",
        tempo: "3-4 semanas",
      },
      {
        numero: 8,
        titulo: "Portfólio no GitHub/Kaggle",
        descricao: "Publique 2-3 projetos de análise bem documentados.",
        tempo: "Contínuo",
      },
    ],
    errosComuns: [
      "Pular Python e ir direto para ML",
      "Não praticar com dados reais",
      "Ignorar a parte de comunicação dos resultados",
    ],
    oQueEvitar: "Não tente aprender todas as ferramentas de uma vez.",
    proximoPasso:
      "Aprofunde-se em Machine Learning, SQL avançado e busque estágios em análise de dados.",
  },
  {
    id: "linkedin",
    nome: "LinkedIn para Estágio e Trainee",
    areaSlug: "carreira" as string | null,
    nivel: "Iniciante",
    duracaoDias: "20 dias",
    descricao: "Como montar um LinkedIn atrativo mesmo sem experiência formal.",
    paraQuem:
      "Estudantes e iniciantes buscando estágio, trainee ou primeiro emprego em TI.",
    preRequisitos: "Ter pelo menos um projeto ou curso para mostrar.",
    etapas: [
      {
        numero: 1,
        titulo: "Foto profissional",
        descricao:
          "Use uma foto com boa iluminação, fundo neutro e expressão amigável. Não precisa de fotógrafo profissional.",
        tempo: "1 dia",
      },
      {
        numero: 2,
        titulo: "Título profissional",
        descricao:
          "Escreva: 'Estudante de [Área] | Aprendendo [Tecnologia] | Em busca de estágio ou trainee'. Seja específico.",
        tempo: "1 hora",
      },
      {
        numero: 3,
        titulo: "Seção 'Sobre'",
        descricao:
          "Escreva 3-5 linhas sobre quem você é, o que está aprendendo e o que busca. Seja humano e autêntico.",
        tempo: "2 horas",
      },
      {
        numero: 4,
        titulo: "Experiências e projetos",
        descricao:
          "Adicione projetos acadêmicos, cursos e atividades extracurriculares. Descreva o que fez e o que aprendeu.",
        tempo: "2-3 horas",
      },
      {
        numero: 5,
        titulo: "Habilidades",
        descricao:
          "Adicione as tecnologias e habilidades que você realmente sabe, mesmo que básico.",
        tempo: "30 min",
      },
      {
        numero: 6,
        titulo: "Educação e cursos",
        descricao: "Adicione sua formação e certificados de cursos relevantes.",
        tempo: "1 hora",
      },
      {
        numero: 7,
        titulo: "Primeiros posts",
        descricao:
          "Compartilhe o que está aprendendo. 'Hoje aprendi X' é um ótimo começo.",
        tempo: "Contínuo",
      },
      {
        numero: 8,
        titulo: "Networking ativo",
        descricao:
          "Conecte-se com pessoas da área, comente posts relevantes e interaja com a comunidade.",
        tempo: "Contínuo",
      },
    ],
    errosComuns: [
      "Deixar o perfil incompleto",
      "Não ter foto ou usar foto inadequada",
      "Não publicar por medo de julgamento",
    ],
    oQueEvitar:
      "Não minta ou exagere nas habilidades. Seja honesto sobre seu nível.",
    proximoPasso:
      "Com o LinkedIn montado, comece a se candidatar a vagas de estágio, trainee, júnior e participar de eventos de networking.",
  },
  {
    id: "backend",
    nome: "Back-end do Zero",
    areaSlug: "backend" as string | null,
    nivel: "Iniciante",
    duracaoDias: "30 dias",
    descricao:
      "Trilha para criar APIs, entender banco de dados e publicar seu primeiro serviço.",
    paraQuem:
      "Quem gosta de lógica, regras de negócio e quer construir a parte invisível dos sistemas.",
    preRequisitos:
      "Lógica básica ajuda, mas a trilha começa pelos fundamentos.",
    etapas: [
      {
        numero: 1,
        titulo: "Reforce lógica de programação",
        descricao:
          "Pratique variáveis, funções, condicionais, loops e estruturas simples antes de entrar em servidor.",
        tempo: "1 semana",
      },
      {
        numero: 2,
        titulo: "Escolha uma linguagem inicial",
        descricao:
          "Comece com Node.js, Python ou Java e mantenha foco em uma stack por algumas semanas.",
        tempo: "2-3 dias",
      },
      {
        numero: 3,
        titulo: "Entenda HTTP e APIs",
        descricao:
          "Aprenda request, response, status codes, JSON e rotas REST.",
        tempo: "1 semana",
      },
      {
        numero: 4,
        titulo: "Crie uma API simples",
        descricao:
          "Monte um CRUD de tarefas ou hábitos com rotas para listar, criar, atualizar e remover.",
        tempo: "1 semana",
      },
      {
        numero: 5,
        titulo: "Aprenda banco de dados",
        descricao:
          "Estude tabelas, chaves, SELECT, INSERT, UPDATE e DELETE com PostgreSQL ou SQLite.",
        tempo: "1-2 semanas",
      },
      {
        numero: 6,
        titulo: "Adicione validação e autenticação",
        descricao:
          "Valide entradas, trate erros e entenda login com senha, sessão ou token.",
        tempo: "1-2 semanas",
      },
      {
        numero: 7,
        titulo: "Documente e teste no Postman",
        descricao:
          "Crie exemplos de uso, explique endpoints e registre decisões no README.",
        tempo: "2-3 dias",
      },
      {
        numero: 8,
        titulo: "Publique a API",
        descricao:
          "Faça deploy em Render, Railway ou similar e compartilhe o link no portfólio.",
        tempo: "1 semana",
      },
    ],
    errosComuns: [
      "Começar por arquitetura avançada antes de CRUD",
      "Não tratar erros",
      "Não documentar como rodar o projeto",
    ],
    oQueEvitar:
      "Não tente aprender cinco frameworks ao mesmo tempo. Uma API simples bem feita ensina mais.",
    proximoPasso:
      "Aprofunde autenticação, testes automatizados, Docker e arquitetura de APIs.",
  },
  {
    id: "qa-testes",
    nome: "QA e Testes para Entrar em Tech",
    areaSlug: "qa" as string | null,
    nivel: "Iniciante",
    duracaoDias: "20 dias",
    descricao:
      "Trilha para entender qualidade, escrever casos de teste e criar seu primeiro portfólio de QA.",
    paraQuem:
      "Quem tem atenção a detalhes e quer entrar em tecnologia por testes manuais ou automação.",
    preRequisitos: "Nenhum conhecimento técnico avançado.",
    etapas: [
      {
        numero: 1,
        titulo: "Entenda o papel de QA",
        descricao:
          "Aprenda diferença entre teste, qualidade, bug, regressão e critério de aceite.",
        tempo: "2 dias",
      },
      {
        numero: 2,
        titulo: "Estude testes manuais",
        descricao:
          "Pratique casos de teste, cenários positivos, negativos e exploração de funcionalidades.",
        tempo: "4 dias",
      },
      {
        numero: 3,
        titulo: "Escolha um app para analisar",
        descricao:
          "Use um app conhecido e mapeie fluxos como login, cadastro, busca e pagamento fictício.",
        tempo: "2 dias",
      },
      {
        numero: 4,
        titulo: "Monte um plano de testes",
        descricao:
          "Organize objetivo, escopo, riscos, casos e resultado esperado em um documento.",
        tempo: "4 dias",
      },
      {
        numero: 5,
        titulo: "Aprenda Postman básico",
        descricao:
          "Teste APIs públicas, entenda métodos HTTP, parâmetros e respostas.",
        tempo: "4 dias",
      },
      {
        numero: 6,
        titulo: "Automatize um fluxo pequeno",
        descricao:
          "Faça um teste inicial com Cypress ou Playwright, mesmo que simples.",
        tempo: "1 semana",
      },
      {
        numero: 7,
        titulo: "Documente bugs com clareza",
        descricao:
          "Inclua passos, evidências, resultado esperado, resultado atual e severidade.",
        tempo: "2 dias",
      },
      {
        numero: 8,
        titulo: "Publique o portfólio de QA",
        descricao:
          "Coloque plano, prints, relatório e automação em um repositório ou Notion público.",
        tempo: "2 dias",
      },
    ],
    errosComuns: [
      "Achar que QA é só clicar aleatoriamente",
      "Não registrar evidências",
      "Pular fundamentos e ir direto para automação",
    ],
    oQueEvitar:
      "Não automatize sem antes entender o cenário que está sendo validado.",
    proximoPasso:
      "Estude automação, integração contínua e testes de API com mais profundidade.",
  },
  {
    id: "mobile",
    nome: "Mobile com React Native",
    areaSlug: "mobile" as string | null,
    nivel: "Iniciante",
    duracaoDias: "30 dias",
    descricao:
      "Trilha para criar seu primeiro aplicativo mobile com telas, navegação e consumo de API.",
    paraQuem:
      "Quem quer criar apps para celular e já se interessa por interfaces.",
    preRequisitos: "JavaScript básico ou vontade de aprender durante a trilha.",
    etapas: [
      {
        numero: 1,
        titulo: "Revise JavaScript essencial",
        descricao: "Pratique funções, arrays, objetos, módulos e async/await.",
        tempo: "1 semana",
      },
      {
        numero: 2,
        titulo: "Entenda React Native e Expo",
        descricao:
          "Configure o ambiente e rode um app inicial no celular ou emulador.",
        tempo: "2 dias",
      },
      {
        numero: 3,
        titulo: "Crie telas e componentes",
        descricao:
          "Monte botões, cards, listas e formulários com estilos responsivos.",
        tempo: "1 semana",
      },
      {
        numero: 4,
        titulo: "Adicione navegação",
        descricao:
          "Crie fluxo entre home, detalhes e formulário usando navegação mobile.",
        tempo: "3 dias",
      },
      {
        numero: 5,
        titulo: "Consuma uma API pública",
        descricao:
          "Busque dados externos, trate carregamento, erro e estado vazio.",
        tempo: "1 semana",
      },
      {
        numero: 6,
        titulo: "Salve dados locais",
        descricao:
          "Use armazenamento local para favoritos, preferências ou progresso.",
        tempo: "3 dias",
      },
      {
        numero: 7,
        titulo: "Capriche na experiência",
        descricao:
          "Ajuste toque, espaçamento, feedback visual e acessibilidade básica.",
        tempo: "3 dias",
      },
      {
        numero: 8,
        titulo: "Grave uma demo",
        descricao:
          "Publique o código e um vídeo curto mostrando o app funcionando.",
        tempo: "2 dias",
      },
    ],
    errosComuns: [
      "Ignorar diferenças entre web e mobile",
      "Não testar no celular",
      "Criar muitas telas antes do fluxo principal funcionar",
    ],
    oQueEvitar:
      "Não comece tentando publicar na loja. Primeiro faça um app demonstrável.",
    proximoPasso:
      "Estude autenticação, notificações, publicação e integração com Firebase.",
  },
  {
    id: "cloud",
    nome: "Cloud para Iniciantes",
    areaSlug: "cloud" as string | null,
    nivel: "Iniciante",
    duracaoDias: "60 dias",
    descricao:
      "Trilha para entender nuvem, redes, serviços principais e fazer seu primeiro deploy cloud.",
    paraQuem:
      "Quem gosta de infraestrutura, servidores, disponibilidade e bastidores da internet.",
    preRequisitos: "Noções básicas de computador e curiosidade por sistemas.",
    etapas: [
      {
        numero: 1,
        titulo: "Aprenda Linux básico",
        descricao:
          "Pratique terminal, arquivos, permissões e comandos essenciais.",
        tempo: "1 semana",
      },
      {
        numero: 2,
        titulo: "Entenda redes",
        descricao:
          "Estude IP, DNS, HTTP, portas, firewall e diferença entre cliente e servidor.",
        tempo: "1 semana",
      },
      {
        numero: 3,
        titulo: "Escolha um provedor",
        descricao:
          "Use AWS, Azure ou Google Cloud em trilhas gratuitas de fundamentos.",
        tempo: "2 dias",
      },
      {
        numero: 4,
        titulo: "Conheça serviços principais",
        descricao:
          "Compare computação, armazenamento, banco de dados, identidade e monitoramento.",
        tempo: "2 semanas",
      },
      {
        numero: 5,
        titulo: "Hospede um site estático",
        descricao:
          "Publique uma página simples em serviço de storage ou hospedagem gerenciada.",
        tempo: "1 semana",
      },
      {
        numero: 6,
        titulo: "Crie uma instância ou app serverless",
        descricao:
          "Suba um servidor pequeno ou função para entender deploy e logs.",
        tempo: "1-2 semanas",
      },
      {
        numero: 7,
        titulo: "Controle custos e permissões",
        descricao:
          "Configure alertas, entenda IAM e evite deixar recursos desnecessários ligados.",
        tempo: "3 dias",
      },
      {
        numero: 8,
        titulo: "Documente arquitetura",
        descricao:
          "Desenhe o fluxo, liste decisões, custos estimados e próximos passos.",
        tempo: "3 dias",
      },
    ],
    errosComuns: [
      "Criar recursos sem entender custos",
      "Usar usuário administrador para tudo",
      "Pular redes e depois travar em deploy",
    ],
    oQueEvitar:
      "Não deixe serviços rodando sem monitorar cobrança e permissões.",
    proximoPasso:
      "Prepare certificação de fundamentos e estude Docker, CI/CD e Terraform.",
  },
  {
    id: "ciberseguranca",
    nome: "Cibersegurança do Zero",
    areaSlug: "ciberseguranca" as string | null,
    nivel: "Iniciante",
    duracaoDias: "60 dias",
    descricao:
      "Trilha para construir base em redes, Linux, segurança web e prática em laboratórios guiados.",
    paraQuem:
      "Quem gosta de investigação, proteção de dados e entender como falhas acontecem.",
    preRequisitos: "Vontade de estudar fundamentos com paciência.",
    etapas: [
      {
        numero: 1,
        titulo: "Construa base de redes",
        descricao:
          "Estude IP, DNS, portas, protocolos, roteamento e modelo cliente-servidor.",
        tempo: "1-2 semanas",
      },
      {
        numero: 2,
        titulo: "Aprenda Linux",
        descricao:
          "Pratique terminal, permissões, processos, arquivos e pacotes.",
        tempo: "1 semana",
      },
      {
        numero: 3,
        titulo: "Entenda segurança básica",
        descricao:
          "Estude autenticação, autorização, criptografia, backups e engenharia social.",
        tempo: "1 semana",
      },
      {
        numero: 4,
        titulo: "Pratique em laboratório seguro",
        descricao:
          "Use TryHackMe, Hack The Box Academy ou labs iniciantes, sem testar sistemas reais.",
        tempo: "2 semanas",
      },
      {
        numero: 5,
        titulo: "Estude web security",
        descricao:
          "Aprenda OWASP Top 10, XSS, SQL Injection, CSRF e exposição de dados.",
        tempo: "2 semanas",
      },
      {
        numero: 6,
        titulo: "Conheça ferramentas",
        descricao: "Use Nmap, Wireshark e Burp Suite em ambientes permitidos.",
        tempo: "1 semana",
      },
      {
        numero: 7,
        titulo: "Escreva relatórios",
        descricao:
          "Documente vulnerabilidade, impacto, reprodução e recomendação de correção.",
        tempo: "3 dias",
      },
      {
        numero: 8,
        titulo: "Monte portfólio ético",
        descricao:
          "Publique write-ups de labs, sem dados sensíveis ou alvos reais.",
        tempo: "Contínuo",
      },
    ],
    errosComuns: [
      "Tentar hackear sistemas sem autorização",
      "Pular redes e Linux",
      "Guardar aprendizados sem documentar",
    ],
    oQueEvitar:
      "Nunca teste vulnerabilidades em sistemas reais sem permissão explícita.",
    proximoPasso:
      "Aprofunde SOC, Blue Team, pentest web ou certificações iniciais.",
  },
  {
    id: "produto-digital",
    nome: "Produto Digital para Tech",
    areaSlug: "produto" as string | null,
    nivel: "Iniciante",
    duracaoDias: "20 dias",
    descricao:
      "Trilha para entender discovery, métricas, priorização e criar seu primeiro case de produto.",
    paraQuem:
      "Quem gosta de conectar usuários, negócio, tecnologia e decisões.",
    preRequisitos: "Boa comunicação e curiosidade sobre produtos digitais.",
    etapas: [
      {
        numero: 1,
        titulo: "Entenda o papel de produto",
        descricao: "Aprenda diferenças entre PM, PO, UX, negócio e tecnologia.",
        tempo: "2 dias",
      },
      {
        numero: 2,
        titulo: "Escolha um produto para analisar",
        descricao:
          "Use um app conhecido e descreva público, problema, promessa e principais fluxos.",
        tempo: "2 dias",
      },
      {
        numero: 3,
        titulo: "Mapeie dores e oportunidades",
        descricao:
          "Liste hipóteses, fricções, perguntas de pesquisa e possíveis melhorias.",
        tempo: "4 dias",
      },
      {
        numero: 4,
        titulo: "Defina métricas",
        descricao:
          "Escolha indicadores de aquisição, ativação, retenção ou satisfação.",
        tempo: "3 dias",
      },
      {
        numero: 5,
        titulo: "Priorize iniciativas",
        descricao:
          "Use matriz impacto x esforço ou RICE para decidir o que vem primeiro.",
        tempo: "2 dias",
      },
      {
        numero: 6,
        titulo: "Escreva histórias de usuário",
        descricao:
          "Transforme oportunidades em histórias com critérios de aceite simples.",
        tempo: "3 dias",
      },
      {
        numero: 7,
        titulo: "Monte um roadmap visual",
        descricao:
          "Organize agora, próximo e depois com justificativas claras.",
        tempo: "2 dias",
      },
      {
        numero: 8,
        titulo: "Publique o case",
        descricao:
          "Crie um documento no Notion, Medium ou PDF com raciocínio e aprendizados.",
        tempo: "2 dias",
      },
    ],
    errosComuns: [
      "Confundir opinião com evidência",
      "Criar lista de features sem problema claro",
      "Ignorar métricas",
    ],
    oQueEvitar: "Não prometa solução antes de entender o problema e o usuário.",
    proximoPasso:
      "Estude discovery contínuo, experimentos, analytics e facilitação.",
  },
  {
    id: "ia-aplicada",
    nome: "IA Aplicada para Iniciantes",
    areaSlug: "ia" as string | null,
    nivel: "Iniciante",
    duracaoDias: "60 dias",
    descricao:
      "Trilha para usar IA com responsabilidade, aprender fundamentos e criar um projeto simples.",
    paraQuem:
      "Quem quer entender IA sem pular a base de dados, prompts e avaliação.",
    preRequisitos:
      "Python básico é recomendado, mas a trilha começa com uso prático.",
    etapas: [
      {
        numero: 1,
        titulo: "Entenda o que IA faz e não faz",
        descricao: "Estude modelos, dados, prompts, limitações e alucinação.",
        tempo: "1 semana",
      },
      {
        numero: 2,
        titulo: "Aprenda prompts úteis",
        descricao:
          "Pratique instruções com contexto, exemplos, formato de saída e critérios.",
        tempo: "3 dias",
      },
      {
        numero: 3,
        titulo: "Revise Python básico",
        descricao:
          "Pratique scripts, listas, dicionários, arquivos e bibliotecas simples.",
        tempo: "1-2 semanas",
      },
      {
        numero: 4,
        titulo: "Explore dados",
        descricao:
          "Use um dataset pequeno com Pandas para limpar, filtrar e visualizar informações.",
        tempo: "1 semana",
      },
      {
        numero: 5,
        titulo: "Use uma API de IA",
        descricao:
          "Crie um protótipo que envia um texto, recebe resposta e mostra resultado.",
        tempo: "1 semana",
      },
      {
        numero: 6,
        titulo: "Avalie a qualidade",
        descricao:
          "Teste entradas diferentes, registre erros e defina quando a IA falha.",
        tempo: "4 dias",
      },
      {
        numero: 7,
        titulo: "Crie um mini assistente",
        descricao:
          "Monte uma ferramenta para resumir, classificar ou explicar conteúdo de estudo.",
        tempo: "1-2 semanas",
      },
      {
        numero: 8,
        titulo: "Documente riscos",
        descricao:
          "Explique privacidade, viés, limitações, custos e melhorias futuras.",
        tempo: "3 dias",
      },
    ],
    errosComuns: [
      "Achar que IA sempre está certa",
      "Enviar dados sensíveis em ferramentas externas",
      "Pular avaliação do resultado",
    ],
    oQueEvitar:
      "Não use IA como caixa-preta em projeto de portfólio. Explique limites e decisões.",
    proximoPasso:
      "Estude machine learning, embeddings, RAG e boas práticas de produto com IA.",
  },
  {
    id: "desenvolvedor-fullstack",
    nome: "Desenvolvedor Fullstack",
    areaSlug: "fullstack" as string | null,
    nivel: "Intermediário",
    duracaoDias: "16 semanas",
    descricao:
      "Trilha para quem já tem noções de frontend ou backend e quer dominar as duas pontas e conectá-las em aplicações completas.",
    paraQuem:
      "Quem quer construir produtos do início ao fim, da interface ao banco de dados.",
    preRequisitos:
      "Base de HTML, CSS e JavaScript, e noções de lógica de programação.",
    etapas: [
      {
        numero: 1,
        titulo: "Reforço em JavaScript moderno",
        descricao:
          "Domine recursos modernos da linguagem, requisições assíncronas e manipulação de dados em formato JSON.",
        tempo: "2 semanas",
      },
      {
        numero: 2,
        titulo: "Frontend com framework",
        descricao:
          "Aprofunde em React criando interfaces que consomem dados de APIs. Use a documentação oficial e projetos práticos.",
        tempo: "3-4 semanas",
      },
      {
        numero: 3,
        titulo: "Backend e APIs",
        descricao:
          "Construa APIs REST com Node.js e Express, conectadas a um banco de dados.",
        tempo: "3-4 semanas",
      },
      {
        numero: 4,
        titulo: "Integrando as pontas",
        descricao:
          "Conecte o frontend ao backend, cuidando de autenticação, estados de carregamento e tratamento de erros.",
        tempo: "2-3 semanas",
      },
      {
        numero: 5,
        titulo: "Projeto fullstack completo",
        descricao:
          "Construa uma aplicação de verdade, como um blog ou um controle de gastos, com frontend, backend e banco.",
        tempo: "3 semanas",
      },
      {
        numero: 6,
        titulo: "Deploy e boas práticas",
        descricao:
          "Publique frontend e backend em plataformas gratuitas e organize o projeto com Git e um bom README.",
        tempo: "1-2 semanas",
      },
    ],
    errosComuns: [
      "Tentar ser fullstack sem dominar bem nenhuma das duas pontas primeiro.",
      "Construir frontend e backend que nunca conversam de verdade.",
      "Esquecer de tratar autenticação e segurança na integração.",
      "Deixar o projeto só na máquina local, sem deploy.",
    ],
    oQueEvitar:
      "Evite começar projetos gigantes. Construa algo pequeno e completo de ponta a ponta antes de aumentar a complexidade.",
    proximoPasso:
      "Aprofunde em testes, performance e deploy, ou siga para roadmaps de DevOps e Cloud para entender a parte de infraestrutura.",
  },
  {
    id: "analise-de-dados-do-zero",
    nome: "Análise de Dados do Zero",
    areaSlug: "analise-dados" as string | null,
    nivel: "Iniciante",
    duracaoDias: "10 semanas",
    descricao:
      "Trilha para aprender a coletar, limpar, analisar e visualizar dados para apoiar decisões.",
    paraQuem:
      "Quem gosta de números e quer transformar dados em insights, mesmo vindo de outras áreas.",
    preRequisitos:
      "Nenhum conhecimento prévio de programação é necessário para começar.",
    etapas: [
      {
        numero: 1,
        titulo: "Pensamento analítico e Excel ou planilhas",
        descricao:
          "Aprenda a organizar e resumir dados em planilhas antes de partir para programação.",
        tempo: "2 semanas",
      },
      {
        numero: 2,
        titulo: "Fundamentos de Python",
        descricao:
          "Aprenda o básico de Python voltado para dados. O Kaggle e o Curso em Vídeo têm trilhas iniciais.",
        tempo: "2-3 semanas",
      },
      {
        numero: 3,
        titulo: "Manipulação de dados com Pandas",
        descricao:
          "Aprenda a carregar, filtrar e transformar dados com a biblioteca Pandas. O curso de Pandas do Kaggle é ótimo.",
        tempo: "2 semanas",
      },
      {
        numero: 4,
        titulo: "Visualização de dados",
        descricao:
          "Crie gráficos que comunicam bem. Aprenda bibliotecas de visualização e boas práticas de gráficos.",
        tempo: "1-2 semanas",
      },
      {
        numero: 5,
        titulo: "SQL para dados",
        descricao:
          "Aprenda a consultar bancos de dados com SQL, habilidade essencial no dia a dia da análise.",
        tempo: "1-2 semanas",
      },
      {
        numero: 6,
        titulo: "Projeto de análise completo",
        descricao:
          "Pegue um dataset público, limpe, analise e apresente conclusões em um notebook ou dashboard.",
        tempo: "2 semanas",
      },
    ],
    errosComuns: [
      "Focar só em ferramentas e esquecer de fazer boas perguntas aos dados.",
      "Pular a etapa de limpeza e analisar dados sujos.",
      "Criar gráficos confusos que não comunicam nada.",
      "Não praticar com dados reais e bagunçados.",
    ],
    oQueEvitar:
      "Evite achar que precisa saber matemática avançada para começar. Foque em lógica, organização e clareza na comunicação dos resultados.",
    proximoPasso:
      "Avance para o roadmap de Ciência de Dados ou especialize-se em ferramentas de Business Intelligence.",
  },
  {
    id: "machine-learning-na-pratica",
    nome: "Machine Learning na Prática",
    areaSlug: "ia" as string | null,
    nivel: "Intermediário",
    duracaoDias: "14 semanas",
    descricao:
      "Trilha focada em construir, avaliar e colocar modelos de machine learning para resolver problemas reais.",
    paraQuem:
      "Quem tem base de Python e dados e quer se aprofundar em modelos de aprendizado de máquina.",
    preRequisitos: "Python, Pandas e noções de estatística e análise de dados.",
    etapas: [
      {
        numero: 1,
        titulo: "Fundamentos de aprendizado de máquina",
        descricao:
          "Entenda os tipos de aprendizado e o fluxo de um projeto de ML. O Kaggle Learn tem trilhas práticas gratuitas.",
        tempo: "2 semanas",
      },
      {
        numero: 2,
        titulo: "Preparação de dados para modelos",
        descricao:
          "Aprenda a tratar variáveis, lidar com dados faltantes e preparar os dados para o treino.",
        tempo: "2 semanas",
      },
      {
        numero: 3,
        titulo: "Modelos supervisionados",
        descricao:
          "Treine modelos de regressão e classificação e entenda como cada um funciona.",
        tempo: "3 semanas",
      },
      {
        numero: 4,
        titulo: "Avaliação e validação",
        descricao:
          "Use métricas adequadas e técnicas de validação para confiar nos resultados.",
        tempo: "2 semanas",
      },
      {
        numero: 5,
        titulo: "Introdução a deep learning",
        descricao:
          "Conheça redes neurais com TensorFlow e Keras. O curso Intro to Deep Learning do Kaggle ajuda no início.",
        tempo: "2-3 semanas",
      },
      {
        numero: 6,
        titulo: "Projeto e compartilhamento",
        descricao:
          "Construa um projeto completo, publique no GitHub e, se quiser, uma demo no Streamlit.",
        tempo: "3 semanas",
      },
    ],
    errosComuns: [
      "Treinar modelos sem entender os dados por trás.",
      "Confundir boa acurácia no treino com bom desempenho real.",
      "Ignorar o desbalanceamento das classes nos dados.",
      "Não versionar nem documentar os experimentos.",
    ],
    oQueEvitar:
      "Evite partir direto para deep learning sem dominar modelos mais simples. Muitos problemas se resolvem bem sem redes neurais.",
    proximoPasso:
      "Explore especializações como visão computacional, processamento de linguagem natural ou a área de colocar modelos em produção.",
  },
  {
    id: "devops-do-zero",
    nome: "DevOps do Zero",
    areaSlug: "devops" as string | null,
    nivel: "Intermediário",
    duracaoDias: "14 semanas",
    descricao:
      "Trilha para aprender a integrar desenvolvimento e operações, automatizando testes, deploy e infraestrutura.",
    paraQuem:
      "Quem já programa e quer cuidar de automação, deploy e confiabilidade de sistemas.",
    preRequisitos:
      "Saber programar em alguma linguagem e ter noções de aplicações web.",
    etapas: [
      {
        numero: 1,
        titulo: "Linux e linha de comando",
        descricao:
          "Aprenda a se virar no terminal, gerenciar arquivos e processos. A DIO tem conteúdo gratuito de Linux.",
        tempo: "2 semanas",
      },
      {
        numero: 2,
        titulo: "Git e fluxos de trabalho",
        descricao: "Domine versionamento, branches e colaboração em equipe.",
        tempo: "1-2 semanas",
      },
      {
        numero: 3,
        titulo: "Containers com Docker",
        descricao:
          "Aprenda a empacotar aplicações em containers para rodar em qualquer ambiente. A DIO tem curso de Docker.",
        tempo: "2-3 semanas",
      },
      {
        numero: 4,
        titulo: "Integração e entrega contínua",
        descricao:
          "Automatize testes e deploy com pipelines de CI/CD usando ferramentas como GitHub Actions.",
        tempo: "2-3 semanas",
      },
      {
        numero: 5,
        titulo: "Nuvem e infraestrutura",
        descricao:
          "Entenda os serviços básicos de uma nuvem e como publicar e escalar aplicações. O Microsoft Learn tem trilhas gratuitas.",
        tempo: "3 semanas",
      },
      {
        numero: 6,
        titulo: "Monitoramento e boas práticas",
        descricao:
          "Aprenda a acompanhar logs, métricas e a manter sistemas confiáveis.",
        tempo: "2 semanas",
      },
    ],
    errosComuns: [
      "Querer aprender ferramentas sem entender os conceitos por trás.",
      "Pular a base de Linux e linha de comando.",
      "Automatizar deploy sem ter testes confiáveis.",
      "Acumular muitas ferramentas sem dominar nenhuma.",
    ],
    oQueEvitar:
      "Evite decorar comandos sem entender o que fazem. DevOps é mais sobre cultura e processos do que sobre uma ferramenta específica.",
    proximoPasso:
      "Aprofunde em uma nuvem específica, em infraestrutura como código ou siga para o roadmap de Cloud.",
  },
  {
    id: "primeiro-emprego-em-tech",
    nome: "Primeiro Emprego em Tech",
    areaSlug: null as string | null,
    nivel: "Iniciante",
    duracaoDias: "8 semanas",
    descricao:
      "Trilha temática para quem já está estudando tech e quer se preparar para conquistar a primeira vaga.",
    paraQuem:
      "Pessoas em transição de carreira ou iniciantes que já têm alguma base técnica e querem entrar no mercado.",
    preRequisitos:
      "Estar estudando uma área de tech e ter ao menos um projeto em andamento.",
    etapas: [
      {
        numero: 1,
        titulo: "Defina seu foco de carreira",
        descricao:
          "Escolha uma área para se posicionar e direcionar seus estudos e projetos.",
        tempo: "1 semana",
      },
      {
        numero: 2,
        titulo: "Monte um portfólio enxuto e forte",
        descricao:
          "Reúna de dois a três projetos que mostrem suas habilidades de forma clara.",
        tempo: "2 semanas",
      },
      {
        numero: 3,
        titulo: "Organize seu GitHub e LinkedIn",
        descricao:
          "Deixe seus perfis profissionais atualizados, com bons READMEs e uma apresentação clara.",
        tempo: "1 semana",
      },
      {
        numero: 4,
        titulo: "Currículo e candidaturas",
        descricao:
          "Escreva um currículo objetivo voltado para a área e comece a se candidatar com consistência.",
        tempo: "1-2 semanas",
      },
      {
        numero: 5,
        titulo: "Preparação para entrevistas",
        descricao:
          "Treine para entrevistas comportamentais e técnicas, incluindo como falar dos seus projetos.",
        tempo: "2 semanas",
      },
      {
        numero: 6,
        titulo: "Networking e comunidade",
        descricao:
          "Participe de comunidades, eventos e processos de programas para iniciantes para ampliar suas chances.",
        tempo: "contínuo",
      },
    ],
    errosComuns: [
      "Esperar saber tudo antes de começar a se candidatar.",
      "Enviar o mesmo currículo genérico para tudo.",
      "Ter um GitHub vazio ou bagunçado.",
      "Se candidatar só a vagas seniores por insegurança de tentar as juniores.",
    ],
    oQueEvitar:
      "Evite o ciclo de estudar sem fim por medo de se candidatar. A prática de entrevistas e candidaturas também faz parte do aprendizado.",
    proximoPasso:
      "Continue construindo projetos, peça feedback nas entrevistas e foque na trilha temática de portfólio e entrevista técnica.",
  },
  {
    id: "montar-um-portfolio-que-impressiona",
    nome: "Montar um Portfólio que Impressiona",
    areaSlug: null as string | null,
    nivel: "Iniciante",
    duracaoDias: "4 semanas",
    descricao:
      "Trilha temática para construir um portfólio que mostra de verdade suas habilidades e te destaca em processos seletivos.",
    paraQuem:
      "Quem já tem alguns projetos ou conhecimentos e quer organizá-los de forma profissional.",
    preRequisitos:
      "Ter ao menos um ou dois projetos, mesmo que simples, para incluir.",
    etapas: [
      {
        numero: 1,
        titulo: "Escolha seus melhores projetos",
        descricao:
          "Selecione projetos que representam bem a área que você quer seguir, qualidade acima de quantidade.",
        tempo: "3-4 dias",
      },
      {
        numero: 2,
        titulo: "Capriche na documentação de cada projeto",
        descricao:
          "Escreva READMEs claros com objetivo, tecnologias, como rodar e print ou link da demo.",
        tempo: "1 semana",
      },
      {
        numero: 3,
        titulo: "Publique os projetos",
        descricao:
          "Coloque seus projetos no ar em plataformas gratuitas para que recrutadores acessem fácil.",
        tempo: "3-4 dias",
      },
      {
        numero: 4,
        titulo: "Crie a página do portfólio",
        descricao:
          "Monte um site simples reunindo seus projetos, habilidades e contato.",
        tempo: "1 semana",
      },
      {
        numero: 5,
        titulo: "Peça feedback e ajuste",
        descricao:
          "Mostre para pessoas da área, colete críticas e melhore o que for preciso.",
        tempo: "3-4 dias",
      },
    ],
    errosComuns: [
      "Encher o portfólio de projetos copiados de tutoriais idênticos.",
      "Deixar projetos sem explicação ou sem link funcionando.",
      "Priorizar quantidade em vez de qualidade.",
      "Nunca pedir feedback antes de divulgar.",
    ],
    oQueEvitar:
      "Evite incluir projetos que você não sabe explicar. Em uma entrevista, é melhor ter poucos projetos que você domina de verdade.",
    proximoPasso:
      "Com o portfólio pronto, foque na trilha de Primeiro Emprego em Tech e comece a se candidatar.",
  },
];

export const cursosGratuitos = [
  {
    id: "curso-html-css-cv",
    certificate: "nao_informado",
    titulo: "HTML, CSS e JavaScript",
    canal: "Curso em Vídeo",
    plataforma: "YouTube",
    link: "https://www.youtube.com/c/CursoemV%C3%ADdeo",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    duracao: "40+ horas",
    idioma: "Português",
    descricao:
      "Curso completo e gratuito de HTML5, CSS3 e JavaScript com o professor Gustavo Guanabara. Um dos melhores cursos em português para iniciantes.",
    motivoIndicacao:
      "Linguagem simples, didática excelente e comunidade ativa. Ideal para quem está começando do zero.",
    oQueAprende: [
      "HTML semântico",
      "CSS moderno",
      "JavaScript básico",
      "Projetos práticos",
    ],
    proximoConteudo: "Rocketseat Discover ou freeCodeCamp",
  },
  {
    id: "curso-freecodecamp",
    certificate: "sim",
    titulo: "Responsive Web Design",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp",
    link: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    duracao: "300 horas",
    idioma: "Inglês (com suporte em português)",
    descricao:
      "Certificação gratuita de design responsivo com HTML e CSS. Aprenda construindo projetos reais.",
    motivoIndicacao:
      "Certificado gratuito reconhecido, aprendizado prático e comunidade global.",
    oQueAprende: ["HTML5", "CSS3", "Flexbox e Grid", "Projetos certificados"],
    proximoConteudo:
      "JavaScript Algorithms and Data Structures no freeCodeCamp",
  },
  {
    id: "curso-rocketseat-discover",
    certificate: "nao_informado",
    titulo: "Discover: Fundamentos Web",
    canal: "Rocketseat",
    plataforma: "Rocketseat",
    link: "https://app.rocketseat.com.br/discover",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    duracao: "20+ horas",
    idioma: "Português",
    descricao:
      "Trilha gratuita da Rocketseat para aprender os fundamentos do desenvolvimento web.",
    motivoIndicacao:
      "Conteúdo de alta qualidade, comunidade ativa no Discord e trilha bem estruturada.",
    oQueAprende: ["HTML", "CSS", "JavaScript", "Git e GitHub"],
    proximoConteudo: "Ignite da Rocketseat (pago) ou React no YouTube",
  },
  {
    id: "curso-python-cv",
    certificate: "nao_informado",
    titulo: "Curso de Python",
    canal: "Curso em Vídeo",
    plataforma: "YouTube",
    link: "https://www.youtube.com/playlist?list=PLvE-ZAFRgX8hnECDn1v9HNTI71veL3oW0",
    areaSlug: "backend" as string | null,
    nivel: "Iniciante",
    duracao: "40+ horas",
    idioma: "Português",
    descricao:
      "Curso completo de Python com Gustavo Guanabara. Do básico ao intermediário.",
    motivoIndicacao:
      "Melhor curso de Python em português, gratuito e com certificado.",
    oQueAprende: [
      "Python básico",
      "Estruturas de dados",
      "POO",
      "Projetos práticos",
    ],
    proximoConteudo: "Pandas para Dados ou Django para Back-end",
  },
  {
    id: "curso-figma-oficial",
    certificate: "nao_informado",
    titulo: "Figma for Beginners",
    canal: "Figma",
    plataforma: "YouTube / Figma",
    link: "https://www.youtube.com/playlist?list=PLXDU_eVOJTx6zk5MDarIs0asNoZqlRG23",
    areaSlug: "uxui" as string | null,
    nivel: "Iniciante",
    duracao: "4 horas",
    idioma: "Inglês",
    descricao: "Tutorial oficial do Figma para aprender a ferramenta do zero.",
    motivoIndicacao:
      "Conteúdo oficial, atualizado e gratuito. Melhor forma de aprender Figma.",
    oQueAprende: [
      "Interface do Figma",
      "Frames e componentes",
      "Auto-layout",
      "Prototipação",
    ],
    proximoConteudo: "Origamid: UI Design Avançado",
  },
  {
    id: "curso-dio-java",
    certificate: "sim",
    titulo: "Java Básico",
    canal: "DIO",
    plataforma: "DIO",
    link: "https://web.dio.me/",
    areaSlug: "backend" as string | null,
    nivel: "Iniciante",
    duracao: "20+ horas",
    idioma: "Português",
    descricao:
      "Curso gratuito de Java na DIO com certificado e projetos práticos.",
    motivoIndicacao:
      "Certificado gratuito, conteúdo em português e plataforma com vagas parceiras.",
    oQueAprende: [
      "Java básico",
      "POO",
      "Estruturas de dados",
      "Spring Boot introdutório",
    ],
    proximoConteudo: "Spring Boot avançado ou Microsserviços",
  },
  {
    id: "curso-kaggle-python",
    certificate: "sim",
    titulo: "Python for Data Science",
    canal: "Kaggle",
    plataforma: "Kaggle",
    link: "https://www.kaggle.com/learn/python",
    areaSlug: "dados" as string | null,
    nivel: "Iniciante",
    duracao: "5 horas",
    idioma: "Inglês",
    descricao:
      "Curso gratuito e interativo de Python focado em ciência de dados.",
    motivoIndicacao:
      "Aprenda Python diretamente no navegador, sem instalar nada. Certificado gratuito.",
    oQueAprende: [
      "Python básico",
      "Pandas",
      "Visualização",
      "Machine Learning introdutório",
    ],
    proximoConteudo: "Pandas no Kaggle e análise exploratória de dados",
  },
  {
    id: "curso-aws-free",
    certificate: "nao_informado",
    titulo: "AWS Cloud Practitioner Essentials",
    canal: "AWS",
    plataforma: "AWS Skill Builder",
    link: "https://explore.skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials",
    areaSlug: "cloud" as string | null,
    nivel: "Iniciante",
    duracao: "6 horas",
    idioma: "Inglês / Português",
    descricao:
      "Curso oficial da AWS para a certificação Cloud Practitioner. Gratuito na plataforma AWS Skill Builder.",
    motivoIndicacao:
      "Preparação oficial para a certificação mais acessível da AWS. Muito valorizado no mercado.",
    oQueAprende: [
      "Conceitos de Cloud",
      "Serviços AWS principais",
      "Segurança na nuvem",
      "Precificação AWS",
    ],
    proximoConteudo: "AWS Solutions Architect Associate",
  },
  {
    id: "curso-tryhackme",
    certificate: "nao_informado",
    titulo: "Pre-Security Path",
    canal: "TryHackMe",
    plataforma: "TryHackMe",
    link: "https://tryhackme.com/path/outline/presecurity",
    areaSlug: "ciberseguranca" as string | null,
    nivel: "Iniciante",
    duracao: "40 horas",
    idioma: "Inglês",
    descricao:
      "Trilha gratuita de cibersegurança para iniciantes absolutos. Aprenda na prática em ambientes virtuais.",
    motivoIndicacao:
      "Aprendizado prático, gamificado e sem precisar configurar nada no computador.",
    oQueAprende: [
      "Redes básicas",
      "Linux",
      "Web security",
      "Conceitos de segurança",
    ],
    proximoConteudo: "SOC Level 1 no TryHackMe",
  },
  {
    id: "curso-microsoft-learn",
    certificate: "nao_informado",
    titulo: "Fundamentos do Azure",
    canal: "Microsoft",
    plataforma: "Microsoft Learn",
    link: "https://learn.microsoft.com/pt-br/training/paths/az-900-describe-cloud-concepts/",
    areaSlug: "cloud" as string | null,
    nivel: "Iniciante",
    duracao: "8 horas",
    idioma: "Português",
    descricao:
      "Trilha gratuita da Microsoft para aprender os fundamentos do Azure e se preparar para a certificação AZ-900.",
    motivoIndicacao:
      "Conteúdo oficial em português, gratuito e com certificação reconhecida mundialmente.",
    oQueAprende: [
      "Conceitos de Cloud",
      "Serviços Azure",
      "Segurança e conformidade",
      "Preços Azure",
    ],
    proximoConteudo: "Azure Administrator Associate (AZ-104)",
  },
  {
    id: "curso-origamid-front-end",
    certificate: "nao_informado",
    titulo: "Front-end completo",
    canal: "Origamid",
    plataforma: "Origamid",
    link: "https://www.origamid.com/",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    duracao: "100+ horas",
    idioma: "Português",
    tipo: "Pago",
    preco: "Assinatura paga",
    descricao:
      "Formação focada em HTML, CSS, JavaScript, UX/UI e projetos visuais com alta qualidade didática.",
    motivoIndicacao:
      "Excelente para quem aprende melhor com trilha organizada, visual caprichado e projetos práticos.",
    oQueAprende: ["HTML e CSS", "JavaScript", "React", "UI Design"],
    proximoConteudo: "Projetos próprios para portfólio",
  },
  {
    id: "curso-alura-front-end",
    certificate: "nao_informado",
    titulo: "Formação Front-end",
    canal: "Alura",
    plataforma: "Alura",
    link: "https://www.alura.com.br/formacao-front-end",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    duracao: "80+ horas",
    idioma: "Português",
    tipo: "Pago",
    preco: "Assinatura paga",
    descricao:
      "Trilha estruturada para aprender HTML, CSS, JavaScript, acessibilidade e fundamentos de interfaces web.",
    motivoIndicacao:
      "Boa opção para quem quer uma plataforma brasileira com sequência clara e certificado.",
    oQueAprende: ["HTML", "CSS", "JavaScript", "Acessibilidade"],
    proximoConteudo: "React e TypeScript",
  },
  {
    id: "curso-alura-dados",
    certificate: "nao_informado",
    titulo: "Formação Data Science",
    canal: "Alura",
    plataforma: "Alura",
    link: "https://www.alura.com.br/formacao-data-science",
    areaSlug: "dados" as string | null,
    nivel: "Iniciante",
    duracao: "70+ horas",
    idioma: "Português",
    tipo: "Pago",
    preco: "Assinatura paga",
    descricao:
      "Formação para começar em dados com Python, análise, visualização e primeiros modelos de machine learning.",
    motivoIndicacao:
      "Ajuda iniciantes a seguir uma trilha progressiva sem precisar montar o caminho do zero.",
    oQueAprende: ["Python", "Pandas", "Visualização", "Machine Learning"],
    proximoConteudo: "Projetos com datasets públicos",
  },
  {
    id: "curso-udemy-react",
    certificate: "nao_informado",
    titulo: "React do Zero à Maestria",
    canal: "Udemy",
    plataforma: "Udemy",
    link: "https://www.udemy.com/course/react-do-zero-a-maestria-c-hooks-router-api-projetos/",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    duracao: "30+ horas",
    idioma: "Português",
    tipo: "Pago",
    preco: "Pago por curso",
    descricao:
      "Curso prático para aprender React com hooks, rotas, consumo de API e projetos.",
    motivoIndicacao:
      "Pode valer a pena em promoção para quem quer praticar React com muitos exemplos.",
    oQueAprende: ["React", "Hooks", "Rotas", "APIs"],
    proximoConteudo: "TypeScript e testes",
  },
  {
    id: "curso-rocketseat-one",
    certificate: "nao_informado",
    titulo: "Rocketseat One",
    canal: "Rocketseat",
    plataforma: "Rocketseat",
    link: "https://www.rocketseat.com.br/",
    areaSlug: null as string | null,
    nivel: "Iniciante",
    duracao: "Trilhas contínuas",
    idioma: "Português",
    tipo: "Pago",
    preco: "Assinatura paga",
    descricao:
      "Plataforma com trilhas de desenvolvimento web, mobile e back-end com foco em projetos e mercado.",
    motivoIndicacao:
      "Boa para quem quer comunidade ativa e trilhas modernas no ecossistema JavaScript.",
    oQueAprende: ["JavaScript", "React", "Node.js", "Projetos"],
    proximoConteudo: "Portfólio full stack",
  },
  {
    id: "curso-fullcycle",
    certificate: "nao_informado",
    titulo: "Full Cycle",
    canal: "Full Cycle",
    plataforma: "Full Cycle",
    link: "https://fullcycle.com.br/",
    areaSlug: "devops" as string | null,
    nivel: "Intermediário",
    duracao: "Trilhas contínuas",
    idioma: "Português",
    tipo: "Pago",
    preco: "Assinatura paga",
    descricao:
      "Formação voltada para arquitetura, Docker, Kubernetes, microsserviços, DevOps e boas práticas modernas.",
    motivoIndicacao:
      "Indicado para quem já passou do básico e quer aprofundar arquitetura e entrega de software.",
    oQueAprende: ["Docker", "Kubernetes", "Arquitetura", "Microsserviços"],
    proximoConteudo: "Projetos de infraestrutura e cloud",
  },
  {
    id: "curso-curso.dev",
    certificate: "nao_informado",
    titulo: "curso.dev",
    canal: "Filipe Deschamps",
    plataforma: "curso.dev",
    link: "https://curso.dev/",
    areaSlug: null as string | null,
    nivel: "Iniciante",
    duracao: "Trilha completa",
    idioma: "Português",
    tipo: "Pago",
    preco: "Pago",
    descricao:
      "Curso focado em fundamentos reais de desenvolvimento de software, produto, carreira e construção de aplicações.",
    motivoIndicacao:
      "Boa alternativa paga para quem quer entender o raciocínio por trás de projetos reais.",
    oQueAprende: ["Fundamentos web", "Back-end", "Banco de dados", "Produto"],
    proximoConteudo: "Projetos autorais com documentação",
  },
  {
    id: "curso-awari-ux",
    certificate: "nao_informado",
    titulo: "UX/UI Design",
    canal: "Awari",
    plataforma: "Awari",
    link: "https://awari.com.br/",
    areaSlug: "uxui" as string | null,
    nivel: "Iniciante",
    duracao: "Varia por turma",
    idioma: "Português",
    tipo: "Pago",
    preco: "Pago",
    descricao:
      "Curso pago com foco em design de produto, pesquisa, prototipação e construção de portfólio.",
    motivoIndicacao:
      "Interessante para quem busca acompanhamento mais próximo e direcionamento de portfólio.",
    oQueAprende: ["UX Research", "UI Design", "Figma", "Portfólio"],
    proximoConteudo: "Cases completos para Behance e LinkedIn",
  },
  {
    id: "curso-pm3-produto",
    certificate: "nao_informado",
    titulo: "Product Management",
    canal: "PM3",
    plataforma: "PM3",
    link: "https://www.cursospm3.com.br/",
    areaSlug: "gestao" as string | null,
    nivel: "Iniciante",
    duracao: "40+ horas",
    idioma: "Português",
    tipo: "Pago",
    preco: "Pago",
    descricao:
      "Curso para entender descoberta, estratégia, métricas, priorização e rotina de produto digital.",
    motivoIndicacao:
      "Referência brasileira para quem quer migrar ou começar em produto com vocabulário de mercado.",
    oQueAprende: ["Discovery", "Métricas", "Roadmap", "Priorização"],
    proximoConteudo: "Cases de produto e análise de aplicativos",
  },
  {
    id: "curso-ebac-qa",
    certificate: "nao_informado",
    titulo: "Engenheiro de Qualidade de Software",
    canal: "EBAC",
    plataforma: "EBAC",
    link: "https://ebaconline.com.br/",
    areaSlug: "qa" as string | null,
    nivel: "Iniciante",
    duracao: "Varia por turma",
    idioma: "Português",
    tipo: "Pago",
    preco: "Pago",
    descricao:
      "Formação paga para aprender testes manuais, automação, planejamento e ferramentas de qualidade.",
    motivoIndicacao:
      "Opção para quem quer entrar por QA com trilha guiada e foco em empregabilidade.",
    oQueAprende: [
      "Testes manuais",
      "Automação",
      "Planejamento",
      "Ferramentas QA",
    ],
    proximoConteudo: "Projetos de plano de testes e automação",
  },
  {
    id: "curso-cs50x",
    certificate: "sim",
    titulo: "CS50x: Introdução à Ciência da Computação",
    canal: "Harvard / CS50",
    plataforma: "edX",
    link: "https://cs50.harvard.edu/x/",
    areaSlug: "fullstack" as string | null,
    nivel: "Iniciante",
    duracao: "100+ horas",
    idioma: "Inglês (legendas em português)",
    descricao:
      "Curso introdutório de Ciência da Computação de Harvard. Cobre lógica, C, Python, SQL e web com projetos práticos.",
    motivoIndicacao:
      "Base sólida de fundamentos que serve para qualquer área de TI, gratuita e reconhecida mundialmente.",
    oQueAprende: [
      "Lógica de programação",
      "C e Python",
      "SQL",
      "Estruturas de dados",
    ],
    proximoConteudo: "The Odin Project ou freeCodeCamp",
  },
  {
    id: "curso-odin-project",
    certificate: "nao",
    titulo: "The Odin Project: Full Stack",
    canal: "The Odin Project",
    plataforma: "The Odin Project",
    link: "https://www.theodinproject.com/",
    areaSlug: "fullstack" as string | null,
    nivel: "Intermediário",
    duracao: "Trilha autoguiada (longa)",
    idioma: "Inglês",
    descricao:
      "Trilha gratuita e completa de desenvolvimento web full stack, baseada em prática e construção de projetos reais.",
    motivoIndicacao:
      "Currículo aberto, atualizado pela comunidade e 100% baseado em projetos, ótimo para portfólio.",
    oQueAprende: [
      "HTML, CSS e JavaScript",
      "Git e GitHub",
      "Node.js",
      "Projetos full stack",
    ],
    proximoConteudo: "Aprofundar em React e back-end",
  },
  {
    id: "curso-fcc-javascript",
    certificate: "sim",
    titulo: "JavaScript Algorithms and Data Structures",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp",
    link: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    duracao: "300 horas",
    idioma: "Inglês (com suporte em português)",
    descricao:
      "Certificação gratuita de JavaScript, do básico à manipulação de dados e algoritmos, com exercícios e projetos.",
    motivoIndicacao:
      "Sequência natural depois de HTML e CSS, com certificado gratuito e prática constante.",
    oQueAprende: [
      "JavaScript moderno",
      "Algoritmos",
      "Estruturas de dados",
      "Projetos certificados",
    ],
    proximoConteudo: "Front End Development Libraries no freeCodeCamp",
  },
  {
    id: "curso-fcc-python",
    certificate: "sim",
    titulo: "Scientific Computing with Python",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp",
    link: "https://www.freecodecamp.org/learn/scientific-computing-with-python/",
    areaSlug: "dados" as string | null,
    nivel: "Iniciante",
    duracao: "300 horas",
    idioma: "Inglês (com suporte em português)",
    descricao:
      "Certificação gratuita de Python aplicada a computação científica, com projetos práticos de manipulação de dados.",
    motivoIndicacao:
      "Boa porta de entrada em Python para quem quer seguir para dados, com certificado gratuito.",
    oQueAprende: [
      "Python",
      "Estruturas de dados",
      "Lógica aplicada",
      "Projetos certificados",
    ],
    proximoConteudo: "Data Analysis with Python no freeCodeCamp",
  },
  {
    id: "curso-fcc-sql",
    certificate: "sim",
    titulo: "Relational Database (SQL)",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp",
    link: "https://www.freecodecamp.org/learn/relational-database/",
    areaSlug: "dados" as string | null,
    nivel: "Iniciante",
    duracao: "Trilha prática",
    idioma: "Inglês (com suporte em português)",
    descricao:
      "Trilha gratuita e prática de bancos de dados relacionais e SQL, executada direto no terminal com projetos.",
    motivoIndicacao:
      "SQL é cobrado em praticamente toda vaga de dados, e aqui o aprendizado é totalmente mão na massa.",
    oQueAprende: [
      "SQL",
      "Bancos relacionais",
      "Linha de comando",
      "Projetos práticos",
    ],
    proximoConteudo: "Análise de dados com Python e pandas",
  },
  {
    id: "curso-fcc-react",
    certificate: "sim",
    titulo: "Front End Development Libraries (React)",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp",
    link: "https://www.freecodecamp.org/learn/front-end-development-libraries/",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    duracao: "300 horas",
    idioma: "Inglês (com suporte em português)",
    descricao:
      "Certificação gratuita com React, Redux, Bootstrap e Sass, construindo interfaces e componentes reutilizáveis.",
    motivoIndicacao:
      "React é o framework front-end mais pedido no mercado, e aqui você pratica com projetos certificados.",
    oQueAprende: ["React", "Redux", "Sass", "Projetos certificados"],
    proximoConteudo: "Projetos próprios em React para o portfólio",
  },
  {
    id: "curso-google-ux",
    certificate: "nao_informado",
    titulo: "Google UX Design (Certificado Profissional)",
    canal: "Google",
    plataforma: "Coursera",
    link: "https://www.coursera.org/professional-certificates/google-ux-design",
    areaSlug: "uxui" as string | null,
    nivel: "Iniciante",
    duracao: "~6 meses (ritmo leve)",
    idioma: "Inglês (legendas em português)",
    descricao:
      "Certificado profissional de UX do Google, do processo de pesquisa ao protótipo no Figma e Adobe XD.",
    motivoIndicacao:
      "Trilha estruturada de UX para iniciantes, gratuita para auditar e reconhecida no mercado.",
    oQueAprende: [
      "Processo de UX",
      "Pesquisa com usuários",
      "Wireframes e protótipos",
      "Figma",
    ],
    proximoConteudo: "Montar um portfólio de UX com estudos de caso",
  },
  {
    id: "curso-elements-of-ai",
    certificate: "nao_informado",
    titulo: "Elements of AI",
    canal: "University of Helsinki",
    plataforma: "Elements of AI",
    link: "https://www.elementsofai.com/",
    areaSlug: "ia" as string | null,
    nivel: "Iniciante",
    duracao: "~30 horas",
    idioma: "Português (e inglês)",
    descricao:
      "Curso introdutório e gratuito sobre o que é inteligência artificial, seus conceitos e implicações, sem exigir programação.",
    motivoIndicacao:
      "Ótimo primeiro contato com IA para entender os conceitos antes de partir para a prática técnica.",
    oQueAprende: [
      "O que é IA",
      "Aprendizado de máquina",
      "Aplicações reais",
      "Limites e ética",
    ],
    proximoConteudo: "Python e bibliotecas de machine learning",
  },
  {
    id: "curso-aws-cloud-practitioner",
    certificate: "nao_informado",
    titulo: "AWS Cloud Practitioner Essentials",
    canal: "Amazon Web Services",
    plataforma: "AWS Skill Builder",
    link: "https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/",
    areaSlug: "cloud" as string | null,
    nivel: "Iniciante",
    duracao: "~6 horas",
    idioma: "Inglês (e português)",
    descricao:
      "Curso introdutório e gratuito sobre fundamentos de cloud na AWS: serviços principais, segurança, preços e suporte.",
    motivoIndicacao:
      "Primeiro passo para quem quer cloud, e prepara para a certificação Cloud Practitioner.",
    oQueAprende: [
      "Fundamentos de cloud",
      "Serviços AWS",
      "Segurança",
      "Modelo de preços",
    ],
    proximoConteudo: "Certificação AWS Certified Cloud Practitioner",
  },
  {
    id: "curso-flutter-codelab",
    certificate: "nao_informado",
    titulo: "Flutter: primeiro app (codelab oficial)",
    canal: "Google",
    plataforma: "Flutter",
    link: "https://docs.flutter.dev/get-started/codelab",
    areaSlug: "mobile" as string | null,
    nivel: "Iniciante",
    duracao: "Algumas horas",
    idioma: "Inglês",
    descricao:
      "Tutorial oficial e gratuito do Flutter para criar seu primeiro aplicativo multiplataforma do zero.",
    motivoIndicacao:
      "Maneira prática de começar em mobile com uma única base de código para Android e iOS.",
    oQueAprende: [
      "Dart básico",
      "Widgets do Flutter",
      "Layout e estado",
      "Primeiro app",
    ],
    proximoConteudo: "Construir um app completo com navegação e dados",
  },
  {
    id: "curso-fcc-backend",
    certificate: "sim",
    titulo: "Back End Development and APIs",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp",
    link: "https://www.freecodecamp.org/learn/back-end-development-and-apis/",
    areaSlug: "backend" as string | null,
    nivel: "Intermediário",
    duracao: "300 horas",
    idioma: "Inglês (com suporte em português)",
    descricao:
      "Certificação gratuita de back-end com Node.js e Express, criando e consumindo APIs e trabalhando com MongoDB.",
    motivoIndicacao:
      "Caminho prático para quem já sabe JavaScript e quer construir o lado servidor de uma aplicação.",
    oQueAprende: ["Node.js", "Express", "APIs REST", "MongoDB"],
    proximoConteudo: "Projetos próprios de API para o portfólio",
  },
  {
    id: "curso-fcc-data-analysis",
    certificate: "sim",
    titulo: "Data Analysis with Python",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp",
    link: "https://www.freecodecamp.org/learn/data-analysis-with-python/",
    areaSlug: "dados" as string | null,
    nivel: "Intermediário",
    duracao: "300 horas",
    idioma: "Inglês (com suporte em português)",
    descricao:
      "Certificação gratuita de análise de dados com Python, usando pandas, NumPy e visualização para explorar conjuntos reais.",
    motivoIndicacao:
      "Sequência natural depois de Python para quem quer seguir na carreira de dados.",
    oQueAprende: ["pandas", "NumPy", "Visualização", "Análise exploratória"],
    proximoConteudo: "Projetos de análise com dados públicos",
  },
  {
    id: "curso-fcc-infosec",
    certificate: "sim",
    titulo: "Information Security",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp",
    link: "https://www.freecodecamp.org/learn/information-security/",
    areaSlug: "ciberseguranca" as string | null,
    nivel: "Intermediário",
    duracao: "300 horas",
    idioma: "Inglês (com suporte em português)",
    descricao:
      "Certificação gratuita de segurança da informação com Node.js, HelmetJS e testes de penetração introdutórios.",
    motivoIndicacao:
      "Primeiro contato prático com segurança aplicada para quem já programa.",
    oQueAprende: [
      "Segurança em apps web",
      "HelmetJS",
      "Pentest básico",
      "Boas práticas",
    ],
    proximoConteudo: "Laboratórios práticos em plataformas de cibersegurança",
  },
  {
    id: "curso-ms-csharp",
    certificate: "nao_informado",
    titulo: "Primeiros passos com C#",
    canal: "Microsoft",
    plataforma: "Microsoft Learn",
    link: "https://learn.microsoft.com/training/paths/csharp-first-steps/",
    areaSlug: "backend" as string | null,
    nivel: "Iniciante",
    duracao: "~8 horas",
    idioma: "Português",
    descricao:
      "Trilha gratuita e oficial da Microsoft para aprender a lógica e a sintaxe de C# do zero, direto no navegador.",
    motivoIndicacao:
      "Ótima porta de entrada para o ecossistema .NET, muito usado em empresas no Brasil.",
    oQueAprende: [
      "Sintaxe de C#",
      "Variáveis e tipos",
      "Lógica e laços",
      "Console apps",
    ],
    proximoConteudo: "Aprofundar em .NET e APIs com ASP.NET",
  },
  {
    id: "curso-android-compose",
    certificate: "nao_informado",
    titulo: "Android Basics with Compose",
    canal: "Google",
    plataforma: "Android Developers",
    link: "https://developer.android.com/courses/android-basics-compose/course",
    areaSlug: "mobile" as string | null,
    nivel: "Iniciante",
    duracao: "Trilha autoguiada",
    idioma: "Inglês",
    descricao:
      "Curso oficial e gratuito do Google para criar apps Android nativos com Kotlin e Jetpack Compose.",
    motivoIndicacao:
      "Caminho oficial e atualizado para quem quer desenvolvimento mobile nativo Android.",
    oQueAprende: ["Kotlin", "Jetpack Compose", "UI Android", "Primeiros apps"],
    proximoConteudo: "Publicar um app simples na Play Store",
  },
  {
    id: "curso-kaggle-ml",
    certificate: "sim",
    titulo: "Intro to Machine Learning",
    canal: "Kaggle",
    plataforma: "Kaggle",
    link: "https://www.kaggle.com/learn/intro-to-machine-learning",
    areaSlug: "ia" as string | null,
    nivel: "Intermediário",
    duracao: "~3 horas",
    idioma: "Inglês",
    descricao:
      "Microcurso gratuito e prático do Kaggle sobre os fundamentos de machine learning, com notebooks no navegador.",
    motivoIndicacao:
      "Aprende treinando modelos de verdade em conjuntos reais, sem precisar instalar nada.",
    oQueAprende: [
      "Modelos de ML",
      "Treino e validação",
      "Overfitting",
      "Random Forest",
    ],
    proximoConteudo: "Intermediate Machine Learning no Kaggle",
  },
  {
    id: "curso-google-data-analytics",
    certificate: "nao_informado",
    titulo: "Google Data Analytics (Certificado Profissional)",
    canal: "Google",
    plataforma: "Coursera",
    link: "https://www.coursera.org/professional-certificates/google-data-analytics",
    areaSlug: "dados" as string | null,
    nivel: "Iniciante",
    duracao: "~6 meses (ritmo leve)",
    idioma: "Inglês (legendas em português)",
    descricao:
      "Certificado profissional do Google sobre análise de dados, do entendimento do problema à visualização e SQL.",
    motivoIndicacao:
      "Trilha estruturada para quem quer entrar em dados sem experiência prévia, gratuita para auditar.",
    oQueAprende: [
      "Processo de análise",
      "SQL",
      "Planilhas",
      "Visualização e R",
    ],
    proximoConteudo: "Projetos próprios de análise no portfólio",
  },
  {
    id: "curso-ms-azure-fundamentals",
    certificate: "nao_informado",
    titulo: "Microsoft Azure Fundamentals (AZ-900)",
    canal: "Microsoft",
    plataforma: "Microsoft Learn",
    link: "https://learn.microsoft.com/credentials/certifications/azure-fundamentals/",
    areaSlug: "cloud" as string | null,
    nivel: "Iniciante",
    duracao: "~10 horas",
    idioma: "Português",
    descricao:
      "Trilha gratuita e oficial sobre fundamentos de nuvem na Azure: serviços, segurança, governança e preços.",
    motivoIndicacao:
      "Alternativa à AWS para fundamentos de cloud, prepara para a certificação AZ-900.",
    oQueAprende: [
      "Conceitos de cloud",
      "Serviços Azure",
      "Segurança e identidade",
      "Custos",
    ],
    proximoConteudo: "Certificação AZ-900 ou trilhas de Azure por área",
  },
  {
    id: "curso-full-stack-open",
    certificate: "sim",
    titulo: "Full Stack Open",
    canal: "University of Helsinki",
    plataforma: "Full Stack Open",
    link: "https://fullstackopen.com/",
    areaSlug: "fullstack" as string | null,
    nivel: "Intermediário",
    duracao: "Trilha longa",
    idioma: "Inglês",
    descricao:
      "Curso aprofundado e gratuito de desenvolvimento web moderno com React, Node.js, GraphQL, TypeScript e testes.",
    motivoIndicacao:
      "Referência mundial para sair do iniciante e construir aplicações completas de verdade.",
    oQueAprende: [
      "React avançado",
      "Node e Express",
      "GraphQL",
      "TypeScript e testes",
    ],
    proximoConteudo: "Projetos full stack próprios",
  },
  {
    id: "curso-cs50-web",
    certificate: "sim",
    titulo: "CS50 Web Programming com Python e JavaScript",
    canal: "Harvard / CS50",
    plataforma: "edX",
    link: "https://cs50.harvard.edu/web/",
    areaSlug: "fullstack" as string | null,
    nivel: "Intermediário",
    duracao: "~80 horas",
    idioma: "Inglês (legendas em português)",
    descricao:
      "Curso de Harvard sobre desenvolvimento web com Python, Django, JavaScript, SQL e boas práticas de projeto.",
    motivoIndicacao:
      "Continuação ideal do CS50x para quem quer estruturar aplicações web reais.",
    oQueAprende: ["Django", "JavaScript", "SQL", "Arquitetura web"],
    proximoConteudo: "Deploy e testes de uma aplicação completa",
  },
  {
    id: "curso-javascript-info",
    certificate: "nao_informado",
    titulo: "JavaScript Moderno (javascript.info)",
    canal: "javascript.info",
    plataforma: "The Modern JavaScript Tutorial",
    link: "https://javascript.info/",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    duracao: "Trilha autoguiada",
    idioma: "Inglês",
    descricao:
      "Material aprofundado e gratuito sobre JavaScript moderno, do funcionamento da linguagem ao DOM e assíncrono.",
    motivoIndicacao:
      "O melhor texto de referência para entender JavaScript de verdade, não só copiar código.",
    oQueAprende: [
      "Closures e prototypes",
      "Promises e async",
      "DOM",
      "Padrões de JS",
    ],
    proximoConteudo: "Frameworks como React ou Vue",
  },
  {
    id: "curso-javascript30",
    certificate: "nao_informado",
    titulo: "JavaScript30",
    canal: "Wes Bos",
    plataforma: "JavaScript30",
    link: "https://javascript30.com/",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    duracao: "30 projetos",
    idioma: "Inglês",
    descricao:
      "Desafio gratuito de 30 projetos em JavaScript puro, sem frameworks nem bibliotecas, para ganhar fluência.",
    motivoIndicacao:
      "Treina prática real de DOM e eventos, ótimo para fixar fundamentos antes de um framework.",
    oQueAprende: [
      "JavaScript puro",
      "Manipulação de DOM",
      "Eventos",
      "Projetos práticos",
    ],
    proximoConteudo: "Aprofundar em um framework front-end",
  },
  {
    id: "curso-typescript-handbook",
    certificate: "nao_informado",
    titulo: "TypeScript Handbook (oficial)",
    canal: "Microsoft",
    plataforma: "TypeScript",
    link: "https://www.typescriptlang.org/docs/handbook/intro.html",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    duracao: "Trilha autoguiada",
    idioma: "Inglês",
    descricao:
      "Documentação oficial e gratuita para aprender TypeScript: tipos, interfaces, generics e configuração.",
    motivoIndicacao:
      "TypeScript é padrão no mercado front-end e back-end JavaScript; aqui está a fonte definitiva.",
    oQueAprende: [
      "Tipos e interfaces",
      "Generics",
      "Narrowing",
      "Configuração do tsconfig",
    ],
    proximoConteudo: "Usar TypeScript em React ou Node",
  },
  {
    id: "curso-webdev-learn",
    certificate: "nao_informado",
    titulo: "web.dev Learn",
    canal: "Google",
    plataforma: "web.dev",
    link: "https://web.dev/learn",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    duracao: "Vários módulos",
    idioma: "Inglês",
    descricao:
      "Cursos oficiais do Google sobre CSS, HTML, performance, acessibilidade e PWAs para a web moderna.",
    motivoIndicacao:
      "Conteúdo atualizado direto de quem faz o Chrome, ótimo para subir o nível técnico de front-end.",
    oQueAprende: ["CSS moderno", "Performance", "Acessibilidade", "PWA"],
    proximoConteudo: "Otimização avançada e Core Web Vitals",
  },
  {
    id: "curso-spring-guides",
    certificate: "nao_informado",
    titulo: "Spring Guides (oficial)",
    canal: "Spring",
    plataforma: "Spring",
    link: "https://spring.io/guides",
    areaSlug: "backend" as string | null,
    nivel: "Intermediário",
    duracao: "Guias práticos",
    idioma: "Inglês",
    descricao:
      "Guias oficiais e gratuitos do Spring para construir APIs e serviços em Java com Spring Boot.",
    motivoIndicacao:
      "Spring Boot domina o back-end Java corporativo no Brasil; estes guias são a fonte oficial.",
    oQueAprende: [
      "Spring Boot",
      "APIs REST",
      "Acesso a dados",
      "Segurança básica",
    ],
    proximoConteudo: "Projetos com banco e autenticação",
  },
  {
    id: "curso-nodejs-learn",
    certificate: "nao_informado",
    titulo: "Node.js Guides (oficial)",
    canal: "Node.js",
    plataforma: "Node.js",
    link: "https://nodejs.org/en/learn",
    areaSlug: "backend" as string | null,
    nivel: "Intermediário",
    duracao: "Trilha autoguiada",
    idioma: "Inglês",
    descricao:
      "Guias oficiais do Node.js sobre o runtime, módulos, assíncrono, streams e boas práticas de servidor.",
    motivoIndicacao:
      "Entender o Node por dentro evita armadilhas comuns ao construir back-ends JavaScript.",
    oQueAprende: ["Event loop", "Módulos", "Streams", "Assíncrono"],
    proximoConteudo: "APIs com Express e banco de dados",
  },
  {
    id: "curso-django-tutorial",
    certificate: "nao_informado",
    titulo: "Tutorial oficial do Django",
    canal: "Django Software Foundation",
    plataforma: "Django",
    link: "https://docs.djangoproject.com/en/stable/intro/tutorial01/",
    areaSlug: "backend" as string | null,
    nivel: "Intermediário",
    duracao: "~6 horas",
    idioma: "Inglês",
    descricao:
      "Tutorial oficial e gratuito que constrói uma aplicação web completa com Python e Django passo a passo.",
    motivoIndicacao:
      "Django é muito usado por quem vem de Python; o tutorial oficial é direto e confiável.",
    oQueAprende: ["Models e ORM", "Views e templates", "Admin", "Formulários"],
    proximoConteudo: "Django REST Framework para APIs",
  },
  {
    id: "curso-kaggle-pandas",
    certificate: "sim",
    titulo: "Pandas",
    canal: "Kaggle",
    plataforma: "Kaggle",
    link: "https://www.kaggle.com/learn/pandas",
    areaSlug: "dados" as string | null,
    nivel: "Intermediário",
    duracao: "~4 horas",
    idioma: "Inglês",
    descricao:
      "Microcurso prático de pandas para manipular, agrupar e limpar dados em notebooks no navegador.",
    motivoIndicacao:
      "pandas é a ferramenta central de quem trabalha com dados em Python.",
    oQueAprende: ["DataFrames", "Agrupamento", "Limpeza", "Junções"],
    proximoConteudo: "Data Cleaning e Feature Engineering no Kaggle",
  },
  {
    id: "curso-kaggle-dataviz",
    certificate: "sim",
    titulo: "Data Visualization",
    canal: "Kaggle",
    plataforma: "Kaggle",
    link: "https://www.kaggle.com/learn/data-visualization",
    areaSlug: "dados" as string | null,
    nivel: "Intermediário",
    duracao: "~4 horas",
    idioma: "Inglês",
    descricao:
      "Microcurso gratuito de visualização de dados com Seaborn, escolhendo o gráfico certo para cada pergunta.",
    motivoIndicacao:
      "Saber comunicar dados com gráficos claros é o que separa um bom analista.",
    oQueAprende: [
      "Seaborn",
      "Tipos de gráfico",
      "Storytelling",
      "Boas práticas",
    ],
    proximoConteudo: "Dashboards em Power BI ou Looker",
  },
  {
    id: "curso-kaggle-advanced-sql",
    certificate: "sim",
    titulo: "Advanced SQL",
    canal: "Kaggle",
    plataforma: "Kaggle",
    link: "https://www.kaggle.com/learn/advanced-sql",
    areaSlug: "dados" as string | null,
    nivel: "Avançado",
    duracao: "~4 horas",
    idioma: "Inglês",
    descricao:
      "Microcurso de SQL avançado com JOINs complexos, funções de janela e consultas analíticas em grandes bases.",
    motivoIndicacao:
      "SQL avançado é diferencial real em vagas de dados de nível pleno e sênior.",
    oQueAprende: [
      "JOINs avançados",
      "Window functions",
      "Subqueries",
      "Análise em BigQuery",
    ],
    proximoConteudo: "Modelagem de dados e dbt",
  },
  {
    id: "curso-powerbi-pl300",
    certificate: "nao_informado",
    titulo: "Análise de dados com Power BI (PL-300)",
    canal: "Microsoft",
    plataforma: "Microsoft Learn",
    link: "https://learn.microsoft.com/credentials/certifications/power-bi-data-analyst-associate/",
    areaSlug: "dados" as string | null,
    nivel: "Intermediário",
    duracao: "Trilha por módulos",
    idioma: "Português",
    descricao:
      "Trilha oficial e gratuita da Microsoft para modelar, transformar e visualizar dados no Power BI.",
    motivoIndicacao:
      "Power BI é o BI mais pedido no mercado brasileiro; esta trilha prepara para a certificação PL-300.",
    oQueAprende: ["Modelagem", "Power Query", "DAX", "Relatórios"],
    proximoConteudo: "Certificação PL-300",
  },
  {
    id: "curso-ml-specialization",
    certificate: "nao_informado",
    titulo: "Machine Learning Specialization",
    canal: "DeepLearning.AI / Andrew Ng",
    plataforma: "Coursera",
    link: "https://www.coursera.org/specializations/machine-learning-introduction",
    areaSlug: "ia" as string | null,
    nivel: "Intermediário",
    duracao: "~3 meses (ritmo leve)",
    idioma: "Inglês (legendas em português)",
    descricao:
      "Especialização de Andrew Ng sobre fundamentos de machine learning, com regressão, classificação e redes neurais.",
    motivoIndicacao:
      "O curso de ML mais recomendado do mundo para construir base sólida e aplicável.",
    oQueAprende: [
      "Regressão e classificação",
      "Redes neurais",
      "Boas práticas de ML",
      "scikit-learn",
    ],
    proximoConteudo: "Deep Learning Specialization",
  },
  {
    id: "curso-deep-learning-spec",
    certificate: "nao_informado",
    titulo: "Deep Learning Specialization",
    canal: "DeepLearning.AI",
    plataforma: "Coursera",
    link: "https://www.coursera.org/specializations/deep-learning",
    areaSlug: "ia" as string | null,
    nivel: "Avançado",
    duracao: "~4 meses",
    idioma: "Inglês (legendas em português)",
    descricao:
      "Especialização aprofundada em redes neurais, CNNs, sequência e projetos práticos de deep learning.",
    motivoIndicacao:
      "Próximo passo natural depois do ML para quem quer atuar com IA de verdade.",
    oQueAprende: [
      "Redes neurais profundas",
      "CNNs",
      "RNNs",
      "Projetos com TensorFlow",
    ],
    proximoConteudo: "Especializar em visão ou NLP",
  },
  {
    id: "curso-fastai",
    certificate: "nao_informado",
    titulo: "Practical Deep Learning for Coders",
    canal: "fast.ai",
    plataforma: "fast.ai",
    link: "https://course.fast.ai/",
    areaSlug: "ia" as string | null,
    nivel: "Avançado",
    duracao: "~7 semanas",
    idioma: "Inglês",
    descricao:
      "Curso gratuito e prático de deep learning de cima para baixo, treinando modelos de verdade desde a primeira aula.",
    motivoIndicacao:
      "Abordagem mão na massa famosa por formar gente que entrega projetos reais de IA.",
    oQueAprende: [
      "Treino de modelos",
      "Visão computacional",
      "NLP",
      "Boas práticas",
    ],
    proximoConteudo: "Competições no Kaggle",
  },
  {
    id: "curso-hf-nlp",
    certificate: "nao_informado",
    titulo: "Hugging Face LLM / NLP Course",
    canal: "Hugging Face",
    plataforma: "Hugging Face",
    link: "https://huggingface.co/learn/nlp-course",
    areaSlug: "ia" as string | null,
    nivel: "Avançado",
    duracao: "Trilha autoguiada",
    idioma: "Inglês",
    descricao:
      "Curso oficial e gratuito sobre Transformers, modelos de linguagem e o ecossistema Hugging Face.",
    motivoIndicacao:
      "Porta de entrada para trabalhar com LLMs e NLP moderno, área das mais aquecidas.",
    oQueAprende: [
      "Transformers",
      "Fine-tuning",
      "Tokenização",
      "Pipelines de NLP",
    ],
    proximoConteudo: "Projetos com LLMs e RAG",
  },
  {
    id: "curso-kaggle-deep-learning",
    certificate: "sim",
    titulo: "Intro to Deep Learning",
    canal: "Kaggle",
    plataforma: "Kaggle",
    link: "https://www.kaggle.com/learn/intro-to-deep-learning",
    areaSlug: "ia" as string | null,
    nivel: "Intermediário",
    duracao: "~4 horas",
    idioma: "Inglês",
    descricao:
      "Microcurso prático de redes neurais com Keras, do perceptron a modelos para imagens e tabelas.",
    motivoIndicacao:
      "Primeiro contato direto com deep learning sem precisar de máquina potente.",
    oQueAprende: ["Redes neurais", "Keras", "Overfitting", "Treino de modelos"],
    proximoConteudo: "Computer Vision no Kaggle",
  },
  {
    id: "curso-aws-saa",
    certificate: "nao_informado",
    titulo: "AWS Solutions Architect Associate",
    canal: "Amazon Web Services",
    plataforma: "AWS",
    link: "https://aws.amazon.com/certification/certified-solutions-architect-associate/",
    areaSlug: "cloud" as string | null,
    nivel: "Avançado",
    duracao: "Trilha por módulos",
    idioma: "Inglês (e português)",
    descricao:
      "Trilha de arquitetura na AWS: projetar soluções escaláveis, seguras e econômicas na nuvem.",
    motivoIndicacao:
      "Certificação SAA é uma das mais valorizadas de cloud no mercado.",
    oQueAprende: [
      "Arquitetura na AWS",
      "Alta disponibilidade",
      "Segurança",
      "Otimização de custos",
    ],
    proximoConteudo: "Certificação SAA-C03",
  },
  {
    id: "curso-gcp-skills-boost",
    certificate: "nao_informado",
    titulo: "Google Cloud Skills Boost",
    canal: "Google Cloud",
    plataforma: "Google Cloud Skills Boost",
    link: "https://www.cloudskillsboost.google/",
    areaSlug: "cloud" as string | null,
    nivel: "Intermediário",
    duracao: "Trilhas e labs",
    idioma: "Inglês",
    descricao:
      "Plataforma oficial do Google Cloud com trilhas e laboratórios práticos em ambiente real.",
    motivoIndicacao:
      "Pratica em consoles de verdade, ótimo para quem quer cloud além da teoria.",
    oQueAprende: [
      "Compute e storage",
      "Redes",
      "Kubernetes no GKE",
      "Labs práticos",
    ],
    proximoConteudo: "Certificações Associate do Google Cloud",
  },
  {
    id: "curso-k8s-basics",
    certificate: "nao_informado",
    titulo: "Kubernetes Basics (oficial)",
    canal: "Kubernetes",
    plataforma: "Kubernetes",
    link: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
    areaSlug: "devops" as string | null,
    nivel: "Intermediário",
    duracao: "~3 horas",
    idioma: "Inglês",
    descricao:
      "Tutorial interativo oficial para entender e operar um cluster Kubernetes do zero.",
    motivoIndicacao:
      "Kubernetes é padrão de orquestração; o tutorial oficial dá a base correta.",
    oQueAprende: [
      "Pods e Deployments",
      "Services",
      "Escalonamento",
      "Atualizações",
    ],
    proximoConteudo: "Helm e operação de clusters",
  },
  {
    id: "curso-docker-get-started",
    certificate: "nao_informado",
    titulo: "Docker Get Started (oficial)",
    canal: "Docker",
    plataforma: "Docker",
    link: "https://docs.docker.com/get-started/",
    areaSlug: "devops" as string | null,
    nivel: "Intermediário",
    duracao: "~4 horas",
    idioma: "Inglês",
    descricao:
      "Guia oficial e gratuito para empacotar aplicações em containers e orquestrar com Docker Compose.",
    motivoIndicacao:
      "Containers são base de DevOps moderno; comece pela fonte oficial.",
    oQueAprende: [
      "Imagens e containers",
      "Dockerfile",
      "Volumes",
      "Docker Compose",
    ],
    proximoConteudo: "Kubernetes para orquestração",
  },
  {
    id: "curso-terraform-tutorials",
    certificate: "nao_informado",
    titulo: "Terraform Tutorials (HashiCorp)",
    canal: "HashiCorp",
    plataforma: "HashiCorp Developer",
    link: "https://developer.hashicorp.com/terraform/tutorials",
    areaSlug: "devops" as string | null,
    nivel: "Avançado",
    duracao: "Trilhas práticas",
    idioma: "Inglês",
    descricao:
      "Tutoriais oficiais de infraestrutura como código com Terraform, provisionando recursos em nuvem.",
    motivoIndicacao:
      "IaC com Terraform é skill central de DevOps e SRE pleno e sênior.",
    oQueAprende: [
      "Infraestrutura como código",
      "Providers",
      "State",
      "Módulos",
    ],
    proximoConteudo: "Pipelines de IaC em produção",
  },
  {
    id: "curso-portswigger",
    certificate: "nao_informado",
    titulo: "Web Security Academy",
    canal: "PortSwigger",
    plataforma: "PortSwigger",
    link: "https://portswigger.net/web-security",
    areaSlug: "ciberseguranca" as string | null,
    nivel: "Avançado",
    duracao: "Trilha autoguiada",
    idioma: "Inglês",
    descricao:
      "Laboratórios gratuitos e aprofundados de segurança web, dos criadores do Burp Suite.",
    motivoIndicacao:
      "Referência para aprender a explorar e corrigir vulnerabilidades web de verdade.",
    oQueAprende: ["OWASP Top 10", "SQL injection", "XSS", "Autenticação"],
    proximoConteudo: "Certificações ofensivas e bug bounty",
  },
  {
    id: "curso-tryhackme",
    certificate: "nao_informado",
    titulo: "TryHackMe",
    canal: "TryHackMe",
    plataforma: "TryHackMe",
    link: "https://tryhackme.com/",
    areaSlug: "ciberseguranca" as string | null,
    nivel: "Intermediário",
    duracao: "Trilhas guiadas",
    idioma: "Inglês",
    descricao:
      "Plataforma com laboratórios guiados de segurança ofensiva e defensiva em ambientes prontos no navegador.",
    motivoIndicacao:
      "Aprende cibersegurança praticando em máquinas reais, com trilhas para iniciantes a avançados.",
    oQueAprende: ["Redes e Linux", "Pentest", "Análise de máquinas", "Defesa"],
    proximoConteudo: "Caminhos de Red Team ou Blue Team",
  },
  {
    id: "curso-htb-academy",
    certificate: "nao_informado",
    titulo: "Hack The Box Academy",
    canal: "Hack The Box",
    plataforma: "HTB Academy",
    link: "https://academy.hackthebox.com/",
    areaSlug: "ciberseguranca" as string | null,
    nivel: "Avançado",
    duracao: "Trilhas por módulos",
    idioma: "Inglês",
    descricao:
      "Trilhas práticas e aprofundadas de pentest e segurança ofensiva com laboratórios reais.",
    motivoIndicacao:
      "Conteúdo robusto para quem mira carreira de pentester ou Red Team.",
    oQueAprende: [
      "Enumeração",
      "Exploração",
      "Escalonamento de privilégios",
      "Relatórios",
    ],
    proximoConteudo: "Certificações como CPTS",
  },
  {
    id: "curso-test-automation-u",
    certificate: "nao_informado",
    titulo: "Test Automation University",
    canal: "Applitools",
    plataforma: "Test Automation University",
    link: "https://testautomationu.applitools.com/",
    areaSlug: "qa" as string | null,
    nivel: "Intermediário",
    duracao: "Vários cursos",
    idioma: "Inglês",
    descricao:
      "Escola gratuita com dezenas de cursos de automação de testes em várias linguagens e ferramentas.",
    motivoIndicacao:
      "Maior acervo gratuito de automação de testes, com trilhas por ferramenta e linguagem.",
    oQueAprende: [
      "Cypress e Playwright",
      "Selenium",
      "API testing",
      "Boas práticas",
    ],
    proximoConteudo: "Montar um framework de testes",
  },
  {
    id: "curso-cypress-learn",
    certificate: "nao_informado",
    titulo: "Real World Testing com Cypress",
    canal: "Cypress",
    plataforma: "Cypress",
    link: "https://learn.cypress.io/",
    areaSlug: "qa" as string | null,
    nivel: "Intermediário",
    duracao: "Trilha autoguiada",
    idioma: "Inglês",
    descricao:
      "Curso oficial e gratuito do Cypress para escrever testes end to end confiáveis em aplicações reais.",
    motivoIndicacao:
      "Cypress é uma das ferramentas de automação mais pedidas em vagas de QA.",
    oQueAprende: ["Testes E2E", "Boas práticas", "Mocks de rede", "CI"],
    proximoConteudo: "Integração de testes em pipelines",
  },
  {
    id: "curso-100-swiftui",
    certificate: "nao_informado",
    titulo: "100 Days of SwiftUI",
    canal: "Hacking with Swift",
    plataforma: "Hacking with Swift",
    link: "https://www.hackingwithswift.com/100/swiftui",
    areaSlug: "mobile" as string | null,
    nivel: "Intermediário",
    duracao: "100 dias",
    idioma: "Inglês",
    descricao:
      "Trilha gratuita e estruturada para aprender Swift e SwiftUI construindo apps iOS dia após dia.",
    motivoIndicacao:
      "Referência para desenvolvimento iOS nativo, com ritmo claro e muita prática.",
    oQueAprende: ["Swift", "SwiftUI", "Apps iOS", "Projetos diários"],
    proximoConteudo: "Publicar um app na App Store",
  },
  {
    id: "curso-react-native-docs",
    certificate: "nao_informado",
    titulo: "React Native (documentação oficial)",
    canal: "Meta",
    plataforma: "React Native",
    link: "https://reactnative.dev/docs/getting-started",
    areaSlug: "mobile" as string | null,
    nivel: "Intermediário",
    duracao: "Trilha autoguiada",
    idioma: "Inglês",
    descricao:
      "Documentação oficial para construir apps móveis multiplataforma com React Native e JavaScript.",
    motivoIndicacao:
      "Aproveita o conhecimento de React para entregar apps Android e iOS com uma base de código.",
    oQueAprende: ["Componentes nativos", "Navegação", "Estado", "Build mobile"],
    proximoConteudo: "Expo e publicação nas lojas",
  },
  {
    id: "curso-calarts-uiux",
    certificate: "nao_informado",
    titulo: "UI / UX Design Specialization",
    canal: "CalArts",
    plataforma: "Coursera",
    link: "https://www.coursera.org/specializations/ui-ux-design",
    areaSlug: "uxui" as string | null,
    nivel: "Intermediário",
    duracao: "~3 meses",
    idioma: "Inglês (legendas em português)",
    descricao:
      "Especialização da CalArts sobre processo de design de interfaces, do briefing ao protótipo de alta fidelidade.",
    motivoIndicacao:
      "Aprofunda o lado visual e de processo do design, complementando trilhas focadas em pesquisa.",
    oQueAprende: [
      "Processo de design",
      "Wireframes",
      "Protótipos",
      "Avaliação de UI",
    ],
    proximoConteudo: "Montar um portfólio de UI",
  },
  {
    id: "curso-scrum-open",
    certificate: "nao_informado",
    titulo: "Scrum Open Assessments",
    canal: "Scrum.org",
    plataforma: "Scrum.org",
    link: "https://www.scrum.org/open-assessments",
    areaSlug: "gestao" as string | null,
    nivel: "Intermediário",
    duracao: "Autoavaliações",
    idioma: "Inglês",
    descricao:
      "Avaliações abertas e gratuitas do Scrum.org para testar e firmar seu conhecimento de Scrum e agilidade.",
    motivoIndicacao:
      "Ótimo preparo gratuito para certificações ágeis muito pedidas em gestão e produto.",
    oQueAprende: ["Scrum", "Papéis e eventos", "Artefatos", "Agilidade"],
    proximoConteudo: "Certificação PSM I",
  },
  {
    id: "curso-uva-product",
    certificate: "nao_informado",
    titulo: "Digital Product Management",
    canal: "University of Virginia",
    plataforma: "Coursera",
    link: "https://www.coursera.org/specializations/uva-darden-digital-product-management",
    areaSlug: "produto" as string | null,
    nivel: "Intermediário",
    duracao: "~5 meses",
    idioma: "Inglês (legendas em português)",
    descricao:
      "Especialização sobre o ciclo de vida de produtos digitais, do discovery às métricas e experimentos.",
    motivoIndicacao:
      "Visão estruturada de gestão de produto para quem quer migrar para Product Management.",
    oQueAprende: ["Discovery", "Métricas", "Experimentos", "Roadmap"],
    proximoConteudo: "Projetos e cases de produto",
  },
  {
    id: "curso-fcc-javascript-algorithms",
    certificate: "sim",
    titulo: "JavaScript Algorithms and Data Structures Certification",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp",
    link: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/",
    areaSlug: "frontend",
    nivel: "Iniciante",
    duracao: "300 horas",
    idioma: "Inglês",
    descricao: "Curso que constroi a base de logica de programacao usando JavaScript, do basico ate estruturas de dados e algoritmos. Voce aprende programando projetos do inicio ao fim.",
    motivoIndicacao: "JavaScript e a linguagem da web, e aqui voce aprende ela com fundamentos solidos de logica e algoritmos.",
    oQueAprende: ["variaveis, arrays e objetos", "funcoes e programacao funcional", "programacao orientada a objetos"],
    proximoConteudo: "Front End Development Libraries (React)",
    tipo: "Gratuito",
  },
  {
    id: "curso-fcc-machine-learning-python",
    certificate: "sim",
    titulo: "Machine Learning with Python Certification",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp",
    link: "https://www.freecodecamp.org/learn/machine-learning-with-python/",
    areaSlug: "ia",
    nivel: "Avançado",
    duracao: "300 horas",
    idioma: "Inglês",
    descricao: "Certificacao que introduz aprendizado de maquina e redes neurais usando Python e TensorFlow. Os projetos envolvem criar modelos preditivos do zero.",
    motivoIndicacao: "Da uma base solida e gratuita em machine learning, uma das areas mais quentes da tecnologia.",
    oQueAprende: ["TensorFlow e redes neurais", "processamento de linguagem natural", "aprendizado por reforco"],
    proximoConteudo: "CS50 AI with Python",
    tipo: "Gratuito",
  },
  {
    id: "curso-fcc-quality-assurance",
    certificate: "sim",
    titulo: "Quality Assurance Certification",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp",
    link: "https://www.freecodecamp.org/learn/quality-assurance/",
    areaSlug: "qa",
    nivel: "Intermediário",
    duracao: "300 horas",
    idioma: "Inglês",
    descricao: "Certificacao focada em testes automatizados e garantia de qualidade de software com JavaScript. Voce aprende a escrever testes e validar aplicacoes.",
    motivoIndicacao: "Uma das poucas trilhas gratuitas dedicadas a QA, area com boa demanda e menos concorrencia.",
    oQueAprende: ["testes com Chai", "autenticacao com Passport", "comunicacao em tempo real com Socket.io"],
    proximoConteudo: "Back End Development and APIs",
    tipo: "Gratuito",
  },
  {
    id: "curso-codecademy-learn-python-3",
    certificate: "nao_informado",
    titulo: "Learn Python 3",
    canal: "Codecademy",
    plataforma: "Codecademy",
    link: "https://www.codecademy.com/learn/learn-python-3",
    areaSlug: "backend",
    nivel: "Iniciante",
    duracao: "24 horas",
    idioma: "Inglês",
    descricao: "Curso interativo que ensina Python 3 do zero, com exercicios escritos diretamente no navegador. Inclui projetos praticos e questionarios ao longo do caminho.",
    motivoIndicacao: "Python e uma das linguagens mais faceis para iniciantes, e o formato interativo acelera o aprendizado.",
    oQueAprende: ["sintaxe e tipos de Python", "controle de fluxo e loops", "funcoes e estruturas de dados"],
    proximoConteudo: "Learn SQL ou Data Analysis with Python",
    tipo: "Gratuito",
  },
  {
    id: "curso-codecademy-learn-html",
    certificate: "nao_informado",
    titulo: "Learn HTML",
    canal: "Codecademy",
    plataforma: "Codecademy",
    link: "https://www.codecademy.com/learn/learn-html",
    areaSlug: "frontend",
    nivel: "Iniciante",
    duracao: "7 horas",
    idioma: "Inglês",
    descricao: "Curso introdutorio sobre HTML, a estrutura de toda pagina web. Voce constroi paginas reais como um blog enquanto aprende.",
    motivoIndicacao: "E o primeiro passo absoluto de quem nunca tocou em codigo e quer entrar no mundo web.",
    oQueAprende: ["elementos e estrutura HTML", "tabelas e formularios", "HTML semantico e acessibilidade"],
    proximoConteudo: "Curso de CSS ou Responsive Web Design",
    tipo: "Gratuito",
  },
  {
    id: "curso-codecademy-learn-sql",
    certificate: "nao_informado",
    titulo: "Learn SQL",
    canal: "Codecademy",
    plataforma: "Codecademy",
    link: "https://www.codecademy.com/learn/learn-sql",
    areaSlug: "dados",
    nivel: "Iniciante",
    duracao: "5 horas",
    idioma: "Inglês",
    descricao: "Curso pratico de SQL para consultar e manipular bancos de dados. Os exercicios usam conjuntos de dados reais para fixar os conceitos.",
    motivoIndicacao: "SQL e habilidade obrigatoria para quem trabalha com dados, e este curso vai direto ao ponto.",
    oQueAprende: ["consultas e filtros SQL", "funcoes de agregacao", "relacionamento entre tabelas"],
    proximoConteudo: "Data Analysis with Python",
    tipo: "Gratuito",
  },
  {
    id: "curso-codecademy-learn-git-github",
    certificate: "nao_informado",
    titulo: "Learn Git & GitHub",
    canal: "Codecademy",
    plataforma: "Codecademy",
    link: "https://www.codecademy.com/learn/learn-git",
    areaSlug: "devops",
    nivel: "Iniciante",
    duracao: "4 horas",
    idioma: "Inglês",
    descricao: "Curso feito em parceria com o GitHub que ensina controle de versao na pratica. Voce aprende fluxos de trabalho usados em times reais.",
    motivoIndicacao: "Git e GitHub sao usados em praticamente toda equipe de tecnologia, entao isso e indispensavel.",
    oQueAprende: ["fundamentos de Git", "branches e colaboracao", "fluxos de trabalho no GitHub"],
    proximoConteudo: "Learn the Command Line",
    tipo: "Gratuito",
  },
  {
    id: "curso-codecademy-learn-command-line",
    certificate: "nao_informado",
    titulo: "Learn the Command Line",
    canal: "Codecademy",
    plataforma: "Codecademy",
    link: "https://www.codecademy.com/learn/learn-the-command-line",
    areaSlug: "devops",
    nivel: "Iniciante",
    duracao: "4 horas",
    idioma: "Inglês",
    descricao: "Curso que ensina a usar a linha de comando para navegar e manipular arquivos. Habilidade base para devops, back-end e qualquer trabalho com servidores.",
    motivoIndicacao: "Saber o terminal destrava ferramentas profissionais e e pre-requisito de muitas trilhas tecnicas.",
    oQueAprende: ["navegacao no sistema de arquivos", "redirecionamento de entrada e saida", "configuracao do ambiente"],
    proximoConteudo: "Learn Git & GitHub",
    tipo: "Gratuito",
  },
  {
    id: "curso-codecademy-intro-cybersecurity",
    certificate: "nao_informado",
    titulo: "Introduction to Cybersecurity",
    canal: "Codecademy",
    plataforma: "Codecademy",
    link: "https://www.codecademy.com/learn/intro-to-cybersecurity",
    areaSlug: "ciberseguranca",
    nivel: "Iniciante",
    duracao: "3 horas",
    idioma: "Inglês",
    descricao: "Curso introdutorio que apresenta os conceitos fundamentais de ciberseguranca. Cobre tipos de ameacas, criptografia e protecao de dispositivos.",
    motivoIndicacao: "Uma porta de entrada rapida e acessivel para quem quer descobrir a area de seguranca.",
    oQueAprende: ["tipos de ameacas e malware", "criptografia e autenticacao", "seguranca de redes"],
    proximoConteudo: "Information Security (freeCodeCamp)",
    tipo: "Gratuito",
  },
  {
    id: "curso-coursera-google-project-management",
    certificate: "sim",
    titulo: "Google Project Management Professional Certificate",
    canal: "Google",
    plataforma: "Coursera",
    link: "https://www.coursera.org/professional-certificates/google-project-management",
    areaSlug: "gestao",
    nivel: "Iniciante",
    duracao: "6 meses",
    idioma: "Inglês",
    descricao: "Certificado profissional do Google sobre gestao de projetos tradicional e agil. Ensina a planejar, executar e acompanhar projetos do comeco ao fim.",
    motivoIndicacao: "Conta horas validas para certificacoes do PMI e abre portas para vagas de gestao de projetos.",
    oQueAprende: ["ciclo de vida de projetos", "metodologias Agil e Scrum", "gestao de riscos e prazos"],
    proximoConteudo: "Estudar para a certificacao CAPM do PMI",
    tipo: "Pago",
  },
  {
    id: "curso-coursera-google-cybersecurity",
    certificate: "sim",
    titulo: "Google Cybersecurity Professional Certificate",
    canal: "Google",
    plataforma: "Coursera",
    link: "https://www.coursera.org/professional-certificates/google-cybersecurity",
    areaSlug: "ciberseguranca",
    nivel: "Iniciante",
    duracao: "6 meses",
    idioma: "Inglês",
    descricao: "Certificado profissional do Google que prepara para vagas iniciais em seguranca. Cobre desde fundamentos ate ferramentas SIEM e resposta a incidentes.",
    motivoIndicacao: "Prepara para o primeiro emprego em seguranca e ainda ajuda na certificacao CompTIA Security+.",
    oQueAprende: ["seguranca de redes e Linux", "Python e SQL aplicados a seguranca", "deteccao de ameacas e ferramentas SIEM"],
    proximoConteudo: "Estudar para a certificacao CompTIA Security+",
    tipo: "Pago",
  },
  {
    id: "curso-coursera-meta-front-end-developer",
    certificate: "sim",
    titulo: "Meta Front-End Developer Professional Certificate",
    canal: "Meta",
    plataforma: "Coursera",
    link: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
    areaSlug: "frontend",
    nivel: "Iniciante",
    duracao: "7 meses",
    idioma: "Inglês",
    descricao: "Certificado profissional da Meta que ensina desenvolvimento front-end do basico ao React. Termina com um projeto de portfolio para entrevistas.",
    motivoIndicacao: "Ensina React, a biblioteca criada pela propria Meta e muito pedida em vagas de front-end.",
    oQueAprende: ["HTML, CSS e JavaScript", "React e Bootstrap", "Git e preparo para entrevistas"],
    proximoConteudo: "Aprofundar em React e construir projetos proprios",
    tipo: "Pago",
  },
  {
    id: "curso-coursera-python-for-everybody",
    certificate: "sim",
    titulo: "Programming for Everybody (Getting Started with Python)",
    canal: "University of Michigan",
    plataforma: "Coursera",
    link: "https://www.coursera.org/learn/python",
    areaSlug: "backend",
    nivel: "Iniciante",
    duracao: "2 semanas",
    idioma: "Inglês",
    descricao: "Curso introdutorio de programacao em Python da Universidade de Michigan, ministrado pelo professor Charles Severance. Ideal para quem nunca programou.",
    motivoIndicacao: "Um dos cursos de Python para iniciantes mais populares do mundo, didatico e gratuito para assistir.",
    oQueAprende: ["instalar Python e escrever o primeiro programa", "variaveis e calculos", "funcoes e loops"],
    proximoConteudo: "Continuar a especializacao Python for Everybody",
    tipo: "Gratuito",
  },
  {
    id: "curso-coursera-aws-cloud-essentials",
    certificate: "sim",
    titulo: "AWS Cloud Technical Essentials",
    canal: "Amazon Web Services",
    plataforma: "Coursera",
    link: "https://www.coursera.org/learn/aws-cloud-technical-essentials",
    areaSlug: "cloud",
    nivel: "Iniciante",
    duracao: "2 semanas",
    idioma: "Inglês",
    descricao: "Curso oficial da AWS que apresenta os fundamentos de computacao em nuvem. Cobre os principais servicos de computacao, armazenamento e banco de dados.",
    motivoIndicacao: "AWS lidera o mercado de nuvem, e este curso oficial e uma otima introducao gratuita para assistir.",
    oQueAprende: ["seguranca e IAM na AWS", "computo com EC2 e Lambda", "armazenamento S3 e bancos de dados"],
    proximoConteudo: "Estudar para a certificacao AWS Cloud Practitioner",
    tipo: "Pago",
  },
  {
    id: "curso-edx-cs50x",
    certificate: "sim",
    titulo: "CS50's Introduction to Computer Science",
    canal: "Harvard University",
    plataforma: "edX",
    link: "https://www.edx.org/learn/computer-science/harvard-university-cs50-s-introduction-to-computer-science",
    areaSlug: "fullstack",
    nivel: "Iniciante",
    duracao: "11 semanas",
    idioma: "Inglês",
    descricao: "O famoso curso introdutorio de ciencia da computacao de Harvard. Apresenta logica, algoritmos e varias linguagens, do C ao Python e SQL.",
    motivoIndicacao: "Considerado um dos melhores cursos de introducao a programacao do mundo, e totalmente gratuito para assistir.",
    oQueAprende: ["fundamentos de algoritmos", "programacao em C, Python e SQL", "desenvolvimento web basico"],
    proximoConteudo: "CS50 Web Programming with Python and JavaScript",
    tipo: "Gratuito",
  },
  {
    id: "curso-edx-cs50-web",
    certificate: "sim",
    titulo: "CS50's Web Programming with Python and JavaScript",
    canal: "Harvard University",
    plataforma: "edX",
    link: "https://www.edx.org/learn/web-development/harvard-university-cs50-s-web-programming-with-python-and-javascript",
    areaSlug: "fullstack",
    nivel: "Intermediário",
    duracao: "12 semanas",
    idioma: "Inglês",
    descricao: "Continuacao do CS50 voltada para desenvolvimento web fullstack. Voce constroi aplicacoes completas com Python, JavaScript e bancos de dados.",
    motivoIndicacao: "Aprofunda em desenvolvimento web com Django e React, ideal para quem quer virar fullstack.",
    oQueAprende: ["Python e Django", "JavaScript e React", "bancos de dados e APIs"],
    proximoConteudo: "Construir projetos fullstack proprios",
    tipo: "Gratuito",
  },
  {
    id: "curso-edx-cs50-ai",
    certificate: "sim",
    titulo: "CS50's Introduction to Artificial Intelligence with Python",
    canal: "Harvard University",
    plataforma: "edX",
    link: "https://www.edx.org/learn/artificial-intelligence/harvard-university-cs50-s-introduction-to-artificial-intelligence-with-python",
    areaSlug: "ia",
    nivel: "Intermediário",
    duracao: "7 semanas",
    idioma: "Inglês",
    descricao: "Curso de Harvard que introduz os conceitos por tras da inteligencia artificial usando Python. Aborda busca, aprendizado de maquina e redes neurais.",
    motivoIndicacao: "Da uma base teorica e pratica solida em IA com a qualidade de ensino de Harvard.",
    oQueAprende: ["algoritmos de busca", "aprendizado de maquina", "redes neurais e processamento de linguagem"],
    proximoConteudo: "Machine Learning with Python (freeCodeCamp)",
    tipo: "Gratuito",
  },
  {
    id: "curso-khan-intro-python",
    certificate: "nao",
    titulo: "Intro to Computer Science - Python",
    canal: "Khan Academy",
    plataforma: "Khan Academy",
    link: "https://www.khanacademy.org/computing/intro-to-python-fundamentals",
    areaSlug: "backend",
    nivel: "Iniciante",
    duracao: "8 semanas",
    idioma: "Inglês",
    descricao: "Curso gratuito da Khan Academy que ensina os fundamentos de programacao em Python. Usa projetos como simulacoes e jogos para aplicar os conceitos.",
    motivoIndicacao: "Aprendizado totalmente gratuito e guiado, perfeito para quem esta dando os primeiros passos em programacao.",
    oQueAprende: ["variaveis e logica", "simulacoes e ciencia de dados", "design de jogos com Python"],
    proximoConteudo: "Learn Python 3 (Codecademy) ou Python for Everybody",
    tipo: "Gratuito",
  },
  {
    id: "curso-machine-learning-programacao-dinamica",
    certificate: "nao_informado",
    titulo: "Curso de Machine Learning",
    canal: "Programação Dinâmica",
    plataforma: "YouTube",
    link: "https://www.youtube.com/playlist?list=PLFE-LjWAAP9QEC8KhIBWxM_tquU8UmuYW",
    areaSlug: "ia",
    nivel: "Intermediário",
    duracao: "Curso completo",
    idioma: "Português",
    descricao: "Curso de machine learning com aulas práticas em Python apresentado pelo canal Programação Dinâmica. Explica os principais algoritmos de aprendizado de máquina.",
    motivoIndicacao: "Traz conteúdo de qualidade sobre aprendizado de máquina em português, ponte entre dados e IA.",
    oQueAprende: ["Conceitos de machine learning", "Regressão e classificação", "Prática com Python"],
    proximoConteudo: "Estudar deep learning e projetos aplicados de ciência de dados.",
    tipo: "Gratuito",
  },
  {
    id: "curso-flutter-completo-flutterando",
    certificate: "nao_informado",
    titulo: "Curso COMPLETO de Flutter",
    canal: "Flutterando (Jacob Moura)",
    plataforma: "YouTube",
    link: "https://www.youtube.com/playlist?list=PLlBnICoI-g-d-J57QIz6Tx5xtUDGQdBFB",
    areaSlug: "mobile",
    nivel: "Iniciante",
    duracao: "50+ aulas",
    idioma: "Português",
    descricao: "Curso completo de Flutter e Dart para desenvolvimento de aplicativos mobile. Vai da configuração do ambiente até a construção de apps para Android e iOS.",
    motivoIndicacao: "Flutter permite criar apps para várias plataformas com um só código, e este curso é uma referência em português.",
    oQueAprende: ["Fundamentos de Dart", "Estrutura de projetos Flutter", "Construção de interfaces mobile"],
    proximoConteudo: "Aprender gerenciamento de estado e integração com APIs.",
    tipo: "Gratuito",
  },
  {
    id: "curso-programador-br-igor-oliveira",
    certificate: "nao_informado",
    titulo: "Curso Programador BR",
    canal: "Programador BR (Igor Oliveira)",
    plataforma: "YouTube",
    link: "https://www.youtube.com/playlist?list=PL28oj364o69pqPpb4ow6sYDOXbk17n5Sa",
    areaSlug: "backend",
    nivel: "Iniciante",
    duracao: "Curso completo",
    idioma: "Português",
    descricao: "Curso do canal Programador BR voltado para quem está começando na programação e na carreira de desenvolvedor. Mistura fundamentos técnicos com orientação de carreira.",
    motivoIndicacao: "Une lógica de programação e dicas reais de carreira, útil para quem quer entrar na área de tecnologia.",
    oQueAprende: ["Fundamentos de programação", "Orientação de carreira", "Primeiros passos como dev"],
    proximoConteudo: "Aprofundar em uma linguagem específica e montar um portfólio.",
    tipo: "Gratuito",
  },
  {
    id: "curso-cev-algoritmos-logica",
    certificate: "sim",
    titulo: "Algoritmos e Lógica de Programação",
    canal: "Gustavo Guanabara",
    plataforma: "Curso em Vídeo",
    link: "https://www.cursoemvideo.com/curso/curso-de-algoritmo/",
    areaSlug: "backend",
    nivel: "Iniciante",
    duracao: "40 horas",
    idioma: "Português",
    descricao: "Curso base que ensina o raciocínio de programação antes de qualquer linguagem, usando Scratch para fixar a lógica de forma visual. Ideal para quem nunca programou e quer construir uma fundação sólida.",
    motivoIndicacao: "É o ponto de partida perfeito para iniciantes, pois separa a lógica da sintaxe e prepara o aluno para qualquer linguagem depois.",
    oQueAprende: ["Lógica de programação e algoritmos", "Estruturas condicionais e de repetição", "Vetores, matrizes e funções"],
    proximoConteudo: "Escolher uma linguagem como Python ou JavaScript para aplicar a lógica aprendida.",
    tipo: "Gratuito",
  },
  {
    id: "curso-cev-python-mundo-1",
    certificate: "sim",
    titulo: "Python 3 - Mundo 1",
    canal: "Gustavo Guanabara",
    plataforma: "Curso em Vídeo",
    link: "https://www.cursoemvideo.com/curso/python-3-mundo-1/",
    areaSlug: "backend",
    nivel: "Iniciante",
    duracao: "40 horas",
    idioma: "Português",
    descricao: "Primeira etapa da famosa série de Python do Curso em Vídeo, que parte do zero absoluto e cobre instalação, variáveis e os primeiros programas. Tem uma didática leve e cheia de exercícios práticos.",
    motivoIndicacao: "É uma das introduções a Python mais queridas do Brasil, com explicações simples e muita prática para fixar o conteúdo.",
    oQueAprende: ["Instalação e configuração do Python", "Tipos de dados e operadores", "Condicionais e manipulação de texto"],
    proximoConteudo: "Seguir para o Python 3 Mundo 2, com estruturas de repetição.",
    tipo: "Gratuito",
  },
  {
    id: "curso-cev-html5-css3-modulo1",
    certificate: "sim",
    titulo: "HTML5 e CSS3: Módulo 1",
    canal: "Gustavo Guanabara",
    plataforma: "Curso em Vídeo",
    link: "https://www.cursoemvideo.com/curso/html5-css3-modulo1/",
    areaSlug: "frontend",
    nivel: "Iniciante",
    duracao: "40 horas",
    idioma: "Português",
    descricao: "Primeiro módulo da série de desenvolvimento web, explicando como a internet funciona e os fundamentos de HTML5 e CSS3. Cobre desde semântica até inserção de imagens, áudio e vídeo.",
    motivoIndicacao: "Dá uma base completa de front-end começando do zero, com projeto prático e materiais de apoio em PDF.",
    oQueAprende: ["Estrutura semântica do HTML5", "Formatação de texto e mídia", "Introdução aos estilos com CSS3"],
    proximoConteudo: "Avançar para os módulos seguintes de HTML5 e CSS3 e depois JavaScript.",
    tipo: "Gratuito",
  },
  {
    id: "curso-cev-javascript",
    certificate: "sim",
    titulo: "JavaScript",
    canal: "Gustavo Guanabara",
    plataforma: "Curso em Vídeo",
    link: "https://www.cursoemvideo.com/curso/javascript/",
    areaSlug: "frontend",
    nivel: "Iniciante",
    duracao: "40 horas",
    idioma: "Português",
    descricao: "Curso que ensina JavaScript do zero, da sintaxe básica à manipulação do DOM e eventos. Avança até arrays e funções, sempre com exercícios e desafios práticos.",
    motivoIndicacao: "Complementa a base de HTML e CSS adicionando interatividade, essencial para qualquer pessoa de front-end.",
    oQueAprende: ["Variáveis, tipos e operadores", "Manipulação do DOM e eventos", "Arrays e funções em JavaScript"],
    proximoConteudo: "Estudar um framework como React ou aprofundar em JavaScript moderno (ES6+).",
    tipo: "Gratuito",
  },
  {
    id: "curso-cev-mysql",
    certificate: "sim",
    titulo: "MySQL",
    canal: "Gustavo Guanabara",
    plataforma: "Curso em Vídeo",
    link: "https://www.cursoemvideo.com/curso/mysql/",
    areaSlug: "dados",
    nivel: "Iniciante",
    duracao: "40 horas",
    idioma: "Português",
    descricao: "Curso de banco de dados relacional com MySQL, do conceito de tabelas às consultas com JOIN. Explica cada conceito de forma simples para quem está começando com dados.",
    motivoIndicacao: "Ensina os fundamentos de banco de dados de forma acessível, habilidade que serve para back-end e dados.",
    oQueAprende: ["Criação e modelagem de tabelas", "Comandos INSERT, UPDATE e DELETE", "Consultas SELECT e JOIN"],
    proximoConteudo: "Praticar consultas mais avançadas e estudar modelagem de dados.",
    tipo: "Gratuito",
  },
  {
    id: "curso-cev-git-github",
    certificate: "sim",
    titulo: "Git e GitHub",
    canal: "Gustavo Guanabara",
    plataforma: "Curso em Vídeo",
    link: "https://www.cursoemvideo.com/curso/curso-de-git-e-github/",
    areaSlug: "devops",
    nivel: "Iniciante",
    duracao: "20 horas",
    idioma: "Português",
    descricao: "Curso voltado a iniciantes que ensina controle de versão com Git e colaboração no GitHub. Cobre desde criação de repositórios até branches e publicação com GitHub Pages.",
    motivoIndicacao: "Versionamento é obrigatório no mercado, e este curso ensina a usar Git e GitHub de forma prática e organizada.",
    oQueAprende: ["Conceitos de controle de versão", "Repositórios, commits e branches", "Publicação com GitHub Pages"],
    proximoConteudo: "Aprender fluxos de trabalho em equipe e pull requests no dia a dia.",
    tipo: "Gratuito",
  },
  {
    id: "curso-cev-linux",
    certificate: "sim",
    titulo: "Linux",
    canal: "Gustavo Guanabara",
    plataforma: "Curso em Vídeo",
    link: "https://www.cursoemvideo.com/curso/linux/",
    areaSlug: "devops",
    nivel: "Iniciante",
    duracao: "40 horas",
    idioma: "Português",
    descricao: "Curso introdutório ao Linux que vai da instalação do sistema até os comandos essenciais de terminal. Usa o Linux Mint e exemplos práticos para quem está começando.",
    motivoIndicacao: "Saber Linux e terminal abre portas em infraestrutura, DevOps e desenvolvimento em geral.",
    oQueAprende: ["Conceitos e história do Linux", "Instalação e ambiente do sistema", "Comandos de terminal e arquivos"],
    proximoConteudo: "Aprofundar em scripts shell e administração de servidores.",
    tipo: "Gratuito",
  },
  {
    id: "curso-cev-seguranca-informacao-m0",
    certificate: "sim",
    titulo: "Segurança da Informação: Módulo 00",
    canal: "Gustavo Guanabara",
    plataforma: "Curso em Vídeo",
    link: "https://www.cursoemvideo.com/curso/seguranca-da-informacao-modulo-00/",
    areaSlug: "ciberseguranca",
    nivel: "Iniciante",
    duracao: "20 horas",
    idioma: "Português",
    descricao: "Módulo inicial sobre segurança da informação, apresentando os pilares de confidencialidade, integridade e disponibilidade. Aborda boas práticas de senhas, proteção de dispositivos e prevenção de fraudes.",
    motivoIndicacao: "Uma porta de entrada acessível para cibersegurança, com foco em hábitos seguros que todo profissional de tech deveria ter.",
    oQueAprende: ["Pilares da segurança da informação", "Boas práticas de senhas", "Prevenção de fraudes digitais"],
    proximoConteudo: "Continuar nos módulos seguintes da série de Segurança da Informação.",
    tipo: "Gratuito",
  },
  {
    id: "curso-cev-inteligencia-artificial",
    certificate: "sim",
    titulo: "Inteligência Artificial: Módulo 01",
    canal: "Gustavo Guanabara",
    plataforma: "Curso em Vídeo",
    link: "https://www.cursoemvideo.com/curso/curso-gratis-de-inteligencia-artificial/",
    areaSlug: "ia",
    nivel: "Iniciante",
    duracao: "40 horas",
    idioma: "Português",
    descricao: "Curso prático de inteligência artificial que parte dos fundamentos e história até o uso de ferramentas como ChatGPT e geração de imagens. Não exige matemática avançada, focando em aplicação real.",
    motivoIndicacao: "Apresenta IA de forma prática e atual, ótimo para quem quer entender e usar essas ferramentas no dia a dia.",
    oQueAprende: ["Fundamentos de IA e machine learning", "Engenharia de prompt", "Aplicações com ChatGPT e geração de imagens"],
    proximoConteudo: "Seguir para o Módulo 02 e estudar Python aplicado a dados e IA.",
    tipo: "Gratuito",
  },
  {
    id: "curso-dio-introducao-python",
    certificate: "sim",
    titulo: "Introdução à Programação com Python",
    canal: "Rafael Galleani",
    plataforma: "DIO",
    link: "https://www.dio.me/courses/introducao-a-programacao-com-python",
    areaSlug: "backend",
    nivel: "Iniciante",
    duracao: "5 horas",
    idioma: "Português",
    descricao: "Curso da DIO que apresenta a linguagem Python de forma prática, cobrindo desde variáveis e condicionais até classes e manipulação de arquivos. Foca em construir base com projetos.",
    motivoIndicacao: "Boa introdução a Python com certificado de referência da DIO, plataforma reconhecida no mercado tech.",
    oQueAprende: ["Variáveis e operadores", "Estruturas de dados e laços", "Programação orientada a objetos"],
    proximoConteudo: "Entrar em um bootcamp de Python ou estudar bibliotecas como Pandas.",
    tipo: "Gratuito",
  },
  {
    id: "curso-dio-introducao-git-github",
    certificate: "sim",
    titulo: "Introdução ao Git e ao GitHub",
    canal: "Otávio Reis",
    plataforma: "DIO",
    link: "https://www.dio.me/courses/introducao-ao-git-e-ao-github",
    areaSlug: "devops",
    nivel: "Iniciante",
    duracao: "3 horas",
    idioma: "Português",
    descricao: "Curso da DIO sobre controle de versão, explicando como o Git funciona internamente e os primeiros comandos. Aborda o ciclo de vida dos arquivos e resolução de conflitos no GitHub.",
    motivoIndicacao: "Ensina versionamento de forma direta e com certificado DIO, habilidade essencial em qualquer time de tecnologia.",
    oQueAprende: ["Funcionamento interno do Git", "Primeiros comandos e ciclo de arquivos", "Resolução de conflitos no GitHub"],
    proximoConteudo: "Praticar branches e pull requests em projetos reais.",
    tipo: "Gratuito",
  },
  {
    id: "curso-dio-html5-css3",
    certificate: "sim",
    titulo: "Introdução à Criação de Websites com HTML5 e CSS3",
    canal: "Lucas Vilaboim",
    plataforma: "DIO",
    link: "https://www.dio.me/courses/introducao-criacao-de-websites-com-html5-e-css3",
    areaSlug: "frontend",
    nivel: "Iniciante",
    duracao: "4 horas",
    idioma: "Português",
    descricao: "Curso da DIO que ensina a criar sites do zero com HTML5 e CSS3, da semântica à estilização de elementos. Aborda imagens, listas, links e alinhamento de layout.",
    motivoIndicacao: "Introdução prática ao front-end com certificado DIO, perfeita para quem quer publicar a primeira página.",
    oQueAprende: ["Semântica e estrutura HTML", "Imagens, links e listas", "Estilização e alinhamento com CSS3"],
    proximoConteudo: "Estudar JavaScript para adicionar interatividade às páginas.",
    tipo: "Gratuito",
  },
  {
    id: "curso-dio-fundamentos-css",
    certificate: "sim",
    titulo: "Fundamentos do CSS",
    canal: "Michele Ambrosio",
    plataforma: "DIO",
    link: "https://www.dio.me/courses/fundamentos-do-css",
    areaSlug: "frontend",
    nivel: "Iniciante",
    duracao: "4 horas",
    idioma: "Português",
    descricao: "Curso da DIO focado em CSS, cobrindo seletores, combinadores e propriedades de dimensionamento e espaçamento. Tem abordagem prática e baseada em projetos.",
    motivoIndicacao: "Aprofunda o CSS de quem já viu o básico, com badge e certificado da DIO ao final.",
    oQueAprende: ["Seletores e combinadores", "Dimensionamento e espaçamento", "Boas práticas de estilização"],
    proximoConteudo: "Estudar layouts modernos com Flexbox e Grid.",
    tipo: "Gratuito",
  },
  {
    id: "curso-dio-primeiros-passos-sql",
    certificate: "sim",
    titulo: "Primeiros Passos com SQL",
    canal: "Juliana Mascarenhas",
    plataforma: "DIO",
    link: "https://www.dio.me/courses/primeiros-passos-com-sql",
    areaSlug: "dados",
    nivel: "Iniciante",
    duracao: "2 horas",
    idioma: "Português",
    descricao: "Curso da DIO que apresenta o básico de SQL para quem quer começar a trabalhar com bancos de dados. Foca nos fundamentos para consultar e manipular dados.",
    motivoIndicacao: "Introdução rápida e objetiva ao SQL, base essencial para carreiras em dados e back-end.",
    oQueAprende: ["Conceitos de bancos de dados", "Comandos básicos de SQL", "Consultas iniciais"],
    proximoConteudo: "Aprender modelagem de dados e consultas com JOIN.",
    tipo: "Gratuito",
  },
  {
    id: "curso-dio-engenharia-dados-azure",
    certificate: "sim",
    titulo: "Introdução à Engenharia de Dados na Azure",
    canal: "Joel Lopes",
    plataforma: "DIO",
    link: "https://www.dio.me/courses/introducao-engenharia-de-dados-na-azure",
    areaSlug: "dados",
    nivel: "Intermediário",
    duracao: "4 horas",
    idioma: "Português",
    descricao: "Curso da DIO sobre os fundamentos de engenharia de dados usando a plataforma Azure, da ingestão ao processamento. Cobre ferramentas como HDInsight e Stream Analytics.",
    motivoIndicacao: "Conecta dados e nuvem em um cenário cada vez mais demandado, com certificação da DIO.",
    oQueAprende: ["Visão geral de engenharia de dados", "Ingestão e armazenamento na Azure", "Processamento com HDInsight e Stream Analytics"],
    proximoConteudo: "Praticar pipelines de dados e aprofundar em serviços Azure.",
    tipo: "Gratuito",
  },
  {
    id: "curso-dio-deploy-azure-cloud",
    certificate: "sim",
    titulo: "Configuração e Deploy na Nuvem Microsoft Azure Cloud",
    canal: "Leandro Bianch",
    plataforma: "DIO",
    link: "https://www.dio.me/courses/configuracao-e-deploy-na-nuvem-microsoft-azure-cloud",
    areaSlug: "cloud",
    nivel: "Intermediário",
    duracao: "3 horas",
    idioma: "Português",
    descricao: "Curso da DIO que mostra como configurar e fazer deploy de aplicações na nuvem Microsoft Azure. Aborda automação com CI e CD para otimizar entregas.",
    motivoIndicacao: "Apresenta conceitos de nuvem e deploy com Azure, área com forte demanda no mercado.",
    oQueAprende: ["Conceitos de nuvem e Azure", "Deploy de aplicações", "Automação com CI e CD"],
    proximoConteudo: "Estudar certificações Azure como o AZ-900.",
    tipo: "Gratuito",
  },
  {
    id: "curso-bradesco-site-html-css-js",
    certificate: "sim",
    titulo: "Crie um Site Simples Usando HTML, CSS e JavaScript",
    canal: "Fundação Bradesco",
    plataforma: "Fundação Bradesco Escola Virtual",
    link: "https://www.ev.org.br/cursos/crie-um-site-simples-usando-html-css-e-javascript",
    areaSlug: "fullstack",
    nivel: "Iniciante",
    duracao: "2 horas",
    idioma: "Português",
    descricao: "Curso gratuito da Escola Virtual da Fundação Bradesco que guia a construção de um site simples do início ao fim. Cobre estrutura HTML, estilização com CSS e interatividade com JavaScript.",
    motivoIndicacao: "Curso curto e gratuito com certificado oficial da Fundação Bradesco, ótimo para um primeiro projeto web completo.",
    oQueAprende: ["Estrutura de uma aplicação web", "Estilização com CSS", "Interatividade com JavaScript"],
    proximoConteudo: "Aprofundar em cada tecnologia separadamente e criar projetos maiores.",
    tipo: "Gratuito",
  },
  {
    id: "curso-foundational-csharp",
    certificate: "sim",
    titulo: "Foundational C# with Microsoft",
    canal: "Microsoft",
    plataforma: "freeCodeCamp",
    link: "https://www.freecodecamp.org/learn/foundational-c-sharp-with-microsoft",
    areaSlug: "backend",
    nivel: "Iniciante",
    duracao: "",
    idioma: "Inglês",
    descricao:
      "Trilha de fundamentos de C# em parceria com a Microsoft, com certificação ao concluir.",
    motivoIndicacao: "", // TODO(Ana): escrever o motivo da indicação
    oQueAprende: ["Fundamentos de C#"],
    proximoConteudo: "", // TODO(Ana): sugerir próximo conteúdo
    tipo: "Gratuito",
  },
  {
    id: "curso-imersao-dev-alura",
    certificate: "sim",
    titulo: "Imersão Dev",
    canal: "Alura",
    plataforma: "Alura",
    link: "https://imersao.dev/",
    areaSlug: "frontend",
    nivel: "Iniciante",
    duracao: "5 dias",
    idioma: "Português",
    descricao:
      "Evento gratuito de programação com lógica, JavaScript, HTML e CSS, com certificado de participação.",
    motivoIndicacao: "", // TODO(Ana): escrever o motivo da indicação
    oQueAprende: ["Lógica de programação", "JavaScript", "HTML", "CSS"],
    proximoConteudo: "", // TODO(Ana): sugerir próximo conteúdo
    tipo: "Gratuito",
  },
  {
    id: "curso-oracle-next-education",
    certificate: "nao_informado",
    titulo: "Oracle Next Education (ONE)",
    canal: "Oracle",
    plataforma: "Alura",
    link: "https://www.oracle.com/br/education/oracle-next-education/",
    areaSlug: "fullstack",
    nivel: "Iniciante",
    duracao: "",
    idioma: "Português",
    descricao:
      "Programa gratuito de formação e empregabilidade em tecnologia da Oracle em parceria com a Alura.",
    motivoIndicacao: "", // TODO(Ana): escrever o motivo da indicação
    oQueAprende: [
      "Lógica de programação",
      "Programação",
      "Carreira em tecnologia",
    ],
    proximoConteudo: "", // TODO(Ana): sugerir próximo conteúdo
    tipo: "Gratuito",
  },
  {
    id: "frontend-1",
    certificate: "sim",
    titulo: "Curso de HTML5 e CSS3 (Módulo 1 de 5)",
    canal: "Gustavo Guanabara",
    plataforma: "Curso em Vídeo",
    link: "https://www.cursoemvideo.com/curso/html5-css3-modulo1/",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 40 horas",
    idioma: "Português",
    descricao:
      "Curso introdutório que ensina a construir páginas web do zero usando HTML5 e CSS3, começando pela estrutura de um documento e avançando para estilização, cores, fontes e layout. As aulas são práticas e acompanhadas de exercícios e desafios, com material de apoio em PDF.",
    motivoIndicacao:
      "É uma das portas de entrada mais populares para frontend no Brasil, com didática leve e bem estruturada. Ideal para quem nunca programou e quer uma base sólida de HTML e CSS antes de seguir para JavaScript.",
    oQueAprende: [
      "Estrutura de documentos HTML5 e tags semânticas",
      "Estilização com CSS3 (cores, fontes, box model)",
      "Criação de layouts e páginas responsivas",
      "Boas práticas de organização de código",
    ],
    proximoConteudo: "Curso de JavaScript do Curso em Vídeo",
  },
  {
    id: "frontend-2",
    certificate: "sim",
    titulo: "Curso de JavaScript",
    canal: "Gustavo Guanabara",
    plataforma: "Curso em Vídeo",
    link: "https://www.cursoemvideo.com/curso/javascript/",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 40 horas",
    idioma: "Português",
    descricao:
      "Curso completo de JavaScript que vai dos primeiros scripts até o uso de funções e manipulação do DOM, seguindo o padrão ECMAScript. Conteúdo dividido em módulos com teoria, prática, exercícios aplicados e desafios.",
    motivoIndicacao:
      "Continuação natural do curso de HTML e CSS do mesmo professor. Ensina a tornar as páginas interativas e dinâmicas, cobrindo a lógica essencial que sustenta qualquer framework frontend moderno.",
    oQueAprende: [
      "Sintaxe e fundamentos do JavaScript",
      "Variáveis, condições, laços e funções",
      "Manipulação do DOM e eventos",
      "Lógica de programação aplicada à web",
    ],
    proximoConteudo: "Curso de Introdução ao ReactJS da DIO",
  },
  {
    id: "frontend-3",
    certificate: "sim",
    titulo: "Crie um site simples usando HTML, CSS e JavaScript",
    canal: "Fundação Bradesco (com Microsoft)",
    plataforma: "Escola Virtual Fundação Bradesco",
    link: "https://www.ev.org.br/cursos/crie-um-site-simples-usando-html-css-e-javascript",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 2 horas",
    idioma: "Português",
    descricao:
      "Curso rápido que apresenta os fundamentos da construção de sites, da estrutura básica em HTML até a adição de interatividade com JavaScript, passando pela configuração do ambiente de desenvolvimento.",
    motivoIndicacao:
      "Ótima opção para quem quer um primeiro contato objetivo e com certificado digital reconhecido e gratuito. Bom para reforçar o currículo de quem busca vagas iniciais sem experiência prévia em tecnologia.",
    oQueAprende: [
      "Configuração do ambiente de desenvolvimento web",
      "Estrutura de uma página com HTML",
      "Estilização básica com CSS",
      "Interatividade inicial com JavaScript",
    ],
    proximoConteudo: "Curso de HTML5 e CSS3 do Curso em Vídeo para aprofundar",
  },
  {
    id: "frontend-4",
    certificate: "sim",
    titulo: "Certificação de Design Responsivo para a Web",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp (Português)",
    link: "https://www.freecodecamp.org/portuguese/learn/responsive-web-design-v9",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 300 horas (autoritmo)",
    idioma: "Português",
    descricao:
      "Trilha prática e interativa de HTML e CSS com foco em design responsivo, layout moderno, acessibilidade e construção de projetos reais direto no navegador. O progresso é validado por desafios e projetos obrigatórios.",
    motivoIndicacao:
      "Aprendizado totalmente mão na massa, com exercícios que só avançam quando o código funciona. Excelente para fixar HTML e CSS construindo projetos do zero, e o certificado é gratuito.",
    oQueAprende: [
      "HTML semântico e acessibilidade",
      "CSS moderno (Flexbox e Grid)",
      "Técnicas de design responsivo e media queries",
      "Construção de projetos reais para portfólio",
    ],
    proximoConteudo:
      "Certificação Bibliotecas de Desenvolvimento Front-End do freeCodeCamp",
  },
  {
    id: "frontend-5",
    certificate: "sim",
    titulo: "Certificação Bibliotecas de Desenvolvimento Front-End",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp (Português)",
    link: "https://www.freecodecamp.org/portuguese/learn/front-end-development-libraries",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    duracao: "Aproximadamente 300 horas (autoritmo)",
    idioma: "Português",
    descricao:
      "Trilha intermediária que cobre bibliotecas e ferramentas populares do frontend como Bootstrap, jQuery, Sass, React e Redux, culminando na construção de cinco projetos práticos para fixar o conteúdo.",
    motivoIndicacao:
      "Passo seguinte ideal depois de dominar HTML, CSS e JavaScript. Apresenta React e gerenciamento de estado de forma prática, com certificado gratuito ao concluir os projetos.",
    oQueAprende: [
      "Estilização rápida com Bootstrap e Sass",
      "Fundamentos de React e JSX",
      "Gerenciamento de estado com Redux",
      "Construção de Single Page Applications",
    ],
    proximoConteudo: "Bootcamp Desenvolvedor Front-end ReactJS da DIO",
  },
  {
    id: "frontend-6",
    certificate: "nao_informado",
    titulo: "Introdução ao ReactJS",
    canal: "DIO",
    plataforma: "DIO (Digital Innovation One)",
    link: "https://www.dio.me/courses/introducao-ao-react",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    duracao: "Curta (algumas horas)",
    idioma: "Português",
    descricao:
      "Curso introdutório ao React que apresenta a biblioteca de forma prática e direta, abordando os conceitos iniciais para criar interfaces baseadas em componentes.",
    motivoIndicacao:
      "Bom ponto de partida em português para quem já sabe JavaScript e quer dar os primeiros passos no React, dentro de uma plataforma com metodologia baseada em projetos.",
    oQueAprende: [
      "O que é React e quando usar",
      "Componentes e propriedades",
      "Renderização de interface",
      "Primeiros passos com o ecossistema React",
    ],
    proximoConteudo: "Bootcamp Desenvolvedor Front-end ReactJS da DIO",
  },
  {
    id: "frontend-7",
    certificate: "nao_informado",
    titulo: "Bootcamp Desenvolvedor Front-end ReactJS",
    canal: "DIO",
    plataforma: "DIO (Digital Innovation One)",
    link: "https://www.dio.me/bootcamp/desenvolvedor-front-end-reactjs",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    duracao: "Várias semanas (bootcamp)",
    idioma: "Português",
    descricao:
      "Bootcamp gratuito focado em desenvolvimento frontend com ReactJS, cobrindo os conceitos necessários para construir interfaces baseadas em componentes e projetos web, com desafios de código e mentorias gravadas.",
    motivoIndicacao:
      "Formato de imersão com trilha estruturada e desafios práticos, indicado para quem já tem base e quer se aprofundar em React com foco em mercado e portfólio.",
    oQueAprende: [
      "Componentização e reutilização de interface",
      "Gerenciamento de estado em React",
      "Consumo de APIs no frontend",
      "Desenvolvimento de projetos web completos",
    ],
    proximoConteudo: "Formação completa em React da Rocketseat",
  },
  {
    id: "frontend-8",
    certificate: "nao",
    titulo: "Playlist React (Rocketseat)",
    canal: "Rocketseat",
    plataforma: "YouTube",
    link: "https://www.youtube.com/playlist?list=PL85ITvJ7FLohz54DLfinJeHi7DrHGT2_U",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    duracao: "Variável (vários vídeos)",
    idioma: "Português",
    descricao:
      "Coleção de aulas e conteúdos práticos de ReactJS produzidos pela Rocketseat, com foco em aplicação real e alinhamento com o mercado de trabalho.",
    motivoIndicacao:
      "A Rocketseat é uma das maiores referências de frontend no Brasil. A playlist gratuita é ótima para ver React aplicado na prática com qualidade de produção alta.",
    oQueAprende: [
      "Estruturação de projetos React",
      "Hooks e componentização",
      "Boas práticas de desenvolvimento moderno",
      "Construção de interfaces na prática",
    ],
    proximoConteudo: "Conteúdos sobre TypeScript aplicados ao React",
  },
  {
    id: "frontend-9",
    certificate: "nao",
    titulo: "CSS Flexbox",
    canal: "Origamid",
    plataforma: "Origamid",
    link: "https://www.origamid.com/curso/css-flexbox/",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    duracao: "Curta (poucas horas)",
    idioma: "Português",
    descricao:
      "Curso dedicado ao Flexbox do CSS, ensinando a criar layouts responsivos usando apenas as propriedades dessa especificação, com aplicação em um projeto prático.",
    motivoIndicacao:
      "A Origamid é referência em frontend e UX no Brasil. Este curso gratuito resolve uma das maiores dificuldades de iniciantes: dominar alinhamento e distribuição de elementos com Flexbox.",
    oQueAprende: [
      "Conceitos de container e itens flex",
      "Alinhamento e distribuição de elementos",
      "Direção, quebra e ordem dos itens",
      "Construção de layouts responsivos com Flexbox",
    ],
    proximoConteudo: "Curso HTML e CSS para Iniciantes da Origamid",
  },
  {
    id: "frontend-10",
    certificate: "nao",
    titulo: "Aprendendo desenvolvimento web (Learn Web Development)",
    canal: "MDN Web Docs (Mozilla)",
    plataforma: "MDN Web Docs",
    link: "https://developer.mozilla.org/pt-BR/docs/Learn_web_development",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    duracao: "Autoritmo (modular)",
    idioma: "Português",
    descricao:
      "Trilha oficial de aprendizado da Mozilla com módulos que ensinam HTML, CSS e JavaScript do zero, além de boas práticas, ferramentas e fundamentos do funcionamento da web. Conteúdo em formato de leitura com exemplos.",
    motivoIndicacao:
      "É a documentação e material de estudo mais confiável da web, mantida pela Mozilla. Serve tanto como curso estruturado para iniciantes quanto como referência permanente de consulta.",
    oQueAprende: [
      "Fundamentos de HTML e estrutura semântica",
      "CSS e estilização de páginas",
      "Lógica e sintaxe de JavaScript",
      "Como a web e os navegadores funcionam",
    ],
    proximoConteudo: "Certificação de Design Responsivo do freeCodeCamp",
  },
  {
    id: "frontend-11",
    certificate: "sim",
    titulo: "Curso de HTML5 (40 horas)",
    canal: "Gustavo Guanabara",
    plataforma: "Curso em Vídeo",
    link: "https://www.cursoemvideo.com/curso/html5/",
    areaSlug: "frontend" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 40 horas",
    idioma: "Português",
    descricao:
      "Curso focado em HTML5 que cobre desde a estrutura básica de uma página até recursos mais modernos da linguagem de marcação, com exercícios e desafios para fixação.",
    motivoIndicacao:
      "Para quem quer concentrar o estudo especificamente em HTML5 antes de avançar no CSS, com a mesma didática reconhecida do Curso em Vídeo. Bom complemento de referência da linguagem de marcação.",
    oQueAprende: [
      "Estrutura e sintaxe do HTML5",
      "Tags semânticas e organização de conteúdo",
      "Formulários, tabelas, mídia e links",
      "Boas práticas de marcação",
    ],
    proximoConteudo: "Curso de JavaScript do Curso em Vídeo",
  },
  {
    id: "backend-1",
    certificate: "nao",
    titulo: "Curso de Algoritmos e Lógica de Programação",
    canal: "Curso em Vídeo (Gustavo Guanabara)",
    plataforma: "YouTube",
    link: "https://www.youtube.com/playlist?list=PLHz_AreHm4dmSj0MHol_aoNYCSGFqvfXV",
    areaSlug: "backend" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 20 horas (playlist completa)",
    idioma: "Português",
    descricao:
      "Curso introdutório que ensina a raciocinar como um programador antes de partir para uma linguagem específica. Trabalha pseudocódigo (Portugol), fluxogramas, variáveis, condições e estruturas de repetição com uma didática leve e cheia de exemplos.",
    motivoIndicacao:
      "É o ponto de partida ideal para quem nunca programou. Antes de mexer com servidor, banco ou API, esse curso constrói a base de lógica que todo desenvolvedor backend precisa dominar.",
    oQueAprende: [
      "Conceitos de algoritmo e fluxograma",
      "Variáveis, tipos de dados e operadores",
      "Estruturas de decisão (if/else)",
      "Estruturas de repetição (for/while)",
      "Construção de pseudocódigo em Portugol",
    ],
    proximoConteudo: "Curso de Python 3 - Mundo 1 do mesmo professor",
  },
  {
    id: "backend-2",
    certificate: "nao",
    titulo: "Curso de Python 3 - Mundo 1: Fundamentos",
    canal: "Curso em Vídeo (Gustavo Guanabara)",
    plataforma: "YouTube",
    link: "https://www.youtube.com/playlist?list=PLHz_AreHm4dlKP6QQCekuIPky1CiwmdI6",
    areaSlug: "backend" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 40 horas",
    idioma: "Português",
    descricao:
      "Primeira parte de uma trilha completa de Python. Apresenta a linguagem do zero, com instalação do ambiente, primeiros programas, entrada e saída de dados, operadores e estruturas condicionais, sempre com exercícios práticos.",
    motivoIndicacao:
      "Python é uma das linguagens mais usadas no backend hoje. Esta trilha tem reputação consolidada no Brasil pela clareza, e o Mundo 1 dá uma base sólida sem pressupor conhecimento prévio.",
    oQueAprende: [
      "Instalação e configuração do ambiente Python",
      "Entrada e saída de dados",
      "Operadores aritméticos, relacionais e lógicos",
      "Estruturas condicionais",
      "Boas práticas iniciais de código",
    ],
    proximoConteudo: "Python 3 - Mundo 2 (estruturas de repetição e funções)",
  },
  {
    id: "backend-3",
    certificate: "nao",
    titulo: "Curso de Java para Iniciantes",
    canal: "Curso em Vídeo (Gustavo Guanabara)",
    plataforma: "YouTube",
    link: "https://www.youtube.com/playlist?list=PLHz_AreHm4dkI2ZdjTwZA4mPMxWTfNSpR",
    areaSlug: "backend" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 40 horas",
    idioma: "Português",
    descricao:
      "Curso completo de fundamentos de Java, partindo da história da linguagem e da configuração do ambiente até variáveis, operadores, estruturas de controle e manipulação de vetores, com muitos exemplos e desafios.",
    motivoIndicacao:
      "Java é onipresente em sistemas backend corporativos. Este curso prepara o aluno nos fundamentos da linguagem com uma didática acessível antes de avançar para orientação a objetos.",
    oQueAprende: [
      "Como a máquina virtual Java funciona",
      "Configuração do ambiente de desenvolvimento",
      "Variáveis, tipos primitivos e operadores",
      "Estruturas de decisão e repetição",
      "Trabalho com vetores e arrays",
    ],
    proximoConteudo: "Curso de POO em Java do mesmo professor",
  },
  {
    id: "backend-4",
    certificate: "nao",
    titulo: "Curso de POO Java (Programação Orientada a Objetos)",
    canal: "Curso em Vídeo (Gustavo Guanabara)",
    plataforma: "YouTube",
    link: "https://www.youtube.com/playlist?list=PLHz_AreHm4dkqe2aR0tQK74m8SFe-aGsY",
    areaSlug: "backend" as string | null,
    nivel: "Intermediário",
    duracao: "Aproximadamente 40 horas",
    idioma: "Português",
    descricao:
      "Curso dedicado aos quatro pilares da orientação a objetos usando Java. Explica classes, objetos, instanciamento, abstração, encapsulamento, herança e polimorfismo de forma progressiva e prática.",
    motivoIndicacao:
      "Orientação a objetos é a base de praticamente todo framework backend sério em Java. Dominar esses conceitos é o que separa quem só escreve scripts de quem constrói sistemas estruturados.",
    oQueAprende: [
      "Classes, objetos e instanciamento",
      "Abstração e encapsulamento",
      "Herança entre classes",
      "Polimorfismo",
      "Modelagem de sistemas orientados a objetos",
    ],
    proximoConteudo: "Frameworks Java como Spring Boot para construção de APIs",
  },
  {
    id: "backend-5",
    certificate: "nao",
    titulo: "Curso de PHP Moderno - Módulo 1",
    canal: "Curso em Vídeo (Gustavo Guanabara)",
    plataforma: "YouTube",
    link: "https://www.youtube.com/playlist?list=PLHz_AreHm4dlFPrCXCmd5g92860x_Pbr_",
    areaSlug: "backend" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 20 horas",
    idioma: "Português",
    descricao:
      "Curso de PHP voltado para o desenvolvimento web no lado do servidor, com abordagem atualizada da linguagem. Cobre desde a configuração do ambiente até a integração do PHP com HTML para gerar páginas dinâmicas.",
    motivoIndicacao:
      "PHP continua movendo uma fatia enorme da web e é uma porta de entrada acessível ao backend. O curso foca em uma versão moderna da linguagem, evitando vícios antigos.",
    oQueAprende: [
      "Configuração de ambiente de servidor local",
      "Sintaxe básica e variáveis em PHP",
      "Integração de PHP com HTML",
      "Geração de conteúdo dinâmico no servidor",
      "Estruturas de controle aplicadas à web",
    ],
    proximoConteudo: "Curso de Banco de Dados MySQL para persistência de dados",
  },
  {
    id: "backend-6",
    certificate: "nao",
    titulo: "Curso de Banco de Dados MySQL",
    canal: "Curso em Vídeo (Gustavo Guanabara)",
    plataforma: "YouTube",
    link: "https://www.youtube.com/playlist?list=PLHz_AreHm4dkBs-795Dsgvau_ekxg8g1r",
    areaSlug: "backend" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 20 horas",
    idioma: "Português",
    descricao:
      "Curso completo de bancos de dados relacionais com MySQL. Vai da criação de bancos e tabelas até consultas com SELECT, filtros, relacionamentos com chaves estrangeiras e JOINs.",
    motivoIndicacao:
      "Nenhuma aplicação backend funciona sem saber armazenar e consultar dados. SQL é uma habilidade obrigatória, e este curso ensina o modelo relacional de forma clara e prática.",
    oQueAprende: [
      "Conceito de banco de dados relacional",
      "Criação e alteração de tabelas (DDL)",
      "Inserção, atualização e exclusão de registros (DML)",
      "Consultas com SELECT e filtros",
      "Relacionamentos com chaves estrangeiras e JOINs",
    ],
    proximoConteudo:
      "Integração de banco de dados com uma linguagem backend como PHP ou Python",
  },
  {
    id: "backend-7",
    certificate: "sim",
    titulo: "Fundamentos de Lógica de Programação",
    canal: "Fundação Bradesco",
    plataforma: "Escola Virtual Fundação Bradesco",
    link: "https://www.ev.org.br/areas-de-interesse/programacao",
    areaSlug: "backend" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 8 horas",
    idioma: "Português",
    descricao:
      "Curso online da Escola Virtual da Fundação Bradesco que apresenta os fundamentos da lógica de programação e as principais técnicas de construção de algoritmos: descrição narrativa, fluxograma e pseudocódigo.",
    motivoIndicacao:
      "Para quem quer um comprovante formal, é uma das poucas opções realmente gratuitas que emite certificado sem custo. Bom complemento estruturado à base de lógica.",
    oQueAprende: [
      "Conceitos fundamentais de lógica",
      "Construção de algoritmos",
      "Descrição narrativa de soluções",
      "Fluxogramas",
      "Pseudocódigo",
    ],
    proximoConteudo: "Um curso de linguagem específica como Python ou Java",
  },
  {
    id: "backend-8",
    certificate: "sim",
    titulo: "Introdução à Programação com Python",
    canal: "DIO (Digital Innovation One)",
    plataforma: "DIO",
    link: "https://www.dio.me/courses/introducao-a-programacao-com-python",
    areaSlug: "backend" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 8 horas",
    idioma: "Português",
    descricao:
      "Curso prático da DIO que cobre a linguagem Python do básico ao intermediário: variáveis, laços de repetição, organização de dados, criação de métodos e classes, manipulação de arquivos e tratamento de exceções.",
    motivoIndicacao:
      "A DIO combina conteúdo gratuito com metodologia baseada em projetos e emite certificado de conclusão. Boa opção para quem quer um percurso guiado em plataforma reconhecida no mercado brasileiro.",
    oQueAprende: [
      "Sintaxe e variáveis em Python",
      "Laços de repetição",
      "Criação de métodos e classes",
      "Manipulação de arquivos externos",
      "Tratamento de exceções",
    ],
    proximoConteudo:
      "Desenvolvimento avançado de REST API com Flask na própria DIO",
  },
  {
    id: "backend-9",
    certificate: "sim",
    titulo: "Desenvolvimento Avançado Python com Flask e REST API",
    canal: "DIO (Digital Innovation One)",
    plataforma: "DIO",
    link: "https://aprenda.digitalinnovation.one/cursos/desenvolvimento-avancado-de-rest-api-com-flask",
    areaSlug: "backend" as string | null,
    nivel: "Avançado",
    duracao: "Aproximadamente 5 horas",
    idioma: "Português",
    descricao:
      "Curso focado em construir uma API REST completa em Python usando o framework Flask, com configuração de ambiente, uso de bibliotecas comuns e integração com banco de dados via SQLAlchemy.",
    motivoIndicacao:
      "Depois dos fundamentos, este curso mostra na prática como construir uma API, que é o coração do trabalho de um dev backend. Voltado a quem já conhece Python e quer subir de nível.",
    oQueAprende: [
      "Configuração de ambiente para Flask",
      "Criação de rotas e endpoints REST",
      "Integração com banco via SQLAlchemy",
      "Estruturação de uma API completa",
      "Boas práticas de API REST",
    ],
    proximoConteudo: "Deploy de APIs e containers com Docker",
  },
  {
    id: "backend-10",
    certificate: "nao_informado",
    titulo: "Escreva seu primeiro código usando C# (Introdução ao C#)",
    canal: "Microsoft Learn",
    plataforma: "Microsoft Learn",
    link: "https://learn.microsoft.com/pt-br/training/paths/get-started-c-sharp-part-1/",
    areaSlug: "backend" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 4 a 6 horas",
    idioma: "Português",
    descricao:
      "Trilha oficial e gratuita da Microsoft que ensina os fundamentos de C#, linguagem central do ecossistema .NET. Inclui exercícios interativos no navegador para escrever e executar código sem instalar nada.",
    motivoIndicacao:
      "C# e .NET dominam grande parte do backend corporativo. Aprender direto da fonte oficial, em português e de graça, garante conteúdo atualizado e confiável.",
    oQueAprende: [
      "Sintaxe básica de C#",
      "Variáveis e tipos de dados",
      "Estruturas de decisão e repetição",
      "Manipulação de texto e números",
      "Execução de código no ambiente interativo",
    ],
    proximoConteudo: "Trilha Criar aplicativos .NET com C# e ASP.NET Core",
  },
  {
    id: "backend-11",
    certificate: "nao",
    titulo: "Aprenda Go - Curso completo de Go (Golang)",
    canal: "Aprenda Go",
    plataforma: "YouTube",
    link: "https://www.youtube.com/playlist?list=PLCKpcjBB_VlBsxJ9IseNxFllf-UFEXOdg",
    areaSlug: "backend" as string | null,
    nivel: "Intermediário",
    duracao: "Mais de 100 horas (playlist extensa)",
    idioma: "Português",
    descricao:
      "Curso extenso e 100 por cento em português da linguagem Go, partindo de tipos de variáveis e controle de fluxo até tópicos avançados como tratamento de erros, channels e concorrência.",
    motivoIndicacao:
      "Go é muito valorizado para backends de alta performance e microsserviços. É raro encontrar material tão completo e gratuito da linguagem em português.",
    oQueAprende: [
      "Tipos de variáveis e sintaxe de Go",
      "Estruturas de controle e funções",
      "Structs, slices e maps",
      "Tratamento de erros",
      "Concorrência com goroutines e channels",
    ],
    proximoConteudo: "Construção de APIs e microsserviços em Go",
  },
  {
    id: "backend-12",
    certificate: "nao",
    titulo:
      "Canal freeCodeCamp em Português - Cursos de Programação e Backend",
    canal: "freeCodeCamp em Português",
    plataforma: "YouTube",
    link: "https://www.youtube.com/@freecodecampemportugues",
    areaSlug: "backend" as string | null,
    nivel: "Intermediário",
    duracao: "Variável (cursos longos de várias horas cada)",
    idioma: "Português",
    descricao:
      "Canal oficial em português do freeCodeCamp, organização sem fins lucrativos. Publica cursos longos e completos de programação e ciência da computação, incluindo conteúdos de Python, Java e desenvolvimento backend.",
    motivoIndicacao:
      "O freeCodeCamp é uma referência mundial em educação gratuita de programação. Ter o conteúdo legendado e dublado em português torna cursos completos de backend acessíveis sem barreira de idioma.",
    oQueAprende: [
      "Fundamentos de linguagens backend",
      "Desenvolvimento de APIs",
      "Conceitos de ciência da computação",
      "Boas práticas de programação",
      "Projetos práticos completos",
    ],
    proximoConteudo: "Currículo interativo do freeCodeCamp em português",
  },
  {
    id: "fullstack-1",
    certificate: "sim",
    titulo: "Rocketseat Discover - Programação do Zero",
    canal: "Rocketseat",
    plataforma: "Rocketseat (plataforma própria)",
    link: "https://www.rocketseat.com.br/discover",
    areaSlug: "fullstack" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 20 a 30 horas (autoaprendizado)",
    idioma: "Português",
    descricao:
      "Trilha gratuita da Rocketseat que apresenta os fundamentos de desenvolvimento web do zero, cobrindo como a internet funciona, a diferença entre front-end e back-end, HTML, CSS, JavaScript, lógica de programação e versionamento com Git e GitHub.",
    motivoIndicacao:
      "Ponto de partida sólido em português para quem nunca programou e quer entender a base que sustenta o desenvolvimento full-stack antes de avançar para frameworks.",
    oQueAprende: [
      "Como a web e a internet funcionam",
      "HTML e CSS na prática",
      "Lógica de programação com JavaScript",
      "Diferença entre front-end e back-end",
      "Git e GitHub para versionar projetos",
    ],
    proximoConteudo:
      "Formação Full-Stack da Rocketseat ou The Odin Project (Full Stack JavaScript)",
  },
  {
    id: "fullstack-2",
    certificate: "nao",
    titulo: "The Odin Project - Full Stack JavaScript",
    canal: "The Odin Project",
    plataforma: "The Odin Project (site próprio)",
    link: "https://www.theodinproject.com/paths/full-stack-javascript",
    areaSlug: "fullstack" as string | null,
    nivel: "Intermediário",
    duracao: "Aproximadamente 1000 horas ou mais (currículo completo)",
    idioma: "Inglês",
    descricao:
      "Currículo open source e gratuito que ensina desenvolvimento web full-stack ponta a ponta, do front-end (HTML, CSS, JavaScript, React) ao back-end (Node.js, Express, banco de dados), com dezenas de projetos práticos para portfólio.",
    motivoIndicacao:
      "Um dos currículos gratuitos mais completos e respeitados do mundo para se tornar full-stack, com forte foco em construir projetos reais e aprender em comunidade.",
    oQueAprende: [
      "Fundamentos de HTML, CSS e JavaScript",
      "React para interfaces dinâmicas",
      "Node.js e Express no back-end",
      "Bancos de dados e APIs",
      "Deploy e organização de projetos full-stack",
    ],
    proximoConteudo:
      "freeCodeCamp Back-End Development and APIs para aprofundar APIs e bancos",
  },
  {
    id: "fullstack-3",
    certificate: "sim",
    titulo: "freeCodeCamp - Back End Development and APIs",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp.org",
    link: "https://www.freecodecamp.org/learn/back-end-development-and-apis-v9",
    areaSlug: "fullstack" as string | null,
    nivel: "Intermediário",
    duracao: "Aproximadamente 300 horas",
    idioma: "Inglês",
    descricao:
      "Certificação gratuita do freeCodeCamp focada no back-end de aplicações full-stack, ensinando a escrever aplicações com Node.js e npm, criar APIs com Express e construir um microsserviço com MongoDB e Mongoose.",
    motivoIndicacao:
      "Complemento ideal para quem já domina front-end e quer fechar o ciclo full-stack com back-end, APIs e banco NoSQL, recebendo certificado verificável gratuito.",
    oQueAprende: [
      "Node.js e npm",
      "Criação de APIs com Express",
      "Manipulação de requisições e rotas",
      "MongoDB e Mongoose",
      "Construção de microsserviços",
    ],
    proximoConteudo: "Formação Full-Stack da Rocketseat ou projeto MERN completo",
  },
  {
    id: "fullstack-4",
    certificate: "nao",
    titulo: "Curso de HTML5 e CSS3 (Módulo 1)",
    canal: "Curso em Vídeo (Gustavo Guanabara)",
    plataforma: "Curso em Vídeo (site próprio)",
    link: "https://www.cursoemvideo.com/curso/html5-css3-modulo1/",
    areaSlug: "fullstack" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 40 horas",
    idioma: "Português",
    descricao:
      "Curso gratuito e didático de HTML5 e CSS3 do professor Gustavo Guanabara, que ensina a criar sites do zero entendendo estrutura, estilos, box model e organização de elementos na tela.",
    motivoIndicacao:
      "Referência em português para iniciantes absolutos, com explicação clara da camada de apresentação que todo dev full-stack precisa dominar.",
    oQueAprende: [
      "Estrutura de páginas com HTML5",
      "Estilização com CSS3",
      "Box model e layout",
      "Boas práticas de marcação",
      "Construção de um site completo",
    ],
    proximoConteudo: "Curso em Vídeo - JavaScript",
  },
  {
    id: "fullstack-5",
    certificate: "nao",
    titulo: "Curso de JavaScript (full-stack)",
    canal: "Curso em Vídeo (Gustavo Guanabara)",
    plataforma: "Curso em Vídeo (site próprio)",
    link: "https://www.cursoemvideo.com/curso/javascript/",
    areaSlug: "fullstack" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 40 horas",
    idioma: "Português",
    descricao:
      "Curso gratuito de JavaScript do Curso em Vídeo que ensina passo a passo desde os conceitos básicos até recursos modernos da linguagem, com exercícios e desafios aplicados.",
    motivoIndicacao:
      "JavaScript é a linguagem central do desenvolvimento full-stack moderno; este curso em português constrói a base necessária para front-end e back-end com Node.",
    oQueAprende: [
      "Sintaxe e tipos em JavaScript",
      "Estruturas de controle e funções",
      "Manipulação do DOM",
      "Recursos modernos da linguagem",
      "Lógica aplicada a projetos web",
    ],
    proximoConteudo:
      "The Odin Project (Full Stack JavaScript) ou Formação Full-Stack Rocketseat",
  },
  {
    id: "fullstack-6",
    certificate: "sim",
    titulo: "Rocketseat - Formação Full-Stack",
    canal: "Rocketseat",
    plataforma: "Rocketseat (plataforma própria)",
    link: "https://www.rocketseat.com.br/formacao/fullstack",
    areaSlug: "fullstack" as string | null,
    nivel: "Intermediário",
    duracao: "Variável (trilha completa)",
    idioma: "Português",
    descricao:
      "Formação da Rocketseat que vai dos fundamentos e construção de páginas estáticas com HTML e CSS até interfaces dinâmicas com React e fundamentos de Node.js, desenvolvendo aplicações full-stack do back-end ao front-end.",
    motivoIndicacao:
      "Trilha estruturada em português que conecta front-end e back-end em um só percurso, com projetos práticos voltados ao mercado brasileiro.",
    oQueAprende: [
      "HTML e CSS para páginas web",
      "React para front-end",
      "Fundamentos de Node.js",
      "Construção de aplicações full-stack",
      "Boas práticas e projetos de portfólio",
    ],
    proximoConteudo: "Aprofundamento em React Native ou DevOps",
  },
  {
    id: "fullstack-7",
    certificate: "sim",
    titulo: "freeCodeCamp - Responsive Web Design",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp.org",
    link: "https://www.freecodecamp.org/learn/responsive-web-design-v9",
    areaSlug: "fullstack" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 300 horas",
    idioma: "Inglês",
    descricao:
      "Certificação gratuita do freeCodeCamp que ensina os fundamentos do front-end responsivo, incluindo HTML semântico, formulários, acessibilidade, CSS Flexbox e CSS Grid, com cinco projetos práticos.",
    motivoIndicacao:
      "Base de front-end essencial para a jornada full-stack, com projetos avaliados e certificado gratuito, complementando a parte de back-end do freeCodeCamp.",
    oQueAprende: [
      "HTML semântico",
      "Formulários e acessibilidade",
      "CSS Flexbox",
      "CSS Grid",
      "Design responsivo",
    ],
    proximoConteudo: "freeCodeCamp Back-End Development and APIs",
  },
  {
    id: "banco-de-dados-1",
    certificate: "nao",
    titulo: "Curso de Banco de Dados MySQL",
    canal: "Curso em Vídeo (Gustavo Guanabara)",
    plataforma: "YouTube",
    link: "https://www.youtube.com/playlist?list=PLHz_AreHm4dkBs-795Dsgvau_ekxg8g1r",
    areaSlug: "banco-de-dados" as string | null,
    nivel: "Iniciante",
    duracao: "Aproximadamente 25 horas (playlist)",
    idioma: "Português",
    descricao:
      "Playlist completa e gratuita de MySQL do professor Gustavo Guanabara, que ensina a criar e manipular bancos de dados de forma simples e prática, cobrindo desde a criação até consultas, modelo relacional e JOINs.",
    motivoIndicacao:
      "É o curso de banco de dados em português mais popular do YouTube para iniciantes, com didática reconhecida e exemplos passo a passo.",
    oQueAprende: [
      "Criação de bancos e tabelas no MySQL",
      "Inserção e manipulação de dados",
      "Comandos SELECT",
      "Modelo relacional e chaves estrangeiras",
      "Operações JOIN",
    ],
    proximoConteudo: "Curso de Modelagem de Dados da Boson Treinamentos",
  },
  {
    id: "banco-de-dados-2",
    certificate: "nao",
    titulo: "Curso de Modelagem de Dados",
    canal: "Boson Treinamentos (Fabio dos Reis)",
    plataforma: "YouTube",
    link: "https://www.youtube.com/playlist?list=PLucm8g_ezqNoNHU8tjVeHmRGBFnjDIlxD",
    areaSlug: "banco-de-dados" as string | null,
    nivel: "Intermediário",
    duracao: "Aproximadamente 15 horas (playlist)",
    idioma: "Português",
    descricao:
      "Curso gratuito de modelagem de dados da Boson Treinamentos que cobre todo o processo de análise e desenvolvimento de um modelo entidade-relacionamento, incluindo normalização e formas normais.",
    motivoIndicacao:
      "Aprofunda a teoria de modelagem e normalização que falta na maioria dos cursos práticos, essencial para projetar bancos consistentes.",
    oQueAprende: [
      "Conceitos de bancos de dados",
      "Modelo entidade-relacionamento (MER/DER)",
      "Cardinalidade e relacionamentos",
      "Normalização e formas normais",
      "Projeto prático de banco",
    ],
    proximoConteudo: "Curso Completo de PostgreSQL da Boson Treinamentos",
  },
  {
    id: "banco-de-dados-3",
    certificate: "nao",
    titulo: "Curso de PostgreSQL - Bancos de Dados",
    canal: "Boson Treinamentos (Fabio dos Reis)",
    plataforma: "YouTube",
    link: "https://www.youtube.com/playlist?list=PLucm8g_ezqNoAkYKXN_zWupyH6hQCAwxY",
    areaSlug: "banco-de-dados" as string | null,
    nivel: "Intermediário",
    duracao: "Aproximadamente 20 horas (playlist)",
    idioma: "Português",
    descricao:
      "Curso completo e gratuito de PostgreSQL da Boson Treinamentos, com mais de 50 aulas ministradas por Fabio dos Reis, cobrindo um dos SGBDs relacionais open source mais usados no mundo.",
    motivoIndicacao:
      "PostgreSQL é muito requisitado no mercado e este curso em português oferece cobertura ampla e aprofundada de forma gratuita.",
    oQueAprende: [
      "Instalação e configuração do PostgreSQL",
      "Criação de bancos e tabelas",
      "Consultas SQL avançadas",
      "Tipos de dados e funções",
      "Administração do SGBD",
    ],
    proximoConteudo: "Certificação Relational Databases do freeCodeCamp",
  },
  {
    id: "banco-de-dados-4",
    certificate: "sim",
    titulo: "freeCodeCamp - Relational Databases (SQL, PostgreSQL, Bash)",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp.org",
    link: "https://www.freecodecamp.org/learn/relational-databases-v9",
    areaSlug: "banco-de-dados" as string | null,
    nivel: "Intermediário",
    duracao: "Aproximadamente 300 horas",
    idioma: "Inglês",
    descricao:
      "Certificação gratuita do freeCodeCamp que ensina SQL, PostgreSQL, Bash e Git pela linha de comando, construindo mais de uma dezena de projetos práticos como bancos de dados de corpos celestes e da Copa do Mundo.",
    motivoIndicacao:
      "Aborda banco de dados relacional de forma totalmente prática usando ferramentas reais (VS Code, PostgreSQL, terminal) e oferece certificado gratuito verificável.",
    oQueAprende: [
      "SQL na prática",
      "Administração e design no PostgreSQL",
      "Scripting com Bash",
      "Versionamento com Git",
      "Construção de projetos de banco reais",
    ],
    proximoConteudo: "Estudo de NoSQL com MongoDB",
  },
  {
    id: "banco-de-dados-5",
    certificate: "sim",
    titulo: "Database Experience (Banco de Dados SQL e NoSQL)",
    canal: "DIO",
    plataforma: "DIO (dio.me)",
    link: "https://www.dio.me/bootcamp/database-experience",
    areaSlug: "banco-de-dados" as string | null,
    nivel: "Intermediário",
    duracao: "Aproximadamente 54 horas",
    idioma: "Português",
    descricao:
      "Bootcamp gratuito da DIO focado em banco de dados, com imersão nos principais conceitos de SQL e NoSQL, incluindo modelagem de dados, SGBD, modelo EER, arquitetura e construção de queries.",
    motivoIndicacao:
      "Bootcamp brasileiro gratuito com metodologia baseada em projetos, mentorias e certificado, cobrindo tanto bancos relacionais quanto NoSQL em um percurso estruturado.",
    oQueAprende: [
      "Conceitos de SQL e NoSQL",
      "Modelagem de dados e EER",
      "SGBD e arquitetura de dados",
      "Construção de queries",
      "Projetos práticos de banco",
    ],
    proximoConteudo: "Aprofundamento em MongoDB ou administração de PostgreSQL",
  },
  {
    id: "banco-de-dados-6",
    certificate: "sim",
    titulo: "Curso de SQL Database (Modelagem na Prática)",
    canal: "DIO",
    plataforma: "DIO (dio.me)",
    link: "https://www.dio.me/curso-sql",
    areaSlug: "banco-de-dados" as string | null,
    nivel: "Iniciante",
    duracao: "Variável (curso online)",
    idioma: "Português",
    descricao:
      "Curso gratuito da DIO que ensina a modelar uma base de dados conforme necessidades de negócio e a criar um projeto de banco de dados de um e-commerce, com foco em aprendizado baseado em projetos.",
    motivoIndicacao:
      "Aborda SQL com aplicação direta a um caso de negócio real (e-commerce), reforçando modelagem e prática, com certificado gratuito.",
    oQueAprende: [
      "Fundamentos de SQL",
      "Modelagem orientada a negócio",
      "Criação de tabelas e relacionamentos",
      "Consultas em um projeto de e-commerce",
      "Boas práticas de projeto de banco",
    ],
    proximoConteudo: "Bootcamp Database Experience da DIO",
  },
  {
    id: "banco-de-dados-7",
    certificate: "sim",
    titulo: "Administrando Banco de Dados",
    canal: "Fundação Bradesco",
    plataforma: "Escola Virtual (ev.org.br)",
    link: "https://www.ev.org.br/cursos/administrando-banco-de-dados",
    areaSlug: "banco-de-dados" as string | null,
    nivel: "Iniciante",
    duracao: "Variável (curso online)",
    idioma: "Português",
    descricao:
      "Curso online gratuito da Fundação Bradesco que apresenta a rotina do administrador de banco de dados, modelos de dados, SQL, esquemas, instâncias e tabelas, com certificado para quem atinge a nota mínima.",
    motivoIndicacao:
      "Opção gratuita e confiável com certificado reconhecido, ideal para quem busca uma introdução formal à administração de bancos de dados em português.",
    oQueAprende: [
      "Rotina do administrador de banco de dados",
      "Modelos de dados",
      "Conceitos de SQL",
      "Esquemas, instâncias e tabelas",
      "Fundamentos de SGBD",
    ],
    proximoConteudo: "Curso de Banco de Dados MySQL do Curso em Vídeo",
  },
  {
    id: "banco-de-dados-8",
    certificate: "nao",
    titulo: "Curso Completo de PostgreSQL (site Boson)",
    canal: "Boson Treinamentos (Fabio dos Reis)",
    plataforma: "Boson Treinamentos (site próprio)",
    link: "https://www.bosontreinamentos.com.br/curso-completo-de-postgresql/",
    areaSlug: "banco-de-dados" as string | null,
    nivel: "Intermediário",
    duracao: "Mais de 50 aulas (texto e vídeo)",
    idioma: "Português",
    descricao:
      "Versão em texto e vídeo do curso completo de PostgreSQL da Boson Treinamentos, organizada no site oficial, cobrindo de forma sequencial os recursos do SGBD relacional open source.",
    motivoIndicacao:
      "Complementa a playlist do YouTube com material em texto bem organizado, útil para consulta e estudo aprofundado de PostgreSQL em português.",
    oQueAprende: [
      "Conceitos de bancos relacionais",
      "Comandos SQL no PostgreSQL",
      "Tipos de dados e funções",
      "Consultas e junções",
      "Recursos avançados do SGBD",
    ],
    proximoConteudo: "Certificação Relational Databases do freeCodeCamp",
  },
  {
    id: "qa-1",
    certificate: "sim",
    titulo: "Introdução a Testes de Software",
    canal: "DIO (Digital Innovation One)",
    plataforma: "DIO",
    link: "https://www.dio.me/courses/introducao-a-testes-de-software",
    areaSlug: "qa" as string | null,
    nivel: "Iniciante",
    duracao: "Curta (algumas horas)",
    idioma: "Português",
    descricao:
      "Curso introdutório da DIO que apresenta os conceitos básicos e as primeiras técnicas de teste de software para quem está entrando na área de qualidade.",
    motivoIndicacao:
      "Ponto de partida gratuito em português, com metodologia baseada em projetos e certificado da DIO, ideal para quem nunca teve contato com testes.",
    oQueAprende: [
      "Conceitos fundamentais de teste de software",
      "Vocabulário básico de QA",
      "Primeiras técnicas de teste",
      "Papel do testador no time",
    ],
    proximoConteudo: "Introdução à Qualidade de Software da DIO",
  },
  {
    id: "qa-2",
    certificate: "sim",
    titulo: "Introdução à Qualidade de Software",
    canal: "DIO (Digital Innovation One)",
    plataforma: "DIO",
    link: "https://www.dio.me/courses/introducao-qualidade-de-software",
    areaSlug: "qa" as string | null,
    nivel: "Iniciante",
    duracao: "Curta (algumas horas)",
    idioma: "Português",
    descricao:
      "Curso da DIO voltado a entender o que é qualidade de software e como ela se encaixa no ciclo de desenvolvimento.",
    motivoIndicacao:
      "Complementa a base de testes mostrando a visão mais ampla de qualidade, útil para quem quer entender a área de QA como um todo.",
    oQueAprende: [
      "Conceito de qualidade de software",
      "Diferença entre teste e qualidade",
      "Garantia de qualidade no ciclo de desenvolvimento",
      "Boas práticas iniciais",
    ],
    proximoConteudo: "Fundamentos de Qualidade de Software da DIO",
  },
  {
    id: "qa-3",
    certificate: "sim",
    titulo: "Fundamentos de Qualidade de Software",
    canal: "DIO (Digital Innovation One)",
    plataforma: "DIO",
    link: "https://www.dio.me/courses/fundamentos-de-qualidade-de-software",
    areaSlug: "qa" as string | null,
    nivel: "Iniciante",
    duracao: "Curta (algumas horas)",
    idioma: "Português",
    descricao:
      "Curso da DIO que aprofunda os fundamentos de qualidade e introduz técnicas de teste na prática.",
    motivoIndicacao:
      "Aprofunda os fundamentos com abordagem prática, boa sequência para quem já viu a introdução e quer consolidar a base de QA.",
    oQueAprende: [
      "Fundamentos de qualidade de software",
      "Técnicas de teste aplicadas",
      "Práticas de garantia de qualidade",
      "Atuação do profissional de QA",
    ],
    proximoConteudo: "Introdução ao Teste de Software (USP) no Coursera",
  },
  {
    id: "qa-4",
    certificate: "nao_informado",
    titulo: "Introdução ao Teste de Software (USP)",
    canal: "Universidade de São Paulo",
    plataforma: "Coursera",
    link: "https://www.coursera.org/learn/intro-teste-de-software",
    areaSlug: "qa" as string | null,
    nivel: "Intermediário",
    duracao: "Média (algumas semanas)",
    idioma: "Português",
    descricao:
      "Curso da USP no Coursera que cobre planejamento e aplicação das principais técnicas, critérios e ferramentas de teste em diferentes tipos de software.",
    motivoIndicacao:
      "Conteúdo acadêmico sólido e com acesso gratuito por auditoria, em português, com profundidade maior que cursos introdutórios de plataforma.",
    oQueAprende: [
      "Planejamento de testes",
      "Técnicas e critérios de teste",
      "Teste no ciclo de vida do software",
      "Ferramentas de teste",
    ],
    proximoConteudo: "Testes de Software do Zero (Julio de Lima)",
  },
  {
    id: "qa-5",
    certificate: "nao",
    titulo: "Testes de Software do Zero",
    canal: "Julio de Lima",
    plataforma: "YouTube",
    link: "https://www.youtube.com/playlist?list=PLf8x7B3nFTl3EouPsBoqgbatKti9liVyj",
    areaSlug: "qa" as string | null,
    nivel: "Iniciante",
    duracao: "Média (vários vídeos)",
    idioma: "Português",
    descricao:
      "Playlist do QA Julio de Lima que cobre os conceitos de teste de software partindo do zero, voltada a iniciantes na área.",
    motivoIndicacao:
      "Julio de Lima é uma das maiores referências de testes no Brasil; a playlist é gratuita e didática para quem começa.",
    oQueAprende: [
      "Fundamentos de teste de software",
      "Primeiros passos na carreira de QA",
      "Conceitos essenciais de qualidade",
      "Mercado de testes",
    ],
    proximoConteudo: "Início Rápido em Teste de Software e QA da Iterasys",
  },
  {
    id: "qa-6",
    certificate: "sim",
    titulo: "Início Rápido em Teste de Software e QA",
    canal: "Iterasys",
    plataforma: "Iterasys",
    link: "https://iterasys.com.br/pt/comecar/curso/inicio-rapido-em-teste-de-software",
    areaSlug: "qa" as string | null,
    nivel: "Iniciante",
    duracao: "Média (algumas horas)",
    idioma: "Português",
    descricao:
      "Curso gratuito da Iterasys que apresenta a carreira de teste e QA, os 7 fundamentos de teste e as diferenças entre teste manual e automatizado.",
    motivoIndicacao:
      "Curso introdutório bastante reconhecido no mercado brasileiro de QA, gratuito e estruturado para quem quer entrar ou migrar para a área.",
    oQueAprende: [
      "Carreira em teste e QA",
      "7 fundamentos de teste de software",
      "Teste manual e teste automatizado",
      "Práticas ágeis de teste",
    ],
    proximoConteudo: "Introdução ao Teste de Software (USP) no Coursera",
  },
  { id: "kaggle-python-dados", certificate: "sim", titulo: "Python", canal: "Kaggle Learn", plataforma: "Kaggle", link: "https://www.kaggle.com/learn/python", areaSlug: "dados" as string | null, nivel: "Iniciante", duracao: "Cerca de 5 horas", idioma: "Inglês", descricao: "Curso introdutorio que cobre a linguagem mais usada na area de dados, do zero ate funcoes, listas, loops e bibliotecas externas, tudo em notebooks praticos.", motivoIndicacao: "E o ponto de partida natural para quem ainda nao programa e quer entrar em dados, ja preparando o terreno para Pandas e analise.", oQueAprende: ["Sintaxe basica, variaveis e tipos em Python", "Funcoes, condicionais e estruturas de repeticao", "Listas, dicionarios e uso de bibliotecas externas"], proximoConteudo: "Pandas (Kaggle Learn)" },
  { id: "kaggle-intro-programming-dados", certificate: "sim", titulo: "Intro to Programming", canal: "Kaggle Learn", plataforma: "Kaggle", link: "https://www.kaggle.com/learn/intro-to-programming", areaSlug: "dados" as string | null, nivel: "Iniciante", duracao: "Cerca de 4 horas", idioma: "Inglês", descricao: "Trilha para quem nunca escreveu uma linha de codigo, apresentando logica de programacao e os primeiros passos com Python de forma guiada.", motivoIndicacao: "Indicado para iniciantes absolutos que sentem que o curso de Python ja pressupoe alguma base; aqui o ritmo e mais lento.", oQueAprende: ["Conceitos de variaveis e calculos", "Funcoes e condicionais do zero", "Introducao a listas e ao pensamento computacional"], proximoConteudo: "Python (Kaggle Learn)" },
  { id: "fcc-py-analise-dados-br", certificate: "sim", titulo: "Analise de Dados com Python", canal: "freeCodeCamp", plataforma: "freeCodeCamp (em portugues)", link: "https://www.freecodecamp.org/portuguese/learn/data-analysis-with-python", areaSlug: "dados" as string | null, nivel: "Intermediário", duracao: "Aprox. 30 horas (autoinstrucional)", idioma: "Português", descricao: "Certificacao do freeCodeCamp, em portugues, que ensina a ler, limpar e analisar dados usando Python com NumPy e Pandas, com projetos avaliados ao final.", motivoIndicacao: "Reune teoria e pratica em portugues, com emissao de certificacao gratuita, algo raro em conteudo desse nivel.", oQueAprende: ["Leitura de dados de CSV, Excel e SQL", "Manipulacao com NumPy e Pandas", "Projetos praticos de analise para certificacao"], proximoConteudo: "Visualizacao de dados com Pandas e Matplotlib" },
  { id: "hashtag-canal-programacao-dados", certificate: "nao", titulo: "Canal Hashtag Programacao", canal: "Hashtag Programacao", plataforma: "YouTube", link: "https://www.youtube.com/@HashtagProgramacao", areaSlug: "dados" as string | null, nivel: "Iniciante", duracao: "Conteudo continuo", idioma: "Português", descricao: "Canal brasileiro com aulas e mini cursos gratuitos de Python, SQL e ciencia de dados, com foco pratico em projetos reais e didatica direta.", motivoIndicacao: "Boa fonte em portugues para complementar os estudos com exemplos aplicados ao mercado, sem custo.", oQueAprende: ["Fundamentos de Python aplicados a dados", "Uso de Pandas e Jupyter na pratica", "Construcao de projetos de analise e automacao"], proximoConteudo: "Curso de analise de dados com Python da propria Hashtag" },
  { id: "fcc-canal-portugues-dados", certificate: "nao", titulo: "Canal freeCodeCamp em Portugues", canal: "freeCodeCamp em Portugues", plataforma: "YouTube", link: "https://www.youtube.com/@freecodecampemportugues", areaSlug: "dados" as string | null, nivel: "Iniciante", duracao: "Conteudo continuo (cursos completos)", idioma: "Português", descricao: "Canal oficial do freeCodeCamp em portugues, com cursos completos dublados ou produzidos em portugues sobre programacao, dados e ciencia da computacao.", motivoIndicacao: "Traz o conteudo serio do freeCodeCamp para quem prefere estudar em portugues, de forma totalmente gratuita.", oQueAprende: ["Logica e fundamentos de programacao", "Introducao a dados e ferramentas", "Trilhas completas em video"], proximoConteudo: "Certificacoes em portugues no site do freeCodeCamp" },
  { id: "bradesco-intro-analise-dados-powerbi", certificate: "sim", titulo: "Introducao a Analise de Dados - Microsoft Power BI", canal: "Fundacao Bradesco / Microsoft", plataforma: "Escola Virtual (Fundacao Bradesco)", link: "https://www.ev.org.br/cursos/introducao-a-analise-de-dados-microsoft-power-bi", areaSlug: "analise-dados" as string | null, nivel: "Iniciante", duracao: "5 horas", idioma: "Português", descricao: "Curso que apresenta o papel do analista de dados, as categorias de analise e os blocos de construcao do Power BI, com conteudo produzido pela Microsoft.", motivoIndicacao: "Otimo primeiro contato com a carreira de analise de dados, gratuito, em portugues e com certificado emitido apos aprovacao.", oQueAprende: ["Dados, informacoes e tipos de analise", "Funcoes exercidas por quem trabalha com dados", "Primeiros passos no servico do Power BI"], proximoConteudo: "Analise de Dados no Power BI (Escola Virtual)" },
  { id: "fcc-py-analise-dados-analise", certificate: "sim", titulo: "Analise de Dados com Python", canal: "freeCodeCamp", plataforma: "freeCodeCamp (em portugues)", link: "https://www.freecodecamp.org/portuguese/learn/data-analysis-with-python", areaSlug: "analise-dados" as string | null, nivel: "Intermediário", duracao: "Aprox. 30 horas (autoinstrucional)", idioma: "Português", descricao: "Certificacao em portugues focada em transformar dados brutos em insights usando Python, com enfase em limpeza, transformacao e analise com Pandas.", motivoIndicacao: "Para quem quer sair do Power BI e analisar dados com codigo, e a opcao gratuita mais completa em portugues com certificacao.", oQueAprende: ["Importacao e limpeza de dados", "Analise exploratoria com Pandas e NumPy", "Projetos de analise avaliados"], proximoConteudo: "Visualizacao de dados (Kaggle Learn)" },
  { id: "kaggle-pandas-analise", certificate: "sim", titulo: "Pandas", canal: "Kaggle Learn", plataforma: "Kaggle", link: "https://www.kaggle.com/learn/pandas", areaSlug: "analise-dados" as string | null, nivel: "Intermediário", duracao: "Cerca de 4 horas", idioma: "Inglês", descricao: "Curso pratico, em desafios curtos, para dominar manipulacao de dados tabulares com a biblioteca Pandas.", motivoIndicacao: "Pandas e a ferramenta central do dia a dia do analista; este curso e direto ao ponto e gratuito.", oQueAprende: ["Criacao e leitura de DataFrames", "Selecao, filtragem e agrupamento de dados", "Tratamento de valores ausentes e combinacao de tabelas"], proximoConteudo: "Data Cleaning (Kaggle Learn)" },
  { id: "kaggle-data-viz-analise", certificate: "sim", titulo: "Data Visualization", canal: "Kaggle Learn", plataforma: "Kaggle", link: "https://www.kaggle.com/learn/data-visualization", areaSlug: "analise-dados" as string | null, nivel: "Iniciante", duracao: "Cerca de 4 horas", idioma: "Inglês", descricao: "Curso para criar visualizacoes com a biblioteca Seaborn, cobrindo graficos de linha, dispersao, barras e distribuicoes.", motivoIndicacao: "Saber visualizar e parte essencial da analise; o curso entrega resultados visuais rapidos e bem fundamentados.", oQueAprende: ["Graficos de linha, barra e dispersao", "Visualizacao de distribuicoes", "Escolha do grafico certo para cada dado"], proximoConteudo: "Pandas (Kaggle Learn)" },
  { id: "kaggle-data-cleaning-analise", certificate: "sim", titulo: "Data Cleaning", canal: "Kaggle Learn", plataforma: "Kaggle", link: "https://www.kaggle.com/learn/data-cleaning", areaSlug: "analise-dados" as string | null, nivel: "Intermediário", duracao: "Cerca de 4 horas", idioma: "Inglês", descricao: "Curso dedicado a limpeza de dados: valores ausentes, escalonamento, inconsistencias de texto e problemas de codificacao e datas.", motivoIndicacao: "Limpeza costuma consumir a maior parte do tempo de um analista, e poucos cursos gratuitos tratam o tema com essa profundidade.", oQueAprende: ["Tratamento de dados faltantes", "Normalizacao e escalonamento", "Correcao de datas, encoding e entradas inconsistentes"], proximoConteudo: "Feature Engineering (Kaggle Learn)" },
  { id: "hashtag-canal-analise-dados", certificate: "nao", titulo: "Canal Hashtag Programacao", canal: "Hashtag Programacao", plataforma: "YouTube", link: "https://www.youtube.com/@HashtagProgramacao", areaSlug: "analise-dados" as string | null, nivel: "Iniciante", duracao: "Conteudo continuo", idioma: "Português", descricao: "Canal brasileiro com aulas gratuitas de analise de dados usando Python, Pandas e Jupyter, com projetos aplicados a situacoes reais.", motivoIndicacao: "Complemento pratico em portugues para fixar a teoria com exemplos do mercado brasileiro.", oQueAprende: ["Analise de dados com Pandas", "Uso do Jupyter na pratica", "Mini projetos de analise"], proximoConteudo: "Curso de analise de dados com Python da Hashtag" },
  { id: "ms-learn-plano-analista-dados", certificate: "nao_informado", titulo: "Treinamento para analistas de dados (plano de carreira)", canal: "Microsoft Learn", plataforma: "Microsoft Learn", link: "https://learn.microsoft.com/pt-br/training/career-paths/data-analyst", areaSlug: "analista-dados" as string | null, nivel: "Iniciante", duracao: "Trilha com varios modulos (autoinstrucional)", idioma: "Português", descricao: "Plano de carreira oficial da Microsoft, em portugues, que reune modulos para formar um analista de dados com foco em Power BI.", motivoIndicacao: "Trilha gratuita, estruturada e em portugues, que organiza o aprendizado do iniciante ate a preparacao para certificacao.", oQueAprende: ["Perfilamento, limpeza e transformacao de dados", "Modelagem de dados no Power BI", "Criacao de relatorios e recursos analiticos"], proximoConteudo: "Avaliacao pratica do exame PL-300" },
  { id: "dio-power-bi-analista-dados", certificate: "sim", titulo: "Formacao Power BI Analyst", canal: "DIO", plataforma: "DIO", link: "https://www.dio.me/curso-power-bi", areaSlug: "analista-dados" as string | null, nivel: "Iniciante", duracao: "Formacao com varios modulos e projetos", idioma: "Português", descricao: "Formacao gratuita em portugues que leva da fundamentacao em BI ate modelagem, DAX, storytelling e gerenciamento de workspaces no Power BI.", motivoIndicacao: "Combina teoria, projetos para portfolio e certificado, sendo uma trilha completa de analista de BI sem custo.", oQueAprende: ["Fundamentos de analise de dados e BI", "Modelagem e transformacao com DAX e Power Query", "Construcao de dashboards e storytelling com dados"], proximoConteudo: "Construcao de um dashboard de vendas para portfolio" },
  { id: "bradesco-intro-analise-analista-dados", certificate: "sim", titulo: "Introducao a Analise de Dados - Microsoft Power BI", canal: "Fundacao Bradesco / Microsoft", plataforma: "Escola Virtual (Fundacao Bradesco)", link: "https://www.ev.org.br/cursos/introducao-a-analise-de-dados-microsoft-power-bi", areaSlug: "analista-dados" as string | null, nivel: "Iniciante", duracao: "5 horas", idioma: "Português", descricao: "Curso introdutorio sobre o papel do analista de dados e as ferramentas do Power BI, com conteudo produzido pela Microsoft.", motivoIndicacao: "Apresenta de forma rapida e gratuita o que faz um analista de dados, com certificado ao final.", oQueAprende: ["Atribuicoes e tarefas do analista de dados", "Categorias de analise de dados", "Uso inicial do Power BI"], proximoConteudo: "Analise de Dados no Power BI (Escola Virtual)" },
  { id: "fcc-py-analise-dados-analista", certificate: "sim", titulo: "Analise de Dados com Python", canal: "freeCodeCamp", plataforma: "freeCodeCamp (em portugues)", link: "https://www.freecodecamp.org/portuguese/learn/data-analysis-with-python", areaSlug: "analista-dados" as string | null, nivel: "Intermediário", duracao: "Aprox. 30 horas (autoinstrucional)", idioma: "Português", descricao: "Certificacao gratuita em portugues que ensina o analista a trabalhar dados com Python, da importacao a analise exploratoria.", motivoIndicacao: "Para o analista que quer ir alem das ferramentas visuais e analisar dados com codigo, com certificacao gratuita.", oQueAprende: ["Leitura e limpeza de dados", "Analise exploratoria com Pandas", "Projetos avaliados"], proximoConteudo: "Visualizacao de dados (Kaggle Learn)" },
  { id: "kaggle-data-viz-analista", certificate: "sim", titulo: "Data Visualization", canal: "Kaggle Learn", plataforma: "Kaggle", link: "https://www.kaggle.com/learn/data-visualization", areaSlug: "analista-dados" as string | null, nivel: "Iniciante", duracao: "Cerca de 4 horas", idioma: "Inglês", descricao: "Curso pratico de visualizacao de dados com Seaborn, ensinando a escolher e construir os graficos mais comuns.", motivoIndicacao: "Visualizacao e parte central do trabalho do analista; o curso e curto, pratico e gratuito.", oQueAprende: ["Graficos de linha, barra e dispersao", "Distribuicoes e comparacoes", "Boas praticas de escolha de grafico"], proximoConteudo: "Pandas (Kaggle Learn)" },
  { id: "dio-power-bi-analista-bi", certificate: "sim", titulo: "Formacao Power BI Analyst", canal: "DIO", plataforma: "DIO", link: "https://www.dio.me/curso-power-bi", areaSlug: "analista-bi" as string | null, nivel: "Iniciante", duracao: "Formacao com varios modulos e projetos", idioma: "Português", descricao: "Formacao gratuita em portugues voltada a formar analistas de BI, cobrindo visualizacao, processamento, modelagem e gestao no Power BI.", motivoIndicacao: "E uma das trilhas gratuitas mais completas de BI em portugues, com projetos para portfolio e certificado.", oQueAprende: ["Fundamentos de BI e analise de dados", "Modelagem com DAX e Power Query", "Dashboards, storytelling e gestao de workspaces"], proximoConteudo: "Modelagem e transformacao de dados para portfolio" },
  { id: "bradesco-analise-dados-powerbi-bi", certificate: "sim", titulo: "Analise de Dados no Power BI", canal: "Fundacao Bradesco / Microsoft", plataforma: "Escola Virtual (Fundacao Bradesco)", link: "https://www.ev.org.br/cursos/analise-de-dados-no-power-bi", areaSlug: "analista-bi" as string | null, nivel: "Avançado", duracao: "4 horas", idioma: "Português", descricao: "Curso avancado da trilha de Power BI da Escola Virtual, com recursos de IA como Principais Influenciadores, Arvore Hierarquica e Perguntas e Respostas.", motivoIndicacao: "Aprofunda recursos analiticos do Power BI que vao alem do basico, de graca e em portugues, com certificado.", oQueAprende: ["Visuais de IA no Power BI", "Analise de causa raiz com Arvore Hierarquica", "Apresentacao coesa de relatorios"], proximoConteudo: "Pratica com datasets proprios no Power BI" },
  { id: "bradesco-intro-analise-bi", certificate: "sim", titulo: "Introducao a Analise de Dados - Microsoft Power BI", canal: "Fundacao Bradesco / Microsoft", plataforma: "Escola Virtual (Fundacao Bradesco)", link: "https://www.ev.org.br/cursos/introducao-a-analise-de-dados-microsoft-power-bi", areaSlug: "analista-bi" as string | null, nivel: "Iniciante", duracao: "5 horas", idioma: "Português", descricao: "Porta de entrada da trilha de Power BI, apresentando o papel do analista e os blocos de construcao da ferramenta.", motivoIndicacao: "Ideal como primeiro modulo antes do curso avancado de Power BI, gratuito e com certificado.", oQueAprende: ["Conceitos de dados e analise", "Funcoes na area de dados", "Servico e ferramentas do Power BI"], proximoConteudo: "Analise de Dados no Power BI (Escola Virtual)" },
  { id: "ms-learn-analista-bi", certificate: "nao_informado", titulo: "Treinamento para analistas de dados (plano de carreira)", canal: "Microsoft Learn", plataforma: "Microsoft Learn", link: "https://learn.microsoft.com/pt-br/training/career-paths/data-analyst", areaSlug: "analista-bi" as string | null, nivel: "Intermediário", duracao: "Trilha com varios modulos (autoinstrucional)", idioma: "Português", descricao: "Plano de carreira da Microsoft em portugues centrado em Power BI, com modulos de modelagem, visualizacao e relatorios.", motivoIndicacao: "Trilha oficial e gratuita que prepara o analista de BI inclusive para a certificacao PL-300.", oQueAprende: ["Modelagem de dados escalavel", "Recursos analiticos avancados em relatorios", "Preparo para certificacao PL-300"], proximoConteudo: "Avaliacao pratica do exame PL-300" },
  { id: "kaggle-advanced-sql-ae", certificate: "sim", titulo: "Advanced SQL", canal: "Kaggle Learn", plataforma: "Kaggle", link: "https://www.kaggle.com/learn/advanced-sql", areaSlug: "analytics-engineer" as string | null, nivel: "Avançado", duracao: "Cerca de 4 horas", idioma: "Inglês", descricao: "Curso de SQL avancado sobre BigQuery, com JOINs e UNIONs complexos, funcoes analiticas e tecnicas para consultas eficientes em grande escala.", motivoIndicacao: "SQL avancado e a competencia central do analytics engineer; o curso e gratuito e direto ao que a funcao exige.", oQueAprende: ["JOINs e UNIONs avancados", "Funcoes analiticas e janelas", "Consultas otimizadas em dados grandes"], proximoConteudo: "Modulos de modelagem e transformacao em data warehouse" },
  { id: "kaggle-intro-sql-ae", certificate: "sim", titulo: "Intro to SQL", canal: "Kaggle Learn", plataforma: "Kaggle", link: "https://www.kaggle.com/learn/intro-to-sql", areaSlug: "analytics-engineer" as string | null, nivel: "Intermediário", duracao: "Cerca de 3 horas", idioma: "Inglês", descricao: "Curso introdutorio de SQL usando Google BigQuery, do SELECT basico a agrupamentos e ordenacao de resultados.", motivoIndicacao: "Base obrigatoria antes do SQL avancado; ja usa um data warehouse real, contexto tipico do analytics engineer.", oQueAprende: ["SELECT, WHERE e FROM", "GROUP BY, HAVING e agregacoes", "Consultas em BigQuery"], proximoConteudo: "Advanced SQL (Kaggle Learn)" },
  { id: "kaggle-feature-engineering-ae", certificate: "sim", titulo: "Feature Engineering", canal: "Kaggle Learn", plataforma: "Kaggle", link: "https://www.kaggle.com/learn/feature-engineering", areaSlug: "analytics-engineer" as string | null, nivel: "Intermediário", duracao: "Cerca de 5 horas", idioma: "Inglês", descricao: "Curso sobre criacao e transformacao de variaveis para tornar os dados mais uteis, incluindo encoding, agregacoes e novas features derivadas.", motivoIndicacao: "Transformar dados brutos em tabelas analiticas confiaveis e parte do trabalho do analytics engineer; o curso cobre essa logica.", oQueAprende: ["Criacao de variaveis derivadas", "Target e count encoding", "Reducao de dimensionalidade aplicada a features"], proximoConteudo: "Pratica de modelagem analitica em SQL" },
  { id: "fcc-sql-databases-ae", certificate: "nao", titulo: "SQL and Databases - Full Course for Beginners", canal: "freeCodeCamp", plataforma: "YouTube (freeCodeCamp.org)", link: "https://www.freecodecamp.org/news/sql-and-databases-full-course/", areaSlug: "analytics-engineer" as string | null, nivel: "Iniciante", duracao: "Cerca de 4 horas", idioma: "Inglês", descricao: "Curso completo de SQL e bancos de dados com MySQL, cobrindo design de schema, CRUD, joins, subconsultas, triggers e diagramas ER.", motivoIndicacao: "Aborda modelagem de banco e relacionamentos, conhecimento essencial para quem estrutura camadas de dados; gratuito e sem anuncios.", oQueAprende: ["Design de tabelas, chaves e schema", "CRUD, joins e subconsultas", "Triggers e diagramas entidade relacionamento"], proximoConteudo: "Advanced SQL (Kaggle Learn)" },
  { id: "kaggle-intro-ml-cientista", certificate: "sim", titulo: "Intro to Machine Learning", canal: "Kaggle Learn", plataforma: "Kaggle", link: "https://www.kaggle.com/learn/intro-to-machine-learning", areaSlug: "cientista-dados" as string | null, nivel: "Intermediário", duracao: "Cerca de 3 horas", idioma: "Inglês", descricao: "Curso que introduz as ideias centrais de machine learning e ensina a construir e validar os primeiros modelos preditivos.", motivoIndicacao: "E o primeiro passo classico para a ciencia de dados, com pratica imediata em modelos reais e gratuito.", oQueAprende: ["Como modelos de ML aprendem", "Construcao de arvores de decisao e random forests", "Validacao e overfitting"], proximoConteudo: "Intermediate Machine Learning e Feature Engineering (Kaggle Learn)" },
  { id: "kaggle-python-cientista", certificate: "sim", titulo: "Python", canal: "Kaggle Learn", plataforma: "Kaggle", link: "https://www.kaggle.com/learn/python", areaSlug: "cientista-dados" as string | null, nivel: "Iniciante", duracao: "Cerca de 5 horas", idioma: "Inglês", descricao: "Curso de Python orientado a ciencia de dados, cobrindo a linguagem do zero ate uso de bibliotecas.", motivoIndicacao: "Python e a base de quase todo trabalho de cientista de dados; o curso prepara o terreno gratuitamente.", oQueAprende: ["Sintaxe e estruturas de Python", "Funcoes e logica", "Uso de bibliotecas externas"], proximoConteudo: "Pandas (Kaggle Learn)" },
  { id: "kaggle-pandas-cientista", certificate: "sim", titulo: "Pandas", canal: "Kaggle Learn", plataforma: "Kaggle", link: "https://www.kaggle.com/learn/pandas", areaSlug: "cientista-dados" as string | null, nivel: "Intermediário", duracao: "Cerca de 4 horas", idioma: "Inglês", descricao: "Curso pratico de manipulacao de dados com Pandas, em desafios curtos e aplicados.", motivoIndicacao: "Manipulacao de dados e pre-requisito para qualquer modelagem; o curso e enxuto e gratuito.", oQueAprende: ["DataFrames e selecao de dados", "Agrupamentos e combinacoes", "Tratamento de dados ausentes"], proximoConteudo: "Data Cleaning (Kaggle Learn)" },
  { id: "kaggle-intro-deep-learning-cientista", certificate: "sim", titulo: "Intro to Deep Learning", canal: "Kaggle Learn", plataforma: "Kaggle", link: "https://www.kaggle.com/learn/intro-to-deep-learning", areaSlug: "cientista-dados" as string | null, nivel: "Avançado", duracao: "Cerca de 4 horas", idioma: "Inglês", descricao: "Curso que ensina a construir e treinar redes neurais com TensorFlow e Keras para dados estruturados.", motivoIndicacao: "Para o cientista que ja domina o basico e quer entrar em deep learning, com pratica real e gratuito.", oQueAprende: ["Redes neurais e camadas densas", "Treinamento com TensorFlow e Keras", "Tecnicas contra overfitting como dropout"], proximoConteudo: "Computer Vision (Kaggle Learn)" },
  { id: "kaggle-time-series-cientista", certificate: "sim", titulo: "Time Series", canal: "Kaggle Learn", plataforma: "Kaggle", link: "https://www.kaggle.com/learn/time-series", areaSlug: "cientista-dados" as string | null, nivel: "Avançado", duracao: "Cerca de 4 horas", idioma: "Inglês", descricao: "Curso de previsao com series temporais, cobrindo tendencia, sazonalidade e modelos aplicados a problemas reais de forecasting.", motivoIndicacao: "Previsao temporal e demanda comum em projetos de dados; poucos cursos gratuitos tratam o tema tao bem.", oQueAprende: ["Tendencia e sazonalidade", "Features para series temporais", "Modelos de previsao aplicados"], proximoConteudo: "Machine Learning Explainability (Kaggle Learn)" },
  { id: "kaggle-geospatial-cientista", certificate: "sim", titulo: "Geospatial Analysis", canal: "Kaggle Learn", plataforma: "Kaggle", link: "https://www.kaggle.com/learn/geospatial-analysis", areaSlug: "cientista-dados" as string | null, nivel: "Intermediário", duracao: "Cerca de 4 horas", idioma: "Inglês", descricao: "Curso para analisar dados geograficos, criar mapas interativos e descobrir padroes espaciais.", motivoIndicacao: "Adiciona uma especializacao util e diferenciada ao cientista de dados, gratuitamente.", oQueAprende: ["Manipulacao de dados geoespaciais", "Criacao de mapas interativos", "Analise de proximidade e padroes espaciais"], proximoConteudo: "Projetos proprios com dados geograficos" },
  { id: "fcc-py-analise-dados-cientista", certificate: "sim", titulo: "Analise de Dados com Python", canal: "freeCodeCamp", plataforma: "freeCodeCamp (em portugues)", link: "https://www.freecodecamp.org/portuguese/learn/data-analysis-with-python", areaSlug: "cientista-dados" as string | null, nivel: "Intermediário", duracao: "Aprox. 30 horas (autoinstrucional)", idioma: "Português", descricao: "Certificacao em portugues sobre analise de dados com Python, NumPy e Pandas, base solida antes da modelagem.", motivoIndicacao: "Da ao futuro cientista de dados uma base pratica em portugues, com certificacao gratuita.", oQueAprende: ["Leitura e limpeza de dados", "Analise exploratoria com Pandas", "Projetos avaliados"], proximoConteudo: "Intro to Machine Learning (Kaggle Learn)" },
  { id: "ms-learn-engenharia-dados", certificate: "nao_informado", titulo: "Treinamento para Engenheiros de Dados (plano de carreira)", canal: "Microsoft Learn", plataforma: "Microsoft Learn", link: "https://learn.microsoft.com/pt-br/training/career-paths/data-engineer", areaSlug: "engenharia-dados" as string | null, nivel: "Intermediário", duracao: "Trilha com varios modulos (autoinstrucional)", idioma: "Português", descricao: "Plano de carreira oficial da Microsoft, em portugues, com modulos sobre integracao, transformacao e consolidacao de dados, pipelines e armazenamento.", motivoIndicacao: "E a trilha gratuita mais estruturada de engenharia de dados em portugues, organizando o caminho ate a certificacao DP-203.", oQueAprende: ["Integracao e transformacao de dados", "Construcao de pipelines de dados", "Armazenamento e solucoes de analise"], proximoConteudo: "Avaliacao pratica do exame DP-203" },
  { id: "bradesco-administrando-banco-dados-eng", certificate: "sim", titulo: "Administrando Banco de Dados", canal: "Fundacao Bradesco", plataforma: "Escola Virtual (Fundacao Bradesco)", link: "https://www.ev.org.br/cursos/administrando-banco-de-dados", areaSlug: "engenharia-dados" as string | null, nivel: "Avançado", duracao: "15 horas", idioma: "Português", descricao: "Curso sobre administracao de banco de dados, arquitetura de SGBD, modelos de dados, SQL, esquemas, instancias e tabelas, alem da rotina de manutencao.", motivoIndicacao: "Fundamentos de banco de dados sao base da engenharia de dados; este curso e gratuito, em portugues e com certificado.", oQueAprende: ["Arquitetura de um SGBD", "Modelos de dados, esquemas e SQL", "Gerenciamento e manutencao de bases"], proximoConteudo: "Intro to SQL e Advanced SQL (Kaggle Learn)" },
  { id: "dio-sql-engenharia-dados", certificate: "sim", titulo: "Formacao SQL Database Specialist", canal: "DIO", plataforma: "DIO", link: "https://www.dio.me/curso-sql", areaSlug: "engenharia-dados" as string | null, nivel: "Intermediário", duracao: "Formacao com varios modulos e projetos", idioma: "Português", descricao: "Formacao gratuita que ensina a modelar bancos de dados conforme regras de negocio e a construir, de ponta a ponta, um banco para um e-commerce com MySQL.", motivoIndicacao: "Modelagem e SQL aplicados sao a base do engenheiro de dados; a formacao entrega projeto pratico, portfolio e certificado.", oQueAprende: ["Modelagem entidade relacional", "Consultas e tecnicas avancadas em MySQL", "Transacoes, backup e recovery"], proximoConteudo: "Plano de Engenheiros de Dados (Microsoft Learn)" },
  { id: "kaggle-advanced-sql-eng", certificate: "sim", titulo: "Advanced SQL", canal: "Kaggle Learn", plataforma: "Kaggle", link: "https://www.kaggle.com/learn/advanced-sql", areaSlug: "engenharia-dados" as string | null, nivel: "Avançado", duracao: "Cerca de 4 horas", idioma: "Inglês", descricao: "Curso de SQL avancado em BigQuery, com joins complexos, funcoes analiticas e consultas eficientes em grandes volumes.", motivoIndicacao: "SQL eficiente em data warehouse e tarefa diaria na engenharia de dados; o curso e gratuito e usa um warehouse real.", oQueAprende: ["JOINs e UNIONs avancados", "Funcoes analiticas", "Otimizacao de consultas em grande escala"], proximoConteudo: "Modulos de pipelines no plano da Microsoft" },
  { id: "fcc-sql-databases-eng", certificate: "nao", titulo: "SQL and Databases - Full Course for Beginners", canal: "freeCodeCamp", plataforma: "YouTube (freeCodeCamp.org)", link: "https://www.freecodecamp.org/news/sql-and-databases-full-course/", areaSlug: "engenharia-dados" as string | null, nivel: "Iniciante", duracao: "Cerca de 4 horas", idioma: "Inglês", descricao: "Curso completo de SQL e bancos com MySQL, do design de schema a CRUD, joins, subconsultas, triggers e diagramas ER.", motivoIndicacao: "Cobre modelagem e relacionamentos de banco, base estrutural para a engenharia de dados; gratuito e sem anuncios.", oQueAprende: ["Design de schema e chaves", "CRUD, joins e subconsultas", "Triggers e diagramas ER"], proximoConteudo: "Administrando Banco de Dados (Escola Virtual)" },
  { id: "android-basics-compose-google", certificate: "nao", titulo: "Android Basics with Compose", canal: "Android Developers (Google)", plataforma: "Android Developers", link: "https://developer.android.com/courses/android-basics-compose/course", areaSlug: "mobile" as string | null, nivel: "Iniciante", duracao: "Aproximadamente 100 horas (autoguiado)", idioma: "Inglês", descricao: "Curso oficial do Google que parte do zero e ensina a construir aplicativos Android usando Kotlin e Jetpack Compose, com codelabs praticos e quizzes a cada unidade.", motivoIndicacao: "E a trilha recomendada pelo proprio Google para quem nunca programou, totalmente gratuita e sempre atualizada com as praticas atuais de Android.", oQueAprende: ["Fundamentos de Kotlin", "Interfaces com Jetpack Compose", "Arquitetura de apps e armazenamento de dados", "Consumo de APIs e exibicao de listas"], proximoConteudo: "Jetpack Compose for Android Developers (nivel intermediario)" },
  { id: "dio-mobile-nativo-android", certificate: "sim", titulo: "Desenvolvimento Mobile Nativo Para Android", canal: "DIO", plataforma: "DIO", link: "https://www.dio.me/courses/desenvolvimento-mobile-nativo-para-android", areaSlug: "mobile" as string | null, nivel: "Iniciante", duracao: "Curta (modulos introdutorios)", idioma: "Português", descricao: "Curso introdutorio em portugues sobre desenvolvimento mobile nativo para Android, cobrindo o ambiente de desenvolvimento e a estrutura de projetos.", motivoIndicacao: "Otimo ponto de partida em portugues para entender como funciona um projeto Android antes de mergulhar em codigo mais avancado.", oQueAprende: ["Introducao ao desenvolvimento mobile", "Configuracao do ambiente Android", "Estrutura de um projeto Android"], proximoConteudo: "Android Basics with Compose do Google" },
  { id: "codelabs-android-google", certificate: "nao", titulo: "Android Codelabs", canal: "Android Developers (Google)", plataforma: "Google Codelabs", link: "https://developer.android.com/get-started/codelabs", areaSlug: "mobile" as string | null, nivel: "Intermediário", duracao: "Variavel (cada codelab leva de 30 a 90 minutos)", idioma: "Inglês", descricao: "Coletanea oficial de tutoriais praticos curtos do Google que mostram passo a passo como implementar recursos especificos de apps Android.", motivoIndicacao: "Perfeito para praticar topicos pontuais sob demanda e fixar o que se aprende nas trilhas maiores, sempre com material oficial.", oQueAprende: ["Implementacao guiada de recursos Android", "Boas praticas de codigo", "Uso de bibliotecas Jetpack"], proximoConteudo: "Trilha de arquitetura de apps Android" },
  { id: "android-dev-kotlin-classroom", certificate: "nao", titulo: "Desenvolvimento para Android com Kotlin (curso para sala de aula)", canal: "Android Developers (Google)", plataforma: "Android Developers", link: "https://developer.android.com/courses/android-development-with-kotlin/course", areaSlug: "android-nativo" as string | null, nivel: "Intermediário", duracao: "Curso completo (varias unidades)", idioma: "Inglês", descricao: "Curso oficial estruturado para ensino formal que cobre o desenvolvimento Android nativo usando a linguagem Kotlin.", motivoIndicacao: "Material oficial e gratuito pensado para um aprendizado estruturado de Android nativo com Kotlin, util tambem para autoestudo.", oQueAprende: ["Sintaxe e recursos de Kotlin", "Ciclo de vida de Activities", "Componentes de UI nativos", "Persistencia de dados"], proximoConteudo: "Trilha de arquitetura de apps Android" },
  { id: "android-jetpack-compose-devs", certificate: "nao", titulo: "Jetpack Compose for Android Developers", canal: "Android Developers (Google)", plataforma: "Android Developers", link: "https://developer.android.com/courses/jetpack-compose/course", areaSlug: "android-nativo" as string | null, nivel: "Intermediário", duracao: "5 trilhas (pathways)", idioma: "Inglês", descricao: "Curso oficial dividido em cinco trilhas que aprofunda o uso do Jetpack Compose para criar interfaces nativas modernas no Android.", motivoIndicacao: "Indicado para quem ja conhece o basico e quer dominar o toolkit de UI atual e recomendado pelo Google para Android.", oQueAprende: ["Funcoes composable", "Layouts, tema e animacao", "Arquitetura e estado", "Acessibilidade, testes e performance"], proximoConteudo: "Trilha de Kotlin Multiplatform" },
  { id: "android-architecture-pathway", certificate: "nao", titulo: "Android App Architecture (trilha)", canal: "Android Developers (Google)", plataforma: "Android Developers", link: "https://developer.android.com/courses/pathways/android-architecture", areaSlug: "android-nativo" as string | null, nivel: "Intermediário", duracao: "Trilha (varios codelabs)", idioma: "Inglês", descricao: "Trilha oficial que apresenta as boas praticas e a arquitetura recomendada para construir apps Android robustos e de qualidade de producao.", motivoIndicacao: "Essencial para sair do nivel iniciante e estruturar apps de forma profissional, com camadas bem definidas.", oQueAprende: ["Camadas de arquitetura recomendada", "ViewModel e gerenciamento de estado", "Boas praticas de testabilidade"], proximoConteudo: "Trilha de acessibilidade em apps Android" },
  { id: "android-acessibilidade-pathway", certificate: "nao", titulo: "Acessibilidade em apps Android (trilha)", canal: "Android Developers (Google)", plataforma: "Android Developers", link: "https://developer.android.com/courses/pathways/make-your-android-app-accessible", areaSlug: "android-nativo" as string | null, nivel: "Intermediário", duracao: "Trilha (varios codelabs)", idioma: "Inglês", descricao: "Trilha oficial que ensina a tornar aplicativos Android utilizaveis por todas as pessoas, incluindo quem tem necessidades de acessibilidade.", motivoIndicacao: "Acessibilidade e diferencial de mercado e requisito de qualidade; este material oficial cobre o tema de forma pratica.", oQueAprende: ["Principios de acessibilidade", "Suporte a leitores de tela", "Ajustes de contraste e navegacao"], proximoConteudo: "Trilha de arquitetura de apps Android" },
  { id: "dio-android-kotlin-curso-pt", certificate: "sim", titulo: "Curso Desenvolvedor Android com Kotlin (modulos gratuitos)", canal: "DIO", plataforma: "DIO", link: "https://www.dio.me/curso-android-kotlin", areaSlug: "android-nativo" as string | null, nivel: "Iniciante", duracao: "Modulos com atividades praticas", idioma: "Português", descricao: "Conteudo em portugues que apresenta a linguagem Kotlin e os fundamentos para criacao de apps Android, com projetos praticos de portfolio.", motivoIndicacao: "Boa opcao em portugues para quem prefere comecar Android nativo no idioma nativo antes de partir para o material oficial em ingles.", oQueAprende: ["Linguagem Kotlin", "Fundamentos de Android", "Android Jetpack", "Projeto pratico de app"], proximoConteudo: "Android Basics with Compose do Google" },
  { id: "kotlin-iniciantes-stackmobile-yt", certificate: "nao", titulo: "Curso de Kotlin Para Iniciantes - Programacao Mobile", canal: "Stack Mobile (YouTube)", plataforma: "YouTube", link: "https://www.youtube.com/playlist?list=PLizN3WA8HR1z1HJy0uSjNe4zhmzJNplb3", areaSlug: "android-nativo" as string | null, nivel: "Iniciante", duracao: "Playlist com varias aulas", idioma: "Português", descricao: "Playlist em portugues que ensina os fundamentos da linguagem Kotlin, a linguagem oficial recomendada pelo Google para Android.", motivoIndicacao: "Aulas em portugues e gratuitas para quem quer dominar Kotlin antes de construir apps, com ritmo de iniciante.", oQueAprende: ["Sintaxe basica de Kotlin", "Variaveis, funcoes e tipos", "Logica aplicada a mobile"], proximoConteudo: "Curso Android com Kotlin da DIO" },
  { id: "apple-develop-in-swift-tutorials", certificate: "nao", titulo: "Develop in Swift Tutorials", canal: "Apple", plataforma: "Apple Developer", link: "https://developer.apple.com/tutorials/develop-in-swift", areaSlug: "ios-nativo" as string | null, nivel: "Iniciante", duracao: "Serie de tutoriais (autoguiado)", idioma: "Inglês", descricao: "Tutoriais oficiais da Apple que ensinam a programar em Swift e a construir apps para o ecossistema Apple do zero.", motivoIndicacao: "Por ser material oficial da Apple, e a fonte mais confiavel e atualizada para iniciar em desenvolvimento iOS de forma gratuita.", oQueAprende: ["Fundamentos de Swift", "Construcao de apps com SwiftUI", "Modelagem de dados", "Boas praticas Apple"], proximoConteudo: "Tutoriais de SwiftUI da Apple" },
  { id: "apple-swiftui-tutorials", certificate: "nao", titulo: "Introducing SwiftUI", canal: "Apple", plataforma: "Apple Developer", link: "https://developer.apple.com/tutorials/swiftui", areaSlug: "ios-nativo" as string | null, nivel: "Intermediário", duracao: "Serie de tutoriais (autoguiado)", idioma: "Inglês", descricao: "Tutoriais oficiais da Apple focados em SwiftUI, o framework declarativo para criar interfaces em todas as plataformas Apple.", motivoIndicacao: "SwiftUI e o caminho atual para UI no iOS; este material oficial e gratuito mostra na pratica como montar telas e fluxos.", oQueAprende: ["Criacao de views com SwiftUI", "Estado e ligacao de dados", "Navegacao e listas", "Animacoes"], proximoConteudo: "Aprofundar em arquitetura de apps iOS" },
  { id: "dio-react-native-curso-pt", certificate: "sim", titulo: "Curso React Native Developer (modulos gratuitos)", canal: "DIO", plataforma: "DIO", link: "https://www.dio.me/curso-react-native", areaSlug: "react-native" as string | null, nivel: "Iniciante", duracao: "Modulos com atividades praticas", idioma: "Português", descricao: "Conteudo em portugues que ensina a criar aplicacoes moveis com React Native usando JavaScript e TypeScript, da interface ate integracao com APIs.", motivoIndicacao: "Trilha em portugues com projetos praticos de portfolio, boa para quem ja conhece um pouco de JavaScript e quer entrar no mobile.", oQueAprende: ["Fundamentos de React Native", "Navegacao entre telas", "Componentes e estado", "Consumo de APIs"], proximoConteudo: "Tutorial pratico de React Native no YouTube" },
  { id: "rn-tutorial-iniciante-yt", certificate: "nao", titulo: "Tutorial Iniciante de React Native (Curso Pratico Completo)", canal: "YouTube (curso em portugues)", plataforma: "YouTube", link: "https://www.youtube.com/playlist?list=PLUbb2i4BuuzBrD7yLahzYlM5WPCDv_vGl", areaSlug: "react-native" as string | null, nivel: "Iniciante", duracao: "Playlist com varias aulas", idioma: "Português", descricao: "Curso pratico e gratuito em portugues que mostra como construir aplicativos moveis do zero com React Native.", motivoIndicacao: "Abordagem mao na massa em portugues, ideal para acompanhar codando junto e montar o primeiro app.", oQueAprende: ["Configuracao do ambiente React Native", "Componentes basicos", "Estilizacao e layout", "Construcao de um app pratico"], proximoConteudo: "Aprofundar com Expo e integracao de APIs" },
  { id: "freecodecamp-react-native-pt", certificate: "nao", titulo: "Aprenda React Native (artigos)", canal: "freeCodeCamp em Portugues", plataforma: "freeCodeCamp", link: "https://www.freecodecamp.org/portuguese/news/aprenda-react-native/", areaSlug: "react-native" as string | null, nivel: "Iniciante", duracao: "Leitura e pratica autoguiada", idioma: "Português", descricao: "Material em portugues do freeCodeCamp que introduz os conceitos centrais do React Native para iniciar no desenvolvimento mobile multiplataforma.", motivoIndicacao: "freeCodeCamp e uma referencia gratuita e confiavel; o conteudo em portugues ajuda a fixar conceitos sem custo.", oQueAprende: ["Conceitos centrais do React Native", "Componentes e props", "Primeiros passos no mobile"], proximoConteudo: "Tutorial pratico de React Native no YouTube" },
  { id: "flutter-learn-pathway-oficial", certificate: "nao", titulo: "Learn Flutter (trilha oficial)", canal: "Flutter (Google)", plataforma: "docs.flutter.dev", link: "https://docs.flutter.dev/get-started/learn-flutter", areaSlug: "flutter" as string | null, nivel: "Iniciante", duracao: "Trilha autoguiada", idioma: "Inglês", descricao: "Trilha oficial de aprendizado do Flutter que reune os recursos recomendados pela equipe do Google para comecar do zero.", motivoIndicacao: "Fonte oficial, gratuita e sempre atualizada; o melhor ponto de partida confiavel para Flutter.", oQueAprende: ["Estrutura de um app Flutter", "Widgets e layout", "Gerenciamento de estado basico", "Recursos recomendados de estudo"], proximoConteudo: "Codelab oficial de introducao ao Flutter" },
  { id: "flutter-codelab-oficial", certificate: "nao", titulo: "Write your first Flutter app (codelab)", canal: "Flutter (Google)", plataforma: "docs.flutter.dev", link: "https://docs.flutter.dev/get-started/codelab", areaSlug: "flutter" as string | null, nivel: "Iniciante", duracao: "Aproximadamente 1 a 2 horas", idioma: "Inglês", descricao: "Codelab oficial que guia a criacao do primeiro aplicativo Flutter passo a passo.", motivoIndicacao: "Pratica guiada e rapida para sair do zero ao primeiro app rodando, direto da documentacao oficial.", oQueAprende: ["Criacao de projeto Flutter", "Composicao de widgets", "Interatividade basica", "Execucao do app"], proximoConteudo: "Introducao a linguagem Dart" },
  { id: "dart-language-oficial", certificate: "nao", titulo: "Introduction to Dart", canal: "Dart (Google)", plataforma: "dart.dev", link: "https://dart.dev/language", areaSlug: "flutter" as string | null, nivel: "Iniciante", duracao: "Leitura e pratica autoguiada", idioma: "Inglês", descricao: "Documentacao oficial da linguagem Dart, base do Flutter, cobrindo sintaxe e principais conceitos.", motivoIndicacao: "Entender Dart acelera muito o aprendizado de Flutter; este e o material oficial e gratuito da linguagem.", oQueAprende: ["Sintaxe de Dart", "Tipos e null safety", "Funcoes e classes", "Programacao assincrona"], proximoConteudo: "Aprofundar em widgets e estado no Flutter" },
  { id: "flutter-para-iniciantes-livro", certificate: "nao", titulo: "Flutter para Iniciantes", canal: "Rubens de Melo", plataforma: "flutterparainiciantes.com.br", link: "https://flutterparainiciantes.com.br/", areaSlug: "flutter" as string | null, nivel: "Iniciante", duracao: "Livro online (autoguiado)", idioma: "Português", descricao: "Livro online e aberto, em portugues, mantido desde 2019, que ensina Flutter e Dart de forma progressiva para iniciantes.", motivoIndicacao: "Conteudo gratuito e bem cuidado em portugues, otimo para quem prefere aprender lendo no proprio idioma.", oQueAprende: ["Fundamentos de Dart", "Estrutura de apps Flutter", "Widgets essenciais", "Boas praticas iniciais"], proximoConteudo: "Curso completo de Flutter da Flutterando no YouTube" },
  { id: "flutterando-curso-completo-yt", certificate: "nao", titulo: "Curso COMPLETO de Flutter", canal: "Flutterando (YouTube)", plataforma: "YouTube", link: "https://www.youtube.com/playlist?list=PLlBnICoI-g-d-J57QIz6Tx5xtUDGQdBFB", areaSlug: "flutter" as string | null, nivel: "Iniciante", duracao: "Playlist com varias aulas", idioma: "Português", descricao: "Curso gratuito em portugues da comunidade Flutterando, referencia brasileira em Flutter, cobrindo do basico em diante.", motivoIndicacao: "A Flutterando e a maior comunidade brasileira de Flutter; o curso e gratuito e bastante didatico em portugues.", oQueAprende: ["Fundamentos de Flutter e Dart", "Construcao de interfaces", "Navegacao", "Boas praticas da comunidade"], proximoConteudo: "Documentacao oficial do Flutter para aprofundar" },
  { id: "flutterando-canal", certificate: "nao", titulo: "Canal Flutterando (tutoriais e series)", canal: "Flutterando (YouTube)", plataforma: "YouTube", link: "https://www.youtube.com/@Flutterando", areaSlug: "flutter" as string | null, nivel: "Intermediário", duracao: "Conteudo continuo", idioma: "Português", descricao: "Canal da comunidade Flutterando com series, tutoriais e conteudos avancados sobre Flutter em portugues.", motivoIndicacao: "Fonte continua e gratuita em portugues para evoluir alem do basico, com temas de arquitetura e estado.", oQueAprende: ["Gerenciamento de estado", "Arquitetura de apps Flutter", "Pacotes e integracoes", "Boas praticas avancadas"], proximoConteudo: "Praticar com projetos proprios em Flutter" },
  { id: "godot-docs-pt-br", certificate: "nao", titulo: "Documentacao oficial da Godot Engine (pt-BR)", canal: "Godot Engine", plataforma: "docs.godotengine.org", link: "https://docs.godotengine.org/pt_br/4.x/getting_started/introduction/index.html", areaSlug: "gamedev" as string | null, nivel: "Iniciante", duracao: "Leitura e pratica autoguiada", idioma: "Português", descricao: "Documentacao oficial da Godot, engine gratuita e open source, com a secao de primeiros passos traduzida para portugues.", motivoIndicacao: "Material oficial, gratuito e em portugues; base solida para aprender uma engine 100 por cento livre.", oQueAprende: ["Conceitos basicos da Godot", "Cenas e nos", "Linguagem GDScript", "Estrutura de um projeto de jogo"], proximoConteudo: "Minicurso de Godot para iniciantes no YouTube" },
  { id: "godot-minicurso-iniciantes-yt", certificate: "nao", titulo: "Aprenda Godot: Minicurso completo para Iniciantes", canal: "YouTube (curso em portugues)", plataforma: "YouTube", link: "https://www.youtube.com/playlist?list=PLXiMbAkZF_BlKDfPoIOwFmmzC4dHX1eQt", areaSlug: "gamedev" as string | null, nivel: "Iniciante", duracao: "Playlist (minicurso)", idioma: "Português", descricao: "Minicurso gratuito em portugues que ensina Godot 4 do zero criando um jogo completo passo a passo.", motivoIndicacao: "Abordagem pratica em portugues para quem quer ver um jogo nascendo do inicio ao fim com a Godot.", oQueAprende: ["Interface da Godot", "Criacao de cenas e personagens", "Logica de jogo com GDScript", "Montagem de um jogo completo"], proximoConteudo: "Documentacao oficial da Godot para aprofundar" },
  { id: "unity-learn-oficial", certificate: "nao", titulo: "Unity Learn", canal: "Unity", plataforma: "Unity Learn", link: "https://learn.unity.com/", areaSlug: "gamedev" as string | null, nivel: "Iniciante", duracao: "Varios cursos e tutoriais (autoguiado)", idioma: "Inglês", descricao: "Plataforma oficial da Unity com cursos e tutoriais gratuitos para aprender a criar jogos com a engine Unity.", motivoIndicacao: "Fonte oficial e gratuita da Unity, com trilhas guiadas para quem quer entrar no desenvolvimento de jogos com uma das engines mais usadas.", oQueAprende: ["Fundamentos da Unity", "Scripting em C#", "Fisica e cenas", "Publicacao de jogos"], proximoConteudo: "Projetos praticos de jogos 2D na Unity" },
  { id: "dio-unity-3d-curso-pt", certificate: "sim", titulo: "Curso Unity 3D - Construa seu proprio jogo Zelda (modulos gratuitos)", canal: "DIO", plataforma: "DIO", link: "https://www.dio.me/curso-unity-3d", areaSlug: "gamedev" as string | null, nivel: "Iniciante", duracao: "Modulos com atividades praticas", idioma: "Português", descricao: "Conteudo em portugues que ensina os primeiros passos com Unity 3D e a construir um clone inspirado em Zelda como projeto de portfolio.", motivoIndicacao: "Opcao em portugues com um projeto pratico motivador para quem quer comecar gamedev com Unity no idioma nativo.", oQueAprende: ["Primeiros passos com Unity", "Programacao em Unity", "Tecnicas artisticas basicas", "Construcao de um jogo completo"], proximoConteudo: "Unity Learn oficial para aprofundar" },
  { id: "recriando-games-canal-yt", certificate: "nao", titulo: "Canal Recriando Games (desenvolvimento de jogos)", canal: "Recriando Games (YouTube)", plataforma: "YouTube", link: "https://www.youtube.com/@RecriandoGames", areaSlug: "gamedev" as string | null, nivel: "Intermediário", duracao: "Conteudo continuo", idioma: "Português", descricao: "Canal em portugues voltado ao desenvolvimento de jogos usando diversas engines, incluindo Unity, Unreal e Godot.", motivoIndicacao: "Fonte continua e gratuita em portugues para quem quer ver na pratica a recriacao de jogos em diferentes engines.", oQueAprende: ["Recriacao de mecanicas de jogos", "Uso de diferentes engines", "Logica de gameplay", "Boas praticas de producao"], proximoConteudo: "Aprofundar em uma engine especifica (Unity ou Godot)" },
  {
    id: "ms-learn-introducao-conceitos-ia",
    certificate: "nao_informado",
    titulo: "Introdução aos conceitos de IA",
    canal: "Microsoft Learn",
    plataforma: "Microsoft Learn",
    link: "https://learn.microsoft.com/pt-br/training/modules/get-started-ai-fundamentals/",
    areaSlug: "ia" as string | null,
    nivel: "Iniciante",
    duracao: "Cerca de 1 hora",
    idioma: "Português",
    descricao:
      "Módulo introdutório que apresenta o que é inteligência artificial e os principais tipos de solução que ela viabiliza, com atenção ao uso responsável.",
    motivoIndicacao:
      "Ponto de partida confiável e gratuito de fonte oficial, com linguagem acessível para quem nunca teve contato com o tema.",
    oQueAprende: [
      "O que é IA e onde ela aparece",
      "Noções de IA generativa e agentes",
      "Visão geral de linguagem, fala e visão",
      "Princípios de IA responsável",
    ],
    proximoConteudo: "Introdução aos aplicativos e agentes de IA no Azure",
  },
  {
    id: "ms-learn-transformar-empresa-com-ia",
    certificate: "nao_informado",
    titulo: "Transformar sua empresa com IA",
    canal: "Microsoft Learn",
    plataforma: "Microsoft Learn",
    link: "https://learn.microsoft.com/pt-br/training/paths/transform-your-business-with-microsoft-ai/",
    areaSlug: "ia" as string | null,
    nivel: "Iniciante",
    duracao: "Cerca de 2 a 3 horas",
    idioma: "Português",
    descricao:
      "Roteiro voltado a líderes e gestores que querem entender como adotar IA na organização, com estratégia, valor e práticas responsáveis.",
    motivoIndicacao:
      "Preenche uma lacuna pouco coberta em cursos gratuitos: a visão de negócio e gestão da IA.",
    oQueAprende: [
      "Aproveitar ferramentas de IA na empresa",
      "Transformar experimentos em resultados",
      "Adotar IA responsável",
      "Escalar a IA na organização",
    ],
    proximoConteudo: "Módulo Introdução aos conceitos de IA",
  },
  {
    id: "ms-learn-ia-generativa-para-iniciantes",
    certificate: "nao",
    titulo: "IA Generativa para Iniciantes (série de 18 lições)",
    canal: "Microsoft Cloud Advocates",
    plataforma: "Microsoft Learn (Shows)",
    link: "https://learn.microsoft.com/pt-br/shows/generative-ai-for-beginners/",
    areaSlug: "ia" as string | null,
    nivel: "Iniciante",
    duracao: "18 lições em vídeo",
    idioma: "Inglês",
    descricao:
      "Série em vídeo com 18 lições que ensina os fundamentos para construir aplicações de IA generativa, com repositório aberto no GitHub.",
    motivoIndicacao:
      "Curso completo e gratuito mantido por especialistas da Microsoft, com material aberto para pôr a mão no código.",
    oQueAprende: [
      "Fundamentos de IA generativa e LLMs",
      "Construir aplicações com modelos generativos",
      "Boas práticas de prompts",
      "Uso responsável",
    ],
    proximoConteudo: "Desenvolver aplicativos de IA generativos no Azure",
  },
  {
    id: "ms-learn-introducao-apps-agentes-ia-azure",
    certificate: "nao_informado",
    titulo: "Introdução aos aplicativos e agentes de IA no Azure",
    canal: "Microsoft Learn",
    plataforma: "Microsoft Learn",
    link: "https://learn.microsoft.com/pt-br/training/paths/get-started-ai-apps-agents/",
    areaSlug: "ia" as string | null,
    nivel: "Iniciante",
    duracao: "Cerca de 4 a 5 horas",
    idioma: "Português",
    descricao:
      "Roteiro que introduz cargas de trabalho de IA no Microsoft Foundry, cobrindo generativa, agentes, texto, fala e visão, com exercícios em Python.",
    motivoIndicacao:
      "Dá uma visão prática e ampla das principais aplicações de IA em uma só trilha.",
    oQueAprende: [
      "Começar a usar IA no Azure",
      "IA generativa e agentes",
      "Análise de texto, fala e visão",
      "Extração de informações com IA",
    ],
    proximoConteudo: "Desenvolver aplicativos de IA generativos no Azure",
  },
  {
    id: "ms-learn-desenvolver-apps-ia-generativa-azure",
    certificate: "nao_informado",
    titulo: "Desenvolver aplicativos de IA generativos no Azure",
    canal: "Microsoft Learn",
    plataforma: "Microsoft Learn",
    link: "https://learn.microsoft.com/pt-br/training/paths/develop-generative-ai-apps/",
    areaSlug: "ia" as string | null,
    nivel: "Intermediário",
    duracao: "Cerca de 5 a 6 horas",
    idioma: "Português",
    descricao:
      "Roteiro intermediário para construir aplicações de IA generativa no Microsoft Foundry, da seleção de modelos a chat, ferramentas, RAG e deploy responsável.",
    motivoIndicacao:
      "Cobre o ciclo completo de desenvolvimento com modelos generativos, incluindo RAG, raro de achar gratuito em português.",
    oQueAprende: [
      "Selecionar e implantar modelos",
      "Criar app de chat com IA",
      "Otimizar com prompt e RAG",
      "Aplicar IA generativa responsável",
    ],
    proximoConteudo: "Série IA Generativa para Iniciantes",
  },
  {
    id: "bradesco-ev-ai-900-azure",
    certificate: "sim",
    titulo: "AI-900 - Fundamentos de IA no Azure",
    canal: "Fundação Bradesco (conteúdo Microsoft)",
    plataforma: "Escola Virtual Fundação Bradesco",
    link: "https://www.ev.org.br/cursos/AI900Azure",
    areaSlug: "ia" as string | null,
    nivel: "Iniciante",
    duracao: "16 horas",
    idioma: "Português",
    descricao:
      "Curso em 5 módulos que apresenta os serviços de IA do Azure, com videoaulas, apostilas e artigos, preparando para os fundamentos da certificação AI-900.",
    motivoIndicacao:
      "Une conteúdo da Microsoft a um certificado gratuito, servindo de preparo inicial para uma certificação oficial paga.",
    oQueAprende: [
      "Serviços de IA do Azure",
      "Visão computacional",
      "Processamento de linguagem natural",
      "Casos de IA generativa",
    ],
    proximoConteudo: "Módulo Introdução aos conceitos de IA no Microsoft Learn",
  },
  {
    id: "bradesco-ev-fluencia-ia",
    certificate: "sim",
    titulo: "FluêncIA em Inteligência Artificial",
    canal: "Fundação Bradesco (parceria Microsoft)",
    plataforma: "Escola Virtual Fundação Bradesco",
    link: "https://www.ev.org.br/cursos/fluencia",
    areaSlug: "ia" as string | null,
    nivel: "Iniciante",
    duracao: "4 horas",
    idioma: "Português",
    descricao:
      "Curso introdutório sobre fundamentos de IA e IA generativa, com especialistas da Microsoft no Brasil, da história da IA à ética e agentes com Copilot.",
    motivoIndicacao:
      "Totalmente em português, gratuito e com certificado, ideal como primeiro contato com conceitos de IA.",
    oQueAprende: [
      "História e fundamentos da IA",
      "Conceitos de IA generativa",
      "Aplicações na produtividade",
      "Ética e agentes com Copilot",
    ],
    proximoConteudo: "Curso AI-900 - Fundamentos de IA no Azure",
  },
  {
    id: "bradesco-ev-ia-para-estudantes",
    certificate: "sim",
    titulo: "Inteligência Artificial para Estudantes",
    canal: "Fundação Bradesco",
    plataforma: "Escola Virtual Fundação Bradesco",
    link: "https://www.ev.org.br/cursos/iaestudantes",
    areaSlug: "ia" as string | null,
    nivel: "Iniciante",
    duracao: "4 horas",
    idioma: "Português",
    descricao:
      "Curso prático que mostra como usar IA nos estudos, com exemplos de pesquisa acadêmica, organização, provas, análise de textos e idiomas.",
    motivoIndicacao:
      "Linguagem acessível e foco em aplicação imediata para estudantes, com certificado gratuito.",
    oQueAprende: [
      "Usar o Copilot nos estudos",
      "Pesquisa acadêmica com IA",
      "Organizar estudos e provas",
      "Analisar textos e praticar idiomas",
    ],
    proximoConteudo: "Curso FluêncIA em Inteligência Artificial",
  },
  {
    id: "bradesco-ev-ia-para-pmes",
    certificate: "sim",
    titulo: "Inteligência Artificial para Pequenas e Médias Empresas",
    canal: "Fundação Bradesco",
    plataforma: "Escola Virtual Fundação Bradesco",
    link: "https://www.ev.org.br/cursos/pmes",
    areaSlug: "ia" as string | null,
    nivel: "Iniciante",
    duracao: "4 horas",
    idioma: "Português",
    descricao:
      "Curso para pequenos negócios que ensina a aplicar IA para produtividade, automatizar tarefas e apoiar decisões, com aulas sobre prompts e casos de uso.",
    motivoIndicacao:
      "Combina visão de negócio com prática de prompts e ferramentas, útil para empreendedores, com certificado gratuito.",
    oQueAprende: [
      "Usar IA para alavancar o negócio",
      "Escrever bons prompts",
      "Resumir e-mails e documentos",
      "Gerar campanhas de marketing",
    ],
    proximoConteudo: "Curso AI-900 - Fundamentos de IA no Azure",
  },
  {
    id: "dio-curso-fundamentos-ia-moderna",
    certificate: "sim",
    titulo:
      "Fundamentos da IA Moderna: Machine Learning, LLMs, IA Generativa e Agentes",
    canal: "DIO",
    plataforma: "DIO",
    link: "https://www.dio.me/courses/era-da-ia-machine-learning-llms-ia-generativa-e-agentes",
    areaSlug: "ia" as string | null,
    nivel: "Iniciante",
    duracao: "Curso curto introdutório",
    idioma: "Português",
    descricao:
      "Curso introdutório com panorama da IA moderna, cobrindo machine learning, LLMs, IA generativa e agentes, com base conceitual para iniciantes.",
    motivoIndicacao:
      "Bom resumo gratuito e em português dos pilares atuais da IA, útil para aprender o vocabulário.",
    oQueAprende: [
      "Conceitos de machine learning",
      "O que são LLMs",
      "Fundamentos de IA generativa",
      "Noção de agentes de IA",
    ],
    proximoConteudo: "Bootcamp Criando Prompts Inteligentes da DIO",
  },
  {
    id: "google-skills-introduction-generative-ai",
    certificate: "sim",
    titulo: "Introduction to Generative AI",
    canal: "Google Cloud",
    plataforma: "Google Cloud Skills Boost",
    link: "https://www.cloudskillsboost.google/course_templates/536",
    areaSlug: "ia" as string | null,
    nivel: "Iniciante",
    duracao: "Cerca de 45 minutos",
    idioma: "Inglês",
    descricao:
      "Microcurso introdutório que explica o que é IA generativa, como é usada e em que difere do ML tradicional, com ferramentas do Google.",
    motivoIndicacao:
      "Curso curto, oficial e gratuito que rende um badge, ótimo para uma primeira noção rápida e confiável.",
    oQueAprende: [
      "O que é IA generativa",
      "Diferença para o ML tradicional",
      "Casos de uso comuns",
      "Ferramentas do Google para Gen AI",
    ],
    proximoConteudo: "Curso Introdução aos conceitos de IA do Microsoft Learn",
  },
  {
    id: "dio-curso-docker-fundamentals",
    certificate: "sim",
    titulo: "Curso Docker Fundamentals",
    canal: "DIO",
    plataforma: "DIO",
    link: "https://www.dio.me/curso-docker",
    areaSlug: "devops" as string | null,
    nivel: "Iniciante",
    duracao: "Autoinstrucional, cerca de 6 a 10 horas",
    idioma: "Português",
    descricao:
      "Formação prática que parte do conceito de container até a criação de clusters, usando o CLI do Docker e orquestração local e em nuvem.",
    motivoIndicacao:
      "Ótimo primeiro contato com containers em português, com projetos que já rendem portfólio.",
    oQueAprende: [
      "O que é um container",
      "Comandos do Docker CLI",
      "Dockerfile e Docker Compose",
      "Cluster com Swarm",
    ],
    proximoConteudo: "Curso Kubernetes Fundamentals na DIO",
  },
  {
    id: "dio-curso-kubernetes-fundamentals",
    certificate: "sim",
    titulo: "Curso Kubernetes Fundamentals",
    canal: "DIO",
    plataforma: "DIO",
    link: "https://www.dio.me/curso-kubernetes",
    areaSlug: "devops" as string | null,
    nivel: "Intermediário",
    duracao: "Autoinstrucional, cerca de 8 horas",
    idioma: "Português",
    descricao:
      "Curso de orquestração de containers com Kubernetes, cobrindo publicação e escala de microsserviços e deploy em cluster na nuvem.",
    motivoIndicacao:
      "Continuação natural de quem já entende Docker e quer escalar aplicações de forma profissional.",
    oQueAprende: [
      "Pods, Services e Deployments",
      "Expor e conectar aplicações",
      "Automatizar deployments",
      "Pipeline com GitLab e GCP",
    ],
    proximoConteudo: "Bootcamp Jornada DevOps com AWS",
  },
  {
    id: "dio-bootcamp-jornada-devops-aws",
    certificate: "sim",
    titulo: "Jornada DevOps com AWS - Impulso",
    canal: "DIO",
    plataforma: "DIO",
    link: "https://www.dio.me/bootcamp/jornada-devops-com-aws-impulso",
    areaSlug: "devops" as string | null,
    nivel: "Intermediário",
    duracao: "Cerca de 69 horas",
    idioma: "Português",
    descricao:
      "Bootcamp imersivo com aulas, mentorias e desafios, unindo Linux, Docker, Kubernetes e a nuvem AWS em projetos reais.",
    motivoIndicacao:
      "Junta as principais ferramentas de DevOps numa trilha guiada, ideal para portfólio.",
    oQueAprende: [
      "Linux para DevOps",
      "Containers com Docker",
      "Orquestração com Kubernetes",
      "Serviços AWS",
    ],
    proximoConteudo: "Aprofundar em IaC com Terraform",
  },
  {
    id: "linuxtips-canal-youtube-devops",
    certificate: "nao",
    titulo: "LINUXtips (canal de Linux, Docker, Kubernetes e DevOps)",
    canal: "LINUXtips",
    plataforma: "YouTube",
    link: "https://www.youtube.com/@LINUXtips",
    areaSlug: "devops" as string | null,
    nivel: "Intermediário",
    duracao: "Centenas de vídeos",
    idioma: "Português",
    descricao:
      "Canal de referência em português sobre containers, automação e cultura DevOps, com séries gratuitas como o Descomplicando Docker.",
    motivoIndicacao:
      "Conteúdo de quem vive a área, com didática direta e foco no mercado brasileiro.",
    oQueAprende: [
      "Docker na prática",
      "Kubernetes do básico ao avançado",
      "Boas práticas de Linux",
      "Cultura DevOps",
    ],
    proximoConteudo: "Trilha de Kubernetes da DIO",
  },
  {
    id: "fcc-portugues-devops",
    certificate: "sim",
    titulo: "freeCodeCamp em Português",
    canal: "freeCodeCamp",
    plataforma: "freeCodeCamp",
    link: "https://www.freecodecamp.org/portuguese/",
    areaSlug: "devops" as string | null,
    nivel: "Iniciante",
    duracao: "Autoinstrucional, varia",
    idioma: "Português",
    descricao:
      "Plataforma aberta com artigos e cursos traduzidos, incluindo base de Linux, Git e fundamentos úteis para quem entra em DevOps.",
    motivoIndicacao:
      "Boa fonte gratuita para preencher lacunas de fundamentos antes de mergulhar em ferramentas.",
    oQueAprende: [
      "Linha de comando e Linux",
      "Git",
      "Lógica de programação",
      "Fundamentos de infraestrutura",
    ],
    proximoConteudo: "Curso Docker Fundamentals da DIO",
  },
  {
    id: "ms-learn-azure-fundamentals-cloud-concepts",
    certificate: "nao_informado",
    titulo:
      "Introdução à Infraestrutura de Nuvem: descrever conceitos de nuvem",
    canal: "Microsoft",
    plataforma: "Microsoft Learn",
    link: "https://learn.microsoft.com/pt-br/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/",
    areaSlug: "cloud" as string | null,
    nivel: "Iniciante",
    duracao: "Cerca de 3 a 4 horas",
    idioma: "Português",
    descricao:
      "Trilha oficial que apresenta os conceitos fundamentais de computação em nuvem e prepara para a base do exame AZ-900.",
    motivoIndicacao:
      "Material oficial, gratuito e em português, com exercícios práticos no portal.",
    oQueAprende: [
      "Modelos de nuvem",
      "Responsabilidade compartilhada",
      "IaaS, PaaS e SaaS",
      "Benefícios da nuvem",
    ],
    proximoConteudo: "Demais trilhas da série AZ-900",
  },
  {
    id: "ms-learn-az900-curso",
    certificate: "nao_informado",
    titulo: "Curso AZ-900T00-A: introdução à infraestrutura de nuvem",
    canal: "Microsoft",
    plataforma: "Microsoft Learn",
    link: "https://learn.microsoft.com/pt-br/training/courses/az-900t00",
    areaSlug: "cloud" as string | null,
    nivel: "Iniciante",
    duracao: "Equivalente a um dia de treinamento",
    idioma: "Português",
    descricao:
      "Visão geral de conceitos de nuvem, principais serviços do Azure e ferramentas de gerenciamento e governança.",
    motivoIndicacao:
      "Estrutura o caminho para a certificação Azure Fundamentals de forma gratuita e oficial.",
    oQueAprende: [
      "Serviços do Azure",
      "Gerenciamento e governança",
      "Segurança e custo",
      "Preparação AZ-900",
    ],
    proximoConteudo: "Agendar o exame AZ-900 ou trilha de Architect",
  },
  {
    id: "dio-bootcamp-cloud-aws",
    certificate: "sim",
    titulo: "Bootcamp Cloud AWS",
    canal: "DIO",
    plataforma: "DIO",
    link: "https://www.dio.me/bootcamp/bootcamp-cloud-aws",
    areaSlug: "cloud" as string | null,
    nivel: "Iniciante",
    duracao: "Cerca de 73 horas",
    idioma: "Português",
    descricao:
      "Trilha que vai dos fundamentos de AWS até preparatório para certificações, com projetos de serverless e segurança de APIs.",
    motivoIndicacao:
      "Caminho gratuito e em português para entrar em cloud focado no maior provedor do mercado.",
    oQueAprende: [
      "Fundamentos da AWS",
      "Computação em nuvem",
      "Serverless Framework",
      "Segurança de APIs com Cognito",
    ],
    proximoConteudo: "Trilha de arquitetura AWS ou Cloud Practitioner",
  },
  {
    id: "aws-skill-builder-cloud-practitioner-pt",
    certificate: "nao_informado",
    titulo: "AWS Cloud Practitioner Essentials (Português) [busca]",
    canal: "Amazon Web Services",
    plataforma: "AWS Skill Builder",
    link: "https://skillbuilder.aws/learn/94T2BEN85A/aws-cloud-practitioner-essentials-portugus/V1ZR7QAGKS",
    areaSlug: "cloud" as string | null,
    nivel: "Iniciante",
    duracao: "Cerca de 6 a 7 horas",
    idioma: "Português",
    descricao:
      "Curso digital oficial da AWS com visão geral de nuvem, serviços, segurança, arquitetura e preços, com legendas em português.",
    motivoIndicacao:
      "Conteúdo direto da fonte, gratuito e alinhado à certificação Cloud Practitioner.",
    oQueAprende: [
      "Conceitos de nuvem AWS",
      "Principais serviços",
      "Segurança",
      "Preços e suporte",
    ],
    proximoConteudo: "Mais cursos gratuitos do AWS Skill Builder",
  },
  {
    id: "google-skills-paths-cloud",
    certificate: "sim",
    titulo: "Trilhas de aprendizagem Google Cloud [busca]",
    canal: "Google",
    plataforma: "Google Skills (Cloud Skills Boost)",
    link: "https://www.skills.google/paths",
    areaSlug: "cloud" as string | null,
    nivel: "Iniciante",
    duracao: "Varia por trilha",
    idioma: "Inglês",
    descricao:
      "Trilhas oficiais do Google Cloud com labs práticos em infraestrutura, dados e segurança; parte do conteúdo é gratuita.",
    motivoIndicacao:
      "Boa opção para experimentar o ecossistema Google Cloud com prática guiada.",
    oQueAprende: [
      "Infraestrutura no Google Cloud",
      "Computação e rede",
      "Dados e analytics",
      "Segurança",
    ],
    proximoConteudo: "Skill badges ou preparatório GCP",
  },
  {
    id: "ms-learn-az900-infra-nuvem",
    certificate: "nao_informado",
    titulo: "Curso AZ-900T00-A: introdução à infraestrutura de nuvem",
    canal: "Microsoft",
    plataforma: "Microsoft Learn",
    link: "https://learn.microsoft.com/pt-br/training/courses/az-900t00",
    areaSlug: "infraestrutura" as string | null,
    nivel: "Iniciante",
    duracao: "Equivalente a um dia de treinamento",
    idioma: "Português",
    descricao:
      "Base de infraestrutura em nuvem cobrindo computação, rede, armazenamento e governança no Azure.",
    motivoIndicacao:
      "Para quem vem de infra tradicional e quer entender como esses conceitos se traduzem em nuvem.",
    oQueAprende: [
      "Computação e VMs",
      "Rede em nuvem",
      "Armazenamento",
      "Governança",
    ],
    proximoConteudo: "Trilha de DevOps com AWS na DIO",
  },
  {
    id: "linuxtips-canal-youtube-infra",
    certificate: "nao",
    titulo: "LINUXtips (Linux, automação e infraestrutura)",
    canal: "LINUXtips",
    plataforma: "YouTube",
    link: "https://www.youtube.com/@LINUXtips",
    areaSlug: "infraestrutura" as string | null,
    nivel: "Intermediário",
    duracao: "Varia por playlist",
    idioma: "Português",
    descricao:
      "Conteúdo gratuito sobre administração Linux, automação e infraestrutura como código, base sólida para qualquer perfil de infra.",
    motivoIndicacao:
      "Referência brasileira em Linux e infraestrutura moderna, com séries completas no YouTube.",
    oQueAprende: [
      "Administração Linux",
      "Automação de tarefas",
      "Containers como infraestrutura",
      "Boas práticas de operação",
    ],
    proximoConteudo: "Trilha de Kubernetes da DIO",
  },
  {
    id: "google-sre-books",
    certificate: "nao",
    titulo: "Google SRE Books (Site Reliability Engineering)",
    canal: "Google",
    plataforma: "sre.google",
    link: "https://sre.google/books/",
    areaSlug: "sre" as string | null,
    nivel: "Intermediário",
    duracao: "Leitura extensa",
    idioma: "Inglês",
    descricao:
      "Coleção oficial e gratuita de livros do Google que definiram a disciplina de SRE, disponível integralmente online.",
    motivoIndicacao:
      "É a fonte original e mais respeitada sobre SRE; não existe curso gratuito estruturado equivalente em português.",
    oQueAprende: [
      "Princípios de confiabilidade",
      "SLOs, SLIs e error budgets",
      "On-call e postmortems",
      "Automação e redução de toil",
    ],
    proximoConteudo: "Aplicar SLOs em um projeto pessoal de DevOps",
  },
  {
    id: "cisco-junior-cybersecurity-analyst",
    certificate: "sim",
    titulo: "Caminho de carreira: Junior Cybersecurity Analyst",
    canal: "Cisco Networking Academy",
    plataforma: "Cisco NetAcad",
    link: "https://www.netacad.com/pt/career-paths/cybersecurity?courseLang=pt-BR",
    areaSlug: "ciberseguranca" as string | null,
    nivel: "Intermediário",
    duracao: "Cerca de 120 horas",
    idioma: "Português",
    descricao:
      "Trilha gratuita que encadeia cursos para preparar para a carreira de analista de cibersegurança júnior.",
    motivoIndicacao:
      "Caminho estruturado e gratuito que vai além da introdução, com foco em empregabilidade.",
    oQueAprende: [
      "Redes e segurança",
      "Operação de defesa",
      "Resposta a incidentes",
      "Certificações de entrada",
    ],
    proximoConteudo: "Curso Hacker Ético da Cisco",
  },
  {
    id: "dio-iniciando-ciberseguranca",
    certificate: "sim",
    titulo: "Iniciando no Mundo da Cibersegurança",
    canal: "DIO",
    plataforma: "DIO",
    link: "https://www.dio.me/courses/iniciando-no-mundo-da-ciberseguranca",
    areaSlug: "ciberseguranca" as string | null,
    nivel: "Iniciante",
    duracao: "Autoinstrucional, poucas horas",
    idioma: "Português",
    descricao:
      "Curso gratuito e avulso da DIO com os princípios e fundamentos da segurança da informação para quem está começando.",
    motivoIndicacao:
      "Conteúdo estável em português, com certificado, bom para fixar a base.",
    oQueAprende: [
      "Princípios de segurança",
      "Confidencialidade e integridade",
      "Tipos de ameaças",
      "Boas práticas",
    ],
    proximoConteudo: "Introduction to Cybersecurity da Cisco",
  },
  {
    id: "cisco-cybersecurity-essentials",
    certificate: "sim",
    titulo: "Cybersecurity Essentials",
    canal: "Cisco Networking Academy",
    plataforma: "Cisco NetAcad",
    link: "https://www.netacad.com/courses/cybersecurity-essentials",
    areaSlug: "ciberseguranca" as string | null,
    nivel: "Intermediário",
    duracao: "Cerca de 30 horas",
    idioma: "Inglês",
    descricao:
      "Curso gratuito que aprofunda fundamentos de segurança de redes, criptografia, ameaças e defesa.",
    motivoIndicacao: "Bom passo intermediário após a introdução.",
    oQueAprende: [
      "Criptografia básica",
      "Segurança de redes",
      "Tipos de ameaças",
      "Técnicas de defesa",
    ],
    proximoConteudo: "Trilha de Hacker Ético ou Network Defense",
  },
  {
    id: "fundacao-bradesco-fundamentos-ti",
    certificate: "sim",
    titulo: "Fundamentos de TI: Hardware e Software",
    canal: "Fundação Bradesco",
    plataforma: "Escola Virtual Fundação Bradesco",
    link: "https://www.ev.org.br/cursos/fundamentos-de-ti-hardware-e-software",
    areaSlug: "ciberseguranca" as string | null,
    nivel: "Iniciante",
    duracao: "Cerca de 7 horas",
    idioma: "Português",
    descricao:
      "Curso gratuito com certificado que inclui um módulo dedicado a prevenção e segurança da informação.",
    motivoIndicacao:
      "Alternativa gratuita confiável que cobre noções de segurança para iniciantes.",
    oQueAprende: [
      "Hardware e software",
      "Noções de informática",
      "Prevenção e segurança",
      "Boas práticas",
    ],
    proximoConteudo: "Introduction to Cybersecurity da Cisco",
  },
  {
    id: "enap-fundamentos-lgpd-ciber",
    certificate: "sim",
    titulo: "Fundamentos da Lei Geral de Proteção de Dados (LGPD)",
    canal: "ENAP / Serpro",
    plataforma: "Escola Virtual de Governo",
    link: "https://www.escolavirtual.gov.br/curso/603",
    areaSlug: "ciberseguranca" as string | null,
    nivel: "Iniciante",
    duracao: "Cerca de 15 horas",
    idioma: "Português",
    descricao:
      "Curso gratuito e oficial sobre a LGPD, com certificado, abordando direitos do titular, tratamento de dados e segurança da informação.",
    motivoIndicacao:
      "Conteúdo público, gratuito e com certificado reconhecido, essencial para o lado legal da segurança.",
    oQueAprende: [
      "Conceitos da LGPD",
      "Direitos do titular",
      "Tratamento e proteção de dados",
      "Penalidades",
    ],
    proximoConteudo: "Aprofundar em governança e privacidade",
  },
  {
    id: "dio-formacao-uxui-completa",
    certificate: "sim",
    titulo: "Formação UX Designer (trilha UX/UI completa)",
    canal: "DIO",
    plataforma: "DIO",
    link: "https://www.dio.me/curso-ux-design",
    areaSlug: "uxui" as string | null,
    nivel: "Iniciante",
    duracao: "Formação com módulos e projetos",
    idioma: "Português",
    descricao:
      "Trilha gratuita que integra UX e UI, do entendimento do usuário ao protótipo navegável no Figma, com projetos para portfólio.",
    motivoIndicacao:
      "Melhor opção gratuita em português que une as duas frentes numa jornada única.",
    oQueAprende: [
      "Fundamentos de UX e usabilidade",
      "UI: layouts, grids, componentes",
      "Figma e prototipação",
      "Design System e protótipo navegável",
    ],
    proximoConteudo: "Certificado Google UX (PT)",
  },
  {
    id: "google-ux-design-trilha-pt",
    certificate: "nao",
    titulo: "Certificado de Design de UX do Google (trilha em português)",
    canal: "Google Career Certificates",
    plataforma: "Coursera",
    link: "https://www.coursera.org/professional-certificates/ux-design-do-google",
    areaSlug: "uxui" as string | null,
    nivel: "Iniciante",
    duracao: "Vários meses (7 cursos)",
    idioma: "Português",
    descricao:
      "Página da trilha completa de UX do Google em português, dos fundamentos a protótipos de alta fidelidade no Figma e preparação para vagas.",
    motivoIndicacao:
      "Reúne todos os cursos da trilha PT; cada um pode ser auditado de graça (só o certificado é pago).",
    oQueAprende: [
      "Processo completo de design",
      "Pesquisa e usabilidade",
      "Wireframes, mockups e protótipos",
      "Portfólio ponta a ponta",
    ],
    proximoConteudo: "Especializar em pesquisa de UX ou produto",
  },
  {
    id: "uva-gestao-produtos-digitais-pt",
    certificate: "nao",
    titulo: "Gestão de produtos digitais: Princípios básicos modernos",
    canal: "University of Virginia (Darden)",
    plataforma: "Coursera",
    link: "https://www.coursera.org/learn/uva-darden-digital-product-management-pt",
    areaSlug: "produto" as string | null,
    nivel: "Iniciante",
    duracao: "Cerca de 10 horas",
    idioma: "Português",
    descricao:
      "Curso da Universidade da Virginia, em português, sobre os métodos modernos de gestão de produtos digitais e o papel do gerente de produto.",
    motivoIndicacao:
      "Conteúdo universitário de qualidade, em português, auditável gratuitamente.",
    oQueAprende: [
      "Foco acionável de produto",
      "Métodos modernos de gestão",
      "Validar novas ideias",
      "Evoluir produtos existentes",
    ],
    proximoConteudo: "Aprofundar em Product Manager e métricas",
  },
  {
    id: "dio-fundamentos-produtos-digitais-produto",
    certificate: "sim",
    titulo: "Fundamentos para a Criação de Produtos Digitais",
    canal: "DIO",
    plataforma: "DIO",
    link: "https://www.dio.me/courses/criacao-de-produtos-digitais",
    areaSlug: "produto" as string | null,
    nivel: "Iniciante",
    duracao: "Curso com várias aulas e cases",
    idioma: "Português",
    descricao:
      "Curso gratuito da DIO com cases de líderes de startups brasileiras sobre como nasceram e cresceram seus produtos.",
    motivoIndicacao:
      "Visão prática e nacional de produto digital, gratuita e com certificado.",
    oQueAprende: [
      "Gestão de produtos",
      "Validação de modelo de negócio",
      "Times ágeis",
      "Cases reais",
    ],
    proximoConteudo: "Gestão de produtos digitais (UVA)",
  },
  {
    id: "fundacao-bradesco-gestao-projetos-gestao",
    certificate: "sim",
    titulo: "Introdução à Gestão de Projetos",
    canal: "Fundação Bradesco",
    plataforma: "Escola Virtual (ev.org.br)",
    link: "https://www.ev.org.br/cursos/introducao-a-gestao-de-projetos",
    areaSlug: "gestao" as string | null,
    nivel: "Iniciante",
    duracao: "10 horas",
    idioma: "Português",
    descricao:
      "Curso gratuito com os fundamentos de gestão de projetos segundo o PMI/PMBOK.",
    motivoIndicacao:
      "Base de gestão sólida, gratuita e com certificado, aplicável a qualquer carreira de gestão em tech.",
    oQueAprende: [
      "Caracterização de projetos",
      "Áreas de conhecimento do PMI",
      "Planejamento, custos e riscos",
      "Stakeholders",
    ],
    proximoConteudo: "Gestão de produtos digitais (UVA)",
  },
];

const plataformasBase = [
  {
    id: "youtube",
    nome: "YouTube",
    logoUrl: "https://www.google.com/s2/favicons?domain=youtube.com&sz=128",
    descricao:
      "A maior plataforma de vídeos do mundo, com conteúdo gratuito e ilimitado sobre tecnologia.",
    tipo: "Gratuita",
    idioma: "Todos os idiomas",
    areasFortes: ["Programação", "UX/UI", "Dados", "Cloud", "Carreira"],
    pontosFortes: [
      "100% gratuito",
      "Conteúdo em português",
      "Variedade enorme",
      "Atualizado constantemente",
    ],
    limitacoes: [
      "Sem estrutura de trilha",
      "Qualidade variável",
      "Sem certificado oficial",
      "Fácil se perder",
    ],
    melhorPerfil:
      "Quem tem autodisciplina e sabe filtrar conteúdo de qualidade.",
    nivelIdeal: "Todos os níveis",
    certificado: false,
    trilhasOrganizadas: false,
    boaParaIniciantes: true,
    preco: "Gratuito",
    link: "https://www.youtube.com",
  },
  {
    id: "alura",
    nome: "Alura",
    logoUrl: "https://www.google.com/s2/favicons?domain=alura.com.br&sz=128",
    descricao:
      "Plataforma brasileira com trilhas organizadas, projetos práticos e comunidade ativa.",
    tipo: "Paga",
    idioma: "Português",
    areasFortes: ["Front-end", "Back-end", "Dados", "UX/UI", "DevOps"],
    pontosFortes: [
      "Conteúdo em português",
      "Trilhas bem organizadas",
      "Comunidade no Discord",
      "Certificados reconhecidos",
    ],
    limitacoes: [
      "Pago (assinatura mensal)",
      "Alguns conteúdos desatualizados",
      "Sem projetos muito avançados",
    ],
    melhorPerfil:
      "Quem quer estrutura e conteúdo em português com suporte da comunidade.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "A partir de R$ 89/mês",
    link: "https://www.alura.com.br",
  },
  {
    id: "rocketseat",
    nome: "Rocketseat",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=rocketseat.com.br&sz=128",
    descricao:
      "Plataforma focada em desenvolvimento web e mobile com metodologia prática e comunidade forte.",
    tipo: "Híbrida",
    idioma: "Português",
    areasFortes: ["Front-end", "Back-end", "Mobile", "Full Stack"],
    pontosFortes: [
      "Conteúdo gratuito (Discover)",
      "Comunidade no Discord",
      "Projetos práticos",
      "Foco em mercado",
    ],
    limitacoes: [
      "Conteúdo avançado é pago",
      "Foco principalmente em JavaScript/Node",
    ],
    melhorPerfil:
      "Quem quer entrar em desenvolvimento web/mobile com foco em mercado.",
    nivelIdeal: "Iniciante a avançado",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Gratuito (básico) / R$ 149/mês (Ignite)",
    link: "https://www.rocketseat.com.br",
  },
  {
    id: "dio",
    nome: "DIO",
    logoUrl: "https://www.google.com/s2/favicons?domain=dio.me&sz=128",
    descricao:
      "Plataforma brasileira com cursos gratuitos, bootcamps e conexão com empresas parceiras.",
    tipo: "Híbrida",
    idioma: "Português",
    areasFortes: ["Java", "Python", "Cloud", "Front-end", "Dados"],
    pontosFortes: [
      "Muitos cursos gratuitos",
      "Certificados gratuitos",
      "Bootcamps com empresas",
      "Vagas parceiras",
    ],
    limitacoes: [
      "Qualidade variável entre cursos",
      "Alguns conteúdos superficiais",
      "Interface pode confundir",
    ],
    melhorPerfil:
      "Quem quer certificados gratuitos e acesso a bootcamps de empresas.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Gratuito (básico) / Planos pagos disponíveis",
    link: "https://www.dio.me",
  },
  {
    id: "udemy",
    nome: "Udemy",
    logoUrl: "https://www.google.com/s2/favicons?domain=udemy.com&sz=128",
    descricao:
      "Marketplace de cursos com enorme variedade e preços acessíveis em promoções frequentes.",
    tipo: "Paga",
    idioma: "Português e Inglês",
    areasFortes: ["Todas as áreas de TI"],
    pontosFortes: [
      "Preços baixos em promoção",
      "Variedade enorme",
      "Acesso vitalício",
      "Avaliações de alunos",
    ],
    limitacoes: [
      "Qualidade muito variável",
      "Sem comunidade integrada",
      "Certificado não reconhecido por todas empresas",
    ],
    melhorPerfil:
      "Quem quer curso específico por preço baixo e tem critério para escolher instrutores.",
    nivelIdeal: "Todos os níveis",
    certificado: true,
    trilhasOrganizadas: false,
    boaParaIniciantes: true,
    preco: "R$ 27 a R$ 50 por curso (em promoção)",
    link: "https://www.udemy.com",
  },
  {
    id: "coursera",
    nome: "Coursera",
    logoUrl: "https://www.google.com/s2/favicons?domain=coursera.org&sz=128",
    descricao:
      "Plataforma com cursos de universidades e empresas renomadas como Google, IBM e Stanford.",
    tipo: "Híbrida",
    idioma: "Inglês (maioria) / Português (alguns)",
    areasFortes: ["Dados", "IA", "Cloud", "Programação", "Gestão"],
    pontosFortes: [
      "Certificados de universidades renomadas",
      "Conteúdo de alta qualidade",
      "Auxílio financeiro disponível",
    ],
    limitacoes: [
      "Maioria em inglês",
      "Pago para certificado",
      "Pode ser lento para iniciantes",
    ],
    melhorPerfil:
      "Quem quer certificados de peso (Google, IBM, universidades) e tem inglês básico.",
    nivelIdeal: "Iniciante a avançado",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: false,
    preco: "Gratuito para auditar / R$ 200-400/mês para certificado",
    link: "https://www.coursera.org",
  },
  {
    id: "freecodecamp",
    nome: "freeCodeCamp",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=freecodecamp.org&sz=128",
    descricao:
      "Plataforma 100% gratuita com certificações em desenvolvimento web, dados e machine learning.",
    tipo: "Gratuita",
    idioma: "Inglês",
    areasFortes: ["Front-end", "Back-end", "Dados", "Machine Learning"],
    pontosFortes: [
      "100% gratuito",
      "Certificados gratuitos",
      "Aprendizado prático",
      "Comunidade global",
    ],
    limitacoes: [
      "Em inglês",
      "Sem suporte em português",
      "Pode ser desafiador para iniciantes absolutos",
    ],
    melhorPerfil:
      "Quem tem inglês básico e quer certificados gratuitos com aprendizado prático.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "100% Gratuito",
    link: "https://www.freecodecamp.org",
  },
  {
    id: "origamid",
    nome: "Origamid",
    logoUrl: "https://www.google.com/s2/favicons?domain=origamid.com&sz=128",
    descricao:
      "Plataforma brasileira especializada em design e front-end com conteúdo de altíssima qualidade.",
    tipo: "Paga",
    idioma: "Português",
    areasFortes: ["UX/UI Design", "CSS avançado", "JavaScript", "React"],
    pontosFortes: [
      "Qualidade excepcional",
      "Foco em design e front-end",
      "Projetos reais",
      "Comunidade no Discord",
    ],
    limitacoes: [
      "Pago",
      "Foco limitado (design e front-end)",
      "Menos variedade de áreas",
    ],
    melhorPerfil:
      "Quem quer se especializar em design e front-end com conteúdo premium em português.",
    nivelIdeal: "Iniciante a avançado",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "A partir de R$ 79/mês",
    link: "https://www.origamid.com",
  },
  {
    id: "microsoft-learn",
    nome: "Microsoft Learn",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=learn.microsoft.com&sz=128",
    descricao:
      "Trilhas oficiais da Microsoft para Azure, Power Platform, dados, IA, GitHub e fundamentos técnicos.",
    tipo: "Gratuita",
    idioma: "Português e Inglês",
    areasFortes: ["Cloud", "Dados", "IA", "DevOps", "Programação"],
    pontosFortes: [
      "Conteúdo oficial",
      "Módulos curtos",
      "Preparação para certificações Microsoft",
      "Boa documentação",
    ],
    limitacoes: [
      "Mais forte no ecossistema Microsoft",
      "Pode parecer técnico para iniciantes absolutos",
      "Certificação oficial é paga",
    ],
    melhorPerfil:
      "Quem quer aprender Azure, cloud, dados ou ferramentas Microsoft com conteúdo oficial.",
    nivelIdeal: "Iniciante a avançado",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Gratuito",
    link: "https://learn.microsoft.com/pt-br/training/",
  },
  {
    id: "aws-skill-builder",
    nome: "AWS Skill Builder",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=skillbuilder.aws&sz=128",
    descricao:
      "Plataforma oficial da AWS com cursos, laboratórios e trilhas para cloud computing.",
    tipo: "Híbrida",
    idioma: "Inglês / alguns conteúdos em Português",
    areasFortes: ["Cloud", "DevOps", "Back-end", "Segurança"],
    pontosFortes: [
      "Conteúdo oficial AWS",
      "Preparação para certificações",
      "Trilhas por função",
      "Laboratórios práticos",
    ],
    limitacoes: [
      "Parte prática avançada é paga",
      "Pode exigir inglês",
      "Foco quase total em AWS",
    ],
    melhorPerfil:
      "Quem quer entrar em cloud ou preparar certificações AWS com trilha guiada.",
    nivelIdeal: "Iniciante a avançado",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Gratuito / assinatura paga para labs",
    link: "https://skillbuilder.aws/",
  },
  {
    id: "google-cloud-skills-boost",
    nome: "Google Cloud Skills Boost",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=cloudskillsboost.google&sz=128",
    descricao:
      "Treinamentos oficiais do Google Cloud com labs, quests e trilhas para cloud, dados e IA.",
    tipo: "Híbrida",
    idioma: "Inglês / alguns conteúdos em Português",
    areasFortes: ["Cloud", "Dados", "IA", "DevOps"],
    pontosFortes: [
      "Labs práticos",
      "Conteúdo oficial Google",
      "Badges digitais",
      "Boa trilha para IA e dados",
    ],
    limitacoes: [
      "Muitos labs exigem créditos",
      "Foco em Google Cloud",
      "Pode ser avançado no começo",
    ],
    melhorPerfil:
      "Quem quer praticar cloud e IA em ambiente real com laboratório guiado.",
    nivelIdeal: "Iniciante a avançado",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Gratuito / créditos ou assinatura para labs",
    link: "https://www.cloudskillsboost.google/",
  },
  {
    id: "kaggle",
    nome: "Kaggle Learn",
    logoUrl: "https://www.google.com/s2/favicons?domain=kaggle.com&sz=128",
    descricao:
      "Cursos curtos e práticos para Python, Pandas, machine learning, SQL e visualização de dados.",
    tipo: "Gratuita",
    idioma: "Inglês",
    areasFortes: ["Dados", "IA", "Python", "Machine Learning"],
    pontosFortes: [
      "Exercícios no navegador",
      "Datasets reais",
      "Microcursos objetivos",
      "Certificados gratuitos",
    ],
    limitacoes: [
      "Conteúdo em inglês",
      "Menos foco em teoria profunda",
      "Voltado principalmente a dados",
    ],
    melhorPerfil:
      "Quem quer começar em dados ou IA praticando sem instalar nada.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "100% Gratuito",
    link: "https://www.kaggle.com/learn",
  },
  {
    id: "edx",
    nome: "edX",
    logoUrl: "https://www.google.com/s2/favicons?domain=edx.org&sz=128",
    descricao:
      "Cursos de universidades e empresas, incluindo Harvard, MIT e Microsoft, com opção de certificado pago.",
    tipo: "Híbrida",
    idioma: "Inglês / alguns conteúdos em Português",
    areasFortes: ["Programação", "Dados", "IA", "Cloud", "Gestão"],
    pontosFortes: [
      "Instituições reconhecidas",
      "Conteúdo acadêmico forte",
      "Opção de auditar gratuitamente",
      "Certificados valorizados",
    ],
    limitacoes: [
      "Certificado geralmente é pago",
      "Cursos podem ser longos",
      "Inglês é comum",
    ],
    melhorPerfil:
      "Quem quer profundidade acadêmica e certificados de instituições reconhecidas.",
    nivelIdeal: "Iniciante a avançado",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: false,
    preco: "Gratuito para auditar / certificado pago",
    link: "https://www.edx.org/",
  },
  {
    id: "codecademy",
    nome: "Codecademy",
    logoUrl: "https://www.google.com/s2/favicons?domain=codecademy.com&sz=128",
    descricao:
      "Plataforma interativa para aprender programação, web, dados, back-end e fundamentos de computação.",
    tipo: "Híbrida",
    idioma: "Inglês",
    areasFortes: ["Programação", "Front-end", "Back-end", "Dados"],
    pontosFortes: [
      "Prática interativa",
      "Trilhas por carreira",
      "Ambiente no navegador",
      "Boa progressão para iniciantes",
    ],
    limitacoes: [
      "Recursos melhores ficam no plano pago",
      "Conteúdo em inglês",
      "Projetos podem ser guiados demais",
    ],
    melhorPerfil:
      "Quem quer aprender escrevendo código desde o primeiro dia no navegador.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Gratuito / plano Pro pago",
    link: "https://www.codecademy.com/",
  },
  {
    id: "mdn",
    nome: "MDN Web Docs",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=developer.mozilla.org&sz=128",
    descricao:
      "Documentação e guias de referência para HTML, CSS, JavaScript, APIs web e boas práticas.",
    tipo: "Gratuita",
    idioma: "Inglês / alguns conteúdos traduzidos",
    areasFortes: ["Front-end", "Programação", "Web"],
    pontosFortes: [
      "Referência confiável",
      "Conteúdo gratuito",
      "Atualizado pela comunidade",
      "Excelente para tirar dúvidas",
    ],
    limitacoes: [
      "Não é uma plataforma de curso tradicional",
      "Sem certificado",
      "Pode ser denso para iniciantes",
    ],
    melhorPerfil:
      "Quem estuda desenvolvimento web e quer uma referência técnica confiável.",
    nivelIdeal: "Iniciante a avançado",
    certificado: false,
    trilhasOrganizadas: false,
    boaParaIniciantes: true,
    preco: "100% Gratuito",
    link: "https://developer.mozilla.org/",
  },
  {
    id: "w3schools",
    nome: "W3Schools",
    logoUrl: "https://www.google.com/s2/favicons?domain=w3schools.com&sz=128",
    descricao:
      "Tutoriais rápidos e exemplos práticos de HTML, CSS, JavaScript, SQL, Python e outras tecnologias.",
    tipo: "Híbrida",
    idioma: "Inglês",
    areasFortes: ["Front-end", "Programação", "Back-end", "Dados"],
    pontosFortes: [
      "Exemplos simples",
      "Editor no navegador",
      "Boa consulta rápida",
      "Certificados pagos disponíveis",
    ],
    limitacoes: [
      "Explicações podem ser superficiais",
      "Certificado é pago",
      "Não substitui projetos reais",
    ],
    melhorPerfil:
      "Quem quer consultar sintaxe e praticar exemplos pequenos rapidamente.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Gratuito / certificado pago",
    link: "https://www.w3schools.com/",
  },
  {
    id: "the-odin-project",
    nome: "The Odin Project",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=theodinproject.com&sz=128",
    descricao:
      "Currículo gratuito e baseado em projetos para desenvolvimento web full stack.",
    tipo: "Gratuita",
    idioma: "Inglês",
    areasFortes: ["Front-end", "Back-end", "Full Stack", "Programação"],
    pontosFortes: [
      "100% gratuito",
      "Foco em projetos",
      "Comunidade ativa",
      "Trilha completa",
    ],
    limitacoes: [
      "Sem certificado oficial",
      "Exige autonomia",
      "Conteúdo em inglês",
    ],
    melhorPerfil:
      "Quem quer uma formação full stack gratuita, exigente e orientada a projeto.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: false,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "100% Gratuito",
    link: "https://www.theodinproject.com/",
  },
  {
    id: "scrimba",
    nome: "Scrimba",
    logoUrl: "https://www.google.com/s2/favicons?domain=scrimba.com&sz=128",
    descricao:
      "Cursos interativos de front-end em que você pausa a aula e edita o código dentro do vídeo.",
    tipo: "Híbrida",
    idioma: "Inglês",
    areasFortes: ["Front-end", "React", "Programação"],
    pontosFortes: [
      "Formato interativo",
      "Ótimo para React",
      "Projetos guiados",
      "Boa experiência para iniciantes",
    ],
    limitacoes: [
      "Plano completo é pago",
      "Conteúdo em inglês",
      "Foco maior em front-end",
    ],
    melhorPerfil:
      "Quem aprende melhor alternando vídeo, código e prática visual.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Gratuito / plano Pro pago",
    link: "https://scrimba.com/",
  },
  {
    id: "datacamp",
    nome: "DataCamp",
    logoUrl: "https://www.google.com/s2/favicons?domain=datacamp.com&sz=128",
    descricao:
      "Plataforma focada em dados, analytics, Python, SQL, machine learning e BI.",
    tipo: "Híbrida",
    idioma: "Inglês",
    areasFortes: ["Dados", "IA", "Python", "SQL", "BI"],
    pontosFortes: [
      "Exercícios interativos",
      "Trilhas de carreira",
      "Projetos de dados",
      "Certificados no plano pago",
    ],
    limitacoes: [
      "Grande parte é paga",
      "Conteúdo em inglês",
      "Menos foco em engenharia de software geral",
    ],
    melhorPerfil:
      "Quem quer estudar dados com exercícios curtos e trilhas bem organizadas.",
    nivelIdeal: "Iniciante a avançado",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Gratuito limitado / assinatura paga",
    link: "https://www.datacamp.com/",
  },
  {
    id: "tryhackme",
    nome: "TryHackMe",
    logoUrl: "https://www.google.com/s2/favicons?domain=tryhackme.com&sz=128",
    descricao:
      "Labs guiados e gamificados para aprender cibersegurança, redes, Linux, SOC e pentest.",
    tipo: "Híbrida",
    idioma: "Inglês",
    areasFortes: ["Cibersegurança", "Redes", "Linux", "Cloud"],
    pontosFortes: [
      "Ambientes práticos",
      "Trilhas para iniciantes",
      "Gamificação",
      "Boa porta de entrada para segurança",
    ],
    limitacoes: [
      "Plano gratuito tem limites",
      "Conteúdo em inglês",
      "Precisa seguir ética e regras de laboratório",
    ],
    melhorPerfil:
      "Quem quer entrar em segurança com prática guiada e ambientes controlados.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Gratuito / assinatura paga",
    link: "https://tryhackme.com/",
  },
  {
    id: "hack-the-box-academy",
    nome: "Hack The Box Academy",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=academy.hackthebox.com&sz=128",
    descricao:
      "Módulos técnicos e laboratórios para cibersegurança ofensiva, defensiva e fundamentos.",
    tipo: "Híbrida",
    idioma: "Inglês",
    areasFortes: ["Cibersegurança", "Redes", "Linux"],
    pontosFortes: [
      "Labs técnicos fortes",
      "Conteúdo aprofundado",
      "Módulos estruturados",
      "Certificados disponíveis",
    ],
    limitacoes: [
      "Pode ser difícil para iniciantes absolutos",
      "Plano gratuito limitado",
      "Conteúdo em inglês",
    ],
    melhorPerfil:
      "Quem já começou em segurança e quer laboratórios mais técnicos.",
    nivelIdeal: "Intermediário a avançado",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: false,
    preco: "Gratuito limitado / plano pago",
    link: "https://academy.hackthebox.com/",
  },
  {
    id: "pluralsight",
    nome: "Pluralsight",
    logoUrl: "https://www.google.com/s2/favicons?domain=pluralsight.com&sz=128",
    descricao:
      "Plataforma profissional com cursos de software, cloud, segurança, dados e liderança técnica.",
    tipo: "Paga",
    idioma: "Inglês",
    areasFortes: ["Cloud", "DevOps", "Segurança", "Programação", "Dados"],
    pontosFortes: [
      "Catálogo amplo",
      "Avaliação de habilidades",
      "Conteúdo corporativo",
      "Trilhas por tecnologia",
    ],
    limitacoes: [
      "Pago",
      "Conteúdo em inglês",
      "Pode ser amplo demais sem objetivo claro",
    ],
    melhorPerfil:
      "Quem quer aprofundamento profissional e trilhas para tecnologias específicas.",
    nivelIdeal: "Intermediário a avançado",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: false,
    preco: "Assinatura paga",
    link: "https://www.pluralsight.com/",
  },
  {
    id: "linkedin-learning",
    nome: "LinkedIn Learning",
    logoUrl: "https://www.google.com/s2/favicons?domain=linkedin.com&sz=128",
    descricao:
      "Cursos profissionais integrados ao LinkedIn, com tecnologia, negócios, produtividade e carreira.",
    tipo: "Paga",
    idioma: "Português e Inglês",
    areasFortes: ["Carreira", "Programação", "Dados", "Gestão", "Produto"],
    pontosFortes: [
      "Certificados no LinkedIn",
      "Conteúdo profissional",
      "Boa variedade",
      "Cursos curtos",
    ],
    limitacoes: [
      "Assinatura paga",
      "Profundidade varia por curso",
      "Menos prática técnica que plataformas especializadas",
    ],
    melhorPerfil:
      "Quem quer aprender habilidades técnicas e profissionais com certificado visível no LinkedIn.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Assinatura paga / teste grátis",
    link: "https://www.linkedin.com/learning/",
  },
  {
    id: "khan-academy",
    nome: "Khan Academy",
    logoUrl: "https://www.google.com/s2/favicons?domain=khanacademy.org&sz=128",
    descricao:
      "Conteúdo gratuito para matemática, lógica, computação básica e fundamentos úteis para tecnologia.",
    tipo: "Gratuita",
    idioma: "Português e Inglês",
    areasFortes: ["Programação", "Matemática", "Lógica", "Dados"],
    pontosFortes: [
      "100% gratuito",
      "Boa base matemática",
      "Conteúdo didático",
      "Ótimo para reforçar fundamentos",
    ],
    limitacoes: [
      "Pouco foco em mercado tech",
      "Sem certificado profissional",
      "Menos projetos de portfólio",
    ],
    melhorPerfil:
      "Quem precisa reforçar matemática, lógica e fundamentos antes de trilhas mais técnicas.",
    nivelIdeal: "Iniciante",
    certificado: false,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "100% Gratuito",
    link: "https://pt.khanacademy.org/",
  },
  {
    id: "curso-em-video",
    nome: "Curso em Vídeo",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=cursoemvideo.com&sz=128",
    descricao:
      "Conteúdo gratuito em português de qualidade excelente para HTML, CSS, JavaScript, PHP, Git, redes, hardware e primeira base em tecnologia.",
    tipo: "Gratuita",
    idioma: "Português",
    areasFortes: ["Programação", "Front-end", "Back-end", "Redes"],
    pontosFortes: [
      "Totalmente gratuito",
      "Professor didático",
      "Do zero até projetos intermediários",
      "Ótimo para primeira linguagem",
    ],
    limitacoes: [
      "Sem estrutura de plataforma (YouTube/site)",
      "Sem comunidade oficial integrada como curso marketado",
      "Ritmo próprio pode exigir disciplina",
    ],
    melhorPerfil:
      "Quem quer começar em português com aulas organizadas como curso mesmo sendo gratuito.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: false,
    trilhasOrganizadas: false,
    boaParaIniciantes: true,
    preco: "100% Gratuito",
    link: "https://www.cursoemvideo.com/",
  },
  {
    id: "flexbox-froggy",
    nome: "Flexbox Froggy",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=flexboxfroggy.com&sz=128",
    descricao:
      "Joguinho rápido no navegador para aprender Flexbox movendo sapinhos até as vitórias-régia.",
    tipo: "Gratuita",
    idioma: "Inglês (interface minimalista)",
    areasFortes: ["Front-end", "CSS"],
    pontosFortes: [
      "Instantâneo para abrir e praticar",
      "Visual, entende as propriedades na prática",
      "Curto para fazer numa sentada",
      "Ótimo depois de ler o básico de MDN/HTML",
    ],
    limitacoes: [
      "Só cobre Flexbox CSS",
      "Sem projeto completo nem certificado",
    ],
    melhorPerfil:
      "Quem travou na hora do layout com CSS ou quer revisar Flexbox divertindo.",
    nivelIdeal: "Iniciante",
    certificado: false,
    trilhasOrganizadas: false,
    boaParaIniciantes: true,
    preco: "100% Gratuito",
    link: "https://flexboxfroggy.com/",
  },
  {
    id: "grid-garden",
    nome: "Grid Garden",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=cssgridgarden.com&sz=128",
    descricao:
      "Jogo pelo mesmo criador do Flexbox Froggy para aprender CSS Grid plantando cenouras no jardim.",
    tipo: "Gratuita",
    idioma: "Inglês",
    areasFortes: ["Front-end", "CSS"],
    pontosFortes: [
      "Ótimo após Froggy ou HTML/CSS inicial",
      "Reforça sintaxe Grid no navegador",
      "Gamificado",
    ],
    limitacoes: ["Só cobre Grid", "Certificado não existe"],
    melhorPerfil:
      "Quer dominar layouts modernos usando Grid de forma divertida.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: false,
    trilhasOrganizadas: false,
    boaParaIniciantes: true,
    preco: "100% Gratuito",
    link: "https://cssgridgarden.com/",
  },
  {
    id: "css-diner",
    nome: "CSS Diner",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=flukeout.github.io&sz=128",
    descricao:
      "Jogo sobre seletores CSS: combina elementos do cardápio com regras de seleção até ficar intuitivo.",
    tipo: "Gratuita",
    idioma: "Inglês",
    areasFortes: ["Front-end", "CSS"],
    pontosFortes: [
      "Seletores específicos e combinadores ficam claros rápido",
      "Curto e direto",
    ],
    limitacoes: [
      "Foco apenas em seletores",
      "Interface simples, mas funciona bem",
    ],
    melhorPerfil:
      "Quem lê tutorial de CSS mas ainda não gruda seletor avançado na cabeça.",
    nivelIdeal: "Iniciante",
    certificado: false,
    trilhasOrganizadas: false,
    boaParaIniciantes: true,
    preco: "100% Gratuito",
    link: "https://flukeout.github.io/",
  },
  {
    id: "blockly-games",
    nome: "Blockly Games",
    logoUrl: "https://www.google.com/s2/favicons?domain=blockly.games&sz=128",
    descricao:
      "Jogos gratuitos da Google usando blocos (Blockly) antes de texto: labirinto, pássaro, música, etc. Ótimo para lógica e primeiros comandos.",
    tipo: "Gratuita",
    idioma: "Português e outros",
    areasFortes: ["Lógica", "Programação", "Ensino Fundamental"],
    pontosFortes: [
      "Blocos visuais",
      "Seguro para iniciantes absolutos",
      "Sem cadastro obrigatório na maioria",
      "Família inteira pode treinar pensamento sequencial",
    ],
    limitacoes: [
      "Não leva até emprego júnior sozinho",
      "Transição para código texto exige próximo passo",
    ],
    melhorPerfil:
      "Quem está no zero ou vem da educação infantil/teens antes de texto puro.",
    nivelIdeal: "Iniciante",
    certificado: false,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "100% Gratuito",
    link: "https://blockly.games/",
  },
  {
    id: "scratch",
    nome: "Scratch (MIT)",
    logoUrl: "https://www.google.com/s2/favicons?domain=scratch.mit.edu&sz=128",
    descricao:
      "Linguagem visual de blocos do MIT para criar jogos, histórias e animações. Porta de entrada clássica para programação e pensamento criativo.",
    tipo: "Gratuita",
    idioma: "Português e dezenas de outros",
    areasFortes: ["Lógica", "Games", "Programação visual"],
    pontosFortes: [
      "Comunidade enorme",
      "Compartilha projetos",
      "Didática para todas as idades",
      "Ótimo para primeiro “eu fiz algo que funciona”",
    ],
    limitacoes: [
      "Não é linguagem textual do mercado",
      "Salto para HTML/JS/Python exige próximo recurso",
    ],
    melhorPerfil:
      "Ideal para quem aprende brincando, jovens, ou antes de cursar texto puro.",
    nivelIdeal: "Iniciante",
    certificado: false,
    trilhasOrganizadas: false,
    boaParaIniciantes: true,
    preco: "100% Gratuito",
    link: "https://scratch.mit.edu/",
  },
  {
    id: "codecombat",
    nome: "CodeCombat",
    logoUrl: "https://www.google.com/s2/favicons?domain=codecombat.com&sz=128",
    descricao:
      "Avance fases de RPG controlando um herói com código (Python ou JavaScript no início). Gamificação forte para a primeira linguagem textual.",
    tipo: "Híbrida",
    idioma: "Inglês (parte do material da comunidade em português)",
    areasFortes: ["Programação", "Games", "Python", "Front-end"],
    pontosFortes: [
      "Gamificação que incentiva o estudo",
      "Progressão gradual",
      "Conteúdos voltados também para escolas",
    ],
    limitacoes: [
      "O plano pago amplia bastante o curso",
      "Boa parte do produto principal é em inglês",
    ],
    melhorPerfil:
      "Adolescente ou adulto que aprende melhor jogando do que só assistindo a vídeos.",
    nivelIdeal: "Iniciante",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Gratuito inicial / expansões pagas",
    link: "https://codecombat.com/",
  },
  {
    id: "codingame",
    nome: "CodinGame",
    logoUrl: "https://www.google.com/s2/favicons?domain=codingame.com&sz=128",
    descricao:
      "Desafios de programação no estilo puzzle e competições, dos primeiros passos até clashes e arena de IA, com várias linguagens.",
    tipo: "Gratuita",
    idioma: "Inglês e Francês predominantes",
    areasFortes: ["Programação", "Algoritmos", "Games", "Lógica"],
    pontosFortes: [
      "Aprendizado ativo resolvendo problemas",
      "Várias linguagens",
      "Comunidade e torneios",
      "Gamificação leve",
    ],
    limitacoes: [
      "Pode cansar quem é iniciante absoluto (melhor usar após a primeira semana programando)",
      "Não tem curso linear tradicional",
    ],
    melhorPerfil:
      "Quem já mexeu um pouco em variáveis, if e loops e quer treinar resolvendo desafios.",
    nivelIdeal: "Iniciante a avançado",
    certificado: false,
    trilhasOrganizadas: false,
    boaParaIniciantes: true,
    preco: "100% Gratuito (premium opcional)",
    link: "https://www.codingame.com/",
  },
  {
    id: "checkio",
    nome: "CheckiO",
    logoUrl: "https://www.google.com/s2/favicons?domain=checkio.org&sz=128",
    descricao:
      "Missões em Python e JavaScript dentro de cenários gamificados para subir de nível técnico.",
    tipo: "Gratuita",
    idioma: "Inglês",
    areasFortes: ["Programação", "Python", "Games"],
    pontosFortes: [
      "Mistura enigma e código de forma divertida",
      "Compara suas soluções com as de outros",
      "Bom segundo passo depois do Python básico",
    ],
    limitacoes: ["Poucas linguagens suportadas", "Em inglês"],
    melhorPerfil:
      "Quem terminou o primeiro curso de Python e quer se desafiar em missões estruturadas.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: false,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "100% Gratuito",
    link: "https://checkio.org/",
  },
  {
    id: "elevator-saga",
    nome: "Elevator Saga",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=play.elevatorsaga.com&sz=128",
    descricao:
      "Otimize elevadores escrevendo JavaScript. Um ótimo playground para sintaxe, objetos simples e lógica de filas.",
    tipo: "Gratuita",
    idioma: "Inglês",
    areasFortes: ["Programação", "JavaScript", "Lógica", "Games"],
    pontosFortes: [
      "Foco em um problema claro",
      "Dá para refatorar e ver as métricas",
      "Diferente das katas triviais",
    ],
    limitacoes: [
      "Tema bem específico",
      "Precisa ler uma documentação curta no começo",
    ],
    melhorPerfil:
      "Quem está em JavaScript básico ou intermediário e quer revisar código realista em pequena escala.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: false,
    trilhasOrganizadas: false,
    boaParaIniciantes: false,
    preco: "100% Gratuito",
    link: "https://play.elevatorsaga.com/",
  },
  {
    id: "vim-adventures",
    nome: "VIM Adventures",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=vim-adventures.com&sz=128",
    descricao:
      "Jogo que ensina comandos do Vim movendo um personagem por um mapa de RPG. Útil porque o terminal e o Vim aparecem até em cloud e DevOps iniciante.",
    tipo: "Paga",
    idioma: "Inglês",
    areasFortes: ["Produtividade", "DevOps", "Linha de comando"],
    pontosFortes: [
      "Motiva a aprender algo que costuma ser maçante",
      "Os mnemônicos ajudam a fixar os comandos",
    ],
    limitacoes: [
      "O início é grátis, depois é pago",
      "Não é prioridade antes da primeira linguagem",
    ],
    melhorPerfil:
      "Quem vai mexer em servidor Linux ou editor remoto e quer dominar o Vim.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: false,
    trilhasOrganizadas: true,
    boaParaIniciantes: false,
    preco: "Grátis no começo / depois pagamento único ou licença",
    link: "https://vim-adventures.com/",
  },
  {
    id: "exercism",
    nome: "Exercism",
    logoUrl: "https://www.google.com/s2/favicons?domain=exercism.org&sz=128",
    descricao:
      "Trilhas por linguagem com exercícios pequenos, mentoria humana opcional e foco em legibilidade de código, com uma cultura bem inclusiva.",
    tipo: "Gratuita",
    idioma: "Inglês (parte da documentação da comunidade em português)",
    areasFortes: ["Programação", "Fundamentos", "Melhores práticas"],
    pontosFortes: [
      "Feedback de mentores humanos no plano com mentoria",
      "Muitas linguagens disponíveis",
      "Exercícios curtos que reforçam o aprendizado",
    ],
    limitacoes: [
      "O ritmo depende de você",
      "A mentoria pode exigir paciência para receber retorno",
    ],
    melhorPerfil:
      "Quem prefere problemas curtos e sugestões de melhoria antes de partir para projetos grandes.",
    nivelIdeal: "Iniciante a avançado",
    certificado: false,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Gratuito no núcleo / recursos opcionais pagos para organizações",
    link: "https://exercism.org/",
  },
  {
    id: "codewars",
    nome: "Codewars",
    logoUrl: "https://www.google.com/s2/favicons?domain=codewars.com&sz=128",
    descricao:
      "Katas (mini problemas de algoritmos) em dezenas de linguagens, organizados por nível (kyū), com uma comunidade que compara soluções elegantes.",
    tipo: "Gratuita",
    idioma: "Inglês",
    areasFortes: ["Programação", "Algoritmos", "Lógica"],
    pontosFortes: [
      "Blocos curtos que cabem em uma rotina cheia",
      "O ranking motiva",
      "Dá para ver outras soluções depois de resolver",
    ],
    limitacoes: [
      "Pode virar obsessão sem um projeto de portfólio",
      "Pode frustrar logo na primeira semana",
    ],
    melhorPerfil:
      "Quem tem uma base mínima e quer treinar 20 minutos por dia para afiar sintaxe e lógica.",
    nivelIdeal: "Iniciante intermediário até avançado",
    certificado: false,
    trilhasOrganizadas: false,
    boaParaIniciantes: true,
    preco: "100% Gratuito (premium cosméticos)",
    link: "https://www.codewars.com/",
  },
  {
    id: "frontend-mentor",
    nome: "Frontend Mentor",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=frontendmentor.io&sz=128",
    descricao:
      "Briefings de projetos de UI reais (mobile e desktop) para você implementar em código e revisar o de outras pessoas. Ótimo para portfólio front-end.",
    tipo: "Híbrida",
    idioma: "Inglês",
    areasFortes: ["Front-end", "CSS", "UX/UI Design"],
    pontosFortes: [
      "Briefing e assets já prontos",
      "Compara soluções",
      "Rende bons projetos para o GitHub",
    ],
    limitacoes: ["Desafios avançados e arquivos Figma ficam nos planos pagos"],
    melhorPerfil:
      "Quem já sabe HTML, CSS e JavaScript básico e quer sair do tutorial copiado.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: false,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Grátis projetos nível trainee / tiers pagos",
    link: "https://www.frontendmentor.io/",
  },
  {
    id: "replit",
    nome: "Replit",
    logoUrl: "https://www.google.com/s2/favicons?domain=replit.com&sz=128",
    descricao:
      "IDE no navegador com deploy fácil, templates e até assistente de IA integrado. Rápido para iterar um projeto sem instalar a toolchain inteira.",
    tipo: "Híbrida",
    idioma: "Inglês (interface) / projetos na linguagem que você escolher",
    areasFortes: ["Programação", "Front-end", "Back-end", "Cloud leve"],
    pontosFortes: [
      "Ambiente igual para todo mundo, útil em turmas",
      "Deploy simples para começar",
      "Muitos templates",
    ],
    limitacoes: [
      "O plano grátis pode limitar projetos pesados",
      "Requer internet",
    ],
    melhorPerfil:
      "Quem tem um notebook fraco e quer programar na nuvem sem instalar toolchain.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: false,
    trilhasOrganizadas: false,
    boaParaIniciantes: true,
    preco: "Grátis núcleo / contas maiores pagas",
    link: "https://replit.com/",
  },
  {
    id: "glitch",
    nome: "Glitch",
    logoUrl: "https://www.google.com/s2/favicons?domain=glitch.com&sz=128",
    descricao:
      "Crie apps web de forma colaborativa: dê fork em um projeto ao vivo e hospede de graça. Bom para sites estáticos e pequenos apps Node em experimentos criativos.",
    tipo: "Gratuita",
    idioma: "Inglês",
    areasFortes: ["Front-end", "Programação Web", "Prototipação"],
    pontosFortes: [
      "Cultura aberta de clonar e remixar projetos",
      "Hospeda uma mini API rapidinho",
      "Bom para trabalho em grupo",
    ],
    limitacoes: [
      "Não ensina trilhas longas sozinho",
      "No plano grátis o projeto dorme e tem cold start",
    ],
    melhorPerfil:
      "Quem quer publicar a primeira landing animada sem cartão de crédito no primeiro deploy.",
    nivelIdeal: "Iniciante",
    certificado: false,
    trilhasOrganizadas: false,
    boaParaIniciantes: true,
    preco: "Grátis (limites projeto ativo dormindo)",
    link: "https://glitch.com/",
  },
  {
    id: "sololearn",
    nome: "SoloLearn",
    logoUrl: "https://www.google.com/s2/favicons?domain=sololearn.com&sz=128",
    descricao:
      "Lições no estilo mobile com playgrounds para várias linguagens e streak gamificado. Bom para estudar 10 minutos no ônibus.",
    tipo: "Híbrida",
    idioma: "Português parcial / Inglês",
    areasFortes: ["Programação", "Fundamentos"],
    pontosFortes: [
      "Pensado para o celular",
      "Trilhas por linguagem",
      "O plano grátis basta nos primeiros dias",
    ],
    limitacoes: [
      "Sozinho não basta para uma carreira sênior",
      "Tem anúncios no plano grátis",
    ],
    melhorPerfil: "Quem tem pouco tempo e está na primeira semana programando.",
    nivelIdeal: "Iniciante",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Grátis + Pro paga",
    link: "https://www.sololearn.com/",
  },
  {
    id: "brilliant",
    nome: "Brilliant",
    logoUrl: "https://www.google.com/s2/favicons?domain=brilliant.org&sz=128",
    descricao:
      "Problemas guiados e curtos de matemática, lógica, ciência e pensamento computacional. Menos vídeo passivo e mais prática mental.",
    tipo: "Híbrida",
    idioma: "Inglês (poucos conteúdos em português)",
    areasFortes: [
      "Matemática",
      "Lógica",
      "Ciência da Computação",
      "Probabilidade",
    ],
    pontosFortes: [
      "Visual interativo forte",
      "Boa preparação antes de cursos mais teóricos",
    ],
    limitacoes: [
      "O catálogo maior fica na assinatura paga",
      "Não substitui um portfólio técnico",
    ],
    melhorPerfil:
      "Quem quer perder o medo de matemática e lógica antes de dados ou Ciência da Computação.",
    nivelIdeal: "Iniciante",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Grátis parcial / assinatura paga",
    link: "https://brilliant.org/",
  },
  {
    id: "hyperskill-jetbrains",
    nome: "JetBrains Academy (Hyperskill)",
    logoUrl: "https://www.google.com/s2/favicons?domain=hyperskill.org&sz=128",
    descricao:
      "Projetos incrementais e guiados, principalmente em Kotlin, Python e Java, até chegar a apps reais em pequena escala, com rigor técnico.",
    tipo: "Híbrida",
    idioma: "Inglês",
    areasFortes: ["Programação", "Java", "Python", "Kotlin"],
    pontosFortes: [
      "Integração opcional com o IntelliJ",
      "Os projetos crescem em complexidade",
    ],
    limitacoes: [
      "O plano grátis tem limites de projeto",
      "Não é para o primeiro dia absoluto",
    ],
    melhorPerfil:
      "Quem se motiva mais com projetos longos do que com maratonas de vídeo.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Grátis com limitações / tiers pagos",
    link: "https://hyperskill.org/",
  },
  {
    id: "roadmap-sh",
    nome: "roadmap.sh",
    logoUrl: "https://www.google.com/s2/favicons?domain=roadmap.sh&sz=128",
    descricao:
      "Mapas visuais gratuitos de Front-end, Back-end, DevOps, Dados e mais, com links de recursos mantidos pela comunidade.",
    tipo: "Gratuita",
    idioma: "Inglês",
    areasFortes: ["Carreira", "Programação", "Cloud", "Dados"],
    pontosFortes: [
      "Ótimo para guiar o próprio estudo",
      "Não reinventa nada, só organiza e indica recursos",
    ],
    limitacoes: [
      "Não ensina o conteúdo em si, só dá o mapa",
      "Algumas escolhas de tecnologia variam por empresa",
    ],
    melhorPerfil: "Quem está sem saber qual é o próximo passo a estudar.",
    nivelIdeal: "Todos os níveis",
    certificado: false,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "100% Gratuito (doações voluntárias)",
    link: "https://roadmap.sh/",
  },
  {
    id: "leetcode",
    nome: "LeetCode",
    logoUrl: "https://www.google.com/s2/favicons?domain=leetcode.com&sz=128",
    descricao:
      "Grande banco de problemas de estruturas de dados e algoritmos usado para preparar entrevistas. Forte depois da primeira linguagem, quando o foco for seleções mais difíceis.",
    tipo: "Híbrida",
    idioma: "Inglês",
    areasFortes: ["Algoritmos", "Programação", "Entrevistas técnicas"],
    pontosFortes: [
      "Treina reconhecimento de padrões",
      "Discussões da comunidade com soluções",
      "Tem competições",
    ],
    limitacoes: [
      "Focar só nisso no primeiro mês pode causar burnout",
      "Em inglês",
    ],
    melhorPerfil:
      "Quem já fez projetos pequenos completos antes de focar só em treino de algoritmos.",
    nivelIdeal: "Intermediário (depois do básico)",
    certificado: false,
    trilhasOrganizadas: true,
    boaParaIniciantes: false,
    preco: "Free significante / Premium paga",
    link: "https://leetcode.com/",
  },
  {
    id: "stepik",
    nome: "Stepik",
    logoUrl: "https://www.google.com/s2/favicons?domain=stepik.org&sz=128",
    descricao:
      "Cursos públicos e gratuitos, principalmente de Python, dados, segurança e bioinformática, com trilhas abertas mantidas por instituições.",
    tipo: "Híbrida",
    idioma: "Russo e Inglês (alguns em português)",
    areasFortes: ["Programação", "Python", "Dados"],
    pontosFortes: [
      "Cursos abertos para acompanhar de graça",
      "Exercícios com correção automática",
      "Bom recurso complementar",
    ],
    limitacoes: [
      "Interface menos polida que os grandes marketplaces",
      "A qualidade varia muito conforme o autor",
    ],
    melhorPerfil: "Quem gosta de garimpar recursos menos conhecidos.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: true,
    trilhasOrganizadas: true,
    boaParaIniciantes: true,
    preco: "Grátis cursos públicos / certificado paga selo",
    link: "https://stepik.org/",
  },
  {
    id: "sql-murder-mystery",
    nome: "SQL Murder Mystery",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=mystery.knightlab.com&sz=128",
    descricao:
      "Investigue um crime escrevendo consultas SQL para encontrar o culpado dentro de um banco de dados fictício.",
    tipo: "Gratuita",
    idioma: "Inglês",
    areasFortes: ["Dados", "SQL"],
    pontosFortes: [
      "Aprende SQL resolvendo um caso",
      "Roda no navegador sem instalar nada",
      "Curto e envolvente",
    ],
    limitacoes: [
      "Cobre consultas SQL básicas a intermediárias",
      "Em inglês",
      "Sem certificado",
    ],
    melhorPerfil:
      "Quem está começando em SQL e quer praticar SELECT, JOIN e WHERE de forma divertida.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: false,
    trilhasOrganizadas: false,
    boaParaIniciantes: true,
    preco: "100% Gratuito",
    link: "https://mystery.knightlab.com/",
  },
  {
    id: "regex-crossword",
    nome: "Regex Crossword",
    logoUrl:
      "https://www.google.com/s2/favicons?domain=regexcrossword.com&sz=128",
    descricao:
      "Palavras-cruzadas em que cada pista é uma expressão regular, treinando regex na prática.",
    tipo: "Gratuita",
    idioma: "Inglês",
    areasFortes: ["Programação", "Lógica"],
    pontosFortes: [
      "Fixa a sintaxe de regex jogando",
      "Dificuldade progressiva",
      "Roda no navegador",
    ],
    limitacoes: ["Foco exclusivo em regex", "Em inglês", "Sem certificado"],
    melhorPerfil:
      "Quem quer entender expressões regulares sem decorar tabela de símbolos.",
    nivelIdeal: "Iniciante a intermediário",
    certificado: false,
    trilhasOrganizadas: false,
    boaParaIniciantes: true,
    preco: "100% Gratuito",
    link: "https://regexcrossword.com/",
  },
  {
    id: "cssbattle",
    nome: "CSSBattle",
    logoUrl: "https://www.google.com/s2/favicons?domain=cssbattle.dev&sz=128",
    descricao:
      "Desafios em que você reproduz uma imagem-alvo usando o menor código CSS possível, com ranking.",
    tipo: "Gratuita",
    idioma: "Inglês",
    areasFortes: ["Front-end", "CSS"],
    pontosFortes: [
      "Treina CSS de forma competitiva",
      "Feedback visual imediato",
      "Comunidade e ranking",
    ],
    limitacoes: [
      "Foco em CSS visual, não em projetos completos",
      "Em inglês",
      "Recursos extras no plano pago",
    ],
    melhorPerfil:
      "Quem já sabe CSS básico e quer afiar precisão e criatividade.",
    nivelIdeal: "Intermediário",
    certificado: false,
    trilhasOrganizadas: false,
    boaParaIniciantes: false,
    preco: "Gratuito / plano Pro opcional",
    link: "https://cssbattle.dev/",
  },
];

/**
 * Slugs do catálogo de tecnologias (technologyData) que cada plataforma ensina.
 * Slug ausente do catálogo é ignorado na renderização; plataforma sem entrada
 * fica com tecnologias vazias (mostra só as tags de área, sem faixa de logos).
 * Marketplaces amplos (Udemy, Coursera, etc.) ficam vazios de propósito.
 */
const plataformaTecnologias: Record<string, string[]> = {
  "flexbox-froggy": ["css"],
  "grid-garden": ["css"],
  "css-diner": ["css"],
  cssbattle: ["css", "html"],
  "frontend-mentor": ["html", "css", "javascript"],
  mdn: ["html", "css", "javascript"],
  "the-odin-project": ["html", "css", "javascript", "nodejs", "react"],
  scrimba: ["html", "css", "javascript", "react"],
  "curso-em-video": ["html", "css", "javascript", "php", "git"],
  rocketseat: ["javascript", "nodejs", "react", "react-native"],
  origamid: ["css", "javascript", "react"],
  codecombat: ["python", "javascript"],
  checkio: ["python", "javascript"],
  "elevator-saga": ["javascript"],
  glitch: ["javascript", "nodejs"],
  "hyperskill-jetbrains": ["kotlin", "python", "java"],
  stepik: ["python"],
  datacamp: ["python", "sql", "r"],
  kaggle: ["python", "sql"],
  freecodecamp: ["html", "css", "javascript", "python"],
  codecademy: ["html", "css", "javascript", "python", "sql"],
  w3schools: ["html", "css", "javascript", "sql", "python"],
  "aws-skill-builder": ["aws"],
  "google-cloud-skills-boost": ["google-cloud"],
  "microsoft-learn": ["azure"],
  tryhackme: ["linux"],
  "hack-the-box-academy": ["linux"],
  "sql-murder-mystery": ["sql"],
};

export type PlataformaCategoria =
  | "Cursos"
  | "Jogo"
  | "Desafios"
  | "Playground"
  | "Documentação"
  | "Roadmap";

/** Formato da plataforma. Quem não estiver aqui cai em "Cursos" por padrão. */
const plataformaCategorias: Record<string, PlataformaCategoria> = {
  "flexbox-froggy": "Jogo",
  "grid-garden": "Jogo",
  "css-diner": "Jogo",
  "blockly-games": "Jogo",
  scratch: "Jogo",
  codecombat: "Jogo",
  "elevator-saga": "Jogo",
  "vim-adventures": "Jogo",
  checkio: "Jogo",
  "sql-murder-mystery": "Jogo",
  "regex-crossword": "Jogo",
  codingame: "Desafios",
  codewars: "Desafios",
  leetcode: "Desafios",
  exercism: "Desafios",
  "frontend-mentor": "Desafios",
  cssbattle: "Desafios",
  replit: "Playground",
  glitch: "Playground",
  mdn: "Documentação",
  "roadmap-sh": "Roadmap",
};

export const plataformas = plataformasBase.map((p) => ({
  ...p,
  tecnologias: plataformaTecnologias[p.id] ?? [],
  categoria: plataformaCategorias[p.id] ?? "Cursos",
}));

// estadosBrasil e EVENTO_UF_NACIONAL foram fatiados para eventosData.ts
// (dominio de eventos, carregado sob demanda); reexportados aqui.
export { EVENTO_UF_NACIONAL, estadosBrasil } from "./eventosData";

// O array eventos foi fatiado para eventosData.ts (carregado sob demanda
// pela home); reexportado aqui para os consumidores existentes.
export { eventos } from "./eventosData";

export const projetos = [
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
    ferramentas: ["Node.js", "Express", "Banco de dados", "Postman ou Insomnia"],
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
    objetivo: "Criar uma API que registre ações importantes de um sistema, como login, edição, exclusão e falhas de permissão.",
    ferramentas: ["Node.js", "Express", "PostgreSQL", "Swagger"],
    passosSimplificados: ["Definir os eventos que serão auditados", "Criar o modelo de dados no PostgreSQL", "Construir endpoints para registrar e consultar eventos", "Adicionar filtros por usuário, ação e período", "Documentar a API com Swagger"],
    entregavel: "API funcional com banco de dados, filtros e documentação técnica",
    comoPublicar: "Publicar o código no GitHub e disponibilizar a documentação pelo Swagger ou README com exemplos de uso",
    sugestaoLinkedIn: "Concluí uma API de auditoria de eventos para praticar backend com foco em rastreabilidade e segurança. O projeto me ajudou a entender melhor logs, filtros e documentação de APIs.",
    proximoProjeto: "Sistema de Permissões com Controle de Acesso"
  },
  {
    id: "motor-regras-notificacao",
    nome: "Motor de Regras para Notificações",
    areaSlug: "backend" as string | null,
    nivel: "Avançado",
    objetivo: "Construir um serviço backend que decide quando enviar notificações com base em regras configuráveis.",
    ferramentas: ["Java", "Spring Boot", "Redis", "PostgreSQL", "Docker"],
    passosSimplificados: ["Modelar regras de notificação por evento", "Criar endpoints para cadastrar regras", "Implementar processamento assíncrono com fila ou cache", "Adicionar logs de execução das regras", "Criar testes para cenários de regra válida, inválida e expirada"],
    entregavel: "Serviço backend com motor de regras, persistência e ambiente Docker",
    comoPublicar: "Publicar no GitHub com Docker Compose e exemplos de requisições no README",
    sugestaoLinkedIn: "Finalizei um motor de regras para notificações usando backend mais avançado. Foi um projeto importante para praticar arquitetura, processamento assíncrono e tomada de decisão no servidor.",
    proximoProjeto: "Plataforma de Notificações Multicanal"
  },
  {
    id: "plataforma-eventos-tech",
    nome: "Plataforma de Inscrição em Eventos Tech",
    areaSlug: "fullstack" as string | null,
    nivel: "Intermediário",
    objetivo: "Criar uma aplicação para cadastrar eventos, receber inscrições e gerar lista de participantes.",
    ferramentas: ["React", "Node.js", "PostgreSQL", "Prisma"],
    passosSimplificados: ["Criar telas de listagem e detalhe de eventos", "Implementar cadastro de eventos no backend", "Criar fluxo de inscrição de participantes", "Adicionar painel administrativo simples", "Gerar relatório de inscritos por evento"],
    entregavel: "Aplicação fullstack com frontend, backend e banco de dados integrados",
    comoPublicar: "Publicar o frontend na Vercel e o backend com instruções de execução no GitHub",
    sugestaoLinkedIn: "Construí uma plataforma fullstack de inscrição em eventos tech. O projeto me ajudou a conectar frontend, backend e banco de dados em um fluxo real de produto.",
    proximoProjeto: "Sistema de Check-in com QR Code"
  },
  {
    id: "marketplace-servicos-locais",
    nome: "Marketplace de Serviços Locais",
    areaSlug: "fullstack" as string | null,
    nivel: "Avançado",
    objetivo: "Criar um marketplace em que prestadores cadastram serviços e clientes fazem solicitações com status de atendimento.",
    ferramentas: ["Next.js", "NestJS", "PostgreSQL", "Prisma", "Docker"],
    passosSimplificados: ["Modelar usuários, serviços e solicitações", "Criar autenticação com perfis diferentes", "Implementar cadastro e busca de serviços", "Criar fluxo de solicitação e atualização de status", "Adicionar painel para prestador e cliente", "Preparar ambiente com Docker"],
    entregavel: "Marketplace fullstack com autenticação, perfis e fluxo de serviço completo",
    comoPublicar: "Publicar o frontend na Vercel e manter o backend documentado no GitHub com Docker Compose",
    sugestaoLinkedIn: "Desenvolvi um marketplace de serviços locais para praticar arquitetura fullstack com múltiplos perfis de usuário. Foi um projeto desafiador para trabalhar regras de negócio reais.",
    proximoProjeto: "Sistema de Pagamentos Simulado"
  },
  {
    id: "modelo-controle-estoque",
    nome: "Modelo de Banco para Controle de Estoque",
    areaSlug: "banco-de-dados" as string | null,
    nivel: "Intermediário",
    objetivo: "Modelar um banco relacional para controlar produtos, entradas, saídas, fornecedores e estoque mínimo.",
    ferramentas: ["PostgreSQL", "SQL", "DBeaver", "Draw.io"],
    passosSimplificados: ["Levantar entidades principais do estoque", "Criar modelo entidade relacionamento", "Implementar tabelas com chaves e restrições", "Criar consultas para saldo e movimentações", "Documentar decisões de modelagem"],
    entregavel: "Modelo relacional com scripts SQL, diagrama e consultas úteis",
    comoPublicar: "Publicar os scripts, o diagrama e exemplos de consultas no GitHub",
    sugestaoLinkedIn: "Concluí um projeto de modelagem de banco para controle de estoque. Foi uma prática importante para reforçar SQL, relacionamentos e regras de integridade.",
    proximoProjeto: "API de Estoque com Relatórios"
  },
  {
    id: "data-mart-comercial",
    nome: "Data Mart Comercial",
    areaSlug: "banco-de-dados" as string | null,
    nivel: "Avançado",
    objetivo: "Criar um modelo dimensional para análise de vendas, clientes, produtos e metas comerciais.",
    ferramentas: ["PostgreSQL", "SQL", "dbdiagram.io", "Power BI"],
    passosSimplificados: ["Definir fatos e dimensões do domínio comercial", "Criar tabelas dimensionais e tabela fato", "Popular dados simulados", "Criar consultas analíticas com agregações", "Conectar o modelo a um dashboard simples"],
    entregavel: "Data mart com modelo estrela, scripts SQL e consultas analíticas",
    comoPublicar: "Publicar scripts e diagrama no GitHub, com prints do dashboard no README",
    sugestaoLinkedIn: "Finalizei um data mart comercial para praticar modelagem dimensional. O projeto me ajudou a entender como bancos são estruturados para análise e tomada de decisão.",
    proximoProjeto: "Pipeline ETL para Data Warehouse"
  },
  {
    id: "catalogo-dados-publicos",
    nome: "Catálogo de Dados Públicos",
    areaSlug: "dados" as string | null,
    nivel: "Iniciante",
    objetivo: "Criar um catálogo organizado com bases públicas brasileiras, explicando finalidade, colunas e possíveis análises.",
    ferramentas: ["Google Sheets", "Markdown", "GitHub"],
    passosSimplificados: ["Escolher 5 bases públicas", "Registrar origem e descrição de cada base", "Mapear principais colunas", "Sugerir perguntas de análise para cada base", "Publicar o catálogo com organização clara"],
    entregavel: "Catálogo de dados documentado para consulta e estudo",
    comoPublicar: "Publicar no GitHub como README ou página simples no GitHub Pages",
    sugestaoLinkedIn: "Montei um catálogo de dados públicos brasileiros para praticar documentação e leitura de bases reais. Esse projeto me ajudou a transformar dados soltos em material útil para análise.",
    proximoProjeto: "Dashboard com Dados Públicos"
  },
  {
    id: "analise-churn-streaming",
    nome: "Análise de Churn em Serviço de Streaming",
    areaSlug: "analise-dados" as string | null,
    nivel: "Intermediário",
    objetivo: "Analisar padrões de cancelamento em uma base simulada de clientes de streaming.",
    ferramentas: ["Python", "Pandas", "Matplotlib", "Jupyter Notebook"],
    passosSimplificados: ["Carregar e limpar a base de clientes", "Criar métricas de churn por perfil", "Comparar comportamento por plano e tempo de uso", "Gerar gráficos explicativos", "Escrever conclusões e recomendações"],
    entregavel: "Notebook analítico com gráficos, insights e recomendações de negócio",
    comoPublicar: "Publicar o notebook no GitHub com README explicando o problema e os principais achados",
    sugestaoLinkedIn: "Concluí uma análise de churn em um serviço de streaming. O projeto me ajudou a praticar limpeza de dados, análise exploratória e comunicação de insights.",
    proximoProjeto: "Modelo de Previsão de Churn"
  },
  {
    id: "painel-financeiro-executivo",
    nome: "Painel Financeiro Executivo",
    areaSlug: "analise-dados" as string | null,
    nivel: "Avançado",
    objetivo: "Criar um painel para acompanhar receita, custos, margem, ticket médio e variação mensal.",
    ferramentas: ["Power BI", "DAX", "Excel", "SQL"],
    passosSimplificados: ["Estruturar uma base financeira simulada", "Criar medidas DAX para indicadores principais", "Montar páginas de visão geral e detalhamento", "Adicionar filtros por período, categoria e centro de custo", "Escrever análise executiva dos resultados"],
    entregavel: "Dashboard financeiro com KPIs, filtros e interpretação de negócio",
    comoPublicar: "Publicar prints e arquivo do projeto no GitHub, com explicação das medidas no README",
    sugestaoLinkedIn: "Desenvolvi um painel financeiro executivo com foco em indicadores de negócio. Foi uma ótima prática para transformar dados financeiros em visualizações úteis para decisão.",
    proximoProjeto: "Previsão de Receita com Séries Temporais"
  },
  {
    id: "pipeline-etl-dados-saude",
    nome: "Pipeline ETL de Dados de Saúde",
    areaSlug: "engenharia-dados" as string | null,
    nivel: "Intermediário",
    objetivo: "Criar um pipeline que coleta, limpa e organiza dados de saúde em tabelas prontas para análise.",
    ferramentas: ["Python", "Pandas", "PostgreSQL", "Docker"],
    passosSimplificados: ["Escolher uma base pública ou simulada de saúde", "Criar etapa de extração dos arquivos", "Aplicar tratamento e padronização dos dados", "Carregar os dados tratados no PostgreSQL", "Documentar o fluxo de ponta a ponta"],
    entregavel: "Pipeline ETL funcional com banco populado e documentação",
    comoPublicar: "Publicar no GitHub com Docker Compose e instruções para executar localmente",
    sugestaoLinkedIn: "Concluí um pipeline ETL de dados de saúde. Foi uma prática muito boa para entender extração, transformação e carga em um fluxo organizado.",
    proximoProjeto: "Data Warehouse de Indicadores de Saúde"
  },
  {
    id: "lakehouse-mini-vendas",
    nome: "Mini Lakehouse de Vendas",
    areaSlug: "engenharia-dados" as string | null,
    nivel: "Avançado",
    objetivo: "Simular uma arquitetura lakehouse com camadas de dados brutos, tratados e prontos para análise.",
    ferramentas: ["Python", "DuckDB", "Parquet", "Docker", "SQL"],
    passosSimplificados: ["Criar dados simulados de vendas em arquivos CSV", "Organizar camada bruta de dados", "Transformar arquivos para Parquet", "Criar camada analítica com DuckDB", "Escrever consultas de negócio", "Documentar a arquitetura em camadas"],
    entregavel: "Mini lakehouse local com camadas de dados e consultas analíticas",
    comoPublicar: "Publicar no GitHub com estrutura de pastas, scripts e diagrama da arquitetura",
    sugestaoLinkedIn: "Desenvolvi um mini lakehouse de vendas para praticar engenharia de dados. O projeto me ajudou a entender melhor camadas de dados, Parquet e consultas analíticas.",
    proximoProjeto: "Orquestração de Pipeline com Airflow"
  },
  {
    id: "ci-cd-api-docker",
    nome: "CI/CD para API com Docker",
    areaSlug: "devops" as string | null,
    nivel: "Intermediário",
    objetivo: "Criar uma esteira de integração contínua para testar, validar e empacotar uma API em Docker.",
    ferramentas: ["GitHub Actions", "Docker", "Node.js", "Jest"],
    passosSimplificados: ["Criar uma API simples com testes", "Escrever Dockerfile para a aplicação", "Configurar workflow no GitHub Actions", "Executar testes automaticamente a cada push", "Gerar imagem Docker como artefato"],
    entregavel: "Pipeline CI/CD funcional com testes automatizados e build Docker",
    comoPublicar: "Publicar no GitHub com badge do workflow no README",
    sugestaoLinkedIn: "Configurei uma esteira CI/CD para uma API com Docker e GitHub Actions. Foi um projeto importante para praticar automação de testes e build em ambiente real.",
    proximoProjeto: "Deploy Automatizado em Ambiente Cloud"
  },
  {
    id: "observabilidade-microservicos",
    nome: "Observabilidade para Microserviços",
    areaSlug: "devops" as string | null,
    nivel: "Avançado",
    objetivo: "Montar um ambiente com métricas, logs e dashboards para acompanhar a saúde de serviços.",
    ferramentas: ["Docker", "Prometheus", "Grafana", "Node.js", "Loki"],
    passosSimplificados: ["Criar dois serviços simples em containers", "Expor métricas de aplicação", "Configurar Prometheus para coletar métricas", "Criar dashboards no Grafana", "Adicionar coleta de logs", "Documentar alertas e indicadores principais"],
    entregavel: "Ambiente local de observabilidade com dashboards e logs centralizados",
    comoPublicar: "Publicar no GitHub com Docker Compose, prints dos dashboards e guia de execução",
    sugestaoLinkedIn: "Finalizei um laboratório de observabilidade para microserviços. Foi uma prática avançada para entender métricas, logs e monitoramento de aplicações.",
    proximoProjeto: "Kubernetes Local com Monitoramento"
  },
  {
    id: "upload-serverless-imagens",
    nome: "Upload Serverless de Imagens",
    areaSlug: "cloud" as string | null,
    nivel: "Intermediário",
    objetivo: "Criar uma arquitetura serverless para upload, armazenamento e listagem de imagens.",
    ferramentas: ["AWS S3", "AWS Lambda", "API Gateway", "Node.js"],
    passosSimplificados: ["Desenhar a arquitetura da solução", "Criar endpoint para gerar URL de upload", "Armazenar imagens no bucket", "Criar função para listar arquivos enviados", "Documentar permissões e fluxo da aplicação"],
    entregavel: "Arquitetura serverless documentada com código das funções",
    comoPublicar: "Publicar o código no GitHub com diagrama da arquitetura e instruções de configuração",
    sugestaoLinkedIn: "Criei uma solução serverless para upload de imagens. Esse projeto me ajudou a entender melhor serviços cloud, permissões e arquitetura sem servidor.",
    proximoProjeto: "Processamento Automático de Imagens na Cloud"
  },
  {
    id: "arquitetura-alta-disponibilidade",
    nome: "Arquitetura de Alta Disponibilidade para Aplicação Web",
    areaSlug: "cloud" as string | null,
    nivel: "Avançado",
    objetivo: "Projetar uma arquitetura cloud para uma aplicação web com escalabilidade, segurança e tolerância a falhas.",
    ferramentas: ["AWS", "Terraform", "Docker", "Nginx", "PostgreSQL"],
    passosSimplificados: ["Desenhar a arquitetura com camadas de rede e aplicação", "Definir recursos de infraestrutura como código", "Configurar balanceamento e banco gerenciado ou simulado", "Adicionar regras básicas de segurança", "Documentar decisões de custo, disponibilidade e escalabilidade"],
    entregavel: "Projeto de arquitetura cloud com infraestrutura como código e documentação",
    comoPublicar: "Publicar no GitHub com Terraform, diagrama e explicação técnica no README",
    sugestaoLinkedIn: "Desenvolvi um projeto de arquitetura cloud com foco em alta disponibilidade. Foi uma prática avançada para pensar infraestrutura, segurança e escalabilidade de forma integrada.",
    proximoProjeto: "Deploy Multiambiente com Terraform"
  },
  {
    id: "lab-hardening-linux",
    nome: "Laboratório de Hardening Linux",
    areaSlug: "ciberseguranca" as string | null,
    nivel: "Intermediário",
    objetivo: "Criar um checklist prático de endurecimento de segurança em um servidor Linux.",
    ferramentas: ["Linux", "UFW", "SSH", "Bash"],
    passosSimplificados: ["Criar uma máquina Linux local ou em VM", "Revisar usuários e permissões", "Configurar firewall básico", "Endurecer acesso SSH", "Criar script de verificação de configurações", "Documentar antes e depois das mudanças"],
    entregavel: "Checklist técnico com scripts e evidências de configuração segura",
    comoPublicar: "Publicar scripts e documentação no GitHub, sem expor credenciais ou dados sensíveis",
    sugestaoLinkedIn: "Concluí um laboratório de hardening Linux para praticar segurança defensiva. O projeto me ajudou a entender configurações básicas que reduzem riscos em servidores.",
    proximoProjeto: "Monitoramento de Logs de Segurança"
  },
  {
    id: "siem-domestico-logs",
    nome: "SIEM Doméstico com Análise de Logs",
    areaSlug: "ciberseguranca" as string | null,
    nivel: "Avançado",
    objetivo: "Montar um ambiente para coletar, centralizar e analisar logs de segurança de máquinas locais.",
    ferramentas: ["Wazuh", "Docker", "Linux", "Elastic Stack"],
    passosSimplificados: ["Subir ambiente de coleta de logs", "Adicionar uma máquina como agente", "Gerar eventos controlados de login e alteração de arquivos", "Criar regras ou filtros de análise", "Montar painel com eventos relevantes", "Documentar hipóteses de detecção"],
    entregavel: "Laboratório SIEM com coleta de logs, alertas e painel documentado",
    comoPublicar: "Publicar documentação, prints e arquivos de configuração no GitHub, sem dados privados",
    sugestaoLinkedIn: "Montei um laboratório SIEM para estudar análise de logs e detecção de eventos. Foi um projeto avançado para entender melhor segurança defensiva na prática.",
    proximoProjeto: "Playbook de Resposta a Incidentes"
  },
  {
    id: "plano-testes-ecommerce",
    nome: "Plano de Testes para E-commerce",
    areaSlug: "qa" as string | null,
    nivel: "Intermediário",
    objetivo: "Criar um plano de testes completo para os fluxos principais de um e-commerce.",
    ferramentas: ["Google Sheets", "Jira", "Markdown", "Miro"],
    passosSimplificados: ["Mapear fluxos críticos do e-commerce", "Definir cenários positivos e negativos", "Criar casos de teste por prioridade", "Registrar critérios de aceite", "Simular abertura de bugs com severidade e evidências"],
    entregavel: "Plano de testes com casos, critérios e exemplos de bugs documentados",
    comoPublicar: "Publicar no GitHub como documentação em Markdown ou planilha exportada",
    sugestaoLinkedIn: "Criei um plano de testes para um e-commerce, cobrindo cenários críticos e critérios de aceite. Esse projeto reforçou minha visão de qualidade antes mesmo da automação.",
    proximoProjeto: "Automação de Testes para Checkout"
  },
  {
    id: "app-habitos-offline",
    nome: "App de Hábitos com Modo Offline",
    areaSlug: "mobile" as string | null,
    nivel: "Intermediário",
    objetivo: "Criar um aplicativo para registrar hábitos diários mesmo sem conexão com a internet.",
    ferramentas: ["Kotlin", "Android Studio", "Room", "Material Design"],
    passosSimplificados: ["Criar tela de cadastro de hábitos", "Salvar registros localmente com Room", "Adicionar calendário ou histórico simples", "Criar resumo semanal", "Melhorar experiência visual com Material Design"],
    entregavel: "Aplicativo Android funcional com persistência local",
    comoPublicar: "Publicar o código no GitHub com prints e APK de demonstração em release",
    sugestaoLinkedIn: "Desenvolvi um app mobile de hábitos com funcionamento offline. O projeto me ajudou a praticar persistência local, telas nativas e experiência de uso no Android.",
    proximoProjeto: "App de Hábitos com Sincronização em Nuvem"
  },
  {
    id: "jogo-logica-2d",
    nome: "Jogo 2D de Lógica e Fases",
    areaSlug: "gamedev" as string | null,
    nivel: "Intermediário",
    objetivo: "Criar um jogo 2D com fases curtas, obstáculos e mecânica de resolução de lógica.",
    ferramentas: ["Godot", "GDScript", "Aseprite", "Git"],
    passosSimplificados: ["Definir mecânica principal do jogo", "Criar personagem e movimentação", "Construir 5 fases com dificuldade crescente", "Adicionar colisões, pontuação e reinício", "Criar tela inicial e tela de vitória"],
    entregavel: "Jogo 2D jogável com fases, arte simples e lógica de progressão",
    comoPublicar: "Publicar no Itch.io e colocar o código ou devlog no GitHub",
    sugestaoLinkedIn: "Desenvolvi um jogo 2D de lógica com fases progressivas. Foi um projeto divertido para praticar programação, design de níveis e organização de mecânicas.",
    proximoProjeto: "Jogo 2D com Sistema de Inventário"
  },
  {
    id: "assistente-estudos-rag",
    nome: "Assistente de Estudos com Documentos",
    areaSlug: "ia" as string | null,
    nivel: "Iniciante",
    objetivo: "Criar um assistente que responde perguntas com base em PDFs ou anotações fornecidas pelo usuário.",
    ferramentas: ["Python", "LangChain", "Streamlit", "OpenAI API"],
    passosSimplificados: ["Criar interface para upload de documentos", "Extrair texto dos arquivos", "Dividir o conteúdo em trechos", "Enviar perguntas para o modelo com contexto", "Exibir resposta com referência ao trecho usado"],
    entregavel: "Assistente simples de perguntas e respostas sobre documentos",
    comoPublicar: "Publicar no GitHub e hospedar a interface no Streamlit Community Cloud",
    sugestaoLinkedIn: "Criei um assistente de estudos com IA que responde perguntas a partir de documentos. Foi meu primeiro passo prático para entender RAG e aplicações reais de IA.",
    proximoProjeto: "Chatbot com Memória e Histórico"
  },
  {
    id: "agente-triagem-suporte",
    nome: "Agente de Triagem de Suporte",
    areaSlug: "ia" as string | null,
    nivel: "Intermediário",
    objetivo: "Criar um agente que classifica mensagens de suporte por prioridade, assunto e próximo passo recomendado.",
    ferramentas: ["Python", "FastAPI", "OpenAI API", "PostgreSQL"],
    passosSimplificados: ["Criar base simulada de tickets", "Definir categorias e prioridades", "Construir endpoint de classificação", "Salvar resultado e justificativa no banco", "Criar painel simples para revisar tickets classificados"],
    entregavel: "Agente de triagem com API, banco e painel de revisão",
    comoPublicar: "Publicar no GitHub com exemplos de chamadas e prints do painel",
    sugestaoLinkedIn: "Finalizei um agente de triagem de suporte com IA. O projeto me ajudou a pensar além do chatbot, aplicando IA em classificação, priorização e apoio operacional.",
    proximoProjeto: "Agente de Suporte com Base de Conhecimento"
  },
  {
    id: "avaliador-curriculo-ia",
    nome: "Avaliador de Currículos com IA",
    areaSlug: "ia" as string | null,
    nivel: "Avançado",
    objetivo: "Criar uma aplicação que compara currículos com vagas e gera recomendações de melhoria.",
    ferramentas: ["Python", "FastAPI", "React", "OpenAI API", "PostgreSQL"],
    passosSimplificados: ["Criar upload de currículo e descrição da vaga", "Extrair informações relevantes dos textos", "Comparar requisitos com experiências", "Gerar pontuação e recomendações", "Salvar análises anteriores", "Criar tela de histórico para o usuário"],
    entregavel: "Aplicação com análise de currículo, comparação com vaga e histórico",
    comoPublicar: "Publicar frontend na Vercel e backend no GitHub com instruções de execução local",
    sugestaoLinkedIn: "Desenvolvi um avaliador de currículos com IA que compara perfil e vaga. Foi um projeto avançado para praticar produto, backend, frontend e uso responsável de modelos generativos.",
    proximoProjeto: "Plataforma de Preparação para Entrevistas com IA"
  },
  {
    id: "editor-roadmap-interativo",
    nome: "Editor de Roadmap Interativo",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    objetivo: "Criar uma interface em que o usuário monta um roadmap visual com etapas, status e prioridades.",
    ferramentas: ["React", "TypeScript", "Zustand", "Tailwind CSS"],
    passosSimplificados: ["Criar estrutura visual de etapas", "Permitir adicionar, editar e remover cards", "Adicionar status e prioridade", "Salvar dados no localStorage", "Criar exportação simples em JSON"],
    entregavel: "Interface interativa de roadmap com persistência local",
    comoPublicar: "Publicar na Vercel ou Netlify e disponibilizar o código no GitHub",
    sugestaoLinkedIn: "Criei um editor de roadmap interativo para praticar frontend além de páginas estáticas. O projeto me ajudou a trabalhar estado, persistência local e experiência de uso.",
    proximoProjeto: "Roadmap Colaborativo Fullstack"
  },
  {
    id: "comparador-planos-tech",
    nome: "Comparador de Planos de Ferramentas Tech",
    areaSlug: "frontend" as string | null,
    nivel: "Intermediário",
    objetivo: "Criar uma página que compara ferramentas, preços, recursos e indica a melhor opção por perfil.",
    ferramentas: ["Vue.js", "TypeScript", "Pinia", "CSS"],
    passosSimplificados: ["Criar base local de ferramentas e planos", "Montar cards comparativos", "Adicionar filtros por preço e recurso", "Criar lógica de recomendação por perfil", "Adicionar visualização responsiva"],
    entregavel: "Aplicação frontend com filtros, comparação e recomendação simples",
    comoPublicar: "Publicar no Netlify ou GitHub Pages com repositório aberto",
    sugestaoLinkedIn: "Desenvolvi um comparador de planos de ferramentas tech. Foi um projeto interessante para praticar estado, filtros e tomada de decisão na interface.",
    proximoProjeto: "Comparador com Backend e Login"
  },
  {
    id: "discovery-funcionalidade-ia",
    nome: "Discovery de Funcionalidade com IA",
    areaSlug: "produto" as string | null,
    nivel: "Intermediário",
    objetivo: "Estruturar o discovery de uma funcionalidade que usa IA para recomendar trilhas de estudo personalizadas.",
    ferramentas: ["Notion", "Miro", "Figma", "Google Forms"],
    passosSimplificados: ["Definir problema e público alvo", "Levantar hipóteses de valor", "Criar matriz de priorização", "Desenhar fluxo da funcionalidade", "Definir critérios de sucesso e riscos"],
    entregavel: "Documento de discovery com problema, hipóteses, fluxo e métricas",
    comoPublicar: "Publicar como case em Notion, PDF ou artigo no LinkedIn",
    sugestaoLinkedIn: "Estruturei um discovery de produto para uma funcionalidade com IA. O projeto me ajudou a pensar valor, riscos e métricas antes de partir para a solução.",
    proximoProjeto: "MVP de Recomendação de Trilhas"
  },
  {
    id: "metricas-retencao-produto",
    nome: "Estratégia de Métricas para Retenção",
    areaSlug: "produto" as string | null,
    nivel: "Avançado",
    objetivo: "Criar uma estratégia de métricas para acompanhar retenção, ativação e engajamento de um produto digital.",
    ferramentas: ["Amplitude", "Google Sheets", "Notion", "Figma"],
    passosSimplificados: ["Definir a jornada principal do usuário", "Mapear eventos relevantes do produto", "Criar funil de ativação", "Definir métricas de retenção por coorte", "Propor experimentos para melhorar engajamento", "Documentar decisões em formato de case"],
    entregavel: "Plano de métricas de produto com eventos, funil, coortes e experimentos",
    comoPublicar: "Publicar como case em Notion, PDF ou carrossel no LinkedIn",
    sugestaoLinkedIn: "Concluí uma estratégia de métricas para retenção de produto digital. Foi um projeto avançado para conectar comportamento do usuário, dados e decisões de produto.",
    proximoProjeto: "Dashboard de Produto com Eventos Simulados"
  },
  {
    id: "editor-colaborativo-tempo-real",
    nome: "Editor de Texto Colaborativo em Tempo Real",
    areaSlug: "frontend" as string | null,
    nivel: "Avançado",
    objetivo: "Construir um editor onde várias pessoas editam o mesmo documento ao mesmo tempo, com cursores e sincronização sem conflito.",
    ferramentas: ["React", "TypeScript", "Yjs", "WebSocket", "Tailwind CSS"],
    passosSimplificados: ["Criar a interface do editor com área de texto e barra de ferramentas", "Integrar uma estrutura de dados colaborativa (CRDT) para o conteúdo", "Conectar os clientes por WebSocket", "Exibir cursores e seleções de outros usuários", "Tratar reconexão e estado offline temporário"],
    entregavel: "Editor colaborativo publicado com várias sessões editando o mesmo documento",
    comoPublicar: "Publicar o frontend na Vercel e o servidor de sincronização no Railway, com código no GitHub",
    sugestaoLinkedIn: "Construí um editor de texto colaborativo em tempo real para praticar frontend avançado com CRDT e WebSocket. O maior aprendizado foi lidar com sincronização e estado compartilhado sem travar a interface.",
    proximoProjeto: "Whiteboard Colaborativo com Histórico"
  },
  {
    id: "roguelike-procedural",
    nome: "Roguelike com Geração Procedural",
    areaSlug: "gamedev" as string | null,
    nivel: "Avançado",
    objetivo: "Criar um jogo roguelike onde mapas, inimigos e itens são gerados proceduralmente a cada partida.",
    ferramentas: ["Godot", "GDScript", "Aseprite", "Git"],
    passosSimplificados: ["Definir as regras de geração de salas e corredores", "Implementar geração procedural de mapas conectados", "Criar sistema de inimigos com dificuldade escalável", "Adicionar itens, inventário e progressão", "Implementar salvamento de progresso e tela de fim de jogo"],
    entregavel: "Jogo jogável com mapas diferentes a cada partida, inimigos e itens",
    comoPublicar: "Publicar no Itch.io e manter o código ou devlog no GitHub",
    sugestaoLinkedIn: "Finalizei um roguelike com geração procedural de mapas e inimigos. Foi um projeto avançado para praticar algoritmos de geração, balanceamento e arquitetura de jogo.",
    proximoProjeto: "Roguelike com Combate por Turnos"
  },
  {
    id: "app-offline-first-sync",
    nome: "App Offline-first com Sincronização",
    areaSlug: "mobile" as string | null,
    nivel: "Avançado",
    objetivo: "Criar um aplicativo que funciona totalmente offline e sincroniza com a nuvem quando há conexão, resolvendo conflitos.",
    ferramentas: ["Kotlin", "Android Studio", "Room", "WorkManager", "Firebase"],
    passosSimplificados: ["Modelar dados locais com banco no dispositivo", "Permitir criar, editar e excluir registros offline", "Implementar fila de sincronização em segundo plano", "Resolver conflitos entre versão local e remota", "Mostrar status de sincronização ao usuário"],
    entregavel: "Aplicativo Android que opera offline e sincroniza com a nuvem de forma confiável",
    comoPublicar: "Publicar o código no GitHub com prints, vídeo de demonstração e APK em release",
    sugestaoLinkedIn: "Desenvolvi um app mobile offline-first com sincronização e resolução de conflitos. O desafio foi garantir consistência de dados entre o dispositivo e a nuvem sem perder informação.",
    proximoProjeto: "App com Sincronização Multiusuário"
  },
  {
    id: "design-system-multiplataforma",
    nome: "Design System Multiplataforma",
    areaSlug: "uxui" as string | null,
    nivel: "Avançado",
    objetivo: "Criar um design system completo com tokens, componentes, acessibilidade e documentação para uso em web e mobile.",
    ferramentas: ["Figma", "FigJam", "Tokens Studio", "Material Design"],
    passosSimplificados: ["Definir fundamentos de cor, tipografia, espaçamento e grid", "Criar tokens reutilizáveis e temas claro e escuro", "Desenhar componentes com variantes e estados", "Documentar uso, acessibilidade e regras de cada componente", "Montar telas de exemplo aplicando o sistema"],
    entregavel: "Design system documentado com tokens, componentes e exemplos de aplicação",
    comoPublicar: "Publicar o arquivo público do Figma e apresentar o processo em um case no Behance ou LinkedIn",
    sugestaoLinkedIn: "Concluí um design system multiplataforma com tokens, componentes e documentação de acessibilidade. Foi um projeto avançado para pensar consistência, escala e handoff para desenvolvimento.",
    proximoProjeto: "Contribuição em Design System de Código Aberto"
  },
  {
    id: "gestao-portfolio-indicadores",
    nome: "Gestão de Portfólio de Projetos com Indicadores",
    areaSlug: "gestao" as string | null,
    nivel: "Avançado",
    objetivo: "Estruturar a gestão de um portfólio de projetos com priorização, acompanhamento de status e indicadores de desempenho.",
    ferramentas: ["Notion", "Google Sheets", "Looker Studio", "Miro"],
    passosSimplificados: ["Definir critérios de priorização de projetos", "Criar um painel de portfólio com status e responsáveis", "Definir indicadores de prazo, escopo e entrega", "Montar visão executiva com gráficos de acompanhamento", "Documentar riscos e decisões por projeto"],
    entregavel: "Painel de portfólio com priorização, status e indicadores de desempenho",
    comoPublicar: "Publicar como case em Notion ou PDF, com prints do painel e explicação do método no LinkedIn",
    sugestaoLinkedIn: "Estruturei a gestão de um portfólio de projetos com priorização e indicadores. Foi um projeto avançado para conectar estratégia, acompanhamento e tomada de decisão.",
    proximoProjeto: "Escritório de Projetos (PMO) Simplificado"
  },
  {
    id: "dashboard-gastos-pessoais",
    nome: "Dashboard de Gastos Pessoais",
    areaSlug: "analise-dados" as string | null,
    nivel: "Iniciante",
    objetivo: "Organizar e visualizar gastos pessoais para entender para onde o dinheiro está indo.",
    ferramentas: ["Google Sheets", "Looker Studio"],
    passosSimplificados: ["Registrar gastos por categoria e data", "Limpar e padronizar os dados", "Criar gráficos de gasto por categoria e por mês", "Adicionar filtros por período", "Escrever conclusões sobre os hábitos de gasto"],
    entregavel: "Dashboard com visão de gastos por categoria e período",
    comoPublicar: "Publicar o link do painel no Looker Studio e descrever o processo no LinkedIn ou GitHub",
    sugestaoLinkedIn: "Montei um dashboard de gastos pessoais para praticar análise de dados do início ao fim. Foi ótimo para treinar organização de dados, visualização e leitura de padrões.",
    proximoProjeto: "Análise de Orçamento com Metas"
  },
  {
    id: "modelo-banco-biblioteca",
    nome: "Modelo de Banco para Biblioteca",
    areaSlug: "banco-de-dados" as string | null,
    nivel: "Iniciante",
    objetivo: "Modelar um banco de dados para controlar livros, autores, usuários e empréstimos de uma biblioteca.",
    ferramentas: ["PostgreSQL", "SQL", "dbdiagram.io"],
    passosSimplificados: ["Levantar as entidades principais da biblioteca", "Criar o modelo entidade relacionamento", "Implementar as tabelas com chaves e relacionamentos", "Inserir dados de exemplo", "Criar consultas para empréstimos e livros disponíveis"],
    entregavel: "Modelo de banco com diagrama, tabelas e consultas de exemplo",
    comoPublicar: "Publicar o diagrama e os scripts SQL no GitHub com explicação do modelo",
    sugestaoLinkedIn: "Modelei um banco de dados para uma biblioteca para praticar do diagrama às consultas. Foi uma boa base para entender relacionamentos e integridade de dados.",
    proximoProjeto: "Banco para Sistema de Locadora"
  },
  {
    id: "higiene-seguranca-contas",
    nome: "Guia de Higiene de Segurança de Contas",
    areaSlug: "ciberseguranca" as string | null,
    nivel: "Iniciante",
    objetivo: "Aprender e documentar boas práticas para proteger contas pessoais contra acessos indevidos.",
    ferramentas: ["Gerenciador de senhas", "Autenticação em duas etapas", "Markdown"],
    passosSimplificados: ["Revisar senhas reutilizadas e fracas em contas próprias", "Ativar autenticação em duas etapas nos principais serviços", "Configurar um gerenciador de senhas", "Revisar permissões de aplicativos conectados", "Documentar um checklist de segurança pessoal"],
    entregavel: "Checklist de segurança de contas com práticas aplicadas e explicadas",
    comoPublicar: "Publicar o checklist no GitHub ou como artigo, sem expor dados pessoais ou senhas",
    sugestaoLinkedIn: "Montei um guia de higiene de segurança de contas aplicando boas práticas na minha própria rotina digital. Foi um primeiro passo prático e responsável em segurança defensiva.",
    proximoProjeto: "Checklist de Hardening de um Computador Pessoal"
  },
  {
    id: "deploy-site-estatico-cloud",
    nome: "Deploy de Site Estático na Nuvem",
    areaSlug: "cloud" as string | null,
    nivel: "Iniciante",
    objetivo: "Publicar um site estático na nuvem com domínio e HTTPS.",
    ferramentas: ["HTML", "CSS", "Cloudflare Pages", "Git"],
    passosSimplificados: ["Criar um site estático simples", "Versionar o código no GitHub", "Conectar o repositório a um serviço de hospedagem na nuvem", "Configurar build e publicação automática", "Configurar um domínio e HTTPS"],
    entregavel: "Site publicado na nuvem com domínio e atualização automática",
    comoPublicar: "Compartilhar o link do site publicado e o repositório no GitHub",
    sugestaoLinkedIn: "Publiquei meu primeiro site na nuvem com deploy automático e HTTPS. Foi uma introdução prática a hospedagem, domínios e integração com repositório.",
    proximoProjeto: "Deploy de Aplicação com Backend na Nuvem"
  },
  {
    id: "containerizar-app-docker",
    nome: "Containerizar uma Aplicação com Docker",
    areaSlug: "devops" as string | null,
    nivel: "Iniciante",
    objetivo: "Empacotar uma aplicação simples em um container Docker para rodar em qualquer máquina.",
    ferramentas: ["Docker", "Node.js", "Git"],
    passosSimplificados: ["Escolher ou criar uma aplicação simples", "Escrever um Dockerfile para a aplicação", "Construir a imagem e rodar o container", "Expor a porta e testar o acesso", "Documentar os comandos no README"],
    entregavel: "Aplicação rodando em container com instruções de uso",
    comoPublicar: "Publicar o código com Dockerfile no GitHub e explicar como executar",
    sugestaoLinkedIn: "Containerizei minha primeira aplicação com Docker. Aprendi na prática sobre imagens, containers e por que isso facilita rodar projetos em qualquer ambiente.",
    proximoProjeto: "Subir Aplicação e Banco com Docker Compose"
  },
  {
    id: "pipeline-csv-banco",
    nome: "Pipeline de CSV para Banco de Dados",
    areaSlug: "engenharia-dados" as string | null,
    nivel: "Iniciante",
    objetivo: "Criar um fluxo que lê arquivos CSV, limpa os dados e carrega em um banco de dados.",
    ferramentas: ["Python", "Pandas", "SQLite"],
    passosSimplificados: ["Escolher uma base pública em CSV", "Ler e inspecionar os dados com Python", "Limpar e padronizar colunas e valores", "Carregar os dados tratados em um banco local", "Criar uma consulta de validação dos dados carregados"],
    entregavel: "Script que transforma CSV em dados organizados em um banco",
    comoPublicar: "Publicar o script no GitHub com a base de exemplo e instruções de execução",
    sugestaoLinkedIn: "Criei meu primeiro pipeline de dados, lendo CSV, limpando e carregando em um banco. Foi uma introdução prática a extração, transformação e carga de dados.",
    proximoProjeto: "Pipeline Agendado com Atualização Automática"
  },
  {
    id: "lista-tarefas-fullstack",
    nome: "Lista de Tarefas Fullstack",
    areaSlug: "fullstack" as string | null,
    nivel: "Iniciante",
    objetivo: "Criar um aplicativo completo de lista de tarefas com interface, servidor e banco de dados.",
    ferramentas: ["React", "Node.js", "Express", "SQLite"],
    passosSimplificados: ["Criar a interface para adicionar e listar tarefas", "Criar a API para salvar e buscar tarefas", "Conectar o frontend ao backend", "Salvar as tarefas em um banco", "Permitir concluir e remover tarefas"],
    entregavel: "Aplicação fullstack funcional com frontend, backend e banco integrados",
    comoPublicar: "Publicar o frontend na Vercel e o backend no GitHub com instruções de execução",
    sugestaoLinkedIn: "Construí minha primeira aplicação fullstack, uma lista de tarefas com front, back e banco. Foi ótimo para entender como as partes de uma aplicação se conectam.",
    proximoProjeto: "Lista de Tarefas com Login de Usuário"
  },
  {
    id: "canvas-produto-mvp",
    nome: "Canvas de Produto e Definição de MVP",
    areaSlug: "produto" as string | null,
    nivel: "Iniciante",
    objetivo: "Estruturar uma ideia de produto definindo problema, público, proposta de valor e escopo do MVP.",
    ferramentas: ["Notion", "Miro", "Google Forms"],
    passosSimplificados: ["Escolher um problema real para resolver", "Descrever público, dores e proposta de valor", "Listar funcionalidades e separar o que entra no MVP", "Definir uma métrica inicial de sucesso", "Validar a ideia com algumas pessoas"],
    entregavel: "Documento de produto com problema, proposta de valor e escopo do MVP",
    comoPublicar: "Publicar como case em Notion, PDF ou artigo no LinkedIn",
    sugestaoLinkedIn: "Estruturei uma ideia de produto do problema ao MVP. Foi um primeiro exercício prático de pensar valor, público e escopo antes de construir.",
    proximoProjeto: "Discovery com Entrevistas de Usuário"
  },
  {
    id: "plano-testes-formulario",
    nome: "Plano de Testes para um Formulário",
    areaSlug: "qa" as string | null,
    nivel: "Iniciante",
    objetivo: "Criar e executar um plano de testes manual para um formulário de cadastro.",
    ferramentas: ["Google Sheets", "Markdown"],
    passosSimplificados: ["Mapear os campos e regras do formulário", "Escrever cenários positivos e negativos", "Definir o resultado esperado de cada caso", "Executar os testes e registrar o que aconteceu", "Reportar os problemas encontrados com evidências"],
    entregavel: "Plano de testes com casos, execução e bugs documentados",
    comoPublicar: "Publicar o plano no GitHub como documentação ou planilha exportada",
    sugestaoLinkedIn: "Criei meu primeiro plano de testes manual para um formulário, cobrindo cenários positivos e negativos. Foi uma boa introdução à mentalidade de qualidade.",
    proximoProjeto: "Plano de Testes para um Fluxo de Login"
  },
  {
    id: "kanban-projeto-pessoal",
    nome: "Quadro Kanban para um Projeto Pessoal",
    areaSlug: "gestao" as string | null,
    nivel: "Iniciante",
    objetivo: "Organizar um projeto pessoal usando um quadro Kanban e acompanhamento simples de progresso.",
    ferramentas: ["Trello", "Notion"],
    passosSimplificados: ["Definir o objetivo e as entregas do projeto", "Quebrar o trabalho em tarefas", "Criar colunas de a fazer, fazendo e feito", "Definir prioridades e prazos", "Acompanhar o progresso e ajustar a cada semana"],
    entregavel: "Quadro Kanban organizado com tarefas, prioridades e acompanhamento",
    comoPublicar: "Compartilhar o quadro público e descrever os aprendizados no LinkedIn",
    sugestaoLinkedIn: "Organizei um projeto pessoal com um quadro Kanban e acompanhamento semanal. Foi uma forma prática de aprender gestão de tarefas e priorização.",
    proximoProjeto: "Gestão de Projeto com Cerimônias Ágeis"
  },
];

export const vagasInfo = {
  plataformas: [
    {
      nome: "LinkedIn",
      link: "https://www.linkedin.com/jobs/",
      descricao:
        "Maior rede profissional. Use filtros por 'estágio', 'trainee' e 'remoto'.",
    },
    {
      nome: "Gupy",
      link: "https://www.gupy.io/",
      descricao: "Plataforma usada por grandes empresas brasileiras.",
    },
    {
      nome: "CIEE",
      link: "https://portal.ciee.org.br/",
      descricao: "Focada em estágios para estudantes.",
    },
    {
      nome: "Nube",
      link: "https://www.nube.com.br/",
      descricao: "Vagas de estágio e jovem aprendiz.",
    },
    {
      nome: "Programathor",
      link: "https://programathor.com.br/",
      descricao: "Focada em vagas de tecnologia.",
    },
    {
      nome: "GeekHunter",
      link: "https://www.geekhunter.com.br/",
      descricao: "Plataforma de recrutamento tech.",
    },
    {
      nome: "Trampos",
      link: "https://trampos.co/",
      descricao: "Vagas criativas e de tecnologia.",
    },
    {
      nome: "Indeed",
      link: "https://br.indeed.com/",
      descricao: "Agregador de vagas de diversas fontes.",
    },
  ],
  palavrasChave: [
    "estágio TI",
    "estágio desenvolvimento",
    "junior developer",
    "estágio front-end",
    "estágio UX",
    "estágio dados",
    "trainee tecnologia",
    "estágio programação",
  ],
  diferencas: [
    {
      tipo: "Estágio",
      descricao:
        "Para estudantes. Carga horária reduzida, bolsa-auxílio. Foco em aprendizado.",
    },
    {
      tipo: "Trainee",
      descricao:
        "Para recém-formados. Programa de desenvolvimento acelerado em grandes empresas.",
    },
    {
      tipo: "Júnior",
      descricao:
        "Primeiro emprego formal. Requer alguma experiência ou portfólio.",
    },
    {
      tipo: "Freelancer",
      descricao:
        "Trabalho autônomo por projeto. Requer portfólio e capacidade de prospectar clientes.",
    },
  ],
  dicasCurriculo: [
    "Coloque projetos pessoais como experiência",
    "Liste as tecnologias que realmente sabe",
    "Inclua links para GitHub, Behance ou portfólio",
    "Seja específico sobre o que fez em cada projeto",
    "Mantenha o currículo em 1 página",
  ],
  dicasPortfolio: [
    "Qualidade > Quantidade: 3 projetos bem documentados valem mais que 10 projetos jogados",
    "Documente o processo, não só o resultado",
    "Explique as decisões técnicas que tomou",
    "Inclua o link do repositório no GitHub",
    "Mantenha os projetos funcionando",
  ],
};

export const linkedinDicas = {
  titulo: {
    exemplos: [
      "Estudante de Front-end | Aprendendo React | Em busca de estágio ou trainee",
      "Iniciante em UX/UI Design | Figma | Buscando primeira oportunidade",
      "Estudante de Ciência da Computação | Python | Dados | Aberta a estágios",
      "Transição de carreira para TI | Desenvolvendo habilidades em Back-end",
    ],
    dicas:
      "Seja específico sobre sua área e tecnologias. Mencione que está em busca de oportunidade.",
  },
  sobre: {
    exemplo:
      "Sou estudante de [curso] apaixonada por tecnologia e em transição para a área de [área]. Estou aprendendo [tecnologias] e construindo projetos práticos para desenvolver minhas habilidades. Busco uma oportunidade de estágio ou trainee onde possa contribuir e crescer junto com a equipe.",
    dicas:
      "Seja autêntico, mencione o que está aprendendo e o que busca. Não precisa ter experiência formal.",
  },
  errosComuns: [
    "Perfil sem foto ou com foto inadequada",
    "Título genérico como 'Estudante' sem especificar área",
    "Seção 'Sobre' vazia",
    "Não listar projetos e cursos",
    "Não conectar com pessoas da área",
    "Nunca publicar conteúdo",
  ],
  ideasPosts: [
    "Hoje aprendi [conceito] e ficou muito mais claro quando entendi que...",
    "Finalizei meu projeto de [nome]! Aprendi [tecnologia] e o maior desafio foi...",
    "3 recursos gratuitos que estou usando para aprender [área]:",
    "Semana 1 da minha jornada em tecnologia: o que aprendi e o que foi difícil",
  ],
};

export const noticias = [
  {
    id: "ia-mercado-trabalho",
    titulo: "IA vai eliminar ou criar empregos na TI?",
    resumo:
      "Especialistas debatem o impacto da Inteligência Artificial no mercado de trabalho de tecnologia.",
    fonte: "MIT Technology Review",
    data: "2025",
    link: "https://www.technologyreview.com",
    area: "IA / Mercado de Trabalho",
    impacto: "Alto para iniciantes",
    porQueImporta:
      "Entender o impacto da IA ajuda você a escolher áreas com mais demanda futura e desenvolver habilidades complementares à IA.",
    categoria: "Mercado de Trabalho",
  },
  {
    id: "python-linguagem-mais-popular",
    titulo:
      "Python é a linguagem mais popular do mundo pelo 4º ano consecutivo",
    resumo:
      "Índice TIOBE confirma Python como linguagem mais usada, seguida por C e Java.",
    fonte: "TIOBE Index",
    data: "2025",
    link: "https://www.tiobe.com/tiobe-index/",
    area: "Programação",
    impacto: "Médio para iniciantes",
    porQueImporta:
      "Confirma que aprender Python é uma ótima escolha para iniciantes, com alta demanda no mercado.",
    categoria: "Programação",
  },
  {
    id: "vagas-ti-brasil",
    titulo: "Brasil tem déficit de 800 mil profissionais de TI",
    resumo:
      "Pesquisa aponta que o Brasil precisa de centenas de milhares de profissionais de tecnologia nos próximos anos.",
    fonte: "Brasscom",
    data: "2025",
    link: "https://brasscom.org.br",
    area: "Mercado de Trabalho",
    impacto: "Alto para iniciantes",
    porQueImporta:
      "Há muitas oportunidades no mercado. Mesmo iniciantes têm chances reais de conseguir emprego com dedicação.",
    categoria: "Mercado de Trabalho",
  },
  {
    id: "chatgpt-educacao",
    titulo: "Como usar IA para aprender tecnologia mais rápido",
    resumo:
      "Ferramentas como ChatGPT e GitHub Copilot estão mudando a forma como iniciantes aprendem a programar.",
    fonte: "Dev.to",
    data: "2025",
    link: "https://dev.to",
    area: "IA / Educação",
    impacto: "Alto para iniciantes",
    porQueImporta:
      "Você pode usar IA como ferramenta de aprendizado: tirar dúvidas, explicar conceitos e revisar código.",
    categoria: "Educação Tech",
  },
  {
    id: "remote-work-ti",
    titulo: "70% das vagas de TI ainda oferecem trabalho remoto",
    resumo:
      "Pesquisa mostra que a maioria das empresas de tecnologia mantém opções de trabalho remoto ou híbrido.",
    fonte: "Stack Overflow Survey",
    data: "2025",
    link: "https://survey.stackoverflow.co",
    area: "Mercado de Trabalho",
    impacto: "Alto para iniciantes",
    porQueImporta:
      "Trabalho remoto significa que você pode conseguir vagas em qualquer cidade do Brasil ou até internacionalmente.",
    categoria: "Mercado de Trabalho",
  },
  {
    id: "mulheres-ti",
    titulo: "Mulheres representam apenas 20% dos profissionais de TI no Brasil",
    resumo:
      "Dados mostram que a representatividade feminina na tecnologia ainda é baixa, mas está crescendo.",
    fonte: "Brasscom",
    data: "2025",
    link: "https://brasscom.org.br",
    area: "Diversidade",
    impacto: "Alto para iniciantes",
    porQueImporta:
      "Empresas estão ativamente buscando diversidade. Mulheres em TI têm oportunidades especiais de programas e bolsas.",
    categoria: "Mercado de Trabalho",
  },
];

export interface Comunidade {
  id: string;
  nome: string;
  tipo: string;
  plataforma: string;
  area: string;
  publicoIndicado: string;
  porqueAcompanhar: string;
  link: string;
  idioma: string;
  modalidade: "Online" | "Presencial" | "Híbrido";
  estado?: string;
}

export const comunidades: Comunidade[] = [
  {
    id: "reprograma",
    nome: "{reprograma}",
    tipo: "Comunidade / Escola",
    plataforma: "Instagram / GitHub",
    area: "Programação",
    publicoIndicado: "Mulheres e pessoas não-binárias",
    porqueAcompanhar:
      "Escola de tecnologia para mulheres com bolsas gratuitas. Uma das mais importantes iniciativas de diversidade em tech no Brasil.",
    link: "https://www.reprograma.com.br",
    idioma: "Português",
    modalidade: "Online",
  },
  {
    id: "womakerscode",
    nome: "WoMakersCode",
    tipo: "Comunidade",
    plataforma: "LinkedIn / GitHub",
    area: "Programação / Carreira",
    publicoIndicado: "Mulheres em tecnologia",
    porqueAcompanhar:
      "Maior comunidade de mulheres em tecnologia do Brasil. Eventos, mentorias e conteúdo de carreira.",
    link: "https://womakerscode.org",
    idioma: "Português",
    modalidade: "Online",
  },
  {
    id: "dev-community",
    nome: "DEV Community",
    tipo: "Comunidade / Blog",
    plataforma: "dev.to",
    area: "Programação Geral",
    publicoIndicado: "Todos os níveis",
    porqueAcompanhar:
      "Comunidade global de desenvolvedores. Artigos, discussões e networking internacional.",
    link: "https://dev.to",
    idioma: "Inglês",
    modalidade: "Online",
  },
  {
    id: "tableless",
    nome: "Tableless",
    tipo: "Blog / Comunidade",
    plataforma: "Site / Telegram",
    area: "Front-end / Web",
    publicoIndicado: "Iniciantes e intermediários",
    porqueAcompanhar:
      "Um dos blogs mais antigos e respeitados de front-end em português.",
    link: "https://tableless.com.br",
    idioma: "Português",
    modalidade: "Online",
  },
  {
    id: "data-hackers",
    nome: "Data Hackers",
    tipo: "Comunidade",
    plataforma: "Slack / Medium",
    area: "Ciência de Dados",
    publicoIndicado: "Interessados em dados",
    porqueAcompanhar:
      "Maior comunidade de dados do Brasil. Pesquisa anual sobre o mercado de dados.",
    link: "https://datahackers.com.br",
    idioma: "Português",
    modalidade: "Online",
  },
  {
    id: "ux-collective",
    nome: "UX Collective Brasil",
    tipo: "Blog / Newsletter",
    plataforma: "Medium",
    area: "UX/UI Design",
    publicoIndicado: "Designers e interessados em UX",
    porqueAcompanhar:
      "Artigos de alta qualidade sobre UX/UI em português. Ótimo para se manter atualizado.",
    link: "https://brasil.uxdesign.cc",
    idioma: "Português",
    modalidade: "Online",
  },
  {
    id: "training-center",
    nome: "Training Center",
    tipo: "Comunidade",
    plataforma: "GitHub / Slack",
    area: "Programação Geral",
    publicoIndicado: "Iniciantes em programação",
    porqueAcompanhar:
      "Comunidade focada em ajudar iniciantes com mentorias gratuitas e grupos de estudo.",
    link: "https://github.com/training-center",
    idioma: "Português",
    modalidade: "Online",
  },
  {
    id: "frontendbr",
    nome: "Front-end BR",
    tipo: "Comunidade",
    plataforma: "GitHub / Slack",
    area: "Front-end",
    publicoIndicado: "Desenvolvedores front-end",
    porqueAcompanhar:
      "Comunidade ativa de front-end com discussões técnicas, vagas e eventos.",
    link: "https://github.com/frontendbr",
    idioma: "Português",
    modalidade: "Online",
  },
  {
    id: "python-brasil",
    nome: "Python Brasil",
    tipo: "Comunidade / Associação",
    plataforma: "Site / Telegram",
    area: "Programação / Python",
    publicoIndicado: "Quem usa ou quer aprender Python",
    porqueAcompanhar:
      "Associação que organiza a Python Brasil, maior evento de Python da América Latina, e articula a comunidade Python no país.",
    link: "https://python.org.br/",
    idioma: "Português",
    modalidade: "Híbrido",
  },
  {
    id: "programaria",
    nome: "PrograMaria",
    tipo: "Comunidade / Mídia",
    plataforma: "Site / Instagram",
    area: "Mulheres / Carreira",
    publicoIndicado: "Mulheres que querem entrar ou crescer em tech",
    porqueAcompanhar:
      "Iniciativa com conteúdo, cursos e eventos pra estimular mulheres na tecnologia.",
    link: "https://www.programaria.org/",
    idioma: "Português",
    modalidade: "Online",
  },
  {
    id: "pretalab",
    nome: "PretaLab",
    tipo: "Comunidade / Iniciativa",
    plataforma: "Site / Instagram",
    area: "Diversidade",
    publicoIndicado: "Mulheres negras e indígenas em tech",
    porqueAcompanhar:
      "Iniciativa do Olabi pra ampliar a presença de mulheres negras e indígenas na tecnologia.",
    link: "https://www.pretalab.com/",
    idioma: "Português",
    modalidade: "Online",
  },
  {
    id: "balta-io",
    nome: "balta.io",
    tipo: "Comunidade / Escola",
    plataforma: "Site / Discord",
    area: "Programação / .NET",
    publicoIndicado: "Quem programa em C# e .NET",
    porqueAcompanhar:
      "Comunidade e cursos de C#/.NET criados por André Baltieri, referência na stack Microsoft no Brasil.",
    link: "https://balta.io/",
    idioma: "Português",
    modalidade: "Online",
  },
  {
    id: "braziljs",
    nome: "BrazilJS",
    tipo: "Comunidade / Evento",
    plataforma: "Site",
    area: "Programação / JavaScript",
    publicoIndicado: "Quem trabalha com JavaScript e front-end",
    porqueAcompanhar:
      "Comunidade e conferência de JavaScript, uma das maiores do gênero no Brasil.",
    link: "https://www.braziljs.org/",
    idioma: "Português",
    modalidade: "Híbrido",
  },
  {
    id: "rocketseat",
    nome: "Rocketseat",
    tipo: "Comunidade / Escola",
    plataforma: "Site / Discord",
    area: "Programação",
    publicoIndicado: "Quem está aprendendo a programar",
    porqueAcompanhar:
      "Escola e comunidade de programação com forte presença em front-end, back-end e mobile.",
    link: "https://www.rocketseat.com.br/",
    idioma: "Português",
    modalidade: "Online",
  },
  {
    id: "women-who-code",
    nome: "Women Who Code",
    tipo: "Comunidade",
    plataforma: "Site / Meetup",
    area: "Mulheres / Carreira",
    publicoIndicado: "Mulheres em tecnologia",
    porqueAcompanhar:
      "Rede global de mulheres em tech com encontros e oportunidades, presente em cidades brasileiras.",
    link: "https://womenwhocode.com/",
    idioma: "Português / Inglês",
    modalidade: "Híbrido",
  },
  {
    id: "rails-girls",
    nome: "Rails Girls",
    tipo: "Comunidade / Evento",
    plataforma: "Site",
    area: "Programação / Ruby",
    publicoIndicado: "Mulheres iniciantes em programação",
    porqueAcompanhar:
      "Workshops gratuitos que introduzem mulheres à programação, com edições em várias cidades.",
    link: "https://railsgirls.com/",
    idioma: "Português / Inglês",
    modalidade: "Presencial",
  },
  {
    id: "django-girls",
    nome: "Django Girls",
    tipo: "Comunidade / Evento",
    plataforma: "Site",
    area: "Programação / Python",
    publicoIndicado: "Mulheres iniciantes em programação",
    porqueAcompanhar:
      "Workshops gratuitos de Python/Django pra mulheres, com edições pelo Brasil.",
    link: "https://djangogirls.org",
    idioma: "Português / Inglês",
    modalidade: "Presencial",
  },
  {
    id: "tech-ladies",
    nome: "Tech Ladies",
    tipo: "Comunidade",
    plataforma: "Site",
    area: "Mulheres / Carreira",
    publicoIndicado: "Mulheres buscando vagas em tech",
    porqueAcompanhar:
      "Comunidade global de mulheres em tecnologia com vagas e networking.",
    link: "https://www.hiretechladies.com/",
    idioma: "Inglês",
    modalidade: "Online",
  },
  {
    id: "tdc",
    nome: "The Developers Conference (TDC)",
    tipo: "Evento / Comunidade",
    plataforma: "Site",
    area: "Geral / Eventos",
    publicoIndicado: "Profissionais e estudantes de tech",
    porqueAcompanhar:
      "Um dos maiores eventos de tecnologia do Brasil, com trilhas por tema e edições em várias cidades.",
    link: "https://thedevconf.com/",
    idioma: "Português",
    modalidade: "Híbrido",
  },
  {
    id: "dio",
    nome: "DIO",
    tipo: "Comunidade / Escola",
    plataforma: "Site",
    area: "Programação / Carreira",
    publicoIndicado: "Quem está começando e busca bootcamps",
    porqueAcompanhar:
      "Plataforma e comunidade com bootcamps gratuitos e desafios de código.",
    link: "https://www.dio.me/",
    idioma: "Português",
    modalidade: "Online",
  },
  {
    id: "cumbuca-dev",
    nome: "Cumbuca Dev",
    tipo: "Comunidade",
    plataforma: "Discord / Site",
    area: "Programação",
    publicoIndicado: "Devs que querem estudar em grupo",
    porqueAcompanhar:
      "Comunidade de devs com clubes de estudo e discussões técnicas.",
    link: "https://cumbuca.dev/",
    idioma: "Português",
    modalidade: "Online",
  },
];

export const faculdades = {
  cursos: [
    {
      nome: "Análise e Desenvolvimento de Sistemas (ADS)",
      duracao: "2 anos",
      tipo: "Tecnólogo",
      oQueEstuda:
        "Desenvolvimento de software, banco de dados, redes, gestão de projetos.",
      perfilIndicado:
        "Quem quer entrar rápido no mercado de trabalho como desenvolvedor.",
      diferencas:
        "Mais prático e focado em desenvolvimento. Menor duração que bacharelados.",
      areasAtuacao: [
        "Desenvolvedor",
        "Analista de Sistemas",
        "Suporte Técnico",
      ],
      matematica: "Médio",
      programacao: "Alto",
      pontoPositivos: [
        "Duração curta (2 anos)",
        "Foco prático",
        "Reconhecido pelo mercado",
      ],
      pontosAtencao: [
        "Tecnólogo tem menos prestígio em alguns contextos",
        "Menos aprofundamento teórico",
      ],
    },
    {
      nome: "Ciência da Computação",
      duracao: "4 anos",
      tipo: "Bacharelado",
      oQueEstuda:
        "Algoritmos, estruturas de dados, matemática, teoria da computação, sistemas operacionais.",
      perfilIndicado: "Quem gosta de matemática e quer base teórica sólida.",
      diferencas:
        "Mais teórico e aprofundado. Prepara para pesquisa e áreas mais complexas.",
      areasAtuacao: [
        "Desenvolvedor",
        "Pesquisador",
        "Cientista de Dados",
        "Engenheiro de Software",
      ],
      matematica: "Alto",
      programacao: "Alto",
      pontoPositivos: [
        "Base teórica sólida",
        "Reconhecimento amplo",
        "Abre portas para pesquisa",
      ],
      pontosAtencao: [
        "4 anos de duração",
        "Matemática pesada",
        "Pode ser muito teórico",
      ],
    },
    {
      nome: "Engenharia de Software",
      duracao: "4-5 anos",
      tipo: "Bacharelado",
      oQueEstuda:
        "Desenvolvimento de software, qualidade, metodologias, arquitetura de sistemas.",
      perfilIndicado:
        "Quem quer se especializar em construção de software de qualidade.",
      diferencas:
        "Foco em processo e qualidade de software, diferente da Ciência da Computação que é mais teórica.",
      areasAtuacao: [
        "Engenheiro de Software",
        "Arquiteto de Software",
        "Tech Lead",
        "QA",
      ],
      matematica: "Médio-Alto",
      programacao: "Alto",
      pontoPositivos: [
        "Foco em mercado",
        "Metodologias modernas",
        "Boa empregabilidade",
      ],
      pontosAtencao: ["Duração longa", "Ainda pouco comum no Brasil"],
    },
    {
      nome: "Sistemas de Informação",
      duracao: "4 anos",
      tipo: "Bacharelado",
      oQueEstuda:
        "TI aplicada a negócios, gestão, banco de dados, desenvolvimento.",
      perfilIndicado:
        "Quem quer trabalhar na interseção entre tecnologia e negócio.",
      diferencas:
        "Mais focado em gestão e negócios do que Ciência da Computação.",
      areasAtuacao: [
        "Analista de Sistemas",
        "Consultor de TI",
        "Gestor de TI",
        "Desenvolvedor",
      ],
      matematica: "Médio",
      programacao: "Médio-Alto",
      pontoPositivos: [
        "Visão de negócio",
        "Versatilidade",
        "Boa base para gestão",
      ],
      pontosAtencao: [
        "Menos técnico que Ciência da Computação",
        "Pode ser generalista demais",
      ],
    },
    {
      nome: "Jogos Digitais",
      duracao: "2-3 anos",
      tipo: "Tecnólogo",
      oQueEstuda:
        "Tecnólogo focado em desenvolvimento de jogos digitais. Combina programação (C#, Unity), design, narrativa e modelagem 2D/3D. Mais prático e direto que cursos de TI generalistas.",
      perfilIndicado:
        "Quem tem paixão por games e quer entrar rápido em estúdios ou produção indie.",
      diferencas:
        "Mais curto e prático que bacharelado em design de games. Foco em produção real com engines de mercado.",
      areasAtuacao: [
        "Programador de Jogos",
        "Game Designer Júnior",
        "Desenvolvedor Indie",
        "Level Designer",
      ],
      matematica: "Médio-Alto",
      programacao: "Alto",
      pontoPositivos: [
        "Foco prático",
        "Duração curta",
        "Permite portfólio desde os primeiros semestres",
      ],
      pontosAtencao: [
        "Mercado BR menor que TI tradicional",
        "Salário inicial abaixo da média de dev",
      ],
    },
    {
      nome: "Design de Games",
      duracao: "4 anos",
      tipo: "Bacharelado",
      oQueEstuda:
        "Bacharelado generalista em design de jogos. Aborda programação, design, arte digital, narrativa, UX e produção. Forma o profissional 'completo' pra equipes de game dev.",
      perfilIndicado:
        "Quem quer formação mais ampla e considera atuar em design, arte ou produção (não só código).",
      diferencas:
        "Mais longo e abrangente que o tecnólogo. Boa base teórica e multidisciplinar.",
      areasAtuacao: [
        "Game Designer",
        "Programador de Jogos",
        "Artista Técnico",
        "Produtor de Jogos",
      ],
      matematica: "Médio",
      programacao: "Médio-Alto",
      pontoPositivos: [
        "Formação multidisciplinar",
        "Boa pra quem ainda não decidiu papel específico",
        "Visão completa de pipeline",
      ],
      pontosAtencao: [
        "4 anos é longo pra área dinâmica",
        "Pode ser generalista demais sem especialização paralela",
      ],
    },
    {
      nome: "Engenharia da Computação",
      duracao: "5 anos",
      tipo: "Bacharelado",
      oQueEstuda:
        "Hardware e software, eletrônica, circuitos, sistemas embarcados, programação, redes e estruturas de dados.",
      perfilIndicado:
        "Quem gosta de matemática e física e quer atuar na fronteira entre hardware e software.",
      diferencas:
        "Mais próxima da engenharia e do hardware que a Ciência da Computação, com eletrônica e sistemas embarcados.",
      areasAtuacao: [
        "Desenvolvedor",
        "Engenheiro de Sistemas Embarcados",
        "Engenheiro de Hardware",
        "Engenheiro de Software",
      ],
      matematica: "Alto",
      programacao: "Alto",
      pontoPositivos: [
        "Forte em hardware e software",
        "Boa empregabilidade em várias indústrias",
        "Base sólida de engenharia",
      ],
      pontosAtencao: [
        "5 anos de duração",
        "Matemática e física pesadas",
        "Carga de eletrônica que nem todo mundo curte",
      ],
    },
    {
      nome: "Redes de Computadores",
      duracao: "2-3 anos",
      tipo: "Tecnólogo",
      oQueEstuda:
        "Infraestrutura de redes, protocolos, servidores, administração de sistemas e fundamentos de segurança.",
      perfilIndicado:
        "Quem quer trabalhar com infraestrutura, servidores e conectividade.",
      diferencas:
        "Foco em infraestrutura e operação, não em desenvolvimento de software.",
      areasAtuacao: [
        "Analista de Redes",
        "Administrador de Sistemas",
        "Suporte de Infraestrutura",
        "Analista de Cloud",
      ],
      matematica: "Médio",
      programacao: "Médio",
      pontoPositivos: [
        "Curto e prático",
        "Base para certificações (Cisco, AWS)",
        "Porta de entrada para cloud e DevOps",
      ],
      pontosAtencao: [
        "Pouco foco em programação",
        "Mercado costuma pedir certificações além do diploma",
      ],
    },
    {
      nome: "Segurança da Informação",
      duracao: "2-3 anos",
      tipo: "Tecnólogo",
      oQueEstuda:
        "Fundamentos de cibersegurança, redes, criptografia, análise de vulnerabilidades e resposta a incidentes.",
      perfilIndicado:
        "Quem quer entrar em cibersegurança com uma formação direcionada.",
      diferencas:
        "Especializado em segurança desde o início, diferente de cursos de TI generalistas.",
      areasAtuacao: [
        "Analista de Segurança",
        "Analista SOC",
        "Pentester Júnior",
        "Analista de Conformidade",
      ],
      matematica: "Médio",
      programacao: "Médio-Alto",
      pontoPositivos: [
        "Foco em área aquecida e bem paga",
        "Curto",
        "Base para certificações de segurança",
      ],
      pontosAtencao: [
        "Mercado júnior exige prática e laboratórios próprios",
        "Menos profundidade teórica que um bacharelado em CC",
      ],
    },
    {
      nome: "Ciência de Dados",
      duracao: "2-3 anos",
      tipo: "Tecnólogo",
      oQueEstuda:
        "Estatística aplicada, programação (Python e R), SQL, visualização de dados e introdução a machine learning.",
      perfilIndicado:
        "Quem quer entrar em dados de forma direcionada e prática.",
      diferencas:
        "Foco em dados desde o início, mais aplicado que um bacharelado generalista.",
      areasAtuacao: [
        "Analista de Dados",
        "Cientista de Dados Júnior",
        "Analista de BI",
        "Engenheiro de Dados Júnior",
      ],
      matematica: "Alto",
      programacao: "Médio-Alto",
      pontoPositivos: [
        "Direcionado a uma área aquecida",
        "Prático",
        "Boa base de estatística e programação",
      ],
      pontosAtencao: [
        "Estatística pode ser desafiadora",
        "Cargos sênior costumam pedir mais matemática ou pós",
      ],
    },
    {
      nome: "Gestão da Tecnologia da Informação",
      duracao: "2 anos",
      tipo: "Tecnólogo",
      oQueEstuda:
        "Governança de TI, gestão de projetos, processos, infraestrutura e fundamentos de desenvolvimento e negócios.",
      perfilIndicado:
        "Quem quer atuar na gestão e coordenação de TI mais que na codificação.",
      diferencas:
        "Foco em gestão e negócio, com menos programação que cursos de desenvolvimento.",
      areasAtuacao: [
        "Gestor de TI",
        "Analista de Projetos",
        "Product Owner",
        "Consultor de TI",
      ],
      matematica: "Médio",
      programacao: "Médio",
      pontoPositivos: [
        "Visão de gestão e negócio",
        "Curto",
        "Boa ponte para liderança",
      ],
      pontosAtencao: [
        "Pouca profundidade técnica em código",
        "Mercado júnior técnico pode preferir cursos de desenvolvimento",
      ],
    },
    {
      nome: "Sistemas para Internet",
      duracao: "2 anos",
      tipo: "Tecnólogo",
      oQueEstuda:
        "Desenvolvimento web front-end e back-end, banco de dados, design de interfaces, hospedagem e deploy.",
      perfilIndicado:
        "Quem quer focar em desenvolvimento web e entrar rápido no mercado.",
      diferencas: "Foco específico em web, mais direcionado que o ADS.",
      areasAtuacao: [
        "Desenvolvedor Web",
        "Desenvolvedor Front-end",
        "Desenvolvedor Back-end",
        "Desenvolvedor Full Stack",
      ],
      matematica: "Médio",
      programacao: "Alto",
      pontoPositivos: [
        "Foco prático em web",
        "Curto",
        "Alta demanda por desenvolvedores web",
      ],
      pontosAtencao: [
        "Menos abrangente que o ADS",
        "Pouco aprofundamento teórico",
      ],
    },
    {
      nome: "Inteligência Artificial e Machine Learning",
      duracao: "2-3 anos",
      tipo: "Tecnólogo",
      oQueEstuda:
        "Fundamentos de IA, aprendizado de máquina, Python, estatística, redes neurais e projetos práticos com dados.",
      perfilIndicado:
        "Quem quer entrar direto em IA e dados sem passar por um bacharelado generalista.",
      diferencas:
        "Foco em IA desde o início, mais aplicado e curto que Ciência da Computação.",
      areasAtuacao: [
        "Engenheiro de Machine Learning",
        "Cientista de Dados Júnior",
        "Analista de IA",
        "Desenvolvedor de IA",
      ],
      matematica: "Alto",
      programacao: "Alto",
      pontoPositivos: [
        "Área aquecida e bem paga",
        "Direcionado e prático",
        "Boa base de estatística e Python",
      ],
      pontosAtencao: [
        "Matemática e estatística pesadas",
        "Cargos sênior costumam pedir pós ou mais teoria",
        "Exige projetos próprios para portfólio",
      ],
    },
    {
      nome: "Computação em Nuvem (Cloud Computing)",
      duracao: "2-3 anos",
      tipo: "Tecnólogo",
      oQueEstuda:
        "Infraestrutura em nuvem, virtualização, contêineres, automação, redes e fundamentos de DevOps.",
      perfilIndicado:
        "Quem quer trabalhar com infraestrutura moderna, nuvem e automação.",
      diferencas:
        "Foco em nuvem e automação, mais direcionado que Redes de Computadores.",
      areasAtuacao: [
        "Analista de Cloud",
        "Engenheiro DevOps Júnior",
        "Administrador de Sistemas",
        "Analista de Infraestrutura",
      ],
      matematica: "Médio",
      programacao: "Médio-Alto",
      pontoPositivos: [
        "Área aquecida e bem paga",
        "Prático e curto",
        "Base para certificações (AWS, Azure, GCP)",
      ],
      pontosAtencao: [
        "Mercado pede certificações além do diploma",
        "Pouco foco em desenvolvimento de software",
      ],
    },
    {
      nome: "Internet das Coisas (IoT)",
      duracao: "2-3 anos",
      tipo: "Tecnólogo",
      oQueEstuda:
        "Sistemas embarcados, sensores, redes, programação para dispositivos e integração com a nuvem.",
      perfilIndicado:
        "Quem gosta de hardware e software e quer trabalhar com dispositivos conectados.",
      diferencas:
        "Une eletrônica, redes e programação, diferente dos cursos focados só em software.",
      areasAtuacao: [
        "Desenvolvedor de Sistemas Embarcados",
        "Analista de IoT",
        "Desenvolvedor de Firmware",
        "Analista de Automação",
      ],
      matematica: "Médio-Alto",
      programacao: "Médio-Alto",
      pontoPositivos: [
        "Une hardware e software",
        "Curto e prático",
        "Mercado em crescimento na indústria",
      ],
      pontosAtencao: [
        "Mercado júnior menor que TI tradicional",
        "Exige interesse por eletrônica e redes",
      ],
    },
    {
      nome: "Técnico em Desenvolvimento de Sistemas",
      duracao: "1 a 2 anos",
      tipo: "Técnico",
      oQueEstuda:
        "Lógica de programação, desenvolvimento web e mobile, banco de dados e versionamento de código.",
      perfilIndicado:
        "Quem quer começar a programar cedo, ainda no ensino médio ou logo depois.",
      diferencas:
        "Nível médio (não é superior). Entrada rápida e prática, mas sozinho não dá acesso à pós-graduação.",
      areasAtuacao: [
        "Programador júnior",
        "Desenvolvedor web",
        "Suporte a sistemas",
      ],
      matematica: "Baixo",
      programacao: "Alto",
      pontoPositivos: [
        "Entrada rápida (1 a 2 anos)",
        "Dá pra fazer junto com o ensino médio",
        "Bem prático e voltado a código",
      ],
      pontosAtencao: [
        "Não é curso superior",
        "Sozinho não dá acesso à pós",
        "Mercado costuma pedir continuidade dos estudos",
      ],
    },
    {
      nome: "Técnico em Informática para Internet",
      duracao: "1 a 2 anos",
      tipo: "Técnico",
      oQueEstuda:
        "Criação de sites e aplicações web, HTML, CSS, JavaScript, design de interface e banco de dados.",
      perfilIndicado:
        "Quem curte web e quer criar sites e sistemas online desde cedo.",
      diferencas:
        "Foco em desenvolvimento web no nível médio. Mais específico que o técnico em informática geral.",
      areasAtuacao: [
        "Desenvolvedor web",
        "Front-end júnior",
        "Suporte a sites",
      ],
      matematica: "Baixo",
      programacao: "Alto",
      pontoPositivos: [
        "Foco em web",
        "Prático e rápido",
        "Bom primeiro passo pra front-end",
      ],
      pontosAtencao: [
        "Não é superior",
        "Escopo mais estreito",
        "Pede continuidade pra cargos maiores",
      ],
    },
    {
      nome: "Técnico em Redes de Computadores",
      duracao: "1 a 2 anos",
      tipo: "Técnico",
      oQueEstuda:
        "Instalação e manutenção de redes, cabeamento, configuração de equipamentos, segurança básica e administração de servidores.",
      perfilIndicado:
        "Quem gosta de infraestrutura, hardware e de fazer a rede funcionar.",
      diferencas:
        "Nível médio voltado a infraestrutura de redes. Mais mão na massa que os cursos superiores de redes.",
      areasAtuacao: [
        "Técnico de redes",
        "Suporte de infraestrutura",
        "Auxiliar de TI",
      ],
      matematica: "Médio",
      programacao: "Baixo",
      pontoPositivos: [
        "Prático e voltado a infraestrutura",
        "Entrada rápida",
        "Boa base de hardware e redes",
      ],
      pontosAtencao: [
        "Não é superior",
        "Menos foco em programação",
        "Pede certificações pra crescer",
      ],
    },
    {
      nome: "Técnico em Manutenção e Suporte em Informática",
      duracao: "1 a 2 anos",
      tipo: "Técnico",
      oQueEstuda:
        "Montagem e manutenção de computadores, sistemas operacionais, suporte ao usuário e redes básicas.",
      perfilIndicado:
        "Quem gosta de mexer em hardware e resolver problemas de TI no dia a dia.",
      diferencas:
        "Nível médio focado em hardware e suporte. Porta de entrada prática pra área de TI.",
      areasAtuacao: [
        "Técnico de suporte",
        "Help desk",
        "Técnico de manutenção",
      ],
      matematica: "Baixo",
      programacao: "Baixo",
      pontoPositivos: [
        "Entrada rápida no mercado",
        "Bem prático",
        "Demanda constante por suporte",
      ],
      pontosAtencao: [
        "Não é superior",
        "Pouco foco em programação",
        "Crescimento pede mais estudo e certificação",
      ],
    },
  ],
};

export const menuItems = [
  { path: "/", label: "Início" },
  { path: "/areas", label: "Áreas da TI" },
  { path: "/roadmaps", label: "Roadmaps" },
  { path: "/cursos", label: "Cursos" },
  { path: "/plataformas", label: "Plataformas" },
  { path: "/faculdades", label: "Faculdades" },
  { path: "/eventos", label: "Eventos" },
  { path: "/projetos", label: "Projetos" },
  { path: "/estagio", label: "Estágio, Trainee e Carreira" },
  { path: "/dicas", label: "Dicas" },
  { path: "/mulheres", label: "Área de Mulheres" },
  { path: "/dicionario", label: "Dicionário" },
  { path: "/comparador", label: "Comparador" },
  { path: "/quiz-carreira", label: "Quiz de Carreira" },
  { path: "/perfil", label: "Perfil" },
  { path: "/noticias", label: "Notícias" },
  { path: "/comunidades", label: "Comunidades" },
  { path: "/sobre", label: "Sobre" },
];
