import { TECH_AREA_MAP } from "@shared/techAreas";
import { slugify } from "./slugify";
import { usageEvidence } from "./surveyData2025";

export type TechnologyCategory =
  | "Linguagens"
  | "Frameworks"
  | "Banco de Dados"
  | "Ferramentas"
  | "Cloud"
  | "DevOps"
  | "Dados e IA"
  | "Segurança"
  | "Testes"
  | "Design"
  | "Gestão";
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
}

const byCategory: Record<TechnologyCategory, string[]> = {
  Linguagens: [
    "HTML",
    "CSS",
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "PHP",
    "Go",
    "Rust",
    "C#",
    "SQL",
    "Swift",
    "Kotlin",
    "R",
    "C++",
    "C",
    "Lua",
    "Solidity",
    "Ruby",
    "Dart",
    "Scala",
    "Julia",
    "MATLAB",
    "COBOL",
    "Fortran",
    "Assembly",
    "Ada",
    "Visual Basic",
    "Objective-C",
    "Elixir",
    "Erlang",
    "Haskell",
    "Clojure",
    "F#",
    "Groovy",
    "Bash",
    "PowerShell",
    "Perl",
  ],
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
    "GraphQL",
    "Unity",
    "Unreal Engine",
    "Godot",
    "Svelte",
    "Nuxt",
    "Astro",
    "SolidJS",
    "Bootstrap",
    "Material UI",
    "NestJS",
    "Flask",
    "Laravel",
    "Ruby on Rails",
    "ASP.NET Core",
    "Phoenix",
    "Quarkus",
    "SwiftUI",
    "Jetpack Compose",
    "Ionic",
    ".NET MAUI",
  ],
  "Banco de Dados": [
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "Elasticsearch",
    "Snowflake",
    "MariaDB",
    "SQL Server",
    "Oracle",
    "SQLite",
    "Cassandra",
    "DynamoDB",
    "Neo4j",
    "Firebase",
    "Supabase",
  ],
  Ferramentas: [
    "Vite",
    "Webpack",
    "Storybook",
    "Arduino",
    "Looker",
    "Gradle",
    "Visual Studio Code",
    "IntelliJ IDEA",
    "Maven",
    "npm",
    "ESLint",
    "Prettier",
  ],
  Cloud: [
    "AWS",
    "Google Cloud",
    "Azure",
    "IBM Cloud",
    "DigitalOcean",
    "Cloudflare",
    "Vercel",
    "Netlify",
    "Heroku",
    "Railway",
    "Render",
    "Oracle Cloud",
    "Alibaba Cloud",
  ],
  DevOps: [
    "Docker",
    "Kubernetes",
    "Terraform",
    "Ansible",
    "GitHub Actions",
    "Jenkins",
    "Prometheus",
    "Grafana",
    "RabbitMQ",
    "Git",
    "Linux",
    "GitLab CI",
    "Nginx",
    "Windows Server",
    "Unix",
    "VMware",
    "Helm",
    "ArgoCD",
    "Datadog",
    "Apache Tomcat",
  ],
  "Dados e IA": [
    "Pandas",
    "Databricks",
    "NumPy",
    "TensorFlow",
    "PyTorch",
    "Spark",
    "dbt",
    "Power BI",
    "Tableau",
    "Kafka",
    "Apache Airflow",
    "scikit-learn",
    "Keras",
    "Hadoop",
    "Jupyter",
    "Hugging Face",
    "LangChain",
  ],
  Segurança: [
    "Kali Linux",
    "Wireshark",
    "Nmap",
    "Burp Suite",
    "Metasploit",
    "OWASP ZAP",
    "Nessus",
    "Snyk",
    "HashiCorp Vault",
    "John the Ripper",
    "Aircrack-ng",
    "OpenVAS",
    "Splunk",
  ],
  Testes: [
    "Cypress",
    "Playwright",
    "Jest",
    "Vitest",
    "Selenium",
    "JUnit",
    "PyTest",
    "Postman",
    "Testing Library",
    "Puppeteer",
    "Mocha",
    "Cucumber",
    "k6",
    "Insomnia",
  ],
  Design: [
    "Figma",
    "Adobe XD",
    "Sketch",
    "Canva",
    "Adobe Photoshop",
    "Adobe Illustrator",
    "Adobe After Effects",
    "Blender",
    "InVision",
    "Framer",
    "Miro",
  ],
  Gestão: [
    "Jira",
    "Trello",
    "Notion",
    "Confluence",
    "Asana",
    "Slack",
    "Microsoft Teams",
    "Monday.com",
    "ClickUp",
    "Linear",
    "Azure DevOps",
    "Basecamp",
  ],
};

