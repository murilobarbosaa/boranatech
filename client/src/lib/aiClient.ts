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
    throw new Error(`RATE_LIMITED: ${data.error?.message || "Limite atingido"}`);
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || "Erro ao processar com IA");
  }

  const data = (await response.json()) as Partial<AiResponse>;

  return {
    result: data.result || "OPENAI_API_KEY ainda não configurada no servidor. Configure a variável de ambiente para ativar esta ferramenta.",
  };
}

export async function callAiChat(endpoint: string, messages: AiChatMessage[]): Promise<AiResponse> {
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

export async function callAiTool(endpoint: string, payload: Record<string, unknown>): Promise<AiResponse> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl(`/api/ai/${endpoint}`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify(payload),
  });

  return parseAiResponse(response);
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
    throw new Error(`RATE_LIMITED: ${errBody.error?.message || "Limite atingido"}`);
  }
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error?.message || "Erro ao gerar conteúdo estruturado.");
  }

  const body = (await response.json()) as Partial<AiStructuredResponse<T>>;
  if (!body.data) throw new Error("Resposta sem campo data.");
  return { data: body.data };
}
