import { Router } from "express";

import { logAudit } from "../lib/audit";
import { deleteAvatarObject } from "../lib/avatarUpload";
import {
  carregarIdsDeAssinaturas,
  getChurnSnapshot,
  getMrrSnapshot,
  getSubscriberList,
} from "../lib/billingMetrics";
import { getOrCompute } from "../lib/cache";
import { env } from "../lib/env";
import {
  getDeferredRevenue,
  getFinanceSummary,
  getFinanceTimeseries,
} from "../lib/financeMetrics";
import { fetchUsdBrlRate } from "../lib/fx/ptax";
import {
  getPosthogHealth,
  getPaidFunnelSignals,
  getPosthogStats,
  getPosthogUserActivity,
} from "../lib/posthog";
import { fetchAuthTimes } from "../lib/authUsers";
import { getUsageRetention } from "../lib/usageRetention";
import { invalidateProStatusCache } from "../lib/proStatusCache";
import { emailQueue } from "../lib/queue";
import { cacheConnection } from "../lib/redis";
import { withRedisOpTimeout } from "../lib/redisOpTimeout";
import { stripeProvider } from "../providers/stripe";
import { getStripe } from "../lib/stripeClient";
import { syncBalanceTransactions } from "../lib/stripeSync";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { lerSessaoDeBoleto } from "../lib/boletoSession";
import {
  buildEnrichmentIndex,
  fetchUserListEnrichment,
  pickSubscription,
  resolveProSource,
  subscriptionGrantsPro,
  tallyProSources,
  type ProSourceTally,
  type SubscriptionRow,
} from "../lib/userListEnrichment";
import {
  emailAlreadyTakenError,
  mergedUserMetadata,
  normalizeEmail,
  validateNewEmail,
} from "../lib/emailChange";
import {
  agregarUsoDeIa,
  chamadasSemCustoMedido,
  custoTotalDeIa,
} from "../lib/aiUsageStats";
import { montarPainelDeAtencao } from "../lib/atencaoNecessaria";
import { CHARGE_SEM_DONO_CORTE_DIAS } from "../lib/financeSyncWindow";
import { calcularProblemas } from "../lib/healthBand";
import {
  assinaturaChegouAValer,
  maiorVazamento,
  montarFunil,
} from "../lib/paidFunnel";
import { contarPerfisTotal } from "../lib/profilesCount";
import { montarSerieDeCadastros } from "../lib/signupSeries";
import {
  diaBrasilia,
  inicioDoDiaBrasilia,
  somarDiaCivil,
} from "../../shared/brasiliaDay";
import {
  calcularVariacao,
  OVERVIEW_TZ_LABEL,
  parseOverviewWindow,
  resolverJanela,
  rotuloDeIntervalo,
} from "../lib/overviewWindow";
import {
  coletarTagueado,
  coletarTudo,
  paginateRange,
} from "../lib/paginate";
import { buildProfilePatch } from "../lib/profileEdit";
import {
  criarLimitadorDeReembolso,
  idempotencyKeyForRefund,
  stripeReasonFor,
  validateRefundRequest,
  type RefundReason,
} from "../lib/refund";
import {
  buildTransactionList,
  totalPagoCents,
  type DeclaredRefund,
  type FinanceRow,
} from "../lib/userTransactions";
import {
  devolucaoZeraOSaldo,
  precisaCancelarNaStripe,
  prefixoDeFalhaDeRevogacao,
  type AssinaturaParaRevogar,
  type GatilhoDeRevogacao,
  type RevocationFailure,
  type RevocationOutcome,
} from "../lib/proRevocation";
import {
  buildAuditHistory,
  type AuditLogRow,
  type CancellationRow,
  type RefundRow,
} from "../lib/userAuditHistory";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";
import { resolvePlanPriceCents } from "../lib/planPrice";
import bugsAdminRouter from "./adminBugs";
import contactListsRouter from "./adminContactLists";
import emailCampaignsRouter from "./adminEmailCampaigns";
import notificationsAdminRouter from "./adminNotifications";
import tasksAdminRouter from "./adminTasks";

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

// Campanhas de e-mail pra waitlist (aba Emails). Depois dos guards de admin.
router.use("/email-campaigns", emailCampaignsRouter);
router.use("/contact-lists", contactListsRouter);
// Notificacoes in-app (broadcast). Depois dos guards de admin.
router.use("/notifications", notificationsAdminRouter);
// Bugs & Erros (issues do Sentry + bug tracker). Depois dos guards de admin.
router.use("/bugs", bugsAdminRouter);
// Tarefas (board Kanban interno). Depois dos guards de admin. Montado em /crm e
// nao em /tasks para que o recurso "tarefa" fique em /crm/tasks: se o router
// morasse em /tasks, as tarefas teriam que ficar na raiz dele e /tasks/boards
// competiria com /tasks/:id, funcionando so pela ordem de declaracao.
router.use("/crm", tasksAdminRouter);

const EDITABLE_TABLES: Record<string, string[]> = {
  news: [
    "title",
    "summary",
    "url",
    "image_url",
    "source",
    "author",
    "published_at",
    "tags",
    "is_published",
  ],
  external_jobs: [
    "title",
    "company",
    "location",
    "remote",
    "seniority",
    "employment_type",
    "url",
    "description",
    "tags",
    "area_slug",
    "published_at",
    "is_published",
  ],
  events: [
    "title",
    "description",
    "starts_at",
    "ends_at",
    "location_label",
    "city",
    "state",
    "online",
    "url",
    "source",
    "tags",
    "is_published",
  ],
  areas: [
    "name",
    "short_description",
    "full_description",
    "tag",
    "tag_class",
    "icon",
    "color",
    "daily_tasks",
    "profile_indicated",
    "skills",
    "tools",
    "roles",
    "average_salary",
    "initial_roadmap",
    "projects",
    "free_courses",
    "essential_terms",
    "initial_tips",
    "is_pro",
    "is_published",
    "sort_order",
  ],
  technologies: [
    "name",
    "category",
    "description",
    "long_description",
    "icon",
    "color",
    "use_cases",
    "pros",
    "cons",
    "learning_path",
    "related_area_slugs",
    "market_demand",
    "difficulty",
    "beginner_friendly_score",
    "salary_context",
    "resources",
    "tools",
    "companies_using",
    "is_published",
    "sort_order",
  ],
  courses: [
    "title",
    "provider",
    "url",
    "area_slug",
    "technology_slugs",
    "level",
    "price_label",
    "is_free",
    "workload_hours",
    "certificate",
    "description",
    "tags",
    "language",
    "rating",
    "is_published",
  ],
  platforms: [
    "name",
    "url",
    "description",
    "price_label",
    "strengths",
    "limitations",
    "best_for",
    "tags",
    "rating",
    "is_published",
  ],
  projects: [
    "title",
    "description",
    "objective",
    "level",
    "area_slug",
    "tools",
    "simplified_steps",
    "portfolio_tips",
    "linkedin_suggestion",
    "tags",
    "is_published",
  ],
  roadmaps: [
    "title",
    "description",
    "area_slug",
    "level",
    "estimated_duration_weeks",
    "is_pro",
    "is_published",
    "sort_order",
  ],
  affiliates: [
    "name",
    "email",
    "code",
    "discount_percent",
    "commission_percent",
    "status",
    "notes",
    "commission_due_cents",
    "commission_paid_cents",
  ],
  // times_redeemed fica de fora de proposito: e contador do webhook
  // (increment_coupon_redemption), somente leitura no admin.
  coupons: [
    "code",
    "description",
    "discount_percent",
    "status",
    "valid_from",
    "valid_until",
    "max_redemptions",
    "applicable_plans",
  ],
};

function getSearchColumn(type: string) {
  return ["areas", "technologies", "platforms"].includes(type)
    ? "name"
    : "title";
}

function filterPayload(body: Record<string, unknown>, allowedFields: string[]) {
  const payload: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) payload[field] = body[field];
  }
  if ("slug" in body) payload.slug = body.slug;
  return payload;
}

// Loga a causa REAL do banco (code/message/details do Postgres/PostgREST) ANTES
// de trocar pelo db_error generico. createError cria um Error novo com a mensagem
// generica, entao sem este log o 500 chega ao servidor sem a causa raiz (foi
// exatamente isso que custou uma investigacao inteira: 42703 undefined_column
// escondido atras de "Erro ao buscar usuario"). O cliente continua recebendo so a
// mensagem generica; detalhe de schema nunca vaza para o browser.
function dbError(scope: string, error: unknown, clientMessage: string) {
  console.error(`[admin] db error (${scope}):`, error);
  return createError(500, "db_error", clientMessage);
}

type AuthUserLite = {
  email: string | null;
  lastSignInAt: string | null;
  createdAt: string | null;
  name: string | null;
};

// Resolve dados de Auth (email, last_sign_in_at, created_at, nome do metadata)
// de varios usuarios em UMA varredura paginada de listUsers, no lugar do
// anti-padrao de um getUserById por linha. last_sign_in_at so existe em
// auth.users (nao em profiles), por isso a varredura do Auth e necessaria aqui.
// Para o alvo de hoje (poucos assinantes ativos) a varredura e barata; se a base
// crescer muito, avaliar um RPC dedicado. Erro propaga, nunca vira mapa vazio.
async function fetchAuthUsersByIds(
  ids: string[],
): Promise<Map<string, AuthUserLite>> {
  const result = new Map<string, AuthUserLite>();
  if (ids.length === 0) return result;

  const wanted = new Set(ids);
  const perPage = 1000;
  let page = 1;
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;

    const users = data.users;
    for (const user of users) {
      if (!wanted.has(user.id)) continue;
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const metaName = typeof meta.name === "string" ? meta.name : null;
      result.set(user.id, {
        email: user.email ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
        createdAt: user.created_at ?? null,
        name: metaName,
      });
    }

    if (users.length < perPage || result.size === wanted.size) break;
    page += 1;
  }
  return result;
}

/**
 * Acesso Pro por origem, pela MESMA lib que a lista de usuarios usa.
 *
 * Reusa `buildEnrichmentIndex` + `tallyProSources` de propósito: o card da Visao
 * mostrava `count(subscriptions where status='active')` e ignorava o segundo
 * ramo de `is_user_pro`, entao exibia 62 onde 87 pessoas tinham acesso (medido
 * em 2026-07-31: 62 por assinatura, 25 por concessao, interseccao zero).
 * Escrever a contagem direto aqui seria a terceira montagem da regra de Pro
 * nesta base, e a que divergiria primeiro.
 *
 * Custo: duas leituras completas, das duas tabelas menores do dominio
 * (63 e 26 linhas hoje). Se qualquer uma passar do teto do PostgREST, o tally
 * encolhe em silencio — por isso as duas sao PAGINADAS.
 */
async function contarProPorOrigem(): Promise<ProSourceTally> {
  const assinaturas: SubscriptionRow[] = [];
  for await (const row of paginateRange<SubscriptionRow>(
    (from, to) =>
      supabaseAdmin
        .from("subscriptions")
        .select("user_id, status, created_at, current_period_end, plans(code)")
        .order("id", { ascending: true })
        .range(from, to),
    { errorLabel: "pro tally subscriptions" },
  )) {
    assinaturas.push(row);
  }

  const influencers = new Set<string>();
  for await (const row of paginateRange<{ user_id: string | null }>(
    (from, to) =>
      supabaseAdmin
        .from("influencers")
        .select("user_id")
        .is("revoked_at", null)
        .order("id", { ascending: true })
        .range(from, to),
    { errorLabel: "pro tally influencers" },
  )) {
    if (row.user_id) influencers.add(row.user_id);
  }

  return tallyProSources(
    buildEnrichmentIndex(assinaturas, influencers, new Date()),
  );
}

// SOBROU O REGISTRO DE AUDITORIA, e so ele.
//
// Ate a fatia 9 esta rota devolvia sete contadores (usuarios, assinaturas
// ativas, os tres ramos de acesso Pro, areas, cursos, chamadas de IA) mais o log
// recente, e servia cinco blocos da Visao. Todos aqueles blocos sairam ou foram
// substituidos: os contadores de gente e dinheiro viraram os cards de /overview
// (que os calcula com a MESMA lib, `buildEnrichmentIndex`), e areas e cursos nao
// eram exibidos em lugar nenhum. Medido no client antes de cortar: nenhum campo
// de `counts` tinha leitor, so o `recent_audit`.
//
// O que sai junto e o custo: cinco `count(*)` e a varredura paginada de
// `contarProPorOrigem`, que lia a base inteira de assinaturas e concessoes a
// cada carga do admin, para alimentar numeros que ninguem lia.
router.get("/dashboard", async (_req, res, next) => {
  try {
    const recentAudit = await supabaseAdmin
      .from("content_audit_logs")
      .select("action, resource_type, resource_slug, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentAudit.error) {
      return next(
        dbError("dashboard audit", recentAudit.error, "Erro ao carregar."),
      );
    }

    res.json({ data: { recent_audit: recentAudit.data || [] } });
  } catch (err) {
    next(err);
  }
});

// Cache da janela default (30d) do funil. Chave FIXA: o compute usa to=new Date()
// (muda a cada ms), entao sem chave estavel o hit rate seria 0. So a janela
// default entra aqui; janelas custom (from/to, ex.: ConversionDashboard) passam
// direto. TTL 5 min: funil de 30d nao muda de forma perceptivel minuto a minuto.
const POSTHOG_STATS_CACHE_TTL_S = 300;

// computedAt embutido na closure: roda no cache-write, entao fica congelado com
// o valor e servido pelo resto do TTL. E o horario REAL de calculo (nao "agora"
// no hit). Nao exige metadata no getOrCompute. So a janela default carrega isso;
// a custom e live. O shape de `data` no envelope nao muda (computedAt vai fora).
function getCachedPosthogStatsDefault() {
  return getOrCompute(
    "admincache:posthog-stats:default30d",
    POSTHOG_STATS_CACHE_TTL_S,
    async () => ({
      result: await getPosthogStats(),
      computedAt: new Date().toISOString(),
    }),
  );
}

// Estado do PostHog como union discriminado (not_configured | error | ok). A
// logica vive em lib/posthog.ts; erro nunca vira zero. O client sera migrado
// para ler o novo shape na proxima sessao.
router.get("/posthog-stats", async (req, res, next) => {
  try {
    // Periodo opcional (from/to ISO). Datas invalidas caem no default (30 dias)
    // do proprio getPosthogStats; nunca mascaram falha (erro real vira state error).
    const fromRaw = typeof req.query.from === "string" ? req.query.from : "";
    const toRaw = typeof req.query.to === "string" ? req.query.to : "";
    const fromDate = fromRaw ? new Date(fromRaw) : undefined;
    const toDate = toRaw ? new Date(toRaw) : undefined;
    const from =
      fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined;
    const to = toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined;
    // Janela default (sem from/to valido) le do cache compartilhado e expoe o
    // computedAt (horario real de calculo, congelado no cache-write). Janela
    // custom recalcula sempre (live), sem computedAt: e sempre "agora".
    if (from || to) {
      res.json({ data: await getPosthogStats({ from, to }) });
    } else {
      const { result, computedAt } = await getCachedPosthogStatsDefault();
      res.json({ data: result, computedAt });
    }
  } catch (err) {
    next(err);
  }
});

// Saude das integracoes, sem vazar segredos (so presenca/booleanos e o union do
// PostHog). Responde de vez as perguntas de ambiente em aberto do relatorio.
// Cacheado (TTL 3 min): presenca de env e alcance de servico mudam raramente, e
// evita repetir a sonda do PostHog e o ping de Redis a cada carga da aba. Chave
// fixa (sem params). Fail-open do getOrCompute: Redis fora = compute roda igual.
const INTEGRATIONS_HEALTH_CACHE_TTL_S = 180;

/**
 * Compute da saude das integracoes, EXTRAIDO para ser compartilhado.
 *
 * A faixa de saude e o painel antigo consomem exatamente o mesmo resultado, sob
 * a MESMA chave de cache: assim a faixa nao acrescenta sonda nenhuma ao custo da
 * pagina, ela reaproveita a que ja estava sendo feita. Duas sondas do PostHog
 * por carga seria o oposto do que a fatia pede.
 */
function computarSaudeDeIntegracoes() {
  return getOrCompute(
    "admincache:integrations-health",
    INTEGRATIONS_HEALTH_CACHE_TTL_S,
    async () => {
    // Sonda leve (1 query), nao o funil completo: o painel so le state/hasData.
    const posthog = await getPosthogHealth();

    let redis: { configured: boolean; ok: boolean } = {
      configured: Boolean(env.redisUrl),
      ok: false,
    };
    if (cacheConnection) {
      try {
        const pong = await cacheConnection.ping();
        redis = { configured: true, ok: pong === "PONG" };
      } catch {
        redis = { configured: true, ok: false };
      }
    }

    return {
      billingEnabled: env.billingEnabled,
      posthog,
      stripe: {
        secretKey: Boolean(env.stripeSecretKey),
        webhookSecret: Boolean(env.stripeWebhookSecret),
        priceIds: {
          pro_monthly: Boolean(env.stripePriceIds.pro_monthly),
          pro_semiannual: Boolean(env.stripePriceIds.pro_semiannual),
          pro_annual: Boolean(env.stripePriceIds.pro_annual),
        },
      },
      redis,
    resend: { apiKey: Boolean(env.resendApiKey) },
      };
    },
  );
}

// FAIXA DE SAUDE: os oito sinais dos dois cartoes antigos, num lugar so, mais
// duas coisas que ninguem via.
//
// CUSTO. A faixa NAO acrescenta sonda nenhuma: ela chama
// `computarSaudeDeIntegracoes`, que usa a MESMA chave de cache do painel antigo
// (TTL 180s), e reaproveita o ping de banco que o /api/health ja fazia. As duas
// consultas novas sao a tabela de snapshots (16 linhas) e os boletos pendentes
// (1 linha hoje), as duas triviais. Medido: 358-599ms para o ping de banco, que
// e a peca mais cara, e ela ja existia.
//
// POR QUE A CHECAGEM GERAL DE CRON NAO ENTROU. Medi: `cron_run_logs` tem 12.541
// linhas e as ULTIMAS 1000 cobrem apenas 23 horas (tres jobs rodam de 5 em 5
// minutos e dominam a janela). Isso quebra a checagem geral de duas formas:
//
//   (a) CUSTO: transferir 1000 linhas por checagem custa mais que os dois
//       cartoes que a faixa substitui, o que a fatia proibe;
//   (b) FURO, e este e o pior: como a lista de jobs seria DERIVADA da janela, um
//       job parado ha mais de 23h simplesmente SOME dela, e a faixa nao
//       reportaria nada. Seria um instrumento que falha PASSANDO — exatamente a
//       classe que o CLAUDE.md documenta.
//
// Uma checagem geral honesta exige um REGISTRO ESTAVEL de jobs esperados (com a
// cadencia de cada um), e ele nao existe: derivar da agenda do pg_cron seria uma
// lista escrita a mao, que e o caso degenerado da mesma classe. Fica como fatia
// propria. O snapshot entra porque tem sinal barato e ESTAVEL: a propria tabela
// de snapshots, de 16 linhas, cuja ausencia de linha nova E o alarme.
/**
 * Soma as cobrancas sem dono.
 *
 * FALHA DE LEITURA NAO PODE VIRAR "esta tudo bem", e por isso esta funcao
 * recebe o envelope inteiro e LANCA no erro, em vez de receber `data ?? []`.
 * O supabase-js devolve `{ data: null, error }` sem lancar, entao ler `data`
 * direto transformaria erro do PostgREST em zero, e zero aqui APAGA o aviso.
 * E o `contarLinhas` devolvendo -1 do CLAUDE.md com o sinal trocado: falha de
 * infra contada como sucesso de saude. Lancando, a faixa cai no estado
 * "indisponivel" que ela ja sabe mostrar.
 */
function agregarChargesSemDono(resposta: {
  data: Array<{ gross_cents: number | null }> | null;
  error: { message: string } | null;
}): { count: number; grossCents: number } {
  if (resposta.error) {
    throw new Error(
      `leitura de cobrancas sem dono falhou: ${resposta.error.message}`,
    );
  }
  const linhas = resposta.data ?? [];
  return {
    count: linhas.length,
    grossCents: linhas.reduce((soma, l) => soma + (l.gross_cents ?? 0), 0),
  };
}

const HEALTH_BAND_CACHE_TTL_S = 60;

