import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BadgeDetailModal } from "@/components/badges/BadgeDetailModal";
import type { BadgeInfo } from "@/services/badgesService";

import { DeleteAccountConfirmModal } from "./DeleteAccountConfirmModal";
import { ResetQuizConfirmModal } from "./ResetQuizConfirmModal";
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

describe("SignOutConfirmModal: elevacao para o admin", () => {
  function montar(
    props: { contentClassName?: string; overlayClassName?: string } = {},
  ) {
    render(
      <SignOutConfirmModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        {...props}
      />,
    );
    const content = screen.getByRole("dialog");
    const overlay = document.querySelector<HTMLElement>(
      '[data-slot="dialog-overlay"]',
    );
    if (!overlay) throw new Error("overlay do Dialog nao encontrado");
    return { content, overlay };
  }

  it("sem as props, content e overlay seguem no z-50 de sempre", () => {
    const { content, overlay } = montar();
    expect(content.className).toContain("z-50");
    expect(content.className).not.toContain("z-[2000]");
    expect(overlay.className).toContain("z-50");
    expect(overlay.className).not.toContain("z-[2000]");
  });

  it("com as props, a classe chega ao content e ao overlay", () => {
    const { content, overlay } = montar({
      contentClassName: "z-[2000]",
      overlayClassName: "z-[2000]",
    });
    expect(content.className).toContain("z-[2000]");
    expect(content.className).not.toContain("z-50");
    expect(overlay.className).toContain("z-[2000]");
    expect(overlay.className).not.toContain("z-50");
    expect(content.className).toContain("rounded-3xl");
    expect(overlay.className).toContain("bg-slate-950/60");
  });
});

describe("ResetQuizConfirmModal", () => {
  function montar() {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <div data-testid="pai">
        <ResetQuizConfirmModal open onClose={onClose} onConfirm={onConfirm} />
      </div>,
    );
    return { onClose, onConfirm };
  }

  it("renderiza em portal no body, fora da arvore do pai", () => {
    montar();
    const conteudo = screen.getByText("Reiniciar o quiz?");
    expect(screen.getByTestId("pai").contains(conteudo)).toBe(false);
    expect(document.body.contains(conteudo)).toBe(true);
  });

  it("confirmar chama onConfirm e depois onClose", () => {
    const { onConfirm, onClose } = montar();
    fireEvent.click(screen.getByRole("button", { name: "Sim, reiniciar" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.invocationCallOrder[0]).toBeLessThan(
      onClose.mock.invocationCallOrder[0],
    );
  });

  it("cancelar chama onClose", () => {
    const { onClose, onConfirm } = montar();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("o X fecha", () => {
    const { onClose } = montar();
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
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

  it("ao abrir, o foco vai para o botao de confirmar", () => {
    montar();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Sim, reiniciar" }),
    );
  });
});

describe("BadgeDetailModal", () => {
  const BADGE: BadgeInfo = {
    id: "b1",
    category: "estudo",
    name: "Primeiros passos",
    description: "Concluiu o primeiro modulo.",
    iconName: "Footprints",
    unlockCriteria: "Conclua um modulo.",
    isUnlocked: false,
    unlockedAt: null,
    progress: { current: 1, target: 4 },
    isNew: false,
  };

  function montar(badge: BadgeInfo | null = BADGE) {
    const onClose = vi.fn();
    render(
      <div data-testid="pai">
        <BadgeDetailModal badge={badge} onClose={onClose} />
      </div>,
    );
    return { onClose };
  }

  it("sem badge, nao renderiza nada", () => {
    montar(null);
    expect(screen.queryByText("Primeiros passos")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renderiza em portal no body, fora da arvore do pai", () => {
    montar();
    const conteudo = screen.getByText("Primeiros passos");
    expect(screen.getByTestId("pai").contains(conteudo)).toBe(false);
    expect(document.body.contains(conteudo)).toBe(true);
  });

  it("o X fecha", () => {
    const { onClose } = montar();
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clique no fundo fecha", async () => {
    const { onClose } = montar();
    await cliqueFora();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Esc fecha: melhoria, antes nao havia atalho nenhum", () => {
    const { onClose } = montar();
    apertarEsc();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
