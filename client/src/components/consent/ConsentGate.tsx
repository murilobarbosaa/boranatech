import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { hasOAuthCallbackInUrl } from "@/lib/authCallback";
import { getConsentStatus, recordConsent } from "@/services/consentService";

// Gate de consentimento LGPD. Cobre OAuth e usuarios legados: qualquer sessao
// autenticada sem consentimento atual cai num modal bloqueante antes de acessar
// o app. Deixa passar sem consentimento apenas o que e necessario para decidir:
// as paginas de Termos e Politica, o callback do OAuth em andamento e o proprio
// logout (via botao de recusar no modal).

type Phase = "checking" | "consented" | "needsConsent";

const ALLOWLISTED_PATHS = new Set(["/termos-de-uso", "/privacidade"]);

export default function ConsentGate({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth();
  const [location] = useLocation();

  const userId = session?.user?.id ?? null;
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

  useEffect(() => {
    if (!gateActive) return;
    let cancelled = false;
    setPhase("checking");
    getConsentStatus()
      .then((consented) => {
        if (!cancelled) setPhase(consented ? "consented" : "needsConsent");
      })
      .catch(() => {
        // Erro na consulta = tratar como nao consentido, nunca colapsar em
        // "consentiu". Fail-closed tambem no client.
        if (!cancelled) setPhase("needsConsent");
      });
    return () => {
      cancelled = true;
    };
  }, [gateActive, userId]);

  async function handleAccept() {
    if (!acceptedTerms || !acceptedPrivacy || submitting) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      await recordConsent();
      setPhase("consented");
    } catch {
      setSubmitError(true);
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
