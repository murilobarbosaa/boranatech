// Reconciliacao fiscal: a rede de seguranca do pipeline.
//
// POR QUE ELA EXISTE, e o que ela cobre que o caminho rapido nao cobre:
//
//   - o gancho do webhook (Fase 1) engole a propria falha de proposito, para
//     nao travar a ativacao de acesso. O que ele engole some;
//   - o destravamento no PATCH /api/me (Fase 2) tambem engole;
//   - a fila desiste depois de 12 tentativas;
//   - com o Redis fora, `enqueueFiscalInvoice` nao enfileira nada e a linha
//     fica 'pending' para sempre.
//
// Todos esses caminhos foram desenhados para falhar PARA O LADO de deixar a
// nota para tras, porque o outro lado (travar cobranca, emitir duplicado) e
// pior. Isto aqui e o que recolhe o que ficou.
//
// E o unico ponto do sistema que pergunta "o que EXISTE esta declarado?" em vez
// de "o que declarei existe?", que e a direcao que o CLAUDE.md cobra.

import { supabaseAdmin } from "./supabaseAdmin";
import { enqueueFiscalInvoice, unblockFiscalInvoices } from "./fiscalQueue";
import { env } from "./env";
import { diaBrasilia, formatarDiaCivil } from "../../shared/brasiliaDay";
import { PLAN_PRICING, isPlanId } from "../../shared/planPricing";

/** Horas sem progresso a partir das quais uma linha e considerada parada. */
export const DEFAULT_STALE_HOURS = 6;

const PAGE = 500;

export type ChargeParaReconciliar = {
  stripe_charge_id: string | null;
  stripe_invoice_id: string | null;
  gross_cents: number;
  occurred_at: string;
  user_id: string | null;
  plan_code: string | null;
};

export type DecisaoDeCharge =
  | { acao: "criar" }
  | { acao: "pular"; motivo: "before_cutoff" | "no_user" | "sem_charge_id" };

/**
 * O que fazer com uma cobranca encontrada em finance_transactions.
 *
 * FUNCAO PURA e exportada: e ela que decide se uma nota nasce, e as duas
 * exclusoes que ela aplica sao as que erram caro nos dois sentidos.
 *
 * ORDEM IMPORTA. O corte e avaliado ANTES do dono: uma cobranca de 2025 sem
 * user_id nao e um problema a resolver, e passado fechado. Se o dono viesse
 * primeiro, o contador de `skipped_no_user` encheria de linhas antigas e
 * esconderia os casos recentes, que sao os unicos acionaveis.
 *
 * `user_id` nulo NAO vira nota. Emitir sem saber o tomador significaria emitir
 * com dados de outra pessoa ou com dados em branco; as duas sao piores que nao
 * emitir, e o contador existe justamente para isso aparecer no admin em vez de
 * sumir.
 */
export function decidirCharge(
  charge: ChargeParaReconciliar,
  cutoffISO: string,
): DecisaoDeCharge {
  if (!charge.stripe_charge_id) {
    return { acao: "pular", motivo: "sem_charge_id" };
  }
  // Comparacao no DIA de Brasilia, nao no instante UTC: o corte e uma data
  // civil dada pelo contador, e uma cobranca das 22h do dia do corte pertence
  // aquele dia para quem pagou.
  const dia = diaBrasilia(charge.occurred_at);
  if (!dia || dia < cutoffISO) {
    return { acao: "pular", motivo: "before_cutoff" };
  }
  if (!charge.user_id) {
    return { acao: "pular", motivo: "no_user" };
  }
  return { acao: "criar" };
}

/**
 * Descricao do servico quando NAO se sabe o periodo.
 *
 * A reconciliacao parte de `finance_transactions`, que guarda quando o dinheiro
 * entrou e nao o intervalo coberto pela assinatura. Inventar "periodo de X a Y"
 * a partir da data da cobranca produziria um intervalo plausivel e possivelmente
 * errado (renovacao antecipada, boleto pago com atraso, upgrade no meio do
 * ciclo), impresso num documento fiscal.
 *
 * Entao a nota diz COMPETENCIA, que e o que de fato se sabe: a data em que
 * aquele dinheiro entrou.
 */
