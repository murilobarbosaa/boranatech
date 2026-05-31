// Stack Overflow Developer Survey 2025: dados públicos
// Fonte: https://survey.stackoverflow.co/2025/technology/
//
// Centraliza todos os percentuais e textos vindos do survey num único arquivo
// pra que a atualização anual (Survey 2026, etc.) seja a troca deste arquivo
// sem caçar números espalhados pelo código.

export const STACK_OVERFLOW_SURVEY = {
  year: 2025,
  sourceName: "Stack Overflow Developer Survey 2025",
  sourceUrl: "https://survey.stackoverflow.co/2025/technology/",
} as const;

export const GITHUB_OCTOVERSE = {
  year: 2025,
  sourceName: "GitHub Octoverse 2025",
  sourceUrl:
    "https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/",
} as const;

export interface UsageEvidence {
  usagePercent?: number;
  usageLabel?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceNote?: string;
}

// Helper para formatar percentual no padrão pt-BR (vírgula decimal).
function pct(value: number, label: string): string {
  const formatted = value.toString().replace(".", ",");
  return `${formatted}% ${label}`;
}

const survey: Pick<UsageEvidence, "sourceName" | "sourceUrl"> = {
  sourceName: STACK_OVERFLOW_SURVEY.sourceName,
  sourceUrl: STACK_OVERFLOW_SURVEY.sourceUrl,
};

const octoverse: Pick<UsageEvidence, "sourceName" | "sourceUrl"> = {
  sourceName: GITHUB_OCTOVERSE.sourceName,
  sourceUrl: GITHUB_OCTOVERSE.sourceUrl,
};

