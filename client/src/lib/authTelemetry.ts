import * as Sentry from "@sentry/react";
import posthog from "posthog-js";

import { detectInAppBrowser } from "./webview";

// Telemetria de FALHA de autenticacao. Nasceu do diagnostico de "um usuario nao
// conseguiu entrar com Google ontem, hoje deu": o caminho de retorno do OAuth nao
// tinha observabilidade nenhuma, entao tres falhas diferentes (troca PKCE lenta,
// verifier ausente, erro do provider na URL) terminavam todas no mesmo estado
// silencioso, e nenhuma deixava rastro. Sem esse dado, consertar o login e
// escolher entre hipoteses sem medir.
//
// Destinos: os DOIS que o projeto ja usa. Sentry para o evento individual
// (agrupamento e contexto) e PostHog para a agregacao (quantos, em qual app, com
// qual codigo). Nenhum endpoint novo.

// ─── Estagio da falha ────────────────────────────────────────────────────────
// A distincao que o log tem que preservar (item 1.4): "o provider recusou" e um
// problema de configuracao/credencial, "o perfil nao gravou" e um problema do
// nosso banco ou da nossa API, e os dois se apresentam ao usuario como a MESMA
// tela. Colapsar os dois num "auth falhou" devolveria o silencio que motivou o
// trabalho, uma camada acima.
export type AuthFailureStage =
  // O provider (ou a troca de code por sessao) falhou: erro na URL de callback,
  // erro retornado pelo signIn/signInWithOAuth.
  | "provider"
  // A troca PKCE nao resolveu dentro do limite e getSession() tambem nao achou
  // sessao. Nao afirma culpa: afirma que nao deu para confirmar.
  | "session_unconfirmed"
  // Ha sessao valida, o provider fez a parte dele, e a leitura/criacao do perfil
  // no nosso banco falhou (GET /api/me).
  | "profile";

export type AuthMethod = "oauth_redirect" | "email_password" | "email_signup";

export interface AuthFailureInput {
  stage: AuthFailureStage;
  method: AuthMethod;
  provider?: "google" | "email" | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  httpStatus?: number | null;
  // Tempo entre o inicio do desfecho observado (deteccao do callback, inicio da
  // requisicao de perfil) e a falha. E o numero que diz se o limite de tempo esta
  // no lugar certo, e continua sendo medido DEPOIS do conserto de proposito: sem
  // ele, "arrumamos" viraria afirmacao sem instrumento.
  elapsedMs?: number | null;
}

// ─── Redacao (item 1.5) ──────────────────────────────────────────────────────
// Nunca token, nunca senha, nunca code_verifier.
//
// A protecao primaria e ESTRUTURAL: o payload e montado campo por campo a partir
// de uma allowlist, e nenhum campo recebe a query string ou o hash da URL, que e
// exatamente onde `code`, `access_token` e `refresh_token` moram. Hostname e
// pathname sao extraidos separados, nunca a URL inteira.
//
// A redacao abaixo e a segunda camada, para o unico campo de texto livre que
// sobra (`errorMessage`, escrito pelo provider e nao por nos). Vale a regra da
// base: guarda DENTRO da funcao que monta o payload, nunca no call site, senao
// ela cobre so os call sites que alguem lembrou de proteger.
const REDACTED = "[redacted]";
const MAX_MESSAGE_LEN = 300;

