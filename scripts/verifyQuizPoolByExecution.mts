// Confere por EXECUCAO as perguntas de codigo de um pool de trilha:
//   pnpm verify:quiz-pool <slug>
// saida: roda o trecho e compara o stdout com a alternativa correta; acusa
//   tambem alternativa errada igual ao stdout (duas respostas certas).
// completar: a correta na lacuna roda sem lancar; cada errada na lacuna e
//   acusada se roda sem erro E produz stdout identico ao da correta.
// erro: executa e imprime o resultado como LER, sem veredito automatico.
// Trecho que estoura 10 s e CORRIGIR. Linguagem sem runner (nem js nem
// python) sai como SEM RUNNER e nao reprova. Exit 1 se houver CORRIGIR.
// As funcoes puras ficam separadas das de execucao (spawn), como em
// generateQuizPool.mts, e o main so roda quando o arquivo e o script
// executado, para o teste importar os puros sem disparar nada.
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { roadmapQuizPools } from "../server/data/roadmapQuizzes";
import {
  CODE_PLACEHOLDER,
  isCodeQuestion,
  type QuizAlternativaId,
  type QuizQuestion,
} from "../shared/roadmapQuiz/types";
import { roadmapsV2 } from "../shared/roadmapV2/content";

const TIMEOUT_MS = 10000;
const ALTERNATIVAS: QuizAlternativaId[] = ["a", "b", "c", "d"];

export interface Runner {
  command: string;
  ext: string;
}

// ---------- puros ----------

export function runnerFor(linguagem: string): Runner | null {
  if (linguagem === "js") return { command: "node", ext: ".mjs" };
  if (linguagem === "python") return { command: "python3", ext: ".py" };
  return null;
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

// ---------- execucao ----------

interface Execucao {
  status: number | null;
  stdout: string;
  erro: string;
  timeout: boolean;
}

function makeExecutor(runner: Runner) {
  const dir = mkdtempSync(path.join(tmpdir(), "verify-pool-"));
  let n = 0;
  return (code: string): Execucao => {
    const file = path.join(dir, `q${n++}${runner.ext}`);
    writeFileSync(file, code);
    const r = spawnSync(runner.command, [file], {
      encoding: "utf8",
      timeout: TIMEOUT_MS,
    });
    const stderr = r.stderr ?? "";
    const erro =
      stderr.split("\n").find((line) => /error/i.test(line)) ??
      stderr.trim().split("\n")[0] ??
      "";
    return {
      status: r.status,
      stdout: r.stdout ?? "",
      erro,
      timeout: r.error?.name === "Error" && /ETIMEDOUT/.test(String(r.error)),
    };
  };
}

type Veredito = "OK" | "CORRIGIR" | "LER" | "SEM RUNNER";

interface Linha {
  id: string;
  tipo: string;
  fonte: string;
  resultado: string;
  veredito: Veredito;
}

function conferir(
  question: QuizQuestion,
  executar: (code: string) => Execucao,
): Linha {
  const base = {
    id: question.id,
    tipo: question.tipo ?? "",
    fonte: question.fonte,
  };
  const codigo = question.codigo;
  if (!codigo) {
    return { ...base, resultado: "sem codigo", veredito: "CORRIGIR" };
  }
  const correta = question.alternativas[question.correta];
  if (question.tipo === "saida") {
    const r = executar(codigo.trecho);
    if (r.timeout)
      return { ...base, resultado: "estourou o timeout", veredito: "CORRIGIR" };
    if (r.status !== 0) {
      return { ...base, resultado: `lancou: ${r.erro}`, veredito: "CORRIGIR" };
    }
    const bate = stdoutMatches(r.stdout, correta);
    const duplas = ALTERNATIVAS.filter(
      (alt) =>
        alt !== question.correta &&
        stdoutMatches(r.stdout, question.alternativas[alt]),
    );
    const resultado = `obtido=${JSON.stringify(normalizeStdout(r.stdout))} correta=${JSON.stringify(correta)}${duplas.length ? ` | erradas iguais ao stdout: ${duplas.join(", ")}` : ""}`;
    return {
      ...base,
      resultado,
      veredito: bate && duplas.length === 0 ? "OK" : "CORRIGIR",
    };
  }
  if (question.tipo === "completar") {
    const certo = executar(fillGap(codigo.trecho, correta));
    if (certo.timeout)
      return { ...base, resultado: "estourou o timeout", veredito: "CORRIGIR" };
    if (certo.status !== 0) {
      return {
        ...base,
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
      ...base,
      resultado,
      veredito: equivalentes.length === 0 ? "OK" : "CORRIGIR",
    };
  }
  const r = executar(codigo.trecho);
  const resultado = r.timeout
    ? "estourou o timeout"
    : r.status !== 0
      ? `lanca: ${r.erro} | correta=${JSON.stringify(correta)}`
      : `roda, stdout=${JSON.stringify(normalizeStdout(r.stdout))} | correta=${JSON.stringify(correta)}`;
  return { ...base, resultado, veredito: r.timeout ? "CORRIGIR" : "LER" };
}

function main() {
  const slug = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  if (!slug) {
    console.error("Uso: pnpm verify:quiz-pool <slug>");
    process.exit(1);
  }
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
  const executores = new Map<string, (code: string) => Execucao>();
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
  for (const l of linhas) {
    console.log(
      `${l.id} | ${l.tipo} | ${l.fonte} | ${l.resultado} | ${l.veredito}`,
    );
  }
  const conta = (v: Veredito) => linhas.filter((l) => l.veredito === v).length;
  console.log(
    `\nperguntas de codigo: ${linhas.length} | CORRIGIR: ${conta("CORRIGIR")} | LER: ${conta("LER")}${conta("SEM RUNNER") ? ` | SEM RUNNER: ${conta("SEM RUNNER")}` : ""}`,
  );
  if (conta("CORRIGIR") > 0) process.exit(1);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
