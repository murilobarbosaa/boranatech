// Critério de AMOSTRA PEQUENA, em um lugar só.
//
// Nasceu na aba Conversão (`client/src/components/admin/ConversionDashboard.tsx`)
// e vive aqui porque o funil da Visão precisa do MESMO critério. Duas telas do
// mesmo painel discordando sobre quando uma taxa é confiável seria a mesma
// classe de defeito que os "62 vs 63" custaram três commits para corrigir.
//
// Não é estatística formal: é um piso pragmático abaixo do qual a taxa vira
// ruído de arredondamento (1 de 2 vira "50%"). Mudar o número é decisão de
// produto, feita aqui, uma vez.

export const SMALL_SAMPLE_THRESHOLD = 20;

export type TaxaComAmostra = {
  /** Percentual 0..100. `null` quando o denominador é 0: ausência, não 0%. */
  rate: number | null;
  /** Denominador abaixo do limiar: a taxa existe mas é pouco confiável. */
  small: boolean;
};

export function rateOf(numerator: number, denominator: number): TaxaComAmostra {
  if (denominator <= 0) return { rate: null, small: true };
  return {
    rate: (numerator / denominator) * 100,
    small: denominator < SMALL_SAMPLE_THRESHOLD,
  };
}
