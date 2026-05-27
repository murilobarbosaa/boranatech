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
  const hasToken = hashParams.has("access_token") || hashParams.has("refresh_token");
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
