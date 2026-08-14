import {
  diaBrasilia,
  inicioDoDiaBrasilia,
  somarDiaCivil,
} from "../../shared/brasiliaDay";
import type { Janela } from "./overviewWindow";
import { coletarTudo } from "./paginate";
import { supabaseAdmin } from "./supabaseAdmin";

// SERIES DIARIAS, FUNIL E UNIT ECONOMICS DA VISAO (Fase 4).
//
// TUDO DE TABELA LOCAL. Nenhuma chamada a Stripe em request-time: a Visao e a
// primeira tela que o admin abre, e pendurar a latencia de uma API externa em
// cada carga e o caminho para alguem parar de abrir. A unica leitura de Stripe
// que sobrevive na aba e a de cobrancas falhadas no painel de atencao, que ja
// existia atras de uma interface e sai quando a branch de billing mergear.
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
  conversoesPro: "up_bom",
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
    // Para-quedas: janela absurda nao pode virar laco infinito nem 100k pontos.
    if (dias.length > 800) break;
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
  chave: "cadastro" | "ativacao" | "pro";
  rotulo: string;
  valor: number;
  /** Taxa sobre o passo ANTERIOR. `null` no primeiro e quando o denominador e 0. */
  taxaSobreAnterior: number | null;
};

export type Funil = {
  passos: PassoDoFunil[];
  /** Chave do passo com a PIOR transicao. `null` quando nao ha transicao medivel. */
  destaque: string | null;
  /** Contagens da janela anterior, como informacao. NAO viram delta. Ver abaixo. */
  anterior: { cadastro: number; ativacao: number; pro: number } | null;
  /**
   * Por que nao ha delta de taxa entre janelas. Ver o bloco de comentario de
   * `montarFunil` — nao e ausencia de dado, e recusa de exibir um numero
   * enviesado por construcao.
   */
  motivoSemDelta: "coortes_de_maturidade_diferente";
};

/**
 * O FUNIL E DE COORTE, e o comeco e o CADASTRO.
 *
 * NAO comeca em visitantes: nao existe fonte local de visitante. A unica que
 * havia era o PostHog, que o proprio funil antigo declarava incompleto
 * (`assinantesSemRastro` existe porque bloqueador de script derruba o rastro), e
 * a regra desta fase e serie de tabela local.
 *
 * OS PASSOS SAO SUBCONJUNTOS ANINHADOS das MESMAS pessoas: de quem se cadastrou
 * na janela, quantas ja usaram alguma ferramenta de IA, e quantas ja tem linha
 * em `subscriptions`. Aninhados de proposito: assim a taxa nunca passa de 100% e
 * "taxa entre passos adjacentes" quer dizer alguma coisa. Um funil de atividade
 * na janela (nao aninhado) permitiria conversao maior que o topo.
 *
 * ATIVACAO = ao menos uma linha em `ai_usage_logs`. Medido em 2026-08-14: 2.347
 * linhas, 175 usuarios distintos, desde 2026-05-09, e ela cobre LinkedIn,
 * curriculo, roadmap, GitHub, entrevista, plano de carreira e o agente. E a
 * unica tabela local que registra "usou o produto" de forma transversal.
 *
 * POR QUE NAO HA DELTA DE TAXA CONTRA A JANELA ANTERIOR, e esta e a parte que
 * diverge do que a fase pediu. As duas coortes tem MATURIDADES diferentes: quem
 * se cadastrou ontem teve um dia para ativar, quem se cadastrou ha 45 dias teve
 * 45. O delta seria negativo por construcao, todo dia, sem nada ter piorado.
 *
 * Medido em 2026-08-14 08:28 UTC, janela de 30 dias:
 *
 *   sem piso de maturidade   atual 4.807 -> 134 -> 76   |  anterior 619 -> 31 -> 25
 *                            ativacao 2,79% vs 5,01%, Pro 56,7% vs 80,6%
 *   com piso de 7 dias       atual 3.940 -> 137 -> 87   |  anterior 10 -> 2 -> 1
 *
 * A primeira compara coortes de maturidade diferente; a segunda deixa o
 * denominador anterior em DEZ pessoas, que e ruido. Nenhuma das duas sustenta um
 * delta, entao o campo nao existe: `motivoSemDelta` diz por que, no mesmo espirito
 * dos `motivo` de `calcularVariacao`. As contagens anteriores voltam como
 * informacao, sem virar percentual comparado.
 *
 * DESTAQUE DETERMINISTICO: a transicao de MENOR TAXA ABSOLUTA. A regra pedida
 * (maior queda contra a janela anterior) depende justamente do delta que nao
 * existe; o desempate previsto virou o criterio principal, e continua sendo uma
 * regra fixa escrita aqui, nao um texto gerado.
 */
