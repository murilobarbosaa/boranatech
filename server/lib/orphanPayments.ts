import type Stripe from "stripe";

import { getStripe } from "./stripeClient";
import { supabaseAdmin } from "./supabaseAdmin";

// Deteccao de PAGAMENTO ORFAO: Checkout Session paga na Stripe sem linha
// correspondente em public.subscriptions.
//
// Por que este job existe: o reconcile-subscriptions parte das linhas que JA
// existem em subscriptions e pergunta a Stripe qual o estado delas. Ele nunca
// pergunta o contrario. Entao um checkout.session.completed que morra num dos
// returns mudos de providers/stripe.ts (sem supabase_user_id no metadata, sem
// plano resolvivel, session sem subscription) responde 200, nao cria linha, e
// fica invisivel para sempre: nao ha linha para reconciliar. Este e o unico
// caminho que vai da Stripe para o banco.
//
// O job SO DETECTA. Nao promove ninguem, nao escreve em subscriptions, nao manda
// e-mail. Auto-cura e decisao separada.

const DAY_MS = 24 * 60 * 60 * 1000;

// Janela de varredura padrao. 7 dias cobre com folga o pior caso de retry da
// Stripe (~3 dias) e ainda e barato: uma listagem paginada por execucao.
//
// E ELA NAO BASTA, e o motivo esta medido. O orfao real desta base
// (sub_1Tv4SX..., 2026-07-19) so foi encontrado em 2026-08-14, 26 dias depois,
// por uma varredura manual: a janela de 7 dias ja tinha passado por cima dele
// havia semanas, e o job reportava "0 orfaos" todo dia com toda a razao sobre a
// janela que enxergava. Instrumento que responde certo sobre uma superficie
// menor e o defeito recorrente desta base.
//
// Por isso existe o modo `full`, SEM corte inferior. Ele nao substitui o diario:
// o diario continua barato e pega o caso novo em horas; o `full` e a rede que
// pega o que escapou, e roda sob demanda.
export const DEFAULT_WINDOW_DAYS = 7;
const MIN_WINDOW_DAYS = 1;
const MAX_WINDOW_DAYS = 90;

// Carencia antes de considerar orfa. O webhook e assincrono: uma session paga ha
// 30 segundos pode nao ter linha ainda, e isso e normal, nao incidente. 15
// minutos e muito acima da latencia real (os eventos observados chegam em
// segundos) e muito abaixo da janela, entao nao esconde nada de verdade.
const GRACE_MS = 15 * 60 * 1000;

// PostgREST tem limite pratico de tamanho de URL; o filtro .in() vira query
// string. 100 chaves por lote e o mesmo tamanho de pagina que usamos na Stripe.
const LOOKUP_CHUNK = 100;

// Pagamento efetivo. 'no_payment_required' entra de proposito: e o que a Stripe
// devolve num mode:subscription 100% descontado, onde nao houve cobranca mas a
// assinatura DEVE existir. 'unpaid' fica de fora (boleto emitido e nao pago).
const PAID_STATUSES = new Set(["paid", "no_payment_required"]);

// Só os modos que o produto cria. 'setup' tambem devolve 'no_payment_required' e
// nao representa assinatura nenhuma; se um dia aparecer, nao vira falso positivo.
const PRODUCT_MODES = new Set(["subscription", "payment"]);

/**
 * POR QUE CLASSIFICAR, e nao so contar.
 *
 * "3 pagamentos orfaos" e um numero que nao diz o que fazer. Os tres casos que
 * esta base ja produziu exigem acoes opostas:
 *
 *   `conta_excluida`        a pessoa apagou a conta e a assinatura ficou viva na
 *                           Stripe. Depois da correcao de D8 isto nao acontece
 *                           mais para contas novas, e o marcador
 *                           (`metadata.account_deleted_at` no customer) e o que
 *                           permite reconhecer o caso em vez de gritar.
 *   `modo_teste`            evento de sandbox. Nao e incidente, e ruido.
 *   `sem_usuario_no_banco`  pagou e nao ha (mais) usuario. Exige decisao humana.
 *   `sem_assinatura`        o caso classico: usuario existe, pagamento entrou, a
 *                           linha nao foi criada. E o unico que pede correcao de
 *                           dado, e e o que o job foi escrito para achar.
 *
 * Alarme que nao separa ruido de incidente vira alarme que alguem desliga.
 */
export type OrphanCategory =
  | "modo_teste"
  | "conta_excluida"
  | "sem_usuario_no_banco"
  | "sem_assinatura";

