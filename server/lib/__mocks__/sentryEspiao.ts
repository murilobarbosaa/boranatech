/**
 * Espião do `@sentry/node` para teste.
 *
 * Existe porque ESM não deixa `vi.spyOn` num namespace de módulo: a única forma
 * de observar `captureMessage` é substituir o módulo inteiro. O resto da API
 * vira no-op, que é o que o Sentry já faz sem DSN.
 */
export const capturados: { msg: string; opts: unknown }[] = [];

export function espiao() {
  return {
    captureMessage: (msg: string, opts: unknown) => {
      capturados.push({ msg, opts });
      return "id-de-teste";
    },
    captureException: () => "id-de-teste",
    init: () => undefined,
    setupExpressErrorHandler: () => undefined,
    expressIntegration: () => ({}),
  };
}
