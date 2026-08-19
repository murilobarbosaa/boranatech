import { useCallback, useEffect, useRef, useState } from "react";

import type { LinkedinAnalysisSummary } from "@shared/linkedin/schema";
import { listLinkedinAnalyses } from "./linkedinClient";

export type LinkedinHistoryStatus =
  | "loading"
  | "success_empty"
  | "success_with_data"
  | "error";

type LoadLinkedinHistory = (
  signal?: AbortSignal,
) => Promise<LinkedinAnalysisSummary[]>;

export interface RefreshLinkedinHistoryOptions {
  /** O refresh pós-análise mantém o resultado visível enquanto busca a lista. */
  showLoading?: boolean;
}

export interface UseLinkedinHistoryOptions {
  enabled: boolean;
  load?: LoadLinkedinHistory;
}

/**
 * Fonte única do histórico e do ref síncrono usado para comparabilidade.
 *
 * Initial load e refresh pós-análise compartilham a mesma generation. Abort
 * reduz trabalho, mas somente o requestId decide quem pode escrever sucesso,
 * erro, state e ref.
 */
export function useLinkedinHistory({
  enabled,
  load = listLinkedinAnalyses,
}: UseLinkedinHistoryOptions) {
  const [analyses, setAnalyses] = useState<LinkedinAnalysisSummary[]>([]);
  const [historyStatus, setHistoryStatus] =
    useState<LinkedinHistoryStatus>("loading");
  const analysesRef = useRef<LinkedinAnalysisSummary[]>([]);
  const generationRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);

  const replaceAnalyses = useCallback((items: LinkedinAnalysisSummary[]) => {
    analysesRef.current = items;
    setAnalyses(items);
  }, []);

  const refreshLinkedinHistory = useCallback(
    async ({ showLoading = true }: RefreshLinkedinHistoryOptions = {}) => {
      const generation = generationRef.current + 1;
      generationRef.current = generation;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const current = () =>
        mountedRef.current && generationRef.current === generation;

      if (showLoading && current()) setHistoryStatus("loading");
      try {
        const items = await load(controller.signal);
        if (!current()) return null;
        replaceAnalyses(items);
        setHistoryStatus(
          items.length > 0 ? "success_with_data" : "success_empty",
        );
        return items;
      } catch {
        if (!current() || controller.signal.aborted) return null;
        if (showLoading) replaceAnalyses([]);
        setHistoryStatus("error");
        return null;
      }
    },
    [load, replaceAnalyses],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      generationRef.current += 1;
      controllerRef.current?.abort();
      controllerRef.current = null;
      replaceAnalyses([]);
      setHistoryStatus("success_empty");
      return;
    }
    void refreshLinkedinHistory();
  }, [enabled, refreshLinkedinHistory, replaceAnalyses]);

  return {
    analyses,
    analysesRef,
    historyStatus,
    refreshLinkedinHistory,
  };
}
