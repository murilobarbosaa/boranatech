/**
 * PASSO 2. Falsificacao da hipotese do problema (2). SOMENTE LEITURA.
 *
 * Nenhum INSERT, UPDATE, UPSERT ou DELETE. As unicas escritas possiveis seriam via
 * PostgREST, e o helper `get` deste arquivo fixa o metodo em GET. A consulta ao
 * PostHog usa HTTP POST porque o endpoint /query/ do PostHog exige POST, mas o
 * corpo e um SELECT HogQL: e leitura, nao escrita.
 *
 * Uso:
 *   set -a && . ./.env && set +a
 *   npx tsx scripts/consentForensics.mts
 *
 * O QUE ESTE SCRIPT DECIDE
 *
 * Os 64 sem consentimento atual misturam dois casos de significado oposto:
 *   Grupo A: tem linha em versao ANTERIOR, nenhuma na atual. Consentiu antes e nao
 *            voltou desde o bump. Comportamento CORRETO, nao e bug.
 *   Grupo B: nenhuma linha, em nenhuma versao. Conta criada sem consentimento
 *            registrado. Evidencia de escrita perdida ou da lacuna do
 *            mode === "cadastro".
 *
 * E o discriminador entre as duas hipoteses do Passo 3 vive na DISTANCIA entre
 * `accepted_at` e `created_at`:
 *   - proximo do instante do cadastro  -> a escrita do fluxo de signup funcionou;
 *   - muito depois                     -> quem gravou foi o GATE, ou seja, o modal
 *                                         apareceu e a pessoa aceitou ali.
 * A corrida de leitura-antes-da-escrita produz linha EXISTENTE mais modal exibido,
 * e isso e cruzado com os eventos `consent_check outcome=needsConsent` do PostHog.
 *
 * PRIVACIDADE: a saida e agregada. Nenhum e-mail, nenhum id completo.
 */

import {
  PRIVACY_VERSION,
  TERMS_VERSION,
} from "../shared/consent.js";

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const posthogHost = process.env.POSTHOG_HOST;
const posthogKey = process.env.POSTHOG_API_KEY;
const posthogProject = process.env.POSTHOG_PROJECT_ID;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "[consentForensics] faltam VITE_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const PAGE = 1000;
// Marco do bump de versao: conta criada a partir daqui nasceu sob a versao atual.
const BUMP = new Date(`${TERMS_VERSION}T00:00:00Z`);
const AGORA = new Date();
const SETE_DIAS = new Date(AGORA.getTime() - 7 * 24 * 60 * 60 * 1000);

function abortar(mensagem: string): never {
  console.error(`[consentForensics] ${mensagem}`);
  process.exit(1);
}

/** Unico helper de rede do Supabase. Metodo fixo em GET. */
async function get(
  path: string,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  return fetch(`${supabaseUrl}/${path}`, {
    method: "GET",
    headers: {
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...extraHeaders,
    },
  });
}

function totalDoContentRange(res: Response, contexto: string): number {
  const range = res.headers.get("content-range");
  const total = range?.split("/")[1];
  if (!total || total === "*") {
    abortar(`${contexto}: sem total no content-range ("${range}").`);
  }
  const n = Number(total);
  if (!Number.isFinite(n) || n < 0) {
    abortar(`${contexto}: total nao numerico ("${range}").`);
  }
  return n;
}

interface ConsentRow {
  user_id: string;
  document: string;
  version: string;
  accepted_at: string;
}

/** TODAS as linhas de user_consents, em todas as versoes. Total conferido. */
async function lerTodosConsentimentos(): Promise<ConsentRow[]> {
  const base = "rest/v1/user_consents?select=user_id,document,version,accepted_at";
  const todas: ConsentRow[] = [];
  let declarado: number | null = null;

  for (let from = 0; ; from += PAGE) {
    const res = await get(base, {
      Range: `${from}-${from + PAGE - 1}`,
      "Range-Unit": "items",
      Prefer: "count=exact",
    });
    if (!res.ok && res.status !== 206) {
      abortar(`falha ao ler user_consents (HTTP ${res.status}).`);
    }
    const total = totalDoContentRange(res, "user_consents");
    if (declarado === null) declarado = total;
    else if (total !== declarado) {
      abortar(
        `total de user_consents mudou durante o scan (${declarado} -> ${total}). Rode de novo.`,
      );
    }
    const rows = (await res.json()) as ConsentRow[];
    todas.push(...rows);
    if (rows.length < PAGE) break;
  }

  if (declarado === null) abortar("nenhuma pagina lida de user_consents.");
  if (todas.length !== declarado) {
    abortar(
      `scan incompleto de user_consents: declarado ${declarado}, li ${todas.length}. Abortando em vez de reportar contagem parcial.`,
    );
  }
  console.log(
    `[consentForensics] user_consents (todas as versoes): ${todas.length} linha(s), conferido.`,
  );
  return todas;
}

