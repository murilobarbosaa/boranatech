// Runner de TypeScript em duas etapas (Lote 10a):
//   node scripts/runTsSnippet.mjs <arquivo.ts>
//
// 1. CHECAGEM DE TIPOS com a API do typescript. O tsx sozinho nao serve como
//    runner de TS: ele so REMOVE os tipos, nao os confere, e deixaria passar
//    exatamente o defeito que uma pergunta de "erro" de TypeScript mais cobra.
// 2. Sem erro de tipo, EXECUCAO com o tsx, resolvido pelo caminho absoluto do
//    pacote no repositorio: o executor roda com cwd num diretorio temporario,
//    onde node_modules nao existe.
//
// POR QUE .mjs E NAO .mts: o runner declarado em languageCapabilities chama
// `node` sem loader nenhum. Um wrapper .mts exigiria subir o tsx so para
// carregar o wrapper, e depois o tsx de novo para o trecho: dois bootstraps
// (~200 ms cada) por trecho, numa pool de 45 perguntas com ate 4 execucoes
// cada. Em .mjs o node carrega direto.
//
// A lib `dom` fica DE FORA de proposito: ela declara globais como `name` e
// `status`, que escondem erro de variavel nao declarada (`console.log(name)`
// passaria calado). O `console` entra por uma declaracao ambiente minima
// escrita aqui, ao lado do trecho.
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
// Resolve typescript e tsx pelo package.json do REPOSITORIO: o processo roda
// com cwd no diretorio temporario do executor, sem node_modules.
const req = createRequire(path.join(aqui, "..", "package.json"));

const arquivo = process.argv[2];
if (!arquivo) {
  console.error("Uso: node scripts/runTsSnippet.mjs <arquivo.ts>");
  process.exit(2);
}

const ts = req("typescript");

// Declaracao ambiente minima, ao lado do trecho: so o console. Qualquer outro
// global (process, fetch, window) continua sendo erro de tipo, que e o
// comportamento desejado num trecho de licao autocontido.
const ambiente = path.join(path.dirname(arquivo), "__ambiente.d.ts");
writeFileSync(
  ambiente,
  "declare var console: {\n" +
    "  log(...dados: unknown[]): void;\n" +
    "  error(...dados: unknown[]): void;\n" +
    "  warn(...dados: unknown[]): void;\n" +
    "};\n",
);

const programa = ts.createProgram([arquivo, ambiente], {
  strict: true,
  noEmit: true,
  target: ts.ScriptTarget.ES2022,
  lib: ["lib.es2022.d.ts"],
  // Cada trecho e um modulo: sem isto, um `const nome` no topo colide com
  // declaracao global e o diagnostico sai por outro motivo.
  moduleDetection: ts.ModuleDetectionKind.Force,
  // Sem @types/node e sem nenhum pacote de tipos do repositorio.
  types: [],
});

const diagnosticos = ts
  .getPreEmitDiagnostics(programa)
  .filter((d) => d.file && path.resolve(d.file.fileName) === path.resolve(arquivo));

if (diagnosticos.length > 0) {
  const nome = path.basename(arquivo);
  for (const d of diagnosticos) {
    const { line, character } = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
    const texto = ts.flattenDiagnosticMessageText(d.messageText, " ");
    // Formato com arquivo, linha e coluna: e o que erroDoStderr e linhaDoErro
    // leem para a tabela de revisao.
    console.error(`${nome}(${line + 1},${character + 1}): error TS${d.code}: ${texto}`);
  }
  process.exit(1);
}

const tsxCli = req.resolve("tsx/cli");
const execucao = spawnSync(process.execPath, [tsxCli, arquivo], {
  stdio: "inherit",
  // Nada e acrescentado ao ambiente: o filho herda o ambiente ja saneado que o
  // executor montou (PATH, HOME no diretorio temporario, LANG), sem process.env
  // do repositorio.
  env: process.env,
});

if (execucao.error) {
  console.error(String(execucao.error));
  process.exit(1);
}
if (execucao.signal) process.exit(1);
process.exit(execucao.status ?? 1);
