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

/**
 * FUNCOES, POLICIES E INDICES.
 *
 * Quinta instancia da classe "guard cuja cobertura e lista incompleta", e criada
 * pela propria correcao do TOCTOU: a migration nova cria uma FUNCAO, e este
 * script so enumerava `create table`. Esquecer de aplica-la nao acusava nada.
 *
 * O que da para VERIFICAR com o acesso disponivel (PostgREST + service role):
 *   - tabelas e views: um GET devolve PGRST205 quando nao existem;
 *   - funcoes: o OpenAPI do PostgREST (`GET /rest/v1/` com Accept
 *     application/openapi+json) enumera as RPC expostas. Leitura pura, sem
 *     efeito colateral. NAO chamamos a funcao para testar existencia de
 *     proposito: `reserve_ai_usage_slot` e VOLATILE e INSERE linha.
 *
 * O que NAO da: policy e indice nao aparecem em lugar nenhum do PostgREST, e o
 * projeto nao tem DATABASE_URL nem cliente Postgres. As duas sao enumeradas da
 * fonte, com guard de cobertura do parser, e reportadas como DECLARADAS SEM
 * VERIFICACAO. E menos do que verificar, e e mais do que fingir que nao
 * existem: o numero fica visivel e uma queda nele aparece.
 */
const CREATE_FUNCTION_RE =
  /create\s+(?:or\s+replace\s+)?function\s+(?:public|"public")\.\s*"?([a-z0-9_]+)"?/gi;
const ANY_CREATE_FUNCTION_RE = /create\s+(?:or\s+replace\s+)?function\s+[^\s(;]+/gi;
const DROP_FUNCTION_RE =
  /drop\s+function\s+(?:if\s+exists\s+)?(?:public|"public")\.\s*"?([a-z0-9_]+)"?/gi;

/**
 * RLS: `alter table ... enable row level security`.
 *
 * Sai de "enumerado, nao verificado" e vira verificado, porque esta nao e
 * higiene, e exposicao: a tabela existe, entao o guard de tabela passa, e sem a
 * RLS aplicada ela fica legivel pela chave anon.
 */
const ENABLE_RLS_RE =
  /alter\s+table\s+(?:if\s+exists\s+)?(?:public|"public")\.\s*"?([a-z0-9_]+)"?\s+enable\s+row\s+level\s+security/gi;
const ANY_ENABLE_RLS_RE = /enable\s+row\s+level\s+security/gi;
const DISABLE_RLS_RE =
  /alter\s+table\s+(?:if\s+exists\s+)?(?:public|"public")\.\s*"?([a-z0-9_]+)"?\s+disable\s+row\s+level\s+security/gi;

/**
 * Policy de SELECT que o papel `anon` consegue usar.
 *
 * A regra do Postgres que importa aqui: policy SEM clausula `to` vale para
 * `public`, o que inclui `anon`. A primeira versao deste teste exigia `to anon`
 * explicito e teria acusado 11 tabelas de catalogo como exposicao, todas com
 * `for select using (is_published = true)` e nenhum `to`. Falso positivo em
 * guard de seguranca e pior que inutil: ensina a ignorar o alarme.
 */
const POLICY_SELECT_RE =
  /create\s+policy\s+"?([^"\n]+?)"?\s+on\s+(?:public|"public")\.\s*"?([a-z0-9_]+)"?([\s\S]{0,400}?);/gi;

const rlsDeclarada = new Set<string>();
const tabelasComSelectPublico = new Set<string>();

const CREATE_POLICY_RE = /create\s+policy\s+"?([^"\n]+?)"?\s+on\s/gi;
const ANY_CREATE_POLICY_RE = /create\s+policy\s/gi;
const CREATE_INDEX_RE =
  /create\s+(?:unique\s+)?index\s+(?:concurrently\s+)?(?:if\s+not\s+exists\s+)?"?([a-z0-9_]+)"?/gi;
const ANY_CREATE_INDEX_RE = /create\s+(?:unique\s+)?index\s/gi;

