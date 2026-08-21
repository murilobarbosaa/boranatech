import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

async function authHeaders(options?: RequestInit) {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  return {
    // `Content-Type` SO quando ha corpo. O `express.json()` global decide se le
    // o corpo pelos HEADERS, nao pelo metodo: com `Content-Type:
    // application/json` num GET, mais o `Transfer-Encoding: chunked` que a
    // borda do Railway acrescenta a requisicao sem `Content-Length`, ele conclui
    // que ha corpo e chama `getRawBody` num stream que ja acabou, e sai
    // `InternalServerError: stream is not readable` (Sentry NODE-EXPRESS-B).
    // Explicacao completa e o primeiro caso medido em
    // client/src/contexts/FavoritesContext.tsx:168.
    //
    // A guarda mora AQUI, dentro do helper, e nao em cada chamada: e o helper
    // que cobre todos os call sites por construcao, inclusive os que ainda nao
    // existem. Guarda no call site foi o desenho que deixou estes helpers de
    // fora quando o FavoritesContext foi consertado.
    ...(options?.body === undefined
      ? {}
      : { "Content-Type": "application/json" }),
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
