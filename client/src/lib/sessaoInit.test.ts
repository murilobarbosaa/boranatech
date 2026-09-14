import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CLASSE_SESSAO_PERSISTIDA,
  chaveDaSessaoSupabase,
} from "./persistedSession";

/**
 * "ENTRAR" DO HTML ESTATICO PARA QUEM ESTA LOGADO (lote Home 03, item D).
 *
 * O HTML pre-renderizado sai do prerender sem sessao, entao traz "Entrar" e
 * "Cadastre-se agora". Ate o React montar, quem esta logado via esses links.
 * `client/public/sessao-init.js` roda antes do CSS, ve a chave de sessao do
 * supabase-js e marca o <html>; o CSS esconde so os links marcados pelo
 * prerender. O script nao pode importar nada, entao a forma da chave esta
 * duplicada com `chaveDaSessaoSupabase`, e o primeiro bloco daqui trava as duas
 * juntas: rodando o script de verdade contra a chave que a funcao gera.
 *
 * Arquivo `.ts` pelo mesmo motivo do overlayZIndex.test.ts: e onde
 * `import.meta.dirname` aponta para o disco.
 */

const RAIZ = path.resolve(import.meta.dirname, "../../..");

function ler(relativo: string): string {
  return readFileSync(path.join(RAIZ, relativo), "utf8");
}

type Armazenamento = string[] | "indisponivel";

function rodarScript(chaves: Armazenamento): string[] {
  const classes: string[] = [];
  const janela =
    chaves === "indisponivel"
      ? {
          get localStorage(): never {
            throw new Error("SecurityError");
          },
        }
      : {
          localStorage: {
            get length() {
              return chaves.length;
            },
            key: (i: number) => chaves[i] ?? null,
          },
        };
  const documento = {
    documentElement: { classList: { add: (c: string) => classes.push(c) } },
  };
  new Function("window", "document", ler("client/public/sessao-init.js"))(
    janela,
    documento,
  );
  return classes;
}

describe("sessao-init.js", () => {
  it.each(["https://abcdefgh.supabase.co", "https://auth-bnt.exemplo.com.br/"])(
    "marca o <html> com a chave que chaveDaSessaoSupabase gera (%s)",
    (url) => {
      const chave = chaveDaSessaoSupabase(url);
      expect(chave).not.toBeNull();
      expect(rodarScript(["bnt-theme", chave as string])).toEqual([
        CLASSE_SESSAO_PERSISTIDA,
      ]);
    },
  );

  it("o code-verifier do PKCE sozinho nao e sessao", () => {
    expect(rodarScript(["sb-abcdefgh-auth-token-code-verifier"])).toEqual([]);
  });

  it("sem chave de sessao nao marca nada", () => {
    expect(rodarScript([])).toEqual([]);
    expect(rodarScript(["bnt-theme", "bnt_consent", "ph_abc_posthog"])).toEqual(
      [],
    );
  });

  it("localStorage indisponivel nao derruba a pagina e nao marca", () => {
    expect(rodarScript("indisponivel")).toEqual([]);
  });
});

describe("ligacao do sessao-init.js", () => {
  it("o index.html carrega o script no <head>, depois do theme-init e antes do bundle", () => {
    const html = ler("client/index.html");
    const tag = html.indexOf('<script src="/sessao-init.js"></script>');
    expect(tag).toBeGreaterThan(-1);
    expect(tag).toBeGreaterThan(html.indexOf('src="/theme-init.js"'));
    expect(tag).toBeLessThan(html.indexOf("</head>"));
    expect(tag).toBeLessThan(html.indexOf('type="module"'));
  });

  it("o index.css esconde so o que o prerender marcou", () => {
    const css = ler("client/src/index.css");
    const regra = new RegExp(
      `\\.${CLASSE_SESSAO_PERSISTIDA}\\s+\\[data-auth-estatico\\]\\s*\\{[^}]*visibility:\\s*hidden`,
    );
    expect(css).toMatch(regra);
  });

  it("o App libera a marca na montagem", () => {
    const app = ler("client/src/App.tsx");
    expect(app).toMatch(
      /useEffect\(\s*\(\)\s*=>\s*\{\s*liberarMarcaDeSessaoEstatica\(\);?\s*\},\s*\[\]\s*\)/,
    );
  });
});
