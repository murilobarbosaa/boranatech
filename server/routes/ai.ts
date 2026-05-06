import crypto from "crypto";
import { NextFunction, Request, Response, Router } from "express";

import { env } from "../lib/env";
import { estimateCost, getToolConfig } from "../lib/aiTools";
import { buildOpenAIHeaders, DEFAULT_MODEL, OPENAI_BASE_URL } from "../lib/openai";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

router.post("/:tool", async (req: Request, res: Response, next: NextFunction) => {
  const toolKey = req.params.tool;
  const requestId = crypto.randomUUID();
  const userId = req.user!.id;
  const toolConfig = getToolConfig(toolKey);

  if (!toolConfig) {
    await logUsage({ userId, tool: toolKey, requestId, status: "error", errorMessage: "Tool not found" });
    return next(createError(404, "not_found", `Ferramenta '${toolKey}' não encontrada.`));
  }

  if (toolConfig.requiresPro && !req.isPro) {
    await logUsage({ userId, tool: toolKey, requestId, status: "unauthorized", errorMessage: "Pro required", model: toolConfig.model });
    return next(createError(403, "forbidden", "Plano Pro necessário para usar esta ferramenta."));
  }

  try {
    const { data: usageCount, error: usageError } = await supabaseAdmin.rpc("get_ai_usage_today", { p_user_id: userId });

    if (!usageError && usageCount !== null) {
      const limit = req.isPro ? env.aiDailyLimitPro : env.aiDailyLimitFree;
      if (usageCount >= limit) {
        await logUsage({ userId, tool: toolKey, requestId, status: "rate_limited", model: toolConfig.model });
        return next(
          createError(
            429,
            "rate_limited",
            `Limite diário de ${limit} chamadas de IA atingido. ${req.isPro ? "Tente novamente amanhã." : "Faça upgrade para o Plano Pro para mais acesso."}`,
          ),
        );
      }
    }
  } catch {
    console.warn("[ai] Falha ao verificar rate limit para", userId);
  }

  const bodyUnknown = req.body as Record<string, unknown>;
  const rawMessages = bodyUnknown.messages;
  let openaiMessages: Array<{ role: string; content: string }>;
  let inputText = "";

  if (Array.isArray(rawMessages) && rawMessages.length > 0) {
    const cleaned: Array<{ role: "user" | "assistant"; content: string }> = [];
    for (const item of rawMessages) {
      if (!item || typeof item !== "object") continue;
      const rec = item as { role?: unknown; content?: unknown };
      const role = rec.role === "assistant" ? "assistant" : rec.role === "user" ? "user" : null;
      if (!role || typeof rec.content !== "string") continue;
      const text = rec.content;
      if (!text.trim()) continue;
      cleaned.push({ role, content: text });
    }

    if (cleaned.length === 0) {
      await logUsage({ userId, tool: toolKey, requestId, status: "error", errorMessage: "Invalid messages", model: toolConfig.model });
      return next(createError(400, "invalid_request", "Envie pelo menos uma mensagem válida."));
    }

    inputText = cleaned.map((message) => message.content).join(" ");
    openaiMessages = [{ role: "system", content: toolConfig.systemPrompt }, ...cleaned];
  } else {
    const payloadText = JSON.stringify(req.body, null, 2);
    inputText = payloadText;
    openaiMessages = [
      { role: "system", content: toolConfig.systemPrompt },
      {
        role: "user",
        content: `Responda em português do Brasil, com formato prático e escaneável. Dados enviados:\n${payloadText}`,
      },
    ];
  }

  const inputChars = inputText.length;

  if (inputChars > toolConfig.maxInputChars) {
    await logUsage({ userId, tool: toolKey, requestId, status: "error", errorMessage: "Payload too large", inputChars, model: toolConfig.model });
    return next(createError(413, "payload_too_large", `Input muito grande. Máximo: ${toolConfig.maxInputChars} caracteres.`));
  }

  if (!env.openaiApiKey) {
    await logUsage({ userId, tool: toolKey, requestId, status: "error", errorMessage: "OpenAI key missing", inputChars, model: toolConfig.model });
    return next(createError(503, "upstream_error", "Serviço de IA não configurado."));
  }

  try {
    const response = await fetch(OPENAI_BASE_URL, {
      method: "POST",
      headers: buildOpenAIHeaders(env.openaiApiKey),
      body: JSON.stringify({
        model: toolConfig.model || DEFAULT_MODEL,
        temperature: toolConfig.temperature,
        messages: openaiMessages,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[ai] OpenAI error:", response.status, text);
      await logUsage({ userId, tool: toolKey, requestId, status: "error", errorMessage: `OpenAI ${response.status}`, inputChars, model: toolConfig.model });
      return next(createError(502, "upstream_error", "Erro ao processar com IA. Tente novamente."));
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const result = data.choices?.[0]?.message?.content || "A IA não retornou conteúdo.";
    const outputChars = result.length;

    await logUsage({
      userId,
      tool: toolKey,
      requestId,
      status: "success",
      inputChars,
      outputChars,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      model: toolConfig.model,
      costEstimate: estimateCost(inputChars, outputChars),
    });

    res.json({ result });
  } catch (error) {
    console.error("[ai] Fetch error:", error);
    await logUsage({ userId, tool: toolKey, requestId, status: "error", errorMessage: "Network error", inputChars, model: toolConfig.model });
    return next(createError(502, "upstream_error", "Erro de conexão com o serviço de IA."));
  }
});

async function logUsage(params: {
  userId: string;
  tool: string;
  requestId: string;
  status: string;
  errorMessage?: string;
  inputChars?: number;
  outputChars?: number;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
  costEstimate?: number;
}) {
  try {
    await supabaseAdmin.from("ai_usage_logs").insert({
      user_id: params.userId,
      tool: params.tool,
      request_id: params.requestId,
      status: params.status,
      error_message: params.errorMessage || null,
      input_chars: params.inputChars || 0,
      output_chars: params.outputChars || 0,
      input_tokens: params.inputTokens || 0,
      output_tokens: params.outputTokens || 0,
      model: params.model || DEFAULT_MODEL,
      cost_estimate: params.costEstimate || 0,
    });
  } catch (err) {
    console.warn("[ai] Falha ao registrar uso:", err);
  }
}

export default router;
