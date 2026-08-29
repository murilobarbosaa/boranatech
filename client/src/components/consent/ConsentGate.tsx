import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import posthog from "posthog-js";
import { Spinner } from "@/components/ui/spinner";
import { PERCEIVED_STALL_MS, useAuth } from "@/contexts/AuthContext";
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

// Teto do tempo que o gate espera a escrita de consentimento do cadastro (item
// 3.4). A escrita NAO e cancelada quando isto expira: ela continua tentando em
// segundo plano, e se concluir depois o gate fecha o modal sozinho
// (consentWriteConfirmed). O que expira aqui e a PACIENCIA da tela, nao a prova.
//
// 10s, e o numero sai de uma comparacao de danos que o item 3.5 mudou. Com
// ON CONFLICT DO NOTHING, mostrar o modal para quem ja consentiu e inofensivo:
// aceitar de novo nao altera o accepted_at original, entao o custo e um clique a
// mais. Ja prender a tela custa muito mais, e no pior momento possivel, que e o
// segundo seguinte ao cadastro. Logo, entre errar segurando e errar perguntando,
// erra-se perguntando.
//
// O valor e o reflexo de recarregar (~10s): esperar alem dele nao compra nada,
// porque a pessoa recarrega e o hold morre junto com a aba. Somado ao backoff que
// segue rodando por baixo, cobre a primeira tentativa e a primeira retentativa da
// escrita, que e onde a esmagadora maioria dos casos resolve.
const CONSENT_WRITE_HOLD_MS = 10_000;

function captureGateEvent(event: string, props: Record<string, unknown>): void {
  console.info(`[ConsentGate] ${event}`, props);
  try {
    posthog.capture(event, props);
  } catch {
    // telemetria nunca quebra o gate.
  }
}

