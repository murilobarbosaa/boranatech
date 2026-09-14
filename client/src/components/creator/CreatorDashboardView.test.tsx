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
 * CreatorDashboardView: o painel desenhado a partir do payload, sem busca.
 *
 * O payload e o do teste do montador no servidor
 * (server/lib/creatorDashboard.test.ts): dois codigos, 140 cliques, 3 vendas,
 * R$ 62,79, conversao 2,14%. Todo valor esperado e LITERAL escrito a mao.
 *
 * O relogio e fixo em 2026-09-20 12:00 de Brasilia (15:00 UTC), o mesmo AGORA
 * do teste do servidor, porque a regra do delta e o "desde hoje" dependem do dia
 * civil corrente. Só o `Date` e falsificado: os timers de verdade continuam, e
 * o "Copiado" de 2s nao depende deles para ser afirmado.
 */

// jsdom nao implementa ResizeObserver e o ResponsiveContainer do recharts o
// chama no mount (mesmo stub do ActiveUsersChart.test.tsx).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

vi.mock("@/components/UserAvatar", () => ({
  default: () => <span data-testid="avatar" />,
}));

import type { CreatorDashboard } from "@shared/creatorDashboard";
import { CreatorDashboardView, deltaPermitido } from "./CreatorDashboardView";

const ZERO = {
  clicks: 0,
  checkouts: 0,
  sales: 0,
  revenue_cents: 0,
  commission_cents: 0,
};

function painelBase(): CreatorDashboard {
  return {
    creator: {
      kind: "afiliado",
      granted_at: "2026-09-01T12:00:00Z",
      revoked_at: null,
    },
    perfil: { name: "Ana Creator", handle: "anacreator", avatar_url: null },
    janela: "7d",
    totais: {
      clicks: 140,
      sales: 3,
      revenue_cents: 6279,
      commission_due_cents: 1884,
      commission_paid_cents: 0,
      conversao_pct: 2.14,
    },
    codigos: [
      {
        id: "a1",
        code: "ANA30",
        status: "active",
        discount_percent: 10,
        commission_percent: 30,
        link: "https://boranatech.com.br/planos?ref=ANA30",
        clicks: 100,
        sales: 3,
        revenue_cents: 6279,
        commission_due_cents: 1884,
        commission_paid_cents: 0,
        created_at: "2026-09-01T12:00:00Z",
      },
      {
        id: "b1",
        code: "ANAYT",
        status: "paused",
        discount_percent: 10,
        commission_percent: 20,
        link: "https://boranatech.com.br/planos?ref=ANAYT",
        clicks: 40,
        sales: 0,
        revenue_cents: 0,
        commission_due_cents: 0,
        commission_paid_cents: 0,
        created_at: "2026-09-02T12:00:00Z",
      },
    ],
    eventos: {
      events_since: "2026-09-10T12:00:00Z",
      serie: [
        { dia: "2026-09-14", ...ZERO },
        {
          dia: "2026-09-15",
          clicks: 5,
          checkouts: 0,
          sales: 1,
          revenue_cents: 2093,
          commission_cents: 628,
        },
        { dia: "2026-09-16", ...ZERO },
        { dia: "2026-09-17", ...ZERO, clicks: 2 },
        { dia: "2026-09-18", ...ZERO },
        { dia: "2026-09-19", ...ZERO },
        { dia: "2026-09-20", ...ZERO },
      ],
      periodo: {
        clicks: 7,
        checkouts: 0,
        sales: 1,
        revenue_cents: 2093,
        commission_cents: 628,
      },
      periodo_anterior: { ...ZERO, clicks: 4 },
      ultimo_click_at: "2026-09-18T01:30:00Z",
      ultima_venda_at: "2026-09-15T18:00:00Z",
    },
  };
}

function painelAdmin(): CreatorDashboard {
  const p = painelBase();
  p.creator.revoked_at = "2026-09-19T12:00:00Z";
  p.creator.granted_by = "admin-1";
  p.perfil.email = "ana@exemplo.com";
  p.codigos[0].notes = "contrato assinado";
  p.codigos[1].notes = null;
  return p;
}

const onJanelaChange = vi.fn();

function desenhar(
  painel: CreatorDashboard,
  visao: "creator" | "admin" = "creator",
) {
  render(
    <CreatorDashboardView
      painel={painel}
      janela="7d"
      onJanelaChange={onJanelaChange}
      visao={visao}
    />,
  );
}

function valorDoTile(testId: string): string | null {
  return screen.getByTestId(`${testId}-valor`).textContent;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-20T15:00:00Z"));
  onJanelaChange.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CreatorDashboardView: totais", () => {
  it("os seis tiles mostram os contadores do payload", () => {
    desenhar(painelBase());
    expect(valorDoTile("creator-tile-cliques")).toBe("140");
    expect(valorDoTile("creator-tile-vendas")).toBe("3");
    expect(valorDoTile("creator-tile-conversao")).toBe("2,14%");
    expect(valorDoTile("creator-tile-receita")).toBe("R$ 62,79");
    expect(valorDoTile("creator-tile-a-receber")).toBe("R$ 18,84");
    expect(valorDoTile("creator-tile-paga")).toBe("R$ 0,00");
  });

  it("conversao null mostra o texto, nunca 0%", () => {
    const p = painelBase();
    p.totais = { ...p.totais, clicks: 0, sales: 0, conversao_pct: null };
    desenhar(p);
    expect(valorDoTile("creator-tile-conversao")).toBe("sem cliques ainda");
  });

  it("cabecalho: kind rotulado e data de concessao em dia de Brasilia", () => {
    desenhar(painelBase());
    expect(screen.getByTestId("creator-kind").textContent).toBe("Afiliado");
    expect(screen.getByText("Creator desde 01/09/2026")).toBeTruthy();
    expect(screen.getByText("@anacreator")).toBeTruthy();
  });
});

