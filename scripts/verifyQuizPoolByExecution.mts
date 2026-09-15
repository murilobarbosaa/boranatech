// Confere por EXECUCAO as perguntas de codigo de um pool de trilha:
//   pnpm verify:quiz-pool <slug> [--tabela-revisao]
// saida: roda o trecho e compara o stdout com a alternativa correta; acusa
//   tambem alternativa errada igual ao stdout (duas respostas certas).
// completar: a correta na lacuna roda sem lancar; cada errada na lacuna e
//   acusada se roda sem erro E produz stdout identico ao da correta.
// erro: com codigo.saidaEsperada, executa e compara: trecho que roda limpo
//   (exit 0) e imprime exatamente a saida esperada NAO tem defeito, e sai
//   CORRIGIR; trecho que lanca ou diverge sai OK. Sem saidaEsperada (pool
//   anterior ao campo) continua LER, leitura humana.
// Trecho que estoura 10 s e CORRIGIR. Linguagem sem runner (nem js nem
// python) sai como SEM RUNNER e nao reprova. Exit 1 se houver CORRIGIR.
// As funcoes puras ficam separadas das de execucao (spawn), como em
// generateQuizPool.mts, e o main so roda quando o arquivo e o script
// executado, para o teste importar os puros sem disparar nada. A parte
// reutilizavel (makeExecutor, conferirCodigo) e o que o gerador chama dentro
// do retry (execViolations em quizPoolGeneration.mts); o registry de pools e
// o agregado de trilhas so sao importados dentro do main, para o gerador nao
// carregar todas as pools ao importar este modulo.
//
// ISOLAMENTO: o trecho executado e codigo escrito por um modelo, entao o
// spawn roda com cwd no diretorio temporario do executor, com ambiente
// montado do zero (sem os segredos do .env que o gerador carregou), com
// entrada vazia e com teto de saida. O que isso NAO cobre: acesso a rede,
// escrita fora do cwd por caminho absoluto e consumo de CPU dentro do
// timeout. Trecho de trilha e codigo didatico curto e o portao real continua
// sendo a revisao humana da pool; cwd e env fecham o acidente que aconteceu
// no Lote 06, em que um trecho gravou um arquivo na raiz do repositorio.
//
// --tabela-revisao: depois do relatorio, imprime a tabela da revisao humana
// (tabelaRevisao), uma linha por pergunta de codigo.
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  CODE_PLACEHOLDER,
  isCodeQuestion,
  type QuizAlternativaId,
  type QuizQuestion,
} from "../shared/roadmapQuiz/types";

import {
  avisoSemRunner,
  capabilityOf,
  type Runner,
} from "./languageCapabilities.mts";
import { estruturaHtml } from "./htmlStructure.mts";

const TIMEOUT_MS = 10000;
const ALTERNATIVAS: QuizAlternativaId[] = ["a", "b", "c", "d"];

export type { Runner };

// ---------- puros ----------

// Runner lido de LANGUAGE_CAPABILITIES: null quando a linguagem nao executa
// aqui; linguagem fora do mapa lanca, porque e erro de configuracao.
export function runnerFor(linguagem: string): Runner | null {
  return capabilityOf(linguagem).runner;
}

