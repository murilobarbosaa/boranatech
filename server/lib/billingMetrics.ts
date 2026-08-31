import { resolvePlanPriceCents } from "./planPrice";
import { coletarTudo } from "./paginate";
import { supabaseAdmin } from "./supabaseAdmin";

// Metricas financeiras reais para o admin. SO calculo, sem UI. Todas as funcoes
// leem via supabaseAdmin (admin legitimo, sem filtro por user_id).
//
// REGRA DE OURO deste modulo: nenhuma funcao retorna 0, [] ou default ao
// encontrar erro. Erro propaga como erro. Ausencia de dado e um estado NOMEADO
// (ex.: arpuCents null, churn status 'insufficient_data'), nunca um numero.

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.floor(value), min), max);
}

// Meses por ciclo, derivado da coluna plans.interval (fonte: seed em
// 20260528120000; valores reais 'month' / 'semiannual' / 'year'). Aliases
// defensivos incluidos. Interval fora deste mapa e ERRO (nao da para normalizar
// MRR sem saber o ciclo), nunca um default silencioso.
const INTERVAL_MONTHS: Record<string, number> = {
  month: 1,
  monthly: 1,
  semiannual: 6,
  semiannually: 6,
  year: 12,
  annual: 12,
  yearly: 12,
};

/**
 * EXPORTADA de proposito, e o motivo importa: o painel de atencao precisa da
 * MESMA normalizacao para exibir a saida agendada em MRR mensal, e o comentario
 * de `getMrrSnapshot` ja avisava que "a terceira implementacao e sempre a que
 * diverge primeiro". Compartilhar a funcao e o que impede a terceira de nascer.
 */
export function monthlyEquivalentCents(
  priceCents: number,
  interval: string,
): number {
  const months = INTERVAL_MONTHS[interval];
  if (!months) {
    throw new Error(
      `Plano com interval desconhecido ("${interval}"); nao da para normalizar MRR.`,
    );
  }
  return Math.round(priceCents / months);
}

type EmbeddedPlan = {
  code: string | null;
  name: string | null;
  price_cents?: number | null;
  interval?: string | null;
};

function unwrapPlan(
  plans: EmbeddedPlan | EmbeddedPlan[] | null | undefined,
): EmbeddedPlan {
  if (Array.isArray(plans)) return plans[0] ?? { code: null, name: null };
  return plans ?? { code: null, name: null };
}

// ---------------------------------------------------------------------------
// Lista paginada de assinantes
// ---------------------------------------------------------------------------

export type SubscriberListParams = {
  page: number;
  pageSize: number;
  status?: string;
  provider?: string;
  planCode?: string;
  search?: string;
};

export type SubscriberRow = {
  userId: string | null;
  email: string | null;
  planCode: string | null;
  planName: string | null;
  provider: string | null;
  status: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean | null;
  affiliateCode: string | null;
  createdAt: string | null;
};

export type SubscriberListResult = {
  rows: SubscriberRow[];
  total: number;
  page: number;
  pageSize: number;
};

type RawSubscriberRow = {
  user_id: string | null;
  provider: string | null;
  status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  affiliate_code: string | null;
  created_at: string | null;
  plans: EmbeddedPlan | EmbeddedPlan[] | null;
};

