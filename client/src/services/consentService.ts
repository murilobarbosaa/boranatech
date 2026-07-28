import posthog from "posthog-js";

import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { ConsentMethod } from "@shared/consent";

const API_BASE = apiUrl("/api");

// Flag de "aceite pendente" gravada no signup (form de e-mail ou OAuth) e consumida
// quando a sessao aparece (SIGNED_IN em AuthContext). sessionStorage de proposito:
// sobrevive ao redirect do OAuth na mesma aba.
//
// A ressalva sobre confirmacao de e-mail que morava aqui foi VERIFICADA em
// 2026-07-28 e nao se aplica a este projeto: `mailer_autoconfirm` esta LIGADO na
// config de auth do Supabase, ou seja, confirmacao por e-mail esta DESLIGADA, o
// signUp ja devolve sessao e o SIGNED_IN sai na hora, na mesma aba. Conferido nos
// dois sentidos: nenhum dos usuarios de auth.users tem `email_confirmed_at` nulo.
// Se a confirmacao um dia for ligada, esta flag deixa de alcancar o cadastro por
// e-mail (a aba nao espera o clique no link, que pode vir de outro aparelho) e o
// caminho passa a depender do ConsentGate no primeiro login.
//
// A flag so e APAGADA depois de o servidor confirmar a gravacao (ver recordConsent
// e o flush no AuthContext). Apagar antes era o que transformava uma falha de rede
// em consentimento perdido sem rastro.
export const PENDING_CONSENT_KEY = "bnt_pending_consent";

type ConsentOp = "status" | "record";

// Teto de UMA tentativa de requisicao de consentimento. Com o backoff de
// recordConsent, o pior caso visivel e 8s + 0,8s + 8s + 2,4s + 8s, ou seja, cerca
// de 27s ate o gate voltar a decidir sozinho. Longo, mas finito e so alcancavel
// com a rede morrendo tres vezes seguidas; o caso comum (5xx rapido, DNS que
// falha na hora) resolve em menos de um segundo.
const REQUEST_TIMEOUT_MS = 8_000;

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
      // Teto por tentativa. Nao e decorativo: desde que o ConsentGate passou a
      // SEGURAR a avaliacao enquanto ha escrita em voo (item 3.4), um fetch que
      // nunca resolve deixaria de ser "consentimento perdido" e viraria "tela
      // travada em spinner para sempre", que e pior. `fetch` sem sinal nao tem
      // limite proprio. O abort vira erro sem `status`, ou seja, retentavel, que
      // e o tratamento certo para uma conexao que morreu no meio.
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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

// Backoff do registro de consentimento: 3 tentativas no total (a primeira mais
// duas). Curto de proposito, porque alguem esta esperando na frente da tela, e
// limitado de proposito, porque tentativa infinita transforma indisponibilidade
// em spinner eterno. Esgotado, quem cobre e o ConsentGate na proxima carga.
const RECORD_RETRY_DELAYS_MS = [800, 2400];

// Repetir so faz sentido quando a falha pode ter sido do caminho, nao do pedido.
// 4xx (fora de 408/429) e recusa deliberada do servidor: repetir o mesmo corpo
// daria o mesmo resultado e so atrasaria o desfecho honesto. `status === null` e
// erro de rede (o fetch nem chegou a ter resposta), que e o caso mais comum de
// escrita perdida e o principal motivo de este retry existir.
function isRetryableStatus(status: number | null): boolean {
  if (status === null) return true;
  if (status === 408 || status === 429) return true;
  return status >= 500;
}

async function attemptRecord(method: ConsentMethod): Promise<void> {
  const res = await consentFetch("record", "/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      acceptedTerms: true,
      acceptedPrivacy: true,
      method,
    }),
  });
  if (!res.ok) {
    throw consentError(
      res.status,
      `Erro ao registrar consentimento (HTTP ${res.status}).`,
    );
  }
  // O 2xx sozinho nao e mais a confirmacao: o servidor passou a devolver o estado
  // RESULTANTE lido do banco depois da escrita, e e esse campo que autoriza o
  // chamador a considerar o aceite gravado (e, no fluxo de signup, a apagar a flag
  // pendente). Backend anterior a este deploy ja devolvia `hasConsented: true`,
  // entao a checagem estrita funciona nos dois lados da janela de deploy.
  const json = (await res.json().catch(() => null)) as {
    hasConsented?: boolean;
  } | null;
  if (json?.hasConsented !== true) {
    throw consentError(
      res.status,
      "Consentimento enviado sem confirmação no corpo da resposta.",
    );
  }
}

// Identidade e prova vem do JWT no servidor. O client so envia os flags e o
// caminho pelo qual o aceite foi dado.
//
// O retry mora AQUI DENTRO, e nao no chamador, de proposito: guarda escrita no
// call site precisa ser repetida em cada um deles (hoje o flush pos-signup no
// AuthContext e o botao do ConsentGate) e some no primeiro chamador novo que
// alguem escrever sem lembrar. Dentro da funcao, os dois ficam cobertos por
// construcao, e qualquer terceiro que apareca ja nasce coberto.
//
// So retorna sem erro quando o servidor CONFIRMOU a gravacao. Quem chama pode
// tratar "resolveu" como "esta gravado", e e isso que sustenta a regra de so
// limpar `bnt_pending_consent` depois do 2xx confirmado.
export async function recordConsent(method: ConsentMethod): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      await attemptRecord(method);
      return;
    } catch (err) {
      const status = (err as { status?: number } | null)?.status ?? null;
      const delay = RECORD_RETRY_DELAYS_MS[attempt];
      if (delay === undefined || !isRetryableStatus(status)) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
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
