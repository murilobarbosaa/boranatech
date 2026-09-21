import { AVATAR_PADRAO } from "../../shared/creatorAvatar";
import { lerAvatares } from "./creatorAvatar";
import {
  diaBrasilia,
  inicioDoDiaBrasilia,
  somarDiaCivil,
} from "../../shared/brasiliaDay";
import type {
  CreatorDashboard,
  CreatorDashboardCodigo,
  CreatorDashboardJanela,
  CreatorDashboardSerieDia,
  CreatorEventosSomas,
} from "../../shared/creatorDashboard";
import {
  CREATOR_DASHBOARD_JANELA_PADRAO,
  INICIO_MEDICAO_CLIQUES,
  isCreatorDashboardJanela,
  linkDoCodigo,
} from "../../shared/creatorDashboard";
import { creatorKindOf } from "./creatorKind";
import type { PaginatedPageComContagem } from "./paginate";
import { coletarTudoProvandoTotal } from "./paginate";
import { erroEncadeavel } from "./supabaseError";
import { supabaseAdmin } from "./supabaseAdmin";

/**
 * MONTADOR UNICO do painel de creator. Serve o proprio creator
 * (`/api/creator/me`, visao "creator") e o admin abrindo o painel de qualquer
 * um (`/api/admin/creators/:userId`, visao "admin"). O admin ve exatamente o
 * mesmo payload, mais tres campos que so ele deve ver: `perfil.email`,
 * `codigos[].notes` e `creator.granted_by`. Na visao creator esses campos nem
 * sao LIDOS do banco, entao nao ha como vazarem por engano de serializacao.
 *
 * DUAS FONTES, NUNCA SOMADAS:
 *   - `totais` e os numeros por codigo vem dos CONTADORES de `affiliates`, a
 *     fonte de verdade desde o inicio;
 *   - `eventos` (serie por dia, periodo, ultimo clique e ultima venda) vem de
 *     `creator_events`. Ha dois marcos, e nao um so: `clicks_since` e o
 *     inicio global da medicao de cliques (`INICIO_MEDICAO_CLIQUES`, o deploy
 *     do lote 01), igual para todo creator; `sales_since` e a primeira venda
 *     do creator, que pode ser anterior, porque as vendas de antes da tabela
 *     foram reconstruidas (migration 20260915100000).
 *
 * CUSTO FIXO: o numero de consultas nao depende de quantos codigos ou eventos o
 * creator tem (nunca N+1). A serie vem agregada do banco
 * (`creator_events_daily`, uma linha por dia por tipo), e mesmo ela e paginada
 * com prova de total, porque o teto de 1000 linhas do PostgREST vale para
 * retorno de funcao (medido em 02/09/2026 com admin_auth_times, ver
 * server/lib/authUsers.ts), e em "all" a serie cresce 3 linhas por dia.
 *
 * ERRO LANCA. Qualquer consulta que falhe derruba o painel inteiro; a rota
 * transforma em 500. Nunca devolve painel parcial com zero no lugar do que
 * falhou, porque zero ali seria lido como "nada aconteceu".
 */

export type VisaoDoPainel = "creator" | "admin";

export type ResultadoDoPainel =
  | { ok: true; painel: CreatorDashboard }
  | { ok: false; reason: "not_creator" };

// ---------------------------------------------------------------------------
// JANELA
// ---------------------------------------------------------------------------

/**
 * Janela em dias civis de Brasilia, a mesma aritmetica de `resolverJanela`
 * (server/lib/overviewWindow.ts): N dias TERMINANDO hoje, hoje incluido.
 *
 * Tipo proprio, e nao `OverviewWindow`, porque aquele e `"7" | "30" | "all"`:
 * nao tem 90 dias e escreve os valores sem o sufixo que o contrato do painel
 * usa. A aritmetica e a mesma e vem das mesmas funcoes de brasiliaDay.
 *
 * Intervalos MEIO-ABERTOS `[inicio, fim)`, que e o que `creator_events_daily`
 * filtra (`>= p_from and < p_to`): o fim da janela atual e o inicio de AMANHA,
 * e o fim do periodo anterior e o inicio da janela atual. Nenhum instante cai
 * nos dois periodos, e nenhum fica de fora.
 */
