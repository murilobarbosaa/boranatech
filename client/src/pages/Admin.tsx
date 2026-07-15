import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  BrainCircuit,
  Clock3,
  Compass,
  Copy,
  CreditCard,
  Database,
  DollarSign,
  Eye,
  FileText,
  Globe2,
  Handshake,
  LayoutDashboard,
  Link as LinkIcon,
  LockKeyhole,
  LogOut,
  Mail,
  MousePointerClick,
  PieChart,
  PlusCircle,
  RefreshCcw,
  Search,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Trophy,
  UserRound,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { ContactListsManager } from "@/components/admin/ContactListsManager";
import { ConversionDashboard } from "@/components/admin/ConversionDashboard";
import { ExpensesManager } from "@/components/admin/ExpensesManager";
import { FinanceDashboard } from "@/components/admin/FinanceDashboard";
import { IntegrationsHealthPanel } from "@/components/admin/IntegrationsHealthPanel";
import { PagesDashboard } from "@/components/admin/PagesDashboard";
import PendingIntegration from "@/components/admin/PendingIntegration";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import {
  SubscribersSummary,
  SubscribersTable,
} from "@/components/admin/SubscribersTable";
import VagasDestaqueAdmin from "@/components/admin/VagasDestaqueAdmin";
import SEO from "@/components/SEO";
import { SignOutConfirmModal } from "@/components/profile/SignOutConfirmModal";
import { useAuth } from "@/contexts/AuthContext";
import { adminFetch } from "@/lib/adminApi";
import { renderCampaignBodyHtml } from "@shared/emailCampaignBody";
import { readAdminClaim } from "@/lib/adminClaim";
import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type AdminSession = {
  username: string;
  displayName: string;
  signedAt: string;
  role?: string;
};

type MetricCard = {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  color: string;
};

type AiUsage = {
  feature: string;
  requests: string;
  credits: string;
  cost: string;
  // Custo numerico bruto (nao formatado), para a barra de proporcao.
  costValue: number;
  status: "ok" | "watch" | "high";
};

type QueueStats = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
};

type HealthItem = {
  service: string;
  status: string;
  detail: string;
  icon: ReactNode;
  tone: string;
};

type AffiliateRecord = {
  id: string;
  name: string;
  email?: string | null;
  code: string;
  discount_percent: number;
  commission_percent: number;
  status: "active" | "paused" | "inactive";
  clicks: number;
  trials: number;
  sales: number;
  revenue_cents: number;
  commission_due_cents: number;
  commission_paid_cents: number;
  notes?: string | null;
};

type AffiliateEditForm = {
  name: string;
  email: string;
  discount_percent: number;
  commission_percent: number;
  status: "active" | "paused" | "inactive";
  notes: string;
};

type AdminNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

type AdminSectionId =
  | "visao-geral"
  | "conversao"
  | "paginas"
  | "conteudo"
  | "usuarios"
  | "retencao"
  | "seo"
  | "financeiro"
  | "ia"
  | "afiliados"
  | "newsletter"
  | "emails"
  | "beta"
  | "vagas";

type UserProfile = {
  userId?: string;
  name: string;
  email: string;
  signedUpAt: string;
  convertedAt: string;
  interest: string;
  source: string;
  status: string;
  paidTotal: string;
  features: Array<{ name: string; uses: number }>;
  sessions: string[];
};

type AdminUserRecord = {
  id?: string;
  user_id?: string;
  name?: string | null;
  email?: string | null;
  area_interesse?: string | null;
  onboarding_completed?: boolean | null;
  created_at?: string | null;
};

type DashboardData = {
  counts?: {
    users: number;
    active_subscriptions: number;
    areas: number;
    courses: number;
    ai_calls_total: number;
  };
  recent_audit?: AuditLog[];
};

type HealthResponse = {
  status: string;
  uptime?: number;
  responseTime?: number;
  checks?: Record<string, string>;
};

type AuditLog = {
  action: "create" | "update" | "delete" | "publish" | "unpublish";
  resource_type: string;
  resource_slug?: string | null;
  created_at: string;
};

type AiStatsData = Record<
  string,
  { calls: number; success: number; cost: number }
>;

type ChurnRiskUser = {
  name: string;
  email: string;
  days_inactive: number;
  mrr: number;
};

type PosthogStats = {
  totalPageviews: number;
  uniqueUsers: number;
  pages: Array<{ page: string; views: number }>;
  events: {
    user_signed_up: number;
    user_signed_in: number;
    checkout_started: number;
    quiz_completed: number;
  };
  acquisition: Array<{ channel: string; users: number }>;
};

// Espelha o union discriminado do backend (server/lib/posthog.ts). O client
// deixa de colapsar not_configured / error / ok-sem-dados numa tela so.
type PosthogState =
  | { state: "not_configured"; missing: string[] }
  | { state: "error"; reason: string; httpStatus?: number }
  | { state: "ok"; hasData: boolean; stats: PosthogStats };

type PlanMrr = {
  code: string;
  name: string | null;
  count: number;
  mrrCents: number;
};

type MrrSnapshot = {
  mrrCents: number;
  arpuCents: number | null;
  activeCount: number;
  trialingCount: number;
  byPlan: PlanMrr[];
};

type ChurnSnapshot =
  | {
      status: "insufficient_data";
      reason: string;
      windowDays: number;
      canceledInWindow?: number;
      activeAtStart?: number;
    }
  | {
      status: "ok";
      windowDays: number;
      churnRate: number;
      canceledInWindow: number;
      activeAtStart: number;
      ltvCents: number | null;
    };

type BillingMetricsData = { mrr: MrrSnapshot; churn: ChurnSnapshot };

type ContentItem = {
  id: string;
  slug?: string;
  title?: string;
  name?: string;
  provider?: string;
  level?: string;
  tag?: string;
  area_slug?: string;
  is_free?: boolean;
  is_pro?: boolean;
  is_published?: boolean;
  created_at?: string;
  short_description?: string;
  full_description?: string;
  description?: string;
  estimated_duration_weeks?: number;
  workload_hours?: number;
  url?: string;
};

type ContentType =
  | "news"
  | "external_jobs"
  | "events"
  | "areas"
  | "courses"
  | "roadmaps";

// Cada card declara seu proprio label junto do proprio valor (sem override em
// runtime). O label da base e o mesmo exibido; adminMetricCards so preenche os
// valores reais, nunca troca o label por outro nao relacionado.
const metricCards: MetricCard[] = [
  {
    label: "Usuários",
    value: "0",
    detail: "Perfis cadastrados no banco",
    icon: <Users className="h-6 w-6" />,
    color: "bg-violet-700 text-white",
  },
  {
    label: "Assinantes Pro",
    value: "0",
    detail: "Assinaturas ativas no banco",
    icon: <CreditCard className="h-6 w-6" />,
    color: "bg-[#ffb800] text-slate-950",
  },
  {
    label: "Receita recorrente",
    value: "0",
    detail: "MRR das assinaturas ativas",
    icon: <DollarSign className="h-6 w-6" />,
    color: "bg-emerald-600 text-white",
  },
  {
    label: "Chamadas de IA",
    value: "0",
    detail: "Registros em ai_usage_logs",
    icon: <Bot className="h-6 w-6" />,
    color: "bg-pink-600 text-white",
  },
  {
    label: "Cursos cadastrados",
    value: "0",
    detail: "Itens na tabela courses",
    icon: <FileText className="h-6 w-6" />,
    color: "bg-blue-600 text-white",
  },
  {
    label: "Custo de IA",
    value: "0",
    detail: "Custo estimado dos últimos 30 dias",
    icon: <Zap className="h-6 w-6" />,
    color: "bg-orange-500 text-white",
  },
];

const adminNavItems: AdminNavItem[] = [
  {
    href: "#visao-geral",
    label: "Visão",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "#conversao",
    label: "Conversão",
    icon: <MousePointerClick className="h-4 w-4" />,
  },
  { href: "#paginas", label: "Páginas", icon: <Eye className="h-4 w-4" /> },
  {
    href: "#conteudo",
    label: "Conteúdo",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    href: "#vagas",
    label: "Vagas",
    icon: <Star className="h-4 w-4" />,
  },
  {
    href: "#usuarios",
    label: "Usuários",
    icon: <UserRound className="h-4 w-4" />,
  },
  {
    href: "#retencao",
    label: "Retenção",
    icon: <RefreshCcw className="h-4 w-4" />,
  },
  { href: "#seo", label: "SEO", icon: <Search className="h-4 w-4" /> },
  {
    href: "#financeiro",
    label: "Financeiro",
    icon: <DollarSign className="h-4 w-4" />,
  },
  { href: "#ia", label: "IA", icon: <Bot className="h-4 w-4" /> },
  {
    href: "#afiliados",
    label: "Afiliados",
    icon: <Handshake className="h-4 w-4" />,
  },
  {
    href: "#newsletter",
    label: "Newsletter",
    icon: <Mail className="h-4 w-4" />,
  },
  {
    href: "#emails",
    // TODO(Ana): rótulo da aba de campanhas de e-mail.
    label: "Emails",
    icon: <Send className="h-4 w-4" />,
  },
  {
    href: "#beta",
    // TODO(Ana): rótulo da aba de códigos de beta.
    label: "Beta",
    icon: <LockKeyhole className="h-4 w-4" />,
  },
];

function slugifyAffiliateCode(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase()
    .slice(0, 18);
}

function buildAffiliateLink(code: string, discount: number) {
  const safeCode = slugifyAffiliateCode(code || "PARCEIRO");
  return `https://boranatech.com.br/planos?ref=${safeCode}&cupom=${safeCode}&desconto=${discount}`;
}

