import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  fetchNotifications,
  markAllAsRead as markAllAsReadRequest,
  markAsRead as markAsReadRequest,
  type NotificationItem,
} from "@/services/notificationsService";
import { useAuth } from "./AuthContext";

// Estado das notificações in-app. Mesmo padrão do SubscriptionContext:
// só ativa com user logado e faz polling apenas com a aba visível. O GET
// devolve página + unread_count juntos, então um fetch alimenta badge e
// painel de uma vez.

const PAGE_SIZE = 20;
const POLL_INTERVAL_MS = 90 * 1000;

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  hasError: boolean;
  hasMore: boolean;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const loadingMoreRef = useRef(false);

  // Refresca a primeira página e o unread_count. Itens mais antigos já
  // carregados via loadMore são preservados (merge por id): o poll nunca
  // "encolhe" a lista que o usuário paginou.
  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user) return;
      const silent = options?.silent === true;
      if (!silent) setIsLoading(true);
      try {
        const page = await fetchNotifications({ limit: PAGE_SIZE });
        setNotifications((prev) => {
          const freshIds = new Set(page.data.map((item) => item.id));
          return [
            ...page.data,
            ...prev.filter((item) => !freshIds.has(item.id)),
          ];
        });
        setUnreadCount(page.unread_count);
        setNextCursor((prevCursor) =>
          loadedOnce ? prevCursor : page.next_cursor,
        );
        if (!loadedOnce) setLoadedOnce(true);
        setHasError(false);
      } catch (error) {
        console.error("[NotificationsContext] refresh failed", error);
        if (!silent) setHasError(true);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [loadedOnce, user],
  );

  const loadMore = useCallback(async () => {
    if (!user || !nextCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    try {
      const page = await fetchNotifications({
        limit: PAGE_SIZE,
        cursor: nextCursor,
      });
      setNotifications((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        return [...prev, ...page.data.filter((item) => !seen.has(item.id))];
      });
      setNextCursor(page.next_cursor);
    } catch (error) {
      console.error("[NotificationsContext] loadMore failed", error);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [nextCursor, user]);

  // Otimista: read_at local + badge decrementado na hora; reverte se falhar.
  const markAsRead = useCallback(
    async (id: string) => {
      const target = notifications.find((item) => item.id === id);
      if (!target || target.read_at) return;

      const nowIso = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, read_at: nowIso } : item,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));

      try {
        await markAsReadRequest(id);
      } catch (error) {
        console.error("[NotificationsContext] markAsRead failed", error);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, read_at: null } : item,
          ),
        );
        setUnreadCount((count) => count + 1);
      }
    },
    [notifications],
  );

  const markAllAsRead = useCallback(async () => {
    const previous = notifications;
    const previousCount = unreadCount;
    if (previousCount === 0) return;

    const nowIso = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((item) =>
        item.read_at ? item : { ...item, read_at: nowIso },
      ),
    );
    setUnreadCount(0);

    try {
      await markAllAsReadRequest();
    } catch (error) {
      console.error("[NotificationsContext] markAllAsRead failed", error);
      setNotifications(previous);
      setUnreadCount(previousCount);
    }
  }, [notifications, unreadCount]);

  // Reset ao deslogar + fetch inicial ao logar.
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setNextCursor(null);
      setLoadedOnce(false);
      setHasError(false);
      setIsLoading(false);
      return;
    }
    void refresh();
    // Só no login/troca de usuário; refresh muda de identidade com loadedOnce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Polling: 90s com a aba visível; ao voltar a ficar visível, atualiza na
  // hora (o intervalo sozinho deixaria o badge até 90s desatualizado).
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh({ silent: true });
      }
    }, POLL_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refresh({ silent: true });
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refresh, user]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      isLoading: isLoading && !loadedOnce,
      hasError,
      hasMore: nextCursor !== null,
      refresh,
      loadMore,
      markAsRead,
      markAllAsRead,
    }),
    [
      hasError,
      isLoading,
      loadMore,
      loadedOnce,
      markAllAsRead,
      markAsRead,
      nextCursor,
      notifications,
      refresh,
      unreadCount,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationsProvider.",
    );
  }

  return context;
}
