import crypto from "crypto";
import { NextFunction, Request, Response, Router } from "express";

import {
  computeResumeScore,
  ResumeAnalyzeRequestSchema,
  type ResumeAnalysisModel,
  type ResumeScoreResult,
} from "../../shared/resumeAnalysis/schema";
import { estimateCost } from "../lib/aiTools";
import { checkAiDailyLimit, logAiUsage } from "../lib/aiUsage";
import { env } from "../lib/env";
import { runResumeQualitative, type ResumeAiIo } from "../lib/resumeAnalyze";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

// Analisador de Curriculo (Pro), montado em /api/resume, no molde EXATO de
// server/routes/linkedin.ts: gate Pro explicito, quota fail-closed ANTES da
// OpenAI, nota deterministica calculada NO SERVIDOR (nunca confiar em score
// vindo do client), chamada unica json_schema strict, persistencia fail-soft
// e historico do dono.

const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

// Chave de quota/custo registrada em AI_TOOLS (internalOnly: nao e servida
// pela rota generica /api/ai; a analise real passa SO por aqui).
const RESUME_ANALYZER_TOOL = "resume-analyzer";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PersistParams {
  userId: string;
  score: ResumeScoreResult;
  targetRole: string | null;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
}

// Persistencia fail-soft: falha vira warn e a analise segue para o cliente.
async function persistAnalysis(params: PersistParams): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("resume_analyses")
      .insert({
        user_id: params.userId,
        score: params.score.score,
        faixa: params.score.faixa,
        target_role: params.targetRole,
        input: params.input,
        result: params.result,
      })
      .select("id")
      .single();
    if (error || !data) {
      console.warn("[resume] persistencia da analise falhou:", error?.message);
      return null;
    }
    return (data as { id: string }).id;
  } catch (err) {
    console.warn("[resume] persistencia da analise falhou:", err);
    return null;
  }
}

router.post("/analyze", async (req: Request, res: Response, next: NextFunction) => {
  const requestId = crypto.randomUUID();
  const userId = req.user!.id;

  // Fail-closed: qualquer coisa diferente de true e tratada como free.
  if (req.isPro !== true) {
    // TODO(Ana): mensagem de recurso exclusivo Pro.
    return next(
      createError(403, "pro_required", "A analise de curriculo e exclusiva do Plano Pro."),
    );
  }

  const parsed = ResumeAnalyzeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    // TODO(Ana): mensagem de curriculo invalido para analise.
    return next(
      createError(
        400,
        "invalid_request",
        "Texto do curriculo invalido. Envie entre 200 e 12000 caracteres.",
      ),
    );
  }
  const request = parsed.data;

  const usage = await checkAiDailyLimit(userId, true, "[resume]");
  if (!usage.allowed) {
    if (usage.verificationFailed) {
      await logAiUsage({
        userId,
        tool: RESUME_ANALYZER_TOOL,
        requestId,
        status: "error",
        errorMessage: "rate limit check failed",
      });
      // TODO(Ana): mensagem de falha de verificacao de limite.
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
      tool: RESUME_ANALYZER_TOOL,
      requestId,
      status: "rate_limited",
    });
    // TODO(Ana): mensagem de limite diario atingido.
    return next(
      createError(
        429,
        "rate_limited",
        "Limite diario de ferramentas de IA atingido. Tente novamente amanha.",
      ),
    );
  }

  if (!env.openaiApiKey) {
    // TODO(Ana): mensagem de servico nao configurado.
    return next(createError(503, "upstream_error", "Servico de IA nao configurado."));
  }

  // Nota deterministica calculada AQUI: mesma entrada, mesma nota, sempre.
  const score = computeResumeScore(request.resumeText);

  let qualitative: ResumeAnalysisModel;
  let io: ResumeAiIo = { inputChars: 0, outputChars: 0 };
  try {
    qualitative = await runResumeQualitative(request, score, (value) => {
      io = value;
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await logAiUsage({
      userId,
      tool: RESUME_ANALYZER_TOOL,
      requestId,
      status: "error",
      errorMessage: detail.slice(0, 300),
      inputChars: request.resumeText.length,
    });
    // Falha da IA nao persiste nada e nao cobra quota (so success conta).
    // TODO(Ana): mensagem de falha da analise.
    return next(
      createError(502, "upstream_error", "A IA nao conseguiu analisar agora. Tente novamente."),
    );
  }

  const result = { score: score.score, faixa: score.faixa, criterios: score.criterios, qualitative };
  const analysisId = await persistAnalysis({
    userId,
    score,
    targetRole: request.targetRole ?? null,
    input: {
      resumeText: request.resumeText,
      targetRole: request.targetRole ?? null,
      jobPostingText: request.jobPostingText ?? null,
    },
    result,
  });

  await logAiUsage({
    userId,
    tool: RESUME_ANALYZER_TOOL,
    requestId,
    status: "success",
    inputChars: io.inputChars,
    outputChars: io.outputChars,
    costEstimate: estimateCost(io.inputChars, io.outputChars),
  });

  res.json({
    id: analysisId,
    score: score.score,
    faixa: score.faixa,
    criterios: score.criterios,
    qualitative,
    targetRole: request.targetRole ?? null,
  });
});

// Historico do dono, sem gate Pro (um ex-Pro continua vendo o que gerou).
// Teto de linhas da lista. Ajustavel. // TODO: calibrar.
const HISTORY_LIMIT = 20;

router.get("/analyses", async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { data, error } = await supabaseAdmin
    .from("resume_analyses")
    .select("id, score, faixa, target_role, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  if (error) {
    // TODO(Ana): mensagem de falha ao listar analises.
    return next(createError(500, "list_failed", "Nao foi possivel listar suas analises."));
  }
  res.json({ analyses: data ?? [] });
});

router.get("/analyses/:id", async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const id = req.params.id;
  if (!UUID_RE.test(id)) {
    // TODO(Ana): mensagem de analise nao encontrada.
    return next(createError(404, "not_found", "Analise nao encontrada."));
  }
  const { data, error } = await supabaseAdmin
    .from("resume_analyses")
    .select("id, score, faixa, target_role, input, result, created_at")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    // TODO(Ana): mensagem de falha ao carregar a analise.
    return next(createError(500, "load_failed", "Nao foi possivel carregar a analise."));
  }
  if (!data) {
    // 404 tambem para linha de OUTRO usuario: nao vaza existencia.
    // TODO(Ana): mensagem de analise nao encontrada.
    return next(createError(404, "not_found", "Analise nao encontrada."));
  }
  res.json(data);
});

export default router;
