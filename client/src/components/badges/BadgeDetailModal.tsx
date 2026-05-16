import { Lock, X } from "lucide-react";

import { ICON_MAP } from "@/components/badges/iconMap";
import type { BadgeInfo } from "@/services/badgesService";
import { BADGE_CATEGORIES } from "@shared/badges";

interface BadgeDetailModalProps {
  badge: BadgeInfo | null;
  onClose: () => void;
}

export function BadgeDetailModal({ badge, onClose }: BadgeDetailModalProps) {
  if (!badge) return null;

  const categoryStyle = BADGE_CATEGORIES[badge.category];
  const Icon = ICON_MAP[badge.iconName];
  const progressPct = badge.progress
    ? Math.min(100, (badge.progress.current / badge.progress.target) * 100)
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[6px_6px_0_#0f172a] md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-200 bg-white hover:bg-slate-100"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>

        <div className="mb-4 flex justify-center">
          <div
            className="relative inline-flex h-20 w-20 items-center justify-center rounded-3xl"
            style={
              badge.isUnlocked
                ? { backgroundColor: categoryStyle.hexBg, color: categoryStyle.hexFg }
                : { backgroundColor: "#e2e8f0", color: "#94a3b8" }
            }
          >
            {Icon ? <Icon className="h-10 w-10" strokeWidth={2.5} /> : null}
            {!badge.isUnlocked ? (
              <span className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-700 text-white">
                <Lock className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            ) : null}
          </div>
        </div>

        <p
          className="mb-1 text-center font-mono text-[11px] uppercase tracking-[0.22em]"
          style={{ color: badge.isUnlocked ? categoryStyle.hexFg : "#64748b" }}
        >
          {categoryStyle.label}
        </p>

        <h2 className="mb-3 text-center font-display text-3xl font-black text-slate-950">
          {badge.name}
        </h2>

        <p className="mb-6 text-center text-sm font-semibold text-slate-600">
          {badge.description}
        </p>

        <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/60 p-4">
          {badge.isUnlocked ? (
            <>
              <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-700">
                ✓ Desbloqueada
              </p>
              {badge.unlockedAt ? (
                <p className="text-sm font-bold text-slate-950">
                  {new Date(badge.unlockedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Como desbloquear
              </p>
              <p className="mb-3 text-sm font-bold text-slate-950">{badge.unlockCriteria}</p>
              {badge.progress ? (
                <div>
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="font-mono text-[11px] text-slate-500">Seu progresso</span>
                    <span className="font-mono text-[11px] font-bold text-slate-700">
                      {Math.round(progressPct)}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progressPct}%`,
                        backgroundColor: categoryStyle.hexFg,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