function formatAdminDate(value?: string | null) {
  if (!value) return "Não informado";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function toUserProfile(record: AdminUserRecord): UserProfile {
  const email = record.email || record.user_id || record.id || "sem-email";
  const fallbackName = email.includes("@") ? email.split("@")[0] : "Usuário";

  return {
    userId: record.user_id,
    name: record.name || fallbackName,
    email,
    signedUpAt: formatAdminDate(record.created_at),
    convertedAt: "Não convertido",
    interest: record.area_interesse || "Não informado",
    source: record.onboarding_completed
      ? "Onboarding completo"
      : "Não informado",
    status: record.onboarding_completed ? "Ativo" : "Cadastro incompleto",
    paidTotal: "R$ 0,00",
    features: [],
    sessions: [],
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function formatCents(value: number) {
  return formatCurrency((value || 0) / 100);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value || 0);
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "agora";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours}h`;

  const days = Math.round(hours / 24);
  return `há ${days}d`;
}

function auditTitle(action: AuditLog["action"]) {
  const labels = {
    create: "Novo conteúdo adicionado",
    update: "Conteúdo atualizado",
    delete: "Conteúdo despublicado",
    publish: "Conteúdo publicado",
    unpublish: "Conteúdo despublicado",
  };

  return labels[action];
}

function buildHealthItems(health: HealthResponse | null): HealthItem[] {
  if (!health) return [];

  const databaseOk = health.checks?.database === "ok";
  const openaiOk = health.checks?.openai === "ok";

  return [
    {
      service: "Supabase Auth",
      status: databaseOk ? "Operando" : "Falha",
      detail: databaseOk
        ? "Validação dependente do banco operacional"
        : "Banco indisponível no health check",
      icon: <ShieldCheck className="h-5 w-5" />,
      tone: databaseOk
        ? "bg-emerald-50 text-emerald-800"
        : "bg-rose-50 text-rose-800",
    },
    {
      service: "Banco de dados",
      status: databaseOk ? "Estável" : "Falha",
      detail: `Resposta em ${health.responseTime ?? 0}ms`,
      icon: <Database className="h-5 w-5" />,
      tone: databaseOk
        ? "bg-blue-50 text-blue-800"
        : "bg-rose-50 text-rose-800",
    },
    {
      service: "Serviços de IA",
      status: openaiOk ? "Operando" : "Sem chave",
      detail: openaiOk
        ? "OpenAI respondeu no health check"
        : "OPENAI_API_KEY ausente ou inválida",
      icon: <BrainCircuit className="h-5 w-5" />,
      tone: openaiOk
        ? "bg-emerald-50 text-emerald-800"
        : "bg-amber-50 text-amber-900",
    },
    {
      service: "Servidor web",
      status: "Online",
      detail: `Uptime ${Math.round((health.uptime || 0) / 60)} min`,
      icon: <Server className="h-5 w-5" />,
      tone: "bg-violet-50 text-violet-800",
    },
  ];
}

function contentTitle(item: ContentItem) {
  return item.title || item.name || item.slug || item.id;
}

function StatusPill({ status }: { status: AiUsage["status"] }) {
  const labels = {
    ok: "saudável",
    watch: "acompanhar",
    high: "custo alto",
  };

  const classes = {
    ok: "bg-emerald-100 text-emerald-800",
    watch: "bg-amber-100 text-amber-900",
    high: "bg-rose-100 text-rose-800",
  };

  return (
    <span
      className={`rounded-full border border-slate-900 px-2 py-1 text-[11px] font-black uppercase ${classes[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function PublishBadge({ published }: { published?: boolean }) {
  return (
    <span
      className={`w-fit rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black ${
        published
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      {published ? "Publicado" : "Rascunho"}
    </span>
  );
}

// Ausencia como estado VISIVEL e nomeado, nunca 0 nem traco.
// TODO(Ana): revisar copy de "Dados insuficientes" e as explicacoes.
function InsufficientDataBlock({
  label,
  explanation,
}: {
  label: string;
  explanation: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-400 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="font-display text-lg font-black text-slate-700">
        Dados insuficientes
      </p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{explanation}</p>
    </div>
  );
}

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-4">
      <p className="text-xs font-black uppercase text-violet-700">{label}</p>
      <p className="font-display text-2xl font-black text-slate-950">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs font-semibold text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

function formatPercent1(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

// TODO(Ana): revisar as explicacoes de churn insuficiente.
function churnInsufficientReason(reason: string): string {
  switch (reason) {
    case "subscription_base_younger_than_window":
      return "Base de assinaturas ainda nova demais para calcular churn de 30 dias.";
    case "no_active_subscribers_at_window_start":
      return "Não havia assinantes ativos no início da janela para calcular churn.";
    default:
      return "Dados insuficientes para calcular churn.";
  }
}

// PostHog como quatro telas DISTINTAS (not_configured / error / ok-sem-dados /
// ok-com-dados). A tela sem dados parece saudavel, nao quebrada.
// TODO(Ana): revisar copy dos estados do PostHog.
function PosthogStateNotice({ state }: { state: PosthogState | null }) {
  if (!state) return <LoadingBlock />;

  if (state.state === "not_configured") {
    return (
      <div className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-4">
        <p className="font-display text-lg font-black text-amber-900">
          PostHog não configurado
        </p>
        <p className="mt-1 text-sm font-semibold text-amber-800">
          Faltando no servidor:{" "}
          {state.missing.length
            ? state.missing.join(", ")
            : "credenciais do PostHog"}
          .
        </p>
      </div>
    );
  }

  if (state.state === "error") {
    return (
      <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4">
        <p className="font-display text-lg font-black text-rose-800">
          Falha ao consultar o PostHog
          {typeof state.httpStatus === "number"
            ? ` (HTTP ${state.httpStatus})`
            : ""}
        </p>
        <p className="mt-1 text-sm font-semibold text-rose-700">
          {state.reason}
        </p>
      </div>
    );
  }

  // state.state === "ok" (hasData false ou recorte vazio): estado saudavel.
  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
      <p className="font-display text-lg font-black text-slate-700">
        PostHog conectado
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-500">
        Sem eventos neste recorte no período.
      </p>
    </div>
  );
}

// Painel de metricas de cobranca (MRR, ARPU, churn, LTV, distribuicao por plano).
// Erro e ausencia sao estados visiveis: nunca renderiza 0 nem valor inventado.
// TODO(Ana): revisar labels e hints das metricas de cobranca.
function BillingMetricsPanel({
  loading,
  error,
  metrics,
}: {
  loading: boolean;
  error: string | null;
  metrics: BillingMetricsData | null;
}) {
  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;
  if (!metrics) return <LoadingBlock />;

  const { mrr, churn } = metrics;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricTile
          label="MRR"
          value={formatCents(mrr.mrrCents)}
          hint={`${mrr.activeCount} ativos, ${mrr.trialingCount} em trial`}
        />
        {mrr.arpuCents === null ? (
          <InsufficientDataBlock
            label="ARPU"
            explanation="Sem assinantes ativos para calcular ARPU."
          />
        ) : (
          <MetricTile
            label="ARPU"
            value={formatCents(mrr.arpuCents)}
            hint="Receita média por assinante ativo"
          />
        )}
        {churn.status === "insufficient_data" ? (
          <InsufficientDataBlock
            label={`Churn (${churn.windowDays}d)`}
            explanation={churnInsufficientReason(churn.reason)}
          />
        ) : (
          <MetricTile
            label={`Churn (${churn.windowDays}d)`}
            value={formatPercent1(churn.churnRate)}
            hint={`${churn.canceledInWindow} de ${churn.activeAtStart} no início da janela`}
          />
        )}
        {churn.status === "ok" && churn.ltvCents !== null ? (
          <MetricTile
            label="LTV"
            value={formatCents(churn.ltvCents)}
            hint="ARPU dividido pelo churn"
          />
        ) : (
          <InsufficientDataBlock
            label="LTV"
            explanation="LTV precisa de ARPU e churn maior que zero."
          />
        )}
      </div>
      {mrr.byPlan.length ? (
        <div className="overflow-hidden rounded-2xl border-2 border-slate-900 bg-white">
          <p className="border-b-2 border-slate-900 bg-slate-50 px-4 py-2 text-xs font-black uppercase text-slate-600">
            Distribuição por plano
          </p>
          <ul className="divide-y divide-slate-200">
            {mrr.byPlan.map((plan) => (
              <li
                key={plan.code}
                className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
              >
                <span className="font-black text-slate-900">
                  {plan.name ?? plan.code}
                </span>
                <span className="font-semibold text-slate-600">
                  {plan.count} · {formatCents(plan.mrrCents)}/mês
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function AdminShell({
  activeSection,
  children,
  onLogout,
  session,
  setActiveSection,
}: {
  activeSection?: AdminSectionId;
  children: ReactNode;
  onLogout?: () => void;
  session?: AdminSession | null;
  setActiveSection?: (section: AdminSectionId) => void;
}) {
  function handleSectionClick(
    event: React.MouseEvent<HTMLButtonElement>,
    href: string,
  ) {
    event.preventDefault();
    const nextSection = href.replace("#", "") as AdminSectionId;
    setActiveSection?.(nextSection);
  }

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <header className="sticky top-0 z-[1000] border-b-2 border-slate-900 bg-[#f6f0df]/95 backdrop-blur">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 items-center justify-between gap-4">
            <a
              href="/admin"
              className="group flex min-w-fit items-center gap-2"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-yellow-400 text-slate-950 shadow-[2px_2px_0_#0f172a] transition-all group-hover:shadow-[4px_4px_0_#0f172a]">
                <Compass className="h-5 w-5" />
              </span>
              <div>
                <span className="font-display block text-sm font-black uppercase leading-tight text-slate-900">
                  BORA NA TECH?
                </span>
                <span className="block text-xs font-bold text-slate-500">
                  Admin da plataforma
                </span>
              </div>
            </a>

            {session ? (
              <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-center gap-1 px-2 py-2 lg:flex">
                {adminNavItems.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={(event) => handleSectionClick(event, item.href)}
                    className={`nav-pill inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-bold hover:text-slate-950 ${
                      activeSection === item.href.replace("#", "")
                        ? "nav-pill-active text-slate-950"
                        : "text-slate-700"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>
            ) : null}

            {session ? (
              <div className="flex min-w-fit items-center gap-2">
                <div className="hidden items-center gap-2 rounded-full border-2 border-slate-900 bg-white py-1 pl-1 pr-3 shadow-[2px_2px_0_#0f172a] sm:flex">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-700 text-xs font-black text-white">
                    {session.displayName.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase leading-none text-violet-700">
                      Admin
                    </p>
                    <p className="text-xs font-black leading-tight text-slate-950">
                      {session.displayName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  type="button"
                  className="btn-brutal-accent inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black sm:px-4"
                >
                  Sair
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <span className="social-badge inline-flex w-fit items-center gap-2 px-4 py-2 text-xs font-black uppercase text-slate-950">
                <LockKeyhole className="h-4 w-4" />
                Login administrativo
              </span>
            )}
          </div>

          {session ? (
            <nav className="flex gap-1 overflow-x-auto border-t border-slate-900/10 px-1 py-3 lg:hidden">
              {adminNavItems.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={(event) => handleSectionClick(event, item.href)}
                  className={`nav-pill inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-bold hover:text-slate-950 ${
                    activeSection === item.href.replace("#", "")
                      ? "nav-pill-active text-slate-950"
                      : "text-slate-700"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          ) : null}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function AdminSection({
  children,
  eyebrow,
  icon,
  id,
  subtitle,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  icon: ReactNode;
  id: string;
  subtitle: string;
  title: string;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase text-violet-800 shadow-[2px_2px_0_#0f172a]">
            {icon}
            {eyebrow}
          </p>
          <h2 className="font-display mt-3 text-3xl font-black text-slate-950">
            {title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function AdminAccessGate({
  reason,
}: {
  reason: "loading" | "login" | "forbidden";
}) {
  return (
    <AdminShell>
      <SEO title="Admin · Bora na Tech?" url="/admin" noindex />
      <section className="hero-pattern min-h-[calc(100vh-4rem)] border-b-2 border-slate-900 py-12">
        <div className="container grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="social-badge mb-5 inline-flex px-4 py-2 text-xs font-black uppercase tracking-wide">
              acesso restrito
            </p>
            <h1 className="font-display max-w-3xl text-4xl font-black leading-tight text-slate-950 lg:text-6xl">
              Painel admin do BORA NA TECH?
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-relaxed text-slate-700">
              O acesso agora é validado pela sua sessão Supabase e pela role
              administrativa registrada no banco.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Métricas", icon: <BarChart3 className="h-5 w-5" /> },
                { label: "IA", icon: <Bot className="h-5 w-5" /> },
                { label: "Operação", icon: <Activity className="h-5 w-5" /> },
              ].map((item) => (
                <div
                  key={item.label}
                  className="card-brutal rounded-2xl bg-white p-4"
                >
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-900 bg-yellow-300">
                    {item.icon}
                  </span>
                  <p className="font-display text-lg font-black text-slate-950">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-brutal rounded-[2rem] bg-white p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-slate-900 bg-violet-700 text-white shadow-[3px_3px_0_#0f172a]">
                <LockKeyhole className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-black text-slate-950">
                  {reason === "loading"
                    ? "Verificando acesso"
                    : reason === "login"
                      ? "Faça login primeiro"
                      : "Acesso negado"}
                </h2>
                <p className="text-sm font-semibold text-slate-500">
                  {reason === "loading"
                    ? "Consultando sua role administrativa."
                    : reason === "login"
                      ? "Entre com sua conta da plataforma antes de abrir o painel."
                      : "Sua conta não possui role em admin_roles."}
                </p>
              </div>
            </div>
            {reason === "login" ? (
              <a
                href="/login"
                className="btn-brutal-accent inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-black"
              >
                Ir para login
                <ShieldCheck className="h-5 w-5" />
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

const contentTabs: Array<{
  type: ContentType;
  label: string;
  supported: boolean;
  description: string;
}> = [
  {
    type: "news",
    label: "Notícias",
    supported: true,
    description: "Adicionar, editar e publicar notícias.",
  },
  {
    type: "external_jobs",
    label: "Vagas",
    supported: true,
    description: "Adicionar, editar e publicar vagas.",
  },
  {
    type: "events",
    label: "Eventos",
    supported: true,
    description: "Adicionar, editar e publicar eventos.",
  },
  {
    type: "areas",
    label: "Áreas",
    supported: true,
    description: "Editar nome, descrições e publicação.",
  },
  {
    type: "courses",
    label: "Cursos",
    supported: true,
    description: "Adicionar, editar, despublicar e remover cursos.",
  },
  {
    type: "roadmaps",
    label: "Roadmaps",
    supported: true,
    description: "Editar título, descrição, duração e publicação.",
  },
];

function emptyContentForm(
  type: ContentType,
): Record<string, string | boolean | number> {
  if (type === "news") {
    return {
      title: "",
      summary: "",
      url: "",
      image_url: "",
      source: "",
      published_at: "",
      is_published: true,
    };
  }

  if (type === "external_jobs") {
    return {
      title: "",
      company: "",
      location: "",
      remote: false,
      seniority: "junior",
      url: "",
      description: "",
      area_slug: "",
      published_at: "",
      is_published: true,
    };
  }

  if (type === "events") {
    return {
      title: "",
      description: "",
      starts_at: "",
      ends_at: "",
      location_label: "",
      city: "",
      online: false,
      url: "",
      is_published: true,
    };
  }

  if (type === "courses") {
    return {
      title: "",
      provider: "",
      url: "",
      area_slug: "",
      level: "iniciante",
      is_free: true,
      workload_hours: 0,
      description: "",
      is_published: true,
    };
  }

  if (type === "areas") {
    return {
      name: "",
      short_description: "",
      full_description: "",
      is_pro: false,
      is_published: true,
    };
  }

  return {
    title: "",
    description: "",
    area_slug: "",
    level: "iniciante",
    estimated_duration_weeks: 0,
    is_pro: false,
    is_published: true,
  };
}

function contentPayload(
  type: ContentType,
  form: Record<string, string | boolean | number>,
) {
  if (type === "news") {
    return {
      title: String(form.title || "").trim(),
      summary: String(form.summary || "").trim(),
      url: String(form.url || "").trim(),
      image_url: String(form.image_url || "").trim(),
      source: String(form.source || "").trim(),
      published_at: String(form.published_at || "").trim() || null,
      is_published: Boolean(form.is_published),
    };
  }

  if (type === "external_jobs") {
    return {
      title: String(form.title || "").trim(),
      company: String(form.company || "").trim(),
      location: String(form.location || "").trim(),
      remote: Boolean(form.remote),
      seniority: String(form.seniority || "junior"),
      url: String(form.url || "").trim(),
      description: String(form.description || "").trim(),
      area_slug: String(form.area_slug || "").trim(),
      published_at: String(form.published_at || "").trim() || null,
      is_published: Boolean(form.is_published),
    };
  }

  if (type === "events") {
    return {
      title: String(form.title || "").trim(),
      description: String(form.description || "").trim(),
      starts_at: String(form.starts_at || "").trim() || null,
      ends_at: String(form.ends_at || "").trim() || null,
      location_label: String(form.location_label || "").trim(),
      city: String(form.city || "").trim(),
      online: Boolean(form.online),
      url: String(form.url || "").trim(),
      is_published: Boolean(form.is_published),
    };
  }

  if (type === "areas") {
    return {
      name: String(form.name || "").trim(),
      short_description: String(form.short_description || "").trim(),
      full_description: String(form.full_description || "").trim(),
      is_pro: Boolean(form.is_pro),
      is_published: Boolean(form.is_published),
    };
  }

  if (type === "courses") {
    return {
      title: String(form.title || "").trim(),
      provider: String(form.provider || "").trim(),
      url: String(form.url || "").trim(),
      area_slug: String(form.area_slug || "").trim(),
      level: String(form.level || "iniciante"),
      is_free: Boolean(form.is_free),
      workload_hours: Number(form.workload_hours || 0),
      description: String(form.description || "").trim(),
      is_published: Boolean(form.is_published),
    };
  }

  return {
    title: String(form.title || "").trim(),
    description: String(form.description || "").trim(),
    area_slug: String(form.area_slug || "").trim(),
    level: String(form.level || "iniciante"),
    estimated_duration_weeks: Number(form.estimated_duration_weeks || 0),
    is_pro: Boolean(form.is_pro),
    is_published: Boolean(form.is_published),
  };
}

type NewsletterSubscriberRow = {
  email: string;
  status: "pending_confirmation" | "confirmed" | "unsubscribed";
  created_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
};

type NewsletterAdminData = {
  counts: {
    pending_confirmation: number;
    confirmed: number;
    unsubscribed: number;
    total: number;
  };
  subscribers: NewsletterSubscriberRow[];
  pagination: { limit: number; offset: number; total: number };
};

type NewsletterStatusFilter =
  | "all"
  | "pending_confirmation"
  | "confirmed"
  | "unsubscribed";

const NEWSLETTER_PAGE_SIZE = 50;

const NEWSLETTER_STATUS_META: Record<
  NewsletterSubscriberRow["status"],
  { label: string; className: string }
> = {
  confirmed: {
    label: "Confirmado",
    className: "border-emerald-600 bg-emerald-50 text-emerald-700",
  },
  pending_confirmation: {
    label: "Pendente",
    className: "border-amber-500 bg-amber-50 text-amber-700",
  },
  unsubscribed: {
    label: "Cancelado",
    className: "border-slate-400 bg-slate-100 text-slate-600",
  },
};

const NEWSLETTER_FILTERS: Array<{ id: NewsletterStatusFilter; label: string }> =
  [
    { id: "all", label: "Todos" },
    { id: "confirmed", label: "Confirmados" },
    { id: "pending_confirmation", label: "Pendentes" },
    { id: "unsubscribed", label: "Cancelados" },
  ];

function formatNewsletterDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NewsletterAdminSection() {
  const [data, setData] = useState<NewsletterAdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<NewsletterStatusFilter>("all");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(NEWSLETTER_PAGE_SIZE));
        params.set("offset", String(offset));
        if (statusFilter !== "all") params.set("status", statusFilter);
        const json = await adminFetch(
          `/newsletter/subscribers?${params.toString()}`,
        );
        if (cancelled) return;
        setData(json.data as NewsletterAdminData);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Erro ao carregar assinantes.",
        );
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, offset]);

  function changeFilter(next: NewsletterStatusFilter) {
    setStatusFilter(next);
    setOffset(0);
  }

  const counts = data?.counts;
  const pagination = data?.pagination;
  const subscribers = data?.subscribers ?? [];
  const canPrev = offset > 0;
  const canNext = pagination
    ? offset + pagination.limit < pagination.total
    : false;

  const countCards = [
    { label: "Confirmados", value: counts?.confirmed ?? 0 },
    { label: "Pendentes", value: counts?.pending_confirmation ?? 0 },
    { label: "Cancelados", value: counts?.unsubscribed ?? 0 },
    { label: "Total", value: counts?.total ?? 0 },
  ];

  return (
    <AdminSection
      id="newsletter"
      eyebrow="newsletter"
      icon={<Mail className="h-4 w-4" />}
      title="Assinantes da newsletter"
      subtitle="Visão somente leitura de quem entrou na newsletter, por status. Sem edição."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {countCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_#0f172a]"
          >
            <p className="text-xs font-black uppercase text-slate-500">
              {card.label}
            </p>
            <p className="font-display text-3xl font-black text-slate-950">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {NEWSLETTER_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => changeFilter(filter.id)}
            className={`rounded-full border-2 border-slate-900 px-4 py-1.5 text-xs font-black uppercase transition-colors ${
              statusFilter === filter.id
                ? "bg-slate-950 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border-2 border-slate-900 bg-white">
        {loading && !data ? (
          <p className="p-6 text-sm font-semibold text-slate-600">
            Carregando assinantes...
          </p>
        ) : error ? (
          <p className="p-6 text-sm font-semibold text-rose-600">{error}</p>
        ) : subscribers.length === 0 ? (
          <p className="p-6 text-sm font-semibold text-slate-600">
            Nenhum assinante ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-50">
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    E-mail
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Inscrição
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Confirmação
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((row) => {
                  const meta = NEWSLETTER_STATUS_META[row.status];
                  return (
                    <tr
                      key={row.email}
                      className="border-b border-slate-200 last:border-0"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {row.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-black ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatNewsletterDate(row.created_at)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatNewsletterDate(row.confirmed_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination && pagination.total > 0 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-500">
            {Math.min(offset + 1, pagination.total)} a{" "}
            {Math.min(offset + pagination.limit, pagination.total)} de{" "}
            {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canPrev || loading}
              onClick={() =>
                setOffset((prev) => Math.max(prev - NEWSLETTER_PAGE_SIZE, 0))
              }
              className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={!canNext || loading}
              onClick={() => setOffset((prev) => prev + NEWSLETTER_PAGE_SIZE)}
              className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      ) : null}
    </AdminSection>
  );
}

type BetaCode = {
  id: string;
  code: string;
  label: string;
  active: boolean;
  created_at: string;
  revoked_at: string | null;
  success_count: number;
  last_access: string | null;
};

type BetaLog = {
  id: string;
  code_id: string | null;
  label: string | null;
  success: boolean;
  attempted_code: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

// Parse simples de user agent por substring, so pra exibir dispositivo e
// navegador no admin. Sem dependencia nova; nao pretende ser exaustivo. Edge e
// Chrome antes de Safari porque suas UAs tambem contem "Safari"/"Chrome".
function parseUserAgent(ua: string | null): string {
  if (!ua) return "-";
  const device = /iPhone|iPad/.test(ua)
    ? "iPhone/iPad"
    : /Android/.test(ua)
      ? "Android"
      : /Windows/.test(ua)
        ? "Windows"
        : /Macintosh|Mac OS/.test(ua)
          ? "Mac"
          : /Linux/.test(ua)
            ? "Linux"
            : "Outro";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Outro";
  return `${device} / ${browser}`;
}

function BetaCodesAdminSection() {
  const [codes, setCodes] = useState<BetaCode[]>([]);
  const [logs, setLogs] = useState<BetaLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<BetaCode | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [codesJson, logsJson] = await Promise.all([
        adminFetch("/beta-codes"),
        adminFetch("/beta-logs?limit=100"),
      ]);
      setCodes(Array.isArray(codesJson.data) ? codesJson.data : []);
      setLogs(Array.isArray(logsJson.data) ? logsJson.data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar códigos.",
      );
      setCodes([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function confirmRevoke() {
    if (!revokeTarget) return;
    setBusyId(revokeTarget.id);
    try {
      await adminFetch(`/beta-codes/${revokeTarget.id}/revoke`, {
        method: "POST",
      });
      // TODO(Ana): toast de código revogado.
      toast.success("Código revogado.");
      setRevokeTarget(null);
      await load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao revogar. Tente de novo.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminSection
      id="beta"
      eyebrow="acesso beta"
      icon={<LockKeyhole className="h-4 w-4" />}
      // TODO(Ana): título e subtítulo da seção de códigos de beta.
      title="Códigos de acesso beta"
      subtitle="Códigos de convite por pessoa e o log de uso do portão de lançamento. O label é só rótulo de log e não concede admin."
    >
      {error ? (
        <p className="rounded-2xl border-2 border-slate-900 bg-white p-6 text-sm font-semibold text-rose-600">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border-2 border-slate-900 bg-white">
        {loading && codes.length === 0 ? (
          <p className="p-6 text-sm font-semibold text-slate-600">
            {/* TODO(Ana) */}
            Carregando códigos...
          </p>
        ) : codes.length === 0 ? (
          <p className="p-6 text-sm font-semibold text-slate-600">
            {/* TODO(Ana) */}
            Nenhum código cadastrado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                {/* TODO(Ana): cabeçalhos da tabela de códigos. */}
                <tr className="border-b-2 border-slate-900 bg-slate-50">
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Label
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Código
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Usos
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Último acesso
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {codes.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-200 last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {row.code}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-black ${
                          row.active
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-rose-300 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {/* TODO(Ana): rótulos de status. */}
                        {row.active ? "Ativo" : "Revogado"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.success_count}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatNewsletterDate(row.last_access)}
                    </td>
                    <td className="px-4 py-3">
                      {row.active ? (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => setRevokeTarget(row)}
                          className="rounded-full border-2 border-slate-900 bg-rose-100 px-3 py-1.5 text-xs font-black text-rose-800 disabled:opacity-40"
                        >
                          {/* TODO(Ana) */}
                          Revogar
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h3 className="mt-8 font-display text-lg font-black text-slate-950">
        {/* TODO(Ana): título da tabela de logs. */}
        Log de tentativas
      </h3>
      <div className="mt-3 overflow-hidden rounded-2xl border-2 border-slate-900 bg-white">
        {logs.length === 0 ? (
          <p className="p-6 text-sm font-semibold text-slate-600">
            {/* TODO(Ana) */}
            Nenhuma tentativa registrada ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                {/* TODO(Ana): cabeçalhos da tabela de logs. */}
                <tr className="border-b-2 border-slate-900 bg-slate-50">
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Data
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Label
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    IP
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Dispositivo/navegador
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Resultado
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-200 last:border-0"
                  >
                    <td className="px-4 py-3 text-slate-600">
                      {formatNewsletterDate(row.created_at)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {row.success ? row.label || "-" : "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {row.ip || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {parseUserAgent(row.user_agent)}
                    </td>
                    <td className="px-4 py-3">
                      {row.success ? (
                        <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-700">
                          {/* TODO(Ana) */}
                          Sucesso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-flex rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-black text-rose-700">
                            {/* TODO(Ana) */}
                            Falha
                          </span>
                          {row.attempted_code ? (
                            <span className="font-mono text-xs text-slate-500">
                              {row.attempted_code}
                            </span>
                          ) : null}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {revokeTarget ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
          <div className="card-brutal max-w-md rounded-3xl bg-white p-6">
            {/* TODO(Ana): copy do modal de confirmação de revogação. */}
            <h3 className="font-display text-2xl font-black text-slate-950">
              Revogar o código de {revokeTarget.label}?
            </h3>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              O código para de funcionar na hora e novas tentativas com ele
              voltam a ser negadas. O histórico de uso é mantido.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black"
              >
                {/* TODO(Ana) */}
                Cancelar
              </button>
              <button
                type="button"
                disabled={busyId === revokeTarget.id}
                onClick={() => void confirmRevoke()}
                className="rounded-full border-2 border-slate-900 bg-rose-100 px-4 py-2 text-sm font-black text-rose-800 disabled:opacity-40"
              >
                {/* TODO(Ana) */}
                Confirmar revogação
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminSection>
  );
}

type EmailCampaignStatus = "draft" | "sending" | "completed" | "failed";

type EmailCampaignCategory = "product" | "promotional";

type EmailCampaign = {
  id: string;
  subject: string;
  body: string;
  image_url: string | null;
  category: EmailCampaignCategory;
  status: EmailCampaignStatus;
  total_recipients: number | null;
  sent_count: number;
  failed_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
};

type EmailCampaignBatchStatus = "pending" | "dispatched" | "canceled";

type EmailBatchSource =
  | "waitlist"
  | "newsletter"
  | "custom"
  | "users"
  | "contact_list";

type ContactListOption = { id: string; name: string; valid_count: number };

type EmailUserSegment = "all" | "never_pro" | "active_pro" | "ex_pro";

type EmailCampaignBatch = {
  id: string;
  mode: "next" | "selected";
  batch_limit: number | null;
  exclude_other_campaigns: boolean;
  source: EmailBatchSource;
  user_segment: EmailUserSegment | null;
  selected_count: number | null;
  scheduled_for: string | null;
  status: EmailCampaignBatchStatus;
  dispatched_at: string | null;
  created_at: string;
};

// TODO(Ana): rótulos das origens de destinatários.
const EMAIL_BATCH_SOURCE_META: Record<EmailBatchSource, string> = {
  waitlist: "Waitlist",
  newsletter: "Newsletter",
  custom: "Lista avulsa",
  users: "Usuários",
  contact_list: "Lista importada",
};

// TODO(Ana): rótulos e descrições das categorias de campanha.
const EMAIL_CAMPAIGN_CATEGORY_META: Record<
  EmailCampaignCategory,
  { label: string; description: string; className: string }
> = {
  product: {
    label: "Produto",
    description:
      "Comunicação da plataforma (novidades, avisos). Vai para qualquer pessoa não suprimida.",
    className: "border-sky-500 bg-sky-100 text-sky-800",
  },
  promotional: {
    label: "Promocional",
    description:
      "Ofertas e promoções. Na origem Usuários, só quem aceitou receber (opt-in).",
    className: "border-violet-500 bg-violet-100 text-violet-800",
  },
};

// TODO(Ana): rótulos dos segmentos de usuários.
const EMAIL_USER_SEGMENT_META: Record<EmailUserSegment, string> = {
  all: "Todos",
  never_pro: "Nunca Pro",
  active_pro: "Pro ativo",
  ex_pro: "Ex-Pro",
};

// Mesma validação de formato do backend (lista avulsa).
const EMAIL_INPUT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_INPUT_MAX_LENGTH = 254;

type EmailCampaignDetail = EmailCampaign & {
  batches: EmailCampaignBatch[];
};

type WaitlistPickerItem = {
  email: string;
  created_at: string;
  status: string;
  already_recipient: boolean;
  suppressed: boolean;
};

// TODO(Ana): rótulos de status dos lotes.
const EMAIL_BATCH_STATUS_META: Record<
  EmailCampaignBatchStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Agendado",
    className: "border-amber-500 bg-amber-100 text-amber-800",
  },
  dispatched: {
    label: "Disparado",
    className: "border-emerald-500 bg-emerald-100 text-emerald-800",
  },
  canceled: {
    label: "Cancelado",
    className: "border-slate-400 bg-slate-100 text-slate-600",
  },
};

const EMAIL_BATCH_MAX_SELECTED = 500;
const EMAIL_BATCH_PICKER_PAGE_SIZE = 20;
const EMAIL_RECIPIENTS_PAGE_SIZE = 20;

type EmailRecipientStatus = "sent" | "failed" | "pending";

type EmailCampaignRecipientRow = {
  email: string;
  status: EmailRecipientStatus;
  sent_at: string | null;
  error: string | null;
};

// TODO(Ana): rótulos de status dos destinatários.
const EMAIL_RECIPIENT_STATUS_META: Record<
  EmailRecipientStatus,
  { label: string; className: string }
> = {
  sent: {
    label: "Enviado",
    className: "border-emerald-500 bg-emerald-100 text-emerald-800",
  },
  failed: {
    label: "Falhou",
    className: "border-rose-500 bg-rose-100 text-rose-800",
  },
  pending: {
    label: "Pendente",
    className: "border-amber-500 bg-amber-100 text-amber-800",
  },
};

// TODO(Ana): rótulos dos filtros de destinatários.
const EMAIL_RECIPIENT_FILTERS: Array<{
  id: "all" | EmailRecipientStatus;
  label: string;
}> = [
  { id: "all", label: "Todos" },
  { id: "sent", label: "Enviados" },
  { id: "failed", label: "Falhas" },
  { id: "pending", label: "Pendentes" },
];

function formatBatchDateTime(value: string | null) {
  if (!value) return "Imediato";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data inválida";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

// TODO(Ana): rótulos de status das campanhas.
const EMAIL_CAMPAIGN_STATUS_META: Record<
  EmailCampaignStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Rascunho",
    className: "border-slate-400 bg-slate-100 text-slate-700",
  },
  sending: {
    label: "Enviando",
    className: "border-amber-500 bg-amber-100 text-amber-800",
  },
  completed: {
    label: "Concluída",
    className: "border-emerald-500 bg-emerald-100 text-emerald-800",
  },
  failed: {
    label: "Falhou",
    className: "border-rose-500 bg-rose-100 text-rose-800",
  },
};

function campaignPendingCount(campaign: EmailCampaign): number | null {
  if (campaign.total_recipients === null) return null;
  return Math.max(
    campaign.total_recipients - campaign.sent_count - campaign.failed_count,
    0,
  );
}

function EmailCampaignsAdminSection() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<EmailCampaignDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageBroken, setImageBroken] = useState(false);
  const [campaignCategory, setCampaignCategory] =
    useState<EmailCampaignCategory>("product");

  const [creating, setCreating] = useState(false);
  const [testBusy, setTestBusy] = useState(false);

  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchMode, setBatchMode] = useState<"next" | "selected">("next");
  const [batchSource, setBatchSource] = useState<EmailBatchSource>("waitlist");
  const [batchSegment, setBatchSegment] = useState<EmailUserSegment>("all");
  const [contactLists, setContactLists] = useState<ContactListOption[]>([]);
  const [selectedContactListId, setSelectedContactListId] = useState("");
  const [contactListsError, setContactListsError] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [excludeOther, setExcludeOther] = useState(true);
  const [whenMode, setWhenMode] = useState<"now" | "schedule">("now");
  const [scheduleText, setScheduleText] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [limitText, setLimitText] = useState("");
  const [batchBusy, setBatchBusy] = useState(false);
  const [eligibleCount, setEligibleCount] = useState<number | null>(null);
  const [eligibleError, setEligibleError] = useState<string | null>(null);

  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(
    () => new Set(),
  );
  const [pickerItems, setPickerItems] = useState<WaitlistPickerItem[]>([]);
  const [pickerTotal, setPickerTotal] = useState<number | null>(null);
  const [pickerOffset, setPickerOffset] = useState(0);
  const [pickerSearchInput, setPickerSearchInput] = useState("");
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const [cancelTarget, setCancelTarget] = useState<EmailCampaignBatch | null>(
    null,
  );
  const [cancelBusy, setCancelBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailCampaign | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [recItems, setRecItems] = useState<EmailCampaignRecipientRow[]>([]);
  const [recTotal, setRecTotal] = useState<number | null>(null);
  const [recOffset, setRecOffset] = useState(0);
  const [recFilter, setRecFilter] = useState<"all" | EmailRecipientStatus>(
    "all",
  );
  const [recSearchInput, setRecSearchInput] = useState("");
  const [recSearch, setRecSearch] = useState("");
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recTick, setRecTick] = useState(0);

  const loadCampaigns = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const json = await adminFetch("/email-campaigns");
      setCampaigns(Array.isArray(json.data) ? (json.data as EmailCampaign[]) : []);
    } catch (err) {
      setListError(
        err instanceof Error ? err.message : "Erro ao carregar campanhas.",
      );
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const json = await adminFetch(`/email-campaigns/${id}`);
      setDetail(json.data as EmailCampaignDetail);
      setDetailError(null);
    } catch (err) {
      // progressFailed: erro é erro e fica visível; NUNCA zera os contadores.
      setDetailError(
        err instanceof Error ? err.message : "Erro ao carregar a campanha.",
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Clique na mesma campanha refaz o fetch: sem isso, um detalhe que falhou
  // no primeiro clique nunca teria retry (o effect so dispara quando o id
  // muda) e o clique pareceria morto.
  function openCampaign(id: string) {
    if (id === selectedId) {
      void loadDetail(id);
      return;
    }
    setSelectedId(id);
  }

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    setRecOffset(0);
    setRecFilter("all");
    setRecSearchInput("");
    setRecSearch("");
    void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    async function loadRecipients() {
      setRecLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(EMAIL_RECIPIENTS_PAGE_SIZE));
        params.set("offset", String(recOffset));
        if (recFilter !== "all") params.set("status", recFilter);
        if (recSearch) params.set("search", recSearch);
        const json = await adminFetch(
          `/email-campaigns/${selectedId}/recipients?${params.toString()}`,
        );
        if (cancelled) return;
        const data = json.data as {
          items: EmailCampaignRecipientRow[];
          pagination: { total: number };
        };
        setRecItems(data.items);
        setRecTotal(data.pagination.total);
        setRecError(null);
      } catch (err) {
        if (cancelled) return;
        // Erro é erro na tela, nunca lista vazia.
        setRecError(
          err instanceof Error
            ? err.message
            : "Erro ao listar os destinatários.",
        );
      } finally {
        if (!cancelled) setRecLoading(false);
      }
    }
    void loadRecipients();
    return () => {
      cancelled = true;
    };
  }, [selectedId, recFilter, recSearch, recOffset, recTick]);

  const polling = detail?.status === "sending";

  useEffect(() => {
    if (!selectedId || !polling) return;
    const timer = window.setInterval(() => {
      void loadDetail(selectedId);
      void loadCampaigns();
      setRecTick((tick) => tick + 1);
    }, 4000);
    return () => {
      window.clearInterval(timer);
    };
  }, [selectedId, polling, loadDetail, loadCampaigns]);

  async function createCampaign() {
    if (!subject.trim() || !bodyText.trim()) {
      // TODO(Ana): mensagens de validação do formulário de campanha.
      toast.error("Preencha assunto e corpo antes de criar.");
      return;
    }
    setCreating(true);
    try {
      const json = await adminFetch("/email-campaigns", {
        method: "POST",
        body: JSON.stringify({
          subject: subject.trim(),
          body: bodyText.trim(),
          image_url: imageUrl.trim() || null,
          category: campaignCategory,
        }),
      });
      const created = json.data as EmailCampaign;
      // TODO(Ana): toasts da criação de campanha.
      toast.success("Campanha criada como rascunho.");
      setSelectedId(created.id);
      setDetail({ ...created, batches: [] });
      setSubject("");
      setBodyText("");
      setImageUrl("");
      setCampaignCategory("product");
      void loadCampaigns();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao criar a campanha.",
      );
    } finally {
      setCreating(false);
    }
  }

  function startEdit() {
    if (!detail || detail.status !== "draft") return;
    setEditingId(detail.id);
    setSubject(detail.subject);
    setBodyText(detail.body);
    setImageUrl(detail.image_url ?? "");
    setCampaignCategory(detail.category);
    setImageBroken(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setSubject("");
    setBodyText("");
    setImageUrl("");
    setCampaignCategory("product");
    setImageBroken(false);
  }

  async function saveEdit() {
    if (!editingId) return;
    if (!subject.trim() || !bodyText.trim()) {
      // TODO(Ana): mensagens de validação do formulário de campanha.
      toast.error("Preencha assunto e corpo antes de salvar.");
      return;
    }
    setCreating(true);
    try {
      await adminFetch(`/email-campaigns/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          subject: subject.trim(),
          body: bodyText.trim(),
          image_url: imageUrl.trim() || null,
          category: campaignCategory,
        }),
      });
      // TODO(Ana): toast da edição.
      toast.success("Campanha atualizada.");
      const savedId = editingId;
      cancelEdit();
      void loadDetail(savedId);
      void loadCampaigns();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar a campanha.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function confirmDeleteCampaign() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await adminFetch(`/email-campaigns/${deleteTarget.id}`, {
        method: "DELETE",
      });
      // TODO(Ana): toast da exclusão.
      toast.success("Campanha excluída.");
      if (editingId === deleteTarget.id) cancelEdit();
      setDeleteTarget(null);
      setSelectedId(null);
      void loadCampaigns();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao excluir a campanha.",
      );
    } finally {
      setDeleteBusy(false);
    }
  }

  async function sendTest() {
    if (!detail) return;
    setTestBusy(true);
    try {
      const json = await adminFetch(`/email-campaigns/${detail.id}/test`, {
        method: "POST",
      });
      const to = (json.data as { to?: string }).to;
      // TODO(Ana): toasts do envio de teste.
      toast.success(to ? `Teste enviado para ${to}.` : "Teste enviado.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao enviar o teste.",
      );
    } finally {
      setTestBusy(false);
    }
  }

  const loadEligibleCount = useCallback(
    async (
      campaignId: string,
      exclude: boolean,
      source: "waitlist" | "newsletter" | "users",
      segment: EmailUserSegment = "all",
    ) => {
      setEligibleCount(null);
      setEligibleError(null);
      try {
        const params = new URLSearchParams();
        params.set("campaignId", campaignId);
        params.set("source", source);
        if (source === "users") params.set("segment", segment);
        if (exclude) params.set("excludeOtherCampaigns", "true");
        const json = await adminFetch(
          `/email-campaigns/audience-count?${params.toString()}`,
        );
        setEligibleCount((json.data as { count: number }).count);
      } catch (err) {
        // Erro de contagem é exibido como erro, nunca como zero.
        setEligibleError(
          err instanceof Error ? err.message : "Erro ao contar os elegíveis.",
        );
      }
    },
    [],
  );

  function openBatchModal() {
    if (!detail) return;
    setBatchModalOpen(true);
    setBatchMode("next");
    setBatchSource("waitlist");
    setCustomText("");
    setExcludeOther(true);
    setWhenMode("now");
    setScheduleText("");
    setConfirmText("");
    setLimitText("");
    setSelectedEmails(new Set());
    setPickerOffset(0);
    setPickerSearchInput("");
    setPickerSearch("");
    setPickerError(null);
    setSelectedContactListId("");
    setContactLists([]);
    setContactListsError(null);
    void loadEligibleCount(detail.id, true, "waitlist");
  }

  async function loadContactListsForBatch() {
    setContactListsError(null);
    try {
      const json = await adminFetch("/contact-lists?page=1&pageSize=100");
      const rows = (json.data as { rows: ContactListOption[] }).rows ?? [];
      setContactLists(rows);
    } catch (err) {
      setContactLists([]);
      setContactListsError(
        err instanceof Error ? err.message : "Erro ao carregar as listas.",
      );
    }
  }

  function selectBatchSource(next: EmailBatchSource) {
    if (!detail || next === batchSource) return;
    setBatchSource(next);
    setBatchSegment("all");
    setSelectedEmails(new Set());
    setPickerOffset(0);
    setPickerSearchInput("");
    setPickerSearch("");
    setPickerError(null);
    setCustomText("");
    setLimitText("");
    setSelectedContactListId("");
    if (next === "custom") {
      // Lista avulsa é sempre a lista colada: sem modo "próximos" nem contagem
      // de origem (a contagem útil é a de e-mails válidos colados).
      setBatchMode("selected");
      setEligibleCount(null);
      setEligibleError(null);
    } else if (next === "contact_list") {
      // Lista importada: modo selected, sem contagem de origem (a contagem util
      // e a de validos da lista). O server resolve os membros validos.
      setBatchMode("selected");
      setEligibleCount(null);
      setEligibleError(null);
      void loadContactListsForBatch();
    } else {
      setBatchMode("next");
      void loadEligibleCount(detail.id, excludeOther, next, "all");
    }
  }

  function selectBatchSegment(next: EmailUserSegment) {
    if (!detail || next === batchSegment) return;
    setBatchSegment(next);
    setSelectedEmails(new Set());
    setPickerOffset(0);
    if (batchSource === "users") {
      void loadEligibleCount(detail.id, excludeOther, "users", next);
    }
  }

  function toggleExcludeOther() {
    if (!detail) return;
    const next = !excludeOther;
    setExcludeOther(next);
    if (
      batchSource !== "custom" &&
      batchSource !== "contact_list" &&
      batchSource !== "users"
    ) {
      void loadEligibleCount(detail.id, next, batchSource, batchSegment);
    } else if (batchSource === "users") {
      void loadEligibleCount(detail.id, next, "users", batchSegment);
    }
  }

  const parsedCustom = useMemo(() => {
    const valid: string[] = [];
    const invalid: string[] = [];
    const seen = new Set<string>();
    for (const raw of customText.split(/[\s,;]+/)) {
      const email = raw.trim().toLowerCase();
      if (!email || seen.has(email)) continue;
      seen.add(email);
      if (
        email.length <= EMAIL_INPUT_MAX_LENGTH &&
        EMAIL_INPUT_PATTERN.test(email)
      ) {
        valid.push(email);
      } else {
        invalid.push(email);
      }
    }
    return { valid, invalid };
  }, [customText]);

  useEffect(() => {
    if (
      !batchModalOpen ||
      batchMode !== "selected" ||
      batchSource === "custom" ||
      !selectedId
    )
      return;
    let cancelled = false;
    async function loadPicker() {
      setPickerLoading(true);
      setPickerError(null);
      try {
        const params = new URLSearchParams();
        params.set("campaignId", selectedId ?? "");
        params.set("source", batchSource);
        if (batchSource === "users") params.set("segment", batchSegment);
        params.set("limit", String(EMAIL_BATCH_PICKER_PAGE_SIZE));
        params.set("offset", String(pickerOffset));
        if (pickerSearch) params.set("search", pickerSearch);
        const json = await adminFetch(
          `/email-campaigns/audience-recipients?${params.toString()}`,
        );
        if (cancelled) return;
        const data = json.data as {
          items: WaitlistPickerItem[];
          pagination: { total: number };
        };
        setPickerItems(data.items);
        setPickerTotal(data.pagination.total);
      } catch (err) {
        if (cancelled) return;
        setPickerError(
          err instanceof Error ? err.message : "Erro ao listar a waitlist.",
        );
        setPickerItems([]);
        setPickerTotal(null);
      } finally {
        if (!cancelled) setPickerLoading(false);
      }
    }
    void loadPicker();
    return () => {
      cancelled = true;
    };
  }, [
    batchModalOpen,
    batchMode,
    batchSource,
    batchSegment,
    selectedId,
    pickerOffset,
    pickerSearch,
  ]);

  function toggleSelectedEmail(email: string) {
    setSelectedEmails((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(email)) {
        nextSet.delete(email);
        return nextSet;
      }
      if (nextSet.size >= EMAIL_BATCH_MAX_SELECTED) {
        // TODO(Ana): aviso de limite de seleção.
        toast.error(
          `Máximo de ${EMAIL_BATCH_MAX_SELECTED} e-mails por lote.`,
        );
        return prev;
      }
      nextSet.add(email);
      return nextSet;
    });
  }

  async function submitBatch() {
    if (!detail) return;

    let limit: number | undefined;
    if (batchSource === "custom") {
      if (parsedCustom.valid.length === 0) {
        // TODO(Ana): mensagem de lista colada vazia.
        toast.error("Cole ao menos um e-mail válido para o lote.");
        return;
      }
      if (parsedCustom.valid.length > EMAIL_BATCH_MAX_SELECTED) {
        // TODO(Ana): mensagem de lista colada acima do limite.
        toast.error(
          `Máximo de ${EMAIL_BATCH_MAX_SELECTED} e-mails por lote.`,
        );
        return;
      }
    } else if (batchSource === "contact_list") {
      if (!selectedContactListId) {
        // TODO(Ana): mensagem de lista importada nao selecionada.
        toast.error("Selecione a lista importada.");
        return;
      }
    } else if (batchMode === "next") {
      const trimmedLimit = limitText.trim();
      if (trimmedLimit) {
        const parsed = Number(trimmedLimit);
        if (!Number.isInteger(parsed) || parsed < 1) {
          // TODO(Ana): mensagem de limite inválido.
          toast.error("O limite precisa ser um número inteiro maior que zero.");
          return;
        }
        limit = parsed;
      }
    } else if (selectedEmails.size === 0) {
      // TODO(Ana): mensagem de seleção vazia.
      toast.error("Selecione ao menos um e-mail para o lote.");
      return;
    }

    let scheduledFor: string | undefined;
    if (whenMode === "schedule") {
      if (!scheduleText) {
        // TODO(Ana): mensagem de agendamento sem data.
        toast.error("Escolha a data e a hora do agendamento.");
        return;
      }
      const date = new Date(scheduleText);
      if (Number.isNaN(date.getTime())) {
        toast.error("Data de agendamento inválida.");
        return;
      }
      scheduledFor = date.toISOString();
    }

    setBatchBusy(true);
    try {
      const userSegment = batchSource === "users" ? batchSegment : undefined;
      let payload: Record<string, unknown>;
      if (batchSource === "contact_list") {
        // Lista importada: o server resolve os membros validos pelo id da lista.
        payload = {
          mode: "selected",
          source: "contact_list",
          contactListId: selectedContactListId,
          scheduledFor,
          excludeOtherCampaigns: excludeOther,
        };
      } else if (batchSource !== "custom" && batchMode === "next") {
        payload = {
          mode: "next",
          source: batchSource,
          userSegment,
          limit,
          scheduledFor,
          excludeOtherCampaigns: excludeOther,
        };
      } else {
        payload = {
          mode: "selected",
          source: batchSource,
          userSegment,
          emails:
            batchSource === "custom"
              ? parsedCustom.valid
              : Array.from(selectedEmails),
          scheduledFor,
          excludeOtherCampaigns: excludeOther,
        };
      }
      const json = await adminFetch(`/email-campaigns/${detail.id}/batches`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = json.data as { scheduled: boolean; enqueued?: number };
      // TODO(Ana): toasts do lote.
      toast.success(
        data.scheduled
          ? "Lote agendado."
          : `${data.enqueued ?? 0} envios enfileirados.`,
      );
      setBatchModalOpen(false);
      void loadDetail(detail.id);
      void loadCampaigns();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao criar o lote.",
      );
    } finally {
      setBatchBusy(false);
    }
  }

  async function confirmCancelBatch() {
    if (!detail || !cancelTarget) return;
    setCancelBusy(true);
    try {
      await adminFetch(
        `/email-campaigns/${detail.id}/batches/${cancelTarget.id}`,
        { method: "DELETE" },
      );
      // TODO(Ana): toast do cancelamento de lote.
      toast.success("Lote cancelado.");
      setCancelTarget(null);
      void loadDetail(detail.id);
      void loadCampaigns();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao cancelar o lote.",
      );
    } finally {
      setCancelBusy(false);
    }
  }

  const previewBodyHtml = renderCampaignBodyHtml(bodyText);
  const trimmedImageUrl = imageUrl.trim();
  const pending = detail ? campaignPendingCount(detail) : null;
  const progressPercent =
    detail && detail.total_recipients
      ? Math.min(
          Math.round(
            ((detail.sent_count + detail.failed_count) /
              detail.total_recipients) *
              100,
          ),
          100,
        )
      : 0;

  return (
    <AdminSection
      id="emails"
      eyebrow="emails"
      icon={<Send className="h-4 w-4" />}
      // TODO(Ana): título e subtítulo da aba Emails.
      title="Campanhas de e-mail para a waitlist"
      subtitle="Crie uma campanha, envie um teste para você e dispare para a lista de espera com fila e limite de velocidade."
    >
      <div className="mb-8 border-b-4 border-slate-900 pb-8">
        <ContactListsManager />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="card-brutal rounded-3xl bg-white p-6">
          {/* TODO(Ana): rótulos do formulário de campanha. */}
          <h3 className="font-display text-2xl font-black">
            {editingId ? "Editar campanha" : "Nova campanha"}
          </h3>
          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="email-campaign-subject"
                className="text-xs font-black uppercase text-slate-500"
              >
                Assunto
              </label>
              <input
                id="email-campaign-subject"
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold"
              />
            </div>
            <div>
              <label
                htmlFor="email-campaign-body"
                className="text-xs font-black uppercase text-slate-500"
              >
                Corpo
              </label>
              <textarea
                id="email-campaign-body"
                value={bodyText}
                onChange={(event) => setBodyText(event.target.value)}
                rows={8}
                // TODO(Ana): placeholder do corpo.
                placeholder="Quebra de linha dupla vira parágrafo."
                className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold"
              />
            </div>
            <div>
              {/* TODO(Ana): rótulo do campo de categoria. */}
              <p className="text-xs font-black uppercase text-slate-500">
                Categoria
              </p>
              <div className="mt-1 space-y-2">
                {(
                  Object.keys(
                    EMAIL_CAMPAIGN_CATEGORY_META,
                  ) as EmailCampaignCategory[]
                ).map((option) => {
                  const meta = EMAIL_CAMPAIGN_CATEGORY_META[option];
                  return (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 p-3 ${
                        campaignCategory === option
                          ? "border-slate-900 bg-amber-50"
                          : "border-slate-300 bg-white hover:border-slate-500"
                      }`}
                    >
                      <input
                        type="radio"
                        name="email-campaign-category"
                        value={option}
                        checked={campaignCategory === option}
                        onChange={() => setCampaignCategory(option)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-slate-950"
                      />
                      <span>
                        <span className="block text-sm font-black text-slate-900">
                          {meta.label}
                        </span>
                        <span className="block text-xs font-semibold text-slate-600">
                          {meta.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <label
                htmlFor="email-campaign-image"
                className="text-xs font-black uppercase text-slate-500"
              >
                URL da imagem (opcional)
              </label>
              <input
                id="email-campaign-image"
                type="url"
                value={imageUrl}
                onChange={(event) => {
                  setImageUrl(event.target.value);
                  setImageBroken(false);
                }}
                // TODO(Ana): placeholder da URL de imagem.
                placeholder="URL pública do Supabase Storage"
                className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={creating}
                onClick={() =>
                  void (editingId ? saveEdit() : createCampaign())
                }
                className="bnt-pressable rounded-full border-2 border-slate-900 bg-[#FFB800] px-5 py-2 text-sm font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a] disabled:opacity-40"
              >
                {/* TODO(Ana) */}
                {creating
                  ? "Salvando..."
                  : editingId
                    ? "Salvar alterações"
                    : "Criar campanha"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-full border-2 border-slate-900 bg-white px-5 py-2 text-sm font-black uppercase text-slate-700 hover:bg-slate-100"
                >
                  {/* TODO(Ana) */}
                  Cancelar edição
                </button>
              ) : null}
            </div>
          </div>
        </article>

        <article className="card-brutal rounded-3xl bg-white p-6">
          {/* TODO(Ana): título do preview. */}
          <h3 className="font-display text-2xl font-black">Preview do e-mail</h3>
          <div className="mt-4 rounded-2xl border-2 border-slate-900 bg-[#F1F5F9] p-4">
            <div className="mx-auto max-w-md border-4 border-slate-950 bg-white">
              {trimmedImageUrl && !imageBroken ? (
                <img
                  src={trimmedImageUrl}
                  // TODO(Ana): alt text generico do hero da campanha.
                  alt="Imagem da campanha do Bora na Tech"
                  onError={() => setImageBroken(true)}
                  className="block w-full max-w-full"
                />
              ) : null}
              <div className="p-5">
                {trimmedImageUrl && imageBroken ? (
                  <p className="mb-3 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">
                    {/* TODO(Ana): erro de imagem no preview. */}
                    Não foi possível carregar a imagem dessa URL.
                  </p>
                ) : null}
                <p className="font-display text-xs font-black text-slate-950">
                  BORA NA TECH
                </p>
                <h4 className="font-display mt-3 text-xl font-black text-slate-950">
                  {subject.trim() || "Assunto da campanha"}
                </h4>
                {bodyText.trim() ? (
                  <div
                    className="mt-3"
                    dangerouslySetInnerHTML={{ __html: previewBodyHtml }}
                  />
                ) : (
                  <p className="mt-3 text-sm font-semibold text-slate-400">
                    {/* TODO(Ana): placeholder do preview vazio. */}O corpo da
                    campanha aparece aqui.
                  </p>
                )}
                <div className="mt-4 border-t-2 border-slate-200 pt-3 text-center text-[11px] font-semibold text-slate-400">
                  {/* TODO(Ana): rodapé do preview. */}
                  <p>
                    Você está recebendo este e-mail porque entrou na lista de
                    espera do Bora na Tech.
                  </p>
                  <p className="mt-1 underline">
                    Não quero mais receber estes e-mails
                  </p>
                  <p className="mt-1">
                    Enviado por Bora na Tech (oi@boranatech.com.br)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      {selectedId && !detail && (detailLoading || detailError) ? (
        <article className="card-brutal mt-5 rounded-3xl bg-white p-6">
          {detailLoading ? (
            <p className="text-sm font-semibold text-slate-600">
              {/* TODO(Ana) */}
              Carregando campanha...
            </p>
          ) : (
            <div>
              <p className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                {detailError}
              </p>
              <button
                type="button"
                onClick={() => void loadDetail(selectedId)}
                className="mt-3 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black uppercase text-slate-700 hover:bg-slate-100"
              >
                {/* TODO(Ana) */}
                Tentar de novo
              </button>
            </div>
          )}
        </article>
      ) : null}

      {detail ? (
        <article className="card-brutal mt-5 rounded-3xl bg-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-display truncate text-2xl font-black">
                {detail.subject}
              </h3>
              <span className="mt-2 inline-flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-black ${EMAIL_CAMPAIGN_STATUS_META[detail.status].className}`}
                >
                  {EMAIL_CAMPAIGN_STATUS_META[detail.status].label}
                </span>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-black ${EMAIL_CAMPAIGN_CATEGORY_META[detail.category].className}`}
                >
                  {EMAIL_CAMPAIGN_CATEGORY_META[detail.category].label}
                </span>
              </span>
              {detail.status !== "draft" ? (
                <p className="mt-2 text-xs font-bold text-slate-500">
                  {/* TODO(Ana): aviso de campanha imutável. */}
                  Campanha que já iniciou envio não pode ser editada nem
                  excluída.
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {detail.status === "draft" ? (
                <>
                  <button
                    type="button"
                    onClick={startEdit}
                    className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black uppercase text-slate-700 hover:bg-slate-100"
                  >
                    {/* TODO(Ana) */}
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(detail)}
                    className="rounded-full border-2 border-slate-900 bg-rose-100 px-4 py-2 text-xs font-black uppercase text-rose-800 hover:bg-rose-200"
                  >
                    {/* TODO(Ana) */}
                    Excluir
                  </button>
                </>
              ) : null}
              {detail.status === "draft" || detail.status === "sending" ? (
                <button
                  type="button"
                  disabled={testBusy}
                  onClick={() => void sendTest()}
                  className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black uppercase text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  {/* TODO(Ana) */}
                  {testBusy ? "Enviando teste..." : "Enviar teste para mim"}
                </button>
              ) : null}
              {detail.status === "draft" || detail.status === "sending" ? (
                <button
                  type="button"
                  onClick={openBatchModal}
                  className="bnt-pressable rounded-full border-2 border-slate-900 bg-[#FFB800] px-4 py-2 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]"
                >
                  {/* TODO(Ana) */}
                  {detail.status === "draft"
                    ? "Enviar para a waitlist"
                    : "Novo lote"}
                </button>
              ) : null}
            </div>
          </div>

          {detailError ? (
            <p className="mt-4 rounded-2xl border-2 border-rose-300 bg-rose-50 p-3 text-sm font-bold text-rose-700">
              {detailError}
            </p>
          ) : null}

          {detail.status !== "draft" ? (
            <div className="mt-5">
              <div className="grid gap-4 sm:grid-cols-3">
                {/* TODO(Ana): rótulos dos contadores de progresso. */}
                {[
                  { label: "Enviados", value: detail.sent_count },
                  { label: "Falhas", value: detail.failed_count },
                  { label: "Pendentes", value: pending },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_#0f172a]"
                  >
                    <p className="text-xs font-black uppercase text-slate-500">
                      {card.label}
                    </p>
                    <p className="font-display text-3xl font-black text-slate-950">
                      {card.value ?? "?"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs font-black uppercase text-slate-500">
                  {/* TODO(Ana): rótulo da barra de progresso. */}
                  <span>Progresso</span>
                  <span>
                    {detail.sent_count + detail.failed_count} de{" "}
                    {detail.total_recipients ?? "?"}
                  </span>
                </div>
                <div className="h-4 overflow-hidden rounded-full border-2 border-slate-900 bg-slate-100">
                  <div
                    className="h-full bg-emerald-500 transition-[width] duration-500 motion-reduce:transition-none"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {detail.batches.length > 0 ? (
            <div className="mt-5">
              {/* TODO(Ana): título da seção de lotes. */}
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Lotes
              </h4>
              <div className="mt-2 overflow-hidden rounded-2xl border-2 border-slate-900 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-900 bg-slate-50">
                        {/* TODO(Ana): cabeçalhos da tabela de lotes. */}
                        <th className="px-4 py-3 font-black uppercase text-slate-600">
                          Origem
                        </th>
                        <th className="px-4 py-3 font-black uppercase text-slate-600">
                          Modo
                        </th>
                        <th className="px-4 py-3 font-black uppercase text-slate-600">
                          Quantidade
                        </th>
                        <th className="px-4 py-3 font-black uppercase text-slate-600">
                          Agendado para
                        </th>
                        <th className="px-4 py-3 font-black uppercase text-slate-600">
                          Status
                        </th>
                        <th className="px-4 py-3 font-black uppercase text-slate-600">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.batches.map((batch) => {
                        const meta = EMAIL_BATCH_STATUS_META[batch.status];
                        return (
                          <tr
                            key={batch.id}
                            className="border-b border-slate-200 last:border-0"
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {EMAIL_BATCH_SOURCE_META[batch.source] ??
                                batch.source}
                              {batch.user_segment
                                ? ` (${EMAIL_USER_SEGMENT_META[batch.user_segment]})`
                                : ""}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {/* TODO(Ana): rótulos dos modos de lote. */}
                              {batch.mode === "next"
                                ? "Próximos da fila"
                                : "Selecionados"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {batch.mode === "next"
                                ? (batch.batch_limit ?? "Todos os restantes")
                                : (batch.selected_count ?? "?")}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatBatchDateTime(batch.scheduled_for)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-black ${meta.className}`}
                              >
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {batch.status === "pending" &&
                              batch.scheduled_for ? (
                                <button
                                  type="button"
                                  onClick={() => setCancelTarget(batch)}
                                  className="rounded-full border-2 border-slate-900 bg-rose-100 px-3 py-1 text-xs font-black uppercase text-rose-800 hover:bg-rose-200"
                                >
                                  {/* TODO(Ana) */}
                                  Cancelar
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {detail.status !== "draft" ? (
            <div className="mt-5">
              {/* TODO(Ana): título da seção de destinatários. */}
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Destinatários
              </h4>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {EMAIL_RECIPIENT_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => {
                      setRecFilter(filter.id);
                      setRecOffset(0);
                    }}
                    className={`rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black uppercase transition-colors motion-reduce:transition-none ${
                      recFilter === filter.id
                        ? "bg-slate-950 text-white"
                        : "bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {filter.label}
                    {filter.id === "sent"
                      ? ` (${detail.sent_count})`
                      : filter.id === "failed"
                        ? ` (${detail.failed_count})`
                        : filter.id === "pending"
                          ? ` (${pending ?? "?"})`
                          : ""}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={recSearchInput}
                  onChange={(event) => setRecSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      setRecOffset(0);
                      setRecSearch(recSearchInput.trim());
                    }
                  }}
                  // TODO(Ana): placeholder da busca de destinatários.
                  placeholder="Buscar por e-mail"
                  className="w-full max-w-sm rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={() => {
                    setRecOffset(0);
                    setRecSearch(recSearchInput.trim());
                  }}
                  className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black uppercase text-slate-700 hover:bg-slate-100"
                >
                  {/* TODO(Ana) */}
                  Buscar
                </button>
              </div>
              <div className="mt-2 overflow-hidden rounded-2xl border-2 border-slate-900 bg-white">
                {recError ? (
                  <p className="p-4 text-sm font-semibold text-rose-600">
                    {recError}
                  </p>
                ) : recLoading && recItems.length === 0 ? (
                  <p className="p-4 text-sm font-semibold text-slate-600">
                    {/* TODO(Ana) */}
                    Carregando destinatários...
                  </p>
                ) : recItems.length === 0 ? (
                  <p className="p-4 text-sm font-semibold text-slate-600">
                    {/* TODO(Ana) */}
                    Nenhum destinatário nesse filtro.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b-2 border-slate-900 bg-slate-50">
                          {/* TODO(Ana): cabeçalhos da tabela de destinatários. */}
                          <th className="px-4 py-3 font-black uppercase text-slate-600">
                            E-mail
                          </th>
                          <th className="px-4 py-3 font-black uppercase text-slate-600">
                            Status
                          </th>
                          <th className="px-4 py-3 font-black uppercase text-slate-600">
                            Enviado em
                          </th>
                          <th className="px-4 py-3 font-black uppercase text-slate-600">
                            Erro
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recItems.map((row) => {
                          const meta = EMAIL_RECIPIENT_STATUS_META[row.status];
                          return (
                            <tr
                              key={row.email}
                              className="border-b border-slate-200 last:border-0"
                            >
                              <td className="px-4 py-3 font-semibold text-slate-900">
                                {row.email}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-black ${meta.className}`}
                                >
                                  {meta.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {row.sent_at
                                  ? formatBatchDateTime(row.sent_at)
                                  : "-"}
                              </td>
                              <td className="max-w-[16rem] truncate px-4 py-3 text-slate-600">
                                {row.error ?? "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {recTotal !== null && recTotal > 0 ? (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-slate-500">
                    {Math.min(recOffset + 1, recTotal)} a{" "}
                    {Math.min(recOffset + EMAIL_RECIPIENTS_PAGE_SIZE, recTotal)}{" "}
                    de {recTotal}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={recOffset === 0 || recLoading}
                      onClick={() =>
                        setRecOffset((prev) =>
                          Math.max(prev - EMAIL_RECIPIENTS_PAGE_SIZE, 0),
                        )
                      }
                      className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {/* TODO(Ana) */}
                      Anterior
                    </button>
                    <button
                      type="button"
                      disabled={
                        recLoading ||
                        recOffset + EMAIL_RECIPIENTS_PAGE_SIZE >= recTotal
                      }
                      onClick={() =>
                        setRecOffset(
                          (prev) => prev + EMAIL_RECIPIENTS_PAGE_SIZE,
                        )
                      }
                      className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {/* TODO(Ana) */}
                      Próxima
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </article>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-2xl border-2 border-slate-900 bg-white">
        {listLoading && campaigns.length === 0 ? (
          <p className="p-6 text-sm font-semibold text-slate-600">
            {/* TODO(Ana) */}
            Carregando campanhas...
          </p>
        ) : listError ? (
          <p className="p-6 text-sm font-semibold text-rose-600">{listError}</p>
        ) : campaigns.length === 0 ? (
          <p className="p-6 text-sm font-semibold text-slate-600">
            {/* TODO(Ana) */}
            Nenhuma campanha ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-50">
                  {/* TODO(Ana): cabeçalhos da tabela de campanhas. */}
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Assunto
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Enviados
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Falhas
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Total
                  </th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">
                    Criada em
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => {
                  const meta = EMAIL_CAMPAIGN_STATUS_META[campaign.status];
                  return (
                    <tr
                      key={campaign.id}
                      onClick={() => openCampaign(campaign.id)}
                      className={`cursor-pointer border-b border-slate-200 last:border-0 hover:bg-slate-50 ${
                        selectedId === campaign.id ? "bg-amber-50" : ""
                      }`}
                    >
                      <td className="max-w-[16rem] px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openCampaign(campaign.id)}
                          className="block w-full truncate text-left font-semibold text-slate-900 underline-offset-2 hover:underline"
                        >
                          {campaign.subject}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-black ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {campaign.sent_count}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {campaign.failed_count}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {campaign.total_recipients ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatAdminDate(campaign.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {batchModalOpen && detail ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
          <div className="card-brutal max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6">
            {/* TODO(Ana): copy do modal de novo lote. */}
            <h3 className="font-display text-2xl font-black text-slate-950">
              Novo lote de envio
            </h3>
            <div className="mt-4">
              {/* TODO(Ana): rótulo do passo de origem. */}
              <p className="text-xs font-black uppercase text-slate-500">
                Origem
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { id: "waitlist" as const, label: "Waitlist" },
                  { id: "newsletter" as const, label: "Newsletter" },
                  { id: "custom" as const, label: "Lista avulsa" },
                  { id: "users" as const, label: "Usuários" },
                  { id: "contact_list" as const, label: "Lista importada" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectBatchSource(option.id)}
                    className={`rounded-full border-2 border-slate-900 px-4 py-1.5 text-xs font-black uppercase transition-colors motion-reduce:transition-none ${
                      batchSource === option.id
                        ? "bg-slate-950 text-white"
                        : "bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {batchSource === "users" ? (
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {/* TODO(Ana): explicação da regra de consentimento. */}
                  {detail.category === "promotional"
                    ? "Campanha promocional: só usuários que aceitaram receber (opt-in)."
                    : "Campanha de produto: usuários da plataforma não suprimidos."}
                </p>
              ) : null}
            </div>

            {batchSource === "users" ? (
              <div className="mt-4">
                {/* TODO(Ana): rótulo do seletor de segmento. */}
                <p className="text-xs font-black uppercase text-slate-500">
                  Segmento
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    Object.keys(EMAIL_USER_SEGMENT_META) as EmailUserSegment[]
                  ).map((segment) => (
                    <button
                      key={segment}
                      type="button"
                      onClick={() => selectBatchSegment(segment)}
                      className={`rounded-full border-2 border-slate-900 px-4 py-1.5 text-xs font-black uppercase transition-colors motion-reduce:transition-none ${
                        batchSegment === segment
                          ? "bg-slate-950 text-white"
                          : "bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {EMAIL_USER_SEGMENT_META[segment]}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {batchSource === "contact_list" ? (
              <div className="mt-4">
                {/* TODO(Ana): rótulo do seletor de lista importada. */}
                <p className="text-xs font-black uppercase text-slate-500">
                  Lista importada
                </p>
                {contactListsError ? (
                  <p className="mt-2 rounded-2xl border-2 border-rose-300 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                    {contactListsError}
                  </p>
                ) : contactLists.length === 0 ? (
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    {/* TODO(Ana): mensagem sem listas importadas. */}
                    Nenhuma lista importada. Importe uma lista no bloco acima.
                  </p>
                ) : (
                  <select
                    value={selectedContactListId}
                    onChange={(event) =>
                      setSelectedContactListId(event.target.value)
                    }
                    className="mt-2 block w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
                  >
                    <option value="">Escolha uma lista...</option>
                    {contactLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name} ({list.valid_count} válidos)
                      </option>
                    ))}
                  </select>
                )}
                <p className="mt-2 text-xs font-bold text-slate-500">
                  {/* TODO(Ana): explicação da reconsulta no envio. */}
                  No envio, cada lote pega até 500 válidos novos; supressão e
                  consentimento são reconsultados na hora.
                </p>
              </div>
            ) : null}

            {batchSource !== "custom" && batchSource !== "contact_list" ? (
              eligibleError ? (
                <p className="mt-3 rounded-2xl border-2 border-rose-300 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                  {eligibleError}
                </p>
              ) : eligibleCount === 0 &&
                batchSource === "users" &&
                detail.category === "promotional" ? (
                <p className="mt-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 text-sm font-bold text-amber-800">
                  {/* TODO(Ana): aviso de promocional sem opt-in. */}
                  Nenhum usuário deste segmento aceitou receber e-mails
                  promocionais ainda. Campanha promocional só vai para quem tem
                  opt-in.
                </p>
              ) : (
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  {eligibleCount === null
                    ? "Contando destinatários elegíveis..."
                    : `${eligibleCount} pessoas elegíveis nesta origem.`}
                </p>
              )
            ) : null}

            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={excludeOther}
                onChange={toggleExcludeOther}
                className="h-4 w-4 accent-slate-950"
              />
              {/* TODO(Ana): rótulo do filtro entre campanhas. */}
              Pular quem já recebeu outra campanha
            </label>

            {batchSource === "contact_list" ? null : batchSource !== "custom" ? (
              <div className="mt-4">
                {/* TODO(Ana): rótulos dos modos. */}
                <p className="text-xs font-black uppercase text-slate-500">
                  Destinatários
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { id: "next" as const, label: "Próximos da fila" },
                    { id: "selected" as const, label: "Selecionar e-mails" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setBatchMode(option.id)}
                      className={`rounded-full border-2 border-slate-900 px-4 py-1.5 text-xs font-black uppercase transition-colors motion-reduce:transition-none ${
                        batchMode === option.id
                          ? "bg-slate-950 text-white"
                          : "bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <label
                  htmlFor="email-batch-custom"
                  className="text-xs font-black uppercase text-slate-500"
                >
                  {/* TODO(Ana): rótulo da lista avulsa. */}
                  Colar lista de e-mails
                </label>
                <textarea
                  id="email-batch-custom"
                  value={customText}
                  onChange={(event) => setCustomText(event.target.value)}
                  rows={6}
                  // TODO(Ana): placeholder da lista avulsa.
                  placeholder="Um e-mail por linha (vírgula e ponto e vírgula também separam)."
                  className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold"
                />
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-bold">
                  <span className="text-slate-600">
                    {/* TODO(Ana): contador da lista avulsa. */}
                    {parsedCustom.valid.length} e-mails válidos
                  </span>
                  {parsedCustom.invalid.length > 0 ? (
                    <span className="text-rose-700">
                      {/* TODO(Ana): aviso de inválidos ignorados. */}
                      {parsedCustom.invalid.length} inválidos (serão ignorados)
                    </span>
                  ) : null}
                  {parsedCustom.valid.length > EMAIL_BATCH_MAX_SELECTED ? (
                    <span className="text-amber-700">
                      {/* TODO(Ana): aviso de limite da lista avulsa. */}
                      Acima do limite de {EMAIL_BATCH_MAX_SELECTED} por lote.
                    </span>
                  ) : null}
                </div>
              </div>
            )}

            {batchSource === "custom" || batchSource === "contact_list" ? null : batchMode === "next" ? (
              <div className="mt-4">
                <label
                  htmlFor="email-batch-limit"
                  className="text-xs font-black uppercase text-slate-500"
                >
                  {/* TODO(Ana) */}
                  Quantidade (opcional)
                </label>
                <input
                  id="email-batch-limit"
                  type="number"
                  min={1}
                  value={limitText}
                  onChange={(event) => setLimitText(event.target.value)}
                  // TODO(Ana): placeholder da quantidade.
                  placeholder="Vazio envia para todos os restantes"
                  className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold"
                />
              </div>
            ) : (
              <div className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-black uppercase text-slate-500">
                    {/* TODO(Ana): contador de selecionados. */}
                    {selectedEmails.size} de {EMAIL_BATCH_MAX_SELECTED}{" "}
                    selecionados
                  </p>
                  {selectedEmails.size >= EMAIL_BATCH_MAX_SELECTED ? (
                    <p className="text-xs font-bold text-amber-700">
                      {/* TODO(Ana): aviso de limite atingido. */}
                      Limite de {EMAIL_BATCH_MAX_SELECTED} por lote atingido.
                    </p>
                  ) : null}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={pickerSearchInput}
                    onChange={(event) =>
                      setPickerSearchInput(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        setPickerOffset(0);
                        setPickerSearch(pickerSearchInput.trim());
                      }
                    }}
                    // TODO(Ana): placeholder da busca.
                    placeholder="Buscar por e-mail"
                    className="w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPickerOffset(0);
                      setPickerSearch(pickerSearchInput.trim());
                    }}
                    className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black uppercase text-slate-700 hover:bg-slate-100"
                  >
                    {/* TODO(Ana) */}
                    Buscar
                  </button>
                </div>
                <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border-2 border-slate-900">
                  {pickerLoading ? (
                    <p className="p-4 text-sm font-semibold text-slate-600">
                      {/* TODO(Ana) */}
                      Carregando waitlist...
                    </p>
                  ) : pickerError ? (
                    <p className="p-4 text-sm font-semibold text-rose-600">
                      {pickerError}
                    </p>
                  ) : pickerItems.length === 0 ? (
                    <p className="p-4 text-sm font-semibold text-slate-600">
                      {/* TODO(Ana) */}
                      Nenhum e-mail encontrado.
                    </p>
                  ) : (
                    <ul>
                      {pickerItems.map((item) => (
                        <li
                          key={item.email}
                          className="border-b border-slate-200 last:border-0"
                        >
                          <label
                            className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold ${
                              item.already_recipient || item.suppressed
                                ? "cursor-not-allowed text-slate-400"
                                : "cursor-pointer text-slate-900"
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={
                                item.already_recipient || item.suppressed
                              }
                              checked={selectedEmails.has(item.email)}
                              onChange={() => toggleSelectedEmail(item.email)}
                              className="h-4 w-4 accent-slate-950"
                            />
                            <span className="min-w-0 flex-1 truncate">
                              {item.email}
                            </span>
                            {item.already_recipient ? (
                              <span className="shrink-0 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">
                                {/* TODO(Ana) */}
                                Já na campanha
                              </span>
                            ) : null}
                            {item.suppressed ? (
                              <span className="shrink-0 rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-black uppercase text-rose-600">
                                {/* TODO(Ana) */}
                                Suprimido
                              </span>
                            ) : null}
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {pickerTotal !== null && pickerTotal > 0 ? (
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-slate-500">
                      {Math.min(pickerOffset + 1, pickerTotal)} a{" "}
                      {Math.min(
                        pickerOffset + EMAIL_BATCH_PICKER_PAGE_SIZE,
                        pickerTotal,
                      )}{" "}
                      de {pickerTotal}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={pickerOffset === 0 || pickerLoading}
                        onClick={() =>
                          setPickerOffset((prev) =>
                            Math.max(prev - EMAIL_BATCH_PICKER_PAGE_SIZE, 0),
                          )
                        }
                        className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {/* TODO(Ana) */}
                        Anterior
                      </button>
                      <button
                        type="button"
                        disabled={
                          pickerLoading ||
                          pickerOffset + EMAIL_BATCH_PICKER_PAGE_SIZE >=
                            pickerTotal
                        }
                        onClick={() =>
                          setPickerOffset(
                            (prev) => prev + EMAIL_BATCH_PICKER_PAGE_SIZE,
                          )
                        }
                        className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {/* TODO(Ana) */}
                        Próxima
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <div className="mt-4">
              {/* TODO(Ana): rótulos de quando enviar. */}
              <p className="text-xs font-black uppercase text-slate-500">
                Quando enviar
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { id: "now" as const, label: "Agora" },
                  { id: "schedule" as const, label: "Agendar" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setWhenMode(option.id)}
                    className={`rounded-full border-2 border-slate-900 px-4 py-1.5 text-xs font-black uppercase transition-colors motion-reduce:transition-none ${
                      whenMode === option.id
                        ? "bg-slate-950 text-white"
                        : "bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {whenMode === "schedule" ? (
                <div className="mt-3">
                  <label
                    htmlFor="email-batch-schedule"
                    className="text-xs font-black uppercase text-slate-500"
                  >
                    {/* TODO(Ana): rótulo do agendamento com fuso. */}
                    Data e hora (horário de Brasília)
                  </label>
                  <input
                    id="email-batch-schedule"
                    type="datetime-local"
                    value={scheduleText}
                    onChange={(event) => setScheduleText(event.target.value)}
                    className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold"
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <label
                htmlFor="email-campaign-confirm"
                className="text-xs font-black uppercase text-slate-500"
              >
                {/* TODO(Ana) */}
                Digite ENVIAR para confirmar
              </label>
              <input
                id="email-campaign-confirm"
                type="text"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setBatchModalOpen(false)}
                className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black"
              >
                {/* TODO(Ana) */}
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmText !== "ENVIAR" || batchBusy}
                onClick={() => void submitBatch()}
                className="rounded-full border-2 border-slate-900 bg-[#FFB800] px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-40"
              >
                {/* TODO(Ana) */}
                {batchBusy
                  ? "Enviando..."
                  : whenMode === "schedule"
                    ? "Agendar lote"
                    : "Disparar agora"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cancelTarget && detail ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
          <div className="card-brutal w-full max-w-md rounded-3xl bg-white p-6">
            {/* TODO(Ana): copy do modal de cancelamento de lote. */}
            <h3 className="font-display text-2xl font-black text-slate-950">
              Cancelar este lote agendado?
            </h3>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              Agendado para {formatBatchDateTime(cancelTarget.scheduled_for)}.
              O lote não será disparado e os destinatários dele não recebem o
              e-mail.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black"
              >
                {/* TODO(Ana) */}
                Voltar
              </button>
              <button
                type="button"
                disabled={cancelBusy}
                onClick={() => void confirmCancelBatch()}
                className="rounded-full border-2 border-slate-900 bg-rose-100 px-4 py-2 text-sm font-black text-rose-800 disabled:opacity-40"
              >
                {/* TODO(Ana) */}
                {cancelBusy ? "Cancelando..." : "Cancelar lote"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
          <div className="card-brutal w-full max-w-md rounded-3xl bg-white p-6">
            {/* TODO(Ana): copy do modal de exclusão de campanha. */}
            <h3 className="font-display text-2xl font-black text-slate-950">
              Excluir a campanha?
            </h3>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              O rascunho &quot;{deleteTarget.subject}&quot; será excluído de
              forma definitiva, junto com os lotes agendados dele. Nada foi
              enviado por esta campanha.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black"
              >
                {/* TODO(Ana) */}
                Voltar
              </button>
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => void confirmDeleteCampaign()}
                className="rounded-full border-2 border-slate-900 bg-rose-100 px-4 py-2 text-sm font-black text-rose-800 disabled:opacity-40"
              >
                {/* TODO(Ana) */}
                {deleteBusy ? "Excluindo..." : "Excluir campanha"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminSection>
  );
}

function ContentAdminSection() {
  const [activeType, setActiveType] = useState<ContentType>("areas");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean | number>>(
    emptyContentForm("areas"),
  );
  const activeConfig = contentTabs.find((tab) => tab.type === activeType)!;

  async function loadItems(type = activeType) {
    const config = contentTabs.find((tab) => tab.type === type)!;
    if (!config.supported) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const json = await adminFetch(`/content/${type}`);
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      setItems([]);
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar conteúdo.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setEditing(null);
    setForm(emptyContentForm(activeType));
    void loadItems(activeType);
  }, [activeType]);

  function startEdit(item: ContentItem) {
    setEditing(item);
    setForm({ ...emptyContentForm(activeType), ...item });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!activeConfig.supported) return;

    const payload = contentPayload(activeType, form);
    setSaving(true);
    try {
      await adminFetch(
        editing
          ? `/content/${activeType}/${editing.id}`
          : `/content/${activeType}`,
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      toast.success(
        editing
          ? "Conteúdo atualizado com sucesso."
          : "Conteúdo criado com sucesso.",
      );
      setEditing(null);
      setForm(emptyContentForm(activeType));
      await loadItems();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao salvar. Tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(item: ContentItem) {
    setBusyId(item.id);
    try {
      await adminFetch(`/content/${activeType}/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_published: !item.is_published }),
      });
      toast.success(
        item.is_published
          ? "Conteúdo despublicado com sucesso."
          : "Conteúdo publicado com sucesso.",
      );
      await loadItems();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao publicar. Tente novamente.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setBusyId(deleteTarget.id);
    try {
      await adminFetch(`/content/${activeType}/${deleteTarget.id}`, {
        method: "DELETE",
      });
      toast.success("Item despublicado com sucesso.");
      setDeleteTarget(null);
      await loadItems();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao excluir. Tente novamente.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminSection
      id="conteudo"
      eyebrow="gestão de conteúdo"
      icon={<FileText className="h-4 w-4" />}
      title="Conteúdo publicado na plataforma"
      subtitle="CRUD administrativo para os tipos já expostos pelo backend. Tipos ainda não liberados aparecem como integração pendente."
    >
      <div className="grid gap-6 xl:grid-cols-[220px_1fr]">
        <aside className="card-brutal rounded-3xl bg-white p-3">
          {contentTabs.map((tab) => (
            <button
              key={tab.type}
              type="button"
              onClick={() => setActiveType(tab.type)}
              className={`mb-2 flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left text-sm font-black ${
                activeType === tab.type
                  ? "border-slate-900 bg-yellow-300"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {tab.label}
              {!tab.supported ? (
                <AlertTriangle className="h-4 w-4 text-amber-700" />
              ) : null}
            </button>
          ))}
        </aside>

        <div className="grid gap-6">
          {!activeConfig.supported ? (
            <article className="card-brutal rounded-3xl bg-white p-6">
              <h3 className="font-display text-2xl font-black text-slate-950">
                {activeConfig.label}
              </h3>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {activeConfig.description}
              </p>
              <div className="mt-5">
                <PendingIntegration
                  tool={`Admin CRUD de ${activeConfig.label}`}
                  description={activeConfig.description}
                />
              </div>
            </article>
          ) : (
            <>
              <article className="card-brutal rounded-3xl bg-white p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-2xl font-black text-slate-950">
                      {editing
                        ? `Editar ${activeConfig.label}`
                        : `Adicionar ${activeConfig.label}`}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {activeConfig.description}
                    </p>
                  </div>
                  {editing ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(null);
                        setForm(emptyContentForm(activeType));
                      }}
                      className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black shadow-[2px_2px_0_#0f172a]"
                    >
                      Cancelar edição
                    </button>
                  ) : null}
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="mt-5 grid gap-4 md:grid-cols-2"
                >
                  {activeType === "news" ? (
                    <>
                      <AdminInput
                        label="Título"
                        value={String(form.title || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, title: value }))
                        }
                        required
                      />
                      <AdminInput
                        label="URL da notícia"
                        value={String(form.url || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, url: value }))
                        }
                        required
                      />
                      <AdminInput
                        label="URL da imagem"
                        value={String(form.image_url || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            image_url: value,
                          }))
                        }
                      />
                      <AdminInput
                        label="Fonte"
                        value={String(form.source || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, source: value }))
                        }
                      />
                      <AdminInput
                        label="Data de publicação"
                        type="date"
                        value={String(form.published_at || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            published_at: value,
                          }))
                        }
                      />
                      <AdminTextarea
                        label="Resumo"
                        value={String(form.summary || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, summary: value }))
                        }
                      />
                    </>
                  ) : activeType === "external_jobs" ? (
                    <>
                      <AdminInput
                        label="Título"
                        value={String(form.title || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, title: value }))
                        }
                        required
                      />
                      <AdminInput
                        label="URL da vaga"
                        value={String(form.url || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, url: value }))
                        }
                        required
                      />
                      <AdminInput
                        label="Empresa"
                        value={String(form.company || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, company: value }))
                        }
                      />
                      <AdminInput
                        label="Localização"
                        value={String(form.location || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            location: value,
                          }))
                        }
                      />
                      <AdminSelect
                        label="Senioridade"
                        value={String(form.seniority || "junior")}
                        options={["estagio", "junior", "pleno", "senior"]}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            seniority: value,
                          }))
                        }
                      />
                      <AdminInput
                        label="Área"
                        value={String(form.area_slug || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            area_slug: value,
                          }))
                        }
                      />
                      <AdminInput
                        label="Data de publicação"
                        type="date"
                        value={String(form.published_at || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            published_at: value,
                          }))
                        }
                      />
                      <AdminTextarea
                        label="Descrição"
                        value={String(form.description || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            description: value,
                          }))
                        }
                      />
                    </>
                  ) : activeType === "events" ? (
                    <>
                      <AdminInput
                        label="Título"
                        value={String(form.title || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, title: value }))
                        }
                        required
                      />
                      <AdminInput
                        label="URL"
                        value={String(form.url || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, url: value }))
                        }
                      />
                      <AdminInput
                        label="Local"
                        value={String(form.location_label || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            location_label: value,
                          }))
                        }
                      />
                      <AdminInput
                        label="Cidade"
                        value={String(form.city || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, city: value }))
                        }
                      />
                      <AdminInput
                        label="Data de início"
                        type="datetime-local"
                        value={String(form.starts_at || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            starts_at: value,
                          }))
                        }
                      />
                      <AdminInput
                        label="Data de fim"
                        type="datetime-local"
                        value={String(form.ends_at || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, ends_at: value }))
                        }
                      />
                      <AdminTextarea
                        label="Descrição"
                        value={String(form.description || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            description: value,
                          }))
                        }
                      />
                    </>
                  ) : activeType === "areas" ? (
                    <>
                      <AdminInput
                        label="Nome"
                        value={String(form.name || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, name: value }))
                        }
                        required
                      />
                      <AdminInput
                        label="Resumo"
                        value={String(form.short_description || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            short_description: value,
                          }))
                        }
                      />
                      <AdminTextarea
                        label="Descrição completa"
                        value={String(form.full_description || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            full_description: value,
                          }))
                        }
                      />
                    </>
                  ) : activeType === "courses" ? (
                    <>
                      <AdminInput
                        label="Título"
                        value={String(form.title || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, title: value }))
                        }
                        required
                      />
                      <AdminInput
                        label="Provedor"
                        value={String(form.provider || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            provider: value,
                          }))
                        }
                      />
                      <AdminInput
                        label="URL"
                        value={String(form.url || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, url: value }))
                        }
                      />
                      <AdminInput
                        label="Área"
                        value={String(form.area_slug || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            area_slug: value,
                          }))
                        }
                      />
                      <AdminSelect
                        label="Nível"
                        value={String(form.level || "iniciante")}
                        options={["iniciante", "intermediário", "avançado"]}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, level: value }))
                        }
                      />
                      <AdminInput
                        label="Carga horária"
                        type="number"
                        value={String(form.workload_hours || 0)}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            workload_hours: Number(value),
                          }))
                        }
                      />
                      <AdminTextarea
                        label="Descrição"
                        value={String(form.description || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            description: value,
                          }))
                        }
                      />
                    </>
                  ) : (
                    <>
                      <AdminInput
                        label="Título"
                        value={String(form.title || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, title: value }))
                        }
                        required
                      />
                      <AdminInput
                        label="Área"
                        value={String(form.area_slug || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            area_slug: value,
                          }))
                        }
                      />
                      <AdminSelect
                        label="Nível"
                        value={String(form.level || "iniciante")}
                        options={["iniciante", "intermediário", "avançado"]}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, level: value }))
                        }
                      />
                      <AdminInput
                        label="Duração em semanas"
                        type="number"
                        value={String(form.estimated_duration_weeks || 0)}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            estimated_duration_weeks: Number(value),
                          }))
                        }
                      />
                      <AdminTextarea
                        label="Descrição"
                        value={String(form.description || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            description: value,
                          }))
                        }
                      />
                    </>
                  )}

                  <div className="flex flex-wrap items-center gap-4 md:col-span-2">
                    {activeType === "external_jobs" ? (
                      <AdminCheckbox
                        label="Remoto"
                        checked={Boolean(form.remote)}
                        onChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            remote: checked,
                          }))
                        }
                      />
                    ) : null}
                    {activeType === "events" ? (
                      <AdminCheckbox
                        label="Online"
                        checked={Boolean(form.online)}
                        onChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            online: checked,
                          }))
                        }
                      />
                    ) : null}
                    {activeType === "courses" ? (
                      <AdminCheckbox
                        label="Gratuito"
                        checked={Boolean(form.is_free)}
                        onChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            is_free: checked,
                          }))
                        }
                      />
                    ) : null}
                    {activeType !== "courses" &&
                    activeType !== "news" &&
                    activeType !== "external_jobs" &&
                    activeType !== "events" ? (
                      <AdminCheckbox
                        label="Pro"
                        checked={Boolean(form.is_pro)}
                        onChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            is_pro: checked,
                          }))
                        }
                      />
                    ) : null}
                    <AdminCheckbox
                      label="Publicado"
                      checked={Boolean(form.is_published)}
                      onChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          is_published: checked,
                        }))
                      }
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-brutal-accent rounded-full px-5 py-3 text-sm font-black disabled:opacity-60"
                    >
                      {saving
                        ? "Salvando..."
                        : editing
                          ? "Salvar alterações"
                          : "Adicionar"}
                    </button>
                  </div>
                </form>
              </article>

              <article className="card-brutal overflow-hidden rounded-3xl bg-white">
                <div className="grid grid-cols-[1fr_0.7fr_0.5fr_0.9fr] gap-3 border-b-2 border-slate-900 bg-slate-950 p-4 text-xs font-black uppercase text-white">
                  <span>Nome/título</span>
                  <span>Detalhe</span>
                  <span>Status</span>
                  <span>Ações</span>
                </div>
                {loading ? (
                  <div className="p-5">
                    <LoadingBlock />
                  </div>
                ) : items.length ? (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-3 border-b border-slate-100 p-4 text-sm font-bold md:grid-cols-[1fr_0.7fr_0.5fr_0.9fr] md:items-center"
                    >
                      <div>
                        <p className="font-display text-lg font-black text-slate-950">
                          {contentTitle(item)}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {item.slug || item.created_at
                            ? `Criado em ${formatAdminDate(item.created_at)}`
                            : "Sem slug"}
                        </p>
                      </div>
                      <p className="text-slate-600">
                        {item.provider ||
                          item.tag ||
                          item.area_slug ||
                          item.level ||
                          "Não informado"}
                      </p>
                      <PublishBadge published={item.is_published} />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="rounded-full border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => togglePublish(item)}
                          className="rounded-full border-2 border-slate-900 bg-yellow-300 px-3 py-2 text-xs font-black disabled:opacity-60"
                        >
                          {busyId === item.id
                            ? "..."
                            : item.is_published
                              ? "Despublicar"
                              : "Publicar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="rounded-full border-2 border-slate-900 bg-rose-50 px-3 py-2 text-xs font-black text-rose-800"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6">
                    <p className="font-display text-xl font-black text-slate-950">
                      Nenhum item encontrado
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      Crie o primeiro item usando o formulário acima.
                    </p>
                  </div>
                )}
              </article>
            </>
          )}
        </div>
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
          <div className="card-brutal max-w-md rounded-3xl bg-white p-6">
            <h3 className="font-display text-2xl font-black text-slate-950">
              Tem certeza que deseja excluir este item?
            </h3>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              Esta ação vai despublicar o conteúdo. Para exclusão permanente,
              use ?force=true.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-full border-2 border-slate-900 bg-rose-100 px-4 py-2 text-sm font-black text-rose-800"
              >
                Confirmar exclusão
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminSection>
  );
}

