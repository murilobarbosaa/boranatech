/**
 * Histórico administrativo de UM usuário, para a Fatia 8.
 *
 * Duas propriedades sustentam este arquivo, e as duas são sobre não mentir.
 *
 * (1) INTENÇÃO NÃO É RESULTADO. `content_audit_logs` é escrito ANTES da ação,
 *     de propósito: a auditoria é fail-closed, se ela não grava a ação não
 *     acontece. O efeito colateral é que uma linha registra o que se QUIS
 *     fazer, não o que se conseguiu. Uma tela que mostre intenção como fato
 *     mente exatamente no lugar que existe para não mentir. Por isso todo
 *     registro sai daqui com um `outcome` em três estados:
 *
 *       confirmed      linha de resultado encontrada (admin_refunds,
 *                      subscription_cancellations);
 *       unconfirmed    a ação TEM tabela de resultado e a linha não está lá;
 *       not_verifiable a ação NÃO tem tabela de resultado, ou o cruzamento
 *                      não pôde ser feito.
 *
 *     O terceiro estado não é enfeite. `update_profile`, `update_email` e
 *     `reveal` não deixam rastro próprio: dizer "confirmado" seria inventar,
 *     dizer "não confirmado" sugeriria falha. A resposta honesta é a terceira.
 *
 * (2) ALLOWLIST, NUNCA BLOCKLIST. `before_json`/`after_json` guardam VALORES de
 *     campo de perfil. Uma blocklist protege o que alguém lembrou de listar;
 *     campo novo entra na tela por padrão e vaza no dia em que for criado. Aqui
 *     é o contrário: campo que não estiver declarado abaixo não aparece, e o
 *     custo de acrescentar um é uma linha deliberada neste arquivo.
 *
 *     Para o evento não sumir junto com o valor, `campos_alterados` carrega os
 *     NOMES de tudo que mudou, inclusive do que não é exibido. A tela consegue
 *     dizer "a bio foi alterada" sem mostrar a bio.
 */

/** Estado do cruzamento entre a intenção registrada e o resultado observável. */
import {
  CAMPOS_VISIVEIS_POR_ACTION,
  camposVisiveis,
  comoObjeto,
} from "../../shared/auditVisibleFields";

export { CAMPOS_VISIVEIS_POR_ACTION, camposVisiveis };

export type AuditOutcome = "confirmed" | "unconfirmed" | "not_verifiable";

export type AuditLogRow = {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  resource_slug: string | null;
  actor_user_id: string | null;
  before_json: unknown;
  after_json: unknown;
  created_at: string;
};

export type RefundRow = {
  stripe_charge_id: string;
  amount_cents: number;
  stripe_refund_id: string | null;
  settlement: string | null;
};

export type CancellationRow = {
  canceled_at: string | null;
  status: string | null;
  effective_at: string | null;
};

export type AuditHistoryEntry = {
  id: string;
  action: string;
  resource_type: string | null;
  resource_slug: string | null;
  actor_user_id: string | null;
  actor_name: string;
  created_at: string;
  before: Record<string, string | number | boolean | null>;
  after: Record<string, string | number | boolean | null>;
  campos_alterados: string[];
  outcome: AuditOutcome;
  outcome_detail: string | null;
};

/** Nomes de tudo que consta no registro, allowlist à parte. */
function nomesAlterados(before: unknown, after: unknown): string[] {
  const nomes = new Set<string>();
  for (const json of [before, after]) {
    const obj = comoObjeto(json);
    if (!obj) continue;
    for (const chave of Object.keys(obj)) nomes.add(chave);
  }
  return Array.from(nomes);
}

function instante(iso: string | null): number {
  if (!iso) return Number.NaN;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? Number.NaN : t;
}

