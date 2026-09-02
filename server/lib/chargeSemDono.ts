import { CHARGE_SEM_DONO_CORTE_DIAS } from "./financeSyncWindow";
import { getStripe } from "./stripeClient";
import { supabaseAdmin } from "./supabaseAdmin";

/**
 * PAGAMENTO SEM DONO, detectado a partir de `finance_transactions`.
 *
 * O BURACO QUE ISTO FECHA, medido em 2026-08-31. O detector de orfaos
 * (server/lib/orphanPayments.ts:560) parte de `stripe.checkout.sessions.list` e
 * exige sessao paga. Dinheiro que entra por outro caminho e invisivel para ele
 * POR CONSTRUCAO, e a lista desses caminhos nao e fechada: invoice avulsa,
 * cobranca criada no painel, payment link, o que vier depois. O caso do Walisson
 * foi o primeiro a custar caro: R$ 29,90 em 21/08 contra a invoice
 * `in_1U6fTVQ6lxIhx7VyyFnPu9ut`, criada no painel, dez dias sem Pro.
 *
 * A FONTE E A NOSSA PROPRIA TABELA, e isso e o ponto. O `sync-finance` varre
 * `balance_transactions` diariamente (rodadas confirmadas as 04:20 de 27 a
 * 31/08, todas `success`, 2 a 4 segundos cada) e cobre TODA entrada de dinheiro
 * por construcao, porque todo pagamento vira balance transaction. A cobranca do
 * Walisson estava em `finance_transactions` no dia em que foi paga. Detectar
 * daqui custa ZERO requisicoes a Stripe.
 *
 * O SINAL E `type='charge' AND user_id IS NULL`, e ele foi medido antes de ser
 * escolhido: 175 charges na vida, 5 sem dono, e ZERO com dono mas sem
 * assinatura. Nao e um proxy, e a condicao literal de "dinheiro entrou e
 * ninguem foi atendido".
 *
 * O QUE ISTO NAO PEGA, declarado: pagamento atribuido a um usuario que mesmo
 * assim nao tem assinatura. Medido: nenhum caso em 175 charges. E risco
 * teorico, e continua sendo trabalho do detector por sessao, que compara com
 * `subscriptions` de verdade.
 */

/** Linha de `finance_transactions` que interessa aqui. */
export type LinhaSemDono = {
  /** `stripe` | `asaas`. Quem cobrou. */
  provider: string;
  /** Identidade da transacao no provedor. E ela que torna a linha rastreavel. */
  providerTransactionId: string | null;
  /** So existe em linha da Stripe. `null` em Asaas, e isso NAO e ausencia de dado. */
  stripeChargeId: string | null;
  grossCents: number | null;
  currency: string | null;
  occurredAt: string;
  /** `raw_payload.source.billing_details.email`, quando houver. */
  emailDaCobranca: string | null;
  /** `raw_payload.source.customer`, quando houver. */
  customerId: string | null;
};

export type AchadoSemDono = {
  /** `stripe` | `asaas`. */
  provider: string;
  /** Identidade no provedor. NUNCA nula: e o filtro de entrada da deteccao. */
  providerTransactionId: string;
  /**
   * Id da cobranca na Stripe, quando a linha for da Stripe.
   *
   * `null` em Asaas, e a distincao importa: ele e a chave de
   * `billing_orphan_payments` e o que monta o link para o painel da Stripe.
   */
  stripeChargeId: string | null;
  grossCents: number | null;
  currency: string | null;
  occurredAt: string;
  emailDaCobranca: string | null;
  /** Conta cujo email bate. CANDIDATO, nunca atribuicao. */
  candidatoUserId: string | null;
  /**
   * A busca por email foi FEITA. `false` quando nao havia email nenhum ou o teto
   * da execucao foi atingido: nesse caso `candidatoUserId` nulo significa "nao
   * procurei", nao "nao existe".
   */
  candidatoVerificado: boolean;
};

