import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  agruparItens,
  AttentionPanel,
  linkDaStripe,
  type PainelDeAtencao,
} from "./AttentionPanel";

/**
 * O que este painel não pode fazer é dizer "tudo em ordem" quando não sabe, nem
 * empilhar vinte cards idênticos até deformar a linha do grid (v1, corrigido na
 * rodada 7).
 */

afterEach(cleanup);

function painel(over: Partial<PainelDeAtencao> = {}): PainelDeAtencao {
  return { itens: [], fontesIndisponiveis: [], janelaDias: 7, ...over };
}

const past = {
  tipo: "assinatura_past_due",
  chave: "past_due:1",
  severidade: "critico" as const,
  titulo: "Pagamento em atraso",
  detalhe: "A cobrança falhou.",
  valorCents: 2990,
  url: "https://dashboard.stripe.com/subscriptions/sub_1",
};

function saida(i: number) {
  return {
    tipo: "saida_agendada",
    chave: `saida:${i}`,
    severidade: "atencao" as const,
    titulo: "Saída agendada",
    detalhe: "Acesso termina em 14/09/2026.",
    valorCents: 2990,
    url: `https://dashboard.stripe.com/subscriptions/sub_${i}`,
  };
}

describe("linkDaStripe", () => {
  it("aceita só https do dashboard da Stripe", () => {
    expect(
      linkDaStripe("https://dashboard.stripe.com/subscriptions/sub_1"),
    ).toBe("https://dashboard.stripe.com/subscriptions/sub_1");
  });

  it("CONTROLE NEGATIVO: vazio, relativo, outro host e http NÃO viram link", () => {
    // "Abrir" que não abre é pior que a ausência do botão: promete uma ação.
    expect(linkDaStripe("")).toBeNull();
    expect(linkDaStripe("/payments")).toBeNull();
    expect(linkDaStripe("https://exemplo.com/x")).toBeNull();
    expect(linkDaStripe("http://dashboard.stripe.com/x")).toBeNull();
    expect(linkDaStripe(undefined)).toBeNull();
    expect(linkDaStripe(42)).toBeNull();
  });
});

describe("agruparItens", () => {
  it("agrupa por tipo, soma o valor e herda a PIOR severidade", () => {
    const g = agruparItens([
      saida(1),
      saida(2),
      { ...saida(3), severidade: "critico" },
    ]);
    expect(g).toHaveLength(1);
    expect(g[0].itens).toHaveLength(3);
    expect(g[0].totalCents).toBe(2990 * 3);
    // Um crítico entre avisos não pode ficar escondido atrás da média.
    expect(g[0].severidade).toBe("critico");
  });

  it("crítico vem antes de atenção", () => {
    const g = agruparItens([saida(1), past]);
    expect(g.map((x) => x.tipo)).toEqual([
      "assinatura_past_due",
      "saida_agendada",
    ]);
  });

  it("item malformado é ignorado sem derrubar o agrupamento", () => {
    const g = agruparItens([past, null as never, {} as never]);
    expect(g).toHaveLength(1);
  });
});

