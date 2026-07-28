// Conjunto de COLUNAS, INDICES e POLICIES declarados pelas migrations.
//
// Existe porque o guard verificava tabelas e funcoes e nao verificava coluna
// nenhuma. `20260727130000_add_processed_at_to_billing_events.sql` ficou no
// repositorio sem ser aplicada, o `processed_at` nunca existiu em producao, e
// `pnpm check:migrations` seguiu VERDE afirmando "81 tabela(s) declaradas
// existem". A tabela existia mesmo; a coluna nao. O proprio
// docs/limites-do-guard-de-migrations.md ja nomeava isso como "a maior lacuna
// que sobra", entao o limite estava declarado e continuava sendo um limite.
//
// O ESCOPO DESTE PARSER E DERIVADO DA FONTE, e por isso ele carrega o unico
// desenho que a casa aceita para essa situacao: ABORTO EM NAO CLASSIFICADO. Toda
// ocorrencia ampla de `add column`, `drop column`, `create index`, `drop index`,
// `create policy` e `drop policy` precisa ter sido lida por uma das formas
// reconhecidas abaixo. Uma forma nova derruba a execucao em vez de encolher o
// conjunto em silencio (o padrao de scripts/mutateLinkedinThresholds.mjs).
//
// FORMAS RECONHECIDAS
//   create table [if not exists] <t> ( <col> ..., <col> ... )   colunas inline
//   alter table [if exists] <t> <acao>[, <acao>]... ;           LISTA de acoes
//       onde <acao> e uma de:
//         add column [if not exists] <c> ...
//         drop column [if exists] <c>
//         rename column <c> to <c2>
//         qualquer outra (alter column, add constraint, enable rls, ...) e
//         reconhecida e IGNORADA de proposito: nao muda o conjunto de nomes.
//   create [unique] index [concurrently] [if not exists] <i> on <t>
//   drop index [if exists] <i>
//   create policy <p> on <t>
//   drop policy [if exists] <p> on <t>
//   drop table [if exists] <t>        (remove colunas, indices e policies dela)
//
// A LISTA DE ACOES NAO E DETALHE. A primeira versao deste modulo tratava
// `alter table` como UM add/drop por statement, e o `alter table public.news add
// column a TEXT, add column b TEXT, ...` (multi-linha, 5 colunas num statement)
// rendia 1 coluna de 5. Pior: a checagem que eu fiz para "esta forma nao existe
// nesta base" foi um `grep -E "add column[^;]*, *add column"`, e grep casa por
// LINHA enquanto a forma ocupa varias. O resultado vazio foi lido como ausencia.
// Foi o ABORTO EM NAO CLASSIFICADO que pegou, na primeira execucao: 7 arquivos,
// 38 ocorrencias amplas contra 8 lidas. Sem ele, o conjunto teria nascido 30
// colunas menor e verde.
//
// FORMAS AINDA NAO RECONHECIDAS (se aparecerem, o guard aborta):
//   alter table ... rename to ...            rename de TABELA
//   create table ... as select / ( like ... )
//   create index on <t>                      indice sem nome
//   alter index ... rename to ...
//
// O QUE ESTE MODULO NAO AFIRMA, de proposito:
//   - tipo, nullability ou default de coluna (so a EXISTENCIA do nome);
//   - expressao `using`/`with check` de policy (so a existencia por tabela+nome);
//   - definicao do indice (so a existencia por nome);
//   - constraints, triggers, enums, grants.
// Verificar esses exige comparar dois schemas de verdade, nao ler texto. Ver a
// secao "Reconstrucao" em docs/limites-do-guard-de-migrations.md.

export type SchemaDeclarado = {
  /** `tabela.coluna`, minusculas, apos aplicar drops e renames em ordem. */
  colunas: Map<string, string>;
  /** nome do indice -> arquivo que o declarou. */
  indices: Map<string, string>;
  /** `tabela||policy` -> arquivo que a declarou. */
  policies: Map<string, string>;
  /** Ocorrencias amplas que nenhuma forma reconhecida leu. Nao-vazio = abortar. */
  naoClassificados: string[];
};

