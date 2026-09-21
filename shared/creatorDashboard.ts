// Contrato do painel de creator: o que `montarPainelDoCreator`
// (server/lib/creatorDashboard.ts) devolve, e o que o client do lote 03 le.
// Vive em shared/ para os dois lados compilarem contra o MESMO tipo.
//
// Nao importa nada de server/: o client nao pode puxar codigo de servidor. Por
// isso o kind e reescrito aqui como uniao literal; o `CreatorKind` de
// server/lib/creatorKind.ts e atribuivel a ele.

import type { AvatarDeCreator } from "./creatorAvatar";
import type { CreatorPerfilDados } from "./creatorProfile";

export const CREATOR_DASHBOARD_JANELAS = ["7d", "30d", "90d", "all"] as const;
export type CreatorDashboardJanela = (typeof CREATOR_DASHBOARD_JANELAS)[number];

export const CREATOR_DASHBOARD_JANELA_PADRAO: CreatorDashboardJanela = "30d";

export function isCreatorDashboardJanela(
  valor: unknown,
): valor is CreatorDashboardJanela {
  return (
    typeof valor === "string" &&
    (CREATOR_DASHBOARD_JANELAS as readonly string[]).includes(valor)
  );
}

/** Link de divulgacao de um codigo. Fonte unica: o painel nao monta outro. */
export const CREATOR_REF_LINK_BASE = "https://boranatech.com.br/planos?ref=";

export function linkDoCodigo(code: string): string {
  return `${CREATOR_REF_LINK_BASE}${encodeURIComponent(code)}`;
}

// ---------------------------------------------------------------------------
// QUADRO DO ADMIN (GET /api/admin/creators e /creators/resumo)
// ---------------------------------------------------------------------------

export const CREATOR_BOARD_STATUS = ["active", "revoked", "all"] as const;
export type CreatorBoardStatus = (typeof CREATOR_BOARD_STATUS)[number];

export function isCreatorBoardStatus(
  valor: unknown,
): valor is CreatorBoardStatus {
  return (
    typeof valor === "string" &&
    (CREATOR_BOARD_STATUS as readonly string[]).includes(valor)
  );
}

export const CREATOR_BOARD_KINDS = ["influencer", "afiliado", "all"] as const;
export type CreatorBoardKind = (typeof CREATOR_BOARD_KINDS)[number];

export function isCreatorBoardKind(valor: unknown): valor is CreatorBoardKind {
  return (
    typeof valor === "string" &&
    (CREATOR_BOARD_KINDS as readonly string[]).includes(valor)
  );
}

/** Uma linha do quadro: a concessao MAIS RECENTE da pessoa e a soma dos codigos. */
export type CreatorBoardItem = {
  user_id: string;
  kind: "influencer" | "afiliado";
  granted_at: string;
  revoked_at: string | null;
  name: string | null;
  email: string | null;
  handle: string | null;
  avatar_url: string | null;
  codigos_count: number;
  codigos: Array<{ code: string; status: string }>;
  /** Soma dos CONTADORES dos codigos do creator. */
  totais: {
    clicks: number;
    sales: number;
    revenue_cents: number;
    commission_due_cents: number;
    commission_paid_cents: number;
  };
  /** Ultimo evento de qualquer tipo entre os codigos; null sem evento. */
  ultimo_evento_at: string | null;
  /**
   * Se o creator cadastrou chave Pix (lote 08). OPCIONAL por causa da janela
   * de deploy: o backend anterior nao manda o campo, e ausente e "nao sei",
   * nunca "sem chave".
   */
  tem_pix?: boolean;
  /** @ do Instagram declarado no perfil de creator (lote 08). Opcional idem. */
  instagram_handle?: string | null;
  /**
   * Publicacoes registradas no mes civil de Brasilia corrente (lote 09).
   * Opcional pelo mesmo motivo dos dois acima: o backend anterior nao manda o
   * campo, e ausente e "nao sei", nunca zero.
   */
  posts_no_mes?: number;
  /**
   * Publicacoes PENDENTES de conferencia, de qualquer mes (lote 10b). E a
   * pendencia do admin, nao um numero do ranking; por isso sem corte de mes.
   * Opcional pelo mesmo motivo dos outros: o backend anterior nao manda.
   */
  posts_aguardando?: number;
};