// Fonte única em shared/techAreas.ts (TECH_AREA_MAP), reusada pelo servidor.
const areaMap: Record<string, string[]> = {
  ...TECH_AREA_MAP,
  Cloudflare: ["cloud", "ciberseguranca"],
  Databricks: ["dados", "ia", "cloud"],
  Gradle: ["backend", "mobile", "devops"],
  // Automacao industrial: mapeadas aqui (client-only) de proposito, para NAO
  // entrar no TECH_AREA_MAP compartilhado e poluir o vocabulario do analisador
  // de LinkedIn (server/lib/skillNormalize.ts), cujas 22 areas nao incluem
  // automacao-industrial.
  CLP: ["automacao-industrial", "iot"],
  SCADA: ["automacao-industrial", "iot"],
  Modbus: ["automacao-industrial", "iot"],
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
  Unity: "Intermediário",
  "Unreal Engine": "Avançado",
  Godot: "Intermediário",
  "C++": "Avançado",
  Lua: "Iniciante",
  Solidity: "Avançado",
  C: "Intermediário",
  Arduino: "Iniciante",
  "Apache Airflow": "Avançado",
  dbt: "Intermediário",
  Snowflake: "Intermediário",
  Tableau: "Iniciante",
  Looker: "Intermediário",
  Jira: "Iniciante",
  Trello: "Iniciante",
  Notion: "Iniciante",
  Confluence: "Iniciante",
  Ruby: "Iniciante",
  Dart: "Iniciante",
  "Visual Basic": "Iniciante",
  Bash: "Iniciante",
  PowerShell: "Iniciante",
  Perl: "Iniciante",
  Bootstrap: "Iniciante",
  "Material UI": "Iniciante",
  Flask: "Iniciante",
  SQLite: "Iniciante",
  Firebase: "Iniciante",
  Supabase: "Iniciante",
  Jupyter: "Iniciante",
  Postman: "Iniciante",
  Jest: "Iniciante",
  Vitest: "Iniciante",
  Canva: "Iniciante",
  Sketch: "Iniciante",
  "Adobe XD": "Iniciante",
  Asana: "Iniciante",
  COBOL: "Avançado",
  Fortran: "Avançado",
  Assembly: "Avançado",
  Ada: "Avançado",
  Haskell: "Avançado",
  Erlang: "Avançado",
  Clojure: "Avançado",
  Scala: "Avançado",
  "F#": "Avançado",
  Quarkus: "Avançado",
  Cassandra: "Avançado",
  Oracle: "Avançado",
  "SQL Server": "Avançado",
  DynamoDB: "Avançado",
  Neo4j: "Avançado",
  Hadoop: "Avançado",
  "Hugging Face": "Avançado",
  LangChain: "Avançado",
  "Kali Linux": "Avançado",
  Metasploit: "Avançado",
  "Burp Suite": "Avançado",
  Nmap: "Avançado",
  "OWASP ZAP": "Avançado",
  Selenium: "Avançado",
  Cloudflare: "Intermediário",
  Databricks: "Avançado",
  Gradle: "Intermediário",
};

// slugify vive em slugify.ts (util puro) para a home nao arrastar este
// arquivo pro boot; reexportado para os consumidores existentes.
export { slugify };