/**
 * Teto de buscas de email por execucao, no molde de
 * `TETO_REVERIFICACAO_ABERTAS` de orphanPayments.ts.
 *
 * Com o estoque real (5 linhas em 2026-08-31) ele nunca e alcancado. Existe
 * porque a busca pode precisar cair para a Stripe quando a cobranca nao trouxe
 * `billing_details.email`, e porque o que passa do teto NAO some: vira
 * `naoVerificadas`, que por si so mantem a run em 'partial'. Sem isso, um
 * estoque grande esconderia atras de si o caso que importa e o job sairia verde.
 */
export const TETO_CANDIDATO_POR_EMAIL = 25;

export type ChargeSemDonoScan = {
  corteDias: number;
  /** Linhas sem dono acima do corte. */
  encontradas: number;
  /**
   * Linhas que pedem acao. Hoje e igual a `encontradas`: toda cobranca sem dono
   * acima do corte pede alguem olhar. O campo existe separado porque o dia em
   * que houver uma categoria de ruido conhecido (como `modo_teste` no detector
   * por sessao) a distincao vai precisar existir, e mistura-las agora tornaria
   * impossivel separa-las depois sem reescrever o criterio da run.
   */
  acionaveis: number;
  /** Achados cujo candidato NAO foi verificado. Mantem a run em 'partial'. */
  naoVerificadas: number;
  /**
   * Achados que a FILA nao consegue guardar, hoje so os que nao sao da Stripe.
   *
   * `billing_orphan_payments` exige EXATAMENTE UMA de `stripe_session_id` ou
   * `stripe_charge_id` (CHECK `billing_orphan_payments_uma_chave`, migration
   * 20260831140000). Uma cobranca do Asaas nao tem nenhuma das duas, entao o
   * insert violaria o CHECK.
   *
   * O CONTADOR EXISTE PARA O NUMERO NAO SUMIR. As duas saidas obvias eram
   * piores: tentar inserir devolveria `persisted: false`, e o cabecalho daquela
   * migration ja registra que esse estado e indistinguivel do normal da fila,
   * entao a falha seria silenciosa; e inventar uma chave falsa mentiria sobre a
   * origem e envenenaria toda leitura futura, que e exatamente o que aquele
   * cabecalho recusou fazer com a sessao.
   *
   * A cobranca APARECE em `encontradas`, `acionaveis` e `itens`, e na faixa de
   * saude. So nao entra na fila com botao de resolver. Fechar isso exige
   * `provider` e `provider_transaction_id` em `billing_orphan_payments`, que e
   * migration propria e nao cabe neste lote.
   */
  naoEnfileiraveis: number;
  /** false quando a leitura da tabela falhou. Nao saber nao e estar limpo. */
  leituraOk: boolean;
  /** false quando o registro na fila falhou. */
  persisted: boolean;
  /** Achados que ainda nao estavam registrados. */
  novas: number;
  itens: AchadoSemDono[];
};

/**
 * A cobranca ja passou do corte de idade?
 *
 * MESMO CORTE do `chargesSemDono` da faixa de atencao
 * (server/routes/admin.ts:859-868), e a constante e a mesma
 * (`CHARGE_SEM_DONO_CORTE_DIAS`, financeSyncWindow.ts:52), de proposito. A regra
 * escrita la vale identica aqui: so acusa o que o `sync-finance` JA NAO ALCANCA
 * MAIS. Abaixo desse corte a linha ainda esta na janela do cron diario e pode
 * ganhar dono sozinha na proxima passada, exatamente como aconteceu com a
 * cobranca de cartao de 01/08, orfa por uma corrida de 5 segundos.
 *
 * Um corte proprio aqui seria um segundo numero dizendo a mesma coisa, e dois
 * numeros para uma regra so divergem no primeiro dia em que alguem mexe em um.
 */
