/**
 * Espião do `@sentry/react` para teste, irmão do `server/lib/__mocks__/sentryEspiao.ts`.
 *
 * Existe pelo mesmo motivo: ESM não deixa `vi.spyOn` num namespace de módulo, e
 * a única forma de observar `captureException` é substituir o módulo inteiro.
 */
export interface CapturaClient {
  error: unknown;
  opts: { extra?: Record<string, unknown>; tags?: Record<string, unknown> };
}

export const capturados: CapturaClient[] = [];

export const EVENT_ID_DE_TESTE = "abcdef1234567890abcdef1234567890";

export function espiaoClient() {
  return {
    captureException: (error: unknown, opts: CapturaClient["opts"] = {}) => {
      capturados.push({ error, opts });
      return EVENT_ID_DE_TESTE;
    },
    captureMessage: () => EVENT_ID_DE_TESTE,
    init: () => undefined,
  };
}
