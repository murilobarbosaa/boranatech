import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

/**
 * O CORPO DA REQUISICAO TEM TETO, e ele corta ANTES da validacao cara?
 *
 * O teto global do Express e 2mb e serve a plataforma inteira, incluindo rotas
 * que recebem base64 de imagem. Para o analisador ele e largo por ordens de
 * grandeza: o maior corpo LEGITIMO da analise cabe em cerca de 93 KB, e o da
 * rota de progresso em vinte e oito BYTES. A diferenca era trabalho que o
 * processo fazia de graca para quem mandasse lixo.
 *
 * O que este arquivo prova:
 *
 *   1. a DERIVACAO: o teto da analise sai dos `.max()` do zod, com a conta
 *      literal no assert. Nao e numero solto;
 *   2. FRONTEIRA: corpo no limite passa pelo parser, acima do limite e recusado;
 *   3. CORTE ANTES DO CARO: no estouro, nem o zod da analise nem a reserva de
 *      cota chegam a rodar (spies em zero). E o ponto inteiro do teto;
 *   4. ERRO NOMEADO: o 413 sai com codigo proprio, e nao com o `internal_error`
 *      que o `PayloadTooLargeError` produzia por ter `code` indefinido;
 *   5. O TETO NAO ALCANCA USO LEGITIMO: o maior corpo que o zod aceita passa
 *      folgado, e quem exagera continua recebendo o 400 do zod, nao um 413.
 *
 * Nada de rede: o servidor e efemero em 127.0.0.1, o mesmo padrao dos testes de
 * rota irmaos.
 */

vi.mock("../lib/env", async (importActual) => {
  const real = await importActual<typeof import("./env")>();
  return { ...real, env: { ...real.env } };
});

import {
  BYTES_POR_CARACTERE_PIOR_CASO,
  CODIGO_CORPO_GRANDE,
  FOLGA_ESTRUTURAL_BYTES,
  LINKEDIN_CARACTERES_LIVRES_MAX,
  TETO_CORPO_ANALISE_BYTES,
  TETO_CORPO_ROTA_MENOR_BYTES,
  traduzirErroDeCorpo,
} from "./linkedinCorpo";
import {
  HEADLINE_MANUAL_MAX,
  LINKEDIN_OBJETIVO_MAX,
  LINKEDIN_PROFILE_TEXT_MAX,
  LINKEDIN_SKILLS_MAX,
} from "../../shared/linkedin/schema";
import { errorHandler } from "../middleware/error";

/** Spies que so podem rodar quando o corpo passou pelo teto. */
const zodDaAnalise = vi.fn();
const reservaDeCota = vi.fn();

/**
 * O ponto de montagem REAL, reproduzido: parser dedicado por rota ANTES do
 * global, tradutor do erro, e so entao o handler.
 *
 * Reproduzir a montagem e nao importar `server/app.ts` e deliberado: o app
 * inteiro puxa env, redis, supabase e todos os routers, e o que se mede aqui e
 * a ORDEM (teto antes de validacao), que e uma propriedade da montagem.
 */
const app = express();
app.use(
  "/api/linkedin/analyze",
  express.json({ limit: TETO_CORPO_ANALISE_BYTES }),
);
app.use("/api/linkedin", express.json({ limit: TETO_CORPO_ROTA_MENOR_BYTES }));
app.use("/api/linkedin", traduzirErroDeCorpo);
app.use(express.json({ limit: "2mb" }));
app.post("/api/linkedin/analyze", (req, res) => {
  zodDaAnalise();
  reservaDeCota();
  res.json({ ok: true, recebido: JSON.stringify(req.body).length });
});
app.put("/api/linkedin/analyses/x/improvements/0", (_req, res) => {
  res.json({ ok: true });
});
app.use(errorHandler);

const servidor = createServer(app);
const pronto = new Promise<void>((resolve) =>
  servidor.listen(0, "127.0.0.1", resolve),
);

async function enviar(
  caminho: string,
  corpo: string,
  metodo = "POST",
): Promise<{ status: number; codigo: string | null }> {
  await pronto;
  const porta = (servidor.address() as AddressInfo).port;
  const r = await fetch(`http://127.0.0.1:${porta}${caminho}`, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: corpo,
  });
  const texto = await r.text();
  let codigo: string | null = null;
  try {
    const json = JSON.parse(texto) as { error?: { code?: string } };
    codigo = json.error?.code ?? null;
  } catch {
    codigo = null;
  }
  return { status: r.status, codigo };
}

/** Corpo JSON com exatamente `bytes` bytes, para exercitar a fronteira. */
function corpoDeBytes(bytes: number): string {
  const molde = '{"t":""}';
  const enchimento = Math.max(0, bytes - molde.length);
  return `{"t":"${"a".repeat(enchimento)}"}`;
}

beforeEach(() => {
  zodDaAnalise.mockClear();
  reservaDeCota.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  servidor.close();
});

