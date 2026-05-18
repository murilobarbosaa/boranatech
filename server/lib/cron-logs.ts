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
    }
  } catch (err) {
    console.warn(
      "[cron-logs] Erro inesperado ao registrar execução:",
      err instanceof Error ? err.message : String(err),
    );
  }
}