export function descricaoPorCompetencia(
  planCode: string | null,
  occurredAt: string,
): string {
  const label = isPlanId(planCode ?? "")
    ? PLAN_PRICING[planCode as keyof typeof PLAN_PRICING].label.toLowerCase()
    : null;
  const base = label
    ? `Assinatura Bora na Tech Pro, plano ${label}`
    : "Assinatura Bora na Tech Pro";
  const competencia = formatarDiaCivil(diaBrasilia(occurredAt));
  return competencia ? `${base}, competência ${competencia}` : base;
}

export type ReconcileResult = {
  created: number;
  requeued_processing: number;
  requeued_pending: number;
  unblocked: number;
  skipped_no_user: number;
  skipped_before_cutoff: number;
  /** Amostra do que seria (ou foi) criado. Curta: e para leitura humana. */
  amostra: Array<{
    stripeChargeId: string;
    userId: string | null;
    amountCents: number;
    occurredAt: string;
    descricao: string;
  }>;
  dryRun: boolean;
};

function horasAtras(horas: number): string {
  return new Date(Date.now() - horas * 60 * 60 * 1000).toISOString();
}

/** Charge ids que JA tem linha em fiscal_invoices, consultados em lotes. */
async function chargesComNota(ids: string[]): Promise<Set<string>> {
  const existentes = new Set<string>();
  const CHUNK = 100; // mesmo tamanho do orphanPayments: o `.in()` vira query string.
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const { data, error } = await supabaseAdmin
      .from("fiscal_invoices")
      .select("stripe_charge_id")
      .in("stripe_charge_id", chunk);
    if (error) {
      throw new Error(`Falha ao consultar notas existentes: ${error.message}`);
    }
    for (const linha of (data ?? []) as Array<{ stripe_charge_id: string }>) {
      existentes.add(linha.stripe_charge_id);
    }
  }
  return existentes;
}

/** VARREDURA A: cobranca sem nota. */
async function varrerChargesSemNota(
  cutoffISO: string,
  dryRun: boolean,
  resultado: ReconcileResult,
): Promise<void> {
  // Filtro por data no BANCO alem do corte fino em memoria: sem ele a varredura
  // leria toda a historia de finance_transactions a cada 6 horas. O filtro usa
  // o instante UTC do inicio do dia de corte, e `decidirCharge` reaplica o
  // criterio no dia de Brasilia, que e mais estrito.
  const desdeUtc = `${cutoffISO}T00:00:00.000Z`;

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from("finance_transactions")
      .select(
        "stripe_charge_id, stripe_invoice_id, gross_cents, occurred_at, user_id, plan_code",
      )
      .eq("type", "charge")
      .gte("occurred_at", desdeUtc)
      .order("occurred_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      throw new Error(`Falha ao varrer cobrancas: ${error.message}`);
    }
    const linhas = (data ?? []) as ChargeParaReconciliar[];
    if (linhas.length === 0) break;

    const candidatas: ChargeParaReconciliar[] = [];
    for (const charge of linhas) {
      const decisao = decidirCharge(charge, cutoffISO);
      if (decisao.acao === "pular") {
        if (decisao.motivo === "before_cutoff") {
          resultado.skipped_before_cutoff += 1;
        } else if (decisao.motivo === "no_user") {
          resultado.skipped_no_user += 1;
        }
        continue;
      }
      candidatas.push(charge);
    }

    if (candidatas.length > 0) {
      const jaTem = await chargesComNota(
        candidatas.map((c) => c.stripe_charge_id!),
      );
      for (const charge of candidatas) {
        const chargeId = charge.stripe_charge_id!;
        if (jaTem.has(chargeId)) continue;

        const descricao = descricaoPorCompetencia(
          charge.plan_code,
          charge.occurred_at,
        );
        resultado.created += 1;
        if (resultado.amostra.length < 20) {
          resultado.amostra.push({
            stripeChargeId: chargeId,
            userId: charge.user_id,
            amountCents: charge.gross_cents,
            occurredAt: charge.occurred_at,
            descricao,
          });
        }
        if (dryRun) continue;

        // Resolve a assinatura do usuario, quando houver. Ausencia nao impede a
        // nota: o vinculo e informativo.
        const { data: sub } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .eq("user_id", charge.user_id!)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { error: insertError } = await supabaseAdmin
          .from("fiscal_invoices")
          .upsert(
            {
              user_id: charge.user_id,
              subscription_id: sub?.id ?? null,
              stripe_charge_id: chargeId,
              stripe_invoice_id: charge.stripe_invoice_id,
              status: "pending",
              amount_cents: charge.gross_cents,
              plan_code: charge.plan_code,
              service_description: descricao,
            },
            { onConflict: "stripe_charge_id", ignoreDuplicates: true },
          );
        if (insertError) {
          throw new Error(
            `Falha ao criar nota para ${chargeId}: ${insertError.message}`,
          );
        }
        await enqueueFiscalInvoice(chargeId);
      }
    }

    if (linhas.length < PAGE) break;
  }
}

