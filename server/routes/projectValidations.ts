import crypto from "crypto";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { resolveAreaSelection } from "../../shared/areas";
import { detectGithubTarget } from "../../shared/github/detect";
import type {
  GithubQualitativeWithRequirements,
  ProjectValidationContext,
} from "../../shared/github/schema";
import { projetos } from "../../shared/projects/catalog";
import { checkAiDailyLimit, logAiUsage } from "../lib/aiUsage";
import { analyzeGithub } from "../lib/githubAnalyze";
import { computeValidationOutcome } from "../lib/projectValidation";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";
import { persistGithubAnalysis } from "./github";

// Validacao de projeto Pro via leitor de GitHub (fase 5c.1). A camada
// VALIDADA e separada da autodeclarada por design: aprovacao NAO escreve
// project_progress nem course_progress; a UI da 5c.2 junta as duas.
const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

// Mesmo racional do ANALYZE_BUDGET_MS do github.ts: teto global da rota, com
// o signal propagado ate cada fetch do GitHub e a chamada da OpenAI.
const VALIDATE_BUDGET_MS = 75_000;

const TOOL = "project-validation";

router.post(
  "/:projectId/submit",
  async (req: Request, res: Response, next: NextFunction) => {
    // Gates em ordem, fail-closed.
    if (req.isPro !== true) {
      return next(
        createError(
          403,
          "forbidden",
          "Recurso Pro. Assine o Plano Pro para validar projetos premium.",
        ),
      );
    }

    const { projectId } = req.params;
    const project = projetos.find((p) => p.id === projectId);
    if (!project) {
      return next(createError(404, "not_found", "Projeto não encontrado."));
    }
    if (
      project.pro !== true ||
      !project.requisitos ||
      project.requisitos.length === 0
    ) {
      return next(
        createError(
          400,
          "validation_unavailable",
          "Este projeto não tem validação disponível.",
        ),
      );
    }

    const userId = req.user!.id;

    const { data: approved, error: approvedError } = await supabaseAdmin
      .from("project_validations")
      .select("id")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .eq("status", "aprovado")
      .maybeSingle();
    if (approvedError) {
      return next(
        createError(500, "db_error", "Erro ao verificar validações."),
      );
    }
    if (approved) {
      return next(
        createError(
          409,
          "already_validated",
          "Este projeto já foi validado e aprovado.",
        ),
      );
    }

    const { url } = req.body as { url?: string };
    const target = detectGithubTarget(String(url ?? ""));
    if (target.kind !== "repo") {
      return next(
        createError(
          400,
          "invalid_request",
          "Envie a URL de um repositório público do GitHub (perfil não vale aqui).",
        ),
      );
    }

    const requestId =
      (res.locals.requestId as string | undefined) ?? crypto.randomUUID();

    const usage = await checkAiDailyLimit(userId, true, "[project-validation]");
    if (!usage.allowed) {
      if (usage.verificationFailed) {
        await logAiUsage({
          userId,
          tool: TOOL,
          requestId,
          status: "error",
          errorMessage: "rate limit check failed",
        });
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
    const budget = new AbortController();
    const budgetTimer = setTimeout(() => budget.abort(), VALIDATE_BUDGET_MS);
    budgetTimer.unref();
    try {
      const context: ProjectValidationContext = {
        projectId: project.id,
        nome: project.nome,
        objetivo: project.objetivo,
        requisitos: project.requisitos,
      };
      const response = await analyzeGithub(
        "repo",
        { owner: target.owner, repo: target.repo },
        resolveAreaSelection(project.areaSlug ?? undefined),
        (io) => {
          aiUsed = true;
          aiIo = io;
        },
        budget.signal,
        context,
      );

      await logAiUsage({
        userId,
        tool: TOOL,
        requestId,
        status: aiUsed ? "success" : "skipped",
        inputChars: aiIo.inputChars,
        outputChars: JSON.stringify(response).length,
      });

      const avaliacao =
        (response.qualitative as GithubQualitativeWithRequirements)
          .requisitosAvaliacao ?? [];
      const outcome = computeValidationOutcome(project.requisitos, avaliacao);

      // A analise persiste no historico normal, com marcador de origem no
      // input jsonb. Aqui ela NAO e best-effort: a validacao referencia a
      // linha (analysis_id not null), entao sem analise persistida nao ha
      // registro de validacao.
      const analysisId = await persistGithubAnalysis(
        userId,
        String(url),
        response,
        { projectValidation: project.id },
      );
      if (!analysisId) {
        return next(
          createError(500, "save_failed", "Erro ao salvar a análise."),
        );
      }

      const { error: insertError } = await supabaseAdmin
        .from("project_validations")
        .insert({
          user_id: userId,
          project_id: project.id,
          analysis_id: analysisId,
          status: outcome.status,
          requisitos_result: avaliacao,
        });
      if (insertError) {
        // 23505 no unique parcial: outra submissao aprovou em corrida.
        // Idempotente: o estado final e "aprovado" de qualquer jeito.
        if (insertError.code !== "23505" || outcome.status !== "aprovado") {
          return next(
            createError(500, "save_failed", "Erro ao registrar a validação."),
          );
        }
      }

      res.json({
        status: outcome.status,
        resultado: avaliacao,
        analysisId,
        pendentes: outcome.pendentes,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      await logAiUsage({
        userId,
        tool: TOOL,
        requestId,
        status: "error",
        errorMessage: message,
      });
      if (budget.signal.aborted) {
        return next(
          createError(
            504,
            "analysis_timeout",
            "A validação demorou mais que o esperado e foi interrompida.",
          ),
        );
      }
      next(err);
    } finally {
      clearTimeout(budgetTimer);
    }
  },
);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("project_validations")
      .select("project_id, status, created_at, analysis_id")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false });
    if (error) {
      return next(createError(500, "db_error", "Erro ao listar validações."));
    }
    res.json({
      data: (data ?? []).map((row) => ({
        projectId: row.project_id,
        status: row.status,
        createdAt: row.created_at,
        analysisId: row.analysis_id,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:projectId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
      const { data, error } = await supabaseAdmin
        .from("project_validations")
        .select(
          "project_id, status, created_at, analysis_id, requisitos_result",
        )
        .eq("user_id", req.user!.id)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) {
        return next(createError(500, "db_error", "Erro ao buscar validações."));
      }
      const rows = data ?? [];
      if (rows.length === 0) {
        return next(
          createError(404, "not_found", "Nenhuma validação para este projeto."),
        );
      }
      const toItem = (row: (typeof rows)[number]) => ({
        projectId: row.project_id,
        status: row.status,
        createdAt: row.created_at,
        analysisId: row.analysis_id,
        resultado: row.requisitos_result,
      });
      const aprovada = rows.find((row) => row.status === "aprovado");
      res.json({
        data: {
          ultima: toItem(rows[0]),
          aprovada: aprovada ? toItem(aprovada) : null,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
