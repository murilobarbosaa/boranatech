import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { readQualitative } from "@shared/linkedin/readQualitative";
import { readLinkedinAnalysisResponse } from "@shared/linkedin/readAnalysis";
import {
  decodeLinkedinStoredState,
  encodeLinkedinStoredState,
  LINKEDIN_STORAGE_SHAPE_VERSION,
} from "@/lib/linkedinStoredState";
import { ProcedenciaNota, SugestoesRemovidas } from "./ProcedenciaNota";

/**
 * NOTAS DE PROCEDENCIA (Fase 3, lote 2).
 *
 * Os casos rodam sobre payloads forjados que atravessam os READERS
 * COMPARTILHADOS, e nao sobre props montadas a mao. E de proposito: o que
 * precisa ser travado nao e so "o componente renderiza a frase", e sim "o fato
 * chega do payload ate a tela sem ninguem inventar default no meio". Um teste
 * que passasse `origem="fallback"` direto continuaria verde no dia em que o
 * caminho de dados descartasse a chave.
 *
 * Zero rede: tudo e objeto literal.
 */

afterEach(cleanup);

const QUALITATIVE_BASE = {
  resumo: "Resumo da analise.",
  pontosFortes: ["Ponto um."],
  pontosFracos: ["Fraco um."],
  melhorias: [],
  proximoPasso: "Comece pela headline.",
  headlines: ["Front-end | React", "Front-end | TypeScript"],
  sobreReescrito: "Texto do Sobre.",
  bulletsReescritos: [],
  skillsParaEstudar: [],
  modeloMensagemRecrutador: "Ola, [nome].",
};

function procedenciaDe(procedencia?: Record<string, unknown>) {
  const bruto =
    procedencia === undefined
      ? QUALITATIVE_BASE
      : { ...QUALITATIVE_BASE, procedencia };
  // Serializa e volta: e o mesmo trajeto do jsonb e do sessionStorage.
  const persistido: unknown = JSON.parse(JSON.stringify(bruto));
  return readQualitative(persistido, 3).procedencia;
}

function completa(patch: Record<string, unknown> = {}) {
  return {
    sobreReescrito: "modelo",
    modeloMensagemRecrutador: "modelo",
    sugestoesHeadline: { entregues: 2, removidasPorGate: 0 },
    camposProsaLimpos: 0,
    ...patch,
  };
}

/** Renderiza os DOIS campos de colar da mesma analise, como a pagina faz. */
function renderCampos(procedencia?: Record<string, unknown>) {
  const p = procedenciaDe(procedencia);
  return render(
    <div>
      <ProcedenciaNota campo="sobreReescrito" origem={p.sobreReescrito} />
      <ProcedenciaNota
        campo="modeloMensagemRecrutador"
        origem={p.modeloMensagemRecrutador}
      />
    </div>,
  );
}

