import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Compass,
  Copy,
  CreditCard,
  Database,
  DollarSign,
  Eye,
  FileText,
  Flame,
  Gauge,
  Globe2,
  Handshake,
  LayoutDashboard,
  Link as LinkIcon,
  LockKeyhole,
  LogOut,
  Mail,
  MousePointerClick,
  Percent,
  PieChart,
  PlusCircle,
  RefreshCcw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Tag,
  Trophy,
  UserRound,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import PendingIntegration from "@/components/admin/PendingIntegration";
import { useAuth } from "@/contexts/AuthContext";
import { adminFetch } from "@/lib/adminApi";
import { apiUrl } from "@/lib/api";

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
  trend: string;
  direction: "up" | "down" | "neutral";
  icon: ReactNode;
  color: string;
};

type AiUsage = {
  feature: string;
  requests: string;
  credits: string;
  cost: string;
  status: "ok" | "watch" | "high";
};

type QueueStats = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
};

type FunnelStep = {
  label: string;
  value: number;
  visitors: string;
  color: string;
};

type HealthItem = {
  service: string;
  status: string;
  detail: string;
  icon: ReactNode;
  tone: string;
};

type AffiliatePartner = {
  name: string;
  code: string;
  discount: number;
  commission: number;
  clicks: string;
  trials: string;
  sales: string;
  revenue: string;
  commissionDue: string;
  status: "ativo" | "pausado" | "rascunho";
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
  | "afiliados";

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

type SubscriptionRecord = {
  user_id?: string | null;
  status?: string | null;
  plans?: { name?: string | null; price_cents?: number | null } | null;
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

type AiStatsData = Record<string, { calls: number; success: number; cost: number }>;

type ChurnRiskUser = {
  name: string;
  email: string;
  days_inactive: number;
  mrr: number;
};

type PosthogStatsData = {
  configured?: boolean;
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

type ContentType = "news" | "external_jobs" | "events" | "areas" | "courses" | "roadmaps";

const metricCards: MetricCard[] = [
  {
    label: "Usuários ativos",
    value: "0",
    detail: "Aguardando /api/admin/dashboard",
    trend: "real",
    direction: "neutral",
    icon: <Users className="h-6 w-6" />,
    color: "bg-violet-700 text-white",
  },
  {
    label: "Assinantes Pro",
    value: "0",
    detail: "Aguardando /api/admin/dashboard",
    trend: "real",
    direction: "neutral",
    icon: <CreditCard className="h-6 w-6" />,
    color: "bg-[#ffb800] text-slate-950",
  },
  {
    label: "Receita recorrente",
    value: "0",
    detail: "Aguardando /api/admin/dashboard",
    trend: "real",
    direction: "neutral",
    icon: <DollarSign className="h-6 w-6" />,
    color: "bg-emerald-600 text-white",
  },
  {
    label: "Créditos de IA",
    value: "0",
    detail: "Aguardando ai_usage_logs",
    trend: "real",
    direction: "neutral",
    icon: <Bot className="h-6 w-6" />,
    color: "bg-pink-600 text-white",
  },
  {
    label: "Conversão cadastro",
    value: "0",
    detail: "Aguardando dados reais",
    trend: "pendente",
    direction: "neutral",
    icon: <MousePointerClick className="h-6 w-6" />,
    color: "bg-blue-600 text-white",
  },
  {
    label: "Retenção 7 dias",
    value: "0",
    detail: "Aguardando analytics",
    trend: "pendente",
    direction: "neutral",
    icon: <RefreshCcw className="h-6 w-6" />,
    color: "bg-orange-500 text-white",
  },
];

const aiUsage: AiUsage[] = [
  { feature: "Quiz de área com IA", requests: "1.892", credits: "94.600", cost: "R$ 142,90", status: "ok" },
  { feature: "Analisador de currículo", requests: "734", credits: "88.080", cost: "R$ 161,40", status: "watch" },
  { feature: "Otimizador de LinkedIn", requests: "421", credits: "37.890", cost: "R$ 72,80", status: "ok" },
  { feature: "Plano de estudos", requests: "613", credits: "55.170", cost: "R$ 109,10", status: "high" },
];

const funnelSteps: FunnelStep[] = [];

const planBreakdown = [
  { label: "Gratuito", value: "1.065", percent: 83, color: "bg-slate-300" },
  { label: "Pro mensal", value: "176", percent: 14, color: "bg-violet-700" },
  { label: "Pro anual", value: "43", percent: 3, color: "bg-[#ffb800]" },
];

const healthItems: HealthItem[] = [
  {
    service: "Supabase Auth",
    status: "Operando",
    detail: "Login e cadastro sem falhas críticas",
    icon: <ShieldCheck className="h-5 w-5" />,
    tone: "bg-emerald-50 text-emerald-800",
  },
  {
    service: "Banco de dados",
    status: "Estável",
    detail: "Latência média estimada de 118ms",
    icon: <Database className="h-5 w-5" />,
    tone: "bg-blue-50 text-blue-800",
  },
  {
    service: "Serviços de IA",
    status: "Atenção",
    detail: "Plano de estudos acima da média de custo",
    icon: <BrainCircuit className="h-5 w-5" />,
    tone: "bg-amber-50 text-amber-900",
  },
  {
    service: "Servidor web",
    status: "Online",
    detail: "Uptime estimado de 99,92%",
    icon: <Server className="h-5 w-5" />,
    tone: "bg-violet-50 text-violet-800",
  },
];

const topPages = [
  { page: "/areas", views: "18.204", engagement: "72%" },
  { page: "/quiz-carreira", views: "12.891", engagement: "81%" },
  { page: "/curriculo/analisar", views: "9.480", engagement: "68%" },
  { page: "/roadmaps", views: "8.772", engagement: "75%" },
  { page: "/estagio", views: "7.614", engagement: "64%" },
];

const acquisitionChannels = [
  { channel: "Instagram", users: "4.120", percent: 49, color: "bg-pink-500" },
  { channel: "Busca orgânica", users: "2.318", percent: 28, color: "bg-emerald-600" },
  { channel: "Indicação", users: "1.137", percent: 14, color: "bg-blue-600" },
  { channel: "Direto", users: "845", percent: 9, color: "bg-violet-700" },
];

const affiliatePartners: AffiliatePartner[] = [];

const affiliateSummary = [
  { label: "Receita por afiliados", value: "R$ 4.068", icon: <DollarSign className="h-5 w-5" /> },
  { label: "Comissões a pagar", value: "R$ 1.135,80", icon: <WalletCards className="h-5 w-5" /> },
  { label: "Vendas atribuídas", value: "113", icon: <Trophy className="h-5 w-5" /> },
  { label: "Conversão média", value: "3,5%", icon: <Percent className="h-5 w-5" /> },
];

const adminNavItems: AdminNavItem[] = [
  { href: "#visao-geral", label: "Visão", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "#conversao", label: "Conversão", icon: <MousePointerClick className="h-4 w-4" /> },
  { href: "#paginas", label: "Páginas", icon: <Eye className="h-4 w-4" /> },
  { href: "#conteudo", label: "Conteúdo", icon: <FileText className="h-4 w-4" /> },
  { href: "#usuarios", label: "Usuários", icon: <UserRound className="h-4 w-4" /> },
  { href: "#retencao", label: "Retenção", icon: <RefreshCcw className="h-4 w-4" /> },
  { href: "#seo", label: "SEO", icon: <Search className="h-4 w-4" /> },
  { href: "#financeiro", label: "Financeiro", icon: <DollarSign className="h-4 w-4" /> },
  { href: "#ia", label: "IA", icon: <Bot className="h-4 w-4" /> },
  { href: "#afiliados", label: "Afiliados", icon: <Handshake className="h-4 w-4" /> },
];

const conversionMetrics = [
  { label: "Página campeã", value: "/curriculo/analisar", detail: "31% das conversões vieram depois desta página" },
  { label: "Tempo até converter", value: "2,8 dias", detail: "E-mail de conversão ideal no dia 2" },
  { label: "Sessões até converter", value: "4,2", detail: "Boa janela para remarketing" },
  { label: "Gate Pro decisivo", value: "Analisador de currículo", detail: "Primeira ferramenta Pro tentada por 38%" },
];

const conversionPages = [
  { page: "/curriculo/analisar", conversions: 68, cta: "CTA agressivo no topo e no resultado parcial" },
  { page: "/quiz-carreira", conversions: 54, cta: "Oferta Pro após resposta do quiz" },
  { page: "/roadmaps", conversions: 27, cta: "Plano personalizado como upgrade" },
  { page: "/salarios", conversions: 19, cta: "Comparativo salarial bloqueado" },
];

const pageBehavior = [
  { page: "/roadmaps", time: "4m 18s", scroll: "78%", exit: "18%", pagesPerSession: "5,4" },
  { page: "/areas", time: "2m 06s", scroll: "42%", exit: "37%", pagesPerSession: "3,1" },
  { page: "/entrevistas", time: "3m 44s", scroll: "69%", exit: "21%", pagesPerSession: "4,8" },
  { page: "/curriculo/analisar", time: "5m 12s", scroll: "83%", exit: "12%", pagesPerSession: "6,2" },
];

const retentionCohorts = [
  { cohort: "Semana 1 jan", week1: "100%", week2: "72%", week3: "58%", week4: "44%" },
  { cohort: "Semana 2 jan", week1: "100%", week2: "75%", week3: "61%", week4: "48%" },
  { cohort: "Semana 3 jan", week1: "100%", week2: "79%", week3: "66%", week4: "52%" },
  { cohort: "Semana 4 jan", week1: "100%", week2: "81%", week3: "69%", week4: "55%" },
];

const cancellationReasons = [
  { reason: "Preço no momento", percent: 34 },
  { reason: "Não usei o suficiente", percent: 27 },
  { reason: "Já consegui uma vaga", percent: 18 },
  { reason: "Faltou conteúdo avançado", percent: 12 },
  { reason: "Outro motivo", percent: 9 },
];

const seoPages = [
  { page: "/areas", signups: 412, keyword: "áreas de ti para iniciantes", indexed: "Indexada" },
  { page: "/dicionario", signups: 188, keyword: "termos de tecnologia", indexed: "Indexada" },
  { page: "/roadmaps", signups: 176, keyword: "roadmap programação iniciante", indexed: "Indexada" },
  { page: "/entrevistas", signups: 93, keyword: "perguntas entrevista dev junior", indexed: "Pendente" },
];

const financialCohorts = [
  { cohort: "Jan/26", mrr: "R$ 1.920", growth: "+18%" },
  { cohort: "Fev/26", mrr: "R$ 2.840", growth: "+22%" },
  { cohort: "Mar/26", mrr: "R$ 4.310", growth: "+31%" },
  { cohort: "Abr/26", mrr: "R$ 6.760", growth: "+27%" },
];

const revenueByChannel = [
  { channel: "Instagram", revenue: "R$ 3.240", percent: 41 },
  { channel: "Busca orgânica", revenue: "R$ 2.180", percent: 28 },
  { channel: "Afiliados", revenue: "R$ 1.520", percent: 19 },
  { channel: "Direto", revenue: "R$ 944", percent: 12 },
];

const externalAffiliateRevenue = [
  { partner: "Alura", revenue: "R$ 820", clicks: "1.204" },
  { partner: "Udemy", revenue: "R$ 436", clicks: "884" },
  { partner: "Rocketseat", revenue: "R$ 312", clicks: "521" },
];

const aiUserCosts: Array<{ user: string; cost: string; paid: string; status: string }> = [];

const aiLimits = [
  { feature: "Análises de currículo", used: 82, limit: "5/mês", usersNearLimit: 37 },
  { feature: "LinkedIn IA", used: 64, limit: "4/mês", usersNearLimit: 19 },
  { feature: "Plano de estudos", used: 51, limit: "6/mês", usersNearLimit: 11 },
];

const aiQuality = [
  { feature: "Quiz de área", positive: 91, negative: 9 },
  { feature: "Currículo IA", positive: 84, negative: 16 },
  { feature: "Plano de estudos", positive: 78, negative: 22 },
];

const recentEvents = [
  { time: "Agora", title: "Pico de uso no Analisador de currículo", detail: "41 análises nos últimos 20 minutos", icon: <Flame className="h-4 w-4" /> },
  { time: "15 min", title: "Nova assinatura Pro anual", detail: "Conversão vinda do Quiz de área", icon: <WalletCards className="h-4 w-4" /> },
  { time: "42 min", title: "Campanha do Instagram performando bem", detail: "CTR 6,8% para /areas", icon: <Globe2 className="h-4 w-4" /> },
  { time: "1h", title: "Custo de IA dentro do limite diário", detail: "63% do orçamento consumido", icon: <Gauge className="h-4 w-4" /> },
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
  return `https://boranatech.com.br/pro?ref=${safeCode}&cupom=${safeCode}&desconto=${discount}`;
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
    source: record.onboarding_completed ? "Onboarding completo" : "Não informado",
    status: record.onboarding_completed ? "Ativo" : "Cadastro incompleto",
    paidTotal: "R$ 0,00",
    features: [],
    sessions: [],
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
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
      detail: databaseOk ? "Validação dependente do banco operacional" : "Banco indisponível no health check",
      icon: <ShieldCheck className="h-5 w-5" />,
      tone: databaseOk ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800",
    },
    {
      service: "Banco de dados",
      status: databaseOk ? "Estável" : "Falha",
      detail: `Resposta em ${health.responseTime ?? 0}ms`,
      icon: <Database className="h-5 w-5" />,
      tone: databaseOk ? "bg-blue-50 text-blue-800" : "bg-rose-50 text-rose-800",
    },
    {
      service: "Serviços de IA",
      status: openaiOk ? "Operando" : "Sem chave",
      detail: openaiOk ? "OpenAI respondeu no health check" : "OPENAI_API_KEY ausente ou inválida",
      icon: <BrainCircuit className="h-5 w-5" />,
      tone: openaiOk ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900",
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

function TrendBadge({ direction, value }: { direction: MetricCard["direction"]; value: string }) {
  const Icon = direction === "down" ? ArrowDownRight : ArrowUpRight;
  const tone = direction === "down" ? "bg-orange-100 text-orange-800" : "bg-emerald-100 text-emerald-800";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-slate-900 px-2 py-1 text-xs font-black ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {value}
    </span>
  );
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
    <span className={`rounded-full border border-slate-900 px-2 py-1 text-[11px] font-black uppercase ${classes[status]}`}>
      {labels[status]}
    </span>
  );
}

function PublishBadge({ published }: { published?: boolean }) {
  return (
    <span
      className={`w-fit rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black ${
        published ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
      }`}
    >
      {published ? "Publicado" : "Rascunho"}
    </span>
  );
}

function LoadingBlock({ label = "Carregando dados..." }: { label?: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center text-sm font-black text-slate-500">
      {label}
    </div>
  );
}

function AffiliateStatusPill({ status }: { status: AffiliatePartner["status"] }) {
  const classes = {
    ativo: "bg-emerald-100 text-emerald-800",
    pausado: "bg-amber-100 text-amber-900",
    rascunho: "bg-slate-100 text-slate-700",
  };

  return (
    <span className={`rounded-full border border-slate-900 px-2 py-1 text-[11px] font-black uppercase ${classes[status]}`}>
      {status}
    </span>
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
  function handleSectionClick(event: React.MouseEvent<HTMLButtonElement>, href: string) {
    event.preventDefault();
    const nextSection = href.replace("#", "") as AdminSectionId;
    setActiveSection?.(nextSection);
  }

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <header className="sticky top-0 z-[1000] border-b-2 border-slate-900 bg-[#f6f0df]/95 backdrop-blur">
        <div className="container">
          <div className="flex min-h-16 items-center justify-between gap-4">
            <a href="/admin" className="group flex min-w-fit items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-yellow-400 text-slate-950 shadow-[2px_2px_0_#0f172a] transition-all group-hover:shadow-[4px_4px_0_#0f172a]">
                <Compass className="h-5 w-5" />
              </span>
              <div>
                <span className="font-display block text-sm font-black uppercase leading-tight text-slate-900">
                  BORA NA TECH?
                </span>
                <span className="block text-xs font-bold text-slate-500">Admin da plataforma</span>
              </div>
            </a>

            {session ? (
              <nav className="hidden flex-1 items-center justify-center gap-1 px-2 py-2 lg:flex">
                {adminNavItems.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={(event) => handleSectionClick(event, item.href)}
                    className={`nav-pill inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-bold hover:text-slate-950 ${
                      activeSection === item.href.replace("#", "") ? "nav-pill-active text-slate-950" : "text-slate-700"
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
                    <p className="text-[10px] font-black uppercase leading-none text-violet-700">Admin</p>
                    <p className="text-xs font-black leading-tight text-slate-950">{session.displayName}</p>
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
                    activeSection === item.href.replace("#", "") ? "nav-pill-active text-slate-950" : "text-slate-700"
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
          <h2 className="font-display mt-3 text-3xl font-black text-slate-950">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function MiniStatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="card-brutal rounded-3xl bg-white p-5">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="font-display mt-2 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm font-semibold text-slate-600">{detail}</p>
    </div>
  );
}

function AdminAccessGate({ reason }: { reason: "loading" | "login" | "forbidden" }) {
  return (
    <AdminShell>
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
              O acesso agora é validado pela sua sessão Supabase e pela role administrativa registrada no banco.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Métricas", icon: <BarChart3 className="h-5 w-5" /> },
                { label: "IA", icon: <Bot className="h-5 w-5" /> },
                { label: "Operação", icon: <Activity className="h-5 w-5" /> },
              ].map((item) => (
                <div key={item.label} className="card-brutal rounded-2xl bg-white p-4">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-900 bg-yellow-300">
                    {item.icon}
                  </span>
                  <p className="font-display text-lg font-black text-slate-950">{item.label}</p>
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
                  {reason === "loading" ? "Verificando acesso" : reason === "login" ? "Faça login primeiro" : "Acesso negado"}
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
              <a href="/login" className="btn-brutal-accent inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-black">
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

const contentTabs: Array<{ type: ContentType; label: string; supported: boolean; description: string }> = [
  { type: "news", label: "Notícias", supported: true, description: "Adicionar, editar e publicar notícias." },
  { type: "external_jobs", label: "Vagas", supported: true, description: "Adicionar, editar e publicar vagas." },
  { type: "events", label: "Eventos", supported: true, description: "Adicionar, editar e publicar eventos." },
  { type: "areas", label: "Áreas", supported: true, description: "Editar nome, descrições e publicação." },
  { type: "courses", label: "Cursos", supported: true, description: "Adicionar, editar, despublicar e remover cursos." },
  { type: "roadmaps", label: "Roadmaps", supported: true, description: "Editar título, descrição, duração e publicação." },
];

function emptyContentForm(type: ContentType): Record<string, string | boolean | number> {
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
    return { name: "", short_description: "", full_description: "", is_pro: false, is_published: true };
  }

  return { title: "", description: "", area_slug: "", level: "iniciante", estimated_duration_weeks: 0, is_pro: false, is_published: true };
}

function contentPayload(type: ContentType, form: Record<string, string | boolean | number>) {
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

function ContentAdminSection() {
  const [activeType, setActiveType] = useState<ContentType>("areas");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean | number>>(emptyContentForm("areas"));
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
      toast.error(error instanceof Error ? error.message : "Erro ao carregar conteúdo.");
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
      await adminFetch(editing ? `/content/${activeType}/${editing.id}` : `/content/${activeType}`, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(editing ? "Conteúdo atualizado com sucesso." : "Conteúdo criado com sucesso.");
      setEditing(null);
      setForm(emptyContentForm(activeType));
      await loadItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar. Tente novamente.");
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
      toast.success(item.is_published ? "Conteúdo despublicado com sucesso." : "Conteúdo publicado com sucesso.");
      await loadItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao publicar. Tente novamente.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setBusyId(deleteTarget.id);
    try {
      await adminFetch(`/content/${activeType}/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Item despublicado com sucesso.");
      setDeleteTarget(null);
      await loadItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir. Tente novamente.");
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
                activeType === tab.type ? "border-slate-900 bg-yellow-300" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {tab.label}
              {!tab.supported ? <AlertTriangle className="h-4 w-4 text-amber-700" /> : null}
            </button>
          ))}
        </aside>

        <div className="grid gap-6">
          {!activeConfig.supported ? (
            <article className="card-brutal rounded-3xl bg-white p-6">
              <h3 className="font-display text-2xl font-black text-slate-950">{activeConfig.label}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-600">{activeConfig.description}</p>
              <div className="mt-5">
                <PendingIntegration tool={`Admin CRUD de ${activeConfig.label}`} description={activeConfig.description} />
              </div>
            </article>
          ) : (
            <>
              <article className="card-brutal rounded-3xl bg-white p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-2xl font-black text-slate-950">
                      {editing ? `Editar ${activeConfig.label}` : `Adicionar ${activeConfig.label}`}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{activeConfig.description}</p>
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

                <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
                  {activeType === "news" ? (
                    <>
                      <AdminInput label="Título" value={String(form.title || "")} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
                      <AdminInput label="URL da notícia" value={String(form.url || "")} onChange={(value) => setForm((current) => ({ ...current, url: value }))} required />
                      <AdminInput label="URL da imagem" value={String(form.image_url || "")} onChange={(value) => setForm((current) => ({ ...current, image_url: value }))} />
                      <AdminInput label="Fonte" value={String(form.source || "")} onChange={(value) => setForm((current) => ({ ...current, source: value }))} />
                      <AdminInput label="Data de publicação" type="date" value={String(form.published_at || "")} onChange={(value) => setForm((current) => ({ ...current, published_at: value }))} />
                      <AdminTextarea label="Resumo" value={String(form.summary || "")} onChange={(value) => setForm((current) => ({ ...current, summary: value }))} />
                    </>
                  ) : activeType === "external_jobs" ? (
                    <>
                      <AdminInput label="Título" value={String(form.title || "")} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
                      <AdminInput label="URL da vaga" value={String(form.url || "")} onChange={(value) => setForm((current) => ({ ...current, url: value }))} required />
                      <AdminInput label="Empresa" value={String(form.company || "")} onChange={(value) => setForm((current) => ({ ...current, company: value }))} />
                      <AdminInput label="Localização" value={String(form.location || "")} onChange={(value) => setForm((current) => ({ ...current, location: value }))} />
                      <AdminSelect
                        label="Senioridade"
                        value={String(form.seniority || "junior")}
                        options={["estagio", "junior", "pleno", "senior"]}
                        onChange={(value) => setForm((current) => ({ ...current, seniority: value }))}
                      />
                      <AdminInput label="Área" value={String(form.area_slug || "")} onChange={(value) => setForm((current) => ({ ...current, area_slug: value }))} />
                      <AdminInput label="Data de publicação" type="date" value={String(form.published_at || "")} onChange={(value) => setForm((current) => ({ ...current, published_at: value }))} />
                      <AdminTextarea label="Descrição" value={String(form.description || "")} onChange={(value) => setForm((current) => ({ ...current, description: value }))} />
                    </>
                  ) : activeType === "events" ? (
                    <>
                      <AdminInput label="Título" value={String(form.title || "")} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
                      <AdminInput label="URL" value={String(form.url || "")} onChange={(value) => setForm((current) => ({ ...current, url: value }))} />
                      <AdminInput label="Local" value={String(form.location_label || "")} onChange={(value) => setForm((current) => ({ ...current, location_label: value }))} />
                      <AdminInput label="Cidade" value={String(form.city || "")} onChange={(value) => setForm((current) => ({ ...current, city: value }))} />
                      <AdminInput
                        label="Data de início"
                        type="datetime-local"
                        value={String(form.starts_at || "")}
                        onChange={(value) => setForm((current) => ({ ...current, starts_at: value }))}
                      />
                      <AdminInput
                        label="Data de fim"
                        type="datetime-local"
                        value={String(form.ends_at || "")}
                        onChange={(value) => setForm((current) => ({ ...current, ends_at: value }))}
                      />
                      <AdminTextarea label="Descrição" value={String(form.description || "")} onChange={(value) => setForm((current) => ({ ...current, description: value }))} />
                    </>
                  ) : activeType === "areas" ? (
                    <>
                      <AdminInput label="Nome" value={String(form.name || "")} onChange={(value) => setForm((current) => ({ ...current, name: value }))} required />
                      <AdminInput
                        label="Resumo"
                        value={String(form.short_description || "")}
                        onChange={(value) => setForm((current) => ({ ...current, short_description: value }))}
                      />
                      <AdminTextarea
                        label="Descrição completa"
                        value={String(form.full_description || "")}
                        onChange={(value) => setForm((current) => ({ ...current, full_description: value }))}
                      />
                    </>
                  ) : activeType === "courses" ? (
                    <>
                      <AdminInput label="Título" value={String(form.title || "")} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
                      <AdminInput label="Provedor" value={String(form.provider || "")} onChange={(value) => setForm((current) => ({ ...current, provider: value }))} />
                      <AdminInput label="URL" value={String(form.url || "")} onChange={(value) => setForm((current) => ({ ...current, url: value }))} />
                      <AdminInput label="Área" value={String(form.area_slug || "")} onChange={(value) => setForm((current) => ({ ...current, area_slug: value }))} />
                      <AdminSelect label="Nível" value={String(form.level || "iniciante")} options={["iniciante", "intermediário", "avançado"]} onChange={(value) => setForm((current) => ({ ...current, level: value }))} />
                      <AdminInput label="Carga horária" type="number" value={String(form.workload_hours || 0)} onChange={(value) => setForm((current) => ({ ...current, workload_hours: Number(value) }))} />
                      <AdminTextarea label="Descrição" value={String(form.description || "")} onChange={(value) => setForm((current) => ({ ...current, description: value }))} />
                    </>
                  ) : (
                    <>
                      <AdminInput label="Título" value={String(form.title || "")} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
                      <AdminInput label="Área" value={String(form.area_slug || "")} onChange={(value) => setForm((current) => ({ ...current, area_slug: value }))} />
                      <AdminSelect label="Nível" value={String(form.level || "iniciante")} options={["iniciante", "intermediário", "avançado"]} onChange={(value) => setForm((current) => ({ ...current, level: value }))} />
                      <AdminInput label="Duração em semanas" type="number" value={String(form.estimated_duration_weeks || 0)} onChange={(value) => setForm((current) => ({ ...current, estimated_duration_weeks: Number(value) }))} />
                      <AdminTextarea label="Descrição" value={String(form.description || "")} onChange={(value) => setForm((current) => ({ ...current, description: value }))} />
                    </>
                  )}

                  <div className="flex flex-wrap items-center gap-4 md:col-span-2">
                    {activeType === "external_jobs" ? (
                      <AdminCheckbox label="Remoto" checked={Boolean(form.remote)} onChange={(checked) => setForm((current) => ({ ...current, remote: checked }))} />
                    ) : null}
                    {activeType === "events" ? (
                      <AdminCheckbox label="Online" checked={Boolean(form.online)} onChange={(checked) => setForm((current) => ({ ...current, online: checked }))} />
                    ) : null}
                    {activeType === "courses" ? (
                      <AdminCheckbox label="Gratuito" checked={Boolean(form.is_free)} onChange={(checked) => setForm((current) => ({ ...current, is_free: checked }))} />
                    ) : null}
                    {activeType !== "courses" && activeType !== "news" && activeType !== "external_jobs" && activeType !== "events" ? (
                      <AdminCheckbox label="Pro" checked={Boolean(form.is_pro)} onChange={(checked) => setForm((current) => ({ ...current, is_pro: checked }))} />
                    ) : null}
                    <AdminCheckbox label="Publicado" checked={Boolean(form.is_published)} onChange={(checked) => setForm((current) => ({ ...current, is_published: checked }))} />
                    <button type="submit" disabled={saving} className="btn-brutal-accent rounded-full px-5 py-3 text-sm font-black disabled:opacity-60">
                      {saving ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar"}
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
                  <div className="p-5"><LoadingBlock /></div>
                ) : items.length ? (
                  items.map((item) => (
                    <div key={item.id} className="grid gap-3 border-b border-slate-100 p-4 text-sm font-bold md:grid-cols-[1fr_0.7fr_0.5fr_0.9fr] md:items-center">
                      <div>
                        <p className="font-display text-lg font-black text-slate-950">{contentTitle(item)}</p>
                        <p className="text-xs font-semibold text-slate-500">{item.slug || item.created_at ? `Criado em ${formatAdminDate(item.created_at)}` : "Sem slug"}</p>
                      </div>
                      <p className="text-slate-600">{item.provider || item.tag || item.area_slug || item.level || "Não informado"}</p>
                      <PublishBadge published={item.is_published} />
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => startEdit(item)} className="rounded-full border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black">
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => togglePublish(item)}
                          className="rounded-full border-2 border-slate-900 bg-yellow-300 px-3 py-2 text-xs font-black disabled:opacity-60"
                        >
                          {busyId === item.id ? "..." : item.is_published ? "Despublicar" : "Publicar"}
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(item)} className="rounded-full border-2 border-slate-900 bg-rose-50 px-3 py-2 text-xs font-black text-rose-800">
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6">
                    <p className="font-display text-xl font-black text-slate-950">Nenhum item encontrado</p>
                    <p className="mt-2 text-sm font-semibold text-slate-500">Crie o primeiro item usando o formulário acima.</p>
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
            <h3 className="font-display text-2xl font-black text-slate-950">Tem certeza que deseja excluir este item?</h3>
            <p className="mt-3 text-sm font-semibold text-slate-600">Esta ação vai despublicar o conteúdo. Para exclusão permanente, use ?force=true.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black">
                Cancelar
              </button>
              <button type="button" onClick={confirmDelete} className="rounded-full border-2 border-slate-900 bg-rose-100 px-4 py-2 text-sm font-black text-rose-800">
                Confirmar exclusão
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminSection>
  );
}

function AdminInput({ label, onChange, required, type = "text", value }: { label: string; onChange: (value: string) => void; required?: boolean; type?: string; value: string }) {
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

function AdminTextarea({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
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

function AdminSelect({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: string[]; value: string }) {
  return (
    <label className="text-sm font-black text-slate-950">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border-2 border-slate-900 bg-violet-50 px-4 py-3 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-200"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function AdminCheckbox({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-violet-700" />
      {label}
    </label>
  );
}

export default function Admin() {
  const { loading: authLoading, signOut, user } = useAuth();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [accessState, setAccessState] = useState<"loading" | "login" | "forbidden" | "allowed">("loading");
  const [dashboard, setDashboard] = useState<{
    counts?: {
      users: number;
      active_subscriptions: number;
      areas: number;
      courses: number;
      ai_calls_total: number;
    };
    recent_audit?: Array<{ action: string; resource_type: string; resource_slug: string; created_at: string }>;
  } | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [aiStats, setAiStats] = useState<AiStatsData>({});
  const [queueStats, setQueueStats] = useState<QueueStats>({ waiting: 0, active: 0, completed: 0, failed: 0 });
  const [posthogStats, setPosthogStats] = useState<PosthogStatsData | null>(null);
  const [churnRiskUsers, setChurnRiskUsers] = useState<ChurnRiskUser[] | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<AdminSectionId>("visao-geral");
  const [affiliateName, setAffiliateName] = useState("Nova parceira tech");
  const [affiliateCode, setAffiliateCode] = useState("PARCEIRA20");
  const [affiliateDiscount, setAffiliateDiscount] = useState(20);
  const [affiliateCommission, setAffiliateCommission] = useState(30);
  const [copiedAffiliateLink, setCopiedAffiliateLink] = useState(false);
  const [affiliates, setAffiliates] = useState<AffiliateRecord[]>([]);
  const [affiliatesLoading, setAffiliatesLoading] = useState(false);
  const [savingAffiliate, setSavingAffiliate] = useState(false);
  const [payingAffiliateId, setPayingAffiliateId] = useState<string | null>(null);
  const [editingAffiliateId, setEditingAffiliateId] = useState<string | null>(null);
  const [affiliateEditForm, setAffiliateEditForm] = useState<AffiliateEditForm | null>(null);
  const [savingAffiliateEditId, setSavingAffiliateEditId] = useState<string | null>(null);
  const [deleteAffiliateTarget, setDeleteAffiliateTarget] = useState<AffiliateRecord | null>(null);
  const [deletingAffiliateId, setDeletingAffiliateId] = useState<string | null>(null);
  const [copiedAffiliateCardId, setCopiedAffiliateCardId] = useState<string | null>(null);
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

    setAccessState("loading");
    adminFetch("/me")
      .then((json) => {
        setSession({
          username: user.email || user.id,
          displayName: json.data?.user?.email || user.email || "Admin",
          signedAt: new Date().toISOString(),
          role: json.data?.role,
        });
        setAccessState("allowed");
        setOverviewLoading(true);
        return Promise.all([
          adminFetch("/dashboard"),
          fetch(apiUrl("/api/health")).then((res) => res.json()),
          adminFetch("/ai-stats"),
          adminFetch("/queue-stats").catch(() => ({ data: { waiting: 0, active: 0, completed: 0, failed: 0 } })),
          adminFetch("/posthog-stats"),
          adminFetch("/churn-risk").catch(() => ({ data: null })),
          adminFetch("/affiliates-stats").catch(() => ({ data: [] })),
          adminFetch("/subscriptions"),
        ]);
      })
      .then(([dashboardJson, healthJson, aiJson, queueJson, posthogJson, churnRiskJson, affiliatesJson, subscriptionsJson]) => {
        setDashboard(dashboardJson.data);
        setHealth(healthJson);
        setAuditLogs(Array.isArray(dashboardJson.data?.recent_audit) ? dashboardJson.data.recent_audit : []);
        setAiStats(aiJson.data || {});
        setQueueStats(queueJson.data || { waiting: 0, active: 0, completed: 0, failed: 0 });
        setPosthogStats(posthogJson.data || null);
        setChurnRiskUsers(Array.isArray(churnRiskJson.data) ? churnRiskJson.data : null);
        setAffiliates(Array.isArray(affiliatesJson.data) ? affiliatesJson.data : []);
        setSubscriptions(Array.isArray(subscriptionsJson.data) ? subscriptionsJson.data : []);
      })
      .catch(() => {
        setSession(null);
        setDashboard(null);
        setHealth(null);
        setAuditLogs([]);
        setAiStats({});
        setQueueStats({ waiting: 0, active: 0, completed: 0, failed: 0 });
        setPosthogStats(null);
        setChurnRiskUsers(null);
        setAffiliates([]);
        setSubscriptions([]);
        setAccessState("forbidden");
      })
      .finally(() => {
        setOverviewLoading(false);
      });
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
          if (profiles.some((profile) => profile.email === current)) return current;
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

  const selectedUser = userProfiles.find((user) => user.email === selectedUserEmail) ?? userProfiles[0] ?? null;
  const selectedUserSubscription = selectedUser?.userId
    ? subscriptions.find((subscription) => subscription.user_id === selectedUser.userId)
    : undefined;
  const aiUsageReal = useMemo<AiUsage[]>(() => {
    return Object.entries(aiStats).map(([tool, stats]) => {
      const successRate = stats.calls > 0 ? Math.round((stats.success / stats.calls) * 100) : 0;
      return {
        feature: tool,
        requests: String(stats.calls),
        credits: `${successRate}% sucesso`,
        cost: formatCurrency(stats.cost),
        status: stats.cost > 50 ? "high" : successRate < 80 ? "watch" : "ok",
      };
    });
  }, [aiStats]);
  const healthItemsReal = useMemo(() => buildHealthItems(health), [health]);
  const posthogHasData = Boolean(
    posthogStats &&
      (posthogStats.totalPageviews > 0 ||
        posthogStats.uniqueUsers > 0 ||
        posthogStats.pages.length > 0 ||
        Object.values(posthogStats.events).some((value) => value > 0) ||
        posthogStats.acquisition.length > 0),
  );
  const posthogSignupConversion =
    posthogStats && posthogStats.uniqueUsers > 0 ? Math.round((posthogStats.events.user_signed_up / posthogStats.uniqueUsers) * 100) : 0;
  const posthogCheckoutConversion =
    posthogStats && posthogStats.uniqueUsers > 0 ? Math.round((posthogStats.events.checkout_started / posthogStats.uniqueUsers) * 100) : 0;
  const posthogFunnel = posthogStats
    ? [
        { label: "Visitantes únicos", value: posthogStats.uniqueUsers },
        { label: "Cadastros", value: posthogStats.events.user_signed_up },
        { label: "Checkouts iniciados", value: posthogStats.events.checkout_started },
      ]
    : [];
  const posthogAcquisitionTotal = posthogStats?.acquisition.reduce((sum, channel) => sum + channel.users, 0) || 0;
  const affiliateTotals = useMemo(
    () =>
      affiliates.reduce(
        (totals, affiliate) => ({
          revenue: totals.revenue + Number(affiliate.revenue_cents || 0),
          commissionDue: totals.commissionDue + Number(affiliate.commission_due_cents || 0),
          sales: totals.sales + Number(affiliate.sales || 0),
          clicks: totals.clicks + Number(affiliate.clicks || 0),
        }),
        { revenue: 0, commissionDue: 0, sales: 0, clicks: 0 },
      ),
    [affiliates],
  );
  const adminMetricCards = useMemo<MetricCard[]>(() => {
    if (!dashboard?.counts) return metricCards;

    return [
      { ...metricCards[0], value: String(dashboard.counts.users), detail: "Perfis cadastrados no banco", trend: "real", direction: "neutral" },
      { ...metricCards[1], value: String(dashboard.counts.active_subscriptions), detail: "Assinaturas ativas no banco", trend: "real", direction: "neutral" },
      { ...metricCards[2], value: String(dashboard.counts.areas), label: "Áreas publicadas", detail: "Itens na tabela areas" },
      { ...metricCards[3], value: String(dashboard.counts.ai_calls_total), label: "Chamadas de IA", detail: "Chamadas registradas em ai_usage_logs" },
      { ...metricCards[4], value: String(dashboard.counts.courses), label: "Cursos cadastrados", detail: "Itens na tabela courses" },
      { ...metricCards[5], value: formatCurrency(Object.values(aiStats).reduce((sum, item) => sum + item.cost, 0)), label: "Custo de IA", detail: "Custo estimado dos últimos 30 dias", trend: "real", direction: "neutral" },
    ];
  }, [dashboard, aiStats]);

  async function handleLogout() {
    await signOut();
    setSession(null);
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
      toast.error(error instanceof Error ? error.message : "Erro ao criar afiliado.");
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
          commission_paid_cents: Number(affiliate.commission_paid_cents || 0) + Number(affiliate.commission_due_cents || 0),
          commission_due_cents: 0,
        }),
      });
      toast.success("Comissão marcada como paga.");
      await refreshAffiliates();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao marcar comissão como paga.");
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
      toast.error(error instanceof Error ? error.message : "Erro ao salvar afiliado.");
    } finally {
      setSavingAffiliateEditId(null);
    }
  }

  async function confirmDeleteAffiliate() {
    if (!deleteAffiliateTarget) return;

    setDeletingAffiliateId(deleteAffiliateTarget.id);
    try {
      await adminFetch(`/content/affiliates/${deleteAffiliateTarget.id}`, { method: "DELETE" });
      toast.success("Afiliado excluído com sucesso.");
      setDeleteAffiliateTarget(null);
      if (editingAffiliateId === deleteAffiliateTarget.id) cancelAffiliateEdit();
      await refreshAffiliates();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir afiliado.");
    } finally {
      setDeletingAffiliateId(null);
    }
  }

  async function handleCopyAffiliateCardLink(affiliate: AffiliateRecord) {
    const link = buildAffiliateLink(affiliate.code, affiliate.discount_percent);
    await navigator.clipboard.writeText(link);
    setCopiedAffiliateCardId(affiliate.id);
    window.setTimeout(() => {
      setCopiedAffiliateCardId((current) => (current === affiliate.id ? null : current));
    }, 2000);
  }

  if (accessState !== "allowed" || !session) {
    return <AdminAccessGate reason={accessState === "allowed" ? "loading" : accessState} />;
  }

  return (
    <AdminShell
      activeSection={activeSection}
      session={session}
      setActiveSection={setActiveSection}
      onLogout={handleLogout}
    >
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
                Visão executiva e operacional para acompanhar crescimento, receita, uso de IA, engajamento, saúde do sistema e gargalos do funil.
              </p>
            </div>
            <div className="card-brutal rounded-3xl bg-white p-4">
              <p className="text-xs font-black uppercase text-slate-500">central admin</p>
              <p className="font-display text-xl font-black text-slate-950">Dados separados por seção</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Atualizado em {lastUpdated}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-alt py-10">
        <div className="container space-y-10">
          {activeSection === "visao-geral" ? (
            <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {adminMetricCards.map((metric) => (
              <article key={metric.label} className="card-brutal rounded-3xl bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <span className={`flex h-13 w-13 items-center justify-center rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0_#0f172a] ${metric.color}`}>
                    {metric.icon}
                  </span>
                  <TrendBadge direction={metric.direction} value={metric.trend} />
                </div>
                <p className="mt-5 text-sm font-black uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="font-display mt-1 text-4xl font-black text-slate-950">{metric.value}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">{metric.detail}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <article className="card-brutal rounded-3xl bg-white p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-violet-700">funil principal</p>
                  <h2 className="font-display text-2xl font-black text-slate-950">Do visitante ao assinante Pro</h2>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-slate-900 bg-violet-50 px-3 py-2 text-xs font-black text-violet-800">
                  <PieChart className="h-4 w-4" />
                  conversão cadastro {posthogSignupConversion}%
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {overviewLoading ? (
                  <LoadingBlock />
                ) : posthogHasData && posthogFunnel.length ? (
                  posthogFunnel.map((step, index) => {
                    const maxValue = Math.max(posthogFunnel[0]?.value || 1, 1);
                    return (
                      <div key={step.label} className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black uppercase text-violet-700">{step.label}</p>
                            <p className="font-display text-3xl font-black text-slate-950">{formatCount(step.value)}</p>
                          </div>
                          <span className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black">etapa {index + 1}</span>
                        </div>
                        <div className="mt-3 h-3 rounded-full border-2 border-slate-900 bg-white">
                          <div className="h-full rounded-full bg-violet-700" style={{ width: `${Math.max((step.value / maxValue) * 100, step.value > 0 ? 5 : 0)}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <PendingIntegration tool="Posthog" description="Configure POSTHOG_API_KEY e POSTHOG_PROJECT_ID para rastrear visitantes e sessões" />
                )}
              </div>
            </article>

            <article className="card-brutal rounded-3xl bg-violet-700 p-6 text-white">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl border-2 border-slate-950 bg-yellow-300 p-3 text-slate-950 shadow-[3px_3px_0_#0f172a]">
                  <Sparkles className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase text-violet-100">insight rápido</p>
                  <h2 className="font-display text-2xl font-black">{aiUsageReal.length ? "Uso de IA conectado." : "Sem uso de IA registrado."}</h2>
                </div>
              </div>
              <p className="mt-5 text-sm font-semibold leading-relaxed text-violet-100">
                {aiUsageReal.length
                  ? "Os custos e chamadas abaixo vêm de ai_usage_logs nos últimos 30 dias."
                  : "Quando houver chamadas registradas, este resumo passa a exibir custos e volume real por ferramenta."}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border-2 border-white/80 bg-white/10 p-4">
                  <p className="text-2xl font-black">{dashboard?.counts?.ai_calls_total ?? 0}</p>
                  <p className="text-xs font-bold text-violet-100">chamadas registradas</p>
                </div>
                <div className="rounded-2xl border-2 border-white/80 bg-white/10 p-4">
                  <p className="text-2xl font-black">{formatCurrency(Object.values(aiStats).reduce((sum, item) => sum + item.cost, 0))}</p>
                  <p className="text-xs font-bold text-violet-100">custo estimado</p>
                </div>
              </div>
            </article>

            <article className="card-brutal rounded-3xl bg-white p-6">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl border-2 border-slate-950 bg-yellow-300 p-3 text-slate-950 shadow-[3px_3px_0_#0f172a]">
                  <Mail className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase text-violet-700">sistema</p>
                  <h2 className="font-display text-2xl font-black text-slate-950">Fila de e-mails</h2>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { label: "na fila", value: queueStats.waiting },
                  { label: "processando", value: queueStats.active },
                  { label: "enviados", value: queueStats.completed },
                  { label: "com falha", value: queueStats.failed },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
                    <p className="text-2xl font-black text-slate-950">{item.value}</p>
                    <p className="text-xs font-bold text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <article className="card-brutal overflow-hidden rounded-3xl bg-white">
              <div className="border-b-2 border-slate-900 bg-pink-100 p-6">
                <h2 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
                  <Bot className="h-6 w-6" />
                  Consumo de créditos de IA
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">Custos por recurso, volume de uso e alertas de orçamento.</p>
              </div>
              <div className="divide-y-2 divide-slate-100">
                {overviewLoading ? (
                  <div className="p-5"><LoadingBlock /></div>
                ) : aiUsageReal.length ? aiUsageReal.map((item) => (
                  <div key={item.feature} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="font-display text-lg font-black text-slate-950">{item.feature}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {item.requests} chamadas • {item.credits} créditos
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <p className="font-display text-xl font-black text-slate-950">{item.cost}</p>
                      <StatusPill status={item.status} />
                    </div>
                  </div>
                )) : (
                  <div className="p-5">
                    <p className="font-display text-xl font-black text-slate-950">Nenhuma chamada de IA registrada</p>
                    <p className="mt-2 text-sm font-semibold text-slate-500">Os dados aparecem quando ai_usage_logs receber eventos.</p>
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
                  <p className="text-xs font-black uppercase text-violet-700">Assinaturas ativas</p>
                  <p className="font-display text-3xl font-black text-slate-950">{dashboard?.counts?.active_subscriptions ?? 0}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Fonte: /api/admin/dashboard</p>
                </div>
                <PendingIntegration tool="Asaas Webhook" description="Distribuição por plano e MRR requer webhook de pagamento configurado no Asaas" />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Churn", "3,1%"],
                  ["LTV médio", "R$ 312"],
                  ["ARPU", "R$ 36"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-4">
                    <p className="text-xs font-black uppercase text-violet-700">{label}</p>
                    <p className="font-display text-2xl font-black text-slate-950">{value}</p>
                  </div>
                ))}
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
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {overviewLoading ? (
                <div className="md:col-span-2 xl:col-span-4"><LoadingBlock /></div>
              ) : posthogHasData ? (
                [
                  { label: "Visitantes únicos", value: formatCount(posthogStats?.uniqueUsers || 0), detail: "Últimos 30 dias no Posthog" },
                  { label: "Cadastros", value: formatCount(posthogStats?.events.user_signed_up || 0), detail: `${posthogSignupConversion}% dos visitantes únicos` },
                  { label: "Logins", value: formatCount(posthogStats?.events.user_signed_in || 0), detail: "Evento user_signed_in" },
                  { label: "Checkouts", value: formatCount(posthogStats?.events.checkout_started || 0), detail: `${posthogCheckoutConversion}% dos visitantes únicos` },
                ].map((metric) => (
                  <div key={metric.label} className="card-brutal rounded-3xl bg-white p-5">
                    <p className="text-xs font-black uppercase text-violet-700">{metric.label}</p>
                    <p className="font-display mt-2 text-3xl font-black text-slate-950">{metric.value}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-500">{metric.detail}</p>
                  </div>
                ))
              ) : (
                <div className="md:col-span-2 xl:col-span-4">
                  <PendingIntegration tool="Posthog" description="Requer eventos de sessão do Posthog" />
                </div>
              )}
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <article className="card-brutal rounded-3xl bg-white p-6">
                <h3 className="font-display text-2xl font-black text-slate-950">Páginas que antecedem a assinatura</h3>
                <div className="mt-5">
                  {posthogHasData && posthogStats?.pages.length ? (
                    <div className="space-y-3">
                      {posthogStats.pages.slice(0, 5).map((page) => (
                        <div key={page.page} className="flex items-center justify-between gap-4 rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
                          <p className="truncate text-sm font-black text-slate-950">{page.page}</p>
                          <p className="text-sm font-black text-violet-700">{formatCount(page.views)} views</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <PendingIntegration tool="Posthog" description="Requer eventos de sessão do Posthog" />
                  )}
                </div>
              </article>
              <article className="card-brutal rounded-3xl bg-violet-700 p-6 text-white">
                <h3 className="font-display text-2xl font-black">Ação recomendada</h3>
                <p className="mt-3 text-sm font-semibold text-violet-100">
                  {posthogHasData && posthogStats?.pages[0]
                    ? `Priorize CTAs Pro em ${posthogStats.pages[0].page}, a página com maior volume nos últimos 30 dias.`
                    : "Quando o Posthog retornar sessões e eventos, esta área passa a sugerir ações com base no comportamento real."}
                </p>
                <div className="mt-5">
                  {posthogHasData ? (
                    <div className="rounded-2xl border-2 border-white/80 bg-white/10 p-4">
                      <p className="text-2xl font-black">{formatCount(posthogStats?.events.quiz_completed || 0)}</p>
                      <p className="text-xs font-bold text-violet-100">quizzes concluídos nos últimos 30 dias</p>
                    </div>
                  ) : (
                    <PendingIntegration tool="Posthog" description="Requer eventos de sessão do Posthog" />
                  )}
                </div>
              </article>
            </div>
          </AdminSection>
          ) : null}

          {activeSection === "paginas" ? (
          <AdminSection
            id="paginas"
            eyebrow="comportamento por página"
            icon={<Eye className="h-4 w-4" />}
            title="Qualidade real das páginas"
            subtitle="Compare tempo médio, profundidade de scroll, taxa de saída e páginas por sessão para descobrir onde o conteúdo prende ou perde pessoas."
          >
            <article className="card-brutal overflow-hidden rounded-3xl bg-white">
              <div className="p-6">
                {overviewLoading ? (
                  <LoadingBlock />
                ) : posthogHasData && posthogStats?.pages.length ? (
                  <div className="overflow-hidden rounded-2xl border-2 border-slate-900">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 text-xs font-black uppercase text-slate-600">
                        <tr>
                          <th className="px-4 py-3">Página</th>
                          <th className="px-4 py-3">Pageviews</th>
                          <th className="px-4 py-3">Participação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-100">
                        {posthogStats.pages.map((page) => {
                          const share = posthogStats.totalPageviews > 0 ? Math.round((page.views / posthogStats.totalPageviews) * 100) : 0;
                          return (
                            <tr key={page.page}>
                              <td className="px-4 py-3 font-black text-slate-950">{page.page}</td>
                              <td className="px-4 py-3 font-semibold text-slate-600">{formatCount(page.views)}</td>
                              <td className="px-4 py-3 font-semibold text-violet-700">{share}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <PendingIntegration tool="Posthog" description="Requer rastreamento de páginas e sessões" />
                )}
              </div>
            </article>
          </AdminSection>
          ) : null}

          {activeSection === "conteudo" ? <ContentAdminSection /> : null}

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
                        selectedUser?.email === user.email ? "bg-violet-100" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-display text-lg font-black text-slate-950">{user.name}</p>
                        <span className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black">{user.status}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-500">{user.email}</p>
                      <p className="text-xs font-black uppercase text-violet-700">{user.source} • {user.paidTotal}</p>
                    </button>
                  ))
                ) : (
                  <div className="p-6">
                    <p className="font-display text-xl font-black text-slate-950">Nenhum usuário encontrado</p>
                    <p className="mt-2 text-sm font-semibold text-slate-500">A lista será preenchida com os perfis retornados por /api/admin/users.</p>
                  </div>
                )}
              </article>
              {selectedUser ? (
              <article className="card-brutal rounded-3xl bg-white p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-display text-2xl font-black text-slate-950">{selectedUser.name}</h3>
                    <p className="text-sm font-semibold text-slate-500">{selectedUser.email}</p>
                  </div>
                  <span className="rounded-full border-2 border-slate-900 bg-yellow-300 px-3 py-1 text-xs font-black">
                    {selectedUser.paidTotal} pagos
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Cadastro", selectedUser.signedUpAt],
                    ["Assinatura", selectedUserSubscription?.status || "Sem assinatura ativa"],
                    ["Área", selectedUser.interest],
                    ["Origem", selectedUser.source],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-4">
                      <p className="text-xs font-black uppercase text-violet-700">{label}</p>
                      <p className="font-display text-lg font-black text-slate-950">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 font-display text-lg font-black text-slate-950">Funcionalidades usadas</p>
                    <div className="space-y-2">
                      <PendingIntegration tool="Posthog" description="Integração com analytics pendente (Posthog)" />
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 font-display text-lg font-black text-slate-950">Sessões recentes</p>
                    <div className="space-y-2">
                      <PendingIntegration tool="Posthog" description="Integração com analytics pendente (Posthog)" />
                    </div>
                  </div>
                </div>
              </article>
              ) : (
                <article className="card-brutal rounded-3xl bg-white p-6">
                  <p className="font-display text-2xl font-black text-slate-950">Selecione um usuário</p>
                  <p className="mt-2 text-sm font-semibold text-slate-500">Os detalhes aparecem aqui quando houver perfis retornados pelo backend.</p>
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
                  <PendingIntegration tool="Posthog" description="Requer dados de sessão históricos" />
                </div>
              </article>
              <div className="grid gap-6">
                <article className="card-brutal rounded-3xl bg-white p-6">
                  <h3 className="font-display text-2xl font-black text-slate-950">Motivos de cancelamento</h3>
                  <div className="mt-4"><PendingIntegration tool="Asaas Webhook" description="Requer pergunta de motivo no cancelamento do Asaas" /></div>
                </article>
                <article className="card-brutal rounded-3xl bg-rose-50 p-6">
                  <h3 className="font-display text-2xl font-black text-slate-950">Usuários em risco</h3>
                  <div className="mt-4">
                    {overviewLoading ? (
                      <LoadingBlock />
                    ) : churnRiskUsers === null ? (
                      <PendingIntegration tool="Supabase Admin API" description="Requer endpoint de último login via Supabase Admin API" />
                    ) : churnRiskUsers.length ? (
                      <div className="space-y-3">
                        {churnRiskUsers.map((riskUser) => (
                          <div key={`${riskUser.email}-${riskUser.days_inactive}`} className="rounded-2xl border-2 border-slate-900 bg-white p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-display text-lg font-black text-slate-950">{riskUser.name}</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">{riskUser.email}</p>
                              </div>
                              <span className="rounded-full border-2 border-slate-900 bg-rose-100 px-3 py-1 text-xs font-black text-rose-800">
                                {riskUser.days_inactive} dias
                              </span>
                            </div>
                            <p className="mt-3 text-sm font-black text-slate-700">MRR: {formatCurrency(riskUser.mrr)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border-2 border-slate-900 bg-white p-4">
                        <p className="font-display text-lg font-black text-slate-950">Nenhum assinante Pro em risco no momento</p>
                        <p className="mt-2 text-sm font-semibold text-slate-500">Todos os assinantes ativos consultados fizeram login nos últimos 14 dias.</p>
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
                <PendingIntegration tool="Google Search Console" description="Requer integração com Search Console API" />
              </div>
            </article>
          </AdminSection>
          ) : null}

          {activeSection === "financeiro" ? (
          <AdminSection
            id="financeiro"
            eyebrow="financeiro detalhado"
            icon={<DollarSign className="h-4 w-4" />}
            title="MRR, canal, risco e afiliados externos"
            subtitle="Separe assinatura própria, receita por canal, previsão de churn e comissões recebidas de parceiros como Alura e Udemy."
          >
            <div className="grid gap-6 xl:grid-cols-3">
              <article className="card-brutal rounded-3xl bg-white p-6">
                <h3 className="font-display text-2xl font-black">MRR por cohort</h3>
                <div className="mt-4"><PendingIntegration tool="Asaas Webhook" description="Requer webhook de pagamento configurado no Asaas" /></div>
              </article>
              <article className="card-brutal rounded-3xl bg-white p-6">
                <h3 className="font-display text-2xl font-black">Receita por canal</h3>
                <div className="mt-4"><PendingIntegration tool="GA4 + Asaas" description="Requer UTMs + webhook do Asaas" /></div>
              </article>
              <article className="card-brutal rounded-3xl bg-white p-6">
                <h3 className="font-display text-2xl font-black">Afiliados externos</h3>
                <div className="mt-4 rounded-2xl border-2 border-slate-900 bg-violet-50 p-4">
                  <p className="text-xs font-black uppercase text-violet-700">Comissões a pagar</p>
                  <p className="font-display mt-1 text-2xl font-black text-slate-950">{formatCents(affiliateTotals.commissionDue)}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-500">{formatCount(affiliateTotals.sales)} vendas atribuídas</p>
                </div>
              </article>
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
                <h3 className="font-display text-2xl font-black">Chamadas por ferramenta</h3>
                <div className="mt-4 space-y-3">
                  {aiUsageReal.length ? aiUsageReal.map((item) => (
                    <div key={item.feature} className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-3">
                      <div className="flex justify-between font-bold"><span>{item.feature}</span><span>{item.requests}</span></div>
                      <p className="text-xs font-semibold text-slate-500">{item.credits}</p>
                    </div>
                  )) : <p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-500">Nenhuma chamada registrada.</p>}
                </div>
              </article>
              <article className="card-brutal rounded-3xl bg-white p-6">
                <h3 className="font-display text-2xl font-black">Custo por ferramenta</h3>
                <div className="mt-4 space-y-4">
                  {aiUsageReal.length ? aiUsageReal.map((item) => (
                    <div key={item.feature}>
                      <div className="mb-1 flex justify-between text-sm font-bold"><span>{item.feature}</span><span>{item.cost}</span></div>
                      <div className="h-3 rounded-full border border-slate-900 bg-slate-100"><div className="h-full rounded-full bg-pink-600" style={{ width: "100%" }} /></div>
                    </div>
                  )) : <p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-500">Nenhum custo registrado.</p>}
                </div>
              </article>
              <article className="card-brutal rounded-3xl bg-white p-6">
                <h3 className="font-display text-2xl font-black">Custo por usuário</h3>
                <div className="mt-4">
                  <PendingIntegration tool="ai_usage_logs por usuário" description="Dados agregados por usuário disponíveis após 30 dias" />
                </div>
              </article>
            </div>
          </AdminSection>
          ) : null}

          {activeSection === "afiliados" ? (
          <article id="afiliados" className="card-brutal scroll-mt-28 overflow-hidden rounded-[2rem] bg-white">
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
                    Gere cupons rastreáveis para influenciadores, comunidades, mentorias e embaixadores. Cada link aplica desconto ao aluno e calcula comissão para o afiliado.
                  </p>
                </div>
                <div className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_#0f172a]">
                  <p className="text-xs font-black uppercase text-slate-500">status</p>
                  <p className="font-display text-xl font-black text-slate-950">Manual ativo</p>
                  <p className="text-sm font-bold text-slate-600">{affiliates.length} afiliados cadastrados</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 border-b-2 border-slate-900 bg-violet-50 p-6 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Receita atribuída", value: formatCents(affiliateTotals.revenue), icon: <DollarSign className="h-5 w-5" /> },
                { label: "Comissões a pagar", value: formatCents(affiliateTotals.commissionDue), icon: <WalletCards className="h-5 w-5" /> },
                { label: "Vendas atribuídas", value: formatCount(affiliateTotals.sales), icon: <Trophy className="h-5 w-5" /> },
                { label: "Cliques registrados", value: formatCount(affiliateTotals.clicks), icon: <MousePointerClick className="h-5 w-5" /> },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_#0f172a]">
                  <span className="inline-flex rounded-xl border-2 border-slate-900 bg-yellow-300 p-2 text-slate-950">{item.icon}</span>
                  <p className="mt-3 text-xs font-black uppercase text-violet-700">{item.label}</p>
                  <p className="font-display mt-1 text-2xl font-black text-slate-950">{item.value}</p>
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
                          setAffiliateCode(slugifyAffiliateCode(event.target.value));
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
                        onChange={(event) => setAffiliateCommission(Number(event.target.value))}
                        className="mt-4 w-full accent-violet-700"
                      />
                    </label>
                  </div>

                  <div className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
                    <p className="flex items-center gap-2 text-xs font-black uppercase text-violet-700">
                      <LinkIcon className="h-4 w-4" />
                      link gerado
                    </p>
                    <p className="mt-2 break-all font-mono text-sm font-black text-slate-950">{generatedAffiliateLink}</p>
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
                        <div key={affiliate.id} className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-display text-lg font-black text-slate-950">{affiliate.name}</p>
                              <p className="mt-1 font-mono text-xs font-black text-violet-700">{affiliate.code}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {affiliate.discount_percent}% desconto • {affiliate.commission_percent}% comissão • {affiliate.status}
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
                                onClick={() => void handleCopyAffiliateCardLink(affiliate)}
                                className="rounded-full border-2 border-slate-900 bg-yellow-100 px-3 py-2 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a]"
                              >
                                {copiedAffiliateCardId === affiliate.id ? "Link copiado!" : "Copiar link"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleMarkAffiliatePaid(affiliate)}
                                disabled={affiliate.commission_due_cents <= 0 || payingAffiliateId === affiliate.id}
                                className="rounded-full border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black shadow-[2px_2px_0_#0f172a] disabled:opacity-50"
                              >
                                {payingAffiliateId === affiliate.id ? "Pagando..." : "Marcar comissão paga"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteAffiliateTarget(affiliate)}
                                className="rounded-full border-2 border-slate-900 bg-rose-100 px-3 py-2 text-xs font-black text-rose-800 shadow-[2px_2px_0_#0f172a]"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-2 text-xs font-black sm:grid-cols-4">
                            <span className="rounded-xl bg-white px-3 py-2">Cliques: {formatCount(affiliate.clicks)}</span>
                            <span className="rounded-xl bg-white px-3 py-2">Vendas: {formatCount(affiliate.sales)}</span>
                            <span className="rounded-xl bg-white px-3 py-2">Receita: {formatCents(affiliate.revenue_cents)}</span>
                            <span className="rounded-xl bg-white px-3 py-2">A pagar: {formatCents(affiliate.commission_due_cents)}</span>
                          </div>
                          {editingAffiliateId === affiliate.id && affiliateEditForm ? (
                            <div className="mt-4 rounded-2xl border-2 border-slate-900 bg-white p-4">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <label className="text-xs font-black uppercase text-slate-600">
                                  Nome
                                  <input
                                    value={affiliateEditForm.name}
                                    onChange={(event) => setAffiliateEditForm({ ...affiliateEditForm, name: event.target.value })}
                                    className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3 text-sm font-bold normal-case text-slate-950"
                                  />
                                </label>
                                <label className="text-xs font-black uppercase text-slate-600">
                                  Email
                                  <input
                                    value={affiliateEditForm.email}
                                    onChange={(event) => setAffiliateEditForm({ ...affiliateEditForm, email: event.target.value })}
                                    className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3 text-sm font-bold normal-case text-slate-950"
                                    type="email"
                                  />
                                </label>
                                <label className="text-xs font-black uppercase text-slate-600">
                                  Desconto (%)
                                  <input
                                    value={affiliateEditForm.discount_percent}
                                    onChange={(event) => setAffiliateEditForm({ ...affiliateEditForm, discount_percent: Number(event.target.value) })}
                                    className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3 text-sm font-bold normal-case text-slate-950"
                                    min={1}
                                    max={100}
                                    type="number"
                                  />
                                </label>
                                <label className="text-xs font-black uppercase text-slate-600">
                                  Comissão (%)
                                  <input
                                    value={affiliateEditForm.commission_percent}
                                    onChange={(event) => setAffiliateEditForm({ ...affiliateEditForm, commission_percent: Number(event.target.value) })}
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
                                    onChange={(event) => setAffiliateEditForm({ ...affiliateEditForm, status: event.target.value as AffiliateEditForm["status"] })}
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
                                    onChange={(event) => setAffiliateEditForm({ ...affiliateEditForm, notes: event.target.value })}
                                    className="mt-1 min-h-24 w-full rounded-xl border-2 border-slate-300 p-3 text-sm font-bold normal-case text-slate-950"
                                  />
                                </label>
                              </div>
                              <div className="mt-4 flex justify-end gap-3">
                                <button type="button" onClick={cancelAffiliateEdit} className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black">
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleSaveAffiliateEdit(affiliate)}
                                  disabled={savingAffiliateEditId === affiliate.id}
                                  className="rounded-full border-2 border-slate-900 bg-yellow-300 px-4 py-2 text-sm font-black shadow-[2px_2px_0_#0f172a] disabled:opacity-60"
                                >
                                  {savingAffiliateEditId === affiliate.id ? "Salvando..." : "Salvar"}
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
                      <p className="font-display text-lg font-black text-slate-950">Nenhum afiliado cadastrado ainda</p>
                      <p className="mt-2 text-sm font-semibold text-slate-500">Crie o primeiro afiliado pelo formulário ao lado.</p>
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
                  <div className="sm:col-span-2"><LoadingBlock /></div>
                ) : healthItemsReal.length ? healthItemsReal.map((item) => (
                  <div key={item.service} className={`rounded-2xl border-2 border-slate-900 p-4 ${item.tone}`}>
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <p className="font-display text-lg font-black">{item.service}</p>
                    </div>
                    <p className="mt-3 text-sm font-black uppercase">{item.status}</p>
                    <p className="mt-1 text-sm font-semibold opacity-80">{item.detail}</p>
                  </div>
                )) : (
                  <div className="sm:col-span-2"><PendingIntegration tool="/api/health" description="Health check indisponível no momento" /></div>
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
                  <div className="p-5"><LoadingBlock /></div>
                ) : posthogHasData && posthogStats?.pages.length ? (
                  <div className="divide-y-2 divide-slate-100">
                    {posthogStats.pages.slice(0, 5).map((page) => (
                      <div key={page.page} className="flex items-center justify-between gap-4 p-4">
                        <p className="truncate text-sm font-black text-slate-950">{page.page}</p>
                        <p className="font-display text-lg font-black text-violet-700">{formatCount(page.views)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5"><PendingIntegration tool="Posthog" description="Requer rastreamento de páginas e sessões" /></div>
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
                    const percent = posthogAcquisitionTotal > 0 ? Math.round((channel.users / posthogAcquisitionTotal) * 100) : 0;
                    return (
                      <div key={channel.channel} className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-display text-lg font-black text-slate-950">{channel.channel === "None" ? "Direto" : channel.channel}</p>
                          <p className="text-sm font-black text-violet-700">{formatCount(channel.users)} usuários</p>
                        </div>
                        <div className="mt-3 h-3 rounded-full border-2 border-slate-900 bg-white">
                          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <PendingIntegration tool="Posthog" description="Requer eventos com origem/referrer para rastrear aquisição" />
                )}
              </div>
            </article>

            <article className="card-brutal rounded-3xl bg-white p-6">
              <h2 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
                <Zap className="h-6 w-6" />
                Eventos recentes
              </h2>
              <div className="mt-5 space-y-4">
                {overviewLoading ? <LoadingBlock /> : auditLogs.length ? auditLogs.map((event) => (
                  <div key={`${event.created_at}-${event.resource_type}-${event.resource_slug || ""}`} className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-xs font-black uppercase text-violet-700">
                        <FileText className="h-4 w-4" />
                        {formatRelativeTime(event.created_at)}
                      </span>
                      <Clock3 className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="mt-2 font-display text-lg font-black text-slate-950">{auditTitle(event.action)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{event.resource_type} {event.resource_slug || ""}</p>
                  </div>
                )) : (
                  <p className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4 text-sm font-black text-slate-600">Nenhuma ação registrada ainda.</p>
                )}
              </div>
            </article>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <article className="card-brutal rounded-3xl bg-yellow-300 p-6">
              <h2 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
                <Search className="h-6 w-6" />
                O que monitorar
              </h2>
              <ul className="mt-5 space-y-3 text-sm font-bold text-slate-800">
                <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0" /> Crescimento diário de usuários ativos.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0" /> Custo por chamada de IA e limite mensal.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0" /> Conversão de recursos Pro para assinatura.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0" /> Erros em login, pagamento e geração com IA.</li>
              </ul>
            </article>

            <article className="card-brutal rounded-3xl bg-white p-6 xl:col-span-2">
              <h2 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
                <Mail className="h-6 w-6" />
                Próximas integrações recomendadas
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  "Endpoint admin no backend para contar usuários e assinantes reais.",
                  "Webhook do provedor de pagamento para MRR, churn e inadimplência.",
                  "Tabela de affiliates, coupons e referrals para rastrear links, descontos e comissão.",
                  "Tabela de usage_logs para registrar chamadas, tokens e custo de IA.",
                  "Monitor de erros por rota, dispositivo, navegador e usuário afetado.",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-4 text-sm font-bold text-slate-700">
                    {item}
                  </div>
                ))}
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
            <h3 className="font-display text-2xl font-black text-slate-950">Tem certeza que deseja excluir o afiliado {deleteAffiliateTarget.name}?</h3>
            <p className="mt-3 text-sm font-semibold text-slate-600">Esta ação não pode ser desfeita.</p>
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
                {deletingAffiliateId === deleteAffiliateTarget.id ? "Excluindo..." : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
