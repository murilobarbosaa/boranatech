import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import posthog from "posthog-js";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { hasOAuthCallbackInUrl } from "@/lib/authCallback";
import { getConsentStatus, recordConsent } from "@/services/consentService";

// Gate de consentimento LGPD. Cobre OAuth e usuarios legados: qualquer sessao
// autenticada sem consentimento atual cai num modal bloqueante antes de acessar
// o app. Deixa passar sem consentimento apenas o que e necessario para decidir:
// as paginas de Termos e Politica, o callback do OAuth em andamento e o proprio
// logout (via botao de recusar no modal).

// checking    -> verificando no server
// consented   -> tem consentimento atual, libera o app
// needsConsent-> server respondeu que NAO consentiu (modal de aceite)
// checkFailed -> a verificacao falhou (rede/HTTP): bloqueia sem pedir aceite,
//                pois nao sabemos se ja consentiu. NUNCA colapsar em needsConsent.
type Phase = "checking" | "consented" | "needsConsent" | "checkFailed";

const ALLOWLISTED_PATHS = new Set(["/termos-de-uso", "/privacidade"]);

// Backoff curto antes de exibir a tela de falha: absorve indisponibilidades
// transitorias (cold start do Railway, blip de rede) sem mostrar o bloqueio a
// todo usuario autenticado. Esgotado, cai em checkFailed — que ainda tem retry
// manual e recuperacao automatica pos-refresh de token. Cada tentativa falha ja
// emite consent_request_failed no consentService, entao os retries sao
// observaveis sem telemetria extra aqui.
const CHECK_RETRY_DELAYS_MS = [1500, 4000];

function captureGateEvent(event: string, props: Record<string, unknown>): void {
  console.info(`[ConsentGate] ${event}`, props);
  try {
    posthog.capture(event, props);
  } catch {
    // telemetria nunca quebra o gate.
  }
}

