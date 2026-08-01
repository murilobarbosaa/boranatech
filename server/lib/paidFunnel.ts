import { rateOf } from "../../shared/smallSample";

// O FUNIL ATE O ASSINANTE PAGO: as decisões que podem mentir, num lugar puro.
//
// Duas fontes, dois relógios, duas definições de "usuário". O que segura a
// junção de pé são três escolhas, todas medidas em 2026-08-01 antes de virar
// código:
//
// 1. PESSOAS, NÃO EVENTOS. `checkout_started` tinha 248 eventos para 134
//    pessoas na janela de 30 dias (uma pessoa iniciou 15 vezes). Contar eventos
//    faria a conversão final parecer 47% pior do que é.
//
// 2. JUNÇÃO POR PESSOA, NÃO RAZÃO DE AGREGADOS. Dos 64 assinantes pagos da
//    janela, apenas 49 têm `checkout_started` registrado no PostHog. Dividir 64
//    por 134 misturaria 15 pessoas que nunca entraram no funil medido, e o
//    resultado não seria conversão de nada. O último passo é a INTERSEÇÃO:
//    quem iniciou checkout E pagou. Os 13 restantes viram um número declarado à
//    parte (`assinantesSemRastro`), porque some-los seria inventar rastro.
//
// 3. A JANELA É A MESMA NOS DOIS LADOS. O PostHog usa 30 dias fixos; o banco
//    filtra `created_at` na MESMA janela. Hoje isso não muda nada (TODAS as
//    assinaturas da base foram criadas nos últimos 30 dias, a primeira em
//    13/07), mas em 13/08 o PostHog começa a esquecer o que o banco lembra, e a
//    razão viraria falsa em silêncio. Janela declarada dos dois lados, sempre.

export type FonteDoPasso = "posthog" | "posthog+banco";

export type PassoDoFunil = {
  id: string;
  label: string;
  /** Pessoas que chegaram até aqui. */
  people: number;
  fonte: FonteDoPasso;
  /** Conversão a partir do passo anterior (0..100). `null` no primeiro. */
  conversionFromPrev: number | null;
  /** Pessoas perdidas entre o passo anterior e este. `null` no primeiro. */
  lostFromPrev: number | null;
  /** Base do passo anterior abaixo do limiar: taxa pouco confiável. */
  smallSample: boolean;
};

export type Vazamento = {
  /** Passo onde a perda acontece (o passo de DESTINO da transição). */
  stepId: string;
  fromLabel: string;
  toLabel: string;
  lost: number;
  conversionPercent: number;
};

/**
 * A ASSINATURA CHEGOU A VALER?
 *
 * Esta é a definição de "assinante" do funil, e ela NÃO é nenhuma das que já
 * existem na página, de propósito:
 *
 *   `status='active'` (o card)      = estado HOJE. Quem assinou dia 14 e
 *                                     cancelou dia 20 não é ativo hoje, mas
 *                                     converteu. Para medir conversão isso conta.
 *   `resolveProSource` (os dois     = inclui concessão de influenciador, gente
 *   ramos)                            que nunca passou por checkout. No funil
 *                                     entraria no numerador sem estar no
 *                                     denominador, e a conversão poderia passar
 *                                     de 100%.
 *
 * O critério é `current_period_start != null`: o período de acesso só é gravado
 * quando o pagamento confirma. Verificado no código, não só nos dados: o boleto
 * nasce com `current_period_start: null` (`server/providers/stripe.ts`, criação
 * da sessão) e só recebe o período no flip para `active`, que roda no evento de
 * pagamento.
 *
 * POR QUE NÃO O STATUS. `canceled` é ambíguo e os dois caminhos existem:
 * `expire-pending-boletos` leva `pending -> canceled` um boleto que NUNCA foi
 * pago, e `expirarBoletosVencidos` leva `active -> canceled` um boleto que foi
 * pago e cujo acesso terminou. Uma lista de status contaria o primeiro como
 * conversão. O período de acesso separa os dois sem depender de status nenhum.
 *
 * POR QUE NÃO O DINHEIRO (`finance_transactions`). Seria a definição mais
 * direta de "pagou", e foi testada: dos 64, 62 têm cobrança lá, e um dos que
 * faltam é um boleto REAL, pago em 24/07, com acesso até 2027-01-22. A tabela
 * tem um buraco para boleto, então usá-la apagaria um cliente pagante do funil.
 * Fica registrado como achado; consertar a lacuna é outra fatia.
 */
