import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * O CHECK EM `profiles` NAO PODE VOLTAR A VARRER A TABELA SOB LOCK EXCLUSIVO.
 *
 * `alter table ... add constraint ... check (...)` sem NOT VALID toma ACCESS
 * EXCLUSIVE e SEGURA o lock enquanto le a tabela inteira. `profiles` e a tabela
 * do caminho de login, entao isso e uma parada do site pelo tempo da varredura.
 *
 * O par que este arquivo trava tem DUAS metades, e ele falha se qualquer uma
 * sumir:
 *
 *   1. sem o NOT VALID, volta a varredura sob lock;
 *   2. sem o VALIDATE depois do COMMIT, a constraint fica NOT VALID para sempre,
 *      ou seja, ela nao verifica as linhas existentes e vira uma garantia que so
 *      parece existir. Silencio, que e pior que a lentidao da metade 1.
 *
 * A ordem tambem importa e esta afirmada: o VALIDATE precisa vir DEPOIS de um
 * COMMIT. Dentro da mesma transacao do ADD, o lock exclusivo continua retido e a
 * separacao nao economiza nada, que e o erro sutil que alguem cometeria ao
 * "arrumar" o arquivo juntando tudo num bloco so.
 *
 * Teste ESTATICO: le o arquivo como texto. Zero rede, zero banco, nenhuma
 * migration aplicada. Segue o precedente de
 * `server/lib/linkedinProgressRevisionMigration.test.ts`.
 */

const sql = readFileSync(
  path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../supabase/migrations/20260804130000_add_profile_fiscal_fields.sql",
  ),
  "utf8",
).toLowerCase();

const CONSTRAINT = "profiles_fiscal_documento_preferencia_check";

/** O texto sem os comentarios de linha, para o teste nao casar com a PROSA. */
const codigo = sql
  .split("\n")
  .filter((linha) => !linha.trimStart().startsWith("--"))
  .join("\n");

describe("migration do check fiscal em profiles", () => {
  it("cria a constraint com NOT VALID, sem varrer profiles sob lock exclusivo", () => {
    const add = codigo.indexOf(`add constraint ${CONSTRAINT}`);
    expect(add).toBeGreaterThan(0);

    // Do `add constraint` ate o fim daquele comando.
    const comando = codigo.slice(add, codigo.indexOf(";", add));
    expect(comando).toContain("not valid");
  });

  it("valida a constraint DEPOIS de um COMMIT, em transacao separada", () => {
    const add = codigo.indexOf(`add constraint ${CONSTRAINT}`);
    const commit = codigo.indexOf("commit;", add);
    const validate = codigo.indexOf(`validate constraint ${CONSTRAINT}`);

    expect(commit).toBeGreaterThan(add);
    expect(validate).toBeGreaterThan(commit);
  });

  it("o validate nao e o proprio texto do add (sao dois comandos distintos)", () => {
    // `validate constraint` e substring de nada do ADD, mas esta afirmacao
    // protege contra alguem trocar o comando de validacao por uma mencao solta
    // em comentario: `codigo` ja excluiu os comentarios, entao o que sobra e
    // comando de verdade.
    expect(
      codigo.match(new RegExp(`validate constraint ${CONSTRAINT}`, "g")),
    ).toHaveLength(1);
    expect(codigo).toMatch(
      new RegExp(`alter table public\\.profiles\\s+validate constraint`),
    );
  });
});
