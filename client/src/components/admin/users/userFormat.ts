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

/**
 * Data de um INSTANTE com o fuso PINADO em Brasilia, para a lista do admin.
 *
 * DIFERENTE de `fmtDate`, que usa o fuso da maquina. A diferenca e deliberada e
 * so aparece fora do Brasil: `last_sign_in_at` e um instante, e o dia dele muda
 * conforme o fuso de quem olha. Pinar Brasilia faz dois admins em fusos
 * diferentes lerem a MESMA data para o mesmo acesso, que e o que uma tabela
 * operacional precisa.
 *
 * NAO e offset fixo de -3h: o nome do fuso e quem sabe o offset, e escrever -3
 * transformaria a ausencia atual de horario de verao em regra (ver o cabecalho
 * de shared/brasiliaDay.ts).
 */
const diaBrasiliaFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const instanteBrasiliaFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
  timeStyle: "medium",
});

export function fmtDataBrasilia(value: string | null | undefined): string {
  if (!value) return NAO_INFORMADO;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return NAO_INFORMADO;
  return diaBrasiliaFmt.format(date);
}

/** O instante COMPLETO, para o `title` do hover: a data sozinha perde a hora. */
export function fmtInstanteBrasilia(value: string | null | undefined): string {
  if (!value) return NAO_INFORMADO;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return NAO_INFORMADO;
  return `${instanteBrasiliaFmt.format(date)} (America/Sao_Paulo)`;
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

// Rotulos revisados e aprovados em 2026-07-29. "Automática"/"Manual" ficam
// como estao: o rotulo do Field ja e "Renovação", entao o valor nao precisa se
// reexplicar.
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

// Rotulos de subscription_status. As CORES sao as do SubscribersTable, mas o
// conjunto e maior: aquela tela nao conhece `pending` (boleto) nem
// `superseded`, e os renderiza crus. Nao quebra, porque o acesso la tem guarda
// (`meta?.label ?? status`), mas e a mesma divida com outro dono.
//
// Aqui e resolver com fallback de propósito: a Stripe pode introduzir status
// novo a qualquer momento, e valor desconhecido tem que aparecer cru em vez de
// derrubar a tela.
const SUBSCRIPTION_STATUS_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  active: {
    label: "Ativa",
    className: "border-emerald-600 bg-emerald-50 text-emerald-700",
  },
  trialing: {
    label: "Em teste",
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
    label: "Aguardando pagamento",
    className: "border-amber-500 bg-amber-50 text-amber-700",
  },
  // Escrito como literal por server/providers/stripe.ts quando uma assinatura
  // nova substitui a anterior da mesma pessoa. Nao vem da Stripe e nao passa
  // por mapStatus, entao nao aparecia em nenhuma lista derivada dos status do
  // provedor.
  superseded: {
    label: "Substituída",
    className: "border-slate-400 bg-slate-100 text-slate-600",
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

/**
 * Mesmo rotulo do selo da lista, para o DETALHE.
 *
 * Existia so o selo, e o detalhe passava `fmtText` no valor cru: "active"
 * aparecia em ingles e em snake_case no campo Status, no selo mais comum da
 * base inteira. As duas telas agora leem o MESMO mapa, entao nao ha como
 * divergirem de novo.
 */
export function subscriptionStatusLabelOf(
  status: string | null | undefined,
): string {
  if (!status) return NAO_INFORMADO;
  return SUBSCRIPTION_STATUS_BADGES[status]?.label ?? status;
}

/**
 * Rotulos de plano. Os textos NAO sao invencao: sao os `plans.name` que a
 * propria tabela guarda, conferidos contra producao em 2026-07-30. Duplicar o
 * nome aqui em vez de ler da tabela e deliberado, porque `plan_code` chega em
 * lugares que nao carregam o registro do plano junto (linha da lista, extrato,
 * dialogo de cancelamento).
 */
export const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  pro_monthly: "Pro Mensal",
  pro_semiannual: "Pro Semestral",
  pro_annual: "Pro Anual",
};

/** Resolver COM FALLBACK: plano novo aparece cru, nao quebra a tela. */
export function planLabelOf(code: string | null | undefined): string {
  if (!code) return NAO_INFORMADO;
  return PLAN_LABELS[code] ?? code;
}

/**
 * Motivos de cancelamento. Os 6 valores que o CHECK de
 * subscription_cancellations.reason_code permite.
 *
 * Existe um mapa igual em CancellationReasonsDashboard.tsx (aba Retenção), que
 * nao e escopo desta fatia. A divergencia entre os dois e travada por teste em
 * userFormat.test.ts, entao ela nao pode acontecer em silencio.
 */
export const CANCELLATION_REASON_LABELS: Record<string, string> = {
  expensive: "Está caro",
  unused: "Não estava usando",
  missing_feature: "Faltou funcionalidade",
  paused: "Vai pausar, volta depois",
  other: "Outro motivo",
  admin: "Cancelado pelo admin",
};

/** Resolver COM FALLBACK: motivo novo aparece cru. */
export function cancellationReasonLabelOf(
  code: string | null | undefined,
): string {
  if (!code) return NAO_INFORMADO;
  return CANCELLATION_REASON_LABELS[code] ?? code;
}

/**
 * Devolve a URL se ela for segura para virar href; senao null (o chamador
 * renderiza texto cru).
 *
 * ALLOWLIST de esquema, nunca blocklist. As URLs de perfil sao escritas pelo
 * PROPRIO usuario (server/routes/me.ts as aceita em EDITABLE_FIELDS), e o admin
 * e quem tem mais privilegio na plataforma: um `javascript:` que chegasse a um
 * href aqui seria XSS mirando exatamente a conta mais valiosa.
 *
 * Sem esquema tambem e null, de proposito: completar "github.com/x" para
 * "https://github.com/x" seria inventar dado que o usuario nao escreveu.
 */
export function safeHttpUrl(value: string | null | undefined): string | null {
  const bruto = (value ?? "").trim();
  if (!bruto) return null;
  try {
    const url = new URL(bruto);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return bruto;
  } catch {
    return null;
  }
}

// Modo do avatar. Resolver COM FALLBACK: antes, qualquer valor diferente de
// "photo" virava "Ícone", entao um modo novo do backend fazia a tela afirmar
// com confianca algo que ela nao sabia. Desconhecido mostra o valor cru.
const AVATAR_MODE_LABELS: Record<string, string> = {
  photo: "Foto",
  icon: "Ícone",
};

export function avatarModeLabelOf(mode: string | null | undefined): string {
  if (!mode) return NAO_INFORMADO;
  return AVATAR_MODE_LABELS[mode] ?? mode;
}

/**
 * O campo esta vazio? Decidido a partir do DADO DE ORIGEM, nunca do texto ja
 * formatado.
 *
 * Existe porque o Field comparava `value === NAO_INFORMADO` para esmaecer, o
 * que amarrava estilo a uma string de copy: revisar "Não informado" na Fatia 3
 * apagaria o esmaecido de todos os campos vazios, em silencio.
 *
 * E existe como funcao COMPARTILHADA, e nao como `empty={!valor}` em cada call
 * site, por causa de duas armadilhas: `false` (opt-in recusado) e `0` (valor
 * pago zero, passo zero do onboarding) sao dados de verdade, e um `!valor`
 * ingenuo esmaeceria os dois.
 */
export function semValor(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
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
