import crypto from "crypto";
import { NextFunction, Request, Response, Router } from "express";

import { env } from "../lib/env";
import { estimateCost, getToolConfig } from "../lib/aiTools";
import { buildLoginContextMessage } from "../lib/loginContext";
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

  const systemMessages: Array<{ role: "system"; content: string }> = [
    { role: "system", content: toolConfig.systemPrompt },
  ];

  if (toolConfig.injectLoginContext && req.user) {
    try {
      const loginCtx = await buildLoginContextMessage(req.user);
      systemMessages.push({ role: "system", content: loginCtx });
    } catch (err) {
      console.warn("[ai] Falha ao montar loginContext, seguindo sem ele:", err);
    }
  }

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
    openaiMessages = [...systemMessages, ...cleaned];
  } else {
    const payloadText = JSON.stringify(req.body, null, 2);
    inputText = payloadText;
    openaiMessages = [
      ...systemMessages,
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

  const requestBody: Record<string, unknown> = {
    model: toolConfig.model || DEFAULT_MODEL,
    temperature: toolConfig.temperature,
    messages: openaiMessages,
  };

  if (toolConfig.responseFormat) {
    requestBody.response_format = {
      type: "json_schema",
      json_schema: {
        name: toolConfig.responseFormat.name,
        strict: true,
        schema: toolConfig.responseFormat.jsonSchema,
      },
    };
  }

  try {
    const response = await fetch(OPENAI_BASE_URL, {
      method: "POST",
      headers: buildOpenAIHeaders(env.openaiApiKey),
      body: JSON.stringify(requestBody),
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

    if (toolConfig.responseFormat) {
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(result);
      } catch (parseErr) {
        console.error("[ai] JSON parse falhou pra tool com responseFormat:", toolKey, parseErr, "raw:", result.slice(0, 500));
        await logUsage({
          userId,
          tool: toolKey,
          requestId,
          status: "error",
          errorMessage: "JSON parse failed",
          inputChars,
          outputChars,
          model: toolConfig.model,
        });
        return next(createError(502, "upstream_error", "Resposta da IA não veio em JSON válido."));
      }

      const validation = toolConfig.responseFormat.zodSchema.safeParse(parsedJson);
      if (!validation.success) {
        console.error(
          "[ai] Zod validation falhou pra tool",
          toolKey,
          JSON.stringify(validation.error.issues, null, 2).slice(0, 1500),
        );
        await logUsage({
          userId,
          tool: toolKey,
          requestId,
          status: "error",
          errorMessage: "Zod validation failed",
          inputChars,
          outputChars,
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
          model: toolConfig.model,
          costEstimate: estimateCost(inputChars, outputChars),
        });
        return next(createError(502, "upstream_error", "Resposta da IA não bateu com o schema esperado."));
      }

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

      res.json({ data: validation.data });
      return;
    }

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

/**
 * Variante streaming. Mesmo contrato de body ({ messages }), mas devolve
 * text/event-stream com os chunks da OpenAI repassados. Suportado SÓ pra
 * tools mode "chat" sem responseFormat (structured output não streama).
 */
router.post("/:tool/stream", async (req: Request, res: Response, next: NextFunction) => {
  const toolKey = req.params.tool;
  const requestId = crypto.randomUUID();
  const userId = req.user!.id;
  const toolConfig = getToolConfig(toolKey);

  if (!toolConfig) {
    await logUsage({ userId, tool: toolKey, requestId, status: "error", errorMessage: "Tool not found" });
    return next(createError(404, "not_found", `Ferramenta '${toolKey}' não encontrada.`));
  }

  if (toolConfig.responseFormat) {
    return next(createError(400, "stream_not_supported", "Esta ferramenta usa saída estruturada e não suporta streaming."));
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
    console.warn("[ai/stream] Falha ao verificar rate limit para", userId);
  }

  const bodyUnknown = req.body as Record<string, unknown>;
  const rawMessages = bodyUnknown.messages;
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return next(createError(400, "invalid_request", "Envie pelo menos uma mensagem válida."));
  }
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
    return next(createError(400, "invalid_request", "Envie pelo menos uma mensagem válida."));
  }

  const inputText = cleaned.map((m) => m.content).join(" ");
  const inputChars = inputText.length;
  if (inputChars > toolConfig.maxInputChars) {
    return next(createError(413, "payload_too_large", `Input muito grande. Máximo: ${toolConfig.maxInputChars} caracteres.`));
  }

  if (!env.openaiApiKey) {
    return next(createError(503, "upstream_error", "Serviço de IA não configurado."));
  }

  const systemMessages: Array<{ role: "system"; content: string }> = [
    { role: "system", content: toolConfig.systemPrompt },
  ];

  if (toolConfig.injectLoginContext && req.user) {
    try {
      const loginCtx = await buildLoginContextMessage(req.user);
      systemMessages.push({ role: "system", content: loginCtx });
    } catch (err) {
      console.warn("[ai/stream] Falha ao montar loginContext, seguindo sem ele:", err);
    }
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  let openaiResponse: globalThis.Response;
  try {
    openaiResponse = await fetch(OPENAI_BASE_URL, {
      method: "POST",
      headers: buildOpenAIHeaders(env.openaiApiKey),
      body: JSON.stringify({
        model: toolConfig.model || DEFAULT_MODEL,
        temperature: toolConfig.temperature,
        messages: [...systemMessages, ...cleaned],
        stream: true,
        stream_options: { include_usage: true },
      }),
    });
  } catch (err) {
    console.error("[ai/stream] OpenAI fetch error:", err);
    await logUsage({ userId, tool: toolKey, requestId, status: "error", errorMessage: "Network error", inputChars, model: toolConfig.model });
    res.write(`data: ${JSON.stringify({ error: "Erro de conexão com o serviço de IA." })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
    return;
  }

  if (!openaiResponse.ok || !openaiResponse.body) {
    const text = await openaiResponse.text().catch(() => "");
    console.error("[ai/stream] OpenAI error:", openaiResponse.status, text);
    await logUsage({ userId, tool: toolKey, requestId, status: "error", errorMessage: `OpenAI ${openaiResponse.status}`, inputChars, model: toolConfig.model });
    res.write(`data: ${JSON.stringify({ error: "Erro ao processar com IA. Tente novamente." })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
    return;
  }

  let outputBuf = "";
  let inputTokens = 0;
  let outputTokens = 0;
  const reader = openaiResponse.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);

      pending += chunk;
      const events = pending.split("\n\n");
      pending = events.pop() ?? "";
      for (const event of events) {
        for (const line of event.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string } }>;
              usage?: { prompt_tokens?: number; completion_tokens?: number };
            };
            const delta = parsed.choices?.[0]?.delta?.content;
            if (typeof delta === "string") outputBuf += delta;
            if (parsed.usage) {
              inputTokens = parsed.usage.prompt_tokens ?? inputTokens;
              outputTokens = parsed.usage.completion_tokens ?? outputTokens;
            }
          } catch {
            // chunk keep-alive ou parcial. ignora.
          }
        }
      }
    }
  } catch (err) {
    console.error("[ai/stream] read loop error:", err);
  } finally {
    res.end();
    await logUsage({
      userId,
      tool: toolKey,
      requestId,
      status: "success",
      inputChars,
      outputChars: outputBuf.length,
      inputTokens,
      outputTokens,
      model: toolConfig.model,
      costEstimate: estimateCost(inputChars, outputBuf.length),
    });
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
