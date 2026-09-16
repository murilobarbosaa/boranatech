import {
  diaBrasilia,
  inicioDoDiaBrasilia,
  somarDiaCivil,
} from "../../shared/brasiliaDay";
import {
  LIMITE_DE_REGISTROS_POR_DIA,
  normalizarLinkDePublicacao,
  REDES_DE_PUBLICACAO,
  TIPOS_DE_PUBLICACAO,
  type CodigoDeLinkDePublicacao,
  type RedeDePublicacao,
  type TipoDePublicacao,
} from "../../shared/creatorPost";
import type { Resultado } from "../../shared/creatorProfile";
import type { Linha } from "./creatorDashboard";
import { textoDe } from "./creatorDashboard";
import { erroEncadeavel } from "./supabaseError";
import { supabaseAdmin } from "./supabaseAdmin";

/**
 * PUBLICACOES REGISTRADAS PELO CREATOR (lote 09): toda leitura e escrita de
 * `creator_posts` passa por aqui.
 *
 * NAO HA VERIFICACAO DE CONTEUDO. Isto guarda o link que a pessoa colou, e a
 * contagem alimenta o ranking do lote 11. Quem julga se a publicacao e sobre a
 * Bora na Tech e o admin, que ve a lista e remove.
 *
 * DUAS DEFESAS, e so duas: o teto diario (`LIMITE_DE_REGISTROS_POR_DIA`) e o
 * unique por creator. A primeira torna trabalhoso inflar o ranking colando
 * link em serie; a segunda impede contar a mesma publicacao duas vezes.
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
  created_at: string;
};

export type ListaDePublicacoes = {
  posts: PublicacaoDoCreator[];
  total: number;
  /** Quantas caem no mes civil de Brasilia corrente. E o numero do ranking. */
  no_mes: number;
};

export type CodigoDeRegistro =
  | CodigoDeLinkDePublicacao
  | "post_already_registered"
  | "post_daily_limit";

const COLUNAS = "id, network, kind, url, created_at";

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

function lerItem(linha: Linha): PublicacaoDoCreator {
  return {
    id: textoDe(linha.id, "id"),
    network: redeDaLinha(linha.network),
    kind: tipoDaLinha(linha.kind),
    url: textoDe(linha.url, "url"),
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
  const [linhas, total, mes] = await Promise.all([
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
    supabaseAdmin
      .from("creator_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", inicioDoMes(agora)),
  ]);
  if (linhas.error) throw erroEncadeavel(linhas.error);
  if (total.error) throw erroEncadeavel(total.error);
  if (mes.error) throw erroEncadeavel(mes.error);

  const dados: Linha[] = linhas.data ?? [];
  return {
    posts: dados.map(lerItem),
    total: total.count ?? 0,
    no_mes: mes.count ?? 0,
  };
}

/**
 * Registra o link colado. O 409 (`post_already_registered`) vem do banco, pelo
 * unique, e NAO de um select antes: entre o select e o insert cabe outra
 * requisicao da mesma pessoa, e o banco e quem decide sem corrida.
 */
export async function registrarPublicacao(
  userId: string,
  url: unknown,
  agora: Date = new Date(),
): Promise<Resultado<PublicacaoDoCreator, CodigoDeRegistro>> {
  const link = normalizarLinkDePublicacao(url);
  if (!link.ok) return link;

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

  const { data, error } = await supabaseAdmin
    .from("creator_posts")
    .insert({
      user_id: userId,
      network: link.valor.network,
      kind: link.valor.kind,
      external_id: link.valor.external_id,
      url: link.valor.url,
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
 * Quantas publicacoes cada creator da pagina registrou no mes civil corrente.
 *
 * Uma consulta por PAGINA (`in`), e a contagem e feita aqui, sobre os ids
 * lidos: o PostgREST nao agrupa, e pedir contagem por creator seria uma
 * consulta por linha da pagina.
 */
export async function contarPublicacoesDoMes(
  userIds: string[],
  agora: Date = new Date(),
): Promise<Map<string, number>> {
  const mapa = new Map<string, number>();
  for (const id of userIds) mapa.set(id, 0);
  if (userIds.length === 0) return mapa;

  const { data, error } = await supabaseAdmin
    .from("creator_posts")
    .select("user_id")
    .in("user_id", userIds)
    .gte("created_at", inicioDoMes(agora));
  if (error) throw erroEncadeavel(error);

  const linhas: Linha[] = data ?? [];
  for (const linha of linhas) {
    const dono = textoDe(linha.user_id, "user_id");
    const atual = mapa.get(dono);
    if (atual !== undefined) mapa.set(dono, atual + 1);
  }
  return mapa;
}
