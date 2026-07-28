import { describe, expect, it } from "vitest";

import {
  avaliarAmbiente,
  ESCOTILHA,
  mensagemDaEscotilha,
  mensagemDeAbort,
  REF_SUPABASE_PRODUCAO,
  type EntradaAmbiente,
} from "./ambienteSeguro";

const PROD_URL = `https://${REF_SUPABASE_PRODUCAO}.supabase.co`;

function entrada(over: Partial<EntradaAmbiente> = {}): EntradaAmbiente {
  return {
    nodeEnv: "development",
    stripeSecretKey: "sk_test_seguro",
    supabaseUrl: "http://localhost:54321",
    escotilhaLigada: false,
    ...over,
  };
}

describe("avaliarAmbiente", () => {
  it("dev com chave de teste e supabase local passa", () => {
    expect(avaliarAmbiente(entrada())).toEqual({ tipo: "ok" });
  });

  // Producao com credencial de producao e o esperado: guarda que reclama ali
  // vira alarme que se aprende a ignorar.
  it("producao nunca e barrada, nem com sk_live e supabase de producao", () => {
    expect(
      avaliarAmbiente(
        entrada({
          nodeEnv: "production",
          stripeSecretKey: "sk_live_real",
          supabaseUrl: PROD_URL,
        }),
      ),
    ).toEqual({ tipo: "ok" });
  });

  it("dev com sk_live aborta", () => {
    const v = avaliarAmbiente(entrada({ stripeSecretKey: "sk_live_real" }));
    expect(v.tipo).toBe("abortar");
    expect(v).toMatchObject({ achados: [expect.stringContaining("sk_live_")] });
  });

  it("dev apontando para o supabase de producao aborta", () => {
    const v = avaliarAmbiente(entrada({ supabaseUrl: PROD_URL }));
    expect(v.tipo).toBe("abortar");
    expect(v).toMatchObject({
      achados: [expect.stringContaining(REF_SUPABASE_PRODUCAO)],
    });
  });

  it("os dois problemas juntos rendem os DOIS achados, nao o primeiro", () => {
    const v = avaliarAmbiente(
      entrada({ stripeSecretKey: "sk_live_real", supabaseUrl: PROD_URL }),
    );
    expect(v.tipo).toBe("abortar");
    expect((v as { achados: string[] }).achados).toHaveLength(2);
  });

  it("teste tambem e ambiente nao-producao e e barrado", () => {
    const v = avaliarAmbiente(
      entrada({ nodeEnv: "test", stripeSecretKey: "sk_live_real" }),
    );
    expect(v.tipo).toBe("abortar");
  });

  // Um projeto Supabase de DEV de verdade tem que passar sem ninguem mexer na
  // guarda: e por isso que o ref de producao e constante declarada, e nao a regra
  // "url remota == producao".
  it("projeto Supabase de dev (outro ref) passa", () => {
    expect(
      avaliarAmbiente(entrada({ supabaseUrl: "https://outroref123.supabase.co" })),
    ).toEqual({ tipo: "ok" });
  });

  describe("escotilha", () => {
    it("converte abort em aviso, sem virar ok", () => {
      const v = avaliarAmbiente(
        entrada({ stripeSecretKey: "sk_live_real", escotilhaLigada: true }),
      );
      expect(v.tipo).toBe("escotilha");
      // NAO e "ok": o boot precisa saber que tem de gritar.
      expect(v.tipo).not.toBe("ok");
    });

    it("nao inventa aviso quando o ambiente ja esta limpo", () => {
      expect(avaliarAmbiente(entrada({ escotilhaLigada: true }))).toEqual({
        tipo: "ok",
      });
    });
  });
});

describe("mensagens", () => {
  it("o abort diz o que fazer e nomeia a escotilha", () => {
    const m = mensagemDeAbort(["algo"]);
    expect(m).toContain("BOOT ABORTADO");
    expect(m).toContain("sk_test_");
    expect(m).toContain(ESCOTILHA);
    // Precisa dizer que script tem caminho proprio, senao alguem liga a
    // escotilha global para rodar um script.
    expect(m).toContain("--confirm");
  });

  it("o aviso da escotilha e alto e lista os achados", () => {
    const m = mensagemDaEscotilha(["achado A", "achado B"]);
    expect(m).toContain(ESCOTILHA);
    expect(m).toContain("achado A");
    expect(m).toContain("achado B");
    expect(m).toContain("cliente real");
  });
});
