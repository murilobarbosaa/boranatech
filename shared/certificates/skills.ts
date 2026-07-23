// Habilidades da trilha, DERIVADAS do conteudo real (nunca inventadas) para
// exibir na pagina do certificado (estilo "Skills you'll gain" da Coursera).
//
// Fonte da verdade: o conteudo estatico da trilha (shared/roadmapV2/content/*):
// titulos de secoes + topicos + a descricao. O dicionario abaixo e um
// RECONHECEDOR: so emite uma tag se o padrao dela aparecer no conteudo. Marcos
// de percurso ("Primeiro site no ar", "Projeto e deploy") nao viram tag porque
// nao casam nenhum padrao de habilidade. Deterministico: mesma trilha -> mesmas
// tags, sempre.
import type { RoadmapV2 } from "../roadmapV2/types";

type SkillEntry = { tag: string; patterns: string[] };

// Cada tag canonica com os termos (lowercase) que a identificam no conteudo.
// Os termos casam com fronteira de palavra (ver includesTerm), entao "sql" nao
// casa "nosql" e "git" nao casa "digital".
const SKILL_DICTIONARY: SkillEntry[] = [
  // Linguagens
  { tag: "JavaScript", patterns: ["javascript", "js e o dom"] },
  { tag: "TypeScript", patterns: ["typescript"] },
  { tag: "Python", patterns: ["python"] },
  { tag: "SQL", patterns: ["sql"] },
  { tag: "COBOL", patterns: ["cobol"] },
  { tag: "Solidity", patterns: ["solidity"] },
  { tag: "Linguagem C", patterns: ["linguagem c"] },
  // Front-end
  { tag: "HTML", patterns: ["html"] },
  { tag: "CSS", patterns: ["css", "box model", "flexbox"] },
  { tag: "React", patterns: ["react"] },
  { tag: "Responsividade", patterns: ["responsividade", "mobile-first"] },
  { tag: "Acessibilidade", patterns: ["acessibilidade", "aria"] },
  { tag: "Next.js", patterns: ["next.js"] },
  // Back-end / web
  { tag: "APIs REST", patterns: ["api rest", "apis rest", "rest e recursos", "rest e status", "construir uma api", "documentar a api", "consumir uma api", "consumo de apis", "testar apis", "teste de api", "testar a api"] },
  { tag: "GraphQL", patterns: ["graphql"] },
  { tag: "Autenticação", patterns: ["autenticação", "jwt", "hashing de senha"] },
  { tag: "ORM", patterns: ["orm"] },
  { tag: "PostgreSQL", patterns: ["postgresql", "postgres"] },
  { tag: "Redis", patterns: ["redis"] },
  { tag: "Middlewares", patterns: ["middleware"] },
  // Dados / IA
  { tag: "Pandas", patterns: ["pandas", "dataframe"] },
  { tag: "NumPy", patterns: ["numpy"] },
  { tag: "Estatística", patterns: ["estatística"] },
  { tag: "Visualização de dados", patterns: ["visualização", "matplotlib", "seaborn", "gráficos com"] },
  { tag: "Machine Learning", patterns: ["machine learning", "aprendizado supervisionado", "scikit-learn", "regressão linear", "árvores de decisão"] },
  { tag: "Deep Learning", patterns: ["deep learning"] },
  { tag: "Redes neurais", patterns: ["redes neurais", "cnns", "redes convolucionais"] },
  { tag: "PyTorch / TensorFlow", patterns: ["pytorch", "tensorflow"] },
  { tag: "NLP", patterns: ["processamento de linguagem natural", "nlp"] },
  { tag: "Visão computacional", patterns: ["visão computacional"] },
  { tag: "LLMs e IA generativa", patterns: ["llm", "ia generativa", "engenharia de prompts", "rag na prática", "modelos de fundação"] },
  { tag: "Jupyter / Colab", patterns: ["jupyter", "colab"] },
  { tag: "ETL", patterns: ["etl", "elt", "pipelines de dados", "ingestão de dados"] },
  { tag: "Data Warehouse", patterns: ["data warehouse", "data lake", "lakehouse"] },
  { tag: "Airflow", patterns: ["airflow"] },
  { tag: "MLOps", patterns: ["mlops"] },
  { tag: "Versionamento de modelos", patterns: ["versionar dados e modelos", "versionamento de dados"] },
  { tag: "Monitoramento de modelos", patterns: ["data drift", "concept drift", "monitorar previsões"] },
  { tag: "dbt", patterns: ["dbt"] },
  { tag: "Modelagem de dados", patterns: ["modelagem de dados", "modelar os dados", "normalização", "modelar a estrutura"] },
  { tag: "Índices e performance", patterns: ["índices", "planos de execução", "tuning e planos"] },
  { tag: "Transações (ACID)", patterns: ["transações e acid", "integridade e constraints"] },
  { tag: "NoSQL", patterns: ["nosql", "mongodb"] },
  { tag: "Power BI e dashboards", patterns: ["ferramentas de bi", "construir dashboards", "dashboards", "power bi"] },
  { tag: "Planilhas", patterns: ["planilhas", "tabelas dinâmicas"] },
  // Cloud / DevOps / Infra
  { tag: "AWS / Azure / GCP", patterns: ["aws", "azure", "google cloud"] },
  { tag: "Docker", patterns: ["docker"] },
  { tag: "Kubernetes", patterns: ["kubernetes", "kubectl"] },
  { tag: "CI/CD", patterns: ["ci/cd", "pipeline", "ci básico"] },
  { tag: "Infraestrutura como código", patterns: ["infraestrutura como código"] },
  { tag: "Linux", patterns: ["linux"] },
  { tag: "Git", patterns: ["git"] },
  { tag: "Observabilidade", patterns: ["observabilidade", "logs, métricas", "monitoramento e observabilidade", "tracing"] },
  { tag: "Serverless", patterns: ["serverless", "funções lambda"] },
  { tag: "Redes", patterns: ["redes de computadores", "como funcionam as redes", "fundamentos de redes", "redes na nuvem", "como a rede funciona", "equipamentos de rede", "dns, dhcp"] },
  { tag: "Virtualização", patterns: ["virtualização"] },
  { tag: "Backup e recuperação", patterns: ["backup"] },
  // Segurança
  { tag: "Criptografia", patterns: ["criptografia", "tls e https"] },
  { tag: "Pentest", patterns: ["pentest", "red team", "segurança ofensiva"] },
  { tag: "Blue team / SOC", patterns: ["blue team", "soc", "siem"] },
  { tag: "Resposta a incidentes", patterns: ["resposta a incidentes"] },
  { tag: "Post-mortems", patterns: ["post-mortems"] },
  { tag: "Segurança de aplicações", patterns: ["vulnerabilidades comuns", "xss", "segurança de smart contracts", "segurança de dispositivos"] },
  // Design
  { tag: "Figma", patterns: ["figma"] },
  { tag: "Design System", patterns: ["design system"] },
  { tag: "UX Research", patterns: ["métodos de pesquisa", "pesquisa com usuários", "teste de usabilidade", "personas"] },
  { tag: "Prototipação", patterns: ["prototipagem", "protótipo", "wireframes"] },
  { tag: "Tipografia", patterns: ["tipografia"] },
  // Produto / Gestão / Ágil
  { tag: "Scrum", patterns: ["scrum"] },
  { tag: "Kanban", patterns: ["kanban"] },
  { tag: "Métodos ágeis", patterns: ["manifesto ágil", "métodos ágeis", "mentalidade ágil", "time ágil", "cascata e ágil"] },
  { tag: "Discovery", patterns: ["discovery"] },
  { tag: "Roadmap e backlog", patterns: ["roadmap", "backlog"] },
  { tag: "Métricas e KPIs", patterns: ["north star", "kpis", "métricas de produto", "métricas de retenção", "funil e retenção"] },
  { tag: "Teste A/B", patterns: ["teste a/b", "experimentos e teste"] },
  { tag: "Gestão de riscos", patterns: ["gestão de riscos"] },
  // QA
  { tag: "Testes de software", patterns: ["teste manual", "casos de teste", "níveis de teste", "design de teste", "testes automatizados", "regressão e smoke", "plano de testes", "teste exploratório"] },
  { tag: "Automação de testes", patterns: ["automação de testes", "ferramentas de automação", "automatizar"] },
  { tag: "Postman", patterns: ["postman"] },
  // Eng. de software
  { tag: "Estruturas de dados", patterns: ["estruturas de dados", "pilhas e filas", "árvores e grafos", "tabelas hash"] },
  { tag: "Algoritmos", patterns: ["algoritmos", "pensamento algorítmico", "recursão", "big-o"] },
  { tag: "POO", patterns: ["orientação a objetos", "programação funcional"] },
  { tag: "SOLID e padrões", patterns: ["solid", "padrões de projeto"] },
  { tag: "Arquitetura de software", patterns: ["arquitetura de software", "monolito e microserviços", "separação em camadas", "microserviços"] },
  { tag: "Clean code", patterns: ["clean code", "código legível", "refatoração"] },
  { tag: "Lógica de programação", patterns: ["lógica de programação"] },
  // Mobile / Game / IoT / Blockchain / Mainframe / ERP
  { tag: "UI declarativa", patterns: ["ui declarativa"] },
  { tag: "Navegação e estado", patterns: ["navegação entre telas", "arquitetura de estado"] },
  { tag: "Armazenamento local", patterns: ["armazenamento local"] },
  { tag: "Notificações e sensores", patterns: ["notificações", "câmera, galeria e sensores", "sensores e atuadores"] },
  { tag: "Publicação nas lojas", patterns: ["lojas de aplicativos", "build assinado"] },
  { tag: "Game engines", patterns: ["game engine", "sua engine", "dentro da engine"] },
  { tag: "Game design", patterns: ["game design"] },
  { tag: "Física e colisões", patterns: ["física e colisões"] },
  { tag: "Animação 2D", patterns: ["animação 2d"] },
  { tag: "IA de jogos", patterns: ["ia de inimigos"] },
  { tag: "Microcontroladores", patterns: ["microcontroladores", "arduino", "esp32", "gpio"] },
  { tag: "MQTT", patterns: ["mqtt"] },
  { tag: "Web3", patterns: ["web3", "on-chain", "dapp"] },
  { tag: "Tokens e NFTs", patterns: ["tokens e nfts", "erc"] },
  { tag: "JCL", patterns: ["jcl"] },
  { tag: "DB2", patterns: ["db2"] },
  { tag: "z/OS", patterns: ["z/os", "tso/ispf", "cics"] },
  { tag: "Processamento em lote", patterns: ["processamento em lote", "rotina batch", "batch e streaming"] },
  { tag: "SAP e Totvs", patterns: ["sap", "totvs"] },
  { tag: "Processos de negócio", patterns: ["processos de negócio", "financeiro, contábil"] },
  { tag: "Parametrização e customização", patterns: ["parametrização", "customização"] },
  { tag: "Integrações de sistemas", patterns: ["integrar o erp", "integrações e contratos", "integração web3", "conectar a aplicação"] },
  { tag: "Engenharia de requisitos", patterns: ["engenharia de requisitos", "levantamento de requisitos", "levantar requisitos", "tipos de requisitos", "documentar requisitos"] },
  { tag: "UML e BPMN", patterns: ["uml", "bpmn", "modelagem de processos"] },
  { tag: "Documentação técnica", patterns: ["escrita técnica", "documentação de api", "docs-as-code", "tutoriais e guias"] },
  { tag: "Markdown", patterns: ["markdown"] },
  // Carreira / soft (poucas, so quando explicitas)
  { tag: "LinkedIn", patterns: ["monte seu linkedin", "fundação do perfil", "networking ativo"] },
  { tag: "Hardware", patterns: ["hardware e componentes", "componentes do computador", "montagem e manutenção"] },
  { tag: "Windows", patterns: ["windows"] },
  { tag: "Active Directory", patterns: ["active directory"] },
  { tag: "Atendimento ao usuário", patterns: ["atendimento ao usuário", "sla e processo", "sistemas de ticket", "sistemas de chamado", "ferramentas de chamado", "níveis de atendimento"] },
  { tag: "Confiabilidade (SLO/SLI)", patterns: ["slis", "slos", "error budget", "engenharia de confiabilidade"] },
];

