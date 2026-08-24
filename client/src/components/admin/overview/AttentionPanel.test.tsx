import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  agruparItens,
  AttentionPanel,
  destinoInternoValido,
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

  it("D21: soma o MENSAL em separado do NOMINAL, sem misturar os dois", () => {
    // Ciclos diferentes: anual (22200 nominal, 1850/mês) e mensal (2990 nos
    // dois). Somar nominais daria R$ 251,90 de coisa nenhuma.
    const g = agruparItens([
      { ...saida(1), valorCents: 22200, mrrMensalCents: 1850 },
      { ...saida(2), valorCents: 2990, mrrMensalCents: 2990 },
    ]);
    expect(g[0].totalCents).toBe(25190);
    expect(g[0].totalMrrMensalCents).toBe(4840);
    expect(g[0].semMensal).toBe(0);
  });

  it("item SEM mensal não vira zero na soma: é contado como parcial", () => {
    // Baixar o total em silêncio é a falha que este projeto já documentou várias
    // vezes: o número fica plausível e menor, e ninguém estranha um valor menor.
    const g = agruparItens([
      { ...saida(1), valorCents: 22200, mrrMensalCents: 1850 },
      { ...saida(2), valorCents: 2990 },
    ]);
    expect(g[0].totalMrrMensalCents).toBe(1850);
    expect(g[0].semMensal).toBe(1);
  });

  it("JANELA DE DEPLOY: nenhum item com mensal deixa o total mensal NULO, não 0", () => {
    // Null é "o servidor não mandou"; zero seria "não há receita em risco", que
    // é falso e indistinguível de um estado bom.
    const g = agruparItens([saida(1), saida(2)]);
    expect(g[0].totalMrrMensalCents).toBeNull();
    expect(g[0].totalCents).toBe(5980);
  });

  it("o agregado (contagem e janela) sobe do item para o grupo", () => {
    const g = agruparItens([
      {
        tipo: "cobrancas_falhadas",
        chave: "falhadas:7d",
        severidade: "critico" as const,
        titulo: "24 cobrancas falharam em 7 dias",
        detalhe: "Somam R$ 700,00 que não entraram.",
        valorCents: 70000,
        agregado: { quantidade: 24, janelaDias: 7 },
        url: "https://dashboard.stripe.com/payments",
      },
    ]);
    expect(g[0].agregado).toEqual({ quantidade: 24, janelaDias: 7 });
  });
});

