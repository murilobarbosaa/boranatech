// Backfill do mapeamento user_id -> Stripe Customer, para os duplicados que
// existiam ANTES do reuso entrar em producao.
//
// Medido em 2026-07-28: 69 Customers para 61 e-mails distintos, 8 excedentes, 6
// e-mails com mais de um Customer. Depois do reuso (server/lib/stripeCustomer.ts)
// nenhum novo duplicado nasce, mas os antigos nao se resolvem sozinhos: sem linha
// em stripe_customers, o proximo checkout de quem tem duplicado criaria um
// Customer NOVO em vez de reaproveitar o que tem o historico bom.
//
// ORDEM OBRIGATORIA: rodar SOMENTE DEPOIS do codigo de reuso estar em producao.
// Antes disso o mapeamento e escrito e o checkout ainda ignora, entao o backfill
// gravaria um estado que ninguem le e que pode envelhecer.
//
// USO
//   node scripts/backfillStripeCustomers.mjs             # dry-run (default)
//   node scripts/backfillStripeCustomers.mjs --confirm   # aplica
//
// O dry-run NAO escreve nada: nem na Stripe, nem no Supabase. Ele lista, cluster
// por cluster, qual Customer seria eleito canonico e por que.
//
// O QUE ELE FAZ, por cluster (um cluster = um e-mail com mais de um Customer):
//   1. customers.list({ email }) -- consistencia FORTE. NAO usa customers.search,
//      cujo indice e eventualmente consistente (atraso de ate ~1 min).
//   2. resolve o user_id pelo e-mail em auth.users. ABORTA O CLUSTER se o e-mail
//      nao resolver para EXATAMENTE um usuario: dois usuarios no mesmo e-mail e
//      caso que nao se adivinha.
//   3. elege o canonico: o Customer que aparece em subscriptions
//      .provider_customer_id (lido EM TEMPO DE EXECUCAO, nao de lista escrita a
//      mao); nao havendo nenhum, o mais ANTIGO.
//   4. carimba metadata.supabase_user_id no canonico. Isto NAO e opcional: e o
//      que fecha a lacuna do conferirDono, que tolera metadata ausente. Sem o
//      carimbo, a protecao contra "Customer de outro usuario" fica dormente
//      justamente nos Customers antigos.
//   5. INSERT em stripe_customers com ON CONFLICT DO NOTHING.
//
// O QUE ELE NAO FAZ, de proposito:
//   - NAO deleta os Customers excedentes. Sem mapeamento eles ja sao
//     inalcancaveis pelo checkout, e deletar Customer na Stripe e irreversivel e
//     mexe em historico de cobranca. Ficam la, inertes.
//   - NAO mexe em subscriptions. O dinheiro ja esta no lugar certo: nos 3
//     clusters com assinatura, a assinatura E a cobranca bem-sucedida estao no
//     MESMO Customer.
//   - NAO cria Customer novo. Se um e-mail tiver zero Customer, nao ha o que
//     mapear e o proximo checkout resolve.

import { readFileSync } from "node:fs";

