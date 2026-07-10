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
 * Devolve o id da linha inserida (o client precisa dele pro checklist de
 * melhorias aplicadas) ou null quando a persistência falhou, espelhando o
 * persistGithubAnalysis.
 */
async function persistAnalysis(
  userId: string,
  request: LinkedinAnalyzeRequest,
  response: LinkedinAnalysisResponse,
  parsed: LinkedinParsed,
): Promise<string | null> {
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

    const { data, error } = await supabaseAdmin
      .from("linkedin_analyses")
      .insert({
        user_id: userId,
        area: request.area,
        level: request.level,
        score: response.deterministic.score,
        faixa: response.deterministic.faixa,
        input,
        result: response,
      })
      .select("id")
      .single();

    if (error) {
      console.error(
        "[linkedin] Falha ao persistir analise (fail-soft):",
        error.message,
      );
      return null;
    }
    return (data as { id: string } | null)?.id ?? null;
  } catch (err) {
    console.error(
      "[linkedin] Erro inesperado ao persistir analise (fail-soft):",
      err,
    );
    return null;
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

      const analysisId = await persistAnalysis(
        userId,
        request,
        response,
        parsed,
      );

      res.json({ data: response, analysisId });
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

// Progresso das melhorias aplicadas (o checklist vivo do resultado), espelho
// das rotas do analisador de GitHub. Sem gate Pro alem do requireAuth do
// router: e progresso do PROPRIO dado (um ex-Pro segue marcando as analises
// antigas). Nenhum custo de IA aqui.

// Teto do indice aceito (as melhorias vem 4 a 7 por analise; folga proposital).
const MAX_IMPROVEMENT_INDEX = 20;

// Posse da analise ANTES de qualquer leitura/escrita de progresso: true/false
// pela existencia da linha do dono, null em erro de query (vira 500).
async function ownsLinkedinAnalysis(
  userId: string,
  analysisId: string,
): Promise<boolean | null> {
  const { data, error } = await supabaseAdmin
    .from("linkedin_analyses")
    .select("id")
    .eq("user_id", userId)
    .eq("id", analysisId)
    .maybeSingle();
  if (error) {
    console.error(
      "[linkedin] checagem de posse da analise falhou:",
      error.message,
    );
    return null;
  }
  return Boolean(data);
}

router.get(
  "/analyses/:id/improvements",
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { id } = req.params;
    if (!UUID_RE.test(id)) {
      return next(createError(404, "not_found", "Análise não encontrada."));
    }
    const owns = await ownsLinkedinAnalysis(userId, id);
    if (owns === null) {
      // TODO(Ana): mensagem de falha ao carregar o progresso.
      return next(
        createError(
          500,
          "load_failed",
          "Não foi possível carregar o progresso.",
        ),
      );
    }
    if (!owns) {
      // 404 tambem para analise de OUTRO usuario: nao vaza existencia.
      return next(createError(404, "not_found", "Análise não encontrada."));
    }
    const { data, error } = await supabaseAdmin
      .from("linkedin_improvement_progress")
      .select("improvement_index")
      .eq("user_id", userId)
      .eq("analysis_id", id)
      .eq("done", true);
    if (error) {
      return next(
        createError(
          500,
          "load_failed",
          "Não foi possível carregar o progresso.",
        ),
      );
    }
    res.json({
      applied: ((data ?? []) as Array<{ improvement_index: number }>).map(
        (row) => row.improvement_index,
      ),
    });
  },
);

router.put(
  "/analyses/:id/improvements/:index",
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { id } = req.params;
    if (!UUID_RE.test(id)) {
      return next(createError(404, "not_found", "Análise não encontrada."));
    }
    const index = Number(req.params.index);
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index > MAX_IMPROVEMENT_INDEX
    ) {
      // TODO(Ana): mensagem de indice invalido.
      return next(
        createError(400, "invalid_request", "Índice de melhoria inválido."),
      );
    }
    const body = (req.body ?? {}) as { done?: unknown };
    if (typeof body.done !== "boolean") {
      // TODO(Ana): mensagem de body invalido do progresso.
      return next(
        createError(400, "invalid_request", "Envie done como boolean."),
      );
    }
    const owns = await ownsLinkedinAnalysis(userId, id);
    if (owns === null) {
      // TODO(Ana): mensagem de falha ao salvar o progresso.
      return next(
        createError(500, "save_failed", "Não foi possível salvar o progresso."),
      );
    }
    if (!owns) {
      return next(createError(404, "not_found", "Análise não encontrada."));
    }
    const { error } = await supabaseAdmin
      .from("linkedin_improvement_progress")
      .upsert(
        {
          user_id: userId,
          analysis_id: id,
          improvement_index: index,
          done: body.done,
        },
        { onConflict: "user_id,analysis_id,improvement_index" },
      );
    if (error) {
      return next(
        createError(500, "save_failed", "Não foi possível salvar o progresso."),
      );
    }
    res.json({ ok: true });
  },
);

export default router;
