import { updateIssueStatus } from "./sentryApi";
import { supabaseAdmin } from "./supabaseAdmin";

// Push de resolucao: card em etapa terminal marca a issue como resolvida no
// Sentry, e sair de terminal desmarca.
//
// ============================================================================
// A FRONTEIRA DA EMENDA 1, e ela e a razao deste arquivo existir separado.
// ============================================================================
// O invariante 6 ORIGINAL dizia "o quadro nunca escreve no Sentry". Foi revogado
// depois de medir o que existia: um push de UM campo, disparado por transicao
// HUMANA, simetrico nos dois sentidos. O invariante vigente e:
//
//   O JOB nunca escreve no Sentry. A unica escrita e o push de resolucao
//   disparado por transicao humana explicita, e ela e simetrica.
//
// Na pratica isso divide o codigo em dois lados que NAO podem se misturar:
//
//   DECIDE (proibido empurrar)   sentryTaskDecisions.ts: reabrir, ressuscitar,
//                                podar. Nenhum deles chama nada daqui.
//   ENTREGA (permitido)          este arquivo. Ele nunca DECIDE nada: so leva
//                                adiante uma decisao que um humano ja tomou.
//
// O retry tambem e ENTREGA, nao decisao: ele reenvia um alvo que a transicao
// humana gravou. E por isso ele pode viver dentro do job sem quebrar o
// invariante, e por isso o teste do invariante afirma "as DECISOES de
// manutencao nao empurram", nao "o job nunca chama updateIssueStatus".
//
// A simetria e obrigatoria e nao e detalhe: e ela que torna o arrasto acidental
// autocuravel. Arrastar de volta desmarca. Foi a condicao posta ao revogar o
// invariante, e quebra-la (otimizar o caminho de volta, por exemplo) devolveria
// o push a mao unica, sem conserto pela interface.

export type AlvoDoPush = "resolved" | "unresolved";

/** Marca a pendencia para o retry da proxima run. Nunca lanca. */
async function marcarPendente(taskId: string, alvo: AlvoDoPush): Promise<void> {
  const { error } = await supabaseAdmin
    .from("admin_tasks")
    .update({ sentry_sync_pending: alvo })
    .eq("id", taskId);
  if (error) {
    console.error("[sentry-push] Falha ao marcar pendencia:", error.message);
  }
}

async function limparPendencia(taskId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("admin_tasks")
    .update({ sentry_sync_pending: null })
    .eq("id", taskId);
  if (error) {
    console.error("[sentry-push] Falha ao limpar pendencia:", error.message);
  }
}

export type ResultadoPush =
  | { ok: true }
  | { ok: false; motivo: string; pendente: boolean };

/**
 * Entrega UM push. Best-effort, NUNCA lanca.
 *
 * FALHA NO SENTRY NAO DESFAZ O MOVIMENTO NO QUADRO. O card foi para Concluido
 * porque uma pessoa decidiu; a falha e de um sistema externo e vira retry, nunca
 * rollback. E a regra das mutacoes otimistas do modulo ("rollback so do que a
 * operacao tocou") aplicada a um efeito que nem e local: desfazer o movimento
 * por causa de um 500 do Sentry seria desfazer na tela uma decisao que o banco
 * ja gravou.
 *
 * 404 e o unico erro que NAO vira pendencia: issue apagada no Sentry nao tem o
 * que sincronizar, e insistir seria ruido permanente num job de 15 em 15
 * minutos.
 */
export async function empurrarResolucao(params: {
  taskId: string;
  numericId: string;
  alvo: AlvoDoPush;
}): Promise<ResultadoPush> {
  const { taskId, numericId, alvo } = params;
  try {
    const escrita = await updateIssueStatus(numericId, alvo);

    if (escrita.state === "ok") {
      await limparPendencia(taskId);
      return { ok: true };
    }

    if (escrita.state === "error" && escrita.httpStatus === 404) {
      await limparPendencia(taskId);
      return {
        ok: false,
        motivo: "issue inexistente no Sentry",
        pendente: false,
      };
    }

    await marcarPendente(taskId, alvo);
    return {
      ok: false,
      motivo: escrita.state === "error" ? escrita.reason : escrita.state,
      pendente: true,
    };
  } catch (err) {
    await marcarPendente(taskId, alvo).catch(() => {});
    return {
      ok: false,
      motivo: err instanceof Error ? err.message : "desconhecido",
      pendente: true,
    };
  }
}

/**
 * Decide se ESTA transicao empurra, e o que.
 *
 * Pura e exportada para teste: e a regra que sustenta a emenda 1, e ela precisa
 * ser afirmavel sem subir rota nem banco.
 *
 * `null` = nao empurra nada. Os tres motivos de nao empurrar sao diferentes e
 * todos importam:
 *   - card sem vinculo do Sentry: nao ha issue para marcar;
 *   - terminal -> terminal ou comum -> comum: nao houve transicao;
 *   - qualquer coisa que nao seja movimento humano: nao chega aqui.
 */
export function alvoDaTransicao(params: {
  temVinculo: boolean;
  origemEraTerminal: boolean;
  destinoEhTerminal: boolean;
}): AlvoDoPush | null {
  const { temVinculo, origemEraTerminal, destinoEhTerminal } = params;
  if (!temVinculo) return null;
  if (destinoEhTerminal && !origemEraTerminal) return "resolved";
  if (!destinoEhTerminal && origemEraTerminal) return "unresolved";
  return null;
}

export type ResumoRetry = {
  tentados: number;
  entregues: number;
  falharam: number;
  descartados: number;
};

/** Teto por run: uma requisicao ao Sentry por card pendente. */
const TETO_RETRY_POR_RUN = 25;

/**
 * Reenvia os pushes que ficaram pendentes.
 *
 * ENTREGA, nao decisao (ver a fronteira no topo). Nao consulta configuracao de
 * quadro: uma pendencia e uma decisao humana ja tomada, e ela precisa chegar ao
 * Sentry mesmo que o feed daquele quadro esteja desligado.
 */
export async function reenviarPushesPendentes(): Promise<ResumoRetry> {
  const resumo: ResumoRetry = {
    tentados: 0,
    entregues: 0,
    falharam: 0,
    descartados: 0,
  };

  const { data, error } = await supabaseAdmin
    .from("admin_tasks")
    .select("id, sentry_numeric_id, sentry_sync_pending")
    .not("sentry_sync_pending", "is", null)
    .not("sentry_numeric_id", "is", null)
    .limit(TETO_RETRY_POR_RUN);
  // Coluna inexistente (migration da Fase 5.5 nao aplicada) nao pode virar
  // "nada pendente": e o mesmo erro do contarLinhas devolvendo -1. Sai como
  // resumo zerado e o chamador registra o motivo.
  if (error || !data) return resumo;

  for (const linha of data as Array<{
    id: string;
    sentry_numeric_id: string;
    sentry_sync_pending: AlvoDoPush;
  }>) {
    resumo.tentados += 1;
    const r = await empurrarResolucao({
      taskId: linha.id,
      numericId: linha.sentry_numeric_id,
      alvo: linha.sentry_sync_pending,
    });
    if (r.ok) resumo.entregues += 1;
    else if (r.pendente) resumo.falharam += 1;
    else resumo.descartados += 1;
  }

  return resumo;
}
