import { describe, expect, it } from "vitest";

/**
 * A ARITMETICA DO FALLBACK POR CARACTERES, com numeros literais.
 *
 * O fallback existe para as rotas que ainda nao repassam o `usage` da OpenAI.
 * Ele e ESTIMATIVA declarada, nunca medicao, e o que este arquivo trava e que a
 * estimativa use a regua CALIBRADA (2,2 caracteres por token, medido) e nao a
 * regra de bolso do ingles (4), que subestimava a entrada em cerca de 45%.
 *
 * Os numeros esperados sao literais calculados A MAO nos comentarios de cada
 * assert. Afirmar `estimateCost(a, b) === estimateCost(a, b)` seria afirmar
 * nada; e preciso que o numero esteja escrito aqui para que uma mudanca de
 * regua quebre o teste em vez de acompanha-la em silencio.
 *
 * Preco NAO e assunto deste arquivo: `MODEL_PRICING` segue intocado, e a
 * conferencia humana dos valores continua na fila da Ana.
 */

import {
  CHARS_PER_TOKEN,
  estimateCost,
  estimateCostFromTokens,
  MODEL_PRICING,
} from "./aiTools";
import { DEFAULT_MODEL } from "./openai";

describe("a regua do fallback e a medida, nao a regra de bolso", () => {
  it("CHARS_PER_TOKEN vale 2,2, o valor MEDIDO", () => {
    // MEDICAO DE ORIGEM: no analisador de LinkedIn, que le `usage` de verdade,
    // 9.097 caracteres de entrada viraram 4.130 tokens reais.
    //   9097 / 4130 = 2,2027..., arredondado para 2,2
    //
    // Mudar este numero e ato deliberado, no commit que refaz a medicao: e o
    // mesmo contrato de `EXPECTED_TABLE_COUNT`. Se este teste reclamar sem voce
    // ter medido nada, alguem mexeu na regua sem refazer a conta.
    expect(CHARS_PER_TOKEN).toBe(2.2);
    expect(9097 / 4130).toBeCloseTo(2.2, 2);
  });

  it("a regua ANTIGA errava para baixo, e da para dizer quanto", () => {
    // 9.097 caracteres pela regua velha davam 2.274 tokens; pela nova, 4.135.
    // O real medido foi 4.130. A regua velha reportava cerca de 45% menos.
    const velha = 9097 / 4;
    const nova = 9097 / CHARS_PER_TOKEN;
    expect(Math.round(velha)).toBe(2274);
    expect(Math.round(nova)).toBe(4135);
    expect(Math.round(nova)).toBeGreaterThan(Math.round(velha));
    // A nova cai a menos de 1% do que a OpenAI mediu de fato.
    expect(Math.abs(nova - 4130) / 4130).toBeLessThan(0.01);
  });
});

describe("a conta do fallback, com numeros literais", () => {
  it("2.200 de entrada e 1.100 de saida dao 0,00045 no gpt-4o-mini", () => {
    // A conta, passo a passo:
    //   entrada: 2200 / 2,2 = 1000 tokens; 1000 / 1e6 * 0,15 = 0,00015
    //   saida:   1100 / 2,2 =  500 tokens;  500 / 1e6 * 0,60 = 0,00030
    //   total                                                = 0,00045
    expect(MODEL_PRICING[DEFAULT_MODEL].inputPerMillion).toBe(0.15);
    expect(MODEL_PRICING[DEFAULT_MODEL].outputPerMillion).toBe(0.6);
    expect(estimateCost(2200, 1100, DEFAULT_MODEL)).toBeCloseTo(0.00045, 12);
  });

  it("o fallback e exatamente a conta de tokens sobre os tokens estimados", () => {
    // Nao ha formula paralela: o fallback so converte chars em tokens e cai na
    // MESMA funcao de preco. Se alguem um dia duplicar a formula, isto quebra.
    //
    // `toBeCloseTo` e nao `toBe`, e o motivo e aritmetica de ponto flutuante,
    // nao folga de criterio: 2200 / 2,2 nao da 1000 exato em binario, da
    // 999,9999999999999. A regua calibrada nao e potencia de dois, entao a
    // igualdade bit a bit deixou de valer quando ela deixou de ser 4. Doze casas
    // decimais e muitas ordens de grandeza abaixo do centavo.
    expect(estimateCost(2200, 1100, DEFAULT_MODEL)).toBeCloseTo(
      estimateCostFromTokens(1000, 500, DEFAULT_MODEL),
      12,
    );
  });

  it("o texto medido de 9.097 caracteres dai 0,00062025 de entrada", () => {
    //   9097 / 2,2 = 4135 tokens; 4135 / 1e6 * 0,15 = 0,00062025
    expect(estimateCost(9097, 0, DEFAULT_MODEL)).toBeCloseTo(0.00062025, 12);
  });

  it("com a regua velha o MESMO texto sairia por menos da metade", () => {
    // O efeito no painel, em uma linha: a mesma chamada passa a reportar
    // aproximadamente 1,82 vez o custo que reportava antes (2,2 contra 4).
    const antes = estimateCostFromTokens(9097 / 4, 0, DEFAULT_MODEL);
    const agora = estimateCost(9097, 0, DEFAULT_MODEL);
    expect(agora / antes).toBeCloseTo(4 / 2.2, 10);
    expect(agora).toBeGreaterThan(antes);
  });
});

describe("o que a calibracao NAO toca", () => {
  it("os precos seguem intocados", () => {
    // Regra de ouro do lote: nenhum valor de preco muda. A conferencia humana
    // da tabela continua sendo backlog da Ana.
    expect(MODEL_PRICING["gpt-4o-mini"]).toEqual({
      inputPerMillion: 0.15,
      outputPerMillion: 0.6,
    });
    expect(MODEL_PRICING["gpt-4o"]).toEqual({
      inputPerMillion: 2.5,
      outputPerMillion: 10,
    });
  });

  it("o caminho por tokens medidos nem consulta a regua", () => {
    // Onde ha `usage`, a calibracao e irrelevante por construcao. E por isso que
    // migrar rotas para tokens (lote 3, commit 1) vale mais que calibrar: a
    // calibracao melhora a estimativa, os tokens a dispensam.
    const antes = estimateCostFromTokens(4130, 0, DEFAULT_MODEL);
    expect(antes).toBeCloseTo((4130 / 1e6) * 0.15, 12);
  });
});