function categoryFor(name: string): TechnologyCategory {
  return (
    (Object.keys(byCategory) as TechnologyCategory[]).find((category) =>
      byCategory[category].includes(name),
    ) || "Ferramentas"
  );
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
  "Unity",
  "Unreal Engine",
  "Godot",
  "C++",
  "Lua",
  "Solidity",
  "C",
  "Arduino",
  "Apache Airflow",
  "dbt",
  "Snowflake",
  "Tableau",
  "Looker",
  "Jira",
  "Trello",
  "Notion",
  "Confluence",
  "Ruby",
  "Dart",
  "Scala",
  "Julia",
  "MATLAB",
  "COBOL",
  "Fortran",
  "Assembly",
  "Ada",
  "Visual Basic",
  "Objective-C",
  "Elixir",
  "Erlang",
  "Haskell",
  "Clojure",
  "F#",
  "Groovy",
  "Bash",
  "PowerShell",
  "Perl",
  "Svelte",
  "Nuxt",
  "Astro",
  "SolidJS",
  "Bootstrap",
  "Material UI",
  "NestJS",
  "Flask",
  "Laravel",
  "Ruby on Rails",
  "ASP.NET Core",
  "Phoenix",
  "Quarkus",
  "SwiftUI",
  "Jetpack Compose",
  "Ionic",
  ".NET MAUI",
  "MariaDB",
  "SQL Server",
  "Oracle",
  "SQLite",
  "Cassandra",
  "DynamoDB",
  "Neo4j",
  "Firebase",
  "Supabase",
  "scikit-learn",
  "Keras",
  "Hadoop",
  "Jupyter",
  "Hugging Face",
  "LangChain",
  "IBM Cloud",
  "DigitalOcean",
  "GitLab CI",
  "Nginx",
  "Windows Server",
  "Unix",
  "VMware",
  "Kali Linux",
  "Wireshark",
  "Nmap",
  "Burp Suite",
  "Metasploit",
  "OWASP ZAP",
  "Jest",
  "Vitest",
  "Selenium",
  "JUnit",
  "PyTest",
  "Postman",
  "Adobe XD",
  "Sketch",
  "Canva",
  "Asana",
  "Cloudflare",
  "Databricks",
  "Gradle",
  // Novas (preenchendo categorias magras). A categoria vem de byCategory
  // abaixo; sem logo em logoUrls -> fallback de iniciais.
  "Vercel",
  "Netlify",
  "Heroku",
  "Railway",
  "Render",
  "Oracle Cloud",
  "Alibaba Cloud",
  "Adobe Photoshop",
  "Adobe Illustrator",
  "Adobe After Effects",
  "Blender",
  "InVision",
  "Framer",
  "Miro",
  "Slack",
  "Microsoft Teams",
  "Monday.com",
  "ClickUp",
  "Linear",
  "Azure DevOps",
  "Basecamp",
  "Nessus",
  "Snyk",
  "HashiCorp Vault",
  "John the Ripper",
  "Aircrack-ng",
  "OpenVAS",
  "Splunk",
  "Testing Library",
  "Puppeteer",
  "Mocha",
  "Cucumber",
  "k6",
  "Insomnia",
  "Visual Studio Code",
  "IntelliJ IDEA",
  "Maven",
  "npm",
  "ESLint",
  "Prettier",
  "Helm",
  "ArgoCD",
  "Datadog",
  "Apache Tomcat",
  "CLP",
  "SCADA",
  "Modbus",
];

