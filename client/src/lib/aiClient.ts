import { supabase } from "./supabase";

interface AiResponse {
  result: string;
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
  const response = await fetch(`/api/ai/${endpoint}`, {
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
  const response = await fetch(`/api/ai/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify(payload),
  });

  return parseAiResponse(response);
}
