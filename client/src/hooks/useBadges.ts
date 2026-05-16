import { useCallback, useEffect, useState } from "react";

import {
  getBadgesList,
  type BadgeInfo,
  type BadgesListResponse,
} from "@/services/badgesService";

interface UseBadgesResult {
  badges: BadgeInfo[];
  totalCount: number;
  unlockedCount: number;
  newlyUnlocked: string[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBadges(): UseBadgesResult {
  const [data, setData] = useState<BadgesListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getBadgesList();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar conquistas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBadges();
  }, [fetchBadges]);

  return {
    badges: data?.badges ?? [],
    totalCount: data?.totalCount ?? 0,
    unlockedCount: data?.unlockedCount ?? 0,
    newlyUnlocked: data?.newlyUnlocked ?? [],
    isLoading,
    error,
    refetch: fetchBadges,
  };
}
