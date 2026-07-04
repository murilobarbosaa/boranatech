import crypto from "crypto";
import { NextFunction, Request, Response, Router } from "express";

import {
  appendMessage,
  createConversation,
} from "../lib/agent/conversationStore";
import {
  AgentStreamEmitter,
  AgentUpstreamError,
  runAgentLoop,
} from "../lib/agent/loop";
import { buildPlatformFacts } from "../lib/agent/platformFacts";
import {
  FREE_SYSTEM_PROMPT,
  PRO_SYSTEM_PROMPT,
} from "../lib/agent/systemPrompts";
import { getToolsForTier } from "../lib/agent/toolRegistry";
import type { AgentContext } from "../lib/agent/types";
import { buildUserSnapshot } from "../lib/agent/userSnapshot";
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
// Tamanho maximo do titulo (primeira mensagem do usuario truncada). // TODO: calibrar.
const TITLE_MAX_CHARS = 80;
// Formato uuid; conversationId malformado no corpo e tratado como ausente.
const CONVERSATION_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.post("/chat/stream", async (req: Request, res: Response, next: NextFunction) => {
  const requestId =
    (res.locals.requestId as string | undefined) ?? crypto.randomUUID();
  const userId = req.user!.id;
  // CRITICO: o tier vem SO do check server-side (checkProStatus expoe req.isPro),
  // jamais do corpo da requisicao. Fail-closed: qualquer coisa diferente de true
  // (incluindo indeterminado) e tratada como FREE, nunca como Pro.
  const isPro = req.isPro === true;
  // DIAG: ligado so com AGENT_DIAG=1 (desligado em producao). Sem PII: nunca
  // logar o userId inteiro nem conteudo de snapshot.
  if (process.env.AGENT_DIAG === "1") {
    console.log("[agent/diag] isPro:", isPro, "hasUserId:", Boolean(userId));
  }

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

  // Toolset e system prompt derivam SO do tier verificado (req.isPro), nunca do
  // corpo. Pro recebe a toolset free + pro e o PRO_SYSTEM_PROMPT; free recebe so
  // a toolset free e o FREE_SYSTEM_PROMPT (PRO_SYSTEM_PROMPT vazio cai no FREE).
  const tools = getToolsForTier(isPro);
  const systemPrompt = isPro && PRO_SYSTEM_PROMPT.length > 0 ? PRO_SYSTEM_PROMPT : FREE_SYSTEM_PROMPT;
  const ctx: AgentContext = { userId, isPro, currentRoute };

  // Fatos canonicos da plataforma: publicos e iguais para OS DOIS tiers.
  // Best-effort igual ao snapshot: buildPlatformFacts ja degrada por dentro
  // (cache e fallback estatico), mas uma falha aqui jamais derruba o chat;
  // nesse caso seguimos sem o bloco de fatos.
  let platformFacts: string | undefined;
  try {
    platformFacts = await buildPlatformFacts();
  } catch (err) {
    console.warn("[agent] buildPlatformFacts falhou, seguindo sem fatos:", err);
  }

  // Snapshot do usuario: resolvido SO para Pro verificado. Free NUNCA recebe
  // snapshot. buildUserSnapshot recebe so o userId (do JWT verificado), nunca
  // nada do corpo. Cinto e suspensorio: buildUserSnapshot ja degrada por dentro,
  // mas envolvemos em try/catch para que uma falha nele jamais derrube a resposta
  // do agente; nesse caso seguimos sem snapshot.
  let userSnapshot: string | undefined;
  if (isPro) {
    try {
      userSnapshot = await buildUserSnapshot(userId);
    } catch (err) {
      console.warn("[agent] buildUserSnapshot falhou, seguindo sem snapshot:", err);
    }
    // DIAG: ligado so com AGENT_DIAG=1. Loga tamanho, nunca o conteudo.
    if (process.env.AGENT_DIAG === "1") {
      console.log(
        "[agent/diag] snapshot resolvido?",
        userSnapshot !== undefined,
        "chars:",
        userSnapshot?.length ?? 0,
      );
    }
  }

  // Persistencia do historico: SO para Pro. Free nunca cria conversa nem salva
  // mensagem (comportamento identico ao de hoje). A identidade vem de userId
  // (JWT); o conversationId do corpo e NAO confiavel: validado por FORMATO aqui
  // e por POSSE dentro do store (user_id E id). Best-effort: qualquer falha do
  // store vira warn e o chat segue normal, nunca interrompe a resposta.
  const rawConversationId =
    typeof bodyUnknown.conversationId === "string" ? bodyUnknown.conversationId : "";
  const providedConversationId = CONVERSATION_ID_RE.test(rawConversationId)
    ? rawConversationId
    : null;

  let activeConversationId: string | null = null;
  if (isPro) {
    // Persistencia best-effort de VERDADE. Alem de tratar ok:false, este try/catch
    // e a ultima barreira contra EXCECAO: o store nunca lanca por contrato, mas se
    // algo aqui lancar (rede, tabela inexistente ate a migration ser aplicada), a
    // falha vira so um warn e activeConversationId fica null. Nenhuma excecao pode
    // escapar para antes do flushHeaders e derrubar o chat do Pro.
    try {
      if (providedConversationId) {
        activeConversationId = providedConversationId;
      } else {
        // Conversa criada no PRIMEIRO envio. Titulo = primeira mensagem do usuario
        // truncada (sem geracao por IA neste marco). category fica NULA.
        const firstUser = cleaned.find((m) => m.role === "user");
        const title = firstUser ? firstUser.content.slice(0, TITLE_MAX_CHARS) : null;
        const created = await createConversation(userId, title);
        if (created.ok) {
          activeConversationId = created.data.id;
        } else {
          console.warn("[agent] createConversation falhou, seguindo sem persistir:", created.error);
        }
      }

      if (activeConversationId) {
        // Persiste a ULTIMA mensagem do usuario (a que originou esta chamada) ANTES
        // do stream, para ficar salva mesmo se o stream falhar no meio.
        const lastUser = [...cleaned].reverse().find((m) => m.role === "user");
        if (lastUser) {
          const appended = await appendMessage(userId, activeConversationId, "user", lastUser.content);
          if (!appended.ok) {
            console.warn("[agent] appendMessage(user) falhou:", appended.error);
            // not_owner: o conversationId recebido nao e do usuario. Nao salva nada
            // nessa conversa e nao comunica esse id ao cliente.
            if (appended.error === "not_owner") {
              activeConversationId = null;
            }
          }
        }
      }
    } catch (err) {
      // Estado seguro: sem conversa ativa, o chat segue sem persistir.
      console.warn("[agent] persistencia pre-stream falhou, seguindo sem salvar:", err);
      activeConversationId = null;
    }
  }

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

  // Comunica ao cliente em qual conversa esta sendo salvo (so Pro e quando ha
  // conversa ativa). O cliente (rodada B) guarda esse id para os proximos envios.
  if (activeConversationId) {
    emit.status({ event: "conversation", conversationId: activeConversationId });
  }

  try {
    const result = await runAgentLoop({
      messages: cleaned,
      tools,
      systemPrompt,
      ctx,
      apiKey: env.openaiApiKey,
      emit,
      userSnapshot,
      platformFacts,
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
    // Persiste a resposta do assistente apos o stream (so Pro, conversa ativa e
    // texto nao vazio). Best-effort: falha aqui vira warn, nao afeta o cliente
    // (o stream ja foi entregue).
    if (isPro && activeConversationId && result.assistantText.trim().length > 0) {
      const saved = await appendMessage(
        userId,
        activeConversationId,
        "assistant",
        result.assistantText,
      );
      if (!saved.ok) {
        console.warn("[agent] appendMessage(assistant) falhou:", saved.error);
      }
    }
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
