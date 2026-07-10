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
