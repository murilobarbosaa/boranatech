import { useEffect, useState, type ReactNode } from "react";

import { apiUrl } from "@/lib/api";
import { getBetaToken } from "@/lib/betaGate";
import Acesso from "@/pages/Acesso";

import LandingFrame from "./LandingFrame";

type GateState = "loading" | "open" | "gated";

function isAcessoPath() {
  return window.location.pathname.startsWith("/acesso");
}

// Envolve o app. Decide entre mostrar o app (portao aberto ou token valido) e a
// landing (placeholder por enquanto). Token-based, independente do auth Supabase.
export default function LaunchGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>("loading");

  useEffect(() => {
    // /acesso renderiza sempre, antes de tudo: nao precisa resolver o portao.
    if (isAcessoPath()) return;

    let cancelled = false;

    async function resolveGate() {
      try {
        const token = getBetaToken();
        const res = await fetch(apiUrl("/api/launch-state"), {
          headers: token ? { "x-beta-token": token } : undefined,
        });
        if (!res.ok) throw new Error("launch-state indisponivel");
        const data = (await res.json()) as {
          status?: string;
          access?: boolean;
        };
        if (cancelled) return;
        const unlocked = data.status === "open" || data.access === true;
        setState(unlocked ? "open" : "gated");
      } catch {
        // Fail-safe: qualquer erro trata como portao fechado (mostra landing).
        if (!cancelled) setState("gated");
      }
    }

    void resolveGate();

    return () => {
      cancelled = true;
    };
  }, []);

  // a) /acesso sempre acessivel, mesmo com portao fechado.
  if (isAcessoPath()) {
    return <Acesso />;
  }

  // b) enquanto resolve, splash neutro pra nao piscar app-depois-landing.
  if (state === "loading") {
    return null;
  }

  // c) portao aberto ou token valido -> app.
  if (state === "open") {
    return <>{children}</>;
  }

  // d) caso contrario -> landing de lancamento (iframe).
  return <LandingFrame />;
}
