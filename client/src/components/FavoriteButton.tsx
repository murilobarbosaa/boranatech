import { type MouseEvent } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useAuthGate } from "@/contexts/AuthGateContext";
import { type FavoriteItem, useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  item: FavoriteItem;
  className?: string;
  compact?: boolean;
};

function showSavedToast() {
  toast.success("Salvo em Favoritos", {
    action: {
      label: "Ver",
      onClick: () => {
        window.location.href = "/perfil/favoritos";
      },
    },
  });
}

export default function FavoriteButton({
  item,
  className,
  compact = false,
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, loading, clearPendingAuth } =
    useFavorites();
  const { openGate } = useAuthGate();

  const active = isFavorite(item);
  const isLoadingState = loading && Boolean(user);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const result = await toggleFavorite(item);

    if (result.requiresAuth) {
      openGate({
        intent: {
          kind: "favorite",
          type: item.type,
          itemKey: String(item.id),
          snapshot: {
            title: item.title,
            subtitle: item.subtitle,
            url: item.url,
          },
        },
        modalCopy: {
          title: (
            <>
              Faça login pra salvar nos seus{" "}
              <span className="text-[#FFB800]">Favoritos</span>
            </>
          ),
          description: "Seus favoritos ficam salvos na sua conta.",
        },
        onAuthed: showSavedToast,
        onDismiss: clearPendingAuth,
      });
      return;
    }

    if (!result.ok) {
      toast.error("Não foi possível salvar. Tente novamente.");
      return;
    }

    if (result.isNowFavorited) {
      showSavedToast();
    } else {
      toast.success("Removido dos favoritos.");
    }
  }

  return (
    <button
      type="button"
      aria-pressed={isLoadingState ? undefined : active}
      aria-busy={isLoadingState || undefined}
      disabled={isLoadingState}
      aria-label={
        active
          ? `Remover ${item.title} dos favoritos`
          : `Favoritar ${item.title}`
      }
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-slate-900 bg-white font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#0f172a]",
        compact ? "h-9 w-9" : "px-3 py-1.5 text-xs",
        active && "bg-rose-100 text-rose-700",
        isLoadingState && "cursor-wait opacity-60",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", active && "fill-current")} />
      {!compact && !isLoadingState && (
        <span>{active ? "Favorito" : "Favoritar"}</span>
      )}
    </button>
  );
}
