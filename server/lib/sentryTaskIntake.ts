import { INTAKE_SENTRY } from "../../shared/tasks/sentryIntake";
import { POSITION_STEP } from "./adminTaskPosition";
import { sendSentryTasksSummaryEmail } from "./email";
import { env } from "./env";
import {
  getIssueLatestEvent,
  getIssuesByNumericIds,
  listSentryIssues,
  type SentryEventDetail,
  type SentryIssue,
} from "./sentryApi";
import {
  decidirManutencao,
  detalheIncompleto,
  etiquetaParaProjeto,
  montarSentryData,
  type CardParaManutencao,
} from "./sentryTaskDecisions";
import { reenviarPushesPendentes, type ResumoRetry } from "./sentryTaskPush";
import { supabaseAdmin } from "./supabaseAdmin";
import { createTargetedNotification } from "./targetedNotifications";

// Sync do Sentry para o quadro de tarefas. DUAS FASES, e a separacao nao e
// organizacao de codigo, e correcao:
//
//   INGESTAO   parte da LISTAGEM  -> descobre o que e novo;
//   MANUTENCAO parte dos NOSSOS CARDS -> descobre o que mudou no que ja temos.
//
// Inverter a segunda quebra a poda em silencio. Uma issue que parou de acontecer
// cai fora da janela de 14d e SOME da listagem; se a manutencao partisse de la,
// o job nunca veria o lastSeen de quem ficou quieto, que e exatamente a
// populacao que a poda existe para alcancar. Mesma estrutura de duas fases do
// reconcileSentryBugs.
//
// NUNCA escreve no Sentry. O invariante 6 (emendado) permite o push de resolucao
// disparado por transicao HUMANA e proibe o job de escrever por conta propria.
// Nao ha import de updateIssueStatus aqui, e ha teste que falha se aparecer.

// Teto de criacao por run. Cada card novo custa UMA requisicao extra (o detalhe
// do ultimo evento), entao 25 novos = 25 requisicoes alem da listagem.
const TETO_CRIACAO_POR_RUN = 25;
// Teto de cards por run na manutencao. A leitura de estado e em LOTE, entao o
// teto so limita quantos ids entram nos lotes.
const TETO_MANUTENCAO_POR_RUN = 200;
// Teto de recoleta de detalhe por run: 1 requisicao por card, igual a ingestao.
const TETO_RECOLETA_POR_RUN = 10;

export type ItemRelatorio = {
  shortId: string;
  titulo: string;
  /** Numero do card (BUG-42). Ausente na ingestao em dry-run: o card nao existe. */
  numero: number | null;
  motivo: string;
};

export type RelatorioSync = {
  dryRun: boolean;
  estado:
    | "ok"
    | "schema_pendente"
    | "sem_quadro_ligado"
    | "sem_etapa_de_intake";
  quadrosProcessados: number;
  criados: ItemRelatorio[];
  reabertos: ItemRelatorio[];
  ressuscitados: ItemRelatorio[];
  podados: ItemRelatorio[];
  /** Issues novas que o teto da run deixou de fora. NUNCA truncado em silencio. */
  foraDoTeto: ItemRelatorio[];
  /** Card nasceu sem etiqueta porque o slug do projeto nao esta no mapa. */
  semEtiqueta: Array<{ shortId: string; slug: string }>;
  /** Coleta do detalhe falhou; a manutencao retenta. */
  detalheIncompleto: ItemRelatorio[];
  recoletados: ItemRelatorio[];
  /** Decisoes de manutencao, TODAS, inclusive as "nada". So no dry-run. */
  decisoes: Array<ItemRelatorio & { tipo: string }>;
  inalterados: number;
  /**
   * Reenvio de pushes que uma transicao humana ja decidiu e o Sentry recusou.
   * ENTREGA, nao decisao: nao viola o invariante 6 emendado. Ver a fronteira no
   * topo de sentryTaskPush.ts.
   */
  pushesReenviados: ResumoRetry;
  ingestaoAbortada: string | null;
  manutencaoAbortada: string | null;
};

function relatorioVazio(dryRun: boolean): RelatorioSync {
  return {
    dryRun,
    estado: "ok",
    quadrosProcessados: 0,
    criados: [],
    reabertos: [],
    ressuscitados: [],
    podados: [],
    foraDoTeto: [],
    semEtiqueta: [],
    detalheIncompleto: [],
    recoletados: [],
    decisoes: [],
    inalterados: 0,
    pushesReenviados: {
      tentados: 0,
      entregues: 0,
      falharam: 0,
      descartados: 0,
    },
    ingestaoAbortada: null,
    manutencaoAbortada: null,
  };
}

