import {
  diaBrasilia,
  inicioDoDiaBrasilia,
  somarDiaCivil,
} from "../../shared/brasiliaDay";
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
    | "custo_ia_spike";
  /** Identidade estavel do item entre execucoes. Dois itens iguais colidem. */
  chave: string;
  severidade: SeveridadeAtencao;
  titulo: string;
  detalhe: string;
  valorCents?: number;
  /** Para onde ir para agir. Stripe, ou a aba do proprio admin. */
  url: string;
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

export async function montarPainelDeAtencao(
  opcoes: {
    agora?: Date;
    janelaDias?: number;
    fonteDeCobrancasFalhadas?: FonteDeCobrancasFalhadas;
  } = {},
): Promise<PainelDeAtencao> {
  const agora = opcoes.agora ?? new Date();
  const janelaDias = opcoes.janelaDias ?? 7;
  const fonteFalhadas =
    opcoes.fonteDeCobrancasFalhadas ?? cobrancasFalhadasDaStripe;

  const itens: ItemAtencao[] = [];
  const fontesIndisponiveis: string[] = [];

  // ------------------------------------------------------------------
  // 1 e 2: assinaturas que pedem acao (past_due e saida agendada)
  // ------------------------------------------------------------------
  type LinhaSub = {
    id: string;
    status: string;
    cancel_at_period_end: boolean | null;
    current_period_end: string | null;
    provider_subscription_id: string | null;
    // O PostgREST devolve o relacionamento ora como objeto, ora como array.
    plans:
      | { code: string | null; price_cents: number | null }
      | Array<{ code: string | null; price_cents: number | null }>
      | null;
  };
  try {
    const subs = (await coletarTudo<LinhaSub>(
      (from, to) =>
        // O `as never` no fim: o builder do PostgREST nao infere o tipo do
        // embed `plans(...)`, e o mesmo padrao usado em billingMetrics.ts.
        supabaseAdmin
          .from("subscriptions")
          .select(
            "id, status, cancel_at_period_end, current_period_end, provider_subscription_id, plans(code, price_cents)",
          )
          .in("status", ["active", "trialing", "past_due"])
          .order("id", { ascending: true })
          .range(from, to) as never,
      "atencao subscriptions",
    )) as LinhaSub[];

    for (const s of subs) {
      const plano = Array.isArray(s.plans) ? s.plans[0] : s.plans;
      const valorCents = resolvePlanPriceCents(
        plano?.code ?? undefined,
        Number(plano?.price_cents ?? 0),
        "atencao-necessaria",
      );
      const url = s.provider_subscription_id?.startsWith("sub_")
        ? `${STRIPE_SUB_URL}${s.provider_subscription_id}`
        : "";

      if (s.status === "past_due") {
        itens.push({
          tipo: "assinatura_past_due",
          chave: `past_due:${s.id}`,
          severidade: "critico",
          titulo: "Pagamento em atraso",
          detalhe:
            "A cobranca falhou e a Stripe esta tentando de novo. Sem acao, a assinatura cancela sozinha.",
          valorCents,
          url,
        });
        continue;
      }
      if (s.cancel_at_period_end) {
        const fim = s.current_period_end
          ? new Date(s.current_period_end).toLocaleDateString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })
          : "data desconhecida";
        itens.push({
          tipo: "saida_agendada",
          chave: `saida:${s.id}`,
          severidade: "atencao",
          titulo: "Saida agendada",
          detalhe: `Assinatura com cancelamento marcado; o acesso termina em ${fim}.`,
          valorCents,
          url,
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
      titulo: `${falhadas.count} cobrancas falharam em ${janelaDias} dias`,
      detalhe: `Somam ${reais(falhadas.cents)} que nao entraram. Cartao recusado e o motivo mais comum.`,
      valorCents: falhadas.cents,
      url: "https://dashboard.stripe.com/payments?status%5B%5D=failed",
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
        detalhe: `A Stripe registrou o pagamento e nao existe linha em subscriptions (${chaveEsperada}).`,
        valorCents: o.amount_total_cents ?? undefined,
        url: chaveEsperada.startsWith("sub_")
          ? `${STRIPE_SUB_URL}${chaveEsperada}`
          : `https://dashboard.stripe.com/payments`,
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
      });
    }
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
