import { EVENTO_UF_NACIONAL, estadosBrasil } from "./data";

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
    return "Brasil — nacional ou itinerante";
  }
  const u = estadosBrasil.find((x) => x.sigla === estado);
  return u ? u.nome : estado;
}
