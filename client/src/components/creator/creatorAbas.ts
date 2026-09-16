// ABAS DA PAGINA /creator (lote 08b). Mesma forma de CREATOR_DASHBOARD_JANELAS
// em shared/creatorDashboard.ts: lista `as const`, tipo derivado dela e um
// guard. A aba vive na URL (`?aba=`), entao o valor que chega e texto de fora e
// precisa ser conferido antes de virar estado.
//
// Fica em client/ e nao em shared/: o servidor nao sabe de aba nenhuma.
//
// Lote 09: entra `ranking`, entre comunidade e perfil. A ordem desta lista e a
// ordem dos botoes na tela, entao mexer aqui move a faixa.

export const CREATOR_ABAS = [
  "numeros",
  "comunidade",
  "ranking",
  "perfil",
] as const;
export type CreatorAba = (typeof CREATOR_ABAS)[number];

/** Aba de quem chega em /creator sem parametro. Nao escreve nada na URL. */
export const CREATOR_ABA_PADRAO: CreatorAba = "numeros";

export function isCreatorAba(valor: unknown): valor is CreatorAba {
  return (
    typeof valor === "string" &&
    (CREATOR_ABAS as readonly string[]).includes(valor)
  );
}

/** Id do botao da aba, para o `aria-labelledby` do painel. */
export function idDaAba(aba: CreatorAba): string {
  return `creator-aba-${aba}`;
}

/** Id do painel, para o `aria-controls` do botao. */
export function idDoPainel(aba: CreatorAba): string {
  return `creator-painel-${aba}`;
}
