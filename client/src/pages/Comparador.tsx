import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Compass,
  Filter,
  GraduationCap,
  Lightbulb,
  type LucideIcon,
  MonitorPlay,
  RotateCcw,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Layout from "@/components/Layout";
import { BntSelect } from "@/components/shared/BntSelect";
import ProGate from "@/components/pro/ProGate";
import SEO from "@/components/SEO";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/contexts/SubscriptionContext";

type ComparisonCategory = "faculdades" | "cursos" | "areas" | "plataformas";
type ComparisonItem = {
  id: string;
  name: string;
  category: ComparisonCategory;
  type: string;
  avgPrice: string;
  priceLevel: "gratis" | "baixo" | "medio" | "alto";
  duration: string;
  durationLevel: "curto" | "medio" | "longo";
  modality: string;
  bestFor: string;
  notIdealFor: string;
  marketUse: string;
  certificate: string;
  practice: string;
  mathLevel: string;
  beginnerScore: number;
  decisionTip: string;
  pros: string[];
  cautions: string[];
  objectives: string[];
};

/** Grupos isolados: só é possível comparar dois itens do mesmo grupo (ex.: não mistura graduação com curso online). */
const comparisonGroups: Array<{
  id: ComparisonCategory;
  label: string;
  hint: string;
}> = [
  {
    id: "faculdades",
    label: "Graduações e faculdades",
    hint: "Cursos superiores (tecnólogo, bacharelado…)",
  },
  {
    id: "cursos",
    label: "Cursos curtos e treinamentos",
    hint: "Conteúdos online, gratuitos ou intensivos, não são diploma superior",
  },
  {
    id: "areas",
    label: "Áreas de TI",
    hint: "Front-end, dados, UX… perfis de carreira, não instituições",
  },
  {
    id: "plataformas",
    label: "Plataformas de estudo",
    hint: "Assinaturas e ecossistemas (Alura, Coursera…)",
  },
];

// Apresentacao por subarea (icone de linha + cor). So estilo, nao toca no dado.
const SUBAREA_UI: Record<
  ComparisonCategory,
  { Icon: LucideIcon; text: string; bg: string; shadow: string }
> = {
  areas: {
    Icon: Compass,
    text: "text-violet-700",
    bg: "bg-violet-100",
    shadow: "shadow-[5px_5px_0_#7c3aed]",
  },
  faculdades: {
    Icon: GraduationCap,
    text: "text-blue-700",
    bg: "bg-blue-100",
    shadow: "shadow-[5px_5px_0_#1d4ed8]",
  },
  cursos: {
    Icon: BookOpen,
    text: "text-amber-700",
    bg: "bg-amber-100",
    shadow: "shadow-[5px_5px_0_#d97706]",
  },
  plataformas: {
    Icon: MonitorPlay,
    text: "text-emerald-700",
    bg: "bg-emerald-100",
    shadow: "shadow-[5px_5px_0_#059669]",
  },
};

