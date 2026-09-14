/**
 * Super property `reduced_motion` do PostHog: a preferencia de sistema
 * `prefers-reduced-motion: reduce`, lida no boot e enviada em todo evento. Com
 * ela os funis separam quem ve a home parada (ver lib/movimentoContinuo.ts e
 * lib/entradaEstatica.ts) de quem ve a home animada.
 *
 * Sem `matchMedia`, ou com ele lancando, a preferencia e desconhecida, e nada e
 * registrado. Registrar `false` nesse caso seria um valor plausivel e
 * indistinguivel de "sem preferencia", e a property ausente diz a verdade.
 *
 * Recebe o cliente em vez de importar `posthog-js`: e so `register` que importa,
 * e o teste passa um cliente falso sem carregar a lib.
 */
type ClienteComRegister = {
  register: (propriedades: Record<string, boolean>) => void;
};

export function registrarPreferenciaDeMovimento(
  cliente: ClienteComRegister,
): void {
  let reduz: boolean;
  try {
    if (typeof window.matchMedia !== "function") return;
    reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return;
  }
  cliente.register({ reduced_motion: reduz });
}
