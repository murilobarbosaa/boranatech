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
