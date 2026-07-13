import { z } from "zod";

import { AI_TOOLS } from "../aiTools";
import { env } from "../env";
import { fetchWithTimeout } from "../http";
import { buildOpenAIHeaders, OPENAI_BASE_URL } from "../openai";
import { toOpenAIStrictSchema } from "../openaiStrictSchema";
import { fetchUserContextPool } from "../userContext/pool";

/**
 * Chat de intake do roadmap com IA (feature Pro). A conversa produz um intake
 * PROPOSTO turno a turno; NADA aqui gera roadmap nem confia no que o modelo
 * devolve para a geracao: a rota POST /api/roadmaps-ia/generate revalida tudo
 * com RoadmapIntakeSchema. O contrato do turno segue o padrao de
 * server/lib/careerPlan/intakeChat.ts: POST unico por turno, response_format
 * json_schema strict, sem streaming, historico efemero reenviado pelo client.
 *
 * Divergencias conscientes em relacao ao careerPlan: roteiro proprio de 7 etapas
 * (o form coleta parametros, o chat coleta historia), campos narrativos novos
 * (startingPoint, motivation, constraints) e o campo format NAO e perguntado
 * (decisao de produto: o gerador nao ramifica sobre ele; o client assume o
 * default "misto"). Por isso format fica de fora do intake proposto aqui.
 */

const TOOL_CONFIG = AI_TOOLS["roadmap-intake-chat"];

const AI_MAX_ATTEMPTS = 3;
const AI_BACKOFF_MS = [400, 800];
const AI_TIMEOUT_MS = 90_000;
const MAX_TOKENS = 1_500;

// Tetos duros do corpo, aplicados no server (a rota so orquestra). MAX_BODY_CHARS
// espelha o maxInputChars da entrada roadmap-intake-chat em AI_TOOLS. O roteiro
// tem 7 etapas (contra 6 do careerPlan) e admite uma repergunta por etapa, entao
// os tetos sao um pouco mais folgados que os do careerPlan (8000/10).
export const MAX_BODY_CHARS = 9_000;
export const MAX_USER_MESSAGES = 12;

// Campos do intake proposto pelo chat. NAO inclui format (nao perguntado; o
// client assume "misto"). goal/hoursPerWeek/deadline usam os MESMOS enums de
// RoadmapIntakeSchema (shared/aiRoadmap.ts); os demais sao texto livre.
export const INTAKE_FIELDS = [
  "goal",
  "hoursPerWeek",
  "deadline",
  "stackFocus",
  "startingPoint",
  "motivation",
  "constraints",
] as const;

// O intake proposto pelo turno. Todos os campos sao NULLABLE (o chat preenche o
// que ja sabe e deixa null o que falta). Os enums espelham exatamente os de
// RoadmapIntakeSchema; stackFocus e os campos narrativos sao texto livre (o
// stackFocus e normalizado depois do parse para respeitar o regex do schema).
const IntakeProposalSchema = z.object({
  goal: z.enum(["primeira-vaga", "transicao", "freela", "aprofundar"]).nullable(),
  hoursPerWeek: z.enum(["ate-5", "5-10", "10-20", "20-mais"]).nullable(),
  deadline: z.enum(["3m", "6m", "12m", "sem-prazo"]).nullable(),
  stackFocus: z.string().nullable(),
  startingPoint: z.string().nullable(),
  motivation: z.string().nullable(),
  constraints: z.string().nullable(),
});

// Um turno do chat de intake. reply e a fala do Natechinho (uma unica pergunta
// por turno); missing lista os campos ainda em aberto; ready so vira true quando
// os campos essenciais estiverem preenchidos E a pessoa confirmar o resumo
// (regra no prompt).
export const IntakeChatTurnSchema = z.object({
  reply: z.string().min(1).max(600),
  intake: IntakeProposalSchema,
  missing: z.array(z.enum(INTAKE_FIELDS)),
  ready: z.boolean(),
});

export type IntakeProposal = z.infer<typeof IntakeProposalSchema>;
export type IntakeChatTurn = z.infer<typeof IntakeChatTurnSchema>;

