import { supabaseAdmin } from "../supabaseAdmin";

// Camada de acesso ao historico de conversas do agente. Regras de seguranca:
//  - Toda funcao recebe userId EXPLICITAMENTE (de req.user.id, JWT verificado) e
//    filtra por user_id. Nunca recebe user_id do corpo da requisicao.
//  - supabaseAdmin usa service role e BYPASSA a RLS; o filtro por user_id (e por
//    id da conversa, quando se opera sobre uma) e a barreira real.
//  - Erro de query e sinalizado distinto de "vazio" (StoreResult.ok), sem state
//    collapse. As funcoes nao lancam silenciosamente: logam warn.

const LIST_LIMIT = 50; // // TODO: calibrar.

export type MessageRole = "user" | "assistant";

export interface ConversationListItem {
  id: string;
  title: string | null;
  category: string | null;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface ConversationWithMessages {
  id: string;
  title: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
  messages: ConversationMessage[];
}

// Em sucesso, data pode ser vazio/null legitimamente; falha vem como ok:false.
export type StoreResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createConversation(
  userId: string,
): Promise<StoreResult<{ id: string; createdAt: string; updatedAt: string }>> {
  const { data, error } = await supabaseAdmin
    .from("agent_conversations")
    .insert({ user_id: userId })
    .select("id, created_at, updated_at")
    .single();

  if (error || !data) {
    console.warn("[agent/store] createConversation falhou:", error?.message);
    return { ok: false, error: "create_failed" };
  }

  const row = data as { id: string; created_at: string; updated_at: string };
  return {
    ok: true,
    data: { id: row.id, createdAt: row.created_at, updatedAt: row.updated_at },
  };
}

export async function listConversations(
  userId: string,
): Promise<StoreResult<ConversationListItem[]>> {
  const { data, error } = await supabaseAdmin
    .from("agent_conversations")
    .select("id, title, category, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    console.warn("[agent/store] listConversations falhou:", error.message);
    return { ok: false, error: "list_failed" };
  }

  return { ok: true, data: (data ?? []) as ConversationListItem[] };
}

export async function getConversation(
  userId: string,
  conversationId: string,
): Promise<StoreResult<ConversationWithMessages | null>> {
  // Filtra por user_id E id juntos: ninguem toca conversa de outro mesmo
  // conhecendo o id. Se nao for dona (ou nao existir), retorna data:null sem
  // vazar a diferenca.
  const { data: conv, error: convError } = await supabaseAdmin
    .from("agent_conversations")
    .select("id, title, category, created_at, updated_at")
    .eq("user_id", userId)
    .eq("id", conversationId)
    .maybeSingle();

  if (convError) {
    console.warn("[agent/store] getConversation (conversa) falhou:", convError.message);
    return { ok: false, error: "get_failed" };
  }
  if (!conv) {
    return { ok: true, data: null };
  }

  const c = conv as {
    id: string;
    title: string | null;
    category: string | null;
    created_at: string;
    updated_at: string;
  };

  const { data: msgs, error: msgError } = await supabaseAdmin
    .from("agent_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (msgError) {
    console.warn("[agent/store] getConversation (mensagens) falhou:", msgError.message);
    return { ok: false, error: "get_failed" };
  }

  return {
    ok: true,
    data: { ...c, messages: (msgs ?? []) as ConversationMessage[] },
  };
}

export async function appendMessage(
  userId: string,
  conversationId: string,
  role: MessageRole,
  content: string,
): Promise<StoreResult<{ id: string }>> {
  // Valida posse ANTES de inserir: a conversa precisa ser do userId.
  const { data: conv, error: convError } = await supabaseAdmin
    .from("agent_conversations")
    .select("id")
    .eq("user_id", userId)
    .eq("id", conversationId)
    .maybeSingle();

  if (convError) {
    console.warn("[agent/store] appendMessage (posse) falhou:", convError.message);
    return { ok: false, error: "append_failed" };
  }
  if (!conv) {
    // Conversa nao e do userId (ou nao existe): NAO insere.
    return { ok: false, error: "not_owner" };
  }

  const { data, error } = await supabaseAdmin
    .from("agent_messages")
    .insert({ conversation_id: conversationId, role, content })
    .select("id")
    .single();

  if (error || !data) {
    console.warn("[agent/store] appendMessage (insert) falhou:", error?.message);
    return { ok: false, error: "append_failed" };
  }

  // Toca updated_at da conversa (filtra por user_id E id). Best-effort: se o
  // touch falhar, a mensagem ja foi inserida, entao nao reverte a operacao.
  const { error: touchError } = await supabaseAdmin
    .from("agent_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", conversationId);

  if (touchError) {
    console.warn("[agent/store] appendMessage (touch updated_at) falhou:", touchError.message);
  }

  const row = data as { id: string };
  return { ok: true, data: { id: row.id } };
}

export async function deleteConversation(
  userId: string,
  conversationId: string,
): Promise<StoreResult<{ deleted: boolean }>> {
  // Filtra por user_id E id: so apaga conversa do proprio dono. A cascata do FK
  // leva as mensagens junto. select("id") devolve as linhas apagadas para
  // distinguir "apagou" de "nada batia" (404 no endpoint).
  const { data, error } = await supabaseAdmin
    .from("agent_conversations")
    .delete()
    .eq("user_id", userId)
    .eq("id", conversationId)
    .select("id");

  if (error) {
    console.warn("[agent/store] deleteConversation falhou:", error.message);
    return { ok: false, error: "delete_failed" };
  }

  const rows = (data ?? []) as Array<{ id: string }>;
  return { ok: true, data: { deleted: rows.length > 0 } };
}
