import crypto from "crypto";
import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";

import { AI_TOOLS } from "../lib/aiTools";
import {
  checkAiDailyLimit,
  checkInterviewTurnDailyLimit,
  INTERVIEW_SESSION_TOOL,
  INTERVIEW_TURN_TOOL,
  logAiUsage,
} from "../lib/aiUsage";
import { env } from "../lib/env";
import {
  fetchExternalPageText,
  JobFetchError,
} from "../lib/fetchExternalPage";
import { fetchWithTimeout } from "../lib/http";
import { buildOpenAIHeaders, OPENAI_BASE_URL } from "../lib/openai";
import { toOpenAIStrictSchema } from "../lib/openaiStrictSchema";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

/**
 * Entrevista simulada multi-turn (Pro). Regras de seguranca (molde
 * server/routes/linkedin.ts + server/lib/agent/conversationStore.ts):
 *  - identidade SEMPRE de req.user.id (JWT); nunca do body;
 *  - tier server-side fail-closed: checkProStatus + recheck !req.isPro na rota;
 *  - toda query via supabaseAdmin filtra user_id explicitamente (a RLS das
 *    tabelas nao tem policy de escrita; o service role bypassa e o filtro e a
 *    barreira real);
 *  - quotas fail-closed: falha de verificacao = 503, nunca acesso liberado;
 *  - encerramento e decisao DETERMINISTICA do server (criterio de preparo ou
 *    teto de perguntas); o modelo nunca decide sozinho encerrar.
 */

const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TOOL_CONFIG = AI_TOOLS["interview-chat"];

const AI_MAX_ATTEMPTS = 3;
const AI_BACKOFF_MS = [400, 800];
const AI_TIMEOUT_MS = 60_000;
const MAX_TOKENS = 1_200;

// Teto duro de respostas avaliadas por sessao (question_count conta respostas
// avaliadas, nao perguntas feitas).
const QUESTION_CAP = 20;
// Criterio deterministico de preparo, checado APOS avaliar a resposta atual.
const PREPARED_STREAK = 3;
const PREPARED_MIN_QUESTIONS = 6;
const PREPARED_RATIO = 0.7;

const JOB_TEXT_MAX_CHARS = 15_000;

const CreateSessionSchema = z
  .object({
    kind: z.enum(["job", "general"]),
    area: z.string().trim().min(1).max(120),
    level: z.string().trim().min(1).max(60),
    language: z.enum(["pt", "en"]).default("pt"),
    jobUrl: z.string().trim().max(2_000).optional(),
    jobText: z.string().max(60_000).optional(),
  })
  .refine(
    (body) =>
      body.kind !== "job" ||
      Boolean(body.jobUrl?.trim()) ||
      Boolean(body.jobText?.trim()),
    { message: "kind job exige jobUrl ou jobText" },
  );

const AnswerSchema = z.object({
  answer: z.string().min(1).max(4_000),
});

const EvaluationSchema = z.object({
  rating: z.enum(["boa", "mediana", "fraca"]),
  feedback: z.string(),
});

const InterviewTurnResultSchema = z.object({
  evaluation: EvaluationSchema.nullable(),
  nextQuestion: z.string().nullable(),
  closing: z.string().nullable(),
});

type InterviewTurnResult = z.infer<typeof InterviewTurnResultSchema>;
type Evaluation = z.infer<typeof EvaluationSchema>;

const INTERVIEW_TURN_JSON_SCHEMA = toOpenAIStrictSchema(
  InterviewTurnResultSchema,
);

interface JobContext {
  source: "url" | "text";
  url?: string;
  extractedText: string;
  truncated?: boolean;
}

type SessionVerdict = {
  result: "prepared" | "question_cap" | "stopped_early";
  goodCount: number;
  questionCount: number;
  closing?: string;
};

interface SessionRow {
  id: string;
  kind: "job" | "general";
  area: string | null;
  level: string | null;
  language: "pt" | "en";
  job_context: JobContext | null;
  status: "active" | "completed";
  question_count: number;
  good_count: number;
  good_streak: number;
  verdict: SessionVerdict | null;
  created_at: string;
  updated_at: string;
}

interface TurnRow {
  id: string;
  role: "assistant" | "user";
  content: string;
  evaluation: Evaluation | null;
  created_at: string;
}

interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AiIo {
  inputChars: number;
  outputChars: number;
}

// O que cada chamada espera do modelo; incoerencia com o modo e falha da
// tentativa (entra no retry), nunca resposta valida.
type ExpectMode = "first" | "evaluate" | "closing";

function isCoherent(result: InterviewTurnResult, expect: ExpectMode): boolean {
  const hasQuestion =
    typeof result.nextQuestion === "string" &&
    result.nextQuestion.trim().length > 0;
  const hasClosing =
    typeof result.closing === "string" && result.closing.trim().length > 0;

  if (expect === "first") {
    return result.evaluation === null && hasQuestion && !hasClosing;
  }
  if (expect === "evaluate") {
    return result.evaluation !== null && hasQuestion && !hasClosing;
  }
  return hasClosing && result.nextQuestion === null;
}

async function callInterviewModelOnce(
  messages: ModelMessage[],
  expect: ExpectMode,
  onIo: (io: AiIo) => void,
): Promise<InterviewTurnResult> {
  const response = await fetchWithTimeout(
    OPENAI_BASE_URL,
    {
      method: "POST",
      headers: buildOpenAIHeaders(env.openaiApiKey),
      body: JSON.stringify({
        model: TOOL_CONFIG.model,
        temperature: TOOL_CONFIG.temperature,
        max_tokens: MAX_TOKENS,
        messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "interview_turn",
            strict: true,
            schema: INTERVIEW_TURN_JSON_SCHEMA,
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

  const validation = InterviewTurnResultSchema.safeParse(parsed);
  if (!validation.success) {
    const issues = JSON.stringify(validation.error.issues).slice(0, 300);
    throw new Error(`Resposta da IA nao bateu com o schema: ${issues}`);
  }

  if (!isCoherent(validation.data, expect)) {
    throw new Error(
      `Resposta da IA incoerente com o estado ${expect} do turno.`,
    );
  }

  const inputChars = messages.reduce((acc, m) => acc + m.content.length, 0);
  onIo({ inputChars, outputChars: content.length });
  return validation.data;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callInterviewModel(
  messages: ModelMessage[],
  expect: ExpectMode,
  onIo: (io: AiIo) => void,
): Promise<InterviewTurnResult> {
  if (!env.openaiApiKey) {
    throw new Error("Servico de IA nao configurado.");
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await callInterviewModelOnce(messages, expect, onIo);
    } catch (err) {
      lastError = err;
      const detail = err instanceof Error ? err.message : String(err);
      console.error(
        `[interview] IA tentativa ${attempt}/${AI_MAX_ATTEMPTS} (${expect}) falhou: ${detail}`,
      );
      if (attempt < AI_MAX_ATTEMPTS) {
        await sleep(AI_BACKOFF_MS[attempt - 1] ?? 800);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Falha ao gerar o turno da entrevista.");
}

function sessionContextMessage(session: {
  kind: "job" | "general";
  area: string | null;
  level: string | null;
  language: "pt" | "en";
  job_context: JobContext | null;
}): ModelMessage {
  const lines = [
    `Contexto da entrevista: area ${session.area ?? "(nao informada)"}, nivel ${session.level ?? "(nao informado)"}.`,
  ];
  if (session.language === "en") {
    // Sobrepoe o portugues do prompt base: a pessoa esta treinando o idioma
    // real da entrevista. So o conteudo muda; o shape JSON e identico.
    lines.push(
      "Session language: ENGLISH. This overrides the default Portuguese instruction. Conduct the ENTIRE interview in natural, professional tech-interview English: every question, every evaluation feedback, every hint and the final closing verdict. Keep the interview in English even if the candidate replies in Portuguese (practicing English is the point). The JSON output format and its field names stay exactly the same.",
    );
  }
  if (session.kind === "job" && session.job_context?.extractedText) {
    lines.push(
      "Texto da vaga (unico fato sobre a vaga; nao invente nada alem dele):",
      session.job_context.extractedText,
    );
  } else {
    lines.push(
      "Entrevista geral da area, sem vaga especifica: calibre pelas competencias tipicas da area e do nivel.",
    );
  }
  return { role: "system", content: lines.join("\n") };
}

/**
 * Mantem o contexto dentro de maxInputChars: preserva a primeira pergunta e
 * descarta os turnos mais antigos seguintes ate caber. fixedChars e o custo dos
 * blocos fora do historico (prompts de sistema, resposta atual, instrucao).
 */
function trimHistory(
  history: ModelMessage[],
  fixedChars: number,
): ModelMessage[] {
  const budget = TOOL_CONFIG.maxInputChars - fixedChars;
  const size = (msgs: ModelMessage[]) =>
    msgs.reduce((acc, m) => acc + m.content.length, 0);

  if (size(history) <= budget || history.length === 0) return history;

  const first = history[0];
  const rest = history.slice(1);
  while (rest.length > 1 && size([first, ...rest]) > budget) {
    rest.shift();
  }
  return [first, ...rest];
}

const FIRST_QUESTION_INSTRUCTION: ModelMessage = {
  role: "system",
  content:
    "Estado do turno: inicio da entrevista. Gere a PRIMEIRA pergunta em nextQuestion. Deixe evaluation e closing como null.",
};

const EVALUATE_INSTRUCTION: ModelMessage = {
  role: "system",
  content:
    "Estado do turno: entrevista em andamento. Avalie a ultima resposta do candidato em evaluation (rating e feedback) e faca a proxima pergunta em nextQuestion. Deixe closing como null.",
};

function closingInstruction(goodCount: number, questionCount: number, reason: "prepared" | "question_cap"): ModelMessage {
  const reasonLine =
    reason === "prepared"
      ? "O candidato atingiu o criterio de preparo."
      : "A sessao atingiu o limite de perguntas.";
  return {
    role: "system",
    content:
      `Estado do turno: encerramento. ${reasonLine} Estatisticas da sessao: ${goodCount} respostas boas de ${questionCount} avaliadas. ` +
      "Escreva em closing um veredito final honesto de preparo, reconhecendo pontos fortes e o que ainda estudar, com proximos passos concretos. Deixe nextQuestion como null e evaluation como null.",
  };
}

function turnsToMessages(turns: TurnRow[]): ModelMessage[] {
  return turns.map((t) => ({ role: t.role, content: t.content }));
}

async function loadOwnSession(
  userId: string,
  sessionId: string,
): Promise<{ ok: true; session: SessionRow | null } | { ok: false }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("interview_sessions")
      .select(
        "id, kind, area, level, language, job_context, status, question_count, good_count, good_streak, verdict, created_at, updated_at",
      )
      .eq("user_id", userId)
      .eq("id", sessionId)
      .maybeSingle();

    if (error) {
      console.warn("[interview] loadOwnSession falhou:", error.message);
      return { ok: false };
    }
    return { ok: true, session: (data as SessionRow | null) ?? null };
  } catch (err) {
    console.warn("[interview] loadOwnSession lancou:", err);
    return { ok: false };
  }
}

async function loadTurns(
  sessionId: string,
): Promise<{ ok: true; turns: TurnRow[] } | { ok: false }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("interview_turns")
      .select("id, role, content, evaluation, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("[interview] loadTurns falhou:", error.message);
      return { ok: false };
    }
    return { ok: true, turns: (data ?? []) as TurnRow[] };
  } catch (err) {
    console.warn("[interview] loadTurns lancou:", err);
    return { ok: false };
  }
}

async function insertTurn(
  sessionId: string,
  role: "assistant" | "user",
  content: string,
  evaluation: Evaluation | null,
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from("interview_turns").insert({
      session_id: sessionId,
      role,
      content,
      evaluation,
    });
    if (error) {
      console.warn("[interview] insertTurn falhou:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[interview] insertTurn lancou:", err);
    return false;
  }
}

async function updateSession(
  userId: string,
  sessionId: string,
  patch: Record<string, unknown>,
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("interview_sessions")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("id", sessionId);
    if (error) {
      console.warn("[interview] updateSession falhou:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[interview] updateSession lancou:", err);
    return false;
  }
}

// POST /api/interview/sessions: cria a sessao e gera a primeira pergunta.
router.post(
  "/sessions",
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isPro) {
      return next(
        createError(
          403,
          "forbidden",
          "Recurso Pro. Assine o Plano Pro para usar a entrevista simulada.",
        ),
      );
    }

    const parsedBody = CreateSessionSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return next(
        createError(
          400,
          "invalid_request",
          "Dados invalidos. Confira area, nivel e o contexto da vaga.",
        ),
      );
    }

    const body = parsedBody.data;
    const userId = req.user!.id;
    const requestId =
      (res.locals.requestId as string | undefined) ?? crypto.randomUUID();

    // Quota global ANTES de qualquer chamada cara (fetch da vaga incluso).
    const usage = await checkAiDailyLimit(userId, !!req.isPro, "[interview]");
    if (!usage.allowed) {
      if (usage.verificationFailed) {
        await logAiUsage({
          userId,
          tool: INTERVIEW_SESSION_TOOL,
          requestId,
          status: "error",
          errorMessage: "rate limit check failed",
        });
        // TODO(Ana): mensagem de falha ao verificar o limite de uso (503).
        return next(
          createError(
            503,
            "rate_check_failed",
            "Nao foi possivel verificar seu limite de uso agora. Tente novamente em instantes.",
          ),
        );
      }
      await logAiUsage({
        userId,
        tool: INTERVIEW_SESSION_TOOL,
        requestId,
        status: "rate_limited",
      });
      return next(
        createError(
          429,
          "rate_limited",
          `Limite diario de ${usage.limit} chamadas de IA atingido. Tente novamente amanha.`,
        ),
      );
    }

    // Monta o contexto da vaga. jobText colado tem prioridade sobre jobUrl
    // (a pessoa colou de proposito e evita um fetch de rede).
    let jobContext: JobContext | null = null;
    if (body.kind === "job") {
      const pastedText = body.jobText?.trim() ?? "";
      if (pastedText.length > 0) {
        const truncated = pastedText.length > JOB_TEXT_MAX_CHARS;
        jobContext = {
          source: "text",
          extractedText: pastedText.slice(0, JOB_TEXT_MAX_CHARS),
          ...(truncated ? { truncated: true } : {}),
        };
      } else {
        const jobUrl = body.jobUrl!.trim();
        try {
          const extractedText = await fetchExternalPageText(jobUrl);
          jobContext = { source: "url", url: jobUrl, extractedText };
        } catch (err) {
          if (err instanceof JobFetchError) {
            // 422 com reason especifico SEM criar sessao: o client cai para o
            // caminho de colar o texto da vaga. Resposta direta porque o shape
            // carrega `reason`, que o createError nao transporta.
            // TODO(Ana): mensagem de falha ao ler a URL da vaga.
            return res.status(422).json({
              error: {
                code: "job_fetch_failed",
                reason: err.code,
                message:
                  "Nao consegui ler a vaga a partir da URL. Cole o texto da vaga para continuar.",
              },
            });
          }
          return next(err);
        }
      }
    }

    let aiIo: AiIo = { inputChars: 0, outputChars: 0 };
    let firstQuestion: string;
    try {
      const messages: ModelMessage[] = [
        { role: "system", content: TOOL_CONFIG.systemPrompt },
        sessionContextMessage({
          kind: body.kind,
          area: body.area,
          level: body.level,
          language: body.language,
          job_context: jobContext,
        }),
        FIRST_QUESTION_INSTRUCTION,
      ];
      const result = await callInterviewModel(messages, "first", (io) => {
        aiIo = io;
      });
      firstQuestion = result.nextQuestion!.trim();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      await logAiUsage({
        userId,
        tool: INTERVIEW_SESSION_TOOL,
        requestId,
        status: "error",
        errorMessage: message,
      });
      return next(
        createError(
          502,
          "upstream_error",
          "Nao foi possivel iniciar a entrevista agora. Tente de novo.",
        ),
      );
    }

    // Sem sessao nao ha feature: falha de insert aqui e erro real (500), nao
    // fail-soft.
    let sessionId: string;
    try {
      const { data, error } = await supabaseAdmin
        .from("interview_sessions")
        .insert({
          user_id: userId,
          kind: body.kind,
          area: body.area,
          level: body.level,
          language: body.language,
          job_context: jobContext,
        })
        .select("id")
        .single();

      if (error || !data) {
        console.error(
          "[interview] insert de sessao falhou:",
          error?.message ?? "sem dados",
        );
        return next(
          createError(500, "db_error", "Erro ao criar a sessao de entrevista."),
        );
      }
      sessionId = (data as { id: string }).id;
    } catch (err) {
      console.error("[interview] insert de sessao lancou:", err);
      return next(
        createError(500, "db_error", "Erro ao criar a sessao de entrevista."),
      );
    }

    const turnOk = await insertTurn(sessionId, "assistant", firstQuestion, null);
    if (!turnOk) {
      // Sessao sem primeira pergunta e estado quebrado: desfaz (best-effort).
      await supabaseAdmin
        .from("interview_sessions")
        .delete()
        .eq("user_id", userId)
        .eq("id", sessionId);
      return next(
        createError(500, "db_error", "Erro ao criar a sessao de entrevista."),
      );
    }

    await logAiUsage({
      userId,
      tool: INTERVIEW_SESSION_TOOL,
      requestId,
      status: "success",
      inputChars: aiIo.inputChars,
      outputChars: aiIo.outputChars,
    });

    res.json({ data: { sessionId, question: firstQuestion } });
  },
);

