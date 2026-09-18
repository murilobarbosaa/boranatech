import type {
  CreatorBoardItem,
  CreatorBoardKind,
  CreatorBoardPage,
  CreatorBoardResumo,
  CreatorBoardStatus,
} from "../../shared/creatorDashboard";
import type { Linha } from "./creatorDashboard";
import {
  numeroDe,
  resolverJanelaDoPainel,
  textoDe,
  textoOuNull,
} from "./creatorDashboard";
import { creatorKindOf } from "./creatorKind";
import { enriquecerPaginaDoQuadro } from "./creatorProfile";
import { erroEncadeavel } from "./supabaseError";
import { supabaseAdmin } from "./supabaseAdmin";

/**
 * QUADRO DE CREATORS DO ADMIN: a lista paginada e os numeros do topo.
 *
 * Toda agregacao acontece no banco (`admin_creators_page` e
 * `creators_board_summary`, migration 20260914120100), porque os agregados do
 * PostgREST estao desligados em producao e a alternativa seria ler linhas
 * brutas e somar aqui, sob o teto de linhas que trunca em silencio. A pagina
 * tem no maximo 100 linhas (parsePageParams), bem abaixo desse teto.
 *
 * PERFIL DE CREATOR (lote 08): cada linha da pagina ganha `tem_pix` e o @ do
 * Instagram, lidos DEPOIS da pagina, uma consulta por tabela para a pagina
 * inteira (`enriquecerPaginaDoQuadro`). A funcao SQL `admin_creators_page` nao
 * foi tocada: mexer nela exigiria migration de `create or replace`, que o
 * guard so enxerga por nome.
 *
 * ERRO LANCA, e linha fora do formato tambem: a rota transforma em 500. Uma
 * lista vazia com 200 seria indistinguivel de "nao ha creators".
 */

function linhaDe(valor: unknown, onde: string): Linha {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) {
    throw new Error(`[creatorBoard] ${onde}: linha fora do formato`);
  }
  return valor as Linha;
}

function linhasDe(valor: unknown, onde: string): Linha[] {
  if (!Array.isArray(valor)) {
    throw new Error(`[creatorBoard] ${onde}: resposta nao e lista`);
  }
  return valor.map((item: unknown) => linhaDe(item, onde));
}

function lerCodigosResumidos(
  valor: unknown,
): Array<{ code: string; status: string }> {
  return linhasDe(valor, "codigos").map((c) => ({
    code: textoDe(c.code, "codigos.code"),
    status: textoDe(c.status, "codigos.status"),
  }));
}

function lerItem(r: Linha): CreatorBoardItem {
  return {
    user_id: textoDe(r.user_id, "user_id"),
    kind: creatorKindOf(r.kind),
    granted_at: textoDe(r.granted_at, "granted_at"),
    revoked_at: textoOuNull(r.revoked_at, "revoked_at"),
    name: textoOuNull(r.name, "name"),
    email: textoOuNull(r.email, "email"),
    handle: textoOuNull(r.handle, "handle"),
    avatar_url: textoOuNull(r.avatar_url, "avatar_url"),
    codigos_count: numeroDe(r.codigos_count, "codigos_count"),
    codigos: lerCodigosResumidos(r.codigos),
    totais: {
      clicks: numeroDe(r.clicks, "clicks"),
      sales: numeroDe(r.sales, "sales"),
      revenue_cents: numeroDe(r.revenue_cents, "revenue_cents"),
      commission_due_cents: numeroDe(
        r.commission_due_cents,
        "commission_due_cents",
      ),
      commission_paid_cents: numeroDe(
        r.commission_paid_cents,
        "commission_paid_cents",
      ),
    },
    ultimo_evento_at: textoOuNull(r.ultimo_evento_at, "ultimo_evento_at"),
  };
}

async function paginaDoQuadro(
  status: CreatorBoardStatus,
  kind: CreatorBoardKind,
  limit: number,
  offset: number,
): Promise<Linha[]> {
  const { data, error } = await supabaseAdmin.rpc("admin_creators_page", {
    p_status: status,
    p_kind: kind,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) {
    console.error("[creatorBoard] admin_creators_page falhou:", error);
    throw erroEncadeavel(error);
  }
  return linhasDe(data, "admin_creators_page");
}

export async function listarCreatorsDoQuadro(filtro: {
  status: CreatorBoardStatus;
  kind: CreatorBoardKind;
  page: number;
  pageSize: number;
}): Promise<CreatorBoardPage> {
  const { status, kind, page, pageSize } = filtro;
  const offset = (page - 1) * pageSize;
  const linhas = await paginaDoQuadro(status, kind, pageSize, offset);

  let total: number;
  if (linhas.length > 0) {
    // `count(*) over ()` repete o total em toda linha da pagina.
    total = numeroDe(linhas[0].total_count, "total_count");
  } else if (offset === 0) {
    total = 0;
  } else {
    // Pagina ALEM do fim: sem linha, o total nao tem onde morar, e zero aqui
    // seria mentira (o conjunto nao e vazio, a pagina e que passou dele). Uma
    // segunda ida, so neste caso, le o total na primeira pagina.
    const primeira = await paginaDoQuadro(status, kind, 1, 0);
    total =
      primeira.length > 0
        ? numeroDe(primeira[0].total_count, "total_count")
        : 0;
  }

  const itens = linhas.map(lerItem);
  const extras = await enriquecerPaginaDoQuadro(itens.map((i) => i.user_id));
  const rows = itens.map((item) => {
    const extra = extras.get(item.user_id);
    return {
      ...item,
      tem_pix: extra?.tem_pix ?? false,
      instagram_handle: extra?.instagram_handle ?? null,
      posts_no_mes: extra?.posts_no_mes ?? 0,
      posts_aguardando: extra?.posts_aguardando ?? 0,
    };
  });

  return { rows, total, page, pageSize };
}

/**
 * Cards do topo. A janela de eventos e a mesma do painel em "30d" (30 dias
 * civis de Brasilia terminando hoje), para o card do quadro e o painel de um
 * creator contarem o mesmo intervalo.
 */
export async function resumoDoQuadro(
  agora: Date = new Date(),
): Promise<CreatorBoardResumo> {
  const { inicioIso } = resolverJanelaDoPainel("30d", agora);
  if (!inicioIso) {
    throw new Error("[creatorBoard] janela de 30 dias sem inicio");
  }

  const { data, error } = await supabaseAdmin.rpc("creators_board_summary", {
    p_from: inicioIso,
  });
  if (error) {
    console.error("[creatorBoard] creators_board_summary falhou:", error);
    throw erroEncadeavel(error);
  }
  const linhas = linhasDe(data, "creators_board_summary");
  if (linhas.length !== 1) {
    throw new Error(
      `[creatorBoard] creators_board_summary devolveu ${linhas.length} linhas, esperado 1`,
    );
  }
  const r = linhas[0];

  return {
    creators_ativos: {
      influencer: numeroDe(r.creators_influencer, "creators_influencer"),
      afiliado: numeroDe(r.creators_afiliado, "creators_afiliado"),
    },
    codigos: {
      vinculados: numeroDe(r.codigos_vinculados, "codigos_vinculados"),
      sem_dono: numeroDe(r.codigos_sem_dono, "codigos_sem_dono"),
    },
    eventos_30d: {
      desde: inicioIso,
      clicks: numeroDe(r.clicks_periodo, "clicks_periodo"),
      sales: numeroDe(r.sales_periodo, "sales_periodo"),
    },
    commission_due_cents: numeroDe(
      r.commission_due_cents,
      "commission_due_cents",
    ),
  };
}
