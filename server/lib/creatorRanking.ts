// RANKING MENSAL DOS CREATORS (lote 11): a montagem do mes.
//
// O banco CONTA (funcao `creator_ranking_counts`, uma consulta para o mes
// inteiro) e o servidor PONTUA, pela regra de shared/creatorRanking.ts. A
// lista e de TODOS os creators ativos, para quem nao pontuou aparecer com zero
// no fim, e nao sumir: sumir parece erro, zero e informacao.
//
// O que sai de OUTRA pessoa e o mesmo que o calendario ja expoe (nome, @,
// avatar, cor), lido pelas mesmas funcoes, e sob a mesma regra de
// consentimento (lote 11j, `aplicarConsentimento`): o @ de quem nao ligou
// "mostrar meu @" sai para os outros creators.
//
// A montagem e NEUTRA (nao sabe quem olha), de proposito: e ela que vai para o
// cache por mes, e um cache com `eu` marcado serviria a posicao de uma pessoa
// para todas as outras. Quem olha entra depois, em `personalizarRanking`. O @
// vai CRU para o cache, com a lista de quem nao consentiu ao lado: o admin le
// o mesmo cache e ve tudo, e e a personalizacao que esconde.

import { inicioDoDiaBrasilia } from "../../shared/brasiliaDay";
import {
  limitesDoMes,
  parseMesDoCalendario,
} from "../../shared/creatorCalendar";
import { AVATAR_PADRAO } from "../../shared/creatorAvatar";
import type { RedeDeCreator } from "../../shared/creatorProfile";
import type { Resultado } from "../../shared/creatorProfile";
import { COR_PADRAO_DO_CALENDARIO } from "../../shared/creatorProfile";
import { ehCorDoCalendario } from "../../shared/creatorProfile";
import {
  calcularPontos,
  compararCandidatos,
  CONTAGENS_ZERADAS,
  mesDoDia,
  mesTemRanking,
  mesVizinho,
  TETO_DE_CLIQUES_POR_DIA,
  totalDePublicacoes,
  type CandidatoDoRanking,
  type ContagensDoRanking,
  type PosicaoDoRanking,
  type RankingDoMes,
} from "../../shared/creatorRanking";
import { lerAutores } from "./creatorCalendar";
import type { Linha } from "./creatorDashboard";
import { numeroDe, textoDe, textoOuNull } from "./creatorDashboard";
import { aplicarConsentimento, consentimentoDaLinha } from "./creatorProfile";
import { coletarTudoProvandoTotal } from "./paginate";
import { erroEncadeavel } from "./supabaseError";
import { supabaseAdmin } from "./supabaseAdmin";

export type CodigoDoRanking = "month_out_of_range";

export type MesDoRanking = { ano: number; mes: number; chave: string };

/**
 * O mes pedido em `?mes=`: ausente e o mes de HOJE; formato errado, mes futuro
 * e mes anterior ao inicio do programa viram o MESMO 400, porque para quem
 * chamou os tres sao "esse mes eu nao tenho".
 */
export function resolverMesDoRanking(
  valor: unknown,
  hoje: string,
): Resultado<MesDoRanking, CodigoDoRanking> {
  const atual = mesDoDia(hoje);
  if (valor === undefined) {
    const lido = parseMesDoCalendario(atual);
    if (!lido)
      throw new Error(`[creatorRanking] hoje fora do formato: ${hoje}`);
    return { ok: true, valor: { ...lido, chave: atual } };
  }
  const lido = parseMesDoCalendario(valor);
  if (!lido) return { ok: false, code: "month_out_of_range" };
  const chave = `${lido.ano}-${String(lido.mes).padStart(2, "0")}`;
  if (!mesTemRanking(chave, atual)) {
    return { ok: false, code: "month_out_of_range" };
  }
  return { ok: true, valor: { ...lido, chave } };
}

type CreatorAtivo = { user_id: string; granted_at: string };

/**
 * Os creators ATIVOS do ranking: so os `afiliado` (lote 11b). Os `influencer`
 * sao as contas de julho, sem atividade nenhuma nas ferramentas; a coorte que
 * usa o calendario, registra publicacao e vende e a dos afiliados, e um
 * ranking com 24 zeros no fim so empurra quem pontuou para longe da vista.
 */