const SENSITIVE_PATTERNS: RegExp[] = [
  // Par chave=valor com nome sensivel, em querystring, JSON ou texto corrido.
  // O `"?` depois do nome nao e decorativo: em JSON a chave vem entre aspas
  // (`"refresh_token":"..."`), entao a aspa de FECHAMENTO fica entre o nome e os
  // dois pontos. Sem ela o padrao nao casava JSON nenhum, e a redacao passava a
  // valer so para querystring. Caso coberto por teste.
  /\b(access_token|refresh_token|code_verifier|code_challenge|id_token|provider_token|password|senha|secret|api[_-]?key|authorization|bearer)\b"?\s*[=:]\s*"?[^\s&",;}]+/gi,
  // JWT solto (tres segmentos base64url separados por ponto).
  /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g,
];

export function redactSensitive(value: string): string {
  let out = value;
  for (const pattern of SENSITIVE_PATTERNS) {
    out = out.replace(pattern, REDACTED);
  }
  return out;
}

function safeText(text: string | null | undefined): string | null {
  if (!text) return null;
  return redactSensitive(String(text)).slice(0, MAX_MESSAGE_LEN);
}

// ─── Payload ─────────────────────────────────────────────────────────────────

export interface AuthFailurePayload {
  stage: AuthFailureStage;
  method: AuthMethod;
  provider: string | null;
  error_code: string | null;
  error_message: string | null;
  http_status: number | null;
  hostname: string | null;
  // Somente o pathname do callback. A query fica FORA: e onde vive o `code`.
  callback_path: string | null;
  is_webview: boolean;
  webview_app: string | null;
  user_agent: string | null;
  elapsed_ms: number | null;
}

export interface AuthFailureEnv {
  hostname: string | null;
  pathname: string | null;
  userAgent: string | null;
}

function currentEnv(): AuthFailureEnv {
  return {
    hostname: typeof window === "undefined" ? null : window.location.hostname,
    pathname: typeof window === "undefined" ? null : window.location.pathname,
    userAgent: typeof navigator === "undefined" ? null : navigator.userAgent,
  };
}

// Exportada para ser testavel sem subir Sentry nem PostHog, mesmo padrao de
// `amostrarPorOrigem` em lib/sentry.ts. `env` e injetavel pelo mesmo motivo:
// teste que le `window`/`navigator` global e teste que passa por acidente.
export function buildAuthFailurePayload(
  input: AuthFailureInput,
  env: AuthFailureEnv = currentEnv(),
): AuthFailurePayload {
  const webview = detectInAppBrowser(env.userAgent);

  return {
    stage: input.stage,
    method: input.method,
    provider: input.provider ?? null,
    error_code: safeText(input.errorCode),
    error_message: safeText(input.errorMessage),
    http_status: input.httpStatus ?? null,
    hostname: env.hostname,
    callback_path: env.pathname,
    is_webview: webview.isInApp,
    webview_app: webview.app,
    user_agent: env.userAgent ? redactSensitive(env.userAgent) : null,
    elapsed_ms: input.elapsedMs ?? null,
  };
}

// ─── Emissao ─────────────────────────────────────────────────────────────────

// Nome unico de evento no PostHog, com `stage` como propriedade. Um evento por
// estagio dificultaria o funil ("quantas falhas de auth no total" viraria soma
// manual de N eventos, e um estagio novo sumiria da conta em silencio).
const POSTHOG_EVENT = "auth_failure";

// Tag lida por `amostrarPorOrigem` (lib/sentry.ts) para NAO amostrar estes
// eventos. Falha de login e rara e cada ocorrencia e o dado: 0.25 significaria
// perder 3 de cada 4 relatos, que e exatamente o problema que estamos consertando.
export const SENTRY_ORIGEM_AUTH = "auth";

// ─── Diagnóstico (não é falha) ───────────────────────────────────────────────
// Eventos de TIMING do retorno do OAuth. Não são erro, e é por isso que não
// passam por `reportAuthFailure`: um "recuperou depois do limite" contado como
// falha poluiria o alerta e o número de falhas deixaria de significar o que diz.
export type AuthDiagnosticStage =
  // 1.6. O limite estourou E getSession() ACHOU sessão válida. É a assinatura
  // exata do bug antigo (o timer de 5s derrubando login saudável). Antes deste
  // evento, esse caso passava em silêncio: é ele que vai dizer se o problema (3)
  // morreu no Passo 1.
  | "session_recovered_after_timeout"
  // 1.7. Todo retorno de OAuth bem-sucedido. A distribuição responde, sem
  // depender de nenhuma falha acontecer, "que fração dos logins SAUDÁVEIS
  // passava de 5000ms?", que é o teste retroativo da hipótese 1, e diz se 20s
  // está generoso, apertado ou é irrelevante.
  | "oauth_return_succeeded"
  // 1.8. A espera passou do limiar de tranquilização. Também é sinal de latência
  // real, medido de propósito.
  | "oauth_return_slow";

export interface AuthDiagnosticInput {
  stage: AuthDiagnosticStage;
  method: AuthMethod;
  provider?: "google" | "email" | null;
  elapsedMs: number;
}

export interface AuthDiagnosticPayload {
  stage: AuthDiagnosticStage;
  method: AuthMethod;
  provider: string | null;
  hostname: string | null;
  is_webview: boolean;
  webview_app: string | null;
  elapsed_ms: number;
}

export function buildAuthDiagnosticPayload(
  input: AuthDiagnosticInput,
  env: AuthFailureEnv = currentEnv(),
): AuthDiagnosticPayload {
  const webview = detectInAppBrowser(env.userAgent);
  return {
    stage: input.stage,
    method: input.method,
    provider: input.provider ?? null,
    hostname: env.hostname,
    is_webview: webview.isInApp,
    webview_app: webview.app,
    elapsed_ms: input.elapsedMs,
  };
}

const POSTHOG_DIAGNOSTIC_EVENT = "auth_timing";

/**
 * PostHog SÓ, sem Sentry, e isso é decisão e não esquecimento.
 *
 * Estes eventos valem em AGREGADO (é uma distribuição de tempos) e `oauth_return_
 * succeeded` dispara em TODO login bem-sucedido. Mandar isso para o Sentry é
 * exatamente o que a política escrita em lib/sentry.ts manda não fazer: o Sentry
 * ali é stream de ERRO, com cota, e o próprio arquivo já registra o caso dos
 * diagnósticos do contador da home como o motivo da amostragem existir. Volume
 * agregável vai para a ferramenta de agregação.
 *
 * Sem `user_agent` de propósito: 1.7 pede baixa cardinalidade e agregabilidade, e
 * UA cru como dimensão inviabiliza as duas coisas. O que interessa do dispositivo
 * (é webview, qual app) já está em campo próprio e fechado.
 */
export function reportAuthDiagnostic(
  input: AuthDiagnosticInput,
): AuthDiagnosticPayload {
  const payload = buildAuthDiagnosticPayload(input);
  console.info(`[auth] ${payload.stage}`, payload);
  try {
    posthog.capture(POSTHOG_DIAGNOSTIC_EVENT, payload);
  } catch {
    // Telemetria nunca quebra o fluxo de auth.
  }
  return payload;
}

// Extrai code/message/status de um erro do supabase-js sem depender de instanceof
// (o erro pode chegar embrulhado) e sem parsear a mensagem. `AuthError` traz `code`
// e `status`; erro de rede traz nenhum dos dois, e nesse caso o code fica null em
// vez de virar uma string inventada.
export function authErrorFields(error: unknown): {
  code: string | null;
  message: string | null;
  status: number | null;
} {
  if (!error || typeof error !== "object") {
    return {
      code: null,
      message: typeof error === "string" ? error : null,
      status: null,
    };
  }
  const candidate = error as {
    code?: unknown;
    message?: unknown;
    status?: unknown;
  };
  return {
    code: typeof candidate.code === "string" ? candidate.code : null,
    message: typeof candidate.message === "string" ? candidate.message : null,
    status: typeof candidate.status === "number" ? candidate.status : null,
  };
}

/**
 * Códigos que são COMPORTAMENTO NORMAL do produto, não defeito.
 *
 * Senha errada e e-mail já cadastrado são o sistema funcionando: a pessoa errou
 * a senha, ou já tinha conta. Chegavam ao Sentry como `level: "error"` e somavam
 * 19 dos 10 grupos de erro em 24h, empurrando para baixo os dois que são falha
 * de verdade (`profile_fetch_exhausted`, `bad_oauth_state`).
 *
 * REBAIXA em vez de PARAR DE CAPTURAR, e o motivo é que o volume destes carrega
 * sinal que não existe em lugar nenhum: um pico de `invalid_credentials` é a
 * assinatura de credential stuffing, e um pico de `user_already_exists` é gente
 * batendo num cadastro que deveria ter virado login. Parar de capturar apagaria
 * os dois. `info` tira do stream de erro e mantém a série.
 *
 * O PostHog continua recebendo tudo em `auth_failure`, sem mudança: lá o evento
 * é agregação, não triagem, e o `stage`/`error_code` seguem como propriedade.
 *
 * `otp_expired` e `access_denied` entraram depois, e a demora é a lição: os dois
 * atendem o mesmo critério do parágrafo de cima desde sempre (link vencido e
 * pessoa que fechou a tela do Google são o produto funcionando), mas a lista é
 * mantida à mão e ficou para trás do conjunto que ela deveria descrever. O
 * `otp_expired` só apareceu porque abriu uma issue nova no Sentry com
 * `level: error`; o `access_denied` estava lá desde o início e ninguém viu.
 *
 * `bad_oauth_state` fica de FORA de propósito, e não por esquecimento: o
 * parágrafo acima o nomeia como falha de verdade. Ter copy em
 * `authCallbackMessages.ts` significa que a interface trata o caso, não que o
 * caso seja normal. É por isso que a lista NÃO pode ser derivada daquele
 * arquivo, e é por isso que `authTelemetry.codigosEsperados.test.ts` compara os
 * dois conjuntos e trava a diferença: quem sobra precisa estar declarado lá,
 * com motivo, e um código novo com copy derruba o teste até alguém decidir.
 */
const CODIGOS_ESPERADOS_LISTA = [
  "invalid_credentials",
  "user_already_exists",
  "otp_expired",
  "access_denied",
];
const CODIGOS_ESPERADOS = new Set(CODIGOS_ESPERADOS_LISTA);

/**
 * Só para o teste que trava a lista contra a copy. Não use em runtime.
 *
 * Exposto como ARRAY e não como `ReadonlySet` porque o `target` do
 * `tsconfig.json` não tem `downlevelIteration`, e iterar `Set` no teste quebra
 * o `pnpm check` (que, por não cobrir `*.test.ts`, só acusa quando o hook roda).
 */
export const CODIGOS_ESPERADOS_PARA_TESTE: readonly string[] =
  CODIGOS_ESPERADOS_LISTA;

/** Nível do evento no Sentry. Fora da allowlist, continua `error`. */
export function nivelSentry(errorCode: string | null): "error" | "info" {
  return errorCode !== null && CODIGOS_ESPERADOS.has(errorCode) ? "info" : "error";
}

export function reportAuthFailure(input: AuthFailureInput): AuthFailurePayload {
  const payload = buildAuthFailurePayload(input);

  // Console primeiro: e o unico destino que funciona em dev e em build sem DSN.
  console.error(`[auth] falha em ${payload.stage}`, payload);

  try {
    posthog.capture(POSTHOG_EVENT, payload);
  } catch {
    // Telemetria nunca quebra o fluxo de auth. Mesma politica do consentService.
  }

  try {
    Sentry.captureMessage(
      `auth ${payload.stage} failure: ${payload.error_code ?? "unknown"}`,
      {
        level: nivelSentry(payload.error_code),
        tags: {
          origem: SENTRY_ORIGEM_AUTH,
          auth_stage: payload.stage,
          auth_method: payload.method,
          auth_provider: payload.provider ?? "none",
          auth_is_webview: String(payload.is_webview),
        },
        extra: { ...payload },
      },
    );
  } catch {
    // idem.
  }

  return payload;
}
