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

/**
 * Categoria estrutural da falha. Uniao FECHADA, mesmo idioma do campo `tipo` do
 * contador da home: e ela que separa desfechos que o `http_status` sozinho nao
 * separa.
 *
 * `http` e `invalid_body` sao declarados na origem (`profileService`), porque
 * quem lanca e quem sabe. `network` e a AUSENCIA de declaracao somada a um erro
 * que o item BUG-38 classificou como rede: se nao passou pelo nosso
 * `profileError`, nao houve resposta para inspecionar.
 */
export type AuthErrorKind = "http" | "invalid_body" | "network" | "unknown";

const AUTH_ERROR_KINDS = new Set<string>([
  "http",
  "invalid_body",
  "network",
  "unknown",
]);

export interface AuthFailureInput {
  stage: AuthFailureStage;
  method: AuthMethod;
  provider?: "google" | "email" | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  errorKind?: string | null;
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
  error_kind: string | null;
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
    error_kind: input.errorKind ?? null,
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

// ─── Codigo de fallback (BUG-38) ─────────────────────────────────────────────
// Sem code, o evento saia como "auth <stage> failure: unknown", e "unknown" nao
// e diagnostico: e um balde onde cabem rede, HTTP e defeito de codigo, todos
// somados numa issue que nao se investiga porque nao afirma nada.
//
// As regras abaixo derivam um codigo de CAMPO (`status`, `name`), nunca da
// mensagem. As tres engines escrevem a MESMA falha de rede com tres frases
// distintas, e foi assim que um bug do contador da home virou tres issues
// (BUG-29/39/57); `name` e o que nao muda entre elas.
//
// O LIMITE E CARDINALIDADE. Codigo vira nome de issue: um codigo derivado de
// texto livre trocaria um balde cego por mil baldes de um evento cada, que e
// pior. Dai a faixa fechada no status e o charset/comprimento fechados no nome.
const HTTP_STATUS_MIN = 100;
const HTTP_STATUS_MAX = 599;
const MAX_CODE_LEN = 40;

// `name` que nao acrescenta nada ao "unknown" que ja existia. `Error` e o
// default de qualquer `new Error()`, entao classificar por ele seria trocar o
// nome do balde, nao dividi-lo.
const NOMES_SEM_INFORMACAO = new Set(["error", "object"]);

function normalizarNomeDeErro(name: string): string | null {
  const slug = name
    // camelCase -> snake_case ANTES do lowercase, senao "AbortError" viraria
    // "aborterror" e o codigo ficaria ilegivel no painel.
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, MAX_CODE_LEN)
    .replace(/^_+|_+$/g, "");

  if (!slug || NOMES_SEM_INFORMACAO.has(slug)) return null;
  return slug;
}

function codigoDeFallback(
  status: number | null,
  name: string | null,
): string | null {
  // Status primeiro: quando existe, e a informacao mais especifica que ha.
  if (
    status !== null &&
    Number.isInteger(status) &&
    status >= HTTP_STATUS_MIN &&
    status <= HTTP_STATUS_MAX
  ) {
    return `http_${status}`;
  }

  // `fetch` rejeita com TypeError quando a requisicao nem sai (rede, CORS,
  // ad-block) - e comportamento de especificacao, igual nas tres engines. A
  // interpretacao "rede" carrega um falso positivo conhecido: um TypeError de
  // defeito de codigo dentro do supabase-js cairia aqui com o mesmo rotulo.
  // Quem abrir o evento separa os dois pelo `error_message` do extra; o que nao
  // da para fazer e adivinhar isso pelo texto, que e o que muda por engine.
  if (name === "TypeError") return "network_error";

  return name === null ? null : normalizarNomeDeErro(name);
}

// Extrai code/message/status de um erro do supabase-js sem depender de instanceof
// (o erro pode chegar embrulhado) e sem parsear a mensagem. `AuthError` traz `code`
// e `status`; erro de rede traz nenhum dos dois, e nesse caso o code e DERIVADO
// por `codigoDeFallback`, que devolve null quando nada e classificavel (a
// mensagem do evento segue renderizando "unknown" nesse caso).
//
// `code` explicito tem PRECEDENCIA sobre tudo, e isso e o que garante que nenhum
// evento que ja tinha codigo mude de mensagem, logo de issue: as series de
// `profile_fetch_exhausted` e `bad_oauth_state` em medicao nao podem se partir.
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
    name?: unknown;
  };
  const status = typeof candidate.status === "number" ? candidate.status : null;
  const name = typeof candidate.name === "string" ? candidate.name : null;

  return {
    code:
      typeof candidate.code === "string"
        ? candidate.code
        : codigoDeFallback(status, name),
    message: typeof candidate.message === "string" ? candidate.message : null,
    status,
  };
}

