import { z } from "zod";

import { AREA_SLUGS } from "../../../shared/areas";
import { AI_TOOLS } from "../aiTools";
import { env } from "../env";
import { fetchWithTimeout } from "../http";
import { buildOpenAIHeaders, OPENAI_BASE_URL } from "../openai";
import { toOpenAIStrictSchema } from "../openaiStrictSchema";
import { fetchUserContextPool } from "../userContext/pool";
import { CAREER_PLAN_BUDGETS } from "./generate";

/**
 * Chat de intake do plano de carreira (feature Pro). A conversa produz um intake
 * PROPOSTO turno a turno; NADA aqui gera plano nem confia no que o modelo
 * devolve para a geracao: a rota /generate revalida tudo com Zod. O contrato do
 * turno segue o padrao de server/routes/interview.ts: POST unico por turno,
 * response_format json_schema strict, sem streaming.
 */

const TOOL_CONFIG = AI_TOOLS["career-plan-chat"];

const AI_MAX_ATTEMPTS = 3;
const AI_BACKOFF_MS = [400, 800];
const AI_TIMEOUT_MS = 90_000;
const MAX_TOKENS = 1_500;

// Tetos duros do corpo, aplicados no server (a rota so orquestra). MAX_BODY_CHARS
// espelha o maxInputChars da entrada career-plan-chat em AI_TOOLS.
export const MAX_BODY_CHARS = 8_000;
export const MAX_USER_MESSAGES = 10;

// Campos do intake proposto; ordem estavel e a mesma dos enums do GenerateSchema.
export const INTAKE_FIELDS = [
  "goal",
  "area",
  "level",
  "hoursPerWeek",
  "horizonMonths",
  "budget",
] as const;

// O intake proposto pelo turno. Todos os campos sao NULLABLE (o chat preenche o
// que ja sabe e deixa null o que falta). area e budget vem das MESMAS fontes do
// GenerateSchema (shared/areas e CAREER_PLAN_BUDGETS); level segue string livre
// como no GenerateSchema (nao ha enum canonico de nivel na plataforma).
const IntakeProposalSchema = z.object({
  goal: z.string().nullable(),
  area: z.enum(AREA_SLUGS).nullable(),
  level: z.string().nullable(),
  hoursPerWeek: z.number().nullable(),
  horizonMonths: z.number().nullable(),
  budget: z.enum(CAREER_PLAN_BUDGETS).nullable(),
});

// Um turno do chat de intake. reply e a fala do Natechinho (uma unica pergunta
// por turno); missing lista os campos ainda em aberto; ready so vira true quando
// o intake estiver completo E a pessoa confirmar o resumo (regra no prompt).
export const IntakeChatTurnSchema = z.object({
  reply: z.string().min(1).max(600),
  intake: IntakeProposalSchema,
  missing: z.array(z.enum(INTAKE_FIELDS)),
  ready: z.boolean(),
});

export type IntakeProposal = z.infer<typeof IntakeProposalSchema>;
export type IntakeChatTurn = z.infer<typeof IntakeChatTurnSchema>;

export const INTAKE_CHAT_JSON_SCHEMA =
  toOpenAIStrictSchema(IntakeChatTurnSchema);

export interface IntakeChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type IntakeChatBodyValidation =
  | { ok: true; messages: IntakeChatMessage[] }
  | { ok: false; error: "invalid_request" | "payload_too_large" | "turn_limit" };

// Validacao pura do corpo, extraida para ser testavel sem HTTP. Limpa mensagens
// invalidas, aplica o teto de chars e o teto de mensagens de usuario. A rota so
// mapeia o erro para o status/codigo correspondente.
export function validateIntakeChatBody(
  body: unknown,
): IntakeChatBodyValidation {
  const rec = (body ?? {}) as { messages?: unknown };
  const raw = rec.messages;
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: "invalid_request" };
  }

  const cleaned: IntakeChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const m = item as { role?: unknown; content?: unknown };
    const role =
      m.role === "assistant" ? "assistant" : m.role === "user" ? "user" : null;
    if (!role || typeof m.content !== "string") continue;
    if (!m.content.trim()) continue;
    cleaned.push({ role, content: m.content });
  }
  if (cleaned.length === 0) {
    return { ok: false, error: "invalid_request" };
  }

  const totalChars = cleaned.reduce((sum, m) => sum + m.content.length, 0);
  if (totalChars > MAX_BODY_CHARS) {
    return { ok: false, error: "payload_too_large" };
  }

  const userCount = cleaned.filter((m) => m.role === "user").length;
  if (userCount > MAX_USER_MESSAGES) {
    return { ok: false, error: "turn_limit" };
  }

  return { ok: true, messages: cleaned };
}

