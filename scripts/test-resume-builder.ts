/**
 * Fase 1C — teste de diagnóstico da tool resume-builder.
 * Roda 8 conversas simuladas contra a OpenAI direto, reusando o systemPrompt
 * canônico de server/lib/aiTools.ts. NÃO modifica o prompt.
 *
 * Uso:
 *   pnpm tsx scripts/test-resume-builder.ts                  (gpt-4o-mini)
 *   pnpm tsx scripts/test-resume-builder.ts --model=gpt-4o   (override pra retest)
 *   pnpm tsx scripts/test-resume-builder.ts --only=C2,C8     (subset de cenários)
 */

import { config } from "dotenv";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { AI_TOOLS } from "../server/lib/aiTools.ts";

config({ quiet: true });

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(here);

const argv = process.argv.slice(2);
const modelOverride = argv.find((a) => a.startsWith("--model="))?.split("=")[1];
const onlyArg = argv.find((a) => a.startsWith("--only="))?.split("=")[1];
const onlySet = onlyArg
  ? new Set(onlyArg.split(",").map((s) => s.trim().toUpperCase()))
  : null;
const turnDelayMs = parseInt(
  argv.find((a) => a.startsWith("--delay="))?.split("=")[1] ?? "0",
  10,
);

const tool = AI_TOOLS["resume-builder"];
if (!tool) {
  console.error("resume-builder não encontrado em AI_TOOLS");
  process.exit(1);
}

const MODEL = modelOverride ?? tool.model;
const SYSTEM_PROMPT = tool.systemPrompt;
const TEMPERATURE = tool.temperature;
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error("OPENAI_API_KEY não definida no .env");
  process.exit(1);
}

interface Scenario {
  id: string;
  title: string;
  userTurns: string[];
  checks: string[];
}