export default function ConsentGate({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth();
  const [location] = useLocation();

  const userId = session?.user?.id ?? null;
  const accessToken = session?.access_token ?? null;
  const onAllowlistedPath = ALLOWLISTED_PATHS.has(location);
  // Callback OAuth (PKCE) volta para /perfil com ?code= na URL; nao ha rota
  // dedicada. Enquanto a troca do code por sessao acontece, o gate nao pode
  // interferir, senao trava o login.
  const oauthInProgress = hasOAuthCallbackInUrl();
  const gateActive = Boolean(userId) && !onAllowlistedPath && !oauthInProgress;

  const [phase, setPhase] = useState<Phase>("checking");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  // Re-verificacao: o botao "Tentar novamente" e a recuperacao automatica
  // pos-refresh de token incrementam este contador para re-rodar o effect.
  const [checkNonce, setCheckNonce] = useState(0);

  // Espelha phase para o effect de recuperacao ler o valor atual sem colocar
  // phase nas deps (o que faria o effect rodar a cada transicao de fase).
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    if (!gateActive) return;
    let cancelled = false;
    setPhase("checking");

    async function runCheck() {
      for (let attempt = 0; ; attempt++) {
        try {
          const consented = await getConsentStatus();
          if (cancelled) return;
          setPhase(consented ? "consented" : "needsConsent");
          captureGateEvent("consent_check", {
            outcome: consented ? "consented" : "needsConsent",
          });
          return;
        } catch (err) {
          if (cancelled) return;
          // Falha na verificacao (throw, 401 apos retry, rede/5xx): NAO tratar
          // como "nao consentiu". Tenta de novo com backoff curto e, esgotado,
          // cai em checkFailed — bloqueia o app sem pedir novo aceite a quem ja
          // consentiu (fail-closed sem falso pedido de consentimento).
          const delay = CHECK_RETRY_DELAYS_MS[attempt];
          if (delay === undefined) {
            const status = (err as { status?: number } | null)?.status ?? null;
            setPhase("checkFailed");
            captureGateEvent("consent_check", {
              outcome: "checkFailed",
              status,
            });
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
          if (cancelled) return;
        }
      }
    }

    void runCheck();

    return () => {
      cancelled = true;
    };
  }, [gateActive, userId, checkNonce]);

  // Recuperacao automatica: se a verificacao falhou e o token foi renovado
  // (TOKEN_REFRESHED muda o access_token), tenta de novo UMA vez. Nao
  // re-verifica em consented/needsConsent, para nao bater no /status a cada
  // refresh de token.
  useEffect(() => {
    if (phaseRef.current === "checkFailed") {
      setCheckNonce((n) => n + 1);
    }
  }, [accessToken]);

  async function handleAccept() {
    if (!acceptedTerms || !acceptedPrivacy || submitting) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      await recordConsent();
      setPhase("consented");
      captureGateEvent("consent_accept", { result: "ok" });
    } catch (err) {
      const status = (err as { status?: number } | null)?.status ?? null;
      setSubmitError(true);
      captureGateEvent("consent_accept", { result: "failed", status });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    try {
      await signOut();
    } catch (err) {
      console.warn("[ConsentGate] signOut failed", err);
    }
  }

  if (!gateActive || phase === "consented") {
    return <>{children}</>;
  }

  if (phase === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f4]">
        <Spinner className="size-8" />
      </div>
    );
  }

  // phase === "checkFailed": nao conseguimos verificar o consentimento. Bloqueia
  // o acesso (nao libera sem verificacao) mas NAO pede novo aceite: oferece
  // apenas retry e a saida da conta.
  if (phase === "checkFailed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f4] p-4">
        <div className="w-full max-w-md rounded-2xl border-2 border-slate-950 bg-white p-6 text-center shadow-[6px_6px_0_#0f172a]">
          {/* TODO(Ana): titulo do estado de falha de verificacao do gate. */}
          <h2 className="font-display text-xl font-black text-slate-950">
            Não foi possível verificar sua conta
          </h2>
          {/* TODO(Ana): texto do estado de falha de verificacao do gate. */}
          <p className="mt-2 text-sm text-slate-700">
            Tivemos um problema para confirmar seus dados. Verifique sua conexão
            e tente novamente.
          </p>
          <button
            type="button"
            onClick={() => setCheckNonce((n) => n + 1)}
            className="btn-brutal-accent mt-6 inline-flex w-full justify-center rounded-full px-5 py-3 font-black"
          >
            {/* TODO(Ana): rotulo do botao de tentar novamente no gate. */}
            Tentar novamente
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="mt-3 block w-full text-center text-sm font-bold text-slate-600 hover:text-slate-900 hover:underline"
          >
            {/* TODO(Ana): rotulo do botao de sair no estado de falha do gate. */}
            Sair da conta
          </button>
        </div>
      </div>
    );
  }

  // phase === "needsConsent": modal bloqueante, sem botao de fechar e sem
  // clique fora que dispense.
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
    >
      <div className="w-full max-w-md rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a]">
        {/* TODO(Ana): titulo do modal de consentimento obrigatorio. */}
        <h2 className="font-display text-xl font-black text-slate-950">
          Antes de continuar
        </h2>
        {/* TODO(Ana): texto explicativo do consentimento obrigatorio. */}
        <p className="mt-2 text-sm text-slate-700">
          Para usar a plataforma, precisamos do seu aceite dos documentos
          abaixo.
        </p>

        <div className="mt-5 space-y-3">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 flex-shrink-0"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            {/* TODO(Ana): rotulo da checkbox de Termos de Uso no gate. */}
            <span>
              Li e aceito os{" "}
              <a
                href="/termos-de-uso"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-violet-700 underline"
              >
                Termos de Uso
              </a>
              .
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 flex-shrink-0"
              checked={acceptedPrivacy}
              onChange={(event) => setAcceptedPrivacy(event.target.checked)}
            />
            {/* TODO(Ana): rotulo da checkbox de Politica de Privacidade no gate. */}
            <span>
              Li e aceito a{" "}
              <a
                href="/privacidade"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-violet-700 underline"
              >
                Política de Privacidade
              </a>
              .
            </span>
          </label>
        </div>

        {submitError && (
          <p role="alert" className="mt-4 text-sm font-bold text-red-700">
            {/* TODO(Ana): mensagem de erro ao registrar consentimento no gate. */}
            Não foi possível registrar seu aceite. Tente novamente.
          </p>
        )}

        <button
          type="button"
          onClick={handleAccept}
          disabled={!acceptedTerms || !acceptedPrivacy || submitting}
          className="btn-brutal-accent mt-6 inline-flex w-full justify-center rounded-full px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {/* TODO(Ana): rotulo do botao de aceitar no gate. */}
          {submitting ? "Processando..." : "Aceitar e continuar"}
        </button>

        <button
          type="button"
          onClick={handleDecline}
          className="mt-3 block w-full text-center text-sm font-bold text-slate-600 hover:text-slate-900 hover:underline"
        >
          {/* TODO(Ana): rotulo do botao de recusar e sair no gate. */}
          Recusar e sair da conta
        </button>
      </div>
    </div>
  );
}