// Quebras normalizadas para \n, espacos das pontas de cada linha e do todo
// removidos: e o que se compara com o texto da alternativa.
export function normalizeStdout(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

export function stdoutMatches(stdout: string, alternativa: string): boolean {
  return normalizeStdout(stdout) === normalizeStdout(alternativa);
}

export function fillGap(trecho: string, alternativa: string): string {
  return trecho.replace(CODE_PLACEHOLDER, alternativa);
}

// Linha de erro do stderr: a ULTIMA que comeca com um nome de erro
// (SyntaxError, TypeError, Error [ERR_...]) ou contem "Error:", porque o Node
// imprime antes dela a linha de codigo de origem, que pode conter a palavra
// Error (new Error('...')) e era o que a versao anterior devolvia. Sem
// nenhuma, a primeira linha nao vazia.
export function erroDoStderr(stderr: string): string {
  const linhas = stderr.split("\n");
  const deErro = linhas.filter(
    (linha) => /^\s*\w*Error\b/.test(linha) || linha.includes("Error:"),
  );
  if (deErro.length > 0) return deErro[deErro.length - 1].trim();
  return linhas.find((linha) => linha.trim().length > 0)?.trim() ?? "";
}

// ---------- execucao ----------

export interface Execucao {
  status: number | null;
  stdout: string;
  erro: string;
  timeout: boolean;
  // Stderr bruto e sinal de saida: so para a leitura humana (excecaoObservada
  // tira dali o numero da linha). Opcionais para os stubs de teste.
  stderr?: string;
  sinal?: string | null;
}

export type Executor = (code: string) => Execucao;

export function makeExecutor(runner: Runner): Executor {
  const dir = mkdtempSync(path.join(tmpdir(), "verify-pool-"));
  let n = 0;
  return (code: string): Execucao => {
    const file = path.join(dir, `q${n++}${runner.ext}`);
    writeFileSync(file, code);
    const r = spawnSync(runner.command, [file], {
      encoding: "utf8",
      timeout: TIMEOUT_MS,
      // cwd no diretorio do executor: um trecho com open(...,'w') grava aqui
      // dentro, nao no repositorio. Sem isso, uma pergunta gerada no Lote 06
      // criou usuario.json na raiz do worktree.
      cwd: dir,
      // Ambiente montado do zero, nunca process.env: o gerador carrega o .env
      // (OPENAI_API_KEY, SUPABASE_*, REDIS_URL, STRIPE_*) e o trecho e codigo
      // escrito por um modelo. HOME aponta para o proprio dir, entao cache e
      // arquivo de configuracao do runner tambem ficam contidos.
      env: {
        PATH: process.env.PATH ?? "/usr/bin:/bin",
        HOME: dir,
        LANG: process.env.LANG ?? "C.UTF-8",
        PYTHONIOENCODING: "utf-8",
      },
      // Entrada vazia e fechada: trecho com input() falha na hora em vez de
      // segurar o processo ate o timeout.
      input: "",
      // Teto de saida: laco que imprime sem parar morre aqui, nao na memoria
      // do processo do gerador.
      maxBuffer: 1024 * 1024,
    });
    return {
      status: r.status,
      stdout: r.stdout ?? "",
      erro: erroDoStderr(r.stderr ?? ""),
      timeout: r.error?.name === "Error" && /ETIMEDOUT/.test(String(r.error)),
      stderr: r.stderr ?? "",
      sinal: r.signal ?? null,
    };
  };
}

export interface Conferencia {
  veredito: "OK" | "CORRIGIR" | "LER";
  resultado: string;
}

// Conferencia de UMA pergunta de codigo por execucao. Pura em relacao ao
// executor recebido (o teste passa um stub), e e o que o gerador chama dentro
// do retry.
export function conferirCodigo(
  question: Pick<QuizQuestion, "tipo" | "codigo" | "alternativas" | "correta">,
  executar: Executor,
): Conferencia {
  const codigo = question.codigo;
  if (!codigo) {
    return { resultado: "sem codigo", veredito: "CORRIGIR" };
  }
  const correta = question.alternativas[question.correta];
  if (question.tipo === "saida") {
    const r = executar(codigo.trecho);
    if (r.timeout)
      return { resultado: "estourou o timeout", veredito: "CORRIGIR" };
    if (r.status !== 0) {
      return { resultado: `lancou: ${r.erro}`, veredito: "CORRIGIR" };
    }
    const bate = stdoutMatches(r.stdout, correta);
    const duplas = ALTERNATIVAS.filter(
      (alt) =>
        alt !== question.correta &&
        stdoutMatches(r.stdout, question.alternativas[alt]),
    );
    const resultado = `obtido=${JSON.stringify(normalizeStdout(r.stdout))} correta=${JSON.stringify(correta)}${duplas.length ? ` | erradas iguais ao stdout: ${duplas.join(", ")}` : ""}`;
    return {
      resultado,
      veredito: bate && duplas.length === 0 ? "OK" : "CORRIGIR",
    };
  }
  if (question.tipo === "completar") {
    const certo = executar(fillGap(codigo.trecho, correta));
    if (certo.timeout)
      return { resultado: "estourou o timeout", veredito: "CORRIGIR" };
    if (certo.status !== 0) {
      return {
        resultado: `correta na lacuna lanca: ${certo.erro}`,
        veredito: "CORRIGIR",
      };
    }
    const equivalentes = ALTERNATIVAS.filter((alt) => {
      if (alt === question.correta) return false;
      const r = executar(fillGap(codigo.trecho, question.alternativas[alt]));
      return (
        !r.timeout &&
        r.status === 0 &&
        normalizeStdout(r.stdout) === normalizeStdout(certo.stdout)
      );
    });
    const resultado = `correta roda (stdout=${JSON.stringify(normalizeStdout(certo.stdout))})${equivalentes.length ? ` | distratores equivalentes: ${equivalentes.join(", ")}` : ""}`;
    return {
      resultado,
      veredito: equivalentes.length === 0 ? "OK" : "CORRIGIR",
    };
  }
  // erro
  const r = executar(codigo.trecho);
  if (r.timeout)
    return { resultado: "estourou o timeout", veredito: "CORRIGIR" };
  const observado =
    r.status !== 0
      ? `lanca: ${r.erro}`
      : `roda, stdout=${JSON.stringify(normalizeStdout(r.stdout))}`;
  const { saidaEsperada } = codigo;
  if (saidaEsperada === undefined) {
    return {
      resultado: `${observado} | correta=${JSON.stringify(correta)}`,
      veredito: "LER",
    };
  }
  if (r.status === 0 && stdoutMatches(r.stdout, saidaEsperada)) {
    return {
      resultado: `erro sem defeito: roda limpo e imprime a saida esperada (${JSON.stringify(normalizeStdout(r.stdout))})`,
      veredito: "CORRIGIR",
    };
  }
  return {
    resultado: `${observado} | esperado=${JSON.stringify(normalizeStdout(saidaEsperada))} | correta=${JSON.stringify(correta)}`,
    veredito: "OK",
  };
}

// Linha do trecho onde a execucao quebrou: em Python, o ultimo frame DO
// PROPRIO TRECHO no traceback; em Node, o primeiro `arquivo.mjs:N`, que e
// onde lancou. Sem nenhum, null. O primeiro frame do traceback e sempre o do
// trecho executado; a excecao pode nascer mais fundo, dentro da biblioteca
// padrao, e a versao anterior devolvia a linha de la (python-int-14 saiu com
// "linha 353", de json/decoder.py, no Lote 06g).
export function linhaDoErro(stderr: string): number | null {
  const py = [...stderr.matchAll(/File "([^"]*\.py)", line (\d+)/g)];
  if (py.length > 0) {
    const doTrecho = py.filter((m) => m[1] === py[0][1]);
    return Number(doTrecho[doTrecho.length - 1][2]);
  }
  const js = /\.mjs:(\d+)/.exec(stderr);
  return js ? Number(js[1]) : null;
}

// O que a execucao de uma pergunta de erro OBSERVOU: a excecao (ou o sinal
// de saida) e a linha. Instrumento de LEITURA, nao portao. O portao confere
// que o codigo quebra; SE ele quebra pelo motivo que a alternativa correta
// descreve e conferencia semantica, e instrumento nao deve fingir o que nao
// faz. A linha existe para a leitura humana levar segundos: foi a falta dela
// que deixou passar a python-int-14 do Lote 06f, cujo trecho quebrava com
// SyntaxError enquanto a correta falava em JSON malformado.
export function excecaoObservada(
  question: Pick<QuizQuestion, "tipo" | "codigo">,
  executar: Executor,
): string | null {
  if (question.tipo !== "erro" || !question.codigo) return null;
  const r = executar(question.codigo.trecho);
  if (r.timeout) return "estourou o timeout";
  if (r.status === 0) {
    return `roda limpo, stdout=${JSON.stringify(normalizeStdout(r.stdout))}`;
  }
  if (r.status === null) {
    return `encerrado pelo sinal ${r.sinal ?? "desconhecido"}`;
  }
  const erro = r.erro || `saiu com status ${r.status}`;
  const linha = linhaDoErro(r.stderr ?? "");
  return linha !== null ? `${erro} (linha ${linha})` : erro;
}

type Veredito = Conferencia["veredito"] | "SEM RUNNER";

export interface Linha {
  id: string;
  tipo: string;
  fonte: string;
  linguagem: string;
  resultado: string;
  veredito: Veredito;
  // So em pergunta de erro: ver excecaoObservada.
  observado?: string | null;
}

function conferir(question: QuizQuestion, executar: Executor): Linha {
  return {
    id: question.id,
    tipo: question.tipo ?? "",
    fonte: question.fonte,
    linguagem: question.codigo?.linguagem ?? "",
    ...conferirCodigo(question, executar),
    observado: excecaoObservada(question, executar),
  };
}

// Saida do verify:quiz-pool, pura para o teste ler. O instrumento diz o que
// fez e o que NAO fez: pergunta de linguagem sem runner sai marcada
// nao-executado no lugar da linha observado, e o resumo repete, por
// linguagem, o aviso de revisao humana obrigatoria. Para trilha que executa
// tudo (js, python), as linhas sao as de sempre.
export function relatorioVerificacao(linhas: Linha[]): string[] {
  const out: string[] = [];
  for (const l of linhas) {
    out.push(
      `${l.id} | ${l.tipo} | ${l.fonte} | ${l.resultado} | ${l.veredito}`,
    );
    if (l.veredito === "SEM RUNNER") {
      out.push(`${l.id}  ${l.tipo}  nao-executado`);
    } else if (l.observado) {
      out.push(`${l.id}  ${l.tipo}  observado: ${l.observado}`);
    }
  }
  const conta = (v: Veredito) => linhas.filter((l) => l.veredito === v).length;
  out.push(
    `\nperguntas de codigo: ${linhas.length} | CORRIGIR: ${conta("CORRIGIR")} | LER: ${conta("LER")}${conta("SEM RUNNER") ? ` | SEM RUNNER: ${conta("SEM RUNNER")}` : ""}`,
  );
  const semRunner = new Map<string, number>();
  linhas.forEach((l) => {
    if (l.veredito !== "SEM RUNNER") return;
    semRunner.set(l.linguagem, (semRunner.get(l.linguagem) ?? 0) + 1);
  });
  semRunner.forEach((trechos, linguagem) =>
    out.push(`[aviso] ${avisoSemRunner(linguagem, trechos)}`),
  );
  return out;
}

// Resumo da alternativa correta para a tabela de revisao: uma linha so
// (quebras e espacos repetidos viram um espaco) e no maximo 60 caracteres,
// cortado com "..." quando passa.
export function resumoCorreta(texto: string): string {
  const linha = texto.replace(/\s+/g, " ").trim();
  return linha.length <= 60 ? linha : `${linha.slice(0, 57)}...`;
}

// Coluna estrutural da tabela (Lote 08): em html, o que o verificador de
// marcacao diz do trecho. Em "erro", roda sobre o trecho como esta: "limpo"
// nao invalida a pergunta (o defeito pode ser semantico, como alt ausente ou
// hierarquia de titulos pulada), mas a tabela humana passa a exigir essa
// justificativa. Em "completar", roda com a correta na lacuna (precisa sair
// limpo) e conta quantas das erradas tambem saem limpas, informacao para quem
// revisa. Linguagem sem verificador estrutural fica com "-".
function estruturaDaPergunta(question: QuizQuestion): string {
  const codigo = question.codigo;
  if (!codigo || codigo.linguagem !== "html") return "-";
  const avaliar = (texto: string) => {
    const problemas = estruturaHtml(texto);
    return problemas.length === 0 ? "limpo" : `acusa: ${problemas[0]}`;
  };
  if (question.tipo !== "completar") return avaliar(codigo.trecho);
  const comCorreta = avaliar(
    fillGap(codigo.trecho, question.alternativas[question.correta]),
  );
  const erradasLimpas = ALTERNATIVAS.filter(
    (alt) =>
      alt !== question.correta &&
      estruturaHtml(fillGap(codigo.trecho, question.alternativas[alt]))
        .length === 0,
  ).length;
  return `${comCorreta} (erradas limpas: ${erradasLimpas}/3)`;
}

// Tabela da revisao humana obrigatoria (Lote 07, licao do 2c do Lote 06g:
// 4 de 8 perguntas de erro de Python aprovadas pelo portao estavam
// semanticamente erradas, e so a leitura lado a lado pegou). Uma linha por
// pergunta de codigo, nenhuma para conceito: id | tipo | linguagem |
// executado ou nao-executado | estrutura (ver estruturaDaPergunta) | resumo
// da correta. "executado" vem da
// capacidade da linguagem (tem runner), a mesma leitura que decide o SEM
// RUNNER do relatorio; linguagem fora do mapa lanca, como em runnerFor.
export function tabelaRevisao(questions: QuizQuestion[]): string[] {
  return questions.filter(isCodeQuestion).map((question) => {
    const linguagem = question.codigo?.linguagem ?? "";
    const execucao = runnerFor(linguagem) ? "executado" : "nao-executado";
    return `${question.id} | ${question.tipo ?? ""} | ${linguagem} | ${execucao} | ${estruturaDaPergunta(question)} | ${resumoCorreta(question.alternativas[question.correta])}`;
  });
}

async function main() {
  const slug = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  if (!slug) {
    console.error("Uso: pnpm verify:quiz-pool <slug> [--tabela-revisao]");
    process.exit(1);
  }
  const { roadmapQuizPools } = await import("../server/data/roadmapQuizzes");
  const { roadmapsV2 } = await import("../shared/roadmapV2/content");
  const pool = roadmapQuizPools[slug];
  const roadmap = roadmapsV2.find((entry) => entry.slug === slug);
  if (!pool || !roadmap) {
    console.error(`[verify:quiz-pool] pool ou trilha "${slug}" nao existe.`);
    process.exit(1);
  }
  if (!roadmap.codeLanguages || roadmap.codeLanguages.length === 0) {
    console.error(`[verify:quiz-pool] trilha "${slug}" nao tem codeLanguages.`);
    process.exit(1);
  }
  const executores = new Map<string, Executor>();
  const linhas: Linha[] = [];
  for (const question of pool.questions) {
    if (!isCodeQuestion(question)) continue;
    const linguagem = question.codigo?.linguagem ?? "";
    const runner = runnerFor(linguagem);
    if (!runner) {
      linhas.push({
        id: question.id,
        tipo: question.tipo ?? "",
        fonte: question.fonte,
        linguagem,
        resultado: `linguagem ${linguagem}`,
        veredito: "SEM RUNNER",
      });
      continue;
    }
    let executar = executores.get(linguagem);
    if (!executar) {
      executar = makeExecutor(runner);
      executores.set(linguagem, executar);
    }
    linhas.push(conferir(question, executar));
  }
  for (const linha of relatorioVerificacao(linhas)) console.log(linha);
  if (process.argv.includes("--tabela-revisao")) {
    console.log(
      "\ntabela de revisao humana (id | tipo | linguagem | execucao | estrutura | correta):",
    );
    for (const linha of tabelaRevisao(pool.questions)) console.log(linha);
  }
  if (linhas.some((l) => l.veredito === "CORRIGIR")) process.exit(1);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
