import {
  diaBrasilia,
  inicioDoDiaBrasilia,
  somarDiaCivil,
} from "../../shared/brasiliaDay";
import { monthlyEquivalentCents } from "./billingMetrics";
import { coletarTudo } from "./paginate";
import { resolvePlanPriceCents } from "./planPrice";
import { getStripe } from "./stripeClient";
import { supabaseAdmin } from "./supabaseAdmin";

// PAINEL "ATENCAO NECESSARIA".
//
// Substitui "Eventos recentes", que mostrava as 10 ultimas linhas de
// `content_audit_logs` — historico de edicao de conteudo, nao decisao. O bloco
// mais visivel da Visao era o unico sobre o qual nao havia nada a fazer.
//
// PRINCIPIO, e ele governa o que pode ou nao virar item aqui:
//
//   TODO ITEM PRECISA DE CONDICAO NATURAL DE RESOLUCAO.
//
// "Natural" quer dizer que o item SOME quando o mundo muda, sem ninguem clicar
// em nada. Nao ha ack manual na v1, e a ausencia dele e deliberada: ack e uma
// tabela, uma migration e um estado novo para manter, e sobretudo e a porta de
// entrada do painel que ninguem le, porque quem marca como visto uma vez marca
// sempre. Item que so sai por clique nao entra.
//
// A conferencia, item a item:
//
//   past_due            sai quando a Stripe muda o status (pagou, ou cancelou).
//   saida agendada      sai quando a assinatura termina ou e reativada.
//   cobrancas falhadas  saem da janela sozinhas, porque a janela desliza.
//   orfaos              saem quando a assinatura na Stripe morre (sem cobranca
//                       futura) ou quando a linha local aparece. E por isso que
//                       o orfao do dossie (`sub_1Tv4SX...`, `cancel_at` em
//                       2026-08-19) some sozinho depois daquela data, sem
//                       ninguem tocar em nada.
//   spike de custo IA   e sobre O DIA CIVIL de hoje; amanha o dia e outro.
//   payout falho        sai da JANELA sozinho, como as cobrancas falhadas. A
//                       janela nao e enfeite aqui: na Stripe um payout `failed`
//                       fica `failed` para sempre, entao SEM janela o item nao
//                       teria condicao natural nenhuma e viraria exatamente o
//                       alerta permanente que este principio proibe.
//   mes sem despesa     sai de dois jeitos, e os dois sao o mundo mudando:
//                       alguem registra a despesa retroativa daquele mes, ou o
//                       mes civil vira e a janela anda sozinha.
//   influencer com      sai quando o admin revoga a concessao (a acao que o
//   assinatura          item sugere, e que ele ja faria) ou quando a assinatura
//                       cai. Nos dois casos some sem ninguem marcar nada.
//
// O QUE NAO ENTRA, e o motivo: a FILA BullMQ. O acesso existe e funciona
// (`emailQueue.getFailedCount()` com teto de tempo, ja usado pela faixa de
// saude), mas ela JA e exibida no `HealthBand`, no topo da mesma tela. Repetir
// aqui seria ruido, e painel de alerta com ruido conhecido dentro e painel que
// alguem desliga. Se um dia sair da faixa, entra aqui.

export type SeveridadeAtencao = "critico" | "atencao";

