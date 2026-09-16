import {
  diaBrasilia,
  inicioDoDiaBrasilia,
  somarDiaCivil,
} from "../../shared/brasiliaDay";
import {
  LIMITE_DE_PEDIDOS_POR_DIA,
  limitesDoMes,
  normalizarMensagemDeCollab,
  normalizarNota,
  validarDataDeMarcacao,
  type CodigoDaData,
  type CodigoDaMensagem,
  type CodigoDaNota,
} from "../../shared/creatorCalendar";
import {
  REDES_DE_CREATOR,
  type RedeDeCreator,
  type Resultado,
} from "../../shared/creatorProfile";
import type { Linha } from "./creatorDashboard";
import { textoDe } from "./creatorDashboard";
import { erroEncadeavel } from "./supabaseError";
import { supabaseAdmin } from "./supabaseAdmin";

/**
 * CALENDARIO COMPARTILHADO DOS CREATORS (lote 10): toda leitura e escrita de
 * `creator_calendar_events` e `creator_collab_requests` passa por aqui.
 *
 * NAO CONFUNDIR COM `creatorEvents.ts`: aquele grava `creator_events`, que e
 * telemetria de afiliado (clique, checkout, venda), e nao tem relacao nenhuma
 * com este calendario. Por isso nada aqui se chama "evento": a marcacao de um
 * dia e uma MARCACAO, e o nome da tabela (`creator_calendar_events`) e o unico
 * lugar em que a palavra aparece.
 *
 * O CALENDARIO E DE TODOS. A leitura do mes devolve as marcacoes de todos os
 * creators, e nao so as de quem pediu: e assim que duas pessoas evitam falar do
 * mesmo assunto no mesmo dia, que e o problema que isto existe para resolver. O
 * recorte por dono aparece so na ESCRITA (marcar e desmarcar so o proprio).
 *
 * ERRO LANCA, e linha fora do formato tambem: a rota transforma em 500. Um mes
 * vazio com 200 seria indistinguivel de "ninguem marcou nada".
 */

/** Teto de marcacoes lidas num mes. Um mes com mais de 500 marcacoes de todos
 * os creators somados nao existe hoje; quando existir, isto vira paginacao por
 * semana, e nao um teto maior. */
const TETO_DO_MES = 500;

/** Teto de pedidos lidos numa aba. Mesma logica do teto do mes. */
const TETO_DE_PEDIDOS = 200;

const COLUNAS_DA_MARCACAO =
  "id, user_id, event_date, network, note, created_at";
const COLUNAS_DO_PEDIDO =
  "id, event_id, requester_id, owner_id, message, status, created_at, responded_at";

export type AutorDaMarcacao = {
  user_id: string;
  name: string | null;
  handle: string | null;
};

export type MarcacaoDoCalendario = {
  id: string;
  user_id: string;
  event_date: string;
  network: RedeDeCreator;
  note: string | null;
  created_at: string;
  autor: AutorDaMarcacao | null;
};

export type StatusDoPedido = "pendente" | "aceita" | "recusada";

export type PedidoDeCollab = {
  id: string;
  event_id: string;
  requester_id: string;
  owner_id: string;
  message: string | null;
  status: StatusDoPedido;
  created_at: string;
  responded_at: string | null;
  /** Dia e rede da marcacao do pedido. Nunca nulos: ver `montarPedidos`. */
  event_date: string;
  network: RedeDeCreator;
  /** O OUTRO lado: o dono, na lista de enviados; quem pediu, na de recebidos. */
  outra_pessoa: AutorDaMarcacao | null;
};

/** Nome e e-mail de um creator, para a notificacao e o e-mail. */
export type ContatoDoCreator = {
  user_id: string;
  name: string | null;
  email: string | null;
};

export type CodigoDeMarcacao =
  | CodigoDaData
  | CodigoDaNota
  | "invalid_network"
  | "event_already_marked";

export type CodigoDoPedido =
  | CodigoDaMensagem
  | "event_not_found"
  | "own_event"
  | "collab_already_requested"
  | "collab_daily_limit";

export type CodigoDaResposta = "collab_not_found" | "collab_already_answered";

// ---------------------------------------------------------------------------
// LEITURA DE LINHA
// ---------------------------------------------------------------------------

