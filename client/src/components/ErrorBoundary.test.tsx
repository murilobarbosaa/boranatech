import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ErrorBoundary from "./ErrorBoundary";
import {
  EVENT_ID_DE_TESTE,
  capturados,
} from "@/lib/__mocks__/sentryEspiaoClient";

/**
 * Prova que o `componentDidCatch` reporta, e que o erro fica CONTIDO.
 *
 * O que este arquivo existe para impedir: a versão anterior do boundary tinha
 * só `getDerivedStateFromError`, trocava o render e perdia o erro. Um
 * `TypeError` de render não gerava 500 no servidor e não chegava a lugar
 * nenhum, então a única evidência de que alguém tinha visto tela quebrada era
 * indireta (a análise persistida sem ninguém para ler).
 */

vi.mock("@sentry/react", async () => {
  const { espiaoClient } = await import("@/lib/__mocks__/sentryEspiaoClient");
  return espiaoClient();
});

function Bomba(): never {
  throw new Error("estourou no render");
}

let erroDoConsole: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  capturados.length = 0;
  // React loga o erro do boundary no console. Silenciar mantém a saída do teste
  // legível, sem esconder falha do teste em si.
  erroDoConsole = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  erroDoConsole.mockRestore();
});

describe("ErrorBoundary", () => {
  it("CAPTURA o erro em vez de engolir, com origem e escopo", () => {
    render(
      <ErrorBoundary escopo="teste-escopo">
        <Bomba />
      </ErrorBoundary>,
    );

    expect(capturados).toHaveLength(1);
    expect((capturados[0].error as Error).message).toBe("estourou no render");
    expect(capturados[0].opts.tags).toMatchObject({
      origem: "error-boundary",
      escopo: "teste-escopo",
    });
    // O componentStack é o que diz ONDE quebrou. Sem ele o evento vira
    // "algo quebrou em algum lugar", que é quase o silêncio de antes.
    expect(capturados[0].opts.extra).toHaveProperty("componentStack");
  });

  it("`escopo` ausente vira `app`, não vira undefined na tag", () => {
    render(
      <ErrorBoundary>
        <Bomba />
      </ErrorBoundary>,
    );
    expect(capturados[0].opts.tags).toMatchObject({ escopo: "app" });
  });

  it("NÃO mostra stack para o usuário, e a copy é em português", () => {
    render(
      <ErrorBoundary>
        <Bomba />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Algo quebrou nesta tela")).toBeTruthy();
    expect(screen.getByText(/Recarregar a página/)).toBeTruthy();
    // O texto do erro e o rastro NUNCA podem aparecer na tela.
    expect(document.body.textContent).not.toContain("estourou no render");
    expect(document.body.textContent).not.toContain("Bomba");
    expect(document.body.textContent).not.toContain("at ");
  });

  it("mostra o código curto do evento, para a pessoa citar no suporte", () => {
    render(
      <ErrorBoundary>
        <Bomba />
      </ErrorBoundary>,
    );
    expect(screen.getByText(EVENT_ID_DE_TESTE.slice(0, 8))).toBeTruthy();
  });

  it("CONTÉM o erro: o que está fora do boundary continua de pé", () => {
    render(
      <div>
        <p>cabecalho que precisa sobreviver</p>
        <ErrorBoundary escopo="estreito">
          <Bomba />
        </ErrorBoundary>
        <p>rodape que precisa sobreviver</p>
      </div>,
    );

    expect(screen.getByText("cabecalho que precisa sobreviver")).toBeTruthy();
    expect(screen.getByText("rodape que precisa sobreviver")).toBeTruthy();
  });

  it("usa o fallback de domínio quando ele é passado", () => {
    render(
      <ErrorBoundary
        escopo="linkedin-resultado"
        fallback={({ eventId }) => (
          <p>nao foi possivel montar. codigo {eventId?.slice(0, 8)}</p>
        )}
      >
        <Bomba />
      </ErrorBoundary>,
    );

    expect(
      screen.getByText(
        `nao foi possivel montar. codigo ${EVENT_ID_DE_TESTE.slice(0, 8)}`,
      ),
    ).toBeTruthy();
    // E o fallback padrão NÃO aparece junto.
    expect(screen.queryByText("Algo quebrou nesta tela")).toBeNull();
  });
});
