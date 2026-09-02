// Tipos do modulo de Usuarios do admin. Movidos verbatim de UsersDashboard.tsx
// na extracao do modulo; a unica alteracao de conteudo foi alargar
// UserDetail.activity_status (ver comentario no campo).

export type UserRow = {
  id?: string;
  user_id?: string;
  name?: string | null;
  email?: string | null;
  created_at?: string | null;
  // Enriquecimento em lote da rota (server/lib/userListEnrichment.ts). is_pro ja
  // considera os DOIS ramos do gate real (assinatura e influencer); pro_source
  // diz qual deles, e por isso e `string` e nao a uniao dos valores conhecidos:
  // uma origem nova no backend nao pode quebrar o bundle em execucao. Quem le
  // passa por proBadgeOf.
  is_pro?: boolean;
  pro_source?: string | null;
  plan_code?: string | null;
  subscription_status?: string | null;
  /** `area_interesse` de profiles. `null` = a pessoa nunca preencheu. */
  area_interesse?: string | null;
  /**
   * Total pago em centavos, pela conta canonica do extrato.
   *
   * TRES valores com tres significados: um numero positivo, ZERO (afirmacao de
   * que nunca pagou) e `null` (o servidor nao conseguiu somar). A tela desenha
   * os tres diferente; colapsar zero e null faria "nunca comprou" e "nao sei"
   * virarem a mesma celula.
   */
  total_pago_cents?: number | null;
  /**
   * `last_sign_in_at` de `auth.users`, via o RPC de listagem.
   *
   * `null` tem UM significado so aqui: a pessoa nunca logou. Nao existe o caso
   * "nao consegui olhar", porque o dado vem na MESMA linha do resto: se o RPC
   * falha, a rota inteira responde erro e nenhuma linha chega.
   */
  last_sign_in_at?: string | null;
};