export type JanelaDoPainel = {
  /** Primeiro dia civil da janela; null em "all" (comeca em events_since). */
  primeiroDiaCivil: string | null;
  /** Hoje, em Brasilia. */
  ultimoDiaCivil: string;
  /** Inicio da janela (ISO UTC); null em "all". */
  inicioIso: string | null;
  /** Inicio de amanha em Brasilia (ISO UTC), exclusivo. */
  fimIso: string;
  /** Periodo anterior de mesmo tamanho; os dois null em "all". */
  anteriorInicioIso: string | null;
  anteriorFimIso: string | null;
};

const DIAS_DA_JANELA: Record<Exclude<CreatorDashboardJanela, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/**
 * `?janela=` da query. Ausente: o padrao (30d). Qualquer outra coisa que nao
 * seja uma das quatro, inclusive o parametro repetido (que o Express entrega
 * como array): null, e a rota responde 400. Nunca cai no padrao em silencio,
 * porque o client que pediu 90d e recebeu 30d leria o numero errado.
 */
export function parseJanelaDoPainel(
  valor: unknown,
): CreatorDashboardJanela | null {
  if (valor === undefined) return CREATOR_DASHBOARD_JANELA_PADRAO;
  return isCreatorDashboardJanela(valor) ? valor : null;
}

export function resolverJanelaDoPainel(
  janela: CreatorDashboardJanela,
  agora: Date = new Date(),
): JanelaDoPainel {
  const hoje = diaBrasilia(agora.toISOString());
  if (!hoje) {
    throw new Error("resolverJanelaDoPainel: instante invalido");
  }
  const fimIso = inicioDoDiaBrasilia(somarDiaCivil(hoje, 1));

  if (janela === "all") {
    return {
      primeiroDiaCivil: null,
      ultimoDiaCivil: hoje,
      inicioIso: null,
      fimIso,
      anteriorInicioIso: null,
      anteriorFimIso: null,
    };
  }

  const dias = DIAS_DA_JANELA[janela];
  const primeiroDiaCivil = somarDiaCivil(hoje, -(dias - 1));
  const inicioIso = inicioDoDiaBrasilia(primeiroDiaCivil);
  return {
    primeiroDiaCivil,
    ultimoDiaCivil: hoje,
    inicioIso,
    fimIso,
    anteriorInicioIso: inicioDoDiaBrasilia(
      somarDiaCivil(primeiroDiaCivil, -dias),
    ),
    anteriorFimIso: inicioIso,
  };
}

// ---------------------------------------------------------------------------
// LEITURA DE LINHA
//
// O `supabaseAdmin` nao e tipado com o schema, entao cada linha chega sem tipo.
// Os leitores abaixo afirmam o tipo de cada campo e LANCAM no inesperado: um
// contador nulo ou textual virando 0 produziria um painel plausivel e errado,
// indistinguivel do certo (a regra do CLAUDE.md para valor que E a
// informacao).
// ---------------------------------------------------------------------------

export type Linha = Record<string, unknown>;

export function numeroDe(valor: unknown, campo: string): number {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  // bigint pode chegar como texto, conforme a configuracao do PostgREST.
  if (typeof valor === "string" && /^-?\d+(\.\d+)?$/.test(valor)) {
    return Number(valor);
  }
  throw new Error(
    `[creatorDashboard] ${campo} nao numerico: ${JSON.stringify(valor)}`,
  );
}

export function textoDe(valor: unknown, campo: string): string {
  if (typeof valor === "string") return valor;
  throw new Error(
    `[creatorDashboard] ${campo} nao textual: ${JSON.stringify(valor)}`,
  );
}