const logoUrls: Record<string, string> = {
  HTML: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
  CSS: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
  JavaScript:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
  TypeScript:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
  React:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  "Vue.js":
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg",
  Angular:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg",
  "Next.js":
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
  Python:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  "Node.js":
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
  Java: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
  PHP: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg",
  Go: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg",
  Rust: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg",
  "C#": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg",
  SQL: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azuresqldatabase/azuresqldatabase-original.svg",
  PostgreSQL:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
  MySQL:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
  MongoDB:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg",
  Redis:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg",
  Docker:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
  Kubernetes:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-original.svg",
  AWS: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg",
  "Google Cloud":
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg",
  Azure:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg",
  Git: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
  Linux:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
  Figma:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
  Flutter:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg",
  Swift:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg",
  Kotlin:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg",
  R: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/r/r-original.svg",
  Spark:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apachespark/apachespark-original.svg",
  Pandas:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg",
  TensorFlow:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg",
  "Tailwind CSS":
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg",
  Sass: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sass/sass-original.svg",
  Vite: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg",
  "Express.js":
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg",
  FastAPI:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg",
  Django:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg",
  "Spring Boot":
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg",
  "React Native":
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  GraphQL:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg",
  Redux:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redux/redux-original.svg",
  Webpack:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/webpack/webpack-original.svg",
  Storybook:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/storybook/storybook-original.svg",
  Cypress:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cypressio/cypressio-plain.svg",
  Playwright:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/playwright/playwright-plain.svg",
  Terraform:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/terraform/terraform-original.svg",
  Ansible:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ansible/ansible-original.svg",
  "GitHub Actions":
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
  Jenkins:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg",
  Prometheus:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prometheus/prometheus-original.svg",
  Grafana:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/grafana/grafana-original.svg",
  Kafka:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apachekafka/apachekafka-original.svg",
  RabbitMQ:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rabbitmq/rabbitmq-original.svg",
  Elasticsearch:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/elasticsearch/elasticsearch-original.svg",
  "Power BI":
    "https://www.google.com/s2/favicons?domain=powerbi.microsoft.com&sz=128",
  NumPy:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/numpy/numpy-original.svg",
  PyTorch:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg",
  Unity:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/unity/unity-original.svg",
  "Unreal Engine":
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/unrealengine/unrealengine-original.svg",
  Godot:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/godot/godot-original.svg",
  "C++":
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
  Lua: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/lua/lua-original.svg",
  Solidity:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/solidity/solidity-original.svg",
  C: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg",
  Arduino:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/arduino/arduino-original.svg",
  "Apache Airflow":
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apacheairflow/apacheairflow-original.svg",
  dbt: "https://www.google.com/s2/favicons?domain=getdbt.com&sz=128",
  Snowflake: "https://www.google.com/s2/favicons?domain=snowflake.com&sz=128",
  Tableau: "https://www.google.com/s2/favicons?domain=tableau.com&sz=128",
  Looker: "https://www.google.com/s2/favicons?domain=looker.com&sz=128",
  Jira: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jira/jira-original.svg",
  Trello:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/trello/trello-original.svg",
  Notion:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/notion/notion-original.svg",
  Confluence:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/confluence/confluence-original.svg",
  ".NET MAUI":
    "https://www.google.com/s2/favicons?domain=dotnet.microsoft.com&sz=128",
  "ASP.NET Core":
    "https://www.google.com/s2/favicons?domain=dotnet.microsoft.com&sz=128",
  Ada: "https://www.google.com/s2/favicons?domain=adacore.com&sz=128",
  "Adobe XD": "https://www.google.com/s2/favicons?domain=adobe.com&sz=128",
  Asana: "https://www.google.com/s2/favicons?domain=asana.com&sz=128",
  Astro: "https://www.google.com/s2/favicons?domain=astro.build&sz=128",
  Bash: "https://www.google.com/s2/favicons?domain=gnu.org&sz=128",
  Bootstrap:
    "https://www.google.com/s2/favicons?domain=getbootstrap.com&sz=128",
  "Burp Suite":
    "https://www.google.com/s2/favicons?domain=portswigger.net&sz=128",
  Canva: "https://www.google.com/s2/favicons?domain=canva.com&sz=128",
  Cassandra:
    "https://www.google.com/s2/favicons?domain=cassandra.apache.org&sz=128",
  Clojure: "https://www.google.com/s2/favicons?domain=clojure.org&sz=128",
  Dart: "https://www.google.com/s2/favicons?domain=dart.dev&sz=128",
  DigitalOcean:
    "https://www.google.com/s2/favicons?domain=digitalocean.com&sz=128",
  DynamoDB: "https://www.google.com/s2/favicons?domain=aws.amazon.com&sz=128",
  Elixir: "https://www.google.com/s2/favicons?domain=elixir-lang.org&sz=128",
  Erlang: "https://www.google.com/s2/favicons?domain=erlang.org&sz=128",
  "F#": "https://www.google.com/s2/favicons?domain=fsharp.org&sz=128",
  Firebase:
    "https://www.google.com/s2/favicons?domain=firebase.google.com&sz=128",
  Flask: "https://www.google.com/s2/favicons?domain=palletsprojects.com&sz=128",
  Fortran: "https://www.google.com/s2/favicons?domain=fortran-lang.org&sz=128",
  "GitLab CI": "https://www.google.com/s2/favicons?domain=gitlab.com&sz=128",
  Groovy: "https://www.google.com/s2/favicons?domain=groovy-lang.org&sz=128",
  Hadoop: "https://www.google.com/s2/favicons?domain=hadoop.apache.org&sz=128",
  Haskell: "https://www.google.com/s2/favicons?domain=haskell.org&sz=128",
  "Hugging Face":
    "https://www.google.com/s2/favicons?domain=huggingface.co&sz=128",
  "IBM Cloud": "https://www.google.com/s2/favicons?domain=ibm.com&sz=128",
  Ionic: "https://www.google.com/s2/favicons?domain=ionicframework.com&sz=128",
  JUnit: "https://www.google.com/s2/favicons?domain=junit.org&sz=128",
  Jest: "https://www.google.com/s2/favicons?domain=jestjs.io&sz=128",
  "Jetpack Compose":
    "https://www.google.com/s2/favicons?domain=developer.android.com&sz=128",
  Julia: "https://www.google.com/s2/favicons?domain=julialang.org&sz=128",
  "Kali Linux": "https://www.google.com/s2/favicons?domain=kali.org&sz=128",
  Keras: "https://www.google.com/s2/favicons?domain=keras.io&sz=128",
  LangChain: "https://www.google.com/s2/favicons?domain=langchain.com&sz=128",
  Laravel: "https://www.google.com/s2/favicons?domain=laravel.com&sz=128",
  MATLAB: "https://www.google.com/s2/favicons?domain=mathworks.com&sz=128",
  MariaDB: "https://www.google.com/s2/favicons?domain=mariadb.org&sz=128",
  "Material UI": "https://www.google.com/s2/favicons?domain=mui.com&sz=128",
  Metasploit:
    "https://www.google.com/s2/favicons?domain=metasploit.com&sz=128",
  Neo4j: "https://www.google.com/s2/favicons?domain=neo4j.com&sz=128",
  NestJS: "https://www.google.com/s2/favicons?domain=nestjs.com&sz=128",
  Nginx: "https://www.google.com/s2/favicons?domain=nginx.org&sz=128",
  Nmap: "https://www.google.com/s2/favicons?domain=nmap.org&sz=128",
  Nuxt: "https://www.google.com/s2/favicons?domain=nuxt.com&sz=128",
  "OWASP ZAP": "https://www.google.com/s2/favicons?domain=zaproxy.org&sz=128",
  "Objective-C":
    "https://www.google.com/s2/favicons?domain=developer.apple.com&sz=128",
  Oracle: "https://www.google.com/s2/favicons?domain=oracle.com&sz=128",
  Perl: "https://www.google.com/s2/favicons?domain=perl.org&sz=128",
  Phoenix:
    "https://www.google.com/s2/favicons?domain=phoenixframework.org&sz=128",
  PowerShell: "https://www.google.com/s2/favicons?domain=microsoft.com&sz=128",
  PyTest: "https://www.google.com/s2/favicons?domain=pytest.org&sz=128",
  Quarkus: "https://www.google.com/s2/favicons?domain=quarkus.io&sz=128",
  Ruby: "https://www.google.com/s2/favicons?domain=ruby-lang.org&sz=128",
  "Ruby on Rails":
    "https://www.google.com/s2/favicons?domain=rubyonrails.org&sz=128",
  "SQL Server": "https://www.google.com/s2/favicons?domain=microsoft.com&sz=128",
  SQLite: "https://www.google.com/s2/favicons?domain=sqlite.org&sz=128",
  Scala: "https://www.google.com/s2/favicons?domain=scala-lang.org&sz=128",
  Selenium: "https://www.google.com/s2/favicons?domain=selenium.dev&sz=128",
  Sketch: "https://www.google.com/s2/favicons?domain=sketch.com&sz=128",
  SolidJS: "https://www.google.com/s2/favicons?domain=solidjs.com&sz=128",
  Supabase: "https://www.google.com/s2/favicons?domain=supabase.com&sz=128",
  Svelte: "https://www.google.com/s2/favicons?domain=svelte.dev&sz=128",
  SwiftUI:
    "https://www.google.com/s2/favicons?domain=developer.apple.com&sz=128",
  VMware: "https://www.google.com/s2/favicons?domain=vmware.com&sz=128",
  "Visual Basic":
    "https://www.google.com/s2/favicons?domain=microsoft.com&sz=128",
  Vitest: "https://www.google.com/s2/favicons?domain=vitest.dev&sz=128",
  "Windows Server":
    "https://www.google.com/s2/favicons?domain=microsoft.com&sz=128",
  Wireshark: "https://www.google.com/s2/favicons?domain=wireshark.org&sz=128",
  "scikit-learn":
    "https://www.google.com/s2/favicons?domain=scikit-learn.org&sz=128",
  Cloudflare:
    "https://www.google.com/s2/favicons?domain=cloudflare.com&sz=128",
  Databricks:
    "https://www.google.com/s2/favicons?domain=databricks.com&sz=128",
  Gradle: "https://www.google.com/s2/favicons?domain=gradle.org&sz=128",
};

