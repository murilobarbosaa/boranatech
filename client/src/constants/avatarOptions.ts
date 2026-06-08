import {
  BrainCircuit,
  Code2,
  Crown,
  Laptop,
  Rocket,
  Sparkles,
  Star,
  Target,
  type LucideIcon,
} from "lucide-react";

export const avatarBorderIds = [
  "classic",
  "purple",
  "gold",
  "pink",
  "green",
  "blue",
  "orange",
  "red",
  "cyan",
] as const;
export const avatarIconIds = [
  "initials",
  "code",
  "sparkles",
  "rocket",
  "brain",
  "laptop",
  "star",
  "target",
  "crown",
] as const;
export const avatarBgIds = [
  "slate",
  "yellow",
  "purple",
  "pink",
  "green",
  "blue",
  "orange",
  "cream",
  "white",
] as const;

export type AvatarBorderId = (typeof avatarBorderIds)[number];
export type AvatarIconId = (typeof avatarIconIds)[number];
export type AvatarBgId = (typeof avatarBgIds)[number];

export type AvatarBorderOption = {
  id: AvatarBorderId;
  label: string;
  borderClassName: string;
  offsetClassName: string;
  accentClassName: string;
  swatchClassName: string;
};

export type AvatarIconOption = {
  id: AvatarIconId;
  label: string;
  Icon?: LucideIcon;
};

export type AvatarBgOption = {
  id: AvatarBgId;
  label: string;
  className: string;
};

export const defaultAvatarBorder: AvatarBorderId = "classic";
export const defaultAvatarIcon: AvatarIconId = "initials";
export const defaultAvatarBg: AvatarBgId = "yellow";

export const avatarBorderOptions: AvatarBorderOption[] = [
  {
    id: "classic",
    label: "Clássica",
    borderClassName: "border-slate-950",
    offsetClassName: "bg-slate-950",
    accentClassName: "border-slate-950 text-slate-950",
    swatchClassName: "bg-slate-950",
  },
  {
    id: "purple",
    label: "Roxa",
    borderClassName: "border-[#6d28d9]",
    offsetClassName: "bg-[#6d28d9]",
    accentClassName: "border-[#6d28d9] text-[#6d28d9]",
    swatchClassName: "bg-[#6d28d9]",
  },
  {
    id: "gold",
    label: "Dourada",
    borderClassName: "border-[#FFB800]",
    offsetClassName: "bg-[#FFB800]",
    accentClassName: "border-[#FFB800] text-[#8a5a00]",
    swatchClassName: "bg-[#FFB800]",
  },
  {
    id: "pink",
    label: "Rosa",
    borderClassName: "border-[#EC4899]",
    offsetClassName: "bg-[#EC4899]",
    accentClassName: "border-[#EC4899] text-[#BE185D]",
    swatchClassName: "bg-[#EC4899]",
  },
  {
    id: "green",
    label: "Verde",
    borderClassName: "border-[#22C55E]",
    offsetClassName: "bg-[#22C55E]",
    accentClassName: "border-[#22C55E] text-[#15803D]",
    swatchClassName: "bg-[#22C55E]",
  },
  {
    id: "blue",
    label: "Azul",
    borderClassName: "border-[#2563EB]",
    offsetClassName: "bg-[#2563EB]",
    accentClassName: "border-[#2563EB] text-[#1D4ED8]",
    swatchClassName: "bg-[#2563EB]",
  },
  {
    id: "orange",
    label: "Laranja",
    borderClassName: "border-[#F97316]",
    offsetClassName: "bg-[#F97316]",
    accentClassName: "border-[#F97316] text-[#C2410C]",
    swatchClassName: "bg-[#F97316]",
  },
  {
    id: "red",
    label: "Vermelha",
    borderClassName: "border-[#EF4444]",
    offsetClassName: "bg-[#EF4444]",
    accentClassName: "border-[#EF4444] text-[#B91C1C]",
    swatchClassName: "bg-[#EF4444]",
  },
  {
    id: "cyan",
    label: "Ciano",
    borderClassName: "border-[#06B6D4]",
    offsetClassName: "bg-[#06B6D4]",
    accentClassName: "border-[#06B6D4] text-[#0E7490]",
    swatchClassName: "bg-[#06B6D4]",
  },
];

export const avatarIconOptions: AvatarIconOption[] = [
  {
    id: "initials",
    label: "Iniciais",
  },
  {
    id: "code",
    label: "Código",
    Icon: Code2,
  },
  {
    id: "sparkles",
    label: "Brilho",
    Icon: Sparkles,
  },
  {
    id: "rocket",
    label: "Foguete",
    Icon: Rocket,
  },
  {
    id: "brain",
    label: "IA",
    Icon: BrainCircuit,
  },
  {
    id: "laptop",
    label: "Laptop",
    Icon: Laptop,
  },
  {
    id: "star",
    label: "Estrela",
    Icon: Star,
  },
  {
    id: "target",
    label: "Meta",
    Icon: Target,
  },
  {
    id: "crown",
    label: "Coroa",
    Icon: Crown,
  },
];

export const avatarBgOptions: AvatarBgOption[] = [
  {
    id: "slate",
    label: "Azul escuro",
    className: "bg-slate-900 text-white",
  },
  {
    id: "yellow",
    label: "Amarelo",
    className: "bg-[#FFB800] text-[#1a1a1a]",
  },
  {
    id: "purple",
    label: "Roxo",
    className: "bg-[#6d28d9] text-white",
  },
  {
    id: "pink",
    label: "Rosa",
    className: "bg-[#F9A8D4] text-[#831843]",
  },
  {
    id: "green",
    label: "Verde",
    className: "bg-[#86EFAC] text-[#14532D]",
  },
  {
    id: "blue",
    label: "Azul",
    className: "bg-[#2563EB] text-white",
  },
  {
    id: "orange",
    label: "Laranja",
    className: "bg-[#FB923C] text-[#431407]",
  },
  {
    id: "cream",
    label: "Creme",
    className: "bg-[#faf8f4] text-[#1a1a1a]",
  },
  {
    id: "white",
    label: "Branco",
    className: "bg-white text-[#1a1a1a]",
  },
];

export function normalizeAvatarBorder(value: unknown): AvatarBorderId {
  return avatarBorderIds.includes(value as AvatarBorderId)
    ? (value as AvatarBorderId)
    : defaultAvatarBorder;
}

export function normalizeAvatarIcon(value: unknown): AvatarIconId {
  return avatarIconIds.includes(value as AvatarIconId)
    ? (value as AvatarIconId)
    : defaultAvatarIcon;
}

export function normalizeAvatarBg(value: unknown): AvatarBgId {
  return avatarBgIds.includes(value as AvatarBgId)
    ? (value as AvatarBgId)
    : defaultAvatarBg;
}

export function getAvatarBorderOption(value: unknown) {
  return (
    avatarBorderOptions.find(
      (option) => option.id === normalizeAvatarBorder(value),
    ) || avatarBorderOptions[0]
  );
}

export function getAvatarIconOption(value: unknown) {
  return (
    avatarIconOptions.find(
      (option) => option.id === normalizeAvatarIcon(value),
    ) || avatarIconOptions[0]
  );
}

export function getAvatarBgOption(value: unknown) {
  return (
    avatarBgOptions.find((option) => option.id === normalizeAvatarBg(value)) ||
    avatarBgOptions[0]
  );
}
