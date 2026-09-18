import {
  diaBrasilia,
  inicioDoDiaBrasilia,
  somarDiaCivil,
} from "../../shared/brasiliaDay";
import {
  ehTipoDePublicacao,
  LIMITE_DE_REGISTROS_POR_DIA,
  normalizarLinkDePublicacao,
  REDES_DE_PUBLICACAO,
  STATUS_DE_PUBLICACAO,
  statusInicialDaPublicacao,
  TIPOS_DE_PUBLICACAO,
  type RedeDePublicacao,
  type StatusDePublicacao,
  type TipoDePublicacao,
} from "../../shared/creatorPost";
import type { Linha } from "./creatorDashboard";
import { textoDe } from "./creatorDashboard";
import { erroEncadeavel } from "./supabaseError";
import { supabaseAdmin } from "./supabaseAdmin";
import {
  ehLinkCurtoDoTikTok,
  resolverLinkCurtoDoTikTok,
} from "./tiktokShortLink";

/**
 * PUBLICACOES REGISTRADAS PELO CREATOR (lote 09, status no lote 10b): toda
 * leitura e escrita de `creator_posts` passa por aqui.
 *
 * NAO HA VERIFICACAO DE CONTEUDO AUTOMATICA. Isto guarda o link que a pessoa
 * colou com o status inicial que o shared decide (`statusInicialDaPublicacao`:
 * pendente, salvo story), e so o que o admin CONFIRMA vale ponto no ranking.
 * Quem julga se a publicacao e sobre a Bora na Tech e o admin, na lista de
 * pendentes.
 *
 * DUAS DEFESAS contra inflar a lista, e so duas: o teto diario
 * (`LIMITE_DE_REGISTROS_POR_DIA`) e o unique por creator. A primeira torna
 * trabalhoso colar link em serie; a segunda impede contar a mesma publicacao
 * duas vezes.
 *
 * ERRO LANCA, e linha fora do formato tambem: a rota transforma em 500. Uma
 * lista vazia com 200 seria indistinguivel de "ainda nao registrei nada".
 */

/** Teto de linhas por leitura. Sem paginacao neste lote: a tela mostra a lista
 * inteira, e um creator com mais de 200 publicacoes registradas e um caso que
 * ainda nao existe. Quando existir, isto vira paginacao, e nao um teto maior. */
const TETO_DE_LEITURA = 200;

export type PublicacaoDoCreator = {
  id: string;
  network: RedeDePublicacao;
  kind: TipoDePublicacao;
  url: string;
  status: StatusDePublicacao;
  /** Quando foi confirmada (story: o instante do registro). Nulo se pendente. */
  confirmed_at: string | null;
  created_at: string;
};

export type ListaDePublicacoes = {
  posts: PublicacaoDoCreator[];
  total: number;
  /** CONFIRMADAS no mes civil de Brasilia corrente. E o numero do ranking. */
  no_mes: number;
  /** Pendentes no mesmo mes: o que ainda nao vale ponto. */
  aguardando: number;
};

/**
 * Recusa do registro. O `post_type_mismatch` carrega o tipo detectado no link
 * (vem do shared) para a rota montar a mensagem com o nome dele.
 */
export type RegistroRecusado =
  | {
      ok: false;
      code:
        | "invalid_post_url"
        | "short_link_unsupported"
        | "short_link_unresolved"
        | "invalid_post_type"
        | "post_already_registered"
        | "post_daily_limit";
    }
  | { ok: false; code: "post_type_mismatch"; tipo_detectado: TipoDePublicacao };

export type CodigoDeRegistro = RegistroRecusado["code"];

export type ResultadoDoRegistro =
  | { ok: true; valor: PublicacaoDoCreator }
  | RegistroRecusado;

const COLUNAS = "id, network, kind, url, status, confirmed_at, created_at";

