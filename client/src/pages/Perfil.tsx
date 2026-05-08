import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import {
  BookOpen,
  CalendarDays,
  Compass,
  Edit3,
  KeyRound,
  Lock,
  LogOut,
  ShieldAlert,
  Star,
  Trash2,
} from "lucide-react";

import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useFavorites } from "@/hooks/useFavorites";
import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { getStudyEntries, getStudyStats, type StudyEntry, type StudyStats } from "@/services/studyService";
import type { Profile } from "@/services/contracts";

type SubscriptionPlan = {
  name?: string | null;
  code?: string | null;
  price_cents?: number | null;
};

type SubscriptionData = {
  status?: string;
  plans?: SubscriptionPlan | null;
  created_at?: string | null;
  current_period_end?: string | null;
};

type RoadmapProgress = {
  title?: string;
  progress?: number;
  area?: string;
};

const proBenefits = [
  "Quiz de área com IA",
  "Roadmaps completos",
  "Plano de estudos personalizado",
  "Analisador de GitHub",
  "Analisador de currículo com IA",
  "Otimizador de LinkedIn com IA",
  "Comparativo de salários",
  "Análise de empregabilidade",
  "Preparação para entrevistas",
  "Networking e comunidade",
  "Notícias tech filtradas",
  "Comparador de áreas",
];

const modeEmoji: Record<string, string> = {
  produtiva: "🔥",
  ritmo: "⚡",
  dispersa: "🌧",
  revisar: "🧠",
};

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function apiFetch(path: string, options?: RequestInit) {
  const headers = await getAuthHeader();
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}

function initialsFrom(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatCurrencyFromCents(value?: number | null) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((value || 0) / 100);
}

function formatDate(value?: string | null) {
  if (!value) return "Não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function renewalDate(subscription: SubscriptionData | null) {
  if (!subscription?.created_at) return null;
  if (subscription.current_period_end) return subscription.current_period_end;

  const created = new Date(subscription.created_at);
  const code = `${subscription.plans?.code || ""} ${subscription.plans?.name || ""}`.toLowerCase();
  if (code.includes("annual") || code.includes("anual")) created.setFullYear(created.getFullYear() + 1);
  else if (code.includes("semi") || code.includes("semes")) created.setMonth(created.getMonth() + 6);
  else created.setMonth(created.getMonth() + 1);

  return created.toISOString();
}

function truncate(value: string, max = 120) {
  return value.length > max ? `${value.slice(0, max).trim()}...` : value;
}

