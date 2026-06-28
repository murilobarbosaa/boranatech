import crypto from "crypto";
import { NextFunction, Request, Response, Router } from "express";

import {
  AgentStreamEmitter,
  AgentUpstreamError,
  runAgentLoop,
} from "../lib/agent/loop";
import {
  FREE_SYSTEM_PROMPT,
  PRO_SYSTEM_PROMPT,
} from "../lib/agent/systemPrompts";
import { getToolsForTier } from "../lib/agent/toolRegistry";
import type { AgentContext } from "../lib/agent/types";
import { estimateCost } from "../lib/aiTools";
import { AGENT_CHAT_TOOL, checkAgentDailyLimit, logAiUsage } from "../lib/aiUsage";
import { env } from "../lib/env";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

// Teto de tamanho do historico enviado pelo cliente. Ajustavel. // TODO: calibrar.
const MAX_INPUT_CHARS = 12_000;

router.post("/chat/stream", async (req: Request, res: Response, next: NextFunction) => {
  const requestId = crypto.randomUUID();
  const userId = req.user!.id;
  // CRITICO: o tier vem SO do check server-side (checkProStatus expoe req.isPro),
  // jamais do corpo da requisicao. Fail-closed: qualquer coisa diferente de true
  // (incluindo indeterminado) e tratada como FREE, nunca como Pro.
  const isPro = req.isPro === true;

  const usage = await checkAgentDailyLimit(userId, isPro);
  if (!usage.allowed) {
    if (usage.verificationFailed) {
      await logAiUsage({ userId, tool: AGENT_CHAT_TOOL, requestId, status: "error", errorMessage: "rate limit check failed" });
      // TODO(Ana): mensagem de falha de verificacao de limite.
      return next(
        createError(
          503,
          "rate_check_failed",
          "Nao foi possivel verificar seu limite de uso agora. Tente novamente em instantes.",
        ),
      );
    }
    await logAiUsage({ userId, tool: AGENT_CHAT_TOOL, requestId, status: "rate_limited" });
    // TODO(Ana): mensagem de limite diario atingido.
    return next(
      createError(
        429,
        "rate_limited",
        "Limite diario de mensagens do assistente atingido. Tente novamente amanha.",
      ),
    );
  }

  const bodyUnknown = req.body as Record<string, unknown>;
  const rawMessages = bodyUnknown.messages;
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    // TODO(Ana): mensagem de requisicao invalida.
    return next(createError(400, "invalid_request", "Envie pelo menos uma mensagem valida."));
  }

  const cleaned: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const item of rawMessages) {
    if (!item || typeof item !== "object") continue;
    const rec = item as { role?: unknown; content?: unknown };
    const role = rec.role === "assistant" ? "assistant" : rec.role === "user" ? "user" : null;
    if (!role || typeof rec.content !== "string") continue;
    if (!rec.content.trim()) continue;
    cleaned.push({ role, content: rec.content });
  }
  if (cleaned.length === 0) {
    // TODO(Ana): mensagem de requisicao invalida.
    return next(createError(400, "invalid_request", "Envie pelo menos uma mensagem valida."));
  }

  const inputChars = cleaned.reduce((sum, m) => sum + m.content.length, 0);
  if (inputChars > MAX_INPUT_CHARS) {
    // TODO(Ana): mensagem de conversa longa demais.
    return next(
      createError(
        413,
        "payload_too_large",
        `Conversa muito longa. Maximo: ${MAX_INPUT_CHARS} caracteres.`,
      ),
    );
  }

  const currentRoute =
    typeof bodyUnknown.currentRoute === "string" ? bodyUnknown.currentRoute : undefined;

  if (!env.openaiApiKey) {
    // TODO(Ana): mensagem de servico nao configurado.
    return next(createError(503, "upstream_error", "Servico de IA nao configurado."));
  }

  // Toolset e system prompt derivam SO do tier verificado. Nesta fase ambos os
  // tiers recebem a toolset free (ainda nao ha tools Pro), mas o gating ja esta
  // correto para a Fase 2 so adicionar tools. O PRO_SYSTEM_PROMPT e um stub
  // vazio; enquanto vazio, ate o Pro usa o FREE_SYSTEM_PROMPT.
  const tools = getToolsForTier(isPro);
  const systemPrompt = isPro && PRO_SYSTEM_PROMPT.length > 0 ? PRO_SYSTEM_PROMPT : FREE_SYSTEM_PROMPT;
  const ctx: AgentContext = { userId, isPro, currentRoute };

  // SSE espelhando os headers e o flush do ai.ts.
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const emit: AgentStreamEmitter = {
    token: (value) => {
      res.write(`data: ${JSON.stringify({ type: "token", value })}\n\n`);
    },
    status: (status) => {
      res.write(`data: ${JSON.stringify({ type: "status", ...status })}\n\n`);
    },
    error: (message) => {
      res.write(`data: ${JSON.stringify({ type: "error", message })}\n\n`);
    },
  };

  try {
    const result = await runAgentLoop({
      messages: cleaned,
      tools,
      systemPrompt,
      ctx,
      apiKey: env.openaiApiKey,
      emit,
    });
    res.write("data: [DONE]\n\n");
    res.end();
    await logAiUsage({
      userId,
      tool: AGENT_CHAT_TOOL,
      requestId,
      status: "success",
      inputChars,
      outputChars: result.outputChars,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costEstimate: estimateCost(inputChars, result.outputChars),
    });
  } catch (err) {
    const detail = err instanceof AgentUpstreamError ? err.detail : "loop_error";
    if (!(err instanceof AgentUpstreamError)) {
      console.error("[agent] loop error:", err);
    }
    // TODO(Ana): mensagem de erro de processamento.
    emit.error("Erro ao processar com IA. Tente novamente.");
    res.write("data: [DONE]\n\n");
    res.end();
    await logAiUsage({
      userId,
      tool: AGENT_CHAT_TOOL,
      requestId,
      status: "error",
      errorMessage: detail,
      inputChars,
    });
  }
});

export default router;
