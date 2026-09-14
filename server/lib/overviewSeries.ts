import { diaBrasilia, somarDiaCivil } from "../../shared/brasiliaDay";
import type { Janela } from "./overviewWindow";
import { classificarCustoDeIa } from "./aiUsageStats";
import { coletarTudo, coletarTudoProvandoTotal } from "./paginate";
import {
  classifyRegisteredPayments,
  instantIsInWindow,
  OVERVIEW_PAYMENTS_CONTRACT_VERSION,
  paymentIsInWindow,
  type FinancePaymentRow,
  type ObservedPayment,
  type PaymentCoverage,
  type PaymentMethodEvidence,
} from "./registeredPayments";
import { supabaseAdmin } from "./supabaseAdmin";

// SERIES DIARIAS, FUNIL E UNIT ECONOMICS DA VISAO (Fase 4).
//
// TUDO DE TABELA LOCAL. Nenhuma chamada a Stripe em request-time: a Visao e a
// primeira tela que o admin abre, e pendurar a latencia de uma API externa em
// cada carga e o caminho para alguem parar de abrir. O painel de atencao tambem
// usa somente fatos locais e declara o que o sistema nao coleta.
//
// MESMO BUCKETING DA FASE 2: dia civil de America/Sao_Paulo, via
// shared/brasiliaDay.ts. Uma serie que agrupe por dia UTC ao lado de cards que
// contam por dia civil reintroduz exatamente a divergencia de 182 cadastros
// medida em 2026-08-14.

/** Ponto de uma serie diaria. `value` nulo = NAO MEDIDO (so em estoque). */
export type PontoSerie = {
  date: string;
  value: number | null;
  /** O dia ainda esta acontecendo: o numero vai subir. */
  partial: boolean;
};

/**
 * FLUXO vs ESTOQUE, e a diferenca decide o que fazer com dia vazio.
 *
 * FLUXO (cadastros, receita, conversoes, custo): dia sem linha significa que
 * nada aconteceu. Isso e um ZERO de verdade, e a barra e desenhada. Omitir o dia
 * faria o grafico parecer mais curto do que o periodo.
 *
 * ESTOQUE (MRR, assinantes): vem de `subscription_snapshots`, uma foto por dia.
 * Dia sem snapshot significa que NINGUEM MEDIU. Preencher com zero afirmaria que
 * o MRR caiu a zero naquele dia, e interpolar afirmaria uma medicao que nao
 * houve. Volta `null`, e quem desenha quebra a linha.
 */
export type TipoDeSerie = "fluxo" | "estoque";

/**
 * Para onde "para cima" e bom. O client colore o delta a partir daqui em vez de
 * inferir pelo nome da metrica: custo subindo e ruim, receita subindo e boa, e
 * nenhuma das duas coisas esta no nome.
 */
export type Direcao = "up_bom" | "up_ruim";

export type SerieNomeada = {
  chave: string;
  rotulo: string;
  tipo: TipoDeSerie;
  direcao: Direcao;
  pontos: PontoSerie[];
  /** Soma da janela (fluxo) ou ultimo valor medido (estoque). `null` se vazio. */
  total: number | null;
};

const DIRECOES: Record<string, Direcao> = {
  cadastros: "up_bom",
  receitaBrutaCents: "up_bom",
  primeiroPagamentoObservado: "up_bom",
  pagamentosPosteriores: "up_bom",
  pagamentosSemClassificacao: "up_bom",
  pagamentosOrdemIncerta: "up_bom",
  custoIaUsd: "up_ruim",
  chamadasSemCustoMedido: "up_ruim",
  mrrCents: "up_bom",
  assinantesAtivos: "up_bom",
};

