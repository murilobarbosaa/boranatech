import { useContext } from "react";

import { FavoritesContext } from "@/contexts/FavoritesContext";

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

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
