import { z } from "zod";

import { AREA_LABELS, AREA_SLUGS, type AreaSlug } from "../../../shared/areas";
import {
  CAREER_CATALOG_VERSION,
  catalogForAreas,
  getCatalogItem,
  type CareerCatalogItem,
} from "../../../shared/careerCatalog";
import { AI_TOOLS } from "../aiTools";
import { env } from "../env";
import { fetchWithTimeout } from "../http";
import { buildOpenAIHeaders, OPENAI_BASE_URL } from "../openai";
import { toOpenAIStrictSchema } from "../openaiStrictSchema";
import { fetchUserContextPool } from "../userContext/pool";

/**
 * Gerador do plano de carreira (feature Pro). Trava de honestidade: o modelo
 * NUNCA escreve nome, preco ou URL de certificacao/curso; ele so referencia
 * IDs do catalogo curado (shared/careerCatalog.ts). Todo catalogId da resposta
 * e validado pos-parse contra o catalogo; id inventado reprova a tentativa
 * (entra no retry). O checklist e derivado PELO SERVER apos a validacao e
 * congelado no result persistido; o modelo nunca o escreve.
 */

const TOOL_CONFIG = AI_TOOLS["career-plan"];

const AI_MAX_ATTEMPTS = 3;
const AI_BACKOFF_MS = [400, 800];
const AI_TIMEOUT_MS = 90_000;
const MAX_TOKENS = 3_000;

// Fonte unica dos niveis de orcamento do plano de carreira. Reusada pelo
// GenerateSchema da rota e pelo schema do chat de intake, sem duplicar a lista.
export const CAREER_PLAN_BUDGETS = [
  "zero",
  "ate_500",
  "ate_2000",
  "acima_2000",
] as const;

export type CareerPlanBudget = (typeof CAREER_PLAN_BUDGETS)[number];

export interface CareerPlanIntake {
  goal: string;
  area: string;
  level: string;
  hoursPerWeek: number;
  horizonMonths: number;
  budget: CareerPlanBudget;
}

const BUDGET_LABELS: Record<CareerPlanBudget, string> = {
  zero: "zero (so itens gratuitos; nenhuma certificacao paga)",
  ate_500: "ate R$ 500 no total",
  ate_2000: "ate R$ 2000 no total",
  acima_2000: "acima de R$ 2000",
};

// Limites tambem declarados no prompt: o strict mode corta min/max do JSON
// Schema, mas o Zod valida de verdade no pos-parse.
const StepItemSchema = z.object({
  label: z.string().min(1),
  catalogId: z.string().nullable(),
});

const StepSchema = z.object({
  id: z.string().min(1).max(40),
  title: z.string().min(1),
  rationale: z.string().min(100).max(400),
  items: z.array(StepItemSchema).min(1).max(6),
  estimatedWeeks: z.number().int().min(1).max(26),
});

const CertificationSchema = z.object({
  catalogId: z.string().min(1),
  // Ancora ao degrau (steps[].id) em que a certificacao deve ser conquistada;
  // null quando a certificacao e transversal a rota inteira.
  stepId: z.string().nullable(),
  whenLabel: z.string().min(1).max(80),
  optional: z.boolean(),
  rationale: z.string().min(80).max(300),
});

const ScheduleSchema = z.object({
  monthsLabel: z.string().min(1).max(40),
  focus: z.string().min(80).max(300),
  // Ids dos degraus (steps[].id) cobertos pelo bloco; vazio e permitido
  // (bloco sem degrau especifico, como revisao geral).
  stepIds: z.array(z.string()).max(6),
});

const OutOfScopeSchema = z.object({
  label: z.string().min(1),
  reason: z.string().min(60).max(250),
});

export const CareerPlanResultSchema = z.object({
  objectiveLogic: z.string().min(300).max(900),
  steps: z.array(StepSchema).min(3).max(6),
  certifications: z.array(CertificationSchema).max(6),
  schedule: z.array(ScheduleSchema).min(2).max(5),
  outOfScope: z.array(OutOfScopeSchema).min(1).max(4),
});

