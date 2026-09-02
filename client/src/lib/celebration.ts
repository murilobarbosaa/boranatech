/**
 * QUANDO SOLTAR O CONFETE.
 *
 * Tres condicoes, e extrair vale a pena porque as tres falham em silencio: um
 * disparo repetido nao quebra nada visivelmente (so fica estranho), um confete
 * que ignora `prefers-reduced-motion` e um problema de acessibilidade que quem
 * escreve o codigo normalmente nao ve, e um disparo que nunca acontece parece
 * "o efeito nao funciona nesta maquina". Nenhuma das tres aparece em teste
 * manual confiavel.
 *
 * A funcao NAO marca nada: quem chama e dono do `alreadyFired`. Manter a
 * marcacao fora daqui e o que deixa a decisao pura e testavel sem relogio nem
 * estado global.
 */
export function shouldFireCelebration(input: {
  /** A transicao que merece a festa ja aconteceu. */
  isSuccess: boolean;
  /** `prefers-reduced-motion` do usuario. */
  reducedMotion: boolean;
  /** Ja disparou nesta montagem. */
  alreadyFired: boolean;
}): boolean {
  if (!input.isSuccess) return false;
  // Acessibilidade vence a celebracao, sempre. Quem pediu menos movimento pediu
  // menos movimento inclusive no momento mais feliz do funil.
  if (input.reducedMotion) return false;
  return !input.alreadyFired;
}
