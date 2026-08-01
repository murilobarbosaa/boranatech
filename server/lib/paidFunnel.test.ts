import { describe, expect, it } from "vitest";

import {
  assinaturaChegouAValer,
  maiorVazamento,
  montarFunil,
} from "./paidFunnel";
import { SMALL_SAMPLE_THRESHOLD } from "../../shared/smallSample";

describe("assinaturaChegouAValer", () => {
  it("boleto emitido e NÃO pago não é conversão", () => {
    // Nasce sem período: o acesso só é gravado quando o pagamento confirma.
    expect(assinaturaChegouAValer({ current_period_start: null })).toBe(false);
  });

  it("boleto PAGO é conversão", () => {
    expect(
      assinaturaChegouAValer({ current_period_start: "2026-07-24T12:44:40Z" }),
    ).toBe(true);
  });

  it("assinatura cancelada que chegou a valer CONTINUA sendo conversão", () => {
    // Quem assinou dia 14 e cancelou dia 20 converteu. O card de assinantes
    // ativos não a conta, e está certo; o funil conta, e também está certo.
    expect(
      assinaturaChegouAValer({ current_period_start: "2026-07-14T10:00:00Z" }),
    ).toBe(true);
  });

  it("boleto que expirou SEM pagar não vira conversão ao virar 'canceled'", () => {
    // Os dois caminhos que produzem `canceled` existem: `expire-pending-boletos`
    // cancela o que nunca foi pago e `expirarBoletosVencidos` cancela o que foi
    // pago e acabou. Uma lista de status contaria o primeiro; o período não.
    expect(assinaturaChegouAValer({ current_period_start: null })).toBe(false);
  });
});

describe("montarFunil", () => {
  // Os números reais medidos em 2026-08-01, janela de 30 dias.
  const real = {
    visitantes: 13314,
    cadastros: 2802,
    checkouts: 134,
    pagantesComRastro: 49,
  };

  it("calcula a conversão de CADA passo, não só a total", () => {
    const passos = montarFunil(real);
    expect(passos).toHaveLength(4);
    expect(passos[0].conversionFromPrev).toBeNull();
    expect(passos[1].conversionFromPrev).toBeCloseTo(21.05, 1);
    expect(passos[2].conversionFromPrev).toBeCloseTo(4.78, 1);
    expect(passos[3].conversionFromPrev).toBeCloseTo(36.57, 1);
  });

  it("conta as pessoas perdidas em cada transição", () => {
    const passos = montarFunil(real);
    expect(passos[0].lostFromPrev).toBeNull();
    expect(passos[1].lostFromPrev).toBe(13314 - 2802);
    expect(passos[2].lostFromPrev).toBe(2802 - 134);
    expect(passos[3].lostFromPrev).toBe(134 - 49);
  });

  it("declara a fonte, e a última etapa declara que mudou de fonte", () => {
    const passos = montarFunil(real);
    expect(passos.map((p) => p.fonte)).toEqual([
      "posthog",
      "posthog",
      "posthog",
      "posthog+banco",
    ]);
  });

  it("NUNCA sobe: o último passo é subconjunto do anterior por construção", () => {
    // Se um dia entrar mais gente na última etapa do que iniciou checkout, o
    // funil estaria somando populações diferentes. A interseção impede, e este
    // teste trava a propriedade mesmo com entrada absurda.
    const passos = montarFunil({
      visitantes: 10,
      cadastros: 100,
      checkouts: 5,
      pagantesComRastro: 5,
    });
    // A entrada acima é impossível na rota (cadastros > visitantes), e ainda
    // assim a conversão não vira NaN nem infinito.
    for (const passo of passos.slice(1)) {
      expect(Number.isFinite(passo.conversionFromPrev!)).toBe(true);
    }
    expect(passos[3].people).toBeLessThanOrEqual(passos[2].people);
  });

  it("base zero devolve conversão NULA, nunca divisão por zero", () => {
    const passos = montarFunil({
      visitantes: 0,
      cadastros: 0,
      checkouts: 0,
      pagantesComRastro: 0,
    });
    for (const passo of passos.slice(1)) {
      expect(passo.conversionFromPrev).toBeNull();
      expect(passo.smallSample).toBe(true);
    }
  });

  it("marca amostra pequena pelo MESMO limiar da aba Conversão", () => {
    const passos = montarFunil({
      visitantes: 1000,
      cadastros: SMALL_SAMPLE_THRESHOLD - 1,
      checkouts: 5,
      pagantesComRastro: 2,
    });
    // A base do passo 2 (1000) é grande; a do passo 3 é 19, abaixo do limiar.
    expect(passos[1].smallSample).toBe(false);
    expect(passos[2].smallSample).toBe(true);
  });

  it("o limiar é de fronteira: exatamente no limite NÃO é amostra pequena", () => {
    const noLimite = montarFunil({
      visitantes: 1000,
      cadastros: SMALL_SAMPLE_THRESHOLD,
      checkouts: 5,
      pagantesComRastro: 1,
    });
    expect(noLimite[2].smallSample).toBe(false);
  });
});

describe("maiorVazamento", () => {
  it("aponta a transição de MENOR CONVERSÃO, não a de maior perda absoluta", () => {
    // Perda absoluta elegeria visitantes -> cadastros (10.512 pessoas). Mas 21%
    // ali é saudável, e 4,8% de cadastro para checkout é a anomalia.
    const pior = maiorVazamento(
      montarFunil({
        visitantes: 13314,
        cadastros: 2802,
        checkouts: 134,
        pagantesComRastro: 49,
      }),
    );
    expect(pior).not.toBeNull();
    expect(pior!.stepId).toBe("checkout");
    expect(pior!.fromLabel).toBe("Cadastros");
    expect(pior!.lost).toBe(2668);
  });

  it("elege o passo final quando é ele o pior", () => {
    const pior = maiorVazamento(
      montarFunil({
        visitantes: 1000,
        cadastros: 900,
        checkouts: 800,
        pagantesComRastro: 8,
      }),
    );
    expect(pior!.stepId).toBe("pagou");
  });

  it("IGNORA transição com amostra pequena: não manda agir sobre ruído", () => {
    // O passo final tem 0 de 3 (0%), o pior número da tabela, mas sobre uma base
    // de 3 pessoas. Elegê-lo mandaria a pessoa otimizar checkout por causa de
    // três visitas.
    const passos = montarFunil({
      visitantes: 1000,
      cadastros: 300,
      checkouts: 3,
      pagantesComRastro: 0,
    });
    const pior = maiorVazamento(passos);
    expect(passos[3].conversionFromPrev).toBe(0);
    expect(passos[3].smallSample).toBe(true);
    expect(pior!.stepId).not.toBe("pagou");
  });

  it("devolve null quando NENHUMA transição é confiável", () => {
    expect(
      maiorVazamento(
        montarFunil({
          visitantes: 5,
          cadastros: 4,
          checkouts: 3,
          pagantesComRastro: 1,
        }),
      ),
    ).toBeNull();
  });

  it("funil vazio não tem vazamento a apontar", () => {
    expect(maiorVazamento([])).toBeNull();
  });
});