/** VARREDURAS B e C: linhas paradas. */
async function varrerParadas(
  status: "processing" | "pending",
  staleHours: number,
  dryRun: boolean,
): Promise<number> {
  const limite = horasAtras(staleHours);
  let query = supabaseAdmin
    .from("fiscal_invoices")
    .select("stripe_charge_id")
    .eq("status", status)
    .lt("updated_at", limite)
    .limit(PAGE);

  // 'processing' so conta como parada se JA foi entregue ao provedor. Sem
  // provider_invoice_id ela e uma tentativa que morreu no meio, e o
  // re-enfileiramento cai no caminho de emissao normal, nao no de reconsulta.
  if (status === "processing") {
    query = query.not("provider_invoice_id", "is", null);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Falha ao varrer notas ${status}: ${error.message}`);
  }
  const linhas = (data ?? []) as Array<{ stripe_charge_id: string }>;
  if (dryRun) return linhas.length;

  let reenfileiradas = 0;
  for (const linha of linhas) {
    // Seguro por construcao: o jobId deterministico dedupa contra um job vivo, e
    // o ramo de reconsulta impede reemissao de nota ja aberta no provedor.
    await enqueueFiscalInvoice(linha.stripe_charge_id);
    reenfileiradas += 1;
  }
  return reenfileiradas;
}

/** VARREDURA D: bloqueadas cujo cadastro ja esta completo. */
async function varrerBloqueadas(dryRun: boolean): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("fiscal_invoices")
    .select("user_id")
    .eq("status", "blocked_missing_data")
    .limit(PAGE);
  if (error) {
    throw new Error(`Falha ao varrer notas bloqueadas: ${error.message}`);
  }

  // Array.from e nao spread: o `target` do tsconfig da aplicacao nao permite
  // iterar Set com spread (TS2802).
  const usuarios = Array.from(
    new Set((data ?? []).map((l) => (l as { user_id: string }).user_id)),
  );
  if (dryRun) return usuarios.length;

  let destravadas = 0;
  for (const userId of usuarios) {
    // MESMA funcao do gancho do PATCH /api/me: ela reconsulta o cadastro e nao
    // destrava nada se ainda faltar dado. Duas implementacoes divergiriam.
    destravadas += await unblockFiscalInvoices(userId);
  }
  return destravadas;
}

export async function reconcileFiscalInvoices(
  opts: { dryRun?: boolean; staleHours?: number } = {},
): Promise<ReconcileResult> {
  const dryRun = opts.dryRun === true;
  const staleHours = opts.staleHours ?? DEFAULT_STALE_HOURS;
  const cutoffISO = env.nfseEmitirDesde;

  // Guarda de sanidade: o boot ja aborta sem a env, mas este modulo tambem e
  // alcancavel por chamada direta, e varrer sem corte varreria a base inteira.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoffISO)) {
    throw new Error(
      "NFSE_EMITIR_DESDE ausente ou invalido; a reconciliacao nao roda sem data de corte.",
    );
  }

  const resultado: ReconcileResult = {
    created: 0,
    requeued_processing: 0,
    requeued_pending: 0,
    unblocked: 0,
    skipped_no_user: 0,
    skipped_before_cutoff: 0,
    amostra: [],
    dryRun,
  };

  await varrerChargesSemNota(cutoffISO, dryRun, resultado);
  resultado.requeued_processing = await varrerParadas(
    "processing",
    staleHours,
    dryRun,
  );
  resultado.requeued_pending = await varrerParadas(
    "pending",
    staleHours,
    dryRun,
  );
  resultado.unblocked = await varrerBloqueadas(dryRun);

  return resultado;
}
