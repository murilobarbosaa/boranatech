import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * O CODIGO E O BANCO PRECISAM CONCORDAR SOBRE `content_audit_logs.action`.
 *
 * O DEFEITO QUE ISTO PEGA, medido em 2026-08-31. A rota
 * `POST /admin/billing/orphan-payments/:id/resolve` subiu para producao gravando
 * `action: "billing_orphan_resolve"` contra uma CHECK que nao aceitava esse
 * valor. A gravacao ali e fail-closed de proposito, entao o insert recusado
 * derruba a rota com 500: o botao nasceu morto. Nada acusou, porque o caminho so
 * roda quando um admin clica, e porque `pnpm check` nao ve constraint de banco.
 *
 * ESTE TESTE NAO PRECISA DE BANCO. Ele compara duas FONTES do repositorio: a
 * lista da CHECK na migration mais recente que a define, e as actions que o
 * codigo do servidor de fato grava. Roda no CI sem segredo nenhum, junto com o
 * resto da suite.
 *
 * O QUE ELE NAO PROVA, e a limitacao e deliberada: que a CHECK do arquivo e a
 * CHECK VIGENTE no banco. Isso e trabalho do `pnpm check:migrations`, que precisa
 * de rede e service role. Aqui se afirma coerencia interna do repositorio, que e
 * a metade que da para verificar de graca e em todo commit.
 *
 * OS DOIS PARSERS SAO A PARTE FRAGIL, e esta e a classe de instrumento que o
 * CLAUDE.md documenta como a que falha PASSANDO: um regex que sub-casa acha
 * MENOS sitios e conclui que esta tudo certo. A contramedida e a de sempre,
 * afirmar o TOTAL e nao a pertinencia: os tres numeros abaixo travam quantos
 * sitios e quantos valores existem, e qualquer mudanca de quantidade quebra o
 * teste antes de a comparacao de conjunto rodar. Alterar um deles e ato
 * deliberado, no mesmo commit que cria o sitio ou a migration.
 */

/** Valores aceitos pela CHECK, na migration mais recente que a define. */
const EXPECTED_ACOES_NO_CHECK = 15;
/** Sitios que escrevem em `content_audit_logs` sem passar pelo helper. */
const EXPECTED_SITIOS_INSERT_DIRETO = 10;
/** Chamadas de `logAudit(...)`. */
const EXPECTED_SITIOS_LOGAUDIT = 3;

/**
 * Sitios cuja `action` e uma VARIAVEL, nao um literal, com os valores que ela
 * pode assumir. O parser nao le variavel, e fingir que le seria pior que
 * declarar: um sitio dinamico novo aparece como "sem action legivel" e derruba o
 * teste, em vez de sumir da contagem.
 *
 * Hoje ha exatamente um, em `server/routes/admin.ts` (o PATCH de conteudo, que
 * escolhe entre publish, unpublish e update conforme `is_published` entra no
 * payload).
 */
const ACOES_DINAMICAS = ["update", "publish", "unpublish"];
const EXPECTED_SITIOS_DINAMICOS = 1;

const RAIZ = new URL("../", import.meta.url);
const MIGRATIONS = new URL("../../supabase/migrations/", import.meta.url);

/** Arquivos do servidor que podem escrever audit. */
const FONTES = ["lib/audit.ts", "routes/admin.ts"];

/**
 * Lista da CHECK, lida da migration mais recente que faz `ADD CONSTRAINT
 * content_audit_logs_action_check`.
 *
 * Pela data do nome, nao pela ordem do diretorio: `readdirSync` nao promete
 * ordenacao, e um ordenamento implicito e a mesma classe de erro que o resto
 * deste arquivo persegue.
 */
function acoesPermitidas(): string[] {
  const arquivos = readdirSync(MIGRATIONS)
    .filter((n) => n.endsWith(".sql"))
    .sort();
  let ultima: string | null = null;
  for (const nome of arquivos) {
    const sql = readFileSync(new URL(nome, MIGRATIONS), "utf8");
    if (sql.includes('ADD CONSTRAINT "content_audit_logs_action_check"')) {
      ultima = sql;
    }
  }
  expect(
    ultima,
    "nenhuma migration define content_audit_logs_action_check",
  ).not.toBeNull();
  const bloco = ultima as string;
  const ini = bloco.indexOf('ADD CONSTRAINT "content_audit_logs_action_check"');
  const fim = bloco.indexOf(";", ini);
  expect(fim, "CHECK sem ponto e virgula de fim").toBeGreaterThan(ini);
  const trecho = bloco.slice(ini, fim);
  return Array.from(trecho.matchAll(/'([a-z_]+)'::"text"/g)).map((m) => m[1]);
}

type Sitio = { arquivo: string; linha: number; action: string | null };

