import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { readDeterministic } from "@shared/linkedin/readDeterministic";
import type {
  LinkedinAnalysisResponse,
  LinkedinCheckResult,
} from "@shared/linkedin/schema";
import LinkedinScoreHero from "./LinkedinScoreHero";
import SectionReport from "./SectionReport";

/**
 * NOTA PARCIAL E CRITERIOS NAO AVALIADOS (Fase 3, lote 2).
 *
 * Duas confusoes distintas, e as duas custam a mesma coisa (a pessoa acreditar
 * num veredito que a plataforma nao deu):
 *
 *   1. `notaIncompleta` chegava a tela quase sem sinal, e uma nota parcial se
 *      lia como definitiva;
 *   2. criterio PENDENTE (nao pudemos avaliar) e criterio REPROVADO (avaliamos
 *      e nao passou) pedem acoes opostas e apareciam quase iguais.
 *
 * Os asserts sao por texto e por `data-testid`, NUNCA por classe de cor: a
 * distincao precisa sobreviver a quem nao enxerga cor, e um teste que casasse
 * `bg-sky-200` estaria travando o estilo em vez do significado.
 */

afterEach(cleanup);

function check(patch: Partial<LinkedinCheckResult> = {}): LinkedinCheckResult {
  return {
    id: "headline-stack",
    label: "Headline cita a stack",
    category: "headline",
    tier: "essencial",
    aprovado: false,
    detail: "A headline cita menos de 2 tecnologias.",
    pendente: false,
    ...patch,
  };
}

function resposta(
  notaIncompleta: boolean,
  checks: LinkedinCheckResult[],
): LinkedinAnalysisResponse {
  const bruto = {
    score: 62,
    faixa: "em-construcao",
    checks,
    keywordsEncontradas: ["React"],
    keywordsFaltantes: [],
    titulosIngles: [],
    headline: "Front-end | React",
    sobreTamanho: 120,
    notaIncompleta,
  };
  // Passa pelo reader compartilhado, como a pagina faz: o marcador `pendente`
  // e normalizado ali, e o teste exercita o mesmo caminho da tela.
  const lido = readDeterministic(JSON.parse(JSON.stringify(bruto)), 8);
  return {
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    qualitativeVersion: 3,
    deterministicVersion: 8,
    deterministic: {
      ...lido,
      score: lido.score ?? 0,
      faixa: lido.faixa ?? "em-construcao",
    },
    qualitative: {} as LinkedinAnalysisResponse["qualitative"],
  };
}

describe("Q1: nota parcial e visivel", () => {
  it("notaIncompleta true: o estado e NOMEADO junto da nota", () => {
    render(
      <LinkedinScoreHero
        response={resposta(true, [check({ pendente: true })])}
        scoreDelta={null}
        reduce
      />,
    );

    const selo = screen.getByTestId("nota-parcial");
    expect(selo.textContent).toContain("Nota parcial");
    expect(selo.textContent).toContain(
      "não puderam ser avaliados com segurança",
    );
    // O rotulo da faixa some, para a nota nao parecer um veredito fechado.
    expect(screen.getByText("A confirmar")).toBeTruthy();
  });

  it("o selo nomeia o estado e o asterisco explica, sem repetir o caminho", () => {
    render(
      <LinkedinScoreHero
        response={resposta(true, [check({ pendente: true })])}
        scoreDelta={null}
        reduce
      />,
    );

    const selo = screen.getByTestId("nota-parcial");
    // O ponteiro para o fluxo de correcao manual da headline mora SO no
    // asterisco. Duplica-lo no selo seria dizer duas vezes a mesma coisa.
    expect(selo.textContent).not.toContain("Nova análise");
    expect(
      screen.getByText(/o passo de revisão mostra a headline que lemos/),
    ).toBeTruthy();
  });

  it("notaIncompleta false: nada novo na tela", () => {
    render(
      <LinkedinScoreHero
        response={resposta(false, [check({ aprovado: true })])}
        scoreDelta={null}
        reduce
      />,
    );

    expect(screen.queryByTestId("nota-parcial")).toBeNull();
    expect(screen.queryByText("A confirmar")).toBeNull();
  });
});

