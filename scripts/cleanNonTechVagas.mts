// Limpeza one-off das vagas nao-TI ja gravadas (front VAGAS, fase 6). Aplica
// o MESMO isTechJob do pipeline nas linhas publicadas de adzuna/jooble/
// ats_boards e DESPUBLICA (nunca deleta) as reprovadas. NUNCA toca source
// manual nem github (isentos por curadoria) nem featured.
//
// Uso:
//   pnpm tsx --tsconfig tsconfig.node.json scripts/cleanNonTechVagas.mts            (dry run)
//   pnpm tsx --tsconfig tsconfig.node.json scripts/cleanNonTechVagas.mts --apply

import { isTechJob } from "../server/lib/vagas/relevance";
import { supabaseAdmin } from "../server/lib/supabaseAdmin";

const APPLY = process.argv.includes("--apply");
const SOURCES = ["adzuna", "jooble", "ats_boards"] as const;
const PAGE = 1000;

type Row = { id: string; title: string; source: string; country: string | null };

async function loadPublished(source: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from("external_jobs")
      .select("id, title, source, country")
      .eq("source", source)
      .eq("is_published", true)
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${source}: ${error.message}`);
    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function countPublished(source: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("external_jobs")
    .select("id", { count: "exact", head: true })
    .eq("source", source)
    .eq("is_published", true);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function main() {
  console.log(`[clean-non-tech] modo: ${APPLY ? "APPLY" : "DRY RUN"}`);
  const toUnpublish: Row[] = [];
  const kept: Row[] = [];

  for (const source of SOURCES) {
    const rows = await loadPublished(source);
    const bad = rows.filter((row) => !isTechJob(row.title));
    const good = rows.length - bad.length;
    console.log(
      `\n=== ${source}: ${rows.length} publicadas | manteria ${good} | despublicaria ${bad.length} ===`,
    );
    for (const row of bad) {
      console.log(`  [-] [${row.country}] ${row.title}`);
    }
    toUnpublish.push(...bad);
    kept.push(...rows.filter((row) => isTechJob(row.title)));
  }

  console.log(`\n=== 30 titulos aleatorios que FICAM ===`);
  const shuffled = kept
    .map((r, i) => ({ r, k: (i * 2654435761) % 4294967296 }))
    .sort((a, b) => a.k - b.k)
    .slice(0, 30);
  for (const { r } of shuffled) {
    console.log(`  [+] [${r.source}/${r.country}] ${r.title}`);
  }

  console.log(
    `\nTOTAL a despublicar: ${toUnpublish.length} (adzuna ${toUnpublish.filter((r) => r.source === "adzuna").length}, jooble ${toUnpublish.filter((r) => r.source === "jooble").length}, ats_boards ${toUnpublish.filter((r) => r.source === "ats_boards").length})`,
  );

  if (!APPLY) {
    console.log("[clean-non-tech] dry run: nada foi escrito. Use --apply.");
    process.exit(0);
  }

  const before = Object.fromEntries(
    await Promise.all(
      SOURCES.map(async (s) => [s, await countPublished(s)] as const),
    ),
  );
  for (let i = 0; i < toUnpublish.length; i += 100) {
    const batch = toUnpublish.slice(i, i + 100).map((r) => r.id);
    const { error } = await supabaseAdmin
      .from("external_jobs")
      .update({ is_published: false })
      .in("id", batch)
      // Defesa em profundidade: mesmo com ids ja filtrados, o update jamais
      // alcanca manual/github.
      .in("source", SOURCES as unknown as string[]);
    if (error) throw new Error(`update lote ${i}: ${error.message}`);
  }
  const after = Object.fromEntries(
    await Promise.all(
      SOURCES.map(async (s) => [s, await countPublished(s)] as const),
    ),
  );
  console.log("[clean-non-tech] publicadas antes:", JSON.stringify(before));
  console.log("[clean-non-tech] publicadas depois:", JSON.stringify(after));
  process.exit(0);
}

void main();
