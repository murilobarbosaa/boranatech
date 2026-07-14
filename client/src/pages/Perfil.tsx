import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import {
  BookOpen,
  Check,
  Edit3,
  FileText,
  Flame,
  Github,
  KeyRound,
  Linkedin,
  LogOut,
  MapPin,
  MessageSquare,
  Star,
  Trash2,
} from "lucide-react";

import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import UserAvatar, { effectiveOwnAvatar } from "@/components/UserAvatar";
import AvatarPhotoPanel from "@/components/profile/AvatarPhotoPanel";
import { CancelSubscriptionModal } from "@/components/profile/CancelSubscriptionModal";
import { ConquistasPreview } from "@/components/profile/ConquistasPreview";
import { ProfileBackground } from "@/components/profile/ProfileBackground";
import { SignOutConfirmModal } from "@/components/profile/SignOutConfirmModal";
import ProGate from "@/components/pro/ProGate";
import { ProInlineBadge, ProStarIcon } from "@/components/pro/ProStarIcon";
import ProUpsellModal from "@/components/pro/ProUpsellModal";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useFavorites } from "@/hooks/useFavorites";
import {
  avatarBgOptions,
  avatarBorderOptions,
  avatarIconOptions,
  defaultAvatarBg,
  defaultAvatarBorder,
  defaultAvatarIcon,
  normalizeAvatarBg,
  normalizeAvatarBorder,
  normalizeAvatarIcon,
  resolveEffectiveBorder,
  type AvatarBgId,
  type AvatarBorderId,
  type AvatarIconId,
} from "@/constants/avatarOptions";
import { apiUrl } from "@/lib/api";
import { showActionToast, showErrorToast } from "@/lib/notify";
import { supabase } from "@/lib/supabase";
import {
  getStatusLabel,
  type SubscriptionStatusVariant,
} from "@/lib/subscriptionLabels";
import {
  getStudyEntries,
  getStudyHeatmap,
  getStudyStats,
  type StudyEntry,
  type StudyHeatmapDay,
  type StudyStats,
} from "@/services/studyService";
import { getQuizHistory } from "@/services/careerQuizService";
import {
  applyGoogleAvatar,
  describeAvatarError,
  removeAvatar,
  uploadAvatar,
  type PendingPhoto,
} from "@/services/avatarService";
import type { Profile } from "@/services/contracts";
import { updateMyProfile } from "@/services/profileService";
import { greet } from "@shared/greeting";

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
  cancel_at_period_end?: boolean;
};

type CancelReasonCode =
  | "expensive"
  | "unused"
  | "missing_feature"
  | "paused"
  | "other";

const HEATMAP_TOTAL_WEEKS = 52;
const HEATMAP_DAYS = 365;

type RoadmapProgress = {
  id: string;
  slug: string;
  title: string;
  areaSlug?: string | null;
  total_steps: number;
  completed_steps: number;
  progress: number;
};

type QuizAttempt = {
  result_area: string;
  result_area_slug: string | null;
  confidence: number | null;
  completed_at: string;
};

type AvatarSection = "border" | "icon" | "bg" | "photo";

const avatarSections: Array<{
  id: AvatarSection;
  label: string;
  title: string;
  description: string;
}> = [
  {
    id: "border",
    label: "Borda",
    title: "Escolha a borda",
    description: "A cor da borda também define o offset visual do avatar.",
  },
  {
    id: "icon",
    label: "Ícone",
    title: "Escolha o ícone",
    description: "Use iniciais ou um símbolo que combine com sua jornada.",
  },
  {
    id: "bg",
    label: "Fundo",
    title: "Escolha o fundo",
    description: "Combine a cor de fundo com a borda e o ícone escolhidos.",
  },
  {
    id: "photo",
    label: "Foto",
    title: "Foto de perfil",
    description:
      "Use uma foto no lugar do ícone. A foto substitui ícone e fundo; a borda continua valendo.",
  },
];

const modeEmoji: Record<string, string> = {
  produtiva: "🔥",
  ritmo: "⚡",
  dispersa: "🌧",
  revisar: "🧠",
};

const statusBadgeStyles: Record<SubscriptionStatusVariant, string> = {
  success: "bg-emerald-200 text-emerald-900 border-emerald-700",
  warning: "bg-amber-200 text-amber-900 border-amber-700",
  danger: "bg-rose-200 text-rose-900 border-rose-700",
  neutral: "bg-slate-200 text-slate-900 border-slate-700",
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

function formatCurrencyFromCents(value?: number | null) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((value || 0) / 100);
}

function formatDate(value?: string | null) {
  if (!value) return "Não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatPeriodEnd(periodEnd?: string | null) {
  return formatDate(periodEnd);
}

