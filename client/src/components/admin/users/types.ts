// Tipos do modulo de Usuarios do admin. Movidos verbatim de UsersDashboard.tsx
// na extracao do modulo; a unica alteracao de conteudo foi alargar
// UserDetail.activity_status (ver comentario no campo).

export type UserRow = {
  id?: string;
  user_id?: string;
  name?: string | null;
  email?: string | null;
  onboarding_completed?: boolean | null;
};

// Espelha o payload paginado de GET /users.
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

// Espelha o payload de GET /users/:id (CPF ja mascarado; sem campos de moderacao
// de avatar nem o blob de preferences).
export type UserDetail = {
  user_id: string | null;
  name: string | null;
  full_name: string | null;
  email: string | null;
  gender: string | null;
  bio: string | null;
  area_interesse: string | null;
  nivel_atual: string | null;
  objetivo: string | null;
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
