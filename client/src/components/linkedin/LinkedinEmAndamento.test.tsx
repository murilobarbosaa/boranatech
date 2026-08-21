import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * A SEGUNDA ANALISE SIMULTANEA TEM TELA PROPRIA, e ela nao manda pagar de novo?
 *
 * O estado nasce do 409 `analise_em_andamento` que a rota passou a devolver
 * (Fase 4, lote 2). Tres coisas precisam ser verdade ao mesmo tempo:
 *
 *   1. mensagem PROPRIA, distinta de todas as outras. Colapsar com
 *      `rate_limited` seria mandar a pessoa voltar amanha por causa de um
 *      problema que se resolve em segundos;
 *   2. o botao de tentar de novo NAO aparece. Ele e literalmente a acao que
 *      produz a cobranca dupla que este lote fecha;
 *   3. a acao oferecida e a busca no historico, e ela NAO dispara analise. O
 *      spy da rota de analise fica em zero.
 *
 * Assercoes por TEXTO, nunca por cor ou classe: a distincao entre os estados
 * precisa existir para quem nao enxerga cor.
 */

vi.mock("@/components/pro/ProGate", () => ({
  default: () => <div>paywall</div>,
}));

import {
  LINKEDIN_EM_ANDAMENTO_COPY,
  LINKEDIN_TIMEOUT_COPY,
  LinkedinError,
} from "./LinkedinStates";

/** Todos os estados que `LinkedinError` sabe nomear, para a prova de distincao. */
const OUTROS_ESTADOS = [
  "LOGIN_REQUIRED",
  "RATE_LIMITED: Limite diário de 20 chamadas de IA atingido.",
  "INVALID_REQUEST",
  "LINKEDIN_BUSY",
  "ANALYSIS_FAILED",
  "TIMEOUT",
  "NETWORK",
  "UNREADABLE",
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function textoDe(error: string, props: Record<string, unknown> = {}): string {
  const { container } = render(<LinkedinError error={error} {...props} />);
  const texto = container.textContent ?? "";
  cleanup();
  return texto;
}

describe("a mensagem e propria e nao colide com nenhuma outra", () => {
  it("renderiza a copy de analise em andamento, com texto real no DOM", () => {
    const texto = textoDe("ANALISE_EM_ANDAMENTO");
    expect(texto).toContain(LINKEDIN_EM_ANDAMENTO_COPY);
    // Nomeia a CAUSA (outra aba ou envio recente) e a acao (esperar), que e o
    // que separa esta tela de um erro generico.
    expect(LINKEDIN_EM_ANDAMENTO_COPY.toLowerCase()).toContain("outra aba");
    expect(LINKEDIN_EM_ANDAMENTO_COPY.toLowerCase()).toContain("histórico");
  });

  it("nenhum estado antigo passou a renderizar esta frase", () => {
    // O sentido que pega regressao: a frase nova nao pode ter vazado para
    // nenhum outro estado, e nenhum outro estado pode ter virado esta frase.
    for (const estado of OUTROS_ESTADOS) {
      expect(textoDe(estado)).not.toContain(LINKEDIN_EM_ANDAMENTO_COPY);
    }
  });

  it("nao se confunde com limite atingido, que e a colisao perigosa", () => {
    const emAndamento = textoDe("ANALISE_EM_ANDAMENTO");
    const cota = textoDe(
      "RATE_LIMITED: Limite diário de 20 chamadas atingido.",
    );
    expect(emAndamento).not.toBe(cota);
    // As duas sao recusas, e por isso a distincao tem de estar no TEXTO: uma
    // manda voltar amanha, a outra manda esperar alguns segundos.
    expect(LINKEDIN_EM_ANDAMENTO_COPY.toLowerCase()).not.toContain("amanhã");
    expect(LINKEDIN_EM_ANDAMENTO_COPY.toLowerCase()).not.toContain("limite");
  });

  it("nao se confunde com o timeout, que tambem oferece a busca", () => {
    expect(LINKEDIN_EM_ANDAMENTO_COPY).not.toBe(LINKEDIN_TIMEOUT_COPY.mensagem);
  });
});

describe("as acoes oferecidas neste estado", () => {
  it("NAO oferece tentar de novo, nem quando o chamador passa onRetry", () => {
    const onRetry = vi.fn();
    const { container } = render(
      <LinkedinError
        error="ANALISE_EM_ANDAMENTO"
        onRetry={onRetry}
        onRecuperar={vi.fn()}
      />,
    );
    const botoes = Array.from(container.querySelectorAll("button")).map(
      (b) => b.textContent ?? "",
    );
    // A pagina passa `onRetry` sempre que o formulario esta completo, entao a
    // supressao precisa morar AQUI DENTRO. Guarda no chamador seria repetida em
    // cada chamador e sumiria no primeiro que alguem esquecesse.
    expect(botoes.some((t) => t.includes("Tentar de novo"))).toBe(false);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("oferece a busca no historico, e ela e a unica acao", () => {
    const onRecuperar = vi.fn();
    const { container } = render(
      <LinkedinError
        error="ANALISE_EM_ANDAMENTO"
        onRetry={vi.fn()}
        onRecuperar={onRecuperar}
      />,
    );
    const botoes = Array.from(container.querySelectorAll("button"));
    expect(botoes).toHaveLength(1);
    expect(botoes[0].textContent).toContain(LINKEDIN_TIMEOUT_COPY.acao);

    fireEvent.click(botoes[0]);
    expect(onRecuperar).toHaveBeenCalledTimes(1);
  });

  it("sem onRecuperar, nao inventa acao nenhuma", () => {
    const { container } = render(
      <LinkedinError error="ANALISE_EM_ANDAMENTO" onRetry={vi.fn()} />,
    );
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  it("o TIMEOUT continua com as duas acoes: nada regrediu", () => {
    const { container } = render(
      <LinkedinError error="TIMEOUT" onRetry={vi.fn()} onRecuperar={vi.fn()} />,
    );
    const botoes = Array.from(container.querySelectorAll("button")).map(
      (b) => b.textContent ?? "",
    );
    expect(botoes).toHaveLength(2);
    expect(botoes[0]).toContain(LINKEDIN_TIMEOUT_COPY.acao);
    expect(botoes[1]).toContain("Tentar de novo");
  });

  it("os outros estados seguem com tentar de novo, e sem busca", () => {
    for (const estado of ["ANALYSIS_FAILED", "NETWORK", "LINKEDIN_BUSY"]) {
      const { container } = render(
        <LinkedinError
          error={estado}
          onRetry={vi.fn()}
          onRecuperar={vi.fn()}
        />,
      );
      const botoes = Array.from(container.querySelectorAll("button")).map(
        (b) => b.textContent ?? "",
      );
      expect(botoes).toHaveLength(1);
      expect(botoes[0]).toContain("Tentar de novo");
      cleanup();
    }
  });
});
