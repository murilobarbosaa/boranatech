/**
 * Smoke test de ponta a ponta do Roadmap com IA (fase 2).
 *
 * POR QUE ELE EXISTE. Os testes da suite sao unitarios sobre funcoes puras.
 * Nenhum deles prova que uma pessoa consegue conversar e receber um roadmap: o
 * caminho real passa por auth ES256, RLS, RPC de cota, OpenAI e SSE, e nada
 * disso e exercitado por teste unitario.
 *
 * ONDE ELE ESCREVE. Nao existe banco de staging neste projeto: o servidor local
 * aponta para o Supabase de PRODUCAO (mesmo project ref). Entao esta rodada
 * escreve linha de verdade em `ai_usage_logs` e `ai_roadmaps`, sob a conta de
 * teste, e consome cota e OpenAI de verdade. Rodar so com autorizacao explicita.
 *
 * SEGREDOS. Le SMOKE_EMAIL e SMOKE_PASSWORD de process.env; nada e hardcoded.
 * Nunca imprime e-mail, senha, access_token nem refresh_token: o token aparece
 * mascarado em 8 caracteres, e so para dar rastro de qual sessao foi usada.
 *
 * TELEMETRIA. O funil do PostHog e client-side (posthog-js, em
 * client/src/lib/analytics.ts), entao este harness NAO emite evento nenhum. O
 * Sentry do servidor emite se SENTRY_DSN existir, entao o servidor deve subir
 * com a variavel vazia: `SENTRY_DSN= pnpm dev:server`.
 *
 * Uso:
 *   SMOKE_EMAIL=... SMOKE_PASSWORD=... npx tsx scripts/smokeRoadmapIA.mts --cenario=2
 *   ... --cenario=1
 */
const API = process.env.SMOKE_API_URL ?? "http://localhost:3100";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const EMAIL = process.env.SMOKE_EMAIL ?? "";
const PASSWORD = process.env.SMOKE_PASSWORD ?? "";

const cenarioArg = process.argv.find((a) => a.startsWith("--cenario="));
const CENARIO = cenarioArg ? cenarioArg.split("=")[1] : "";

function abortar(motivo: string): never {
  console.error(`\n[smoke] ABORTADO: ${motivo}`);
  process.exit(1);
}

function mascarar(token: string): string {
  return `${token.slice(0, 8)}...(${token.length} chars)`;
}

// PostgREST direto por fetch, no mesmo padrao de scripts/aiUsageReport.mts e
// scripts/checkMigrationsApplied.mts. O supabase-js nao importa limpo em .mts
// (o pacote nao expoe `createClient` como named export em ESM), e trazer o SDK
// so para um script seria dependencia sem motivo.
async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => null)) as unknown;
  if (!res.ok)
    abortar(`PostgREST ${path}: HTTP ${res.status} ${JSON.stringify(body)}`);
  return body;
}

async function rpc(nome: string, args: Record<string, unknown>) {
  return rest(`rpc/${nome}`, { method: "POST", body: JSON.stringify(args) });
}

// ---------------------------------------------------------------------------
// Pre-voo. Tudo que puder falhar barato falha ANTES de gastar OpenAI.
// ---------------------------------------------------------------------------

async function preVoo() {
  if (!SUPABASE_URL || !ANON_KEY)
    abortar("VITE_SUPABASE_URL/ANON_KEY ausentes.");
  if (!SERVICE_KEY) abortar("SUPABASE_SERVICE_ROLE_KEY ausente.");
  if (!EMAIL || !PASSWORD) {
    abortar(
      "SMOKE_EMAIL e/ou SMOKE_PASSWORD ausentes. Defina-os no ambiente (nao no script).",
    );
  }

  // GoTrue por fetch, mesma razao do PostgREST acima.
  const loginRes = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    },
  );
  const sessao = (await loginRes.json().catch(() => null)) as {
    access_token?: string;
    user?: { id?: string };
    error_description?: string;
    msg?: string;
  } | null;
  if (!loginRes.ok || !sessao?.access_token || !sessao.user?.id) {
    // Nunca ecoa e-mail nem senha: so o motivo que o GoTrue devolveu.
    abortar(
      `login falhou (HTTP ${loginRes.status}): ${sessao?.error_description ?? sessao?.msg ?? "sem detalhe"}`,
    );
  }

  const token = sessao.access_token;
  const userId = sessao.user.id;
  console.log(`[smoke] sessao obtida  token=${mascarar(token)}`);
  console.log(`[smoke] user_id=${userId}`);

  // ASSERCAO 1: a conta e admin. E o que faz resolveProStatus devolver Pro sem
  // assinatura (is_user_pro OR isAdminUser), e sem isso o gate barraria tudo.
  const papeis = (await rest(
    `admin_roles?user_id=eq.${userId}&select=user_id`,
  )) as unknown[];
  if (!Array.isArray(papeis) || papeis.length === 0) {
    abortar(`user_id ${userId} NAO esta em admin_roles.`);
  }
  console.log("[smoke] admin_roles: OK");

  // ASSERCAO 2: o servidor concorda. /context e Pro-gated; 403 aqui significa
  // que resolveProStatus devolveu false e nao adianta seguir.
  const ctx = await fetch(`${API}/api/roadmaps-ia/context`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (ctx.status === 403) abortar("servidor devolveu 403 pro_required.");
  if (!ctx.ok) abortar(`/context devolveu HTTP ${ctx.status}.`);
  console.log("[smoke] gate Pro no servidor: OK");

  return { token, userId };
}