export function passouDoCorte(
  occurredAtIso: string,
  agoraMs: number,
  corteDias: number = CHARGE_SEM_DONO_CORTE_DIAS,
): boolean {
  const quando = Date.parse(occurredAtIso);
  if (Number.isNaN(quando)) return false;
  return quando < agoraMs - corteDias * 24 * 60 * 60 * 1000;
}

/** Dependencias injetadas: o teste exercita a DECISAO sem Postgres nem Stripe. */
export type SemDonoLookups = {
  /**
   * `type='charge' AND user_id IS NULL`. `null` significa LEITURA FALHOU, que e
   * diferente de lista vazia: um devolve "nao sei", o outro "nao ha".
   */
  listarSemDono: () => Promise<LinhaSemDono[] | null>;
  /**
   * Email do customer na Stripe, para a cobranca que nao trouxe
   * `billing_details.email`. Uma requisicao por chamada; so e chamada dentro do
   * teto.
   */
  emailDoCustomer: (customerId: string) => Promise<string | null>;
  /** email -> user_id, em UMA consulta por lote. */
  contasPorEmail: (emails: string[]) => Promise<Map<string, string>>;
  persistir: (
    itens: AchadoSemDono[],
  ) => Promise<{ persisted: boolean; novas: number }>;
};

export async function detectarChargesSemDono(
  lookups: SemDonoLookups,
  opcoes: { agoraMs?: number; corteDias?: number; dryRun?: boolean } = {},
): Promise<ChargeSemDonoScan> {
  const agoraMs = opcoes.agoraMs ?? Date.now();
  const corteDias = opcoes.corteDias ?? CHARGE_SEM_DONO_CORTE_DIAS;
  const vazio: ChargeSemDonoScan = {
    corteDias,
    encontradas: 0,
    acionaveis: 0,
    naoVerificadas: 0,
    naoEnfileiraveis: 0,
    leituraOk: true,
    persisted: true,
    novas: 0,
    itens: [],
  };

  const linhas = await lookups.listarSemDono();
  if (linhas === null) {
    // FAIL-CLOSED: leitura que falhou nao vira "sem achados". Mesmo criterio do
    // `contarLinhas` devolvendo -1 do CLAUDE.md, e do `unresolvedLeituraOk` do
    // detector por sessao.
    return { ...vazio, leituraOk: false };
  }

  // O FILTRO E A IDENTIDADE NO PROVEDOR, e nao mais o id da Stripe.
  //
  // Ate 2026-09-02 a condicao era `l.stripeChargeId &&`, e com a tabela virando
  // ledger multi-provedor ela teria descartado TODA cobranca Pix sem dono, em
  // silencio: o scan sairia `encontradas: 0` com a run `success`, enquanto a
  // faixa de saude (server/routes/admin.ts, que nunca filtrou por essa coluna)
  // contaria a mesma linha. Duas telas discordando, e a calada sendo a que tem
  // o botao de agir.
  const candidatas = linhas.filter(
    (l) =>
      l.providerTransactionId &&
      passouDoCorte(l.occurredAt, agoraMs, corteDias),
  );
  if (candidatas.length === 0) return vazio;

  // Email da PROPRIA linha primeiro, e isso e o que torna o caminho gratuito:
  // medido em 2026-08-31, `raw_payload.source.billing_details.email` estava
  // preenchido em 5 de 5 das cobrancas sem dono, inclusive na de boleto que nao
  // tem `customer`. A Stripe so e consultada para o que faltar.
  const itens: AchadoSemDono[] = [];
  let consultasAStripe = 0;
  for (const linha of candidatas) {
    let email = linha.emailDaCobranca;
    let verificado = true;
    if (!email && linha.customerId) {
      if (consultasAStripe < TETO_CANDIDATO_POR_EMAIL) {
        consultasAStripe += 1;
        email = await lookups.emailDoCustomer(linha.customerId);
        if (!email) verificado = false;
      } else {
        verificado = false;
      }
    } else if (!email) {
      // Sem email na linha e sem customer: nao ha por onde procurar. NAO e "esta
      // ok", e "nao sei", e por isso conta como nao verificada.
      verificado = false;
    }
    itens.push({
      provider: linha.provider,
      providerTransactionId: linha.providerTransactionId as string,
      stripeChargeId: linha.stripeChargeId,
      grossCents: linha.grossCents,
      currency: linha.currency,
      occurredAt: linha.occurredAt,
      emailDaCobranca: email,
      candidatoUserId: null,
      candidatoVerificado: verificado,
    });
  }

  // UMA consulta para todos os emails, nao uma por achado.
  const emails = itens
    .map((i) => i.emailDaCobranca)
    .filter((e): e is string => Boolean(e));
  if (emails.length > 0) {
    const contas = await lookups.contasPorEmail(emails);
    for (const item of itens) {
      if (!item.emailDaCobranca) continue;
      // CANDIDATO, NUNCA ATRIBUICAO. Duas fraquezas assumidas aqui:
      //   1. a pessoa pode pagar com um email e ter se cadastrado com outro,
      //      entao a ausencia de candidato nao prova que ela nao tem conta;
      //   2. casar por email e INFERENCIA, nao prova: dois cadastros podem
      //      compartilhar um email de familia, e o pagador pode ser terceiro.
      // Por isso o valor vai para uma coluna propria e nunca para `user_id` de
      // `finance_transactions`. A tabela ja declara que o job so detecta
      // (migration 20260727120000, linhas 9-10), e promover automaticamente
      // trocaria um problema visivel por um erro silencioso de atribuicao.
      item.candidatoUserId = contas.get(item.emailDaCobranca) ?? null;
    }
  }

  const naoVerificadas = itens.filter((i) => !i.candidatoVerificado).length;
  // Ver o comentario de `naoEnfileiraveis` em ChargeSemDonoScan: a fila exige
  // uma chave da Stripe, e a linha que nao tem uma e CONTADA aqui em vez de
  // tentar um insert que o CHECK recusaria em silencio.
  const naoEnfileiraveis = itens.filter((i) => !i.stripeChargeId).length;
  const registro = opcoes.dryRun
    ? { persisted: true, novas: 0 }
    : await lookups.persistir(itens);

  return {
    corteDias,
    encontradas: itens.length,
    acionaveis: itens.length,
    naoVerificadas,
    naoEnfileiraveis,
    leituraOk: true,
    persisted: registro.persisted,
    novas: registro.novas,
    itens,
  };
}

