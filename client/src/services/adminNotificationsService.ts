import { adminFetch } from "@/lib/adminApi";

// Service da seção admin de notificações. Usa o adminFetch (Bearer +
// prefixo /api/admin + parse de erro do padrão { error: { message } }).

export type AdminNotificationStatus = "draft" | "published" | "archived";
export type AdminNotificationType =
  | "announcement"
  | "coupon"
  | "optin"
  | "system";
export type AdminNotificationCategory = "product" | "promotional";
export type AdminNotificationAudience =
  | "all"
  | "never_pro"
  | "active_pro"
  | "ex_pro"
  | "custom";

export type AdminNotification = {
  id: string;
  title: string;
  body: string;
  type: AdminNotificationType;
  category: AdminNotificationCategory;
  audience: AdminNotificationAudience;
  coupon_code: string | null;
  discount_percent: number | null;
  cta_url: string | null;
  cta_label: string | null;
  expires_at: string | null;
  status: AdminNotificationStatus;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  read_count: number;
  recipient_count: number;
};

export type AdminNotificationInput = {
  title: string;
  body: string;
  type: AdminNotificationType;
  category: AdminNotificationCategory;
  audience: AdminNotificationAudience;
  coupon_code?: string | null;
  discount_percent?: number | null;
  cta_url?: string | null;
  cta_label?: string | null;
  expires_at?: string | null;
  // Obrigatório (min 1, max 500) quando audience é custom; proibido nas demais.
  recipient_emails?: string[];
};

// POST/PATCH de audience custom devolvem a resolução da lista junto.
export type AdminNotificationMutationResult = {
  data: AdminNotification;
  matched?: string[];
  unmatched?: string[];
};

export type NotificationStats = {
  total_reads: number;
  reads_by_day: Array<{ day: string; count: number }>;
};

export type AudiencePreview = {
  total_users: number;
  matched: number;
};

export async function listNotifications(options?: {
  status?: AdminNotificationStatus;
  type?: AdminNotificationType;
  limit?: number;
  offset?: number;
}): Promise<{ data: AdminNotification[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.type) params.set("type", options.type);
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.offset) params.set("offset", String(options.offset));
  const query = params.toString();
  return adminFetch(`/notifications${query ? `?${query}` : ""}`);
}

export async function createNotification(
  input: AdminNotificationInput,
): Promise<AdminNotificationMutationResult> {
  return adminFetch("/notifications", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function patchNotification(
  id: string,
  patch: Partial<AdminNotificationInput> & { status?: "published" | "archived" },
): Promise<AdminNotificationMutationResult> {
  return adminFetch(`/notifications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function publishNotification(
  id: string,
): Promise<{ data: AdminNotification }> {
  return adminFetch(`/notifications/${id}/publish`, { method: "POST" });
}

export async function archiveNotification(
  id: string,
): Promise<{ data: AdminNotification }> {
  return adminFetch(`/notifications/${id}/archive`, { method: "POST" });
}

export async function fetchNotificationStats(
  id: string,
): Promise<{ data: NotificationStats }> {
  return adminFetch(`/notifications/${id}/stats`);
}

export async function fetchAudiencePreview(
  audience: AdminNotificationAudience,
  category: AdminNotificationCategory,
): Promise<{ data: AudiencePreview }> {
  const params = new URLSearchParams({ audience, category });
  return adminFetch(`/notifications/audience-preview?${params.toString()}`);
}
