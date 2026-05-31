import { enrichArticle } from "../lib/aiEnrich";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const BATCH_SIZE = 20;
const SLEEP_MS = 200;

export interface BacklogResult {
  pending_before: number;
  processed: number;
  enriched: number;
  failed: number;
  pending_after: number;
  duration_ms: number;
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function enrichBacklog(): Promise<BacklogResult> {
  const startedAt = Date.now();

  const { count: pendingBeforeRaw } = await supabaseAdmin
    .from("news")
    .select("*", { count: "exact", head: true })
    .is("enriched_at", null);

  const pendingBefore = pendingBeforeRaw ?? 0;

  if (pendingBefore === 0) {
    return {
      pending_before: 0,
      processed: 0,
      enriched: 0,
      failed: 0,
      pending_after: 0,
      duration_ms: Date.now() - startedAt,
    };
  }

  const { data: rows, error } = await supabaseAdmin
    .from("news")
    .select("id, title, summary")
    .is("enriched_at", null)
    .order("created_at", { ascending: false })
    .limit(BATCH_SIZE);

  if (error || !rows) {
    throw new Error(`Failed to fetch backlog: ${error?.message ?? "unknown"}`);
  }

  let enriched = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const enrichment = await enrichArticle(row.title, row.summary ?? "");

      if (!enrichment) {
        failed += 1;
        await sleep(SLEEP_MS);
        continue;
      }

      const { error: updateError } = await supabaseAdmin
        .from("news")
        .update({
          title_pt_br: enrichment.title_pt_br,
          summary_pt_br: enrichment.summary_pt_br,
          level: enrichment.level,
          why_it_matters: enrichment.why_it_matters,
          enriched_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (updateError) {
        console.error(
          "[enrich-backlog] update failed for",
          row.id,
          updateError.message,
        );
        failed += 1;
      } else {
        enriched += 1;
      }
    } catch (err) {
      console.error(
        "[enrich-backlog] item failed for",
        row.id,
        err instanceof Error ? err.message : String(err),
      );
      failed += 1;
    }

    await sleep(SLEEP_MS);
  }

  const { count: pendingAfterRaw } = await supabaseAdmin
    .from("news")
    .select("*", { count: "exact", head: true })
    .is("enriched_at", null);

  const duration_ms = Date.now() - startedAt;
  console.log(
    `[enrich-backlog] processed=${rows.length}, enriched=${enriched}, failed=${failed}, pending: ${pendingBefore}→${pendingAfterRaw ?? 0} in ${duration_ms}ms`,
  );

  return {
    pending_before: pendingBefore,
    processed: rows.length,
    enriched,
    failed,
    pending_after: pendingAfterRaw ?? 0,
    duration_ms,
  };
}
