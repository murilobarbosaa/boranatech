import crypto from "crypto";
import { NextFunction, Request, Response, Router } from "express";

import { LinkedinAnalyzeRequestSchema } from "../../shared/linkedin/schema";
import { checkAiDailyLimit, logAiUsage } from "../lib/aiUsage";
import { analyzeLinkedin, LinkedinUnreadableError } from "../lib/linkedinAnalyze";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

const TOOL = "linkedin-analyzer";

router.post("/analyze", async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isPro) {
    return next(
      createError(403, "forbidden", "Recurso Pro. Assine o Plano Pro para usar o analisador de LinkedIn."),
    );
  }

  const parsedBody = LinkedinAnalyzeRequestSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return next(
      createError(400, "invalid_request", "Dados inválidos. Confira o texto do perfil e os campos do formulário."),
    );
  }

  const request = parsedBody.data;
  const userId = req.user!.id;
  const requestId = crypto.randomUUID();

  const usage = await checkAiDailyLimit(userId, !!req.isPro, "[linkedin]");
  if (!usage.allowed) {
    await logAiUsage({ userId, tool: TOOL, requestId, status: "rate_limited" });
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
    const { response } = await analyzeLinkedin(request, (io) => {
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
    res.json({ data: response });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    await logAiUsage({ userId, tool: TOOL, requestId, status: "error", errorMessage: message });

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
      createError(502, "upstream_error", "Não foi possível concluir a análise agora. Tente de novo."),
    );
  }
});

export default router;
