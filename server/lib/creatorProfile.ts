import {
  isTipoDeChavePix,
  mascararChavePix,
  normalizarChavePix,
  normalizarHandle,
  normalizarSeguidores,
  type CodigoDeChavePix,
  type CodigoDeHandle,
  type CodigoDeSeguidores,
  type CreatorPerfilDados,
  type CreatorPixMascarada,
  type Resultado,
  type TipoDeChavePix,
  COR_PADRAO_DO_CALENDARIO,
  ehCorDoCalendario,
  type CorDoCalendario,
} from "../../shared/creatorProfile";
import type { Linha } from "./creatorDashboard";
import { numeroDe, textoDe, textoOuNull } from "./creatorDashboard";
import { contarPublicacoesDoQuadro } from "./creatorPosts";
import { erroEncadeavel } from "./supabaseError";
import { supabaseAdmin } from "./supabaseAdmin";

/**
 * PERFIL DE CREATOR E CHAVE PIX (lote 08): toda leitura e escrita de
 * `creator_profiles` e `creator_pix_keys` passa por aqui.
 *
 * A CHAVE PIX INTEIRA SO SAI DESTE ARQUIVO POR `revelarChavePix`, que so a rota
 * de revelacao do admin chama, e so depois de gravar a auditoria. Toda outra
 * leitura devolve a chave mascarada (`mascararChavePix`, em shared). Por isso a
 * consulta mascarada e a revelacao moram juntas: o `select` de `key_value`
 * existe em dois lugares so, e os dois estao a vista neste arquivo.
 *
 * ERRO LANCA, e linha fora do formato tambem: a rota transforma em 500. Um
 * perfil vazio com 200 seria indistinguivel de "o creator nao preencheu".
 */

/** Perfil de quem ainda nao salvou nada: tudo nulo e o consentimento desligado. */
function perfilVazio(): Omit<CreatorPerfilDados, "pix"> {
  return {
    instagram_handle: null,
    tiktok_handle: null,
    instagram_followers: null,
    tiktok_followers: null,
    followers_updated_at: null,
    visible_to_creators: false,
    calendar_color: COR_PADRAO_DO_CALENDARIO,
  };
}

/**
 * Cor gravada, ou o padrao quando a linha nao tem (nula ou ausente). Valor
 * que existe e nao esta na lista LANCA: e o dado em si, e degradar para o
 * violeta produziria um perfil que alguem confundiria com correto.
 */
function corDaLinha(valor: unknown): CorDoCalendario {
  if (valor === null || valor === undefined) return COR_PADRAO_DO_CALENDARIO;
  if (ehCorDoCalendario(valor)) return valor;
  throw new Error(
    `[creatorProfile] calendar_color fora da lista: ${String(valor)}`,
  );
}

function inteiroOuNull(valor: unknown, campo: string): number | null {
  return valor === null || valor === undefined ? null : numeroDe(valor, campo);
}

function tipoDaLinha(valor: unknown): TipoDeChavePix {
  if (!isTipoDeChavePix(valor)) {
    throw new Error(
      `[creatorProfile] key_type desconhecido: ${JSON.stringify(valor)}`,
    );
  }
  return valor;
}

