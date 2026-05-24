import { usageEvidence } from "./surveyData2025";

export type TechnologyCategory = "Linguagens" | "Frameworks" | "Banco de Dados" | "Ferramentas" | "Cloud" | "DevOps";
export type DemandLevel = "Alta" | "Média" | "Baixa";
export type DifficultyLabel = "Iniciante" | "Intermediário" | "Avançado";

export interface Technology {
  slug: string;
  name: string;
  icon: string;
  logoUrl: string;
  category: TechnologyCategory;
  description: string;
  difficulty: DifficultyLabel;
  difficultyScore: number;
  demand: DemandLevel;
  salaryRange: string;
  usagePercent?: number;
  usageLabel?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceNote?: string;
  areas: string[];
  useCases: string[];
  learningPath: string[];
  dailyTip: string;
  combinesWith: string[];
  tools: string[];
  courses: string[];
  companies: string[];
  games?: string[];
  jobs: number;
  weeklyChange: number;
}

const byCategory: Record<TechnologyCategory, string[]> = {
  Linguagens: ["HTML", "CSS", "JavaScript", "TypeScript", "Python", "Java", "PHP", "Go", "Rust", "C#", "SQL", "Swift", "Kotlin", "R"],
  Frameworks: [
    "React",
    "Vue.js",
    "Angular",
    "Next.js",
    "Node.js",
    "Tailwind CSS",
    "Sass",
    "Express.js",
    "FastAPI",
    "Django",
    "Spring Boot",
    "React Native",
    "Flutter",
    "Redux",
    "Spark",
    "Pandas",
    "TensorFlow",
    "PyTorch",
    "NumPy",
    "GraphQL",
  ],
  "Banco de Dados": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch"],
  Ferramentas: [
    "Git",
    "Linux",
    "Figma",
    "Vite",
    "Cypress",
    "Playwright",
    "Power BI",
    "Webpack",
    "Storybook",
  ],
  Cloud: ["AWS", "Google Cloud", "Azure"],
  DevOps: [
    "Docker",
    "Kubernetes",
    "Terraform",
    "Ansible",
    "GitHub Actions",
    "Jenkins",
    "Prometheus",
    "Grafana",
    "Kafka",
    "RabbitMQ",
  ],
};

const areaMap: Record<string, string[]> = {
  HTML: ["frontend"],
  CSS: ["frontend", "uxui"],
  JavaScript: ["frontend", "backend", "mobile"],
  TypeScript: ["frontend", "backend", "mobile"],
  React: ["frontend"],
  "Vue.js": ["frontend"],
  Angular: ["frontend"],
  "Next.js": ["frontend", "backend"],
  "Tailwind CSS": ["frontend", "uxui"],
  Sass: ["frontend", "uxui"],
  Vite: ["frontend", "devops"],
  Redux: ["frontend"],
  Webpack: ["frontend", "devops"],
  Storybook: ["frontend", "qa", "uxui"],
  Python: ["backend", "dados", "ia", "qa"],
  "Node.js": ["backend", "frontend"],
  "Express.js": ["backend"],
  Java: ["backend", "mobile"],
  PHP: ["backend"],
  FastAPI: ["backend", "dados", "ia"],
  Django: ["backend", "dados"],
  "Spring Boot": ["backend", "mobile"],
  Go: ["backend", "devops"],
  Rust: ["backend", "ciberseguranca"],
  "C#": ["backend"],
  SQL: ["backend", "dados"],
  GraphQL: ["backend", "frontend", "mobile"],
  PostgreSQL: ["backend", "dados"],
  MySQL: ["backend", "dados"],
  MongoDB: ["backend", "dados"],
  Redis: ["backend", "devops"],
  Elasticsearch: ["backend", "dados", "devops"],
  Docker: ["devops", "backend", "cloud"],
  Kubernetes: ["devops", "cloud"],
  Terraform: ["devops", "cloud"],
  Ansible: ["devops", "cloud"],
  "GitHub Actions": ["devops", "cloud"],
  Jenkins: ["devops", "qa"],
  Prometheus: ["devops", "cloud"],
  Grafana: ["devops", "cloud"],
  Kafka: ["backend", "devops", "dados"],
  RabbitMQ: ["backend", "devops"],
  Cypress: ["qa", "frontend"],
  Playwright: ["qa", "frontend", "backend"],
  AWS: ["cloud", "devops"],
  "Google Cloud": ["cloud", "dados", "ia"],
  Azure: ["cloud", "devops"],
  Git: ["frontend", "backend", "dados", "mobile", "devops", "qa"],
  Linux: ["devops", "cloud", "ciberseguranca", "backend"],
  Figma: ["uxui", "frontend", "produto"],
  "Power BI": ["dados", "produto"],
  Flutter: ["mobile"],
  "React Native": ["mobile", "frontend"],
  Swift: ["mobile"],
  Kotlin: ["mobile"],
  R: ["dados"],
  Spark: ["dados"],
  Pandas: ["dados", "ia"],
  NumPy: ["dados", "ia"],
  TensorFlow: ["ia", "dados"],
  PyTorch: ["ia", "dados"],
};

