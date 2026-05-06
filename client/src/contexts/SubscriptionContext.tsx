import { getMySubscription } from "@/services/subscriptionService";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "./AuthContext";

interface SubscriptionContextValue {
  isPro: boolean;
  subscription: unknown;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

function isLocalDevelopmentHost() {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname;
  return (
    ["localhost", "127.0.0.1", "::1"].includes(hostname) ||
    hostname.endsWith(".ngrok-free.app") ||
    hostname.endsWith(".ngrok-free.dev") ||
    hostname.endsWith(".ngrok.io") ||
    hostname.endsWith(".ngrok.app") ||
    hostname.endsWith(".ngrok.dev")
  );
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<unknown>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = useCallback(async () => {
    if (isLocalDevelopmentHost()) {
      setSubscription({ status: "local_development_preview", isPro: true });
      setIsPro(true);
      setLoading(false);
      return;
    }

    if (!user) {
      setSubscription(null);
      setIsPro(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const sub = await getMySubscription();
      setSubscription(sub);
      setIsPro(sub?.isPro === true);
    } catch (error) {
      console.error("[SubscriptionContext] getMySubscription failed", error);
      setSubscription(null);
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    if (isLocalDevelopmentHost()) {
      setSubscription({ status: "local_development_preview", isPro: true });
      setIsPro(true);
      setLoading(false);
      return;
    }

    if (!user) {
      setSubscription(null);
      setIsPro(false);
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
    function handleFocus() {
      void refreshSubscription();
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshSubscription]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      isPro,
      subscription,
      loading,
      refreshSubscription,
    }),
    [isPro, loading, refreshSubscription, subscription],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error("useSubscription must be used inside SubscriptionProvider.");
  }

  return context;
}
