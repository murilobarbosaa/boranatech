import { apiUrl } from "./api";
import { supabase } from "./supabase";

// Cliente SSE do agente conversacional. Separado do aiClient de proposito: o
// agente tem protocolo de frame proprio (token/status/error), diferente do
// passthrough de chunks da OpenAI que o aiClient faz.

export type AgentChatMessage = { role: "user" | "assistant"; content: string };

export interface AgentStatusEvent {
  event: string;
  tool?: string;
}

export interface AgentStreamHandlers {
  onToken: (delta: string) => void;
  onStatus?: (status: AgentStatusEvent) => void;
  onError?: (message: string) => void;
  // Chamado quando o backend informa em qual conversa do historico (Pro) a
  // mensagem esta sendo salva. So dispara para usuario Pro com persistencia.
  onConversationId?: (conversationId: string) => void;
}

// Espelha exatamente o aiClient: o JWT vem da sessao do Supabase.
async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

interface AgentFrame {
  type?: unknown;
  value?: unknown;
  event?: unknown;
  tool?: unknown;
  message?: unknown;
  conversationId?: unknown;
}

function readErrorMessage(body: unknown): string | undefined {
  if (body && typeof body === "object") {
    const rec = body as { error?: { message?: unknown } };
    const msg = rec.error?.message;
    if (typeof msg === "string") return msg;
  }
  return undefined;
}

/**
 * POST /api/agent/chat/stream em modo SSE. Le os frames estruturados do backend
 * (data: {"type":"token"|"status"|"error",...} e data: [DONE]) e despacha para
 * os handlers. Traduz status HTTP em sentinelas de erro, como o aiClient.
 */
export async function streamAgentChat(
  messages: AgentChatMessage[],
  currentRoute: string | undefined,
  handlers: AgentStreamHandlers,
  conversationId?: string,
): Promise<void> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl("/api/agent/chat/stream"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...authHeader,
    },
    // conversationId opcional: ausente no primeiro envio (o backend cria a
    // conversa, se Pro) e presente nos seguintes. undefined some no JSON.
    body: JSON.stringify({ messages, currentRoute, conversationId }),
  });

  if (response.status === 401) throw new Error("LOGIN_REQUIRED");
  if (response.status === 413) throw new Error("CONVERSATION_TOO_LONG");
  if (response.status === 429) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`RATE_LIMITED: ${readErrorMessage(body) || "Limite atingido"}`);
  }
  if (response.status === 503) throw new Error("AGENT_UNAVAILABLE");
  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => ({}));
    throw new Error(readErrorMessage(body) || "Erro ao processar com IA");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const events = pending.split("\n\n");
    pending = events.pop() ?? "";
    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") return;

        let frame: AgentFrame | null = null;
        try {
          frame = JSON.parse(payload) as AgentFrame;
        } catch {
          // Linha nao-JSON (keep-alive ou parcial). Ignora.
          continue;
        }

        if (!frame || typeof frame.type !== "string") continue;

        if (frame.type === "token") {
          if (typeof frame.value === "string" && frame.value.length > 0) {
            handlers.onToken(frame.value);
          }
        } else if (frame.type === "status") {
          const event = typeof frame.event === "string" ? frame.event : "";
          if (event === "conversation" && typeof frame.conversationId === "string") {
            handlers.onConversationId?.(frame.conversationId);
          } else {
            handlers.onStatus?.({
              event,
              tool: typeof frame.tool === "string" ? frame.tool : undefined,
            });
          }
        } else if (frame.type === "error") {
          handlers.onError?.(
            typeof frame.message === "string"
              ? frame.message
              : "Erro ao processar com IA",
          );
        }
      }
    }
  }
}