// ---------------------------------------------------------------------------
// Camada de escrita
// ---------------------------------------------------------------------------
// TUDO que grava passa por aqui, e e por isso que o dry-run e uma prova e nao
// uma aproximacao: as duas modalidades percorrem o mesmo codigo de decisao e so
// trocam este objeto. Uma escrita nova que esqueca de passar por aqui aparece no
// teste que espiona `supabaseAdmin.from` durante um dry-run.

type Escritor = {
  criarTarefa(dados: Record<string, unknown>): Promise<string | null>;
  vincularEtiqueta(taskId: string, labelId: string): Promise<void>;
  atualizarTarefa(id: string, patch: Record<string, unknown>): Promise<boolean>;
  logar(
    taskId: string,
    action: string,
    payload: Record<string, unknown>,
  ): Promise<void>;
};

const ESCRITOR_INERTE: Escritor = {
  async criarTarefa() {
    return null;
  },
  async vincularEtiqueta() {},
  async atualizarTarefa() {
    return true;
  },
  async logar() {},
};

const ESCRITOR_REAL: Escritor = {
  async criarTarefa(dados) {
    // `on conflict do nothing` sobre admin_tasks_sentry_numeric_id_key. A
    // deduplicacao e da CONSTRAINT, nunca de um `if`: verificar-antes-de-inserir
    // tem janela de corrida e o job pode cruzar com uma execucao manual.
    // ignoreDuplicates:true e o `do nothing` do supabase-js.
    const { data, error } = await supabaseAdmin
      .from("admin_tasks")
      .upsert(dados, {
        onConflict: "sentry_numeric_id",
        ignoreDuplicates: true,
      })
      .select("id");
    if (error) {
      console.error("[sentry-tasks] Falha ao criar tarefa:", error.message);
      return null;
    }
    // Lista vazia = a constraint recusou (ja existia). Nao e erro.
    return data && data.length > 0 ? (data[0].id as string) : null;
  },
  async vincularEtiqueta(taskId, labelId) {
    const { error } = await supabaseAdmin
      .from("admin_task_label_links")
      .upsert(
        { task_id: taskId, label_id: labelId },
        { ignoreDuplicates: true },
      );
    if (error) {
      console.error(
        "[sentry-tasks] Falha ao vincular etiqueta:",
        error.message,
      );
    }
  },
  async atualizarTarefa(id, patch) {
    const { error } = await supabaseAdmin
      .from("admin_tasks")
      .update(patch)
      .eq("id", id);
    if (error) {
      console.error("[sentry-tasks] Falha ao atualizar tarefa:", error.message);
      return false;
    }
    return true;
  },
  async logar(taskId, action, payload) {
    // actor_id NULO: o ator e o sistema, nao um usuario (invariante 7). Quem
    // rotula a linha como "Sentry" na tela e o payload.ator, lido pelo resolver
    // com fallback neutro.
    const { error } = await supabaseAdmin.from("admin_task_activity").insert({
      task_id: taskId,
      actor_id: null,
      action,
      payload: { ...payload, ator: "sentry" },
    });
    if (error) {
      console.error(
        "[sentry-tasks] Falha ao registrar atividade:",
        error.message,
      );
    }
  },
};

// ---------------------------------------------------------------------------
// Configuracao: por FLAG, nunca por sigla
// ---------------------------------------------------------------------------

type QuadroConfigurado = {
  boardId: string;
  boardKey: string;
  etapaFixadaId: string;
  etiquetasPorNome: Map<string, string>;
};

/** Erro de schema (coluna inexistente) e ESTADO PROPRIO, nunca "nada a fazer". */
function ehColunaInexistente(error: { code?: string } | null): boolean {
  return error?.code === "42703";
}

async function resolverQuadros(): Promise<
  | { estado: "ok"; quadros: QuadroConfigurado[] }
  | { estado: "schema_pendente" }
  | { estado: "sem_quadro_ligado" }
  | { estado: "sem_etapa_de_intake"; boardKey: string }