export type ItemAtencao = {
  /** Familia do item, para agrupar e para o teste afirmar o conjunto. */
  tipo:
    | "assinatura_past_due"
    | "saida_agendada"
    | "cobrancas_falhadas"
    | "pagamento_orfao"
    | "custo_ia_spike"
    | "payout_falho"
    | "mes_sem_despesa"
    | "influencer_com_assinatura";
  /** Identidade estavel do item entre execucoes. Dois itens iguais colidem. */
  chave: string;
  severidade: SeveridadeAtencao;
  titulo: string;
  detalhe: string;
  /**
   * Valor NOMINAL do contrato (o preco cheio do plano: R$ 222,00 no anual). E o
   * que a pessoa pagou, e continua sendo o numero certo para "quanto vale este
   * cliente".
   */
  valorCents?: number;
  /**
   * O MESMO valor normalizado para o equivalente MENSAL, pela MESMA
   * `monthlyEquivalentCents` que produz o MRR. Existe porque somar valores
   * nominais de ciclos diferentes nao da receita nenhuma: R$ 222,00/ano com
   * R$ 129,00/semestre da R$ 351,00 de coisa alguma. Esta e a soma que o card
   * "Receita em risco" exibe, e e por dividir a mesma funcao que as duas telas
   * nao podem divergir (D21).
   *
   * Ausente quando o item nao tem plano com ciclo (cobranca falhada, pagamento
   * orfao, spike de custo). Ausencia, nunca zero.
   */
  mrrMensalCents?: number;
  /**
   * Contagem e janela do item AGREGADO, para o resumo poder dizer "24 cobrancas
   * nos ultimos 7 dias" sem reparsear o titulo. Ausente nos itens unitarios.
   */
  agregado?: { quantidade: number; janelaDias: number };
  /** Para onde ir para agir FORA daqui. Hoje, sempre a Stripe. Pode ser vazio. */
  url: string;
  /**
   * Destino DENTRO do admin (`/admin?section=...`).
   *
   * Existe porque `url` sozinha mandava embora: todo item levava para o painel
   * da Stripe, inclusive os que se resolvem aqui mesmo (past_due e saida
   * agendada se olham na aba de usuarios). O client renderiza este como acao
   * PRIMARIA e a Stripe como secundaria, quando as duas existem.
   *
   * Opcional no tipo por causa da janela de deploy: o bundle novo le de um
   * backend que pode ser o antigo por alguns minutos, e ausencia tem de
   * degradar para "sem botao interno", nunca para erro.
   */
  destinoInterno?: string;
  /**
   * Codigo do motivo declarado no cancelamento (`subscription_cancellations`),
   * so na saida agendada e so quando a pessoa declarou algum.
   *
   * CODIGO CRU, nao rotulo. Quem traduz e o client, com o
   * `cancellationReasonLabelOf` que ja existe e ja tem fallback: duplicar o mapa
   * de rotulos aqui criaria duas listas escritas a mao sobre o mesmo conjunto, e
   * a segunda ficaria para tras no primeiro motivo novo, em silencio.
   */
  motivoCodigo?: string;
};

export type PainelDeAtencao = {
  itens: ItemAtencao[];
  /**
   * Fontes que NAO responderam. Vem separado dos itens de proposito: painel
   * vazio por tudo em ordem e painel vazio por fonte fora do ar sao estados
   * opostos, e um "Tudo em ordem" sobre uma sonda quebrada e mentira.
   */
  fontesIndisponiveis: string[];
  /** Janela usada nos itens que tem janela (hoje: cobrancas falhadas). */
  janelaDias: number;
};

const STRIPE_SUB_URL = "https://dashboard.stripe.com/subscriptions/";
const STRIPE_PAYOUTS_URL = "https://dashboard.stripe.com/payouts";

// Destinos DENTRO do admin. Slugs conferidos contra `adminNavItems` em
// `client/src/pages/Admin.tsx`: um slug que nao existe la cai em "visao-geral"
// pelo `sectionFromSearch`, ou seja, o link degrada em vez de quebrar, mas
// tambem nao leva a lugar nenhum util. Sao constantes, e nao literais soltos,
// para o teste de conjunto poder afirmar todos de uma vez.
const ADMIN_USUARIOS = "/admin?section=usuarios";
const ADMIN_FINANCEIRO = "/admin?section=financeiro";

/** Janela do payout falho. Ver o principio na docstring do topo. */
export const PAYOUT_JANELA_DIAS = 14;

export type FonteDePayoutsFalhos = {
  listar(
    desde: Date,
  ): Promise<Array<{ id: string; amountCents: number; criadoEm: Date }> | null>;
};

/**
 * Payouts FALHOS na janela, direto da Stripe.
 *
 * Injetavel pelo mesmo motivo que `FonteDeCobrancasFalhadas`: o teste nao fala
 * com a rede, e a filtragem por janela precisa ser exercitada com um payout
 * dentro e um fora.
 *
 * `status: "failed"` vai na QUERY, nao num filtro depois: o proprio endpoint da
 * Stripe aceita, e trazer todos para descartar em memoria seria paginar o
 * historico inteiro de repasses para achar os poucos que interessam.
 */
export const payoutsFalhosDaStripe: FonteDePayoutsFalhos = {
  async listar(desde) {
    try {
      const achados: Array<{
        id: string;
        amountCents: number;
        criadoEm: Date;
      }> = [];
      for await (const payout of getStripe().payouts.list({
        limit: 100,
        status: "failed",
        created: { gte: Math.floor(desde.getTime() / 1000) },
      })) {
        achados.push({
          id: payout.id,
          amountCents: payout.amount ?? 0,
          criadoEm: new Date((payout.created ?? 0) * 1000),
        });
      }
      return achados;
    } catch (err) {
      console.warn(
        "[atencao] falha ao listar payouts da Stripe:",
        err instanceof Error ? err.message : String(err),
      );
      return null;
    }
  },
};

/**
 * Primeiro dia (civil, Brasilia) do mes ANTERIOR e do mes atual, em `YYYY-MM-DD`.
 *
 * Strings e nao `Date` porque `expenses.incurred_on` e uma coluna DATE: comparar
 * data com timestamp faz o Postgres converter, e a conversao usa UTC, o que
 * moveria a fronteira do mes em tres horas e colocaria a despesa do dia 1 as 00h
 * de Brasilia no mes errado.
 */