describe("AttentionPanel v3", () => {
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

  it("expandir mostra os 20 itens, e a lista NAO tem scroll proprio", () => {
    // INVERTIDO na v3, e o motivo é que a premissa da v2 expirou. O teto
    // existia para o painel não esticar a linha do grid e deformar o VIZINHO;
    // esse vizinho saiu na rodada 7 (D17) e o painel hoje está sozinho numa
    // coluna. Sem vizinho, o teto só escondia item de alerta atrás de uma barra
    // de rolagem, que é o oposto do propósito deste painel.
    const itens = Array.from({ length: 20 }, (_, i) => saida(i));
    render(<AttentionPanel data={painel({ itens })} />);

    fireEvent.click(screen.getByTestId("atencao-grupo-toggle"));

    const lista = screen.getByTestId("atencao-grupo-lista");
    expect(screen.getAllByTestId("atencao-item")).toHaveLength(20);
    expect(lista.className).not.toContain("max-h-");
    expect(lista.className).not.toContain("overflow-y-auto");
  });

  it("grupo CRÍTICO nasce aberto", () => {
    render(<AttentionPanel data={painel({ itens: [past, saida(9)] })} />);
    const critico = screen
      .getAllByTestId("atencao-grupo")
      .find((g) => g.getAttribute("data-severidade") === "critico")!;
    expect(critico.getAttribute("data-aberto")).toBe("sim");
  });

  it("o painel CRESCE na pagina: nenhum scroll interno no corpo", () => {
    // Mesma inversão do teste acima, e pelo mesmo motivo. Painel de alerta com
    // overflow interno esconde exatamente o item que ele existe para mostrar.
    render(<AttentionPanel data={painel({ itens: [past] })} />);
    const corpo = screen.getByTestId("atencao-corpo");
    expect(corpo.className).not.toContain("max-h-");
    expect(corpo.className).not.toContain("overflow-y-auto");
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

  it("D21: o grupo mostra o MENSAL como principal e o nominal como secundário", () => {
    const itens = [
      { ...saida(1), valorCents: 22200, mrrMensalCents: 1850 },
      { ...saida(2), valorCents: 2990, mrrMensalCents: 2990 },
    ];
    render(<AttentionPanel data={painel({ itens })} />);

    const semNbsp = (t: string | null | undefined) =>
      (t ?? "").replace(/ /g, " ");

    // 1850 + 2990 = 4840, e é ESTE o número que o card "Receita em risco" soma.
    expect(
      semNbsp(screen.getByTestId("atencao-grupo-mensal").textContent),
    ).toBe("R$ 48,40/mês");
    // O nominal não sumiu: desceu de posição.
    expect(
      semNbsp(screen.getByTestId("atencao-grupo-nominal").textContent),
    ).toBe("R$ 251,90 em contratos");
  });

  it("mensal PARCIAL é declarado, não arredondado em silêncio", () => {
    const itens = [
      { ...saida(1), valorCents: 22200, mrrMensalCents: 1850 },
      { ...saida(2), valorCents: 2990 },
    ];
    render(<AttentionPanel data={painel({ itens })} />);
    expect(screen.getByTestId("atencao-grupo-mensal").textContent).toContain(
      "parcial",
    );
  });

  it("JANELA DE DEPLOY: sem mensal nenhum, o nominal volta a ser o principal", () => {
    render(<AttentionPanel data={painel({ itens: [saida(1), saida(2)] })} />);
    expect(screen.queryByTestId("atencao-grupo-mensal")).toBeNull();
    expect(
      screen
        .getByTestId("atencao-grupo-nominal")
        .textContent?.replace(/ /g, " "),
    ).toBe("R$ 59,80");
  });

  it("cobranças falhadas voltam a exibir CONTAGEM e JANELA no resumo", () => {
    // O agrupamento troca o título do servidor pelo rótulo do grupo, e nessa
    // troca os dois números sumiram da tela (revisão de 2026-08-16).
    render(
      <AttentionPanel
        data={painel({
          itens: [
            {
              tipo: "cobrancas_falhadas",
              chave: "falhadas:7d",
              severidade: "critico" as const,
              titulo: "24 cobrancas falharam em 7 dias",
              detalhe: "Somam R$ 700,00 que não entraram.",
              valorCents: 70000,
              agregado: { quantidade: 24, janelaDias: 7 },
              url: "https://dashboard.stripe.com/payments",
            },
          ],
        })}
      />,
    );
    const resumo = screen.getByTestId("atencao-grupo-agregado").textContent;
    expect(resumo).toContain("24 cobranças");
    expect(resumo).toContain("7 dias");
  });

  it("CONTROLE NEGATIVO: item sem agregado não inventa contagem nem janela", () => {
    render(<AttentionPanel data={painel({ itens: [saida(1)] })} />);
    expect(screen.queryByTestId("atencao-grupo-agregado")).toBeNull();
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

describe("destinoInternoValido", () => {
  it("aceita só caminho relativo dentro de /admin", () => {
    expect(destinoInternoValido("/admin?section=usuarios")).toBe(
      "/admin?section=usuarios",
    );
    expect(destinoInternoValido("/admin?section=financeiro")).toBe(
      "/admin?section=financeiro",
    );
  });

  it("CONTROLE NEGATIVO: absoluto, protocol-relative, fora de /admin e vazio caem", () => {
    // Um `https://` vindo do servidor viraria link de SAÍDA disfarçado de
    // navegação interna, e `//host` é a mesma coisa sem o esquema escrito.
    expect(destinoInternoValido("https://exemplo.com/admin")).toBeNull();
    expect(destinoInternoValido("//exemplo.com")).toBeNull();
    expect(destinoInternoValido("/perfil")).toBeNull();
    expect(destinoInternoValido("")).toBeNull();
    expect(destinoInternoValido(undefined)).toBeNull();
  });
});

describe("v3: destinos internos, motivo e fontes novas", () => {
  const comDestino = {
    ...past,
    destinoInterno: "/admin?section=usuarios",
  };

  it("destino interno vira a ação PRIMÁRIA, e a Stripe continua ao lado", () => {
    render(<AttentionPanel data={painel({ itens: [comDestino] })} />);

    const interno = screen.getByTestId("atencao-destino-interno");
    expect(interno.getAttribute("href")).toBe("/admin?section=usuarios");
    // A Stripe não sumiu: virou secundária.
    expect(screen.getByText(/Abrir na Stripe/)).toBeTruthy();
  });

  it("JANELA DE DEPLOY: item SEM destinoInterno não ganha botão interno", () => {
    // O backend antigo não manda o campo. Ausência degrada para "sem botão",
    // nunca para link quebrado.
    render(<AttentionPanel data={painel({ itens: [past] })} />);

    expect(screen.queryByTestId("atencao-destino-interno")).toBeNull();
    expect(screen.getByText(/Abrir na Stripe/)).toBeTruthy();
  });

  it("item sem url NENHUMA e só com destino interno mostra só o interno", () => {
    const semDespesa = {
      tipo: "mes_sem_despesa",
      chave: "sem_despesa:07/2026",
      severidade: "atencao" as const,
      titulo: "Nenhuma despesa registrada em 07/2026",
      detalhe: "O mês fechou sem nenhuma despesa lançada.",
      url: "",
      destinoInterno: "/admin?section=financeiro",
    };
    render(<AttentionPanel data={painel({ itens: [semDespesa] })} />);

    expect(screen.getByTestId("atencao-destino-interno")).toBeTruthy();
    expect(screen.queryByText(/Abrir na Stripe/)).toBeNull();
  });

  it("motivo declarado aparece traduzido, pelo resolver que já existe", () => {
    const comMotivo = { ...saida(1), motivoCodigo: "expensive" };
    render(<AttentionPanel data={painel({ itens: [comMotivo] })} />);

    expect(screen.getByTestId("atencao-item-motivo").textContent).toContain(
      "Está caro",
    );
  });

  it("motivo DESCONHECIDO aparece cru, sem derrubar nada", () => {
    // Mesmo contrato do resolver: código novo do servidor não pode quebrar a
    // aba, e sumir com a linha esconderia informação real.
    const comMotivo = { ...saida(1), motivoCodigo: "motivo_que_nao_existe" };
    render(<AttentionPanel data={painel({ itens: [comMotivo] })} />);

    expect(screen.getByTestId("atencao-item-motivo").textContent).toContain(
      "motivo_que_nao_existe",
    );
  });

  it("CONTROLE NEGATIVO: item sem motivo não renderiza a linha", () => {
    render(<AttentionPanel data={painel({ itens: [saida(1)] })} />);
    expect(screen.queryByTestId("atencao-item-motivo")).toBeNull();
  });

  it("os grupos dos tipos NOVOS têm rótulo próprio, não o slug cru", () => {
    const novos = [
      {
        tipo: "payout_falho",
        chave: "payout:po_1",
        severidade: "critico" as const,
        titulo: "Repasse para o banco falhou",
        detalhe: "A Stripe não conseguiu transferir.",
        valorCents: 500000,
        url: "https://dashboard.stripe.com/payouts",
        destinoInterno: "/admin?section=financeiro",
      },
      {
        tipo: "influencer_com_assinatura",
        chave: "influencer_pagante:u1",
        severidade: "atencao" as const,
        titulo: "Influencer que virou assinante",
        detalhe: "rafa@exemplo.com tem concessão ativa E assinatura.",
        url: "",
        destinoInterno: "/admin?section=usuarios",
      },
    ];
    render(<AttentionPanel data={painel({ itens: novos })} />);

    expect(screen.getByText("Repasses que falharam")).toBeTruthy();
    expect(screen.getByText("Influencers que viraram assinantes")).toBeTruthy();
  });

  it("fontes novas fora do ar aparecem NOMEADAS, nunca omitidas", () => {
    render(
      <AttentionPanel
        data={painel({
          fontesIndisponiveis: ["payouts", "despesas", "influencers"],
        })}
      />,
    );

    const aviso = screen.getByTestId(
      "atencao-fontes-indisponiveis",
    ).textContent;
    expect(aviso).toContain("repasses bancários");
    expect(aviso).toContain("despesas");
    expect(aviso).toContain("influencers");
    // E não diz "tudo em ordem" sobre uma sonda que não respondeu.
    expect(screen.queryByTestId("atencao-vazio")).toBeNull();
  });
});
