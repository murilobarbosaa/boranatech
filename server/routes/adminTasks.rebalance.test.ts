import { createClient } from "@supabase/supabase-js";
import express from "express";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Teste de INTEGRACAO da rota de tarefas contra um Postgres e um PostgREST de
// verdade, subidos em Docker. Nao e simulacao: a migration real e aplicada, o
// trigger de numeracao roda, e o supabase-js fala com um PostgREST autentico.
//
// Existe por um motivo especifico: o caminho de REBALANCEAMENTO de posicao
// (positionBetween devolvendo "rebalance", a coluna inteira sendo reescrita e o
// calculo refeito) so acontece depois de ~50 insercoes no MESMO intervalo. Nunca
// tinha rodado de verdade, nem no unit test (que cobre so a aritmetica pura), nem
// no uso normal. Um harness que nao chega la deixaria a orquestracao inteira sem
// nenhuma prova.
//
// PULA por padrao. Roda so com BNT_PGREST_URL apontando para o PostgREST de
// teste, entao o CI (que nao tem Docker) segue verde. Como subir:
//
//   docker network create bnt-test
//   docker run -d --name bnt-pg --network bnt-test -e POSTGRES_PASSWORD=test \
//     -p 55432:5432 postgres:16-alpine
//   # aplicar o prelude (schema auth, set_updated_at, role apirole) e a migration
//   docker run -d --name bnt-rest --network bnt-test -p 55433:3000 \
//     -e PGRST_DB_URI="postgres://postgres:test@bnt-pg:5432/postgres" \
//     -e PGRST_DB_ANON_ROLE=apirole -e PGRST_DB_SCHEMAS=public \
//     postgrest/postgrest:v12.2.3
//   BNT_PGREST_URL=http://localhost:55433 BNT_TEST_USER_ID=<uuid> pnpm vitest run \
//     server/routes/adminTasks.rebalance.test.ts

const PGREST_URL = process.env.BNT_PGREST_URL;
const TEST_USER_ID = process.env.BNT_TEST_USER_ID;
const PGREST_JWT = process.env.BNT_PGREST_JWT;
const enabled = Boolean(PGREST_URL && TEST_USER_ID && PGREST_JWT);

// Duas adaptacoes de HARNESS (nada delas existe em producao):
//
//  1. a chave precisa ser um JWT HS256 valido para o PGRST_JWT_SECRET do
//     container. O supabase-js sempre manda `Authorization: Bearer <key>`, e o
//     PostgREST tenta validar esse header; com uma string qualquer responde 401
//     e a rota vira db_error, reprovando o teste por motivo errado.
//  2. o supabase-js monta as URLs como `${base}/rest/v1/<tabela>`, que e o
//     caminho do Supabase hospedado. O PostgREST cru serve na RAIZ, entao o
//     prefixo vira 404. O fetch abaixo remove o prefixo. Foi exatamente esse
//     404 que apareceu como `error: {}` na primeira execucao, sem mensagem
//     nenhuma, porque o supabase-js nao preenche o erro em resposta sem corpo.
vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: createClient(
    process.env.BNT_PGREST_URL ?? "http://127.0.0.1:55433",
    process.env.BNT_PGREST_JWT ?? "",
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(String(input).replace("/rest/v1/", "/"), init),
      },
    },
  ),
}));

let server: Server;
let baseUrl = "";
let boardId = "";
let columnId = "";

