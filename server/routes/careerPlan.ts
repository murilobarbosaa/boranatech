import crypto from "crypto";
import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";

import { estimateCost } from "../lib/aiTools";
import {
  CAREER_PLAN_CHAT_TOOL,
  checkAiDailyLimit,
  checkCareerPlanChatDailyLimit,
  logAiUsage,
} from "../lib/aiUsage";
import {
  CAREER_PLAN_BUDGETS,
  generateCareerPlan,
  type CareerPlanAiIo,
  type CareerPlanChecklistItem,
  type CareerPlanIntake,
  type CareerPlanStoredResult,
} from "../lib/careerPlan/generate";
import {
  runIntakeChatTurn,
  validateIntakeChatBody,
  type IntakeChatAiIo,
} from "../lib/careerPlan/intakeChat";
import { fetchUsdBrlRate } from "../lib/fx/ptax";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { fetchUserContextPool } from "../lib/userContext/pool";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

/**
 * Plano de carreira (Pro). Mesmas regras de seguranca do molde
 * server/routes/linkedin.ts: identidade de req.user.id, tier fail-closed com
 * recheck !req.isPro, supabaseAdmin sempre filtrando user_id, quota
 * fail-closed (503/429), 404 identico para UUID invalido e plano inexistente.
 */

const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

const TOOL = "career-plan";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GenerateSchema = z.object({
  goal: z.string().trim().min(10).max(500),
  area: z.string().trim().min(1).max(60),
  level: z.string().trim().min(1).max(60),
  hoursPerWeek: z.number().int().min(1).max(40),
  horizonMonths: z.number().int().min(3).max(24),
  budget: z.enum(CAREER_PLAN_BUDGETS),
});

interface PlanRow {
  id: string;
  status: "active" | "archived";
  intake: CareerPlanIntake;
  result: CareerPlanStoredResult;
  catalog_version: string;
  created_at: string;
  updated_at: string;
}

// GET /api/career-plan/context: prefill do intake. Dono, sem gate Pro
// (checkProStatus so injeta req.isPro). Campos null quando ausentes, nunca
// inventa. Espelha a rota /context do roadmap com IA.
router.get(
  "/context",
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    try {
      const pool = await fetchUserContextPool(userId);

      const careerGoal =
        pool.profile.ok && pool.profile.data?.careerGoal
          ? pool.profile.data.careerGoal
          : null;

      const area =
        pool.quiz.ok && pool.quiz.data?.areaSlug
          ? pool.quiz.data.areaSlug
          : (pool.quiz.ok && pool.quiz.data?.area) || null;

      const level =
        pool.quiz.ok && pool.quiz.data?.level ? pool.quiz.data.level : null;

      // Media semanal derivada da janela de 30 dias do diario; null sem dados.
      const weeklyMinutes30d =
        pool.studyDiary.ok && pool.studyDiary.data.totalMinutes30d > 0
          ? Math.round((pool.studyDiary.data.totalMinutes30d / 30) * 7)
          : null;

      res.json({ data: { careerGoal, area, level, weeklyMinutes30d } });
    } catch (err) {
      console.error("[career-plan] contexto do intake falhou:", err);
      // TODO(Ana): mensagem de falha ao carregar o contexto do intake.
      return next(
        createError(
          500,
          "context_failed",
          "Nao foi possivel carregar seu contexto agora.",
        ),
      );
    }
  },
);

// GET /api/career-plan/fx: cotacao PTAX de venda USD/BRL para o total em
// reais do investimento. Indisponibilidade de cotacao NAO e erro do nosso
// sistema: 204 sem corpo e a UI omite a conversao em silencio; erros
// inesperados logam e viram 204 tambem, NUNCA 500. Sem quota de IA (nao e
// IA, nao entra em AI_TOOLS).
router.get("/fx", async (_req: Request, res: Response) => {
  try {
    const fx = await fetchUsdBrlRate();
    if (!fx) {
      res.status(204).end();
      return;
    }
    res.json({ usdBrl: fx.usdBrl, quoteDate: fx.quoteDate });
  } catch (err) {
    console.error("[career-plan] cotacao ptax falhou:", err);
    res.status(204).end();
  }
});

