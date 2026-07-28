import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ErrorBoundary from "./ErrorBoundary";

/**
 * SEM MOCK DE PROPÓSITO. Este arquivo roda o `@sentry/react` DE VERDADE e
 * nunca chama `initClientSentry`, que é exatamente o estado de hoje em
 * produção e o estado permanente de todo build local e do CI (nenhum deles tem
 * `VITE_SENTRY_DSN`).
 *
 * Por que ele é separado de `ErrorBoundary.test.tsx`: `vi.mock` é de arquivo.
 * Um teste que mocka o Sentry prova que a chamada acontece com o payload certo,
 * e NÃO prova que a chamada é segura sem DSN, que é a outra metade e a que
 * derrubaria a tela de todo mundo se estivesse errada. Duas perguntas
 * diferentes, dois arquivos.
 */

function Bomba(): never {
  throw new Error("estourou sem dsn");
}

let erroDoConsole: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  erroDoConsole = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  erroDoConsole.mockRestore();
});

describe("ErrorBoundary sem DSN configurado", () => {
  it("não lança ao capturar, e mostra o fallback", () => {
    expect(() =>
      render(
        <ErrorBoundary>
          <Bomba />
        </ErrorBoundary>,
      ),
    ).not.toThrow();

    expect(screen.getByText("Algo quebrou nesta tela")).toBeTruthy();
  });

  it("sem DSN o erro segue contido: o resto da árvore sobrevive", () => {
    render(
      <div>
        <p>vizinho intacto</p>
        <ErrorBoundary>
          <Bomba />
        </ErrorBoundary>
      </div>,
    );
    expect(screen.getByText("vizinho intacto")).toBeTruthy();
  });
});
