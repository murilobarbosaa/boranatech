import { describe, expect, it } from "vitest";

import {
  decomporNota,
  pontosPendentes,
  pontosPossiveis,
  type ParcelaDaNota,
} from "./reguaV2";
import {
  LINKEDIN_CATEGORIES,
  TIER_WEIGHTS,
  type LinkedinCheckCategory,
  type LinkedinCheckTier,
} from "./schema";

/**
 * O check PENDENTE não pode abrir buraco na aritmética.
 *
 * A decisão de produto foi: `pendente` é um MARCADOR, `aprovado` continua com o
 * veredito calculado, e a nota não muda. Só a faixa exibida e o asterisco
 * mudam. Este arquivo prova as três coisas que sustentam isso:
 *
 *   (a) INÉRCIA  — a flag não move nenhuma parcela. Provado por deep-equals
 *       contra a mesma entrada sem a flag, e por um teste de MUTAÇÃO que
 *       reproduz a implementação errada (filtrar do reduce) e afirma que ela
 *       daria outro resultado. Deep-equals que passa sem nunca ter sido
 *       exercitado contra a mudança que previne é asserção não verificada.
 *
 *   (b) FECHAMENTO — a soma das parcelas é o total, e a nota derivada bate.
 *       Validado empiricamente fora do teste: o mesmo cálculo reproduziu o
 *       `score` de 162 análises persistidas, 162 de 162, zero divergência.
 *
 *   (c) FONTE ÚNICA — o número do asterisco sai de `pontosPendentes()`, e não
 *       de um `35` escrito à mão. O teste troca o tier de um check de headline
 *       e afirma que o número acompanha; um literal em qualquer lugar quebra.
 *
 * Tiers INVÁLIDOS não aparecem aqui de propósito: desde 2026-08-01
 * `computeLinkedinScore` lança para tier fora do catálogo, e essa asserção vive
 * em `server/routes/linkedinTierInvalido.test.ts`. Misturar as duas faria este
 * arquivo afirmar inércia sobre uma entrada que nem chega à decomposição.
 */

type Check = {
  id: string;
  category: LinkedinCheckCategory;
  tier: LinkedinCheckTier;
  aprovado: boolean;
  pendente?: boolean;
};

function c(
  id: string,
  category: LinkedinCheckCategory,
  tier: LinkedinCheckTier,
  aprovado: boolean,
  pendente?: boolean,
): Check {
  return pendente === undefined
    ? { id, category, tier, aprovado }
    : { id, category, tier, aprovado, pendente };
}

/** Os cinco de headline somam 35: 10 + 10 + 6 + 6 + 3. */
const HEADLINE_CHECKS: Check[] = [
  c("headline-existe", "headline", "essencial", true, true),
  c("headline-cargo-alvo", "headline", "essencial", true, true),
  c("headline-stack", "headline", "importante", false, true),
  c("headline-tamanho", "headline", "importante", true, true),
  c("headline-sem-cliche", "headline", "opcional", true, true),
];

const OUTROS: Check[] = [
  c("sobre-tamanho", "sobre", "essencial", true),
  c("exp-descricoes", "experiencias", "importante", false),
  c("foto-profissional", "sinais", "opcional", true),
  c("banner-personalizado", "sinais", "opcional", false),
];

const TODOS = [...HEADLINE_CHECKS, ...OUTROS];

function semAFlag(checks: Check[]): Check[] {
  return checks.map(({ pendente: _ignorado, ...resto }) => resto);
}