export type CareerPlanResult = z.infer<typeof CareerPlanResultSchema>;

const CAREER_PLAN_JSON_SCHEMA = toOpenAIStrictSchema(CareerPlanResultSchema);

export interface CareerPlanChecklistItem {
  itemId: string;
  label: string;
  kind: "step_item" | "certification";
  stepId?: string;
}

// Tipos de LEITURA retrocompativeis: planos persistidos antes da ancoragem
// nao tem stepId nem stepIds, entao na leitura esses campos sao opcionais.
// O schema de GERACAO acima segue exigindo os dois (strict mode).
type StoredCertification = Omit<
  z.infer<typeof CertificationSchema>,
  "stepId"
> & { stepId?: string | null };

type StoredScheduleBlock = Omit<z.infer<typeof ScheduleSchema>, "stepIds"> & {
  stepIds?: string[];
};

export type CareerPlanStoredResult = Omit<
  CareerPlanResult,
  "certifications" | "schedule"
> & {
  certifications: StoredCertification[];
  schedule: StoredScheduleBlock[];
  checklist: CareerPlanChecklistItem[];
};

export interface CareerPlanAiIo {
  inputChars: number;
  outputChars: number;
}

// Resolve a area do intake para um slug do catalogo: aceita slug canonico ou
// o rotulo humano; desconhecido cai no subconjunto so de itens "geral".
function resolveAreaSlug(area: string): AreaSlug | null {
  const normalized = area.trim().toLowerCase();
  const bySlug = AREA_SLUGS.find((slug) => slug === normalized);
  if (bySlug) return bySlug;
  const byLabel = AREA_SLUGS.find(
    (slug) => AREA_LABELS[slug].toLowerCase() === normalized,
  );
  return byLabel ?? null;
}

function priceLabel(item: CareerCatalogItem): string {
  if ("free" in item.price) return "gratuito";
  return `${item.price.currency} ${item.price.amount} (referencia ${item.priceAsOf})`;
}

function catalogBlock(items: CareerCatalogItem[]): string {
  const lines = items.map((item) => {
    const prereq =
      item.prereqIds && item.prereqIds.length > 0
        ? `; recomendado antes: ${item.prereqIds.join(", ")}`
        : "";
    const notes = item.notes ? `; ${item.notes}` : "";
    return `- ${item.id}: ${item.name}, ${item.provider}, nivel ${item.level}, ${priceLabel(item)}${prereq}${notes}`;
  });
  return lines.join("\n");
}

