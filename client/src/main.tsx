import "./lib/recoverySnapshot";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import posthog from "posthog-js";
import App from "./App";
import "./fonts.css";
import "./index.css";

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
