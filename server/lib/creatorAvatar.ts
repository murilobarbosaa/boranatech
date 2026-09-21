import type { AvatarDeCreator } from "../../shared/creatorAvatar";
import { AVATAR_PADRAO } from "../../shared/creatorAvatar";
import { resolveAvatars } from "./avatarResolver";

/**
 * Avatar RESOLVIDO de cada creator da lista, numa ida so (lote 11b).
 *
 * Reusa o `resolveAvatars` do site, que e quem sabe a regra (Pro do dono em
 * lote, foto so limpa, borda Pro rebaixada sem Pro), em vez de reler
 * `profiles` aqui e decidir de novo: duas copias da regra do avatar seriam a
 * que diverge na primeira mudanca de moderacao. Quem nao vem na resposta (id
 * sem perfil) fica com o padrao, para a lista nao ter buraco.
 */
export async function lerAvatares(
  userIds: string[],
): Promise<Map<string, AvatarDeCreator>> {
  const mapa = new Map<string, AvatarDeCreator>();
  if (userIds.length === 0) return mapa;
  const resolvidos = await resolveAvatars(userIds);
  for (const r of resolvidos) {
    mapa.set(r.userId, {
      mode: r.mode,
      avatar_url: r.avatarUrl,
      icon: r.icon,
      bg: r.bg,
      border: r.border,
    });
  }
  for (const id of userIds) {
    if (!mapa.has(id)) mapa.set(id, AVATAR_PADRAO);
  }
  return mapa;
}
