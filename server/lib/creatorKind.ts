// Tipos de concessao de Creator: `public.creators.kind`, restrito pelo CHECK
// da migration 20260913120000_creators_and_creator_events.sql. Os dois concedem
// Pro do mesmo jeito (is_user_pro nao olha o kind); o kind decide rotulo e, nos
// lotes seguintes, o painel.
export const CREATOR_KINDS = ["influencer", "afiliado"] as const;
export type CreatorKind = (typeof CREATOR_KINDS)[number];

export function isCreatorKind(valor: unknown): valor is CreatorKind {
  return valor === "influencer" || valor === "afiliado";
}

/**
 * LANCA em kind desconhecido, em vez de cair num rotulo padrao.
 *
 * O kind aqui e a informacao, nao enfeite: devolver "influencer" para um valor
 * que o banco passou a aceitar e este codigo nao conhece rotularia a pessoa
 * errado de um jeito indistinguivel do certo. O CHECK do banco torna o caso
 * impossivel hoje; se um kind novo entrar no banco antes do codigo, o erro
 * aparece na rota (que roda dentro de try) em vez de virar dado plausivel.
 */
export function creatorKindOf(valor: unknown): CreatorKind {
  if (isCreatorKind(valor)) return valor;
  throw new Error(`kind de creator desconhecido: ${JSON.stringify(valor)}`);
}