export const INTAKE_CHAT_JSON_SCHEMA = toOpenAIStrictSchema(IntakeChatTurnSchema);

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

// Normaliza o stackFocus proposto pelo modelo para respeitar o regex de
// RoadmapIntakeSchema (minusculas, numeros e hifen, ate 32 chars), espelhando a
// sanitizacao do input do client. Vazio apos normalizar vira null.
function normalizeStackFocus(raw: string | null): string | null {
  if (raw === null) return null;
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 32);
  return cleaned === "" ? null : cleaned;
}

// TODO(Ana): revisar e refinar toda a copy deste prompt (a fala do Natechinho no
// campo reply chega ao usuario).
export const INTAKE_CHAT_SYSTEM_PROMPT =
  "Você é o Natechinho, mentor de carreira tech do BoraNaTech, em voz masculina. Você conduz uma conversa curta em português do Brasil para montar o intake de um roadmap de estudos personalizado, com tom direto, acolhedor e sem condescendência. Você não gera o roadmap; quem gera é outra etapa. Aqui você só reúne e confirma o que a pessoa quer e o momento dela.\n\n" +
  "# Você já conhece a pessoa\n" +
  "O contexto abaixo do prompt traz o que a plataforma já sabe da pessoa (quiz de carreira, objetivo no perfil, trilhas em andamento, skills declaradas, ritmo real de estudo, análises de GitHub, LinkedIn e currículo, entrevistas). Nunca pergunte o que o contexto já responde: CONFIRME em vez de perguntar. Exemplo: se o contexto diz que o quiz apontou back-end e o objetivo de carreira fala em primeira vaga, diga algo como 'seu quiz apontou back-end e seu objetivo fala em primeira vaga, ainda é por aí ou mudou?' em vez de perguntar do zero. Nunca invente um fato que não esteja no contexto nem no que a pessoa disse.\n\n" +
  "# Como conduzir\n" +
  "Faça UMA pergunta objetiva por turno, nunca duas sobre assuntos diferentes. Siga o roteiro abaixo na ordem. Se uma resposta vier vaga ou genérica, REPERGUNTE UMA ÚNICA VEZ com uma pergunta mais concreta e, com o que a pessoa der, siga em frente para a próxima etapa. Nunca julgue a resposta da pessoa. Nunca prometa nem descreva o roadmap antes do fim da conversa.\n\n" +
  "# Roteiro (uma etapa por vez, nesta ordem)\n" +
  "1. Objetivo e por que agora. Confirme o objetivo usando o quiz e o objetivo de carreira do contexto quando existirem; pergunte o que mudaria na vida dela se der certo. Captura goal e motivation.\n" +
  "2. Ponto de partida honesto. O que ela já sabe de verdade, o que já tentou e onde travou. Se o contexto mostra trilhas em andamento ou skills declaradas, cite e peça confirmação em vez de perguntar do zero. Captura startingPoint.\n" +
  "3. Tempo real por semana. Se o contexto traz o ritmo dos últimos 30 dias, use como espelho honesto ('nos últimos 30 dias você estudou cerca de X por semana; dá pra manter, aumentar ou vai ser menos?'). Captura hoursPerWeek.\n" +
  "4. Prazo e o que está em jogo. Quando ela quer chegar lá e o que depende disso. Captura deadline e complementa motivation se aparecer algo novo.\n" +
  "5. Obstáculos. O que pode atrapalhar (jornada de trabalho, família, inglês fraco, máquina ruim, ansiedade com prazo). Captura constraints.\n" +
  "6. Foco de stack, só se fizer sentido para o objetivo. Se ela citar uma stack, normalize para minúsculas, números e hífen, no máximo 32 caracteres (ex: 'React e AWS' pode virar 'react'); se não fizer sentido ou ela não quiser, deixe stackFocus null. Captura stackFocus.\n" +
  "7. Resumo e confirmação. Resuma em 4 a 6 linhas o que você entendeu (objetivo, ponto de partida, tempo, prazo, obstáculos e foco) e peça confirmação. Só marque ready true no turno seguinte, depois que a pessoa confirmar o resumo.\n\n" +
  "# Valores dos campos de escolha (mapeie a fala da pessoa para um destes)\n" +
  "goal: 'primeira-vaga' (conquistar a primeira vaga), 'transicao' (mudar de carreira para tech), 'freela' (trabalhar como freelancer), 'aprofundar' (aprofundar na área atual).\n" +
  "hoursPerWeek: 'ate-5' (até 5h por semana), '5-10' (5 a 10h), '10-20' (10 a 20h), '20-mais' (mais de 20h).\n" +
  "deadline: '3m' (3 meses), '6m' (6 meses), '12m' (12 meses), 'sem-prazo' (sem prazo definido).\n\n" +
  "# Preenchimento do intake\n" +
  "A cada turno, preencha o objeto intake com o que você já sabe (do contexto ou do que a pessoa disse) e deixe null o que ainda não tem. Liste em missing os campos ainda em aberto. Os campos de escolha (goal, hoursPerWeek, deadline) devem ser exatamente um dos valores válidos acima; quando não souber, deixe null em vez de chutar. O campo format não existe aqui: nunca pergunte o formato de estudo, outra etapa assume o padrão.\n\n" +
  "# Quando encerrar\n" +
  "ready só pode ser true quando goal, hoursPerWeek e deadline estiverem preenchidos, o ponto de partida e os obstáculos já tiverem sido conversados, E a pessoa tiver confirmado o resumo da etapa 7. Antes disso, ready é false. Nunca marque ready no mesmo turno em que mostra o resumo pela primeira vez.\n\n" +
  "# Escrita\n" +
  "Nunca use travessão nem meia-risca em nenhuma mensagem. Use ponto, vírgula ou parênteses. Hífen apenas em palavras compostas legítimas ou no foco de stack.";

interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface IntakeChatAiIo {
  inputChars: number;
  outputChars: number;
}

// Monta o bloco de contexto do usuario no mesmo espirito do buildGenerationContext
// da geracao e do buildIntakeContext do careerPlan: fatos estruturados do
// fetchUserContextPool, sem inventar nada. O enquadramento e "confirme, nao
// pergunte": o modelo usa isso para nao repetir perguntas cuja resposta ja esta
// no contexto (etapas 1, 2 e 3 do roteiro).
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

  if (pool.courses.ok && pool.courses.data.length > 0) {
    for (const course of pool.courses.data) {
      lines.push(
        `- Trilha em andamento na plataforma: ${course.title ?? course.courseSlug}, ${course.completedItems} passos concluídos.`,
      );
    }
  }

  if (pool.skills.ok && pool.skills.data.length > 0) {
    const skills = pool.skills.data
      .map((s) => `${s.label} (${s.level})`)
      .join(", ");
    lines.push(`- Skills declaradas: ${skills}.`);
  }

  if (pool.studyDiary.ok && pool.studyDiary.data.totalMinutes30d > 0) {
    const diary = pool.studyDiary.data;
    const weekly = Math.round((diary.totalMinutes30d / 30) * 7);
    lines.push(
      `- Ritmo real de estudo nos últimos 30 dias: ${diary.totalMinutes30d} minutos em ${diary.activeDays30d} dias ativos (média de cerca de ${weekly} minutos por semana).`,
    );
  }

  if (pool.roadmaps.ok && pool.roadmaps.data.length > 0) {
    for (const roadmap of pool.roadmaps.data) {
      lines.push(
        `- Roadmap concluído ou avançado: ${roadmap.title ?? roadmap.roadmapId}, ${roadmap.completedSteps} de ${roadmap.totalSteps ?? "?"} passos.`,
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
            name: "roadmap_intake_turn",
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

  // Normaliza o stackFocus proposto para nao propor um intake que a geracao
  // (RoadmapIntakeSchema) rejeitaria pelo regex.
  const turn = validation.data;
  return {
    ...turn,
    intake: {
      ...turn.intake,
      stackFocus: normalizeStackFocus(turn.intake.stackFocus),
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Roda um turno do chat de intake: monta system prompt + contexto do usuario +
// historico e chama o modelo com retry/backoff no molde do careerPlan. Erro de
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
        `[roadmap-intake-chat] IA tentativa ${attempt}/${AI_MAX_ATTEMPTS} falhou: ${detail}`,
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
