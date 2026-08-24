import { apiFetch } from "./contentApi";

/**
 * Eventos da pagina /eventos, servidos de public.external_events.
 *
 * DESVIO DELIBERADO do padrao deste diretorio: `contentService` envolve toda
 * chamada num `try/catch` que devolve o array estatico correspondente quando a
 * API falha. Aqui nao existe estatico para cair, porque o array `eventos` de
 * eventosData.ts foi removido no mesmo deploy que criou esta rota. Um catch que
 * devolvesse `[]` transformaria "nao consegui carregar" em "nao ha eventos", que
 * e a mesma tela para duas condicoes opostas, e foi assim que a aba Eventos do
 * admin ficou tres meses respondendo 500 sem ninguem notar.
 *
 * Entao o erro PROPAGA, e quem chama decide como nomea-lo: a pagina mostra
 * estado de erro com retry, e as secoes da home se escondem, cada uma no padrao
 * das suas vizinhas.
 */

/** Linha crua de external_events, na projecao da rota /content/eventos. */
interface EventoRow {
  id: string;
  external_id: string | null;
  title: string;
  description: string | null;
  organizer: string | null;
  event_type: string | null;
  url: string;
  calendar_url: string | null;
  price_type: string | null;
  price_label: string | null;
  starts_on: string | null;
  ends_on: string | null;
  date_label: string | null;
  time_label: string | null;
  date_status: string | null;
  recurrence: string | null;
  modality: string | null;
  city: string | null;
  uf: string | null;
  state: string | null;
  location_label: string | null;
}

export interface Evento {
  /** Chave de favorito e de lista. `external_id` quando existe, uuid como reserva. */
  id: string;
  uuid: string;
  nome: string;
  descricao: string;
  organizador: string;
  categoria: string;
  link: string;
  calendarUrl: string | null;
  logoUrl: string;
  precoTipo: string | null;
  valor: string;
  /** `YYYY-MM-DD` ou null. Null e recorrente ou a confirmar, nunca "sem informacao". */
  inicio: string | null;
  fim: string | null;
  dataLabel: string;
  horario: string;
  /** True quando o evento nao tem uma data unica que "passa". */
  recorrente: boolean;
  formato: string;
  cidade: string;
  uf: string | null;
  estadoLabel: string;
  local: string;
}

/**
 * Favicon derivado do host da URL, do mesmo jeito que o array estatico
 * pre-computava em `logoUrl`. Fica no client porque e derivacao pura: guardar
 * no banco seria duplicar o que a URL ja diz.
 */
function faviconDe(url: string): string {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;
  } catch {
    return "";
  }
}

function eventoFromApi(row: EventoRow): Evento {
  const inicio = row.starts_on;
  return {
    id: row.external_id || row.id,
    uuid: row.id,
    nome: row.title,
    descricao: row.description || "",
    organizador: row.organizer || "",
    categoria: row.event_type || "",
    link: row.url,
    calendarUrl: row.calendar_url,
    logoUrl: faviconDe(row.url),
    precoTipo: row.price_type,
    valor: row.price_label || "",
    inicio,
    fim: row.ends_on,
    dataLabel: row.date_label || "",
    horario: row.time_label || "",
    // Criterio ESTRUTURADO, no lugar do regex sobre texto livre que a pagina
    // usava antes: o banco declara recorrencia e status de data em coluna.
    recorrente:
      (row.recurrence !== null && row.recurrence !== "unico") ||
      row.date_status === "a_confirmar" ||
      inicio === null,
    formato: row.modality || "",
    cidade: row.city || "",
    uf: row.uf,
    estadoLabel: row.state || "",
    local: row.location_label || "",
  };
}

export interface EventosPayload {
  eventos: Evento[];
  /** Total no banco com os mesmos filtros. Null significa "o backend nao informou". */
  total: number | null;
}

export async function getEventos(): Promise<EventosPayload> {
  const json = await apiFetch("/eventos");
  const rows: EventoRow[] = Array.isArray(json.data) ? json.data : [];
  return {
    eventos: rows.map(eventoFromApi),
    total: typeof json.total === "number" ? json.total : null,
  };
}
