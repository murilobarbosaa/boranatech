import { apiUrl } from "./api";
import { supabase } from "./supabase";

interface AiResponse {
  result: string;
}

interface AiStructuredResponse<T> {
  data: T;
}

export type AiChatMessage = { role: "user" | "assistant"; content: string };

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function parseAiResponse(response: Response): Promise<AiResponse> {
  if (response.status === 401) {
    throw new Error("LOGIN_REQUIRED");
  }

  if (response.status === 403) {
    throw new Error("PRO_REQUIRED");
  }

  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      `RATE_LIMITED: ${data.error?.message || "Limite atingido"}`,
    );
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || "Erro ao processar com IA");
  }

  const data = (await response.json()) as Partial<AiResponse>;

  return {
    result:
      data.result ||
      "OPENAI_API_KEY ainda não configurada no servidor. Configure a variável de ambiente para ativar esta ferramenta.",
  };
}

export async function callAiChat(
  endpoint: string,
  messages: AiChatMessage[],
): Promise<AiResponse> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl(`/api/ai/${endpoint}`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify({ messages }),
  });

  return parseAiResponse(response);
}

interface AiChatStreamHandlers {
  onToken: (delta: string) => void;
  onError?: (message: string) => void;
}

/**
 * Chama uma tool de chat em modo streaming via POST /api/ai/{tool}/stream.
 * O backend re-emite os chunks SSE da OpenAI. Aqui parseamos cada "data:"
 * e chamamos onToken com cada delta de content.
 */
export async function callAiChatStream(
  endpoint: string,
  messages: AiChatMessage[],
  handlers: AiChatStreamHandlers,
): Promise<void> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl(`/api/ai/${endpoint}/stream`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...authHeader,
    },
    body: JSON.stringify({ messages }),
  });

  if (response.status === 401) throw new Error("LOGIN_REQUIRED");
  if (response.status === 403) throw new Error("PRO_REQUIRED");
  if (response.status === 429) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      `RATE_LIMITED: ${errBody.error?.message || "Limite atingido"}`,
    );
  }
  if (!response.ok || !response.body) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error?.message || "Erro ao processar com IA");
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

        let serverError: string | null = null;
        let delta: string | null = null;
        try {
          const parsed = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
            error?: string;
          };
          if (parsed.error) {
            serverError = parsed.error;
          } else {
            const d = parsed.choices?.[0]?.delta?.content;
            if (typeof d === "string" && d.length > 0) delta = d;
          }
        } catch {
          // Linha não-JSON (keep-alive ou parcial). Ignora.
        }

        if (serverError) {
          handlers.onError?.(serverError);
          throw new Error(serverError);
        }
        if (delta) handlers.onToken(delta);
      }
    }
  }
}

/**
 * Chama uma tool de IA com response_format estruturado (tipo resume-render).
 * Diferente das tools de chat, o backend devolve { data: T } em vez de { result: string }.
 */
export async function callAiStructured<T>(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<AiStructuredResponse<T>> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl(`/api/ai/${endpoint}`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) throw new Error("LOGIN_REQUIRED");
  if (response.status === 403) throw new Error("PRO_REQUIRED");
  if (response.status === 429) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      `RATE_LIMITED: ${errBody.error?.message || "Limite atingido"}`,
    );
  }
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      errBody.error?.message || "Erro ao gerar conteúdo estruturado.",
    );
  }

  const body = (await response.json()) as Partial<AiStructuredResponse<T>>;
  if (!body.data) throw new Error("Resposta sem campo data.");
  return { data: body.data };
}