const difficulties: Record<string, DifficultyLabel> = {
  HTML: "Iniciante",
  CSS: "Iniciante",
  JavaScript: "Iniciante",
  Git: "Iniciante",
  Figma: "Iniciante",
  SQL: "Iniciante",
  Python: "Iniciante",
  TypeScript: "Intermediário",
  React: "Intermediário",
  "Vue.js": "Intermediário",
  "Node.js": "Intermediário",
  "Express.js": "Intermediário",
  "React Native": "Intermediário",
  FastAPI: "Intermediário",
  Django: "Intermediário",
  "Spring Boot": "Avançado",
  GraphQL: "Intermediário",
  "Tailwind CSS": "Iniciante",
  Sass: "Iniciante",
  Vite: "Iniciante",
  Redux: "Intermediário",
  Cypress: "Intermediário",
  Playwright: "Intermediário",
  "Power BI": "Iniciante",
  Prometheus: "Avançado",
  Grafana: "Intermediário",
  Kafka: "Avançado",
  RabbitMQ: "Intermediário",
  Elasticsearch: "Avançado",
  Ansible: "Intermediário",
  Terraform: "Avançado",
  "GitHub Actions": "Intermediário",
  Jenkins: "Intermediário",
  Webpack: "Intermediário",
  Storybook: "Iniciante",
  Docker: "Intermediário",
  Linux: "Intermediário",
  PostgreSQL: "Intermediário",
  MySQL: "Intermediário",
  MongoDB: "Intermediário",
  Angular: "Intermediário",
  "Next.js": "Intermediário",
  Java: "Intermediário",
  PHP: "Intermediário",
  Flutter: "Intermediário",
  Swift: "Intermediário",
  Kotlin: "Intermediário",
  Pandas: "Intermediário",
  AWS: "Avançado",
  Azure: "Avançado",
  "Google Cloud": "Avançado",
  Kubernetes: "Avançado",
  Go: "Avançado",
  Rust: "Avançado",
  Spark: "Avançado",
  TensorFlow: "Avançado",
  NumPy: "Intermediário",
  PyTorch: "Avançado",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace("#", "sharp")
    .replace(/\./g, "")
    .replace(/\s+/g, "-");
}

function categoryFor(name: string): TechnologyCategory {
  return (Object.keys(byCategory) as TechnologyCategory[]).find((category) => byCategory[category].includes(name)) || "Ferramentas";
}

function difficultyScore(label: DifficultyLabel) {
  return label === "Iniciante" ? 2 : label === "Intermediário" ? 3 : 5;
}

const names = [
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "React",
  "Vue.js",
  "Angular",
  "Next.js",
  "Python",
  "Node.js",
  "Java",
  "PHP",
  "Go",
  "Rust",
  "C#",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "Google Cloud",
  "Azure",
  "Git",
  "Linux",
  "Figma",
  "Flutter",
  "Swift",
  "Kotlin",
  "R",
  "Spark",
  "Pandas",
  "TensorFlow",
  "Tailwind CSS",
  "Sass",
  "Vite",
  "Express.js",
  "FastAPI",
  "Django",
  "Spring Boot",
  "React Native",
  "GraphQL",
  "Redux",
  "Webpack",
  "Storybook",
  "Cypress",
  "Playwright",
  "Terraform",
  "Ansible",
  "GitHub Actions",
  "Jenkins",
  "Prometheus",
  "Grafana",
  "Kafka",
  "RabbitMQ",
  "Elasticsearch",
  "Power BI",
  "NumPy",
  "PyTorch",
];

