import { EVENTO_UF_NACIONAL, estadosBrasil } from "./eventosData";

/** Rótulos visíveis nos `<label>` acima dos `<select>` (não entram como opções). */
export const LABEL_FILTROS = {
  categoria: "Tipo do evento",
  modalidade: "Modalidade",
  estado: "Estado",
} as const;

export type EstadoUfSigla = (typeof estadosBrasil)[number]["sigla"];

export const ESTADO_UF_OPTS = estadosBrasil;

export function rotuloEstadoEvento(estado: string): string {
  if (estado === EVENTO_UF_NACIONAL) {
    return "Brasil: nacional ou itinerante";
  }
  const u = estadosBrasil.find((x) => x.sigla === estado);
  return u ? u.nome : estado;
}

/** Texto de data que indica evento recorrente (não tem uma data única que "passa"). */
const RECORRENTE_RE =
  /(mensal|quinzenal|semanal|bimestral|trimestral|anual|cont[ií]nuo|ao longo do ano|v[áa]rios|varia|duas vezes|a confirmar)/i;

export function isEventoRecorrente(data: string): boolean {
  return RECORRENTE_RE.test(data ?? "");
}

/**
 * Evento já passou quando tem uma data única (não recorrente) cujo dia final é
 * anterior a hoje. Eventos recorrentes ou sem data válida nunca são ocultados.
 */
export function isEventoPassado(
  evento: { data: string; calendarEnd: string },
  now: Date = new Date(),
): boolean {
  if (isEventoRecorrente(evento.data)) return false;
  const datePart = (evento.calendarEnd ?? "").slice(0, 8);
  if (!/^\d{8}$/.test(datePart)) return false;
  const hoje = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return datePart < hoje;
}

const MESES_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function hojeYYYYMMDD(now: Date): string {
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Chave de ordenação: eventos com `calendarStart` válido e futuro (ou hoje) usam
 * a própria data (YYYYMMDD); sem data, inválida ou vencida vão pro fim ("99999999").
 */
export function eventoSortKey(
  evento: { calendarStart: string },
  now: Date = new Date(),
): string {
  const start = (evento.calendarStart ?? "").slice(0, 8);
  if (!/^\d{8}$/.test(start)) return "99999999";
  return start >= hojeYYYYMMDD(now) ? start : "99999999";
}

/**
 * Texto de data a exibir: com `calendarStart` válido e futuro, formata a data
 * real em português a partir de calendarStart/calendarEnd; caso contrário mantém
 * o texto de `evento.data` (correto para recorrente sem data confirmada).
 */
export function formatEventoData(
  evento: { data: string; calendarStart: string; calendarEnd: string },
  now: Date = new Date(),
): string {
  const start = (evento.calendarStart ?? "").slice(0, 8);
  if (!/^\d{8}$/.test(start) || start < hojeYYYYMMDD(now)) return evento.data;
  const endRaw = (evento.calendarEnd ?? "").slice(0, 8);
  const end = /^\d{8}$/.test(endRaw) ? endRaw : start;

  const diaInicio = Number(start.slice(6, 8));
  const mesInicio = MESES_PT[Number(start.slice(4, 6)) - 1] ?? "";
  const anoInicio = start.slice(0, 4);
  const diaFim = Number(end.slice(6, 8));
  const mesFim = MESES_PT[Number(end.slice(4, 6)) - 1] ?? "";
  const anoFim = end.slice(0, 4);

  if (start === end) {
    return `${diaInicio} de ${mesInicio} de ${anoInicio}`;
  }
  if (start.slice(0, 6) === end.slice(0, 6)) {
    return `${diaInicio} a ${diaFim} de ${mesInicio} de ${anoInicio}`;
  }
  return `${diaInicio} de ${mesInicio} a ${diaFim} de ${mesFim} de ${anoFim}`;
}
