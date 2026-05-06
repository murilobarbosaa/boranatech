import { Heart } from "lucide-react";
import { toast } from "sonner";
import type { MouseEvent } from "react";
import { type FavoriteItem, useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  item: FavoriteItem;
  className?: string;
  compact?: boolean;
};

export default function FavoriteButton({ item, className, compact = false }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(item);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const added = toggleFavorite(item);
    toast.success(added ? "Adicionado aos favoritos." : "Removido dos favoritos.");
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remover ${item.title} dos favoritos` : `Favoritar ${item.title}`}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-slate-900 bg-white font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#0f172a]",
        compact ? "h-9 w-9" : "px-3 py-1.5 text-xs",
        active && "bg-rose-100 text-rose-700",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", active && "fill-current")} />
      {!compact && <span>{active ? "Favorito" : "Favoritar"}</span>}
    </button>
  );
}
