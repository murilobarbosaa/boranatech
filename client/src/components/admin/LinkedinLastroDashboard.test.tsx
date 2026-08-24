import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O CARD DE VIOLACOES DE LASTRO no admin.
 *
 * Tres coisas travadas aqui, e a terceira e a que herda a regra do lote:
 *
 *   1. TOTALIDADE dos rotulos: todo tipo da uniao tem nome legivel, e um tipo
 *      novo sem rotulo nao compila (`Record<TipoViolacao, string>`);
 *   2. os quatro estados sao DISTINTOS: carregando, erro, periodo sem violacao
 *      e periodo sem medicao nenhuma. Os dois ultimos sao o par que mais fecha
 *      em colapso na pratica, porque os dois "nao tem numero para mostrar";
 *   3. PRIVACIDADE: nada de texto de usuario chega ao DOM, mesmo que o
 *      endpoint devolva alguma coisa a mais.
 *
 * Asserts por texto e `data-testid`, nunca por cor.
 */

const adminFetch = vi.fn();
vi.mock("@/lib/adminApi", () => ({
  adminFetch: (path: string) => adminFetch(path),
}));

import { TIPOS_DE_VIOLACAO } from "@shared/linkedin/lastro";
import { LinkedinLastroDashboard } from "./LinkedinLastroDashboard";

const MARCADOR = "ZQXJTEXTODOUSUARIOZQXJ";

function resposta(patch: Record<string, unknown> = {}) {
  return {
    data: {
      analises: 10,
      comResumo: 10,
      semResumo: 0,
      total: 3,
      porTipo: { idioma_incorreto: 2, numeral_fabricado: 1 },
      janelaDias: 7,
      truncado: false,
      ...patch,
    },
  };
}

beforeEach(() => {
  adminFetch.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("TOTALIDADE: todo tipo tem rotulo legivel", () => {
  it("nenhum tipo aparece como chave crua de banco", async () => {
    // Um tipo sem rotulo cairia na tela como `prosa_numeral_sem_lastro`. O
    // `Record<TipoViolacao, string>` do componente ja impede em compilacao;
    // aqui a prova e no DOM, com TODOS os tipos presentes de uma vez.
    const porTipo = Object.fromEntries(TIPOS_DE_VIOLACAO.map((t) => [t, 1]));
    adminFetch.mockResolvedValue(
      resposta({ porTipo, total: TIPOS_DE_VIOLACAO.length }),
    );
    render(<LinkedinLastroDashboard />);

    await waitFor(() => {
      expect(screen.getAllByTestId("lastro-linha")).toHaveLength(
        TIPOS_DE_VIOLACAO.length,
      );
    });
    for (const tipo of TIPOS_DE_VIOLACAO) {
      expect(screen.queryByText(tipo)).toBeNull();
    }
  });

  it("mostra as contagens por tipo e o total", async () => {
    adminFetch.mockResolvedValue(resposta());
    render(<LinkedinLastroDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Campo no idioma errado/i)).toBeTruthy();
    });
    expect(screen.getByText(/Número inventado/i)).toBeTruthy();
    // So os tipos COM ocorrencia entram: doze linhas zeradas seriam ruido.
    expect(screen.getAllByTestId("lastro-linha")).toHaveLength(2);
  });
});