interface AuthUser {
  id: string;
  created_at: string;
  last_sign_in_at: string | null;
  providers: string[];
}

/** TODOS os usuarios de auth.users, via Admin API do GoTrue. Total conferido. */
async function lerUsuarios(): Promise<AuthUser[]> {
  const todos: AuthUser[] = [];
  let declarado: number | null = null;

  for (let page = 1; ; page++) {
    const res = await get(`auth/v1/admin/users?page=${page}&per_page=${PAGE}`);
    if (!res.ok) abortar(`falha ao listar auth.users (HTTP ${res.status}).`);
    const header = res.headers.get("x-total-count");
    if (header !== null && declarado === null) {
      const n = Number(header);
      if (Number.isFinite(n)) declarado = n;
    }
    const body = (await res.json()) as {
      users?: Array<{
        id: string;
        created_at: string;
        last_sign_in_at?: string | null;
        app_metadata?: { provider?: string; providers?: string[] };
        identities?: Array<{ provider?: string }>;
      }>;
    };
    const users = body.users ?? [];
    for (const u of users) {
      // Providers: prioriza `identities` (a lista real de vinculos) e cai para
      // app_metadata. Conta com dois vinculos aparece com os dois.
      const deIdentities = (u.identities ?? [])
        .map((i) => i.provider)
        .filter((p): p is string => typeof p === "string");
      const deMetadata =
        u.app_metadata?.providers ??
        (u.app_metadata?.provider ? [u.app_metadata.provider] : []);
      const providers = [
        ...new Set(deIdentities.length ? deIdentities : deMetadata),
      ];
      todos.push({
        id: u.id,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        providers,
      });
    }
    if (users.length < PAGE) break;
  }

  if (declarado !== null && declarado !== todos.length) {
    abortar(
      `scan incompleto de auth.users: declarado ${declarado}, li ${todos.length}.`,
    );
  }
  console.log(`[consentForensics] auth.users: ${todos.length} usuario(s), conferido.`);
  return todos;
}

/** Faixas de data pedidas no item 2.1. */
function faixa(iso: string | null): string {
  if (!iso) return "nunca";
  const d = new Date(iso);
  if (d >= SETE_DIAS) return "ultimos 7 dias";
  if (d >= BUMP) return `entre o bump e 7 dias atras`;
  return `antes de ${TERMS_VERSION}`;
}

function contar(valores: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const v of valores) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

function imprimirDistribuicao(titulo: string, valores: string[]) {
  console.log(`  ${titulo}:`);
  const m = contar(valores);
  if (m.size === 0) {
    console.log("    (vazio)");
    return;
  }
  for (const [k, v] of [...m.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(v).padStart(5)}  ${k}`);
  }
}

// ─── PostHog: quem viu o modal (leitura via SELECT HogQL) ────────────────────
async function lerQuemViuOModal(): Promise<Map<string, string> | null> {
  if (!posthogHost || !posthogKey || !posthogProject) {
    console.log(
      "\n[consentForensics] PostHog nao configurado no ambiente (POSTHOG_HOST/POSTHOG_API_KEY/POSTHOG_PROJECT_ID). Item 2.3 fica sem o cruzamento de quem viu o modal.",
    );
    return null;
  }
  const hogql = `
    select distinct_id, min(timestamp) as primeiro
    from events
    where event = 'consent_check'
      and properties.outcome = 'needsConsent'
    group by distinct_id
  `;
  const res = await fetch(
    `${posthogHost}/api/projects/${posthogProject}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${posthogKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query: hogql } }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!res.ok) {
    const corpo = await res.text().catch(() => "");
    console.warn(
      `\n[consentForensics] PostHog respondeu ${res.status}. Item 2.3 sem cruzamento. ${corpo.slice(0, 200)}`,
    );
    return null;
  }
  const json = (await res.json()) as { results?: unknown[][] };
  const mapa = new Map<string, string>();
  for (const linha of json.results ?? []) {
    const [id, ts] = linha as [string, string];
    if (typeof id === "string" && id) mapa.set(id, String(ts));
  }
  return mapa;
}

