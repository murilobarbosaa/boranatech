import { useCallback, useEffect, useRef, useState } from "react";

import {
  getLinkedinImprovements,
  PROGRESS_UNAVAILABLE,
  sanitizeLinkedinImprovementIndexes,
  setLinkedinImprovement,
  STALE_PROGRESS_REVISION,
  type LinkedinImprovementsState,
} from "./linkedinClient";
import { createLinkedinProgressQueue } from "./linkedinProgressQueue";

type LoadProgress = (
  analysisId: string,
  signal?: AbortSignal,
) => Promise<LinkedinImprovementsState>;
type SaveProgress = (
  analysisId: string,
  index: number,
  done: boolean,
  revision: number,
  signal?: AbortSignal,
) => Promise<void>;

interface ProgressSession {
  analysisId: string;
  generation: number;
  controller: AbortController;
  touched: Set<number>;
  revision: number | null;
  reconcilePromise?: Promise<void>;
}

export interface UseLinkedinImprovementProgressOptions {
  analysisId: string | null;
  total: number;
  /** Identidade da abertura; muda mesmo ao reabrir a mesma analysisId. */
  sessionIdentity: unknown;
  load?: LoadProgress;
  save?: SaveProgress;
}

/**
 * Estado do checklist isolado por geração de abertura.
 *
 * Toda conclusão assíncrona valida analysisId + geração + montagem. O GET
 * inicial também reconcilia índices tocados localmente, embora a UI mantenha
 * os checkboxes desabilitados até ele terminar.
 */