describe("CreatorDashboardView: links", () => {
  it("copiar chama o clipboard com o link exato e mostra Copiado", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    desenhar(painelBase());
    const cartao = screen.getByTestId("creator-codigo-ANA30");
    fireEvent.click(within(cartao).getByRole("button", { name: "Copiar" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "https://boranatech.com.br/planos?ref=ANA30",
      ),
    );
    await within(cartao).findByRole("button", { name: "Copiado" });
  });

  it("codigo pausado ganha o selo; desconto e comissao do proprio codigo", () => {
    desenhar(painelBase());
    const pausado = screen.getByTestId("creator-codigo-ANAYT");
    expect(pausado.textContent).toContain("Pausado");
    expect(pausado.textContent).toContain("Comissão de 20%");
    const ativo = screen.getByTestId("creator-codigo-ANA30");
    expect(ativo.textContent).not.toContain("Pausado");
    expect(ativo.textContent).toContain("10% de desconto para quem usar");
    expect(ativo.textContent).toContain("Comissão de 30%");
  });
});

describe("CreatorDashboardView: serie e delta", () => {
  it("serie com eventos: grafico, data de inicio e ultimo clique relativo", () => {
    desenhar(painelBase());
    expect(screen.getByTestId("creator-grafico")).toBeTruthy();
    expect(screen.getByTestId("creator-eventos-desde").textContent).toBe(
      "Eventos desde 10/09/2026",
    );
    expect(
      screen.getByText(
        "Último clique: há 3 dias · Última venda: há 5 dias",
      ),
    ).toBeTruthy();
  });

  it("delta aparece quando os eventos ja existiam no inicio do periodo anterior", () => {
    const p = painelBase();
    p.eventos.events_since = "2026-09-01T12:00:00Z";
    desenhar(p);
    expect(screen.getByTestId("creator-delta-clicks").textContent).toBe(
      "+75,0% vs período anterior",
    );
  });

  it("sem delta quando os eventos comecaram depois do inicio do periodo anterior", () => {
    const p = painelBase();
    p.eventos.events_since = "2026-09-10T12:00:00Z";
    desenhar(p);
    expect(screen.queryByTestId("creator-delta-clicks")).toBeNull();
    expect(screen.getByTestId("creator-periodo").textContent).not.toContain(
      "0%",
    );
  });

  it("regra do delta: inicio do periodo anterior em 7d e 07/09 00h de Brasilia", () => {
    const agora = Date.parse("2026-09-20T15:00:00Z");
    const anterior = { ...ZERO, clicks: 4 };
    expect(deltaPermitido("2026-09-06T12:00:00Z", anterior, "7d", agora)).toBe(
      true,
    );
    expect(
      deltaPermitido("2026-09-07T03:00:00.000Z", anterior, "7d", agora),
    ).toBe(false);
    expect(deltaPermitido("2026-09-10T12:00:00Z", anterior, "7d", agora)).toBe(
      false,
    );
    expect(deltaPermitido("2026-01-01T12:00:00Z", anterior, "all", agora)).toBe(
      false,
    );
    expect(deltaPermitido("2026-01-01T12:00:00Z", null, "7d", agora)).toBe(
      false,
    );
  });

  it("trocar a janela chama onJanelaChange com o valor da API", () => {
    desenhar(painelBase());
    fireEvent.click(screen.getByRole("button", { name: "90 dias" }));
    expect(onJanelaChange).toHaveBeenCalledWith("90d");
  });
});

describe("CreatorDashboardView: estados sem dado", () => {
  it("sem codigo: aviso, sem tiles e sem grafico", () => {
    const p = painelBase();
    p.codigos = [];
    desenhar(p);
    expect(screen.getByTestId("creator-sem-codigo").textContent).toContain(
      "Seu código de creator ainda não foi vinculado.",
    );
    expect(screen.queryByTestId("creator-tile-cliques")).toBeNull();
    expect(screen.queryByTestId("creator-grafico")).toBeNull();
  });

  it("com codigo e sem evento: tiles normais e a mensagem no lugar do grafico", () => {
    const p = painelBase();
    p.eventos = {
      ...p.eventos,
      events_since: null,
      serie: [],
      ultimo_click_at: null,
      ultima_venda_at: null,
    };
    desenhar(p);
    expect(screen.getByTestId("creator-sem-eventos").textContent).toBe(
      "Ainda não registramos cliques no seu link.",
    );
    expect(screen.queryByTestId("creator-grafico")).toBeNull();
    expect(valorDoTile("creator-tile-cliques")).toBe("140");
  });
});

describe("CreatorDashboardView: visao admin e visao creator", () => {
  it("visao admin mostra e-mail, notas e a revogacao", () => {
    desenhar(painelAdmin(), "admin");
    expect(screen.getByTestId("creator-email").textContent).toBe(
      "ana@exemplo.com",
    );
    expect(
      screen.getByTestId("creator-codigo-notas-ANA30").textContent,
    ).toBe("contrato assinado");
    expect(screen.getByTestId("creator-revogado").textContent).toBe(
      "Revogado em 19/09/2026",
    );
  });

  it("visao creator nao mostra e-mail, notas nem revogacao, mesmo se vierem", () => {
    desenhar(painelAdmin(), "creator");
    expect(screen.queryByTestId("creator-email")).toBeNull();
    expect(screen.queryByTestId("creator-codigo-notas-ANA30")).toBeNull();
    expect(screen.queryByTestId("creator-revogado")).toBeNull();
  });
});