// TODO(Ana): revisar e refinar toda a copy deste prompt (a fala do Natechinho no
// campo reply chega ao usuario).
export const INTAKE_CHAT_SYSTEM_PROMPT =
  "Você é o Natechinho, mentor de carreira tech do BoraNaTech, em voz masculina. Você conduz uma conversa curta em português do Brasil para montar o intake de um plano de carreira, com tom acolhedor, direto e sem condescendência.\n\n" +
  "Seu objetivo é reunir seis informações da pessoa: o objetivo dela (goal), a área alvo (area), o nível atual (level), as horas de estudo por semana (hoursPerWeek), o horizonte do plano em meses (horizonMonths) e o orçamento para certificações (budget). Você não gera o plano; quem gera é outra etapa. Aqui você só reúne e confirma esses dados.\n\n" +
  "# Você já conhece a pessoa\n" +
  "O contexto abaixo do prompt traz o que a plataforma já sabe da pessoa (quiz, perfil, roadmaps, diário de estudo, análises de GitHub, LinkedIn e currículo, entrevistas). Nunca pergunte o que o contexto já responde. CONFIRME em vez de perguntar. Exemplo: se o contexto diz que a pessoa vem de backend e mirou IA no quiz, diga algo como 'vi que você vem de backend e mirou IA no quiz, o alvo ainda é IA?' em vez de perguntar a área do zero.\n\n" +
  "# Como conduzir\n" +
  "Faça UMA pergunta objetiva por turno. Vá do que falta, não do que já está no contexto. Pare de perguntar assim que tiver o suficiente para os seis campos. Não empilhe perguntas sobre assuntos diferentes na mesma mensagem.\n\n" +
  "# Preenchimento do intake\n" +
  "A cada turno, preencha o objeto intake com o que você já sabe (do contexto ou do que a pessoa disse) e deixe null o que ainda não tem. Liste em missing os campos ainda em aberto. A área deve ser um dos slugs válidos da plataforma; o orçamento, um dos níveis válidos; quando não souber, deixe null em vez de chutar.\n\n" +
  "# Quando encerrar\n" +
  "ready só pode ser true quando os seis campos estiverem preenchidos E a pessoa tiver confirmado o resumo. Antes disso, ready é false. O fluxo é: quando tiver os seis campos, mostre um resumo curto do intake e peça confirmação; só marque ready true no turno seguinte, depois que a pessoa confirmar o resumo.\n\n" +
  "# Limites\n" +
  "Nunca invente fato sobre a pessoa além do contexto e do que ela disse. Nunca cite preço, valor ou moeda em nenhuma mensagem. Nunca prometa uma certificação específica nesta etapa; quem escolhe as certificações é a geração do plano, pelo catálogo.\n\n" +
  "# Escrita\n" +
  "Nunca use travessão nem meia-risca. Use ponto, vírgula ou parênteses. Hífen apenas em palavras compostas legítimas.";

interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface IntakeChatAiIo {
  inputChars: number;
  outputChars: number;
}

// Monta o bloco de contexto do usuario no mesmo espirito do buildUserContext da
// geracao: fatos estruturados do fetchUserContextPool, sem inventar nada. O
// enquadramento aqui e "confirme, nao pergunte": o modelo usa isso para nao
// repetir perguntas cuja resposta ja esta no contexto.
async function buildIntakeContext(userId: string): Promise<string> {
  const pool = await fetchUserContextPool(userId);
  const lines: string[] = [];

  lines.push(
    "Contexto da pessoa na plataforma (fatos; confirme em vez de perguntar, nunca invente além disto):",
  );

  if (pool.quiz.ok && pool.quiz.data) {
    const quiz = pool.quiz.data;
    const parts = [
      quiz.area ? `área indicada ${quiz.area}` : null,
      quiz.level ? `nível ${quiz.level}` : null,
    ].filter((p): p is string => p !== null);
    if (parts.length > 0) {
      lines.push(`- Quiz de carreira: ${parts.join(", ")}.`);
    }
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
        `- Trilha em andamento na plataforma: ${course.title ?? course.courseSlug}, ${course.completedItems} passos concluídos.`,
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

  if (pool.interview.ok && pool.interview.data) {
    const i = pool.interview.data;
    lines.push(
      `- Última entrevista simulada: área ${i.area ?? "não registrada"}, ${i.goodCount} de ${i.questionCount} respostas boas.`,
    );
  }

  return lines.join("\n");
}

async function callModelOnce(
  modelMessages: ModelMessage[],
  onIo: (io: IntakeChatAiIo) => void,
): Promise<IntakeChatTurn> {
  const response = await fetchWithTimeout(
    OPENAI_BASE_URL,
    {
      method: "POST",
      headers: buildOpenAIHeaders(env.openaiApiKey),
      body: JSON.stringify({
        model: TOOL_CONFIG.model,
        temperature: TOOL_CONFIG.temperature,
        max_tokens: MAX_TOKENS,
        messages: modelMessages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "career_plan_intake_turn",
            strict: true,
            schema: INTAKE_CHAT_JSON_SCHEMA,
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

  const validation = IntakeChatTurnSchema.safeParse(parsed);
  if (!validation.success) {
    const issues = JSON.stringify(validation.error.issues).slice(0, 300);
    throw new Error(`Resposta da IA nao bateu com o schema: ${issues}`);
  }

  const inputChars = modelMessages.reduce(
    (acc, m) => acc + m.content.length,
    0,
  );
  onIo({ inputChars, outputChars: content.length });
  return validation.data;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Roda um turno do chat de intake: monta system prompt + contexto do usuario +
// historico e chama o modelo com retry/backoff no molde do generate.ts. Erro de
// parse/schema reprova a tentativa e entra no retry.
export async function runIntakeChatTurn(
  userId: string,
  messages: IntakeChatMessage[],
  onIo: (io: IntakeChatAiIo) => void,
): Promise<IntakeChatTurn> {
  if (!env.openaiApiKey) {
    throw new Error("Servico de IA nao configurado.");
  }

  const context = await buildIntakeContext(userId);
  const modelMessages: ModelMessage[] = [
    { role: "system", content: INTAKE_CHAT_SYSTEM_PROMPT },
    { role: "system", content: context },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let lastError: unknown;
  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await callModelOnce(modelMessages, onIo);
    } catch (err) {
      lastError = err;
      const detail = err instanceof Error ? err.message : String(err);
      console.error(
        `[career-plan-chat] IA tentativa ${attempt}/${AI_MAX_ATTEMPTS} falhou: ${detail}`,
      );
      if (attempt < AI_MAX_ATTEMPTS) {
        await sleep(AI_BACKOFF_MS[attempt - 1] ?? 800);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Falha ao rodar o turno do chat de intake.");
}
