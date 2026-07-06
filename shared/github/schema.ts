import { z } from "zod";

import type { AreaSelection } from "../areas";

/**
 * Contrato do analisador de GitHub.
 *
 * Decisões de design (iguais ao shared/curriculo/schema.ts):
 * campos qualitativos sem dado obrigatório usam .nullable() em vez de
 * .optional(), todo campo tem .describe(), e os conjuntos fechados são
 * enums declarados com "as const".
 *
 * A nota é determinística (derivada das checagens, ver server/lib/githubChecks.ts).
 * A IA NÃO dá nota: ela só preenche a parte qualitativa (GithubQualitativeSchema).
 */

// Enums

export const ANALYSIS_MODES = ["perfil", "repo"] as const;
export const AnalysisModeSchema = z.enum(ANALYSIS_MODES);
export type AnalysisMode = (typeof ANALYSIS_MODES)[number];

export const CHECK_STATUSES = ["pass", "warn", "fail", "na"] as const;
export const CheckStatusSchema = z.enum(CHECK_STATUSES);
export type CheckStatus = (typeof CHECK_STATUSES)[number];

export const CHECK_TIERS = ["essencial", "importante", "opcional"] as const;
export const CheckTierSchema = z.enum(CHECK_TIERS);
export type CheckTier = (typeof CHECK_TIERS)[number];

export const CHECK_CATEGORIES = [
  "essenciais",
  "profissionalismo",
  "saude",
  "perfil",
] as const;
export const CheckCategorySchema = z.enum(CHECK_CATEGORIES);
export type CheckCategory = (typeof CHECK_CATEGORIES)[number];

export const SCORE_BANDS = [
  "comecando",
  "evoluindo",
  "bom",
  "destaque",
] as const;
export const ScoreBandSchema = z.enum(SCORE_BANDS);
export type ScoreBand = (typeof SCORE_BANDS)[number];

// Sinal de suficiencia de dados: o quanto a leitura tem material pra avaliar.
// E ortogonal a nota (nao multiplica nem corta o score).
export const SUFICIENCIAS = ["alta", "media", "baixa"] as const;
export const SuficienciaSchema = z.enum(SUFICIENCIAS);
export type Suficiencia = (typeof SUFICIENCIAS)[number];

// Pesos por tier. Usados pela pontuação determinística.
// pass = peso cheio, warn = metade, fail = 0, na = fora da conta.
export const TIER_WEIGHTS: Record<CheckTier, number> = {
  essencial: 10,
  importante: 6,
  opcional: 3,
};

// Contrato de entrada (o que o fetch do GitHub vai produzir no próximo passo)

export interface GithubRepoData {
  owner: string;
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  topics: string[];
  defaultBranch: string;
  primaryLanguage: string | null;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  openIssues: number;
  pushedAt: string | null;
  license: string | null;
  readme: string | null;
  files: {
    security: boolean;
    contributing: boolean;
    codeOfConduct: boolean;
    gitignore: boolean;
    ci: boolean;
    envCommitted: boolean;
  };
  rootEntries: string[];
  rootDirs: string[];
}

export interface GithubProfileRepo {
  name: string;
  description: string | null;
  primaryLanguage: string | null;
  stars: number;
  pushedAt: string | null;
  fork: boolean;
}

/**
 * Sinais agregados da leitura funda dos top repos proprios (perfil).
 * Contagens sobre os repos analisados; topics e a uniao deduplicada.
 * Campo aditivo: alimenta so a prosa da IA, nao entra na nota deterministica.
 */
export interface GithubDeepSignals {
  reposAnalisados: number;
  comReadme: number;
  comCI: number;
  comTestes: number;
  comDeploy: number;
  topics: string[];
}

export interface GithubProfileData {
  login: string;
  htmlUrl: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  email: string | null;
  twitterUsername: string | null;
  publicRepos: number;
  followers: number;
  profileReadme: string | null;
  repos: GithubProfileRepo[];
  deepSignals?: GithubDeepSignals;
}

// Catálogo de checks. Fonte única de rótulos para servidor e front.

export interface CheckCatalogEntry {
  id: string;
  label: string;
  tier: CheckTier;
  category: CheckCategory;
  appliesTo: AnalysisMode;
  hint?: string;
}

