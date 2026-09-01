import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * "Não consegui olhar" tem de ser distinguível de "olhei e está tudo certo",
 * e de "olhei e achei problema".
 *
 * POR QUE ESTE TESTE EXISTE, com data: em 2026-08-01, escrevendo o documento
 * que cataloga esta classe de defeito, o autor rodou `check:migrations` num
 * worktree sem `.env`, grepou a saída procurando o aviso das três tabelas de
 * billing, não achou nada, e quase registrou "pendência resolvida". O guard
 * tinha abortado por falta de ambiente: não verificou coisa nenhuma.
 *
 * Os dois casos eram indistinguíveis por dois caminhos ao mesmo tempo:
 *   - `exit(1)`, o mesmo código de uma falha real de verificação;
 *   - o mesmo prefixo `[checkMigrationsApplied]` do caminho de sucesso, então
 *     um grep no texto casava os dois.
 *
 * É a anatomia do `env -i` e do endpoint legado que devolvia 200 com lista
 * vazia: AUSÊNCIA DE RESPOSTA LIDA COMO RESPOSTA. Conhecer a classe não
 * imuniza, quem caiu nela estava escrevendo sobre ela.
 *
 * O teste roda o script DE VERDADE (spawn), e não confere o texto da fonte:
 * asserção sobre o código-fonte provaria que a string existe, não que o
 * processo se comporta assim. O caminho de aborto sai antes de qualquer
 * chamada de rede, então o custo é uma execução curta.
 */

const RAIZ = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

function rodarSemAmbiente() {
  const env = { ...process.env };
  delete env.VITE_SUPABASE_URL;
  delete env.SUPABASE_URL;
  delete env.SUPABASE_SERVICE_ROLE_KEY;
  return spawnSync(
    path.join(RAIZ, "node_modules", ".bin", "tsx"),
    [path.join(RAIZ, "scripts", "checkMigrationsApplied.mts")],
    { env, encoding: "utf8", cwd: RAIZ },
  );
}

describe("check:migrations sem ambiente", () => {
  const r = rodarSemAmbiente();

  it("sai com codigo PROPRIO, diferente de 0 e diferente de 1", () => {
    // 78 = EX_CONFIG do sysexits.h. O numero em si importa menos que ser
    // distinto: 1 significa "verifiquei e achei problema", e confundir os dois
    // e o defeito que este teste existe para travar.
    expect(r.status).toBe(78);
    expect(r.status).not.toBe(0);
    expect(r.status).not.toBe(1);
  });

  it("diz explicitamente que NAO verificou nada", () => {
    const saida = `${r.stdout ?? ""}${r.stderr ?? ""}`;
    expect(saida).toContain("ABORTADO SEM VERIFICAR NADA");
    expect(saida).toContain("NENHUMA tabela, funcao ou policy foi conferida");
  });

  it("avisa que o resultado NAO significa banco em dia", () => {
    // A frase que teria evitado a leitura errada de 2026-08-01.
    const saida = `${r.stdout ?? ""}${r.stderr ?? ""}`;
    expect(saida).toContain("NAO significa que o banco esta em dia");
  });

  it("nao imprime nenhuma linha que pareca resultado de verificacao", () => {
    // O grep que falhou procurava por "NAO declarad". O aborto nao pode
    // produzir NADA que se pareca com veredito sobre o banco.
    const saida = `${r.stdout ?? ""}${r.stderr ?? ""}`;
    expect(saida).not.toContain("existem no banco alvo");
    expect(saida).not.toContain("NAO declaradas");
    expect(saida).not.toMatch(/RLS: \d+ protegida/);
  });
});
