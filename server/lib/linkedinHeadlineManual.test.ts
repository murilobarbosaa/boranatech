import { describe, expect, it, vi } from "vitest";

import { parseLinkedinText } from "../../shared/linkedin/parse";
import { textoComHeadlineManual } from "../../shared/linkedin/parse";
import {
  HEADLINE_MANUAL_MAX,
  headlineFinalDe,
  type LinkedinAnalyzeRequest,
} from "../../shared/linkedin/schema";
import { buildUserPrompt } from "./linkedinAnalyze";
import { runLinkedinChecks } from "./linkedinChecks";

vi.mock("./env", () => ({
  env: { openaiApiKey: "test", billingEnabled: false },
}));

const PROFILE = [
  "Joana Teste",
  "Desenvolvedora Front-end | React,",
  "São Paulo, Brasil",
  "Summary",
  "Sou desenvolvedora e construo interfaces acessíveis com React e TypeScript. ".repeat(
    5,
  ),
  "Experience",
  "Empresa Exemplo",
  "Desenvolvedora Front-end",
  "janeiro de 2023 - Present",
  "Desenvolvi interfaces em React e TypeScript para o produto principal.",
].join("\n");

const REQUEST: LinkedinAnalyzeRequest = {
  profileText: PROFILE,
  area: "frontend",
  level: "pleno",
  mercado: "brasil",
  skills: "React, TypeScript",
  foto: "sim",
  banner: "sim",
  openToWork: "sim",
  conexoes: "100-500",
  atividade: "semanal",
};

function analisar(headlineManual?: string) {
  const parsed = parseLinkedinText(PROFILE);
  const deterministic = runLinkedinChecks({
    parsed,
    profileText: PROFILE,
    area: REQUEST.area,
    level: REQUEST.level,
    mercado: REQUEST.mercado,
    skills: REQUEST.skills,
    foto: REQUEST.foto,
    banner: REQUEST.banner,
    openToWork: REQUEST.openToWork,
    conexoes: REQUEST.conexoes,
    atividade: REQUEST.atividade,
    headlineManual,
  });
  return { parsed, deterministic };
}

