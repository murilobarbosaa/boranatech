import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ATIVOS POR DIA: os estados nomeados do grafico da aba Usuarios.
 *
 * O controle que importa e o NEGATIVO: com o PostHog fora, a tela nao pode
 * desenhar eixo nenhum. Trinta barras zeradas leem como "ninguem usou o site no
 * mes", que e uma afirmacao sobre algo que ninguem conseguiu medir, e e
 * indistinguivel do desenho correto de um mes vazio de verdade.
 *
 * COMO SE AFIRMA "nao desenhou grafico" AQUI. Nao por `.recharts-wrapper`: o
 * ResponsiveContainer mede 0x0 em jsdom e nao emite esse no em estado NENHUM,
 * entao uma asercao negativa sobre ele passa por vacuo, inclusive no caminho
 * feliz. Foi medido nesta frente. O discriminador honesto e o `data-estado` do
 * ChartFrame mais o bloco de tendencia, que so existe no ramo do grafico, e o
 * teste do estado ok afirma os dois no positivo para provar que a negativa dos
 * outros diz alguma coisa.
 */

// jsdom nao implementa ResizeObserver, e o ResponsiveContainer do recharts o
// chama no mount: sem este stub o componente lanca e o corpo do teste fica vazio,
// o que faria as asercoes negativas ("nao desenhou grafico") passarem por
// acidente em TODOS os estados. E o primeiro teste da base a renderizar um
// ResponsiveContainer, entao o stub nasce aqui e nao no setup global.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/adminApi", () => ({
  adminFetch: (...args: unknown[]) => fetchMock(...args),
}));

import { ActiveUsersChart } from "./ActiveUsersChart";

function quadro(): HTMLElement {
  return screen.getByTestId("grafico-ativos-diarios");
}

function serieOk(n: number) {
  const pontos = Array.from({ length: n }, (_, i) => ({
    date: `2026-08-${String(i + 1).padStart(2, "0")}`,
    ativos: i,
  }));
  return { data: { state: "ok", dias: n, pontos } };
}

beforeEach(() => {
  fetchMock.mockReset();
});

afterEach(cleanup);

