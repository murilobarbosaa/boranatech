import crypto from "crypto";
import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";

import { resolveAreaSelection } from "../../shared/areas";
import { checkAiDailyLimit, logAiUsage } from "../lib/aiUsage";
import { analyzeGithub } from "../lib/githubAnalyze";
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
  const requestId = crypto.randomUUID();
  const tool = `github-${mode}`;

  const usage = await checkAiDailyLimit(userId, !!req.isPro, "[github]");
  if (!usage.allowed) {
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
  try {
    const data = await analyzeGithub(mode, parsed, area, (io) => {
      aiUsed = true;
      aiIo = io;
    });
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
    res.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    await logAiUsage({ userId, tool, requestId, status: "error", errorMessage: message });

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
  }
});

export default router;