function cruzarReembolso(
  log: AuditLogRow,
  refunds: RefundRow[] | null,
): { outcome: AuditOutcome; detail: string | null } {
  // Cruzamento indisponível não some com a entrada: perder o histórico inteiro
  // por causa de uma tabela auxiliar seria pior que exibir a intenção dizendo
  // que o estado não pôde ser checado.
  if (!refunds) return { outcome: "not_verifiable", detail: null };

  const after = comoObjeto(log.after_json);
  const valor =
    after && typeof after.amount_cents === "number" ? after.amount_cents : null;
  const cobranca = log.resource_slug;
  if (!cobranca || valor === null)
    return { outcome: "unconfirmed", detail: null };

  const achado = refunds.find(
    (r) => r.stripe_charge_id === cobranca && r.amount_cents === valor,
  );
  if (!achado) return { outcome: "unconfirmed", detail: null };

  // A frase precisa dizer o que a linha É. Uma devolução declarada não foi
  // emitida por nós, e chamá-la de "reembolso registrado" apagaria justamente a
  // distinção que a coluna settlement existe para guardar.
  if (achado.settlement === "external") {
    return {
      outcome: "confirmed",
      detail:
        "Devolução declarada pelo admin, feita fora da Stripe. A plataforma não tem como verificar.",
    };
  }
  if (achado.settlement === "stripe_dashboard") {
    return {
      outcome: "confirmed",
      detail:
        "Devolução declarada pelo admin, emitida no painel da Stripe. O valor entra no extrato pelo sync.",
    };
  }

  return {
    outcome: "confirmed",
    detail: achado.stripe_refund_id
      ? `Reembolso ${achado.stripe_refund_id} registrado.`
      : "Reembolso registrado.",
  };
}

function cruzarCancelamento(
  log: AuditLogRow,
  cancelamentos: CancellationRow[] | null,
): { outcome: AuditOutcome; detail: string | null } {
  if (!cancelamentos) return { outcome: "not_verifiable", detail: null };

  const intencao = instante(log.created_at);
  // A linha de resultado precisa ser POSTERIOR à intenção. Uma anterior é de
  // outro cancelamento, e casar com ela transformaria um evento antigo em
  // confirmação de um novo.
  const achado = cancelamentos.find((c) => {
    const t = instante(c.canceled_at);
    return !Number.isNaN(t) && !Number.isNaN(intencao) && t >= intencao;
  });
  if (!achado) return { outcome: "unconfirmed", detail: null };

  return {
    outcome: "confirmed",
    detail: achado.effective_at
      ? `Cancelamento registrado, efetivo em ${achado.effective_at}.`
      : "Cancelamento registrado.",
  };
}

export function buildAuditHistory(input: {
  logs: AuditLogRow[];
  atores: Map<string, string>;
  refunds: RefundRow[] | null;
  cancelamentos: CancellationRow[] | null;
}): AuditHistoryEntry[] {
  const { logs, atores, refunds, cancelamentos } = input;

  const entradas = logs.map((log): AuditHistoryEntry => {
    // `refund_external` cruza contra a MESMA tabela de resultado do `refund`
    // (admin_refunds); `revoke_pro` contra a mesma de resultado do
    // `cancel_subscription` (subscription_cancellations), porque a revogação
    // imediata grava lá do mesmo jeito. É esse cruzamento que torna visível o
    // estado meio-feito: reembolso emitido e acesso não removido aparece como
    // "Sem confirmação", de forma durável, na mesma tela.
    const cruzamento =
      log.action === "refund" || log.action === "refund_external"
        ? cruzarReembolso(log, refunds)
        : log.action === "cancel_subscription" || log.action === "revoke_pro"
          ? cruzarCancelamento(log, cancelamentos)
          : { outcome: "not_verifiable" as AuditOutcome, detail: null };

    return {
      id: log.id,
      action: log.action,
      resource_type: log.resource_type,
      resource_slug: log.resource_slug,
      actor_user_id: log.actor_user_id,
      // Ator que não resolve não pode derrubar a linha nem aparecer como uuid
      // cru: o registro do que aconteceu vale mais que o nome de quem fez.
      actor_name:
        (log.actor_user_id ? atores.get(log.actor_user_id) : null) ??
        "Admin removido",
      created_at: log.created_at,
      before: camposVisiveis(log.action, log.before_json),
      after: camposVisiveis(log.action, log.after_json),
      campos_alterados: nomesAlterados(log.before_json, log.after_json),
      outcome: cruzamento.outcome,
      outcome_detail: cruzamento.detail,
    };
  });

  // Mais recente primeiro. Desempate por id decrescente, para a ordem ser
  // determinística quando dois registros compartilham o instante.
  return entradas.sort((a, b) => {
    const ta = instante(a.created_at);
    const tb = instante(b.created_at);
    if (ta !== tb)
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  });
}