> {
  const { data: boards, error } = await supabaseAdmin
    .from("admin_task_boards")
    .select("id, key")
    .eq("sentry_sync_enabled", true)
    .is("archived_at", null);

  // Migrations da Fase 2 nao aplicadas. NAO pode virar "nenhum quadro ligado":
  // seria erro de infra contado como sucesso de configuracao, que e o defeito do
  // contarLinhas devolvendo -1 registrado no CLAUDE.md.
  if (error && ehColunaInexistente(error)) return { estado: "schema_pendente" };
  if (error) throw new Error(`quadros: ${error.message}`);
  if (!boards || boards.length === 0) return { estado: "sem_quadro_ligado" };

  const quadros: QuadroConfigurado[] = [];
  for (const board of boards as Array<{ id: string; key: string }>) {
    const { data: colunas, error: colErr } = await supabaseAdmin
      .from("admin_task_columns")
      .select("id")
      .eq("board_id", board.id)
      .eq("intake_source", INTAKE_SENTRY)
      .limit(1);
    if (colErr) throw new Error(`etapa de intake: ${colErr.message}`);
    // Quadro ligado SEM etapa de intake e estado invalido. Aborta em vez de
    // escolher uma: escolher seria criar card em lugar arbitrario e chamar isso
    // de sucesso.
    if (!colunas || colunas.length === 0) {
      return { estado: "sem_etapa_de_intake", boardKey: board.key };
    }

    const { data: etiquetas } = await supabaseAdmin
      .from("admin_task_labels")
      .select("id, name")
      .eq("board_id", board.id);
    const etiquetasPorNome = new Map<string, string>();
    for (const l of (etiquetas ?? []) as Array<{ id: string; name: string }>) {
      etiquetasPorNome.set(l.name.toLowerCase(), l.id);
    }

    quadros.push({
      boardId: board.id,
      boardKey: board.key,
      etapaFixadaId: colunas[0].id as string,
      etiquetasPorNome,
    });
  }
  return { estado: "ok", quadros };
}

// ---------------------------------------------------------------------------
// Fase 1: ingestao, a partir da listagem
// ---------------------------------------------------------------------------

async function proximaPosicao(columnId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("admin_tasks")
    .select("position")
    .eq("column_id", columnId)
    .order("position", { ascending: false })
    .limit(1);
  const maior = data && data.length > 0 ? (data[0].position as number) : null;
  return maior === null ? POSITION_STEP : maior + POSITION_STEP;
}