export function textoOuNull(valor: unknown, campo: string): string | null {
  if (valor === null || valor === undefined) return null;
  return textoDe(valor, campo);
}

function falhaDeLeitura(op: string, error: unknown): unknown {
  console.error(`[creatorDashboard] ${op} falhou:`, error);
  return erroEncadeavel(error);
}

// ---------------------------------------------------------------------------
// SERIE
// ---------------------------------------------------------------------------

type LinhaDiaria = {
  dia: string;
  event_type: string;
  quantidade: number;
  revenue_cents: number;
  commission_cents: number;
};

async function lerSerieDiaria(
  ids: string[],
  deIso: string,
  ateIso: string,
  op: string,
): Promise<LinhaDiaria[]> {
  const brutas = await coletarTudoProvandoTotal<Linha>(
    (from, to) =>
      supabaseAdmin
        .rpc(
          "creator_events_daily",
          { p_affiliate_ids: ids, p_from: deIso, p_to: ateIso },
          { count: "exact" },
        )
        // A funcao ja ordena, e a ordem aqui e a que a PAGINACAO usa: OFFSET
        // sem ordem definida repete e pula linhas mantendo a contagem certa.
        .order("dia")
        .order("event_type")
        .range(from, to),
    { op },
  );
  return brutas.map((b) => {
    const dia = textoDe(b.dia, "dia");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) {
      throw new Error(`[creatorDashboard] dia fora do formato: "${dia}"`);
    }
    return {
      dia,
      event_type: textoDe(b.event_type, "event_type"),
      quantidade: numeroDe(b.quantidade, "quantidade"),
      revenue_cents: numeroDe(b.revenue_cents, "revenue_cents"),
      commission_cents: numeroDe(b.commission_cents, "commission_cents"),
    };
  });
}

function somasZeradas(): CreatorEventosSomas {
  return {
    clicks: 0,
    checkouts: 0,
    sales: 0,
    revenue_cents: 0,
    commission_cents: 0,
  };
}

/**
 * Receita e comissao entram SO pela linha de venda. Um checkout pode carregar o
 * preco do plano, e soma-lo junto contaria a mesma receita duas vezes (no
 * checkout e na venda que o fecha).
 */
function acumular(alvo: CreatorEventosSomas, linha: LinhaDiaria) {
  switch (linha.event_type) {
    case "click":
      alvo.clicks += linha.quantidade;
      return;
    case "checkout":
      alvo.checkouts += linha.quantidade;
      return;
    case "sale":
      alvo.sales += linha.quantidade;
      alvo.revenue_cents += linha.revenue_cents;
      alvo.commission_cents += linha.commission_cents;
      return;
    default:
      // O CHECK da tabela restringe a tres tipos. Um quarto aqui e tipo novo no
      // banco antes do codigo, e ignora-lo esconderia eventos do painel.
      throw new Error(
        `[creatorDashboard] event_type desconhecido: "${linha.event_type}"`,
      );
  }
}

function somar(linhas: LinhaDiaria[]): CreatorEventosSomas {
  const total = somasZeradas();
  for (const linha of linhas) acumular(total, linha);
  return total;
}

/** Um item por dia civil de `primeiroDia` a `ultimoDia`, com zeros nos vazios. */
function montarSerie(
  linhas: LinhaDiaria[],
  primeiroDia: string,
  ultimoDia: string,
): CreatorDashboardSerieDia[] {
  const porDia = new Map<string, CreatorEventosSomas>();
  for (const linha of linhas) {
    let somas = porDia.get(linha.dia);
    if (!somas) {
      somas = somasZeradas();
      porDia.set(linha.dia, somas);
    }
    acumular(somas, linha);
  }
  const serie: CreatorDashboardSerieDia[] = [];
  // Comparacao de string vale: AAAA-MM-DD ordena lexicograficamente.
  for (let dia = primeiroDia; dia <= ultimoDia; dia = somarDiaCivil(dia)) {
    serie.push({ dia, ...(porDia.get(dia) ?? somasZeradas()) });
  }
  return serie;
}

