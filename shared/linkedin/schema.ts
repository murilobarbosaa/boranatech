import { z } from "zod";

import { AREA_SLUGS } from "../areas";

/**
 * Contrato do analisador de LinkedIn.
 *
 * Mesmas decisões de design de shared/github/schema.ts: a nota é
 * determinística (derivada dos checks, ver server/lib/linkedinChecks.ts),
 * a IA NÃO dá nota e só preenche a parte qualitativa
 * (LinkedinQualitativeSchema). Campos qualitativos sem dado obrigatório
 * usam .nullable(), todo campo tem .describe() e os conjuntos fechados
 * são enums declarados com "as const".
 */

// Enums de formulário e contexto

export const LINKEDIN_LEVELS = [
  "estagio",
  "trainee",
  "junior",
  "transicao",
  "freelancer",
] as const;
export const LinkedinLevelSchema = z.enum(LINKEDIN_LEVELS);
export type LinkedinLevel = (typeof LINKEDIN_LEVELS)[number];

export const LINKEDIN_LEVEL_LABELS: Record<LinkedinLevel, string> = {
  estagio: "Estágio",
  trainee: "Trainee",
  junior: "Júnior",
  transicao: "Transição de carreira",
  freelancer: "Freelancer",
};

export const MERCADOS = ["brasil", "exterior", "ambos"] as const;
export const MercadoSchema = z.enum(MERCADOS);
export type Mercado = (typeof MERCADOS)[number];

export const MERCADO_LABELS: Record<Mercado, string> = {
  brasil: "Brasil",
  exterior: "Internacional (gringa)",
  ambos: "Os dois",
};

export const SIM_NAO = ["sim", "nao"] as const;
export const SimNaoSchema = z.enum(SIM_NAO);
export type SimNao = (typeof SIM_NAO)[number];

export const OPEN_TO_WORK = ["sim", "nao", "nao-sei"] as const;
export const OpenToWorkSchema = z.enum(OPEN_TO_WORK);
export type OpenToWork = (typeof OPEN_TO_WORK)[number];

export const CONEXOES = ["ate-50", "50-100", "100-500", "500-mais"] as const;
export const ConexoesSchema = z.enum(CONEXOES);
export type Conexoes = (typeof CONEXOES)[number];

export const ATIVIDADE = ["nunca", "raramente", "semanal", "diaria"] as const;
export const AtividadeSchema = z.enum(ATIVIDADE);
export type Atividade = (typeof ATIVIDADE)[number];

// Tiers, categorias e pesos

export const CHECK_TIERS = ["essencial", "importante", "opcional"] as const;
export type LinkedinCheckTier = (typeof CHECK_TIERS)[number];

export const LINKEDIN_CATEGORIES = [
  "encontrabilidade",
  "headline",
  "sobre",
  "experiencias",
  "skills",
  "sinais",
] as const;
export type LinkedinCheckCategory = (typeof LINKEDIN_CATEGORIES)[number];

export const LINKEDIN_CATEGORY_LABELS: Record<LinkedinCheckCategory, string> = {
  encontrabilidade: "Encontrabilidade",
  headline: "Headline",
  sobre: "Sobre",
  experiencias: "Experiências",
  skills: "Competências",
  sinais: "Sinais do perfil",
};

export const CHECK_FONTES = ["pdf", "form", "ambos"] as const;
export type LinkedinCheckFonte = (typeof CHECK_FONTES)[number];

// Pesos por tier, iguais aos do analisador de GitHub.
// Check aprovado soma o peso cheio, reprovado soma zero.
export const TIER_WEIGHTS: Record<LinkedinCheckTier, number> = {
  essencial: 10,
  importante: 6,
  opcional: 3,
};

// Faixas de nota

export const LINKEDIN_FAIXAS = [
  "inicio",
  "em-construcao",
  "forte",
  "magnetico",
] as const;
export const LinkedinFaixaSchema = z.enum(LINKEDIN_FAIXAS);
export type LinkedinFaixa = (typeof LINKEDIN_FAIXAS)[number];