function redeDaLinha(valor: unknown): RedeDePublicacao {
  if (
    typeof valor !== "string" ||
    !(REDES_DE_PUBLICACAO as readonly string[]).includes(valor)
  ) {
    throw new Error(`[creatorPosts] network desconhecida: ${String(valor)}`);
  }
  return valor as RedeDePublicacao;
}

function tipoDaLinha(valor: unknown): TipoDePublicacao {
  if (
    typeof valor !== "string" ||
    !(TIPOS_DE_PUBLICACAO as readonly string[]).includes(valor)
  ) {
    throw new Error(`[creatorPosts] kind desconhecido: ${String(valor)}`);
  }
  return valor as TipoDePublicacao;
}

function statusDaLinha(valor: unknown): StatusDePublicacao {
  if (
    typeof valor !== "string" ||
    !(STATUS_DE_PUBLICACAO as readonly string[]).includes(valor)
  ) {
    throw new Error(`[creatorPosts] status desconhecido: ${String(valor)}`);
  }
  return valor as StatusDePublicacao;
}

/** Texto ou nulo: colunas nullable (confirmed_at, name, avatar_url). */
function instanteOuNulo(valor: unknown, campo: string): string | null {
  if (valor === null || valor === undefined) return null;
  return textoDe(valor, campo);
}

function lerItem(linha: Linha): PublicacaoDoCreator {
  return {
    id: textoDe(linha.id, "id"),
    network: redeDaLinha(linha.network),
    kind: tipoDaLinha(linha.kind),
    url: textoDe(linha.url, "url"),
    status: statusDaLinha(linha.status),
    confirmed_at: instanteOuNulo(linha.confirmed_at, "confirmed_at"),
    created_at: textoDe(linha.created_at, "created_at"),
  };
}

/**
 * Violacao do unique DESTA tabela, e nao de qualquer outra.
 *
 * Mesmo criterio de `isUniqueViolationOn` (server/lib/certificates.ts): o
 * PostgREST devolve o nome da constraint na message/details, e e por ele que
 * se distingue "ja registrou esta publicacao" de qualquer outro 23505 que a
 * mesma escrita possa produzir. Por isso a constraint tem nome na migration.
 */
function ehPublicacaoRepetida(erro: unknown): boolean {
  if (typeof erro !== "object" || erro === null) return false;
  const e = erro as { code?: unknown; message?: unknown; details?: unknown };
  if (e.code !== "23505") return false;
  const texto = `${String(e.message ?? "")} ${String(e.details ?? "")}`;
  return texto.includes("creator_posts_unico_por_creator");
}

/** Comeco e fim (exclusivo) do dia civil de Brasilia que contem `agora`. */
function janelaDoDia(agora: Date): { inicio: string; fim: string } {
  const dia = diaBrasilia(agora.toISOString());
  if (!dia) throw new Error("[creatorPosts] instante invalido");
  return {
    inicio: inicioDoDiaBrasilia(dia),
    fim: inicioDoDiaBrasilia(somarDiaCivil(dia, 1)),
  };
}

/** Comeco do mes civil de Brasilia que contem `agora`. */
function inicioDoMes(agora: Date): string {
  const dia = diaBrasilia(agora.toISOString());
  if (!dia) throw new Error("[creatorPosts] instante invalido");
  return inicioDoDiaBrasilia(`${dia.slice(0, 7)}-01`);
}