function redeDaLinha(valor: unknown): RedeDeCreator {
  if (
    typeof valor !== "string" ||
    !(REDES_DE_CREATOR as readonly string[]).includes(valor)
  ) {
    throw new Error(`[creatorCalendar] network desconhecida: ${String(valor)}`);
  }
  return valor as RedeDeCreator;
}

const STATUS: readonly string[] = ["pendente", "aceita", "recusada"];

function statusDaLinha(valor: unknown): StatusDoPedido {
  if (typeof valor !== "string" || !STATUS.includes(valor)) {
    throw new Error(`[creatorCalendar] status desconhecido: ${String(valor)}`);
  }
  return valor as StatusDoPedido;
}

function textoOuNulo(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== "string") {
    throw new Error(`[creatorCalendar] texto invalido: ${String(valor)}`);
  }
  return valor;
}

function lerMarcacao(
  linha: Linha,
  autores: Map<string, AutorDaMarcacao>,
): MarcacaoDoCalendario {
  const userId = textoDe(linha.user_id, "user_id");
  return {
    id: textoDe(linha.id, "id"),
    user_id: userId,
    event_date: textoDe(linha.event_date, "event_date"),
    network: redeDaLinha(linha.network),
    note: textoOuNulo(linha.note),
    created_at: textoDe(linha.created_at, "created_at"),
    autor: autores.get(userId) ?? null,
  };
}

/**
 * Nome e @ de cada creator da pagina, numa consulta so (`in`).
 *
 * Uma consulta por PAGINA, e nao uma por marcacao: um mes cheio tem dezenas de
 * marcacoes de poucas pessoas, e perguntar o nome uma vez por linha seria o
 * mesmo dado repetido dezenas de vezes.
 */
async function lerAutores(
  userIds: string[],
): Promise<Map<string, AutorDaMarcacao>> {
  const mapa = new Map<string, AutorDaMarcacao>();
  // Dedup por laco, e nao por `[...new Set(...)]`: o tsconfig nao declara
  // `target`, entao cai em ES5, e espalhar um Set exigiria `downlevelIteration`.
  // O Set fica so como `has`/`add`, que sao chamadas de metodo.
  const vistos = new Set<string>();
  const unicos: string[] = [];
  for (const id of userIds) {
    if (vistos.has(id)) continue;
    vistos.add(id);
    unicos.push(id);
  }
  if (unicos.length === 0) return mapa;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("user_id, name, handle")
    .in("user_id", unicos);
  if (error) throw erroEncadeavel(error);

  const linhas: Linha[] = data ?? [];
  for (const linha of linhas) {
    const userId = textoDe(linha.user_id, "user_id");
    mapa.set(userId, {
      user_id: userId,
      name: textoOuNulo(linha.name),
      handle: textoOuNulo(linha.handle),
    });
  }
  return mapa;
}

/**
 * Nome e e-mail de um creator, para avisar. O e-mail pode ser `null` (a coluna
 * e nullable), e quem chama decide o que fazer: a notificacao in-app precisa
 * dele, entao sem e-mail nao ha aviso, e o pedido NAO deixa de existir por
 * isso.
 */
export async function lerContato(
  userId: string,
): Promise<ContatoDoCreator | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("user_id, name, email")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw erroEncadeavel(error);
  const linha: Linha | null = data;
  if (!linha) return null;
  return {
    user_id: textoDe(linha.user_id, "user_id"),
    name: textoOuNulo(linha.name),
    email: textoOuNulo(linha.email),
  };
}

// ---------------------------------------------------------------------------
// MARCACOES
// ---------------------------------------------------------------------------

/**
 * Violacao do unique DESTA tabela, e nao de qualquer outra.
 *
 * Mesmo criterio de `ehPublicacaoRepetida` (creatorPosts.ts) e de
 * `isUniqueViolationOn` (certificates.ts): casa pelo NOME da constraint, que e
 * o motivo de ela ter nome na migration. "Qualquer 23505" confundiria esta
 * colisao com outra da mesma escrita.
 */
function ehMarcacaoRepetida(erro: unknown): boolean {
  if (typeof erro !== "object" || erro === null) return false;
  const e = erro as { code?: unknown; message?: unknown; details?: unknown };
  if (e.code !== "23505") return false;
  const texto = `${String(e.message ?? "")} ${String(e.details ?? "")}`;
  return texto.includes("creator_calendar_unico_por_dia");
}

