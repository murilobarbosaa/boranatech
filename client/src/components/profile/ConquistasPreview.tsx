import { ChevronRight, Lock } from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";

import { ICON_MAP } from "@/components/badges/iconMap";
import { useBadges } from "@/hooks/useBadges";
import type { BadgeInfo } from "@/services/badgesService";
import { BADGE_CATEGORIES } from "@shared/badges";

function MiniBadgeCard({ badge }: { badge: BadgeInfo }) {
  const categoryStyle = BADGE_CATEGORIES[badge.category];
  const Icon = ICON_MAP[badge.iconName];

  if (badge.isUnlocked) {
    return (
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-3 text-center">
        <div
          className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            backgroundColor: categoryStyle.hexBg,
            color: categoryStyle.hexFg,
          }}
        >
          {Icon ? <Icon className="h-5 w-5" strokeWidth={2.5} /> : null}
        </div>
        <p className="truncate font-display text-xs font-black text-slate-950">
          {badge.name}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-3 text-center">
      <div className="relative mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-400">
        {Icon ? <Icon className="h-5 w-5" strokeWidth={2.5} /> : null}
        <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-slate-700 text-white">
          <Lock className="h-2 w-2" strokeWidth={3} />
        </span>
      </div>
      <p className="truncate font-display text-xs font-black text-slate-500">
        {badge.name}
      </p>
    </div>
  );
}

export function ConquistasPreview() {
  const { badges, unlockedCount, totalCount, isLoading } = useBadges();

  const previewBadges = useMemo(() => {
    const unlocked = badges
      .filter((b) => b.isUnlocked)
      .sort((a, b) => {
        if (!a.unlockedAt || !b.unlockedAt) return 0;
        return (
          new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
        );
      });

    const locked = badges
      .filter((b) => !b.isUnlocked && b.progress)
      .sort((a, b) => {
        const aPct = a.progress ? a.progress.current / a.progress.target : 0;
        const bPct = b.progress ? b.progress.current / b.progress.target : 0;
        return bPct - aPct;
      });

    return [...unlocked, ...locked].slice(0, 4);
  }, [badges]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="font-mono text-xs text-slate-500">
          Carregando conquistas...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-violet-700">
            Conquistas
          </p>
          <h2 className="mt-1 font-display text-xl font-black text-slate-950 md:text-2xl">
            {unlockedCount} de {totalCount} desbloqueadas
          </h2>
        </div>

        <Link
          href="/perfil/conquistas"
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-4 py-2 font-display text-xs font-black uppercase tracking-wider text-slate-950 shadow-[2px_2px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0f172a]"
        >
          Ver todas
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={3} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {previewBadges.map((badge) => (
          <MiniBadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
}
