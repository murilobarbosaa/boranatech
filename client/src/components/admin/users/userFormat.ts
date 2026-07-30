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

export function displayName(row: UserRow): string {
  if (row.name && row.name.trim()) return row.name.trim();
  const email = row.email || "";
  if (email.includes("@")) return email.split("@")[0];
  return "Usuário";
}