export default function ConsentGate({ children }: { children: ReactNode }) {
  const { session, signOut, consentWriteInFlight, consentWriteConfirmed } =
    useAuth();
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
  // Apenas apresentacao: sinaliza que a verificacao falhou e um retry (backoff)
  // esta em curso, para o checking nao parecer travado. Nao muda fase nem fluxo.
  const [retrying, setRetrying] = useState(false);
  // O hold da escrita ja passou do teto e o gate voltou a decidir sozinho.
  const [holdExpired, setHoldExpired] = useState(false);
  // A espera pela escrita passou do ponto em que parece travada (item 1.8
  // aplicado a esta tela). So apresentacao: nao muda fase nem fluxo.
  const [holdLooksStalled, setHoldLooksStalled] = useState(false);

  // Enquanto isto for true, o gate nao conclui nada sobre consentimento.
  const holdingForWrite = consentWriteInFlight && !holdExpired;

  // Espelha phase para o effect de recuperacao ler o valor atual sem colocar
  // phase nas deps (o que faria o effect rodar a cada transicao de fase).
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Os dois relogios do hold nascem e morrem juntos com a escrita em voo, e por
  // isso vivem no mesmo efeito: separar em dois significaria lembrar de limpar os
  // dois em cada saida, e o de tranquilizacao sobreviveria ao desfecho.
  useEffect(() => {
    if (!consentWriteInFlight) {
      // Escrita acabou (de um jeito ou de outro): zera para que uma proxima
      // escrita nesta mesma carga de pagina ganhe o hold inteiro de novo.
      setHoldExpired(false);
      setHoldLooksStalled(false);
      return;
    }
    const aviso = window.setTimeout(
      () => setHoldLooksStalled(true),
      PERCEIVED_STALL_MS,
    );
    const teto = window.setTimeout(
      () => setHoldExpired(true),
      CONSENT_WRITE_HOLD_MS,
    );
    return () => {
      window.clearTimeout(aviso);
      window.clearTimeout(teto);
    };
  }, [consentWriteInFlight]);

  // Escrita CONFIRMADA pelo servidor, possivelmente depois de o hold expirar e de
  // o modal ja ter aparecido. Fecha sozinho, sem clique: a mesma autoridade que o
  // gate consultaria (o servidor) ja respondeu, e pedir de novo seria perguntar o
  // que acabamos de saber. Contador, nao booleano, para que uma segunda gravacao
  // na mesma carga de pagina volte a disparar este efeito.
  useEffect(() => {
    if (consentWriteConfirmed === 0) return;
    setPhase("consented");
  }, [consentWriteConfirmed]);

  useEffect(() => {
    if (!gateActive) return;
    // Item 3.4. Escrita de consentimento em voo: NAO consultar o status agora.
    // Consultar aqui e ler antes da escrita, e a resposta seria um `false` que
    // significa "ainda nao chegou", nao "nao consentiu" — foi assim que 50 pessoas
    // que tinham acabado de aceitar viram o modal pedindo o aceite de novo.
    // Segurar em "checking" e correto: nao ha nada a decidir ainda, e o efeito
    // roda de novo sozinho quando a flag cair (ela esta nas deps), qualquer que
    // seja o desfecho da escrita.
    //
    // Isto NAO e retry sobre `false`, e a distincao e o ponto: um `false` obtido
    // com a escrita ja concluida e legitimo e terminal (quem de fato nao aceitou
    // precisa ver o modal), e retentar sobre ele daria um spinner que nunca sai.
    // O que se espera aqui e o fim da ESCRITA, um evento que sempre acontece.
    //
    // E a espera tem TETO (holdingForWrite, nao consentWriteInFlight): passado
    // CONSENT_WRITE_HOLD_MS o gate volta a decidir por conta propria, mesmo com a
    // escrita ainda tentando por baixo. Se ela concluir depois, o efeito de
    // consentWriteConfirmed acima fecha o modal sem clique.
    if (holdingForWrite) {
      setPhase("checking");
      return;
    }
    let cancelled = false;
    setPhase("checking");
    setRetrying(false);

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
          setRetrying(true);
          await new Promise((resolve) => setTimeout(resolve, delay));
          if (cancelled) return;
        }
      }
    }

    void runCheck();

    return () => {
      cancelled = true;
    };
  }, [gateActive, userId, checkNonce, holdingForWrite]);

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
      await recordConsent("consent_gate_checkbox");
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
    // Item 1.8 aplicado a esta tela. O spinner mudo daqui e o mesmo problema do
    // retorno do OAuth, com outro suporte: silencio por mais de PERCEIVED_STALL_MS
    // faz a pessoa recarregar, e recarregar no meio do hold mata a escrita que
    // ainda estava tentando em segundo plano. A mensagem existe para segurar o
    // reflexo, nao para informar erro: nao ha erro nenhum aqui.
    //
    // As duas mensagens sao mutuamente exclusivas por construcao: `retrying` so e
    // ligado dentro de runCheck, que nem chega a rodar enquanto ha hold.
    const progresso = holdingForWrite
      ? holdLooksStalled
        ? // TODO(Ana): copy da espera pela gravacao do aceite no cadastro.
          "Registrando seu aceite, só um instante..."
        : null
      : retrying
        ? "Não foi possível verificar. Tentando novamente..."
        : null;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--brand-cream)]">
        <Spinner className="size-8" />
        {/* Sem role="status" aqui: o proprio Spinner acima ja e a regiao viva
            (role="status" + aria-label). Duas regioes vivas irmas fazem o leitor
            de tela anunciar a mesma espera duas vezes. */}
        {progresso ? (
          <p className="text-sm font-bold text-slate-600">{progresso}</p>
        ) : null}
      </div>
    );
  }

  // phase === "checkFailed": nao conseguimos verificar o consentimento. Bloqueia
  // o acesso (nao libera sem verificacao) mas NAO pede novo aceite: oferece
  // apenas retry e a saida da conta.
  if (phase === "checkFailed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--brand-cream)] p-4">
        <div className="w-full max-w-md rounded-2xl border-2 border-slate-950 bg-white p-6 text-center shadow-[6px_6px_0_var(--bnt-shadow)]">
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
      <div className="w-full max-w-md rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_var(--bnt-shadow)]">
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
