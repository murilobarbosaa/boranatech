import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Afirma o TOTAL de testes pulados, e não a pertinência de cada um.
 *
 * O buraco que isto fecha: a suíte roda verde com 5 testes pulados, e nada
 * afirmava que são 5. Um sexto pulado por acidente (um `it.skip` esquecido no
 * commit, um `describe.skip` deixado durante a depuração) passaria verde e
 * ninguém saberia, porque teste pulado não aparece como falha em lugar nenhum.
 * É a classe documentada no CLAUDE.md: o instrumento reporta sucesso sobre uma
 * superfície menor. E é a contramedida que já funcionou três vezes, no molde do
 * `EXPECTED_TABLE_COUNT`: um número declarado, cuja alteração é ato deliberado
 * no commit que pula (ou despula) alguma coisa.
 *
 * Descoberta a partir da FONTE, com aborto em item não classificado: varre todos
 * os arquivos de teste do repositório, acha todo marcador de skip, e falha se
 * aparecer um que não esteja declarado aqui. Não é lista escrita à mão conferida
 * contra si mesma; é a lista confrontada com o que existe no disco.
 *
 * ONDE ISTO MORA E POR QUÊ: em um teste, não no CI e não no hook. O hook e o CI
 * já rodam a suíte inteira, então um teste é herdado pelos dois de graça e não
 * cria um terceiro lugar para manter. Só no CI seria pior de duas formas: o
 * commit local passaria e a quebra apareceria tarde, e a regra viveria num
 * arquivo de workflow que ninguém lê ao escrever teste.
 */

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["client/src", "server", "shared", "scripts"];
const IGNORAR = new Set(["node_modules", "dist", ".git", "coverage"]);

/**
 * Marcadores que fazem o vitest NÃO executar um teste.
 *
 * `.skipIf` e `.runIf` são condicionais e entram na conta porque pulam de
 * verdade quando a condição bate, que é o caso do harness em Docker. `.only` não
 * pula o teste marcado, mas silencia todos os outros do arquivo, então é ainda
 * pior e também é caçado aqui.
 */
