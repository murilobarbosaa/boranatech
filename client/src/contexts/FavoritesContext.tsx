import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import posthog from "posthog-js";

import { useAuth } from "@/contexts/AuthContext";
import { apiUrl } from "@/lib/api";
import {
  consumePendingIntent,
  savePendingIntent,
  type FavoriteIntent,
} from "@/lib/pendingIntent";
import { supabase } from "@/lib/supabase";

export type FavoriteType =
  | "area"
  | "roadmap"
  | "curso"
  | "projeto"
  | "dica"
  | "conceito"
  | "plataforma"
  | "evento"
  | "noticia"
  | "comunidade"
  | "faculdade"
  | "tecnologia"
  | "empresa"
  | "vaga";

export type FavoriteItem = {
  id: string;
  type: FavoriteType;
  title: string;
  subtitle?: string;
  url?: string;
};

export interface BookmarkItem {
  resource_type: FavoriteType;
  resource_id: string;
  title_snapshot?: string;
  subtitle_snapshot?: string;
  url_snapshot?: string;
}

export interface PendingAuthFavorite {
  type: FavoriteType;
  itemKey: string;
  snapshot?: {
    title?: string;
    subtitle?: string;
    url?: string;
  };
}

export interface ToggleResult {
  ok: boolean;
  requiresAuth?: boolean;
  isNowFavorited?: boolean;
}

export interface FavoritesContextValue {
  favorites: FavoriteItem[];
  loading: boolean;
  isFavorite: (
    itemOrType: Pick<FavoriteItem, "id" | "type"> | FavoriteType,
    resourceId?: string,
  ) => boolean;
  toggleFavorite: (item: FavoriteItem) => Promise<ToggleResult>;
  getFavoritesByType: (resourceType: FavoriteType) => FavoriteItem[];
  pendingAuthFavorite: PendingAuthFavorite | null;
  clearPendingAuth: () => void;
  queueFavoriteOnNextLoad: (pending: PendingAuthFavorite) => void;
}

const LEGACY_FAVORITES_KEY = "bora-na-tech:favorites";
const FAVORITES_UPDATED_EVENT = "bora-na-tech:favorites-updated";
const CACHE_PREFIX = "bora-na-tech:favorites-cache:v1:";

function favoriteKey(item: Pick<FavoriteItem, "id" | "type">) {
  return `${item.type}:${item.id}`;
}

function bookmarkToFavorite(bookmark: BookmarkItem): FavoriteItem {
  return {
    id: bookmark.resource_id,
    type: bookmark.resource_type,
    title: bookmark.title_snapshot || bookmark.resource_id,
    subtitle: bookmark.subtitle_snapshot || undefined,
    url: bookmark.url_snapshot || undefined,
  };
}

function favoriteToBookmark(item: FavoriteItem): BookmarkItem {
  return {
    resource_type: item.type,
    resource_id: String(item.id),
    title_snapshot: item.title,
    subtitle_snapshot: item.subtitle,
    url_snapshot: item.url,
  };
}

function cacheKey(userId: string) {
  return `${CACHE_PREFIX}${userId}`;
}

function readCache(userId: string): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(cacheKey(userId));
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed as FavoriteItem[];
  } catch {
    return [];
  }
}

function writeCache(userId: string, favorites: FavoriteItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(userId), JSON.stringify(favorites));
  } catch {
    // ignore quota or serialization failures; cache is best-effort
  }
}