async function main() {
  console.log(
    `[consentForensics] versoes vigentes: terms=${TERMS_VERSION} privacy=${PRIVACY_VERSION}`,
  );
  console.log(
    `[consentForensics] marco do bump: ${BUMP.toISOString()} | janela de 7 dias desde: ${SETE_DIAS.toISOString()}`,
  );

  const [consentimentos, usuarios] = await Promise.all([
    lerTodosConsentimentos(),
    lerUsuarios(),
  ]);

  // Indexa consentimento por usuario.
  const porUsuario = new Map<
    string,
    { atual: Set<string>; qualquer: number; primeiroAceite: string | null }
  >();
  for (const row of consentimentos) {
    const entry =
      porUsuario.get(row.user_id) ??
      { atual: new Set<string>(), qualquer: 0, primeiroAceite: null };
    entry.qualquer += 1;
    const versaoEsperada = row.document === "terms" ? TERMS_VERSION : PRIVACY_VERSION;
    if (row.version === versaoEsperada) entry.atual.add(row.document);
    if (!entry.primeiroAceite || row.accepted_at < entry.primeiroAceite) {
      entry.primeiroAceite = row.accepted_at;
    }
    porUsuario.set(row.user_id, entry);
  }

  const comAtual: AuthUser[] = [];
  const grupoA: AuthUser[] = [];
  const grupoB: AuthUser[] = [];

  for (const u of usuarios) {
    const e = porUsuario.get(u.id);
    const temAtual = Boolean(
      e && e.atual.has("terms") && e.atual.has("privacy"),
    );
    if (temAtual) comAtual.push(u);
    else if (e && e.qualquer > 0) grupoA.push(u);
    else grupoB.push(u);
  }

  // Afirma o TOTAL: as tres populacoes tem que somar exatamente os usuarios.
  if (comAtual.length + grupoA.length + grupoB.length !== usuarios.length) {
    abortar(
      `particao inconsistente: ${comAtual.length} + ${grupoA.length} + ${grupoB.length} != ${usuarios.length}.`,
    );
  }

  console.log("\n══════ 2.1 — Os 64 quebrados em duas populacoes ══════");
  console.log(`total de usuarios ......................... ${usuarios.length}`);
  console.log(`com consentimento na versao ATUAL ......... ${comAtual.length}`);
  console.log(`GRUPO A (versao anterior, nao a atual) .... ${grupoA.length}`);
  console.log(`GRUPO B (nenhuma linha, nenhuma versao) ... ${grupoB.length}`);
  console.log(`soma A + B ................................ ${grupoA.length + grupoB.length}`);

  console.log("\n── GRUPO A (consentiu antes do bump, nao voltou. NAO e bug) ──");
  imprimirDistribuicao("created_at", grupoA.map((u) => faixa(u.created_at)));
  imprimirDistribuicao(
    "last_sign_in_at",
    grupoA.map((u) => faixa(u.last_sign_in_at)),
  );

  console.log("\n── GRUPO B (nenhum consentimento registrado) ──");
  imprimirDistribuicao("created_at", grupoB.map((u) => faixa(u.created_at)));
  imprimirDistribuicao(
    "last_sign_in_at",
    grupoB.map((u) => faixa(u.last_sign_in_at)),
  );

  // O recorte decisivo do item 2.1.
  const bDepoisDoBump = grupoB.filter((u) => new Date(u.created_at) >= BUMP);
  console.log(
    `\n  >>> RECORTE DECISIVO: Grupo B com created_at POSTERIOR a ${TERMS_VERSION}: ${bDepoisDoBump.length}`,
  );
  console.log(
    "      (contas criadas ja sob a versao atual e ainda assim sem consentimento:",
  );
  console.log("       nao ha explicacao benigna. E o tamanho real do problema (2).)");

  console.log("\n══════ 2.2 — Grupo B por provider de origem ══════");
  imprimirDistribuicao(
    "providers do Grupo B",
    grupoB.map((u) => (u.providers.length ? u.providers.join("+") : "(nenhum)")),
  );
  if (bDepoisDoBump.length > 0) {
    imprimirDistribuicao(
      "providers do Grupo B criados APOS o bump",
      bDepoisDoBump.map((u) =>
        u.providers.length ? u.providers.join("+") : "(nenhum)",
      ),
    );
  }

  console.log("\n══════ 2.3 — Quem gravou o consentimento: o signup ou o gate? ══════");
  // Distancia entre o primeiro aceite e a criacao da conta, so para contas criadas
  // sob a versao atual (antes disso o aceite veio de outro fluxo/versao).
  const criadosAposBumpComAtual = comAtual.filter(
    (u) => new Date(u.created_at) >= BUMP,
  );
  const buckets: string[] = [];
  for (const u of criadosAposBumpComAtual) {
    const e = porUsuario.get(u.id)!;
    if (!e.primeiroAceite) continue;
    const delta =
      (new Date(e.primeiroAceite).getTime() - new Date(u.created_at).getTime()) /
      1000;
    if (delta < 10) buckets.push("a) < 10s (gravado NO cadastro)");
    else if (delta < 60) buckets.push("b) 10s a 60s");
    else if (delta < 3600) buckets.push("c) 1min a 1h (gate pediu depois)");
    else buckets.push("d) > 1h (gate pediu em visita posterior)");
  }
  console.log(
    `  contas criadas apos o bump e com consentimento atual: ${criadosAposBumpComAtual.length}`,
  );
  imprimirDistribuicao("distancia entre created_at e primeiro accepted_at", buckets);
  console.log(
    "  Leitura: (a) prova que a escrita do signup funciona. (c)/(d) sao a assinatura",
  );
  console.log(
    "  de modal exibido: quem gravou foi o gate, nao o cadastro.",
  );

  // Cruzamento com quem de fato viu o modal.
  const viuModal = await lerQuemViuOModal();
  if (viuModal) {
    console.log(
      `\n  usuarios com evento consent_check outcome=needsConsent: ${viuModal.size}`,
    );
    let comLinhaAnterior = 0;
    let comLinhaPosterior = 0;
    let semLinha = 0;
    let foraDaBase = 0;
    const idsConhecidos = new Set(usuarios.map((u) => u.id));
    // Distancia entre a linha ja gravada e o momento em que o gate pediu.
    //
    // Este detalhamento NAO e decorativo: sem ele, "47 tinham linha antes" nao
    // distingue a corrida de duas outras explicacoes. O `timestamp` do PostHog e
    // fornecido pelo CLIENTE, entao relogio de dispositivo torto produz ordem
    // invertida sem corrida nenhuma; e um pedido dias depois nao e leitura
    // antecipada, e outro defeito. So a faixa de segundos sustenta a hipotese.
    const deltas: string[] = [];

    for (const [id, quando] of viuModal) {
      if (!idsConhecidos.has(id)) {
        foraDaBase += 1;
        continue;
      }
      const e = porUsuario.get(id);
      if (!e || !e.primeiroAceite) {
        semLinha += 1;
        continue;
      }
      const gravado = new Date(e.primeiroAceite).getTime();
      const pediu = new Date(quando).getTime();
      if (gravado < pediu) {
        comLinhaAnterior += 1;
        const seg = (pediu - gravado) / 1000;
        if (seg < 5) deltas.push("a) < 5s  (janela da corrida)");
        else if (seg < 60) deltas.push("b) 5s a 60s");
        else if (seg < 3600) deltas.push("c) 1min a 1h");
        else if (seg < 86400) deltas.push("d) 1h a 24h");
        else deltas.push("e) > 24h (nao e corrida: outro defeito ou relogio torto)");
      } else comLinhaPosterior += 1;
    }

    console.log(
      `    ja tinham linha ANTES de o gate pedir ....... ${comLinhaAnterior}`,
    );
    console.log(
      `    gravaram DEPOIS (aceitaram no modal) ........ ${comLinhaPosterior}`,
    );
    console.log(
      `    nunca gravaram nada ......................... ${semLinha}`,
    );
    console.log(
      `    distinct_id fora de auth.users (anonimo) .... ${foraDaBase}`,
    );
    console.log("");
    if (comLinhaAnterior > 0) {
      imprimirDistribuicao(
        "dos que tinham linha antes: quanto tempo antes",
        deltas,
      );
      const naJanela = deltas.filter((d) => d.startsWith("a)")).length;
      console.log("");
      console.log(
        `  >>> ${comLinhaAnterior} usuario(s) viram o modal tendo linha de consentimento JA gravada.`,
      );
      console.log(
        `      Destes, ${naJanela} com a linha gravada menos de 5s antes: essa e a faixa que`,
      );
      console.log(
        "      SO a corrida de leitura-antes-da-escrita explica. As faixas maiores precisam",
      );
      console.log(
        "      de outra explicacao (relogio do cliente, ou leitura stale mais longa).",
      );
    } else {
      console.log(
        "  >>> CORRIDA NAO EVIDENCIADA: ninguem viu o modal com linha previa. Aponta para",
      );
      console.log(
        "      escrita perdida antes de chegar ao banco, nao para leitura antecipada.",
      );
    }
  }
}

await main();