export function useLinkedinImprovementProgress({
  analysisId,
  total,
  sessionIdentity,
  load = getLinkedinImprovements,
  save = setLinkedinImprovement,
}: UseLinkedinImprovementProgressOptions) {
  const [applied, setApplied] = useState<Set<number>>(new Set());
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());
  const [progressError, setProgressError] = useState("");
  const [progressAvailable, setProgressAvailable] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [loadedSession, setLoadedSession] = useState<{
    analysisId: string;
    identity: unknown;
    total: number;
  } | null>(null);

  const appliedRef = useRef(applied);
  const confirmedRef = useRef(confirmed);
  const mountedRef = useRef(false);
  const generationRef = useRef(0);
  const activeRef = useRef<ProgressSession | null>(null);
  const queueRef = useRef(createLinkedinProgressQueue());

  const replaceApplied = useCallback((next: Set<number>) => {
    appliedRef.current = next;
    setApplied(next);
  }, []);
  const replaceConfirmed = useCallback((next: Set<number>) => {
    confirmedRef.current = next;
    setConfirmed(next);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeRef.current?.controller.abort();
      activeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    const controller = new AbortController();
    const session: ProgressSession | null = analysisId
      ? {
          analysisId,
          generation,
          controller,
          touched: new Set<number>(),
          revision: null,
        }
      : null;
    activeRef.current?.controller.abort();
    activeRef.current = session;

    replaceApplied(new Set());
    replaceConfirmed(new Set());
    setProgressError("");
    setProgressAvailable(true);
    setInitialLoaded(!analysisId);
    setLoadedSession(null);

    if (!session) return () => controller.abort();

    const current = () =>
      mountedRef.current && activeRef.current?.generation === generation;

    void load(session.analysisId, controller.signal)
      .then((state) => {
        if (!current()) return;
        session.revision = state.revision;
        const remote = new Set(
          sanitizeLinkedinImprovementIndexes(state.applied, total),
        );
        // Defesa adicional à UI desabilitada: se uma intenção local ocorreu
        // enquanto o GET estava em voo, a fotografia antiga não a desfaz.
        session.touched.forEach((index) => {
          if (confirmedRef.current.has(index)) remote.add(index);
          else remote.delete(index);
        });
        const optimistic = new Set(remote);
        session.touched.forEach((index) => {
          if (appliedRef.current.has(index)) optimistic.add(index);
          else optimistic.delete(index);
        });
        replaceConfirmed(remote);
        replaceApplied(optimistic);
        setProgressAvailable(state.progressAvailable);
        setInitialLoaded(true);
        setLoadedSession({
          analysisId: session.analysisId,
          identity: sessionIdentity,
          total,
        });
      })
      .catch((error: unknown) => {
        if (!current() || controller.signal.aborted) return;
        replaceApplied(new Set());
        replaceConfirmed(new Set());
        setInitialLoaded(false);
        setLoadedSession(null);
        setProgressError(
          error instanceof Error && error.message === PROGRESS_UNAVAILABLE
            ? "O progresso de melhorias está indisponível no momento."
            : "Não foi possível carregar seu progresso salvo. Recarregue a página para tentar de novo.",
        );
      });

    return () => controller.abort();
  }, [
    analysisId,
    load,
    replaceApplied,
    replaceConfirmed,
    sessionIdentity,
    total,
  ]);

  const toggle = useCallback(
    (index: number) => {
      const session = activeRef.current;
      if (
        !session ||
        session.revision === null ||
        !Number.isInteger(index) ||
        index < 0 ||
        index >= total
      ) {
        return;
      }
      const {
        analysisId: mutationAnalysisId,
        generation,
        controller,
        revision: mutationRevision,
      } = session;
      const isCurrent = () =>
        mountedRef.current && activeRef.current?.generation === generation;
      const wasDone = appliedRef.current.has(index);
      const intended = !wasDone;
      session.touched.add(index);
      setProgressError("");
      const optimistic = new Set(appliedRef.current);
      if (intended) optimistic.add(index);
      else optimistic.delete(index);
      replaceApplied(optimistic);

      const key = `${generation}:${mutationAnalysisId}:${index}`;
      const operation = queueRef.current.enqueue(key, () =>
        save(
          mutationAnalysisId,
          index,
          intended,
          mutationRevision,
          controller.signal,
        ),
      );
      void operation.promise
        .then(() => {
          if (!isCurrent()) return;
          const nextConfirmed = new Set(confirmedRef.current);
          if (intended) nextConfirmed.add(index);
          else nextConfirmed.delete(index);
          replaceConfirmed(nextConfirmed);
        })
        .catch(async (error: unknown) => {
          if (
            !isCurrent() ||
            !queueRef.current.isLatest(key, operation.mutation)
          ) {
            return;
          }
          if (
            error instanceof Error &&
            error.message === STALE_PROGRESS_REVISION
          ) {
            // Uma aba/abertura mais nova invalidou esta revisão. Faz uma única
            // reconciliação compartilhada para a sessão e não reaplica a
            // intenção automaticamente, evitando retry infinito e sobrescrita
            // silenciosa do estado mais recente.
            if (!session.reconcilePromise) {
              const reconcile = (async () => {
                const state = await load(mutationAnalysisId, controller.signal);
                if (!isCurrent()) return;
                session.revision = state.revision;
                const remote = new Set(
                  sanitizeLinkedinImprovementIndexes(state.applied, total),
                );
                replaceConfirmed(remote);
                replaceApplied(new Set(remote));
                setProgressAvailable(state.progressAvailable);
                setProgressError(
                  "O progresso foi atualizado por uma sessão mais recente. Revise o estado antes de tentar novamente.",
                );
              })();
              const reconciliation = reconcile.finally(() => {
                if (session.reconcilePromise === reconciliation) {
                  session.reconcilePromise = undefined;
                }
              });
              session.reconcilePromise = reconciliation;
            }
            try {
              await session.reconcilePromise;
            } catch {
              if (!isCurrent() || controller.signal.aborted) return;
              setProgressError(
                "Não foi possível atualizar o progresso mais recente. Recarregue a página para tentar de novo.",
              );
            }
            return;
          }
          // Reverte só este índice; intenções otimistas de outros índices não
          // são apagadas por uma falha independente.
          const reconciled = new Set(appliedRef.current);
          if (confirmedRef.current.has(index)) reconciled.add(index);
          else reconciled.delete(index);
          replaceApplied(reconciled);
          if (
            error instanceof Error &&
            error.message === PROGRESS_UNAVAILABLE
          ) {
            setProgressAvailable(false);
            return;
          }
          setProgressError(
            "Não foi possível salvar seu progresso. Tente de novo.",
          );
        })
        .finally(() => {
          queueRef.current.finish(key, operation.promise);
        });
    },
    [load, replaceApplied, replaceConfirmed, save, total],
  );

  return {
    applied,
    confirmed,
    progressError,
    progressAvailable,
    initialLoaded:
      initialLoaded &&
      (!analysisId ||
        (loadedSession?.analysisId === analysisId &&
          loadedSession.identity === sessionIdentity &&
          loadedSession.total === total)),
    toggle,
  };
}
