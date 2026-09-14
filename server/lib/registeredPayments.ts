import { diaBrasilia } from "../../shared/brasiliaDay";

export const OVERVIEW_PAYMENTS_CONTRACT_VERSION = 3 as const;

export type FinancePaymentRow = {
  id: string;
  provider: string | null;
  provider_transaction_id: string | null;
  stripe_charge_id: string | null;
  type: string;
  gross_cents: number | string | null;
  occurred_at: string | null;
  created_at: string | null;
  user_id: string | null;
  plan_code: string | null;
};

export type PaymentMethodEvidence = {
  /** Necessário na leitura paginada; a classificação usa o vínculo abaixo. */
  id?: string;
  provider: string | null;
  provider_subscription_id: string | null;
  payment_method: string | null;
};

export type ObservedPayment = {
  paymentKey: string;
  rowId: string;
  provider: "stripe" | "asaas";
  userId: string | null;
  occurredAt: string;
  grossCents: number;
  planCode: string | null;
  method: "Pix" | "Boleto" | "Cartão" | "Não identificado";
  classification:
    | "first_observed"
    | "subsequent_observed"
    | "order_uncertain"
    | "unclassified";
  userEvidence:
    | "representative"
    | "enriched_from_duplicate"
    | "unknown"
    | "conflict";
  planEvidence:
    | "representative"
    | "enriched_from_duplicate"
    | "unknown"
    | "conflict";
};

export type PaymentIdentityConflict = {
  paymentKey: string;
  provider: "stripe" | "asaas";
  reasons: Array<"gross_cents" | "occurred_at">;
  candidateOccurredAt: string[];
  candidateGrossCents: number[];
  implicatedUserIds: string[];
};

export type PaymentCoverage = {
  leituraLocal: "paginacao_verificada_sem_snapshot";
  consistenciaFotografia: "nao_garantida";
  consultaIniciadaEm: string | null;
  consultaConcluidaEm: string | null;
  historicoIntegral: "nao_verificavel";
  calculadoAte: string;
  primeiraOcorrenciaObservada: string | null;
  ultimaLinhaLocalCriadaEm: string | null;
  linhasLidas: number;
  identidadesUtilizaveis: number;
  identidadesComConflitoFinanceiroTemporal: number;
  identidadesComConflitoDeValor: number;
  identidadesComConflitoDeInstante: number;
  identidadesComPlanoConflitante: number;
  pagamentosComOrdemHistoricaIncerta: number;
  registrosDuplicados: number;
  pagamentosSemUsuario: number;
  pagamentosSemMeio: number;
  empatesDeInstante: number;
  identidadesComUsuarioConflitante: number;
  meiosPersistidosConflitantes: number;
  excluidos: {
    tipoNaoElegivel: number;
    valorNaoPositivoOuInvalido: number;
    identidadeAusente: number;
    dataInvalida: number;
    futuro: number;
    providerNaoSuportado: number;
  };
};

export type RegisteredPaymentsResult = {
  payments: ObservedPayment[];
  conflicts: PaymentIdentityConflict[];
  coverage: PaymentCoverage;
};

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Identidade do PAGAMENTO, não da entrega do webhook nem do movimento contábil.
 *
 * Stripe grava uma balance transaction em `provider_transaction_id`; o escritor
 * também preserva o `charge.id`, que é o elo canônico da cobrança. Asaas grava
 * `payment.id` diretamente em `provider_transaction_id` para movimentos charge.
 */
export function canonicalPaymentKey(row: FinancePaymentRow): string | null {
  if (row.provider === "stripe") {
    const chargeId = nonEmpty(row.stripe_charge_id);
    return chargeId ? `stripe:charge:${chargeId}` : null;
  }
  if (row.provider === "asaas") {
    const paymentId = nonEmpty(row.provider_transaction_id);
    return paymentId ? `asaas:payment:${paymentId}` : null;
  }
  return null;
}

