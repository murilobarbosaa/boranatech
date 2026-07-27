import { describe, expect, it } from "vitest";

import { classificarRls, type LeituraContagem } from "./rlsVeredito";

const ok = (n: number): LeituraContagem => ({ tipo: "ok", n });
const revoke: LeituraContagem = { tipo: "sem-privilegio" };
const erro: LeituraContagem = { tipo: "erro", detalhe: "HTTP 502" };

describe("veredito de RLS: o terceiro estado", () => {
  it("REVOKE (42501) conta como PROTEGIDA, nunca exposta", () => {
    // Observado em producao na billing_orphan_payments: a leitura anon devolve
    // HTTP 401 com code 42501 (insufficient_privilege), nao zero linhas. E uma
    // defesa mais forte que RLS: o Postgres barra antes de qualquer policy.
    const v = classificarRls(ok(174), revoke, false);
    expect(v.veredito).toBe("protegida-por-privilegio");
  });

  it("REVOKE e distinto de RLS ativa: sao dois vereditos diferentes", () => {
    expect(classificarRls(ok(174), revoke, false).veredito).toBe(
      "protegida-por-privilegio",
    );
    expect(classificarRls(ok(174), ok(0), false).veredito).toBe(
      "protegida-por-policy",
    );
  });

  it("REVOKE nunca vira falha do instrumento", () => {
    const v = classificarRls(ok(174), revoke, false);
    expect(v.veredito).not.toBe("inconclusiva");
    expect(v.veredito).not.toBe("exposta");
  });

  it("ERRO na leitura anon vira INCONCLUSIVA, nao protegida", () => {
    // Regressao real: a versao anterior devolvia -1 para qualquer resposta
    // nao-ok e o chamador tratava `<= 0` como protegida, entao uma falha de
    // rede contava como sucesso.
    const v = classificarRls(ok(174), erro, false);
    expect(v.veredito).toBe("inconclusiva");
    expect(v.veredito).not.toBe("protegida-por-policy");
  });

  it("tabela vazia continua inconclusiva, nunca verde", () => {
    expect(classificarRls(ok(0), ok(0), false)).toEqual({
      veredito: "inconclusiva",
      motivo: "vazia",
    });
  });

  it("anon lendo linhas SEM policy publica e exposicao", () => {
    const v = classificarRls(ok(8019), ok(2348), false);
    expect(v.veredito).toBe("exposta");
  });

  it("anon lendo linhas COM policy publica declarada nao e exposicao", () => {
    expect(classificarRls(ok(79), ok(79), true).veredito).toBe(
      "publica-declarada",
    );
  });

  it("service role sem privilegio tambem e inconclusiva", () => {
    expect(classificarRls(revoke, null, false).veredito).toBe("inconclusiva");
  });
});