const SCENARIOS: Scenario[] = [
  {
    id: "C1",
    title: "Estudante zerado",
    userTurns: [
      "oi, tô no 2º ano de ciência da computação e nunca trabalhei, quero meu primeiro estágio",
      "queria área de desenvolvimento web",
      "português mesmo, vaga aqui no Brasil",
    ],
    checks: [
      "Detecta persona Estudante/Iniciante",
      "Recomenda formato Híbrido",
      "Reenquadra 'experiência' como 'Projetos e Atividades' ou não exige experiência formal",
      "Não pede experiência formal de quem nunca trabalhou",
    ],
  },
  {
    id: "C2",
    title: "Sênior pra Big Tech",
    userTurns: [
      "preciso refazer meu CV pra aplicar pra Google em Mountain View, sou dev há 8 anos",
      "Senior Software Engineer no time de infra",
      "monta do zero mesmo, melhor refazer tudo",
    ],
    checks: [
      "Infere inglês (Mountain View / Google)",
      "Infere persona Experiente",
      "Recomenda Harvard ou Híbrido (alvo Big Tech)",
      "Anuncia inferências em vez de perguntar de novo",
    ],
  },
  {
    id: "C3",
    title: "Transição de carreira",
    userTurns: [
      "trabalhei 10 anos como contador, tô migrando pra área de dados",
      "quero vaga júnior de analista de dados no Brasil",
      "tenho SQL básico e tô estudando Python há 6 meses",
    ],
    checks: [
      "Detecta persona Transição",
      "Valoriza habilidades transferíveis da carreira anterior",
      "Não trata como estudante zerado",
      "Recomenda Híbrido com razão alinhada (skills transferíveis)",
    ],
  },
  {
    id: "C4",
    title: "User dá tudo na 1ª mensagem",
    userTurns: [
      "sou a Maria, maria@email.com, (11) 99999-9999, dev frontend júnior há 1 ano em São Paulo, quero vaga efetiva, currículo em português, formato híbrido",
      "minha formação é técnico em informática 2022 e curso superior em ADS na FATEC, em andamento desde 2023",
      "experiência: dev frontend na empresa X de jan/2024 até hoje, mexo com React e TypeScript no produto principal",
    ],
    checks: [
      "Reconhece nome, contato, área, nível, idioma, formato de uma vez",
      "Não repete perguntas sobre o que já foi dito",
      "Pula direto pra coleta de formação/experiências",
    ],
  },
  {
    id: "C5",
    title: "Fuga de assunto",
    userTurns: [
      "oi",
      "quanto ganha um dev pleno?",
      "tá, depois eu vejo. vamos voltar pro currículo. sou estudante de TI",
    ],
    checks: [
      "Dispara guard rail no turno 2 (salário)",
      "Redireciona pro Comparador de Carreiras",
      "Retoma o currículo no mesmo turno ou no seguinte",
    ],
  },
  {
    id: "C6",
    title: "User vago / respostas fracas",
    userTurns: ["quero um currículo", "fiz um projeto", "ah é, um site"],
    checks: [
      "No turno 2 cava com UMA pergunta de aprofundamento (não 3 simultâneas)",
      "Tom acolhedor, não cobra como manual",
      "No turno 3 continua coleta sem repetir as 3 perguntas anteriores",
    ],
  },
  {
    id: "C7",
    title: "Inconsistência",
    userTurns: [
      "sou iniciante, nunca trabalhei na área",
      "tô fazendo faculdade de Sistemas de Informação",
      "ah, esqueci, trabalhei 3 anos na empresa X como desenvolvedor Java",
    ],
    checks: [
      "Aponta inconsistência com tom suave no turno 3 (sem acusar)",
      "Pergunta o que prevalece (iniciante vs 3 anos)",
      "Não simplesmente ignora a contradição",
    ],
  },
  {
    id: "C8",
    title: "Fluxo completo até [[CURRICULO_READY]]",
    userTurns: [
      "tô buscando minha primeira vaga, terminei bootcamp de programação ano passado",
      "quero ser dev backend, alvo empresas BR, currículo em português",
      "monta do zero, não tenho currículo antigo",
      "pode ser híbrido, parece que faz sentido pra mim",
      "Lucas Silva, lucas.silva@email.com, (11) 98765-4321, github.com/lucassilva, São Paulo SP, sem LinkedIn ainda",
      "Bootcamp Full Stack na Rocketseat 2024-2025 e ensino médio completo em 2020 na ETEC Itaquera",
      "Não tenho experiência formal ainda, só projetos",
      "Projeto 1: API REST em Node.js com PostgreSQL pra controle de gastos pessoais, deploy na Railway. Projeto 2: clone simples do Twitter feito durante o bootcamp com React no front e Express no back",
      "Habilidades: JavaScript, TypeScript, Node.js, React, PostgreSQL, Git, Docker básico",
      "Inglês intermediário, leio bem mas falo travado",
      "Tá tudo certo, pode gerar o currículo agora",
    ],
    checks: [
      "Em TODOS turnos intermediários NÃO emite [[CURRICULO_READY]]",
      "Faz resumão antes do marcador no último turno",
      "Emite [[CURRICULO_READY]] exatamente assim (colchetes duplos), sozinho, na última linha",
      "Não inventa variações do marcador",
    ],
  },
  {
    id: "C9",
    title:
      "Experiência mencionada sem período (Fase 3.1: cava E aceita ausência)",
    userTurns: [
      "tô buscando vaga de dev backend júnior, alvo BR",
      "trabalhei na Acme Solutions como Desenvolvedora Backend Júnior",
      "não lembro, prefiro não cravar data",
      "trabalhei com Node.js e PostgreSQL no time de produto, mexi com API REST",
    ],
    checks: [
      "T1: Natechinho reage e pede o próximo dado natural (não é o foco do cenário)",
      "T2: Natechinho registra empresa+cargo e CAVA o período com UMA pergunta (ex: 'quando foi isso?')",
      "T3: user resiste, Natechinho ACEITA e segue (NÃO repete pedido de período, NÃO trava)",
      "T4: Natechinho avança pra responsabilidades, sem voltar a pedir período",
      "Nenhum turno do Natechinho empilha 2+ perguntas sobre tópicos diferentes",
      "Anti-regressão: zero travessão, sem misturar você/tu",
    ],
  },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface TurnLog {
  user: string;
  assistant: string;
  ms: number;
}

interface ScenarioResult {
  scenario: Scenario;
  turns: TurnLog[];
  totalMs: number;
  error?: string;
}

async function callOpenAI(messages: ChatMessage[]): Promise<string> {
  const body = {
    model: MODEL,
    temperature: TEMPERATURE,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
  };

  const start = Date.now();
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const out = data.choices?.[0]?.message?.content;
  if (!out) throw new Error("Resposta vazia da OpenAI");
  return out;
}

async function runScenario(scenario: Scenario): Promise<ScenarioResult> {
  const history: ChatMessage[] = [];
  const turns: TurnLog[] = [];
  const startAll = Date.now();

  try {
    for (let i = 0; i < scenario.userTurns.length; i++) {
      if (i > 0 && turnDelayMs > 0)
        await new Promise((r) => setTimeout(r, turnDelayMs));
      const userMsg = scenario.userTurns[i];
      history.push({ role: "user", content: userMsg });
      const t0 = Date.now();
      const reply = await callOpenAI(history);
      const ms = Date.now() - t0;
      history.push({ role: "assistant", content: reply });
      turns.push({ user: userMsg, assistant: reply, ms });
    }
  } catch (err) {
    return {
      scenario,
      turns,
      totalMs: Date.now() - startAll,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return { scenario, turns, totalMs: Date.now() - startAll };
}

/* ─────────── verificações ─────────── */

const EM_DASH = "—";
const EN_DASH = "–";
const MARKER = "[[CURRICULO_READY]]";
const MARKER_VARIANT_RE =
  /\[CURRICULO_READY\]|CURRICULO[\s_]?PRONTO|\bCURRICULO READY\b/i;

function hasEmDash(s: string): boolean {
  return s.includes(EM_DASH) || s.includes(EN_DASH);
}

function countQuestionMarks(s: string): number {
  let count = 0;
  for (const ch of s) if (ch === "?") count++;
  return count;
}

function findEmDashSamples(s: string, max = 3): string[] {
  const out: string[] = [];
  const lines = s.split(/\n+/);
  for (const line of lines) {
    if (hasEmDash(line)) {
      out.push(line.trim().slice(0, 160));
      if (out.length >= max) break;
    }
  }
  return out;
}

function masculineToneIssues(s: string): string[] {
  const issues: string[] = [];
  // Feminino claro do assistente sobre si mesmo. Procura "sou a" "estou aqui pra te ajudar como sua" etc.
  // É conservador: só pega marcadores fortes pra evitar falsos positivos.
  if (/\bsou a (Natechinha|sua mentora|uma mentora)\b/i.test(s))
    issues.push("auto-referência feminina explícita");
  if (/\bestou aqui como sua\b/i.test(s))
    issues.push("'como sua' (gênero feminino)");
  return issues;
}

function fakeMarkerInIntermediate(reply: string): boolean {
  return reply.includes(MARKER);
}

function realMarkerOnLastLine(reply: string): boolean {
  const lines = reply.trim().split(/\r?\n/);
  const last = lines[lines.length - 1]?.trim();
  return last === MARKER;
}

function markerVariant(reply: string): string | null {
  const m = reply.match(MARKER_VARIANT_RE);
  if (!m) return null;
  // ignore se for o marcador exato
  if (
    reply.includes(MARKER) &&
    m[0].toUpperCase().includes("CURRICULO_READY")
  ) {
    // verificar se há instância "fora" do marcador exato
    const stripped = reply.replace(/\[\[CURRICULO_READY\]\]/g, "");
    if (MARKER_VARIANT_RE.test(stripped)) return m[0];
    return null;
  }
  return m[0];
}

/* ─────────── relatório ─────────── */

function fmtMs(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function buildReport(results: ScenarioResult[]): string {
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push(`# Fase 1C — Relatório de Diagnóstico: resume-builder`);
  lines.push("");
  lines.push(
    `> **Modelo:** \`${MODEL}\` · **Temperature:** ${TEMPERATURE} · **Gerado em:** ${now}`,
  );
  lines.push("");
  lines.push(
    "Este relatório foi produzido executando 8 conversas simuladas contra o systemPrompt canônico de `server/lib/aiTools.ts` (sem passar pelo Express, auth, Supabase). Nenhum prompt foi alterado nesta fase.",
  );
  lines.push("");

  /* sumário transversal */
  const transversalRows: string[] = [];
  let totalAssistantTurns = 0;
  let turnsWithEmDash = 0;
  let toneIssueTurns = 0;
  let prematureMarker = 0;
  let invalidVariant = 0;
  let turnsWithMultipleQ = 0;
  let totalQuestionMarks = 0;

  for (const r of results) {
    for (let i = 0; i < r.turns.length; i++) {
      totalAssistantTurns++;
      const text = r.turns[i].assistant;
      if (hasEmDash(text)) turnsWithEmDash++;
      if (masculineToneIssues(text).length > 0) toneIssueTurns++;
      const isLast = i === r.turns.length - 1;
      if (!isLast && text.includes(MARKER)) prematureMarker++;
      const variant = markerVariant(text);
      if (variant) invalidVariant++;
      const q = countQuestionMarks(text);
      totalQuestionMarks += q;
      if (q > 1) turnsWithMultipleQ++;
    }
  }

  transversalRows.push(`| Verificação | Resultado |`);
  transversalRows.push(`|---|---|`);
  transversalRows.push(
    `| Turnos do Natechinho totais | ${totalAssistantTurns} |`,
  );
  transversalRows.push(
    `| Turnos com travessão (—) ou quase-hífen (–) | ${turnsWithEmDash} ${turnsWithEmDash === 0 ? "✅" : "❌"} |`,
  );
  transversalRows.push(
    `| Turnos com problema de tom masculino | ${toneIssueTurns} ${toneIssueTurns === 0 ? "✅" : "⚠️"} |`,
  );
  transversalRows.push(
    `| Marcador [[CURRICULO_READY]] emitido prematuramente | ${prematureMarker} ${prematureMarker === 0 ? "✅" : "❌"} |`,
  );
  transversalRows.push(
    `| Variantes inválidas do marcador detectadas | ${invalidVariant} ${invalidVariant === 0 ? "✅" : "❌"} |`,
  );
  transversalRows.push(
    `| Turnos com mais de 1 interrogação (regra S6) | ${turnsWithMultipleQ} ${turnsWithMultipleQ === 0 ? "✅" : "❌"} |`,
  );
  transversalRows.push(
    `| Total de "?" em respostas do Natechinho | ${totalQuestionMarks} (média ${(totalQuestionMarks / Math.max(1, totalAssistantTurns)).toFixed(2)} por turno) |`,
  );

  lines.push(`## Verificações transversais`);
  lines.push("");
  lines.push(...transversalRows);
  lines.push("");

  /* por cenário */
  for (const r of results) {
    lines.push(`---`);
    lines.push("");
    lines.push(`## ${r.scenario.id} · ${r.scenario.title}`);
    lines.push("");
    if (r.error) {
      lines.push(`> ❌ **Erro na execução:** ${r.error}`);
      lines.push("");
      continue;
    }
    lines.push(
      `**Tempo total:** ${fmtMs(r.totalMs)} · **Turnos:** ${r.turns.length}`,
    );
    lines.push("");

    /* checks transversais por turno */
    let dashTurns: number[] = [];
    let toneTurns: number[] = [];
    let intermediateMarker: number[] = [];
    let variantTurns: { idx: number; sample: string }[] = [];
    let finalMarkerOk: boolean | null = null;
    const qCounts: number[] = [];
    for (let i = 0; i < r.turns.length; i++) {
      const text = r.turns[i].assistant;
      if (hasEmDash(text)) dashTurns.push(i + 1);
      if (masculineToneIssues(text).length > 0) toneTurns.push(i + 1);
      const isLast = i === r.turns.length - 1;
      if (!isLast && text.includes(MARKER)) intermediateMarker.push(i + 1);
      const v = markerVariant(text);
      if (v) variantTurns.push({ idx: i + 1, sample: v });
      if (isLast) finalMarkerOk = realMarkerOnLastLine(text);
      qCounts.push(countQuestionMarks(text));
    }

    lines.push(`### Transcrição`);
    lines.push("");
    for (let i = 0; i < r.turns.length; i++) {
      const t = r.turns[i];
      lines.push(`**T${i + 1} · user (${fmtMs(t.ms)}):** ${t.user}`);
      lines.push("");
      lines.push(`**T${i + 1} · Natechinho:**`);
      lines.push("");
      lines.push("```");
      lines.push(t.assistant);
      lines.push("```");
      lines.push("");
    }

    lines.push(`### Critérios do cenário`);
    lines.push("");
    for (const check of r.scenario.checks) {
      lines.push(`- [ ] ${check}`);
    }
    lines.push("");

    lines.push(`### Sinais automáticos`);
    lines.push("");
    lines.push(
      `- Travessão/quase-hífen em turnos: ${dashTurns.length ? dashTurns.join(", ") + " ❌" : "nenhum ✅"}`,
    );
    if (dashTurns.length) {
      for (const idx of dashTurns) {
        const samples = findEmDashSamples(r.turns[idx - 1].assistant);
        for (const s of samples) lines.push(`  - T${idx}: \`${s}\``);
      }
    }
    lines.push(
      `- Tom masculino: ${toneTurns.length ? `problemas em T${toneTurns.join(", T")} ⚠️` : "ok ✅"}`,
    );
    lines.push(
      `- Marcador prematuro: ${intermediateMarker.length ? `T${intermediateMarker.join(", T")} ❌` : "nenhum ✅"}`,
    );
    lines.push(
      `- Variantes inválidas do marcador: ${variantTurns.length ? variantTurns.map((v) => `T${v.idx} (\`${v.sample}\`)`).join(", ") + " ❌" : "nenhuma ✅"}`,
    );
    if (r.scenario.id === "C8") {
      lines.push(
        `- Marcador exato na última linha do último turno: ${finalMarkerOk ? "sim ✅" : "NÃO ❌"}`,
      );
    }
    const qDesc = qCounts
      .map((c, i) => `T${i + 1}=${c}${c > 1 ? "❌" : ""}`)
      .join(", ");
    const offending = qCounts.filter((c) => c > 1).length;
    lines.push(
      `- Interrogações por turno (S6): ${qDesc} ${offending === 0 ? "✅" : `(${offending} turno(s) com >1 ❌)`}`,
    );
    lines.push("");
  }

  lines.push(`---`);
  lines.push("");
  lines.push(`## Veredito geral`);
  lines.push("");
  lines.push(`_Preenchido manualmente abaixo após inspeção das transcrições._`);
  lines.push("");
  lines.push(`### Decisão`);
  lines.push("- [ ] Prompt está pronto pra UI (Fase 2)");
  lines.push("- [ ] Prompt precisa ajustes pontuais (listar abaixo)");
  lines.push("- [ ] Prompt tem problema estrutural (rever roteiro)");
  lines.push("");
  lines.push(`### Sugestões de ajuste (se houver)`);
  lines.push("- (nenhuma ainda)");
  lines.push("");

  return lines.join("\n");
}

/* ─────────── main ─────────── */

async function main() {
  const targets = onlySet
    ? SCENARIOS.filter((s) => onlySet.has(s.id.toUpperCase()))
    : SCENARIOS;

  console.log(
    `▶ resume-builder Fase 1C · modelo=${MODEL} · cenários=${targets.map((s) => s.id).join(",")}`,
  );

  const results: ScenarioResult[] = [];
  for (const sc of targets) {
    process.stdout.write(`  ${sc.id} ${sc.title} …`);
    const r = await runScenario(sc);
    if (r.error) process.stdout.write(` ❌ ${r.error}\n`);
    else
      process.stdout.write(
        ` ok (${r.turns.length} turnos, ${fmtMs(r.totalMs)})\n`,
      );
    results.push(r);
  }

  const report = buildReport(results);
  const outDir = `${repoRoot}/docs`;
  await mkdir(outDir, { recursive: true });
  const suffix = modelOverride ? `-${MODEL}` : "";
  const out = `${outDir}/curriculo-pro-fase-1c-relatorio${suffix}.md`;
  await writeFile(out, report, "utf-8");
  console.log(`\n📄 relatório: ${out.replace(repoRoot + "/", "")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
