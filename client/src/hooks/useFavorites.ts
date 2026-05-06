import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { apiUrl } from "@/lib/api";
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
  | "vaga"
  | "dicionario";

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

const FAVORITES_STORAGE_KEY = "bora-na-tech:favorites";
const FAVORITES_UPDATED_EVENT = "bora-na-tech:favorites-updated";

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

function readFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readLocalBookmarks(): BookmarkItem[] {
  return readFavorites().map(favoriteToBookmark);
}

function writeFavorites(favorites: FavoriteItem[]) {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT));
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

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => readFavorites());
  const [loading, setLoading] = useState(true);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    const syncFavorites = () => setFavorites(readFavorites());

    window.addEventListener("storage", syncFavorites);
    window.addEventListener(FAVORITES_UPDATED_EVENT, syncFavorites);

    return () => {
      window.removeEventListener("storage", syncFavorites);
      window.removeEventListener(FAVORITES_UPDATED_EVENT, syncFavorites);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setFavorites(readFavorites());
      setLoading(false);
      setMigrated(false);
      return;
    }

    setLoading(true);
    apiFetch("/")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar favoritos");
        return res.json() as Promise<{ data?: BookmarkItem[] }>;
      })
      .then((json) => {
        setFavorites((json.data || []).map(bookmarkToFavorite));
      })
      .catch(() => {
        setFavorites(readFavorites());
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!user || migrated) return;

    const localItems = readLocalBookmarks();
    if (localItems.length === 0) {
      setMigrated(true);
      return;
    }

    const migratedKey = `bora-na-tech:favorites-migrated:${user.id}`;
    if (window.localStorage.getItem(migratedKey)) {
      setMigrated(true);
      return;
    }

    apiFetch("/migrate", {
      method: "POST",
      body: JSON.stringify({ bookmarks: localItems }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao migrar favoritos");
        return res.json() as Promise<{ data?: { migrated?: number } }>;
      })
      .then((json) => {
        if (typeof json.data?.migrated === "number") {
          window.localStorage.setItem(migratedKey, "1");
          window.localStorage.removeItem(FAVORITES_STORAGE_KEY);
          setMigrated(true);
          return apiFetch("/").then((res) => res.json() as Promise<{ data?: BookmarkItem[] }>);
        }

        return null;
      })
      .then((json) => {
        if (json?.data) setFavorites(json.data.map(bookmarkToFavorite));
      })
      .catch(() => {
        setMigrated(true);
      });
  }, [migrated, user]);

  const favoriteKeys = useMemo(() => new Set(favorites.map(favoriteKey)), [favorites]);

  const isFavorite = useCallback(
    (itemOrType: Pick<FavoriteItem, "id" | "type"> | FavoriteType, resourceId?: string) => {
      if (typeof itemOrType === "string") {
        return favoriteKeys.has(`${itemOrType}:${resourceId}`);
      }

      return favoriteKeys.has(favoriteKey(itemOrType));
    },
    [favoriteKeys],
  );

  const toggleFavorite = useCallback(
    (item: FavoriteItem) => {
      const normalizedItem = { ...item, id: String(item.id) };
      const currentFavorites = user ? favorites : readFavorites();
      const key = favoriteKey(normalizedItem);
      const isCurrentlyFavorite = currentFavorites.some((favorite) => favoriteKey(favorite) === key);

      if (!user) {
        const nextFavorites = isCurrentlyFavorite
          ? currentFavorites.filter((favorite) => favoriteKey(favorite) !== key)
          : [normalizedItem, ...currentFavorites];

        writeFavorites(nextFavorites);
        setFavorites(nextFavorites);
        return nextFavorites.some((favorite) => favoriteKey(favorite) === key);
      }

      if (isCurrentlyFavorite) {
        setFavorites((current) => current.filter((favorite) => favoriteKey(favorite) !== key));

        void apiFetch(`/${normalizedItem.type}/${encodeURIComponent(normalizedItem.id)}`, { method: "DELETE" }).catch(() => {
          setFavorites((current) => [normalizedItem, ...current]);
        });

        return false;
      }

      setFavorites((current) => [normalizedItem, ...current]);

      void apiFetch("/", {
        method: "POST",
        body: JSON.stringify(favoriteToBookmark(normalizedItem)),
      }).catch(() => {
        setFavorites((current) => current.filter((favorite) => favoriteKey(favorite) !== key));
      });

      return true;
    },
    [favorites, user],
  );

  const getFavoritesByType = useCallback(
    (resourceType: FavoriteType) => favorites.filter((favorite) => favorite.type === resourceType),
    [favorites],
  );

  return { favorites, loading, isFavorite, toggleFavorite, getFavoritesByType };
}
