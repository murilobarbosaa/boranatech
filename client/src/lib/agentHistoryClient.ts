import { apiUrl } from "./api";
import { supabase } from "./supabase";

// Cliente das rotas CRUD do historico de conversas (beneficio Pro). Mesmo Bearer
// do agentClient/aiClient. O gating real e server-side: estes endpoints ja barram
// nao-Pro (403) e nao-dono (404); aqui so traduzimos o status em sentinela.

export interface ConversationSummary {
  id: string;
  title: string | null;
  category: string | null;
  updated_at: string;
}

export interface ConversationDetailMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ConversationDetail {
  id: string;
  title: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
  messages: ConversationDetailMessage[];
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

// Traduz o status HTTP em sentinela simples (sem any).
function statusToError(status: number): string {
  if (status === 401) return "LOGIN_REQUIRED";
  if (status === 403) return "NOT_PRO";
  if (status === 404) return "NOT_FOUND";
  return "HISTORY_UNAVAILABLE";
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl("/api/agent/conversations"), {
    headers: { ...authHeader },
  });
  if (!response.ok) throw new Error(statusToError(response.status));

  const body = (await response.json()) as { data?: unknown };
  return Array.isArray(body.data) ? (body.data as ConversationSummary[]) : [];
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl(`/api/agent/conversations/${id}`), {
    headers: { ...authHeader },
  });
  if (!response.ok) throw new Error(statusToError(response.status));

  const body = (await response.json()) as { data?: unknown };
  if (!body.data || typeof body.data !== "object") {
    throw new Error("HISTORY_UNAVAILABLE");
  }
  const detail = body.data as ConversationDetail;
  return {
    ...detail,
    messages: Array.isArray(detail.messages) ? detail.messages : [],
  };
}

export async function deleteConversation(id: string): Promise<void> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl(`/api/agent/conversations/${id}`), {
    method: "DELETE",
    headers: { ...authHeader },
  });
  // 404 vira NOT_FOUND: o widget remove da lista do mesmo jeito (ja nao existia).
  if (!response.ok) throw new Error(statusToError(response.status));
}
