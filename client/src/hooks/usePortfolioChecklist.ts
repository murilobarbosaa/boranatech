import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteProgress,
  listProgress,
  upsertProgress,
} from "@/services/userProgressService";

interface UsePortfolioChecklistResult {
  checkedIds: Set<string>;
  isLoading: boolean;
  isAuthenticated: boolean;
  toggle: (itemId: string) => Promise<{ ok: boolean; requiresAuth?: boolean }>;
  queueMarkOnNextLoad: (itemId: string) => void;
  pendingAuthItemId: string | null;
  clearPendingAuth: () => void;
}

export function usePortfolioChecklist(): UsePortfolioChecklistResult {
  const { user, loading: authLoading } = useAuth();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAuthItemId, setPendingAuthItemId] = useState<string | null>(null);
  const nextLoadMarkRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) {
        setCheckedIds(new Set());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const entries = await listProgress("portfolio_checklist");
      if (cancelled) {
        return;
      }

      const next = new Set(
        entries
          .filter((entry) => (entry.state as { checked?: boolean }).checked === true)
          .map((entry) => entry.itemKey),
      );

      const mark = nextLoadMarkRef.current;
      if (mark) {
        nextLoadMarkRef.current = null;
        if (!next.has(mark)) {
          next.add(mark);
          void upsertProgress("portfolio_checklist", mark, { checked: true }).catch((err) => {
            console.error("[usePortfolioChecklist] queued mark upsert failed", err);
            setCheckedIds((prev) => {
              const reverted = new Set(prev);
              reverted.delete(mark);
              return reverted;
            });
          });
        }
      }

      setCheckedIds(next);
      setIsLoading(false);
    }

    if (!authLoading) {
      void load();
    }

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const toggle = useCallback(
    async (itemId: string): Promise<{ ok: boolean; requiresAuth?: boolean }> => {
      if (!user) {
        setPendingAuthItemId(itemId);
        return { ok: false, requiresAuth: true };
      }

      const wasChecked = checkedIds.has(itemId);

      setCheckedIds((prev) => {
        const next = new Set(prev);
        if (wasChecked) next.delete(itemId);
        else next.add(itemId);
        return next;
      });

      try {
        if (wasChecked) {
          await deleteProgress("portfolio_checklist", itemId);
        } else {
          await upsertProgress("portfolio_checklist", itemId, { checked: true });
        }
        return { ok: true };
      } catch (err) {
        console.error("[usePortfolioChecklist] toggle failed", err);
        setCheckedIds((prev) => {
          const next = new Set(prev);
          if (wasChecked) next.add(itemId);
          else next.delete(itemId);
          return next;
        });
        return { ok: false };
      }
    },
    [user, checkedIds],
  );

  const queueMarkOnNextLoad = useCallback((itemId: string) => {
    nextLoadMarkRef.current = itemId;
  }, []);

  const clearPendingAuth = useCallback(() => {
    setPendingAuthItemId(null);
  }, []);

  return {
    checkedIds,
    isLoading,
    isAuthenticated: !!user,
    toggle,
    queueMarkOnNextLoad,
    pendingAuthItemId,
    clearPendingAuth,
  };
}
