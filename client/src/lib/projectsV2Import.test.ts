import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Guard de BUNDLE, nao de tipo.
//
// O detalhe v2 mora em um modulo por projeto justamente para nao entrar no
// chunk compartilhado do client: `shared/projects/catalog.ts` ja tem 269 KB e
// e reexportado por `client/src/lib/data.ts`, que dezenas de arquivos
// importam. Com as 266 entradas migradas, o detalhe passaria de 2 MB.
//
// Um `import { PROJETOS_V2 } from "@shared/projects/v2/all"` numa tela desfaz
// isso de uma vez, sem erro de tipo, sem teste vermelho e sem ninguem
// perceber: a pagina continua funcionando, so fica pesada. Este teste e a
// unica coisa que separa as duas situacoes.
//
// O client pode importar `@shared/projects/v2` (o indice, que so tem os ids e
// os loaders) e `@shared/projects/v2/types`. Nada mais.

const CLIENT_SRC = path.resolve(import.meta.dirname, "..");
const PERMITIDOS = new Set([
  "@shared/projects/v2",
  "@shared/projects/v2/index",
  "@shared/projects/v2/types",
]);

function arquivosDeCodigo(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const completo = path.join(dir, nome);
    if (statSync(completo).isDirectory()) return arquivosDeCodigo(completo);
    return /\.(ts|tsx)$/.test(nome) ? [completo] : [];
  });
}

// Casa `from "..."` e `import("...")`, que sao as duas formas de puxar o
// modulo. So o especificador interessa.
const ESPECIFICADOR = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;

describe("client nao importa o v2 inteiro", () => {
  it("nenhum arquivo de client/src importa all.ts nem um modulo v2 direto", () => {
    const ofensores: string[] = [];
    for (const arquivo of arquivosDeCodigo(CLIENT_SRC)) {
      if (arquivo.endsWith("projectsV2Import.test.ts")) continue;
      const src = readFileSync(arquivo, "utf8");
      ESPECIFICADOR.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = ESPECIFICADOR.exec(src)) !== null) {
        const spec = m[1];
        if (!spec.includes("projects/v2")) continue;
        if (PERMITIDOS.has(spec)) continue;
        ofensores.push(`${path.relative(CLIENT_SRC, arquivo)} -> ${spec}`);
      }
    }
    expect(
      ofensores,
      `imports proibidos de shared/projects/v2 (${ofensores.length}):\n${ofensores.join("\n")}\n` +
        `Permitidos: ${Array.from(PERMITIDOS).join(", ")}`,
    ).toEqual([]);
  });

  it("o proprio varredor enxerga os arquivos do client", () => {
    // Sem isto, um erro no caminho ou no filtro faria o teste acima passar
    // varrendo zero arquivo, que e a falha silenciosa que ele existe para
    // evitar em outro lugar.
    const arquivos = arquivosDeCodigo(CLIENT_SRC);
    expect(arquivos.length).toBeGreaterThan(200);
    expect(
      arquivos.some((a) => a.endsWith(path.join("lib", "data.ts"))),
      "client/src/lib/data.ts nao foi encontrado pelo varredor",
    ).toBe(true);
  });
});