const comparisonItems: ComparisonItem[] = [
  {
    id: "ads",
    name: "ADS",
    category: "faculdades",
    type: "Tecnólogo",
    avgPrice: "R$ 150 a R$ 700/mês",
    priceLevel: "medio",
    duration: "2 a 3 anos",
    durationLevel: "longo",
    modality: "Presencial, EAD ou híbrido",
    bestFor:
      "Quem quer diploma mais rápido e caminho direto para desenvolvimento.",
    notIdealFor: "Quem quer pesquisa, matemática pesada ou carreira acadêmica.",
    marketUse: "Muito reconhecido para estágio, trainee e júnior.",
    certificate: "Diploma superior",
    practice: "Média a alta, depende da instituição.",
    mathLevel: "Média",
    beginnerScore: 5,
    decisionTip:
      "Boa escolha se você quer entrar no mercado com diploma sem fazer um bacharelado longo.",
    pros: [
      "Duração menor",
      "Conteúdo direto",
      "Ajuda em vagas que pedem superior",
    ],
    cautions: ["Qualidade varia muito", "Precisa complementar com portfólio"],
    objectives: ["diploma", "emprego", "rapido"],
  },
  {
    id: "ciencia-computacao",
    name: "Ciência da Computação",
    category: "faculdades",
    type: "Bacharelado",
    avgPrice: "R$ 400 a R$ 1.800/mês",
    priceLevel: "alto",
    duration: "4 anos",
    durationLevel: "longo",
    modality: "Presencial ou híbrido",
    bestFor: "Quem quer base profunda, engenharia, dados, IA ou pesquisa.",
    notIdealFor: "Quem precisa entrar no mercado o mais rápido possível.",
    marketUse: "Forte para empresas maiores e trilhas técnicas profundas.",
    certificate: "Diploma superior",
    practice: "Média, exige projetos por fora.",
    mathLevel: "Alta",
    beginnerScore: 3,
    decisionTip:
      "Escolha se você gosta de fundamentos e aceita um caminho mais longo.",
    pros: [
      "Base técnica forte",
      "Boa reputação",
      "Abre portas para IA e pesquisa",
    ],
    cautions: ["Mais matemática", "Mais longo", "Pode ser teórico demais"],
    objectives: ["diploma", "base", "ia", "dados"],
  },
  {
    id: "sistemas-informacao",
    name: "Sistemas de Informação",
    category: "faculdades",
    type: "Bacharelado",
    avgPrice: "R$ 350 a R$ 1.400/mês",
    priceLevel: "alto",
    duration: "4 anos",
    durationLevel: "longo",
    modality: "Presencial, EAD ou híbrido",
    bestFor: "Quem quer misturar tecnologia, processos e negócio.",
    notIdealFor: "Quem quer só programação pesada desde o início.",
    marketUse:
      "Bom para análise de sistemas, produto, dados e desenvolvimento.",
    certificate: "Diploma superior",
    practice: "Média",
    mathLevel: "Média",
    beginnerScore: 4,
    decisionTip:
      "Boa opção para quem gosta de entender problemas de negócio e tecnologia juntos.",
    pros: ["Versátil", "Boa ponte com negócios", "Serve para várias trilhas"],
    cautions: ["Pode ser amplo demais", "Exige foco por fora"],
    objectives: ["diploma", "negocio", "emprego"],
  },
  {
    id: "engenharia-software",
    name: "Engenharia de Software",
    category: "faculdades",
    type: "Bacharelado",
    avgPrice: "R$ 350 a R$ 1.600/mês",
    priceLevel: "alto",
    duration: "4 anos",
    durationLevel: "longo",
    modality: "Presencial, EAD ou híbrido",
    bestFor:
      "Quem quer construir software com qualidade, testes, arquitetura e processos.",
    notIdealFor: "Quem quer uma formação muito curta.",
    marketUse: "Muito alinhado com vagas de desenvolvimento e qualidade.",
    certificate: "Diploma superior",
    practice: "Alta quando o curso tem bons projetos.",
    mathLevel: "Média-Alta",
    beginnerScore: 4,
    decisionTip:
      "Escolha se você quer programar, mas também entender como software profissional é planejado e mantido.",
    pros: [
      "Foco claro em software",
      "Boa conexão com mercado",
      "Inclui qualidade e processo",
    ],
    cautions: [
      "Pode variar bastante entre instituições",
      "Ainda precisa de portfólio",
    ],
    objectives: ["diploma", "emprego", "base"],
  },
  {
    id: "banco-dados",
    name: "Banco de Dados",
    category: "faculdades",
    type: "Tecnólogo",
    avgPrice: "R$ 180 a R$ 650/mês",
    priceLevel: "medio",
    duration: "2 a 3 anos",
    durationLevel: "longo",
    modality: "Presencial ou EAD",
    bestFor: "Quem gosta de SQL, dados, organização de informação e BI.",
    notIdealFor: "Quem quer criar interfaces visuais ou apps mobile.",
    marketUse: "Bom para dados, BI, suporte a sistemas e back-end.",
    certificate: "Diploma superior",
    practice: "Média",
    mathLevel: "Média",
    beginnerScore: 4,
    decisionTip:
      "Faz sentido se você já sente atração por dados e bancos relacionais.",
    pros: [
      "Foco em SQL",
      "Boa base para dados",
      "Duração menor que bacharelado",
    ],
    cautions: ["Mais específico", "Pode limitar se você ainda não sabe a área"],
    objectives: ["diploma", "dados", "emprego"],
  },
  {
    id: "engenharia-computacao",
    name: "Engenharia da Computação",
    category: "faculdades",
    type: "Bacharelado",
    avgPrice: "R$ 500 a R$ 2.200/mês",
    priceLevel: "alto",
    duration: "5 anos",
    durationLevel: "longo",
    modality: "Presencial ou híbrido",
    bestFor:
      "Quem quer unir software, hardware, eletrônica, sistemas embarcados e engenharia.",
    notIdealFor:
      "Quem quer entrar rápido no mercado apenas com desenvolvimento web.",
    marketUse:
      "Forte para embarcados, IoT, robótica, telecom, software de baixo nível e engenharia.",
    certificate: "Diploma superior",
    practice: "Média a alta, com laboratórios e projetos de engenharia.",
    mathLevel: "Muito alta",
    beginnerScore: 2,
    decisionTip:
      "Escolha se você gosta de matemática, física, hardware e quer uma formação bem ampla e técnica.",
    pros: [
      "Formação muito robusta",
      "Abre portas em hardware e software",
      "Boa para IoT e sistemas embarcados",
    ],
    cautions: [
      "Curso longo e exigente",
      "Pode ter menos foco em web/app no início",
    ],
    objectives: ["diploma", "base", "emprego"],
  },
  {
    id: "inteligencia-artificial",
    name: "Inteligência Artificial",
    category: "faculdades",
    type: "Tecnólogo ou Bacharelado",
    avgPrice: "R$ 250 a R$ 1.500/mês",
    priceLevel: "alto",
    duration: "2,5 a 4 anos",
    durationLevel: "longo",
    modality: "Presencial, EAD ou híbrido",
    bestFor:
      "Quem quer estudar machine learning, dados, modelos, automação e aplicações de IA.",
    notIdealFor:
      "Quem ainda não gosta de matemática, estatística ou programação.",
    marketUse:
      "Boa base para dados, IA aplicada, automação, análise e pesquisa aplicada.",
    certificate: "Diploma superior",
    practice: "Média, melhora muito com projetos próprios e datasets reais.",
    mathLevel: "Alta",
    beginnerScore: 3,
    decisionTip:
      "Faz sentido se você já sabe que quer dados/IA e topa estudar Python, estatística e fundamentos.",
    pros: [
      "Área em crescimento",
      "Conecta dados e software",
      "Boa para projetos modernos",
    ],
    cautions: [
      "Nome do curso varia muito",
      "Sem base de dados e programação fica difícil",
    ],
    objectives: ["diploma", "ia", "dados", "emprego"],
  },
  {
    id: "ciencia-dados",
    name: "Ciência de Dados",
    category: "faculdades",
    type: "Tecnólogo ou Bacharelado",
    avgPrice: "R$ 250 a R$ 1.400/mês",
    priceLevel: "alto",
    duration: "2,5 a 4 anos",
    durationLevel: "longo",
    modality: "Presencial, EAD ou híbrido",
    bestFor:
      "Quem gosta de Python, SQL, estatística, dashboards, modelos e tomada de decisão.",
    notIdealFor:
      "Quem quer fugir de números, métricas e interpretação de dados.",
    marketUse:
      "Bom para análise de dados, BI, engenharia de dados e ciência de dados júnior.",
    certificate: "Diploma superior",
    practice: "Alta quando há projetos com datasets e dashboards.",
    mathLevel: "Alta",
    beginnerScore: 3,
    decisionTip:
      "Escolha se você quer dados como caminho principal, não só uma matéria dentro de outro curso.",
    pros: [
      "Foco claro em dados",
      "Projetos demonstráveis",
      "Boa conexão com negócio",
    ],
    cautions: [
      "Exige estatística",
      "Precisa montar portfólio com insights, não só gráficos",
    ],
    objectives: ["diploma", "dados", "ia", "emprego"],
  },
  {
    id: "seguranca-informacao",
    name: "Segurança da Informação",
    category: "faculdades",
    type: "Tecnólogo ou Bacharelado",
    avgPrice: "R$ 250 a R$ 1.300/mês",
    priceLevel: "alto",
    duration: "2,5 a 4 anos",
    durationLevel: "longo",
    modality: "Presencial, EAD ou híbrido",
    bestFor:
      "Quem gosta de redes, sistemas, investigação, risco, defesa e segurança digital.",
    notIdealFor:
      "Quem quer começar sem estudar fundamentos de redes, Linux e sistemas.",
    marketUse:
      "Bom para SOC, segurança defensiva, governança, pentest júnior e suporte especializado.",
    certificate: "Diploma superior",
    practice: "Alta se combinado com labs, CTFs e ambientes controlados.",
    mathLevel: "Média",
    beginnerScore: 3,
    decisionTip:
      "Escolha se você tem curiosidade por segurança e paciência para construir base técnica antes dos labs avançados.",
    pros: [
      "Área relevante",
      "Boa conexão com cloud e redes",
      "Projetos práticos em labs",
    ],
    cautions: ["Não é só hacking", "Exige ética, documentação e muita base"],
    objectives: ["diploma", "emprego", "base"],
  },
  {
    id: "redes-computadores",
    name: "Redes de Computadores",
    category: "faculdades",
    type: "Tecnólogo",
    avgPrice: "R$ 180 a R$ 900/mês",
    priceLevel: "medio",
    duration: "2 a 3 anos",
    durationLevel: "longo",
    modality: "Presencial, EAD ou híbrido",
    bestFor:
      "Quem quer infraestrutura, redes, cloud, suporte, segurança ou operações.",
    notIdealFor:
      "Quem quer programar interfaces e produtos digitais desde o começo.",
    marketUse:
      "Bom para suporte técnico, infraestrutura, cloud inicial, NOC, segurança e redes.",
    certificate: "Diploma superior",
    practice: "Média a alta com laboratórios e simuladores.",
    mathLevel: "Média",
    beginnerScore: 4,
    decisionTip:
      "Boa escolha se você gosta de entender como sistemas se conectam e quer uma porta para cloud/segurança.",
    pros: [
      "Base forte para infraestrutura",
      "Combina com certificações",
      "Boa entrada em suporte e cloud",
    ],
    cautions: ["Pode ter menos programação", "Precisa praticar com labs"],
    objectives: ["diploma", "cloud", "emprego"],
  },
  {
    id: "sistemas-internet",
    name: "Sistemas para Internet",
    category: "faculdades",
    type: "Tecnólogo",
    avgPrice: "R$ 170 a R$ 750/mês",
    priceLevel: "medio",
    duration: "2 a 3 anos",
    durationLevel: "longo",
    modality: "Presencial, EAD ou híbrido",
    bestFor:
      "Quem quer web, front-end, back-end, e-commerce e aplicações online.",
    notIdealFor: "Quem quer hardware, pesquisa ou matemática profunda.",
    marketUse:
      "Bom para desenvolvimento web, full stack júnior e projetos digitais.",
    certificate: "Diploma superior",
    practice: "Alta quando o curso exige projetos web.",
    mathLevel: "Baixa a média",
    beginnerScore: 5,
    decisionTip:
      "Uma alternativa bem prática para quem quer web e diploma em menos tempo.",
    pros: ["Foco em web", "Duração menor", "Projetos fáceis de publicar"],
    cautions: [
      "Menos amplo que Ciência da Computação",
      "Precisa caprichar no portfólio",
    ],
    objectives: ["diploma", "portfolio", "emprego", "rapido"],
  },
  {
    id: "jogos-digitais",
    name: "Jogos Digitais",
    category: "faculdades",
    type: "Tecnólogo ou Bacharelado",
    avgPrice: "R$ 250 a R$ 1.400/mês",
    priceLevel: "alto",
    duration: "2,5 a 4 anos",
    durationLevel: "longo",
    modality: "Presencial, EAD ou híbrido",
    bestFor:
      "Quem quer criar jogos, experiências interativas, arte técnica, lógica e engines.",
    notIdealFor:
      "Quem busca a rota mais direta para vagas corporativas tradicionais.",
    marketUse:
      "Bom para games, front-end interativo, realidade virtual, educação e simulações.",
    certificate: "Diploma superior",
    practice: "Alta, baseada em protótipos e portfólio.",
    mathLevel: "Média-Alta",
    beginnerScore: 3,
    decisionTip:
      "Escolha se você realmente quer games e aceita um mercado mais específico e competitivo.",
    pros: ["Muito prático", "Portfólio visual", "Mistura arte e programação"],
    cautions: [
      "Mercado mais nichado",
      "Pode exigir matemática, física e engines",
    ],
    objectives: ["diploma", "portfolio", "emprego"],
  },
  {
    id: "gestao-ti",
    name: "Gestão da Tecnologia da Informação",
    category: "faculdades",
    type: "Tecnólogo",
    avgPrice: "R$ 150 a R$ 650/mês",
    priceLevel: "medio",
    duration: "2 a 3 anos",
    durationLevel: "longo",
    modality: "Presencial, EAD ou híbrido",
    bestFor:
      "Quem quer gestão, processos, suporte, projetos, governança e ponte com negócio.",
    notIdealFor: "Quem quer virar dev focando pesado em código.",
    marketUse:
      "Bom para suporte, analista de TI, processos, projetos e coordenação inicial.",
    certificate: "Diploma superior",
    practice: "Média",
    mathLevel: "Baixa a média",
    beginnerScore: 4,
    decisionTip:
      "Boa escolha para perfis organizados que querem tecnologia com gestão e negócio.",
    pros: [
      "Versátil",
      "Menos matemática",
      "Boa ponte com áreas administrativas",
    ],
    cautions: [
      "Menos programação",
      "Pode exigir cursos técnicos extras para dev",
    ],
    objectives: ["diploma", "negocio", "emprego"],
  },
  {
    id: "curso-video",
    name: "Curso em Vídeo",
    category: "cursos",
    type: "Curso gratuito",
    avgPrice: "Gratuito",
    priceLevel: "gratis",
    duration: "2 a 12 semanas por trilha",
    durationLevel: "medio",
    modality: "Online",
    bestFor: "Primeiros passos em lógica, Python, HTML, CSS e JavaScript.",
    notIdealFor:
      "Quem precisa de trilha avançada ou acompanhamento individual.",
    marketUse: "Ótimo para base inicial, mas precisa virar projeto.",
    certificate: "Certificado opcional em alguns cursos",
    practice: "Média",
    mathLevel: "Baixa",
    beginnerScore: 5,
    decisionTip:
      "Comece aqui se o orçamento é zero e você ainda está entendendo a área.",
    pros: ["Didática acessível", "Gratuito", "Muito bom para base"],
    cautions: ["Não substitui portfólio", "Algumas trilhas são introdutórias"],
    objectives: ["gratis", "base", "rapido"],
  },
  {
    id: "freecodecamp",
    name: "freeCodeCamp",
    category: "cursos",
    type: "Curso gratuito",
    avgPrice: "Gratuito",
    priceLevel: "gratis",
    duration: "1 a 6 meses",
    durationLevel: "medio",
    modality: "Online",
    bestFor:
      "Quem quer praticar front-end, JavaScript, dados e projetos guiados.",
    notIdealFor: "Quem não se adapta bem a conteúdo em inglês.",
    marketUse: "Bom para montar base e primeiros projetos.",
    certificate: "Certificação gratuita",
    practice: "Alta",
    mathLevel: "Baixa a média",
    beginnerScore: 5,
    decisionTip:
      "Excelente se você aprende fazendo e aceita praticar em inglês.",
    pros: ["Muita prática", "Certificado gratuito", "Projetos no caminho"],
    cautions: [
      "Pode exigir inglês",
      "Precisa complementar com projetos próprios",
    ],
    objectives: ["gratis", "portfolio", "rapido"],
  },
  {
    id: "dio",
    name: "DIO",
    category: "cursos",
    type: "Bootcamps e cursos",
    avgPrice: "Gratuito a planos pagos",
    priceLevel: "baixo",
    duration: "2 semanas a 3 meses",
    durationLevel: "medio",
    modality: "Online",
    bestFor:
      "Quem quer bootcamps, certificados e contato com empresas parceiras.",
    notIdealFor: "Quem precisa de profundidade técnica em tudo.",
    marketUse: "Boa para certificados, prática inicial e desafios.",
    certificate: "Certificados de cursos e bootcamps",
    practice: "Média",
    mathLevel: "Baixa",
    beginnerScore: 4,
    decisionTip:
      "Use para ganhar ritmo e certificados, mas escolha bem os bootcamps.",
    pros: ["Muitos bootcamps", "Certificados", "Conteúdo em português"],
    cautions: ["Qualidade varia", "Pode ser superficial em temas avançados"],
    objectives: ["certificado", "emprego", "rapido"],
  },
  {
    id: "alura",
    name: "Alura",
    category: "plataformas",
    type: "Plataforma paga",
    avgPrice: "R$ 80 a R$ 140/mês em planos anuais",
    priceLevel: "medio",
    duration: "Uso contínuo",
    durationLevel: "medio",
    modality: "Online",
    bestFor:
      "Quem quer trilhas em português e variedade em programação, dados, design e produto.",
    notIdealFor: "Quem quer estudar sem pagar assinatura.",
    marketUse: "Boa para organizar estudo e explorar áreas.",
    certificate: "Certificados por curso",
    practice: "Média",
    mathLevel: "Varia por trilha",
    beginnerScore: 4,
    decisionTip:
      "Vale se você quer curadoria em português e vai usar com frequência.",
    pros: ["Trilhas organizadas", "Conteúdo em português", "Muitas áreas"],
    cautions: [
      "Assinatura exige constância",
      "Ainda precisa criar projetos autorais",
    ],
    objectives: ["certificado", "base", "emprego"],
  },
  {
    id: "rocketseat",
    name: "Rocketseat",
    category: "plataformas",
    type: "Cursos e comunidade",
    avgPrice: "Gratuito a planos pagos",
    priceLevel: "medio",
    duration: "1 a 6 meses",
    durationLevel: "medio",
    modality: "Online",
    bestFor:
      "Quem quer desenvolvimento web/mobile moderno com projetos práticos.",
    notIdealFor: "Quem ainda não sabe se gosta de programação.",
    marketUse: "Boa para portfólio front-end, back-end e full stack.",
    certificate: "Certificados em cursos pagos e eventos",
    practice: "Alta",
    mathLevel: "Baixa",
    beginnerScore: 4,
    decisionTip:
      "Boa escolha se você quer construir projetos modernos e gosta de comunidade.",
    pros: ["Projetos práticos", "Comunidade forte", "Stack moderna"],
    cautions: ["Pode avançar rápido", "Foco maior em desenvolvimento"],
    objectives: ["portfolio", "emprego", "rapido"],
  },
  {
    id: "coursera",
    name: "Coursera",
    category: "plataformas",
    type: "Cursos com universidades",
    avgPrice: "Gratuito para assistir; certificado pago",
    priceLevel: "medio",
    duration: "1 a 6 meses",
    durationLevel: "medio",
    modality: "Online",
    bestFor:
      "Quem quer cursos de empresas e universidades, especialmente dados, IA e cloud.",
    notIdealFor: "Quem quer conteúdo sempre em português.",
    marketUse:
      "Bom para fundamentos, especializações e certificados reconhecidos.",
    certificate: "Certificado pago",
    practice: "Média",
    mathLevel: "Média a alta",
    beginnerScore: 3,
    decisionTip:
      "Vale se você quer currículo com nomes fortes e consegue estudar em inglês.",
    pros: [
      "Instituições reconhecidas",
      "Boa base teórica",
      "Trilhas de dados e IA",
    ],
    cautions: ["Certificado pago", "Nem sempre é prático"],
    objectives: ["certificado", "dados", "ia", "base"],
  },
  {
    id: "microsoft-learn",
    name: "Microsoft Learn",
    category: "cursos",
    type: "Treinamento oficial",
    avgPrice: "Gratuito",
    priceLevel: "gratis",
    duration: "1 dia a 4 semanas por trilha",
    durationLevel: "curto",
    modality: "Online",
    bestFor: "Quem quer cloud, Azure, GitHub, dados e fundamentos oficiais.",
    notIdealFor: "Quem quer aulas longas com acompanhamento.",
    marketUse: "Forte para estudar ferramentas Microsoft e certificações.",
    certificate: "Badges e preparação para certificações pagas",
    practice: "Média",
    mathLevel: "Baixa a média",
    beginnerScore: 4,
    decisionTip:
      "Use se você quer cloud ou ferramentas Microsoft sem custo inicial.",
    pros: ["Oficial", "Gratuito", "Módulos curtos"],
    cautions: [
      "Mais focado no ecossistema Microsoft",
      "Certificação oficial é paga",
    ],
    objectives: ["gratis", "cloud", "certificado"],
  },
  {
    id: "kaggle-learn",
    name: "Kaggle Learn",
    category: "cursos",
    type: "Microcursos gratuitos",
    avgPrice: "Gratuito",
    priceLevel: "gratis",
    duration: "3 a 10 horas por curso",
    durationLevel: "curto",
    modality: "Online",
    bestFor:
      "Quem quer Python, pandas, machine learning e SQL com prática rápida.",
    notIdealFor: "Quem ainda não sabe nada de lógica ou inglês.",
    marketUse: "Muito bom para começar portfólio de dados.",
    certificate: "Certificado simples na plataforma",
    practice: "Alta",
    mathLevel: "Média",
    beginnerScore: 4,
    decisionTip:
      "Escolha se quer testar dados sem gastar e com exercícios curtos.",
    pros: ["Prático", "Gratuito", "Direto ao ponto"],
    cautions: ["Em inglês", "Precisa transformar exercícios em projetos"],
    objectives: ["gratis", "dados", "portfolio", "rapido"],
  },
  {
    id: "frontend",
    name: "Front-end",
    category: "areas",
    type: "Área de TI",
    avgPrice: "Pode começar grátis",
    priceLevel: "gratis",
    duration: "3 a 9 meses para base inicial",
    durationLevel: "medio",
    modality: "Projetos, cursos e prática",
    bestFor:
      "Quem gosta de visual, interface, acessibilidade e ver resultado rápido.",
    notIdealFor: "Quem não gosta de detalhes visuais e mudanças frequentes.",
    marketUse: "Boa porta de entrada com portfólio publicado.",
    certificate: "Não obrigatório",
    practice: "Muito alta",
    mathLevel: "Baixa",
    beginnerScore: 5,
    decisionTip:
      "Escolha se você gosta de construir telas e publicar projetos visíveis.",
    pros: [
      "Feedback visual rápido",
      "Muitos materiais grátis",
      "Portfólio fácil de mostrar",
    ],
    cautions: ["Mercado competitivo", "Precisa caprichar em projetos"],
    objectives: ["gratis", "portfolio", "emprego", "rapido"],
  },
  {
    id: "backend",
    name: "Back-end",
    category: "areas",
    type: "Área de TI",
    avgPrice: "Pode começar grátis",
    priceLevel: "gratis",
    duration: "4 a 12 meses para base inicial",
    durationLevel: "medio",
    modality: "Projetos, APIs e banco de dados",
    bestFor: "Quem gosta de lógica, regras de negócio, APIs e dados.",
    notIdealFor: "Quem quer resultado visual imediato.",
    marketUse: "Forte para vagas de desenvolvimento e sistemas.",
    certificate: "Não obrigatório",
    practice: "Alta",
    mathLevel: "Média",
    beginnerScore: 4,
    decisionTip:
      "Escolha se você gosta de resolver lógica e entender como sistemas funcionam por trás.",
    pros: [
      "Base muito reaproveitável",
      "Boa demanda",
      "Conecta com cloud e dados",
    ],
    cautions: ["Mais abstrato no início", "Debug pode ser menos visual"],
    objectives: ["gratis", "emprego", "base"],
  },
  {
    id: "dados",
    name: "Dados",
    category: "areas",
    type: "Área de TI",
    avgPrice: "Pode começar grátis",
    priceLevel: "gratis",
    duration: "4 a 12 meses para base inicial",
    durationLevel: "medio",
    modality: "Python, SQL, dashboards e projetos",
    bestFor: "Quem gosta de investigar padrões, números e explicar insights.",
    notIdealFor: "Quem não gosta de análise, planilhas ou estatística.",
    marketUse: "Bom para análise, BI, engenharia e ciência de dados.",
    certificate: "Ajuda, mas portfólio pesa muito",
    practice: "Alta",
    mathLevel: "Média-Alta",
    beginnerScore: 4,
    decisionTip:
      "Escolha se você gosta de perguntas, dados e conclusões bem explicadas.",
    pros: [
      "Muitos datasets públicos",
      "Boa conexão com negócio",
      "Projetos demonstráveis",
    ],
    cautions: [
      "Precisa comunicar insights",
      "Estatística aparece com frequência",
    ],
    objectives: ["dados", "portfolio", "emprego"],
  },
  {
    id: "uxui",
    name: "UX/UI Design",
    category: "areas",
    type: "Área de TI",
    avgPrice: "Grátis a R$ 100/mês em ferramentas/cursos",
    priceLevel: "baixo",
    duration: "3 a 9 meses para base inicial",
    durationLevel: "medio",
    modality: "Cases, Figma, pesquisa e protótipos",
    bestFor:
      "Quem gosta de entender pessoas, criar fluxos e melhorar experiências.",
    notIdealFor: "Quem quer só fazer telas bonitas sem pesquisa.",
    marketUse: "Bom para produto, design, pesquisa e interfaces.",
    certificate: "Menos importante que cases",
    practice: "Alta",
    mathLevel: "Baixa",
    beginnerScore: 5,
    decisionTip:
      "Escolha se você gosta de pessoas, problemas e comunicação visual.",
    pros: [
      "Portfólio por cases",
      "Boa para perfis comunicativos",
      "Não exige programação no início",
    ],
    cautions: ["Case precisa mostrar processo", "Mercado cobra repertório"],
    objectives: ["portfolio", "rapido", "emprego"],
  },
];