async function ingerir(
  quadro: QuadroConfigurado,
  escritor: Escritor,
  rel: RelatorioSync,
  agoraIso: string,
): Promise<void> {
  const listagem = await listSentryIssues({
    query: "is:unresolved",
    statsPeriod: "14d",
  });
  if (listagem.state !== "ok") {
    // FAIL-SAFE 3: falha de leitura nao toca em card nenhum nesta run, e o
    // motivo REAL vai para o relatorio (nao so o state, que escondia a causa).
    rel.ingestaoAbortada =
      listagem.state === "error"
        ? `error: ${listagem.reason}`
        : listagem.state === "rate_limited"
          ? `rate_limited (retry em ${listagem.retryAfterSeconds ?? "?"}s)`
          : listagem.state;
    return;
  }

  const issues = listagem.issues.filter((i) => i.id.trim().length > 0);
  if (issues.length === 0) return;

  // Quais ja temos. Isto e OTIMIZACAO DE ORCAMENTO DE REQUISICAO, nao a
  // deduplicacao: a garantia continua sendo o indice unico, e o insert usa
  // `on conflict do nothing`. Serve so para nao gastar uma requisicao de detalhe
  // com issue que ja virou card.
  const { data: existentes, error: exErr } = await supabaseAdmin
    .from("admin_tasks")
    .select("sentry_numeric_id")
    .in(
      "sentry_numeric_id",
      issues.map((i) => i.id),
    );
  if (exErr) throw new Error(`existentes: ${exErr.message}`);
  const jaTemos = new Set(
    ((existentes ?? []) as Array<{ sentry_numeric_id: string | null }>)
      .map((r) => r.sentry_numeric_id)
      .filter((v): v is string => Boolean(v)),
  );

  const novas = issues.filter((i) => !jaTemos.has(i.id));
  const dentroDoTeto = novas.slice(0, TETO_CRIACAO_POR_RUN);
  // NUNCA truncar em silencio: o que sobrou vai NOMEADO para o relatorio e para
  // o log da run. Silencio aqui leria como "cobri tudo" sem ter coberto.
  for (const fora of novas.slice(TETO_CRIACAO_POR_RUN)) {
    rel.foraDoTeto.push({
      shortId: fora.shortId,
      titulo: fora.title,
      numero: null,
      motivo: `teto de ${TETO_CRIACAO_POR_RUN} criacoes por run; entra na proxima`,
    });
  }

  let posicao = await proximaPosicao(quadro.etapaFixadaId);

  for (const issue of dentroDoTeto) {
    // UMA requisicao extra por issue NOVA, nunca por issue ja vista.
    let detalhe: SentryEventDetail | null = null;
    let falha: string | null = null;
    const evento = await getIssueLatestEvent(issue.id);
    if (evento.state === "ok") detalhe = evento.detail;
    else if (evento.state === "not_found")
      falha = "evento nao retido pelo Sentry (retencao vencida)";
    else if (evento.state === "rate_limited") falha = "rate_limited";
    else if (evento.state === "error") falha = `error: ${evento.reason}`;
    else falha = evento.state;

    const etiqueta = etiquetaParaProjeto(issue.projectSlug);
    if (etiqueta.tipo === "desconhecido") {
      rel.semEtiqueta.push({ shortId: issue.shortId, slug: etiqueta.slug });
    }

    const dados = {
      board_id: quadro.boardId,
      column_id: quadro.etapaFixadaId,
      title: issue.title.slice(0, 200),
      // description e notes NAO SAO TOCADOS. Invariante 2.
      position: posicao,
      priority: "media",
      type: "bug",
      source: "sentry",
      created_by: null,
      updated_by: null,
      sentry_issue_id: issue.shortId,
      sentry_numeric_id: issue.id,
      sentry_issue_url: issue.permalink,
      sentry_last_seen: issue.lastSeen || null,
      sentry_last_checked_at: agoraIso,
      sentry_data: montarSentryData({ issue, detalhe, falha, agoraIso }),
    };
    posicao += POSITION_STEP;

    const item: ItemRelatorio = {
      shortId: issue.shortId,
      titulo: issue.title,
      numero: null,
      motivo:
        etiqueta.tipo === "ok"
          ? `issue nova, etiqueta ${etiqueta.nome}`
          : `issue nova, SEM etiqueta (projeto ${etiqueta.slug} desconhecido)`,
    };

    if (falha !== null) {
      rel.detalheIncompleto.push({
        shortId: issue.shortId,
        titulo: issue.title,
        numero: null,
        motivo: falha,
      });
    }

    const id = await escritor.criarTarefa(dados);
    if (id) {
      if (etiqueta.tipo === "ok") {
        const labelId = quadro.etiquetasPorNome.get(
          etiqueta.nome.toLowerCase(),
        );
        if (labelId) await escritor.vincularEtiqueta(id, labelId);
      }
      await escritor.logar(id, "created", {
        origem: "sentry",
        short_id: issue.shortId,
      });
    }
    rel.criados.push(item);
  }
}

// ---------------------------------------------------------------------------
// Fase 2: manutencao, a partir dos NOSSOS CARDS
// ---------------------------------------------------------------------------

const CARD_COLS =
  "id, number, title, column_id, completed_at, archived_at, archived_source, sentry_numeric_id, sentry_issue_id, sentry_last_seen, sentry_data";

async function etapaInicialDoQuadro(boardId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("admin_task_columns")
    .select("id")
    .eq("board_id", boardId)
    .order("is_start", { ascending: false })
    .order("position", { ascending: true })
    .limit(1);
  return data && data.length > 0 ? (data[0].id as string) : null;
}

