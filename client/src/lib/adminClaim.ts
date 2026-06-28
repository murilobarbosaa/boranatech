// Leitura da claim `admin_role` do access token do Supabase, SO para a UI decidir
// o que desenhar (abrir o gate de /admin sem flash). NAO verifica assinatura: a
// autoridade de admin continua no backend, que valida via RPC a cada request.
// Esta funcao apenas decodifica o payload do JWT (base64url -> JSON) e le a claim.

export type AdminClaimRole = "owner" | "editor" | "viewer";

export function readAdminClaim(accessToken: string): AdminClaimRole | null {
  try {
    const payloadPart = accessToken.split(".")[1];
    if (!payloadPart) return null;
    const json = JSON.parse(
      decodeURIComponent(
        atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join(""),
      ),
    ) as { admin_role?: unknown };
    const r = json.admin_role;
    return r === "owner" || r === "editor" || r === "viewer" ? r : null;
  } catch {
    return null;
  }
}
