// Orquestrador do sync de vagas multi-fonte (front VAGAS, fase 2).
// Substitui o syncJobs legado (Jooble/BR via jooble.org, que retornava 0
// vagas porque a chave e do site US; ver config.ts). Fontes: jooble, adzuna,
// github e ats_boards; a fonte 'manual' (vagas destaque do admin) NUNCA
// participa do sync.

import { cacheConnection } from "../lib/redis";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { listAdzunaUnits } from "../lib/vagas/adapters/adzuna";
import { listAtsUnits } from "../lib/vagas/adapters/atsBoards";
import { listGithubUnits } from "../lib/vagas/adapters/githubRepos";
import { listJoobleUnits } from "../lib/vagas/adapters/jooble";
import { SYNC_INTERVALS_MIN } from "../lib/vagas/config";
import { isTechJob } from "../lib/vagas/relevance";
import type {
  JobSource,
  NormalizedJob,
  SourceRunResult,
  SourceUnit,
} from "../lib/vagas/types";

const STALE_HOURS = 72;
const CADENCE_KEY_PREFIX = "vagas:sync:last:";

export type VagasSyncOptions = {
  dryRun?: boolean;
  perUnitLimit?: number;
};

export type VagasSyncResult = {
  results: SourceRunResult[];
  skippedSources: JobSource[];
  totals: {
    found: number;
    created: number;
    updated: number;
    failed: number;
    dropped: number;
  };
};

// Gate de cadencia por fonte via Redis. Fail-open: Redis fora = roda (o lock
// do cron ja impede sobreposicao; o gate so evita rodada redundante). O
// carimbo e gravado ao FIM da passada, com sucesso OU falha: falha tambem
// espera o intervalo (nao martelar API externa quebrada).
async function sourceRanRecently(source: JobSource): Promise<boolean> {
  if (!cacheConnection) return false;
  try {
    const raw = await cacheConnection.get(`${CADENCE_KEY_PREFIX}${source}`);
    if (!raw) return false;
    const last = parseInt(raw, 10);
    if (!Number.isFinite(last)) return false;
    return Date.now() - last < SYNC_INTERVALS_MIN[source] * 60_000;
  } catch {
    return false;
  }
}

async function stampSourceRun(source: JobSource): Promise<void> {
  if (!cacheConnection) return;
  try {
    // TTL de 24h so pra chave nao ficar orfa; o gate compara o timestamp.
    await cacheConnection.set(
      `${CADENCE_KEY_PREFIX}${source}`,
      String(Date.now()),
      "EX",
      86_400,
    );
  } catch {
    // fail-open
  }
}

async function upsertJobs(
  jobs: NormalizedJob[],
): Promise<{ upserted: number; failed: number }> {
  if (jobs.length === 0) return { upserted: 0, failed: 0 };

  // Dedupe por url dentro do lote: o upsert do Postgres rejeita o mesmo
  // conflito duas vezes no mesmo comando.
  const byUrl = new Map<string, NormalizedJob>();
  for (const job of jobs) byUrl.set(job.url, job);

  const nowIso = new Date().toISOString();
  // featured/featured_until/created_by ficam fora do payload de proposito: o
  // upsert nunca sobrescreve o estado de destaque definido pelo admin.
  const rows = Array.from(byUrl.values()).map((job) => ({
    ...job,
    is_published: true,
    last_seen_at: nowIso,
    fetched_at: nowIso,
  }));

  const { error } = await supabaseAdmin
    .from("external_jobs")
    .upsert(rows, { onConflict: "url" });
  if (error) {
    console.error("[vagas-sync] upsert falhou:", error.message);
    return { upserted: 0, failed: rows.length };
  }
  return { upserted: rows.length, failed: 0 };
}

// Despublica vagas da fonte que sumiram do feed ha mais de STALE_HOURS.
// Fail-safe: so roda apos passada BEM-SUCEDIDA da fonte (toda unidade
// resolvida sem erro e sem falha de upsert); rodada com qualquer falha pula o
// unpublish para nunca despublicar em massa por queda de API externa. O
// neq('source','manual') e defesa em profundidade: o eq(source) ja exclui a
// fonte manual, que nao participa do sync.
async function unpublishStale(source: JobSource): Promise<number> {
  const cutoff = new Date(
    Date.now() - STALE_HOURS * 60 * 60 * 1000,
  ).toISOString();
  const { data, error } = await supabaseAdmin
    .from("external_jobs")
    .update({ is_published: false })
    .eq("source", source)
    .neq("source", "manual")
    .eq("is_published", true)
    .lt("last_seen_at", cutoff)
    .select("id");
  if (error) {
    console.warn(
      `[vagas-sync] unpublish stale de ${source} falhou:`,
      error.message,
    );
    return 0;
  }
  return data?.length ?? 0;
}

