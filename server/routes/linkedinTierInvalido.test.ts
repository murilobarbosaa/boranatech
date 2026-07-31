import express from "express";
import { describe, expect, it } from "vitest";

import { criarClienteAdmin } from "./adminTestClient";
import { createError } from "../middleware/error";
import {
  computeLinkedinScore,
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
 *   `/analyze` (try/catch que devolve `next(createError(502, ...))` no caso
 *   generico) responde 502 com JSON, atravessando o `errorHandler` REAL de
 *   producao. Nao e tela branca e nao e conexao derrubada.
 *
 *   NAO PROVA que o `/analyze` de verdade foi exercitado: montar aquele router
 *   exige duble de supabase, de openai, de cota e de auth. O que esta abaixo
 *   reproduz o formato do catch, que esta citado no comentario do caso, e o
 *   resto do caminho (Express, errorHandler, serializacao) e o real.
 *
 * ATENCAO ao codigo: e 502 `upstream_error`, NAO 500. O catch generico do
 * `/analyze` mapeia qualquer excecao nao reconhecida para 502, e um tier
 * corrompido cai nesse ramo. A mensagem ao usuario ("Nao foi possivel concluir
 * a analise agora") sugere falha de terceiro, quando a causa e dado nosso.
 * Fica registrado: nao e o codigo mais honesto para esta causa, mas mexer nele
 * muda o contrato de erro da rota e e outro item.
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

describe("PROVA 2: a excecao vira resposta HTTP, nao tela branca", () => {
  // Formato do catch generico do `/analyze`, citado de server/routes/linkedin.ts.
  const router = express.Router();
  router.post("/analyze-fake", async (_req, res, next) => {
    try {
      computeLinkedinScore([check("skills-quantidade", "corrompido", true)]);
      res.json({ ok: true });
    } catch {
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

  it("responde 502 com JSON de erro, pelo errorHandler real", async () => {
    const r = await chamar("POST", "/analyze-fake", {});
    expect(r.status).toBe(502);
    expect(r.body?.error?.code).toBe("upstream_error");
    expect(typeof r.body?.error?.message).toBe("string");
  });

  it("o corpo NAO carrega a mensagem interna com o tier", async () => {
    // O detalhe tecnico vai para o log/Sentry (statusCode >= 500 e reportado
    // pelo handler central), nunca para a resposta.
    const r = await chamar("POST", "/analyze-fake", {});
    expect(JSON.stringify(r.body)).not.toContain("corrompido");
  });
});
