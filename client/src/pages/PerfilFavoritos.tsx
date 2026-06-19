import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Heart } from "lucide-react";
import { toast } from "sonner";

import {
  FavoriteCard,
  getFavoriteTypeMeta,
} from "@/components/favorites/FavoriteCard";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import {
  useFavorites,
  type FavoriteItem,
  type FavoriteType,
} from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

const TAB_ORDER: FavoriteType[] = [
  "noticia",
  "roadmap",
  "curso",
  "area",
  "conceito",
  "projeto",
  "plataforma",
  "faculdade",
  "tecnologia",
  "empresa",
  "vaga",
  "evento",
  "comunidade",
  "dica",
];

const OTHERS_TAB = "__outros__";
type TabKey = FavoriteType | typeof OTHERS_TAB;
const KNOWN_TYPES = new Set<string>(TAB_ORDER);

function favKey(item: Pick<FavoriteItem, "type" | "id">) {
  return `${item.type}:${item.id}`;
}

export default function PerfilFavoritos() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading, toggleFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login", { replace: true });
    }
  }, [authLoading, user, setLocation]);

  const visibleFavorites = useMemo(
    () => favorites.filter((f) => Boolean(f.title?.trim())),
    [favorites],
  );

  const otherFavorites = useMemo(
    () => visibleFavorites.filter((f) => !KNOWN_TYPES.has(f.type)),
    [visibleFavorites],
  );

  const tabsWithData = useMemo<TabKey[]>(() => {
    const known = TAB_ORDER.filter((type) =>
      visibleFavorites.some((f) => f.type === type),
    );
    return otherFavorites.length > 0 ? [...known, OTHERS_TAB] : known;
  }, [visibleFavorites, otherFavorites]);

  useEffect(() => {
    if (tabsWithData.length === 0) {
      setActiveTab(null);
      return;
    }
    if (!activeTab || !tabsWithData.includes(activeTab)) {
      setActiveTab(tabsWithData[0]);
    }
  }, [tabsWithData, activeTab]);

  const itemsInTab = useMemo(() => {
    if (!activeTab) return [];
    if (activeTab === OTHERS_TAB) return otherFavorites;
    return visibleFavorites.filter((f) => f.type === activeTab);
  }, [visibleFavorites, otherFavorites, activeTab]);

  async function handleRemove(item: FavoriteItem) {
    const key = favKey(item);
    setRemovingKey(key);
    const result = await toggleFavorite(item);
    setRemovingKey(null);

    if (!result.ok) {
      toast.error("Não foi possível remover. Tente novamente.");
      return;
    }

    toast.success("Removido dos Favoritos", {
      duration: 5000,
      action: {
        label: "Desfazer",
        onClick: () => {
          void toggleFavorite(item).catch(() => {
            toast.error("Não foi possível desfazer. Tente novamente.");
          });
        },
      },
    });
  }

  if (authLoading || !user) {
    return (
      <Layout>
        <SEO
          title="Favoritos · Bora na Tech?"
          url="/perfil/favoritos"
          noindex
        />
        <section className="bg-[#faf8f4] py-12">
          <div className="container">
            <p className="text-sm text-slate-500">Carregando…</p>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Favoritos · Bora na Tech?" url="/perfil/favoritos" noindex />

      <section className="border-b-2 border-slate-900 bg-[#faf8f4] py-10">
        <div className="container">
          <Link
            href="/perfil"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar ao perfil
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span
              aria-hidden
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-slate-900 bg-rose-100 text-rose-700 shadow-[3px_3px_0_#0f172a]"
            >
              <Heart className="h-5 w-5 fill-current" />
            </span>
            <div>
              <h1 className="font-display text-3xl font-black leading-tight text-slate-950 md:text-4xl">
                Seus favoritos
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {loading
                  ? "Carregando…"
                  : visibleFavorites.length === 0
                    ? "Você ainda não favoritou nada."
                    : `${visibleFavorites.length} ${visibleFavorites.length === 1 ? "item salvo" : "itens salvos"}`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#faf8f4] pb-16 pt-6">
        <div className="container">
          {loading ? (
            <p className="text-sm text-slate-500">Carregando seus favoritos…</p>
          ) : visibleFavorites.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div
                role="tablist"
                aria-label="Filtrar favoritos por tipo"
                className="flex flex-wrap gap-2"
              >
                {tabsWithData.map((tab) => {
                  const meta = getFavoriteTypeMeta(tab);
                  const count =
                    tab === OTHERS_TAB
                      ? otherFavorites.length
                      : visibleFavorites.filter((f) => f.type === tab).length;
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-black uppercase tracking-wide transition-all",
                        isActive
                          ? "border-slate-900 bg-[#FFB800] text-slate-950 shadow-[3px_3px_0_#0f172a]"
                          : "border-slate-300 bg-white text-slate-700 hover:border-slate-900",
                      )}
                    >
                      <meta.Icon
                        className="h-3.5 w-3.5"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      {meta.label}
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-[10px] font-black",
                          isActive
                            ? "bg-slate-950 text-[#FFB800]"
                            : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                role="tabpanel"
                aria-label={
                  activeTab
                    ? `Favoritos de ${getFavoriteTypeMeta(activeTab).label}`
                    : undefined
                }
                className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {itemsInTab.map((item) => (
                  <FavoriteCard
                    key={favKey(item)}
                    item={item}
                    isRemoving={removingKey === favKey(item)}
                    onRemove={() => handleRemove(item)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
      <span
        aria-hidden
        className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-slate-900 bg-rose-100 text-rose-700 shadow-[3px_3px_0_#0f172a]"
      >
        <Heart className="h-6 w-6" />
      </span>
      <h2 className="font-display mt-4 text-2xl font-black text-slate-950">
        Nada salvo por aqui ainda
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        Clica no coração em qualquer card pra guardar pra depois. Notícias,
        roadmaps, cursos e áreas que você favoritar aparecem aqui.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/noticias"
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-[#FFB800] px-4 py-2 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] hover:-translate-y-0.5"
        >
          Explorar notícias
        </Link>
        <Link
          href="/roadmaps"
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] hover:-translate-y-0.5"
        >
          Ver roadmaps
        </Link>
        <Link
          href="/areas"
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] hover:-translate-y-0.5"
        >
          Áreas de TI
        </Link>
      </div>
    </div>
  );
}
