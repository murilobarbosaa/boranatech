// Detalhe editorial dos cursos superiores exibido em /faculdades/:slug
// (pagina FaculdadeDetalhe). Extraido do componente: dado, nao UI, keyed
// por slugifyCourse(nome). O catalogo leve dos cursos vive em data.ts
// (faculdades.cursos); aqui fica so o conteudo rico da pagina de detalhe.

export function slugifyCourse(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type CourseDetail = {
  summary: string;
  careerOptions: string[];
  salaryAreas: string[];
  coreContents: string[];
  practicalProjects: string[];
  technologies: string[];
  firstJobs: string[];
  roadmap: string[];
  marketContext: string;
  areaSlugs: string[];
};

export const courseDetails: Record<string, CourseDetail> = {
  [slugifyCourse("Análise e Desenvolvimento de Sistemas (ADS)")]: {
    summary:
      "ADS é um caminho direto para aprender a criar, manter e entregar sistemas. O curso costuma ser mais prático, com foco em programação, banco de dados, análise de requisitos e desenvolvimento de aplicações para o mercado.",
    careerOptions: [
      "Desenvolvedor(a) Front-end",
      "Desenvolvedor(a) Back-end",
      "Analista de Sistemas",
      "Analista de Suporte",
      "QA Júnior",
    ],
    salaryAreas: ["Front-end", "Back-end", "QA"],
    coreContents: [
      "Lógica de programação",
      "Banco de dados",
      "Desenvolvimento web",
      "Engenharia de software",
      "Redes e sistemas operacionais",
      "Gestão de projetos",
    ],
    practicalProjects: [
      "Sistema CRUD com login",
      "API REST com banco de dados",
      "Dashboard administrativo",
      "Aplicativo web responsivo",
    ],
    technologies: [
      "JavaScript",
      "TypeScript",
      "React",
      "Node.js",
      "SQL",
      "PostgreSQL",
      "Git",
    ],
    firstJobs: [
      "Estágio em Desenvolvimento",
      "Trainee em Tecnologia",
      "Desenvolvedor(a) Júnior",
      "Analista de Sistemas Júnior",
      "Analista de Suporte Técnico",
    ],
    roadmap: [
      "Reforçar lógica e Git",
      "Criar páginas com HTML/CSS/JavaScript",
      "Aprender banco de dados e APIs",
      "Publicar 2 projetos no GitHub",
      "Aplicar para estágio, trainee e vagas júnior",
    ],
    marketContext:
      "É uma boa escolha para quem quer entrar mais rápido no mercado. O diploma ajuda, mas o portfólio e a prática com projetos contam muito nas primeiras oportunidades.",
    areaSlugs: ["frontend", "backend", "qa"],
  },
  [slugifyCourse("Ciência da Computação")]: {
    summary:
      "Ciência da Computação aprofunda fundamentos da computação: algoritmos, estruturas de dados, matemática, arquitetura, sistemas operacionais e teoria. É uma formação forte para engenharia, pesquisa, dados, IA e áreas mais complexas.",
    careerOptions: [
      "Engenheiro(a) de Software",
      "Cientista de Dados",
      "Pesquisador(a)",
      "Desenvolvedor(a) Back-end",
      "Especialista em IA",
    ],
    salaryAreas: ["Back-end", "Dados", "Cloud"],
    coreContents: [
      "Algoritmos",
      "Estruturas de dados",
      "Matemática discreta",
      "Cálculo e álgebra",
      "Sistemas operacionais",
      "IA e computação científica",
    ],
    practicalProjects: [
      "Interpretador simples",
      "Modelo de classificação com dados reais",
      "Sistema distribuído básico",
      "Algoritmos visualizados em uma interface",
    ],
    technologies: [
      "Python",
      "Java",
      "C#",
      "SQL",
      "TensorFlow",
      "Pandas",
      "Linux",
      "Git",
    ],
    firstJobs: [
      "Estágio em Engenharia de Software",
      "Trainee em Engenharia de Software",
      "Desenvolvedor(a) Júnior",
      "Analista de Dados Júnior",
      "Bolsista de pesquisa",
    ],
    roadmap: [
      "Estudar lógica e estruturas de dados",
      "Praticar algoritmos semanalmente",
      "Criar projetos com Python/Java",
      "Explorar dados ou IA",
      "Montar portfólio técnico explicando decisões",
    ],
    marketContext:
      "É uma formação mais longa e exigente, mas abre portas para trilhas técnicas profundas, pesquisa, IA, dados e engenharia de software em empresas maiores.",
    areaSlugs: ["backend", "dados", "ia"],
  },
  [slugifyCourse("Engenharia de Software")]: {
    summary:
      "Engenharia de Software foca em construir software com qualidade, processo e escala. Além de programar, a pessoa aprende requisitos, arquitetura, testes, métricas, manutenção e colaboração em times.",
    careerOptions: [
      "Engenheiro(a) de Software",
      "Arquiteto(a) de Software",
      "QA Engineer",
      "Tech Lead",
      "Product Engineer",
    ],
    salaryAreas: ["Back-end", "Front-end", "QA", "DevOps"],
    coreContents: [
      "Requisitos",
      "Arquitetura de software",
      "Testes e qualidade",
      "Metodologias ágeis",
      "DevOps",
      "Manutenção e evolução de sistemas",
    ],
    practicalProjects: [
      "Sistema com testes automatizados",
      "API documentada",
      "Pipeline simples de CI/CD",
      "Aplicação com arquitetura em camadas",
    ],
    technologies: [
      "TypeScript",
      "React",
      "Node.js",
      "Java",
      "Docker",
      "PostgreSQL",
      "Git",
    ],
    firstJobs: [
      "Estágio em Engenharia de Software",
      "Trainee em Tecnologia",
      "Desenvolvedor(a) Júnior",
      "QA Júnior",
      "Analista de Requisitos Júnior",
    ],
    roadmap: [
      "Aprender fundamentos de programação",
      "Praticar Git e versionamento",
      "Criar projetos com testes",
      "Entender arquitetura e deploy",
      "Documentar projetos como produto real",
    ],
    marketContext:
      "Combina bem com quem gosta de programar, mas também quer entender qualidade, organização, entrega em equipe e manutenção de sistemas profissionais.",
    areaSlugs: ["backend", "frontend", "qa", "devops"],
  },
  [slugifyCourse("Sistemas de Informação")]: {
    summary:
      "Sistemas de Informação conecta tecnologia e negócio. A formação prepara para entender processos, dados, sistemas corporativos e como a TI resolve problemas reais dentro de empresas.",
    careerOptions: [
      "Analista de Sistemas",
      "Consultor(a) de TI",
      "Analista de Dados",
      "Product Owner",
      "Gestor(a) de TI",
    ],
    salaryAreas: ["Dados", "Produto", "Back-end"],
    coreContents: [
      "Processos de negócio",
      "Banco de dados",
      "Desenvolvimento de sistemas",
      "Gestão de TI",
      "Análise de requisitos",
      "BI e tomada de decisão",
    ],
    practicalProjects: [
      "Sistema para processo empresarial",
      "Dashboard de indicadores",
      "Mapeamento de requisitos",
      "Protótipo de produto interno",
    ],
    technologies: [
      "SQL",
      "Python",
      "Power BI",
      "React",
      "PostgreSQL",
      "Figma",
      "Git",
    ],
    firstJobs: [
      "Estágio em TI",
      "Trainee em Tecnologia",
      "Analista de Sistemas Júnior",
      "Analista de Dados Júnior",
      "Consultor(a) de TI Júnior",
    ],
    roadmap: [
      "Entender lógica e banco de dados",
      "Aprender análise de requisitos",
      "Criar dashboards e sistemas simples",
      "Estudar produto e processos",
      "Registrar cases com problema, solução e resultado",
    ],
    marketContext:
      "É uma boa opção para quem quer uma formação versátil e gosta de traduzir necessidade de negócio em solução tecnológica.",
    areaSlugs: ["dados", "produto", "backend"],
  },
  [slugifyCourse("Inteligência Artificial e Machine Learning")]: {
    summary:
      "O curso de Inteligência Artificial e Machine Learning forma profissionais para criar sistemas que aprendem com dados: modelos de previsão, classificação, recomendação e processamento de linguagem. Combina Python, estatística, matemática e muita prática com dados reais.",
    careerOptions: [
      "Engenheiro(a) de Machine Learning",
      "Cientista de Dados Júnior",
      "Analista de IA",
      "Engenheiro(a) de Dados Júnior",
      "Pesquisador(a) em IA",
    ],
    salaryAreas: ["Dados", "Back-end"],
    coreContents: [
      "Python para dados",
      "Estatística e probabilidade",
      "Álgebra linear",
      "Machine learning supervisionado e não supervisionado",
      "Redes neurais e deep learning",
      "Pré-processamento e visualização de dados",
    ],
    practicalProjects: [
      "Modelo de classificação com dados reais",
      "Sistema de recomendação simples",
      "Análise exploratória publicada em notebook",
      "Modelo de previsão com avaliação de métricas",
    ],
    technologies: [
      "Python",
      "SQL",
      "Pandas",
      "NumPy",
      "TensorFlow",
      "PyTorch",
      "Git",
    ],
    firstJobs: [
      "Estágio em Dados ou IA",
      "Trainee em Dados",
      "Analista de Dados Júnior",
      "Engenheiro(a) de Machine Learning Júnior",
      "Bolsista de pesquisa em IA",
    ],
    roadmap: [
      "Aprender Python e lógica",
      "Estudar estatística e álgebra linear",
      "Praticar machine learning no Kaggle Learn",
      "Construir e publicar projetos de modelos no GitHub",
      "Aplicar para estágio e vagas júnior em dados e IA",
    ],
    marketContext:
      "É uma área aquecida e bem paga, mas exige base sólida de matemática e estatística. Cargos sênior costumam pedir pós ou bastante prática, então um portfólio com projetos reais faz diferença logo no início.",
    areaSlugs: ["ia", "dados", "machine-learning"],
  },
  [slugifyCourse("Computação em Nuvem (Cloud Computing)")]: {
    summary:
      "O curso de Computação em Nuvem prepara para projetar, automatizar e operar infraestrutura na nuvem. A pessoa aprende virtualização, contêineres, redes, automação e fundamentos de DevOps em provedores como AWS, Azure e Google Cloud.",
    careerOptions: [
      "Analista de Cloud",
      "Engenheiro(a) DevOps Júnior",
      "Administrador(a) de Sistemas",
      "Analista de Infraestrutura",
      "Engenheiro(a) de Cloud Júnior",
    ],
    salaryAreas: ["Cloud", "DevOps"],
    coreContents: [
      "Fundamentos de cloud (AWS, Azure, GCP)",
      "Virtualização e contêineres",
      "Redes e segurança em nuvem",
      "Automação e infraestrutura como código",
      "Fundamentos de DevOps",
      "Monitoramento e custos",
    ],
    practicalProjects: [
      "Subir uma aplicação em uma cloud pública",
      "Containerizar um app com Docker",
      "Pipeline simples de CI/CD",
      "Infraestrutura como código com Terraform",
    ],
    technologies: [
      "Docker",
      "Kubernetes",
      "Terraform",
      "AWS",
      "Azure",
      "Linux",
      "Git",
    ],
    firstJobs: [
      "Estágio em Infraestrutura ou Cloud",
      "Trainee em DevOps",
      "Analista de Cloud Júnior",
      "Analista de Infraestrutura Júnior",
      "Suporte de Infraestrutura",
    ],
    roadmap: [
      "Aprender Linux e linha de comando",
      "Estudar redes e fundamentos de cloud",
      "Praticar contêineres com Docker",
      "Tirar uma certificação de cloud (AWS, Azure ou GCP)",
      "Montar projetos de infraestrutura no GitHub",
    ],
    marketContext:
      "É uma área muito aquecida e bem paga, mas o mercado costuma valorizar certificações (AWS, Azure, GCP) além do diploma. Tem pouco foco em desenvolvimento de software, então combina com quem gosta de infraestrutura e automação.",
    areaSlugs: ["cloud", "devops", "infraestrutura"],
  },
  [slugifyCourse("Internet das Coisas (IoT)")]: {
    summary:
      "O curso de Internet das Coisas une hardware e software: sensores, sistemas embarcados, redes e programação para dispositivos conectados que enviam dados para a nuvem. Forma profissionais para automação, indústria e produtos conectados.",
    careerOptions: [
      "Desenvolvedor(a) de Sistemas Embarcados",
      "Analista de IoT",
      "Desenvolvedor(a) de Firmware",
      "Analista de Automação",
      "Engenheiro(a) de IoT Júnior",
    ],
    salaryAreas: ["Back-end", "DevOps"],
    coreContents: [
      "Eletrônica básica e sensores",
      "Sistemas embarcados e microcontroladores",
      "Programação para dispositivos",
      "Redes e protocolos de IoT",
      "Integração com a nuvem",
      "Segurança em dispositivos conectados",
    ],
    practicalProjects: [
      "Protótipo com sensor enviando dados",
      "Dashboard que lê dados de um dispositivo",
      "Automação simples com microcontrolador",
      "Integração de um dispositivo com a nuvem",
    ],
    technologies: ["C++", "Python", "Arduino", "Linux", "Git"],
    firstJobs: [
      "Estágio em Sistemas Embarcados",
      "Trainee em Tecnologia",
      "Desenvolvedor(a) de Firmware Júnior",
      "Analista de IoT Júnior",
      "Analista de Automação Júnior",
    ],
    roadmap: [
      "Aprender lógica e uma linguagem (Python ou C)",
      "Estudar eletrônica básica e microcontroladores",
      "Montar projetos com Arduino ou similar",
      "Aprender redes e integração com a nuvem",
      "Publicar projetos com sensores no GitHub",
    ],
    marketContext:
      "Une eletrônica, redes e programação, então combina com quem gosta de hardware e software. O mercado júnior é menor que o de TI tradicional, mas cresce na indústria e em produtos conectados.",
    areaSlugs: ["iot", "backend"],
  },
  [slugifyCourse("Jogos Digitais")]: {
    summary:
      "Jogos Digitais é um tecnólogo prático focado em produção de games. Une programação (geralmente C# com Unity), design, narrativa e arte 2D/3D, com projetos desde os primeiros semestres. É mais direto que um bacharelado e mira entrada rápida em estúdios ou produção indie.",
    careerOptions: [
      "Programador(a) de Jogos",
      "Game Designer Júnior",
      "Desenvolvedor(a) Indie",
      "Level Designer",
      "Desenvolvedor(a) de Gameplay",
    ],
    salaryAreas: ["Front-end", "Mobile"],
    coreContents: [
      "Lógica e programação (C#)",
      "Game engines (Unity)",
      "Design de jogos e narrativa",
      "Arte e modelagem 2D/3D",
      "Física e matemática para games",
      "Produção e publicação de jogos",
    ],
    practicalProjects: [
      "Jogo 2D completo em Unity",
      "Protótipo de mecânica de gameplay",
      "Game jam com entrega em 48 horas",
      "Jogo mobile simples publicado",
    ],
    technologies: ["C#", "Unity", "C++", "Unreal Engine", "Godot", "Git"],
    firstJobs: [
      "Estágio em Desenvolvimento de Jogos",
      "Programador(a) de Jogos Júnior",
      "Game Designer Júnior",
      "QA de Jogos",
      "Desenvolvedor(a) Indie",
    ],
    roadmap: [
      "Aprender lógica e C#",
      "Fazer um jogo simples na Unity",
      "Estudar game design e level design",
      "Participar de game jams",
      "Publicar um jogo e montar portfólio (itch.io, GitHub)",
    ],
    marketContext:
      "Tem foco prático e duração curta, com portfólio desde cedo. O mercado de games no Brasil é menor que o de TI tradicional e o salário inicial costuma ficar abaixo da média de dev, então portfólio e participação em game jams contam muito.",
    areaSlugs: ["gamedev", "frontend", "mobile"],
  },
  [slugifyCourse("Design de Games")]: {
    summary:
      "Design de Games é um bacharelado mais amplo e teórico que o tecnólogo. Aborda programação, design, arte digital, narrativa, UX e produção, formando um profissional completo para equipes de desenvolvimento de jogos.",
    careerOptions: [
      "Game Designer",
      "Programador(a) de Jogos",
      "Artista Técnico",
      "Produtor(a) de Jogos",
      "Level Designer",
    ],
    salaryAreas: ["UX/UI", "Front-end"],
    coreContents: [
      "Game design e narrativa",
      "Programação para jogos",
      "Arte digital e modelagem",
      "UX aplicado a games",
      "Produção e pipeline",
      "Teoria e história dos jogos",
    ],
    practicalProjects: [
      "Documento de design de um jogo (GDD)",
      "Protótipo jogável",
      "Jogo em equipe multidisciplinar",
      "Estudo de narrativa interativa",
    ],
    technologies: ["C#", "Unity", "Unreal Engine", "Godot", "Figma", "Git"],
    firstJobs: [
      "Estágio em Game Design",
      "Game Designer Júnior",
      "Assistente de Produção",
      "QA de Jogos",
      "Level Designer Júnior",
    ],
    roadmap: [
      "Estudar fundamentos de game design",
      "Aprender uma engine (Unity ou Unreal)",
      "Criar protótipos jogáveis",
      "Trabalhar em projetos de equipe",
      "Montar portfólio com GDDs e jogos publicados",
    ],
    marketContext:
      "É mais longo e abrangente que o tecnólogo, com boa base teórica e multidisciplinar. Combina com quem ainda não decidiu o papel específico (design, arte ou produção), mas pode ser generalista demais sem uma especialização paralela.",
    areaSlugs: ["gamedev", "ux-design", "produto"],
  },
  [slugifyCourse("Engenharia da Computação")]: {
    summary:
      "Engenharia da Computação fica na fronteira entre hardware e software. Além de programação e estruturas de dados, estuda eletrônica, circuitos, sistemas embarcados e redes. É uma formação forte de engenharia, com matemática e física pesadas.",
    careerOptions: [
      "Engenheiro(a) de Software",
      "Engenheiro(a) de Sistemas Embarcados",
      "Engenheiro(a) de Hardware",
      "Desenvolvedor(a) Back-end",
      "Engenheiro(a) de Firmware",
    ],
    salaryAreas: ["Back-end", "DevOps"],
    coreContents: [
      "Algoritmos e estruturas de dados",
      "Eletrônica e circuitos",
      "Sistemas embarcados",
      "Arquitetura de computadores",
      "Redes de computadores",
      "Cálculo e física",
    ],
    practicalProjects: [
      "Sistema embarcado com microcontrolador",
      "Projeto de circuito com sensores",
      "Aplicação com comunicação hardware e software",
      "Algoritmo otimizado para recurso limitado",
    ],
    technologies: ["C", "C++", "Python", "Arduino", "Linux", "Git"],
    firstJobs: [
      "Estágio em Engenharia",
      "Trainee em Tecnologia",
      "Desenvolvedor(a) Júnior",
      "Engenheiro(a) de Sistemas Embarcados Júnior",
      "Analista de Hardware Júnior",
    ],
    roadmap: [
      "Reforçar matemática, física e lógica",
      "Aprender C e C++",
      "Estudar eletrônica e microcontroladores",
      "Construir projetos que unam hardware e software",
      "Escolher entre trilha de software, embarcados ou hardware",
    ],
    marketContext:
      "São 5 anos com matemática e física pesadas e uma carga de eletrônica que nem todo mundo curte. Em troca, abre portas tanto em software quanto em indústrias que precisam de hardware e sistemas embarcados.",
    areaSlugs: ["backend", "iot", "infraestrutura"],
  },
  [slugifyCourse("Redes de Computadores")]: {
    summary:
      "Redes de Computadores é um tecnólogo focado em infraestrutura: protocolos, servidores, administração de sistemas e fundamentos de segurança. Prepara para operar e manter a conectividade que sustenta cloud e DevOps, com pouco foco em desenvolvimento de software.",
    careerOptions: [
      "Analista de Redes",
      "Administrador(a) de Sistemas",
      "Suporte de Infraestrutura",
      "Analista de Cloud",
      "Analista de Segurança Júnior",
    ],
    salaryAreas: ["DevOps", "Cloud"],
    coreContents: [
      "Protocolos e modelo TCP/IP",
      "Administração de servidores",
      "Sistemas operacionais (Linux)",
      "Segurança de redes",
      "Cloud e virtualização",
      "Monitoramento e suporte",
    ],
    practicalProjects: [
      "Configurar uma rede local com sub-redes",
      "Montar um servidor Linux com serviços",
      "Laboratório de roteamento e firewall",
      "Migrar um serviço para a nuvem",
    ],
    technologies: ["Linux", "Docker", "AWS", "Ansible", "Prometheus", "Git"],
    firstJobs: [
      "Estágio em Infraestrutura",
      "Analista de Redes Júnior",
      "Administrador(a) de Sistemas Júnior",
      "Suporte Técnico",
      "Analista de Cloud Júnior",
    ],
    roadmap: [
      "Aprender fundamentos de redes (TCP/IP)",
      "Dominar Linux e linha de comando",
      "Praticar configuração de servidores",
      "Tirar certificações (Cisco, AWS)",
      "Evoluir para cloud ou DevOps",
    ],
    marketContext:
      "É curto e prático e funciona como porta de entrada para cloud e DevOps. O mercado costuma pedir certificações (Cisco, AWS) além do diploma, e há pouco foco em programação.",
    areaSlugs: ["infraestrutura", "devops", "cloud"],
  },
  [slugifyCourse("Segurança da Informação")]: {
    summary:
      "Segurança da Informação é um tecnólogo direcionado à cibersegurança desde o início: redes, criptografia, análise de vulnerabilidades e resposta a incidentes. Prepara para uma área aquecida e bem paga, que no nível júnior exige bastante prática e laboratórios próprios.",
    careerOptions: [
      "Analista de Segurança",
      "Analista SOC",
      "Pentester Júnior",
      "Analista de Conformidade",
      "Analista de Resposta a Incidentes",
    ],
    salaryAreas: ["DevOps", "Back-end"],
    coreContents: [
      "Fundamentos de redes",
      "Criptografia",
      "Análise de vulnerabilidades",
      "Resposta a incidentes",
      "Segurança de aplicações",
      "Conformidade e boas práticas",
    ],
    practicalProjects: [
      "Laboratório de pentest em ambiente controlado",
      "Análise de vulnerabilidades de uma aplicação",
      "Hardening de um servidor Linux",
      "Writeup de máquinas (TryHackMe, Hack The Box)",
    ],
    technologies: ["Linux", "Python", "Docker", "Git"],
    firstJobs: [
      "Estágio em Segurança",
      "Analista SOC Júnior",
      "Analista de Segurança Júnior",
      "Pentester Júnior",
      "Analista de Conformidade Júnior",
    ],
    roadmap: [
      "Aprender redes e Linux",
      "Estudar fundamentos de segurança e criptografia",
      "Praticar em laboratórios (TryHackMe, Hack The Box)",
      "Documentar writeups e estudos",
      "Mirar certificações de segurança",
    ],
    marketContext:
      "É uma área aquecida e bem paga e o curso é curto. O mercado júnior, porém, exige prática e laboratórios próprios, e a formação tem menos profundidade teórica que um bacharelado em Ciência da Computação.",
    areaSlugs: ["ciberseguranca", "blue-team", "appsec"],
  },
  [slugifyCourse("Ciência de Dados")]: {
    summary:
      "Ciência de Dados é um tecnólogo prático e direcionado: estatística aplicada, programação (Python e R), SQL, visualização e introdução a machine learning. É uma entrada rápida e aplicada em uma área aquecida, mais focada que um bacharelado generalista.",
    careerOptions: [
      "Analista de Dados",
      "Cientista de Dados Júnior",
      "Analista de BI",
      "Engenheiro(a) de Dados Júnior",
      "Analista de Analytics",
    ],
    salaryAreas: ["Dados", "Back-end"],
    coreContents: [
      "Estatística aplicada",
      "Python e R para dados",
      "SQL e banco de dados",
      "Visualização de dados",
      "Introdução a machine learning",
      "Storytelling com dados",
    ],
    practicalProjects: [
      "Análise exploratória de um dataset real",
      "Dashboard de indicadores",
      "Modelo de previsão simples",
      "Relatório com storytelling de dados",
    ],
    technologies: ["Python", "R", "SQL", "Pandas", "NumPy", "Power BI", "Git"],
    firstJobs: [
      "Estágio em Dados",
      "Analista de Dados Júnior",
      "Analista de BI Júnior",
      "Cientista de Dados Júnior",
      "Engenheiro(a) de Dados Júnior",
    ],
    roadmap: [
      "Aprender Python e SQL",
      "Estudar estatística aplicada",
      "Criar análises e dashboards",
      "Praticar no Kaggle",
      "Publicar projetos de dados no GitHub",
    ],
    marketContext:
      "É direcionado a uma área aquecida e bastante prático. A estatística pode ser desafiadora, e cargos sênior costumam pedir mais matemática ou pós, então vale reforçar fundamentos e montar portfólio.",
    areaSlugs: ["dados", "analise-dados", "cientista-dados"],
  },
  [slugifyCourse("Gestão da Tecnologia da Informação")]: {
    summary:
      "Gestão da Tecnologia da Informação foca em governança, gestão de projetos, processos e infraestrutura, com fundamentos de desenvolvimento e negócios. Prepara mais para coordenar e gerir TI do que para codificar.",
    careerOptions: [
      "Gestor(a) de TI",
      "Analista de Projetos",
      "Product Owner",
      "Consultor(a) de TI",
      "Analista de Processos",
    ],
    salaryAreas: ["Produto", "Dados"],
    coreContents: [
      "Governança de TI",
      "Gestão de projetos",
      "Processos e ITIL",
      "Infraestrutura e sistemas",
      "Fundamentos de desenvolvimento",
      "Gestão e negócios",
    ],
    practicalProjects: [
      "Plano de projeto de TI",
      "Mapeamento de processos",
      "Análise de viabilidade de um sistema",
      "Painel de indicadores de TI",
    ],
    technologies: ["SQL", "Power BI", "Jira", "Trello", "Notion", "Git"],
    firstJobs: [
      "Estágio em TI",
      "Analista de Projetos Júnior",
      "Assistente de PMO",
      "Product Owner Júnior",
      "Consultor(a) de TI Júnior",
    ],
    roadmap: [
      "Entender fundamentos de TI e desenvolvimento",
      "Aprender gestão de projetos e processos",
      "Estudar metodologias ágeis",
      "Praticar com ferramentas de gestão (Jira, Trello)",
      "Montar cases de projetos e processos",
    ],
    marketContext:
      "Dá visão de gestão e negócio e é uma boa ponte para liderança. Por outro lado, tem pouca profundidade técnica em código, e o mercado júnior técnico costuma preferir cursos de desenvolvimento.",
    areaSlugs: ["gestao", "produto", "product-owner"],
  },
  [slugifyCourse("Sistemas para Internet")]: {
    summary:
      "Sistemas para Internet é um tecnólogo focado em desenvolvimento web: front-end, back-end, banco de dados, design de interfaces e deploy. É direcionado a quem quer entrar rápido no mercado web, mais específico que o ADS.",
    careerOptions: [
      "Desenvolvedor(a) Web",
      "Desenvolvedor(a) Front-end",
      "Desenvolvedor(a) Back-end",
      "Desenvolvedor(a) Full Stack",
      "Analista de Sistemas",
    ],
    salaryAreas: ["Front-end", "Back-end"],
    coreContents: [
      "HTML, CSS e JavaScript",
      "Desenvolvimento back-end",
      "Banco de dados",
      "Design de interfaces",
      "APIs e integração",
      "Hospedagem e deploy",
    ],
    practicalProjects: [
      "Site responsivo completo",
      "API REST com banco de dados",
      "Aplicação full stack simples",
      "Loja ou blog publicado online",
    ],
    technologies: [
      "HTML",
      "CSS",
      "JavaScript",
      "TypeScript",
      "React",
      "Node.js",
      "PostgreSQL",
      "Git",
    ],
    firstJobs: [
      "Estágio em Desenvolvimento Web",
      "Desenvolvedor(a) Front-end Júnior",
      "Desenvolvedor(a) Back-end Júnior",
      "Desenvolvedor(a) Full Stack Júnior",
      "Analista de Sistemas Júnior",
    ],
    roadmap: [
      "Aprender HTML, CSS e JavaScript",
      "Praticar Git e versionamento",
      "Construir um back-end com banco de dados",
      "Criar uma aplicação full stack",
      "Publicar 2 projetos e aplicar para vagas júnior",
    ],
    marketContext:
      "Tem foco prático em web e é curto, atendendo à alta demanda por desenvolvedores. É menos abrangente que o ADS e com pouco aprofundamento teórico, então o portfólio pesa bastante nas primeiras vagas.",
    areaSlugs: ["frontend", "backend", "fullstack"],
  },
  [slugifyCourse("Técnico em Desenvolvimento de Sistemas")]: {
    summary:
      "É um curso técnico curto e prático pra quem quer começar a programar cedo. Você aprende lógica, desenvolvimento web, banco de dados e versionamento de código, já saindo capaz de montar sistemas simples e ajudar um time de desenvolvimento nas primeiras tarefas.",
    careerOptions: [
      "Desenvolvedor(a) Júnior",
      "Programador(a) Web",
      "Analista de Suporte a Sistemas",
      "Assistente de QA",
      "Auxiliar de TI",
    ],
    salaryAreas: ["Back-end", "Front-end", "QA / Testes"],
    coreContents: [
      "Lógica de programação",
      "Banco de dados",
      "Desenvolvimento web",
      "Versionamento com Git",
      "Programação orientada a objetos",
      "Análise de requisitos",
    ],
    practicalProjects: [
      "Site com formulário salvando em banco",
      "Sistema de cadastro com login",
      "API simples de CRUD",
      "Página web responsiva",
    ],
    technologies: ["HTML", "CSS", "JavaScript", "SQL", "Git", "Python"],
    firstJobs: [
      "Jovem Aprendiz em TI",
      "Estágio em Programação",
      "Desenvolvedor(a) Júnior",
      "Assistente de Desenvolvimento",
      "Suporte a Sistemas Júnior",
    ],
    roadmap: [
      "Reforçar lógica e Git",
      "Montar páginas com HTML, CSS e JavaScript",
      "Aprender banco de dados e uma linguagem de back-end",
      "Publicar 2 projetos no GitHub",
      "Aplicar pra aprendiz, estágio e vagas júnior",
    ],
    marketContext:
      "É uma porta de entrada rápida e barata pra área. Como é nível médio, sozinho ele não substitui uma graduação nas vagas mais concorridas, mas com portfólio e prática dá pra conseguir as primeiras oportunidades e ir crescendo com o tempo.",
    areaSlugs: ["backend", "frontend", "qa"],
  },
  [slugifyCourse("Técnico em Informática para Internet")]: {
    summary:
      "É um técnico focado em web: você aprende a construir sites e aplicações online do zero, mexendo com HTML, CSS, JavaScript, design de interface e banco de dados. Bem prático, dá pra começar a criar coisas de verdade logo nos primeiros meses.",
    careerOptions: [
      "Desenvolvedor(a) Web Júnior",
      "Front-end Júnior",
      "Maquetador(a) de Sites",
      "Analista de Suporte a Sites",
      "Auxiliar de TI",
    ],
    salaryAreas: ["Front-end", "Back-end"],
    coreContents: [
      "HTML e CSS",
      "JavaScript",
      "Design de interface",
      "Banco de dados",
      "Lógica de programação",
      "Publicação de sites",
    ],
    practicalProjects: [
      "Site institucional responsivo",
      "Landing page com formulário",
      "Blog com painel de posts",
      "Loja virtual simples",
    ],
    technologies: ["HTML", "CSS", "JavaScript", "PHP", "SQL", "Git"],
    firstJobs: [
      "Jovem Aprendiz em TI",
      "Estágio em Desenvolvimento Web",
      "Desenvolvedor(a) Web Júnior",
      "Assistente de Front-end",
      "Suporte a Sites",
    ],
    roadmap: [
      "Dominar HTML, CSS e JavaScript",
      "Aprender Git e publicar no GitHub",
      "Montar um back-end simples com banco de dados",
      "Fazer 2 ou 3 sites completos de portfólio",
      "Aplicar pra aprendiz, estágio e vagas júnior de web",
    ],
    marketContext:
      "A demanda por quem sabe fazer site é grande e constante. É um caminho curto e direto pra web, mas com pouco aprofundamento teórico, então vale continuar estudando e deixar o portfólio bem montado pra se destacar.",
    areaSlugs: ["frontend", "backend", "fullstack"],
  },
  [slugifyCourse("Técnico em Redes de Computadores")]: {
    summary:
      "É um técnico pra quem curte infraestrutura e quer fazer a rede funcionar. Você aprende a instalar e manter redes, mexer com cabeamento, configurar equipamentos e servidores e cuidar da segurança básica. Bem mão na massa, com bastante prática de laboratório.",
    careerOptions: [
      "Técnico(a) de Redes",
      "Analista de Suporte de Infra Júnior",
      "Administrador(a) de Redes Júnior",
      "Técnico(a) de Infraestrutura",
      "Operador(a) de NOC",
    ],
    salaryAreas: ["Redes / Infraestrutura", "Suporte / Help Desk"],
    coreContents: [
      "Cabeamento e topologias de rede",
      "Protocolos TCP/IP",
      "Configuração de switches e roteadores",
      "Administração de servidores",
      "Segurança de redes",
      "Sistemas operacionais Linux e Windows",
    ],
    practicalProjects: [
      "Montar uma rede local do zero",
      "Configurar um servidor de arquivos",
      "Simular uma rede com switches e roteadores",
      "Analisar tráfego com Wireshark",
    ],
    technologies: ["Linux", "Windows Server", "Wireshark", "Bash", "Docker"],
    firstJobs: [
      "Jovem Aprendiz em TI",
      "Estágio em Redes",
      "Técnico(a) de Suporte de Infra",
      "Auxiliar de Redes",
      "Operador(a) de NOC Júnior",
    ],
    roadmap: [
      "Entender bem TCP/IP e cabeamento",
      "Praticar Linux e linha de comando",
      "Configurar redes e servidores em laboratório",
      "Tirar uma certificação de entrada de redes",
      "Aplicar pra aprendiz, estágio e vagas de suporte de infra",
    ],
    marketContext:
      "Toda empresa depende de rede funcionando, então é uma área com demanda estável e boa porta de entrada em infra. As certificações contam bastante aqui e ajudam a crescer mais rápido pra funções sêniores.",
    areaSlugs: ["infraestrutura", "sre", "devops"],
  },
  [slugifyCourse("Técnico em Manutenção e Suporte em Informática")]: {
    summary:
      "É um técnico pé no chão pra quem gosta de mexer em hardware e resolver problema de TI no dia a dia. Você aprende a montar e consertar computadores, instalar e configurar sistemas, atender usuários e cuidar de redes básicas. Muita prática e resultado rápido.",
    careerOptions: [
      "Técnico(a) de Suporte",
      "Analista de Help Desk",
      "Técnico(a) de Manutenção",
      "Técnico(a) de Campo",
      "Auxiliar de TI",
    ],
    salaryAreas: ["Suporte / Help Desk", "Redes / Infraestrutura"],
    coreContents: [
      "Montagem e manutenção de computadores",
      "Sistemas operacionais Windows e Linux",
      "Suporte e atendimento ao usuário",
      "Redes básicas",
      "Instalação e configuração de softwares",
      "Diagnóstico de hardware",
    ],
    practicalProjects: [
      "Montar e configurar um computador do zero",
      "Instalar e configurar Windows e Linux",
      "Criar um roteiro de atendimento de help desk",
      "Diagnosticar e corrigir defeitos comuns",
    ],
    technologies: ["Windows Server", "Linux", "Bash", "PowerShell"],
    firstJobs: [
      "Jovem Aprendiz em TI",
      "Estágio em Suporte",
      "Técnico(a) de Suporte Júnior",
      "Atendente de Help Desk",
      "Técnico(a) de Manutenção",
    ],
    roadmap: [
      "Aprender bem hardware e montagem",
      "Dominar instalação de Windows e Linux",
      "Praticar atendimento e resolução de chamados",
      "Aprender o básico de redes",
      "Aplicar pra aprendiz, estágio e vagas de suporte",
    ],
    marketContext:
      "Suporte e manutenção é uma das portas de entrada mais acessíveis da TI, com muita vaga de nível júnior. É um ótimo primeiro passo: dá pra entrar cedo e depois migrar pra redes, infra ou outras áreas conforme for estudando.",
    areaSlugs: ["infraestrutura", "sre"],
  },
  [slugifyCourse("Engenharia de Controle e Automação")]: {
    summary:
      "A Engenharia de Controle e Automação junta elétrica, mecânica e computação pra projetar e comandar máquinas e processos industriais. É um curso longo e puxado em matemática e física, mas forma alguém que entende desde o sensor no chão de fábrica até a lógica que controla a linha de produção inteira.",
    careerOptions: [
      "Engenheiro(a) de Automação",
      "Engenheiro(a) de Controle",
      "Projetista de Sistemas Industriais",
      "Integrador(a) de Robótica",
      "Engenheiro(a) de Processos",
    ],
    salaryAreas: [],
    coreContents: [
      "Sistemas de controle",
      "Instrumentação industrial",
      "Eletrônica analógica e digital",
      "Programação de CLP",
      "Robótica e cinemática",
      "Cálculo, física e álgebra linear",
    ],
    practicalProjects: [
      "Automação de uma bancada com CLP",
      "Malha de controle de temperatura ou nível",
      "Supervisório SCADA de um processo simulado",
      "Braço robótico com sensores e atuadores",
    ],
    technologies: ["CLP", "SCADA", "Modbus", "MATLAB", "Python", "C"],
    firstJobs: [
      "Estágio em Automação Industrial",
      "Trainee em Engenharia",
      "Engenheiro(a) de Automação Júnior",
      "Programador(a) de CLP",
      "Analista de Manutenção Industrial",
    ],
    roadmap: [
      "Firmar a base de matemática, física e eletricidade",
      "Aprender lógica de CLP e leitura de diagramas elétricos",
      "Praticar instrumentação e malhas de controle",
      "Montar projetos de automação em laboratório ou bancada",
      "Buscar estágio na indústria a partir do meio do curso",
    ],
    marketContext:
      "É uma engenharia com boa procura na indústria, principalmente em polos industriais e empresas de manufatura. Como são 5 anos, dá pra ir se aproximando do mercado por estágios ao longo da graduação, o que ajuda bastante na hora de conseguir a primeira vaga de engenheiro.",
    areaSlugs: ["automacao-industrial", "iot"],
  },
  [slugifyCourse("Engenharia Mecatrônica")]: {
    summary:
      "A Engenharia Mecatrônica mistura mecânica, eletrônica e computação pra criar sistemas automatizados e robôs. Puxa mais pro lado de robótica e projeto de máquinas que a Engenharia de Controle e Automação, e forma alguém que transita entre a parte física e a programação que dá vida a ela.",
    careerOptions: [
      "Engenheiro(a) de Mecatrônica",
      "Projetista de Robótica",
      "Engenheiro(a) de Automação",
      "Desenvolvedor(a) de Sistemas Embarcados",
      "Engenheiro(a) de Manutenção",
    ],
    salaryAreas: [],
    coreContents: [
      "Mecânica e resistência dos materiais",
      "Eletrônica e microcontroladores",
      "Robótica e atuadores",
      "Programação de CLP e sistemas embarcados",
      "Sensores e sistemas de medição",
      "Cálculo, física e mecânica aplicada",
    ],
    practicalProjects: [
      "Robô móvel com sensores e microcontrolador",
      "Esteira automatizada com CLP",
      "Sistema embarcado de controle com Arduino",
      "Protótipo de máquina com acionamento eletrônico",
    ],
    technologies: ["CLP", "Modbus", "C", "C++", "Python", "Arduino", "MATLAB"],
    firstJobs: [
      "Estágio em Mecatrônica",
      "Trainee em Engenharia",
      "Engenheiro(a) de Automação Júnior",
      "Projetista de Robótica Júnior",
      "Desenvolvedor(a) de Sistemas Embarcados Júnior",
    ],
    roadmap: [
      "Firmar matemática, física e mecânica",
      "Aprender eletrônica e microcontroladores",
      "Praticar programação em C e sistemas embarcados",
      "Construir protótipos de robótica e automação",
      "Buscar estágio na indústria ao longo do curso",
    ],
    marketContext:
      "A mecatrônica tem um perfil versátil, o que abre portas em indústria, robótica e desenvolvimento de máquinas. O currículo é denso por cobrir três áreas, mas essa amplitude costuma ser valorizada em empresas que precisam de alguém que entenda tanto o hardware quanto o software.",
    areaSlugs: ["automacao-industrial", "iot"],
  },
  [slugifyCourse("Tecnologia em Automação Industrial")]: {
    summary:
      "O tecnólogo em Automação Industrial é o caminho curto e prático pra trabalhar com automação de chão de fábrica. Em 2 a 3 anos você foca em programar CLP, configurar sistemas de supervisão, mexer com redes industriais e manter os equipamentos rodando, sem a carga teórica pesada de uma engenharia.",
    careerOptions: [
      "Tecnólogo(a) em Automação",
      "Programador(a) de CLP",
      "Analista de Manutenção Industrial",
      "Integrador(a) de SCADA",
      "Técnico(a) de Automação",
    ],
    salaryAreas: [],
    coreContents: [
      "Programação de CLP",
      "Sistemas de supervisão (SCADA e IHM)",
      "Redes industriais",
      "Instrumentação e sensores",
      "Eletricidade e comandos elétricos",
      "Manutenção de sistemas automatizados",
    ],
    practicalProjects: [
      "Programação de um CLP pra uma linha simulada",
      "Tela de supervisório SCADA",
      "Integração de sensores por rede industrial",
      "Painel de comando elétrico com automação",
    ],
    technologies: ["CLP", "SCADA", "Modbus", "Python", "Linux"],
    firstJobs: [
      "Estágio em Automação Industrial",
      "Programador(a) de CLP Júnior",
      "Técnico(a) de Manutenção Industrial",
      "Analista de Automação Júnior",
      "Integrador(a) de Sistemas Industriais",
    ],
    roadmap: [
      "Aprender comandos elétricos e leitura de diagramas",
      "Praticar programação de CLP",
      "Montar telas de supervisório SCADA",
      "Entender redes e protocolos industriais",
      "Buscar estágio ou vaga técnica na indústria",
    ],
    marketContext:
      "Por ser curto e bem prático, é uma boa porta de entrada rápida pra indústria, especialmente em regiões com muitas fábricas. O tecnólogo às vezes tem menos prestígio que a engenharia em alguns contextos, mas na automação de chão de fábrica ele entra no mercado mais cedo.",
    areaSlugs: ["automacao-industrial", "iot"],
  },
  [slugifyCourse("Engenharia Elétrica")]: {
    summary:
      "A Engenharia Elétrica é uma engenharia ampla e tradicional, focada em energia, circuitos, sistemas de potência e eletrônica, com automação e controle aparecendo como uma das várias áreas que ela cobre. É uma boa base pra quem gosta de eletricidade e quer um leque grande de mercado, de projetos elétricos à indústria.",
    careerOptions: [
      "Engenheiro(a) Eletricista",
      "Engenheiro(a) de Energia",
      "Engenheiro(a) de Automação",
      "Projetista Elétrico",
      "Engenheiro(a) de Manutenção",
    ],
    salaryAreas: [],
    coreContents: [
      "Circuitos elétricos",
      "Sistemas de potência",
      "Eletrônica analógica e digital",
      "Máquinas elétricas",
      "Controle e automação",
      "Cálculo, física e eletromagnetismo",
    ],
    practicalProjects: [
      "Projeto elétrico de uma instalação",
      "Malha de controle com CLP",
      "Dimensionamento de um sistema de potência",
      "Bancada de acionamento de motores",
    ],
    technologies: ["MATLAB", "CLP", "C", "Python", "SCADA"],
    firstJobs: [
      "Estágio em Engenharia Elétrica",
      "Trainee em Engenharia",
      "Engenheiro(a) Eletricista Júnior",
      "Projetista Elétrico Júnior",
      "Engenheiro(a) de Automação Júnior",
    ],
    roadmap: [
      "Firmar matemática, física e eletromagnetismo",
      "Aprender circuitos e sistemas de potência",
      "Praticar com máquinas elétricas e eletrônica",
      "Encarar as disciplinas de controle e automação",
      "Buscar estágio em energia, projetos ou indústria",
    ],
    marketContext:
      "O mercado de elétrica é grande e não fica preso à indústria: passa por energia, projetos, construção e automação. A programação é menos central que num curso de TI, mas a formação ampla dá flexibilidade pra migrar entre setores ao longo da carreira.",
    areaSlugs: ["automacao-industrial"],
  },
};