const objectives = [
  { id: "todos", label: "Qualquer prioridade" },
  { id: "gratis", label: "Priorizar gratuito ou barato" },
  { id: "diploma", label: "Preciso de diploma superior" },
  { id: "portfolio", label: "Montar portfólio / projetos" },
  { id: "emprego", label: "Entrar no mercado rápido" },
  { id: "dados", label: "Foco em dados" },
  { id: "ia", label: "Foco em IA" },
  { id: "cloud", label: "Foco em cloud / infra" },
  { id: "negocio", label: "TI ligado a negócio" },
  { id: "certificado", label: "Certificado conta" },
];

const budgets = [
  { id: "todos", label: "Orçamento: qualquer" },
  { id: "gratis", label: "Só gratuito" },
  { id: "baixo", label: "Baixo (até pouco por mês)" },
  { id: "medio", label: "Médio" },
  { id: "alto", label: "Posso pagar valores maiores" },
];

const durations = [
  { id: "todos", label: "Duração: qualquer" },
  { id: "curto", label: "Curto prazo" },
  { id: "medio", label: "Prazo médio" },
  { id: "longo", label: "Longo prazo (anos)" },
];

function canShowByBudget(
  priceLevel: ComparisonItem["priceLevel"],
  budget: string,
) {
  if (budget === "todos" || budget === "alto") return true;
  if (budget === "medio")
    return ["gratis", "baixo", "medio"].includes(priceLevel);
  if (budget === "baixo") return ["gratis", "baixo"].includes(priceLevel);
  return priceLevel === "gratis";
}

