import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

import { BadgeCard } from "@/components/badges/BadgeCard";
import { BadgeDetailModal } from "@/components/badges/BadgeDetailModal";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { useBadges } from "@/hooks/useBadges";
import type { BadgeInfo } from "@/services/badgesService";
import { BADGE_CATEGORIES, type BadgeCategory } from "@shared/badges";

const CATEGORY_ORDER: BadgeCategory[] = [
  "estudo",
  "trilhas",
  "pro",
  "comunidade",
];

export default function Conquistas() {
  const { badges, totalCount, unlockedCount, isLoading, error } = useBadges();
  const [selectedBadge, setSelectedBadge] = useState<BadgeInfo | null>(null);

  const grouped: Record<BadgeCategory, BadgeInfo[]> = {
    estudo: [],
    trilhas: [],
    pro: [],
    comunidade: [],
  };
  for (const b of badges) {
    grouped[b.category].push(b);
  }

  const categoriesToShow = CATEGORY_ORDER.filter(
    (cat) => grouped[cat].length > 0,
  );
  const percentage =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <Layout>
      <SEO
        title="Conquistas · Bora na Tech?"
        url="/perfil/conquistas"
        noindex
      />

      <div className="min-h-screen bg-[#faf8f4]">
        <div className="container max-w-5xl py-8 md:py-12">
          <Link
            href="/perfil"
            className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-600 hover:text-slate-950"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={3} />
            Voltar pro perfil
          </Link>

          <section className="mb-12">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-violet-700">
              Conquistas
            </p>

            <h1
              className="mb-4 font-display font-black leading-none text-slate-950"
              style={{ fontSize: "clamp(4rem, 12vw, 9rem)" }}
            >
              {unlockedCount}{" "}
              <span className="text-slate-300">/ {totalCount}</span>
            </h1>

            <p className="mb-6 max-w-md text-lg font-bold text-slate-600">
              badges desbloqueadas na sua trajetória.
            </p>

            <div className="max-w-md">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Progresso geral
                </span>
                <span className="font-display text-lg font-black text-slate-950">
                  {percentage}%
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full border-2 border-[#1a1a1a] bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </section>

          {isLoading ? (
            <div className="py-12 text-center">
              <p className="font-mono text-sm text-slate-500">
                Carregando suas conquistas...
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="py-12 text-center">
              <p className="font-bold text-rose-700">{error}</p>
            </div>
          ) : null}

          {!isLoading && !error
            ? categoriesToShow.map((category) => {
                const categoryBadges = grouped[category];
                const categoryStyle = BADGE_CATEGORIES[category];
                const unlockedInCategory = categoryBadges.filter(
                  (b) => b.isUnlocked,
                ).length;

                return (
                  <section key={category} className="mb-10">
                    <div className="mb-5 flex items-baseline justify-between">
                      <h2
                        className="font-display text-2xl font-black"
                        style={{ color: categoryStyle.hexFg }}
                      >
                        {categoryStyle.label}
                      </h2>
                      <span className="font-mono text-sm font-bold text-slate-500">
                        {unlockedInCategory} / {categoryBadges.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryBadges.map((badge) => (
                        <BadgeCard
                          key={badge.id}
                          badge={badge}
                          onClick={() => setSelectedBadge(badge)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })
            : null}
        </div>
      </div>

      <BadgeDetailModal
        badge={selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </Layout>
  );
}
