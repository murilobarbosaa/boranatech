import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch } from "@/lib/adminApi";
import {
  isAttentionContractV3,
  type AttentionContractV3,
} from "@shared/adminAttention";

export const ATTENTION_REFRESH_MS = 60_000;

export function useAttentionData(active: boolean) {
  const [data, setData] = useState<AttentionContractV3 | null>(null);
  const [loading, setLoading] = useState(active);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const loadedOnce = useRef(false);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const load = useCallback(async (forceRefresh: boolean) => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (mounted.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await adminFetch(
        `/attention?contract=3${forceRefresh ? "&refresh=1" : ""}`,
      );
      if (!isAttentionContractV3(response.data))
        throw new Error("Resposta incompatível do painel de atenção.");
      if (mounted.current) setData(response.data);
    } catch (cause) {
      if (mounted.current) {
        setData(null);
        setError(cause instanceof Error ? cause.message : "Erro ao carregar.");
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => load(true), [load]);

  useEffect(() => {
    if (!active) return;
    const forceRefresh = loadedOnce.current;
    loadedOnce.current = true;
    void load(forceRefresh);
    const timer = window.setInterval(
      () => void load(true),
      ATTENTION_REFRESH_MS,
    );
    return () => window.clearInterval(timer);
  }, [active, load]);

  return { data, loading, error, refresh };
}