router.get("/health-band", async (_req, res, next) => {
  try {
    const data = await getOrCompute(
      "admincache:health-band",
      HEALTH_BAND_CACHE_TTL_S,
      async () => {
        const [integracoes, dbPing, ultimoSnapshot, pendentes, fila, semDono] =
          await Promise.all([
            computarSaudeDeIntegracoes(),
            // Ping de banco, o mesmo do /api/health. Erro aqui NAO derruba a
            // faixa: vira o sinal "database" apagado, que e o que ele significa.
            (async (): Promise<string> => {
              try {
                const { error } = await supabaseAdmin
                  .from("profiles")
                  .select("user_id")
                  .limit(1);
                return error ? "error" : "ok";
              } catch {
                return "error";
              }
            })(),
            supabaseAdmin
              .from("subscription_snapshots")
              .select("snapshot_date")
              .order("snapshot_date", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabaseAdmin
              .from("subscriptions")
              .select("created_at, plans(code, price_cents)")
              .eq("status", "pending"),
            // COBRANCA SEM DONO. No MESMO Promise.all das demais: a faixa ja
            // espera pela sonda mais lenta (PostHog), entao uma consulta a mais
            // em paralelo nao acrescenta tempo de parede.
            //
            // O filtro por `type=charge` e o que mantem payout fora da conta
            // (payout nao tem dono POR DEFINICAO, e ficar sem e o correto), e
            // tambem refund e dispute, que tem caminho proprio de atribuicao
            // pela cobranca-mae.
            //
            // Sem `count: exact`: a soma em reais exige as linhas de qualquer
            // jeito, e o conjunto e minusculo por construcao (se nao fosse, o
            // problema seria outro e maior).
            // FILA DE E-MAILS: so os contadores que viram acao. Sonda com teto
            // (withRedisOpTimeout) e falha vira `null`, o estado "indisponivel",
            // que NAO e zero: zero afirmaria que nao ha falha nenhuma.
            (async (): Promise<{ failed: number; waiting: number } | null> => {
              if (!emailQueue) return null;
              try {
                const [failed, waiting] = await withRedisOpTimeout(
                  Promise.all([
                    emailQueue.getFailedCount(),
                    emailQueue.getWaitingCount(),
                  ]),
                  "health-band-queue",
                );
                return { failed, waiting };
              } catch {
                return null;
              }
            })(),
            supabaseAdmin
              .from("finance_transactions")
              .select("gross_cents")
              .eq("type", "charge")
              .is("user_id", null)
              .lt(
                "occurred_at",
                new Date(
                  Date.now() - CHARGE_SEM_DONO_CORTE_DIAS * 24 * 60 * 60 * 1000,
                ).toISOString(),
              ),
          ]);

        const faltandoStripe: string[] = [];
        if (!integracoes.stripe.secretKey) faltandoStripe.push("secret key");
        if (!integracoes.stripe.webhookSecret)
          faltandoStripe.push("webhook secret");
        for (const [plano, presente] of Object.entries(
          integracoes.stripe.priceIds,
        )) {
          if (!presente) faltandoStripe.push(`price ${plano}`);
        }

        const snapshotDate =
          (ultimoSnapshot.data as { snapshot_date: string } | null)
            ?.snapshot_date ?? null;
        // `snapshot_date` e coluna `date`: comparacao de dia, sem converter para
        // instante (ver shared/brasiliaDay.ts para por que isso importa).
        const hoje = diaBrasilia(new Date().toISOString());
        const snapshotStaleDays =
          snapshotDate && hoje
            ? Math.round(
                (Date.parse(`${hoje}T00:00:00Z`) -
                  Date.parse(`${snapshotDate}T00:00:00Z`)) /
                  86400000,
              )
            : null;

        // `plans` chega como objeto ou array conforme a cardinalidade que o
        // PostgREST infere; `unwrap` cobre as duas sem apostar numa.
        const boletosPendentes = (
          (pendentes.data ?? []) as unknown as Array<{
            created_at: string | null;
            plans:
              | { price_cents: number | null }
              | Array<{ price_cents: number | null }>
              | null;
          }>
        ).map((row) => {
          const plano = Array.isArray(row.plans) ? row.plans[0] : row.plans;
          return {
            valorCents: plano?.price_cents ?? 0,
            emitidoEm: row.created_at,
          };
        });

        const problemas = calcularProblemas({
          database: dbPing,
          openai: env.openaiApiKey ? "ok" : "error",
          currents: env.currentsApiKey ? "ok" : "error",
          jooble: env.joobleApiKey ? "ok" : "error",
          posthogState: integracoes.posthog?.state ?? null,
          stripeFaltando: faltandoStripe,
          redisConfigured: integracoes.redis.configured,
          redisOk: integracoes.redis.ok,
          resendApiKey: integracoes.resend.apiKey,
          snapshotStaleDays,
          boletosPendentes,
          filaDeEmail: fila,
          chargesSemDono: agregarChargesSemDono(
            semDono as {
              data: Array<{ gross_cents: number | null }> | null;
              error: { message: string } | null;
            },
          ),
        });

        return { ok: problemas.length === 0, problemas };
      },
    );

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/integrations/health", async (_req, res, next) => {
  try {
    res.json({ data: await computarSaudeDeIntegracoes() });
  } catch (err) {
    next(err);
  }
});

router.get("/churn-risk", async (_req, res, next) => {
  try {
    // PAGINADO: varre TODAS as ativas (62 hoje). Truncar tira gente da lista de
    // risco de churn sem nada indicar que a lista ficou menor.
    const { data: subscriptions, error } = await coletarTagueado<{
      user_id: string | null;
      status: string;
      plans: unknown;
    }>(
      (from, to) =>
        supabaseAdmin
          .from("subscriptions")
          .select("user_id, status, plans(code, name, price_cents)")
          .eq("status", "active")
          .order("id", { ascending: true })
          .range(from, to),
      "churn-risk subscriptions",
    );

    // Propaga o erro (nao mascara com lista vazia): o client sera ajustado para
    // exibir estado de erro na proxima sessao.
    if (error)
      return next(
        // TODO(Ana)
        dbError("subscriptions fetch", error, "Erro ao buscar assinaturas."),
      );

    const activeSubscriptions = (subscriptions || []).filter(
      (subscription) => subscription.user_id,
    );
    const userIds = activeSubscriptions.map(
      (subscription) => subscription.user_id as string,
    );

    const { data: profiles, error: profilesError } = userIds.length
      ? await supabaseAdmin
          .from("profiles")
          .select("user_id, name, email")
          .in("user_id", userIds)
      : { data: [], error: null };
    if (profilesError)
      return next(
        // TODO(Ana)
        dbError("churn-risk profiles", profilesError, "Erro ao buscar perfis."),
      );
    const profilesByUserId = new Map(
      (profiles || []).map((profile) => [profile.user_id, profile]),
    );

    // Um unico batch de Auth para todos os assinantes ativos, no lugar do loop
    // Promise.all de getUserById (uma ida ao Auth por linha).
    const authByUserId = await fetchAuthUsersByIds(userIds);

    const inactiveThresholdMs = 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const users = activeSubscriptions.map((subscription) => {
      const userId = subscription.user_id as string;
      const authUser = authByUserId.get(userId);
      if (!authUser) return null;

      const lastSeenAt = authUser.lastSignInAt || authUser.createdAt;
      if (!lastSeenAt) return null;

      const daysInactive = Math.floor(
        (now - new Date(lastSeenAt).getTime()) / (24 * 60 * 60 * 1000),
      );
      if (
        daysInactive < 14 ||
        now - new Date(lastSeenAt).getTime() < inactiveThresholdMs
      )
        return null;

      const profile = profilesByUserId.get(userId);
      const plan = Array.isArray(subscription.plans)
        ? subscription.plans[0]
        : subscription.plans;
      // Preco do planPricing.ts (fonte unica); fallback defensivo para o banco (o
      // helper grita no Sentry se o code for real e faltar no modulo).
      const priceCents = resolvePlanPriceCents(
        plan?.code,
        Number(plan?.price_cents || 0),
        "churn-risk",
      );

      return {
        name: String(
          profile?.name || authUser.name || authUser.email || "Usuário",
        ),
        email: String(profile?.email || authUser.email || ""),
        days_inactive: daysInactive,
        mrr: priceCents / 100,
      };
    });

    res.json({
      data: users
        .filter(
          (
            user,
          ): user is {
            name: string;
            email: string;
            days_inactive: number;
            mrr: number;
          } => Boolean(user),
        )
        .sort((a, b) => b.days_inactive - a.days_inactive)
        .slice(0, 10),
    });
  } catch (err) {
    next(err);
  }
});

// Retencao de USO da aba Retencao: distribuicao de dias desde o ultimo acesso e
// de frequencia de navegacao sobre a base inteira. getUsageRetention ja loga o
// erro original e retorna estado union (not_configured/error/ok); nunca zero por
// falha. So leitura.
router.get("/usage-retention", async (_req, res, next) => {
  try {
    const result = await getUsageRetention();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// Agrega os motivos de cancelamento (subscription_cancellations) para a aba
// Retencao. SO leitura. Considera status IN ('scheduled','completed'): 'reverted'
// e desistencia (a pessoa deu o motivo mas FICOU), entao nao conta como
// cancelamento, senao inflaria a distribuicao com quem nao cancelou. Percentual e
// sobre o total considerado; linhas sem reason_code entram no total mas nao em
// nenhum bucket (a diferenca ate 100% e "nao informado").
const CANCELLATION_REASON_CODES = [
  "expensive",
  "unused",
  "missing_feature",
  "paused",
  "other",
] as const;

// OS SEIS CARDS DA VISAO, para uma janela.
//
// UMA rota em vez de acrescentar `window` a quatro endpoints existentes. O
// motivo nao e economia de requisicao: e que a JANELA precisa significar a mesma
// coisa nos seis numeros, e espalhar a resolucao dela por /dashboard,
// /ai-stats, /finance/summary e /billing-metrics criaria quatro interpretacoes
// da mesma palavra. Aqui `resolverJanela` roda uma vez e todo mundo recebe o
// mesmo intervalo. Os endpoints antigos ficam INTOCADOS, porque outras abas
// dependem deles.
//
// NAO HA ARITMETICA NOVA AQUI. Cada numero vem de quem ja sabia calcula-lo:
//
//   novos usuarios     count em profiles.created_at (o unico calculo proprio, e
//                      e uma contagem)
//   acesso Pro         contarProPorOrigem -> buildEnrichmentIndex, a MESMA lib
//                      da lista de usuarios
//   MRR e em risco     getMrrSnapshot (o `atRisk` sai do mesmo laco)
//   receita            getFinanceSummary
//   custo de IA        agregarUsoDeIa, a MESMA funcao que /ai-stats usa
//
// DELTA POR CARD, nunca por pagina. As series tem idades diferentes (perfis
// desde 04/05, receita desde 13/07, snapshot desde 16/07), entao uma regra
// global marcaria como indisponivel um Δ que existe e vice-versa. Cada card
// declara a propria disponibilidade e, quando nao ha, o MOTIVO.
router.get("/overview", async (req, res, next) => {
  try {
    const janela = resolverJanela(parseOverviewWindow(req.query.window));

    const contarPerfis = async (
      desde: string | null,
      ate: string,
    ): Promise<number> => {
      let q = supabaseAdmin
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .lte("created_at", ate);
      if (desde) q = q.gte("created_at", desde);
      const { count, error } = await q;
      if (error) throw new Error(`overview profiles: ${error.message}`);
      return count ?? 0;
    };

    /** Data do registro mais antigo de uma tabela; null se estiver vazia. */
    const inicioDaSerie = async (
      tabela: "profiles" | "finance_transactions",
      coluna: "created_at" | "occurred_at",
    ): Promise<string | null> => {
      const { data, error } = await supabaseAdmin
        .from(tabela)
        .select(coluna)
        .order(coluna, { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(`overview ${tabela}: ${error.message}`);
      return (data as Record<string, string> | null)?.[coluna] ?? null;
    };

    const [
      novosAtual,
      novosAnterior,
      usuariosTotais,
      perfisDesde,
      proTally,
      mrr,
      receitaAtual,
      receitaAnterior,
      receitaDesde,
      iaStats,
    ] = await Promise.all([
      contarPerfis(janela.startIso, janela.endIso),
      janela.previousStartIso
        ? contarPerfis(janela.previousStartIso, janela.previousEndIso!)
        : Promise.resolve(null),
      // TOTAL SEM RECORTE, pela MESMA funcao que serve o contador publico da
      // home (server/lib/profilesCount.ts). Nao e `contarPerfis(null, endIso)`:
      // aquilo tem `.lte(created_at, agora)` e ja nao contaria uma linha com
      // `created_at` nulo. Sao dois numeros que precisam bater com a home, e a
      // unica forma de garantir isso e nao existir uma segunda query.
      contarPerfisTotal(),
      inicioDaSerie("profiles", "created_at"),
      contarProPorOrigem(),
      getMrrSnapshot(),
      getFinanceSummary({
        from: new Date(janela.startIso ?? 0),
        to: new Date(janela.endIso),
      }),
      janela.previousStartIso
        ? getFinanceSummary({
            from: new Date(janela.previousStartIso),
            to: new Date(janela.previousEndIso!),
          })
        : Promise.resolve(null),
      inicioDaSerie("finance_transactions", "occurred_at"),
      agregarUsoDeIa(janela.startIso ?? new Date(0).toISOString()),
    ]);

    res.json({
      data: {
        window: janela.window,
        windowStartIso: janela.startIso,
        windowEndIso: janela.endIso,
        // INTERVALO EM DIAS CIVIS, e o ROTULO ja pronto.
        //
        // O rotulo vem do servidor para a tela nao reimplementar fuso: sao seis
        // cards e dois graficos, e cada um formatando por conta propria seria
        // uma chance nova de o MESMO intervalo aparecer com dois nomes. Com
        // `tz` declarado ao lado, o badge pode dizer "16 jul - 14 ago
        // (Brasilia)" sem que o client precise saber onde e Brasilia.
        windowFirstDay: janela.primeiroDiaCivil,
        windowLastDay: janela.ultimoDiaCivil,
        windowLabel: rotuloDeIntervalo(
          janela.primeiroDiaCivil,
          janela.ultimoDiaCivil,
        ),
        previousLabel:
          janela.previousPrimeiroDiaCivil && janela.previousUltimoDiaCivil
            ? rotuloDeIntervalo(
                janela.previousPrimeiroDiaCivil,
                janela.previousUltimoDiaCivil,
              )
            : null,
        tz: OVERVIEW_TZ_LABEL,
        cards: {
          // TOTAL, SEM JANELA. Existe porque a unica forma de o admin ver o
          // total era escolher "Tudo" no seletor, o que muda os outros cinco
          // cards junto; e porque a ausencia dele foi lida como divergencia
          // contra a home (4.790 vs 5.456), quando os dois numeros estavam
          // certos e respondiam perguntas diferentes.
          //
          // `value` pode ser NULL: e a degradacao silenciosa do Supabase que o
          // contador da home ja tratava. Null e ausencia, nunca 0 — um "0
          // usuarios" no painel e indistinguivel de base vazia.
          usuariosTotais: { value: usuariosTotais },
          novosUsuarios: {
            value: novosAtual,
            historicoDesde: perfisDesde,
            change: calcularVariacao({
              janela,
              atual: novosAtual,
              anterior: novosAnterior,
              historicoDesdeIso: perfisDesde,
            }),
          },
          // ESTADO ATUAL, nao serie: quantas pessoas tem Pro AGORA. O Δ dele sai
          // do historico de snapshots (rota /subscription-history), que a tela
          // ja consulta para o grafico; duplicar aqui seria uma segunda fonte.
          //
          // `both` passa a ir junto. Ele SEMPRE foi calculado por
          // `tallyProSources` e era descartado aqui, e o resultado e que a tela
          // exibia 96 + 25 e o total era 124: as 3 pessoas com assinatura E
          // concessao de influencer nao apareciam em lugar nenhum. Os tres ramos
          // sao mutuamente exclusivos e `total` e a UNIAO — quem le nao deve
          // somar nada.
          acessoPro: {
            bySubscription: proTally.bySubscription,
            byInfluencer: proTally.byInfluencer,
            both: proTally.both,
            total: proTally.total,
          },
          // `trialingCount` e `arpuCents` tambem ja eram calculados por
          // getMrrSnapshot e descartados. Trial NAO paga e por isso fica FORA do
          // MRR, do ARPU e da distribuicao por plano; ele vem separado para a
          // tela poder mostrar um chip em vez de somar no headline de pagantes.
          // `arpuCents` e null quando nao ha assinante ativo (ausencia, nao 0).
          mrr: {
            value: mrr.mrrCents,
            activeCount: mrr.activeCount,
            trialingCount: mrr.trialingCount,
            arpuCents: mrr.arpuCents,
          },
          // BRUTO segue sendo o principal (e a base do Simples). O liquido vem
          // ao lado porque bruto sozinho afirma uma receita que nao entrou: na
          // janela medida em 2026-08-14 eram R$ 4.213,15 brutos contra
          // R$ 3.874,99 liquidos, com R$ 189,42 de taxa e R$ 148,74 devolvidos.
          // Os tres numeros JA eram calculados por getFinanceSummary no mesmo
          // laco; nenhum e aritmetica nova.
          receita: {
            value: receitaAtual.receitaBrutaCents,
            reembolsosCents: receitaAtual.reembolsosCents,
            taxasCents: receitaAtual.taxasStripeCents,
            liquidaCents: receitaAtual.receitaLiquidaCents,
            historicoDesde: receitaDesde,
            change: calcularVariacao({
              janela,
              atual: receitaAtual.receitaBrutaCents,
              anterior: receitaAnterior?.receitaBrutaCents ?? null,
              historicoDesdeIso: receitaDesde,
            }),
          },
          // RECEITA EM RISCO e estado atual, nao serie: sao as assinaturas que
          // JA tem data de saida. Nao tem Δ nem janela, e por isso a tela precisa
          // dizer que ela ignora o seletor.
          receitaEmRisco: {
            count: mrr.atRisk.count,
            mrrCents: mrr.atRisk.mrrCents,
            percentOfMrr:
              mrr.mrrCents > 0
                ? (mrr.atRisk.mrrCents / mrr.mrrCents) * 100
                : null,
          },
          // CUSTO DE IA EM DOLAR, e o campo antigo continua junto por um ciclo.
          //
          // `valueBrl` era o nome, e o valor NUNCA foi em real: sai de
          // `MODEL_PRICING`, cotada em US$/1M tokens. O client formatava com
          // `currency: "BRL"` e exibia R$ onde era US$.
          //
          // EXPAND/CONTRACT, nao troca seca: aba de admin aberta desde antes do
          // deploy segue lendo `valueBrl` ate recarregar, e nao existe prazo
          // para isso (CLAUDE.md, "Renomear campo de resposta"). Os dois nomes
          // carregam o MESMO numero.
          // REMOVER `valueBrl` a partir de 2026-09-15, no mesmo commit que
          // atualizar server/lib/janelaDeDeployInversa.test.ts.
          custoIa: {
            valueUsd: custoTotalDeIa(iaStats),
            valueBrl: custoTotalDeIa(iaStats),
            // Piso declarado: quantas chamadas rodaram e nao tem custo medido.
            // Vai ao lado, nunca somado.
            chamadasSemCustoMedido: chamadasSemCustoMedido(iaStats),
            // Null quando AI_COST_USD_BRL_RATE nao esta definida. Ausencia, nao
            // conversao por 1.
            valorEmBrl:
              env.aiCostUsdBrlRate !== null
                ? custoTotalDeIa(iaStats) * env.aiCostUsdBrlRate
                : null,
            cotacaoUsdBrl: env.aiCostUsdBrlRate,
          },
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// FUNIL ATE O ASSINANTE PAGO.
//
// Junta PostHog (comportamento) com o banco (pagamento). A defesa da juncao
// inteira mora em `server/lib/paidFunnel.ts`; aqui fica so o que precisa de I/O.
//
// JANELA FIXA DE 30 DIAS, e ela NAO segue o seletor de periodo (decisao da
// fatia 5, mantida): o PostHog e cacheado por chave fixa e a aba Conversao ja
// oferece as janelas longas. O importante e que o banco use A MESMA janela, e
// usa: `created_at` filtrado no mesmo intervalo que vai para o HogQL.
//
// DEGRADA SEM CAIR. Se o PostHog estiver fora, os passos de comportamento somem
// e o passo do BANCO continua: "63 assinaturas pagas em 30 dias" e um fato que
// nao depende do PostHog, e apaga-lo por causa de uma sonda seria perder o unico
// numero da tela que vem de dentro de casa.
const PAID_FUNNEL_CACHE_TTL_S = 300;
const PAID_FUNNEL_WINDOW_DAYS = 30;

router.get("/paid-funnel", async (_req, res, next) => {
  try {
    const { result, computedAt } = await getOrCompute(
      "admincache:paid-funnel:default30d",
      PAID_FUNNEL_CACHE_TTL_S,
      async () => ({
        result: await computarFunilPago(),
        computedAt: new Date().toISOString(),
      }),
    );
    res.json({ data: result, computedAt });
  } catch (err) {
    next(err);
  }
});

// ATENCAO NECESSARIA: o que pede acao humana AGORA. Substitui "Eventos
// recentes", que listava edicoes de conteudo — historico, nao decisao.
//
// SO LEITURA, e isso e uma propriedade que o codigo garante, nao uma intencao:
// a rota le `billing_orphan_payments`, ela NAO chama `detectOrphanPayments`.
// Quem varre a Stripe e persiste e o cron. Uma rota de painel que escrevesse
// seria a repeticao do erro de 2026-08-14 documentado em
// docs/postmortems-instrumentos.md ("somente leitura e propriedade da funcao").
//
// CACHE de 60s, mais curto que os 300s do funil: estes numeros existem para
// alguem agir, e agir sobre estado de tres minutos atras e pior que esperar.
const ATENCAO_CACHE_TTL_S = 60;

router.get("/attention", async (_req, res, next) => {
  try {
    const { result, computedAt } = await getOrCompute(
      "admincache:attention:v1",
      ATENCAO_CACHE_TTL_S,
      async () => ({
        result: await montarPainelDeAtencao(),
        computedAt: new Date().toISOString(),
      }),
    );
    res.json({ data: result, computedAt });
  } catch (err) {
    next(err);
  }
});

async function computarFunilPago() {
  const to = new Date();
  const from = new Date(
    to.getTime() - PAID_FUNNEL_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  // As duas leituras em paralelo, e a do PostHog NAO derruba a do banco: o
  // estado dela e um union, nunca uma excecao.
  const [sinais, assinaturas] = await Promise.all([
    getPaidFunnelSignals({ from, to }),
    coletarTudo<{
      user_id: string | null;
      status: string;
      current_period_start: string | null;
      plans:
        | { price_cents: number | null }
        | Array<{ price_cents: number | null }>
        | null;
    }>(
      (inicio, fim) =>
        supabaseAdmin
          .from("subscriptions")
          .select("user_id, status, current_period_start, plans(price_cents)")
          .gte("created_at", from.toISOString())
          .lte("created_at", to.toISOString())
          .order("created_at", { ascending: true })
          .range(inicio, fim),
      "paid funnel subscriptions",
    ),
  ]);

  const pagantes = new Set<string>();
  let boletosPendentes = 0;
  let boletosPendentesCents = 0;
  for (const linha of assinaturas) {
    if (assinaturaChegouAValer(linha)) {
      if (linha.user_id) pagantes.add(linha.user_id);
      continue;
    }
    // NAO PAGOU AINDA. Hoje isso e o boleto emitido e nao compensado: nao e
    // conversao (nao entrou dinheiro) e nao e vazamento (o prazo nao venceu).
    // Sai do funil e volta declarado, com o valor parado.
    boletosPendentes += 1;
    const plano = Array.isArray(linha.plans) ? linha.plans[0] : linha.plans;
    boletosPendentesCents += plano?.price_cents ?? 0;
  }

  const janela = {
    from: from.toISOString(),
    to: to.toISOString(),
    days: PAID_FUNNEL_WINDOW_DAYS,
  };

  // BANCO SEM POSTHOG: sem os passos de comportamento nao ha funil, mas o fato
  // do banco continua de pe e volta sozinho.
  if (sinais.state !== "ok") {
    return {
      janela,
      posthog: sinais,
      steps: [],
      biggestLeak: null,
      pagantesNaJanela: pagantes.size,
      assinantesSemRastro: null,
      retornos: null,
      boletosPendentes: {
        count: boletosPendentes,
        cents: boletosPendentesCents,
      },
      truncated: false,
    };
  }

  const iniciaram = new Set(sinais.signals.checkoutIds);
  // A INTERSECAO e o ultimo passo: quem iniciou checkout E pagou, as duas coisas
  // dentro da janela. Ver paidFunnel.ts para por que nao e a razao dos totais.
  const pagantesComRastro = Array.from(pagantes).filter((id) =>
    iniciaram.has(id),
  );
  const steps = montarFunil({
    visitantes: sinais.signals.visitantes,
    cadastros: sinais.signals.cadastros,
    checkouts: iniciaram.size,
    pagantesComRastro: pagantesComRastro.length,
  });

  const retornaram = new Set(sinais.signals.retornoIds);
  return {
    janela,
    posthog: { state: "ok" as const },
    steps,
    biggestLeak: maiorVazamento(steps),
    pagantesNaJanela: pagantes.size,
    // Quem pagou e nao aparece no PostHog. NAO entra no funil (nao ha rastro para
    // entrar), e nao e erro: bloqueador de script e o suspeito obvio. Volta
    // separado porque some-lo ao passo final produziria uma conversao sobre uma
    // populacao que nunca esteve no denominador.
    assinantesSemRastro: pagantes.size - pagantesComRastro.length,
    // RETORNO DA STRIPE SEM CONCLUIR: nao e um passo do funil. Medido, todo mundo
    // que abandonou tambem iniciou (subconjunto), e parte deles assinou depois.
    // Como passo, duplicaria gente; como anotacao do passo de checkout, informa.
    retornos: {
      pessoas: retornaram.size,
      converteramDepois: Array.from(retornaram).filter((id) => pagantes.has(id))
        .length,
    },
    boletosPendentes: { count: boletosPendentes, cents: boletosPendentesCents },
    truncated: sinais.signals.truncated,
  };
}

// SERIE DIARIA DE CADASTROS.
//
// CUSTO E CACHE. Nao ha agregacao por dia no banco, entao a rota le
// `profiles.created_at` da janela e agrupa em memoria. Medido em 2026-08-01:
// ~3.4k linhas em 30 dias, uma pagina de 1000 custa 650-1700ms, entao a
// varredura completa fica em 4 paginas. Por isso o resultado vive atras de um
// cache de 300s: a serie muda uma vez por dia no que importa, e o custo por
// carga de pagina passa a ser proximo de zero.
//
// A evolucao natural, se doer, e uma funcao de agregacao no banco devolvendo ~30
// linhas em vez de 3.4k. Nao entrou aqui porque exigiria migration, com a ordem
// de deploy e a assercao comportamental que ela implica, para um custo que o
// cache ja resolve. Mesmo raciocinio do /ai-stats.
const SIGNUP_HISTORY_CACHE_TTL_S = 300;

router.get("/signup-history", async (req, res, next) => {
  try {
    const janelaId = parseOverviewWindow(req.query.window);

    const data = await getOrCompute(
      `admincache:signup-history:${janelaId}`,
      SIGNUP_HISTORY_CACHE_TTL_S,
      async () => {
        // MESMA `resolverJanela` DOS CARDS. Antes esta rota calculava o proprio
        // `hoje` e o proprio `inicio`, e os cards calculavam instantes UTC
        // deslizantes: duas definicoes de "ultimos 30 dias" na mesma tela, 182
        // cadastros de diferenca medidos em 2026-08-14. Agora ha uma.
        const janela = resolverJanela(janelaId);
        const hoje = janela.ultimoDiaCivil;

        // Primeiro cadastro da base: e ele que define o inicio real de "tudo", e
        // e o que a tela mostra em vez de fingir uma janela que nao existe.
        const { data: primeiro, error: primeiroErro } = await supabaseAdmin
          .from("profiles")
          .select("created_at")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (primeiroErro) throw primeiroErro;

        const primeiroDia =
          diaBrasilia(
            (primeiro as { created_at: string } | null)?.created_at ?? null,
          ) ?? hoje;

        const inicioPedido = janela.primeiroDiaCivil ?? primeiroDia;
        // A janela nunca comeca antes do primeiro cadastro: inventar dias
        // anteriores a base seria desenhar zeros que nao sao medicao.
        const inicio = inicioPedido < primeiroDia ? primeiroDia : inicioPedido;

        // FAIL-LOUD: erro propaga e a rota devolve 500. Serie vazia por falha
        // silenciosa desenharia um grafico plano, que afirma que ninguem se
        // cadastrou.
        const linhas = await coletarTudo<{ created_at: string }>(
          (from, to) =>
            supabaseAdmin
              .from("profiles")
              .select("created_at")
              // CORTE EXATO no instante em que o dia civil `inicio` comeca em
              // Brasilia, pela MESMA funcao que os cards usam
              // (`inicioDoDiaBrasilia`).
              //
              // Antes era `${inicio}T00:00:00Z`, ou seja, meia-noite UTC, com um
              // comentario explicando que a folga de 3h era inofensiva porque o
              // agrupamento por dia de Brasilia descartava o excedente. Estava
              // certo para o GRAFICO e errado como limite compartilhado: o card
              // conta linhas, nao agrupa, entao a mesma folga que o grafico
              // descarta o card somaria. Um limite, uma funcao.
              .gte("created_at", inicioDoDiaBrasilia(inicio))
              .order("created_at", { ascending: true })
              .range(from, to),
          "signup history",
        );

        const points = montarSerieDeCadastros({
          criadosEm: linhas.map((l) => l.created_at),
          inicio,
          fim: hoje,
          hoje,
        });

        return {
          window: janelaId,
          points,
          firstSignupDate: primeiroDia,
          lastDate: hoje,
          // MESMO rotulo e MESMO fuso dos cards, pela mesma funcao. E o que
          // permite a tela afirmar, no badge, que os dois blocos falam do mesmo
          // intervalo — em vez de os dois dizerem "ultimos 30 dias" e medirem
          // coisas diferentes, que foi o defeito.
          windowLabel: rotuloDeIntervalo(inicio, hoje),
          tz: OVERVIEW_TZ_LABEL,
        };
      },
    );

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// HISTORICO DIARIO DE ASSINATURAS, de subscription_snapshots.
//
// A tabela roda no cron desde 16/07 (`snapshot-subscriptions`, 05:10 UTC) e ate
// aqui NENHUMA rota a lia. E o unico dado com dimensao de tempo que o painel
// tem, e a Visao inteira e foto sem ele.
//
// FONTE DE CADA NUMERO, para nao existir uma terceira contagem de MRR:
//
//   activeCount, trialingCount, mrrCents   LIDOS da linha do snapshot, sem
//                                          recalculo. Quem os produziu foi
//                                          `collectSubscriptionSnapshot`, que
//                                          chama `getMrrSnapshot` — a MESMA
//                                          funcao do MRR ao vivo. Ou seja: uma
//                                          regra, duas materializacoes (ao vivo
//                                          e historica), zero copias.
//   change.*                               SUBTRACAO de dois valores lidos. Nao
//                                          e calculo de MRR, e diferenca entre
//                                          dois MRRs ja calculados.
//
// Esta rota NAO devolve MRR ao vivo de proposito. Ele ja vem de
// `/billing-metrics`, e os dois numeros divergem LEGITIMAMENTE: o snapshot e uma
// foto das 05:10 UTC, e qualquer assinatura criada depois disso aparece no vivo
// e nao no historico (medido em 2026-07-31: 62 no snapshot, 63 ao vivo, uma
// mensal criada as 16:27). Servi-los pela mesma rota convidaria a exibi-los como
// se fossem comparaveis no mesmo instante.
//
// NAO INTERPOLA. Dia sem snapshot volta marcado, com metricas nulas: uma serie
// com buraco preenchido mente pior que serie ausente, porque o grafico desenha
// uma reta onde nao houve medicao.

/** Janelas oferecidas. 90 dias NAO entra: a serie tem 16 dias, e oferecer uma
 * janela que nao existe e preencher com mentira. `all` declara o inicio real. */
const SUBSCRIPTION_HISTORY_WINDOWS = ["7", "30", "all"] as const;
type SubscriptionHistoryWindow = (typeof SUBSCRIPTION_HISTORY_WINDOWS)[number];

/**
 * Teto de pontos. Uma linha por dia, entao 400 = ~13 meses.
 *
 * Com a serie comecando em 2026-07-16, o teto so seria alcancado em 2027-08-20.
 * Ele existe como para-quedas, e AVISA quando corta (`truncated`): corte
 * silencioso faria o grafico parecer completo sendo parcial, que e a classe de
 * defeito que este projeto ja documentou.
 */
const SUBSCRIPTION_HISTORY_LIMIT = 400;

type SnapshotRow = {
  snapshot_date: string;
  active_count: number | null;
  trialing_count: number | null;
  mrr_cents: number | null;
};

/** Dias entre duas datas ISO (YYYY-MM-DD), em UTC puro. */
function diasEntre(inicio: string, fim: string): number {
  const MS_DIA = 24 * 60 * 60 * 1000;
  return Math.round(
    (Date.parse(`${fim}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`)) / MS_DIA,
  );
}

// `somarDias` local foi REMOVIDO em 2026-08-14: era uma segunda copia, byte a
// byte, do `somarDia` de signupSeries.ts. As duas viraram `somarDiaCivil` em
// shared/brasiliaDay.ts. Duas copias da mesma aritmetica e a que diverge na
// primeira correcao aplicada so numa delas.

// MAPEAMENTO SNAPSHOT -> DIA CIVIL DE BRASILIA.
//
// `subscription_snapshots.snapshot_date` e gravado por
// `collectSubscriptionSnapshot` como `new Date().toISOString().slice(0,10)`, ou
// seja, o dia UTC do instante da coleta. O cron roda as **05:10 UTC**
// (`supabase/migrations/20260715150100_schedule_subscription_snapshot.sql`).
//
// 05:10 UTC e DEPOIS de 03:00 UTC, que e a meia-noite de Brasilia. Logo, para
// esta cadencia, o dia UTC da coleta e o dia civil de Brasilia da coleta sao o
// MESMO dia, e o mapeamento e a identidade. Nao ha conversao a fazer, e e por
// isso que ela nao esta escrita aqui: escrever uma conversao que e identidade
// daria a impressao de que a fonte tem granularidade sub-diaria, que ela nao tem.
//
// A CONDICAO, para quem mexer no cron: se o horario passar para antes de 03:00
// UTC, um snapshot coletado, por exemplo, as 02:00 UTC do dia D pertence ao dia
// civil D-1 em Brasilia, e a identidade quebra em silencio — a serie inteira
// desliza um dia. Mudar o `cron.schedule` daquela migration exige revisitar este
// bloco. E UMA linha por dia civil, por construcao (unique em snapshot_date).
const SNAPSHOT_CRON_UTC_HOUR = 5;

router.get("/subscription-history", async (req, res, next) => {
  try {
    const janelaRaw =
      typeof req.query.window === "string" ? req.query.window : "30";
    const janela = (
      SUBSCRIPTION_HISTORY_WINDOWS as readonly string[]
    ).includes(janelaRaw)
      ? (janelaRaw as SubscriptionHistoryWindow)
      : "30";

    // FAIL-LOUD. Serie vazia por falha de leitura desenharia um grafico plano,
    // que e afirmacao falsa sobre o negocio. `coletarTudo` propaga o erro e o
    // catch abaixo devolve 500.
    const linhas = await coletarTudo<SnapshotRow>(
      (from, to) =>
        supabaseAdmin
          .from("subscription_snapshots")
          .select("snapshot_date, active_count, trialing_count, mrr_cents")
          .order("snapshot_date", { ascending: true })
          .range(from, to),
      "subscription history",
    );

    if (linhas.length === 0) {
      return res.json({
        data: {
          window: janela,
          points: [],
          firstSnapshotDate: null,
          lastSnapshotDate: null,
          staleDays: null,
          gaps: [],
          truncated: false,
          limit: SUBSCRIPTION_HISTORY_LIMIT,
          change: null,
          previousPeriodAvailable: false,
        },
      });
    }

    const firstSnapshotDate = linhas[0].snapshot_date;
    const lastSnapshotDate = linhas[linhas.length - 1].snapshot_date;

    // A janela termina no ULTIMO SNAPSHOT, nao em "hoje". O snapshot do dia so
    // e gravado as 05:10 UTC, entao entre 21h e 2h de Brasilia o mais recente e
    // o de ontem; ancorar em hoje criaria um "buraco" que e so o dia ainda nao
    // ter acontecido. Quem precisa saber se o cron parou le `staleDays`.
    //
    // `staleDays` FICA EM UTC, e a Fase 2 NAO o converteu para dia civil. Mas
    // isto e DECISAO PENDENTE, nao excecao justificada, e o motivo esta medido
    // abaixo — a justificativa que a primeira versao deste comentario deu estava
    // errada e vale registrar por que.
    //
    // O que ele faz hoje: subtrai dois ROTULOS de dia. `lastSnapshotDate` e o dia
    // UTC do instante da coleta (`collectSubscriptionSnapshot` faz
    // `toISOString().slice(0,10)`), e o outro lado e o dia de "hoje". Isso NAO e
    // uma duracao; e a diferenca entre duas etiquetas de calendario.
    //
    // A cadencia do cron e 05:10 UTC (migration 20260715150100). Contando a
    // janela diaria em que cada opcao mente:
    //
    //   dia UTC       de 00:00Z a 05:10Z o rotulo de hoje ja virou e o snapshot
    //                 ainda nao rodou -> staleDays = 1 sem nada estar atrasado.
    //                 5h10 por dia de falso positivo.
    //   dia Brasilia  de 00:00Z a 03:00Z ainda e "ontem" em Brasilia e o valor da
    //                 0 (certo); de 03:00Z a 05:10Z da 1 (falso). 2h10 por dia.
    //
    // Ou seja, o dia civil de Brasilia seria ESTRITAMENTE MELHOR aqui, e a frase
    // "a cadencia e UTC, entao a unidade certa e UTC" nao se sustenta: nenhuma
    // das duas mede atraso, as duas comparam etiquetas.
    //
    // O CONSERTO DE VERDADE nao e trocar o fuso, e sim medir DURACAO desde o
    // instante em que a proxima execucao era esperada (05:10 UTC do dia da
    // ultima coleta + 24h). Isso muda o tipo do campo e o que a faixa de saude
    // exibe, entao fica para uma fase propria em vez de entrar de carona na
    // unificacao de janela. Mantido em UTC AQUI para nao mudar comportamento sem
    // o conserto certo; o teste abaixo fixa o comportamento atual e a pendencia
    // esta registrada em docs/plano-admin-visao-overview.md.
    const hojeNaCadenciaDoJob = new Date().toISOString().slice(0, 10);
    const staleDays = diasEntre(lastSnapshotDate, hojeNaCadenciaDoJob);

    const inicioJanela =
      janela === "all"
        ? firstSnapshotDate
        : somarDiaCivil(lastSnapshotDate, -(Number(janela) - 1));

    const porData = new Map(linhas.map((l) => [l.snapshot_date, l]));
    // O primeiro dia da serie limita: janela maior que o historico nao inventa
    // dias anteriores ao primeiro snapshot. `firstSnapshotDate` na resposta e o
    // que permite a tela dizer "desde 16/07" em vez de fingir 30 dias.
    const inicioReal =
      inicioJanela < firstSnapshotDate ? firstSnapshotDate : inicioJanela;

    const todosOsDias: string[] = [];
    for (let d = inicioReal; d <= lastSnapshotDate; d = somarDiaCivil(d, 1)) {
      todosOsDias.push(d);
    }

    const truncated = todosOsDias.length > SUBSCRIPTION_HISTORY_LIMIT;
    const dias = truncated
      ? todosOsDias.slice(todosOsDias.length - SUBSCRIPTION_HISTORY_LIMIT)
      : todosOsDias;

    const gaps: string[] = [];
    const points = dias.map((date) => {
      const linha = porData.get(date);
      if (!linha) {
        gaps.push(date);
        // Dia faltante volta EXPLICITO, com metricas nulas. A rota nao maquia:
        // quem desenha decide se quebra a linha, se pontilha ou se avisa.
        return {
          date,
          missing: true,
          activeCount: null,
          trialingCount: null,
          mrrCents: null,
        };
      }
      return {
        date,
        missing: false,
        activeCount: linha.active_count ?? 0,
        trialingCount: linha.trialing_count ?? 0,
        mrrCents: linha.mrr_cents ?? 0,
      };
    });

    // VARIACAO DENTRO DA JANELA: primeiro ponto COM medicao contra o ultimo.
    // Dia faltante nao vira extremo, senao a variacao sairia contra null.
    const medidos = points.filter((p) => !p.missing);
    const change =
      medidos.length >= 2
        ? (() => {
            const ini = medidos[0];
            const fim = medidos[medidos.length - 1];
            const mrrDelta = (fim.mrrCents ?? 0) - (ini.mrrCents ?? 0);
            return {
              fromDate: ini.date,
              toDate: fim.date,
              fromMrrCents: ini.mrrCents ?? 0,
              toMrrCents: fim.mrrCents ?? 0,
              mrrDeltaCents: mrrDelta,
              // PERCENTUAL NULO quando a base e zero, nunca infinito. Um card
              // com "+∞%" destroi a confianca na pagina inteira.
              mrrDeltaPercent:
                ini.mrrCents && ini.mrrCents > 0
                  ? (mrrDelta / ini.mrrCents) * 100
                  : null,
              fromActiveCount: ini.activeCount ?? 0,
              toActiveCount: fim.activeCount ?? 0,
              activeDelta: (fim.activeCount ?? 0) - (ini.activeCount ?? 0),
            };
          })()
        : null;

    // COMPARACAO COM O PERIODO ANTERIOR: so DIZ se seria possivel, e nao a
    // calcula. Com 16 dias de historico, "30 dias vs 30 anteriores" nao existe,
    // e comparar contra zero produziria o +∞ que a fatia 5 nao pode exibir.
    // Para `all` a pergunta nao se aplica: nao ha periodo anterior ao primeiro.
    const previousPeriodAvailable =
      janela === "all"
        ? false
        : diasEntre(firstSnapshotDate, lastSnapshotDate) + 1 >=
          Number(janela) * 2;

    res.json({
      data: {
        window: janela,
        points,
        firstSnapshotDate,
        lastSnapshotDate,
        // Dias desde o ultimo snapshot. 0 = o de hoje ja existe; 1 = normal
        // antes das 05:10 UTC; maior que isso significa cron parado, e e o
        // unico sinal que a serie da de que parou de crescer.
        staleDays,
        gaps,
        truncated,
        limit: SUBSCRIPTION_HISTORY_LIMIT,
        change,
        previousPeriodAvailable,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/cancellation-reasons", async (_req, res, next) => {
  try {
    // VARREDURA por coletarTudo. Antes era `from += PAGE` com break em
    // `rows.length < PAGE`, e ela funcionava por coincidencia: PAGE valia
    // exatamente o `db-max-rows` do PostgREST. Baixar o teto do servidor faria a
    // PRIMEIRA pagina vir curta, o laco encerrar achando que a origem acabou, e
    // o agregado de motivos sair menor sem nada acusar. O padrao esta descrito
    // no topo de server/lib/paginate.ts, que para so em pagina VAZIA e avanca
    // pelo tamanho REAL da pagina.
    //
    // ORDENADO: OFFSET sem ORDER BY tem ordem indefinida no Postgres, e duas
    // paginas podem repetir ou pular linhas.
    const linhas = await coletarTudo<{
      reason_code: string | null;
      provider_subscription_id: string | null;
    }>(
      (from, to) =>
        supabaseAdmin
          .from("subscription_cancellations")
          .select("reason_code, provider_subscription_id")
          .in("status", ["scheduled", "completed"])
          .order("id", { ascending: true })
          .range(from, to),
      "cancellation-reasons tally",
    );

    // ORIGEM. O agregado conta cancelamento de assinatura que NAO existe mais em
    // `subscriptions` junto com os demais, e isso continua certo: sao churn de
    // gente real. O que faltava era poder DIZER quantos sao.
    //
    // O nome afirma a MEDICAO, nao a interpretacao: o que se mede e "sem
    // assinatura vinculada". Hoje as 2 linhas nessa situacao sao do gateway
    // Asaas (medido em 2026-07-31, e `provider='asaas'` nao tem nenhuma linha em
    // subscriptions), mas chamar o campo de "legado" seria afirmar a causa a
    // partir do efeito, que e o erro que esta base ja cometeu antes com as 35
    // tabelas "cobertas por policy" que estavam cobertas por privilegio.
    const idsExistentes = await carregarIdsDeAssinaturas();

    const counts: Record<string, number> = {};
    let total = 0;
    let unlinked = 0;
    for (const row of linhas) {
      total += 1;
      if (row.reason_code) {
        counts[row.reason_code] = (counts[row.reason_code] ?? 0) + 1;
      }
      if (
        !row.provider_subscription_id ||
        !idsExistentes.has(row.provider_subscription_id)
      ) {
        unlinked += 1;
      }
    }

    const byReason = CANCELLATION_REASON_CODES.map((code) => {
      const count = counts[code] ?? 0;
      return {
        code,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });

    // Comentarios livres (o insight real): ultimos 50 com reason_text preenchido,
    // mais recentes primeiro.
    const { data: commentRows, error: commentsError } = await supabaseAdmin
      .from("subscription_cancellations")
      .select("reason_code, reason_text, canceled_at")
      .in("status", ["scheduled", "completed"])
      .not("reason_text", "is", null)
      .neq("reason_text", "")
      .order("canceled_at", { ascending: false })
      .limit(50);
    if (commentsError)
      return next(
        dbError("cancellation-reasons comments", commentsError, "Erro ao buscar comentários."),
      );

    const comments = (
      (commentRows ?? []) as Array<{
        reason_code: string | null;
        reason_text: string | null;
        canceled_at: string | null;
      }>
    ).map((row) => ({
      reasonCode: row.reason_code,
      reasonText: row.reason_text,
      canceledAt: row.canceled_at,
    }));

    // Revertidos: linha AUXILIAR, fora do total e dos percentuais. 'reverted' e
    // quem deu o motivo e voltou atras (cartao: reativou; boleto: desfez o aviso
    // de nao renovar). Nao respondem "por que cancelam", entao ficam fora da
    // distribuicao, mas o total interessa para contexto.
    const { count: revertedCount, error: revertedError } = await supabaseAdmin
      .from("subscription_cancellations")
      .select("id", { count: "exact", head: true })
      .eq("status", "reverted");
    if (revertedError)
      return next(
        dbError("cancellation-reasons reverted", revertedError, "Erro ao buscar revertidos."),
      );

    res.json({
      data: {
        total,
        byReason,
        comments,
        revertedCount: revertedCount ?? 0,
        // ONDE ENTRA NA UI (nao implementado nesta fatia, de proposito): o
        // cabecalho do CancellationReasonsDashboard, ao lado do total, como
        // "13 cancelamentos, 2 sem assinatura vinculada". So aparece quando
        // `unlinkedCount > 0`; com zero nao ha o que distinguir e a linha vira
        // ruido.
        unlinkedCount: unlinked,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    const { data: role } = await supabaseAdmin
      .from("admin_roles")
      .select("role, created_at")
      .eq("user_id", req.user!.id)
      .single();
    res.json({ data: { user: req.user, role: role?.role || "editor" } });
  } catch (err) {
    next(err);
  }
});

router.get("/content/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    if (!EDITABLE_TABLES[type])
      return next(
        createError(404, "not_found", `Tipo '${type}' não reconhecido.`),
      );

    const { search, published } = req.query;
    const orderField = type === "external_jobs" ? "fetched_at" : "created_at";
    let query = supabaseAdmin
      .from(type)
      .select("*")
      .order(orderField, { ascending: false })
      .limit(100);

    if (published !== undefined)
      query = query.eq("is_published", published === "true");
    if (search) query = query.ilike(getSearchColumn(type), `%${search}%`);

    const { data, error } = await query;
    if (error)
      return next(dbError("content list", error, "Erro ao buscar conteúdo."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/content/:type/:id", async (req, res, next) => {
  try {
    const { type, id } = req.params;
    if (!EDITABLE_TABLES[type])
      return next(
        createError(404, "not_found", `Tipo '${type}' não reconhecido.`),
      );

    const { data, error } = await supabaseAdmin
      .from(type)
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data)
      return next(createError(404, "not_found", "Item não encontrado."));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post("/content/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    const allowedFields = EDITABLE_TABLES[type];
    if (!allowedFields)
      return next(
        createError(404, "not_found", `Tipo '${type}' não reconhecido.`),
      );

    const payload = filterPayload(
      req.body as Record<string, unknown>,
      allowedFields,
    );

    const { data, error } = await supabaseAdmin
      .from(type)
      .insert(payload)
      .select()
      .single();
    if (error) {
      if (error.code === "23505")
        return next(
          createError(409, "conflict", "Já existe um item com este slug."),
        );
      return next(dbError("content create", error, "Erro ao criar item."));
    }

    await logAudit({
      actorUserId: req.user!.id,
      action: "create",
      resourceType: type,
      resourceId: data.id,
      resourceSlug: data.slug,
      after: data,
    });

    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

router.patch("/content/:type/:id", async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const allowedFields = EDITABLE_TABLES[type];
    if (!allowedFields)
      return next(
        createError(404, "not_found", `Tipo '${type}' não reconhecido.`),
      );

    const { data: before } = await supabaseAdmin
      .from(type)
      .select("*")
      .eq("id", id)
      .single();
    if (!before)
      return next(createError(404, "not_found", "Item não encontrado."));

    const updates = filterPayload(
      req.body as Record<string, unknown>,
      allowedFields,
    );
    delete updates.slug;

    if (Object.keys(updates).length === 0)
      return next(
        createError(
          400,
          "invalid_request",
          "Nenhum campo válido para atualizar.",
        ),
      );

    const { data, error } = await supabaseAdmin
      .from(type)
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error)
      return next(dbError("content update", error, "Erro ao atualizar item."));

    const action =
      "is_published" in updates
        ? updates.is_published
          ? "publish"
          : "unpublish"
        : "update";

    await logAudit({
      actorUserId: req.user!.id,
      action,
      resourceType: type,
      resourceId: id,
      resourceSlug: before.slug,
      before,
      after: data,
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.delete("/content/:type/:id", async (req, res, next) => {
  try {
    const { type, id } = req.params;
    if (!EDITABLE_TABLES[type])
      return next(
        createError(404, "not_found", `Tipo '${type}' não reconhecido.`),
      );

    const { data: before } = await supabaseAdmin
      .from(type)
      .select("*")
      .eq("id", id)
      .single();
    if (!before)
      return next(createError(404, "not_found", "Item não encontrado."));

    // affiliates e coupons nao tem is_published: delete e sempre hard.
    if (
      req.query.force === "true" ||
      type === "affiliates" ||
      type === "coupons"
    ) {
      const { error } = await supabaseAdmin.from(type).delete().eq("id", id);
      if (error)
        return next(dbError("content delete", error, "Erro ao deletar item."));
    } else {
      const { error } = await supabaseAdmin
        .from(type)
        .update({ is_published: false })
        .eq("id", id);
      if (error)
        return next(dbError("content unpublish", error, "Erro ao despublicar item."));
    }

    await logAudit({
      actorUserId: req.user!.id,
      action: "delete",
      resourceType: type,
      resourceId: id,
      resourceSlug: before.slug,
      before,
    });

    res.json({ data: { deleted: true, id } });
  } catch (err) {
    next(err);
  }
});

router.get("/audit-logs", async (req, res, next) => {
  try {
    const { resource_type, limit = "50", offset = "0" } = req.query;
    const parsedLimit = Math.min(parseInt(String(limit), 10) || 50, 100);
    const parsedOffset = parseInt(String(offset), 10) || 0;

    let query = supabaseAdmin
      .from("content_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(parsedLimit)
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (resource_type) query = query.eq("resource_type", resource_type);

    const { data, error } = await query;
    if (error)
      return next(dbError("audit logs", error, "Erro ao buscar logs."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

// Aceita apenas UUID: as chaves de auth.users / profiles.user_id sao UUID.
// Barra qualquer coisa fora desse formato antes de tocar o banco ou o PostHog.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// CPF e guardado so com digitos. maskCpf revela APENAS os 2 ultimos digitos
// (default seguro do modal); null quando nao ha CPF. formatCpf so e usado no
// endpoint de revelacao (auditado) para exibir o numero completo formatado.
function maskCpf(raw: string | null | undefined): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return null;
  const last2 = digits.slice(-2).padStart(2, "*");
  return `***.***.***-${last2}`;
}

function formatCpf(raw: string | null | undefined): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length !== 11) return digits;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

// Escapa a busca para o ilike do PostgREST: % e _ sao curingas do LIKE (usuario
// digitando % nao pode virar wildcard acidental) e \ e o proprio escape. O
// padrao final vai entre aspas duplas no filtro or=, entao aspas duplas tambem
// sao escapadas (virgula e parenteses, estruturais do or=, ficam inofensivos
// dentro das aspas).
function ilikePattern(term: string): string {
  const escaped = term
    .replace(/\\/g, "\\\\")
    .replace(/[%_]/g, (ch) => `\\${ch}`)
    .replace(/"/g, '\\"');
  return `"%${escaped}%"`;
}

// Janela do filtro ATIVO: login (auth.users.last_sign_in_at) nos ultimos 30 dias.
const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

router.get("/users", async (req, res, next) => {
  try {
    const pageRaw = parseInt(String(req.query.page ?? "1"), 10);
    const pageSizeRaw = parseInt(String(req.query.pageSize ?? "50"), 10);
    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
    const pageSize = Math.min(
      Math.max(Number.isFinite(pageSizeRaw) ? pageSizeRaw : 50, 1),
      100,
    );
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const filterRaw =
      typeof req.query.filter === "string" ? req.query.filter : "all";
    const filter =
      filterRaw === "pro" ||
      filterRaw === "not_pro" ||
      filterRaw === "influencers" ||
      filterRaw === "ativo"
        ? filterRaw
        : "all";

    // Lista ENXUTA: so o necessario para a linha. CPF e os demais campos de
    // profiles NAO trafegam aqui; vem sob demanda em /users/:id.
    //
    // onboarding_completed saiu do select: trafegava em 50 linhas por pagina e
    // nao era renderizado em lugar nenhum (o detalhe le o dele, de outra rota).
    const rangeFrom = (page - 1) * pageSize;
    let query = supabaseAdmin
      .from("profiles")
      .select("id, user_id, name, email, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      // Desempate por chave unica. created_at nao tem unique, entao a ordem
      // entre linhas de mesmo instante nao e garantida, e sem garantia a
      // paginacao por range pula e repete em silencio. Medido em 2026-07-29:
      // 3182 perfis, zero empates, ou seja, nenhuma linha e afetada HOJE. Isto
      // troca uma propriedade dos dados por uma garantia da consulta.
      .order("id", { ascending: false })
      .range(rangeFrom, rangeFrom + pageSize - 1);

    if (search) {
      const pattern = ilikePattern(search);
      query = query.or(`name.ilike.${pattern},email.ilike.${pattern}`);
    }

    // Cada filtro vira uma LISTA de user_id aplicada com .in()/.not in() no nivel
    // do banco: filtro + range + count acontecem juntos com a busca, entao a
    // paginacao e a contagem seguem corretas em qualquer combinacao.
    if (filter === "pro" || filter === "not_pro") {
      // Pro por lista explicita de user_id com subscription active (decisao do
      // Murilo): subscriptions nao tem FK declarada para profiles, entao o join
      // implicito do PostgREST nao e confiavel. A lista e minuscula e o resultado
      // exato. Influencer NAO entra aqui de proposito: Pro = assinante pagante.
      // PAGINADO: este conjunto E o filtro. Truncado, a lista "Pro" some com
      // usuarios que sao Pro, e a tela nao tem como saber que faltou alguem.
      const { data: subRows, error: subError } = await coletarTagueado<{
        user_id: string | null;
      }>(
        (from, to) =>
          supabaseAdmin
            .from("subscriptions")
            .select("user_id")
            .eq("status", "active")
            .order("id", { ascending: true })
            .range(from, to),
        "users pro filter",
      );
      if (subError)
        return next(
          dbError("users pro filter", subError, "Erro ao buscar usuários."),
        );
      const proUserIds = Array.from(
        new Set((subRows || []).map((row) => row.user_id)),
      );
      if (filter === "pro") {
        // Sem nenhum assinante ativo, o resultado correto e vazio: in() com lista
        // vazia devolve zero linhas, exatamente o esperado.
        query = query.in("user_id", proUserIds);
      } else if (proUserIds.length > 0) {
        query = query.not("user_id", "in", `(${proUserIds.join(",")})`);
      }
    } else if (filter === "influencers") {
      // Influencer = concessao ATIVA (revoked_at null; o indice unico parcial
      // garante no maximo uma por usuario). Mesma mecanica de lista do Pro.
      // PAGINADO pelo mesmo motivo do filtro Pro: o conjunto E o filtro.
      const { data: infRows, error: infError } = await coletarTagueado<{
        user_id: string | null;
      }>(
        (from, to) =>
          supabaseAdmin
            .from("influencers")
            .select("user_id")
            .is("revoked_at", null)
            .order("id", { ascending: true })
            .range(from, to),
        "users influencer filter",
      );
      if (infError)
        return next(
          dbError("users influencer filter", infError, "Erro ao buscar usuários."),
        );
      const influencerIds = Array.from(
        new Set((infRows || []).map((row) => row.user_id)),
      );
      // Lista vazia -> in() devolve zero linhas, exatamente o esperado.
      query = query.in("user_id", influencerIds);
    } else if (filter === "ativo") {
      // ATIVO = login nos ultimos 30 dias. last_sign_in_at so existe em
      // auth.users (nao em profiles), entao varre o Auth (listUsers), filtra pelo
      // cutoff e aplica a lista de ids. Quem nunca logou (last_sign_in_at null)
      // fica fora, por definicao.
      //
      // RISCO DE ESCALA: diferente do Pro (lista minuscula de pagantes), "ativos
      // em 30d" pode ser fracao grande da base -> lista grande no .in(), que pode
      // estourar o tamanho da query no PostgREST, e a varredura roda a cada
      // request com filter=ativo. Barato na base atual. Caminho futuro: um RPC
      // dedicado (profiles JOIN auth.users com limit/offset/count no banco),
      // mesma nota ja registrada em server/lib/usageRetention.ts.
      const authTimes = await fetchAuthTimes();
      const cutoffMs = Date.now() - ACTIVE_WINDOW_MS;
      const activeIds: string[] = [];
      authTimes.forEach((times, userId) => {
        const ms = times.lastSignInAt
          ? new Date(times.lastSignInAt).getTime()
          : NaN;
        if (!Number.isNaN(ms) && ms >= cutoffMs) activeIds.push(userId);
      });
      query = query.in("user_id", activeIds);
    }

    const { data, count, error } = await query;
    if (error)
      return next(dbError("users list", error, "Erro ao buscar usuários."));

    const rows = data || [];

    // Enriquecimento em LOTE sobre os ids DESTA pagina: duas consultas de custo
    // fixo, nunca uma por linha. Mesmo padrao de .in() usado pelos filtros
    // acima, pelo mesmo motivo (subscriptions nao tem FK declarada para
    // profiles, entao o join implicito do PostgREST nao e confiavel).
    const pageUserIds = rows
      .map((row) => row.user_id)
      .filter((id): id is string => Boolean(id));

    let listError: string | null = null;
    const enrichment = await fetchUserListEnrichment(
      pageUserIds,
      {
        bySubscription: async (ids) => {
          const { data: subs, error: subsError } = await supabaseAdmin
            .from("subscriptions")
            .select(
              "user_id, status, current_period_end, created_at, plans(code)",
            )
            .in("user_id", ids);
          if (subsError) {
            listError = subsError.message;
            return [];
          }
          return (subs || []) as SubscriptionRow[];
        },
        byInfluencer: async (ids) => {
          const { data: infs, error: infsError } = await supabaseAdmin
            .from("influencers")
            .select("user_id")
            .is("revoked_at", null)
            .in("user_id", ids);
          if (infsError) {
            listError = infsError.message;
            return [];
          }
          return (infs || []).map((row) => row.user_id);
        },
      },
      new Date(),
    );

    // Fail-loud: sem o enriquecimento a lista mostraria TODO MUNDO como nao-Pro,
    // que e um erro silencioso pior que um 500 (o admin agiria sobre o dado
    // errado). Um influencer marcado como nao-Pro e exatamente o engano que a
    // coluna existe para evitar.
    if (listError) {
      return next(
        dbError(
          "users list enrichment",
          { message: listError },
          "Erro ao buscar usuários.",
        ),
      );
    }

    const items = rows.map((row) => {
      const extra = row.user_id ? enrichment.get(row.user_id) : undefined;
      return {
        ...row,
        is_pro: extra?.is_pro ?? false,
        pro_source: extra?.pro_source ?? null,
        plan_code: extra?.plan_code ?? null,
        subscription_status: extra?.subscription_status ?? null,
      };
    });

    res.json({
      data: { items, total: count ?? 0, page, pageSize },
    });
  } catch (err) {
    next(err);
  }
});

// Detalhe de um usuario para o modal do admin. Chave = user_id (UUID). Retorna
// os campos de profiles uteis no perfil; o CPF vem MASCARADO (cpf_masked) e o
// numero completo so pelo endpoint de revelacao (auditado) abaixo. Campos
// operacionais de moderacao de avatar e o blob de preferences ficam de fora.
router.get("/users/:id", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(400, "invalid_user_id", "Identificador de usuário inválido."),
      );
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      // Colunas conferidas contra shared/database.types.ts (gerado do banco
      // real).
      //
      // headline, city, uf, github_url, linkedin_url e website_url ficaram
      // FORA daqui por anos por causa de um comentario que afirmava que a
      // migration 20260623120000 nunca fora aplicada. Ela foi: as seis colunas
      // existem (conferido em information_schema.columns) e sao editaveis pelo
      // proprio usuario (EDITABLE_FIELDS em server/routes/me.ts).
      //
      // Em 2026-07-29 as seis estao 100% NULAS (0 de 3182 perfis). A leitura
      // nao custa nada e passa a valer sozinha quando alguem preencher.
      .select(
        "user_id, name, full_name, email, gender, bio, area_interesse, nivel_atual, objetivo, onboarding_completed, onboarding_step, marketing_opt_in, marketing_opt_in_at, welcome_email_sent, cpf, avatar_url, avatar_mode, avatar_moderation_status, headline, city, uf, career_goal, github_url, linkedin_url, website_url, created_at, updated_at",
      )
      .eq("user_id", uid)
      .maybeSingle();

    if (error)
      return next(dbError("GET /users/:id", error, "Erro ao buscar usuário."));
    if (!data)
      return next(createError(404, "not_found", "Usuário não encontrado."));

    // Assinatura (a mais recente), intencao de cancelamento agendada, valor
    // pago real e acesso de influencer, em paralelo. Quem nunca assinou vem com
    // null: estado legitimo, nao erro.
    const [
      subResult,
      cancelResult,
      financeResult,
      influencerResult,
      authResult,
      declaradasResult,
    ] = await Promise.all([
      // TODAS as assinaturas do usuario, nao a mais recente. A escolha de qual
      // representa a pessoa e de pickSubscription, a MESMA funcao que a lista
      // usa (server/lib/userListEnrichment.ts).
      //
      // Antes era order(created_at).limit(1): o criterio divergia do da lista, e
      // divergia exatamente na janela que importa. Na renovacao de boleto o
      // usuario fica com `active` e `pending` ao mesmo tempo por ate 3 dias (o
      // link do lembrete entra por internalRenewal, que pula o guard de
      // assinatura ativa), e as duas telas afirmavam coisas diferentes sobre a
      // mesma pessoa: a lista dizia "Ativa", o detalhe dizia "Aguardando
      // pagamento". Uma funcao, um criterio.
      supabaseAdmin
        .from("subscriptions")
        .select(
          "user_id, status, payment_method, renewal_type, created_at, current_period_end, cancel_at_period_end, provider_subscription_id, plans(code)",
        )
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("subscription_cancellations")
        .select("reason_code, reason_text, effective_at")
        .eq("user_id", uid)
        .eq("status", "scheduled")
        .order("canceled_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Valor pago: a MESMA conta do extrato, pela MESMA funcao
      // (totalPagoCents em server/lib/userTransactions.ts). Ate 2026-07-30 este
      // ponto tinha o proprio reduce, e duas somas da mesma coisa divergem no
      // primeiro caso real: bastava uma devolucao externa registrada para o
      // extrato dizer "reembolsada" e o total logo acima dizer que o dinheiro
      // ficou. Uma funcao, uma conta.
      //
      // gross_cents e NEGATIVO em refund e dispute (invariante declarada na
      // coluna, migration 20260714130000), entao as linhas sincronizadas ja
      // entram com sinal. payout e adjustment ficam de fora: sao movimentos da
      // conta Stripe, nao pagamentos do usuario. O filtro por tipo vive DENTRO
      // de totalPagoCents, por isso a query nao filtra mais aqui.
      //
      // A subtracao DEPENDE de refund/dispute terem user_id preenchido, senao
      // o .eq("user_id", uid) simplesmente nao os enxerga e o total fica bruto.
      // Ate 2026-07-29 essa atribuicao NAO existia (extractRefs so resolvia
      // customer para source.object === "charge"), entao este comentario
      // afirmava uma compensacao que o codigo nao fazia. Quem garante hoje e o
      // resolveOwnerFromParentCharge em server/lib/stripeSync.ts: mexer la sem
      // manter a atribuicao volta a mentir aqui, em silencio.
      supabaseAdmin
        .from("finance_transactions")
        .select("type, gross_cents")
        .eq("user_id", uid),
      // Concessao de influencer ATIVA (revoked_at null); o indice unico parcial
      // garante no maximo uma.
      supabaseAdmin
        .from("influencers")
        .select("id, granted_at, granted_by, note")
        .eq("user_id", uid)
        .is("revoked_at", null)
        .maybeSingle(),
      // last_sign_in_at so existe em auth.users (nao em profiles): UM
      // getUserById(uid), em paralelo com os demais lookups, alimenta o
      // activity_status. Custo O(1) por request de detalhe (nao e o scan de
      // listUsers do filtro ATIVO, que varre a base inteira).
      supabaseAdmin.auth.admin.getUserById(uid),
      // Segunda fonte do "Valor pago (total)": devolucoes que a Stripe nunca
      // soube. Ver o comentario da query de finance acima.
      lerDeclaracoesDeDevolucao(uid),
    ]);

    if (subResult.error)
      return next(
        dbError("user subscription", subResult.error, "Erro ao buscar usuário."),
      );
    if (cancelResult.error)
      return next(
        dbError(
          "user cancellation intent",
          cancelResult.error,
          "Erro ao buscar usuário.",
        ),
      );
    if (financeResult.error)
      return next(
        dbError("user paid total", financeResult.error, "Erro ao buscar usuário."),
      );
    if (influencerResult.error)
      return next(
        dbError(
          "user influencer lookup",
          influencerResult.error,
          "Erro ao buscar usuário.",
        ),
      );
    if (authResult.error)
      return next(
        dbError("user auth lookup", authResult.error, "Erro ao buscar usuário."),
      );
    if (!declaradasResult.ok)
      return next(
        dbError(
          "user refund declarations",
          { message: declaradasResult.message },
          "Erro ao buscar usuário.",
        ),
      );

    // Status de atividade a partir de last_sign_in_at, com a MESMA janela do
    // filtro ATIVO (ACTIVE_WINDOW_MS). Computado no servidor para a janela viver
    // num unico lugar: o client so mapeia o rotulo. Quem nunca logou
    // (last_sign_in_at null) -> "never".
    const lastSignInMs = authResult.data.user?.last_sign_in_at
      ? new Date(authResult.data.user.last_sign_in_at).getTime()
      : NaN;
    const activityStatus: "active" | "inactive" | "never" = Number.isNaN(
      lastSignInMs,
    )
      ? "never"
      : lastSignInMs >= Date.now() - ACTIVE_WINDOW_MS
        ? "active"
        : "inactive";

    // Nome/email de quem concedeu, para o modal mostrar "concedido por".
    let influencer: {
      granted_at: string | null;
      note: string | null;
      granted_by_name: string | null;
      granted_by_email: string | null;
    } | null = null;
    if (influencerResult.data) {
      const { data: granter, error: granterError } = await supabaseAdmin
        .from("profiles")
        .select("name, email")
        .eq("user_id", influencerResult.data.granted_by)
        .maybeSingle();
      if (granterError)
        return next(
          dbError(
            "influencer granter lookup",
            granterError,
            "Erro ao buscar usuário.",
          ),
        );
      influencer = {
        granted_at: influencerResult.data.granted_at ?? null,
        note: influencerResult.data.note ?? null,
        granted_by_name: granter?.name ?? null,
        granted_by_email: granter?.email ?? null,
      };
    }

    type LinhaAssinatura = {
      user_id: string;
      status: string | null;
      payment_method: string | null;
      renewal_type: string | null;
      created_at: string | null;
      current_period_end: string | null;
      cancel_at_period_end: boolean | null;
      provider_subscription_id: string | null;
      plans: { code: string | null } | { code: string | null }[] | null;
    };
    const todasAsAssinaturas = (subResult.data || []) as LinhaAssinatura[];
    const subRow = pickSubscription(
      todasAsAssinaturas,
      new Date(),
    ) as LinhaAssinatura | null;
    const subPlan = Array.isArray(subRow?.plans) ? subRow?.plans[0] : subRow?.plans;

    // HISTORICO: as OUTRAS assinaturas do usuario, sem a escolhida acima.
    //
    // Antes o detalhe so conhecia uma linha, entao uma renovacao de boleto (que
    // aposenta a anterior como `superseded`) fazia a compra original
    // desaparecer da tela: nao dava para ver que a pessoa e assinante desde a
    // primeira vez. Nao ha consulta nova, e a mesma que ja carrega
    // `todasAsAssinaturas`.
    //
    // A vigente sai por IDENTIDADE de objeto, nao por comparacao de campos:
    // duas renovacoes do mesmo plano no mesmo dia teriam plano, status e ate
    // created_at iguais, e um filtro por valor tiraria as duas.
    const subscriptionHistory = todasAsAssinaturas
      .filter((linha) => linha !== subRow)
      .map((linha) => {
        const plano = Array.isArray(linha.plans) ? linha.plans[0] : linha.plans;
        return {
          plan_code: plano?.code ?? null,
          status: linha.status,
          payment_method: linha.payment_method,
          created_at: linha.created_at,
          current_period_end: linha.current_period_end,
        };
      });

    // ESTADO DO BOLETO, so quando a assinatura escolhida esta `pending`.
    //
    // Motivo: sem isto o admin ve "Aguardando pagamento" e nao tem como saber se
    // o boleto esta a caminho ou morto sem abrir a Stripe. Com isto ele ve
    // vencimento, valor e payment_status.
    //
    // A condicao e ESTREITA de propósito: `pending` e o unico status que pode
    // ter boleto em aberto, e hoje isso e 1 linha em 59. Qualquer outro status
    // nao paga chamada nenhuma.
    //
    // Reusa server/lib/boletoSession.ts, o MESMO caminho do cron
    // expire-pending-boletos. A funcao nao lanca: falha vira
    // { estado: "indisponivel" }, e o detalhe segue 200. Derrubar o modal por
    // causa de um bloco informativo tiraria cadastro, assinatura e historico
    // junto.
    const boleto =
      subRow?.status === "pending"
        ? await lerSessaoDeBoleto(subRow.provider_subscription_id)
        : null;

    const paidTotalCents = totalPagoCents(
      financeResult.data || [],
      declaradasResult.linhas,
    );

    // Origem do acesso Pro, para o cabecalho do modal usar o MESMO selo da
    // lista. Reusa subscriptionGrantsPro em vez de reimplementar a regra: ela ja
    // existe em dois lugares (a RPC e o TypeScript) e uma terceira copia aqui
    // divergiria na primeira mudanca.
    const assinaturaDaPro = subRow
      ? subscriptionGrantsPro(
          {
            user_id: uid,
            status: subRow.status,
            current_period_end: subRow.current_period_end,
            created_at: subRow.created_at,
            plans: subRow.plans,
          },
          new Date(),
        )
      : false;
    const proPorInfluencer = influencer !== null;
    const proSource = resolveProSource(assinaturaDaPro, proPorInfluencer);

    const { cpf, avatar_url, avatar_mode, avatar_moderation_status, ...rest } =
      data;
    res.json({
      data: {
        ...rest,
        is_pro: assinaturaDaPro || proPorInfluencer,
        pro_source: proSource,
        cpf_masked: maskCpf(cpf),
        has_cpf: Boolean((cpf || "").replace(/\D/g, "")),
        // Nao existe avatar_pending_url no schema: a foto e UMA (avatar_url) e o
        // avatar_moderation_status diz o estado dela (clean | pending_review |
        // removed). A UI decide o que mostrar a partir disso.
        avatar: {
          url: avatar_url,
          mode: avatar_mode,
          moderation_status: avatar_moderation_status,
        },
        subscription: subRow
          ? {
              plan_code: subPlan?.code ?? null,
              status: subRow.status,
              payment_method: subRow.payment_method,
              renewal_type: subRow.renewal_type,
              created_at: subRow.created_at,
              current_period_end: subRow.current_period_end,
              cancel_at_period_end: subRow.cancel_at_period_end,
            }
          : null,
        boleto,
        subscription_history: subscriptionHistory,
        cancellation_intent: cancelResult.data
          ? {
              reason_code: cancelResult.data.reason_code,
              reason_text: cancelResult.data.reason_text,
              effective_at: cancelResult.data.effective_at,
            }
          : null,
        paid_total_cents: paidTotalCents,
        influencer,
        activity_status: activityStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Revelacao do CPF completo. So existe UM caminho e ele SEMPRE audita antes de
// devolver o numero: escreve o log em content_audit_logs e, se essa escrita
// falhar, responde erro SEM o CPF (fail-closed). Nao ha caminho que revele sem
// registrar quem revelou, de quem e quando.
router.post("/users/:id/reveal-cpf", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(400, "invalid_user_id", "Identificador de usuário inválido."),
      );
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("cpf")
      .eq("user_id", uid)
      .maybeSingle();

    if (error)
      return next(dbError("GET /users/:id", error, "Erro ao buscar usuário."));
    if (!data)
      return next(createError(404, "not_found", "Usuário não encontrado."));

    const digits = (data.cpf || "").replace(/\D/g, "");
    if (!digits) {
      return next(
        createError(404, "cpf_not_found", "Usuário sem CPF cadastrado."),
      );
    }

    // Auditoria PRIMEIRO. Fail-closed: sem log gravado, nao ha revelacao.
    const { error: auditError } = await supabaseAdmin
      .from("content_audit_logs")
      .insert({
        actor_user_id: req.user!.id,
        action: "reveal",
        resource_type: "profile_cpf",
        resource_id: uid,
        resource_slug: null,
        before_json: null,
        after_json: null,
      });

    if (auditError) {
      return next(
        createError(
          500,
          "audit_failed",
          "Não foi possível registrar a auditoria da revelação.",
        ),
      );
    }

    res.json({ data: { cpf: formatCpf(data.cpf) } });
  } catch (err) {
    next(err);
  }
});

// Concede acesso de INFLUENCER (Pro vitalicio sem assinatura). Auditoria
// PRIMEIRO, fail-closed (padrao do reveal-cpf): sem rastro gravado, nao ha
// concessao. Idempotente: quem ja tem concessao ativa nao ganha segunda linha
// (e o indice unico parcial garante isso tambem contra corrida).
router.post("/users/:id/influencer", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(400, "invalid_user_id", "Identificador de usuário inválido."),
      );
    }
    const noteRaw = (req.body as { note?: unknown } | undefined)?.note;
    const note = typeof noteRaw === "string" ? noteRaw.trim() : "";

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("influencers")
      .select("id, granted_at, note")
      .eq("user_id", uid)
      .is("revoked_at", null)
      .maybeSingle();
    if (existingError)
      return next(
        dbError(
          "influencer grant lookup",
          existingError,
          "Erro ao conceder acesso de influencer.",
        ),
      );
    if (existing) {
      return res.json({ data: { granted: false, already_active: true } });
    }

    const { error: auditError } = await supabaseAdmin
      .from("content_audit_logs")
      .insert({
        actor_user_id: req.user!.id,
        action: "grant",
        resource_type: "influencer_access",
        resource_id: uid,
        resource_slug: null,
        before_json: null,
        after_json: { note: note || null },
      });
    if (auditError) {
      console.error("[admin] influencer grant audit failed:", auditError);
      return next(
        createError(
          500,
          "audit_failed",
          // TODO(Ana)
          "Não foi possível registrar a auditoria da concessão.",
        ),
      );
    }

    const { error: insertError } = await supabaseAdmin
      .from("influencers")
      .insert({
        user_id: uid,
        granted_by: req.user!.id,
        note: note || null,
      });
    if (insertError) {
      // 23505 = corrida com outra concessao simultanea: o estado final e o
      // desejado (uma concessao ativa), responde como idempotencia.
      if (insertError.code === "23505") {
        return res.json({ data: { granted: false, already_active: true } });
      }
      return next(
        dbError(
          "influencer grant insert",
          insertError,
          "Erro ao conceder acesso de influencer.",
        ),
      );
    }

    // Efeito imediato: derruba o cache Redis do status Pro (TTL 60s).
    await invalidateProStatusCache(uid);
    res.status(201).json({ data: { granted: true } });
  } catch (err) {
    next(err);
  }
});

// Revoga o acesso de influencer: NAO deleta a linha, preenche revoked_at e
// revoked_by (a historia fica). Auditoria primeiro, fail-closed. Revogar quem
// nao e influencer ativo responde 404 com slug proprio, sem explodir.
router.post("/users/:id/influencer/revoke", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(400, "invalid_user_id", "Identificador de usuário inválido."),
      );
    }

    const { data: active, error: activeError } = await supabaseAdmin
      .from("influencers")
      .select("id, granted_at, granted_by, note")
      .eq("user_id", uid)
      .is("revoked_at", null)
      .maybeSingle();
    if (activeError)
      return next(
        dbError(
          "influencer revoke lookup",
          activeError,
          "Erro ao revogar acesso de influencer.",
        ),
      );
    if (!active) {
      return next(
        createError(
          404,
          "influencer_not_active",
          // TODO(Ana)
          "Este usuário não tem acesso de influencer ativo.",
        ),
      );
    }

    const { error: auditError } = await supabaseAdmin
      .from("content_audit_logs")
      .insert({
        actor_user_id: req.user!.id,
        action: "revoke",
        resource_type: "influencer_access",
        resource_id: uid,
        resource_slug: null,
        before_json: {
          granted_at: active.granted_at,
          granted_by: active.granted_by,
          note: active.note,
        },
        after_json: null,
      });
    if (auditError) {
      console.error("[admin] influencer revoke audit failed:", auditError);
      return next(
        createError(
          500,
          "audit_failed",
          // TODO(Ana)
          "Não foi possível registrar a auditoria da revogação.",
        ),
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("influencers")
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by: req.user!.id,
      })
      .eq("id", active.id)
      .is("revoked_at", null);
    if (updateError)
      return next(
        dbError(
          "influencer revoke update",
          updateError,
          "Erro ao revogar acesso de influencer.",
        ),
      );

    await invalidateProStatusCache(uid);
    res.json({ data: { revoked: true } });
  } catch (err) {
    next(err);
  }
});

// Teto por ADMIN para a emissão de reembolso. Ver a docstring da fábrica em
// server/lib/refund.ts para o que ele protege e o que NÃO protege.
const refundLimiter = criarLimitadorDeReembolso({
  max: env.refundMaxPerMinute,
  janelaMs: 60_000,
});

/** Declarações de devolução do usuário, para a agregação juntar as duas fontes. */
async function lerDeclaracoesDeDevolucao(
  uid: string,
): Promise<
  { ok: true; linhas: DeclaredRefund[] } | { ok: false; message: string }
> {
  const { data, error } = await supabaseAdmin
    .from("admin_refunds")
    .select("stripe_charge_id, amount_cents, settlement")
    .eq("user_id", uid);
  if (error) return { ok: false, message: error.message };
  return { ok: true, linhas: (data || []) as DeclaredRefund[] };
}

/** Concessão de influencer ativa. Ortogonal à assinatura: revogar uma não toca a outra. */
async function temInfluencerAtivo(uid: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("influencers")
    .select("id")
    .eq("user_id", uid)
    .is("revoked_at", null)
    .maybeSingle();
  // Na dúvida, NÃO afirma que continua Pro: um aviso a menos é melhor que um
  // aviso falso dizendo que o acesso sobreviveu quando ninguém sabe.
  if (error) return false;
  return Boolean(data);
}

/**
 * REVOGACAO IMEDIATA do acesso Pro por assinatura.
 *
 * COMO ELA FAZ is_user_pro NEGAR. A função (migration 20260716130100) tem dois
 * ramos: assinatura com `status in ('active','trialing')` e período vigente, ou
 * concessão de influencer. Esta rotina ataca o PRIMEIRO ramo pelo STATUS, não
 * pelo período.
 *
 * POR QUE STATUS E NAO `current_period_end` NO PASSADO. Os dois negariam hoje,
 * mas só um sobrevive ao webhook. Quando `customer.subscription.deleted` chega,
 * `applySubscription` (server/providers/stripe.ts) escreve
 * `current_period_end = period.end` LIDO DA STRIPE, que continua sendo a data
 * futura original: um período antedatado por nós seria SOBRESCRITO de volta e o
 * acesso voltaria. O mesmo handler escreve `status = mapStatus('canceled') =
 * 'canceled'`, ou seja, ele CONFIRMA a revogação por status. Escolhemos o campo
 * com que o webhook concorda, não o que ele desfaz.
 *
 * ORDEM: STRIPE PRIMEIRO, BANCO DEPOIS. A ordem inversa tem um desfecho
 * silencioso e ruim: com o banco cancelado e a Stripe intacta, a assinatura
 * segue viva lá, o próximo `invoice.paid` cai em `applySubscription` e reescreve
 * `status='active'`, devolvendo o Pro sem ninguém pedir. Nesta ordem, falha da
 * Stripe deixa tudo como estava, e falha do banco DEPOIS da Stripe é curada pelo
 * próprio `customer.subscription.deleted`, que escreve o mesmo estado terminal.
 *
 * O cron `process-cancellations` não alcança estas linhas: ele filtra
 * `cancel_at_period_end=true AND status='active'`, e aqui o status já saiu de
 * 'active' e o cancel_at_period_end vai a false.
 */
async function revogarAcessoPro(input: {
  uid: string;
  actorUserId: string;
  motivo: string;
  /** O que já aconteceu quando esta revogação é tentada. Ver GatilhoDeRevogacao. */
  gatilho: GatilhoDeRevogacao;
}): Promise<{
  revoked: boolean;
  reason: RevocationOutcome["reason"];
  detail: string | null;
  /** Onde falhou, para o chamador escolher o status HTTP. */
  failure?: RevocationFailure;
}> {
  const { uid, actorUserId, motivo, gatilho } = input;
  const prefixo = prefixoDeFalhaDeRevogacao(gatilho, uid);
  const chargeId = gatilho.tipo === "refund" ? gatilho.chargeId : null;

  const { data: sub, error: subError } = await supabaseAdmin
    .from("subscriptions")
    .select("id, status, renewal_type, provider_subscription_id")
    .eq("user_id", uid)
    .eq("provider", "stripe")
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subError) {
    console.error(
      `${prefixo} a leitura da assinatura de ${uid} falhou; o acesso NAO foi revogado.`,
      subError,
    );
    return {
      revoked: false,
      reason: "revoke_failed",
      detail: "Não foi possível ler a assinatura para revogar o acesso.",
      failure: "read",
    };
  }

  // Sem assinatura vigente não há o que revogar, e isso não é falha. No caminho
  // do reembolso a cobrança pode ser de um período que já acabou; no caminho
  // avulso é a IDEMPOTÊNCIA (já revogado antes), e quem traduz isso em resposta
  // é a rota.
  if (!sub) {
    return { revoked: false, reason: "no_active_subscription", detail: null };
  }

  // AUDITORIA DA INTENÇÃO DE REVOGAR, fail-closed e SEPARADA da do reembolso.
  // Separada porque os dois efeitos podem terminar diferente, e uma linha só não
  // conseguiria dizer que um deu certo e o outro não. É esta linha que aparece
  // como "Sem confirmação" no histórico quando a revogação falha, e é o rastro
  // DURÁVEL de que alguém precisa revogar à mão (o toast some, o histórico não).
  const { error: auditError } = await supabaseAdmin
    .from("content_audit_logs")
    .insert({
      actor_user_id: actorUserId,
      action: "revoke_pro",
      resource_type: "subscription",
      resource_id: uid,
      resource_slug: chargeId,
      before_json: { status: sub.status },
      // MESMA action nos dois usos, e o `trigger` é quem os distingue. Ver a
      // nota sobre a escolha no cabeçalho de POST /users/:id/subscription/revoke.
      after_json: { status: "canceled", reason: motivo, trigger: gatilho.tipo },
    });
  if (auditError) {
    console.error(
      `${prefixo} a auditoria da revogacao falhou; o acesso NAO foi revogado.`,
      auditError,
    );
    return {
      revoked: false,
      reason: "revoke_failed",
      detail: "Não foi possível registrar a auditoria da revogação.",
      failure: "audit",
    };
  }

  const alvo = sub as AssinaturaParaRevogar;
  if (precisaCancelarNaStripe(alvo)) {
    try {
      await getStripe().subscriptions.cancel(alvo.provider_subscription_id);
    } catch (stripeErr) {
      console.error(
        `${prefixo} a Stripe recusou cancelar ${alvo.provider_subscription_id}; o acesso NAO foi revogado.`,
        stripeErr,
      );
      return {
        revoked: false,
        reason: "revoke_failed",
        detail: "A Stripe não cancelou a assinatura.",
        failure: "stripe",
      };
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      cancel_at_period_end: false,
    })
    .eq("id", alvo.id);

  if (updateError) {
    // INCONSISTENCIA nos DOIS gatilhos, e esta é a exceção anotada em
    // GatilhoDeRevogacao: aqui a Stripe já cancelou, então algo externo mudou
    // mesmo no caminho avulso, e o log precisa ser procurável pela palavra.
    console.error(
      `[admin/revoke] INCONSISTENCIA: assinatura ${alvo.id} cancelada na Stripe, mas o banco nao gravou; o acesso so cai quando o webhook customer.subscription.deleted chegar.`,
      updateError,
    );
    return {
      revoked: false,
      reason: "revoke_failed",
      detail: "A assinatura não foi marcada como cancelada no banco.",
      failure: "db",
    };
  }

  // Linha de RESULTADO. É contra ela que o histórico cruza a intenção acima
  // (cruzarCancelamento em server/lib/userAuditHistory.ts).
  //
  // status='completed', não 'scheduled': isto já aconteceu, não está agendado, e
  // o detalhe do usuário lê `cancellation_intent` filtrando por 'scheduled'.
  // effective_at = agora, pelo mesmo motivo.
  const agora = new Date().toISOString();
  const { error: registroError } = await supabaseAdmin
    .from("subscription_cancellations")
    .insert({
      user_id: uid,
      canceled_by: actorUserId,
      provider_subscription_id: alvo.provider_subscription_id,
      reason_code: "admin",
      reason_text: motivo,
      effective_at: agora,
      status: "completed",
    });
  if (registroError) {
    // O acesso JA caiu (o update acima é o que faz is_user_pro negar). Falha
    // aqui custa a confirmação no histórico, não o efeito.
    console.error(
      `[admin/revoke] acesso de ${uid} revogado, mas subscription_cancellations nao gravou; a acao aparece como "Sem confirmacao" no historico:`,
      registroError,
    );
  }

  return { revoked: true, reason: "revoked", detail: null };
}

/**
 * A regra completa, num lugar só: decide e, se for o caso, executa.
 *
 * As DUAS rotas de devolução (a que chama refunds.create e a que registra um ato
 * externo) passam por aqui. Duplicar a decisão nas duas faria a segunda divergir
 * da primeira na primeira mudança, e a regra é justamente o que a fatia existe
 * para fixar.
 */
async function decidirERevogar(input: {
  uid: string;
  actorUserId: string;
  motivo: string;
  chargeId: string;
  refundableAntes: number;
  valorReembolsado: number;
}): Promise<RevocationOutcome> {
  const shouldRevoke = devolucaoZeraOSaldo(
    input.refundableAntes,
    input.valorReembolsado,
  );

  // Lido SEMPRE, inclusive quando não se revoga nada: o diálogo precisa avisar
  // que a concessão de influencer mantém o Pro, e essa informação não depende de
  // a revogação ter acontecido.
  const influencer = await temInfluencerAtivo(input.uid);

  if (!shouldRevoke) {
    return {
      should_revoke: false,
      revoked: false,
      reason: "partial_refund",
      detail: null,
      still_pro_via_influencer: influencer,
    };
  }

  const resultado = await revogarAcessoPro({
    uid: input.uid,
    actorUserId: input.actorUserId,
    motivo: input.motivo,
    gatilho: { tipo: "refund", chargeId: input.chargeId },
  });
  return {
    should_revoke: true,
    revoked: resultado.revoked,
    reason: resultado.reason,
    detail: resultado.detail,
    still_pro_via_influencer: influencer,
  };
}

// EMISSÃO DE REEMBOLSO. Única ação da demanda sem desfazer.
//
// NÃO respeita BILLING_ENABLED de propósito: o kill-switch existe para parar de
// VENDER, e travar a devolução durante um incidente é o oposto do que se quer.
// getStripe() só exige STRIPE_SECRET_KEY.
//
// BOLETO NÃO TEM CAMINHO DE REEMBOLSO POR AQUI. A devolução da Stripe é por
// `charge`, e as cobranças de boleto entram sem `customer` anexado (`mode:
// payment`), então elas só aparecem no extrato depois que o dono for resolvido
// pelo payment intent. Enquanto houver charge sem dono, ela não é listada e
// portanto não é reembolsável pela interface. Devolver boleto continua sendo
// operação manual, fora da plataforma. Ver docs/aba-usuarios-admin.md.
router.post("/users/:id/refunds", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(
          400,
          "invalid_user_id",
          "Identificador de usuário inválido.",
        ),
      );
    }

    if (refundLimiter(req.user!.id)) {
      return next(
        createError(
          429,
          "rate_limited",
          "Muitos reembolsos seguidos. Espere um minuto.",
        ),
      );
    }

    const corpo = (req.body ?? {}) as {
      charge_id?: unknown;
      amount_cents?: unknown;
      reason?: unknown;
      reason_kind?: unknown;
    };
    const chargeId =
      typeof corpo.charge_id === "string" ? corpo.charge_id.trim() : "";
    if (!chargeId) {
      return next(
        createError(400, "charge_required", "Informe a cobrança a reembolsar."),
      );
    }

    // ESCOPO E TETO, ambos recomputados AQUI. O cliente não é fonte de nada:
    // manda o id da cobrança e o valor, e os dois são reconferidos contra o
    // banco. A agregação é a MESMA da Fatia 4 (buildTransactionList), não uma
    // segunda implementação.
    const { data: linhas, error: linhasError } = await supabaseAdmin
      .from("finance_transactions")
      .select(
        "id, type, gross_cents, fee_cents, net_cents, currency, occurred_at, stripe_charge_id, stripe_invoice_id, plan_code",
      )
      .eq("user_id", uid);

    if (linhasError)
      return next(
        dbError("refund lookup", linhasError, "Erro ao emitir o reembolso."),
      );

    // As declarações entram no MESMO agregado, senão o teto recomputado aqui
    // ignoraria uma devolução externa já registrada e autorizaria devolver de
    // novo dinheiro que já voltou.
    const declaradas = await lerDeclaracoesDeDevolucao(uid);
    if (!declaradas.ok)
      return next(
        dbError(
          "refund declarations",
          { message: declaradas.message },
          "Erro ao emitir o reembolso.",
        ),
      );

    const extrato = buildTransactionList(
      (linhas || []) as FinanceRow[],
      declaradas.linhas,
    );
    const alvo = extrato.items.find(
      (item) => item.stripe_charge_id === chargeId && item.type === "charge",
    );

    // A cobrança precisa ser DESTE usuário. Sem isto, o id de uma cobrança de
    // outra pessoa seria aceito.
    if (!alvo) {
      return next(
        createError(
          404,
          "charge_not_found",
          "Cobrança não encontrada para este usuário.",
        ),
      );
    }

    const validacao = validateRefundRequest(
      {
        ...alvo,
        // Boleto: charge id com prefixo py_ e sem invoice. O SDK da Stripe não
        // lista boleto entre os destinos de reembolso (destination_details),
        // e a devolução sairia por br_bank_transfer, exigindo dados bancários
        // do cliente.
        is_boleto: chargeId.startsWith("py_"),
      },
      {
        amountCents:
          typeof corpo.amount_cents === "number"
            ? corpo.amount_cents
            : undefined,
        reason: typeof corpo.reason === "string" ? corpo.reason : "",
        reasonKind:
          typeof corpo.reason_kind === "string"
            ? (corpo.reason_kind as RefundReason)
            : undefined,
      },
    );
    if (!validacao.ok) {
      const status =
        validacao.error.code === "boleto_not_refundable" ? 409 : 400;
      return next(
        createError(status, validacao.error.code, validacao.error.message),
      );
    }

    const stripeReason = stripeReasonFor(
      validacao.reason,
      corpo.reason_kind as RefundReason,
    );

    // AUDITORIA DA INTENÇÃO, fail-closed, ANTES da Stripe. Sem rastro gravado,
    // dinheiro nenhum sai.
    const { error: auditError } = await supabaseAdmin
      .from("content_audit_logs")
      .insert({
        actor_user_id: req.user!.id,
        action: "refund",
        resource_type: "charge",
        resource_id: uid,
        resource_slug: chargeId,
        before_json: {
          gross_cents: alvo.gross_cents,
          refunded_cents: alvo.refunded_cents,
          refundable_cents: alvo.refundable_cents,
        },
        after_json: {
          amount_cents: validacao.amountCents,
          reason: validacao.reason,
          stripe_reason: stripeReason,
        },
      });
    if (auditError) {
      console.error("[admin] refund audit failed:", auditError);
      return next(
        createError(
          500,
          "audit_failed",
          "Não foi possível registrar a auditoria do reembolso.",
        ),
      );
    }

    let refund: { id: string; status: string | null };
    try {
      const criado = await getStripe().refunds.create(
        {
          charge: chargeId,
          amount: validacao.amountCents,
          reason: stripeReason,
          metadata: {
            admin_reason: validacao.reason.slice(0, 500),
            actor_user_id: req.user!.id,
          },
        },
        {
          idempotencyKey: idempotencyKeyForRefund(
            chargeId,
            validacao.amountCents,
            alvo.refunded_cents,
          ),
        },
      );
      refund = { id: criado.id, status: criado.status ?? null };
    } catch (stripeErr) {
      console.error(
        `[admin/refund] Stripe recusou o reembolso de ${validacao.amountCents} em ${chargeId}:`,
        stripeErr,
      );
      return next(
        createError(
          502,
          "stripe_error",
          "A Stripe recusou o reembolso. Nada foi devolvido.",
        ),
      );
    }

    // DAQUI PARA BAIXO O DINHEIRO JÁ SAIU. Nenhuma falha pode virar mensagem
    // que sugira o contrário.
    const { error: registroError } = await supabaseAdmin
      .from("admin_refunds")
      .insert({
        user_id: uid,
        actor_user_id: req.user!.id,
        stripe_charge_id: chargeId,
        stripe_refund_id: refund.id,
        amount_cents: validacao.amountCents,
        currency: alvo.currency ?? "BRL",
        reason: validacao.reason,
        stripe_reason: stripeReason,
        stripe_status: refund.status,
        // Resultado de uma chamada NOSSA. A balance transaction correspondente
        // vira linha em finance_transactions pelo sync, então esta linha NÃO
        // entra na agregação do extrato: contaria o mesmo dinheiro duas vezes.
        settlement: "stripe_api",
      });
    if (registroError) {
      console.error(
        `[admin/refund] INCONSISTENCIA: reembolso ${refund.id} de ${validacao.amountCents} EMITIDO na Stripe para ${chargeId}, mas admin_refunds nao gravou. A auditoria da intencao existe; o resultado nao.`,
        registroError,
      );
    }

    // REVOGAÇÃO, antes do sync de propósito: ela é o efeito que importa e não
    // depende do extrato estar fresco (ver devolucaoZeraOSaldo). Um sync lento
    // ou quebrado não pode atrasar nem impedir a queda do acesso.
    const acesso = await decidirERevogar({
      uid,
      actorUserId: req.user!.id,
      motivo: validacao.reason,
      chargeId,
      refundableAntes: alvo.refundable_cents,
      valorReembolsado: validacao.amountCents,
    });

    // Extrato fresco. Se falhar, o reembolso continua tendo acontecido.
    let extratoAtualizado = true;
    try {
      await syncBalanceTransactions({
        since: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      });
    } catch (syncErr) {
      extratoAtualizado = false;
      console.warn(
        `[admin/refund] reembolso ${refund.id} emitido, mas o sync falhou; o extrato so atualiza no proximo ciclo:`,
        syncErr,
      );
    }

    await invalidateProStatusCache(uid);

    // 200 SEMPRE que a Stripe aceitou. Devolver erro aqui faria o admin
    // acreditar que o reembolso não aconteceu e tentar de novo — e a segunda
    // tentativa cairia numa Idempotency-Key diferente (o refunded_cents teria
    // mudado) e devolveria DE NOVO. Isso vale IGUALMENTE para a revogação ter
    // falhado: o dinheiro já saiu quando ela é tentada, então transformá-la em
    // erro mentiria sobre o reembolso. O que ficou por fazer vai nos campos
    // abaixo, e o rastro durável está na linha `revoke_pro` do histórico.
    res.json({
      data: {
        refunded: true,
        refund_id: refund.id,
        amount_cents: validacao.amountCents,
        status: refund.status,
        statement_synced: extratoAtualizado,
        record_saved: !registroError,
        access: acesso,
      },
    });
  } catch (err) {
    next(err);
  }
});

// REGISTRO DE DEVOLUCAO FEITA FORA DA PLATAFORMA.
//
// ROTA PROPRIA, e nao um ramo do /refunds, porque registrar um fato externo nao
// e emitir reembolso: aqui nao ha refunds.create, nao ha Idempotency-Key da
// Stripe e nao ha dinheiro saindo por nossa ordem. Misturar as duas coisas num
// endpoint faria o nome mentir e daria ao cartao um caminho de "declarar"
// devolucao que ele nao deve ter (para cartao existe a rota de verdade).
//
// SO BOLETO. A recusa mora AQUI e nao so na UI, pelo mesmo motivo da Fatia 6: se
// a guarda fosse visual, a proxima chamada direta a rota a contornaria.
//
// COMO O CODIGO DISTINGUE OS DOIS CASOS. A pergunta que importa nao e "o que o
// admin fez", e sim "a Stripe vai gerar uma linha de dinheiro para isto?". A
// resposta e verificavel: se existe objeto Refund na cobranca, a balance
// transaction dele vira linha em finance_transactions pelo syncBalanceTransactions.
// Entao o discriminador e refunds.list({ charge }), nao uma pergunta no dialogo.
// Nao e um proxy da pergunta: a existencia do Refund e a CONDICAO que produz a
// linha duplicada.
//
//   >= 1 Refund  -> settlement='stripe_dashboard'. O sync traz o dinheiro; esta
//                   linha guarda ator, motivo e vinculo com a auditoria, e NAO
//                   entra na agregacao do extrato.
//   0 Refunds    -> settlement='external'. A Stripe nunca soube e nenhum sync
//                   vai trazer; esta linha e o unico registro que existe, e e a
//                   unica que CONTA na agregacao.
//   Stripe muda  -> 502. Sem veredito nao ha escrita: chutar 'external' contaria
//                   duas vezes e chutar 'stripe_dashboard' perderia o valor.
//
// A doc da Stripe se contradiz sobre boleto ser reembolsavel (a pagina do
// metodo diz que nao; a pagina de refunds lista boleto entre os metodos sem
// suporte nativo, atendidos por um Refund em `requires_action` com coleta de
// dados bancarios por e-mail). Por isso o codigo NAO decide por conhecimento
// previo: ele pergunta a Stripe a cada registro, e as duas versoes do mundo dao
// o mesmo resultado correto.
router.post("/users/:id/external-refunds", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(
          400,
          "invalid_user_id",
          "Identificador de usuário inválido.",
        ),
      );
    }

    // Mesmo teto por ator do reembolso emitido: esta rota nao move dinheiro, mas
    // REMOVE ACESSO, e o efeito de um script disparando dezenas dela e do mesmo
    // tamanho.
    if (refundLimiter(req.user!.id)) {
      return next(
        createError(
          429,
          "rate_limited",
          "Muitos registros seguidos. Espere um minuto.",
        ),
      );
    }

    const corpo = (req.body ?? {}) as {
      charge_id?: unknown;
      amount_cents?: unknown;
      reason?: unknown;
      confirmed?: unknown;
    };
    const chargeId =
      typeof corpo.charge_id === "string" ? corpo.charge_id.trim() : "";
    if (!chargeId) {
      return next(
        createError(400, "charge_required", "Informe a cobrança devolvida."),
      );
    }

    // DECLARACAO EXPLICITA, exigida na rota e nao so na tela. O sistema nao tem
    // como verificar que a devolucao aconteceu: o que ele registra e a palavra
    // do admin, e a rota so aceita quando essa palavra foi dada. `=== true` de
    // proposito, para "false", "0" e string vazia nao passarem por coercao.
    if (corpo.confirmed !== true) {
      return next(
        createError(
          400,
          "confirmation_required",
          "É preciso confirmar que a devolução foi feita.",
        ),
      );
    }

    const { data: linhas, error: linhasError } = await supabaseAdmin
      .from("finance_transactions")
      .select(
        "id, type, gross_cents, fee_cents, net_cents, currency, occurred_at, stripe_charge_id, stripe_invoice_id, plan_code",
      )
      .eq("user_id", uid);

    if (linhasError)
      return next(
        dbError(
          "external refund lookup",
          linhasError,
          "Erro ao registrar a devolução.",
        ),
      );

    const declaradas = await lerDeclaracoesDeDevolucao(uid);
    if (!declaradas.ok)
      return next(
        dbError(
          "external refund declarations",
          { message: declaradas.message },
          "Erro ao registrar a devolução.",
        ),
      );

    const extrato = buildTransactionList(
      (linhas || []) as FinanceRow[],
      declaradas.linhas,
    );
    const alvo = extrato.items.find(
      (item) => item.stripe_charge_id === chargeId && item.type === "charge",
    );
    if (!alvo) {
      return next(
        createError(
          404,
          "charge_not_found",
          "Cobrança não encontrada para este usuário.",
        ),
      );
    }

    // Cartao tem rota de verdade; declarar devolucao dele seria criar um jeito
    // de marcar como devolvido dinheiro que nunca voltou.
    if (!chargeId.startsWith("py_")) {
      return next(
        createError(
          409,
          "card_use_refunds_route",
          "Esta é uma cobrança de cartão: use o reembolso normal, que devolve o dinheiro de verdade.",
        ),
      );
    }

    // IDEMPOTENCIA. O teto recomputado ja barra a segunda declaracao 'external'
    // (a primeira zera refundable_cents), mas NAO barra a segunda
    // 'stripe_dashboard', porque essa nao entra na agregacao. Sem esta
    // pre-checagem, um duplo clique nesse caso geraria duas linhas e duas
    // auditorias de uma acao que remove acesso.
    const jaRegistrada = declaradas.linhas.some(
      (d) => d.stripe_charge_id === chargeId && d.settlement !== "stripe_api",
    );
    if (jaRegistrada) {
      return res.json({
        data: { registered: false, already_registered: true },
      });
    }

    const validacao = validateRefundRequest(
      alvo,
      {
        amountCents:
          typeof corpo.amount_cents === "number"
            ? corpo.amount_cents
            : undefined,
        reason: typeof corpo.reason === "string" ? corpo.reason : "",
      },
      { permitirBoleto: true },
    );
    if (!validacao.ok) {
      return next(
        createError(400, validacao.error.code, validacao.error.message),
      );
    }

    // O DISCRIMINADOR. Antes de qualquer escrita: sem veredito, nada e gravado.
    let settlement: "stripe_dashboard" | "external";
    try {
      const naStripe = await getStripe().refunds.list({
        charge: chargeId,
        limit: 100,
      });
      settlement =
        (naStripe.data?.length ?? 0) > 0 ? "stripe_dashboard" : "external";
    } catch (stripeErr) {
      console.error(
        `[admin/external-refund] nao foi possivel checar reembolsos de ${chargeId} na Stripe; nada foi registrado:`,
        stripeErr,
      );
      return next(
        createError(
          502,
          "stripe_unreachable",
          "Não foi possível confirmar com a Stripe se já existe um reembolso nesta cobrança. Nada foi registrado.",
        ),
      );
    }

    // AUDITORIA DA INTENCAO, fail-closed, ANTES da escrita e da revogacao.
    // `declaration: true` e `verified_by_system: false` deixam explicito no
    // proprio registro que isto e a palavra do admin, nao algo que a plataforma
    // observou. A distincao importa: todo o resto do historico registra acoes
    // cujo efeito a plataforma executou.
    const { error: auditError } = await supabaseAdmin
      .from("content_audit_logs")
      .insert({
        actor_user_id: req.user!.id,
        action: "refund_external",
        resource_type: "charge",
        resource_id: uid,
        resource_slug: chargeId,
        before_json: {
          gross_cents: alvo.gross_cents,
          refunded_cents: alvo.refunded_cents,
          refundable_cents: alvo.refundable_cents,
        },
        after_json: {
          amount_cents: validacao.amountCents,
          reason: validacao.reason,
          settlement,
          declaration: true,
          verified_by_system: false,
        },
      });
    if (auditError) {
      console.error("[admin] external refund audit failed:", auditError);
      return next(
        createError(
          500,
          "audit_failed",
          "Não foi possível registrar a auditoria da devolução.",
        ),
      );
    }

    // stripe_refund_id NULO nos dois casos, de proposito: a coluna guarda o id
    // devolvido por uma chamada NOSSA, e aqui nao houve nenhuma. Quem diz o que
    // aconteceu e `settlement`.
    const { error: registroError } = await supabaseAdmin
      .from("admin_refunds")
      .insert({
        user_id: uid,
        actor_user_id: req.user!.id,
        stripe_charge_id: chargeId,
        stripe_refund_id: null,
        amount_cents: validacao.amountCents,
        currency: alvo.currency ?? "BRL",
        reason: validacao.reason,
        settlement,
      });
    if (registroError) {
      // Ao contrario do /refunds (onde o dinheiro ja saiu quando esta escrita
      // acontece e falhar nao pode virar erro), AQUI a escrita E a acao. Sem
      // ela nao ha registro nenhum, entao o erro sobe e nada e revogado.
      console.error(
        "[admin/external-refund] insert em admin_refunds falhou:",
        registroError,
      );
      return next(
        dbError(
          "external refund insert",
          registroError,
          "Não foi possível registrar a devolução.",
        ),
      );
    }

    const acesso = await decidirERevogar({
      uid,
      actorUserId: req.user!.id,
      motivo: validacao.reason,
      chargeId,
      refundableAntes: alvo.refundable_cents,
      valorReembolsado: validacao.amountCents,
    });

    // So no caso (a): existe objeto Refund na Stripe, entao vale puxar a balance
    // transaction dele agora em vez de esperar o ciclo. No caso (b) nao ha nada
    // para sincronizar e a chamada seria custo puro.
    let extratoAtualizado = true;
    if (settlement === "stripe_dashboard") {
      try {
        await syncBalanceTransactions({
          since: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        });
      } catch (syncErr) {
        extratoAtualizado = false;
        console.warn(
          `[admin/external-refund] devolucao de ${chargeId} registrada, mas o sync falhou; o extrato so atualiza no proximo ciclo:`,
          syncErr,
        );
      }
    }

    await invalidateProStatusCache(uid);

    res.json({
      data: {
        registered: true,
        amount_cents: validacao.amountCents,
        settlement,
        statement_synced: extratoAtualizado,
        access: acesso,
      },
    });
  } catch (err) {
    next(err);
  }
});

// REVOGACAO AVULSA DE ACESSO PRO, sem devolver dinheiro.
//
// POR QUE ELA EXISTE. Quando a revogacao automatica falha DEPOIS de um reembolso
// bem-sucedido (dinheiro devolvido, acesso mantido), a unica saida na interface
// era "Cancelar Pro", que agenda para o fim do periodo, ou seja, entrega
// exatamente o bug que a Fatia de reembolso fechou. A instrucao dizia "revogue a
// mao" e nao havia mao. Esta rota E a mao.
//
// ROTA FINA de proposito: ela nao tem regra propria. Toda a decisao de COMO
// revogar (status e nao periodo, Stripe antes do banco, boleto sem chamada a
// Stripe) vive em revogarAcessoPro, e uma segunda copia divergiria da primeira
// na primeira mudanca. O que a rota faz e validar a entrada, escolher o gatilho
// e traduzir o resultado em status HTTP.
//
// AUDITORIA: action `revoke_pro`, a MESMA do caminho automatico. Nao e economia
// de nome, e o contrario de ambiguidade:
//
//   (a) o EFEITO e identico (acesso Pro removido na hora) e a linha de RESULTADO
//       e a mesma (subscription_cancellations), entao o cruzamento
//       intencao-vs-resultado da Fatia 8 funciona nos dois usos sem ramo novo;
//   (b) o que difere e o MOTIVO, e ele ja esta gravado: `after_json.trigger` vale
//       'refund' ou 'standalone', esta na allowlist de exibicao e aparece na
//       tela, entao o historico distingue os dois sem precisar de duas actions;
//   (c) uma action nova exigiria entrada em CINCO lugares (CHECK da migration,
//       ACOES_DE_USUARIO, CAMPOS_VISIVEIS_POR_ACTION, ACAO_META e o cruzamento)
//       para produzir comportamento IGUAL, e criaria dois nomes para um efeito:
//       a pergunta "quando o Pro foi revogado administrativamente?" passaria a
//       depender de alguem lembrar dos dois.
//
// POSTURA DE ERRO OPOSTA A DO REEMBOLSO, e de proposito. La o dinheiro ja saiu
// quando a revogacao e tentada, entao falha vira 200 com aviso. Aqui NADA
// aconteceu antes, entao falha vira ERRO: o estado do usuario e o mesmo de antes
// e dizer "ok" seria mentir.
router.post("/users/:id/subscription/revoke", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(
          400,
          "invalid_user_id",
          "Identificador de usuário inválido.",
        ),
      );
    }

    const motivoRaw = (req.body as { reason?: unknown } | undefined)?.reason;
    const motivo = typeof motivoRaw === "string" ? motivoRaw.trim() : "";
    if (!motivo) {
      return next(
        createError(400, "reason_required", "Informe o motivo da revogação."),
      );
    }

    const resultado = await revogarAcessoPro({
      uid,
      actorUserId: req.user!.id,
      motivo,
      gatilho: { tipo: "standalone" },
    });

    if (resultado.reason === "no_active_subscription") {
      // IDEMPOTENCIA. `no_active_subscription` cobre dois casos que a resposta
      // NAO pode confundir: quem ja foi revogado (o efeito desejado ja vale, e a
      // resposta e sucesso, sem reexecutar nada) e quem nunca assinou (nao ha
      // sobre o que agir, e dizer "revogado" afirmaria um passado que nao
      // existiu). A consulta extra so roda neste caminho.
      const { data: qualquer, error: qualquerError } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("user_id", uid)
        .limit(1)
        .maybeSingle();
      if (qualquerError)
        return next(
          dbError("revoke history lookup", qualquerError, "Erro ao revogar."),
        );
      if (!qualquer) {
        return next(
          createError(404, "not_found", "Este usuário nunca teve assinatura."),
        );
      }
      return res.json({
        data: {
          revoked: false,
          already_revoked: true,
          still_pro_via_influencer: await temInfluencerAtivo(uid),
        },
      });
    }

    if (!resultado.revoked) {
      // O ponto de falha decide o status. Ler a mensagem para adivinhar seria a
      // forma frágil de fazer a mesma coisa.
      const porFalha: Record<
        RevocationFailure,
        { status: number; code: string; message: string }
      > = {
        read: {
          status: 500,
          code: "db_error",
          message: "Erro ao ler a assinatura.",
        },
        audit: {
          status: 500,
          code: "audit_failed",
          message: "Não foi possível registrar a auditoria da revogação.",
        },
        stripe: {
          status: 502,
          code: "stripe_error",
          message:
            "A Stripe não cancelou a assinatura. Nada foi alterado, tente de novo.",
        },
        db: {
          status: 500,
          code: "db_error",
          message:
            "A assinatura foi cancelada no provedor, mas houve erro ao registrar. O acesso cai quando o webhook chegar.",
        },
      };
      const saida = porFalha[resultado.failure ?? "db"];
      return next(createError(saida.status, saida.code, saida.message));
    }

    await invalidateProStatusCache(uid);

    res.json({
      data: {
        revoked: true,
        // Concessão de influencer é ORTOGONAL: revogar a assinatura não a toca,
        // e sem este campo o admin veria a pessoa seguir Pro e acharia que a
        // ação falhou.
        still_pro_via_influencer: await temInfluencerAtivo(uid),
      },
    });
  } catch (err) {
    next(err);
  }
});

// CANCELAMENTO DE ASSINATURA PELO ADMIN. Primeira acao que REMOVE acesso.
//
// Nao e imediato: reusa stripeProvider.cancel, que agenda para o fim do periodo
// (cancel_at_period_end). A pessoa mantem Pro ate current_period_end.
//
// BOLETO fica de fora, com codigo proprio. `renewal_type='manual'` nao tem
// assinatura recorrente na Stripe (provider_subscription_id e um cs_...), e
// setar cancel_at_period_end nele coloca a linha na fila do cron
// process-cancellations, que chama subscriptions.retrieve com um id de sessao e
// falha a cada hora, para sempre. A recusa mora AQUI e nao so na UI: se a
// guarda fosse so visual, a proxima chamada direta a rota acordaria o bug.
router.post("/users/:id/subscription/cancel", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(
          400,
          "invalid_user_id",
          "Identificador de usuário inválido.",
        ),
      );
    }

    const motivoRaw = (req.body as { reason?: unknown } | undefined)?.reason;
    const motivo = typeof motivoRaw === "string" ? motivoRaw.trim() : "";
    if (!motivo) {
      return next(
        createError(
          400,
          "reason_required",
          "Informe o motivo do cancelamento.",
        ),
      );
    }

    const { data: sub, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "id, status, renewal_type, current_period_end, cancel_at_period_end",
      )
      .eq("user_id", uid)
      .eq("provider", "stripe")
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError)
      return next(dbError("admin cancel lookup", subError, "Erro ao cancelar."));
    if (!sub) {
      return next(
        createError(404, "not_found", "Nenhuma assinatura ativa encontrada."),
      );
    }

    if (sub.renewal_type === "manual") {
      return next(
        createError(
          409,
          "boleto_not_supported",
          "Assinatura de boleto não renova sozinha e não se cancela por aqui. O acesso termina no fim do período já pago.",
        ),
      );
    }

    // IDEMPOTENCIA: cancelamento ja agendado responde sucesso sem reexecutar e
    // sem segunda linha de auditoria. Duplo clique nao pode gerar dois
    // registros de uma acao que remove acesso.
    if (sub.cancel_at_period_end) {
      return res.json({
        data: {
          canceled: false,
          already_scheduled: true,
          effective_at: sub.current_period_end,
        },
      });
    }

    // AUDITORIA PRIMEIRO, fail-closed, no molde de /influencer. Sem rastro
    // gravado, ninguem perde acesso.
    const { error: auditError } = await supabaseAdmin
      .from("content_audit_logs")
      .insert({
        actor_user_id: req.user!.id,
        action: "cancel_subscription",
        resource_type: "subscription",
        resource_id: uid,
        resource_slug: null,
        before_json: {
          status: sub.status,
          cancel_at_period_end: sub.cancel_at_period_end,
          current_period_end: sub.current_period_end,
        },
        after_json: { cancel_at_period_end: true, reason: motivo },
      });
    if (auditError) {
      console.error("[admin] cancel subscription audit failed:", auditError);
      return next(
        createError(
          500,
          "audit_failed",
          "Não foi possível registrar a auditoria do cancelamento.",
        ),
      );
    }

    // Reusa o UNICO caminho de cancelamento. A postura de erro dele fica
    // preservada: Stripe falha -> 502 e banco intocado; banco falha depois da
    // Stripe -> INCONSISTENCIA logada e 500.
    const resultado = await stripeProvider.cancel({
      userId: uid,
      actorUserId: req.user!.id,
      reasonCode: "admin",
      reasonText: motivo,
    });

    await invalidateProStatusCache(uid);

    res.json({ data: { canceled: true, ...resultado } });
  } catch (err) {
    next(err);
  }
});

// O que existe hoje ligado ao e-mail ATUAL, por tabela. LEITURA, mostrada ao
// admin ANTES de ele confirmar a troca.
//
// Estas linhas NAO sao migradas pela troca (decisao de produto), e o motivo de
// mostra-las e que a decisao de mexer nelas depois seja tomada com o numero na
// frente, nao de memoria.
router.get("/users/:id/email-usage", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(400, "invalid_user_id", "Identificador de usuário inválido."),
      );
    }

    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("user_id", uid)
      .maybeSingle();
    if (perfilError)
      return next(
        dbError("email usage profile", perfilError, "Erro ao consultar."),
      );
    if (!perfil)
      return next(createError(404, "not_found", "Usuário não encontrado."));

    const email = (perfil.email || "").trim().toLowerCase();
    if (!email) {
      return res.json({ data: { email: null, usage: [] } });
    }

    // Contagem em lote, uma consulta por tabela, com head:true (so o count
    // trafega). Erro de UMA tabela nao derruba as demais: a contagem vira null
    // e a UI mostra "não foi possível contar" naquela linha, em vez de sumir
    // com a informacao inteira.
    const alvos: Array<{ tabela: string; rotulo: string }> = [
      { tabela: "newsletter_subscribers", rotulo: "Newsletter" },
      { tabela: "email_suppressions", rotulo: "Supressões de envio" },
      { tabela: "contact_list_members", rotulo: "Listas de contato" },
      { tabela: "waitlist", rotulo: "Lista de espera" },
      { tabela: "email_campaign_recipients", rotulo: "Campanhas enviadas" },
    ];

    const usage = await Promise.all(
      alvos.map(async ({ tabela, rotulo }) => {
        const { count, error } = await supabaseAdmin
          .from(tabela)
          .select("*", { count: "exact", head: true })
          .eq("email", email);
        if (error) {
          console.warn(`[admin] email-usage ${tabela} falhou:`, error.message);
          return { table: tabela, label: rotulo, count: null };
        }
        return { table: tabela, label: rotulo, count: count ?? 0 };
      }),
    );

    res.json({ data: { email, usage } });
  } catch (err) {
    next(err);
  }
});

// TROCA DE E-MAIL. Rota separada do PATCH de perfil de propósito: nao e um
// campo de formulario, e a identidade de LOGIN que muda.
//
// Ordem: audit (fail-closed) -> Auth -> profiles -> Stripe (best-effort).
// O comportamento de cada falha esta comentado no proprio passo.
//
// O QUE ESTA ROTA NAO ALCANCA, medido em 2026-07-30 e registrado para nao ser
// redescoberto como bug (detalhe em docs/aba-usuarios-admin.md):
//
//   (a) auth.identities[].identity_data.email FICA COM O ENDERECO ANTIGO. A API
//       admin do Supabase nao expoe escrita em identities, entao nao ha como
//       corrigir daqui. Login e recuperacao usam auth.users.email, que a rota
//       atualiza, entao o efeito e uma divergencia visivel em quem inspeciona o
//       objeto de identidade, nao uma quebra de acesso.
//
//   (b) email_suppressions com reason='unsubscribed' NAO acompanha o endereco
//       novo. Isso e CONSENTIMENTO, e migrar automaticamente seria decidir por
//       terceiro que o descadastro de um endereco vale para outro. 5 linhas
//       hoje. Decisao consciente de nao automatizar; se alguem trocar o e-mail
//       de uma conta descadastrada, o endereco novo volta a ser alcancavel.
router.post("/users/:id/email", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(400, "invalid_user_id", "Identificador de usuário inválido."),
      );
    }

    const novoEmail = normalizeEmail(
      (req.body as { email?: unknown } | undefined)?.email as string,
    );
    const invalido = validateNewEmail(novoEmail);
    if (invalido) {
      return next(createError(400, invalido.code, invalido.message));
    }

    // auth.users e a FONTE da identidade; profiles e espelho. Le os dois.
    const { data: authData, error: authReadError } =
      await supabaseAdmin.auth.admin.getUserById(uid);
    if (authReadError || !authData?.user) {
      // Perfil sem linha em auth.users: 404. Nao criamos conta a partir do
      // admin, e "trocar o e-mail" de quem nao tem identidade nao significa
      // nada. Medido em 2026-07-30: zero casos em producao (a FK de profiles e
      // ON DELETE CASCADE), entao isto e defesa, nao caminho esperado.
      return next(
        createError(404, "not_found", "Usuário não encontrado no Auth."),
      );
    }

    const emailAtual = normalizeEmail(authData.user.email);

    // IDEMPOTENCIA. Duplo clique ou reenvio nao reexecuta nada e NAO grava uma
    // segunda linha de auditoria. Uma troca de identidade registrada duas vezes
    // e o tipo de coisa que ninguem nota ate o log ficar estranho.
    if (emailAtual === novoEmail) {
      return res.json({ data: { changed: false, email: emailAtual } });
    }

    // AUDITORIA PRIMEIRO, fail-closed. Aqui pesa mais que na edicao de perfil:
    // sem rastro gravado, a troca de identidade nao acontece. Conta mudar de
    // dono sem registro de quem mudou e o pior desfecho desta rota.
    const { error: auditError } = await supabaseAdmin
      .from("content_audit_logs")
      .insert({
        actor_user_id: req.user!.id,
        action: "update_email",
        resource_type: "user_email",
        resource_id: uid,
        resource_slug: null,
        before_json: { email: emailAtual },
        after_json: { email: novoEmail },
      });
    if (auditError) {
      console.error("[admin] email change audit failed:", auditError);
      return next(
        createError(
          500,
          "audit_failed",
          "Não foi possível registrar a auditoria da troca.",
        ),
      );
    }

    // PASSO 1: Auth. E o unico passo cuja falha impede tudo o mais.
    // email_confirm: true marca o endereco como confirmado em vez de disparar
    // fluxo de confirmacao (semantica dos tipos de @supabase/auth-js 2.105.3).
    // Sem isso, o recurso seria inutil: o endereco esta errado justamente
    // porque foi digitado errado, e a pessoa nao recebe o link.
    //
    // user_metadata vai junto e COMPLETO: o email tambem vive la (3212 de 3218
    // contas). Objeto inteiro, nunca so { email }, para nao arriscar apagar
    // name/avatar_url caso o GoTrue substitua em vez de mesclar.
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      uid,
      {
        email: novoEmail,
        email_confirm: true,
        user_metadata: mergedUserMetadata(
          authData.user.user_metadata as Record<string, unknown> | null,
          novoEmail,
        ),
      },
    );

    if (authError) {
      // Colisao e o caso principal: auth.users.email tem UNIQUE. Traduz para
      // 409 legivel; a mensagem crua do Auth vem em ingles e cita tabela, o que
      // nao ajuda quem esta na tela.
      if (emailAlreadyTakenError(authError)) {
        return next(
          createError(
            409,
            "email_taken",
            "Este e-mail já pertence a outra conta.",
          ),
        );
      }
      console.error("[admin] email change auth failed:", authError);
      return next(
        createError(502, "auth_error", "Não foi possível trocar o e-mail."),
      );
    }

    // PASSO 2: espelho em profiles. Se falhar AQUI, o estado ja e inconsistente
    // de verdade: o login mudou e o espelho nao. NAO tentamos reverter o Auth:
    // desfazer uma identidade que talvez ja tenha sido usada e pior que
    // registrar a divergencia. Loga INCONSISTENCIA e responde de forma que o
    // admin saiba que precisa agir.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ email: novoEmail })
      .eq("user_id", uid);

    if (profileError) {
      console.error(
        `[admin] INCONSISTENCIA: e-mail trocado no Auth para ${novoEmail} (user ${uid}) mas profiles.email NAO foi atualizado. O login ja e o novo; o espelho ainda e ${emailAtual}. Corrigir manualmente.`,
        profileError,
      );
      return next(
        createError(
          500,
          "profile_mirror_failed",
          "O login já foi trocado, mas o cadastro não acompanhou. Avise o time técnico antes de tentar de novo.",
        ),
      );
    }

    // PASSO 3: Stripe, BEST-EFFORT. A troca de identidade ja valeu; recibo com
    // endereco velho e problema menor que derrubar a operacao. Quem nunca
    // assinou nao tem customer, e nem chegamos a chamar a Stripe.
    let stripeUpdated = false;
    try {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("provider_customer_id")
        .eq("user_id", uid)
        .not("provider_customer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sub?.provider_customer_id) {
        await getStripe().customers.update(sub.provider_customer_id, {
          email: novoEmail,
        });
        stripeUpdated = true;
      }
    } catch (stripeErr) {
      console.warn(
        `[admin] e-mail trocado, mas customers.update falhou para o user ${uid}; recibos futuros vao para o endereco antigo:`,
        stripeErr,
      );
    }

    res.json({
      data: { changed: true, email: novoEmail, stripe_updated: stripeUpdated },
    });
  } catch (err) {
    next(err);
  }
});

// Edicao de cadastro pelo admin. LEITURA sensivel e escrita sensivel ficam de
// fora: cpf, email e handle tem cada um o seu motivo, registrado em
// ADMIN_EXCLUDED_PROFILE_FIELDS (shared/profileFields.ts), e a allowlist e
// afirmada por teste contra a de /api/me.
//
// Nao invalida o cache de status Pro: nenhum destes campos entra no
// is_user_pro (que olha subscriptions e influencers). Se um dia entrar, a
// invalidacao vai aqui.
router.patch("/users/:id", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(400, "invalid_user_id", "Identificador de usuário inválido."),
      );
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    // expected_updated_at nao e campo de perfil: sai do corpo antes da
    // allowlist, senao seria recusado como campo desconhecido.
    const expectedUpdatedAt = body.expected_updated_at;
    delete body.expected_updated_at;

    const { data: atual, error: readError } = await supabaseAdmin
      .from("profiles")
      .select(
        "name, full_name, gender, bio, area_interesse, nivel_atual, objetivo, headline, city, uf, career_goal, github_url, linkedin_url, website_url, updated_at",
      )
      .eq("user_id", uid)
      .maybeSingle();

    if (readError)
      return next(dbError("PATCH /users/:id", readError, "Erro ao salvar."));
    if (!atual)
      return next(createError(404, "not_found", "Usuário não encontrado."));

    // TRAVA OTIMISTA. Sao 2 admins hoje (medido), entao a colisao e improvavel;
    // o que ela protege nao e o dado, e a AUDITORIA: sem isto, o segundo a
    // salvar grava um before_json que ja era falso quando foi escrito, e o
    // rastro passa a mentir justamente no registro que existe para nao mentir.
    // A checagem se repete no .eq() do update, que e o ponto atomico.
    if (
      typeof expectedUpdatedAt === "string" &&
      atual.updated_at !== expectedUpdatedAt
    ) {
      return next(
        createError(
          409,
          "stale_profile",
          "Este cadastro mudou depois que você abriu. Feche e abra de novo para ver o estado atual.",
        ),
      );
    }

    const patch = buildProfilePatch(atual as Record<string, unknown>, body);
    if (!patch.ok) {
      return next(createError(400, patch.error.code, patch.error.message));
    }

    // Sem mudanca efetiva: nao audita e NAO toca a tabela. profiles tem trigger
    // `profiles_updated_at -> set_updated_at`, entao um update vazio ainda
    // bateria o carimbo e deixaria rastro de "editado agora" sobre nada.
    if (!patch.hasChanges) {
      return res.json({ data: { updated: false, fields: [] } });
    }

    // AUDITORIA PRIMEIRO, fail-closed, no molde de POST /users/:id/influencer.
    // NAO usa o helper logAudit(): ele engole o erro num console.warn, e aqui a
    // ausencia de rastro tem que impedir a escrita, nao passar batida.
    const { error: auditError } = await supabaseAdmin
      .from("content_audit_logs")
      .insert({
        actor_user_id: req.user!.id,
        action: "update_profile",
        resource_type: "profile",
        resource_id: uid,
        resource_slug: null,
        before_json: patch.before,
        after_json: patch.after,
      });
    if (auditError) {
      console.error("[admin] profile update audit failed:", auditError);
      return next(
        createError(
          500,
          "audit_failed",
          "Não foi possível registrar a auditoria da edição.",
        ),
      );
    }

    // O .eq("updated_at") repete a trava, agora sem janela entre ler e
    // escrever. Zero linhas afetadas = alguem salvou no meio do caminho.
    let update = supabaseAdmin.from("profiles").update(patch.changes);
    update = update.eq("user_id", uid);
    if (typeof expectedUpdatedAt === "string") {
      update = update.eq("updated_at", expectedUpdatedAt);
    }
    const { data: updated, error: updateError } = await update.select("user_id");

    if (updateError)
      return next(dbError("PATCH /users/:id", updateError, "Erro ao salvar."));

    if (!updated || updated.length === 0) {
      // Corrida real na janela de milissegundos. A linha de auditoria ja foi
      // escrita e fica: o rastro registra a TENTATIVA, que e o lado seguro de
      // errar (auditar demais, nunca de menos).
      console.warn(
        `[admin] PATCH /users/${uid}: update nao afetou linha (conflito de updated_at); audit ja gravado.`,
      );
      return next(
        createError(
          409,
          "stale_profile",
          "Este cadastro mudou depois que você abriu. Feche e abra de novo para ver o estado atual.",
        ),
      );
    }

    res.json({
      data: { updated: true, fields: Object.keys(patch.changes) },
    });
  } catch (err) {
    next(err);
  }
});

// Teto do extrato. NAO ha paginacao aqui de proposito: medido em 2026-07-29, o
// MAXIMO de linhas por usuario em producao e 1 (55 linhas no total, 50 usuarios
// com transacao, media 1.00). Paginar um punhado custaria estado de pagina na
// UI e uma segunda requisicao para nada. O teto existe so como para-quedas.
const TRANSACTIONS_LIMIT = 200;

// Extrato de compras do usuario. LEITURA. O estado de reembolso por cobranca
// (refunded_cents, disputed_cents, refundable_cents) e agregado no SERVIDOR:
// ver o aviso no topo de server/lib/userTransactions.ts antes de mexer.
router.get("/users/:id/transactions", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(400, "invalid_user_id", "Identificador de usuário inválido."),
      );
    }

    // Busca UMA linha alem do teto para saber se truncou, em vez de comparar
    // com o teto (que nao distingue "exatamente 200" de "mais que 200").
    const { data, error } = await supabaseAdmin
      .from("finance_transactions")
      .select(
        "id, type, gross_cents, fee_cents, net_cents, currency, occurred_at, stripe_charge_id, stripe_invoice_id, plan_code",
      )
      .eq("user_id", uid)
      .order("occurred_at", { ascending: false })
      // Desempate por chave unica desde o inicio: occurred_at nao e unico e a
      // ordem entre linhas do mesmo instante nao e garantida sem isto.
      .order("id", { ascending: false })
      .limit(TRANSACTIONS_LIMIT + 1);

    if (error)
      return next(
        dbError("user transactions", error, "Erro ao buscar as compras."),
      );

    // Segunda fonte: devoluções que a Stripe nunca soube. Falha aqui é
    // fail-loud, não lista vazia: um extrato sem as declarações mostraria a
    // cobrança como não reembolsada e ofereceria um botão de devolver de novo.
    const declaradas = await lerDeclaracoesDeDevolucao(uid);
    if (!declaradas.ok)
      return next(
        dbError(
          "user refund declarations",
          { message: declaradas.message },
          "Erro ao buscar as compras.",
        ),
      );

    const rows = data || [];
    const truncated = rows.length > TRANSACTIONS_LIMIT;
    const list = buildTransactionList(
      (truncated ? rows.slice(0, TRANSACTIONS_LIMIT) : rows) as FinanceRow[],
      declaradas.linhas,
    );

    // truncated vai na resposta para a UI poder AVISAR. Corte silencioso e a
    // classe de defeito que este projeto ja documentou: o total pareceria
    // completo sendo parcial.
    res.json({
      data: { ...list, truncated, limit: TRANSACTIONS_LIMIT },
    });
  } catch (err) {
    next(err);
  }
});

