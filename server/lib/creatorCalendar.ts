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
  podePedirCollab,
  validarDataDeMarcacao,
  type CodigoDaData,
  type CodigoDaMensagem,
  type CodigoDaNota,
} from "../../shared/creatorCalendar";
import {
  REDES_DE_CREATOR,
  ehRedeDeCreator,
  type RedeDeCreator,
  type Resultado,
} from "../../shared/creatorProfile";
import {
  COR_PADRAO_DO_CALENDARIO,
  ehCorDoCalendario,
  type CorDoCalendario,
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
  /** Lote 10c: o parceiro de collab aparece no dia com avatar. */
  avatar_url: string | null;
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

/**
 * O pedido de collab que QUEM OLHA fez nesta marcacao (lote 10c), em qualquer
 * status, ou null. E o que faz o botao "Pedir collab" virar chip: sem isto o
 * calendario nao tinha como saber que a pessoa ja pediu, e o botao voltava a
 * cada carga. Nulo tambem na propria marcacao (ninguem pede collab de si).
 */
export type MeuPedidoNaMarcacao = { id: string; status: StatusDoPedido };

/** Quem fechou collab nesta marcacao (pedido ACEITO). Publico por natureza. */
export type ParceiroDeCollab = {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  /** Cor do parceiro no calendario: o marcador dele tambem entra no dia. */
  calendar_color: CorDoCalendario;
};

export type MarcacaoDoMes = MarcacaoDoCalendario & {
  /**
   * Cor do CREATOR da marcacao no calendario (lote 10c). Sai sempre, com ou
   * sem consentimento de visibilidade: cor nao e dado pessoal, e so existe
   * para ser vista.
   */
  calendar_color: CorDoCalendario;
  meu_pedido: MeuPedidoNaMarcacao | null;
  /** Collabs aceitas, visiveis a todos: e o que aparece NO calendario. */
  collabs: ParceiroDeCollab[];
  /** Quem olha e um dos parceiros aceitos desta marcacao. */
  minha_collab: boolean;
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
  | "collab_event_in_past"
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
 *
 * Exportada desde o lote 11: o ranking expoe de outra pessoa EXATAMENTE o que
 * o calendario expoe (nome, @, avatar), e reusar a leitura e o que garante que
 * os dois nao divirjam.
 */
export async function lerAutores(
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
    .select("user_id, name, handle, avatar_url")
    .in("user_id", unicos);
  if (error) throw erroEncadeavel(error);

  const linhas: Linha[] = data ?? [];
  for (const linha of linhas) {
    const userId = textoDe(linha.user_id, "user_id");
    mapa.set(userId, {
      user_id: userId,
      name: textoOuNulo(linha.name),
      handle: textoOuNulo(linha.handle),
      avatar_url: textoOuNulo(linha.avatar_url),
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
/**
 * Cor de cada creator no calendario, numa consulta so (`in`). Quem nao tem
 * linha de perfil fica com o padrao; valor fora da lista lanca, como no
 * perfil: e o dado em si.
 */
async function lerCoresDosCreators(
  userIds: string[],
): Promise<Map<string, CorDoCalendario>> {
  const mapa = new Map<string, CorDoCalendario>();
  const vistos = new Set<string>();
  const unicos: string[] = [];
  for (const id of userIds) {
    if (vistos.has(id)) continue;
    vistos.add(id);
    unicos.push(id);
    mapa.set(id, COR_PADRAO_DO_CALENDARIO);
  }
  if (unicos.length === 0) return mapa;

  const { data, error } = await supabaseAdmin
    .from("creator_profiles")
    .select("user_id, calendar_color")
    .in("user_id", unicos);
  if (error) throw erroEncadeavel(error);
  const linhas: Linha[] = data ?? [];
  for (const linha of linhas) {
    const cor = linha.calendar_color;
    if (cor === null || cor === undefined) continue;
    if (!ehCorDoCalendario(cor)) {
      throw new Error(
        `[creatorCalendar] calendar_color fora da lista: ${String(cor)}`,
      );
    }
    mapa.set(textoDe(linha.user_id, "user_id"), cor);
  }
  return mapa;
}

/**
 * Pedidos de collab das marcacoes do mes, numa consulta so (`in`): e daqui
 * que sai o `meu_pedido` de quem olha. Uma consulta por MES, e nao uma por
 * marcacao, pelo mesmo motivo de `lerAutores`.
 */
async function lerPedidosDasMarcacoes(eventIds: string[]): Promise<Linha[]> {
  if (eventIds.length === 0) return [];
  const { data, error } = await supabaseAdmin
    .from("creator_collab_requests")
    .select("id, event_id, requester_id, status")
    .in("event_id", eventIds);
  if (error) throw erroEncadeavel(error);
  return data ?? [];
}

/**
 * Marcacoes do mes, de TODOS os creators, com o autor de cada uma, as collabs
 * ACEITAS de cada uma (visiveis a todos: collab fechada e publica por
 * natureza, e e no calendario que ela tem de aparecer) e, para quem olha
 * (`viewerId`), o pedido que essa pessoa fez em cada marcacao. Os pedidos do
 * mes vem de UMA consulta, e os nomes e avatares dos parceiros entram no
 * mesmo lote dos donos.
 */
export async function listarMesDoCalendario(
  ano: number,
  mes: number,
  /** Quem olha; `null` e o admin (lote 10d), que nao pede collab: `meu_pedido`
   * sai sempre null e `minha_collab` sempre false. */
  viewerId: string | null,
): Promise<MarcacaoDoMes[]> {
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
  const pedidos = await lerPedidosDasMarcacoes(
    linhas.map((linha) => textoDe(linha.id, "id")),
  );

  const meusPedidos = new Map<string, MeuPedidoNaMarcacao>();
  const aceitos = new Map<string, string[]>();
  for (const pedido of pedidos) {
    const eventId = textoDe(pedido.event_id, "event_id");
    const requesterId = textoDe(pedido.requester_id, "requester_id");
    const status = statusDaLinha(pedido.status);
    if (viewerId !== null && requesterId === viewerId) {
      meusPedidos.set(eventId, { id: textoDe(pedido.id, "id"), status });
    }
    if (status === "aceita") {
      aceitos.set(eventId, [...(aceitos.get(eventId) ?? []), requesterId]);
    }
  }

  // Donos e parceiros no MESMO lote de perfis, e no mesmo lote de cores.
  const idsDeParceiros: string[] = [];
  aceitos.forEach((ids) => idsDeParceiros.push(...ids));
  const todos = [
    ...linhas.map((linha) => textoDe(linha.user_id, "user_id")),
    ...idsDeParceiros,
  ];
  const [autores, cores] = await Promise.all([
    lerAutores(todos),
    lerCoresDosCreators(todos),
  ]);

  return linhas.map((linha) => {
    const marcacao = lerMarcacao(linha, autores);
    const collabs: ParceiroDeCollab[] = (aceitos.get(marcacao.id) ?? []).map(
      (id) => {
        const autor = autores.get(id);
        return {
          user_id: id,
          name: autor?.name ?? null,
          avatar_url: autor?.avatar_url ?? null,
          calendar_color: cores.get(id) ?? COR_PADRAO_DO_CALENDARIO,
        };
      },
    );
    return {
      ...marcacao,
      calendar_color: cores.get(marcacao.user_id) ?? COR_PADRAO_DO_CALENDARIO,
      meu_pedido: meusPedidos.get(marcacao.id) ?? null,
      collabs,
      minha_collab:
        viewerId !== null && collabs.some((c) => c.user_id === viewerId),
    };
  });
}

export type MarcacaoCriada = {
  /** Cada linha criada leva a cor do creator (lote 10d): e o que o client
   * desenha no dia sem esperar a revalidacao. */
  criadas: Array<MarcacaoDoCalendario & { calendar_color: CorDoCalendario }>;
  /** Redes em que aquele dia JA estava marcado por este creator. */
  ja_existiam: RedeDeCreator[];
};

/**
 * As redes do corpo: `redes` (lote 10d, 1 a 3, sem repetidas) ou o `network`
 * antigo, que o client anterior a este lote manda sozinho na janela de deploy
 * e vira `[network]` aqui. Ordem preservada, repetida descartada.
 */
function redesDoCorpo(corpo: {
  network?: unknown;
  redes?: unknown;
}): Resultado<RedeDeCreator[], "invalid_network"> {
  const brutas: unknown[] = Array.isArray(corpo.redes)
    ? corpo.redes
    : corpo.network !== undefined
      ? [corpo.network]
      : [];
  const redes: RedeDeCreator[] = [];
  for (const rede of brutas) {
    if (!ehRedeDeCreator(rede)) return { ok: false, code: "invalid_network" };
    if (!redes.includes(rede)) redes.push(rede);
  }
  if (redes.length === 0) return { ok: false, code: "invalid_network" };
  return { ok: true, valor: redes };
}

/**
 * Marca um dia para o proprio creator, em uma ou mais redes, numa ida so ao
 * banco.
 *
 * As redes em que o dia JA estava marcado sao puladas pelo proprio banco
 * (`ignoreDuplicates` sobre o unique `(user_id, event_date, network)`, o
 * mesmo padrao de server/routes/notifications.ts) e voltam em `ja_existiam`;
 * so quando NENHUMA e nova o resultado e o 409 de sempre. Nao ha select antes
 * do insert: entre os dois caberia outra requisicao da mesma pessoa, e o banco
 * e quem decide sem corrida.
 */
export async function marcarDia(
  userId: string,
  corpo: {
    event_date?: unknown;
    network?: unknown;
    redes?: unknown;
    note?: unknown;
  },
  hoje: string,
): Promise<Resultado<MarcacaoCriada, CodigoDeMarcacao>> {
  const data = validarDataDeMarcacao(corpo.event_date, hoje);
  if (!data.ok) return data;

  const redes = redesDoCorpo(corpo);
  if (!redes.ok) return redes;

  const nota = normalizarNota(corpo.note);
  if (!nota.ok) return nota;

  const inseridas = await supabaseAdmin
    .from("creator_calendar_events")
    .upsert(
      redes.valor.map((network) => ({
        user_id: userId,
        event_date: data.valor,
        network,
        note: nota.valor,
      })),
      { onConflict: "user_id,event_date,network", ignoreDuplicates: true },
    )
    .select(COLUNAS_DA_MARCACAO);
  if (inseridas.error) throw erroEncadeavel(inseridas.error);

  const linhas: Linha[] = inseridas.data ?? [];
  if (linhas.length === 0) return { ok: false, code: "event_already_marked" };

  const [autores, cores] = await Promise.all([
    lerAutores([userId]),
    lerCoresDosCreators([userId]),
  ]);
  const cor = cores.get(userId) ?? COR_PADRAO_DO_CALENDARIO;
  const criadas = linhas.map((linha) => ({
    ...lerMarcacao(linha, autores),
    calendar_color: cor,
  }));
  const novas = new Set(criadas.map((m) => m.network));
  return {
    ok: true,
    valor: {
      criadas,
      ja_existiam: redes.valor.filter((rede) => !novas.has(rede)),
    },
  };
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
  hoje: string,
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
  // Collab so de hoje em diante (lote 10d): com o piso retroativo da
  // marcacao, a de um dia passado e registro, e pedir collab nela nao faz
  // sentido. Conferido AQUI, e nao so escondendo o botao no client.
  if (
    !podePedirCollab(textoDe(linhaDaMarcacao.event_date, "event_date"), hoje)
  ) {
    return { ok: false, code: "collab_event_in_past" };
  }

  const { inicio, fim } = janelaDoDia(agora);
  const pedidosDeHoje = await supabaseAdmin
    .from("creator_collab_requests")
    .select("id", { count: "exact", head: true })
    .eq("requester_id", requesterId)
    .gte("created_at", inicio)
    .lt("created_at", fim);
  if (pedidosDeHoje.error) throw erroEncadeavel(pedidosDeHoje.error);
  if ((pedidosDeHoje.count ?? 0) >= LIMITE_DE_PEDIDOS_POR_DIA) {
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
