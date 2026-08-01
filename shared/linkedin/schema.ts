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
  "pleno",
  "transicao",
  "freelancer",
] as const;
export const LinkedinLevelSchema = z.enum(LINKEDIN_LEVELS);
export type LinkedinLevel = (typeof LINKEDIN_LEVELS)[number];

export const LINKEDIN_LEVEL_LABELS: Record<LinkedinLevel, string> = {
  estagio: "Estágio",
  trainee: "Trainee",
  junior: "Júnior",
  // TODO(Ana): revisar o rotulo do nivel pleno.
  pleno: "Pleno",
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
  /**
   * A leitura que alimenta este check está em dúvida?
   *
   * OBRIGATÓRIO na escrita, e é o único opcional deste payload cuja AUSÊNCIA
   * significaria "completo" em vez de "não sabemos" (`entryPath`, `textoHash` e
   * `headlineContexto` significam o contrário). Quatro opcionais no mesmo
   * objeto, um com semântica invertida, é como se erra. Por isso: escrever
   * sempre, e normalizar na leitura, para a ausência nunca chegar a ser
   * interpretada. Ver `readDeterministic`.
   *
   * `aprovado` continua com o veredito calculado, e a nota NÃO muda: o marcador
   * mexe no que a interface afirma (faixa e asterisco), não na aritmética.
   * Inércia provada em `reguaV2.pontosPendentes.test.ts`.
   */
  pendente?: boolean;
}

/**
 * Nota 0 a 100: soma dos pesos dos checks aprovados sobre a soma dos pesos
 * de todos os checks aplicáveis ao contexto, arredondada. Checks não
 * aplicáveis ao mercado nem entram no array, então ficam fora do denominador.
 */
/**
 * Dado NOSSO chegou invalido ao calculo da nota.
 *
 * Existe para a rota poder distinguir isto de falha de terceiro. Antes, um tier
 * corrompido caia no ramo generico do catch e virava `502 upstream_error`, com
 * a mensagem "Nao foi possivel concluir a analise agora": quem fosse
 * diagnosticar comecaria olhando a OpenAI, e o problema esta no payload.
 *
 * Erro classificado pela CAMADA onde foi capturado, e nao pela ORIGEM, manda o
 * diagnostico para o lugar errado. E a razao de esta classe existir em vez de
 * um `Error` cru.
 *
 * Mora aqui, ao lado de quem lanca, e nao em `server/lib/linkedinAnalyze.ts`
 * com as irmas (`LinkedinUnreadableError`, `LinkedinTruncatedError`): a funcao
 * que lanca e compartilhada, e `shared/` nao pode importar de `server/`.
 */
export class LinkedinDadoInvalidoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LinkedinDadoInvalidoError";
  }
}

