import { describe, expect, it } from "vitest";

import {
  classificarMotivo,
  decidirRecuperacao,
  DEBOUNCE_MS,
  EPISODIO_NOVO_MS,
  MAX_EPISODIOS,
  SEGUNDO_AVISO_MS,
  type FatosRecuperacao,
} from "./paymentRecovery";

const AGORA = 1_800_000_000_000;

function fatos(over: Partial<FatosRecuperacao> = {}): FatosRecuperacao {
  return {
    agoraMs: AGORA,
    // Fora do debounce por padrao, para cada teste mexer numa coisa so.
    ultimaTentativaMs: AGORA - DEBOUNCE_MS - 1,
    enviosAnteriores: [],
    converteu: false,
    suprimido: false,
    emailValido: true,
    ...over,
  };
}

describe("decidirRecuperacao", () => {
  it("manda o primeiro aviso quando o debounce passou e nunca houve envio", () => {
    expect(decidirRecuperacao(fatos())).toEqual({ enviar: true, stage: 1, episodio: 1 });
  });

  it("nao manda enquanto a pessoa ainda esta tentando (debounce)", () => {
    const d = decidirRecuperacao(fatos({ ultimaTentativaMs: AGORA - 60_000 }));
    expect(d).toEqual({ enviar: false, motivo: "debounce" });
  });

  it("no limite exato do debounce ja manda", () => {
    const d = decidirRecuperacao(
      fatos({ ultimaTentativaMs: AGORA - DEBOUNCE_MS }),
    );
    expect(d).toEqual({ enviar: true, stage: 1, episodio: 1 });
  });

  // O caso que motivou a regua: 10 tentativas em ~1h tem que render UM e-mail.
  it("dez tentativas em uma hora rendem um unico envio", () => {
    const tentativas = Array.from({ length: 10 }, (_, i) => AGORA - i * 6 * 60_000);
    const maisRecente = Math.max(...tentativas);
    // Enquanto a ultima tentativa esta dentro do debounce, nada sai.
    expect(decidirRecuperacao(fatos({ ultimaTentativaMs: maisRecente }))).toEqual({
      enviar: false,
      motivo: "debounce",
    });
    // Passado o silencio, sai o stage 1...
    const depois = fatos({
      agoraMs: maisRecente + DEBOUNCE_MS,
      ultimaTentativaMs: maisRecente,
    });
    expect(decidirRecuperacao(depois)).toEqual({ enviar: true, stage: 1, episodio: 1 });
    // ...e o segundo e barrado pelo teto de 72h.
    expect(
      decidirRecuperacao({
        ...depois,
        enviosAnteriores: [{ stage: 1, sentAtMs: maisRecente + DEBOUNCE_MS, episodio: 1 }],
      }),
    ).toEqual({ enviar: false, motivo: "teto_72h" });
  });

  it("segura o segundo aviso antes de 72h e libera depois", () => {
    const stage1 = { stage: 1, sentAtMs: AGORA - SEGUNDO_AVISO_MS + 1000, episodio: 1 };
    expect(decidirRecuperacao(fatos({ enviosAnteriores: [stage1] }))).toEqual({
      enviar: false,
      motivo: "teto_72h",
    });
    expect(
      decidirRecuperacao(
        fatos({ enviosAnteriores: [{ stage: 1, sentAtMs: AGORA - SEGUNDO_AVISO_MS, episodio: 1 }] }),
      ),
    ).toEqual({ enviar: true, stage: 2, episodio: 1 });
  });

  it("para de vez depois do segundo aviso", () => {
    const d = decidirRecuperacao(
      fatos({
        enviosAnteriores: [
          { stage: 1, sentAtMs: AGORA - 10 * SEGUNDO_AVISO_MS, episodio: 1 },
          { stage: 2, sentAtMs: AGORA - 5 * SEGUNDO_AVISO_MS, episodio: 1 },
        ],
      }),
    );
    expect(d).toEqual({ enviar: false, motivo: "episodio_encerrado" });
  });

  it("reabre no stage 1 do episodio 2 quando a tentativa nova esta muito depois", () => {
    const ultimoEnvio = AGORA - EPISODIO_NOVO_MS - DEBOUNCE_MS - 10;
    const d = decidirRecuperacao(
      fatos({
        ultimaTentativaMs: AGORA - DEBOUNCE_MS,
        enviosAnteriores: [{ stage: 2, sentAtMs: ultimoEnvio, episodio: 1 }],
      }),
    );
    // episodio 2, nao 1: e isto que a UNIQUE (email, episodio, stage) permite
    // representar e a UNIQUE (email, stage) tornava impossivel.
    expect(d).toEqual({ enviar: true, stage: 1, episodio: 2 });
  });

  it("o segundo aviso do episodio 2 fica no episodio 2", () => {
    const abriu = AGORA - SEGUNDO_AVISO_MS;
    const d = decidirRecuperacao(
      fatos({
        enviosAnteriores: [
          { stage: 1, sentAtMs: AGORA - 10 * EPISODIO_NOVO_MS, episodio: 1 },
          { stage: 2, sentAtMs: AGORA - 9 * EPISODIO_NOVO_MS, episodio: 1 },
          { stage: 1, sentAtMs: abriu, episodio: 2 },
        ],
      }),
    );
    expect(d).toEqual({ enviar: true, stage: 2, episodio: 2 });
  });

  it("para de vez no teto de MAX_EPISODIOS", () => {
    const ultimoEnvio = AGORA - EPISODIO_NOVO_MS - DEBOUNCE_MS - 10;
    const d = decidirRecuperacao(
      fatos({
        ultimaTentativaMs: AGORA - DEBOUNCE_MS,
        enviosAnteriores: [{ stage: 2, sentAtMs: ultimoEnvio, episodio: MAX_EPISODIOS }],
      }),
    );
    expect(d).toEqual({ enviar: false, motivo: "teto_de_episodios" });
  });

  it("usa o episodio de MAIOR numero, nao o mais recente por data", () => {
    // Reprocesso fora de ordem: uma linha antiga do episodio 1 chega depois.
    const d = decidirRecuperacao(
      fatos({
        enviosAnteriores: [
          { stage: 1, sentAtMs: AGORA - 1000, episodio: 1 },
          { stage: 1, sentAtMs: AGORA - SEGUNDO_AVISO_MS, episodio: 2 },
        ],
      }),
    );
    // Se olhasse a data, veria o episodio 1 e devolveria stage 2 do episodio 1.
    expect(d).toEqual({ enviar: true, stage: 2, episodio: 2 });
  });

  // As razoes absolutas precedem as de tempo, para o log dizer a causa real.
  it.each([
    ["converteu", { converteu: true }],
    ["suprimido", { suprimido: true }],
    ["email_invalido", { emailValido: false }],
  ])("nunca manda quando %s, mesmo fora do debounce", (motivo, over) => {
    expect(decidirRecuperacao(fatos(over))).toEqual({ enviar: false, motivo });
  });

  it("email invalido ganha de suprimido e de convertido no motivo reportado", () => {
    const d = decidirRecuperacao(
      fatos({ emailValido: false, suprimido: true, converteu: true }),
    );
    expect(d).toEqual({ enviar: false, motivo: "email_invalido" });
  });

  it("nao manda para quem converteu mesmo com envio anterior elegivel", () => {
    const d = decidirRecuperacao(
      fatos({
        converteu: true,
        enviosAnteriores: [{ stage: 1, sentAtMs: AGORA - SEGUNDO_AVISO_MS, episodio: 1 }],
      }),
    );
    expect(d).toEqual({ enviar: false, motivo: "converteu" });
  });
});