export const FAIXA_LABELS: Record<LinkedinFaixa, string> = {
  inicio: "Início",
  "em-construcao": "Em construção",
  forte: "Forte",
  magnetico: "Magnético",
};

export function faixaFromScore(score: number): LinkedinFaixa {
  if (score <= 39) return "inicio";
  if (score <= 69) return "em-construcao";
  if (score <= 89) return "forte";
  return "magnetico";
}

// Catálogo de checks. Fonte única de rótulos para servidor e front.

export interface LinkedinCheckCatalogEntry {
  id: string;
  label: string;
  /** Tier base. Pode ser sobrescrito por mercado via tierByMercado. */
  tier: LinkedinCheckTier;
  category: LinkedinCheckCategory;
  /** De onde vem o dado: texto extraído do PDF, formulário, ou os dois. */
  fonte: LinkedinCheckFonte;
  hint?: string;
  /** Override de tier por mercado-alvo (ex: termos-bilingues). */
  tierByMercado?: Partial<Record<Mercado, LinkedinCheckTier>>;
  /** Mercados onde o check se aplica. Ausente = aplica a todos. */
  appliesToMercado?: readonly Mercado[];
}

export const LINKEDIN_CHECK_CATALOG: LinkedinCheckCatalogEntry[] = [
  // Headline
  {
    id: "headline-existe",
    label: "Headline presente",
    tier: "essencial",
    category: "headline",
    fonte: "pdf",
    hint: "A headline é o campo mais valioso do perfil: aparece em toda busca.",
  },
  {
    id: "headline-cargo-alvo",
    label: "Headline com o cargo-alvo",
    tier: "essencial",
    category: "headline",
    fonte: "ambos",
    hint: "Recrutadores buscam pelo nome do cargo. Ele precisa estar literal na headline.",
  },
  {
    id: "headline-stack",
    label: "Headline com tecnologias",
    tier: "importante",
    category: "headline",
    fonte: "pdf",
    hint: "Pelo menos 2 tecnologias na headline ajudam nas buscas booleanas.",
  },
  {
    id: "headline-tamanho",
    label: "Headline com tamanho bom",
    tier: "importante",
    category: "headline",
    fonte: "pdf",
    hint: "Entre 40 e 220 caracteres: nem só um título seco, nem texto cortado.",
  },
  {
    id: "headline-sem-cliche",
    label: "Headline sem clichês",
    tier: "opcional",
    category: "headline",
    fonte: "pdf",
    hint: "Frases como 'apaixonado por tecnologia' não aparecem em nenhuma busca.",
  },
  // Sobre
  {
    id: "sobre-existe",
    label: "Seção Sobre presente",
    tier: "essencial",
    category: "sobre",
    fonte: "pdf",
    hint: "O Sobre é indexado pela busca e é onde você conta sua história.",
  },
  {
    id: "sobre-gancho",
    label: "Sobre com gancho na primeira frase",
    tier: "importante",
    category: "sobre",
    fonte: "pdf",
    hint: "Só a primeira linha aparece antes do 'ver mais'. Ela precisa prender.",
  },
  {
    id: "sobre-stack",
    label: "Sobre menciona a stack",
    tier: "importante",
    category: "sobre",
    fonte: "pdf",
    hint: "Tecnologias escritas por extenso no Sobre entram no índice da busca.",
  },
  {
    id: "sobre-cta",
    label: "Sobre com convite ao contato",
    tier: "importante",
    category: "sobre",
    fonte: "pdf",
    hint: "Fechar com um convite claro aumenta as mensagens de recrutadores.",
  },
  {
    id: "sobre-tamanho",
    label: "Sobre com tamanho bom",
    tier: "opcional",
    category: "sobre",
    fonte: "pdf",
    hint: "Entre 500 e 2200 caracteres: com substância, sem virar um texto infinito.",
  },
  // Experiências
  {
    id: "exp-existe",
    label: "Pelo menos uma experiência",
    tier: "essencial",
    category: "experiencias",
    fonte: "pdf",
    hint: "Projetos próprios cadastrados como experiência contam, e é prática legítima.",
  },
  {
    id: "exp-descricoes",
    label: "Experiências com descrição",
    tier: "essencial",
    category: "experiencias",
    fonte: "pdf",
    hint: "Experiência sem descrição não conta história nem entra bem na busca.",
  },
  {
    id: "exp-verbos-acao",
    label: "Descrições com verbos de ação",
    tier: "importante",
    category: "experiencias",
    fonte: "pdf",
    hint: "Comece bullets com desenvolvi, criei, implementei, automatizei.",
  },
  {
    id: "exp-tecnologias",
    label: "Descrições com tecnologias",
    tier: "importante",
    category: "experiencias",
    fonte: "pdf",
    hint: "Os títulos e descrições das experiências pesam muito na busca.",
  },
  {
    id: "exp-resultados",
    label: "Descrições com números e resultados",
    tier: "opcional",
    category: "experiencias",
    fonte: "pdf",
    hint: "Métricas e percentuais dão prova concreta do que você entregou.",
  },
  // Encontrabilidade
  {
    id: "cargo-em-experiencia",
    label: "Cargo-alvo em algum título de experiência",
    tier: "importante",
    category: "encontrabilidade",
    fonte: "ambos",
    hint: "Os títulos de experiência são um dos campos que mais pesam na busca.",
  },
  {
    id: "cobertura-keywords-area",
    label: "Cobertura básica das palavras-chave da área",
    tier: "essencial",
    category: "encontrabilidade",
    fonte: "ambos",
    hint: "Pelo menos metade das tecnologias-chave da área no perfil.",
  },
  {
    id: "cobertura-keywords-otima",
    label: "Cobertura ótima das palavras-chave da área",
    tier: "importante",
    category: "encontrabilidade",
    fonte: "ambos",
    hint: "75% ou mais das tecnologias-chave da área no perfil.",
  },
  {
    id: "termos-bilingues",
    label: "Cargo-alvo em português e em inglês",
    tier: "opcional",
    category: "encontrabilidade",
    fonte: "pdf",
    hint: "Recrutadores buscam nos dois idiomas, mesmo para vagas no Brasil.",
    tierByMercado: { ambos: "essencial" },
    appliesToMercado: ["brasil", "ambos"],
  },
  // Skills (formulário)
  {
    id: "skills-quantidade",
    label: "Pelo menos 10 competências cadastradas",
    tier: "essencial",
    category: "skills",
    fonte: "form",
    hint: "As competências cadastradas são filtro direto no LinkedIn Recruiter.",
  },
  {
    id: "skills-cobertura",
    label: "Competências cobrem as palavras-chave da área",
    tier: "essencial",
    category: "skills",
    fonte: "ambos",
    hint: "Metade ou mais das tecnologias-chave da área nas suas competências.",
  },
  {
    id: "skills-quantidade-otima",
    label: "25 ou mais competências cadastradas",
    tier: "opcional",
    category: "skills",
    fonte: "form",
  },
  // Sinais (formulário)
  {
    id: "foto-profissional",
    label: "Foto de perfil profissional",
    tier: "essencial",
    category: "sinais",
    fonte: "form",
    hint: "Perfis com foto recebem muito mais visitas e mensagens.",
  },
  {
    id: "banner-personalizado",
    label: "Banner personalizado",
    tier: "opcional",
    category: "sinais",
    fonte: "form",
  },
  {
    id: "open-to-work",
    label: "Open to Work configurado",
    tier: "importante",
    category: "sinais",
    fonte: "form",
    hint: "Configurado para recrutadores, é filtro direto nas buscas deles.",
  },
  {
    id: "conexoes",
    label: "Rede com 100 ou mais conexões",
    tier: "importante",
    category: "sinais",
    fonte: "form",
    hint: "Mais conexões aumentam o alcance do perfil nos resultados.",
  },
  {
    id: "atividade",
    label: "Atividade recente no LinkedIn",
    tier: "opcional",
    category: "sinais",
    fonte: "form",
    hint: "Interagir toda semana mantém o perfil vivo no feed e na busca.",
  },
  // Apenas mercado exterior
  {
    id: "headline-em-ingles",
    label: "Headline em inglês",
    tier: "essencial",
    category: "headline",
    fonte: "pdf",
    hint: "Recrutadores internacionais buscam em inglês.",
    appliesToMercado: ["exterior"],
  },
  {
    id: "sobre-em-ingles",
    label: "Sobre em inglês",
    tier: "essencial",
    category: "sobre",
    fonte: "pdf",
    hint: "Para mercado internacional, o Sobre precisa estar em inglês.",
    appliesToMercado: ["exterior"],
  },
];

