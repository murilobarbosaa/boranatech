// Runner de SQL (Lote 11a):
//   node --disable-warning=ExperimentalWarning scripts/runSqlSnippet.mjs <arquivo.sql>
//
// Motor: node:sqlite (DatabaseSync) num banco :memory:. Nada de binario
// externo: o sqlite3 de linha de comando nao e garantido na maquina nem no
// runner do CI, e o Node 24 ja esta em todo lugar onde a suite roda.
//
// UM PROCESSO SO, SEM HANDLER DE SINAL. E o contrario do runTsSnippet.mjs, e
// de proposito: la o trecho roda num neto e o wrapper precisa capturar o
// SIGTERM para matar o grupo. Aqui nao existe neto, e uma consulta presa numa
// chamada nativa sincrona (count(*) sobre uma CTE sem fim) nunca devolve o
// controle ao loop de eventos, entao um handler de SIGTERM nunca rodaria e o
// processo ficaria vivo. Sem handler, vale a acao padrao do sinal, que mata.
//
// FORMATO DE SAIDA (a trilha e a pool dependem dele):
// - instrucao que devolve colunas: uma linha de cabecalho com os nomes
//   separados por " | ", e uma linha por registro, valores separados por " | ";
// - NULL sai NULL, inteiro exato, real pelo String() do JavaScript, texto cru,
//   blob como x'<hex>';
// - consulta sem registro imprime so o cabecalho;
// - blocos de duas consultas separados por UMA linha em branco;
// - instrucao sem colunas (CREATE, INSERT sem RETURNING) nao imprime nada;
// - mais de 200 registros num resultado e erro.
//
// FORMATO DE ERRO, no stderr, status 1:
//   <arquivo>:<linha>: error SQLITE_<NOME>: <mensagem>
// <linha> e a linha onde COMECA a instrucao que falhou; <NOME> e o codigo
// PRIMARIO, para `lanca=SQLITE_CONSTRAINT` casar por palavra inteira sem o
// sufixo _UNIQUE. <arquivo> e o nome do arquivo executado, ou __banco.sql
// quando o erro esta na base carregada antes (ver NOME_DA_BASE).
import { DatabaseSync, constants } from "node:sqlite";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const arquivo = process.argv[2];
if (!arquivo) {
  console.error("Uso: node scripts/runSqlSnippet.mjs <arquivo.sql>");
  process.exit(2);
}

// Teto de registros por resultado: uma consulta sem fim que devolve registros
// esgotaria a memoria antes do timeout do executor. Por isso a leitura e por
// iteracao, nunca com .all().
const MAX_REGISTROS = 200;

// Base nomeada (Lote 11a, `banco=` na cerca de sql): o verificador de blocos
// grava a base com este nome ao lado do trecho, e ela e carregada antes dele.
const NOME_DA_BASE = "__banco.sql";

// Codigos primarios do SQLite (sqlite.org/rescode.html). O estendido que o
// node:sqlite devolve em `errcode` carrega o primario no byte baixo
// (2067 = SQLITE_CONSTRAINT_UNIQUE, 2067 & 0xff = 19).
const PRIMARIOS = {
  1: "ERROR",
  2: "INTERNAL",
  3: "PERM",
  4: "ABORT",
  5: "BUSY",
  6: "LOCKED",
  7: "NOMEM",
  8: "READONLY",
  9: "INTERRUPT",
  10: "IOERR",
  11: "CORRUPT",
  12: "NOTFOUND",
  13: "FULL",
  14: "CANTOPEN",
  15: "PROTOCOL",
  16: "EMPTY",
  17: "SCHEMA",
  18: "TOOBIG",
  19: "CONSTRAINT",
  20: "MISMATCH",
  21: "MISUSE",
  22: "NOLFS",
  23: "AUTH",
  24: "FORMAT",
  25: "RANGE",
  26: "NOTADB",
  27: "NOTICE",
  28: "WARNING",
};

class ErroDoTrecho extends Error {
  constructor(codigo, mensagem) {
    super(mensagem);
    this.codigo = codigo;
  }
}

function codigoPrimario(erro) {
  if (erro instanceof ErroDoTrecho) return erro.codigo;
  // Erro sem errcode numerico nao veio do SQLite (bug deste wrapper ou do
  // node): relancar em vez de inventar um codigo plausivel.
  if (typeof erro?.errcode !== "number") throw erro;
  const nome = PRIMARIOS[erro.errcode & 0xff];
  if (!nome) throw erro;
  return `SQLITE_${nome}`;
}

const db = new DatabaseSync(":memory:");

// Proibicoes pelo autorizador do SQLite, que ve a instrucao ja analisada e nao
// o texto: ATTACH e DETACH gravariam (ou soltariam) arquivo no diretorio do
// executor, que entao nunca ficaria vazio; extensao e fora de escopo; gatilho
// fica de fora porque a trilha nao precisa dele. O motivo fica anotado aqui e
// vira a mensagem, no lugar do "not authorized" generico do SQLite.
let proibido = null;
db.setAuthorizer((acao, a1, a2) => {
  if (acao === constants.SQLITE_ATTACH) proibido = "ATTACH";
  else if (acao === constants.SQLITE_DETACH) proibido = "DETACH";
  else if (
    acao === constants.SQLITE_CREATE_TRIGGER ||
    acao === constants.SQLITE_CREATE_TEMP_TRIGGER
  )
    proibido = "CREATE TRIGGER";
  else if (acao === constants.SQLITE_FUNCTION && a2 === "load_extension")
    proibido = "load_extension";
  else return constants.SQLITE_OK;
  return constants.SQLITE_DENY;
});

