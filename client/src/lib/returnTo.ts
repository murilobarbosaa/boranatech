// Saneamento de returnTo: aceita so caminho interno, rejeita esquema externo e
// bypass de barra dupla ("//") e barra-invertida ("/\"). Funcao pura, sem dependencias.
// Extraida de components/auth/RequireAuth.tsx (Fase 2 prep) pra isolar a dependencia
// numa lib (authGate.ts importava de um componente; agora importa de lib).
export function sanitizeReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.startsWith("/\\")) return null;
  return raw;
}
