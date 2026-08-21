import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  EXPECTED_EVENTS,
  HANDLED_EVENTS,
  UNHANDLED_ON_PURPOSE,
} from "../../scripts/stripeWebhookEvents.data.mjs";

/**
 * A lista de eventos do script E o switch de handleWebhook precisam dizer a
 * mesma coisa. O script afirma ser a fonte de verdade dos eventos assinados, e
 * uma fonte de verdade que nao e verificada volta a divergir: foi o que
 * aconteceu com charge.failed e payment_intent.payment_failed.
 *
 * O script verifica a lista contra o ENDPOINT (precisa de rede e chave). Este
 * teste verifica a lista contra o CODIGO, e roda no CI sem segredo nenhum.
 *
 * A extracao abaixo e um parser, ou seja, a classe de instrumento que este
 * projeto documenta como a que falha PASSANDO. A contramedida e a de sempre:
 * afirmar o TOTAL, nao a pertinencia. O teste conta os `case` dentro do switch
 * e compara com o tamanho da lista, entao um case novo que o parser lesse mal
 * derruba a contagem em vez de passar despercebido.
 */

const FONTE = readFileSync(new URL("./stripe.ts", import.meta.url), "utf8");

/** Recorta SO o switch de handleWebhook, do `switch (event.type)` ate o `default:`. */
function switchDeHandleWebhook(): string {
  // Ancora na FUNCAO, nao no primeiro `switch (event.type)` do arquivo: existem
  // outros switches sobre event.type (extractSubscriptionId, por exemplo), e a
  // primeira versao deste parser pegou um deles e leu 5 cases em vez de 11. A
  // asserção de TOTAL abaixo foi o que acusou; sem ela o teste teria passado
  // afirmando uma lista menor.
  const funcao = FONTE.indexOf("async function handleWebhook(");
  expect(funcao, "handleWebhook nao encontrada em stripe.ts").toBeGreaterThan(
    -1,
  );
  const ini = FONTE.indexOf("switch (event.type) {", funcao);
  expect(
    ini,
    "switch (event.type) nao encontrado em handleWebhook",
  ).toBeGreaterThan(-1);
  const fim = FONTE.indexOf("default:", ini);
  expect(fim, "default: do switch nao encontrado").toBeGreaterThan(ini);
  return FONTE.slice(ini, fim);
}

function casesDoSwitch(): string[] {
  const bloco = switchDeHandleWebhook();
  return Array.from(bloco.matchAll(/case\s+"([^"]+)":/g)).map((m) => m[1]);
}

describe("eventos do webhook: script e switch dizem a mesma coisa", () => {
  it("o switch trata EXATAMENTE os eventos de HANDLED_EVENTS", () => {
    const cases = casesDoSwitch();
    // Total, nos dois sentidos, antes de comparar conjunto: se o parser
    // sub-casar, a contagem cai aqui.
    expect(cases.length).toBe(HANDLED_EVENTS.length);
    expect([...cases].sort()).toEqual([...HANDLED_EVENTS].sort());
  });

  it("o recorte do switch é o certo: pega o primeiro case e para no default", () => {
    // Trava do próprio parser. Sem isto, um recorte que pegasse o arquivo
    // inteiro (ou nada) ainda poderia coincidir com a lista por acaso.
    const bloco = switchDeHandleWebhook();
    expect(bloco).toContain('case "checkout.session.completed":');
    expect(bloco).not.toContain("default:");
    expect(bloco.length).toBeLessThan(FONTE.length);
  });

  it("nenhum evento está nas duas listas ao mesmo tempo", () => {
    const naoTratados = Object.keys(UNHANDLED_ON_PURPOSE);
    const intersecao = naoTratados.filter((e) => HANDLED_EVENTS.includes(e));
    expect(intersecao).toEqual([]);
  });

  it("todo evento sem handler tem MOTIVO escrito", () => {
    for (const [evento, motivo] of Object.entries(UNHANDLED_ON_PURPOSE)) {
      expect(typeof motivo, evento).toBe("string");
      expect(motivo.trim().length, evento).toBeGreaterThan(10);
    }
  });

  it("EXPECTED_EVENTS é a soma das duas, sem duplicata", () => {
    expect(EXPECTED_EVENTS.length).toBe(
      HANDLED_EVENTS.length + Object.keys(UNHANDLED_ON_PURPOSE).length,
    );
    expect(new Set(EXPECTED_EVENTS).size).toBe(EXPECTED_EVENTS.length);
  });
});
