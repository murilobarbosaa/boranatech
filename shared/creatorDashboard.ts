// Contrato do painel de creator: o que `montarPainelDoCreator`
// (server/lib/creatorDashboard.ts) devolve, e o que o client do lote 03 le.
// Vive em shared/ para os dois lados compilarem contra o MESMO tipo.
//
// Nao importa nada de server/: o client nao pode puxar codigo de servidor. Por
// isso o kind e reescrito aqui como uniao literal; o `CreatorKind` de
// server/lib/creatorKind.ts e atribuivel a ele.

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
    avatar_url: string | null;
    /** So na visao admin. Ausente na visao creator. */
    email?: string | null;
  };
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
  /** De creator_events, e so a partir de `events_since`. */
  eventos: {
    /** Instante do primeiro evento gravado para estes codigos, ou null. */
    events_since: string | null;
    /**
     * Um item por dia civil de Brasilia, do inicio da janela (ou de
     * `events_since`, o que vier depois) ate hoje, com zeros nos dias sem
     * evento. Vazia quando `events_since` e null.
     */
    serie: CreatorDashboardSerieDia[];
    periodo: CreatorEventosSomas;
    /**
     * Mesmo numero de dias civis imediatamente antes da janela; null so em
     * "all". Um periodo anterior a `events_since` soma zero: cabe ao client
     * comparar com `events_since` antes de exibir o delta.
     */
    periodo_anterior: CreatorEventosSomas | null;
    ultimo_click_at: string | null;
    ultima_venda_at: string | null;
  };
};