/** Lista de dias civis da janela, do primeiro ao ultimo. */
function diasDaJanela(janela: Janela, primeiroFallback: string): string[] {
  const inicio = janela.primeiroDiaCivil ?? primeiroFallback;
  const dias: string[] = [];
  for (let d = inicio; d <= janela.ultimoDiaCivil; d = somarDiaCivil(d)) {
    dias.push(d);
  }
  return dias;
}

function montarFluxo(
  dias: string[],
  porDia: Map<string, number>,
  hoje: string,
): PontoSerie[] {
  return dias.map((date) => ({
    date,
    value: porDia.get(date) ?? 0,
    partial: date === hoje,
  }));
}

/** Agrupa carimbos por dia civil, somando `peso` (default 1). */
function agrupar(
  linhas: Array<{ quando: string | null; peso?: number }>,
): Map<string, number> {
  const porDia = new Map<string, number>();
  for (const l of linhas) {
    const dia = diaBrasilia(l.quando);
    if (!dia) continue;
    porDia.set(dia, (porDia.get(dia) ?? 0) + (l.peso ?? 1));
  }
  return porDia;
}

// ---------------------------------------------------------------------------
// FUNIL
// ---------------------------------------------------------------------------

export type PassoDoFunil = {
  chave: "cadastro" | "pagamento" | "uso_ia";
  rotulo: string;
  valor: number;
  /** Taxa sobre o passo ANTERIOR. `null` no primeiro e quando o denominador e 0. */
  taxaSobreAnterior: number | null;
};

/** Contagens de uma coorte, nos tres passos. Mesma forma nas duas janelas. */
export type ContagemDeCoorte = {
  cadastro: number;
  pagaram: number;
  /** Início pós-pagamento cujo status encontrado na consulta era success. */
  iniciaramIaComStatusSuccessNaConsulta: number;
  cadastrosComMenosDe7Dias: number;
};

export type AiUsageForFunnel = {
  user_id: string | null;
  status: string | null;
  created_at: string;
};

/**
 * Funil de uma coorte de cadastro. `created_at` do uso é o início do registro,
 * e `status` é o valor encontrado durante a consulta. Uma reserva pode virar
 * success sem timestamp da transição. Logo a função não data a conclusão.
 */
export function contarCoortePaga(input: {
  pessoas: Array<{ user_id: string; created_at: string }>;
  pagamentos: ObservedPayment[];
  logs: AiUsageForFunnel[];
  cutoff: string;
}): ContagemDeCoorte {
  const cutoffMs = Date.parse(input.cutoff);
  const profiles = new Map<string, number>();
  for (const pessoa of input.pessoas) {
    const created = Date.parse(pessoa.created_at);
    if (!pessoa.user_id || !Number.isFinite(created) || created > cutoffMs)
      continue;
    const existing = profiles.get(pessoa.user_id);
    if (existing === undefined || created < existing)
      profiles.set(pessoa.user_id, created);
  }

  const firstEligibleAfterSignup = new Map<string, number>();
  for (const payment of input.pagamentos) {
    if (!payment.userId) continue;
    const signup = profiles.get(payment.userId);
    const paid = Date.parse(payment.occurredAt);
    if (signup === undefined || paid <= signup || paid > cutoffMs) continue;
    const existing = firstEligibleAfterSignup.get(payment.userId);
    if (existing === undefined || paid < existing) {
      firstEligibleAfterSignup.set(payment.userId, paid);
    }
  }

  const successfulAfterPayment = new Set<string>();
  for (const log of input.logs) {
    if (!log.user_id || log.status !== "success") continue;
    const paid = firstEligibleAfterSignup.get(log.user_id);
    const started = Date.parse(log.created_at);
    if (paid === undefined || !Number.isFinite(started)) continue;
    if (started > paid && started <= cutoffMs)
      successfulAfterPayment.add(log.user_id);
  }

  return {
    cadastro: profiles.size,
    pagaram: firstEligibleAfterSignup.size,
    iniciaramIaComStatusSuccessNaConsulta: successfulAfterPayment.size,
    cadastrosComMenosDe7Dias: Array.from(profiles.values()).filter(
      (created) => cutoffMs - created < 7 * 24 * 60 * 60 * 1000,
    ).length,
  };
}