/** Chave Pix do creator, MASCARADA, ou null quando ele nao cadastrou. */
export async function lerPixMascarada(
  userId: string,
): Promise<CreatorPixMascarada | null> {
  const { data, error } = await supabaseAdmin
    .from("creator_pix_keys")
    .select("key_type, key_value, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw erroEncadeavel(error);
  const linha: Linha | null = data;
  if (!linha) return null;
  const tipo = tipoDaLinha(linha.key_type);
  return {
    tipo,
    mascarada: mascararChavePix(tipo, textoDe(linha.key_value, "key_value")),
    updated_at: textoDe(linha.updated_at, "updated_at"),
  };
}

async function lerLinhaDoPerfil(userId: string): Promise<Linha | null> {
  const { data, error } = await supabaseAdmin
    .from("creator_profiles")
    .select(
      "instagram_handle, tiktok_handle, instagram_followers, tiktok_followers, followers_updated_at, visible_to_creators, calendar_color",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw erroEncadeavel(error);
  const linha: Linha | null = data;
  return linha;
}

/**
 * Perfil do creator com a chave mascarada. Sem linha em `creator_profiles`,
 * devolve os campos nulos e o consentimento desligado: a leitura NAO cria
 * linha, e "nunca salvou" nao e erro.
 */
export async function lerPerfilDoCreator(
  userId: string,
): Promise<CreatorPerfilDados> {
  const [linha, pix] = await Promise.all([
    lerLinhaDoPerfil(userId),
    lerPixMascarada(userId),
  ]);
  if (!linha) return { ...perfilVazio(), pix };
  if (typeof linha.visible_to_creators !== "boolean") {
    throw new Error("[creatorProfile] visible_to_creators fora do formato");
  }
  return {
    instagram_handle: textoOuNull(linha.instagram_handle, "instagram_handle"),
    tiktok_handle: textoOuNull(linha.tiktok_handle, "tiktok_handle"),
    instagram_followers: inteiroOuNull(
      linha.instagram_followers,
      "instagram_followers",
    ),
    tiktok_followers: inteiroOuNull(linha.tiktok_followers, "tiktok_followers"),
    followers_updated_at: textoOuNull(
      linha.followers_updated_at,
      "followers_updated_at",
    ),
    visible_to_creators: linha.visible_to_creators,
    calendar_color: corDaLinha(linha.calendar_color),
    pix,
  };
}

export type EntradaDoPerfil = {
  instagram_handle: string | null;
  tiktok_handle: string | null;
  instagram_followers: number | null;
  tiktok_followers: number | null;
  visible_to_creators: boolean;
  /**
   * Cor no calendario (lote 10c). OPCIONAL no corpo, ao contrario do
   * consentimento: o client anterior ao lote nao a manda, e um PUT sem ela
   * mantem a que ja esta gravada (ou o padrao), em vez de apagar a escolha
   * de quem so corrigiu o @.
   */
  calendar_color?: CorDoCalendario;
};

export type CodigoDoPerfil =
  | "invalid_body"
  | "invalid_visible_to_creators"
  | "invalid_calendar_color"
  | CodigoDeHandle
  | CodigoDeSeguidores;

/**
 * Corpo do PUT /profile, validado campo a campo pelas regras de shared. O
 * primeiro campo invalido decide o codigo, na ordem em que aparecem no
 * formulario, para o client apontar o campo certo.
 *
 * O consentimento e OBRIGATORIO no corpo: o PUT grava o perfil inteiro, e um
 * `visible_to_creators` ausente virar false em silencio desligaria o
 * consentimento de quem so queria corrigir o @.
 */
export function validarEntradaDoPerfil(
  corpo: unknown,
): Resultado<EntradaDoPerfil, CodigoDoPerfil> {
  if (typeof corpo !== "object" || corpo === null || Array.isArray(corpo)) {
    return { ok: false, code: "invalid_body" };
  }
  const c = corpo as Record<string, unknown>;
  const instagram = normalizarHandle("instagram", c.instagram_handle);
  if (!instagram.ok) return instagram;
  const seguidoresInstagram = normalizarSeguidores(
    "instagram",
    c.instagram_followers,
  );
  if (!seguidoresInstagram.ok) return seguidoresInstagram;
  const tiktok = normalizarHandle("tiktok", c.tiktok_handle);
  if (!tiktok.ok) return tiktok;
  const seguidoresTiktok = normalizarSeguidores("tiktok", c.tiktok_followers);
  if (!seguidoresTiktok.ok) return seguidoresTiktok;
  if (typeof c.visible_to_creators !== "boolean") {
    return { ok: false, code: "invalid_visible_to_creators" };
  }
  if (c.calendar_color !== undefined && !ehCorDoCalendario(c.calendar_color)) {
    return { ok: false, code: "invalid_calendar_color" };
  }
  return {
    ok: true,
    valor: {
      instagram_handle: instagram.valor,
      tiktok_handle: tiktok.valor,
      instagram_followers: seguidoresInstagram.valor,
      tiktok_followers: seguidoresTiktok.valor,
      visible_to_creators: c.visible_to_creators,
      ...(c.calendar_color === undefined
        ? {}
        : { calendar_color: c.calendar_color }),
    },
  };
}

/**
 * Data dos seguidores declarados para esta gravacao, comparando com a linha
 * que ja estava gravada:
 * - os dois seguidores nulos: null, porque sem numero nao ha data a mostrar;
 * - os dois iguais aos gravados, e a linha anterior com data: a data que ja
 *   estava, porque o numero nao mudou e continua valendo desde quando foi dito;
 * - qualquer outro caso (numero diferente, sem linha anterior, linha anterior
 *   sem data, ou um dos dois removido): o instante desta gravacao.
 */
function dataDosSeguidores(
  entrada: EntradaDoPerfil,
  anterior: Linha | null,
  instante: string,
): string | null {
  if (
    entrada.instagram_followers === null &&
    entrada.tiktok_followers === null
  ) {
    return null;
  }
  if (!anterior) return instante;
  const dataAnterior = textoOuNull(
    anterior.followers_updated_at,
    "followers_updated_at",
  );
  if (dataAnterior === null) return instante;
  const iguais =
    inteiroOuNull(anterior.instagram_followers, "instagram_followers") ===
      entrada.instagram_followers &&
    inteiroOuNull(anterior.tiktok_followers, "tiktok_followers") ===
      entrada.tiktok_followers;
  return iguais ? dataAnterior : instante;
}

/**
 * Grava o perfil inteiro (upsert por user_id) e devolve o perfil relido.
 *
 * `followers_updated_at` so muda quando os NUMEROS declarados mudam (regra em
 * `dataDosSeguidores`): trocar o @ ou o consentimento com os mesmos seguidores
 * mantem a data antiga, que e quando aqueles numeros foram ditos. Por isso a
 * linha atual e lida ANTES do upsert. Se essa leitura falhar, nada e gravado.
 */
export async function salvarPerfilDoCreator(
  userId: string,
  entrada: EntradaDoPerfil,
  agora: Date = new Date(),
): Promise<CreatorPerfilDados> {
  const instante = agora.toISOString();
  const anterior = await lerLinhaDoPerfil(userId);
  const { error } = await supabaseAdmin.from("creator_profiles").upsert(
    {
      user_id: userId,
      instagram_handle: entrada.instagram_handle,
      tiktok_handle: entrada.tiktok_handle,
      instagram_followers: entrada.instagram_followers,
      tiktok_followers: entrada.tiktok_followers,
      followers_updated_at: dataDosSeguidores(entrada, anterior, instante),
      visible_to_creators: entrada.visible_to_creators,
      // Sem cor no corpo, a gravada continua; sem nada gravado, o padrao.
      calendar_color:
        entrada.calendar_color ??
        (anterior
          ? corDaLinha(anterior.calendar_color)
          : COR_PADRAO_DO_CALENDARIO),
      updated_at: instante,
    },
    { onConflict: "user_id" },
  );
  if (error) throw erroEncadeavel(error);
  return lerPerfilDoCreator(userId);
}

/** Valida, normaliza e grava a chave; devolve so a versao mascarada. */
export async function salvarChavePix(
  userId: string,
  tipo: unknown,
  valor: unknown,
  agora: Date = new Date(),
): Promise<Resultado<CreatorPixMascarada, CodigoDeChavePix>> {
  const chave = normalizarChavePix(tipo, valor);
  if (!chave.ok) return chave;
  const instante = agora.toISOString();
  const { error } = await supabaseAdmin.from("creator_pix_keys").upsert(
    {
      user_id: userId,
      key_type: chave.valor.tipo,
      key_value: chave.valor.valor,
      updated_at: instante,
    },
    { onConflict: "user_id" },
  );
  if (error) throw erroEncadeavel(error);
  return {
    ok: true,
    valor: {
      tipo: chave.valor.tipo,
      mascarada: mascararChavePix(chave.valor.tipo, chave.valor.valor),
      updated_at: instante,
    },
  };
}

/** Apaga a chave do creator. Sem chave, e no-op (DELETE idempotente). */
export async function removerChavePix(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("creator_pix_keys")
    .delete()
    .eq("user_id", userId);
  if (error) throw erroEncadeavel(error);
}

/**
 * A chave INTEIRA. So a rota de revelacao do admin chama, e so DEPOIS de gravar
 * a auditoria em content_audit_logs (fail-closed, padrao do reveal-cpf).
 * Null quando o creator nao tem chave.
 */
export async function revelarChavePix(
  userId: string,
): Promise<{ tipo: TipoDeChavePix; valor: string } | null> {
  const { data, error } = await supabaseAdmin
    .from("creator_pix_keys")
    .select("key_type, key_value")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw erroEncadeavel(error);
  const linha: Linha | null = data;
  if (!linha) return null;
  return {
    tipo: tipoDaLinha(linha.key_type),
    valor: textoDe(linha.key_value, "key_value"),
  };
}

/**
 * Enriquecimento do quadro do admin: quem tem chave, o @ do Instagram e
 * quantas publicacoes registrou no mes (lote 09), para uma pagina inteira de
 * user_ids. Uma consulta por tabela por PAGINA (`in`), nunca uma por linha. A
 * de chave le so `user_id`: o quadro precisa saber SE ha chave, e nao qual.
 */
export async function enriquecerPaginaDoQuadro(
  userIds: string[],
  agora: Date = new Date(),
): Promise<
  Map<
    string,
    {
      tem_pix: boolean;
      instagram_handle: string | null;
      /** Confirmadas no mes (lote 10b: so as conferidas valem ponto). */
      posts_no_mes: number;
      /** Pendentes no total, de qualquer mes: o que falta conferir. */
      posts_aguardando: number;
    }
  >
> {
  const mapa = new Map<
    string,
    {
      tem_pix: boolean;
      instagram_handle: string | null;
      posts_no_mes: number;
      posts_aguardando: number;
    }
  >();
  for (const id of userIds) {
    mapa.set(id, {
      tem_pix: false,
      instagram_handle: null,
      posts_no_mes: 0,
      posts_aguardando: 0,
    });
  }
  if (userIds.length === 0) return mapa;

  const [chaves, perfis, publicacoes] = await Promise.all([
    supabaseAdmin
      .from("creator_pix_keys")
      .select("user_id")
      .in("user_id", userIds),
    supabaseAdmin
      .from("creator_profiles")
      .select("user_id, instagram_handle")
      .in("user_id", userIds),
    contarPublicacoesDoQuadro(userIds, agora),
  ]);
  if (chaves.error) throw erroEncadeavel(chaves.error);
  if (perfis.error) throw erroEncadeavel(perfis.error);

  // `forEach` e nao `for...of`: o tsconfig da aplicacao nao declara `target`,
  // entao iterar um Map direto exigiria `downlevelIteration` e o tsc reprova.
  publicacoes.forEach((contagem, dono) => {
    const item = mapa.get(dono);
    if (!item) return;
    item.posts_no_mes = contagem.no_mes;
    item.posts_aguardando = contagem.aguardando;
  });

  const linhasChave: Linha[] = chaves.data ?? [];
  for (const linha of linhasChave) {
    const item = mapa.get(textoDe(linha.user_id, "user_id"));
    if (item) item.tem_pix = true;
  }
  const linhasPerfil: Linha[] = perfis.data ?? [];
  for (const linha of linhasPerfil) {
    const item = mapa.get(textoDe(linha.user_id, "user_id"));
    if (item) {
      item.instagram_handle = textoOuNull(
        linha.instagram_handle,
        "instagram_handle",
      );
    }
  }
  return mapa;
}