/**
 * Categoria estrutural de um erro, para a tag `auth_error_kind`.
 *
 * A ordem das regras e a decisao. Primeiro o que a ORIGEM declarou, porque quem
 * lanca e quem sabe o que aconteceu; depois o que da para derivar de campo. A
 * mensagem nao entra em nenhuma delas: a copy do `profileService` pode ser
 * editada por qualquer motivo, e um classificador que dependa dela passa a
 * mentir sem quebrar nada.
 *
 * A ausencia de declaracao com codigo de rede e a regra que faz o item valer:
 * um erro que nao passou pelo `profileError` nao teve resposta HTTP para
 * inspecionar, entao "sem marcador" mais "TypeError" e rede, e nao um terceiro
 * caso desconhecido.
 */
export function authErrorKindOf(error: unknown): AuthErrorKind {
  const declarado = (error as { authErrorKind?: unknown } | null | undefined)
    ?.authErrorKind;
  // Uniao fechada tambem NA ENTRADA: o marcador vem de um objeto de erro, e
  // objeto de erro aceita qualquer coisa. Valor de fora vira "unknown" em vez de
  // virar uma tag nova.
  if (typeof declarado === "string" && AUTH_ERROR_KINDS.has(declarado)) {
    return declarado as AuthErrorKind;
  }

  const { code, status } = authErrorFields(error);
  if (status !== null) return "http";
  if (code === "network_error") return "network";
  return "unknown";
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
 *
 * `flow_state_already_used` e o unico da lista SEM copy, e isso e consequencia,
 * nao esquecimento: o codigo so existe depois de um flow state ter sido usado
 * com SUCESSO. E o segundo exchange do mesmo `code` (voltar, recarregar, efeito
 * duplo), entao o primeiro ja concluiu o login e ha sessao; e com sessao o
 * `AuthContext` nao monta aviso nenhum (`AuthContext.tsx:478`). Nao ha tela para
 * escrever copy. Por isso o teste que trava a lista contra a copy segue valendo
 * sem mudanca: a relacao que ele afirma e copy -> esperado, nunca o inverso.
 */
const CODIGOS_ESPERADOS_LISTA = [
  "invalid_credentials",
  "user_already_exists",
  "otp_expired",
  "access_denied",
  "flow_state_already_used",
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

/**
 * Tags do evento de auth. Exportada para ser testavel sem subir Sentry nem
 * PostHog, mesmo padrao de `buildAuthFailurePayload` e de `amostrarPorOrigem`.
 *
 * `http_status` e `hostname` entraram porque `extra` NAO e agregavel: o painel
 * do Sentry nao filtra nem quebra a contagem por ele. Com 200 eventos de
 * `profile_fetch_exhausted` e 109 de `bad_oauth_state`, a pergunta que decide o
 * conserto ("quantos sao 5xx, quantos 401, quantos rede?", "quantos vieram de
 * www e quantos do apex?") nao se responde com `extra`. Ele FICA de qualquer
 * jeito: tag serve para agregar, extra para ler o caso individual.
 *
 * O `?? "none"` e a parte que nao pode ser esquecida. Tag `undefined` some do
 * evento e tag vazia agrupa como se fosse valor; nos dois casos o denominador
 * some em silencio, e "150 dos 200 tem status" nao diz o que houve com os
 * outros 50. "none" e explicito, contavel e visivel.
 *
 * NAO altera agrupamento. O fingerprint default do Sentry para `captureMessage`
 * vem da MENSAGEM (e do stack), e a mensagem segue identica; tag nao entra no
 * fingerprint default. As issues existentes continuam as mesmas, com dimensao
 * nova para quebrar a contagem.
 */
export function sentryTagsDeAuth(
  payload: AuthFailurePayload,
): Record<string, string> {
  return {
    origem: SENTRY_ORIGEM_AUTH,
    auth_stage: payload.stage,
    auth_method: payload.method,
    auth_provider: payload.provider ?? "none",
    auth_is_webview: String(payload.is_webview),
    http_status:
      payload.http_status === null ? "none" : String(payload.http_status),
    hostname: payload.hostname ?? "none",
    // Refinamento do "none" acima. Com 200 eventos de `profile_fetch_exhausted`
    // caindo quase todos em `http_status: "none"`, a tag anterior diz que nao
    // houve status e para por ai; esta diz POR QUE nao houve, que e a pergunta
    // seguinte: 200 com corpo invalido e problema nosso, rede e problema do
    // caminho ate nos, e os dois estavam somados no mesmo balde.
    //
    // O fechamento da uniao mora AQUI DENTRO, e nao no chamador, pelo mesmo
    // motivo do `?? "none"`: guarda no call site cobre so os call sites que
    // alguem lembrou. Kind desconhecido vira "unknown", nunca tag nova.
    auth_error_kind:
      payload.error_kind !== null && AUTH_ERROR_KINDS.has(payload.error_kind)
        ? payload.error_kind
        : "unknown",
  };
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
        tags: sentryTagsDeAuth(payload),
        extra: { ...payload },
      },
    );
  } catch {
    // idem.
  }

  return payload;
}
