// Chaves da URL da aba Creators, a fonte unica: CreatorsSection le e escreve
// estas chaves, e limparChavesDeSecao (tasks/taskViewState.ts) as apaga ao
// trocar de aba. Duas copias divergiriam na primeira chave nova, e a chave
// nova vazaria para as outras abas sem nada quebrar.

export const CHAVES_DA_URL_DE_CREATORS = {
  status: "status",
  kind: "kind",
  creator: "creator",
} as const;

export const CHAVES_DA_ABA_CREATORS = [
  CHAVES_DA_URL_DE_CREATORS.status,
  CHAVES_DA_URL_DE_CREATORS.kind,
  CHAVES_DA_URL_DE_CREATORS.creator,
] as const;