// POST /api/career-plan/generate: gera e persiste um plano novo (o anterior
// ativo e arquivado).
router.post(
  "/generate",
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isPro) {
      return next(
        createError(
          403,
          "forbidden",
          "Recurso Pro. Assine o Plano Pro para gerar seu plano de carreira.",
        ),
      );
    }

    const parsedBody = GenerateSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return next(
        createError(
          400,
          "invalid_request",
          "Dados invalidos. Confira objetivo, area, nivel, horas e orcamento.",
        ),
      );
    }

    const intake: CareerPlanIntake = parsedBody.data;
    const userId = req.user!.id;
    const requestId =
      (res.locals.requestId as string | undefined) ?? crypto.randomUUID();

    const usage = await checkAiDailyLimit(userId, !!req.isPro, "[career-plan]");
    if (!usage.allowed) {
      if (usage.verificationFailed) {
        await logAiUsage({
          userId,
          tool: TOOL,
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
        tool: TOOL,
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

    let aiIo: CareerPlanAiIo = { inputChars: 0, outputChars: 0 };
    let stored: CareerPlanStoredResult;
    let catalogVersion: string;
    try {
      const generated = await generateCareerPlan(userId, intake, (io) => {
        aiIo = io;
      });
      stored = generated.result;
      catalogVersion = generated.catalogVersion;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      await logAiUsage({
        userId,
        tool: TOOL,
        requestId,
        status: "error",
        errorMessage: message,
      });
      return next(
        createError(
          502,
          "upstream_error",
          "Nao foi possivel gerar o plano agora. Tente de novo.",
        ),
      );
    }

    // Sem plano nao ha feature: falha de insert e erro real (500). O novo
    // plano e inserido ANTES de arquivar os anteriores: se o insert falhar, o
    // plano ativo anterior segue intacto.
    let planId: string;
    try {
      const { data, error } = await supabaseAdmin
        .from("career_plans")
        .insert({
          user_id: userId,
          intake,
          result: stored,
          catalog_version: catalogVersion,
        })
        .select("id")
        .single();

      if (error || !data) {
        console.error(
          "[career-plan] insert do plano falhou:",
          error?.message ?? "sem dados",
        );
        return next(
          createError(500, "db_error", "Erro ao salvar o plano de carreira."),
        );
      }
      planId = (data as { id: string }).id;
    } catch (err) {
      console.error("[career-plan] insert do plano lancou:", err);
      return next(
        createError(500, "db_error", "Erro ao salvar o plano de carreira."),
      );
    }

    // Arquiva os ativos anteriores (best-effort: falha nao derruba o plano
    // novo, mas e logada; o GET /plans lista por updated_at desc).
    try {
      const { error } = await supabaseAdmin
        .from("career_plans")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("status", "active")
        .neq("id", planId);
      if (error) {
        console.warn(
          "[career-plan] arquivamento de planos anteriores falhou:",
          error.message,
        );
      }
    } catch (err) {
      console.warn("[career-plan] arquivamento lancou:", err);
    }

    await logAiUsage({
      userId,
      tool: TOOL,
      requestId,
      status: "success",
      inputChars: aiIo.inputChars,
      outputChars: aiIo.outputChars,
    });

    res.json({ data: { planId } });
  },
);

// GET /api/career-plan/plans: historico do dono, sem gate Pro (gerar exige).
router.get(
  "/plans",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("career_plans")
        .select("id, status, created_at, intake, result")
        .eq("user_id", req.user!.id)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (error) {
        return next(
          createError(500, "db_error", "Erro ao buscar seus planos."),
        );
      }

      const rows = (data ?? []) as Array<
        Pick<PlanRow, "id" | "status" | "created_at" | "intake" | "result">
      >;
      const plans = rows.map((row) => ({
        id: row.id,
        status: row.status,
        created_at: row.created_at,
        area: row.intake?.area ?? null,
        goal: row.intake?.goal ?? null,
        checklistTotal: Array.isArray(row.result?.checklist)
          ? (row.result.checklist as CareerPlanChecklistItem[]).length
          : 0,
      }));
      res.json({ data: plans });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/career-plan/plans/:id: plano completo do dono. 404 identico para
// UUID invalido e plano inexistente (nao vaza existencia).
router.get(
  "/plans/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!UUID_RE.test(id)) {
      return next(createError(404, "not_found", "Plano nao encontrado."));
    }

    try {
      const { data, error } = await supabaseAdmin
        .from("career_plans")
        .select(
          "id, status, intake, result, catalog_version, created_at, updated_at",
        )
        .eq("user_id", req.user!.id)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        return next(createError(500, "db_error", "Erro ao buscar o plano."));
      }
      if (!data) {
        return next(createError(404, "not_found", "Plano nao encontrado."));
      }
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/career-plan/intake/chat: um turno do chat de intake. NAO gera plano
// e NAO persiste conversa (efemera; o client mantem o historico e reenvia a cada
// turno, como o agente). A geracao segue na rota /generate, que revalida tudo.
router.post(
  "/intake/chat",
  async (req: Request, res: Response, next: NextFunction) => {
    // Recheck fail-closed: qualquer coisa diferente de true e tratada como nao Pro.
    if (req.isPro !== true) {
      return next(
        createError(
          403,
          "forbidden",
          "Recurso Pro. Assine o Plano Pro para montar seu plano de carreira.",
        ),
      );
    }

    const userId = req.user!.id;
    const requestId =
      (res.locals.requestId as string | undefined) ?? crypto.randomUUID();

    const body = validateIntakeChatBody(req.body);
    if (!body.ok) {
      if (body.error === "turn_limit") {
        // TODO(Ana): mensagem de limite de turnos do chat (a UI oferece o formulario).
        return next(
          createError(
            400,
            "turn_limit",
            "Chegamos ao limite desta conversa. Prefira preencher o formulario para gerar seu plano.",
          ),
        );
      }
      if (body.error === "payload_too_large") {
        // TODO(Ana): mensagem de conversa longa demais.
        return next(
          createError(
            400,
            "payload_too_large",
            "Conversa longa demais. Comece uma nova ou use o formulario.",
          ),
        );
      }
      // TODO(Ana): mensagem de requisicao invalida.
      return next(
        createError(400, "invalid_request", "Envie pelo menos uma mensagem valida."),
      );
    }

    // Quota DEDICADA por tool (nao a global): fail-closed 503 na falha de
    // verificacao, 429 no limite atingido. logAiUsage por turno.
    const usage = await checkCareerPlanChatDailyLimit(userId);
    if (!usage.allowed) {
      if (usage.verificationFailed) {
        await logAiUsage({
          userId,
          tool: CAREER_PLAN_CHAT_TOOL,
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
        tool: CAREER_PLAN_CHAT_TOOL,
        requestId,
        status: "rate_limited",
      });
      // TODO(Ana): mensagem de limite diario de mensagens do chat atingido (429).
      return next(
        createError(
          429,
          "rate_limited",
          "Limite diario de mensagens do chat atingido. Tente novamente amanha.",
        ),
      );
    }

    let aiIo: IntakeChatAiIo = { inputChars: 0, outputChars: 0 };
    try {
      const turn = await runIntakeChatTurn(userId, body.messages, (io) => {
        aiIo = io;
      });
      await logAiUsage({
        userId,
        tool: CAREER_PLAN_CHAT_TOOL,
        requestId,
        status: "success",
        inputChars: aiIo.inputChars,
        outputChars: aiIo.outputChars,
        costEstimate: estimateCost(aiIo.inputChars, aiIo.outputChars),
      });
      res.json({
        reply: turn.reply,
        intake: turn.intake,
        missing: turn.missing,
        ready: turn.ready,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      await logAiUsage({
        userId,
        tool: CAREER_PLAN_CHAT_TOOL,
        requestId,
        status: "error",
        errorMessage: message,
        inputChars: aiIo.inputChars,
      });
      // TODO(Ana): mensagem de erro ao processar o turno do chat (502).
      return next(
        createError(
          502,
          "upstream_error",
          "Nao foi possivel responder agora. Tente de novo.",
        ),
      );
    }
  },
);

export default router;