describe("headline manual e efetiva", () => {
  it("a manual válida vence e alimenta deterministic e prompt", () => {
    const manual =
      "Desenvolvedora Front-end | React | TypeScript | Acessibilidade";
    const { parsed, deterministic } = analisar(manual);
    const prompt = buildUserPrompt(
      { ...REQUEST, headlineManual: manual },
      parsed,
      deterministic,
    );

    expect(parsed.headline).not.toBe(manual);
    expect(deterministic.headline).toBe(manual);
    expect(prompt).toContain(`Headline efetiva da análise: ${manual}`);
    expect(deterministic.notaIncompleta).toBe(false);
  });

  it("CASO A: troca só a headline e preserva Projects na cobertura", () => {
    const profileText = [
      "Joana Teste",
      "Frontend Developer | React",
      "São Paulo, Brasil",
      "Projects",
      "Aplicação criada com Next.js para um catálogo acessível.",
      "Summary",
      "Construo interfaces web e documento as decisões de produto com o time.",
    ].join("\n");
    const parsed = parseLinkedinText(profileText);
    const before = profileText;
    const deterministic = runLinkedinChecks({
      ...REQUEST,
      profileText,
      parsed,
      skills: "",
      headlineManual: "Frontend Developer | Vue.js",
    });

    expect(deterministic.keywordsEncontradas).toContain("Vue.js");
    expect(deterministic.keywordsEncontradas).toContain("Next.js");
    expect(deterministic.keywordsEncontradas).not.toContain("React");
    expect(deterministic.perfilDedup).not.toContain("React");
    expect(profileText).toBe(before);
  });

  it("reprodução da auditoria: Projects impede escolher o cargo do projeto", () => {
    const profileText = [
      "Ana Silva",
      "Frontend Developer | React",
      "Projects",
      "Backend Developer | TypeScript",
    ].join("\n");
    const parsed = parseLinkedinText(profileText);
    const textoEfetivo = textoComHeadlineManual(
      profileText,
      "Frontend Developer | Vue",
    );
    const deterministic = runLinkedinChecks({
      ...REQUEST,
      profileText,
      parsed,
      skills: "",
      headlineManual: "Frontend Developer | Vue",
    });

    expect(parsed.headline).toBe("Frontend Developer | React");
    expect(parsed.headlineRegion?.status).toBe("confirmed");
    expect(textoEfetivo).toContain("Projects\nBackend Developer | TypeScript");
    expect(deterministic.headline).toBe("Frontend Developer | Vue");
    expect(deterministic.keywordsEncontradas).toContain("Vue.js");
    expect(deterministic.keywordsEncontradas).toContain("TypeScript");
    expect(deterministic.keywordsEncontradas).not.toContain("React");
    expect(deterministic.notaIncompleta).toBe(false);
  });

  it("reprodução multiline: React residual não contamina a manual Vue", () => {
    const profileText = "Frontend Developer,\nReact";
    const parsed = parseLinkedinText(profileText);
    const deterministic = runLinkedinChecks({
      ...REQUEST,
      profileText,
      parsed,
      skills: "",
      headlineManual: "Frontend Developer | Vue",
    });

    expect(parsed.headlineRegion?.status).toBe("confirmed");
    expect(deterministic.keywordsEncontradas).toContain("Vue.js");
    expect(deterministic.keywordsEncontradas).not.toContain("React");
    expect(deterministic.notaIncompleta).toBe(false);
  });

  it("região ambígua preserva o bruto, exclui sua evidência e mantém pending", () => {
    const profileText = [
      "Frontend Developer,",
      "Empresa React",
      "Open Source Contributions",
      "Conteúdo não delimitado.",
    ].join("\n");
    const parsed = parseLinkedinText(profileText);
    const deterministic = runLinkedinChecks({
      ...REQUEST,
      profileText,
      parsed,
      skills: "",
      headlineManual: "Frontend Developer | Vue",
    });

    expect(parsed.headlineRegion?.status).toBe("ambiguous");
    expect(textoComHeadlineManual(profileText, "Frontend Developer | Vue")).toBe(
      profileText,
    );
    expect(deterministic.keywordsEncontradas).toContain("Vue.js");
    expect(deterministic.keywordsEncontradas).not.toContain("React");
    expect(deterministic.notaIncompleta).toBe(true);
  });

  it("remove também fragmento estrutural acima da headline detectada", () => {
    const profileText = [
      "Top Skills",
      "TypeScript",
      "Joana Teste",
      "Frontend Developer | React |",
      "Frontend Developer | Produto acessível e interfaces web",
      "São Paulo, Brasil",
      "Summary",
      "Construo interfaces para produtos digitais.",
    ].join("\n");
    const parsed = parseLinkedinText(profileText);
    const deterministic = runLinkedinChecks({
      ...REQUEST,
      profileText,
      parsed,
      skills: "",
      headlineManual: "Frontend Developer | Vue.js",
    });

    expect(parsed.skillsPdf).toEqual(["TypeScript"]);
    expect(deterministic.keywordsEncontradas).toContain("Vue.js");
    expect(deterministic.keywordsEncontradas).toContain("TypeScript");
    expect(deterministic.keywordsEncontradas).not.toContain("React");
  });

  it("preserva byte a byte todo o texto fora do intervalo da headline", () => {
    const profileText = [
      "  Joana Teste  ",
      "Frontend Developer | React",
      "",
      "Projects",
      "  Aplicação criada com Next.js  ",
      "Page 1 of 2",
      "Summary",
      "Texto final.",
      "",
    ].join("\r\n");
    const esperado = profileText.replace(
      "Frontend Developer | React",
      "Frontend Developer | Vue.js",
    );

    expect(
      textoComHeadlineManual(profileText, "Frontend Developer | Vue.js"),
    ).toBe(esperado);
  });

  it("CASO B: mantém React quando a ocorrência real está em Skills", () => {
    const profileText = [
      "Joana Teste",
      "Frontend Developer | React",
      "São Paulo, Brasil",
      "Top Skills",
      "React",
      "Git",
      "Summary",
      "Construo interfaces web e documento as decisões de produto com o time.",
    ].join("\n");
    const deterministic = runLinkedinChecks({
      ...REQUEST,
      profileText,
      parsed: parseLinkedinText(profileText),
      skills: "",
      headlineManual: "Frontend Developer | Vue.js",
    });

    expect(deterministic.keywordsEncontradas).toContain("Vue.js");
    expect(deterministic.keywordsEncontradas).toContain("React");
  });

  it("CASO C: preserva tecnologia em seção desconhecida pelo parser", () => {
    const profileText = [
      "Joana Teste",
      "Frontend Developer | React",
      "São Paulo, Brasil",
      "Open Source Contributions",
      "Mantive uma biblioteca de componentes em TypeScript.",
      "Summary",
      "Construo interfaces web e documento as decisões de produto com o time.",
    ].join("\n");
    const deterministic = runLinkedinChecks({
      ...REQUEST,
      profileText,
      parsed: parseLinkedinText(profileText),
      skills: "",
      headlineManual: "Frontend Developer | Vue.js",
    });

    expect(deterministic.keywordsEncontradas).toContain("Vue.js");
    expect(deterministic.keywordsEncontradas).toContain("TypeScript");
    expect(deterministic.keywordsEncontradas).not.toContain("React");
  });

  it("sem manual preserva resultado e pendência da headline cortada", () => {
    const semChave = analisar().deterministic;
    const comVazio = analisar("   ").deterministic;
    expect(comVazio).toEqual(semChave);
    expect(semChave.notaIncompleta).toBe(true);
  });

  it("manual ainda cortada continua pendente", () => {
    expect(
      analisar("Desenvolvedora Front-end | React,").deterministic
        .notaIncompleta,
    ).toBe(true);
  });

  it("a precedência central tolera ausência e vazio", () => {
    expect(headlineFinalDe("parser", "manual")).toBe("manual");
    expect(headlineFinalDe("parser", undefined)).toBe("parser");
    expect(headlineFinalDe("parser", "   ")).toBe("parser");
    expect(headlineFinalDe(null, undefined)).toBeNull();
    expect(HEADLINE_MANUAL_MAX).toBe(250);
  });
});