// POST /api/interview/sessions/:id/answers: avalia a resposta e segue ou fecha.
router.post(
  "/sessions/:id/answers",
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isPro) {
      return next(
        createError(
          403,
          "forbidden",
          "Recurso Pro. Assine o Plano Pro para continuar a entrevista.",
        ),
      );
    }

    const { id } = req.params;
    if (!UUID_RE.test(id)) {
      return next(createError(404, "not_found", "Sessao nao encontrada."));
    }

    const userId = req.user!.id;
    const requestId =
      (res.locals.requestId as string | undefined) ?? crypto.randomUUID();

    const loaded = await loadOwnSession(userId, id);
    if (!loaded.ok) {
      return next(createError(500, "db_error", "Erro ao buscar a sessao."));
    }
    if (!loaded.session) {
      return next(createError(404, "not_found", "Sessao nao encontrada."));
    }
    const session = loaded.session;
    if (session.status !== "active") {
      return next(
        createError(409, "session_completed", "Esta sessao ja foi encerrada."),
      );
    }

    // Quota de turno propria (espelha o agent-chat), fail-closed.
    const usage = await checkInterviewTurnDailyLimit(userId);
    if (!usage.allowed) {
      if (usage.verificationFailed) {
        await logAiUsage({
          userId,
          tool: INTERVIEW_TURN_TOOL,
          requestId,
          status: "error",
          errorMessage: "rate limit check failed",
        });
        // TODO(Ana): mensagem de falha ao verificar o limite de turnos (503).
        return next(
          createError(
            503,
            "rate_check_failed",
            "Nao foi possivel verificar seu limite de uso agora. Tente novamente em instantes.",
          ),
        );
      }
      await logAiUsage({
        userId,
        tool: INTERVIEW_TURN_TOOL,
        requestId,
        status: "rate_limited",
      });
      return next(
        createError(
          429,
          "rate_limited",
          `Limite diario de ${usage.limit} turnos de entrevista atingido. Tente novamente amanha.`,
        ),
      );
    }

    const parsedBody = AnswerSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return next(
        createError(400, "invalid_request", "Resposta invalida ou vazia."),
      );
    }
    const answer = parsedBody.data.answer;

    const turnsLoaded = await loadTurns(session.id);
    if (!turnsLoaded.ok) {
      return next(createError(500, "db_error", "Erro ao buscar a sessao."));
    }
    const history = turnsToMessages(turnsLoaded.turns);

    const systemMessages: ModelMessage[] = [
      { role: "system", content: TOOL_CONFIG.systemPrompt },
      sessionContextMessage(session),
    ];
    const answerMessage: ModelMessage = { role: "user", content: answer };

    // Teto ja atingido na entrada (so acontece se um fechamento anterior falhou
    // no meio): fecha direto, sem avaliar a resposta atual.
    if (session.question_count >= QUESTION_CAP) {
      const instruction = closingInstruction(
        session.good_count,
        session.question_count,
        "question_cap",
      );
      const fixedChars =
        systemMessages[0].content.length +
        systemMessages[1].content.length +
        answerMessage.content.length +
        instruction.content.length;

      let aiIo: AiIo = { inputChars: 0, outputChars: 0 };
      let closing: string;
      try {
        const result = await callInterviewModel(
          [
            ...systemMessages,
            ...trimHistory(history, fixedChars),
            answerMessage,
            instruction,
          ],
          "closing",
          (io) => {
            aiIo = io;
          },
        );
        closing = result.closing!.trim();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro desconhecido";
        await logAiUsage({
          userId,
          tool: INTERVIEW_TURN_TOOL,
          requestId,
          status: "error",
          errorMessage: message,
        });
        return next(
          createError(
            502,
            "upstream_error",
            "Nao foi possivel concluir o turno agora. Tente de novo.",
          ),
        );
      }

      const verdict: SessionVerdict = {
        result: "question_cap",
        goodCount: session.good_count,
        questionCount: session.question_count,
        closing,
      };

      const wroteUser = await insertTurn(session.id, "user", answer, null);
      const wroteClosing =
        wroteUser && (await insertTurn(session.id, "assistant", closing, null));
      const wroteSession =
        wroteClosing &&
        (await updateSession(userId, session.id, {
          status: "completed",
          verdict,
        }));
      if (!wroteSession) {
        return next(createError(500, "db_error", "Erro ao salvar o turno."));
      }

      await logAiUsage({
        userId,
        tool: INTERVIEW_TURN_TOOL,
        requestId,
        status: "success",
        inputChars: aiIo.inputChars,
        outputChars: aiIo.outputChars,
      });

      return res.json({
        data: { evaluation: null, nextQuestion: null, done: true, verdict },
      });
    }

    // Turno normal: avalia a resposta e gera a proxima pergunta.
    const fixedChars =
      systemMessages[0].content.length +
      systemMessages[1].content.length +
      answerMessage.content.length +
      EVALUATE_INSTRUCTION.content.length;

    let evalIo: AiIo = { inputChars: 0, outputChars: 0 };
    let evaluation: Evaluation;
    let nextQuestion: string;
    try {
      const result = await callInterviewModel(
        [
          ...systemMessages,
          ...trimHistory(history, fixedChars),
          answerMessage,
          EVALUATE_INSTRUCTION,
        ],
        "evaluate",
        (io) => {
          evalIo = io;
        },
      );
      evaluation = result.evaluation!;
      nextQuestion = result.nextQuestion!.trim();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      await logAiUsage({
        userId,
        tool: INTERVIEW_TURN_TOOL,
        requestId,
        status: "error",
        errorMessage: message,
      });
      return next(
        createError(
          502,
          "upstream_error",
          "Nao foi possivel avaliar sua resposta agora. Tente de novo.",
        ),
      );
    }

    await logAiUsage({
      userId,
      tool: INTERVIEW_TURN_TOOL,
      requestId,
      status: "success",
      inputChars: evalIo.inputChars,
      outputChars: evalIo.outputChars,
    });

    const questionCount = session.question_count + 1;
    const goodCount =
      evaluation.rating === "boa" ? session.good_count + 1 : session.good_count;
    const goodStreak =
      evaluation.rating === "boa" ? session.good_streak + 1 : 0;

    const prepared =
      goodStreak >= PREPARED_STREAK ||
      (questionCount >= PREPARED_MIN_QUESTIONS &&
        goodCount / questionCount >= PREPARED_RATIO);
    const capped = questionCount >= QUESTION_CAP;
    const shouldClose = prepared || capped;

    // Persiste o turno avaliado antes de qualquer fechamento. Quando a sessao
    // vai fechar, a proxima pergunta nunca sera feita e ficaria pendurada no
    // historico recarregado: o content do turno vira o feedback da avaliacao
    // (a evaluation jsonb segue anexada). No fluxo normal o content e a
    // proxima pergunta.
    const assistantContent = shouldClose ? evaluation.feedback : nextQuestion;
    const wroteUser = await insertTurn(session.id, "user", answer, null);
    const wroteAssistant =
      wroteUser &&
      (await insertTurn(session.id, "assistant", assistantContent, evaluation));
    const wroteCounters =
      wroteAssistant &&
      (await updateSession(userId, session.id, {
        question_count: questionCount,
        good_count: goodCount,
        good_streak: goodStreak,
      }));
    if (!wroteCounters) {
      return next(createError(500, "db_error", "Erro ao salvar o turno."));
    }

    if (!shouldClose) {
      return res.json({
        data: { evaluation, nextQuestion, done: false },
      });
    }

    // Criterio de preparo (ou teto) atingido: SEGUNDA chamada pedindo o
    // veredito final com as estatisticas.
    const closeReason: "prepared" | "question_cap" = prepared
      ? "prepared"
      : "question_cap";
    const instruction = closingInstruction(goodCount, questionCount, closeReason);
    const closingFixedChars =
      systemMessages[0].content.length +
      systemMessages[1].content.length +
      instruction.content.length;

    let closeIo: AiIo = { inputChars: 0, outputChars: 0 };
    let closing: string;
    try {
      const closingHistory = [
        ...history,
        answerMessage,
        { role: "assistant" as const, content: evaluation.feedback },
      ];
      const result = await callInterviewModel(
        [
          ...systemMessages,
          ...trimHistory(closingHistory, closingFixedChars),
          instruction,
        ],
        "closing",
        (io) => {
          closeIo = io;
        },
      );
      closing = result.closing!.trim();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      await logAiUsage({
        userId,
        tool: INTERVIEW_TURN_TOOL,
        requestId,
        status: "error",
        errorMessage: message,
      });
      return next(
        createError(
          502,
          "upstream_error",
          "Nao foi possivel gerar o veredito final agora. Tente de novo.",
        ),
      );
    }

    const verdict: SessionVerdict = {
      result: closeReason,
      goodCount,
      questionCount,
      closing,
    };

    const wroteClosing = await insertTurn(
      session.id,
      "assistant",
      closing,
      null,
    );
    const wroteCompleted =
      wroteClosing &&
      (await updateSession(userId, session.id, {
        status: "completed",
        verdict,
      }));
    if (!wroteCompleted) {
      return next(createError(500, "db_error", "Erro ao encerrar a sessao."));
    }

    await logAiUsage({
      userId,
      tool: INTERVIEW_TURN_TOOL,
      requestId,
      status: "success",
      inputChars: closeIo.inputChars,
      outputChars: closeIo.outputChars,
    });

    return res.json({
      data: { evaluation, nextQuestion: null, done: true, verdict },
    });
  },
);

