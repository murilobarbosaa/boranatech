// Tipo da concessao de creator, no formato que os avisos "continua Pro" dos
// dialogos de cancelar, reembolsar e revogar precisam.
//
// A concessao (influencer ou afiliado) e um ramo de Pro independente da
// assinatura: cancelar ou devolver a assinatura NAO tira o Pro de quem tem
// concessao. Os avisos existem para o admin nao agir achando que tirou.

export type ConcessaoDeCreator = "influencer" | "afiliado";

/**
 * Tipo da concessao a partir do `pro_source` do detalhe (a MESMA funcao do
 * servidor que alimenta a lista e o selo). `both` e `both_afiliado` sao
 * assinatura mais concessao; `subscription` e ausencia nao tem concessao.
 */
export function concessaoDoProSource(
  proSource: string | null | undefined,
): ConcessaoDeCreator | null {
  if (proSource === "influencer" || proSource === "both") return "influencer";
  if (proSource === "afiliado" || proSource === "both_afiliado") {
    return "afiliado";
  }
  return null;
}

// TODO(Ana)
const NOME_DA_CONCESSAO: Record<string, string> = {
  influencer: "influencer",
  afiliado: "afiliado",
};

/**
 * Nome do tipo DENTRO de uma frase ("pela concessao de afiliado").
 *
 * Desconhecido ou ausente vira "creator", nunca um tipo inventado: o sinal do
 * servidor (`still_pro_via_influencer`) diz que ha concessao, mas nao qual, e
 * chamar de "influencer" quem e afiliado seria a frase errada com cara de
 * certa.
 */
export function nomeDaConcessao(kind: string | null | undefined): string {
  // TODO(Ana)
  return (kind ? NOME_DA_CONCESSAO[kind] : undefined) ?? "creator";
}
