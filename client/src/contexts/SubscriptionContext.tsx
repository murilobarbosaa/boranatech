import { getMySubscription } from "@/services/subscriptionService";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "./AuthContext";

interface SubscriptionContextValue {
  isPro: boolean;
  subscription: unknown;
  loading: boolean;
  refreshSubscription: (options?: { silent?: boolean }) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
  undefined,
);

function buildDevMockSubscription() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return {
    isPro: true,
    status: "active",
    cancel_at_period_end: false,
    canceled_at: null,
    current_period_start: new Date(now - 30 * day).toISOString(),
    current_period_end: new Date(now + 335 * day).toISOString(),
    created_at: new Date(now - 30 * day).toISOString(),
    plans: {
      name: "Pro Anual",
      code: "pro_annual",
      price_cents: 22200,
    },
  };
}

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [subscription, setSubscription] = useState<unknown>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;

      if (!user) {
        setSubscription(null);
        setIsPro(false);
        setLoading(false);
        return;
      }

      if (import.meta.env.DEV) {
        setSubscription(buildDevMockSubscription());
        setIsPro(true);
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      }

      try {
        const sub = await getMySubscription();
        setSubscription(sub);
        setIsPro(sub?.isPro === true);
      } catch (error) {
        console.error("[SubscriptionContext] getMySubscription failed", error);
        setSubscription(null);
        setIsPro(false);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [user],
  );

  useEffect(() => {
    let mounted = true;

    if (!user) {
      setSubscription(null);
      setIsPro(false);
      setLoading(false);
      return;
    }

    if (import.meta.env.DEV) {
      setSubscription(buildDevMockSubscription());
      setIsPro(true);
      setLoading(false);
      return;
    }

    void refreshSubscription().finally(() => {
      if (!mounted) return;
    });

    return () => {
      mounted = false;
    };
  }, [refreshSubscription, user]);

  useEffect(() => {
    if (!user || isPro) return;

    const interval = setInterval(
      () => {
        if (document.visibilityState === "visible") {
          void refreshSubscription({ silent: true });
        }
      },
      3 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [user, isPro, refreshSubscription]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      isPro: isPro || isAdmin,
      subscription,
      loading: loading || adminLoading,
      refreshSubscription,
    }),
    [adminLoading, isAdmin, isPro, loading, refreshSubscription, subscription],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error(
      "useSubscription must be used inside SubscriptionProvider.",
    );
  }

  return context;
}
