import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import LogoLoop from "./LogoLoop";

beforeAll(() => {
  // jsdom não implementa IntersectionObserver, que o framer-motion usa via
  // whileInView. Stub no-op restrito a este arquivo (sem setupFiles global).
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
});

afterEach(() => {
  cleanup();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

function renderLoop() {
  const { hook } = memoryLocation({ path: "/" });
  return render(
    <Router hook={hook}>
      <LogoLoop />
    </Router>,
  );
}

function hrefsFor(accessibleName: string) {
  return screen
    .getAllByRole("link", { name: accessibleName })
    .map((link) => link.closest("a")?.getAttribute("href"));
}

describe("LogoLoop", () => {
  it("aponta o item-tecnologia React para /tecnologias/react", () => {
    renderLoop();
    const hrefs = hrefsFor("Ver tecnologia React");
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toBe("/tecnologias/react");
  });

  it("aponta o item-ferramenta GitHub para /ferramentas", () => {
    renderLoop();
    const hrefs = hrefsFor("Ver ferramenta GitHub");
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toBe("/ferramentas");
  });

  it("usa o alias html para HTML5 (e não html5)", () => {
    renderLoop();
    const hrefs = hrefsFor("Ver tecnologia HTML5");
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toBe("/tecnologias/html");
  });
});
