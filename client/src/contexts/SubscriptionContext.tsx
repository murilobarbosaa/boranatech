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
  // Exposto para o card do perfil distinguir "Pro via admin" de "Pro via cortesia"
  // quando nao ha assinatura. isPro acima ja e (isPro || isAdmin).
  isAdmin: boolean;
  subscription: unknown;
  loading: boolean;
  refreshSubscription: (options?: { silent?: boolean }) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
  undefined,
);

// Mock de dev parametrizavel por ?devSub=pending|renewal|active|nosub (default
// active), para exercitar os estados do card sem dados reais. So roda sob
// import.meta.env.DEV; some no build de producao.
function buildDevMockSubscription(): { subscription: unknown; isPro: boolean } {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const scenario =
    new URLSearchParams(window.location.search).get("devSub") ?? "active";

  const activeSub = {
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
  const pendingBoleto = {
    planCode: "pro_annual",
    createdAt: new Date(now - day).toISOString(),
  };

  // Cenario A: primeira compra por boleto, sem acesso. Espelha a resposta real
  // (plano free + pendingBoleto), isPro false.
  if (scenario === "pending") {
    return { subscription: { status: "free", pendingBoleto }, isPro: false };
  }
  // Cenario B: assinatura ativa + boleto de renovacao pendente. Pro/ativo normal.
  if (scenario === "renewal") {
    return { subscription: { ...activeSub, pendingBoleto }, isPro: true };
  }
  // Pro SEM assinatura (admin / cortesia): espelha a resposta real (plano free),
  // isPro true. O badge ADMIN vs CORTESIA depende de a conta ser admin (isAdmin, do
  // useAdmin), nao do mock. So para exercitar o card em dev.
  if (scenario === "nosub") {
    return { subscription: { status: "free" }, isPro: true };
  }
  // active (default): ativa, sem pendente.
  return { subscription: { ...activeSub, pendingBoleto: null }, isPro: true };
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
        const mock = buildDevMockSubscription();
        setSubscription(mock.subscription);
        setIsPro(mock.isPro);
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
      const mock = buildDevMockSubscription();
      setSubscription(mock.subscription);
      setIsPro(mock.isPro);
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
      isAdmin,
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
