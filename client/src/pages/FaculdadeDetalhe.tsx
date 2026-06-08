import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle,
  ExternalLink,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import Layout from "@/components/Layout";
import FavoriteButton from "@/components/FavoriteButton";
import { faculdades } from "@/lib/data";
import { companies } from "@/lib/companyData";
import { salaryRows } from "@/lib/marketData";
import { technologies } from "@/lib/technologyData";
import PageHero from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

const accent = "violet" as const;
const ac = getPageAccentUi(accent);

function slugifyCourse(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type CourseDetail = {
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

const courseDetails: Record<string, CourseDetail> = {
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
};

export default function FaculdadeDetalhe() {
  const params = useParams<{ slug: string }>();
  const course = faculdades.cursos.find(
    (item) => slugifyCourse(item.nome) === params.slug,
  );
  const detail = params.slug ? courseDetails[params.slug] : undefined;

  if (!course || !detail) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="mb-4 text-5xl">🎓</p>
          <h1 className="font-display mb-2 text-2xl font-black text-slate-950">
            Curso não encontrado
          </h1>
          <p className="mb-6 text-slate-950">
            Esse curso não existe ou ainda não tem uma página detalhada.
          </p>
          <Link
            href="/faculdades"
            className={cn(
              "inline-flex items-center gap-2 font-bold",
              ac.link,
              ac.linkHover,
            )}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar para faculdades
          </Link>
        </div>
      </Layout>
    );
  }

  const relatedTechnologies = technologies.filter((technology) =>
    detail.technologies.includes(technology.name),
  );
  const relatedCompanies = companies
    .filter((company) =>
      company.areas.some((area) => detail.areaSlugs.includes(area)),
    )
    .slice(0, 4);
  const relatedSalaries = salaryRows
    .filter((row) => detail.salaryAreas.includes(String(row.area)))
    .slice(0, 5);

  return (
    <Layout>
      <PageHero
        accent={accent}
        eyebrow={`${course.tipo} · ${course.duracao}`}
        title={course.nome}
        subtitle={course.perfilIndicado}
        topSlot={
          <Link
            href="/faculdades"
            className={cn(
              "inline-flex items-center gap-2 text-sm font-bold",
              ac.link,
              ac.linkHover,
            )}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Todos os cursos superiores
          </Link>
        }
        titlePrefix={
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 bg-white text-slate-900 shadow-[4px_4px_0_#0f172a]">
            <GraduationCap className="h-9 w-9" aria-hidden />
          </span>
        }
        actions={
          <FavoriteButton
            item={{
              id: slugifyCourse(course.nome),
              type: "faculdade",
              title: course.nome,
              subtitle: course.tipo,
            }}
          />
        }
      />

      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-3">
            <main className="space-y-8 lg:col-span-2">
              <section className="card-brutal rounded-xl bg-white p-6">
                <h2 className="font-display mb-3 text-xl font-black text-slate-950">
                  O que é esse curso?
                </h2>
                <p className="leading-relaxed text-slate-700">
                  {detail.summary}
                </p>
              </section>

              <section className="card-brutal rounded-xl bg-white p-6">
                <h2 className="font-display mb-4 text-xl font-black text-slate-950">
                  Conteúdos que você deve estudar
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {detail.coreContents.map((content) => (
                    <div
                      key={content}
                      className="flex items-start gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700"
                    >
                      <CheckCircle
                        className={cn("mt-0.5 h-4 w-4 shrink-0", ac.iconMuted)}
                        aria-hidden
                      />
                      {content}
                    </div>
                  ))}
                </div>
              </section>

              <section
                className={cn(
                  "card-brutal rounded-xl border-2 p-6",
                  ac.panelBorder,
                  ac.panelSoft,
                )}
              >
                <h2 className="font-display mb-3 text-xl font-black text-slate-950">
                  Quem combina com esse curso?
                </h2>
                <p className="text-slate-700">{course.perfilIndicado}</p>
                <p className="mt-3 text-sm font-medium text-slate-600">
                  {detail.marketContext}
                </p>
              </section>

              <section className="card-brutal rounded-xl bg-white p-6">
                <h2 className="font-display mb-4 text-xl font-black text-slate-950">
                  Opções de carreira depois do curso
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {detail.careerOptions.map((career) => (
                    <div
                      key={career}
                      className={cn(
                        "rounded-xl border-2 p-4",
                        ac.panelBorder,
                        ac.panelSoft,
                      )}
                    >
                      <Briefcase
                        className={cn("mb-2 h-5 w-5", ac.iconMuted)}
                        aria-hidden
                      />
                      <p className={cn("font-bold", ac.tbodyAccentBold)}>
                        {career}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card-brutal rounded-xl bg-white p-6">
                <h2 className="font-display mb-4 text-xl font-black text-slate-950">
                  Projetos para provar conhecimento
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {detail.practicalProjects.map((project) => (
                    <div
                      key={project}
                      className={cn(
                        "rounded-xl border-2 p-4 text-sm font-bold text-slate-800",
                        ac.panelBorder,
                        ac.panelSoft,
                      )}
                    >
                      {project}
                    </div>
                  ))}
                </div>
                <Link
                  href="/projetos"
                  className={cn(
                    "mt-4 inline-flex items-center gap-1 text-sm font-bold",
                    ac.link,
                    ac.linkHover,
                  )}
                >
                  Ver ideias de projetos <ExternalLink className="h-3 w-3" />
                </Link>
              </section>

              <section className="card-brutal rounded-xl bg-white p-6">
                <h2 className="font-display mb-4 text-xl font-black text-slate-950">
                  Roadmap inicial
                </h2>
                <div className="space-y-3">
                  {detail.roadmap.map((step, index) => (
                    <div key={step} className="flex gap-3">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 text-xs font-black text-white",
                          ac.tableBanner,
                        )}
                      >
                        {index + 1}
                      </span>
                      <p className="pt-1 text-sm font-medium text-slate-700">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card-brutal rounded-xl bg-white p-6">
                <h2 className="font-display mb-4 text-xl font-black text-slate-950">
                  Empresas relacionadas
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {relatedCompanies.map((company) => (
                    <Link
                      key={company.slug}
                      href={`/empresas/${company.slug}`}
                      className={cn(
                        "rounded-xl border-2 border-slate-200 bg-slate-50 p-4 transition-colors",
                        ac.cardHover,
                      )}
                    >
                      <span className="font-display block font-black text-slate-950">
                        {company.name}
                      </span>
                      <span className="text-sm font-medium text-slate-600">
                        {company.segment} · {company.city}
                      </span>
                      <span
                        className={cn(
                          "mt-2 block text-xs font-bold",
                          ac.tbodyAccentBold,
                        )}
                      >
                        Júnior: {company.juniorSalary}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            </main>

            <aside className="space-y-5">
              <div
                className={cn(
                  "card-brutal rounded-xl border-2 bg-white p-6",
                  ac.panelBorder,
                  ac.panelSoft,
                )}
              >
                <h3
                  className={cn(
                    "font-display mb-4 text-lg font-black",
                    ac.tbodyAccentBold,
                  )}
                >
                  Resumo rápido
                </h3>
                <div className="space-y-3 text-sm text-slate-900">
                  <div>
                    <p
                      className={cn(
                        "text-xs font-black uppercase",
                        ac.iconMuted,
                      )}
                    >
                      Duração
                    </p>
                    <p className="font-bold">{course.duracao}</p>
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-xs font-black uppercase",
                        ac.iconMuted,
                      )}
                    >
                      Tipo
                    </p>
                    <p className="font-bold">{course.tipo}</p>
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-xs font-black uppercase",
                        ac.iconMuted,
                      )}
                    >
                      Programação
                    </p>
                    <p className="font-bold">{course.programacao}</p>
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-xs font-black uppercase",
                        ac.iconMuted,
                      )}
                    >
                      Matemática
                    </p>
                    <p className="font-bold">{course.matematica}</p>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "card-brutal rounded-xl border-2 bg-white p-5",
                  ac.panelBorder,
                )}
              >
                <h3 className="font-display mb-3 font-black text-slate-950">
                  Salários médios relacionados
                </h3>
                <div className="space-y-3">
                  {relatedSalaries.map((row) => (
                    <div
                      key={`${row.area}-${row.level}-${row.city}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p
                        className={cn(
                          "text-xs font-black uppercase",
                          ac.tbodyAccentBold,
                        )}
                      >
                        {String(row.area)} · {String(row.level)}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        CLT: R$ {Number(row.clt).toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs font-medium text-slate-600">
                        PJ: R$ {Number(row.pj).toLocaleString("pt-BR")} ·{" "}
                        {String(row.city)}
                      </p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/salarios"
                  className={cn(
                    "mt-3 inline-flex items-center gap-1 text-xs font-bold",
                    ac.link,
                    ac.linkHover,
                  )}
                >
                  Ver tabela salarial <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              <div
                className={cn(
                  "card-brutal rounded-xl border-2 bg-white p-5",
                  ac.panelBorder,
                )}
              >
                <h3 className="font-display mb-3 font-black text-slate-950">
                  Tecnologias úteis
                </h3>
                <div className="flex flex-wrap gap-2">
                  {relatedTechnologies.map((technology) => (
                    <Link
                      key={technology.slug}
                      href={`/tecnologias/${technology.slug}`}
                      className={cn(
                        "rounded-full border-2 px-3 py-1.5 text-xs font-black",
                        ac.panelBorder,
                        ac.panelSoft,
                        ac.tbodyAccentBold,
                      )}
                    >
                      {technology.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div
                className={cn(
                  "card-brutal rounded-xl border-2 bg-white p-5",
                  ac.panelBorder,
                )}
              >
                <h3 className="font-display mb-3 font-black text-slate-950">
                  Primeiras vagas para mirar
                </h3>
                <ul className="space-y-2">
                  {detail.firstJobs.map((job) => (
                    <li
                      key={job}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <CheckCircle
                        className={cn("mt-0.5 h-4 w-4 shrink-0", ac.iconMuted)}
                        aria-hidden
                      />
                      {job}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card-brutal rounded-xl border-red-200 bg-red-50 p-5">
                <h3 className="font-display mb-3 font-black text-slate-950">
                  Pontos de atenção
                </h3>
                <ul className="space-y-2">
                  {course.pontosAtencao.map((point) => (
                    <li
                      key={point}
                      className="text-sm font-medium text-slate-700"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className={cn(
                  "card-brutal rounded-xl border-2 p-5",
                  ac.panelBorder,
                  ac.panelSoft,
                )}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 text-white shadow-[2px_2px_0_#0f172a]",
                      ac.tableBanner,
                    )}
                  >
                    <Sparkles className="h-5 w-5 text-white" aria-hidden />
                  </span>
                  <p className="font-display text-sm font-bold text-slate-900">
                    Quer comparar com outros caminhos?
                  </p>
                </div>
                <Link
                  href="/comparador"
                  className="btn-brutal-accent block rounded-lg py-2.5 text-center text-sm font-black"
                >
                  Abrir comparador
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
}
