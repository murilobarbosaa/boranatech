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
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INICIO = Date.now();
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

// Lote 10b: o diagnostico vale para QUALQUER arquivo do diretorio do trecho, e
// nao so para o executado. Antes, erro de tipo no PRIMEIRO arquivo de um grupo
// `arquivo=` passava calado, que e a classe "verificador que falha passando".
// Ficam de fora a declaracao ambiente (escrita aqui, nao pelo autor) e as libs
// do TypeScript, que moram em node_modules e ja caem fora do diretorio.
//
// O diretorio do executor de trecho unico e reutilizado (q0.ts, q1.ts, ...),
// mas isso nao contamina nada: as raizes do programa sao [arquivo, ambiente],
// e um q anterior nao e importado por ninguem, entao nem entra no programa.
const dirDoTrecho = path.resolve(path.dirname(arquivo));
const executado = path.resolve(arquivo);
const ambienteResolvido = path.resolve(ambiente);

const diagnosticos = ts.getPreEmitDiagnostics(programa).filter((d) => {
  if (!d.file) return false;
  const alvo = path.resolve(d.file.fileName);
  return path.dirname(alvo) === dirDoTrecho && alvo !== ambienteResolvido;
});

if (diagnosticos.length > 0) {
  for (const d of diagnosticos) {
    const alvo = path.resolve(d.file.fileName);
    const nome = path.basename(alvo);
    const { line, character } = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
    const texto = ts.flattenDiagnosticMessageText(d.messageText, " ");
    // O nome entra TAMBEM no texto quando o erro nao e do arquivo executado:
    // erroDoStderr descarta o prefixo (ERRO_TS_RE devolve so codigo e texto),
    // entao sem isto a pessoa leria "TS2322" e procuraria no arquivo errado.
    // Trecho de arquivo unico fica byte a byte como antes: ali nao ha prefixo.
    const ondeEsta = alvo === executado ? "" : `em ${nome}: `;
    // Formato com arquivo, linha e coluna: e o que erroDoStderr e linhaDoErro
    // leem para a tabela de revisao.
    console.error(
      `${nome}(${line + 1},${character + 1}): error TS${d.code}: ${ondeEsta}${texto}`,
    );
  }
  process.exit(1);
}

// Lote de higiene: ESTE wrapper e dono da arvore de processos que cria.
//
// O defeito: o executor chama spawnSync com timeout, e no estouro o Node manda
// o sinal so para o FILHO DIRETO, que aqui e este wrapper. O trecho roda num
// neto (wrapper -> cli do tsx -> processo do trecho), entao o neto era adotado
// pelo init e girava a 100% de CPU para sempre. Medido: cada rodada de
// runTsSnippet.test.ts deixava dois processos vivos, e o hook roda a suite
// duas vezes por commit. Nas outras linguagens o trecho e filho direto e morre
// junto, por isso so ts deixava orfao.
//
// O conserto: `detached: true` poe o trecho num GRUPO de processos proprio, e
// o wrapper mata o grupo inteiro (process.kill(-pid)) em tres situacoes, sem
// deixar nenhum caminho de saida com o grupo vivo.
const tsxCli = req.resolve("tsx/cli");

// Abaixo do TIMEOUT_MS do executor (10000) de proposito, e contado do inicio
// deste processo: o wrapper precisa matar o trecho e sair ANTES de o executor
// matar o wrapper, senao nao sobra ninguem para limpar o neto, que e o defeito
// que este arquivo existe para nao ter.
const PRAZO_MS = 8000;

const filho = spawn(process.execPath, [tsxCli, arquivo], {
  stdio: "inherit",
  // Nada e acrescentado ao ambiente: o filho herda o ambiente ja saneado que o
  // executor montou (PATH, HOME no diretorio temporario, LANG), sem process.env
  // do repositorio.
  env: process.env,
  // Grupo proprio: sem isto, matar o filho direto deixa o neto vivo.
  detached: true,
});

// filhoVivo e a protecao mais importante daqui, e nao o grupoMorto. Quando o
// trecho termina sozinho, o PID dele e liberado e o sistema pode REAPROVEITA-LO
// em outro processo; mandar SIGKILL para -pid depois disso mata o grupo de um
// processo alheio, possivelmente o do proprio shell que roda a suite. Foi o que
// aconteceu: mortes abruptas com status 144, sem log e sem OOM, em primeiro e
// em segundo plano, porque `process.on("exit", matarGrupo)` matava mesmo no
// caminho em que o filho ja tinha saido limpo. O grupoMorto so evita matar
// duas vezes, que e outro problema, bem menor.
let grupoMorto = false;
let filhoVivo = true;
function matarGrupo() {
  if (!filhoVivo || grupoMorto || filho.pid === undefined) return;
  grupoMorto = true;
  try {
    process.kill(-filho.pid, "SIGKILL");
  } catch {
    // Grupo ja encerrado: nada a fazer.
  }
}

let esperaDoSinal = null;

function sair(status) {
  clearTimeout(prazo);
  if (esperaDoSinal) clearInterval(esperaDoSinal);
  matarGrupo();
  process.exit(status);
}

// No estouro do prazo o wrapper mata o grupo e NAO sai. Parece contraintuitivo
// e e o ponto todo: o executor precisa ver o PROPRIO timeout (ETIMEDOUT do
// spawnSync) para devolver timeout: true, e um trecho de pergunta que estoura
// e reprovado por esse campo. Como o grupo ja morreu aqui, esperar os poucos
// segundos que faltam nao deixa nada vivo; o SIGTERM do executor chega logo
// depois e o handler abaixo encerra o wrapper. Sair aqui quebrava o contrato:
// medido, os dois controles de laco infinito passaram a falhar porque o
// spawnSync retornava normalmente aos 8 s, sem ETIMEDOUT.
let prazoEstourou = false;
const prazo = setTimeout(
  () => {
    prazoEstourou = true;
    matarGrupo();
    // Segura o loop de eventos ABERTO ate o sinal do executor chegar. Sem
    // este handle pendente o Node encerra sozinho assim que o filho morre,
    // mesmo com a saida explicita bloqueada, e o executor ve o wrapper
    // terminar antes do proprio timeout. Medido: 8055 ms com timeout false,
    // contra os 10000 ms que o campo timeout exige.
    esperaDoSinal = setInterval(() => {}, 1000);
  },
  PRAZO_MS - (Date.now() - INICIO),
);

// So funciona porque a espera agora e assincrona: um wrapper bloqueado em
// spawnSync nao roda handler de sinal nenhum, que era metade do defeito.
process.on("SIGTERM", () => sair(1));
process.on("SIGINT", () => sair(1));
// Rede de seguranca: nenhum caminho de saida deixa o grupo vivo.
process.on("exit", matarGrupo);

filho.on("error", (erro) => {
  console.error(String(erro));
  sair(1);
});

filho.on("exit", (status, sinal) => {
  // Marcado ANTES de qualquer outra coisa: a partir daqui o PID do filho pode
  // ser reaproveitado pelo sistema, e nenhum caminho de saida pode mandar
  // sinal para ele.
  filhoVivo = false;
  // Depois do prazo, a morte do filho foi causada por mim: nao encerro o
  // wrapper por ela, senao o executor nao chega a cronometrar o proprio
  // timeout e o campo timeout volta a sair false.
  if (prazoEstourou) return;
  clearTimeout(prazo);
  process.exit(sinal ? 1 : (status ?? 1));
});