// ---------------------------------------------------------------------------
// Dependencias reais
// ---------------------------------------------------------------------------

/**
 * Forma bruta da linha lida do banco. `raw_payload` e o objeto da balance
 * transaction inteiro, gravado por `syncBalanceTransactions`
 * (server/lib/stripeSync.ts:476-490), e e dele que saem o email e o customer
 * sem custar requisicao nenhuma.
 */
type LinhaBruta = {
  provider: string | null;
  provider_transaction_id: string | null;
  stripe_charge_id: string | null;
  gross_cents: number | null;
  currency: string | null;
  occurred_at: string;
  raw_payload: unknown;
};

/** Le um campo aninhado de `raw_payload` sem `any` e sem assumir o shape. */
function textoEm(objeto: unknown, caminho: string[]): string | null {
  let atual: unknown = objeto;
  for (const chave of caminho) {
    if (!atual || typeof atual !== "object") return null;
    atual = (atual as Record<string, unknown>)[chave];
  }
  return typeof atual === "string" && atual.trim() !== "" ? atual : null;
}

export function linhaDoBanco(bruta: LinhaBruta): LinhaSemDono {
  // `provider` tem default 'stripe' na coluna, e o fallback aqui repete esse
  // default em vez de aceitar `null`: linha gravada na janela entre a migration
  // e o deploy do codigo novo e da Stripe, e tratar a ausencia como um provedor
  // desconhecido a tiraria da deteccao.
  const provider = bruta.provider ?? "stripe";

  // EMAIL E CUSTOMER SO EXISTEM NO SHAPE DA STRIPE. `raw_payload` de uma linha
  // da Stripe e a balance transaction inteira, com `source` expandido; o de uma
  // linha do Asaas e o objeto `payment`, que nao tem `source` nenhum. Ler os
  // mesmos caminhos nos dois devolveria `null` para Asaas, o que ate seria
  // correto por acidente, mas o acidente some no dia em que alguem "consertar"
  // o caminho. A condicao fica explicita.
  //
  // Consequencia declarada: cobranca Pix sem dono entra SEM candidato e com
  // `candidatoVerificado: false`, ou seja, "nao procurei", nao "nao existe". O
  // email do pagador existe no Asaas, atras de `raw_payload.customer` (um id),
  // e resolve-lo exige uma chamada a API deles, equivalente ao `emailDoCustomer`
  // que hoje so fala com a Stripe. Fica para o lote que fechar a fila.
  const daStripe = provider === "stripe";

  return {
    provider,
    providerTransactionId: bruta.provider_transaction_id,
    stripeChargeId: bruta.stripe_charge_id,
    grossCents: bruta.gross_cents,
    currency: bruta.currency,
    occurredAt: bruta.occurred_at,
    emailDaCobranca: daStripe
      ? textoEm(bruta.raw_payload, ["source", "billing_details", "email"])
      : null,
    customerId: daStripe
      ? textoEm(bruta.raw_payload, ["source", "customer"])
      : null,
  };
}

