// ABAS DA PAGINA /creator (lote 08b). Mesma forma de CREATOR_DASHBOARD_JANELAS
// em shared/creatorDashboard.ts: lista `as const`, tipo derivado dela e um
// guard. A aba vive na URL (`?aba=`), entao o valor que chega e texto de fora e
// precisa ser conferido antes de virar estado.
//
// Fica em client/ e nao em shared/: o servidor nao sabe de aba nenhuma.
//
// Lote 09: entra `ranking`, entre comunidade e perfil. A ordem desta lista e a
// ordem dos botoes na tela, entao mexer aqui move a faixa.
//
// Lote 10d: `comunidade` virou `calendario`, no rotulo e no slug da URL. O
// slug antigo continua aceito como APELIDO (`normalizarAba`), porque as
// notificacoes e os e-mails ja enviados apontam para `?aba=comunidade`, e um
// link que a pessoa recebeu ontem nao pode cair em Numeros hoje.

export const CREATOR_ABAS = [
  "numeros",
  "calendario",
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

/** Slugs antigos que ainda chegam pela URL, e a aba de hoje para cada um. */
const APELIDO_DA_ABA: Record<string, CreatorAba | undefined> = {
  comunidade: "calendario",
};

/**
 * A aba que um `?aba=` pede: o slug atual, um apelido antigo, ou null para o
 * que nao e aba nenhuma (quem chama cai na padrao).
 */
export function normalizarAba(valor: unknown): CreatorAba | null {
  if (isCreatorAba(valor)) return valor;
  if (typeof valor === "string") return APELIDO_DA_ABA[valor] ?? null;
  return null;
}

/** Id do botao da aba, para o `aria-labelledby` do painel. */
export function idDaAba(aba: CreatorAba): string {
  return `creator-aba-${aba}`;
}

/** Id do painel, para o `aria-controls` do botao. */
export function idDoPainel(aba: CreatorAba): string {
  return `creator-painel-${aba}`;
}
