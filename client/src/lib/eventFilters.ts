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

// O que morava daqui para baixo (RECORRENTE_RE, isEventoRecorrente,
// isEventoPassado, eventoSortKey, formatEventoData) foi removido em 2026-08-24.
// Motivo: os tres eram inferencia sobre TEXTO LIVRE (regex no campo `data`,
// comparacao de string YYYYMMDD) porque o array estatico nao tinha o dado
// estruturado. O banco tem: `recurrence`, `date_status` e `starts_on` como
// colunas, e o filtro de exibiveis virou predicado SQL na rota
// /api/content/eventos. O que sobreviveu aqui e so o que nao dependia disso:
// os rotulos de filtro e o mapeamento de UF, este ultimo tambem usado por
// Comunidades.