async function manter(
  quadro: QuadroConfigurado,
  escritor: Escritor,
  rel: RelatorioSync,
  agoraIso: string,
): Promise<void> {
  // ATENCAO, E O UNICO LUGAR DO MODULO QUE FAZ ISTO: esta consulta NAO filtra
  // `archived_at is null`. Em todo o resto do modulo (snapshot, filtros,
  // contagens) arquivado significa "nao aparece", e esta certo. Aqui, filtrar
  // arquivados pelo reflexo natural faria a regra de RESSURREICAO nunca
  // disparar: nada quebraria, nenhum teste ficaria vermelho por acidente, e um
  // erro que voltou depois de arquivado simplesmente nunca mais teria card.
  // Se voce esta "limpando" esta funcao, e este o comentario que te impede.
  const { data, error } = await supabaseAdmin
    .from("admin_tasks")
    .select(CARD_COLS)
    .eq("board_id", quadro.boardId)
    .not("sentry_numeric_id", "is", null)
    .order("sentry_last_checked_at", { ascending: true, nullsFirst: true })
    .limit(TETO_MANUTENCAO_POR_RUN);
  if (error) throw new Error(`manutencao select: ${error.message}`);

  const cards = (data ?? []) as Array<
    CardParaManutencao & {
      sentry_issue_id: string | null;
      sentry_last_seen: string | null;
      sentry_data: unknown;
    }
  >;
  if (cards.length === 0) return;

  const estados = await getIssuesByNumericIds(
    cards.map((c) => c.sentry_numeric_id),
  );
  if (estados.state !== "ok") {
    // FAIL-SAFE 3: nao toca em card nenhum nesta run.
    rel.manutencaoAbortada =
      estados.state === "error"
        ? `error: ${estados.reason}`
        : estados.state === "rate_limited"
          ? `rate_limited (retry em ${estados.retryAfterSeconds ?? "?"}s)`
          : estados.state;
    return;
  }

  const porId = new Map<string, SentryIssue>();
  for (const issue of estados.issues) porId.set(issue.id, issue);

  const etapaInicial = await etapaInicialDoQuadro(quadro.boardId);
  let recoletados = 0;

  for (const card of cards) {
    const issue = porId.get(card.sentry_numeric_id);
    const decisao = decidirManutencao({
      card,
      lastSeen: issue?.lastSeen,
      lastSeenPersistido: card.sentry_last_seen ?? null,
      statusNoSentry: issue?.status,
      etapaFixadaId: quadro.etapaFixadaId,
      agoraIso,
    });

    const rotulo = card.sentry_issue_id ?? card.sentry_numeric_id;
    const item: ItemRelatorio = {
      shortId: rotulo,
      titulo: card.title ?? "",
      numero: card.number ?? null,
      motivo: decisao.motivo,
    };
    rel.decisoes.push({ ...item, tipo: decisao.tipo });

    // Metadado do sync (nunca description/notes): sempre atualizado, inclusive
    // em card do humano. Nao e relocalizacao, e o que alimenta o selo da tela.
    const metadado: Record<string, unknown> = {
      sentry_last_checked_at: agoraIso,
    };
    if (issue?.lastSeen) metadado.sentry_last_seen = issue.lastSeen;

    if (decisao.tipo === "reabrir" && etapaInicial) {
      await escritor.atualizarTarefa(card.id, {
        ...metadado,
        column_id: etapaInicial,
        completed_at: null,
        sentry_reopen_event_at: issue?.lastSeen ?? null,
      });
      await escritor.logar(card.id, "reopened", {
        origem: "sentry",
        motivo: decisao.motivo,
      });
      rel.reabertos.push(item);
    } else if (decisao.tipo === "ressuscitar") {
      await escritor.atualizarTarefa(card.id, {
        ...metadado,
        archived_at: null,
        archived_source: null,
        column_id: quadro.etapaFixadaId,
        sentry_reopen_event_at: issue?.lastSeen ?? null,
      });
      await escritor.logar(card.id, "unarchived", {
        origem: "sentry",
        motivo: "novo evento apos arquivamento",
      });
      rel.ressuscitados.push(item);
    } else if (decisao.tipo === "podar") {
      await escritor.atualizarTarefa(card.id, {
        ...metadado,
        archived_at: agoraIso,
        archived_source: "sentry_sync",
      });
      await escritor.logar(card.id, "archived", {
        origem: "sentry",
        motivo: decisao.motivo,
      });
      rel.podados.push(item);
    } else {
      rel.inalterados += 1;
      // Recoleta do detalhe que ficou incompleto, com teto proprio: 1 requisicao
      // por card, mesmo custo da ingestao.
      if (
        detalheIncompleto(card.sentry_data) &&
        issue &&
        recoletados < TETO_RECOLETA_POR_RUN
      ) {
        recoletados += 1;
        const evento = await getIssueLatestEvent(card.sentry_numeric_id);
        if (evento.state === "ok") {
          metadado.sentry_data = montarSentryData({
            issue,
            detalhe: evento.detail,
            falha: null,
            agoraIso,
          });
          rel.recoletados.push(item);
        }
      }
      await escritor.atualizarTarefa(card.id, metadado);
    }
  }
}

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

