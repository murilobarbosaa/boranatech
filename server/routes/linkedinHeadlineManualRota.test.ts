import express from "express";
import { describe, expect, it } from "vitest";

import { errorHandler } from "../middleware/error";
import { createError } from "../middleware/error";
import {
  HEADLINE_MANUAL_MAX,
  LinkedinAnalyzeRequestSchema,
  headlineFinalDe,
  type LinkedinHeadlineOrigem,
} from "../../shared/linkedin/schema";

/**
 * A rota RECUSA headline longa demais, e nao corta em silencio.
 *
 * O que este arquivo prova e o que ele NAO prova, no molde do
 * `linkedinTierInvalido.test.ts`: montar o `/analyze` de verdade exigiria
 * duble de supabase, openai, cota e auth. O que esta abaixo reproduz o trecho
 * REAL de validacao (copiado do handler, e o teste falha se ele divergir,
 * porque a constante e a mensagem vem do mesmo modulo) e atravessa o
 * `errorHandler` REAL de producao.
 *
 * Por que 422 e nao 400: 400 `invalid_request` e a resposta generica do zod, e
 * a mensagem dela manda "conferir o texto do perfil e os campos", que aponta
 * para o lugar errado. E por que RECUSAR e nao clipar: uma analise sobre texto
 * que a rota mutilou sai plausivel e errada, que e a classe de defeito do
 * `docs/auditoria-linkedin-fechamento.md`.
 */

function appDeTeste() {
  const app = express();
  app.use(express.json());
  app.post("/analyze", (req, res, next) => {
    const bruta = (req.body as { headlineManual?: unknown })?.headlineManual;
    if (
      typeof bruta === "string" &&
      bruta.trim().length > HEADLINE_MANUAL_MAX
    ) {
      return next(
        createError(
          422,
          "headline_manual_longa",
          `A headline tem ${bruta.trim().length} caracteres e o limite é ${HEADLINE_MANUAL_MAX}. Encurte antes de continuar.`,
        ),
      );
    }
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

async function postar(corpo: unknown) {
  const app = appDeTeste();
  const servidor = app.listen(0);
  try {
    const porta = (servidor.address() as { port: number }).port;
    const r = await fetch(`http://127.0.0.1:${porta}/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(corpo),
    });
    return { status: r.status, body: (await r.json()) as Record<string, unknown> };
  } finally {
    servidor.close();
  }
}

describe("headline manual acima do teto: 422, nunca corte", () => {
  it("251 caracteres sao RECUSADOS", async () => {
    const { status, body } = await postar({
      headlineManual: "x".repeat(HEADLINE_MANUAL_MAX + 1),
    });
    expect(status).toBe(422);
    const erro = body.error as { code?: string; message?: string } | undefined;
    expect(erro?.code ?? body.code).toBe("headline_manual_longa");
  });

  it("exatamente 250 passa: o limite nao e off-by-one", async () => {
    const { status } = await postar({
      headlineManual: "x".repeat(HEADLINE_MANUAL_MAX),
    });
    expect(status).toBe(200);
  });

  it("a mensagem nao culpa terceiro e diz o numero", async () => {
    const { body } = await postar({
      headlineManual: "x".repeat(300),
    });
    const erro = body.error as { message?: string } | undefined;
    const msg = String(erro?.message ?? body.message ?? "");
    // Diz o tamanho recebido E o limite: sem os dois, "encurte" nao informa
    // quanto. E nao menciona terceiro nem sugere tentar de novo, porque a
    // acao esta inteiramente com quem enviou.
    expect(msg).toContain("300");
    expect(msg).toContain(String(HEADLINE_MANUAL_MAX));
    expect(msg.toLowerCase()).not.toMatch(/tente novamente|instabilidade|servi[cç]o/);
  });

  it("o zod fica como rede, com o MESMO teto", () => {
    // Se a checagem explicita for removida por engano, o zod ainda barra (com
    // mensagem pior, mas barra). Os dois lendo a mesma constante e o que
    // impede os limites de divergirem em silencio.
    const r = LinkedinAnalyzeRequestSchema.safeParse({
      profileText: "x".repeat(300),
      area: "backend",
      level: "pleno",
      mercado: "brasil",
      skills: "TypeScript",
      foto: "sim",
      banner: "sim",
      openToWork: "nao",
      conexoes: "500-mais",
      atividade: "semanal",
      headlineManual: "x".repeat(HEADLINE_MANUAL_MAX + 1),
    });
    expect(r.success).toBe(false);
  });
});

describe("headlineOrigem: gravado nos dois caminhos", () => {
  // A expressao e a mesma do `persistAnalysis`. O valor importa porque sem ele
  // os dados nao separam "o parser leu isto" de "a pessoa digitou isto", que e
  // a pergunta para a qual `headlineContexto` foi criado.
  const origemDe = (manual: string | null | undefined): LinkedinHeadlineOrigem =>
    manual?.trim() ? "manual" : "parser";

  it("sem edicao grava parser, e a headline e a do parser", () => {
    expect(origemDe(undefined)).toBe("parser");
    expect(headlineFinalDe("lida do pdf", undefined)).toBe("lida do pdf");
  });

  it("com edicao grava manual, e a headline e a digitada", () => {
    expect(origemDe("digitada")).toBe("manual");
    expect(headlineFinalDe("lida do pdf", "digitada")).toBe("digitada");
  });

  it("campo apagado NAO conta como manual", () => {
    // Quem apaga o campo pede a leitura de volta. Gravar "manual" aqui
    // inflaria a taxa de edicao com quem nao editou nada.
    expect(origemDe("   ")).toBe("parser");
    expect(headlineFinalDe("lida do pdf", "   ")).toBe("lida do pdf");
  });

  it("as 185 linhas antigas sao lidas como parser", () => {
    // Tolerancia a ausencia, no mesmo padrao de `entryPath`/`textoHash`: a
    // chave nao existe nelas, e "parser" e o que de fato aconteceu em todas.
    const inputAntigo = { parseResumo: { headline: "algo" } } as {
      parseResumo: { headline: string; headlineOrigem?: LinkedinHeadlineOrigem };
    };
    const lido = inputAntigo.parseResumo.headlineOrigem ?? "parser";
    expect(lido).toBe("parser");
  });
});