type Evento =
  | { pos: number; tipo: "col+"; chave: string }
  | { pos: number; tipo: "col-"; chave: string }
  | { pos: number; tipo: "idx+"; nome: string; tabela: string }
  | { pos: number; tipo: "idx-"; nome: string }
  | { pos: number; tipo: "pol+"; chave: string }
  | { pos: number; tipo: "pol-"; chave: string }
  | { pos: number; tipo: "tab-"; tabela: string };

const CREATE_TABLE = /create\s+table\s+(?:if\s+not\s+exists\s+)?([\w".]+)\s*\(/gi;
const ALTER_TABLE = /alter\s+table\s+(?:only\s+)?(?:if\s+exists\s+)?([\w".]+)\s/gi;
const ACAO_ADD = /^add\s+column\s+(?:if\s+not\s+exists\s+)?([\w"]+)/i;
const ACAO_DROP = /^drop\s+column\s+(?:if\s+exists\s+)?([\w"]+)/i;
const ACAO_RENAME = /^rename\s+column\s+([\w"]+)\s+to\s+([\w"]+)/i;
const CREATE_INDEX =
  /create\s+(?:unique\s+)?index\s+(?:concurrently\s+)?(?:if\s+not\s+exists\s+)?([\w"]+)\s+on\s+([\w".]+)/gi;
const DROP_INDEX = /drop\s+index\s+(?:if\s+exists\s+)?([\w".]+)/gi;
const CREATE_POLICY = /create\s+policy\s+"?([^"\n]+?)"?\s+on\s+([\w".]+)/gi;
const DROP_POLICY = /drop\s+policy\s+(?:if\s+exists\s+)?"?([^"\n]+?)"?\s+on\s+([\w".]+)/gi;
const DROP_TABLE = /drop\s+table\s+(?:if\s+exists\s+)?([\w".]+)/gi;

// Contadores amplos: qualquer ocorrencia da acao, sem exigir forma.
const AMPLO = {
  "add column": /\badd\s+column\b/gi,
  "drop column": /\bdrop\s+column\b/gi,
  "rename column": /\brename\s+column\b/gi,
  "create index": /\bcreate\s+(?:unique\s+)?index\b/gi,
  "drop index": /\bdrop\s+index\b/gi,
  "create policy": /\bcreate\s+policy\b/gi,
  "drop policy": /\bdrop\s+policy\b/gi,
  "create table": /\bcreate\s+table\b/gi,
  "drop table": /\bdrop\s+table\b/gi,
} as const;

/** Remove aspas e o prefixo `public.`, deixando o nome nu em minusculas. */
function nu(bruto: string): string {
  return bruto.replace(/"/g, "").replace(/^public\./i, "").trim().toLowerCase();
}

/**
 * Recorta o corpo do `create table` BALANCEANDO parenteses, e separa as
 * definicoes por virgula de TOPO.
 *
 * Split por virgula sem contar profundidade quebraria em `numeric(10, 2)` e em
 * `check (status in ('a', 'b'))`, cortando uma definicao no meio e inventando
 * colunas com nome de fragmento. O balanceamento e o que evita isso.
 */
function colunasDoCorpo(sql: string, aberturaParen: number): string[] {
  let profundidade = 0;
  let i = aberturaParen;
  do {
    if (sql[i] === "(") profundidade += 1;
    else if (sql[i] === ")") profundidade -= 1;
    i += 1;
  } while (i < sql.length && profundidade > 0);
  const corpo = sql.slice(aberturaParen + 1, i - 1);

  const partes: string[] = [];
  let atual = "";
  let d = 0;
  for (const ch of corpo) {
    if (ch === "(") d += 1;
    if (ch === ")") d -= 1;
    if (ch === "," && d === 0) {
      partes.push(atual);
      atual = "";
    } else atual += ch;
  }
  partes.push(atual);

  const nomes: string[] = [];
  for (const parte of partes) {
    const t = parte.trim();
    if (!t) continue;
    // Constraint de TABELA nao e coluna. `constraint <nome> ...` tambem entra
    // aqui, e e por isso que a checagem vem antes de ler o primeiro token.
    if (/^(primary\s+key|foreign\s+key|unique|check|constraint|exclude|like)\b/i.test(t)) continue;
    const m = t.match(/^([\w"]+)\s/);
    if (m) nomes.push(nu(m[1]));
  }
  return nomes;
}

/**
 * Recorta a LISTA DE ACOES de um `alter table` e a separa por virgula de topo.
 *
 * O fim do statement e o `;` em profundidade zero de parenteses e fora de string
 * literal. Contar `;` cru quebraria em `default 'a;b'` e em `check (x in ('a;'))`.
 * A virgula de topo e o separador de acoes: dentro de `numeric(10, 2)` ou de
 * `check (s in ('a','b'))` ela nao separa nada.
 */
function acoesDoAlterTable(sql: string, inicio: number): string[] {
  let i = inicio;
  let profundidade = 0;
  let emString = false;
  while (i < sql.length) {
    const ch = sql[i];
    if (emString) {
      if (ch === "'") {
        if (sql[i + 1] === "'") i += 1;
        else emString = false;
      }
    } else if (ch === "'") emString = true;
    else if (ch === "(") profundidade += 1;
    else if (ch === ")") profundidade -= 1;
    else if (ch === ";" && profundidade === 0) break;
    i += 1;
  }
  const corpo = sql.slice(inicio, i);

  const partes: string[] = [];
  let atual = "";
  let d = 0;
  let str = false;
  for (let j = 0; j < corpo.length; j += 1) {
    const ch = corpo[j];
    if (str) {
      if (ch === "'") {
        if (corpo[j + 1] === "'") {
          atual += ch + corpo[j + 1];
          j += 1;
          continue;
        }
        str = false;
      }
    } else if (ch === "'") str = true;
    else if (ch === "(") d += 1;
    else if (ch === ")") d -= 1;
    else if (ch === "," && d === 0) {
      partes.push(atual);
      atual = "";
      continue;
    }
    atual += ch;
  }
  partes.push(atual);
  return partes.map((p) => p.trim().replace(/\s+/g, " ")).filter(Boolean);
}

/** Acumulador: recebe o SQL JA SEM COMENTARIOS de cada migration, em ordem. */
export function criarAcumulador() {
  const colunas = new Map<string, string>();
  const indices = new Map<string, string>();
  const policies = new Map<string, string>();
  const tabelaDoIndice = new Map<string, string>();
  const naoClassificados: string[] = [];

  function aplicarArquivo(arquivo: string, sql: string): void {
    const eventos: Evento[] = [];
    const lidos: Record<string, number> = {};
    const contar = (rotulo: string, n = 1) => {
      lidos[rotulo] = (lidos[rotulo] ?? 0) + n;
    };

    for (const m of sql.matchAll(CREATE_TABLE)) {
      const tabela = nu(m[1]);
      const nomes = colunasDoCorpo(sql, m.index + m[0].length - 1);
      contar("create table");
      // Um `create table` que nao rendeu coluna nenhuma e sinal de que o corte
      // do corpo falhou. Nao pode passar como "tabela sem colunas".
      if (nomes.length === 0) {
        naoClassificados.push(
          `${arquivo}: "create table ${tabela}" nao rendeu coluna nenhuma (corte do corpo falhou?)`,
        );
      }
      for (const c of nomes) eventos.push({ pos: m.index, tipo: "col+", chave: `${tabela}.${c}` });
    }
    for (const m of sql.matchAll(ALTER_TABLE)) {
      const tabela = nu(m[1]);
      const acoes = acoesDoAlterTable(sql, m.index + m[0].length);
      for (let k = 0; k < acoes.length; k += 1) {
        const acao = acoes[k];
        // pos+k preserva a ordem RELATIVA das acoes dentro do statement, que
        // importa num `drop column x, add column x` no mesmo alter.
        const pos = m.index + k;
        const add = acao.match(ACAO_ADD);
        if (add) {
          contar("add column");
          eventos.push({ pos, tipo: "col+", chave: `${tabela}.${nu(add[1])}` });
          continue;
        }
        const drop = acao.match(ACAO_DROP);
        if (drop) {
          contar("drop column");
          eventos.push({ pos, tipo: "col-", chave: `${tabela}.${nu(drop[1])}` });
          continue;
        }
        const ren = acao.match(ACAO_RENAME);
        if (ren) {
          contar("rename column");
          eventos.push({ pos, tipo: "col-", chave: `${tabela}.${nu(ren[1])}` });
          eventos.push({ pos: pos + 0.5, tipo: "col+", chave: `${tabela}.${nu(ren[2])}` });
          continue;
        }
        // Chegar aqui com "add/drop/rename column" significa que a acao E de
        // coluna e o parser NAO conseguiu extrair o nome. Nao contabiliza (o
        // guard de cobertura vai acusar) e registra o trecho: um `contar()` aqui
        // esconderia exatamente o caso que este modulo existe para pegar.
        if (/^(add|drop|rename)\s+column\b/i.test(acao)) {
          naoClassificados.push(
            `${arquivo}: acao de coluna em "alter table ${tabela}" sem nome extraivel: "${acao.slice(0, 80)}"`,
          );
        }
        // Qualquer outra acao (alter column, add constraint, enable row level
        // security, owner to, ...) nao mexe no CONJUNTO de nomes: ignorar e
        // correto e nao precisa de contagem.
      }
    }
    for (const m of sql.matchAll(CREATE_INDEX)) {
      contar("create index");
      eventos.push({ pos: m.index, tipo: "idx+", nome: nu(m[1]), tabela: nu(m[2]) });
    }
    for (const m of sql.matchAll(DROP_INDEX)) {
      contar("drop index");
      eventos.push({ pos: m.index, tipo: "idx-", nome: nu(m[1]) });
    }
    for (const m of sql.matchAll(CREATE_POLICY)) {
      contar("create policy");
      eventos.push({ pos: m.index, tipo: "pol+", chave: `${nu(m[2])}||${m[1].trim().toLowerCase()}` });
    }
    for (const m of sql.matchAll(DROP_POLICY)) {
      contar("drop policy");
      eventos.push({ pos: m.index, tipo: "pol-", chave: `${nu(m[2])}||${m[1].trim().toLowerCase()}` });
    }
    for (const m of sql.matchAll(DROP_TABLE)) {
      contar("drop table");
      eventos.push({ pos: m.index, tipo: "tab-", tabela: nu(m[1]) });
    }

    // GUARD DE COBERTURA: ampla > lida significa forma nao reconhecida.
    for (const [rotulo, re] of Object.entries(AMPLO)) {
      const amplas = [...sql.matchAll(re)].length;
      const reconhecidas = lidos[rotulo] ?? 0;
      if (amplas > reconhecidas) {
        naoClassificados.push(
          `${arquivo}: ${amplas} "${rotulo}" no arquivo, ${reconhecidas} reconhecido(s) pelo parser`,
        );
      }
    }

    // Ordem do arquivo: criar e dropar na sequencia reproduz o estado final.
    eventos.sort((a, b) => a.pos - b.pos);
    for (const e of eventos) {
      if (e.tipo === "col+") colunas.set(e.chave, arquivo);
      else if (e.tipo === "col-") colunas.delete(e.chave);
      else if (e.tipo === "idx+") {
        indices.set(e.nome, arquivo);
        tabelaDoIndice.set(e.nome, e.tabela);
      } else if (e.tipo === "idx-") {
        indices.delete(e.nome);
        tabelaDoIndice.delete(e.nome);
      } else if (e.tipo === "pol+") policies.set(e.chave, arquivo);
      else if (e.tipo === "pol-") policies.delete(e.chave);
      else if (e.tipo === "tab-") {
        // Tabela dropada leva coluna, indice e policy dela. Sem isto o guard
        // acusaria para sempre os objetos da `events`, dropada em
        // 20260517232033_drop_orphan_tables.sql, e ninguem mais confiaria nele.
        for (const k of [...colunas.keys()]) if (k.startsWith(`${e.tabela}.`)) colunas.delete(k);
        for (const [nome, tab] of [...tabelaDoIndice]) {
          if (tab === e.tabela) {
            indices.delete(nome);
            tabelaDoIndice.delete(nome);
          }
        }
        for (const k of [...policies.keys()]) if (k.startsWith(`${e.tabela}||`)) policies.delete(k);
      }
    }
  }

  function resultado(): SchemaDeclarado {
    return { colunas, indices, policies, naoClassificados };
  }

  return { aplicarArquivo, resultado };
}
