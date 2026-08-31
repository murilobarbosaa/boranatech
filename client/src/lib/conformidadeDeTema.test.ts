import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, afterEach, describe, expect, it } from "vitest";

/**
 * CONFORMIDADE DE TEMA DAS SUPERFICIES DE LINKEDIN E FISCAL.
 *
 * A frente de dark mode converteu hex de marca em variaveis no cliente inteiro,
 * mas a pilha do LinkedIn bifurcou antes disso e a parte que ela adicionou nao
 * passou pela conversao. Este arquivo trava o resultado do Lote T, que fechou
 * essa diferenca, para que ela nao volte no proximo componente novo.
 *
 * O QUE ESTE ARQUIVO PROVA E O QUE NAO PROVA, e a distincao foi MEDIDA e nao
 * suposta. O jsdom NAO resolve `var()` dentro de valor computado: um `color:
 * var(--x)` volta como a string `var(--x)`, e nao como a cor. Medido com uma
 * sonda antes de escrever isto. Entao um teste que afirmasse "a cor computada
 * do botao e a do tema" seria um instrumento falso, reportando sucesso sobre
 * uma resolucao que nunca aconteceu.
 *
 * O que o jsdom FAZ e resolver a custom property em si
 * (`getPropertyValue("--bnt-shadow")`), e ele parseia o `index.css` real. A
 * prova aqui e essa cadeia, em dois elos, cada um cobrindo um defeito distinto:
 *
 *   ELO 1, o sitio usa o token: pega hex esquecido para tras.
 *   ELO 2, o token existe e MUDA entre claro e escuro: pega `var()` pendurado,
 *   que e o defeito da licao 5 da frente (o Tailwind v4 so emite variavel usada
 *   por utilitaria, e var() sem definicao renderiza transparente SEM erro).
 *
 * O elo que falta, "a utilitaria do Tailwind produz mesmo essa cor no
 * navegador", nao e verificavel aqui porque as classes do Tailwind nem existem
 * no `index.css` (sao geradas no build). Isso e navegador, nao jsdom.
 */

const RAIZ = process.cwd();

/** Os hex de marca que a convencao manda tokenizar. */
const HEX_DE_MARCA = /#(?:FFB800|faf8f4|0f172a|1a1a1a|fffbeb|fef3c7)/gi;

/**
 * As superficies que o Lote T converteu, mais a que ficou de fora por ser DADO.
 * Lista fechada de proposito: um componente novo destas areas entra aqui no
 * mesmo commit, e e essa a hora de decidir se ele e apresentacao ou dado.
 */
const ARQUIVOS = [
  "client/src/components/admin/FiscalInvoicesDashboard.tsx",
  "client/src/components/admin/LinkedinLastroDashboard.tsx",
  "client/src/components/fiscal/FiscalDataBanner.tsx",
  "client/src/components/fiscal/FiscalDataModal.tsx",
  "client/src/components/fiscal/FiscalInvoicesSection.tsx",
  "client/src/components/linkedin/LinkedinHistory.tsx",
  "client/src/components/linkedin/LinkedinScoreHero.tsx",
  "client/src/pages/LinkedinAnalisar.tsx",
  "client/src/pages/Perfil.tsx",
];

/**
 * Hex que sobrevive por ser DADO, nao estilo. Afirmado como TOTAL e nao como
 * pertinencia: se um sitio de apresentacao novo aparecer, a contagem sobe e o
 * teste quebra, em vez de o sitio sumir da verificacao em silencio.
 */
const EXPECTED_SITIOS_DE_DADO = 2;

function fonte(caminho: string): string {
  return readFileSync(resolve(RAIZ, caminho), "utf8");
}