export function fronteirasDoMesAnterior(agora: Date): {
  inicio: string;
  fim: string;
  rotulo: string;
} {
  const hoje = diaBrasilia(agora.toISOString());
  const [anoStr, mesStr] = (hoje ?? "1970-01-01").split("-");
  const ano = Number(anoStr);
  const mes = Number(mesStr);
  const anoAnterior = mes === 1 ? ano - 1 : ano;
  const mesAnterior = mes === 1 ? 12 : mes - 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    inicio: `${anoAnterior}-${pad(mesAnterior)}-01`,
    fim: `${ano}-${pad(mes)}-01`,
    rotulo: `${pad(mesAnterior)}/${anoAnterior}`,
  };
}

type PlanoDoItem = {
  code: string | null;
  price_cents: number | null;
  interval?: string | null;
};

/**
 * Equivalente mensal do plano, ou `null` quando nao da para saber.
 *
 * DELEGA a `monthlyEquivalentCents` de `billingMetrics.ts`, que e a mesma que
 * produz o MRR e o card de receita em risco. Nao ha aritmetica aqui de
 * proposito: a divisao por ciclo existe em UM lugar nesta base, e este arquivo
 * so a chama.
 *
 * NAO LANCA, e a diferenca importa. No MRR, interval desconhecido e erro: um MRR
 * silenciosamente menor e invisivel. Aqui o resultado e uma LINHA A MAIS num
 * painel de alerta, e derrubar o painel inteiro (junto com os itens criticos que
 * ele ja tinha) por causa de um plano com ciclo estranho seria trocar uma linha
 * faltando por uma tela em branco. O valor nominal continua exibido; so a
 * normalizacao some, declaradamente ausente.
 */
