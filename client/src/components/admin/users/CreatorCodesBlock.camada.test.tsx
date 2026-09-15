import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

/**
 * CAMADA do popup do select "Codigo sem dono".
 *
 * O bloco vive dentro do modal do usuario (z-[2000]). Em producao o popup abria
 * na camada de pagina (z-[1100]), ATRAS do modal, e o teste do modal nao pegou
 * porque la o BntSelect e mockado como select nativo. Aqui o BntSelect e o
 * REAL: o popup abre pelo teclado (o Radix abre com ArrowDown no trigger) e a
 * classe e lida no elemento de conteudo que ele monta no portal.
 *
 * O caso de controle abre o BntSelect sem a prop e ve a camada de pagina: e o
 * que prova que o mecanismo distingue as duas, e que sem a correcao o primeiro
 * caso ficaria vermelho.
 */

const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/adminApi", () => {
  class AdminApiError extends Error {
    readonly status: number;
    readonly code: string | null;
    constructor(message: string, status: number, code: string | null) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }
  return {
    adminFetch: (...args: unknown[]) => fetchMock(...args),
    AdminApiError,
  };
});

import { LAYER_IN_DIALOG, LAYER_ON_PAGE } from "@/components/admin/tasks/taskLayers";
import { BntSelect } from "@/components/shared/BntSelect";
import { CreatorCodesBlock } from "./CreatorCodesBlock";

// O jsdom nao tem estas APIs, e o Radix as chama ao montar o popup.
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

function abrirPeloTeclado(nome: string): void {
  fireEvent.keyDown(screen.getByRole("combobox", { name: nome }), {
    key: "ArrowDown",
  });
}

describe("camada do popup de codigo sem dono", () => {
  it("abre na camada de dentro de modal, nao na de pagina", async () => {
    fetchMock.mockResolvedValue({
      data: [
        {
          id: "a3",
          name: "Zeca Sem Dono",
          code: "ZECA5",
          discount_percent: 10,
          commission_percent: 20,
          status: "active",
          clicks: 0,
          sales: 0,
          revenue_cents: 0,
          user_id: null,
        },
      ],
    });
    render(
      <CreatorCodesBlock userId="u1" nomeDoUsuario="Rafa Lima" temConcessao />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Vincular código existente" }),
    );
    abrirPeloTeclado("Código sem dono");

    const popup = await screen.findByRole("listbox");
    expect(popup.className).toContain(LAYER_IN_DIALOG);
    expect(popup.className).not.toContain(LAYER_ON_PAGE);
    expect(
      screen.getByRole("option", { name: "Zeca Sem Dono (ZECA5)" }),
    ).toBeTruthy();
  });

  it("CONTROLE: sem a prop, o BntSelect abre na camada de pagina", async () => {
    render(
      <BntSelect
        label="Controle"
        value=""
        onValueChange={() => {}}
        options={[{ value: "x", label: "Opcao X" }]}
      />,
    );

    abrirPeloTeclado("Controle");

    const popup = await screen.findByRole("listbox");
    expect(popup.className).toContain(LAYER_ON_PAGE);
    expect(popup.className).not.toContain(LAYER_IN_DIALOG);
  });
});