function normalizeMethod(
  value: string | null | undefined,
): ObservedPayment["method"] {
  if (value === "pix") return "Pix";
  if (value === "boleto") return "Boleto";
  if (value === "card") return "Cartão";
  return "Não identificado";
}

function methodEvidenceKey(row: PaymentMethodEvidence): string | null {
  const id = nonEmpty(row.provider_subscription_id);
  if (!id || row.provider !== "asaas") return null;
  // No escritor Asaas, subscriptions.provider_subscription_id e payment.id.
  // Não existe relação estrutural equivalente para charge -> subscription na
  // Stripe; por isso ela permanece não identificada sem consultar payload/API.
  return `asaas:payment:${id}`;
}

function cents(value: FinancePaymentRow["gross_cents"]): number | null {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" &&
    Number.isSafeInteger(parsed) &&
    parsed > 0
    ? parsed
    : null;
}

function validInstant(value: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Contrato compartilhado pelo gráfico e pelo funil.
 *
 * A entrada deve conter o histórico local observado inteiro até `cutoff`. A
 * função deduplica primeiro por identidade canônica e só então distingue o
 * primeiro pagamento observado global dos posteriores. Ela nunca infere
 * aquisição, renovação ou reativação.
 */
export function classifyRegisteredPayments(input: {
  rows: FinancePaymentRow[];
  methodEvidence?: PaymentMethodEvidence[];
  cutoff: string;
  queryInterval?: { startedAt: string; completedAt: string };
}): RegisteredPaymentsResult {
  const cutoffMs = Date.parse(input.cutoff);
  if (!Number.isFinite(cutoffMs)) {
    throw new Error("classifyRegisteredPayments: corte inválido");
  }

  const excluded: PaymentCoverage["excluidos"] = {
    tipoNaoElegivel: 0,
    valorNaoPositivoOuInvalido: 0,
    identidadeAusente: 0,
    dataInvalida: 0,
    futuro: 0,
    providerNaoSuportado: 0,
  };
  const methodCandidates = new Map<
    string,
    Set<Exclude<ObservedPayment["method"], "Não identificado">>
  >();
  for (const row of input.methodEvidence ?? []) {
    const key = methodEvidenceKey(row);
    const method = normalizeMethod(row.payment_method);
    if (!key || method === "Não identificado") continue;
    const candidates = methodCandidates.get(key) ?? new Set();
    candidates.add(method);
    methodCandidates.set(key, candidates);
  }
  const methods = new Map<string, ObservedPayment["method"]>();
  let methodConflicts = 0;
  for (const [key, candidates] of Array.from(methodCandidates.entries())) {
    if (candidates.size === 1) methods.set(key, Array.from(candidates)[0]);
    else methodConflicts += 1;
  }

  type Candidate = Omit<ObservedPayment, "classification"> & {
    createdAt: string | null;
    occurredMs: number;
  };
  const groups = new Map<string, Candidate[]>();
  for (const row of input.rows) {
    if (row.type !== "charge") {
      excluded.tipoNaoElegivel += 1;
      continue;
    }
    if (row.provider !== "stripe" && row.provider !== "asaas") {
      excluded.providerNaoSuportado += 1;
      continue;
    }
    const paymentKey = canonicalPaymentKey(row);
    if (!paymentKey) {
      excluded.identidadeAusente += 1;
      continue;
    }
    const grossCents = cents(row.gross_cents);
    if (grossCents === null) {
      excluded.valorNaoPositivoOuInvalido += 1;
      continue;
    }
    const occurredMs = validInstant(row.occurred_at);
    if (occurredMs === null) {
      excluded.dataInvalida += 1;
      continue;
    }
    if (occurredMs > cutoffMs) {
      excluded.futuro += 1;
      continue;
    }
    const candidate: Candidate = {
      paymentKey,
      rowId: row.id,
      provider: row.provider,
      userId: nonEmpty(row.user_id),
      occurredAt: new Date(occurredMs).toISOString(),
      grossCents,
      planCode: nonEmpty(row.plan_code),
      method: methods.get(paymentKey) ?? "Não identificado",
      userEvidence: nonEmpty(row.user_id) ? "representative" : "unknown",
      planEvidence: nonEmpty(row.plan_code) ? "representative" : "unknown",
      createdAt: row.created_at,
      occurredMs,
    };
    const group = groups.get(paymentKey) ?? [];
    group.push(candidate);
    groups.set(paymentKey, group);
  }

  let duplicateRecords = 0;
  let identityConflicts = 0;
  let planConflicts = 0;
  let valueConflicts = 0;
  let instantConflicts = 0;
  const deduped: Candidate[] = [];
  const conflicts: PaymentIdentityConflict[] = [];
  const userAttributionAmbiguities: Array<{
    occurredMs: number;
    userIds: string[];
  }> = [];
  for (const [paymentKey, group] of Array.from(groups.entries())) {
    duplicateRecords += group.length - 1;
    const instants = new Set(group.map((x) => x.occurredMs));
    const grossValues = new Set(group.map((x) => x.grossCents));
    const knownUsers = new Set(
      group.map((x) => x.userId).filter((id): id is string => Boolean(id)),
    );
    const knownPlans = new Set(
      group.map((x) => x.planCode).filter((id): id is string => Boolean(id)),
    );
    const reasons: PaymentIdentityConflict["reasons"] = [];
    if (grossValues.size > 1) {
      reasons.push("gross_cents");
      valueConflicts += 1;
    }
    if (instants.size > 1) {
      reasons.push("occurred_at");
      instantConflicts += 1;
    }
    if (reasons.length > 0) {
      if (knownUsers.size > 1) identityConflicts += 1;
      if (knownUsers.size > 0) {
        userAttributionAmbiguities.push({
          occurredMs: Math.min(...Array.from(instants)),
          userIds: Array.from(knownUsers),
        });
      }
      conflicts.push({
        paymentKey,
        provider: group[0].provider,
        reasons,
        candidateOccurredAt: Array.from(instants)
          .sort((a, b) => a - b)
          .map((instant) => new Date(instant).toISOString()),
        candidateGrossCents: Array.from(grossValues).sort((a, b) => a - b),
        implicatedUserIds: Array.from(knownUsers).sort(),
      });
      continue;
    }
    group.sort(
      (a, b) => a.occurredMs - b.occurredMs || a.rowId.localeCompare(b.rowId),
    );
    const picked = group[0];
    if (knownUsers.size > 1) {
      picked.userId = null;
      picked.userEvidence = "conflict";
      identityConflicts += 1;
      userAttributionAmbiguities.push({
        occurredMs: picked.occurredMs,
        userIds: Array.from(knownUsers),
      });
    } else if (knownUsers.size === 1) {
      const onlyUser = Array.from(knownUsers)[0];
      if (picked.userId !== onlyUser) {
        picked.userId = onlyUser;
        picked.userEvidence = "enriched_from_duplicate";
      }
    } else {
      picked.userEvidence = "unknown";
    }
    if (knownPlans.size > 1) {
      picked.planCode = null;
      picked.planEvidence = "conflict";
      planConflicts += 1;
    } else if (knownPlans.size === 1) {
      const onlyPlan = Array.from(knownPlans)[0];
      if (picked.planCode !== onlyPlan) {
        picked.planCode = onlyPlan;
        picked.planEvidence = "enriched_from_duplicate";
      }
    } else {
      picked.planEvidence = "unknown";
    }
    deduped.push(picked);
  }

  deduped.sort(
    (a, b) =>
      a.occurredMs - b.occurredMs ||
      a.paymentKey.localeCompare(b.paymentKey) ||
      a.rowId.localeCompare(b.rowId),
  );

  const seenUsers = new Set<string>();
  const ambiguousBeforeByUser = new Map<string, number>();
  for (const ambiguity of userAttributionAmbiguities) {
    for (const userId of ambiguity.userIds) {
      const previous = ambiguousBeforeByUser.get(userId);
      if (previous === undefined || ambiguity.occurredMs < previous) {
        ambiguousBeforeByUser.set(userId, ambiguity.occurredMs);
      }
    }
  }
  const tieByUserInstant = new Map<string, number>();
  const payments: ObservedPayment[] = deduped.map((payment) => {
    let classification: ObservedPayment["classification"] = "unclassified";
    if (payment.userId) {
      const ambiguousBefore = ambiguousBeforeByUser.get(payment.userId);
      classification = seenUsers.has(payment.userId)
        ? "subsequent_observed"
        : ambiguousBefore !== undefined && ambiguousBefore <= payment.occurredMs
          ? "order_uncertain"
          : "first_observed";
      seenUsers.add(payment.userId);
      const tieKey = `${payment.userId}:${payment.occurredAt}`;
      tieByUserInstant.set(tieKey, (tieByUserInstant.get(tieKey) ?? 0) + 1);
    }
    const {
      createdAt: _createdAt,
      occurredMs: _occurredMs,
      ...publicPayment
    } = payment;
    return { ...publicPayment, classification };
  });

  const createdTimes = input.rows
    .map((p) => validInstant(p.created_at))
    .filter((v): v is number => v !== null);
  const earliestOccurred = deduped.reduce<number | null>(
    (earliest, payment) => {
      const occurred = Date.parse(payment.occurredAt);
      return earliest === null || occurred < earliest ? occurred : earliest;
    },
    null,
  );
  const latestCreated = createdTimes.reduce<number | null>(
    (latest, created) =>
      latest === null || created > latest ? created : latest,
    null,
  );

  return {
    payments,
    conflicts,
    coverage: {
      leituraLocal: "paginacao_verificada_sem_snapshot",
      consistenciaFotografia: "nao_garantida",
      consultaIniciadaEm: input.queryInterval?.startedAt ?? null,
      consultaConcluidaEm: input.queryInterval?.completedAt ?? null,
      historicoIntegral: "nao_verificavel",
      calculadoAte: new Date(cutoffMs).toISOString(),
      primeiraOcorrenciaObservada:
        earliestOccurred === null
          ? null
          : new Date(earliestOccurred).toISOString(),
      ultimaLinhaLocalCriadaEm:
        latestCreated === null ? null : new Date(latestCreated).toISOString(),
      linhasLidas: input.rows.length,
      identidadesUtilizaveis: payments.length,
      identidadesComConflitoFinanceiroTemporal: conflicts.length,
      identidadesComConflitoDeValor: valueConflicts,
      identidadesComConflitoDeInstante: instantConflicts,
      identidadesComPlanoConflitante: planConflicts,
      pagamentosComOrdemHistoricaIncerta: payments.filter(
        (p) => p.classification === "order_uncertain",
      ).length,
      registrosDuplicados: duplicateRecords,
      pagamentosSemUsuario: payments.filter((p) => !p.userId).length,
      pagamentosSemMeio: payments.filter((p) => p.method === "Não identificado")
        .length,
      empatesDeInstante: Array.from(tieByUserInstant.values()).filter(
        (count) => count > 1,
      ).length,
      identidadesComUsuarioConflitante: identityConflicts,
      meiosPersistidosConflitantes: methodConflicts,
      excluidos: excluded,
    },
  };
}

export function paymentIsInWindow(
  payment: ObservedPayment,
  startIso: string | null,
  endIso: string,
): boolean {
  return instantIsInWindow(payment.occurredAt, startIso, endIso);
}

/** Compara instantes, nunca a representação textual equivalente deles. */
export function instantIsInWindow(
  value: string | null | undefined,
  startIso: string | null,
  endIso: string,
): boolean {
  if (!value) return false;
  const instant = Date.parse(value);
  const start = startIso ? Date.parse(startIso) : Number.NEGATIVE_INFINITY;
  const end = Date.parse(endIso);
  return (
    Number.isFinite(instant) &&
    (startIso === null || Number.isFinite(start)) &&
    Number.isFinite(end) &&
    instant >= start &&
    instant <= end
  );
}

export function paymentDay(payment: ObservedPayment): string | null {
  return diaBrasilia(payment.occurredAt);
}