function pularBrancosEComentarios(texto, pos) {
  let i = pos;
  for (;;) {
    while (i < texto.length && /[\s;]/.test(texto[i])) i++;
    if (texto.startsWith("--", i)) {
      const fim = texto.indexOf("\n", i);
      i = fim < 0 ? texto.length : fim + 1;
    } else if (texto.startsWith("/*", i)) {
      const fim = texto.indexOf("*/", i + 2);
      i = fim < 0 ? texto.length : fim + 2;
    } else {
      return i;
    }
  }
}

function linhaEm(texto, pos) {
  let linha = 1;
  for (let i = 0; i < pos; i++) if (texto[i] === "\n") linha++;
  return linha;
}

function celula(valor) {
  if (valor === null) return "NULL";
  if (valor instanceof Uint8Array) {
    return `x'${Buffer.from(valor).toString("hex")}'`;
  }
  return String(valor);
}

let blocosImpressos = 0;

function imprimirResultado(stmt, colunas) {
  // O bloco inteiro e montado antes de imprimir: um resultado que estoura o
  // teto nao deixa metade dele no stdout.
  const linhas = [colunas.map((c) => c.name).join(" | ")];
  let registros = 0;
  for (const registro of stmt.iterate()) {
    if (++registros > MAX_REGISTROS) {
      throw new ErroDoTrecho(
        "SQLITE_TOOBIG",
        `resultado com mais de ${MAX_REGISTROS} linhas`,
      );
    }
    linhas.push(registro.map(celula).join(" | "));
  }
  if (blocosImpressos > 0) process.stdout.write("\n");
  process.stdout.write(`${linhas.join("\n")}\n`);
  blocosImpressos++;
}

// Divisao em instrucoes pelo PROPRIO SQLite, e nao por um divisor escrito
// aqui: o prepare compila so a primeira instrucao do texto, e `sourceSQL`
// devolve exatamente o texto dela. O resto e o que sobra depois dele. Aspas,
// identificadores, colchetes, crases e comentarios sao do tokenizer do SQLite,
// que e quem decide de verdade onde uma instrucao termina.
function executarTexto(texto, nome, imprimir) {
  let pos = 0;
  for (;;) {
    const inicio = pularBrancosEComentarios(texto, pos);
    if (inicio >= texto.length) return;
    const linha = linhaEm(texto, inicio);
    try {
      proibido = null;
      let stmt;
      try {
        stmt = db.prepare(texto.slice(inicio));
      } catch (erro) {
        if (proibido) {
          throw new ErroDoTrecho(
            "SQLITE_AUTH",
            `${proibido} nao e permitido no trecho`,
          );
        }
        throw erro;
      }
      const sql = stmt.sourceSQL;
      if (!sql || !texto.startsWith(sql, inicio)) {
        throw new Error(
          `[runSqlSnippet] sourceSQL nao e prefixo do texto na linha ${linha}`,
        );
      }
      // VACUUM INTO grava arquivo e NAO passa pelo autorizador (medido no
      // Node 24.13: nenhuma chamada), entao este e o unico caso decidido pelo
      // texto. O texto e o da instrucao isolada e comeca na primeira palavra.
      if (/^VACUUM\b/i.test(sql) && /\bINTO\b/i.test(sql)) {
        throw new ErroDoTrecho(
          "SQLITE_AUTH",
          "VACUUM INTO nao e permitido no trecho",
        );
      }
      const colunas = stmt.columns();
      if (colunas.length === 0 || !imprimir) {
        stmt.run();
      } else {
        stmt.setReturnArrays(true);
        stmt.setReadBigInts(true);
        imprimirResultado(stmt, colunas);
      }
      pos = inicio + sql.length;
    } catch (erro) {
      const codigo = codigoPrimario(erro);
      // O nome da base entra TAMBEM no texto, como no wrapper de ts:
      // erroDoStderr descarta o prefixo, e sem isto a pessoa leria o erro e
      // procuraria no bloco da licao, que esta certo.
      const ondeEsta = nome === NOME_DA_BASE ? `em ${NOME_DA_BASE}: ` : "";
      process.stderr.write(
        `${nome}:${linha}: error ${codigo}: ${ondeEsta}${erro.message}\n`,
      );
      process.exit(1);
    }
  }
}

// A base nao imprime nada: ela prepara o banco, e a saida do bloco e so a do
// trecho.
const base = path.join(path.dirname(arquivo), NOME_DA_BASE);
if (path.basename(arquivo) !== NOME_DA_BASE && existsSync(base)) {
  executarTexto(readFileSync(base, "utf8"), NOME_DA_BASE, false);
}
executarTexto(readFileSync(arquivo, "utf8"), path.basename(arquivo), true);