for (const linha of readFileSync(".env", "utf8").split("\n")) {
  const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) {
    process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const CONFIRM = process.argv.includes("--confirm");
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const SUPA_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STRIPE_KEY || !SUPA_URL || !SERVICE_KEY) {
  console.error(
    "[backfill] faltam STRIPE_SECRET_KEY, VITE_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

// livemode vem da chave, e a coluna do mapeamento e (user_id, livemode). Gravar
// um cus_ de test mode na tabela de producao e exatamente o acidente que a coluna
// existe para impedir, entao o modo e afirmado aqui e conferido por objeto.
const LIVEMODE = STRIPE_KEY.startsWith("sk_live_");
console.log(
  `[backfill] modo=${LIVEMODE ? "LIVE" : "TEST"} | ${CONFIRM ? "APLICANDO" : "DRY-RUN (nada e escrito)"}`,
);

async function stripe(path, init) {
  const r = await fetch(`https://api.stripe.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(init?.headers ?? {}),
    },
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`stripe ${path}: ${j.error?.message}`);
  return j;
}

async function supa(path, init) {
  const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`supabase ${path}: ${r.status} ${texto.slice(0, 200)}`);
  return texto ? JSON.parse(texto) : null;
}

/** Todos os Customers, para descobrir quais e-mails tem mais de um. */
async function listarTodosOsCustomers() {
  const todos = [];
  let startingAfter = null;
  for (let pagina = 0; pagina < 200; pagina += 1) {
    const qs = new URLSearchParams({ limit: "100" });
    if (startingAfter) qs.set("starting_after", startingAfter);
    const j = await stripe(`/customers?${qs}`);
    todos.push(...j.data);
    if (!j.has_more) return todos;
    startingAfter = j.data[j.data.length - 1].id;
  }
  // Aborta em vez de truncar em silencio: conjunto menor reportado como completo
  // e a forma de falhar passando.
  throw new Error("[backfill] passou de 200 paginas de Customer; abortando");
}

const todosOsCustomers = await listarTodosOsCustomers();
console.log(`[backfill] ${todosOsCustomers.length} Customers na conta.`);

const porEmail = new Map();
for (const c of todosOsCustomers) {
  const email = (c.email ?? "").trim().toLowerCase();
  if (!email) continue;
  porEmail.set(email, [...(porEmail.get(email) ?? []), c]);
}
const clusters = [...porEmail.entries()].filter(([, lista]) => lista.length > 1);
console.log(`[backfill] ${clusters.length} e-mail(s) com mais de um Customer.\n`);

let planejados = 0;
let aplicados = 0;
const abortados = [];

for (const [email] of clusters) {
  // Passo 1: consistencia forte. A listagem geral acima pode estar desatualizada
  // em relacao a um Customer criado agora; o list por e-mail e autoritativo.
  const { data: lista } = await stripe(
    `/customers?email=${encodeURIComponent(email)}&limit=100`,
  );
  if (lista.length < 2) {
    console.log(`- ${email}: ja nao ha duplicado (${lista.length}); pulando.`);
    continue;
  }

  // Passo 2: user_id, com aborto em ambiguidade. auth.users NAO e exposto pelo
  // PostgREST, entao a resolucao vai pelo endpoint admin do GoTrue, que aceita
  // filtro por e-mail. O filtro do GoTrue e por SUBSTRING, por isso o
  // `exatos` abaixo compara o e-mail inteiro: sem isso, "ana@x.com" casaria
  // tambem com "mariana@x.com" e o cluster seria atribuido ao usuario errado.
  const r = await fetch(
    `${SUPA_URL}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
  );
  if (!r.ok) {
    abortados.push(`${email}: falha ao resolver usuario (HTTP ${r.status})`);
    continue;
  }
  const { users } = await r.json();
  const exatos = (users ?? []).filter(
    (u) => (u.email ?? "").toLowerCase() === email,
  );
  if (exatos.length !== 1) {
    abortados.push(
      `${email}: resolveu para ${exatos.length} usuario(s); ABORTADO (nao se adivinha).`,
    );
    continue;
  }
  const userId = exatos[0].id;

  // Passo 3: canonico. Le subscriptions EM TEMPO DE EXECUCAO.
  const ids = lista.map((c) => c.id);
  const subs = await supa(
    `subscriptions?select=provider_customer_id,status&provider_customer_id=in.(${ids.join(",")})`,
  );
  const comAssinatura = new Set(
    (subs ?? []).map((s) => s.provider_customer_id).filter(Boolean),
  );
  const porAntiguidade = [...lista].sort((a, b) => a.created - b.created);
  const canonico =
    porAntiguidade.find((c) => comAssinatura.has(c.id)) ?? porAntiguidade[0];
  const criterio = comAssinatura.has(canonico.id)
    ? "tem assinatura em subscriptions"
    : "mais antigo (nenhum tem assinatura)";

  // Conferencia de modo, por objeto. Nao confia so no prefixo da chave.
  if (canonico.livemode !== LIVEMODE) {
    abortados.push(
      `${email}: canonico ${canonico.id} tem livemode=${canonico.livemode}, chave e ${LIVEMODE}; ABORTADO.`,
    );
    continue;
  }

  const donoAtual = canonico.metadata?.supabase_user_id;
  if (donoAtual && donoAtual !== userId) {
    abortados.push(
      `${email}: canonico ${canonico.id} ja tem supabase_user_id=${donoAtual} != ${userId}; ABORTADO.`,
    );
    continue;
  }

  const excedentes = lista.filter((c) => c.id !== canonico.id).map((c) => c.id);
  planejados += 1;
  console.log(`- ${email}`);
  console.log(`    user_id  : ${userId}`);
  console.log(`    canonico : ${canonico.id}  (${criterio})`);
  console.log(`    metadata : ${donoAtual ? "ja carimbado" : "SERA carimbado"}`);
  console.log(`    inertes  : ${excedentes.join(", ") || "(nenhum)"} (nao deletados)`);

  if (!CONFIRM) continue;

  // Passo 4: carimbar metadata (fecha a lacuna do conferirDono).
  if (!donoAtual) {
    await stripe(`/customers/${canonico.id}`, {
      method: "POST",
      body: new URLSearchParams({ "metadata[supabase_user_id]": userId }),
    });
  }

  // Passo 5: mapear, idempotente.
  await supa("stripe_customers", {
    method: "POST",
    headers: {
      Prefer: "resolution=ignore-duplicates,return=representation",
    },
    body: JSON.stringify([
      { user_id: userId, stripe_customer_id: canonico.id, livemode: LIVEMODE },
    ]),
  });
  aplicados += 1;
  console.log(`    OK: mapeado.`);
}

console.log(`\n[backfill] clusters elegiveis: ${planejados}`);
if (abortados.length > 0) {
  console.log(`[backfill] ABORTADOS (${abortados.length}), nenhum tocado:`);
  for (const a of abortados) console.log(`  ! ${a}`);
}
if (CONFIRM) {
  console.log(`[backfill] aplicados: ${aplicados}`);
} else {
  console.log("[backfill] dry-run. Rode de novo com --confirm para aplicar.");
}
