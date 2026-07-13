// ============================================================================
// CATALOGO CURADO DE CERTIFICACOES, CURSOS E RECURSOS GRATUITOS.
//
// Precos auditados em julho de 2026 com fonte (reajuste da linha CompTIA em
// 01/06/2026, fim do programa gratuito ISC2 CC em 20/05/2026). Este catalogo e
// a UNICA fonte citavel pelo gerador de plano de carreira.
// TODO(Ana): conferencia editorial final dos itens e das URLs.
//
// Trava de honestidade da feature: o modelo NUNCA escreve nome, preco ou URL
// de certificacao/curso; ele so referencia IDs deste catalogo. Os precos sao
// VALORES DE REFERENCIA (priceAsOf) a confirmar, em valores redondos
// conhecidos, nunca centavos inventados. Item com nome/provedor/nivel incerto
// fica FORA do catalogo.
//
// Este arquivo e material editorial: adicionar/ajustar item aqui NAO exige
// mudanca de codigo (o gerador injeta o subconjunto da area no prompt).
// ============================================================================

export const CAREER_CATALOG_VERSION = "2026-07";

export type CareerCatalogItemType = "certification" | "course" | "free_resource";
export type CareerCatalogLevel = "intro" | "fundamental" | "associate" | "professional";

// period OBRIGATORIO nos itens pagos: assinatura mensal (Coursera) x pagamento
// unico (prova/certificacao). Obrigatorio de proposito, para o TypeScript forcar
// cada item a declarar, em vez de um default silencioso que subestima o custo.
export type CareerCatalogPrice =
  | { amount: number; currency: "USD" | "BRL"; period: "once" | "monthly" }
  | { free: true };

export interface CareerCatalogItem {
  // Slug estavel; e o unico identificador que o modelo pode citar.
  id: string;
  itemType: CareerCatalogItemType;
  name: string;
  provider: string;
  level: CareerCatalogLevel;
  price: CareerCatalogPrice;
  // Mes de referencia do preco, formato "AAAA-MM".
  priceAsOf: string;
  url: string;
  // Slugs de area da plataforma (shared/areas.ts); "geral" para itens universais.
  areas: string[];
  prereqIds?: string[];
  notes?: string;
}