describe("ActiveUsersChart", () => {
  it("CARREGANDO: enquanto a resposta nao chega, nao afirma numero nenhum", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    render(<ActiveUsersChart />);

    expect(screen.getByText("Ativos por dia")).toBeTruthy();
    // Nenhuma mensagem de fonte fora enquanto simplesmente ainda nao respondeu:
    // "carregando" e "PostHog caiu" sao coisas diferentes.
    expect(screen.queryByText(/Falha ao consultar/)).toBeNull();
    expect(screen.queryByText(/nao configurado/i)).toBeNull();
  });

  it("OK: a serie chega e o grafico monta com a ressalva de unidade", async () => {
    fetchMock.mockResolvedValue(serieOk(30));
    render(<ActiveUsersChart />);

    await waitFor(() =>
      expect(screen.getByText(/Últimos 30 dias/)).toBeTruthy(),
    );
    // A ressalva de UNIDADE e obrigatoria: o numero e presenca por navegador, e
    // sem a frase a tela promete uma contagem de pessoas que ela nao tem.
    expect(screen.getByText(/não por pessoa/)).toBeTruthy();
    expect(screen.queryByText(/Falha ao consultar/)).toBeNull();
    // CONTROLE do controle: no estado ok o grafico EXISTE. Sem esta asercao, o
    // "nao desenhou grafico" dos estados de erro passaria mesmo se o componente
    // nunca desenhasse nada em situacao nenhuma.
    expect(quadro().dataset.estado).toBe("ok");
    expect(screen.getByTestId("grafico-ativos-diarios-tendencia")).toBeTruthy();
  });

  it("POSTHOG FORA (error): mensagem nomeada, e NENHUM grafico", async () => {
    fetchMock.mockResolvedValue({
      data: { state: "error", reason: "boom", httpStatus: 403 },
    });
    render(<ActiveUsersChart />);

    await waitFor(() =>
      expect(
        screen.getByText(/Falha ao consultar o PostHog \(HTTP 403\)/),
      ).toBeTruthy(),
    );
    // CONTROLE NEGATIVO, o teste que decide o desenho: sem ele, um estado de
    // erro que caisse no ramo "ok com zero pontos" desenharia eixo e passaria.
    expect(quadro().dataset.estado).toBe("erro");
    expect(screen.queryByTestId("grafico-ativos-diarios-tendencia")).toBeNull();
  });

  it("POSTHOG NAO CONFIGURADO: nomeia o que falta, e NENHUM grafico", async () => {
    fetchMock.mockResolvedValue({
      data: { state: "not_configured", missing: ["POSTHOG_API_KEY"] },
    });
    render(<ActiveUsersChart />);

    await waitFor(() =>
      expect(screen.getByText(/POSTHOG_API_KEY/)).toBeTruthy(),
    );
    expect(quadro().dataset.estado).toBe("erro");
    expect(screen.queryByTestId("grafico-ativos-diarios-tendencia")).toBeNull();
  });

  it("JANELA DE DEPLOY: payload ok SEM pontos degrada, nao vira TypeError", async () => {
    // Backend antigo respondendo ao front novo. O componente le `pontos` no
    // corpo, entao uma leitura solta aqui derrubaria a aba inteira.
    fetchMock.mockResolvedValue({ data: { state: "ok" } });
    render(<ActiveUsersChart />);

    await waitFor(() =>
      expect(screen.getByText("Ativos por dia")).toBeTruthy(),
    );
    expect(screen.queryByText(/Falha ao consultar/)).toBeNull();
  });

  it("a busca inicial pede a janela padrao de 30 dias", async () => {
    fetchMock.mockResolvedValue(serieOk(30));
    render(<ActiveUsersChart />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith("/users-active-daily?window=30");
  });

  it("trocar a janela refaz a busca com o parametro novo", async () => {
    fetchMock.mockResolvedValue(serieOk(30));
    render(<ActiveUsersChart />);
    await waitFor(() =>
      expect(screen.getByText(/Últimos 30 dias/)).toBeTruthy(),
    );

    fetchMock.mockClear();
    fetchMock.mockResolvedValue(serieOk(7));
    fireEvent.click(screen.getByRole("button", { name: "7 dias" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/users-active-daily?window=7"),
    );
    await waitFor(() =>
      expect(screen.getByText(/Últimos 7 dias/)).toBeTruthy(),
    );
    // O rodape recalcula sobre a janela EXIBIDA: sem isto, trocar o periodo
    // mudaria as barras e deixaria a ressalva falando do periodo anterior.
    expect(screen.queryByText(/Últimos 30 dias/)).toBeNull();
  });

  it("o seletor sobrevive ao ERRO, senao a pessoa fica presa na janela quebrada", async () => {
    // O motivo de o seletor morar no slot `controles` e nao no `extra`: o
    // `extra` so renderiza no ramo do grafico, entao um 400 numa janela
    // esconderia justamente o controle que permite sair dela. Sem recarregar a
    // pagina nao haveria caminho de volta.
    fetchMock.mockResolvedValue({
      data: { state: "error", reason: "boom", httpStatus: 400 },
    });
    render(<ActiveUsersChart />);

    await waitFor(() =>
      expect(screen.getByText(/Falha ao consultar/)).toBeTruthy(),
    );
    expect(screen.getByTestId("ativos-periodo")).toBeTruthy();
    expect(screen.getByRole("button", { name: "7 dias" })).toBeTruthy();
  });

  it('NAO oferece a janela "Tudo" da Visao', async () => {
    // Serie diaria sem corte nao tem teto de baldes. O server recusa "all" com
    // 400, e a tela nao pode oferecer o que a rota nega.
    fetchMock.mockResolvedValue(serieOk(30));
    render(<ActiveUsersChart />);
    await waitFor(() =>
      expect(screen.getByTestId("ativos-periodo")).toBeTruthy(),
    );

    expect(screen.queryByRole("button", { name: "Tudo" })).toBeNull();
    const pilulas = within(screen.getByTestId("ativos-periodo")).getAllByRole(
      "button",
    );
    expect(pilulas.map((b) => b.textContent)).toEqual(["7 dias", "30 dias"]);
  });

  it("ERRO DE REDE na propria chamada vira mensagem, nao grafico vazio", async () => {
    fetchMock.mockRejectedValue(new Error("Erro ao carregar os ativos."));
    render(<ActiveUsersChart />);

    await waitFor(() =>
      expect(screen.getByText("Erro ao carregar os ativos.")).toBeTruthy(),
    );
    expect(quadro().dataset.estado).toBe("erro");
    expect(screen.queryByTestId("grafico-ativos-diarios-tendencia")).toBeNull();
  });
});