export interface OrphanPaymentFinding {
  sessionId: string;
  /** Chave que deveria estar em subscriptions.provider_subscription_id. */
  expectedProviderSubscriptionId: string;
  supabaseUserId: string | null;
  customerEmail: string | null;
  planId: string | null;
  amountTotalCents: number | null;
  currency: string | null;
  paymentStatus: string | null;
  mode: string | null;
  sessionCreatedAt: string;
  categoria: OrphanCategory;
  /** ISO de `metadata.account_deleted_at` do customer, quando houver. */
  contaExcluidaEm: string | null;
}

export interface OrphanPaymentScan {
  /** `null` no modo full: nao ha janela. */
  windowDays: number | null;
  /** true quando a varredura foi de historico inteiro. */
  full: boolean;
  /**
   * true quando a varredura NAO gravou nada. Vem na resposta de proposito: sem
   * isso, `persisted: false` de um dry-run seria indistinguivel de
   * `persisted: false` por falha de escrita, e as duas coisas pedem reacoes
   * opostas.
   */
  dryRun: boolean;
  /** Sessions pagas encontradas na janela (antes da carencia). */
  paidSessions: number;
  /** Pagas mas recentes demais para julgar. */
  skippedRecent: number;
  orphans: number;
  /**
   * Orfas que pedem ACAO: exclui `modo_teste` e `conta_excluida`. E este numero
   * que decide se o cron sai como 'partial', nao o bruto — senao um ruido
   * conhecido deixa o job amarelo para sempre e ninguem olha mais.
   */
  orphansAcionaveis: number;
  porCategoria: Record<OrphanCategory, number>;
  /** Orfas que ainda nao estavam registradas. */
  newOrphans: number;
  /** false quando a tabela de registro nao respondeu (ver migration). */
  persisted: boolean;
  findings: OrphanPaymentFinding[];
}

export function clampWindowDays(raw: unknown): number {
  const parsed =
    typeof raw === "string"
      ? Number.parseInt(raw, 10)
      : typeof raw === "number"
        ? raw
        : Number.NaN;
  if (!Number.isFinite(parsed)) return DEFAULT_WINDOW_DAYS;
  return Math.min(MAX_WINDOW_DAYS, Math.max(MIN_WINDOW_DAYS, parsed));
}

// Boleto nao gera subscription na Stripe: a linha e chaveada pelo id da Checkout
// Session (cs_...). Cartao usa o id da subscription (sub_...). Mesma regra de
// providers/stripe.ts, senao a busca no banco erra o alvo e tudo vira orfao.
function expectedKeyOf(session: Stripe.Checkout.Session): string {
  const sub = session.subscription;
  if (typeof sub === "string") return sub;
  if (sub?.id) return sub.id;
  return session.id;
}

function toFinding(session: Stripe.Checkout.Session): OrphanPaymentFinding {
  const metadata = session.metadata ?? {};
  return {
    sessionId: session.id,
    expectedProviderSubscriptionId: expectedKeyOf(session),
    supabaseUserId:
      metadata.supabase_user_id || session.client_reference_id || null,
    customerEmail: session.customer_email ?? null,
    planId: metadata.plan_id || null,
    amountTotalCents: session.amount_total ?? null,
    currency: session.currency ?? null,
    paymentStatus: session.payment_status ?? null,
    mode: session.mode ?? null,
    sessionCreatedAt: new Date(session.created * 1000).toISOString(),
    // Preenchidos por `classificar`, que precisa de I/O.
    categoria: "sem_assinatura",
    contaExcluidaEm: null,
  };
}

function customerIdOf(session: Stripe.Checkout.Session): string | null {
  const c = session.customer;
  if (typeof c === "string") return c;
  if (c && typeof c === "object" && "id" in c) return String(c.id);
  return null;
}

/**
 * Marcador de conta excluida, lido do customer.
 *
 * `metadata.account_deleted_at` e gravado por
 * `server/lib/accountDeletion.ts` ANTES do `deleteUser`. E o unico rastro que
 * sobrevive a exclusao, porque no banco todos os FKs para `auth.users` sao
 * `ON DELETE CASCADE` e nao fica linha nenhuma.
 *
 * Falha de leitura NAO derruba a varredura e NAO vira "conta excluida": devolve
 * null e o achado cai numa categoria que pede atencao humana. Errar para o lado
 * de gritar e o certo aqui; errar para o lado de silenciar esconderia um
 * pagamento sem dono.
 */