function scoreLabel(score: number) {
  if (score >= 5) return "Muito amigável";
  if (score >= 4) return "Bom para iniciar";
  if (score >= 3) return "Exige mais base";
  return "Mais difícil";
}

const comparisonRows: Array<{
  label: string;
  getValue: (item: ComparisonItem) => string;
}> = [
  { label: "Tipo", getValue: (item) => item.type },
  { label: "Preço médio", getValue: (item) => item.avgPrice },
  { label: "Duração", getValue: (item) => item.duration },
  { label: "Formato", getValue: (item) => item.modality },
  { label: "Melhor para", getValue: (item) => item.bestFor },
  { label: "Não é ideal para", getValue: (item) => item.notIdealFor },
  { label: "Uso no mercado", getValue: (item) => item.marketUse },
  { label: "Certificado/diploma", getValue: (item) => item.certificate },
  { label: "Prática", getValue: (item) => item.practice },
  { label: "Matemática", getValue: (item) => item.mathLevel },
  {
    label: "Para iniciantes",
    getValue: (item) => scoreLabel(item.beginnerScore),
  },
];

export default function Comparador() {
  const { isPro } = useSubscription();
  const [comparisonKind, setComparisonKind] =
    useState<ComparisonCategory>("faculdades");
  const [objective, setObjective] = useState("todos");
  const [budget, setBudget] = useState("todos");
  const [duration, setDuration] = useState("todos");

  const itemsInKind = useMemo(
    () => comparisonItems.filter((item) => item.category === comparisonKind),
    [comparisonKind],
  );

  const filteredItems = useMemo(
    () =>
      itemsInKind.filter((item) => {
        const matchObjective =
          objective === "todos" || item.objectives.includes(objective);
        const matchBudget = canShowByBudget(item.priceLevel, budget);
        const matchDuration =
          duration === "todos" || item.durationLevel === duration;

        return matchObjective && matchBudget && matchDuration;
      }),
    [budget, duration, itemsInKind, objective],
  );

  const options = useMemo(
    () => (filteredItems.length >= 2 ? filteredItems : itemsInKind),
    [filteredItems, itemsInKind],
  );

  const [leftId, setLeftId] = useState("ads");
  const [rightId, setRightId] = useState("ciencia-computacao");

  useEffect(() => {
    if (options.length < 2) return;

    const nextL = options.some((o) => o.id === leftId) ? leftId : options[0].id;
    let nextR = options.some((o) => o.id === rightId)
      ? rightId
      : (options.find((o) => o.id !== nextL)?.id ?? options[1].id);
    if (nextR === nextL)
      nextR = options.find((o) => o.id !== nextL)?.id ?? options[1].id;

    if (nextL !== leftId) setLeftId(nextL);
    if (nextR !== rightId) setRightId(nextR);
  }, [options, leftId, rightId]);

  const left = options.find((item) => item.id === leftId) ?? options[0];
  const right =
    options.find((item) => item.id === rightId && item.id !== left?.id) ??
    options.find((item) => item.id !== left?.id) ??
    options[0];
  const recommendation =
    left.beginnerScore === right.beginnerScore
      ? "As duas opções podem funcionar. Decida pelo seu contexto: orçamento, tempo disponível e tipo de rotina que você aguenta manter."
      : left.beginnerScore > right.beginnerScore
        ? `${left.name} tende a ser mais amigável para começar, mas compare com seu objetivo antes de decidir.`
        : `${right.name} tende a ser mais amigável para começar, mas compare com seu objetivo antes de decidir.`;

  function resetFilters() {
    setComparisonKind("faculdades");
    setObjective("todos");
    setBudget("todos");
    setDuration("todos");
  }

  const kindMeta = comparisonGroups.find((g) => g.id === comparisonKind);
  const reduce = useReducedMotion();

  return (
    <Layout>
      <SEO
        title="Comparador Tech · Compare faculdades, cursos, áreas e plataformas"
        description="Compare opções de estudo e carreira em tecnologia lado a lado, considerando custo, tempo, perfil, objetivo e riscos para iniciantes."
        keywords={[
          "comparador tecnologia",
          "comparar cursos ti",
          "comparar faculdades tecnologia",
          "comparar áreas da ti",
        ]}
        url="/comparador"
        schemaType="WebPage"
      />
      <section className="relative overflow-hidden border-b-2 border-slate-900 bg-violet-100 py-12">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <p className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
            comparador
          </p>
          <h1 className="font-display text-4xl font-black text-slate-950">
            Compare antes de escolher.
          </h1>
          <p className="mt-3 max-w-2xl text-slate-950">
            Coloque duas opções lado a lado e entenda custo, tempo, melhor uso e
            riscos para iniciantes.
          </p>
        </div>
      </section>

      {/* Comparador e recurso Pro: free/deslogado ve o hero (landing) + gate,
          nunca o conteudo interativo. Mesmo mecanismo das ferramentas Pro. */}
      {!isPro ? (
        <section className="bg-[#faf8f4] py-12">
          <div className="container">
            {/* TODO(Ana): revisar copy do gate do comparador */}
            <ProGate
              feature="comparador"
              description="Compare graduações e faculdades, cursos, plataformas de estudo, áreas de TI e tecnologias lado a lado: custo, tempo, dificuldade, mercado, certificação, pré-requisitos e indicações antes de decidir."
            />
          </div>
        </section>
      ) : (
        <section className="bg-[#faf8f4] py-12">
          <div className="container space-y-6">
            {/* PASSO 1: escolher a subarea (controle unico) */}
            {/* TODO(Ana): revisar copy dos passos do comparador */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-slate-900 bg-amber-300 font-display text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a]">
                  1
                </span>
                <div>
                  <h2 className="font-display text-2xl font-black text-slate-950">
                    O que você quer comparar?
                  </h2>
                  <p className="text-sm font-semibold text-slate-600">
                    Escolha uma categoria. A comparação acontece só dentro dela.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {comparisonGroups.map((g, idx) => {
                  const ui = SUBAREA_UI[g.id];
                  const Icon = ui.Icon;
                  const active = comparisonKind === g.id;
                  return (
                    <motion.button
                      key={g.id}
                      type="button"
                      onClick={() => setComparisonKind(g.id)}
                      aria-pressed={active}
                      initial={reduce ? false : { opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.3,
                        delay: Math.min(idx * 0.05, 0.2),
                      }}
                      whileHover={reduce ? undefined : { y: -2 }}
                      className={cn(
                        "flex h-full flex-col rounded-2xl border-2 border-slate-900 p-4 text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
                        active
                          ? cn(ui.bg, ui.shadow)
                          : "bg-white shadow-[3px_3px_0_#0f172a] hover:shadow-[5px_5px_0_#0f172a]",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-slate-900 bg-white",
                          ui.text,
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="mt-3 font-display text-sm font-black text-slate-950">
                        {g.label}
                      </span>
                      <span className="mt-1 text-xs font-semibold text-slate-500">
                        {g.hint}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* PASSO 2: filtros subordinados a subarea */}
            <div className="card-brutal rounded-2xl bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-slate-900 bg-amber-300 font-display text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a]">
                    2
                  </span>
                  <div>
                    <h2 className="font-display text-2xl font-black text-slate-950">
                      Refine (opcional)
                    </h2>
                    <p className="text-sm font-semibold text-slate-600">
                      Ajuste prioridade, pagamento e ritmo para filtrar as
                      opções desta categoria.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black hover:bg-violet-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpar filtros
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-xs font-black uppercase text-slate-600">
                  Prioridade
                  <BntSelect
                    label="Prioridade"
                    value={objective}
                    onValueChange={setObjective}
                    options={objectives.map((item) => ({
                      value: item.id,
                      label: item.label,
                    }))}
                  />
                </label>
                <label className="text-xs font-black uppercase text-slate-600">
                  Pagamento
                  <BntSelect
                    label="Pagamento"
                    value={budget}
                    onValueChange={setBudget}
                    options={budgets.map((item) => ({
                      value: item.id,
                      label: item.label,
                    }))}
                  />
                </label>
                <label className="text-xs font-black uppercase text-slate-600">
                  Ritmo / duração
                  <BntSelect
                    label="Ritmo / duração"
                    value={duration}
                    onValueChange={setDuration}
                    options={durations.map((item) => ({
                      value: item.id,
                      label: item.label,
                    }))}
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-start gap-2 rounded-xl bg-violet-50 p-3 text-sm font-bold text-violet-900">
                <Filter className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {filteredItems.length >= 2
                    ? `${filteredItems.length} opções neste grupo batem com prioridade, pagamento e duração.`
                    : `Com esses filtros há poucas opções. Mostramos todas as ${itemsInKind.length} deste tipo para você ainda conseguir comparar duas.`}
                </span>
              </div>
            </div>

            {/* PASSO 3: escolher A e B (mesmo grupo) */}
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-slate-900 bg-amber-300 font-display text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a]">
                3
              </span>
              <div>
                <h2 className="font-display text-2xl font-black text-slate-950">
                  Coloque lado a lado
                </h2>
                <p className="text-sm font-semibold text-slate-600">
                  Escolha as duas opções de "{kindMeta?.label ?? comparisonKind}
                  " para comparar.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="card-brutal rounded-2xl bg-white p-4 text-sm font-bold">
                <span className="inline-flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-slate-900 bg-violet-200 text-xs font-black text-violet-900">
                    A
                  </span>
                  <span className="text-slate-950">Opção A</span>
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                  Mesmo grupo que a opção B
                </span>
                <BntSelect
                  label="Opção A"
                  value={left.id}
                  onValueChange={(v) => {
                    setLeftId(v);
                    if (v === rightId && options.length >= 2) {
                      const swap = options.find((o) => o.id !== v);
                      if (swap) setRightId(swap.id);
                    }
                  }}
                  options={options.map((option) => ({
                    value: option.id,
                    label: option.name,
                  }))}
                />
              </label>
              <label className="card-brutal rounded-2xl bg-white p-4 text-sm font-bold">
                <span className="inline-flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-slate-900 bg-amber-200 text-xs font-black text-amber-900">
                    B
                  </span>
                  <span className="text-slate-950">Opção B</span>
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                  Só entradas do tipo "{kindMeta?.label ?? comparisonKind}"
                </span>
                <BntSelect
                  label="Opção B"
                  value={right.id}
                  onValueChange={(v) => setRightId(v)}
                  options={options
                    .filter((option) => option.id !== left.id)
                    .map((option) => ({ value: option.id, label: option.name }))}
                />
              </label>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {[left, right].map((item) => (
                <motion.article
                  key={item.id}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="card-brutal rounded-2xl bg-white p-6"
                >
                  <p className="mb-2 inline-flex rounded-full bg-violet-100 px-2 py-1 text-xs font-black uppercase text-violet-700">
                    {item.type}
                  </p>
                  <h2 className="font-display text-3xl font-black text-slate-950">
                    {item.name}
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    {item.decisionTip}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-emerald-50 p-3">
                      <p className="text-xs font-black uppercase text-emerald-700">
                        Preço
                      </p>
                      <p className="text-sm font-black">{item.avgPrice}</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3">
                      <p className="text-xs font-black uppercase text-amber-700">
                        Tempo
                      </p>
                      <p className="text-sm font-black">{item.duration}</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-3">
                      <p className="text-xs font-black uppercase text-blue-700">
                        Iniciante
                      </p>
                      <p className="text-sm font-black">
                        {scoreLabel(item.beginnerScore)}
                      </p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="card-brutal overflow-hidden rounded-2xl bg-white">
              <div className="overflow-x-auto">
                <div className="min-w-[560px]">
                  <div className="grid grid-cols-3 border-b-2 border-slate-900 bg-violet-700 text-white">
                    <div className="p-4 text-sm font-black">Critério</div>
                    <div className="p-4 text-sm font-black">{left.name}</div>
                    <div className="p-4 text-sm font-black">{right.name}</div>
                  </div>
                  {comparisonRows.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-3 border-b border-slate-200 last:border-0"
                    >
                      <div className="p-4 text-sm font-black text-slate-950">
                        {row.label}
                      </div>
                      <div className="p-4 text-sm text-slate-600">
                        {row.getValue(left)}
                      </div>
                      <div className="p-4 text-sm text-slate-600">
                        {row.getValue(right)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="card-brutal rounded-2xl bg-violet-50 p-5 lg:col-span-2">
                <h2 className="flex items-center gap-2 font-display text-2xl font-black text-slate-950">
                  <Lightbulb className="h-6 w-6 text-violet-700" />
                  Recomendação prática
                </h2>
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  {recommendation}
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  Regra simples: se você precisa de diploma, escolha faculdade.
                  Se precisa testar uma área rápido, comece com curso gratuito e
                  projeto. Se quer decidir entre áreas, compare pelo tipo de
                  tarefa que você aguenta fazer toda semana.
                </p>
              </div>
              <div className="card-brutal rounded-2xl bg-white p-5">
                <h3 className="font-display text-xl font-black text-slate-950">
                  Pontos de atenção
                </h3>
                <div className="mt-3 space-y-3">
                  {[left, right].map((item) => (
                    <div key={item.id}>
                      <p className="mb-1 flex items-center gap-2 text-sm font-black text-slate-800">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />{" "}
                        {item.name}
                      </p>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {item.cautions.slice(0, 2).map((caution) => (
                          <li key={caution}>• {caution}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {[left, right].map((item) => (
                <div
                  key={item.id}
                  className="card-brutal rounded-2xl bg-white p-5"
                >
                  <h3 className="mb-3 flex items-center gap-2 font-display text-xl font-black text-slate-950">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    Vantagens de {item.name}
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {item.pros.map((pro) => (
                      <li key={pro}>• {pro}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
