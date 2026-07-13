import "./lib/recoverySnapshot";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import posthog from "posthog-js";
import { z } from "zod";
import App from "./App";
import { reloadOnceForStaleChunk } from "./lib/lazyWithRetry";
import "./fonts.css";
import "./index.css";

// Skew de deploy: o Vite emite vite:preloaderror quando falha o preload de um
// chunk cujo hash sumiu apos um novo deploy. Recarrega uma vez (mesma guarda
// anti-loop do lazyWithRetry) em vez de deixar a navegacao quebrar. Precisa
// vir antes do primeiro render.
window.addEventListener("vite:preloaderror", (event) => {
  event.preventDefault();
  reloadOnceForStaleChunk();
});

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
