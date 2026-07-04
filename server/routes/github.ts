import crypto from "crypto";
import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";

import { resolveAreaSelection } from "../../shared/areas";
import type { GithubAnalysisResponse } from "../../shared/github/schema";
import { checkAiDailyLimit, logAiUsage } from "../lib/aiUsage";
import { analyzeGithub } from "../lib/githubAnalyze";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import {
  GithubFetchError,
  GithubNotFoundError,
  GithubRateLimitError,
  parseProfileInput,
  parseRepoInput,
} from "../lib/github";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

const BodySchema = z.object({
  mode: z.enum(["perfil", "repo"]),
  input: z.string().min(1),
  area: z.string().optional(),
});

// Budget global de tempo da rota. O modo perfil soma 15-20 chamadas GitHub
// (teto de 10s CADA) + OpenAI de 60s; sem teto global o pior caso passa de 3
// minutos com a conexao aberta. O signal e propagado por analyzeGithub ate
// cada fetch; os tetos unitarios (10s GitHub, 60s OpenAI) permanecem.
const ANALYZE_BUDGET_MS = 75_000;

// Persistencia best-effort em github_analyses, espelhando o padrao do
// linkedin.ts: falha de escrita vira console.warn e NUNCA quebra a resposta.
// user_id vem SO do JWT verificado (a rota tem requireAuth no topo). level fica
// nulo: a analise de GitHub nao produz nivel, so nota (score) e faixa (band).
async function persistGithubAnalysis(
  userId: string,
  rawInput: string,
  response: GithubAnalysisResponse,
) {
  try {
    const { error } = await supabaseAdmin.from("github_analyses").insert({
      user_id: userId,
      area: response.area,
      level: null,
      score: response.deterministic.score,
      faixa: response.deterministic.band,
      input: { mode: response.mode, input: rawInput, area: response.area },
      result: response,
    });
    if (error) {
      console.warn(
        "[github] Falha ao persistir analise (fail-soft):",
        error.message,
      );
    }
  } catch (err) {
    console.warn("[github] Erro inesperado ao persistir analise (fail-soft):", err);
  }
}

router.post("/analyze", async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isPro) {
    return next(
      createError(403, "forbidden", "Recurso Pro. Assine o Plano Pro para usar o analisador de GitHub."),
    );
  }

  const parsedBody = BodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return next(createError(400, "invalid_request", "Envie mode ('perfil' ou 'repo') e input."));
  }

  const { mode, input } = parsedBody.data;
  // Area opcional: slug desconhecido ou ausente vira "geral". So afeta a prosa da IA.
  const area = resolveAreaSelection(parsedBody.data.area);

  let parsed: { owner: string; repo: string } | { login: string } | null;
  if (mode === "repo") {
    parsed = parseRepoInput(input);
    if (!parsed) {
      return next(
        createError(400, "invalid_request", "Informe a URL do repositorio, ex github.com/usuario/projeto."),
      );
    }
  } else {
    parsed = parseProfileInput(input);
    if (!parsed) {
      return next(createError(400, "invalid_request", "Informe seu usuario do GitHub."));
    }
  }

  const userId = req.user!.id;
  const requestId =
    (res.locals.requestId as string | undefined) ?? crypto.randomUUID();
  const tool = `github-${mode}`;

  const usage = await checkAiDailyLimit(userId, !!req.isPro, "[github]");
  if (!usage.allowed) {
    if (usage.verificationFailed) {
      await logAiUsage({ userId, tool, requestId, status: "error", errorMessage: "rate limit check failed" });
      return next(
        createError(
          503,
          "rate_check_failed",
          "Não foi possível verificar seu limite de uso agora. Tente novamente em instantes.",
        ),
      );
    }
    await logAiUsage({ userId, tool, requestId, status: "rate_limited" });
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
  const budgetTimer = setTimeout(() => budget.abort(), ANALYZE_BUDGET_MS);
  budgetTimer.unref();
  try {
    const data = await analyzeGithub(
      mode,
      parsed,
      area,
      (io) => {
        aiUsed = true;
        aiIo = io;
      },
      budget.signal,
    );
    const outputChars = JSON.stringify(data).length;
    // So conta no limite diario quando a IA rodou de fato. O caminho
    // deterministico (perfil/repo essencialmente vazio) loga como "skipped",
    // que get_ai_usage_today nao conta, pra nao gastar a cota a toa.
    await logAiUsage({
      userId,
      tool,
      requestId,
      status: aiUsed ? "success" : "skipped",
      inputChars: aiIo.inputChars,
      outputChars,
    });
    await persistGithubAnalysis(userId, input, data);
    res.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    await logAiUsage({ userId, tool, requestId, status: "error", errorMessage: message });

    // Budget global estourado: qualquer erro daqui em diante e consequencia do
    // abort. Nunca devolve resultado parcial como analise: ou terminou inteira
    // (caminho do try), ou 504 claro.
    if (budget.signal.aborted) {
      console.error("[github] Analise estourou o budget global de tempo", {
        requestId,
        mode,
      });
      return next(
        createError(
          504,
          "analysis_timeout",
          "A analise demorou mais que o esperado e foi interrompida. Tente novamente em instantes.",
        ),
      );
    }

    if (err instanceof GithubNotFoundError) {
      return next(
        createError(
          404,
          "not_found",
          "Repositorio ou perfil nao encontrado, ou e privado. Deixe publico e tente de novo.",
        ),
      );
    }
    if (err instanceof GithubRateLimitError) {
      return next(
        createError(503, "github_rate_limited", "Limite do GitHub atingido. Tente de novo em instantes."),
      );
    }
    // GithubFetchError, falha de parse/zod da IA, ou qualquer outro caso.
    if (err instanceof GithubFetchError) {
      return next(createError(502, "upstream_error", "Falha ao consultar o GitHub. Tente de novo."));
    }
    return next(
      createError(502, "upstream_error", "Nao foi possivel concluir a analise agora. Tente de novo."),
    );
  } finally {
    clearTimeout(budgetTimer);
  }
});

export default router;