async function api(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

async function createTask(
  title: string,
  placement: { before_task_id?: string | null; after_task_id?: string | null } = {},
) {
  const { status, body } = await api("/crm/tasks", {
    method: "POST",
    body: JSON.stringify({ board_id: boardId, column_id: columnId, title, ...placement }),
  });
  expect(status).toBe(201);
  return body as { id: string; position: number; number: number };
}

/** Ordem visual atual da coluna, lida do banco. */
async function columnOrder(): Promise<Array<{ id: string; title: string; position: number }>> {
  const { body } = await api(`/crm/boards/${boardId}/snapshot`);
  return (body as { tasks: Array<{ id: string; title: string; position: number; column_id: string }> })
    .tasks.filter((task) => task.column_id === columnId)
    .sort((a, b) => a.position - b.position)
    .map(({ id, title, position }) => ({ id, title, position }));
}

beforeAll(async () => {
  if (!enabled) return;
  const { default: tasksRouter } = await import("./adminTasks");
  const { errorHandler } = await import("../middleware/error");

  const app = express();
  app.use(express.json());
  // O router real nao tem guard local (herda requireAuth/requireAdmin de
  // admin.ts). Aqui injetamos o usuario direto: o alvo do teste e a camada de
  // dados, nao a autenticacao, que ja e exercitada em producao.
  app.use((req, _res, next) => {
    req.user = {
      id: TEST_USER_ID!,
      email: "harness@local",
      role: "authenticated",
      userMetadata: {},
    };
    next();
  });
  app.use("/crm", tasksRouter);
  app.use(errorHandler);

  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const suffix = String(process.pid).slice(-4);
  const created = await api("/crm/boards", {
    method: "POST",
    body: JSON.stringify({
      name: "Rebalance",
      key: `RB${suffix}`,
      slug: `rebalance-${suffix}`,
    }),
  });
  expect(created.status).toBe(201);
  boardId = (created.body as { id: string }).id;

  const column = await api("/crm/columns", {
    method: "POST",
    body: JSON.stringify({ board_id: boardId, name: "Fila" }),
  });
  expect(column.status).toBe(201);
  columnId = (column.body as { id: string }).id;
});

afterAll(async () => {
  if (!enabled) return;
  if (boardId) await api(`/crm/boards/${boardId}`, { method: "DELETE" });
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe.skipIf(!enabled)("adminTasks: posicao contra Postgres real", () => {
  it("before_task_id e after_task_id significam ACIMA e ABAIXO na ordem final", async () => {
    const first = await createTask("primeira");
    const last = await createTask("ultima");

    // Sem vizinhos: entram na ordem de criacao.
    expect((await columnOrder()).map((t) => t.title)).toEqual([
      "primeira",
      "ultima",
    ]);

    // ENTRE as duas: before = a de cima, after = a de baixo.
    await createTask("meio", {
      before_task_id: first.id,
      after_task_id: last.id,
    });
    expect((await columnOrder()).map((t) => t.title)).toEqual([
      "primeira",
      "meio",
      "ultima",
    ]);

    // So after = vai para o TOPO (nada acima dela).
    await createTask("topo", { after_task_id: first.id });
    expect((await columnOrder()).map((t) => t.title)).toEqual([
      "topo",
      "primeira",
      "meio",
      "ultima",
    ]);

    // So before = vai para o FIM (nada abaixo dela).
    await createTask("fim", { before_task_id: last.id });
    expect((await columnOrder()).map((t) => t.title)).toEqual([
      "topo",
      "primeira",
      "meio",
      "ultima",
      "fim",
    ]);
  });

  it("mover pelo endpoint /move respeita os mesmos vizinhos", async () => {
    const order = await columnOrder();
    const alvo = order.find((task) => task.title === "fim")!;
    const topo = order.find((task) => task.title === "topo")!;
    const primeira = order.find((task) => task.title === "primeira")!;

    const { status } = await api(`/crm/tasks/${alvo.id}/move`, {
      method: "PATCH",
      body: JSON.stringify({
        column_id: columnId,
        before_task_id: topo.id,
        after_task_id: primeira.id,
      }),
    });
    expect(status).toBe(200);

    expect((await columnOrder()).map((t) => t.title)).toEqual([
      "topo",
      "fim",
      "primeira",
      "meio",
      "ultima",
    ]);
  });

  // O teste que motiva o arquivo inteiro.
  it("insercao repetida no MESMO intervalo dispara o rebalanceamento e a ordem sobrevive", async () => {
    const inicio = await columnOrder();
    const acima = inicio[0];
    const abaixo = inicio[1];

    // Cada nova tarefa entra entre `acima` e a ANTERIOR, ou seja, sempre no
    // mesmo intervalo, que e o que esgota a precisao do double.
    let vizinhoDeBaixo = abaixo.id;
    const inseridas: string[] = [];
    for (let i = 0; i < 60; i += 1) {
      const nova = await createTask(`meio-${i}`, {
        before_task_id: acima.id,
        after_task_id: vizinhoDeBaixo,
      });
      inseridas.push(nova.id);
      vizinhoDeBaixo = nova.id;
    }

    const final = await columnOrder();

    // 1. Nenhuma posicao duplicada: e assim que o esgotamento de precisao se
    //    manifestaria, com dois cards empatados e ordem indefinida.
    const posicoes = final.map((task) => task.position);
    expect(new Set(posicoes).size).toBe(posicoes.length);

    // 2. Estritamente crescente.
    for (let i = 1; i < posicoes.length; i += 1) {
      expect(posicoes[i]).toBeGreaterThan(posicoes[i - 1]);
    }

    // 3. A ordem pedida foi respeitada: cada insercao ficou ABAIXO da anterior,
    //    entao meio-0 ... meio-59 aparecem em ordem inversa de criacao.
    const titulos = final.map((task) => task.title);
    const meios = titulos.filter((title) => title.startsWith("meio-"));
    const esperado = inseridas
      .map((_, i) => `meio-${inseridas.length - 1 - i}`)
      .filter((title) => meios.includes(title));
    expect(meios).toEqual(esperado);

    // 4. Nada se perdeu.
    expect(final).toHaveLength(inicio.length + 60);

    // 5. O rebalanceamento ACONTECEU DE FATO.
    //
    //    Uma assercao do tipo "alguma posicao e multiplo de 1000" passaria mesmo
    //    sem rebalanceamento nenhum, porque as tarefas criadas no fim da coluna
    //    ja nascem em multiplos de 1000. Seria o instrumento medindo uma
    //    superficie menor que a que parece medir.
    //
    //    O sinal inequivoco e outro: inserir ENTRE dois cards nunca toca a linha
    //    dos vizinhos. Se a posicao de um card que ninguem moveu mudou, foi
    //    porque a coluna inteira foi reescrita, que e exatamente o que o
    //    rebalanceamento faz e a unica coisa que faz isso.
    const acimaDepois = final.find((task) => task.id === acima.id)!;
    expect(acimaDepois.position).not.toBe(acima.position);
  }, 120_000);
});