export async function syncSentryTasks(
  opcoes: { dryRun?: boolean } = {},
): Promise<RelatorioSync> {
  const dryRun = opcoes.dryRun === true;
  const rel = relatorioVazio(dryRun);
  const escritor = dryRun ? ESCRITOR_INERTE : ESCRITOR_REAL;
  const agoraIso = new Date().toISOString();

  // FASE 0: reenvio de pushes pendentes.
  //
  // Roda ANTES da resolucao de quadro e INDEPENDE dela: uma pendencia e uma
  // decisao humana ja tomada, e ela precisa chegar ao Sentry mesmo que o feed
  // daquele quadro esteja desligado. Sem pendencia nenhuma isto e uma leitura
  // que devolve zero linhas e nao chama o Sentry, entao o job continua inerte
  // quando nao ha o que fazer.
  //
  // Em dry-run NAO reenvia: dry-run nao escreve em lugar nenhum, e o Sentry e
  // um lugar.
  if (!dryRun) {
    rel.pushesReenviados = await reenviarPushesPendentes();
  }

  const config = await resolverQuadros();
  if (config.estado !== "ok") {
    rel.estado = config.estado;
    return rel;
  }

  for (const quadro of config.quadros) {
    rel.quadrosProcessados += 1;
    await ingerir(quadro, escritor, rel, agoraIso);
    await manter(quadro, escritor, rel, agoraIso);
  }

  if (!dryRun) await avisar(rel);
  return rel;
}

// ---------------------------------------------------------------------------
// Avisos
// ---------------------------------------------------------------------------

async function avisar(rel: RelatorioSync): Promise<void> {
  // RESUMO AGRUPADO, e SO quando houve criacao. Run sem novidade nao manda nada:
  // sao 96 runs por dia contra UMA caixa de entrada, e "0 tarefas criadas" a cada
  // 15 minutos e o caminho mais curto para o destinatario criar uma regra de
  // filtro e o canal morrer para o que importa.
  //
  // Uma tarefa criada tambem manda o resumo, com uma linha. Nao ha ramo especial
  // para o singular: template condicional e onde nasce o bug de plural.
  if (rel.criados.length > 0) {
    void sendSentryTasksSummaryEmail({
      criados: rel.criados.map((c) => ({
        shortId: c.shortId,
        titulo: c.titulo,
      })),
      foraDoTeto: rel.foraDoTeto.length,
      semEtiqueta: rel.semEtiqueta.length,
    }).catch((err) => {
      console.error("[sentry-tasks] Falha no email de resumo:", err);
    });
  }

  // Notificacao interna POR ITEM: e barata, nao sai da plataforma, e o sino ja
  // agrega visualmente. Reabertura tambem, porque e o evento mais acionavel.
  for (const item of [...rel.criados, ...rel.reabertos]) {
    void createTargetedNotification({
      email: env.bugNotifyNewEmail,
      title: `🐛 ${item.shortId}: ${item.titulo}`,
      body: item.motivo,
      createdBy: null,
    }).catch((err) => {
      console.error("[sentry-tasks] Falha na notificação:", err);
    });
  }
}

/** Payload enxuto para cron_run_logs: contagens e as listas que interessam. */
export function resumoParaLog(rel: RelatorioSync): Record<string, unknown> {
  // A lista COMPLETA de decisoes fica fora daqui de proposito: ela existe para o
  // dry-run, que uma pessoa le uma vez. Gravar 200 linhas a cada 15 minutos
  // incharia cron_run_logs sem ninguem ler.
  return {
    dryRun: rel.dryRun,
    estado: rel.estado,
    quadros: rel.quadrosProcessados,
    criados: rel.criados.length,
    reabertos: rel.reabertos.length,
    ressuscitados: rel.ressuscitados.length,
    podados: rel.podados.length,
    inalterados: rel.inalterados,
    recoletados: rel.recoletados.length,
    pushesReenviados: rel.pushesReenviados,
    foraDoTeto: rel.foraDoTeto.map((i) => i.shortId),
    semEtiqueta: rel.semEtiqueta,
    detalheIncompleto: rel.detalheIncompleto.map((i) => i.shortId),
    ingestaoAbortada: rel.ingestaoAbortada,
    manutencaoAbortada: rel.manutencaoAbortada,
  };
}

/** Houve algo que merece status 'partial' em vez de 'success'? */
export function runDegradada(rel: RelatorioSync): boolean {
  return (
    rel.estado !== "ok" ||
    rel.ingestaoAbortada !== null ||
    rel.manutencaoAbortada !== null ||
    rel.foraDoTeto.length > 0 ||
    rel.semEtiqueta.length > 0 ||
    rel.detalheIncompleto.length > 0 ||
    rel.pushesReenviados.falharam > 0
  );
}