/**
 * Funcao que devolve trigger NAO e exposta pelo PostgREST, entao nao pode ser
 * cobrada na verificacao. Reconhecida pela assinatura, nao por lista de nomes.
 *
 * O escopo e o PRIMEIRO `returns` depois do `create function`, que e o desta
 * funcao. A primeira versao procurava "returns trigger" numa janela de 4000
 * caracteres, e isso classificou `get_study_heatmap` e `is_user_admin` como
 * trigger porque havia uma funcao de trigger logo abaixo no mesmo arquivo. Sao
 * duas RPC reais, expostas, que sairiam da verificacao em silencio: a mesma
 * classe de defeito que este script existe para nao ter.
 */
function ehTrigger(sql: string, from: number): boolean {
  const m = /\breturns\s+"?(\w+)"?/i.exec(sql.slice(from, from + 4000));
  return m !== null && m[1].toLowerCase() === "trigger";
}

const funcoesDeclaradas = new Map<string, boolean>();
const policiesDeclaradas = new Set<string>();
const indicesDeclarados = new Set<string>();
const naoReconhecidasOutras: string[] = [];

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

// Mesma assercao de tamanho das tabelas, pelo mesmo motivo: pegar o caso em que
// o parser (ou a classificacao de trigger) encolhe em silencio. Mudar estes
// numeros e ato deliberado, no mesmo commit da migration que cria ou remove o
// objeto.
const EXPECTED_FUNCTION_COUNT = 22;
const EXPECTED_TRIGGER_FUNCTION_COUNT = 3;

/** Remove comentarios de linha e de bloco antes de qualquer parse. */
function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");
}

