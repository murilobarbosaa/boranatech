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

async function parseAdminResponse(res: Response) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || `Erro ${res.status}`);
  }

  return res.json();
}

export async function adminFetch(path: string, options?: RequestInit) {
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers: await authHeaders(options),
  });

  return parseAdminResponse(res);
}

export async function contentFetch(path: string, options?: RequestInit) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: await authHeaders(options),
  });

  return parseAdminResponse(res);
}
