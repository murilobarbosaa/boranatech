import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGate, type ResumeContext } from "@/contexts/AuthGateContext";
import {
  deleteProgress,
  listProgress,
  upsertProgress,
  type ProgressEntry,
} from "@/services/userProgressService";

const CONTEXT = "portfolio_checklist" as const;

interface UsePortfolioChecklistResult {
  checkedIds: Set<string>;
  isLoading: boolean;
  isAuthenticated: boolean;
  toggle: (itemId: string) => Promise<{ ok: boolean; requiresAuth?: boolean }>;
  queueMarkOnNextLoad: (itemId: string) => void;
  pendingAuthItemId: string | null;
  clearPendingAuth: () => void;
}

function toCheckedSet(entries: ProgressEntry[]): Set<string> {
  return new Set(
    entries
      .filter(
        (entry) => (entry.state as { checked?: boolean }).checked === true,
      )
      .map((entry) => entry.itemKey),
  );
}

export function usePortfolioChecklist(): UsePortfolioChecklistResult {
  const { user, loading: authLoading } = useAuth();
  const { registerResumeHandler } = useAuthGate();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAuthItemId, setPendingAuthItemId] = useState<string | null>(
    null,
  );
  const nextLoadMarkRef = useRef<string | null>(null);
  const checkedIdsRef = useRef<Set<string>>(checkedIds);
  const prevUserRef = useRef<string | null>(null);

  useEffect(() => {
    checkedIdsRef.current = checkedIds;
  }, [checkedIds]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) {
        setCheckedIds(new Set());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const entries = await listProgress(CONTEXT);
      if (cancelled) {
        return;
      }

      const next = toCheckedSet(entries);

      const mark = nextLoadMarkRef.current;
      if (mark) {
        nextLoadMarkRef.current = null;
        if (!next.has(mark)) {
          next.add(mark);
          void upsertProgress(CONTEXT, mark, { checked: true }).catch((err) => {
            console.error(
              "[usePortfolioChecklist] queued mark upsert failed",
              err,
            );
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

  // Same-tab resume: on null -> user, flush the pending item into the load queue
  // (moved out of Portfolio.tsx; declared after the load effect to keep the same
  // ordering, so the mark merges on the next load just like before).
  useEffect(() => {
    const prev = prevUserRef.current;
    prevUserRef.current = user?.id ?? null;
    if (!user || prev) return;
    if (pendingAuthItemId) {
      nextLoadMarkRef.current = pendingAuthItemId;
      setPendingAuthItemId(null);
    }
  }, [user, pendingAuthItemId]);

  // OAuth resume: dispatched by the AuthGate central resumer. Optimistic add +
  // upsert + re-list to reconcile against the concurrent sign-in load().
  const applyResumedMark = useCallback<(ctx: ResumeContext) => Promise<void>>(
    async ({ intent }) => {
      if (intent.kind !== "progress" || intent.context !== CONTEXT) return;
      const id = intent.itemKey;
      const already = checkedIdsRef.current.has(id);
      if (!already) {
        setCheckedIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
      }
      try {
        await upsertProgress(CONTEXT, id, { checked: true });
        const entries = await listProgress(CONTEXT);
        setCheckedIds(toCheckedSet(entries));
      } catch (err) {
        console.error("[usePortfolioChecklist] resumed mark failed", err);
        if (!already) {
          setCheckedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      }
    },
    [],
  );

  useEffect(
    () => registerResumeHandler(`progress:${CONTEXT}`, applyResumedMark),
    [registerResumeHandler, applyResumedMark],
  );

  const toggle = useCallback(
    async (
      itemId: string,
    ): Promise<{ ok: boolean; requiresAuth?: boolean }> => {
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
          await deleteProgress(CONTEXT, itemId);
        } else {
          await upsertProgress(CONTEXT, itemId, { checked: true });
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
