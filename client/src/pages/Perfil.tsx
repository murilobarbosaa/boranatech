import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { ArrowRight, BookMarked, CalendarDays, Compass, Edit3, GraduationCap, Heart, Lightbulb, Newspaper, Users } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useFavorites, type FavoriteItem, type FavoriteType } from "@/hooks/useFavorites";
import { getQuizHistory } from "@/services/careerQuizService";
import { getStudyStats, type StudyStats } from "@/services/studyService";

type ProfileSection = {
  title: string;
  icon: ReactNode;
  items: Array<{ title: string; subtitle?: string }>;
};

const favoriteSections: Record<FavoriteType, { title: string; icon: ReactNode }> = {
  area: { title: "Áreas favoritadas", icon: <Compass className="h-5 w-5" /> },
  roadmap: { title: "Roadmaps favoritados", icon: <Heart className="h-5 w-5" /> },
  curso: { title: "Aulas para depois", icon: <BookMarked className="h-5 w-5" /> },
  projeto: { title: "Projetos salvos", icon: <Edit3 className="h-5 w-5" /> },
  dica: { title: "Dicas salvas", icon: <Lightbulb className="h-5 w-5" /> },
  conceito: { title: "Conceitos salvos", icon: <BookMarked className="h-5 w-5" /> },
  plataforma: { title: "Plataformas salvas", icon: <Compass className="h-5 w-5" /> },
  evento: { title: "Eventos salvos", icon: <Users className="h-5 w-5" /> },
  noticia: { title: "Notícias salvas", icon: <Newspaper className="h-5 w-5" /> },
  comunidade: { title: "Comunidades salvas", icon: <Users className="h-5 w-5" /> },
  faculdade: { title: "Faculdades salvas", icon: <GraduationCap className="h-5 w-5" /> },
  tecnologia: { title: "Tecnologias salvas", icon: <Compass className="h-5 w-5" /> },
  empresa: { title: "Empresas salvas", icon: <Users className="h-5 w-5" /> },
  vaga: { title: "Vagas salvas", icon: <BookMarked className="h-5 w-5" /> },
  dicionario: { title: "Conceitos do dicionário", icon: <BookMarked className="h-5 w-5" /> },
};

function groupFavorites(favorites: FavoriteItem[]) {
  return favorites.reduce<Record<FavoriteType, FavoriteItem[]>>((acc, favorite) => {
    acc[favorite.type] = [...(acc[favorite.type] || []), favorite];
    return acc;
  }, {} as Record<FavoriteType, FavoriteItem[]>);
}

