import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AttentionPanel, type PainelDeAtencao } from "./AttentionPanel";

/**
 * O que este painel não pode fazer é dizer "tudo em ordem" quando não sabe.
 * Painel vazio por sucesso e painel vazio por sonda quebrada são estados
 * opostos, e são a mesma tela se ninguém separar os dois.
 */

afterEach(cleanup);

function painel(over: Partial<PainelDeAtencao> = {}): PainelDeAtencao {
  return { itens: [], fontesIndisponiveis: [], janelaDias: 7, ...over };
}

const itemCritico = {
  tipo: "assinatura_past_due",
  chave: "past_due:1",
  severidade: "critico" as const,
  titulo: "Pagamento em atraso",
  detalhe: "A cobrança falhou.",
  valorCents: 2990,
  url: "https://dashboard.stripe.com/subscriptions/sub_1",
};

describe("AttentionPanel", () => {
  it("lista os itens com valor e link", () => {
    render(<AttentionPanel data={painel({ itens: [itemCritico] })} />);

    expect(screen.getAllByTestId("atencao-item")).toHaveLength(1);
    expect(screen.getByText("Pagamento em atraso")).toBeTruthy();
    expect(screen.getByText("R$ 29,90")).toBeTruthy();
    expect(screen.getByRole("link", { name: /abrir/i })).toBeTruthy();
  });

  it("sem itens e com todas as fontes OK, diz 'Tudo em ordem'", () => {
    render(<AttentionPanel data={painel()} />);
    expect(screen.getByTestId("atencao-vazio")).toBeTruthy();
  });

  it("CONTROLE NEGATIVO: sem itens MAS com fonte fora do ar, NÃO diz 'tudo em ordem'", () => {
    // É a asserção central do arquivo. Um painel que colapsa os dois casos
    // afirma saúde sobre uma medição que não aconteceu.
    render(
      <AttentionPanel
        data={painel({ fontesIndisponiveis: ["cobrancas_falhadas"] })}
      />,
    );

    expect(screen.queryByTestId("atencao-vazio")).toBeNull();
    const aviso = screen.getByTestId("atencao-fontes-indisponiveis");
    expect(aviso.textContent).toContain("cobranças falhadas");
  });

  it("fonte desconhecida pelo bundle não derruba a página (fallback neutro)", () => {
    // Convenção do projeto para lookup indexado por valor do servidor: um id
    // novo aparece cru, e não como `undefined` num acesso direto.
    render(
      <AttentionPanel data={painel({ fontesIndisponiveis: ["fonte_nova"] })} />,
    );
    expect(
      screen.getByTestId("atencao-fontes-indisponiveis").textContent,
    ).toContain("fonte_nova");
  });

  it("loading e erro são estados próprios, não vazio", () => {
    const { unmount } = render(<AttentionPanel data={null} loading />);
    expect(screen.getByTestId("atencao-loading")).toBeTruthy();
    expect(screen.queryByTestId("atencao-vazio")).toBeNull();
    unmount();

    render(<AttentionPanel data={null} error="Falha ao carregar." />);
    expect(screen.getByTestId("atencao-erro")).toBeTruthy();
    expect(screen.queryByTestId("atencao-vazio")).toBeNull();
  });

  it("crítico e atenção têm marcação distinta", () => {
    render(
      <AttentionPanel
        data={painel({
          itens: [
            itemCritico,
            {
              ...itemCritico,
              chave: "saida:2",
              severidade: "atencao",
              titulo: "Saída agendada",
            },
          ],
        })}
      />,
    );

    const itens = screen.getAllByTestId("atencao-item");
    expect(itens.map((i) => i.getAttribute("data-severidade"))).toEqual([
      "critico",
      "atencao",
    ]);
  });

  it("item sem url não renderiza link morto", () => {
    // O spike de custo de IA não tem para onde levar; um "Abrir" que não abre
    // nada é pior que a ausência do botão.
    render(
      <AttentionPanel
        data={painel({
          itens: [{ ...itemCritico, url: "", valorCents: undefined }],
        })}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText("R$ 0,00")).toBeNull();
  });
});
