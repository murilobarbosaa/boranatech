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
