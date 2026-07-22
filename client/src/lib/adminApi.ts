import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

async function authHeaders(options?: RequestInit) {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token || ""}`,
    ...(options?.headers || {}),
  };
}

// Erro do padrao { error: { code, message } } do server. Extends Error de
// proposito: todo catch existente (error.message) segue identico; quem precisa
// distinguir o code (ex: sentry_not_configured na aba Bugs) faz instanceof.
export class AdminApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseAdminResponse(res: Response) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new AdminApiError(
      data.error?.message || `Erro ${res.status}`,
      res.status,
      data.error?.code ?? null,
    );
  }

  return res.json();
}

export async function adminFetch(path: string, options?: RequestInit) {
  const res = await fetch(apiUrl(`/api/admin${path}`), {
    ...options,
    headers: await authHeaders(options),
  });

  return parseAdminResponse(res);
}

export async function contentFetch(path: string, options?: RequestInit) {
  const res = await fetch(apiUrl(`/api${path}`), {
    ...options,
    headers: await authHeaders(options),
  });

  return parseAdminResponse(res);
}
