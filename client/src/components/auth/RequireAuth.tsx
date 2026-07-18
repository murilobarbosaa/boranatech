import { useEffect, useRef, type ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { captureContentGateHit, classifyContentSource } from "@/lib/analytics";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [location] = useLocation();
  const gateHitFiredRef = useRef(false);

  // Anon batendo no muro de conteudo (area/subarea): registra content_gate_hit
  // uma unica vez, depois que o auth terminou de carregar. Baseline de quantos
  // visitantes o gate empurra pro cadastro antes de abrirmos o conteudo parcial.
  // So dispara pras duas rotas de conteudo; as outras 11 rotas guardadas pelo
  // RequireAuth caem em "other" e sao ignoradas.
  useEffect(() => {
    if (loading || user || gateHitFiredRef.current) return;
    const source = classifyContentSource(location);
    if (source === "area_detail" || source === "subarea_detail") {
      gateHitFiredRef.current = true;
      captureContentGateHit({ feature: source, path: location });
    }
  }, [loading, user, location]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  if (!user) {
    return (
      <Redirect to={`/cadastro?returnTo=${encodeURIComponent(location)}`} />
    );
  }

  return <>{children}</>;
}
