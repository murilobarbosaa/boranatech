import {
  Fragment,
  Suspense,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  BrainCircuit,
  Bug,
  Clock3,
  Compass,
  Copy,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  Globe2,
  Handshake,
  HelpCircle,
  LayoutDashboard,
  Link as LinkIcon,
  LockKeyhole,
  LogOut,
  MousePointerClick,
  PlusCircle,
  RefreshCcw,
  Send,
  ShieldCheck,
  SquareKanban,
  Star,
  Tag,
  TicketPercent,
  TrendingDown,
  Trophy,
  UserRound,
  Users,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { CancellationReasonsDashboard } from "@/components/admin/CancellationReasonsDashboard";
import { UsageRetentionDashboard } from "@/components/admin/UsageRetentionDashboard";
import { LinkedinLastroDashboard } from "@/components/admin/LinkedinLastroDashboard";
import { ContactListsManager } from "@/components/admin/ContactListsManager";
import { ConversionDashboard } from "@/components/admin/ConversionDashboard";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { limparChavesDeSecao } from "@/components/admin/tasks/taskViewState";
import { TasksErrorBoundary } from "@/components/admin/tasks/TasksErrorBoundary";
import { TasksPanelSkeleton } from "@/components/admin/tasks/TasksPanelSkeleton";

// Carregado sob demanda: o modulo de Tarefas traz o dnd-kit e o remark-gfm, e um
// import estatico coloca os dois no chunk do Admin, que TODA aba do painel baixa.
// Medido: o chunk saiu de 700,98 kB para 860,43 kB (gzip 170,18 -> 216,50).
// Ninguem fora deste modulo importa dnd-kit, entao a fronteira e limpa.
const TasksDashboard = lazyWithRetry(
  () => import("@/components/admin/tasks/TasksDashboard"),
);
import { NotificationsManager } from "@/components/admin/NotificationsManager";
import { ExpensesManager } from "@/components/admin/ExpensesManager";
import { BntSelect } from "@/components/shared/BntSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FinanceDashboard } from "@/components/admin/FinanceDashboard";
import { FiscalInvoicesDashboard } from "@/components/admin/FiscalInvoicesDashboard";
import { BlocoBoundary } from "@/components/admin/BlocoBoundary";
import { HealthBand } from "@/components/admin/overview/HealthBand";
import { PaidFunnel } from "@/components/admin/overview/PaidFunnel";
import { SignupChart } from "@/components/admin/overview/SignupChart";
import { SubscriptionChart } from "@/components/admin/overview/SubscriptionChart";
import {
  OverviewPeriod,
  parseOverviewWindow,
  type OverviewWindow,
} from "@/components/admin/overview/OverviewPeriod";
import { rotuloDeVariacao } from "@/components/admin/overview/overviewChange";
import { detalheDeRisco } from "@/components/admin/overview/riskCopy";
import { AttentionPanel } from "@/components/admin/overview/AttentionPanel";
import { WindowBadge } from "@/components/admin/overview/WindowBadge";
import { DeltaBadge } from "@/components/admin/overview/DeltaBadge";
import { FunnelDigest } from "@/components/admin/overview/FunnelDigest";
import { MetricSparkline } from "@/components/admin/overview/MetricSparkline";
import {
  CostVsRevenueChart,
  ProConversionsChart,
  serieDe,
} from "@/components/admin/overview/SeriesCharts";
import { ToolUsagePanel } from "@/components/admin/overview/ToolUsagePanel";
import { PagesDashboard } from "@/components/admin/PagesDashboard";
import { UsersDashboard } from "@/components/admin/users/UsersDashboard";
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
import { adminFetch, AdminApiError } from "@/lib/adminApi";
import { PLAN_ORDER, PLAN_PRICING, type PlanId } from "@shared/planPricing";
import {
  applyNamePlaceholder,
  applyUnsubscribeUrl,
  renderCampaignBodyHtml,
} from "@shared/emailCampaignBody";
import { readAdminClaim } from "@/lib/adminClaim";
import { supabase } from "@/lib/supabase";

type AdminSession = {
  username: string;
  displayName: string;
  signedAt: string;
  role?: string;
};

type MetricCard = {
  /**
   * IDENTIDADE ESTAVEL do card, independente da copy.
   *
   * A hierarquia 3+4 casava por RÓTULO VISÍVEL, e a rodada 8 renomeou "Acesso
   * Pro" para "Assinantes Pro" sem tocar na lista: o card caiu para a linha
   * secundária e a tela virou 2+5, sem nada acusar. Renomear copy é operação
   * corriqueira; reordenar a tela não pode ser efeito colateral dela.
   */
  key: string;
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  color: string;
  /** Rótulo de variação. `null` = a série não sustenta comparação. */
  change?: { texto: string; tom: "alta" | "baixa" | "neutro" } | null;
  /** Aba que aprofunda. Sem isto o card não é clicável. */
  destino?: AdminSectionId;
  /**
   * Mini-gráfico da série do card. NÃO entra em métrica cumulativa
   * ("Usuários totais" só sobe por construção, e a diagonal não informa nada).
   */
  sparkline?: ReactNode;
  /**
   * Uma linha a mais, para o que é derivado do próprio card (ARPU, custo por
   * assinante). Card novo para cada derivada encheria a tela sem responder
   * pergunta nova.
   */
  secundaria?: string | null;
};

/**
 * Nome de exibicao das ferramentas de IA.
 *
 * A aba mostrava o SLUG tecnico ("resume-analyzer", "github-perfil"), que e o
 * identificador que `logAiUsage` grava em `ai_usage_logs.tool`. O slug e a
 * chave certa no banco e o rotulo errado numa tela de gestao.
 *
 * O CONTRATO E O FALLBACK, nao a completude. Este mapa NAO se afirma exaustivo
 * e nao deve: uma lista escrita a mao sobre um conjunto que cresce e a classe de
 * defeito que este projeto cata por regra, e ela falha PASSANDO, ficando
 * silenciosamente desatualizada no primeiro slug novo. Quem garante a correcao
 * e `rotuloDaFerramenta`, que devolve o slug cru para o que nao esta aqui.
 *
 * CENSO DE 2026-08-22: nesta data os 13 slugs vivos nos call sites de
 * `logAiUsage` em `server/` estavam TODOS cobertos, mais dois historicos
 * (`study-plan-build` e `interview`), que a docstring de
 * `server/lib/aiUsageStats.ts` registra como medidos em 14/08 e ainda caem na
 * janela de 30 dias da aba. A data vai junto de proposito: isto e uma MEDICAO,
 * nao uma promessa, e sem ela viraria a afirmacao de completude que o paragrafo
 * acima proibe.
 *
 * O UNICO ponto que nem um censo alcanca: `server/routes/github.ts` monta o
 * slug como `` `github-${mode}` ``, entao um modo novo cria um slug novo em
 * tempo de execucao, sem passar por lugar nenhum que se possa varrer. E por
 * isso, tambem, que o fallback e o contrato.
 */
const ROTULO_DA_FERRAMENTA: Record<string, string> = {
  /* TODO(Ana) */ "resume-analyzer": "Analisador de Currículo",
  /* TODO(Ana) */ "resume-builder": "Criador de Currículo",
  /* TODO(Ana) */ "resume-render": "Renderização de Currículo (PDF)",
  /* TODO(Ana) */ "linkedin-analyzer": "Analisador de LinkedIn",
  /* TODO(Ana) */ "github-perfil": "Analisador de GitHub (perfil)",
  /* TODO(Ana) */ "github-repo": "Analisador de GitHub (repositório)",
  /* TODO(Ana) */ "roadmap-generator": "Gerador de Roadmap",
  /* TODO(Ana) */ "roadmap-intake-chat": "Chat inicial do Roadmap",
  /* TODO(Ana) */ "career-plan": "Plano de Carreira",
  /* TODO(Ana) */ "agent-chat": "Chat do Agente",
  /* TODO(Ana) */ "interview-session": "Sessão de Entrevista",
  /* TODO(Ana) */ "interview-turn": "Turno de Entrevista",
  /* TODO(Ana) */ "career-plan-chat": "Chat do Plano de Carreira",
  /* TODO(Ana) */ "interview-tts": "Voz da Entrevista",
  /* TODO(Ana) */ "project-validation": "Validação de Projeto",
  // HISTORICOS: nao aparecem mais na fonte, mas ha linhas de 14/08 em
  // `ai_usage_logs` que ainda caem na janela de 30 dias da aba.
  /* TODO(Ana) */ "study-plan-build": "Plano de Estudos (construção)",
  /* TODO(Ana) */ interview: "Entrevista (formato antigo)",
};

// Slug sem traducao aparece CRU, visivel e feio de proposito: feio a mostra
// pede a traducao que falta, enquanto um rotulo inventado ("Ferramenta
// desconhecida") ou uma linha omitida esconderiam uma ferramenta que esta
// gastando dinheiro de verdade.
function rotuloDaFerramenta(slug: string): string {
  return ROTULO_DA_FERRAMENTA[slug] ?? slug;
}

type AiUsage = {
  feature: string;
  requests: string;
  credits: string;
  cost: string;
  // Custo numerico bruto (nao formatado), para a barra de proporcao.
  costValue: number;
  status: "ok" | "watch" | "high";
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

// Cupom de marketing (tabela coupons, CRUD generico /content/coupons). SEM
// comissao/atribuicao de afiliado; times_redeemed e contador do webhook,
// somente leitura aqui.
type CouponRecord = {
  id: string;
  code: string;
  description?: string | null;
  discount_percent: number;
  status: "active" | "paused" | "inactive";
  valid_from: string | null;
  valid_until: string | null;
  max_redemptions: number | null;
  times_redeemed: number;
  applicable_plans: string[] | null;
};

type CouponEditForm = {
  description: string;
  discount_percent: number;
  status: "active" | "paused" | "inactive";
  // yyyy-mm-dd do input date; "" = sem expiracao.
  valid_until: string;
  // Texto do input numerico; "" = ilimitado.
  max_redemptions: string;
  applicable_plans: PlanId[];
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
  | "financeiro"
  | "ia"
  | "afiliados"
  | "emails"
  | "notificacoes"
  | "beta"
  | "vagas"
  | "tarefas";

/** O que GET /admin/overview devolve. Ver o cabeçalho da rota para as fontes. */
type OverviewChange =
  | {
      disponivel: true;
      atual: number;
      anterior: number;
      delta: number;
      percent: number | null;
    }
  | { disponivel: false; atual: number; motivo: string };

type OverviewData = {
  window: string;
  windowStartIso: string | null;
  windowEndIso: string;
  /** Dias civis da janela e o rótulo pronto. Ver server/lib/overviewWindow.ts. */
  windowFirstDay: string | null;
  windowLastDay: string;
  windowLabel: string;
  previousLabel: string | null;
  /** Fuso que governa a Visão inteira, declarado pelo servidor. */
  tz: string;
  cards: {
    /** Total SEM janela, da mesma fonte do contador público da home. */
    usuariosTotais: { value: number | null };
    novosUsuarios: {
      value: number;
      historicoDesde: string | null;
      change: OverviewChange;
    };
    acessoPro: {
      bySubscription: number;
      byInfluencer: number;
      /** Interseção dos dois ramos. `bySubscription` e `byInfluencer` a INCLUEM. */
      both: number;
      /** União deduplicada. É este o headline: somar as parcelas conta `both` duas vezes. */
      total: number;
    };
    mrr: {
      value: number;
      activeCount: number;
      trialingCount: number;
      arpuCents: number | null;
    };
    receita: {
      value: number;
      reembolsosCents: number;
      taxasCents: number;
      liquidaCents: number;
      historicoDesde: string | null;
      change: OverviewChange;
    };
    receitaEmRisco: {
      /** Soma das duas famílias abaixo. É este o headline do card. */
      count: number;
      mrrCents: number;
      /**
       * Breakdown D21. OPCIONAIS de propósito: na janela de deploy o backend
       * antigo ainda responde sem eles, e o card precisa cair na frase genérica
       * em vez de imprimir "undefined saindo".
       */
      saindo?: { count: number; mrrCents: number };
      emAtraso?: { count: number; mrrCents: number };
      percentOfMrr: number | null;
    };
    custoIa: {
      /** O valor é em DÓLAR: MODEL_PRICING é cotada em US$/1M tokens. */
      valueUsd: number;
      /** Alias do rename, mesmo número. Remover a partir de 2026-09-15. */
      valueBrl: number;
      chamadasSemCustoMedido: number;
      /** Null quando AI_COST_USD_BRL_RATE não está definida. Ausência, não 0. */
      valorEmBrl: number | null;
      cotacaoUsdBrl: number | null;
    };
  };
};

/** O que GET /admin/overview-series devolve. Ver server/lib/overviewSeries.ts. */
type SeriesData = {
  series: Array<{
    chave: string;
    rotulo: string;
    tipo: string;
    direcao: "up_bom" | "up_ruim";
    pontos: Array<{ date: string; value: number | null; partial: boolean }>;
    total: number | null;
  }>;
  funil: {
    passos: Array<{
      chave: string;
      rotulo: string;
      valor: number;
      taxaSobreAnterior: number | null;
    }>;
    destaque: string | null;
    anterior: { cadastro: number; pro: number; proComUso: number } | null;
    motivoSemDelta: string;
  };
  ferramentas: Array<{
    tool: string;
    chamadas: number;
    custoUsd: number;
    semCustoMedido: number;
  }>;
  windowLabel: string;
  tz: string;
};

/** O que GET /admin/attention devolve. Ver server/lib/atencaoNecessaria.ts. */
type AttentionData = {
  itens: Array<{
    tipo: string;
    chave: string;
    severidade: "critico" | "atencao";
    titulo: string;
    detalhe: string;
    valorCents?: number;
    url: string;
  }>;
  fontesIndisponiveis: string[];
  janelaDias: number;
};

// De /dashboard sobrou o registro de auditoria. Os contadores foram podados na
// fatia 9 junto com os blocos que os exibiam; quem conta gente e dinheiro hoje e
// /overview.
type DashboardData = {
  recent_audit?: AuditLog[];
};

type AuditLog = {
  action: "create" | "update" | "delete" | "publish" | "unpublish";
  resource_type: string;
  resource_slug?: string | null;
  created_at: string;
};

// O que GET /admin/ai-stats devolve: `agregarUsoDeIa` cru. Ver
// server/lib/aiUsageStats.ts, que declara a unidade de `cost` como DOLAR.
type AiStatsData = Record<
  string,
  {
    calls: number;
    success: number;
    /** Soma de `cost_estimate`, em DÓLAR (MODEL_PRICING é cotada em US$/1M). */
    cost: number;
    /**
     * OPCIONAL de propósito: a Vercel sobe antes do Railway, e na janela de
     * deploy o bundle novo ainda pode receber a resposta do backend anterior a
     * este campo. Ausente é ausente, não zero: zero afirmaria "tudo medido".
     */
    semCustoMedido?: number;
  }
>;

/**
 * O que GET /admin/ai-cost-per-user devolve.
 *
 * Substituiu um `PendingIntegration` que prometia "Dados agregados por usuario
 * disponiveis apos 30 dias" enquanto `ai_usage_logs` ja gravava `user_id` havia
 * mais de cem dias. Placeholder que promete data para de ser lido como
 * pendencia, e este ficou no ar tempo suficiente para virar paisagem.
 *
 * TODOS os campos de ausencia sao NOMEADOS: `perfilAusente` separa "sem perfil"
 * de "sem e-mail cadastrado", `semUsuario` e null quando nao ha balde (e nao um
 * objeto zerado, que afirmaria um balde vazio existente), e `maisUsuarios` diz
 * quantos ficaram fora do topo para a tabela nunca parecer o total.
 */
type AiCostPerUserRow = {
  userId: string;
  email: string | null;
  nome: string | null;
  perfilAusente: boolean;
  calls: number;
  success: number;
  /** Em DOLAR, como o resto da aba. */
  costUsd: number;
  semCustoMedido: number;
};

type AiCostPerUserData = {
  top: AiCostPerUserRow[];
  semUsuario: {
    calls: number;
    success: number;
    costUsd: number;
    semCustoMedido: number;
  } | null;
  maisUsuarios: number;
  usuariosDistintos: number;
};

/**
 * Traduz o que a REDE devolveu para o tipo acima, sem confiar em nada.
 *
 * O tipo e uma promessa do compilador sobre o codigo, nunca sobre a resposta.
 * Na janela de deploy (Vercel primeiro, Railway depois) o bundle novo conversa
 * com o backend antigo, que nao tem esta rota nem estes campos, e um
 * `payload.top.length` direto derruba a aba inteira com TypeError. Campo que
 * falta vira o estado vazio equivalente, que a tela ja sabe exibir.
 */
function numeroOuZero(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function normalizarCustoPorUsuario(bruto: unknown): AiCostPerUserData {
  const obj = (bruto ?? {}) as Partial<AiCostPerUserData>;
  const numero = numeroOuZero;
  return {
    top: Array.isArray(obj.top) ? obj.top : [],
    semUsuario:
      obj.semUsuario && typeof obj.semUsuario === "object"
        ? {
            calls: numero(obj.semUsuario.calls),
            success: numero(obj.semUsuario.success),
            costUsd: numero(obj.semUsuario.costUsd),
            semCustoMedido: numero(obj.semUsuario.semCustoMedido),
          }
        : null,
    maisUsuarios: numero(obj.maisUsuarios),
    usuariosDistintos: numero(obj.usuariosDistintos),
  };
}

/**
 * Linha de cadastros do card "Usuarios totais".
 *
 * Ausencia e NOMEADA: `formatCount` devolve "0" para `null` (`value || 0`), e
 * "0 cadastros" e indistinguivel de "nenhum cadastro no periodo", que e um fato
 * diferente. A guarda de tipo e explicita por isso, e nao por paranoia com o
 * contrato: o campo e `number` no tipo, mas quem responde e a rede.
 *
 * A VARIACAO entra como TEXTO, nunca como o badge `change` do card. O badge
 * deste card seria lido como variacao do TOTAL de usuarios, que e falso: o total
 * nao tem periodo anterior, ele so acumula. Aqui a variacao esta claramente
 * presa a frase dos cadastros.
 *
 * E ela so entra quando a comparacao EXISTE. A frase de motivo ("Dados comecam
 * no meio do periodo, sem comparacao") existe para o caso em que o Δ ausente
 * deixaria um vazio com cara de defeito; aqui nao ha vazio nenhum, a linha ja
 * diz quantos cadastros houve, e o parentese explicando uma comparacao que o
 * card nunca prometeu seria ruido.
 */
function secundariaDeCadastros(
  novosUsuarios: OverviewData["cards"]["novosUsuarios"] | undefined,
  janelaLabel: string,
): string {
  const valor = novosUsuarios?.value;
  // TODO(Ana)
  if (typeof valor !== "number") return "Cadastros indisponíveis no período";
  // TODO(Ana)
  const base = `${formatCount(valor)} cadastros ${janelaLabel}`;
  const variacao = novosUsuarios?.change?.disponivel
    ? rotuloDeVariacao(novosUsuarios.change, novosUsuarios.historicoDesde)
    : null;
  return variacao ? `${base} (${variacao.texto})` : base;
}

/**
 * O que GET /admin/online-now devolve (server/lib/posthog.ts).
 *
 * Union DISCRIMINADO, e nunca um numero solto: "0 online" e indistinguivel de
 * "PostHog fora do ar", e a segunda leitura e a que muda o que alguem faz.
 */
type OnlineNowData =
  | { state: "not_configured"; missing?: string[] }
  | { state: "error"; reason?: string; httpStatus?: number }
  | { state: "ok"; atividade?: { online: number; hojePessoas: number } };

/** De quanto em quanto tempo o card de presenca se refaz. */
const ONLINE_NOW_REFRESH_MS = 60_000;

/**
 * Valor e linha secundaria do card "Atividade agora", por RESOLVER.
 *
 * Nunca por acesso direto ao estado: um `state` novo no servidor que o bundle
 * ainda nao conheca cai no ramo neutro ("indisponivel") em vez de derrubar a
 * pagina, que e a regra do projeto. E o fallback de ausencia e SEMPRE textual:
 * zero aqui seria um numero plausivel sobre uma medicao que nao aconteceu.
 */
function atividadeDoCard(dado: OnlineNowData | null): {
  value: string;
  secundaria: string;
} {
  // TODO(Ana)
  if (!dado) return { value: "...", secundaria: "Consultando o PostHog" };
  if (dado.state === "ok" && typeof dado.atividade?.online === "number") {
    return {
      value: formatCount(dado.atividade.online),
      // TODO(Ana)
      secundaria: `${formatCount(dado.atividade.hojePessoas)} pessoas ativas hoje`,
    };
  }
  return {
    // TODO(Ana)
    value: "indisponível",
    secundaria:
      dado.state === "not_configured"
        ? "PostHog não configurado"
        : "PostHog indisponível",
  };
}

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

// Contexto que ACOMPANHA o churn e nao entra nele. Opcional em ambos os ramos
// porque na janela de deploy o frontend novo fala com o backend antigo, que nao
// manda estes campos.
type ChurnContext = {
  scheduledNotCounted?: number;
  revertedInWindow?: number;
  orphanCancellations?: number;
};

type ChurnSnapshot =
  | ({
      status: "insufficient_data";
      reason: string;
      windowDays: number;
      canceledInWindow?: number;
      activeAtStart?: number;
    } & ChurnContext)
  | ({
      status: "ok";
      windowDays: number;
      churnRate: number;
      canceledInWindow: number;
      activeAtStart: number;
      ltvCents: number | null;
    } & ChurnContext);

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

// Cada card declara seu proprio label junto do proprio valor. O label da base e
// o MESMO exibido pelo card carregado: `adminMetricCards` preenche valores
// reais, nunca troca o label por outro nao relacionado. Isso importa porque esta
// base e o que a tela mostra quando o payload chega sem `cards`, e um label de
// fallback divergente do carregado seria um card fantasma, com outro assunto.
//
// A `key` e o que a hierarquia 3+4 usa. Ela e estavel; o `label` e copy.
export const metricCards: MetricCard[] = [
  {
    key: "usuarios_totais",
    // TOTAL, SEM JANELA, e a MESMA fonte do contador público da home
    // (server/lib/profilesCount.ts). Existe porque a única forma de ver o total
    // era mudar o seletor para "Tudo", o que muda os outros cinco cards junto —
    // e a ausência dele foi lida como divergência contra a home (4.790 vs 5.456)
    // quando os dois números estavam certos e respondiam perguntas diferentes.
    label: "Usuários totais",
    value: "0",
    detail: "Desde o início, sem recorte de período",
    icon: <Users className="h-6 w-6" />,
    color: "bg-violet-800 text-white",
  },
  {
    // "Novos usuários" SAIU daqui, e o motivo não foi espaço: na janela "Tudo"
    // ele repetia o card de total, e cadastro é a derivada do total, não uma
    // segunda pergunta. A série foi para dentro de "Usuários totais" (slot 0), e
    // este slot passou a responder o que a Visão não respondia: quem está no
    // site AGORA.
    key: "atividade_agora",
    label: "Atividade agora",
    value: "0",
    // A RESSALVA VIVE NO CARD, não numa nota de rodapé: presença medida por
    // analytics é sempre um piso, e quem lê precisa saber disso no mesmo olhar.
    // TODO(Ana)
    detail:
      "Estado atual, ignora o seletor. PostHog nos últimos 5 minutos, sem quem bloqueia rastreio.",
    icon: <Activity className="h-6 w-6" />,
    color: "bg-sky-600 text-white",
  },
  {
    key: "assinantes_pro",
    // O rotulo diz o que o numero CONTA: assinantes pagantes. O acesso Pro tem
    // um segundo ramo (concessao de influencer) que nao entra neste valor e
    // aparece no detalhe, logo abaixo. Somar os dois pioraria a metrica de
    // receita; esconder o segundo foi o que causou a confusao na aba Usuarios.
    label: "Assinantes Pro",
    value: "0",
    detail: "Quem tem assinatura paga",
    icon: <CreditCard className="h-6 w-6" />,
    color: "bg-[#ffb800] text-slate-950",
  },
  {
    key: "mrr",
    label: "Receita recorrente",
    value: "0",
    detail: "MRR das assinaturas ativas",
    icon: <DollarSign className="h-6 w-6" />,
    color: "bg-emerald-600 text-white",
  },
  {
    // ESTE SLOT E "Receita no período", nao "Chamadas de IA".
    //
    // O `useMemo` sempre sobrescreveu o label deste slot, e a base ficou
    // descrevendo outra metrica (registros em `ai_usage_logs`). Enquanto isso
    // durou, o payload sem `cards` desenhava um card fantasma, com assunto e
    // icone que nao existem na tela carregada.
    key: "receita_periodo",
    label: "Receita no período",
    value: "0",
    // TODO(Ana)
    detail: "Cobranças na janela selecionada",
    icon: <DollarSign className="h-6 w-6" />,
    color: "bg-pink-600 text-white",
  },
  {
    key: "receita_risco",
    // "Cursos cadastrados" saiu daqui: inventário não sustenta decisão, e era o
    // único número da página que ninguém usava para agir. Este é o oposto: muda
    // sozinho, tem data marcada e ainda dá para agir.
    label: "Receita em risco",
    value: "0",
    detail: "Saídas agendadas e pagamentos em atraso",
    icon: <TrendingDown className="h-6 w-6" />,
    color: "bg-rose-600 text-white",
  },
  {
    key: "custo_ia",
    label: "Custo de IA",
    value: "0",
    detail: "Custo estimado dos últimos 30 dias",
    icon: <Zap className="h-6 w-6" />,
    color: "bg-orange-500 text-white",
  },
];

// HIERARQUIA 3 + 4 (D15). Os sete cards existem desde a Fase 1; o que muda é o
// PESO: os três que respondem "como o negócio está" ficam grandes na primeira
// linha, e os quatro de detalhe ficam compactos na segunda. Sete cards do mesmo
// tamanho é uma lista, não uma hierarquia, e quem lê não sabe por onde começar.
//
// A separação é por CHAVE, não por índice nem por rótulo. Índice quebraria com
// um card novo inserido no meio do array; rótulo quebrou de verdade na rodada 8,
// quando "Acesso Pro" virou "Assinantes Pro" (D19) e esta lista ficou para trás,
// derrubando o card para a segunda linha e transformando a tela em 2+5 sem nada
// acusar. `key` é identidade e não muda com copy.
export const PRINCIPAIS = [
  "usuarios_totais",
  "assinantes_pro",
  "receita_periodo",
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
    href: "#emails",
    // TODO(Ana): rótulo da aba de campanhas de e-mail.
    label: "Emails",
    icon: <Send className="h-4 w-4" />,
  },
  {
    href: "#notificacoes",
    label: "Notificações",
    icon: <Bell className="h-4 w-4" />,
  },
  {
    href: "#tarefas",
    label: "Tarefas",
    icon: <SquareKanban className="h-4 w-4" />,
  },
  {
    href: "#beta",
    // TODO(Ana): rótulo da aba de códigos de beta.
    label: "Beta",
    icon: <LockKeyhole className="h-4 w-4" />,
  },
];

// Slugs canonicos das abas, derivados da propria nav (fonte unica: se uma aba
// entra/sai da nav, o conjunto valido acompanha).
const ADMIN_SECTION_IDS = new Set<string>(
  adminNavItems.map((item) => item.href.replace("#", "")),
);

/**
 * Secoes APOSENTADAS e para onde elas vao.
 *
 * `bugs` saiu na Fase 5 da unificacao com Tarefas. O redirect nao e cortesia: os
 * TRES e-mails ja enviados (bug novo, resolvido, reaberto) apontam para
 * `?section=bugs`, e sao o unico caminho externo que sobreviveu ao modulo.
 * Medido na auditoria: nunca existiu identificador curto de bug, entao o link da
 * aba e literalmente tudo o que circulou. Cair em "visao-geral" seria degradacao
 * aceitavel e ruim; mandar para o quadro certo custa uma linha.
 *
 * O destino leva `board=bugs`. Se o quadro nao existir mais, o TasksDashboard
 * cai no primeiro quadro em vez de ficar sem destino.
 *
 * `seo` saiu porque nunca teve dentro. Nasceu e morreu como PendingIntegration
 * ("Requer integracao com Search Console API"): a aba prometia pagina que vira
 * cadastro, keyword organica e status de indexacao, e entregava um aviso de que
 * a integracao nao existe. Aba vazia na navegacao nao e neutra, ela cobra um
 * clique para informar que nao ha nada.
 *
 * O destino e `paginas`, que e onde mora o conteudo mais proximo do que a aba
 * prometia (paginas que geram cadastro). Diferente de bugs, aqui NAO existe
 * caminho externo a resgatar: a varredura do repositorio inteiro (client,
 * server, e-mails, docs e scripts) achou ZERO ocorrencias de `section=seo`, e a
 * unica mencao ao slug era o proprio item de nav. Entao este redirect cobre so
 * link colado, favorito e historico de navegador, que e justamente o que nao da
 * para varrer.
 */
const SECOES_APOSENTADAS: Record<string, string> = {
  bugs: "tarefas&board=bugs",
  seo: "paginas",
};

/** A secao aposentada, ou null. Exportado para teste. */
export function redirecionamentoDeSecao(search: string): string | null {
  const value = new URLSearchParams(search).get("section");
  if (!value) return null;
  const destino = SECOES_APOSENTADAS[value];
  return destino ? `/admin?section=${destino}` : null;
}

// Le ?section= da URL e devolve um AdminSectionId valido, ou o default seguro.
// Centraliza a validacao: ausente ou lixo -> "visao-geral".
// Exportado para teste.
export function sectionFromSearch(search: string): AdminSectionId {
  const value = new URLSearchParams(search).get("section");
  // Secao aposentada resolve para o DESTINO, para a tela ja renderizar certo no
  // primeiro paint em vez de piscar outra aba antes do redirect.
  //
  // A secao sai do DESTINO, nao de um nome cravado. Enquanto bugs era a unica
  // entrada, `return "tarefas"` acertava por coincidencia de cardinalidade: com
  // a segunda entrada, cravar o nome renderizaria Tarefas para quem pediu seo.
  // O destino pode carregar parametros (`tarefas&board=bugs`), entao a secao e
  // o trecho antes do primeiro `&`.
  const destino = value ? SECOES_APOSENTADAS[value] : undefined;
  if (destino) {
    const secaoDestino = destino.split("&")[0];
    // Destino fora do conjunto vivo e erro de programador (entrada escrita
    // errada no mapa), mas cair em "visao-geral" e melhor do que devolver um id
    // que nenhum bloco da tela reconhece, o que renderizaria pagina em branco.
    return ADMIN_SECTION_IDS.has(secaoDestino)
      ? (secaoDestino as AdminSectionId)
      : "visao-geral";
  }
  return value && ADMIN_SECTION_IDS.has(value)
    ? (value as AdminSectionId)
    : "visao-geral";
}

function slugifyAffiliateCode(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase()
    .slice(0, 18);
}

// So ?ref=: em /planos o useAffiliate le ref (cupom e so alias legado, que
// segue aceito para links antigos ja distribuidos) e busca o desconto na API;
// ?desconto= so serve de fallback visual no /cadastro, aonde este link nao
// aponta (o redirect /planos -> /cadastro o re-adiciona sozinho).
function buildAffiliateLink(code: string) {
  const safeCode = slugifyAffiliateCode(code || "PARCEIRO");
  return `https://boranatech.com.br/planos?ref=${safeCode}`;
}

// Mesmo padrao do server (server/lib/coupons.ts) e do banco (CHECK na coluna).
const COUPON_CODE_PATTERN = /^[A-Z0-9]{3,32}$/;

function slugifyCouponCode(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase()
    .slice(0, 32);
}

function buildCouponLink(code: string) {
  return `https://boranatech.com.br/planos?promo=${slugifyCouponCode(code || "PROMO")}`;
}

// Codigo aleatorio no espirito do gerador de afiliado (base + desconto), com
// sufixo aleatorio sem caracteres ambiguos (0/O, 1/I).
function generateCouponCode(discount: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from(
    { length: 4 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
  return `PROMO${discount}${suffix}`;
}

// valid_until: o input date da yyyy-mm-dd; grava o FIM daquele dia no fuso
// local (validade inclusiva, "vale ate o dia X").
function dateInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isoToDateInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function couponExpired(coupon: CouponRecord): boolean {
  return (
    !!coupon.valid_until && new Date(coupon.valid_until).getTime() <= Date.now()
  );
}

// Todos os planos marcados = null (cupom vale para todos); parcial = array na
// ordem canonica de PLAN_ORDER.
function couponPlansPayload(plans: PlanId[]): PlanId[] | null {
  const normalized = PLAN_ORDER.filter((id) => plans.includes(id));
  return normalized.length === PLAN_ORDER.length ? null : normalized;
}

// Volta do banco (string[] | null) para o form, descartando ids desconhecidos.
function couponPlansFromRecord(plans: string[] | null): PlanId[] {
  if (!plans) return [...PLAN_ORDER];
  return PLAN_ORDER.filter((id) => plans.includes(id));
}

function couponPlansLabel(plans: string[] | null): string {
  if (!plans) return "Todos os planos";
  const labels = PLAN_ORDER.filter((id) => plans.includes(id)).map(
    (id) => PLAN_PRICING[id].label,
  );
  return labels.length ? labels.join(", ") : "Nenhum plano";
}

function formatAdminDate(value?: string | null) {
  if (!value) return "Não informado";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR").format(date);
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
/**
 * Agendados e revertidos, ao lado do churn.
 *
 * Nao renderiza nada quando o backend nao manda os campos (janela de deploy) nem
 * quando ambos sao zero: bloco vazio ocupando espaco e ruido, e um "0 agendados"
 * so vale quando ha algo a comparar.
 */
function ChurnContextTiles({ churn }: { churn: ChurnSnapshot }) {
  const agendados = churn.scheduledNotCounted;
  const revertidos = churn.revertedInWindow;
  if (agendados === undefined && revertidos === undefined) return null;
  if (!agendados && !revertidos) return null;

  return (
    <>
      {agendados ? (
        <MetricTile
          label="Saídas agendadas"
          value={String(agendados)}
          hint="Já avisaram que saem. Fora do churn: viram receita em risco."
        />
      ) : null}
      {revertidos ? (
        <MetricTile
          label="Cancelamentos revertidos"
          value={String(revertidos)}
          hint="Pediram para sair e desistiram, na janela."
        />
      ) : null}
    </>
  );
}

/**
 * Um card da Visão.
 *
 * CLICÁVEL quando tem destino: o card responde "como estamos?" e a aba responde
 * "por quê?", e obrigar a pessoa a achar a aba na navegação lateral é fricção
 * sem motivo. Vira `<button>` de verdade, não `<div onClick>`, para o teclado e
 * o leitor de tela alcançarem.
 *
 * A VARIAÇÃO só aparece quando existe; quando não existe, aparece o MOTIVO. Um
 * espaço vazio no lugar do Δ parece defeito.
 *
 * ALINHAMENTO POR CONSTRUÇÃO, e não por altura combinada. Os ícones apareciam
 * cada um numa altura porque todo card tem `destino` e portanto é um `<button>`,
 * e o navegador CENTRALIZA verticalmente o conteúdo de um botão mais alto que
 * ele (folha de estilo do agente de usuário, não classe deste arquivo). Como o
 * grid estica todos à altura da linha e cada card tem conteúdo de tamanho
 * diferente, cada botão centralizava por uma sobra diferente. `flex h-full
 * flex-col` no wrapper substitui essa centralização anônima por uma coluna
 * explícita ancorada no topo, e `mt-auto` no rodapé empurra sparkline e Δ para a
 * base. Nenhuma das duas depende de os cards terem o mesmo conteúdo.
 */
function MetricCardView({
  metric,
  onNavigate,
  destaque,
}: {
  metric: MetricCard;
  onNavigate: (section: AdminSectionId) => void;
  /** Card da linha principal: número maior e mais respiro. */
  destaque?: boolean;
}) {
  // RODAPÉ ANCORADO NA BASE, e só quando existe. Card sem sparkline e sem Δ
  // (hoje "Assinantes Pro" e "Receita em risco") não ganha um rodapé vazio: o
  // conteúdo fica no topo, alinhado com os vizinhos, que é o desejado.
  const rodape =
    metric.sparkline || metric.change ? (
      <div className="mt-auto">
        {metric.sparkline}
        {metric.change ? (
          <p
            data-testid={`card-variacao-${metric.label}`}
            className={`mt-2 text-xs font-black uppercase tracking-wide ${
              metric.change.tom === "alta"
                ? "text-emerald-700"
                : metric.change.tom === "baixa"
                  ? "text-rose-700"
                  : "text-slate-500"
            }`}
          >
            {metric.change.texto}
          </p>
        ) : null}
      </div>
    ) : null;

  const corpo = (
    <>
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
      <p
        className={`font-display mt-1 font-black text-slate-950 ${
          destaque ? "text-5xl" : "text-3xl"
        }`}
      >
        {metric.value}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-600">
        {metric.detail}
      </p>
      {metric.secundaria ? (
        <p
          data-testid={`card-secundaria-${metric.label}`}
          className="mt-1 text-sm font-bold text-slate-500"
        >
          {metric.secundaria}
        </p>
      ) : null}
      {rodape}
    </>
  );

  if (!metric.destino) {
    return (
      <article className="card-brutal flex h-full flex-col rounded-3xl bg-white p-5">
        {corpo}
      </article>
    );
  }

  const destino = metric.destino;
  return (
    <button
      type="button"
      onClick={() => onNavigate(destino)}
      className="card-brutal flex h-full flex-col rounded-3xl bg-white p-5 text-left transition hover:bg-yellow-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
    >
      {corpo}
    </button>
  );
}

function churnInsufficientReason(reason: string): string {
  switch (reason) {
    case "subscription_base_younger_than_window":
      return "Base de assinaturas ainda nova demais para calcular churn de 30 dias.";
    case "no_active_subscribers_at_window_start":
      return "Não havia assinantes ativos no início da janela para calcular churn.";
    // Estado que existe para NAO virar "0%". Nenhuma assinatura chegou ao fim do
    // periodo, entao ninguem teve a chance de sair: zero aqui seria ausencia de
    // medicao disfarcada de medicao.
    case "no_subscription_period_ended":
      return "Nenhuma assinatura chegou ao fim do período ainda: não há saída possível para medir.";
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
        {/* Agendados e revertidos vem ao LADO do churn, nunca somados nele. Sem
            estes dois, "0% de churn" com nove saidas marcadas leria como
            "ninguem quer sair". Aparecem nos dois desfechos (ok e insuficiente)
            porque informam igual nos dois. */}
        <ChurnContextTiles churn={churn} />
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
            <Link href="/" className="group flex min-w-fit items-center gap-2">
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
            </Link>

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
    // TODO(Ana)
    description:
      "Curar a agenda coletada diariamente pelo agente, e adicionar eventos a mão.",
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

// A coluna `modality` de external_events e nullable, mas o BntSelect e o Radix
// por baixo dele nao aceitam item de valor vazio. A sentinela vive SO na UI: o
// payload a converte de volta para null, entao "sem modalidade" continua sendo
// null no banco e nao vira a string "Nao informado".
// TODO(Ana)
const MODALIDADE_NAO_INFORMADA = "Não informado";
const MODALIDADES = [
  MODALIDADE_NAO_INFORMADA,
  "Presencial",
  "Online",
  "Híbrido",
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
      organizer: "",
      source: "admin",
      url: "",
      starts_on: "",
      ends_on: "",
      modality: MODALIDADE_NAO_INFORMADA,
      location_label: "",
      city: "",
      uf: "",
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
    const startsOn = String(form.starts_on || "").trim() || null;
    const modality = String(form.modality || MODALIDADE_NAO_INFORMADA);
    return {
      title: String(form.title || "").trim(),
      description: String(form.description || "").trim(),
      organizer: String(form.organizer || "").trim(),
      // NOT NULL no banco. O default do formulario e "admin" para o evento
      // criado a mao ficar distinguivel do que a rotina diaria coleta.
      source: String(form.source || "admin").trim() || "admin",
      url: String(form.url || "").trim(),
      starts_on: startsOn,
      ends_on: String(form.ends_on || "").trim() || null,
      // external_events_date_coerency_chk exige data OU status "a_confirmar".
      // Derivar aqui em vez de pedir o status na tela evita o insert recusado
      // pelo banco quando a data ainda nao foi anunciada.
      date_status: startsOn ? "confirmada" : "a_confirmar",
      modality: modality === MODALIDADE_NAO_INFORMADA ? null : modality,
      location_label: String(form.location_label || "").trim(),
      city: String(form.city || "").trim(),
      uf: String(form.uf || "").trim(),
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
    <section className="space-y-4">
      <div>
        {/* TODO(Ana): título e subtítulo do bloco de newsletter dentro de Emails. */}
        <h3 className="font-display text-2xl font-black text-slate-950">
          Assinantes da newsletter
        </h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Visão somente leitura de quem entrou na newsletter, por status. Sem
          edição.
        </p>
      </div>
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
    </section>
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
  body_is_html: boolean;
  image_url: string | null;
  category: EmailCampaignCategory;
  status: EmailCampaignStatus;
  total_recipients: number | null;
  sent_count: number;
  failed_count: number;
  bounced_count: number;
  complained_count: number;
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

type ContactListOption = {
  id: string;
  name: string;
  valid_count: number;
  named_count: number;
};

type EmailUserSegment =
  | "all"
  | "never_pro"
  | "active_pro"
  | "paying_pro"
  | "ex_pro";

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
  paying_pro: "Pro pagante",
  ex_pro: "Ex-Pro",
};

// Funil da seleção de destinatários (espelha SelectionFunnel do server): de
// quantos foram varridos, quantos caíram em cada filtro e quantos sobraram.
// Serve pra o número de elegíveis nunca aparecer solto, sem contexto.
type SelectionFunnel = {
  scanned: number;
  discarded_no_email: number;
  discarded_opt_in: number;
  discarded_segment: number;
  discarded_suppressed: number;
  discarded_duplicate: number;
  discarded_already_recipient: number;
  discarded_sent_elsewhere: number;
  selected: number;
};

// Rótulos + explicação (hint) dos descartes, na ordem de exibição. Só os > 0
// aparecem no breakdown. Rótulo e hint moram juntos (fonte única): o tooltip lê
// daqui. duplicate = email repetido na varredura; already_recipient = já é
// destinatário desta campanha; sent_elsewhere = já recebeu outra campanha.
const EMAIL_FUNNEL_DISCARD_LABELS: Array<{
  key: keyof SelectionFunnel;
  label: string;
  hint: string;
}> = [
  {
    key: "discarded_no_email",
    label: "sem email",
    hint: "Registros sem endereço de e-mail cadastrado.",
  },
  {
    key: "discarded_opt_in",
    label: "sem opt-in",
    hint: "Não autorizaram receber e-mails de marketing. Só se aplica a campanhas promocionais.",
  },
  {
    key: "discarded_segment",
    label: "fora do segmento",
    hint: "Não se encaixam no segmento escolhido (ex: já são Pro quando o segmento é Nunca Pro).",
  },
  {
    key: "discarded_suppressed",
    label: "suprimidos",
    hint: "E-mails bloqueados permanentemente por rejeição do servidor, marcação como spam ou descadastro.",
  },
  {
    key: "discarded_duplicate",
    label: "duplicados",
    hint: "O mesmo e-mail apareceu mais de uma vez na varredura.",
  },
  {
    key: "discarded_already_recipient",
    label: "já na campanha",
    hint: "Já são destinatários desta mesma campanha, incluídos por outro lote.",
  },
  {
    key: "discarded_sent_elsewhere",
    label: "já enviados",
    hint: "Já receberam outra campanha e foram excluídos pela opção 'Pular quem já recebeu outra campanha'.",
  },
];

// varridos/selecionados sao os extremos do funil (nao descartes), fora do array
// acima; hints proprios.
const EMAIL_FUNNEL_SCANNED_HINT =
  "Total de registros da origem que foram analisados na seleção.";
const EMAIL_FUNNEL_SELECTED_HINT =
  "Destinatários que passaram por todos os filtros e receberão este lote.";

// Breakdown do funil com popover por item (abre no clique/tap, funciona em
// touch; teclado: foco + Enter/Space abre, Esc fecha). Gatilho discreto:
// underline pontilhado + cursor de ajuda, sem icone por item (o <button> mantem
// a aparencia inline). "2077 varridos · 24 suprimidos · … · 2011 selecionados".
function SelectionFunnelBreakdown({ funnel }: { funnel: SelectionFunnel }) {
  const parts: Array<{ text: string; hint: string }> = [
    { text: `${funnel.scanned} varridos`, hint: EMAIL_FUNNEL_SCANNED_HINT },
  ];
  for (const { key, label, hint } of EMAIL_FUNNEL_DISCARD_LABELS) {
    if (funnel[key] > 0) parts.push({ text: `${funnel[key]} ${label}`, hint });
  }
  parts.push({
    text: `${funnel.selected} selecionados`,
    hint: EMAIL_FUNNEL_SELECTED_HINT,
  });
  return (
    <p className="text-xs font-medium text-slate-400">
      {parts.map((part, index) => (
        <Fragment key={part.text}>
          {index > 0 ? " · " : null}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="cursor-help rounded-sm underline decoration-dotted underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                {part.text}
              </button>
            </PopoverTrigger>
            {/* z acima do modal (z-[2000]) pra nunca ficar atras dele. */}
            <PopoverContent className="z-[2100] w-auto max-w-[240px] p-3 text-xs font-medium text-balance">
              {part.hint}
            </PopoverContent>
          </Popover>
        </Fragment>
      ))}
    </p>
  );
}

// Origens "próximos da fila" (mode=next), as unicas combinaveis num mesmo
// disparo. custom (lista avulsa) e contact_list (lista importada) carregam
// input proprio (e-mails colados / id da lista) e ficam single-origin.
//
// A ORDEM aqui e a PRECEDENCIA de dedup entre lotes da mesma campanha: cada
// origem vira um lote, disparado nesta ordem, e quem existe em mais de uma base
// e inserido pelo PRIMEIRO lote (ON CONFLICT (campaign_id, email) DO NOTHING no
// server) e recebe o rodape/unsubscribe daquela origem. Usuarios PRIMEIRO: quem
// tem conta deve receber o rodape de usuario, nunca o de lista de espera.
// Newsletter antes de Waitlist: assinatura confirmada (opt-in explicito) e um
// vinculo mais especifico que a waitlist de pre-lancamento. A ordem e imposta
// no submit, nao pela ordem de marcacao na UI.
const QUEUE_SOURCE_PRECEDENCE = ["users", "newsletter", "waitlist"] as const;
type QueueSource = (typeof QUEUE_SOURCE_PRECEDENCE)[number];

function isQueueSource(source: EmailBatchSource): source is QueueSource {
  return (QUEUE_SOURCE_PRECEDENCE as readonly string[]).includes(source);
}

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

// Entrega assincrona (webhook do Resend), independente do status de hand-off.
// null = sem evento de entrega ainda.
type EmailDeliveryStatus =
  | "delivered"
  | "bounced"
  | "complained"
  | "delayed"
  | null;

type EmailCampaignRecipientRow = {
  email: string;
  status: EmailRecipientStatus;
  sent_at: string | null;
  error: string | null;
  delivery_status: EmailDeliveryStatus;
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

// Badge de entrega por destinatario (delivery_status do webhook). null nao
// renderiza badge (mostra "-" na celula).
const EMAIL_DELIVERY_STATUS_META: Record<
  "delivered" | "bounced" | "complained" | "delayed",
  { label: string; className: string }
> = {
  delivered: {
    label: "Entregue",
    className: "border-emerald-500 bg-emerald-100 text-emerald-800",
  },
  bounced: {
    label: "Bounce",
    className: "border-rose-500 bg-rose-100 text-rose-800",
  },
  complained: {
    label: "Reclamação",
    className: "border-orange-500 bg-orange-100 text-orange-800",
  },
  delayed: {
    label: "Atrasado",
    className: "border-amber-500 bg-amber-100 text-amber-800",
  },
};

// Go-live do webhook de bounces em producao. Campanhas criadas ANTES disto nao
// tiveram ingestao automatica de bounce/complaint, entao o "Entregues" delas
// reflete os aceitos (pode superestimar).
// Origem do valor: go-live confirmado por curl em 2026-07-23, quando a rota
// /api/resend/webhook passou a responder 400 invalid_signature (date do
// response: Thu, 23 Jul 2026 05:25:53 GMT); o deploy foi imediatamente antes.
const BOUNCE_INGESTION_SINCE = new Date("2026-07-23T05:20:00Z");

// Taxa de bounce em % (bounces sobre aceitos). null quando nao ha aceitos.
function bounceRatePercent(sentCount: number, bouncedCount: number) {
  if (sentCount <= 0) return null;
  return (bouncedCount / sentCount) * 100;
}

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

// TODO(Ana): nome de exemplo do preview de personalizacao.
const PREVIEW_EXAMPLE_NAME = "Maria";

// Preview de documento HTML completo (modo HTML) num <iframe srcDoc>: isola o
// documento colado — os <style> do e-mail ficam presos ao iframe (nao vazam pra
// pagina do admin) e elementos posicionados nao criam overlay sobre o formulario.
// Auto-resize: no onLoad (dispara no mount e a cada srcDoc novo) le o scrollHeight
// do documento e ajusta a altura, com min de seguranca (300px). sandbox=
// "allow-same-origin" (sem allow-scripts) bloqueia JS do HTML colado e ainda deixa
// ler contentDocument pra medir. width 100% (o HTML ja centra os 600px sozinho).
// Fidelidade: recebe o MESMO previewBodyHtml do envio.
function HtmlDocFrame({ srcDoc }: { srcDoc: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(300);
  const handleResize = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    const next = doc?.documentElement?.scrollHeight ?? 0;
    setHeight(Math.max(next, 300));
  }, []);
  return (
    <iframe
      ref={frameRef}
      title="Preview do e-mail (HTML)"
      srcDoc={srcDoc}
      onLoad={handleResize}
      sandbox="allow-same-origin"
      className="block w-full border-0"
      style={{ height }}
    />
  );
}

// Preview do e-mail isolado num componente memoizado (React.memo). O HTML do
// corpo (grande no modo HTML, ate com base64) so e recalculado quando
// bodyText/bodyIsHtml mudam (useMemo), e o React.memo evita re-render/reparse
// quando o formulario mexe em campos nao relacionados (categoria, etc.). A logica
// compartilhada com o envio (applyNamePlaceholder/applyUnsubscribeUrl/
// renderCampaignBodyHtml) e IDENTICA; muda so o quando ela roda.
const CampaignPreview = memo(function CampaignPreview({
  bodyText,
  bodyIsHtml,
  subject,
  imageUrl,
  imageBroken,
  onImageError,
}: {
  bodyText: string;
  bodyIsHtml: boolean;
  subject: string;
  imageUrl: string;
  imageBroken: boolean;
  onImageError: () => void;
}) {
  const trimmedImageUrl = imageUrl.trim();
  // Preview usa a MESMA logica do envio (fonte-unica), so com {nome} de exemplo.
  // Modo texto: renderCampaignBodyHtml (escapa e paragrafa), dentro do card.
  // Modo HTML: o corpo E o e-mail inteiro; substitui {unsubscribe_url} por "#" so
  // pra visualizar e injeta sozinho, sem o card/header/rodape de preview.
  const previewBodyHtml = useMemo(() => {
    const named = applyNamePlaceholder(bodyText, PREVIEW_EXAMPLE_NAME);
    return bodyIsHtml
      ? applyUnsubscribeUrl(named, "#")
      : renderCampaignBodyHtml(named);
  }, [bodyText, bodyIsHtml]);
  const hasNamePlaceholder = useMemo(
    () => bodyText.includes("{nome}"),
    [bodyText],
  );

  return (
    <article className="card-brutal min-w-0 rounded-3xl bg-white p-6">
      {/* TODO(Ana): título do preview. */}
      <h3 className="font-display text-2xl font-black">Preview do e-mail</h3>
      {/* overflow-auto + max-h: contem previews gigantes (ex. HTML colado como
          texto com base64 inquebravel) — rola dentro da caixa em vez de escapar e
          cobrir a coluna do formulario. So tem efeito quando algo transbordaria. */}
      <div className="mt-4 max-h-[70vh] overflow-auto rounded-2xl border-2 border-slate-900 bg-[#F1F5F9] p-4">
        {bodyIsHtml ? (
          // Modo HTML: com imagem, a imagem centrada (max 600px) fica sobre uma
          // faixa escura (#05060E, fundo do HTML de referencia) e o HTML vem
          // colado abaixo (espelha htmlModeWithHeroImage do envio). Sem imagem,
          // o HTML e o e-mail inteiro sozinho. {nome} = exemplo, {unsubscribe_url} = "#".
          <div>
            {bodyText.trim() ? (
              trimmedImageUrl && !imageBroken ? (
                // Imagem no topo (React) + documento isolado no iframe abaixo. A
                // "faixa fake #05060E" saiu do preview: o iframe ja pinta o fundo
                // real do <body> e, no painel, a imagem ocupa a largura toda (sem
                // gutters), entao a faixa virou redundante aqui. O envio real
                // (htmlModeWithHeroImage no server) MANTEM a faixa — cliente de
                // e-mail nao usa iframe; nao mexer no server.
                <div>
                  <img
                    src={trimmedImageUrl}
                    // TODO(Ana): alt text generico do hero da campanha.
                    alt="Imagem da campanha do Bora na Tech"
                    onError={onImageError}
                    className="mx-auto block w-full max-w-[600px]"
                  />
                  <HtmlDocFrame srcDoc={previewBodyHtml} />
                </div>
              ) : (
                <HtmlDocFrame srcDoc={previewBodyHtml} />
              )
            ) : (
              <p className="text-sm font-semibold text-slate-400">
                {/* TODO(Ana): placeholder do preview HTML vazio. */}
                Cole o HTML para ver o e-mail completo aqui.
              </p>
            )}
            {trimmedImageUrl && imageBroken ? (
              <p className="mt-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">
                {/* TODO(Ana): erro de imagem no preview. */}
                Não foi possível carregar a imagem dessa URL.
              </p>
            ) : null}
            <p className="mt-2 text-[11px] font-semibold text-slate-500">
              Preview do HTML como e-mail inteiro, sem header/rodapé
              automáticos. <code>{"{nome}"}</code> ={" "}
              <span className="font-black">{PREVIEW_EXAMPLE_NAME}</span>,{" "}
              <code>{"{unsubscribe_url}"}</code> = "#".
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-md border-4 border-slate-950 bg-white">
            {trimmedImageUrl && !imageBroken ? (
              <img
                src={trimmedImageUrl}
                // TODO(Ana): alt text generico do hero da campanha.
                alt="Imagem da campanha do Bora na Tech"
                onError={onImageError}
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
                {applyNamePlaceholder(subject, PREVIEW_EXAMPLE_NAME).trim() ||
                  "Assunto da campanha"}
              </h4>
              {bodyText.trim() ? (
                <div
                  className="mt-3 break-words"
                  dangerouslySetInnerHTML={{ __html: previewBodyHtml }}
                />
              ) : (
                <p className="mt-3 text-sm font-semibold text-slate-400">
                  {/* TODO(Ana): placeholder do preview vazio. */}O corpo da
                  campanha aparece aqui.
                </p>
              )}
              {hasNamePlaceholder ? (
                // TODO(Ana): copy da nota de personalizacao do preview.
                <p className="mt-3 rounded-lg border-2 border-slate-300 bg-slate-50 p-2 text-[11px] font-semibold text-slate-500">
                  Acima, com nome de exemplo (
                  <span className="font-black">{PREVIEW_EXAMPLE_NAME}</span>).
                  Para quem não tem nome, o <code>{"{nome}"}</code> some (e o
                  espaço antes dele): "Oi {"{nome}"}," vira "Oi,".
                </p>
              ) : null}
              <div className="mt-4 border-t-2 border-slate-200 pt-3 text-center text-[11px] font-semibold text-slate-400">
                {/* TODO(Ana): rodapé do preview (o rodapé real varia por origem). */}
                <p>
                  O rodapé real explica a origem do envio e é definido pela
                  audiência escolhida no disparo.
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
        )}
      </div>
    </article>
  );
});

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
  const [bodyIsHtml, setBodyIsHtml] = useState(false);
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
  const [contactListsError, setContactListsError] = useState<string | null>(
    null,
  );
  const [customText, setCustomText] = useState("");
  const [excludeOther, setExcludeOther] = useState(true);
  const [whenMode, setWhenMode] = useState<"now" | "schedule">("now");
  const [scheduleText, setScheduleText] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [limitText, setLimitText] = useState("");
  const [batchBusy, setBatchBusy] = useState(false);
  const [eligibleCount, setEligibleCount] = useState<number | null>(null);
  // Cobertura de nome dos elegiveis: numero (origem users) ou null (origem sem
  // nome: waitlist/newsletter). undefined enquanto nao carregado.
  const [eligibleWithName, setEligibleWithName] = useState<
    number | null | undefined
  >(undefined);
  const [eligibleError, setEligibleError] = useState<string | null>(null);
  const [eligibleFunnel, setEligibleFunnel] = useState<SelectionFunnel | null>(
    null,
  );
  // Origens adicionais (alem da principal batchSource) a incluir no mesmo
  // disparo. So origens de fila em mode=next; cada uma vira um POST /batches
  // separado no submit, na ordem de QUEUE_SOURCE_PRECEDENCE.
  const [extraSources, setExtraSources] = useState<Set<QueueSource>>(
    () => new Set(),
  );
  // Contagem/funil por origem adicional (o numero de cada origem aparece
  // rotulado, nunca um total solto). Chave = origem.
  const [extraAudience, setExtraAudience] = useState<
    Partial<
      Record<
        QueueSource,
        {
          count: number | null;
          funnel: SelectionFunnel | null;
          error: string | null;
        }
      >
    >
  >({});
  // Resultado de um disparo multi-origem que falhou no meio: o que ja foi
  // disparado, o que falhou e o que nem chegou a ser tentado.
  const [batchMultiError, setBatchMultiError] = useState<{
    succeeded: QueueSource[];
    failedSource: QueueSource;
    failedMessage: string;
    notAttempted: QueueSource[];
  } | null>(null);

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
      setCampaigns(
        Array.isArray(json.data) ? (json.data as EmailCampaign[]) : [],
      );
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
          body_is_html: bodyIsHtml,
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
      setBodyIsHtml(false);
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
    setBodyIsHtml(detail.body_is_html ?? false);
    setImageUrl(detail.image_url ?? "");
    setCampaignCategory(detail.category);
    setImageBroken(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setSubject("");
    setBodyText("");
    setBodyIsHtml(false);
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
          body_is_html: bodyIsHtml,
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
      setEligibleWithName(undefined);
      setEligibleError(null);
      setEligibleFunnel(null);
      try {
        const params = new URLSearchParams();
        params.set("campaignId", campaignId);
        params.set("source", source);
        if (source === "users") params.set("segment", segment);
        if (exclude) params.set("excludeOtherCampaigns", "true");
        const json = await adminFetch(
          `/email-campaigns/audience-count?${params.toString()}`,
        );
        const data = json.data as {
          count: number;
          withName: number | null;
          funnel?: SelectionFunnel;
        };
        setEligibleCount(data.count);
        setEligibleWithName(data.withName);
        setEligibleFunnel(data.funnel ?? null);
      } catch (err) {
        // Erro de contagem é exibido como erro, nunca como zero.
        setEligibleError(
          err instanceof Error ? err.message : "Erro ao contar os elegíveis.",
        );
      }
    },
    [],
  );

  // Contagem de UMA origem de fila (para as origens adicionais). Segmento so vai
  // na origem users, igual ao caminho da principal.
  const fetchAudience = useCallback(
    async (
      campaignId: string,
      exclude: boolean,
      source: QueueSource,
      segment: EmailUserSegment,
    ) => {
      const params = new URLSearchParams();
      params.set("campaignId", campaignId);
      params.set("source", source);
      if (source === "users") params.set("segment", segment);
      if (exclude) params.set("excludeOtherCampaigns", "true");
      const json = await adminFetch(
        `/email-campaigns/audience-count?${params.toString()}`,
      );
      return json.data as {
        count: number;
        withName: number | null;
        funnel?: SelectionFunnel;
      };
    },
    [],
  );

  const loadExtraAudience = useCallback(
    async (
      campaignId: string,
      source: QueueSource,
      segment: EmailUserSegment,
      exclude: boolean,
    ) => {
      setExtraAudience((prev) => ({
        ...prev,
        [source]: { count: null, funnel: null, error: null },
      }));
      try {
        const data = await fetchAudience(campaignId, exclude, source, segment);
        setExtraAudience((prev) => ({
          ...prev,
          [source]: {
            count: data.count,
            funnel: data.funnel ?? null,
            error: null,
          },
        }));
      } catch (err) {
        setExtraAudience((prev) => ({
          ...prev,
          [source]: {
            count: null,
            funnel: null,
            error:
              err instanceof Error
                ? err.message
                : "Erro ao contar os elegíveis.",
          },
        }));
      }
    },
    [fetchAudience],
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
    setExtraSources(new Set());
    setExtraAudience({});
    setBatchMultiError(null);
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
    // Trocar a origem principal zera as adicionais: a combinacao anterior nao
    // faz mais sentido (e custom/contact_list nem sao combinaveis).
    setExtraSources(new Set());
    setExtraAudience({});
    setBatchMultiError(null);
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
    // O segmento so afeta a origem users, seja ela a principal ou uma adicional.
    if (batchSource === "users") {
      void loadEligibleCount(detail.id, excludeOther, "users", next);
    }
    if (extraSources.has("users")) {
      void loadExtraAudience(detail.id, "users", next, excludeOther);
    }
  }

  // Marca/desmarca uma origem adicional (alem da principal). Ao marcar, ja
  // carrega a contagem daquela origem; ao desmarcar, limpa.
  function toggleExtraSource(source: QueueSource) {
    if (!detail) return;
    setBatchMultiError(null);
    setExtraSources((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(source)) {
        nextSet.delete(source);
        setExtraAudience((prevAudience) => {
          const copy = { ...prevAudience };
          delete copy[source];
          return copy;
        });
      } else {
        nextSet.add(source);
        void loadExtraAudience(detail.id, source, batchSegment, excludeOther);
      }
      return nextSet;
    });
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
    // As adicionais tambem dependem do exclude: recarrega cada uma.
    extraSources.forEach((source) => {
      void loadExtraAudience(detail.id, source, batchSegment, next);
    });
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

  // Elegíveis CONHECIDOS de uma origem de fila (principal ou adicional). count
  // null = ainda contando; error != null = falha na contagem. "Conhecido = 0"
  // só quando count === 0 e sem erro.
  function originKnownEligibles(source: QueueSource): {
    count: number | null;
    error: string | null;
  } {
    if (source === batchSource) {
      return { count: eligibleCount, error: eligibleError };
    }
    const info = extraAudience[source];
    return { count: info?.count ?? null, error: info?.error ?? null };
  }

  // Origens de fila selecionadas (principal + adicionais) no modo "próximos".
  const selectedQueueOrigins =
    isQueueSource(batchSource) && batchMode === "next"
      ? QUEUE_SOURCE_PRECEDENCE.filter(
          (source) => source === batchSource || extraSources.has(source),
        )
      : [];
  // Todas as origens marcadas têm audiência CONHECIDA = 0 (nenhuma desconhecida
  // nem > 0). Desconhecida (contando/erro) NÃO conta como vazia: o backend é a
  // defesa nesse caso.
  const allSelectedOriginsKnownEmpty =
    selectedQueueOrigins.length > 0 &&
    selectedQueueOrigins.every((source) => {
      const { count, error } = originKnownEligibles(source);
      return !error && count === 0;
    });
  // Só bloqueia o disparo IMEDIATO: o agendado reavalia a audiência no disparo,
  // então uma lista vazia agora pode ter gente até a data agendada.
  const blockImmediateEmpty =
    whenMode === "now" && allSelectedOriginsKnownEmpty;

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
          // TODO(Ana): mensagem de erro ao listar os contatos da origem.
          err instanceof Error ? err.message : "Erro ao listar os contatos.",
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
        toast.error(`Máximo de ${EMAIL_BATCH_MAX_SELECTED} e-mails por lote.`);
        return prev;
      }
      nextSet.add(email);
      return nextSet;
    });
  }

  async function submitBatch() {
    if (!detail) return;
    setBatchMultiError(null);

    let limit: number | undefined;
    if (batchSource === "custom") {
      if (parsedCustom.valid.length === 0) {
        // TODO(Ana): mensagem de lista colada vazia.
        toast.error("Cole ao menos um e-mail válido para o lote.");
        return;
      }
      if (parsedCustom.valid.length > EMAIL_BATCH_MAX_SELECTED) {
        // TODO(Ana): mensagem de lista colada acima do limite.
        toast.error(`Máximo de ${EMAIL_BATCH_MAX_SELECTED} e-mails por lote.`);
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

    // Multi-origem: origem principal + adicionais (so origens de fila em
    // mode=next). Cada origem vira um POST /batches SEPARADO, disparado na ordem
    // de precedencia (QUEUE_SOURCE_PRECEDENCE), NAO na ordem de marcacao: quem
    // esta em varias bases recebe pelo primeiro lote e leva o rodape daquela
    // origem. Para no primeiro erro pra o admin ver o que ja foi e o que falta.
    if (
      isQueueSource(batchSource) &&
      batchMode === "next" &&
      extraSources.size > 0
    ) {
      const origins = QUEUE_SOURCE_PRECEDENCE.filter(
        (source) => source === batchSource || extraSources.has(source),
      );
      // No disparo IMEDIATO, pula origens com audiência CONHECIDA = 0 (não faz o
      // POST). No AGENDADO, não pula: a audiência é reavaliada no disparo, então
      // uma origem vazia agora pode ter gente na data agendada.
      const skipped: QueueSource[] = [];
      const toDispatch =
        whenMode === "now"
          ? origins.filter((source) => {
              const { count, error } = originKnownEligibles(source);
              if (!error && count === 0) {
                skipped.push(source);
                return false;
              }
              return true;
            })
          : origins;
      setBatchBusy(true);
      const succeeded: Array<{
        source: QueueSource;
        enqueued?: number;
        scheduled: boolean;
      }> = [];
      let failed: { source: QueueSource; message: string } | null = null;
      try {
        for (const source of toDispatch) {
          try {
            const json = await adminFetch(
              `/email-campaigns/${detail.id}/batches`,
              {
                method: "POST",
                body: JSON.stringify({
                  mode: "next",
                  source,
                  userSegment: source === "users" ? batchSegment : undefined,
                  limit,
                  scheduledFor,
                  excludeOtherCampaigns: excludeOther,
                }),
              },
            );
            const data = json.data as { scheduled: boolean; enqueued?: number };
            succeeded.push({
              source,
              enqueued: data.enqueued,
              scheduled: data.scheduled,
            });
          } catch (err) {
            // no_eligible NÃO é falha: a origem esvaziou entre a contagem e o
            // disparo (corrida). Registra como pulada e segue pras demais.
            if (err instanceof AdminApiError && err.code === "no_eligible") {
              skipped.push(source);
              continue;
            }
            failed = {
              source,
              message:
                err instanceof Error ? err.message : "Erro ao criar o lote.",
            };
            break;
          }
        }
      } finally {
        setBatchBusy(false);
      }
      // Sempre recarrega: o historico de lotes reflete o que foi criado.
      void loadDetail(detail.id);
      void loadCampaigns();
      const skippedNote =
        skipped.length > 0
          ? ` · puladas (0 elegíveis): ${skipped
              .map((source) => EMAIL_BATCH_SOURCE_META[source])
              .join(", ")}`
          : "";
      if (failed) {
        const notAttempted = toDispatch.filter(
          (source) =>
            source !== failed!.source &&
            !succeeded.some((result) => result.source === source),
        );
        setBatchMultiError({
          succeeded: succeeded.map((result) => result.source),
          failedSource: failed.source,
          failedMessage: failed.message,
          notAttempted,
        });
        toast.error(
          `Falha na origem ${EMAIL_BATCH_SOURCE_META[failed.source]}. ${succeeded.length} já disparada(s), ${notAttempted.length} não disparada(s).`,
        );
      } else if (succeeded.length === 0) {
        // Nada disparado (todas as origens estavam vazias): não fecha o modal.
        toast(`Nenhuma origem tinha destinatário elegível: nada foi enviado.`);
      } else {
        toast.success(
          succeeded
            .map(
              (result) =>
                `${EMAIL_BATCH_SOURCE_META[result.source]}${
                  result.scheduled ? " (agendado)" : `: ${result.enqueued ?? 0}`
                }`,
            )
            .join(" · ") + skippedNote,
        );
        setBatchModalOpen(false);
      }
      return;
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
      if (data.scheduled) {
        toast.success("Lote agendado.");
      } else if ((data.enqueued ?? 0) > 0) {
        toast.success(`${data.enqueued} envios enfileirados.`);
      } else {
        // Defesa: com os guards de audiência vazia (front desabilita o imediato
        // vazio; backend rejeita com no_eligible), este ramo é inalcançável no
        // imediato, mas a copy honesta cobre qualquer resíduo em vez de dizer
        // "0 envios enfileirados" como se fosse sucesso.
        toast("Nenhum destinatário elegível: nada foi enviado.");
      }
      setBatchModalOpen(false);
      void loadDetail(detail.id);
      void loadCampaigns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar o lote.");
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

  // Aviso nao-bloqueante: no modo HTML, sem {unsubscribe_url} o link de
  // descadastro pode nao aparecer no corpo (o header SMTP segue setado no envio).
  // Memoizado: sem isto, o HTML (grande no modo HTML) e varrido a cada render,
  // inclusive em clique de campo nao relacionado (categoria, etc.).
  const missingUnsubscribe = useMemo(
    () => bodyIsHtml && !bodyText.includes("{unsubscribe_url}"),
    [bodyIsHtml, bodyText],
  );
  // Callback estavel pro React.memo do CampaignPreview valer: uma nova funcao a
  // cada render quebraria a memoizacao e re-renderizaria o preview sempre.
  const handlePreviewImageError = useCallback(() => setImageBroken(true), []);
  const pending = detail ? campaignPendingCount(detail) : null;
  // Grupo "Entrega": derivado da campanha, sem coluna nova. Entregues e
  // aceitos menos os que quicaram/reclamaram (>= 0 por seguranca).
  const delivered = detail
    ? Math.max(
        0,
        detail.sent_count - detail.bounced_count - detail.complained_count,
      )
    : null;
  const detailBounceRate = detail
    ? bounceRatePercent(detail.sent_count, detail.bounced_count)
    : null;
  const detailBounceTier =
    detailBounceRate === null
      ? "none"
      : detailBounceRate >= 5
        ? "high"
        : detailBounceRate >= 2
          ? "watch"
          : "ok";
  // Campanha anterior ao webhook: nao teve ingestao automatica de bounces.
  const preBounceTracking = detail
    ? new Date(detail.created_at) < BOUNCE_INGESTION_SINCE
    : false;
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
      title="Campanhas de e-mail"
      subtitle="Crie uma campanha, envie um teste para você e dispare para a audiência escolhida com fila e limite de velocidade."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <article className="card-brutal min-w-0 rounded-3xl bg-white p-6">
          {/* TODO(Ana): rótulos do formulário de campanha. */}
          <h3 className="font-display text-2xl font-black">
            {editingId ? "Editar campanha" : "Nova campanha"}
          </h3>
          <div className="mt-4 space-y-4">
            {/* Imagem no topo do e-mail (full-width). Vale para os dois modos:
                hero do campaignLayout no texto, imagem colada acima do HTML no
                modo HTML. Por isso fica no inicio do formulario. */}
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
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="email-campaign-body"
                  className="text-xs font-black uppercase text-slate-500"
                >
                  Corpo
                </label>
                {/* TODO(Ana): rótulo do toggle de HTML. */}
                <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-black uppercase text-slate-600">
                  <input
                    type="checkbox"
                    checked={bodyIsHtml}
                    onChange={(event) => setBodyIsHtml(event.target.checked)}
                    className="h-4 w-4 accent-slate-950"
                  />
                  Usar HTML
                </label>
              </div>
              <textarea
                id="email-campaign-body"
                value={bodyText}
                onChange={(event) => setBodyText(event.target.value)}
                rows={8}
                // TODO(Ana): placeholder do corpo (texto vs HTML).
                placeholder={
                  bodyIsHtml
                    ? "Cole o HTML estilizado. Use {nome} e {unsubscribe_url}."
                    : "Quebra de linha dupla vira parágrafo. Use {nome} para o primeiro nome."
                }
                className={`mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold ${
                  bodyIsHtml ? "font-mono text-xs" : ""
                }`}
              />
              {/* TODO(Ana): copy da ajuda do corpo (HTML vs texto e {nome}). */}
              {bodyIsHtml ? (
                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                  Modo HTML: o conteúdo é o e-mail inteiro, injetado como colado
                  (sem header, imagem ou rodapé automáticos). Use{" "}
                  <code className="font-black">{"{nome}"}</code> para o primeiro
                  nome e{" "}
                  <code className="font-black">{"{unsubscribe_url}"}</code> onde
                  o link de descadastro deve aparecer.
                </p>
              ) : (
                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                  Escreva <code className="font-black">{"{nome}"}</code> para
                  inserir o primeiro nome da pessoa. Só as origens Usuários e
                  Lista importada têm nome; nas demais (Waitlist, Newsletter,
                  Lista avulsa) o <code className="font-black">{"{nome}"}</code>{" "}
                  some, junto do espaço antes dele. Ex: "Oi {"{nome}"}," vira
                  "Oi," para quem não tem nome.
                </p>
              )}
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
            {missingUnsubscribe ? (
              // Aviso, nao bloqueio: o envio segue permitido (o header SMTP
              // List-Unsubscribe continua setado), mas o link visual pode faltar.
              <p className="rounded-xl border-2 border-amber-400 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                ⚠️ Seu HTML não tem{" "}
                <code className="font-black">{"{unsubscribe_url}"}</code> — o
                link de descadastro pode não funcionar.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={creating}
                onClick={() => void (editingId ? saveEdit() : createCampaign())}
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

        <CampaignPreview
          bodyText={bodyText}
          bodyIsHtml={bodyIsHtml}
          subject={subject}
          imageUrl={imageUrl}
          imageBroken={imageBroken}
          onImageError={handlePreviewImageError}
        />
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
                  {/* TODO(Ana): rotulo do botao de disparo (origem escolhida no modal). */}
                  {detail.status === "draft" ? "Enviar campanha" : "Novo lote"}
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
            <div className="mt-5 space-y-5">
              {/* Grupo Envio: resultado do hand-off ao provedor. "Aceitos" =
                  sent_count (o Resend aceitou), nao entrega confirmada. */}
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Envio
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Aceitos", value: detail.sent_count },
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
              </div>

              {/* Grupo Entrega: eventos assincronos do webhook do Resend. */}
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Entrega
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_#0f172a]">
                    <p className="text-xs font-black uppercase text-slate-500">
                      Entregues
                    </p>
                    <p className="font-display text-3xl font-black text-slate-950">
                      {delivered ?? "?"}
                    </p>
                    {preBounceTracking ? (
                      <p
                        className="mt-1 text-[11px] font-semibold leading-tight text-slate-500"
                        title="Campanhas anteriores ao inicio da ingestao automatica de bounces nao tem esse dado. O numero reflete os aceitos pelo provedor, nao a entrega confirmada."
                      >
                        Anterior à ingestão de bounces: reflete os aceitos.
                      </p>
                    ) : null}
                  </div>
                  <div
                    className={`rounded-2xl border-2 p-4 ${
                      detailBounceTier === "high"
                        ? "border-rose-500 bg-rose-50 shadow-[4px_4px_0_#e11d48]"
                        : detailBounceTier === "watch"
                          ? "border-amber-500 bg-amber-50 shadow-[4px_4px_0_#f59e0b]"
                          : "border-slate-900 bg-white shadow-[4px_4px_0_#0f172a]"
                    }`}
                  >
                    <p className="text-xs font-black uppercase text-slate-500">
                      Bounces
                    </p>
                    <p className="font-display text-3xl font-black text-slate-950">
                      {detail.bounced_count}
                    </p>
                    {detailBounceRate !== null ? (
                      <p
                        className={`mt-1 text-[11px] font-black uppercase ${
                          detailBounceTier === "high"
                            ? "text-rose-700"
                            : detailBounceTier === "watch"
                              ? "text-amber-700"
                              : "text-slate-500"
                        }`}
                      >
                        {detailBounceRate.toFixed(1)}% de taxa
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_#0f172a]">
                    <p className="text-xs font-black uppercase text-slate-500">
                      Reclamações
                    </p>
                    <p className="font-display text-3xl font-black text-slate-950">
                      {detail.complained_count}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-xs font-black uppercase text-slate-500">
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
                                ? ` (${EMAIL_USER_SEGMENT_META[batch.user_segment] ?? batch.user_segment})`
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
                            Entrega
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
                              <td className="px-4 py-3">
                                {row.delivery_status ? (
                                  <span
                                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-black ${EMAIL_DELIVERY_STATUS_META[row.delivery_status].className}`}
                                  >
                                    {
                                      EMAIL_DELIVERY_STATUS_META[
                                        row.delivery_status
                                      ].label
                                    }
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
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
                    Aceitos
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
                  const listBounceRate = bounceRatePercent(
                    campaign.sent_count,
                    campaign.bounced_count,
                  );
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
                        <div className="flex items-center gap-2">
                          <span>{campaign.sent_count}</span>
                          {listBounceRate !== null && listBounceRate >= 5 ? (
                            <span
                              className="inline-flex rounded-full border border-rose-500 bg-rose-100 px-2 py-0.5 text-[11px] font-black text-rose-800"
                              title="Taxa de bounce acima de 5%: risco de reputacao no Resend."
                            >
                              {listBounceRate.toFixed(1)}% bounce
                            </span>
                          ) : null}
                        </div>
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
          <div className="bnt-scrollbar card-brutal max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6">
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

            {isQueueSource(batchSource) && batchMode === "next" ? (
              <div className="mt-4">
                <div className="flex items-center gap-1.5">
                  {/* TODO(Ana): rótulo do passo de origens adicionais. */}
                  <p className="text-xs font-black uppercase text-slate-500">
                    Incluir também
                  </p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label="Como funcionam as origens combinadas"
                        className="rounded-full text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    {/* z acima do modal (z-[2000]) pra nunca ficar atras dele. */}
                    <PopoverContent className="z-[2100] w-auto max-w-[280px] p-3 text-xs font-medium text-slate-600 text-balance">
                      {/* TODO(Ana): copy das origens combinadas. */}
                      Cada origem vira um lote próprio, disparado na ordem
                      Usuários → Newsletter → Waitlist. Quem está em mais de uma
                      base recebe pelo primeiro lote (e o rodapé daquela
                      origem). O limite "próximos N" se aplica a cada origem. Em
                      campanha promocional, a origem Usuários só alcança quem
                      tem opt-in.
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                  {QUEUE_SOURCE_PRECEDENCE.filter(
                    (source) => source !== batchSource,
                  ).map((source) => (
                    <label
                      key={source}
                      className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={extraSources.has(source)}
                        onChange={() => toggleExtraSource(source)}
                        className="h-4 w-4 accent-slate-950"
                      />
                      {EMAIL_BATCH_SOURCE_META[source]}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {batchSource === "users" || extraSources.has("users") ? (
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
                  <BntSelect
                    accent="gold"
                    label="Lista importada"
                    className="mt-2"
                    placeholder="Escolha uma lista..."
                    value={selectedContactListId}
                    onValueChange={setSelectedContactListId}
                    options={contactLists.map((list) => ({
                      value: list.id,
                      label: `${list.name} (${list.valid_count} válidos)`,
                    }))}
                  />
                )}
                <p className="mt-2 text-xs font-bold text-slate-500">
                  {/* TODO(Ana): explicação da reconsulta no envio. */}
                  No envio, cada lote pega até 500 válidos novos; supressão e
                  consentimento são reconsultados na hora.
                </p>
                {(() => {
                  const selectedList = contactLists.find(
                    (list) => list.id === selectedContactListId,
                  );
                  if (!selectedList) return null;
                  return (
                    // TODO(Ana): copy da cobertura de nome da lista importada.
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {`${selectedList.named_count} de ${selectedList.valid_count} contatos com nome (recebem {nome} personalizado).`}
                    </p>
                  );
                })()}
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
                <div className="mt-3 space-y-1">
                  {/* O número nunca aparece solto: sempre rotulado com a origem
                      (e o segmento, na origem Usuários) pra não ser lido como de
                      outra origem. */}
                  <p className="text-sm font-semibold text-slate-600">
                    {`Origem: ${
                      EMAIL_BATCH_SOURCE_META[batchSource] ?? batchSource
                    }${
                      batchSource === "users"
                        ? ` · Segmento: ${
                            EMAIL_USER_SEGMENT_META[batchSegment] ??
                            batchSegment
                          }`
                        : ""
                    } → ${
                      eligibleCount === null
                        ? "contando elegíveis..."
                        : `${eligibleCount} elegíveis`
                    }`}
                  </p>
                  {eligibleCount !== null ? (
                    // TODO(Ana): copy da cobertura de nome por origem.
                    <p className="text-xs font-bold text-slate-500">
                      {typeof eligibleWithName === "number"
                        ? `${eligibleWithName} com nome (recebem {nome} personalizado).`
                        : "Esta origem não tem nome: {nome} some para todos."}
                    </p>
                  ) : null}
                  {eligibleFunnel !== null ? (
                    <SelectionFunnelBreakdown funnel={eligibleFunnel} />
                  ) : null}
                </div>
              )
            ) : null}

            {extraSources.size > 0 ? (
              <div className="mt-2 space-y-2 border-t-2 border-dashed border-slate-200 pt-2">
                {QUEUE_SOURCE_PRECEDENCE.filter((source) =>
                  extraSources.has(source),
                ).map((source) => {
                  const info = extraAudience[source];
                  const segmentSuffix =
                    source === "users"
                      ? ` · Segmento: ${
                          EMAIL_USER_SEGMENT_META[batchSegment] ?? batchSegment
                        }`
                      : "";
                  const prefix = `Origem: ${
                    EMAIL_BATCH_SOURCE_META[source] ?? source
                  }${segmentSuffix} → `;
                  return (
                    <div key={source} className="space-y-1">
                      {info?.error ? (
                        <p className="text-sm font-bold text-rose-700">
                          {`${prefix}${info.error}`}
                        </p>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-slate-600">
                            {`${prefix}${
                              info?.count == null
                                ? "contando elegíveis..."
                                : `${info.count} elegíveis`
                            }`}
                          </p>
                          {info?.funnel ? (
                            <SelectionFunnelBreakdown funnel={info.funnel} />
                          ) : null}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
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
            {extraSources.size > 0 ? (
              <p className="mt-1 text-xs font-bold text-slate-500">
                {/* TODO(Ana): copy da dedup entre origens. */}
                Com múltiplas origens, quem está em mais de uma base é enviado
                uma única vez, pelo primeiro lote na ordem Usuários → Newsletter
                → Waitlist.
              </p>
            ) : null}

            {batchSource === "contact_list" ? null : batchSource !==
              "custom" ? (
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
                      onClick={() => {
                        setBatchMode(option.id);
                        // Origens adicionais só valem no modo "próximos": ao ir
                        // pro seletor manual, zera a combinação.
                        if (option.id === "selected") {
                          setExtraSources(new Set());
                          setExtraAudience({});
                        }
                      }}
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
                {/* TODO(Ana): copy do aviso de que lista avulsa nao tem nome. */}
                <p className="mt-1 text-xs font-bold text-slate-500">
                  Lista avulsa não tem nome: {"{nome}"} some para todos.
                </p>
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

            {batchSource === "custom" ||
            batchSource === "contact_list" ? null : batchMode === "next" ? (
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
                      {/* TODO(Ana): copy de carregando contatos da origem. */}
                      Carregando contatos...
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
            {batchMultiError ? (
              <div className="mt-4 rounded-2xl border-2 border-rose-300 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                {/* TODO(Ana): copy da falha parcial no disparo multi-origem. */}
                <p>
                  Falha na origem{" "}
                  {EMAIL_BATCH_SOURCE_META[batchMultiError.failedSource]}:{" "}
                  {batchMultiError.failedMessage}
                </p>
                {batchMultiError.succeeded.length > 0 ? (
                  <p className="mt-1 font-semibold text-emerald-700">
                    Já disparadas:{" "}
                    {batchMultiError.succeeded
                      .map((source) => EMAIL_BATCH_SOURCE_META[source])
                      .join(", ")}
                    .
                  </p>
                ) : null}
                {batchMultiError.notAttempted.length > 0 ? (
                  <p className="mt-1 font-semibold text-slate-700">
                    Não disparadas:{" "}
                    {batchMultiError.notAttempted
                      .map((source) => EMAIL_BATCH_SOURCE_META[source])
                      .join(", ")}
                    . Remarque só essas e dispare de novo.
                  </p>
                ) : null}
              </div>
            ) : null}

            {blockImmediateEmpty ? (
              <p className="mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 text-sm font-bold text-amber-800">
                {/* TODO(Ana): copy de audiência vazia no disparo imediato. */}
                Nenhum destinatário elegível{" "}
                {selectedQueueOrigins.length > 1
                  ? "nas origens selecionadas"
                  : "nesta origem"}{" "}
                com os filtros atuais. Ajuste a origem ou o segmento, ou agende
                o envio (a audiência é recontada no disparo).
              </p>
            ) : null}

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
                disabled={
                  confirmText !== "ENVIAR" || batchBusy || blockImmediateEmpty
                }
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
              Agendado para {formatBatchDateTime(cancelTarget.scheduled_for)}. O
              lote não será disparado e os destinatários dele não recebem o
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

      <div className="mt-8 border-t-4 border-slate-900 pt-8">
        <ContactListsManager />
      </div>

      <div className="mt-8 border-t-4 border-slate-900 pt-8">
        <NewsletterAdminSection />
      </div>
    </AdminSection>
  );
}

function ContentAdminSection() {
  const [activeType, setActiveType] = useState<ContentType>("areas");
  const [items, setItems] = useState<ContentItem[]>([]);
  // Distingue "nao consegui carregar" de "nao ha registros". A versao anterior
  // caia no mesmo `setItems([])` nos dois casos, e a tela dizia "Nenhum item
  // encontrado. Crie o primeiro item usando o formulario acima" enquanto a rota
  // devolvia 500. A aba Eventos ficou assim por tres meses sem ninguem notar,
  // porque a tela mentia com confianca em vez de acusar a falha.
  const [loadError, setLoadError] = useState<string | null>(null);
  // Total real no banco, com os mesmos filtros da listagem. `null` significa
  // "o backend nao informou", que e o caso na janela de deploy em que o
  // frontend novo conversa com o backend antigo: sem numero, nenhum aviso e
  // dado, em vez de inventar um.
  const [total, setTotal] = useState<number | null>(null);
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
      setLoadError(null);
      setTotal(null);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const json = await adminFetch(`/content/${type}`);
      setItems(Array.isArray(json.data) ? json.data : []);
      setTotal(typeof json.total === "number" ? json.total : null);
    } catch (error) {
      setItems([]);
      setTotal(null);
      // TODO(Ana)
      const message =
        error instanceof Error ? error.message : "Erro ao carregar conteúdo.";
      setLoadError(message);
      toast.error(message);
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
                        required
                      />
                      {/* TODO(Ana) */}
                      <AdminInput
                        label="Organizador"
                        value={String(form.organizer || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            organizer: value,
                          }))
                        }
                      />
                      {/* TODO(Ana) */}
                      <AdminSelect
                        label="Modalidade"
                        value={String(
                          form.modality || MODALIDADE_NAO_INFORMADA,
                        )}
                        options={MODALIDADES}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            modality: value,
                          }))
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
                      {/* TODO(Ana) */}
                      <AdminInput
                        label="UF"
                        value={String(form.uf || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, uf: value }))
                        }
                      />
                      {/* TODO(Ana) */}
                      <AdminInput
                        label="Data de início"
                        type="date"
                        value={String(form.starts_on || "")}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            starts_on: value,
                          }))
                        }
                      />
                      {/* TODO(Ana) */}
                      <AdminInput
                        label="Data de fim"
                        type="date"
                        value={String(form.ends_on || "")}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, ends_on: value }))
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
                {!loading && total !== null && total > items.length ? (
                  <div className="border-b-2 border-slate-900 bg-amber-100 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-900">
                    {/* TODO(Ana) */}
                    Mostrando {items.length} de {total} registros. Use a busca
                    para chegar no que não aparece aqui.
                  </div>
                ) : null}
                {loading ? (
                  <div className="p-5">
                    <LoadingBlock />
                  </div>
                ) : loadError ? (
                  <div className="p-6">
                    {/* TODO(Ana) */}
                    <p className="font-display text-xl font-black text-rose-800">
                      Não foi possível carregar esta lista
                    </p>
                    {/* TODO(Ana) */}
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      Isto não é uma lista vazia: ela não chegou. Nada foi
                      apagado.
                    </p>
                    <p className="mt-3 rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
                      {loadError}
                    </p>
                    {/* TODO(Ana) */}
                    <button
                      type="button"
                      onClick={() => void loadItems()}
                      className="mt-4 rounded-full border-2 border-slate-900 bg-yellow-300 px-4 py-2 text-sm font-black"
                    >
                      Tentar de novo
                    </button>
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
      <BntSelect
        accent="gold"
        label={label}
        className="mt-2"
        value={value}
        onValueChange={onChange}
        options={options.map((option) => ({ value: option, label: option }))}
      />
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

// Paginacao client-side da lista de Afiliados: 5 cards por pagina.
const AFFILIATE_PAGE_SIZE = 5;

// Cupons seguem o mesmo padrao de paginacao da lista de afiliados.
const COUPON_PAGE_SIZE = 5;

export default function Admin() {
  const { loading: authLoading, signOut, user } = useAuth();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [accessState, setAccessState] = useState<
    "loading" | "login" | "forbidden" | "allowed"
  >("loading");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [aiStats, setAiStats] = useState<AiStatsData>({});
  const [aiStatsError, setAiStatsError] = useState<string | null>(null);
  const [aiCostPerUser, setAiCostPerUser] = useState<AiCostPerUserData | null>(
    null,
  );
  const [aiCostPerUserError, setAiCostPerUserError] = useState<string | null>(
    null,
  );
  const [aiCostPerUserLoading, setAiCostPerUserLoading] = useState(true);
  const [posthogState, setPosthogState] = useState<PosthogState | null>(null);
  // Horario REAL de calculo do funil (vem do envelope da janela default, cacheada
  // 5 min). null na janela custom/erro (que sao live). O PostHog e a unica fonte
  // da Visao com idade perceptivel; os demais blocos sao live e nao tem stamp.
  const [posthogComputedAt, setPosthogComputedAt] = useState<string | null>(
    null,
  );
  const [churnRiskUsers, setChurnRiskUsers] = useState<ChurnRiskUser[] | null>(
    null,
  );
  const [billingMetrics, setBillingMetrics] =
    useState<BillingMetricsData | null>(null);
  const [billingMetricsError, setBillingMetricsError] = useState<string | null>(
    null,
  );
  const [churnError, setChurnError] = useState<string | null>(null);
  const [affiliatesError, setAffiliatesError] = useState<string | null>(null);
  const [financeRefreshKey, setFinanceRefreshKey] = useState(0);
  // Loading por fonte de dado, nao um flag unico: cada card renderiza assim que
  // SEU dado chega, sem ficar refem do endpoint mais lento (PostHog/churn). Os
  // fetches seguem em paralelo (Promise.all em loadDashboardData); o que muda e
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [aiStatsLoading, setAiStatsLoading] = useState(true);
  const [posthogLoading, setPosthogLoading] = useState(true);
  const [churnLoading, setChurnLoading] = useState(true);
  const [affiliatesStatsLoading, setAffiliatesStatsLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(true);
  // Aba derivada DIRETO da URL (?section=), fonte unica: sem estado espelhado,
  // entao nao ha loop URL<->estado. F5, voltar/avancar e colar link leem daqui;
  // /admin sem ?section cai em "visao-geral" e nao reescreve a URL.
  const search = useSearch();
  const [, setLocation] = useLocation();
  const activeSection = sectionFromSearch(search);

  // Reescreve a URL das secoes aposentadas. `replace` e nao `push`: o link do
  // e-mail nao deve virar uma entrada no historico que leve de volta a uma aba
  // que nao existe mais. A tela ja renderiza o destino (sectionFromSearch
  // resolve antes), entao isto so acerta a barra de enderecos.
  useEffect(() => {
    const destino = redirecionamentoDeSecao(search);
    if (destino) window.history.replaceState(null, "", destino);
  }, [search]);

  // PRESERVA os demais parametros. Antes reescrevia a query inteira, entao
  // trocar de aba (inclusive clicando num card da Visao) descartava o ?window=
  // e a janela escolhida voltava ao padrao sem ninguem pedir.
  const setActiveSection = useCallback(
    (section: AdminSectionId) => {
      // Preserva o que e da PAGINA (o ?window= da Visao) e descarta o que e de
      // UMA secao so (filtros, quadro e tarefa da aba de Tarefas). A lista mora
      // em taskViewState, junto de onde essas chaves sao lidas e escritas: uma
      // copia aqui divergiria no primeiro filtro novo, e em silencio.
      const params = new URLSearchParams(
        limparChavesDeSecao(window.location.search),
      );
      params.set("section", section);
      setLocation(`/admin?${params.toString()}`);
    },
    [setLocation],
  );

  // JANELA NA URL, nao em estado local. A Visao e a pagina que se deixa aberta e
  // recarrega, e estado local devolveria o padrao a cada F5; na URL ela
  // sobrevive ao reload e o link fica compartilhavel. O custo era o
  // setActiveSection acima descartar o parametro, e ele foi corrigido junto.
  const [overview, setOverview] = useState<OverviewData | null>(null);
  // PRESENCA, em estado PROPRIO. `null` e "ainda nao respondeu", nao "zero".
  const [onlineNow, setOnlineNow] = useState<OnlineNowData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [seriesData, setSeriesData] = useState<SeriesData | null>(null);
  const [seriesLoading, setSeriesLoading] = useState(true);
  const [seriesError, setSeriesError] = useState<string | null>(null);
  const [attention, setAttention] = useState<AttentionData | null>(null);
  const [attentionLoading, setAttentionLoading] = useState(true);
  const [attentionError, setAttentionError] = useState<string | null>(null);

  const overviewWindow = parseOverviewWindow(
    new URLSearchParams(search).get("window"),
  );
  const setOverviewWindow = useCallback(
    (proxima: OverviewWindow) => {
      const params = new URLSearchParams(window.location.search);
      params.set("window", proxima);
      setLocation(`/admin?${params.toString()}`);
    },
    [setLocation],
  );
  // EFEITO PROPRIO, so para /overview: a janela governa os seis cards e mais
  // nada, entao trocar de 7 para 30 nao pode refazer as oito chamadas da pagina
  // (PostHog, fila, saude, afiliados...). O escopo do seletor esta aqui.
  useEffect(() => {
    let cancelled = false;
    setOverviewLoading(true);
    setOverviewError(null);
    adminFetch(`/overview?window=${overviewWindow}`)
      .then((json) => {
        if (cancelled) return;
        setOverview(json.data as OverviewData);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Falha vira ESTADO de erro, nunca zeros: card zerado é afirmação falsa
        // sobre o negócio.
        setOverview(null);
        setOverviewError(
          err instanceof Error ? err.message : "Erro ao carregar os cards.",
        );
      })
      .finally(() => {
        if (!cancelled) setOverviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [overviewWindow]);

  // PRESENCA, com efeito e ritmo PROPRIOS.
  //
  // Fora do efeito do /overview de proposito: aquele e governado pelo seletor de
  // janela, e presenca e estado ATUAL. Acoplar os dois faria "online agora"
  // mudar ao trocar para "ultimos 7 dias", o que nao quer dizer nada, e refaria
  // a query HogQL a cada mexida no seletor.
  //
  // 60s e o intervalo de RENOVACAO da tela; o cache da rota (30s) e que limita a
  // carga real no PostHog quando ha varias abas abertas.
  useEffect(() => {
    let cancelled = false;
    const buscar = () => {
      adminFetch("/online-now")
        .then((json) => {
          if (cancelled) return;
          // Payload degradado (sem `data`) e FALHA, nao sucesso vazio: sem esta
          // guarda o card ficaria "carregando" para sempre, que e o unico estado
          // do resolver que nao diz nada a quem le.
          setOnlineNow((json.data as OnlineNowData) ?? { state: "error" });
        })
        .catch(() => {
          if (cancelled) return;
          setOnlineNow({ state: "error" });
        });
    };
    buscar();
    const id = setInterval(buscar, ONLINE_NOW_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // SERIES DA VISAO: SEGUE o seletor, porque e a mesma janela dos cards. Efeito
  // separado do /overview de proposito: o payload e uma ordem de grandeza maior
  // e nao pode segurar o primeiro render dos numeros.
  useEffect(() => {
    let cancelled = false;
    setSeriesLoading(true);
    setSeriesError(null);
    adminFetch(`/overview-series?window=${overviewWindow}`)
      .then((json) => {
        if (cancelled) return;
        setSeriesData(json.data as SeriesData);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSeriesData(null);
        setSeriesError(
          err instanceof Error ? err.message : "Erro ao carregar as séries.",
        );
      })
      .finally(() => {
        if (!cancelled) setSeriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [overviewWindow]);

  // ATENCAO NECESSARIA: estado proprio, e NAO segue o seletor.
  //
  // Os itens sao estado atual (assinatura em atraso, saida agendada, orfao) ou
  // tem janela propria declarada pelo servidor (`janelaDias`). Fazer trocar de 7
  // para 30 refazer esta chamada mudaria o rotulo sem mudar o conteudo, que e a
  // mesma armadilha do funil.
  useEffect(() => {
    let cancelled = false;
    setAttentionLoading(true);
    setAttentionError(null);
    adminFetch("/attention")
      .then((json) => {
        if (cancelled) return;
        setAttention(json.data as AttentionData);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Falha vira ESTADO de erro. Um painel vazio aqui diria "tudo em ordem"
        // sobre uma medicao que nao aconteceu.
        setAttention(null);
        setAttentionError(
          err instanceof Error ? err.message : "Erro ao carregar.",
        );
      })
      .finally(() => {
        if (!cancelled) setAttentionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [affiliateName, setAffiliateName] = useState("Nova parceira tech");
  const [affiliateCode, setAffiliateCode] = useState("PARCEIRA20");
  const [affiliateDiscount, setAffiliateDiscount] = useState(20);
  const [affiliateCommission, setAffiliateCommission] = useState(30);
  const [copiedAffiliateLink, setCopiedAffiliateLink] = useState(false);
  const [affiliates, setAffiliates] = useState<AffiliateRecord[]>([]);
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [affiliatePage, setAffiliatePage] = useState(1);
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

  // Toggle Afiliados | Cupons da secao, mesmo padrao do antigo BugsDashboard
  // (Tabs local, sem persistencia na URL, default na primeira visao).
  const [affiliatesTab, setAffiliatesTab] = useState<"afiliados" | "cupons">(
    "afiliados",
  );
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponsLoaded, setCouponsLoaded] = useState(false);
  const [couponSearch, setCouponSearch] = useState("");
  const [couponPage, setCouponPage] = useState(1);
  const [couponFormCode, setCouponFormCode] = useState("");
  const [couponFormDescription, setCouponFormDescription] = useState("");
  const [couponFormDiscount, setCouponFormDiscount] = useState(20);
  const [couponFormValidUntil, setCouponFormValidUntil] = useState("");
  const [couponFormMaxRedemptions, setCouponFormMaxRedemptions] = useState("");
  const [couponFormPlans, setCouponFormPlans] = useState<PlanId[]>([
    ...PLAN_ORDER,
  ]);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [copiedCouponLink, setCopiedCouponLink] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponEditForm, setCouponEditForm] = useState<CouponEditForm | null>(
    null,
  );
  const [savingCouponEditId, setSavingCouponEditId] = useState<string | null>(
    null,
  );
  const [deleteCouponTarget, setDeleteCouponTarget] =
    useState<CouponRecord | null>(null);
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null);
  const [copiedCouponCardId, setCopiedCouponCardId] = useState<string | null>(
    null,
  );

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
      setDashboardLoading(true);
      setAiStatsLoading(true);
      setAiCostPerUserLoading(true);
      setPosthogLoading(true);
      setChurnLoading(true);
      setAffiliatesStatsLoading(true);
      setBillingLoading(true);

      // Mesmas promises tagueadas de antes (falha vira estado de erro da secao,
      // nunca zeros). A diferenca: cada uma aplica SEU estado no proprio .then
      // assim que chega, em vez de esperar o Promise.all inteiro. O paralelismo
      // e identico; muda so o momento em que cada card sai do "Carregando".
      const dashboardPromise = adminFetch("/dashboard")
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
        }));
      const aiPromise = adminFetch("/ai-stats")
        .then((json) => ({
          ok: true as const,
          data: (json.data || {}) as AiStatsData,
        }))
        .catch((err: unknown) => ({
          ok: false as const,
          error:
            err instanceof Error ? err.message : "Erro ao carregar uso de IA.",
        }));
      // Falha aqui vira ESTADO de erro no card, nunca tabela vazia: tabela
      // vazia diria "ninguem gastou IA nesta janela", que e um fato diferente de
      // "nao consegui perguntar".
      const aiCostPerUserPromise = adminFetch("/ai-cost-per-user")
        .then((json) => ({
          ok: true as const,
          // NORMALIZADO NA BORDA, nao confiado. A Vercel sobe antes do Railway e
          // existe uma janela de 1 a 3 minutos com bundle novo contra backend
          // ANTIGO, que nao conhece esta rota nem estes campos. Ler `top.length`
          // de um payload sem `top` derruba a aba INTEIRA com TypeError, que e
          // pior que nao mostrar a tabela. Aqui a ausencia vira lista vazia e
          // segue como estado "sem dados", que e o que ela e.
          data: normalizarCustoPorUsuario(json.data),
        }))
        .catch((err: unknown) => ({
          ok: false as const,
          error:
            err instanceof Error
              ? err.message
              : "Erro ao carregar custo de IA por usuário.",
        }));
      // PostHog: union do backend; falha de fetch vira o proprio estado error.
      // computedAt vem no envelope so na janela default (cacheada); ausente/erro
      // => null (dado live, idade nao se aplica).
      const posthogPromise = adminFetch("/posthog-stats")
        .then((json) => ({
          state: json.data as PosthogState,
          computedAt:
            typeof json.computedAt === "string" ? json.computedAt : null,
        }))
        .catch((err: unknown) => ({
          state: {
            state: "error" as const,
            reason:
              err instanceof Error
                ? err.message
                : "Erro ao consultar o PostHog.",
          } as PosthogState,
          computedAt: null,
        }));
      const churnPromise = adminFetch("/churn-risk")
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
        }));
      const affiliatesPromise = adminFetch("/affiliates-stats")
        .then((json) => ({
          ok: true as const,
          data: Array.isArray(json.data)
            ? (json.data as AffiliateRecord[])
            : [],
        }))
        .catch((err: unknown) => ({
          ok: false as const,
          error:
            err instanceof Error ? err.message : "Erro ao carregar afiliados.",
        }));
      // Falha de metricas de cobranca vira ESTADO de erro na secao, nao dado
      // vazio: capturamos o erro num resultado tagueado, sem colapsar em 0.
      const billingPromise = adminFetch("/billing-metrics")
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
        }));

      // De /dashboard so sobra `recent_audit`: os contadores morreram junto com
      // os blocos que os exibiam (ver a poda do servidor no commit seguinte).
      void dashboardPromise.then((dashboardResult) => {
        if (cancelled) return;
        setAuditLogs(
          dashboardResult.ok &&
            Array.isArray(dashboardResult.data?.recent_audit)
            ? dashboardResult.data.recent_audit
            : [],
        );
        setDashboardLoading(false);
      });
      void aiPromise.then((aiResult) => {
        if (cancelled) return;
        if (aiResult.ok) {
          setAiStats(aiResult.data);
          setAiStatsError(null);
        } else {
          setAiStats({});
          setAiStatsError(aiResult.error);
        }
        setAiStatsLoading(false);
      });
      void aiCostPerUserPromise.then((resultado) => {
        if (cancelled) return;
        if (resultado.ok) {
          setAiCostPerUser(resultado.data);
          setAiCostPerUserError(null);
        } else {
          setAiCostPerUser(null);
          setAiCostPerUserError(resultado.error);
        }
        setAiCostPerUserLoading(false);
      });
      void posthogPromise.then((posthogResult) => {
        if (cancelled) return;
        setPosthogState(posthogResult.state);
        setPosthogComputedAt(posthogResult.computedAt);
        setPosthogLoading(false);
      });
      void churnPromise.then((churnResult) => {
        if (cancelled) return;
        if (churnResult.ok) {
          setChurnRiskUsers(churnResult.data);
          setChurnError(null);
        } else {
          setChurnRiskUsers(null);
          setChurnError(churnResult.error);
        }
        setChurnLoading(false);
      });
      void affiliatesPromise.then((affiliatesResult) => {
        if (cancelled) return;
        if (affiliatesResult.ok) {
          setAffiliates(affiliatesResult.data);
          setAffiliatesError(null);
        } else {
          setAffiliates([]);
          setAffiliatesError(affiliatesResult.error);
        }
        setAffiliatesStatsLoading(false);
      });
      void billingPromise.then((billingMetricsResult) => {
        if (cancelled) return;
        if (billingMetricsResult.ok) {
          setBillingMetrics(billingMetricsResult.data);
          setBillingMetricsError(null);
        } else {
          setBillingMetrics(null);
          setBillingMetricsError(billingMetricsResult.error);
        }
        setBillingLoading(false);
      });

      // Mantido o Promise.all: mesmo paralelismo, e o await preserva o contrato
      // de "conclui quando tudo terminou" para o caller (resolve()). Os .then
      // acima ja aplicaram cada estado; aqui so aguardamos o conjunto.
      await Promise.all([
        dashboardPromise,
        aiPromise,
        posthogPromise,
        churnPromise,
        affiliatesPromise,
        billingPromise,
      ]);
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
          setAuditLogs([]);
          setAiStats({});
          setAiStatsError(null);
          setAiCostPerUser(null);
          setAiCostPerUserError(null);
          setPosthogState(null);
          setPosthogComputedAt(null);
          setChurnRiskUsers(null);
          setChurnError(null);
          setAffiliates([]);
          setAffiliatesError(null);
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

  // Horario de CARGA da view (quando o cliente abriu), nao frescor por-dado: com
  // cache por bloco, os dados tem idades diferentes; um stamp unico so e honesto
  // sobre a acao de carregar. A idade real de dado aparece so onde ha cache
  // perceptivel (o funil, via posthogComputedAt).
  const loadedAt = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date()),
    [],
  );

  const generatedAffiliateLink = useMemo(
    () => buildAffiliateLink(affiliateCode),
    [affiliateCode],
  );

  const aiUsageReal = useMemo<AiUsage[]>(() => {
    return Object.entries(aiStats).map(([tool, stats]) => {
      const successRate =
        stats.calls > 0 ? Math.round((stats.success / stats.calls) * 100) : 0;
      return {
        feature: tool,
        requests: String(stats.calls),
        credits: `${successRate}% sucesso`,
        // EM DÓLAR, no MESMO formato do card "Custo de IA" da Visão. Os dois
        // blocos somam o mesmo `cost_estimate` (`agregarUsoDeIa` alimenta as
        // duas rotas), e até aqui a Visão dizia "US$ 2,41" e a aba IA dizia
        // "R$ 2,41" sobre o mesmo número. `formatCurrency` é BRL e não serve.
        cost: `US$ ${stats.cost.toFixed(2)}`,
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
  // PISO DECLARADO da aba IA, a mesma frase que o card da Visão já mostra: a
  // soma acima é de um SUBCONJUNTO, porque há ferramentas cujo call site não
  // passa `costEstimate` para `logAiUsage`. Sem esta linha, "US$ 2,41" parece
  // completo.
  //
  // O detalhamento POR FERRAMENTA existe no agregado (`semCustoMedido` por
  // tool), mas exibi-lo linha a linha muda o desenho do bloco e fica para a
  // Fase 5; aqui vai só o total, que é o que o card da Visão declara.
  //
  // `null` (e não 0) quando nenhuma ferramenta reporta o campo: é a resposta do
  // backend anterior a ele, e "0 chamadas sem custo medido" afirmaria que está
  // tudo medido.
  const aiSemCustoMedido = useMemo<number | null>(() => {
    const medidos = Object.values(aiStats)
      .map((s) => s.semCustoMedido)
      .filter((n): n is number => typeof n === "number");
    if (medidos.length === 0) return null;
    return medidos.reduce((soma, n) => soma + n, 0);
  }, [aiStats]);
  // Deriva os stats so quando o estado e "ok"; caso contrario null. Mantem o
  // nome posthogStats para as leituras de render continuarem validas.
  const posthogStats = posthogState?.state === "ok" ? posthogState.stats : null;
  // hasData vem do backend (nunca inferido de zeros no client).
  const posthogHasData = Boolean(
    posthogState?.state === "ok" && posthogState.hasData,
  );
  const posthogAcquisitionTotal =
    posthogStats?.acquisition?.reduce(
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

  // Filtro client-side da LISTA de cards (name + code + email, case-insensitive).
  // So a lista filtra: affiliateTotals acima segue sobre todos os afiliados de
  // proposito (metricas do programa inteiro). Sem paginacao no endpoint, entao
  // filtrar em memoria e completo, nao enganoso.
  const filteredAffiliates = useMemo(() => {
    const term = affiliateSearch.trim().toLowerCase();
    if (!term) return affiliates;
    return affiliates.filter((affiliate) => {
      const name = (affiliate.name || "").toLowerCase();
      const code = (affiliate.code || "").toLowerCase();
      const email = (affiliate.email || "").toLowerCase();
      return name.includes(term) || code.includes(term) || email.includes(term);
    });
  }, [affiliates, affiliateSearch]);

  // Paginacao SEMPRE sobre a lista filtrada (filtrar -> paginar). Reset para a
  // pagina 1 quando a busca muda (idiomatico no admin, ver UsersDashboard).
  useEffect(() => {
    setAffiliatePage(1);
  }, [affiliateSearch]);

  const affiliateTotalPages = Math.max(
    1,
    Math.ceil(filteredAffiliates.length / AFFILIATE_PAGE_SIZE),
  );
  // Guarda de range lida no render: se a lista encolher (busca ou exclusao) e a
  // pagina atual ficar alem do fim, exibe a ultima pagina valida sem tela vazia
  // nem flash. Os handlers dos botoes tambem clampam.
  const affiliateCurrentPage = Math.min(affiliatePage, affiliateTotalPages);
  const pagedAffiliates = filteredAffiliates.slice(
    (affiliateCurrentPage - 1) * AFFILIATE_PAGE_SIZE,
    affiliateCurrentPage * AFFILIATE_PAGE_SIZE,
  );

  // Cupons: mesmo padrao dos afiliados (filtro client-side por code/descricao,
  // filtrar -> paginar, reset na busca, clamp de range no render).
  const filteredCoupons = useMemo(() => {
    const term = couponSearch.trim().toLowerCase();
    if (!term) return coupons;
    return coupons.filter((coupon) => {
      const code = (coupon.code || "").toLowerCase();
      const description = (coupon.description || "").toLowerCase();
      return code.includes(term) || description.includes(term);
    });
  }, [coupons, couponSearch]);

  useEffect(() => {
    setCouponPage(1);
  }, [couponSearch]);

  const couponTotalPages = Math.max(
    1,
    Math.ceil(filteredCoupons.length / COUPON_PAGE_SIZE),
  );
  const couponCurrentPage = Math.min(couponPage, couponTotalPages);
  const pagedCoupons = filteredCoupons.slice(
    (couponCurrentPage - 1) * COUPON_PAGE_SIZE,
    couponCurrentPage * COUPON_PAGE_SIZE,
  );
  // OS SEIS CARDS, montados do /overview.
  //
  // Uma fonte so para os seis, com a MESMA janela: antes cada card puxava de um
  // endpoint diferente e nenhum tinha dimensao de tempo. `change` vem por card,
  // porque as series tem idades diferentes e uma regra global da pagina erraria
  // em pelo menos um deles.
  //
  // AUSENCIA e estado NOMEADO: falha vira "indisponível", nunca R$ 0,00 falso.
  const adminMetricCards = useMemo<MetricCard[]>(() => {
    if (!overview) {
      const indisponivel = overviewError ? "indisponível" : "…";
      // O card de presenca NAO depende do /overview, entao ele nao herda a
      // degradacao dele: manda a propria fonte responder, senao a tela diria
      // "indisponivel" sobre um PostHog que esta de pe.
      return metricCards.map((c) =>
        c.key === "atividade_agora"
          ? { ...c, ...atividadeDoCard(onlineNow) }
          : { ...c, value: indisponivel },
      );
    }
    // `cards` AUSENTE não pode virar TypeError: este useMemo roda no corpo do
    // render, então um payload sem ele não derruba só os cards, derruba a página
    // inteira (o ErrorBoundary da App troca tudo pela tela de falha). Sem os
    // cards, o mesmo caminho de "indisponível" que já existe para erro de rede.
    const c = overview.cards;
    if (!c) {
      return metricCards.map((card) =>
        card.key === "atividade_agora"
          ? { ...card, ...atividadeDoCard(onlineNow) }
          : { ...card, value: "indisponível" },
      );
    }
    // O INTERVALO EXATO, vindo pronto do servidor, em vez de "nos últimos 30
    // dias". O rótulo genérico era o que permitia dois blocos com definições
    // diferentes de janela parecerem o mesmo recorte: card e gráfico diziam
    // "últimos 30 dias" e diferiam em 182 cadastros (medido em 2026-08-14).
    // `windowLabel` e `tz` são calculados uma vez, no servidor.
    // Em "tudo" o rótulo do intervalo é "até 14 ago", e prefixá-lo com "de"
    // produzia "de até 14 ago". Aqui o texto espelha o BADGE: com janela, o
    // intervalo; sem janela, "desde <primeiro cadastro>", que é a mesma data que
    // o seletor mostra ao lado de "Tudo".
    const desde = overview.cards?.novosUsuarios?.historicoDesde;
    const janelaLabel =
      overview.windowFirstDay && overview.windowLabel
        ? `de ${overview.windowLabel} (${overview.tz})`
        : desde
          ? `desde ${new Date(desde).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              timeZone: "America/Sao_Paulo",
            })}`
          : overview.window === "all"
            ? "no período todo"
            : `nos últimos ${overview.window} dias`;

    // SPARKLINE POR CARD, a partir da MESMA série que o gráfico grande usa. Se
    // as duas viessem de lugares diferentes, o mini e o grande poderiam contar
    // histórias distintas na mesma tela — a divergência de 182 cadastros em
    // miniatura.
    const spark = (chave: string, direcao: "up_bom" | "up_ruim") => (
      <MetricSparkline
        pontos={serieDe(seriesData?.series, chave)}
        direcao={direcao}
        testId={`sparkline-${chave}`}
      />
    );

    return [
      {
        ...metricCards[0],
        // Null é AUSÊNCIA (degradação do Supabase), nunca 0: "0 usuários" é
        // indistinguível de base vazia e seria lido como fato.
        value:
          c.usuariosTotais.value === null
            ? "indisponível"
            : formatCount(c.usuariosTotais.value),
        // OS CADASTROS VIERAM PARA CÁ, e o card de "Novos usuários" saiu.
        //
        // Cadastro na janela é a DERIVADA do total, não uma segunda pergunta: em
        // "Tudo" os dois cards mostravam o mesmo número, e nas outras janelas o
        // segundo respondia "quanto o primeiro subiu". Duas caixas para uma
        // pergunta só é o que fazia a linha de detalhe ter sete cards do mesmo
        // peso.
        //
        // O HEADLINE NÃO SE MOVE com o seletor: continua o total de sempre, e o
        // `detail` continua dizendo isso. Quem obedece à janela é a secundária
        // (que a declara no próprio texto) e o sparkline.
        //
        // O SPARKLINE agora é legítimo: a série é `cadastros`, não o acumulado.
        // A ressalva antiga ("sem sparkline, é métrica cumulativa") valia para
        // plotar o TOTAL, que só sobe por construção e desenharia sempre a mesma
        // diagonal. A derivada tem forma de verdade.
        secundaria: secundariaDeCadastros(c.novosUsuarios, janelaLabel),
        sparkline: spark("cadastros", "up_bom"),
        destino: "usuarios",
      },
      {
        ...metricCards[1],
        ...atividadeDoCard(onlineNow),
        destino: "usuarios",
      },
      {
        ...metricCards[2],
        // PAGANTES NO HEADLINE (D19), e a decisão inverte a da rodada 7.
        //
        // Ali o headline virou `total` (a união deduplicada) para consertar um
        // erro real: somar `bySubscription` com `byInfluencer` conta duas vezes
        // quem tem os dois, e 99 + 28 = 127 contra 124 reais. A aritmética está
        // certa e continua valendo; o que estava errado era a PERGUNTA. "Acesso
        // Pro" mistura quem paga com quem ganhou de graça num número só, e é o
        // primeiro card que alguém lê para saber o tamanho do negócio.
        //
        // `bySubscription` já inclui quem tem os dois (é ele quem paga), então o
        // headline não perde ninguém: o que sai dele é só a concessão PURA, que
        // volta explícita na linha de baixo, junto com o total de acesso. As três
        // informações continuam na tela; muda qual delas está em corpo 40.
        label: "Assinantes Pro",
        value: formatCount(c.acessoPro.bySubscription),
        detail: [
          // CONCESSÃO PURA: `byInfluencer` inclui quem também paga, e essas
          // pessoas já estão no headline. Subtrair `both` é o que faz a linha
          // dizer "+N" de verdade, sem recontar ninguém.
          `+${formatCount(Math.max(c.acessoPro.byInfluencer - c.acessoPro.both, 0))} só por concessão`,
          `${formatCount(c.acessoPro.total)} com acesso no total`,
          // TRIALING FORA DO HEADLINE: trial não paga, e por isso o MRR o exclui
          // de propósito. Somá-lo ao número de pagantes faria o card divergir do
          // MRR no primeiro trial.
          c.mrr.trialingCount > 0 ? `${c.mrr.trialingCount} em trial` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        destino: "usuarios",
      },
      {
        ...metricCards[3],
        value: formatCents(c.mrr.value),
        detail: `MRR de ${formatCount(c.mrr.activeCount)} assinaturas ativas (estado atual, ignora o seletor)`,
        // ARPU como LINHA SECUNDÁRIA (D9), não card novo: é uma divisão do que
        // já está no card. `arpuCents` é null sem assinante ativo — ausência.
        secundaria:
          c.mrr.arpuCents !== null
            ? `ARPU ${formatCents(c.mrr.arpuCents)} por assinante`
            : null,
        sparkline: spark("mrrCents", "up_bom"),
        destino: "financeiro",
      },
      {
        ...metricCards[4],
        label: "Receita no período",
        value: formatCents(c.receita.value),
        // BRUTO como principal (base do Simples) e LÍQUIDO ao lado: bruto
        // sozinho afirma uma receita que não entrou. Os três números já eram
        // calculados no mesmo laço e dois eram descartados.
        detail: `Bruto ${janelaLabel}. Líquido ${formatCents(c.receita.liquidaCents)} (taxas ${formatCents(c.receita.taxasCents)}, reembolsos ${formatCents(c.receita.reembolsosCents)}).`,
        sparkline: spark("receitaBrutaCents", "up_bom"),
        change: rotuloDeVariacao(c.receita.change, c.receita.historicoDesde),
        destino: "financeiro",
      },
      {
        ...metricCards[5],
        // "/mês" NO VALOR (D21): o número é a soma de equivalentes MENSAIS, e
        // sem a unidade ele é lido como "R$ 596,70 saindo", que é falso para
        // quem tem plano anual. A unidade é a diferença entre um número certo e
        // um número entendido.
        value: `${formatCents(c.receitaEmRisco.mrrCents)}/mês`,
        // BREAKDOWN em vez do "% do MRR". O percentual respondia "quanto disso é
        // grande", e o card já mostra o valor; a pergunta que sobra é O QUE
        // fazer, e as duas metades pedem ações opostas (reter quem agendou saída,
        // recuperar a cobrança de quem está em atraso).
        //
        // O `?.` não é decoração: `saindo` e `emAtraso` nasceram nesta rodada, e
        // uma aba aberta desde antes do deploy recebe a resposta ANTIGA, sem
        // eles. Sem a guarda o card imprimiria "undefined saindo".
        detail: detalheDeRisco(c.receitaEmRisco),
        destino: "retencao",
      },
      {
        ...metricCards[6],
        // EM DÓLAR. `MODEL_PRICING` (server/lib/aiTools.ts) é cotada em US$ por
        // 1M de tokens, e até 2026-08-14 este card formatava o mesmo número com
        // símbolo de real.
        value: `US$ ${c.custoIa.valueUsd.toFixed(2)}`,
        // CUSTO POR ASSINANTE ATIVO (D9), com selo de parcial: o numerador é um
        // piso enquanto 7 ferramentas gravarem custo 0, e uma unidade econômica
        // derivada de um piso afirma margem melhor que a real.
        secundaria:
          c.mrr.activeCount > 0
            ? `US$ ${(c.custoIa.valueUsd / c.mrr.activeCount).toFixed(3)} por assinante ativo${c.custoIa.chamadasSemCustoMedido > 0 ? " (custo parcial)" : ""}`
            : null,
        sparkline: spark("custoIaUsd", "up_ruim"),
        detail: [
          `Custo estimado ${janelaLabel}`,
          // PISO DECLARADO: sem isto, "US$ 2,41" parece completo, e ele é a soma
          // de um subconjunto (7 ferramentas gravam custo 0 por falta de
          // costEstimate no call site).
          c.custoIa.chamadasSemCustoMedido > 0
            ? `${formatCount(c.custoIa.chamadasSemCustoMedido)} chamadas sem custo medido`
            : null,
          // Linha em BRL só existe com cotação configurada. Ausente = ausente,
          // nunca conversão por 1.
          c.custoIa.valorEmBrl !== null
            ? `≈ ${formatCurrency(c.custoIa.valorEmBrl)}`
            : null,
        ]
          .filter(Boolean)
          .join(". "),
        destino: "ia",
      },
    ];
  }, [overview, overviewError, seriesData, onlineNow]);

  const cardsPrincipais = PRINCIPAIS.map((chave) =>
    adminMetricCards.find((c) => c.key === chave),
  ).filter((c): c is MetricCard => Boolean(c));
  const cardsSecundarios = adminMetricCards.filter(
    (c) => !PRINCIPAIS.includes(c.key),
  );

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
    const link = buildAffiliateLink(affiliate.code);
    await navigator.clipboard.writeText(link);
    setCopiedAffiliateCardId(affiliate.id);
    window.setTimeout(() => {
      setCopiedAffiliateCardId((current) =>
        current === affiliate.id ? null : current,
      );
    }, 2000);
  }

  async function refreshCoupons() {
    setCouponsLoading(true);
    try {
      const json = await adminFetch("/content/coupons");
      setCoupons(Array.isArray(json.data) ? (json.data as CouponRecord[]) : []);
    } catch {
      setCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  }

  // Carrega os cupons na primeira abertura do toggle Cupons (nao entra no
  // load geral do dashboard, que ja faz bastante fan-out).
  useEffect(() => {
    if (
      activeSection !== "afiliados" ||
      affiliatesTab !== "cupons" ||
      couponsLoaded
    )
      return;
    setCouponsLoaded(true);
    void refreshCoupons();
    // refreshCoupons e estavel o suficiente aqui: so roda no flip do guard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, affiliatesTab, couponsLoaded]);

  function toggleCouponFormPlan(planId: PlanId) {
    setCouponFormPlans((current) =>
      current.includes(planId)
        ? current.filter((id) => id !== planId)
        : PLAN_ORDER.filter((id) => id === planId || current.includes(id)),
    );
    setCopiedCouponLink(false);
  }

  function handleGenerateCouponCode() {
    setCouponFormCode(generateCouponCode(couponFormDiscount));
    setCopiedCouponLink(false);
  }

  async function handleCopyCouponLink() {
    await navigator.clipboard.writeText(buildCouponLink(couponFormCode));
    setCopiedCouponLink(true);
  }

  async function handleCreateCoupon() {
    const code = slugifyCouponCode(couponFormCode);
    if (!COUPON_CODE_PATTERN.test(code)) {
      toast.error("Código inválido: use de 3 a 32 letras e números.");
      return;
    }
    if (couponFormPlans.length === 0) {
      toast.error("Selecione ao menos um plano aplicável.");
      return;
    }
    const maxRaw = couponFormMaxRedemptions.trim();
    const maxRedemptions = maxRaw ? Number(maxRaw) : null;
    if (
      maxRedemptions !== null &&
      (!Number.isInteger(maxRedemptions) || maxRedemptions <= 0)
    ) {
      toast.error("Limite de usos deve ser um número inteiro positivo.");
      return;
    }

    setSavingCoupon(true);
    try {
      await adminFetch("/content/coupons", {
        method: "POST",
        body: JSON.stringify({
          code,
          description: couponFormDescription.trim() || null,
          discount_percent: couponFormDiscount,
          status: "active",
          valid_until: dateInputToIso(couponFormValidUntil),
          max_redemptions: maxRedemptions,
          applicable_plans: couponPlansPayload(couponFormPlans),
        }),
      });
      toast.success("Cupom criado com sucesso.");
      await refreshCoupons();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar cupom.",
      );
    } finally {
      setSavingCoupon(false);
    }
  }

  function startCouponEdit(coupon: CouponRecord) {
    setEditingCouponId(coupon.id);
    setCouponEditForm({
      description: coupon.description || "",
      discount_percent: Number(coupon.discount_percent || 20),
      status: coupon.status || "active",
      valid_until: isoToDateInput(coupon.valid_until),
      max_redemptions:
        coupon.max_redemptions === null ? "" : String(coupon.max_redemptions),
      applicable_plans: couponPlansFromRecord(coupon.applicable_plans),
    });
  }

  function cancelCouponEdit() {
    setEditingCouponId(null);
    setCouponEditForm(null);
  }

  async function handleSaveCouponEdit(coupon: CouponRecord) {
    if (!couponEditForm) return;

    if (couponEditForm.applicable_plans.length === 0) {
      toast.error("Selecione ao menos um plano aplicável.");
      return;
    }
    const maxRaw = couponEditForm.max_redemptions.trim();
    const maxRedemptions = maxRaw ? Number(maxRaw) : null;
    if (
      maxRedemptions !== null &&
      (!Number.isInteger(maxRedemptions) || maxRedemptions <= 0)
    ) {
      toast.error("Limite de usos deve ser um número inteiro positivo.");
      return;
    }

    setSavingCouponEditId(coupon.id);
    try {
      await adminFetch(`/content/coupons/${coupon.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          description: couponEditForm.description.trim() || null,
          discount_percent: Number(couponEditForm.discount_percent || 0),
          status: couponEditForm.status,
          valid_until: dateInputToIso(couponEditForm.valid_until),
          max_redemptions: maxRedemptions,
          applicable_plans: couponPlansPayload(couponEditForm.applicable_plans),
        }),
      });
      toast.success("Cupom atualizado com sucesso.");
      cancelCouponEdit();
      await refreshCoupons();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar cupom.",
      );
    } finally {
      setSavingCouponEditId(null);
    }
  }

  async function confirmDeleteCoupon() {
    if (!deleteCouponTarget) return;

    setDeletingCouponId(deleteCouponTarget.id);
    try {
      await adminFetch(`/content/coupons/${deleteCouponTarget.id}`, {
        method: "DELETE",
      });
      toast.success("Cupom excluído com sucesso.");
      setDeleteCouponTarget(null);
      if (editingCouponId === deleteCouponTarget.id) cancelCouponEdit();
      await refreshCoupons();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir cupom.",
      );
    } finally {
      setDeletingCouponId(null);
    }
  }

  async function handleCopyCouponCardLink(coupon: CouponRecord) {
    await navigator.clipboard.writeText(buildCouponLink(coupon.code));
    setCopiedCouponCardId(coupon.id);
    window.setTimeout(() => {
      setCopiedCouponCardId((current) =>
        current === coupon.id ? null : current,
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
                Carregado às {loadedAt}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-alt py-10">
        <div className="container space-y-10">
          {activeSection === "visao-geral" ? (
            <>
              {/* Substitui os dois cartões de saúde que ocupavam o topo (o de
                  integrações aqui e o "Saúde do sistema" mais abaixo). Verde é
                  ausência: uma linha e some. */}
              <BlocoBoundary nome="Saúde do sistema" compacto>
                <HealthBand />
              </BlocoBoundary>

              {/* O seletor governa OS SEIS CARDS e nada mais. Os blocos abaixo
                  que têm janela própria a declaram na tela; os que são estado
                  atual dizem isso. Um seletor que governa metade da página sem
                  dizer qual metade é pior que não ter seletor. */}
              <div className="flex flex-wrap items-center gap-3">
                <OverviewPeriod
                  window={overviewWindow}
                  onChange={setOverviewWindow}
                  seriesStart={overview?.cards?.novosUsuarios?.historicoDesde}
                />
                {/* O INTERVALO EXATO ao lado do seletor. Um badge por card seria
                    seis repetições do mesmo texto: o seletor governa os seis, e é
                    aqui que a informação pertence. O gráfico "Cadastros por dia"
                    traz o seu próprio badge, com o rótulo que o MESMO servidor
                    calculou — é o par que provava divergir em 182 cadastros. */}
                <WindowBadge
                  label={overview?.windowLabel}
                  tz={overview?.tz}
                  partial={overview?.window !== "all"}
                />
              </div>

              {overviewLoading ? (
                <LoadingBlock />
              ) : overviewError ? (
                <ErrorBlock message={overviewError} />
              ) : (
                // ALCANCE LIMITADO, e a limitação é declarada: este boundary
                // pega erro DENTRO do MetricCardView, mas NÃO pega o `useMemo`
                // que monta `adminMetricCards`, porque ele roda no corpo do
                // Admin, acima daqui. Foi lá que estava o defeito nº 8 da
                // varredura, e quem o contém é a guarda de `overview.cards`, não
                // este boundary. Mover a derivação para dentro de um componente
                // filho resolveria de verdade, e é reestruturação, não fatia
                // curta.
                <BlocoBoundary nome="Cards do período">
                  <div className="space-y-5">
                    {/* LINHA 1: os três principais, maiores. */}
                    <div
                      data-testid="cards-principais"
                      className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                    >
                      {cardsPrincipais.map((metric) => (
                        <MetricCardView
                          key={metric.key}
                          metric={metric}
                          destaque
                          onNavigate={setActiveSection}
                        />
                      ))}
                    </div>
                    {/* LINHA 2: os quatro de detalhe, compactos. Empilham no
                        mobile pelo mesmo mecanismo da linha de cima. */}
                    <div
                      data-testid="cards-secundarios"
                      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                    >
                      {cardsSecundarios.map((metric) => (
                        <MetricCardView
                          key={metric.key}
                          metric={metric}
                          onNavigate={setActiveSection}
                        />
                      ))}
                    </div>
                  </div>
                </BlocoBoundary>
              )}

              {/* Os dois gráficos OBEDECEM ao seletor: cada um refaz a busca
                  quando a janela muda. São os únicos blocos abaixo dos cards que
                  o seguem, e por isso não precisam declarar janela própria. */}
              <div className="grid gap-6 xl:grid-cols-2">
                <BlocoBoundary nome="Receita recorrente e assinantes">
                  <SubscriptionChart window={overviewWindow} />
                </BlocoBoundary>
                <BlocoBoundary nome="Cadastros por dia">
                  <SignupChart window={overviewWindow} />
                </BlocoBoundary>
              </div>

              {/* FUNIL DIGERIDO substitui o `PaidFunnel`.
                  O bloco antigo vinha do PostHog e mostrava contagens; este vem
                  de tabelas locais e mostra TAXAS entre etapas adjacentes, que e
                  a pergunta ("onde vaza?"). As etapas sao verificaveis no banco:
                  cadastro (profiles) -> ativacao (ai_usage_logs) -> Pro
                  (subscriptions). Nao comeca em visitantes porque nao existe
                  fonte local de visitante. */}
              <div className="grid gap-6">
                <BlocoBoundary nome="Funil principal">
                  <FunnelDigest
                    data={seriesData?.funil}
                    loading={seriesLoading}
                    error={seriesError}
                    windowLabel={
                      seriesData?.windowLabel ?? overview?.windowLabel
                    }
                    tz={seriesData?.tz ?? overview?.tz}
                  />
                </BlocoBoundary>
              </div>

              {/* GRAFICOS NOVOS da Fase 4, no mesmo frame dos dois de cima. */}
              <div className="grid gap-6 xl:grid-cols-2">
                <BlocoBoundary nome="Conversões Pro por dia">
                  <ProConversionsChart
                    series={seriesData?.series}
                    erro={seriesError}
                    carregando={seriesLoading}
                  />
                </BlocoBoundary>
                <BlocoBoundary nome="Custo de IA e receita">
                  <CostVsRevenueChart
                    series={seriesData?.series}
                    cotacaoUsdBrl={overview?.cards?.custoIa?.cotacaoUsdBrl}
                    chamadasSemCustoMedido={
                      overview?.cards?.custoIa?.chamadasSemCustoMedido
                    }
                    erro={seriesError}
                    carregando={seriesLoading}
                  />
                </BlocoBoundary>
              </div>

              <div className="grid gap-6">
                <BlocoBoundary nome="Uso de IA por ferramenta">
                  <ToolUsagePanel
                    ferramentas={seriesData?.ferramentas}
                    loading={seriesLoading}
                    error={seriesError}
                    windowLabel={
                      seriesData?.windowLabel
                        ? `${seriesData.windowLabel} (${seriesData.tz})`
                        : null
                    }
                  />
                </BlocoBoundary>
              </div>

              {/* "Aquisicao de usuarios" SAIU na rodada 6 (D10): nao ha coluna
                  de UTM, referrer ou canal em `profiles` nem em `subscriptions`,
                  entao o ranking do PostHog nao era atribuicao.

                  O CONTEINER dela e o botao "Comportamento por pagina" saem
                  AGORA (D17, rodada 7). O grid de tres colunas sobreviveu ao
                  bloco que o preenchia e ficou hospedando so o botao: como item
                  de grid estica na altura da linha, e o painel ao lado passou de
                  vinte itens, o botao virou um pill gigante. O botao so fazia
                  `setActiveSection("paginas")`, que e exatamente o que a aba
                  "Paginas" do nav superior faz (linha do `NAV_ITEMS`), entao ele
                  duplicava navegacao em vez de alcancar destino proprio. */}
              <div className="grid gap-6">
                {/* ATENCAO NECESSARIA substitui "Eventos recentes".
                    O bloco antigo listava as 10 ultimas linhas de
                    `content_audit_logs`, ou seja, historico de edicao de
                    conteudo: o espaco mais visivel da Visao era o unico sobre o
                    qual nao havia nada a fazer. `auditLogs` e o fetch de
                    /dashboard que o alimentavam continuam existindo; o que sai e
                    o JSX. */}
                <BlocoBoundary nome="Atenção necessária">
                  <AttentionPanel
                    data={attention}
                    loading={attentionLoading}
                    error={attentionError}
                  />
                </BlocoBoundary>
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
              title="Usuários"
              // TODO(Ana): revisar copy do subtitulo da aba Usuarios.
              subtitle="Clique em um usuário para ver cadastro, área de interesse, assinatura, onboarding, status, funcionalidades usadas e histórico de navegação."
            >
              {/* Nivel de ABA, como o de Tarefas: o UsersDashboard e um bloco
                  so (uma lista com filtros), entao nao ha sub-blocos para
                  isolar aqui. Os blocos internos com busca propria ganham
                  boundary dentro do UserDetailModal. */}
              <BlocoBoundary nome="Lista de usuários">
                <UsersDashboard />
              </BlocoBoundary>
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
                    <UsageRetentionDashboard />
                  </div>
                </article>
                <div className="grid gap-6">
                  <article className="card-brutal rounded-3xl bg-white p-6">
                    <h3 className="font-display text-2xl font-black text-slate-950">
                      Motivos de cancelamento
                    </h3>
                    <div className="mt-4">
                      <CancellationReasonsDashboard />
                    </div>
                  </article>
                  <article className="card-brutal rounded-3xl bg-rose-50 p-6">
                    <h3 className="font-display text-2xl font-black text-slate-950">
                      Usuários em risco
                    </h3>
                    <div className="mt-4">
                      {churnLoading ? (
                        <LoadingBlock />
                      ) : churnRiskUsers === null ? (
                        // churnRiskUsers null so acontece em erro de fetch agora
                        // (sucesso sempre retorna lista). Mostra erro, nao vazio.
                        // TODO(Ana): copy de fallback do erro de churn.
                        <ErrorBlock
                          message={
                            churnError ?? "Erro ao carregar risco de churn."
                          }
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

              {/* NOTAS FISCAIS (NFS-e). Fica no financeiro porque o que ele
                  mostra e obrigacao sobre o dinheiro que entrou, e os dois
                  estados que exigem acao humana nao aparecem em lugar nenhum
                  fora daqui. */}
              <div className="mt-10">
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Notas fiscais
                </h2>
                <p className="mb-5 mt-1 max-w-3xl text-sm font-semibold text-slate-600">
                  Emissão automática por cobrança confirmada. Bloqueadas
                  dependem do cadastro fiscal do assinante; as marcadas para
                  revisão vieram de reembolso parcial ou cancelamento recusado
                  pela prefeitura.
                </p>
                <FiscalInvoicesDashboard />
              </div>

              {/* DESPESAS (CRUD manual, cambio travado no lancamento) */}
              <div className="mt-10">
                {/* TODO(Ana): titulo e subtitulo do bloco de despesas. */}
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Despesas
                </h2>
                <p className="mb-5 mt-1 max-w-3xl text-sm font-semibold text-slate-600">
                  Lance cobranças recorrentes e gastos pontuais. Moeda
                  estrangeira trava o câmbio (PTAX) na data do lançamento.
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
                        loading={billingLoading}
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
                          <div className="flex justify-between gap-2 font-bold">
                            {/* `title` guarda o slug tecnico: a tela fica legivel
                                e a depuracao continua a um hover de distancia. */}
                            <span title={item.feature}>
                              {rotuloDaFerramenta(item.feature)}
                            </span>
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
                          <div className="mb-1 flex justify-between gap-2 text-sm font-bold">
                            <span title={item.feature}>
                              {rotuloDaFerramenta(item.feature)}
                            </span>
                            <span className="whitespace-nowrap">
                              {item.cost}
                            </span>
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
                  {!aiStatsError &&
                  aiSemCustoMedido !== null &&
                  aiSemCustoMedido > 0 ? (
                    <p
                      data-testid="ia-piso-custo"
                      className="mt-4 text-xs font-semibold text-slate-500"
                    >
                      {/* TODO(Ana) */}
                      {formatCount(aiSemCustoMedido)} chamadas sem custo medido
                    </p>
                  ) : null}
                </article>
                <article className="card-brutal rounded-3xl bg-white p-6">
                  <h3 className="font-display text-2xl font-black">
                    Custo por usuário
                  </h3>
                  {/* TODO(Ana) */}
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    Últimos 30 dias
                  </p>
                  <div className="mt-4">
                    {aiCostPerUserError ? (
                      <ErrorBlock message={aiCostPerUserError} />
                    ) : aiCostPerUserLoading ? (
                      <LoadingBlock />
                    ) : aiCostPerUser && aiCostPerUser.top.length > 0 ? (
                      <>
                        <div className="overflow-x-auto">
                          <table
                            data-testid="ia-custo-por-usuario"
                            className="w-full text-left text-sm"
                          >
                            <thead>
                              {/* SEM `tracking-wider` aqui: num card estreito ele
                                  soma alguns pixels por letra e foi um dos motivos
                                  de "CHAMADAS" e "CUSTO" colarem um no outro. O
                                  `nowrap` nas numericas impede que um cabecalho de
                                  duas palavras dobre e estique a linha inteira. */}
                              <tr className="border-b border-slate-200 text-xs font-black uppercase text-slate-500">
                                {/* TODO(Ana) */}
                                <th className="py-2 pl-0 pr-2">Usuário</th>
                                <th className="whitespace-nowrap px-2 py-2 text-right">
                                  Chamadas
                                </th>
                                <th className="whitespace-nowrap px-2 py-2 text-right">
                                  Custo
                                </th>
                                <th className="whitespace-nowrap py-2 pl-2 pr-0 text-right">
                                  Sem custo
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {aiCostPerUser.top.map((linha) => (
                                <tr
                                  key={linha.userId}
                                  className="border-b border-slate-100 last:border-0"
                                >
                                  {/* `w-full max-w-0` e o padrao de tabela para "esta
                                      coluna absorve a sobra e e a primeira a truncar".
                                      `max-w-[16rem]` era um TETO: a coluna continuava
                                      exigindo ate 16rem e espremia as numericas, que e
                                      o oposto do que se queria. O `overflow-x-auto` do
                                      wrapper fica como valvula, nao como plano A. */}
                                  <td className="w-full max-w-0 truncate py-2 pl-0 pr-2 font-bold">
                                    {linha.email ?? linha.nome ?? (
                                      <span className="text-slate-500">
                                        {/* DUAS AUSENCIAS DIFERENTES, dois
                                          rotulos. O payload ja SEPARA "nao
                                          existe perfil para este user_id" de
                                          "existe e nao tem nome nem e-mail", e
                                          colapsar as duas num rotulo so joga
                                          fora a distincao que o servidor pagou
                                          para fazer: a segunda viraria uma
                                          afirmacao falsa sobre o cadastro. */}
                                        {linha.userId.slice(0, 8)}{" "}
                                        {linha.perfilAusente ? (
                                          /* TODO(Ana) */
                                          <>(perfil ausente)</>
                                        ) : (
                                          /* TODO(Ana) */
                                          <>(sem nome cadastrado)</>
                                        )}
                                      </span>
                                    )}
                                  </td>
                                  <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                                    {formatCount(linha.calls)}
                                  </td>
                                  {/* `nowrap` aqui e o conserto do sintoma que a Ana
                                      viu: o espaco literal entre "US$" e o numero era
                                      ponto de quebra, e "US$ 0.37" saia em duas linhas
                                      em toda celula, engordando a tabela inteira. */}
                                  <td className="whitespace-nowrap px-2 py-2 text-right font-bold tabular-nums">
                                    US$ {numeroOuZero(linha.costUsd).toFixed(2)}
                                  </td>
                                  <td className="whitespace-nowrap py-2 pl-2 pr-0 text-right tabular-nums text-slate-500">
                                    {formatCount(linha.semCustoMedido)}
                                  </td>
                                </tr>
                              ))}
                              {aiCostPerUser.semUsuario ? (
                                <tr
                                  data-testid="ia-custo-sem-usuario"
                                  className="border-t border-slate-300"
                                >
                                  <td className="w-full max-w-0 truncate py-2 pl-0 pr-2 font-bold text-slate-500">
                                    {/* TODO(Ana) */}
                                    Sem usuário
                                  </td>
                                  <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                                    {formatCount(
                                      aiCostPerUser.semUsuario.calls,
                                    )}
                                  </td>
                                  <td className="whitespace-nowrap px-2 py-2 text-right font-bold tabular-nums">
                                    US${" "}
                                    {aiCostPerUser.semUsuario.costUsd.toFixed(
                                      2,
                                    )}
                                  </td>
                                  <td className="whitespace-nowrap py-2 pl-2 pr-0 text-right tabular-nums text-slate-500">
                                    {formatCount(
                                      aiCostPerUser.semUsuario.semCustoMedido,
                                    )}
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>
                        {aiCostPerUser.maisUsuarios > 0 ? (
                          <p
                            data-testid="ia-custo-resto"
                            className="mt-3 text-xs font-semibold text-slate-500"
                          >
                            {/* TODO(Ana) */}e mais{" "}
                            {formatCount(aiCostPerUser.maisUsuarios)} usuários
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-500">
                        {/* TODO(Ana) */}
                        Nenhuma chamada de IA na janela.
                      </p>
                    )}
                  </div>
                </article>
              </div>
              <LinkedinLastroDashboard />
            </AdminSection>
          ) : null}

          {activeSection === "emails" ? <EmailCampaignsAdminSection /> : null}

          {activeSection === "notificacoes" ? (
            <AdminSection
              id="notificacoes"
              eyebrow="notificações"
              icon={<Bell className="h-4 w-4" />}
              title="Notificações in-app"
              subtitle="Crie avisos, cupons e comunicados que aparecem no sino do usuário. Publicado é imutável; arquivar tira do feed sem apagar o histórico."
            >
              <NotificationsManager />
            </AdminSection>
          ) : null}

          {activeSection === "tarefas" ? (
            <AdminSection
              id="tarefas"
              eyebrow="tarefas"
              icon={<SquareKanban className="h-4 w-4" />}
              title="Tarefas"
              subtitle="Board interno de backlog, features, melhorias e débito técnico. As etapas são editáveis: renomeie no duplo clique e reordene pelo menu da coluna."
            >
              {/* Boundary SO em volta desta secao: sem ele, um erro de render
                  aqui sobe ate o ErrorBoundary do App.tsx e derruba a pagina
                  inteira do admin. Ver TasksErrorBoundary.tsx. */}
              <TasksErrorBoundary>
                <Suspense fallback={<TasksPanelSkeleton />}>
                  <TasksDashboard />
                </Suspense>
              </TasksErrorBoundary>
            </AdminSection>
          ) : null}

          {activeSection === "beta" ? <BetaCodesAdminSection /> : null}

          {activeSection === "afiliados" ? (
            <Tabs
              value={affiliatesTab}
              onValueChange={(value) =>
                setAffiliatesTab(value as "afiliados" | "cupons")
              }
            >
              <TabsList className="h-auto gap-1 rounded-full border-2 border-slate-900 bg-white p-1 shadow-[2px_2px_0_#0f172a]">
                <TabsTrigger
                  value="afiliados"
                  className="rounded-full px-4 py-1.5 text-xs font-black uppercase data-[state=active]:bg-slate-950 data-[state=active]:text-white"
                >
                  Afiliados
                </TabsTrigger>
                <TabsTrigger
                  value="cupons"
                  className="rounded-full px-4 py-1.5 text-xs font-black uppercase data-[state=active]:bg-slate-950 data-[state=active]:text-white"
                >
                  Cupons
                </TabsTrigger>
              </TabsList>

              <TabsContent value="afiliados" className="mt-4">
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
                          Gere códigos rastreáveis para influenciadores,
                          comunidades, mentorias e embaixadores. Cada link
                          aplica desconto ao aluno e calcula comissão para o
                          afiliado.
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
                          {affiliateSearch.trim()
                            ? `${filteredAffiliates.length} de ${affiliates.length} afiliados`
                            : `${affiliates.length} afiliados cadastrados`}
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
                          Código do afiliado
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
                                setAffiliateDiscount(
                                  Number(event.target.value),
                                );
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
                                setAffiliateCommission(
                                  Number(event.target.value),
                                )
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
                              Código: {slugifyAffiliateCode(affiliateCode)}
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
                            {copiedAffiliateLink
                              ? "Link copiado"
                              : "Copiar link"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a]">
                      <h3 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
                        <Tag className="h-6 w-6" />
                        Afiliados cadastrados
                      </h3>
                      <input
                        type="search"
                        value={affiliateSearch}
                        onChange={(event) =>
                          setAffiliateSearch(event.target.value)
                        }
                        placeholder="Buscar por nome, código ou e-mail..."
                        className="mt-4 w-full rounded-2xl border-2 border-slate-900 bg-white px-4 py-2.5 font-semibold text-slate-900 shadow-[3px_3px_0_#0f172a] outline-none placeholder:text-slate-400 focus:bg-yellow-50"
                      />
                      <div className="mt-5">
                        {affiliatesStatsLoading || affiliatesLoading ? (
                          <LoadingBlock />
                        ) : affiliates.length ? (
                          filteredAffiliates.length ? (
                            <>
                              <div className="space-y-3">
                                {pagedAffiliates.map((affiliate) => (
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
                                          {affiliate.discount_percent}% desconto
                                          • {affiliate.commission_percent}%
                                          comissão • {affiliate.status}
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap gap-2 sm:justify-end">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            startAffiliateEdit(affiliate)
                                          }
                                          className="rounded-full border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black shadow-[2px_2px_0_#0f172a]"
                                        >
                                          Editar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void handleCopyAffiliateCardLink(
                                              affiliate,
                                            )
                                          }
                                          className="rounded-full border-2 border-slate-900 bg-yellow-100 px-3 py-2 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a]"
                                        >
                                          {copiedAffiliateCardId ===
                                          affiliate.id
                                            ? "Link copiado!"
                                            : "Copiar link"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void handleMarkAffiliatePaid(
                                              affiliate,
                                            )
                                          }
                                          disabled={
                                            affiliate.commission_due_cents <=
                                              0 ||
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
                                        Receita:{" "}
                                        {formatCents(affiliate.revenue_cents)}
                                      </span>
                                      <span className="rounded-xl bg-white px-3 py-2">
                                        A pagar:{" "}
                                        {formatCents(
                                          affiliate.commission_due_cents,
                                        )}
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
                                              value={
                                                affiliateEditForm.discount_percent
                                              }
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
                                            <BntSelect
                                              accent="gold"
                                              label="Status"
                                              className="mt-1"
                                              value={affiliateEditForm.status}
                                              onValueChange={(v) =>
                                                setAffiliateEditForm({
                                                  ...affiliateEditForm,
                                                  status:
                                                    v as AffiliateEditForm["status"],
                                                })
                                              }
                                              options={[
                                                {
                                                  value: "active",
                                                  label: "active",
                                                },
                                                {
                                                  value: "paused",
                                                  label: "paused",
                                                },
                                                {
                                                  value: "inactive",
                                                  label: "inactive",
                                                },
                                              ]}
                                            />
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
                                              void handleSaveAffiliateEdit(
                                                affiliate,
                                              )
                                            }
                                            disabled={
                                              savingAffiliateEditId ===
                                              affiliate.id
                                            }
                                            className="rounded-full border-2 border-slate-900 bg-yellow-300 px-4 py-2 text-sm font-black shadow-[2px_2px_0_#0f172a] disabled:opacity-60"
                                          >
                                            {savingAffiliateEditId ===
                                            affiliate.id
                                              ? "Salvando..."
                                              : "Salvar"}
                                          </button>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                              {affiliateTotalPages > 1 ? (
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                  <span className="text-sm font-black text-slate-950">
                                    Página {affiliateCurrentPage} de{" "}
                                    {affiliateTotalPages}
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAffiliatePage(
                                          Math.max(1, affiliateCurrentPage - 1),
                                        )
                                      }
                                      disabled={affiliateCurrentPage <= 1}
                                      className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0_#0f172a] disabled:opacity-40 disabled:shadow-none"
                                    >
                                      Anterior
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAffiliatePage(
                                          Math.min(
                                            affiliateTotalPages,
                                            affiliateCurrentPage + 1,
                                          ),
                                        )
                                      }
                                      disabled={
                                        affiliateCurrentPage >=
                                        affiliateTotalPages
                                      }
                                      className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0_#0f172a] disabled:opacity-40 disabled:shadow-none"
                                    >
                                      Próxima
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <div className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
                              <p className="font-display text-lg font-black text-slate-950">
                                Nenhum afiliado encontrado para "
                                {affiliateSearch.trim()}"
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-500">
                                Ajuste o termo da busca ou limpe o campo.
                              </p>
                            </div>
                          )
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
              </TabsContent>

              <TabsContent value="cupons" className="mt-4">
                <article
                  id="cupons"
                  className="card-brutal scroll-mt-28 overflow-hidden rounded-[2rem] bg-white"
                >
                  <div className="border-b-2 border-slate-900 bg-[#ffb800] p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[2px_2px_0_#0f172a]">
                          <TicketPercent className="h-4 w-4" />
                          cupons
                        </p>
                        <h2 className="font-display mt-4 text-3xl font-black text-slate-950">
                          Cupons de desconto
                        </h2>
                        <p className="mt-2 max-w-3xl text-sm font-bold text-slate-800">
                          Códigos promocionais sem comissão de afiliado.
                          Desconto na primeira cobrança, com validade e limite
                          de usos.
                        </p>
                      </div>
                      <div className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_#0f172a]">
                        <p className="text-xs font-black uppercase text-slate-500">
                          status
                        </p>
                        <p className="font-display text-xl font-black text-slate-950">
                          Marketing
                        </p>
                        <p className="text-sm font-bold text-slate-600">
                          {couponSearch.trim()
                            ? `${filteredCoupons.length} de ${coupons.length} cupons`
                            : `${coupons.length} cupons cadastrados`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 p-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-3xl border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a]">
                      <h3 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
                        <PlusCircle className="h-6 w-6" />
                        Criar cupom
                      </h3>
                      <div className="mt-5 grid gap-4">
                        <label className="text-sm font-black text-slate-950">
                          Código
                          <div className="mt-2 flex gap-2">
                            <input
                              value={couponFormCode}
                              onChange={(event) => {
                                setCouponFormCode(
                                  slugifyCouponCode(event.target.value),
                                );
                                setCopiedCouponLink(false);
                              }}
                              className="w-full min-w-0 rounded-2xl border-2 border-slate-900 bg-violet-50 px-4 py-3 font-bold uppercase outline-none focus:bg-white focus:ring-4 focus:ring-violet-200"
                              placeholder="PROMO20"
                            />
                            <button
                              type="button"
                              onClick={handleGenerateCouponCode}
                              className="rounded-2xl border-2 border-slate-900 bg-yellow-300 px-4 text-sm font-black shadow-[3px_3px_0_#0f172a]"
                            >
                              Gerar
                            </button>
                          </div>
                        </label>

                        <label className="text-sm font-black text-slate-950">
                          Descrição (uso interno)
                          <input
                            value={couponFormDescription}
                            onChange={(event) =>
                              setCouponFormDescription(event.target.value)
                            }
                            className="mt-2 w-full rounded-2xl border-2 border-slate-900 bg-violet-50 px-4 py-3 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-200"
                            placeholder="Ex: Black Friday 2026"
                          />
                        </label>

                        <label className="text-sm font-black text-slate-950">
                          Desconto para o aluno: {couponFormDiscount}%
                          <input
                            type="range"
                            min="1"
                            max="100"
                            step="1"
                            value={couponFormDiscount}
                            onChange={(event) => {
                              setCouponFormDiscount(Number(event.target.value));
                              setCopiedCouponLink(false);
                            }}
                            className="mt-4 w-full accent-violet-700"
                          />
                        </label>

                        {/* grid-cols-1 no mobile (empilha) e min-w-0 no input
                            de data, que tem largura minima intrinseca e
                            estoura o container em 360px sem isso. */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <label className="text-sm font-black text-slate-950">
                            Validade (opcional)
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="date"
                                value={couponFormValidUntil}
                                onChange={(event) =>
                                  setCouponFormValidUntil(event.target.value)
                                }
                                className="min-w-0 flex-1 rounded-2xl border-2 border-slate-900 bg-violet-50 px-4 py-3 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-200"
                              />
                              {couponFormValidUntil ? (
                                <button
                                  type="button"
                                  onClick={() => setCouponFormValidUntil("")}
                                  aria-label="Limpar validade"
                                  className="shrink-0 rounded-full border-2 border-slate-900 bg-white p-2 shadow-[2px_2px_0_#0f172a]"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              ) : null}
                            </div>
                          </label>
                          <label className="text-sm font-black text-slate-950">
                            Limite de usos (opcional)
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                value={couponFormMaxRedemptions}
                                onChange={(event) =>
                                  setCouponFormMaxRedemptions(
                                    event.target.value,
                                  )
                                }
                                className="min-w-0 flex-1 rounded-2xl border-2 border-slate-900 bg-violet-50 px-4 py-3 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-200"
                                placeholder="Ilimitado"
                              />
                              {couponFormMaxRedemptions ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCouponFormMaxRedemptions("")
                                  }
                                  aria-label="Limpar limite de usos"
                                  className="shrink-0 rounded-full border-2 border-slate-900 bg-white p-2 shadow-[2px_2px_0_#0f172a]"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              ) : null}
                            </div>
                          </label>
                        </div>

                        <div className="text-sm font-black text-slate-950">
                          Planos aplicáveis
                          <div className="mt-2 flex flex-wrap gap-2">
                            {PLAN_ORDER.map((planId) => (
                              <label
                                key={planId}
                                className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black"
                              >
                                <input
                                  type="checkbox"
                                  checked={couponFormPlans.includes(planId)}
                                  onChange={() => toggleCouponFormPlan(planId)}
                                  className="h-4 w-4 accent-violet-700"
                                />
                                {PLAN_PRICING[planId].label}
                              </label>
                            ))}
                          </div>
                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            Todos marcados = vale em qualquer plano.
                          </p>
                        </div>

                        <div className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
                          <p className="flex items-center gap-2 text-xs font-black uppercase text-violet-700">
                            <LinkIcon className="h-4 w-4" />
                            link de campanha
                          </p>
                          <p className="mt-2 break-all font-mono text-sm font-black text-slate-950">
                            {buildCouponLink(couponFormCode)}
                          </p>
                          <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-2">
                            <span className="rounded-full border border-slate-300 bg-white px-3 py-2">
                              Cupom:{" "}
                              {slugifyCouponCode(couponFormCode) || "PROMO"}
                            </span>
                            <span className="rounded-full border border-slate-300 bg-white px-3 py-2">
                              {couponFormDiscount}% na primeira cobrança
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => void handleCreateCoupon()}
                            disabled={savingCoupon}
                            className="btn-brutal-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-black disabled:opacity-60"
                          >
                            <PlusCircle className="h-5 w-5" />
                            {savingCoupon ? "Salvando..." : "Criar cupom"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleCopyCouponLink()}
                            className="btn-brutal-accent inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-black"
                          >
                            <Copy className="h-5 w-5" />
                            {copiedCouponLink ? "Link copiado" : "Copiar link"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a]">
                      <h3 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
                        <Tag className="h-6 w-6" />
                        Cupons cadastrados
                      </h3>
                      <input
                        type="search"
                        value={couponSearch}
                        onChange={(event) =>
                          setCouponSearch(event.target.value)
                        }
                        placeholder="Buscar por código ou descrição..."
                        className="mt-4 w-full rounded-2xl border-2 border-slate-900 bg-white px-4 py-2.5 font-semibold text-slate-900 shadow-[3px_3px_0_#0f172a] outline-none placeholder:text-slate-400 focus:bg-yellow-50"
                      />
                      <div className="mt-5">
                        {couponsLoading ? (
                          <LoadingBlock />
                        ) : coupons.length ? (
                          filteredCoupons.length ? (
                            <>
                              <div className="space-y-3">
                                {pagedCoupons.map((coupon) => (
                                  <div
                                    key={coupon.id}
                                    className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4"
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <p className="font-mono text-lg font-black text-violet-700">
                                          {coupon.code}
                                        </p>
                                        {coupon.description ? (
                                          <p className="mt-1 text-sm font-bold text-slate-700">
                                            {coupon.description}
                                          </p>
                                        ) : null}
                                        <p className="mt-1 text-xs font-semibold text-slate-500">
                                          {coupon.discount_percent}% desconto •{" "}
                                          {coupon.status}
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap gap-2 sm:justify-end">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            startCouponEdit(coupon)
                                          }
                                          className="rounded-full border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black shadow-[2px_2px_0_#0f172a]"
                                        >
                                          Editar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void handleCopyCouponCardLink(
                                              coupon,
                                            )
                                          }
                                          className="rounded-full border-2 border-slate-900 bg-yellow-100 px-3 py-2 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a]"
                                        >
                                          {copiedCouponCardId === coupon.id
                                            ? "Link copiado!"
                                            : "Copiar link"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setDeleteCouponTarget(coupon)
                                          }
                                          className="rounded-full border-2 border-slate-900 bg-rose-100 px-3 py-2 text-xs font-black text-rose-800 shadow-[2px_2px_0_#0f172a]"
                                        >
                                          Excluir
                                        </button>
                                      </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                                      <span className="rounded-xl bg-white px-3 py-2">
                                        Usos:{" "}
                                        {formatCount(coupon.times_redeemed)}/
                                        {coupon.max_redemptions === null
                                          ? "∞"
                                          : formatCount(coupon.max_redemptions)}
                                      </span>
                                      <span
                                        className={`rounded-xl px-3 py-2 ${
                                          couponExpired(coupon)
                                            ? "bg-rose-100 text-rose-800"
                                            : "bg-white"
                                        }`}
                                      >
                                        Validade:{" "}
                                        {coupon.valid_until
                                          ? formatAdminDate(coupon.valid_until)
                                          : "sem expiração"}
                                        {couponExpired(coupon)
                                          ? " (expirado)"
                                          : ""}
                                      </span>
                                      <span className="rounded-xl bg-white px-3 py-2">
                                        {couponPlansLabel(
                                          coupon.applicable_plans,
                                        )}
                                      </span>
                                    </div>
                                    {editingCouponId === coupon.id &&
                                    couponEditForm ? (
                                      <div className="mt-4 rounded-2xl border-2 border-slate-900 bg-white p-4">
                                        <div className="grid gap-3 sm:grid-cols-2">
                                          <label className="text-xs font-black uppercase text-slate-600 sm:col-span-2">
                                            Descrição
                                            <input
                                              value={couponEditForm.description}
                                              onChange={(event) =>
                                                setCouponEditForm({
                                                  ...couponEditForm,
                                                  description:
                                                    event.target.value,
                                                })
                                              }
                                              className="mt-1 w-full rounded-xl border-2 border-slate-300 p-3 text-sm font-bold normal-case text-slate-950"
                                            />
                                          </label>
                                          <label className="text-xs font-black uppercase text-slate-600">
                                            Desconto (%)
                                            <input
                                              value={
                                                couponEditForm.discount_percent
                                              }
                                              onChange={(event) =>
                                                setCouponEditForm({
                                                  ...couponEditForm,
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
                                            Status
                                            <BntSelect
                                              accent="gold"
                                              label="Status"
                                              className="mt-1"
                                              value={couponEditForm.status}
                                              onValueChange={(v) =>
                                                setCouponEditForm({
                                                  ...couponEditForm,
                                                  status:
                                                    v as CouponEditForm["status"],
                                                })
                                              }
                                              options={[
                                                {
                                                  value: "active",
                                                  label: "active",
                                                },
                                                {
                                                  value: "paused",
                                                  label: "paused",
                                                },
                                                {
                                                  value: "inactive",
                                                  label: "inactive",
                                                },
                                              ]}
                                            />
                                          </label>
                                          <label className="text-xs font-black uppercase text-slate-600">
                                            Validade (vazio = sem expiração)
                                            <div className="mt-1 flex items-center gap-2">
                                              <input
                                                type="date"
                                                value={
                                                  couponEditForm.valid_until
                                                }
                                                onChange={(event) =>
                                                  setCouponEditForm({
                                                    ...couponEditForm,
                                                    valid_until:
                                                      event.target.value,
                                                  })
                                                }
                                                className="min-w-0 flex-1 rounded-xl border-2 border-slate-300 p-3 text-sm font-bold normal-case text-slate-950"
                                              />
                                              {couponEditForm.valid_until ? (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setCouponEditForm({
                                                      ...couponEditForm,
                                                      valid_until: "",
                                                    })
                                                  }
                                                  aria-label="Limpar validade"
                                                  className="shrink-0 rounded-full border-2 border-slate-900 bg-white p-2 shadow-[2px_2px_0_#0f172a]"
                                                >
                                                  <X className="h-4 w-4" />
                                                </button>
                                              ) : null}
                                            </div>
                                          </label>
                                          <label className="text-xs font-black uppercase text-slate-600">
                                            Limite de usos (vazio = ilimitado)
                                            <div className="mt-1 flex items-center gap-2">
                                              <input
                                                type="number"
                                                min={1}
                                                value={
                                                  couponEditForm.max_redemptions
                                                }
                                                onChange={(event) =>
                                                  setCouponEditForm({
                                                    ...couponEditForm,
                                                    max_redemptions:
                                                      event.target.value,
                                                  })
                                                }
                                                className="min-w-0 flex-1 rounded-xl border-2 border-slate-300 p-3 text-sm font-bold normal-case text-slate-950"
                                              />
                                              {couponEditForm.max_redemptions ? (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setCouponEditForm({
                                                      ...couponEditForm,
                                                      max_redemptions: "",
                                                    })
                                                  }
                                                  aria-label="Limpar limite de usos"
                                                  className="shrink-0 rounded-full border-2 border-slate-900 bg-white p-2 shadow-[2px_2px_0_#0f172a]"
                                                >
                                                  <X className="h-4 w-4" />
                                                </button>
                                              ) : null}
                                            </div>
                                          </label>
                                          <div className="text-xs font-black uppercase text-slate-600 sm:col-span-2">
                                            Planos aplicáveis
                                            <div className="mt-2 flex flex-wrap gap-2">
                                              {PLAN_ORDER.map((planId) => (
                                                <label
                                                  key={planId}
                                                  className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black normal-case"
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={couponEditForm.applicable_plans.includes(
                                                      planId,
                                                    )}
                                                    onChange={() =>
                                                      setCouponEditForm({
                                                        ...couponEditForm,
                                                        applicable_plans:
                                                          couponEditForm.applicable_plans.includes(
                                                            planId,
                                                          )
                                                            ? couponEditForm.applicable_plans.filter(
                                                                (id) =>
                                                                  id !== planId,
                                                              )
                                                            : PLAN_ORDER.filter(
                                                                (id) =>
                                                                  id ===
                                                                    planId ||
                                                                  couponEditForm.applicable_plans.includes(
                                                                    id,
                                                                  ),
                                                              ),
                                                      })
                                                    }
                                                    className="h-4 w-4 accent-violet-700"
                                                  />
                                                  {PLAN_PRICING[planId].label}
                                                </label>
                                              ))}
                                            </div>
                                          </div>
                                          <p className="text-xs font-semibold normal-case text-slate-500 sm:col-span-2">
                                            Usos até agora:{" "}
                                            {formatCount(coupon.times_redeemed)}{" "}
                                            (somente leitura, contado na
                                            ativação da assinatura).
                                          </p>
                                        </div>
                                        <div className="mt-4 flex justify-end gap-3">
                                          <button
                                            type="button"
                                            onClick={cancelCouponEdit}
                                            className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black"
                                          >
                                            Cancelar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              void handleSaveCouponEdit(coupon)
                                            }
                                            disabled={
                                              savingCouponEditId === coupon.id
                                            }
                                            className="rounded-full border-2 border-slate-900 bg-yellow-300 px-4 py-2 text-sm font-black shadow-[2px_2px_0_#0f172a] disabled:opacity-60"
                                          >
                                            {savingCouponEditId === coupon.id
                                              ? "Salvando..."
                                              : "Salvar"}
                                          </button>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                              {couponTotalPages > 1 ? (
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                  <span className="text-sm font-black text-slate-950">
                                    Página {couponCurrentPage} de{" "}
                                    {couponTotalPages}
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCouponPage(
                                          Math.max(1, couponCurrentPage - 1),
                                        )
                                      }
                                      disabled={couponCurrentPage <= 1}
                                      className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0_#0f172a] disabled:opacity-40 disabled:shadow-none"
                                    >
                                      Anterior
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCouponPage(
                                          Math.min(
                                            couponTotalPages,
                                            couponCurrentPage + 1,
                                          ),
                                        )
                                      }
                                      disabled={
                                        couponCurrentPage >= couponTotalPages
                                      }
                                      className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0_#0f172a] disabled:opacity-40 disabled:shadow-none"
                                    >
                                      Próxima
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <div className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
                              <p className="font-display text-lg font-black text-slate-950">
                                Nenhum cupom encontrado para "
                                {couponSearch.trim()}"
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-500">
                                Ajuste o termo da busca ou limpe o campo.
                              </p>
                            </div>
                          )
                        ) : (
                          <div className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
                            <p className="font-display text-lg font-black text-slate-950">
                              Nenhum cupom cadastrado ainda
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-500">
                              Crie o primeiro cupom pelo formulário ao lado.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </TabsContent>
            </Tabs>
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
      {deleteCouponTarget ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
          <div className="card-brutal max-w-md rounded-3xl bg-white p-6">
            <h3 className="font-display text-2xl font-black text-slate-950">
              Tem certeza que deseja excluir o cupom {deleteCouponTarget.code}?
            </h3>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              Esta ação não pode ser desfeita. Quem já usou o cupom não é
              afetado; ele só deixa de valer para novas compras.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteCouponTarget(null)}
                className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteCoupon()}
                disabled={deletingCouponId === deleteCouponTarget.id}
                className="rounded-full border-2 border-slate-900 bg-rose-100 px-4 py-2 text-sm font-black text-rose-800 disabled:opacity-60"
              >
                {deletingCouponId === deleteCouponTarget.id
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
