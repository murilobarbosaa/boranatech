import { describe, expect, it, vi } from "vitest";

// Importar a rota carrega supabaseAdmin/env/email. Nada disso e exercitado
// aqui: o alvo e so o schema de querystring.
vi.mock("./../lib/supabaseAdmin", () => ({ supabaseAdmin: {} }));

import { SentryQuerySchema } from "./adminBugs";

/**
 * Trava a lista fechada de `statsPeriod`.
 *
 * `GET /organizations/{org}/issues/` do Sentry aceita EXATAMENTE '', '24h' e
 * '14d'. Qualquer outro valor responde 400 "Invalid stats_period" (achado
 * empirico ja registrado em server/lib/sentryApi.ts).
 *
 * A validacao anterior era um regex de FORMATO (/^\d{1,3}[hdwm]$/), que aceita
 * '90d', '3w' e '1m'. Validar formato num dominio fechado e o modo de falha
 * classico: o valor passa pela nossa porta, quebra na porta do outro, e volta
 * como 502 sem dizer que a causa foi um parametro que nunca deveria ter saido
 * daqui.
 *
 * Inalcancavel pela interface de hoje (a tela so oferece valores validos), e
 * por isso mesmo travado por teste: o dia em que a janela do feed do Sentry
 * virar configuravel e o dia em que isso deixa de ser teorico, e ninguem vai
 * lembrar do comentario.
 */

describe("SentryQuerySchema.statsPeriod", () => {
  it.each(["", "24h", "14d"])("aceita %o, que o Sentry aceita", (periodo) => {
    const r = SentryQuerySchema.safeParse({ statsPeriod: periodo });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.statsPeriod).toBe(periodo);
  });

  it.each(["90d", "30d", "3w", "1m", "7d", "1h"])(
    "recusa %o, que o Sentry devolveria 400",
    (periodo) => {
      // '7d' e '1h' entram na lista de propósito: sao sintaticamente
      // impecaveis e MESMO ASSIM invalidos. Sao eles que provam que a troca foi
      // de formato para dominio, e nao um regex um pouco mais apertado.
      expect(
        SentryQuerySchema.safeParse({ statsPeriod: periodo }).success,
      ).toBe(false);
    },
  );

  it("sem statsPeriod, o default continua sendo 14d", () => {
    const r = SentryQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.statsPeriod).toBe("14d");
  });

  it("o default de query continua is:unresolved", () => {
    // Controle negativo do escopo: a mudanca era so no statsPeriod, e este
    // teste fica vermelho se ela tiver derrubado o vizinho junto.
    const r = SentryQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.query).toBe("is:unresolved");
  });
});
