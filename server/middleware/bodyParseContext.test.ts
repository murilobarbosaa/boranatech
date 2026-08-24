import { describe, expect, it } from "vitest";

import { bodyParseContext } from "./error";

/**
 * Contexto do 500 `stream is not readable` (NODE-EXPRESS-B).
 *
 * O evento chega com stack `readStream -> getRawBody -> jsonParser` e NAO diz a
 * unica coisa que decide o conserto: quais headers a requisicao trazia. A
 * hipotese registrada em FavoritesContext.tsx e que o `express.json()` global
 * decide ler o corpo pelos HEADERS, e que a borda do Railway acrescenta
 * `Transfer-Encoding: chunked` em requisicao sem `Content-Length`. Sem medir
 * isso, qualquer correcao no parser global e chute sobre 100% das rotas.
 *
 * DETECCAO POR CAMPO, NAO POR MENSAGEM. O `raw-body` constroi o erro assim:
 *
 *   node_modules/.pnpm/raw-body@*\/node_modules/raw-body/index.js:185-186
 *     return done(createError(500, 'stream is not readable', {
 *       type: 'stream.not.readable'
 *     }))
 *
 * `type` e campo fechado da biblioteca; a mensagem e texto que pode mudar numa
 * atualizacao sem aviso. Casar a mensagem seria a classe de instrumento que este
 * projeto ja viu falhar PASSANDO.
 */

function req(headers: Record<string, unknown> = {}) {
  return { headers, method: "POST", path: "/api/consent" };
}

const erroDoParser = Object.assign(new Error("stream is not readable"), {
  type: "stream.not.readable",
  status: 500,
  statusCode: 500,
});

describe("bodyParseContext", () => {
  it("monta o contexto com os headers que decidem o diagnostico", () => {
    const ctx = bodyParseContext(
      erroDoParser,
      req({
        "content-length": "42",
        "transfer-encoding": "chunked",
        "content-type": "application/json",
      }),
    );

    expect(ctx).toEqual({
      contentLength: "42",
      transferEncoding: "chunked",
      contentType: "application/json",
      method: "POST",
      route: "/api/consent",
    });
  });

  it("header ausente vira null explicito, nao some do contexto", () => {
    const ctx = bodyParseContext(erroDoParser, req({}));

    // O caso do FavoritesContext e exatamente "sem Content-Length": a AUSENCIA
    // e o dado, entao ela precisa aparecer no evento.
    expect(ctx).toEqual({
      contentLength: null,
      transferEncoding: null,
      contentType: null,
      method: "POST",
      route: "/api/consent",
    });
  });

  /**
   * CONTROLE NEGATIVO. Sem ele, uma deteccao larga (por exemplo `statusCode ===
   * 500`, ou um `includes("stream")` na mensagem) passaria nos dois testes
   * acima e carimbaria `body_parse` em TODO 500 do servidor, tornando o
   * contexto inutil justamente por estar em todo lugar.
   */
  it("CONTROLE NEGATIVO: 500 comum NAO ganha contexto de body parse", () => {
    expect(bodyParseContext(new Error("qualquer coisa"), req())).toBeNull();
    expect(
      bodyParseContext(
        Object.assign(new Error("falhou"), { statusCode: 500 }),
        req(),
      ),
    ).toBeNull();
  });

  /**
   * CONTROLE NEGATIVO 2: o vizinho mais proximo. `request aborted` sai da MESMA
   * biblioteca, no mesmo caminho de leitura (raw-body/index.js:245-250), e e um
   * problema diferente. Se ele casasse, os dois se confundiriam no painel.
   */
  it("CONTROLE NEGATIVO: 'request.aborted' da mesma lib nao casa", () => {
    const aborted = Object.assign(new Error("request aborted"), {
      type: "request.aborted",
      status: 400,
    });

    expect(bodyParseContext(aborted, req())).toBeNull();
  });

  it("aguenta erro nulo e requisicao sem headers, sem lancar", () => {
    expect(bodyParseContext(null, req())).toBeNull();
    expect(bodyParseContext(undefined, req())).toBeNull();
    expect(
      bodyParseContext(erroDoParser, {
        headers: undefined,
        method: undefined,
        path: undefined,
      }),
    ).toEqual({
      contentLength: null,
      transferEncoding: null,
      contentType: null,
      method: "unknown",
      route: "unknown",
    });
  });
});
