import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";

import SectionReport, { deriveSectionVerdict } from "./SectionReport";
import type { LinkedinCheckResult } from "@shared/linkedin/schema";

afterEach(cleanup);

/**
 * Todo bloco "pronto para colar" precisa dizer ONDE colar e o que fazer com o
 * que ja esta la. Antes eles apareciam sob um rotulo generico e a pessoa nao
 * sabia se o texto somava ou substituia (reclamacao de origem: os bullets
 * apareciam sob "Quer deixar ainda melhor?" e so).
 *
 * Teste estrutural, nao de render: le a pagina e exige que todo `paste=` tenha
 * um `pasteHint=` irmao. Um bloco novo sem hint quebra aqui.
 */

const PAGINA = readFileSync(
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "pages",
    "LinkedinAnalisar.tsx",
  ),
  "utf8",
);

describe("blocos pronto para colar declaram destino e operacao", () => {
  it("todo paste= tem um pasteHint=", () => {
    const pastes = (PAGINA.match(/^\s*paste=\{/gm) ?? []).length;
    const hints = (PAGINA.match(/^\s*pasteHint="/gm) ?? []).length;
    expect(pastes).toBe(5);
    expect(hints).toBe(pastes);
  });

  it("cada hint diz o campo de destino", () => {
    for (const alvo of [
      "campo de headline",
      "seção Sobre",
      "descrição da experiência",
      "em Competências",
      "chat do LinkedIn",
    ]) {
      expect(PAGINA).toContain(alvo);
    }
  });

  it("cada hint diz a operacao, e as tres sao distintas", () => {
    // headline e Sobre substituem, competencias soma, bullets e ambiguo por
    // natureza e a copy diz isso em vez de esconder.
    expect(PAGINA).toContain("SUBSTITUI o texto atual");
    expect(PAGINA).toContain("SUBSTITUI o que está lá");
    expect(PAGINA).toContain("é SOMA, não troca");
    expect(PAGINA).toContain("Aqui depende de você");
  });

  it("nenhum TODO sobrou nas copies do para colar", () => {
    const secao = readFileSync(
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "SectionReport.tsx",
      ),
      "utf8",
    );
    expect(secao).not.toContain("TODO(Ana): revisar o rotulo da camada pronta");
    expect(secao).not.toContain("TODO(Ana): revisar o convite do para colar");
  });
});

describe("SectionReport: estado pendente", () => {
  const pendente: LinkedinCheckResult = {
    id: "headline-stack",
    label: "Headline com tecnologias",
    category: "headline",
    tier: "importante",
    aprovado: false,
    detail: "A headline cita menos de 2 tecnologias reconhecidas.",
    pendente: true,
  };

  it("tem precedência sobre aprovado e reprovado no veredito", () => {
    expect(deriveSectionVerdict([{ ...pendente, aprovado: true }])).toBe(
      "pendente",
    );
  });

  it("renderiza A confirmar sem falso veredito ou instrução de correção", () => {
    render(
      createElement(
        SectionReport,
        { title: "Headline", checks: [pendente] },
        "conteúdo",
      ),
    );

    expect(screen.getByText("A confirmar")).toBeTruthy();
    expect(
      screen.getByText(/Não foi possível confirmar este critério/),
    ).toBeTruthy();
    expect(screen.queryByText("Está bom")).toBeNull();
    expect(screen.queryByText("Precisa trocar")).toBeNull();
    expect(screen.queryByText("como resolver:")).toBeNull();
    expect(screen.getByText("1 de 1 critérios a confirmar")).toBeTruthy();
  });
});
