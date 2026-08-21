import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WindowBadge } from "./WindowBadge";

/**
 * O badge existe para tornar VISÍVEL a unificação de janela da Fase 2. O que ele
 * não pode fazer é formatar data por conta própria: o texto vem pronto do
 * servidor, e é isso que garante que os oito blocos da Visão digam o mesmo
 * intervalo com as mesmas palavras.
 */

afterEach(cleanup);

describe("WindowBadge", () => {
  it("mostra o intervalo e o fuso que o servidor mandou", () => {
    render(<WindowBadge label="16 jul - 14 ago" tz="Brasília" />);
    const badge = screen.getByTestId("window-badge");
    expect(badge.textContent).toContain("16 jul - 14 ago");
    expect(badge.textContent).toContain("Brasília");
  });

  it("sem rótulo, NÃO renderiza nada", () => {
    // Ausência é ausência. Um badge vazio pareceria defeito de layout, e um com
    // data inventada seria pior.
    const { container } = render(<WindowBadge label={null} tz="Brasília" />);
    expect(container.innerHTML).toBe("");
    expect(screen.queryByTestId("window-badge")).toBeNull();
  });

  it("marca o dia parcial quando pedido", () => {
    render(<WindowBadge label="14 ago" tz="Brasília" partial />);
    expect(screen.getByTestId("window-badge-parcial")).toBeTruthy();
  });

  it("CONTROLE NEGATIVO: sem `partial`, não inventa a marca", () => {
    // Marcar tudo como parcial esvaziaria o sinal, que existe justamente para o
    // último dia não ser lido como queda.
    render(<WindowBadge label="16 jul - 13 ago" tz="Brasília" />);
    expect(screen.queryByTestId("window-badge-parcial")).toBeNull();
  });

  it("sem fuso, mostra só o intervalo (não escreve 'Brasília' por conta própria)", () => {
    // O componente não sabe onde é Brasília, e é assim que se garante que ele
    // nunca discorde do servidor.
    render(<WindowBadge label="16 jul - 14 ago" />);
    expect(screen.getByTestId("window-badge").textContent).toBe(
      "16 jul - 14 ago",
    );
  });
});
