// Garante que TODA tabela declarada em supabase/migrations/*.sql existe de fato
// no banco alvo. Nasceu de um incidente real: a migration
// 20260710120000_create_linkedin_improvement_progress.sql ficou no repositorio
// sem nunca ser aplicada, o codigo subiu, e o checklist de melhorias do
// Analisador de LinkedIn nasceu morto em producao, devolvendo 500 no meio de um
// resultado que tinha dado certo. Nada quebrou no build nem no pnpm check: o
// codigo novo tolera schema antigo, entao a falha so aparece em runtime.
//
// Por que script e nao assert no boot do servidor:
//   1. O server de producao e um bundle esbuild (dist/index.js) e o diretorio
//      supabase/migrations NAO e copiado para o dist. Um assert no boot teria
//      que carregar uma lista de tabelas duplicada em TypeScript, que apodrece
//      na primeira migration que alguem esquecer de espelhar ali.
//   2. Este script le as migrations como fonte da verdade, sempre em sincronia.
//   3. Ele roda ANTES ou DEPOIS do deploy, contra qualquer banco alvo, que e
//      exatamente o passo que faltava no checklist (ver CLAUDE.md, Deploy).
// Nao entra no pnpm check de proposito: pnpm check e offline e este script
// precisa de rede e do service role.
//
// Uso:
//   pnpm check:migrations                 (le VITE_SUPABASE_URL e
//                                          SUPABASE_SERVICE_ROLE_KEY do ambiente)
// Saida: exit 1 e lista das tabelas ausentes; exit 0 quando tudo existe.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "supabase", "migrations");

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "[checkMigrationsApplied] faltam VITE_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no ambiente.",
  );
  process.exit(1);
}

// "create table [if not exists] public.<nome>", com ou sem aspas no nome.
/**
 * FORMAS DE "create table" QUE O PARSER RECONHECE:
 *   create table public.x                       create table if not exists public.x
 *   create table "public".x                     create table if not exists "public"."x"
 *   create table public."x"                     quebra de linha entre os tokens
 *   maiusculas/minusculas em qualquer combinacao (flag i)
 *
 * FORMAS QUE ELE NAO RECONHECE (de proposito ou por limitacao):
 *   create table x                    (sem schema; ambiguo, depende do search_path)
 *   create table outro_schema.x       (so auditamos o schema public)
 *   create temp/unlogged table ...    (nao e objeto persistente do schema)
 *   create table public . x           (espaco antes do ponto)
 *
 * A lista de nao-reconhecidas nao e teorica: a primeira versao deste script
 * usava um regex que exigia "if not exists" e enxergava 38 das 72 tabelas,
 * produzindo um "esta tudo certo" falso. Por isso existe o guard de cobertura
 * mais abaixo: qualquer "create table" que o parser NAO conseguir atribuir a
 * uma tabela derruba o script, em vez de encolher o conjunto em silencio.
 */
const CREATE_TABLE_RE =
  /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public|"public")\.\s*"?([a-z0-9_]+)"?/gi;
// "drop table [if exists] public.<nome>": tabela criada e depois removida por
// uma migration posterior nao deve existir no banco (ex.: os *_backup_20260516
// da 20260517231011, dropados pela 20260517232033). Sem isto o script acusa
// falso positivo e ninguem confia mais nele.
const DROP_TABLE_RE =
  /drop\s+table\s+(?:if\s+exists\s+)?(?:public|"public")\.\s*"?([a-z0-9_]+)"?/gi;
// Deteccao ampla, so para conferir COBERTURA do parser: pega qualquer
// "create ... table" e compara com o que o regex especifico conseguiu ler.
const ANY_CREATE_TABLE_RE = /create\s+(?:\w+\s+)*?table\s+(?:if\s+not\s+exists\s+)?[^\s(;]+/gi;

// Total esperado de tabelas declaradas e ainda vivas. Afirmado de proposito: se
// o conjunto ENCOLHER (regex que parou de casar, migration removida, parser
// quebrado), o script falha mesmo que todas as tabelas restantes existam no
// banco.
//
// MEXER NESTE NUMERO E ATO DELIBERADO, NAO TAREFA DE MANUTENCAO. Ele so muda
// junto com uma migration que cria ou dropa tabela, no MESMO commit dela, e a
// mensagem do commit deve dizer qual tabela entrou ou saiu. Se o script
// reclamar deste numero e voce nao mexeu em migration nenhuma, a resposta certa
// quase nunca e "atualizar o numero": e descobrir o que parou de ser
// reconhecido. Foi exatamente assim que a auditoria concluiu "so falta uma
// tabela" olhando 38 de 72.
const EXPECTED_TABLE_COUNT = 73;

/** Remove comentarios de linha e de bloco antes de qualquer parse. */
function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");
}