function EmptyBox({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-[#1a1a1a] bg-white p-5 shadow-[4px_4px_0_#0f172a]">
      <p className="font-display text-xl font-black text-[#1a1a1a]">{title}</p>
      <p className="mt-2 text-sm font-semibold text-slate-500">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export default function Perfil() {
  const [, setLocation] = useLocation();
  const { loading: authLoading, profile, signOut, user } = useAuth();
  const { isPro, loading: subscriptionLoading, subscription, refreshSubscription } = useSubscription();
  const { favorites, loading: favoritesLoading } = useFavorites();
  const [localProfile, setLocalProfile] = useState<Profile | null>(profile);
  const [studyStats, setStudyStats] = useState<StudyStats | null>(null);
  const [recentEntries, setRecentEntries] = useState<StudyEntry[]>([]);
  const [allEntries, setAllEntries] = useState<StudyEntry[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapProgress[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const subscriptionData = subscription as SubscriptionData | null;

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login", { replace: true });
    }
  }, [authLoading, setLocation, user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setDataLoading(true);

    async function loadData() {
      const [statsResult, recentResult, allResult, roadmapResult] = await Promise.allSettled([
        getStudyStats("7d"),
        getStudyEntries({ limit: 3 }),
        getStudyEntries({ limit: 100 }),
        apiFetch("/api/me/roadmaps"),
      ]);

      if (cancelled) return;
      setStudyStats(statsResult.status === "fulfilled" ? statsResult.value : null);
      setRecentEntries(recentResult.status === "fulfilled" ? recentResult.value : []);
      setAllEntries(allResult.status === "fulfilled" ? allResult.value : []);
      setRoadmaps(roadmapResult.status === "fulfilled" && Array.isArray(roadmapResult.value.data) ? roadmapResult.value.data : []);
      setDataLoading(false);
    }

    void loadData().catch(() => {
      if (!cancelled) {
        setStudyStats(null);
        setRecentEntries([]);
        setAllEntries([]);
        setRoadmaps([]);
        setDataLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const userName = localProfile?.name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Perfil";
  const username = localProfile?.handle || user?.user_metadata?.username || user?.email?.split("@")[0] || "bora.na.tech";
  const email = localProfile?.email || user?.email || "";
  const avatarUrl = localProfile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initials = initialsFrom(userName) || "BT";
  const planName = subscriptionData?.plans?.name || (isPro ? "Pro" : "Gratuito");
  const planPrice = subscriptionData?.plans?.price_cents ? formatCurrencyFromCents(subscriptionData.plans.price_cents) : "Não informado";

  const metricCards = useMemo(
    () => [
      {
        label: "Sessões de estudo",
        value: dataLoading ? "..." : String(allEntries.length),
        detail: allEntries.length ? "Registros no diário" : "Comece estudando hoje",
        icon: <BookOpen className="h-6 w-6" />,
      },
      {
        label: "Streak atual",
        value: dataLoading ? "..." : String(studyStats?.current_streak || 0),
        detail: (studyStats?.current_streak || 0) > 0 ? "dias em sequência" : "Comece estudando hoje",
        icon: <CalendarDays className="h-6 w-6" />,
      },
      {
        label: "Favoritos salvos",
        value: favoritesLoading ? "..." : String(favorites.length),
        detail: favorites.length ? "itens guardados" : "Comece salvando conteúdos",
        icon: <Star className="h-6 w-6" />,
      },
    ],
    [allEntries.length, dataLoading, favorites.length, favoritesLoading, studyStats?.current_streak],
  );

  function openEditProfile() {
    setEditName(userName);
    setEditingProfile(true);
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const json = await apiFetch("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ name: editName.trim() }),
      });
      setLocalProfile(json.data);
      toast.success("Perfil atualizado com sucesso.");
      setEditingProfile(false);
    } catch {
      toast.error("Não foi possível salvar o perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Você saiu da plataforma.");
      setLocation("/login", { replace: true });
    } catch {
      toast.error("Não foi possível sair agora. Tente novamente.");
    }
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    try {
      await apiFetch("/api/me", { method: "DELETE" });
      await supabase?.auth.signOut();
      toast.success("Sua conta foi excluída.");
      setLocation("/", { replace: true });
    } catch {
      toast.error("Não foi possível excluir sua conta. Tente novamente.");
    } finally {
      setDeletingAccount(false);
    }
  }

  if (authLoading || !user) {
    return (
      <Layout>
        <SEO title="Perfil — Bora na Tech?" url="/perfil" noindex />
        <section className="bg-[#f5f0e8] py-16">
          <div className="container">
            <div className="mx-auto max-w-lg rounded-3xl border-2 border-[#1a1a1a] bg-white p-8 text-center shadow-[4px_4px_0_#0f172a]">
              <p className="font-display text-2xl font-black text-[#1a1a1a]">Carregando seu perfil...</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">Verificando sua sessão com segurança.</p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Perfil — Bora na Tech?" url="/perfil" noindex />
      <section className="bg-[#f5f0e8] py-12">
        <div className="container space-y-8">
          <div className="rounded-[2rem] border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a] md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] font-display text-4xl font-black text-[#1a1a1a] shadow-[4px_4px_0_#0f172a]">
                  {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
                </div>
                <div>
                  <span className={`mb-3 inline-flex rounded-full border-2 border-[#1a1a1a] px-3 py-1 text-xs font-black ${isPro ? "bg-[#FFB800] text-[#1a1a1a]" : "bg-slate-100 text-slate-700"}`}>
                    {subscriptionLoading ? "CARREGANDO" : isPro ? "PRO ⚡" : "GRATUITO"}
                  </span>
                  <h1 className="font-display text-4xl font-black text-[#1a1a1a] md:text-5xl">{userName}</h1>
                  <p className="mt-2 text-lg font-black text-slate-500">@{String(username).replace(/^@/, "")}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-400">{email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={openEditProfile}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-5 py-3 font-black text-[#1a1a1a] shadow-[4px_4px_0_#0f172a]"
              >
                <Edit3 className="h-5 w-5" />
                Editar perfil
              </button>
            </div>

            {editingProfile ? (
              <div className="mt-6 rounded-3xl border-2 border-[#1a1a1a] bg-[#f5f0e8] p-5 shadow-[4px_4px_0_#0f172a]">
                <h2 className="font-display text-2xl font-black text-[#1a1a1a]">Editar perfil</h2>
                <label className="mt-4 block text-sm font-black text-[#1a1a1a]">
                  Nome completo
                  <input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    className="mt-2 w-full rounded-2xl border-2 border-[#1a1a1a] bg-white px-4 py-3 font-bold outline-none focus:ring-4 focus:ring-yellow-200"
                  />
                </label>
                <div className="mt-5 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingProfile(false)} className="rounded-full border-2 border-[#1a1a1a] bg-white px-5 py-2 font-black">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveProfile()}
                    disabled={savingProfile}
                    className="rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-5 py-2 font-black shadow-[3px_3px_0_#0f172a] disabled:opacity-60"
                  >
                    {savingProfile ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <section className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase text-slate-500">Minha assinatura</p>
                <h2 className="font-display mt-1 text-3xl font-black text-[#1a1a1a]">
                  {subscriptionLoading ? "Carregando plano..." : isPro ? `${planName}` : "Plano Gratuito — recursos limitados"}
                </h2>
              </div>
              {isPro ? <span className="rounded-full border-2 border-emerald-900 bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">ATIVO</span> : null}
            </div>

            {subscriptionLoading ? (
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
              </div>
            ) : isPro ? (
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                {[
                  ["Valor", planPrice],
                  ["Início", formatDate(subscriptionData?.created_at)],
                  ["Renovação", formatDate(renewalDate(subscriptionData))],
                  ["Status", subscriptionData?.status || "active"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border-2 border-[#1a1a1a] bg-[#f5f0e8] p-4">
                    <p className="text-xs font-black uppercase text-slate-500">{label}</p>
                    <p className="mt-1 text-sm font-black">{value}</p>
                  </div>
                ))}
                <div className="md:col-span-4">
                  <button type="button" onClick={() => setCancelModalOpen(true)} className="rounded-full border-2 border-[#1a1a1a] bg-white px-5 py-3 font-black text-[#1a1a1a] shadow-[3px_3px_0_#0f172a]">
                    Cancelar assinatura
                  </button>
                  <p className="mt-3 text-sm font-semibold text-slate-500">Cancele quando quiser, sem taxa.</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                <div className="grid gap-2 md:grid-cols-2">
                  {proBenefits.map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2 rounded-2xl border-2 border-[#1a1a1a] bg-slate-50 p-3 text-sm font-black text-slate-700">
                      <Lock className="h-4 w-4 text-slate-500" />
                      {benefit}
                    </div>
                  ))}
                </div>
                <div className="rounded-3xl border-2 border-[#1a1a1a] bg-[#FFB800] p-6 shadow-[4px_4px_0_#0f172a]">
                  <p className="font-display text-2xl font-black text-[#1a1a1a]">Desbloqueie tudo.</p>
                  <p className="mt-2 text-sm font-bold text-[#1a1a1a]">A partir de R$ 14,99/mês no plano anual.</p>
                  <Link href="/pro" className="mt-5 inline-flex w-full items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-white px-5 py-3 font-black shadow-[3px_3px_0_#0f172a]">
                    Assinar Pro ⚡
                  </Link>
                </div>
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display text-3xl font-black text-[#1a1a1a]">Meu progresso</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {metricCards.map((metric) => (
                <div key={metric.label} className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-5 shadow-[4px_4px_0_#0f172a]">
                  <span className="inline-flex rounded-2xl border-2 border-[#1a1a1a] bg-[#FFB800] p-3 text-[#1a1a1a]">{metric.icon}</span>
                  <p className="mt-4 text-xs font-black uppercase text-slate-500">{metric.label}</p>
                  <p className="font-display mt-1 text-4xl font-black text-[#1a1a1a]">{metric.value}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-500">{metric.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-3xl font-black text-[#1a1a1a]">Diário de estudos</h2>
                <Link href="/estudos/diario" className="rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#0f172a]">
                  Abrir diário completo
                </Link>
              </div>
              <div className="mt-5 space-y-3">
                {recentEntries.length ? (
                  recentEntries.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="rounded-2xl border-2 border-[#1a1a1a] bg-[#f5f0e8] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-black text-[#1a1a1a]">{formatDate(entry.studied_at)}</p>
                        <span className="rounded-full border-2 border-[#1a1a1a] bg-white px-3 py-1 text-xs font-black">
                          {modeEmoji[entry.mode] || "📝"} {entry.minutes} min
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-600">{truncate(entry.text)}</p>
                    </div>
                  ))
                ) : (
                  <EmptyBox
                    title="Nenhuma entrada ainda"
                    text="Crie sua primeira entrada para acompanhar consistência e evolução."
                    action={<Link href="/estudos/diario" className="rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#0f172a]">Criar primeira entrada</Link>}
                  />
                )}
              </div>
            </div>

            <div className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]">
              <h2 className="font-display text-3xl font-black text-[#1a1a1a]">Minhas trilhas</h2>
              <div className="mt-5 space-y-3">
                {roadmaps.length ? (
                  roadmaps.map((roadmap, index) => (
                    <div key={`${roadmap.title}-${index}`} className="rounded-2xl border-2 border-[#1a1a1a] bg-[#f5f0e8] p-4">
                      <p className="font-display text-xl font-black text-[#1a1a1a]">{roadmap.title || "Roadmap em andamento"}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{roadmap.area || "Área não informada"}</p>
                      <div className="mt-3 h-3 rounded-full border-2 border-[#1a1a1a] bg-white">
                        <div className="h-full rounded-full bg-[#FFB800]" style={{ width: `${Math.min(Math.max(roadmap.progress || 0, 0), 100)}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyBox
                    title="Nenhuma trilha iniciada ainda"
                    text="Escolha um caminho e comece por etapas pequenas."
                    action={<Link href="/roadmaps" className="inline-flex items-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#0f172a]"><Compass className="h-4 w-4" /> Ver roadmaps</Link>}
                  />
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]">
            <h2 className="font-display text-3xl font-black text-[#1a1a1a]">Configurações da conta</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Link href="/nova-senha" className="flex items-center justify-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-[#f5f0e8] px-5 py-3 font-black shadow-[3px_3px_0_#0f172a]">
                <KeyRound className="h-5 w-5" />
                Trocar senha
              </Link>
              <button type="button" onClick={() => void handleSignOut()} className="flex items-center justify-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-5 py-3 font-black shadow-[3px_3px_0_#0f172a]">
                <LogOut className="h-5 w-5" />
                Sair
              </button>
              <button type="button" onClick={() => setDeleteModalOpen(true)} className="flex items-center justify-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-rose-100 px-5 py-3 font-black text-rose-800 shadow-[3px_3px_0_#0f172a]">
                <Trash2 className="h-5 w-5" />
                Excluir conta
              </button>
            </div>
          </section>

          {cancelModalOpen ? (
            <div className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]">
              <h2 className="font-display flex items-center gap-2 text-2xl font-black text-[#1a1a1a]"><ShieldAlert className="h-6 w-6" /> Cancelamento</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">O cancelamento será implementado em uma próxima etapa. Por enquanto, entre em contato com suporte.</p>
              <button type="button" onClick={() => setCancelModalOpen(false)} className="mt-4 rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-5 py-2 font-black shadow-[3px_3px_0_#0f172a]">Fechar</button>
            </div>
          ) : null}

          {deleteModalOpen ? (
            <div className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]">
              <h2 className="font-display flex items-center gap-2 text-2xl font-black text-rose-800"><Trash2 className="h-6 w-6" /> Excluir conta</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Esta ação é permanente e irreversível. Todos os seus dados, favoritos, histórico de estudos e assinatura serão apagados.
              </p>
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => setDeleteModalOpen(false)} disabled={deletingAccount} className="rounded-full border-2 border-[#1a1a1a] bg-white px-5 py-2 font-black disabled:opacity-60">Cancelar</button>
                <button
                  type="button"
                  onClick={() => void handleDeleteAccount()}
                  disabled={deletingAccount}
                  className="rounded-full border-2 border-[#1a1a1a] bg-rose-100 px-5 py-2 font-black text-rose-800 disabled:opacity-60"
                >
                  {deletingAccount ? "Excluindo..." : "Confirmar exclusão"}
                </button>
              </div>
            </div>
          ) : null}

          <button type="button" onClick={() => void refreshSubscription()} className="hidden">
            Atualizar assinatura
          </button>
        </div>
      </section>
    </Layout>
  );
}
