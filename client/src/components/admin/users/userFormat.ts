import type { UserRow } from "./types";

// Formatadores puros do modulo de Usuarios. Movidos verbatim de
// UsersDashboard.tsx na extracao do modulo: mesmas regras, mesmos textos de
// saida. Sem React aqui de proposito, para poderem ser testados direto.

export const NAO_INFORMADO = "Não informado";

export function fmtText(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed || NAO_INFORMADO;
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return NAO_INFORMADO;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return NAO_INFORMADO;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return NAO_INFORMADO;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return NAO_INFORMADO;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function fmtBool(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return NAO_INFORMADO;
  return value ? "Sim" : "Não";
}

export function fmtBrl(cents: number | null | undefined): string {
  if (typeof cents !== "number") return NAO_INFORMADO;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

// TODO(Ana): revisar os rotulos de metodo de pagamento e tipo de renovacao.
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "Cartão",
  pix: "Pix",
  boleto: "Boleto",
};

export const RENEWAL_TYPE_LABELS: Record<string, string> = {
  auto: "Automática",
  manual: "Manual",
};

export function labelFrom(
  map: Record<string, string>,
  value: string | null | undefined,
): string {
  if (!value) return NAO_INFORMADO;
  return map[value] ?? value;
}

// Rotulos do activity_status (derivado no servidor de last_sign_in_at). So
// aparece no detalhe: a lista nao paga o scan de Auth necessario para saber isso.
export const ACTIVITY_STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  never: "Nunca acessou",
};

// Resolver COM FALLBACK, no molde de notificationTypeMetaOf: nunca devolve
// undefined. Acesso direto ao mapa (`ACTIVITY_STATUS_LABELS[valor]`) e a forma
// que ja derrubou o admin em producao com "Cannot read properties of undefined";
// basta o backend passar a emitir um estado que o bundle em execucao nao
// conhece, e o frontend nao sobe junto com o backend.
export function activityStatusLabelOf(
  status: string | null | undefined,
): string {
  if (!status) return NAO_INFORMADO;
  return ACTIVITY_STATUS_LABELS[status] ?? status;
}

// Selo de ORIGEM do acesso Pro. Assinatura e concessao de influencer sao
// ortogonais (as duas podem valer ao mesmo tempo), e a diferenca e operacional,
// nao cosmetica: cancelar a assinatura de um influencer NAO tira o Pro dele.
// A lista precisa mostrar isso antes de alguem cancelar e ficar sem entender.
const PRO_BADGES: Record<string, { label: string; className: string }> = {
  subscription: {
    label: "Pro",
    className: "border-slate-900 bg-yellow-300 text-slate-950",
  },
  influencer: {
    label: "Influencer",
    className: "border-violet-800 bg-violet-100 text-violet-900",
  },
  both: {
    label: "Pro + Influencer",
    className: "border-violet-800 bg-violet-200 text-violet-950",
  },
};

const SEM_PRO_BADGE = {
  label: "Grátis",
  className: "border-emerald-700 bg-emerald-50 text-emerald-800",
};

const ORIGEM_DESCONHECIDA = "border-slate-400 bg-slate-100 text-slate-600";

// Resolver COM FALLBACK (molde de notificationTypeMetaOf): uma terceira origem
// de Pro pode nascer no backend antes de o bundle do front subir.
export function proBadgeOf(source: string | null | undefined): {
  label: string;
  className: string;
} {
  if (!source) return SEM_PRO_BADGE;
  return (
    PRO_BADGES[source] ?? { label: source, className: ORIGEM_DESCONHECIDA }
  );
}

// Rotulos de subscription_status. Mesmo conjunto e mesmas cores do
// SubscribersTable, para as duas telas nao divergirem, mas atras de um resolver
// com fallback: la o acesso e direto ao mapa, e a Stripe pode introduzir status
// novo a qualquer momento.
const SUBSCRIPTION_STATUS_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  active: {
    label: "Ativa",
    className: "border-emerald-600 bg-emerald-50 text-emerald-700",
  },
  trialing: {
    label: "Trial",
    className: "border-blue-500 bg-blue-50 text-blue-700",
  },
  past_due: {
    label: "Inadimplente",
    className: "border-amber-500 bg-amber-50 text-amber-700",
  },
  canceled: {
    label: "Cancelada",
    className: "border-slate-400 bg-slate-100 text-slate-600",
  },
  incomplete: {
    label: "Incompleta",
    className: "border-rose-400 bg-rose-50 text-rose-700",
  },
  pending: {
    label: "Pendente",
    className: "border-amber-500 bg-amber-50 text-amber-700",
  },
};

/** null quando a pessoa nunca assinou: a coluna fica vazia em vez de inventar. */
export function subscriptionStatusBadgeOf(
  status: string | null | undefined,
): { label: string; className: string } | null {
  if (!status) return null;
  return (
    SUBSCRIPTION_STATUS_BADGES[status] ?? {
      label: status,
      className: ORIGEM_DESCONHECIDA,
    }
  );
}

// Iniciais para o circulo do avatar da lista. Nao busca avatar_url de proposito:
// a linha ja tem o nome, e uma foto por linha custaria 50 requisicoes de imagem
// por pagina. Mesma linguagem visual do avatar de sessao do AdminShell.
export function initialsOf(name: string | null | undefined): string {
  const partes = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

export function displayName(row: UserRow): string {
  if (row.name && row.name.trim()) return row.name.trim();
  const email = row.email || "";
  if (email.includes("@")) return email.split("@")[0];
  return "Usuário";
}