export type Funil = {
  passos: PassoDoFunil[];
  /** Chave do passo com a PIOR transicao. `null` quando nao ha transicao medivel. */
  destaque: string | null;
  anterior: null;
  motivoSemDelta: "janelas_de_observacao_nao_equivalentes";
  deltaPp: null;
  limiteTemporalDosInicios: string;
  consultaIniciadaEm: string;
  consultaConcluidaEm: string;
  semanticaUso: "inicio_apos_pagamento_status_success_na_consulta";
  cadastrosComMenosDe7Dias: number;
};

/**
 * FUNIL DE COORTE com os tres passos aninhados na mesma pessoa: cadastro na
 * janela, pagamento elegivel registrado depois do cadastro e registro de IA
 * iniciado depois desse pagamento, encontrado com status success na consulta.
 * Nao comeca em visitante porque nao existe fonte local adequada para isso.
 *
 * O instante do pagamento vem de finance_transactions.occurred_at. Para IA,
 * created_at e o inicio do registro: a reserva pode virar success por update
 * sem timestamp de conclusao. O corte vale para o inicio, não para o momento
 * desconhecido do success. Aproximar a conclusao inventaria fato.
 *
 * Nao ha coorte anterior nem delta: comparar pessoas com tempos de observacao
 * diferentes criaria tendencia enviesada. `cadastrosComMenosDe7Dias` torna a
 * exposicao curta visivel sem fingir uma metrica D7. O destaque deterministico
 * continua sendo a menor taxa adjacente da coorte atual.
 */
export function montarFunilDeCoorte(
  input: ContagemDeCoorte & {
    limiteTemporalDosInicios: string;
    consultaIniciadaEm: string;
    consultaConcluidaEm: string;
  },
): Funil {
  const taxa = (num: number, den: number) =>
    den > 0 ? (num / den) * 100 : null;
  const passos: PassoDoFunil[] = [
    {
      chave: "cadastro",
      rotulo: "Cadastros no período",
      valor: input.cadastro,
      taxaSobreAnterior: null,
    },
    {
      chave: "pagamento",
      rotulo: "Com pagamento registrado após o cadastro",
      valor: input.pagaram,
      taxaSobreAnterior: taxa(input.pagaram, input.cadastro),
    },
    {
      // "Engajamento pos-compra", nao conversao: e o unico passo cujo
      // denominador ja pagou, e chama-lo de conversao mandaria otimizar a coisa
      // errada. O que uma taxa baixa aqui diz e que o produto nao esta sendo
      // usado por quem comprou, que e um problema de retencao, nao de funil.
      chave: "uso_ia",
      rotulo: "Com IA iniciada após o pagamento e status success na consulta",
      valor: input.iniciaramIaComStatusSuccessNaConsulta,
      taxaSobreAnterior: taxa(
        input.iniciaramIaComStatusSuccessNaConsulta,
        input.pagaram,
      ),
    },
  ];

  const comTaxa = passos.filter(
    (p): p is PassoDoFunil & { taxaSobreAnterior: number } =>
      p.taxaSobreAnterior !== null,
  );
  const destaque =
    comTaxa.length === 0
      ? null
      : comTaxa.reduce((pior, atual) =>
          atual.taxaSobreAnterior < pior.taxaSobreAnterior ? atual : pior,
        ).chave;

  return {
    passos,
    destaque,
    anterior: null,
    motivoSemDelta: "janelas_de_observacao_nao_equivalentes",
    deltaPp: null,
    limiteTemporalDosInicios: input.limiteTemporalDosInicios,
    consultaIniciadaEm: input.consultaIniciadaEm,
    consultaConcluidaEm: input.consultaConcluidaEm,
    semanticaUso: "inicio_apos_pagamento_status_success_na_consulta",
    cadastrosComMenosDe7Dias: input.cadastrosComMenosDe7Dias,
  };
}