async function lerCreatorsAtivos(): Promise<CreatorAtivo[]> {
  const linhas = await coletarTudoProvandoTotal<Linha>(
    (from, to) =>
      supabaseAdmin
        .from("creators")
        .select("user_id, granted_at", { count: "exact" })
        .is("revoked_at", null)
        .eq("kind", "afiliado")
        .order("granted_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to),
    { op: "creator ranking creators", rowKey: (l) => String(l.user_id) },
  );
  return linhas.map((l) => ({
    user_id: textoDe(l.user_id, "user_id"),
    granted_at: textoDe(l.granted_at, "granted_at"),
  }));
}

type PerfilDeCreator = {
  handle: string | null;
  rede_do_handle: RedeDeCreator | null;
  calendar_color: string;
  /** `visible_to_creators` (lote 11j); sem linha e false. */
  visivel: boolean;
};

/**
 * O @ e a cor de cada creator, numa consulta so. O @ mostrado e o primeiro
 * cadastrado no perfil de creator (Instagram, depois TikTok); sem nenhum, quem
 * chama cai no @ da conta (`profiles.handle`) com rede nula. Cor fora da lista
 * LANCA, como no calendario: e o dado em si.
 */
async function lerPerfisDeCreator(
  userIds: string[],
): Promise<Map<string, PerfilDeCreator>> {
  const mapa = new Map<string, PerfilDeCreator>();
  if (userIds.length === 0) return mapa;
  const { data, error } = await supabaseAdmin
    .from("creator_profiles")
    .select(
      "user_id, instagram_handle, tiktok_handle, calendar_color, visible_to_creators",
    )
    .in("user_id", userIds);
  if (error) throw erroEncadeavel(error);
  const linhas: Linha[] = data ?? [];
  for (const linha of linhas) {
    const instagram = textoOuNull(linha.instagram_handle, "instagram_handle");
    const tiktok = textoOuNull(linha.tiktok_handle, "tiktok_handle");
    const cor = linha.calendar_color ?? COR_PADRAO_DO_CALENDARIO;
    if (!ehCorDoCalendario(cor)) {
      throw new Error(
        `[creatorRanking] calendar_color fora da lista: ${String(cor)}`,
      );
    }
    mapa.set(textoDe(linha.user_id, "user_id"), {
      handle: instagram ?? tiktok,
      rede_do_handle: instagram ? "instagram" : tiktok ? "tiktok" : null,
      calendar_color: cor,
      visivel: consentimentoDaLinha(linha.visible_to_creators),
    });
  }
  return mapa;
}

/** As contagens do mes, por creator, na forma da funcao SQL. */
async function lerContagens(
  inicioIso: string,
  fimIso: string,
): Promise<Map<string, ContagensDoRanking>> {
  const { data, error } = await supabaseAdmin.rpc("creator_ranking_counts", {
    p_inicio: inicioIso,
    p_fim: fimIso,
    p_teto_cliques_dia: TETO_DE_CLIQUES_POR_DIA,
  });
  if (error) throw erroEncadeavel(error);
  const mapa = new Map<string, ContagensDoRanking>();
  const linhas: Linha[] = Array.isArray(data) ? (data as Linha[]) : [];
  for (const l of linhas) {
    mapa.set(textoDe(l.user_id, "user_id"), {
      ig_posts: numeroDe(l.ig_posts, "ig_posts"),
      reels: numeroDe(l.reels, "reels"),
      stories: numeroDe(l.stories, "stories"),
      videos: numeroDe(l.videos, "videos"),
      li_posts: numeroDe(l.li_posts, "li_posts"),
      vendas: numeroDe(l.vendas, "vendas"),
      cliques: numeroDe(l.cliques, "cliques"),
      cadastros: numeroDe(l.cadastros, "cadastros"),
    });
  }
  return mapa;
}

/**
 * A montagem neutra com o que a personalizacao precisa e o client nao recebe:
 * quem nao consentiu em mostrar o @ (lote 11j). E este objeto que vai para o
 * cache; `personalizarRanking` e `rankingParaOAdmin` devolvem `RankingDoMes`.
 */
export type RankingMontado = RankingDoMes & {
  /** user_ids com `visible_to_creators` false: o @ deles sai para os outros
   * creators. Ausente no cache gravado antes do lote 11j (TTL de 60 s). */
  ocultos?: string[];
};

/**
 * O ranking de um mes, NEUTRO (sem `eu`, sem `minha_posicao`). E o que vai
 * para o cache; `personalizarRanking` poe quem olha.
 *
 * Intervalo: [meia-noite de Brasilia do dia 1, meia-noite de Brasilia do dia 1
 * do mes seguinte). Creator revogado sai da lista mesmo num mes fechado em que
 * pontuou: a lista e de quem esta no programa hoje.
 */
export async function montarRanking(
  ano: number,
  mes: number,
  hoje: string,
): Promise<RankingMontado> {
  const { primeiro } = limitesDoMes(ano, mes);
  const chave = mesDoDia(primeiro);
  const primeiroDoSeguinte = `${mesVizinho(chave, 1)}-01`;
  const inicioIso = inicioDoDiaBrasilia(primeiro);
  const fimIso = inicioDoDiaBrasilia(primeiroDoSeguinte);

  const [contagens, ativos] = await Promise.all([
    lerContagens(inicioIso, fimIso),
    lerCreatorsAtivos(),
  ]);
  const ids = ativos.map((c) => c.user_id);
  const [autores, perfis] = await Promise.all([
    lerAutores(ids),
    lerPerfisDeCreator(ids),
  ]);

  const candidatos = ativos.map((c) => {
    const contagem = contagens.get(c.user_id) ?? CONTAGENS_ZERADAS;
    const candidato: CandidatoDoRanking & { contagem: ContagensDoRanking } = {
      user_id: c.user_id,
      granted_at: c.granted_at,
      pontos: calcularPontos(contagem),
      vendas: contagem.vendas,
      publicacoes: totalDePublicacoes(contagem),
      contagem,
    };
    return candidato;
  });
  candidatos.sort(compararCandidatos);

  const posicoes: PosicaoDoRanking[] = candidatos.map((c, i) => {
    const autor = autores.get(c.user_id);
    const perfil = perfis.get(c.user_id);
    return {
      posicao: i + 1,
      user_id: c.user_id,
      name: autor?.name ?? null,
      handle: perfil?.handle ?? autor?.handle ?? null,
      rede_do_handle: perfil?.handle ? perfil.rede_do_handle : null,
      avatar_url: autor?.avatar_url ?? null,
      avatar: autor?.avatar ?? AVATAR_PADRAO,
      calendar_color: perfil?.calendar_color ?? COR_PADRAO_DO_CALENDARIO,
      pontos: c.pontos,
      contagens: {
        publicacoes: c.publicacoes,
        vendas: c.vendas,
        cliques: c.contagem.cliques,
        cadastros: c.contagem.cadastros,
      },
      eu: false,
    };
  });

  const fechado = chave < mesDoDia(hoje);
  return {
    mes: chave,
    fechado,
    fecha_em: fechado ? null : fimIso,
    posicoes,
    minha_posicao: null,
    ocultos: ids.filter((id) => !(perfis.get(id)?.visivel ?? false)),
  };
}

/** Os campos que saem para o client, e nada da montagem (`ocultos`). */
function rankingDaMontagem(
  base: RankingMontado,
  posicoes: PosicaoDoRanking[],
): RankingDoMes {
  return {
    mes: base.mes,
    fechado: base.fechado,
    fecha_em: base.fecha_em,
    posicoes,
    minha_posicao: posicoes.find((p) => p.eu) ?? null,
  };
}

/**
 * O ranking neutro com quem olha marcado e o consentimento aplicado (lote
 * 11j): o @ de quem esta em `ocultos` sai, menos o do proprio viewer. Nao
 * muda o objeto do cache.
 */
export function personalizarRanking(
  base: RankingMontado,
  viewerId: string,
): RankingDoMes {
  const ocultos = new Set(base.ocultos ?? []);
  const posicoes = base.posicoes.map((p) => ({
    ...aplicarConsentimento(p, !ocultos.has(p.user_id), viewerId),
    eu: p.user_id === viewerId,
  }));
  return rankingDaMontagem(base, posicoes);
}

/** O ranking como o admin o ve: tudo, sem `eu` e sem `ocultos`. */
export function rankingParaOAdmin(base: RankingMontado): RankingDoMes {
  return rankingDaMontagem(base, base.posicoes);
}
