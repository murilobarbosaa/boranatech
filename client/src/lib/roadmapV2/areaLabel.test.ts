import { describe, expect, it } from "vitest";
import { roadmapAreaLabel } from "./areaLabel";

// Literais escritos a mao, nunca derivados da funcao: o teste trava o
// comportamento atual das trilhas de area e de carreira e o rotulo novo dos
// kinds de linguagem, framework e ferramenta.
describe("roadmapAreaLabel", () => {
  it("titulo com Front vira Front-end", () => {
    expect(
      roadmapAreaLabel({ title: "Front-end do Zero", area: "frontend" }),
    ).toBe("Front-end");
  });

  it("trilha de area devolve a area crua", () => {
    expect(
      roadmapAreaLabel({ title: "Back-end do Zero", area: "backend" }),
    ).toBe("backend");
  });

  it("trilha de carreira devolve a sentinela crua", () => {
    expect(
      roadmapAreaLabel({
        title: "LinkedIn",
        area: "carreira",
        kind: "carreira",
      }),
    ).toBe("carreira");
  });

  it("kind linguagem devolve Linguagem", () => {
    expect(
      roadmapAreaLabel({
        title: "Python",
        area: "linguagem",
        kind: "linguagem",
      }),
    ).toBe("Linguagem");
  });

  it("kind framework devolve Framework", () => {
    expect(
      roadmapAreaLabel({
        title: "React",
        area: "framework",
        kind: "framework",
      }),
    ).toBe("Framework");
  });

  it("kind ferramenta devolve Ferramenta", () => {
    expect(
      roadmapAreaLabel({
        title: "Git",
        area: "ferramenta",
        kind: "ferramenta",
      }),
    ).toBe("Ferramenta");
  });
});
