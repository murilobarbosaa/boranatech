import { RUNS_NAO_SADIAS_PARA_AVISAR } from "../../shared/tasks/sentryIntake";
import { env } from "./env";
import { supabaseAdmin } from "./supabaseAdmin";
import { createTargetedNotification } from "./targetedNotifications";

// Aviso de cron morto: N runs nao-sadias CONSECUTIVAS viram uma notificacao
// interna. Notificacao, nao e-mail, e nao ha painel: o problema era ninguem
// olhar o log, e a resposta e o sino, nao mais uma tela para ninguem abrir.

/**
 * Jobs que avisam. OPT-IN explicito, e a lista tem um motivo medido.
 *
 * Aplicar a TODOS os jobs seria mais bonito e viraria ruido. Medido em
 * 2026-07-31 sobre o historico de cron_run_logs, com a regra de 3 consecutivas:
 *
 *   sync-news          10 disparos historicos  (partial = alguns artigos
 *                                               falharam no enriquecimento, e
 *                                               isso e rotina, nao defeito)
 *   reindex-search      1 disparo
 *   sync-jobs           0 (nunca teve 3 seguidas)
 *   reconcile-sentry-bugs  1 disparo, e e o defeito real de 372 runs
 *
 * Dez avisos por algo que nao exige acao e o caminho mais curto para o
 * destinatario ignorar o proximo, que sera o que importa. Por isso a lista.
 *
 * O CUSTO DESTA ESCOLHA, declarado: job novo NAO avisa ate alguem lembrar de
 * inclui-lo aqui. Isso e uma falha de OMISSAO, nao um falso-verde: nada afirma
 * cobertura que nao tem. O teste cronAlert.test.ts trava o conteudo do conjunto,
 * entao mexer nele e ato deliberado.
 */
export const JOBS_COM_ALERTA = new Set([
  "sync-sentry-tasks",
  "reconcile-sentry-bugs",
]);

/**
 * Avisa se ESTA run fechou a enesima nao-sadia seguida.
 *
 * Dispara em N EXATAMENTE, nunca depois. A diferenca importa: sem isso, a
 * sequencia real de 372 runs quebradas do reconcile-sentry-bugs teria gerado 370
 * notificacoes em vez de uma. O teste da condicao e "as N ultimas sao
 * nao-sadias E a de antes delas era sadia (ou nao existe)", que e o mesmo que
 * "acabou de cruzar o limite".
 *
 * Sem contador persistido: a sequencia e derivada do proprio cron_run_logs, que
 * ja tem indice por (job_name, created_at desc). Contador em coluna precisaria
 * ser zerado por alguem, e seria mais um estado a divergir do fato.
 *
 * NUNCA lanca e NUNCA falha a run: e observabilidade, e derrubar um job porque o
 * aviso falhou seria trocar um problema por outro maior.
 */
export async function avisarSeCronMorreu(jobName: string): Promise<void> {
  if (!JOBS_COM_ALERTA.has(jobName)) return;

  try {
    // N+1 linhas: as N que precisam estar quebradas, mais a anterior, que
    // precisa estar sadia para isto ser a TRANSICAO e nao o meio da sequencia.
    const { data, error } = await supabaseAdmin
      .from("cron_run_logs")
      .select("status")
      .eq("job_name", jobName)
      .order("created_at", { ascending: false })
      .limit(RUNS_NAO_SADIAS_PARA_AVISAR + 1);
    if (error || !data) return;

    const runs = data as Array<{ status: string }>;
    // Ainda nao ha runs suficientes para afirmar sequencia.
    if (runs.length < RUNS_NAO_SADIAS_PARA_AVISAR) return;

    const ultimas = runs.slice(0, RUNS_NAO_SADIAS_PARA_AVISAR);
    if (!ultimas.every((r) => r.status !== "success")) return;

    // A de antes: se existe e tambem e nao-sadia, a sequencia comecou antes e o
    // aviso ja saiu. Se nao existe, este e o inicio do historico e vale avisar.
    const anterior = runs[RUNS_NAO_SADIAS_PARA_AVISAR];
    if (anterior && anterior.status !== "success") return;

    await createTargetedNotification({
      email: env.bugNotifyNewEmail,
      title: `⚠️ Cron ${jobName} falhando`,
      body:
        `As últimas ${RUNS_NAO_SADIAS_PARA_AVISAR} execuções de ${jobName} não ` +
        `foram bem-sucedidas. Veja o motivo em cron_run_logs (campo payload).`,
      createdBy: null,
    });
  } catch (err) {
    console.warn(
      `[cron-alert] Falha ao avaliar a sequência de ${jobName}:`,
      err instanceof Error ? err.message : String(err),
    );
  }
}