// ---------------------------------------------------------------------------
// STALENESS DO SNAPSHOT (D14)
// ---------------------------------------------------------------------------

/** Cadencia do cron `snapshot-subscriptions`: 05:10 UTC (migration 20260715150100). */
export const SNAPSHOT_HORA_UTC = 5;
export const SNAPSHOT_MINUTO_UTC = 10;
/**
 * Margem antes de chamar de atraso. O job precisa rodar, responder e gravar; e o
 * Railway pode estar subindo um deploy no minuto exato. Duas horas e folgado o
 * bastante para nao gritar por variacao normal e curto o bastante para um dia
 * pulado aparecer no mesmo dia.
 */
export const SNAPSHOT_MARGEM_HORAS = 2;

export type FrescorDoSnapshot = {
  /** Horas desde a ultima execucao ESPERADA do cron. `null` sem snapshot nenhum. */
  horasDesdeOEsperado: number | null;
  atrasado: boolean;
  ultimoSnapshot: string | null;
};

/**
 * STALENESS POR DURACAO, e nao por subtracao de rotulos de dia (D14).
 *
 * O que havia antes: `diasEntre(ultimoSnapshot, hojeUTC)`, a diferenca entre
 * duas ETIQUETAS de calendario. Como o cron roda as 05:10 UTC, entre 00:00Z e
 * 05:10Z o rotulo de hoje ja virou e o snapshot ainda nao rodou: o campo
 * acusava 1 dia de atraso sem nada estar atrasado, **5h10 por dia**. O dia civil
 * de Brasilia erraria menos (2h10) e ainda assim erraria, porque o problema
 * nunca foi o fuso: era comparar rotulos onde a pergunta e duracao.
 *
 * Agora a conta e: quando a ultima execucao ERA ESPERADA, e quanto tempo passou
 * desde entao. Se o ultimo snapshot e o de hoje, a ultima esperada e hoje as
 * 05:10 UTC. Se ainda nao deu 05:10, a ultima esperada foi ontem. Atrasado e
 * `horas > 24 + margem`, ou seja, uma execucao inteira perdida.
 */
export function calcularFrescor(
  ultimoSnapshot: string | null,
  agora: Date,
): FrescorDoSnapshot {
  if (!ultimoSnapshot) {
    return { horasDesdeOEsperado: null, atrasado: false, ultimoSnapshot: null };
  }
  // Ultima execucao esperada: hoje as 05:10 UTC se ja passou; senao, ontem.
  const hojeUtc = agora.toISOString().slice(0, 10);
  let esperada = Date.parse(
    `${hojeUtc}T${String(SNAPSHOT_HORA_UTC).padStart(2, "0")}:${String(SNAPSHOT_MINUTO_UTC).padStart(2, "0")}:00Z`,
  );
  if (esperada > agora.getTime()) esperada -= 24 * 60 * 60 * 1000;

  const gravado = Date.parse(`${ultimoSnapshot}T00:00:00Z`);
  // O snapshot do dia D e gravado as 05:10Z de D, entao o instante real da
  // coleta e o rotulo mais a hora do cron.
  const coletadoEm =
    gravado + (SNAPSHOT_HORA_UTC * 60 + SNAPSHOT_MINUTO_UTC) * 60 * 1000;
  const horas = (esperada - coletadoEm) / (60 * 60 * 1000);
  return {
    horasDesdeOEsperado: Math.max(0, Math.round(horas * 10) / 10),
    atrasado: horas > SNAPSHOT_MARGEM_HORAS,
    ultimoSnapshot,
  };
}

// ---------------------------------------------------------------------------
// LEITURA
// ---------------------------------------------------------------------------

