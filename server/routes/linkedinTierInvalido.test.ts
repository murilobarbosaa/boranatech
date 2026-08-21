import express from "express";
import { describe, expect, it } from "vitest";

import { criarClienteAdmin } from "./adminTestClient";
import { createError } from "../middleware/error";
import {
  computeLinkedinScore,
  LinkedinDadoInvalidoError,
  type LinkedinCheckResult,
} from "../../shared/linkedin/schema";

/**
 * Tier fora do catalogo: a nota LANCA em vez de sair `NaN`.
 *
 * Antes desta mudanca, `TIER_WEIGHTS[check.tier]` devolvia `undefined` para um
 * tier desconhecido, `possivel += undefined` virava `NaN`, e a nota inteira
 * saia `NaN` sem erro nenhum. Nota errada que se propaga como dado sobrevive a
 * qualquer verificacao que pergunte "respondeu?" em vez de "respondeu o que?".
 *
 * O que este arquivo prova, e o que ele NAO prova:
 *
 *   PROVA 1 (unitaria): `computeLinkedinScore` lanca, e a mensagem nomeia o
 *   tier recebido e o `check.id`. Sem os dois, o evento no Sentry diz "erro ao
 *   calcular a nota" e o diagnostico recomeca do zero.
 *
 *   PROVA 2 (de rota, HTTP real): um handler async com o MESMO formato do
 *   `/analyze` (try/catch que separa `LinkedinDadoInvalidoError` do ramo
 *   generico) responde 500 `analysis_data_invalid` com JSON, atravessando o
 *   `errorHandler` REAL de producao. Nao e tela branca e nao e conexao
 *   derrubada.
 *
 *   NAO PROVA que o `/analyze` de verdade foi exercitado: montar aquele router
 *   exige duble de supabase, de openai, de cota e de auth. O que esta abaixo
 *   reproduz o formato do catch, que esta citado no comentario do caso, e o
 *   resto do caminho (Express, errorHandler, serializacao) e o real.
 *
 * SOBRE O CODIGO HTTP. O ramo generico do catch do `/analyze` devolve
 * `502 upstream_error`, que estava errado para esta causa: a mensagem ao
 * usuario sugere falha de terceiro quando o problema e dado nosso, e quem
 * fosse diagnosticar comecaria olhando a OpenAI. Agora `LinkedinDadoInvalidoError`
 * tem ramo proprio: `500 analysis_data_invalid`. 500 e nao 502 porque nao ha
 * upstream envolvido, e o `errorHandler` reporta ao Sentry a partir de 500.
 */

function check(
  id: string,
  tier: string,
  aprovado: boolean,
): LinkedinCheckResult {
  return {
    id,
    tier,
    label: id,
    detail: "",
    aprovado,
    category: "apresentacao",
  } as unknown as LinkedinCheckResult;
}

describe("computeLinkedinScore com tier fora do catalogo", () => {
  it("continua calculando normalmente com os tres tiers validos", () => {
    const r = computeLinkedinScore([
      check("a", "essencial", true),
      check("b", "importante", false),
      check("c", "opcional", true),
    ]);
    // 10 + 3 de 19 = 68
    expect(r.score).toBe(68);
    expect(Number.isNaN(r.score)).toBe(false);
  });

  it("PROVA 1: LANCA, e nao devolve NaN", () => {
    expect(() =>
      computeLinkedinScore([
        check("headline-existe", "essencial", true),
        check("skills-quantidade", "tier-que-nao-existe", true),
      ]),
    ).toThrow(/tier fora do catalogo/);
  });

  it("a mensagem nomeia o tier recebido E o check.id", () => {
    let msg = "";
    try {
      computeLinkedinScore([check("skills-quantidade", "premium", true)]);
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
    expect(msg).toContain("premium");
    expect(msg).toContain("skills-quantidade");
    expect(msg).toContain("essencial, importante, opcional");
  });

  it("trava a premissa: o mapa cru devolvia undefined, e por isso o NaN", () => {
    // Se alguem "simplificar" o throw de volta para um acesso direto, este
    // teste documenta o que acontecia: a soma envenenada.
    const pesos = { essencial: 10, importante: 6, opcional: 3 } as Record<
      string,
      number
    >;
    expect(pesos["tier-que-nao-existe"]).toBeUndefined();
    expect(0 + pesos["tier-que-nao-existe"]).toBeNaN();
  });
});

describe("a excecao e TIPADA, para a rota poder distinguir a origem", () => {
  it("lanca LinkedinDadoInvalidoError, nao um Error cru", () => {
    // Sem o tipo, o catch da rota nao consegue separar dado nosso de falha de
    // terceiro, e classificaria pela camada onde capturou em vez de pela
    // origem.
    let capturado: unknown = null;
    try {
      computeLinkedinScore([check("skills-quantidade", "corrompido", true)]);
    } catch (e) {
      capturado = e;
    }
    expect(capturado).toBeInstanceOf(LinkedinDadoInvalidoError);
    expect((capturado as Error).name).toBe("LinkedinDadoInvalidoError");
  });
});

describe("PROVA 2: a excecao vira resposta HTTP, nao tela branca", () => {
  // Formato do catch generico do `/analyze`, citado de server/routes/linkedin.ts.
  const router = express.Router();
  router.post("/analyze-fake", async (_req, res, next) => {
    try {
      computeLinkedinScore([check("skills-quantidade", "corrompido", true)]);
      res.json({ ok: true });
    } catch (err) {
      // Formato do catch do `/analyze` depois da distincao.
      if (err instanceof LinkedinDadoInvalidoError) {
        return next(
          createError(
            500,
            "analysis_data_invalid",
            "Algo saiu errado do nosso lado ao montar sua análise. Já registramos o problema. Tente de novo em instantes.",
          ),
        );
      }
      return next(
        createError(
          502,
          "upstream_error",
          "Não foi possível concluir a análise agora. Tente de novo.",
        ),
      );
    }
  });
  const chamar = criarClienteAdmin(router);

  it("responde 500 analysis_data_invalid, pelo errorHandler real", async () => {
    const r = await chamar("POST", "/analyze-fake", {});
    expect(r.status).toBe(500);
    expect(r.body?.error?.code).toBe("analysis_data_invalid");
    expect(typeof r.body?.error?.message).toBe("string");
  });

  it("a mensagem NAO culpa terceiro", async () => {
    const r = await chamar("POST", "/analyze-fake", {});
    const msg = String(r.body?.error?.message ?? "");
    expect(msg).toContain("do nosso lado");
    // `upstream_error` dizia "Nao foi possivel concluir a analise agora", que
    // manda o diagnostico para a integracao. Nao pode voltar.
    expect(r.body?.error?.code).not.toBe("upstream_error");
  });

  it("o corpo NAO carrega a mensagem interna com o tier", async () => {
    // O detalhe tecnico vai para o log/Sentry (statusCode >= 500 e reportado
    // pelo handler central), nunca para a resposta.
    const r = await chamar("POST", "/analyze-fake", {});
    expect(JSON.stringify(r.body)).not.toContain("corrompido");
  });
});