export const CHECK_CATALOG: CheckCatalogEntry[] = [
  // Modo repo
  {
    id: "repo_readme_present",
    label: "README presente",
    tier: "essencial",
    category: "essenciais",
    appliesTo: "repo",
    hint: "Todo repositório de portfólio precisa de um README.",
  },
  {
    id: "repo_readme_substance",
    label: "README com conteúdo real",
    tier: "essencial",
    category: "essenciais",
    appliesTo: "repo",
    hint: "Pelo menos 200 caracteres e um heading markdown.",
  },
  {
    id: "repo_readme_usage",
    label: "README explica como rodar",
    tier: "importante",
    category: "essenciais",
    appliesTo: "repo",
    hint: "Instruções de instalação ou uso ajudam quem chega.",
  },
  {
    id: "repo_description",
    label: "Descrição do repositório",
    tier: "essencial",
    category: "essenciais",
    appliesTo: "repo",
    hint: "A descrição curta aparece na busca e na lista de repos.",
  },
  {
    id: "repo_topics",
    label: "Topics definidos",
    tier: "importante",
    category: "profissionalismo",
    appliesTo: "repo",
    hint: "Topics ajudam a descoberta e mostram organização.",
  },
  {
    id: "repo_license",
    label: "Licença definida",
    tier: "essencial",
    category: "essenciais",
    appliesTo: "repo",
    hint: "Uma licença deixa claro como o código pode ser usado.",
  },
  {
    id: "repo_gitignore",
    label: ".gitignore presente",
    tier: "importante",
    category: "profissionalismo",
    appliesTo: "repo",
    hint: "Evita versionar arquivos temporários e de build.",
  },
  {
    id: "repo_no_secrets",
    label: "Sem .env versionado",
    tier: "essencial",
    category: "essenciais",
    appliesTo: "repo",
    hint: "Arquivo .env no repositório pode vazar segredos.",
  },
  {
    id: "repo_security",
    label: "Arquivo SECURITY",
    tier: "opcional",
    category: "profissionalismo",
    appliesTo: "repo",
  },
  {
    id: "repo_contributing",
    label: "Arquivo CONTRIBUTING",
    tier: "opcional",
    category: "profissionalismo",
    appliesTo: "repo",
  },
  {
    id: "repo_code_of_conduct",
    label: "Código de conduta",
    tier: "opcional",
    category: "profissionalismo",
    appliesTo: "repo",
  },
  {
    id: "repo_ci",
    label: "CI configurado",
    tier: "importante",
    category: "profissionalismo",
    appliesTo: "repo",
    hint: "Workflows de CI mostram cuidado com qualidade.",
  },
  {
    id: "repo_structure",
    label: "Estrutura de pastas de código",
    tier: "opcional",
    category: "profissionalismo",
    appliesTo: "repo",
    hint: "Pastas como src, app ou lib indicam organização.",
  },
  {
    id: "repo_recent_activity",
    label: "Atividade recente",
    tier: "importante",
    category: "saude",
    appliesTo: "repo",
    hint: "Push nos últimos 12 meses mostra projeto vivo.",
  },
  // Modo perfil
  {
    id: "profile_readme_present",
    label: "README de perfil presente",
    tier: "essencial",
    category: "perfil",
    appliesTo: "perfil",
    hint: "O README do perfil é a sua vitrine na página inicial.",
  },
  {
    id: "profile_readme_substance",
    label: "README de perfil com conteúdo",
    tier: "importante",
    category: "perfil",
    appliesTo: "perfil",
    hint: "Pelo menos 200 caracteres apresentando você.",
  },
  {
    id: "profile_bio",
    label: "Bio preenchida",
    tier: "essencial",
    category: "perfil",
    appliesTo: "perfil",
    hint: "A bio resume quem você é em uma linha.",
  },
  {
    id: "profile_repos_count",
    label: "Repositórios públicos suficientes",
    tier: "essencial",
    category: "perfil",
    appliesTo: "perfil",
    hint: "Pelo menos 3 repositórios públicos para mostrar trabalho.",
  },
  {
    id: "profile_links",
    label: "Links de contato",
    tier: "importante",
    category: "perfil",
    appliesTo: "perfil",
    hint: "Site, email ou Twitter/X facilitam o contato.",
  },
  {
    id: "profile_location_company",
    label: "Localização ou empresa",
    tier: "opcional",
    category: "perfil",
    appliesTo: "perfil",
  },
  {
    id: "profile_repos_described",
    label: "Repositórios com descrição",
    tier: "importante",
    category: "perfil",
    appliesTo: "perfil",
    hint: "Descrições nos repos próprios ajudam quem visita.",
  },
  {
    id: "profile_activity",
    label: "Atividade recente",
    tier: "importante",
    category: "perfil",
    appliesTo: "perfil",
    hint: "Algum repositório com push nos últimos 12 meses.",
  },
];