/** Sitios de `.from("content_audit_logs")` seguidos de `.insert(`. */
function sitiosDeInsertDireto(): Sitio[] {
  const achados: Sitio[] = [];
  for (const rel of FONTES) {
    const linhas = readFileSync(new URL(rel, RAIZ), "utf8").split("\n");
    for (let i = 0; i < linhas.length; i += 1) {
      if (!linhas[i].includes('.from("content_audit_logs")')) continue;
      // Janela curta: `.insert(` vem na linha seguinte no estilo do arquivo, e
      // uma janela larga poderia casar o `.insert(` de outra query.
      const seguinte = linhas.slice(i + 1, i + 3).join("\n");
      if (!seguinte.includes(".insert(")) continue;
      const corpo = linhas.slice(i, i + 10).join("\n");
      const m = corpo.match(/action: "([a-z_]+)"/);
      achados.push({ arquivo: rel, linha: i + 1, action: m ? m[1] : null });
    }
  }
  return achados;
}

/** Chamadas de `logAudit({`. */
function sitiosDeLogAudit(): Sitio[] {
  const achados: Sitio[] = [];
  for (const rel of FONTES) {
    const linhas = readFileSync(new URL(rel, RAIZ), "utf8").split("\n");
    for (let i = 0; i < linhas.length; i += 1) {
      if (!linhas[i].includes("logAudit({")) continue;
      const corpo = linhas.slice(i, i + 6).join("\n");
      const m = corpo.match(/action: "([a-z_]+)"/);
      achados.push({ arquivo: rel, linha: i + 1, action: m ? m[1] : null });
    }
  }
  return achados;
}

describe("content_audit_logs.action: codigo e CHECK dizem a mesma coisa", () => {
  it("a CHECK tem exatamente os valores esperados", () => {
    const permitidas = acoesPermitidas();
    expect(permitidas.length).toBe(EXPECTED_ACOES_NO_CHECK);
    // Sem duplicata: uma lista com o mesmo valor duas vezes passaria na
    // contagem e esconderia um valor que faltou.
    expect(new Set(permitidas).size).toBe(permitidas.length);
  });

  it("os parsers acham exatamente os sitios esperados", () => {
    expect(sitiosDeInsertDireto().length).toBe(EXPECTED_SITIOS_INSERT_DIRETO);
    expect(sitiosDeLogAudit().length).toBe(EXPECTED_SITIOS_LOGAUDIT);
  });

  it("ha exatamente os sitios dinamicos declarados, e nenhum a mais", () => {
    const semLiteral = [
      ...sitiosDeInsertDireto(),
      ...sitiosDeLogAudit(),
    ].filter((s) => s.action === null);
    expect(
      semLiteral.map((s) => `${s.arquivo}:${s.linha}`),
      "sitio com action nao literal que nao esta declarado em ACOES_DINAMICAS",
    ).toHaveLength(EXPECTED_SITIOS_DINAMICOS);
  });

  it("TODA action gravada pelo codigo passa na CHECK", () => {
    const permitidas = new Set(acoesPermitidas());
    // Laco em vez de flatMap: o `s.action` do ramo literal e `string | null` no
    // tipo, e so um push explicito o estreita para `string` sem asercao.
    const escritas: Array<{ arquivo: string; linha: number; action: string }> =
      [];
    for (const s of [...sitiosDeInsertDireto(), ...sitiosDeLogAudit()]) {
      if (s.action === null) {
        for (const a of ACOES_DINAMICAS) {
          escritas.push({ arquivo: s.arquivo, linha: s.linha, action: a });
        }
      } else {
        escritas.push({ arquivo: s.arquivo, linha: s.linha, action: s.action });
      }
    }
    const recusadas = escritas.filter((s) => !permitidas.has(s.action));
    expect(
      recusadas.map((s) => `${s.arquivo}:${s.linha} grava "${s.action}"`),
      "action gravada pelo codigo que a CHECK do banco recusa",
    ).toEqual([]);
  });

  it("a CHECK nao tem valor que ninguem grava", () => {
    // Direcao inversa, e ela importa: valor sobrando na CHECK e ou codigo
    // removido sem limpar o schema, ou action que alguem esqueceu de usar.
    // Nao e erro, mas precisa ser DECLARADO, entao a lista abaixo comeca vazia
    // e cresce por decisao, nunca por acidente.
    const ociosasAceitas: string[] = [];
    const escritas = new Set(
      [...sitiosDeInsertDireto(), ...sitiosDeLogAudit()].flatMap((s) =>
        s.action === null ? ACOES_DINAMICAS : [s.action],
      ),
    );
    const ociosas = acoesPermitidas().filter((a) => !escritas.has(a));
    expect(ociosas).toEqual(ociosasAceitas);
  });
});
