import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { decidirDelta } from "./deltaFunil";
import { readDeterministic } from "./readDeterministic";
import { readQualitative } from "./readQualitative";
import { decomporNota } from "./reguaV2";
import { LINKEDIN_CATEGORIES, TIER_WEIGHTS } from "./schema";

/**
 * JANELA DE DEPLOY: frontend novo contra backend antigo.
 *
 * Vercel e Railway são independentes e o front quase sempre sobe primeiro, então
 * existe uma janela de 1 a 3 minutos em que o bundle novo conversa com a API
 * antiga. É o mesmo problema do `record.result` legado, mas na dimensão do
 * TEMPO em vez da do histórico, e com uma diferença que importa: aqui é o
 * caminho da ANÁLISE NOVA, o que o usuário aciona justamente nesses minutos.
 *
 * `result-legado-v1.json` é literalmente uma resposta do backend antigo: foi
 * gravada por ele. Este teste passa essa resposta pelas quatro superfícies de
 * leitura do front e exige que nenhuma quebre.
 */

const RESPOSTA_DO_BACKEND_ANTIGO = JSON.parse(
  readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "server",
      "lib",
      "__fixtures__",
      "linkedin",
      "result-legado-v1.json",
    ),
    "utf8",
  ),
) as Record<string, unknown>;

/** Item da lista `/analyses` como o backend ANTIGO a devolve: sem os dois novos. */
const SUMMARY_ANTIGO = {
  id: "abc",
  area: "fullstack",
  level: "pleno",
  score: 72,
  faixa: "forte",
  created_at: "2026-07-01T00:00:00Z",
  // deterministicVersion: AUSENTE
  // checks: AUSENTE
} as { score: number; deterministicVersion?: number; checks?: never[] };

describe("janela de deploy: front novo lendo backend antigo", () => {
  it("a fixture E mesmo a resposta antiga: sem os campos novos", () => {
    const d = RESPOSTA_DO_BACKEND_ANTIGO.deterministic as Record<string, unknown>;
    expect(RESPOSTA_DO_BACKEND_ANTIGO.deterministicVersion).toBeUndefined();
    expect(d.keywordsCampos).toBeUndefined();
    expect(d.perfilDedup).toBeUndefined();
    expect(d.experienciasDescricaoTamanhos).toBeUndefined();
    expect(d.skillsParaAdicionarAgora).toBeUndefined();
  });

  it("readQualitative degrada: skillsParaEstudar vira lista, nunca undefined", () => {
    // `qual.skillsParaEstudar.length` no JSX chamaria metodo em undefined.
    const q = readQualitative(
      RESPOSTA_DO_BACKEND_ANTIGO.qualitative,
      RESPOSTA_DO_BACKEND_ANTIGO.qualitativeVersion as number | undefined,
    );
    expect(Array.isArray(q.skillsParaEstudar)).toBe(true);
    for (const campo of [
      "pontosFortes",
      "pontosFracos",
      "melhorias",
      "headlines",
      "bulletsReescritos",
    ] as const) {
      expect(Array.isArray(q[campo]), `${campo} nao e array`).toBe(true);
    }
  });

  it("readDeterministic degrada: keywordsCampos vira lista vazia", () => {
    const d = readDeterministic(RESPOSTA_DO_BACKEND_ANTIGO.deterministic);
    expect(d.keywordsCampos).toEqual([]);
    expect(Array.isArray(d.keywordsEncontradas)).toBe(true);
    expect(Array.isArray(d.titulosIngles)).toBe(true);
    // O RecruiterFinder usa isto para cair no modo antigo, em vez de renderizar
    // tres blocos vazios.
    expect(d.camposAusentes).toContain("keywordsCampos");
  });

  it("a decomposicao do hero funciona: o backend antigo ja mandava checks", () => {
    const d = RESPOSTA_DO_BACKEND_ANTIGO.deterministic as {
      checks: never[];
      score: number;
    };
    const parcelas = decomporNota(d.checks, TIER_WEIGHTS, LINKEDIN_CATEGORIES);
    expect(parcelas).toHaveLength(6);
    const possivel = parcelas.reduce((s, p) => s + p.possivel, 0);
    const ganho = parcelas.reduce((s, p) => s + p.ganho, 0);
    expect(Math.round((100 * ganho) / possivel)).toBe(d.score);
  });

  it("o funil do delta nao quebra sem `checks` no summary", () => {
    const d = RESPOSTA_DO_BACKEND_ANTIGO.deterministic as { checks: never[]; score: number };
    const v = decidirDelta({
      notaAnterior: SUMMARY_ANTIGO.score,
      versaoAnterior: SUMMARY_ANTIGO.deterministicVersion,
      checksAnteriores: SUMMARY_ANTIGO.checks,
      notaAtual: d.score,
      versaoAtual: RESPOSTA_DO_BACKEND_ANTIGO.deterministicVersion as undefined,
      checksAtuais: d.checks,
    });
    // Duas respostas v1: comparaveis, sem aviso de regua mudada.
    expect(v.reguaMudou).toBe(false);
    expect(v.motivo).toBe("nota-igual");
  });

  it("front novo + backend antigo com notas diferentes ainda mostra delta", () => {
    const d = RESPOSTA_DO_BACKEND_ANTIGO.deterministic as { checks: never[]; score: number };
    const v = decidirDelta({
      notaAnterior: 60,
      versaoAnterior: undefined,
      checksAnteriores: undefined,
      notaAtual: d.score,
      versaoAtual: undefined,
      checksAtuais: d.checks,
    });
    expect(v.delta).toEqual({ from: 60, to: d.score });
  });

  it("o campo que o front NAO le nao pode virar dependencia sem teste", () => {
    // `experienciasDescricaoTamanhos` so e escrito pelo servidor hoje. Se algum
    // dia o front passar a ler, este teste vira o lembrete de cobrir a janela.
    const fonte = readFileSync(
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "..",
        "..",
        "client",
        "src",
        "pages",
        "LinkedinAnalisar.tsx",
      ),
      "utf8",
    );
    expect(fonte).not.toContain("experienciasDescricaoTamanhos");
  });
});