describe("os estados nao colapsam", () => {
  it("carregando tem texto proprio", () => {
    adminFetch.mockReturnValue(new Promise(() => {}));
    render(<LinkedinLastroDashboard />);
    expect(screen.getByText(/Carregando violações de lastro/i)).toBeTruthy();
  });

  it("resposta INCOMPLETA vira estado nomeado, nao contagem fabricada", async () => {
    // O caso real que o merge da main expos: `{}` e truthy, passa pelo
    // `if (!data)` e ate este lote quebrava a arvore inteira em
    // `data.porTipo[tipo]` com "Cannot read properties of undefined". O mock de
    // um teste vizinho devolvia exatamente `{ data: {} }` para toda rota que
    // ele nao conhecia, e este componente e uma delas.
    adminFetch.mockResolvedValue({ data: {} });
    render(<LinkedinLastroDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/veio incompleta/i)).toBeTruthy();
    });
    // NADA de numero fabricado: nem linha por tipo, nem `undefined` na janela.
    // Esta metade e a que importa. Um estado de erro que ainda assim pintasse
    // "0" teria trocado o crash por uma mentira silenciosa.
    expect(screen.queryAllByTestId("lastro-linha")).toHaveLength(0);
    expect(screen.queryByText(/undefined/i)).toBeNull();
  });

  it("periodo sem violacao NAO cai na guarda de forma", async () => {
    // Controle negativo, e ele e o que impede a guarda de virar larga demais:
    // `porTipo` vazio COM os numeros presentes e periodo limpo, nao resposta
    // quebrada, e tem de continuar sendo o estado vazio de sempre.
    adminFetch.mockResolvedValue(resposta({ porTipo: {}, total: 0 }));
    render(<LinkedinLastroDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("lastro-vazio")).toBeTruthy();
    });
    expect(screen.queryAllByTestId("lastro-linha")).toHaveLength(0);
    expect(screen.queryByText(/veio incompleta/i)).toBeNull();
  });

  it("erro tem texto proprio, e nao vira estado vazio", async () => {
    adminFetch.mockRejectedValue(new Error("backend fora"));
    render(<LinkedinLastroDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/backend fora/i)).toBeTruthy();
    });
    // Falha de carga NAO pode parecer "nenhuma violacao".
    expect(screen.queryByTestId("lastro-vazio")).toBeNull();
  });

  it("periodo medido e sem violacao: estado vazio HONESTO", async () => {
    adminFetch.mockResolvedValue(
      resposta({ total: 0, porTipo: {}, comResumo: 10, semResumo: 0 }),
    );
    render(<LinkedinLastroDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("lastro-vazio")).toBeTruthy();
    });
    expect(
      screen.getByText(/Nenhuma violação de lastro no período/i),
    ).toBeTruthy();
  });

  it("periodo SEM medicao nenhuma diz isso, e nao 'nenhuma violacao'", async () => {
    // A distincao que o lote inteiro existe para preservar: "medi e deu zero" e
    // "nao medi" nao podem compartilhar tela.
    adminFetch.mockResolvedValue(
      resposta({ total: 0, porTipo: {}, comResumo: 0, semResumo: 10 }),
    );
    render(<LinkedinLastroDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("lastro-vazio")).toBeTruthy();
    });
    expect(screen.getByText(/não há o que contar ainda/i)).toBeTruthy();
    expect(
      screen.queryByText(/Nenhuma violação de lastro no período/i),
    ).toBeNull();
  });

  it("analises antigas sem medicao aparecem como denominador declarado", async () => {
    adminFetch.mockResolvedValue(
      resposta({ analises: 40, comResumo: 12, semResumo: 28 }),
    );
    render(<LinkedinLastroDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("lastro-sem-medicao")).toBeTruthy();
    });
    expect(screen.getByText(/28 de 40 análises/i)).toBeTruthy();
  });

  it("corte por volume e avisado, em vez de o total mentir completude", async () => {
    adminFetch.mockResolvedValue(resposta({ truncado: true }));
    render(<LinkedinLastroDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/mais análises do que o painel lê de uma vez/i),
      ).toBeTruthy();
    });
  });
});

describe("PRIVACIDADE: o card nao renderiza texto de usuario", () => {
  it("campo extra na resposta nao chega ao DOM", async () => {
    // O endpoint nao devolve texto, e ha teste dele para isso. Este aqui e a
    // segunda barreira: mesmo que passasse a devolver, o card nao renderiza o
    // que nao esta no seu contrato.
    adminFetch.mockResolvedValue(
      resposta({
        resumo: MARCADOR,
        headline: MARCADOR,
        porTipo: { idioma_incorreto: 1, [MARCADOR]: 4 },
      }),
    );
    const { container } = render(<LinkedinLastroDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Campo no idioma errado/i)).toBeTruthy();
    });
    expect(container.textContent ?? "").not.toContain("ZQXJ");
  });

  it("pede o endpoint de contagem, e nao a lista de analises", async () => {
    adminFetch.mockResolvedValue(resposta());
    render(<LinkedinLastroDashboard />);
    await waitFor(() => {
      expect(adminFetch).toHaveBeenCalledWith("/linkedin-lastro");
    });
    expect(adminFetch).toHaveBeenCalledTimes(1);
  });
});