function ehPedidoRepetido(erro: unknown): boolean {
  if (typeof erro !== "object" || erro === null) return false;
  const e = erro as { code?: unknown; message?: unknown; details?: unknown };
  if (e.code !== "23505") return false;
  const texto = `${String(e.message ?? "")} ${String(e.details ?? "")}`;
  return texto.includes("creator_collab_unica_por_evento");
}

/**
 * Comeco e fim (exclusivo) do dia civil de Brasilia que contem `agora`.
 *
 * Igual ao de creatorPosts.ts de proposito: sao duas linhas de composicao sobre
 * `shared/brasiliaDay.ts`, que e quem detem a regra do dia civil. Exportar o
 * helper de la para ca acoplaria calendario a publicacoes sem passar a regra a
 * limpo.
 */
function janelaDoDia(agora: Date): { inicio: string; fim: string } {
  const dia = diaBrasilia(agora.toISOString());
  if (!dia) throw new Error("[creatorCalendar] instante invalido");
  return {
    inicio: inicioDoDiaBrasilia(dia),
    fim: inicioDoDiaBrasilia(somarDiaCivil(dia, 1)),
  };
}

/** As marcacoes de TODOS os creators no mes pedido, do dia 1 ao ultimo. */
export async function listarMesDoCalendario(
  ano: number,
  mes: number,
): Promise<MarcacaoDoCalendario[]> {
  const { primeiro, ultimo } = limitesDoMes(ano, mes);

  const { data, error } = await supabaseAdmin
    .from("creator_calendar_events")
    .select(COLUNAS_DA_MARCACAO)
    .gte("event_date", primeiro)
    .lte("event_date", ultimo)
    .order("event_date", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(TETO_DO_MES);
  if (error) throw erroEncadeavel(error);

  const linhas: Linha[] = data ?? [];
  const autores = await lerAutores(
    linhas.map((linha) => textoDe(linha.user_id, "user_id")),
  );
  return linhas.map((linha) => lerMarcacao(linha, autores));
}

/**
 * Marca um dia para o proprio creator.
 *
 * O 409 (`event_already_marked`) vem do banco, pelo unique, e NAO de um select
 * antes: entre o select e o insert cabe outra requisicao da mesma pessoa, e o
 * banco e quem decide sem corrida.
 */
export async function marcarDia(
  userId: string,
  corpo: { event_date?: unknown; network?: unknown; note?: unknown },
  hoje: string,
): Promise<Resultado<MarcacaoDoCalendario, CodigoDeMarcacao>> {
  const data = validarDataDeMarcacao(corpo.event_date, hoje);
  if (!data.ok) return data;

  if (
    typeof corpo.network !== "string" ||
    !(REDES_DE_CREATOR as readonly string[]).includes(corpo.network)
  ) {
    return { ok: false, code: "invalid_network" };
  }

  const nota = normalizarNota(corpo.note);
  if (!nota.ok) return nota;

  const inserida = await supabaseAdmin
    .from("creator_calendar_events")
    .insert({
      user_id: userId,
      event_date: data.valor,
      network: corpo.network,
      note: nota.valor,
    })
    .select(COLUNAS_DA_MARCACAO)
    .maybeSingle();
  if (inserida.error) {
    if (ehMarcacaoRepetida(inserida.error)) {
      return { ok: false, code: "event_already_marked" };
    }
    throw erroEncadeavel(inserida.error);
  }
  const linha: Linha | null = inserida.data;
  if (!linha) throw new Error("[creatorCalendar] insert sem linha de volta");

  const autores = await lerAutores([userId]);
  return { ok: true, valor: lerMarcacao(linha, autores) };
}

/**
 * Apaga uma marcacao do proprio creator. `false` quando nao apagou nada, que e
 * o que vira 404 na rota.
 *
 * O `user_id` esta no proprio DELETE, e nao numa conferencia antes: assim nao
 * existe caminho em que a marcacao de outra pessoa seja apagada. Os pedidos de
 * collab dela caem junto, pelo ON DELETE CASCADE da migration.
 */
export async function desmarcarDia(
  userId: string,
  id: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("creator_calendar_events")
    .delete()
    .eq("user_id", userId)
    .eq("id", id)
    .select("id");
  if (error) throw erroEncadeavel(error);
  const apagadas: Linha[] = data ?? [];
  return apagadas.length > 0;
}

// ---------------------------------------------------------------------------
// PEDIDOS DE COLLAB
// ---------------------------------------------------------------------------

async function lerMarcacaoPorId(id: string): Promise<Linha | null> {
  const { data, error } = await supabaseAdmin
    .from("creator_calendar_events")
    .select(COLUNAS_DA_MARCACAO)
    .eq("id", id)
    .maybeSingle();
  if (error) throw erroEncadeavel(error);
  const linha: Linha | null = data;
  return linha;
}

/**
 * Pede collab na marcacao de outro creator.
 *
 * A ORDEM DAS RECUSAS IMPORTA: mensagem invalida, marcacao inexistente,
 * marcacao propria e so entao o teto do dia. Conferir o teto antes de saber se
 * a marcacao existe gastaria a cota de quem errou o id.
 */
export async function pedirCollab(
  requesterId: string,
  eventId: string,
  mensagem: unknown,
  agora: Date = new Date(),
): Promise<
  Resultado<
    { pedido: PedidoDeCollab; marcacao: MarcacaoDoCalendario },
    CodigoDoPedido
  >
> {
  const texto = normalizarMensagemDeCollab(mensagem);
  if (!texto.ok) return texto;

  const linhaDaMarcacao = await lerMarcacaoPorId(eventId);
  if (!linhaDaMarcacao) return { ok: false, code: "event_not_found" };

  const ownerId = textoDe(linhaDaMarcacao.user_id, "user_id");
  if (ownerId === requesterId) return { ok: false, code: "own_event" };

  const { inicio, fim } = janelaDoDia(agora);
  const hoje = await supabaseAdmin
    .from("creator_collab_requests")
    .select("id", { count: "exact", head: true })
    .eq("requester_id", requesterId)
    .gte("created_at", inicio)
    .lt("created_at", fim);
  if (hoje.error) throw erroEncadeavel(hoje.error);
  if ((hoje.count ?? 0) >= LIMITE_DE_PEDIDOS_POR_DIA) {
    return { ok: false, code: "collab_daily_limit" };
  }

  const criado = await supabaseAdmin
    .from("creator_collab_requests")
    .insert({
      event_id: eventId,
      requester_id: requesterId,
      owner_id: ownerId,
      message: texto.valor,
    })
    .select(COLUNAS_DO_PEDIDO)
    .maybeSingle();
  if (criado.error) {
    if (ehPedidoRepetido(criado.error)) {
      return { ok: false, code: "collab_already_requested" };
    }
    throw erroEncadeavel(criado.error);
  }
  const linha: Linha | null = criado.data;
  if (!linha) throw new Error("[creatorCalendar] insert sem linha de volta");

  const autores = await lerAutores([requesterId, ownerId]);
  const marcacao = lerMarcacao(linhaDaMarcacao, autores);
  return {
    ok: true,
    valor: {
      pedido: montarPedido(linha, marcacao, autores.get(ownerId) ?? null),
      marcacao,
    },
  };
}

function montarPedido(
  linha: Linha,
  marcacao: MarcacaoDoCalendario,
  outraPessoa: AutorDaMarcacao | null,
): PedidoDeCollab {
  return {
    id: textoDe(linha.id, "id"),
    event_id: textoDe(linha.event_id, "event_id"),
    requester_id: textoDe(linha.requester_id, "requester_id"),
    owner_id: textoDe(linha.owner_id, "owner_id"),
    message: textoOuNulo(linha.message),
    status: statusDaLinha(linha.status),
    created_at: textoDe(linha.created_at, "created_at"),
    responded_at: textoOuNulo(linha.responded_at),
    event_date: marcacao.event_date,
    network: marcacao.network,
    outra_pessoa: outraPessoa,
  };
}

/**
 * Junta cada pedido com a marcacao dele e com o nome do outro lado.
 *
 * PEDIDO CUJA MARCACAO SUMIU E DESCARTADO, com aviso no log, em vez de aparecer
 * com o dia vazio. O dia E a informacao do pedido ("collab em qual dia?"), e um
 * pedido sem dia na tela e uma meia verdade que alguem pode ler como correta. O
 * CASCADE da migration torna isso impossivel em operacao normal; se acontecer,
 * e inconsistencia de dado, e o log e o lugar dela.
 */
async function montarPedidos(
  linhas: Linha[],
  ladoOposto: "requester_id" | "owner_id",
): Promise<PedidoDeCollab[]> {
  if (linhas.length === 0) return [];

  const eventIds = linhas.map((linha) => textoDe(linha.event_id, "event_id"));
  const { data, error } = await supabaseAdmin
    .from("creator_calendar_events")
    .select(COLUNAS_DA_MARCACAO)
    .in("id", eventIds);
  if (error) throw erroEncadeavel(error);

  const marcacoes = new Map<string, Linha>();
  for (const linha of (data ?? []) as Linha[]) {
    marcacoes.set(textoDe(linha.id, "id"), linha);
  }

  const autores = await lerAutores([
    ...linhas.map((linha) => textoDe(linha[ladoOposto], ladoOposto)),
    ...(data ?? []).map((linha: Linha) => textoDe(linha.user_id, "user_id")),
  ]);

  const pedidos: PedidoDeCollab[] = [];
  for (const linha of linhas) {
    const marcacao = marcacoes.get(textoDe(linha.event_id, "event_id"));
    if (!marcacao) {
      console.warn(
        `[creatorCalendar] pedido ${textoDe(linha.id, "id")} sem marcacao; fora da lista.`,
      );
      continue;
    }
    pedidos.push(
      montarPedido(
        linha,
        lerMarcacao(marcacao, autores),
        autores.get(textoDe(linha[ladoOposto], ladoOposto)) ?? null,
      ),
    );
  }
  return pedidos;
}

/** Os pedidos que o creator recebeu e os que ele enviou. */
export async function listarPedidosDeCollab(userId: string): Promise<{
  recebidos: PedidoDeCollab[];
  enviados: PedidoDeCollab[];
}> {
  const [recebidos, enviados] = await Promise.all([
    supabaseAdmin
      .from("creator_collab_requests")
      .select(COLUNAS_DO_PEDIDO)
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(TETO_DE_PEDIDOS),
    supabaseAdmin
      .from("creator_collab_requests")
      .select(COLUNAS_DO_PEDIDO)
      .eq("requester_id", userId)
      .order("created_at", { ascending: false })
      .limit(TETO_DE_PEDIDOS),
  ]);
  if (recebidos.error) throw erroEncadeavel(recebidos.error);
  if (enviados.error) throw erroEncadeavel(enviados.error);

  return {
    recebidos: await montarPedidos(recebidos.data ?? [], "requester_id"),
    enviados: await montarPedidos(enviados.data ?? [], "owner_id"),
  };
}

/**
 * O dono aceita ou recusa um pedido.
 *
 * O `status = 'pendente'` ENTRA NO UPDATE, e nao numa leitura antes: duas
 * respostas simultaneas ao mesmo pedido fariam a segunda sobrescrever a
 * primeira, e aqui a segunda nao alcanca linha nenhuma. So depois de o update
 * nao ter alcancado nada e que se pergunta ao banco o porque, para separar
 * "nao existe" de "ja respondido".
 */
export async function responderPedidoDeCollab(
  ownerId: string,
  id: string,
  aceita: boolean,
  agora: Date = new Date(),
): Promise<
  Resultado<
    { pedido: PedidoDeCollab; marcacao: MarcacaoDoCalendario },
    CodigoDaResposta
  >
> {
  const atualizado = await supabaseAdmin
    .from("creator_collab_requests")
    .update({
      status: aceita ? "aceita" : "recusada",
      responded_at: agora.toISOString(),
    })
    .eq("id", id)
    .eq("owner_id", ownerId)
    .eq("status", "pendente")
    .select(COLUNAS_DO_PEDIDO);
  if (atualizado.error) throw erroEncadeavel(atualizado.error);

  const linhas: Linha[] = atualizado.data ?? [];
  if (linhas.length === 0) {
    const existente = await supabaseAdmin
      .from("creator_collab_requests")
      .select("id")
      .eq("id", id)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (existente.error) throw erroEncadeavel(existente.error);
    return existente.data
      ? { ok: false, code: "collab_already_answered" }
      : { ok: false, code: "collab_not_found" };
  }

  const linha = linhas[0];
  const linhaDaMarcacao = await lerMarcacaoPorId(
    textoDe(linha.event_id, "event_id"),
  );
  if (!linhaDaMarcacao) {
    throw new Error("[creatorCalendar] pedido respondido sem marcacao");
  }
  const requesterId = textoDe(linha.requester_id, "requester_id");
  const autores = await lerAutores([requesterId, ownerId]);
  const marcacao = lerMarcacao(linhaDaMarcacao, autores);
  return {
    ok: true,
    valor: {
      pedido: montarPedido(linha, marcacao, autores.get(requesterId) ?? null),
      marcacao,
    },
  };
}