describe("Q2: pendente nao se confunde com reprovado", () => {
  it("o pendente ganha rotulo proprio e o reprovado nao ganha nenhum", () => {
    render(
      <SectionReport
        title="Headline"
        checks={[
          check({ id: "headline-stack", pendente: true, aprovado: false }),
          check({
            id: "headline-tamanho",
            label: "Headline no tamanho certo",
            pendente: false,
            aprovado: false,
            detail: "A headline passa de 220 caracteres.",
          }),
        ]}
      />,
    );

    // Marcador textual, presente so no pendente.
    const marcador = screen.getByTestId("check-pendente-headline-stack");
    expect(marcador.textContent).toBe("não avaliado");
    expect(screen.queryByTestId("check-pendente-headline-tamanho")).toBeNull();

    // E o texto de cada um diz coisas diferentes: um nao foi avaliado, o outro
    // foi avaliado e reprovou.
    expect(
      screen.getByText(/Não foi possível confirmar este critério/),
    ).toBeTruthy();
    expect(
      screen.getByText("A headline passa de 220 caracteres."),
    ).toBeTruthy();
  });

  it("a distincao existe por FORMA, sem depender de cor", () => {
    const { container } = render(
      <SectionReport
        title="Headline"
        checks={[
          check({ id: "headline-stack", pendente: true }),
          check({ id: "headline-tamanho", pendente: false }),
        ]}
      />,
    );

    // Icones diferentes: `CircleHelp` no pendente, `XCircle` no reprovado. O
    // assert e sobre a classe de IDENTIDADE do icone (qual desenho), nao sobre
    // a cor dele.
    const icones = Array.from(container.querySelectorAll("svg"))
      .map((s) => s.getAttribute("class") ?? "")
      .filter(
        (c) =>
          c.includes("lucide-circle-help") || c.includes("lucide-circle-x"),
      );
    expect(icones.some((c) => c.includes("lucide-circle-help"))).toBe(true);
    expect(icones.some((c) => c.includes("lucide-circle-x"))).toBe(true);
  });
});

describe("Q3: nenhum total exibido soma pendente como reprovado", () => {
  it("um pendente e um reprovado: as duas contagens aparecem separadas", () => {
    render(
      <SectionReport
        title="Headline"
        checks={[
          check({ id: "a", pendente: true, aprovado: false }),
          check({ id: "b", pendente: false, aprovado: false }),
          check({ id: "c", pendente: false, aprovado: true }),
        ]}
      />,
    );

    // O texto antigo diria "2 de 3 criterios pendentes" (somando) ou esconderia
    // o reprovado atras do pendente. Agora os dois numeros aparecem, cada um
    // com o seu verbo.
    expect(
      screen.getByText("1 a confirmar e 1 a corrigir, de 3 critérios"),
    ).toBeTruthy();
  });

  it("so pendentes: a palavra reprovado nao aparece na contagem", () => {
    render(
      <SectionReport
        title="Headline"
        checks={[
          check({ id: "a", pendente: true, aprovado: false }),
          check({ id: "b", pendente: false, aprovado: true }),
        ]}
      />,
    );

    expect(screen.getByText("1 de 2 critérios a confirmar")).toBeTruthy();
  });

  it("so reprovados: a contagem NAO rouba a palavra do estado pendente", () => {
    render(
      <SectionReport
        title="Headline"
        checks={[
          check({ id: "a", pendente: false, aprovado: false }),
          check({ id: "b", pendente: false, aprovado: true }),
        ]}
      />,
    );

    expect(screen.getByText("1 de 2 critérios a corrigir")).toBeTruthy();
    // Regressao travada: "pendentes" nomeava os REPROVADOS neste ramo.
    expect(screen.queryByText(/critérios pendentes/)).toBeNull();
  });

  it("tudo aprovado: contagem inteira, sem estado inventado", () => {
    render(
      <SectionReport
        title="Headline"
        checks={[
          check({ id: "a", pendente: false, aprovado: true }),
          check({ id: "b", pendente: false, aprovado: true }),
        ]}
      />,
    );

    expect(screen.getByText("2 critérios ok")).toBeTruthy();
    expect(screen.queryByTestId("check-pendente-a")).toBeNull();
  });
});