function conferirCoberturaSimples(
  lidas: number,
  fonte: string,
  amplo: RegExp,
  rotulo: string,
  arquivo: string,
): void {
  const todas = [...fonte.matchAll(amplo)].length;
  if (todas > lidas) {
    naoReconhecidasOutras.push(
      `${arquivo}: ${todas} "${rotulo}" no arquivo, ${lidas} reconhecidos pelo parser`,
    );
  }
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
  // FUNCOES, POLICIES, INDICES: mesma leitura, mesmo guard de cobertura.
  const fnLidas = [...sql.matchAll(CREATE_FUNCTION_RE)];
  for (const m of fnLidas) {
    funcoesDeclaradas.set(m[1].toLowerCase(), ehTrigger(sql, m.index ?? 0));
  }
  for (const m of sql.matchAll(DROP_FUNCTION_RE)) {
    funcoesDeclaradas.delete(m[1].toLowerCase());
  }
  const rlsLidas = [...sql.matchAll(ENABLE_RLS_RE)];
  for (const m of rlsLidas) rlsDeclarada.add(m[1].toLowerCase());
  for (const m of sql.matchAll(DISABLE_RLS_RE)) rlsDeclarada.delete(m[1].toLowerCase());
  conferirCoberturaSimples(rlsLidas.length, sql, ANY_ENABLE_RLS_RE, "enable row level security", file);
  for (const m of sql.matchAll(POLICY_SELECT_RE)) {
    const tabela = m[2].toLowerCase();
    const corpo = m[3].toLowerCase();
    const ehSelect =
      /for\s+select/.test(corpo) || !/for\s+(insert|update|delete|all)/.test(corpo);
    const semClausulaTo = !/\bto\s+[a-z_]/.test(corpo);
    const paraAnon = /\bto\s+[^;]*\b(anon|public)\b/.test(corpo);
    if (ehSelect && (semClausulaTo || paraAnon)) tabelasComSelectPublico.add(tabela);
  }

  const polLidas = [...sql.matchAll(CREATE_POLICY_RE)];
  for (const m of polLidas) policiesDeclaradas.add(m[1].trim().toLowerCase());
  const idxLidos = [...sql.matchAll(CREATE_INDEX_RE)];
  for (const m of idxLidos) indicesDeclarados.add(m[1].toLowerCase());

  const conferirCobertura = (
    lidas: RegExpMatchArray[],
    amplo: RegExp,
    rotulo: string,
  ) => {
    const todas = [...sql.matchAll(amplo)];
    if (todas.length <= lidas.length) return;
    naoReconhecidasOutras.push(
      `${file}: ${todas.length} "${rotulo}" no arquivo, ${lidas.length} reconhecidos pelo parser`,
    );
  };
  conferirCobertura(fnLidas, ANY_CREATE_FUNCTION_RE, "create function");
  conferirCobertura(polLidas, ANY_CREATE_POLICY_RE, "create policy");
  conferirCobertura(idxLidos, ANY_CREATE_INDEX_RE, "create index");

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

if (naoReconhecidasOutras.length > 0) {
  console.error(
    `[checkMigrationsApplied] o parser nao leu todos os objetos declarados:`,
  );
  for (const item of naoReconhecidasOutras) console.error(`  ${item}`);
  console.error(
    "Ajuste os regex do bloco de funcoes/policies/indices antes de confiar neste script.",
  );
  process.exit(1);
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

// Falha acumulada, nao aborto na primeira categoria: descobrir que faltava uma
// tabela, aplicar, rodar de novo e so entao descobrir que faltava uma funcao e
// o mesmo desperdicio de ciclo que o checklist manual causava.
let houveFalha = false;

if (missing.length > 0) {
  houveFalha = true;
  console.error(
    `[checkMigrationsApplied] ${missing.length} de ${tables.length} tabela(s) declaradas NAO existem no banco alvo:`,
  );
  for (const table of missing) console.error(`  ausente: public.${table}`);
} else {
  console.log(
    `[checkMigrationsApplied] ${tables.length} tabela(s) declaradas nas migrations existem no banco alvo.`,
  );
}

// ---------------------------------------------------------------------------
// FUNCOES: verificadas contra o OpenAPI do PostgREST.
// ---------------------------------------------------------------------------
const funcoesVerificaveis = [...funcoesDeclaradas.entries()]
  .filter(([, trigger]) => !trigger)
  .map(([nome]) => nome)
  .sort();
const funcoesTrigger = [...funcoesDeclaradas.entries()].filter(
  ([, trigger]) => trigger,
).length;

async function rpcsExpostas(): Promise<Set<string> | null> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: "application/openapi+json",
      },
    });
    if (!response.ok) return null;
    const spec = (await response.json()) as { paths?: Record<string, unknown> };
    const nomes = Object.keys(spec.paths ?? {})
      .filter((p) => p.startsWith("/rpc/"))
      .map((p) => p.slice(5).toLowerCase());
    return new Set(nomes);
  } catch (err) {
    console.error(
      "[checkMigrationsApplied] falha ao ler o OpenAPI do PostgREST:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

if (funcoesDeclaradas.size !== EXPECTED_FUNCTION_COUNT) {
  houveFalha = true;
  console.error(
    `[checkMigrationsApplied] o conjunto de funcoes declaradas mudou: ${funcoesDeclaradas.size}, esperado ${EXPECTED_FUNCTION_COUNT}.`,
  );
}
if (funcoesTrigger !== EXPECTED_TRIGGER_FUNCTION_COUNT) {
  houveFalha = true;
  console.error(
    `[checkMigrationsApplied] a classificacao de trigger mudou: ${funcoesTrigger}, esperado ${EXPECTED_TRIGGER_FUNCTION_COUNT}. Funcao real classificada como trigger sai da verificacao em silencio.`,
  );
}

const expostas = await rpcsExpostas();
if (expostas === null) {
  houveFalha = true;
  console.error(
    "[checkMigrationsApplied] sem veredito para funcoes: o OpenAPI nao respondeu.",
  );
} else {
  const funcoesAusentes = funcoesVerificaveis.filter((f) => !expostas.has(f));
  if (funcoesAusentes.length > 0) {
    houveFalha = true;
    console.error(
      `[checkMigrationsApplied] ${funcoesAusentes.length} de ${funcoesVerificaveis.length} funcao(oes) declaradas NAO existem no banco alvo:`,
    );
    for (const f of funcoesAusentes) console.error(`  ausente: public.${f}()`);
  } else {
    console.log(
      `[checkMigrationsApplied] ${funcoesVerificaveis.length} funcao(oes) declaradas existem no banco alvo (${funcoesTrigger} de trigger nao sao verificaveis por REST).`,
    );
  }
}

// ---------------------------------------------------------------------------
// RLS: verificada de fato, lendo com a chave anon.
// ---------------------------------------------------------------------------
const EXPECTED_RLS_COUNT = 73;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const rlsVivas = [...rlsDeclarada].filter((t) => declared.has(t)).sort();
if (rlsVivas.length !== EXPECTED_RLS_COUNT) {
  houveFalha = true;
  console.error(
    `[checkMigrationsApplied] o conjunto de tabelas com RLS mudou: ${rlsVivas.length}, esperado ${EXPECTED_RLS_COUNT}.`,
  );
}

async function contarLinhas(tabela: string, chave: string): Promise<number> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${tabela}?select=*`, {
      headers: {
        apikey: chave,
        Authorization: `Bearer ${chave}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
    });
    if (!response.ok) return -1;
    return Number(response.headers.get("content-range")?.split("/")[1] ?? -1);
  } catch {
    return -1;
  }
}