const logoUrls: Record<string, string> = {
  HTML: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
  CSS: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
  JavaScript: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
  TypeScript: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
  React: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  "Vue.js": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg",
  Angular: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg",
  "Next.js": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
  Python: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  "Node.js": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
  Java: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
  PHP: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg",
  Go: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg",
  Rust: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg",
  "C#": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg",
  SQL: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azuresqldatabase/azuresqldatabase-original.svg",
  PostgreSQL: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
  MySQL: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
  MongoDB: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg",
  Redis: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg",
  Docker: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
  Kubernetes: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-original.svg",
  AWS: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg",
  "Google Cloud": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg",
  Azure: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg",
  Git: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
  Linux: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
  Figma: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
  Flutter: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg",
  Swift: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg",
  Kotlin: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg",
  R: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/r/r-original.svg",
  Spark: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apachespark/apachespark-original.svg",
  Pandas: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg",
  TensorFlow: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg",
  "Tailwind CSS": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg",
  Sass: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sass/sass-original.svg",
  Vite: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg",
  "Express.js": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg",
  FastAPI: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg",
  Django: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg",
  "Spring Boot": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg",
  "React Native": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  GraphQL: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg",
  Redux: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redux/redux-original.svg",
  Webpack: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/webpack/webpack-original.svg",
  Storybook: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/storybook/storybook-original.svg",
  Cypress: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cypressio/cypressio-plain.svg",
  Playwright: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/playwright/playwright-plain.svg",
  Terraform: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/terraform/terraform-original.svg",
  Ansible: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ansible/ansible-original.svg",
  "GitHub Actions": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
  Jenkins: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg",
  Prometheus: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prometheus/prometheus-original.svg",
  Grafana: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/grafana/grafana-original.svg",
  Kafka: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apachekafka/apachekafka-original.svg",
  RabbitMQ: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rabbitmq/rabbitmq-original.svg",
  Elasticsearch: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/elasticsearch/elasticsearch-original.svg",
  "Power BI": "https://www.google.com/s2/favicons?domain=powerbi.microsoft.com&sz=128",
  NumPy: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/numpy/numpy-original.svg",
  PyTorch: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg",
};


const notableCompanies: Record<string, string[]> = {
  HTML: ["Google", "Wikipedia", "Netflix"],
  CSS: ["Airbnb", "GitHub", "Spotify"],
  JavaScript: ["Netflix", "PayPal", "LinkedIn"],
  TypeScript: ["Slack", "Airbnb", "Microsoft"],
  React: ["Meta", "Instagram", "Netflix"],
  "Vue.js": ["GitLab", "Alibaba", "Laravel"],
  Angular: ["Google", "Microsoft", "Deutsche Bank"],
  "Next.js": ["Vercel", "Twitch", "TikTok"],
  Python: ["Instagram", "Spotify", "Dropbox"],
  "Node.js": ["Netflix", "PayPal", "LinkedIn"],
  Java: ["Netflix", "LinkedIn", "Android"],
  PHP: ["WordPress", "Wikipedia", "Meta"],
  Go: ["Google", "Uber", "Twitch"],
  Rust: ["Mozilla", "Cloudflare", "Dropbox"],
  "C#": ["Microsoft", "Unity", "Stack Overflow"],
  SQL: ["Shopify", "Uber", "Airbnb"],
  PostgreSQL: ["GitLab", "Supabase", "Instagram"],
  MySQL: ["WordPress", "YouTube", "Booking.com"],
  MongoDB: ["Forbes", "Toyota Connected", "Coinbase"],
  Redis: ["GitHub", "Twitter/X", "Pinterest"],
  Docker: ["Spotify", "PayPal", "ADP"],
  Kubernetes: ["Google", "Spotify", "Pinterest"],
  AWS: ["Netflix", "Airbnb", "NASA"],
  "Google Cloud": ["Spotify", "Snap", "Twitter/X"],
  Azure: ["Microsoft", "Adobe", "BMW"],
  Git: ["Linux kernel", "GitHub", "GitLab"],
  Linux: ["Google", "Meta", "Amazon"],
  Figma: ["Microsoft", "Dropbox", "Netflix"],
  Flutter: ["Google Pay", "BMW", "Alibaba"],
  Swift: ["Apple", "Airbnb", "Lyft"],
  Kotlin: ["Google", "Pinterest", "Trello"],
  R: ["RStudio/Posit", "New York Times", "Google"],
  Spark: ["Databricks", "Netflix", "Uber"],
  Pandas: ["Jupyter", "Anaconda", "Kaggle"],
  TensorFlow: ["Google", "Airbnb", "Twitter/X"],
  "Tailwind CSS": ["Vercel", "Shopify", "GitHub"],
  Sass: ["Airbnb", "Netflix", "Atlassian"],
  Vite: ["Vercel", "Shopify", "Cloudflare"],
  "Express.js": ["IBM", "Uber", "Accenture"],
  FastAPI: ["Microsoft", "Netflix", "Klarna"],
  Django: ["Instagram", "Pinterest", "Mozilla"],
  "Spring Boot": ["Alibaba", "Intuit", "JPMorgan Chase"],
  "React Native": ["Meta", "Bloomberg", "Coinbase"],
  GraphQL: ["Meta", "GitHub", "Shopify"],
  Redux: ["Slack", "Patagonia", "Instacart"],
  Webpack: ["Airbnb", "Pinterest", "TikTok"],
  Storybook: ["Monday.com", "Adobe", "BBC"],
  Cypress: ["Slack", "NASA", "GoDaddy"],
  Playwright: ["Microsoft", "Disney", "Adobe"],
  Terraform: ["Slack", "Datadog", "New Relic"],
  Ansible: ["Red Hat", "NASA", "Cisco"],
  "GitHub Actions": ["Microsoft", "Stripe", "Mozilla"],
  Jenkins: ["Sony", "Accenture", "LinkedIn"],
  Prometheus: ["Docker", "DigitalOcean", "Ericsson"],
  Grafana: ["Samsung", "JP Morgan", "Comcast"],
  Kafka: ["LinkedIn", "Netflix", "Uber"],
  RabbitMQ: ["T-Mobile", "Zalando", "WeWork"],
  Elasticsearch: ["Uber", "Goldman Sachs", "Walmart"],
  NumPy: ["OpenAI", "NASA", "Spotify"],
  PyTorch: ["Microsoft", "Meta", "Uber"],
  "Power BI": ["PepsiCo", "Metro", "Heineken"],
};