// Logos de ferramentas de apoio que não são tecnologias do catálogo principal.
const toolLogoUrls: Record<string, string> = {
  "VS Code":
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg",
  GitHub:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
  npm: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/npm/npm-original-wordmark.svg",
  Postman:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postman/postman-original.svg",
  Jupyter:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jupyter/jupyter-original.svg",
};

// Resolve o nome de uma ferramenta para o que o TechnologyLogo precisa. Reaproveita
// o catálogo de logos das tecnologias e o mapa de ferramentas de apoio; quando não
// há logo, o TechnologyLogo cai no fallback de iniciais.
export function resolveTool(name: string): {
  name: string;
  icon: string;
  logoUrl: string;
} {
  return {
    name,
    icon: name.slice(0, 2).toUpperCase(),
    logoUrl: logoUrls[name] || toolLogoUrls[name] || "",
  };
}

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

// Combinações reais por slug: tecnologias que costumam aparecer juntas na mesma
// stack/ecossistema. Curadoria manual com pares amplamente conhecidos (não há
// número/fato inventado aqui, apenas relações de uso comuns). Slugs precisam
// existir em `names`.
export const combinesWithMap: Record<string, string[]> = {
  html: ["css", "javascript", "react", "tailwind-css"],
  css: ["html", "javascript", "sass", "tailwind-css"],
  javascript: ["html", "css", "typescript", "react", "nodejs"],
  typescript: ["javascript", "react", "nextjs", "nodejs"],
  react: ["typescript", "nextjs", "redux", "tailwind-css"],
  vuejs: ["javascript", "typescript", "vite", "tailwind-css"],
  angular: ["typescript", "nodejs", "sass"],
  nextjs: ["react", "typescript", "tailwind-css", "nodejs"],
  python: ["sql", "django", "fastapi", "pandas"],
  nodejs: ["javascript", "typescript", "expressjs", "mongodb"],
  java: ["spring-boot", "kotlin", "postgresql", "docker"],
  php: ["mysql", "html", "javascript"],
  go: ["docker", "kubernetes", "postgresql"],
  rust: ["cplusplus", "c", "linux"],
  csharp: ["unity", "azure", "sql"],
  sql: ["postgresql", "mysql", "python", "dbt"],
  postgresql: ["sql", "docker", "django", "nodejs"],
  mysql: ["sql", "php", "docker"],
  mongodb: ["nodejs", "expressjs", "javascript"],
  redis: ["nodejs", "docker", "postgresql"],
  docker: ["kubernetes", "github-actions", "terraform", "linux"],
  kubernetes: ["docker", "terraform", "prometheus", "grafana"],
  aws: ["docker", "kubernetes", "terraform", "linux"],
  "google-cloud": ["kubernetes", "docker", "terraform"],
  azure: ["csharp", "docker", "kubernetes"],
  git: ["github-actions", "linux", "docker"],
  linux: ["docker", "git", "kubernetes", "python"],
  figma: ["react", "storybook", "tailwind-css"],
  flutter: ["kotlin", "swift", "figma"],
  swift: ["kotlin", "figma"],
  kotlin: ["java", "spring-boot", "swift"],
  r: ["python", "pandas", "tableau"],
  spark: ["python", "kafka", "snowflake", "apache-airflow"],
  pandas: ["python", "numpy", "tensorflow"],
  tensorflow: ["python", "numpy", "pandas", "pytorch"],
  "tailwind-css": ["react", "nextjs", "vite", "html"],
  sass: ["css", "html", "vuejs"],
  vite: ["react", "vuejs", "typescript"],
  expressjs: ["nodejs", "javascript", "mongodb"],
  fastapi: ["python", "postgresql", "docker"],
  django: ["python", "postgresql", "redis"],
  "spring-boot": ["java", "kotlin", "postgresql", "docker"],
  "react-native": ["react", "typescript", "javascript"],
  graphql: ["nodejs", "react", "typescript"],
  redux: ["react", "typescript", "javascript"],
  webpack: ["javascript", "react", "typescript"],
  storybook: ["react", "figma", "vuejs"],
  cypress: ["javascript", "react", "typescript"],
  playwright: ["typescript", "javascript", "react"],
  terraform: ["aws", "kubernetes", "docker", "ansible"],
  ansible: ["linux", "docker", "terraform"],
  "github-actions": ["git", "docker", "nodejs"],
  jenkins: ["docker", "java", "git"],
  prometheus: ["kubernetes", "grafana", "docker"],
  grafana: ["prometheus", "kubernetes", "elasticsearch"],
  kafka: ["spark", "java", "docker"],
  rabbitmq: ["nodejs", "python", "docker"],
  elasticsearch: ["grafana", "docker", "kafka"],
  "power-bi": ["sql", "python", "tableau"],
  numpy: ["python", "pandas", "tensorflow"],
  pytorch: ["python", "numpy", "tensorflow"],
  unity: ["csharp", "cplusplus"],
  "unreal-engine": ["cplusplus", "c"],
  godot: ["csharp", "cplusplus"],
  cplusplus: ["c", "unreal-engine", "unity"],
  lua: ["c", "redis", "cplusplus"],
  solidity: ["javascript", "typescript"],
  c: ["cplusplus", "rust", "linux", "arduino"],
  arduino: ["cplusplus", "c", "python"],
  "apache-airflow": ["python", "spark", "dbt", "snowflake"],
  dbt: ["sql", "snowflake", "postgresql", "python"],
  snowflake: ["sql", "dbt", "spark", "python"],
  tableau: ["sql", "python", "r"],
  looker: ["sql", "dbt", "snowflake"],
  jira: ["confluence", "trello", "git"],
  trello: ["jira", "notion", "confluence"],
  notion: ["trello", "jira", "confluence"],
  confluence: ["jira", "trello", "notion"],
};

