import { Lock } from "lucide-react";

import { ICON_MAP } from "@/components/badges/iconMap";
import type { BadgeInfo } from "@/services/badgesService";
import { BADGE_CATEGORIES } from "@shared/badges";

interface BadgeCardProps {
  badge: BadgeInfo;
  onClick?: () => void;
}

function formatProgress(badge: BadgeInfo): string {
  if (!badge.progress) return "";
  const { current, target } = badge.progress;

  if (badge.id === "marathon" || badge.id === "dedication") {
    const currentH = Math.floor(current / 60);
    const targetH = Math.floor(target / 60);
    return `${currentH}h / ${targetH}h`;
  }

  if (badge.id === "veteran" || badge.id === "legendary") {
    return `${current} / ${target} dias`;
  }

  return `${current} / ${target}`;
}

export function BadgeCard({ badge, onClick }: BadgeCardProps) {
  const categoryStyle = BADGE_CATEGORIES[badge.category];
  const Icon = ICON_MAP[badge.iconName];

  if (badge.isUnlocked) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group relative w-full rounded-3xl border-2 border-[#1a1a1a] bg-white p-5 text-left shadow-[3px_3px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0f172a] md:p-6"
      >
        <div
          className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: categoryStyle.hexBg,
            color: categoryStyle.hexFg,
          }}
        >
          {Icon ? <Icon className="h-7 w-7" strokeWidth={2.5} /> : null}
        </div>

        <h3 className="mb-1 font-display text-lg font-black text-slate-950">{badge.name}</h3>
        <p className="mb-3 text-sm font-semibold text-slate-600">{badge.description}</p>

        {badge.unlockedAt ? (
          <p className="font-mono text-[11px] text-slate-500">
            Desbloqueada em{" "}
            {new Date(badge.unlockedAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        ) : null}

        {badge.isNew ? (
          <span className="absolute right-3 top-3 inline-block rounded-full bg-emerald-500 px-2 py-0.5 font-display text-[10px] font-black uppercase tracking-wider text-white">
            Novo
          </span>
        ) : null}
      </button>
    );
  }

  const progressPct = badge.progress
    ? Math.min(100, (badge.progress.current / badge.progress.target) * 100)
    : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-5 text-left transition-all duration-200 hover:border-slate-500 hover:bg-white md:p-6"
    >
      <div className="relative mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-400">
        {Icon ? <Icon className="h-7 w-7" strokeWidth={2.5} /> : null}
        <span className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-700 text-white">
          <Lock className="h-3 w-3" strokeWidth={3} />
        </span>
      </div>

      <h3 className="mb-1 font-display text-lg font-black text-slate-500">{badge.name}</h3>
      <p className="mb-3 line-clamp-2 text-sm font-semibold text-slate-400">{badge.description}</p>

      {badge.progress ? (
        <div className="mt-3">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="font-mono text-[11px] text-slate-500">{formatProgress(badge)}</span>
            <span className="font-mono text-[11px] font-bold text-slate-600">
              {Math.round(progressPct)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-400 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : null}
    </button>
  );
}