describe("AttentionPanel v2", () => {
  it("vinte saídas viram UM card com contagem e soma, não vinte cards", () => {
    // O defeito da v1, visto na revisão visual: a coluna não terminava.
    const itens = Array.from({ length: 20 }, (_, i) => saida(i));
    render(<AttentionPanel data={painel({ itens })} />);

    const grupos = screen.getAllByTestId("atencao-grupo");
    expect(grupos).toHaveLength(1);
    expect(grupos[0].textContent).toContain("20");
    // O `Intl` usa espaço NÃO separável depois do "R$" (U+00A0); comparar com
    // espaço comum falharia por um caractere invisível.
    expect(grupos[0].textContent?.replace(/\u00a0/g, " ")).toContain(
      "R$ 598,00",
    );
    // Severidade baixa nasce RECOLHIDA: a lista de 20 não aparece de cara.
    expect(grupos[0].getAttribute("data-aberto")).toBe("nao");
    expect(screen.queryByTestId("atencao-grupo-lista")).toBeNull();
  });

  it("expandir mostra a lista, com teto de altura e scroll", () => {
    const itens = Array.from({ length: 20 }, (_, i) => saida(i));
    render(<AttentionPanel data={painel({ itens })} />);

    fireEvent.click(screen.getByTestId("atencao-grupo-toggle"));

    const lista = screen.getByTestId("atencao-grupo-lista");
    expect(screen.getAllByTestId("atencao-item")).toHaveLength(20);
    expect(lista.className).toContain("max-h-64");
    expect(lista.className).toContain("overflow-y-auto");
  });

  it("grupo CRÍTICO nasce aberto", () => {
    render(<AttentionPanel data={painel({ itens: [past, saida(9)] })} />);
    const critico = screen
      .getAllByTestId("atencao-grupo")
      .find((g) => g.getAttribute("data-severidade") === "critico")!;
    expect(critico.getAttribute("data-aberto")).toBe("sim");
  });

  it("o painel tem TETO de altura, para não esticar a linha do grid", () => {
    // Foi a ausência disto que deformou o vizinho em produção.
    render(<AttentionPanel data={painel({ itens: [past] })} />);
    const corpo = screen.getByTestId("atencao-corpo");
    expect(corpo.className).toContain("max-h-");
    expect(corpo.className).toContain("overflow-y-auto");
  });

  it("ABRIR aponta para a Stripe, em aba nova e com rel seguro", () => {
    render(<AttentionPanel data={painel({ itens: [past] })} />);
    const link = screen.getByRole("link", { name: /abrir na stripe/i });
    expect(link.getAttribute("href")).toBe(
      "https://dashboard.stripe.com/subscriptions/sub_1",
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("CONTROLE NEGATIVO: item sem url mapeável NÃO ganha botão", () => {
    render(<AttentionPanel data={painel({ itens: [{ ...past, url: "" }] })} />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("grupo de UM item mostra o detalhe direto, sem 'ver N itens'", () => {
    render(<AttentionPanel data={painel({ itens: [past] })} />);
    expect(screen.queryByTestId("atencao-grupo-toggle")).toBeNull();
    expect(screen.getByText(/A cobrança falhou/)).toBeTruthy();
  });

  it("sem itens e com todas as fontes OK, diz 'Tudo em ordem'", () => {
    render(<AttentionPanel data={painel()} />);
    expect(screen.getByTestId("atencao-vazio")).toBeTruthy();
  });

  it("CONTROLE NEGATIVO: sem itens MAS com fonte fora do ar, NÃO diz 'tudo em ordem'", () => {
    render(
      <AttentionPanel
        data={painel({ fontesIndisponiveis: ["cobrancas_falhadas"] })}
      />,
    );
    expect(screen.queryByTestId("atencao-vazio")).toBeNull();
    expect(
      screen.getByTestId("atencao-fontes-indisponiveis").textContent,
    ).toContain("cobranças falhadas");
  });

  it("fonte desconhecida aparece crua, sem derrubar a página", () => {
    render(
      <AttentionPanel data={painel({ fontesIndisponiveis: ["fonte_nova"] })} />,
    );
    expect(
      screen.getByTestId("atencao-fontes-indisponiveis").textContent,
    ).toContain("fonte_nova");
  });

  it("payload degradado ({}) não vira TypeError", () => {
    render(<AttentionPanel data={{} as never} />);
    expect(screen.getByTestId("atencao-corpo")).toBeTruthy();
  });

  it("loading e erro são estados próprios, não vazio", () => {
    const a = render(<AttentionPanel data={null} loading />);
    expect(screen.getByTestId("atencao-loading")).toBeTruthy();
    a.unmount();
    render(<AttentionPanel data={null} error="Falha ao carregar." />);
    expect(screen.getByTestId("atencao-erro")).toBeTruthy();
  });

  it("tipo NOVO do servidor não derruba nada (fallback de rótulo)", () => {
    render(
      <AttentionPanel
        data={painel({
          itens: [{ ...past, tipo: "tipo_que_o_bundle_nao_conhece" }],
        })}
      />,
    );
    expect(screen.getAllByTestId("atencao-grupo")).toHaveLength(1);
  });
});
