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
const ERROR_SAMPLE_RATE = 0.25;

/** Tag posta por `ErrorBoundary.componentDidCatch`. Estes vao 100%. */
const ORIGEM_NAO_AMOSTRADA = "error-boundary";

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
  if (event.tags?.origem === ORIGEM_NAO_AMOSTRADA) return event;
  return sortear() < ERROR_SAMPLE_RATE ? event : null;
}
