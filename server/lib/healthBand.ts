// A FAIXA DE SAÚDE: os sinais dos dois cartões antigos, num lugar só.
//
// A regra de exibição vive aqui, pura, porque é ela que decide se a faixa some
// ou grita. Verde não é um selo: é a faixa quase não existir.
//
// REDUNDÂNCIAS REMOVIDAS (as três eram reais, não estilo):
//
//   "Supabase Auth"   derivava de `checks.database === "ok"`, o MESMO bit de
//                     "Banco de dados". Dois cartões para um sinal.
//   "Servidor web"    dizia "Online" SEMPRE. Se a resposta do health chegou, o
//                     servidor está de pé — é tautologia, não checagem. O uptime
//                     continua útil como informação, não como sinal de saúde.
//   Redis             era sondado nos DOIS endpoints (`/api/health` e
//                     `/integrations/health`), com dois pings por carga.
//
// GANHOS: `currents` e `jooble` já eram calculados por `/api/health` e nunca
// apareciam em lugar nenhum. Agora aparecem quando quebram.

export type Severidade = "erro" | "atencao";

export type Problema = {
  id: string;
  label: string;
  detalhe: string;
  severidade: Severidade;
};

export type SinaisDeSaude = {
  /** `/api/health`: presença de chave e ping de banco. */
  database: string | null;
  openai: string | null;
  currents: string | null;
  jooble: string | null;
  /** `/integrations/health` (cacheado). */
  posthogState: string | null;
  stripeFaltando: string[];
  redisConfigured: boolean;
  redisOk: boolean;
  resendApiKey: boolean;
  /**
   * Dias desde o último snapshot diário de assinaturas. `null` quando a série
   * está vazia (nunca rodou), que é diferente de estar em dia.
   */
  snapshotStaleDays: number | null;
  /** Boletos emitidos e não pagos, com o valor parado e a data de emissão. */
  boletosPendentes: Array<{ valorCents: number; emitidoEm: string | null }>;
};

/** Um boleto emitido expira após este prazo; depois vira órfão. */
export const BOLETO_LIMBO_DIAS = 5;

/**
 * Tolerância do snapshot diário.
 *
 * 2 dias, não 1: o snapshot do dia é gravado às 05:10 UTC, então entre 21h e 2h
 * de Brasília o mais recente é legitimamente o de ontem. Alertar com 1 dia
 * dispararia todo fim de noite, e alerta que grita sem motivo é alerta que
 * alguém desliga.
 */
export const SNAPSHOT_TOLERANCIA_DIAS = 2;

function diasDesde(iso: string | null, agora: Date): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((agora.getTime() - t) / (24 * 60 * 60 * 1000));
}

/**
 * Os problemas, e só eles. Lista vazia = tudo bem, e a faixa se apaga.
 *
 * Ordem: `erro` antes de `atencao`. Quem abre a faixa quer ver primeiro o que
 * está quebrado, não o que está apenas estranho.
 */
export function calcularProblemas(
  sinais: SinaisDeSaude,
  agora: Date = new Date(),
): Problema[] {
  const problemas: Problema[] = [];

  if (sinais.database !== null && sinais.database !== "ok") {
    problemas.push({
      id: "database",
      label: "Banco de dados",
      detalhe: "O health check não conseguiu consultar o banco.",
      severidade: "erro",
    });
  }

  if (sinais.stripeFaltando.length > 0) {
    // Stripe é o ÚNICO provedor de pagamento: qualquer credencial faltando
    // impede cobrar, então é erro, não aviso.
    problemas.push({
      id: "stripe",
      label: "Stripe",
      detalhe: `Credenciais ausentes: ${sinais.stripeFaltando.join(", ")}.`,
      severidade: "erro",
    });
  }

  if (sinais.posthogState && sinais.posthogState !== "ok") {
    problemas.push({
      id: "posthog",
      label: "PostHog",
      detalhe:
        sinais.posthogState === "not_configured"
          ? "Não configurado: funil e aquisição ficam sem dado."
          : "A sonda do PostHog falhou.",
      severidade: "atencao",
    });
  }

  if (sinais.redisConfigured && !sinais.redisOk) {
    // Redis fora degrada (cache e fila), não derruba: o código trata ausência.
    problemas.push({
      id: "redis",
      label: "Redis",
      detalhe: "Configurado mas sem resposta: cache e fila ficam degradados.",
      severidade: "atencao",
    });
  }

  for (const [id, label, ok] of [
    ["openai", "OpenAI", sinais.openai === "ok"],
    ["resend", "Resend", sinais.resendApiKey],
    ["currents", "Currents", sinais.currents === "ok"],
    ["jooble", "Jooble", sinais.jooble === "ok"],
  ] as const) {
    // `null` = o health check não respondeu; ausência não é falha, e afirmar
    // que a chave falta seria inventar.
    if (ok) continue;
    if (id === "openai" && sinais.openai === null) continue;
    if (id === "currents" && sinais.currents === null) continue;
    if (id === "jooble" && sinais.jooble === null) continue;
    problemas.push({
      id,
      label,
      detalhe: "Chave ausente ou inválida.",
      severidade: "atencao",
    });
  }

  // CRON PARADO. O snapshot diário é o único job com sinal barato e estável (a
  // própria tabela de 16 linhas). Ver o cabeçalho da rota para por que a
  // checagem geral de cron não entrou.
  if (sinais.snapshotStaleDays === null) {
    problemas.push({
      id: "snapshot-nunca",
      label: "Histórico de assinaturas",
      detalhe: "Nenhum snapshot diário registrado.",
      severidade: "atencao",
    });
  } else if (sinais.snapshotStaleDays > SNAPSHOT_TOLERANCIA_DIAS) {
    problemas.push({
      id: "snapshot-parado",
      label: "Cron de snapshot parado",
      detalhe: `Sem snapshot há ${sinais.snapshotStaleDays} dias. A série de MRR parou de crescer.`,
      severidade: "erro",
    });
  }

  // BOLETO EM LIMBO: emitido e não pago. Não é métrica de negócio, é anomalia
  // operacional COM PRAZO — passado o prazo o boleto vira órfão e a linha é
  // cancelada pelo cron. Por isso mora aqui e não num card.
  if (sinais.boletosPendentes.length > 0) {
    const total = sinais.boletosPendentes.reduce(
      (soma, b) => soma + b.valorCents,
      0,
    );
    const prazos = sinais.boletosPendentes
      .map((b) => {
        const dias = diasDesde(b.emitidoEm, agora);
        return dias === null ? null : BOLETO_LIMBO_DIAS - dias;
      })
      .filter((v): v is number => v !== null);
    const menorPrazo = prazos.length ? Math.min(...prazos) : null;

    problemas.push({
      id: "boleto-limbo",
      label: "Boleto emitido e não pago",
      detalhe:
        menorPrazo === null
          ? `${sinais.boletosPendentes.length} boleto(s), ${formatarBrl(total)} parados.`
          : menorPrazo <= 0
            ? `${sinais.boletosPendentes.length} boleto(s), ${formatarBrl(total)} parados. O prazo já venceu.`
            : `${sinais.boletosPendentes.length} boleto(s), ${formatarBrl(total)} parados. O primeiro expira em ${menorPrazo} dia(s).`,
      severidade: "atencao",
    });
  }

  return problemas.sort((a, b) =>
    a.severidade === b.severidade ? 0 : a.severidade === "erro" ? -1 : 1,
  );
}

function formatarBrl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
