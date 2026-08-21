import { avisarSeCronMorreu } from "./cronAlert";
import { supabaseAdmin } from "./supabaseAdmin";

export type CronRunStatus = "success" | "error" | "partial";

export interface CronRunRecord {
  jobName: string;
  status: CronRunStatus;
  startedAt: Date;
  payload?: Record<string, unknown>;
  errorMessage?: string;
}

export async function recordCronRun(record: CronRunRecord): Promise<void> {
  try {
    const finishedAt = new Date();
    const { error } = await supabaseAdmin.from("cron_run_logs").insert({
      job_name: record.jobName,
      status: record.status,
      started_at: record.startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      payload: record.payload ?? null,
      error_message: record.errorMessage ?? null,
    });
    if (error) {
      console.warn("[cron-logs] Falha ao registrar execução:", error.message);
      return;
    }

    // Aviso de cron morto DENTRO do registro, e nao em cada endpoint: sao 14
    // jobs hoje e os proximos ainda nao existem. Guarda no chamador precisaria
    // ser repetida em cada um e sumiria no primeiro que alguem esquecesse, que e
    // a regra do CLAUDE.md e o caso do setScoreDelta. Aqui todo job que gravar
    // uma run passa por esta linha por construção.
    //
    // Roda DEPOIS do insert de proposito: a avaliacao le o cron_run_logs, e a
    // run que acabou de acontecer precisa estar la para contar.
    if (record.status !== "success") {
      await avisarSeCronMorreu(record.jobName);
    }
  } catch (err) {
    console.warn(
      "[cron-logs] Erro inesperado ao registrar execução:",
      err instanceof Error ? err.message : String(err),
    );
  }
}