// Resultado das checagens determinísticas

export interface GithubCheckResult {
  id: string;
  label: string;
  category: CheckCategory;
  tier: CheckTier;
  status: CheckStatus;
  detail: string;
}

export interface DeterministicResult {
  mode: AnalysisMode;
  score: number;
  band: ScoreBand;
  checks: GithubCheckResult[];
  /** Confianca da leitura, derivada de contagens objetivas. Nao afeta o score. */
  suficiencia: Suficiencia;
  /** Frase curta explicando a suficiencia quando ela nao e alta. */
  suficienciaRazao: string;
}

// Parte qualitativa (response_format da IA no próximo passo)

export const PRIORIDADES = ["alta", "media", "baixa"] as const;
export const PrioridadeSchema = z.enum(PRIORIDADES);
export type Prioridade = (typeof PRIORIDADES)[number];

export const GithubMelhoriaSchema = z.object({
  prioridade: PrioridadeSchema.describe(
    "Prioridade da melhoria: alta, media ou baixa.",
  ),
  titulo: z.string().describe("Título curto e direto da melhoria sugerida."),
  comoFazer: z
    .string()
    .describe(
      "Como aplicar a melhoria em 2 a 4 frases, comecando por um primeiro passo executavel hoje e citando nome de arquivo ou configuracao quando aplicavel.",
    ),
});

export const GithubQualitativeSchema = z.object({
  resumo: z
    .string()
    .describe(
      "Resumo geral em uma ou duas frases sobre o estado do perfil ou repositório.",
    ),
  // Lembrete de compat: o toOpenAIStrictSchema REMOVE min/max do JSON Schema
  // enviado a OpenAI, mas o safeParse local os aplica (violacao vira retry,
  // como no resume-analyzer). Por isso o SYSTEM_PROMPT tambem declara as
  // quantidades explicitamente.
  pontosFortes: z
    .array(z.string())
    .min(3)
    .max(6)
    .describe("Pontos fortes observados no perfil ou repositório (3 a 6)."),
  pontosFracos: z
    .array(z.string())
    .min(3)
    .max(6)
    .describe(
      "Pontos fracos ou lacunas observadas no perfil ou repositório (3 a 6).",
    ),
  melhorias: z
    .array(GithubMelhoriaSchema)
    .min(4)
    .max(7)
    .describe(
      "Melhorias priorizadas e acionáveis, da mais alta para a mais baixa prioridade (4 a 7).",
    ),
  proximoPasso: z
    .string()
    .describe(
      "A UNICA acao de maior impacto que a pessoa consegue executar hoje, concreta e especifica ao perfil/repo analisado.",
    ),
  readmeSugestao: z
    .string()
    .nullable()
    .describe(
      "Sugestão de README em markdown quando fizer sentido, ou null se não se aplica.",
    ),
});

export type GithubMelhoria = z.infer<typeof GithubMelhoriaSchema>;
export type GithubQualitative = z.infer<typeof GithubQualitativeSchema>;

// Resposta futura do endpoint (determinística + qualitativa + metadados de exibição)

export interface RepoMetadata {
  primaryLanguage: string | null;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  openIssues: number;
  pushedAt: string | null;
}

export interface ProfileTopRepo {
  name: string;
  description: string | null;
  primaryLanguage: string | null;
  stars: number;
}

export interface ProfileMetadata {
  publicRepos: number;
  followers: number;
  topRepos: ProfileTopRepo[];
}

export type GithubAnalysisMetadata = RepoMetadata | ProfileMetadata;

export interface GithubAnalysisTarget {
  kind: AnalysisMode;
  login: string;
  repo: string | null;
  htmlUrl: string;
}

export interface GithubAnalysisResponse {
  mode: AnalysisMode;
  /** Area alvo resolvida da analise (slug valido ou "geral"). Afeta so a prosa da IA. */
  area: AreaSelection;
  target: GithubAnalysisTarget;
  deterministic: DeterministicResult;
  metadata: GithubAnalysisMetadata;
  qualitative: GithubQualitative;
}