export const CAREER_CATALOG: CareerCatalogItem[] = [
  // ------------------------------- AWS ------------------------------------
  {
    id: "aws-cloud-practitioner",
    itemType: "certification",
    name: "AWS Certified Cloud Practitioner",
    provider: "AWS",
    level: "fundamental",
    price: { amount: 100, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://aws.amazon.com/certification/certified-cloud-practitioner/",
    areas: ["cloud", "devops", "infraestrutura", "sre"],
    notes: "Porta de entrada do ecossistema AWS; sem pre-requisito.",
  },
  {
    id: "aws-ai-practitioner",
    itemType: "certification",
    name: "AWS Certified AI Practitioner",
    provider: "AWS",
    level: "fundamental",
    price: { amount: 100, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://aws.amazon.com/certification/certified-ai-practitioner/",
    areas: ["ia", "cloud", "dados"],
    notes: "Fundamentos de IA no contexto AWS; sem pre-requisito.",
  },
  {
    id: "aws-solutions-architect-associate",
    itemType: "certification",
    name: "AWS Certified Solutions Architect Associate",
    provider: "AWS",
    level: "associate",
    price: { amount: 150, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://aws.amazon.com/certification/certified-solutions-architect-associate/",
    areas: ["cloud", "devops", "sre", "infraestrutura"],
    prereqIds: ["aws-cloud-practitioner"],
    notes:
      "Sem pre-requisito formal; recomendada depois do Cloud Practitioner e de pratica real com AWS.",
  },
  // ----------------------------- Microsoft --------------------------------
  {
    id: "azure-az-900",
    itemType: "certification",
    name: "Microsoft Certified: Azure Fundamentals (AZ-900)",
    provider: "Microsoft",
    level: "fundamental",
    price: { amount: 99, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://learn.microsoft.com/credentials/certifications/azure-fundamentals/",
    areas: ["cloud", "infraestrutura"],
    notes: "Fundamentos de nuvem no ecossistema Microsoft; sem pre-requisito.",
  },
  {
    id: "azure-az-104",
    itemType: "certification",
    name: "Microsoft Certified: Azure Administrator Associate (AZ-104)",
    provider: "Microsoft",
    level: "associate",
    price: { amount: 165, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://learn.microsoft.com/credentials/certifications/azure-administrator/",
    areas: ["cloud", "infraestrutura", "devops"],
    prereqIds: ["azure-az-900"],
    notes: "Recomendada depois da AZ-900 e de pratica com Azure.",
  },
  {
    id: "ms-pl-300",
    itemType: "certification",
    name: "Microsoft Certified: Power BI Data Analyst Associate (PL-300)",
    provider: "Microsoft",
    level: "associate",
    price: { amount: 165, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://learn.microsoft.com/credentials/certifications/data-analyst-associate/",
    areas: ["analise-dados", "dados"],
    notes: "A certificacao de referencia de Power BI, o BI mais pedido no Brasil.",
  },
  // ---------------------------- Google Cloud ------------------------------
  {
    id: "gcp-digital-leader",
    itemType: "certification",
    name: "Google Cloud Certified: Cloud Digital Leader",
    provider: "Google Cloud",
    level: "fundamental",
    price: { amount: 99, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://cloud.google.com/learn/certification/cloud-digital-leader",
    areas: ["cloud"],
    notes: "Fundamentos de nuvem no ecossistema Google; sem pre-requisito.",
  },
  {
    id: "gcp-associate-cloud-engineer",
    itemType: "certification",
    name: "Google Cloud Certified: Associate Cloud Engineer",
    provider: "Google Cloud",
    level: "associate",
    price: { amount: 125, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://cloud.google.com/learn/certification/cloud-engineer",
    areas: ["cloud", "devops", "sre"],
    prereqIds: ["gcp-digital-leader"],
    notes: "Sem pre-requisito formal; recomendada com pratica real de GCP.",
  },
  // ------------------------------- Cisco ----------------------------------
  {
    id: "cisco-ccna",
    itemType: "certification",
    name: "Cisco Certified Network Associate (CCNA)",
    provider: "Cisco",
    level: "associate",
    price: { amount: 300, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccna/index.html",
    areas: ["infraestrutura", "ciberseguranca", "sre"],
    notes: "A referencia mundial de redes; exige base solida antes da prova.",
  },
  // ------------------------------ CompTIA ---------------------------------
  {
    id: "comptia-a-plus",
    itemType: "certification",
    name: "CompTIA A+",
    provider: "CompTIA",
    level: "fundamental",
    price: { amount: 274, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://www.comptia.org/certifications/a",
    areas: ["infraestrutura"],
    notes: "Valor de referencia POR PROVA; sao duas provas (Core 1 e Core 2).",
  },
  {
    id: "comptia-network-plus",
    itemType: "certification",
    name: "CompTIA Network+",
    provider: "CompTIA",
    level: "associate",
    price: { amount: 399, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://www.comptia.org/certifications/network",
    areas: ["infraestrutura", "sre", "ciberseguranca"],
    prereqIds: ["comptia-a-plus"],
    notes: "Pre-requisito e recomendacao da CompTIA, nao exigencia formal.",
  },
  {
    id: "comptia-security-plus",
    itemType: "certification",
    name: "CompTIA Security+",
    provider: "CompTIA",
    level: "associate",
    price: { amount: 439, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://www.comptia.org/certifications/security",
    areas: ["ciberseguranca", "infraestrutura", "devops"],
    prereqIds: ["comptia-network-plus"],
    notes:
      "A porta de entrada mais reconhecida de seguranca; a CompTIA recomenda base de redes antes.",
  },
  // -------------------------------- ISC2 ----------------------------------
  {
    id: "isc2-cc",
    itemType: "certification",
    name: "ISC2 Certified in Cybersecurity (CC)",
    provider: "ISC2",
    level: "fundamental",
    price: { amount: 199, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://www.isc2.org/certifications/cc",
    areas: ["ciberseguranca"],
    notes:
      "O programa gratuito One Million Certified in Cybersecurity encerrou novas inscricoes em 20 de maio de 2026 e o exame voltou ao preco padrao. Ha uma taxa anual de manutencao separada de US$ 50, nao inclusa no preco do exame.",
  },
  // ------------------------------ Scrum.org -------------------------------
  {
    id: "scrum-org-psm1",
    itemType: "certification",
    name: "Professional Scrum Master I (PSM I)",
    provider: "Scrum.org",
    level: "fundamental",
    price: { amount: 200, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://www.scrum.org/assessments/professional-scrum-master-i-certification",
    areas: ["gestao", "produto"],
    notes: "Prova online sem curso obrigatorio; a referencia de Scrum.",
  },
  // ------------------------------- GitHub ---------------------------------
  {
    id: "github-foundations",
    itemType: "certification",
    name: "GitHub Foundations",
    provider: "GitHub",
    level: "fundamental",
    price: { amount: 99, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://resources.github.com/learn/certifications/",
    areas: ["geral"],
    notes:
      "Fundamentos de Git e GitHub; util em qualquer area tecnica. A prova esta disponivel em portugues do Brasil e e gratuita para estudantes verificados no GitHub Education.",
  },
  {
    id: "github-actions",
    itemType: "certification",
    name: "GitHub Actions",
    provider: "GitHub",
    level: "associate",
    price: { amount: 99, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://resources.github.com/learn/certifications/",
    areas: ["devops", "sre"],
    prereqIds: ["github-foundations"],
    notes: "CI/CD com GitHub Actions; recomendada depois da Foundations.",
  },
  // ------------------------------- Linux ----------------------------------
  {
    id: "lpi-linux-essentials",
    itemType: "certification",
    name: "LPI Linux Essentials",
    provider: "Linux Professional Institute",
    level: "fundamental",
    price: { amount: 120, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://www.lpi.org/our-certifications/linux-essentials-overview/",
    areas: ["infraestrutura", "devops", "sre", "backend"],
    notes:
      "Porta de entrada de Linux; sem pre-requisito. O valor e da faixa Tier 1; o Brasil esta na Tier 2, com preco menor (cerca de US$ 100); confirmar no site da LPI.",
  },
  {
    id: "cncf-cka",
    itemType: "certification",
    name: "Certified Kubernetes Administrator (CKA)",
    provider: "Linux Foundation / CNCF",
    level: "professional",
    price: { amount: 445, currency: "USD", period: "once" },
    priceAsOf: "2026-07",
    url: "https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/",
    areas: ["devops", "sre", "cloud"],
    prereqIds: ["lpi-linux-essentials"],
    notes:
      "Prova pratica (hands-on); exige experiencia real com Kubernetes antes. O preco inclui um retake.",
  },
  // -------------------- Coursera Professional Certificates ----------------
  {
    id: "google-it-support",
    itemType: "course",
    name: "Google IT Support Professional Certificate",
    provider: "Google / Coursera",
    level: "intro",
    price: { amount: 49, currency: "USD", period: "monthly" },
    priceAsOf: "2026-07",
    url: "https://www.coursera.org/professional-certificates/google-it-support",
    areas: ["infraestrutura", "geral"],
    notes:
      "Assinatura MENSAL do Coursera (valor de referencia por mes). O total depende de quantos meses voce levar para concluir.",
  },
  {
    id: "google-data-analytics",
    itemType: "course",
    name: "Google Data Analytics Professional Certificate",
    provider: "Google / Coursera",
    level: "intro",
    price: { amount: 49, currency: "USD", period: "monthly" },
    priceAsOf: "2026-07",
    url: "https://www.coursera.org/professional-certificates/google-data-analytics",
    areas: ["analise-dados", "dados"],
    notes:
      "Assinatura MENSAL do Coursera (valor de referencia por mes). O total depende de quantos meses voce levar para concluir.",
  },
  {
    id: "google-ux-design",
    itemType: "course",
    name: "Google UX Design Professional Certificate",
    provider: "Google / Coursera",
    level: "intro",
    price: { amount: 49, currency: "USD", period: "monthly" },
    priceAsOf: "2026-07",
    url: "https://www.coursera.org/professional-certificates/google-ux-design",
    areas: ["uxui"],
    notes:
      "Assinatura MENSAL do Coursera (valor de referencia por mes). O total depende de quantos meses voce levar para concluir.",
  },
  {
    id: "ibm-ai-engineering",
    itemType: "course",
    name: "IBM AI Engineering Professional Certificate",
    provider: "IBM / Coursera",
    level: "associate",
    price: { amount: 49, currency: "USD", period: "monthly" },
    priceAsOf: "2026-07",
    url: "https://www.coursera.org/professional-certificates/ai-engineer",
    areas: ["ia", "dados"],
    notes:
      "Assinatura MENSAL do Coursera (valor de referencia por mes); exige base de Python. O total depende de quantos meses voce levar para concluir.",
  },
  {
    id: "ibm-rag-agentic-ai",
    itemType: "course",
    name: "IBM RAG and Agentic AI Professional Certificate",
    provider: "IBM / Coursera",
    level: "associate",
    price: { amount: 49, currency: "USD", period: "monthly" },
    priceAsOf: "2026-07",
    url: "https://www.coursera.org/professional-certificates/ibm-rag-and-agentic-ai",
    areas: ["ia"],
    notes:
      "Assinatura MENSAL do Coursera (valor de referencia por mes); exige base de Python e de LLMs. O total depende de quantos meses voce levar para concluir.",
  },
  {
    id: "meta-front-end",
    itemType: "course",
    name: "Meta Front-End Developer Professional Certificate",
    provider: "Meta / Coursera",
    level: "intro",
    price: { amount: 49, currency: "USD", period: "monthly" },
    priceAsOf: "2026-07",
    url: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
    areas: ["frontend", "fullstack"],
    notes:
      "Assinatura MENSAL do Coursera (valor de referencia por mes). O total depende de quantos meses voce levar para concluir.",
  },
  {
    id: "meta-back-end",
    itemType: "course",
    name: "Meta Back-End Developer Professional Certificate",
    provider: "Meta / Coursera",
    level: "intro",
    price: { amount: 49, currency: "USD", period: "monthly" },
    priceAsOf: "2026-07",
    url: "https://www.coursera.org/professional-certificates/meta-back-end-developer",
    areas: ["backend", "fullstack"],
    notes:
      "Assinatura MENSAL do Coursera (valor de referencia por mes). O total depende de quantos meses voce levar para concluir.",
  },
  // --------------------------- Gratuitos ----------------------------------
  {
    id: "anthropic-academy",
    itemType: "free_resource",
    name: "Anthropic Academy",
    provider: "Anthropic",
    level: "intro",
    price: { free: true },
    priceAsOf: "2026-07",
    url: "https://www.anthropic.com/learn",
    areas: ["ia"],
    notes: "Cursos gratuitos da Anthropic sobre como construir com IA e Claude.",
  },
  {
    id: "aws-skill-builder",
    itemType: "free_resource",
    name: "AWS Skill Builder (trilhas gratuitas)",
    provider: "AWS",
    level: "intro",
    price: { free: true },
    priceAsOf: "2026-07",
    url: "https://skillbuilder.aws/",
    areas: ["cloud", "devops", "ia"],
    notes: "Preparatorios oficiais gratuitos das certificacoes AWS.",
  },
  {
    id: "cisco-skills-for-all",
    itemType: "free_resource",
    name: "Cisco Networking Academy (Skills for All)",
    provider: "Cisco",
    level: "intro",
    price: { free: true },
    priceAsOf: "2026-07",
    url: "https://www.netacad.com/",
    areas: ["infraestrutura", "ciberseguranca", "iot"],
    notes: "Cursos gratuitos de redes, seguranca e IoT; preparam pra CCNA.",
  },
  {
    id: "microsoft-learn",
    itemType: "free_resource",
    name: "Microsoft Learn",
    provider: "Microsoft",
    level: "intro",
    price: { free: true },
    priceAsOf: "2026-07",
    url: "https://learn.microsoft.com/training/",
    areas: ["geral", "cloud", "analise-dados"],
    notes: "Trilhas oficiais gratuitas; preparam AZ-900, PL-300 e outras.",
  },
  {
    id: "google-cloud-skills-boost",
    itemType: "free_resource",
    name: "Google Cloud Skills Boost",
    provider: "Google Cloud",
    level: "intro",
    price: { free: true },
    priceAsOf: "2026-07",
    url: "https://www.cloudskillsboost.google/",
    areas: ["cloud", "dados", "ia"],
    notes: "Trilhas oficiais do Google Cloud; parte do conteudo e gratuito.",
  },
  {
    id: "freecodecamp",
    itemType: "free_resource",
    name: "freeCodeCamp",
    provider: "freeCodeCamp",
    level: "intro",
    price: { free: true },
    priceAsOf: "2026-07",
    url: "https://www.freecodecamp.org/",
    areas: ["frontend", "backend", "fullstack", "geral"],
    notes: "Curriculo gratuito com projetos praticos e certificados proprios.",
  },
];

const CATALOG_BY_ID = new Map(CAREER_CATALOG.map((item) => [item.id, item]));

export function getCatalogItem(id: string): CareerCatalogItem | null {
  return CATALOG_BY_ID.get(id) ?? null;
}

// Itens das areas pedidas + os universais ("geral").
export function catalogForAreas(areas: string[]): CareerCatalogItem[] {
  const wanted = new Set([...areas, "geral"]);
  return CAREER_CATALOG.filter((item) =>
    item.areas.some((area) => wanted.has(area)),
  );
}
