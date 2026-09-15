import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { Braces } from "lucide-react";
import TrailLogo, { TRAIL_LOGOS } from "./TrailLogo";

afterEach(() => cleanup());

describe("TrailLogo: logo real da trilha no card da vitrine", () => {
  it("slug conhecido renderiza o svg com o path oficial da marca", () => {
    for (const slug of ["javascript", "python", "git"]) {
      const { container } = render(
        <TrailLogo slug={slug} fallback={Braces} className="h-5 w-5" />,
      );
      const path = container.querySelector("svg path");
      expect(path?.getAttribute("d")).toBe(TRAIL_LOGOS[slug].path);
      expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
        "0 0 24 24",
      );
      cleanup();
    }
    // Conferencia contra a fonte (simple-icons 16.31.0): inicio do path do Git.
    expect(TRAIL_LOGOS.git.path.startsWith("M13.09 23.549")).toBe(true);
  });

  it("a tinta vem da paleta da trilha, sobre currentColor", () => {
    const { container } = render(
      <TrailLogo slug="git" fallback={Braces} className="h-5 w-5" />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("fill")).toBe("currentColor");
    expect(svg?.getAttribute("class")).toContain("text-orange-900");
    expect(svg?.getAttribute("class")).toContain("h-5 w-5");
  });

  it("slug sem logo cai no icone do grupo, com a tinta do fallback da paleta", () => {
    const { container } = render(
      <TrailLogo slug="rust" fallback={Braces} className="h-5 w-5" />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("lucide-braces");
    expect(svg?.getAttribute("class")).toContain("text-teal-900");
    expect(Object.prototype.hasOwnProperty.call(TRAIL_LOGOS, "rust")).toBe(
      false,
    );
  });
});
