import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * SO `lib/proConfetti.ts` IMPORTA A BIBLIOTECA DE CONFETE.
 *
 * O `confetti` padrao dela desenha num Web Worker criado a partir de `blob:`, e
 * a CSP de producao bloqueia esse worker sem erro: zero particulas. Tres telas
 * ficaram quebradas assim depois de o conserto entrar so em `proConfetti.ts`.
 * Este guard trava a porta unica: qualquer outro import falha nomeando o
 * arquivo.
 *
 * Toda linha que cita o modulo entre aspas precisa ser classificada: import
 * (proibido fora da porta) ou `vi.mock` (permitido em teste). Linha que nao se
 * encaixa em nenhum dos dois derruba o teste, para o varredor nao sub-casar em
 * silencio uma forma de import que ele nao conhece.
 */

// Montado por partes para este arquivo nao citar o proprio modulo que procura.
const MODULO = ["canvas", "confetti"].join("-");
const RAIZ = join(__dirname, "..");
const PORTA = "lib/proConfetti.ts";

const CITACAO = new RegExp(`["'\`]${MODULO}["'\`]`);
const IMPORT = new RegExp(
  `(\\bfrom\\s*|\\bimport\\s*\\(\\s*|^\\s*import\\s+|\\brequire\\s*\\(\\s*)["'\`]${MODULO}["'\`]`,
);
const MOCK = new RegExp(`\\bvi\\.(do)?[mM]ock\\s*\\(\\s*["'\`]${MODULO}["'\`]`);

function arquivos(dir: string): string[] {
  const saida: string[] = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) saida.push(...arquivos(caminho));
    else if (/\.(ts|tsx|js|jsx|mts|mjs)$/.test(entrada.name))
      saida.push(caminho);
  }
  return saida;
}

function varrer() {
  const lidos = arquivos(RAIZ).map((abs) =>
    relative(RAIZ, abs).split(sep).join("/"),
  );
  const importadores: string[] = [];
  const naoClassificadas: string[] = [];
  for (const rel of lidos) {
    const linhas = readFileSync(join(RAIZ, rel), "utf-8").split("\n");
    linhas.forEach((linha, i) => {
      if (!CITACAO.test(linha)) return;
      if (IMPORT.test(linha)) importadores.push(rel);
      else if (!MOCK.test(linha)) naoClassificadas.push(`${rel}:${i + 1}`);
    });
  }
  return { lidos, importadores, naoClassificadas };
}

describe("porta unica do confete", () => {
  it("nenhum arquivo alem de lib/proConfetti.ts importa a biblioteca", () => {
    const { importadores, naoClassificadas } = varrer();
    expect(naoClassificadas, "citacao do modulo nao classificada").toEqual([]);
    expect(importadores.filter((rel) => rel !== PORTA)).toEqual([]);
  });

  it("o varredor leu a arvore inteira e achou a porta", () => {
    const { lidos, importadores } = varrer();
    expect(lidos.length).toBeGreaterThan(200);
    expect(lidos).toContain(PORTA);
    expect(importadores).toContain(PORTA);
  });
});