/** Lookups reais: Supabase para tudo, Stripe so no que faltar email. */
export const LOOKUPS_REAIS: SemDonoLookups = {
  async listarSemDono() {
    const { data, error } = await supabaseAdmin
      .from("finance_transactions")
      .select(
        "provider, provider_transaction_id, stripe_charge_id, gross_cents, currency, occurred_at, raw_payload",
      )
      .eq("type", "charge")
      .is("user_id", null)
      .order("occurred_at", { ascending: true });
    if (error) {
      console.error(
        "[charge-sem-dono] leitura de finance_transactions falhou:",
        error,
      );
      // null, nao []: quem chama precisa distinguir "nao sei" de "nao ha".
      return null;
    }
    return ((data ?? []) as LinhaBruta[]).map(linhaDoBanco);
  },

  async emailDoCustomer(customerId) {
    try {
      const customer = await getStripe().customers.retrieve(customerId);
      if (!customer || customer.deleted) return null;
      const email = (customer as { email?: unknown }).email;
      return typeof email === "string" && email !== "" ? email : null;
    } catch (err) {
      console.warn(
        `[charge-sem-dono] nao consegui ler o customer ${customerId}:`,
        err instanceof Error ? err.message : String(err),
      );
      return null;
    }
  },

  async contasPorEmail(emails) {
    const mapa = new Map<string, string>();
    const unicos = Array.from(new Set(emails));
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email")
      .in("email", unicos);
    if (error) {
      console.warn("[charge-sem-dono] busca de conta por email falhou:", error);
      return mapa;
    }
    for (const linha of (data ?? []) as Array<{
      user_id: string | null;
      email: string | null;
    }>) {
      if (linha.email && linha.user_id) mapa.set(linha.email, linha.user_id);
    }
    return mapa;
  },

  async persistir(itens) {
    // SO O QUE A FILA CONSEGUE GUARDAR. O CHECK
    // `billing_orphan_payments_uma_chave` exige exatamente uma de
    // `stripe_session_id` ou `stripe_charge_id`, e uma cobranca do Asaas nao tem
    // nenhuma das duas: o insert seria recusado pelo banco e o job devolveria
    // `persisted: false`, um estado que o cabecalho da migration 20260831140000
    // ja registra como indistinguivel do normal.
    //
    // Filtrar AQUI, e nao no chamador: o `detectarChargesSemDono` passa TODOS os
    // achados de proposito (eles contam em `encontradas` e aparecem na faixa de
    // saude), e a regra de o que cabe na fila e desta funcao. Guarda no chamador
    // precisaria ser repetida em cada chamador e some no primeiro esquecido.
    const enfileiraveis = itens.filter((i) => i.stripeChargeId);
    if (enfileiraveis.length === 0) return { persisted: true, novas: 0 };
    const agoraIso = new Date().toISOString();
    const linhas = enfileiraveis.map((i) => ({
      stripe_charge_id: i.stripeChargeId,
      // `stripe_session_id` fica NULO de proposito: nao ha sessao, e inventar
      // uma mentiria sobre a origem. O CHECK da migration 20260831140000 exige
      // exatamente uma das duas chaves.
      stripe_session_id: null,
      customer_email: i.emailDaCobranca,
      amount_total_cents: i.grossCents,
      currency: i.currency,
      payment_status: "paid",
      session_created_at: i.occurredAt,
      candidate_user_id: i.candidatoUserId,
      candidate_checked_at: i.candidatoVerificado ? agoraIso : null,
      detected_at: agoraIso,
      last_seen_at: agoraIso,
    }));

    // IDEMPOTENCIA, e ela tem duas metades. `ignoreDuplicates` sobre o indice
    // unico de `stripe_charge_id` faz a segunda execucao nao inserir nada e
    // devolver zero linhas, entao `novas` conta so o que de fato nasceu. E o
    // `touch` abaixo filtra `resolved_at is null`, entao uma linha JA RESOLVIDA
    // nao volta a ser mexida: nem ressuscita, nem ganha `last_seen_at` novo.
    //
    // O `onConflict` ABAIXO DEPENDE DO FORMATO DO INDICE, e a dependencia nao e
    // obvia. `billing_orphan_payments_charge_id_idx` (migration 20260831140000)
    // e um UNIQUE SIMPLES de proposito: se alguem o tornar PARCIAL (o
    // `WHERE stripe_charge_id IS NOT NULL` que parece a escolha limpa), este
    // upsert passa a levantar 42P10, porque o Postgres so infere indice parcial
    // quando o ON CONFLICT carrega o predicado, e o PostgREST emite
    // `on_conflict=<colunas>` seco, sem lugar para ele.
    //
    // E A QUEBRA E SILENCIOSA, que e o pior detalhe: o `if (erroInsert)` logo
    // abaixo devolve `persisted: false`, o job segue detectando e a run fica
    // 'partial', que e indistinguivel do estado normal da fila com orfao em
    // aberto. A fila simplesmente pararia de receber linha, sem nada gritar
    // diferente. Medido e reproduzido em 2026-08-31; o raciocinio inteiro esta
    // no cabecalho da migration.
    const { data: inseridas, error: erroInsert } = await supabaseAdmin
      .from("billing_orphan_payments")
      .upsert(linhas, {
        onConflict: "stripe_charge_id",
        ignoreDuplicates: true,
      })
      .select("stripe_charge_id");
    if (erroInsert) {
      console.error(
        "[charge-sem-dono] falha ao registrar na fila (a deteccao vale, o registro nao):",
        erroInsert,
      );
      return { persisted: false, novas: 0 };
    }

    const { error: erroTouch } = await supabaseAdmin
      .from("billing_orphan_payments")
      .update({ last_seen_at: agoraIso })
      .in(
        "stripe_charge_id",
        enfileiraveis.map((i) => i.stripeChargeId),
      )
      .is("resolved_at", null);
    if (erroTouch) {
      console.warn(
        "[charge-sem-dono] falha ao atualizar last_seen_at:",
        erroTouch,
      );
    }

    return { persisted: true, novas: inseridas?.length ?? 0 };
  },
};
