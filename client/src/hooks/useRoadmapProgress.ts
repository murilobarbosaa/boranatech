import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteProgress,
  listProgress,
  upsertProgress,
} from "@/services/userProgressService";
import {
  clearProgress,
  loadProgress,
  saveProgress,
} from "@/lib/roadmapV2/progressStorage";

// Progresso hibrido da trilha v2, espelhando o usePortfolioChecklist:
// - Anonimo: localStorage (descoberta gratis, sem friccao). `ready` imediato.
// - Logado: server-backed via user_progress, context "course_progress".
//   item_key = `${slug}:${nodeId}`; presenca da linha = no concluido.
// - Login (null -> user): migracao unica do local daquele slug pro server,
//   depois limpa o local. Logout (user -> null): volta pro local (vazio, ja que
//   a migracao limpou), entao deslogado mostra vazio.
//
// `ready` so fica true quando o `done` esta assentado (anon: na hora; logado:
// depois do load). O RoadmapsV2 gateia o <RoadmapTrail> nisso pra o seed
// sincrono (seedReached/prevCompleted) rodar com o done final e nao replay.

const CONTEXT = "course_progress" as const;

function itemKeyFor(slug: string, nodeId: string): string {
  return `${slug}:${nodeId}`;
}

type UseRoadmapProgressResult = {
  done: Set<string>;
  toggle: (nodeId: string) => void;
  ready: boolean;
};

export function useRoadmapProgress(slug: string): UseRoadmapProgressResult {
  const { user, loading: authLoading } = useAuth();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const doneRef = useRef<Set<string>>(done);
  const prevUserRef = useRef<string | null>(null);

  useEffect(() => {
    doneRef.current = done;
  }, [done]);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    const prevUser = prevUserRef.current;
    const currUser = user?.id ?? null;
    prevUserRef.current = currUser;
    const justSignedIn = !prevUser && !!currUser;

    async function run() {
      // Anonimo: fonte e o localStorage; pronto na hora.
      if (!user) {
        setDone(loadProgress(slug));
        setReady(true);
        return;
      }

      setReady(false);

      // Migracao unica do progresso local deste slug no login.
      if (justSignedIn) {
        const local = loadProgress(slug);
        if (local.size > 0) {
          try {
            await Promise.all(
              Array.from(local).map((nodeId) =>
                upsertProgress(CONTEXT, itemKeyFor(slug, nodeId), {
                  done: true,
                }),
              ),
            );
            clearProgress(slug);
          } catch (err) {
            console.error("[useRoadmapProgress] migration failed", err);
            // mantem o local pra um retry futuro; segue carregando o server.
          }
        }
      }

      const entries = await listProgress(CONTEXT);
      if (cancelled) return;

      const prefix = `${slug}:`;
      const next = new Set(
        entries
          .filter((entry) => entry.itemKey.startsWith(prefix))
          .map((entry) => entry.itemKey.slice(prefix.length)),
      );
      setDone(next);
      setReady(true);
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, slug]);

  const toggle = useCallback(
    (nodeId: string) => {
      const wasDone = doneRef.current.has(nodeId);
      const next = new Set(doneRef.current);
      if (wasDone) next.delete(nodeId);
      else next.add(nodeId);
      setDone(next);
      doneRef.current = next;

      if (!user) {
        saveProgress(slug, next);
        return;
      }

      const op = wasDone
        ? deleteProgress(CONTEXT, itemKeyFor(slug, nodeId))
        : upsertProgress(CONTEXT, itemKeyFor(slug, nodeId), { done: true });

      void op.catch((err) => {
        console.error("[useRoadmapProgress] toggle failed", err);
        // reverte o otimismo se o server recusar.
        setDone((prev) => {
          const reverted = new Set(prev);
          if (wasDone) reverted.add(nodeId);
          else reverted.delete(nodeId);
          doneRef.current = reverted;
          return reverted;
        });
      });
    },
    [user, slug],
  );

  return { done, toggle, ready };
}
