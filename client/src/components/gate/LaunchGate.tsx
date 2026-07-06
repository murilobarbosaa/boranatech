import { useEffect, useState, type ReactNode } from "react";

import { apiUrl } from "@/lib/api";
import { getBetaToken } from "@/lib/betaGate";
import AgentWidget from "@/components/agent/AgentWidget";
import Acesso from "@/pages/Acesso";

import LandingFrame from "./LandingFrame";

type GateState = "loading" | "open" | "gated";

function isAcessoPath() {
  return window.location.pathname.startsWith("/acesso");
}

// Rotas de recuperacao de senha: isentas do portao para que o link de reset
// (visitante anonimo, lancamento fechado) nunca caia na landing. Casa pelo
// pathname, entao a query do link (?code=...) e preservada.
const RECOVERY_PATHS = ["/recuperar-senha", "/redefinir-senha"];

function isRecoveryPath() {
  return RECOVERY_PATHS.includes(window.location.pathname);
}

// Prerender: o postbuild (scripts/prerender.mjs) roda puppeteer headless sobre o
// SPA e snapshota as rotas do sitemap. O chromium headless expoe
// navigator.webdriver === true, sinal que usamos pra renderizar o app direto e
// nao trancar os snapshots atras da landing. Portao de UX, NAO de seguranca:
// dado real continua atras de auth server-side, entao liberar o shell no
// prerender nao expoe nada sensivel.
function isPrerender() {
  return typeof navigator !== "undefined" && navigator.webdriver === true;
}

// Envolve o app. Decide entre mostrar o app (portao aberto ou token valido) e a
// landing (placeholder por enquanto). Token-based, independente do auth Supabase.
export default function LaunchGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>("loading");

  useEffect(() => {
    // Prerender nao resolve o portao: o render abaixo ja libera o app.
    if (isPrerender()) return;

    // /acesso e as rotas de recuperacao renderizam sempre, antes de tudo: nao
    // precisam resolver o portao.
    if (isAcessoPath() || isRecoveryPath()) return;

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

  // a) prerender: sempre o app, antes de qualquer decisao de portao.
  if (isPrerender()) {
    return <>{children}</>;
  }

  // b) /acesso sempre acessivel, mesmo com portao fechado.
  if (isAcessoPath()) {
    return <Acesso />;
  }

  // b.2) rotas de recuperacao de senha: sempre o app, nunca a landing.
  if (isRecoveryPath()) {
    return <>{children}</>;
  }

  // c) enquanto resolve, splash neutro pra nao piscar app-depois-landing.
  if (state === "loading") {
    return null;
  }

  // d) portao aberto ou token valido -> app. O widget do agente monta aqui (e
  // so aqui) pra nunca flutuar sobre a landing nem sobre /acesso e recuperacao.
  if (state === "open") {
    return (
      <>
        {children}
        <AgentWidget />
      </>
    );
  }

  // e) caso contrario -> landing de lancamento (iframe).
  return <LandingFrame />;
}
