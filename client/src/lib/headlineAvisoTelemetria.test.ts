import { describe, expect, it } from "vitest";

import { payloadEnvio, payloadRevisao } from "./headlineAvisoTelemetria";

/**
 * O teste de `corrigiu_apos_aviso` e o motivo deste arquivo existir.
 *
 * Ele e a metrica que vai decidir se o aviso do passo de revisao serve ou nao.
 * Se estiver invertido, ou sempre falso, a conclusao vai ser "o aviso nao e
 * lido" quando o defeito e o instrumento. Nesta base isso ja aconteceu com o
 * `env -i`, com o blip de disponibilidade e com o `contarLinhas` devolvendo -1:
 * as tres vezes o instrumento respondeu com confianca sobre uma condicao que
 * nao existia. Uma metrica de produto sem teste e a mesma classe.
 */

const PERFIL_CORTADO = [
  "Contato",
  "www.linkedin.com/in/exemplo",
  "Principais competências",
  "Ciência da computação",
  "Joana Teste",
  "Consultor de Dados",
  "| ETL | Data Architecture | Analista de Dados",
  "São Paulo, Brasil",
  "Summary",
  "Analista com foco em dados, trabalhando com SQL e BI todos os dias.",
].join("\n");

const PERFIL_INTEIRO = [
  "Contato",
  "www.linkedin.com/in/exemplo",
  "Principais competências",
  "Ciência da computação",
  "Joana Teste",
  "Analista de Dados | Power BI | SQL",
  "São Paulo, Brasil",
  "Summary",
  "Analista com foco em dados, trabalhando com SQL e BI todos os dias.",
].join("\n");

describe("payloadRevisao", () => {
  it("marca cortada e nomeia a assinatura", () => {
    const p = payloadRevisao(PERFIL_CORTADO, "pdf");
    expect(p.cortada).toBe(true);
    expect(p.assinatura).toBe("inicio_pipe");
    expect(p.origem).toBe("pdf");
  });

  it("nao marca cortada em perfil com headline inteira", () => {
    const p = payloadRevisao(PERFIL_INTEIRO, "paste");
    expect(p.cortada).toBe(false);
    expect(p.assinatura).toBeNull();
    expect(p.origem).toBe("paste");
  });

  it("tolera texto vazio sem quebrar nem marcar cortada", () => {
    const p = payloadRevisao("   ", "paste");
    expect(p.cortada).toBe(false);
    expect(p.assinatura).toBeNull();
  });
});

describe("payloadEnvio: corrigiu_apos_aviso", () => {
  it("VERDADEIRO: viu o aviso e a headline no envio nao tem mais assinatura", () => {
    const p = payloadEnvio(true, "Analista de Dados | Power BI | SQL");
    expect(p.aviso_visto).toBe(true);
    expect(p.corrigiu_apos_aviso).toBe(true);
  });

  it("FALSO: viu o aviso e enviou assim mesmo", () => {
    const p = payloadEnvio(true, "| ETL | Data Architecture | Analista");
    expect(p.aviso_visto).toBe(true);
    expect(p.corrigiu_apos_aviso).toBe(false);
  });

  it("FALSO: nunca viu o aviso, mesmo com headline boa (nao ha o que corrigir)", () => {
    const p = payloadEnvio(false, "Analista de Dados | Power BI | SQL");
    expect(p.aviso_visto).toBe(false);
    expect(p.corrigiu_apos_aviso).toBe(false);
  });

  it("FALSO: nunca viu o aviso e a headline esta cortada", () => {
    // Caso possivel: a pessoa colou texto cortado sem passar pelo ponto de
    // captura. `corrigiu` continua falso, e nao "indefinido".
    const p = payloadEnvio(false, "| ETL | Data");
    expect(p.corrigiu_apos_aviso).toBe(false);
  });

  it("NAO esta invertido: os quatro cantos da tabela verdade", () => {
    // Guard direto contra o modo de falha que motivou o arquivo. Se alguem
    // trocar o `&&` por `||` ou negar a condicao, tres destes quebram.
    const boa = "Analista de Dados | SQL";
    const ruim = "| ETL | Data";
    expect(payloadEnvio(true, boa).corrigiu_apos_aviso).toBe(true);
    expect(payloadEnvio(true, ruim).corrigiu_apos_aviso).toBe(false);
    expect(payloadEnvio(false, boa).corrigiu_apos_aviso).toBe(false);
    expect(payloadEnvio(false, ruim).corrigiu_apos_aviso).toBe(false);
  });

  it("headline ausente no envio nao conta como correcao sem aviso", () => {
    expect(payloadEnvio(false, null).corrigiu_apos_aviso).toBe(false);
    // Com aviso visto e headline que sumiu, a assinatura nao existe: conta.
    // Registrado por ser contraintuitivo, e aceito: sem headline o aviso
    // tambem nao aparece mais, entao a pessoa mexeu no texto.
    expect(payloadEnvio(true, null).corrigiu_apos_aviso).toBe(true);
  });
});
