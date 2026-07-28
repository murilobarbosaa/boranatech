import * as Sentry from "@sentry/react";

// Sentry do browser (client bundle). Espelha a politica do server/lib/sentry.ts:
// so inicializa quando o DSN esta presente; ausente vira no-op total (sem
// captura), pra dev/preview e pra qualquer build sem a env configurada.
//
// DSN: publico por natureza (vai no bundle, o browser precisa dele pra enviar
// evento), por isso pode ir com prefixo VITE_. Use um DSN de projeto SEPARADO
// do backend (VITE_SENTRY_DSN != SENTRY_DSN) pra nao misturar erros de browser
// com erros de server nem somar cota entre os dois.
//
// Escopo enxuto: sem session replay e sem tracing (tracesSampleRate ausente
// desliga o browser tracing), pra nao estourar cota. sampleRate conservador no
// stream de erros: o browser gera muito ruido de extensao/terceiros, e os
// eventos de diagnostico do contador (stats/users-count) valem em AGREGADO, uma
// amostra ja revela a distribuicao (429 vs HTML vs count nulo) por dispositivo.

// Fracao dos eventos de erro efetivamente enviados. Conservador de proposito.
//
// NAO se aplica a tudo. Amostrar ruido de extensao de browser faz sentido;
// amostrar TELA QUEBRADA nao, porque 0.25 significa que 3 de cada 4 usuarios
// que viram a pagina cair ficam invisiveis, e a raridade do evento e justamente
// o que torna cada ocorrencia valiosa. O corte por tipo mora no `beforeSend`
// abaixo, e nao no `sampleRate` do init, porque o `sampleRate` do SDK e cego ao
// conteudo do evento: ele decide antes de existir tag para ler.
//
// REAVALIADA em 2026-07-28, depois de os Inbound Filters do Sentry passarem a
// descartar extensao e crawler na origem. A amostragem NAO virou redundante,
// mas o caso que a justifica mudou: nao e mais ruido de extensao (o filtro
// pegou isso, e sem consumir cota), e sim os diagnosticos instrumentados do
// contador da home (`Hero.tsx:500,502`, tag `route=stats/users-count`), que sao
// eventos NOSSOS, o filtro nao toca, disparam por carga de pagina e valem em
// agregado: 25% ja revela a distribuicao (429 vs HTML vs count nulo).
const ERROR_SAMPLE_RATE = 0.25;

/**
 * Origens que vao 100%, sem amostragem.
 *
 * - `error-boundary`: tag posta por `ErrorBoundary.componentDidCatch`.
 * - `auth`: tag posta por `reportAuthFailure` (lib/authTelemetry.ts). Entrou pelo
 *   mesmo argumento que ja justificava a excecao do error-boundary, escrito no
 *   bloco de ERROR_SAMPLE_RATE: amostrar faz sentido para evento que vale em
 *   AGREGADO e dispara por carga de pagina, e nao para evento RARO em que cada
 *   ocorrencia e o dado. Falha de login e do segundo tipo. Com 0.25, de cada 4
 *   pessoas que nao conseguiram entrar 3 ficariam invisiveis, que e literalmente
 *   o problema que a instrumentacao existe para resolver.
 */
const ORIGENS_NAO_AMOSTRADAS = new Set(["error-boundary", "auth"]);

/**
 * PII EM BREADCRUMB: o vetor que os scrubbers do Sentry NAO cobrem.
 *
 * Os scrubbers casam por NOME de campo (`password`, `token`, `secret`). O texto
 * do PDF do LinkedIn nao tem nome nenhum: e uma string de milhares de
 * caracteres com telefone, e-mail e historico profissional, que vive no estado
 * do React e no `sessionStorage`. Estado do React e `sessionStorage` NAO entram
 * em evento do Sentry; o que entra, e por onde esse texto vazaria, e breadcrumb
 * de `console`, porque qualquer `console.log` de depuracao com o perfil dentro
 * vira anexo do proximo erro capturado, para sempre.
 *
 * Decisao: descartar breadcrumb de console INTEIRO, em vez de tentar limpar.
 * Filtrar por conteudo exigiria adivinhar o formato do que e sensivel, que e o
 * mesmo erro dos scrubbers por nome de campo, uma camada abaixo. E o valor de
 * diagnostico do console e baixo comparado ao risco: o stack e o
 * `componentStack` ja dizem onde quebrou.
 *
 * De `fetch`/`xhr` sobra so metodo, caminho e status. A query string sai porque
 * e onde um id ou e-mail apareceria sem ninguem ter decidido isso.
 */
export function limparBreadcrumb<
  T extends { category?: string; data?: Record<string, unknown> },
>(crumb: T): T | null {
  if (crumb.category === "console") return null;

  if (crumb.category === "fetch" || crumb.category === "xhr") {
    const { url, method, status_code } = (crumb.data ?? {}) as {
      url?: unknown;
      method?: unknown;
      status_code?: unknown;
    };
    return {
      ...crumb,
      data: {
        ...(typeof method === "string" ? { method } : {}),
        ...(typeof url === "string" ? { url: semQueryString(url) } : {}),
        ...(status_code === undefined ? {} : { status_code }),
      },
    };
  }

  return crumb;
}

/** Corta query e fragmento. Entrada nao-URL volta cortada na primeira `?`. */
function semQueryString(url: string): string {
  return url.split("?")[0].split("#")[0];
}

export function initClientSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // release opcional: so quando o build injeta VITE_SENTRY_RELEASE (ex.: SHA
    // do commit). Ausente, o Sentry agrupa sem versao, sem quebrar nada.
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    // 1 de proposito: a amostragem real acontece no `beforeSend`, que enxerga
    // as tags. Ver ERROR_SAMPLE_RATE.
    sampleRate: 1,
    beforeSend: amostrarPorOrigem,
    beforeBreadcrumb: limparBreadcrumb,
    // false ja era o valor, e fica explicito: sem ele o SDK anexa IP e headers
    // da requisicao. Espelha `server/lib/sentry.ts`.
    sendDefaultPii: false,
  });
}

/**
 * Amostragem por tipo de evento. Exportada para ser testavel sem subir o SDK.
 *
 * `sortear` e injetavel pelo mesmo motivo: um teste que chama `Math.random`
 * de verdade e um teste que passa as vezes.
 */
export function amostrarPorOrigem<T extends { tags?: Record<string, unknown> }>(
  event: T,
  _hint?: unknown,
  sortear: () => number = Math.random,
): T | null {
  if (ORIGENS_NAO_AMOSTRADAS.has(String(event.tags?.origem))) return event;
  return sortear() < ERROR_SAMPLE_RATE ? event : null;
}