// Historico administrativo do usuario. Teto generoso de proposito: medido em
// 2026-07-30, existem 26 linhas com escopo de usuario em content_audit_logs no
// total, e no maximo 2 por pessoa. Paginar isso seria construir mecanismo para
// um problema que nao existe; o teto e um limite de sanidade, e ele AVISA
// quando corta.
const AUDIT_LIMIT = 100;

// Ações do admin sobre um usuario. Enumeradas de proposito, e nao derivadas de
// "tudo que tem resource_id igual ao uid": um resource_id de conteudo pode
// coincidir com um uuid de usuario, e uma acao nova sobre usuario que nasca
// fora desta lista some da tela em silencio, o que e melhor que a tela passar a
// exibir linha de outro dominio como se fosse do usuario.
const ACOES_DE_USUARIO = [
  "reveal",
  "grant",
  "revoke",
  "update_profile",
  "update_email",
  "cancel_subscription",
  "refund",
  "refund_external",
  "revoke_pro",
] as const;

router.get("/users/:id/audit", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(
          400,
          "invalid_user_id",
          "Identificador de usuário inválido.",
        ),
      );
    }

    // Uma linha alem do teto para distinguir "exatamente AUDIT_LIMIT" de "mais
    // que AUDIT_LIMIT", mesmo padrao de /transactions.
    const { data: logsData, error: logsError } = await supabaseAdmin
      .from("content_audit_logs")
      .select(
        "id, action, resource_type, resource_id, resource_slug, actor_user_id, before_json, after_json, created_at",
      )
      .eq("resource_id", uid)
      .in("action", ACOES_DE_USUARIO as unknown as string[])
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(AUDIT_LIMIT + 1);

    // O historico em si e fail-loud: se a leitura do log falha, a tela nao pode
    // mostrar "nenhuma ação registrada", que e uma afirmacao sobre o passado.
    if (logsError)
      return next(
        dbError("user audit logs", logsError, "Erro ao buscar o histórico."),
      );

    const rows = logsData || [];
    const truncated = rows.length > AUDIT_LIMIT;
    const logs = (
      truncated ? rows.slice(0, AUDIT_LIMIT) : rows
    ) as AuditLogRow[];

    // As tres consultas seguintes sao independentes entre si e nenhuma depende
    // do resultado da outra: uma rodada so, sem N+1 por linha.
    const actorIds = Array.from(
      new Set(logs.map((l) => l.actor_user_id).filter((v): v is string => !!v)),
    );

    const [atoresRes, refundsRes, cancelamentosRes] = await Promise.all([
      actorIds.length
        ? supabaseAdmin
            .from("profiles")
            .select("user_id, name, email")
            .in("user_id", actorIds)
        : Promise.resolve({ data: [], error: null }),
      supabaseAdmin
        .from("admin_refunds")
        .select("stripe_charge_id, amount_cents, stripe_refund_id, settlement")
        .eq("user_id", uid),
      supabaseAdmin
        .from("subscription_cancellations")
        .select("canceled_at, status, effective_at")
        .eq("user_id", uid),
    ]);

    const atores = new Map<string, string>();
    for (const p of atoresRes.data || []) {
      const nome = (p.name || p.email || "").trim();
      if (p.user_id && nome) atores.set(p.user_id, nome);
    }

    // DEGRADA, nao derruba, e a decisao esta escrita porque as duas saidas eram
    // defensaveis. Falha na tabela de RESULTADO nao apaga a INTENCAO: com
    // `null`, buildAuditHistory devolve outcome 'not_verifiable', que e
    // exatamente o que aconteceu, em vez de 'unconfirmed', que afirmaria que a
    // acao nao surtiu efeito. Derrubar a resposta inteira trocaria o historico
    // completo por uma tela de erro por causa de uma tabela auxiliar.
    const entries = buildAuditHistory({
      logs,
      atores,
      refunds: refundsRes.error
        ? null
        : (refundsRes.data as RefundRow[] | null) || [],
      cancelamentos: cancelamentosRes.error
        ? null
        : (cancelamentosRes.data as CancellationRow[] | null) || [],
    });

    res.json({
      data: {
        entries,
        truncated,
        limit: AUDIT_LIMIT,
        // A tela precisa saber a diferenca entre "nada a confirmar" e "nao deu
        // para checar", senao o rotulo neutro vira ambiguo.
        cross_reference_ok: !refundsRes.error && !cancelamentosRes.error,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Atividade real do usuario no PostHog (funcionalidades usadas + historico de
// navegacao). Repassa a maquina de estados do getPosthogUserActivity; nunca
// colapsa falha em lista vazia.
router.get("/users/:id/activity", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(400, "invalid_user_id", "Identificador de usuário inválido."),
      );
    }
    const result = await getPosthogUserActivity(uid);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// DEPRECATED: use GET /subscribers (paginado). Mantido enquanto o client ainda o consome no lookup por usuario; sera removido apos a migracao do client.
router.get("/subscriptions", async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*, plans(name, code, price_cents)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error)
      return next(dbError("subscriptions fetch", error, "Erro ao buscar assinaturas."));

    // Mantem a forma da resposta, mas o preco exibido vem do planPricing.ts (fonte
    // unica), nao de plans.price_cents. Fallback defensivo para o banco (helper
    // grita no Sentry se o code for real e faltar no modulo).
    const rows = (data || []).map((row) => {
      const plans = (
        row as {
          plans?: { code?: string | null; price_cents?: number | null } | null;
        }
      ).plans;
      if (!plans) return row;
      const cents = resolvePlanPriceCents(
        plans.code,
        plans.price_cents ?? 0,
        "/subscriptions",
      );
      return { ...row, plans: { ...plans, price_cents: cents } };
    });

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// Lista paginada de assinantes (subscriptions join plans + email do usuario).
// Substitui o /subscriptions legado (cap fixo de 100, sem paginacao).
router.get("/subscribers", async (req, res, next) => {
  try {
    const pageRaw = parseInt(String(req.query.page ?? "1"), 10);
    const pageSizeRaw = parseInt(String(req.query.pageSize ?? "25"), 10);
    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
    const pageSize = Math.min(
      Math.max(Number.isFinite(pageSizeRaw) ? pageSizeRaw : 25, 1),
      100,
    );
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const provider =
      typeof req.query.provider === "string" ? req.query.provider : undefined;
    const planCode =
      typeof req.query.planCode === "string" ? req.query.planCode : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const result = await getSubscriberList({
      page,
      pageSize,
      status,
      provider,
      planCode,
      search,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// Cache das agregacoes financeiras do painel. Camada de ROTA de proposito: os
// modulos billingMetrics/financeMetrics seguem "so calculo" (getMrrSnapshot tambem
// alimenta o cron de snapshots, que precisa do valor REAL, nao do cacheado). O
// contrato do getOrCompute ja garante fail-open no Redis e nunca cacheia erro/null.
// TTL de 45s (dentro da janela 30-60s). ?fresh=1 usa o refresh (write-through) do
// getOrCompute: recalcula e repopula a chave, entao TODOS os admins passam a ver o
// valor atualizado (ex.: logo apos um sync da Stripe), nao so quem forcou o refresh.
const FINANCE_CACHE_TTL_S = 45;

function wantsFresh(query: Record<string, unknown>): boolean {
  return query.fresh === "1";
}

// O preset do dashboard manda `to = now` com precisao de milissegundo, entao a
// chave crua nunca se repetiria (0% de hit). Alinhamos `to` a um balde de 60s:
// pedidos na mesma janela colidem na mesma chave. A imprecisao (dados "as of" a
// virada do balde) e irrelevante e coerente com um TTL de dezenas de segundos.
// `from` (mes cheio nos presets, dia cheio no custom) ja e estavel.
function financeRangeKey(scope: string, from: Date, to: Date): string {
  const toBucket = Math.floor(to.getTime() / 60_000);
  return `admincache:finance:${scope}:from=${from.toISOString()}&to=${toBucket}`;
}

// Metricas financeiras reais (MRR + churn), substituindo os mocks do admin.
// Erros propagam (o modulo nunca colapsa em 0); ausencia vem como estado nomeado.
router.get("/billing-metrics", async (req, res, next) => {
  try {
    const data = await getOrCompute(
      "admincache:billing-metrics",
      FINANCE_CACHE_TTL_S,
      async () => {
        const [mrr, churn] = await Promise.all([
          getMrrSnapshot(),
          getChurnSnapshot({}),
        ]);
        return { mrr, churn };
      },
      { refresh: wantsFresh(req.query as Record<string, unknown>) },
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Financeiro (regime de caixa; fonte de verdade: Stripe balance transactions)
// ---------------------------------------------------------------------------

const EXPENSE_CATEGORIES = new Set([
  "infra",
  "ia",
  "email",
  "marketing",
  "juridico",
  "contabil",
  "ferramentas",
  "dominio",
  "outros",
]);
const EXPENSE_KINDS = new Set(["recurring", "one_off"]);
const EXPENSE_INTERVALS = new Set(["monthly", "yearly"]);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateParam(value: unknown, fallback: Date): Date {
  if (typeof value === "string") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return fallback;
}

function parsePageParams(query: Record<string, unknown>): {
  page: number;
  pageSize: number;
} {
  const pageRaw = parseInt(String(query.page ?? "1"), 10);
  const sizeRaw = parseInt(String(query.pageSize ?? "25"), 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const pageSize = Math.min(
    Math.max(Number.isFinite(sizeRaw) ? sizeRaw : 25, 1),
    100,
  );
  return { page, pageSize };
}

// Converte para BRL travando o cambio no lancamento. BRL: 1:1. USD: PTAX. Moeda
// nao suportada ou PTAX indisponivel: ERRO (nunca grava cambio chutado nem 1:1).
async function resolveBrlAmount(
  amountCents: number,
  currency: string,
): Promise<{ amountBrlCents: number; fxRate: number | null; fxDate: string | null }> {
  const cur = currency.toUpperCase();
  if (cur === "BRL") {
    return { amountBrlCents: amountCents, fxRate: null, fxDate: null };
  }
  if (cur === "USD") {
    const rate = await fetchUsdBrlRate();
    if (!rate) {
      throw createError(
        502,
        "fx_unavailable",
        // TODO(Ana)
        "Cotação do dólar (PTAX) indisponível agora. Tente novamente em instantes.",
      );
    }
    return {
      amountBrlCents: Math.round(amountCents * rate.usdBrl),
      fxRate: rate.usdBrl,
      fxDate: rate.quoteDate,
    };
  }
  throw createError(
    400,
    "unsupported_currency",
    // TODO(Ana)
    "Moeda não suportada. Use BRL ou USD.",
  );
}

type ExpenseInput = {
  description: string;
  category: string;
  vendor: string | null;
  kind: string;
  amount_cents: number;
  currency: string;
  incurred_on: string;
  recurrence_start: string | null;
  recurrence_end: string | null;
  recurrence_interval: string | null;
  notes: string | null;
};

// Valida e normaliza o corpo de uma despesa; lanca createError em invalido.
function parseExpenseBody(body: Record<string, unknown>): ExpenseInput {
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  if (!description) {
    // TODO(Ana)
    throw createError(400, "invalid_description", "Descrição obrigatória.");
  }

  const category = typeof body.category === "string" ? body.category : "";
  if (!EXPENSE_CATEGORIES.has(category)) {
    // TODO(Ana)
    throw createError(400, "invalid_category", "Categoria inválida.");
  }

  const kind = typeof body.kind === "string" ? body.kind : "";
  if (!EXPENSE_KINDS.has(kind)) {
    // TODO(Ana)
    throw createError(400, "invalid_kind", "Tipo inválido (recurring ou one_off).");
  }

  const amountCents = Number(body.amount_cents);
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    // TODO(Ana)
    throw createError(
      400,
      "invalid_amount",
      "Valor inválido (centavos inteiros maiores que zero).",
    );
  }

  const currency =
    typeof body.currency === "string" && body.currency ? body.currency : "BRL";

  const incurredOn =
    typeof body.incurred_on === "string" ? body.incurred_on : "";
  if (!ISO_DATE_RE.test(incurredOn)) {
    // TODO(Ana)
    throw createError(
      400,
      "invalid_incurred_on",
      "Data de competência inválida (AAAA-MM-DD).",
    );
  }

  const vendor =
    typeof body.vendor === "string" && body.vendor.trim()
      ? body.vendor.trim()
      : null;
  const notes =
    typeof body.notes === "string" && body.notes.trim()
      ? body.notes.trim()
      : null;

  let recurrenceStart: string | null = null;
  let recurrenceEnd: string | null = null;
  let recurrenceInterval: string | null = null;
  if (kind === "recurring") {
    recurrenceInterval =
      typeof body.recurrence_interval === "string"
        ? body.recurrence_interval
        : "";
    if (!EXPENSE_INTERVALS.has(recurrenceInterval)) {
      // TODO(Ana)
      throw createError(
        400,
        "invalid_interval",
        "Recorrência inválida (monthly ou yearly).",
      );
    }
    recurrenceStart =
      typeof body.recurrence_start === "string" &&
      ISO_DATE_RE.test(body.recurrence_start)
        ? body.recurrence_start
        : incurredOn;
    recurrenceEnd =
      typeof body.recurrence_end === "string" &&
      ISO_DATE_RE.test(body.recurrence_end)
        ? body.recurrence_end
        : null;
  }

  return {
    description,
    category,
    vendor,
    kind,
    amount_cents: amountCents,
    currency,
    incurred_on: incurredOn,
    recurrence_start: recurrenceStart,
    recurrence_end: recurrenceEnd,
    recurrence_interval: recurrenceInterval,
    notes,
  };
}

function expenseRowFromInput(
  input: ExpenseInput,
  fx: { amountBrlCents: number; fxRate: number | null; fxDate: string | null },
) {
  return {
    description: input.description,
    category: input.category,
    vendor: input.vendor,
    kind: input.kind,
    amount_cents: input.amount_cents,
    currency: input.currency.toUpperCase(),
    amount_brl_cents: fx.amountBrlCents,
    fx_rate: fx.fxRate,
    fx_date: fx.fxDate,
    incurred_on: input.incurred_on,
    recurrence_start: input.recurrence_start,
    recurrence_end: input.recurrence_end,
    recurrence_interval: input.recurrence_interval,
    notes: input.notes,
  };
}

router.get("/finance/summary", async (req, res, next) => {
  try {
    const now = new Date();
    const defFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const from = parseDateParam(req.query.from, defFrom);
    const to = parseDateParam(req.query.to, now);
    const data = await getOrCompute(
      financeRangeKey("summary", from, to),
      FINANCE_CACHE_TTL_S,
      async () => {
        const [summary, deferred] = await Promise.all([
          getFinanceSummary({ from, to }),
          getDeferredRevenue(),
        ]);
        return { ...summary, deferred };
      },
      { refresh: wantsFresh(req.query as Record<string, unknown>) },
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/finance/timeseries", async (req, res, next) => {
  try {
    const now = new Date();
    const defFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const from = parseDateParam(req.query.from, defFrom);
    const to = parseDateParam(req.query.to, now);
    const series = await getOrCompute(
      financeRangeKey("timeseries", from, to),
      FINANCE_CACHE_TTL_S,
      () => getFinanceTimeseries({ from, to, granularity: "month" }),
      { refresh: wantsFresh(req.query as Record<string, unknown>) },
    );
    res.json({ data: series });
  } catch (err) {
    next(err);
  }
});

router.get("/finance/transactions", async (req, res, next) => {
  try {
    const { page, pageSize } = parsePageParams(
      req.query as Record<string, unknown>,
    );
    const rangeFrom = (page - 1) * pageSize;
    const rangeTo = rangeFrom + pageSize - 1;

    let query = supabaseAdmin
      .from("finance_transactions")
      .select(
        "id, stripe_charge_id, stripe_invoice_id, type, gross_cents, fee_cents, net_cents, currency, occurred_at, user_id, plan_code",
        { count: "exact" },
      )
      .order("occurred_at", { ascending: false })
      .range(rangeFrom, rangeTo);

    const typeFilter =
      typeof req.query.type === "string" ? req.query.type : "";
    if (typeFilter) query = query.eq("type", typeFilter);

    const { data, count, error } = await query;
    if (error)
      return next(dbError("finance transactions", error, "Erro ao buscar transações."));

    res.json({
      data: { rows: data ?? [], total: count ?? 0, page, pageSize },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/finance/expenses", async (req, res, next) => {
  try {
    const { page, pageSize } = parsePageParams(
      req.query as Record<string, unknown>,
    );
    const rangeFrom = (page - 1) * pageSize;
    const rangeTo = rangeFrom + pageSize - 1;

    let query = supabaseAdmin
      .from("expenses")
      .select("*", { count: "exact" })
      .order("incurred_on", { ascending: false })
      .range(rangeFrom, rangeTo);

    const category =
      typeof req.query.category === "string" ? req.query.category : "";
    const kind = typeof req.query.kind === "string" ? req.query.kind : "";
    if (category) query = query.eq("category", category);
    if (kind) query = query.eq("kind", kind);

    const { data, count, error } = await query;
    if (error)
      return next(dbError("expenses list", error, "Erro ao buscar despesas."));

    res.json({
      data: { rows: data ?? [], total: count ?? 0, page, pageSize },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/finance/expenses", async (req, res, next) => {
  try {
    const input = parseExpenseBody((req.body ?? {}) as Record<string, unknown>);
    const fx = await resolveBrlAmount(input.amount_cents, input.currency);
    const { data, error } = await supabaseAdmin
      .from("expenses")
      .insert({ ...expenseRowFromInput(input, fx), created_by: req.user!.id })
      .select()
      .single();
    if (error)
      return next(dbError("expense create", error, "Erro ao criar despesa."));
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

router.patch("/finance/expenses/:id", async (req, res, next) => {
  try {
    const input = parseExpenseBody((req.body ?? {}) as Record<string, unknown>);
    const fx = await resolveBrlAmount(input.amount_cents, input.currency);
    const { data, error } = await supabaseAdmin
      .from("expenses")
      .update(expenseRowFromInput(input, fx))
      .eq("id", req.params.id)
      .select()
      .maybeSingle();
    if (error)
      return next(dbError("expense update", error, "Erro ao atualizar despesa."));
    if (!data)
      return next(createError(404, "not_found", "Despesa não encontrada."));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.delete("/finance/expenses/:id", async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from("expenses")
      .delete()
      .eq("id", req.params.id);
    if (error)
      return next(dbError("expense delete", error, "Erro ao remover despesa."));
    res.json({ data: { deleted: true, id: req.params.id } });
  } catch (err) {
    next(err);
  }
});

// Sincroniza balance transactions da Stripe sob demanda (botao "sincronizar agora").
router.post("/finance/sync", async (_req, res, next) => {
  try {
    const result = await syncBalanceTransactions({});
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// Cotacao PTAX que SERA usada ao salvar uma despesa em moeda estrangeira (preview
// antes de gravar). BRL: 1:1. USD: PTAX. Outra moeda ou PTAX indisponivel: erro.
router.get("/finance/fx-preview", async (req, res, next) => {
  try {
    const currency =
      typeof req.query.currency === "string"
        ? req.query.currency.toUpperCase()
        : "BRL";
    if (currency === "BRL") {
      res.json({ data: { rate: 1, quoteDate: null } });
      return;
    }
    if (currency !== "USD") {
      // TODO(Ana)
      return next(
        createError(400, "unsupported_currency", "Moeda não suportada. Use BRL ou USD."),
      );
    }
    const rate = await fetchUsdBrlRate();
    if (!rate) {
      // TODO(Ana)
      return next(
        createError(
          502,
          "fx_unavailable",
          "Cotação do dólar (PTAX) indisponível agora. Tente novamente em instantes.",
        ),
      );
    }
    res.json({ data: { rate: rate.usdBrl, quoteDate: rate.quoteDate } });
  } catch (err) {
    next(err);
  }
});

/**
 * Todos os desbloqueios de beta bem-sucedidos, paginados.
 *
 * Devolve no shape tagueado do supabase-js (`{ data, error }`) porque o chamador
 * trata a falha como "agregado zera, os codigos aparecem" e nao pode virar um
 * throw que derrube a lista inteira.
 */
async function coletarLogsDeBeta(): Promise<{
  data: Array<{ code_id: string | null; created_at: string }> | null;
  error: { message: string } | null;
}> {
  try {
    const linhas: Array<{ code_id: string | null; created_at: string }> = [];
    for await (const log of paginateRange<{
      code_id: string | null;
      created_at: string;
    }>(
      (from, to) =>
        supabaseAdmin
          .from("beta_unlock_logs")
          .select("code_id, created_at")
          .eq("success", true)
          .order("id", { ascending: true })
          .range(from, to),
      { errorLabel: "beta unlock logs" },
    )) {
      linhas.push(log);
    }
    return { data: linhas, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : String(err) },
    };
  }
}

// Custo e volume de IA por ferramenta, 30 dias.
//
// PAGINADO, e o motivo e um defeito medido: ate 2026-07-31 esta rota fazia um
// `.select()` solto sobre ai_usage_logs e somava o que viesse. O PostgREST corta
// em `db-max-rows` (1000 na configuracao atual), entao a soma parava na
// milesima linha SEM AVISO: com 1167 linhas reais na janela, o painel exibia
// R$ 1,45 onde o custo era R$ 1,58. Nao havia sinal de que faltava algo, e o
// erro CRESCE com o volume. E a classe que o CLAUDE.md documenta: o instrumento
// reporta sucesso sobre uma superficie menor.
//
// POR QUE PAGINAR E NAO AGREGAR NO BANCO. Agregar em SQL transferiria uma linha
// por tool em vez de uma por chamada, e seria mais barato. Mas exigiria funcao
// nova, portanto MIGRATION, com a ordem de deploy que ela implica; e o guard de
// migrations nao enxerga corpo de funcao, entao ela ainda precisaria de
// assercao comportamental propria. Paginar reusa `paginateRange`, que ja existe
// e ja resolve o caso do max-rows menor que a pagina, e nao cria objeto novo no
// banco. Se o volume crescer a ponto de a transferencia doer, a agregacao em
// SQL e a evolucao natural, e ai o custo da migration se paga.
//
// A ORDENACAO NAO E ENFEITE: paginacao por OFFSET sem ORDER BY tem ordem
// indefinida no Postgres, e duas paginas podem repetir ou pular linhas. Ordenar
// por `id` da uma ordem total e estavel.
router.get("/ai-stats", async (_req, res, next) => {
  try {
    const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    res.json({ data: await agregarUsoDeIa(desde) });
  } catch (err) {
    next(err);
  }
});

router.get("/ai-usage-summary", async (req, res, next) => {
  try {
    const sinceRaw = typeof req.query.since === "string" ? req.query.since : null;
    const untilRaw = typeof req.query.until === "string" ? req.query.until : null;
    const since =
      sinceRaw && !Number.isNaN(Date.parse(sinceRaw)) ? sinceRaw : null;
    const until =
      untilRaw && !Number.isNaN(Date.parse(untilRaw)) ? untilRaw : null;
    const { data, error } = await supabaseAdmin.rpc(
      "get_ai_usage_admin_summary",
      {
        p_since: since,
        p_until: until,
      },
    );
    if (error) {
      return next(
        createError(
          500,
          "ai_usage_summary_failed",
          "Falha ao agregar uso de IA.",
        ),
      );
    }
    res.json({ data: data ?? [] });
  } catch (err) {
    next(err);
  }
});


router.get("/affiliates-stats", async (_req, res, next) => {
  try {
    // PAGINADA: 41 linhas hoje, e cresce com cada parceria nova.
    const { data, error } = await coletarTagueado<Record<string, unknown>>(
      (from, to) =>
        supabaseAdmin
          .from("affiliates")
          .select("*")
          .order("revenue_cents", { ascending: false })
          .order("id", { ascending: true })
          .range(from, to),
      "affiliates",
    );

    // Propaga o erro em vez de mascarar com lista vazia.
    if (error)
      return next(
        // TODO(Ana)
        dbError("affiliates", error, "Erro ao buscar afiliados."),
      );

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/avatar-reports", async (_req, res, next) => {
  try {
    const { data: targets, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name, avatar_url, avatar_moderation_updated_at")
      .eq("avatar_moderation_status", "pending_review")
      .order("avatar_moderation_updated_at", {
        ascending: true,
        nullsFirst: true,
      });

    if (error)
      return next(
        dbError("moderation queue", error, "Erro ao buscar fila de moderação."),
      );

    const rows = targets || [];
    if (rows.length === 0) {
      res.json({ data: [] });
      return;
    }

    const targetIds = rows.map((row) => row.user_id);
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from("avatar_reports")
      .select("target_user_id, reporter_user_id, reason")
      .in("target_user_id", targetIds)
      .eq("status", "open");

    if (reportsError)
      return next(dbError("reports fetch", reportsError, "Erro ao buscar denúncias."));

    const agg = new Map<
      string,
      { reporters: Set<string>; reasons: Record<string, number> }
    >();
    for (const report of reports || []) {
      let entry = agg.get(report.target_user_id);
      if (!entry) {
        entry = { reporters: new Set<string>(), reasons: {} };
        agg.set(report.target_user_id, entry);
      }
      entry.reporters.add(report.reporter_user_id);
      entry.reasons[report.reason] = (entry.reasons[report.reason] || 0) + 1;
    }

    const data = rows.map((row) => {
      const entry = agg.get(row.user_id);
      return {
        userId: row.user_id,
        name: row.name || "",
        avatarUrl: row.avatar_url,
        distinctReporters: entry ? entry.reporters.size : 0,
        reasons: entry ? entry.reasons : {},
        pendingSince: row.avatar_moderation_updated_at,
      };
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post("/avatar-reports/:userId/restore", async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const nowIso = new Date().toISOString();

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        avatar_moderation_status: "clean",
        avatar_moderation_updated_at: nowIso,
        avatar_moderation_reviewed_by: req.user!.id,
      })
      .eq("user_id", targetUserId);

    if (profileError)
      return next(dbError("avatar restore", profileError, "Erro ao restaurar avatar."));

    const { error: reportsError } = await supabaseAdmin
      .from("avatar_reports")
      .update({ status: "closed" })
      .eq("target_user_id", targetUserId)
      .eq("status", "open");

    if (reportsError)
      return next(dbError("close reports", reportsError, "Erro ao fechar denúncias."));

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/avatar-reports/:userId/confirm", async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const nowIso = new Date().toISOString();

    const { data: target } = await supabaseAdmin
      .from("profiles")
      .select("avatar_storage_path")
      .eq("user_id", targetUserId)
      .maybeSingle();

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        avatar_moderation_status: "removed",
        avatar_upload_disabled: true,
        avatar_url: null,
        avatar_storage_path: null,
        avatar_mode: "icon",
        avatar_moderation_updated_at: nowIso,
        avatar_moderation_reviewed_by: req.user!.id,
      })
      .eq("user_id", targetUserId);

    if (profileError)
      return next(dbError("avatar remove", profileError, "Erro ao remover avatar."));

    // Nao deixa a imagem de violacao confirmada no bucket (best-effort).
    await deleteAvatarObject(target?.avatar_storage_path ?? null);

    const { error: reportsError } = await supabaseAdmin
      .from("avatar_reports")
      .update({ status: "closed" })
      .eq("target_user_id", targetUserId)
      .eq("status", "open");

    if (reportsError)
      return next(dbError("close reports", reportsError, "Erro ao fechar denúncias."));

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Visao somente leitura dos assinantes da newsletter, por status. Sem mutacao:
// nao entra no CRUD generico de /content/:type. Filtro de status opcional,
// paginacao por limit/offset. Tudo via supabaseAdmin (bypassa RLS).
router.get("/newsletter/subscribers", async (req, res, next) => {
  try {
    const NEWSLETTER_STATUSES = [
      "pending_confirmation",
      "confirmed",
      "unsubscribed",
    ] as const;
    type NewsletterStatus = (typeof NEWSLETTER_STATUSES)[number];

    const statusParam =
      typeof req.query.status === "string" ? req.query.status : undefined;
    if (
      statusParam !== undefined &&
      !NEWSLETTER_STATUSES.includes(statusParam as NewsletterStatus)
    ) {
      return next(createError(400, "invalid_status", "Status inválido."));
    }
    const statusFilter = statusParam as NewsletterStatus | undefined;

    const parsedLimit = parseInt(String(req.query.limit ?? "50"), 10);
    const limit = Math.min(
      Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 50, 1),
      200,
    );
    const parsedOffset = parseInt(String(req.query.offset ?? "0"), 10);
    const offset = Math.max(
      Number.isFinite(parsedOffset) ? parsedOffset : 0,
      0,
    );

    // Counts por status (head + count exato), um por status. Usa o indice
    // newsletter_subscribers_status_idx.
    const countResults = await Promise.all(
      NEWSLETTER_STATUSES.map((s) =>
        supabaseAdmin
          .from("newsletter_subscribers")
          .select("*", { count: "exact", head: true })
          .eq("status", s),
      ),
    );
    for (const result of countResults) {
      if (result.error)
        return next(dbError("subscribers count", result.error, "Erro ao contar assinantes."));
    }
    const counts = {
      pending_confirmation: countResults[0].count ?? 0,
      confirmed: countResults[1].count ?? 0,
      unsubscribed: countResults[2].count ?? 0,
      total: 0,
    };
    counts.total =
      counts.pending_confirmation + counts.confirmed + counts.unsubscribed;

    // Lista paginada. O count exato DESSA query (mesmo filtro) e o total da
    // paginacao.
    let listQuery = supabaseAdmin
      .from("newsletter_subscribers")
      .select("email, status, created_at, confirmed_at, unsubscribed_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusFilter) listQuery = listQuery.eq("status", statusFilter);

    const { data, count, error } = await listQuery;
    if (error)
      return next(dbError("subscribers list", error, "Erro ao buscar assinantes."));

    res.json({
      data: {
        counts,
        subscribers: data || [],
        pagination: { limit, offset, total: count ?? 0 },
      },
    });
  } catch (err) {
    next(err);
  }
});

// Codigos de beta: lista com agregado de usos com sucesso e ultimo acesso. Os
// logs sao agregados no servidor (duas queries) porque o supabase-js nao faz
// group-by sem RPC; volume e pequeno (beta fechado).
router.get("/beta-codes", async (_req, res, next) => {
  try {
    const [codesRes, logsRes] = await Promise.all([
      supabaseAdmin
        .from("beta_access_codes")
        .select("id, code, label, active, created_at, revoked_at")
        .order("created_at", { ascending: false }),
      // PAGINADO pelo mesmo motivo do /ai-stats: este agregado conta TODOS os
      // desbloqueios bem-sucedidos, e a tabela ja tem 615 linhas (medido em
      // 2026-07-31). Sem paginar, o `success_count` de cada codigo passa a
      // mentir para MENOS assim que a tabela cruzar o max-rows, e contador que
      // mente para menos nao tem como ser percebido.
      coletarLogsDeBeta(),
    ]);

    if (codesRes.error)
      return next(dbError("beta codes", codesRes.error, "Erro ao buscar códigos."));

    // Falha nos logs nao derruba a lista: agregado zera, os codigos aparecem.
    const usage = new Map<string, { count: number; last: string | null }>();
    for (const log of logsRes.data || []) {
      if (!log.code_id) continue;
      const cur = usage.get(log.code_id) || { count: 0, last: null };
      cur.count += 1;
      if (!cur.last || log.created_at > cur.last) cur.last = log.created_at;
      usage.set(log.code_id, cur);
    }

    const data = (codesRes.data || []).map((c) => {
      const u = usage.get(c.id);
      return {
        ...c,
        success_count: u?.count ?? 0,
        last_access: u?.last ?? null,
      };
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// Ultimos logs de tentativa de unlock. Teto de 500 por request.
router.get("/beta-logs", async (req, res, next) => {
  try {
    const { limit = "100" } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(String(limit), 10) || 100, 1), 500);

    const { data, error } = await supabaseAdmin
      .from("beta_unlock_logs")
      .select(
        "id, code_id, label, success, attempted_code, ip, user_agent, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(parsedLimit);

    if (error) return next(dbError("audit logs", error, "Erro ao buscar logs."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

// Revoga um codigo: active false e revoked_at now(). Tentativas futuras com ele
// voltam a 401. Nao apaga o historico de uso.
router.post("/beta-codes/:id/revoke", async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from("beta_access_codes")
      .update({ active: false, revoked_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, code, label, active, created_at, revoked_at")
      .maybeSingle();

    if (error)
      return next(dbError("beta code revoke", error, "Erro ao revogar código."));
    if (!data)
      return next(createError(404, "not_found", "Código não encontrado."));

    await logAudit({
      actorUserId: req.user!.id,
      action: "update",
      resourceType: "beta_code",
      resourceId: data.id,
      after: data,
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