// ---------------------------------------------------------------------------
// MONTADOR
// ---------------------------------------------------------------------------

// Listas de coluna LITERAIS em cada ramo, e nao uma variavel: o supabase-js
// parseia o literal do `select` no nivel de tipo, e tanto a uniao de dois
// literais quanto uma `string` larga viram tipo de erro (ParserError,
// GenericStringError). O ramo admin le as colunas que so o admin ve; o ramo
// creator nem as pede ao banco.
async function lerPerfil(
  userId: string,
  admin: boolean,
): Promise<Linha | null> {
  const { data, error } = admin
    ? await supabaseAdmin
        .from("profiles")
        .select("name, handle, avatar_url, email")
        .eq("user_id", userId)
        .maybeSingle()
    : await supabaseAdmin
        .from("profiles")
        .select("name, handle, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();
  if (error) throw falhaDeLeitura("profiles", error);
  const linha: Linha | null = data;
  return linha;
}

function paginaDeCodigos(
  userId: string,
  admin: boolean,
  from: number,
  to: number,
): PromiseLike<PaginatedPageComContagem<Linha>> {
  return admin
    ? supabaseAdmin
        .from("affiliates")
        .select(
          "id, code, status, discount_percent, commission_percent, clicks, sales, revenue_cents, commission_due_cents, commission_paid_cents, created_at, notes",
          { count: "exact" },
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to)
    : supabaseAdmin
        .from("affiliates")
        .select(
          "id, code, status, discount_percent, commission_percent, clicks, sales, revenue_cents, commission_due_cents, commission_paid_cents, created_at",
          { count: "exact" },
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to);
}

function lerCodigo(linha: Linha, admin: boolean): CreatorDashboardCodigo {
  const code = textoDe(linha.code, "code");
  const codigo: CreatorDashboardCodigo = {
    id: textoDe(linha.id, "id"),
    code,
    status: textoDe(linha.status, "status"),
    discount_percent: numeroDe(linha.discount_percent, "discount_percent"),
    commission_percent: numeroDe(
      linha.commission_percent,
      "commission_percent",
    ),
    link: linkDoCodigo(code),
    clicks: numeroDe(linha.clicks, "clicks"),
    sales: numeroDe(linha.sales, "sales"),
    revenue_cents: numeroDe(linha.revenue_cents, "revenue_cents"),
    commission_due_cents: numeroDe(
      linha.commission_due_cents,
      "commission_due_cents",
    ),
    commission_paid_cents: numeroDe(
      linha.commission_paid_cents,
      "commission_paid_cents",
    ),
    // Nullable no schema (linhas antigas de affiliates). Os contadores e os
    // percentuais sao NOT NULL, e por isso la um nulo lanca e aqui nao.
    created_at: textoOuNull(linha.created_at, "created_at"),
  };
  if (admin) codigo.notes = textoOuNull(linha.notes, "notes");
  return codigo;
}

async function ultimoEvento(
  ids: string[],
  tipo: "click" | "sale",
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("creator_events")
    .select("occurred_at")
    .in("affiliate_id", ids)
    .eq("event_type", tipo)
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw falhaDeLeitura(`ultimo ${tipo}`, error);
  const linha: Linha | null = data;
  return linha ? textoDe(linha.occurred_at, "occurred_at") : null;
}

/**
 * Primeiro evento dos codigos: de qualquer tipo (`tipo` null, o inicio da serie)
 * ou a primeira venda (o marco de vendas).
 */
async function primeiroEvento(
  ids: string[],
  tipo: "sale" | null,
): Promise<string | null> {
  const base = supabaseAdmin
    .from("creator_events")
    .select("occurred_at")
    .in("affiliate_id", ids);
  const { data, error } = await (tipo ? base.eq("event_type", tipo) : base)
    .order("occurred_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw falhaDeLeitura(tipo ? `primeiro ${tipo}` : "inicio da serie", error);
  }
  const linha: Linha | null = data;
  return linha ? textoDe(linha.occurred_at, "occurred_at") : null;
}

/**
 * Conversao em percentual com duas casas; null quando nao ha clique (divisao
 * por zero nao e 0%, e "sem base").
 */
export function conversaoPct(sales: number, clicks: number): number | null {
  if (clicks === 0) return null;
  return Math.round((sales / clicks) * 10000) / 100;
}

export async function montarPainelDoCreator(
  userId: string,
  janela: CreatorDashboardJanela,
  visao: VisaoDoPainel,
  agora: Date = new Date(),
): Promise<ResultadoDoPainel> {
  const admin = visao === "admin";
  const intervalo = resolverJanelaDoPainel(janela, agora);

  // 1. Concessao. Visao creator: so a ATIVA. Visao admin: a mais recente,
  //    mesmo revogada (o admin abre o painel de quem ja saiu).
  const concessao = admin
    ? await supabaseAdmin
        .from("creators")
        .select("kind, granted_at, revoked_at, granted_by")
        .eq("user_id", userId)
        .order("granted_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle()
    : await supabaseAdmin
        .from("creators")
        .select("kind, granted_at, revoked_at")
        .eq("user_id", userId)
        .is("revoked_at", null)
        .maybeSingle();
  if (concessao.error) throw falhaDeLeitura("creators", concessao.error);
  const linhaConcessao: Linha | null = concessao.data;
  if (!linhaConcessao) return { ok: false, reason: "not_creator" };

  // 2 e 3. Perfil e codigos, independentes entre si. Codigos paginados com
  // prova de total, pelo mesmo motivo da serie.
  const [linhaPerfil, linhasCodigo, avatares] = await Promise.all([
    lerPerfil(userId, admin),
    coletarTudoProvandoTotal<Linha>(
      (from, to) => paginaDeCodigos(userId, admin, from, to),
      { op: "creator dashboard affiliates" },
    ),
    // O avatar pela regra do site (lote 11b), em paralelo com o resto.
    lerAvatares([userId]),
  ]);
  const avatar = avatares.get(userId) ?? AVATAR_PADRAO;

  const codigos = linhasCodigo.map((linha) => lerCodigo(linha, admin));
  const ids = codigos.map((c) => c.id);

  const totaisBase = {
    clicks: 0,
    sales: 0,
    revenue_cents: 0,
    commission_due_cents: 0,
    commission_paid_cents: 0,
  };
  for (const c of codigos) {
    totaisBase.clicks += c.clicks;
    totaisBase.sales += c.sales;
    totaisBase.revenue_cents += c.revenue_cents;
    totaisBase.commission_due_cents += c.commission_due_cents;
    totaisBase.commission_paid_cents += c.commission_paid_cents;
  }

  // 4 a 8. Eventos. Sem codigo nao ha evento possivel, e `.in` com lista vazia
  // nao e consulta que valha a ida ao banco.
  //
  // O INICIO DA SERIE e o primeiro evento de QUALQUER tipo, e nao o menor dos
  // dois marcos: um checkout anterior ao primeiro clique e a primeira venda
  // ficaria fora da serie e do periodo em "all". Os marcos por tipo sao o que
  // o client usa para dizer desde quando cada serie vale.
  //
  // O MARCO DE CLIQUES NAO VEM DO BANCO: e o inicio global da medicao, o mesmo
  // para todo creator com codigo. O primeiro clique de cada um seria o marco
  // errado: entre o deploy do lote 01 e esse clique, zero clique e zero de
  // verdade, e desenha-lo como ausente esconderia isso.
  const clicksSince = ids.length > 0 ? INICIO_MEDICAO_CLIQUES : null;
  let eventsSince: string | null = null;
  let salesSince: string | null = null;
  let ultimoClickAt: string | null = null;
  let ultimaVendaAt: string | null = null;
  if (ids.length > 0) {
    [eventsSince, salesSince, ultimoClickAt, ultimaVendaAt] = await Promise.all(
      [
        primeiroEvento(ids, null),
        primeiroEvento(ids, "sale"),
        ultimoEvento(ids, "click"),
        ultimoEvento(ids, "sale"),
      ],
    );
  }

  let serie: CreatorDashboardSerieDia[] = [];
  let periodo = somasZeradas();
  let periodoAnterior: CreatorEventosSomas | null =
    janela === "all" ? null : somasZeradas();

  // Sem nenhum evento, as duas somas sao zero de verdade (os codigos existem e
  // nada foi registrado) e a serie fica vazia: fora de events_since nao se
  // inventa dia.
  if (eventsSince !== null) {
    const diaInicial = diaBrasilia(eventsSince);
    if (!diaInicial) {
      throw new Error(
        `[creatorDashboard] events_since invalido: "${eventsSince}"`,
      );
    }
    const primeiroDaSerie =
      intervalo.primeiroDiaCivil === null ||
      diaInicial > intervalo.primeiroDiaCivil
        ? diaInicial
        : intervalo.primeiroDiaCivil;
    const deIso = intervalo.inicioIso ?? eventsSince;

    const anteriorAlcancavel =
      intervalo.anteriorInicioIso !== null &&
      intervalo.anteriorFimIso !== null &&
      // Periodo anterior inteiro antes do primeiro evento: a soma e zero sem
      // precisar perguntar ao banco.
      Date.parse(eventsSince) < Date.parse(intervalo.anteriorFimIso);

    const [linhasAtuais, linhasAnteriores] = await Promise.all([
      lerSerieDiaria(ids, deIso, intervalo.fimIso, "creator_events_daily"),
      anteriorAlcancavel
        ? lerSerieDiaria(
            ids,
            intervalo.anteriorInicioIso as string,
            intervalo.anteriorFimIso as string,
            "creator_events_daily anterior",
          )
        : Promise.resolve(null),
    ]);

    serie = montarSerie(
      linhasAtuais,
      primeiroDaSerie,
      intervalo.ultimoDiaCivil,
    );
    periodo = somar(linhasAtuais);
    if (linhasAnteriores !== null) periodoAnterior = somar(linhasAnteriores);
  }

  const painel: CreatorDashboard = {
    creator: {
      kind: creatorKindOf(linhaConcessao.kind),
      granted_at: textoDe(linhaConcessao.granted_at, "granted_at"),
      revoked_at: textoOuNull(linhaConcessao.revoked_at, "revoked_at"),
    },
    perfil: {
      name: textoOuNull(linhaPerfil?.name, "name"),
      handle: textoOuNull(linhaPerfil?.handle, "handle"),
      // Alias com a MESMA regra do `avatar`: url so quando a foto pode aparecer.
      avatar_url: avatar.avatar_url,
      avatar,
    },
    janela,
    totais: {
      ...totaisBase,
      conversao_pct: conversaoPct(totaisBase.sales, totaisBase.clicks),
    },
    codigos,
    eventos: {
      clicks_since: clicksSince,
      sales_since: salesSince,
      // Alias de clicks_since por um lote (ver shared/creatorDashboard.ts).
      events_since: clicksSince,
      serie,
      periodo,
      periodo_anterior: periodoAnterior,
      ultimo_click_at: ultimoClickAt,
      ultima_venda_at: ultimaVendaAt,
    },
  };
  if (admin) {
    painel.creator.granted_by = textoOuNull(
      linhaConcessao.granted_by,
      "granted_by",
    );
    painel.perfil.email = textoOuNull(linhaPerfil?.email, "email");
  }
  return { ok: true, painel };
}
