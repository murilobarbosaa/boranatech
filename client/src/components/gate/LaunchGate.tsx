import { type ReactNode } from "react";

import AgentWidget from "@/components/agent/AgentWidget";
import Acesso from "@/pages/Acesso";

function isAcessoPath() {
  return window.location.pathname.startsWith("/acesso");
}

// Rotas de recuperacao de senha: renderizam o app direto, sem AgentWidget.
const RECOVERY_PATHS = ["/recuperar-senha", "/redefinir-senha"];

function isRecoveryPath() {
  return RECOVERY_PATHS.includes(window.location.pathname);
}

// Prerender (puppeteer headless, navigator.webdriver === true): app sem widget.
function isPrerender() {
  return typeof navigator !== "undefined" && navigator.webdriver === true;
}

// Waitlist APOSENTADA (o site ja lancou): o portao NUNCA mais renderiza a landing.
// Trava sempre no app, independente de launch-state, 429 ou erro de rede. O portao
// e de UX, nao de seguranca: dado real fica atras do auth Supabase server-side,
// entao travar em aberto e seguro. LandingFrame e o arquivo da landing seguem no
// repo (reversivel via git), apenas fora do caminho de render. /acesso, recovery e
// prerender mantem o tratamento proprio.
export default function LaunchGate({ children }: { children: ReactNode }) {
  if (isAcessoPath()) {
    return <Acesso />;
  }

  if (isPrerender() || isRecoveryPath()) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <AgentWidget />
    </>
  );
}
