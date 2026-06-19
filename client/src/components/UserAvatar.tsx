import type { CSSProperties } from "react";

import {
  getAvatarBgOption,
  getAvatarBorderOption,
  getAvatarIconOption,
  type AvatarBgId,
  type AvatarBorderId,
  type AvatarIconId,
} from "@/constants/avatarOptions";

type UserAvatarSize = "sm" | "md" | "lg" | "xl" | "preview";

interface UserAvatarProps {
  name: string;
  border?: AvatarBorderId | null;
  icon?: AvatarIconId | null;
  bg?: AvatarBgId | null;
  mode?: "icon" | "photo" | null;
  avatarUrl?: string | null;
  size?: UserAvatarSize;
  className?: string;
  loading?: boolean;
}

// Avatar efetivo do PROPRIO usuario: foto so quando o dono e Pro, escolheu modo
// foto, tem url e o avatar esta limpo. Mantem o que o dono ve consistente com o
// que terceiros veem (cobre downgrade e foto em analise). Borda e ortogonal.
export function effectiveOwnAvatar(
  profile:
    | {
        avatar_mode?: string | null;
        avatar_url?: string | null;
        avatar_moderation_status?: string | null;
      }
    | null
    | undefined,
  isPro: boolean,
): { mode: "icon" | "photo"; avatarUrl: string | null } {
  const showPhoto =
    !!profile &&
    profile.avatar_mode === "photo" &&
    !!profile.avatar_url &&
    isPro &&
    profile.avatar_moderation_status === "clean";
  return showPhoto
    ? { mode: "photo", avatarUrl: profile.avatar_url ?? null }
    : { mode: "icon", avatarUrl: null };
}

const sizeClasses: Record<UserAvatarSize, string> = {
  sm: "h-9 w-9 text-xs",
  md: "h-14 w-14 text-lg",
  lg: "h-28 w-28 text-4xl",
  xl: "h-32 w-32 text-5xl",
  preview: "h-11 w-11 text-sm",
};

const iconSizeClasses: Record<UserAvatarSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-11 w-11",
  xl: "h-14 w-14",
  preview: "h-5 w-5",
};

const offsetClasses: Record<UserAvatarSize, string> = {
  sm: "translate-x-[3px] translate-y-[3px]",
  md: "translate-x-1 translate-y-1",
  lg: "translate-x-2 translate-y-2",
  xl: "translate-x-2.5 translate-y-2.5",
  preview: "translate-x-1 translate-y-1",
};

// Espessura do anel Pro animado por tamanho. Lugar unico pra ajustar. Em sm cai
// pra 2px porque 3px pesa demais num avatar pequeno.
const proRingWidth: Record<UserAvatarSize, string> = {
  sm: "2px",
  md: "3px",
  lg: "3px",
  xl: "3px",
  preview: "3px",
};

// Translacao do disco de offset por tamanho, EM PX, espelhando offsetClasses
// (sm 3px, md 4px, lg 8px, xl 10px, preview 4px). Usado pra recentrar o conic do
// anel no mesmo ponto do conic da sombra, virando um gradiente continuo so.
const proOffsetPx: Record<UserAvatarSize, string> = {
  sm: "3px",
  md: "4px",
  lg: "8px",
  xl: "10px",
  preview: "4px",
};

export function getUserInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function UserAvatar({
  name,
  border,
  icon,
  bg,
  mode,
  avatarUrl,
  size = "md",
  className = "",
  loading = false,
}: UserAvatarProps) {
  const borderOption = getAvatarBorderOption(border);
  const iconOption = getAvatarIconOption(icon);
  const bgOption = getAvatarBgOption(bg);
  const Icon = iconOption.Icon;
  const initials = getUserInitials(name) || "BT";
  const showPhoto = mode === "photo" && !!avatarUrl;
  const proEffect = borderOption.effect;
  const rootClassName = [
    "relative inline-flex shrink-0",
    sizeClasses[size],
    proEffect ? `pro-anim-${proEffect}` : "",
    className,
  ].join(" ");

  if (loading) {
    return (
      <span className={rootClassName} aria-hidden="true">
        <span
          className={[
            "absolute inset-0 rounded-full bg-slate-300",
            offsetClasses[size],
          ].join(" ")}
        />
        <span className="relative z-10 h-full w-full animate-pulse rounded-full border-2 border-slate-300 bg-slate-100" />
      </span>
    );
  }

  return (
    <span className={rootClassName} aria-hidden="true">
      <span
        className={[
          "absolute rounded-full",
          // Com effect, o disco da sombra sobra 2px pra fora da span 2 em toda a
          // volta (-inset-0.5) pra dar lastro de gradiente atras da beirada e
          // cobrir a emenda externa entre o anel e a sombra. Sem effect, igual a hoje.
          proEffect ? "-inset-0.5" : "inset-0",
          proEffect
            ? `pro-offset pro-offset-${proEffect}`
            : borderOption.offsetClassName,
          offsetClasses[size],
        ].join(" ")}
      />
      <span
        className={[
          "relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 font-display font-black",
          proEffect ? "border-transparent" : borderOption.borderClassName,
          bgOption.className,
        ].join(" ")}
      >
        {showPhoto ? (
          <img
            src={avatarUrl ?? undefined}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : Icon ? (
          <Icon className={iconSizeClasses[size]} strokeWidth={3} />
        ) : (
          initials
        )}
      </span>
      {/* Anel fino: filho DIRETO do root (irmao da span 2, depois dela), por cima
          (z-20), cobrindo a beirada inteira incluindo a faixa de 2px da borda
          transparente da span 2. Fora da span 2 pra nao ser recortado pelo
          overflow-hidden dela. */}
      {proEffect ? (
        <span
          className={`pointer-events-none absolute inset-0 z-20 rounded-full pro-ring pro-ring-${proEffect}`}
          style={
            {
              "--pro-ring-w": proRingWidth[size],
              "--pro-offset": proOffsetPx[size],
            } as CSSProperties
          }
        />
      ) : null}
    </span>
  );
}
