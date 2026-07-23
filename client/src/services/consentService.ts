import posthog from "posthog-js";

import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const API_BASE = apiUrl("/api");

// Flag de "aceite pendente" gravada no signup (form de e-mail ou OAuth) e consumida
// quando a sessao aparece (SIGNED_IN em AuthContext). sessionStorage de proposito:
// sobrevive ao redirect do OAuth na mesma aba, mas NAO espera horas por confirmacao
// de e-mail (aba nao sobrevive) — nesse caso o ConsentGate cobre no primeiro login.
export const PENDING_CONSENT_KEY = "bnt_pending_consent";

type ConsentOp = "status" | "record";

// Erro de requisicao de consentimento com o status HTTP anexado. Deixa o
// ConsentGate distinguir "nao consentiu" (200 + hasConsented:false) de "nao deu
// pra verificar" (falha de rede/HTTP), e a telemetria carregar o status.
function consentError(status: number, message: string): Error {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
}

// Telemetria de falha (PostHog + console). Sem token, e-mail ou PII: so status,
// timestamps e flags. A sessao ja esta identificada via posthog.identify no
// AuthContext, entao userId nao e reenviado aqui.
function reportConsentFailure(
  op: ConsentOp,
  data: {
    httpStatus: number;
    tokenExpiresAt: number | null;
    now: number;
    hadToken: boolean;
    retriedAfterRefresh: boolean;
  },
): void {
  console.warn("[consent] request failed", { op, ...data });
  try {
    posthog.capture("consent_request_failed", { op, ...data });
  } catch {
    // posthog pode nao estar pronto; telemetria nunca quebra o fluxo.
  }
}

// Requisicao autenticada com recuperacao de token stale: getSession pode
// devolver um access_token ja expirado sem renova-lo (aba ociosa, maquina
// suspensa, refresh agendado que nao disparou) e o servidor responde 401.
// Renovamos a sessao uma vez e repetimos, mesmo padrao de
// FavoritesContext.apiFetch. Em falha final (nao-ok), emite telemetria.
async function consentFetch(
  op: ConsentOp,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  const doFetch = (token: string | null) =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  const tokenExpiresAt = session?.expires_at ?? null;
  const hadToken = Boolean(session?.access_token);

  let res = await doFetch(session?.access_token ?? null);
  let retriedAfterRefresh = false;

  if (res.status === 401 && supabase) {
    retriedAfterRefresh = true;
    const {
      data: { session: refreshed },
    } = await supabase.auth.refreshSession();
    if (refreshed?.access_token) {
      res = await doFetch(refreshed.access_token);
    }
  }

  if (!res.ok) {
    reportConsentFailure(op, {
      httpStatus: res.status,
      tokenExpiresAt,
      now: Math.floor(Date.now() / 1000),
      hadToken,
      retriedAfterRefresh,
    });
  }

  return res;
}

// Ha sessao autenticada agora? Usado logo apos o signUp: se a confirmacao de
// email estiver ligada nao ha token e o registro duravel espera o primeiro
// login (via ConsentGate).
export async function hasActiveSession(): Promise<boolean> {
  if (!supabase) return false;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return Boolean(session?.access_token);
}

// Identidade e prova vem do JWT no servidor. O client so envia os flags.
export async function recordConsent(): Promise<void> {
  const res = await consentFetch("record", "/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ acceptedTerms: true, acceptedPrivacy: true }),
  });
  if (!res.ok) {
    throw consentError(
      res.status,
      `Erro ao registrar consentimento (HTTP ${res.status}).`,
    );
  }
}

export async function getConsentStatus(): Promise<boolean> {
  const res = await consentFetch("status", "/consent/status");
  if (!res.ok) {
    throw consentError(
      res.status,
      `Erro ao consultar consentimento (HTTP ${res.status}).`,
    );
  }
  const json = (await res.json().catch(() => null)) as {
    hasConsented?: boolean;
  } | null;
  return json?.hasConsented === true;
}
