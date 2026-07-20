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
  dismissSuper as dismissSuperRequest,
  fetchNotifications,
  markAllAsRead as markAllAsReadRequest,
  markAsRead as markAsReadRequest,
  type NotificationItem,
} from "@/services/notificationsService";
import { useAuth } from "./AuthContext";

// Origem da abertura do SuperModal: 'auto' = pop automatico por carga de app
// (respeita a allowlist de rota no SuperInterstitial); 'manual' = clique no sino
// (abre em qualquer rota).
export type SuperModalSource = "auto" | "manual";

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
  // Contador monotônico que sobe SÓ quando um fetch do servidor traz
  // unread_count maior que o fetch anterior (chegada genuína). A primeira
  // resposta da sessão é baseline (não emite). Mutações otimistas
  // (markAsRead/markAllAsRead) e seus rollbacks nunca mexem aqui, então o
  // sino nunca balança por oscilação de UI. Vive no provider (montado uma
  // vez no App), logo sobrevive à remontagem do sino a cada navegação.
  arrivalSignal: number;
  // SUPER. activeSuper = a super ativa (interstitial) ou null. O modal (montado
  // uma vez pelo SuperInterstitial) e controlado por superModalOpen/Item/Source.
  activeSuper: NotificationItem | null;
  superModalOpen: boolean;
  superModalItem: NotificationItem | null;
  superModalSource: SuperModalSource | null;
  openSuperModal: (item: NotificationItem, source?: SuperModalSource) => void;
  closeSuperModal: () => void;
  dismissSuper: (id: string) => Promise<void>;
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
  const [arrivalSignal, setArrivalSignal] = useState(0);
  const [activeSuper, setActiveSuper] = useState<NotificationItem | null>(null);
  const [superModalOpen, setSuperModalOpen] = useState(false);
  const [superModalItem, setSuperModalItem] = useState<NotificationItem | null>(
    null,
  );
  const [superModalSource, setSuperModalSource] =
    useState<SuperModalSource | null>(null);
  const loadingMoreRef = useRef(false);
  // "Uma vez por carga de app": true depois que o interstitial AUTO ja foi
  // disparado nesta carga. Guarda contra redisparo em polls/navegacoes. Vive no
  // provider (montado uma vez), entao sobrevive a remontagem do sino; so zera no
  // logout (nova carga = reload zera naturalmente).
  const autoSuperTriggeredRef = useRef(false);
  // Último unread_count VINDO DO SERVIDOR (null = ainda sem baseline). Fonte da
  // verdade pra detectar chegada; nunca reflete decremento otimista local.
  const lastServerUnreadRef = useRef<number | null>(null);

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
        // Sinal de chegada: emite só quando o servidor reporta MAIS não lidas
        // que a última resposta do servidor. A primeira é baseline (ref null).
        const prevServerUnread = lastServerUnreadRef.current;
        lastServerUnreadRef.current = page.unread_count;
        if (prevServerUnread !== null && page.unread_count > prevServerUnread) {
          setArrivalSignal((signal) => signal + 1);
        }
        // Super ativa embutida no payload. Na PRIMEIRA vez que vier != null nesta
        // carga, dispara o interstitial AUTO uma única vez (a exclusão por rota é
        // decidida no SuperInterstitial). Polls seguintes não redisparam.
        const nextSuper = page.activeSuper ?? null;
        setActiveSuper(nextSuper);
        if (nextSuper && !autoSuperTriggeredRef.current) {
          autoSuperTriggeredRef.current = true;
          setSuperModalItem(nextSuper);
          setSuperModalSource("auto");
          setSuperModalOpen(true);
        }
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

  // Otimista: read_at local + badge decrementado na hora; reverte se falhar. O
  // update otimista só roda se o item estiver na página carregada; mesmo fora
  // dela (ex.: super antiga não paginada, disparada pelo CTA) o server é chamado
  // — read é idempotente lá — pra a leitura valer cross-device.
  const markAsRead = useCallback(
    async (id: string) => {
      const target = notifications.find((item) => item.id === id);
      if (target?.read_at) return;

      const nowIso = new Date().toISOString();
      if (target) {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, read_at: nowIso } : item,
          ),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      try {
        await markAsReadRequest(id);
      } catch (error) {
        console.error("[NotificationsContext] markAsRead failed", error);
        if (target) {
          setNotifications((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, read_at: null } : item,
            ),
          );
          setUnreadCount((count) => count + 1);
        }
      }
    },
    [notifications],
  );

  // Abre o SuperModal (via SuperInterstitial, o único ponto de montagem).
  // Padrão 'manual' = clique no sino, abre em qualquer rota.
  const openSuperModal = useCallback(
    (item: NotificationItem, source: SuperModalSource = "manual") => {
      setSuperModalItem(item);
      setSuperModalSource(source);
      setSuperModalOpen(true);
    },
    [],
  );

  const closeSuperModal = useCallback(() => {
    setSuperModalOpen(false);
    setSuperModalItem(null);
    setSuperModalSource(null);
  }, []);

  // Dispensa (fechar no X/overlay/Esc): otimista — fecha o modal e zera a super
  // ativa local (não repipoca nesta carga; autoSuperTriggeredRef já trava), e
  // grava o dismiss no server. NÃO marca como lida: a super continua no sino.
  const dismissSuper = useCallback(async (id: string) => {
    setSuperModalOpen(false);
    setSuperModalItem(null);
    setSuperModalSource(null);
    setActiveSuper(null);
    try {
      await dismissSuperRequest(id);
    } catch (error) {
      // Falhou no server: o modal já fechou; numa próxima carga a super pode
      // reaparecer (o dismiss não persistiu). Sem reverter a UI.
      console.error("[NotificationsContext] dismissSuper failed", error);
    }
  }, []);

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
      // Reseta a baseline: o próximo login rebaseia sem emitir chegada.
      // arrivalSignal fica como está (monotônico); o sino desmonta no logout.
      lastServerUnreadRef.current = null;
      // Zera o estado da super: o próximo login/carga pode reabrir o interstitial.
      setActiveSuper(null);
      setSuperModalOpen(false);
      setSuperModalItem(null);
      setSuperModalSource(null);
      autoSuperTriggeredRef.current = false;
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
      arrivalSignal,
      activeSuper,
      superModalOpen,
      superModalItem,
      superModalSource,
      openSuperModal,
      closeSuperModal,
      dismissSuper,
      refresh,
      loadMore,
      markAsRead,
      markAllAsRead,
    }),
    [
      arrivalSignal,
      activeSuper,
      superModalOpen,
      superModalItem,
      superModalSource,
      openSuperModal,
      closeSuperModal,
      dismissSuper,
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
