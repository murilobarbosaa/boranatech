import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * A ferramenta passada para `checkAiDailyLimit` e a passada para `logAiUsage`
 * PRECISAM ser o mesmo identificador, dentro de cada rota.
 *
 * Se divergirem, a reserva e criada com um nome e a confirmacao procura por
 * outro: a linha fica `reserved`, consome cota da pessoa por 10 minutos, e nada
 * acusa. O caso nao e hipotetico. Na Fase 3 eu passei o literal
 * `"github-perfil"` para a reserva enquanto o log usava
 * `` const tool = `github-${mode}` ``: para qualquer modo diferente de "perfil"
 * as duas divergiam.
 *
 * O teste enumera as rotas DA FONTE, nao de lista: qualquer arquivo em
 * `server/routes` que chame `checkAiDailyLimit` entra sozinho. Rota nova nasce
 * coberta, e rota que passe literal em vez de identificador compartilhado
 * quebra aqui.
 */

const ROUTES = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "routes",
);

interface Rota {
  arquivo: string;
  fonte: string;
  toolDaReserva: string;
  toolsDoLog: string[];
}

function lerRotas(): Rota[] {
  const out: Rota[] = [];
  for (const arquivo of readdirSync(ROUTES).filter((f) => f.endsWith(".ts"))) {
    const fonte = readFileSync(path.join(ROUTES, arquivo), "utf8");
    // 4o argumento de checkAiDailyLimit(userId, isPro, escopo, TOOL, ...)
    const reservas = Array.from(
      // `[^),\s]` exclui a virgula do grupo, e o `,?` aceita a virgula a
      // direita da forma multilinha, que e a que o Prettier produz quando a
      // chamada passa da largura. Sem o `,?` o regex nao casa nada e a rota
      // sairia da auditoria em silencio, que e pior que a falha que ele tinha.
      //
      // O `(?:\s*[^),\s]+\s*,?)*` aceita argumentos DEPOIS do quarto. Sem ele,
      // o prazo de banco que a Fase 4 acrescentou em `linkedin.ts` tirou a rota
      // inteira desta auditoria, e so nao passou despercebido porque a assercao
      // de TOTAL abaixo quebrou. Foi ela quem pegou; o regex sozinho reportaria
      // sete rotas certinhas sobre uma superficie menor.
      fonte.matchAll(
        /checkAiDailyLimit\(\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*([^),\s]+)\s*,?(?:\s*[^),\s]+\s*,?)*\s*\)/g,
      ),
      (m) => m[1],
    );
    // ABORTO EM ITEM NAO EXTRAIDO, nos dois sentidos. "As que eu li estao ok"
    // nao e a mesma pergunta que "eu li todas as que existem": contar as
    // ocorrencias amplas e comparar com as que o parser leu e o que transforma
    // um encolhimento silencioso em falha ruidosa, sem depender de alguem ter
    // escrito o numero 8 la embaixo.
    const mencoes = (fonte.match(/checkAiDailyLimit\(/g) ?? []).length;
    if (mencoes !== reservas.length) {
      throw new Error(
        `${arquivo}: ha ${mencoes} chamada(s) de checkAiDailyLimit e o parser extraiu ${reservas.length}. Conserte o regex antes de mexer no numero esperado.`,
      );
    }
    if (reservas.length === 0) continue;
    // Duas formas: `tool: IDENT` e a abreviada `{ userId, tool, ... }`, que
    // significa que o identificador se chama literalmente `tool`. A primeira
    // versao deste parser so via a forma com dois pontos e reportou github.ts
    // como sem log nenhum: parser cego dando veredito, o defeito de sempre.
    const logs = [
      ...Array.from(
        fonte.matchAll(
          /logAiUsage\(\{[\s\S]{0,400}?\btool:\s*([A-Za-z_$][\w$]*)/g,
        ),
        (m) => m[1],
      ),
      ...Array.from(
        fonte.matchAll(/logAiUsage\(\{[\s\S]{0,400}?\btool\s*[,}]/g),
        () => "tool",
      ),
    ];
    for (const toolDaReserva of Array.from(new Set(reservas))) {
      out.push({
        arquivo,
        fonte,
        toolDaReserva,
        toolsDoLog: Array.from(new Set(logs)),
      });
    }
  }
  return out;
}

const rotas = lerRotas();

describe("identificador de ferramenta: reserva e log usam o mesmo", () => {
  it("ha rotas para auditar, e a enumeracao nao encolheu em silencio", () => {
    // 9 chamadas de checkAiDailyLimit em 8 arquivos (ai.ts tem duas).
    const arquivos = new Set(rotas.map((r) => r.arquivo));
    expect(arquivos.size).toBe(8);
    expect(rotas.length).toBeGreaterThanOrEqual(8);
  });

  it("NENHUMA rota passa string literal para a reserva", () => {
    // Literal e o modo de falha: ele nao acompanha o identificador do log.
    for (const r of rotas) {
      expect(
        r.toolDaReserva.startsWith('"') || r.toolDaReserva.startsWith("`"),
        `${r.arquivo}: reserva recebe literal ${r.toolDaReserva}`,
      ).toBe(false);
    }
  });

  it("o identificador da reserva tambem e usado em algum logAiUsage da rota", () => {
    for (const r of rotas) {
      expect(
        r.toolsDoLog,
        `${r.arquivo}: reserva usa ${r.toolDaReserva}, logs usam ${r.toolsDoLog.join(", ")}`,
      ).toContain(r.toolDaReserva);
    }
  });

  it("github usa a MESMA variavel dinamica nos dois lados", () => {
    // Regressao especifica: `github-${mode}` no log contra "github-perfil" na
    // reserva divergia em todo modo que nao fosse "perfil".
    const gh = rotas.find((r) => r.arquivo === "github.ts");
    expect(gh).toBeDefined();
    expect(gh!.toolDaReserva).toBe("tool");
    expect(gh!.fonte).toContain("const tool = `github-${mode}`");
  });
});