// Mapa por slug (mesmo slug usado na tabela Supabase `technologies`).
// Techs do banco que não aparecem aqui ficam sem percentual na UI.
export const usageEvidence: Record<string, UsageEvidence> = {
  // ---------- Linguagens ----------
  javascript: { usagePercent: 66, usageLabel: pct(66, "dos respondentes"), ...survey, sourceNote: "Linguagens de programação, scripting e markup" },
  html: { usagePercent: 61.9, usageLabel: pct(61.9, "em HTML/CSS"), ...survey, sourceNote: "Stack Overflow agrupa HTML e CSS na pesquisa" },
  css: { usagePercent: 61.9, usageLabel: pct(61.9, "em HTML/CSS"), ...survey, sourceNote: "Stack Overflow agrupa HTML e CSS na pesquisa" },
  sql: { usagePercent: 58.6, usageLabel: pct(58.6, "dos respondentes"), ...survey, sourceNote: "Linguagens de programação, scripting e markup" },
  python: { usagePercent: 57.9, usageLabel: pct(57.9, "dos respondentes"), ...survey, sourceNote: "Maior crescimento entre as linguagens em 2025, puxado por IA e ciência de dados" },
  typescript: { usagePercent: 43.6, usageLabel: pct(43.6, "dos respondentes"), ...survey, sourceNote: "TypeScript se tornou a linguagem #1 no GitHub em agosto/2025 (Octoverse 2025)" },
  java: { usagePercent: 29.4, usageLabel: pct(29.4, "dos respondentes"), ...survey, sourceNote: "Linguagens de programação, scripting e markup" },
  csharp: { usagePercent: 27.8, usageLabel: pct(27.8, "dos respondentes"), ...survey, sourceNote: "Linguagens de programação, scripting e markup" },
  php: { usagePercent: 18.9, usageLabel: pct(18.9, "dos respondentes"), ...survey, sourceNote: "Linguagens de programação, scripting e markup" },
  go: { usagePercent: 16.4, usageLabel: pct(16.4, "dos respondentes"), ...survey, sourceNote: "Linguagens de programação, scripting e markup" },
  rust: { usagePercent: 14.8, usageLabel: pct(14.8, "dos respondentes"), ...survey, sourceNote: "Rust segue como linguagem mais admirada em 2025 (72%)" },
  kotlin: { usagePercent: 10.8, usageLabel: pct(10.8, "dos respondentes"), ...survey, sourceNote: "Linguagens de programação, scripting e markup" },
  swift: { usagePercent: 5.4, usageLabel: pct(5.4, "dos respondentes"), ...survey, sourceNote: "Linguagens de programação, scripting e markup" },
  r: { usagePercent: 4.9, usageLabel: pct(4.9, "dos respondentes"), ...survey, sourceNote: "Linguagens de programação, scripting e markup" },

  // ---------- Bancos de Dados ----------
  postgresql: { usagePercent: 55.6, usageLabel: pct(55.6, "dos respondentes"), ...survey, sourceNote: "Lidera entre os bancos pelo terceiro ano consecutivo" },
  mysql: { usagePercent: 40.5, usageLabel: pct(40.5, "dos respondentes"), ...survey, sourceNote: "Bancos de dados" },
  redis: { usagePercent: 28, usageLabel: pct(28, "dos respondentes"), ...survey, sourceNote: "Cresceu ~8 pontos vs 2024" },
  mongodb: { usagePercent: 24, usageLabel: pct(24, "dos respondentes"), ...survey, sourceNote: "Bancos de dados" },

  // ---------- Cloud ----------
  aws: { usagePercent: 43.3, usageLabel: pct(43.3, "dos respondentes"), ...survey, sourceNote: "Plataformas de cloud" },
  azure: { usagePercent: 26.3, usageLabel: pct(26.3, "dos respondentes"), ...survey, sourceNote: "Plataformas de cloud" },
  "google-cloud": { usagePercent: 24.6, usageLabel: pct(24.6, "dos respondentes"), ...survey, sourceNote: "Plataformas de cloud" },

  // ---------- DevOps / ferramentas ----------
  docker: { usagePercent: 71.1, usageLabel: pct(71.1, "dos respondentes"), ...survey, sourceNote: "Ferramenta mais usada na categoria de build, deploy e containers" },
  kubernetes: { usagePercent: 28.5, usageLabel: pct(28.5, "dos respondentes"), ...survey, sourceNote: "Ferramentas de build e deploy" },

  // ---------- Frameworks web ----------
  nodejs: { usagePercent: 48.7, usageLabel: pct(48.7, "dos respondentes"), ...survey, sourceNote: "Web frameworks e tecnologias" },
  react: { usagePercent: 44.7, usageLabel: pct(44.7, "dos respondentes"), ...survey, sourceNote: "Web frameworks e tecnologias" },
  nextjs: { usagePercent: 20.8, usageLabel: pct(20.8, "dos respondentes"), ...survey, sourceNote: "Web frameworks e tecnologias" },
  expressjs: { usagePercent: 19.9, usageLabel: pct(19.9, "dos respondentes"), ...survey, sourceNote: "Web frameworks e tecnologias" },
  angular: { usagePercent: 18.2, usageLabel: pct(18.2, "dos respondentes"), ...survey, sourceNote: "Web frameworks e tecnologias" },
  vuejs: { usagePercent: 17.6, usageLabel: pct(17.6, "dos respondentes"), ...survey, sourceNote: "Web frameworks e tecnologias" },
  fastapi: { usagePercent: 14.8, usageLabel: pct(14.8, "dos respondentes"), ...survey, sourceNote: "Web frameworks e tecnologias" },
  "spring-boot": { usagePercent: 14.7, usageLabel: pct(14.7, "dos respondentes"), ...survey, sourceNote: "Web frameworks e tecnologias" },
  django: { usagePercent: 12.6, usageLabel: pct(12.6, "dos respondentes"), ...survey, sourceNote: "Web frameworks e tecnologias" },

  // ---------- Qualitativos (sem percentual direto no Survey 2025) ----------
  "tailwind-css": {
    usageLabel: "Utility-first CSS dominante em muitos bootcamps e greenfield web",
    sourceName: "Curadoria BORA NA TECH?",
    sourceNote:
      "O Stack Overflow 2025 agrega várias tecnologias de web frameworks/CSS; não use este quadro como percentual oficial só do Tailwind.",
  },
  vite: {
    usageLabel: "Build tool de front-end muito adotado em projetos React/Vue modernos",
    sourceName: "Curadoria BORA NA TECH?",
    sourceNote: "Sem linha dedicada comparável no gráfico principal do Stack Overflow 2025",
  },
  "react-native": {
    usageLabel: "Base comum de apps móveis em times que já usam React",
    sourceName: "Curadoria BORA NA TECH?",
    sourceNote: "Indicador qualitativo; React e Flutter têm linhas próprias na pesquisa",
  },
  flutter: {
    usageLabel: "Framework Google para apps cross-platform com Dart",
    sourceName: "Curadoria BORA NA TECH?",
    sourceNote: "Sem linha exclusiva entre os Top Frameworks no Stack Overflow 2025",
  },
  graphql: {
    usageLabel: "Camada de API adotada em produtos com múltiplos clientes",
    sourceName: "Curadoria BORA NA TECH?",
    sourceNote: "Indicador qualitativo; REST permanece majoritário na maioria dos relatórios",
  },
  redux: {
    usageLabel: "Estado global ainda presente em bases React maiores",
    sourceName: "Curadoria BORA NA TECH?",
    sourceNote: "Indicador qualitativo; tendência a soluções mais leves em apps novos",
  },
  webpack: {
    usageLabel: "Bundler histórico; ainda usado em codebases maduras",
    sourceName: "Curadoria BORA NA TECH?",
    sourceNote: "Indicador qualitativo; Vite e ferramentas nativas competem em projetos novos",
  },
  storybook: {
    usageLabel: "Padrão em design systems e documentação de componentes",
    sourceName: "Curadoria BORA NA TECH?",
    sourceNote: "Indicador qualitativo de adoção em times de front e design",
  },
  cypress: {
    usageLabel: "E2E popular em front-end; comum em pipelines de CI",
    sourceName: "Curadoria BORA NA TECH?",
    sourceNote: "Indicador qualitativo em QA de interface",
  },
  playwright: {
    usageLabel: "E2E multi-browser em forte ascensão em times web",
    sourceName: "Curadoria BORA NA TECH?",
    sourceNote: "Indicador qualitativo; compare com outras ferramentas de teste na sua stack",
  },
  sass: {
    usageLabel: "Pré-processador CSS ainda presente em design systems",
    sourceName: "Curadoria BORA NA TECH?",
    sourceNote: "Indicador qualitativo; Tailwind e CSS moderno reduzem necessidade em apps novos",
  },
  pandas: {
    usageLabel: "Base de manipulação de dados em ciência de dados Python",
    sourceName: "Curadoria BORA NA TECH?",
    sourceNote: "Sem linha exclusiva entre os Top Frameworks no Stack Overflow 2025",
  },
  numpy: {
    usageLabel: "Base numérica indispensável em ciência de dados Python",
    sourceName: "Curadoria BORA NA TECH?",
    sourceNote: "Indicador qualitativo; Pandas figura entre as libs mais usadas em ciência de dados",
  },
  tensorflow: {
    usageLabel: "Framework de ML clássico do Google, ainda presente em produção",
    sourceName: "Curadoria BORA NA TECH?",
    sourceNote: "Sem linha exclusiva entre os Top Frameworks no Stack Overflow 2025",
  },
  pytorch: {
    usageLabel: "Framework de ML muito citado em pesquisa e indústria",
    sourceName: "Curadoria BORA NA TECH?",
    sourceNote: "Sem linha exclusiva no Top Frameworks do Stack Overflow 2025; PyTorch domina o ecossistema acadêmico",
  },
  spark: {
    usageLabel: "Processamento distribuído em engenharia de dados",
    sourceName: "Curadoria BORA NA TECH?",
    sourceNote: "Sem linha exclusiva entre os Top Frameworks no Stack Overflow 2025",
  },
  terraform: { usageLabel: "IaC de referência em cloud e plataformas", sourceName: "HashiCorp / ecossistema cloud", sourceUrl: "https://www.terraform.io/", sourceNote: "Indicador qualitativo de adoção em DevOps" },
  ansible: { usageLabel: "Automação de servidores e configuração sem agente pesado", sourceName: "Red Hat Ansible", sourceUrl: "https://www.ansible.com/", sourceNote: "Indicador qualitativo em operações" },
  "github-actions": { usageLabel: "CI/CD integrado ao GitHub, muito usado em repos open source e empresas", sourceName: "GitHub Docs", sourceUrl: "https://docs.github.com/actions", sourceNote: "Indicador qualitativo; Git aparece com alta penetração no Octoverse" },
  jenkins: { usageLabel: "CI clássico ainda presente em corporações", sourceName: "Jenkins", sourceUrl: "https://www.jenkins.io/", sourceNote: "Indicador qualitativo; muitos times migram para SaaS de CI" },
  prometheus: { usageLabel: "Métricas e alertas padrão em ambientes Kubernetes", sourceName: "Prometheus", sourceUrl: "https://prometheus.io/", sourceNote: "Indicador qualitativo em observabilidade" },
  grafana: { usageLabel: "Dashboards e visualização em SRE e plataformas", sourceName: "Grafana Labs", sourceUrl: "https://grafana.com/", sourceNote: "Indicador qualitativo; frequentemente com Prometheus" },
  kafka: { usageLabel: "Streaming e filas de alto volume em arquiteturas distribuídas", sourceName: "Apache Kafka", sourceUrl: "https://kafka.apache.org/", sourceNote: "Indicador qualitativo em engenharia de dados e eventos" },
  rabbitmq: { usageLabel: "Message broker amplamente usado em filas e microserviços", sourceName: "RabbitMQ", sourceUrl: "https://www.rabbitmq.com/", sourceNote: "Indicador qualitativo" },
  elasticsearch: { usageLabel: "Busca e logs em grande escala; stack ELK comum", sourceName: "Elastic", sourceUrl: "https://www.elastic.co/elasticsearch/", sourceNote: "Indicador qualitativo" },
  "power-bi": { usageLabel: "BI self-service muito comum em dados e negócios", sourceName: "Microsoft Power BI", sourceUrl: "https://powerbi.microsoft.com/", sourceNote: "Indicador qualitativo; mercado corporativo forte" },
  figma: { usageLabel: "Ferramenta de design amplamente usada em times de produto", sourceName: "Figma Customers", sourceUrl: "https://www.figma.com/customers/", sourceNote: "Figma divulga estudos de caso de clientes publicamente" },
  git: {
    usageLabel: "1,12 bilhão de contribuições a repositórios públicos e open source em 2025",
    ...octoverse,
    sourceNote: "Octoverse 2025: 13% de crescimento ano a ano; TypeScript ultrapassou Python e JavaScript no GitHub",
  },
  linux: { usageLabel: "Base comum em servidores, cloud e DevOps", sourceName: "The Linux Foundation", sourceUrl: "https://www.linuxfoundation.org/", sourceNote: "Ecossistema aberto mantido por uma fundação pública" },
};