function readLegacyBookmarks(): BookmarkItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(LEGACY_FAVORITES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return (parsed as FavoriteItem[]).map(favoriteToBookmark);
  } catch {
    return [];
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function apiFetch(path: string, options?: RequestInit) {
  const authHeader = await getAuthHeader();

  return fetch(apiUrl(`/api/bookmarks${path}`), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...(options?.headers || {}),
    },
  });
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAuthFavorite, setPendingAuthFavorite] =
    useState<PendingAuthFavorite | null>(null);
  const nextLoadFavoriteRef = useRef<PendingAuthFavorite | null>(null);
  const prevUserIdRef = useRef<string | null>(null);

  const refreshFromServer = useCallback(async () => {
    const res = await apiFetch("/");
    if (!res.ok) throw new Error("Erro ao buscar favoritos");
    const json = (await res.json()) as { data?: BookmarkItem[] };
    setFavorites((json.data || []).map(bookmarkToFavorite));
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setFavorites([]);
      setLoading(false);
      prevUserIdRef.current = null;
      return;
    }

    const prevUserId = prevUserIdRef.current;
    prevUserIdRef.current = user.id;
    const justSignedIn = !prevUserId;

    if (justSignedIn) {
      setPendingAuthFavorite(null);
    }

    const cached = readCache(user.id);
    if (cached.length > 0) {
      setFavorites(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    let cancelled = false;

    async function load() {
      try {
        if (justSignedIn) {
          await maybeMigrateLegacyBookmarks(user!.id);
          await maybeConsumeOAuthFavorite();
        }

        const res = await apiFetch("/");
        if (!res.ok) throw new Error("Erro ao buscar favoritos");
        const json = (await res.json()) as { data?: BookmarkItem[] };
        if (cancelled) return;

        let nextFavorites = (json.data || []).map(bookmarkToFavorite);

        const queued = nextLoadFavoriteRef.current;
        if (queued) {
          nextLoadFavoriteRef.current = null;
          const key = favoriteKey({ id: queued.itemKey, type: queued.type });
          const alreadyHas = nextFavorites.some(
            (fav) => favoriteKey(fav) === key,
          );
          if (!alreadyHas) {
            const optimistic: FavoriteItem = {
              id: queued.itemKey,
              type: queued.type,
              title: queued.snapshot?.title || queued.itemKey,
              subtitle: queued.snapshot?.subtitle,
              url: queued.snapshot?.url,
            };
            nextFavorites = [optimistic, ...nextFavorites];
            void apiFetch("/", {
              method: "POST",
              body: JSON.stringify(favoriteToBookmark(optimistic)),
            }).catch((err) => {
              console.error("[useFavorites] queued favorite POST failed", err);
              setFavorites((prev) =>
                prev.filter((fav) => favoriteKey(fav) !== key),
              );
            });
            posthog.capture("favorite_toggled", {
              action: "added",
              resource_type: optimistic.type,
              resource_title: optimistic.title,
              via: "auth_intent",
            });
          }
        }

        setFavorites(nextFavorites);
      } catch (err) {
        console.error("[useFavorites] load failed", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    writeCache(user.id, favorites);
  }, [user, favorites]);

  useEffect(() => {
    const syncFromStorage = () => {
      // Legacy storage event listener: triggers a server re-fetch in case
      // another tab migrated bookmarks between mounts.
      if (user) void refreshFromServer().catch(() => {});
    };

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(FAVORITES_UPDATED_EVENT, syncFromStorage);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(FAVORITES_UPDATED_EVENT, syncFromStorage);
    };
  }, [user, refreshFromServer]);

  const favoriteKeys = useMemo(
    () => new Set(favorites.map(favoriteKey)),
    [favorites],
  );

  const isFavorite = useCallback(
    (
      itemOrType: Pick<FavoriteItem, "id" | "type"> | FavoriteType,
      resourceId?: string,
    ) => {
      if (typeof itemOrType === "string") {
        return favoriteKeys.has(`${itemOrType}:${resourceId}`);
      }

      return favoriteKeys.has(favoriteKey(itemOrType));
    },
    [favoriteKeys],
  );

  const toggleFavorite = useCallback(
    async (item: FavoriteItem): Promise<ToggleResult> => {
      const normalizedItem: FavoriteItem = { ...item, id: String(item.id) };

      if (!user) {
        const pending: PendingAuthFavorite = {
          type: normalizedItem.type,
          itemKey: normalizedItem.id,
          snapshot: {
            title: normalizedItem.title,
            subtitle: normalizedItem.subtitle,
            url: normalizedItem.url,
          },
        };
        setPendingAuthFavorite(pending);
        nextLoadFavoriteRef.current = pending;
        return { ok: false, requiresAuth: true };
      }

      const key = favoriteKey(normalizedItem);
      const wasFavorited = favorites.some((fav) => favoriteKey(fav) === key);

      if (wasFavorited) {
        setFavorites((current) =>
          current.filter((fav) => favoriteKey(fav) !== key),
        );

        try {
          const res = await apiFetch(
            `/${normalizedItem.type}/${encodeURIComponent(normalizedItem.id)}`,
            { method: "DELETE" },
          );
          if (!res.ok) throw new Error("delete failed");
          posthog.capture("favorite_toggled", {
            action: "removed",
            resource_type: normalizedItem.type,
            resource_title: normalizedItem.title,
          });
          return { ok: true, isNowFavorited: false };
        } catch (err) {
          console.error("[useFavorites] delete failed", err);
          setFavorites((current) => [normalizedItem, ...current]);
          return { ok: false, isNowFavorited: true };
        }
      }

      setFavorites((current) => [normalizedItem, ...current]);

      try {
        const res = await apiFetch("/", {
          method: "POST",
          body: JSON.stringify(favoriteToBookmark(normalizedItem)),
        });
        if (!res.ok) throw new Error("insert failed");
        posthog.capture("favorite_toggled", {
          action: "added",
          resource_type: normalizedItem.type,
          resource_title: normalizedItem.title,
        });
        return { ok: true, isNowFavorited: true };
      } catch (err) {
        console.error("[useFavorites] insert failed", err);
        setFavorites((current) =>
          current.filter((fav) => favoriteKey(fav) !== key),
        );
        return { ok: false, isNowFavorited: false };
      }
    },
    [user, favorites],
  );

  const getFavoritesByType = useCallback(
    (resourceType: FavoriteType) =>
      favorites.filter((favorite) => favorite.type === resourceType),
    [favorites],
  );

  const queueFavoriteOnNextLoad = useCallback((pending: PendingAuthFavorite) => {
    nextLoadFavoriteRef.current = pending;
  }, []);

  const clearPendingAuth = useCallback(() => {
    setPendingAuthFavorite(null);
    nextLoadFavoriteRef.current = null;
  }, []);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      loading,
      isFavorite,
      toggleFavorite,
      getFavoritesByType,
      pendingAuthFavorite,
      clearPendingAuth,
      queueFavoriteOnNextLoad,
    }),
    [
      favorites,
      loading,
      isFavorite,
      toggleFavorite,
      getFavoritesByType,
      pendingAuthFavorite,
      clearPendingAuth,
      queueFavoriteOnNextLoad,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites deve ser usado dentro de FavoritesProvider");
  }
  return ctx;
}