// Espelha o payload paginado de GET /users.
//
// `page` e `pageSize` sao os ECOS do que a UI pediu: ela ja conhece os dois
// (page e estado local, pageSize e a constante PAGE_SIZE) e nunca os leu. Ficam
// no tipo porque o servidor os manda e documentam o contrato, mas a UI NAO os
// usa como fonte da verdade: fazer isso trocaria um valor local sincrono por um
// que so chega depois da resposta, e a paginacao piscaria a cada requisicao.
export type UsersListPayload = {
  items: UserRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type UserListFilter =
  | "all"
  | "pro"
  | "not_pro"
  | "influencers"
  | "ativo";

// O que a UI CONSOME de GET /users/:id (CPF ja mascarado; sem campos de
// moderacao de avatar nem o blob de preferences).
//
// Nao e um espelho literal do payload: `user_id` foi removido porque nunca era
// lido (o modal recebe o id por prop, e le-lo da resposta seria uma segunda
// fonte para a mesma coisa). O servidor continua enviando; o tipo descreve o
// que a tela usa.
export type UserDetail = {
  name: string | null;
  full_name: string | null;
  email: string | null;
  gender: string | null;
  bio: string | null;
  area_interesse: string | null;
  nivel_atual: string | null;
  objetivo: string | null;
  // Perfil publico. Editaveis pelo proprio usuario em /api/me; 100% nulos em
  // producao ate 2026-07-29. Opcionais no tipo porque a resposta do backend
  // antigo (janela de deploy Vercel/Railway) nao os traz.
  headline?: string | null;
  city?: string | null;
  uf?: string | null;
  career_goal?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  website_url?: string | null;
  onboarding_completed: boolean | null;
  onboarding_step: number | null;
  marketing_opt_in: boolean | null;
  marketing_opt_in_at: string | null;
  welcome_email_sent: boolean | null;
  cpf_masked: string | null;
  has_cpf: boolean;
  // A foto e UMA (avatar_url); moderation_status diz o estado dela (clean |
  // pending_review | removed). Nao existe avatar_pending_url no schema.
  avatar: {
    url: string | null;
    mode: string | null;
    moderation_status: string | null;
  } | null;
  subscription: {
    plan_code: string | null;
    status: string | null;
    payment_method: string | null;
    renewal_type: string | null;
    created_at: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean | null;
  } | null;
  /**
   * Estado do boleto pendente, lido da Checkout Session sob demanda.
   * Null quando a assinatura escolhida nao esta `pending` (a maioria esmagadora
   * dos casos: 1 linha em 59 hoje).
   */
  boleto: BoletoEstado | null;
  /** Assinaturas ANTERIORES, sem a vigente. Vazio quando so existe uma. */
  subscription_history: SubscriptionHistoryItem[];
  cancellation_intent: {
    reason_code: string | null;
    reason_text: string | null;
    effective_at: string | null;
  } | null;
  // Concessao de influencer ATIVA (null quando nao e influencer). Acesso Pro
  // vitalicio sem assinatura, ortogonal a subscription: os dois podem coexistir.
  influencer: {
    granted_at: string | null;
    note: string | null;
    granted_by_name: string | null;
    granted_by_email: string | null;
  } | null;
  paid_total_cents: number;
  // Derivados no servidor com a MESMA funcao que alimenta a lista
  // (server/lib/userListEnrichment.ts), para o selo do cabecalho do modal e o
  // da linha nunca discordarem. pro_source e `string` pelo mesmo motivo de
  // UserRow: origem nova no backend nao pode quebrar o bundle em execucao.
  is_pro?: boolean;
  pro_source?: string | null;
  // Derivado no servidor a partir de last_sign_in_at, com a mesma janela de 30d
  // do filtro ATIVO: active = login < 30d, inactive = login > 30d, never = nunca
  // logou. A janela vive so no servidor; aqui so mapeamos o rotulo.
  //
  // `string`, NAO a uniao dos tres valores conhecidos, de proposito: o servidor
  // pode passar a emitir um quarto estado antes de o bundle do frontend subir,
  // e um tipo estreito aqui e uma promessa que o runtime nao cumpre. Foi
  // exatamente esse tipo estreito que fez o acesso direto ao mapa parecer
  // seguro. Quem le isto passa por activityStatusLabelOf (userFormat.ts).
  activity_status: string;
  created_at: string | null;
  updated_at: string | null;
};

export type PosthogUserActivityState =
  | { state: "not_configured"; missing: string[] }
  | { state: "error"; reason: string; httpStatus?: number }
  | {
      state: "ok";
      hasData: boolean;
      activity: {
        features: Array<{ event: string; count: number }>;
        navigation: Array<{ page: string; timestamp: string }>;
      };
    };

// Extrato de compras (GET /users/:id/transactions). O estado de reembolso vem
// AGREGADO do servidor (server/lib/userTransactions.ts): a Fatia 7 depende
// destes campos para nao reembolsar duas vezes e para saber o teto do valor.
export type TransactionItem = {
  id: string;
  /**
   * `stripe` | `asaas`. OPCIONAL pelo mesmo motivo de
   * `refunded_external_cents`: campo novo, e na janela de deploy o bundle novo
   * recebe a resposta antiga sem ele. `providerMetaOf` resolve a ausencia.
   */
  provider?: string | null;
  /** Identidade no provedor. Para Asaas e o unico id que a linha tem. */
  provider_transaction_id?: string | null;
  type: string;
  gross_cents: number;
  fee_cents: number | null;
  net_cents: number | null;
  currency: string | null;
  occurred_at: string;
  stripe_charge_id: string | null;
  stripe_invoice_id: string | null;
  plan_code: string | null;
  /** Magnitude positiva; 0 em linhas que nao sao charge. */
  refunded_cents: number;
  /**
   * Quanto de refunded_cents veio de DECLARACAO do admin (devolucao feita fora
   * da Stripe), nao do sync. OPCIONAL de proposito: na janela de deploy o
   * frontend novo fala com o backend antigo, que nao manda este campo, e um
   * acesso direto a `undefined` na aritmetica de exibicao pintaria NaN.
   */
  refunded_external_cents?: number;
  disputed_cents: number;
  disputed: boolean;
  refund_state: string;
  refundable_cents: number;
};

export type TransactionsPayload = {
  items: TransactionItem[];
  total_paid_cents: number;
  /**
   * Dinheiro de Pix que ainda esta conosco. OPCIONAL: campo novo, ausente na
   * resposta do backend antigo durante a janela de deploy.
   */
  pix_sem_reembolso_na_stripe_cents?: number;
  truncated: boolean;
  limit: number;
};

/**
 * Historico administrativo (GET /users/:id/audit).
 *
 * `outcome` cruza a INTENCAO registrada em content_audit_logs (escrita ANTES da
 * acao, porque a auditoria e fail-closed) com o RESULTADO observavel. Ver o
 * cabecalho de server/lib/userAuditHistory.ts.
 */
export type AuditEntry = {
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
  outcome: "confirmed" | "unconfirmed" | "not_verifiable";
  outcome_detail: string | null;
};

export type AuditPayload = {
  entries: AuditEntry[];
  truncated: boolean;
  limit: number;
  cross_reference_ok: boolean;
};

/** Espelha server/lib/boletoSession.ts. */
export type BoletoEstado =
  | {
      estado: "ok";
      payment_status: string | null;
      amount_cents: number | null;
      currency: string | null;
      /** Vencimento do BOLETO, nao da sessao de checkout. */
      expires_at: string | null;
      pago: boolean;
    }
  | { estado: "indisponivel"; motivo: string };

export type SubscriptionHistoryItem = {
  plan_code: string | null;
  status: string | null;
  payment_method: string | null;
  created_at: string | null;
  current_period_end: string | null;
};

/**
 * O que aconteceu com o ACESSO depois de uma devolucao. `should_revoke` e a
 * decisao do servidor e `revoked` e o resultado: os dois separados porque
 * `should_revoke && !revoked` e o estado meio-feito (dinheiro devolvido, acesso
 * mantido) que a tela precisa saber distinguir de "nao havia o que revogar".
 *
 * `reason` e `string`, nao a uniao dos valores conhecidos, pela regra do
 * projeto: um motivo novo no backend nao pode quebrar o bundle em execucao.
 */
export type RefundAccessOutcome = {
  should_revoke: boolean;
  revoked: boolean;
  reason: string;
  detail: string | null;
  still_pro_via_influencer: boolean;
};