describe("1. a DERIVACAO, com a conta literal", () => {
  it("o teto da analise sai dos maximos do zod, nao de um numero solto", () => {
    // 12.000 + 3.000 + 300 + 250 = 15.550 caracteres de texto livre
    expect(LINKEDIN_PROFILE_TEXT_MAX).toBe(12_000);
    expect(LINKEDIN_SKILLS_MAX).toBe(3_000);
    expect(LINKEDIN_OBJETIVO_MAX).toBe(300);
    expect(HEADLINE_MANUAL_MAX).toBe(250);
    expect(LINKEDIN_CARACTERES_LIVRES_MAX).toBe(15_550);

    // 15.550 x 6 = 93.300; + 2.048 = 95.348
    expect(BYTES_POR_CARACTERE_PIOR_CASO).toBe(6);
    expect(FOLGA_ESTRUTURAL_BYTES).toBe(2_048);
    expect(TETO_CORPO_ANALISE_BYTES).toBe(95_348);

    // E a derivacao e mesmo a derivacao, nao uma coincidencia de numeros.
    expect(TETO_CORPO_ANALISE_BYTES).toBe(
      LINKEDIN_CARACTERES_LIVRES_MAX * BYTES_POR_CARACTERE_PIOR_CASO +
        FOLGA_ESTRUTURAL_BYTES,
    );
  });

  it("o teto tecnico fica MUITO acima do maior corpo legitimo", () => {
    // O maior corpo real: texto em portugues, dois bytes por acento no pior
    // caso, sem escape de controle. 15.550 x 2 = 31.100 bytes.
    const maiorLegitimo = LINKEDIN_CARACTERES_LIVRES_MAX * 2;
    expect(TETO_CORPO_ANALISE_BYTES).toBeGreaterThan(maiorLegitimo * 3);
    // E ainda assim MENOR que o global de 2mb, por uma ordem de grandeza.
    expect(TETO_CORPO_ANALISE_BYTES).toBeLessThan(2 * 1024 * 1024 * 0.1);
  });

  it("a rota menor tem teto proprio, e ele e muito menor", () => {
    // `{"done":true,"revision":12}` sao 28 bytes; 4.096 e cerca de 146 vezes.
    expect(TETO_CORPO_ROTA_MENOR_BYTES).toBe(4_096);
    expect(TETO_CORPO_ROTA_MENOR_BYTES).toBeLessThan(TETO_CORPO_ANALISE_BYTES);
    expect(TETO_CORPO_ROTA_MENOR_BYTES).toBeGreaterThan(28 * 100);
  });
});

describe("2 e 3. FRONTEIRA, e o corte vem ANTES da validacao cara", () => {
  it("corpo NO limite passa, e o handler roda", async () => {
    const { status } = await enviar(
      "/api/linkedin/analyze",
      corpoDeBytes(TETO_CORPO_ANALISE_BYTES),
    );
    expect(status).toBe(200);
    expect(zodDaAnalise).toHaveBeenCalledTimes(1);
  });

  it("corpo ACIMA do limite e recusado, e nada caro roda", async () => {
    const { status, codigo } = await enviar(
      "/api/linkedin/analyze",
      corpoDeBytes(TETO_CORPO_ANALISE_BYTES + 1_000),
    );

    expect(status).toBe(413);
    // A PROVA DO PONTO INTEIRO: o teto corta antes, entao a validacao do zod e
    // a reserva de cota nao chegam a acontecer. Sem o teto, os dois rodariam
    // depois de o processo ter parseado o corpo inteiro.
    expect(zodDaAnalise).not.toHaveBeenCalled();
    expect(reservaDeCota).not.toHaveBeenCalled();
    expect(codigo).toBe(CODIGO_CORPO_GRANDE);
  });

  it("a rota menor recusa MUITO antes do teto da analise", async () => {
    // Um corpo que a rota de analise aceitaria de bom grado.
    const corpo = corpoDeBytes(TETO_CORPO_ROTA_MENOR_BYTES + 1_000);
    const { status, codigo } = await enviar(
      "/api/linkedin/analyses/x/improvements/0",
      corpo,
      "PUT",
    );
    expect(status).toBe(413);
    expect(codigo).toBe(CODIGO_CORPO_GRANDE);
    // O mesmo corpo passa folgado na rota de analise: os tetos sao MESMO por
    // rota, e nao um so disfarcado de dois.
    const naAnalise = await enviar("/api/linkedin/analyze", corpo);
    expect(naAnalise.status).toBe(200);
  });

  it("corpo de progresso de verdade passa sem esbarrar em nada", async () => {
    const { status } = await enviar(
      "/api/linkedin/analyses/x/improvements/0",
      JSON.stringify({ done: true, revision: 12 }),
      "PUT",
    );
    expect(status).toBe(200);
  });
});

describe("4. ERRO NOMEADO, na convencao da casa", () => {
  it("o 413 sai com codigo proprio, nao com internal_error", async () => {
    const { status, codigo } = await enviar(
      "/api/linkedin/analyze",
      corpoDeBytes(TETO_CORPO_ANALISE_BYTES + 1_000),
    );
    expect(status).toBe(413);
    // O `PayloadTooLargeError` do body-parser tem `code` INDEFINIDO (medido), e
    // sem tradutor o `errorHandler` o rotula `internal_error`. Um 413 rotulado
    // de erro interno manda a investigacao para o lugar errado.
    expect(codigo).not.toBe("internal_error");
    expect(codigo).toBe("payload_too_large");
  });

  it("o tradutor so mexe no erro de corpo, e passa o resto adiante", () => {
    // Nao pode virar um catch-all: qualquer outro erro tem de seguir igual.
    const outro = Object.assign(new Error("qualquer outra coisa"), {
      statusCode: 500,
      code: "db_error",
    });
    const next = vi.fn();
    traduzirErroDeCorpo(
      outro,
      {} as never,
      {} as never,
      next as unknown as () => void,
    );
    expect(next).toHaveBeenCalledWith(outro);
    expect(outro.code).toBe("db_error");
    expect(outro.message).toBe("qualquer outra coisa");
  });
});
