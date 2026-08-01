import { formatBrasiliaDateTime } from "@/lib/brasiliaTime";

// Data relativa em portugues para comentarios e histórico.
//
// Por que uma funcao nova em vez de reusar: o projeto tem TRES implementacoes
// ad hoc disso (NotificationsPanel, VagasJobCard; a terceira saiu com o BugsDashboard na Fase 5), todas locais,
// nenhuma exportada, e nenhuma com relogio injetavel. Unificar as tres e
// refatoracao fora do escopo desta fase; o que esta aqui e o que este modulo
// precisa, com duas diferencas que as outras nao tem: `now` entra por parametro
// (teste de data que le Date.now() de verdade e falso-verde esperando acontecer)
// e acima de uma semana devolve data ABSOLUTA, porque "há 431 dias" nao informa
// nada.
//
// O fuso e o de Brasilia, o mesmo do resto do admin (lib/brasiliaTime.ts), e nao
// o do navegador: "ontem" precisa ser ontem para quem opera o painel.

const BRASILIA_TZ = "America/Sao_Paulo";
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const dayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: BRASILIA_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Dia do calendario em Brasilia, como AAAA-MM-DD. */
function brasiliaDay(ms: number): string {
  return dayFmt.format(new Date(ms));
}

/** Diferenca em DIAS DE CALENDARIO, nao em multiplos de 24h. */
function calendarDaysBetween(fromMs: number, toMs: number): number {
  const from = Date.parse(`${brasiliaDay(fromMs)}T00:00:00Z`);
  const to = Date.parse(`${brasiliaDay(toMs)}T00:00:00Z`);
  return Math.round((to - from) / DAY);
}

/**
 * `iso` formatado em relacao a `nowMs`.
 *
 * `nowMs` e obrigatorio de propósito: nao ha default lendo Date.now(). Um
 * default tornaria trivial escrever teste que passa por acaso, e a chamada real
 * fica igualmente explicita.
 */
export function relativeTime(iso: string | null, nowMs: number): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";

  const diff = nowMs - ms;

  // Instante no futuro (relogio do servidor adiantado, ou data de vencimento):
  // nao inventa "há -3 min", devolve o absoluto.
  if (diff < -MINUTE) return formatBrasiliaDateTime(iso);

  if (diff < 45_000) return "agora";
  if (diff < HOUR) {
    const minutes = Math.max(1, Math.round(diff / MINUTE));
    return `há ${minutes} min`;
  }
  if (diff < DAY) {
    const hours = Math.max(1, Math.floor(diff / HOUR));
    return `há ${hours} h`;
  }

  const days = calendarDaysBetween(ms, nowMs);
  if (days <= 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  // Acima de uma semana, o absoluto informa mais que o relativo.
  return formatBrasiliaDateTime(iso);
}

/**
 * `AAAA-MM-DD` (coluna `date`) em `dd/mm/aaaa`.
 *
 * Nao passa por `new Date()`: o construtor interpreta "2026-07-28" como UTC e,
 * em fuso negativo, `toLocaleDateString` devolveria o DIA ANTERIOR. Como a
 * string ja e o dia, o formato e recorte puro.
 *
 * Existe aqui, e nao numa terceira copia, porque o histórico tambem precisa dele
 * (taskActivityMeta) e o campo de vencimento passou a precisar.
 */
export function formatIsoDay(value: string | null | undefined): string {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}