export function computeLinkedinScore(checks: LinkedinCheckResult[]): {
  score: number;
  faixa: LinkedinFaixa;
} {
  // SEM teto para os sinais autodeclarados, e a ausencia e decisao, nao
  // esquecimento. Um teto de 12 pontos chegou a existir na regua v2 e foi
  // revertido: a simulacao sobre as 107 mostrou que 100% do movimento para
  // baixo e 100% dos 13 rebaixamentos vinham dele, e que ele so tirava ponto de
  // quem respondeu a verdade sobre foto, banner e Open to Work, que sao acoes
  // que valem de fato e sao as mais faceis de executar. O risco de inflacao
  // fica com os dois mecanismos que nasceram depois: o bloco separado de "voce
  // declarou" (torna visivel) e `mudancaSoDeAutodeclaracao` (torna
  // nao-gamificavel).
  let possivel = 0;
  let ganho = 0;
  for (const check of checks) {
    const weight = TIER_WEIGHTS[check.tier];
    // LANCA, e nao devolve peso de fallback. Esta e a excecao deliberada a
    // regra dos resolvers, e o criterio que a separa esta no CLAUDE.md:
    // fallback serve para valor de APRESENTACAO (cor, rotulo, icone), onde
    // degradar mantem a informacao certa. Aqui o peso E a informacao.
    //
    // Sem isto, `undefined` entrava na soma e a nota inteira saia `NaN`, sem
    // erro nenhum. Peso zero ou peso de `opcional` seriam PIORES que o NaN:
    // devolveriam um numero plausivel que ninguem consegue distinguir de
    // correto, e a auditoria desta base tem uma instancia exata disso (o
    // `contarLinhas` devolvendo -1, em que falha de rede virou "protegida").
    //
    // Um tier fora do catalogo nao e valor novo do dominio: e payload
    // corrompido ou versao futura lida por codigo antigo. Nao existe leitura
    // correta dele. Esta funcao roda no SERVIDOR, dentro do try da rota, entao
    // a excecao vira 500 com evento no Sentry, nao tela branca.
    if (typeof weight !== "number") {
      throw new LinkedinDadoInvalidoError(
        `[linkedin] tier fora do catalogo ao calcular a nota: ` +
          `tier=${JSON.stringify(check.tier)} check.id=${JSON.stringify(check.id)}. ` +
          `Tiers validos: ${Object.keys(TIER_WEIGHTS).join(", ")}.`,
      );
    }
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

/** Campos do perfil onde uma palavra-chave pode estar escrita. */
export const LINKEDIN_CAMPOS = [
  "headline",
  "sobre",
  "experiencias",
  "competencias",
] as const;
export type LinkedinCampo = (typeof LINKEDIN_CAMPOS)[number];

export const LINKEDIN_CAMPO_LABELS: Record<LinkedinCampo, string> = {
  headline: "Headline",
  sobre: "Sobre",
  experiencias: "Experiências",
  competencias: "Competências",
};

/**
 * Onde uma tecnologia-chave da área está hoje e onde ela deveria estar.
 *
 * Existe por causa de uma reclamação concreta: a plataforma dizia "sua
 * cobertura é 27%, adicione palavras-chave" e a pessoa não tinha como saber em
 * QUAL campo escrever. A cobertura é calculada sobre o perfil inteiro, então a
 * nota não distingue campo nenhum; esta decomposição não muda a nota, ela só
 * conta onde o termo está.
 *
 * `destino` é derivado do que o próprio catálogo de checks já afirma sobre
 * busca de recrutador, não de opinião nova:
 *   - competências é o campo por onde o recrutador FILTRA, e é o destino de
 *     toda tecnologia que o perfil comprova (`skills-cobertura`);
 *   - a headline "aparece em toda busca" e vale pelo menos 2 tecnologias
 *     (`headline-stack`);
 *   - o Sobre "é indexado pela busca" e vale a stack escrita por extenso
 *     (`sobre-stack`).
 * Tecnologia sem nenhuma evidência no perfil não recebe destino: não há campo
 * onde escrevê-la sem mentir, e ela vai para a lista de estudo.
 */
export interface LinkedinKeywordCampos {
  termo: string;
  /** Campos onde o termo aparece hoje. Vazio = não aparece em lugar nenhum. */
  presenteEm: LinkedinCampo[];
  /** Campos onde ele deveria estar e não está. Vazio quando não há evidência. */
  faltaEm: LinkedinCampo[];
  /** O perfil comprova o termo em algum campo? */
  comprovado: boolean;
}

export interface LinkedinDeterministicResult {
  score: number;
  faixa: LinkedinFaixa;
  /**
   * A nota está incompleta porque alguma leitura está em dúvida?
   *
   * Booleano próprio, e NÃO um valor novo em `LINKEDIN_FAIXAS`: a coluna
   * `faixa` é `text not null` sem constraint e tem leitores fora do jsonb, e o
   * bundle antigo na janela de deploy ignora o campo que não conhece e mostra a
   * faixa calculada (o comportamento de hoje). Valor novo no enum daria chip
   * vazio lá. Mesma regra de escrita obrigatória do `pendente`.
   */
  notaIncompleta?: boolean;
  checks: LinkedinCheckResult[];
  /** Tecnologias-chave da área presentes no perfil (pdf + skills coladas). */
  keywordsEncontradas: string[];
  /** Tecnologias-chave da área ausentes do perfil. */
  keywordsFaltantes: string[];
  /**
   * Tecnologias que o perfil COMPROVA e que não estão nas competências
   * coladas: `keywordsEncontradas` menos as encontradas no campo de skills.
   * Calculado em código (é subtração de conjuntos, não curadoria).
   *
   * OPCIONAL de propósito: as análises gravadas antes da v3 não têm este
   * campo. Quem lê análise persistida precisa tolerar a ausência.
   */
  skillsParaAdicionarAgora?: string[];
  /**
   * Onde cada tecnologia-chave da área está e onde ela deveria estar.
   *
   * OPCIONAL de propósito, como `skillsParaAdicionarAgora`: análise gravada
   * antes da v4 não tem este campo. Ver `readDeterministic`.
   */
  keywordsCampos?: LinkedinKeywordCampos[];
  /**
   * Texto do perfil usado SÓ para deduplicar recomendação de curso: formação,
   * certificações, headline e competências. Não entra em check nenhum.
   *
   * Persistido de propósito: é o que faz a mesma análise reaberta recomendar os
   * mesmos cursos. OPCIONAL, análise anterior à Fase 2B não tem.
   */
  perfilDedup?: string;
  /**
   * Comprimento da descrição de CADA experiência, na ordem em que o parser as
   * leu. Só números, nunca texto de ninguém.
   *
   * Existe por causa de uma pergunta que a simulação da régua v2 não conseguiu
   * responder (`docs/simulacao-regua-v2.md`, seção 3): quantas das 107 análises
   * têm alguma experiência sem descrição própria. O agregado `exp-descricoes`
   * olha a concatenação, então uma experiência vazia entre quatro cheias passa
   * despercebida, e o texto por experiência nunca foi persistido. Sem isto, a
   * resposta é um intervalo de "0 a 70"; com isto, é exata.
   *
   * NÃO entra em check nenhum e não bumpa versão: campo novo, opcional, que
   * nenhuma régua lê (critério em DETERMINISTIC_VERSION).
   */
  experienciasDescricaoTamanhos?: number[];
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
  // Um campo so ("skillsSugeridas") carregava dois significados incompativeis:
  // "adicione isto hoje" e "estude isto". Como ele era derivado da lista de
  // faltantes, a ferramenta acabava mandando um dev JavaScript anunciar Ruby e
  // Elixir nas competencias. Separado em dois, cada um com a sua regra.
  // skillsParaAdicionarAgora NAO esta aqui de proposito: e subtracao de
  // conjuntos, calculada em deterministic. Pedir aritmetica ao modelo foi a
  // ultima fonte de invencao medida. Ele escreve so a prosa em volta.
  skillsParaEstudar: z
    .array(z.string())
    .describe(
      "De 3 a 6 tecnologias ESCOLHIDAS da lista de tecnologias sem evidência no perfil que você recebeu, priorizando as mais úteis para a área e o nível da pessoa. Só valem itens daquela lista, copiados exatamente como aparecem nela: não invente nem reescreva nome de tecnologia. É trilha de estudo, NÃO é para colar no perfil, e a pessoa não deve adicionar nenhuma delas às competências antes de saber usar. Justifique a escolha em uma das melhorias. Lista vazia é válida quando a lista de origem vier vazia.",
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
  /**
   * Por onde o texto entrou: PDF, colagem manual, ou revisão de sessão restaurada.
   *
   * OPCIONAL de propósito, e não é preguiça de validação: o deploy não é atômico
   * (Vercel e Railway sobem separados, janela de 1 a 3 minutos), então o backend
   * novo precisa aceitar o bundle antigo, que não manda este campo. Obrigatório
   * aqui derrubaria toda análise da janela com 400.
   *
   * Existe porque a ausência dele custou uma investigação inteira: com uma
   * headline errada persistida em produção não havia como distinguir bug do
   * parser de PDF de bug da colagem manual, e o valor JÁ existia no browser
   * (`EntryPath` em LinkedinAnalisar.tsx) sem nunca sair de lá.
   */
  entryPath: z.enum(["pdf", "manual", "review"]).optional(),
});

export type LinkedinAnalyzeRequest = z.infer<
  typeof LinkedinAnalyzeRequestSchema
>;

// Resposta do endpoint

/**
 * Versão do formato de `qualitative`, estampada no result a cada escrita.
 *
 * 1 (implícita, ausente nas linhas gravadas até 2026-07-26): tinha
 *   `skillsSugeridas`, um campo só, derivado das palavras-chave faltantes.
 * 2: `skillsSugeridas` deu lugar a `skillsParaAdicionarAgora` e
 *   `skillsParaEstudar`, os dois escritos pelo modelo.
 * 3: `skillsParaAdicionarAgora` saiu do modelo e virou campo calculado em
 *   `deterministic`. O modelo escreve só `skillsParaEstudar`.
 *
 * Quem lê análise persistida NUNCA acessa `result.qualitative.x` direto: usa
 * `readQualitative` (shared/linkedin/readQualitative.ts), que resolve a versão
 * e degrada para render parcial. Ver CLAUDE.md, "Lookups por valor do servidor".
 */
export const QUALITATIVE_VERSION = 3;

/**
 * Versão do formato de `deterministic`, estampada no result a cada escrita.
 *
 * O QUE ELA SIGNIFICA: comparabilidade de NOTA entre duas análises, e só isso.
 * Duas análises de versões diferentes não podem virar delta nem celebração,
 * porque a régua mudou embaixo delas.
 *
 * QUANDO BUMPAR: quando a nota do MESMO perfil, sem a pessoa mexer em nada,
 * pode sair diferente (peso, limiar, catálogo de checks, ou o conteúdo que o
 * parser entrega à régua). QUANDO NÃO BUMPAR: campo novo, opcional, que nenhum
 * check lê. Ausência de campo é problema de leitura, e a leitura já é tolerante
 * por `safeParse` em `readDeterministic`, que não precisa de versão para
 * degradar.
 *
 * 1: formato original, estável desde a criação da tabela (verificado: as 107
 *   linhas persistidas têm exatamente as mesmas 10 chaves), mais o
 *   `skillsParaAdicionarAgora` acrescentado junto com a v3 do qualitative.
 * 2: Fase 1A. A leitura do PDF passou a normalizar quebra de linha e a remover
 *   rodapé de paginação ANTES do parse. Mesmos campos, mas o CONTEÚDO deles
 *   muda para o mesmo perfil: headline completa, competências sem fragmento,
 *   descrições sem ruído. Notas de v1 e v2 não são comparáveis entre si, e é
 *   por isso que o delta é suprimido quando as versões diferem.
 * 3: Fase 1B. O bloco de experiências passou a separar empresa de cargo, a
 *   terminar a descrição no cabeçalho do bloco seguinte (e não na data
 *   seguinte) e a reconhecer localização por forma, não por comprimento. Nas 6
 *   fixtures a nota não se moveu, mas isso é uma propriedade DELAS, não da
 *   régua: `cargo-em-experiencia` casa contra os títulos, e um perfil cuja
 *   empresa contém uma palavra de cargo ("Backend Solutions") passava por causa
 *   da empresa e agora não passa mais. Duas notas de versões diferentes não são
 *   comparáveis mesmo quando coincidem.
 *
 * 4: Régua v2 (Fase 3). Quatro mudanças que movem nota, todas medidas antes de
 *   virar código em `docs/simulacao-regua-v2.md`: cobertura por corte relativo
 *   ao tamanho da pool da área (variante C), `exp-descricoes` por experiência em
 *   vez do bloco concatenado, limiares de densidade modulados por `level`, e
 *   teto de peso para os sinais autodeclarados, que mexe no denominador e
 *   portanto desloca a nota de todo mundo. Nota de v3 e de v4 não são
 *   comparáveis, e o delta fica suprimido entre elas.
 *
 * 5: Fase 4. A régua NÃO mudou: mudou o CONTEÚDO que o parser entrega a ela,
 *   que é o quarto gatilho listado acima e o menos óbvio dos quatro. A headline
 *   podia ocupar mais de uma linha e `detectHeadline` escolhia uma só, então o
 *   cargo-alvo e metade da stack ficavam de fora do campo mais pesado do perfil.
 *   O índice errado ainda arrastava o corte do bloco de identidade, e o NOME da
 *   pessoa vazava para as competências lidas do PDF. Os dois somem juntos com a
 *   correção, e o mesmo perfil, sem a pessoa mexer em nada, passa a ver uma
 *   headline diferente chegando aos cinco checks de `headline-*` e às duas
 *   coberturas. 41 das 157 linhas persistidas (26%) carregam a assinatura do
 *   truncamento, e nelas o TETO de movimento é de 7 a 29 pontos.
 *
 *   Não deu para simular a nota nova linha a linha, e o motivo é uma lacuna de
 *   diagnóstico, não uma escolha: `profileText` não é persistido, e o
 *   `perfilDedup` que sobra vem sem quebra de linha nenhuma. O bug é de
 *   ESTRUTURA DE LINHA, então reparsear o dedup não reproduz nem corrige. O
 *   número acima é teto por peso de check, não medição.
 *
 * 6: o campo de competências parou de receber o que não é competência. O
 *   pré-preenchimento a partir do PDF escrevia `skillsPdf` inteiro no
 *   formulário quando a pessoa deixava o campo vazio, e `skillsPdf` às vezes
 *   carrega o bloco de identidade junto (nome, cidade, estado, país, e em
 *   três linhas o empregador ou a instituição). A régua não mudou e o parser
 *   não mudou: mudou o que ENTRA no campo `skills`, que é fonte de
 *   `skills-quantidade`, `skills-quantidade-otima` e das duas coberturas.
 *
 *   Medido sobre as 162 análises persistidas: em 17 o campo `skills` era
 *   exatamente o pré-preenchimento não editado E carregava excedente; dessas,
 *   7 PASSAVAM em `skills-quantidade` (essencial, 10 pontos) contando o
 *   próprio nome e a cidade como competência, e passam a reprovar. Movimento
 *   de 10 pontos em 194, sempre para baixo, em 7 de 162 (4,3%). As outras 10
 *   tinham de 4 a 6 itens, já reprovavam o corte de 10, e não se movem.
 *
 *   O bump é por comparabilidade e não por régua: o mesmo perfil, sem a pessoa
 *   mexer em nada, passa a declarar menos competências do que declarava.
 *
 * NÃO bumpado na Fase 2A, e a decisão é deliberada. A fase acrescentou
 * `keywordsCampos`, um campo OPCIONAL e puramente descritivo: nenhum check o
 * lê, a nota das 6 fixtures é idêntica, e a régua não mudou. O que esta
 * constante governa é COMPARABILIDADE DE NOTA, não formato de payload; bumpar
 * aqui suprimiria o delta e a celebração de todo mundo que tem análise em v3,
 * de graça. Precedente na própria v1: `skillsParaAdicionarAgora` entrou como
 * campo opcional sem bump, pelo mesmo motivo. A ausência do campo nas linhas
 * antigas é resolvida onde deve ser, em `readDeterministic`.
 *
 * O conjunto mínimo de leitura (`keywordsEncontradas`, `keywordsFaltantes`,
 * `titulosIngles`) passa por `readDeterministic`. Ver
 * docs/divida-leitura-persistida.md.
 */
export const DETERMINISTIC_VERSION = 6;

export interface LinkedinAnalysisResponse {
  area: (typeof AREA_SLUGS)[number];
  level: LinkedinLevel;
  mercado: Mercado;
  /** Ausente nas linhas da versão 1. Ver QUALITATIVE_VERSION. */
  qualitativeVersion?: number;
  /** Ausente nas linhas gravadas antes da Fase 0. Ver DETERMINISTIC_VERSION. */
  deterministicVersion?: number;
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
  /**
   * Versão da régua determinística que produziu esta nota. Ausente (null) nas
   * linhas gravadas antes do carimbo. Serve para o cliente saber que duas
   * notas NÃO são comparáveis, e não comemorar melhoria que não houve.
   */
  deterministicVersion?: number | null;
  /**
   * Vereditos dos checks desta análise, só id/category/aprovado.
   *
   * Existe para o cliente saber se a diferença para a análise seguinte veio SÓ
   * de autodeclaração (foto, banner, conexões) e, nesse caso, não mostrar delta
   * nem celebração. Sem isto seria uma segunda requisição por análise aberta.
   * Ausente nas linhas anteriores à régua v2.
   */
  checks?: { id: string; category: string; aprovado: boolean }[] | null;
}

export interface LinkedinAnalysisRecord extends LinkedinAnalysisSummary {
  result: LinkedinAnalysisResponse;
}