/** Mesmo formato das outras listas paginadas do admin: total no corpo. */
export type CreatorBoardPage = {
  rows: CreatorBoardItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreatorBoardResumo = {
  creators_ativos: { influencer: number; afiliado: number };
  /** Vinculados = com dono (affiliates.user_id preenchido). */
  codigos: { vinculados: number; sem_dono: number };
  /** Pelos EVENTOS, dos codigos vinculados, desde o inicio de `desde`. */
  eventos_30d: { desde: string; clicks: number; sales: number };
  /** Pelos CONTADORES dos codigos vinculados. */
  commission_due_cents: number;
};

// ---------------------------------------------------------------------------
// PAINEL (GET /api/creator/me e /api/admin/creators/:userId)
// ---------------------------------------------------------------------------

/**
 * INICIO GLOBAL DA MEDICAO DE CLIQUES: o deploy do lote 01 (commit d6a0b93c),
 * quando `creator_events` passou a receber cliques. E o marco de cliques de
 * TODO creator, e nao o primeiro clique de cada um: entre este instante e o
 * primeiro clique de um creator, zero clique e zero de verdade (a medicao ja
 * existia), e antes dele nao ha medicao nenhuma.
 */
export const INICIO_MEDICAO_CLIQUES = "2026-09-14T05:10:00Z";

/** Somas de eventos num intervalo (de `creator_events`, nunca dos contadores). */
export type CreatorEventosSomas = {
  clicks: number;
  checkouts: number;
  sales: number;
  revenue_cents: number;
  commission_cents: number;
};

export type CreatorDashboardSerieDia = { dia: string } & CreatorEventosSomas;

export type CreatorDashboardCodigo = {
  id: string;
  code: string;
  status: string;
  discount_percent: number;
  commission_percent: number;
  link: string;
  clicks: number;
  sales: number;
  revenue_cents: number;
  commission_due_cents: number;
  commission_paid_cents: number;
  /** `affiliates.created_at` e nullable no schema; null e "sem data", nao erro. */
  created_at: string | null;
  /** So na visao admin (nota interna do codigo). Ausente na visao creator. */
  notes?: string | null;
};

export type CreatorDashboard = {
  creator: {
    kind: "influencer" | "afiliado";
    granted_at: string;
    /** Sempre null na visao creator (so a concessao ativa abre o painel). */
    revoked_at: string | null;
    /** So na visao admin. Ausente na visao creator. */
    granted_by?: string | null;
  };
  perfil: {
    name: string | null;
    handle: string | null;
    /** Alias de `avatar.avatar_url` desde o lote 11b (client anterior). */
    avatar_url: string | null;
    /** O avatar como o site o desenha (lote 11b). Opcional no tipo pela
     * janela de deploy: o backend anterior nao manda. */
    avatar?: AvatarDeCreator;
    /** So na visao admin. Ausente na visao creator. */
    email?: string | null;
  };
  /**
   * Perfil de creator (redes, seguidores declarados, consentimento e a chave
   * Pix MASCARADA). So na visao admin, no mesmo estilo de `email`: o proprio
   * creator le o perfil em GET /api/creator/profile, a parte, para o painel de
   * numeros nao esperar por ele.
   */
  perfil_creator?: CreatorPerfilDados;
  janela: CreatorDashboardJanela;
  /** Dos CONTADORES de affiliates, desde sempre. Nunca somados com eventos. */
  totais: {
    clicks: number;
    sales: number;
    revenue_cents: number;
    commission_due_cents: number;
    commission_paid_cents: number;
    /** sales / clicks * 100 com duas casas; null quando clicks = 0. */
    conversao_pct: number | null;
  };
  codigos: CreatorDashboardCodigo[];
  /** De creator_events. Cada tipo de evento vale a partir do proprio marco. */
  eventos: {
    /**
     * `INICIO_MEDICAO_CLIQUES` quando o creator tem codigo; null sem codigo.
     * Antes deste marco a serie de cliques e AUSENCIA de medicao, e nao zero.
     */
    clicks_since: string | null;
    /**
     * Instante da primeira VENDA gravada, ou null. Vendas anteriores ao lote 01
     * foram reconstruidas das assinaturas pagas (migration 20260915100000), entao
     * este marco pode ser anterior a `clicks_since`.
     */
    sales_since: string | null;
    /**
     * @deprecated Alias de `clicks_since`, mantido por um lote para o bundle em
     * cache que ainda le este nome (expand/contract). Remover a partir de
     * 2026-09-22.
     */
    events_since: string | null;
    /**
     * Um item por dia civil de Brasilia, do inicio da janela (ou do primeiro
     * evento de qualquer tipo, o que vier depois) ate hoje, com zeros nos dias
     * sem evento. Vazia quando nao ha evento nenhum. Os dias anteriores a
     * `clicks_since` trazem `clicks: 0` aqui; e o client que os desenha como
     * ausentes.
     */
    serie: CreatorDashboardSerieDia[];
    periodo: CreatorEventosSomas;
    /**
     * Mesmo numero de dias civis imediatamente antes da janela; null so em
     * "all". Um periodo anterior a `clicks_since` soma zero de clique por falta
     * de medicao: cabe ao client comparar com `clicks_since` antes de exibir o
     * delta.
     */
    periodo_anterior: CreatorEventosSomas | null;
    ultimo_click_at: string | null;
    ultima_venda_at: string | null;
  };
};
