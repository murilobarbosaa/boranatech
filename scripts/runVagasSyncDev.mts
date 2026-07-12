// Runner dev do sync de vagas (front VAGAS, fase 2). Uso:
//   pnpm tsx --tsconfig tsconfig.node.json scripts/runVagasSyncDev.mts            (dry run)
//   pnpm tsx --tsconfig tsconfig.node.json scripts/runVagasSyncDev.mts --real --limit=15
// Dry run nao escreve nada e ignora o gate de cadencia. --real escreve no
// banco (compartilhado com producao: use sempre --limit pequeno).

import { runVagasSync } from "../server/jobs/syncJobs";

const real = process.argv.includes("--real");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const perUnitLimit = limitArg
  ? parseInt(limitArg.split("=")[1], 10)
  : undefined;

if (real && (!perUnitLimit || perUnitLimit > 50)) {
  console.error("[runVagasSyncDev] --real exige --limit=N com N <= 50.");
  process.exit(1);
}

const result = await runVagasSync({ dryRun: !real, perUnitLimit });
console.log(JSON.stringify(result, null, 2));
process.exit(0);