function mensalDoPlano(
  plano: PlanoDoItem | null | undefined,
  valorCents: number,
): number | null {
  const interval = plano?.interval;
  if (typeof interval !== "string" || interval.length === 0) return null;
  try {
    return monthlyEquivalentCents(valorCents, interval);
  } catch (err) {
    console.warn(
      "[atencao] plano sem ciclo normalizavel:",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

/**
 * Fonte das cobrancas falhadas, atras de uma interface.
 *
 * Hoje le a Stripe direto. Quando `fix/billing-customer-reuse` mergear, a tabela
 * `billing_failed_payments` passa a existir com escritor, e trocar a fonte vira
 * uma linha — sem tocar no painel nem nos testes dele. A interface existe por
 * isso, e nao por generalidade: e a unica fonte deste arquivo que se sabe que
 * vai mudar.
 */
export type FonteDeCobrancasFalhadas = {
  contar(
    desde: Date,
    ate: Date,
  ): Promise<{ count: number; cents: number } | null>;
};

export const cobrancasFalhadasDaStripe: FonteDeCobrancasFalhadas = {
  async contar(desde, ate) {
    try {
      let count = 0;
      let cents = 0;
      for await (const charge of getStripe().charges.list({
        limit: 100,
        created: {
          gte: Math.floor(desde.getTime() / 1000),
          lte: Math.floor(ate.getTime() / 1000),
        },
      })) {
        if (charge.status !== "failed") continue;
        count += 1;
        cents += charge.amount ?? 0;
      }
      return { count, cents };
    } catch (err) {
      console.warn(
        "[atencao] falha ao listar cobrancas da Stripe:",
        err instanceof Error ? err.message : String(err),
      );
      return null;
    }
  },
};

/**
 * Uma assinatura orfa ainda PEDE acao?
 *
 * Sim enquanto houver assinatura viva ou cobranca futura. `canceled`/`ended`
 * viram historico: o dinheiro ja entrou, nao entra mais, e nao ha acesso a
 * conceder para quem nao existe. Manter no painel viraria um item permanente.
 *
 * Chave `cs_...` (boleto avulso) nao tem Subscription na Stripe para consultar:
 * ela continua acionavel enquanto a linha local nao aparecer, que e a propria
 * condicao que a detectou.
 */
async function orfaoAindaPedeAcao(chaveEsperada: string): Promise<boolean> {
  if (!chaveEsperada.startsWith("sub_")) return true;
  try {
    const sub = await getStripe().subscriptions.retrieve(chaveEsperada);
    if (
      !sub ||
      sub.status === "canceled" ||
      sub.status === "incomplete_expired"
    )
      return false;
    if (sub.ended_at) return false;
    return true;
  } catch (err) {
    // Nao conseguir ler NAO vira "resolvido": erra para o lado de pedir
    // atencao, como em orphanPayments.ts.
    console.warn(
      `[atencao] nao consegui ler a assinatura ${chaveEsperada}:`,
      err instanceof Error ? err.message : String(err),
    );
    return true;
  }
}

/**
 * LIMIAR DO SPIKE DE CUSTO DE IA, e as duas metades sao necessarias.
 *
 * `> 3x a mediana dos 14 dias civis anteriores` pega a forma (mediana, e nao
 * media, para um unico dia caro nao elevar o proprio limiar).
 *
 * `>= PISO` existe porque a base e pequena: medido em 2026-08-14, o custo de 30
 * dias inteiros foi US$ 2,41 sobre 2.115 chamadas, ou seja ~US$ 0,08 por dia.
 * Sem piso, um dia de US$ 0,25 dispararia "3x a mediana" e o painel gritaria
 * sobre 17 centavos. O piso de US$ 0,50 e ~6x a media diaria de hoje: alto o
 * bastante para nao ser ruido, baixo o bastante para pegar um loop de chamada.
 *
 * O PISO E CALIBRADO PARA O VOLUME DE HOJE e vai ficar velho: quando o custo
 * diario normal se aproximar dele, o alerta para de valer. E numero de
 * medicao, com data, nao constante universal.
 */
export const SPIKE_MULTIPLICADOR = 3;
export const SPIKE_PISO_USD = 0.5;
const SPIKE_DIAS_DE_BASE = 14;

function mediana(valores: number[]): number {
  if (valores.length === 0) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 === 0
    ? (ordenados[meio - 1] + ordenados[meio]) / 2
    : ordenados[meio];
}

/** Custo por dia civil de Brasilia, dos ultimos `dias` dias, incluindo hoje. */
async function custoDeIaPorDiaCivil(
  agora: Date,
  dias: number,
): Promise<Map<string, number> | null> {
  const hoje = diaBrasilia(agora.toISOString());
  if (!hoje) return null;
  const primeiro = somarDiaCivil(hoje, -(dias - 1));
  try {
    const linhas = await coletarTudo<{
      created_at: string;
      cost_estimate: string | null;
    }>(
      (from, to) =>
        supabaseAdmin
          .from("ai_usage_logs")
          .select("created_at, cost_estimate")
          .gte("created_at", inicioDoDiaBrasilia(primeiro))
          .order("id", { ascending: true })
          .range(from, to),
      "atencao ai spike",
    );
    const porDia = new Map<string, number>();
    for (let d = primeiro; d <= hoje; d = somarDiaCivil(d)) porDia.set(d, 0);
    for (const l of linhas) {
      const dia = diaBrasilia(l.created_at);
      if (!dia || !porDia.has(dia)) continue;
      const custo = Number.parseFloat(l.cost_estimate || "0");
      if (Number.isFinite(custo))
        porDia.set(dia, (porDia.get(dia) ?? 0) + custo);
    }
    return porDia;
  } catch (err) {
    console.warn(
      "[atencao] falha ao ler custo de IA:",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

function reais(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Motivo declarado por assinatura com saida agendada, indexado pelo id da
 * Stripe. Mapa VAZIO quando a consulta falha, nunca excecao: o motivo enriquece
 * o item, e trocar um painel inteiro por uma tela de erro para nao mostrar uma
 * frase a mais seria o inverso do proposito do painel.
 */
async function motivosDeSaidaAgendada(): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  try {
    const { data, error } = await supabaseAdmin
      .from("subscription_cancellations")
      .select("provider_subscription_id, reason_code")
      .eq("status", "scheduled")
      .not("reason_code", "is", null);
    if (error) throw error;
    for (const linha of (data ?? []) as Array<{
      provider_subscription_id: string | null;
      reason_code: string | null;
    }>) {
      if (linha.provider_subscription_id && linha.reason_code) {
        mapa.set(linha.provider_subscription_id, linha.reason_code);
      }
    }
  } catch (err) {
    console.warn(
      "[atencao] falha ao ler motivos de cancelamento:",
      err instanceof Error ? err.message : String(err),
    );
  }
  return mapa;
}

export async function montarPainelDeAtencao(
  opcoes: {
    agora?: Date;
    janelaDias?: number;
    fonteDeCobrancasFalhadas?: FonteDeCobrancasFalhadas;
    fonteDePayoutsFalhos?: FonteDePayoutsFalhos;
  } = {},
): Promise<PainelDeAtencao> {
  const agora = opcoes.agora ?? new Date();
  const janelaDias = opcoes.janelaDias ?? 7;
  const fonteFalhadas =
    opcoes.fonteDeCobrancasFalhadas ?? cobrancasFalhadasDaStripe;
  const fontePayouts = opcoes.fonteDePayoutsFalhos ?? payoutsFalhosDaStripe;

  const itens: ItemAtencao[] = [];
  const fontesIndisponiveis: string[] = [];

  /**
   * Itens que dependem de saber QUEM e a pessoa, guardados ate a resolucao dos
   * e-mails.
   *
   * Por que adiar em vez de consultar o perfil na hora: os e-mails saem de UMA
   * consulta a `profiles` para todos os user_ids do painel (assinaturas mais a
   * ponte de influencer), e essa consulta so pode acontecer depois que os dois
   * blocos disserem de quem precisam. Consultar dentro do laco daria o mesmo
   * resultado na tela e um N+1 no banco.
   */
  type PendenteDeAssinatura = {
    tipo: "assinatura_past_due" | "saida_agendada";
    userId: string | null;
    chave: string;
    severidade: SeveridadeAtencao;
    valorCents: number;
    mrrMensalCents: number | null;
    url: string;
    fim?: string;
    motivoCodigo?: string;
  };
  const pendentesDeAssinatura: PendenteDeAssinatura[] = [];
  const pontesDeInfluencer: string[] = [];
  const idsParaEmail = new Set<string>();

  // ------------------------------------------------------------------
  // 1 e 2: assinaturas que pedem acao (past_due e saida agendada)
  // ------------------------------------------------------------------
  type LinhaSub = {
    id: string;
    user_id: string | null;
    status: string;
    cancel_at_period_end: boolean | null;
    current_period_end: string | null;
    provider_subscription_id: string | null;
    // O PostgREST devolve o relacionamento ora como objeto, ora como array.
    plans: PlanoDoItem | Array<PlanoDoItem> | null;
  };
  try {
    const subs = (await coletarTudo<LinhaSub>(
      (from, to) =>
        // O `as never` no fim: o builder do PostgREST nao infere o tipo do
        // embed `plans(...)`, e o mesmo padrao usado em billingMetrics.ts.
        supabaseAdmin
          .from("subscriptions")
          .select(
            "id, user_id, status, cancel_at_period_end, current_period_end, provider_subscription_id, plans(code, price_cents, interval)",
          )
          .in("status", ["active", "trialing", "past_due"])
          .order("id", { ascending: true })
          .range(from, to) as never,
      "atencao subscriptions",
    )) as LinhaSub[];

    // MOTIVO da saida, quando a pessoa declarou um. Uma consulta para todas as
    // linhas, e nao uma por assinatura: sao poucas saidas agendadas, mas o
    // padrao de consultar dentro do laco e o que transforma um painel em N+1.
    //
    // Falha aqui NAO derruba as assinaturas: o motivo e enriquecimento, e um
    // item sem motivo continua sendo o item certo. Mapa vazio e a degradacao.
    const motivoPorSub = await motivosDeSaidaAgendada();

    for (const s of subs) {
      if (s.user_id) idsParaEmail.add(s.user_id);
      const plano = Array.isArray(s.plans) ? s.plans[0] : s.plans;
      const valorCents = resolvePlanPriceCents(
        plano?.code ?? undefined,
        Number(plano?.price_cents ?? 0),
        "atencao-necessaria",
      );
      const mrrMensalCents = mensalDoPlano(plano, valorCents);
      const url = s.provider_subscription_id?.startsWith("sub_")
        ? `${STRIPE_SUB_URL}${s.provider_subscription_id}`
        : "";

      if (s.status === "past_due") {
        pendentesDeAssinatura.push({
          tipo: "assinatura_past_due",
          userId: s.user_id,
          chave: `past_due:${s.id}`,
          severidade: "critico",
          valorCents,
          mrrMensalCents,
          url,
        });
        continue;
      }
      if (s.cancel_at_period_end) {
        const motivoDaSaida = s.provider_subscription_id
          ? motivoPorSub.get(s.provider_subscription_id)
          : undefined;
        const fim = s.current_period_end
          ? new Date(s.current_period_end).toLocaleDateString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })
          : "data desconhecida";
        pendentesDeAssinatura.push({
          tipo: "saida_agendada",
          userId: s.user_id,
          chave: `saida:${s.id}`,
          severidade: "atencao",
          valorCents,
          mrrMensalCents,
          url,
          fim,
          ...(motivoDaSaida ? { motivoCodigo: motivoDaSaida } : {}),
        });
      }
    }
  } catch (err) {
    console.warn(
      "[atencao] falha ao ler assinaturas:",
      err instanceof Error ? err.message : String(err),
    );
    fontesIndisponiveis.push("assinaturas");
  }

  // ------------------------------------------------------------------
  // 3: cobrancas falhadas na janela (UM item agregado, nao um por cobranca)
  //
  // Agregado de proposito: em 30 dias foram 88 falhas contra 90 sucessos
  // (medido em 2026-08-14), e 88 linhas num painel de acao seria a definicao de
  // ruido. O numero e o sinal; quem quiser a lista vai para a Stripe.
  // ------------------------------------------------------------------
  const desde = new Date(agora.getTime() - janelaDias * 24 * 60 * 60 * 1000);
  const falhadas = await fonteFalhadas.contar(desde, agora);
  if (falhadas === null) {
    fontesIndisponiveis.push("cobrancas_falhadas");
  } else if (falhadas.count > 0) {
    itens.push({
      tipo: "cobrancas_falhadas",
      chave: `falhadas:${janelaDias}d`,
      severidade: falhadas.count >= 10 ? "critico" : "atencao",
      titulo: `${falhadas.count} cobranças falharam em ${janelaDias} dias`,
      detalhe: `Somam ${reais(falhadas.cents)} que não entraram. Cartão recusado é o motivo mais comum.`,
      valorCents: falhadas.cents,
      // CONTAGEM E JANELA COMO CAMPOS, nao so dentro do titulo. O painel agrupa
      // por tipo e troca o titulo do servidor pelo rotulo do grupo, e nessa troca
      // os dois numeros sumiram da tela (revisao de 2026-08-16). Reparsear o
      // titulo com regex seria a mesma classe de instrumento que este projeto ja
      // documentou falhando; o dado vem estruturado.
      agregado: { quantidade: falhadas.count, janelaDias },
      url: "https://dashboard.stripe.com/payments?status%5B%5D=failed",
      // A acao e na Stripe MESMO (e la que se ve a cobranca e se cobra de
      // novo); o interno e secundario, so para conferir o efeito no caixa.
      destinoInterno: ADMIN_FINANCEIRO,
    });
  }

  // ------------------------------------------------------------------
  // 4: pagamentos orfaos JA DETECTADOS. So LEITURA.
  //
  // A rota NAO dispara deteccao: quem varre a Stripe e persiste e o cron
  // (`/api/cron/detect-orphan-payments`). Uma rota de painel que escreve seria
  // exatamente o erro de 2026-08-14, quando uma verificacao "somente leitura"
  // gravou em producao porque a funcao chamada persistia.
  // ------------------------------------------------------------------
  try {
    const { data, error } = await supabaseAdmin
      .from("billing_orphan_payments")
      .select(
        "stripe_session_id, expected_provider_subscription_id, customer_email, amount_total_cents, session_created_at",
      )
      .is("resolved_at", null);
    if (error) throw error;

    for (const o of data ?? []) {
      const chaveEsperada = String(o.expected_provider_subscription_id ?? "");
      if (!chaveEsperada) continue;
      if (!(await orfaoAindaPedeAcao(chaveEsperada))) continue;
      itens.push({
        tipo: "pagamento_orfao",
        chave: `orfao:${o.stripe_session_id}`,
        severidade: "critico",
        titulo: "Pagamento sem assinatura no banco",
        detalhe: `A Stripe registrou o pagamento e não existe linha em subscriptions (${chaveEsperada}).`,
        valorCents: o.amount_total_cents ?? undefined,
        url: chaveEsperada.startsWith("sub_")
          ? `${STRIPE_SUB_URL}${chaveEsperada}`
          : `https://dashboard.stripe.com/payments`,
        destinoInterno: ADMIN_FINANCEIRO,
      });
    }
  } catch (err) {
    console.warn(
      "[atencao] falha ao ler orfaos:",
      err instanceof Error ? err.message : String(err),
    );
    fontesIndisponiveis.push("pagamentos_orfaos");
  }

  // ------------------------------------------------------------------
  // 5: spike de custo de IA no dia civil de hoje
  // ------------------------------------------------------------------
  const porDia = await custoDeIaPorDiaCivil(agora, SPIKE_DIAS_DE_BASE + 1);
  if (porDia === null) {
    fontesIndisponiveis.push("custo_ia");
  } else {
    const hoje = diaBrasilia(agora.toISOString())!;
    const custoHoje = porDia.get(hoje) ?? 0;
    const anteriores = Array.from(porDia.entries())
      .filter(([dia]) => dia !== hoje)
      .map(([, v]) => v);
    const base = mediana(anteriores);
    if (custoHoje >= SPIKE_PISO_USD && custoHoje > SPIKE_MULTIPLICADOR * base) {
      itens.push({
        tipo: "custo_ia_spike",
        chave: `spike_ia:${hoje}`,
        severidade: "atencao",
        titulo: "Custo de IA acima do normal hoje",
        detalhe: `US$ ${custoHoje.toFixed(2)} hoje contra uma mediana de US$ ${base.toFixed(2)} nos ${SPIKE_DIAS_DE_BASE} dias anteriores.`,
        url: "",
        destinoInterno: "/admin?section=ia",
      });
    }
  }

  // ------------------------------------------------------------------
  // 6: payouts FALHOS na janela
  //
  // O incidente de 2026-07-24: a tela mostrava lucro e o banco tinha R$ 0. O
  // repasse falhou e nada na plataforma dizia isso, porque a receita e medida na
  // Stripe e o dinheiro chega (ou nao) no banco.
  //
  // UM ITEM POR PAYOUT, e nao agregado como as cobrancas falhadas: payout falho
  // e raro (zero na maioria das janelas) e cada um e um valor grande, entao a
  // lista nao vira ruido e o valor individual e a informacao.
  // ------------------------------------------------------------------
  const desdePayout = new Date(
    agora.getTime() - PAYOUT_JANELA_DIAS * 24 * 60 * 60 * 1000,
  );
  const payouts = await fontePayouts.listar(desdePayout);
  if (payouts === null) {
    fontesIndisponiveis.push("payouts");
  } else {
    for (const payout of payouts) {
      // JANELA CONFERIDA AQUI TAMBEM, e nao so na query. A Stripe filtra por
      // `created`, mas a fonte e injetavel e um dublê (ou uma fonte futura) pode
      // devolver mais do que se pediu; sem esta linha, o item mais antigo virava
      // permanente, que e exatamente o que a janela existe para impedir.
      if (payout.criadoEm.getTime() < desdePayout.getTime()) continue;
      itens.push({
        tipo: "payout_falho",
        chave: `payout:${payout.id}`,
        severidade: "critico",
        titulo: "Repasse para o banco falhou",
        detalhe: `A Stripe não conseguiu transferir ${reais(payout.amountCents)} para a conta bancária. O dinheiro está retido no saldo da Stripe.`,
        valorCents: payout.amountCents,
        url: STRIPE_PAYOUTS_URL,
        destinoInterno: ADMIN_FINANCEIRO,
      });
    }
  }

  // ------------------------------------------------------------------
  // 7: mes civil anterior sem NENHUMA despesa registrada
  //
  // Nao e sobre contabilidade, e sobre o lucro exibido: sem despesa lancada, o
  // financeiro mostra receita como se fosse lucro. Mes fechado com zero linhas e
  // quase sempre esquecimento, nao um mes sem custo.
  // ------------------------------------------------------------------
  const mes = fronteirasDoMesAnterior(agora);
  try {
    const { data, error } = await supabaseAdmin
      .from("expenses")
      .select("id")
      .gte("incurred_on", mes.inicio)
      .lt("incurred_on", mes.fim)
      .limit(1);
    if (error) throw error;
    if ((data ?? []).length === 0) {
      itens.push({
        tipo: "mes_sem_despesa",
        chave: `sem_despesa:${mes.rotulo}`,
        severidade: "atencao",
        titulo: `Nenhuma despesa registrada em ${mes.rotulo}`,
        detalhe:
          "O mês fechou sem nenhuma despesa lançada, então o lucro exibido está contando a receita inteira. Registrar as despesas do mês corrige o número.",
        url: "",
        destinoInterno: ADMIN_FINANCEIRO,
      });
    }
  } catch (err) {
    console.warn(
      "[atencao] falha ao ler despesas:",
      err instanceof Error ? err.message : String(err),
    );
    fontesIndisponiveis.push("despesas");
  }

  // ------------------------------------------------------------------
  // 8: influencer que TAMBEM tem assinatura paga vigente
  //
  // A ponte do boleto cumpriu o papel: a concessao existia para dar Pro a quem
  // ainda nao conseguia pagar, e agora essa pessoa paga. Revogar a concessao NAO
  // tira o acesso, porque `is_user_pro` e um OR e a assinatura segura sozinha.
  //
  // Item de ARRUMACAO, nao de risco: severidade "atencao", e o valor fica de
  // fora de proposito. Somar o plano dessa gente em "receita em risco" seria
  // errado nos dois sentidos: a receita nao esta em risco nenhum, e a concessao
  // nao vale dinheiro.
  // ------------------------------------------------------------------
  try {
    const { data: grants, error: erroGrants } = await supabaseAdmin
      .from("influencers")
      .select("user_id")
      .is("revoked_at", null);
    if (erroGrants) throw erroGrants;
    const idsInfluencer = new Set(
      ((grants ?? []) as Array<{ user_id: string }>).map((g) => g.user_id),
    );

    if (idsInfluencer.size > 0) {
      // MESMO criterio de assinatura vigente que `userSegments.ts` usa para
      // `payingActive`: status pagante e periodo nao vencido. Divergir dele aqui
      // faria o painel discordar do card de acesso Pro sobre a mesma pessoa.
      const comAssinatura = new Set<string>();
      for (const linha of (await coletarTudo<{
        user_id: string;
        status: string | null;
        current_period_end: string | null;
      }>(
        (from, to) =>
          supabaseAdmin
            .from("subscriptions")
            .select("user_id, status, current_period_end")
            .in("status", ["active", "trialing"])
            .order("user_id", { ascending: true })
            .range(from, to) as never,
        "atencao influencer x assinatura",
      )) as Array<{
        user_id: string;
        status: string | null;
        current_period_end: string | null;
      }>) {
        if (!idsInfluencer.has(linha.user_id)) continue;
        const periodoOk =
          !linha.current_period_end ||
          new Date(linha.current_period_end).getTime() > agora.getTime();
        if (periodoOk) comAssinatura.add(linha.user_id);
      }

      // So COLETA aqui; o item nasce no bloco 9, junto dos de assinatura, para
      // que os e-mails de todos saiam de uma consulta unica.
      for (const userId of Array.from(comAssinatura)) {
        pontesDeInfluencer.push(userId);
        idsParaEmail.add(userId);
      }
    }
  } catch (err) {
    console.warn(
      "[atencao] falha ao cruzar influencers com assinaturas:",
      err instanceof Error ? err.message : String(err),
    );
    fontesIndisponiveis.push("influencers");
  }

  // ------------------------------------------------------------------
  // 9: QUEM e a pessoa. Uma consulta de perfis para o painel inteiro.
  //
  // O painel dizia "Pagamento em atraso, R$ 29,90" e mais nada: para saber de
  // quem era, so abrindo a Stripe, o que esvaziava o botao "Resolver no admin".
  // Os itens de assinatura e os da ponte de influencer nascem aqui, depois que
  // os blocos acima disseram de QUAIS user_ids precisam.
  // ------------------------------------------------------------------
  const emailPorId = new Map<string, string>();
  if (idsParaEmail.size > 0) {
    try {
      const { data: perfis, error } = await supabaseAdmin
        .from("profiles")
        .select("user_id, email")
        .in("user_id", Array.from(idsParaEmail));
      if (error) throw error;
      for (const perfil of (perfis ?? []) as Array<{
        user_id: string;
        email: string | null;
      }>) {
        if (perfil.email) emailPorId.set(perfil.user_id, perfil.email);
      }
    } catch (err) {
      console.warn(
        "[atencao] falha ao ler perfis:",
        err instanceof Error ? err.message : String(err),
      );
      fontesIndisponiveis.push("perfis");
    }
  }

  // E-mail AUSENTE e estado NOMEADO, nunca string vazia: o item continua
  // acionavel (da para achar pelo id) e nao parece bug do painel. Vale tanto
  // para perfil sem e-mail quanto para a consulta que nao respondeu.
  const emailDe = (userId: string | null): string =>
    (userId ? emailPorId.get(userId) : undefined) ?? "e-mail não encontrado";

  for (const p of pendentesDeAssinatura) {
    const email = emailDe(p.userId);
    if (p.tipo === "assinatura_past_due") {
      itens.push({
        tipo: "assinatura_past_due",
        chave: p.chave,
        severidade: p.severidade,
        titulo: "Pagamento em atraso",
        detalhe: `${email}: a cobrança falhou e a Stripe está tentando de novo. Sem ação, a assinatura cancela sozinha.`,
        valorCents: p.valorCents,
        ...(p.mrrMensalCents !== null
          ? { mrrMensalCents: p.mrrMensalCents }
          : {}),
        url: p.url,
        destinoInterno: ADMIN_USUARIOS,
      });
      continue;
    }
    itens.push({
      tipo: "saida_agendada",
      chave: p.chave,
      severidade: p.severidade,
      titulo: "Saída agendada",
      detalhe: `${email}: cancelamento marcado, o acesso termina em ${p.fim}.`,
      ...(p.motivoCodigo ? { motivoCodigo: p.motivoCodigo } : {}),
      valorCents: p.valorCents,
      ...(p.mrrMensalCents !== null
        ? { mrrMensalCents: p.mrrMensalCents }
        : {}),
      url: p.url,
      destinoInterno: ADMIN_USUARIOS,
    });
  }

  for (const userId of pontesDeInfluencer) {
    itens.push({
      tipo: "influencer_com_assinatura",
      chave: `influencer_pagante:${userId}`,
      severidade: "atencao",
      titulo: "Influencer que virou assinante",
      detalhe: `${emailDe(userId)} tem concessão de influencer ativa E assinatura paga vigente. Revogar a concessão não tira o Pro, que fica de pé pela assinatura.`,
      url: "",
      destinoInterno: ADMIN_USUARIOS,
    });
  }

  // CRITICO PRIMEIRO. Dentro da mesma severidade, o de maior valor: quem abre o
  // painel tem tempo para os primeiros itens, nao para todos.
  const peso = (s: SeveridadeAtencao) => (s === "critico" ? 0 : 1);
  itens.sort(
    (a, b) =>
      peso(a.severidade) - peso(b.severidade) ||
      (b.valorCents ?? 0) - (a.valorCents ?? 0),
  );

  return { itens, fontesIndisponiveis, janelaDias };
}