// ---------- Categorias do Survey 2025 que não têm correspondente direto na
//            tabela `technologies` do Supabase. Renderizam em blocos separados
//            na página de ranking pra dar contexto completo da pesquisa.

export interface SurveyRow {
  name: string;
  usagePercent: number;
}

export const surveyExtras = {
  languages: [
    { name: "Bash/Shell", usagePercent: 48.7 },
    { name: "C++", usagePercent: 23.5 },
    { name: "PowerShell", usagePercent: 23.2 },
    { name: "C", usagePercent: 22 },
  ] as SurveyRow[],
  databases: [
    { name: "SQLite", usagePercent: 37.5 },
    { name: "Microsoft SQL Server", usagePercent: 30.1 },
    { name: "MariaDB", usagePercent: 22.5 },
  ] as SurveyRow[],
  tools: [
    { name: "npm", usagePercent: 56.8 },
    { name: "Pip", usagePercent: 40.9 },
  ] as SurveyRow[],
  frameworksWeb: [
    { name: "jQuery", usagePercent: 23.4 },
    { name: "ASP.NET Core", usagePercent: 19.7 },
    { name: "Flask", usagePercent: 14.4 },
    { name: "Laravel", usagePercent: 8.9 },
  ] as SurveyRow[],
  ides: [
    { name: "VS Code", usagePercent: 75.9 },
    { name: "Visual Studio", usagePercent: 29 },
    { name: "Notepad++", usagePercent: 27.4 },
    { name: "IntelliJ IDEA", usagePercent: 27.1 },
    { name: "Vim", usagePercent: 24.3 },
    { name: "Cursor", usagePercent: 17.9 },
    { name: "PyCharm", usagePercent: 15 },
    { name: "Android Studio", usagePercent: 15 },
  ] as SurveyRow[],
};

export const mostAdmiredLanguages: SurveyRow[] = [
  { name: "Rust", usagePercent: 72 },
  { name: "Gleam", usagePercent: 70 },
  { name: "Elixir", usagePercent: 66 },
  { name: "Zig", usagePercent: 64 },
];

export const mostDesiredLanguages = ["Python", "TypeScript", "Rust", "Go"];
