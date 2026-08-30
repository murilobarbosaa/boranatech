import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OverviewPeriod, parseOverviewWindow } from "./OverviewPeriod";

/**
 * O seletor que governa os seis cards.
 *
 * Duas travas de produto: 90 dias NÃO é oferecida (a série tem 16 dias, e
 * oferecer uma janela que não existe é preencher com mentira) e "Tudo" declara a
 * data de início real, para não parecer "desde sempre".
 */

afterEach(cleanup);

describe("parseOverviewWindow", () => {
  it("aceita as três e recusa o resto", () => {
    expect(parseOverviewWindow("7")).toBe("7");
    expect(parseOverviewWindow("all")).toBe("all");
    // 90 não é oferecida; ausência e lixo caem no padrão.
    expect(parseOverviewWindow("90")).toBe("30");
    expect(parseOverviewWindow(null)).toBe("30");
    expect(parseOverviewWindow("")).toBe("30");
  });
});

describe("OverviewPeriod", () => {
  it("mostra exatamente três opções, e nenhuma delas é 90 dias", () => {
    render(<OverviewPeriod window="30" onChange={() => {}} />);
    const grupo = screen.getByTestId("overview-periodo");
    const botoes = grupo.querySelectorAll("button");
    expect(botoes).toHaveLength(3);
    expect(grupo.textContent).not.toContain("90");
  });

  it("marca a janela ativa de forma acessível", () => {
    render(<OverviewPeriod window="7" onChange={() => {}} />);
    expect(
      screen
        .getByRole("button", { name: "7 dias" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: "30 dias" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("clicar avisa quem governa a janela", () => {
    const onChange = vi.fn();
    render(<OverviewPeriod window="30" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "7 dias" }));
    expect(onChange).toHaveBeenCalledWith("7");
  });

  it("'Tudo' declara a data de início real", () => {
    render(
      <OverviewPeriod
        window="all"
        onChange={() => {}}
        seriesStart="2026-05-04T19:04:20Z"
      />,
    );
    expect(screen.getByTestId("overview-periodo-inicio").textContent).toContain(
      "04/05/2026",
    );
  });

  it("DIA CIVIL: '2026-05-06' rende 06/05/2026, nunca 05/05/2026", () => {
    // O defeito que isto trava: a serie de ativos calcula o inicio como dia
    // civil de Brasilia dentro da HogQL, e a tela dizia um dia A MENOS porque o
    // valor passava pelo renderizador de INSTANTES. `new Date("2026-05-06")` e
    // meia-noite UTC, que em Brasilia e 21h de 05/05.
    //
    // POR QUE ELE DISCRIMINA. `formatarDiaCivil` recorta `AAAA-MM-DD` sem passar
    // por `Date`, entao a SAIDA CERTA nao depende do relogio de ninguem. O que
    // depende de fuso e a saida ERRADA: em UTC, `new Date("2026-05-06")` tambem
    // da 06/05, e os dois renderizadores ficam indistinguiveis. Nenhum valor de
    // entrada separa os dois la, entao nao adianta escolher outra data.
    //
    // Quem faz este teste morder e o `env: { TZ: "America/Sao_Paulo" }` do
    // vitest.config.ts, fixado justamente para que defeito de dia deslocado nao
    // some no CI (que roda em UTC). Se alguem remover aquele pino, este teste
    // passa a aprovar o bug em silencio, e e por isso que a dependencia esta
    // escrita aqui em vez de subentendida.
    render(
      <OverviewPeriod
        window="all"
        onChange={() => {}}
        seriesStart="2026-05-06"
        seriesStartKind="diaCivil"
      />,
    );
    const texto = screen.getByTestId("overview-periodo-inicio").textContent;
    expect(texto).toContain("06/05/2026");
    expect(texto).not.toContain("05/05/2026");
  });

  it("INSTANTE: o default continua sendo o dia LOCAL do timestamptz", () => {
    // CONTROLE do controle, e a razao de o tipo ser declarado em vez de
    // adivinhado. A Visao passa `profiles.created_at`, um instante de verdade, e
    // para instante o dia local e o certo. Se alguem "simplificar" trocando os
    // dois formatadores por um so, um dos dois chamadores passa a mentir, e este
    // par de testes diz qual.
    //
    // 01:30Z de 05/05 e 22:30 de 04/05 em Brasilia: e o instante que separa os
    // dois renderizadores. O fixture antigo (19:04:20Z) cai no mesmo dia nos
    // dois fusos e por isso NAO distinguia nada.
    render(
      <OverviewPeriod
        window="all"
        onChange={() => {}}
        seriesStart="2026-05-05T01:30:00Z"
      />,
    );
    const texto = screen.getByTestId("overview-periodo-inicio").textContent;
    expect(texto).toContain("04/05/2026");
    expect(texto).not.toContain("05/05/2026");
  });

  it("sem data de início, 'Tudo' não inventa uma", () => {
    render(
      <OverviewPeriod window="all" onChange={() => {}} seriesStart={null} />,
    );
    expect(screen.queryByTestId("overview-periodo-inicio")).toBeNull();
  });

  it("nas outras janelas não aparece o 'desde'", () => {
    render(
      <OverviewPeriod
        window="30"
        onChange={() => {}}
        seriesStart="2026-05-04T19:04:20Z"
      />,
    );
    expect(screen.queryByTestId("overview-periodo-inicio")).toBeNull();
  });

  it("no mobile é grade de 3, não dropdown", () => {
    // Três opções curtas atrás de dois toques esconderiam a decisão que governa
    // a página inteira.
    render(<OverviewPeriod window="30" onChange={() => {}} />);
    const grupo = screen.getByTestId("overview-periodo");
    expect(grupo.className).toContain("grid-cols-3");
    expect(grupo.querySelector("select")).toBeNull();
  });
});
