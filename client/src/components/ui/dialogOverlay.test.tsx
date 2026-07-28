import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";

import { AlertDialog, AlertDialogContent } from "./alert-dialog";
import { Dialog, DialogContent, DialogTitle } from "./dialog";

// `overlayClassName` foi acrescentado a DialogContent e AlertDialogContent para
// o modulo de Tarefas subir o escurecido acima do header do admin (z-[1000]).
//
// A prop e ADITIVA, e este arquivo existe para travar isso: sem ela, o overlay
// tem que continuar exatamente como estava, porque os dialogs do site publico e
// dos outros paineis do admin nao foram varridos. Um default alterado aqui muda
// o empilhamento de todo dialog do projeto de uma vez, em silencio.

function overlayDe(container: HTMLElement, slot: string): HTMLElement {
  const el = container.ownerDocument.querySelector<HTMLElement>(
    `[data-slot="${slot}"]`,
  );
  if (!el) throw new Error(`overlay ${slot} nao encontrado`);
  return el;
}

afterEach(cleanup);

describe("overlay do Dialog", () => {
  it("SEM a prop, mantem o z-50 de sempre", () => {
    const { container } = render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>x</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const overlay = overlayDe(container, "dialog-overlay");
    expect(overlay.className).toContain("z-50");
    expect(overlay.className).not.toContain("z-[2000]");
  });

  it("COM a prop, a classe entra sem apagar as originais", () => {
    const { container } = render(
      <Dialog open>
        <DialogContent overlayClassName="z-[2000]">
          <DialogTitle>x</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const overlay = overlayDe(container, "dialog-overlay");
    expect(overlay.className).toContain("z-[2000]");
    // As classes de base seguem la: a prop soma, nao substitui.
    expect(overlay.className).toContain("fixed");
    expect(overlay.className).toContain("bg-black/50");
  });
});

describe("overlay do AlertDialog", () => {
  it("SEM a prop, mantem o z-50 de sempre", () => {
    const { container } = render(
      <AlertDialog open>
        <AlertDialogContent />
      </AlertDialog>,
    );
    const overlay = overlayDe(container, "alert-dialog-overlay");
    expect(overlay.className).toContain("z-50");
    expect(overlay.className).not.toContain("z-[2000]");
  });

  it("COM a prop, a classe entra sem apagar as originais", () => {
    const { container } = render(
      <AlertDialog open>
        <AlertDialogContent overlayClassName="z-[2000]" />
      </AlertDialog>,
    );
    const overlay = overlayDe(container, "alert-dialog-overlay");
    expect(overlay.className).toContain("z-[2000]");
    expect(overlay.className).toContain("bg-black/50");
  });
});
