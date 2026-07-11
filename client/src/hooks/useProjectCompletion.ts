import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteProgress,
  listProgress,
  upsertProgress,
} from "@/services/userProgressService";
import {
  PROJECT_PROGRESS_CONTEXT,
  clearProjectProgress,
  loadProjectProgress,
  saveProjectProgress,
} from "@/lib/projectProgress";
import {
  loadProgress as loadTrailProgress,
  saveProgress as saveTrailProgress,
} from "@/lib/roadmapV2/progressStorage";
import { projectTrailLinks } from "@shared/roadmapV2/projectLinks.generated";

// Conclusao de projeto como entidade propria (Fase 5b), espelhada com os nos
// de trilha vinculados via projectLinks.generated.ts. Mesmo padrao do
// useRoadmapProgress: anonimo em localStorage, migracao unica no login,
// toggle otimista com rollback.
export function useProjectCompletion() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [done, setDone] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const prevUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    const prevUser = prevUserRef.current;
    prevUserRef.current = userId;

    if (!userId) {
      setDone(loadProjectProgress());
      setReady(true);
      return;
    }

    const justSignedIn = !prevUser && !!userId;
    setReady(false);

    const migrateAndLoad = async () => {
      if (justSignedIn) {
        const local = loadProjectProgress();
        if (local.size > 0) {
          try {
            await Promise.all(
              Array.from(local).map((id) =>
                upsertProgress(PROJECT_PROGRESS_CONTEXT, id, { done: true }),
              ),
            );
            clearProjectProgress();
          } catch (err) {
            // Mantem o local pra tentar de novo numa proxima sessao, igual ao
            // useRoadmapProgress.
            console.error("[useProjectCompletion] migracao falhou:", err);
          }
        }
      }
      const entries = await listProgress(PROJECT_PROGRESS_CONTEXT);
      if (cancelled) return;
      setDone(new Set(entries.map((entry) => entry.itemKey)));
      setReady(true);
    };

    void migrateAndLoad();
    return () => {
      cancelled = true;
    };
  }, [userId, authLoading]);

  // Toggle otimista com espelhamento projeto -> nos de trilha vinculados.
  // Logado: project_progress + course_progress dos vinculos em Promise.all;
  // falha de qualquer um reverte o estado otimista (rollback conjunto).
  // Anonimo: storages locais, sincronos.
  const toggle = (projectId: string) => {
    const wasDone = done.has(projectId);
    const nextDone = !wasDone;
    const links = projectTrailLinks[projectId] ?? [];

    setDone((prev) => {
      const next = new Set(prev);
      if (nextDone) next.add(projectId);
      else next.delete(projectId);
      return next;
    });

    if (!userId) {
      const local = loadProjectProgress();
      if (nextDone) local.add(projectId);
      else local.delete(projectId);
      saveProjectProgress(local);
      for (const { slug, nodeId } of links) {
        const trail = loadTrailProgress(slug);
        if (nextDone) trail.add(nodeId);
        else trail.delete(nodeId);
        saveTrailProgress(slug, trail);
      }
      return;
    }

    const ops: Promise<void>[] = [
      nextDone
        ? upsertProgress(PROJECT_PROGRESS_CONTEXT, projectId, { done: true })
        : deleteProgress(PROJECT_PROGRESS_CONTEXT, projectId),
    ];
    for (const { slug, nodeId } of links) {
      const itemKey = `${slug}:${nodeId}`;
      ops.push(
        nextDone
          ? upsertProgress("course_progress", itemKey, { done: true })
          : deleteProgress("course_progress", itemKey),
      );
    }
    void Promise.all(ops).catch((err) => {
      console.error("[useProjectCompletion] toggle falhou:", err);
      setDone((prev) => {
        const next = new Set(prev);
        if (wasDone) next.add(projectId);
        else next.delete(projectId);
        return next;
      });
    });
  };

  return { done, ready, toggle };
}
