import { describe, expect, it } from "vitest";

import { competenciasDoPdf } from "./competenciasDoPdf";
import { parseLinkedinText } from "./parse";

const SKILLS = ["React", "TypeScript", "Next.js", "Git", "Docker", "Figma"];
const CORPO = [
  "Summary",
  "Desenvolvo produtos digitais e documento decisões técnicas com o time.",
  "Experience",
  "Empresa Exemplo",
  "Frontend Developer",
  "janeiro de 2024 - Present",
  "Desenvolvi interfaces acessíveis para o produto principal.",
];

describe("competências delimitadas por estrutura do PDF", () => {
  it("encerra Top Skills em Projects e nunca aceita o heading como skill", () => {
    const parsed = parseLinkedinText(
      ["Top Skills", "React", "TypeScript", "Projects", "Vue", "Docker"].join(
        "\n",
      ),
    );
    expect(parsed.skillsPdf).toEqual(["React", "TypeScript"]);
    expect(parsed.skillsPdfConfiaveis).toBe(true);
  });

  it("encerra Competências em Projetos", () => {
    const parsed = parseLinkedinText(
      ["Competências", "React", "TypeScript", "Projetos", "Vue"].join("\n"),
    );
    expect(parsed.skillsPdf).toEqual(["React", "TypeScript"]);
    expect(parsed.skillsPdfConfiaveis).toBe(true);
  });

  it("lista legítima com 6 skills preserva a origem e oferece cinco", () => {
    const parsed = parseLinkedinText(
      [
        "Top Skills",
        ...SKILLS,
        "Joana Teste",
        "Frontend Developer | React | TypeScript",
        "São Paulo, Brasil",
        ...CORPO,
      ].join("\n"),
    );

    expect(parsed.skillsPdf).toEqual(SKILLS);
    expect(parsed.skillsPdfConfiaveis).toBe(true);
    expect(competenciasDoPdf(parsed.skillsPdf).aceitas).toEqual(
      SKILLS.slice(0, 5),
    );
  });

  it("identidade e headline depois da seção não viram skill", () => {
    const parsed = parseLinkedinText(
      [
        "Top Skills",
        "React",
        "TypeScript",
        "Joana Teste",
        "Frontend Developer | React | TypeScript",
        "São Paulo, Brasil",
        ...CORPO,
      ].join("\n"),
    );

    expect(parsed.skillsPdf).toEqual(["React", "TypeScript"]);
    expect(parsed.skillsPdfConfiaveis).toBe(true);
  });

  it("identidade antes da seção também não vira skill", () => {
    const parsed = parseLinkedinText(
      [
        "Joana Teste",
        "Frontend Developer | React | TypeScript",
        "São Paulo, Brasil",
        "Top Skills",
        ...SKILLS,
        ...CORPO,
      ].join("\n"),
    );

    expect(parsed.skillsPdf).toEqual(SKILLS);
    expect(parsed.skillsPdfConfiaveis).toBe(true);
    expect(parsed.skillsPdf.join(" ")).not.toContain("Joana");
    expect(parsed.skillsPdf.join(" ")).not.toContain("Frontend Developer");
  });

  it("lista com exatamente cinco e lista curta continuam intactas", () => {
    expect(competenciasDoPdf(SKILLS.slice(0, 5)).aceitas).toEqual(
      SKILLS.slice(0, 5),
    );
    expect(competenciasDoPdf(SKILLS.slice(0, 2)).aceitas).toEqual(
      SKILLS.slice(0, 2),
    );
  });

  it("origem inconclusiva não preenche e exige revisão manual", () => {
    const parsed = parseLinkedinText(
      [
        "Top Skills",
        "React",
        "TypeScript",
        "Joana Teste",
        "São Paulo, Brasil",
        ...CORPO,
      ].join("\n"),
    );

    expect(parsed.skillsPdfConfiaveis).toBe(false);
    const prefill = competenciasDoPdf(
      parsed.skillsPdf,
      parsed.skillsPdfConfiaveis !== false,
    );
    expect(prefill.aceitas).toEqual([]);
    expect(prefill.descartadas[0]?.motivo).toContain("revisão manual");
  });

  it("seção posterior desconhecida falha fechada e não faz prefill", () => {
    const parsed = parseLinkedinText(
      [
        "Ana Silva",
        "Frontend Developer | React",
        "São Paulo, Brasil",
        "Top Skills",
        "React",
        "TypeScript",
        "Community Contributions",
        "Vue",
      ].join("\n"),
    );
    expect(parsed.skillsPdfConfiaveis).toBe(false);
    expect(
      competenciasDoPdf(parsed.skillsPdf, parsed.skillsPdfConfiaveis).aceitas,
    ).toEqual([]);
  });

  it("Patents encerra a seção sem contaminar skills posteriores", () => {
    const parsed = parseLinkedinText(
      [
        "Top Skills",
        "React",
        "TypeScript",
        "Patents",
        "Vue",
        "Docker",
        "Summary",
      ].join("\n"),
    );

    expect(parsed.skillsPdf).toEqual(["React", "TypeScript"]);
    expect(parsed.skillsPdfConfiaveis).toBe(true);
  });

  it("heading desconhecido entre skills e conteúdo falha fechado", () => {
    const parsed = parseLinkedinText(
      [
        "Top Skills",
        "React",
        "TypeScript",
        "Alguma Secao Desconhecida",
        "Vue",
        "Docker",
      ].join("\n"),
    );

    expect(parsed.skillsPdf).toEqual(["React", "TypeScript"]);
    expect(parsed.skillsPdfConfiaveis).toBe(false);
    expect(
      competenciasDoPdf(parsed.skillsPdf, parsed.skillsPdfConfiaveis).aceitas,
    ).toEqual([]);
  });

  it("heading desconhecido continua fail-closed mesmo antes da primeira skill", () => {
    const parsed = parseLinkedinText(
      [
        "Top Skills",
        "Alguma Secao Desconhecida",
        "Vue",
        "Docker",
        "Summary",
      ].join("\n"),
    );

    expect(parsed.skillsPdf).toEqual([]);
    expect(parsed.skillsPdfConfiaveis).toBe(false);
  });

  it("quatro skills legítimas de uma palavra continuam confiáveis", () => {
    const parsed = parseLinkedinText(
      ["Top Skills", "React", "Docker", "Python", "Java", "Summary"].join("\n"),
    );

    expect(parsed.skillsPdf).toEqual(["React", "Docker", "Python", "Java"]);
    expect(parsed.skillsPdfConfiaveis).toBe(true);
  });

  it.each([
    "Languages",
    "Education",
    "Projects",
    "Volunteer Experience",
    "Publications",
    "Courses",
    "Honors & Awards",
    "Organizations",
    "Interests",
    "Recommendations",
    "Patents",
    "Test Scores",
    "Featured",
  ])("heading suportado %s encerra skills", (heading) => {
    const parsed = parseLinkedinText(
      ["Top Skills", "React", "TypeScript", heading, "Vue"].join("\n"),
    );
    expect(parsed.skillsPdf).toEqual(["React", "TypeScript"]);
    expect(parsed.skillsPdfConfiaveis).toBe(true);
  });

  it("seis skills seguidas de heading reconhecido oferecem as cinco primeiras", () => {
    const parsed = parseLinkedinText(
      ["Top Skills", ...SKILLS, "Languages", "Português", "English"].join("\n"),
    );
    expect(parsed.skillsPdf).toEqual(SKILLS);
    expect(parsed.skillsPdfConfiaveis).toBe(true);
    expect(
      competenciasDoPdf(parsed.skillsPdf, parsed.skillsPdfConfiaveis).aceitas,
    ).toEqual(SKILLS.slice(0, 5));
  });
});