// Exportado para teste (assert da presenca das regras no prompt do sistema).
export const SYSTEM_PROMPT =
  "Você é o Natechinho, mentor de carreira tech do BoraNaTech, em voz masculina. Você monta uma ROTA DE CARREIRA honesta e realista em português do Brasil, no formato JSON pedido.\n\n" +
  "Esqueleto do plano:\n" +
  "- objectiveLogic: o objetivo da pessoa e a LÓGICA da rota (por que esta ordem, o que destrava o quê). Entre 300 e 900 caracteres.\n" +
  "- steps: 3 a 6 degraus ordenados. Cada degrau tem id (slug curto estável, ex 'fundamentos'), title, rationale (100 a 400 caracteres, por que este degrau vem aqui; 'aprender primeiro, certificar depois' quando couber), items (1 a 6 ações concretas) e estimatedWeeks (1 a 26, calibrado pelas horas semanais informadas).\n" +
  "- certifications: 0 a 6 certificações condicionadas aos degraus, com whenLabel (ex 'depois do degrau fundamentos', até 80 caracteres), optional e rationale (80 a 300 caracteres). Respeite o ORÇAMENTO informado e os pré-requisitos recomendados do catálogo. Orçamento zero = nenhuma certificação paga (use as gratuitas ou deixe vazio).\n" +
  "- schedule: 2 a 5 blocos com monthsLabel (ex 'Meses 1 a 3') e focus (80 a 300 caracteres), cobrindo o horizonte informado num ritmo realista pelas horas semanais. Não prometa resultado em prazo irreal.\n" +
  "- outOfScope: 1 a 4 itens que ficaram DE FORA de propósito, com reason honesta (60 a 250 caracteres) explicando por que não entram agora.\n\n" +
  "REGRA DOS ITENS CITÁVEIS (crítica): você vai receber a lista ITENS CITÁVEIS com ids do catálogo. Qualquer certificação ou curso pago citado DEVE entrar apenas por catalogId dessa lista (em items.catalogId ou certifications.catalogId). Itens de degrau sem catálogo (prática, projeto pessoal, conteúdo gratuito genérico) usam catalogId null e o label descreve a ação. NUNCA invente id, nome, sigla ou provedor de certificação fora da lista.\n\n" +
  "REGRA DE ANCORAGEM (crítica): cada certificação deve declarar em stepId o id do degrau em que ela deve ser conquistada, escolhido entre os ids de steps que você mesmo gerou. Use null apenas se a certificação for transversal à rota inteira. Cada bloco do cronograma deve listar em stepIds os ids dos degraus que aquele período cobre (array vazio para bloco sem degrau específico, como revisão geral). A sequência dos blocos deve respeitar a ordem dos degraus. NUNCA invente id de degrau.\n\n" +
  "REGRA DE ORÇAMENTO (crítica): com orçamento zero, cite apenas itens gratuitos do catálogo (free_resource ou preço gratuito) e prática com catalogId null; certificação paga só pode aparecer em outOfScope, com reason explicando o motivo. Com orçamento até R$ 500, priorize os itens gratuitos e cite no máximo os itens pagos que caibam no orçamento; o total dos itens pagos citados NUNCA deve estourar o orçamento declarado.\n\n" +
  "PROIBIDO mencionar preço, valor ou moeda em QUALQUER campo de texto: quem exibe preço é a plataforma, direto do catálogo.\n\n" +
  "Não invente fatos sobre a pessoa além do contexto fornecido. Em conflito entre o contexto histórico e o que a pessoa pediu agora, vale o pedido atual. Tom direto, encorajador e concreto, sem condescendência.";

