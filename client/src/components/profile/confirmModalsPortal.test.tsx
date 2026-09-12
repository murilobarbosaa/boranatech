import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeleteAccountConfirmModal } from "./DeleteAccountConfirmModal";
import { SignOutConfirmModal } from "./SignOutConfirmModal";

/**
 * MODAIS DE CONFIRMACAO DO PERFIL RENDERIZAM EM PORTAL.
 *
 * O wrapper do Perfil e `relative isolate`, e cria um contexto de empilhamento
 * proprio. Enquanto estas modais eram `fixed inset-0 z-50` inline, o `z-50`
 * delas valia so dentro desse wrapper: ao rolar com a modal aberta, o footer
 * (`z-10` no contexto raiz) e o header (`z-[1000]`) eram pintados por cima dela.
 * No portal para o `document.body`, o `z-50` volta a valer no contexto raiz.
 *
 * A assercao de portal e a que falha na versao inline: a modal ficava DENTRO da
 * arvore do componente pai. Os outros casos travam a semantica de fechamento,
 * que mudou de mecanismo (listener manual para o Radix) e nao de comportamento.
 */

afterEach(() => {
  cleanup();
});

/**
 * Clique no fundo escurecido. O Radix registra o listener de `pointerdown` fora
 * do conteudo num `setTimeout(0)` depois de abrir, para nao capturar o proprio
 * clique que abriu a modal; sem esperar esse tick, o evento passa despercebido.
 */
async function cliqueFora() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  const overlay = document.querySelector<HTMLElement>(
    '[data-slot="dialog-overlay"]',
  );
  if (!overlay) throw new Error("overlay do Dialog nao encontrado");
  fireEvent.pointerDown(overlay);
  fireEvent.click(overlay);
}

function apertarEsc() {
  fireEvent.keyDown(screen.getByRole("dialog"), {
    key: "Escape",
    code: "Escape",
  });
}

describe("SignOutConfirmModal", () => {
  function montar(isLoading = false) {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <div data-testid="pai">
        <SignOutConfirmModal
          isOpen
          onClose={onClose}
          onConfirm={onConfirm}
          isLoading={isLoading}
        />
      </div>,
    );
    return { onClose, onConfirm };
  }

  it("renderiza em portal no body, fora da arvore do pai", () => {
    montar();
    const dialog = screen.getByRole("dialog");
    expect(screen.getByTestId("pai").contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("confirmar chama onConfirm", () => {
    const { onConfirm, onClose } = montar();
    fireEvent.click(screen.getByRole("button", { name: "Sim, sair" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("cancelar chama onClose", () => {
    const { onClose, onConfirm } = montar();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("Esc fecha", () => {
    const { onClose } = montar();
    apertarEsc();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clique no fundo fecha", async () => {
    const { onClose } = montar();
    await cliqueFora();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("durante o loading, nem Esc nem clique no fundo fecham", async () => {
    const { onClose } = montar(true);
    apertarEsc();
    await cliqueFora();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("DeleteAccountConfirmModal", () => {
  function montar(isLoading = false) {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <div data-testid="pai">
        <DeleteAccountConfirmModal
          isOpen
          onClose={onClose}
          onConfirm={onConfirm}
          isLoading={isLoading}
          hasRealSubscription
          isBoletoSubscription={false}
        />
      </div>,
    );
    return { onClose, onConfirm };
  }

  it("renderiza em portal no body, fora da arvore do pai", () => {
    montar();
    const dialog = screen.getByRole("dialog");
    expect(screen.getByTestId("pai").contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("com a palavra digitada, confirmar chama onConfirm", () => {
    const { onConfirm, onClose } = montar();
    fireEvent.change(screen.getByLabelText(/digite EXCLUIR/i), {
      target: { value: "EXCLUIR" },
    });
    fireEvent.click(screen.getByTestId("excluir-conta-confirmar"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("cancelar chama onClose", () => {
    const { onClose, onConfirm } = montar();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("clique no fundo fecha", async () => {
    const { onClose } = montar();
    await cliqueFora();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Esc NAO fecha: esta modal nunca teve atalho de teclado para sair", () => {
    const { onClose } = montar();
    apertarEsc();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("durante a exclusao, clique no fundo nao fecha", async () => {
    const { onClose } = montar(true);
    await cliqueFora();
    expect(onClose).not.toHaveBeenCalled();
  });
});
