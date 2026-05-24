/**
 * REPL interativo do Natechinho (tool resume-builder).
 * Reusa o systemPrompt canônico de server/lib/aiTools.ts (estado atual do repo).
 * Modelo e temperature iguais aos de produção (gpt-4o-mini, 0.7).
 *
 * Uso:
 *   pnpm tsx scripts/chat-resume-builder.ts
 *
 * Comandos durante a sessão:
 *   /sair   encerra
 *   /reset  zera o histórico e mostra a saudação de novo
 *   /hist   imprime o histórico bruto enviado pra OpenAI no próximo turno
 */

import { config } from "dotenv";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { AI_TOOLS } from "../server/lib/aiTools.ts";

config({ quiet: true });

const tool = AI_TOOLS["resume-builder"];
if (!tool) {
  console.error("resume-builder não encontrado em AI_TOOLS.");
  process.exit(1);
}
const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("OPENAI_API_KEY não definida no .env.");
  process.exit(1);
}

const SYSTEM_PROMPT = tool.systemPrompt;
const MODEL = tool.model;
const TEMPERATURE = tool.temperature;
const MARKER = "[[CURRICULO_READY]]";

const GREETING = [
  "Oi! Sou o Natechinho, mentor de carreira do BoraNaTech. Vou te ajudar a",
  "montar um currículo do zero. Vai ser uma conversa de uns 10 minutinhos",
  "pra eu entender teu momento, e no final tu vai ter um PDF pronto pra",
  "usar onde quiser. Pra gente começar, me conta um pouco sobre você. Em",
  "que momento da carreira tu tá? Tipo, tá estudando ainda, querendo entrar",
  "em TI, ou já trabalhou em alguma coisa na área?",
].join(" ");

const C = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

async function callOpenAI(messages: ChatMessage[]): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: TEMPERATURE,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const out = data.choices?.[0]?.message?.content;
  if (!out) throw new Error("Resposta vazia da OpenAI.");
  return out;
}

function printAssistant(text: string) {
  const hasMarker = text.includes(MARKER);
  stdout.write("\n" + C.cyan(C.bold("Natechinho:")) + "\n");
  stdout.write(text.trimEnd() + "\n");
  if (hasMarker) {
    stdout.write("\n" + C.green(C.bold("(marcador [[CURRICULO_READY]] emitido)")) + "\n");
  }
  stdout.write("\n");
}

function printHelp() {
  stdout.write(C.dim("Comandos: /sair, /reset, /hist\n"));
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  const history: ChatMessage[] = [];

  stdout.write(C.dim(`▶ resume-builder REPL · modelo=${MODEL} · temperature=${TEMPERATURE}\n`));
  printHelp();
  history.push({ role: "assistant", content: GREETING });
  printAssistant(GREETING);

  while (true) {
    let input: string;
    try {
      input = (await rl.question(C.yellow("tu> "))).trim();
    } catch {
      break;
    }
    if (!input) continue;

    if (input === "/sair" || input === "/exit" || input === "/quit") {
      stdout.write(C.dim("Saindo.\n"));
      break;
    }
    if (input === "/reset") {
      history.length = 0;
      history.push({ role: "assistant", content: GREETING });
      stdout.write(C.dim("(histórico zerado)\n"));
      printAssistant(GREETING);
      continue;
    }
    if (input === "/hist") {
      stdout.write(C.dim(`(${history.length} mensagens no histórico)\n`));
      for (const m of history) {
        const who = m.role === "user" ? "tu" : "Natechinho";
        stdout.write(C.dim(`[${who}] ${m.content.slice(0, 120).replace(/\n/g, " ")}${m.content.length > 120 ? "..." : ""}\n`));
      }
      continue;
    }

    history.push({ role: "user", content: input });
    stdout.write(C.dim("(pensando...)\n"));

    let reply: string;
    try {
      reply = await callOpenAI(history);
    } catch (err) {
      stdout.write(C.red(`Erro: ${err instanceof Error ? err.message : String(err)}\n`));
      history.pop();
      continue;
    }
    history.push({ role: "assistant", content: reply });
    printAssistant(reply);
  }

  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
