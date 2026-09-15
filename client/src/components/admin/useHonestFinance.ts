import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { adminFetch } from "@/lib/adminApi";
import { diaBrasilia, somarDiaCivil } from "@shared/brasiliaDay";
import {
  parseAdminFinanceContract,
  type AdminFinanceContract,
} from "@shared/adminFinance";

export type HonestFinancePreset = AdminFinanceContract["period"]["preset"];

type Query = {
  preset: HonestFinancePreset;
  customFrom?: string;
  customTo?: string;
  asOfDay?: string;
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
  if (query.preset === "all" && !query.asOfDay) return null;
  const params = new URLSearchParams({
    contract: "honest-v1",
    preset: query.preset,
  });
  if (query.preset === "custom") {
    params.set("fromDay", query.customFrom!);
    params.set("toDay", query.customTo!);
  }
  if (query.preset === "all") params.set("asOfDay", query.asOfDay!);
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
    .then((json: { data?: unknown }) => {
      const data = parseAdminFinanceContract(json.data);
      const preset = params.get("preset");
      if (
        data.period.preset !== preset ||
        (preset === "custom" &&
          (data.period.startDay !== params.get("fromDay") ||
            data.period.endDayInclusive !== params.get("toDay"))) ||
        (preset === "all" &&
          data.period.endDayInclusive !==
            somarDiaCivil(params.get("asOfDay")!, -1))
      ) {
        throw new Error("Período financeiro retornado diverge da consulta.");
      }
      return data;
    })
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
  const [today, setToday] = useState(
    () => diaBrasilia(new Date().toISOString()) ?? "",
  );
  useEffect(() => {
    if (query.preset !== "all") return;
    const timer = setInterval(() => {
      const next = diaBrasilia(new Date().toISOString()) ?? "";
      setToday((previous) => (previous === next ? previous : next));
    }, 60_000);
    return () => clearInterval(timer);
  }, [query.preset]);
  const params = useMemo(
    () => honestFinanceParams({ ...query, asOfDay: query.asOfDay ?? today }),
    [query.asOfDay, query.customFrom, query.customTo, query.preset, today],
  );
  const key = params?.toString() ?? "incomplete";
  const cached = params ? financeCache.get(key)?.data : undefined;
  const [result, setResult] = useState<{
    key: string;
    data: AdminFinanceContract | null;
    error: string | null;
  }>({ key, data: cached ?? null, error: null });
  const data = result.key === key ? result.data : (cached ?? null);
  const error = result.key === key ? result.error : null;
  const [loading, setLoading] = useState(enabled && Boolean(params) && !cached);
  const [refreshing, setRefreshing] = useState(false);
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
        setResult({ key, data: null, error: null });
        setLoading(false);
        return;
      }
      fresh ? setRefreshing(true) : setLoading(true);
      setResult((previous) =>
        previous.key === key
          ? { ...previous, error: null }
          : { key, data: financeCache.get(key)?.data ?? null, error: null },
      );
      try {
        const nextData = await fetchFinance(key, params, fresh);
        if (!mounted.current || requestId !== requestSequence.current) return;
        setResult({ key, data: nextData, error: null });
      } catch (err) {
        if (!mounted.current || requestId !== requestSequence.current) return;
        setResult({
          key,
          data: financeCache.get(key)?.data ?? null,
          error:
            err instanceof Error
              ? err.message
              : "Erro ao carregar o financeiro registrado.",
        });
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

  return {
    data,
    loading: loading || (enabled && Boolean(params) && result.key !== key),
    refreshing,
    error,
    reload: load,
    params,
  };
}

export function clearHonestFinanceClientCacheForTests() {
  financeCache.clear();
}