describe("ELO 1: as superficies usam token, nao hex", () => {
  it(`o unico hex de marca restante e o DADO, e sao exatamente ${EXPECTED_SITIOS_DE_DADO} ocorrencias`, () => {
    const achados: string[] = [];
    for (const arquivo of ARQUIVOS) {
      const texto = fonte(arquivo);
      texto.split("\n").forEach((linha, i) => {
        // `exec` em laco, e nao `matchAll`: o tsconfig da aplicacao nao declara
        // `target`, entao cai em ES5, e iterar o retorno de `matchAll` exigiria
        // `downlevelIteration`. Medido pelo `tsc`, nao suposto.
        HEX_DE_MARCA.lastIndex = 0;
        let hit = HEX_DE_MARCA.exec(linha);
        while (hit !== null) {
          achados.push(`${arquivo}:${i + 1} ${hit[0]}`);
          hit = HEX_DE_MARCA.exec(linha);
        }
      });
    }
    // Os dois sobreviventes sao o array entregue a biblioteca de confete. Ela
    // recebe strings de cor e pinta em canvas: quem le nao resolve var(), entao
    // tokenizar aqui trocaria uma cor por nada.
    expect(achados).toHaveLength(EXPECTED_SITIOS_DE_DADO);
    for (const achado of achados) {
      expect(achado).toContain("LinkedinScoreHero.tsx");
    }
  });

  it("os sitios criticos de contraste citam o token esperado", () => {
    expect(
      fonte("client/src/components/fiscal/FiscalDataBanner.tsx"),
    ).toContain("bg-[var(--brand-yellow)]");
    expect(fonte("client/src/components/fiscal/FiscalDataModal.tsx")).toContain(
      "bg-[var(--brand-cream)]",
    );
    expect(
      fonte("client/src/components/admin/FiscalInvoicesDashboard.tsx"),
    ).toContain("shadow-[3px_3px_0_var(--bnt-shadow)]");
    expect(fonte("client/src/pages/Perfil.tsx")).toContain(
      "border-[var(--bnt-ink)]",
    );
  });

  /**
   * Contagem de `text-ink-on-accent` por arquivo, e nao varredura por linha.
   *
   * A primeira versao disto procurava `text-slate-9xx` NA MESMA LINHA de um
   * `bg-[var(--brand-yellow)]`, e um mutante provou que ela nao servia: em JSX o
   * texto e quase sempre FILHO do elemento colorido, em outra linha, entao
   * devolver `text-slate-950` ao paragrafo do banner passava verde. Era um
   * parser que sub-casa em silencio, a falha que sempre reporta sucesso sobre
   * uma superficie menor.
   *
   * A contagem nao sabe o que e filho de que, mas afirma o TOTAL: tirar uma das
   * ocorrencias derruba o numero, e trocar uma por `text-slate-950` derruba
   * junto. Mexer nestes valores e ato deliberado, no mesmo commit que muda o
   * componente.
   */
  const INK_ON_ACCENT_ESPERADO: Record<string, number> = {
    "client/src/components/fiscal/FiscalDataBanner.tsx": 2,
    "client/src/components/fiscal/FiscalDataModal.tsx": 2,
    "client/src/components/admin/FiscalInvoicesDashboard.tsx": 1,
    "client/src/pages/Perfil.tsx": 4,
    "client/src/pages/LinkedinAnalisar.tsx": 4,
  };

  it("texto sobre amarelo de marca usa ink-on-accent, no total esperado", () => {
    for (const [arquivo, esperado] of Object.entries(INK_ON_ACCENT_ESPERADO)) {
      const achados = fonte(arquivo).match(/text-ink-on-accent/g) ?? [];
      expect(achados.length, `${arquivo}: ink-on-accent`).toBe(esperado);
    }
  });
});

describe("ELO 2: os tokens existem e respondem ao tema", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.textContent = fonte("client/src/index.css");
    document.head.appendChild(style);
  });

  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  function valor(nome: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(nome)
      .trim();
  }

  it("nenhum token usado pelas superficies esta pendurado", () => {
    for (const token of [
      "--bnt-shadow",
      "--bnt-ink",
      "--bnt-ink-on-accent",
      "--brand-yellow",
      "--brand-cream",
    ]) {
      expect(valor(token), `${token} sem definicao no :root`).not.toBe("");
    }
  });

  it("tinta e sombra INVERTEM no escuro", () => {
    const claros = { ink: valor("--bnt-ink"), sombra: valor("--bnt-shadow") };
    document.documentElement.classList.add("dark");
    expect(valor("--bnt-ink")).not.toBe(claros.ink);
    expect(valor("--bnt-shadow")).not.toBe(claros.sombra);
  });

  it("ink-on-accent NAO inverte, porque o amarelo e o mesmo nos dois temas", () => {
    // Nao e excecao esquecida: esta escrito no proprio index.css. O acento nao
    // muda entre os temas, entao a tinta que vai POR CIMA dele nao pode mudar.
    const claro = valor("--bnt-ink-on-accent");
    document.documentElement.classList.add("dark");
    expect(valor("--bnt-ink-on-accent")).toBe(claro);
  });
});