describe("N1: origem fallback e independente por campo", () => {
  it("fallback no Sobre rende nota; modelo na mensagem nao rende nada", () => {
    renderCampos(completa({ sobreReescrito: "fallback" }));

    const nota = screen.getByTestId("procedencia-sobreReescrito");
    expect(nota).toBeTruthy();
    expect(nota.getAttribute("data-origem")).toBe("fallback");
    expect(nota.textContent).toContain(
      "Este texto foi escrito pela plataforma",
    );
    expect(nota.textContent).toContain("não passou nas nossas checagens");
    // A independencia por campo e o ponto: um fato por campo, nao por analise.
    expect(
      screen.queryByTestId("procedencia-modeloMensagemRecrutador"),
    ).toBeNull();
  });

  it("a nota e texto real no DOM e nao depende de cor", () => {
    renderCampos(completa({ sobreReescrito: "fallback" }));
    const nota = screen.getByTestId("procedencia-sobreReescrito");

    // role de nota para leitor de tela, e a frase inteira legivel sem estilo.
    expect(nota.getAttribute("role")).toBe("note");
    expect((nota.textContent ?? "").length).toBeGreaterThan(60);
    // O icone nao carrega informacao: some para a arvore de acessibilidade.
    expect(nota.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("fallback nos dois campos rende as duas notas", () => {
    renderCampos(
      completa({
        sobreReescrito: "fallback",
        modeloMensagemRecrutador: "fallback",
      }),
    );

    expect(screen.getByTestId("procedencia-sobreReescrito")).toBeTruthy();
    expect(
      screen.getByTestId("procedencia-modeloMensagemRecrutador"),
    ).toBeTruthy();
  });
});

describe("N2: origem modelo nao rende nota", () => {
  it("os dois campos como modelo: nenhuma nota na tela", () => {
    const { container } = renderCampos(completa());

    expect(screen.queryByTestId("procedencia-sobreReescrito")).toBeNull();
    expect(
      screen.queryByTestId("procedencia-modeloMensagemRecrutador"),
    ).toBeNull();
    expect(container.querySelectorAll("[role='note']").length).toBe(0);
  });
});

describe("N3: origem sem_modelo avisa que a IA nao escreveu", () => {
  it("os dois campos carregam sinal proprio, distinto do fallback", () => {
    renderCampos(
      completa({
        sobreReescrito: "sem_modelo",
        modeloMensagemRecrutador: "sem_modelo",
      }),
    );

    const sobre = screen.getByTestId("procedencia-sobreReescrito");
    const mensagem = screen.getByTestId("procedencia-modeloMensagemRecrutador");

    for (const nota of [sobre, mensagem]) {
      expect(nota.getAttribute("data-origem")).toBe("sem_modelo");
      // A exigencia dura: o usuario NAO pode achar que a IA escreveu.
      expect(nota.textContent).toContain("não foi escrito pela IA");
    }
    // E nao pode ser confundido com o texto do fallback, que fala de checagem
    // reprovada, coisa que aqui nunca aconteceu (nao houve chamada nenhuma).
    expect(sobre.textContent).not.toContain("não passou nas nossas checagens");
  });
});

describe("N4: origem desconhecida (payload antigo) fica em silencio", () => {
  it("payload sem procedencia nao rende nota e nao quebra o render", () => {
    const p = procedenciaDe();
    expect(p.sobreReescrito).toBe("desconhecida");
    expect(p.modeloMensagemRecrutador).toBe("desconhecida");

    const { container } = renderCampos();

    expect(screen.queryByTestId("procedencia-sobreReescrito")).toBeNull();
    expect(
      screen.queryByTestId("procedencia-modeloMensagemRecrutador"),
    ).toBeNull();
    expect(container.querySelectorAll("[role='note']").length).toBe(0);
  });
});

describe("N5: sugestoes de headline removidas por gate", () => {
  function renderSugestoes(procedencia?: Record<string, unknown>) {
    const p = procedenciaDe(procedencia);
    return render(
      <SugestoesRemovidas
        entregues={p.sugestoesHeadline.entregues}
        removidas={p.sugestoesHeadline.removidasPorGate}
      />,
    );
  }

  it("entregues 1 e removidas 2: linha com a contagem", () => {
    renderSugestoes(
      completa({ sugestoesHeadline: { entregues: 1, removidasPorGate: 2 } }),
    );

    const linha = screen.getByTestId("procedencia-sugestoes-headline");
    expect(linha.textContent).toContain("2 sugestões foram removidas");
    expect(linha.textContent).toContain("checagens de qualidade");
    // Nao e o estado de lista vazia: ainda sobrou sugestao na tela.
    expect(linha.textContent).not.toContain("Nenhuma sugestão");
  });

  it("entregues 0 e removidas 3: vazio EXPLICADO, distinto do vazio legitimo", () => {
    renderSugestoes(
      completa({ sugestoesHeadline: { entregues: 0, removidasPorGate: 3 } }),
    );

    const linha = screen.getByTestId("procedencia-sugestoes-headline");
    expect(linha.textContent).toContain("Nenhuma sugestão de headline sobrou");
    expect(linha.textContent).toContain("as 3 que a IA escreveu");
  });

  it("removidas 0: nada na tela", () => {
    const { container } = renderSugestoes(
      completa({ sugestoesHeadline: { entregues: 3, removidasPorGate: 0 } }),
    );

    expect(screen.queryByTestId("procedencia-sugestoes-headline")).toBeNull();
    expect(container.textContent).toBe("");
  });

  it("contagem indisponivel (payload antigo): nada na tela", () => {
    const p = procedenciaDe();
    expect(p.sugestoesHeadline.removidasPorGate).toBe("indisponivel");

    const { container } = renderSugestoes();

    expect(screen.queryByTestId("procedencia-sugestoes-headline")).toBeNull();
    expect(container.textContent).toBe("");
  });
});

describe("N6: o caminho de dados do cliente preserva a procedencia", () => {
  const RESPOSTA = {
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    qualitativeVersion: 3,
    deterministicVersion: 8,
    deterministic: {
      score: 55,
      faixa: "em-construcao",
      checks: [],
      keywordsEncontradas: [],
      keywordsFaltantes: [],
      titulosIngles: [],
      headline: "Front-end | React",
      sobreTamanho: 10,
    },
    qualitative: {
      ...QUALITATIVE_BASE,
      procedencia: completa({ sobreReescrito: "fallback" }),
    },
  };

  it("analyze e historico: readLinkedinAnalysisResponse nao descarta a chave", () => {
    const lido = readLinkedinAnalysisResponse(
      JSON.parse(JSON.stringify(RESPOSTA)),
    );
    expect(lido).not.toBeNull();

    const view = readQualitative(lido?.qualitative, lido?.qualitativeVersion);
    expect(view.procedencia.sobreReescrito).toBe("fallback");
    expect(view.procedencia.modeloMensagemRecrutador).toBe("modelo");
  });

  it("sessionStorage: encode e decode preservam a procedencia", () => {
    const lido = readLinkedinAnalysisResponse(
      JSON.parse(JSON.stringify(RESPOSTA)),
    );
    const bruto = encodeLinkedinStoredState({
      form: {},
      result: lido,
      analysisId: null,
      textoHash: null,
      headlineManual: null,
    });
    const voltou = decodeLinkedinStoredState(bruto);

    const view = readQualitative(
      voltou?.result?.qualitative,
      voltou?.result?.qualitativeVersion,
    );
    expect(view.procedencia.sobreReescrito).toBe("fallback");
  });

  it("estado armazenado ANTIGO, sem procedencia, le como desconhecida e nao quebra", () => {
    // Shape gravado por um bundle anterior ao lote 1: o objeto simplesmente
    // nao existe. A leitura fail-closed acontece no reader compartilhado, e
    // NAO por um default escrito aqui no cliente.
    const antigo = JSON.stringify({
      version: LINKEDIN_STORAGE_SHAPE_VERSION,
      form: {},
      result: { ...RESPOSTA, qualitative: QUALITATIVE_BASE },
      analysisId: null,
      textoHash: null,
      headlineManual: null,
    });
    const voltou = decodeLinkedinStoredState(antigo);
    expect(voltou?.result).not.toBeNull();

    const p = readQualitative(
      voltou?.result?.qualitative,
      voltou?.result?.qualitativeVersion,
    ).procedencia;
    expect(p.sobreReescrito).toBe("desconhecida");
    expect(p.sugestoesHeadline.entregues).toBe("indisponivel");

    const { container } = render(
      <div>
        <ProcedenciaNota campo="sobreReescrito" origem={p.sobreReescrito} />
        <SugestoesRemovidas
          entregues={p.sugestoesHeadline.entregues}
          removidas={p.sugestoesHeadline.removidasPorGate}
        />
      </div>,
    );

    expect(container.querySelectorAll("[role='note']").length).toBe(0);
  });
});
