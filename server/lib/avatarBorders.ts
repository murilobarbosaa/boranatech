// Bordas exclusivas do Plano Pro. Espelha as entradas pro:true do catalogo do
// cliente (client/src/constants/avatarOptions.ts). Consolidar numa fonte unica
// (compartilhada client/server) fica pra depois, fora de escopo.
export const PRO_AVATAR_BORDERS = new Set<string>([
  "pro-rgb",
  "pro-holo",
  "pro-godzilla",
  "pro-storm",
]);

export const DEFAULT_AVATAR_BORDER = "classic";