/** Tier efetivo do check para o mercado-alvo do usuário. */
export function resolveTier(
  entry: LinkedinCheckCatalogEntry,
  mercado: Mercado,
): LinkedinCheckTier {
  return entry.tierByMercado?.[mercado] ?? entry.tier;
}

/** O check entra na análise (e no denominador da nota) para esse mercado? */
export function checkAppliesToMercado(
  entry: LinkedinCheckCatalogEntry,
  mercado: Mercado,
): boolean {
  return !entry.appliesToMercado || entry.appliesToMercado.includes(mercado);
}

// Resultado das checagens determinísticas

export interface LinkedinCheckResult {
  id: string;
  label: string;
  category: LinkedinCheckCategory;
  /** Tier já resolvido para o mercado-alvo da análise. */
  tier: LinkedinCheckTier;
  aprovado: boolean;
  detail: string;
}

/**
 * Nota 0 a 100: soma dos pesos dos checks aprovados sobre a soma dos pesos
 * de todos os checks aplicáveis ao contexto, arredondada. Checks não
 * aplicáveis ao mercado nem entram no array, então ficam fora do denominador.
 */
export function computeLinkedinScore(checks: LinkedinCheckResult[]): {
  score: number;
  faixa: LinkedinFaixa;
} {
  let possivel = 0;
  let ganho = 0;
  for (const check of checks) {
    const weight = TIER_WEIGHTS[check.tier];
    possivel += weight;
    if (check.aprovado) ganho += weight;
  }
  const score = possivel === 0 ? 0 : Math.round((100 * ganho) / possivel);
  return { score, faixa: faixaFromScore(score) };
}