export function assinaturaChegouAValer(row: {
  current_period_start: string | null;
}): boolean {
  return row.current_period_start !== null;
}

/**
 * Os quatro passos, com a conversão de CADA um.
 *
 * `pagantesComRastro` já vem intersectado: são as pessoas que iniciaram checkout
 * na janela E têm assinatura paga criada na janela. Por construção esse número é
 * menor ou igual ao de quem iniciou checkout, então o funil NÃO PODE subir de um
 * passo para o outro. Um funil que sobe é absurdo na tela e aqui é impossível.
 */
export function montarFunil(input: {
  visitantes: number;
  cadastros: number;
  checkouts: number;
  pagantesComRastro: number;
}): PassoDoFunil[] {
  const cru: Array<{
    id: string;
    label: string;
    people: number;
    fonte: FonteDoPasso;
  }> = [
    {
      id: "visitantes",
      label: "Visitantes únicos",
      people: input.visitantes,
      fonte: "posthog",
    },
    {
      id: "cadastros",
      label: "Cadastros",
      people: input.cadastros,
      fonte: "posthog",
    },
    {
      id: "checkout",
      label: "Checkout iniciado",
      people: input.checkouts,
      fonte: "posthog",
    },
    {
      id: "pagou",
      label: "Assinatura paga",
      people: input.pagantesComRastro,
      // A FONTE MUDA AQUI, e o passo carrega isso. Quem lê precisa saber que a
      // última barra não vem do mesmo lugar que as três primeiras.
      fonte: "posthog+banco",
    },
  ];

  return cru.map((passo, i) => {
    if (i === 0) {
      return {
        ...passo,
        conversionFromPrev: null,
        lostFromPrev: null,
        smallSample: false,
      };
    }
    const anterior = cru[i - 1].people;
    const { rate, small } = rateOf(passo.people, anterior);
    return {
      ...passo,
      conversionFromPrev: rate,
      lostFromPrev: Math.max(anterior - passo.people, 0),
      smallSample: small,
    };
  });
}

/**
 * O maior vazamento: a transição de MENOR CONVERSÃO, não a de maior perda
 * absoluta.
 *
 * A perda absoluta aponta sempre para o topo do funil, porque é lá que estão os
 * números grandes: visitante -> cadastro perde 10.512 pessoas e checkout ->
 * pagamento perde 84, e ainda assim 21% de visitante para cadastro é saudável
 * enquanto 4,8% de cadastro para checkout é a anomalia. Ordenar por perda
 * absoluta responderia "onde tem mais gente", que não é a pergunta.
 *
 * Transição com amostra pequena fica FORA da disputa: eleger "0 de 3" como o
 * maior vazamento da página mandaria agir sobre ruído.
 */
export function maiorVazamento(passos: PassoDoFunil[]): Vazamento | null {
  let pior: Vazamento | null = null;
  for (let i = 1; i < passos.length; i++) {
    const passo = passos[i];
    if (passo.conversionFromPrev === null || passo.smallSample) continue;
    if (pior === null || passo.conversionFromPrev < pior.conversionPercent) {
      pior = {
        stepId: passo.id,
        fromLabel: passos[i - 1].label,
        toLabel: passo.label,
        lost: passo.lostFromPrev ?? 0,
        conversionPercent: passo.conversionFromPrev,
      };
    }
  }
  return pior;
}