export type UsoPorFerramenta = {
  tool: string;
  chamadas: number;
  custoUsd: number;
  semCustoMedido: number;
};

export type OverviewSeries = {
  contractVersion: typeof OVERVIEW_PAYMENTS_CONTRACT_VERSION;
  series: SerieNomeada[];
  pagamentos: {
    series: SerieNomeada[];
    pagamentosUtilizaveisNoPeriodo: number;
    pessoasIdentificadas: number;
    semPessoaNoPeriodo: number;
    ordemHistoricaIncertaNoPeriodo: number;
    identidadesConflitantesNoHistorico: number;
    identidadesConflitantesComDataCandidataNoPeriodo: number;
    porMeio: Array<{ rotulo: string; pagamentos: number }>;
    porProvider: Array<{ provider: string; pagamentos: number }>;
    cobertura: PaymentCoverage;
    ressalvaHistorica: string;
  };
  funil: Funil;
  ferramentas: UsoPorFerramenta[];
  frescorDoSnapshot: FrescorDoSnapshot;
  /**
   * Metricas que a fase QUERIA e que nao tem fonte local. Declaradas em vez de
   * omitidas: uma serie ausente sem explicacao vira "ninguem implementou" na
   * leitura de quem chegar depois.
   */
  semFonteLocal: Array<{ chave: string; motivo: string }>;
};