// Paginacao real (count exato + range), sem o cap fixo de 100 do endpoint legado.
// Email resolvido em UM batch: uma unica query em profiles (que tem a coluna
// email) para os user_ids da PAGINA, e merge em memoria. Evita o anti-padrao
// atual do /churn-risk (loop Promise.all de auth.admin.getUserById por linha),
// que faz uma ida a Auth por assinante.
export async function getSubscriberList(
  params: SubscriberListParams,
): Promise<SubscriberListResult> {
  const page = Math.max(1, Math.floor(params.page) || 1);
  const pageSize = clampInt(params.pageSize, 1, 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from("subscriptions")
    .select(
      "user_id, provider, status, current_period_start, current_period_end, cancel_at_period_end, affiliate_code, created_at, plans!inner(code, name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.status) query = query.eq("status", params.status);
  if (params.provider) query = query.eq("provider", params.provider);
  if (params.planCode) query = query.eq("plans.code", params.planCode);

  // Busca por email vive em profiles, nao em subscriptions (sem FK direta). Um
  // batch em profiles resolve os user_ids que casam; restringe a query por eles.
  // Zero correspondencia e um vazio LEGITIMO (busca sem resultado), nao um erro.
  if (params.search && params.search.trim()) {
    const term = params.search.trim();
    const { data: matched, error: matchError } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .ilike("email", `%${term}%`)
      .limit(1000);
    if (matchError) throw matchError;
    const matchedIds = ((matched ?? []) as Array<{ user_id: string | null }>)
      .map((m) => m.user_id)
      .filter((v): v is string => Boolean(v));
    if (matchedIds.length === 0) {
      return { rows: [], total: 0, page, pageSize };
    }
    query = query.in("user_id", matchedIds);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const subs = (data ?? []) as RawSubscriberRow[];
  const userIds = subs
    .map((s) => s.user_id)
    .filter((v): v is string => Boolean(v));

  const emailByUser = new Map<string, string | null>();
  if (userIds.length) {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email")
      .in("user_id", userIds);
    if (profilesError) throw profilesError;
    for (const profile of (profiles ?? []) as Array<{
      user_id: string;
      email: string | null;
    }>) {
      emailByUser.set(profile.user_id, profile.email ?? null);
    }
  }

  const rows: SubscriberRow[] = subs.map((s) => {
    const plan = unwrapPlan(s.plans);
    return {
      userId: s.user_id,
      email: s.user_id ? (emailByUser.get(s.user_id) ?? null) : null,
      planCode: plan.code,
      planName: plan.name,
      provider: s.provider,
      status: s.status,
      currentPeriodStart: s.current_period_start,
      currentPeriodEnd: s.current_period_end,
      cancelAtPeriodEnd: s.cancel_at_period_end,
      affiliateCode: s.affiliate_code,
      createdAt: s.created_at,
    };
  });

  return { rows, total: count ?? rows.length, page, pageSize };
}

// ---------------------------------------------------------------------------
// MRR
// ---------------------------------------------------------------------------

export type PlanMrr = {
  code: string;
  name: string | null;
  count: number;
  mrrCents: number;
};

export type MrrSnapshot = {
  mrrCents: number;
  // null quando activeCount === 0: ausencia, nao zero.
  arpuCents: number | null;
  activeCount: number;
  trialingCount: number;
  byPlan: PlanMrr[];
  /**
   * RECEITA EM RISCO: as DUAS formas de perder receita que ja estao visiveis no
   * banco, somadas, e cada uma tambem separada.
   *
   *   saindo    `cancel_at_period_end = true` sobre assinatura ativa. Recorte de
   *             `mrrCents`: a receita ainda entra, mas tem data de fim.
   *   emAtraso  `status = 'past_due'`. NAO e recorte de `mrrCents`, porque o MRR
   *             conta so `active`. E receita que ja parou de entrar e que a
   *             Stripe ainda esta tentando cobrar.
   *
   * As duas saem do MESMO laco, sobre as MESMAS linhas, com a MESMA
   * `monthlyEquivalentCents`. Somar as duas no card e a decisao D21: quem olha
   * "receita em risco" quer o total exposto, e ver so metade dele numa tela e a
   * outra metade noutra foi exatamente a inconsistencia que a revisao apontou.
   * Medido em 2026-07-31 (so `saindo`): 10 assinaturas, R$ 267,80, 15,4% do MRR.
   */
  atRisk: {
    /** Soma de `saindo` e `emAtraso`. E este o headline do card. */
    count: number;
    mrrCents: number;
    saindo: { count: number; mrrCents: number };
    emAtraso: { count: number; mrrCents: number };
  };
};

type RawMrrRow = {
  status: string | null;
  cancel_at_period_end: boolean | null;
  plans: EmbeddedPlan | EmbeddedPlan[] | null;
};

// MRR normalizado em centavos: SOMENTE assinaturas status='active' nao expiradas
// (mesma condicao de periodo do is_user_pro: period null ou > now), com o preco
// do plano convertido para equivalente mensal via plans.interval.
//
// DECISAO: trialing NAO paga, entao fica FORA do MRR, do ARPU e da distribuicao
// por plano; entra so como contador separado (trialingCount). ARPU = mrrCents /
// activeCount, null quando activeCount === 0 (nunca 0).
export async function getMrrSnapshot(): Promise<MrrSnapshot> {
  const nowIso = new Date().toISOString();

  // PAGINADO. `.in("status", [...])` filtra por valor, nao limita a quantidade:
  // este select varre TODAS as assinaturas ativas. Ele produz o MRR, o numero de
  // receita do painel, e sem paginacao ele erra para MENOS exatamente quando a
  // base cruzar o teto do PostgREST, ou seja, quando o numero passar a importar.
  // Errar para menos num numero de receita e invisivel: ninguem estranha um MRR
  // menor, so um maior.
  const rows = (await coletarTudo<RawMrrRow>(
    (from, to) =>
      supabaseAdmin
        .from("subscriptions")
        .select(
          "status, cancel_at_period_end, plans!inner(code, name, price_cents, interval)",
        )
        // `past_due` entra na LEITURA e fica fora do MRR (o `continue` abaixo).
        // Ele nao e receita ativa, e receita em risco, e sem le-lo aqui o card
        // teria de somar dois numeros vindos de duas consultas diferentes, que e
        // como as duas telas passaram a divergir.
        .in("status", ["active", "trialing", "past_due"])
        .or(`current_period_end.is.null,current_period_end.gt.${nowIso}`)
        .order("id", { ascending: true })
        .range(from, to),
    "mrr snapshot",
  )) as RawMrrRow[];

  let mrrCents = 0;
  let activeCount = 0;
  let trialingCount = 0;
  let saindoCents = 0;
  let saindoCount = 0;
  let atrasoCents = 0;
  let atrasoCount = 0;
  const byPlan = new Map<string, PlanMrr>();

  for (const row of rows) {
    const plan = unwrapPlan(row.plans);
    if (!plan.code) {
      throw new Error(
        "Assinatura ativa sem code de plano; dados de plano inconsistentes.",
      );
    }

    // Trial nao paga: fora do MRR, do ARPU e da distribuicao por plano.
    if (row.status === "trialing") {
      trialingCount += 1;
      continue;
    }

    // Preco do planPricing.ts (fonte unica); plans.price_cents so como fallback
    // defensivo para code desconhecido (nao ocorre com os planos Pro reais), e nesse
    // caso o helper grita no Sentry.
    const priceCents = resolvePlanPriceCents(
      plan.code,
      Number(plan.price_cents ?? 0),
      "getMrrSnapshot",
    );
    const interval = String(plan.interval ?? "");
    const perMonth = monthlyEquivalentCents(priceCents, interval);

    // EM ATRASO NAO E MRR. A cobranca falhou: o dinheiro parou de entrar, e
    // soma-lo ao MRR afirmaria uma receita recorrente que hoje nao existe. Ele
    // sai do laco aqui, antes de `mrrCents`, `activeCount`, do ARPU e do
    // `byPlan`, levando so o proprio equivalente mensal para o risco.
    if (row.status === "past_due") {
      atrasoCents += perMonth;
      atrasoCount += 1;
      continue;
    }

    mrrCents += perMonth;
    activeCount += 1;

    // RECEITA EM RISCO, computada NA MESMA PASSADA, sobre as MESMAS linhas, com
    // o MESMO `monthlyEquivalentCents`. E deliberado: calcular isto num segundo
    // lugar significaria uma TERCEIRA implementacao da normalizacao mensal
    // (22200/12, 12900/6) nesta base, e a terceira e sempre a que diverge
    // primeiro, porque ninguem olha para ela. Aqui nao ha aritmetica nova: so um
    // acumulador a mais no laco que ja existe.
    if (row.cancel_at_period_end) {
      saindoCents += perMonth;
      saindoCount += 1;
    }

    const entry = byPlan.get(plan.code) ?? {
      code: plan.code,
      name: plan.name,
      count: 0,
      mrrCents: 0,
    };
    entry.count += 1;
    entry.mrrCents += perMonth;
    byPlan.set(plan.code, entry);
  }

  const arpuCents = activeCount > 0 ? Math.round(mrrCents / activeCount) : null;

  return {
    mrrCents,
    arpuCents,
    activeCount,
    trialingCount,
    byPlan: Array.from(byPlan.values()),
    atRisk: {
      count: saindoCount + atrasoCount,
      mrrCents: saindoCents + atrasoCents,
      saindo: { count: saindoCount, mrrCents: saindoCents },
      emAtraso: { count: atrasoCount, mrrCents: atrasoCents },
    },
  };
}

// ---------------------------------------------------------------------------
// Churn
// ---------------------------------------------------------------------------

/**
 * Contagens que acompanham o churn e NAO entram nele.
 *
 * Existem porque a alternativa e a pessoa que le "0% de churn" concluir que
 * ninguem quer sair, quando ha nove saidas com data marcada. Elas ficam ao lado
 * do numero, nunca somadas nele.
 */
export type ChurnContext = {
  /**
   * Cancelamentos AGENDADOS e ainda nao efetivados. Deliberadamente FORA do
   * churn: eles ja sao a metrica de "receita em risco", e conta-los aqui faria o
   * mesmo fato aparecer duas vezes no painel.
   */
  scheduledNotCounted: number;
  /**
   * Cancelamentos REVERTIDOS na janela: gente que pediu para sair e desistiu. E
   * o unico sinal positivo de retencao que o banco guarda hoje, e ele nao tinha
   * lugar nenhum na interface.
   */
  revertedInWindow: number;
  /**
   * Linhas de cancelamento cuja assinatura nao existe mais em `subscriptions`
   * (residuo do gateway anterior e de dados de teste). NAO entram no numerador:
   * o denominador vem de `subscriptions`, e misturar as duas populacoes daria
   * uma razao sem significado. Reportadas para a ausencia nao virar silencio.
   */
  orphanCancellations: number;
};

export type ChurnSnapshot =
  | ({
      status: "insufficient_data";
      reason: string;
      windowDays: number;
      canceledInWindow?: number;
      activeAtStart?: number;
    } & Partial<ChurnContext>)
  | ({
      status: "ok";
      windowDays: number;
      churnRate: number;
      canceledInWindow: number;
      activeAtStart: number;
      // null quando churnRate = 0 (LTV nao definido): ausencia, nao zero.
      ltvCents: number | null;
    } & ChurnContext);

type LinhaDeCancelamento = {
  provider_subscription_id: string | null;
  status: string | null;
  canceled_at: string | null;
  effective_at: string | null;
};

/**
 * Quando o cancelamento SURTIU EFEITO.
 *
 * `effective_at` e a data em que o acesso acaba; `canceled_at` e a data em que a
 * pessoa pediu. Para medir saida, vale a primeira. O fallback existe porque
 * `effective_at` e nullable no schema, e uma linha sem ele ainda e um evento.
 */
function instanteDoEfeito(linha: LinhaDeCancelamento): string | null {
  return linha.effective_at ?? linha.canceled_at;
}

function dentroDaJanela(
  iso: string | null,
  inicio: string,
  fim: string,
): boolean {
  return Boolean(iso && iso >= inicio && iso <= fim);
}

/**
 * Ids de provedor de TODAS as assinaturas que ainda existem.
 *
 * EXPORTADO porque duas coisas precisam da mesma resposta: o churn, para saber
 * qual cancelamento e orfao, e o agregado de motivos da aba Retencao, para dizer
 * quantos vieram de assinatura que sumiu. Duas montagens de "o que ainda existe"
 * divergiriam na primeira mudanca de criterio.
 *
 * PAGINADO: uma lista truncada transformaria assinatura viva em orfa.
 */
export async function carregarIdsDeAssinaturas(): Promise<Set<string>> {
  const subs = await coletarTudo<{ provider_subscription_id: string | null }>(
    (from, to) =>
      supabaseAdmin
        .from("subscriptions")
        .select("provider_subscription_id")
        .order("id", { ascending: true })
        .range(from, to),
    "subscription ids",
  );
  return new Set(
    subs
      .map((r) => r.provider_subscription_id)
      .filter((v): v is string => Boolean(v)),
  );
}

/** Todas as linhas de cancelamento, com o id das assinaturas que ainda existem. */
async function lerCancelamentos(): Promise<{
  linhas: LinhaDeCancelamento[];
  idsExistentes: Set<string>;
}> {
  // As duas PAGINADAS: `idsExistentes` decide quais cancelamentos sao orfaos, e
  // uma lista truncada de assinaturas transformaria assinatura viva em orfa,
  // tirando saidas reais do numerador do churn.
  const [linhas, idsExistentes] = await Promise.all([
    coletarTudo<LinhaDeCancelamento>(
      (from, to) =>
        supabaseAdmin
          .from("subscription_cancellations")
          .select("provider_subscription_id, status, canceled_at, effective_at")
          .order("id", { ascending: true })
          .range(from, to),
      "churn cancellations",
    ),
    carregarIdsDeAssinaturas(),
  ]);

  return { linhas, idsExistentes };
}

/**
 * Saidas EFETIVAS na janela, deduplicadas por assinatura.
 *
 * Dedup por `provider_subscription_id` porque as duas fontes se sobrepoem: uma
 * assinatura que terminou tem `canceled_at` preenchido E uma linha `completed`
 * em subscription_cancellations. Sem dedup, ela contaria duas vezes e o churn
 * sairia dobrado.
 */
async function contarSaidasEfetivas(
  inicio: string,
  fim: string,
): Promise<number> {
  const porCanceledAt = await coletarTudo<{
    provider_subscription_id: string | null;
    id: string;
  }>(
    (from, to) =>
      supabaseAdmin
        .from("subscriptions")
        .select("provider_subscription_id, id, canceled_at")
        .gte("canceled_at", inicio)
        .lte("canceled_at", fim)
        .order("id", { ascending: true })
        .range(from, to),
    "churn exits",
  );

  const saidas = new Set<string>();
  for (const row of porCanceledAt) {
    // Cai no `id` da linha quando nao ha id de provedor: e o mesmo objeto, e
    // ignora-lo perderia a saida.
    saidas.add(row.provider_subscription_id ?? row.id);
  }

  const { linhas, idsExistentes } = await lerCancelamentos();
  for (const linha of linhas) {
    if (linha.status !== "completed") continue;
    if (!dentroDaJanela(instanteDoEfeito(linha), inicio, fim)) continue;
    // Orfa NAO entra: o denominador vem de `subscriptions`, e contar no
    // numerador uma assinatura que nao esta la produz uma razao entre
    // populacoes diferentes.
    if (
      !linha.provider_subscription_id ||
      !idsExistentes.has(linha.provider_subscription_id)
    ) {
      continue;
    }
    saidas.add(linha.provider_subscription_id);
  }

  return saidas.size;
}

/** Agendados, revertidos e orfas: acompanham o churn sem entrar nele. */
async function coletarContextoDeChurn(
  inicio: string,
  fim: string,
): Promise<ChurnContext> {
  const { linhas, idsExistentes } = await lerCancelamentos();

  let scheduledNotCounted = 0;
  let revertedInWindow = 0;
  let orphanCancellations = 0;

  for (const linha of linhas) {
    const orfa =
      !linha.provider_subscription_id ||
      !idsExistentes.has(linha.provider_subscription_id);
    if (orfa) {
      orphanCancellations += 1;
      continue;
    }
    if (linha.status === "scheduled") {
      // Agendado NAO se limita a janela: o que importa e que ainda vai sair.
      scheduledNotCounted += 1;
    } else if (
      linha.status === "reverted" &&
      dentroDaJanela(linha.canceled_at, inicio, fim)
    ) {
      revertedInWindow += 1;
    }
  }

  return { scheduledNotCounted, revertedInWindow, orphanCancellations };
}

/**
 * CHURN MEDE EFEITO: quem saiu de fato. Nunca quem AVISOU que vai sair.
 *
 * A distincao nao e preciosismo. Um cancelamento agendado ja e contado como
 * "receita em risco"; se o churn tambem o contasse, o mesmo fato entraria duas
 * vezes no painel e ele passaria a somar a si mesmo. Por isso `scheduled` fica
 * de fora do numerador e sai ao lado, em `scheduledNotCounted`.
 *
 * DE ONDE VEM O EFEITO, nas duas fontes que existem, deduplicado por assinatura:
 *
 *   (a) `subscriptions.canceled_at`, escrito quando a assinatura termina de
 *       verdade, pelo webhook `customer.subscription.deleted`, pelo cron
 *       `process-cancellations` ou pela revogacao administrativa;
 *   (b) `subscription_cancellations` com `status='completed'`, o registro
 *       proprio, que sobrevive mesmo se a linha de assinatura for alterada.
 *
 * POR QUE AS DUAS. Ate 2026-07-31 so (a) era consultada, e (a) tem um buraco
 * conhecido: assinatura de BOLETO (`renewal_type='manual'`) nao tem subscription
 * na Stripe, entao nenhum webhook chega e o cron `process-cancellations` a
 * ignora de proposito. Uma dessas nunca recebe `canceled_at` e some do churn
 * para sempre. (b) fecha esse caso.
 *
 * A GUARDA QUE IMPORTA: `no_subscription_period_ended`. Antes desta versao, a
 * unica protecao era a idade da base, e ela expira sozinha. Medido em
 * 2026-07-31: a assinatura mais antiga e de 13/07 e o periodo mais curto termina
 * em 13/08, entao por volta de 12/08 a guarda de idade deixaria de valer e a
 * funcao passaria a devolver `0 / N = 0%`, um zero CONFIANTE sobre uma base em
 * que nenhuma assinatura teve a chance de terminar. Zero medido e zero por
 * impossibilidade de medir sao coisas diferentes, e so a segunda e mentira.
 * A guarda nova pergunta o que de fato importa: ja houve algum periodo
 * encerrado? Se nao, nao ha o que medir, e o estado e nomeado.
 *
 * `activeAtStart` continua sendo APROXIMACAO (o banco nao guarda snapshot
 * historico de quem estava ativo): assinaturas criadas antes do inicio da janela
 * que nao tinham terminado nem sido canceladas ate ali.
 *
 * LTV (ARPU / churnRate) so e retornado quando churnRate > 0.
 */
export async function getChurnSnapshot(
  params: { windowDays?: number } = {},
): Promise<ChurnSnapshot> {
  const windowDays = params.windowDays ?? 30;
  const nowIso = new Date().toISOString();
  const windowStartIso = new Date(
    Date.now() - windowDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: earliestData, error: earliestError } = await supabaseAdmin
    .from("subscriptions")
    .select("created_at")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (earliestError) throw earliestError;

  const earliest = earliestData as { created_at: string | null } | null;
  if (!earliest?.created_at || earliest.created_at > windowStartIso) {
    return {
      status: "insufficient_data",
      reason: "subscription_base_younger_than_window",
      windowDays,
    };
  }

  // Contexto primeiro: ele acompanha TODOS os desfechos, inclusive os de
  // ausencia. Um "dados insuficientes" que ainda diz "9 agendados, 2 revertidos"
  // informa; um que so diz "insuficiente" nao.
  const contexto = await coletarContextoDeChurn(windowStartIso, nowIso);

  // GUARDA CONTRA O ZERO FALSO. Sem nenhum periodo encerrado, "0 saidas" nao e
  // medicao: e a ausencia da oportunidade de sair.
  const { count: encerradosCount, error: encerradosError } = await supabaseAdmin
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .lte("current_period_end", nowIso);
  if (encerradosError) throw encerradosError;
  if ((encerradosCount ?? 0) === 0) {
    return {
      status: "insufficient_data",
      reason: "no_subscription_period_ended",
      windowDays,
      canceledInWindow: 0,
      ...contexto,
    };
  }

  const { count: activeAtStartCount, error: activeError } = await supabaseAdmin
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .lt("created_at", windowStartIso)
    .or(`canceled_at.is.null,canceled_at.gte.${windowStartIso}`)
    .or(`current_period_end.is.null,current_period_end.gt.${windowStartIso}`);
  if (activeError) throw activeError;

  const canceledInWindow = await contarSaidasEfetivas(windowStartIso, nowIso);

  const activeAtStart = activeAtStartCount ?? 0;

  if (activeAtStart === 0) {
    return {
      status: "insufficient_data",
      reason: "no_active_subscribers_at_window_start",
      windowDays,
      canceledInWindow,
      activeAtStart: 0,
      ...contexto,
    };
  }

  const churnRate = canceledInWindow / activeAtStart;

  let ltvCents: number | null = null;
  if (churnRate > 0) {
    const mrr = await getMrrSnapshot();
    ltvCents =
      mrr.arpuCents !== null ? Math.round(mrr.arpuCents / churnRate) : null;
  }

  return {
    status: "ok",
    windowDays,
    churnRate,
    canceledInWindow,
    activeAtStart,
    ltvCents,
    ...contexto,
  };
}
