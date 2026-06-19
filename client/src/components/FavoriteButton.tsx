import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { type FavoriteItem, useFavorites } from "@/hooks/useFavorites";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { showActionToast } from "@/lib/notify";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  item: FavoriteItem;
  className?: string;
  compact?: boolean;
};

const FAVORITE_PARTICLES: { tx: string; ty: string }[] = [
  { tx: "11px", ty: "0px" },
  { tx: "6px", ty: "-10px" },
  { tx: "-6px", ty: "-10px" },
  { tx: "-11px", ty: "0px" },
  { tx: "-6px", ty: "10px" },
  { tx: "6px", ty: "10px" },
];

export default function FavoriteButton({
  item,
  className,
  compact = false,
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, pendingAuthFavorite, clearPendingAuth } =
    useFavorites();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const authJustSucceededRef = useRef(false);
  const active = isFavorite(item);

  const reduceMotion = usePrefersReducedMotion();
  const prevActiveRef = useRef(active);
  const [pop, setPop] = useState<"none" | "in" | "out">("none");
  const [burstKey, setBurstKey] = useState(0);

  useEffect(() => {
    if (prevActiveRef.current === active) return;
    prevActiveRef.current = active;
    if (reduceMotion) return;
    if (active) {
      setPop("in");
      setBurstKey((key) => key + 1);
    } else {
      setPop("out");
    }
  }, [active, reduceMotion]);

  useEffect(() => {
    if (pendingAuthFavorite && !user) {
      setAuthModalOpen(true);
    }
  }, [pendingAuthFavorite, user]);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const result = await toggleFavorite(item);

    if (result.requiresAuth) return;

    if (!result.ok) {
      toast.error("Não foi possível salvar. Tente novamente.");
      return;
    }

    if (result.isNowFavorited) {
      showActionToast({
        message: "Salvo em Favoritos",
        action: {
          label: "Ver",
          onClick: () => {
            window.location.href = "/perfil/favoritos";
          },
        },
      });
    } else {
      showActionToast({ message: "Removido dos favoritos." });
    }
  }

  function handleModalOpenChange(open: boolean) {
    setAuthModalOpen(open);
    if (!open) {
      if (authJustSucceededRef.current) {
        authJustSucceededRef.current = false;
        return;
      }
      clearPendingAuth();
    }
  }

  function handleAuthenticated() {
    authJustSucceededRef.current = true;
    showActionToast({
      message: "Salvo em Favoritos",
      action: {
        label: "Ver",
        onClick: () => {
          window.location.href = "/perfil/favoritos";
        },
      },
    });
  }

  const pendingIntent = pendingAuthFavorite
    ? {
        kind: "favorite" as const,
        type: pendingAuthFavorite.type,
        itemKey: pendingAuthFavorite.itemKey,
        snapshot: pendingAuthFavorite.snapshot,
      }
    : undefined;

  return (
    <>
      <button
        type="button"
        aria-pressed={active}
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
          className,
        )}
      >
        <span className="relative inline-flex">
          <Heart
            className={cn(
              "h-4 w-4 transition-colors duration-200",
              active && "fill-current",
              pop === "in" && "fav-pop",
              pop === "out" && "fav-pop-out",
            )}
            onAnimationEnd={() => setPop("none")}
          />
          {burstKey > 0 && !reduceMotion ? (
            <span
              key={burstKey}
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center text-rose-500"
            >
              <span className="fav-ring absolute h-5 w-5 rounded-full border-2 border-current" />
              {FAVORITE_PARTICLES.map((particle, index) => (
                <span
                  key={index}
                  className="fav-particle absolute h-1 w-1 rounded-full bg-current"
                  style={
                    {
                      "--fav-tx": particle.tx,
                      "--fav-ty": particle.ty,
                    } as CSSProperties
                  }
                />
              ))}
            </span>
          ) : null}
        </span>
        {!compact && <span>{active ? "Favorito" : "Favoritar"}</span>}
      </button>

      <AuthModal
        open={authModalOpen}
        onOpenChange={handleModalOpenChange}
        onAuthenticated={handleAuthenticated}
        title={
          <>
            Faça login pra salvar nos seus{" "}
            <span className="text-amber-700">Favoritos</span>
          </>
        }
        description="Seus favoritos ficam salvos na sua conta."
        pendingIntent={pendingIntent}
      />
    </>
  );
}