// ---------------------------------------------------------------------------
// Cota, medida antes e depois. O limite diario nao vem na resposta da API, so a
// contagem; por isso o harness imprime a CONTAGEM e o teto de turnos que a API
// declara (maxMensagens), que sao os dois numeros observaveis em runtime.
// ---------------------------------------------------------------------------

async function lerCota(userId: string, rotulo: string) {
  const global = await rpc("get_ai_usage_today", { p_user_id: userId });
  const dedicada = await rpc("get_ai_usage_today_by_tool", {
    p_user_id: userId,
    p_tool: "roadmap-intake-chat",
  });
  console.log(
    `[smoke] cota ${rotulo}: global=${global} dedicada(roadmap-intake-chat)=${dedicada}`,
  );
  return { global: Number(global), dedicada: Number(dedicada) };
}

async function turno(
  token: string,
  messages: Array<{ role: string; content: string }>,
) {
  const res = await fetch(`${API}/api/roadmaps-ia/intake/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  });
  const body = (await res.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  return { status: res.status, body };
}

// ---------------------------------------------------------------------------
// CENARIO 2: o teto. Historico SINTETICO, uma requisicao so.
//
// Por que sintetico e nao 20 turnos de conversa: a validacao do teto acontece
// ANTES de qualquer chamada de IA (validateIntakeChatBody roda antes do
// checkRoadmapIntakeChatDailyLimit e do runIntakeChatTurn), entao conversar 20
// vezes para provar isto gastaria 20 chamadas de OpenAI para exercitar um
// caminho que custa zero.
// ---------------------------------------------------------------------------

function historicoSintetico(mensagensDoUsuario: number) {
  const msgs: Array<{ role: string; content: string }> = [];
  for (let i = 0; i < mensagensDoUsuario; i += 1) {
    msgs.push({ role: "user", content: `r${i}` });
    msgs.push({ role: "assistant", content: `p${i}` });
  }
  return msgs;
}

async function cenario2(token: string, userId: string) {
  console.log("\n=== CENARIO 2: teto de turnos ===");
  const antes = await lerCota(userId, "antes");

  console.log("\n-- borda de cima: 20 mensagens de usuario (deve REJEITAR) --");
  const acima = await turno(token, historicoSintetico(20));
  console.log(`   HTTP ${acima.status}  code=${acima.body?.code ?? "-"}`);
  console.log(`   message=${acima.body?.message ?? "-"}`);

  console.log("\n-- borda de baixo: 19 mensagens de usuario (deve ACEITAR) --");
  const abaixo = await turno(token, historicoSintetico(19));
  console.log(`   HTTP ${abaixo.status}`);
  if (abaixo.status === 200) {
    console.log(
      `   restantes=${abaixo.body?.restantes} maxMensagens=${abaixo.body?.maxMensagens} ` +
        `canGenerate=${abaixo.body?.canGenerate} ready=${abaixo.body?.ready}`,
    );
    console.log(`   missing=${JSON.stringify(abaixo.body?.missing)}`);
  } else {
    console.log(`   code=${abaixo.body?.code} message=${abaixo.body?.message}`);
  }

  const depois = await lerCota(userId, "depois");
  console.log(
    `[smoke] delta de cota: global=${depois.global - antes.global} dedicada=${depois.dedicada - antes.dedicada}`,
  );

  // P2: o caminho de rejeicao virou linha no banco? Antes desta fase ele era
  // invisivel. Nao lemos conteudo de conversa, so o codigo de motivo.
  const rejeicoes = (await rest(
    `ai_usage_logs?user_id=eq.${userId}&status=eq.rejected&select=id,tool,status,error_message,created_at&order=created_at.desc&limit=5`,
  )) as Array<Record<string, unknown>>;
  console.log("\n[smoke] linhas 'rejected' recentes (observabilidade do P2):");
  for (const r of rejeicoes ?? []) {
    console.log(
      `   ${r.created_at}  tool=${r.tool}  motivo=${r.error_message}  id=${r.id}`,
    );
  }
  if (!rejeicoes?.length) {
    console.log("   NENHUMA. A observabilidade do P2 nao gravou o turn_limit.");
  }

  return {
    rejeitou20: acima.status === 400 && acima.body?.code === "turn_limit",
    aceitou19: abaixo.status === 200,
  };
}

// ---------------------------------------------------------------------------
// CENARIO 1: conversa real ate dar para gerar, e geracao ate `ready`.
// ---------------------------------------------------------------------------

// Roteiro de respostas. Cobre as 7 etapas do INTAKE_CHAT_SYSTEM_PROMPT mais a
// confirmacao do resumo. Se a conversa precisar de mais que isto, o harness
// repete a ultima ate o teto, e o numero de turnos gastos e a medida que
// interessa: se passar de 15, ROTEIRO_PIOR_CASO esta errado.
const RESPOSTAS = [
  "Quero conquistar minha primeira vaga em tecnologia.",
  "Consigo estudar de 5 a 10 horas por semana.",
  "Quero chegar la em uns 6 meses.",
  "Hoje eu sei o basico de HTML e CSS, e comecei JavaScript faz pouco tempo.",
  "Quero muito sair do meu emprego atual e trabalhar com algo que eu goste.",
  "Meu maior obstaculo e o tempo, porque trabalho durante o dia.",
  "Queria focar em desenvolvimento web, front-end.",
  "Isso mesmo, esta certo. Pode gerar.",
  "Sim, confirmo.",
  "Pode gerar, por favor.",
];

async function cenario1(token: string, userId: string) {
  console.log("\n=== CENARIO 1: caminho completo ===");
  const antes = await lerCota(userId, "antes");

  const messages: Array<{ role: string; content: string }> = [];
  let turnos = 0;
  let ultimo: Record<string, unknown> | null = null;
  const MAX = 20;

  while (turnos < MAX) {
    const r = await turno(token, messages);
    turnos += 1;
    if (r.status !== 200) {
      console.log(
        `turno ${turnos}: HTTP ${r.status} code=${r.body?.code} message=${r.body?.message}`,
      );
      break;
    }
    ultimo = r.body;
    console.log(
      `turno ${String(turnos).padStart(2)} | restantes=${String(r.body?.restantes).padStart(2)} | ` +
        `canGenerate=${r.body?.canGenerate} | ready=${r.body?.ready} | ` +
        `missing=${JSON.stringify(r.body?.missing)}`,
    );
    messages.push({ role: "assistant", content: String(r.body?.reply ?? "") });
    if (r.body?.canGenerate === true) {
      console.log(`\n[smoke] canGenerate virou TRUE no turno ${turnos}.`);
      break;
    }
    const resposta = RESPOSTAS[Math.min(turnos - 1, RESPOSTAS.length - 1)];
    messages.push({ role: "user", content: resposta });
  }

  if (ultimo?.canGenerate !== true) {
    console.log(
      `\n[smoke] a conversa NAO chegou a canGenerate em ${turnos} turnos. Nao vou gerar.`,
    );
    await lerCota(userId, "depois");
    return { turnos, gerou: false, slug: null as string | null };
  }

  // Geracao por SSE.
  console.log("\n-- gerando (SSE) --");
  const inicio = Date.now();
  const intake = ultimo.intake as Record<string, unknown>;
  const payload = {
    ...intake,
    format: (intake.format as string) ?? "misto",
  };
  const res = await fetch(`${API}/api/roadmaps-ia/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => null);
    console.log(`   HTTP ${res.status} ${JSON.stringify(err)}`);
    await lerCota(userId, "depois");
    return { turnos, gerou: false, slug: null as string | null };
  }

  let slug: string | null = null;
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const linhas = buf.split("\n\n");
    buf = linhas.pop() ?? "";
    for (const l of linhas) {
      const t = l.replace(/^data: /, "").trim();
      if (!t || t === "[DONE]") continue;
      try {
        const ev = JSON.parse(t) as Record<string, unknown>;
        if (ev.type === "skeleton") {
          slug = String(ev.slug);
          console.log(`   esqueleto: slug=${slug} secoes=${ev.total}`);
        } else if (ev.type === "section") {
          console.log(`   secao ${ev.index}/${ev.total} ok`);
        } else if (ev.type === "section_failed") {
          console.log(`   secao ${ev.index} FALHOU: ${ev.detail}`);
        } else {
          console.log(`   evento: ${JSON.stringify(ev).slice(0, 200)}`);
        }
      } catch {
        /* frame parcial */
      }
    }
  }
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(`   tempo total da geracao: ${segundos}s`);

  await lerCota(userId, "depois");
  console.log(
    `[smoke] delta: global=+${(await lerCota(userId, "final")).global - antes.global}`,
  );
  return { turnos, gerou: true, slug };
}

// ---------------------------------------------------------------------------

async function main() {
  console.log(`[smoke] API=${API}`);
  console.log(
    `[smoke] SENTRY_DSN=${process.env.SENTRY_DSN ? "DEFINIDA (perigo)" : "vazia/ausente (ok)"}`,
  );
  const { token, userId } = await preVoo();

  if (CENARIO === "2") {
    const r = await cenario2(token, userId);
    console.log(
      `\n[smoke] veredito cenario 2: rejeitou20=${r.rejeitou20} aceitou19=${r.aceitou19}`,
    );
  } else if (CENARIO === "1") {
    const r = await cenario1(token, userId);
    console.log(
      `\n[smoke] veredito cenario 1: turnos=${r.turnos} gerou=${r.gerou} slug=${r.slug}`,
    );
  } else {
    abortar("passe --cenario=1 ou --cenario=2");
  }
}

main().catch((e) => abortar(e instanceof Error ? e.message : String(e)));