// Overrides por tecnologia: Partial<Technology> mesclado POR ULTIMO sobre o
// objeto gerado pelo template. So para techs cujo conteudo generico sairia
// factualmente errado (ex.: automacao industrial, cujos materiais gratuitos reais
// sao treinamentos de fabricante, nao cursos genericos de dev). category e
// difficulty sao lidos do override ANTES de derivar difficultyScore/salaryRange,
// pra manterem coerencia. Techs sem entrada aqui ficam 100% iguais ao template.
const technologyOverrides: Record<string, Partial<Technology>> = {
  CLP: {
    category: "Ferramentas",
    difficulty: "Intermediário",
    description:
      "CLP (Controlador Lógico Programável) é o computador industrial que comanda máquinas e linhas de produção. Ele lê sensores, executa uma lógica programada em ciclo contínuo e aciona motores, válvulas e atuadores, garantindo que o processo rode de forma automática e segura.",
    useCases: [
      "Automatizar uma linha de produção",
      "Controlar partida e proteção de motores",
      "Ler sensores e acionar atuadores em tempo real",
      "Integrar máquinas a sistemas de supervisão",
    ],
    learningPath: [
      "Entender lógica de contatos (ladder)",
      "Aprender entradas e saídas digitais e analógicas",
      "Programar num simulador (ex.: OpenPLC)",
      "Montar uma automação simples de bancada",
      "Estudar redes industriais e integração com SCADA",
    ],
    dailyTip:
      "Comece pela lógica ladder num simulador antes de mexer em CLP físico: erra barato e aprende o ciclo de varredura.",
    tools: ["TIA Portal", "CoDeSys", "OpenPLC", "Multímetro"],
    courses: [
      "SENAI EAD: cursos de CLP e linguagem Ladder",
      "Documentação e treinamentos gratuitos dos fabricantes (Siemens, Altus, WEG)",
    ],
    companies: [
      "Siemens",
      "Rockwell Automation",
      "Schneider Electric",
      "WEG",
    ],
    combinesWith: ["scada", "modbus", "c"],
  },
  SCADA: {
    category: "Ferramentas",
    difficulty: "Intermediário",
    description:
      "SCADA é o sistema que supervisiona e controla processos industriais à distância. Ele coleta dados de CLPs e sensores em tempo real, mostra tudo em telas (IHM), registra histórico e dispara alarmes, deixando o operador acompanhar e agir sobre a planta inteira de um ponto só.",
    useCases: [
      "Supervisionar uma planta em tempo real",
      "Criar telas de operação (IHM)",
      "Registrar histórico e gerar alarmes",
      "Integrar vários CLPs num painel único",
    ],
    learningPath: [
      "Entender o que CLP e sensores entregam",
      "Aprender tags e comunicação com CLP",
      "Montar uma tela simples num software SCADA",
      "Configurar alarmes e histórico",
      "Praticar num projeto integrando CLP e SCADA",
    ],
    dailyTip:
      "Modele bem as tags antes de desenhar telas: um SCADA organizado começa na nomenclatura das variáveis.",
    tools: ["Elipse SCADA", "Ignition", "TIA Portal (WinCC)"],
    courses: [
      "Curso EAD Sistemas Supervisórios (Elipse Software, gratuito)",
      "Curso ScadaBR online (gratuito, no YouTube)",
    ],
    companies: [
      "Siemens",
      "Schneider Electric",
      "AVEVA",
      "Inductive Automation",
    ],
    combinesWith: ["clp", "modbus"],
  },
  Modbus: {
    category: "Ferramentas",
    difficulty: "Intermediário",
    description:
      "Modbus é um dos protocolos de comunicação mais usados na indústria para CLPs, sensores e equipamentos conversarem entre si. Simples e aberto, funciona no modelo mestre/escravo (nas variantes RTU, serial, e TCP, sobre rede), e é a base de muita integração em automação.",
    useCases: [
      "Conectar CLP a sensores e inversores",
      "Integrar equipamentos de fabricantes diferentes",
      "Levar dados de chão de fábrica pro SCADA",
      "Montar uma rede industrial simples",
    ],
    learningPath: [
      "Entender mestre/escravo e registradores",
      "Diferenciar Modbus RTU e Modbus TCP",
      "Ler dados de um dispositivo real ou simulado",
      "Integrar com um CLP",
      "Conhecer alternativas como Profinet e EtherNet/IP",
    ],
    dailyTip:
      "Comece pelo Modbus TCP com um simulador: dá pra entender registradores sem precisar de cabo serial e conversor.",
    tools: ["Modbus Poll", "Wireshark", "CoDeSys"],
    courses: [
      "Especificação oficial do protocolo (Modbus Organization)",
      "Documentação e treinamentos gratuitos dos fabricantes",
    ],
    companies: ["Schneider Electric", "Siemens", "WEG"],
    combinesWith: ["clp", "scada"],
  },
};