// POST /api/interview/sessions/:id/finish: encerramento manual, sem IA. Nao
// exige Pro: apenas fecha uma sessao do proprio dono (nao da acesso a nada).
router.post(
  "/sessions/:id/finish",
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!UUID_RE.test(id)) {
      return next(createError(404, "not_found", "Sessao nao encontrada."));
    }

    const userId = req.user!.id;
    const loaded = await loadOwnSession(userId, id);
    if (!loaded.ok) {
      return next(createError(500, "db_error", "Erro ao buscar a sessao."));
    }
    if (!loaded.session) {
      return next(createError(404, "not_found", "Sessao nao encontrada."));
    }
    if (loaded.session.status !== "active") {
      return next(
        createError(409, "session_completed", "Esta sessao ja foi encerrada."),
      );
    }

    const verdict: SessionVerdict = {
      result: "stopped_early",
      goodCount: loaded.session.good_count,
      questionCount: loaded.session.question_count,
    };

    const wrote = await updateSession(userId, id, {
      status: "completed",
      verdict,
    });
    if (!wrote) {
      return next(createError(500, "db_error", "Erro ao encerrar a sessao."));
    }

    res.json({ data: { verdict } });
  },
);

// GET /api/interview/sessions: historico do dono. Sem gate Pro: o historico e
// do usuario; so RETOMAR uma sessao (answers) exige Pro.
router.get(
  "/sessions",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("interview_sessions")
        .select(
          "id, kind, area, level, status, question_count, good_count, created_at",
        )
        .eq("user_id", req.user!.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        return next(
          createError(500, "db_error", "Erro ao buscar suas entrevistas."),
        );
      }
      res.json({ data: data ?? [] });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/interview/sessions/:id: sessao + turnos do dono. 404 identico para
// UUID invalido e sessao inexistente (nao vaza existencia).
router.get(
  "/sessions/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!UUID_RE.test(id)) {
      return next(createError(404, "not_found", "Sessao nao encontrada."));
    }

    const loaded = await loadOwnSession(req.user!.id, id);
    if (!loaded.ok) {
      return next(createError(500, "db_error", "Erro ao buscar a sessao."));
    }
    if (!loaded.session) {
      return next(createError(404, "not_found", "Sessao nao encontrada."));
    }

    const turnsLoaded = await loadTurns(loaded.session.id);
    if (!turnsLoaded.ok) {
      return next(createError(500, "db_error", "Erro ao buscar a sessao."));
    }

    res.json({
      data: { ...loaded.session, turns: turnsLoaded.turns },
    });
  },
);

export default router;