// Ordem lexicografica dos arquivos = ordem cronologica das migrations (prefixo
// timestamp), entao criar e dropar na sequencia reproduz o estado final.
const declared = new Set<string>();
const naoReconhecidas: string[] = [];
for (const file of readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  const sql = stripSqlComments(readFileSync(path.join(migrationsDir, file), "utf8"));
  const reconhecidas = [...sql.matchAll(CREATE_TABLE_RE)];
  for (const match of reconhecidas) {
    declared.add(match[1].toLowerCase());
  }
  for (const match of sql.matchAll(DROP_TABLE_RE)) {
    declared.delete(match[1].toLowerCase());
  }
  // Guard de cobertura por arquivo: todo "create table" precisa ter sido lido.
  const todas = [...sql.matchAll(ANY_CREATE_TABLE_RE)];
  if (todas.length > reconhecidas.length) {
    const lidas = new Set(reconhecidas.map((m) => m[0].replace(/\s+/g, " ").toLowerCase()));
    for (const m of todas) {
      const trecho = m[0].replace(/\s+/g, " ").toLowerCase();
      if (![...lidas].some((l) => l.startsWith(trecho) || trecho.startsWith(l))) {
        naoReconhecidas.push(`${file}: ${m[0].replace(/\s+/g, " ").slice(0, 80)}`);
      }
    }
  }
}

if (naoReconhecidas.length > 0) {
  console.error(
    `[checkMigrationsApplied] ${naoReconhecidas.length} "create table" que o parser NAO reconheceu:`,
  );
  for (const item of naoReconhecidas) console.error(`  ${item}`);
  console.error(
    "Ajuste CREATE_TABLE_RE (e o bloco de formas reconhecidas no topo) antes de confiar neste script.",
  );
  process.exit(1);
}

const tables = [...declared].sort();
if (tables.length === 0) {
  console.error("[checkMigrationsApplied] nenhuma tabela encontrada nas migrations.");
  process.exit(1);
}

if (tables.length !== EXPECTED_TABLE_COUNT) {
  console.error(
    `[checkMigrationsApplied] o conjunto declarado mudou: ${tables.length} tabela(s), esperado ${EXPECTED_TABLE_COUNT}.`,
  );
  console.error(
    tables.length < EXPECTED_TABLE_COUNT
      ? "  ENCOLHEU. Se nao foi um drop intencional, o parser provavelmente parou de reconhecer alguma forma."
      : "  CRESCEU. Se as tabelas novas sao esperadas, atualize EXPECTED_TABLE_COUNT.",
  );
  process.exit(1);
}

// PostgREST devolve 404 com code PGRST205 quando a tabela nao esta no schema
// cache. Qualquer outro status (200, 401, 403...) significa que ela existe ou
// que o problema nao e ausencia de tabela, e nesse caso nao acusamos falso
// positivo: so reportamos o que for comprovadamente ausente.
async function tableExists(table: string): Promise<boolean | null> {
  const url = `${supabaseUrl}/rest/v1/${table}?select=*&limit=1`;
  try {
    const response = await fetch(url, {
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });
    if (response.status === 404) {
      const body = (await response.json().catch(() => null)) as {
        code?: string;
      } | null;
      return body?.code === "PGRST205" ? false : null;
    }
    return true;
  } catch (err) {
    console.error(
      `[checkMigrationsApplied] falha de rede ao checar ${table}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

const missing: string[] = [];
const inconclusive: string[] = [];

for (const table of tables) {
  const exists = await tableExists(table);
  if (exists === false) missing.push(table);
  else if (exists === null) inconclusive.push(table);
}

if (inconclusive.length > 0) {
  console.warn(
    `[checkMigrationsApplied] ${inconclusive.length} tabela(s) sem veredito: ${inconclusive.join(", ")}`,
  );
}

if (missing.length > 0) {
  console.error(
    `[checkMigrationsApplied] ${missing.length} de ${tables.length} tabela(s) declaradas NAO existem no banco alvo:`,
  );
  for (const table of missing) console.error(`  ausente: public.${table}`);
  console.error(
    "Aplique as migrations pendentes antes de considerar o deploy concluido.",
  );
  process.exit(1);
}

console.log(
  `[checkMigrationsApplied] ${tables.length} tabela(s) declaradas nas migrations existem no banco alvo.`,
);