export interface TituloInglesMatch {
  titulo: string;
  encontrado: boolean;
}

export interface LinkedinDeterministicResult {
  score: number;
  faixa: LinkedinFaixa;
  checks: LinkedinCheckResult[];
  /** Tecnologias-chave da área presentes no perfil (pdf + skills coladas). */
  keywordsEncontradas: string[];
  /** Tecnologias-chave da área ausentes do perfil. */
  keywordsFaltantes: string[];
  /** Títulos de busca em inglês da área, casados ou não contra o perfil. */
  titulosIngles: TituloInglesMatch[];
  headline: string | null;
  sobreTamanho: number;
  experienciasContagem: number;
  skillsContagem: number;
}

// Parte qualitativa (response_format da IA)

export const PRIORIDADES = ["alta", "media", "baixa"] as const;
export const LinkedinPrioridadeSchema = z.enum(PRIORIDADES);
export type LinkedinPrioridade = (typeof PRIORIDADES)[number];

export const LinkedinMelhoriaSchema = z.object({
  prioridade: LinkedinPrioridadeSchema.describe(
    "Prioridade da melhoria: alta, media ou baixa.",
  ),
  titulo: z.string().describe("Título curto e direto da melhoria sugerida."),
  comoFazer: z
    .string()
    .describe("Passo a passo concreto de como aplicar a melhoria."),
});

export const LinkedinBulletsReescritosSchema = z.object({
  contexto: z
    .string()
    .describe("A qual experiência ou projeto do perfil os bullets se referem."),
  bullets: z
    .array(z.string())
    .describe(
      "3 a 5 bullets prontos para colar, cada um com verbo de ação, o que foi feito, a tecnologia usada e resultado quando houver.",
    ),
});

