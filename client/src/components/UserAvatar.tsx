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
  size?: UserAvatarSize;
  className?: string;
  loading?: boolean;
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

export function getUserInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function UserAvatar({ name, border, icon, bg, size = "md", className = "", loading = false }: UserAvatarProps) {
  const borderOption = getAvatarBorderOption(border);
  const iconOption = getAvatarIconOption(icon);
  const bgOption = getAvatarBgOption(bg);
  const Icon = iconOption.Icon;
  const initials = getUserInitials(name) || "BT";
  const rootClassName = ["relative inline-flex shrink-0", sizeClasses[size], className].join(" ");

  if (loading) {
    return (
      <span className={rootClassName} aria-hidden="true">
        <span className={["absolute inset-0 rounded-full bg-slate-300", offsetClasses[size]].join(" ")} />
        <span className="relative z-10 h-full w-full animate-pulse rounded-full border-2 border-slate-300 bg-slate-100" />
      </span>
    );
  }

  return (
    <span className={rootClassName} aria-hidden="true">
      <span
        className={[
          "absolute inset-0 rounded-full",
          borderOption.offsetClassName,
          offsetClasses[size],
        ].join(" ")}
      />
      <span
        className={[
          "relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 font-display font-black",
          borderOption.borderClassName,
          bgOption.className,
        ].join(" ")}
      >
        {Icon ? <Icon className={iconSizeClasses[size]} strokeWidth={3} /> : initials}
      </span>
    </span>
  );
}
