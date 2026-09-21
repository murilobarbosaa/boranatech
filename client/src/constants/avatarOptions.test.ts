import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * FUNDOS DO AVATAR ESTAVEIS NOS DOIS TEMAS (lote 11c).
 *
 * O que se prova, em dois elos, como em conformidadeDeTema.test.ts: (1) cada
 * fundo do catalogo usa o par de tokens `--avatar-bg-*` / `--avatar-ink-*`, e
 * so ele; (2) cada token esta definido no `:root` do index.css e NAO e
 * redefinido em nenhum bloco `.dark`. O jsdom nao resolve `var()` em cor
 * computada, entao a cor final e navegador; o que cabe aqui e a cadeia.
 */

import { avatarBgIds, avatarBgOptions } from "./avatarOptions";

const CSS = readFileSync(
  resolve(process.cwd(), "client/src/index.css"),
  "utf8",
);

/** O nome do token de cada id do catalogo. Total afirmado: nove. */
const TOKEN_POR_ID: Record<(typeof avatarBgIds)[number], string> = {
  slate: "azul-escuro",
  yellow: "amarelo",
  purple: "roxo",
  pink: "rosa",
  green: "verde",
  blue: "azul",
  orange: "laranja",
  cream: "creme",
  white: "branco",
};

describe("fundos do avatar por token", () => {
  it("cada opcao usa exatamente o par bg/ink do seu token, sem pastel nem hex", () => {
    expect(avatarBgOptions).toHaveLength(9);
    for (const opcao of avatarBgOptions) {
      const nome = TOKEN_POR_ID[opcao.id];
      expect(opcao.className, opcao.id).toBe(
        `bg-[var(--avatar-bg-${nome})] text-[var(--avatar-ink-${nome})]`,
      );
    }
  });

  it("cada token existe no :root e nao e redefinido sob .dark", () => {
    const primeiroDark = CSS.indexOf("\n.dark {");
    expect(primeiroDark).toBeGreaterThan(0);
    const raiz = CSS.slice(0, primeiroDark);
    const escuro = CSS.slice(primeiroDark);
    for (const nome of Object.values(TOKEN_POR_ID)) {
      for (const prefixo of ["--avatar-bg-", "--avatar-ink-"]) {
        const token = `${prefixo}${nome}:`;
        expect(raiz.includes(token), `${token} no :root`).toBe(true);
        expect(escuro.includes(token), `${token} fora do .dark`).toBe(false);
      }
    }
  });

  it("o creme e o mesmo creme do tema claro, escrito como literal", () => {
    const linha = CSS.split("\n").find((l) => l.includes("--avatar-bg-creme:"));
    expect(linha?.trim()).toBe("--avatar-bg-creme: #faf8f4;");
    // Nenhum token do avatar aponta para outra variavel: literal, ou a
    // redefinicao da paleta o alcancaria por tabela.
    for (const l of CSS.split("\n")) {
      if (/--avatar-(bg|ink)-[a-z-]+:/.test(l)) expect(l).not.toContain("var(");
    }
  });
});
