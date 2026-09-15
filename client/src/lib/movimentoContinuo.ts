/**
 * Movimento CONTINUO (pulso, brilho, blob que flutua) sob reduced motion.
 *
 * Decisao de produto: com `prefers-reduced-motion: reduce` nada se move. Tirar o
 * `animate` inteiro faria o elemento cair na opacidade padrao (1), e os fundos
 * borrados, que vivem entre 0.3 e 0.6, ficariam mais fortes que o desenho. Por
 * isso o loop PARA no primeiro quadro de cada chave: o elemento continua com a
 * cara que tem, so que parado.
 *
 * `reduzir` vem do `useReducedMotion()` do framer, que acompanha a mudanca ao
 * vivo da preferencia. `null` e "ainda nao sei" e conta como sem preferencia.
 */
type Quadros = Record<string, unknown>;

type PrimeiroQuadro<T extends Quadros> = {
  [K in keyof T]: T[K] extends readonly (infer U)[] ? U : T[K];
};

export function movimentoContinuo<T extends Quadros>(
  animate: T,
  reduzir: boolean | null,
): T | PrimeiroQuadro<T> {
  if (!reduzir) return animate;
  return Object.fromEntries(
    Object.entries(animate).map(([chave, valor]) => [
      chave,
      Array.isArray(valor) ? valor[0] : valor,
    ]),
  ) as PrimeiroQuadro<T>;
}