async function buildUserContext(
  userId: string,
  intake: CareerPlanIntake,
): Promise<string> {
  const pool = await fetchUserContextPool(userId);
  const lines: string[] = [];

  lines.push(
    "Pedido atual da pessoa (prevalece sobre o contexto em conflito):",
  );
  lines.push(`- Objetivo declarado agora: ${intake.goal}`);
  lines.push(`- Área alvo: ${intake.area}.`);
  lines.push(`- Nível atual: ${intake.level}.`);
  lines.push(`- Horas de estudo por semana: ${intake.hoursPerWeek}.`);
  lines.push(`- Horizonte do plano: ${intake.horizonMonths} meses.`);
  lines.push(
    `- Orçamento para certificações: ${BUDGET_LABELS[intake.budget]}.`,
  );
  lines.push("");
  lines.push(
    "Contexto da pessoa na plataforma (fatos; não invente além disto):",
  );

  if (pool.quiz.ok && pool.quiz.data) {
    const quiz = pool.quiz.data;
    const parts = [
      quiz.area ? `área indicada ${quiz.area}` : null,
      quiz.level ? `nível ${quiz.level}` : null,
    ].filter((p): p is string => p !== null);
    if (parts.length > 0)
      lines.push(`- Quiz de carreira: ${parts.join(", ")}.`);
  }

  if (pool.profile.ok && pool.profile.data) {
    const profile = pool.profile.data;
    if (profile.careerGoal) {
      lines.push(`- Objetivo de carreira no perfil: ${profile.careerGoal}`);
    }
    if (profile.headline) {
      lines.push(`- Headline do perfil: ${profile.headline}`);
    }
  }

  if (pool.studyDiary.ok && pool.studyDiary.data.totalMinutes30d > 0) {
    const diary = pool.studyDiary.data;
    lines.push(
      `- Ritmo real de estudo nos últimos 30 dias: ${diary.totalMinutes30d} minutos em ${diary.activeDays30d} dias ativos.`,
    );
  }

  if (pool.courses.ok && pool.courses.data.length > 0) {
    for (const course of pool.courses.data) {
      lines.push(
        `- Trilha em andamento na plataforma: ${course.title ?? course.courseSlug}, ${course.completedItems} passos concluídos. Aproveite essa base, não recomece do zero.`,
      );
    }
  }

  if (pool.roadmaps.ok && pool.roadmaps.data.length > 0) {
    for (const roadmap of pool.roadmaps.data) {
      lines.push(
        `- Roadmap concluído/avançado: ${roadmap.title ?? roadmap.roadmapId}, ${roadmap.completedSteps} de ${roadmap.totalSteps} passos.`,
      );
    }
  }

  if (pool.github.ok && pool.github.data) {
    const gh = pool.github.data;
    if (typeof gh.score === "number") {
      lines.push(
        `- Análise de GitHub mais recente: nota ${gh.score}${gh.faixa ? `, faixa ${gh.faixa}` : ""}.`,
      );
    }
  }

  if (pool.linkedin.ok && pool.linkedin.data) {
    const li = pool.linkedin.data;
    if (typeof li.score === "number") {
      lines.push(
        `- Análise de LinkedIn mais recente: nota ${li.score}${li.faixa ? `, faixa ${li.faixa}` : ""}.`,
      );
    }
  }

  if (pool.resumeAnalysis.ok && pool.resumeAnalysis.data) {
    const ra = pool.resumeAnalysis.data;
    if (typeof ra.score === "number") {
      lines.push(
        `- Análise de currículo mais recente: nota ${ra.score}${ra.targetRole ? `, cargo alvo ${ra.targetRole}` : ""}.`,
      );
    }
  }

  // Sinal de prontidao real. A fonte careerPlan NAO entra aqui de proposito:
  // o plano anterior sera arquivado e nao deve ancorar o novo.
  if (pool.interview.ok && pool.interview.data) {
    const i = pool.interview.data;
    lines.push(
      `- Última entrevista simulada: área ${i.area ?? "não registrada"}, ${i.goodCount} de ${i.questionCount} respostas boas (sinal de prontidão real).`,
    );
  }

  return lines.join("\n");
}

// Todo catalogId citado precisa existir no catalogo; devolve os invalidos.
function findInvalidCatalogIds(result: CareerPlanResult): string[] {
  const invalid: string[] = [];
  for (const step of result.steps) {
    for (const item of step.items) {
      if (item.catalogId !== null && !getCatalogItem(item.catalogId)) {
        invalid.push(item.catalogId);
      }
    }
  }
  for (const cert of result.certifications) {
    if (!getCatalogItem(cert.catalogId)) {
      invalid.push(cert.catalogId);
    }
  }
  return invalid;
}

// Toda ancora de degrau (certifications[].stepId nao-null e cada id em
// schedule[].stepIds) precisa existir em steps[].id; devolve as invalidas.
// Exportada para teste.
export function findInvalidStepRefs(result: CareerPlanResult): string[] {
  const stepIds = new Set(result.steps.map((step) => step.id));
  const invalid: string[] = [];
  for (const cert of result.certifications) {
    if (cert.stepId !== null && !stepIds.has(cert.stepId)) {
      invalid.push(cert.stepId);
    }
  }
  for (const block of result.schedule) {
    for (const id of block.stepIds) {
      if (!stepIds.has(id)) {
        invalid.push(id);
      }
    }
  }
  return invalid;
}