const notableGames: Record<string, string[]> = {
  Java: ["Minecraft: Java Edition"],
  "C#": ["Among Us", "Hollow Knight", "Cuphead"],
  JavaScript: ["Vampire Survivors"],
  Lua: ["Roblox"],
};

export const technologies: Technology[] = names.map((name, index) => {
  const category = categoryFor(name);
  const difficulty = difficulties[name] || "Intermediário";
  const jobs = Math.max(140, Math.round(6400 - index * 103));
  const evidence = usageEvidence[slugify(name)];
  return {
    slug: slugify(name),
    name,
    icon: name.slice(0, 2).toUpperCase(),
    logoUrl: logoUrls[name] ?? "",
    category,
    description: `${name} é usada para construir produtos digitais, resolver problemas reais e acelerar entregas em times de tecnologia.`,
    difficulty,
    difficultyScore: difficultyScore(difficulty),
    demand: index < 22 ? "Alta" : index < 44 ? "Média" : "Baixa",
    salaryRange: difficulty === "Avançado" ? "R$ 6.000 a R$ 14.000" : difficulty === "Intermediário" ? "R$ 4.000 a R$ 10.000" : "R$ 2.500 a R$ 6.000",
    usagePercent: evidence?.usagePercent,
    usageLabel: evidence?.usageLabel,
    sourceName: evidence?.sourceName,
    sourceUrl: evidence?.sourceUrl,
    sourceNote: evidence?.sourceNote,
    areas: areaMap[name] || ["frontend"],
    useCases: [
      `Criar soluções com ${name} em projetos reais`,
      "Trabalhar em produtos digitais com times multidisciplinares",
      "Resolver problemas de negócio com tecnologia aplicada",
    ],
    learningPath: [
      "Entenda o problema que a tecnologia resolve",
      "Faça um curso introdutório curto",
      "Construa um projeto pequeno e publique",
      "Leia documentação oficial aos poucos",
      "Combine com tecnologias complementares",
    ],
    dailyTip: `Use ${name} em um projeto simples antes de tentar dominar todos os recursos.`,
    combinesWith: names.filter((item) => item !== name).slice(index % 10, (index % 10) + 4).map(slugify),
    tools: ["VS Code", "GitHub", "Documentação oficial", "Comunidade"],
    courses: ["Curso em Vídeo", "freeCodeCamp", "Documentação oficial", "YouTube"],
    companies: notableCompanies[name] || ["GitHub", "Stack Overflow", "Comunidades open source"],
    games: notableGames[name],
    jobs,
    weeklyChange: index % 3 === 0 ? 12 : index % 3 === 1 ? 4 : -3,
  };
});

export const technologyCategories = ["Todas", "Linguagens", "Frameworks", "Banco de Dados", "Ferramentas", "Cloud", "DevOps"];

export const technologyRanking = technologies
  .slice()
  .sort((a, b) => {
    const pct = (b.usagePercent || 0) - (a.usagePercent || 0);
    if (pct !== 0) return pct;
    return b.jobs - a.jobs;
  })
  .map((technology, index) => ({ position: index + 1, ...technology }));

export const technologiesByArea = areaMap;
