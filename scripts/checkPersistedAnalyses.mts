// Passa TODAS as linhas de linkedin_analyses pelos leitores versionados
// (readQualitative e readDeterministic) e reporta o que cada uma produz.
//
// Existe porque o fechamento da Fase 0 afirmava que "as 107 analises antigas
// continuam abrindo" com base em UMA linha real testada. Uma amostra de 1 nao
// prova ausencia de variacao de formato; este script fecha a lacuna e vira o
// smoke test padrao antes de qualquer mudanca de formato do result.
//
// Uso:
//   pnpm check:persisted            (resumo)
//   pnpm check:persisted -- --verbose  (lista cada linha com campo ausente)
//
// Saida: exit 1 se QUALQUER linha lancar. Campo ausente NAO e falha por si, e
// informacao: os leitores existem justamente para degradar. O script imprime a
// distribuicao para a mudanca de formato ser vista antes de virar bug.
import { readQualitative } from "../shared/linkedin/readQualitative";
import { readDeterministic } from "../shared/linkedin/readDeterministic";

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const verbose = process.argv.includes("--verbose");

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "[checkPersistedAnalyses] faltam VITE_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

interface Linha {
  id: string;
  created_at: string;
  result: {
    qualitative?: unknown;
    deterministic?: unknown;
    qualitativeVersion?: number;
    deterministicVersion?: number;
  } | null;
}

const PAGE = 500;
const linhas: Linha[] = [];
for (let from = 0; ; from += PAGE) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/linkedin_analyses?select=id,created_at,result&order=created_at.asc`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Range: `${from}-${from + PAGE - 1}`,
      },
    },
  );
  if (!res.ok) {
    console.error(`[checkPersistedAnalyses] HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const page = (await res.json()) as Linha[];
  linhas.push(...page);
  if (page.length < PAGE) break;
}

let lancaram = 0;
const versoesQ: Record<string, number> = {};
const versoesD: Record<string, number> = {};
const ausentesQ: Record<string, number> = {};
const ausentesD: Record<string, number> = {};
let comAusenteQ = 0;
let comAusenteD = 0;

for (const linha of linhas) {
  try {
    const q = readQualitative(
      linha.result?.qualitative,
      linha.result?.qualitativeVersion,
    );
    const d = readDeterministic(
      linha.result?.deterministic,
      linha.result?.deterministicVersion,
    );
    versoesQ[`v${q.version}`] = (versoesQ[`v${q.version}`] ?? 0) + 1;
    versoesD[`v${d.version}`] = (versoesD[`v${d.version}`] ?? 0) + 1;
    if (q.camposAusentes.length > 0) {
      comAusenteQ += 1;
      for (const c of q.camposAusentes) ausentesQ[c] = (ausentesQ[c] ?? 0) + 1;
      if (verbose)
        console.log(`  ${linha.id} (${linha.created_at.slice(0, 10)}) qualitative ausentes: ${q.camposAusentes.join(", ")}`);
    }
    if (d.camposAusentes.length > 0) {
      comAusenteD += 1;
      for (const c of d.camposAusentes) ausentesD[c] = (ausentesD[c] ?? 0) + 1;
      if (verbose)
        console.log(`  ${linha.id} (${linha.created_at.slice(0, 10)}) deterministic ausentes: ${d.camposAusentes.join(", ")}`);
    }
  } catch (err) {
    lancaram += 1;
    console.error(
      `  LANCOU em ${linha.id}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

console.log(`[checkPersistedAnalyses] linhas lidas: ${linhas.length}`);
console.log(`  lancaram (esperado 0): ${lancaram}`);
console.log(`  versoes de qualitative: ${JSON.stringify(versoesQ)}`);
console.log(`  versoes de deterministic: ${JSON.stringify(versoesD)}`);
console.log(`  linhas com campo ausente no qualitative: ${comAusenteQ} ${comAusenteQ ? JSON.stringify(ausentesQ) : ""}`);
console.log(`  linhas com campo ausente no deterministic: ${comAusenteD} ${comAusenteD ? JSON.stringify(ausentesD) : ""}`);

if (lancaram > 0) {
  console.error("[checkPersistedAnalyses] FALHOU: leitor lancou em pelo menos uma linha.");
  process.exit(1);
}
console.log("[checkPersistedAnalyses] OK: nenhuma linha derruba os leitores.");