async function maybeMigrateLegacyBookmarks(userId: string): Promise<void> {
  if (typeof window === "undefined") return;

  const migratedKey = `bora-na-tech:favorites-migrated:${userId}`;
  if (window.localStorage.getItem(migratedKey)) return;

  const legacyItems = readLegacyBookmarks();
  if (legacyItems.length === 0) {
    window.localStorage.setItem(migratedKey, "1");
    return;
  }

  try {
    const res = await apiFetch("/migrate", {
      method: "POST",
      body: JSON.stringify({ bookmarks: legacyItems }),
    });
    if (res.ok) {
      window.localStorage.setItem(migratedKey, "1");
      window.localStorage.removeItem(LEGACY_FAVORITES_KEY);
    }
  } catch (err) {
    console.error("[useFavorites] legacy migration failed", err);
  }
}

async function maybeConsumeOAuthFavorite(): Promise<void> {
  const intent = consumePendingIntent();
  if (!intent) return;

  if (intent.kind !== "favorite") {
    savePendingIntent(intent);
    return;
  }

  const fav = intent as FavoriteIntent;
  try {
    const bookmark: BookmarkItem = {
      resource_type: fav.type as FavoriteType,
      resource_id: fav.itemKey,
      title_snapshot: fav.snapshot?.title,
      subtitle_snapshot: fav.snapshot?.subtitle,
      url_snapshot: fav.snapshot?.url,
    };
    await apiFetch("/", {
      method: "POST",
      body: JSON.stringify(bookmark),
    });
    posthog.capture("favorite_toggled", {
      action: "added",
      resource_type: fav.type,
      resource_title: fav.snapshot?.title || fav.itemKey,
      via: "oauth_intent",
    });
  } catch (err) {
    console.error("[useFavorites] oauth favorite apply failed", err);
  }
}
