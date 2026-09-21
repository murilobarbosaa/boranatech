import UserAvatar from "@/components/UserAvatar";
import {
  normalizeAvatarBg,
  normalizeAvatarBorder,
  normalizeAvatarIcon,
} from "@/constants/avatarOptions";
import type { AvatarDeCreator } from "@shared/creatorAvatar";

// AVATAR DE UM CREATOR, desenhado pelo MESMO componente do cabecalho (lote
// 11b): `UserAvatar`, com o modo, o icone, o fundo e a borda que a pessoa
// escolheu no perfil. O servidor manda `avatar` ja resolvido pela regra do
// site (foto so com Pro e moderacao limpa, borda Pro so com Pro), entao aqui
// so se normalizam os ids do catalogo, como o Header faz com o proprio.
//
// JANELA DE DEPLOY: o backend anterior manda so `avatar_url`. Sem `avatar`, o
// desenho e o de antes (foto se ha url, iniciais se nao ha), para a tela nao
// regredir enquanto o servidor novo nao sobe.

type Tamanho = "xs" | "sm" | "md" | "lg" | "xl";

export function AvatarDoCreator({
  name,
  avatar,
  avatarUrl,
  size,
  className,
}: {
  name: string;
  avatar?: AvatarDeCreator | null;
  /** So para o backend anterior, sem `avatar`. */
  avatarUrl?: string | null;
  size: Tamanho;
  className?: string;
}) {
  if (!avatar) {
    return (
      <UserAvatar
        name={name}
        avatarUrl={avatarUrl ?? null}
        mode={avatarUrl ? "photo" : "icon"}
        size={size}
        className={className}
      />
    );
  }
  return (
    <UserAvatar
      name={name}
      border={normalizeAvatarBorder(avatar.border)}
      icon={normalizeAvatarIcon(avatar.icon)}
      bg={normalizeAvatarBg(avatar.bg)}
      mode={avatar.mode}
      avatarUrl={avatar.mode === "photo" ? avatar.avatar_url : null}
      size={size}
      className={className}
    />
  );
}