/** Publicacoes do creator, da mais recente para a mais antiga. */
export async function listarPublicacoes(
  userId: string,
  agora: Date = new Date(),
): Promise<ListaDePublicacoes> {
  const inicio = inicioDoMes(agora);
  const [linhas, total, confirmadas, pendentes] = await Promise.all([
    supabaseAdmin
      .from("creator_posts")
      .select(COLUNAS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(TETO_DE_LEITURA),
    supabaseAdmin
      .from("creator_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    // Duas contagens separadas, e nao uma leitura do mes filtrada aqui: cada
    // uma e um HEAD com count, sem trazer linha, e a tabela nao e lida duas
    // vezes por status alem do que o PostgREST ja faria por filtro.
    supabaseAdmin
      .from("creator_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "confirmado")
      .gte("created_at", inicio),
    supabaseAdmin
      .from("creator_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pendente")
      .gte("created_at", inicio),
  ]);
  if (linhas.error) throw erroEncadeavel(linhas.error);
  if (total.error) throw erroEncadeavel(total.error);
  if (confirmadas.error) throw erroEncadeavel(confirmadas.error);
  if (pendentes.error) throw erroEncadeavel(pendentes.error);

  const dados: Linha[] = linhas.data ?? [];
  return {
    posts: dados.map(lerItem),
    total: total.count ?? 0,
    no_mes: confirmadas.count ?? 0,
    aguardando: pendentes.count ?? 0,
  };
}

/**
 * Registra o link colado com o tipo escolhido. O 409
 * (`post_already_registered`) vem do banco, pelo unique, e NAO de um select
 * antes: entre o select e o insert cabe outra requisicao da mesma pessoa, e o
 * banco e quem decide sem corrida.
 *
 * O status inicial e o do shared: pendente, salvo story, que nasce confirmado
 * com `confirmed_at` no instante do registro e `confirmed_by` nulo, porque a
 * confirmacao e automatica e nao ha admin a nomear.
 */
export async function registrarPublicacao(
  userId: string,
  url: unknown,
  tipo: unknown,
  agora: Date = new Date(),
): Promise<ResultadoDoRegistro> {
  if (!ehTipoDePublicacao(tipo))
    return { ok: false, code: "invalid_post_type" };
  let link = normalizarLinkDePublicacao(url, tipo);
  // Link curto do TikTok com tipo video (lote 10c): o servidor resolve o
  // redirecionamento e segue com a canonica. Mora AQUI, e nao na rota, para
  // todo chamador ganhar a resolucao sem lembrar dela. Com outro tipo
  // escolhido nao ha o que resolver: o link e de video de qualquer forma, e a
  // pessoa precisa trocar o tipo. `instagr.am` nao entra: nao e do TikTok.
  const precisaResolver =
    !link.ok &&
    link.code === "short_link_unsupported" &&
    tipo === "video" &&
    ehLinkCurtoDoTikTok(url);
  // Link que nem forma de publicacao tem sai aqui, sem tocar no banco.
  if (!link.ok && !precisaResolver) return link;

  // O TETO DO DIA VEM ANTES DE ABRIR CONEXAO: o decimo primeiro link curto do
  // dia recebe 429 sem uma unica requisicao ao TikTok. Na ordem inversa, o
  // teto que existe para tornar trabalhoso inflar a lista deixaria o servidor
  // abrir uma conexao de saida por tentativa, sem limite.
  const { inicio, fim } = janelaDoDia(agora);
  const hoje = await supabaseAdmin
    .from("creator_posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", inicio)
    .lt("created_at", fim);
  if (hoje.error) throw erroEncadeavel(hoje.error);
  if ((hoje.count ?? 0) >= LIMITE_DE_REGISTROS_POR_DIA) {
    return { ok: false, code: "post_daily_limit" };
  }

  if (precisaResolver) {
    const resolvido = await resolverLinkCurtoDoTikTok(url);
    if (!resolvido.ok) return resolvido;
    link = resolvido;
  }
  if (!link.ok) return link;

  const status = statusInicialDaPublicacao(tipo);
  const { data, error } = await supabaseAdmin
    .from("creator_posts")
    .insert({
      user_id: userId,
      network: link.valor.network,
      kind: link.valor.kind,
      external_id: link.valor.external_id,
      url: link.valor.url,
      status,
      confirmed_at: status === "confirmado" ? agora.toISOString() : null,
      confirmed_by: null,
    })
    .select(COLUNAS)
    .maybeSingle();
  if (error) {
    if (ehPublicacaoRepetida(error)) {
      return { ok: false, code: "post_already_registered" };
    }
    throw erroEncadeavel(error);
  }
  const linha: Linha | null = data;
  if (!linha) throw new Error("[creatorPosts] insert sem linha de volta");
  return { ok: true, valor: lerItem(linha) };
}

/** Uma publicacao do creator, ou null. O `user_id` entra na busca de proposito:
 * ninguem le a publicacao de outro por id. */
export async function lerPublicacao(
  userId: string,
  id: string,
): Promise<PublicacaoDoCreator | null> {
  const { data, error } = await supabaseAdmin
    .from("creator_posts")
    .select(COLUNAS)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw erroEncadeavel(error);
  const linha: Linha | null = data;
  return linha ? lerItem(linha) : null;
}

/**
 * Apaga uma publicacao do creator. Devolve `false` quando nao apagou nada, que
 * e o que vira 404 na rota.
 *
 * O `user_id` esta no DELETE, e nao numa conferencia antes: assim nao existe
 * caminho em que um id de outra pessoa seja apagado, nem por corrida nem por
 * esquecimento de quem chamar.
 */
export async function removerPublicacao(
  userId: string,
  id: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("creator_posts")
    .delete()
    .eq("user_id", userId)
    .eq("id", id)
    .select("id");
  if (error) throw erroEncadeavel(error);
  const apagadas: Linha[] = data ?? [];
  return apagadas.length > 0;
}

/**
 * Contadores de publicacoes do QUADRO do admin, para uma pagina de creators:
 * confirmadas no mes civil corrente (o numero do ranking) e pendentes no
 * total, sem corte de mes (o que o admin ainda precisa conferir, de qualquer
 * data). Uma consulta por contador e por PAGINA (`in`), e a contagem e feita
 * aqui, sobre os ids lidos: o PostgREST nao agrupa, e pedir contagem por
 * creator seria uma consulta por linha da pagina.
 */
export async function contarPublicacoesDoQuadro(
  userIds: string[],
  agora: Date = new Date(),
): Promise<Map<string, { no_mes: number; aguardando: number }>> {
  const mapa = new Map<string, { no_mes: number; aguardando: number }>();
  for (const id of userIds) mapa.set(id, { no_mes: 0, aguardando: 0 });
  if (userIds.length === 0) return mapa;

  const [confirmadas, pendentes] = await Promise.all([
    supabaseAdmin
      .from("creator_posts")
      .select("user_id")
      .in("user_id", userIds)
      .eq("status", "confirmado")
      .gte("created_at", inicioDoMes(agora)),
    supabaseAdmin
      .from("creator_posts")
      .select("user_id")
      .in("user_id", userIds)
      .eq("status", "pendente"),
  ]);
  if (confirmadas.error) throw erroEncadeavel(confirmadas.error);
  if (pendentes.error) throw erroEncadeavel(pendentes.error);

  const somar = (linhas: Linha[], campo: "no_mes" | "aguardando") => {
    for (const linha of linhas) {
      const item = mapa.get(textoDe(linha.user_id, "user_id"));
      if (item) item[campo] += 1;
    }
  };
  somar(confirmadas.data ?? [], "no_mes");
  somar(pendentes.data ?? [], "aguardando");
  return mapa;
}

/** Publicacao com o dono: a lista de conferencia do admin cruza creators. */
export type PublicacaoPendente = PublicacaoDoCreator & { user_id: string };

export type PaginaDePendentes = {
  rows: PublicacaoPendente[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Publicacoes PENDENTES de todos os creators, mais antigas primeiro (quem
 * espera ha mais tempo e conferido antes), paginadas. E a lista "Publicacoes
 * para conferir" da aba Creators; o indice `creator_posts_status_idx` cobre
 * exatamente esta ordem.
 */
export async function listarPendentes(
  page: number,
  pageSize: number,
): Promise<PaginaDePendentes> {
  const offset = (page - 1) * pageSize;
  const { data, error, count } = await supabaseAdmin
    .from("creator_posts")
    .select(`user_id, ${COLUNAS}`, { count: "exact" })
    .eq("status", "pendente")
    .order("created_at", { ascending: true })
    .range(offset, offset + pageSize - 1);
  if (error) throw erroEncadeavel(error);
  const linhas: Linha[] = data ?? [];
  return {
    rows: linhas.map((linha) => ({
      ...lerItem(linha),
      user_id: textoDe(linha.user_id, "user_id"),
    })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export type DonoDaPublicacao = {
  name: string | null;
  avatar_url: string | null;
  instagram_handle: string | null;
};

/**
 * Nome, avatar e @ do Instagram de cada dono da pagina de pendentes, em duas
 * consultas (`in`) para a pagina inteira: `profiles` para nome e avatar,
 * `creator_profiles` para o @. Quem nao tem perfil aparece com os tres nulos,
 * e a tela cai no rotulo neutro; a lista nao deixa de existir por isso.
 */
export async function resolverDonosDasPublicacoes(
  userIds: string[],
): Promise<Map<string, DonoDaPublicacao>> {
  const mapa = new Map<string, DonoDaPublicacao>();
  const unicos: string[] = [];
  for (const id of userIds) {
    if (mapa.has(id)) continue;
    mapa.set(id, { name: null, avatar_url: null, instagram_handle: null });
    unicos.push(id);
  }
  if (unicos.length === 0) return mapa;

  const [perfis, deCreator] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("user_id, name, avatar_url")
      .in("user_id", unicos),
    supabaseAdmin
      .from("creator_profiles")
      .select("user_id, instagram_handle")
      .in("user_id", unicos),
  ]);
  if (perfis.error) throw erroEncadeavel(perfis.error);
  if (deCreator.error) throw erroEncadeavel(deCreator.error);

  const linhasPerfil: Linha[] = perfis.data ?? [];
  for (const linha of linhasPerfil) {
    const dono = mapa.get(textoDe(linha.user_id, "user_id"));
    if (!dono) continue;
    dono.name = instanteOuNulo(linha.name, "name");
    dono.avatar_url = instanteOuNulo(linha.avatar_url, "avatar_url");
  }
  const linhasCreator: Linha[] = deCreator.data ?? [];
  for (const linha of linhasCreator) {
    const dono = mapa.get(textoDe(linha.user_id, "user_id"));
    if (!dono) continue;
    dono.instagram_handle = instanteOuNulo(
      linha.instagram_handle,
      "instagram_handle",
    );
  }
  return mapa;
}

/**
 * Confirma uma publicacao PENDENTE do creator. Devolve a linha confirmada, ou
 * `null` quando nao havia pendente com esse id para esse dono (ja confirmada,
 * de outra pessoa, ou inexistente): a rota distingue os casos com a leitura
 * que faz antes, e este `null` cobre a corrida entre a leitura e o update.
 *
 * O `status = pendente` esta no proprio UPDATE, pelo mesmo motivo do dono no
 * DELETE: nao existe caminho em que uma confirmacao seja gravada duas vezes,
 * nem por corrida nem por esquecimento de quem chamar.
 */
export async function confirmarPublicacao(
  userId: string,
  postId: string,
  adminId: string,
  agora: Date = new Date(),
): Promise<PublicacaoDoCreator | null> {
  const { data, error } = await supabaseAdmin
    .from("creator_posts")
    .update({
      status: "confirmado",
      confirmed_at: agora.toISOString(),
      confirmed_by: adminId,
    })
    .eq("user_id", userId)
    .eq("id", postId)
    .eq("status", "pendente")
    .select(COLUNAS)
    .maybeSingle();
  if (error) throw erroEncadeavel(error);
  const linha: Linha | null = data;
  return linha ? lerItem(linha) : null;
}
