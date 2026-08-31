import { describe, expect, it, vi } from "vitest";

import { buildUserPrompt } from "./linkedinAnalyze";

vi.mock("./env", () => ({
  env: {
    openaiApiKey: "test",
    billingEnabled: false,
  },
}));

/**
 * A instrução de headline em dúvida é CONDICIONAL, e a condição é o ponto.
 *
 * Se ela valesse sempre, a IA pararia de diagnosticar headline nas ~82% das
 * análises em que a leitura está boa, e isso seria uma piora maior que o
 * problema que ela resolve. Um teste que só verifica "a instrução aparece
 * quando pendente" passaria com a instrução hardcoded no prompt; é preciso
 * afirmar os DOIS lados.
 *
 * E a POSIÇÃO importa: a instrução vem ANTES do bloco de checagens. O modelo
 * forma a leitura enquanto lê os checks, então instrução no meio da lista chega
 * tarde. Ordem de apresentação como parte do contrato, não como formatação, e
 * é por isso que há uma asserção sobre índice, e não só sobre presença.
 */

const MARCADOR = "LEITURA DA HEADLINE: em dúvida";
const BLOCO_DE_CHECKS = "Checagens automáticas já calculadas";

function determinístico(notaIncompleta: boolean) {
  return {
    score: 70,
    faixa: "forte" as const,
    notaIncompleta,
    checks: [
      {
        id: "headline-existe",
        label: "Headline presente",
        category: "headline" as const,
        tier: "essencial" as const,
        aprovado: true,
        detail: "Headline detectada no perfil.",
        pendente: notaIncompleta,
      },
    ],
    keywordsEncontradas: ["SQL"],
    keywordsFaltantes: ["Python"],
    skillsParaAdicionarAgora: [],
    keywordsCampos: [],
    perfilDedup: "",
    experienciasDescricaoTamanhos: [200],
    titulosIngles: [{ titulo: "Data Analyst", encontrado: true }],
    headline: "Analista de Dados | SQL",
    sobreTamanho: 400,
    experienciasContagem: 1,
    skillsContagem: 3,
  };
}

const REQUEST = {
  area: "dados",
  level: "junior",
  mercado: "brasil",
  profileText: "texto",
  skills: "SQL",
  foto: "sim",
  banner: "sim",
  openToWork: "nao",
  conexoes: "100-500",
  atividade: "as-vezes",
  objetivo: null,
};

const PARSED = {
  headline: "Analista de Dados | SQL",
  sobre: "Analista de dados.",
  experiencias: [],
  skillsPdf: [],
  formacao: [],
  certificacoes: [],
  usable: true,
};

function prompt(notaIncompleta: boolean): string {
  return buildUserPrompt(
    REQUEST as never,
    PARSED as never,
    determinístico(notaIncompleta) as never,
  );
}

describe("instrucao de headline em duvida no prompt", () => {
  it("APARECE quando a nota esta incompleta", () => {
    const p = prompt(true);
    expect(p).toContain(MARCADOR);
    expect(p).toContain("são PROVISÓRIAS");
    expect(p).toContain("NÃO podem ser apresentadas ao usuário como avaliação definitiva");
    expect(p).toContain("Nota determinística provisória, a confirmar: 70");
    expect(p).not.toContain("Nota determinística já calculada: 70");
    expect(p).toContain("NÃO afirme nada sobre o que a headline atual contém");
    expect(p).toContain("[pendente] Headline presente");
    expect(p).not.toContain("[aprovado] Headline presente");
    expect(p).not.toContain("[reprovado] Headline presente");
  });

  it("NAO aparece quando a leitura esta boa (o lado que importa)", () => {
    const p = prompt(false);
    expect(p).not.toContain(MARCADOR);
    expect(p).not.toContain("NÃO afirme nada sobre o que a headline atual");
    expect(p).toContain("Nota determinística já calculada: 70");
  });

  it("vem ANTES do bloco de checagens, nao depois nem no meio", () => {
    const p = prompt(true);
    const iInstrucao = p.indexOf(MARCADOR);
    const iChecks = p.indexOf(BLOCO_DE_CHECKS);
    expect(iInstrucao).toBeGreaterThan(-1);
    expect(iChecks).toBeGreaterThan(-1);
    expect(iInstrucao).toBeLessThan(iChecks);
  });

  it("manda sugerir headline nova normalmente, nao se calar", () => {
    // A pessoa precisa de uma headline boa mesmo quando a leitura falhou. O
    // que se corta e o DIAGNOSTICO do que existe, nao a PRESCRICAO.
    const p = prompt(true);
    expect(p).toContain("Sugira uma headline nova normalmente");
  });

  it("proibe dizer ao usuario que a leitura falhou", () => {
    // Estado do sistema nao e conselho de carreira: quem avisa e o chip do
    // passo de revisao, uma vez, no lugar onde da para agir.
    const p = prompt(true);
    expect(p).toContain("não mencione ao usuário que a leitura falhou");
  });

  it("o bloco de checagens continua igual nos dois casos", () => {
    // A instrucao nao pode ter mexido no que ja existia.
    expect(prompt(true)).toContain(BLOCO_DE_CHECKS);
    expect(prompt(false)).toContain(BLOCO_DE_CHECKS);
  });
});