export const technologies: Technology[] = names.map((name) => {
  const override = technologyOverrides[name] ?? {};
  const category = override.category ?? categoryFor(name);
  const difficulty =
    override.difficulty ?? difficulties[name] ?? "Intermediário";
  const evidence = usageEvidence[slugify(name)];
  const base: Technology = {
    slug: slugify(name),
    name,
    icon: name.slice(0, 2).toUpperCase(),
    logoUrl: logoUrls[name] ?? "",
    category,
    description: `${name} é usada para construir produtos digitais, resolver problemas reais e acelerar entregas em times de tecnologia.`,
    difficulty,
    difficultyScore: difficultyScore(difficulty),
    salaryRange:
      difficulty === "Avançado"
        ? "R$ 6.000 a R$ 14.000"
        : difficulty === "Intermediário"
          ? "R$ 4.000 a R$ 10.000"
          : "R$ 2.500 a R$ 6.000",
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
    combinesWith: combinesWithMap[slugify(name)] || [],
    tools: ["VS Code", "Git", "GitHub"],
    courses: [
      "Curso em Vídeo",
      "freeCodeCamp",
      "Documentação oficial",
      "YouTube",
    ],
    companies: notableCompanies[name] || [
      "GitHub",
      "Stack Overflow",
      "Comunidades open source",
    ],
    games: notableGames[name],
  };
  return { ...base, ...override };
});

export const technologyCategories = [
  "Todas",
  "Linguagens",
  "Frameworks",
  "Banco de Dados",
  "Ferramentas",
  "Cloud",
  "DevOps",
  "Dados e IA",
  "Segurança",
  "Testes",
  "Design",
  "Gestão",
];

export const technologyCategoryLabels: Record<string, string> = {
  Testes: "Testes / QA",
  Gestão: "Gestão e Metodologias",
};

export const technologyRanking = technologies
  .slice()
  .sort((a, b) => {
    const pct = (b.usagePercent || 0) - (a.usagePercent || 0);
    if (pct !== 0) return pct;
    return a.name.localeCompare(b.name);
  })
  .map((technology, index) => ({ position: index + 1, ...technology }));

export const technologiesByArea = areaMap;