function deriveChecklist(result: CareerPlanResult): CareerPlanChecklistItem[] {
  const items: CareerPlanChecklistItem[] = [];
  for (const step of result.steps) {
    step.items.forEach((item, index) => {
      items.push({
        itemId: `step:${step.id}:${index}`,
        label: item.label,
        kind: "step_item",
        stepId: step.id,
      });
    });
  }
  for (const cert of result.certifications) {
    const catalogItem = getCatalogItem(cert.catalogId);
    items.push({
      itemId: `cert:${cert.catalogId}`,
      label: catalogItem?.name ?? cert.catalogId,
      kind: "certification",
    });
  }
  return items;
}

async function callModelOnce(
  userContext: string,
  citableBlock: string,
  onIo: (io: CareerPlanAiIo) => void,
): Promise<CareerPlanResult> {
  const userPrompt = [
    userContext,
    "",
    "ITENS CITÁVEIS (id: nome, provedor, nível, preço). Qualquer certificação ou curso pago citado DEVE ser por catalogId desta lista:",
    citableBlock,
  ].join("\n");

  const response = await fetchWithTimeout(
    OPENAI_BASE_URL,
    {
      method: "POST",
      headers: buildOpenAIHeaders(env.openaiApiKey),
      body: JSON.stringify({
        model: TOOL_CONFIG.model,
        temperature: TOOL_CONFIG.temperature,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "career_plan",
            strict: true,
            schema: CAREER_PLAN_JSON_SCHEMA,
          },
        },
      }),
    },
    { service: "openai", timeoutMs: AI_TIMEOUT_MS },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `OpenAI respondeu ${response.status}: ${text.slice(0, 300)}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("A IA nao retornou conteudo.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Resposta da IA nao veio em JSON valido: ${detail}.`);
  }

  const validation = CareerPlanResultSchema.safeParse(parsed);
  if (!validation.success) {
    const issues = JSON.stringify(validation.error.issues).slice(0, 300);
    throw new Error(`Resposta da IA nao bateu com o schema: ${issues}`);
  }

  const invalidIds = findInvalidCatalogIds(validation.data);
  if (invalidIds.length > 0) {
    throw new Error(
      `Resposta da IA citou catalogId inexistente: ${invalidIds.join(", ")}`,
    );
  }

  const invalidStepRefs = findInvalidStepRefs(validation.data);
  if (invalidStepRefs.length > 0) {
    throw new Error(
      `Resposta da IA citou stepId inexistente: ${invalidStepRefs.join(", ")}`,
    );
  }

  onIo({
    inputChars: SYSTEM_PROMPT.length + userPrompt.length,
    outputChars: content.length,
  });
  return validation.data;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateCareerPlan(
  userId: string,
  intake: CareerPlanIntake,
  onIo: (io: CareerPlanAiIo) => void,
): Promise<{ result: CareerPlanStoredResult; catalogVersion: string }> {
  if (!env.openaiApiKey) {
    throw new Error("Servico de IA nao configurado.");
  }

  const areaSlug = resolveAreaSlug(intake.area);
  const citable = catalogForAreas(areaSlug ? [areaSlug] : []);
  const citableBlock = catalogBlock(citable);
  const userContext = await buildUserContext(userId, intake);

  let lastError: unknown;
  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt += 1) {
    try {
      const result = await callModelOnce(userContext, citableBlock, onIo);
      return {
        result: { ...result, checklist: deriveChecklist(result) },
        catalogVersion: CAREER_CATALOG_VERSION,
      };
    } catch (err) {
      lastError = err;
      const detail = err instanceof Error ? err.message : String(err);
      console.error(
        `[career-plan] IA tentativa ${attempt}/${AI_MAX_ATTEMPTS} falhou: ${detail}`,
      );
      if (attempt < AI_MAX_ATTEMPTS) {
        await sleep(AI_BACKOFF_MS[attempt - 1] ?? 800);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Falha ao gerar o plano de carreira.");
}
