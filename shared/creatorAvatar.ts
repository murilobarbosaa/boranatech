// AVATAR DE UM CREATOR VISTO POR OUTRA PESSOA (lote 11b).
//
// Ate o lote 11 o calendario, o ranking e o admin liam so `avatar_url` e
// desenhavam foto quando havia url e iniciais quando nao havia. O cabecalho do
// site desenha o proprio avatar com MAIS coisa: o modo (icone ou foto), o
// icone escolhido, a cor de fundo e a borda, e a foto so aparece quando o dono
// e Pro, escolheu foto e a foto passou na moderacao. Por isso a configuracao
// que a pessoa fez no perfil nao aparecia no ranking.
//
// Este e o formato que o servidor manda de cada creator, ja RESOLVIDO pela
// mesma regra do site (`server/lib/avatarResolver.ts`, a do
// `POST /api/avatars/resolve`): o client so desenha, nao decide. `avatar_url`
// aqui ja e nulo quando a foto nao pode aparecer.

export type AvatarDeCreator = {
  mode: "icon" | "photo";
  avatar_url: string | null;
  /** Ids do catalogo de client/src/constants/avatarOptions.ts; nulo cai no padrao. */
  icon: string | null;
  bg: string | null;
  border: string | null;
};

/** Quem nao tem perfil: iniciais nas cores padrao, como o site faz. */
export const AVATAR_PADRAO: AvatarDeCreator = {
  mode: "icon",
  avatar_url: null,
  icon: null,
  bg: null,
  border: null,
};