function formatProSince(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function truncate(value: string, max = 120) {
  return value.length > max ? `${value.slice(0, max).trim()}...` : value;
}

function toSaoPauloDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getHeatmapCellColor(minutes: number) {
  if (minutes <= 0) return "bg-slate-100 border-slate-200";
  if (minutes < 30) return "bg-emerald-200 border-emerald-400";
  if (minutes < 60) return "bg-emerald-400 border-emerald-600";
  if (minutes < 120) return "bg-emerald-600 border-emerald-800";
  return "bg-emerald-800 border-emerald-950";
}

function optionButtonClass(selected: boolean, accentClassName?: string) {
  if (selected) {
    return `border-2 bg-white shadow-[2px_2px_0_#0f172a] ${accentClassName || "border-[#1a1a1a] text-[#1a1a1a]"}`;
  }

  return "border border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50";
}

type AvatarGridOption<T extends string> = {
  id: T;
  label: string;
  accentClassName?: string;
  pro?: boolean;
};

function AvatarOptionGrid<T extends string>({
  title,
  options,
  selected,
  onSelect,
  renderPreview,
  isPro = false,
  onProLockedClick,
}: {
  title: string;
  options: AvatarGridOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  renderPreview: (option: AvatarGridOption<T>) => ReactNode;
  isPro?: boolean;
  onProLockedClick?: () => void;
}) {
  return (
    <section aria-label={`Opções de ${title.toLowerCase()}`}>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {options.map((option) => {
          const isSelected = selected === option.id;
          const locked = option.pro === true && !isPro;

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              aria-disabled={locked || undefined}
              onClick={() =>
                locked ? onProLockedClick?.() : onSelect(option.id)
              }
              className={`relative flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-2 text-center transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-200 ${optionButtonClass(
                isSelected,
                option.accentClassName,
              )}`}
            >
              {isSelected ? (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1a1a1a] text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              ) : null}
              {option.pro ? (
                <span className="absolute left-1.5 top-1.5">
                  <ProStarIcon />
                </span>
              ) : null}
              {renderPreview(option)}
              <span className="text-[11px] font-black leading-tight sm:text-xs">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AvatarSectionTabs({
  active,
  onChange,
}: {
  active: AvatarSection;
  onChange: (section: AvatarSection) => void;
}) {
  return (
    <div
      className="grid grid-cols-4 gap-1 rounded-2xl border border-slate-200 bg-white p-1"
      role="tablist"
      aria-label="Categoria do avatar"
    >
      {avatarSections.map((section) => {
        const selected = active === section.id;

        return (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(section.id)}
            className={`rounded-xl px-2 py-2 text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-200 ${
              selected
                ? "border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[2px_2px_0_#0f172a]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {section.label}
          </button>
        );
      })}
    </div>
  );
}

type MetricVariant = "market" | "technical" | "application";

const metricCardStyles: Record<MetricVariant, { card: string; icon: string }> =
  {
    market: {
      card: "bg-amber-50 border-amber-300 text-amber-900",
      icon: "bg-amber-200 text-amber-800",
    },
    technical: {
      card: "bg-emerald-50 border-emerald-300 text-emerald-900",
      icon: "bg-emerald-200 text-emerald-800",
    },
    application: {
      card: "bg-blue-50 border-blue-300 text-blue-900",
      icon: "bg-blue-200 text-blue-800",
    },
  };

function MetricCard({
  icon,
  label,
  value,
  unit,
  variant,
  subtext,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  unit: string;
  variant: MetricVariant;
  subtext?: string | null;
}) {
  const styles = metricCardStyles[variant];

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 ${styles.card}`}
    >
      <div
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
          {label}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-xl font-black leading-none">
            {value}
          </span>
          <span className="font-mono text-[11px] opacity-70">{unit}</span>
        </div>
        {subtext ? (
          <p className="mt-0.5 truncate font-mono text-[10px] opacity-60">
            {subtext}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function StreakHeatmap({
  data,
  isEmpty,
}: {
  data: StudyHeatmapDay[];
  isEmpty: boolean;
}) {
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of data) map.set(day.date, day.minutes);
    return map;
  }, [data]);

  const todayStr = useMemo(() => toSaoPauloDateString(new Date()), []);
  const totalWeeks = HEATMAP_TOTAL_WEEKS;

  const weeks = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToSaturday = 6 - dayOfWeek;
    const lastSaturday = new Date(today);
    lastSaturday.setDate(today.getDate() + daysToSaturday);

    const result: Array<
      Array<{
        dateStr: string;
        minutes: number;
        label: string;
        isToday: boolean;
        isFuture: boolean;
        month: number;
      }>
    > = [];

    for (let weekOffset = totalWeeks - 1; weekOffset >= 0; weekOffset--) {
      const week: Array<{
        dateStr: string;
        minutes: number;
        label: string;
        isToday: boolean;
        isFuture: boolean;
        month: number;
      }> = [];

      for (let dayInWeek = 0; dayInWeek < 7; dayInWeek++) {
        const date = new Date(lastSaturday);
        date.setDate(lastSaturday.getDate() - weekOffset * 7 - (6 - dayInWeek));

        const dateStr = toSaoPauloDateString(date);
        const minutes = dataMap.get(dateStr) || 0;
        const label = date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        const isToday = dateStr === todayStr;
        const isFuture = date > today;
        const month = date.getMonth();

        week.push({ dateStr, minutes, label, isToday, isFuture, month });
      }

      result.push(week);
    }

    return result;
  }, [dataMap, todayStr, totalWeeks]);

  const monthLabels = useMemo(() => {
    const labels: Array<{ weekIdx: number; label: string }> = [];
    const monthNames = [
      "jan",
      "fev",
      "mar",
      "abr",
      "mai",
      "jun",
      "jul",
      "ago",
      "set",
      "out",
      "nov",
      "dez",
    ];
    let lastMonth = -1;

    weeks.forEach((week, weekIdx) => {
      const firstDay = week[0];
      if (firstDay.month !== lastMonth) {
        labels.push({ weekIdx, label: monthNames[firstDay.month] });
        lastMonth = firstDay.month;
      }
    });

    return labels;
  }, [weeks]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-sm font-black text-slate-700">
          Atividade recente
        </h3>
        <p className="font-mono text-xs text-slate-500">últimos 12 meses</p>
      </div>

      <div className="w-full overflow-x-auto pb-2 lg:overflow-x-visible">
        <div
          className="w-full lg:min-w-0"
          style={{ minWidth: `${totalWeeks * 10}px` }}
        >
          <div className="relative mb-1 h-4">
            {monthLabels.map(({ weekIdx, label }) => (
              <span
                key={`${weekIdx}-${label}`}
                className="absolute font-mono text-[10px] text-slate-500"
                style={{ left: `${(weekIdx / totalWeeks) * 100}%` }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-1 flex-col gap-[3px]">
                {week.map((cell) => {
                  if (cell.isFuture) {
                    return (
                      <div
                        key={cell.dateStr}
                        className="aspect-square rounded-[2px]"
                        aria-hidden="true"
                      />
                    );
                  }

                  const colorClass = getHeatmapCellColor(cell.minutes);
                  const todayRing = cell.isToday
                    ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-white"
                    : "";

                  return (
                    <div
                      key={cell.dateStr}
                      className={`group relative aspect-square rounded-[2px] border ${colorClass} ${todayRing}`}
                      title={`${cell.label}: ${cell.minutes} min`}
                      aria-label={`${cell.label}: ${cell.minutes} minutos`}
                    >
                      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {cell.label} · {cell.minutes} min
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 font-mono text-[11px] text-slate-500">
        <span>menos</span>
        {[0, 15, 45, 90, 150].map((minutes) => (
          <span
            key={minutes}
            className={`h-2.5 w-2.5 rounded-sm border ${getHeatmapCellColor(minutes)}`}
            aria-hidden="true"
          />
        ))}
        <span>mais</span>
      </div>

      {isEmpty ? (
        <div className="mt-4 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-4 text-center">
          <p className="text-sm font-semibold text-violet-900">
            Sua atividade aparece aqui quando você registra estudos no diário.
          </p>
          <Link
            href="/estudos/diario"
            className="mt-2 inline-block text-sm font-bold text-violet-700 underline-offset-2 hover:text-violet-900 hover:underline"
          >
            Comece sua primeira entrada →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function ProToolCard({
  href,
  icon,
  title,
}: {
  href: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-[#1a1a1a] bg-white p-4 shadow-[3px_3px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0f172a]"
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 transition-colors group-hover:bg-amber-200">
        {icon}
      </div>
      <h3 className="font-display text-sm font-black leading-tight text-slate-950">
        {title}
      </h3>
    </Link>
  );
}

export default function Perfil() {
  const [, setLocation] = useLocation();
  const {
    loading: authLoading,
    profile,
    refreshProfile,
    signOut,
    user,
  } = useAuth();
  const {
    isPro,
    loading: subscriptionLoading,
    subscription,
    refreshSubscription,
  } = useSubscription();
  const { favorites, loading: favoritesLoading } = useFavorites();
  const [localProfile, setLocalProfile] = useState<Profile | null>(profile);
  const [studyStats, setStudyStats] = useState<StudyStats | null>(null);
  const [recentEntries, setRecentEntries] = useState<StudyEntry[]>([]);
  const [heatmapData, setHeatmapData] = useState<StudyHeatmapDay[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapProgress[]>([]);
  const [quizAttempt, setQuizAttempt] = useState<QuizAttempt | null>(null);
  const [quizStatus, setQuizStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [dataLoading, setDataLoading] = useState(true);
  const [heatmapLoading, setHeatmapLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatarBorder, setEditAvatarBorder] =
    useState<AvatarBorderId>(defaultAvatarBorder);
  const [editAvatarIcon, setEditAvatarIcon] =
    useState<AvatarIconId>(defaultAvatarIcon);
  const [editAvatarBg, setEditAvatarBg] = useState<AvatarBgId>(defaultAvatarBg);
  const [activeAvatarSection, setActiveAvatarSection] =
    useState<AvatarSection>("border");
  const [pendingPhoto, setPendingPhoto] = useState<PendingPhoto | null>(null);
  const [proUpsellOpen, setProUpsellOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [marketingSaving, setMarketingSaving] = useState(false);
  const subscriptionData = subscription as SubscriptionData | null;

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !user) {
      console.info("[auth] guard: would redirect to /login");
      setLocation("/login", { replace: true });
    }
  }, [authLoading, setLocation, user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setDataLoading(true);
    setHeatmapLoading(true);

    async function loadData() {
      const [statsResult, recentResult, roadmapResult, heatmapResult] =
        await Promise.allSettled([
          getStudyStats("30d"),
          getStudyEntries({ limit: 3 }),
          apiFetch("/api/me/roadmaps"),
          getStudyHeatmap(HEATMAP_DAYS),
        ]);

      if (cancelled) return;
      setStudyStats(
        statsResult.status === "fulfilled" ? statsResult.value : null,
      );
      setRecentEntries(
        recentResult.status === "fulfilled" ? recentResult.value : [],
      );
      setRoadmaps(
        roadmapResult.status === "fulfilled" &&
          Array.isArray(roadmapResult.value?.data)
          ? (roadmapResult.value.data as RoadmapProgress[])
          : [],
      );
      setHeatmapData(
        heatmapResult.status === "fulfilled" ? heatmapResult.value : [],
      );
      setHeatmapLoading(false);
      setDataLoading(false);
    }

    void loadData().catch(() => {
      if (!cancelled) {
        setStudyStats(null);
        setRecentEntries([]);
        setRoadmaps([]);
        setHeatmapData([]);
        setHeatmapLoading(false);
        setDataLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setQuizStatus("loading");
    getQuizHistory()
      .then((history) => {
        if (cancelled) return;
        const list = (history as QuizAttempt[]) ?? [];
        setQuizAttempt(list.length > 0 ? list[0] : null);
        setQuizStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setQuizStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const userName =
    localProfile?.name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Perfil";
  const username =
    localProfile?.handle ||
    user?.user_metadata?.username ||
    user?.email?.split("@")[0] ||
    "bora.na.tech";
  const email = localProfile?.email || user?.email || "";
  const profileLoading = Boolean(user && !localProfile);
  const avatarBorder = normalizeAvatarBorder(localProfile?.avatar_border);
  const avatarIcon = normalizeAvatarIcon(localProfile?.avatar_icon);
  const avatarBg = normalizeAvatarBg(localProfile?.avatar_bg);
  // Display do proprio avatar: rebaixa borda Pro pra default se nao e Pro.
  const displayBorder = resolveEffectiveBorder(
    localProfile?.avatar_border,
    isPro,
  );
  const photoAvatar = effectiveOwnAvatar(localProfile, isPro);
  const googleMeta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const googlePreviewUrl =
    typeof googleMeta.avatar_url === "string"
      ? googleMeta.avatar_url
      : typeof googleMeta.picture === "string"
        ? googleMeta.picture
        : null;
  // Preview no editor reflete a escolha PENDENTE; o avatar salvo (hero/Header) so
  // muda depois do Salvar.
  const previewPhoto =
    pendingPhoto?.type === "upload"
      ? { mode: "photo" as const, avatarUrl: pendingPhoto.dataUrl }
      : pendingPhoto?.type === "google"
        ? { mode: "photo" as const, avatarUrl: googlePreviewUrl }
        : pendingPhoto?.type === "remove"
          ? { mode: "icon" as const, avatarUrl: null }
          : photoAvatar;
  const photoActive = previewPhoto.mode === "photo";
  const hasGoogleIdentity = Boolean(
    user?.identities?.some((identity) => identity.provider === "google"),
  );
  const activeAvatarSectionConfig =
    avatarSections.find((s) => s.id === activeAvatarSection) ||
    avatarSections[0];
  const planName =
    subscriptionData?.plans?.name || (isPro ? "Pro" : "Gratuito");
  const planPrice = subscriptionData?.plans?.price_cents
    ? formatCurrencyFromCents(subscriptionData.plans.price_cents)
    : "-";
  const subscriptionStatus =
    subscriptionData?.status ?? (isPro ? "active" : "free");
  const statusInfo = getStatusLabel(subscriptionStatus);
  const proSince = formatProSince(subscriptionData?.created_at);
  const currentStreak = studyStats?.current_streak ?? 0;
  const longestStreak = studyStats?.longest_streak ?? 0;
  const totalHours = Math.round((studyStats?.total_minutes ?? 0) / 60);

  function openEditProfile() {
    if (profileLoading) return;
    setEditName(userName);
    setEditAvatarBorder(avatarBorder);
    setEditAvatarIcon(avatarIcon);
    setEditAvatarBg(avatarBg);
    setActiveAvatarSection("border");
    setPendingPhoto(null);
    setEditingProfile(true);
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      // A foto pendente e aplicada (enviada + moderada no servidor) aqui, no Salvar.
      // Se falhar, mantem o editor aberto e nao grava o resto.
      if (pendingPhoto) {
        try {
          if (pendingPhoto.type === "upload") {
            await uploadAvatar(pendingPhoto.dataUrl);
          } else if (pendingPhoto.type === "google") {
            await applyGoogleAvatar();
          } else {
            await removeAvatar();
          }
          setPendingPhoto(null);
        } catch (err) {
          showErrorToast(describeAvatarError(err));
          return;
        }
      }

      const json = await apiFetch("/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: editName.trim(),
          avatar_border: editAvatarBorder,
          avatar_icon: editAvatarIcon,
          avatar_bg: editAvatarBg,
        }),
      });
      setLocalProfile(json.data);
      await refreshProfile().catch(() => undefined);
      showActionToast({ message: "Perfil salvo" });
      setEditingProfile(false);
    } catch {
      showErrorToast("Não foi possível salvar o perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleCancelSubscription(data: {
    reason_code?: CancelReasonCode;
    reason_text?: string;
  }) {
    setCancelingSubscription(true);
    try {
      const json = await apiFetch("/api/billing/cancel", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast.success(json.data?.message || "Assinatura cancelada com sucesso.");
      setCancelModalOpen(false);
      await refreshSubscription().catch(() => undefined);
    } catch {
      toast.error("Erro ao cancelar. Tente novamente ou contate o suporte.");
    } finally {
      setCancelingSubscription(false);
    }
  }

  async function handleReactivate() {
    setReactivating(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(apiUrl("/api/billing/reactivate"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
      });

      // 409 already_active: estado dessincronizado, refresca e segue.
      if (res.status === 409) {
        toast.info("Sua assinatura já está ativa.");
        await refreshSubscription().catch(() => undefined);
        return;
      }

      // 502/500/qualquer outro nao-ok: o endpoint e retry-safe.
      if (!res.ok) {
        toast.error("Erro ao reativar. Tente novamente ou contate o suporte.");
        return;
      }

      const json = await res.json();

      // Caso B: o endpoint sinaliza que precisa de novo checkout.
      if (json?.data?.redirect_to_checkout) {
        const target =
          typeof json.data.checkout_path === "string"
            ? json.data.checkout_path
            : "/planos";
        toast.info(json.data.message || "Vamos para um novo plano.");
        setLocation(target);
        return;
      }

      // Caso A: reativada com sucesso.
      toast.success(json?.data?.message || "Sua assinatura foi reativada.");
      await refreshSubscription().catch(() => undefined);
    } catch {
      toast.error("Erro ao reativar. Tente novamente ou contate o suporte.");
    } finally {
      setReactivating(false);
    }
  }

  // Opt-in de comunicacao promocional. Desmarcar zera o consentimento no
  // server (marketing_opt_in_at vira null); nao mexe na supressao global,
  // que e outra camada.
  async function handleToggleMarketingOptIn() {
    if (!localProfile || marketingSaving) return;
    const next = !(localProfile.marketing_opt_in ?? false);
    setMarketingSaving(true);
    try {
      await updateMyProfile({ marketing_opt_in: next });
      setLocalProfile({ ...localProfile, marketing_opt_in: next });
      await refreshProfile().catch(() => undefined);
      // TODO(Ana): toasts do opt-in de comunicação.
      toast.success(
        next
          ? "Você vai receber novidades e promoções por e-mail."
          : "Você não vai mais receber e-mails promocionais.",
      );
    } catch {
      toast.error("Não foi possível salvar sua preferência. Tente de novo.");
    } finally {
      setMarketingSaving(false);
    }
  }

  async function handleConfirmSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      toast.success("Até breve! 👋");
      setLocation("/login", { replace: true });
    } catch {
      toast.error("Não foi possível sair agora. Tente novamente.");
    } finally {
      setSigningOut(false);
      setSignOutModalOpen(false);
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
        <SEO title="Perfil · Bora na Tech?" url="/perfil" noindex />
        <section className="bg-[#faf8f4] py-16">
          <div className="container">
            <div className="mx-auto max-w-lg rounded-3xl border-2 border-[#1a1a1a] bg-white p-8 text-center shadow-[4px_4px_0_#0f172a]">
              <p className="font-display text-2xl font-black text-[#1a1a1a]">
                Carregando seu perfil...
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Verificando sua sessão com segurança.
              </p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const sectionStyle = (delay: number): CSSProperties => ({
    animationDelay: `${delay}ms`,
  });

  return (
    <Layout>
      <SEO title="Meu Perfil · Bora na Tech?" url="/perfil" noindex />
      <div className="relative isolate min-h-screen">
        <ProfileBackground />
        <div className="container relative space-y-6 py-8 md:space-y-8 md:py-12">
          {/* Bloco 1: Hero pessoal */}
          <section
            style={sectionStyle(0)}
            className="animate-fade-slide-up rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a] md:p-8"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <UserAvatar
                  name={userName}
                  border={displayBorder}
                  icon={avatarIcon}
                  bg={avatarBg}
                  mode={photoAvatar.mode}
                  avatarUrl={photoAvatar.avatarUrl}
                  size="xl"
                  loading={profileLoading}
                />
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-violet-700">
                    {greet(profile?.gender)} de volta
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h1 className="font-display text-3xl font-black text-[#1a1a1a] md:text-4xl">
                      {userName}
                    </h1>
                    {isPro ? (
                      <span className="inline-flex rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-3 py-1 text-xs font-black text-[#1a1a1a]">
                        <ProInlineBadge label="PRO" />
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border-2 border-slate-300 bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                        GRATUITO
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-slate-600">
                    {username
                      ? `@${String(username).replace(/^@/, "")} · `
                      : ""}
                    <span className="text-slate-400">{email}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openEditProfile}
                disabled={profileLoading}
                className="inline-flex items-center justify-center gap-2 self-start rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-5 py-3 font-display font-black text-[#1a1a1a] shadow-[4px_4px_0_#0f172a] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none md:self-auto"
              >
                <Edit3 className="h-4 w-4" />
                Editar perfil
              </button>
            </div>

            {editingProfile ? (
              <div className="mt-6 rounded-3xl border-2 border-[#1a1a1a] bg-[#faf8f4] p-5 shadow-[4px_4px_0_#0f172a]">
                <h2 className="font-display text-2xl font-black text-[#1a1a1a]">
                  Editar perfil
                </h2>
                <label className="mt-4 block text-sm font-black text-[#1a1a1a]">
                  Nome completo
                  <input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    className="mt-2 w-full rounded-2xl border-2 border-[#1a1a1a] bg-white px-4 py-3 font-bold outline-none focus:ring-4 focus:ring-yellow-200"
                  />
                </label>
                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-display text-xl font-black text-[#1a1a1a]">
                      Personalização do avatar
                    </h3>
                    <p className="text-sm font-semibold text-slate-500">
                      Escolha uma combinação para deixar seu perfil com a sua
                      cara.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-[240px_1fr]">
                    <div className="mx-auto flex w-full max-w-[230px] flex-col gap-3">
                      <div className="flex aspect-square flex-col items-center justify-center rounded-3xl border-2 border-[#1a1a1a] bg-[#faf8f4] p-5 text-center">
                        <UserAvatar
                          name={editName || userName}
                          border={editAvatarBorder}
                          icon={editAvatarIcon}
                          bg={editAvatarBg}
                          mode={previewPhoto.mode}
                          avatarUrl={previewPhoto.avatarUrl}
                          size="xl"
                        />
                        <div className="mt-5 min-w-0">
                          <p className="text-xs font-black uppercase text-slate-500">
                            Preview
                          </p>
                          <p className="mt-1 max-w-[180px] truncate text-sm font-black text-[#1a1a1a]">
                            {editName || userName}
                          </p>
                        </div>
                      </div>
                      <AvatarSectionTabs
                        active={activeAvatarSection}
                        onChange={setActiveAvatarSection}
                      />
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-[#faf8f4] p-4">
                      <div>
                        <h4 className="font-display text-xl font-black text-[#1a1a1a]">
                          {activeAvatarSectionConfig.title}
                        </h4>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {activeAvatarSectionConfig.description}
                        </p>
                      </div>

                      {photoActive &&
                      (activeAvatarSection === "icon" ||
                        activeAvatarSection === "bg") ? (
                        <p className="mt-3 rounded-2xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
                          Você está usando uma foto. Ícone e fundo não aparecem
                          enquanto a foto estiver ativa; a borda continua
                          valendo.
                        </p>
                      ) : null}

                      {activeAvatarSection === "border" ? (
                        <AvatarOptionGrid
                          title="Borda"
                          options={avatarBorderOptions}
                          selected={editAvatarBorder}
                          onSelect={setEditAvatarBorder}
                          isPro={isPro}
                          onProLockedClick={() => setProUpsellOpen(true)}
                          renderPreview={(option) => (
                            <UserAvatar
                              name={editName || userName}
                              border={option.id}
                              icon={editAvatarIcon}
                              bg={editAvatarBg}
                              size="preview"
                            />
                          )}
                        />
                      ) : null}

                      {activeAvatarSection === "icon" ? (
                        <AvatarOptionGrid
                          title="Ícone"
                          options={avatarIconOptions}
                          selected={editAvatarIcon}
                          onSelect={setEditAvatarIcon}
                          renderPreview={(option) => (
                            <UserAvatar
                              name={editName || userName}
                              border={editAvatarBorder}
                              icon={option.id}
                              bg={editAvatarBg}
                              size="preview"
                            />
                          )}
                        />
                      ) : null}

                      {activeAvatarSection === "bg" ? (
                        <AvatarOptionGrid
                          title="Fundo"
                          options={avatarBgOptions}
                          selected={editAvatarBg}
                          onSelect={setEditAvatarBg}
                          renderPreview={(option) => (
                            <UserAvatar
                              name={editName || userName}
                              border={editAvatarBorder}
                              icon={editAvatarIcon}
                              bg={option.id}
                              size="preview"
                            />
                          )}
                        />
                      ) : null}

                      {activeAvatarSection === "photo" ? (
                        isPro ? (
                          <AvatarPhotoPanel
                            profile={localProfile}
                            hasGoogleIdentity={hasGoogleIdentity}
                            pending={pendingPhoto}
                            onStage={setPendingPhoto}
                          />
                        ) : (
                          <ProGate
                            feature="avatar_photo"
                            description="Use uma foto no lugar do ícone. Disponível no Plano Pro."
                            className="mt-4"
                          />
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingPhoto(null);
                      setEditingProfile(false);
                    }}
                    className="rounded-full border-2 border-[#1a1a1a] bg-white px-5 py-2 font-black"
                  >
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
          </section>

          <section
            style={sectionStyle(50)}
            className="animate-fade-slide-up rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a] md:p-8"
          >
            {quizStatus === "loading" ? (
              <p className="font-mono text-xs text-slate-500">
                Carregando seu resultado do quiz...
              </p>
            ) : quizAttempt ? (
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-violet-700">
                  Sua área de carreira
                </p>
                <div className="mt-2 flex flex-wrap items-baseline gap-3">
                  <h2 className="font-display text-3xl font-black text-[#1a1a1a] md:text-4xl">
                    {quizAttempt.result_area}
                  </h2>
                  {typeof quizAttempt.confidence === "number" ? (
                    <span className="inline-flex rounded-full border-2 border-violet-300 bg-violet-100 px-3 py-1 text-xs font-black text-violet-800">
                      {quizAttempt.confidence}% de match
                    </span>
                  ) : null}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    href={
                      quizAttempt.result_area_slug
                        ? `/roadmaps?area=${quizAttempt.result_area_slug}`
                        : "/quiz-carreira/resultado"
                    }
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-5 py-2.5 font-display text-sm font-black text-[#1a1a1a] shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-0.5"
                  >
                    {quizAttempt.result_area_slug
                      ? "Ver roadmap da área"
                      : "Ver resultado completo"}
                  </Link>
                  <Link
                    href="/quiz-carreira"
                    className="text-sm font-bold text-violet-700 underline-offset-2 hover:text-violet-900 hover:underline"
                  >
                    Refazer quiz
                  </Link>
                </div>
              </div>
            ) : quizStatus === "error" ? (
              <p className="text-sm font-semibold text-slate-600">
                Não foi possível carregar seu resultado do quiz agora.
              </p>
            ) : (
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-violet-700">
                  Quiz de carreira
                </p>
                <h2 className="mt-2 font-display text-2xl font-black text-[#1a1a1a] md:text-3xl">
                  Você ainda não fez o quiz de carreira
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Descubra qual área de TI combina mais com você em poucos
                  minutos.
                </p>
                <Link
                  href="/quiz-carreira"
                  className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-5 py-2.5 font-display text-sm font-black text-[#1a1a1a] shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-0.5"
                >
                  Fazer o quiz
                </Link>
              </div>
            )}
          </section>

          {/* Bloco 2: Progresso */}
          <section
            style={sectionStyle(100)}
            className="animate-fade-slide-up rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a] md:p-8"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-black text-slate-950 md:text-3xl">
                Seu progresso
              </h2>
              <p className="font-mono text-xs text-slate-500">
                últimos 30 dias
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_200px]">
              <div className="w-full">
                <StreakHeatmap
                  data={heatmapData}
                  isEmpty={!heatmapLoading && heatmapData.length === 0}
                />
              </div>

              <div className="flex flex-col gap-3">
                <MetricCard
                  icon={<Flame className="h-5 w-5" strokeWidth={2.5} />}
                  label="Streak atual"
                  value={dataLoading ? "…" : currentStreak}
                  unit={currentStreak === 1 ? "dia" : "dias"}
                  variant="market"
                  subtext={
                    longestStreak > 0 ? `recorde: ${longestStreak}` : null
                  }
                />
                <MetricCard
                  icon={<BookOpen className="h-5 w-5" strokeWidth={2.5} />}
                  label="Total estudado"
                  value={dataLoading ? "…" : totalHours}
                  unit="horas"
                  variant="technical"
                  subtext={
                    studyStats?.days_studied
                      ? `${studyStats.days_studied} ${studyStats.days_studied === 1 ? "dia" : "dias"} ativos`
                      : null
                  }
                />
                <Link
                  href="/perfil/favoritos"
                  aria-label="Ver todos os favoritos"
                  className="block rounded-2xl transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
                >
                  <MetricCard
                    icon={<Star className="h-5 w-5" strokeWidth={2.5} />}
                    label="Favoritos"
                    value={favoritesLoading ? "…" : favorites.length}
                    unit={favorites.length === 1 ? "item" : "itens"}
                    variant="application"
                  />
                </Link>
              </div>
            </div>
          </section>

          {/* Bloco 2.5: Conquistas (preview real) */}
          <section
            style={sectionStyle(150)}
            className="animate-fade-slide-up overflow-hidden rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a] md:p-8"
          >
            <ConquistasPreview />
          </section>

          {/* Bloco 3: Ferramentas Pro */}
          {isPro ? (
            <section
              style={sectionStyle(200)}
              className="animate-fade-slide-up rounded-3xl border-2 border-[#1a1a1a] bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-[4px_4px_0_#0f172a] md:p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <ProStarIcon className="h-5 w-5" />
                <h2 className="font-display text-2xl font-black text-slate-950 md:text-3xl">
                  Suas ferramentas Pro
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <ProToolCard
                  href="/curriculo/analisar"
                  icon={<FileText className="h-5 w-5" strokeWidth={2.5} />}
                  title="Analisar currículo"
                />
                {/* TODO(Ana): validar titulo do card do Analisador de LinkedIn */}
                <ProToolCard
                  href="/linkedin/analisar"
                  icon={<Linkedin className="h-5 w-5" strokeWidth={2.5} />}
                  title="Analise seu LinkedIn"
                />
                <ProToolCard
                  href="/portfolio/analisar"
                  icon={<Github className="h-5 w-5" strokeWidth={2.5} />}
                  title="Analisar portfólio"
                />
                <ProToolCard
                  href="/entrevistas"
                  icon={<MessageSquare className="h-5 w-5" strokeWidth={2.5} />}
                  title="Simular entrevista"
                />
              </div>
            </section>
          ) : null}

          {/* Bloco 4: Continue de onde parou */}
          <section
            style={sectionStyle(300)}
            className="animate-fade-slide-up grid grid-cols-1 gap-6 lg:grid-cols-2"
          >
            <div className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-black text-slate-950">
                  Diário de estudos
                </h2>
                <Link
                  href="/estudos/diario"
                  className="text-sm font-bold text-violet-700 hover:text-violet-900"
                >
                  Abrir →
                </Link>
              </div>

              {recentEntries.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center">
                  <BookOpen
                    className="mx-auto h-10 w-10 text-slate-400"
                    strokeWidth={2}
                  />
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    Comece sua primeira entrada hoje.
                  </p>
                  <Link
                    href="/estudos/diario"
                    className="mt-3 inline-block rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-4 py-2 font-display text-sm font-black shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-0.5"
                  >
                    Criar primeira entrada
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2">
                  {recentEntries.slice(0, 3).map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xl leading-none">
                          {modeEmoji[entry.mode] || "📝"}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {entry.minutes} min · {formatDate(entry.studied_at)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {truncate(entry.text || "(sem descrição)", 120)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-black text-slate-950">
                  Minhas trilhas
                </h2>
                <Link
                  href="/roadmaps"
                  className="text-sm font-bold text-violet-700 hover:text-violet-900"
                >
                  Ver todas →
                </Link>
              </div>

              {roadmaps.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center">
                  <MapPin
                    className="mx-auto h-10 w-10 text-slate-400"
                    strokeWidth={2}
                  />
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    Escolha um caminho e comece por etapas pequenas.
                  </p>
                  <Link
                    href="/roadmaps"
                    className="mt-3 inline-block rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-4 py-2 font-display text-sm font-black shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-0.5"
                  >
                    Ver roadmaps
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {roadmaps.slice(0, 3).map((roadmap) => (
                    <li
                      key={roadmap.id}
                      className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="font-display text-sm font-black text-slate-950">
                          {truncate(roadmap.title, 40)}
                        </h3>
                        <span className="font-mono text-[11px] text-slate-500">
                          {roadmap.progress}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full border border-slate-300 bg-white">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{
                            width: `${Math.min(Math.max(roadmap.progress, 0), 100)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1.5 font-mono text-[11px] text-slate-600">
                        {roadmap.completed_steps}/{roadmap.total_steps} etapas
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Blocos 5 + 6: Pôsteres editoriais lado a lado em desktop */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
            {/* Bloco 5: Assinatura (pôster amber) */}
            <section
              style={sectionStyle(400)}
              className="animate-fade-slide-up relative overflow-hidden rounded-3xl border-2 border-[#1a1a1a] p-6 shadow-[4px_4px_0_#0f172a] md:p-8"
            >
              <div
                className="absolute inset-0 z-0"
                style={{
                  background:
                    "linear-gradient(135deg, #fffbeb 0%, #ffffff 50%, #fff7ed 100%)",
                }}
                aria-hidden="true"
              />

              <svg
                className="absolute right-4 top-4 z-0 h-16 w-16 rotate-12 text-amber-300 opacity-60"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5L8 14l-6-4.5h7.5z" />
              </svg>
              <svg
                className="absolute left-6 top-1/2 z-0 h-5 w-5 -rotate-12 text-amber-400 opacity-40"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5L8 14l-6-4.5h7.5z" />
              </svg>
              <svg
                className="absolute bottom-8 right-12 z-0 h-4 w-4 rotate-45 text-orange-400 opacity-50"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5L8 14l-6-4.5h7.5z" />
              </svg>

              <div className="relative z-10">
                {subscriptionLoading ? (
                  <p className="font-display text-xl font-black text-slate-950">
                    Carregando assinatura...
                  </p>
                ) : isPro ? (
                  <>
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber-700">
                      Assinatura
                    </p>

                    <h2
                      className="font-display mt-2 font-black leading-none text-slate-950"
                      style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)" }}
                    >
                      PRO
                    </h2>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-block rounded-full border-2 px-3 py-1 font-display text-[11px] font-black uppercase tracking-[0.18em] ${
                          statusBadgeStyles[statusInfo.variant]
                        }`}
                      >
                        {statusInfo.label}
                      </span>
                      {proSince ? (
                        <span className="font-mono text-xs text-slate-600">
                          desde {proSince}
                        </span>
                      ) : null}
                    </div>

                    <div className="my-6 border-t-2 border-dashed border-amber-200" />

                    <div className="space-y-2.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-700">
                          Plano
                        </span>
                        <span className="font-display font-black text-slate-950">
                          {planName}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-700">
                          Valor
                        </span>
                        <span className="font-display font-black text-slate-950">
                          {planPrice}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-700">
                          Próxima renovação
                        </span>
                        <span className="font-display font-black text-slate-950">
                          {formatPeriodEnd(
                            subscriptionData?.current_period_end,
                          )}
                        </span>
                      </div>
                    </div>

                    {subscriptionData?.cancel_at_period_end &&
                    subscriptionData?.current_period_end ? (
                      <div className="mt-5 rounded-2xl border-2 border-amber-400 bg-amber-50 p-3">
                        <p className="text-sm font-bold text-amber-900">
                          ⚠️ Cancelamento agendado. Acesso Pro até{" "}
                          {formatPeriodEnd(subscriptionData.current_period_end)}
                          .
                        </p>
                        <button
                          type="button"
                          onClick={handleReactivate}
                          disabled={reactivating}
                          className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-4 py-2 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {reactivating
                            ? "Reativando..."
                            : "Reativar meu plano"}
                        </button>
                      </div>
                    ) : null}

                    {!subscriptionData?.cancel_at_period_end ? (
                      <button
                        type="button"
                        onClick={() => setCancelModalOpen(true)}
                        className="mt-6 text-sm font-bold text-rose-700 underline-offset-2 hover:text-rose-900 hover:underline"
                      >
                        Cancelar assinatura
                      </button>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber-700">
                      Plano atual
                    </p>

                    <h2
                      className="font-display mt-2 font-black leading-none text-slate-950"
                      style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
                    >
                      GRATUITO
                    </h2>

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      {/* TODO(Ana): revisar copy sem contagem de ferramentas */}
                      Desbloqueie as ferramentas de IA pra acelerar sua
                      carreira.
                    </p>

                    <Link
                      href="/planos"
                      className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-0.5"
                    >
                      <ProStarIcon className="h-4 w-4" />
                      Ver planos Pro
                    </Link>
                  </>
                )}
              </div>
            </section>

            {/* Bloco 6: Conta (pôster violet) */}
            <section
              style={sectionStyle(500)}
              className="animate-fade-slide-up relative overflow-hidden rounded-3xl border-2 border-[#1a1a1a] p-6 shadow-[4px_4px_0_#0f172a] md:p-8"
            >
              <div
                className="absolute inset-0 z-0"
                style={{
                  background:
                    "linear-gradient(225deg, #faf5ff 0%, #ffffff 50%, #fdf4ff 100%)",
                }}
                aria-hidden="true"
              />

              <div
                className="absolute right-6 top-6 z-0 h-3 w-3 rounded-full bg-violet-400 opacity-40"
                aria-hidden="true"
              />
              <div
                className="absolute right-14 top-12 z-0 h-2 w-2 rounded-full bg-fuchsia-400 opacity-30"
                aria-hidden="true"
              />
              <div
                className="absolute right-20 top-8 z-0 h-1.5 w-1.5 rounded-full bg-violet-500 opacity-50"
                aria-hidden="true"
              />

              <div className="relative z-10">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-violet-700">
                  Conta
                </p>

                <h2
                  className="font-display mt-2 break-words font-black uppercase leading-none text-slate-950"
                  style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
                >
                  {(localProfile?.name || "Olá").split(" ")[0]}
                </h2>

                <div className="mt-3 space-y-1">
                  {username ? (
                    <p className="font-mono text-sm font-bold text-violet-700">
                      @{String(username).replace(/^@/, "")}
                    </p>
                  ) : null}
                  <p className="break-all font-mono text-xs text-slate-500">
                    {email}
                  </p>
                </div>

                <div className="my-6 border-t-2 border-dashed border-violet-200" />

                <label className="flex cursor-pointer items-start gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={localProfile?.marketing_opt_in ?? false}
                    disabled={marketingSaving}
                    onChange={() => void handleToggleMarketingOptIn()}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-violet-700"
                  />
                  {/* TODO(Ana): texto do consentimento no perfil. */}
                  <span>
                    Quero receber e-mails com novidades e promoções do Bora na
                    Tech.
                  </span>
                </label>

                <div className="my-6 border-t-2 border-dashed border-violet-200" />

                <div className="flex flex-col gap-2">
                  <Link
                    href="/trocar-senha"
                    className="inline-flex items-center gap-2 self-start rounded-full border-2 border-violet-300 bg-white/80 px-4 py-2 text-sm font-bold text-violet-700 backdrop-blur-sm transition-colors hover:border-violet-500 hover:bg-white hover:text-violet-900"
                  >
                    <KeyRound className="h-4 w-4" />
                    Trocar senha
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSignOutModalOpen(true)}
                    className="inline-flex items-center gap-2 self-start rounded-full border-2 border-slate-300 bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 backdrop-blur-sm transition-colors hover:border-slate-500 hover:bg-white hover:text-slate-900"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(true)}
                    className="inline-flex items-center gap-2 self-start rounded-full border-2 border-rose-200 bg-white/80 px-4 py-2 text-sm font-bold text-rose-700 backdrop-blur-sm transition-colors hover:border-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir conta
                  </button>
                </div>
              </div>
            </section>
          </div>

          <CancelSubscriptionModal
            isOpen={cancelModalOpen}
            onClose={() => setCancelModalOpen(false)}
            onConfirm={handleCancelSubscription}
            periodEnd={subscriptionData?.current_period_end}
            isLoading={cancelingSubscription}
          />

          <SignOutConfirmModal
            isOpen={signOutModalOpen}
            onClose={() => setSignOutModalOpen(false)}
            onConfirm={handleConfirmSignOut}
            isLoading={signingOut}
          />

          {/* TODO(Ana): copy final do upsell de bordas */}
          <ProUpsellModal
            open={proUpsellOpen}
            onOpenChange={setProUpsellOpen}
            feature="avatar_borders"
            description="As bordas animadas fazem parte do Plano Pro. Assine pra desbloquear."
          />

          {deleteModalOpen ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
              onClick={() => {
                if (!deletingAccount) setDeleteModalOpen(false);
              }}
            >
              <div
                className="relative w-full max-w-md rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-modal-title"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-rose-700 bg-rose-100">
                  <Trash2 className="h-5 w-5 text-rose-700" strokeWidth={2.5} />
                </div>
                <h2
                  id="delete-modal-title"
                  className="font-display text-2xl font-black text-rose-800"
                >
                  Excluir conta
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Esta ação é permanente e irreversível. Todos os seus dados,
                  favoritos, histórico de estudos e assinatura serão apagados.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    disabled={deletingAccount}
                    className="flex-1 rounded-full border-2 border-[#1a1a1a] bg-white px-5 py-3 font-display font-black text-slate-700 shadow-[3px_3px_0_#0f172a] disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteAccount()}
                    disabled={deletingAccount}
                    className="flex-1 rounded-full border-2 border-rose-900 bg-rose-100 px-5 py-3 font-display font-black text-rose-800 shadow-[3px_3px_0_#7f1d1d] disabled:opacity-60"
                  >
                    {deletingAccount ? "Excluindo..." : "Confirmar exclusão"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
