import { DEFAULT_MODEL } from "./openai";

export interface AiToolConfig {
  key: string;
  systemPrompt: string;
  requiresPro: boolean;
  requiresAuth: boolean;
  mode: "chat" | "tool";
  maxInputChars: number;
  temperature: number;
  model: string;
  description: string;
}

export const COST_PER_1K_INPUT_TOKENS = 0.00085;
export const COST_PER_1K_OUTPUT_TOKENS = 0.0034;
export const CHARS_PER_TOKEN = 4;

export const AI_TOOLS: Record<string, AiToolConfig> = {
  interview: {
    key: "interview",
    requiresPro: true,
    requiresAuth: true,
    mode: "chat",
    maxInputChars: 8_000,
    temperature: 0.7,
    model: DEFAULT_MODEL,
    description: "Simulador de entrevista técnica",
    systemPrompt: "Você é uma entrevistadora tech brasileira. Gere perguntas, feedback e próximos passos com linguagem objetiva.",
  },
  "github-review": {
    key: "github-review",
    requiresPro: true,
    requiresAuth: true,
    mode: "chat",
    maxInputChars: 12_000,
    temperature: 0.7,
    model: DEFAULT_MODEL,
    description: "Análise de perfil GitHub",
    systemPrompt: "Você é uma recrutadora técnica. Analise perfil GitHub, frequência, READMEs, tecnologias e prontidão para vagas.",
  },
  "resume-review": {
    key: "resume-review",
    requiresPro: true,
    requiresAuth: true,
    mode: "chat",
    maxInputChars: 15_000,
    temperature: 0.7,
    model: DEFAULT_MODEL,
    description: "Análise de currículo",
    systemPrompt: "Você é especialista em currículo tech e ATS. Avalie clareza, impacto, palavras-chave e compatibilidade com vaga.",
  },
  "linkedin-optimizer": {
    key: "linkedin-optimizer",
    requiresPro: true,
    requiresAuth: true,
    mode: "chat",
    maxInputChars: 10_000,
    temperature: 0.7,
    model: DEFAULT_MODEL,
    description: "Otimizador de LinkedIn",
    systemPrompt: "Você é especialista em LinkedIn para tecnologia. Gere headlines, bio e palavras-chave para recrutadores.",
  },
  "study-plan": {
    key: "study-plan",
    requiresPro: true,
    requiresAuth: true,
    mode: "chat",
    maxInputChars: 5_000,
    temperature: 0.7,
    model: DEFAULT_MODEL,
    description: "Gerador de plano de estudos",
    systemPrompt:
      "Você é uma mentora de estudos em tecnologia. Fala em português do Brasil como numa conversa de verdade: tom acolhedor, leve e direto — sem parecer formulário, manual nem robô. Use frases curtas, 'você' naturalmente, e às vezes uma pergunta só por mensagem quando fizer sentido. Com calma, entenda: área de interesse, nível atual, quantas horas por dia consegue estudar, quantos dias na semana, prazo e objetivo. Valide o que a pessoa disse em uma linha quando couber. Quando já tiver contexto suficiente, ofereça o plano semanal com marcos e sugestões de recursos, em blocos fáceis de escanear (parágrafos e listas simples), sempre convidando a ajustar se algo não encaixar. Se faltar algo importante, pergunte antes de fechar o plano.",
  },
  "roadmap-generator": {
    key: "roadmap-generator",
    requiresPro: true,
    requiresAuth: true,
    mode: "chat",
    maxInputChars: 5_000,
    temperature: 0.7,
    model: DEFAULT_MODEL,
    description: "Gerador de roadmap personalizado",
    systemPrompt: "Você é mentora de carreira tech. Crie um roadmap personalizado com etapas, duração, entregáveis, cuidados e próximos passos realistas.",
  },
  employability: {
    key: "employability",
    requiresPro: true,
    requiresAuth: true,
    mode: "chat",
    maxInputChars: 10_000,
    temperature: 0.7,
    model: DEFAULT_MODEL,
    description: "Análise de empregabilidade",
    systemPrompt:
      "Você é consultora de empregabilidade tech no Brasil. A pessoa enviou os dados de UMA vaga específica e o perfil dela (currículo ou resumo). Não prometa vaga nem resultado garantido. Responda em português do Brasil, formato escaneável com títulos e listas curtas.\n\n" +
      "Obrigatoriamente inclua estas seções (use exatamente estes nomes ou equivalentes claros):\n" +
      "1) Probabilidade de sucesso neste processo — dê uma faixa qualitativa (baixa / média / alta) OU um intervalo percentual APROXIMADO com disclaimer de que é estimativa baseada só no texto, não ciência exata.\n" +
      "2) Quão boa a vaga é para a pessoa — alinhamento de stack, nível, tipo de empresa (se inferível), risco de under/over qualification.\n" +
      "3) Cobertura dos requisitos — o que ela já atende bem, o que atende parcialmente, o que falta.\n" +
      "4) Lacunas em ordem de impacto — hard skills e soft skills, com o que estudar/praticar primeiro.\n" +
      "5) Vale aplicar agora? — sim/não/com ressalvas e o que melhorar antes se não for aplicar já.\n" +
      "6) Plano de ação — próximos 7 dias e próximos 30 dias com tarefas concretas.\n\n" +
      "Se faltar dado importante, diga o que falta mas ainda assim dê uma análise parcial marcando incertezas.",
  },
  "job-analyzer": {
    key: "job-analyzer",
    requiresPro: true,
    requiresAuth: true,
    mode: "chat",
    maxInputChars: 10_000,
    temperature: 0.7,
    model: DEFAULT_MODEL,
    description: "Análise de vaga",
    systemPrompt:
      "Você é analista crítico de vagas tech no Brasil. O foco é INSIGHT sobre a vaga em si (não é calculadora de encaixe com currículo). Responda em português do Brasil, formato escaneável.\n\n" +
      "Cubra sempre que couber pelo texto disponível:\n" +
      "• Salário e benefícios — se há faixa declarada: parece compatível com o nível e com o mercado BR (explícito que é estimativa)? Se não há faixa, comente transparência e o que perguntar.\n" +
      "• Lista de requisitos — está pedindo demais para o nível anunciado? Há clichês impossíveis (ex.: sênior com salário júnior), mistura estranha de stacks, nível contraditório ao título?\n" +
      "• Contexto legal e forma de trabalho — remoto/híbrido/presencial; menções suspeitas (CLT PJ, multas absurdas etc.) só quando aparecer no texto.\n" +
      "• Sinais de qualidade ou red flags — jornada, cultura (se aparecer linguagem marcante), clareza da descrição.\n" +
      "• Vale a pena para quem está em busca nesta área? — conclusão honesta.\n" +
      "• Perguntas inteligentes para fazer se avançarem no processo.\n\n" +
      "Não invente salário nem requisitos que não estejam nos dados enviidos; quando inferir mercado ou padrões, marque como estimativa.",
  },
  "networking-message": {
    key: "networking-message",
    requiresPro: true,
    requiresAuth: true,
    mode: "chat",
    maxInputChars: 3_000,
    temperature: 0.7,
    model: DEFAULT_MODEL,
    description: "Gerador de mensagem de networking",
    systemPrompt: "Você escreve mensagens de networking humanas para LinkedIn, com tom direto, descontraído e formal.",
  },
};

export function getToolConfig(toolKey: string): AiToolConfig | null {
  return AI_TOOLS[toolKey] || null;
}

export function estimateCost(inputChars: number, outputChars: number): number {
  const inputTokens = inputChars / CHARS_PER_TOKEN;
  const outputTokens = outputChars / CHARS_PER_TOKEN;

  return (inputTokens / 1000) * COST_PER_1K_INPUT_TOKENS + (outputTokens / 1000) * COST_PER_1K_OUTPUT_TOKENS;
}