function AdminInput({
  label,
  onChange,
  required,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="text-sm font-black text-slate-950">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border-2 border-slate-900 bg-violet-50 px-4 py-3 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-200"
      />
    </label>
  );
}

function AdminTextarea({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="text-sm font-black text-slate-950 md:col-span-2">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-28 w-full rounded-2xl border-2 border-slate-900 bg-violet-50 px-4 py-3 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-200"
      />
    </label>
  );
}

function AdminSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="text-sm font-black text-slate-950">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border-2 border-slate-900 bg-violet-50 px-4 py-3 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-200"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function AdminCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-violet-700"
      />
      {label}
    </label>
  );
}

export default function Admin() {
  const { loading: authLoading, signOut, user } = useAuth();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [accessState, setAccessState] = useState<
    "loading" | "login" | "forbidden" | "allowed"
  >("loading");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [aiStats, setAiStats] = useState<AiStatsData>({});
  const [aiStatsError, setAiStatsError] = useState<string | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats>({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
  });
  const [posthogState, setPosthogState] = useState<PosthogState | null>(null);
  const [churnRiskUsers, setChurnRiskUsers] = useState<ChurnRiskUser[] | null>(
    null,
  );
  const [selectedUserSub, setSelectedUserSub] = useState<{
    status: string | null;
  } | null>(null);
  const [billingMetrics, setBillingMetrics] = useState<BillingMetricsData | null>(
    null,
  );
  const [billingMetricsError, setBillingMetricsError] = useState<string | null>(
    null,
  );
  const [queueError, setQueueError] = useState<string | null>(null);
  const [churnError, setChurnError] = useState<string | null>(null);
  const [affiliatesError, setAffiliatesError] = useState<string | null>(null);
  const [financeRefreshKey, setFinanceRefreshKey] = useState(0);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [activeSection, setActiveSection] =
    useState<AdminSectionId>("visao-geral");
  const [affiliateName, setAffiliateName] = useState("Nova parceira tech");
  const [affiliateCode, setAffiliateCode] = useState("PARCEIRA20");
  const [affiliateDiscount, setAffiliateDiscount] = useState(20);
  const [affiliateCommission, setAffiliateCommission] = useState(30);
  const [copiedAffiliateLink, setCopiedAffiliateLink] = useState(false);
  const [affiliates, setAffiliates] = useState<AffiliateRecord[]>([]);
  const [affiliatesLoading, setAffiliatesLoading] = useState(false);
  const [savingAffiliate, setSavingAffiliate] = useState(false);
  const [payingAffiliateId, setPayingAffiliateId] = useState<string | null>(
    null,
  );
  const [editingAffiliateId, setEditingAffiliateId] = useState<string | null>(
    null,
  );
  const [affiliateEditForm, setAffiliateEditForm] =
    useState<AffiliateEditForm | null>(null);
  const [savingAffiliateEditId, setSavingAffiliateEditId] = useState<
    string | null
  >(null);
  const [deleteAffiliateTarget, setDeleteAffiliateTarget] =
    useState<AffiliateRecord | null>(null);
  const [deletingAffiliateId, setDeletingAffiliateId] = useState<string | null>(
    null,
  );
  const [copiedAffiliateCardId, setCopiedAffiliateCardId] = useState<
    string | null
  >(null);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");

  useEffect(() => {
    if (authLoading) {
      setAccessState("loading");
      return;
    }

    if (!user) {
      setSession(null);
      setAccessState("login");
      return;
    }

    let cancelled = false;

    // Carrega os dados do dashboard. Separado da decisao do gate: a falha aqui
    // nao deve, no caminho da claim, fechar o gate (so deixa os dados vazios).
    const loadDashboardData = async () => {
      setOverviewLoading(true);
      try {
        const [
          dashboardResult,
          healthResult,
          aiResult,
          queueResult,
          posthogResult,
          churnResult,
          affiliatesResult,
          billingMetricsResult,
        ] = await Promise.all([
          // Core tagueado: falha de /dashboard NAO pode virar 0 nos contadores.
          // Alem disso, tagueando os tres cores o Promise.all nunca rejeita, entao
          // cada resultado (inclusive o do dashboard) e sempre aplicado.
          adminFetch("/dashboard")
            .then((json) => ({
              ok: true as const,
              data: json.data as DashboardData,
            }))
            .catch((err: unknown) => ({
              ok: false as const,
              error:
                err instanceof Error
                  ? err.message
                  : "Erro ao carregar o dashboard.",
            })),
          fetch(apiUrl("/api/health"))
            .then((res) => res.json())
            .then((data) => ({ ok: true as const, data: data as HealthResponse }))
            .catch(() => ({ ok: false as const })),
          adminFetch("/ai-stats")
            .then((json) => ({
              ok: true as const,
              data: (json.data || {}) as AiStatsData,
            }))
            .catch((err: unknown) => ({
              ok: false as const,
              error:
                err instanceof Error
                  ? err.message
                  : "Erro ao carregar uso de IA.",
            })),
          // Sem colapso: falha de fetch vira estado de erro da secao, nao zeros.
          adminFetch("/queue-stats")
            .then((json) => ({ ok: true as const, data: json.data as QueueStats }))
            .catch((err: unknown) => ({
              ok: false as const,
              error:
                err instanceof Error ? err.message : "Erro ao carregar a fila.",
            })),
          // PostHog: union do backend; falha de fetch vira o proprio estado error.
          adminFetch("/posthog-stats")
            .then((json) => json.data as PosthogState)
            .catch(
              (err: unknown): PosthogState => ({
                state: "error",
                reason:
                  err instanceof Error
                    ? err.message
                    : "Erro ao consultar o PostHog.",
              }),
            ),
          adminFetch("/churn-risk")
            .then((json) => ({
              ok: true as const,
              data: Array.isArray(json.data) ? (json.data as ChurnRiskUser[]) : [],
            }))
            .catch((err: unknown) => ({
              ok: false as const,
              error:
                err instanceof Error
                  ? err.message
                  : "Erro ao carregar risco de churn.",
            })),
          adminFetch("/affiliates-stats")
            .then((json) => ({
              ok: true as const,
              data: Array.isArray(json.data)
                ? (json.data as AffiliateRecord[])
                : [],
            }))
            .catch((err: unknown) => ({
              ok: false as const,
              error:
                err instanceof Error
                  ? err.message
                  : "Erro ao carregar afiliados.",
            })),
          // Falha de metricas de cobranca vira ESTADO de erro na secao, nao dado
          // vazio: capturamos o erro num resultado tagueado, sem colapsar em 0.
          adminFetch("/billing-metrics")
            .then((json) => ({
              ok: true as const,
              data: json.data as BillingMetricsData,
            }))
            .catch((err: unknown) => ({
              ok: false as const,
              error:
                err instanceof Error
                  ? err.message
                  : "Erro ao carregar métricas de cobrança.",
            })),
        ]);
        if (cancelled) return;
        if (dashboardResult.ok) {
          setDashboard(dashboardResult.data);
          setDashboardError(null);
          setAuditLogs(
            Array.isArray(dashboardResult.data?.recent_audit)
              ? dashboardResult.data.recent_audit
              : [],
          );
        } else {
          setDashboard(null);
          setDashboardError(dashboardResult.error);
          setAuditLogs([]);
        }
        setHealth(healthResult.ok ? healthResult.data : null);
        if (aiResult.ok) {
          setAiStats(aiResult.data);
          setAiStatsError(null);
        } else {
          setAiStats({});
          setAiStatsError(aiResult.error);
        }
        if (queueResult.ok) {
          setQueueStats(queueResult.data);
          setQueueError(null);
        } else {
          setQueueError(queueResult.error);
        }
        setPosthogState(posthogResult);
        if (churnResult.ok) {
          setChurnRiskUsers(churnResult.data);
          setChurnError(null);
        } else {
          setChurnRiskUsers(null);
          setChurnError(churnResult.error);
        }
        if (affiliatesResult.ok) {
          setAffiliates(affiliatesResult.data);
          setAffiliatesError(null);
        } else {
          setAffiliates([]);
          setAffiliatesError(affiliatesResult.error);
        }
        if (billingMetricsResult.ok) {
          setBillingMetrics(billingMetricsResult.data);
          setBillingMetricsError(null);
        } else {
          setBillingMetrics(null);
          setBillingMetricsError(billingMetricsResult.error);
        }
      } finally {
        if (!cancelled) setOverviewLoading(false);
      }
    };

    const resolve = async () => {
      // Caminho rapido: le a claim admin_role do token (sem rede) e abre o gate
      // sem flash. O backend continua validando admin via RPC a cada request;
      // isto e so apresentacao.
      const {
        data: { session: authSession },
      } = supabase
        ? await supabase.auth.getSession()
        : { data: { session: null } };
      const claimRole = authSession?.access_token
        ? readAdminClaim(authSession.access_token)
        : null;

      if (cancelled) return;

      if (claimRole) {
        setSession({
          username: user.email || user.id,
          displayName: user.email || "Admin",
          signedAt: new Date().toISOString(),
          role: claimRole,
        });
        setAccessState("allowed");
        // Dados carregam em background; falha aqui nao fecha o gate.
        void loadDashboardData().catch(() => {});
        return;
      }

      // Fallback: token sem a claim (sessao antiga) -> comportamento atual,
      // o gate decide pelo adminFetch("/me").
      setAccessState("loading");
      adminFetch("/me")
        .then((json) => {
          if (cancelled) return;
          setSession({
            username: user.email || user.id,
            displayName: json.data?.user?.email || user.email || "Admin",
            signedAt: new Date().toISOString(),
            role: json.data?.role,
          });
          setAccessState("allowed");
          return loadDashboardData();
        })
        .catch(() => {
          if (cancelled) return;
          setSession(null);
          setDashboard(null);
          setDashboardError(null);
          setHealth(null);
          setAuditLogs([]);
          setAiStats({});
          setAiStatsError(null);
          setQueueStats({ waiting: 0, active: 0, completed: 0, failed: 0 });
          setPosthogState(null);
          setChurnRiskUsers(null);
          setChurnError(null);
          setAffiliates([]);
          setAffiliatesError(null);
          setQueueError(null);
          setBillingMetrics(null);
          setBillingMetricsError(null);
          setAccessState("forbidden");
        });
    };

    void resolve();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (accessState !== "allowed") {
      setUserProfiles([]);
      setSelectedUserEmail("");
      return;
    }

    let cancelled = false;

    adminFetch("/users")
      .then((json) => {
        if (cancelled) return;

        const profiles: UserProfile[] = Array.isArray(json.data)
          ? json.data.map((record: AdminUserRecord) => toUserProfile(record))
          : [];
        setUserProfiles(profiles);
        setSelectedUserEmail((current) => {
          if (profiles.some((profile) => profile.email === current))
            return current;
          return profiles[0]?.email ?? "";
        });
      })
      .catch(() => {
        if (!cancelled) {
          setUserProfiles([]);
          setSelectedUserEmail("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessState]);

  const lastUpdated = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date()),
    [],
  );

  const generatedAffiliateLink = useMemo(
    () => buildAffiliateLink(affiliateCode, affiliateDiscount),
    [affiliateCode, affiliateDiscount],
  );

  const selectedUser =
    userProfiles.find((user) => user.email === selectedUserEmail) ??
    userProfiles[0] ??
    null;
  // Lookup da assinatura do usuario selecionado via /subscribers (filtro por
  // email), no lugar do endpoint deprecated /subscriptions.
  useEffect(() => {
    const email = selectedUser?.email;
    const userId = selectedUser?.userId;
    if (!email) {
      setSelectedUserSub(null);
      return;
    }
    let cancelled = false;
    adminFetch(`/subscribers?pageSize=25&search=${encodeURIComponent(email)}`)
      .then((json) => {
        if (cancelled) return;
        const rows: Array<{
          userId: string | null;
          email: string | null;
          status: string | null;
        }> = Array.isArray(json.data?.rows) ? json.data.rows : [];
        const match =
          rows.find((row) =>
            userId ? row.userId === userId : row.email === email,
          ) ??
          rows[0] ??
          null;
        setSelectedUserSub(match ? { status: match.status } : null);
      })
      .catch(() => {
        if (!cancelled) setSelectedUserSub(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedUser?.email, selectedUser?.userId]);
  const aiUsageReal = useMemo<AiUsage[]>(() => {
    return Object.entries(aiStats).map(([tool, stats]) => {
      const successRate =
        stats.calls > 0 ? Math.round((stats.success / stats.calls) * 100) : 0;
      return {
        feature: tool,
        requests: String(stats.calls),
        credits: `${successRate}% sucesso`,
        cost: formatCurrency(stats.cost),
        costValue: stats.cost,
        status: stats.cost > 50 ? "high" : successRate < 80 ? "watch" : "ok",
      };
    });
  }, [aiStats]);
  // Maior custo entre as ferramentas: base 100% da barra. 0 quando nao ha custo.
  const maxAiCost = aiUsageReal.reduce(
    (max, item) => Math.max(max, item.costValue),
    0,
  );
  const healthItemsReal = useMemo(() => buildHealthItems(health), [health]);
  // Deriva os stats so quando o estado e "ok"; caso contrario null. Mantem o
  // nome posthogStats para as leituras de render continuarem validas.
  const posthogStats =
    posthogState?.state === "ok" ? posthogState.stats : null;
  // hasData vem do backend (nunca inferido de zeros no client).
  const posthogHasData = Boolean(
    posthogState?.state === "ok" && posthogState.hasData,
  );
  const posthogSignupConversion =
    posthogStats && posthogStats.uniqueUsers > 0
      ? Math.round(
          (posthogStats.events.user_signed_up / posthogStats.uniqueUsers) * 100,
        )
      : 0;
  const posthogCheckoutConversion =
    posthogStats && posthogStats.uniqueUsers > 0
      ? Math.round(
          (posthogStats.events.checkout_started / posthogStats.uniqueUsers) *
            100,
        )
      : 0;
  const posthogFunnel = posthogStats
    ? [
        { label: "Visitantes únicos", value: posthogStats.uniqueUsers },
        { label: "Cadastros", value: posthogStats.events.user_signed_up },
        {
          label: "Checkouts iniciados",
          value: posthogStats.events.checkout_started,
        },
      ]
    : [];
  const posthogAcquisitionTotal =
    posthogStats?.acquisition.reduce(
      (sum, channel) => sum + channel.users,
      0,
    ) || 0;
  const affiliateTotals = useMemo(
    () =>
      affiliates.reduce(
        (totals, affiliate) => ({
          revenue: totals.revenue + Number(affiliate.revenue_cents || 0),
          commissionDue:
            totals.commissionDue + Number(affiliate.commission_due_cents || 0),
          sales: totals.sales + Number(affiliate.sales || 0),
          clicks: totals.clicks + Number(affiliate.clicks || 0),
        }),
        { revenue: 0, commissionDue: 0, sales: 0, clicks: 0 },
      ),
    [affiliates],
  );
  const adminMetricCards = useMemo<MetricCard[]>(() => {
    if (!dashboard?.counts) return metricCards;

    // Custo de IA cai em "indisponivel" (nunca R$ 0,00 falso) quando /ai-stats
    // falha. TODO(Ana): copy do estado indisponivel do card de custo de IA.
    const aiCost = aiStatsError
      ? "indisponível"
      : formatCurrency(
          Object.values(aiStats).reduce((sum, item) => sum + item.cost, 0),
        );
    const aiCostDetail = aiStatsError
      ? "Falha ao carregar uso de IA"
      : "Custo estimado dos últimos 30 dias";
    // MRR real quando disponivel. Ausencia e estado nomeado, nunca um 0 falso.
    // TODO(Ana): copy do estado indisponivel do card de receita.
    const mrrValue = billingMetrics
      ? formatCents(billingMetrics.mrr.mrrCents)
      : "indisponível";
    const mrrDetail = billingMetrics
      ? "MRR das assinaturas ativas"
      : billingMetricsError
        ? "Falha ao carregar métricas"
        : "Carregando métricas";

    // So os VALORES sao preenchidos; o label vem da base e nunca e sobrescrito.
    return [
      { ...metricCards[0], value: String(dashboard.counts.users) },
      { ...metricCards[1], value: String(dashboard.counts.active_subscriptions) },
      { ...metricCards[2], value: mrrValue, detail: mrrDetail },
      { ...metricCards[3], value: String(dashboard.counts.ai_calls_total) },
      { ...metricCards[4], value: String(dashboard.counts.courses) },
      { ...metricCards[5], value: aiCost, detail: aiCostDetail },
    ];
  }, [dashboard, aiStats, aiStatsError, billingMetrics, billingMetricsError]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
      setSession(null);
    } finally {
      setLoggingOut(false);
      setLogoutModalOpen(false);
    }
  }

  function handleGenerateAffiliateCode() {
    const baseCode = slugifyAffiliateCode(affiliateName) || "PARCEIRO";
    setAffiliateCode(`${baseCode}${affiliateDiscount}`);
    setCopiedAffiliateLink(false);
  }

  async function handleCopyAffiliateLink() {
    await navigator.clipboard.writeText(generatedAffiliateLink);
    setCopiedAffiliateLink(true);
  }

  async function refreshAffiliates() {
    setAffiliatesLoading(true);
    try {
      const json = await adminFetch("/affiliates-stats");
      setAffiliates(Array.isArray(json.data) ? json.data : []);
    } catch {
      setAffiliates([]);
    } finally {
      setAffiliatesLoading(false);
    }
  }

  async function handleCreateAffiliate() {
    const code = slugifyAffiliateCode(affiliateCode);
    if (!affiliateName.trim() || !code) {
      toast.error("Informe nome e código do afiliado.");
      return;
    }

    setSavingAffiliate(true);
    try {
      await adminFetch("/content/affiliates", {
        method: "POST",
        body: JSON.stringify({
          name: affiliateName.trim(),
          code,
          discount_percent: affiliateDiscount,
          commission_percent: affiliateCommission,
          status: "active",
        }),
      });
      toast.success("Afiliado criado com sucesso.");
      await refreshAffiliates();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar afiliado.",
      );
    } finally {
      setSavingAffiliate(false);
    }
  }

  async function handleMarkAffiliatePaid(affiliate: AffiliateRecord) {
    if (affiliate.commission_due_cents <= 0) return;

    setPayingAffiliateId(affiliate.id);
    try {
      await adminFetch(`/content/affiliates/${affiliate.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          commission_paid_cents:
            Number(affiliate.commission_paid_cents || 0) +
            Number(affiliate.commission_due_cents || 0),
          commission_due_cents: 0,
        }),
      });
      toast.success("Comissão marcada como paga.");
      await refreshAffiliates();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao marcar comissão como paga.",
      );
    } finally {
      setPayingAffiliateId(null);
    }
  }

  function startAffiliateEdit(affiliate: AffiliateRecord) {
    setEditingAffiliateId(affiliate.id);
    setAffiliateEditForm({
      name: affiliate.name || "",
      email: affiliate.email || "",
      discount_percent: Number(affiliate.discount_percent || 20),
      commission_percent: Number(affiliate.commission_percent || 30),
      status: affiliate.status || "active",
      notes: affiliate.notes || "",
    });
  }

  function cancelAffiliateEdit() {
    setEditingAffiliateId(null);
    setAffiliateEditForm(null);
  }

  async function handleSaveAffiliateEdit(affiliate: AffiliateRecord) {
    if (!affiliateEditForm) return;

    setSavingAffiliateEditId(affiliate.id);
    try {
      await adminFetch(`/content/affiliates/${affiliate.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: affiliateEditForm.name.trim(),
          email: affiliateEditForm.email.trim() || null,
          discount_percent: Number(affiliateEditForm.discount_percent || 0),
          commission_percent: Number(affiliateEditForm.commission_percent || 0),
          status: affiliateEditForm.status,
          notes: affiliateEditForm.notes.trim() || null,
        }),
      });
      toast.success("Afiliado atualizado com sucesso.");
      cancelAffiliateEdit();
      await refreshAffiliates();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar afiliado.",
      );
    } finally {
      setSavingAffiliateEditId(null);
    }
  }

  async function confirmDeleteAffiliate() {
    if (!deleteAffiliateTarget) return;

    setDeletingAffiliateId(deleteAffiliateTarget.id);
    try {
      await adminFetch(`/content/affiliates/${deleteAffiliateTarget.id}`, {
        method: "DELETE",
      });
      toast.success("Afiliado excluído com sucesso.");
      setDeleteAffiliateTarget(null);
      if (editingAffiliateId === deleteAffiliateTarget.id)
        cancelAffiliateEdit();
      await refreshAffiliates();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir afiliado.",
      );
    } finally {
      setDeletingAffiliateId(null);
    }
  }

  async function handleCopyAffiliateCardLink(affiliate: AffiliateRecord) {
    const link = buildAffiliateLink(affiliate.code, affiliate.discount_percent);
    await navigator.clipboard.writeText(link);
    setCopiedAffiliateCardId(affiliate.id);
    window.setTimeout(() => {
      setCopiedAffiliateCardId((current) =>
        current === affiliate.id ? null : current,
      );
    }, 2000);
  }

  if (accessState !== "allowed" || !session) {
    return (
      <AdminAccessGate
        reason={accessState === "allowed" ? "loading" : accessState}
      />
    );
  }

  return (
    <AdminShell
      activeSection={activeSection}
      session={session}
      setActiveSection={setActiveSection}
      onLogout={() => setLogoutModalOpen(true)}
    >
      <SEO title="Admin · Bora na Tech?" url="/admin" noindex />
      <SignOutConfirmModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
        isLoading={loggingOut}
      />
      <section className="hero-pattern border-b-2 border-slate-900 py-10">
        <div className="container">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="social-badge mb-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wide">
                <LayoutDashboard className="h-4 w-4" />
                painel admin
              </p>
              <h1 className="font-display text-4xl font-black text-slate-950 lg:text-6xl">
                Centro de comando do BORA NA TECH?
              </h1>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-relaxed text-slate-700">
                Visão executiva e operacional para acompanhar crescimento,
                receita, uso de IA, engajamento, saúde do sistema e gargalos do
                funil.
              </p>
            </div>
            <div className="card-brutal rounded-3xl bg-white p-4">
              <p className="text-xs font-black uppercase text-slate-500">
                central admin
              </p>
              <p className="font-display text-xl font-black text-slate-950">
                Dados separados por seção
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Atualizado em {lastUpdated}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-alt py-10">
        <div className="container space-y-10">
          {activeSection === "visao-geral" ? (
            <>
              <IntegrationsHealthPanel />
              {overviewLoading ? (
                <LoadingBlock />
              ) : dashboardError ? (
                <ErrorBlock message={dashboardError} />
              ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {adminMetricCards.map((metric) => (
                  <article
                    key={metric.label}
                    className="card-brutal rounded-3xl bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className={`flex h-13 w-13 items-center justify-center rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0_#0f172a] ${metric.color}`}
                      >
                        {metric.icon}
                      </span>
                    </div>
                    <p className="mt-5 text-sm font-black uppercase tracking-wide text-slate-500">
                      {metric.label}
                    </p>
                    <p className="font-display mt-1 text-4xl font-black text-slate-950">
                      {metric.value}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {metric.detail}
                    </p>
                  </article>
                ))}
              </div>
              )}

              <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <article className="card-brutal rounded-3xl bg-white p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-violet-700">
                        funil principal
                      </p>
                      <h2 className="font-display text-2xl font-black text-slate-950">
                        Do visitante ao assinante Pro
                      </h2>
                    </div>
                    {posthogHasData ? (
                      <span className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-slate-900 bg-violet-50 px-3 py-2 text-xs font-black text-violet-800">
                        <PieChart className="h-4 w-4" />
                        conversão cadastro {posthogSignupConversion}%
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-6 space-y-4">
                    {overviewLoading ? (
                      <LoadingBlock />
                    ) : posthogHasData && posthogFunnel.length ? (
                      posthogFunnel.map((step, index) => {
                        const maxValue = Math.max(
                          posthogFunnel[0]?.value || 1,
                          1,
                        );
                        return (
                          <div
                            key={step.label}
                            className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-black uppercase text-violet-700">
                                  {step.label}
                                </p>
                                <p className="font-display text-3xl font-black text-slate-950">
                                  {formatCount(step.value)}
                                </p>
                              </div>
                              <span className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black">
                                etapa {index + 1}
                              </span>
                            </div>
                            <div className="mt-3 h-3 rounded-full border-2 border-slate-900 bg-white">
                              <div
                                className="h-full rounded-full bg-violet-700"
                                style={{
                                  width: `${Math.max((step.value / maxValue) * 100, step.value > 0 ? 5 : 0)}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <PosthogStateNotice state={posthogState} />
                    )}
                  </div>
                </article>

                <article className="card-brutal rounded-3xl bg-violet-700 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <span className="rounded-2xl border-2 border-slate-950 bg-yellow-300 p-3 text-slate-950 shadow-[3px_3px_0_#0f172a]">
                      <Sparkles className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-xs font-black uppercase text-violet-100">
                        insight rápido
                      </p>
                      <h2 className="font-display text-2xl font-black">
                        {/* TODO(Ana): copy do estado indisponivel de uso de IA. */}
                        {aiStatsError
                          ? "Uso de IA indisponível."
                          : aiUsageReal.length
                            ? "Uso de IA conectado."
                            : "Sem uso de IA registrado."}
                      </h2>
                    </div>
                  </div>
                  <p className="mt-5 text-sm font-semibold leading-relaxed text-violet-100">
                    {aiUsageReal.length
                      ? "Os custos e chamadas abaixo vêm de ai_usage_logs nos últimos 30 dias."
                      : "Quando houver chamadas registradas, este resumo passa a exibir custos e volume real por ferramenta."}
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border-2 border-white/80 bg-white/10 p-4">
                      <p className="text-2xl font-black">
                        {overviewLoading
                          ? "…"
                          : dashboard?.counts
                            ? formatCount(dashboard.counts.ai_calls_total)
                            : "indisponível"}
                      </p>
                      <p className="text-xs font-bold text-violet-100">
                        chamadas registradas
                      </p>
                    </div>
                    <div className="rounded-2xl border-2 border-white/80 bg-white/10 p-4">
                      <p className="text-2xl font-black">
                        {aiStatsError
                          ? "indisponível"
                          : formatCurrency(
                              Object.values(aiStats).reduce(
                                (sum, item) => sum + item.cost,
                                0,
                              ),
                            )}
                      </p>
                      <p className="text-xs font-bold text-violet-100">
                        custo estimado
                      </p>
                    </div>
                  </div>
                </article>

                <article className="card-brutal rounded-3xl bg-white p-6">
                  <div className="flex items-center gap-3">
                    <span className="rounded-2xl border-2 border-slate-950 bg-yellow-300 p-3 text-slate-950 shadow-[3px_3px_0_#0f172a]">
                      <Mail className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-xs font-black uppercase text-violet-700">
                        sistema
                      </p>
                      <h2 className="font-display text-2xl font-black text-slate-950">
                        Fila de e-mails
                      </h2>
                    </div>
                  </div>
                  {queueError ? (
                    <div className="mt-6">
                      <ErrorBlock message={queueError} />
                    </div>
                  ) : (
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      {[
                        { label: "na fila", value: queueStats.waiting },
                        { label: "processando", value: queueStats.active },
                        { label: "enviados", value: queueStats.completed },
                        { label: "com falha", value: queueStats.failed },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4"
                        >
                          <p className="text-2xl font-black text-slate-950">
                            {item.value}
                          </p>
                          <p className="text-xs font-bold text-slate-500">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <article className="card-brutal overflow-hidden rounded-3xl bg-white">
                  <div className="border-b-2 border-slate-900 bg-pink-100 p-6">
                    <h2 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
                      <Bot className="h-6 w-6" />
                      Consumo de créditos de IA
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      Custos por recurso, volume de uso e alertas de orçamento.
                    </p>
                  </div>
                  <div className="divide-y-2 divide-slate-100">
                    {overviewLoading ? (
                      <div className="p-5">
                        <LoadingBlock />
                      </div>
                    ) : aiStatsError ? (
                      <div className="p-5">
                        <ErrorBlock message={aiStatsError} />
                      </div>
                    ) : aiUsageReal.length ? (
                      aiUsageReal.map((item) => (
                        <div
                          key={item.feature}
                          className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center"
                        >
                          <div>
                            <p className="font-display text-lg font-black text-slate-950">
                              {item.feature}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                              {item.requests} chamadas • {item.credits} créditos
                            </p>
                          </div>
                          <div className="flex items-center gap-3 sm:justify-end">
                            <p className="font-display text-xl font-black text-slate-950">
                              {item.cost}
                            </p>
                            <StatusPill status={item.status} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-5">
                        <p className="font-display text-xl font-black text-slate-950">
                          Nenhuma chamada de IA registrada
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          Os dados aparecem quando ai_usage_logs receber
                          eventos.
                        </p>
                      </div>
                    )}
                  </div>
                </article>

                <article className="card-brutal rounded-3xl bg-white p-6">
                  <h2 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
                    <WalletCards className="h-6 w-6" />
                    Assinaturas e planos
                  </h2>
                  <div className="mt-6 space-y-5">
                    <div className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-4">
                      <p className="text-xs font-black uppercase text-violet-700">
                        Assinaturas ativas
                      </p>
                      <p className="font-display text-3xl font-black text-slate-950">
                        {overviewLoading
                          ? "…"
                          : dashboard?.counts
                            ? formatCount(dashboard.counts.active_subscriptions)
                            : "indisponível"}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Fonte: /api/admin/dashboard
                      </p>
                    </div>
                    <BillingMetricsPanel
                      loading={overviewLoading}
                      error={billingMetricsError}
                      metrics={billingMetrics}
                    />
                  </div>
                  <div className="mt-6">
                    <SubscribersSummary
                      onSeeAll={() => setActiveSection("financeiro")}
                    />
                  </div>
                </article>
              </div>
            </>
          ) : null}

          {activeSection === "conversao" ? (
            <AdminSection
              id="conversao"
              eyebrow="jornada de conversão"
              icon={<MousePointerClick className="h-4 w-4" />}
              title="De onde vem a assinatura Pro"
              subtitle="Entenda a última página, o tempo, a quantidade de sessões e a funcionalidade Pro que mais empurra o usuário para assinar."
            >
              <ConversionDashboard />
            </AdminSection>
          ) : null}

          {activeSection === "paginas" ? (
            <AdminSection
              id="paginas"
              eyebrow="comportamento por página"
              icon={<Eye className="h-4 w-4" />}
              title="Qualidade real das páginas"
              // TODO(Ana): revisar copy do subtitulo da aba Paginas.
              subtitle="Veja tempo médio, profundidade de scroll e taxa de saída por página para descobrir onde o conteúdo prende ou perde pessoas."
            >
              <PagesDashboard />
            </AdminSection>
          ) : null}

          {activeSection === "conteudo" ? <ContentAdminSection /> : null}

          {activeSection === "vagas" ? <VagasDestaqueAdmin /> : null}

          {activeSection === "usuarios" ? (
            <AdminSection
              id="usuarios"
              eyebrow="perfil individual"
              icon={<UserRound className="h-4 w-4" />}
              title="Usuários, sessões e valor pago"
              subtitle="Clique em um usuário para ver cadastro, conversão Pro, área de interesse, funcionalidades usadas, origem, status e histórico de navegação."
            >
              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <article className="card-brutal overflow-hidden rounded-3xl bg-white">
                  {userProfiles.length ? (
                    userProfiles.map((user) => (
                      <button
                        key={user.email}
                        type="button"
                        onClick={() => setSelectedUserEmail(user.email)}
                        className={`grid w-full gap-2 border-b-2 border-slate-100 p-4 text-left transition hover:bg-yellow-50 ${
                          selectedUser?.email === user.email
                            ? "bg-violet-100"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-display text-lg font-black text-slate-950">
                            {user.name}
                          </p>
                          <span className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black">
                            {user.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-500">
                          {user.email}
                        </p>
                        <p className="text-xs font-black uppercase text-violet-700">
                          {user.source} • {user.paidTotal}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="p-6">
                      <p className="font-display text-xl font-black text-slate-950">
                        Nenhum usuário encontrado
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        A lista será preenchida com os perfis retornados por
                        /api/admin/users.
                      </p>
                    </div>
                  )}
                </article>
                {selectedUser ? (
                  <article className="card-brutal rounded-3xl bg-white p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-display text-2xl font-black text-slate-950">
                          {selectedUser.name}
                        </h3>
                        <p className="text-sm font-semibold text-slate-500">
                          {selectedUser.email}
                        </p>
                      </div>
                      <span className="rounded-full border-2 border-slate-900 bg-yellow-300 px-3 py-1 text-xs font-black">
                        {selectedUser.paidTotal} pagos
                      </span>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {[
                        ["Cadastro", selectedUser.signedUpAt],
                        [
                          "Assinatura",
                          selectedUserSub?.status || "Sem assinatura ativa",
                        ],
                        ["Área", selectedUser.interest],
                        ["Origem", selectedUser.source],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-4"
                        >
                          <p className="text-xs font-black uppercase text-violet-700">
                            {label}
                          </p>
                          <p className="font-display text-lg font-black text-slate-950">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 grid gap-5 lg:grid-cols-2">
                      <div>
                        <p className="mb-2 font-display text-lg font-black text-slate-950">
                          Funcionalidades usadas
                        </p>
                        <div className="space-y-2">
                          <PendingIntegration
                            tool="Posthog"
                            description="Integração com analytics pendente (Posthog)"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 font-display text-lg font-black text-slate-950">
                          Sessões recentes
                        </p>
                        <div className="space-y-2">
                          <PendingIntegration
                            tool="Posthog"
                            description="Integração com analytics pendente (Posthog)"
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                ) : (
                  <article className="card-brutal rounded-3xl bg-white p-6">
                    <p className="font-display text-2xl font-black text-slate-950">
                      Selecione um usuário
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      Os detalhes aparecem aqui quando houver perfis retornados
                      pelo backend.
                    </p>
                  </article>
                )}
              </div>
            </AdminSection>
          ) : null}

          {activeSection === "retencao" ? (
            <AdminSection
              id="retencao"
              eyebrow="retenção e churn"
              icon={<RefreshCcw className="h-4 w-4" />}
              title="Quem fica, quem cancela e quem está em risco"
              subtitle="Monitore cohorts, motivos de cancelamento, assinantes sem login e distribuição de dias desde o último acesso."
            >
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <article className="card-brutal overflow-hidden rounded-3xl bg-white">
                  <div className="p-6">
                    <PendingIntegration
                      tool="Posthog"
                      description="Requer dados de sessão históricos"
                    />
                  </div>
                </article>
                <div className="grid gap-6">
                  <article className="card-brutal rounded-3xl bg-white p-6">
                    <h3 className="font-display text-2xl font-black text-slate-950">
                      Motivos de cancelamento
                    </h3>
                    <div className="mt-4">
                      {/* TODO(Ana): copy do placeholder de motivos de cancelamento. */}
                      <PendingIntegration
                        tool="Motivos de cancelamento"
                        description="Requer agregação dos motivos coletados no cancelamento."
                      />
                    </div>
                  </article>
                  <article className="card-brutal rounded-3xl bg-rose-50 p-6">
                    <h3 className="font-display text-2xl font-black text-slate-950">
                      Usuários em risco
                    </h3>
                    <div className="mt-4">
                      {overviewLoading ? (
                        <LoadingBlock />
                      ) : churnRiskUsers === null ? (
                        // churnRiskUsers null so acontece em erro de fetch agora
                        // (sucesso sempre retorna lista). Mostra erro, nao vazio.
                        // TODO(Ana): copy de fallback do erro de churn.
                        <ErrorBlock
                          message={churnError ?? "Erro ao carregar risco de churn."}
                        />
                      ) : churnRiskUsers.length ? (
                        <div className="space-y-3">
                          {churnRiskUsers.map((riskUser) => (
                            <div
                              key={`${riskUser.email}-${riskUser.days_inactive}`}
                              className="rounded-2xl border-2 border-slate-900 bg-white p-4"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-display text-lg font-black text-slate-950">
                                    {riskUser.name}
                                  </p>
                                  <p className="mt-1 text-xs font-semibold text-slate-500">
                                    {riskUser.email}
                                  </p>
                                </div>
                                <span className="rounded-full border-2 border-slate-900 bg-rose-100 px-3 py-1 text-xs font-black text-rose-800">
                                  {riskUser.days_inactive} dias
                                </span>
                              </div>
                              <p className="mt-3 text-sm font-black text-slate-700">
                                MRR: {formatCurrency(riskUser.mrr)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border-2 border-slate-900 bg-white p-4">
                          <p className="font-display text-lg font-black text-slate-950">
                            Nenhum assinante Pro em risco no momento
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-500">
                            Todos os assinantes ativos consultados fizeram login
                            nos últimos 14 dias.
                          </p>
                        </div>
                      )}
                    </div>
                  </article>
                </div>
              </div>
            </AdminSection>
          ) : null}

          {activeSection === "seo" ? (
            <AdminSection
              id="seo"
              eyebrow="conteúdo e SEO"
              icon={<Search className="h-4 w-4" />}
              title="Conteúdo que vira cadastro"
              subtitle="Veja páginas que geram conta criada, keyword orgânica principal e status de indexação para priorizar SEO."
            >
              <article className="card-brutal overflow-hidden rounded-3xl bg-white">
                <div className="p-6">
                  <PendingIntegration
                    tool="Google Search Console"
                    description="Requer integração com Search Console API"
                  />
                </div>
              </article>
            </AdminSection>
          ) : null}

          {activeSection === "financeiro" ? (
            <AdminSection
              id="financeiro"
              eyebrow="financeiro"
              icon={<DollarSign className="h-4 w-4" />}
              title="Financeiro"
              subtitle="Resultado de caixa (entrou, saiu, lucro) separado das métricas de recorrência (MRR, ARPU, churn). São coisas diferentes."
            >
              {/* TODO(Ana): titulo e subtitulo da secao financeiro (title/subtitle acima). */}
              {/* RESULTADO DE CAIXA (fonte: Stripe balance transactions) */}
              <FinanceDashboard refreshKey={financeRefreshKey} />

              {/* DESPESAS (CRUD manual, cambio travado no lancamento) */}
              <div className="mt-10">
                {/* TODO(Ana): titulo e subtitulo do bloco de despesas. */}
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Despesas
                </h2>
                <p className="mb-5 mt-1 max-w-3xl text-sm font-semibold text-slate-600">
                  Lance cobranças recorrentes e gastos pontuais. Moeda estrangeira
                  trava o câmbio (PTAX) na data do lançamento.
                </p>
                <ExpensesManager
                  onChanged={() => setFinanceRefreshKey((k) => k + 1)}
                />
              </div>

              {/* METRICAS DE RECORRENCIA, claramente separadas do caixa acima */}
              <div className="mt-12 border-t-4 border-slate-900 pt-8">
                {/* TODO(Ana): titulo e subtitulo do bloco de recorrencia. */}
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Recorrência e assinantes
                </h2>
                <p className="mt-1 max-w-3xl text-sm font-semibold text-slate-600">
                  Métricas de assinatura (MRR, ARPU, churn) e comissões de
                  afiliados. Diferente do resultado de caixa acima: aqui é o
                  recorrente projetado, não o dinheiro que efetivamente entrou.
                </p>

                <div className="mt-5 grid gap-6 xl:grid-cols-3">
                  <article className="card-brutal rounded-3xl bg-white p-6 xl:col-span-2">
                    {/* TODO(Ana): titulo do bloco de metricas de cobranca. */}
                    <h3 className="font-display text-2xl font-black">
                      MRR, ARPU e churn
                    </h3>
                    <div className="mt-4">
                      <BillingMetricsPanel
                        loading={overviewLoading}
                        error={billingMetricsError}
                        metrics={billingMetrics}
                      />
                    </div>
                  </article>
                  <article className="card-brutal rounded-3xl bg-white p-6">
                    <h3 className="font-display text-2xl font-black">
                      Afiliados externos
                    </h3>
                    <div className="mt-4 rounded-2xl border-2 border-slate-900 bg-violet-50 p-4">
                      <p className="text-xs font-black uppercase text-violet-700">
                        Comissões a pagar
                      </p>
                      <p className="font-display mt-1 text-2xl font-black text-slate-950">
                        {formatCents(affiliateTotals.commissionDue)}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        {formatCount(affiliateTotals.sales)} vendas atribuídas
                      </p>
                    </div>
                  </article>
                </div>

                <div className="mt-8">
                  {/* TODO(Ana): titulo e subtitulo da tabela de assinantes. */}
                  <h3 className="font-display text-2xl font-black text-slate-950">
                    Assinantes
                  </h3>
                  <p className="mb-4 mt-1 text-sm font-semibold text-slate-600">
                    Lista completa de assinaturas, com filtros e paginação.
                  </p>
                  <SubscribersTable />
                </div>
              </div>
            </AdminSection>
          ) : null}

          {activeSection === "ia" ? (
            <AdminSection
              id="ia"
              eyebrow="ia granular"
              icon={<BrainCircuit className="h-4 w-4" />}
              title="Custo, limites e qualidade das respostas"
              subtitle="Vá além do consumo por funcionalidade: veja custo por usuário, proximidade de limites e avaliação thumbs up/down por recurso."
            >
              <div className="grid gap-6 xl:grid-cols-3">
                <article className="card-brutal rounded-3xl bg-white p-6">
                  <h3 className="font-display text-2xl font-black">
                    Chamadas por ferramenta
                  </h3>
                  <div className="mt-4 space-y-3">
                    {aiStatsError ? (
                      <ErrorBlock message={aiStatsError} />
                    ) : aiUsageReal.length ? (
                      aiUsageReal.map((item) => (
                        <div
                          key={item.feature}
                          className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-3"
                        >
                          <div className="flex justify-between font-bold">
                            <span>{item.feature}</span>
                            <span>{item.requests}</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500">
                            {item.credits}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-500">
                        Nenhuma chamada registrada.
                      </p>
                    )}
                  </div>
                </article>
                <article className="card-brutal rounded-3xl bg-white p-6">
                  <h3 className="font-display text-2xl font-black">
                    Custo por ferramenta
                  </h3>
                  <div className="mt-4 space-y-4">
                    {aiStatsError ? (
                      <ErrorBlock message={aiStatsError} />
                    ) : aiUsageReal.length ? (
                      aiUsageReal.map((item) => (
                        <div key={item.feature}>
                          <div className="mb-1 flex justify-between text-sm font-bold">
                            <span>{item.feature}</span>
                            <span>{item.cost}</span>
                          </div>
                          <div className="h-3 rounded-full border border-slate-900 bg-slate-100">
                            <div
                              className="h-full rounded-full bg-pink-600"
                              style={{
                                width:
                                  maxAiCost > 0
                                    ? `${(item.costValue / maxAiCost) * 100}%`
                                    : "0%",
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-500">
                        Nenhum custo registrado.
                      </p>
                    )}
                  </div>
                </article>
                <article className="card-brutal rounded-3xl bg-white p-6">
                  <h3 className="font-display text-2xl font-black">
                    Custo por usuário
                  </h3>
                  <div className="mt-4">
                    <PendingIntegration
                      tool="ai_usage_logs por usuário"
                      description="Dados agregados por usuário disponíveis após 30 dias"
                    />
                  </div>
                </article>
              </div>
            </AdminSection>
          ) : null}

          {activeSection === "newsletter" ? <NewsletterAdminSection /> : null}

          {activeSection === "emails" ? <EmailCampaignsAdminSection /> : null}

          {activeSection === "beta" ? <BetaCodesAdminSection /> : null}

          {activeSection === "afiliados" ? (
            <article
              id="afiliados"
              className="card-brutal scroll-mt-28 overflow-hidden rounded-[2rem] bg-white"
            >
              <div className="border-b-2 border-slate-900 bg-[#ffb800] p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[2px_2px_0_#0f172a]">
                      <Handshake className="h-4 w-4" />
                      afiliados
                    </p>
                    <h2 className="font-display mt-4 text-3xl font-black text-slate-950">
                      Links com desconto e comissão para parceiros
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm font-bold text-slate-800">
                      Gere cupons rastreáveis para influenciadores, comunidades,
                      mentorias e embaixadores. Cada link aplica desconto ao
                      aluno e calcula comissão para o afiliado.
                    </p>
                  </div>
                  <div className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_#0f172a]">
                    <p className="text-xs font-black uppercase text-slate-500">
                      status
                    </p>
                    <p className="font-display text-xl font-black text-slate-950">
                      Manual ativo
                    </p>
                    <p className="text-sm font-bold text-slate-600">
                      {affiliates.length} afiliados cadastrados
                    </p>
                  </div>
                </div>
              </div>

              {affiliatesError ? (
                <div className="border-b-2 border-slate-900 p-6">
                  <ErrorBlock message={affiliatesError} />
                </div>
              ) : null}

              <div className="grid gap-5 border-b-2 border-slate-900 bg-violet-50 p-6 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Receita atribuída",
                    value: formatCents(affiliateTotals.revenue),
                    icon: <DollarSign className="h-5 w-5" />,
                  },
                  {
                    label: "Comissões a pagar",
                    value: formatCents(affiliateTotals.commissionDue),
                    icon: <WalletCards className="h-5 w-5" />,
                  },
                  {
                    label: "Vendas atribuídas",
                    value: formatCount(affiliateTotals.sales),
                    icon: <Trophy className="h-5 w-5" />,
                  },
                  {
                    label: "Cliques registrados",
                    value: formatCount(affiliateTotals.clicks),
                    icon: <MousePointerClick className="h-5 w-5" />,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_#0f172a]"
                  >
                    <span className="inline-flex rounded-xl border-2 border-slate-900 bg-yellow-300 p-2 text-slate-950">
                      {item.icon}
                    </span>
                    <p className="mt-3 text-xs font-black uppercase text-violet-700">
                      {item.label}
                    </p>
                    <p className="font-display mt-1 text-2xl font-black text-slate-950">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 p-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-3xl border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a]">
                  <h3 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
                    <PlusCircle className="h-6 w-6" />
                    Gerar link de afiliado
                  </h3>
                  <div className="mt-5 grid gap-4">
                    <label className="text-sm font-black text-slate-950">
                      Nome do afiliado
                      <input
                        value={affiliateName}
                        onChange={(event) => {
                          setAffiliateName(event.target.value);
                          setCopiedAffiliateLink(false);
                        }}
                        className="mt-2 w-full rounded-2xl border-2 border-slate-900 bg-violet-50 px-4 py-3 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-200"
                        placeholder="Ex: Parceiro Tech"
                      />
                    </label>

                    <label className="text-sm font-black text-slate-950">
                      Código/cupom
                      <div className="mt-2 flex gap-2">
                        <input
                          value={affiliateCode}
                          onChange={(event) => {
                            setAffiliateCode(
                              slugifyAffiliateCode(event.target.value),
                            );
                            setCopiedAffiliateLink(false);
                          }}
                          className="w-full rounded-2xl border-2 border-slate-900 bg-violet-50 px-4 py-3 font-bold uppercase outline-none focus:bg-white focus:ring-4 focus:ring-violet-200"
                          placeholder="PARCEIRA20"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateAffiliateCode}
                          className="rounded-2xl border-2 border-slate-900 bg-yellow-300 px-4 text-sm font-black shadow-[3px_3px_0_#0f172a]"
                        >
                          Gerar
                        </button>
                      </div>
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-black text-slate-950">
                        Desconto para aluno: {affiliateDiscount}%
                        <input
                          type="range"
                          min="5"
                          max="50"
                          step="5"
                          value={affiliateDiscount}
                          onChange={(event) => {
                            setAffiliateDiscount(Number(event.target.value));
                            setCopiedAffiliateLink(false);
                          }}
                          className="mt-4 w-full accent-violet-700"
                        />
                      </label>
                      <label className="text-sm font-black text-slate-950">
                        Comissão afiliado: {affiliateCommission}%
                        <input
                          type="range"
                          min="5"
                          max="50"
                          step="5"
                          value={affiliateCommission}
                          onChange={(event) =>
                            setAffiliateCommission(Number(event.target.value))
                          }
                          className="mt-4 w-full accent-violet-700"
                        />
                      </label>
                    </div>

                    <div className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
                      <p className="flex items-center gap-2 text-xs font-black uppercase text-violet-700">
                        <LinkIcon className="h-4 w-4" />
                        link gerado
                      </p>
                      <p className="mt-2 break-all font-mono text-sm font-black text-slate-950">
                        {generatedAffiliateLink}
                      </p>
                      <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-2">
                        <span className="rounded-full border border-slate-300 bg-white px-3 py-2">
                          Cupom: {slugifyAffiliateCode(affiliateCode)}
                        </span>
                        <span className="rounded-full border border-slate-300 bg-white px-3 py-2">
                          Comissão: {affiliateCommission}% por venda paga
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={handleCreateAffiliate}
                        disabled={savingAffiliate}
                        className="btn-brutal-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-black disabled:opacity-60"
                      >
                        <PlusCircle className="h-5 w-5" />
                        {savingAffiliate ? "Salvando..." : "Criar afiliado"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyAffiliateLink}
                        className="btn-brutal-accent inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-black"
                      >
                        <Copy className="h-5 w-5" />
                        {copiedAffiliateLink ? "Link copiado" : "Copiar link"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a]">
                  <h3 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
                    <Tag className="h-6 w-6" />
                    Afiliados cadastrados
                  </h3>
                  <div className="mt-5">
                    {overviewLoading || affiliatesLoading ? (
                      <LoadingBlock />
                    ) : affiliates.length ? (
                      <div className="space-y-3">
                        {affiliates.map((affiliate) => (
                          <div
                            key={affiliate.id}
                            className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-display text-lg font-black text-slate-950">
                                  {affiliate.name}
                                </p>
                                <p className="mt-1 font-mono text-xs font-black text-violet-700">
                                  {affiliate.code}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                  {affiliate.discount_percent}% desconto •{" "}
                                  {affiliate.commission_percent}% comissão •{" "}
                                  {affiliate.status}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2 sm:justify-end">
                                <button
                                  type="button"
                                  onClick={() => startAffiliateEdit(affiliate)}
                                  className="rounded-full border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black shadow-[2px_2px_0_#0f172a]"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleCopyAffiliateCardLink(affiliate)
                                  }
                                  className="rounded-full border-2 border-slate-900 bg-yellow-100 px-3 py-2 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a]"
                                >
                                  {copiedAffiliateCardId === affiliate.id
                                    ? "Link copiado!"
                                    : "Copiar link"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleMarkAffiliatePaid(affiliate)
                                  }
                                  disabled={
                                    affiliate.commission_due_cents <= 0 ||
                                    payingAffiliateId === affiliate.id
                                  }
                                  className="rounded-full border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black shadow-[2px_2px_0_#0f172a] disabled:opacity-50"
                                >
                                  {payingAffiliateId === affiliate.id
                                    ? "Pagando..."
                                    : "Marcar comissão paga"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteAffiliateTarget(affiliate)
                                  }
                                  className="rounded-full border-2 border-slate-900 bg-rose-100 px-3 py-2 text-xs font-black text-rose-800 shadow-[2px_2px_0_#0f172a]"
                                >
                                  Excluir
                                </button>
                              </div>
                            </div>
                            <div className="mt-4 grid gap-2 text-xs font-black sm:grid-cols-4">
                              <span className="rounded-xl bg-white px-3 py-2">
                                Cliques: {formatCount(affiliate.clicks)}
                              </span>
                              <span className="rounded-xl bg-white px-3 py-2">
                                Vendas: {formatCount(affiliate.sales)}
                              </span>
                              <span className="rounded-xl bg-white px-3 py-2">
                                Receita: {formatCents(affiliate.revenue_cents)}
                              </span>
                              <span className="rounded-xl bg-white px-3 py-2">
                                A pagar:{" "}
                                {formatCents(affiliate.commission_due_cents)}
                              </span>
                            </div>
                            {editingAffiliateId === affiliate.id &&
                            affiliateEditForm ? (
                              <div className="mt-4 rounded-2xl border-2 border-slate-900 bg-white p-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <label className="text-xs font-black uppercase text-slate-600">
                                    Nome
                                    <input
                                      value={affiliateEditForm.name}
                                      onChange={(event) =>
                                        setAffiliateEditForm({
                                          ...affiliateEditForm,
                                          name: event.target.value,
                                        })
                                      }
                                      className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3 text-sm font-bold normal-case text-slate-950"
                                    />
                                  </label>
                                  <label className="text-xs font-black uppercase text-slate-600">
                                    Email
                                    <input
                                      value={affiliateEditForm.email}
                                      onChange={(event) =>
                                        setAffiliateEditForm({
                                          ...affiliateEditForm,
                                          email: event.target.value,
                                        })
                                      }
                                      className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3 text-sm font-bold normal-case text-slate-950"
                                      type="email"
                                    />
                                  </label>
                                  <label className="text-xs font-black uppercase text-slate-600">
                                    Desconto (%)
                                    <input
                                      value={affiliateEditForm.discount_percent}
                                      onChange={(event) =>
                                        setAffiliateEditForm({
                                          ...affiliateEditForm,
                                          discount_percent: Number(
                                            event.target.value,
                                          ),
                                        })
                                      }
                                      className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3 text-sm font-bold normal-case text-slate-950"
                                      min={1}
                                      max={100}
                                      type="number"
                                    />
                                  </label>
                                  <label className="text-xs font-black uppercase text-slate-600">
                                    Comissão (%)
                                    <input
                                      value={
                                        affiliateEditForm.commission_percent
                                      }
                                      onChange={(event) =>
                                        setAffiliateEditForm({
                                          ...affiliateEditForm,
                                          commission_percent: Number(
                                            event.target.value,
                                          ),
                                        })
                                      }
                                      className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3 text-sm font-bold normal-case text-slate-950"
                                      min={1}
                                      max={100}
                                      type="number"
                                    />
                                  </label>
                                  <label className="text-xs font-black uppercase text-slate-600">
                                    Status
                                    <select
                                      value={affiliateEditForm.status}
                                      onChange={(event) =>
                                        setAffiliateEditForm({
                                          ...affiliateEditForm,
                                          status: event.target
                                            .value as AffiliateEditForm["status"],
                                        })
                                      }
                                      className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3 text-sm font-bold normal-case text-slate-950"
                                    >
                                      <option value="active">active</option>
                                      <option value="paused">paused</option>
                                      <option value="inactive">inactive</option>
                                    </select>
                                  </label>
                                  <label className="text-xs font-black uppercase text-slate-600 sm:col-span-2">
                                    Notas
                                    <textarea
                                      value={affiliateEditForm.notes}
                                      onChange={(event) =>
                                        setAffiliateEditForm({
                                          ...affiliateEditForm,
                                          notes: event.target.value,
                                        })
                                      }
                                      className="mt-1 min-h-24 w-full rounded-xl border-2 border-slate-300 p-3 text-sm font-bold normal-case text-slate-950"
                                    />
                                  </label>
                                </div>
                                <div className="mt-4 flex justify-end gap-3">
                                  <button
                                    type="button"
                                    onClick={cancelAffiliateEdit}
                                    className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleSaveAffiliateEdit(affiliate)
                                    }
                                    disabled={
                                      savingAffiliateEditId === affiliate.id
                                    }
                                    className="rounded-full border-2 border-slate-900 bg-yellow-300 px-4 py-2 text-sm font-black shadow-[2px_2px_0_#0f172a] disabled:opacity-60"
                                  >
                                    {savingAffiliateEditId === affiliate.id
                                      ? "Salvando..."
                                      : "Salvar"}
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
                        <p className="font-display text-lg font-black text-slate-950">
                          Nenhum afiliado cadastrado ainda
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          Crie o primeiro afiliado pelo formulário ao lado.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ) : null}

          {activeSection === "visao-geral" ? (
            <>
              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <article className="card-brutal rounded-3xl bg-white p-6">
                  <h2 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
                    <Activity className="h-6 w-6" />
                    Saúde do sistema
                  </h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {overviewLoading ? (
                      <div className="sm:col-span-2">
                        <LoadingBlock />
                      </div>
                    ) : healthItemsReal.length ? (
                      healthItemsReal.map((item) => (
                        <div
                          key={item.service}
                          className={`rounded-2xl border-2 border-slate-900 p-4 ${item.tone}`}
                        >
                          <div className="flex items-center gap-2">
                            {item.icon}
                            <p className="font-display text-lg font-black">
                              {item.service}
                            </p>
                          </div>
                          <p className="mt-3 text-sm font-black uppercase">
                            {item.status}
                          </p>
                          <p className="mt-1 text-sm font-semibold opacity-80">
                            {item.detail}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="sm:col-span-2">
                        <PendingIntegration
                          tool="/api/health"
                          description="Health check indisponível no momento"
                        />
                      </div>
                    )}
                  </div>
                </article>

                <article className="card-brutal rounded-3xl bg-white p-6">
                  <h2 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
                    <Eye className="h-6 w-6" />
                    Páginas mais acessadas
                  </h2>
                  <div className="mt-5 overflow-hidden rounded-2xl border-2 border-slate-900">
                    {overviewLoading ? (
                      <div className="p-5">
                        <LoadingBlock />
                      </div>
                    ) : posthogHasData && posthogStats?.pages.length ? (
                      <div className="divide-y-2 divide-slate-100">
                        {posthogStats.pages.slice(0, 5).map((page) => (
                          <div
                            key={page.page}
                            className="flex items-center justify-between gap-4 p-4"
                          >
                            <p className="truncate text-sm font-black text-slate-950">
                              {page.page}
                            </p>
                            <p className="font-display text-lg font-black text-violet-700">
                              {formatCount(page.views)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-5">
                        <PosthogStateNotice state={posthogState} />
                      </div>
                    )}
                  </div>
                </article>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <article className="card-brutal rounded-3xl bg-white p-6 xl:col-span-2">
                  <h2 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
                    <Globe2 className="h-6 w-6" />
                    Aquisição de usuários
                  </h2>
                  <div className="mt-6 space-y-4">
                    {overviewLoading ? (
                      <LoadingBlock />
                    ) : posthogHasData && posthogStats?.acquisition.length ? (
                      posthogStats.acquisition.map((channel) => {
                        const percent =
                          posthogAcquisitionTotal > 0
                            ? Math.round(
                                (channel.users / posthogAcquisitionTotal) * 100,
                              )
                            : 0;
                        return (
                          <div
                            key={channel.channel}
                            className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <p className="font-display text-lg font-black text-slate-950">
                                {channel.channel === "None"
                                  ? "Direto"
                                  : channel.channel}
                              </p>
                              <p className="text-sm font-black text-violet-700">
                                {formatCount(channel.users)} usuários
                              </p>
                            </div>
                            <div className="mt-3 h-3 rounded-full border-2 border-slate-900 bg-white">
                              <div
                                className="h-full rounded-full bg-emerald-600"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <PosthogStateNotice state={posthogState} />
                    )}
                  </div>
                </article>

                <article className="card-brutal rounded-3xl bg-white p-6">
                  <h2 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
                    <Zap className="h-6 w-6" />
                    Eventos recentes
                  </h2>
                  <div className="mt-5 space-y-4">
                    {overviewLoading ? (
                      <LoadingBlock />
                    ) : auditLogs.length ? (
                      auditLogs.map((event) => (
                        <div
                          key={`${event.created_at}-${event.resource_type}-${event.resource_slug || ""}`}
                          className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-2 text-xs font-black uppercase text-violet-700">
                              <FileText className="h-4 w-4" />
                              {formatRelativeTime(event.created_at)}
                            </span>
                            <Clock3 className="h-4 w-4 text-slate-400" />
                          </div>
                          <p className="mt-2 font-display text-lg font-black text-slate-950">
                            {auditTitle(event.action)}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-600">
                            {event.resource_type} {event.resource_slug || ""}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4 text-sm font-black text-slate-600">
                        Nenhuma ação registrada ainda.
                      </p>
                    )}
                  </div>
                </article>
              </div>
            </>
          ) : null}
        </div>
      </section>
      {deleteAffiliateTarget ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
          <div className="card-brutal max-w-md rounded-3xl bg-white p-6">
            <h3 className="font-display text-2xl font-black text-slate-950">
              Tem certeza que deseja excluir o afiliado{" "}
              {deleteAffiliateTarget.name}?
            </h3>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteAffiliateTarget(null)}
                className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteAffiliate()}
                disabled={deletingAffiliateId === deleteAffiliateTarget.id}
                className="rounded-full border-2 border-slate-900 bg-rose-100 px-4 py-2 text-sm font-black text-rose-800 disabled:opacity-60"
              >
                {deletingAffiliateId === deleteAffiliateTarget.id
                  ? "Excluindo..."
                  : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
