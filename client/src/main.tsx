import "./lib/recoverySnapshot";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import posthog from "posthog-js";
import { z } from "zod";
import App from "./App";
import { registerPreloadErrorGuard } from "./lib/preloadErrorGuard";
import { initClientSentry } from "./lib/sentry";
import "./fonts.css";
import "./index.css";

// Sentry do browser: inicializa cedo (antes do primeiro render) pra capturar
// erros de boot. No-op quando VITE_SENTRY_DSN esta ausente.
initClientSentry();

// Skew de deploy: o Vite emite vite:preloadError quando falha o preload de um
// chunk cujo hash sumiu apos um novo deploy. Isto aqui so OBSERVA e reporta:
// nao cancela o evento e nao recarrega. Quem recupera e o lazyWithRetry, dono
// unico do reload (retry, guarda anti-loop, ErrorBoundary). Cancelar o evento
// chegou a ser feito aqui e desligava justamente esse mecanismo; o porque esta
// no topo de lib/preloadErrorGuard.ts. Precisa vir antes do primeiro render.
// O nome do evento e case-sensitive e ja esteve errado aqui; mora em
// lib/preloadErrorGuard.ts, com teste, por isso.
registerPreloadErrorGuard();

// CSP: desliga o probe de eval e o JIT fastpass do Zod (new Function), que
// dispara securitypolicyviolation. Precisa rodar antes do primeiro parse.
z.config({ jitless: true });

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  defaults: "2026-01-30",
});

// Limpeza da flag legada bnt_signup_completed: era gravada no signup e lida por
// engano como "onboarding concluido", expulsando o recem-cadastrado. Nao e mais
// usada por ninguem; removida no boot para nao prender quem ja a tem persistida.
try {
  window.localStorage.removeItem("bnt_signup_completed");
} catch {
  // localStorage indisponivel; ignora.
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);
