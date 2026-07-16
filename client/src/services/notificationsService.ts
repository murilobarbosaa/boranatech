import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const API_BASE = apiUrl("/api/me/notifications");

// Shape do item como o endpoint entrega (colunas públicas de notifications +
// read_at do usuário + is_expired calculado no server). Não é a Row crua de
// database.types.ts porque o server omite status/created_by e anexa campos.
export type NotificationType = "announcement" | "coupon" | "optin" | "system";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  category: "product" | "promotional";
  audience: string;
  coupon_code: string | null;
  discount_percent: number | null;
  cta_url: string | null;
  cta_label: string | null;
  expires_at: string | null;
  published_at: string | null;
  is_expired: boolean;
  read_at: string | null;
};

export type NotificationsPage = {
  data: NotificationItem[];
  unread_count: number;
  next_cursor: string | null;
};

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function fetchNotifications(options?: {
  limit?: number;
  cursor?: string;
}): Promise<NotificationsPage> {
  const headers = await getAuthHeader();
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.cursor) params.set("cursor", options.cursor);
  const query = params.toString();
  const res = await fetch(`${API_BASE}${query ? `?${query}` : ""}`, {
    headers,
  });
  if (!res.ok) throw new Error("Erro ao buscar notificações");
  return (await res.json()) as NotificationsPage;
}

export async function markAsRead(id: string): Promise<void> {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}/${id}/read`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error("Erro ao marcar notificação como lida");
}

export async function markAllAsRead(): Promise<number> {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}/read-all`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error("Erro ao marcar notificações como lidas");
  const json = (await res.json()) as { data?: { marked?: number } };
  return json.data?.marked ?? 0;
}