const MAX_TAGS = 12;

// Substring com fronteira de palavra (letras/numeros unicode como word chars):
// "sql" nao casa "nosql"; "git" nao casa "digital".
function includesTerm(hay: string, term: string): boolean {
  let from = 0;
  for (;;) {
    const idx = hay.indexOf(term, from);
    if (idx === -1) return false;
    const before = idx > 0 ? hay[idx - 1] : undefined;
    const after = idx + term.length < hay.length ? hay[idx + term.length] : undefined;
    // Letras (com acentos latinos) e digitos como "word chars", sem depender da
    // flag unicode (tsconfig do server pode ter target antigo).
    const isWord = (ch: string | undefined) =>
      ch !== undefined && /[0-9A-Za-zÀ-ÿ]/.test(ch);
    if (!isWord(before) && !isWord(after)) return true;
    from = idx + 1;
  }
}

// Texto do conteudo (secoes + topicos) em lowercase, para casar os padroes.
function contentHaystack(roadmap: RoadmapV2): string {
  const parts: string[] = [];
  for (const section of roadmap.sections) {
    parts.push(section.title);
    for (const node of section.children) {
      parts.push(node.title);
    }
  }
  return parts.join(" \n ").toLowerCase();
}

// Rotulo EN dos tags que diferem do nome tecnico. O que nao esta aqui e igual
// em PT e EN (HTML, React, Docker, Kubernetes, SQL, Python, Git...). So exibicao
// na pagina (nao entra no SVG/PDF, que so tem titulo/labels do desenho).
const TAG_EN: Record<string, string> = {
  Responsividade: "Responsiveness",
  Acessibilidade: "Accessibility",
  Autenticação: "Authentication",
  Estatística: "Statistics",
  "Visualização de dados": "Data visualization",
  "Redes neurais": "Neural networks",
  "Visão computacional": "Computer vision",
  "LLMs e IA generativa": "LLMs and Generative AI",
  "Modelagem de dados": "Data modeling",
  "Índices e performance": "Indexes and performance",
  "Transações (ACID)": "Transactions (ACID)",
  "Power BI e dashboards": "Power BI and dashboards",
  Planilhas: "Spreadsheets",
  "Infraestrutura como código": "Infrastructure as code",
  Observabilidade: "Observability",
  Redes: "Networking",
  Virtualização: "Virtualization",
  "Backup e recuperação": "Backup and recovery",
  Criptografia: "Cryptography",
  "Segurança de aplicações": "Application security",
  "Resposta a incidentes": "Incident response",
  Prototipação: "Prototyping",
  Tipografia: "Typography",
  "Métodos ágeis": "Agile methods",
  "Roadmap e backlog": "Roadmap and backlog",
  "Métricas e KPIs": "Metrics and KPIs",
  "Teste A/B": "A/B testing",
  "Gestão de riscos": "Risk management",
  "Testes de software": "Software testing",
  "Automação de testes": "Test automation",
  "Estruturas de dados": "Data structures",
  Algoritmos: "Algorithms",
  POO: "OOP",
  "SOLID e padrões": "SOLID and patterns",
  "Arquitetura de software": "Software architecture",
  "Lógica de programação": "Programming logic",
  "UI declarativa": "Declarative UI",
  "Navegação e estado": "Navigation and state",
  "Armazenamento local": "Local storage",
  "Notificações e sensores": "Notifications and sensors",
  "Publicação nas lojas": "App store publishing",
  "Física e colisões": "Physics and collisions",
  "Animação 2D": "2D animation",
  "IA de jogos": "Game AI",
  Microcontroladores: "Microcontrollers",
  "Processos de negócio": "Business processes",
  "Parametrização e customização": "Configuration and customization",
  "Integrações de sistemas": "Systems integration",
  "Engenharia de requisitos": "Requirements engineering",
  "Documentação técnica": "Technical writing",
  "Atendimento ao usuário": "User support",
  "Confiabilidade (SLO/SLI)": "Reliability (SLO/SLI)",
  "Linguagem C": "C language",
  "Versionamento de modelos": "Model versioning",
  "Monitoramento de modelos": "Model monitoring",
  "Processamento em lote": "Batch processing",
  "SAP e Totvs": "SAP and Totvs",
};

export type TrilhaSkills = { context: string; tags: string[] };

// Deriva contexto (a descricao da propria trilha) + tags de habilidade, no
// idioma pedido (default pt). As tags saem ordenadas pela primeira aparicao no
// conteudo (PT) e limitadas a MAX_TAGS; so o ROTULO muda em EN.
export function deriveTrilhaSkills(
  roadmap: RoadmapV2,
  lang: "pt" | "en" = "pt",
): TrilhaSkills {
  const hay = contentHaystack(roadmap);
  const found: Array<{ tag: string; at: number }> = [];
  for (const entry of SKILL_DICTIONARY) {
    let best = -1;
    for (const pattern of entry.patterns) {
      const term = pattern.toLowerCase();
      if (!includesTerm(hay, term)) continue;
      const at = hay.indexOf(term);
      if (best === -1 || at < best) best = at;
    }
    if (best !== -1) found.push({ tag: entry.tag, at: best });
  }
  found.sort((a, b) => a.at - b.at);
  const tags = found
    .slice(0, MAX_TAGS)
    .map((f) => (lang === "en" ? (TAG_EN[f.tag] ?? f.tag) : f.tag));
  return { context: roadmap.description.trim(), tags };
}