function logDrySamples(unit: SourceUnit, jobs: NormalizedJob[]): void {
  const samples = jobs.slice(0, 3).map((job) => ({
    title: job.title,
    company: job.company,
    country: job.country,
    seniority: job.seniority,
    modality: job.modality,
    contract: job.contract_type,
    salary:
      job.salary_min !== null || job.salary_max !== null
        ? `${job.salary_min ?? "?"}-${job.salary_max ?? "?"} ${job.salary_currency ?? "?"}${job.salary_is_predicted ? " (estimado)" : ""}`
        : null,
    url: job.url,
  }));
  console.log(
    `[vagas-sync][dry] ${unit.source}/${unit.unit}: ${jobs.length} vagas`,
    JSON.stringify(samples, null, 2),
  );
}

export async function runVagasSync(
  opts: VagasSyncOptions = {},
): Promise<VagasSyncResult> {
  const { dryRun = false, perUnitLimit } = opts;
  const sources: { source: JobSource; units: SourceUnit[] }[] = [
    { source: "github", units: listGithubUnits() },
    { source: "adzuna", units: listAdzunaUnits() },
    { source: "jooble", units: listJoobleUnits() },
    { source: "ats_boards", units: listAtsUnits() },
  ];

  const results: SourceRunResult[] = [];
  const skippedSources: JobSource[] = [];

  for (const { source, units } of sources) {
    if (units.length === 0) continue;

    // Dry run ignora o gate (e nao carimba): e ferramenta de inspecao.
    if (!dryRun && (await sourceRanRecently(source))) {
      skippedSources.push(source);
      continue;
    }

    // Adzuna 429-a com unidades em paralelo (rate limit por burst do tier
    // gratuito, visto no dry run da fase 2): as unidades dela rodam em serie
    // com um respiro entre chamadas. As demais fontes seguem em paralelo com
    // allSettled (hosts distintos por unidade ou limites folgados).
    let settled: PromiseSettledResult<NormalizedJob[]>[];
    if (source === "adzuna") {
      settled = [];
      for (const unit of units) {
        settled.push(
          ...(await Promise.allSettled([unit.fetch(perUnitLimit)])),
        );
        await new Promise((resolve) => setTimeout(resolve, 1_500));
      }
    } else {
      settled = await Promise.allSettled(
        units.map((unit) => unit.fetch(perUnitLimit)),
      );
    }

    let sourceHadFailure = false;
    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      const outcome = settled[i];
      if (outcome.status === "rejected") {
        sourceHadFailure = true;
        const message =
          outcome.reason instanceof Error
            ? outcome.reason.message
            : String(outcome.reason);
        console.error(
          `[vagas-sync] ${source}/${unit.unit} falhou:`,
          message,
        );
        results.push({
          source,
          unit: unit.unit,
          fetched: 0,
          upserted: 0,
          failed: 0,
          dropped: 0,
          error: message,
        });
        continue;
      }

      // Filtro de relevancia TI (fase 6): adzuna, jooble e ats_boards passam
      // pelo isTechJob; github fica ISENTO (repos de comunidade sao 100% TI
      // por curadoria). Vaga reprovada nao e upsertada.
      const fetchedJobs = outcome.value;
      const jobs =
        source === "github"
          ? fetchedJobs
          : fetchedJobs.filter((job) => isTechJob(job.title));
      const dropped = fetchedJobs.length - jobs.length;

      if (dryRun) {
        logDrySamples(unit, jobs);
        results.push({
          source,
          unit: unit.unit,
          fetched: fetchedJobs.length,
          upserted: 0,
          failed: 0,
          dropped,
        });
        continue;
      }

      const { upserted, failed } = await upsertJobs(jobs);
      if (failed > 0) sourceHadFailure = true;
      results.push({
        source,
        unit: unit.unit,
        fetched: fetchedJobs.length,
        upserted,
        failed,
        dropped,
      });
    }

    if (!dryRun) {
      await stampSourceRun(source);
      // Criterio explicito de passada bem-sucedida: nenhuma unidade rejeitada
      // e nenhum upsert falho.
      if (!sourceHadFailure) {
        const unpublished = await unpublishStale(source);
        if (unpublished > 0) {
          console.log(
            `[vagas-sync] ${source}: ${unpublished} vagas velhas despublicadas`,
          );
        }
      } else {
        console.warn(
          `[vagas-sync] ${source}: rodada com falha, unpublish de stale PULADO`,
        );
      }
    }
  }

  const totals = results.reduce(
    (acc, r) => ({
      found: acc.found + r.fetched,
      created: acc.created + r.upserted,
      updated: acc.updated,
      failed: acc.failed + r.failed + (r.error ? 1 : 0),
      dropped: acc.dropped + r.dropped,
    }),
    { found: 0, created: 0, updated: 0, failed: 0, dropped: 0 },
  );

  console.log(
    `[vagas-sync] rodada${dryRun ? " (dry)" : ""}: ${totals.found} encontradas, ${totals.created} upserted, ${totals.dropped} reprovadas no filtro TI, ${totals.failed} falhas, fontes puladas: ${skippedSources.join(", ") || "nenhuma"}`,
  );
  return { results, skippedSources, totals };
}
