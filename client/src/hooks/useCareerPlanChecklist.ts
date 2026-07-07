import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteProgress,
  listProgress,
  upsertProgress,
} from "@/services/userProgressService";

// Checklist do plano de carreira (context "career_plan"), no padrao do
// usePortfolioChecklist: toggle otimista com rollback. item_key completo e
// "<planId>:<itemId>"; o hook expoe o estado por itemId do plano dado. Sem
// caminho anonimo em localStorage: a feature exige login.

interface UseCareerPlanChecklistResult {
  doneIds: Set<string>;
  isLoading: boolean;
  toggle: (itemId: string) => Promise<{ ok: boolean }>;
  doneCount: number;
}

function itemKeyFor(planId: string, itemId: string): string {
  return `${planId}:${itemId}`;
}

export function useCareerPlanChecklist(
  planId: string | null,
): UseCareerPlanChecklistResult {
  const { user, loading: authLoading } = useAuth();
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user || !planId) {
        setDoneIds(new Set());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const entries = await listProgress("career_plan");
      if (cancelled) return;

      const prefix = `${planId}:`;
      const next = new Set(
        entries
          .filter(
            (entry) =>
              entry.itemKey.startsWith(prefix) &&
              (entry.state as { checked?: boolean }).checked === true,
          )
          .map((entry) => entry.itemKey.slice(prefix.length)),
      );

      setDoneIds(next);
      setIsLoading(false);
    }

    if (!authLoading) {
      void load();
    }

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, planId]);

  const toggle = useCallback(
    async (itemId: string): Promise<{ ok: boolean }> => {
      if (!user || !planId) return { ok: false };

      const wasDone = doneIds.has(itemId);
      setDoneIds((prev) => {
        const next = new Set(prev);
        if (wasDone) next.delete(itemId);
        else next.add(itemId);
        return next;
      });

      try {
        const key = itemKeyFor(planId, itemId);
        if (wasDone) {
          await deleteProgress("career_plan", key);
        } else {
          await upsertProgress("career_plan", key, { checked: true });
        }
        return { ok: true };
      } catch (err) {
        console.error("[useCareerPlanChecklist] toggle failed", err);
        setDoneIds((prev) => {
          const next = new Set(prev);
          if (wasDone) next.add(itemId);
          else next.delete(itemId);
          return next;
        });
        return { ok: false };
      }
    },
    [user, planId, doneIds],
  );

  return {
    doneIds,
    isLoading,
    toggle,
    doneCount: doneIds.size,
  };
}