async function lerContaExcluidaEm(
  customerId: string | null,
): Promise<string | null> {
  if (!customerId) return null;
  try {
    const customer = await getStripe().customers.retrieve(customerId);
    if (!customer || customer.deleted) return null;
    const marca = (customer.metadata ?? {}).account_deleted_at;
    return typeof marca === "string" && marca ? marca : null;
  } catch (err) {
    console.warn(
      `[orphan-payments] nao consegui ler o customer ${customerId}:`,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

/** user_ids que AINDA existem em `profiles`, numa consulta por lote. */
async function idsComPerfil(userIds: string[]): Promise<Set<string>> {
  const encontrados = new Set<string>();
  const unicos = Array.from(new Set(userIds.filter(Boolean)));
  for (let i = 0; i < unicos.length; i += LOOKUP_CHUNK) {
    const chunk = unicos.slice(i, i + LOOKUP_CHUNK);
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .in("user_id", chunk);
    // Fail-loud pelo mesmo motivo de `findExistingKeys`: um erro aqui faria
    // todo mundo parecer "sem usuario no banco".
    if (error) throw error;
    for (const row of data ?? []) {
      if (row.user_id) encontrados.add(row.user_id);
    }
  }
  return encontrados;
}

async function classificar(
  findings: OrphanPaymentFinding[],
  sessoes: Map<string, Stripe.Checkout.Session>,
): Promise<void> {
  const comPerfil = await idsComPerfil(
    findings.map((f) => f.supabaseUserId ?? ""),
  );

  for (const f of findings) {
    const session = sessoes.get(f.sessionId);
    // MODO TESTE pelo campo `livemode` do proprio objeto, nao pelo prefixo do
    // id: o prefixo e convencao, o campo e o dado. (Na pratica uma listagem com
    // chave live nunca devolve sessao de teste; a classificacao existe para o
    // caso de a varredura um dia rodar com chave de sandbox, e para nao
    // depender de convencao de string.)
    if (session && session.livemode === false) {
      f.categoria = "modo_teste";
      continue;
    }
    const marca = await lerContaExcluidaEm(
      session ? customerIdOf(session) : null,
    );
    if (marca) {
      f.contaExcluidaEm = marca;
      f.categoria = "conta_excluida";
      continue;
    }
    if (!f.supabaseUserId || !comPerfil.has(f.supabaseUserId)) {
      f.categoria = "sem_usuario_no_banco";
      continue;
    }
    f.categoria = "sem_assinatura";
  }
}

async function findExistingKeys(keys: string[]): Promise<Set<string>> {
  const found = new Set<string>();
  for (let i = 0; i < keys.length; i += LOOKUP_CHUNK) {
    const chunk = keys.slice(i, i + LOOKUP_CHUNK);
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("provider_subscription_id")
      .in("provider_subscription_id", chunk);
    // Fail-loud: um erro aqui faria TODA session do lote parecer orfa. Melhor
    // derrubar o job (o cron registra o erro) do que gritar falso positivo.
    if (error) throw error;
    for (const row of data ?? []) {
      if (row.provider_subscription_id) found.add(row.provider_subscription_id);
    }
  }
  return found;
}

// Persistencia fail-soft: se a tabela ainda nao existe (migration nao aplicada)
// ou o insert falha, o job NAO morre. O achado ja foi para o console em nivel de
// erro e vai inteiro para cron_run_logs.payload, que existe desde sempre. Perder
// o registro bonito e ruim; perder a deteccao e pior.
async function persistFindings(
  findings: OrphanPaymentFinding[],
): Promise<{ persisted: boolean; newOrphans: number }> {
  if (findings.length === 0) return { persisted: true, newOrphans: 0 };

  const nowIso = new Date().toISOString();
  const rows = findings.map((f) => ({
    stripe_session_id: f.sessionId,
    expected_provider_subscription_id: f.expectedProviderSubscriptionId,
    supabase_user_id: f.supabaseUserId,
    customer_email: f.customerEmail,
    plan_id: f.planId,
    amount_total_cents: f.amountTotalCents,
    currency: f.currency,
    payment_status: f.paymentStatus,
    session_mode: f.mode,
    session_created_at: f.sessionCreatedAt,
    detected_at: nowIso,
    last_seen_at: nowIso,
  }));

  // ignoreDuplicates: a janela e deslizante, entao o mesmo orfao reaparece a cada
  // execucao. So o INSERT real volta linha, e e isso que conta como "novo".
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("billing_orphan_payments")
    .upsert(rows, {
      onConflict: "stripe_session_id",
      ignoreDuplicates: true,
    })
    .select("stripe_session_id");

  if (insertError) {
    console.error(
      "[orphan-payments] falha ao registrar orfaos (a deteccao vale, o registro nao foi gravado):",
      insertError,
    );
    return { persisted: false, newOrphans: 0 };
  }

  // Carimba a re-observacao nas que ja existiam, para dar a leitura de "isso
  // continua em aberto" sem duplicar linha.
  const { error: touchError } = await supabaseAdmin
    .from("billing_orphan_payments")
    .update({ last_seen_at: nowIso })
    .in(
      "stripe_session_id",
      findings.map((f) => f.sessionId),
    )
    .is("resolved_at", null);
  if (touchError) {
    console.warn(
      "[orphan-payments] falha ao atualizar last_seen_at:",
      touchError,
    );
  }

  return { persisted: true, newOrphans: inserted?.length ?? 0 };
}

/** Categorias que NAO pedem acao humana. Ruido conhecido, nomeado. */
const CATEGORIAS_IGNORADAS: ReadonlySet<OrphanCategory> =
  new Set<OrphanCategory>(["modo_teste", "conta_excluida"]);

/**
 * @param options.dryRun Detecta e NAO grava em `billing_orphan_payments`.
 *
 * Existe por um erro cometido em 2026-08-14: a primeira execucao de verificacao
 * do modo `full` foi feita sob a regra "somente leitura", e ela gravou uma linha
 * em producao — porque `detectOrphanPayments` sempre persistiu, e quem rodou
 * (eu) so olhou para as chamadas a Stripe ao julgar se a operacao era de
 * leitura. "Somente leitura" nao e propriedade da intencao de quem chama, e sim
 * da funcao; sem esta opcao, a regra era inverificavel na pratica.
 */
export async function detectOrphanPayments(
  options: { windowDays?: number; full?: boolean; dryRun?: boolean } = {},
): Promise<OrphanPaymentScan> {
  const full = options.full === true;
  const dryRun = options.dryRun === true;
  const windowDays = full ? null : clampWindowDays(options.windowDays);
  const now = Date.now();
  const graceCutoffMs = now - GRACE_MS;

  const stripe = getStripe();
  const candidates: Stripe.Checkout.Session[] = [];
  let paidSessions = 0;
  let skippedRecent = 0;

  // Auto-paginacao percorre todas as paginas. Erro de API propaga (sem catch):
  // uma listagem parcial produziria falso "sem orfaos".
  //
  // No modo `full` o parametro `created` sai INTEIRO da chamada, em vez de
  // receber um limite grande: um "since" gigante ainda seria um corte, e corte
  // e exatamente o que este modo existe para nao ter.
  const params: Stripe.Checkout.SessionListParams = { limit: 100 };
  if (!full) {
    params.created = {
      gte: Math.floor((now - (windowDays as number) * DAY_MS) / 1000),
    };
  }

  for await (const session of stripe.checkout.sessions.list(params)) {
    if (!PAID_STATUSES.has(session.payment_status ?? "")) continue;
    if (!PRODUCT_MODES.has(session.mode ?? "")) continue;
    paidSessions += 1;
    if (session.created * 1000 > graceCutoffMs) {
      skippedRecent += 1;
      continue;
    }
    candidates.push(session);
  }

  const findings: OrphanPaymentFinding[] = [];
  const sessoesPorId = new Map<string, Stripe.Checkout.Session>();
  if (candidates.length > 0) {
    const existing = await findExistingKeys(
      candidates.map((s) => expectedKeyOf(s)),
    );
    for (const session of candidates) {
      if (existing.has(expectedKeyOf(session))) continue;
      sessoesPorId.set(session.id, session);
      findings.push(toFinding(session));
    }
  }

  await classificar(findings, sessoesPorId);

  const porCategoria: Record<OrphanCategory, number> = {
    modo_teste: 0,
    conta_excluida: 0,
    sem_usuario_no_banco: 0,
    sem_assinatura: 0,
  };
  for (const f of findings) porCategoria[f.categoria] += 1;

  // Nivel de log POR CATEGORIA: o que pede acao sai como erro, o ruido
  // conhecido sai como info. Gritar igual para os dois e o caminho para
  // ninguem mais ler o log.
  for (const f of findings) {
    const linha =
      `session=${f.sessionId} categoria=${f.categoria} ` +
      `chave_esperada=${f.expectedProviderSubscriptionId} ` +
      `user=${f.supabaseUserId ?? "DESCONHECIDO"} plano=${f.planId ?? "?"} ` +
      `valor_cents=${f.amountTotalCents ?? "?"} ${f.currency ?? ""} ` +
      `payment_status=${f.paymentStatus} mode=${f.mode} pago_em=${f.sessionCreatedAt}` +
      (f.contaExcluidaEm ? ` conta_excluida_em=${f.contaExcluidaEm}` : "");
    if (CATEGORIAS_IGNORADAS.has(f.categoria)) {
      console.log(`[orphan-payments] ignorado (${f.categoria}): ${linha}`);
    } else {
      console.error(`[orphan-payments] PAGAMENTO SEM ASSINATURA: ${linha}`);
    }
  }

  const { persisted, newOrphans } = dryRun
    ? { persisted: false, newOrphans: 0 }
    : await persistFindings(findings);

  return {
    windowDays,
    full,
    dryRun,
    paidSessions,
    skippedRecent,
    orphans: findings.length,
    orphansAcionaveis: findings.filter(
      (f) => !CATEGORIAS_IGNORADAS.has(f.categoria),
    ).length,
    porCategoria,
    newOrphans,
    persisted,
    findings,
  };
}