export async function montarSeriesDaVisao(
  janela: Janela,
  agora: Date = new Date(),
): Promise<OverviewSeries> {
  const hoje = janela.ultimoDiaCivil;
  const desdeIso = janela.startIso ?? new Date(0).toISOString();
  const consultaIniciadaEm = new Date().toISOString();

  const [perfis, transacoes, evidenciasDeMeio, logs, snapshots] =
    await Promise.all([
      coletarTudoProvandoTotal<{ user_id: string; created_at: string }>(
        (from, to) => {
          let query = supabaseAdmin
            .from("profiles")
            .select("user_id, created_at", { count: "exact" })
            .lte("created_at", janela.endIso);
          if (janela.startIso) query = query.gte("created_at", janela.startIso);
          return query
            .order("created_at", { ascending: true })
            .order("user_id", { ascending: true })
            .range(from, to);
        },
        {
          op: "overview-series profiles",
          rowKey: (row) => row.user_id,
        },
      ),
      coletarTudoProvandoTotal<FinancePaymentRow>(
        (from, to) =>
          supabaseAdmin
            .from("finance_transactions")
            .select(
              "id, provider, provider_transaction_id, stripe_charge_id, type, gross_cents, occurred_at, created_at, user_id, plan_code",
              { count: "exact" },
            )
            .eq("type", "charge")
            .lte("occurred_at", janela.endIso)
            .order("occurred_at", { ascending: true })
            .order("id", { ascending: true })
            .range(from, to),
        {
          op: "overview-series finance payments",
          rowKey: (row) => row.id,
        },
      ),
      coletarTudoProvandoTotal<PaymentMethodEvidence & { id: string }>(
        (from, to) =>
          supabaseAdmin
            .from("subscriptions")
            .select("id, provider, provider_subscription_id, payment_method", {
              count: "exact",
            })
            .order("id", { ascending: true })
            .range(from, to),
        {
          op: "overview-series payment method evidence",
          rowKey: (row) => row.id,
        },
      ),
      coletarTudoProvandoTotal<{
        id: string;
        user_id: string | null;
        tool: string;
        status: string | null;
        cost_estimate: string | null;
        created_at: string;
      }>(
        (from, to) =>
          supabaseAdmin
            .from("ai_usage_logs")
            .select("id, user_id, tool, status, cost_estimate, created_at", {
              count: "exact",
            })
            .gte("created_at", desdeIso)
            .lte("created_at", janela.endIso)
            .order("created_at", { ascending: true })
            .order("id", { ascending: true })
            .range(from, to),
        { op: "overview-series ai", rowKey: (row) => row.id },
      ),
      coletarTudo<{
        snapshot_date: string;
        mrr_cents: number | null;
        active_count: number | null;
      }>(
        (from, to) =>
          supabaseAdmin
            .from("subscription_snapshots")
            .select("snapshot_date, mrr_cents, active_count")
            .order("snapshot_date", { ascending: true })
            .range(from, to),
        "series snapshots",
      ),
    ]);
  const consultaConcluidaEm = new Date().toISOString();

  const pagamentosClassificados = classifyRegisteredPayments({
    rows: transacoes,
    methodEvidence: evidenciasDeMeio,
    cutoff: janela.endIso,
    queryInterval: {
      startedAt: consultaIniciadaEm,
      completedAt: consultaConcluidaEm,
    },
  });

  // O PRIMEIRO DIA DA BASE E O MENOR `created_at`, e nao `perfis[0]`.
  //
  // BUG MEDIDO em 2026-08-14: a varredura ordena por `user_id` (exigencia da
  // paginacao por OFFSET, que sem ORDER BY pode repetir ou pular linhas), entao
  // `perfis[0]` era o perfil de menor UUID, uma linha arbitraria. Em `window=
  // all` isso definia o inicio da serie: o menor `user_id` era de 2026-08-10 e o
  // menor `created_at` de 2026-05-04, entao o grafico de "tudo" desenhava
  // CINCO dias e somava 19 conversoes onde existiam 104. Nada acusava: cinco
  // barras plausiveis.
  //
  // O conserto e o minimo sobre TODAS as linhas lidas. Trocar o ORDER BY para
  // `created_at` seria pior: a coluna nao e unica, e paginacao por OFFSET sobre
  // chave nao unica volta a poder pular linha.
  let primeiroPerfil: string | null = null;
  for (const p of perfis) {
    const dia = diaBrasilia(p.created_at);
    if (dia && (primeiroPerfil === null || dia < primeiroPerfil)) {
      primeiroPerfil = dia;
    }
  }
  const primeiroPagamento = pagamentosClassificados.coverage
    .primeiraOcorrenciaObservada
    ? diaBrasilia(pagamentosClassificados.coverage.primeiraOcorrenciaObservada)
    : null;
  const primeiroFallback = [primeiroPerfil, primeiroPagamento]
    .filter((dia): dia is string => Boolean(dia))
    .sort()[0];
  const dias = diasDaJanela(janela, primeiroFallback ?? hoje);

  // --- FLUXOS -------------------------------------------------------------
  //
  // UM SO criterio de pertinencia, usado pelas series E pelo funil. A primeira
  // versao tinha dois: a serie olhava so o limite inferior e o funil olhava os
  // dois, entao uma linha com carimbo no FUTURO (relogio torto, backfill,
  // fixture de teste) entrava na serie e ficava fora do funil. Dois criterios
  // para a mesma janela e a divergencia de 182 cadastros em miniatura.
  const naJanela = (iso: string | null | undefined) =>
    instantIsInWindow(iso, janela.startIso, janela.endIso);

  const cadastros = agrupar(
    perfis
      .filter((p) => naJanela(p.created_at))
      .map((p) => ({ quando: p.created_at })),
  );
  const receita = agrupar(
    transacoes
      .filter(
        (t) =>
          t.type === "charge" &&
          typeof t.gross_cents === "number" &&
          Number.isFinite(t.gross_cents) &&
          naJanela(t.occurred_at ?? ""),
      )
      .map((t) => ({ quando: t.occurred_at, peso: Number(t.gross_cents) })),
  );
  const pagamentosNaJanela = pagamentosClassificados.payments.filter((p) =>
    paymentIsInWindow(p, janela.startIso, janela.endIso),
  );
  const porClassificacao = (
    classification: ObservedPayment["classification"],
  ) =>
    agrupar(
      pagamentosNaJanela
        .filter((p) => p.classification === classification)
        .map((p) => ({ quando: p.occurredAt })),
    );
  const logsComCusto = logs.map((log) => ({
    log,
    custo: classificarCustoDeIa(log.status, log.cost_estimate),
  }));
  const custoIa = agrupar(
    logsComCusto.map(({ log, custo }) => ({
      quando: log.created_at,
      peso: custo.custoMedido,
    })),
  );
  const semCusto = agrupar(
    logsComCusto
      .filter(({ custo }) => custo.semCustoMedido)
      .map(({ log }) => ({ quando: log.created_at })),
  );

  // --- ESTOQUES (sem zero-fill) -------------------------------------------
  const snapPorDia = new Map(snapshots.map((s) => [s.snapshot_date, s]));
  const estoque = (campo: "mrr_cents" | "active_count"): PontoSerie[] =>
    dias.map((date) => {
      const s = snapPorDia.get(date);
      return {
        date,
        // Dia sem snapshot volta NULL: ninguem mediu. Zero afirmaria que o MRR
        // caiu a zero, e interpolar afirmaria uma medicao que nao houve.
        value: s ? (s[campo] ?? null) : null,
        partial: false,
      };
    });

  const somar = (pontos: PontoSerie[]) =>
    pontos.reduce((a, p) => a + (p.value ?? 0), 0);
  const ultimoMedido = (pontos: PontoSerie[]) => {
    for (let i = pontos.length - 1; i >= 0; i -= 1) {
      if (pontos[i].value !== null) return pontos[i].value;
    }
    return null;
  };

  const fluxos: Array<[string, string, Map<string, number>]> = [
    ["cadastros", "Cadastros", cadastros],
    ["receitaBrutaCents", "Receita bruta", receita],
    ["custoIaUsd", "Custo de IA (US$)", custoIa],
    ["chamadasSemCustoMedido", "Chamadas sem custo medido", semCusto],
  ];

  const series: SerieNomeada[] = fluxos.map(([chave, rotulo, mapa]) => {
    const pontos = montarFluxo(dias, mapa, hoje);
    return {
      chave,
      rotulo,
      tipo: "fluxo" as const,
      direcao: DIRECOES[chave] ?? "up_bom",
      pontos,
      total: somar(pontos),
    };
  });

  const mapasDePagamento: Array<[string, string, Map<string, number>]> = [
    [
      "primeiroPagamentoObservado",
      "Primeiro pagamento observado",
      porClassificacao("first_observed"),
    ],
    [
      "pagamentosPosteriores",
      "Pagamentos posteriores",
      porClassificacao("subsequent_observed"),
    ],
    [
      "pagamentosSemClassificacao",
      "Sem pessoa identificada",
      porClassificacao("unclassified"),
    ],
    [
      "pagamentosOrdemIncerta",
      "Ordem histórica incerta",
      porClassificacao("order_uncertain"),
    ],
  ];
  const seriesDePagamentos: SerieNomeada[] = mapasDePagamento.map(
    ([chave, rotulo, mapa]) => {
      const pontos = montarFluxo(dias, mapa, hoje);
      return {
        chave,
        rotulo,
        tipo: "fluxo",
        direcao: DIRECOES[chave] ?? "up_bom",
        pontos,
        total: somar(pontos),
      };
    },
  );

  for (const [chave, rotulo, campo] of [
    ["mrrCents", "MRR", "mrr_cents"],
    ["assinantesAtivos", "Assinantes ativos", "active_count"],
  ] as Array<[string, string, "mrr_cents" | "active_count"]>) {
    const pontos = estoque(campo);
    series.push({
      chave,
      rotulo,
      tipo: "estoque",
      direcao: DIRECOES[chave] ?? "up_bom",
      pontos,
      total: ultimoMedido(pontos),
    });
  }

  // --- FUNIL ---------------------------------------------------------------
  const atual = contarCoortePaga({
    pessoas: perfis.filter((p) => naJanela(p.created_at)),
    pagamentos: pagamentosClassificados.payments,
    logs,
    cutoff: janela.endIso,
  });
  const funil = montarFunilDeCoorte({
    ...atual,
    limiteTemporalDosInicios: janela.endIso,
    consultaIniciadaEm,
    consultaConcluidaEm,
  });

  // --- FERRAMENTAS ---------------------------------------------------------
  const porFerramenta = new Map<string, UsoPorFerramenta>();
  for (const { log: l, custo } of logsComCusto) {
    const atualF = porFerramenta.get(l.tool) ?? {
      tool: l.tool,
      chamadas: 0,
      custoUsd: 0,
      semCustoMedido: 0,
    };
    atualF.chamadas += 1;
    atualF.custoUsd += custo.custoMedido;
    if (custo.semCustoMedido) {
      atualF.semCustoMedido += 1;
    }
    porFerramenta.set(l.tool, atualF);
  }

  const ultimo = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  const contarDimensao = <T extends string>(valores: T[]) => {
    const counts = new Map<T, number>();
    for (const valor of valores)
      counts.set(valor, (counts.get(valor) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([rotulo, pagamentos]) => ({ rotulo, pagamentos }))
      .sort(
        (a, b) =>
          b.pagamentos - a.pagamentos || a.rotulo.localeCompare(b.rotulo),
      );
  };
  const porMeio = contarDimensao(pagamentosNaJanela.map((p) => p.method));
  const porProvider = contarDimensao(
    pagamentosNaJanela.map((p) => p.provider),
  ).map(({ rotulo, pagamentos }) => ({ provider: rotulo, pagamentos }));
  const conflitosComDataCandidataNaJanela =
    pagamentosClassificados.conflicts.filter((conflict) =>
      conflict.candidateOccurredAt.some((instant) => naJanela(instant)),
    ).length;

  return {
    contractVersion: OVERVIEW_PAYMENTS_CONTRACT_VERSION,
    series,
    pagamentos: {
      series: seriesDePagamentos,
      pagamentosUtilizaveisNoPeriodo: pagamentosNaJanela.length,
      pessoasIdentificadas: new Set(
        pagamentosNaJanela
          .map((p) => p.userId)
          .filter((id): id is string => Boolean(id)),
      ).size,
      semPessoaNoPeriodo: pagamentosNaJanela.filter((p) => !p.userId).length,
      ordemHistoricaIncertaNoPeriodo: pagamentosNaJanela.filter(
        (p) => p.classification === "order_uncertain",
      ).length,
      identidadesConflitantesNoHistorico:
        pagamentosClassificados.conflicts.length,
      identidadesConflitantesComDataCandidataNoPeriodo:
        conflitosComDataCandidataNaJanela,
      porMeio,
      porProvider,
      cobertura: pagamentosClassificados.coverage,
      ressalvaHistorica:
        "Primeiro observado no histórico local não comprova que seja o primeiro pagamento da vida da pessoa.",
    },
    funil,
    ferramentas: Array.from(porFerramenta.values()).sort(
      (a, b) => b.chamadas - a.chamadas,
    ),
    frescorDoSnapshot: calcularFrescor(ultimo?.snapshot_date ?? null, agora),
    semFonteLocal: [
      {
        chave: "chargesFalhadasPorDia",
        motivo:
          "só existe na Stripe: billing_failed_payments não tem escritor nesta base, e a regra desta fase é não chamar a Stripe em request-time. O contador agregado segue no painel de atenção, atrás da interface que sai quando a branch de billing mergear.",
      },
      {
        chave: "aquisicaoPorCanal",
        motivo:
          "nenhuma coluna de UTM, referrer ou canal existe em profiles ou subscriptions (varredura do information_schema em 2026-08-14). Instrumentação é frente futura.",
      },
    ],
  };
}