export const LinkedinQualitativeSchema = z.object({
  resumo: z
    .string()
    .describe(
      "Diagnóstico geral do perfil em 2 a 4 frases, com tom calibrado pela faixa da nota.",
    ),
  // Lembrete de compat: o toOpenAIStrictSchema REMOVE min/max do JSON Schema
  // enviado a OpenAI, mas o safeParse local os aplica (violacao vira retry,
  // como no resume-analyzer e no GitHub). Por isso o SYSTEM_PROMPT tambem
  // declara as quantidades explicitamente.
  pontosFortes: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe("3 a 5 pontos fortes observados no perfil."),
  pontosFracos: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe("3 a 5 pontos fracos ou lacunas observadas no perfil."),
  melhorias: z
    .array(LinkedinMelhoriaSchema)
    .min(4)
    .max(7)
    .describe(
      "Melhorias priorizadas e acionáveis, da mais alta para a mais baixa prioridade (4 a 7).",
    ),
  proximoPasso: z
    .string()
    .describe(
      "A UNICA acao de maior impacto que a pessoa consegue executar hoje, concreta e especifica ao perfil analisado.",
    ),
  headlines: z
    .array(z.string())
    .length(3)
    .describe(
      "Exatamente 3 reescritas da headline na fórmula cargo, stack e diferencial, com até 220 caracteres cada e sem clichês. Idioma pela regra do mercado-alvo: inglês para mercado exterior, e para mercado Brasil ou ambos o cargo e as tecnologias podem ficar em inglês com o restante em português.",
    ),
  sobreReescrito: z
    .string()
    .describe(
      "Seção Sobre completa pronta para colar: gancho na primeira linha, parágrafo de prova com projetos, stack explícita em texto corrido e convite ao contato no final. Idioma pela regra do mercado-alvo: inglês para mercado exterior; português para Brasil; para ambos, em português com um parágrafo final em inglês resumindo perfil e disponibilidade.",
    ),
  bulletsReescritos: z
    .array(LinkedinBulletsReescritosSchema)
    .describe(
      "Bullets reescritos por experiência ou projeto do perfil. Idioma pela regra do mercado-alvo: inglês para mercado exterior; para Brasil ou ambos, português com os termos técnicos em inglês.",
    ),
  skillsSugeridas: z
    .array(z.string())
    .describe(
      "Competências que faltam e que a pessoa provavelmente pode adicionar com honestidade, baseadas nas palavras-chave faltantes e no que o perfil já evidencia.",
    ),
  modeloMensagemRecrutador: z
    .string()
    .describe(
      "Mensagem curta de conexão ou abordagem que a pessoa pode enviar a recrutadores da área, personalizada com o cargo-alvo. Em inglês quando o mercado for exterior, em português nos demais casos.",
    ),
});

export type LinkedinMelhoria = z.infer<typeof LinkedinMelhoriaSchema>;
export type LinkedinBulletsReescritos = z.infer<
  typeof LinkedinBulletsReescritosSchema
>;
export type LinkedinQualitative = z.infer<typeof LinkedinQualitativeSchema>;

// Request do endpoint de análise

export const LinkedinAnalyzeRequestSchema = z.object({
  profileText: z.string().min(200).max(12_000),
  area: z.enum(AREA_SLUGS),
  level: LinkedinLevelSchema,
  mercado: MercadoSchema,
  skills: z.string().max(3_000),
  foto: SimNaoSchema,
  banner: SimNaoSchema,
  openToWork: OpenToWorkSchema,
  conexoes: ConexoesSchema,
  atividade: AtividadeSchema,
  objetivo: z.string().max(300).optional(),
});

export type LinkedinAnalyzeRequest = z.infer<
  typeof LinkedinAnalyzeRequestSchema
>;

// Resposta do endpoint

export interface LinkedinAnalysisResponse {
  area: (typeof AREA_SLUGS)[number];
  level: LinkedinLevel;
  mercado: Mercado;
  deterministic: LinkedinDeterministicResult;
  qualitative: LinkedinQualitative;
}

// Histórico (GET /api/linkedin/analyses)

export interface LinkedinAnalysisSummary {
  id: string;
  area: string;
  level: string;
  score: number;
  faixa: string;
  created_at: string;
}

export interface LinkedinAnalysisRecord extends LinkedinAnalysisSummary {
  result: LinkedinAnalysisResponse;
}