if (!anonKey) {
  console.warn(
    `[checkMigrationsApplied] RLS NAO verificada em ${rlsVivas.length} tabela(s): VITE_SUPABASE_ANON_KEY ausente no ambiente. A verificacao precisa das duas chaves.`,
  );
} else {
  const expostas: string[] = [];
  const inconclusivas: string[] = [];
  let protegidas = 0;
  let publicasDeclaradas = 0;
  for (const tabela of rlsVivas) {
    const comServico = await contarLinhas(tabela, serviceRoleKey!);
    if (comServico < 0) {
      inconclusivas.push(`${tabela} (service role nao leu)`);
      continue;
    }
    if (comServico === 0) {
      // Tabela vazia nao prova nada: anon ver zero pode ser RLS ou pode ser
      // que nao ha o que ver. NUNCA contar como verde.
      inconclusivas.push(`${tabela} (vazia)`);
      continue;
    }
    const comAnon = await contarLinhas(tabela, anonKey);
    if (comAnon <= 0) {
      protegidas += 1;
    } else if (tabelasComSelectPublico.has(tabela)) {
      publicasDeclaradas += 1;
    } else {
      expostas.push(`${tabela} (service role ve ${comServico}, anon ve ${comAnon})`);
    }
  }
  if (expostas.length > 0) {
    houveFalha = true;
    console.error(
      `[checkMigrationsApplied] ${expostas.length} tabela(s) com RLS declarada estao LEGIVEIS pela chave anon sem policy publica que justifique:`,
    );
    for (const e of expostas) console.error(`  EXPOSTA: public.${e}`);
  }
  console.log(
    `[checkMigrationsApplied] RLS: ${protegidas} protegida(s), ${publicasDeclaradas} publica(s) por policy declarada, ${expostas.length} exposta(s), ${inconclusivas.length} inconclusiva(s) de ${rlsVivas.length}.`,
  );
  if (inconclusivas.length > 0) {
    console.warn(
      `  inconclusivas (sem veredito, NAO sao verdes): ${inconclusivas.join(", ")}`,
    );
  }
}

// ---------------------------------------------------------------------------
// POLICIES E INDICES: enumerados da fonte, SEM caminho de verificacao.
// ---------------------------------------------------------------------------
console.log(
  `[checkMigrationsApplied] ${policiesDeclaradas.size} policy(s) e ${indicesDeclarados.size} indice(s) declarados nas migrations. NAO VERIFICADOS: o PostgREST nao expoe nenhum dos dois e o projeto nao tem conexao direta ao Postgres. Ver docs/limites-do-guard-de-migrations.md.`,
);

if (houveFalha) {
  console.error(
    "\nAplique as migrations pendentes antes de considerar o deploy concluido.",
  );
  process.exit(1);
}
