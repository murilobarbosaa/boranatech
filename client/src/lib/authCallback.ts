// Helpers de inspeção da URL para callbacks de auth (OAuth, confirmação, recovery).
// Fonte única usada pelo AuthContext (hold do loading) e pela detecção de recovery.

// Há um callback de OAuth/login em andamento na URL?
// PKCE usa ?code= na query; o fluxo implicit usa access_token/refresh_token no hash.
export function hasOAuthCallbackInUrl(): boolean {
  if (typeof window === "undefined") return false;
  const hasCode = new URLSearchParams(window.location.search).has("code");
  const rawHash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(rawHash);
  const hasToken =
    hashParams.has("access_token") || hashParams.has("refresh_token");
  return hasCode || hasToken;
}

// A URL traz um erro de auth (ex.: link expirado/invalido)? O supabase redireciona
// com error/error_code tanto na query (PKCE) quanto no hash (implicit).
export function hasAuthErrorInUrl(): boolean {
  if (typeof window === "undefined") return false;
  const query = new URLSearchParams(window.location.search);
  const rawHash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hash = new URLSearchParams(rawHash);
  return (
    query.has("error") ||
    query.has("error_code") ||
    hash.has("error") ||
    hash.has("error_code")
  );
}

export interface AuthUrlError {
  error: string | null;
  errorCode: string | null;
  description: string | null;
}

// Extrai SO os campos de erro da URL de callback. Existe porque `hasAuthErrorInUrl`
// responde sim/nao e o log precisa do codigo exato (a diferenca entre
// "redirect fora da allowlist" e "usuario cancelou" mora ai).
//
// Le apenas as tres chaves de erro, uma por uma, em vez de varrer os parametros:
// o hash do fluxo implicit carrega `access_token` e `refresh_token`, e qualquer
// leitura generica acabaria com token dentro de evento de telemetria. Allowlist,
// nunca denylist.
//
// Funcao pura sobre (search, hash) para ser testavel sem mexer em `window`.
export function parseAuthError(search: string, hash: string): AuthUrlError | null {
  const query = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const fragment = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);

  const pick = (key: string) => query.get(key) ?? fragment.get(key) ?? null;

  const error = pick("error");
  const errorCode = pick("error_code");
  const description = pick("error_description");

  if (!error && !errorCode) return null;
  return { error, errorCode, description };
}

export function readAuthErrorFromUrl(): AuthUrlError | null {
  if (typeof window === "undefined") return null;
  return parseAuthError(window.location.search, window.location.hash);
}
