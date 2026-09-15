import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { adminFetch } from "@/lib/adminApi";
import {
  parseAdminFinanceContract,
  type AdminFinanceContract,
} from "@shared/adminFinance";

export type HonestFinancePreset = AdminFinanceContract["period"]["preset"];

type Query = {
  preset: HonestFinancePreset;
  customFrom?: string;
  customTo?: string;
};

type CachedFinance = {
  data?: AdminFinanceContract;
  promise?: Promise<AdminFinanceContract>;
  requestId?: number;
};

const financeCache = new Map<string, CachedFinance>();
let financeRequestSequence = 0;

export function honestFinanceParams(query: Query): URLSearchParams | null {
  if (query.preset === "custom" && (!query.customFrom || !query.customTo)) {
    return null;
  }
  const params = new URLSearchParams({
    contract: "honest-v1",
    preset: query.preset,
  });
  if (query.preset === "custom") {
    params.set("fromDay", query.customFrom!);
    params.set("toDay", query.customTo!);
  }
  return params;
}

async function fetchFinance(
  key: string,
  params: URLSearchParams,
  fresh: boolean,
): Promise<AdminFinanceContract> {
  const cached = financeCache.get(key);
  if (!fresh && cached?.data) return cached.data;
  if (!fresh && cached?.promise) return cached.promise;

  const requestParams = new URLSearchParams(params);
  if (fresh) requestParams.set("fresh", "1");
  const requestId = ++financeRequestSequence;
  const promise = adminFetch(`/finance/summary?${requestParams.toString()}`)
    .then((json: { data?: unknown }) => parseAdminFinanceContract(json.data))
    .then((data) => {
      if (financeCache.get(key)?.requestId === requestId) {
        financeCache.set(key, { data });
      }
      return data;
    })
    .catch((error) => {
      const current = financeCache.get(key);
      if (current?.requestId === requestId) {
        financeCache.set(key, current.data ? { data: current.data } : {});
      }
      throw error;
    });
  financeCache.set(key, { ...cached, promise, requestId });
  return promise;
}

export function useHonestFinance(
  query: Query,
  options: { enabled?: boolean; refreshKey?: number } = {},
) {
  const enabled = options.enabled ?? true;
  const params = useMemo(
    () => honestFinanceParams(query),
    [query.customFrom, query.customTo, query.preset],
  );
  const key = params?.toString() ?? "incomplete";
  const cached = params ? financeCache.get(key)?.data : undefined;
  const [data, setData] = useState<AdminFinanceContract | null>(cached ?? null);
  const [loading, setLoading] = useState(enabled && Boolean(params) && !cached);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousRefreshKey = useRef(options.refreshKey);
  const requestSequence = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestSequence.current += 1;
    };
  }, []);

  const load = useCallback(
    async (fresh = false) => {
      const requestId = ++requestSequence.current;
      if (!enabled || !params) {
        setData(null);
        setLoading(false);
        setError(null);
        return;
      }
      fresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const nextData = await fetchFinance(key, params, fresh);
        if (!mounted.current || requestId !== requestSequence.current) return;
        setData(nextData);
      } catch (err) {
        if (!mounted.current || requestId !== requestSequence.current) return;
        setData(financeCache.get(key)?.data ?? null);
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar o financeiro registrado.",
        );
      } finally {
        if (!mounted.current || requestId !== requestSequence.current) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [enabled, key, params],
  );

  useEffect(() => {
    const refreshChanged = previousRefreshKey.current !== options.refreshKey;
    previousRefreshKey.current = options.refreshKey;
    void load(refreshChanged);
  }, [load, options.refreshKey]);

  return { data, loading, refreshing, error, reload: load, params };
}

export function clearHonestFinanceClientCacheForTests() {
  financeCache.clear();
}
