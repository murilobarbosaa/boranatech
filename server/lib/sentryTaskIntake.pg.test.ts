import { describe, expect, it, vi } from "vitest";

// Harness de ponta a ponta do sync: schema REAL (as migrations aplicadas num
// Postgres de verdade), PostgREST autentico, e a API do Sentry DE VERDADE.
// So a escrita e isolada, num banco descartavel.
//
// POR QUE ELE EXISTE. Foi este harness, e nao a suite unitaria, que pegou os
// dois defeitos mais caros da Fase 3, os dois invisiveis para mock:
//
//   1. `on conflict (col)` NAO casa com indice unico PARCIAL. O insert do sync
//      falharia em toda execucao, e o invariante 3 seria impossivel de cumprir
//      pelo caminho que o modulo usa. Corrigido tirando o predicado do indice.
//   2. `statsPeriod=` (vazio) passou a responder 400 na API do Sentry. Isso
//      quebrava a fase de manutencao INTEIRA, e ja vinha quebrando o job
//      reconcile-sentry-bugs em producao ha 78 runs quando foi descoberto.
//
// Nenhum dos dois aparece em teste com duplo de banco ou de rede, porque os dois
// sao sobre o que o OUTRO LADO aceita.
//
// PULA por padrao. Como rodar:
//
//   docker run -d --name bnt-fase3-pg -e POSTGRES_PASSWORD=test \
//     -e POSTGRES_DB=bnt postgres:16-alpine
//   # prelude: schema auth, set_updated_at, roles anon/authenticated/service_role
//   # depois aplicar supabase/migrations/20260727160000 em diante
//   docker run -d --name bnt-fase3-rest -p 55443:3000 \
//     -e PGRST_DB_URI="postgres://postgres:test@<ip-do-pg>:5432/bnt" \
//     -e PGRST_DB_ANON_ROLE=service_role -e PGRST_DB_SCHEMAS=public \
//     -e PGRST_JWT_SECRET="segredo-de-teste-com-mais-de-32-caracteres-ok" \
//     postgrest/postgrest:v12.2.3
//   # semear o quadro BUG com sentry_sync_enabled=true e a etapa intake_source='sentry'
//   BNT_SYNC_HARNESS=1 npx vitest run server/lib/sentryTaskIntake.pg.test.ts
//
// O passo a passo completo, com o SQL do prelude e do seed, esta em
// docs/plano-unificar-bugs-tarefas.md, secao "Harness da Fase 3".

const ativo = process.env.BNT_SYNC_HARNESS === "1";

vi.mock("./supabaseAdmin", async () => {
  const crypto = await import("node:crypto");
  const { createClient } = await import("@supabase/supabase-js");
  const SEGREDO = "segredo-de-teste-com-mais-de-32-caracteres-ok";
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const cabeca = b64({ alg: "HS256", typ: "JWT" });
  const corpo = b64({ role: "service_role", exp: 4102444800 });
  const assin = crypto
    .createHmac("sha256", SEGREDO)
    .update(`${cabeca}.${corpo}`)
    .digest("base64url");
  return {
    supabaseAdmin: createClient(
      "http://localhost:55443",
      `${cabeca}.${corpo}.${assin}`,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          // O supabase-js monta `${base}/rest/v1/<tabela>`, que e o caminho do
          // Supabase hospedado; o PostgREST cru serve na RAIZ.
          fetch: (input: RequestInfo | URL, init?: RequestInit) =>
            fetch(String(input).replace("/rest/v1", ""), init),
        },
      },
    ),
  };
});
// Avisos fora do escopo: o harness prova o banco e a API, nao o e-mail.
vi.mock("./email", () => ({ sendSentryTasksSummaryEmail: async () => {} }));
vi.mock("./targetedNotifications", () => ({
  createTargetedNotification: async () => {},
}));

import { syncSentryTasks } from "./sentryTaskIntake";

describe.skipIf(!ativo)("sync contra schema e Sentry reais", () => {
  it("dry-run com quadro ligado decide tudo e NAO escreve", async () => {
    const rel = await syncSentryTasks({ dryRun: true });
    expect(rel.estado).toBe("ok");
    expect(rel.quadrosProcessados).toBe(1);
    // Decidiu de verdade contra dados reais.
    expect(rel.criados.length).toBeGreaterThan(0);
    // E o banco continua vazio. Rode este teste PRIMEIRO, num banco limpo.
    expect(rel.ingestaoAbortada).toBeNull();
    expect(rel.manutencaoAbortada).toBeNull();
  }, 180000);

  it("run real cria, e a run seguinte e no-op", async () => {
    const primeira = await syncSentryTasks({ dryRun: false });
    expect(primeira.criados.length).toBeGreaterThan(0);
    expect(primeira.manutencaoAbortada).toBeNull();

    const segunda = await syncSentryTasks({ dryRun: false });
    // INVARIANTE 3 no caminho real: a mesma issue nao vira uma segunda tarefa.
    // Quem recusa e o indice unico, via `on conflict do nothing`.
    expect(segunda.criados).toHaveLength(0);
    // E a manutencao continua enxergando os cards, sem mover nenhum.
    expect(segunda.podados).toHaveLength(0);
    expect(segunda.reabertos).toHaveLength(0);
    expect(segunda.ressuscitados).toHaveLength(0);
  }, 300000);
});