export function montarFunilDeCoorte(input: {
  cadastro: number;
  ativacao: number;
  pro: number;
  anterior: { cadastro: number; ativacao: number; pro: number } | null;
}): Funil {
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
      chave: "ativacao",
      rotulo: "Já usaram alguma ferramenta",
      valor: input.ativacao,
      taxaSobreAnterior: taxa(input.ativacao, input.cadastro),
    },
    {
      chave: "pro",
      rotulo: "Já assinaram Pro",
      valor: input.pro,
      taxaSobreAnterior: taxa(input.pro, input.ativacao),
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
    anterior: input.anterior,
    motivoSemDelta: "coortes_de_maturidade_diferente",
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
  series: SerieNomeada[];
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
  const anteriorInicio = janela.previousStartIso;
  const anteriorFim = janela.previousEndIso;

  const [perfis, transacoes, assinaturas, logs, snapshots] = await Promise.all([
    coletarTudo<{ user_id: string; created_at: string }>(
      (from, to) =>
        supabaseAdmin
          .from("profiles")
          .select("user_id, created_at")
          .gte("created_at", anteriorInicio ?? desdeIso)
          .order("user_id", { ascending: true })
          .range(from, to),
      "series profiles",
    ),
    coletarTudo<{ type: string; gross_cents: number; occurred_at: string }>(
      (from, to) =>
        supabaseAdmin
          .from("finance_transactions")
          .select("type, gross_cents, occurred_at")
          .gte("occurred_at", desdeIso)
          .order("id", { ascending: true })
          .range(from, to),
      "series finance",
    ),
    coletarTudo<{ user_id: string | null; created_at: string }>(
      (from, to) =>
        supabaseAdmin
          .from("subscriptions")
          .select("user_id, created_at")
          .order("id", { ascending: true })
          .range(from, to),
      "series subscriptions",
    ),
    coletarTudo<{
      user_id: string | null;
      tool: string;
      status: string | null;
      cost_estimate: string | null;
      created_at: string;
    }>(
      (from, to) =>
        supabaseAdmin
          .from("ai_usage_logs")
          .select("user_id, tool, status, cost_estimate, created_at")
          .gte("created_at", desdeIso)
          .order("id", { ascending: true })
          .range(from, to),
      "series ai",
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

  const primeiroPerfil =
    perfis.length > 0 ? diaBrasilia(perfis[0].created_at) : null;
  const dias = diasDaJanela(janela, primeiroPerfil ?? hoje);

  // --- FLUXOS -------------------------------------------------------------
  //
  // UM SO criterio de pertinencia, usado pelas series E pelo funil. A primeira
  // versao tinha dois: a serie olhava so o limite inferior e o funil olhava os
  // dois, entao uma linha com carimbo no FUTURO (relogio torto, backfill,
  // fixture de teste) entrava na serie e ficava fora do funil. Dois criterios
  // para a mesma janela e a divergencia de 182 cadastros em miniatura.
  const naJanela = (iso: string) =>
    (!janela.startIso || iso >= janela.startIso) && iso <= janela.endIso;

  const cadastros = agrupar(
    perfis
      .filter((p) => naJanela(p.created_at))
      .map((p) => ({ quando: p.created_at })),
  );
  const receita = agrupar(
    transacoes
      .filter((t) => t.type === "charge")
      .map((t) => ({ quando: t.occurred_at, peso: t.gross_cents })),
  );
  // CONVERSAO PRO: a PRIMEIRA linha de `subscriptions` do usuario, pelo dia
  // civil de `created_at`. A linha so nasce em pagamento confirmado (cartao via
  // checkout.session.completed, boleto via async_payment_succeeded), e medido em
  // 2026-08-14 NENHUM usuario tem mais de uma linha, entao "primeira" e
  // "unica" hoje — o `Set` existe para o dia em que deixar de ser.
  const jaContado = new Set<string>();
  const conversoes = agrupar(
    assinaturas
      .filter((s) => {
        if (!s.user_id || jaContado.has(s.user_id)) return false;
        jaContado.add(s.user_id);
        return naJanela(s.created_at);
      })
      .map((s) => ({ quando: s.created_at })),
  );
  const custoIa = agrupar(
    logs.map((l) => {
      const c = Number.parseFloat(l.cost_estimate || "0");
      return { quando: l.created_at, peso: Number.isFinite(c) ? c : 0 };
    }),
  );
  const semCusto = agrupar(
    logs
      .filter((l) => {
        const c = Number.parseFloat(l.cost_estimate || "0");
        return l.status === "success" && (!Number.isFinite(c) || c === 0);
      })
      .map((l) => ({ quando: l.created_at })),
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
    ["conversoesPro", "Conversões Pro", conversoes],
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
  const usuariosAtivados = new Set(
    logs.map((l) => l.user_id).filter((u): u is string => Boolean(u)),
  );
  const usuariosPro = new Set(
    assinaturas.map((s) => s.user_id).filter((u): u is string => Boolean(u)),
  );
  const coorte = (de: string | null, ate: string | null) =>
    perfis.filter(
      (p) => (!de || p.created_at >= de) && (!ate || p.created_at <= ate),
    );
  // A coorte da janela ATUAL usa exatamente o mesmo `naJanela` das series.
  const contar = (linhas: typeof perfis) => ({
    cadastro: linhas.length,
    ativacao: linhas.filter((p) => usuariosAtivados.has(p.user_id)).length,
    pro: linhas.filter((p) => usuariosPro.has(p.user_id)).length,
  });
  const atual = contar(perfis.filter((p) => naJanela(p.created_at)));
  const anterior =
    anteriorInicio && anteriorFim
      ? contar(coorte(anteriorInicio, anteriorFim))
      : null;
  const funil = montarFunilDeCoorte({ ...atual, anterior });

  // --- FERRAMENTAS ---------------------------------------------------------
  const porFerramenta = new Map<string, UsoPorFerramenta>();
  for (const l of logs) {
    const atualF = porFerramenta.get(l.tool) ?? {
      tool: l.tool,
      chamadas: 0,
      custoUsd: 0,
      semCustoMedido: 0,
    };
    atualF.chamadas += 1;
    const c = Number.parseFloat(l.cost_estimate || "0");
    if (Number.isFinite(c)) atualF.custoUsd += c;
    if (l.status === "success" && (!Number.isFinite(c) || c === 0)) {
      atualF.semCustoMedido += 1;
    }
    porFerramenta.set(l.tool, atualF);
  }

  const ultimo = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  return {
    series,
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
