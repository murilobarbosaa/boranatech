import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { BntSelect } from "./BntSelect";

/**
 * `renderOption` (lote 10c): uma opcao pode levar um ReactNode (o marcador de
 * cor antes do rotulo). Sem a prop, o item continua sendo o `label`, e e isso
 * que garante que nenhuma das chamadas existentes mudou.
 */
beforeAll(() => {
  if (!("ResizeObserver" in globalThis)) {
    class ResizeObserverDeTeste {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver =
      ResizeObserverDeTeste;
  }
  Element.prototype.scrollIntoView ||= () => {};
  Element.prototype.hasPointerCapture ||= () => false;
  Element.prototype.releasePointerCapture ||= () => {};
});

afterEach(() => {
  cleanup();
});

const OPCOES = [
  { value: "a", label: "Primeira" },
  { value: "b", label: "Segunda" },
];

describe("BntSelect: renderOption", () => {
  it("sem renderOption, o item e o label", async () => {
    render(
      <BntSelect
        label="Escolha"
        value="a"
        onValueChange={vi.fn()}
        options={OPCOES}
      />,
    );
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Escolha" }), {
      key: "ArrowDown",
    });
    const opcoes = await screen.findAllByRole("option");
    expect(opcoes.map((o) => o.textContent)).toEqual(["Primeira", "Segunda"]);
    expect(opcoes[0].querySelector("[data-marcador]")).toBeNull();
  });

  it("com renderOption, o item e o que ela devolve, e a escolha continua devolvendo o value", async () => {
    const onValueChange = vi.fn();
    render(
      <BntSelect
        label="Escolha"
        value="a"
        onValueChange={onValueChange}
        options={OPCOES}
        renderOption={(opt) => (
          <span>
            <i data-marcador={opt.value} />
            {opt.label}
          </span>
        )}
      />,
    );
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Escolha" }), {
      key: "ArrowDown",
    });
    const opcoes = await screen.findAllByRole("option");
    expect(opcoes[1].querySelector("[data-marcador='b']")).not.toBeNull();
    expect(opcoes[1].textContent).toBe("Segunda");
    fireEvent.keyDown(opcoes[1], { key: "Enter" });
    expect(onValueChange).toHaveBeenCalledWith("b");
  });
});
