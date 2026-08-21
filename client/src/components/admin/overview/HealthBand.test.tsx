import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/lib/adminApi", () => ({ adminFetch: h.fetch }));

import { HealthBand } from "./HealthBand";

/**
 * A faixa que substitui os dois cartões de saúde.
 *
 * A propriedade que importa: quando está tudo bem, ela quase não existe. Badge
 * verde decorativo treina a pessoa a não olhar, e aí o vermelho também não é
 * visto.
 */

beforeEach(() => {
  // Corpo em bloco de propósito: `mockReset()` devolve o próprio mock, e um
  // hook que devolve algo não-undefined faz o vitest esperar por ele.
  h.fetch.mockReset();
});
afterEach(cleanup);

function responde(data: unknown) {
  h.fetch.mockResolvedValue({ data });
}

describe("verde é ausência", () => {
  it("tudo bem: uma linha discreta, sem cartão nem cor forte", async () => {
    responde({ ok: true, problemas: [] });
    render(<HealthBand />);

    const faixa = await screen.findByTestId("health-band");
    expect(faixa.getAttribute("data-estado")).toBe("ok");
    expect(faixa.textContent).toContain("Tudo operacional");
    // Sem borda, sem fundo colorido, sem botão de expandir: não há o que abrir.
    expect(faixa.className).not.toContain("border-2");
    expect(faixa.querySelector("button")).toBeNull();
    expect(screen.queryByTestId("health-band-lista")).toBeNull();
  });

  it("enquanto carrega não ocupa espaço nenhum", async () => {
    h.fetch.mockReturnValue(new Promise(() => {}));
    const { container } = render(<HealthBand />);
    expect(container.textContent).toBe("");
  });
});

describe("vermelho expande, e só com o que quebrou", () => {
  const doisProblemas = {
    ok: false,
    problemas: [
      {
        id: "database",
        label: "Banco de dados",
        detalhe: "O health check não conseguiu consultar o banco.",
        severidade: "erro" as const,
      },
      {
        id: "posthog",
        label: "PostHog",
        detalhe: "A sonda do PostHog falhou.",
        severidade: "atencao" as const,
      },
    ],
  };

  it("colapsada por padrão, mostrando só o resumo", async () => {
    responde(doisProblemas);
    render(<HealthBand />);

    const faixa = await screen.findByTestId("health-band");
    expect(faixa.getAttribute("data-estado")).toBe("erro");
    expect(faixa.textContent).toContain("1 falha");
    expect(faixa.textContent).toContain("1 aviso");
    // Colapsada: o detalhe não está na tela ainda.
    expect(screen.queryByTestId("health-band-lista")).toBeNull();
  });

  it("expandida, lista APENAS os problemas", async () => {
    responde(doisProblemas);
    render(<HealthBand />);
    fireEvent.click(await screen.findByRole("button"));

    const lista = screen.getByTestId("health-band-lista");
    expect(lista.querySelectorAll("li")).toHaveLength(2);
    expect(lista.textContent).toContain("Banco de dados");
    expect(lista.textContent).toContain("PostHog");
    // Nada de listar os sinais que estão bem para dizer que estão bem.
    expect(lista.textContent).not.toContain("Stripe");
    expect(lista.textContent).not.toContain("Redis");
  });

  it("só avisos não vira 'falha'", async () => {
    responde({
      ok: false,
      problemas: [
        {
          id: "redis",
          label: "Redis",
          detalhe: "Sem resposta.",
          severidade: "atencao" as const,
        },
      ],
    });
    render(<HealthBand />);

    const faixa = await screen.findByTestId("health-band");
    expect(faixa.getAttribute("data-estado")).toBe("atencao");
    expect(faixa.textContent).not.toContain("falha");
  });

  it("o botão declara o estado de expansão para leitor de tela", async () => {
    responde(doisProblemas);
    render(<HealthBand />);
    const botao = await screen.findByRole("button");
    expect(botao.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(botao);
    expect(botao.getAttribute("aria-expanded")).toBe("true");
  });
});

describe("cron parado e boleto em limbo aparecem", () => {
  it("cron do snapshot parado sai como falha, com os dias", async () => {
    responde({
      ok: false,
      problemas: [
        {
          id: "snapshot-parado",
          label: "Cron de snapshot parado",
          detalhe: "Sem snapshot há 4 dias. A série de MRR parou de crescer.",
          severidade: "erro" as const,
        },
      ],
    });
    render(<HealthBand />);
    fireEvent.click(await screen.findByRole("button"));

    const lista = screen.getByTestId("health-band-lista");
    expect(lista.textContent).toContain("Cron de snapshot parado");
    expect(lista.textContent).toContain("4 dias");
  });

  it("boleto em limbo sai com valor e prazo", async () => {
    responde({
      ok: false,
      problemas: [
        {
          id: "boleto-limbo",
          label: "Boleto emitido e não pago",
          detalhe:
            "1 boleto(s), R$ 222,00 parados. O primeiro expira em 3 dia(s).",
          severidade: "atencao" as const,
        },
      ],
    });
    render(<HealthBand />);
    fireEvent.click(await screen.findByRole("button"));

    const lista = screen.getByTestId("health-band-lista");
    expect(lista.textContent).toContain("R$ 222,00");
    expect(lista.textContent).toContain("3 dia");
  });
});

describe("a faixa não mente sobre si mesma", () => {
  it("falha da própria checagem NÃO vira 'tudo operacional'", async () => {
    // Seria a mentira mais cara desta tela: dizer que está tudo bem quando não
    // se sabe.
    h.fetch.mockRejectedValue(new Error("timeout"));
    render(<HealthBand />);

    const faixa = await screen.findByTestId("health-band");
    expect(faixa.getAttribute("data-estado")).toBe("indisponivel");
    expect(faixa.textContent).not.toContain("Tudo operacional");
  });

  it("sonda lenta não trava: a faixa é a única coisa que espera", async () => {
    // A busca é própria, fora do bloco de chamadas da página. Enquanto ela
    // pendura, o componente devolve null e não bloqueia render nenhum.
    let resolver: (v: unknown) => void = () => {};
    h.fetch.mockReturnValue(new Promise((r) => (resolver = r)));
    const { container } = render(<HealthBand />);

    expect(container.textContent).toBe("");
    resolver({ data: { ok: true, problemas: [] } });
    await waitFor(() =>
      expect(screen.getByTestId("health-band").textContent).toContain(
        "Tudo operacional",
      ),
    );
  });
});