const MARCADOR =
  /\b(?:describe|it|test)\.(skip|skipIf|runIf|todo|only|concurrent\.skip)\s*(?:\(|`)/g;

interface Ocorrencia {
  arquivo: string;
  marcador: string;
  linha: number;
}

function arquivosDeTeste(dir: string): string[] {
  const absoluto = path.join(RAIZ, dir);
  const saida: string[] = [];
  const pilha = [absoluto];
  while (pilha.length > 0) {
    const atual = pilha.pop()!;
    let entradas: string[];
    try {
      entradas = readdirSync(atual);
    } catch {
      continue;
    }
    for (const entrada of entradas) {
      if (IGNORAR.has(entrada)) continue;
      const cheio = path.join(atual, entrada);
      if (statSync(cheio).isDirectory()) {
        pilha.push(cheio);
      } else if (/\.test\.tsx?$/.test(entrada)) {
        saida.push(cheio);
      }
    }
  }
  return saida.sort();
}

function acharOcorrencias(): Ocorrencia[] {
  const achados: Ocorrencia[] = [];
  for (const dir of DIRS) {
    for (const arquivo of arquivosDeTeste(dir)) {
      const conteudo = readFileSync(arquivo, "utf8");
      const linhas = conteudo.split("\n");
      linhas.forEach((linha, i) => {
        // Comentário não conta: o parágrafo que EXPLICA um skip não é um skip.
        const semComentario = linha.replace(/\/\/.*$/, "").replace(/^\s*\*.*$/, "");
        MARCADOR.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = MARCADOR.exec(semComentario)) !== null) {
          achados.push({
            arquivo: path.relative(RAIZ, arquivo),
            marcador: m[1],
            linha: i + 1,
          });
        }
      });
    }
  }
  return achados;
}

/**
 * Os skips DECLARADOS, com o total de testes que cada um desliga.
 *
 * Alterar qualquer número aqui é ATO DELIBERADO, no mesmo commit que muda o
 * skip, com o motivo na mensagem. Se este arquivo reclamar sem você ter mexido
 * em skip nenhum, investigue o teste que apareceu antes de mexer no número.
 */
const SKIPS_DECLARADOS = [
  {
    arquivo: "server/routes/adminTasks.rebalance.test.ts",
    marcador: "skipIf",
    testesPulados: 5,
    porque:
      "Integração contra Postgres + PostgREST reais em Docker. Pula sem " +
      "BNT_PGREST_URL/BNT_TEST_USER_ID/BNT_PGREST_JWT, para o CI (sem Docker) " +
      "seguir verde. Instruções de como subir no cabeçalho do arquivo.",
  },
  {
    arquivo: "server/lib/sentryTaskDedup.pg.test.ts",
    marcador: "skipIf",
    testesPulados: 3,
    porque:
      "Prova do invariante 3 (deduplicação pela constraint) com inserções " +
      "CONCORRENTES contra um Postgres real em Docker. Concorrência não existe " +
      "em teste unitário, então só o banco pode provar. Pula sem " +
      "BNT_PG_CONTAINER; instruções no cabeçalho do arquivo.",
  },
  {
    arquivo: "server/lib/sentryTaskIntake.pg.test.ts",
    marcador: "skipIf",
    testesPulados: 2,
    porque:
      "Harness de ponta a ponta do sync: schema real em Docker, PostgREST " +
      "autêntico e a API do Sentry de verdade. Foi ele que pegou os dois " +
      "defeitos que mock nenhum pegaria (on conflict com índice parcial, e o " +
      "400 do statsPeriod vazio). Pula sem BNT_SYNC_HARNESS=1.",
  },
] as const;

/** Total de testes que a suíte tem permissão de pular. */
const EXPECTED_SKIPPED_COUNT = SKIPS_DECLARADOS.reduce(
  (soma, s) => soma + s.testesPulados,
  0,
);

describe("skips da suite: afirmar o TOTAL, nao a pertinencia", () => {
  const ocorrencias = acharOcorrencias();

  it("a varredura encontra arquivos de teste (o instrumento nao esta vazio)", () => {
    // Sem isto, um erro de caminho faria a varredura achar zero arquivo e o
    // teste passaria afirmando "nenhum skip", que e o proprio defeito da classe.
    const total = DIRS.reduce((n, d) => n + arquivosDeTeste(d).length, 0);
    expect(total).toBeGreaterThan(100);
  });

  it("nenhum skip NAO DECLARADO existe na base", () => {
    const declarados = new Set(
      SKIPS_DECLARADOS.map((s) => `${s.arquivo}::${s.marcador}`),
    );
    const naoDeclarados = ocorrencias.filter(
      (o) => !declarados.has(`${o.arquivo}::${o.marcador}`),
    );
    expect(
      naoDeclarados,
      `Skip nao declarado. Se e proposital, acrescente em SKIPS_DECLARADOS ` +
        `(scripts/skipsDeclarados.test.ts) com o motivo e o total de testes:\n` +
        naoDeclarados
          .map((o) => `  ${o.arquivo}:${o.linha} -> .${o.marcador}`)
          .join("\n"),
    ).toEqual([]);
  });

  it("todo skip declarado ainda EXISTE (declaracao morta tambem e erro)", () => {
    // O sentido inverso: "o que declarei existe?" nao e a mesma pergunta que "o
    // que existe esta declarado?". Sem esta, a lista viraria cemiterio.
    for (const s of SKIPS_DECLARADOS) {
      const achou = ocorrencias.some(
        (o) => o.arquivo === s.arquivo && o.marcador === s.marcador,
      );
      expect(achou, `Skip declarado sumiu da base: ${s.arquivo} .${s.marcador}`).toBe(
        true,
      );
    }
  });

  it("o TOTAL de testes pulados e exatamente o declarado", () => {
    // O numero que a suite imprime como "N skipped". Bateu com o run real de
    // 2026-07-31: 10 pulados, todos de harness em Docker (5 do rebalance, 3 da
    // deduplicacao concorrente, 2 do sync de ponta a ponta). Era 5 ate a Fase 3
    // do projeto de unificacao de bugs; alterar este numero e ato deliberado, no
    // mesmo commit do harness que entra ou sai.
    expect(EXPECTED_SKIPPED_COUNT).toBe(10);
  });

  it("cada skip declarado desliga o numero de testes que diz desligar", () => {
    // Conta os `it(` dentro do bloco pulado. Sem isto, acrescentar um sexto
    // teste dentro do describe.skipIf existente passaria batido: o marcador
    // continua um so, e o total de pulados sobe para 6 em silencio.
    for (const s of SKIPS_DECLARADOS) {
      const conteudo = readFileSync(path.join(RAIZ, s.arquivo), "utf8");
      const inicio = conteudo.search(
        new RegExp(`\\b(?:describe|it|test)\\.${s.marcador}\\s*\\(`),
      );
      expect(inicio, `nao achei o marcador em ${s.arquivo}`).toBeGreaterThan(-1);
      const its = (conteudo.slice(inicio).match(/^\s*it\s*\(/gm) ?? []).length;
      expect(
        its,
        `${s.arquivo}: o bloco pulado tem ${its} testes, mas SKIPS_DECLARADOS diz ${s.testesPulados}`,
      ).toBe(s.testesPulados);
    }
  });
});
