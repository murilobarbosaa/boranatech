import * as Sentry from "@sentry/node";
import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it } from "vitest";

import { erroEncadeavel } from "./supabaseError";

/**
 * O ENVELOPE DA CAUSA.
 *
 * POR QUE O DUBLE E UM CLIENTE DE VERDADE, e nao um objeto escrito a mao. O
 * teste anterior desta familia fabricava `new PostgrestError(...)` e passava.
 * Ele testava uma condicao que NAO acontece: a biblioteca so constroi essa
 * classe no modo `.throwOnError()`, e no modo `{ data, error }` que este projeto
 * usa ela devolve `JSON.parse(body)` puro. O teste afirmava a intencao do autor,
 * nao o comportamento do sistema, e por isso a cadeia ficou quebrada em
 * producao por semanas com a suite verde.
 *
 * Aqui o erro nasce de um `PostgrestClient` real com um `fetch` falso que
 * responde 409 com o corpo do PostgREST, que foi exatamente como a investigacao
 * de 2026-08-30 confirmou o formato.
 */

const CORPO_409 = {
  code: "23505",
  details:
    "Key (user_id)=(81129623-79a8-415c-be5c-30ae9f86d3af) already exists.",
  hint: null,
  message:
    'duplicate key value violates unique constraint "subscriptions_one_active_per_user"',
};

/** O erro exatamente como o supabase-js o entrega ao chamador. */
async function erroRealDoSupabase(
  corpo: Record<string, unknown> = CORPO_409,
  status = 409,
): Promise<unknown> {
  // O MESMO `createClient` que `server/lib/supabaseAdmin.ts` usa, com o `fetch`
  // trocado. Assim o erro atravessa a mesma pilha de producao, e nao uma
  // reproducao dela.
  const client = createClient("https://exemplo.supabase.co", "chave-de-teste", {
    global: {
      fetch: async () =>
        new Response(JSON.stringify(corpo), {
          status,
          headers: { "Content-Type": "application/json" },
        }),
    },
  });
  const { error } = await client.from("subscriptions").select("id");
  return error;
}

describe("o formato que a biblioteca entrega de verdade", () => {
  it("NAO e instancia de Error, e por isso o LinkedErrors o ignorava", async () => {
    // Esta e a premissa do modulo inteiro. Se um dia a biblioteca passar a
    // devolver instancia, este caso quebra e avisa que o envelope virou
    // redundante, em vez de ele ficar ali para sempre sem ninguem saber.
    const bruto = await erroRealDoSupabase();
    expect(bruto).not.toBeNull();
    expect(bruto instanceof Error).toBe(false);
    expect((bruto as { code?: string }).code).toBe("23505");
  });
});

describe("o envelope", () => {
  it("vira Error de verdade, que e o que o LinkedErrors exige", async () => {
    const envelopado = erroEncadeavel(await erroRealDoSupabase());
    expect(envelopado instanceof Error).toBe(true);
    expect((envelopado as Error).name).toBe("SupabaseError");
  });

  it("a mensagem carrega code, message e details", async () => {
    // Propriedade solta num Error nao viaja para o Sentry (o SDK monta a
    // exceção de name, message e stack), entao o que precisa ser lido tem que
    // estar no texto. No BUG-77 era o `details` que trazia o user_id afetado.
    const m = (erroEncadeavel(await erroRealDoSupabase()) as Error).message;
    expect(m).toContain("23505");
    expect(m).toContain("subscriptions_one_active_per_user");
    expect(m).toContain("81129623-79a8-415c-be5c-30ae9f86d3af");
  });

  it("hint nulo nao vira a palavra null no texto", async () => {
    const m = (erroEncadeavel(await erroRealDoSupabase()) as Error).message;
    expect(m).not.toContain("null");
    expect(m).not.toContain("undefined");
  });

  it("hint presente entra", async () => {
    const bruto = await erroRealDoSupabase({
      ...CORPO_409,
      hint: "Perhaps you meant the column x.",
    });
    expect((erroEncadeavel(bruto) as Error).message).toContain(
      "Perhaps you meant",
    );
  });

  it("preserva o objeto original, sem polui-lo na serializacao", async () => {
    const bruto = await erroRealDoSupabase();
    const env = erroEncadeavel(bruto) as Error & { original?: unknown };
    expect(env.original).toBe(bruto);
    // Nao enumeravel: nao vira ruido em JSON.stringify nem em console.error, que
    // ja recebem tudo pela mensagem.
    expect(Object.keys(env)).not.toContain("original");
  });
});

describe("A CADEIA, que e o que isto existe para produzir", () => {
  let evento: Sentry.Event | null = null;

  beforeEach(() => {
    evento = null;
    Sentry.init({
      dsn: "https://abc@o0.ingest.sentry.io/0",
      environment: "test",
      beforeSend(e) {
        evento = e;
        // Nunca sai da maquina: o teste le o evento montado e descarta.
        return null;
      },
    });
  });

  /** `createError` do projeto, reproduzido para nao arrastar o middleware. */
  function comCausa(causa: unknown): Error {
    const err = new Error("Erro ao gravar assinatura.") as Error & {
      statusCode?: number;
    };
    err.statusCode = 500;
    err.cause = causa;
    return err;
  }

  async function capturar(causa: unknown) {
    Sentry.captureException(comCausa(causa));
    await new Promise((r) => setTimeout(r, 300));
    return evento?.exception?.values ?? [];
  }

  it("SEM o envelope a cadeia NAO se forma (o defeito de producao)", async () => {
    const vals = await capturar(await erroRealDoSupabase());
    expect(vals).toHaveLength(1);
  });

  it("COM o envelope sao dois valores, e o segundo vem do cause", async () => {
    const vals = await capturar(erroEncadeavel(await erroRealDoSupabase()));

    expect(vals).toHaveLength(2);
    const encadeado = vals.find((v) => v.mechanism?.source === "cause");
    expect(encadeado).toBeTruthy();
    expect(encadeado?.type).toBe("SupabaseError");
    expect(String(encadeado?.value)).toContain("23505");
  });
});

describe("entradas atipicas", () => {
  it("CONTROLE NEGATIVO: Error de verdade passa intacto, sem envelope duplo", () => {
    const original = new TypeError("ja era Error");
    const saida = erroEncadeavel(original);
    // Mesma referencia: nao cria elo a mais nem apaga o `name` real, que e o
    // que identifica a falha (GithubFetchError, AbortError).
    expect(saida).toBe(original);
    expect((saida as Error).name).toBe("TypeError");
  });

  it("null e undefined voltam como vieram", () => {
    expect(erroEncadeavel(null)).toBeNull();
    expect(erroEncadeavel(undefined)).toBeUndefined();
  });

  it("string vira Error sem campo inventado", () => {
    const saida = erroEncadeavel("falha crua") as Error;
    expect(saida instanceof Error).toBe(true);
    expect(saida.message).toBe("falha crua");
    // Sem `code` fabricado: quem ler o evento nao pode achar que houve um.
    expect(saida.message).not.toContain("[");
  });

  it("objeto SEM message vira Error, tambem sem inventar", () => {
    const saida = erroEncadeavel({ code: "42501" }) as Error;
    expect(saida instanceof Error).toBe(true);
    expect(saida.message).toContain("object");
    expect((saida as Error & { original?: unknown }).original).toEqual({
      code: "42501",
    });
  });

  it("message vazia cai no ramo generico, nao vira Error de mensagem vazia", () => {
    const saida = erroEncadeavel({ message: "   ", code: "x" }) as Error;
    expect(saida.message.trim()).not.toBe("");
  });
});