describe("classificarMotivo", () => {
  // Os valores vem da conta real (medidos em 2026-07-28), nao inventados.
  it("blocked ganha de qualquer outro sinal", () => {
    expect(
      classificarMotivo({
        outcomeType: "blocked",
        outcomeReason: "highest_risk_level",
        adviceCode: "try_again_later",
      }),
    ).toBe("blocked");
  });

  it("reconhece saldo insuficiente", () => {
    expect(
      classificarMotivo({
        outcomeType: "issuer_declined",
        outcomeReason: "insufficient_funds",
        adviceCode: "try_again_later",
      }),
    ).toBe("insufficient_funds");
  });

  it("reconhece dado incorreto pelo outcome e pelo failure_code", () => {
    expect(
      classificarMotivo({ outcomeType: "invalid", outcomeReason: "incorrect_number" }),
    ).toBe("dados_incorretos");
    expect(classificarMotivo({ failureCode: "expired_card" })).toBe(
      "dados_incorretos",
    );
  });

  it("reconhece recusa temporaria pelo advice_code", () => {
    expect(
      classificarMotivo({
        outcomeType: "issuer_declined",
        outcomeReason: "try_again_later",
      }),
    ).toBe("try_again_later");
  });

  it("cai em 'outro' no que nao reconhece, em vez de chutar", () => {
    expect(
      classificarMotivo({ outcomeType: "issuer_declined", outcomeReason: "generic_decline" }),
    ).toBe("outro");
    expect(classificarMotivo({})).toBe("outro");
  });
});
