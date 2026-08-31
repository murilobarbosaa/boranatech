import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

/**
 * CONTENCAO por bloco.
 *
 * O que este teste protege e a propriedade que motivou o boundary: um bloco que
 * lanca no render nao pode levar os vizinhos junto. Antes desta fatia o admin
 * nao tinha nenhum boundary entre o `App.tsx` e os blocos, entao as onze
 * leituras soltas encontradas na varredura de 2026-08-01 derrubavam a PAGINA
 * INTEIRA, nenhuma derrubava so o bloco.
 *
 * O reporter e dublado no `@sentry/react`, e nao verificado por console: o
 * `ErrorBoundary` do projeto ja teve uma versao que trocava a tela SEM reportar
 * (so `getDerivedStateFromError`), e o defeito era invisivel justamente porque
 * a tela de erro aparecia. Aqui a chegada ao Sentry e afirmada.
 */

const capturado = vi.hoisted(() => ({
  chamadas: [] as Array<{ erro: unknown; escopo: unknown }>,
}));

vi.mock("@sentry/react", () => ({
  captureException: (
    erro: unknown,
    ctx?: { tags?: Record<string, unknown> },
  ) => {
    capturado.chamadas.push({ erro, escopo: ctx?.tags?.escopo });
    return "evt_1234567890";
  },
}));

import { BlocoBoundary } from "./BlocoBoundary";

function Explode(): never {
  throw new Error("payload sem o campo novo");
}

function Vizinho() {
  return <p>vizinho inteiro</p>;
}

afterEach(() => {
  cleanup();
  capturado.chamadas.length = 0;
  vi.restoreAllMocks();
});

describe("BlocoBoundary", () => {
  it("contem o erro: o bloco quebra e o VIZINHO continua renderizando", () => {
    // Sem boundary, o throw sobe ate a raiz e leva os dois.
    render(
      <div>
        <BlocoBoundary nome="Funil até o assinante pago">
          <Explode />
        </BlocoBoundary>
        <Vizinho />
      </div>,
    );

    expect(screen.getByTestId("bloco-quebrado")).toBeTruthy();
    expect(screen.getByText("vizinho inteiro")).toBeTruthy();
  });

  it("diz QUAL bloco quebrou, na tela", () => {
    render(
      <BlocoBoundary nome="Cadastros por dia">
        <Explode />
      </BlocoBoundary>,
    );

    // Cartao vermelho sem nome deixa a pessoa sem saber o que perdeu.
    expect(
      screen.getByTestId("bloco-quebrado").getAttribute("data-bloco"),
    ).toBe("Cadastros por dia");
    expect(screen.getByText("Cadastros por dia")).toBeTruthy();
  });

  it("NAO engole: o erro chega ao reporter, com o escopo do bloco", () => {
    render(
      <BlocoBoundary nome="Receita recorrente e assinantes">
        <Explode />
      </BlocoBoundary>,
    );

    expect(capturado.chamadas).toHaveLength(1);
    expect((capturado.chamadas[0].erro as Error).message).toBe(
      "payload sem o campo novo",
    );
    // A tag separa "o app inteiro caiu" de "um bloco caiu", que tem gravidades
    // diferentes no painel de erros.
    expect(capturado.chamadas[0].escopo).toBe(
      "admin-bloco:Receita recorrente e assinantes",
    );
  });

  it("mostra o codigo do evento, para a pessoa citar no suporte", () => {
    render(
      <BlocoBoundary nome="Aquisição de usuários">
        <Explode />
      </BlocoBoundary>,
    );

    expect(screen.getByText("evt_1234")).toBeTruthy();
  });

  it("`reset` remonta o bloco sem recarregar a pagina", () => {
    let deveExplodir = true;
    function AsVezes() {
      if (deveExplodir) throw new Error("transitorio");
      return <p>bloco de volta</p>;
    }

    render(
      <BlocoBoundary nome="Eventos recentes">
        <AsVezes />
      </BlocoBoundary>,
    );
    expect(screen.getByTestId("bloco-quebrado")).toBeTruthy();

    // Erro transitorio (uma resposta estranha da API) nao pode custar um F5.
    deveExplodir = false;
    fireEvent.click(screen.getByText("Tentar de novo"));

    expect(screen.getByText("bloco de volta")).toBeTruthy();
    expect(screen.queryByTestId("bloco-quebrado")).toBeNull();
  });

  it("no modo compacto o fallback continua sendo UMA linha", () => {
    // A faixa de saude e uma linha quando esta tudo bem; um cartao de 8rem no
    // lugar dela chamaria mais atencao quebrada do que inteira.
    const { container } = render(
      <BlocoBoundary nome="Saúde do sistema" compacto>
        <Explode />
      </BlocoBoundary>,
    );

    const fallback = screen.getByTestId("bloco-quebrado");
    expect(fallback.tagName).toBe("P");
    expect(container.querySelector("[data-testid='bloco-quebrado'] div")).toBe(
      null,
    );
    // Mesmo compacto, reporta.
    expect(capturado.chamadas).toHaveLength(1);
  });

  it("bloco que NAO lanca passa direto, sem casca visivel", () => {
    render(
      <BlocoBoundary nome="Qualquer">
        <Vizinho />
      </BlocoBoundary>,
    );

    expect(screen.getByText("vizinho inteiro")).toBeTruthy();
    expect(screen.queryByTestId("bloco-quebrado")).toBeNull();
    expect(capturado.chamadas).toHaveLength(0);
  });
});