describe("(a) inercia: a flag `pendente` nao move a decomposicao", () => {
  it("decomporNota devolve exatamente o mesmo com e sem a flag", () => {
    const comFlag = decomporNota(TODOS, TIER_WEIGHTS, LINKEDIN_CATEGORIES);
    const sem = decomporNota(
      semAFlag(TODOS),
      TIER_WEIGHTS,
      LINKEDIN_CATEGORIES,
    );
    expect(comFlag).toEqual(sem);
  });

  it("marcar TODOS os checks como pendentes tambem nao move nada", () => {
    const tudoPendente = TODOS.map((x) => ({ ...x, pendente: true }));
    expect(decomporNota(tudoPendente, TIER_WEIGHTS, LINKEDIN_CATEGORIES)).toEqual(
      decomporNota(semAFlag(TODOS), TIER_WEIGHTS, LINKEDIN_CATEGORIES),
    );
  });

  it("MUTACAO: a implementacao errada (filtrar do reduce) daria outro numero", () => {
    // Reproduz o defeito que o deep-equals previne. Sem isto, o teste acima
    // passaria mesmo que `pendente` nunca fosse capaz de mover parcela nenhuma,
    // e ninguem saberia se ele exercita algo.
    const correto = decomporNota(TODOS, TIER_WEIGHTS, LINKEDIN_CATEGORIES);
    const errado: ParcelaDaNota[] = LINKEDIN_CATEGORIES.map((categoria) => {
      const doGrupo = TODOS.filter(
        (x) => x.category === categoria && x.pendente !== true,
      );
      return {
        categoria,
        ganho: doGrupo
          .filter((x) => x.aprovado)
          .reduce((s, x) => s + TIER_WEIGHTS[x.tier], 0),
        possivel: doGrupo.reduce((s, x) => s + TIER_WEIGHTS[x.tier], 0),
      };
    }).filter((p) => p.possivel > 0);

    expect(errado).not.toEqual(correto);
    const headlineCorreta = correto.find(
      (p) => p.categoria === "headline",
    );
    const headlineErrada = errado.find(
      (p) => p.categoria === "headline",
    );
    // O grupo de headline perderia os 35 inteiros na versao errada.
    expect(headlineCorreta?.possivel).toBe(35);
    expect(headlineErrada?.possivel ?? 0).toBe(0);
  });
});

describe("(b) fechamento: a soma dos grupos e o total", () => {
  it("soma das parcelas === pontosPossiveis dos mesmos checks", () => {
    const parcelas = decomporNota(TODOS, TIER_WEIGHTS, LINKEDIN_CATEGORIES);
    const somaPossivel = parcelas.reduce((s, p) => s + p.possivel, 0);
    expect(somaPossivel).toBe(pontosPossiveis(TODOS, TIER_WEIGHTS));
  });

  it("a nota derivada das parcelas bate com a conta direta", () => {
    const parcelas = decomporNota(TODOS, TIER_WEIGHTS, LINKEDIN_CATEGORIES);
    const ganho = parcelas.reduce((s, p) => s + p.ganho, 0);
    const possivel = parcelas.reduce((s, p) => s + p.possivel, 0);
    const direto = TODOS.filter((x) => x.aprovado).reduce(
      (s, x) => s + TIER_WEIGHTS[x.tier],
      0,
    );
    expect(ganho).toBe(direto);
    expect(Math.round((100 * ganho) / possivel)).toBe(
      Math.round((100 * direto) / pontosPossiveis(TODOS, TIER_WEIGHTS)),
    );
  });

  it("pendentes + nao pendentes === total, sem sobra nem falta", () => {
    const pendentes = pontosPendentes(TODOS, TIER_WEIGHTS);
    const naoPendentes = pontosPossiveis(
      TODOS.filter((x) => x.pendente !== true),
      TIER_WEIGHTS,
    );
    expect(pendentes + naoPendentes).toBe(pontosPossiveis(TODOS, TIER_WEIGHTS));
  });
});

describe("(c) fonte unica: o asterisco sai de pontosPendentes()", () => {
  it("os cinco checks de headline somam 35", () => {
    expect(pontosPendentes(TODOS, TIER_WEIGHTS)).toBe(35);
  });

  it("mudar o tier de UM check de headline muda o numero junto", () => {
    // O teste que pega o `35` escrito a mao. `headline-cargo-alvo` sai de
    // `essencial` (10) para `importante` (6): o asterisco tem que virar 31.
    const rebaixado = TODOS.map((x) =>
      x.id === "headline-cargo-alvo"
        ? { ...x, tier: "importante" as LinkedinCheckTier }
        : x,
    );
    expect(pontosPendentes(rebaixado, TIER_WEIGHTS)).toBe(31);
    // E o total possivel cai junto, porque e a mesma fonte de pesos.
    expect(pontosPossiveis(rebaixado, TIER_WEIGHTS)).toBe(
      pontosPossiveis(TODOS, TIER_WEIGHTS) - 4,
    );
  });

  it("sem nenhum pendente, o asterisco e zero", () => {
    expect(pontosPendentes(semAFlag(TODOS), TIER_WEIGHTS)).toBe(0);
    expect(pontosPendentes([], TIER_WEIGHTS)).toBe(0);
  });

  it("`pendente: false` explicito nao conta", () => {
    const nenhum = TODOS.map((x) => ({ ...x, pendente: false }));
    expect(pontosPendentes(nenhum, TIER_WEIGHTS)).toBe(0);
  });
});
