import crypto from "crypto";
import { NextFunction, Request, Response, Router } from "express";

import {
  LinkedinAnalyzeRequestSchema,
  type LinkedinAnalysisResponse,
  type LinkedinAnalyzeRequest,
} from "../../shared/linkedin/schema";
import { checkAiDailyLimit, logAiUsage } from "../lib/aiUsage";
import {
  analyzeLinkedin,
  LinkedinUnreadableError,
} from "../lib/linkedinAnalyze";
import type { LinkedinParsed } from "../../shared/linkedin/parse";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

const TOOL = "linkedin-analyzer";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Persistência fail-soft: nunca derruba a análise e nunca é confundida com
 * sucesso, falha vira um console.error claro no servidor. O input jsonb guarda
 * o formulário e um resumo do parse (sem o texto cru gigante do perfil).
 */
async function persistAnalysis(
  userId: string,
  request: LinkedinAnalyzeRequest,
  response: LinkedinAnalysisResponse,
  parsed: LinkedinParsed,
): Promise<void> {
  try {
    const input = {
      area: request.area,
      level: request.level,
      mercado: request.mercado,
      skills: request.skills.slice(0, 2000),
      foto: request.foto,
      banner: request.banner,
      openToWork: request.openToWork,
      conexoes: request.conexoes,
      atividade: request.atividade,
      objetivo: request.objetivo ?? null,
      parseResumo: {
        headline: parsed.headline,
        sobreTamanho: response.deterministic.sobreTamanho,
        experienciasContagem: response.deterministic.experienciasContagem,
        skillsPdf: parsed.skillsPdf,
      },
    };

    const { error } = await supabaseAdmin.from("linkedin_analyses").insert({
      user_id: userId,
      area: request.area,
      level: request.level,
      score: response.deterministic.score,
      faixa: response.deterministic.faixa,
      input,
      result: response,
    });

    if (error) {
      console.error(
        "[linkedin] Falha ao persistir analise (fail-soft):",
        error.message,
      );
    }
  } catch (err) {
    console.error(
      "[linkedin] Erro inesperado ao persistir analise (fail-soft):",
      err,
    );
  }
}

router.post(
  "/analyze",
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isPro) {
      return next(
        createError(
          403,
          "forbidden",
          "Recurso Pro. Assine o Plano Pro para usar o analisador de LinkedIn.",
        ),
      );
    }

    const parsedBody = LinkedinAnalyzeRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return next(
        createError(
          400,
          "invalid_request",
          "Dados inválidos. Confira o texto do perfil e os campos do formulário.",
        ),
      );
    }

    const request = parsedBody.data;
    const userId = req.user!.id;
    const requestId =
    (res.locals.requestId as string | undefined) ?? crypto.randomUUID();

    const usage = await checkAiDailyLimit(userId, !!req.isPro, "[linkedin]");
    if (!usage.allowed) {
      // Falha de verificacao (RPC fora) e distinta de cota estourada: 503, nao
      // 429, e loga como "error" pra nao poluir a metrica de rate_limited.
      // Espelha server/routes/github.ts.
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
            "Não foi possível verificar seu limite de uso agora. Tente novamente em instantes.",
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
          `Limite diário de ${usage.limit} chamadas de IA atingido. Tente novamente amanhã.`,
        ),
      );
    }

    let aiUsed = false;
    let aiIo = { inputChars: 0, outputChars: 0 };
    try {
      const { response, parsed } = await analyzeLinkedin(request, (io) => {
        aiUsed = true;
        aiIo = io;
      });
      const outputChars = JSON.stringify(response).length;
      // So conta no limite diario quando a IA rodou de fato. O atalho caloroso
      // (perfil quase vazio) loga como "skipped", que nao conta na cota.
      await logAiUsage({
        userId,
        tool: TOOL,
        requestId,
        status: aiUsed ? "success" : "skipped",
        inputChars: aiIo.inputChars,
        outputChars,
      });

      await persistAnalysis(userId, request, response, parsed);

      res.json({ data: response });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      await logAiUsage({
        userId,
        tool: TOOL,
        requestId,
        status: "error",
        errorMessage: message,
      });

      if (err instanceof LinkedinUnreadableError) {
        return next(
          createError(
            422,
            "unreadable_profile",
            "Não consegui ler seu perfil a partir do texto enviado. Tente colar o texto do perfil manualmente.",
          ),
        );
      }
      return next(
        createError(
          502,
          "upstream_error",
          "Não foi possível concluir a análise agora. Tente de novo.",
        ),
      );
    }
  },
);

router.get(
  "/analyses",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("linkedin_analyses")
        .select("id, area, level, score, faixa, created_at")
        .eq("user_id", req.user!.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        return next(
          createError(500, "db_error", "Erro ao buscar suas análises."),
        );
      }
      res.json({ data: data ?? [] });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/analyses/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!UUID_RE.test(id)) {
      return next(createError(404, "not_found", "Análise não encontrada."));
    }
    try {
      const { data, error } = await supabaseAdmin
        .from("linkedin_analyses")
        .select("id, area, level, score, faixa, created_at, result")
        .eq("user_id", req.user!.id)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        return next(createError(500, "db_error", "Erro ao buscar a análise."));
      }
      if (!data) {
        return next(createError(404, "not_found", "Análise não encontrada."));
      }
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