export default function Perfil() {
  const [, setLocation] = useLocation();
  const { loading, profile, signOut, user } = useAuth();
  const { isPro, loading: subscriptionLoading } = useSubscription();
  const { favorites } = useFavorites();
  const [studyStats, setStudyStats] = useState<StudyStats | null>(null);
  const [quizHistory, setQuizHistory] = useState<Array<{ id: string; completed_at: string; result_area: string; confidence: number | null }>>([]);
  const userName = profile?.name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Perfil";
  const userHandle = profile?.handle ? `@${profile.handle.replace(/^@/, "")}` : user?.email ? `@${user.email.split("@")[0]}` : "@bora.na.tech";
  const userEmail = profile?.email || user?.email;
  const profileTrails = profile?.area_interesse ? [{ title: profile.area_interesse, subtitle: profile.nivel_atual || undefined }] : [];
  const groupedFavorites = groupFavorites(favorites);
  const sections: ProfileSection[] = [
    { title: "Minhas trilhas", items: profileTrails, icon: <Compass className="h-5 w-5" /> },
    ...Object.entries(favoriteSections).map(([type, section]) => ({
      ...section,
      items: groupedFavorites[type as FavoriteType] || [],
    })),
  ].filter((section) => section.title === "Minhas trilhas" || section.items.length > 0);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login", { replace: true });
    }
  }, [loading, setLocation, user]);

  useEffect(() => {
    if (!user) {
      setStudyStats(null);
      setQuizHistory([]);
      return;
    }

    getStudyStats("30d")
      .then(setStudyStats)
      .catch(() => setStudyStats(null));
    getQuizHistory()
      .then(setQuizHistory)
      .catch(() => setQuizHistory([]));
  }, [user]);

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Você saiu da plataforma.");
      setLocation("/login", { replace: true });
    } catch {
      toast.error("Não foi possível sair agora. Tente novamente.");
    }
  }

  if (loading || !user) {
    return (
      <Layout>
        <section className="hero-pattern py-16">
          <div className="container">
            <div className="card-brutal mx-auto max-w-lg rounded-3xl bg-white p-8 text-center">
              <p className="font-display text-2xl font-black text-slate-950">Carregando seu perfil...</p>
              <p className="mt-2 text-sm text-slate-950">Verificando sua sessão com segurança.</p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="hero-pattern border-b-2 border-slate-900 py-12">
        <div className="container flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="social-badge mb-4 inline-flex px-3 py-1 text-xs font-black uppercase">perfil conectado</p>
            <h1 className="font-display text-4xl font-black text-slate-950">Sua bússola salva em um lugar só.</h1>
            <p className="mt-3 max-w-2xl text-slate-950">
              Você está logado na plataforma. Seus caminhos, cursos e favoritos ficam vinculados a esta conta.
            </p>
          </div>
          <div className="card-brutal rounded-2xl bg-white p-4">
            <p className="font-display text-xl font-black text-slate-950">{userName}</p>
            <p className="text-sm font-bold text-violet-700">{userHandle}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{userEmail}</p>
            <button
              className="mt-3 w-full rounded-full border-2 border-slate-900 bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-800"
              disabled
              type="button"
            >
              Plano atual: {subscriptionLoading ? "Carregando..." : isPro ? "Pro" : "Gratuito"}
            </button>
            <div className="mt-3 flex gap-2">
              <Link href="/nova-senha" className="rounded-full border-2 border-slate-900 px-3 py-1.5 text-xs font-black">Trocar senha</Link>
              <button className="btn-brutal-accent rounded-full px-3 py-1.5 text-xs font-black" onClick={handleSignOut} type="button">
                Sair
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container space-y-8">
          <div className="grid gap-5 lg:grid-cols-3">
            <Link href="/estudos/diario" className="card-brutal rounded-3xl bg-violet-700 p-6 text-white transition-all hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#0f172a] lg:col-span-2">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-950 bg-amber-300 text-slate-950 shadow-[4px_4px_0_#0f172a]">
                    <CalendarDays className="h-7 w-7" />
                  </span>
                  <div>
                    <p className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase text-violet-100">bem fácil de achar</p>
                    <h2 className="font-display text-3xl font-black">Diário de Estudos</h2>
                    <p className="mt-2 max-w-xl text-sm font-medium text-violet-100">
                      Registre o que estudou, tempo dedicado, como foi a sessão e acompanhe sua consistência — só pelo seu perfil.
                    </p>
                    <p className="mt-3 text-sm font-black text-white">
                      {studyStats
                        ? `${studyStats.current_streak} dias de sequência · ${Math.round((studyStats.total_minutes || 0) / 60)}h no mês · ${studyStats.days_studied} dias estudados`
                        : "Resumo de estudos carregando..."}
                    </p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-2 rounded-full border-2 border-white bg-white px-4 py-2 text-sm font-black text-violet-800">
                  Abrir diário <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>

            <div className="card-invite rounded-3xl bg-white p-6">
              <h2 className="font-display text-xl font-black text-slate-950">Central de estudos</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">Acesse ferramentas para planejar rotina e acompanhar sua evolução.</p>
              <div className="mt-5 flex flex-col gap-2">
                <Link href="/estudos" className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-center text-sm font-black text-slate-950 hover:bg-amber-100">
                  Ferramentas de estudo
                </Link>
                <Link href="/roadmaps" className="rounded-full border-2 border-slate-900 bg-violet-50 px-4 py-2 text-center text-sm font-black text-violet-800 hover:bg-violet-100">
                  Ver roadmaps
                </Link>
              </div>
            </div>
          </div>

          {quizHistory.length > 0 && (
            <div className="card-invite rounded-3xl bg-white p-6">
              <h2 className="font-display text-xl font-black text-slate-950">Histórico do quiz de carreira</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {quizHistory.slice(0, 3).map((attempt) => (
                  <div key={attempt.id} className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-4">
                    <p className="font-display text-lg font-black text-slate-950">{attempt.result_area}</p>
                    <p className="mt-1 text-xs font-bold text-violet-700">
                      {attempt.confidence ?? 0}% de confiança ·{" "}
                      {new Date(attempt.completed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <div key={section.title} className="card-invite rounded-2xl bg-white p-6">
              <h2 className="font-display mb-4 flex items-center gap-2 text-xl font-black text-slate-950">
                <span className="rounded-xl border-2 border-slate-900 bg-amber-300 p-2">{section.icon}</span>
                {section.title}
              </h2>
              {section.items.length > 0 ? (
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={`${section.title}-${item.title}`} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                      <span>{item.title}</span>
                      {item.subtitle && <span className="mt-0.5 block text-xs font-medium text-slate-400">{item.subtitle}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">Nada salvo ainda.</p>
              )}
            </div>
          ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
